const express = require("express");
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  cashfreeWebhook,
} = require("../controllers/paymentController");
const { protectUser } = require("../middleware/authMiddleware");

router.post("/create-order", protectUser, createPaymentOrder);
router.get("/verify/:orderId", protectUser, verifyPayment);
router.post("/webhook", cashfreeWebhook); // called by Cashfree server, no user JWT

module.exports = router;
