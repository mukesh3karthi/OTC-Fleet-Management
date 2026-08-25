import React from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

const Ownvehicleprotected = ({
  children,
}) => {
  const location = useLocation();

  const token =
    localStorage.getItem("token");

  const ownVehicleLoggedIn =
    sessionStorage.getItem(
      "ownVehicleLoggedIn"
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

  if (!ownVehicleLoggedIn) {
    return (
      <Navigate
        to="/ownvehicledetaildash"
        replace
        state={{
          openOwnVehicleLogin: true,
          from: location.pathname,
        }}
      />
    );
  }

  return children;
};

export default Ownvehicleprotected;