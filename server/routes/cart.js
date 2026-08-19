const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { auth, requireRole } = require("../middleware/auth");
const { isNonNegativeInteger, validationError } = require("../utils/validators");

const router = express.Router();

const populateCart = (query) =>
  query.populate({ path: "items.product", select: "name price images stock ratingAverage originalPrice" });

const stockMessage = (product) =>
  product.stock > 0
    ? `Only ${product.stock} left in stock.`
    : `${product.name} is out of stock.`;

router.get("/", auth, async (req, res) => {
  let cart = await populateCart(Cart.findOne({ user: req.user._id }));
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }
  res.json(cart);
});

router.post("/items", auth, requireRole("customer"), async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return validationError(res, { productId: "Product is required." });
  if (!isNonNegativeInteger(quantity) || Number(quantity) < 1) {
    return validationError(res, { quantity: "Quantity must be at least 1." });
  }
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "Product not found." });
  const existingQty = (await Cart.findOne({ user: req.user._id, "items.product": productId }, { "items.$": 1 }))
    ?.items?.[0]?.quantity || 0;
  if (product.stock < existingQty + Number(quantity)) {
    return validationError(res, { quantity: stockMessage(product) });
  }
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });
  const idx = cart.items.findIndex((i) => i.product.toString() === productId);
  if (idx >= 0) cart.items[idx].quantity += Number(quantity);
  else cart.items.push({ product: productId, quantity: Number(quantity) });
  await cart.save();
  cart = await populateCart(Cart.findById(cart._id));
  res.json(cart);
});

router.put("/items/:productId", auth, async (req, res) => {
  const { quantity } = req.body;
  if (!isNonNegativeInteger(quantity)) {
    return validationError(res, { quantity: "Quantity must be a whole number." });
  }
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ error: "Cart not found." });
  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) return res.status(404).json({ error: "Item not in cart." });
  if (Number(quantity) < 1) {
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  } else {
    const product = await Product.findById(req.params.productId);
    if (product && product.stock < quantity) {
      return validationError(res, { quantity: stockMessage(product) });
    }
    item.quantity = Number(quantity);
  }
  await cart.save();
  const updated = await populateCart(Cart.findById(cart._id));
  res.json(updated);
});

router.delete("/items/:productId", auth, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ error: "Cart not found." });
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  const updated = await populateCart(Cart.findById(cart._id));
  res.json(updated);
});

router.delete("/", auth, async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json({ message: "Cart cleared." });
});

module.exports = router;
