const Book = require("../models/Book");

// @desc    Get all active books (public) - supports ?search=&category=
// @route   GET /api/books
const getBooks = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }
    if (category && category !== "all") {
      filter.category = category;
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single book by id
// @route   GET /api/books/:id
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------- ADMIN ----------

// @desc    Get ALL books (admin - includes inactive)
// @route   GET /api/admin/books
const adminGetBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create a new book
// @route   POST /api/admin/books
const createBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ message: "Book created successfully", book });
  } catch (error) {
    res.status(400).json({ message: "Failed to create book", error: error.message });
  }
};

// @desc    Update a book
// @route   PUT /api/admin/books/:id
const updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book updated successfully", book });
  } catch (error) {
    res.status(400).json({ message: "Failed to update book", error: error.message });
  }
};

// @desc    Delete a book
// @route   DELETE /api/admin/books/:id
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getBooks,
  getBookById,
  adminGetBooks,
  createBook,
  updateBook,
  deleteBook,
};
