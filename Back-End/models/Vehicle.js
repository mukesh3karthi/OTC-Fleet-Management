const mongoose = require("mongoose");

const optionalText = { type: String, trim: true, default: "" };
const optionalEmail = {
  type: String,
  trim: true,
  lowercase: true,
  default: "",
};
const STATUS_OPTIONS = ["Active", "Maintenance", "Under Induction", "Released"];

const vehicleSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
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
      enum: STATUS_OPTIONS,
      default: "Active",
      trim: true,
    },

    // General information
    vehicleType: optionalText,
    vehicleModel: optionalText,
    manufacturingYear: optionalText,
    dieselScope: optionalText,
    vendorName: optionalText,
    vendorContact: optionalText,
    vendorEmail: optionalEmail,
    hireAmount: optionalText,
    period: optionalText,
    transportProvider: optionalText,

    // Logistics and customer
    vehicleInDate: optionalText,
    vehicleOutDate: optionalText,
    customerName: optionalText,
    siteName: optionalText,
    customerEmail: optionalEmail,

    // Driver and additional notes
    driverName: optionalText,
    driverNumber: optionalText,
    remarks: optionalText,
    activeStatus: { type: Boolean, default: true },

    // Existing daily logs (preserved)
    startingKm: { type: Number, default: 0 },
    closingKm: { type: Number, default: 0 },
    todayKm: { type: Number, default: 0 },
    monthlyKm: { type: Number, default: 0 },
    monthOpenKm: { type: mongoose.Schema.Types.Mixed, default: "" },
    loadIdle: optionalText,
    attendance: { type: String, trim: true, default: "Present" },
    vehicleStatus: { type: String, trim: true, default: "Active" },
    diesel: { type: Number, default: 0 },
    dieselConsumption: { type: Number, default: 0 },
    dailyKmLogs: { type: Map, of: Number, default: {} },
    dailyStartingKmLogs: { type: Map, of: Number, default: {} },
    dailyClosingKmLogs: { type: Map, of: Number, default: {} },
    dailyLoadIdleLogs: { type: Map, of: String, default: {} },
    dailyVehicleStatusLogs: { type: Map, of: String, default: {} },
    dailyAttendanceLogs: { type: Map, of: String, default: {} },
    dailyDieselLogs: { type: Map, of: Number, default: {} },
    dailyDieselConsumptionLogs: { type: Map, of: Number, default: {} },
    monthlyOpenKmLogs: { type: Map, of: Number, default: {} },
    dailyLogDate: optionalText,
  },
  {
    timestamps: true,
    collection: "intercartingvehicles",
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, returnedObject) {
        returnedObject._id = returnedObject._id?.toString();
        return returnedObject;
      },
    },
    toObject: { virtuals: true },
  },
);

vehicleSchema.pre("validate", function () {
  if (this.vehicleNumber) {
    this.vehicleNumber = String(this.vehicleNumber)
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();
  }
  const normalized = String(this.status || "")
    .trim()
    .toLowerCase();
  if (["inactive", "off duty", "off-duty"].includes(normalized))
    this.status = "Released";
  if (["under maintenance", "undermaintenance"].includes(normalized))
    this.status = "Maintenance";
  if (normalized === "underinduction") this.status = "Under Induction";
  this.activeStatus = this.status === "Active";
});

// Keep the existing Vehicle.js filename so no new module files are needed.
module.exports =
  mongoose.models.IntercartingVehicle ||
  mongoose.model("IntercartingVehicle", vehicleSchema);
