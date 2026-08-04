const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config();

const connectDatabase = require("./config/db");

/* ==========================================
   Import routers
========================================== */

const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const ownvehicleRoutes = require(
  "./routes/ownvehicleRoutes"
);

const app = express();

const PORT =
  Number(process.env.PORT) || 5000;

/* ==========================================
   Create upload folders
========================================== */

const uploadsFolder = path.resolve(
  __dirname,
  "uploads"
);

const ownVehicleUploadsFolder =
  path.resolve(
    uploadsFolder,
    "ownvehicles"
  );

fs.mkdirSync(ownVehicleUploadsFolder, {
  recursive: true,
});

console.log(
  "Own vehicle upload folder:",
  ownVehicleUploadsFolder
);

/* ==========================================
   CORS configuration
========================================== */

/*
  Remove trailing slashes so these are treated
  as the same origin:

  https://example.com
  https://example.com/
*/
const normalizeOrigin = (origin) =>
  String(origin || "")
    .trim()
    .replace(/\/+$/, "");

/*
  FRONTEND_URL can contain one URL:

  FRONTEND_URL=https://otc-fleet-management.vercel.app

  FRONTEND_URLS may optionally contain multiple
  comma-separated URLs:

  FRONTEND_URLS=https://site1.vercel.app,https://site2.vercel.app
*/
const environmentOrigins = [
  process.env.FRONTEND_URL,

  ...(process.env.FRONTEND_URLS || "")
    .split(","),
]
  .map(normalizeOrigin)
  .filter(Boolean);

/*
  Production frontend URL.

  Keep this explicit URL so the production
  Vercel site works even if FRONTEND_URL has
  not yet been updated correctly in Render.
*/
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://otc-fleet-management.vercel.app",
  ...environmentOrigins,
]);

const isLocalOrigin = (origin) =>
  /^http:\/\/localhost:\d+$/.test(origin) ||
  /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

/*
  Allows Vercel preview deployments belonging
  to this project, such as:

  otc-fleet-management-abc123.vercel.app

  Production remains explicitly permitted above.
*/
const isOwnVercelPreview = (origin) => {
  try {
    const url = new URL(origin);

    return (
      url.protocol === "https:" &&
      /^otc-fleet-management(?:-[a-z0-9-]+)*\.vercel\.app$/i.test(
        url.hostname
      )
    );
  } catch {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    /*
      Requests from PowerShell, Postman,
      mobile apps and server-to-server clients
      may not contain an Origin header.
    */
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin =
      normalizeOrigin(origin);

    const isAllowed =
      allowedOrigins.has(cleanOrigin) ||
      isLocalOrigin(cleanOrigin) ||
      isOwnVercelPreview(cleanOrigin);

    if (isAllowed) {
      console.log(
        "CORS allowed:",
        cleanOrigin
      );

      return callback(null, true);
    }

    console.error(
      "CORS blocked:",
      cleanOrigin
    );

    const corsError = new Error(
      `CORS policy does not allow origin: ${cleanOrigin}`
    );

    corsError.status = 403;

    return callback(corsError);
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],

  exposedHeaders: [
    "Content-Disposition",
    "Content-Length",
  ],

  credentials: true,

  optionsSuccessStatus: 204,

  preflightContinue: false,

  maxAge: 86400,
};

/*
  CORS must be registered before body parsers
  and before every API route.
*/
app.use(cors(corsOptions));

/*
  Handle browser OPTIONS preflight requests.
  RegExp is used to support current Express
  versions safely.
*/
app.options(
  /.*/,
  cors(corsOptions)
);

/* ==========================================
   Body parsers
========================================== */

app.use(
  express.json({
    limit: "20mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

/* ==========================================
   Request logger
========================================== */

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const duration =
      Date.now() - startedAt;

    console.log(
      `${new Date().toISOString()} ` +
        `${req.method} ` +
        `${req.originalUrl} ` +
        `${res.statusCode} ` +
        `${duration}ms`
    );
  });

  next();
});

/* ==========================================
   Static uploaded-file preview
========================================== */

app.use(
  "/uploads",
  express.static(uploadsFolder, {
    index: false,

    setHeaders(response) {
      response.setHeader(
        "X-Content-Type-Options",
        "nosniff"
      );

      response.setHeader(
        "Content-Disposition",
        "inline"
      );
    },
  })
);

/* ==========================================
   Root route
========================================== */

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "OTC Fleet Management API is running.",
  });
});

/* ==========================================
   Health route
========================================== */

app.get("/api/health", (req, res) => {
  const databaseConnected =
    mongoose.connection.readyState === 1;

  return res
    .status(
      databaseConnected ? 200 : 503
    )
    .json({
      success: databaseConnected,

      message: databaseConnected
        ? "Backend and MongoDB are connected."
        : "Backend is running, but MongoDB is unavailable.",

      database: {
        connected:
          databaseConnected,

        name:
          mongoose.connection.name ||
          null,

        host:
          mongoose.connection.host ||
          null,

        state:
          mongoose.connection
            .readyState,
      },

      port: PORT,

      timestamp:
        new Date().toISOString(),

      uploadDirectory:
        ownVehicleUploadsFolder,

      allowedFrontendOrigins:
        Array.from(allowedOrigins),

      routes: {
        auth: "/api/auth",

        vehicles:
          "/api/vehicles",

        ownVehicles:
          "/api/ownvehicles",

        ownVehicleDocuments:
          "/api/ownvehicles/:id/documents",

        ownVehicleDownloadTest:
          "/api/ownvehicles/download-test",

        ownVehicleDownload:
          "/api/ownvehicles/download/:fileName",
      },
    });
});

/* ==========================================
   API routes
========================================== */

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/vehicles",
  vehicleRoutes
);

app.use(
  "/api/ownvehicles",
  ownvehicleRoutes
);

/* ==========================================
   Missing uploaded static file
========================================== */

app.use("/uploads", (req, res) => {
  return res.status(404).json({
    success: false,

    message:
      `Uploaded file not found: ${req.originalUrl}`,
  });
});

/* ==========================================
   Route not found
========================================== */

app.use((req, res) => {
  return res.status(404).json({
    success: false,

    message:
      `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* ==========================================
   Global error handler
========================================== */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Unhandled server error:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    if (
      error.message?.startsWith(
        "CORS policy"
      )
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.type ===
      "entity.too.large"
    ) {
      return res.status(413).json({
        success: false,
        message:
          "Request data is too large.",
      });
    }

    return res
      .status(
        error.status ||
          error.statusCode ||
          500
      )
      .json({
        success: false,

        message:
          error.message ||
          "Internal server error.",
      });
  }
);

/* ==========================================
   Server startup
========================================== */

let server = null;

const handleServerError = (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use.`
    );

    process.exit(1);
  }

  if (error.code === "EACCES") {
    console.error(
      `Permission denied for port ${PORT}.`
    );

    process.exit(1);
  }

  console.error(
    "Server startup error:",
    error
  );

  process.exit(1);
};

const startServer = async () => {
  try {
    await connectDatabase();

    server = app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          "=========================================="
        );

        console.log(
          "OTC Fleet Management Backend"
        );

        console.log(
          "=========================================="
        );

        console.log(
          `Server running on port: ${PORT}`
        );

        console.log(
          `Health endpoint: /api/health`
        );

        console.log(
          `Vehicle API: /api/vehicles`
        );

        console.log(
          `Own vehicle API: /api/ownvehicles`
        );

        console.log(
          `MongoDB database: ${mongoose.connection.name}`
        );

        console.log(
          `MongoDB host: ${mongoose.connection.host}`
        );

        console.log(
          `Uploads folder: ${ownVehicleUploadsFolder}`
        );

        console.log(
          "Allowed frontend origins:",
          Array.from(allowedOrigins)
        );

        console.log(
          "=========================================="
        );
      }
    );

    server.on(
      "error",
      handleServerError
    );
  } catch (error) {
    console.error(
      "Application startup failed:",
      error?.stack ||
        error?.message ||
        error
    );

    process.exit(1);
  }
};

/* ==========================================
   Graceful shutdown
========================================== */

let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(
    `${signal} received. Closing application...`
  );

  try {
    if (server) {
      await new Promise(
        (resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        }
      );
    }

    if (
      mongoose.connection
        .readyState !== 0
    ) {
      await mongoose.connection.close();
    }

    console.log(
      "Server and MongoDB connection closed successfully."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Shutdown error:",
      error
    );

    process.exit(1);
  }
};

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

/* ==========================================
   Handle unexpected errors
========================================== */

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "Unhandled promise rejection:",
      reason
    );

    shutdown(
      "UNHANDLED_REJECTION"
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught exception:",
      error
    );

    shutdown(
      "UNCAUGHT_EXCEPTION"
    );
  }
);

/* ==========================================
   Start application
========================================== */

startServer();