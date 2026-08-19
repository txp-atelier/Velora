const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const { auth, requireRole } = require("../middleware/auth");
const { isValidName, isValidPhone, isValidPincode, validationError } = require("../utils/validators");

const router = express.Router();

const RETURN_WINDOW_DAYS = 7;

// A real order lifecycle: happy path pending -> confirmed -> shipped ->
// delivered -> (optionally) returned, with cancellation only possible
// before it ships. Enforced here — the source of truth — not just hidden
// in the UI.
const TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

const canTransition = (nextStatus, role) => {
  switch (nextStatus) {
    case "shipped":
    case "delivered":
      return role === "seller";
    case "cancelled":
      return role === "seller" || role === "customer";
    case "returned":
      return role === "customer";
    default:
      return false;
  }
};

const validateShippingAddress = (address = {}) => {
  const fields = {};
  if (!address.fullName || !isValidName(address.fullName)) {
    fields.fullName = "Enter a valid full name (letters only).";
  }
  if (!address.phone || !isValidPhone(address.phone)) {
    fields.phone = "Enter a valid 10-digit mobile number.";
  }
  if (!address.addressLine1 || !address.addressLine1.trim()) {
    fields.addressLine1 = "Address line 1 is required.";
  }
  if (!address.city || !isValidName(address.city)) {
    fields.city = "Enter a valid city (letters only).";
  }
  if (!address.state || !isValidName(address.state)) {
    fields.state = "Enter a valid state (letters only).";
  }
  if (!address.pincode || !isValidPincode(address.pincode)) {
    fields.pincode = "Enter a valid 6-digit PIN code.";
  }
  return fields;
};

router.get("/", auth, async (req, res) => {
  let orders;
  if (req.user.role === "seller") {
    const sellerProducts = await Product.find({ seller: req.user._id }).select("_id");
    const productIds = sellerProducts.map((p) => p._id);
    orders = await Order.find({ "items.product": { $in: productIds } })
      .populate("customer", "name email")
      .populate("items.product", "name seller")
      .sort({ createdAt: -1 });
  } else {
    orders = await Order.find({ customer: req.user._id })
      .populate("items.product", "name images")
      .sort({ createdAt: -1 });
  }
  res.json(orders);
});

router.post("/", auth, requireRole("customer"), async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    if (!items?.length) return res.status(400).json({ error: "Your cart is empty." });

    const addressFields = validateShippingAddress(shippingAddress);
    if (Object.keys(addressFields).length) return validationError(res, addressFields);

    if (paymentMethod && !["card", "upi", "cod"].includes(paymentMethod)) {
      return validationError(res, { paymentMethod: "Choose a valid payment method." });
    }

    let total = 0;
    const orderItems = [];
    for (const item of items) {
      if (!isFinite(item.quantity) || item.quantity < 1) {
        return validationError(res, { items: "Item quantities must be at least 1." });
      }
      const product = await Product.findById(item.productId || item.product);
      if (!product) return res.status(400).json({ error: "Product not found." });
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Only ${product.stock} of ${product.name} left in stock.`,
          fields: { items: `Only ${product.stock} of ${product.name} left in stock.` },
        });
      }
      product.stock -= item.quantity;
      product.popularity += item.quantity;
      await product.save();
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || "",
      });
      total += product.price * item.quantity;
    }

    // This demo's payment is instant, so the order passes through
    // "pending" and lands on "confirmed" right away — but it genuinely
    // goes through the same lifecycle step a real async payment would.
    const now = new Date();
    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      total,
      shippingAddress,
      paymentMethod: paymentMethod || "card",
      status: "confirmed",
      statusHistory: [
        { status: "pending", at: now },
        { status: "confirmed", at: now },
      ],
    });

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.status(201).json(order);
  } catch (err) {
    if (err.name === "ValidationError") {
      const fields = {};
      Object.entries(err.errors).forEach(([path, e]) => {
        fields[path.replace("shippingAddress.", "")] = e.message;
      });
      return validationError(res, fields);
    }
    res.status(500).json({ error: "Could not place order. Please try again." });
  }
});

router.get("/:id", auth, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customer", "name email")
    .populate("items.product", "name seller images");
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (
    req.user.role === "customer" &&
    order.customer._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ error: "Access denied." });
  }
  res.json(order);
});

router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status: nextStatus } = req.body;
    if (!nextStatus || !Object.keys(TRANSITIONS).includes(nextStatus)) {
      return validationError(res, { status: "Choose a valid order status." });
    }

    const order = await Order.findById(req.params.id).populate("items.product", "seller");
    if (!order) return res.status(404).json({ error: "Order not found." });

    const isOwner = order.customer.toString() === req.user._id.toString();
    const sellsAnItem = order.items.some((i) => i.product?.seller?.toString() === req.user._id.toString());
    if (req.user.role === "customer" && !isOwner) {
      return res.status(403).json({ error: "Access denied." });
    }
    if (req.user.role === "seller" && !sellsAnItem) {
      return res.status(403).json({ error: "Access denied." });
    }

    const allowed = TRANSITIONS[order.status] || [];
    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({
        error: `This order is "${order.status}" and can't move to "${nextStatus}".`,
      });
    }
    if (!canTransition(nextStatus, req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to make this change." });
    }
    if (nextStatus === "returned") {
      const deliveredEntry = [...order.statusHistory].reverse().find((h) => h.status === "delivered");
      const deliveredAt = deliveredEntry?.at || order.updatedAt;
      const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > RETURN_WINDOW_DAYS) {
        return res.status(400).json({
          error: `Returns are only accepted within ${RETURN_WINDOW_DAYS} days of delivery.`,
        });
      }
    }

    order.status = nextStatus;
    order.statusHistory.push({ status: nextStatus, at: new Date() });
    await order.save();

    if (nextStatus === "cancelled" || nextStatus === "returned") {
      await Promise.all(order.items.map((item) =>
        Product.findByIdAndUpdate(item.product?._id || item.product, { $inc: { stock: item.quantity } })
      ));
    }

    const populated = await Order.findById(order._id)
      .populate("customer", "name email")
      .populate("items.product", "name seller images");
    res.json(populated);
  } catch {
    res.status(500).json({ error: "Could not update order status." });
  }
});

module.exports = router;
