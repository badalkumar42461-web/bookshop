const Coupon = require("../models/Coupon");

// @desc    Validate a coupon code against an order amount (used at checkout)
// @route   POST /api/coupons/validate
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code is required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }
    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ message: "This coupon has expired" });
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "This coupon has reached its usage limit" });
    }
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`,
      });
    }

    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, orderAmount);

    res.json({
      message: "Coupon applied successfully",
      code: coupon.code,
      discount: Math.round(discount * 100) / 100,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- ADMIN ----------

// @desc    Get all coupons
// @route   GET /api/admin/coupons
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create coupon
// @route   POST /api/admin/coupons
const createCoupon = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.code) body.code = body.code.toUpperCase();
    const coupon = await Coupon.create(body);
    res.status(201).json({ message: "Coupon created successfully", coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "A coupon with this code already exists" });
    }
    res.status(400).json({ message: "Failed to create coupon", error: error.message });
  }
};

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
const updateCoupon = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.code) body.code = body.code.toUpperCase();
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon updated successfully", coupon });
  } catch (error) {
    res.status(400).json({ message: "Failed to update coupon", error: error.message });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon };
