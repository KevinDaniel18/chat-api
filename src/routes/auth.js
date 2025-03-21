const express = require("express");
const { register, login, googleRegister, googleLogin } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/google-register", googleRegister)
router.post("/login", login);
router.post("/google-login", googleLogin)

module.exports = router;