export default function Skeleton({ width, height, className = "" }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: width || "100%", height: height || "1rem" }}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton-card">
      <Skeleton height="200px" />
      <div className="skeleton-body">
        <Skeleton height="1rem" />
        <Skeleton height="0.75rem" width="60%" />
        <Skeleton height="1.25rem" width="40%" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
