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


/* =========================================================
   TEMPORARY FRONTEND LOGIN

   For production:
   Move username/password validation to backend API.
========================================================= */

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin@2026";


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
        "ownVehicleLoggedIn",
        "true"
      );

      sessionStorage.setItem(
        "ownVehicleUsername",
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
      className="own-login-overlay"

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
        className="own-login-card"

        role="dialog"

        aria-modal="true"

        aria-labelledby="own-login-title"

        onMouseDown={(event) => {

          event.stopPropagation();

        }}
      >


        {/* =====================================================
            TOP BAR
        ===================================================== */}

        <div
          className="own-login-topbar"
        />


        {/* =====================================================
            CLOSE
        ===================================================== */}

        <button
          type="button"

          className="own-login-close"

          onClick={
            handleClose
          }

          aria-label="Close Own Vehicle Login"
        >

          <X
            size={18}
          />

        </button>


        {/* =====================================================
            ICON
        ===================================================== */}

        <div
          className="own-login-icon"
        >

          <LockKeyhole
            size={26}
          />

        </div>


        {/* =====================================================
            EYEBROW
        ===================================================== */}

        <p
          className="own-login-eyebrow"
        >
          Secure access
        </p>


        {/* =====================================================
            TITLE
        ===================================================== */}

        <h2
          id="own-login-title"

          className="own-login-title"
        >
          Own Vehicle Login
        </h2>


        {/* =====================================================
            SUBTITLE
        ===================================================== */}

        <p
          className="own-login-subtitle"
        >
          Sign in to continue with
          Own Vehicle Management.
        </p>


        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          className="own-login-form"

          onSubmit={
            handleSubmit
          }

          noValidate
        >


          {/* =================================================
              USERNAME
          ================================================= */}

          <div
            className="own-login-field"
          >

            <label
              htmlFor="ownVehicleUsername"
            >
              Username
            </label>


            <div
              className="own-login-input-wrap"
            >

              <User
                size={18}

                className="own-login-input-icon"
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
            className="own-login-field"
          >

            <label
              htmlFor="ownVehiclePassword"
            >
              Password
            </label>


            <div
              className="own-login-input-wrap"
            >

              <LockKeyhole
                size={18}

                className="own-login-input-icon"
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

                className="own-login-eye"

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
              className="own-login-error"

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

            className="own-login-submit"

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
          className="own-login-divider"
        />


        {/* =====================================================
            FOOTER
        ===================================================== */}

        <p
          className="own-login-footer"
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


export default Ownvehiclelogin;