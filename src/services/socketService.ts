import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import prisma from "../prisma";
import sendPushNotification from "./notificationService";

export let io: Server;

const haveUsersInteracted = async (user1Id: any, user2Id: any) => {
  const interaction = await prisma.message.findFirst({
    where: {
      OR: [
        {
          AND: [{ senderId: user1Id }, { receiverId: user2Id }],
        },
        {
          AND: [{ senderId: user2Id }, { receiverId: user1Id }],
        },
      ],
    },
  });
  return !!interaction;
};

const getPendingMessagesCount = async (userId: any) => {
  return await prisma.message.count({
    where: {
      receiverId: Number(userId),
      isPending: true,
      NOT: { senderId: Number(userId) },
    },
  });
};

export const socketService = (server: HttpServer) => {
  io = new Server(server);

  io.on("connection", (socket) => {
    console.log("Un usuario se conectó:", socket.id);

    socket.on("joinUser", async ({ userId }) => {
      socket.join(userId.toString());
      const pendingCount = await getPendingMessagesCount(userId);
      socket.emit("pendingMessages", { count: pendingCount });
      console.log("count", pendingCount);
    });

    const createRoomId = (senderId: number, receiverId: number) => {
      return senderId < receiverId
        ? `${senderId}-${receiverId}`
        : `${receiverId}-${senderId}`;
    };

    const updatePendingMessages = async (userId: { toString: () => any }) => {
      const pendingCount = await getPendingMessagesCount(userId);
      io.to(userId.toString()).emit("pendingMessages", { count: pendingCount });
    };

    // Unirse a un room cuando el usuario se conecta
    socket.on("joinRoom", ({ senderId, receiverId }) => {
      const roomId = createRoomId(senderId, receiverId);
      socket.join(roomId);
    });

    socket.on(
      "sendMessage",
      async ({ senderId, receiverId, content, files }) => {
        console.log("Evento 'sendMessage' recibido:", {
          senderId,
          receiverId,
          content,
          files,
        });
        try {
          const fileUrls = files || [];

          // Guardar el mensaje en la base de datos
          const hasInteracted = await haveUsersInteracted(senderId, receiverId);
          const newMessage = await prisma.message.create({
            data: {
              content: content || undefined,
              senderId,
              receiverId,
              isPending: !hasInteracted,
              isInteracted: true,
              fileUrls,
            },
          });

          await updatePendingMessages(receiverId);

          const roomId = createRoomId(senderId, receiverId);
          io.to(roomId).emit("receiveMessage", newMessage);

          socket.emit("messageSent", newMessage);

          const receiver = await prisma.user.findUnique({
            where: { id: receiverId },
            select: { notificationToken: true },
          });

          if (receiver?.notificationToken) {
            const sender = await prisma.user.findUnique({
              where: { id: senderId },
              select: { name: true },
            });

            const title = `${sender?.name || "un usuario"}`;
            const manyFiles =
              fileUrls.length === 1 ? "sent a file" : "sent files";

            const body = content ? content : manyFiles;
            const data = {
              senderId,
              receiverId,
              userName: sender?.name,
              isPending: !hasInteracted,
            };
            await sendPushNotification(
              receiver.notificationToken,
              title,
              body,
              data
            );
          }

          socket.on("likeReceived", ({ likerId, likedId }) => {
            const roomId = createRoomId(likerId, likedId);
            io.to(roomId).emit("receiveLike", { likerId, likedId });
          });
        } catch (error) {
          console.error("Error al guardar y enviar el mensaje:", error);
        }
      }
    );

    socket.on("enterChat", async ({ userId, receiverId }) => {
      try {
        await prisma.message.updateMany({
          where: {
            senderId: Number(receiverId),
            receiverId: Number(userId),
            isPending: true,
          },
          data: { isPending: false },
        });

        const hasInteracted = await haveUsersInteracted(userId, receiverId);

        if (!hasInteracted) {
          await prisma.message.create({
            data: {
              senderId: userId,
              receiverId: receiverId,
              isPending: false,
              isInteracted: true,
            },
          });
        }

        await updatePendingMessages(userId);
      } catch (error) {
        console.error("Error al actualizar mensajes pendientes:", error);
      }
    });

    socket.on("deleteMessage", async (messageId, senderId, receiverId) => {
      try {
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { senderId: true, receiverId: true },
        });

        if (!message) {
          return socket.emit("error", { message: "Mensaje no encontrado" });
        }

        await prisma.message.delete({ where: { id: messageId } });

        const roomId = createRoomId(senderId, receiverId);
        io.to(roomId).emit("messageDeleted", messageId);

        // Actualiza los mensajes pendientes del receptor
        await updatePendingMessages(receiverId);

        await updatePendingMessages(senderId);

        console.log(`Mensaje ${messageId} eliminado exitosamente`);
      } catch (error) {
        console.error("Error al eliminar el mensaje:", error);
        socket.emit("error", { message: "No se pudo eliminar el mensaje" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Un usuario se desconectó:", socket.id);
    });
  });
};
