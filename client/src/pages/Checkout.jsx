import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle, Check, CreditCard, Smartphone, User, MapPin,
  Phone, Home, Landmark, Building2, Flag, Hash, ShoppingBag,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ordersApi } from "../services/api";
import { formatINR, getProductId } from "../utils/format";
import { isValidName, isValidPhone, isValidPincode } from "../utils/validation";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import RadioCard from "../components/ui/RadioCard";

const ADDRESS_RULES = {
  fullName: { test: isValidName, message: "Enter a valid full name (letters only)." },
  phone: { test: isValidPhone, message: "Enter a valid 10-digit mobile number." },
  addressLine1: { test: (v) => v.trim().length > 0, message: "Address line 1 is required." },
  city: { test: isValidName, message: "Enter a valid city (letters only)." },
  state: { test: isValidName, message: "Enter a valid state (letters only)." },
  pincode: { test: isValidPincode, message: "Enter a valid 6-digit PIN code." },
};

const CHECKOUT_STEPS = [
  { n: 1, label: "Shipping" },
  { n: 2, label: "Summary" },
  { n: 3, label: "Payment" },
];

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);
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
                  <Input label="Card number" placeholder="4111 1111 1111 1111" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                  <div className="card-row">
                    <Input label="Expiry" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                    <Input label="CVV" placeholder="123" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
                  </div>
                </div>
              )}
              {paymentMethod === "upi" && (
                <p className="text-secondary">Enter any UPI ID — demo mode accepts all inputs.</p>
              )}
              <div className="checkout-nav">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button variant="accent" onClick={placeOrder} loading={loading}>
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
