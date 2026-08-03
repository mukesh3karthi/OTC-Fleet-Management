const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsFolder = path.join(
  __dirname,
  "../uploads/ownvehicles"
);

if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
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
    const extension =
      path.extname(
        file.originalname
      );

    const baseName =
      path
        .basename(
          file.originalname,
          extension
        )
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "-"
        );

    const uniqueFileName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}-${baseName}${extension.toLowerCase()}`;

    callback(
      null,
      uniqueFileName
    );
  },
});

const fileFilter = (
  req,
  file,
  callback
) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (
    !allowedTypes.includes(
      file.mimetype
    )
  ) {
    return callback(
      new Error(
        "Only PDF, JPG and PNG files are allowed."
      )
    );
  }

  callback(null, true);
};

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize:
      5 * 1024 * 1024,

    files: 7,
  },
});

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

const handleUploadErrors = (
  error,
  req,
  res,
  next
) => {
  if (!error) {
    return next();
  }

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
            "Each file must be 5 MB or smaller.",
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
            `Unexpected upload field: ${error.field}`,
        });
    }

    return res
      .status(400)
      .json({
        success: false,
        message:
          error.message,
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
};

module.exports = {
  uploadVehicleDocuments,
  handleUploadErrors,
};