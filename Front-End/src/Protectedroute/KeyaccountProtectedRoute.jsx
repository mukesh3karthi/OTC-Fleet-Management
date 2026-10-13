import React, { useCallback, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import KeyaccountLogin from "../Loginpage/Keyaccountlogin";
const KeyaccountLoginGate = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginClosed, setLoginClosed] = useState(false);
  const handleLoginSuccess = useCallback(() => {
    sessionStorage.removeItem("trafficLoggedIn");
    sessionStorage.removeItem("trafficUsername");
    setIsLoggedIn(true);
    setLoginClosed(false);
  }, []);
  const handleCloseLogin = useCallback(() => {
    setLoginClosed(true);
  }, []);
  if (isLoggedIn) return children ?? <Outlet />;
  if (loginClosed) return <Navigate to="/trip-dashboard" replace />;
  return (
    <KeyaccountLogin
      open={true}
      onClose={handleCloseLogin}
      onLoginSuccess={handleLoginSuccess}
    />
  );
};
const KeyaccountProtectedRoute = ({ children }) => {
  const location = useLocation();
  const entryKey = JSON.stringify([
    location.key,
    location.pathname,
    location.search,
    location.hash,
  ]);
  return (
    <KeyaccountLoginGate key={entryKey}>
      {children}
    </KeyaccountLoginGate>
  );
};
export default KeyaccountProtectedRoute;