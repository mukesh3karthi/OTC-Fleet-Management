"use strict";

const jwt = require("jsonwebtoken");

/* =========================================================
   ADMIN LOGIN
========================================================= */

const login = (req, res) => {
  try {
    // Get login credentials
    const username = String(req.body?.username || "").trim();

    const password = String(req.body?.password || "");

    /* =====================================================
       INPUT VALIDATION
    ===================================================== */

    if (!username && !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter username and password.",
      });
    }

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Please enter username.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please enter password.",
      });
    }

    /* =====================================================
       ADMIN CREDENTIALS FROM ENVIRONMENT
    ===================================================== */

    const validUsername = process.env.ADMIN_USERNAME;

    const validPassword = process.env.ADMIN_PASSWORD;

    const jwtSecret = process.env.JWT_SECRET;

    /* =====================================================
       CHECK ENVIRONMENT CONFIGURATION
    ===================================================== */

    if (!validUsername || !validPassword || !jwtSecret) {
      console.error("Admin authentication environment variables are missing.");

      return res.status(503).json({
        success: false,
        message:
          "Authentication service is not configured. Contact the administrator.",
      });
    }

    /* =====================================================
       VERIFY ADMIN USERNAME AND PASSWORD
    ===================================================== */

    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    /* =====================================================
       GENERATE JWT TOKEN
    ===================================================== */

    const token = jwt.sign(
      {
        username: validUsername,
        role: "admin",
      },
      jwtSecret,
      {
        expiresIn: "1d",
      },
    );

    /* =====================================================
       LOGIN SUCCESS
    ===================================================== */

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        username: validUsername,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to login. Please try again.",
    });
  }
};

/* =========================================================
   EXPORT CONTROLLER
========================================================= */

module.exports = {
  login,
};
