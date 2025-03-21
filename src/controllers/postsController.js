const prisma = require("../prisma");

exports.createPost = async (req, res) => {
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

    return res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      message: "Failed to create post",
      error: error.message,
    });
  }
};

exports.getPosts = async (req, res) => {
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
      return res.status(404).json({ error: "Cannot find any post" });
    }
    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching post:", error);
    return res.status(500).json({
      message: "Failed to create post",
      error: error.message,
    });
  }
};
