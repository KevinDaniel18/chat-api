import { Request, Response } from "express";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import messageRoutes from "./routes/message";
import postsRoutes from "./routes/posts";
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/messages", messageRoutes);
app.use("/posts", postsRoutes);
app.get("/", (req: Request, res: Response) => {
  res.send("Hello world");
});

export default app;
