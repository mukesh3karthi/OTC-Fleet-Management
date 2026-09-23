const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  createTrip,
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
   PO DOCUMENT

   PO fields and uploaded file
   are stored in MongoDB.
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

   Final Key Account verification
   releases order to Tracking.
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

   PUT:
   /api/triporders/:id/route-locations

   BODY:
   {
     "routeLocations": [
       "Hosur",
       "Salem",
       "Dindigul"
     ]
   }
========================================================= */

router.put(
  "/:id/route-locations",
  updateRouteLocations
);

/* =========================================================
   GENERIC ROUTES

   IMPORTANT:
   Keep these BELOW all specific routes.
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