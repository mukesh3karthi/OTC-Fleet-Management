import React from "react";
import { Navigate, useLocation } from "react-router-dom";
let authenticatedToken = null;
export const markMainLoginSuccessful = (token) => {
  authenticatedToken = token;
};
const Mainloginprotected = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  if (!token?.trim() || authenticatedToken !== token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return children;
};
export default Mainloginprotected;
