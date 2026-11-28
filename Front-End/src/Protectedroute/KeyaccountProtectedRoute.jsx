import React, { useCallback, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import KeyaccountLogin from "../Loginpage/Keyaccountlogin";

/* =========================================================
   CHECK EXISTING KEY ACCOUNT SESSION
========================================================= */

const hasValidKamSession = () => {
  try {
    const token = sessionStorage.getItem("kamToken");
    const loggedIn = sessionStorage.getItem("kamLoggedIn");
    const storedUser = sessionStorage.getItem("kamUser");

    if (!token?.trim() || loggedIn !== "true" || !storedUser) {
      return false;
    }

    const user = JSON.parse(storedUser);

    return Boolean(user?._id && user?.username && user?.role === "keyaccount");
  } catch {
    return false;
  }
};

/* =========================================================
   KEY ACCOUNT PROTECTED ROUTE
========================================================= */

const KeyaccountProtectedRoute = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(hasValidKamSession);

  const [loginClosed, setLoginClosed] = useState(false);

  /* =========================================================
     LOGIN SUCCESS
  ========================================================= */

  const handleLoginSuccess = useCallback(() => {
    // Preserve existing module-switching behavior.
    sessionStorage.removeItem("trafficLoggedIn");
    sessionStorage.removeItem("trafficUsername");

    setIsLoggedIn(hasValidKamSession());
    setLoginClosed(false);
  }, []);

  /* =========================================================
     CLOSE LOGIN
  ========================================================= */

  const handleCloseLogin = useCallback(() => {
    setLoginClosed(true);
  }, []);

  /* =========================================================
     AUTHENTICATED CONTENT
  ========================================================= */

  if (isLoggedIn && hasValidKamSession()) {
    return children ?? <Outlet />;
  }

  /* =========================================================
     REDIRECT WHEN LOGIN IS CLOSED
  ========================================================= */

  if (loginClosed) {
    return <Navigate to="/trip-dashboard" replace />;
  }

  /* =========================================================
     KEY ACCOUNT LOGIN
  ========================================================= */

  return (
    <KeyaccountLogin
      open={true}
      onClose={handleCloseLogin}
      onLoginSuccess={handleLoginSuccess}
    />
  );
};

export default KeyaccountProtectedRoute;
