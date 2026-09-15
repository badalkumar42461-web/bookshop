const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Order = require("../models/Order");
const Book = require("../models/Book");
const Coupon = require("../models/Coupon");
const User = require("../models/User");

const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "PRODUCTION"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const cashfreeHeaders = () => ({
  "x-client-id": process.env.CASHFREE_APP_ID,
  "x-client-secret": process.env.CASHFREE_SECRET_KEY,
  "x-api-version": "2022-09-01",
  "Content-Type": "application/json",
});

/**
 * @desc    Create a local order + a Cashfree payment order, return payment session id
 * @route   POST /api/payment/create-order
 * body: { items: [{bookId, quantity}], couponCode, shippingAddress, phone }
 *
 * "items" supports both a full cart checkout AND a single "Buy Now" item.
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { items, couponCode, shippingAddress, phone } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "No items provided for checkout" });
    }
    if (!shippingAddress || !phone) {
      return res.status(400).json({ message: "Shipping address and phone are required" });
    }

    // Build order items from DB (never trust client-sent prices)
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const book = await Book.findById(item.bookId);
      if (!book) {
        return res.status(404).json({ message: `Book not found: ${item.bookId}` });
      }
      const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      if (book.stock < qty) {
        return res.status(400).json({ message: `Insufficient stock for "${book.title}"` });
      }
      const unitPrice = book.discountPrice && book.discountPrice > 0 ? book.discountPrice : book.price;
      subtotal += unitPrice * qty;
      orderItems.push({ book: book._id, title: book.title, price: unitPrice, quantity: qty });
    }

    // Apply coupon if provided
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && coupon.expiryDate >= new Date() && coupon.usedCount < coupon.usageLimit && subtotal >= coupon.minOrderAmount) {
        discount =
          coupon.discountType === "PERCENTAGE"
            ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
            : coupon.discountValue;
        discount = Math.min(discount, subtotal);
        appliedCoupon = coupon;
      }
    }

    const totalAmount = Math.round((subtotal - discount) * 100) / 100;

    // Create local order (PENDING)
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      subtotal,
      discount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      totalAmount,
      shippingAddress,
      phone,
      paymentStatus: "PENDING",
      orderStatus: "PLACED",
    });

    // Create Cashfree order
    const cfOrderId = `order_${order._id}_${uuidv4().slice(0, 8)}`;

    const cfPayload = {
      order_id: cfOrderId,
      order_amount: totalAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: String(req.user._id),
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: phone,
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL || " https://bookshop-h0eo.onrender.com"}/checkout.html?localOrderId=${order._id}`,
        notify_url: `${process.env.SERVER_URL || ""}/api/payment/webhook`,
      },
    };

    const cfResponse = await axios.post(`${CASHFREE_BASE_URL}/orders`, cfPayload, {
      headers: cashfreeHeaders(),
    });

    order.cashfreeOrderId = cfOrderId;
    order.paymentSessionId = cfResponse.data.payment_session_id;
    await order.save();

    res.status(201).json({
      message: "Payment order created",
      orderId: order._id,
      cashfreeOrderId: cfOrderId,
      paymentSessionId: cfResponse.data.payment_session_id,
      totalAmount,
    });
  } catch (error) {
    const cfError = error.response?.data;
    res.status(500).json({
      message: "Failed to create payment order",
      error: cfError || error.message,
    });
  }
};

/**
 * @desc    Verify payment status with Cashfree and finalize the order
 * @route   GET /api/payment/verify/:orderId  (orderId = our local Order _id)
 */
const verifyPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus === "PAID") {
      return res.json({ message: "Payment already verified", order });
    }

    const cfResponse = await axios.get(
      `${CASHFREE_BASE_URL}/orders/${order.cashfreeOrderId}`,
      { headers: cashfreeHeaders() }
    );

    const status = cfResponse.data.order_status; // ACTIVE | PAID | EXPIRED | TERMINATED

    if (status === "PAID") {
      order.paymentStatus = "PAID";
      order.orderStatus = "PROCESSING";
      order.paymentId = cfResponse.data.cf_order_id;
      await order.save();

      // Reduce stock for purchased items
      for (const item of order.items) {
        await Book.findByIdAndUpdate(item.book, { $inc: { stock: -item.quantity } });
      }

      // Increment coupon usage
      if (order.couponCode) {
        await Coupon.findOneAndUpdate({ code: order.couponCode }, { $inc: { usedCount: 1 } });
      }

      // Clear the purchased items from the user's cart
      const purchasedIds = order.items.map((i) => i.book.toString());
      const user = await User.findById(order.user);
      user.cart = user.cart.filter((c) => !purchasedIds.includes(c.book.toString()));
      await user.save();

      return res.json({ message: "Payment verified successfully", order });
    }

    if (status === "EXPIRED" || status === "TERMINATED") {
      order.paymentStatus = "FAILED";
      await order.save();
      return res.status(400).json({ message: "Payment failed or expired", order });
    }

    res.json({ message: "Payment is still pending", order, cashfreeStatus: status });
  } catch (error) {
    const cfError = error.response?.data;
    res.status(500).json({ message: "Failed to verify payment", error: cfError || error.message });
  }
};

/**
 * @desc    Cashfree webhook endpoint (optional, for server-to-server payment confirmation)
 * @route   POST /api/payment/webhook
 */
const cashfreeWebhook = async (req, res) => {
  try {
    const event = req.body;
    const cfOrderId = event?.data?.order?.order_id;
    const paymentStatus = event?.data?.payment?.payment_status;

    if (cfOrderId && paymentStatus === "SUCCESS") {
      const order = await Order.findOne({ cashfreeOrderId: cfOrderId });
      if (order && order.paymentStatus !== "PAID") {
        order.paymentStatus = "PAID";
        order.orderStatus = "PROCESSING";
        await order.save();

        for (const item of order.items) {
          await Book.findByIdAndUpdate(item.book, { $inc: { stock: -item.quantity } });
        }
      }
    }
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(200).json({ received: true, note: "processed with warnings" });
  }
};

module.exports = { createPaymentOrder, verifyPayment, cashfreeWebhook };
