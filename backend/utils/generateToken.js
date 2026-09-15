const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT.
 * @param {Object} payload - e.g. { id, role }
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
