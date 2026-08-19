import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { cartApi } from "../services/api";
import { useAuth } from "./AuthContext";
import { getProductId } from "../utils/format";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const syncCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const cart = await cartApi.get();
      setItems(cart.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { syncCart(); }, [syncCart]);

  const addToCart = async (product, quantity = 1) => {
    const id = getProductId(product);
    const cart = await cartApi.add(id, quantity);
    setItems(cart.items || []);
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const cart = await cartApi.update(productId, quantity);
      setItems(cart.items || []);
    } catch (err) {
      await syncCart();
      throw err;
    }
  };

  const removeFromCart = async (productId) => {
    const cart = await cartApi.remove(productId);
    setItems(cart.items || []);
  };

  const clearCart = async () => {
    await cartApi.clear();
    setItems([]);
  };

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, loading, cartCount, addToCart, updateQuantity, removeFromCart, clearCart, syncCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
