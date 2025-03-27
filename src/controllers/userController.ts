import { Response, Request } from "express";
import { PrismaClient } from "@prisma/client";
import { io } from "../services/socketService";
import sendPushNotification from "../services/notificationService";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const updateProfilePicture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, profilePicture } = req.body;

  if (!userId || !profilePicture) {
    res.status(400).json({ error: "userId y profilePicture son requeridos" });
    return;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { profilePicture },
    });
    res
      .status(200)
      .json({ message: "Imagen de perfil actualizada", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar la imagen de perfil" });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "El ID del usuario es requerido" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el usuario" });
  }
};

export const getAllUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      res.status(404).json({ error: "No se encontraron usuarios" });
      return;
    }

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
};

export const saveNotificationToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, notificationToken } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { notificationToken },
    });
    res.status(200).json({ message: "Token Guardado", user: updatedUser });
  } catch (error) {
    console.error(error);
  }
};

export const likeUser = async (req: Request, res: Response): Promise<void> => {
  const { likerId, likedId } = req.body;

  if (!likerId || !likedId) {
    res.status(400).json({ error: "likerId y likedId son requeridos" });
    return;
  }

  if (likerId === likedId) {
    res
      .status(400)
      .json({ error: "Un usuario no puede darse like a sí mismo" });
    return;
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

      res.status(200).json({ message: "Like eliminado" });
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
      const body = `${likerUser?.name} te dio un like.`;
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

    res.status(200).json({ message: "Like agregado y notificado" });
  } catch (error) {
    console.error("Error al manejar el like:", error);
    res.status(500).json({ error: "Error al manejar el like" });
  }
};

type LikedUser = {
  liked: {
    id: number;
    name: string;
    profilePicture: string | null;
    likes: number;
    about: string | null;
  };
};
export const getLikedUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query;

  try {
    const likedUsers = await prisma.userLike.findMany({
      where: { likerId: Number(userId) },
      select: {
        liked: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            likes: true,
            about: true,
          },
        },
      },
    });
    res.status(200).json(likedUsers.map(({ liked }: LikedUser) => liked));
  } catch (error) {
    console.error("Error al obtener los likes:", error);
    res.status(500).json({ error: "Error al obtener los likes" });
  }
};

type LikerUser = {
  liker: {
    id: number;
    name: string;
    profilePicture: string | null;
    likes: number;
    about: string | null;
  };
};

export const getUsersWhoLiked = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query;
  try {
    const usersWhoLiked = await prisma.userLike.findMany({
      where: { likedId: Number(userId) },
      select: {
        liker: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            likes: true,
            about: true,
          },
        },
      },
    });
    res.status(200).json(usersWhoLiked.map(({ liker }: LikerUser) => liker));
  } catch (error) {
    console.error("Error al obtener los usuarios que dieron like:", error);
    res.status(500).json({ error: "Error al obtener los likes recibidos" });
  }
};

export const deleteProfilePicture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ error: "userId es requerido" });
    return;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { profilePicture: null },
    });

    res
      .status(200)
      .json({ message: "Imagen de perfil eliminada", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la imagen de perfil" });
  }
};

export const getUsersSentMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query;

  if (!userId) {
    res.status(400).json({ error: "El ID del usuario es requerido" });
    return;
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: Number(userId), // Mensajes enviados
            isInteracted: true,
          },
          {
            receiverId: Number(userId), // Mensajes recibidos
            isPending: false, // Ya leídos
          },
        ],
      },
      select: { senderId: true, receiverId: true },
    });

    const userIds = [
      ...new Set(
        messages.flatMap((msg: { senderId: any; receiverId: any }) => [
          msg.senderId,
          msg.receiverId,
        ])
      ),
    ].filter((id) => id !== Number(userId)); // Excluir el propio ID

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error(
      "Error al obtener los usuarios con los que se ha interactuado:",
      error
    );
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
};

export const getUsersWithPendingMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query;

  if (!userId) {
    res.status(400).json({ error: "El ID del usuario es requerido" });
    return;
  }

  try {
    // Obtenemos los mensajes recibidos que están marcados como pendientes
    const receivedMessages = await prisma.message.findMany({
      where: {
        receiverId: Number(userId), // ID del receptor
        isPending: true, // Mensajes pendientes
        NOT: {
          senderId: Number(userId), // Evitar mensajes enviados por el mismo receptor
        },
        AND: {
          sender: {
            receivedMessages: {
              none: {
                senderId: Number(userId),
              },
            },
          },
        },
      },
      select: {
        id: true, // Agregamos id del mensaje
        content: true, // Agregamos contenido del mensaje
        createdAt: true, // Agregamos fecha de creación
        senderId: true, // Mantenemos el ID del remitente
        isPending: true, // Estado pendiente
        isInteracted: true, // Estado de interacción
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const firstMessage = receivedMessages[0] || null;

    // Obtenemos los usuarios que enviaron los mensajes pendientes
    const senderIds = [
      ...new Set(
        receivedMessages.map((message: { senderId: any }) => message.senderId)
      ),
    ];
    const users = await prisma.user.findMany({
      where: { id: { in: senderIds } },
    });
    res.status(200).json({
      users,
      firstPendingMessage: firstMessage,
    });
  } catch (error) {
    console.error(
      "Error al obtener los usuarios con mensajes pendientes:",
      error
    );
    res
      .status(500)
      .json({ error: "Error al obtener los usuarios con mensajes pendientes" });
  }
};

export const updatedUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, ...updates } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: updates,
    });

    const updatedFields = Object.keys(updates);
    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
      updatedFields: updatedFields,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the user" });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const { password, isBiometric } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!isBiometric) {
      if (!user.password) {
        res.status(400).json({ message: "No password set for this account" });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ message: "Incorrect password" });
        return;
      }
    }

    await prisma.user.delete({ where: { id: Number(userId) } });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
