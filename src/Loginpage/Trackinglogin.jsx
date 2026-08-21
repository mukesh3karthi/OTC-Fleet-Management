import React, {
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

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin@2026";

const Trackinglogin = ({
  open = true,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [isLoggingIn, setIsLoggingIn] =
    useState(false);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");

    const cleanUsername =
      username.trim();

    const cleanPassword =
      password.trim();

    if (
      !cleanUsername &&
      !cleanPassword
    ) {
      setError(
        "Please enter username and password."
      );
      return;
    }

    if (!cleanUsername) {
      setError(
        "Please enter username."
      );
      return;
    }

    if (!cleanPassword) {
      setError(
        "Please enter password."
      );
      return;
    }

    setIsLoggingIn(true);

    if (
      cleanUsername === VALID_USERNAME &&
      cleanPassword === VALID_PASSWORD
    ) {
      sessionStorage.setItem(
        "trackingLoggedIn",
        "true"
      );

      sessionStorage.setItem(
        "trackingUsername",
        cleanUsername
      );

      setIsLoggingIn(false);

      onLoginSuccess?.({
        username: cleanUsername,
      });

      onClose?.();

      return;
    }

    setIsLoggingIn(false);

    setError(
      "Invalid username or password."
    );
  };

  return (
    <div
      className="tracking-login-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracking-login-title"
    >
      <div
        className="tracking-login-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="tracking-login-close"
          onClick={onClose}
          aria-label="Close login"
        >
          <X size={17} />
        </button>

        <div className="tracking-login-icon">
          <LockKeyhole size={25} />
        </div>

        <div className="tracking-login-heading">
          <span>SECURE ACCESS</span>

          <h2 id="tracking-login-title">
            Tracking Login
          </h2>

          <p>
            Sign in to continue with trip
            management.
          </p>
        </div>

        <form
          className="tracking-login-form"
          onSubmit={handleSubmit}
        >
          <div className="tracking-login-field">
            <label htmlFor="trackingUsername">
              Username
            </label>

            <div className="tracking-login-input">
              <User size={17} />

              <input
                id="trackingUsername"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(event) => {
                  setUsername(
                    event.target.value
                  );

                  setError("");
                }}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="tracking-login-field">
            <label htmlFor="trackingPassword">
              Password
            </label>

            <div className="tracking-login-input">
              <LockKeyhole size={17} />

              <input
                id="trackingPassword"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );

                  setError("");
                }}
                autoComplete="current-password"
              />

              <button
                type="button"
                className="tracking-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="tracking-login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="tracking-login-submit"
            disabled={isLoggingIn}
          >
            <ShieldCheck size={16} />

            <span>
              {isLoggingIn
                ? "Opening..."
                : "Login"}
            </span>
          </button>
        </form>

        <div className="tracking-login-footer">
          <LockKeyhole size={12} />

          <span>
            Authorized personnel only
          </span>
        </div>
      </div>
    </div>
  );
};

export default Trackinglogin;