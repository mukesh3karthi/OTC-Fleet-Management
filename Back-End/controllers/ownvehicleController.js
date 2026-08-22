const fs = require("fs");
const path = require("path");
const OwnVehicle = require("../models/ownvehicle");

/* ==========================================
   Upload path
========================================== */

const uploadsFolder = path.join(
  __dirname,
  "../uploads/ownvehicles"
);

/* ==========================================
   Document configuration
========================================== */

const documentConfiguration = {
  insurance: {
    fileField: "insuranceFile",
    label: "Insurance",
    requiresDates: true,
  },

  fitness: {
    fileField: "fitnessFile",
    label: "Fitness",
    requiresDates: true,
  },

  nationalPermit: {
    fileField: "nationalPermitFile",
    label: "National Permit",
    requiresDates: true,
  },

  permit: {
    fileField: "permitFile",
    label: "Permit",
    requiresDates: true,
  },

  tax: {
    fileField: "taxFile",
    label: "Tax",
    requiresDates: true,
  },

  puc: {
    fileField: "pucFile",
    label: "PUC",
    requiresDates: true,
  },

  rcBook: {
    fileField: "rcBookFile",
    label: "RC Book",
    requiresDates: false,
  },
};

/* ==========================================
   Default documents
========================================== */

const createDefaultDocument = () => ({
  startDate: "",
  expiryDate: "",
  fileName: "",
  originalName: "",
  filePath: "",
  mimeType: "",
  size: 0,
  uploadedAt: "",
});

const createDefaultDocuments = () => {
  const documents = {};

  Object.keys(documentConfiguration).forEach(
    (key) => {
      documents[key] =
        createDefaultDocument();
    }
  );

  return documents;
};

/* ==========================================
   Ensure upload directory exists
========================================== */

const ensureUploadsFolderExists = () => {
  if (!fs.existsSync(uploadsFolder)) {
    fs.mkdirSync(uploadsFolder, {
      recursive: true,
    });
  }
};

ensureUploadsFolderExists();

/* ==========================================
   Helpers
========================================== */

const cleanText = (value) =>
  String(value ?? "").trim();

const uppercaseText = (value) =>
  cleanText(value).toUpperCase();

const parseBoolean = (value) =>
  value === true ||
  value === "true" ||
  value === 1 ||
  value === "1";

const isValidDate = (value) => {
  if (!value) {
    return true;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(
    value
  );
};

const isValidVehicleId = (value) =>
  Number.isInteger(value) &&
  value > 0;

const toPlainObject = (value) => {
  if (!value) {
    return {};
  }

  if (
    typeof value.toObject ===
    "function"
  ) {
    return value.toObject();
  }

  if (value instanceof Map) {
    return Object.fromEntries(
      value
    );
  }

  return {
    ...value,
  };
};

const getNextVehicleId =
  async () => {
    const lastVehicle =
      await OwnVehicle.findOne()
        .sort({
          id: -1,
        })
        .select({
          id: 1,
          _id: 0,
        })
        .lean();

    return (
      (Number(lastVehicle?.id) ||
        0) + 1
    );
  };

const getUploadedFiles = (req) =>
  Object.values(req.files || {})
    .flat()
    .filter(Boolean);

const deleteMulterFile = (file) => {
  try {
    if (!file) {
      return;
    }

    const diskPath =
      file.path ||
      (file.filename
        ? path.join(
            uploadsFolder,
            file.filename
          )
        : "");

    if (
      diskPath &&
      fs.existsSync(diskPath)
    ) {
      fs.unlinkSync(diskPath);
    }
  } catch (error) {
    console.error(
      "Unable to delete uploaded Multer file:",
      error
    );
  }
};

const deleteNewUploads = (req) => {
  getUploadedFiles(req).forEach(
    deleteMulterFile
  );
};

/* ==========================================
   Vehicle validation
========================================== */

const validateVehicle = (body) => {
  const requiredFields = [
    [
      "vehicleNo",
      "Vehicle Number",
    ],
    [
      "type",
      "Vehicle Type",
    ],
    [
      "vehicleMake",
      "Vehicle Make",
    ],
    [
      "manufacturingYear",
      "Manufacturing Year",
    ],
    [
      "registrationDate",
      "Registration Date",
    ],
    [
      "transportOwner",
      "Transport Owner",
    ],
    [
      "engineNo",
      "Engine Number",
    ],
    [
      "chassisNo",
      "Chassis Number",
    ],
    [
      "purchaseYear",
      "Purchase Year",
    ],
    [
      "purchasedFrom",
      "Purchased From",
    ],
  ];

  const missingField =
    requiredFields.find(
      ([fieldName]) =>
        !cleanText(
          body[fieldName]
        )
    );

  if (missingField) {
    return {
      valid: false,
      message:
        `Please enter ${missingField[1]}.`,
    };
  }

  const manufacturingYear =
    cleanText(
      body.manufacturingYear
    );

  const purchaseYear =
    cleanText(
      body.purchaseYear
    );

  const currentYear =
    new Date().getFullYear();

  if (
    !/^\d{4}$/.test(
      manufacturingYear
    )
  ) {
    return {
      valid: false,
      message:
        "Manufacturing Year must contain 4 digits.",
    };
  }

  if (
    !/^\d{4}$/.test(
      purchaseYear
    )
  ) {
    return {
      valid: false,
      message:
        "Purchase Year must contain 4 digits.",
    };
  }

  if (
    Number(
      manufacturingYear
    ) < 1900 ||
    Number(
      manufacturingYear
    ) > currentYear + 1
  ) {
    return {
      valid: false,
      message:
        "Please enter a valid Manufacturing Year.",
    };
  }

  if (
    Number(purchaseYear) <
      1900 ||
    Number(purchaseYear) >
      currentYear + 1
  ) {
    return {
      valid: false,
      message:
        "Please enter a valid Purchase Year.",
    };
  }

  if (
    Number(purchaseYear) <
    Number(manufacturingYear)
  ) {
    return {
      valid: false,
      message:
        "Purchase Year cannot be earlier than Manufacturing Year.",
    };
  }

  if (
    !isValidDate(
      cleanText(
        body.registrationDate
      )
    )
  ) {
    return {
      valid: false,
      message:
        "Registration Date must use YYYY-MM-DD format.",
    };
  }

  return {
    valid: true,
    message: "",
  };
};

/* ==========================================
   Document validation
========================================== */

const validateDocuments = (
  documents
) => {
  for (
    const [
      documentKey,
      configuration,
    ] of Object.entries(
      documentConfiguration
    )
  ) {
    const documentData =
      documents[documentKey];

    if (
      !documentData ||
      !configuration.requiresDates
    ) {
      continue;
    }

    if (
      documentData.startDate &&
      !isValidDate(
        documentData.startDate
      )
    ) {
      return {
        valid: false,
        message:
          `${configuration.label} start date must use YYYY-MM-DD format.`,
      };
    }

    if (
      documentData.expiryDate &&
      !isValidDate(
        documentData.expiryDate
      )
    ) {
      return {
        valid: false,
        message:
          `${configuration.label} expiry date must use YYYY-MM-DD format.`,
      };
    }

    if (
      documentData.startDate &&
      documentData.expiryDate
    ) {
      const startDate =
        new Date(
          `${documentData.startDate}T00:00:00`
        );

      const expiryDate =
        new Date(
          `${documentData.expiryDate}T00:00:00`
        );

      if (
        expiryDate <
        startDate
      ) {
        return {
          valid: false,
          message:
            `${configuration.label} expiry date cannot be earlier than its start date.`,
        };
      }
    }
  }

  return {
    valid: true,
    message: "",
  };
};

/* ==========================================
   Get uploaded Multer file
========================================== */

const getUploadedFile = (
  req,
  fieldName
) =>
  req.files?.[
    fieldName
  ]?.[0] || null;

/* ==========================================
   Delete stored uploaded file
========================================== */

const deleteUploadedFile = (
  publicFilePath
) => {
  try {
    if (!publicFilePath) {
      return;
    }

    const fileName =
      path.basename(
        publicFilePath
      );

    const diskPath =
      path.join(
        uploadsFolder,
        fileName
      );

    if (
      fs.existsSync(diskPath)
    ) {
      fs.unlinkSync(diskPath);
    }
  } catch (error) {
    console.error(
      "Unable to delete stored file:",
      error
    );
  }
};

/* ==========================================
   Parse optional documents JSON
========================================== */

const parseDocumentsBody = (
  value
) => {
  if (!value) {
    return {};
  }

  if (
    typeof value ===
      "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    try {
      const parsed =
        JSON.parse(value);

      return parsed &&
        typeof parsed ===
          "object" &&
        !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
};

/* ==========================================
   Normalize existing documents
========================================== */

const normalizeDocuments = (
  existingDocuments = {}
) => {
  const source =
    toPlainObject(
      existingDocuments
    );

  const defaults =
    createDefaultDocuments();

  const normalized = {};

  Object.keys(
    documentConfiguration
  ).forEach(
    (documentKey) => {
      normalized[
        documentKey
      ] = {
        ...defaults[
          documentKey
        ],
        ...toPlainObject(
          source[
            documentKey
          ]
        ),
      };
    }
  );

  return normalized;
};

/* ==========================================
   Build document data
========================================== */

const buildDocuments = (
  req,
  existingDocuments = {}
) => {
  const defaults =
    createDefaultDocuments();

  const normalizedExisting =
    normalizeDocuments(
      existingDocuments
    );

  const nestedDocuments =
    parseDocumentsBody(
      req.body.documents
    );

  const updatedDocuments = {};

  Object.entries(
    documentConfiguration
  ).forEach(
    ([
      documentKey,
      configuration,
    ]) => {
      const existingDocument = {
        ...defaults[
          documentKey
        ],
        ...normalizedExisting[
          documentKey
        ],
      };

      const nestedDocument =
        nestedDocuments[
          documentKey
        ] || {};

      const startField =
        `${documentKey}StartDate`;

      const expiryField =
        `${documentKey}ExpiryDate`;

      const removeField =
        `${documentKey}RemoveExisting`;

      const startDate =
        req.body[
          startField
        ] !== undefined
          ? cleanText(
              req.body[
                startField
              ]
            )
          : nestedDocument
                .startDate !==
              undefined
            ? cleanText(
                nestedDocument
                  .startDate
              )
            : cleanText(
                existingDocument
                  .startDate
              );

      const expiryDate =
        req.body[
          expiryField
        ] !== undefined
          ? cleanText(
              req.body[
                expiryField
              ]
            )
          : nestedDocument
                .expiryDate !==
              undefined
            ? cleanText(
                nestedDocument
                  .expiryDate
              )
            : cleanText(
                existingDocument
                  .expiryDate
              );

      const removeExisting =
        parseBoolean(
          req.body[
            removeField
          ]
        ) ||
        parseBoolean(
          nestedDocument
            .removeExisting
        ) ||
        parseBoolean(
          nestedDocument
            .replacementRequired
        );

      const uploadedFile =
        getUploadedFile(
          req,
          configuration
            .fileField
        );

      let documentResult = {
        ...existingDocument,

        startDate:
          configuration.requiresDates
            ? startDate
            : "",

        expiryDate:
          configuration.requiresDates
            ? expiryDate
            : "",
      };

      if (
        removeExisting &&
        !uploadedFile
      ) {
        deleteUploadedFile(
          existingDocument
            .filePath
        );

        documentResult = {
          ...documentResult,
          fileName: "",
          originalName: "",
          filePath: "",
          mimeType: "",
          size: 0,
          uploadedAt: "",
        };
      }

      if (uploadedFile) {
        if (
          existingDocument
            .filePath
        ) {
          deleteUploadedFile(
            existingDocument
              .filePath
          );
        }

        documentResult = {
          ...documentResult,

          fileName:
            uploadedFile
              .filename || "",

          originalName:
            uploadedFile
              .originalname || "",

          filePath:
            `/uploads/ownvehicles/${uploadedFile.filename}`,

          mimeType:
            uploadedFile
              .mimetype || "",

          size:
            uploadedFile
              .size || 0,

          uploadedAt:
            new Date()
              .toISOString(),
        };
      }

      updatedDocuments[
        documentKey
      ] = documentResult;
    }
  );

  return updatedDocuments;
};

/* ==========================================
   GET all own vehicles
========================================== */

const getOwnVehicles = async (
  req,
  res
) => {
  try {
    const vehicles =
      await OwnVehicle.find()
        .sort({
          id: 1,
        })
        .lean();

    return res
      .status(200)
      .json({
        success: true,
        ownVehicles:
          vehicles,
      });
  } catch (error) {
    console.error(
      "Get own vehicles error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Unable to fetch own vehicles.",
      });
  }
};

/* ==========================================
   GET own vehicle by ID
========================================== */

const getOwnVehicleById =
  async (
    req,
    res
  ) => {
    try {
      const vehicleId =
        Number(
          req.params.id
        );

      if (
        !isValidVehicleId(
          vehicleId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid vehicle ID.",
          });
      }

      const vehicle =
        await OwnVehicle.findOne({
          id: vehicleId,
        }).lean();

      if (!vehicle) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Vehicle not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          ownVehicle:
            vehicle,
        });
    } catch (error) {
      console.error(
        "Get own vehicle error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to fetch vehicle.",
        });
    }
  };

/* ==========================================
   POST add own vehicle
========================================== */

const addOwnVehicle =
  async (
    req,
    res
  ) => {
    try {
      const validation =
        validateVehicle(
          req.body
        );

      if (
        !validation.valid
      ) {
        deleteNewUploads(
          req
        );

        return res
          .status(400)
          .json({
            success: false,
            message:
              validation.message,
          });
      }

      const vehicleNo =
        uppercaseText(
          req.body.vehicleNo
        );

      const duplicate =
        await OwnVehicle.exists({
          vehicleNo,
        });

      if (duplicate) {
        deleteNewUploads(
          req
        );

        return res
          .status(400)
          .json({
            success: false,
            message:
              "Vehicle Number already exists.",
          });
      }

      const documents =
        buildDocuments(req);

      const documentValidation =
        validateDocuments(
          documents
        );

      if (
        !documentValidation.valid
      ) {
        deleteNewUploads(
          req
        );

        return res
          .status(400)
          .json({
            success: false,
            message:
              documentValidation.message,
          });
      }

      const vehicleId =
        await getNextVehicleId();

      const newVehicle =
        await OwnVehicle.create({
          id: vehicleId,

          vehicleNo,

          type:
            cleanText(
              req.body.type
            ),

          vehicleMake:
            cleanText(
              req.body
                .vehicleMake
            ),

          manufacturingYear:
            cleanText(
              req.body
                .manufacturingYear
            ),

          registrationDate:
            cleanText(
              req.body
                .registrationDate
            ),

          transportOwner:
            cleanText(
              req.body
                .transportOwner
            ),

          engineNo:
            cleanText(
              req.body
                .engineNo
            ),

          chassisNo:
            cleanText(
              req.body
                .chassisNo
            ),

          gps:
            parseBoolean(
              req.body.gps
            ),

          purchaseYear:
            cleanText(
              req.body
                .purchaseYear
            ),

          purchasedFrom:
            cleanText(
              req.body
                .purchasedFrom
            ),

          documents,
        });

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Vehicle added successfully.",
          ownVehicle:
            newVehicle,
        });
    } catch (error) {
      deleteNewUploads(
        req
      );

      console.error(
        "Add own vehicle error:",
        error
      );

      if (
        error?.code ===
        11000
      ) {
        const duplicateField =
          Object.keys(
            error.keyPattern ||
              {}
          )[0];

        return res
          .status(400)
          .json({
            success: false,

            message:
              duplicateField ===
              "vehicleNo"
                ? "Vehicle Number already exists."
                : "Vehicle ID already exists. Please try again.",
          });
      }

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to add vehicle.",
        });
    }
  };

/* ==========================================
   PUT update own vehicle
========================================== */

const updateOwnVehicle =
  async (
    req,
    res
  ) => {
    try {
      const vehicleId =
        Number(
          req.params.id
        );

      if (
        !isValidVehicleId(
          vehicleId
        )
      ) {
        deleteNewUploads(
          req
        );

        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid vehicle ID.",
          });
      }

      const existingVehicle =
        await OwnVehicle.findOne({
          id: vehicleId,
        });

      if (
        !existingVehicle
      ) {
        deleteNewUploads(
          req
        );

        return res
          .status(404)
          .json({
            success: false,
            message:
              "Vehicle not found.",
          });
      }

      const mergedBody = {
        vehicleNo:
          req.body
            .vehicleNo ??
          existingVehicle
            .vehicleNo,

        type:
          req.body.type ??
          existingVehicle.type,

        vehicleMake:
          req.body
            .vehicleMake ??
          existingVehicle
            .vehicleMake,

        manufacturingYear:
          req.body
            .manufacturingYear ??
          existingVehicle
            .manufacturingYear,

        registrationDate:
          req.body
            .registrationDate ??
          existingVehicle
            .registrationDate,

        transportOwner:
          req.body
            .transportOwner ??
          existingVehicle
            .transportOwner,

        engineNo:
          req.body
            .engineNo ??
          existingVehicle
            .engineNo,

        chassisNo:
          req.body
            .chassisNo ??
          existingVehicle
            .chassisNo,

        gps:
          req.body.gps ??
          existingVehicle.gps,

        purchaseYear:
          req.body
            .purchaseYear ??
          existingVehicle
            .purchaseYear,

        purchasedFrom:
          req.body
            .purchasedFrom ??
          existingVehicle
            .purchasedFrom,
      };

      const validation =
        validateVehicle(
          mergedBody
        );

      if (
        !validation.valid
      ) {
        deleteNewUploads(
          req
        );

        return res
          .status(400)
          .json({
            success: false,
            message:
              validation.message,
          });
      }

      const vehicleNo =
        uppercaseText(
          mergedBody.vehicleNo
        );

      const duplicate =
        await OwnVehicle.exists({
          vehicleNo,
          id: {
            $ne: vehicleId,
          },
        });

      if (duplicate) {
        deleteNewUploads(
          req
        );

        return res
          .status(400)
          .json({
            success: false,
            message:
              "Vehicle Number already exists.",
          });
      }

      const hasDocumentFields =
        Object.keys(
          req.body
        ).some(
          (key) =>
            key ===
              "documents" ||
            key.endsWith(
              "StartDate"
            ) ||
            key.endsWith(
              "ExpiryDate"
            ) ||
            key.endsWith(
              "RemoveExisting"
            )
        ) ||
        Object.keys(
          req.files || {}
        ).length > 0;

      const documents =
        hasDocumentFields
          ? buildDocuments(
              req,
              existingVehicle
                .documents
            )
          : normalizeDocuments(
              existingVehicle
                .documents
            );

      const documentValidation =
        validateDocuments(
          documents
        );

      if (
        !documentValidation.valid
      ) {
        deleteNewUploads(
          req
        );

        return res
          .status(400)
          .json({
            success: false,
            message:
              documentValidation.message,
          });
      }

      existingVehicle.vehicleNo =
        vehicleNo;

      existingVehicle.type =
        cleanText(
          mergedBody.type
        );

      existingVehicle.vehicleMake =
        cleanText(
          mergedBody.vehicleMake
        );

      existingVehicle.manufacturingYear =
        cleanText(
          mergedBody
            .manufacturingYear
        );

      existingVehicle.registrationDate =
        cleanText(
          mergedBody
            .registrationDate
        );

      existingVehicle.transportOwner =
        cleanText(
          mergedBody
            .transportOwner
        );

      existingVehicle.engineNo =
        cleanText(
          mergedBody.engineNo
        );

      existingVehicle.chassisNo =
        cleanText(
          mergedBody.chassisNo
        );

      existingVehicle.gps =
        parseBoolean(
          mergedBody.gps
        );

      existingVehicle.purchaseYear =
        cleanText(
          mergedBody.purchaseYear
        );

      existingVehicle.purchasedFrom =
        cleanText(
          mergedBody
            .purchasedFrom
        );

      existingVehicle.documents =
        documents;

      const updatedVehicle =
        await existingVehicle.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Vehicle updated successfully.",

          ownVehicle:
            updatedVehicle,
        });
    } catch (error) {
      deleteNewUploads(
        req
      );

      console.error(
        "Update own vehicle error:",
        error
      );

      if (
        error?.code ===
        11000
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Vehicle Number already exists.",
          });
      }

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to update vehicle.",
        });
    }
  };

/* ==========================================
   PUT save document dates and files
========================================== */

const saveVehicleDocuments =
  async (
    req,
    res
  ) => {
    try {
      const vehicleId =
        Number(
          req.params.id
        );

      if (
        !isValidVehicleId(
          vehicleId
        )
      ) {
        deleteNewUploads(
          req
        );

        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid vehicle ID.",
          });
      }

      const existingVehicle =
        await OwnVehicle.findOne({
          id: vehicleId,
        });

      if (
        !existingVehicle
      ) {
        deleteNewUploads(
          req
        );

        return res
          .status(404)
          .json({
            success: false,
            message:
              "Vehicle not found.",
          });
      }

      const documents =
        buildDocuments(
          req,
          existingVehicle
            .documents
        );

      const validation =
        validateDocuments(
          documents
        );

      if (
        !validation.valid
      ) {
        deleteNewUploads(
          req
        );

        return res
          .status(400)
          .json({
            success: false,
            message:
              validation.message,
          });
      }

      existingVehicle.documents =
        documents;

      const updatedVehicle =
        await existingVehicle.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Vehicle document dates and files saved successfully.",

          ownVehicle:
            updatedVehicle,

          documents:
            normalizeDocuments(
              updatedVehicle
                .documents
            ),
        });
    } catch (error) {
      deleteNewUploads(
        req
      );

      console.error(
        "Save own vehicle documents error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to save vehicle documents.",
        });
    }
  };

/* ==========================================
   DELETE own vehicle
========================================== */

const deleteOwnVehicle =
  async (
    req,
    res
  ) => {
    try {
      const vehicleId =
        Number(
          req.params.id
        );

      if (
        !isValidVehicleId(
          vehicleId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid vehicle ID.",
          });
      }

      const vehicle =
        await OwnVehicle.findOne({
          id: vehicleId,
        });

      if (!vehicle) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Vehicle not found.",
          });
      }

      const documents =
        normalizeDocuments(
          vehicle.documents
        );

      await OwnVehicle.deleteOne({
        _id: vehicle._id,
      });

      Object.values(
        documents
      ).forEach(
        (documentData) => {
          if (
            documentData
              ?.filePath
          ) {
            deleteUploadedFile(
              documentData
                .filePath
            );
          }
        }
      );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Vehicle deleted successfully.",
        });
    } catch (error) {
      console.error(
        "Delete own vehicle error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to delete vehicle.",
        });
    }
  };


/* ==========================================
   Asset helpers
========================================== */

const allowedAssetStatuses =
  new Set([
    "Available",
    "Missing",
    "Damaged",
    "Under Repair",
    "Not Required",
  ]);

const normalizeReplacementHistory = (
  history = []
) => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.map(
    (entry) => ({
      id:
        entry?.id ??
        Date.now(),

      date:
        cleanText(
          entry?.date
        ),

      note:
        cleanText(
          entry?.note
        ),
    })
  );
};

const normalizeAssetItems = (
  items = []
) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => {
      const status =
        allowedAssetStatuses.has(
          item?.status
        )
          ? item.status
          : "Missing";

      return {
        id:
          cleanText(
            item?.id
          ) ||
          `asset-${index + 1}`,

        itemName:
          cleanText(
            item?.itemName
          ),

        quantity:
          Math.max(
            0,
            Number(
              item?.quantity
            ) || 0
          ),

        status,

        remarks:
          cleanText(
            item?.remarks
          ),

        image:
          typeof item?.image ===
          "string"
            ? item.image
            : "",

        replacementHistory:
          normalizeReplacementHistory(
            item?.replacementHistory
          ),
      };
    })
    .filter(
      (item) =>
        Boolean(
          item.itemName
        )
    );
};

const createDefaultAssets =
  () => ({
    inspectionDate: "",
    inspectedBy: "",
    tools: [],
    safety: [],
    lashing: [],
    cooking: [],
    updatedAt: "",
  });

const normalizeAssets = (
  assets = {}
) => {
  const source =
    toPlainObject(
      assets
    );

  return {
    inspectionDate:
      cleanText(
        source.inspectionDate
      ),

    inspectedBy:
      cleanText(
        source.inspectedBy
      ),

    tools:
      normalizeAssetItems(
        source.tools
      ),

    safety:
      normalizeAssetItems(
        source.safety
      ),

    lashing:
      normalizeAssetItems(
        source.lashing
      ),

    cooking:
      normalizeAssetItems(
        source.cooking
      ),

    updatedAt:
      cleanText(
        source.updatedAt
      ),
  };
};

/* ==========================================
   GET own vehicle assets

   GET /api/ownvehicles/:id/assets
========================================== */

const getOwnVehicleAssets =
  async (
    req,
    res
  ) => {
    try {
      const vehicleId =
        Number(
          req.params.id
        );

      if (
        !isValidVehicleId(
          vehicleId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid vehicle ID.",
          });
      }

      const vehicle =
        await OwnVehicle.findOne({
          id: vehicleId,
        })
          .select({
            id: 1,
            vehicleNo: 1,
            assets: 1,
          })
          .lean();

      if (!vehicle) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Vehicle not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          vehicleId:
            vehicle.id,

          vehicleNumber:
            vehicle.vehicleNo,

          assets:
            normalizeAssets(
              vehicle.assets ||
                createDefaultAssets()
            ),
        });
    } catch (error) {
      console.error(
        "Get own vehicle assets error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to fetch vehicle assets.",
        });
    }
  };

/* ==========================================
   SAVE own vehicle assets

   PUT /api/ownvehicles/:id/assets
========================================== */

const saveOwnVehicleAssets =
  async (
    req,
    res
  ) => {
    try {
      const vehicleId =
        Number(
          req.params.id
        );

      if (
        !isValidVehicleId(
          vehicleId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid vehicle ID.",
          });
      }

      const vehicle =
        await OwnVehicle.findOne({
          id: vehicleId,
        });

      if (!vehicle) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Vehicle not found.",
          });
      }

      const normalizedAssets =
        normalizeAssets({
          ...req.body,

          updatedAt:
            new Date()
              .toISOString(),
        });

      vehicle.assets =
        normalizedAssets;

      /*
        Ensures nested arrays, images and
        history changes are detected.
      */
      vehicle.markModified(
        "assets"
      );

      const updatedVehicle =
        await vehicle.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Vehicle assets saved successfully.",

          vehicleId:
            updatedVehicle.id,

          vehicleNumber:
            updatedVehicle.vehicleNo,

          assets:
            normalizeAssets(
              updatedVehicle.assets
            ),
        });
    } catch (error) {
      console.error(
        "Save own vehicle assets error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to save vehicle assets.",
        });
    }
  };


  module.exports = {
  getOwnVehicles,
  getOwnVehicleById,
  addOwnVehicle,
  updateOwnVehicle,
  saveVehicleDocuments,
  getOwnVehicleAssets,
  saveOwnVehicleAssets,
  deleteOwnVehicle,
};