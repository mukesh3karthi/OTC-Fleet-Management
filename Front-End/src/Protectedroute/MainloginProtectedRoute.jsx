import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
const IDLE_TIMEOUT = 10 * 60 * 10000;
const SESSION_TOKEN_KEY = "mainSessionToken";
const LAST_ACTIVITY_KEY = "mainLastActivity";
export const markMainLoginSuccessful = (token) => {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
};
const hasActiveSession = () => {
  const token = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
  const lastActivity = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));
  const elapsed = Date.now() - lastActivity;
  return Boolean(
    token?.trim() &&
    sessionToken === token &&
    lastActivity > 0 &&
    elapsed >= 0 &&
    elapsed < IDLE_TIMEOUT
  );
};
const Mainloginprotected = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(hasActiveSession);
  useEffect(() => {
    let timer;
    let expired = false;
    let lastRecorded = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));
    const expireSession = () => {
      if (expired) return;
      expired = true;
      window.clearTimeout(timer);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(LAST_ACTIVITY_KEY);
      setIsAuthenticated(false);
    };
    const checkSession = () => {
      window.clearTimeout(timer);
      if (expired) return;
      if (!hasActiveSession()) {
        expireSession();
        return;
      }
      const lastActivity = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));
      const remaining = IDLE_TIMEOUT - (Date.now() - lastActivity);
      timer = window.setTimeout(checkSession, remaining);
    };
    const recordActivity = () => {
      if (expired) return;
      if (!hasActiveSession()) {
        expireSession();
        return;
      }
      const now = Date.now();
      if (now - lastRecorded < 1000) return;
      lastRecorded = now;
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      checkSession();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkSession();
    };
    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      window.addEventListener(event, recordActivity, {
        passive: true,
        capture: true,
      });
    });
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", checkSession);
    window.addEventListener("pageshow", checkSession);
    checkSession();
    return () => {
      window.clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, recordActivity, true);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", checkSession);
      window.removeEventListener("pageshow", checkSession);
    };
  }, []);
  if (!isAuthenticated || !hasActiveSession()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return children;
};
export default Mainloginprotected;