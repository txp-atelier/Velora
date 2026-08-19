import { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";

const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className = "", id, rows = 4, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      {label && (
        <label className="field-label" htmlFor={inputId}>
          {label}{required && <span className="field-required">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`field-textarea ${className}`}
        aria-invalid={!!error}
        required={required}
        {...rest}
      />
      {error && <p className="field-error-text"><AlertCircle size={13} /> {error}</p>}
      {!error && hint && <p className="field-hint">{hint}</p>}
    </div>
  );
});

export default Textarea;
