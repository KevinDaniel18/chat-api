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
exports.deletePost = exports.hasLikedPost = exports.likePost = exports.getPosts = exports.createPost = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { authorId, file, description } = req.body;
    console.log("Datos recibidos:", { authorId, file, description });
    try {
        const newPost = yield prisma_1.default.posts.create({
            data: {
                authorId,
                file,
                description,
            },
        });
        res.status(201).json({
            message: "Post created successfully",
            post: newPost,
        });
    }
    catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({
            message: "Failed to create post",
            error: error.message,
        });
    }
});
exports.createPost = createPost;
const getPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield prisma_1.default.posts.findMany({
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        profilePicture: true,
                    },
                },
            },
        });
        if (posts.length === 0) {
            res.status(404).json({ error: "Cannot find any post" });
            return;
        }
        res.status(200).json(posts);
    }
    catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({
            message: "Failed to create post",
            error: error.message,
        });
    }
});
exports.getPosts = getPosts;
const likePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const userId = Number(req.user.id);
    const { postId } = req.body;
    try {
        const existingLike = yield prisma_1.default.postsLikes.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
        if (existingLike) {
            yield prisma_1.default.postsLikes.delete({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
            yield prisma_1.default.posts.update({
                where: { id: postId },
                data: {
                    likes: {
                        decrement: 1,
                    },
                },
            });
            res.status(200).json({ message: "Deslike applied successfully" });
        }
        else {
            yield prisma_1.default.postsLikes.create({
                data: {
                    userId,
                    postId,
                },
            });
            yield prisma_1.default.posts.update({
                where: { id: postId },
                data: {
                    likes: {
                        increment: 1,
                    },
                },
            });
            res.status(200).json({ message: "Like applied successfully" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error processing request" });
    }
});
exports.likePost = likePost;
const hasLikedPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const userId = Number(req.user.id);
    const postId = parseInt(req.params.postId);
    try {
        const like = yield prisma_1.default.postsLikes.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
        res.json({ hasLiked: !!like });
    }
    catch (error) {
        console.error("Error checking like status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.hasLikedPost = hasLikedPost;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (error) { }
});
exports.deletePost = deletePost;
