import { Request, Response } from "express";
import prisma from "../prisma";

export const createPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { authorId, file, description } = req.body;
  console.log("Datos recibidos:", { authorId, file, description });

  try {
    const newPost = await prisma.posts.create({
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
  } catch (error: any) {
    console.error("Error creating post:", error);
    res.status(500).json({
      message: "Failed to create post",
      error: error.message,
    });
  }
};

export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await prisma.posts.findMany({
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
  } catch (error: any) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      message: "Failed to create post",
      error: error.message,
    });
  }
};

export const likePost = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = Number(req.user.id);
  const { postId } = req.body;

  try {
    const existingLike = await prisma.postsLikes.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      await prisma.postsLikes.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      await prisma.posts.update({
        where: { id: postId },
        data: {
          likes: {
            decrement: 1,
          },
        },
      });

      res.status(200).json({ message: "Deslike applied successfully" });
    } else {
      await prisma.postsLikes.create({
        data: {
          userId,
          postId,
        },
      });

      await prisma.posts.update({
        where: { id: postId },
        data: {
          likes: {
            increment: 1,
          },
        },
      });

      res.status(200).json({ message: "Like applied successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing request" });
  }
};

export const hasLikedPost = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return 
  }
  const userId = Number(req.user.id);
  const postId = parseInt(req.params.postId);

  try {
    const like = await prisma.postsLikes.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    res.json({ hasLiked: !!like });
  } catch (error) {
    console.error("Error checking like status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
  } catch (error) {}
};
