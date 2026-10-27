"use strict";

const jwt = require("jsonwebtoken");

const login = (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");

    if (!username && !password) return res.status(400).json({ success: false, message: "Please enter username and password." });
    if (!username) return res.status(400).json({ success: false, message: "Please enter username." });
    if (!password) return res.status(400).json({ success: false, message: "Please enter password." });

    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!validUsername || !validPassword || !jwtSecret) {
      console.error("Admin authentication environment variables are missing.");
      return res.status(503).json({ success: false, message: "Authentication service is not configured. Contact the administrator." });
    }

    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    const token = jwt.sign({ username: validUsername, role: "admin" }, jwtSecret, { expiresIn: "1d" });

    return res.status(200).json({ success: true, message: "Login successful.", token, user: { username: validUsername } });
  } catch (error) {
    console.error("Admin login error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to login. Please try again." });
  }
};

// Dedicated fixed Tracking credentials, supplied via backend environment.
// Never expose TRACKING_PASSWORD through VITE_* or React source files.
const loginTracking = (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!username || !password.trim()) {
    return res.status(400).json({ success: false, message: "Please enter username and password." });
  }

  const validUsername = process.env.TRACKING_USERNAME;
  const validPassword = process.env.TRACKING_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;
  if (!validUsername || !validPassword || !jwtSecret) {
    return res.status(503).json({ success: false, message: "Tracking authentication is not configured." });
  }

  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({ success: false, message: "Invalid username or password." });
  }

  const token = jwt.sign({ username: validUsername, role: "tracking" }, jwtSecret, { expiresIn: "8h" });
  return res.status(200).json({ success: true, token, user: { username: validUsername, role: "tracking" } });
};

const verifyAdminSession = (req, res) => {
  const header = req.get("authorization") || "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match) return res.status(401).json({ success: false, message: "Authentication required." });

  if (!process.env.JWT_SECRET) return res.status(503).json({ success: false, message: "Authentication service is not configured." });

  try {
    const decoded = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role !== "tracking" || typeof decoded.username !== "string") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    return res.status(200).json({ success: true, user: { username: decoded.username, role: "admin" } });
  } catch {
    return res.status(401).json({ success: false, message: "Session expired or invalid. Please sign in again." });
  }
};

module.exports = { login, loginTracking, verifyAdminSession };
