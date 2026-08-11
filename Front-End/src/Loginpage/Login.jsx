import React, { useState } from "react";
import axios from "axios";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./Login.css";
import OTClogo from "../asset/otclogo.jpg";


/* =========================================
   API CONFIGURATION
========================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const LOGIN_API =
  `${API_BASE_URL}/api/auth/login`;


/* =========================================
   LOGIN COMPONENT
========================================= */

const Login = () => {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    usernameError,
    setUsernameError,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    generalError,
    setGeneralError,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const navigate = useNavigate();
  const location = useLocation();


  /* =========================================
     CLEAR ERRORS
  ========================================= */

  const clearErrors = () => {
    setUsernameError("");
    setPasswordError("");
    setGeneralError("");
  };


  /* =========================================
     USERNAME CHANGE
  ========================================= */

  const handleUsernameChange = (
    event
  ) => {
    setUsername(
      event.target.value
    );

    setUsernameError("");
    setGeneralError("");
  };


  /* =========================================
     PASSWORD CHANGE
  ========================================= */

  const handlePasswordChange = (
    event
  ) => {
    setPassword(
      event.target.value
    );

    setPasswordError("");
    setGeneralError("");
  };


  /* =========================================
     FORM VALIDATION
  ========================================= */

  const validateForm = () => {
    const cleanUsername =
      username.trim();

    const cleanPassword =
      password.trim();

    clearErrors();


    /* BOTH EMPTY */

    if (
      !cleanUsername &&
      !cleanPassword
    ) {
      setGeneralError(
        "Please enter username and password."
      );

      return false;
    }


    /* USERNAME EMPTY */

    if (!cleanUsername) {
      setUsernameError(
        "Please enter username."
      );

      return false;
    }


    /* PASSWORD EMPTY */

    if (!cleanPassword) {
      setPasswordError(
        "Please enter password."
      );

      return false;
    }


    return true;
  };


  /* =========================================
     LOGIN
  ========================================= */

  const handleLogin = async (
    event
  ) => {
    event.preventDefault();


    /* VALIDATE */

    if (!validateForm()) {
      return;
    }


    try {
      setLoading(true);
      setGeneralError("");


      /* =====================================
         LOGIN API CALL
      ===================================== */

      const response =
        await axios.post(
          LOGIN_API,
          {
            username:
              username.trim(),

            password:
              password,
          },
          {
            headers: {
              "Content-Type":
                "application/json",
            },

            timeout: 60000,
          }
        );


      /* =====================================
         GET TOKEN
      ===================================== */

      const token =
        response.data?.token;


      if (!token) {
        setGeneralError(
          "Login succeeded, but no token was received."
        );

        return;
      }


      /* =====================================
         GET USERNAME
      ===================================== */

      const loggedInUsername =
        response.data?.user
          ?.username ||
        response.data?.username ||
        username.trim();


      /* =====================================
         SAVE LOGIN
      ===================================== */

      localStorage.setItem(
        "token",
        token
      );


      localStorage.setItem(
        "username",
        loggedInUsername
      );


      /* =====================================
         REDIRECT
      ===================================== */

      const redirectPath =
        location.state?.from
          ?.pathname ||
        "/dashboard";


      navigate(
        redirectPath,
        {
          replace: true,
        }
      );

    } catch (loginError) {

      console.error(
        "Login error:",
        loginError
      );


      /* =====================================
         TIMEOUT
      ===================================== */

      if (
        loginError.code ===
        "ECONNABORTED"
      ) {
        setGeneralError(
          "Server response timed out. Please try again."
        );

        return;
      }


      /* =====================================
         NETWORK / CORS ERROR
      ===================================== */

      if (!loginError.response) {
        setGeneralError(
          "Unable to connect to the server. Please try again."
        );

        return;
      }


      /* =====================================
         SERVER RESPONSE
      ===================================== */

      const status =
        loginError.response.status;


      const serverMessage =
        loginError.response?.data
          ?.message;


      /* INVALID LOGIN */

      if (
        status === 400 ||
        status === 401
      ) {
        setGeneralError(
          serverMessage ||
          "Invalid username or password."
        );

        return;
      }


      /* SERVER ERROR */

      setGeneralError(
        serverMessage ||
        "Login failed. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  /* =========================================
     UI
  ========================================= */

  return (
    <main className="login-page">

      <section className="login-card">


        {/* =====================================
            LEFT PANEL
        ===================================== */}

        <div className="login-left-panel">

          <div className="login-left-content">

            <img
              src={OTClogo}
              alt="OTC Groups logo"
              className="login-logo"
            />


            <h1>
              OTC Groups
            </h1>


            <p>
              Thinking the way forward...
            </p>


            <div className="login-decoration">

              <span />
              <span />
              <span />

            </div>

          </div>

        </div>


        {/* =====================================
            RIGHT PANEL
        ===================================== */}

        <div className="login-right-panel">

          <div className="login-form-wrapper">


            {/* HEADING */}

            <div className="login-heading">

              <h2>
                Welcome Back
              </h2>


              <p>
                Sign in to continue to
                your dashboard.
              </p>

            </div>


            {/* =================================
                FORM
            ================================= */}

            <form
              className="login-form"
              onSubmit={handleLogin}
              noValidate
            >


              {/* USERNAME */}

              <div className="login-field">

                <label
                  htmlFor="username"
                >
                  Username
                </label>


                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={
                    handleUsernameChange
                  }
                  placeholder="Enter username"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                  className={
                    usernameError
                      ? "input-error"
                      : ""
                  }
                  aria-invalid={
                    Boolean(
                      usernameError
                    )
                  }
                  aria-describedby={
                    usernameError
                      ? "username-error"
                      : undefined
                  }
                />


                {usernameError && (

                  <p
                    id="username-error"
                    className="field-error"
                  >
                    {usernameError}
                  </p>

                )}

              </div>


              {/* PASSWORD */}

              <div className="login-field">

                <label
                  htmlFor="password"
                >
                  Password
                </label>


                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={
                    handlePasswordChange
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                  disabled={loading}
                  className={
                    passwordError
                      ? "input-error"
                      : ""
                  }
                  aria-invalid={
                    Boolean(
                      passwordError
                    )
                  }
                  aria-describedby={
                    passwordError
                      ? "password-error"
                      : undefined
                  }
                />


                {passwordError && (

                  <p
                    id="password-error"
                    className="field-error"
                  >
                    {passwordError}
                  </p>

                )}

              </div>


              {/* =================================
                  GENERAL ERROR
              ================================= */}

              {generalError && (

                <div
                  className="login-error-message"
                  role="alert"
                >
                  {generalError}
                </div>

              )}


              {/* =================================
                  LOGIN BUTTON
              ================================= */}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >

                {loading
                  ? "Logging in..."
                  : "Login"}

              </button>

            </form>

          </div>

        </div>

      </section>

    </main>
  );
};

export default Login;