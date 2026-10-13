import React, { useCallback, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Trafficlogin from "../Loginpage/Trafficlogin";
const TrafficLoginGate = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginClosed, setLoginClosed] = useState(false);
  const handleLoginSuccess = useCallback(() => {
    sessionStorage.removeItem("kamLoggedIn");
    sessionStorage.removeItem("kamUsername");
    setIsLoggedIn(true);
    setLoginClosed(false);
  }, []);
  const handleCloseLogin = useCallback(() => {
    setLoginClosed(true);
  }, []);
  if (isLoggedIn) return children ?? <Outlet />;
  if (loginClosed) return <Navigate to="/trip-dashboard" replace />;
  return (
    <Trafficlogin
      open={true}
      onClose={handleCloseLogin}
      onLoginSuccess={handleLoginSuccess}
    />
  );
};
const TrafficProtectedRoute = ({ children }) => {
  const location = useLocation();
  const entryKey = JSON.stringify([
    location.key,
    location.pathname,
    location.search,
    location.hash,
  ]);
  return (
    <TrafficLoginGate key={entryKey}>
      {children}
    </TrafficLoginGate>
  );
};
export default TrafficProtectedRoute;