const express = require("express");
const {
  getVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  bulkUpdateDailyLog,
} = require("../controllers/vehicleController");

// Existing route module reused for Intercarting Vehicle registration.
// Keep the server's /api/vehicles mount until its other callers are migrated.
const router = express.Router();

router.get("/", getVehicles);
// Declare static routes before /:id.
router.put("/daily-log/bulk", bulkUpdateDailyLog);
router.get("/:id", getVehicleById);
router.post("/", addVehicle);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

module.exports = router;
