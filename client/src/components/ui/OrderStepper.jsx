import { Check } from "lucide-react";
import { ORDER_STEPS, statusLabel } from "../../utils/format";

// Cancelled/returned orders left the happy path entirely — the status
// badge in the order header already says so, so there's nothing for the
// stepper to add here (rendering another badge just repeated the label).
export default function OrderStepper({ status }) {
  if (status === "cancelled" || status === "returned") return null;

  const currentIndex = ORDER_STEPS.indexOf(status === "pending" ? "confirmed" : status);

  return (
    <div className="order-stepper">
      {ORDER_STEPS.map((step, i) => (
        <div key={step} className={`order-stepper-step ${i <= currentIndex ? "done" : ""} ${i === currentIndex ? "current" : ""}`}>
          <span className="order-stepper-dot">{i < currentIndex ? <Check size={12} /> : i + 1}</span>
          <span className="order-stepper-label">{statusLabel(step)}</span>
          {i < ORDER_STEPS.length - 1 && <span className="order-stepper-line" />}
        </div>
      ))}
    </div>
  );
}
