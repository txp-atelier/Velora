import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  CheckCircle, Check, CreditCard, Smartphone, User, MapPin,
  Phone, Home, Landmark, Building2, Flag, Hash, ShoppingBag, Share2, Copy,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ordersApi } from "../services/api";
import { formatINR, getProductId } from "../utils/format";
import {
  isValidName, isValidPhone, isValidPincode, isValidUpiId,
  isValidCardNumber, isValidExpiry, isValidCvv,
} from "../utils/validation";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import RadioCard from "../components/ui/RadioCard";

const MERCHANT_UPI_ID = "velora@upi";
const MERCHANT_NAME = "Velora";

const ADDRESS_RULES = {
  fullName: { test: isValidName, message: "Enter a valid full name (letters only)." },
  phone: { test: isValidPhone, message: "Enter a valid 10-digit mobile number." },
  addressLine1: { test: (v) => v.trim().length > 0, message: "Address line 1 is required." },
  city: { test: isValidName, message: "Enter a valid city (letters only)." },
  state: { test: isValidName, message: "Enter a valid state (letters only)." },
  pincode: { test: isValidPincode, message: "Enter a valid 6-digit PIN code." },
};

const CARD_RULES = {
  number: { test: isValidCardNumber, message: "Enter a valid card number." },
  expiry: { test: isValidExpiry, message: "Enter a valid, non-expired date (MM/YY)." },
  cvv: { test: isValidCvv, message: "Enter a valid 3-digit CVV." },
};

// Auto-inserts the "/" as the shopper types and keeps the month in 01–12 —
// the same live-formatting real checkout pages use, so a typo can't even
// be entered rather than being caught only after the fact.
const formatExpiryInput = (raw) => {
  let digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`;
  if (digits.length >= 2) {
    const mm = Math.min(Math.max(Number(digits.slice(0, 2)), 1), 12).toString().padStart(2, "0");
    digits = mm + digits.slice(2);
  }
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

const formatCardNumberInput = (raw) => {
  const digits = raw.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
};

const formatCvvInput = (raw) => raw.replace(/\D/g, "").slice(0, 3);

const CHECKOUT_STEPS = [
  { n: 1, label: "Shipping" },
  { n: 2, label: "Summary" },
  { n: 3, label: "Payment" },
];

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [upiId, setUpiId] = useState("");
  const [upiTouched, setUpiTouched] = useState(false);
  const qrCanvasRef = useRef(null);
  const [address, setAddress] = useState({
    fullName: user?.name || "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [touched, setTouched] = useState({});
  const [serverFields, setServerFields] = useState({});
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [cardTouched, setCardTouched] = useState({});
  const [pincodeStatus, setPincodeStatus] = useState("idle"); // idle | loading | found | notfound

  // Auto-fill city/state from the PIN code so shoppers don't have to type
  // them by hand — the two fields stay editable in case the lookup is wrong.
  useEffect(() => {
    const pin = address.pincode.trim();
    if (!isValidPincode(pin)) {
      setPincodeStatus("idle");
      return;
    }
    let cancelled = false;
    setPincodeStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (cancelled) return;
        const postOffice = data?.[0]?.PostOffice?.[0];
        if (data?.[0]?.Status === "Success" && postOffice) {
          setPincodeStatus("found");
          setAddress((a) => ({
            ...a,
            city: a.city.trim() ? a.city : postOffice.District,
            state: a.state.trim() ? a.state : postOffice.State,
          }));
          setTouched((t) => ({ ...t, city: true, state: true }));
        } else {
          setPincodeStatus("notfound");
        }
      } catch {
        if (!cancelled) setPincodeStatus("notfound");
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address.pincode]);

  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  if (!user) { navigate("/cart"); return null; }
  if (user.role === "seller") { navigate("/cart"); return null; }
  if (!items.length && !orderId) { navigate("/cart"); return null; }

  if (orderId) {
    return (
      <div className="checkout-success">
        <CheckCircle size={64} className="success-icon" />
        <h1>Order placed successfully!</h1>
        <p>Your order ID is <strong>{orderId}</strong>. This is a demo — no real payment was processed.</p>
        <div className="demo-note">
          <strong>Demo note:</strong> Payment is a placeholder. Orders are saved to MongoDB for testing.
        </div>
        <Button variant="primary" onClick={() => navigate("/dashboard")}>View my orders</Button>
        <Button variant="outline" onClick={() => navigate("/")}>Continue shopping</Button>
      </div>
    );
  }

  const setField = (key, value) => {
    setAddress((a) => ({ ...a, [key]: value }));
    if (serverFields[key]) setServerFields((f) => ({ ...f, [key]: undefined }));
  };
  const markTouched = (key) => setTouched((t) => ({ ...t, [key]: true }));
  const fieldValid = (key) => ADDRESS_RULES[key].test(address[key] || "");
  const errorFor = (key) => serverFields[key] || (touched[key] && !fieldValid(key) ? ADDRESS_RULES[key].message : undefined);
  const isAddressValid = () => Object.keys(ADDRESS_RULES).every(fieldValid);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setTouched(Object.fromEntries(Object.keys(ADDRESS_RULES).map((k) => [k, true])));
    if (isAddressValid()) setStep(2);
  };

  const setCardField = (key, formatter) => (e) => setCard((c) => ({ ...c, [key]: formatter(e.target.value) }));
  const markCardTouched = (key) => setCardTouched((t) => ({ ...t, [key]: true }));
  const cardFieldValid = (key) => CARD_RULES[key].test(card[key] || "");
  const cardErrorFor = (key) => (cardTouched[key] && !cardFieldValid(key) ? CARD_RULES[key].message : undefined);
  const isCardValid = () => Object.keys(CARD_RULES).every(cardFieldValid);

  // UPI ID is optional — the QR code above is a valid way to pay too (e.g.
  // a friend scans it), so only block submission if the shopper actually
  // typed something and it doesn't look like a real VPA.
  const isUpiValid = () => !upiId.trim() || isValidUpiId(upiId);

  const handlePlaceOrderClick = () => {
    if (paymentMethod === "card") {
      setCardTouched({ number: true, expiry: true, cvv: true });
      if (!isCardValid()) return;
    } else if (paymentMethod === "upi") {
      setUpiTouched(true);
      if (!isUpiValid()) return;
    }
    placeOrder();
  };

  // Standard UPI deep link — any UPI app can scan/open this to pay the
  // order amount directly, so it can be shared with someone paying for you.
  const upiLink = `upi://pay?pa=${encodeURIComponent(MERCHANT_UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${subtotal}&cu=INR&tn=${encodeURIComponent(`Velora order - ${items.length} item(s)`)}`;

  const getQrPngBlob = () =>
    new Promise((resolve) => {
      const canvas = qrCanvasRef.current;
      if (!canvas) return resolve(null);
      canvas.toBlob(resolve, "image/png");
    });

  const handleShareQr = async () => {
    try {
      const blob = await getQrPngBlob();
      const file = blob ? new File([blob], "velora-upi-qr.png", { type: "image/png" }) : null;
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Velora payment QR",
          text: `Pay ${formatINR(subtotal)} via UPI for my Velora order.`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "Velora payment QR",
          text: `Pay ${formatINR(subtotal)} via UPI for my Velora order: ${upiLink}`,
        });
      } else {
        await navigator.clipboard.writeText(upiLink);
        showToast("UPI payment link copied — share it with your friend!");
      }
    } catch (err) {
      if (err?.name !== "AbortError") showToast("Couldn't share the QR — try copying the link instead.");
    }
  };

  const handleCopyUpiLink = async () => {
    try {
      await navigator.clipboard.writeText(upiLink);
      showToast("UPI payment link copied to clipboard!");
    } catch {
      showToast("Couldn't copy the link.");
    }
  };

  const placeOrder = async () => {
    setError("");
    setLoading(true);
    try {
      const order = await ordersApi.create({
        items: items.map((i) => ({ productId: getProductId(i.product), quantity: i.quantity })),
        shippingAddress: address,
        paymentMethod,
      });
      await clearCart();
      setOrderId(order._id);
    } catch (err) {
      if (err.fields) {
        setServerFields(err.fields);
        setStep(1);
        setTouched(Object.fromEntries(Object.keys(ADDRESS_RULES).map((k) => [k, true])));
        setError("Please fix your shipping address and try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <ol className="checkout-steps">
        {CHECKOUT_STEPS.map((s, i) => (
          <li key={s.n} className={`checkout-step ${step === s.n ? "active" : ""} ${step > s.n ? "done" : ""}`}>
            <span className="checkout-step-circle">{step > s.n ? <Check size={14} /> : s.n}</span>
            <span className="checkout-step-label">{s.label}</span>
            {i < CHECKOUT_STEPS.length - 1 && (
              <span className={`checkout-step-line ${step > s.n ? "filled" : ""}`} aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
      {error && <p className="form-error">{error}</p>}
      <div className="checkout-layout">
        <div className="checkout-main">
          {step === 1 && (
            <form className="checkout-form" onSubmit={handleAddressSubmit} noValidate>
              <h2>Shipping Address</h2>

              <div className="checkout-form-section">
                <h3 className="checkout-form-section-title">
                  <span className="checkout-form-section-icon"><User size={16} /></span> Contact details
                </h3>
                <div className="form-row">
                  <Input
                    label="Full name"
                    icon={User}
                    value={address.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    onBlur={() => markTouched("fullName")}
                    error={errorFor("fullName")}
                    success={touched.fullName && fieldValid("fullName")}
                    required
                  />
                  <Input
                    label="Phone number"
                    type="tel"
                    inputMode="numeric"
                    icon={Phone}
                    placeholder="10-digit mobile number"
                    value={address.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    onBlur={() => markTouched("phone")}
                    error={errorFor("phone")}
                    success={touched.phone && fieldValid("phone")}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="checkout-form-section">
                <h3 className="checkout-form-section-title">
                  <span className="checkout-form-section-icon"><MapPin size={16} /></span> Delivery address
                </h3>
                <Input
                  label="Address line 1"
                  icon={Home}
                  placeholder="House no., building, street"
                  value={address.addressLine1}
                  onChange={(e) => setField("addressLine1", e.target.value)}
                  onBlur={() => markTouched("addressLine1")}
                  error={errorFor("addressLine1")}
                  success={touched.addressLine1 && fieldValid("addressLine1")}
                  required
                />
                <Input
                  label="Address line 2"
                  icon={Landmark}
                  placeholder="Apartment, landmark"
                  hint="Optional"
                  value={address.addressLine2}
                  onChange={(e) => setField("addressLine2", e.target.value)}
                />
                <div className="form-row-3">
                  <Input
                    label="City"
                    icon={Building2}
                    value={address.city}
                    onChange={(e) => setField("city", e.target.value)}
                    onBlur={() => markTouched("city")}
                    error={errorFor("city")}
                    success={touched.city && fieldValid("city")}
                    required
                  />
                  <Input
                    label="State"
                    icon={Flag}
                    value={address.state}
                    onChange={(e) => setField("state", e.target.value)}
                    onBlur={() => markTouched("state")}
                    error={errorFor("state")}
                    success={touched.state && fieldValid("state")}
                    required
                  />
                  <Input
                    label="PIN code"
                    icon={Hash}
                    inputMode="numeric"
                    placeholder="6-digit"
                    value={address.pincode}
                    onChange={(e) => setField("pincode", e.target.value)}
                    onBlur={() => markTouched("pincode")}
                    error={errorFor("pincode")}
                    success={touched.pincode && fieldValid("pincode")}
                    hint={
                      pincodeStatus === "loading" ? "Detecting…"
                        : pincodeStatus === "found" ? "City & state confirmed"
                        : undefined
                    }
                    required
                  />
                </div>
              </div>

              <Button
                type="submit" variant="primary" full
                disabled={Object.keys(touched).length > 0 && !isAddressValid()}
                title={Object.keys(touched).length > 0 && !isAddressValid() ? "Fix the highlighted fields to continue" : undefined}
              >
                Continue to summary
              </Button>
            </form>
          )}
          {step === 2 && (
            <div className="checkout-summary-step">
              <h2>Order Summary</h2>
              {items.map((item, idx) => {
                const p = item.product;
                const image = p?.images?.[0] || p?.image;
                const isLast = items.length - 1 === idx;
                return (
                  <div key={getProductId(p)} className={`checkout-item ${isLast ? "checkout-item-last" : ""}`}>
                    <img className="checkout-item-image" src={image} alt="" loading="lazy" />
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{p?.name}</span>
                      <span className="checkout-item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="checkout-item-price">{formatINR((p?.price || 0) * item.quantity)}</span>
                  </div>
                );
              })}
              <div className="summary-row total"><span>Total</span><span>{formatINR(subtotal)}</span></div>
              <div className="checkout-nav">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" onClick={() => setStep(3)}>Continue to payment</Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="payment-step">
              <h2>Payment (Demo)</h2>
              <p className="demo-note">This is a placeholder payment flow. No real charges will be made.</p>
              <div className="radio-card-group payment-options">
                <RadioCard
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  icon={CreditCard}
                  label="Card"
                />
                <RadioCard
                  name="payment"
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                  icon={Smartphone}
                  label="UPI"
                />
              </div>
              {paymentMethod === "card" && (
                <div className="card-form">
                  <Input
                    label="Card number"
                    placeholder="4111 1111 1111 1111"
                    inputMode="numeric"
                    maxLength={23}
                    value={card.number}
                    onChange={setCardField("number", formatCardNumberInput)}
                    onBlur={() => markCardTouched("number")}
                    error={cardErrorFor("number")}
                    success={cardTouched.number && cardFieldValid("number")}
                    hint={!cardTouched.number ? "Demo mode — try test card 4111 1111 1111 1111." : undefined}
                    required
                  />
                  <div className="card-row">
                    <Input
                      label="Expiry"
                      placeholder="MM/YY"
                      inputMode="numeric"
                      maxLength={5}
                      value={card.expiry}
                      onChange={setCardField("expiry", formatExpiryInput)}
                      onBlur={() => markCardTouched("expiry")}
                      error={cardErrorFor("expiry")}
                      success={cardTouched.expiry && cardFieldValid("expiry")}
                      required
                    />
                    <Input
                      label="CVV"
                      placeholder="123"
                      inputMode="numeric"
                      maxLength={3}
                      value={card.cvv}
                      onChange={setCardField("cvv", formatCvvInput)}
                      onBlur={() => markCardTouched("cvv")}
                      error={cardErrorFor("cvv")}
                      success={cardTouched.cvv && cardFieldValid("cvv")}
                      required
                    />
                  </div>
                </div>
              )}
              {paymentMethod === "upi" && (
                <div className="upi-panel">
                  <div className="upi-qr-card">
                    <div className="upi-qr-code">
                      <QRCodeCanvas ref={qrCanvasRef} value={upiLink} size={168} level="M" bgColor="#ffffff" fgColor="#0F172A" />
                    </div>
                    <div className="upi-qr-meta">
                      <p className="upi-qr-title">Scan to pay {formatINR(subtotal)}</p>
                      <p className="upi-qr-hint">
                        Open any UPI app and scan this code, or share it with a friend or
                        family member who's paying on your behalf.
                      </p>
                      <div className="upi-qr-actions">
                        <Button type="button" variant="outline" size="sm" onClick={handleShareQr}>
                          <Share2 size={14} /> Share QR
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handleCopyUpiLink}>
                          <Copy size={14} /> Copy link
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="upi-divider"><span>or pay with your UPI ID</span></div>

                  <Input
                    label="Your UPI ID"
                    icon={Smartphone}
                    placeholder="yourname@bank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    onBlur={() => setUpiTouched(true)}
                    error={upiTouched && !isUpiValid() ? "Enter a valid UPI ID, e.g. name@okhdfcbank." : undefined}
                    success={upiTouched && upiId.trim() && isUpiValid()}
                    hint="Optional if you're paying via the QR code above."
                  />
                </div>
              )}
              <div className="checkout-nav">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button
                  variant="accent" onClick={handlePlaceOrderClick} loading={loading}
                  disabled={
                    (paymentMethod === "card" && Object.keys(cardTouched).length > 0 && !isCardValid()) ||
                    (paymentMethod === "upi" && upiTouched && !isUpiValid())
                  }
                  title={
                    paymentMethod === "card" && Object.keys(cardTouched).length > 0 && !isCardValid()
                      ? "Fix the highlighted card details to continue"
                      : paymentMethod === "upi" && upiTouched && !isUpiValid()
                        ? "Fix your UPI ID, or leave it blank to pay via the QR code"
                        : undefined
                  }
                >
                  {loading ? "Placing order…" : `Pay ${formatINR(subtotal)}`}
                </Button>
              </div>
            </div>
          )}
        </div>
        <aside className="checkout-sidebar">
          <div className="checkout-sidebar-header">
            <div className="checkout-sidebar-info">
              <span className="checkout-sidebar-info-icon"><ShoppingBag size={16} /></span>
              <div>
                <h3>Your order</h3>
                <p>{items.length} item(s)</p>
              </div>
            </div>
            <div className="checkout-sidebar-total">
              <span className="checkout-sidebar-total-label">Total</span>
              <span className="checkout-sidebar-total-amount">{formatINR(subtotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
