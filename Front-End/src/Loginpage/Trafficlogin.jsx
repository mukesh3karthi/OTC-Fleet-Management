import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ShieldCheck,
  ArrowRightLeft,
  X,
} from "lucide-react";

import "../Loginpage/trafficlogin.css";

const TRAFFIC_USERNAME = "admin";
const TRAFFIC_PASSWORD = "admin@2026";

const Trafficlogin = ({
  open,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [usernameError, setUsernameError] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  /* =========================================
     RESET FORM WHEN POPUP OPENS
  ========================================= */

  useEffect(() => {
    if (open) {
      setUsername("");
      setPassword("");
      setUsernameError("");
      setPasswordError("");
      setShowPassword(false);
    }
  }, [open]);

  /* =========================================
     ESC KEY CLOSE
  ========================================= */

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, onClose]);

  /* =========================================
     LOGIN
  ========================================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanUsername = username.trim();

    setUsernameError("");
    setPasswordError("");

    let hasError = false;

    if (!cleanUsername) {
      setUsernameError(
        "Please enter username."
      );

      hasError = true;
    }

    if (!password) {
      setPasswordError(
        "Please enter password."
      );

      hasError = true;
    }

    if (hasError) {
      return;
    }

    /* BOTH WRONG */

    if (
      cleanUsername !== TRAFFIC_USERNAME &&
      password !== TRAFFIC_PASSWORD
    ) {
      setUsernameError(
        "Invalid username."
      );

      setPasswordError(
        "Invalid password."
      );

      return;
    }

    /* USERNAME WRONG */

    if (
      cleanUsername !== TRAFFIC_USERNAME
    ) {
      setUsernameError(
        "Invalid username."
      );

      return;
    }

    /* PASSWORD WRONG */

    if (
      password !== TRAFFIC_PASSWORD
    ) {
      setPasswordError(
        "Invalid password."
      );

      return;
    }

    /* =========================================
       LOGIN SUCCESS
    ========================================= */

    sessionStorage.setItem(
      "trafficLoggedIn",
      "true"
    );

    sessionStorage.setItem(
      "trafficUsername",
      cleanUsername
    );

    /*
      Remove Key Account login session
      when Traffic user logs in
    */

    sessionStorage.removeItem(
      "kamLoggedIn"
    );

    sessionStorage.removeItem(
      "kamUsername"
    );

    onLoginSuccess?.();
  };

  /* =========================================
     USERNAME
  ========================================= */

  const handleUsernameChange = (
    event
  ) => {
    setUsername(event.target.value);

    if (usernameError) {
      setUsernameError("");
    }
  };

  /* =========================================
     PASSWORD
  ========================================= */

  const handlePasswordChange = (
    event
  ) => {
    setPassword(event.target.value);

    if (passwordError) {
      setPasswordError("");
    }
  };

  /* =========================================
     DO NOT RENDER WHEN CLOSED
  ========================================= */

  if (!open) {
    return null;
  }

  return (
    <div
      className="traffic-login-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="traffic-login-title"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <div
        className="traffic-login-card"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* =====================================
            TOP ACCENT
        ===================================== */}

        <div className="traffic-login-topbar" />

        {/* =====================================
            CLOSE
        ===================================== */}

        <button
          type="button"
          className="traffic-login-close"
          onClick={onClose}
          aria-label="Close Traffic Login"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* =====================================
            ICON
        ===================================== */}

        <div className="traffic-login-icon">
          <ArrowRightLeft
            size={25}
            strokeWidth={2}
          />
        </div>

        {/* =====================================
            HEADING
        ===================================== */}

        <p className="traffic-login-eyebrow">
          SECURE ACCESS
        </p>

        <h2
          id="traffic-login-title"
          className="traffic-login-title"
        >
          Traffic Login
        </h2>

        <p className="traffic-login-subtitle">
          Sign in to continue with Traffic
          Management.
        </p>

        {/* =====================================
            FORM
        ===================================== */}

        <form
          className="traffic-login-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* =================================
              USERNAME
          ================================= */}

          <div className="traffic-login-field">
            <label htmlFor="trafficUsername">
              Username
            </label>

            <div
              className={`traffic-login-input-wrap ${
                usernameError
                  ? "traffic-input-error"
                  : ""
              }`}
            >
              <User
                className="traffic-login-input-icon"
                size={17}
                strokeWidth={1.8}
              />

              <input
                id="trafficUsername"
                name="trafficUsername"
                type="text"
                value={username}
                onChange={
                  handleUsernameChange
                }
                placeholder="Enter username"
                autoComplete="username"
                autoFocus
              />
            </div>

            {usernameError && (
              <p className="traffic-login-error-text">
                {usernameError}
              </p>
            )}
          </div>

          {/* =================================
              PASSWORD
          ================================= */}

          <div className="traffic-login-field">
            <label htmlFor="trafficPassword">
              Password
            </label>

            <div
              className={`traffic-login-input-wrap ${
                passwordError
                  ? "traffic-input-error"
                  : ""
              }`}
            >
              <Lock
                className="traffic-login-input-icon"
                size={17}
                strokeWidth={1.8}
              />

              <input
                id="trafficPassword"
                name="trafficPassword"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={
                  handlePasswordChange
                }
                placeholder="Enter password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="traffic-login-eye"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={18}
                    strokeWidth={1.8}
                  />
                ) : (
                  <Eye
                    size={18}
                    strokeWidth={1.8}
                  />
                )}
              </button>
            </div>

            {passwordError && (
              <p className="traffic-login-error-text">
                {passwordError}
              </p>
            )}
          </div>

          {/* =================================
              LOGIN BUTTON
          ================================= */}

          <button
            type="submit"
            className="traffic-login-submit"
          >
            <ShieldCheck
              size={17}
              strokeWidth={2}
            />

            <span>Login</span>
          </button>
        </form>

        {/* =====================================
            FOOTER
        ===================================== */}

        <div className="traffic-login-divider" />

        <div className="traffic-login-footer">
          <Lock
            size={13}
            strokeWidth={1.8}
          />

          <span>
            Authorized personnel only
          </span>
        </div>
      </div>
    </div>
  );
};

export default Trafficlogin;