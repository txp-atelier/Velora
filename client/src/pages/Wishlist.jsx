import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { productsApi } from "../services/api";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import { ProductGridSkeleton } from "../components/Skeleton";
import Button from "../components/ui/Button";

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wishlist.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.allSettled(wishlist.map((id) => productsApi.get(id)))
      .then((results) => {
        setProducts(results.filter((r) => r.status === "fulfilled").map((r) => r.value));
      })
      .finally(() => setLoading(false));
  }, [wishlist]);

  return (
    <div className="wishlist-page">
      <h1>My Wishlist</h1>
      <p className="text-secondary page-subtitle">Products you have liked, all in one place</p>
      {loading ? (
        <ProductGridSkeleton count={wishlist.length || 4} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="You haven't liked any products yet"
          message="Start exploring and tap the heart on any product to save it here."
          action={<Button variant="accent" to="/">Start exploring</Button>}
        />
      ) : (
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id || p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
