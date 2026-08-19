import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import Toast from "./components/Toast";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import SellerDashboard from "./pages/SellerDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import Wishlist from "./pages/Wishlist";
import InfoPage from "./pages/InfoPage";

// Old bookmarks/links to the standalone listing page still work — they just
// forward straight into "/" with the same query, where Home renders the
// results view itself. There's no /products route that lists everything.
function LegacyProductsRedirect() {
  const location = useLocation();
  return <Navigate to={`/${location.search}`} replace />;
}

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Router>
                <ScrollToTop />
                <div className="app">
                  <Navbar />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<LegacyProductsRedirect />} />
                      <Route path="/products/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/seller" element={<SellerDashboard />} />
                      <Route path="/dashboard" element={<CustomerDashboard />} />
                      <Route path="/info/:slug" element={<InfoPage />} />
                    </Routes>
                  </main>
                  <Footer />
                  <AuthModal />
                  <Toast />
                </div>
              </Router>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
