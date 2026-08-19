const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const { auth } = require("../middleware/auth");
const { isValidEmail, isStrongPassword, isValidName, validationError } = require("../utils/validators");

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  themePreference: user.themePreference,
});

const PASSWORD_HINT = "Password must be at least 8 characters and include a letter and a number.";

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const fields = {};
    if (!name || !isValidName(name)) {
      fields.name = "Enter your full name (letters only, at least 2 characters).";
    }
    if (!email || !isValidEmail(email)) {
      fields.email = "Please enter a valid email address.";
    }
    if (!password || !isStrongPassword(password)) {
      fields.password = PASSWORD_HINT;
    }
    if (!role || !["customer", "seller"].includes(role)) {
      fields.role = "Choose whether you want to shop or sell.";
    }
    if (Object.keys(fields).length) return validationError(res, fields);

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return validationError(res, { email: "This email is already registered." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email, hashedPassword, role });
    const token = signToken(user._id);
    res.status(201).json({ user: formatUser(user), token });
  } catch (err) {
    if (err.name === "ValidationError") {
      const fields = {};
      Object.values(err.errors).forEach((e) => { fields[e.path] = e.message; });
      return validationError(res, fields);
    }
    res.status(500).json({ error: "Could not create account. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const fields = {};
    if (!email || !isValidEmail(email)) fields.email = "Please enter a valid email address.";
    if (!password) fields.password = "Password is required.";
    if (Object.keys(fields).length) return validationError(res, fields);

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Email or password is incorrect.", fields: { password: "Email or password is incorrect." } });
    }
    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return res.status(401).json({ error: "Email or password is incorrect.", fields: { password: "Email or password is incorrect." } });
    }
    const token = signToken(user._id);
    res.json({ user: formatUser(user), token });
  } catch {
    res.status(500).json({ error: "Could not sign in. Please try again." });
  }
});

router.get("/me", auth, (req, res) => {
  res.json({ user: formatUser(req.user) });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return validationError(res, { email: "Please enter a valid email address." });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await PasswordResetToken.deleteMany({ user: user._id });
      await PasswordResetToken.create({
        user: user._id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      console.log(`[Velora] Password reset token for ${email}: ${token}`);
    }
    res.json({ message: "If that email exists, we sent reset instructions." });
  } catch {
    res.status(500).json({ error: "Could not process request." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    const fields = {};
    if (!token) fields.token = "Reset token is required.";
    if (!password || !isStrongPassword(password)) fields.password = PASSWORD_HINT;
    if (Object.keys(fields).length) return validationError(res, fields);

    const reset = await PasswordResetToken.findOne({ token });
    if (!reset || reset.expiresAt < new Date()) {
      return validationError(res, { token: "This reset link is invalid or has expired." });
    }
    const user = await User.findById(reset.user);
    if (!user) return validationError(res, { token: "User not found." });
    user.hashedPassword = await bcrypt.hash(password, 10);
    await user.save();
    await PasswordResetToken.deleteMany({ user: user._id });
    res.json({ message: "Password updated successfully. You can sign in now." });
  } catch {
    res.status(500).json({ error: "Could not reset password." });
  }
});

module.exports = router;
