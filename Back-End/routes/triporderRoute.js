const express = require("express");

const multer = require("multer");

const router = express.Router();

const tripAccess = require("../middleware/tripAccess");

router.use(tripAccess);

const {
  saveInvoicePayment,
  addInvoicePayment,
  downloadInvoicePaymentDocument,  saveCraneJourney,
  saveCraneJourneyDocument,
  downloadCraneJourneyDocument,
  saveCraneJourneyPod,
  downloadCraneJourneyPod,
  createTrip,

  /* CRANE MOVEMENT */

  createCraneTrip,

  downloadCraneDocument,

  getAllTrips,

  getTripById,

  getTripByTripId,

  updateTrip,

  correctLifecycleDetails,

  saveOrderFinalization,

  savePoDocument,

  downloadPoDocument,

  placeOrder,

  approveOrder,

  addTrafficQuotation,

  confirmVehicleQuotation,

  /* TRANSPORT REPLACEMENT APPROVAL */

  requestTransportReplacement,

  reviewTransportReplacement,

  /* VEHICLE ALLOCATION / REPLACEMENT */

  allocateTrafficVehicle,

  replaceTrafficVehicle,

  replaceTrackingVehicle,

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

/* Lock all updates to completed trips, including direct API requests.

   GET/download endpoints remain available. */

const TripOrderForLock = require("../models/Triporder");

router.use(async (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  // Keep authenticated tracking operations and documents editable for finalization.
  const allocationPath =
    /^\/[^/]+\/allocated-vehicles\/[^/]+(?:\/(lr|pod|ewayBill|tracking))?\/?$/;
  const operation = req.path.match(allocationPath);
  if (
    operation &&
    ((req.method === "PUT" && !operation[1]) ||
      (req.method === "PUT" &&
        ["lr", "pod", "ewayBill"].includes(operation[1])) ||
      (req.method === "POST" && operation[1] === "tracking"))
  )
    return next();

  // Creation endpoints have no existing trip to lock.

  const segments = req.path.split("/").filter(Boolean);

  const id = segments.find((part) => /^[a-f0-9]{24}$/i.test(part));

  const tripId = !id && segments.find((part) => /^\d{4}-\d+$/.test(part));

  if (!id && !tripId) return next();

  try {
    const trip = id
      ? await TripOrderForLock.findById(id)
          .select("stage status allocatedVehicles.unloading.status")
          .lean()
      : await TripOrderForLock.findOne({ tripId })
          .select("stage status allocatedVehicles.unloading.status")
          .lean();

    if (
      trip &&
      (String(trip.stage || "")
        .trim()
        .toLowerCase() === "trip complete" ||
        (String(trip.status || "")
          .trim()
          .toLowerCase() === "completed" &&
          Array.isArray(trip.allocatedVehicles) &&
          trip.allocatedVehicles.length > 0 &&
          trip.allocatedVehicles.every(
            (v) =>
              String(v?.unloading?.status || "").toLowerCase() === "completed",
          )))
    )
      return res
        .status(409)
        .json({ message: "Trip is completed and cannot be modified." });

    return next();
  } catch (error) {
    return next(error);
  }
});

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
        new Error("Only PDF, Word, JPG and PNG files are allowed."),
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
        : error.message || "Unable to upload PO document.";

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
          "Only PDF, Word, Excel, CSV, JPG and PNG files are allowed for Crane movement.",
        ),
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
        new Error("Only PDF, Word, JPG and PNG files are allowed."),
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
        : error.message || "Unable to upload movement document.";

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

  createCraneTrip,
);

/* =========================================================

   CREATE / GET ORDERS

========================================================= */

router.post("/", createTrip);

router.get("/", getAllTrips);

router.get(
  "/trip/:tripId",

  getTripByTripId,
);

/* =========================================================

   ORDER FINALIZATION

========================================================= */

router.put(
  "/:id/order-finalization",

  saveOrderFinalization,
);

/* =========================================================

   FIRST APPROVAL

========================================================= */

router.put(
  "/:id/order-approval",

  approveOrder,
);

/* =========================================================

   TRAFFIC QUOTATION

========================================================= */

router.post(
  "/:id/quotations",

  addTrafficQuotation,
);

/* =========================================================

   SECOND APPROVAL

========================================================= */

router.put(
  "/:id/confirm-quotation",

  confirmVehicleQuotation,
);

/* =========================================================

   TRANSPORT REPLACEMENT APPROVAL

========================================================= */

router.post(
  "/:id/transport-replacement-requests",

  requestTransportReplacement,
);

router.put(
  "/:id/transport-replacement-requests/:requestId/review",

  reviewTransportReplacement,
);

/* =========================================================

   TRAFFIC - ACTUAL VEHICLE ALLOCATION

   Used after quotation approval and before Tracking.

========================================================= */

router.post(
  "/:id/traffic-allocated-vehicles",

  allocateTrafficVehicle,
);

/* =========================================================

   TRAFFIC - VEHICLE REPLACEMENT

   Allowed only before order moves to Tracking.

========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId/traffic-replacement",

  replaceTrafficVehicle,
);

/* =========================================================

   CRANE REQUIREMENT DOCUMENT

========================================================= */

router.get(
  "/:id/crane-document/file",

  downloadCraneDocument,
);

/* =========================================================

   PO DOCUMENT

========================================================= */

router.put(
  "/:id/po-document",

  uploadPoDocument,

  savePoDocument,
);

router.get(
  "/:id/po-document/file",

  downloadPoDocument,
);

/* =========================================================

   ORDER PLACED

========================================================= */

router.put(
  "/:id/order-placed",

  placeOrder,
);

/* =========================================================

   TRACKING INPUT - VEHICLE ALLOCATION

========================================================= */

router.post(
  "/:id/allocated-vehicles",

  allocateVehicle,
);

/* =========================================================

   TRACKING - VEHICLE REPLACEMENT

   Allowed after order moves to Tracking.

========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId/tracking-replacement",

  replaceTrackingVehicle,
);

/* =========================================================

   TRACKING INPUT - UPDATE VEHICLE

   Vehicle number itself cannot be changed here.

========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId",

  updateAllocatedVehicle,
);

/* =========================================================

   TRACKING INPUT - LR DETAILS

========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId/lr",

  uploadMovementDocument,

  saveLrDocument,
);

router.get(
  "/:id/allocated-vehicles/:allocationId/lr/file",

  downloadLrDocument,
);

/* =========================================================

   TRACKING INPUT - POD DOCUMENT

========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId/pod",

  uploadMovementDocument,

  savePodDocument,
);

router.get(
  "/:id/allocated-vehicles/:allocationId/pod/file",

  downloadPodDocument,
);

/* =========================================================

   TRACKING INPUT - E-WAY BILL

========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId/ewayBill",

  uploadMovementDocument,

  saveEwayBillDocument,
);

router.get(
  "/:id/allocated-vehicles/:allocationId/ewayBill/file",

  downloadEwayBillDocument,
);

/* =========================================================

   TRACKING INPUT - DAILY MOVEMENT

========================================================= */

router.post(
  "/:id/allocated-vehicles/:allocationId/tracking",

  addDailyTracking,
);

/* =========================================================

   TRACKING INPUT - ROUTE LOCATIONS

========================================================= */

router.put(
  "/:id/route-locations",

  updateRouteLocations,
);

/* =========================================================

   GENERIC ROUTES

   Keep below all specific routes.

========================================================= */

router.get(
  "/:id",

  getTripById,
);

router.put("/:id/lifecycle-corrections", correctLifecycleDetails);

router.put("/:id", updateTrip);

router.delete(
  "/:id",

  deleteTrip,
);

router.post(
  "/:id/allocated-vehicles/:allocationId/crane-trips",
  saveCraneJourney,
);
router.put(
  "/:id/allocated-vehicles/:allocationId/crane-trips/:journeyId",
  saveCraneJourney,
);

router.put(
  "/:id/allocated-vehicles/:allocationId/crane-trips/:journeyId/pod",
  uploadMovementDocument,
  saveCraneJourneyPod,
);
router.get(
  "/:id/allocated-vehicles/:allocationId/crane-trips/:journeyId/pod/file",
  downloadCraneJourneyPod,
);
router.put(
  "/:id/allocated-vehicles/:allocationId/crane-trips/:journeyId/:documentType",
  uploadMovementDocument,
  saveCraneJourneyDocument,
);
router.get(
  "/:id/allocated-vehicles/:allocationId/crane-trips/:journeyId/:documentType/file",
  downloadCraneJourneyDocument,
);
const invoiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2, fields: 10, fieldSize: 16 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype))
      return callback(new Error("Only PDF, JPG and PNG invoice documents are allowed."));
    return callback(null, true);
  },
}).fields([{ name: "proFormaDocument", maxCount: 1 }, { name: "invoiceDocument", maxCount: 1 }]);
router.put("/:id/invoice-payment", (req, res, next) => {
  invoiceUpload(req, res, (error) => {
    if (error) return res.status(400).json({ success: false,
      message: error.code === "LIMIT_FILE_SIZE" ? "Each invoice document must be 5 MB or smaller." : error.message });
    return next();
  });
}, saveInvoicePayment);
router.post("/:id/invoice-payment/payments", addInvoicePayment);
router.get("/:id/invoice-payment/:documentType/file", downloadInvoicePaymentDocument);

module.exports = router;
