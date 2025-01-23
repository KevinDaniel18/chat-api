const express = require("express");
const router = express.Router();
const {
  getMessages,
  sendMessage,
  deleteMessageForUser
} = require("../controllers/messageController");

router.post("/send", sendMessage);
router.post("/delete-message-for-user", deleteMessageForUser)
router.get("/:senderId/:receiverId", getMessages);

module.exports = router;
