// Shared validation rules — mirrors server/utils/validators.js so the
// frontend never contradicts what the API will ultimately enforce.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile: 10 digits, starts 6-9
const PINCODE_RE = /^\d{6}$/; // Indian PIN code: 6 digits
const NAME_RE = /^[a-zA-Z][a-zA-Z\s.'-]{1,59}$/; // letters/spaces/.'- only, 2-60 chars

export const isValidEmail = (email) => EMAIL_RE.test((email || "").trim());
export const isValidPhone = (phone) => PHONE_RE.test((phone || "").trim());
export const isValidPincode = (pincode) => PINCODE_RE.test((pincode || "").trim());
export const isValidName = (name) => NAME_RE.test((name || "").trim());

export const isStrongPassword = (password) =>
  !!password &&
  password.trim().length === password.length &&
  password.length >= 8 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

export const passwordsMatch = (password, confirm) => !!password && password === confirm;

export const isValidPrice = (price) => {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return false;
  return Math.round(n * 100) === n * 100;
};

export const isNonNegativeInteger = (n) => n !== "" && n !== null && Number.isInteger(Number(n)) && Number(n) >= 0;
export const isPositiveInteger = (n) => n !== "" && n !== null && Number.isInteger(Number(n)) && Number(n) >= 1;

export const required = (value) => typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null && value !== "";
export const minLength = (value, n) => (value || "").trim().length >= n;
export const maxLength = (value, n) => (value || "").trim().length <= n;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const isValidImageFile = (file) => {
  if (!file) return { valid: false, error: "Please choose an image." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPG, PNG, or WEBP images are allowed." };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "Image must be under 5 MB." };
  }
  return { valid: true, error: "" };
};

/**
 * Password strength on a 0–4 scale, for a live strength meter.
 * 0-1 = weak, 2 = fair, 3 = good, 4 = strong.
 */
export const passwordStrength = (password) => {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const capped = Math.min(score, 4);
  const labels = ["Weak", "Weak", "Fair", "Good", "Strong"];
  return { score: capped, label: labels[capped] };
};

/** Runs `rules` (each `[key, validatorFn, message]`) against `values`, returning a field->message error map. */
export const validate = (values, rules) => {
  const errors = {};
  for (const [key, test, message] of rules) {
    if (!test(values[key], values)) errors[key] = message;
  }
  return errors;
};

export const isEmpty = (errors) => Object.keys(errors).length === 0;
