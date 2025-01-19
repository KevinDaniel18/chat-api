const express = require("express");
const router = express.Router();
const {
  updateProfilePicture,
  getUserById,
  getAllUser,
  saveNotificationToken,
  likeUser,
  getLikedUsers,
  deleteProfilePicture,
  getUsersSentMessages
} = require("../controllers/userController");

router.get("/likedUser", getLikedUsers)
router.post("/like", likeUser);
router.post("/updateProfilePicture", updateProfilePicture);
router.post("/deleteProfilePicture", deleteProfilePicture);
router.patch("/token", saveNotificationToken);
router.get("/sent-messages", getUsersSentMessages)
router.get("/allUsers", getAllUser);
router.get("/:id", getUserById);
module.exports = router;
