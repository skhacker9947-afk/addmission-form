require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Fallback for development if .env is missing
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // Default expiration

/**
 * Generates a JSON Web Token.
 * @param {object} payload - The data to be encoded in the token.
 * @returns {string} The generated JWT.
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verifies a JSON Web Token.
 * @param {string} token - The token to verify.
 * @returns {object|null} The decoded payload if verification is successful, null otherwise.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // console.error("JWT verification failed:", error.message);
    return null; // Token is invalid or expired
  }
};

/**
 * Decodes a JSON Web Token without verifying its signature or expiration.
 * Use with caution, primarily for inspecting token structure.
 * @param {string} token - The token to decode.
 * @returns {object|null} The decoded payload, or null if decoding fails.
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    // console.error("JWT decoding failed:", error.message);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};