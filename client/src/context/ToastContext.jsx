import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext();

const EXIT_DURATION = 250;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, EXIT_DURATION);
  }, []);

  const showToast = useCallback((message, { duration = 3500 } = {}) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, leaving: false }]);
    setTimeout(() => dismissToast(id), duration);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
