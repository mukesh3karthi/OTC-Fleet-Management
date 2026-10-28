const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    startDate: { type: String, default: "" },
    expiryDate: { type: String, default: "" },
    fileName: { type: String, trim: true, default: "" },
    originalName: { type: String, trim: true, default: "" },
    filePath: { type: String, trim: true, default: "" },
    mimeType: { type: String, trim: true, default: "" },
    size: { type: Number, min: 0, default: 0 },
    uploadedAt: { type: String, default: "" },
  },
  { _id: false, strict: false },
);

const replacementHistorySchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.Mixed, default: "" },
    date: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const assetItemSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true, default: "" },
    itemName: { type: String, trim: true, required: true },
    quantity: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["Available", "Missing", "Damaged", "Under Repair", "Not Required"],
      default: "Missing",
    },
    remarks: { type: String, trim: true, default: "" },
    image: { type: String, default: "" },
    replacementHistory: { type: [replacementHistorySchema], default: [] },
  },
  { _id: false },
);

const vehicleAssetsSchema = new mongoose.Schema(
  {
    inspectionDate: { type: String, trim: true, default: "" },
    inspectedBy: { type: String, trim: true, default: "" },
    tools: { type: [assetItemSchema], default: [] },
    safety: { type: [assetItemSchema], default: [] },
    lashing: { type: [assetItemSchema], default: [] },
    cooking: { type: [assetItemSchema], default: [] },
    updatedAt: { type: String, default: "" },
  },
  { _id: false },
);

const ownVehicleSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    vehicleNo: { type: String, trim: true, uppercase: true, default: "" },
    type: { type: String, trim: true, default: "" },
    vehicleMake: { type: String, trim: true, default: "" },
    vehicleModel: { type: String, trim: true, default: "" },
    horsepower: { type: Number, min: 0, default: null },
    manufacturingYear: { type: String, trim: true, default: "" },
    registrationDate: { type: String, default: "" },
    transportOwner: { type: String, trim: true, default: "" },
    engineNo: { type: String, trim: true, default: "" },
    chassisNo: { type: String, trim: true, default: "" },
    gps: { type: Boolean, default: false },
    purchaseYear: { type: String, trim: true, default: "" },
    purchasedFrom: { type: String, trim: true, default: "" },
    documents: {
      insurance: { type: documentSchema, default: () => ({}) },
      fitness: { type: documentSchema, default: () => ({}) },
      nationalPermit: { type: documentSchema, default: () => ({}) },
      permit: { type: documentSchema, default: () => ({}) },
      tax: { type: documentSchema, default: () => ({}) },
      puc: { type: documentSchema, default: () => ({}) },
      rcBook: { type: documentSchema, default: () => ({}) },
    },
    assets: { type: vehicleAssetsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: "ownvehicles",
    strict: false,
    versionKey: false,
  },
);

module.exports =
  mongoose.models.OwnVehicle || mongoose.model("OwnVehicle", ownVehicleSchema);
