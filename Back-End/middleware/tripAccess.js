const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const KeyAccountUser = require("../models/KeyAccountUser");
const TripOrder = require("../models/Triporder");

module.exports = async function tripAccess(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ message: "Authentication is not configured." });
  const match = (req.get("Authorization") || "").match(/^Bearer\s+(\S+)$/i);
  if (!match) return res.status(401).json({ message: "Please login to continue." });
  let payload;
  try {
    payload = jwt.verify(match[1], secret, { algorithms: ["HS256"] });
    if (!payload || typeof payload !== "object" || !Number.isFinite(payload.exp)) throw new Error();
  } catch {
    return res.status(401).json({ message: "Session expired or invalid. Please login again." });
  }
  try {
    if (payload.role === "keyaccount") {
      // Validate the Key Account audience and issuer as well as the signature.
      try {
        payload = jwt.verify(match[1], secret, {
          algorithms: ["HS256"], audience: "keyaccount", issuer: "otc-fleet",
        });
      } catch {
        return res.status(401).json({ message: "Invalid Key Account session." });
      }
      if (!mongoose.isValidObjectId(payload.sub)) {
        return res.status(401).json({ message: "Invalid Key Account identity." });
      }
      const user = await KeyAccountUser.findOne({ _id: payload.sub, active: true, role: "keyaccount" });
      if (!user) return res.status(401).json({ message: "Key Account is unavailable." });
      req.user = user;
      req.tripAccessFilter = { createdBy: user._id };
      const segments = req.path.split("/").filter(Boolean);
      const creation = req.method === "POST" && (req.path === "/" || req.path === "/crane");
      if (creation || (req.method === "GET" && req.path === "/")) return next();
      // Existing routes use either MongoDB ID or /trip/:tripId.
      const filter = segments[0] === "trip" && segments[1]
        ? { tripId: segments[1].trim().toUpperCase(), createdBy: user._id }
        : mongoose.isValidObjectId(segments[0])
          ? { _id: segments[0], createdBy: user._id }
          : null;
      if (!filter) return res.status(403).json({ message: "Key Account access is not allowed for this endpoint." });
      const trip = await TripOrder.exists(filter);
      if (!trip) return res.status(404).json({ message: "Order not found." });
      return next();
    }
    // Compatibility with your existing admin JWT: username only, no role/audience.
    // Only the explicitly configured administrator can use this branch.
    if (!payload.role && !payload.aud && !payload.iss &&
        process.env.ADMIN_USERNAME && payload.username === process.env.ADMIN_USERNAME) {
      // Order creation must identify an individual Key Account owner.
      if (req.method === "POST" && (req.path === "/" || req.path === "/crane")) {
        return res.status(403).json({ message: "Login as an individual Key Account to create orders." });
      }
      req.user = { username: payload.username, role: "admin" };
      req.tripAccessFilter = {};
      return next();
    }
    return res.status(403).json({ message: "This login cannot access trip orders." });
  } catch (error) { return next(error); }
};
