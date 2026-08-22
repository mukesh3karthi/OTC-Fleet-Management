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

import "./ownvehiclelogin.css";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin@2026";

const Ownvehiclelogin = ({
  open,
  onClose,
  onLogin,
}) => {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    isLoggingIn,
    setIsLoggingIn,
  ] = useState(false);

  const usernameInputRef =
    useRef(null);

  /* =========================================
     CLEAR FORM
  ========================================= */

  const clearForm = useCallback(() => {
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setError("");
    setIsLoggingIn(false);
  }, []);

  /* =========================================
     CLOSE
  ========================================= */

  const handleClose = useCallback(() => {
    clearForm();

    if (
      typeof onClose === "function"
    ) {
      onClose();
    }
  }, [
    clearForm,
    onClose,
  ]);

  /* =========================================
     MODAL EFFECT
  ========================================= */

  useEffect(() => {
    if (!open) {
      clearForm();
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const focusTimer =
      window.setTimeout(() => {
        usernameInputRef
          .current?.focus();
      }, 50);

    const handleEscape = (
      event
    ) => {
      if (
        event.key === "Escape"
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

  /* =========================================
     LOGIN
  ========================================= */

  const handleSubmit = (
    event
  ) => {
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
      cleanUsername ===
        VALID_USERNAME &&
      cleanPassword ===
        VALID_PASSWORD
    ) {
      sessionStorage.setItem(
        "ownVehicleLoggedIn",
        "true"
      );

      sessionStorage.setItem(
        "ownVehicleUsername",
        cleanUsername
      );

      setIsLoggingIn(false);

      if (
        typeof onLogin ===
        "function"
      ) {
        onLogin({
          username:
            cleanUsername,
        });
      }

      return;
    }

    setIsLoggingIn(false);

    setError(
      "Invalid username or password."
    );
  };

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div
      className="own-secure-login-overlay"
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
        className="own-secure-login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="own-secure-login-title"
        onMouseDown={(
          event
        ) => {
          event.stopPropagation();
        }}
      >
        {/* CLOSE */}

        <button
          type="button"
          className="own-secure-login-close"
          onClick={
            handleClose
          }
          aria-label="Close login"
        >
          <X size={17} />
        </button>

        {/* LOCK ICON */}

        <div className="own-secure-login-icon">
          <LockKeyhole
            size={25}
          />
        </div>

        {/* HEADING */}

        <div className="own-secure-login-heading">
          <span>
            SECURE ACCESS
          </span>

          <h2
            id="own-secure-login-title"
          >
            Own Vehicle Login
          </h2>

          <p>
            Sign in to access vehicle
            data entry.
          </p>
        </div>

        {/* FORM */}

        <form
          className="own-secure-login-form"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          {/* USERNAME */}

          <div className="own-secure-login-field">
            <label htmlFor="ownVehicleUsername">
              Username
            </label>

            <div className="own-secure-login-input">
              <User
                size={17}
              />

              <input
                ref={
                  usernameInputRef
                }
                id="ownVehicleUsername"
                type="text"
                placeholder="Enter username"
                value={
                  username
                }
                autoComplete="username"
                onChange={(
                  event
                ) => {
                  setUsername(
                    event.target.value
                  );

                  setError("");
                }}
              />
            </div>
          </div>

          {/* PASSWORD */}

          <div className="own-secure-login-field">
            <label htmlFor="ownVehiclePassword">
              Password
            </label>

            <div className="own-secure-login-input">
              <LockKeyhole
                size={17}
              />

              <input
                id="ownVehiclePassword"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password"
                value={
                  password
                }
                autoComplete="current-password"
                onChange={(
                  event
                ) => {
                  setPassword(
                    event.target.value
                  );

                  setError("");
                }}
              />

              <button
                type="button"
                className="own-secure-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (
                      previous
                    ) =>
                      !previous
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
                    size={17}
                  />
                ) : (
                  <Eye
                    size={17}
                  />
                )}
              </button>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div
              className="own-secure-login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* LOGIN */}

          <button
            type="submit"
            className="own-secure-login-submit"
            disabled={
              isLoggingIn
            }
          >
            <ShieldCheck
              size={16}
            />

            <span>
              {isLoggingIn
                ? "Opening..."
                : "Login"}
            </span>
          </button>
        </form>

        {/* FOOTER */}

        <div className="own-secure-login-footer">
          <LockKeyhole
            size={12}
          />

          <span>
            Authorized personnel only
          </span>
        </div>
      </div>
    </div>
  );
};

export default Ownvehiclelogin;