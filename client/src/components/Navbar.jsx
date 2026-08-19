import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShoppingCart, Heart, User, Store, Package, LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import IconButton from "./ui/IconButton";
import SearchBar from "./SearchBar";
import Logo from "./Logo";

export default function Navbar() {
  const { user, logout, setAuthModal } = useAuth();
  const { cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { showToast } = useToast();
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();
  const [cartBump, setCartBump] = useState(false);
  const prevCartCount = useRef(cartCount);

  useEffect(() => {
    const increased = cartCount > prevCartCount.current;
    prevCartCount.current = cartCount;
    if (increased) {
      setCartBump(true);
      const t = setTimeout(() => setCartBump(false), 400);
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  const handleLogout = () => {
    const firstName = user?.name?.split(" ")[0];
    logout();
    setAccountOpen(false);
    showToast(firstName ? `Signed out — see you soon, ${firstName}!` : "Signed out successfully.");
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-mark"><Logo size={20} /></span>
          <span className="logo-text">Velora</span>
        </Link>
        <SearchBar />
        <div className="navbar-actions">
          <Link to="/wishlist" className={`icon-btn ${location.pathname === "/wishlist" ? "active" : ""}`} aria-label="Wishlist">
            <Heart size={20} />
            {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
          </Link>
          {user?.role !== "seller" && (
            <Link to="/cart" className={`icon-btn ${cartBump ? "bump" : ""} ${location.pathname === "/cart" ? "active" : ""}`} aria-label="Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className={`badge ${cartBump ? "bump" : ""}`}>{cartCount}</span>}
            </Link>
          )}
          <div className="account-menu-wrap">
            <IconButton icon={User} label="Account" onClick={() => setAccountOpen(!accountOpen)} />
            {accountOpen && (
              <div className="account-dropdown" onMouseLeave={() => setAccountOpen(false)}>
                {user ? (
                  <>
                    <p className="account-greeting">Hello, {user.name}</p>
                    {user.role === "seller" ? (
                      <Link to="/seller" onClick={() => setAccountOpen(false)}><Store size={16} /> Seller Dashboard</Link>
                    ) : (
                      <Link to="/dashboard" onClick={() => setAccountOpen(false)}><Package size={16} /> My Orders</Link>
                    )}
                    <div className="account-dropdown-divider" />
                    <button onClick={handleLogout}><LogOut size={16} /> Sign out</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setAuthModal("login"); setAccountOpen(false); }}>Sign in</button>
                    <button onClick={() => { setAuthModal("signup"); setAccountOpen(false); }}>Create account</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
