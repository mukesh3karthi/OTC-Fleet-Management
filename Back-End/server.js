const express =
  require("express");

const mongoose =
  require("mongoose");

const cors =
  require("cors");

const dotenv =
  require("dotenv");

const path =
  require("path");


/* ==========================================
   ENVIRONMENT
========================================== */

dotenv.config();


/* ==========================================
   ROUTES
========================================== */

const authRoutes =
  require(
    "./routes/authRoutes"
  );

const vehicleRoutes =
  require(
    "./routes/vehicleRoutes"
  );

const ownvehicleRoutes =
  require(
    "./routes/ownvehicleRoutes"
  );

const triptrackingRoutes =
  require(
    "./routes/triptrackingRoutes"
  );


/* ==========================================
   EXPRESS APP
========================================== */

const app =
  express();


/* ==========================================
   PORT
========================================== */

const PORT =
  process.env.PORT ||
  5000;


/* ==========================================
   CORS
========================================== */

const allowedOrigins = [
  /* ======================================
     LOCAL DEVELOPMENT
  ====================================== */

  "http://localhost:5173",
  "http://127.0.0.1:5173",


  /* ======================================
     VERCEL PRODUCTION
  ====================================== */

  "https://otc-fleet-management.vercel.app",


  /* ======================================
     EXISTING VERCEL DEPLOYMENTS
  ====================================== */

  "https://otc-fleet-management-git-main-mukesh3karthis-projects.vercel.app",

  "https://otc-fleet-management-gamma.vercel.app",


  /* ======================================
     CUSTOM DOMAIN
  ====================================== */

  "https://fleet.otcgroups.in",
];


const corsOptions = {
  origin: (
    origin,
    callback
  ) => {

    /* =====================================
       NO ORIGIN
       Postman / Render / Server requests
    ===================================== */

    if (!origin) {
      return callback(
        null,
        true
      );
    }


    /* =====================================
       EXACT ALLOWED ORIGINS
    ===================================== */

    if (
      allowedOrigins.includes(
        origin
      )
    ) {
      return callback(
        null,
        true
      );
    }


    /* =====================================
       ANY LOCALHOST PORT
    ===================================== */

    const isLocalhost =
      /^http:\/\/localhost:\d+$/.test(
        origin
      );


    const isLocalIp =
      /^http:\/\/127\.0\.0\.1:\d+$/.test(
        origin
      );


    if (
      isLocalhost ||
      isLocalIp
    ) {
      return callback(
        null,
        true
      );
    }


    /* =====================================
       VERCEL PREVIEW DEPLOYMENTS
    ===================================== */

    const isVercelPreview =
      /^https:\/\/otc-fleet-management-[a-zA-Z0-9-]+-mukesh3karthis-projects\.vercel\.app$/.test(
        origin
      );


    if (
      isVercelPreview
    ) {
      return callback(
        null,
        true
      );
    }


    /* =====================================
       BLOCK UNKNOWN ORIGINS
    ===================================== */

    console.log(
      "❌ Blocked CORS Origin:",
      origin
    );


    return callback(
      new Error(
        "Not allowed by CORS."
      )
    );
  },


  credentials:
    true,


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
  ],


  optionsSuccessStatus:
    204,
};


/* ==========================================
   APPLY CORS
   MUST BE BEFORE API ROUTES
========================================== */

app.use(
  cors(
    corsOptions
  )
);

app.options("*", cors(corsOptions));


/* ==========================================
   BODY PARSER
========================================== */

app.use(
  express.json({
    limit:
      "20mb",
  })
);


app.use(
  express.urlencoded({
    extended:
      true,

    limit:
      "20mb",
  })
);


/* ==========================================
   STATIC UPLOADS
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
   API ROUTES
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


app.use(
  "/api/triptracking",
  triptrackingRoutes
);


/* ==========================================
   HEALTH CHECK
========================================== */

app.get(
  "/",
  (
    req,
    res
  ) => {

    res
      .status(200)
      .json({
        success:
          true,

        message:
          "Fleet Management Backend API is running successfully.",

        serverTime:
          new Date(),

        database:
          mongoose.connection
            .readyState ===
            1
            ? "Connected"
            : "Disconnected",

        version:
          "1.0.0",

        frontend: {
          vercel:
            "https://otc-fleet-management.vercel.app",

          customDomain:
            "https://fleet.otcgroups.in",
        },

        routes: {
          auth:
            "/api/auth",

          vehicles:
            "/api/vehicles",

          ownVehicles:
            "/api/ownvehicles",

          tripTracking:
            "/api/triptracking",

          tripByTripId:
            "/api/triptracking/trip/:tripId",

          updateVehicleTracking:
            "/api/triptracking/:tripId/vehicles/:vehicleSubId",

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
  }
);


/* ==========================================
   404 HANDLER
========================================== */

app.use(
  (
    req,
    res
  ) => {

    res
      .status(404)
      .json({
        success:
          false,

        message:
          "API route not found.",

        requestedUrl:
          req.originalUrl,
      });
  }
);


/* ==========================================
   GLOBAL ERROR HANDLER
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


    /* =====================================
       CORS ERROR
    ===================================== */

    if (
      err.message ===
      "Not allowed by CORS."
    ) {
      return res
        .status(403)
        .json({
          success:
            false,

          message:
            "Frontend origin is not allowed by CORS.",
        });
    }


    /* =====================================
       GENERAL ERROR
    ===================================== */

    return res
      .status(
        err.status ||
        500
      )
      .json({
        success:
          false,

        message:
          err.message ||
          "Internal Server Error",
      });
  }
);


/* ==========================================
   DATABASE CONNECTION
========================================== */

const connectDatabase =
  async () => {

    try {

      if (
        !process.env
          .MONGODB_URI
      ) {
        throw new Error(
          "MONGODB_URI is missing in the environment variables."
        );
      }


      await mongoose.connect(
        process.env
          .MONGODB_URI,
        {
          autoIndex:
            true,
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
        mongoose.connection
          .name
      );

      console.log(
        "Host:",
        mongoose.connection
          .host
      );

      console.log(
        "=========================================="
      );

    } catch (error) {

      console.error(
        "❌ MongoDB Connection Error"
      );

      console.error(
        error
      );

      throw error;
    }
  };


/* ==========================================
   START SERVER
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
            "Allowed Frontend Origins"
          );

          console.log(
            "------------------------------------------"
          );

          allowedOrigins.forEach(
            (
              origin
            ) => {
              console.log(
                origin
              );
            }
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
            "Trip Tracking API      : /api/triptracking"
          );

          console.log(
            "Trip By Trip ID        : /api/triptracking/trip/:tripId"
          );

          console.log(
            "Vehicle Tracking PUT   : /api/triptracking/:tripId/vehicles/:vehicleSubId"
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
            "=========================================="
          );
        }
      );

    } catch (error) {

      console.error(
        "Unable to start server."
      );

      console.error(
        error
      );

      process.exit(1);
    }
  };


/* ==========================================
   START APPLICATION
========================================== */

startServer();


/* ==========================================
   GRACEFUL SHUTDOWN
========================================== */

const gracefulShutdown =
  async (
    signal
  ) => {

    console.log(
      `\n🛑 ${signal} received. Shutting down server...`
    );


    try {

      await mongoose
        .connection
        .close();


      console.log(
        "✅ MongoDB connection closed."
      );


      process.exit(0);

    } catch (error) {

      console.error(
        "Error while closing MongoDB:"
      );

      console.error(
        error
      );


      process.exit(1);
    }
  };


process.on(
  "SIGINT",
  () =>
    gracefulShutdown(
      "SIGINT"
    )
);


process.on(
  "SIGTERM",
  () =>
    gracefulShutdown(
      "SIGTERM"
    )
);