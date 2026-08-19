import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Minus, Plus, ShoppingCart, Zap, ThumbsUp, Heart } from "lucide-react";
import { productsApi, reviewsApi } from "../services/api";
import { formatINR, getDiscount, getProductId } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import OnboardingTooltip from "../components/OnboardingTooltip";
import BackButton from "../components/BackButton";
import FileUpload from "../components/FileUpload";
import Skeleton from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import Button from "../components/ui/Button";
import Textarea from "../components/ui/Textarea";
import Select from "../components/ui/Select";
import { MessageSquare } from "lucide-react";
import { minLength, maxLength } from "../utils/validation";
import { emptyImageState, finalizeImages, rollbackUploads } from "../utils/imageUpload";

const REVIEW_MIN_LENGTH = 10;
const REVIEW_MAX_LENGTH = 1000;

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, requireAuth } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [eligibility, setEligibility] = useState({ eligible: false, hasReviewed: false });
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewForm, setReviewForm] = useState({ rating: 0, text: "", images: emptyImageState() });
  const [reviewTouched, setReviewTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewFields, setReviewFields] = useState({});

  useEffect(() => {
    setLoading(true);
    productsApi.get(id).then((p) => {
      setProduct(p);
      setActiveImage(0);
    }).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    reviewsApi.list(id, reviewSort).then(setReviews).catch(() => setReviews([]));
  }, [id, reviewSort]);

  useEffect(() => {
    if (user) reviewsApi.eligibility(id).then(setEligibility).catch(() => {});
  }, [id, user]);

  if (loading) return <div className="detail-page"><Skeleton height="400px" /></div>;
  if (!product) return (
    <div className="detail-page">
      <BackButton fallback="/" />
      <EmptyState title="Product not found" message="This item may have been removed." />
    </div>
  );

  const images = product.images?.length ? product.images : [product.image];
  const discount = getDiscount(product.price, product.originalPrice);
  const breakdown = product.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const maxCount = Math.max(...Object.values(breakdown), 1);

  const isSeller = user?.role === "seller";
  const handleAddToCart = () => { if (!isSeller) requireAuth(() => addToCart(product, qty), "login"); };
  const handleBuyNow = () => { if (!isSeller) requireAuth(async () => {
    await addToCart(product, qty);
    navigate("/checkout");
  }, "login"); };

  const reviewFieldValid = {
    rating: reviewForm.rating >= 1,
    text: minLength(reviewForm.text, REVIEW_MIN_LENGTH) && maxLength(reviewForm.text, REVIEW_MAX_LENGTH),
  };
  const isReviewValid = () => reviewFieldValid.rating && reviewFieldValid.text;

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewTouched({ rating: true, text: true });
    if (!isReviewValid()) return;
    setReviewError("");
    setReviewFields({});
    setSubmitting(true);
    try {
      const { urls, newlyUploaded } = await finalizeImages(reviewForm.images);
      try {
        await reviewsApi.create({ productId: id, rating: reviewForm.rating, text: reviewForm.text.trim(), images: urls });
      } catch (saveErr) {
        await rollbackUploads(newlyUploaded);
        throw saveErr;
      }
      setReviewForm({ rating: 0, text: "", images: emptyImageState() });
      setReviewTouched({});
      setEligibility({ ...eligibility, hasReviewed: true });
      const updated = await productsApi.get(id);
      setProduct(updated);
      setReviews(await reviewsApi.list(id, reviewSort));
    } catch (err) {
      if (err.fields) setReviewFields(err.fields);
      else setReviewError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const markHelpful = (reviewId) => {
    requireAuth(() => {
      reviewsApi.helpful(reviewId).then((updated) => {
        setReviews((prev) => prev.map((r) => (
          r._id === reviewId ? { ...r, helpfulCount: updated.helpfulCount, helpfulByMe: updated.helpfulByMe } : r
        )));
      });
    }, "login");
  };

  return (
    <div className="detail-page">
      <BackButton fallback="/" />
      <div className="detail-grid">
        <div className="detail-gallery">
          <div className="gallery-main">
            <img key={activeImage} src={images[activeImage]} alt={product.name} />
            <button
              type="button"
              className={`wishlist-btn lg ${isWishlisted(product) ? "active" : ""}`}
              onClick={() => toggleWishlist(product)}
              aria-label={isWishlisted(product) ? "Remove from wishlist" : "Add to wishlist"}
            >
              <span className="heart-icon">
                <Heart size={20} fill={isWishlisted(product) ? "currentColor" : "none"} />
              </span>
            </button>
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <button key={i} className={i === activeImage ? "active" : ""} onClick={() => setActiveImage(i)}>
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <p className="product-brand">{product.brand}</p>
          <h1>{product.name}</h1>
          <div className="detail-rating">
            <Star size={18} fill="var(--color-warning)" stroke="var(--color-warning)" />
            <span>{product.ratingAverage ?? 0}</span>
            <span className="text-secondary">({product.ratingCount || 0} reviews)</span>
          </div>
          <div className="detail-price">
            <span className="price-current">{formatINR(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="price-original">{formatINR(product.originalPrice)}</span>
                <span className="discount-badge">{discount}% off</span>
              </>
            )}
          </div>
          <p className="detail-desc">{product.description}</p>
          <p className={product.stock > 0 ? "stock-in" : "stock-out"}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          {product.stock > 0 && (
            <div className="qty-selector">
              <span>Quantity</span>
              <div className="qty-controls">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease" disabled={qty <= 1}><Minus size={16} /></button>
                <span>{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Increase" disabled={qty >= product.stock}><Plus size={16} /></button>
              </div>
              {qty >= product.stock && <span className="text-secondary text-sm">Only {product.stock} left in stock</span>}
            </div>
          )}
          {isSeller && <p className="text-secondary text-sm">Seller accounts can't purchase items — sign in with a customer account to buy.</p>}
          <OnboardingTooltip id="add_to_cart" title="Add to your cart" message="Sign in when prompted — your cart saves to your account.">
            <div className="detail-actions">
              <Button variant="accent" onClick={handleAddToCart} disabled={!product.stock || isSeller}>
                <ShoppingCart size={18} /> Add to Cart
              </Button>
              <Button variant="primary" onClick={handleBuyNow} disabled={!product.stock || isSeller}>
                <Zap size={18} /> Buy Now
              </Button>
            </div>
          </OnboardingTooltip>
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="specs-table">
              <h3>Specifications</h3>
              <table>
                <tbody>
                  {Object.entries(product.specs).map(([k, v]) => (
                    <tr key={k}><td>{k}</td><td>{v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <section className="reviews-section">
        <h2>Customer Reviews</h2>
        <div className="reviews-summary">
          <div className="rating-overview">
            <span className="rating-big">{product.ratingAverage ?? 0}</span>
            <div className="stars-row">
              {[5, 4, 3, 2, 1].map((n) => (
                <div key={n} className="rating-bar-row">
                  <span>{n}</span>
                  <Star size={12} fill="var(--color-warning)" stroke="var(--color-warning)" />
                  <div className="rating-bar"><div style={{ width: `${((breakdown[n] || 0) / maxCount) * 100}%` }} /></div>
                  <span className="text-secondary">{breakdown[n] || 0}</span>
                </div>
              ))}
            </div>
          </div>
          {user && eligibility.eligible && !eligibility.hasReviewed && (
            <form className="review-form card" onSubmit={submitReview} noValidate>
              <h3>Write a review</h3>
              <div
                className="star-input"
                onBlur={() => setReviewTouched((t) => ({ ...t, rating: true }))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n} type="button"
                    onClick={() => { setReviewForm({ ...reviewForm, rating: n }); setReviewTouched((t) => ({ ...t, rating: true })); setReviewFields((f) => ({ ...f, rating: undefined })); }}
                    aria-label={`${n} stars`}
                  >
                    <Star size={24} fill={n <= reviewForm.rating ? "var(--color-warning)" : "none"} stroke="var(--color-warning)" />
                  </button>
                ))}
              </div>
              {(reviewFields.rating || (reviewTouched.rating && !reviewFieldValid.rating)) && (
                <p className="field-error-text">{reviewFields.rating || "Choose a star rating from 1 to 5."}</p>
              )}
              <Textarea
                placeholder="Share your experience with this product"
                value={reviewForm.text}
                onChange={(e) => { setReviewForm({ ...reviewForm, text: e.target.value }); if (reviewFields.text) setReviewFields((f) => ({ ...f, text: undefined })); }}
                onBlur={() => setReviewTouched((t) => ({ ...t, text: true }))}
                error={reviewFields.text || (reviewTouched.text && !reviewFieldValid.text ? `Reviews must be ${REVIEW_MIN_LENGTH}-${REVIEW_MAX_LENGTH} characters.` : undefined)}
                hint={!reviewTouched.text ? `${reviewForm.text.length}/${REVIEW_MAX_LENGTH} — at least ${REVIEW_MIN_LENGTH} characters` : undefined}
                required
                rows={4}
                maxLength={REVIEW_MAX_LENGTH}
              />
              <FileUpload value={reviewForm.images} onChange={(images) => setReviewForm({ ...reviewForm, images })} max={3} disabled={submitting} />
              {reviewError && <p className="form-error">{reviewError}</p>}
              <Button
                type="submit" variant="primary" loading={submitting}
                disabled={Object.keys(reviewTouched).length > 0 && !isReviewValid()}
                title={Object.keys(reviewTouched).length > 0 && !isReviewValid() ? "Add a rating and at least 10 characters" : undefined}
              >
                {submitting ? "Submitting…" : "Submit review"}
              </Button>
            </form>
          )}
          {user && !eligibility.eligible && (
            <p className="text-secondary">Purchase this product to leave a review.</p>
          )}
        </div>
        <div className="reviews-list-header">
          <span>{reviews.length} reviews</span>
          <Select value={reviewSort} onChange={(e) => setReviewSort(e.target.value)} aria-label="Sort reviews">
            <option value="newest">Newest</option>
            <option value="helpful">Most helpful</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </Select>
        </div>
        {reviews.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No reviews yet" message="Be the first to share your thoughts after purchasing." />
        ) : (
          <div className="reviews-list">
            {reviews.map((r) => (
              <article key={r._id} className="review-card">
                <div className="review-header">
                  <strong>{r.buyer?.name || "Customer"}</strong>
                  <div className="review-stars">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={14} fill="var(--color-warning)" stroke="var(--color-warning)" />
                    ))}
                  </div>
                </div>
                <p>{r.text}</p>
                {r.images?.length > 0 && (
                  <div className="review-images">
                    {r.images.map((img) => <img key={img} src={img} alt="Review" />)}
                  </div>
                )}
                <button
                  className={`helpful-btn ${r.helpfulByMe ? "active" : ""}`}
                  onClick={() => markHelpful(r._id)}
                >
                  <ThumbsUp size={14} fill={r.helpfulByMe ? "currentColor" : "none"} /> Helpful ({r.helpfulCount || 0})
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
