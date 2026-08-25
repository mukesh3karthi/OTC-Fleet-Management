const fs =
  require("fs");

const path =
  require("path");

const multer =
  require("multer");


/* ==========================================
   UPLOAD DIRECTORY
========================================== */

const uploadsFolder =
  path.resolve(
    __dirname,
    "..",
    "uploads",
    "ownvehicles"
  );


if (
  !fs.existsSync(
    uploadsFolder
  )
) {
  fs.mkdirSync(
    uploadsFolder,
    {
      recursive: true,
    }
  );
}


console.log(
  "📁 Own vehicle upload folder:",
  uploadsFolder
);


/* ==========================================
   SAFE FILE NAME
========================================== */

const createSafeFileName = (
  originalName
) => {

  const extension =
    path
      .extname(
        originalName
      )
      .toLowerCase();


  const baseName =
    path
      .basename(
        originalName,
        extension
      )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      );


  const timestamp =
    Date.now();


  const random =
    Math.round(
      Math.random() *
      1e9
    );


  return (
    `${baseName || "document"}-${timestamp}-${random}${extension}`
  );
};


/* ==========================================
   STORAGE
========================================== */

const storage =
  multer.diskStorage({

    destination: (
      req,
      file,
      callback
    ) => {

      callback(
        null,
        uploadsFolder
      );

    },


    filename: (
      req,
      file,
      callback
    ) => {

      const safeFileName =
        createSafeFileName(
          file.originalname
        );


      callback(
        null,
        safeFileName
      );

    },

  });


/* ==========================================
   ALLOWED FILE TYPES
========================================== */

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];


const allowedExtensions = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
];


/* ==========================================
   FILE FILTER
========================================== */

const fileFilter = (
  req,
  file,
  callback
) => {

  const extension =
    path
      .extname(
        file.originalname
      )
      .toLowerCase();


  const validMimeType =
    allowedMimeTypes.includes(
      file.mimetype
    );


  const validExtension =
    allowedExtensions.includes(
      extension
    );


  if (
    validMimeType &&
    validExtension
  ) {

    return callback(
      null,
      true
    );

  }


  return callback(

    new Error(
      "Only PDF, JPG, JPEG and PNG files are allowed."
    ),

    false

  );

};


/* ==========================================
   MULTER
========================================== */

const upload =
  multer({

    storage,

    fileFilter,


    limits: {

      /*
        Maximum size for
        one document = 10 MB
      */

      fileSize:
        10 * 1024 * 1024,


      /*
        Maximum document
        fields = 7
      */

      files: 7,

    },

  });


/* ==========================================
   VEHICLE DOCUMENT FIELDS
========================================== */

const uploadVehicleDocuments =
  upload.fields([

    {
      name:
        "insuranceFile",

      maxCount: 1,
    },


    {
      name:
        "fitnessFile",

      maxCount: 1,
    },


    {
      name:
        "nationalPermitFile",

      maxCount: 1,
    },


    {
      name:
        "permitFile",

      maxCount: 1,
    },


    {
      name:
        "taxFile",

      maxCount: 1,
    },


    {
      name:
        "pucFile",

      maxCount: 1,
    },


    {
      name:
        "rcBookFile",

      maxCount: 1,
    },

  ]);


/* ==========================================
   UPLOAD ERROR HANDLER
========================================== */

const handleUploadErrors = (
  error,
  req,
  res,
  next
) => {

  if (!error) {

    return next();

  }


  console.error(
    "Vehicle document upload error:",
    error
  );


  if (
    error instanceof
    multer.MulterError
  ) {


    if (
      error.code ===
      "LIMIT_FILE_SIZE"
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Each document must be 10 MB or smaller.",

        });

    }


    if (
      error.code ===
      "LIMIT_FILE_COUNT"
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "You can upload a maximum of 7 documents.",

        });

    }


    if (
      error.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            `Unexpected document field: ${
              error.field ||
              "unknown"
            }`,

        });

    }


    return res
      .status(400)
      .json({

        success: false,

        message:
          error.message ||
          "Document upload failed.",

      });

  }


  return res
    .status(400)
    .json({

      success: false,

      message:
        error.message ||
        "Invalid document file.",

    });

};


module.exports = {

  uploadVehicleDocuments,

  handleUploadErrors,

  uploadsFolder,

};