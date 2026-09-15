const express = require("express");
const router = express.Router();
const { validateCoupon } = require("../controllers/couponController");
const { protectUser } = require("../middleware/authMiddleware");

router.post("/validate", protectUser, validateCoupon);

module.exports = router;
