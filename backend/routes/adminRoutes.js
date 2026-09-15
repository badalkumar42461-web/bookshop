const express = require("express");
const router = express.Router();
const { protectAdmin } = require("../middleware/authMiddleware");

const {
  adminGetBooks,
  createBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

const {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");

const {
  getContactMessages,
  markMessageAsRead,
  deleteContactMessage,
} = require("../controllers/contactController");

const {
  adminGetAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const {
  getAllUsers,
  getUserWithOrders,
  toggleUserStatus,
  getDashboardStats,
} = require("../controllers/adminDashboardController");

router.use(protectAdmin);

// Dashboard
router.get("/dashboard-stats", getDashboardStats);

// Books CRUD
router.get("/books", adminGetBooks);
router.post("/books", createBook);
router.put("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);

// Coupons CRUD
router.get("/coupons", getCoupons);
router.post("/coupons", createCoupon);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);

// Users + their orders
router.get("/users", getAllUsers);
router.get("/users/:id", getUserWithOrders);
router.put("/users/:id/toggle-status", toggleUserStatus);

// All Orders
router.get("/orders", adminGetAllOrders);
router.put("/orders/:id/status", updateOrderStatus);

// Contact messages
router.get("/contact-messages", getContactMessages);
router.put("/contact-messages/:id/read", markMessageAsRead);
router.delete("/contact-messages/:id", deleteContactMessage);

module.exports = router;
