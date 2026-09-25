const mongoose = require("mongoose");
const TripOrder = require("../models/Triporder");

const cleanString = (value) =>
  value === null || value === undefined
    ? ""
    : String(value).trim();

const cleanUpperString = (value) =>
  cleanString(value).toUpperCase();

const toNumber = (value, defaultValue = 0) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return defaultValue;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : defaultValue;
};

const toNullableNumber = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const toDateOrNull = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const makeId = (prefix) => {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const random = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

  return `${prefix}-${timestamp}-${random}`;
};

const isValidMongoId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const sendSuccess = (
  res,
  statusCode,
  message,
  data
) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

const sendError = (
  res,
  statusCode,
  message,
  error = null
) => {
  const response = {
    success: false,
    message,
  };

  if (
    process.env.NODE_ENV !== "production" &&
    error
  ) {
    response.error =
      error.message || String(error);
  }

  return res
    .status(statusCode)
    .json(response);
};

const getRequirements = (trip) =>
  Array.isArray(
    trip?.vehicleRequirements
  )
    ? trip.vehicleRequirements
    : [];

const getQuotations = (trip) =>
  Array.isArray(
    trip?.trafficQuotations
  )
    ? trip.trafficQuotations
    : [];

const getConfirmations = (trip) =>
  Array.isArray(
    trip?.vehicleConfirmations
  )
    ? trip.vehicleConfirmations
    : [];

const getAllocatedVehicles = (trip) =>
  Array.isArray(
    trip?.allocatedVehicles
  )
    ? trip.allocatedVehicles
    : [];

const findRequirement = (
  trip,
  requirementId
) =>
  getRequirements(trip).find(
    (requirement) =>
      requirement.requirementId ===
      requirementId
  );

const findQuotation = (
  trip,
  quotationId
) =>
  getQuotations(trip).find(
    (quotation) =>
      quotation.quotationId ===
      quotationId
  );

const findConfirmation = (
  trip,
  confirmationId
) =>
  getConfirmations(trip).find(
    (confirmation) =>
      confirmation.confirmationId ===
      confirmationId
  );

const findApprovedConfirmation = (
  trip,
  requirementId
) => {
  const confirmations =
    getConfirmations(trip);

  for (
    let index =
      confirmations.length - 1;
    index >= 0;
    index -= 1
  ) {
    const confirmation =
      confirmations[index];

    if (
      confirmation.requirementId ===
      requirementId &&
      confirmation.status === "Approved"
    ) {
      return confirmation;
    }
  }

  return null;
};

const normalizeRequirement = (
  requirement,
  index
) => ({
  requirementId:
    cleanString(
      requirement?.requirementId
    ) ||
    makeId(`REQ${index + 1}`),

  vehicleType:
    cleanString(
      requirement?.vehicleType
    ),

  configuration:
    cleanString(
      requirement?.configuration
    ),

  classification:
    cleanString(
      requirement?.classification
    ),

  quantity: Math.max(
    1,
    toNumber(
      requirement?.quantity,
      1
    )
  ),

  weight: Math.max(
    0,
    toNumber(
      requirement?.weight,
      0
    )
  ),

  dimensions: {
    length:
      toNullableNumber(
        requirement?.dimensions?.length
      ),

    height:
      toNullableNumber(
        requirement?.dimensions?.height
      ),

    width:
      toNullableNumber(
        requirement?.dimensions?.width
      ),
  },
});

const buildTripData = (
  body = {}
) => ({
  tripId:
    cleanUpperString(
      body.tripId
    ),

  movementType:
    cleanString(
      body.movementType
    ),

  customer:
    cleanString(
      body.customer
    ),

  contactPerson:
    cleanString(
      body.contactPerson
    ),

  contactNumber:
    cleanString(
      body.contactNumber
    ),

  email:
    cleanString(
      body.email
    ).toLowerCase(),

  assignedKam:
    cleanString(
      body.assignedKam
    ),

  enquiryDate:
    toDateOrNull(
      body.enquiryDate
    ),

  placementDate:
    toDateOrNull(
      body.placementDate
    ),

  origin:
    cleanString(
      body.origin
    ),

  destination:
    cleanString(
      body.destination
    ),

  distance: Math.max(
    0,
    toNumber(
      body.distance,
      0
    )
  ),

  totalVehicles: Math.max(
    0,
    Math.floor(
      toNumber(
        body.totalVehicles,
        0
      )
    )
  ),

  routeLocations:
    Array.isArray(
      body.routeLocations
    )
      ? body.routeLocations
        .map(cleanString)
        .filter(Boolean)
      : [],

  materialType:
    cleanString(
      body.materialType
    ),

  remark:
    cleanString(
      body.remark
    ),

  siteLocation:
    cleanString(
      body.siteLocation
    ),

  period:
    cleanString(
      body.period
    ),

  dieselScope:
    cleanString(
      body.dieselScope
    ),

  vehicleRequirements:
    Array.isArray(
      body.vehicleRequirements
    )
      ? body.vehicleRequirements.map(
        normalizeRequirement
      )
      : [],
});

const getTripDocument = async (
  id
) => {
  if (!isValidMongoId(id)) {
    return {
      error:
        "Invalid order database ID.",
      status: 400,
    };
  }

  const trip =
    await TripOrder.findById(id);

  if (!trip) {
    return {
      error: "Order not found.",
      status: 404,
    };
  }

  return {
    trip,
  };
};

const createTrip = async (
  req,
  res
) => {
  try {
    const data =
      buildTripData(req.body);

    if (!data.tripId) {
      return sendError(
        res,
        400,
        "Trip ID is required."
      );
    }

    if (!data.customer) {
      return sendError(
        res,
        400,
        "Customer is required."
      );
    }

    if (
      !Array.isArray(
        data.vehicleRequirements
      ) ||
      data.vehicleRequirements
        .length === 0
    ) {
      return sendError(
        res,
        400,
        "At least one vehicle requirement is required."
      );
    }

    const duplicateTrip =
      await TripOrder.findOne({
        tripId: data.tripId,
      });

    if (duplicateTrip) {
      return sendError(
        res,
        409,
        `Trip ID ${data.tripId} already exists.`
      );
    }

    const trip =
      await TripOrder.create({
        ...data,

        status: "Pending",

        stage: "Order Approval",

        orderApproval: {
          status: "Pending",

          requestedAt: null,

          approvedBy: "",

          approvedAt: null,

          remarks: "",

          rejectionReason: "",
        },

        trafficQuotations: [],

        vehicleConfirmations: [],

        allocatedVehicles: [],
      });

    return sendSuccess(
      res,
      201,
      "Order created successfully and sent for approval.",
      trip
    );
  } catch (error) {
    console.error(
      "Create Trip Error:",
      error
    );

    if (error?.code === 11000) {
      return sendError(
        res,
        409,
        "Trip ID already exists.",
        error
      );
    }

    return sendError(
      res,
      500,
      "Unable to create order.",
      error
    );
  }
};

/* =========================================================
   CREATE CRANE MOVEMENT
   Separate flow so the existing createTrip function is untouched.

   Expects multipart/form-data:
   - data: JSON string containing normal trip fields
   - document: Crane vehicle requirement file
========================================================= */

const createCraneTrip = async (
  req,
  res
) => {
  try {
    let body = {};

    try {
      body =
        typeof req.body?.data === "string"
          ? JSON.parse(req.body.data)
          : req.body || {};
    } catch {
      return sendError(
        res,
        400,
        "Invalid Crane order data."
      );
    }

    const data =
      buildTripData(body);

    if (!data.tripId) {
      return sendError(
        res,
        400,
        "Trip ID is required."
      );
    }

    if (!data.customer) {
      return sendError(
        res,
        400,
        "Customer is required."
      );
    }

    if (
      cleanString(data.movementType)
        .toLowerCase() !== "crane"
    ) {
      return sendError(
        res,
        400,
        "This endpoint is only for Crane movement."
      );
    }

    if (!req.file) {
      return sendError(
        res,
        400,
        "Crane vehicle requirement document is required."
      );
    }

    const duplicateTrip =
      await TripOrder.findOne({
        tripId: data.tripId,
      });

    if (duplicateTrip) {
      return sendError(
        res,
        409,
        `Trip ID ${data.tripId} already exists.`
      );
    }

    /*
     * Keep the existing quotation / approval / tracking functions working.
     * Crane gets one parent requirement linked to the uploaded vehicle list.
     * No old function is replaced.
     */
    const craneRequirement = {
      requirementId:
        `${data.tripId}-CRANE-REQ-1`,

      vehicleType:
        "Crane",

      configuration:
        "As per uploaded Crane vehicle requirement document",

      classification:
        "Crane Movement",

      quantity:
        Math.max(
          1,
          data.totalVehicles || 1
        ),

      weight: 0,

      dimensions: {
        length: null,
        height: null,
        width: null,
      },
    };

    const trip =
      await TripOrder.create({
        ...data,

        movementType: "Crane",

        vehicleRequirements: [
          craneRequirement,
        ],

        craneDocument: {
          documentName:
            cleanString(
              body.craneDocumentName
            ) ||
            "Crane Vehicle Requirement",

          fileName:
            req.file.originalname,

          mimeType:
            req.file.mimetype,

          fileSize:
            req.file.size,

          fileData:
            req.file.buffer,

          uploadedBy:
            cleanString(
              body.uploadedBy
            ) ||
            cleanString(
              body.assignedKam
            ) ||
            "Key Account",

          uploadedAt:
            new Date(),
        },

        status: "Pending",

        stage: "Order Approval",

        orderApproval: {
          status: "Pending",
          requestedAt: null,
          approvedBy: "",
          approvedAt: null,
          remarks: "",
          rejectionReason: "",
        },

        trafficQuotations: [],
        vehicleConfirmations: [],
        allocatedVehicles: [],
      });

    const createdTrip =
      await TripOrder.findById(
        trip._id
      ).lean();

    return sendSuccess(
      res,
      201,
      "Crane order created successfully and sent for approval.",
      createdTrip
    );
  } catch (error) {
    console.error(
      "Create Crane Trip Error:",
      error
    );

    if (error?.code === 11000) {
      return sendError(
        res,
        409,
        "Trip ID already exists.",
        error
      );
    }

    return sendError(
      res,
      500,
      "Unable to create Crane order.",
      error
    );
  }
};

/* =========================================================
   DOWNLOAD / VIEW CRANE REQUIREMENT DOCUMENT
========================================================= */

const downloadCraneDocument = async (
  req,
  res
) => {
  try {
    if (
      !isValidMongoId(
        req.params.id
      )
    ) {
      return sendError(
        res,
        400,
        "Invalid order database ID."
      );
    }

    const trip =
      await TripOrder.findById(
        req.params.id
      )
        .select(
          "+craneDocument.fileData"
        );

    if (!trip) {
      return sendError(
        res,
        404,
        "Order not found."
      );
    }

    const document =
      trip.craneDocument;

    if (
      !document?.fileData ||
      !document?.fileName
    ) {
      return sendError(
        res,
        404,
        "Crane vehicle requirement document not found."
      );
    }

    const disposition =
      String(
        req.query.disposition || ""
      ).toLowerCase() === "inline"
        ? "inline"
        : "attachment";

    res.setHeader(
      "Content-Type",
      document.mimeType ||
      "application/octet-stream"
    );

    res.setHeader(
      "Content-Length",
      document.fileData.length
    );

    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${String(
        document.fileName
      ).replace(/"/g, "")}"`
    );

    return res.send(
      document.fileData
    );
  } catch (error) {
    console.error(
      "Download Crane Document Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to load Crane vehicle requirement document.",
      error
    );
  }
};

const getAllTrips = async (
  req,
  res
) => {
  try {
    const trips =
      await TripOrder.find()
        .sort({
          createdAt: -1,
        })
        .lean();

    return sendSuccess(
      res,
      200,
      "Orders fetched successfully.",
      trips
    );
  } catch (error) {
    console.error(
      "Get All Trips Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to fetch orders.",
      error
    );
  }
};

const getTripById = async (
  req,
  res
) => {
  try {
    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    return sendSuccess(
      res,
      200,
      "Order fetched successfully.",
      result.trip
    );
  } catch (error) {
    console.error(
      "Get Trip By ID Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to fetch order.",
      error
    );
  }
};

const getTripByTripId = async (
  req,
  res
) => {
  try {
    const tripId =
      cleanUpperString(
        req.params.tripId
      );

    if (!tripId) {
      return sendError(
        res,
        400,
        "Trip ID is required."
      );
    }

    const trip =
      await TripOrder.findOne({
        tripId,
      });

    if (!trip) {
      return sendError(
        res,
        404,
        "Order not found."
      );
    }

    return sendSuccess(
      res,
      200,
      "Order fetched successfully.",
      trip
    );
  } catch (error) {
    console.error(
      "Get Trip By Trip ID Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to fetch order.",
      error
    );
  }
};

const updateTrip = async (
  req,
  res
) => {
  try {
    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip = result.trip;

    if (
      trip.orderApproval?.status ===
      "Approved"
    ) {
      return sendError(
        res,
        409,
        "Approved orders cannot be edited from Key Account."
      );
    }

    const data =
      buildTripData(req.body);

    if (!data.tripId) {
      return sendError(
        res,
        400,
        "Trip ID is required."
      );
    }

    if (!data.customer) {
      return sendError(
        res,
        400,
        "Customer is required."
      );
    }

    if (
      !Array.isArray(
        data.vehicleRequirements
      ) ||
      data.vehicleRequirements
        .length === 0
    ) {
      return sendError(
        res,
        400,
        "At least one vehicle requirement is required."
      );
    }

    const duplicateTrip =
      await TripOrder.findOne({
        tripId: data.tripId,

        _id: {
          $ne: trip._id,
        },
      });

    if (duplicateTrip) {
      return sendError(
        res,
        409,
        `Trip ID ${data.tripId} already exists.`
      );
    }

    trip.tripId =
      data.tripId;

    trip.movementType =
      data.movementType;

    trip.customer =
      data.customer;

    trip.contactPerson =
      data.contactPerson;

    trip.contactNumber =
      data.contactNumber;

    trip.email =
      data.email;

    trip.assignedKam =
      data.assignedKam;

    trip.enquiryDate =
      data.enquiryDate;

    trip.placementDate =
      data.placementDate;

    trip.origin =
      data.origin;

    trip.destination =
      data.destination;

    trip.distance =
      data.distance;

    trip.totalVehicles =
      data.totalVehicles;

    trip.routeLocations =
      data.routeLocations;

    trip.materialType =
      data.materialType;

    trip.remark =
      data.remark;

    trip.siteLocation =
      data.siteLocation;

    trip.period =
      data.period;

    trip.dieselScope =
      data.dieselScope;

    trip.vehicleRequirements =
      data.vehicleRequirements;

    if (
      trip.orderApproval?.status ===
      "Rejected"
    ) {
      trip.orderApproval = {
        status: "Pending",

        requestedAt: null,

        approvedBy: "",

        approvedAt: null,

        remarks: "",

        rejectionReason: "",
      };

      trip.status = "Pending";

      trip.stage =
        "Order Approval";
    }

    trip.markModified(
      "vehicleRequirements"
    );

    await trip.save();

    const updatedTrip =
      await TripOrder.findById(
        trip._id
      ).lean();

    return sendSuccess(
      res,
      200,
      "Order updated successfully.",
      updatedTrip
    );
  } catch (error) {
    console.error(
      "Update Trip Error:",
      error
    );

    if (error?.code === 11000) {
      return sendError(
        res,
        409,
        "Trip ID already exists.",
        error
      );
    }

    return sendError(
      res,
      500,
      "Unable to update order.",
      error
    );
  }
};

const saveOrderFinalization = async (
  req,
  res
) => {
  try {
    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip = result.trip;

    if (
      trip.orderApproval?.status ===
      "Approved"
    ) {
      return sendError(
        res,
        409,
        "Approved orders cannot be changed from Order Finalization."
      );
    }

    const quotedRateRaw =
      req.body.quotedRate;

    const finalRateRaw =
      req.body.finalRate;

    const quotedRate =
      quotedRateRaw === "" ||
        quotedRateRaw === null ||
        quotedRateRaw === undefined
        ? null
        : Number(
          quotedRateRaw
        );

    const finalRate =
      finalRateRaw === "" ||
        finalRateRaw === null ||
        finalRateRaw === undefined
        ? null
        : Number(
          finalRateRaw
        );

    if (
      quotedRate !== null &&
      (
        !Number.isFinite(
          quotedRate
        ) ||
        quotedRate < 0
      )
    ) {
      return sendError(
        res,
        400,
        "Quoted Rate must be a valid positive number."
      );
    }

    if (
      finalRate !== null &&
      (
        !Number.isFinite(
          finalRate
        ) ||
        finalRate < 0
      )
    ) {
      return sendError(
        res,
        400,
        "Final Rate must be a valid positive number."
      );
    }

    const commercialTerms =
      cleanString(
        req.body.commercialTerms
      );

    const deliveryCommitments =
      cleanString(
        req.body.deliveryCommitments
      );

    const clientConfirmationNotes =
      cleanString(
        req.body
          .clientConfirmationNotes
      );

    const updatedBy =
      cleanString(
        req.body.updatedBy
      ) || "Key Account";

    const requestApproval =
      req.body.requestApproval ===
      true;

    if (requestApproval) {
      if (quotedRate === null) {
        return sendError(
          res,
          400,
          "Quoted Rate is required before requesting approval."
        );
      }

      if (finalRate === null) {
        return sendError(
          res,
          400,
          "Final Rate is required before requesting approval."
        );
      }

      if (!commercialTerms) {
        return sendError(
          res,
          400,
          "Commercial Terms & Payment SLAs are required before requesting approval."
        );
      }

      if (
        !deliveryCommitments
      ) {
        return sendError(
          res,
          400,
          "Delivery Commitments & Transit SLAs are required before requesting approval."
        );
      }
    }

    trip.orderFinalization = {
      quotedRate,

      finalRate,

      commercialTerms,

      deliveryCommitments,

      clientConfirmationNotes,

      updatedBy,

      updatedAt:
        new Date(),
    };

    trip.markModified(
      "orderFinalization"
    );

    if (requestApproval) {
      trip.orderApproval = {
        status: "Pending",

        requestedAt:
          new Date(),

        approvedBy: "",

        approvedAt: null,

        remarks: "",

        rejectionReason: "",
      };

      trip.status =
        "Pending";

      trip.stage =
        "Order Approval";

      trip.markModified(
        "orderApproval"
      );
    }

    await trip.save();

    const updatedTrip =
      await TripOrder.findById(
        trip._id
      ).lean();

    return sendSuccess(
      res,
      200,
      requestApproval
        ? "Order finalization saved and approval requested successfully."
        : "Order finalization saved successfully.",
      updatedTrip
    );
  } catch (error) {
    console.error(
      "Save Order Finalization Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to save order finalization.",
      error
    );
  }
};

/* =========================================================
   SAVE / DOWNLOAD PO DOCUMENT
========================================================= */

const savePoDocument = async (req, res) => {
  try {
    const result = await getTripDocument(req.params.id);

    if (result.error) {
      return sendError(res, result.status, result.error);
    }

    const trip = result.trip;
    const poNumber = cleanString(req.body.poNumber);
    const validityRaw = cleanString(req.body.poValidityPeriod);
    const billingGstin = cleanUpperString(req.body.billingGstin);

    if (!poNumber) {
      return sendError(res, 400, "PO Number is required.");
    }

    const poValidityPeriod = new Date(validityRaw);

    if (!validityRaw || Number.isNaN(poValidityPeriod.getTime())) {
      return sendError(res, 400, "A valid PO Validity Period is required.");
    }

    const gstinPattern =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

    if (!gstinPattern.test(billingGstin)) {
      return sendError(
        res,
        400,
        "Enter a valid 15-character Billing GSTIN."
      );
    }

    if (!req.file && !trip.poDocument?.fileName) {
      return sendError(res, 400, "Select a PO document before saving.");
    }

    trip.poDocument.poNumber = poNumber;
    trip.poDocument.poValidityPeriod = poValidityPeriod;
    trip.poDocument.billingGstin = billingGstin;
    trip.poDocument.status = "Completed";
    trip.poDocument.documentName =
      cleanString(req.body.documentName) ||
      req.file?.originalname ||
      "PO Document";
    trip.poDocument.uploadedBy =
      cleanString(req.body.uploadedBy) || "Key Account";
    trip.poDocument.uploadedAt = new Date();

    if (req.file) {
      trip.poDocument.fileName = req.file.originalname;
      trip.poDocument.mimeType = req.file.mimetype;
      trip.poDocument.fileSize = req.file.size;
      trip.poDocument.fileData = req.file.buffer;
    }

    trip.markModified("poDocument");

    /*
     * PO SAVE WORKFLOW
     *
     * Vendor/vehicle approval already complete:
     *   PO Document -> Order Placed
     *
     * Vendor/vehicle approval still pending:
     *   PO Document -> Vendor Finalization
     */
    const requirements = getRequirements(trip);
    const approvedConfirmations = getConfirmations(trip).filter(
      (confirmation) => confirmation?.status === "Approved"
    );

    const vendorApprovalCompleted =
      requirements.length > 0 &&
      requirements.every((requirement) =>
        approvedConfirmations.some(
          (confirmation) =>
            confirmation?.requirementId === requirement?.requirementId
        )
      );

    const alreadyReleasedToTracking =
      cleanString(trip?.orderPlaced?.status).toLowerCase() === "completed" ||
      [
        "tracking",
        "trip complete",
        "trip completed",
        "completed",
      ].includes(
        cleanString(trip?.stage).toLowerCase()
      );

    if (!alreadyReleasedToTracking) {
      trip.stage = vendorApprovalCompleted
        ? "Order Placed"
        : "Vendor Finalization";
    }

    await trip.save();

    const savedTrip = await TripOrder.findById(trip._id).lean();

    return sendSuccess(
      res,
      200,
      "PO document saved successfully.",
      savedTrip
    );
  } catch (error) {
    console.error("Save PO Document Error:", error);
    return sendError(res, 500, "Unable to save PO document.", error);
  }
};

const downloadPoDocument = async (req, res) => {
  try {
    if (!isValidMongoId(req.params.id)) {
      return sendError(res, 400, "Invalid order database ID.");
    }

    const trip = await TripOrder.findById(req.params.id).select(
      "+poDocument.fileData"
    );

    if (!trip) {
      return sendError(res, 404, "Order not found.");
    }

    if (!trip.poDocument?.fileData) {
      return sendError(res, 404, "PO document file not found.");
    }

    res.setHeader(
      "Content-Type",
      trip.poDocument.mimeType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${String(
        trip.poDocument.fileName || "po-document"
      ).replace(/"/g, "")}"`
    );

    return res.send(trip.poDocument.fileData);
  } catch (error) {
    console.error("Download PO Document Error:", error);
    return sendError(res, 500, "Unable to download PO document.", error);
  }
};

const approveOrder = async (
  req,
  res
) => {
  try {
    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip = result.trip;

    const status =
      cleanString(
        req.body.status
      );

    const approvedBy =
      cleanString(
        req.body.approvedBy
      );

    const remarks =
      cleanString(
        req.body.remarks
      );

    const rejectionReason =
      cleanString(
        req.body.rejectionReason
      );

    if (
      ![
        "Approved",
        "Rejected",
      ].includes(status)
    ) {
      return sendError(
        res,
        400,
        "Order approval status must be Approved or Rejected."
      );
    }

    if (!approvedBy) {
      return sendError(
        res,
        400,
        "Approved/Reviewed By is required."
      );
    }

    if (
      status === "Rejected" &&
      !rejectionReason
    ) {
      return sendError(
        res,
        400,
        "Rejection reason is required."
      );
    }

    if (
      getQuotations(
        trip
      ).length > 0
    ) {
      return sendError(
        res,
        409,
        "Order approval cannot be changed after Traffic quotations have been submitted."
      );
    }

    trip.orderApproval = {
      status,

      requestedAt:
        trip.orderApproval
          ?.requestedAt ||
        null,

      approvedBy,

      approvedAt:
        new Date(),

      remarks,

      rejectionReason:
        status === "Rejected"
          ? rejectionReason
          : "",
    };

    if (
      status === "Approved"
    ) {
      trip.status =
        "Approved";

      trip.stage =
        "Traffic Quotation";
    } else {
      trip.status =
        "Rejected";

      trip.stage =
        "Order Rejected";
    }

    await trip.save();

    return sendSuccess(
      res,
      200,
      status === "Approved"
        ? "Order approved successfully and sent to Traffic."
        : "Order rejected successfully.",
      trip
    );
  } catch (error) {
    console.error(
      "Order Approval Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to update order approval.",
      error
    );
  }
};

const addTrafficQuotation = async (
  req,
  res
) => {
  try {
    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip = result.trip;

    if (
      trip.orderApproval?.status !==
      "Approved"
    ) {
      return sendError(
        res,
        409,
        "Traffic quotation can be added only after the order is approved."
      );
    }

    const requirementId =
      cleanString(
        req.body.requirementId
      );

    const transporter =
      cleanString(
        req.body.transporter
      );

    const quotedBy =
      cleanString(
        req.body.quotedBy
      );

    const allocatedBy =
      cleanString(
        req.body.allocatedBy
      ) ||
      quotedBy;

    const remarks =
      cleanString(
        req.body.remarks
      );

    const amount =
      Number(
        req.body.amount
      );

    const quantity =
      Math.max(
        1,
        Math.floor(
          toNumber(
            req.body.quantity,
            1
          )
        )
      );

    if (!requirementId) {
      return sendError(
        res,
        400,
        "Requirement ID is required."
      );
    }

    const requirement =
      findRequirement(
        trip,
        requirementId
      );

    if (!requirement) {
      return sendError(
        res,
        404,
        "Vehicle requirement not found."
      );
    }

    if (!transporter) {
      return sendError(
        res,
        400,
        "Transporter is required."
      );
    }

    if (
      !Number.isFinite(
        amount
      ) ||
      amount < 0
    ) {
      return sendError(
        res,
        400,
        "A valid quotation amount is required."
      );
    }

    if (!quotedBy) {
      return sendError(
        res,
        400,
        "Quoted By is required."
      );
    }

    const requiredQuantity =
      Math.max(
        1,
        Math.floor(
          toNumber(
            requirement.quantity,
            1
          )
        )
      );

    const approvedQuantity =
      getConfirmations(trip)
        .filter(
          (confirmation) =>
            confirmation.requirementId ===
              requirementId &&
            confirmation.status ===
              "Approved"
        )
        .reduce(
          (total, confirmation) => {
            const approvedQuotation =
              findQuotation(
                trip,
                confirmation.quotationId
              );

            return (
              total +
              Math.max(
                1,
                Math.floor(
                  toNumber(
                    approvedQuotation?.quantity,
                    1
                  )
                )
              )
            );
          },
          0
        );

    if (
      approvedQuantity >=
      requiredQuantity
    ) {
      return sendError(
        res,
        409,
        "This vehicle requirement is already fully approved."
      );
    }

    const quotation = {
      quotationId:
        makeId("QT"),

      requirementId,

      transporter,

      quantity,

      amount,

      quotedBy,

      allocatedBy,

      quotedAt:
        new Date(),

      remarks,
    };

    trip.trafficQuotations.push(
      quotation
    );

    trip.status =
      "Pending";

    trip.stage =
      "Quotation Approval";

    trip.markModified(
      "trafficQuotations"
    );

    await trip.save();

    return sendSuccess(
      res,
      201,
      "Traffic quotation added successfully and sent for approval.",
      trip
    );
  } catch (error) {
    console.error(
      "Add Traffic Quotation Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to add Traffic quotation.",
      error
    );
  }
};

const confirmVehicleQuotation = async (
  req,
  res
) => {
  try {
    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip = result.trip;

    if (
      trip.orderApproval?.status !==
      "Approved"
    ) {
      return sendError(
        res,
        409,
        "The order must be approved before quotation confirmation."
      );
    }

    const requirementId =
      cleanString(
        req.body.requirementId
      );

    const status =
      cleanString(
        req.body.status
      );

    const confirmedBy =
      cleanString(
        req.body.confirmedBy
      );

    const remarks =
      cleanString(
        req.body.remarks
      );

    const rejectionReason =
      cleanString(
        req.body.rejectionReason
      );

    const incomingQuotationIds =
      Array.isArray(
        req.body.quotationIds
      )
        ? req.body.quotationIds
        : [req.body.quotationId];

    const quotationIds = [
      ...new Set(
        incomingQuotationIds
          .map(cleanString)
          .filter(Boolean)
      ),
    ];

    if (!requirementId) {
      return sendError(
        res,
        400,
        "Requirement ID is required."
      );
    }

    if (!quotationIds.length) {
      return sendError(
        res,
        400,
        "Select at least one quotation."
      );
    }

    if (
      ![
        "Approved",
        "Rejected",
      ].includes(status)
    ) {
      return sendError(
        res,
        400,
        "Quotation status must be Approved or Rejected."
      );
    }

    if (!confirmedBy) {
      return sendError(
        res,
        400,
        "Confirmed By is required."
      );
    }

    if (
      status === "Rejected" &&
      !rejectionReason
    ) {
      return sendError(
        res,
        400,
        "Rejection reason is required."
      );
    }

    const requirement =
      findRequirement(
        trip,
        requirementId
      );

    if (!requirement) {
      return sendError(
        res,
        404,
        "Vehicle requirement not found."
      );
    }

    const requirementQuotations =
      getQuotations(trip).filter(
        (item) =>
          item.requirementId ===
          requirementId
      );

    const selectedQuotations =
      requirementQuotations.filter(
        (item) =>
          quotationIds.includes(
            item.quotationId
          )
      );

    if (
      selectedQuotations.length !==
      quotationIds.length
    ) {
      return sendError(
        res,
        404,
        "One or more selected quotations were not found for this vehicle requirement."
      );
    }

    const requiredQuantity =
      Math.max(
        1,
        Math.floor(
          toNumber(
            requirement.quantity,
            1
          )
        )
      );

    const selectedQuantity =
      selectedQuotations.reduce(
        (total, quotation) =>
          total +
          Math.max(
            1,
            Math.floor(
              toNumber(
                quotation.quantity,
                1
              )
            )
          ),
        0
      );

    const alreadyApprovedQuantity =
      getConfirmations(trip)
        .filter(
          (confirmation) =>
            confirmation.requirementId === requirementId &&
            confirmation.status === "Approved" &&
            !quotationIds.includes(
              confirmation.quotationId
            )
        )
        .reduce(
          (total, confirmation) => {
            const quotation =
              findQuotation(
                trip,
                confirmation.quotationId
              );

            return (
              total +
              Math.max(
                1,
                Math.floor(
                  toNumber(
                    quotation?.quantity,
                    1
                  )
                )
              )
            );
          },
          0
        );

    const pendingQuantity =
      Math.max(
        0,
        requiredQuantity -
          alreadyApprovedQuantity
      );

    if (
      status === "Approved" &&
      (
        selectedQuantity <= 0 ||
        selectedQuantity > pendingQuantity
      )
    ) {
      return sendError(
        res,
        400,
        pendingQuantity <= 0
          ? "This vehicle requirement is already fully approved."
          : `You can approve up to ${pendingQuantity} pending NOS. Selected ${selectedQuantity} NOS.`
      );
    }

    const now = new Date();

    const upsertConfirmation = (
      targetQuotation,
      confirmationStatus,
      confirmationRemarks = "",
      confirmationRejectionReason = ""
    ) => {
      const existingConfirmation =
        getConfirmations(trip).find(
          (confirmation) =>
            confirmation.requirementId ===
              requirementId &&
            confirmation.quotationId ===
              targetQuotation.quotationId
        );

      if (existingConfirmation) {
        const allocationExists =
          getAllocatedVehicles(
            trip
          ).some(
            (vehicle) =>
              vehicle.confirmationId ===
              existingConfirmation.confirmationId
          );

        if (
          allocationExists &&
          existingConfirmation.status !==
            confirmationStatus
        ) {
          return {
            error:
              "Quotation confirmation cannot be changed after vehicle allocation.",
          };
        }

        existingConfirmation.status =
          confirmationStatus;

        existingConfirmation.confirmedBy =
          confirmedBy;

        existingConfirmation.confirmedAt =
          now;

        existingConfirmation.remarks =
          confirmationRemarks;

        existingConfirmation.rejectionReason =
          confirmationStatus ===
          "Rejected"
            ? confirmationRejectionReason
            : "";

        return {
          confirmation:
            existingConfirmation,
        };
      }

      const newConfirmation = {
        confirmationId:
          makeId("CONF"),

        requirementId,

        quotationId:
          targetQuotation.quotationId,

        status:
          confirmationStatus,

        confirmedBy,

        confirmedAt: now,

        remarks:
          confirmationRemarks,

        rejectionReason:
          confirmationStatus ===
          "Rejected"
            ? confirmationRejectionReason
            : "",
      };

      trip.vehicleConfirmations.push(
        newConfirmation
      );

      return {
        confirmation:
          newConfirmation,
      };
    };

    if (status === "Approved") {
      // Partial approval is allowed.
      // Approve selected rows only; unselected balance remains pending.
      for (
        const selectedQuotation
        of selectedQuotations
      ) {
        const updateResult =
          upsertConfirmation(
            selectedQuotation,
            "Approved",
            remarks,
            ""
          );

        if (updateResult.error) {
          return sendError(
            res,
            409,
            updateResult.error
          );
        }
      }
    } else {
      for (
        const selectedQuotation
        of selectedQuotations
      ) {
        const updateResult =
          upsertConfirmation(
            selectedQuotation,
            "Rejected",
            remarks,
            rejectionReason
          );

        if (updateResult.error) {
          return sendError(
            res,
            409,
            updateResult.error
          );
        }
      }
    }

    const requirements =
      getRequirements(trip);

    const allRequirementsApproved =
      requirements.length > 0 &&
      requirements.every(
        (item) => {
          const required =
            Math.max(
              1,
              Math.floor(
                toNumber(
                  item.quantity,
                  1
                )
              )
            );

          const approvedQuantity =
            getConfirmations(trip)
              .filter(
                (confirmation) =>
                  confirmation.requirementId ===
                    item.requirementId &&
                  confirmation.status ===
                    "Approved"
              )
              .reduce(
                (
                  total,
                  confirmation
                ) => {
                  const quotation =
                    findQuotation(
                      trip,
                      confirmation.quotationId
                    );

                  return (
                    total +
                    Math.max(
                      1,
                      Math.floor(
                        toNumber(
                          quotation?.quantity,
                          1
                        )
                      )
                    )
                  );
                },
                0
              );

          return (
            approvedQuantity >=
            required
          );
        }
      );

    if (allRequirementsApproved) {
      trip.status =
        "Confirmed";

      trip.stage =
        "Tracking Input";
    } else {
      trip.status =
        "Pending";

      trip.stage =
        "Quotation Approval";
    }

    trip.markModified(
      "vehicleConfirmations"
    );

    await trip.save();

    const updatedTrip =
      await TripOrder.findById(
        trip._id
      ).lean();

    return sendSuccess(
      res,
      200,
      status === "Approved"
        ? `${selectedQuotations.length} transporter quotation(s) approved for ${selectedQuantity} NOS. Balance quantity remains pending until fully approved.`
        : "Selected transporter quotation(s) rejected successfully.",
      updatedTrip
    );
  } catch (error) {
    console.error(
      "Confirm Quotation Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to confirm quotation.",
      error
    );
  }
};


const allocateVehicle = async (
  req,
  res
) => {
  try {
    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip =
      result.trip;

    const requirementId =
      cleanString(
        req.body.requirementId
      );

    const confirmationId =
      cleanString(
        req.body.confirmationId
      );

    const quotationId =
      cleanString(
        req.body.quotationId
      );

    const vehicleNumber =
      cleanUpperString(
        req.body.vehicleNumber
      );

    if (!requirementId) {
      return sendError(
        res,
        400,
        "Requirement ID is required."
      );
    }

    if (!confirmationId) {
      return sendError(
        res,
        400,
        "Confirmation ID is required."
      );
    }

    if (!quotationId) {
      return sendError(
        res,
        400,
        "Quotation ID is required."
      );
    }

    if (!vehicleNumber) {
      return sendError(
        res,
        400,
        "Vehicle number is required."
      );
    }

    const requirement =
      findRequirement(
        trip,
        requirementId
      );

    if (!requirement) {
      return sendError(
        res,
        404,
        "Vehicle requirement not found."
      );
    }

    const confirmation =
      findConfirmation(
        trip,
        confirmationId
      );

    if (!confirmation) {
      return sendError(
        res,
        404,
        "Vehicle confirmation not found."
      );
    }

    if (
      confirmation.status !==
      "Approved"
    ) {
      return sendError(
        res,
        409,
        "Actual vehicles can be allocated only after quotation approval."
      );
    }

    if (
      confirmation.requirementId !==
      requirementId
    ) {
      return sendError(
        res,
        400,
        "Confirmation does not belong to the selected vehicle requirement."
      );
    }

    if (
      confirmation.quotationId !==
      quotationId
    ) {
      return sendError(
        res,
        400,
        "Quotation ID does not match the approved confirmation."
      );
    }

    const quotation =
      findQuotation(
        trip,
        quotationId
      );

    if (!quotation) {
      return sendError(
        res,
        404,
        "Approved quotation not found."
      );
    }

    if (
      quotation.requirementId !==
      requirementId
    ) {
      return sendError(
        res,
        400,
        "Quotation does not belong to the selected requirement."
      );
    }

    const duplicateVehicle =
      getAllocatedVehicles(
        trip
      ).some(
        (vehicle) =>
          cleanUpperString(
            vehicle.vehicleNumber
          ) ===
          vehicleNumber
      );

    if (duplicateVehicle) {
      return sendError(
        res,
        409,
        `${vehicleNumber} is already allocated to this order.`
      );
    }

    const allocatedCount =
      getAllocatedVehicles(
        trip
      ).filter(
        (vehicle) =>
          vehicle.requirementId ===
          requirementId
      ).length;

    if (
      allocatedCount >=
      Number(
        requirement.quantity || 1
      )
    ) {
      return sendError(
        res,
        409,
        `Required quantity for this vehicle requirement is ${requirement.quantity}. All vehicle slots are already allocated.`
      );
    }

    const allocatedVehicle = {
      allocationId:
        makeId("ALLOC"),

      requirementId,

      confirmationId,

      quotationId,

      vehicleNumber,

      driver: {
        name:
          cleanString(
            req.body.driver?.name
          ),

        contactNumber:
          cleanString(
            req.body.driver
              ?.contactNumber
          ),
      },

      escort: {
        vehicleNumber:
          cleanUpperString(
            req.body.escort
              ?.vehicleNumber
          ),

        name:
          cleanString(
            req.body.escort?.name
          ),

        contactNumber:
          cleanString(
            req.body.escort
              ?.contactNumber
          ),
      },

      supervisor: {
        name:
          cleanString(
            req.body.supervisor
              ?.name
          ),

        contactNumber:
          cleanString(
            req.body.supervisor
              ?.contactNumber
          ),
      },

      loading: {
        status:
          cleanString(
            req.body.loading
              ?.status
          ) || "Pending",

        pointInDate:
          toDateOrNull(
            req.body.loading
              ?.pointInDate
          ),

        loadingDate:
          toDateOrNull(
            req.body.loading
              ?.loadingDate
          ),

        pointOutDate:
          toDateOrNull(
            req.body.loading
              ?.pointOutDate
          ),

        haltingDays:
          Math.max(
            0,
            toNumber(
              req.body.loading
                ?.haltingDays,
              0
            )
          ),

        remarks:
          cleanString(
            req.body.loading
              ?.remarks
          ),
      },

      unloading: {
        status:
          cleanString(
            req.body.unloading
              ?.status
          ) || "Pending",

        pointInDate:
          toDateOrNull(
            req.body.unloading
              ?.pointInDate
          ),

        unloadingDate:
          toDateOrNull(
            req.body.unloading
              ?.unloadingDate
          ),

        pointOutDate:
          toDateOrNull(
            req.body.unloading
              ?.pointOutDate
          ),

        haltingDays:
          Math.max(
            0,
            toNumber(
              req.body.unloading
                ?.haltingDays,
              0
            )
          ),

        remarks:
          cleanString(
            req.body.unloading
              ?.remarks
          ),
      },

      dailyTracking: [],
    };

    trip.allocatedVehicles.push(
      allocatedVehicle
    );

    const tripAlreadyCompleted =
      [
        "trip complete",
        "trip completed",
        "completed",
      ].includes(
        cleanString(
          trip?.stage
        ).toLowerCase()
      );

    if (!tripAlreadyCompleted) {
      trip.status =
        "Active";

      trip.stage =
        "Tracking";
    }

    await trip.save();

    return sendSuccess(
      res,
      201,
      "Vehicle allocated successfully.",
      trip
    );
  } catch (error) {
    console.error(
      "Allocate Vehicle Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to allocate vehicle.",
      error
    );
  }
};

/* =========================================================
   UPDATE ALLOCATED VEHICLE
   TRACKING INPUT

   PUT
   /api/triporders/:id/allocated-vehicles/:allocationId

   AUTO TRIP COMPLETE:
   When ALL allocated vehicles have
   unloading.status === "Completed",
   the complete order moves to Trip Complete.
========================================================= */

const updateAllocatedVehicle = async (
  req,
  res
) => {
  try {
    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip = result.trip;

    const allocationId =
      cleanString(
        req.params.allocationId
      );

    const vehicle =
      getAllocatedVehicles(
        trip
      ).find(
        (item) =>
          item.allocationId ===
          allocationId
      );

    if (!vehicle) {
      return sendError(
        res,
        404,
        "Allocated vehicle not found."
      );
    }

    /* =====================================================
       VEHICLE NUMBER
    ===================================================== */

    if (
      req.body.vehicleNumber !==
      undefined
    ) {
      const vehicleNumber =
        cleanUpperString(
          req.body.vehicleNumber
        );

      if (!vehicleNumber) {
        return sendError(
          res,
          400,
          "Vehicle number cannot be empty."
        );
      }

      const duplicateVehicle =
        getAllocatedVehicles(
          trip
        ).some(
          (item) =>
            item.allocationId !==
            allocationId &&
            cleanUpperString(
              item.vehicleNumber
            ) === vehicleNumber
        );

      if (duplicateVehicle) {
        return sendError(
          res,
          409,
          `${vehicleNumber} is already allocated to this order.`
        );
      }

      vehicle.vehicleNumber =
        vehicleNumber;
    }

    /* =====================================================
       DRIVER
    ===================================================== */

    if (req.body.driver) {
      vehicle.driver = {
        name:
          cleanString(
            req.body.driver.name ??
            vehicle.driver?.name
          ),

        contactNumber:
          cleanString(
            req.body.driver
              .contactNumber ??
            vehicle.driver
              ?.contactNumber
          ),
      };
    }

    /* =====================================================
       ESCORT
    ===================================================== */

    if (req.body.escort) {
      vehicle.escort = {
        vehicleNumber:
          cleanUpperString(
            req.body.escort
              .vehicleNumber ??
            vehicle.escort
              ?.vehicleNumber
          ),

        name:
          cleanString(
            req.body.escort.name ??
            vehicle.escort?.name
          ),

        contactNumber:
          cleanString(
            req.body.escort
              .contactNumber ??
            vehicle.escort
              ?.contactNumber
          ),
      };
    }

    /* =====================================================
       SUPERVISOR
    ===================================================== */

    if (req.body.supervisor) {
      vehicle.supervisor = {
        name:
          cleanString(
            req.body.supervisor
              .name ??
            vehicle.supervisor
              ?.name
          ),

        contactNumber:
          cleanString(
            req.body.supervisor
              .contactNumber ??
            vehicle.supervisor
              ?.contactNumber
          ),
      };
    }

    /* =====================================================
       LOADING
    ===================================================== */

    if (req.body.loading) {
      const loading =
        req.body.loading;

      if (
        loading.status !==
        undefined
      ) {
        vehicle.loading.status =
          cleanString(
            loading.status
          ) || "Pending";
      }

      if (
        loading.pointInDate !==
        undefined
      ) {
        vehicle.loading.pointInDate =
          toDateOrNull(
            loading.pointInDate
          );
      }

      if (
        loading.loadingDate !==
        undefined
      ) {
        vehicle.loading.loadingDate =
          toDateOrNull(
            loading.loadingDate
          );
      }

      if (
        loading.pointOutDate !==
        undefined
      ) {
        vehicle.loading.pointOutDate =
          toDateOrNull(
            loading.pointOutDate
          );
      }

      if (
        loading.haltingDays !==
        undefined
      ) {
        vehicle.loading.haltingDays =
          Math.max(
            0,
            toNumber(
              loading.haltingDays,
              0
            )
          );
      }

      if (
        loading.remarks !==
        undefined
      ) {
        vehicle.loading.remarks =
          cleanString(
            loading.remarks
          );
      }
    }

    /* =====================================================
       UNLOADING
    ===================================================== */

    if (req.body.unloading) {
      const unloading =
        req.body.unloading;

      if (
        unloading.status !==
        undefined
      ) {
        vehicle.unloading.status =
          cleanString(
            unloading.status
          ) || "Pending";
      }

      if (
        unloading.pointInDate !==
        undefined
      ) {
        vehicle.unloading.pointInDate =
          toDateOrNull(
            unloading.pointInDate
          );
      }

      if (
        unloading.unloadingDate !==
        undefined
      ) {
        vehicle.unloading.unloadingDate =
          toDateOrNull(
            unloading.unloadingDate
          );
      }

      if (
        unloading.pointOutDate !==
        undefined
      ) {
        vehicle.unloading.pointOutDate =
          toDateOrNull(
            unloading.pointOutDate
          );
      }

      if (
        unloading.haltingDays !==
        undefined
      ) {
        vehicle.unloading.haltingDays =
          Math.max(
            0,
            toNumber(
              unloading.haltingDays,
              0
            )
          );
      }

      if (
        unloading.remarks !==
        undefined
      ) {
        vehicle.unloading.remarks =
          cleanString(
            unloading.remarks
          );
      }
    }

    /* =====================================================
       CHECK COMPLETE TRIP
    ===================================================== */

    const allocatedVehicles =
      getAllocatedVehicles(
        trip
      );

    /*
     * Trip becomes completed only when:
     *
     * 1. At least one vehicle exists.
     * 2. EVERY allocated vehicle has
     *    unloading status = Completed.
     */

    const requiredVehicleCount =
      Math.max(
        0,
        Math.floor(
          toNumber(
            trip?.totalVehicles,
            0
          )
        )
      ) ||
      getRequirements(trip).reduce(
        (total, requirement) =>
          total +
          Math.max(
            0,
            Math.floor(
              toNumber(
                requirement?.quantity,
                0
              )
            )
          ),
        0
      );

    const allRequiredVehiclesAllocated =
      requiredVehicleCount > 0 &&
      allocatedVehicles.length >=
        requiredVehicleCount;

    const allAllocatedVehiclesUnloaded =
      allocatedVehicles.length > 0 &&
      allocatedVehicles.every(
        (allocatedVehicle) =>
          cleanString(
            allocatedVehicle
              ?.unloading
              ?.status
          ).toLowerCase() ===
          "completed"
      );

    const allVehiclesCompleted =
      allRequiredVehiclesAllocated &&
      allAllocatedVehiclesUnloaded;

    /* =====================================================
       UPDATE ORDER STAGE
    ===================================================== */

    if (allVehiclesCompleted) {
      trip.stage =
        "Trip Complete";

      trip.status =
        "Completed";
    } else {
      /*
       * Keep order under Tracking while
       * one or more vehicles are still
       * incomplete.
       */

      trip.stage =
        "Tracking";

      trip.status =
        "Active";
    }

    /* =====================================================
       SAVE EVERYTHING TO MONGODB
    ===================================================== */

    await trip.save();

    /* =====================================================
       RESPONSE
    ===================================================== */

    return sendSuccess(
      res,
      200,
      allVehiclesCompleted
        ? "Vehicle details saved successfully. All vehicles have completed unloading and the trip is now complete."
        : "Vehicle details updated successfully.",
      trip
    );
  } catch (error) {
    console.error(
      "Update Allocated Vehicle Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to update vehicle details.",
      error
    );
  }
};


/* =========================================================
   SAVE LR / POD DOCUMENT FOR ALLOCATED VEHICLE
========================================================= */

const saveMovementDocument = async (req, res, documentType) => {
  try {
    const result = await getTripDocument(req.params.id);

    if (result.error) {
      return sendError(res, result.status, result.error);
    }

    const trip = result.trip;
    const allocationId = cleanString(req.params.allocationId);

    const vehicle = getAllocatedVehicles(trip).find(
      (item) => item.allocationId === allocationId
    );

    if (!vehicle) {
      return sendError(res, 404, "Allocated vehicle not found.");
    }

    if (!["lr", "pod"].includes(documentType)) {
      return sendError(res, 400, "Invalid movement document type.");
    }

    const currentDocument = vehicle[documentType] || {};
    const number = cleanString(req.body.number);
    const date = toDateOrNull(req.body.date);
    const status = cleanString(req.body.status) || "Pending";
    const uploadedBy = cleanString(req.body.uploadedBy) || "Tracking";

    if (documentType === "lr" && !number) {
      return sendError(res, 400, "LR Number is required.");
    }

    if (!req.file && !currentDocument.fileName) {
      return sendError(
        res,
        400,
        `${documentType.toUpperCase()} document is required.`
      );
    }

    vehicle[documentType] = {
      number,
      date,
      status,
      documentName:
        cleanString(req.body.documentName) ||
        req.file?.originalname ||
        currentDocument.documentName ||
        `${documentType.toUpperCase()} Document`,
      fileName: req.file?.originalname || currentDocument.fileName || "",
      mimeType: req.file?.mimetype || currentDocument.mimeType || "",
      fileSize: req.file?.size || currentDocument.fileSize || 0,
      fileData: req.file?.buffer || currentDocument.fileData || null,
      uploadedBy,
      uploadedAt: req.file ? new Date() : currentDocument.uploadedAt || new Date(),
    };

    trip.markModified("allocatedVehicles");
    await trip.save();

    const updatedTrip = await TripOrder.findById(trip._id).lean();

    return sendSuccess(
      res,
      200,
      `${documentType.toUpperCase()} saved successfully.`,
      updatedTrip
    );
  } catch (error) {
    console.error(`Save ${documentType.toUpperCase()} Error:`, error);
    return sendError(
      res,
      500,
      `Unable to save ${documentType.toUpperCase()}.`,
      error
    );
  }
};

const saveLrDocument = (req, res) =>
  saveMovementDocument(req, res, "lr");

const savePodDocument = (req, res) =>
  saveMovementDocument(req, res, "pod");

/* =========================================================
   VIEW / DOWNLOAD LR / POD DOCUMENT
========================================================= */

const downloadMovementDocument = async (req, res, documentType) => {
  try {
    if (!isValidMongoId(req.params.id)) {
      return sendError(res, 400, "Invalid order database ID.");
    }

    const trip = await TripOrder.findById(req.params.id).select(
      `+allocatedVehicles.${documentType}.fileData`
    );

    if (!trip) {
      return sendError(res, 404, "Order not found.");
    }

    const allocationId = cleanString(req.params.allocationId);

    const vehicle = getAllocatedVehicles(trip).find(
      (item) => item.allocationId === allocationId
    );

    if (!vehicle) {
      return sendError(res, 404, "Allocated vehicle not found.");
    }

    const document = vehicle[documentType];

    if (!document?.fileData || !document?.fileName) {
      return sendError(
        res,
        404,
        `${documentType.toUpperCase()} document not found.`
      );
    }

    const disposition =
      String(req.query.disposition || "").toLowerCase() === "inline"
        ? "inline"
        : "attachment";

    res.setHeader(
      "Content-Type",
      document.mimeType || "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${String(document.fileName).replace(/"/g, "")}"`
    );

    return res.send(document.fileData);
  } catch (error) {
    console.error(`Download ${documentType.toUpperCase()} Error:`, error);
    return sendError(
      res,
      500,
      `Unable to load ${documentType.toUpperCase()} document.`,
      error
    );
  }
};

const downloadLrDocument = (req, res) =>
  downloadMovementDocument(req, res, "lr");

const downloadPodDocument = (req, res) =>
  downloadMovementDocument(req, res, "pod");

const addDailyTracking = async (
  req,
  res
) => {
  try {
    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip =
      result.trip;

    const allocationId =
      cleanString(
        req.params.allocationId
      );

    const vehicle =
      getAllocatedVehicles(
        trip
      ).find(
        (item) =>
          item.allocationId ===
          allocationId
      );

    if (!vehicle) {
      return sendError(
        res,
        404,
        "Allocated vehicle not found."
      );
    }

    const history =
      Array.isArray(
        vehicle.dailyTracking
      )
        ? vehicle.dailyTracking
        : [];

    const previousEntry =
      history.length > 0
        ? history[
        history.length - 1
        ]
        : null;

    const yesterdayKm =
      req.body.yesterdayKm !==
        undefined
        ? Math.max(
          0,
          toNumber(
            req.body.yesterdayKm,
            0
          )
        )
        : Math.max(
          0,
          toNumber(
            previousEntry
              ?.todayKm,
            0
          )
        );

    const todayKm =
      Math.max(
        0,
        toNumber(
          req.body.todayKm,
          yesterdayKm
        )
      );

    const runningKm =
      req.body.runningKm !==
        undefined
        ? Math.max(
          0,
          toNumber(
            req.body.runningKm,
            0
          )
        )
        : Math.max(
          0,
          todayKm -
          yesterdayKm
        );

    const yesterdayLocation =
      req.body
        .yesterdayLocation !==
        undefined
        ? cleanString(
          req.body
            .yesterdayLocation
        )
        : cleanString(
          previousEntry
            ?.currentLocation
        );

    const currentLocation =
      cleanString(
        req.body.currentLocation
      );

    const day =
      req.body.day !==
        undefined
        ? Math.max(
          0,
          toNumber(
            req.body.day,
            0
          )
        )
        : history.length + 1;

    const tracking = {
      trackingId:
        makeId("TRACK"),

      date:
        toDateOrNull(
          req.body.date
        ) ||
        new Date(),

      day,

      yesterdayKm,

      todayKm,

      runningKm,

      yesterdayLocation,

      currentLocation,

      latitude:
        toNullableNumber(
          req.body.latitude
        ),

      longitude:
        toNullableNumber(
          req.body.longitude
        ),

      speed:
        Math.max(
          0,
          toNumber(
            req.body.speed,
            0
          )
        ),

      status:
        cleanString(
          req.body.status
        ) || "Idle",

      remarks:
        cleanString(
          req.body.remarks
        ),

      updatedBy:
        cleanString(
          req.body.updatedBy
        ),

      updatedAt:
        new Date(),
    };

    vehicle.dailyTracking.push(
      tracking
    );

    trip.status =
      "Active";

    trip.stage =
      "Tracking";

    await trip.save();

    return sendSuccess(
      res,
      201,
      "Daily vehicle tracking updated successfully.",
      trip
    );
  } catch (error) {
    console.error(
      "Add Daily Tracking Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to add daily tracking.",
      error
    );
  }
};



/* =========================================================
   UPDATE ROUTE LOCATIONS
   TRACKING INPUT

   PUT /api/triporders/:id/route-locations
========================================================= */

const updateRouteLocations = async (
  req,
  res
) => {
  try {
    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip = result.trip;

    if (
      !Array.isArray(
        req.body.routeLocations
      )
    ) {
      return sendError(
        res,
        400,
        "Route locations must be an array."
      );
    }

    const cleanedLocations =
      req.body.routeLocations
        .map(cleanString)
        .filter(Boolean);

    // Remove duplicate locations while preserving entered order.
    const seen = new Set();
    const routeLocations =
      cleanedLocations.filter(
        (location) => {
          const key =
            location.toLowerCase();

          if (seen.has(key)) {
            return false;
          }

          seen.add(key);
          return true;
        }
      );

    trip.routeLocations =
      routeLocations;

    trip.markModified(
      "routeLocations"
    );

    await trip.save();

    const updatedTrip =
      await TripOrder.findById(
        trip._id
      ).lean();

    return sendSuccess(
      res,
      200,
      "Route locations saved successfully.",
      updatedTrip
    );
  } catch (error) {
    console.error(
      "Update Route Locations Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to save route locations.",
      error
    );
  }
};

/* =========================================================
   PLACE ORDER
   KEY ACCOUNT -> TRACKING
========================================================= */

/* =========================================================
   PLACE ORDER
   KEY ACCOUNT -> TRACKING

   FLOW:
   Order Approval Approved
          ↓
      Place Order
          ↓
       Tracking

   IMPORTANT:
   These are NOT mandatory before Tracking:
   - PO Document
   - Traffic Quotation
   - Quotation Approval
   - Vendor Finalization
   - Vehicle Allocation
========================================================= */

const placeOrder = async (req, res) => {
  try {
    /* =====================================================
       GET ORDER
    ===================================================== */

    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip = result.trip;

    /* =====================================================
       CHECK ONLY ORDER APPROVAL

       We intentionally DO NOT check:
       - PO document
       - traffic quotation
       - vehicle confirmation
       - vendor finalization
       - allocated vehicles
    ===================================================== */

    const orderApprovalStatus =
      cleanString(
        trip?.orderApproval?.status
      )
        .trim()
        .toLowerCase();

    if (
      orderApprovalStatus !==
      "approved"
    ) {
      return sendError(
        res,
        400,
        "Order Approval must be approved before placing the order."
      );
    }

    /* =====================================================
       PLACED BY
    ===================================================== */

    const placedBy =
      cleanString(
        req.body?.orderPlaced?.placedBy
      ) ||
      cleanString(
        req.body?.placedBy
      ) ||
      "Key Account";

    /* =====================================================
       SAVE ORDER PLACED
    ===================================================== */

    trip.orderPlaced = {
      status: "Completed",

      placedBy,

      placedAt:
        new Date(),
    };

    /* =====================================================
       MOVE ORDER TO TRACKING

       This is the important part.

       Even when:
       allocatedVehicles = []

       the order is now officially in Tracking.
    ===================================================== */

    trip.stage =
      "Tracking";

    trip.status =
      "Tracking";

    /* =====================================================
       MARK NESTED OBJECT MODIFIED
    ===================================================== */

    trip.markModified(
      "orderPlaced"
    );

    /* =====================================================
       SAVE DATABASE
    ===================================================== */

    await trip.save();

    /* =====================================================
       GET FRESH SAVED ORDER
    ===================================================== */

    const updatedTrip =
      await TripOrder
        .findById(
          trip._id
        )
        .lean();

    /* =====================================================
       RESPONSE
    ===================================================== */

    return sendSuccess(
      res,
      200,
      "Order placed successfully and moved to Tracking.",
      updatedTrip
    );
  } catch (error) {
    console.error(
      "Place Order Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to place order.",
      error
    );
  }
};

const deleteTrip = async (
  req,
  res
) => {
  try {
    const result =
      await getTripDocument(
        req.params.id
      );

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip =
      result.trip;

    const trackingStarted =
      getAllocatedVehicles(
        trip
      ).some(
        (vehicle) =>
          Array.isArray(
            vehicle.dailyTracking
          ) &&
          vehicle.dailyTracking
            .length > 0
      );

    if (
      trackingStarted
    ) {
      return sendError(
        res,
        409,
        "Order cannot be deleted after vehicle tracking has started."
      );
    }

    await TripOrder
      .findByIdAndDelete(
        trip._id
      );

    return sendSuccess(
      res,
      200,
      "Order deleted successfully.",
      {
        _id:
          trip._id,

        tripId:
          trip.tripId,
      }
    );
  } catch (error) {
    console.error(
      "Delete Trip Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to delete order.",
      error
    );
  }
};

module.exports = {
  saveLrDocument,
  downloadLrDocument,
  savePodDocument,
  downloadPodDocument,

  createTrip,
  createCraneTrip,
  downloadCraneDocument,
  getAllTrips,
  getTripById,
  getTripByTripId,
  updateTrip,

  saveOrderFinalization,
  savePoDocument,
  downloadPoDocument,

  placeOrder,

  approveOrder,

  addTrafficQuotation,

  confirmVehicleQuotation,

  allocateVehicle,
  updateAllocatedVehicle,
  addDailyTracking,
  updateRouteLocations,

  deleteTrip,
};
