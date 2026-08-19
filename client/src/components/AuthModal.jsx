import { useEffect, useRef, useState } from "react";
import { User, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../services/api";
import { isValidEmail, isValidName, isStrongPassword, passwordsMatch } from "../utils/validation";
import Modal from "./ui/Modal";
import Input from "./ui/Input";
import Button from "./ui/Button";
import RadioCard from "./ui/RadioCard";
import PasswordStrength from "./ui/PasswordStrength";
import Logo from "./Logo";

const emptyForm = { name: "", email: "", password: "", confirmPassword: "", role: "customer" };
const PASSWORD_HINT = "At least 8 characters, with a letter and a number.";

export default function AuthModal() {
  const { authModal, setAuthModal, login, signup } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState(authModal || "login");
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState({});
  const [resetToken, setResetToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [serverFields, setServerFields] = useState({});
  const [loading, setLoading] = useState(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (authModal && !wasOpen.current) {
      setMode(authModal);
      setForm(emptyForm);
      setTouched({});
      setServerFields({});
      setResetToken("");
      setMessage("");
      setError("");
    }
    wasOpen.current = !!authModal;
  }, [authModal]);

  const currentMode = authModal === "signup" ? "signup" : mode;

  const close = () => setAuthModal(null);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (serverFields[key]) setServerFields((f) => ({ ...f, [key]: undefined }));
  };
  const markTouched = (key) => setTouched((t) => ({ ...t, [key]: true }));

  // Client-side validity per field, independent of whether it's been touched yet.
  const fieldValid = {
    name: isValidName(form.name),
    email: isValidEmail(form.email),
    password: isStrongPassword(form.password),
    confirmPassword: passwordsMatch(form.password, form.confirmPassword),
    resetToken: resetToken.trim().length > 0,
    resetPassword: isStrongPassword(form.password),
  };

  const clientError = {
    name: "Enter your full name (letters only, at least 2 characters).",
    email: "Please enter a valid email address.",
    password: PASSWORD_HINT,
    confirmPassword: "Passwords don't match.",
    resetToken: "Reset token is required.",
    resetPassword: PASSWORD_HINT,
  };

  const errorFor = (key, validKey = key) => {
    if (serverFields[key]) return serverFields[key];
    if (touched[key] && !fieldValid[validKey]) return clientError[validKey];
    return undefined;
  };

  const isFormValid = () => {
    if (currentMode === "login") return isValidEmail(form.email) && form.password.length > 0;
    if (currentMode === "signup") {
      return isValidName(form.name) && isValidEmail(form.email) && isStrongPassword(form.password) && passwordsMatch(form.password, form.confirmPassword);
    }
    if (currentMode === "forgot") return isValidEmail(form.email);
    if (currentMode === "reset") return resetToken.trim().length > 0 && isStrongPassword(form.password);
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mark every relevant field touched so any remaining issues surface immediately.
    setTouched({ name: true, email: true, password: true, confirmPassword: true, resetToken: true });
    if (!isFormValid()) return;

    setError("");
    setLoading(true);
    try {
      if (currentMode === "login") {
        const u = await login(form.email.trim(), form.password);
        showToast(`Welcome back, ${u.name.split(" ")[0]}!`);
      } else if (currentMode === "signup") {
        const u = await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role });
        showToast(`Account created — welcome to Velora, ${u.name.split(" ")[0]}!`);
      } else if (currentMode === "forgot") {
        await authApi.forgotPassword(form.email.trim());
        setMessage("Check your email. For demo, see the server console for the reset token.");
        setMode("reset");
        setTouched({});
      } else if (currentMode === "reset") {
        await authApi.resetPassword({ token: resetToken.trim(), password: form.password });
        setMessage("Password updated. You can sign in now.");
        setMode("login");
        setForm(emptyForm);
        setTouched({});
      }
    } catch (err) {
      setError(err.fields ? "" : err.message);
      setServerFields(err.fields || {});
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    login: "Welcome back",
    signup: "Create your Velora account",
    forgot: "Reset your password",
    reset: "Set a new password",
  };

  return (
    <Modal open={!!authModal} onClose={close} labelledBy="auth-modal-title">
      <div className="modal-brand">
        <span className="logo-mark"><Logo size={22} /></span>
        <span className="logo-text">Velora</span>
      </div>
      <h2 id="auth-modal-title">{titles[currentMode]}</h2>
      {currentMode === "login" && (
        <p className="modal-subtitle">Sign in to add items to your cart and checkout.</p>
      )}
      {currentMode === "signup" && (
        <p className="modal-subtitle">Shop smart, live better — it only takes a minute.</p>
      )}
      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {currentMode === "signup" && (
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => markTouched("name")}
            error={errorFor("name")}
            success={touched.name && fieldValid.name}
            required
            autoComplete="name"
          />
        )}
        {(currentMode === "login" || currentMode === "signup" || currentMode === "forgot") && (
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => markTouched("email")}
            error={errorFor("email")}
            success={touched.email && fieldValid.email}
            required
            autoComplete="email"
          />
        )}
        {currentMode === "reset" && (
          <Input
            label="Reset token"
            value={resetToken}
            onChange={(e) => { setResetToken(e.target.value); if (serverFields.token) setServerFields((f) => ({ ...f, token: undefined })); }}
            onBlur={() => markTouched("resetToken")}
            error={serverFields.token || errorFor("resetToken")}
            required
            placeholder="From server console"
          />
        )}
        {(currentMode === "login" || currentMode === "signup" || currentMode === "reset") && (
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            onBlur={() => markTouched("password")}
            error={currentMode === "login" ? serverFields.password : errorFor("password", currentMode === "reset" ? "resetPassword" : "password")}
            success={currentMode !== "login" && touched.password && fieldValid.password}
            required
            autoComplete={currentMode === "login" ? "current-password" : "new-password"}
            hint={currentMode !== "login" && !touched.password ? PASSWORD_HINT : undefined}
          />
        )}
        {(currentMode === "signup" || currentMode === "reset") && <PasswordStrength password={form.password} />}
        {currentMode === "signup" && (
          <Input
            label="Confirm password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setField("confirmPassword", e.target.value)}
            onBlur={() => markTouched("confirmPassword")}
            error={errorFor("confirmPassword")}
            success={touched.confirmPassword && fieldValid.confirmPassword}
            required
            autoComplete="new-password"
          />
        )}
        {currentMode === "signup" && (
          <fieldset className="role-select">
            <legend>I want to</legend>
            <div className="radio-card-group">
              <RadioCard
                name="role"
                value="customer"
                checked={form.role === "customer"}
                onChange={() => setField("role", "customer")}
                icon={User}
                label="Shop"
                description="Browse & buy products"
              />
              <RadioCard
                name="role"
                value="seller"
                checked={form.role === "seller"}
                onChange={() => setField("role", "seller")}
                icon={Store}
                label="Sell"
                description="List your own products"
              />
            </div>
          </fieldset>
        )}
        <Button
          type="submit"
          variant="accent"
          full
          loading={loading}
          disabled={Object.keys(touched).length > 0 && !isFormValid()}
          title={Object.keys(touched).length > 0 && !isFormValid() ? "Fix the highlighted fields to continue" : undefined}
        >
          {currentMode === "login" ? "Sign in" : currentMode === "signup" ? "Create account" : currentMode === "forgot" ? "Send reset link" : "Update password"}
        </Button>
      </form>
      <div className="modal-footer-links">
        {currentMode === "login" && (
          <>
            <button type="button" className="link-btn" onClick={() => { setMode("forgot"); setError(""); setTouched({}); }}>Forgot password?</button>
            <button type="button" className="link-btn" onClick={() => setAuthModal("signup")}>New to Velora? Create account</button>
          </>
        )}
        {currentMode === "signup" && (
          <button type="button" className="link-btn" onClick={() => setAuthModal("login")}>Already have an account? Sign in</button>
        )}
        {(currentMode === "forgot" || currentMode === "reset") && (
          <button type="button" className="link-btn" onClick={() => setAuthModal("login")}>Back to sign in</button>
        )}
      </div>
    </Modal>
  );
}
