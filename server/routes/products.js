const express = require("express");
const Product = require("../models/Product");
const { auth, requireRole } = require("../middleware/auth");
const {
  CATEGORIES, isValidPrice, isNonNegativeInteger, escapeRegex, toSafeString, validationError,
} = require("../utils/validators");

const router = express.Router();

const formatProduct = (p) => {
  const obj = p.toObject ? p.toObject({ virtuals: true }) : p;
  return {
    ...obj,
    id: obj._id?.toString() || obj.id,
    image: obj.images?.[0] || "",
    rating: obj.ratingAverage ?? obj.rating ?? 0,
    discountPercent: obj.discountPercent ?? 0,
  };
};

const buildFilter = (query) => {
  const filter = {};
  const category = toSafeString(query.category);
  const subcategory = toSafeString(query.subcategory);
  const brand = toSafeString(query.brand);
  const search = toSafeString(query.search);
  const seller = toSafeString(query.seller);

  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;
  if (brand) filter.brand = brand;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
      { brand: { $regex: safe, $options: "i" } },
    ];
  }
  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    filter.price = {};
    if (Number.isFinite(minPrice) && minPrice >= 0) filter.price.$gte = minPrice;
    if (Number.isFinite(maxPrice) && maxPrice >= 0) filter.price.$lte = maxPrice;
    if (!Object.keys(filter.price).length) delete filter.price;
  }
  const rating = Number(query.rating);
  if (Number.isFinite(rating)) filter.ratingAverage = { $gte: rating };
  if (query.inStock === "true") filter.stock = { $gt: 0 };
  if (query.discount === "true") {
    filter.$expr = { $gt: ["$originalPrice", "$price"] };
  }
  if (seller && /^[a-f0-9]{24}$/i.test(seller)) filter.seller = seller;
  return filter;
};

const buildSort = (sort) => {
  switch (sort) {
    case "price-asc": return { price: 1 };
    case "price-desc": return { price: -1 };
    case "rating": return { ratingAverage: -1 };
    case "newest": return { createdAt: -1 };
    case "popularity": return { popularity: -1 };
    default: return { createdAt: -1 };
  }
};

const validateProductBody = (body, { partial = false } = {}) => {
  const fields = {};
  const has = (key) => body[key] !== undefined && body[key] !== null && body[key] !== "";

  if (!partial || has("name")) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 3) fields.name = "Product name must be at least 3 characters.";
    else if (name.length > 120) fields.name = "Product name must be under 120 characters.";
  }
  if (!partial || has("description")) {
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (description.length < 20) fields.description = "Description must be at least 20 characters.";
  }
  if (!partial || has("category")) {
    if (!CATEGORIES.includes(body.category)) fields.category = "Please choose a valid category.";
  }
  if (!partial || has("price")) {
    if (!isValidPrice(body.price)) fields.price = "Price must be a positive amount with at most 2 decimal places.";
  }
  if (body.originalPrice !== undefined && body.originalPrice !== "" && body.originalPrice !== null) {
    if (!Number.isFinite(Number(body.originalPrice)) || Number(body.originalPrice) < 0) {
      fields.originalPrice = "Original price must be a positive amount.";
    }
  }
  if (!partial || has("stock")) {
    if (!isNonNegativeInteger(body.stock)) fields.stock = "Stock must be a whole number, 0 or more.";
  }
  if (!partial || body.images !== undefined) {
    const images = body.images?.length ? body.images : body.image ? [body.image] : [];
    if (!images.length) fields.images = "At least one product image is required.";
  }
  return fields;
};

router.get("/", async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const sort = buildSort(req.query.sort);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).populate("seller", "name").sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json({
      products: products.map(formatProduct),
      page,
      limit,
      total,
      hasMore: skip + products.length < total,
    });
  } catch {
    res.status(500).json({ error: "Could not load products." });
  }
});

router.get("/meta/brands", async (req, res) => {
  const brands = await Product.distinct("brand", { brand: { $ne: "" } });
  res.json(brands.sort());
});

router.get("/meta/categories", async (req, res) => {
  const categories = await Product.distinct("category");
  res.json(categories.sort());
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("seller", "name email");
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(formatProduct(product));
  } catch {
    res.status(404).json({ error: "Product not found." });
  }
});

router.post("/", auth, requireRole("seller"), async (req, res) => {
  try {
    const fields = validateProductBody(req.body);
    if (Object.keys(fields).length) return validationError(res, fields);

    const data = { ...req.body, seller: req.user._id };
    if (!data.images?.length && data.image) data.images = [data.image];
    const product = await Product.create(data);
    res.status(201).json(formatProduct(product));
  } catch (err) {
    if (err.name === "ValidationError") {
      const fields = {};
      Object.values(err.errors).forEach((e) => { fields[e.path] = e.message; });
      return validationError(res, fields);
    }
    res.status(400).json({ error: "Could not create product. Check all required fields." });
  }
});

router.put("/:id", auth, requireRole("seller"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only edit your own products." });
    }
    const fields = validateProductBody(req.body, { partial: true });
    if (Object.keys(fields).length) return validationError(res, fields);

    Object.assign(product, req.body);
    if (req.body.image && !req.body.images) product.images = [req.body.image];
    await product.save();
    res.json(formatProduct(product));
  } catch (err) {
    if (err.name === "ValidationError") {
      const fields = {};
      Object.values(err.errors).forEach((e) => { fields[e.path] = e.message; });
      return validationError(res, fields);
    }
    res.status(400).json({ error: "Could not update product." });
  }
});

router.delete("/:id", auth, requireRole("seller"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only delete your own products." });
    }
    await product.deleteOne();
    res.json({ message: "Product deleted." });
  } catch {
    res.status(500).json({ error: "Could not delete product." });
  }
});

module.exports = router;
