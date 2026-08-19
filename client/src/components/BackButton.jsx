import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// `to`: always navigate straight there, ignoring history — for views where
// query params (filters, search) pile up multiple history entries for what
// is really one page, so "back" should exit the view, not unwind them one
// filter at a time.
// `fallback`: used only when there's no in-app history to go back to.
export default function BackButton({ to, fallback = "/", className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (to) { navigate(to); return; }
    if (location.key === "default") navigate(fallback);
    else navigate(-1);
  };

  return (
    <button type="button" className={`back-btn ${className}`} onClick={handleClick} aria-label="Go back">
      <ArrowLeft size={18} />
    </button>
  );
}
