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
exports.socketService = exports.io = void 0;
const socket_io_1 = require("socket.io");
const prisma_1 = __importDefault(require("../prisma"));
const notificationService_1 = __importDefault(require("./notificationService"));
const haveUsersInteracted = (user1Id, user2Id) => __awaiter(void 0, void 0, void 0, function* () {
    const interaction = yield prisma_1.default.message.findFirst({
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
});
const getPendingMessagesCount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.message.count({
        where: {
            receiverId: Number(userId),
            isPending: true,
            NOT: { senderId: Number(userId) },
        },
    });
});
const socketService = (server) => {
    exports.io = new socket_io_1.Server(server);
    exports.io.on("connection", (socket) => {
        console.log("Un usuario se conectó:", socket.id);
        socket.on("joinUser", (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId }) {
            socket.join(userId.toString());
            const pendingCount = yield getPendingMessagesCount(userId);
            socket.emit("pendingMessages", { count: pendingCount });
            console.log("count", pendingCount);
        }));
        const createRoomId = (senderId, receiverId) => {
            return senderId < receiverId
                ? `${senderId}-${receiverId}`
                : `${receiverId}-${senderId}`;
        };
        const updatePendingMessages = (userId) => __awaiter(void 0, void 0, void 0, function* () {
            const pendingCount = yield getPendingMessagesCount(userId);
            exports.io.to(userId.toString()).emit("pendingMessages", { count: pendingCount });
        });
        // Unirse a un room cuando el usuario se conecta
        socket.on("joinRoom", ({ senderId, receiverId }) => {
            const roomId = createRoomId(senderId, receiverId);
            socket.join(roomId);
        });
        socket.on("sendMessage", (_a) => __awaiter(void 0, [_a], void 0, function* ({ senderId, receiverId, content, files }) {
            console.log("Evento 'sendMessage' recibido:", {
                senderId,
                receiverId,
                content,
                files,
            });
            try {
                const fileUrls = files || [];
                // Guardar el mensaje en la base de datos
                const hasInteracted = yield haveUsersInteracted(senderId, receiverId);
                const newMessage = yield prisma_1.default.message.create({
                    data: {
                        content: content || undefined,
                        senderId,
                        receiverId,
                        isPending: !hasInteracted,
                        isInteracted: true,
                        fileUrls,
                    },
                });
                yield updatePendingMessages(receiverId);
                const roomId = createRoomId(senderId, receiverId);
                exports.io.to(roomId).emit("receiveMessage", newMessage);
                socket.emit("messageSent", newMessage);
                const receiver = yield prisma_1.default.user.findUnique({
                    where: { id: receiverId },
                    select: { notificationToken: true },
                });
                if (receiver === null || receiver === void 0 ? void 0 : receiver.notificationToken) {
                    const sender = yield prisma_1.default.user.findUnique({
                        where: { id: senderId },
                        select: { name: true },
                    });
                    const title = `${(sender === null || sender === void 0 ? void 0 : sender.name) || "un usuario"}`;
                    const manyFiles = fileUrls.length === 1 ? "sent a file" : "sent files";
                    const body = content ? content : manyFiles;
                    const data = {
                        senderId,
                        receiverId,
                        userName: sender === null || sender === void 0 ? void 0 : sender.name,
                        isPending: !hasInteracted,
                    };
                    yield (0, notificationService_1.default)(receiver.notificationToken, title, body, data);
                }
                socket.on("likeReceived", ({ likerId, likedId }) => {
                    const roomId = createRoomId(likerId, likedId);
                    exports.io.to(roomId).emit("receiveLike", { likerId, likedId });
                });
            }
            catch (error) {
                console.error("Error al guardar y enviar el mensaje:", error);
            }
        }));
        socket.on("enterChat", (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, receiverId }) {
            try {
                yield prisma_1.default.message.updateMany({
                    where: {
                        senderId: Number(receiverId),
                        receiverId: Number(userId),
                        isPending: true,
                    },
                    data: { isPending: false },
                });
                const hasInteracted = yield haveUsersInteracted(userId, receiverId);
                if (!hasInteracted) {
                    yield prisma_1.default.message.create({
                        data: {
                            senderId: userId,
                            receiverId: receiverId,
                            isPending: false,
                            isInteracted: true,
                        },
                    });
                }
                yield updatePendingMessages(userId);
            }
            catch (error) {
                console.error("Error al actualizar mensajes pendientes:", error);
            }
        }));
        socket.on("deleteMessage", (messageId, senderId, receiverId) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const message = yield prisma_1.default.message.findUnique({
                    where: { id: messageId },
                    select: { senderId: true, receiverId: true },
                });
                if (!message) {
                    return socket.emit("error", { message: "Mensaje no encontrado" });
                }
                yield prisma_1.default.message.delete({ where: { id: messageId } });
                const roomId = createRoomId(senderId, receiverId);
                exports.io.to(roomId).emit("messageDeleted", messageId);
                // Actualiza los mensajes pendientes del receptor
                yield updatePendingMessages(receiverId);
                yield updatePendingMessages(senderId);
                console.log(`Mensaje ${messageId} eliminado exitosamente`);
            }
            catch (error) {
                console.error("Error al eliminar el mensaje:", error);
                socket.emit("error", { message: "No se pudo eliminar el mensaje" });
            }
        }));
        socket.on("disconnect", () => {
            console.log("Un usuario se desconectó:", socket.id);
        });
    });
};
exports.socketService = socketService;
