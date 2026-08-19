const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getToken = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
};

const auth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ error: "Please sign in to continue." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-hashedPassword");
    if (!user) {
      return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-hashedPassword");
    }
  } catch {
  }
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "You do not have permission for this action." });
  }
  next();
};

module.exports = { auth, optionalAuth, requireRole };
