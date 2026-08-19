export default function RadioCard({ name, value, checked, onChange, icon: Icon, label, description, className = "" }) {
  return (
    <label className={`radio-card ${checked ? "selected" : ""} ${className}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      {Icon && <Icon size={20} />}
      <span className="radio-card-body">
        <span>{label}</span>
        {description && <span className="radio-card-desc">{description}</span>}
      </span>
    </label>
  );
}
