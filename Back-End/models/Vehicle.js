const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      trim: true,
      default: "Active",
      enum: [
        "Active",
        "Maintenance",
        "Inactive",
        "Off Duty",
      ],
    },

    manufacturingYear: {
      type: String,
      trim: true,
      default: "",
    },

    siteName: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleType: {
      type: String,
      trim: true,
      default: "",
    },

    transportProvider: {
      type: String,
      trim: true,
      default: "",
    },

    dieselScope: {
      type: String,
      trim: true,
      default: "",
    },

    hireAmount: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleInDate: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleOutDate: {
      type: String,
      trim: true,
      default: "",
    },

    driverName: {
      type: String,
      trim: true,
      default: "",
    },

    driverNumber: {
      type: String,
      trim: true,
      default: "",
    },

    vendorName: {
      type: String,
      trim: true,
      default: "",
    },

    vendorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    activeStatus: {
      type: Boolean,
      default: true,
    },

    startingKm: {
      type: Number,
      default: 0,
    },

    closingKm: {
      type: Number,
      default: 0,
    },

    todayKm: {
      type: Number,
      default: 0,
    },

    monthlyKm: {
      type: Number,
      default: 0,
    },

    monthOpenKm: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },

    loadIdle: {
      type: String,
      trim: true,
      default: "",
    },

    attendance: {
      type: String,
      trim: true,
      default: "Present",
    },

    vehicleStatus: {
      type: String,
      trim: true,
      default: "Active",
    },

    diesel: {
      type: Number,
      default: 0,
    },

    dieselConsumption: {
      type: Number,
      default: 0,
    },

    dailyKmLogs: {
      type: Map,
      of: Number,
      default: {},
    },

    dailyStartingKmLogs: {
      type: Map,
      of: Number,
      default: {},
    },

    dailyClosingKmLogs: {
      type: Map,
      of: Number,
      default: {},
    },

    dailyLoadIdleLogs: {
      type: Map,
      of: String,
      default: {},
    },

    dailyVehicleStatusLogs: {
      type: Map,
      of: String,
      default: {},
    },

    dailyAttendanceLogs: {
      type: Map,
      of: String,
      default: {},
    },

    dailyDieselLogs: {
      type: Map,
      of: Number,
      default: {},
    },

    dailyDieselConsumptionLogs: {
      type: Map,
      of: Number,
      default: {},
    },

    monthlyOpenKmLogs: {
      type: Map,
      of: Number,
      default: {},
    },

    dailyLogDate: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "vehicles",
    versionKey: false,

    toJSON: {
      virtuals: true,

      transform(doc, returnedObject) {
        returnedObject._id =
          returnedObject._id?.toString();

        return returnedObject;
      },
    },

    toObject: {
      virtuals: true,
    },
  }
);

/* Normalize values before validation */
vehicleSchema.pre("validate", function () {
  if (this.vehicleNumber) {
    this.vehicleNumber = String(
      this.vehicleNumber
    )
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();
  }

  this.activeStatus =
    this.status === "Active";
});

/* Avoid model overwrite errors */
const Vehicle =
  mongoose.models.Vehicle ||
  mongoose.model(
    "Vehicle",
    vehicleSchema
  );

module.exports = Vehicle;