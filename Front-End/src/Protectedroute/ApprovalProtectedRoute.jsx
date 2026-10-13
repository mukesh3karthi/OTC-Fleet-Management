import React, { useCallback, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Approvalmanagementlogin from "../Loginpage/Approvalmanagementlogin";
const ApprovalLoginGate = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginClosed, setLoginClosed] = useState(false);
  const handleLoginSuccess = useCallback(() => {
    setIsLoggedIn(true);
    setLoginClosed(false);
  }, []);
  const handleCloseLogin = useCallback(() => {
    setLoginClosed(true);
  }, []);
  if (isLoggedIn) return children ?? <Outlet />;
  if (loginClosed) return <Navigate to="/trip-dashboard" replace />;
  return (
    <Approvalmanagementlogin
      open={true}
      onClose={handleCloseLogin}
      onLoginSuccess={handleLoginSuccess}
    />
  );
};
const ApprovalProtectedRoute = ({ children }) => {
  const location = useLocation();
  const entryKey = JSON.stringify([
    location.key,
    location.pathname,
    location.search,
    location.hash,
  ]);
  return (
    <ApprovalLoginGate key={entryKey}>
      {children}
    </ApprovalLoginGate>
  );
};
export default ApprovalProtectedRoute;