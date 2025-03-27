import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const generateToken = (userId: number | string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token: string): jwt.JwtPayload | string => {
  return jwt.verify(token, JWT_SECRET);
};
