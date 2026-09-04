import React, {
  useState,
} from "react";

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import Trafficlogin
  from "../Loginpage/Trafficlogin";

const TrafficProtectedRoute = ({
  children,
}) => {
  const [
    isLoggedIn,
    setIsLoggedIn,
  ] = useState(() => {
    return (
      sessionStorage.getItem(
        "trafficLoggedIn"
      ) === "true"
    );
  });

  const [
    loginClosed,
    setLoginClosed,
  ] = useState(false);

  /* =========================================
     TRAFFIC LOGIN SUCCESS
  ========================================= */

  const handleLoginSuccess = () => {
    /*
      Extra safety:
      Traffic login means KAM
      should no longer be logged in.
    */

    sessionStorage.removeItem(
      "kamLoggedIn"
    );

    sessionStorage.removeItem(
      "kamUsername"
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
     ASK TRAFFIC LOGIN
  ========================================= */

  return (
    <Trafficlogin
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

export default TrafficProtectedRoute;