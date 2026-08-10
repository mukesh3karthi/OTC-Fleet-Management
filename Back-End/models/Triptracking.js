const mongoose =
  require("mongoose");


/* =========================================
   VEHICLE SCHEMA
========================================= */

const vehicleSchema =
  new mongoose.Schema(
    {
      /* =====================================
         BASIC VEHICLE DETAILS
      ===================================== */

      vehicleSubId: {
        type: String,
        required: true,
        trim: true,
      },

      vehicleNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },

      currentPosition: {
        type: String,
        trim: true,
        default: "",
      },

      yesterdayPosition: {
        type: String,
        trim: true,
        default: "",
      },

      runningKm: {
        type: Number,
        min: 0,
        default: 0,
      },

      status: {
        type: String,

        enum: [
          "Moving",
          "Idle",
          "Stopped",
          "Breakdown",
          "Reached",
        ],

        default: "Moving",
      },

      currentDay: {
        type: Number,
        min: 1,
        default: null,
      },


      /* =====================================
         MAP / TRACKING
      ===================================== */

      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },

      speed: {
        type: Number,
        min: 0,
        default: 0,
      },

      lastUpdated: {
        type: Date,
        default: Date.now,
      },


      /* =====================================
         LOADING DETAILS
      ===================================== */

      loadingStatus: {
        type: String,

        enum: [
          "Pending",
          "At Loading Point",
          "Loading",
          "Loaded",
          "Departed",
        ],

        default: "Pending",
      },

      loadingPointInDate: {
        type: Date,
        default: null,
      },

      loadingDate: {
        type: Date,
        default: null,
      },

      loadingPointOutDate: {
        type: Date,
        default: null,
      },

      loadingHaltingDays: {
        type: Number,
        min: 0,
        default: 0,
      },

      loadingRemarks: {
        type: String,
        trim: true,
        default: "",
      },


      /* =====================================
         UNLOADING DETAILS
      ===================================== */

      unloadingStatus: {
        type: String,

        enum: [
          "Pending",
          "At Unloading Point",
          "Unloading",
          "Unloaded",
          "Completed",
        ],

        default: "Pending",
      },

      unloadingPointInDate: {
        type: Date,
        default: null,
      },

      unloadingDate: {
        type: Date,
        default: null,
      },

      unloadingPointOutDate: {
        type: Date,
        default: null,
      },

      unloadingHaltingDays: {
        type: Number,
        min: 0,
        default: 0,
      },

      unloadingRemarks: {
        type: String,
        trim: true,
        default: "",
      },


      /* =====================================
         LR DETAILS
      ===================================== */

      lrNo: {
        type: String,
        trim: true,
        default: "",
      },

      lrRemarks: {
        type: String,
        trim: true,
        default: "",
      },

      lrSignature: {
        type: String,
        trim: true,
        default: "",
      },


      /* =====================================
         POD DETAILS
      ===================================== */

      podStatus: {
        type: String,

        enum: [
          "Pending",
          "Received",
          "Couriered",
          "Delivered",
        ],

        default: "Pending",
      },

      podCourierDate: {
        type: Date,
        default: null,
      },

      podRemarks: {
        type: String,
        trim: true,
        default: "",
      },
    },
    {
      _id: true,
    }
  );


/* =========================================
   TRIP SCHEMA
========================================= */

const tripTrackingSchema =
  new mongoose.Schema(
    {
      tripId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },

      customer: {
        type: String,
        trim: true,
        default: "",
      },

      materialType: {
        type: String,
        trim: true,
        default: "",
      },

      lsp: {
        type: String,
        trim: true,
        default: "",
      },

      origin: {
        type: String,
        trim: true,
        default: "",
      },

      destination: {
        type: String,
        trim: true,
        default: "",
      },

      estimatedTransitDays: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalKm: {
        type: Number,
        min: 0,
        default: 0,
      },


      /* =====================================
         VEHICLES
      ===================================== */

      vehicles: {
        type: [
          vehicleSchema,
        ],

        default: [],

        validate: {
          validator:
            function (
              vehicles
            ) {
              return (
                Array.isArray(
                  vehicles
                ) &&
                vehicles.length > 0
              );
            },

          message:
            "At least one vehicle is required.",
        },
      },


      /* =====================================
         TRIP STATUS
      ===================================== */

      tripStatus: {
        type: String,

        enum: [
          "Active",
          "Completed",
          "Cancelled",
        ],

        default: "Active",
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );


tripTrackingSchema.index({
  createdAt: -1,
});


tripTrackingSchema.index({
  "vehicles.vehicleNumber": 1,
});


const Triptracking =
  mongoose.model(
    "Triptracking",
    tripTrackingSchema
  );


module.exports =
  Triptracking;