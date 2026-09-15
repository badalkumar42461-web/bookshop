const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

// @desc    Admin login
// @route   POST /api/admin/auth/login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = generateToken({ id: admin._id, role: "admin" });

    res.json({
      message: "Admin login successful",
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Admin forgot password
// @route   POST /api/admin/auth/forgot-password
const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email: (email || "").toLowerCase() });

    if (!admin) {
      return res.json({ message: "If an admin account with that email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    admin.resetPasswordToken = hashedToken;
    admin.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
    await admin.save();

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5500"}/admin-reset-password.html?token=${resetToken}&email=${encodeURIComponent(admin.email)}`;

    await sendEmail({
      to: admin.email,
      subject: "Admin Password Reset - Online Bookstore",
      html: `<p>Hello ${admin.name},</p><p>Reset your admin password (valid 30 minutes):</p><a href="${resetUrl}">${resetUrl}</a>`,
    });

    res.json({
      message: "If an admin account with that email exists, a reset link has been sent.",
      devResetToken: process.env.SMTP_HOST ? undefined : resetToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Admin reset password
// @route   POST /api/admin/auth/reset-password
const adminResetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "Email, token and new password are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const admin = await Admin.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({ message: "Admin password reset successful." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { loginAdmin, adminForgotPassword, adminResetPassword };
