export default function Card({ hover = false, className = "", children, ...rest }) {
  return (
    <div className={`card ${hover ? "card-hover" : ""} ${className}`} {...rest}>
      {children}
    </div>
  );
}
