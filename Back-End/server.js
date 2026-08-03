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

const PORT = Number(process.env.PORT) || 5000;

/* ==========================================
   Create upload folders
========================================== */

const uploadsFolder = path.resolve(
  __dirname,
  "uploads"
);

const ownVehicleUploadsFolder = path.resolve(
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

const corsOptions = {
  origin(origin, callback) {
    /*
      Requests from Postman, server-to-server
      requests and browser navigation may not
      contain an Origin header.
    */
    if (!origin) {
      return callback(null, true);
    }

    const isLocalOrigin =
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

    /*
      Add your deployed frontend URL to the
      FRONTEND_URL variable later.
    */
    const productionFrontend =
      process.env.FRONTEND_URL;

    const isProductionOrigin =
      productionFrontend &&
      origin === productionFrontend;

    if (
      isLocalOrigin ||
      isProductionOrigin
    ) {
      return callback(null, true);
    }

    return callback(
      new Error(
        `CORS policy does not allow origin: ${origin}`
      )
    );
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
  ],

  exposedHeaders: [
    "Content-Disposition",
    "Content-Length",
  ],

  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

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
    const duration = Date.now() - startedAt;

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
    .status(databaseConnected ? 200 : 503)
    .json({
      success: databaseConnected,

      message: databaseConnected
        ? "Backend and MongoDB are connected."
        : "Backend is running, but MongoDB is unavailable.",

      database: {
        connected: databaseConnected,
        name:
          mongoose.connection.name || null,
        host:
          mongoose.connection.host || null,
        state:
          mongoose.connection.readyState,
      },

      port: PORT,
      timestamp: new Date().toISOString(),

      uploadDirectory:
        ownVehicleUploadsFolder,

      routes: {
        auth: "/api/auth",
        vehicles: "/api/vehicles",
        ownVehicles: "/api/ownvehicles",

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
          `Server: http://localhost:${PORT}`
        );

        console.log(
          `Health: http://localhost:${PORT}/api/health`
        );

        console.log(
          `Vehicle API: http://localhost:${PORT}/api/vehicles`
        );

        console.log(
          `Own vehicle API: http://localhost:${PORT}/api/ownvehicles`
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
      error.message
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
      mongoose.connection.readyState !== 0
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

    shutdown("UNHANDLED_REJECTION");
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught exception:",
      error
    );

    shutdown("UNCAUGHT_EXCEPTION");
  }
);

/* ==========================================
   Start application
========================================== */

startServer();