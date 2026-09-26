const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  createTrip,

  /* CRANE MOVEMENT */
  createCraneTrip,
  downloadCraneDocument,

  getAllTrips,
  getTripById,
  getTripByTripId,
  updateTrip,

  saveOrderFinalization,

  savePoDocument,
  downloadPoDocument,

  placeOrder,

  approveOrder,

  addTrafficQuotation,

  confirmVehicleQuotation,

  allocateVehicle,
  updateAllocatedVehicle,
  addDailyTracking,

  /* MOVEMENT DOCUMENTS */
  saveLrDocument,
  downloadLrDocument,
  savePodDocument,
  downloadPodDocument,
  saveEwayBillDocument,
  downloadEwayBillDocument,

  /* TRACKING ROUTE */
  updateRouteLocations,

  deleteTrip,
} = require("../controllers/triporderController");

/* =========================================================
   PO DOCUMENT UPLOAD
========================================================= */

const allowedPoMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

const poUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, callback) => {
    if (!allowedPoMimeTypes.has(file.mimetype)) {
      return callback(
        new Error(
          "Only PDF, Word, JPG and PNG files are allowed."
        )
      );
    }

    return callback(null, true);
  },
});

const uploadPoDocument = (req, res, next) => {
  poUpload.single("document")(req, res, (error) => {
    if (!error) {
      return next();
    }

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "PO document must be 10 MB or smaller."
        : error.message ||
          "Unable to upload PO document.";

    return res.status(400).json({
      success: false,
      message,
    });
  });
};

/* =========================================================
   CRANE VEHICLE REQUIREMENT DOCUMENT UPLOAD
========================================================= */

const allowedCraneMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/png",
]);

const craneUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, callback) => {
    if (!allowedCraneMimeTypes.has(file.mimetype)) {
      return callback(
        new Error(
          "Only PDF, Word, Excel, CSV, JPG and PNG files are allowed for Crane movement."
        )
      );
    }

    return callback(null, true);
  },
});

const uploadCraneDocument = (req, res, next) => {
  craneUpload.single("document")(req, res, (error) => {
    if (!error) {
      return next();
    }

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Crane vehicle requirement document must be 15 MB or smaller."
        : error.message ||
          "Unable to upload Crane vehicle requirement document.";

    return res.status(400).json({
      success: false,
      message,
    });
  });
};

/* =========================================================
   MOVEMENT DOCUMENT UPLOAD
   POD / E-Way Bill
   LR metadata also uses this middleware safely without a file.
========================================================= */

const allowedMovementMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

const movementUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, callback) => {
    if (!allowedMovementMimeTypes.has(file.mimetype)) {
      return callback(
        new Error(
          "Only PDF, Word, JPG and PNG files are allowed."
        )
      );
    }

    return callback(null, true);
  },
});

const uploadMovementDocument = (req, res, next) => {
  movementUpload.single("document")(req, res, (error) => {
    if (!error) {
      return next();
    }

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Movement document must be 10 MB or smaller."
        : error.message ||
          "Unable to upload movement document.";

    return res.status(400).json({
      success: false,
      message,
    });
  });
};

/* =========================================================
   CRANE MOVEMENT CREATE
========================================================= */

router.post(
  "/crane",
  uploadCraneDocument,
  createCraneTrip
);

/* =========================================================
   CREATE / GET ORDERS
========================================================= */

router.post("/", createTrip);
router.get("/", getAllTrips);

router.get(
  "/trip/:tripId",
  getTripByTripId
);

/* =========================================================
   ORDER FINALIZATION
========================================================= */

router.put(
  "/:id/order-finalization",
  saveOrderFinalization
);

/* =========================================================
   FIRST APPROVAL
========================================================= */

router.put(
  "/:id/order-approval",
  approveOrder
);

/* =========================================================
   TRAFFIC QUOTATION
========================================================= */

router.post(
  "/:id/quotations",
  addTrafficQuotation
);

/* =========================================================
   SECOND APPROVAL
========================================================= */

router.put(
  "/:id/confirm-quotation",
  confirmVehicleQuotation
);

/* =========================================================
   CRANE REQUIREMENT DOCUMENT
========================================================= */

router.get(
  "/:id/crane-document/file",
  downloadCraneDocument
);

/* =========================================================
   PO DOCUMENT
========================================================= */

router.put(
  "/:id/po-document",
  uploadPoDocument,
  savePoDocument
);

router.get(
  "/:id/po-document/file",
  downloadPoDocument
);

/* =========================================================
   ORDER PLACED
========================================================= */

router.put(
  "/:id/order-placed",
  placeOrder
);

/* =========================================================
   TRACKING INPUT - VEHICLE ALLOCATION
========================================================= */

router.post(
  "/:id/allocated-vehicles",
  allocateVehicle
);

/* =========================================================
   TRACKING INPUT - UPDATE VEHICLE
========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId",
  updateAllocatedVehicle
);

/* =========================================================
   TRACKING INPUT - LR DETAILS
========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId/lr",
  uploadMovementDocument,
  saveLrDocument
);

router.get(
  "/:id/allocated-vehicles/:allocationId/lr/file",
  downloadLrDocument
);

/* =========================================================
   TRACKING INPUT - POD DOCUMENT
========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId/pod",
  uploadMovementDocument,
  savePodDocument
);

router.get(
  "/:id/allocated-vehicles/:allocationId/pod/file",
  downloadPodDocument
);

/* =========================================================
   TRACKING INPUT - E-WAY BILL
========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId/ewayBill",
  uploadMovementDocument,
  saveEwayBillDocument
);

router.get(
  "/:id/allocated-vehicles/:allocationId/ewayBill/file",
  downloadEwayBillDocument
);

/* =========================================================
   TRACKING INPUT - DAILY MOVEMENT
========================================================= */

router.post(
  "/:id/allocated-vehicles/:allocationId/tracking",
  addDailyTracking
);

/* =========================================================
   TRACKING INPUT - ROUTE LOCATIONS
========================================================= */

router.put(
  "/:id/route-locations",
  updateRouteLocations
);

/* =========================================================
   GENERIC ROUTES
   Keep below all specific routes.
========================================================= */

router.get(
  "/:id",
  getTripById
);

router.put(
  "/:id",
  updateTrip
);

router.delete(
  "/:id",
  deleteTrip
);

module.exports = router;
