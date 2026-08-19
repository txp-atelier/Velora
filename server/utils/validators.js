// Shared validation rules — the source of truth mirrored by
// client/src/utils/validation.js on the frontend. Keep the two in sync.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile: 10 digits, starts 6-9
const PINCODE_RE = /^\d{6}$/; // Indian PIN code: 6 digits
const NAME_RE = /^[a-zA-Z][a-zA-Z\s.'-]{1,59}$/; // letters/spaces/.'- only, 2-60 chars

const isValidEmail = (email) => typeof email === "string" && EMAIL_RE.test(email.trim());

const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.trim().length === password.length &&
  password.length >= 8 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

const isValidPhone = (phone) => typeof phone === "string" && PHONE_RE.test(phone.trim());

const isValidPincode = (pincode) => typeof pincode === "string" && PINCODE_RE.test(pincode.trim());

const isValidName = (name) => typeof name === "string" && NAME_RE.test(name.trim());

const isValidPrice = (price) => {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return false;
  return Math.round(n * 100) === n * 100; // at most 2 decimal places
};

const isNonNegativeInteger = (n) => Number.isInteger(Number(n)) && Number(n) >= 0;

const CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books"];

// Escapes regex metacharacters so user search input can never be used to
// build an unexpected/expensive regex against MongoDB.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Guards against NoSQL operator injection: Express's query parser will turn
// `?search[$ne]=1` into an object, not a string — reject anything that
// isn't a plain string before it ever reaches a Mongo query.
const toSafeString = (value) => (typeof value === "string" ? value.trim() : "");

// Builds the { error, fields } shape every route returns on validation
// failure, so the frontend can map a message back to the specific input.
const validationError = (res, fields, message) =>
  res.status(400).json({
    error: message || Object.values(fields)[0] || "Please check the highlighted fields.",
    fields,
  });

module.exports = {
  EMAIL_RE,
  PHONE_RE,
  PINCODE_RE,
  NAME_RE,
  CATEGORIES,
  isValidEmail,
  isStrongPassword,
  isValidPhone,
  isValidPincode,
  isValidName,
  isValidPrice,
  isNonNegativeInteger,
  escapeRegex,
  toSafeString,
  validationError,
};
