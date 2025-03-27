import { Router } from "express";
import {
  getMessages,
  sendMessage,
  deleteMessageForUser,
} from "../controllers/messageController";

const router = Router();

router.post("/send", sendMessage);
router.post("/delete-message-for-user", deleteMessageForUser);
router.get("/:senderId/:receiverId", getMessages);

export default router;
