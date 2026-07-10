const jwt = require('jsonwebtoken');

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const extractToken = (event) => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }

  return token;
};

const requireAuth = (event) => {
  try {
    const token = extractToken(event);
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    throw new Error('Authentication required');
  }
};

module.exports = {
  verifyToken,
  extractToken,
  requireAuth
};
