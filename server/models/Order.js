const mongoose = require("mongoose");
const { NAME_RE, PHONE_RE, PINCODE_RE } = require("../utils/validators");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 },
    image: String,
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      match: [NAME_RE, "Name should only contain letters."],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      match: [PHONE_RE, "Enter a valid 10-digit mobile number."],
    },
    addressLine1: { type: String, required: [true, "Address line 1 is required."], trim: true },
    addressLine2: { type: String, default: "", trim: true },
    city: {
      type: String,
      required: [true, "City is required."],
      trim: true,
      match: [NAME_RE, "City should only contain letters."],
    },
    state: {
      type: String,
      required: [true, "State is required."],
      trim: true,
      match: [NAME_RE, "State should only contain letters."],
    },
    pincode: {
      type: String,
      required: [true, "PIN code is required."],
      trim: true,
      match: [PINCODE_RE, "Enter a valid 6-digit PIN code."],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"],
        },
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ["card", "upi", "cod"], default: "card" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
