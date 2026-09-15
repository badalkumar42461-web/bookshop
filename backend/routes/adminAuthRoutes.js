const express = require("express");
const router = express.Router();
const {
  loginAdmin,
  adminForgotPassword,
  adminResetPassword,
} = require("../controllers/adminAuthController");

router.post("/login", loginAdmin);
router.post("/forgot-password", adminForgotPassword);
router.post("/reset-password", adminResetPassword);

module.exports = router;
