
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import "./Trackinglogin.css";

/* =========================================================
   TRACKING LOGIN CREDENTIALS
========================================================= */

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin@2026";

/* =========================================================
   TRACKING LOGIN COMPONENT
========================================================= */

const Trackinglogin = ({
  open = true,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const usernameInputRef = useRef(null);

  /* =========================================================
     CLEAR TRACKING SESSION
  ========================================================= */

  const clearTrackingSession = useCallback(() => {
    const keys = [
      "trackingAuthToken",
      "trackingMainToken",
      "trackingLoggedIn",
      "trackingUsername",
    ];

    keys.forEach((key) => {
      sessionStorage.removeItem(key);
    });
  }, []);

  /* =========================================================
     CLEAR LOGIN FORM
  ========================================================= */

  const clearForm = useCallback(() => {
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setError("");
    setIsLoggingIn(false);
  }, []);

  /* =========================================================
     CLOSE LOGIN POPUP
  ========================================================= */

  const handleClose = useCallback(() => {
    clearForm();

    onClose?.();
  }, [clearForm, onClose]);

  /* =========================================================
     POPUP EFFECT
  ========================================================= */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      usernameInputRef.current?.focus();
    }, 50);

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.clearTimeout(focusTimer);

      window.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open, handleClose]);

  /* =========================================================
     TRACKING LOGIN VALIDATION
  ========================================================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isLoggingIn) {
      return;
    }

    setError("");

    const cleanUsername = username.trim();
    const cleanPassword = password;

    /* BOTH FIELDS EMPTY */

    if (
      !cleanUsername &&
      !cleanPassword.trim()
    ) {
      setError(
        "Please enter username and password."
      );

      return;
    }

    /* USERNAME EMPTY */

    if (!cleanUsername) {
      setError("Please enter username.");
      return;
    }

    /* PASSWORD EMPTY */

    if (!cleanPassword.trim()) {
      setError("Please enter password.");
      return;
    }

    /* CHECK MAIN LOGIN SESSION */

    const mainToken =
      localStorage.getItem("token");

    if (!mainToken?.trim()) {
      clearTrackingSession();

      setError(
        "Main session expired. Please sign in again."
      );

      return;
    }

    /* VALIDATE USERNAME AND PASSWORD */

    if (
      cleanUsername !== VALID_USERNAME ||
      cleanPassword !== VALID_PASSWORD
    ) {
      clearTrackingSession();

      setError(
        "Invalid username or password."
      );

      return;
    }

    /* =====================================================
       LOGIN SUCCESS
    ===================================================== */

    sessionStorage.setItem(
      "trackingLoggedIn",
      "true"
    );

    sessionStorage.setItem(
      "trackingUsername",
      cleanUsername
    );

    setError("");

    clearForm();

    onLoginSuccess?.({
      username: cleanUsername,
    });
  };

  /* =========================================================
     DON'T RENDER WHEN CLOSED
  ========================================================= */

  if (!open) {
    return null;
  }

  /* =========================================================
     TRACKING LOGIN UI
  ========================================================= */

  return (
    <div
      className="tracking-login-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="tracking-login-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-login-title"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {/* TOP COLOR BAR */}

        <div className="tracking-login-topbar" />

        {/* CLOSE BUTTON */}

        <button
          type="button"
          className="tracking-login-close"
          onClick={handleClose}
          aria-label="Close Tracking Login"
        >
          <X size={18} />
        </button>

        {/* LOGIN ICON */}

        <div className="tracking-login-icon">
          <LockKeyhole size={26} />
        </div>

        {/* SUBHEADING */}

        <p className="tracking-login-eyebrow">
          Secure access
        </p>

        {/* TITLE */}

        <h2
          id="tracking-login-title"
          className="tracking-login-title"
        >
          Tracking Login
        </h2>

        {/* DESCRIPTION */}

        <p className="tracking-login-subtitle">
          Sign in to continue with Tracking Management.
        </p>

        {/* LOGIN FORM */}

        <form
          className="tracking-login-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* USERNAME FIELD */}

          <div className="tracking-login-field">
            <label htmlFor="trackingUsername">
              Username
            </label>

            <div className="tracking-login-input-wrap">
              <User
                size={18}
                className="tracking-login-input-icon"
              />

              <input
                ref={usernameInputRef}
                id="trackingUsername"
                type="text"
                placeholder="Enter username"
                value={username}
                autoComplete="username"
                disabled={isLoggingIn}
                onChange={(event) => {
                  setUsername(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }
                }}
              />
            </div>
          </div>

          {/* PASSWORD FIELD */}

          <div className="tracking-login-field">
            <label htmlFor="trackingPassword">
              Password
            </label>

            <div className="tracking-login-input-wrap">
              <LockKeyhole
                size={18}
                className="tracking-login-input-icon"
              />

              <input
                id="trackingPassword"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password"
                value={password}
                autoComplete="current-password"
                disabled={isLoggingIn}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }
                }}
              />

              {/* SHOW / HIDE PASSWORD */}

              <button
                type="button"
                className="tracking-login-eye"
                onClick={() => {
                  setShowPassword(
                    (previous) => !previous
                  );
                }}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* ERROR MESSAGE */}

          {error && (
            <p
              className="tracking-login-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="tracking-login-submit"
            disabled={isLoggingIn}
          >
            <ShieldCheck size={16} />

            <span>
              {isLoggingIn
                ? "Signing in..."
                : "Login"}
            </span>
          </button>
        </form>

        {/* DIVIDER */}

        <div className="tracking-login-divider" />

        {/* FOOTER */}

        <p className="tracking-login-footer">
          <LockKeyhole size={13} />

          Authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default Trackinglogin;
