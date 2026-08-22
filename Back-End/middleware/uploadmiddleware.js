const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ==========================================
   Upload folder
========================================== */

const uploadFolder = path.join(
  __dirname,
  "../uploads/ownvehicles"
);

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, {
    recursive: true,
  });
}

/* ==========================================
   File name helper
========================================== */

const createSafeFileName = (
  originalName
) => {
  const extension = path
    .extname(originalName)
    .toLowerCase();

  const baseName = path
    .basename(
      originalName,
      extension
    )
    .replace(
      /[^a-zA-Z0-9-_]/g,
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

  const uniqueName = `${Date.now()}-${Math.round(
    Math.random() * 1e9
  )}`;

  return `${baseName || "document"}-${uniqueName}${extension}`;
};

/* ==========================================
   Multer storage
========================================== */

const storage = multer.diskStorage({
  destination: (
    req,
    file,
    callback
  ) => {
    callback(
      null,
      uploadFolder
    );
  },

  filename: (
    req,
    file,
    callback
  ) => {
    const fileName =
      createSafeFileName(
        file.originalname
      );

    callback(
      null,
      fileName
    );
  },
});

/* ==========================================
   File validation
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

const fileFilter = (
  req,
  file,
  callback
) => {
  const extension = path
    .extname(file.originalname)
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
   Multer configuration
========================================== */

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize:
      10 * 1024 * 1024,

    files: 7,
  },
});

/* ==========================================
   Vehicle document fields
========================================== */

const uploadVehicleDocuments =
  upload.fields([
    {
      name: "insuranceFile",
      maxCount: 1,
    },
    {
      name: "fitnessFile",
      maxCount: 1,
    },
    {
      name: "nationalPermitFile",
      maxCount: 1,
    },
    {
      name: "permitFile",
      maxCount: 1,
    },
    {
      name: "taxFile",
      maxCount: 1,
    },
    {
      name: "pucFile",
      maxCount: 1,
    },
    {
      name: "rcBookFile",
      maxCount: 1,
    },
  ]);

/* ==========================================
   Upload error handler
========================================== */

const handleUploadErrors = (
  error,
  req,
  res,
  next
) => {
  if (
    error instanceof
    multer.MulterError
  ) {
    if (
      error.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Each document must be less than 10 MB.",
      });
    }

    if (
      error.code ===
      "LIMIT_FILE_COUNT"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You can upload a maximum of 7 documents.",
      });
    }

    if (
      error.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unexpected document field.",
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Document upload failed.",
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Invalid document file.",
    });
  }

  next();
};

module.exports = {
  uploadVehicleDocuments,
  handleUploadErrors,
};