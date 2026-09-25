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

  fileFilter: (
    req,
    file,
    callback
  ) => {
    if (
      !allowedPoMimeTypes.has(
        file.mimetype
      )
    ) {
      return callback(
        new Error(
          "Only PDF, Word, JPG and PNG files are allowed."
        )
      );
    }

    return callback(
      null,
      true
    );
  },
});

const uploadPoDocument = (
  req,
  res,
  next
) => {
  poUpload.single(
    "document"
  )(
    req,
    res,
    (error) => {
      if (!error) {
        return next();
      }

      const message =
        error.code ===
        "LIMIT_FILE_SIZE"
          ? "PO document must be 10 MB or smaller."
          : error.message ||
            "Unable to upload PO document.";

      return res
        .status(400)
        .json({
          success: false,
          message,
        });
    }
  );
};

/* =========================================================
   CRANE VEHICLE REQUIREMENT DOCUMENT UPLOAD

   Separate middleware.
   Existing PO upload is unchanged.
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

  fileFilter: (
    req,
    file,
    callback
  ) => {
    if (
      !allowedCraneMimeTypes.has(
        file.mimetype
      )
    ) {
      return callback(
        new Error(
          "Only PDF, Word, Excel, CSV, JPG and PNG files are allowed for Crane movement."
        )
      );
    }

    return callback(
      null,
      true
    );
  },
});

const uploadCraneDocument = (
  req,
  res,
  next
) => {
  craneUpload.single(
    "document"
  )(
    req,
    res,
    (error) => {
      if (!error) {
        return next();
      }

      const message =
        error.code ===
        "LIMIT_FILE_SIZE"
          ? "Crane vehicle requirement document must be 15 MB or smaller."
          : error.message ||
            "Unable to upload Crane vehicle requirement document.";

      return res
        .status(400)
        .json({
          success: false,
          message,
        });
    }
  );
};

/* =========================================================
   CRANE MOVEMENT CREATE

   IMPORTANT:
   Keep this ABOVE router.post("/")
   and all generic /:id routes.
========================================================= */

router.post(
  "/crane",
  uploadCraneDocument,
  createCraneTrip
);

/* =========================================================
   CREATE ORDER
========================================================= */

router.post(
  "/",
  createTrip
);

/* =========================================================
   GET ALL ORDERS
========================================================= */

router.get(
  "/",
  getAllTrips
);

/* =========================================================
   GET ORDER BY BUSINESS TRIP ID
========================================================= */

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

   ?disposition=inline -> browser view
   default             -> download
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

   Once Place Order is completed, the controller changes:

   stage  = "Tracking"
   status = "Tracking"

   PO / Vendor Finalization / vehicle allocation
   do NOT need to be completed before the order
   appears in Tracking.

   The actual validation is handled inside placeOrder().
========================================================= */

router.put(
  "/:id/order-placed",
  placeOrder
);

/* =========================================================
   TRACKING INPUT
   VEHICLE ALLOCATION
========================================================= */

router.post(
  "/:id/allocated-vehicles",
  allocateVehicle
);

/* =========================================================
   TRACKING INPUT
   UPDATE VEHICLE
========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId",
  updateAllocatedVehicle
);

/* =========================================================
   TRACKING INPUT
   DAILY MOVEMENT
========================================================= */

router.post(
  "/:id/allocated-vehicles/:allocationId/tracking",
  addDailyTracking
);

/* =========================================================
   TRACKING INPUT
   ROUTE LOCATIONS
========================================================= */

router.put(
  "/:id/route-locations",
  updateRouteLocations
);

/* =========================================================
   GENERIC ROUTES

   IMPORTANT:
   Keep these BELOW all specific routes.

   Otherwise routes such as:
   /:id/order-placed
   /:id/po-document
   /:id/allocated-vehicles

   can conflict with generic order routes.
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