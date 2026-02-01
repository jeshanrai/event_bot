const jwt = require("jsonwebtoken");

/**
 * Generate JWT token with custom expiration
 * @param {number} id - User ID
 * @param {string} role - User role
 * @param {string} expiresIn - Token expiration time (default: 7d)
 * @returns {string} JWT token
 */
const generateToken = (id, role, expiresIn = "7d") => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn });
};

module.exports = generateToken;
