import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, User, ShieldCheck, ArrowRightLeft, X } from "lucide-react";
import "../Loginpage/approvalmanagementlogin.css";

const APPROVAL_USERNAME = "admin";
const APPROVAL_PASSWORD = "admin@2026";
const Approvalmanagementlogin = ({ open = false, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  useEffect(() => {
    if (open) {
      setUsername("");
      setPassword("");
      setUsernameError("");
      setPasswordError("");
      setShowPassword(false);
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanUsername = username.trim();
    setUsernameError("");
    setPasswordError("");
    let hasError = false;
    if (!cleanUsername) {
      setUsernameError("Please enter username.");
      hasError = true;
    }
    if (!password) {
      setPasswordError("Please enter password.");
      hasError = true;
    }
    if (hasError) return;
    if (cleanUsername !== APPROVAL_USERNAME) {
      setUsernameError("Invalid username.");
      hasError = true;
    }
    if (password !== APPROVAL_PASSWORD) {
      setPasswordError("Invalid password.");
      hasError = true;
    }
    if (hasError) return;
    const user = { username: cleanUsername };
    sessionStorage.removeItem("approvalToken");
    sessionStorage.setItem("approvalLoggedIn", "true");
    sessionStorage.setItem("approvalUsername", cleanUsername);
    sessionStorage.setItem("approvalUser", JSON.stringify(user));
    setPassword("");
    setShowPassword(false);
    onLoginSuccess?.(user);
  };
  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
    setUsernameError("");
  };
  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setPasswordError("");
  };
  if (!open) return null;
  return (
    <div
      className="approval-login-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-login-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        className="approval-login-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="approval-login-topbar" />
        <button
          type="button"
          className="approval-login-close"
          onClick={onClose}
          aria-label="Close Approval Login"
        >
          <X size={18} strokeWidth={2} />
        </button>
        <div className="approval-login-icon">
          <ArrowRightLeft size={25} strokeWidth={2} />
        </div>
        <p className="approval-login-eyebrow">SECURE ACCESS</p>
        <h2 id="approval-login-title" className="approval-login-title">
          Approval Management Login
        </h2>
        <p className="approval-login-subtitle">
          Sign in to continue with Approval Management.
        </p>
        <form className="approval-login-form" onSubmit={handleSubmit} noValidate>
          <div className="approval-login-field">
            <label htmlFor="approvalUsername">Username</label>
            <div
              className={`approval-login-input-wrap ${usernameError ? "approval-login-input-error" : ""}`}
            >
              <User className="approval-login-input-icon" size={17} strokeWidth={1.8} />
              <input
                id="approvalUsername"
                name="approvalUsername"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Enter username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={Boolean(usernameError)}
                aria-describedby={usernameError ? "approval-username-error" : undefined}
                autoFocus
              />
            </div>
            {usernameError && (
              <p id="approval-username-error" className="approval-login-error-text" role="alert">
                {usernameError}
              </p>
            )}
          </div>
          <div className="approval-login-field">
            <label htmlFor="approvalPassword">Password</label>
            <div
              className={`approval-login-input-wrap ${passwordError ? "approval-login-input-error" : ""}`}
            >
              <Lock className="approval-login-input-icon" size={17} strokeWidth={1.8} />
              <input
                id="approvalPassword"
                name="approvalPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter password"
                autoComplete="current-password"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? "approval-password-error" : undefined}
              />
              <button
                type="button"
                className="approval-login-eye"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.8} />
                ) : (
                  <Eye size={18} strokeWidth={1.8} />
                )}
              </button>
            </div>
            {passwordError && (
              <p id="approval-password-error" className="approval-login-error-text" role="alert">
                {passwordError}
              </p>
            )}
          </div>
          <button type="submit" className="approval-login-submit">
            <ShieldCheck size={17} strokeWidth={2} />
            <span>Login</span>
          </button>
        </form>
        <div className="approval-login-divider" />
        <div className="approval-login-footer">
          <Lock size={13} strokeWidth={1.8} />
          <span>Authorized personnel only</span>
        </div>
      </div>
    </div>
  );
};
export default Approvalmanagementlogin;