const mongoose = require("mongoose");

const Triptracking =
  require("../models/Triptracking");

/* =========================================================
   HELPERS
========================================================= */

const cleanText = (value) =>
  String(value ?? "").trim();

const numberOrZero = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.max(number, 0)
    : 0;
};

const nullableNumber = (value) => {
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

const positiveInteger = (
  value,
  fallback = 1
) => {
  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number < 1
  ) {
    return fallback;
  }

  return number;
};

const dateOrNull = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};

/* =========================================================
   ROUTE LOCATIONS
========================================================= */

const cleanRouteLocations = (
  locations
) => {
  if (!Array.isArray(locations)) {
    return [];
  }

  const seen = new Set();

  return locations
    .map((location) => {
      if (
        location &&
        typeof location === "object"
      ) {
        return cleanText(
          location.name ||
            location.location ||
            location.city ||
            location.place ||
            location.label
        );
      }

      return cleanText(location);
    })
    .filter(Boolean)
    .filter((location) => {
      const key =
        location.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
};

/* =========================================================
   NORMALIZE VEHICLE
========================================================= */

const normalizeVehicle = (
  vehicle = {},
  tripId,
  index
) => {
  const length =
    nullableNumber(vehicle.length);

  const height =
    nullableNumber(vehicle.height);

  const width =
    nullableNumber(vehicle.width);

  return {
    vehicleSubId:
      cleanText(
        vehicle.vehicleSubId
      ) ||
      `${tripId}-V${index + 1}`,

    vehicleNumber:
      cleanText(
        vehicle.vehicleNumber
      ).toUpperCase(),

    vehicleType:
      cleanText(
        vehicle.vehicleType
      ),

    configurationModel:
      cleanText(
        vehicle.configurationModel
      ),

    movementClassification:
      cleanText(
        vehicle.movementClassification
      ),

    quantity:
      positiveInteger(
        vehicle.quantity,
        1
      ),

    weight:
      numberOrZero(
        vehicle.weight
      ),

    length,

    height,

    width,

    dimensions:
      length !== null &&
      height !== null &&
      width !== null
        ? `${length} × ${height} × ${width} FT`
        : cleanText(
            vehicle.dimensions
          ),

    remark:
      cleanText(
        vehicle.remark
      ),

    currentPosition:
      cleanText(
        vehicle.currentPosition ??
          vehicle.currentLocation
      ),

    currentLocation:
      cleanText(
        vehicle.currentLocation ??
          vehicle.currentPosition
      ),

    driverName:
      cleanText(
        vehicle.driverName
      ),

    driverPhone:
      cleanText(
        vehicle.driverPhone ??
          vehicle.driverNumber
      ),

    driverNumber:
      cleanText(
        vehicle.driverNumber ??
          vehicle.driverPhone
      ),

    vendorName:
      cleanText(
        vehicle.vendorName
      ),

    vendorPhone:
      cleanText(
        vehicle.vendorPhone
      ),

    vehicleStatus:
      cleanText(
        vehicle.vehicleStatus
      ) ||
      "Pending Assignment",

    trackingStatus:
      cleanText(
        vehicle.trackingStatus
      ),

    lastUpdated:
      dateOrNull(
        vehicle.lastUpdated
      ),
  };
};

/* =========================================================
   BUILD TRIP DATA
========================================================= */

const buildTripData = (
  body = {},
  existingTrip = null
) => {
  const tripId =
    cleanText(
      body.tripId ??
        existingTrip?.tripId
    );

  const client =
    cleanText(
      body.client ??
        body.customer ??
        existingTrip?.client ??
        existingTrip?.customer
    );

  const clientContact =
    cleanText(
      body.clientContact ??
        body.clientPhone ??
        existingTrip?.clientContact ??
        existingTrip?.clientPhone
    );

  const cargo =
    cleanText(
      body.cargo ??
        body.materialType ??
        existingTrip?.cargo ??
        existingTrip?.materialType
    );

  const rawVehicles =
    Array.isArray(
      body.vehicles
    )
      ? body.vehicles
      : existingTrip?.vehicles ||
        [];

  const vehicles =
    rawVehicles.map(
      (vehicle, index) =>
        normalizeVehicle(
          vehicle,
          tripId,
          index
        )
    );

  const movementType =
    cleanText(
      body.movementType ??
        existingTrip?.movementType
    );

  return {
    tripId,

    movementType,

    /* CLIENT */

    companyName:
      cleanText(
        body.companyName ??
          existingTrip?.companyName
      ),

    client,

    customer: client,

    clientContact,

    clientPhone:
      clientContact,

    clientEmail:
      cleanText(
        body.clientEmail ??
          existingTrip?.clientEmail
      ).toLowerCase(),

    assignedKam:
      cleanText(
        body.assignedKam ??
          existingTrip?.assignedKam
      ),

    /* DATES */

    enquiryDate:
      body.enquiryDate !==
      undefined
        ? dateOrNull(
            body.enquiryDate
          )
        : existingTrip
            ?.enquiryDate,

    placementDate:
      body.placementDate !==
      undefined
        ? dateOrNull(
            body.placementDate
          )
        : existingTrip
            ?.placementDate,

    deploymentDate:
      body.deploymentDate !==
      undefined
        ? dateOrNull(
            body.deploymentDate
          )
        : existingTrip
            ?.deploymentDate,

    loadingDate:
      body.loadingDate !==
      undefined
        ? dateOrNull(
            body.loadingDate
          )
        : existingTrip
            ?.loadingDate,

    /* ROUTE */

    origin:
      cleanText(
        body.origin ??
          existingTrip?.origin
      ),

    destination:
      cleanText(
        body.destination ??
          existingTrip?.destination
      ),

    estimatedDistance:
      numberOrZero(
        body.estimatedDistance ??
          existingTrip
            ?.estimatedDistance
      ),

    totalKm:
      numberOrZero(
        body.totalKm ??
          existingTrip?.totalKm
      ),

    routeLocations:
      body.routeLocations !==
      undefined
        ? cleanRouteLocations(
            body.routeLocations
          )
        : cleanRouteLocations(
            existingTrip
              ?.routeLocations
          ),

    /* CARGO */

    cargo,

    materialType: cargo,

    weight:
      numberOrZero(
        body.weight ??
          existingTrip?.weight
      ),

    length:
      body.length !== undefined
        ? nullableNumber(
            body.length
          )
        : existingTrip?.length ??
          null,

    height:
      body.height !== undefined
        ? nullableNumber(
            body.height
          )
        : existingTrip?.height ??
          null,

    width:
      body.width !== undefined
        ? nullableNumber(
            body.width
          )
        : existingTrip?.width ??
          null,

    remark:
      cleanText(
        body.remark ??
          existingTrip?.remark
      ),

    /* INTERCARTING */

    siteLocation:
      cleanText(
        body.siteLocation ??
          existingTrip
            ?.siteLocation
      ),

    period:
      cleanText(
        body.period ??
          existingTrip?.period
      ),

    dieselScope:
      cleanText(
        body.dieselScope ??
          existingTrip
            ?.dieselScope
      ),

    totalQuantity:
      numberOrZero(
        body.totalQuantity ??
          existingTrip
            ?.totalQuantity
      ),

    /* CRANE */

    requiredVehicles:
      numberOrZero(
        body.requiredVehicles ??
          existingTrip
            ?.requiredVehicles
      ),

    primaryVehicleType:
      cleanText(
        body.primaryVehicleType ??
          existingTrip
            ?.primaryVehicleType
      ),

    vehicles,

    /* LIFECYCLE */

    orderStage:
      cleanText(
        body.orderStage ??
          body.stage ??
          existingTrip
            ?.orderStage
      ) ||
      "Client Enquiry",

    responsibleTeam:
      cleanText(
        body.responsibleTeam ??
          body.role ??
          existingTrip
            ?.responsibleTeam
      ) ||
      "Key Account Management Team",

    lifecycleStep:
      numberOrZero(
        body.lifecycleStep ??
          existingTrip
            ?.lifecycleStep
      ),

    /* ENQUIRY */

    requirement:
      cleanText(
        body.requirement ??
          existingTrip
            ?.requirement
      ),

    enquiryRemarks:
      cleanText(
        body.enquiryRemarks ??
          existingTrip
            ?.enquiryRemarks
      ),

    /* ORDER FINALIZATION */

    quotedRate:
      numberOrZero(
        body.quotedRate ??
          existingTrip
            ?.quotedRate
      ),

    negotiatedRate:
      numberOrZero(
        body.negotiatedRate ??
          existingTrip
            ?.negotiatedRate
      ),

    finalRate:
      numberOrZero(
        body.finalRate ??
          existingTrip?.finalRate
      ),

    agreedRate:
      numberOrZero(
        body.agreedRate ??
          existingTrip?.agreedRate
      ),

    paymentTerms:
      cleanText(
        body.paymentTerms ??
          existingTrip
            ?.paymentTerms
      ),

    pricingRemarks:
      cleanText(
        body.pricingRemarks ??
          existingTrip
            ?.pricingRemarks
      ),

    commercialTerms:
      cleanText(
        body.commercialTerms ??
          body
            .commercialTermsPaymentSlas ??
          existingTrip
            ?.commercialTerms
      ),

    deliveryCommitments:
      cleanText(
        body.deliveryCommitments ??
          body
            .deliveryCommitmentsSlas ??
          existingTrip
            ?.deliveryCommitments
      ),

    clientConfirmationNotes:
      cleanText(
        body
          .clientConfirmationNotes ??
          existingTrip
            ?.clientConfirmationNotes
      ),

    orderReferenceNumber:
      cleanText(
        body
          .orderReferenceNumber ??
          body.orderReference ??
          existingTrip
            ?.orderReferenceNumber
      ),

    orderCount:
      numberOrZero(
        body.orderCount ??
          existingTrip?.orderCount
      ),

    responsibleKam:
      cleanText(
        body.responsibleKam ??
          body.assignedKam ??
          existingTrip
            ?.responsibleKam ??
          existingTrip
            ?.assignedKam
      ),

    commercialRemarks:
      cleanText(
        body.commercialRemarks ??
          body.pricingRemarks ??
          existingTrip
            ?.commercialRemarks ??
          existingTrip
            ?.pricingRemarks
      ),

    /* APPROVAL */

    approvalRequested:
      body.approvalRequested !==
      undefined
        ? Boolean(
            body.approvalRequested
          )
        : Boolean(
            existingTrip
              ?.approvalRequested
          ),

    approvalStatus:
      cleanText(
        body.approvalStatus ??
          existingTrip
            ?.approvalStatus
      ) ||
      "Not Requested",

    approvalRequestedAt:
      body.approvalRequestedAt !==
      undefined
        ? dateOrNull(
            body.approvalRequestedAt
          )
        : existingTrip
            ?.approvalRequestedAt ??
          null,

    approvalReviewedAt:
      body.approvalReviewedAt !==
      undefined
        ? dateOrNull(
            body.approvalReviewedAt
          )
        : existingTrip
            ?.approvalReviewedAt ??
          null,

    approvalReviewedBy:
      cleanText(
        body.approvalReviewedBy ??
          existingTrip
            ?.approvalReviewedBy
      ),

    approvalRejectionReason:
      cleanText(
        body
          .approvalRejectionReason ??
          body.rejectionReason ??
          existingTrip
            ?.approvalRejectionReason
      ),

    /* PO */

    poNumber:
      cleanText(
        body.poNumber ??
          existingTrip?.poNumber
      ),

    poDate:
      body.poDate !== undefined
        ? dateOrNull(
            body.poDate
          )
        : existingTrip?.poDate,

    poDocumentName:
      cleanText(
        body.poDocumentName ??
          existingTrip
            ?.poDocumentName
      ),

    poDocumentUrl:
      cleanText(
        body.poDocumentUrl ??
          existingTrip
            ?.poDocumentUrl
      ),

    documentationRemarks:
      cleanText(
        body
          .documentationRemarks ??
          existingTrip
            ?.documentationRemarks
      ),

    /* VENDOR */

    vendor:
      cleanText(
        body.vendor ??
          body.vendorName ??
          existingTrip?.vendor ??
          existingTrip?.vendorName
      ),

    vendorName:
      cleanText(
        body.vendorName ??
          body.vendor ??
          existingTrip
            ?.vendorName ??
          existingTrip?.vendor
      ),

    vendorContact:
      cleanText(
        body.vendorContact ??
          existingTrip
            ?.vendorContact
      ),

    vendorRate:
      numberOrZero(
        body.vendorRate ??
          existingTrip
            ?.vendorRate
      ),

    vendorRemarks:
      cleanText(
        body.vendorRemarks ??
          existingTrip
            ?.vendorRemarks
      ),

    /* COMPLETION */

    instructions:
      cleanText(
        body.instructions ??
          existingTrip
            ?.instructions
      ),

    completionRemarks:
      cleanText(
        body.completionRemarks ??
          existingTrip
            ?.completionRemarks
      ),

    tripStatus:
      cleanText(
        body.tripStatus ??
          existingTrip
            ?.tripStatus
      ) ||
      "Active",
  };
};

/* =========================================================
   CREATE TRIP
========================================================= */

const createTrip = async (
  req,
  res
) => {
  try {
    const tripData =
      buildTripData(req.body);

    if (!tripData.tripId) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Trip ID is required.",
        });
    }

    if (
      !tripData.movementType
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Movement Type is required.",
        });
    }

    const existingTrip =
      await Triptracking.findOne({
        tripId:
          tripData.tripId,
      });

    if (existingTrip) {
      return res
        .status(409)
        .json({
          success: false,
          message:
            `Trip ID ${tripData.tripId} already exists.`,
        });
    }

    const trip =
      await Triptracking.create(
        tripData
      );

    return res
      .status(201)
      .json({
        success: true,
        message:
          "Trip created successfully.",
        data: trip,
      });
  } catch (error) {
    console.error(
      "Create Trip Error:",
      error
    );

    if (error.code === 11000) {
      return res
        .status(409)
        .json({
          success: false,
          message:
            "Trip ID already exists.",
        });
    }

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message ||
          "Unable to create trip.",
      });
  }
};

/* =========================================================
   GET ALL TRIPS
========================================================= */

const getAllTrips = async (
  req,
  res
) => {
  try {
    const trips =
      await Triptracking
        .find({})
        .sort({
          createdAt: -1,
        })
        .lean();

    return res
      .status(200)
      .json({
        success: true,
        count:
          trips.length,
        data: trips,
      });
  } catch (error) {
    console.error(
      "Get Trips Error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message ||
          "Unable to load trips.",
      });
  }
};

/* =========================================================
   GET BY MONGODB ID
========================================================= */

const getTripById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId
        .isValid(id)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid MongoDB trip ID.",
        });
    }

    const trip =
      await Triptracking
        .findById(id);

    if (!trip) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Trip not found.",
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        data: trip,
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message ||
          "Unable to load trip.",
      });
  }
};

/* =========================================================
   GET USING TRIP ID
========================================================= */

const getTripByTripId =
  async (req, res) => {
    try {
      const tripId =
        cleanText(
          req.params.tripId
        );

      const trip =
        await Triptracking
          .findOne({
            tripId,
          });

      if (!trip) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Trip not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          data: trip,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message ||
            "Unable to load trip.",
        });
    }
  };

/* =========================================================
   UPDATE COMPLETE TRIP
========================================================= */

const updateTrip = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId
        .isValid(id)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid MongoDB trip ID.",
        });
    }

    const existingTrip =
      await Triptracking
        .findById(id);

    if (!existingTrip) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Trip not found.",
        });
    }

    const tripData =
      buildTripData(
        req.body,
        existingTrip
      );

    if (
      tripData.tripId !==
      existingTrip.tripId
    ) {
      const duplicate =
        await Triptracking
          .findOne({
            tripId:
              tripData.tripId,

            _id: {
              $ne: id,
            },
          });

      if (duplicate) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Trip ID already exists.",
          });
      }
    }

    Object.assign(
      existingTrip,
      tripData
    );

    await existingTrip.save();

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Trip updated successfully.",
        data:
          existingTrip,
      });
  } catch (error) {
    console.error(
      "Update Trip Error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message ||
          "Unable to update trip.",
      });
  }
};

/* =========================================================
   UPDATE VEHICLE
========================================================= */

const updateVehicle = async (
  req,
  res
) => {
  try {
    const {
      tripId,
      vehicleSubId,
    } = req.params;

    const trip =
      await Triptracking
        .findOne({
          tripId,
        });

    if (!trip) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Trip not found.",
        });
    }

    const vehicleIndex =
      trip.vehicles.findIndex(
        (vehicle) =>
          vehicle.vehicleSubId ===
          vehicleSubId
      );

    if (
      vehicleIndex === -1
    ) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Vehicle not found.",
        });
    }

    const oldVehicle =
      trip.vehicles[
        vehicleIndex
      ].toObject();

    const mergedVehicle = {
      ...oldVehicle,
      ...req.body,
    };

    const normalizedVehicle =
      normalizeVehicle(
        mergedVehicle,
        trip.tripId,
        vehicleIndex
      );

    Object.assign(
      trip.vehicles[
        vehicleIndex
      ],
      normalizedVehicle
    );

    trip.vehicles[
      vehicleIndex
    ].lastUpdated =
      new Date();

    await trip.save();

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Vehicle updated successfully.",
        data: trip,
      });
  } catch (error) {
    console.error(
      "Update Vehicle Error:",
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

/* =========================================================
   DELETE TRIP
========================================================= */

const deleteTrip = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId
        .isValid(id)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid MongoDB trip ID.",
        });
    }

    const trip =
      await Triptracking
        .findByIdAndDelete(
          id
        );

    if (!trip) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Trip not found.",
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Trip deleted successfully.",
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message ||
          "Unable to delete trip.",
      });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  getTripByTripId,
  updateTrip,
  updateVehicle,
  deleteTrip,
};