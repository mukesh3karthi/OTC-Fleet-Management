const express =
  require("express");


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


/* ==========================================
   TEST
========================================== */

router.get(
  "/download-test",
  (
    req,
    res
  ) => {

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
   DOWNLOAD DOCUMENT

   IMPORTANT:
   This MUST stay before /:id
========================================== */

router.get(
  "/download/:fileName",

  downloadVehicleDocument
);


/* ==========================================
   GET ALL
========================================== */

router.get(
  "/",

  getOwnVehicles
);


/* ==========================================
   ADD VEHICLE
========================================== */

router.post(
  "/",

  uploadVehicleDocuments,

  addOwnVehicle
);


/* ==========================================
   GET ASSETS
========================================== */

router.get(
  "/:id/assets",

  getOwnVehicleAssets
);


/* ==========================================
   SAVE ASSETS
========================================== */

router.put(
  "/:id/assets",

  saveOwnVehicleAssets
);


/* ==========================================
   SAVE DOCUMENTS
========================================== */

router.put(
  "/:id/documents",

  uploadVehicleDocuments,

  saveVehicleDocuments
);


/* ==========================================
   UPDATE VEHICLE
========================================== */

router.put(
  "/:id",

  uploadVehicleDocuments,

  updateOwnVehicle
);


/* ==========================================
   DELETE VEHICLE
========================================== */

router.delete(
  "/:id",

  deleteOwnVehicle
);


/* ==========================================
   GET ONE VEHICLE

   KEEP LAST
========================================== */

router.get(
  "/:id",

  getOwnVehicleById
);


/* ==========================================
   MULTER ERRORS
========================================== */

router.use(
  handleUploadErrors
);


module.exports =
  router;