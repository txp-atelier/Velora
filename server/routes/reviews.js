const express = require("express");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { auth, optionalAuth } = require("../middleware/auth");
const { validationError } = require("../utils/validators");

const router = express.Router();

const updateProductRatings = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  reviews.forEach((r) => {
    breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    sum += r.rating;
  });
  const count = reviews.length;
  const average = count ? Math.round((sum / count) * 10) / 10 : 0;
  await Product.findByIdAndUpdate(productId, {
    ratingAverage: average,
    ratingCount: count,
    ratingBreakdown: breakdown,
  });
};

const canReview = async (userId, productId) => {
  const order = await Order.findOne({
    customer: userId,
    status: { $in: ["confirmed", "shipped", "delivered"] },
    "items.product": productId,
  });
  return !!order;
};

router.get("/product/:productId", optionalAuth, async (req, res) => {
  const { sort = "newest" } = req.query;
  let sortOpt = { createdAt: -1 };
  if (sort === "helpful") sortOpt = { helpfulCount: -1 };
  if (sort === "highest") sortOpt = { rating: -1 };
  if (sort === "lowest") sortOpt = { rating: 1 };
  const reviews = await Review.find({ product: req.params.productId })
    .populate("buyer", "name")
    .sort(sortOpt);
  const userId = req.user?._id?.toString();
  res.json(reviews.map((r) => {
    const obj = r.toObject();
    obj.helpfulByMe = !!userId && (r.helpfulVoters || []).some((v) => v.toString() === userId);
    delete obj.helpfulVoters;
    return obj;
  }));
});

router.get("/product/:productId/eligibility", auth, async (req, res) => {
  const eligible = await canReview(req.user._id, req.params.productId);
  const existing = await Review.findOne({
    buyer: req.user._id,
    product: req.params.productId,
  });
  res.json({ eligible, hasReviewed: !!existing });
});

router.post("/", auth, async (req, res) => {
  try {
    const { productId, rating, text, images = [] } = req.body;
    const fields = {};
    if (!productId) fields.productId = "Product is required.";
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      fields.rating = "Choose a star rating from 1 to 5.";
    }
    if (!text || text.trim().length < 10) {
      fields.text = "Reviews must be at least 10 characters.";
    } else if (text.trim().length > 1000) {
      fields.text = "Reviews must be under 1000 characters.";
    }
    if (images.length > 5) fields.images = "Up to 5 images allowed.";
    if (Object.keys(fields).length) return validationError(res, fields);

    const eligible = await canReview(req.user._id, productId);
    if (!eligible) {
      return res.status(403).json({
        error: "Only customers who purchased this product can leave a review.",
      });
    }
    const existing = await Review.findOne({ buyer: req.user._id, product: productId });
    if (existing) {
      return res.status(409).json({ error: "You have already reviewed this product." });
    }
    const review = await Review.create({
      buyer: req.user._id,
      product: productId,
      rating: Number(rating),
      text: text.trim(),
      images,
    });
    await updateProductRatings(productId);
    const populated = await Review.findById(review._id).populate("buyer", "name");
    res.status(201).json(populated);
  } catch {
    res.status(500).json({ error: "Could not submit review." });
  }
});

// Toggles the current user's helpful vote, one vote per user per review.
// Each step is a single atomic findOneAndUpdate keyed off membership in
// helpfulVoters, so concurrent clicks can't double- (or under-) count.
router.post("/:id/helpful", auth, async (req, res) => {
  const userId = req.user._id;
  let helpfulByMe = true;
  let review = await Review.findOneAndUpdate(
    { _id: req.params.id, helpfulVoters: { $ne: userId } },
    { $inc: { helpfulCount: 1 }, $addToSet: { helpfulVoters: userId } },
    { new: true }
  );
  if (!review) {
    helpfulByMe = false;
    review = await Review.findOneAndUpdate(
      { _id: req.params.id, helpfulVoters: userId },
      { $inc: { helpfulCount: -1 }, $pull: { helpfulVoters: userId } },
      { new: true }
    );
  }
  if (!review) return res.status(404).json({ error: "Review not found." });
  await review.populate("buyer", "name");
  const obj = review.toObject();
  delete obj.helpfulVoters;
  obj.helpfulByMe = helpfulByMe;
  res.json(obj);
});

module.exports = router;
