const { verifyToken } = require("../utils/jwt");

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { authenticate };
