const { Server } = require("socket.io");
const prisma = require("../prisma");
const sendPushNotification = require("./notificationService");

let io;

const haveUsersInteracted = async (user1Id, user2Id) => {
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

const getPendingMessagesCount = async (userId) => {
  return await prisma.message.count({
    where: {
      receiverId: userId,
      isPending: true,
      NOT: { senderId: userId },
    },
  });
};

const socketService = (server) => {
  io = new Server(server);

  io.on("connection", (socket) => {
    console.log("Un usuario se conectó:", socket.id);

    socket.on("joinUser", async ({ userId }) => {
      socket.join(userId.toString());
      const pendingCount = await getPendingMessagesCount(userId);
      socket.emit("pendingMessages", { count: pendingCount });
      console.log("count", pendingCount);
    });

    const createRoomId = (senderId, receiverId) => {
      return senderId < receiverId
        ? `${senderId}-${receiverId}`
        : `${receiverId}-${senderId}`;
    };

    const updatePendingMessages = async (userId) => {
      const pendingCount = await getPendingMessagesCount(userId);
      io.to(userId.toString()).emit("pendingMessages", { count: pendingCount });
    };

    // Unirse a un room cuando el usuario se conecta
    socket.on("joinRoom", ({ senderId, receiverId }) => {
      const roomId = createRoomId(senderId, receiverId);
      socket.join(roomId);
    });

    socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
      //console.log("Evento 'sendMessage' recibido:", { senderId, receiverId, content });
      try {
        // Guardar el mensaje en la base de datos
        const hasInteracted = await haveUsersInteracted(senderId, receiverId);
        const newMessage = await prisma.message.create({
          data: {
            content,
            senderId,
            receiverId,
            isPending: !hasInteracted,
            isInteracted: true,
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
          const body = content;
          const data = { senderId, receiverId, userName: sender.name };
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
    });

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

        await updatePendingMessages(userId);
      } catch (error) {
        console.error("Error al actualizar mensajes pendientes:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Un usuario se desconectó:", socket.id);
    });
  });
};

module.exports = { socketService, io };
