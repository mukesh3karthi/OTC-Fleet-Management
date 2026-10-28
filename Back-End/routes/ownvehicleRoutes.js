const express = require("express");
const {
  getOwnVehicles,
  getOwnVehicleById,
  addOwnVehicle,
  updateOwnVehicle,
  saveVehicleDocuments,
  getOwnVehicleAssets,
  saveOwnVehicleAssets,
  deleteOwnVehicle,
  downloadVehicleDocument,
} = require("../controllers/ownvehicleController");
const {
  uploadVehicleDocuments,
  handleUploadErrors,
} = require("../middleware/ownvehicleUpload");

const router = express.Router();

router.get("/download-test", (req, res) =>
  res.status(200).json({
    success: true,
    message: "Own vehicle download route is working.",
  }),
);

// Keep download before the generic /:id route.
router.get("/download/:fileName", downloadVehicleDocument);
router.get("/", getOwnVehicles);
router.post("/", uploadVehicleDocuments, addOwnVehicle);
router.get("/:id/assets", getOwnVehicleAssets);
router.put("/:id/assets", saveOwnVehicleAssets);
router.put("/:id/documents", uploadVehicleDocuments, saveVehicleDocuments);
router.put("/:id", uploadVehicleDocuments, updateOwnVehicle);
router.delete("/:id", deleteOwnVehicle);
router.get("/:id", getOwnVehicleById);
router.use(handleUploadErrors);

module.exports = router;
