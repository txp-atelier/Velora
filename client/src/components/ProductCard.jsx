import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Plus, Eye, Flame } from "lucide-react";
import { formatINR, getDiscount, getProductId } from "../utils/format";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const LOW_STOCK_THRESHOLD = 15;

export default function ProductCard({ product, badge }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user, requireAuth } = useAuth();
  const { addToCart } = useCart();
  const [imgLoaded, setImgLoaded] = useState(false);
  const id = getProductId(product);
  const image = product.images?.[0] || product.image;
  const discount = getDiscount(product.price, product.originalPrice);
  const rating = product.ratingAverage ?? product.rating ?? 0;
  const isSeller = user?.role === "seller";
  const isLowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isSeller) return;
    requireAuth(() => addToCart(product), "login");
  };

  return (
    <article className="product-card">
      <div className="product-card-image">
        <Link to={`/products/${id}`} tabIndex={-1} aria-hidden="true">
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className={`fade-img ${imgLoaded ? "loaded" : ""}`}
            onLoad={() => setImgLoaded(true)}
          />
          <span className="quick-view-hint"><Eye size={14} /> Quick view</span>
        </Link>
        {badge && <span className="card-badge-pill">{badge}</span>}
        {discount > 0 && <span className={`discount-badge ${badge ? "stacked" : ""}`}>{discount}% off</span>}
        <button
          type="button"
          className={`wishlist-btn ${isWishlisted(product) ? "active" : ""}`}
          onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
          aria-label={isWishlisted(product) ? "Remove from wishlist" : "Add to wishlist"}
        >
          <span className="heart-icon">
            <Heart size={18} fill={isWishlisted(product) ? "currentColor" : "none"} />
          </span>
        </button>
      </div>

      <Link to={`/products/${id}`} className="product-card-link">
        <div className="product-card-body">
          <div className="product-card-meta">
            <span className="product-brand">{product.brand}</span>
            {rating > 0 && (
              <span className="product-rating">
                <Star size={12} fill="var(--color-warning)" stroke="var(--color-warning)" />
                {rating}
                {product.ratingCount > 0 && <span className="text-secondary">({product.ratingCount})</span>}
              </span>
            )}
          </div>
          <h3 className="product-name">{product.name}</h3>
          {isLowStock && (
            <span className="stock-urgency"><Flame size={11} /> Only {product.stock} left</span>
          )}
          <div className="product-card-footer">
            <div className="product-price">
              <span className="price-current">{formatINR(product.price)}</span>
              {product.originalPrice > product.price && (
                <span className="price-original">{formatINR(product.originalPrice)}</span>
              )}
            </div>
            <button
              type="button"
              className="quick-add-btn"
              onClick={handleAddToCart}
              disabled={isSeller}
              aria-label="Add to cart"
              title={isSeller ? "Seller accounts can't purchase items" : undefined}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}
