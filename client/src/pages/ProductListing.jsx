import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import BackButton from "../components/BackButton";
import EmptyState from "../components/EmptyState";
import { ProductGridSkeleton } from "../components/Skeleton";
import { productsApi } from "../services/api";
import { SearchX } from "lucide-react";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import Checkbox from "../components/ui/Checkbox";
import Button from "../components/ui/Button";
import Drawer from "../components/ui/Drawer";

const PAGE_SIZE = 12;

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const filters = {
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    brand: searchParams.get("brand") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    rating: searchParams.get("rating") || "",
    inStock: searchParams.get("inStock") || "",
    discount: searchParams.get("discount") || "",
    sort: searchParams.get("sort") || "newest",
  };

  useEffect(() => {
    productsApi.brands().then(setBrands).catch(() => {});
    productsApi.categories().then(setCategories).catch(() => {});
  }, []);

  const minPriceNum = filters.minPrice === "" ? null : Number(filters.minPrice);
  const maxPriceNum = filters.maxPrice === "" ? null : Number(filters.maxPrice);
  const priceRangeInvalid =
    (minPriceNum !== null && minPriceNum < 0) ||
    (maxPriceNum !== null && maxPriceNum < 0) ||
    (minPriceNum !== null && maxPriceNum !== null && minPriceNum > maxPriceNum);

  const buildParams = (pageNum) => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    if (priceRangeInvalid) {
      delete params.minPrice;
      delete params.maxPrice;
    }
    params.page = pageNum;
    params.limit = PAGE_SIZE;
    return params;
  };

  // Filters/sort/search changed — start over from page 1, fetch only the
  // first page rather than the whole catalog.
  useEffect(() => {
    setLoading(true);
    setPage(1);
    productsApi.list(buildParams(1))
      .then((res) => {
        setProducts(res.products || []);
        setHasMore(!!res.hasMore);
      })
      .catch(() => { setProducts([]); setHasMore(false); })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    productsApi.list(buildParams(nextPage))
      .then((res) => {
        setProducts((prev) => [...prev, ...(res.products || [])]);
        setHasMore(!!res.hasMore);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearAll = () => setSearchParams({});

  const activeFilters = Object.entries(filters).filter(([k, v]) => v && k !== "sort");

  const filterFields = (
    <>
      <FilterGroup label="Category">
        <Select value={filters.category} onChange={(e) => setFilter("category", e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </FilterGroup>
      <FilterGroup label="Brand">
        <Select value={filters.brand} onChange={(e) => setFilter("brand", e.target.value)}>
          <option value="">All brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
      </FilterGroup>
      <FilterGroup label="Price range (₹)">
        <div className="price-range">
          <Input type="number" min="0" placeholder="Min" value={filters.minPrice} onChange={(e) => setFilter("minPrice", e.target.value)} />
          <span>to</span>
          <Input type="number" min="0" placeholder="Max" value={filters.maxPrice} onChange={(e) => setFilter("maxPrice", e.target.value)} />
        </div>
        <input type="range" min="499" max="50000" step="500" value={filters.maxPrice || 50000}
          onChange={(e) => setFilter("maxPrice", e.target.value)} className="range-slider" aria-label="Maximum price" />
        {priceRangeInvalid && (
          <p className="field-error-text">
            {minPriceNum > maxPriceNum && maxPriceNum !== null ? "Min price can't be more than max price." : "Price cannot be negative."}
          </p>
        )}
      </FilterGroup>
      <FilterGroup label="Rating">
        <Checkbox
          label="4 stars & above"
          checked={filters.rating === "4"}
          onChange={(e) => setFilter("rating", e.target.checked ? "4" : "")}
        />
      </FilterGroup>
      <FilterGroup label="Availability">
        <Checkbox
          label="In stock only"
          checked={filters.inStock === "true"}
          onChange={(e) => setFilter("inStock", e.target.checked ? "true" : "")}
        />
      </FilterGroup>
      <FilterGroup label="Offers">
        <Checkbox
          label="On discount"
          checked={filters.discount === "true"}
          onChange={(e) => setFilter("discount", e.target.checked ? "true" : "")}
        />
      </FilterGroup>
    </>
  );

  return (
    <div className="listing-page">
      <div className="listing-header">
        <div className="listing-title-row">
          <BackButton to="/" />
          <h1>{filters.search ? `Results for "${filters.search}"` : filters.category || "All Products"}</h1>
        </div>
        <div className="listing-controls">
          <Button variant="outline" className="filter-toggle" onClick={() => setFilterOpen(true)}>
            <SlidersHorizontal size={16} /> Filters
          </Button>
          <div className="sort-select-wrap">
            <Select value={filters.sort} onChange={(e) => setFilter("sort", e.target.value)} aria-label="Sort by">
              <option value="newest">Newest</option>
              <option value="popularity">Popularity</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Rating</option>
            </Select>
          </div>
        </div>
      </div>
      {activeFilters.length > 0 && (
        <div className="filter-chips">
          {activeFilters.map(([k, v]) => (
            <button key={k} className="filter-chip" onClick={() => setFilter(k, "")}>
              {k}: {v} <X size={14} />
            </button>
          ))}
          <button className="link-btn" onClick={clearAll}>Clear all</button>
        </div>
      )}
      <div className="listing-layout">
        <aside className="filters-sidebar filters-desktop">
          <h3>Filters</h3>
          {filterFields}
        </aside>
        <div className="listing-results">
          {loading ? <ProductGridSkeleton /> : products.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No products found"
              message="Try adjusting your filters or search for something else."
              action={<Button variant="primary" onClick={clearAll}>Clear filters</Button>}
            />
          ) : (
            <>
              <div className="product-grid">
                {products.map((p) => <ProductCard key={p.id || p._id} product={p} />)}
              </div>
              {hasMore && (
                <div className="load-more-wrap">
                  <Button variant="outline" onClick={loadMore} loading={loadingMore}>
                    {loadingMore ? "Loading…" : "Load more products"}
                  </Button>
                </div>
              )}
              {!hasMore && products.length > PAGE_SIZE && (
                <p className="load-more-end text-secondary">You've reached the end of the results.</p>
              )}
            </>
          )}
        </div>
      </div>
      <Drawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filters"
        footer={<Button variant="accent" full onClick={() => setFilterOpen(false)}>Apply filters</Button>}
      >
        {filterFields}
      </Drawer>
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="filter-group">
      <h4>{label}</h4>
      {children}
    </div>
  );
}
