"use strict";

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const ownvehicleRoutes = require("./routes/ownvehicleRoutes");
const triporderRoutes = require("./routes/triporderRoute");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be a valid TCP port number.");
}

// Set FRONTEND_URL and/or CORS_ORIGINS on Render / AWS (comma separated).
// No AWS Amplify wildcard: specify the actual deployed origin.
const configuredOrigins = [process.env.FRONTEND_URL, process.env.CORS_ORIGINS]
  .filter(Boolean)
  .flatMap((entry) => entry.split(","))
  .map((entry) => entry.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://otc-fleet-management.vercel.app",
  "https://otc-fleet-management-git-main-mukesh3karthis-projects.vercel.app",
  "https://otc-fleet-management-gamma.vercel.app",
  "https://fleet.otcgroups.in",
  ...configuredOrigins,
]);

app.disable("x-powered-by");
// Trust only one known reverse proxy hop; change if your actual architecture differs.
app.set("trust proxy", 1);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);

    if (
      !IS_PRODUCTION &&
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
    ) {
      return callback(null, true);
    }

    if (
      /^https:\/\/otc-fleet-management-[a-zA-Z0-9-]+-mukesh3karthis-projects\.vercel\.app$/.test(
        origin,
      )
    ) {
      return callback(null, true);
    }

    console.warn("Blocked CORS origin:", origin);
    return callback(new Error("Not allowed by CORS."));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["Content-Disposition", "Content-Type", "Content-Length"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const uploadsDirectory = path.resolve(__dirname, "uploads");
// CAUTION: /uploads is publicly readable if enabled. Audit document permissions
// and migrate private files to authenticated downloads / S3 before production.
// For compatibility, only enable explicitly in production.
if (!IS_PRODUCTION || process.env.ENABLE_PUBLIC_UPLOADS === "true") {
  app.use(
    "/uploads",
    express.static(uploadsDirectory, {
      fallthrough: true,
      etag: true,
      maxAge: 0,
      setHeaders(res) {
        res.setHeader("Cache-Control", "no-store");
      },
    }),
  );
}

// Preserve all existing route mount paths.
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/ownvehicles", ownvehicleRoutes);
app.use("/api/triporders", triporderRoutes);

app.get("/", (req, res) =>
  res.status(200).json({
    success: true,
    message: "Fleet Management Backend API is running successfully.",
    serverTime: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    version: "1.0.0",
    routes: {
      auth: "/api/auth",
      vehicles: "/api/vehicles",
      ownVehicles: "/api/ownvehicles",
      tripOrders: "/api/triporders",
      tripOrderWorkflow: {
        getAll: "/api/triporders",
        create: "/api/triporders",
        getByMongoId: "/api/triporders/:id",
        getByTripId: "/api/triporders/trip/:tripId",
        update: "/api/triporders/:id",
        delete: "/api/triporders/:id",
        orderFinalization: "/api/triporders/:id/order-finalization",
        orderApproval: "/api/triporders/:id/order-approval",
        quotations: "/api/triporders/:id/quotations",
        confirmQuotation: "/api/triporders/:id/confirm-quotation",
        allocateVehicle: "/api/triporders/:id/allocated-vehicles",
        updateAllocatedVehicle:
          "/api/triporders/:id/allocated-vehicles/:allocationId",
        dailyTracking:
          "/api/triporders/:id/allocated-vehicles/:allocationId/tracking",
      },
      ownVehicleAssets: {
        get: "/api/ownvehicles/:id/assets",
        save: "/api/ownvehicles/:id/assets",
      },
      ownVehicleDocuments: "/api/ownvehicles/:id/documents",
      ownVehicleDownloadTest: "/api/ownvehicles/download-test",
      ownVehicleDownload: "/api/ownvehicles/download/:fileName",
    },
  }),
);

app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    service: "otc-fleet-backend",
    database: connected ? "Connected" : "Disconnected",
  });
});

// File paths and filenames are sensitive. Never publish this diagnostic route.
if (!IS_PRODUCTION) {
  app.get("/api/debug/uploads", (req, res) => {
    const folder = path.join(uploadsDirectory, "ownvehicles");
    const exists = fs.existsSync(folder);
    const files = exists ? fs.readdirSync(folder) : [];
    res.json({ success: true, folder, exists, count: files.length, files });
  });
}

app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: "API route not found.",
    requestedUrl: req.originalUrl,
  }),
);

app.use((error, req, res, next) => {
  if (error.message === "Not allowed by CORS.") {
    return res
      .status(403)
      .json({
        success: false,
        message: "Frontend origin is not allowed by CORS.",
      });
  }
  console.error("Server error:", error);
  const status =
    Number.isInteger(error.status) && error.status >= 400 && error.status < 600
      ? error.status
      : 500;
  return res.status(status).json({
    success: false,
    message:
      IS_PRODUCTION && status === 500
        ? "Internal Server Error."
        : error.message || "Internal Server Error.",
  });
});

let server;
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing.");
    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: !IS_PRODUCTION,
    });
    console.log("MongoDB connected:", mongoose.connection.name);
    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`OTC Fleet Management backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start backend:", error);
    process.exitCode = 1;
    await mongoose.disconnect().catch(() => {});
  }
}

let shuttingDown = false;
async function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received. Closing server.`);
  const forceExit = setTimeout(() => process.exit(1), 10000);
  forceExit.unref();
  try {
    if (server)
      await new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    await mongoose.disconnect();
    clearTimeout(forceExit);
    process.exit(0);
  } catch (error) {
    console.error("Shutdown error:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
startServer();
