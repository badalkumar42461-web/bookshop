const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");
const { protectUser } = require("../middleware/authMiddleware");

router.use(protectUser);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:bookId", updateCartItem);
router.delete("/:bookId", removeFromCart);
router.delete("/", clearCart);

module.exports = router;
