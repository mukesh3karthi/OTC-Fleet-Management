import React, {
  useState,
} from "react";

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import KamManagementLogin
  from "../Loginpage/Keyaccountlogin";

const KeyaccountProtectedRoute = ({
  children,
}) => {
  const [
    isLoggedIn,
    setIsLoggedIn,
  ] = useState(() => {
    return (
      sessionStorage.getItem(
        "kamLoggedIn"
      ) === "true"
    );
  });

  const [
    loginClosed,
    setLoginClosed,
  ] = useState(false);

  /* =========================================
     LOGIN SUCCESS
  ========================================= */

  const handleLoginSuccess = () => {
    /*
      Extra safety:
      KAM login means Traffic session
      should not remain active.
    */

    sessionStorage.removeItem(
      "trafficLoggedIn"
    );

    sessionStorage.removeItem(
      "trafficUsername"
    );

    setIsLoggedIn(true);
    setLoginClosed(false);
  };

  /* =========================================
     CLOSE LOGIN
  ========================================= */

  const handleCloseLogin = () => {
    setLoginClosed(true);
  };

  /* =========================================
     ALREADY LOGGED IN
  ========================================= */

  if (isLoggedIn) {
    return (
      children ||
      <Outlet />
    );
  }

  /* =========================================
     LOGIN CLOSED
  ========================================= */

  if (loginClosed) {
    return (
      <Navigate
        to="/trip-dashboard"
        replace
      />
    );
  }

  /* =========================================
     ASK KAM LOGIN
  ========================================= */

  return (
    <KamManagementLogin
      open={true}
      onClose={
        handleCloseLogin
      }
      onLoginSuccess={
        handleLoginSuccess
      }
    />
  );
};

export default KeyaccountProtectedRoute;