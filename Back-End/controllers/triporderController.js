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

const getTransportReplacementRequests = (trip) =>
  Array.isArray(
    trip?.transportReplacementRequests
  )
    ? trip.transportReplacementRequests
    : [];

const hasTrackingStarted = (trip) =>
  cleanString(
    trip?.orderPlaced?.status
  ).toLowerCase() === "completed" ||
  ["tracking", "trip complete", "trip completed", "completed"].includes(
    cleanString(trip?.stage).toLowerCase()
  ) ||
  getAllocatedVehicles(trip).some(
    (vehicle) =>
      Array.isArray(vehicle?.dailyTracking) &&
      vehicle.dailyTracking.length > 0
  );

const findAllocatedVehicle = (
  trip,
  allocationId
) =>
  getAllocatedVehicles(trip).find(
    (vehicle) =>
      vehicle.allocationId ===
      cleanString(allocationId)
  );

const isDuplicateVehicleNumber = (
  trip,
  vehicleNumber,
  ignoredAllocationId = ""
) =>
  getAllocatedVehicles(trip).some(
    (vehicle) =>
      vehicle.allocationId !==
      cleanString(ignoredAllocationId) &&
      cleanUpperString(
        vehicle.vehicleNumber
      ) === cleanUpperString(vehicleNumber)
  );

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

        status: "Draft",

        stage: "Order Finalization",

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

        status: "Draft",

        stage: "Order Finalization",

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

    /*
     * Editing / requotation keeps the previous rejection.
     * It is cleared only by an explicit approval request.
     */
    if (trip.orderApproval?.status === "Rejected") {
      trip.status = "Rejected";
      trip.stage = "Order Rejected";
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
      /*
       * NEW APPROVAL CYCLE:
       * Request Approval / Resubmit clears the old rejection.
       */
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
        "Order Finalization";

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

    // Approval Management can act only after Key Account explicitly
    // requests approval from Order Finalization.
    if (!trip.orderApproval?.requestedAt) {
      return sendError(
        res,
        409,
        "Order approval has not been requested by Key Account."
      );
    }

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

      /*
       * IMPORTANT:
       * Quotation approval must NOT move the order to Tracking.
       * Traffic must allocate at least one actual transport vehicle,
       * then Key Account must explicitly click Place Order.
       */
      trip.stage =
        "Vendor Finalization";
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

      allocatedSource: "Tracking",

      vehicleStatus: "Active",

      replacementCount: 0,

      replacementHistory: [],

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

/* =========================================================
   TRAFFIC - ALLOCATE ACTUAL VEHICLE AFTER QUOTATION APPROVAL

   POST
   /api/triporders/:id/traffic-allocated-vehicles

   This creates the shared current vehicle BEFORE Tracking.
   The same allocatedVehicles record is read by Traffic,
   Lifecycle, Approval Management and Tracking.
========================================================= */

/* =========================================================
   TRAFFIC - REQUEST TRANSPORT REPLACEMENT

   Does NOT replace the approved transporter immediately.
   Approval Management must approve the request first.
========================================================= */

const requestTransportReplacement = async (req, res) => {
  try {
    const result = await getTripDocument(req.params.id);

    if (result.error) {
      return sendError(res, result.status, result.error);
    }

    const trip = result.trip;

    if (trip.orderApproval?.status !== "Approved") {
      return sendError(
        res,
        409,
        "Order must be approved before requesting a transport replacement."
      );
    }

    if (hasTrackingStarted(trip)) {
      return sendError(
        res,
        409,
        "Transport replacement cannot be requested after the order moves to Tracking."
      );
    }

    const requirementId = cleanString(req.body.requirementId);
    const currentConfirmationId = cleanString(req.body.currentConfirmationId);
    const currentQuotationId = cleanString(req.body.currentQuotationId);
    const proposedTransporter = cleanString(req.body.proposedTransporter);
    const proposedAmount = toNumber(req.body.proposedAmount, -1);
    const quantity = Math.max(1, Math.floor(toNumber(req.body.quantity, 1)));
    const reason = cleanString(req.body.reason);
    const remarks = cleanString(req.body.remarks);
    const requestedBy = cleanString(req.body.requestedBy) || "Traffic Team";

    if (!requirementId || !currentConfirmationId || !currentQuotationId) {
      return sendError(
        res,
        400,
        "Requirement, current confirmation and current quotation are required."
      );
    }

    if (!proposedTransporter) {
      return sendError(res, 400, "New transporter name is required.");
    }

    if (proposedAmount < 0) {
      return sendError(res, 400, "Valid proposed amount is required.");
    }

    if (!reason) {
      return sendError(res, 400, "Replacement reason is required.");
    }

    const requirement = findRequirement(trip, requirementId);
    const currentConfirmation = findConfirmation(trip, currentConfirmationId);
    const currentQuotation = findQuotation(trip, currentQuotationId);

    if (!requirement) {
      return sendError(res, 404, "Vehicle requirement not found.");
    }

    if (
      !currentConfirmation ||
      currentConfirmation.requirementId !== requirementId ||
      currentConfirmation.quotationId !== currentQuotationId ||
      currentConfirmation.status !== "Approved"
    ) {
      return sendError(
        res,
        409,
        "The selected transporter is no longer the current approved transporter."
      );
    }

    if (
      !currentQuotation ||
      currentQuotation.requirementId !== requirementId
    ) {
      return sendError(res, 404, "Current approved quotation not found.");
    }

    const pendingRequest = getTransportReplacementRequests(trip).find(
      (item) =>
        item.requirementId === requirementId &&
        item.currentConfirmationId === currentConfirmationId &&
        item.status === "Pending"
    );

    if (pendingRequest) {
      return sendError(
        res,
        409,
        "A transport replacement request is already pending approval for this transporter."
      );
    }

    trip.transportReplacementRequests.push({
      requestId: makeId("TRR"),
      requirementId,
      currentConfirmationId,
      currentQuotationId,
      currentTransporter: cleanString(currentQuotation.transporter),
      currentAmount: toNumber(currentQuotation.amount, 0),
      proposedTransporter,
      proposedAmount,
      quantity,
      reason,
      remarks,
      requestedBy,
      requestedAt: new Date(),
      status: "Pending",
      reviewedBy: "",
      reviewedAt: null,
      reviewRemarks: "",
      replacementQuotationId: "",
      replacementConfirmationId: "",
    });

    trip.markModified("transportReplacementRequests");
    await trip.save();

    const updatedTrip = await TripOrder.findById(trip._id).lean();

    return sendSuccess(
      res,
      201,
      "Transport replacement request sent to Approval Management.",
      updatedTrip
    );
  } catch (error) {
    console.error("Request Transport Replacement Error:", error);

    return sendError(
      res,
      500,
      "Unable to request transport replacement.",
      error
    );
  }
};

/* =========================================================
   APPROVAL MANAGEMENT - REVIEW TRANSPORT REPLACEMENT

   Approved:
   - old approved confirmation becomes Replaced
   - new quotation is created
   - new quotation receives Approved confirmation
   - replacement request is marked Approved

   Rejected:
   - old approved transporter remains unchanged
========================================================= */

const reviewTransportReplacement = async (req, res) => {
  try {
    const result = await getTripDocument(req.params.id);

    if (result.error) {
      return sendError(res, result.status, result.error);
    }

    const trip = result.trip;
    const requestId = cleanString(req.params.requestId);
    const status = cleanString(req.body.status);
    const reviewedBy = cleanString(req.body.reviewedBy) || "Approval Management";
    const reviewRemarks = cleanString(req.body.reviewRemarks);

    if (!["Approved", "Rejected"].includes(status)) {
      return sendError(
        res,
        400,
        "Transport replacement status must be Approved or Rejected."
      );
    }

    if (status === "Rejected" && !reviewRemarks) {
      return sendError(
        res,
        400,
        "Rejection reason is required."
      );
    }

    const replacementRequest = getTransportReplacementRequests(trip).find(
      (item) => item.requestId === requestId
    );

    if (!replacementRequest) {
      return sendError(
        res,
        404,
        "Transport replacement request not found."
      );
    }

    if (replacementRequest.status !== "Pending") {
      return sendError(
        res,
        409,
        `This transport replacement request is already ${replacementRequest.status.toLowerCase()}.`
      );
    }

    if (hasTrackingStarted(trip)) {
      return sendError(
        res,
        409,
        "Transport replacement cannot be reviewed after the order moves to Tracking."
      );
    }

    const currentConfirmation = findConfirmation(
      trip,
      replacementRequest.currentConfirmationId
    );

    const currentQuotation = findQuotation(
      trip,
      replacementRequest.currentQuotationId
    );

    if (
      !currentConfirmation ||
      !currentQuotation ||
      currentConfirmation.status !== "Approved"
    ) {
      return sendError(
        res,
        409,
        "The original approved transporter has changed. Refresh the order before reviewing this request."
      );
    }

    const now = new Date();

    replacementRequest.status = status;
    replacementRequest.reviewedBy = reviewedBy;
    replacementRequest.reviewedAt = now;
    replacementRequest.reviewRemarks = reviewRemarks;

    if (status === "Approved") {
      const replacementQuotationId = makeId("QUO");
      const replacementConfirmationId = makeId("CONF");

      trip.trafficQuotations.push({
        quotationId: replacementQuotationId,
        requirementId: replacementRequest.requirementId,
        transporter: replacementRequest.proposedTransporter,
        quantity: Math.max(
          1,
          Math.floor(toNumber(replacementRequest.quantity, 1))
        ),
        allocatedBy: replacementRequest.requestedBy || "Traffic Team",
        amount: toNumber(replacementRequest.proposedAmount, 0),
        quotedBy: replacementRequest.requestedBy || "Traffic Team",
        quotedAt: now,
        remarks: `Approved transport replacement for ${replacementRequest.currentTransporter}. ${replacementRequest.remarks || ""
          }`.trim(),
      });

      currentConfirmation.status = "Replaced";
      currentConfirmation.confirmedAt = now;
      currentConfirmation.remarks = `Replaced by ${replacementRequest.proposedTransporter}. ${reviewRemarks || ""
        }`.trim();
      currentConfirmation.rejectionReason = "";

      trip.vehicleConfirmations.push({
        confirmationId: replacementConfirmationId,
        requirementId: replacementRequest.requirementId,
        quotationId: replacementQuotationId,
        status: "Approved",
        confirmedBy: reviewedBy,
        confirmedAt: now,
        remarks: reviewRemarks,
        rejectionReason: "",
      });

      replacementRequest.replacementQuotationId =
        replacementQuotationId;
      replacementRequest.replacementConfirmationId =
        replacementConfirmationId;
    }

    trip.markModified("trafficQuotations");
    trip.markModified("vehicleConfirmations");
    trip.markModified("transportReplacementRequests");

    await trip.save();

    const updatedTrip = await TripOrder.findById(trip._id).lean();

    return sendSuccess(
      res,
      200,
      status === "Approved"
        ? "Transport replacement approved. The new transporter is now current."
        : "Transport replacement rejected. The existing transporter remains current.",
      updatedTrip
    );
  } catch (error) {
    console.error("Review Transport Replacement Error:", error);

    return sendError(
      res,
      500,
      "Unable to review transport replacement.",
      error
    );
  }
};

const allocateTrafficVehicle = async (req, res) => {
  try {
    const result = await getTripDocument(req.params.id);

    if (result.error) {
      return sendError(
        res,
        result.status,
        result.error
      );
    }

    const trip = result.trip;

    if (hasTrackingStarted(trip)) {
      return sendError(
        res,
        409,
        "The order is already in Tracking. Vehicle allocation must now be handled by the Tracking team."
      );
    }

    const requirementId =
      cleanString(req.body.requirementId);

    const confirmationId =
      cleanString(req.body.confirmationId);

    const quotationId =
      cleanString(req.body.quotationId);

    const vehicleNumber =
      cleanUpperString(req.body.vehicleNumber);

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
      confirmation.status !== "Approved"
    ) {
      return sendError(
        res,
        409,
        "Traffic can allocate the actual vehicle only after quotation approval."
      );
    }

    if (
      confirmation.requirementId !==
      requirementId ||
      confirmation.quotationId !==
      quotationId
    ) {
      return sendError(
        res,
        400,
        "Requirement, confirmation and quotation do not match."
      );
    }

    const quotation =
      findQuotation(
        trip,
        quotationId
      );

    if (
      !quotation ||
      quotation.requirementId !==
      requirementId
    ) {
      return sendError(
        res,
        404,
        "Approved quotation not found."
      );
    }

    if (
      isDuplicateVehicleNumber(
        trip,
        vehicleNumber
      )
    ) {
      return sendError(
        res,
        409,
        `${vehicleNumber} is already allocated to this order.`
      );
    }

    const allocatedCount =
      getAllocatedVehicles(trip)
        .filter(
          (vehicle) =>
            vehicle.requirementId ===
            requirementId
        ).length;

    if (
      allocatedCount >=
      Number(requirement.quantity || 1)
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

      allocatedSource:
        "Traffic",

      vehicleStatus:
        "Active",

      replacementCount:
        0,

      replacementHistory:
        [],

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
        status: "Pending",
        pointInDate: null,
        loadingDate: null,
        pointOutDate: null,
        haltingDays: 0,
        remarks: "",
      },

      unloading: {
        status: "Pending",
        pointInDate: null,
        unloadingDate: null,
        pointOutDate: null,
        haltingDays: 0,
        remarks: "",
      },

      dailyTracking: [],
    };

    trip.allocatedVehicles.push(
      allocatedVehicle
    );

    trip.markModified(
      "allocatedVehicles"
    );

    await trip.save();

    const updatedTrip =
      await TripOrder.findById(
        trip._id
      ).lean();

    return sendSuccess(
      res,
      201,
      "Traffic vehicle allocated successfully. The vehicle is now available to Lifecycle, Traffic, Approval Management and Tracking.",
      updatedTrip
    );
  } catch (error) {
    console.error(
      "Traffic Allocate Vehicle Error:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to allocate Traffic vehicle.",
      error
    );
  }
};

/* =========================================================
   COMMON VEHICLE REPLACEMENT
========================================================= */

const replaceAllocatedVehicle = async (
  req,
  res,
  replacementSource
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
      findAllocatedVehicle(
        trip,
        allocationId
      );

    if (!vehicle) {
      return sendError(
        res,
        404,
        "Allocated vehicle not found."
      );
    }

    const trackingStarted =
      hasTrackingStarted(trip);

    if (
      replacementSource === "Traffic" &&
      trackingStarted
    ) {
      return sendError(
        res,
        409,
        "This order has already moved to Tracking. Use Tracking vehicle replacement."
      );
    }

    if (
      replacementSource === "Tracking" &&
      !trackingStarted
    ) {
      return sendError(
        res,
        409,
        "Tracking vehicle replacement is available only after the order moves to Tracking."
      );
    }

    const newVehicleNumber =
      cleanUpperString(
        req.body.newVehicleNumber ??
        req.body.vehicleNumber
      );

    if (!newVehicleNumber) {
      return sendError(
        res,
        400,
        "New vehicle number is required."
      );
    }

    const oldVehicleNumber =
      cleanUpperString(
        vehicle.vehicleNumber
      );

    if (
      oldVehicleNumber ===
      newVehicleNumber
    ) {
      return sendError(
        res,
        400,
        "New vehicle number must be different from the current vehicle number."
      );
    }

    if (
      isDuplicateVehicleNumber(
        trip,
        newVehicleNumber,
        allocationId
      )
    ) {
      return sendError(
        res,
        409,
        `${newVehicleNumber} is already allocated to this order.`
      );
    }

    const reason =
      cleanString(
        req.body.reason
      );

    if (!reason) {
      return sendError(
        res,
        400,
        "Replacement reason is required."
      );
    }

    const oldDriver = {
      name:
        cleanString(
          vehicle.driver?.name
        ),

      contactNumber:
        cleanString(
          vehicle.driver
            ?.contactNumber
        ),
    };

    const newDriver = {
      name:
        cleanString(
          req.body.driver?.name ??
          req.body.newDriver?.name ??
          vehicle.driver?.name
        ),

      contactNumber:
        cleanString(
          req.body.driver
            ?.contactNumber ??
          req.body.newDriver
            ?.contactNumber ??
          vehicle.driver
            ?.contactNumber
        ),
    };

    const replacement = {
      replacementId:
        makeId("REPL"),

      replacementSource,

      oldVehicleNumber,

      newVehicleNumber,

      oldDriver,

      newDriver,

      reason,

      remarks:
        cleanString(
          req.body.remarks
        ),

      replacedBy:
        cleanString(
          req.body.replacedBy
        ) ||
        `${replacementSource} Team`,

      replacedAt:
        new Date(),
    };

    if (
      !Array.isArray(
        vehicle.replacementHistory
      )
    ) {
      vehicle.replacementHistory = [];
    }

    vehicle.replacementHistory.push(
      replacement
    );

    vehicle.vehicleNumber =
      newVehicleNumber;

    vehicle.driver =
      newDriver;

    vehicle.vehicleStatus =
      "Active";

    vehicle.allocatedSource =
      replacementSource;

    vehicle.replacementCount =
      vehicle.replacementHistory.length;

    trip.markModified(
      "allocatedVehicles"
    );

    await trip.save();

    const updatedTrip =
      await TripOrder.findById(
        trip._id
      ).lean();

    return sendSuccess(
      res,
      200,
      `${replacementSource} vehicle replacement completed successfully. Current vehicle is ${newVehicleNumber}.`,
      updatedTrip
    );
  } catch (error) {
    console.error(
      `${replacementSource} Vehicle Replacement Error:`,
      error
    );

    return sendError(
      res,
      500,
      `Unable to replace vehicle from ${replacementSource}.`,
      error
    );
  }
};

/* =========================================================
   TRAFFIC VEHICLE REPLACEMENT
========================================================= */

const replaceTrafficVehicle = (
  req,
  res
) =>
  replaceAllocatedVehicle(
    req,
    res,
    "Traffic"
  );

/* =========================================================
   TRACKING VEHICLE REPLACEMENT
========================================================= */

const replaceTrackingVehicle = (
  req,
  res
) =>
  replaceAllocatedVehicle(
    req,
    res,
    "Tracking"
  );

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
       Vehicle number changes must use a replacement endpoint
       so replacement history is never lost.
    ===================================================== */

    if (
      req.body.vehicleNumber !== undefined &&
      cleanUpperString(req.body.vehicleNumber) !==
      cleanUpperString(vehicle.vehicleNumber)
    ) {
      return sendError(
        res,
        409,
        "Use the Traffic or Tracking vehicle replacement API to change the vehicle number."
      );
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
       STRICT TRIP COMPLETION VALIDATION

       Trip Complete is allowed ONLY when:
       1. Order Finalization / first approval is approved
       2. PO Document is fully completed
       3. Vendor Finalization is completed
       4. Order Placed is completed
       5. All required vehicles are allocated
       6. EVERY allocated vehicle has completed unloading
    ===================================================== */

    const orderFinalizationCompleted =
      cleanString(
        trip?.orderApproval?.status
      ).toLowerCase() === "approved";

    const poDocumentCompleted =
      cleanString(
        trip?.poDocument?.status
      ).toLowerCase() === "completed" &&
      Boolean(cleanString(trip?.poDocument?.poNumber)) &&
      Boolean(trip?.poDocument?.poValidityPeriod) &&
      Boolean(cleanString(trip?.poDocument?.billingGstin)) &&
      Boolean(
        trip?.poDocument?.fileName ||
        trip?.poDocument?.fileUrl ||
        trip?.poDocument?.documentUrl
      );

    const lifecycleQuotations = getQuotations(trip);
    const approvedConfirmations = getConfirmations(trip).filter(
      (confirmation) =>
        cleanString(confirmation?.status).toLowerCase() === "approved"
    );

    const requiredVendorVehicleCount = getRequirements(trip).reduce(
      (total, requirement) =>
        total + Math.max(0, Math.floor(toNumber(requirement?.quantity, 0))),
      0
    );

    const approvedVendorVehicleCount = approvedConfirmations.reduce(
      (total, confirmation) => {
        const confirmationQuotationId = cleanString(
          confirmation?.quotationId || confirmation?.trafficQuotationId
        );

        const quotation = lifecycleQuotations.find((quote) =>
          cleanString(quote?.quotationId || quote?._id || quote?.id) ===
          confirmationQuotationId
        );

        if (!quotation) return total;

        return total + Math.max(
          1,
          Math.floor(
            toNumber(
              quotation?.quantity ??
              quotation?.vehicleQuantity ??
              quotation?.approvedQuantity ??
              quotation?.allocatedQuantity,
              1
            )
          )
        );
      },
      0
    );

    const transportReplacementPending =
      getTransportReplacementRequests(trip).some(
        (request) =>
          cleanString(request?.status).toLowerCase() === "pending"
      );

    const vendorFinalizationCompleted =
      !transportReplacementPending &&
      requiredVendorVehicleCount > 0 &&
      approvedVendorVehicleCount >= requiredVendorVehicleCount;

    const orderPlacedCompleted =
      cleanString(
        trip?.orderPlaced?.status
      ).toLowerCase() === "completed";

    const canCompleteTrip =
      orderFinalizationCompleted &&
      poDocumentCompleted &&
      vendorFinalizationCompleted &&
      orderPlacedCompleted &&
      allRequiredVehiclesAllocated &&
      allAllocatedVehiclesUnloaded;

    if (canCompleteTrip) {
      trip.stage = "Trip Complete";
      trip.status = "Completed";
    } else if (!orderFinalizationCompleted) {
      trip.stage = "Order Finalization";
      trip.status = "Pending";
    } else if (!poDocumentCompleted) {
      trip.stage = "PO Document";
      trip.status = "Pending";
    } else if (!vendorFinalizationCompleted) {
      trip.stage = "Vendor Finalization";
      trip.status = "Pending";
    } else if (!orderPlacedCompleted) {
      trip.stage = "Order Placed";
      trip.status = "Pending";
    } else {
      trip.stage = "Tracking";
      trip.status = "Active";
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
      canCompleteTrip
        ? "Vehicle details saved successfully. All lifecycle stages are complete and every allocated vehicle has completed unloading. The trip is now complete."
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
   SAVE LR / POD / E-WAY BILL DOCUMENT FOR ALLOCATED VEHICLE
========================================================= */

const saveMovementDocument = async (
  req,
  res,
  documentType
) => {
  try {
    if (!isValidMongoId(req.params.id)) {
      return sendError(
        res,
        400,
        "Invalid order database ID."
      );
    }

    if (
      !["lr", "pod", "ewayBill"].includes(
        documentType
      )
    ) {
      return sendError(
        res,
        400,
        "Invalid movement document type."
      );
    }

    /*
      IMPORTANT:
      fileData has select:false in schema.

      We must explicitly load the binary data,
      especially when replacing/updating an
      existing document.
    */
    const trip = await TripOrder.findById(
      req.params.id
    ).select(
      "+allocatedVehicles.lr.fileData +allocatedVehicles.pod.fileData +allocatedVehicles.ewayBill.fileData"
    );

    if (!trip) {
      return sendError(
        res,
        404,
        "Order not found."
      );
    }

    const allocationId = cleanString(
      req.params.allocationId
    );

    const vehicle =
      getAllocatedVehicles(trip).find(
        (item) =>
          item.allocationId === allocationId
      );

    if (!vehicle) {
      return sendError(
        res,
        404,
        "Allocated vehicle not found."
      );
    }

    const currentDocument =
      vehicle[documentType] || {};

    const number = cleanString(
      req.body.number
    );

    const date = toDateOrNull(
      req.body.date
    );

    const validUpto = toDateOrNull(
      req.body.validUpto
    );

    const status =
      cleanString(req.body.status) ||
      "Pending";

    const remarks = cleanString(
      req.body.remarks
    );

    const uploadedBy =
      cleanString(req.body.uploadedBy) ||
      "Tracking";

    /* ================================
       LR VALIDATION
    ================================= */

    if (
      documentType === "lr" &&
      !number
    ) {
      return sendError(
        res,
        400,
        "LR Number is required."
      );
    }

    /* ================================
       POD VALIDATION

       Only POD requires a file.
       E-Way Bill is details only.
    ================================= */

    if (
      documentType === "pod" &&
      !req.file &&
      !currentDocument.fileName
    ) {
      return sendError(
        res,
        400,
        "POD document is required."
      );
    }

    /* ================================
       BUILD DOCUMENT
    ================================= */

    const documentData = {
      number:
        documentType === "pod"
          ? currentDocument.number || ""
          : number,

      date:
        documentType === "lr"
          ? date
          : currentDocument.date || null,

      validUpto:
        documentType === "ewayBill"
          ? validUpto
          : currentDocument.validUpto ||
          null,

      status:
        documentType === "ewayBill"
          ? status
          : currentDocument.status ||
          "Pending",

      remarks:
        documentType === "lr"
          ? remarks
          : currentDocument.remarks || "",

      documentName:
        cleanString(
          req.body.documentName
        ) ||
        req.file?.originalname ||
        currentDocument.documentName ||
        (documentType === "ewayBill"
          ? "E-Way Bill"
          : documentType === "pod"
            ? "POD Document"
            : "LR Document"),

      fileName:
        req.file?.originalname ||
        currentDocument.fileName ||
        "",

      mimeType:
        req.file?.mimetype ||
        currentDocument.mimeType ||
        "",

      fileSize:
        req.file?.size ||
        currentDocument.fileSize ||
        0,

      /*
        IMPORTANT:
        If a new file exists use it.
        Otherwise preserve existing binary.
      */
      fileData:
        req.file?.buffer ||
        currentDocument.fileData ||
        null,

      uploadedBy,

      uploadedAt: req.file
        ? new Date()
        : currentDocument.uploadedAt ||
        null,
    };

    vehicle[documentType] =
      documentData;

    trip.markModified(
      "allocatedVehicles"
    );

    await trip.save();

    /*
      Return normal trip without binary
      file content.
    */
    const updatedTrip =
      await TripOrder.findById(
        trip._id
      ).lean();

    /* Do not send binary movement files back in JSON responses. */
    if (Array.isArray(updatedTrip?.allocatedVehicles)) {
      updatedTrip.allocatedVehicles.forEach((item) => {
        if (item?.lr) item.lr.fileData = undefined;
        if (item?.pod) item.pod.fileData = undefined;
        if (item?.ewayBill) item.ewayBill.fileData = undefined;
      });
    }

    const label =
      documentType === "ewayBill"
        ? "E-Way Bill"
        : documentType.toUpperCase();

    return sendSuccess(
      res,
      200,
      `${label} saved successfully.`,
      updatedTrip
    );
  } catch (error) {
    const label =
      documentType === "ewayBill"
        ? "E-Way Bill"
        : documentType.toUpperCase();

    console.error(
      `Save ${label} Error:`,
      error
    );

    return sendError(
      res,
      500,
      `Unable to save ${label}.`,
      error
    );
  }
};

const saveLrDocument = (req, res) =>
  saveMovementDocument(req, res, "lr");

const savePodDocument = (req, res) =>
  saveMovementDocument(req, res, "pod");

const saveEwayBillDocument = (req, res) =>
  saveMovementDocument(req, res, "ewayBill");

/* =========================================================
   VIEW / DOWNLOAD LR / POD / E-WAY BILL DOCUMENT
========================================================= */

const downloadMovementDocument = async (
  req,
  res,
  documentType
) => {
  try {
    if (!isValidMongoId(req.params.id)) {
      return sendError(
        res,
        400,
        "Invalid order database ID."
      );
    }

    if (!["lr", "pod", "ewayBill"].includes(documentType)) {
      return sendError(
        res,
        400,
        "Invalid movement document type."
      );
    }

    const trip = await TripOrder.findById(
      req.params.id
    ).select(
      "+allocatedVehicles.lr.fileData +allocatedVehicles.pod.fileData +allocatedVehicles.ewayBill.fileData"
    );

    if (!trip) {
      return sendError(res, 404, "Order not found.");
    }

    const allocationId =
      cleanString(req.params.allocationId);

    const vehicle = getAllocatedVehicles(trip).find(
      (item) => item.allocationId === allocationId
    );

    if (!vehicle) {
      return sendError(
        res,
        404,
        "Allocated vehicle not found."
      );
    }

    const document = vehicle[documentType];

    if (!document?.fileData || !document?.fileName) {
      const label =
        documentType === "ewayBill"
          ? "E-Way Bill"
          : documentType.toUpperCase();

      return sendError(
        res,
        404,
        `${label} document not found.`
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

    return res.send(document.fileData);
  } catch (error) {
    const label =
      documentType === "ewayBill"
        ? "E-Way Bill"
        : documentType.toUpperCase();

    console.error(
      `Download ${label} Error:`,
      error
    );

    return sendError(
      res,
      500,
      `Unable to load ${label} document.`,
      error
    );
  }
};

const downloadLrDocument = (req, res) =>
  downloadMovementDocument(req, res, "lr");

const downloadPodDocument = (req, res) =>
  downloadMovementDocument(req, res, "pod");

const downloadEwayBillDocument = (req, res) =>
  downloadMovementDocument(req, res, "ewayBill");

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
   Place Order rule:
   - Order Approval must be Approved.
   - At least ONE transporter quotation must be confirmed.
   - Full Vendor Finalization is NOT mandatory.
   - Remaining transporter confirmations can continue later.
   - Vehicle Allocation is NOT mandatory before Place Order.
   - Actual vehicle allocation happens in Tracking.
========================================================= */

const placeOrder = async (req, res) => {
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

    /* =====================================================
       1. ORDER APPROVAL MUST BE APPROVED
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
       2. AT LEAST ONE TRANSPORTER MUST BE CONFIRMED

       IMPORTANT WORKFLOW:
       - Full Vendor Finalization is NOT required.
       - If 1 or more transporter quotations are approved,
         Place Order is allowed.
       - Remaining vehicle/transporter approvals can continue later.
       - Actual vehicle allocation happens AFTER Place Order
         from the Tracking stage.
       - allocatedVehicles is intentionally NOT checked here.
    ===================================================== */

    const approvedConfirmations =
      getConfirmations(trip).filter(
        (confirmation) =>
          cleanString(
            confirmation?.status
          )
            .trim()
            .toLowerCase() ===
          "approved"
      );

    if (
      approvedConfirmations.length ===
      0
    ) {
      return sendError(
        res,
        409,
        "Confirm at least one transporter before placing the order."
      );
    }

    /* =====================================================
       3. PREVENT DUPLICATE PLACE ORDER
    ===================================================== */

    if (
      cleanString(
        trip?.orderPlaced?.status
      ).toLowerCase() ===
      "completed"
    ) {
      return sendError(
        res,
        409,
        "This order has already been placed and moved to Tracking."
      );
    }

    /* =====================================================
       4. PLACED BY
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
       5. PLACE ORDER

       This action releases the order to Tracking.
       Actual vehicle allocation can then be completed
       from the Tracking module.
    ===================================================== */

    trip.orderPlaced = {
      status: "Completed",

      placedBy,

      placedAt:
        new Date(),
    };

    trip.stage =
      "Tracking";

    trip.status =
      "Tracking";

    trip.markModified(
      "orderPlaced"
    );

    await trip.save();

    const updatedTrip =
      await TripOrder
        .findById(
          trip._id
        )
        .lean();

    return sendSuccess(
      res,
      200,
      `Order placed successfully with ${approvedConfirmations.length} confirmed transporter quotation(s) and moved to Tracking.`,
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

const correctLifecycleDetails = async (req, res) => {
  try {
    const result = await getTripDocument(req.params.id);
    if (result.error) return sendError(res, result.status, result.error);
    const trip = result.trip;
    const body = req.body || {};
    const allowed = ["customer", "contactPerson", "contactNumber", "email", "assignedKam", "origin", "destination", "materialType", "remark", "siteLocation", "period", "dieselScope"];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        trip[key] = cleanString(body[key]);
      }
    }
    if (!cleanString(trip.customer)) return sendError(res, 400, "Customer is required.");
    if (body.placementDate !== undefined) {
      const date = toDateOrNull(body.placementDate);
      if (body.placementDate && !date) return sendError(res, 400, "Invalid placement date.");
      trip.placementDate = date;
    }
    if (body.distance !== undefined) {
      const distance = Number(body.distance);
      if (!Number.isFinite(distance) || distance < 0) return sendError(res, 400, "Invalid distance.");
      trip.distance = distance;
    }
    if (body.orderFinalization && typeof body.orderFinalization === "object") {
      const existing = trip.orderFinalization?.toObject?.() || trip.orderFinalization || {};
      const patch = {};
      for (const key of ["commercialTerms", "deliveryCommitments", "clientConfirmationNotes"]) {
        if (body.orderFinalization[key] !== undefined) patch[key] = cleanString(body.orderFinalization[key]);
      }
      for (const key of ["quotedRate", "finalRate"]) {
        if (body.orderFinalization[key] !== undefined) {
          const val = body.orderFinalization[key];
          const num = val === "" || val === null ? null : Number(val);
          if (num !== null && (!Number.isFinite(num) || num < 0)) return sendError(res, 400, `Invalid ${key}.`);
          patch[key] = num;
        }
      }
      trip.orderFinalization = { ...existing, ...patch };
    }
    if (Array.isArray(body.vehicleRequirements)) {
      if (trip.orderApproval?.status === "Approved" || (trip.trafficQuotations || []).length || (trip.allocatedVehicles || []).length) {
        return sendError(res, 409, "Vehicle requirements cannot be changed after approval, quotation, or allocation. Use the appropriate workflow.");
      }
      if (body.vehicleRequirements.length !== trip.vehicleRequirements.length) return sendError(res, 400, "Requirement rows cannot be added or removed here.");
      const original = new Map(trip.vehicleRequirements.map(r => [r.requirementId, r]));
      for (const reqItem of body.vehicleRequirements) {
        const target = original.get(reqItem.requirementId);
        if (!target) return sendError(res, 400, "Unknown vehicle requirement.");
        for (const key of ["vehicleType", "configuration", "classification"]) {
          if (reqItem[key] !== undefined) target[key] = cleanString(reqItem[key]);
        }
        for (const key of ["quantity", "weight"]) {
          if (reqItem[key] !== undefined) {
            const n = Number(reqItem[key]);
            if (!Number.isFinite(n) || n < (key === "quantity" ? 1 : 0) || (key === "quantity" && !Number.isInteger(n))) return sendError(res, 400, `Invalid ${key}.`);
            target[key] = n;
          }
        }
      }
    }
    if (Array.isArray(body.allocatedVehicles)) {
      const original = new Map((trip.allocatedVehicles || []).map(v => [v.allocationId, v]));
      for (const item of body.allocatedVehicles) {
        const target = original.get(item.allocationId);
        if (!target) return sendError(res, 400, "Unknown allocated vehicle.");
        for (const key of ["driver", "escort", "supervisor"]) {
          if (item[key] && typeof item[key] === "object") {
            const existing = target[key]?.toObject?.() || target[key] || {};
            const next = { ...existing };
            for (const field of key === "escort" ? ["name", "contactNumber", "vehicleNumber"] : ["name", "contactNumber"]) {
              if (item[key][field] !== undefined) next[field] = cleanString(item[key][field]);
            }
            target[key] = next;
          }
        }
      }
    }
    // Deliberately never mutate tripId, approval states, stage, document buffers,
    // tracking history, or vehicle numbers through this correction endpoint.
    await trip.save();
    const updated = await TripOrder.findById(trip._id).lean();
    return sendSuccess(res, 200, "Order corrections saved successfully.", updated);
  } catch (error) {
    console.error("Lifecycle Correction Error:", error);
    return sendError(res, 500, "Unable to save order corrections.", error);
  }
};

module.exports = {
  correctLifecycleDetails,
  saveLrDocument,
  downloadLrDocument,
  savePodDocument,
  downloadPodDocument,
  saveEwayBillDocument,
  downloadEwayBillDocument,

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

  requestTransportReplacement,
  reviewTransportReplacement,

  allocateTrafficVehicle,
  replaceTrafficVehicle,
  replaceTrackingVehicle,

  allocateVehicle,
  updateAllocatedVehicle,
  addDailyTracking,
  updateRouteLocations,

  deleteTrip,
};
