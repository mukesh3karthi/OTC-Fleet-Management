const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const KeyAccountUser = require("../models/KeyAccountUser");

const kamAuth = async (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Authentication is not configured.",
    });
  }

  const match = (req.get("Authorization") || "").match(
    /^Bearer\s+(\S+)$/i
  );

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "Please login to continue.",
    });
  }

  let payload;

  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      audience: "keyaccount",
      issuer: "otc-fleet",
    });
  } catch {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please login again.",
    });
  }

  if (
    payload.role !== "keyaccount" ||
    !mongoose.isValidObjectId(payload.sub)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid Key Account session.",
    });
  }

  try {
    const user = await KeyAccountUser.findOne({
      _id: payload.sub,
      role: "keyaccount",
      active: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "This Key Account is unavailable.",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = kamAuth;