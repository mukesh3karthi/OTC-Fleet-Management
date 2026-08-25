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

  /* LOCAL */

  "http://localhost:5173",

  "http://127.0.0.1:5173",


  /* VERCEL */

  "https://otc-fleet-management.vercel.app",

  "https://otc-fleet-management-git-main-mukesh3karthis-projects.vercel.app",

  "https://otc-fleet-management-gamma.vercel.app",


  /* CUSTOM DOMAIN */

  "https://fleet.otcgroups.in",

];


const corsOptions = {

  origin: (
    origin,
    callback
  ) => {

    /*
      Requests from Postman,
      server-to-server, etc.
    */

    if (!origin) {

      return callback(
        null,
        true
      );

    }


    /* Exact allowed URLs */

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


    /* Any localhost port */

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


    /* Vercel previews */

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


  /*
    Frontend needs these
    when fetching documents.
  */

  exposedHeaders: [

    "Content-Disposition",

    "Content-Type",

    "Content-Length",

  ],


  optionsSuccessStatus:
    204,

};


/* ==========================================
   APPLY CORS
   MUST BE BEFORE ROUTES
========================================== */

app.use(
  cors(
    corsOptions
  )
);


/* ==========================================
   BODY PARSER
========================================== */

/*
  Increased because your
  asset images are Base64.
*/

app.use(
  express.json({

    limit:
      "50mb",

  })
);


app.use(
  express.urlencoded({

    extended:
      true,

    limit:
      "50mb",

  })
);


/* ==========================================
   STATIC UPLOADS
========================================== */

const uploadsDirectory =
  path.resolve(
    __dirname,
    "uploads"
  );


console.log(
  "📁 Static uploads directory:"
);

console.log(
  uploadsDirectory
);


app.use(

  "/uploads",

  express.static(

    uploadsDirectory,

    {

      fallthrough:
        true,

      etag:
        true,

      maxAge:
        0,

      setHeaders: (
        res
      ) => {

        res.setHeader(
          "Cache-Control",
          "no-store"
        );

      },

    }

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

    return res
      .status(200)
      .json({

        success:
          true,


        message:
          "Fleet Management Backend API is running successfully.",


        serverTime:
          new Date()
            .toISOString(),


        database:

          mongoose.connection
            .readyState ===
          1

            ? "Connected"

            : "Disconnected",


        version:
          "1.0.0",


        routes: {

          auth:
            "/api/auth",


          vehicles:
            "/api/vehicles",


          ownVehicles:
            "/api/ownvehicles",


          tripTracking:
            "/api/triptracking",


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
   DEBUG - UPLOAD DIRECTORY
========================================== */

/*
  Useful for checking that
  local upload folder exists.
*/

app.get(
  "/api/debug/uploads",

  (
    req,
    res
  ) => {

    const ownVehicleFolder =
      path.resolve(
        __dirname,
        "uploads",
        "ownvehicles"
      );


    const fs =
      require("fs");


    const exists =
      fs.existsSync(
        ownVehicleFolder
      );


    let files = [];


    if (
      exists
    ) {

      files =
        fs.readdirSync(
          ownVehicleFolder
        );

    }


    return res
      .status(200)
      .json({

        success: true,

        folder:
          ownVehicleFolder,

        exists,

        count:
          files.length,

        files,

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

    return res
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
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "Server Error:",
      error
    );


    /* CORS */

    if (
      error.message ===
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


    /* General */

    return res
      .status(
        error.status ||
        500
      )
      .json({

        success:
          false,


        message:
          error.message ||
          "Internal Server Error.",

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
          "MONGODB_URI is missing in environment variables."
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
            `Server URL  : http://localhost:${PORT}`
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
            "Important APIs"
          );


          console.log(
            "------------------------------------------"
          );


          console.log(
            `Health Test        : http://localhost:${PORT}/`
          );


          console.log(
            `Own Vehicles       : http://localhost:${PORT}/api/ownvehicles`
          );


          console.log(
            `Download Test      : http://localhost:${PORT}/api/ownvehicles/download-test`
          );


          console.log(
            `Uploads Debug      : http://localhost:${PORT}/api/debug/uploads`
          );


          console.log(
            `Static Uploads     : http://localhost:${PORT}/uploads/ownvehicles/FILE_NAME`
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