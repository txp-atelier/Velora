import { Clock, PackageCheck, Truck, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

export const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString("en-IN")}`;
};

export const getDiscount = (price, originalPrice) => {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export const getProductId = (product) =>
  product?.id || product?._id?.toString?.() || product?._id;

export const getStatusVariant = (status) => {
  switch (status) {
    case "delivered":
    case "confirmed":
      return "success";
    case "shipped":
      return "info";
    case "cancelled":
      return "error";
    case "returned":
      return "default";
    default:
      return "warning"; // pending
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case "confirmed":
      return PackageCheck;
    case "shipped":
      return Truck;
    case "delivered":
      return CheckCircle2;
    case "cancelled":
      return XCircle;
    case "returned":
      return RotateCcw;
    default:
      return Clock; // pending
  }
};

// The happy-path milestones shown in the order stepper. "pending" is
// momentary in this demo (instant fake payment) so it isn't shown as its
// own step; cancelled/returned break out of the stepper entirely.
export const ORDER_STEPS = ["confirmed", "shipped", "delivered"];

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const statusLabel = (status) => STATUS_LABELS[status] || status;

/** Mirrors the server's transition rules (server/routes/orders.js) so the
 * right actions show up per role without a round trip just to find out. */
export const nextOrderActions = (status, role) => {
  const actions = [];
  if (role === "seller") {
    if (status === "confirmed") actions.push({ status: "shipped", label: "Mark as shipped" });
    if (status === "shipped") actions.push({ status: "delivered", label: "Mark as delivered" });
    if (status === "pending" || status === "confirmed") {
      actions.push({ status: "cancelled", label: "Cancel order", danger: true });
    }
  }
  if (role === "customer") {
    if (status === "pending" || status === "confirmed") {
      actions.push({ status: "cancelled", label: "Cancel order", danger: true });
    }
    if (status === "delivered") actions.push({ status: "returned", label: "Return order", danger: true });
  }
  return actions;
};
