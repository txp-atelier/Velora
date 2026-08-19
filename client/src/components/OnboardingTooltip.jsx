import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Button from "./ui/Button";

export default function OnboardingTooltip({ id, title, message, children, align = "left" }) {
  const key = `velora_onboarding_${id}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(key)) setVisible(true);
  }, [key]);

  const dismiss = () => {
    localStorage.setItem(key, "1");
    setVisible(false);
  };

  return (
    <div className="onboarding-wrap">
      {children}
      {visible && (
        <div className={`onboarding-tooltip ${align === "right" ? "align-right" : ""}`}>
          <button className="onboarding-close" onClick={dismiss} aria-label="Dismiss"><X size={14} /></button>
          <strong>{title}</strong>
          <p>{message}</p>
          <Button variant="primary" size="sm" onClick={dismiss}>Got it</Button>
        </div>
      )}
    </div>
  );
}
