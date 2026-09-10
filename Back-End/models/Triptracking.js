const mongoose = require("mongoose");

const { Schema } = mongoose;


/* =========================================================
   TRANSPORT QUOTATION SCHEMA
========================================================= */

const transportOptionSchema = new Schema(
  {
    quotationId: {
      type: String,
      trim: true,
      default: "",
    },

    transportName: {
      type: String,
      trim: true,
      default: "",
    },

    contactName: {
      type: String,
      trim: true,
      default: "",
    },

    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },

    amount: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      trim: true,
      default: "Pending",
    },
  },
  {
    _id: false,
  }
);


/* =========================================================
   SELECTED TRANSPORT SCHEMA
========================================================= */

const selectedTransportSchema = new Schema(
  {
    quotationId: {
      type: String,
      trim: true,
      default: "",
    },

    transportName: {
      type: String,
      trim: true,
      default: "",
    },

    contactName: {
      type: String,
      trim: true,
      default: "",
    },

    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },

    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
  }
);


/* =========================================================
   VEHICLE SCHEMA
========================================================= */

const vehicleSchema = new Schema(
  {
    vehicleSubId: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    vehicleType: {
      type: String,
      trim: true,
      default: "",
    },

    configurationModel: {
      type: String,
      trim: true,
      default: "",
    },

    movementClassification: {
      type: String,
      trim: true,
      default: "",
    },

    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },

    weight: {
      type: Number,
      min: 0,
      default: 0,
    },

    length: {
      type: Number,
      default: null,
    },

    height: {
      type: Number,
      default: null,
    },

    width: {
      type: Number,
      default: null,
    },

    dimensions: {
      type: String,
      trim: true,
      default: "",
    },

    remark: {
      type: String,
      trim: true,
      default: "",
    },

    currentPosition: {
      type: String,
      trim: true,
      default: "",
    },

    currentLocation: {
      type: String,
      trim: true,
      default: "",
    },

    driverName: {
      type: String,
      trim: true,
      default: "",
    },

    driverPhone: {
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

    vendorPhone: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleStatus: {
      type: String,
      trim: true,
      default: "Pending Assignment",
    },

    trackingStatus: {
      type: String,
      trim: true,
      default: "",
    },


    /* =========================
       TRAFFIC / QUOTATION
    ========================= */

    placementDate: {
      type: Date,
      default: null,
    },

    transportOptions: {
      type: [transportOptionSchema],
      default: [],
    },

    quotationStatus: {
      type: String,
      trim: true,
      default: "Quotation Pending",
    },

    quotationSubmittedAt: {
      type: Date,
      default: null,
    },

    quotationRemark: {
      type: String,
      trim: true,
      default: "",
    },

    transportRemark: {
      type: String,
      trim: true,
      default: "",
    },


    /* =========================
       VEHICLE APPROVAL
    ========================= */

    vehicleApprovalRequested: {
      type: Boolean,
      default: false,
    },

    vehicleApprovalStatus: {
      type: String,

      enum: [
        "Not Requested",
        "Pending",
        "Approved",
        "Rejected",
      ],

      default: "Not Requested",
    },

    vehicleApprovalRequestedAt: {
      type: Date,
      default: null,
    },

    vehicleApprovalReviewedAt: {
      type: Date,
      default: null,
    },

    approvedQuotationId: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleApprovalRemarks: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleRejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    selectedTransport: {
      type: selectedTransportSchema,
      default: null,
    },

    lastUpdated: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
  }
);


/* =========================================================
   MAIN TRIP SCHEMA
========================================================= */

const triptrackingSchema = new Schema(
  {

    /* =========================
       BASIC TRIP
    ========================= */

    tripId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    movementType: {
      type: String,
      trim: true,
      default: "",
    },


    /* =========================
       CLIENT
    ========================= */

    companyName: {
      type: String,
      trim: true,
      default: "",
    },

    client: {
      type: String,
      trim: true,
      default: "",
    },

    customer: {
      type: String,
      trim: true,
      default: "",
    },

    clientContact: {
      type: String,
      trim: true,
      default: "",
    },

    clientPhone: {
      type: String,
      trim: true,
      default: "",
    },

    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    assignedKam: {
      type: String,
      trim: true,
      default: "",
    },


    /* =========================
       DATES
    ========================= */

    enquiryDate: {
      type: Date,
      default: null,
    },

    placementDate: {
      type: Date,
      default: null,
    },

    deploymentDate: {
      type: Date,
      default: null,
    },

    loadingDate: {
      type: Date,
      default: null,
    },


    /* =========================
       ROUTE
    ========================= */

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

    estimatedDistance: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalKm: {
      type: Number,
      min: 0,
      default: 0,
    },

    routeLocations: {
      type: [String],
      default: [],
    },


    /* =========================
       CARGO
    ========================= */

    cargo: {
      type: String,
      trim: true,
      default: "",
    },

    materialType: {
      type: String,
      trim: true,
      default: "",
    },

    weight: {
      type: Number,
      min: 0,
      default: 0,
    },

    length: {
      type: Number,
      default: null,
    },

    height: {
      type: Number,
      default: null,
    },

    width: {
      type: Number,
      default: null,
    },

    remark: {
      type: String,
      trim: true,
      default: "",
    },


    /* =========================
       INTERCARTING
    ========================= */

    siteLocation: {
      type: String,
      trim: true,
      default: "",
    },

    period: {
      type: String,
      trim: true,
      default: "",
    },

    dieselScope: {
      type: String,
      trim: true,
      default: "",
    },

    totalQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },


    /* =========================
       CRANE / OTHER
    ========================= */

    requiredVehicles: {
      type: Number,
      min: 0,
      default: 0,
    },

    primaryVehicleType: {
      type: String,
      trim: true,
      default: "",
    },


    /* =========================
       VEHICLES
    ========================= */

    vehicles: {
      type: [vehicleSchema],
      default: [],
    },


    /* =========================
       ORDER LIFECYCLE
    ========================= */

    orderStage: {
      type: String,
      trim: true,
      default: "Client Enquiry",
    },

    responsibleTeam: {
      type: String,
      trim: true,
      default: "Key Account Management Team",
    },

    lifecycleStep: {
      type: Number,
      min: 0,
      default: 0,
    },


    /* =========================
       CLIENT ENQUIRY
    ========================= */

    requirement: {
      type: String,
      trim: true,
      default: "",
    },

    enquiryRemarks: {
      type: String,
      trim: true,
      default: "",
    },


    /* =========================
       ORDER FINALIZATION
    ========================= */

    quotedRate: {
      type: Number,
      min: 0,
      default: 0,
    },

    negotiatedRate: {
      type: Number,
      min: 0,
      default: 0,
    },

    finalRate: {
      type: Number,
      min: 0,
      default: 0,
    },

    agreedRate: {
      type: Number,
      min: 0,
      default: 0,
    },

    paymentTerms: {
      type: String,
      trim: true,
      default: "",
    },

    pricingRemarks: {
      type: String,
      trim: true,
      default: "",
    },

    commercialTerms: {
      type: String,
      trim: true,
      default: "",
    },

    deliveryCommitments: {
      type: String,
      trim: true,
      default: "",
    },

    clientConfirmationNotes: {
      type: String,
      trim: true,
      default: "",
    },

    orderReferenceNumber: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    orderCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    responsibleKam: {
      type: String,
      trim: true,
      default: "",
    },

    commercialRemarks: {
      type: String,
      trim: true,
      default: "",
    },


    /* =========================
       ORDER APPROVAL
    ========================= */

    approvalRequested: {
      type: Boolean,
      default: false,
    },

    approvalStatus: {
      type: String,

      enum: [
        "Not Requested",
        "Pending",
        "Approved",
        "Rejected",
      ],

      default: "Not Requested",
    },

    approvalRequestedAt: {
      type: Date,
      default: null,
    },

    approvalReviewedAt: {
      type: Date,
      default: null,
    },

    approvalReviewedBy: {
      type: String,
      trim: true,
      default: "",
    },

    approvalRejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    approvalRemarks: {
      type: String,
      trim: true,
      default: "",
    },


    /* =========================
       TRAFFIC / VEHICLE APPROVAL
    ========================= */

    trafficAllocatedBy: {
      type: String,
      trim: true,
      default: "",
    },

    trafficAllocatedAt: {
      type: Date,
      default: null,
    },

    trafficQuotationUpdatedAt: {
      type: Date,
      default: null,
    },

    vehicleApprovalUpdatedAt: {
      type: Date,
      default: null,
    },


    /* =========================
       PO DOCUMENT
    ========================= */

    poNumber: {
      type: String,
      trim: true,
      default: "",
    },

    poDate: {
      type: Date,
      default: null,
    },

    poDocumentName: {
      type: String,
      trim: true,
      default: "",
    },

    poDocumentUrl: {
      type: String,
      trim: true,
      default: "",
    },

    documentationRemarks: {
      type: String,
      trim: true,
      default: "",
    },


    /* =========================
       VENDOR
    ========================= */

    vendor: {
      type: String,
      trim: true,
      default: "",
    },

    vendorName: {
      type: String,
      trim: true,
      default: "",
    },

    vendorContact: {
      type: String,
      trim: true,
      default: "",
    },

    vendorRate: {
      type: Number,
      min: 0,
      default: 0,
    },

    vendorRemarks: {
      type: String,
      trim: true,
      default: "",
    },


    /* =========================
       COMPLETION
    ========================= */

    instructions: {
      type: String,
      trim: true,
      default: "",
    },

    completionRemarks: {
      type: String,
      trim: true,
      default: "",
    },

    tripStatus: {
      type: String,
      trim: true,
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);


/* =========================================================
   INDEXES
========================================================= */

triptrackingSchema.index({
  customer: 1,
});

triptrackingSchema.index({
  client: 1,
});

triptrackingSchema.index({
  orderStage: 1,
});

triptrackingSchema.index({
  createdAt: -1,
});

triptrackingSchema.index({
  approvalRequested: 1,
  approvalStatus: 1,
  approvalRequestedAt: -1,
});


/* =========================================================
   MODEL
========================================================= */

module.exports =
  mongoose.models.Triptracking ||
  mongoose.model(
    "Triptracking",
    triptrackingSchema
  );