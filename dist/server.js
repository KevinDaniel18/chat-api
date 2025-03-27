"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app = require("./app");
const http_1 = __importDefault(require("http"));
const socketService_1 = require("./services/socketService");
const server = http_1.default.createServer(app);
(0, socketService_1.socketService)(server);
const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
