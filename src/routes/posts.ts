import { Router } from "express";
import {
  createPost,
  getPosts,
  likePost,
  hasLikedPost,
} from "../controllers/postsController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/get-posts", getPosts);
router.post("/create-posts", createPost);
router.post("/like-posts", authenticate, likePost);
router.get("/:postId/hasLiked-posts", authenticate, hasLikedPost);

export default router;
