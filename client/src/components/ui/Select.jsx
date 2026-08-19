import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Fully custom dropdown — not a native <select>. Accepts the same
 * `<option value="...">Label</option>` children API as a native select so
 * every existing call site keeps working unchanged; onChange is called
 * with a synthetic `{ target: { value } }` event just like a real one.
 */
export default function Select({
  label, error, hint, required, className = "", wrapClassName = "",
  id, value, onChange, children, disabled, "aria-label": ariaLabel,
}) {
  const autoId = useId();
  const selectId = id || autoId;
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const triggerRef = useRef(null);
  const wasOpen = useRef(false);

  const options = Children.toArray(children)
    .filter((c) => isValidElement(c))
    .map((c) => ({ value: c.props.value ?? c.props.children, label: c.props.children }));

  const selectedIndex = options.findIndex((o) => String(o.value) === String(value));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    const onKeyDown = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
      listRef.current?.focus();
    } else if (wasOpen.current) {
      triggerRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (open && highlighted >= 0) {
      listRef.current?.children[highlighted]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  const commit = (opt) => {
    onChange?.({ target: { value: opt.value } });
    setOpen(false);
  };

  const onTriggerKeyDown = (e) => {
    if (disabled) return;
    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[highlighted]) commit(options[highlighted]);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={`field ${error ? "has-error" : ""} ${wrapClassName}`} ref={rootRef}>
      {label && (
        <label className="field-label" htmlFor={selectId}>
          {label}{required && <span className="field-required">*</span>}
        </label>
      )}
      <div className="dropdown">
        <button
          type="button"
          ref={triggerRef}
          id={selectId}
          className={`dropdown-trigger ${className} ${open ? "open" : ""}`}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={onTriggerKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel || label}
          disabled={disabled}
        >
          <span className="dropdown-value">{selected?.label ?? options[0]?.label ?? ""}</span>
          <ChevronDown size={16} className="dropdown-chevron" />
        </button>
        {open && (
          <ul
            className="dropdown-list"
            role="listbox"
            ref={listRef}
            tabIndex={-1}
            onKeyDown={onListKeyDown}
            aria-activedescendant={highlighted >= 0 ? `${selectId}-opt-${highlighted}` : undefined}
          >
            {options.map((opt, i) => (
              <li
                key={`${opt.value}-${i}`}
                id={`${selectId}-opt-${i}`}
                role="option"
                aria-selected={i === selectedIndex}
                className={`dropdown-option ${i === selectedIndex ? "selected" : ""} ${i === highlighted ? "highlighted" : ""}`}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => commit(opt)}
              >
                <span>{opt.label}</span>
                {i === selectedIndex && <Check size={15} />}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="field-error-text">{error}</p>}
      {!error && hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
