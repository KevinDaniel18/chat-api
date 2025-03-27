import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma";
import { generateToken } from "../utils/jwt";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      res
        .status(404)
        .json({ message: "User not found or password is missing" });
      return;
    }

    const isMatch = bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid password" });
      return;
    }

    const token = generateToken(user.id);
    res.json({ token, id: user.id, userName: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
