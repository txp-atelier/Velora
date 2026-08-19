import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size,
    full = false,
    loading = false,
    disabled = false,
    to,
    href,
    className = "",
    children,
    ...rest
  },
  ref
) {
  const classes = [
    "btn",
    `btn-${variant}`,
    size ? `btn-${size}` : "",
    full ? "btn-full" : "",
    className,
  ].filter(Boolean).join(" ");

  const content = (
    <>
      {loading && <Loader2 size={16} className="spin" />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button ref={ref} type={rest.type || "button"} className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
});

export default Button;
