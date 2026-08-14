import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./ownvehiclelogin.css";

const VALID_USERNAME =
  "admin";

const VALID_PASSWORD =
  "admin@2026";

const Ownvehiclelogin = ({
  open,
  onClose,
  onLogin,
}) => {
  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const usernameInputRef =
    useRef(null);

  const clearForm =
    useCallback(() => {
      setUsername("");
      setPassword("");
      setError("");
    }, []);

  const handleClose =
    useCallback(() => {
      clearForm();

      if (
        typeof onClose ===
        "function"
      ) {
        onClose();
      }
    }, [
      clearForm,
      onClose,
    ]);

  useEffect(() => {
    if (!open) {
      clearForm();
      return undefined;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    const focusTimer =
      window.setTimeout(
        () => {
          usernameInputRef
            .current?.focus();
        },
        50
      );

    const handleEscape = (
      event
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        handleClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.clearTimeout(
        focusTimer
      );

      window.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    open,
    clearForm,
    handleClose,
  ]);

  if (!open) {
    return null;
  }

  const handleSubmit = (
    event
  ) => {
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
      "ownVehicleLoggedIn",
      "true"
    );

    sessionStorage.setItem(
      "ownVehicleUsername",
      trimmedUsername
    );

    clearForm();

    if (
      typeof onLogin ===
      "function"
    ) {
      onLogin({
        username:
          trimmedUsername,
      });
    }
  };

  return (
    <div
      className="own-login-overlay"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="own-login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="own-vehicle-login-title"
      >
        <div className="own-login-header">
          <div>
            <h2 id="own-vehicle-login-title">
              Own Vehicle Login
            </h2>

            <p>
              Sign in to access
              vehicle data entry.
            </p>
          </div>

          <button
            type="button"
            className="own-login-close-button"
            onClick={
              handleClose
            }
            aria-label="Close login popup"
          >
            ×
          </button>
        </div>

        <form
          className="own-login-form"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          <div className="own-login-group">
            <label htmlFor="own-login-username">
              Username
            </label>

            <input
              ref={
                usernameInputRef
              }
              id="own-login-username"
              type="text"
              placeholder="Enter username"
              value={username}
              autoComplete="username"
              onChange={(
                event
              ) => {
                setUsername(
                  event.target
                    .value
                );

                if (error) {
                  setError("");
                }
              }}
            />
          </div>

          <div className="own-login-group">
            <label htmlFor="own-login-password">
              Password
            </label>

            <input
              id="own-login-password"
              type="password"
              placeholder="Enter password"
              value={password}
              autoComplete="current-password"
              onChange={(
                event
              ) => {
                setPassword(
                  event.target
                    .value
                );

                if (error) {
                  setError("");
                }
              }}
            />
          </div>

          {error && (
            <p
              className="own-login-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="own-login-submit-button"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Ownvehiclelogin;