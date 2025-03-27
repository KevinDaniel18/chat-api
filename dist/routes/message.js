"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messageController_1 = require("../controllers/messageController");
const router = (0, express_1.Router)();
router.post("/send", messageController_1.sendMessage);
router.post("/delete-message-for-user", messageController_1.deleteMessageForUser);
router.get("/:senderId/:receiverId", messageController_1.getMessages);
exports.default = router;
