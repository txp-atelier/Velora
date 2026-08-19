import { passwordStrength } from "../../utils/validation";

const TIERS = ["weak", "weak", "fair", "good", "strong"];

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const { score, label } = passwordStrength(password);
  const tier = TIERS[score];

  return (
    <div>
      <div className="pw-strength" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`pw-strength-bar ${i < score ? `filled-${tier}` : ""}`} />
        ))}
      </div>
      <span className={`pw-strength-label ${tier}`}>{label} password</span>
    </div>
  );
}
