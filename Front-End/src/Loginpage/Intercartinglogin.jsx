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

import "./intercartinglogin.css";


/* =========================================================
   TEMPORARY FRONTEND LOGIN

   For production:
   Move username/password validation to backend API.
========================================================= */

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin@2026";


const Intercartinglogin = ({
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
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    isLoggingIn,
    setIsLoggingIn,
  ] = useState(false);

  const usernameInputRef =
    useRef(null);


  /* =========================================================
     CLEAR FORM
  ========================================================= */

  const clearForm = useCallback(() => {

    setUsername("");
    setPassword("");
    setShowPassword(false);
    setError("");
    setIsLoggingIn(false);

  }, []);


  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = useCallback(() => {

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


  /* =========================================================
     MODAL EFFECT
  ========================================================= */

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
          .current
          ?.focus();

      }, 50);


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


  /* =========================================================
     DON'T RENDER WHEN CLOSED
  ========================================================= */

  if (!open) {
    return null;
  }


  /* =========================================================
     LOGIN
  ========================================================= */

  const handleSubmit = (
    event
  ) => {

    event.preventDefault();

    setError("");


    const cleanUsername =
      username.trim();

    const cleanPassword =
      password.trim();


    /* BOTH EMPTY */

    if (
      !cleanUsername &&
      !cleanPassword
    ) {

      setError(
        "Please enter username and password."
      );

      return;

    }


    /* USERNAME EMPTY */

    if (!cleanUsername) {

      setError(
        "Please enter username."
      );

      return;

    }


    /* PASSWORD EMPTY */

    if (!cleanPassword) {

      setError(
        "Please enter password."
      );

      return;

    }


    /* =========================================================
       START LOGIN
    ========================================================= */

    setIsLoggingIn(true);


    /* =========================================================
       LOGIN SUCCESS
    ========================================================= */

    if (
      cleanUsername ===
        VALID_USERNAME &&
      cleanPassword ===
        VALID_PASSWORD
    ) {

      sessionStorage.setItem(
        "intercartingLoggedIn",
        "true"
      );

      sessionStorage.setItem(
        "intercartingUsername",
        cleanUsername
      );


      setIsLoggingIn(false);

      setError("");


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


    /* =========================================================
       INVALID LOGIN
    ========================================================= */

    setIsLoggingIn(false);

    setError(
      "Invalid username or password."
    );

  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div
      className="inter-login-overlay"

      onMouseDown={(event) => {

        if (
          event.target ===
          event.currentTarget
        ) {

          handleClose();

        }

      }}

      role="presentation"
    >

      <div
        className="inter-login-card"

        role="dialog"

        aria-modal="true"

        aria-labelledby="inter-login-title"

        onMouseDown={(event) => {

          event.stopPropagation();

        }}
      >


        {/* =====================================================
            TOP BAR
        ===================================================== */}

        <div
          className="inter-login-topbar"
        />


        {/* =====================================================
            CLOSE
        ===================================================== */}

        <button
          type="button"

          className="inter-login-close"

          onClick={
            handleClose
          }

          aria-label="Close Intercarting Login"
        >

          <X
            size={18}
          />

        </button>


        {/* =====================================================
            ICON
        ===================================================== */}

        <div
          className="inter-login-icon"
        >

          <LockKeyhole
            size={26}
          />

        </div>


        {/* =====================================================
            EYEBROW
        ===================================================== */}

        <p
          className="inter-login-eyebrow"
        >
          Secure access
        </p>


        {/* =====================================================
            TITLE
        ===================================================== */}

        <h2
          id="inter-login-title"

          className="inter-login-title"
        >
          Intercarting Login
        </h2>


        {/* =====================================================
            SUBTITLE
        ===================================================== */}

        <p
          className="inter-login-subtitle"
        >
          Sign in to continue with
          Intercarting Management.
        </p>


        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          className="inter-login-form"

          onSubmit={
            handleSubmit
          }

          noValidate
        >


          {/* =================================================
              USERNAME
          ================================================= */}

          <div
            className="inter-login-field"
          >

            <label
              htmlFor="interUsername"
            >
              Username
            </label>


            <div
              className="inter-login-input-wrap"
            >

              <User
                size={18}

                className="inter-login-input-icon"
              />


              <input
                ref={
                  usernameInputRef
                }

                id="interUsername"

                type="text"

                placeholder="Enter username"

                value={
                  username
                }

                autoComplete="username"

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


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div
            className="inter-login-field"
          >

            <label
              htmlFor="interPassword"
            >
              Password
            </label>


            <div
              className="inter-login-input-wrap"
            >

              <LockKeyhole
                size={18}

                className="inter-login-input-icon"
              />


              <input
                id="interPassword"

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

                onChange={(event) => {

                  setPassword(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }

                }}
              />


              {/* PASSWORD EYE */}

              <button
                type="button"

                className="inter-login-eye"

                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }

                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                {
                  showPassword
                    ? (
                      <EyeOff
                        size={18}
                      />
                    )
                    : (
                      <Eye
                        size={18}
                      />
                    )
                }

              </button>

            </div>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <p
              className="inter-login-error"

              role="alert"
            >
              {error}
            </p>

          )}


          {/* =================================================
              LOGIN
          ================================================= */}

          <button
            type="submit"

            className="inter-login-submit"

            disabled={
              isLoggingIn
            }
          >

            <ShieldCheck
              size={16}
            />

            <span>
              {
                isLoggingIn
                  ? "Opening..."
                  : "Login"
              }
            </span>

          </button>

        </form>


        {/* =====================================================
            DIVIDER
        ===================================================== */}

        <div
          className="inter-login-divider"
        />


        {/* =====================================================
            FOOTER
        ===================================================== */}

        <p
          className="inter-login-footer"
        >

          <LockKeyhole
            size={13}
          />

          Authorized personnel only

        </p>


      </div>

    </div>

  );

};


export default Intercartinglogin;