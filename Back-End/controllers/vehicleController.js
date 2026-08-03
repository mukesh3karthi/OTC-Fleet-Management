const Vehicle = require("../models/Vehicle");

/* =========================================
   Helpers
========================================= */

const formatVehicleNumber = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();

const toTrimmedString = (value, fallback = "") =>
  String(value ?? fallback).trim();

const toLowercaseString = (value, fallback = "") =>
  toTrimmedString(value, fallback).toLowerCase();

const toFiniteNumber = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toBoolean = (value, fallback = true) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return fallback;
};

const mapToObject = (value) => {
  if (!value) {
    return {};
  }

  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }

  if (typeof value.toObject === "function") {
    const converted = value.toObject();

    if (converted && typeof converted === "object") {
      return { ...converted };
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }

  return {};
};

const isValidNumericId = (value) =>
  Number.isInteger(value) && value > 0;

const isValidDateKey = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));

/* =========================================
   GET ALL VEHICLES
========================================= */

const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ id: 1 });

    return res.status(200).json({
      success: true,
      vehicles,
    });
  } catch (error) {
    console.error("Get vehicles error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch vehicles.",
    });
  }
};

/* =========================================
   GET SINGLE VEHICLE
========================================= */

const getVehicleById = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);

    if (!isValidNumericId(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID.",
      });
    }

    const vehicle = await Vehicle.findOne({
      id: vehicleId,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    return res.status(200).json({
      success: true,
      vehicle,
    });
  } catch (error) {
    console.error("Get vehicle error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch vehicle.",
    });
  }
};

/* =========================================
   ADD VEHICLE
========================================= */

const addVehicle = async (req, res) => {
  try {
    const vehicleNumber = formatVehicleNumber(
      req.body.vehicleNumber
    );

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number is required.",
      });
    }

    const duplicateVehicle = await Vehicle.findOne({
      vehicleNumber,
    });

    if (duplicateVehicle) {
      return res.status(409).json({
        success: false,
        message: "Vehicle number already exists.",
      });
    }

    const lastVehicle = await Vehicle.findOne()
      .sort({ id: -1 })
      .select("id")
      .lean();

    const nextId = lastVehicle
      ? Number(lastVehicle.id) + 1
      : 1;

    const newVehicle = await Vehicle.create({
      id: nextId,
      vehicleNumber,
      status: toTrimmedString(
        req.body.status,
        "Active"
      ),
      manufacturingYear: toTrimmedString(
        req.body.manufacturingYear
      ),
      siteName: toTrimmedString(
        req.body.siteName
      ),
      vehicleType: toTrimmedString(
        req.body.vehicleType
      ),
      transportProvider: toTrimmedString(
        req.body.transportProvider
      ),
      dieselScope: toTrimmedString(
        req.body.dieselScope
      ),
      hireAmount: toTrimmedString(
        req.body.hireAmount
      ),
      vehicleInDate: toTrimmedString(
        req.body.vehicleInDate
      ),
      vehicleOutDate: toTrimmedString(
        req.body.vehicleOutDate
      ),
      driverName: toTrimmedString(
        req.body.driverName
      ),
      driverNumber: toTrimmedString(
        req.body.driverNumber
      ),
      vendorName: toTrimmedString(
        req.body.vendorName
      ),
      vendorEmail: toLowercaseString(
        req.body.vendorEmail
      ),
      activeStatus: toBoolean(
        req.body.activeStatus,
        true
      ),
    });

    return res.status(201).json({
      success: true,
      message: "Vehicle added successfully.",
      vehicle: newVehicle,
    });
  } catch (error) {
    console.error("Add vehicle error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Vehicle number or vehicle ID already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to add vehicle.",
    });
  }
};

/* =========================================
   UPDATE VEHICLE
========================================= */

const updateVehicle = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);

    if (!isValidNumericId(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID.",
      });
    }

    const currentVehicle = await Vehicle.findOne({
      id: vehicleId,
    });

    if (!currentVehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    const vehicleNumber = formatVehicleNumber(
      req.body.vehicleNumber ??
        currentVehicle.vehicleNumber
    );

    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number is required.",
      });
    }

    const duplicateVehicle = await Vehicle.findOne({
      vehicleNumber,
      id: { $ne: vehicleId },
    });

    if (duplicateVehicle) {
      return res.status(409).json({
        success: false,
        message: "Vehicle number already exists.",
      });
    }

    const updatedData = {
      vehicleNumber,

      status: toTrimmedString(
        req.body.status,
        currentVehicle.status || "Active"
      ),

      manufacturingYear: toTrimmedString(
        req.body.manufacturingYear,
        currentVehicle.manufacturingYear
      ),

      siteName: toTrimmedString(
        req.body.siteName,
        currentVehicle.siteName
      ),

      vehicleType: toTrimmedString(
        req.body.vehicleType,
        currentVehicle.vehicleType
      ),

      transportProvider: toTrimmedString(
        req.body.transportProvider,
        currentVehicle.transportProvider
      ),

      dieselScope: toTrimmedString(
        req.body.dieselScope,
        currentVehicle.dieselScope
      ),

      hireAmount: toTrimmedString(
        req.body.hireAmount,
        currentVehicle.hireAmount
      ),

      vehicleInDate: toTrimmedString(
        req.body.vehicleInDate,
        currentVehicle.vehicleInDate
      ),

      vehicleOutDate: toTrimmedString(
        req.body.vehicleOutDate,
        currentVehicle.vehicleOutDate
      ),

      driverName: toTrimmedString(
        req.body.driverName,
        currentVehicle.driverName
      ),

      driverNumber: toTrimmedString(
        req.body.driverNumber,
        currentVehicle.driverNumber
      ),

      vendorName: toTrimmedString(
        req.body.vendorName,
        currentVehicle.vendorName
      ),

      vendorEmail: toLowercaseString(
        req.body.vendorEmail,
        currentVehicle.vendorEmail
      ),

      activeStatus: toBoolean(
        req.body.activeStatus,
        currentVehicle.activeStatus
      ),
    };

    const updatedVehicle =
      await Vehicle.findOneAndUpdate(
        { id: vehicleId },
        {
          $set: updatedData,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully.",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error("Update vehicle error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Vehicle number already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to update vehicle.",
    });
  }
};

/* =========================================
   DELETE VEHICLE
========================================= */

const deleteVehicle = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);

    if (!isValidNumericId(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID.",
      });
    }

    const deletedVehicle =
      await Vehicle.findOneAndDelete({
        id: vehicleId,
      });

    if (!deletedVehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully.",
      vehicle: deletedVehicle,
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to delete vehicle.",
    });
  }
};

/* =========================================
   BULK UPDATE DAILY LOG
   PUT /api/vehicles/daily-log/bulk
========================================= */

const bulkUpdateDailyLog = async (req, res) => {
  try {
    const {
      selectedDate,
      vehicles: incomingRows,
    } = req.body;

    if (!isValidDateKey(selectedDate)) {
      return res.status(400).json({
        success: false,
        message:
          "A valid date in YYYY-MM-DD format is required.",
      });
    }

    if (
      !Array.isArray(incomingRows) ||
      incomingRows.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No vehicle rows are available to save.",
      });
    }

    const monthKey = selectedDate.slice(0, 7);
    const updatedVehicles = [];
    const skippedRows = [];

    for (const row of incomingRows) {
      const vehicleId = Number(row.id);

      if (!isValidNumericId(vehicleId)) {
        skippedRows.push({
          id: row.id ?? null,
          reason: "Invalid numeric vehicle ID.",
        });

        continue;
      }

      const existingVehicle =
        await Vehicle.findOne({
          id: vehicleId,
        });

      if (!existingVehicle) {
        skippedRows.push({
          id: vehicleId,
          reason: "Vehicle not found.",
        });

        continue;
      }

      const dailyKmLogs = mapToObject(
        existingVehicle.dailyKmLogs
      );

      const dailyStartingKmLogs = mapToObject(
        existingVehicle.dailyStartingKmLogs
      );

      const dailyClosingKmLogs = mapToObject(
        existingVehicle.dailyClosingKmLogs
      );

      const dailyLoadIdleLogs = mapToObject(
        existingVehicle.dailyLoadIdleLogs
      );

      const dailyVehicleStatusLogs =
        mapToObject(
          existingVehicle.dailyVehicleStatusLogs
        );

      const dailyAttendanceLogs = mapToObject(
        existingVehicle.dailyAttendanceLogs
      );

      const dailyDieselLogs = mapToObject(
        existingVehicle.dailyDieselLogs
      );

      const dailyDieselConsumptionLogs =
        mapToObject(
          existingVehicle
            .dailyDieselConsumptionLogs
        );

      const monthlyOpenKmLogs = mapToObject(
        existingVehicle.monthlyOpenKmLogs
      );

      const todayKm = toFiniteNumber(
        row.todayKm,
        0
      );

      const startingKm = toFiniteNumber(
        row.startingKm,
        0
      );

      const closingKm = startingKm + todayKm;

      const diesel = toFiniteNumber(
        row.diesel,
        0
      );

      const dieselConsumption =
        toFiniteNumber(
          row.dieselConsumption,
          0
        );

      const loadIdle = toTrimmedString(
        row.loadIdle
      );

      const attendance = toTrimmedString(
        row.attendance,
        "Present"
      );

      const vehicleStatus = toTrimmedString(
        row.vehicleStatus,
        "Active"
      );

      dailyKmLogs[selectedDate] = todayKm;

      dailyStartingKmLogs[selectedDate] =
        startingKm;

      dailyClosingKmLogs[selectedDate] =
        closingKm;

      dailyLoadIdleLogs[selectedDate] =
        loadIdle;

      dailyVehicleStatusLogs[selectedDate] =
        vehicleStatus;

      dailyAttendanceLogs[selectedDate] =
        attendance;

      dailyDieselLogs[selectedDate] = diesel;

      dailyDieselConsumptionLogs[
        selectedDate
      ] = dieselConsumption;

      if (
        row.monthOpenKm !== "" &&
        row.monthOpenKm !== null &&
        row.monthOpenKm !== undefined
      ) {
        monthlyOpenKmLogs[monthKey] =
          toFiniteNumber(
            row.monthOpenKm,
            monthlyOpenKmLogs[monthKey] ?? 0
          );
      }

      const monthlyKm = Object.entries(
        dailyKmLogs
      ).reduce((total, [date, km]) => {
        if (
          String(date).slice(0, 7) !==
          monthKey
        ) {
          return total;
        }

        return (
          total + toFiniteNumber(km, 0)
        );
      }, 0);

      const updateData = {
        startingKm,
        closingKm,
        todayKm,
        monthlyKm,

        monthOpenKm:
          monthlyOpenKmLogs[monthKey] ??
          existingVehicle.monthOpenKm ??
          "",

        loadIdle,
        attendance,
        vehicleStatus,
        diesel,
        dieselConsumption,

        dailyKmLogs,
        dailyStartingKmLogs,
        dailyClosingKmLogs,
        dailyLoadIdleLogs,
        dailyVehicleStatusLogs,
        dailyAttendanceLogs,
        dailyDieselLogs,
        dailyDieselConsumptionLogs,
        monthlyOpenKmLogs,

        dailyLogDate: selectedDate,
      };

      if (row.vehicleNumber !== undefined) {
        updateData.vehicleNumber =
          formatVehicleNumber(
            row.vehicleNumber
          );
      }

      if (row.siteName !== undefined) {
        updateData.siteName =
          toTrimmedString(row.siteName);
      }

      if (row.driverNumber !== undefined) {
        updateData.driverNumber =
          toTrimmedString(
            row.driverNumber
          );
      }

      if (
        row.transportProvider !== undefined
      ) {
        updateData.transportProvider =
          toTrimmedString(
            row.transportProvider
          );
      }

      if (row.vehicleType !== undefined) {
        updateData.vehicleType =
          toTrimmedString(
            row.vehicleType
          );
      }

      const updatedVehicle =
        await Vehicle.findOneAndUpdate(
          {
            id: vehicleId,
          },
          {
            $set: updateData,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (updatedVehicle) {
        updatedVehicles.push(
          updatedVehicle
        );
      }
    }

    if (updatedVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No matching vehicle records were updated.",
        skippedRows,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Vehicle daily-log records saved successfully.",
      updatedCount: updatedVehicles.length,
      skippedCount: skippedRows.length,
      vehicles: updatedVehicles,
      skippedRows,
    });
  } catch (error) {
    console.error(
      "Bulk daily-log update error:",
      error
    );

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A duplicate vehicle number was found.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to save vehicle records.",
    });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  bulkUpdateDailyLog,
};