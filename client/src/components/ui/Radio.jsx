import { forwardRef } from "react";

const Radio = forwardRef(function Radio({ label, className = "", ...rest }, ref) {
  return (
    <label className={`radio ${className}`}>
      <input ref={ref} type="radio" {...rest} />
      <span className="radio-box" />
      {label}
    </label>
  );
});

export default Radio;
