const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const KeyAccountUser = require("../models/KeyAccountUser");
const TripOrder = require("../models/Triporder");

module.exports = async function tripAccess(req, res, next) {
  const secret = process.env.JWT_SECRET;

  // Check JWT configuration
  if (!secret) {
    return res.status(500).json({
      success: false,
      message: "Authentication is not configured.",
    });
  }

  // Read Bearer token
  const authorization = req.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "Please login to continue.",
    });
  }

  let payload;

  // Verify JWT token
  try {
    payload = jwt.verify(match[1], secret, {
      algorithms: ["HS256"],
    });

    if (
      !payload ||
      typeof payload !== "object" ||
      !Number.isFinite(payload.exp)
    ) {
      throw new Error("Invalid token");
    }
  } catch {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please login again.",
    });
  }

  try {
    // =====================================================
    // 1. KEY ACCOUNT ACCESS
    // =====================================================

    if (payload.role === "keyaccount") {
      try {
        payload = jwt.verify(match[1], secret, {
          algorithms: ["HS256"],
          audience: "keyaccount",
          issuer: "otc-fleet",
        });
      } catch {
        return res.status(401).json({
          success: false,
          message: "Invalid Key Account session.",
        });
      }

      if (!mongoose.isValidObjectId(payload.sub)) {
        return res.status(401).json({
          success: false,
          message: "Invalid Key Account identity.",
        });
      }

      const user = await KeyAccountUser.findOne({
        _id: payload.sub,
        active: true,
        role: "keyaccount",
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Key Account is unavailable.",
        });
      }

      req.user = user;

      // Each KAM sees only their own orders
      req.tripAccessFilter = {
        createdBy: user._id,
      };

      const segments = req.path.split("/").filter(Boolean);

      const isCreatingOrder =
        req.method === "POST" && (req.path === "/" || req.path === "/crane");

      const isListingOrders =
        req.method === "GET" && (req.path === "/" || req.path === "");

      // Allow KAM to create and list their own orders
      if (isCreatingOrder || isListingOrders) {
        return next();
      }

      // Identify individual order
      let filter = null;

      if (segments[0] === "trip" && segments[1]) {
        filter = {
          tripId: segments[1].trim().toUpperCase(),
          createdBy: user._id,
        };
      } else if (mongoose.isValidObjectId(segments[0])) {
        filter = {
          _id: segments[0],
          createdBy: user._id,
        };
      }

      if (!filter) {
        return res.status(403).json({
          success: false,
          message: "Key Account access is not allowed for this endpoint.",
        });
      }

      const trip = await TripOrder.exists(filter);

      if (!trip) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      return next();
    }

    // =====================================================
    // 2. ADMINISTRATOR ACCESS
    // =====================================================

    const configuredAdmin = process.env.ADMIN_USERNAME;

    const isAdmin =
      Boolean(configuredAdmin) &&
      payload.username === configuredAdmin &&
      (payload.role === "admin" || !payload.role) &&
      !payload.aud &&
      !payload.iss;

    if (isAdmin) {
      req.user = {
        username: payload.username,
        role: "admin",
      };

      // Administrator can view all orders
      req.tripAccessFilter = {};

      // Preserve existing business rule:
      // Orders must be created by an individual KAM.
      const isCreatingOrder =
        req.method === "POST" && (req.path === "/" || req.path === "/crane");

      if (isCreatingOrder) {
        return res.status(403).json({
          success: false,
          message: "Login as an individual Key Account to create orders.",
        });
      }

      return next();
    }

    // =====================================================
    // 3. UNAUTHORIZED ACCESS
    // =====================================================

    return res.status(403).json({
      success: false,
      message: "This login cannot access trip orders.",
    });
  } catch (error) {
    console.error("Trip access error:", error);
    return next(error);
  }
};
