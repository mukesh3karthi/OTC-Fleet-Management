import React from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

const Trackingprotected = ({
  children,
}) => {
  const location = useLocation();

  const token =
    localStorage.getItem("token");

  const trackingLoggedIn =
    sessionStorage.getItem(
      "trackingLoggedIn"
    ) === "true";

  if (!token || !token.trim()) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  if (!trackingLoggedIn) {
    return (
      <Navigate
        to="/tracking"
        replace
        state={{
          openTrackingLogin: true,
          from: location.pathname,
        }}
      />
    );
  }

  return children;
};

export default Trackingprotected;