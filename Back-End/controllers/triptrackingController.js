const mongoose =
  require("mongoose");

const Triptracking =
  require(
    "../models/Triptracking"
  );


/* =========================================
   HELPERS
========================================= */

const cleanText = (
  value
) =>
  String(
    value ?? ""
  ).trim();


const numberOrZero = (
  value
) => {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? Math.max(
        number,
        0
      )
    : 0;
};


const nullableNumber = (
  value
) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
};


const dateOrNull = (
  value
) => {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};


const cleanRouteLocations = (
  locations
) => {
  if (
    !Array.isArray(
      locations
    )
  ) {
    return [];
  }

  const seen =
    new Set();

  return locations
    .map(
      (location) => {
        if (
          location &&
          typeof location ===
            "object"
        ) {
          return cleanText(
            location.name ||
            location.location ||
            location.city ||
            location.place ||
            location.label
          );
        }

        return cleanText(
          location
        );
      }
    )
    .filter(Boolean)
    .filter(
      (location) => {
        const key =
          location.toLowerCase();

        if (
          seen.has(
            key
          )
        ) {
          return false;
        }

        seen.add(
          key
        );

        return true;
      }
    );
};


/* =========================================
   NORMALIZE VEHICLE
========================================= */

const normalizeVehicle = (
  vehicle = {},
  tripId,
  index
) => ({
  vehicleSubId:
    cleanText(
      vehicle.vehicleSubId
    ) ||
    `${tripId}-V${index + 1}`,

  vehicleNumber:
    cleanText(
      vehicle.vehicleNumber
    ).toUpperCase(),

  currentPosition:
    cleanText(
      vehicle.currentPosition ??
      vehicle.currentLocation
    ),

  yesterdayPosition:
    cleanText(
      vehicle.yesterdayPosition
    ),

  runningKm:
    numberOrZero(
      vehicle.runningKm
    ),

  status:
    vehicle.status ||
    "Moving",

  currentDay:
    nullableNumber(
      vehicle.currentDay
    ),

  latitude:
    nullableNumber(
      vehicle.latitude
    ),

  longitude:
    nullableNumber(
      vehicle.longitude
    ),

  speed:
    numberOrZero(
      vehicle.speed
    ),

  lastUpdated:
    vehicle.lastUpdated
      ? dateOrNull(
          vehicle.lastUpdated
        ) ||
        new Date()
      : new Date(),


  /* LOADING */

  loadingStatus:
    vehicle.loadingStatus ||
    "Pending",

  loadingPointInDate:
    dateOrNull(
      vehicle.loadingPointInDate
    ),

  loadingDate:
    dateOrNull(
      vehicle.loadingDate
    ),

  loadingPointOutDate:
    dateOrNull(
      vehicle.loadingPointOutDate
    ),

  loadingHaltingDays:
    numberOrZero(
      vehicle.loadingHaltingDays
    ),

  loadingRemarks:
    cleanText(
      vehicle.loadingRemarks
    ),


  /* UNLOADING */

  unloadingStatus:
    vehicle.unloadingStatus ||
    "Pending",

  unloadingPointInDate:
    dateOrNull(
      vehicle.unloadingPointInDate
    ),

  unloadingDate:
    dateOrNull(
      vehicle.unloadingDate
    ),

  unloadingPointOutDate:
    dateOrNull(
      vehicle.unloadingPointOutDate
    ),

  unloadingHaltingDays:
    numberOrZero(
      vehicle.unloadingHaltingDays
    ),

  unloadingRemarks:
    cleanText(
      vehicle.unloadingRemarks
    ),


  /* LR */

  lrNo:
    cleanText(
      vehicle.lrNo
    ),

  lrStatus:
    cleanText(
      vehicle.lrStatus
    ),

  lrRemarks:
    cleanText(
      vehicle.lrRemarks
    ),

  lrSignature:
    cleanText(
      vehicle.lrSignature
    ),


  /* POD */

  podStatus:
    vehicle.podStatus ||
    "Pending",

  courierName:
    cleanText(
      vehicle.courierName ||
      vehicle.podCourierName
    ),

  trackingId:
    cleanText(
      vehicle.trackingId ||
      vehicle.podTrackingId
    ),

  podCourierDate:
    dateOrNull(
      vehicle.podCourierDate
    ),

  podRemarks:
    cleanText(
      vehicle.podRemarks
    ),


  /* DRIVER */

  driverName:
    cleanText(
      vehicle.driverName
    ),

  driverNumber:
    cleanText(
      vehicle.driverNumber ||
      vehicle.driverPhone
    ),
});


const normalizeVehicles = (
  vehicles,
  tripId
) => {
  if (
    !Array.isArray(
      vehicles
    )
  ) {
    return [];
  }

  return vehicles.map(
    (
      vehicle,
      index
    ) =>
      normalizeVehicle(
        vehicle,
        tripId,
        index
      )
  );
};


/* =========================================
   NORMALIZE COMPLETE TRIP
========================================= */

const normalizeTripData = (
  body = {}
) => {
  const tripId =
    cleanText(
      body.tripId
    );

  return {
    tripId,

    customer:
      cleanText(
        body.customer
      ),

    clientContactPerson:
      cleanText(
        body.clientContactPerson ||
        body.customerContactPerson ||
        body.contactPerson
      ),

    clientPhone:
      cleanText(
        body.clientPhone ||
        body.customerPhone ||
        body.contactNumber
      ),

    materialType:
      cleanText(
        body.materialType
      ),

    lsp:
      cleanText(
        body.lsp
      ),

    transporterContactPerson:
      cleanText(
        body.transporterContactPerson ||
        body.lspContactPerson
      ),

    transporterPhone:
      cleanText(
        body.transporterPhone ||
        body.lspPhone
      ),

    origin:
      cleanText(
        body.origin
      ),

    destination:
      cleanText(
        body.destination
      ),

    /* TRIP-LEVEL ROUTE */

    routeLocations:
      cleanRouteLocations(
        body.routeLocations ||
        body.routeStops ||
        body.checkpoints ||
        body.waypoints
      ),

    /* TRIP-LEVEL ESCORT */

    escortVehicleNumber:
      cleanText(
        body.escortVehicleNumber
      ).toUpperCase(),

    escortName:
      cleanText(
        body.escortName
      ),

    escortContactNumber:
      cleanText(
        body.escortContactNumber ||
        body.escortPhone
      ),

    /* TRIP-LEVEL SUPERVISOR */

    supervisorName:
      cleanText(
        body.supervisorName
      ),

    supervisorContact:
      cleanText(
        body.supervisorContact ||
        body.supervisorPhone
      ),

    estimatedTransitDays:
      numberOrZero(
        body.estimatedTransitDays
      ),

    totalKm:
      numberOrZero(
        body.totalKm
      ),

    vehicles:
      normalizeVehicles(
        body.vehicles,
        tripId
      ),

    tripStatus:
      body.tripStatus ||
      "Active",
  };
};


/* =========================================
   VALIDATE
========================================= */

const validateTrip = (
  payload
) => {
  if (!payload.tripId) {
    return "Trip ID is required.";
  }

  if (
    !Array.isArray(
      payload.vehicles
    ) ||
    payload.vehicles.length ===
      0
  ) {
    return "At least one vehicle is required.";
  }

  const invalidVehicle =
    payload.vehicles.some(
      (vehicle) =>
        !vehicle.vehicleNumber
    );

  if (invalidVehicle) {
    return "Vehicle number is required for all vehicles.";
  }

  return "";
};


/* =========================================
   CREATE TRIP
   POST /api/triptracking
========================================= */

const createTrip =
  async (
    req,
    res
  ) => {
    try {
      const normalizedData =
        normalizeTripData(
          req.body
        );

      const validationError =
        validateTrip(
          normalizedData
        );

      if (validationError) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              validationError,
          });
      }

      const existingTrip =
        await Triptracking
          .findOne({
            tripId:
              normalizedData.tripId,
          })
          .lean();

      if (existingTrip) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              `Trip ${normalizedData.tripId} already exists.`,
          });
      }

      const createdTrip =
        await Triptracking.create(
          normalizedData
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Trip created successfully.",
          data:
            createdTrip,
        });

    } catch (error) {
      console.error(
        "Create Trip Error:",
        error
      );

      if (
        error.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Trip ID already exists.",
          });
      }

      if (
        error.name ===
        "ValidationError"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              error.message,
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


/* =========================================
   GET ALL TRIPS
   GET /api/triptracking
========================================= */

const getAllTrips =
  async (
    req,
    res
  ) => {
    try {
      const trips =
        await Triptracking
          .find()
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
          data:
            trips,
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
            "Unable to fetch trips.",
        });
    }
  };


/* =========================================
   GET BY MONGODB ID
========================================= */

const getTripById =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
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
          .findById(
            id
          )
          .lean();

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
          data:
            trip,
        });

    } catch (error) {
      console.error(
        "Get Trip Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to fetch trip.",
        });
    }
  };


/* =========================================
   GET BY TRIP ID
========================================= */

const getTripByTripId =
  async (
    req,
    res
  ) => {
    try {
      const tripId =
        cleanText(
          req.params.tripId
        );

      const trip =
        await Triptracking
          .findOne({
            tripId,
          })
          .lean();

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
          data:
            trip,
        });

    } catch (error) {
      console.error(
        "Get Trip By Trip ID Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to fetch trip.",
        });
    }
  };


/* =========================================
   UPDATE COMPLETE TRIP
   PUT /api/triptracking/:id
========================================= */

const updateTrip =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
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
          .findById(
            id
          );

      if (!existingTrip) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Trip not found.",
          });
      }

      const mergedData = {
        ...existingTrip.toObject(),
        ...req.body,

        tripId:
          existingTrip.tripId,

        vehicles:
          req.body.vehicles ??
          existingTrip.vehicles,
      };

      const normalizedData =
        normalizeTripData(
          mergedData
        );

      const validationError =
        validateTrip(
          normalizedData
        );

      if (validationError) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              validationError,
          });
      }

      const updatedTrip =
        await Triptracking
          .findByIdAndUpdate(
            id,
            {
              $set:
                normalizedData,
            },
            {
              new: true,
              runValidators:
                true,
            }
          );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Trip updated successfully.",
          data:
            updatedTrip,
        });

    } catch (error) {
      console.error(
        "Update Trip Error:",
        error
      );

      if (
        error.name ===
        "ValidationError"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              error.message,
          });
      }

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


/* =========================================
   UPDATE INDIVIDUAL VEHICLE
   PUT /api/triptracking/:tripId/vehicles/:vehicleSubId
========================================= */

const updateVehicle =
  async (
    req,
    res
  ) => {
    try {
      const {
        tripId,
        vehicleSubId,
      } =
        req.params;

      const trip =
        await Triptracking
          .findOne({
            tripId:
              cleanText(
                tripId
              ),
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

      const vehicle =
        trip.vehicles.find(
          (item) =>
            item.vehicleSubId ===
            vehicleSubId
        );

      if (!vehicle) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Vehicle not found in this trip.",
          });
      }

      const textFields = [
        "currentPosition",
        "yesterdayPosition",
        "loadingRemarks",
        "unloadingRemarks",
        "lrNo",
        "lrStatus",
        "lrRemarks",
        "lrSignature",
        "courierName",
        "trackingId",
        "podRemarks",
        "driverName",
        "driverNumber",
      ];

      textFields.forEach(
        (field) => {
          if (
            req.body[field] !==
            undefined
          ) {
            vehicle[field] =
              cleanText(
                req.body[field]
              );
          }
        }
      );

      if (
        req.body.vehicleNumber !==
        undefined
      ) {
        vehicle.vehicleNumber =
          cleanText(
            req.body.vehicleNumber
          ).toUpperCase();
      }

      const plainFields = [
        "status",
        "loadingStatus",
        "unloadingStatus",
        "podStatus",
      ];

      plainFields.forEach(
        (field) => {
          if (
            req.body[field] !==
            undefined
          ) {
            vehicle[field] =
              req.body[field];
          }
        }
      );

      const numberFields = [
        "runningKm",
        "speed",
        "loadingHaltingDays",
        "unloadingHaltingDays",
      ];

      numberFields.forEach(
        (field) => {
          if (
            req.body[field] !==
            undefined
          ) {
            vehicle[field] =
              numberOrZero(
                req.body[field]
              );
          }
        }
      );

      const nullableNumberFields = [
        "currentDay",
        "latitude",
        "longitude",
      ];

      nullableNumberFields.forEach(
        (field) => {
          if (
            req.body[field] !==
            undefined
          ) {
            vehicle[field] =
              nullableNumber(
                req.body[field]
              );
          }
        }
      );

      const dateFields = [
        "loadingPointInDate",
        "loadingDate",
        "loadingPointOutDate",
        "unloadingPointInDate",
        "unloadingDate",
        "unloadingPointOutDate",
        "podCourierDate",
      ];

      dateFields.forEach(
        (field) => {
          if (
            req.body[field] !==
            undefined
          ) {
            vehicle[field] =
              dateOrNull(
                req.body[field]
              );
          }
        }
      );

      vehicle.lastUpdated =
        new Date();

      await trip.save();

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Vehicle details updated successfully.",
          data:
            vehicle,
        });

    } catch (error) {
      console.error(
        "Update Vehicle Error:",
        error
      );

      if (
        error.name ===
        "ValidationError"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              error.message,
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


/* =========================================
   DELETE TRIP
========================================= */

const deleteTrip =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
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

      const deletedTrip =
        await Triptracking
          .findByIdAndDelete(
            id
          );

      if (!deletedTrip) {
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
      console.error(
        "Delete Trip Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to delete trip.",
        });
    }
  };


module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  getTripByTripId,
  updateTrip,
  updateVehicle,
  deleteTrip,
};
