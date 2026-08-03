import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import "./intercartinglogin.css";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin123";

const Intercarttinglogin = ({
  open,
  onClose,
  onLogin,
}) => {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const clearForm = useCallback(() => {
    setUsername("");
    setPassword("");
    setError("");
  }, []);

  const handleClose = useCallback(() => {
    clearForm();
    onClose();
  }, [clearForm, onClose]);

  useEffect(() => {
    if (!open) {
      clearForm();
    }
  }, [open, clearForm]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

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
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open, handleClose]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const trimmedUsername =
      username.trim();

    const trimmedPassword =
      password.trim();

    if (
      !trimmedUsername &&
      !trimmedPassword
    ) {
      setError(
        "Please enter username and password."
      );
      return;
    }

    if (!trimmedUsername) {
      setError(
        "Please enter username."
      );
      return;
    }

    if (!trimmedPassword) {
      setError(
        "Please enter password."
      );
      return;
    }

    if (
      trimmedUsername !==
        VALID_USERNAME ||
      trimmedPassword !==
        VALID_PASSWORD
    ) {
      setError(
        "Invalid username or password."
      );
      return;
    }

    sessionStorage.setItem(
      "intercartingLoggedIn",
      "true"
    );

    clearForm();

    onLogin({
      username: trimmedUsername,
    });
  };

  return (
    <div
      className="login-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="intercarting-login-title"
      >
        <div className="login-header">
          <h2 id="intercarting-login-title">
            Intercarting Login
          </h2>

          <button
            type="button"
            className="close-btn"
            onClick={handleClose}
            aria-label="Close login popup"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-group">
            <label htmlFor="intercarting-username">
              Username
            </label>

            <input
              id="intercarting-username"
              type="text"
              placeholder="Enter username"
              value={username}
              autoComplete="username"
              autoFocus
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

          <div className="login-group">
            <label htmlFor="intercarting-password">
              Password
            </label>

            <input
              id="intercarting-password"
              type="password"
              placeholder="Enter password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => {
                setPassword(
                  event.target.value
                );

                if (error) {
                  setError("");
                }
              }}
            />
          </div>

          {error && (
            <p
              className="login-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-btn"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Intercarttinglogin;
