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
) => {
  return String(
    value ?? ""
  ).trim();
};


const numberOrZero = (
  value
) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const result =
    Number(value);

  return Number.isFinite(
    result
  )
    ? result
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

  const result =
    Number(value);

  return Number.isFinite(
    result
  )
    ? result
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

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};


/* =========================================
   NORMALIZE ONE VEHICLE
========================================= */

const normalizeVehicle = (
  vehicle,
  tripId,
  index
) => {
  return {
    /* =====================================
       BASIC TRACKING
    ===================================== */

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


    /* =====================================
       LOADING
    ===================================== */

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


    /* =====================================
       UNLOADING
    ===================================== */

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


    /* =====================================
       LR
    ===================================== */

    lrNo:
      cleanText(
        vehicle.lrNo
      ),

    lrRemarks:
      cleanText(
        vehicle.lrRemarks
      ),

    lrSignature:
      cleanText(
        vehicle.lrSignature
      ),


    /* =====================================
       POD
    ===================================== */

    podStatus:
      vehicle.podStatus ||
      "Pending",

    podCourierDate:
      dateOrNull(
        vehicle.podCourierDate
      ),

    podRemarks:
      cleanText(
        vehicle.podRemarks
      ),
  };
};


/* =========================================
   NORMALIZE VEHICLES
========================================= */

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
   NORMALIZE TRIP
========================================= */

const normalizeTripData = (
  body
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

    materialType:
      cleanText(
        body.materialType
      ),

    lsp:
      cleanText(
        body.lsp
      ),

    origin:
      cleanText(
        body.origin
      ),

    destination:
      cleanText(
        body.destination
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
   CREATE TRIP
   POST /api/triptracking
========================================= */

const createTrip =
  async (
    req,
    res
  ) => {
    try {
      const tripId =
        cleanText(
          req.body.tripId
        );


      if (!tripId) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Trip ID is required.",
          });
      }


      if (
        !Array.isArray(
          req.body.vehicles
        ) ||
        req.body.vehicles.length ===
          0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "At least one vehicle is required.",
          });
      }


      const invalidVehicle =
        req.body.vehicles.some(
          (vehicle) =>
            !cleanText(
              vehicle.vehicleNumber
            )
        );


      if (invalidVehicle) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Vehicle number is required for all vehicles.",
          });
      }


      const existingTrip =
        await Triptracking
          .findOne({
            tripId,
          })
          .lean();


      if (existingTrip) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              `Trip ${tripId} already exists.`,
          });
      }


      const normalizedData =
        normalizeTripData(
          req.body
        );


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
          });


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
        ...existingTrip
          .toObject(),

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


      const updatedTrip =
        await Triptracking
          .findByIdAndUpdate(
            id,
            normalizedData,
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


      /* =====================================
         BASIC TRACKING
      ===================================== */

      if (
        req.body.vehicleNumber !==
        undefined
      ) {
        vehicle.vehicleNumber =
          cleanText(
            req.body.vehicleNumber
          ).toUpperCase();
      }


      if (
        req.body.currentPosition !==
        undefined
      ) {
        vehicle.currentPosition =
          cleanText(
            req.body.currentPosition
          );
      }


      if (
        req.body.yesterdayPosition !==
        undefined
      ) {
        vehicle.yesterdayPosition =
          cleanText(
            req.body.yesterdayPosition
          );
      }


      if (
        req.body.runningKm !==
        undefined
      ) {
        vehicle.runningKm =
          numberOrZero(
            req.body.runningKm
          );
      }


      if (
        req.body.status !==
        undefined
      ) {
        vehicle.status =
          req.body.status;
      }


      if (
        req.body.currentDay !==
        undefined
      ) {
        vehicle.currentDay =
          nullableNumber(
            req.body.currentDay
          );
      }


      if (
        req.body.latitude !==
        undefined
      ) {
        vehicle.latitude =
          nullableNumber(
            req.body.latitude
          );
      }


      if (
        req.body.longitude !==
        undefined
      ) {
        vehicle.longitude =
          nullableNumber(
            req.body.longitude
          );
      }


      if (
        req.body.speed !==
        undefined
      ) {
        vehicle.speed =
          numberOrZero(
            req.body.speed
          );
      }


      /* =====================================
         LOADING
      ===================================== */

      if (
        req.body.loadingStatus !==
        undefined
      ) {
        vehicle.loadingStatus =
          req.body.loadingStatus;
      }


      if (
        req.body.loadingPointInDate !==
        undefined
      ) {
        vehicle.loadingPointInDate =
          dateOrNull(
            req.body.loadingPointInDate
          );
      }


      if (
        req.body.loadingDate !==
        undefined
      ) {
        vehicle.loadingDate =
          dateOrNull(
            req.body.loadingDate
          );
      }


      if (
        req.body.loadingPointOutDate !==
        undefined
      ) {
        vehicle.loadingPointOutDate =
          dateOrNull(
            req.body.loadingPointOutDate
          );
      }


      if (
        req.body.loadingHaltingDays !==
        undefined
      ) {
        vehicle.loadingHaltingDays =
          numberOrZero(
            req.body.loadingHaltingDays
          );
      }


      if (
        req.body.loadingRemarks !==
        undefined
      ) {
        vehicle.loadingRemarks =
          cleanText(
            req.body.loadingRemarks
          );
      }


      /* =====================================
         UNLOADING
      ===================================== */

      if (
        req.body.unloadingStatus !==
        undefined
      ) {
        vehicle.unloadingStatus =
          req.body.unloadingStatus;
      }


      if (
        req.body.unloadingPointInDate !==
        undefined
      ) {
        vehicle.unloadingPointInDate =
          dateOrNull(
            req.body.unloadingPointInDate
          );
      }


      if (
        req.body.unloadingDate !==
        undefined
      ) {
        vehicle.unloadingDate =
          dateOrNull(
            req.body.unloadingDate
          );
      }


      if (
        req.body.unloadingPointOutDate !==
        undefined
      ) {
        vehicle.unloadingPointOutDate =
          dateOrNull(
            req.body.unloadingPointOutDate
          );
      }


      if (
        req.body.unloadingHaltingDays !==
        undefined
      ) {
        vehicle.unloadingHaltingDays =
          numberOrZero(
            req.body.unloadingHaltingDays
          );
      }


      if (
        req.body.unloadingRemarks !==
        undefined
      ) {
        vehicle.unloadingRemarks =
          cleanText(
            req.body.unloadingRemarks
          );
      }


      /* =====================================
         LR
      ===================================== */

      if (
        req.body.lrNo !==
        undefined
      ) {
        vehicle.lrNo =
          cleanText(
            req.body.lrNo
          );
      }


      if (
        req.body.lrRemarks !==
        undefined
      ) {
        vehicle.lrRemarks =
          cleanText(
            req.body.lrRemarks
          );
      }


      if (
        req.body.lrSignature !==
        undefined
      ) {
        vehicle.lrSignature =
          cleanText(
            req.body.lrSignature
          );
      }


      /* =====================================
         POD
      ===================================== */

      if (
        req.body.podStatus !==
        undefined
      ) {
        vehicle.podStatus =
          req.body.podStatus;
      }


      if (
        req.body.podCourierDate !==
        undefined
      ) {
        vehicle.podCourierDate =
          dateOrNull(
            req.body.podCourierDate
          );
      }


      if (
        req.body.podRemarks !==
        undefined
      ) {
        vehicle.podRemarks =
          cleanText(
            req.body.podRemarks
          );
      }


      /* =====================================
         LAST UPDATED
      ===================================== */

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


/* =========================================
   EXPORTS
========================================= */

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  getTripByTripId,
  updateTrip,
  updateVehicle,
  deleteTrip,
};