const bcrypt = require("bcrypt");
const prisma = require("../prisma");
const { generateToken } = require("../utils/jwt");

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
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

const googleRegister = async (req, res) => {
  const { name, email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    await prisma.user.create({
      data: { name, email },
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if(user && !user.password) return res.status(421).json({ message: "Please try login with google" });

    const isMatch = bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = generateToken(user.id);
    res.json({ token, id: user.id, userName: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const googleLogin = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = generateToken(user.id);
    res
      .status(201)
      .json({ token, id: user.id, userName: user.name, userEmail: user.email });
  } catch (error) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { register, login, googleRegister, googleLogin };
