const User = require("../models/User");
const Order = require("../models/Order");
const Book = require("../models/Book");

// @desc    Get all registered users
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -resetPasswordToken -resetPasswordExpires").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get a single user's profile + their order history
// @route   GET /api/admin/users/:id
const getUserWithOrders = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) return res.status(404).json({ message: "User not found" });

    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json({ user, orders });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Toggle a user's active/blocked status
// @route   PUT /api/admin/users/:id/toggle-status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? "activated" : "blocked"}`, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get dashboard summary stats
// @route   GET /api/admin/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalBooks, totalOrders, paidOrders] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      Order.countDocuments(),
      Order.find({ paymentStatus: "PAID" }),
    ]);

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      totalUsers,
      totalBooks,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getAllUsers, getUserWithOrders, toggleUserStatus, getDashboardStats };
