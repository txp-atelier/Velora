const mongoose = require("mongoose");
const { CATEGORIES } = require("../utils/validators");

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters."],
      maxlength: [120, "Product name must be under 120 characters."],
    },
    description: {
      type: String,
      required: [true, "Description is required."],
      trim: true,
      minlength: [20, "Description must be at least 20 characters."],
    },
    category: {
      type: String,
      required: [true, "Category is required."],
      enum: { values: CATEGORIES, message: "Please choose a valid category." },
      index: true,
    },
    subcategory: { type: String, default: "", trim: true },
    brand: { type: String, default: "", trim: true, index: true },
    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0.01, "Price must be greater than 0."],
      validate: {
        validator: (v) => Math.round(v * 100) === v * 100,
        message: "Price can have at most 2 decimal places.",
      },
    },
    originalPrice: { type: Number, min: [0, "Original price cannot be negative."] },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one product image is required.",
      },
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required."],
      min: [0, "Stock cannot be negative."],
      validate: { validator: Number.isInteger, message: "Stock must be a whole number." },
      default: 0,
    },
    specs: { type: Map, of: String, default: {} },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    ratingBreakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 },
    },
    popularity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.virtual("discountPercent").get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
