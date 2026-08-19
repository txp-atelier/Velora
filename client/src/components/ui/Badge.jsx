export default function Badge({ variant = "default", icon: Icon, className = "", children }) {
  return (
    <span className={`badge-pill badge-${variant} ${className}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
