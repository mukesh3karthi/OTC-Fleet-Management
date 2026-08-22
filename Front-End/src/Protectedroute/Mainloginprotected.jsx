import React from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

const Mainloginprotected = ({
  children,
}) => {
  const location = useLocation();

  const token =
    localStorage.getItem("token");

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

  return children;
};

export default Mainloginprotected;