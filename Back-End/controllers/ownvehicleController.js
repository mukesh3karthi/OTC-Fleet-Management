const fs =
  require("fs");

const path =
  require("path");

const OwnVehicle =
  require(
    "../models/ownvehicle"
  );


/* ==========================================
   UPLOAD PATH
========================================== */

const uploadsFolder =
  path.join(
    __dirname,
    "../uploads/ownvehicles"
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


/* ==========================================
   DOCUMENT CONFIGURATION
========================================== */

const documentConfiguration = {

  insurance: {
    fileField:
      "insuranceFile",

    label:
      "Insurance",

    requiresDates:
      true,
  },


  fitness: {
    fileField:
      "fitnessFile",

    label:
      "Fitness",

    requiresDates:
      true,
  },


  nationalPermit: {
    fileField:
      "nationalPermitFile",

    label:
      "National Permit",

    requiresDates:
      true,
  },


  permit: {
    fileField:
      "permitFile",

    label:
      "Permit",

    requiresDates:
      true,
  },


  tax: {
    fileField:
      "taxFile",

    label:
      "Tax",

    requiresDates:
      true,
  },


  puc: {
    fileField:
      "pucFile",

    label:
      "PUC",

    requiresDates:
      true,
  },


  rcBook: {
    fileField:
      "rcBookFile",

    label:
      "RC Book",

    requiresDates:
      false,
  },

};


/* ==========================================
   DEFAULT DOCUMENT
========================================== */

const createDefaultDocument =
  () => ({

    startDate: "",

    expiryDate: "",

    fileName: "",

    originalName: "",

    filePath: "",

    mimeType: "",

    size: 0,

    uploadedAt: "",

  });


const createDefaultDocuments =
  () => {

    const documents = {};


    Object.keys(
      documentConfiguration
    ).forEach(
      (key) => {

        documents[key] =
          createDefaultDocument();

      }
    );


    return documents;

  };


/* ==========================================
   BASIC HELPERS
========================================== */

const cleanText = (
  value
) =>
  String(
    value ?? ""
  ).trim();


const uppercaseText = (
  value
) =>
  cleanText(
    value
  ).toUpperCase();


const parseBoolean = (
  value
) => {

  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );

};


const isValidDate = (
  value
) => {

  if (!value) {

    return true;

  }


  return /^\d{4}-\d{2}-\d{2}$/.test(
    value
  );

};


const isValidVehicleId = (
  value
) => {

  return (
    Number.isInteger(
      value
    ) &&
    value > 0
  );

};


/* ==========================================
   OBJECT HELPER
========================================== */

const toPlainObject = (
  value
) => {

  if (!value) {

    return {};

  }


  if (
    typeof value.toObject ===
    "function"
  ) {

    return value.toObject();

  }


  if (
    value instanceof Map
  ) {

    return Object.fromEntries(
      value
    );

  }


  return {
    ...value,
  };

};


/* ==========================================
   NEXT VEHICLE ID
========================================== */

const getNextVehicleId =
  async () => {

    const lastVehicle =
      await OwnVehicle
        .findOne()
        .sort({
          id: -1,
        })
        .select({
          id: 1,
          _id: 0,
        })
        .lean();


    return (
      (
        Number(
          lastVehicle?.id
        ) || 0
      ) + 1
    );

  };


/* ==========================================
   MULTER FILE HELPERS
========================================== */

const getUploadedFiles = (
  req
) => {

  return Object
    .values(
      req.files || {}
    )
    .flat()
    .filter(
      Boolean
    );

};


const getUploadedFile = (
  req,
  fieldName
) => {

  return (
    req.files?.[
      fieldName
    ]?.[0] ||
    null
  );

};


const deleteMulterFile = (
  file
) => {

  try {

    if (!file) {

      return;

    }


    const diskPath =
      file.path ||

      (
        file.filename

          ? path.join(
              uploadsFolder,
              file.filename
            )

          : ""
      );


    if (
      diskPath &&
      fs.existsSync(
        diskPath
      )
    ) {

      fs.unlinkSync(
        diskPath
      );

    }

  } catch (error) {

    console.error(
      "Unable to delete Multer file:",
      error
    );

  }

};


const deleteNewUploads = (
  req
) => {

  getUploadedFiles(
    req
  ).forEach(
    deleteMulterFile
  );

};


/* ==========================================
   DELETE SAVED DOCUMENT
========================================== */

const deleteUploadedFile = (
  publicFilePath
) => {

  try {

    if (
      !publicFilePath
    ) {

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
      fs.existsSync(
        diskPath
      )
    ) {

      fs.unlinkSync(
        diskPath
      );

    }

  } catch (error) {

    console.error(
      "Unable to delete stored document:",
      error
    );

  }

};


/* ==========================================
   VEHICLE VALIDATION
========================================== */

const validateVehicle = (
  body
) => {

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
          body[
            fieldName
          ]
        )
    );


  if (
    missingField
  ) {

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
    new Date()
      .getFullYear();


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


  const manufacturingYearNumber =
    Number(
      manufacturingYear
    );


  const purchaseYearNumber =
    Number(
      purchaseYear
    );


  if (
    manufacturingYearNumber <
      1900 ||

    manufacturingYearNumber >
      currentYear + 1
  ) {

    return {

      valid: false,

      message:
        "Please enter a valid Manufacturing Year.",

    };

  }


  if (
    purchaseYearNumber <
      1900 ||

    purchaseYearNumber >
      currentYear + 1
  ) {

    return {

      valid: false,

      message:
        "Please enter a valid Purchase Year.",

    };

  }


  if (
    purchaseYearNumber <
    manufacturingYearNumber
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
   DOCUMENT VALIDATION
========================================== */

const validateDocuments = (
  documents
) => {

  for (
    const [
      documentKey,
      configuration,
    ]
    of Object.entries(
      documentConfiguration
    )
  ) {

    const documentData =
      documents[
        documentKey
      ];


    if (
      !documentData ||
      !configuration
        .requiresDates
    ) {

      continue;

    }


    if (
      documentData
        .startDate &&

      !isValidDate(
        documentData
          .startDate
      )
    ) {

      return {

        valid: false,

        message:
          `${configuration.label} start date must use YYYY-MM-DD format.`,

      };

    }


    if (
      documentData
        .expiryDate &&

      !isValidDate(
        documentData
          .expiryDate
      )
    ) {

      return {

        valid: false,

        message:
          `${configuration.label} expiry date must use YYYY-MM-DD format.`,

      };

    }


    if (
      documentData
        .startDate &&

      documentData
        .expiryDate
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
   PARSE DOCUMENT JSON
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

    !Array.isArray(
      value
    )
  ) {

    return value;

  }


  if (
    typeof value ===
    "string"
  ) {

    try {

      const parsed =
        JSON.parse(
          value
        );


      if (
        parsed &&
        typeof parsed ===
          "object" &&
        !Array.isArray(
          parsed
        )
      ) {

        return parsed;

      }


      return {};

    } catch {

      return {};

    }

  }


  return {};

};


/* ==========================================
   NORMALIZE DOCUMENTS
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
   BUILD DOCUMENT DATA
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

          configuration
            .requiresDates

            ? startDate

            : "",


        expiryDate:

          configuration
            .requiresDates

            ? expiryDate

            : "",

      };


      /* REMOVE EXISTING DOCUMENT */

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


      /* NEW FILE */

      if (
        uploadedFile
      ) {

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
              .filename ||
            "",


          originalName:
            uploadedFile
              .originalname ||
            "",


          filePath:
            `/uploads/ownvehicles/${uploadedFile.filename}`,


          mimeType:
            uploadedFile
              .mimetype ||
            "",


          size:
            uploadedFile
              .size ||
            0,


          uploadedAt:
            new Date()
              .toISOString(),

        };

      }


      updatedDocuments[
        documentKey
      ] =
        documentResult;

    }
  );


  return updatedDocuments;

};


/* ==========================================
   DOWNLOAD VEHICLE DOCUMENT

   GET
   /api/ownvehicles/download/:fileName
========================================== */

const downloadVehicleDocument = (
  req,
  res
) => {

  try {

    const decodedFileName =
      decodeURIComponent(
        String(
          req.params
            .fileName ||
          ""
        )
      );


    const safeFileName =
      path.basename(
        decodedFileName
      );


    if (
      !safeFileName
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Invalid document file name.",

        });

    }


    const normalizedUploadFolder =
      path.resolve(
        uploadsFolder
      );


    const filePath =
      path.resolve(
        normalizedUploadFolder,
        safeFileName
      );


    /* SECURITY */

    if (
      !filePath.startsWith(
        `${normalizedUploadFolder}${path.sep}`
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


    /* FILE EXISTS */

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
            "Requested document is not a valid file.",

        });

    }


    /* MIME TYPE */

    const extension =
      path
        .extname(
          safeFileName
        )
        .toLowerCase();


    const mimeTypes = {

      ".jpg":
        "image/jpeg",

      ".jpeg":
        "image/jpeg",

      ".png":
        "image/png",

      ".pdf":
        "application/pdf",

    };


    const contentType =
      mimeTypes[
        extension
      ] ||
      "application/octet-stream";


    const requestedName =

      req.query.name

        ? path.basename(
            String(
              req.query.name
            )
          )

        : safeFileName;


    /*
      IMPORTANT:

      The browser must receive
      image/jpeg or image/png
      for PDF embedding.
    */

    res.setHeader(
      "Content-Type",
      contentType
    );


    res.setHeader(
      "Content-Length",
      fileStats.size
    );


    res.setHeader(
      "Cache-Control",
      "no-store"
    );


    /*
      Use inline instead of res.download().

      This allows fetch() from React
      to read the image correctly.
    */

    res.setHeader(
      "Content-Disposition",

      `inline; filename="${encodeURIComponent(
        requestedName
      )}"`
    );


    return res.sendFile(
      filePath
    );

  } catch (error) {

    console.error(
      "Vehicle document download error:",
      error
    );


    if (
      res.headersSent
    ) {

      return;

    }


    return res
      .status(500)
      .json({

        success: false,

        message:
          error.message ||
          "Unable to download document.",

      });

  }

};


/* ==========================================
   GET ALL VEHICLES
========================================== */

const getOwnVehicles =
  async (
    req,
    res
  ) => {

    try {

      const vehicles =
        await OwnVehicle
          .find()
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
   GET VEHICLE BY ID
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
        await OwnVehicle
          .findOne({
            id:
              vehicleId,
          })
          .lean();


      if (
        !vehicle
      ) {

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
   ADD OWN VEHICLE
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


      if (
        duplicate
      ) {

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
        buildDocuments(
          req
        );


      const documentValidation =
        validateDocuments(
          documents
        );


      if (
        !documentValidation
          .valid
      ) {

        deleteNewUploads(
          req
        );


        return res
          .status(400)
          .json({

            success: false,

            message:
              documentValidation
                .message,

          });

      }


      const vehicleId =
        await getNextVehicleId();


      const newVehicle =
        await OwnVehicle.create({

          id:
            vehicleId,


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
            "Unable to add vehicle.",

        });

    }

  };


/* ==========================================
   UPDATE OWN VEHICLE
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
        await OwnVehicle
          .findOne({
            id:
              vehicleId,
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
          req.body.vehicleNo ??
          existingVehicle
            .vehicleNo,


        type:
          req.body.type ??
          existingVehicle
            .type,


        vehicleMake:
          req.body.vehicleMake ??
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
          req.body.engineNo ??
          existingVehicle
            .engineNo,


        chassisNo:
          req.body.chassisNo ??
          existingVehicle
            .chassisNo,


        gps:
          req.body.gps ??
          existingVehicle
            .gps,


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
          mergedBody
            .vehicleNo
        );


      const duplicate =
        await OwnVehicle.exists({

          vehicleNo,

          id: {
            $ne:
              vehicleId,
          },

        });


      if (
        duplicate
      ) {

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

        Object
          .keys(
            req.body
          )
          .some(
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
          )

        ||

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
        !documentValidation
          .valid
      ) {

        deleteNewUploads(
          req
        );


        return res
          .status(400)
          .json({

            success: false,

            message:
              documentValidation
                .message,

          });

      }


      existingVehicle
        .vehicleNo =
        vehicleNo;


      existingVehicle.type =
        cleanText(
          mergedBody.type
        );


      existingVehicle
        .vehicleMake =
        cleanText(
          mergedBody
            .vehicleMake
        );


      existingVehicle
        .manufacturingYear =
        cleanText(
          mergedBody
            .manufacturingYear
        );


      existingVehicle
        .registrationDate =
        cleanText(
          mergedBody
            .registrationDate
        );


      existingVehicle
        .transportOwner =
        cleanText(
          mergedBody
            .transportOwner
        );


      existingVehicle
        .engineNo =
        cleanText(
          mergedBody
            .engineNo
        );


      existingVehicle
        .chassisNo =
        cleanText(
          mergedBody
            .chassisNo
        );


      existingVehicle.gps =
        parseBoolean(
          mergedBody.gps
        );


      existingVehicle
        .purchaseYear =
        cleanText(
          mergedBody
            .purchaseYear
        );


      existingVehicle
        .purchasedFrom =
        cleanText(
          mergedBody
            .purchasedFrom
        );


      existingVehicle
        .documents =
        documents;


      existingVehicle
        .markModified(
          "documents"
        );


      const updatedVehicle =
        await existingVehicle
          .save();


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
   SAVE VEHICLE DOCUMENTS
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


      const vehicle =
        await OwnVehicle
          .findOne({
            id:
              vehicleId,
          });


      if (
        !vehicle
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
          vehicle.documents
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


      vehicle.documents =
        documents;


      vehicle.markModified(
        "documents"
      );


      const updatedVehicle =
        await vehicle.save();


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
        "Save vehicle documents error:",
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
   DELETE OWN VEHICLE
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
        await OwnVehicle
          .findOne({
            id:
              vehicleId,
          });


      if (
        !vehicle
      ) {

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


      await OwnVehicle
        .deleteOne({
          _id:
            vehicle._id,
        });


      Object
        .values(
          documents
        )
        .forEach(
          (
            documentData
          ) => {

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
   ASSET STATUS
========================================== */

const allowedAssetStatuses =
  new Set([

    "Available",

    "Missing",

    "Damaged",

    "Under Repair",

    "Not Required",

  ]);


/* ==========================================
   REPLACEMENT HISTORY
========================================== */

const normalizeReplacementHistory = (
  history = []
) => {

  if (
    !Array.isArray(
      history
    )
  ) {

    return [];

  }


  return history.map(
    (
      entry,
      index
    ) => ({

      id:
        entry?.id ??
        `${Date.now()}-${index}`,


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


/* ==========================================
   NORMALIZE ASSET ITEMS
========================================== */

const normalizeAssetItems = (
  items = []
) => {

  if (
    !Array.isArray(
      items
    )
  ) {

    return [];

  }


  return items
    .map(
      (
        item,
        index
      ) => {

        const status =

          allowedAssetStatuses
            .has(
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


          /*
            Asset images are Base64
            strings from frontend.
          */

          image:

            typeof item?.image ===
            "string"

              ? item.image

              : "",


          replacementHistory:
            normalizeReplacementHistory(
              item
                ?.replacementHistory
            ),

        };

      }
    )
    .filter(
      (item) =>
        Boolean(
          item.itemName
        )
    );

};


/* ==========================================
   DEFAULT ASSETS
========================================== */

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


/* ==========================================
   NORMALIZE ASSETS
========================================== */

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
        source
          .inspectionDate
      ),


    inspectedBy:
      cleanText(
        source
          .inspectedBy
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
   GET VEHICLE ASSETS

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
        await OwnVehicle
          .findOne({
            id:
              vehicleId,
          })
          .select({

            id: 1,

            vehicleNo: 1,

            assets: 1,

          })
          .lean();


      if (
        !vehicle
      ) {

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
        "Get vehicle assets error:",
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
   SAVE VEHICLE ASSETS

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
        await OwnVehicle
          .findOne({
            id:
              vehicleId,
          });


      if (
        !vehicle
      ) {

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
        Important because assets contain
        nested arrays, Base64 images and
        replacement history.
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
            updatedVehicle
              .vehicleNo,


          assets:
            normalizeAssets(
              updatedVehicle
                .assets
            ),

        });

    } catch (error) {

      console.error(
        "Save vehicle assets error:",
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


/* ==========================================
   EXPORTS
========================================== */

module.exports = {

  getOwnVehicles,

  getOwnVehicleById,

  addOwnVehicle,

  updateOwnVehicle,

  saveVehicleDocuments,

  getOwnVehicleAssets,

  saveOwnVehicleAssets,

  deleteOwnVehicle,

  downloadVehicleDocument,

};