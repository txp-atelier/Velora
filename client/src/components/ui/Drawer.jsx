import { useEffect, useState } from "react";
import { X } from "lucide-react";
import IconButton from "./IconButton";

const CLOSE_DURATION = 280;

export default function Drawer({ open, onClose, title, children, footer }) {
  const [rendered, setRendered] = useState(open);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    let raf1, raf2;
    if (open) {
      setRendered(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      setAnimateIn(false);
      const t = setTimeout(() => setRendered(false), CLOSE_DURATION);
      return () => clearTimeout(t);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    if (!rendered) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [rendered, onClose]);

  if (!rendered) return null;

  return (
    <div className={`filter-drawer-overlay ${animateIn ? "open" : ""}`} onClick={onClose}>
      <div className="filter-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="filter-drawer-header">
          <h3>{title}</h3>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>
        <div className="filter-drawer-body">{children}</div>
        {footer && <div className="filter-drawer-footer">{footer}</div>}
      </div>
    </div>
  );
}
