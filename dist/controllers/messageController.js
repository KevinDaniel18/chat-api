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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessageForUser = exports.sendMessage = exports.getMessages = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, receiverId } = req.params;
    try {
        const messages = yield prisma_1.default.message.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: "No se pudieron obtener los mensajes" });
    }
});
exports.getMessages = getMessages;
// Ruta para enviar un mensaje de forma tradicional (sin WebSockets)
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, receiverId, content } = req.body;
    console.log("Datos recibidos:", { senderId, receiverId, content });
    try {
        const message = yield prisma_1.default.message.create({
            data: {
                content,
                senderId,
                receiverId,
            },
        });
        res.json(message);
    }
    catch (error) {
        res.status(500).json({ error: "No se pudo guardar el mensaje" });
    }
});
exports.sendMessage = sendMessage;
const deleteMessageForUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, receiverId } = req.body;
    try {
        yield prisma_1.default.message.updateMany({
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
        yield prisma_1.default.message.updateMany({
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
    }
    catch (error) {
        console.error("Error al eliminar mensajes:", error);
    }
});
exports.deleteMessageForUser = deleteMessageForUser;
