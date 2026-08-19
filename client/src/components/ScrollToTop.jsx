import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Resets scroll position on every route change — client-side navigation
 * doesn't do this automatically the way a full page load does. */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}
