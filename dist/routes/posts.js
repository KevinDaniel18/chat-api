"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postsController_1 = require("../controllers/postsController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get("/get-posts", postsController_1.getPosts);
router.post("/create-posts", postsController_1.createPost);
router.post("/like-posts", authMiddleware_1.authenticate, postsController_1.likePost);
router.get("/:postId/hasLiked-posts", authMiddleware_1.authenticate, postsController_1.hasLikedPost);
exports.default = router;
