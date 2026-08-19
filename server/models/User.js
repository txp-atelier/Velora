const mongoose = require("mongoose");
const { EMAIL_RE } = require("../utils/validators");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [60, "Name must be under 60 characters."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_RE, "Please enter a valid email address."],
    },
    hashedPassword: { type: String, required: true },
    role: {
      type: String,
      enum: { values: ["customer", "seller"], message: "Role must be customer or seller." },
      required: [true, "Role is required."],
    },
    themePreference: { type: String, enum: ["light", "dark"], default: "light" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
