const User = require("../models/User");
const Book = require("../models/Book");

// @desc    Get current user's cart (populated with book details)
// @route   GET /api/cart
const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.book");
    const cart = user.cart.filter((item) => item.book); // filter out deleted books
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Add a book to cart (or increase quantity if already present)
// @route   POST /api/cart
const addToCart = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const qty = Number(quantity) > 0 ? Number(quantity) : 1;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const user = await User.findById(req.user._id);
    const existingItem = user.cart.find((item) => item.book.toString() === bookId);

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      user.cart.push({ book: bookId, quantity: qty });
    }

    await user.save();
    const populatedUser = await User.findById(req.user._id).populate("cart.book");
    res.json({ message: "Added to cart", cart: populatedUser.cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update quantity of an item in the cart
// @route   PUT /api/cart/:bookId
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const user = await User.findById(req.user._id);
    const item = user.cart.find((i) => i.book.toString() === req.params.bookId);

    if (!item) return res.status(404).json({ message: "Item not in cart" });

    if (Number(quantity) <= 0) {
      user.cart = user.cart.filter((i) => i.book.toString() !== req.params.bookId);
    } else {
      item.quantity = Number(quantity);
    }

    await user.save();
    const populatedUser = await User.findById(req.user._id).populate("cart.book");
    res.json({ message: "Cart updated", cart: populatedUser.cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Remove a single item from the cart
// @route   DELETE /api/cart/:bookId
const removeFromCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter((item) => item.book.toString() !== req.params.bookId);
    await user.save();
    const populatedUser = await User.findById(req.user._id).populate("cart.book");
    res.json({ message: "Item removed from cart", cart: populatedUser.cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Clear the entire cart
// @route   DELETE /api/cart
const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();
    res.json({ message: "Cart cleared", cart: [] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
