import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, Clock, TrendingUp } from "lucide-react";

const RECENT_KEY = "velora_recent_searches";
const MAX_RECENT = 6;

const TRENDING_SEARCHES = [
  "Wireless Headphones",
  "Smart Watch",
  "Running Shoes",
  "Air Fryer",
  "Kurta",
  "Basketball",
];

const loadRecent = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(loadRecent);
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  // Escape and the backdrop both close the panel, but the navbar itself
  // sits above the backdrop (it has to, to stay usable while open), so a
  // click on the wishlist/cart/account icons never reaches the backdrop.
  // This listener catches every one of those "outside" clicks too — it
  // only closes the panel, it never blocks the click, so the icon's own
  // action (e.g. navigating to the wishlist) still happens normally.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onOutsideClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutsideClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutsideClick);
    };
  }, [open]);

  const saveRecent = (term) => {
    const next = [term, ...recent.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const runSearch = (term) => {
    const q = term.trim();
    setQuery(q);
    setOpen(false);
    if (q) {
      saveRecent(q);
      navigate(`/?search=${encodeURIComponent(q)}`);
    } else {
      navigate("/");
    }
  };

  const clearRecent = (e) => {
    e.stopPropagation();
    setRecent([]);
    localStorage.removeItem(RECENT_KEY);
  };

  return (
    <div className="navbar-search-wrap" ref={wrapRef}>
      <form className="navbar-search" onSubmit={(e) => { e.preventDefault(); runSearch(query); }}>
        <Search size={18} className="search-icon" />
        <input
          type="search"
          placeholder="Search products, brands and more"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          aria-label="Search"
        />
        <button type="submit" className="search-submit" aria-label="Search">
          <Search size={18} />
        </button>
      </form>
      {open && (
        <>
          {createPortal(<div className="search-backdrop" onClick={() => setOpen(false)} />, document.body)}
          <div className="search-suggestions" role="listbox">
            {recent.length > 0 && (
              <div className="search-suggestions-group">
                <div className="search-suggestions-heading">
                  <span>Recent searches</span>
                  <button type="button" className="link-btn" onClick={clearRecent}>Clear</button>
                </div>
                {recent.map((term) => (
                  <button type="button" key={term} className="search-suggestion-item" onClick={() => runSearch(term)}>
                    <Clock size={15} />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="search-suggestions-group">
              <div className="search-suggestions-heading"><span>Trending now</span></div>
              {TRENDING_SEARCHES.map((term) => (
                <button type="button" key={term} className="search-suggestion-item" onClick={() => runSearch(term)}>
                  <TrendingUp size={15} />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
