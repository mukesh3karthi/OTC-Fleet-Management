import React, { useState } from "react";
import axios from "axios";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./Login.css";
import OTClogo from "../assets/otclogo.jpg"

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const LOGIN_API =
  `${API_BASE_URL}/api/auth/login`;

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

  const clearErrors = () => {
    setUsernameError("");
    setPasswordError("");
    setGeneralError("");
  };

  const handleUsernameChange = (
    event
  ) => {
    setUsername(event.target.value);
    setUsernameError("");
    setGeneralError("");
  };

  const handlePasswordChange = (
    event
  ) => {
    setPassword(event.target.value);
    setPasswordError("");
    setGeneralError("");
  };

  const validateForm = () => {
    const cleanUsername =
      username.trim();

    const cleanPassword =
      password.trim();

    clearErrors();

    if (
      !cleanUsername &&
      !cleanPassword
    ) {
      setGeneralError(
        "Please enter username and password."
      );

      return false;
    }

    if (!cleanUsername) {
      setUsernameError(
        "Please enter username."
      );

      return false;
    }

    if (!cleanPassword) {
      setPasswordError(
        "Please enter password."
      );

      return false;
    }

    return true;
  };

  const handleLogin = async (
    event
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setGeneralError("");

      const response = await axios.post(
        LOGIN_API,
        {
          username: username.trim(),
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 60000,
        }
      );

      const token =
        response.data?.token;

      if (!token) {
        setGeneralError(
          "Login succeeded, but no token was received."
        );

        return;
      }

      const loggedInUsername =
        response.data?.user
          ?.username ||
        response.data?.username ||
        username.trim();

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "username",
        loggedInUsername
      );

      const redirectPath =
        location.state?.from
          ?.pathname ||
        "/dashboard";

      navigate(redirectPath, {
        replace: true,
      });
    } catch (loginError) {
      console.error(
        "Login error:",
        loginError
      );

      if (
        loginError.code ===
        "ECONNABORTED"
      ) {
        setGeneralError(
          "Server response timed out. Please try again."
        );

        return;
      }

      if (!loginError.response) {
        setGeneralError(
          "Unable to connect to the server. Make sure the backend is running."
        );

        return;
      }

      const status =
        loginError.response.status;

      const serverMessage =
        loginError.response?.data
          ?.message;

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

      setGeneralError(
        serverMessage ||
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-left-panel">
          <div className="login-left-content">
            <img
              src={OTClogo}
              alt="OTC Groups logo"
              className="login-logo"
            />

            <h1>OTC Groups</h1>

            <p>
              Thinking the way
              forward...
            </p>

            <div className="login-decoration">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="login-right-panel">
          <div className="login-form-wrapper">
            <div className="login-heading">
              <h2>Welcome Back</h2>

              <p>
                Sign in to continue to
                your dashboard.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={handleLogin}
              noValidate
            >
              <div className="login-field">
                <label htmlFor="username">
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
                  aria-invalid={Boolean(
                    usernameError
                  )}
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

              <div className="login-field">
                <label htmlFor="password">
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
                  aria-invalid={Boolean(
                    passwordError
                  )}
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

              {generalError && (
                <div
                  className="login-error-message"
                  role="alert"
                >
                  {generalError}
                </div>
              )}

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