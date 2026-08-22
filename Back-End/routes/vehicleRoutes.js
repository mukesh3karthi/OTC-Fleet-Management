const express = require("express");

const {
  getVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  bulkUpdateDailyLog,
} = require("../controllers/vehicleController");

const router = express.Router();

/* ==========================================
   Vehicle routes
========================================== */

/*
  GET /api/vehicles

  Returns every vehicle stored in
  data/vehicles.json.
*/
router.get("/", getVehicles);

/*
  PUT /api/vehicles/daily-log/bulk

  This route must be declared before "/:id".
  Otherwise Express may interpret "daily-log"
  as a vehicle ID.
*/
router.put(
  "/daily-log/bulk",
  bulkUpdateDailyLog
);

/*
  GET /api/vehicles/:id

  Returns one vehicle by ID.
*/
router.get("/:id", getVehicleById);

/*
  POST /api/vehicles

  Creates a new vehicle.
*/
router.post("/", addVehicle);

/*
  PUT /api/vehicles/:id

  Updates an existing vehicle.
*/
router.put("/:id", updateVehicle);

/*
  DELETE /api/vehicles/:id

  Deletes an existing vehicle.
*/
router.delete("/:id", deleteVehicle);

module.exports = router;