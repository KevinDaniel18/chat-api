"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updatedUser = exports.getUsersWithPendingMessages = exports.getUsersSentMessages = exports.deleteProfilePicture = exports.getUsersWhoLiked = exports.getLikedUsers = exports.likeUser = exports.saveNotificationToken = exports.getAllUser = exports.getUserById = exports.updateProfilePicture = void 0;
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { io } = require("../services/socketService");
const sendPushNotification = require("../services/notificationService");
const bcrypt_1 = __importDefault(require("bcrypt"));
const updateProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, profilePicture } = req.body;
    if (!userId || !profilePicture) {
        res.status(400).json({ error: "userId y profilePicture son requeridos" });
        return;
    }
    try {
        const updatedUser = yield prisma.user.update({
            where: { id: parseInt(userId, 10) },
            data: { profilePicture },
        });
        res
            .status(200)
            .json({ message: "Imagen de perfil actualizada", user: updatedUser });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar la imagen de perfil" });
    }
});
exports.updateProfilePicture = updateProfilePicture;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ error: "El ID del usuario es requerido" });
        return;
    }
    try {
        const user = yield prisma.user.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!user) {
            res.status(404).json({ error: "Usuario no encontrado" });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener el usuario" });
    }
});
exports.getUserById = getUserById;
const getAllUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany();
        if (users.length === 0) {
            res.status(404).json({ error: "No se encontraron usuarios" });
            return;
        }
        res.status(200).json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener los usuarios" });
    }
});
exports.getAllUser = getAllUser;
const saveNotificationToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, notificationToken } = req.body;
    try {
        const updatedUser = yield prisma.user.update({
            where: { id: parseInt(userId, 10) },
            data: { notificationToken },
        });
        res.status(200).json({ message: "Token Guardado", user: updatedUser });
    }
    catch (error) {
        console.error(error);
    }
});
exports.saveNotificationToken = saveNotificationToken;
const likeUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existingLike = yield prisma.userLike.findFirst({
            where: {
                likerId: parseInt(likerId, 10),
                likedId: parseInt(likedId, 10),
            },
        });
        if (existingLike) {
            // Si ya existe, eliminar el like
            yield prisma.userLike.delete({
                where: { id: existingLike.id },
            });
            // Actualizar el contador de likes del usuario que recibió el like
            yield prisma.user.update({
                where: { id: parseInt(likedId, 10) },
                data: {
                    likes: { decrement: 1 },
                },
            });
            res.status(200).json({ message: "Like eliminado" });
        }
        // Crear un nuevo registro de like
        yield prisma.userLike.create({
            data: {
                likerId: parseInt(likerId, 10),
                likedId: parseInt(likedId, 10),
            },
        });
        // Incrementar el contador de likes del usuario que recibió el like
        yield prisma.user.update({
            where: { id: parseInt(likedId, 10) },
            data: {
                likes: { increment: 1 },
            },
        });
        const likedUser = yield prisma.user.findUnique({
            where: { id: parseInt(likedId, 10) },
            select: { notificationToken: true, name: true },
        });
        const likerUser = yield prisma.user.findUnique({
            where: { id: parseInt(likerId, 10) },
            select: { name: true },
        });
        if (likedUser === null || likedUser === void 0 ? void 0 : likedUser.notificationToken) {
            const title = `¡Tienes un nuevo like!`;
            const body = `${likerUser.name} te dio un like.`;
            const data = { likerId, likedId, userName: likedUser.name };
            yield sendPushNotification(likedUser.notificationToken, title, body, data);
        }
        if (io) {
            io.emit("likeReceived", { likerId, likedId });
        }
        res.status(200).json({ message: "Like agregado y notificado" });
    }
    catch (error) {
        console.error("Error al manejar el like:", error);
        res.status(500).json({ error: "Error al manejar el like" });
    }
});
exports.likeUser = likeUser;
const getLikedUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.query;
    try {
        const likedUsers = yield prisma.userLike.findMany({
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
        res.status(200).json(likedUsers.map(({ liked }) => liked));
    }
    catch (error) {
        console.error("Error al obtener los likes:", error);
        res.status(500).json({ error: "Error al obtener los likes" });
    }
});
exports.getLikedUsers = getLikedUsers;
const getUsersWhoLiked = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.query;
    try {
        const usersWhoLiked = yield prisma.userLike.findMany({
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
        res.status(200).json(usersWhoLiked.map(({ liker }) => liker));
    }
    catch (error) {
        console.error("Error al obtener los usuarios que dieron like:", error);
        res.status(500).json({ error: "Error al obtener los likes recibidos" });
    }
});
exports.getUsersWhoLiked = getUsersWhoLiked;
const deleteProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    if (!userId) {
        res.status(400).json({ error: "userId es requerido" });
        return;
    }
    try {
        const updatedUser = yield prisma.user.update({
            where: { id: parseInt(userId, 10) },
            data: { profilePicture: null },
        });
        res
            .status(200)
            .json({ message: "Imagen de perfil eliminada", user: updatedUser });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar la imagen de perfil" });
    }
});
exports.deleteProfilePicture = deleteProfilePicture;
const getUsersSentMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.query;
    if (!userId) {
        res.status(400).json({ error: "El ID del usuario es requerido" });
        return;
    }
    try {
        const messages = yield prisma.message.findMany({
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
            ...new Set(messages.flatMap((msg) => [
                msg.senderId,
                msg.receiverId,
            ])),
        ].filter((id) => id !== Number(userId)); // Excluir el propio ID
        const users = yield prisma.user.findMany({
            where: { id: { in: userIds } },
        });
        res.status(200).json(users);
    }
    catch (error) {
        console.error("Error al obtener los usuarios con los que se ha interactuado:", error);
        res.status(500).json({ error: "Error al obtener los usuarios" });
    }
});
exports.getUsersSentMessages = getUsersSentMessages;
const getUsersWithPendingMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.query;
    if (!userId) {
        res.status(400).json({ error: "El ID del usuario es requerido" });
        return;
    }
    try {
        // Obtenemos los mensajes recibidos que están marcados como pendientes
        const receivedMessages = yield prisma.message.findMany({
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
            ...new Set(receivedMessages.map((message) => message.senderId)),
        ];
        const users = yield prisma.user.findMany({
            where: { id: { in: senderIds } },
        });
        res.status(200).json({
            users,
            firstPendingMessage: firstMessage,
        });
    }
    catch (error) {
        console.error("Error al obtener los usuarios con mensajes pendientes:", error);
        res
            .status(500)
            .json({ error: "Error al obtener los usuarios con mensajes pendientes" });
    }
});
exports.getUsersWithPendingMessages = getUsersWithPendingMessages;
const updatedUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = req.body, { userId } = _a, updates = __rest(_a, ["userId"]);
    try {
        const updatedUser = yield prisma.user.update({
            where: { id: Number(userId) },
            data: updates,
        });
        const updatedFields = Object.keys(updates);
        res.status(200).json({
            message: "User updated successfully",
            user: updatedUser,
            updatedFields: updatedFields,
        });
    }
    catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ error: "An error occurred while updating the user" });
    }
});
exports.updatedUser = updatedUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { password, isBiometric } = req.body;
    try {
        const user = yield prisma.user.findUnique({
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
            const isMatch = yield bcrypt_1.default.compare(password, user.password);
            if (!isMatch) {
                res.status(401).json({ message: "Incorrect password" });
                return;
            }
        }
        yield prisma.user.delete({ where: { id: Number(userId) } });
        res.status(200).json({ message: "User deleted successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.deleteUser = deleteUser;
