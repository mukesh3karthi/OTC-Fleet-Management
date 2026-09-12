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
} = require(
  "../controllers/triptrackingController"
);

const router =
  express.Router();


/* =========================================================
   CREATE
========================================================= */

router.post(
  "/",
  createTrip
);


/* =========================================================
   GET ALL
========================================================= */

router.get(
  "/",
  getAllTrips
);


/* =========================================================
   GET BY TRIP ID
========================================================= */

router.get(
  "/trip/:tripId",
  getTripByTripId
);


/* =========================================================
   UPDATE VEHICLE
========================================================= */

router.put(
  "/:tripId/vehicles/:vehicleSubId",
  updateVehicle
);


/* =========================================================
   GET BY MONGODB ID
========================================================= */

router.get(
  "/:id",
  getTripById
);


/* =========================================================
   UPDATE COMPLETE TRIP

   totalVehicleCount is sent through req.body
   and saved by updateTrip.
========================================================= */

router.put(
  "/:id",
  updateTrip
);


/* =========================================================
   DELETE
========================================================= */

router.delete(
  "/:id",
  deleteTrip
);


module.exports =
  router;