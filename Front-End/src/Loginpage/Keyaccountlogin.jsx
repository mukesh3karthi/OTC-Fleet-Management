import React, { useEffect, useState } from "react";
import "../Loginpage/keyaccountlogin.css";

/* =========================================================
   TEMPORARY FRONTEND LOGIN

   IMPORTANT:
   This is okay for development/testing.

   For production:
   Move username/password validation to your backend API.
========================================================= */

const KAM_USERNAME = "admin";
const KAM_PASSWORD = "admin@2026";

const KamManagementLogin = ({
  open,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     RESET FORM WHEN MODAL OPENS
  ========================================================= */

  useEffect(() => {
    if (open) {
      setUsername("");
      setPassword("");
      setShowPassword(false);
      setError("");
    }
  }, [open]);

  /* =========================================================
     ESC KEY CLOSE
  ========================================================= */

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanUsername = username.trim();

    if (!cleanUsername && !password) {
      setError("Please enter username and password.");
      return;
    }

    if (!cleanUsername) {
      setError("Please enter username.");
      return;
    }

    if (!password) {
      setError("Please enter password.");
      return;
    }

    if (
      cleanUsername === KAM_USERNAME &&
      password === KAM_PASSWORD
    ) {
      sessionStorage.setItem("kamLoggedIn", "true");
      sessionStorage.setItem(
        "kamUsername",
        cleanUsername
      );

      setError("");
      setUsername("");
      setPassword("");
      setShowPassword(false);

      onLoginSuccess?.();

      return;
    }

    setError("Invalid username or password.");
  };

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = () => {
    setError("");
    setUsername("");
    setPassword("");
    setShowPassword(false);

    onClose?.();
  };

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <div
      className="kam-login-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
      role="presentation"
    >
      <div
        className="kam-login-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kam-login-title"
      >
        <div className="kam-login-topbar" />

        {/* CLOSE */}

        <button
          type="button"
          className="kam-login-close"
          onClick={handleClose}
          aria-label="Close Key Account login"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 6L6 18M6 6l12 12"
            />
          </svg>
        </button>

        {/* LOCK ICON */}

        <div className="kam-login-icon">
          <svg
            viewBox="0 0 24 24"
            width="26"
            height="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect
              x="5"
              y="11"
              width="14"
              height="9"
              rx="2"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 11V7a4 4 0 0 1 8 0v4"
            />
          </svg>
        </div>

        <p className="kam-login-eyebrow">
          Secure access
        </p>

        <h2
          id="kam-login-title"
          className="kam-login-title"
        >
          Key Account Login
        </h2>

        <p className="kam-login-subtitle">
          Sign in to continue with Key Account
          Management.
        </p>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="kam-login-form"
          noValidate
        >
          {/* USERNAME */}

          <div className="kam-login-field">
            <label htmlFor="kam-username">
              Username
            </label>

            <div className="kam-login-input-wrap">
              <svg
                className="kam-login-input-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 20c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"
                />
              </svg>

              <input
                id="kam-username"
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);

                  if (error) {
                    setError("");
                  }
                }}
                placeholder="Enter username"
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          {/* PASSWORD */}

          <div className="kam-login-field">
            <label htmlFor="kam-password">
              Password
            </label>

            <div className="kam-login-input-wrap">
              <svg
                className="kam-login-input-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect
                  x="5"
                  y="11"
                  width="14"
                  height="9"
                  rx="2"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 11V7a4 4 0 0 1 8 0v4"
                />
              </svg>

              <input
                id="kam-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);

                  if (error) {
                    setError("");
                  }
                }}
                placeholder="Enter password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="kam-login-eye"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3l18 18"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.6 10.6a2 2 0 002.8 2.8"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.5 6.7C4.4 8.1 2.9 10 2 12c1.6 3.6 5.6 7 10 7 1.7 0 3.3-.4 4.7-1.2M9.9 4.2A10.8 10.8 0 0112 4c4.4 0 8.4 3.4 10 7-.6 1.3-1.4 2.6-2.5 3.7"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2 12c1.6-3.6 5.6-7 10-7s8.4 3.4 10 7c-1.6 3.6-5.6 7-10 7s-8.4-3.4-10-7z"
                    />

                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <p
              className="kam-login-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* LOGIN */}

          <button
            type="submit"
            className="kam-login-submit"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2l7 3v6c0 4.6-3 8.4-7 9.5-4-1.1-7-4.9-7-9.5V5l7-3z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4"
              />
            </svg>

            Login
          </button>
        </form>

        <div className="kam-login-divider" />

        <p className="kam-login-footer">
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect
              x="5"
              y="11"
              width="14"
              height="9"
              rx="2"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 11V7a4 4 0 0 1 8 0v4"
            />
          </svg>

          Authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default KamManagementLogin;