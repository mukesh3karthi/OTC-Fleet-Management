const express =
  require("express");


const {
  createTrip,
  getAllTrips,
  getTripById,
  getTripByTripId,
  updateTrip,
  updateVehicle,
  deleteTrip,
} =
  require(
    "../controllers/triptrackingController"
  );


const router =
  express.Router();


/* =========================================
   CREATE TRIP

   POST /api/triptracking
========================================= */

router.post(
  "/",
  createTrip
);


/* =========================================
   GET ALL TRIPS

   GET /api/triptracking
========================================= */

router.get(
  "/",
  getAllTrips
);


/* =========================================
   GET BY TRIP ID

   GET /api/triptracking/trip/2026-1
========================================= */

router.get(
  "/trip/:tripId",
  getTripByTripId
);


/* =========================================
   UPDATE ONE VEHICLE

   PUT
   /api/triptracking/2026-1/vehicles/2026-1-V1
========================================= */

router.put(
  "/:tripId/vehicles/:vehicleSubId",
  updateVehicle
);


/* =========================================
   GET BY MONGODB ID
========================================= */

router.get(
  "/:id",
  getTripById
);


/* =========================================
   UPDATE COMPLETE TRIP
========================================= */

router.put(
  "/:id",
  updateTrip
);


/* =========================================
   DELETE TRIP
========================================= */

router.delete(
  "/:id",
  deleteTrip
);


module.exports =
  router;