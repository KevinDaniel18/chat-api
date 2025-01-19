const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { io } = require("../services/socketService");
const sendPushNotification = require("../services/notificationService");

/**
 * Actualiza la URI de la imagen de perfil de un usuario
 * @param {Request} req
 * @param {Response} res
 */
const updateProfilePicture = async (req, res) => {
  const { userId, profilePicture } = req.body;

  if (!userId || !profilePicture) {
    return res
      .status(400)
      .json({ error: "userId y profilePicture son requeridos" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { profilePicture },
    });
    return res
      .status(200)
      .json({ message: "Imagen de perfil actualizada", user: updatedUser });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error al actualizar la imagen de perfil" });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "El ID del usuario es requerido" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener el usuario" });
  }
};

const getAllUser = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      return res.status(404).json({ error: "No se encontraron usuarios" });
    }

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener los usuarios" });
  }
};

const saveNotificationToken = async (req, res) => {
  const { userId, notificationToken } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { notificationToken },
    });
    return res
      .status(200)
      .json({ message: "Token Guardado", user: updatedUser });
  } catch (error) {
    console.error(error);
  }
};

const likeUser = async (req, res) => {
  const { likerId, likedId } = req.body;

  if (!likerId || !likedId) {
    return res.status(400).json({ error: "likerId y likedId son requeridos" });
  }

  if (likerId === likedId) {
    return res
      .status(400)
      .json({ error: "Un usuario no puede darse like a sí mismo" });
  }

  try {
    // Verificar si ya existe un like entre los usuarios
    const existingLike = await prisma.userLike.findFirst({
      where: {
        likerId: parseInt(likerId, 10),
        likedId: parseInt(likedId, 10),
      },
    });

    if (existingLike) {
      // Si ya existe, eliminar el like
      await prisma.userLike.delete({
        where: { id: existingLike.id },
      });

      // Actualizar el contador de likes del usuario que recibió el like
      await prisma.user.update({
        where: { id: parseInt(likedId, 10) },
        data: {
          likes: { decrement: 1 },
        },
      });

      return res.status(200).json({ message: "Like eliminado" });
    }

    // Crear un nuevo registro de like
    await prisma.userLike.create({
      data: {
        likerId: parseInt(likerId, 10),
        likedId: parseInt(likedId, 10),
      },
    });

    // Incrementar el contador de likes del usuario que recibió el like
    await prisma.user.update({
      where: { id: parseInt(likedId, 10) },
      data: {
        likes: { increment: 1 },
      },
    });

    const likedUser = await prisma.user.findUnique({
      where: { id: parseInt(likedId, 10) },
      select: { notificationToken: true, name: true },
    });

    const likerUser = await prisma.user.findUnique({
      where: { id: parseInt(likerId, 10) },
      select: { name: true },
    });

    if (likedUser?.notificationToken) {
      const title = `¡Tienes un nuevo like!`;
      const body = `${likerUser.name} te dio un like.`;
      const data = { likerId, likedId, userName: likedUser.name };

      await sendPushNotification(
        likedUser.notificationToken,
        title,
        body,
        data
      );
    }

    if (io) {
      io.emit("likeReceived", { likerId, likedId });
    }

    return res.status(200).json({ message: "Like agregado y notificado" });
  } catch (error) {
    console.error("Error al manejar el like:", error);
    return res.status(500).json({ error: "Error al manejar el like" });
  }
};

const getLikedUsers = async (req, res) => {
  const { userId } = req.query;
  console.log("userId", userId);
  try {
    const likedUsers = await prisma.userLike.findMany({
      where: { likerId: parseInt(userId, 10) },
      select: { likedId: true },
    });
    return res.status(200).json(likedUsers.map((like) => like.likedId));
  } catch (error) {
    console.error("Error al obtener los likes:", error);
    return res.status(500).json({ error: "Error al obtener los likes" });
  }
};

const deleteProfilePicture = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId es requerido" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { profilePicture: null },
    });

    return res
      .status(200)
      .json({ message: "Imagen de perfil eliminada", user: updatedUser });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error al eliminar la imagen de perfil" });
  }
};

const getUsersSentMessages = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "El ID del usuario es requerido" });
  }

  try {
    const sentMessages = await prisma.message.findMany({
      where: { senderId: parseInt(userId, 10) },
      select: { receiverId: true },
    });

    if (sentMessages.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontraron mensajes enviados" });
    }

    const userIds = [
      ...new Set(sentMessages.map((message) => message.receiverId)),
    ];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error(
      "Error al obtener los usuarios a los que se les han enviado mensajes:",
      error
    );
    return res.status(500).json({ error: "Error al obtener los usuarios" });
  }
};

module.exports = {
  updateProfilePicture,
  getUserById,
  getAllUser,
  saveNotificationToken,
  likeUser,
  getLikedUsers,
  deleteProfilePicture,
  getUsersSentMessages
};
