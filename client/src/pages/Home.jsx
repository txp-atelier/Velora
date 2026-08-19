import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HomeBanner from "../components/HomeBanner";
import ProductCard from "../components/ProductCard";
import ProductListing from "./ProductListing";
import { ProductGridSkeleton } from "../components/Skeleton";
import { productsApi } from "../services/api";

const categories = [
  { name: "Electronics", slug: "Electronics", img: "https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/1.webp" },
  { name: "Fashion", slug: "Fashion", img: "https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/3.webp" },
  { name: "Home & Kitchen", slug: "Home & Kitchen", img: "https://cdn.dummyjson.com/product-images/kitchen-accessories/silver-pot-with-glass-cap/1.webp" },
  { name: "Beauty", slug: "Beauty", img: "https://cdn.dummyjson.com/product-images/beauty/red-lipstick/1.webp" },
  { name: "Sports", slug: "Sports", img: "https://cdn.dummyjson.com/product-images/sports-accessories/basketball/1.webp" },
  { name: "Books", slug: "Books", img: "https://covers.openlibrary.org/b/id/12539702-L.jpg" },
];

// Amazon-style: "/" is both the homepage and the results page. With no
// query string it's the curated homepage; the moment a search, category
// click, or filter adds a query param, the same route renders the listing
// instead — there's no separate /products URL that dumps the whole catalog.
export default function Home() {
  const [searchParams] = useSearchParams();
  return searchParams.toString() ? <ProductListing /> : <HomeMarketing />;
}

function HomeMarketing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.list({ limit: 60, sort: "popularity" })
      .then((res) => setProducts(res.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const deals = [...products].filter((p) => p.originalPrice > p.price).slice(0, 10);
  const trending = [...products].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 10);
  const bestSellers = [...products].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0)).slice(0, 10);
  const newArrivals = [...products]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 10);

  return (
    <div className="home-page">
      <HomeBanner />
      <section className="category-shortcuts">
        {categories.map(({ name, slug, img }) => (
          <Link key={slug} to={`/?category=${encodeURIComponent(slug)}`} className="category-tile">
            <img
              className="category-tile-img"
              src={img}
              alt=""
              loading="lazy"
            />
            <div className="category-tile-scrim" />
            <span className="category-tile-label">{name}</span>
          </Link>
        ))}
      </section>
      <Section title="Deals of the Day" subtitle="Limited-time offers you cannot miss" products={deals} loading={loading} link="/?discount=true" />
      <Section title="New Arrivals" subtitle="Just landed on Velora" products={newArrivals} loading={loading} link="/?sort=newest" tinted cardBadge="New" />
      <Section title="Trending Now" subtitle="What everyone is shopping this week" products={trending} loading={loading} link="/?sort=popularity" cardBadge="Trending" />
      <Section title="Best Sellers" subtitle="Top-rated by Velora shoppers" products={bestSellers} loading={loading} link="/?sort=rating" tinted cardBadge="Bestseller" />
      {categories.slice(0, 4).map((cat, i) => {
        const catProducts = products.filter((p) => p.category === cat.slug).slice(0, 8);
        if (!catProducts.length && !loading) return null;
        return (
          <Section
            key={cat.slug}
            title={`Shop ${cat.name}`}
            products={catProducts}
            loading={loading}
            link={`/?category=${encodeURIComponent(cat.slug)}`}
            tinted={i % 2 === 1}
          />
        );
      })}
    </div>
  );
}

function Section({ title, subtitle, products, loading, link, tinted, cardBadge }) {
  const railRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [products]);

  const scrollRail = (dir) => {
    railRef.current?.scrollBy({ left: dir * railRef.current.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <section className={`home-section ${tinted ? "tinted" : ""}`}>
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="text-secondary">{subtitle}</p>}
        </div>
        {link && <Link to={link} className="section-link">View all</Link>}
      </div>
      {loading ? <ProductGridSkeleton count={4} /> : (
        <div className="product-rail-wrap">
          <button
            type="button" className="rail-nav-btn prev" onClick={() => scrollRail(-1)}
            disabled={!canPrev} aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="product-rail" ref={railRef} onScroll={updateArrows}>
            {products.map((p) => <ProductCard key={p.id || p._id} product={p} badge={cardBadge} />)}
          </div>
          <button
            type="button" className="rail-nav-btn next" onClick={() => scrollRail(1)}
            disabled={!canNext} aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  );
}
