const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

/* ==========================================
   Routes
========================================== */

const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const ownvehicleRoutes = require("./routes/ownvehicleRoutes");

/* ==========================================
   Environment
========================================== */

dotenv.config();

/* ==========================================
   Express App
========================================== */

const app = express();

/* ==========================================
   Port
========================================== */

const PORT =
  process.env.PORT || 5000;

/* ==========================================
   CORS
========================================== */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* ==========================================
   Body Parser
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
   Static Upload Folder
========================================== */

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);

/* ==========================================
   API Routes
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
   Health Check
========================================== */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Fleet Management Backend API is running successfully.",

    serverTime: new Date(),

    version: "1.0.0",

    routes: {
      auth: "/api/auth",

      vehicles: "/api/vehicles",

      ownVehicles:
        "/api/ownvehicles",

      ownVehicleAssets: {
        get:
          "/api/ownvehicles/:id/assets",

        save:
          "/api/ownvehicles/:id/assets",
      },

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
   404 Handler
========================================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,

    message: "API route not found.",

    requestedUrl:
      req.originalUrl,
  });
});

/* ==========================================
   Global Error Handler
========================================== */

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "Server Error:",
      err
    );

    res.status(500).json({
      success: false,

      message:
        err.message ||
        "Internal Server Error",
    });
  }
);

/* ==========================================
   MongoDB Connection
========================================== */

const connectDatabase =
  async () => {
    try {
      await mongoose.connect(
        process.env.MONGODB_URI,
        {
          autoIndex: true,
        }
      );

      console.log(
        "=========================================="
      );

      console.log(
        "✅ MongoDB Connected Successfully"
      );

      console.log(
        "Database:",
        mongoose.connection.name
      );

      console.log(
        "Host:",
        mongoose.connection.host
      );

      console.log(
        "=========================================="
      );
    } catch (error) {
      console.error(
        "❌ MongoDB Connection Error"
      );

      console.error(error);

      process.exit(1);
    }
  };

/* ==========================================
   Start Server
========================================== */

const startServer =
  async () => {
    try {
      await connectDatabase();

      app.listen(
        PORT,
        () => {
          console.log("");

          console.log(
            "=========================================="
          );

          console.log(
            "🚀 OTC Fleet Management Backend Started"
          );

          console.log(
            "=========================================="
          );

          console.log(
            `Server Port : ${PORT}`
          );

          console.log(
            `Environment : ${
              process.env
                .NODE_ENV ||
              "development"
            }`
          );

          console.log("");

          console.log(
            "Available APIs"
          );

          console.log(
            "------------------------------------------"
          );

          console.log(
            "Auth API               : /api/auth"
          );

          console.log(
            "Vehicle API            : /api/vehicles"
          );

          console.log(
            "Own Vehicle API        : /api/ownvehicles"
          );

          console.log(
            "Vehicle Assets GET     : /api/ownvehicles/:id/assets"
          );

          console.log(
            "Vehicle Assets SAVE    : /api/ownvehicles/:id/assets"
          );

          console.log(
            "Vehicle Documents API  : /api/ownvehicles/:id/documents"
          );

          console.log(
            "Download Test API      : /api/ownvehicles/download-test"
          );

          console.log(
            "Download File API      : /api/ownvehicles/download/:fileName"
          );

          console.log(
            "=========================================="
          );
        }
      );
    } catch (error) {
      console.error(
        "Unable to start server."
      );

      console.error(error);

      process.exit(1);
    }
  };

  /* ==========================================
   Start Application
========================================== */

startServer();

/* ==========================================
   Graceful Shutdown
========================================== */

process.on(
  "SIGINT",
  async () => {
    console.log(
      "\n🛑 Shutting down server..."
    );

    try {
      await mongoose.connection.close();

      console.log(
        "✅ MongoDB connection closed."
      );

      process.exit(0);
    } catch (error) {
      console.error(
        "Error while closing MongoDB connection:"
      );

      console.error(error);

      process.exit(1);
    }
  }
);

process.on(
  "SIGTERM",
  async () => {
    console.log(
      "\n🛑 Server terminated."
    );

    try {
      await mongoose.connection.close();

      console.log(
        "✅ MongoDB connection closed."
      );

      process.exit(0);
    } catch (error) {
      console.error(error);

      process.exit(1);
    }
  }
);