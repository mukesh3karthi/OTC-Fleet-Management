const express = require("express");
const { login } = require("../controllers/authController");
const {
  loginKeyAccount,
  getCurrentKeyAccount,
} = require("../controllers/kamAuthController");
const kamAuth = require("../middleware/kamAuth");

const router = express.Router();

// Existing admin login
router.post("/login", login);

// Individual Key Account login
router.post("/kam/login", loginKeyAccount);

// Verify the current Key Account session
router.get("/kam/me", kamAuth, getCurrentKeyAccount);

module.exports = router;