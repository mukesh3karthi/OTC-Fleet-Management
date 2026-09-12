const express = require("express");

const {
  createTrip,
  getAllTrips,
  getTripById,
  getTripByTripId,
  updateTrip,
  updateVehicle,
  deleteTrip,
} = require(
  "../controllers/triptrackingController"
);

const router = express.Router();


/* =========================================================
   CREATE TRIP
   POST /api/triptracking
========================================================= */

router.post(
  "/",
  createTrip
);


/* =========================================================
   GET ALL TRIPS
   GET /api/triptracking
========================================================= */

router.get(
  "/",
  getAllTrips
);


/* =========================================================
   GET TRIP BY TRIP ID

   Example:
   GET /api/triptracking/trip/2026-1
========================================================= */

router.get(
  "/trip/:tripId",
  getTripByTripId
);


/* =========================================================
   UPDATE SINGLE VEHICLE

   Example:
   PUT /api/triptracking/2026-1/vehicles/2026-1-V1

   Can update:
   - transportOptions
   - vendorAssigned
   - selectedTransport
   - approval status
   - vehicle details
========================================================= */

router.put(
  "/:tripId/vehicles/:vehicleSubId",
  updateVehicle
);


/* =========================================================
   GET TRIP BY MONGODB ID

   Example:
   GET /api/triptracking/66xxxxxxx
========================================================= */

router.get(
  "/:id",
  getTripById
);


/* =========================================================
   UPDATE COMPLETE TRIP

   Example:
   PUT /api/triptracking/66xxxxxxx

   This endpoint is used by:
   - Traffic Management
   - Approval Management
   - Order updates

   It can save:
   - totalVehicleCount
   - trafficAllocatedBy
   - trafficAllocatedAt
   - vehicles
   - transportOptions
   - vendorAssigned
   - quotationStatus
   - vehicleApprovalStatus
   - selectedTransport
========================================================= */

router.put(
  "/:id",
  updateTrip
);


/* =========================================================
   DELETE TRIP

   Example:
   DELETE /api/triptracking/66xxxxxxx
========================================================= */

router.delete(
  "/:id",
  deleteTrip
);


module.exports = router;