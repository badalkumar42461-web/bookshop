const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const Book = require("../models/Book");

/**
 * Seeds a default admin account (if none exist) and a handful of
 * sample books (if the Book collection is empty), so the app is
 * immediately usable after first install.
 */
const seedDatabase = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(
        process.env.DEFAULT_ADMIN_PASSWORD || "Admin@12345",
        salt
      );
      await Admin.create({
        name: "Super Admin",
        email: (process.env.DEFAULT_ADMIN_EMAIL || "admin@bookstore.com").toLowerCase(),
        password: hashedPassword,
      });
      console.log(
        `Default admin created -> email: ${process.env.DEFAULT_ADMIN_EMAIL || "admin@bookstore.com"} | password: ${process.env.DEFAULT_ADMIN_PASSWORD || "Admin@12345"}`
      );
    }

    const bookCount = await Book.countDocuments();
    if (bookCount === 0) {
      await Book.insertMany([
        {
          title: "The Silent Ocean",
          author: "Elena Marsh",
          description: "A gripping tale of survival and discovery across the vast Pacific.",
          price: 499,
          discountPrice: 399,
          category: "Fiction",
          stock: 25,
          coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
          rating: 4.5,
        },
        {
          title: "Atomic Habits",
          author: "James Clear",
          description: "An easy and proven way to build good habits and break bad ones.",
          price: 599,
          discountPrice: 449,
          category: "Self-Help",
          stock: 40,
          coverImage: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400",
          rating: 4.8,
        },
        {
          title: "The Code Breakers",
          author: "Walter Iso",
          description: "The story of scientific breakthroughs that changed the world.",
          price: 699,
          category: "Science",
          stock: 15,
          coverImage: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400",
          rating: 4.2,
        },
        {
          title: "Modern JavaScript Mastery",
          author: "Ravi Sharma",
          description: "A complete guide to writing clean, modern JavaScript.",
          price: 799,
          discountPrice: 599,
          category: "Technology",
          stock: 30,
          coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400",
          rating: 4.6,
        },
        {
          title: "Whispers of the Past",
          author: "Clara Bennett",
          description: "A historical romance set in 19th century Europe.",
          price: 449,
          category: "Romance",
          stock: 20,
          coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
          rating: 4.0,
        },
        {
          title: "Mind Over Matter",
          author: "Dr. Anjali Rao",
          description: "Practical psychology for everyday resilience.",
          price: 549,
          discountPrice: 429,
          category: "Self-Help",
          stock: 35,
          coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
          rating: 4.3,
        },
      ]);
      console.log("Sample books seeded successfully");
    }
  } catch (error) {
    console.error("Seeding error:", error.message);
  }
};

module.exports = seedDatabase;
