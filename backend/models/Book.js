const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    category: { type: String, default: "General", trim: true },
    stock: { type: Number, required: true, default: 10, min: 0 },
    coverImage: {
      type: String,
      default: "https://via.placeholder.com/220x300?text=Book+Cover",
    },
    isbn: { type: String, trim: true },
    rating: { type: Number, default: 4, min: 0, max: 5 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
