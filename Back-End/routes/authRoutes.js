"use strict";

const express = require("express");
const { login, loginTracking, verifyAdminSession } = require("../controllers/authController");
const { loginKeyAccount, getCurrentKeyAccount } = require("../controllers/kamAuthController");
const kamAuth = require("../middleware/kamAuth");

const router = express.Router();

router.post("/login", login);
router.post("/tracking/login", loginTracking);
router.get("/verify", verifyAdminSession);
router.post("/kam/login", loginKeyAccount);
router.get("/kam/me", kamAuth, getCurrentKeyAccount);

module.exports = router;
