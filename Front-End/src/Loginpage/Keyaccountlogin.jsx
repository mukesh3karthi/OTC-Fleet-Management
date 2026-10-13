import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./keyaccountlogin.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const SESSION_KEYS = [
  "kamToken",
  "kamUser",
  "kamUserId",
  "kamUsername",
  "kamLoggedIn",
];

const clearKamSession = () => {
  SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
};

const LockIcon = ({ size = 24 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const KeyaccountLogin = ({
  open,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setUsername("");
      setPassword("");
      setShowPassword(false);
      setError("");
      setLoading(false);
    }

    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
      submittingRef.current = false;
    };
  }, [open]);

  const handleClose = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    submittingRef.current = false;
    setLoading(false);
    onClose?.();
  };

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        requestRef.current?.abort();
        requestRef.current = null;
        submittingRef.current = false;
        setLoading(false);
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) return;

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setError("Please enter username and password.");
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError("");

    const controller = new AbortController();
    requestRef.current = controller;

    let authenticatedUser = null;

    try {
      // Remove any previous Key Account identity before switching users.
      clearKamSession();

      const { data } = await axios.post(
        `${API_BASE_URL}/api/auth/kam/login`,
        {
          username: cleanUsername,
          password,
        },
        {
          signal: controller.signal,
          timeout: 15000,
        }
      );

      if (controller.signal.aborted) return;

      const { token, user } = data || {};

      if (
        !data?.success ||
        typeof token !== "string" ||
        !token ||
        !user?._id ||
        !user?.username ||
        user.role !== "keyaccount"
      ) {
        setError("Invalid login response. Contact your administrator.");
        return;
      }

      sessionStorage.setItem("kamToken", token);
      sessionStorage.setItem("kamUser", JSON.stringify(user));
      sessionStorage.setItem("kamUserId", String(user._id));
      sessionStorage.setItem("kamUsername", user.username);
      sessionStorage.setItem("kamLoggedIn", "true");

      // Preserve your existing module-switching behavior.
      sessionStorage.removeItem("trafficLoggedIn");
      sessionStorage.removeItem("trafficUsername");

      setPassword("");
      setShowPassword(false);
      authenticatedUser = user;
    } catch (err) {
      if (controller.signal.aborted || axios.isCancel(err)) return;

      clearKamSession();

      if (err.response?.status === 401) {
        setError("Invalid username or password.");
      } else if (err.response?.status === 429) {
        setError("Too many attempts. Please try again later.");
      } else if (err.code === "ECONNABORTED") {
        setError("Login timed out. Please try again.");
      } else {
        setError("Unable to login. Check your backend connection.");
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        submittingRef.current = false;

        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (authenticatedUser && !controller.signal.aborted) {
      onLoginSuccess?.(authenticatedUser);
    }
  };

  if (!open) return null;

  return (
    <div
      className="kam-login-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="kam-login-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kam-login-title"
      >
        <div className="kam-login-topbar" />

        <button
          type="button"
          className="kam-login-close"
          onClick={handleClose}
          aria-label="Close login"
        >
          ×
        </button>

        <div className="kam-login-icon">
          <LockIcon size={26} />
        </div>

        <p className="kam-login-eyebrow">Secure access</p>

        <h2 id="kam-login-title" className="kam-login-title">
          Key Account Login
        </h2>

        <p className="kam-login-subtitle">
          Sign in with your individual Key Account credentials.
        </p>

        <form
          className="kam-login-form"
          onSubmit={handleSubmit}
          aria-busy={loading}
        >
          <div className="kam-login-field">
            <label htmlFor="kam-username">Username</label>

            <div className="kam-login-input-wrap">
              <svg
                className="kam-login-input-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>

              <input
                id="kam-username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                }}
                placeholder="Enter username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="kam-login-field">
            <label htmlFor="kam-password">Password</label>

            <div className="kam-login-input-wrap">
              <span className="kam-login-input-icon">
                <LockIcon size={18} />
              </span>

              <input
                id="kam-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                disabled={loading}
              />

              <button
                type="button"
                className="kam-login-eye"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                disabled={loading}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M2 12c1.6-3.6 5.6-7 10-7s8.4 3.4 10 7c-1.6 3.6-5.6 7-10 7S3.6 15.6 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="M3 3l18 18" />}
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <p className="kam-login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="kam-login-submit"
            disabled={loading}
          >
            <LockIcon size={16} />
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="kam-login-divider" />

        <p className="kam-login-footer">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default KeyaccountLogin;