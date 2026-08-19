import { forwardRef } from "react";

const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant, size, badge, className = "", ...rest },
  ref
) {
  const classes = [
    "icon-btn",
    variant ? variant : "",
    size ? size : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button ref={ref} type="button" className={classes} aria-label={label} {...rest}>
      {Icon && <Icon size={size === "sm" ? 16 : 20} />}
      {badge > 0 && <span className="badge">{badge > 99 ? "99+" : badge}</span>}
    </button>
  );
});

export default IconButton;
