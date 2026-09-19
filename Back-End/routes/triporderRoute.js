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
  deleteTrip,
} = require("../controllers/triporderController");

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
        new Error("Only PDF, Word, JPG and PNG files are allowed.")
      );
    }

    return callback(null, true);
  },
});

const uploadPoDocument = (req, res, next) => {
  poUpload.single("document")(req, res, (error) => {
    if (!error) return next();

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

router.post("/", createTrip);
router.get("/", getAllTrips);
router.get("/trip/:tripId", getTripByTripId);

router.put("/:id/order-finalization", saveOrderFinalization);
router.put("/:id/order-approval", approveOrder);
router.post("/:id/quotations", addTrafficQuotation);
router.put("/:id/confirm-quotation", confirmVehicleQuotation);

/* PO fields and the uploaded file are stored in MongoDB. */
router.put(
  "/:id/po-document",
  uploadPoDocument,
  savePoDocument
);

router.get(
  "/:id/po-document/file",
  downloadPoDocument
);

/* Final Key Account verification -> release order to Tracking. */
router.put(
  "/:id/order-placed",
  placeOrder
);

router.post(
  "/:id/allocated-vehicles",
  allocateVehicle
);

router.put(
  "/:id/allocated-vehicles/:allocationId",
  updateAllocatedVehicle
);

router.post(
  "/:id/allocated-vehicles/:allocationId/tracking",
  addDailyTracking
);

/* Generic /:id routes must stay below every specific route. */
router.get("/:id", getTripById);
router.put("/:id", updateTrip);
router.delete("/:id", deleteTrip);

module.exports = router;
