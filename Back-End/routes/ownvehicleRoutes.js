const express = require("express");
const fs = require("fs");
const path = require("path");

const {
  getOwnVehicles,
  getOwnVehicleById,
  addOwnVehicle,
  updateOwnVehicle,
  saveVehicleDocuments,
  getOwnVehicleAssets,
  saveOwnVehicleAssets,
  deleteOwnVehicle,
} = require(
  "../controllers/ownvehicleController"
);

const {
  uploadVehicleDocuments,
  handleUploadErrors,
} = require(
  "../middleware/ownvehicleUpload"
);

const router =
  express.Router();

console.log(
  "✅ ownvehicleRoutes.js loaded"
);

/* ==========================================
   Test download route
========================================== */

router.get(
  "/download-test",
  (req, res) => {
    return res
      .status(200)
      .json({
        success: true,

        message:
          "Own vehicle download route is working.",
      });
  }
);

/* ==========================================
   Download document

   Keep above /:id
========================================== */

router.get(
  "/download/:fileName",
  (req, res) => {
    try {
      const decodedFileName =
        decodeURIComponent(
          req.params.fileName
        );

      const safeFileName =
        path.basename(
          decodedFileName
        );

      const uploadDirectory =
        path.resolve(
          __dirname,
          "..",
          "uploads",
          "ownvehicles"
        );

      const filePath =
        path.resolve(
          uploadDirectory,
          safeFileName
        );

      if (
        filePath !==
          uploadDirectory &&
        !filePath.startsWith(
          `${uploadDirectory}${path.sep}`
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid document file path.",
          });
      }

      if (
        !fs.existsSync(
          filePath
        )
      ) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Document file not found.",

            fileName:
              safeFileName,
          });
      }

      const fileStats =
        fs.statSync(
          filePath
        );

      if (
        !fileStats.isFile()
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "The requested document is not a valid file.",
          });
      }

      const originalName =
        req.query.name
          ? path.basename(
              String(
                req.query.name
              )
            )
          : safeFileName;

      return res.download(
        filePath,
        originalName,
        (error) => {
          if (!error) {
            return;
          }

          console.error(
            "Document download error:",
            error
          );

          if (
            !res.headersSent
          ) {
            return res
              .status(500)
              .json({
                success: false,

                message:
                  "Unable to download the document.",
              });
          }
        }
      );
    } catch (error) {
      console.error(
        "Download route error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to download the document.",
        });
    }
  }
);

/* ==========================================
   Get all Own Vehicles
========================================== */

router.get(
  "/",
  getOwnVehicles
);

/* ==========================================
   Add Own Vehicle
========================================== */

router.post(
  "/",
  uploadVehicleDocuments,
  addOwnVehicle
);

/* ==========================================
   Get vehicle Assets

   GET /api/ownvehicles/:id/assets
========================================== */

router.get(
  "/:id/assets",
  getOwnVehicleAssets
);

/* ==========================================
   Save vehicle Assets

   PUT /api/ownvehicles/:id/assets
========================================== */

router.put(
  "/:id/assets",
  saveOwnVehicleAssets
);

/* ==========================================
   Save vehicle documents
========================================== */

router.put(
  "/:id/documents",
  uploadVehicleDocuments,
  saveVehicleDocuments
);

/* ==========================================
   Update Own Vehicle
========================================== */

router.put(
  "/:id",
  uploadVehicleDocuments,
  updateOwnVehicle
);

/* ==========================================
   Delete Own Vehicle
========================================== */

router.delete(
  "/:id",
  deleteOwnVehicle
);

/* ==========================================
   Get one Own Vehicle

   Keep below /:id/assets and
   /:id/documents
========================================== */

router.get(
  "/:id",
  getOwnVehicleById
);

/* ==========================================
   Multer error handler
========================================== */

router.use(
  handleUploadErrors
);

module.exports = router;