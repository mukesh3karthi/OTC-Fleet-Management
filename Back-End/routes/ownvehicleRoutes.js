const express = require("express");
const fs = require("fs");
const path = require("path");

const {
  getOwnVehicles,
  getOwnVehicleById,
  addOwnVehicle,
  updateOwnVehicle,
  saveVehicleDocuments,
  deleteOwnVehicle,
} = require("../controllers/ownvehicleController");

const {
  uploadVehicleDocuments,
  handleUploadErrors,
} = require("../middleware/ownvehicleUpload");

const router = express.Router();

console.log("✅ ownvehicleRoutes.js loaded");

/* ==========================================
   Test download route

   GET /api/ownvehicles/download-test
========================================== */

router.get("/download-test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Own vehicle download route is working.",
  });
});

/* ==========================================
   Download document

   GET /api/ownvehicles/download/:fileName

   This must remain above /:id.
========================================== */

router.get("/download/:fileName", (req, res) => {
  try {
    const decodedFileName = decodeURIComponent(
      req.params.fileName
    );

    // Prevent ../../../ path traversal
    const safeFileName = path.basename(decodedFileName);

    const uploadDirectory = path.resolve(
      __dirname,
      "..",
      "uploads",
      "ownvehicles"
    );

    const filePath = path.resolve(
      uploadDirectory,
      safeFileName
    );

    console.log("==========================================");
    console.log("Download route called");
    console.log("Requested file:", safeFileName);
    console.log("Upload directory:", uploadDirectory);
    console.log("Resolved file path:", filePath);
    console.log("==========================================");

    /*
      Make sure the requested file remains inside:
      Back-End/uploads/ownvehicles
    */
    if (
      filePath !== uploadDirectory &&
      !filePath.startsWith(`${uploadDirectory}${path.sep}`)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid document file path.",
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Document file not found.",
        fileName: safeFileName,
        checkedPath: filePath,
      });
    }

    const fileStats = fs.statSync(filePath);

    if (!fileStats.isFile()) {
      return res.status(400).json({
        success: false,
        message: "The requested document is not a valid file.",
      });
    }

    const originalName = req.query.name
      ? path.basename(String(req.query.name))
      : safeFileName;

    return res.download(
      filePath,
      originalName,
      (error) => {
        if (!error) {
          console.log(
            `✅ Document downloaded successfully: ${safeFileName}`
          );

          return;
        }

        console.error("Document download error:", error);

        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: "Unable to download the document.",
          });
        }
      }
    );
  } catch (error) {
    console.error("Download route error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to download the document.",
    });
  }
});

/* ==========================================
   Get all own vehicles

   GET /api/ownvehicles
========================================== */

router.get("/", getOwnVehicles);

/* ==========================================
   Add own vehicle

   POST /api/ownvehicles
========================================== */

router.post(
  "/",
  uploadVehicleDocuments,
  addOwnVehicle
);

/* ==========================================
   Save document dates and files

   PUT /api/ownvehicles/:id/documents
========================================== */

router.put(
  "/:id/documents",
  uploadVehicleDocuments,
  saveVehicleDocuments
);

/* ==========================================
   Update own vehicle

   PUT /api/ownvehicles/:id
========================================== */

router.put(
  "/:id",
  uploadVehicleDocuments,
  updateOwnVehicle
);

/* ==========================================
   Delete own vehicle

   DELETE /api/ownvehicles/:id
========================================== */

router.delete(
  "/:id",
  deleteOwnVehicle
);

/* ==========================================
   Get one own vehicle

   GET /api/ownvehicles/:id

   Keep this below all fixed routes such as:
   /download-test
   /download/:fileName
========================================== */

router.get(
  "/:id",
  getOwnVehicleById
);

/* ==========================================
   Multer upload error handler
========================================== */

router.use(handleUploadErrors);

module.exports = router;