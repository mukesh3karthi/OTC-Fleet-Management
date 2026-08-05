import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Fuel,
  MapPin,
  Pencil,
  Route,
  Save,
  Search,
  X,
} from "lucide-react";

import "../Intercartingcss/dailylog.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL = `${API_BASE_URL}/api/vehicles`;

const API_OPTIONS = {
  timeout: 60000,
};

const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatSelectedDate = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getPreviousDateKey = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const previousDate = new Date(`${dateValue}T00:00:00`);

  previousDate.setDate(previousDate.getDate() - 1);

  const year = previousDate.getFullYear();
  const month = String(previousDate.getMonth() + 1).padStart(2, "0");
  const day = String(previousDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getVehicleId = (vehicle) => vehicle?._id ?? vehicle?.id;

const normalizeMonthlyOpenKmLogs = (vehicle) => {
  const rawLogs = vehicle?.monthlyOpenKmLogs;

  let logs = {};

  if (rawLogs instanceof Map) {
    logs = Object.fromEntries(rawLogs);
  } else if (rawLogs && typeof rawLogs === "object" && !Array.isArray(rawLogs)) {
    logs = { ...rawLogs };
  }

  /*
    Backward compatibility:
    Existing vehicles may only have the old monthOpenKm field.
    Store it against the month of the last saved daily log.
  */
  if (
    Object.keys(logs).length === 0 &&
    Number(vehicle?.monthOpenKm || 0) > 0 &&
    vehicle?.dailyLogDate
  ) {
    const legacyMonth = String(vehicle.dailyLogDate).slice(0, 7);

    if (legacyMonth) {
      logs[legacyMonth] = Number(vehicle.monthOpenKm || 0);
    }
  }

  return Object.fromEntries(
    Object.entries(logs).map(([month, km]) => [
      String(month).slice(0, 7),
      Number.isFinite(Number(km)) ? Number(km) : 0,
    ])
  );
};

const getMonthOpenKmForDate = (vehicle, dateValue) => {
  const monthKey = String(dateValue || "").slice(0, 7);
  const logs = normalizeMonthlyOpenKmLogs(vehicle);

  if (!monthKey || !Object.prototype.hasOwnProperty.call(logs, monthKey)) {
    return "";
  }

  return Number(logs[monthKey] || 0);
};

const normalizeDailyKmLogs = (vehicle) => {
  const rawLogs = vehicle?.dailyKmLogs;

  let logs = {};

  if (rawLogs instanceof Map) {
    logs = Object.fromEntries(rawLogs);
  } else if (rawLogs && typeof rawLogs === "object" && !Array.isArray(rawLogs)) {
    logs = { ...rawLogs };
  }

  // Supports older records saved before dailyKmLogs was added.
  if (
    Object.keys(logs).length === 0 &&
    vehicle?.dailyLogDate &&
    Number(vehicle?.todayKm || 0) >= 0
  ) {
    logs[String(vehicle.dailyLogDate).slice(0, 10)] = Number(
      vehicle.todayKm || 0
    );
  }

  return Object.fromEntries(
    Object.entries(logs).map(([date, km]) => [
      String(date).slice(0, 10),
      Number.isFinite(Number(km)) ? Number(km) : 0,
    ])
  );
};

const normalizeDailyLoadIdleLogs = (vehicle) => {
  const rawLogs = vehicle?.dailyLoadIdleLogs;

  let logs = {};

  if (rawLogs instanceof Map) {
    logs = Object.fromEntries(rawLogs);
  } else if (
    rawLogs &&
    typeof rawLogs === "object" &&
    !Array.isArray(rawLogs)
  ) {
    logs = { ...rawLogs };
  }

  // Backward compatibility for records that only have loadIdle.
  if (
    Object.keys(logs).length === 0 &&
    vehicle?.dailyLogDate &&
    vehicle?.loadIdle
  ) {
    const savedDate = String(vehicle.dailyLogDate).slice(0, 10);
    logs[savedDate] = String(vehicle.loadIdle || "").trim();
  }

  return Object.fromEntries(
    Object.entries(logs).map(([date, description]) => [
      String(date).slice(0, 10),
      String(description ?? "").trim(),
    ])
  );
};

const getMonthKey = (dateValue) => String(dateValue || "").slice(0, 7);

const getTodayKmForDate = (vehicle, dateValue) => {
  if (!dateValue) {
    return 0;
  }

  const logs = normalizeDailyKmLogs(vehicle);

  return Number(logs[dateValue] || 0);
};

const getMonthlyKmForDate = (vehicle, dateValue) => {
  const monthKey = getMonthKey(dateValue);

  if (!monthKey) {
    return 0;
  }

  const logs = normalizeDailyKmLogs(vehicle);

  return Object.entries(logs).reduce((total, [date, km]) => {
    if (getMonthKey(date) !== monthKey) {
      return total;
    }

    return total + Number(km || 0);
  }, 0);
};

const getVehicleForSelectedDate = (vehicle, dateValue) => {
  const dailyKmLogs = normalizeDailyKmLogs(vehicle);
  const dailyLoadIdleLogs = normalizeDailyLoadIdleLogs(vehicle);

  const selectedDateKey = String(dateValue || "").slice(0, 10);
  const lastSavedDate = String(vehicle?.dailyLogDate || "").slice(0, 10);

  const hasSelectedDateLog = Object.prototype.hasOwnProperty.call(
    dailyKmLogs,
    selectedDateKey
  );

  const hasSelectedLoadIdle = Object.prototype.hasOwnProperty.call(
    dailyLoadIdleLogs,
    selectedDateKey
  );

  const selectedTodayKm = hasSelectedDateLog
    ? Number(dailyKmLogs[selectedDateKey] || 0)
    : "";

  const previousDateKey = getPreviousDateKey(selectedDateKey);

  const previousLoadIdle =
    previousDateKey &&
    Object.prototype.hasOwnProperty.call(
      dailyLoadIdleLogs,
      previousDateKey
    )
      ? String(dailyLoadIdleLogs[previousDateKey] || "")
      : "";

  const selectedLoadIdle = hasSelectedLoadIdle
    ? String(dailyLoadIdleLogs[selectedDateKey] || "")
    : previousLoadIdle;

  let selectedStartingKm = Number(vehicle?.startingKm || 0);
  let selectedClosingKm = hasSelectedDateLog
    ? selectedStartingKm + Number(selectedTodayKm || 0)
    : selectedStartingKm;

  /*
    New-day rollover:
    When the selected date is after the last saved daily-log date,
    yesterday's closing KM becomes today's starting KM.
  */
  if (
    selectedDateKey &&
    lastSavedDate &&
    selectedDateKey > lastSavedDate
  ) {
    selectedStartingKm = Number(vehicle?.closingKm || 0);
    selectedClosingKm = hasSelectedDateLog
      ? selectedStartingKm + Number(selectedTodayKm || 0)
      : selectedStartingKm;
  }

  // Reopen the latest saved date with its stored KM values.
  if (selectedDateKey === lastSavedDate) {
    selectedStartingKm = Number(vehicle?.startingKm || 0);
    selectedClosingKm = hasSelectedDateLog
      ? Number(vehicle?.closingKm || 0)
      : selectedStartingKm;
  }

  const monthlyOpenKmLogs = normalizeMonthlyOpenKmLogs(vehicle);
  const selectedMonthKey = getMonthKey(dateValue);
  const hasMonthOpenKm = Object.prototype.hasOwnProperty.call(
    monthlyOpenKmLogs,
    selectedMonthKey
  );

  return {
    ...vehicle,
    monthOpenKm: hasMonthOpenKm
      ? Number(monthlyOpenKmLogs[selectedMonthKey] || 0)
      : "",
    startingKm: selectedStartingKm,
    closingKm: selectedClosingKm,
    todayKm: selectedTodayKm,
    monthlyKm: getMonthlyKmForDate(vehicle, dateValue),

    // Load / Idle value belonging only to the selected date.
    loadIdle: selectedLoadIdle,

    dailyKmLogs,
    dailyLoadIdleLogs,
    monthlyOpenKmLogs,
    hasMonthOpenKm,
  };
};

const isVehicleAvailableOnDate = (vehicle, selectedDate) => {
  if (!selectedDate) {
    return true;
  }

  const selected = new Date(`${selectedDate}T00:00:00`);

  const vehicleInDate = vehicle.vehicleInDate
    ? new Date(`${String(vehicle.vehicleInDate).slice(0, 10)}T00:00:00`)
    : null;

  const vehicleOutDate = vehicle.vehicleOutDate
    ? new Date(`${String(vehicle.vehicleOutDate).slice(0, 10)}T00:00:00`)
    : null;

  if (vehicleInDate && selected < vehicleInDate) {
    return false;
  }

  if (vehicleOutDate && selected > vehicleOutDate) {
    return false;
  }

  return true;
};

const getVehicleStatus = (vehicle) => {
  const status = normalizeText(
    vehicle.vehicleStatus || vehicle.status
  );

  if (
    status === "under maintenance" ||
    status === "maintenance"
  ) {
    return "Under Maintenance";
  }

  if (
    status === "under induction" ||
    status === "induction"
  ) {
    return "Under Induction";
  }

  if (
    status === "inactive" ||
    status === "off duty" ||
    status === "off-duty" ||
    vehicle.activeStatus === false
  ) {
    return "Inactive";
  }

  return "Active";
};

const emptyToZero = (value) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const zeroToEmpty = (value) => {
  if (
    value === 0 ||
    value === "0" ||
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return value;
};

const displayKm = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    Number(value) === 0
  ) {
    return "-";
  }

  return value;
};

const Dailylog = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [downloadType, setDownloadType] = useState(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [savingBulk, setSavingBulk] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const toastTimerRef = useRef(null);
  const siteSelectorRef = useRef(null);

  const showToast = (message, type = "success") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({
      show: true,
      message,
      type,
    });

    toastTimerRef.current = setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(API_URL, API_OPTIONS);

        const list = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.vehicles)
            ? response.data.vehicles
            : [];

        setVehicles(list);
      } catch (apiError) {
        console.error("Failed to load vehicles:", apiError);

        setError(
          apiError.response?.data?.message ||
          "Unable to load vehicle data. Please check whether the backend server is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  useEffect(() => {
    const closeOutside = (event) => {
      if (
        siteSelectorRef.current &&
        !siteSelectorRef.current.contains(event.target)
      ) {
        setShowSiteDropdown(false);
      }
    };

    document.addEventListener("mousedown", closeOutside);

    return () => {
      document.removeEventListener("mousedown", closeOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (showBulkEdit && !savingBulk) {
        setShowBulkEdit(false);
      }

      if (downloadType) {
        setDownloadType(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showBulkEdit, savingBulk, downloadType]);

  useEffect(() => {
    const modalIsOpen = showBulkEdit || Boolean(downloadType);

    document.documentElement.classList.toggle(
      "daily-modal-open",
      modalIsOpen
    );
    document.body.classList.toggle(
      "daily-modal-open",
      modalIsOpen
    );

    return () => {
      document.documentElement.classList.remove("daily-modal-open");
      document.body.classList.remove("daily-modal-open");
    };
  }, [showBulkEdit, downloadType]);

  const sites = useMemo(() => {
    return [
      ...new Set(
        vehicles
          .map((vehicle) => vehicle.siteName?.trim())
          .filter(Boolean)
      ),
    ].sort((first, second) => first.localeCompare(second));
  }, [vehicles]);

  const vehiclesForSelectedDate = useMemo(
    () =>
      vehicles.map((vehicle) =>
        getVehicleForSelectedDate(vehicle, selectedDate)
      ),
    [vehicles, selectedDate]
  );

  const filteredVehicles = useMemo(() => {
    const search = normalizeText(searchTerm);

    return vehiclesForSelectedDate.filter((vehicle) => {
      const availableOnSelectedDate = isVehicleAvailableOnDate(
        vehicle,
        selectedDate
      );

      const siteMatches =
        !selectedSite ||
        normalizeText(vehicle.siteName) === normalizeText(selectedSite);

      const searchMatches =
        !search ||
        [
          vehicle.vehicleNumber,
          vehicle.driverNumber,
          vehicle.transportProvider,
          vehicle.vehicleType,
          vehicle.siteName,
          vehicle.driverName,
          vehicle.loadIdle,
          vehicle.vehicleStatus,
          vehicle.attendance,
        ].some((value) => normalizeText(value).includes(search));

      return availableOnSelectedDate && siteMatches && searchMatches;
    });
  }, [vehiclesForSelectedDate, selectedSite, searchTerm, selectedDate]);

  const selectedSiteVehicles = useMemo(() => {
    if (!selectedSite) {
      return [];
    }

    return vehiclesForSelectedDate.filter((vehicle) => {
      const siteMatches =
        normalizeText(vehicle.siteName) === normalizeText(selectedSite);

      const availableOnSelectedDate = isVehicleAvailableOnDate(
        vehicle,
        selectedDate
      );

      return siteMatches && availableOnSelectedDate;
    });
  }, [vehiclesForSelectedDate, selectedSite, selectedDate]);

  const activeVehicles = filteredVehicles.filter(
    (vehicle) => getVehicleStatus(vehicle) === "Active"
  ).length;

  const maintenanceVehicles = filteredVehicles.filter(
    (vehicle) => getVehicleStatus(vehicle) === "Under Maintenance"
  ).length;

  const inductionVehicles = filteredVehicles.filter(
    (vehicle) => getVehicleStatus(vehicle) === "Under Induction"
  ).length;

  const inactiveVehicles = filteredVehicles.filter(
    (vehicle) => getVehicleStatus(vehicle) === "Inactive"
  ).length;

  const totalDistance = filteredVehicles.reduce(
    (sum, vehicle) => sum + Number(vehicle.todayKm || 0),
    0
  );

  const totalDiesel = filteredVehicles.reduce(
    (sum, vehicle) =>
      sum + Number(vehicle.diesel ?? vehicle.dieselConsumption ?? 0),
    0
  );

  const exportRows = filteredVehicles.map((vehicle, index) => ({
    "S.No": index + 1,
    "Vehicle No": vehicle.vehicleNumber || "-",
    "Driver Phone No": vehicle.driverNumber || "-",
    "Transport Name": vehicle.transportProvider || "-",
    "Vehicle Type": vehicle.vehicleType || "-",
    "Site Name": vehicle.siteName || "-",
    "Month Open KM": displayKm(vehicle.monthOpenKm),
    "Starting KM": displayKm(vehicle.startingKm),
    "Closing KM": displayKm(vehicle.closingKm),
    "Today KM": displayKm(vehicle.todayKm),
    "Monthly KM": displayKm(vehicle.monthlyKm),
    "Load / Idle": vehicle.loadIdle || "-",
    "Vehicle Status": getVehicleStatus(vehicle),
    Attendance: vehicle.attendance || "Present",
  }));

  const createFileName = (extension) => {
    const safeSite = (selectedSite || "All-Sites").replace(
      /[^a-z0-9]+/gi,
      "-"
    );

    return `vehicle-log-${safeSite}-${selectedDate}.${extension}`;
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    worksheet["!cols"] = Array(14).fill({
      wch: 18,
    });

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Vehicle Information"
    );

    XLSX.writeFile(workbook, createFileName("xlsx"));
  };

  const downloadPdf = () => {
    const document = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    document.setFontSize(16);
    document.text("Vehicle Information Report", 14, 15);

    document.setFontSize(9);
    document.text(
      `Site: ${selectedSite || "All Sites"}   Date: ${formatSelectedDate(
        selectedDate
      )}   Records: ${filteredVehicles.length}`,
      14,
      22
    );

    autoTable(document, {
      startY: 27,

      head: [
        [
          "S.No",
          "Vehicle No",
          "Driver Phone",
          "Transport Name",
          "Vehicle Type",
          "Site Name",
          "Month Open KM",
          "Starting KM",
          "Closing KM",
          "Today KM",
          "Monthly KM",
          "Load / Idle",
          "Vehicle Status",
          "Attendance",
        ],
      ],

      body: exportRows.map((row) => Object.values(row)),

      styles: {
        fontSize: 6,
        cellPadding: 1.5,
      },

      headStyles: {
        fontSize: 6,
      },
    });

    document.save(createFileName("pdf"));
  };

  const confirmDownload = () => {
    if (downloadType === "excel") {
      downloadExcel();
    }

    if (downloadType === "pdf") {
      downloadPdf();
    }

    setDownloadType(null);
  };

  const openBulkEdit = () => {
    if (!selectedSite) {
      setError("Please select a site before editing the table.");
      return;
    }

    if (selectedSiteVehicles.length === 0) {
      setError("No vehicles are available for the selected site.");
      return;
    }

    setError("");
    setBulkError("");

    setBulkRows(
      selectedSiteVehicles.map((vehicle) => ({
        ...vehicle,
        vehicleNumber: vehicle.vehicleNumber ?? "",
        driverNumber: vehicle.driverNumber ?? "",
        transportProvider: vehicle.transportProvider ?? "",
        vehicleType: vehicle.vehicleType ?? "",
        siteName: vehicle.siteName ?? "",
        monthOpenKm: zeroToEmpty(vehicle.monthOpenKm),
        startingKm: zeroToEmpty(vehicle.startingKm),
        closingKm: zeroToEmpty(vehicle.closingKm),
        todayKm: zeroToEmpty(vehicle.todayKm),
        monthlyKm: zeroToEmpty(vehicle.monthlyKm),
        loadIdle: vehicle.loadIdle ?? "",
        vehicleStatus: getVehicleStatus(vehicle),
        attendance: vehicle.attendance || "Present",
        _dailyKmLogs: normalizeDailyKmLogs(vehicle),
        _monthlyOpenKmLogs: normalizeMonthlyOpenKmLogs(vehicle),
        _hasMonthOpenKm: Boolean(vehicle.hasMonthOpenKm),
      }))
    );

    setShowBulkEdit(true);
  };

  const handleBulkChange = (rowIndex, field, value) => {
    const numericFields = [
      "monthOpenKm",
      "startingKm",
      "closingKm",
      "todayKm",
      "monthlyKm",
    ];

    if (
      numericFields.includes(field) &&
      value !== "" &&
      !/^\d*(\.\d*)?$/.test(value)
    ) {
      return;
    }

    setBulkRows((previous) =>
      previous.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const updatedRow = {
          ...row,
          [field]:
            field === "vehicleNumber"
              ? value.replace(/[^a-zA-Z0-9/]/g, "").toUpperCase()
              : value,
        };

        if (field === "monthOpenKm") {
          const monthKey = getMonthKey(selectedDate);
          const updatedMonthlyOpenKmLogs = {
            ...(updatedRow._monthlyOpenKmLogs || {}),
          };

          if (value === "") {
            delete updatedMonthlyOpenKmLogs[monthKey];
          } else {
            updatedMonthlyOpenKmLogs[monthKey] = emptyToZero(value);
          }

          updatedRow._monthlyOpenKmLogs = updatedMonthlyOpenKmLogs;
        }

        if (field === "todayKm" || field === "startingKm") {
          const startingKm = emptyToZero(updatedRow.startingKm);
          const todayKm = emptyToZero(updatedRow.todayKm);
          const closingKm = startingKm + todayKm;

          const updatedLogs = {
            ...(updatedRow._dailyKmLogs || {}),
          };

          if (updatedRow.todayKm === "") {
            delete updatedLogs[selectedDate];

            // No Today KM yet: Closing KM remains equal to Starting KM.
            updatedRow.closingKm = startingKm;
          } else {
            updatedLogs[selectedDate] = todayKm;
            updatedRow.closingKm = closingKm;
          }

          updatedRow._dailyKmLogs = updatedLogs;

          updatedRow.monthlyKm = Object.entries(updatedLogs).reduce(
            (total, [date, km]) =>
              getMonthKey(date) === getMonthKey(selectedDate)
                ? total + Number(km || 0)
                : total,
            0
          );
        }

        return updatedRow;
      })
    );
  };

  const saveAllChanges = async (event) => {
  event.preventDefault();

  setBulkError("");

  if (!selectedDate) {
    setBulkError("Please select a date.");
    return;
  }

  if (!Array.isArray(bulkRows) || bulkRows.length === 0) {
    setBulkError("No vehicle rows are available to save.");
    return;
  }

  for (const row of bulkRows) {
    const vehicleId = row._id || row.id;

    if (!vehicleId) {
      setBulkError(
        `Vehicle ID is missing for ${
          row.vehicleNumber || "one record"
        }.`
      );
      return;
    }

    if (!row.vehicleNumber?.trim()) {
      setBulkError("Vehicle number is required.");
      return;
    }
  }

  try {
    setSavingBulk(true);

    const payload = {
      selectedDate,

      vehicles: bulkRows.map((row) => ({
        _id: row._id || null,
        id: row.id || null,

        vehicleNumber:
          row.vehicleNumber
            ?.replace(/[^a-zA-Z0-9/]/g, "")
            .toUpperCase()
            .trim() || "",

        manufacturingYear:
          row.manufacturingYear === "" ||
          row.manufacturingYear === null ||
          row.manufacturingYear === undefined
            ? null
            : Number(row.manufacturingYear),

        siteName:
          row.siteName?.trim() || "",

        vehicleType:
          row.vehicleType?.trim() || "",

        transportProvider:
          row.transportProvider?.trim() || "",

        dieselScope:
          row.dieselScope?.trim() || "",

        hireAmount:
          row.hireAmount === "" ||
          row.hireAmount === null ||
          row.hireAmount === undefined
            ? 0
            : Number(row.hireAmount),

        vehicleInDate:
          row.vehicleInDate || null,

        vehicleOutDate:
          row.vehicleOutDate || null,

        status:
          row.status || "Active",

        activeStatus:
          row.activeStatus !== undefined
            ? Boolean(row.activeStatus)
            : true,

        vehicleStatus:
          row.vehicleStatus || "Active",

        driverName:
          row.driverName?.trim() || "",

        driverNumber:
          row.driverNumber?.trim() || "",

        vendorName:
          row.vendorName?.trim() || "",

        vendorEmail:
          row.vendorEmail
            ?.trim()
            .toLowerCase() || "",

        monthOpenKm:
          row.monthOpenKm === "" ||
          row.monthOpenKm === null ||
          row.monthOpenKm === undefined
            ? ""
            : Number(row.monthOpenKm),

        startingKm:
          row.startingKm === "" ||
          row.startingKm === null ||
          row.startingKm === undefined
            ? ""
            : Number(row.startingKm),

        closingKm:
          row.closingKm === "" ||
          row.closingKm === null ||
          row.closingKm === undefined
            ? ""
            : Number(row.closingKm),

        todayKm:
          row.todayKm === "" ||
          row.todayKm === null ||
          row.todayKm === undefined
            ? ""
            : Number(row.todayKm),

        monthlyKm:
          row.monthlyKm === "" ||
          row.monthlyKm === null ||
          row.monthlyKm === undefined
            ? 0
            : Number(row.monthlyKm),

        loadIdle:
          row.loadIdle?.trim() || "",

        attendance:
          row.attendance || "Present",

        diesel:
          row.diesel === "" ||
          row.diesel === null ||
          row.diesel === undefined
            ? 0
            : Number(row.diesel),

        dieselConsumption:
          row.dieselConsumption === "" ||
          row.dieselConsumption === null ||
          row.dieselConsumption === undefined
            ? 0
            : Number(row.dieselConsumption),
      })),
    };

    console.log("Bulk daily-log payload:", payload);

    const response = await axios.put(
      `${API_URL}/daily-log/bulk`,
      payload,
      {
        ...API_OPTIONS,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const updatedVehicles = Array.isArray(
      response.data?.vehicles
    )
      ? response.data.vehicles
      : [];

    const updatedById = new Map();

    updatedVehicles.forEach((vehicle) => {
      const vehicleId =
        vehicle._id || vehicle.id;

      if (vehicleId) {
        updatedById.set(
          String(vehicleId),
          vehicle
        );
      }
    });

    setVehicles((previousVehicles) =>
      previousVehicles.map((vehicle) => {
        const currentId =
          vehicle._id || vehicle.id;

        const updatedVehicle =
          updatedById.get(
            String(currentId)
          );

        return updatedVehicle || vehicle;
      })
    );

    setShowBulkEdit(false);
    setBulkRows([]);
    setBulkError("");

    showToast(
      response.data?.message ||
        "All vehicle records saved successfully.",
      "success"
    );
  } catch (saveError) {
    console.error("Save daily-log error:", {
      status: saveError.response?.status,
      data: saveError.response?.data,
      message: saveError.message,
    });

    const backendMessage =
      saveError.response?.data?.message ||
      saveError.response?.data?.error ||
      saveError.message ||
      "Unable to save vehicle records.";

    setBulkError(backendMessage);
    showToast(backendMessage, "error");
  } finally {
    setSavingBulk(false);
  }
};

  return (
    <div className="daily-log-page">
      {toast.show && (
        <div
          className={`daily-toast ${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="daily-toast-icon" aria-hidden="true">
            {toast.type === "success" ? "✓" : "!"}
          </span>

          <span>{toast.message}</span>
        </div>
      )}

      <div className="daily-log-top-section">
        <div className="daily-log-header">
          <div className="daily-log-title-row">
            <button
              type="button"
              className="daily-log-back-button"
              onClick={() => navigate("/intercartingdash/intercarting")}
              aria-label="Back to Intercarting"
              title="Back to Intercarting"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1>Daily Log Entry</h1>
              <p>Manage daily operational data across all active sites</p>
            </div>
          </div>
        </div>

        <div className="daily-header-actions">
          <div className="daily-search-box">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search vehicle, site or description..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="daily-date-section">
            <label htmlFor="daily-log-date">Select Date</label>

            <div className="daily-date-input-wrapper">
              <CalendarDays size={18} />

              <input
                id="daily-log-date"
                type="date"
                value={selectedDate}
                max={getCurrentDate()}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>

            <span>{formatSelectedDate(selectedDate)}</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="daily-log-message">Loading vehicle data...</div>
      )}

      {!loading && error && (
        <div className="daily-log-error">{error}</div>
      )}

      {!loading && (
        <div className="daily-filter-row">
          <div
            className="single-site-selector"
            ref={siteSelectorRef}
          >
            <label>Select Site</label>

            <button
              type="button"
              className="single-site-button"
              onClick={() =>
                setShowSiteDropdown((current) => !current)
              }
            >
              <span>
                <MapPin size={17} />
                {selectedSite || "All Sites"}
              </span>

              <ChevronDown size={18} />
            </button>

            {showSiteDropdown && (
              <div className="site-dropdown-list">
                <button
                  type="button"
                  className={!selectedSite ? "selected" : ""}
                  onClick={() => {
                    setSelectedSite("");
                    setShowSiteDropdown(false);
                    setError("");
                  }}
                >
                  All Sites
                </button>

                {sites.map((site) => (
                  <button
                    type="button"
                    key={site}
                    className={
                      selectedSite === site ? "selected" : ""
                    }
                    onClick={() => {
                      setSelectedSite(site);
                      setShowSiteDropdown(false);
                      setError("");
                    }}
                  >
                    {site}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(selectedSite || searchTerm) && (
            <button
              type="button"
              className="clear-all-filter-button"
              onClick={() => {
                setSelectedSite("");
                setSearchTerm("");
                setError("");
              }}
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>
      )}

      <div className="vehicle-status-bar">
        <span>
          <i className="status-dot total-records-dot" />
          Total Records: <strong>{vehicles.length}</strong>
        </span>

        <span>
          <i className="status-dot active-dot" />
          Active: <strong>{activeVehicles}</strong>
        </span>

        <span>
          <i className="status-dot maintenance-dot" />
          Under Maintenance: <strong>{maintenanceVehicles}</strong>
        </span>

        <span>
          <i className="status-dot induction-dot" />
          Under Induction: <strong>{inductionVehicles}</strong>
        </span>

        <span>
          <i className="status-dot inactive-dot" />
          Inactive: <strong>{inactiveVehicles}</strong>
        </span>
      </div>

      <div className="daily-log-information">
        <span>
          Site: <strong>{selectedSite || "All Sites"}</strong>
        </span>

        <span>
          Date: <strong>{formatSelectedDate(selectedDate)}</strong>
        </span>

        <span>
          Showing: <strong>{filteredVehicles.length}</strong>
        </span>
      </div>


      <div className="daily-table-toolbar">
        <div>
          <h2>Vehicle Information</h2>

          <p>
            Select a site and click Edit Table to edit every vehicle
            in that site.
          </p>
        </div>

        <div className="daily-toolbar-actions">
          <button
            type="button"
            className="edit-table-button"
            onClick={openBulkEdit}
            disabled={
              !selectedSite || selectedSiteVehicles.length === 0
            }
          >
            <Pencil size={17} />
            Edit Table
          </button>

          <button
            type="button"
            className="excel-button"
            onClick={() => setDownloadType("excel")}
            disabled={filteredVehicles.length === 0}
          >
            <FileSpreadsheet size={17} />
            Excel
          </button>

          <button
            type="button"
            className="pdf-button"
            onClick={() => setDownloadType("pdf")}
            disabled={filteredVehicles.length === 0}
          >
            <FileText size={17} />
            PDF
          </button>
        </div>
      </div>

      <div className="daily-log-table-wrapper">
        <table className="daily-log-table">
          <thead>
            <tr className="group-heading-row">
              <th colSpan={7}>VEHICLE INFO</th>
              <th colSpan={7}>DAILY LOG DATA</th>
            </tr>

            <tr className="column-heading-row">
              <th>S.NO</th>
              <th>VEHICLE NO</th>
              <th>DRIVER PH NO</th>
              <th>TRANSPORT NAME</th>
              <th>TYPE OF VEHICLE</th>
              <th>SITE NAME</th>
              <th>MONTH OPEN KM</th>
              <th>STARTING KM</th>
              <th>CLOSING KM</th>
              <th>TODAY KM</th>
              <th>MONTHLY KM</th>
              <th>LOAD / IDLE</th>
              <th>VEHICLE STATUS</th>
              <th>ATTENDANCE</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={14} className="no-log-records">
                  Loading vehicles...
                </td>
              </tr>
            ) : filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle, index) => (
                <tr
                  key={
                    getVehicleId(vehicle) ??
                    `${vehicle.vehicleNumber}-${index}`
                  }
                >
                  <td>{index + 1}</td>
                  <td>{vehicle.vehicleNumber || "-"}</td>
                  <td>{vehicle.driverNumber || "-"}</td>
                  <td>{vehicle.transportProvider || "-"}</td>
                  <td>{vehicle.vehicleType || "-"}</td>
                  <td>{vehicle.siteName || "-"}</td>
                  <td>{displayKm(vehicle.monthOpenKm)}</td>
                  <td>{displayKm(vehicle.startingKm)}</td>
                  <td>{displayKm(vehicle.closingKm)}</td>
                  <td>{displayKm(vehicle.todayKm)}</td>
                  <td>{displayKm(vehicle.monthlyKm)}</td>

                  <td className="load-idle-description">
                    {vehicle.loadIdle || "-"}
                  </td>

                  <td>
                    <span
                      className={`vehicle-status-badge ${getVehicleStatus(vehicle)
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {getVehicleStatus(vehicle)}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        vehicle.attendance === "Absent"
                          ? "absent-badge"
                          : "present-badge"
                      }
                    >
                      {vehicle.attendance || "Present"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={14} className="no-log-records">
                  No vehicle records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="daily-summary-grid">
        <div className="daily-summary-card">
          <div className="daily-summary-icon">
            <Route size={22} />
          </div>

          <div>
            <span>Total Distance</span>
            <h2>{totalDistance.toLocaleString("en-IN")} km</h2>
          </div>
        </div>

        <div className="daily-summary-card">
          <div className="daily-summary-icon">
            <Fuel size={22} />
          </div>

          <div>
            <span>Total Diesel</span>
            <h2>{totalDiesel.toLocaleString("en-IN")} L</h2>
          </div>
        </div>
      </div>

      {showBulkEdit && (
        <div
          className="bulk-edit-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingBulk
            ) {
              setShowBulkEdit(false);
            }
          }}
        >
          <form
            className="bulk-edit-modal"
            onSubmit={saveAllChanges}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-edit-title"
          >
            <div className="bulk-edit-header">
              <div>
                <h2 id="bulk-edit-title">Edit Site Vehicle Table</h2>

                <p>
                  Site: <strong>{selectedSite}</strong>
                  {" · "}
                  Date: <strong>{formatSelectedDate(selectedDate)}</strong>
                  {" · "}
                  {bulkRows.length} vehicles
                  {" · "}
                  Month Open KM can be entered only once per month
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBulkEdit(false)}
                disabled={savingBulk}
                aria-label="Close edit table"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bulk-edit-table-wrapper">
              <table className="bulk-edit-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Vehicle No</th>
                    <th>Driver Phone</th>
                    <th>Transport Name</th>
                    <th>Vehicle Type</th>
                    <th>Site Name</th>
                    <th>Month Open KM</th>
                    <th>Starting KM</th>
                    <th>Closing KM</th>
                    <th>Today KM</th>
                    <th>Monthly KM</th>
                    <th>Load / Idle</th>
                    <th>Vehicle Status</th>
                    <th>Attendance</th>
                  </tr>
                </thead>

                <tbody>
                  {bulkRows.map((row, rowIndex) => (
                    <tr key={getVehicleId(row) ?? rowIndex}>
                      <td>{rowIndex + 1}</td>

                      <td>
                        <input
                          type="text"
                          value={row.vehicleNumber}
                          onChange={(event) =>
                            handleBulkChange(
                              rowIndex,
                              "vehicleNumber",
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          value={row.driverNumber}
                          onChange={(event) =>
                            handleBulkChange(
                              rowIndex,
                              "driverNumber",
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          value={row.transportProvider}
                          onChange={(event) =>
                            handleBulkChange(
                              rowIndex,
                              "transportProvider",
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          value={row.vehicleType}
                          onChange={(event) =>
                            handleBulkChange(
                              rowIndex,
                              "vehicleType",
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          value={row.siteName}
                          onChange={(event) =>
                            handleBulkChange(
                              rowIndex,
                              "siteName",
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="-"
                          value={row.monthOpenKm}
                          readOnly={row._hasMonthOpenKm}
                          title={
                            row._hasMonthOpenKm
                              ? "Month Open KM is already saved for this month"
                              : "Enter Month Open KM once for this month"
                          }
                          onChange={(event) =>
                            handleBulkChange(
                              rowIndex,
                              "monthOpenKm",
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="-"
                          value={row.startingKm}
                          onChange={(event) =>
                            handleBulkChange(
                              rowIndex,
                              "startingKm",
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="-"
                          value={row.closingKm}
                          readOnly
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="-"
                          value={row.todayKm}
                          onChange={(event) =>
                            handleBulkChange(
                              rowIndex,
                              "todayKm",
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="-"
                          value={row.monthlyKm}
                          readOnly
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          placeholder="Enter description"
                          value={row.loadIdle}
                          onChange={(event) =>
                            handleBulkChange(
                              rowIndex,
                              "loadIdle",
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <select
                          value={row.vehicleStatus || "Active"}
                          onChange={(event) =>
                            handleBulkChange(
                              rowIndex,
                              "vehicleStatus",
                              event.target.value
                            )
                          }
                        >
                          <option value="Active">Active</option>
                          <option value="Under Maintenance">
                            Under Maintenance
                          </option>
                          <option value="Under Induction">
                            Under Induction
                          </option>
                        </select>
                      </td>

                      <td>
                        <select
                          value={row.attendance}
                          onChange={(event) =>
                            handleBulkChange(
                              rowIndex,
                              "attendance",
                              event.target.value
                            )
                          }
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {bulkError && (
              <div className="bulk-edit-error">{bulkError}</div>
            )}

            <div className="bulk-edit-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowBulkEdit(false)}
                disabled={savingBulk}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-all-button"
                disabled={savingBulk}
              >
                <Save size={17} />

                {savingBulk
                  ? "Saving All..."
                  : "Save All Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {downloadType && (
        <div
          className="download-confirm-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDownloadType(null);
            }
          }}
        >
          <div
            className="download-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-confirm-title"
          >
            <h2 id="download-confirm-title">
              Download {downloadType === "excel" ? "Excel" : "PDF"}?
            </h2>

            <p>
              {filteredVehicles.length} currently displayed records
              will be downloaded.
            </p>

            <div className="download-confirm-actions">
              <button
                type="button"
                onClick={() => setDownloadType(null)}
              >
                Cancel
              </button>

              <button type="button" onClick={confirmDownload}>
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dailylog;