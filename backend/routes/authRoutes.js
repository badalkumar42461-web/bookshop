const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protectUser } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protectUser, getProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
