const express = require("express");
const router = express.Router();
const { getMyOrders, getOrderById } = require("../controllers/orderController");
const { protectUser } = require("../middleware/authMiddleware");

router.use(protectUser);

router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);

module.exports = router;
