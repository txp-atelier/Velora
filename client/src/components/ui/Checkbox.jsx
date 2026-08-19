import { forwardRef } from "react";
import { Check } from "lucide-react";

const Checkbox = forwardRef(function Checkbox(
  { label, className = "", disabled, ...rest },
  ref
) {
  return (
    <label className={`checkbox ${disabled ? "disabled" : ""} ${className}`}>
      <input ref={ref} type="checkbox" disabled={disabled} {...rest} />
      <span className="checkbox-box">
        {rest.checked && <Check size={13} strokeWidth={3} />}
      </span>
      {label}
    </label>
  );
});

export default Checkbox;
