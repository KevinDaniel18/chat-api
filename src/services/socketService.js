const { Server } = require("socket.io");
const prisma = require("../prisma");
const sendPushNotification = require("./notificationService");

let io;

const socketService = (server) => {
  io = new Server(server);

  io.on("connection", (socket) => {
    console.log("Un usuario se conectó:", socket.id);

    // Función para crear un room único entre dos usuarios
    const createRoomId = (senderId, receiverId) => {
      return senderId < receiverId
        ? `${senderId}-${receiverId}`
        : `${receiverId}-${senderId}`;
    };

    // Unirse a un room cuando el usuario se conecta
    socket.on("joinRoom", ({ senderId, receiverId }) => {
      const roomId = createRoomId(senderId, receiverId);
      socket.join(roomId);
      console.log(`${socket.id} se unió al room: ${roomId}`);
    });

    socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
      //console.log("Evento 'sendMessage' recibido:", { senderId, receiverId, content });
      try {
        // Guardar el mensaje en la base de datos
        const newMessage = await prisma.message.create({
          data: {
            content,
            senderId,
            receiverId,
          },
        });

        // Emitir el mensaje solo a los usuarios en el room correspondiente
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
          console.log(data);
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

    socket.on("disconnect", () => {
      console.log("Un usuario se desconectó:", socket.id);
    });
  });
};

module.exports = { socketService, io };
