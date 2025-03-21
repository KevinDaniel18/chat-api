const prisma = require("../prisma");
exports.getMessages = async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: Number(senderId), receiverId: Number(receiverId) },
          { senderId: Number(receiverId), receiverId: Number(senderId) },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "No se pudieron obtener los mensajes" });
  }
};

// Ruta para enviar un mensaje de forma tradicional (sin WebSockets)
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  console.log("Datos recibidos:", { senderId, receiverId, content });
  try {
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
      },
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "No se pudo guardar el mensaje" });
  }
};

exports.deleteMessageForUser = async (req, res) => {
  const { userId, receiverId } = req.body;

  try {
    await prisma.message.updateMany({
      where: {
        senderId: Number(userId),
        receiverId: Number(receiverId),
        NOT: {
          deletedForUserIds: {
            has: userId,
          },
        },
      },
      data: {
        deletedForUserIds: {
          push: userId,
        },
      },
    });

    await prisma.message.updateMany({
      where: {
        senderId: receiverId,
        receiverId: userId,
        NOT: {
          deletedForUserIds: {
            has: userId,
          },
        },
      },
      data: {
        deletedForUserIds: {
          push: userId,
        },
      },
    });
    res.status(201).json({ message: "Messages deleted successfully" });
  } catch (error) {
    console.error("Error al eliminar mensajes:", error);
  }
};

