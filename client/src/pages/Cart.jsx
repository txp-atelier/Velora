import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, Store, AlertCircle } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatINR, getProductId } from "../utils/format";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import Button from "../components/ui/Button";
import IconButton from "../components/ui/IconButton";

export default function Cart() {
  const { items, loading, updateQuantity, removeFromCart } = useCart();
  const { user, setAuthModal } = useAuth();
  const [qtyErrors, setQtyErrors] = useState({});

  const changeQuantity = async (pid, nextQty) => {
    setQtyErrors((e) => ({ ...e, [pid]: undefined }));
    try {
      await updateQuantity(pid, nextQty);
    } catch (err) {
      setQtyErrors((e) => ({ ...e, [pid]: err.fields?.quantity || err.message }));
    }
  };

  if (!user) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Sign in to view your cart"
        message="Your cart is saved to your account once you sign in."
        action={<Button variant="accent" onClick={() => setAuthModal("login")}>Sign in</Button>}
      />
    );
  }

  if (user.role === "seller") {
    return (
      <EmptyState
        icon={Store}
        title="Seller accounts can't shop"
        message="You're signed in as a seller. Manage your listings from the Seller Dashboard instead."
        action={<Button variant="primary" to="/seller">Go to Seller Dashboard</Button>}
      />
    );
  }

  if (loading) return <div className="cart-page"><Skeleton height="300px" /></div>;

  const subtotal = items.reduce((sum, item) => {
    const p = item.product;
    return sum + (p?.price || 0) * item.quantity;
  }, 0);

  if (!items.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        message="Browse our collection and add items you love."
        action={<Button variant="accent" to="/">Start shopping</Button>}
      />
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => {
            const p = item.product;
            const pid = getProductId(p);
            const image = p?.images?.[0] || p?.image;
            const atStockLimit = p?.stock != null && item.quantity >= p.stock;
            return (
              <div key={pid} className="cart-item">
                <Link to={`/products/${pid}`} className="cart-item-image">
                  <img src={image} alt={p?.name} />
                </Link>
                <div className="cart-item-info">
                  <Link to={`/products/${pid}`}><h3>{p?.name}</h3></Link>
                  <p className="price-current">{formatINR(p?.price)}</p>
                  <div className="qty-controls">
                    <button onClick={() => changeQuantity(pid, item.quantity - 1)} aria-label="Decrease"><Minus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => changeQuantity(pid, item.quantity + 1)} aria-label="Increase" disabled={atStockLimit}><Plus size={14} /></button>
                  </div>
                  {(qtyErrors[pid] || atStockLimit) && (
                    <p className="field-error-text">
                      <AlertCircle size={13} /> {qtyErrors[pid] || `Only ${p.stock} left in stock.`}
                    </p>
                  )}
                </div>
                <div className="cart-item-side">
                  <IconButton
                    icon={Trash2}
                    label="Remove"
                    variant="danger"
                    className="cart-item-remove"
                    onClick={() => removeFromCart(pid)}
                  />
                  <div className="cart-item-total">
                    <span className="cart-item-total-label">Subtotal</span>
                    <span className="cart-item-total-amount">{formatINR((p?.price || 0) * item.quantity)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <aside className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className="summary-row"><span>Delivery</span><span className="text-success">FREE</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatINR(subtotal)}</span></div>
          <Button variant="accent" full to="/checkout">Proceed to Checkout</Button>
        </aside>
      </div>
    </div>
  );
}
