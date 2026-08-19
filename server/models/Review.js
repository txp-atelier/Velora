const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    rating: {
      type: Number,
      required: [true, "A star rating is required."],
      min: [1, "Rating must be between 1 and 5."],
      max: [5, "Rating must be between 1 and 5."],
      validate: { validator: Number.isInteger, message: "Rating must be a whole number." },
    },
    text: {
      type: String,
      required: [true, "Review text is required."],
      trim: true,
      minlength: [10, "Reviews must be at least 10 characters."],
      maxlength: [1000, "Reviews must be under 1000 characters."],
    },
    images: {
      type: [String],
      validate: { validator: (arr) => arr.length <= 5, message: "Up to 5 images allowed." },
    },
    helpfulCount: { type: Number, default: 0, min: 0 },
    helpfulVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
