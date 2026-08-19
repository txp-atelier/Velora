import { forwardRef, useId, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

const Input = forwardRef(function Input(
  { label, error, success, hint, icon: Icon, required, type, className = "", wrapClassName = "", id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const showRightIcon = isPassword || (success && !error);

  return (
    <div className={`field ${error ? "has-error" : ""} ${success && !error ? "has-success" : ""} ${wrapClassName}`}>
      {label && (
        <label className="field-label" htmlFor={inputId}>
          {label}{required && <span className="field-required">*</span>}
        </label>
      )}
      <div className="field-control-wrap">
        {Icon && <Icon size={16} className="field-icon-left" />}
        <input
          ref={ref}
          id={inputId}
          type={isPassword ? (visible ? "text" : "password") : type}
          className={`field-input ${Icon ? "has-icon-left" : ""} ${showRightIcon ? "has-icon-right" : ""} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          required={required}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            className="field-password-toggle"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : (
          success && !error && <CheckCircle2 size={16} className="field-icon-right" aria-hidden="true" />
        )}
      </div>
      {error && <p className="field-error-text" id={`${inputId}-error`}><AlertCircle size={13} /> {error}</p>}
      {!error && hint && <p className="field-hint" id={`${inputId}-hint`}>{hint}</p>}
    </div>
  );
});

export default Input;
