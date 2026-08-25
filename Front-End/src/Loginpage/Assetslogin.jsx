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


  /* =========================================
     RESET WHEN MODAL OPENS
  ========================================= */

  useEffect(() => {

    if (!open) {
      return;
    }

    setUsername("");
    setPassword("");
    setError("");
    setShowPassword(false);

  }, [open]);


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


    if (
      !cleanUsername &&
      !password
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


    if (!password) {

      setError(
        "Please enter password."
      );

      return;

    }


    /* =========================================
       TEMPORARY LOGIN
       Replace with API later
    ========================================= */

    if (
      cleanUsername !== "admin" ||
      password !== "admin@2026"
    ) {

      setError(
        "Invalid username or password."
      );

      return;

    }


    /* =========================================
       SAVE ASSETS LOGIN SESSION
    ========================================= */

    sessionStorage.setItem(
      "assetsLoggedIn",
      "true"
    );

    sessionStorage.setItem(
      "assetsUsername",
      cleanUsername
    );


    /* =========================================
       LOGIN SUCCESS
    ========================================= */

    if (
      typeof onLoginSuccess ===
      "function"
    ) {

      onLoginSuccess();

    }

  };


  /* =========================================
     RETURN
  ========================================= */

  return (

    <div
      className="assets-login-overlay"

      onMouseDown={(event) => {

        if (
          event.target ===
          event.currentTarget
        ) {

          onClose?.();

        }

      }}
    >

      <div
        className="assets-login-modal"

        role="dialog"

        aria-modal="true"

        aria-labelledby="assets-login-title"
      >


        {/* TOP LINE */}

        <div
          className="assets-login-top-line"
        />


        {/* CLOSE */}

        <button
          type="button"

          className="assets-login-close"

          onClick={
            onClose
          }

          aria-label="Close Assets Login"
        >

          <X size={18} />

        </button>


        {/* ICON */}

        <div
          className="assets-login-icon"
        >

          <LockKeyhole
            size={27}
          />

        </div>


        {/* EYEBROW */}

        <span
          className="assets-login-eyebrow"
        >
          SECURE ACCESS
        </span>


        {/* TITLE */}

        <h2
          id="assets-login-title"
        >
          Assets Login
        </h2>


        {/* DESCRIPTION */}

        <p
          className="assets-login-description"
        >
          Sign in to access asset
          management and data entry.
        </p>


        {/* FORM */}

        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* USERNAME */}

          <div
            className="assets-login-field"
          >

            <label
              htmlFor="assets-username"
            >
              Username
            </label>


            <div
              className="assets-login-input"
            >

              <User
                size={17}
              />


              <input
                id="assets-username"

                type="text"

                value={
                  username
                }

                placeholder="Enter username"

                autoComplete="username"

                autoFocus

                onChange={(event) => {

                  setUsername(
                    event.target.value
                  );

                  setError("");

                }}
              />

            </div>

          </div>


          {/* PASSWORD */}

          <div
            className="assets-login-field"
          >

            <label
              htmlFor="assets-password"
            >
              Password
            </label>


            <div
              className="assets-login-input"
            >

              <LockKeyhole
                size={16}
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

                placeholder="Enter password"

                autoComplete="current-password"

                onChange={(event) => {

                  setPassword(
                    event.target.value
                  );

                  setError("");

                }}
              />


              <button
                type="button"

                className="assets-password-toggle"

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
                        size={17}
                      />
                    )
                    : (
                      <Eye
                        size={17}
                      />
                    )
                }

              </button>

            </div>

          </div>


          {/* ERROR */}

          {error && (

            <div
              className="assets-login-error"
              role="alert"
            >
              {error}
            </div>

          )}


          {/* LOGIN */}

          <button
            type="submit"

            className="assets-login-button"
          >

            <ShieldCheck
              size={16}
            />

            <span>
              Login
            </span>

          </button>

        </form>


        {/* FOOTER */}

        <div
          className="assets-login-footer"
        >

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


export default Assetslogin;