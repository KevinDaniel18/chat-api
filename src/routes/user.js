const express = require("express");
const router = express.Router();
const {
  updateProfilePicture,
  getUserById,
  getAllUser,
  saveNotificationToken,
  likeUser,
  getLikedUsers,
  getUsersWhoLiked,
  deleteProfilePicture,
  getUsersSentMessages,
  getUsersWithPendingMessages,
  updatedUser,
  deleteUser,
} = require("../controllers/userController");

router.get("/likedUser", getLikedUsers);
router.get("/usersWhoLiked", getUsersWhoLiked);
router.post("/like", likeUser);
router.post("/updateProfilePicture", updateProfilePicture);
router.post("/deleteProfilePicture", deleteProfilePicture);
router.post("/update-user", updatedUser);
router.patch("/token", saveNotificationToken);
router.get("/sent-messages", getUsersSentMessages);
router.get("/pending-messages", getUsersWithPendingMessages);
router.get("/allUsers", getAllUser);
router.get("/:id", getUserById);
router.delete("/delete-user/:userId", deleteUser);

module.exports = router;
