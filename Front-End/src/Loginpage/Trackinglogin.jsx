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

import {
  useNavigate,
} from "react-router-dom";

import "./Trackinglogin.css";


const Trackinglogin = ({
  onClose,
}) => {

  const navigate =
    useNavigate();


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
     LOGIN
  ========================================= */

  const handleSubmit = (
    event
  ) => {

    event.preventDefault();

    setError("");


    const cleanUsername =
      username.trim();


    /* Both empty */

    if (
      !cleanUsername &&
      !password.trim()
    ) {

      setError(
        "Please enter username and password."
      );

      return;
    }


    /* Username empty */

    if (!cleanUsername) {

      setError(
        "Please enter username."
      );

      return;
    }


    /* Password empty */

    if (!password.trim()) {

      setError(
        "Please enter password."
      );

      return;
    }


    /* =========================================
       TEMPORARY LOGIN CHECK
    ========================================= */

    if (
      cleanUsername === "admin" &&
      password === "admin@2026"
    ) {

      sessionStorage.setItem(
        "trackingLoggedIn",
        "true"
      );


      sessionStorage.setItem(
        "trackingUsername",
        cleanUsername
      );


      /* Close login */

      onClose?.();


      /* =========================================
         OPEN TRACKING INPUT PAGE
      ========================================= */

      navigate(
        "/tracking-input"
      );


      return;
    }


    setError(
      "Invalid username or password."
    );

  };


  /* =========================================
     OVERLAY CLOSE
  ========================================= */

  const handleOverlayClick = (
    event
  ) => {

    if (
      event.target ===
      event.currentTarget
    ) {

      onClose?.();

    }

  };


  return (

    <div
      className="tracking-login-overlay"
      onMouseDown={
        handleOverlayClick
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracking-login-title"
    >

      <div
        className="tracking-login-modal"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >

        {/* CLOSE */}

        <button
          type="button"
          className="tracking-login-close"
          onClick={
            onClose
          }
          aria-label="Close login"
        >

          <X
            size={17}
          />

        </button>


        {/* ICON */}

        <div className="tracking-login-icon">

          <LockKeyhole
            size={25}
          />

        </div>


        {/* HEADING */}

        <div className="tracking-login-heading">

          <span>
            SECURE ACCESS
          </span>


          <h2
            id="tracking-login-title"
          >
            Tracking Login
          </h2>


          <p>
            Sign in to continue with
            tracking data entry.
          </p>

        </div>


        {/* FORM */}

        <form
          className="tracking-login-form"
          onSubmit={
            handleSubmit
          }
        >

          {/* USERNAME */}

          <div className="tracking-login-field">

            <label
              htmlFor="trackingUsername"
            >
              Username
            </label>


            <div className="tracking-login-input">

              <User
                size={17}
              />


              <input
                id="trackingUsername"
                type="text"
                placeholder="Enter username"
                value={
                  username
                }
                onChange={(
                  event
                ) => {

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


          {/* PASSWORD */}

          <div className="tracking-login-field">

            <label
              htmlFor="trackingPassword"
            >
              Password
            </label>


            <div className="tracking-login-input">

              <LockKeyhole
                size={17}
              />


              <input
                id="trackingPassword"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password"
                value={
                  password
                }
                onChange={(
                  event
                ) => {

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
              className="tracking-login-error"
              role="alert"
            >
              {error}
            </div>

          )}


          {/* LOGIN */}

          <button
            type="submit"
            className="tracking-login-submit"
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

        <div className="tracking-login-footer">

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


export default Trackinglogin;