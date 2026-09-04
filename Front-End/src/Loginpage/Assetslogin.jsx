import React, {
  useEffect,
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

import "./assetslogin.css";


/* =========================================================
   TEMPORARY FRONTEND LOGIN

   For production:
   Move validation to backend API.
========================================================= */

const ASSETS_USERNAME = "admin";
const ASSETS_PASSWORD = "admin@2026";


const Assetslogin = ({
  open,
  onClose,
  onLoginSuccess,
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

    if (!open) {
      return undefined;
    }


    const handleKeyDown = (
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
      handleKeyDown
    );


    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, [open]);


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


    const cleanUsername =
      username.trim();


    /* BOTH EMPTY */

    if (
      !cleanUsername &&
      !password
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

    if (!password) {

      setError(
        "Please enter password."
      );

      return;

    }


    /* =========================================================
       LOGIN CHECK
    ========================================================= */

    if (
      cleanUsername ===
        ASSETS_USERNAME &&
      password ===
        ASSETS_PASSWORD
    ) {

      /* SAVE SESSION */

      sessionStorage.setItem(
        "assetsLoggedIn",
        "true"
      );

      sessionStorage.setItem(
        "assetsUsername",
        cleanUsername
      );


      /* RESET */

      setError("");
      setUsername("");
      setPassword("");
      setShowPassword(false);


      /* SUCCESS */

      onLoginSuccess?.(
        cleanUsername
      );

      return;

    }


    setError(
      "Invalid username or password."
    );

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
      className="assets-login-overlay"

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
        className="assets-login-card"

        role="dialog"

        aria-modal="true"

        aria-labelledby="assets-login-title"
      >


        {/* =====================================================
            TOP BAR
        ===================================================== */}

        <div
          className="assets-login-topbar"
        />


        {/* =====================================================
            CLOSE BUTTON
        ===================================================== */}

        <button
          type="button"

          className="assets-login-close"

          onClick={
            handleClose
          }

          aria-label="Close Assets Login"
        >

          <X
            size={18}
          />

        </button>


        {/* =====================================================
            LOCK ICON
        ===================================================== */}

        <div
          className="assets-login-icon"
        >

          <LockKeyhole
            size={26}
          />

        </div>


        {/* =====================================================
            EYEBROW
        ===================================================== */}

        <p
          className="assets-login-eyebrow"
        >
          Secure access
        </p>


        {/* =====================================================
            TITLE
        ===================================================== */}

        <h2
          id="assets-login-title"

          className="assets-login-title"
        >
          Assets Login
        </h2>


        {/* =====================================================
            SUBTITLE
        ===================================================== */}

        <p
          className="assets-login-subtitle"
        >
          Sign in to continue with
          Assets Management.
        </p>


        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={
            handleSubmit
          }

          className="assets-login-form"

          noValidate
        >


          {/* =================================================
              USERNAME
          ================================================= */}

          <div
            className="assets-login-field"
          >

            <label
              htmlFor="assets-username"
            >
              Username
            </label>


            <div
              className="assets-login-input-wrap"
            >

              <User
                size={18}

                className="assets-login-input-icon"
              />


              <input
                id="assets-username"

                type="text"

                value={
                  username
                }

                onChange={(event) => {

                  setUsername(
                    event.target.value
                  );


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


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div
            className="assets-login-field"
          >

            <label
              htmlFor="assets-password"
            >
              Password
            </label>


            <div
              className="assets-login-input-wrap"
            >

              <LockKeyhole
                size={18}

                className="assets-login-input-icon"
              />


              <input
                id="assets-password"

                type={
                  showPassword
                    ? "text"
                    : "password"
                }

                value={
                  password
                }

                onChange={(event) => {

                  setPassword(
                    event.target.value
                  );


                  if (error) {
                    setError("");
                  }

                }}

                placeholder="Enter password"

                autoComplete="current-password"
              />


              {/* PASSWORD EYE */}

              <button
                type="button"

                className="assets-login-eye"

                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
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
              className="assets-login-error"

              role="alert"
            >
              {error}
            </p>

          )}


          {/* =================================================
              LOGIN BUTTON
          ================================================= */}

          <button
            type="submit"

            className="assets-login-submit"
          >

            <ShieldCheck
              size={16}
            />

            Login

          </button>

        </form>


        {/* =====================================================
            DIVIDER
        ===================================================== */}

        <div
          className="assets-login-divider"
        />


        {/* =====================================================
            FOOTER
        ===================================================== */}

        <p
          className="assets-login-footer"
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


export default Assetslogin;