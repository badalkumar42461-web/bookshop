const ContactMessage = require("../models/ContactMessage");

// @desc    Submit a contact us message (public - from Home page)
// @route   POST /api/contact
const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email and message are required" });
    }

    await ContactMessage.create({ name, email, subject, message });
    res.status(201).json({ message: "Thank you! Your message has been sent successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all contact messages (admin)
// @route   GET /api/admin/contact-messages
const getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Mark a contact message as read
// @route   PUT /api/admin/contact-messages/:id/read
const markMessageAsRead = async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: "Message not found" });
    res.json({ message: "Marked as read", data: msg });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a contact message
// @route   DELETE /api/admin/contact-messages/:id
const deleteContactMessage = async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  submitContactMessage,
  getContactMessages,
  markMessageAsRead,
  deleteContactMessage,
};
