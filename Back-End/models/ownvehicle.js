const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    startDate: {
      type: String,
      default: "",
    },

    expiryDate: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      default: "",
    },

    originalName: {
      type: String,
      default: "",
    },

    filePath: {
      type: String,
      default: "",
    },

    mimeType: {
      type: String,
      default: "",
    },

    size: {
      type: Number,
      default: 0,
    },

    uploadedAt: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
    strict: false,
  }
);

const ownVehicleSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      index: true,
    },

    vehicleNo: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleMake: {
      type: String,
      trim: true,
      default: "",
    },

    manufacturingYear: {
      type: String,
      default: "",
    },

    registrationDate: {
      type: String,
      default: "",
    },

    transportOwner: {
      type: String,
      trim: true,
      default: "",
    },

    engineNo: {
      type: String,
      trim: true,
      default: "",
    },

    chassisNo: {
      type: String,
      trim: true,
      default: "",
    },

    gps: {
      type: Boolean,
      default: false,
    },

    purchaseYear: {
      type: String,
      default: "",
    },

    purchasedFrom: {
      type: String,
      trim: true,
      default: "",
    },

    documents: {
      insurance: {
        type: documentSchema,
        default: () => ({}),
      },

      fitness: {
        type: documentSchema,
        default: () => ({}),
      },

      nationalPermit: {
        type: documentSchema,
        default: () => ({}),
      },

      roadTax: {
        type: documentSchema,
        default: () => ({}),
      },

      pollution: {
        type: documentSchema,
        default: () => ({}),
      },

      registrationCertificate: {
        type: documentSchema,
        default: () => ({}),
      },
    },
  },
  {
    timestamps: true,
    collection: "ownvehicles",
    strict: false,
  }
);

module.exports = mongoose.model(
  "OwnVehicle",
  ownVehicleSchema
);