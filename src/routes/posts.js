const express = require("express");
const router = express.Router();

const { createPost, getPosts } = require("../controllers/postsController");

router.post("/create-posts", createPost);
router.get("/get-posts", getPosts)

module.exports = router;