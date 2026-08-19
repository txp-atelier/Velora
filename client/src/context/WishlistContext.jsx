import { createContext, useContext, useState, useEffect } from "react";
import { getProductId } from "../utils/format";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("velora_wishlist") || "[]");
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("velora_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const isWishlisted = (product) => wishlist.includes(getProductId(product));

  const toggleWishlist = (product) => {
    const id = getProductId(product);
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <WishlistContext.Provider value={{ wishlist, isWishlisted, toggleWishlist, count: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
