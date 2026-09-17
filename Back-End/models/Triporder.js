const mongoose = require("mongoose");

const { Schema } = mongoose;

/* =========================================================
   DIMENSIONS
========================================================= */

const dimensionsSchema = new Schema(
  {
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
  },
  {
    _id: false,
  }
);

/* =========================================================
   VEHICLE REQUIREMENT
   Created by Key Account
========================================================= */

const vehicleRequirementSchema = new Schema(
  {
    requirementId: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleType: {
      type: String,
      trim: true,
      default: "",
    },

    configuration: {
      type: String,
      trim: true,
      default: "",
    },

    classification: {
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

    dimensions: {
      type: dimensionsSchema,
      default: () => ({}),
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   ORDER FINALIZATION
   Created by Key Account before Approval Management

   Stores:
   - Quoted Rate
   - Final Rate
   - Commercial Terms & Payment SLAs
   - Delivery Commitments & Transit SLAs
   - Client Confirmation Notes
========================================================= */

const orderFinalizationSchema = new Schema(
  {
    quotedRate: {
      type: Number,
      min: 0,
      default: null,
    },

    finalRate: {
      type: Number,
      min: 0,
      default: null,
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

    updatedBy: {
      type: String,
      trim: true,
      default: "",
    },

    updatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   ORDER APPROVAL
   First Approval Management stage

   Key Account
        ↓
   Approval Management
        ↓
   Traffic
========================================================= */

const orderApprovalSchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
      ],
      default: "Pending",
    },

    /*
      Set when Key Account clicks
      Request for Approval.
    */
    requestedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: String,
      trim: true,
      default: "",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   TRAFFIC QUOTATION
   Created by Traffic only after order approval
========================================================= */

const trafficQuotationSchema = new Schema(
  {
    quotationId: {
      type: String,
      required: true,
      trim: true,
    },

    requirementId: {
      type: String,
      required: true,
      trim: true,
    },

    transporter: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    quotedBy: {
      type: String,
      trim: true,
      default: "",
    },

    quotedAt: {
      type: Date,
      default: Date.now,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   VEHICLE / QUOTATION CONFIRMATION
   Second Approval Management stage

   Traffic
       ↓
   Approval Management
       ↓
   Tracking Input
========================================================= */

const vehicleConfirmationSchema = new Schema(
  {
    confirmationId: {
      type: String,
      required: true,
      trim: true,
    },

    requirementId: {
      type: String,
      required: true,
      trim: true,
    },

    quotationId: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
      ],
      default: "Pending",
    },

    confirmedBy: {
      type: String,
      trim: true,
      default: "",
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   DRIVER
========================================================= */

const driverSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },

    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   ESCORT
========================================================= */

const escortSchema = new Schema(
  {
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   SUPERVISOR
========================================================= */

const supervisorSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },

    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   LOADING DETAILS
========================================================= */

const loadingSchema = new Schema(
  {
    status: {
      type: String,
      trim: true,
      default: "Pending",
    },

    pointInDate: {
      type: Date,
      default: null,
    },

    loadingDate: {
      type: Date,
      default: null,
    },

    pointOutDate: {
      type: Date,
      default: null,
    },

    haltingDays: {
      type: Number,
      min: 0,
      default: 0,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   UNLOADING DETAILS
========================================================= */

const unloadingSchema = new Schema(
  {
    status: {
      type: String,
      trim: true,
      default: "Pending",
    },

    pointInDate: {
      type: Date,
      default: null,
    },

    unloadingDate: {
      type: Date,
      default: null,
    },

    pointOutDate: {
      type: Date,
      default: null,
    },

    haltingDays: {
      type: Number,
      min: 0,
      default: 0,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   DAILY TRACKING
========================================================= */

const dailyTrackingSchema = new Schema(
  {
    trackingId: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    day: {
      type: Number,
      min: 0,
      default: 0,
    },

    yesterdayKm: {
      type: Number,
      min: 0,
      default: 0,
    },

    todayKm: {
      type: Number,
      min: 0,
      default: 0,
    },

    runningKm: {
      type: Number,
      min: 0,
      default: 0,
    },

    yesterdayLocation: {
      type: String,
      trim: true,
      default: "",
    },

    currentLocation: {
      type: String,
      trim: true,
      default: "",
    },

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

    status: {
      type: String,
      trim: true,
      default: "Idle",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    updatedBy: {
      type: String,
      trim: true,
      default: "",
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   ACTUAL ALLOCATED VEHICLE
   Created only from Tracking Input

   IMPORTANT:
   transporter and amount are NOT duplicated here.

   They are resolved through:

   allocation
       ↓
   confirmationId
       ↓
   quotationId
       ↓
   trafficQuotations
========================================================= */

const allocatedVehicleSchema = new Schema(
  {
    allocationId: {
      type: String,
      required: true,
      trim: true,
    },

    requirementId: {
      type: String,
      required: true,
      trim: true,
    },

    confirmationId: {
      type: String,
      required: true,
      trim: true,
    },

    quotationId: {
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

    driver: {
      type: driverSchema,
      default: () => ({}),
    },

    escort: {
      type: escortSchema,
      default: () => ({}),
    },

    supervisor: {
      type: supervisorSchema,
      default: () => ({}),
    },

    loading: {
      type: loadingSchema,
      default: () => ({}),
    },

    unloading: {
      type: unloadingSchema,
      default: () => ({}),
    },

    dailyTracking: {
      type: [dailyTrackingSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   MAIN TRIP ORDER SCHEMA
========================================================= */

const tripOrderSchema = new Schema(
  {
    /* =====================================================
       BUSINESS ID
    ===================================================== */

    tripId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },

    /* =====================================================
       KEY ACCOUNT DETAILS
    ===================================================== */

    movementType: {
      type: String,
      trim: true,
      default: "",
    },

    customer: {
      type: String,
      required: true,
      trim: true,
    },

    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },

    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
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

    /* =====================================================
       DATES
    ===================================================== */

    enquiryDate: {
      type: Date,
      default: null,
    },

    placementDate: {
      type: Date,
      default: null,
    },

    /* =====================================================
       ROUTE
    ===================================================== */

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

    distance: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* =====================================================
       TOTAL VEHICLES
       Manually entered during Trip Creation
    ===================================================== */

    totalVehicles: {
      type: Number,
      min: 0,
      default: 0,
    },

    routeLocations: {
      type: [String],
      default: [],
    },

    /* =====================================================
       MATERIAL
    ===================================================== */

    materialType: {
      type: String,
      trim: true,
      default: "",
    },

    remark: {
      type: String,
      trim: true,
      default: "",
    },

    /* =====================================================
       ADDITIONAL ORDER DETAILS
    ===================================================== */

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

    /* =====================================================
       GENERAL WORKFLOW STATUS
    ===================================================== */

    status: {
      type: String,
      trim: true,
      default: "Pending",
    },

    stage: {
      type: String,
      trim: true,
      default: "Order Approval",
    },

    /* =====================================================
       VEHICLE REQUIREMENTS
       Created by Key Account
    ===================================================== */

    vehicleRequirements: {
      type: [vehicleRequirementSchema],
      default: [],
    },

    /* =====================================================
       ORDER FINALIZATION
       Created by Key Account

       Saved from Lifecyclemodal:
       - quotedRate
       - finalRate
       - commercialTerms
       - deliveryCommitments
       - clientConfirmationNotes
    ===================================================== */

    orderFinalization: {
      type: orderFinalizationSchema,
      default: () => ({}),
    },

    /* =====================================================
       FIRST APPROVAL
       Approval Management confirms order
    ===================================================== */

    orderApproval: {
      type: orderApprovalSchema,
      default: () => ({}),
    },

    /* =====================================================
       TRAFFIC QUOTATIONS
       Available after order approval
    ===================================================== */

    trafficQuotations: {
      type: [trafficQuotationSchema],
      default: [],
    },

    /* =====================================================
       SECOND APPROVAL
       Approval Management confirms quotation
    ===================================================== */

    vehicleConfirmations: {
      type: [vehicleConfirmationSchema],
      default: [],
    },

    /* =====================================================
       ACTUAL VEHICLES
       Created from Tracking Input
    ===================================================== */

    allocatedVehicles: {
      type: [allocatedVehicleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================================
   INDEXES
========================================================= */

tripOrderSchema.index({
  customer: 1,
});

tripOrderSchema.index({
  status: 1,
});

tripOrderSchema.index({
  stage: 1,
});

tripOrderSchema.index({
  placementDate: 1,
});

tripOrderSchema.index({
  "orderApproval.status": 1,
});

tripOrderSchema.index({
  "vehicleRequirements.requirementId": 1,
});

tripOrderSchema.index({
  "trafficQuotations.quotationId": 1,
});

tripOrderSchema.index({
  "trafficQuotations.requirementId": 1,
});

tripOrderSchema.index({
  "vehicleConfirmations.confirmationId": 1,
});

tripOrderSchema.index({
  "vehicleConfirmations.requirementId": 1,
});

tripOrderSchema.index({
  "allocatedVehicles.allocationId": 1,
});

tripOrderSchema.index({
  "allocatedVehicles.vehicleNumber": 1,
});

/* =========================================================
   MODEL
========================================================= */

module.exports =
  mongoose.models.TripOrder ||
  mongoose.model(
    "TripOrder",
    tripOrderSchema
  );