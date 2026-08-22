import React from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

const Intercartingprotected = ({
  children,
}) => {
  const location = useLocation();

  const token =
    localStorage.getItem("token");

  const intercartingLoggedIn =
    sessionStorage.getItem(
      "intercartingLoggedIn"
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

  if (!intercartingLoggedIn) {
    return (
      <Navigate
        to="/intercartingdash"
        replace
        state={{
          openIntercartingLogin: true,
          from: location.pathname,
        }}
      />
    );
  }

  return children;
};

export default Intercartingprotected;