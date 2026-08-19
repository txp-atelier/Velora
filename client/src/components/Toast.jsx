import { CheckCircle2, X } from "lucide-react";
import { useToast } from "../context/ToastContext";
import IconButton from "./ui/IconButton";

export default function Toast() {
  const { toasts, dismissToast } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.leaving ? "leaving" : ""}`}>
          <CheckCircle2 size={18} className="toast-icon" />
          <span className="toast-message">{toast.message}</span>
          <IconButton icon={X} label="Dismiss" size="sm" className="toast-close" onClick={() => dismissToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}
