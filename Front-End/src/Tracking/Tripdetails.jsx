// Intercarting orders are managed in the Intercarting module.
const isIntercartingOrder = (order) => {
  const movement =
    order?.movementType ||
    order?.movement ||
    order?.movementName ||
    order?.movementCategory ||
    order?.orderFinalization?.movementType ||
    order?.enquiryDetails?.movementType ||
    "";
  return (
    String(movement)
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "") === "intercarting"
  );
};

const trackingApiFetch = (url, options = {}) => {
  const token = localStorage.getItem("token");
  if (!token?.trim()) {
    return Promise.reject(
      new Error("Please sign in with your main administrator account."),
    );
  }
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
};
import React, { useCallback, useMemo, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Navigation,
  MapPin,
  X,
  Save,
  MessageSquareText,
  Package,
  Plus,
  RefreshCw,
  Route,
  Truck,
  UserRound,
  FileText,
  Upload,
  Eye,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./Tripdetails.css";
import "./cranevehicles.css";
/* =========================================
   API
========================================= */
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");
const API_URL = `${API_BASE_URL}/api/triporders`;
/* =========================================
   HELPERS
========================================= */
const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeText = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  if (typeof value === "object") {
    if (value.$oid) {
      return String(value.$oid);
    }
    if (value.$date) {
      return String(value.$date);
    }
    return fallback;
  }
  return String(value);
};
/* =========================================
   RESPONSE
========================================= */
const extractTrips = (result) => {
  if (Array.isArray(result)) {
    return result;
  }
  if (Array.isArray(result?.data)) {
    return result.data;
  }
  if (Array.isArray(result?.trips)) {
    return result.trips;
  }
  if (Array.isArray(result?.orders)) {
    return result.orders;
  }
  return [];
};
/* =========================================
   NORMALIZE TRIP
========================================= */
// Keep archived allocations in trip data for History; filter current views only.
const getCurrentVehicles = (trip) =>
  safeArray(trip?.allocatedVehicles).filter(
    (vehicle) =>
      String(vehicle?.vehicleStatus || "")
        .trim()
        .toLowerCase() !== "replaced",
  );

const normalizeTrip = (trip, index) => {
  const allocatedVehicles = safeArray(trip?.allocatedVehicles);
  const vehicleRequirements = safeArray(trip?.vehicleRequirements);
  const trafficQuotations = safeArray(trip?.trafficQuotations);
  const vehicleConfirmations = safeArray(trip?.vehicleConfirmations);
  return {
    ...trip,
    id:
      safeText(trip?._id, "") || safeText(trip?.tripId, "") || `trip-${index}`,
    allocatedVehicles,
    vehicleRequirements,
    trafficQuotations,
    vehicleConfirmations,
  };
};
/* =========================================
   LATEST TRACKING
========================================= */
const getLatestTracking = (vehicle) => {
  const tracking = safeArray(vehicle?.dailyTracking);
  if (!tracking.length) {
    return null;
  }
  return tracking[tracking.length - 1];
};
/* =========================================
   TRIP STATUS
========================================= */
const getVehicleDisplayStatus = (vehicle) => {
  const latest = getLatestTracking(vehicle);
  const rawStatus = safeText(latest?.status, "Idle");
  if (rawStatus.trim().toLowerCase() !== "reached") {
    return rawStatus;
  }
  const unloadingCompleted =
    String(vehicle?.unloading?.status || "")
      .trim()
      .toLowerCase() === "completed";
  const lrCompleted = Boolean(
    vehicle?.lr?.number || vehicle?.lr?.date || vehicle?.pod?.fileName,
  );
  const ewayStatus = String(vehicle?.ewayBill?.status || "")
    .trim()
    .toLowerCase();
  const ewayCompleted = Boolean(
    (vehicle?.ewayBill?.number || vehicle?.ewayBill?.fileName) &&
    ewayStatus !== "pending",
  );
  return unloadingCompleted && lrCompleted && ewayCompleted
    ? "Reached"
    : "Pending";
};
const getTripStatus = (trip) => {
  const vehicles = getCurrentVehicles(trip);
  if (!vehicles.length) return "Pending";
  const statuses = vehicles.map(getVehicleDisplayStatus);
  const normalized = statuses.map((status) =>
    String(status || "")
      .trim()
      .toLowerCase(),
  );
  if (normalized.every((status) => status === "reached")) return "Reached";
  if (normalized.some((status) => status === "breakdown")) return "Breakdown";
  if (normalized.some((status) => status === "moving")) return "Moving";
  if (normalized.some((status) => status === "stopped")) return "Stopped";
  if (normalized.some((status) => status === "pending")) return "Pending";
  return "Idle";
};
/* =========================================
   STATUS CLASS
========================================= */
const getStatusClass = (status) => {
  const value = String(status || "")
    .trim()
    .toLowerCase();
  if (value === "moving") {
    return "moving";
  }
  if (value === "idle") {
    return "idle";
  }
  if (value === "stopped") {
    return "stopped";
  }
  if (value === "breakdown") {
    return "breakdown";
  }
  if (value === "reached") {
    return "reached";
  }
  if (value === "confirmed") {
    return "confirmed";
  }
  return "pending";
};
/* =========================================
   MOVEMENT TYPE
========================================= */
const getMovementType = (trip) => {
  const rawMovement =
    trip?.movementType ||
    trip?.movement ||
    trip?.movementName ||
    trip?.movementCategory ||
    trip?.orderFinalization?.movementType ||
    trip?.enquiryDetails?.movementType ||
    "";
  if (rawMovement) {
    return safeText(rawMovement);
  }
  const material = String(trip?.materialType || "")
    .trim()
    .toLowerCase();
  if (
    material.includes("wtg") ||
    material.includes("blade") ||
    material.includes("nacelle") ||
    material.includes("tower")
  ) {
    return "WTG Movement";
  }
  if (
    trip?.craneMovement ||
    trip?.craneDetails ||
    trip?.craneDocument ||
    material.includes("crane")
  ) {
    return "Crane Movement";
  }
  return "-";
};
const getMovementClass = (movement) => {
  const value = String(movement || "")
    .trim()
    .toLowerCase();
  if (value.includes("crane")) return "crane";
  if (value.includes("wtg")) return "wtg";
  return "default";
};
/* =========================================
   FORMAT DATE
========================================= */
const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
const getLocalYmd = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getEwayBillStatus = (number, validUpto, today = getLocalYmd()) => {
  if (!String(number || "").trim() || !validUpto) return "Pending";
  const date = String(validUpto).slice(0, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(new Date(`${date}T00:00:00`).getTime())
  )
    return "Pending";
  const expiry = Date.parse(`${date}T00:00:00`);
  const current = Date.parse(`${today}T00:00:00`);
  const daysRemaining = Math.round((expiry - current) / 86400000);
  if (daysRemaining < 0) return "Expired";
  if (daysRemaining === 0) return "Expires Today";
  if (daysRemaining <= 7) return "Expiring Soon";
  return "Active";
};
const getEwayBillHeading = (number, validUpto, today = getLocalYmd()) => {
  const status = getEwayBillStatus(number, validUpto, today);
  if (status !== "Expiring Soon") return status;
  const [ey, em, ed] = String(validUpto).slice(0, 10).split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const days = Math.round(
    (Date.UTC(ey, em - 1, ed) - Date.UTC(ty, tm - 1, td)) / 86400000,
  );
  return `${days} ${days === 1 ? "Day" : "Days"} Left`;
};
const calculateHaltingDays = (pointInDate, pointOutDate = "") => {
  if (!pointInDate) return 0;
  const parseDate = (value) => {
    const [year, month, day] = String(value)
      .slice(0, 10)
      .split("-")
      .map(Number);
    if (!year || !month || !day) return null;
    return Date.UTC(year, month - 1, day);
  };
  const start = parseDate(pointInDate);
  const end = parseDate(pointOutDate || getLocalYmd());
  if (start === null || end === null || end < start) return 0;
  return Math.floor((end - start) / 86400000);
};
const movementDayFromLoading = (pointInDate, movementDate) => {
  if (!pointInDate || !movementDate) return 1;
  const parseDate = (value) => {
    const [year, month, day] = String(value)
      .slice(0, 10)
      .split("-")
      .map(Number);
    if (!year || !month || !day) return null;
    return Date.UTC(year, month - 1, day);
  };
  const start = parseDate(pointInDate);
  const current = parseDate(movementDate);
  if (start === null || current === null || current < start) return 1;
  return Math.floor((current - start) / 86400000) + 1;
};
// Build display rows without creating movement records for missing dates.
const buildEveryDayHistory = (
  entries,
  pointInDate,
  pointOutDate,
  today = getLocalYmd(),
) => {
  const dateKey = (value) => {
    const key = String(value || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return "";
    const time = Date.parse(`${key}T00:00:00Z`);
    return Number.isFinite(time) &&
      new Date(time).toISOString().slice(0, 10) === key
      ? key
      : "";
  };
  const saved = safeArray(entries);
  const start = dateKey(pointInDate);
  const end = dateKey(pointOutDate || today);
  if (!start || !end || end < start) {
    return saved
      .slice()
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }
  const grouped = new Map();
  for (const entry of saved) {
    const key = dateKey(entry.date);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(entry);
  }
  const first = Date.parse(`${start}T00:00:00Z`);
  const last = Date.parse(`${end}T00:00:00Z`);
  const rows = [];
  for (let time = last; time >= first; time -= 86400000) {
    const key = new Date(time).toISOString().slice(0, 10);
    const day = Math.floor((time - first) / 86400000) + 1;
    const updates = grouped.get(key);
    if (updates?.length) {
      rows.push(
        ...updates
          .slice()
          .reverse()
          .map((entry) => ({ ...entry, day, isMissingDay: false })),
      );
    } else {
      rows.push({ date: key, day, isMissingDay: true });
    }
  }
  // Retain legacy entries outside the selected date range.
  rows.push(
    ...saved.filter((entry) => {
      const key = dateKey(entry.date);
      return !key || key < start || key > end;
    }),
  );
  return rows;
};
// Trip duration includes both Loading Point In and Unloading Point Out.
const tripDaysThroughPointOut = (pointInDate, pointOutDate, movementDate) =>
  movementDayFromLoading(
    pointInDate,
    pointOutDate || movementDate || getLocalYmd(),
  );
/* =========================================
   COMPONENT
========================================= */
const openTripDocument = async ({
  baseUrl,
  tripId,
  allocationId,
  type,
  download = false,
  fileName = "",
}) => {
  const idText = (value) =>
    typeof value === "object" && value !== null
      ? String(value.$oid ?? "")
      : String(value ?? "");
  let preview = null;
  try {
    const mongoId = idText(tripId).trim();
    const vehicleId = idText(allocationId).trim();
    if (!mongoId || !vehicleId || mongoId === "[object Object]") {
      throw new Error(
        "Trip ID or allocation ID is missing. Reload the trip and try again.",
      );
    }
    if (!["lr", "ewayBill", "pod"].includes(type))
      throw new Error("Invalid document type.");
    if (!download) {
      preview = window.open("about:blank", "_blank");
      if (!preview)
        throw new Error("Allow pop-ups for this site to view the document.");
      preview.opener = null;
      preview.document.title = "Loading document";
      preview.document.body.textContent = "Loading document…";
    }
    const disposition = download ? "attachment" : "inline";
    const url = `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(mongoId)}/allocated-vehicles/${encodeURIComponent(vehicleId)}/${type}/file?disposition=${disposition}`;
    const response = await trackingApiFetch(url);
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      let message = "";
      if (contentType.includes("json")) {
        const error = await response.json().catch(() => ({}));
        message = error.message || error.error || "";
      }
      throw new Error(
        message ||
          `Document request failed (${response.status}). Check the backend file route and uploaded file.`,
      );
    }
    if (contentType.includes("json") || contentType.includes("text/html")) {
      throw new Error(
        "The server returned a page or JSON instead of a document. Check the backend file endpoint.",
      );
    }
    const blob = await response.blob();
    if (!blob.size) throw new Error("The document file is empty.");
    const objectUrl = URL.createObjectURL(blob);
    if (download) {
      const dispositionHeader =
        response.headers.get("content-disposition") || "";
      const match = dispositionHeader.match(/filename="([^"]+)"/i);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = (match?.[1] || fileName || `${type}-document`)
        .split(/[\\/]/)
        .pop();
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } else {
      preview.location.replace(objectUrl);
      const timer = window.setInterval(() => {
        if (preview.closed) {
          window.clearInterval(timer);
          URL.revokeObjectURL(objectUrl);
        }
      }, 2000);
    }
  } catch (error) {
    if (preview && !preview.closed) preview.close();
    console.error("Document request failed:", error);
    window.alert(error?.message || "Unable to open the document.");
  }
};

const isCraneTrip = (trip) =>
  ["crane", "cranemovement"].includes(
    String(trip?.movementType || "")
      .toLowerCase()
      .replace(/[\s_-]+/g, ""),
  );
const StandardTripdetails = ({ movementOnly = false }) => {
  const routeParams = useParams();
  const routeLocation = useLocation();

  const navigate = useNavigate();
  const [ewayToday, setEwayToday] = useState(getLocalYmd());
  useEffect(() => {
    const timer = window.setInterval(() => setEwayToday(getLocalYmd()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  /* =====================================
     STATE
  ===================================== */
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [movementTrip, setMovementTrip] = useState(null);
  const [movementVehicleId, setMovementVehicleId] = useState("");
  const [movementForm, setMovementForm] = useState(null);
  const [movementSaving, setMovementSaving] = useState(false);
  const [movementError, setMovementError] = useState("");
  const [movementSuccess, setMovementSuccess] = useState("");
  useEffect(() => {
    if (movementOnly && !movementTrip) return undefined;
    if (!movementSuccess && !movementError) return undefined;
    const timer = window.setTimeout(() => {
      setMovementSuccess("");
      setMovementError("");
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [movementSuccess, movementError]);
  /* =====================================
     FETCH TRIPS
  ===================================== */
  const fetchTrips = useCallback(async (manualRefresh = false) => {
    try {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const response = await trackingApiFetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }
      if (!response.ok) {
        throw new Error(result?.message || "Unable to load trips.");
      }
      const databaseTrips = extractTrips(result);
      /*
            Tracking trip list should
            contain orders that have
            actual allocated vehicles.
            The order remains stored in
            TripOrder as the single
            source of truth.
          */
      const trackingTrips = databaseTrips
        .filter((trip) => !isIntercartingOrder(trip))
        .map(normalizeTrip)
        .filter((trip) => {
          const stage = safeText(trip?.stage, "").trim().toLowerCase();
          const orderPlacedStatus = safeText(trip?.orderPlaced?.status, "")
            .trim()
            .toLowerCase();
          /*
                  Show the order in Tracking as soon as it has reached
                  the tracking flow, even when actual vehicle allocation
                  is still pending.
                  This intentionally does NOT depend on allocatedVehicles.
                  A trip with 0 allocated vehicles must remain visible so
                  the Tracking team can use the Allocate action.
                */
          const trackingStage =
            stage === "tracking" ||
            stage === "trip complete" ||
            stage === "trip completed" ||
            stage === "completed";
          const orderReleasedToTracking =
            orderPlacedStatus === "completed" ||
            orderPlacedStatus === "complete" ||
            orderPlacedStatus === "placed" ||
            orderPlacedStatus === "approved";
          return trackingStage || orderReleasedToTracking;
        });
      setTrips(trackingTrips);
    } catch (fetchError) {
      console.error("Fetch Trips Error:", fetchError);
      setError(fetchError?.message || "Unable to load trips.");
      setTrips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  /* =====================================
     INITIAL LOAD
  ===================================== */
  useEffect(() => {
    if (!movementOnly) fetchTrips();
  }, [fetchTrips, movementOnly]);
  /* =====================================
     TRACKING INPUT
  ===================================== */
  const handleCreateTrip = () => {
    /*
        Orders are no longer created
        from Tracking.
        This button now opens Tracking
        Input where approved requirements
        can receive actual vehicles.
      */
    navigate("/tracking-input");
  };
  /* =====================================
     EDIT / MANAGE TRIP
  ===================================== */
  const handleEditTrip = (trip) => {
    navigate("/tracking-input", {
      state: {
        mode: "edit",
        tripId: trip.tripId,
        mongoId: trip._id,
        trip,
      },
    });
  };
  const handleCraneVehicles = (event, trip) => {
    event.stopPropagation();
    const id = trip?._id || trip?.tripId;
    if (!id) {
      setError("This trip has no ID. Please refresh the list.");
      return;
    }
    navigate(`/crane-vehicles/${encodeURIComponent(id)}`, {
      state: {
        trip,
        mongoId: trip._id,
        tripId: trip.tripId,
        returnTo: routeLocation.pathname,
      },
    });
  };
  const handleAllocateTrip = (trip) => {
    navigate("/tracking-input", {
      state: {
        mode: "allocate",
        tripId: trip.tripId,
        mongoId: trip._id,
        trip,
      },
    });
  };
  const buildMovementForm = (vehicle) => {
    const history = safeArray(vehicle?.dailyTracking);
    const latest = history.length ? history[history.length - 1] : null;
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const previousTodayKm =
      latest?.todayKm !== undefined &&
      latest?.todayKm !== null &&
      latest?.todayKm !== ""
        ? Number(latest.todayKm)
        : null;
    return {
      date,
      day: movementDayFromLoading(vehicle?.loading?.pointInDate, date),
      yesterdayKm:
        history.length > 0 && Number.isFinite(previousTodayKm)
          ? previousTodayKm
          : "",
      todayKm: "",
      yesterdayLocation: latest?.currentLocation || "",
      currentLocation: "",
      status: "Idle",
      remarks: "",
      updatedBy: "",
      loadingStatus: vehicle?.loading?.status || "Pending",
      loadingPointInDate: vehicle?.loading?.pointInDate
        ? String(vehicle.loading.pointInDate).slice(0, 10)
        : "",
      loadingDate: vehicle?.loading?.loadingDate
        ? String(vehicle.loading.loadingDate).slice(0, 10)
        : "",
      loadingPointOutDate: vehicle?.loading?.pointOutDate
        ? String(vehicle.loading.pointOutDate).slice(0, 10)
        : "",
      loadingHaltingDays: calculateHaltingDays(
        vehicle?.loading?.pointInDate,
        vehicle?.loading?.pointOutDate,
      ),
      loadingRemarks: vehicle?.loading?.remarks || "",
      unloadingStatus: vehicle?.unloading?.status || "Pending",
      unloadingPointInDate: vehicle?.unloading?.pointInDate
        ? String(vehicle.unloading.pointInDate).slice(0, 10)
        : "",
      unloadingDate: vehicle?.unloading?.unloadingDate
        ? String(vehicle.unloading.unloadingDate).slice(0, 10)
        : "",
      unloadingPointOutDate: vehicle?.unloading?.pointOutDate
        ? String(vehicle.unloading.pointOutDate).slice(0, 10)
        : "",
      unloadingHaltingDays: calculateHaltingDays(
        vehicle?.unloading?.pointInDate,
        vehicle?.unloading?.pointOutDate,
      ),
      unloadingRemarks: vehicle?.unloading?.remarks || "",
      lrFile: null,
      lrNumber: vehicle?.lr?.number || "",
      lrDate: vehicle?.lr?.date ? String(vehicle.lr.date).slice(0, 10) : "",
      lrRemarks: vehicle?.lr?.remarks || "",
      podFile: null,
      ewayBillNumber: vehicle?.ewayBill?.number || "",
      ewayBillValidUpto: vehicle?.ewayBill?.validUpto
        ? String(vehicle.ewayBill.validUpto).slice(0, 10)
        : "",
      ewayBillStatus: getEwayBillStatus(
        vehicle?.ewayBill?.number,
        vehicle?.ewayBill?.validUpto,
      ),
      ewayBillFile: null,
    };
  };
  const handleMovementTrip = (trip) => {
    const vehicles = getCurrentVehicles(trip);
    setMovementTrip(trip);
    setMovementError("");
    setMovementSuccess("");
    if (vehicles.length) {
      const firstVehicle = vehicles[0];
      setMovementVehicleId(firstVehicle.allocationId || firstVehicle._id || "");
      setMovementForm(buildMovementForm(firstVehicle));
    } else {
      setMovementVehicleId("");
      setMovementForm(null);
    }
  };
  const closeMovementPopup = () => {
    if (movementSaving) return;
    if (movementOnly) {
      navigate(`/crane-vehicles/${encodeURIComponent(routeParams.id)}`, {
        state: { returnTo: routeLocation.state?.returnTo },
      });
      return;
    }
    setMovementTrip(null);
    setMovementVehicleId("");
    setMovementForm(null);
    setMovementError("");
    setMovementSuccess("");
  };
  const selectMovementVehicle = (vehicle) => {
    if (movementOnly) {
      navigate(
        `/crane-vehicles/${encodeURIComponent(routeParams.id)}/movement/${encodeURIComponent(vehicle.allocationId || vehicle._id)}`,
        { state: { returnTo: routeLocation.state?.returnTo } },
      );
      return;
    }
    setMovementVehicleId(vehicle.allocationId || vehicle._id || "");
    setMovementForm(buildMovementForm(vehicle));
    setMovementError("");
    setMovementSuccess("");
  };
  const updateMovementField = (name, value) => {
    setMovementError("");
    setMovementSuccess("");
    setMovementForm((previous) => {
      const next = { ...previous, [name]: value };
      if (name === "ewayBillNumber" || name === "ewayBillValidUpto") {
        next.ewayBillStatus = getEwayBillStatus(
          next.ewayBillNumber,
          next.ewayBillValidUpto,
        );
      }
      if (
        name === "loadingPointInDate" ||
        name === "loadingPointOutDate" ||
        name === "loadingStatus"
      ) {
        next.loadingHaltingDays = calculateHaltingDays(
          next.loadingPointInDate,
          next.loadingPointOutDate,
        );
      }
      if (
        name === "unloadingPointInDate" ||
        name === "unloadingPointOutDate" ||
        name === "unloadingStatus"
      ) {
        next.unloadingHaltingDays = calculateHaltingDays(
          next.unloadingPointInDate,
          next.unloadingPointOutDate,
        );
      }
      next.day = movementDayFromLoading(next.loadingPointInDate, next.date);
      return next;
    });
  };
  const uploadMovementDocument = async ({
    mongoId,
    allocationId,
    type,
    number,
    date,
    validUpto,
    status,
    remarks,
    file,
    existingDocument,
    uploadedBy,
    requireFile = true,
  }) => {
    const hasExistingFile = Boolean(existingDocument?.fileName);
    const hasEnteredData = Boolean(
      String(number || "").trim() ||
      date ||
      validUpto ||
      String(remarks || "").trim() ||
      file ||
      hasExistingFile,
    );
    if (!hasEnteredData) {
      return existingDocument || null;
    }
    if (type === "lr" && !String(number || "").trim()) {
      throw new Error("LR Number is required when saving LR.");
    }
    if (requireFile && !file && !hasExistingFile) {
      const label = type === "ewayBill" ? "E-Way Bill" : type.toUpperCase();
      throw new Error(`${label} document is required.`);
    }
    const formData = new FormData();
    formData.append("number", String(number || "").trim());
    formData.append("date", date || "");
    formData.append("validUpto", validUpto || "");
    formData.append("status", status || "Pending");
    formData.append("remarks", String(remarks || "").trim());
    formData.append("uploadedBy", String(uploadedBy || "Tracking").trim());
    if (file) {
      formData.append("document", file);
      formData.append("documentName", file.name);
    }
    const response = await trackingApiFetch(
      `${API_URL}/${mongoId}/allocated-vehicles/${allocationId}/${type}`,
      {
        method: "PUT",
        body: formData,
      },
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const label = type === "ewayBill" ? "E-Way Bill" : type.toUpperCase();
      throw new Error(result?.message || `Unable to save ${label} document.`);
    }
    const updatedVehicle = safeArray(result?.data?.allocatedVehicles).find(
      (item) => item.allocationId === allocationId,
    );
    return (
      updatedVehicle?.[type] || {
        ...existingDocument,
        number: String(number || "").trim(),
        date: date || null,
        validUpto: validUpto || null,
        status: status || "Pending",
        remarks: String(remarks || "").trim(),
        fileName: file?.name || existingDocument?.fileName || "",
      }
    );
  };
  const viewMovementDocument = (vehicle, type) =>
    openTripDocument({
      baseUrl: API_URL,
      tripId: movementTrip?._id,
      allocationId: vehicle?.allocationId,
      type,
      fileName: vehicle?.[type]?.originalName || vehicle?.[type]?.fileName,
    });
  const removeMovementFile = async (type, selectedOnly = false) => {
    if (!movementTrip || !movementVehicleId || movementSaving) return;
    const field = { lr: "lrFile", ewayBill: "ewayBillFile", pod: "podFile" }[
      type
    ];
    if (!field) return;
    if (selectedOnly) {
      setMovementForm((previous) => ({ ...previous, [field]: null }));
      setMovementError("");
      return;
    }
    const vehicle = getCurrentVehicles(movementTrip).find(
      (item) => (item.allocationId || item._id) === movementVehicleId,
    );
    if (!vehicle) return;
    try {
      setMovementSaving(true);
      setMovementError("");
      setMovementSuccess("");
      const mongoId = movementTrip._id?.$oid || movementTrip._id;
      const response = await trackingApiFetch(
        `${API_URL}/${mongoId}/allocated-vehicles/${vehicle.allocationId}/${type}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ removeFile: true }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result?.message || "Unable to remove file.");
      const updatedVehicle = safeArray(result?.data?.allocatedVehicles).find(
        (item) => item.allocationId === vehicle.allocationId,
      );
      if (!updatedVehicle)
        throw new Error(
          "File removal response is incomplete. Refresh the trip.",
        );
      setMovementTrip((previous) => ({
        ...previous,
        allocatedVehicles: safeArray(previous?.allocatedVehicles).map((item) =>
          (item.allocationId || item._id) === movementVehicleId
            ? { ...item, [type]: updatedVehicle[type] || {} }
            : item,
        ),
      }));
      setMovementForm((previous) => ({ ...previous, [field]: null }));
      setMovementSuccess("Uploaded file removed. Document details kept.");
      await fetchTrips(true);
    } catch (error) {
      setMovementError(error?.message || "Unable to remove file.");
    } finally {
      setMovementSaving(false);
    }
  };

  const saveMovement = async () => {
    if (!movementTrip || !movementForm || !movementVehicleId) return;
    const vehicle = getCurrentVehicles(movementTrip).find(
      (item) => (item.allocationId || item._id) === movementVehicleId,
    );
    if (!vehicle) return;
    if (String(vehicle.vehicleStatus || "").toLowerCase() === "replaced") {
      setMovementError(
        "This vehicle was replaced. Its saved records are read-only.",
      );
      return;
    }
    const history = safeArray(vehicle.dailyTracking);
    const latest = history.length ? history[history.length - 1] : null;
    const currentLocation = String(movementForm.currentLocation || "").trim();
    const updatedBy = String(movementForm.updatedBy || "").trim();
    const selectedDate = String(movementForm.date || "").trim();
    const yesterdayKm = Number(movementForm.yesterdayKm);
    const todayKm = Number(movementForm.todayKm);
    /*
      IMPORTANT:
      If the last saved movement is already Reached, the user may still
      need to finish Unloading / LR / POD / E-Way Bill.
      In that case we save vehicle operations + documents without forcing
      another daily movement entry.
      If the user starts entering a new movement (location/KM/updated by),
      the normal movement validation and tracking POST still run.
    */
    const latestRawStatus = String(latest?.status || "")
      .trim()
      .toLowerCase();
    const hasMovementEntryData = Boolean(
      currentLocation ||
      updatedBy ||
      (movementForm.todayKm !== "" &&
        movementForm.todayKm !== null &&
        movementForm.todayKm !== undefined) ||
      String(movementForm.remarks || "").trim(),
    );
    const loadingCompleted =
      String(movementForm.loadingStatus || "")
        .trim()
        .toLowerCase() === "completed";
    // One save action: allow operations/documents before loading is complete.
    const shouldSaveTracking = loadingCompleted && hasMovementEntryData;
    const unloadingCompleted =
      String(movementForm.unloadingStatus || "")
        .trim()
        .toLowerCase() === "completed";
    const validateDateOrder = (label, values) => {
      const dates = values.filter(Boolean);
      for (let index = 1; index < dates.length; index += 1) {
        if (dates[index] < dates[index - 1]) {
          return `${label} dates are not in the correct order.`;
        }
      }
      return "";
    };
    /*
      Loading / unloading validations must always run because these
      details are saved even when no new daily tracking row is created.
    */
    if (
      shouldSaveTracking &&
      movementForm.unloadingPointOutDate &&
      selectedDate > movementForm.unloadingPointOutDate
    ) {
      setMovementError(
        "Movement date cannot be after Unloading Point Out Date.",
      );
      return;
    }
    const loadingDateError = validateDateOrder("Loading", [
      movementForm.loadingPointInDate,
      movementForm.loadingDate,
      movementForm.loadingPointOutDate,
    ]);
    if (loadingDateError) {
      setMovementError(loadingDateError);
      return;
    }
    const unloadingDateError = validateDateOrder("Unloading", [
      movementForm.unloadingPointInDate,
      movementForm.unloadingDate,
      movementForm.unloadingPointOutDate,
    ]);
    if (unloadingDateError) {
      setMovementError(unloadingDateError);
      return;
    }
    if (
      movementForm.loadingStatus === "Completed" &&
      !movementForm.loadingPointOutDate
    ) {
      setMovementError(
        "Loading Point Out Date is required when loading is completed.",
      );
      return;
    }
    if (
      movementForm.unloadingStatus === "Completed" &&
      !movementForm.unloadingPointOutDate
    ) {
      setMovementError(
        "Unloading Point Out Date is required when unloading is completed.",
      );
      return;
    }
    if (movementForm.podFile && !unloadingCompleted) {
      setMovementError(
        "POD can be uploaded only after unloading is completed.",
      );
      return;
    }
    /*
      Validate Daily Tracking only when movement fields are entered.
      Loading, LR and E-Way Bill can be saved independently.
    */
    if (shouldSaveTracking) {
      if (!selectedDate) {
        setMovementError("Movement date is required.");
        return;
      }
      if (!currentLocation) {
        setMovementError("Current location is required.");
        return;
      }
      if (!updatedBy) {
        setMovementError("Updated By is required.");
        return;
      }
      if (
        movementForm.todayKm === "" ||
        movementForm.todayKm === null ||
        movementForm.todayKm === undefined
      ) {
        setMovementError("Today KM is required.");
        return;
      }
      if (!Number.isFinite(yesterdayKm) || yesterdayKm < 0) {
        setMovementError("Yesterday KM must be a valid non-negative number.");
        return;
      }
      if (!Number.isFinite(todayKm) || todayKm < 0) {
        setMovementError("Today KM must be a valid non-negative number.");
        return;
      }
      if (todayKm < yesterdayKm) {
        setMovementError(
          `Today KM cannot be less than Yesterday KM (${yesterdayKm} KM).`,
        );
        return;
      }
      const latestDate = latest?.date ? String(latest.date).slice(0, 10) : "";
      if (latestDate && selectedDate <= latestDate) {
        setMovementError(
          `Movement date must be after the previous update (${formatDate(
            latest.date,
          )}).`,
        );
        return;
      }
      if (
        history.some(
          (item) => String(item?.date || "").slice(0, 10) === selectedDate,
        )
      ) {
        setMovementError("A movement update already exists for this date.");
        return;
      }
    }
    const runningKm = shouldSaveTracking ? todayKm - yesterdayKm : 0;
    const payload = shouldSaveTracking
      ? {
          date: movementForm.date,
          day: movementDayFromLoading(
            movementForm.loadingPointInDate,
            movementForm.date,
          ),
          yesterdayKm,
          todayKm,
          runningKm,
          yesterdayLocation: String(
            movementForm.yesterdayLocation || "",
          ).trim(),
          currentLocation,
          status: movementForm.status || "Idle",
          remarks: String(movementForm.remarks || "").trim(),
          updatedBy,
        }
      : null;
    try {
      setMovementSaving(true);
      setMovementError("");
      setMovementSuccess("");
      const mongoId = movementTrip._id?.$oid || movementTrip._id;
      /*
        ALWAYS save Loading / Unloading.
        This is the important fix for a reached vehicle where the user
        completes unloading and then uploads the remaining documents.
      */
      const allocationPayload = {
        vehicleNumber: String(vehicle.vehicleNumber || "")
          .trim()
          .toUpperCase(),
        driver: {
          name: String(vehicle?.driver?.name || "").trim(),
          contactNumber: String(vehicle?.driver?.contactNumber || "").trim(),
        },
        escort: {
          vehicleNumber: String(vehicle?.escort?.vehicleNumber || "")
            .trim()
            .toUpperCase(),
          name: String(vehicle?.escort?.name || "").trim(),
          contactNumber: String(vehicle?.escort?.contactNumber || "").trim(),
        },
        supervisor: {
          name: String(vehicle?.supervisor?.name || "").trim(),
          contactNumber: String(
            vehicle?.supervisor?.contactNumber || "",
          ).trim(),
        },
        loading: {
          status: movementForm.loadingStatus || "Pending",
          pointInDate: movementForm.loadingPointInDate || null,
          loadingDate: movementForm.loadingDate || null,
          pointOutDate: movementForm.loadingPointOutDate || null,
          haltingDays: calculateHaltingDays(
            movementForm.loadingPointInDate,
            movementForm.loadingPointOutDate,
          ),
          remarks: String(movementForm.loadingRemarks || "").trim(),
        },
        unloading: {
          status: movementForm.unloadingStatus || "Pending",
          pointInDate: movementForm.unloadingPointInDate || null,
          unloadingDate: movementForm.unloadingDate || null,
          pointOutDate: movementForm.unloadingPointOutDate || null,
          haltingDays: calculateHaltingDays(
            movementForm.unloadingPointInDate,
            movementForm.unloadingPointOutDate,
          ),
          remarks: String(movementForm.unloadingRemarks || "").trim(),
        },
      };
      const allocationResponse = await trackingApiFetch(
        `${API_URL}/${mongoId}/allocated-vehicles/${vehicle.allocationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(allocationPayload),
        },
      );
      const allocationResult = await allocationResponse
        .json()
        .catch(() => ({}));
      if (!allocationResponse.ok) {
        throw new Error(
          allocationResult?.message ||
            "Unable to update loading / unloading details.",
        );
      }
      /*
        Only create a daily tracking row when this is an actual new
        movement update. A reached vehicle can therefore save only
        operations/documents without Current Location / KM / Updated By.
      */
      if (shouldSaveTracking) {
        const response = await trackingApiFetch(
          `${API_URL}/${mongoId}/allocated-vehicles/${vehicle.allocationId}/tracking`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result?.message || "Unable to save movement.");
        }
      }
      /*
        Documents are independent from daily tracking.
        Keep the existing upload endpoints and validation behavior.
      */
      const savedLr = await uploadMovementDocument({
        mongoId,
        allocationId: vehicle.allocationId,
        type: "lr",
        number: movementForm.lrNumber,
        date: movementForm.lrDate,
        remarks: movementForm.lrRemarks,
        file: movementForm.lrFile,
        existingDocument: vehicle?.lr,
        uploadedBy: movementForm.updatedBy || "Tracking",
        requireFile: false,
      });
      const savedPod = unloadingCompleted
        ? await uploadMovementDocument({
            mongoId,
            allocationId: vehicle.allocationId,
            type: "pod",
            file: movementForm.podFile,
            existingDocument: vehicle?.pod,
            uploadedBy: movementForm.updatedBy || "Tracking",
            requireFile: true,
          })
        : vehicle?.pod || null;
      const savedEwayBill = await uploadMovementDocument({
        mongoId,
        allocationId: vehicle.allocationId,
        type: "ewayBill",
        number: movementForm.ewayBillNumber,
        validUpto: movementForm.ewayBillValidUpto,
        status: getEwayBillStatus(
          movementForm.ewayBillNumber,
          movementForm.ewayBillValidUpto,
        ),
        file: movementForm.ewayBillFile,
        existingDocument: vehicle?.ewayBill,
        uploadedBy: movementForm.updatedBy || "Tracking",
        requireFile: false,
      });
      /*
        Build the selected vehicle locally with the exact values just
        saved so the popup does not jump back to old Pending data.
      */
      const nextVehicle = {
        ...vehicle,
        loading: allocationPayload.loading,
        unloading: allocationPayload.unloading,
        lr: savedLr || vehicle?.lr || {},
        pod: savedPod || vehicle?.pod || {},
        ewayBill: savedEwayBill || vehicle?.ewayBill || {},
        dailyTracking:
          shouldSaveTracking && payload
            ? [...safeArray(vehicle.dailyTracking), payload]
            : safeArray(vehicle.dailyTracking),
      };
      /*
        Update the popup immediately before/while the main trip list is
        refreshed from the server.
      */
      setMovementTrip((previous) => ({
        ...previous,
        allocatedVehicles: safeArray(previous?.allocatedVehicles).map((item) =>
          (item.allocationId || item._id) === movementVehicleId
            ? nextVehicle
            : item,
        ),
      }));
      setMovementForm(buildMovementForm(nextVehicle));
      setMovementSuccess(
        shouldSaveTracking
          ? `Movement updated for ${vehicle.vehicleNumber || "vehicle"}.`
          : loadingCompleted
            ? `Loading, unloading and documents updated for ${vehicle.vehicleNumber || "vehicle"}.`
            : "Loading details and documents saved. Daily movement will be recorded after loading is completed.",
      );
      /*
        Refresh the main Tracking page data after the local popup state
        has been updated.
      */
      await fetchTrips(true);
    } catch (saveError) {
      setMovementError(saveError?.message || "Unable to save movement.");
    } finally {
      setMovementSaving(false);
    }
  };
  const handleBack = () => {
    navigate("/tracking");
  };
  useEffect(() => {
    if (!movementOnly) return undefined;
    const controller = new AbortController();
    const id = routeParams.id;
    const endpoint = /^[a-f\d]{24}$/i.test(id || "")
      ? `${API_URL}/${encodeURIComponent(id)}`
      : `${API_URL}/trip/${encodeURIComponent(id || "")}`;
    setMovementTrip(null);
    setMovementError("");
    (async () => {
      try {
        const response = await trackingApiFetch(endpoint, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.message || "Unable to load Crane movement.");
        const trip =
          payload?.data?.trip ||
          payload?.data?.order ||
          payload?.data ||
          payload?.trip ||
          payload?.order ||
          payload;
        if (!isCraneTrip(trip))
          throw new Error("This movement page is for Crane orders.");
        const vehicle = getCurrentVehicles(trip).find(
          (item) =>
            String(item.allocationId || item._id) === routeParams.allocationId,
        );
        if (!vehicle) throw new Error("The selected vehicle was not found.");
        if (controller.signal.aborted) return;
        setMovementTrip(trip);
        setMovementVehicleId(vehicle.allocationId || vehicle._id);
        setMovementForm(buildMovementForm(vehicle));
      } catch (error) {
        if (!controller.signal.aborted)
          setMovementError(error.message || "Unable to load movement.");
      }
    })();
    return () => controller.abort();
  }, [movementOnly, routeParams.id, routeParams.allocationId]);
  /* =====================================
     RENDER
  ===================================== */
  return (
    <main
      className={
        movementOnly ? "trip-list-page crane-movement-page" : "trip-list-page"
      }
    >
      {movementOnly && !movementTrip && (
        <div className="crane-page-message">
          <button
            type="button"
            onClick={() =>
              navigate(`/crane-vehicles/${encodeURIComponent(routeParams.id)}`)
            }
          >
            Back to Vehicles
          </button>
          <p role="status">{movementError || "Loading vehicle movement..."}</p>
        </div>
      )}
      {!movementOnly && (
        <>
          {/* =================================
          TOP ACTION BAR
      ================================= */}
          <div className="trip-page-actions">
            <button
              type="button"
              className="trip-back-button"
              onClick={handleBack}
            >
              <ArrowLeft size={16} />
              <span>Back to Tracking</span>
            </button>
          </div>
          {/* =================================
          PAGE HEADING
      ================================= */}
          <header className="trip-page-header">
            <div>
              <span className="trip-page-eyebrow">FLEET OPERATIONS</span>
              <h1>Trip List</h1>
              <p>View and manage all vehicle tracking trips.</p>
            </div>
            <div className="trip-page-header-actions">
              <span className="trip-total-badge">
                <Truck size={14} />
                {trips.length}
                {trips.length === 1 ? " Trip" : " Trips"}
              </span>
              <button
                type="button"
                className="trip-refresh-button"
                disabled={refreshing}
                onClick={() => fetchTrips(true)}
                aria-label="Refresh trips"
              >
                <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              </button>
            </div>
          </header>
          {/* =================================
          ERROR
      ================================= */}
          {error && <div className="trip-page-error">{error}</div>}
          {/* =================================
          LIST CARD
      ================================= */}
          <section className="trip-table-card">
            <div className="trip-table-header">
              <div>
                <h2>All Trips</h2>
                <p>Complete trip and consignment overview.</p>
              </div>
            </div>
            {/* =============================
            DESKTOP COLUMN TITLES
        ============================= */}
            <div className="trip-list-column-head">
              <span>Trip</span>
              <span>Customer</span>
              <span>Material</span>
              <span>Movement</span>
              <span>Route</span>
              <span>Vehicles</span>
              <span>Status</span>
              <span>Created</span>
              <span className="trip-action-heading">Action</span>
            </div>
            {/* =============================
            BODY
        ============================= */}
            <div className="trip-full-list">
              {loading ? (
                <div className="trip-page-loading">
                  <RefreshCw size={20} className="spin" />
                  <span>Loading trips...</span>
                </div>
              ) : trips.length > 0 ? (
                trips.map((trip, index) => {
                  const allocatedVehicleCount = getCurrentVehicles(trip).length;
                  const requirementVehicleCount = safeArray(
                    trip?.vehicleRequirements,
                  ).reduce((total, requirement) => {
                    const quantity = Number(
                      requirement?.quantity ??
                        requirement?.qty ??
                        requirement?.requiredQuantity ??
                        0,
                    );
                    return total + (Number.isFinite(quantity) ? quantity : 0);
                  }, 0);
                  const requiredVehicleCount =
                    requirementVehicleCount > 0
                      ? requirementVehicleCount
                      : Number(trip?.totalVehicles || 0);
                  const pendingVehicleCount = Math.max(
                    requiredVehicleCount - allocatedVehicleCount,
                    0,
                  );
                  const tripStatus = getTripStatus(trip);
                  const statusClass = getStatusClass(tripStatus);
                  const movementType = getMovementType(trip);
                  const movementClass = getMovementClass(movementType);
                  return (
                    <article key={trip.id} className="trip-full-row">
                      {/* =====================
                        TRIP
                    ===================== */}
                      <div className="trip-row-main">
                        <span className="trip-mobile-label">Trip</span>
                        <div className="trip-id-box">
                          <div className="trip-id-icon">
                            <Route size={16} />
                          </div>
                          <div>
                            <strong>{safeText(trip.tripId)}</strong>
                            <small>#{index + 1}</small>
                          </div>
                        </div>
                      </div>
                      {/* =====================
                        CUSTOMER
                    ===================== */}
                      <div className="trip-row-cell">
                        <span className="trip-mobile-label">Customer</span>
                        <div className="trip-cell-with-icon">
                          <UserRound size={14} />
                          <strong>{safeText(trip.customer)}</strong>
                        </div>
                      </div>
                      {/* =====================
                        MATERIAL
                    ===================== */}
                      <div className="trip-row-cell">
                        <span className="trip-mobile-label">Material</span>
                        <div className="trip-cell-with-icon">
                          <Package size={14} />
                          <span>{safeText(trip.materialType)}</span>
                        </div>
                      </div>
                      {/* =====================
                        MOVEMENT
                    ===================== */}
                      <div className="trip-row-cell trip-movement-type-cell">
                        <span className="trip-mobile-label">Movement</span>
                        <span
                          className={`trip-movement-type-badge ${movementClass}`}
                          title={movementType}
                        >
                          <Navigation size={12} />
                          <span>{movementType}</span>
                        </span>
                      </div>
                      {/* =====================
                        ROUTE
                    ===================== */}
                      <div className="trip-row-cell trip-route-cell">
                        <span className="trip-mobile-label">Route</span>
                        <div className="trip-row-route">
                          <MapPin size={14} />
                          <span>{safeText(trip.origin)}</span>
                          <ChevronRight size={13} />
                          <span>{safeText(trip.destination)}</span>
                        </div>
                      </div>
                      {/* =====================
                        VEHICLES
                    ===================== */}
                      <div className="trip-row-cell">
                        <span className="trip-mobile-label">Vehicles</span>
                        {isCraneTrip(trip) ? (
                          <button
                            type="button"
                            className="trip-row-vehicle-count"
                            style={{ cursor: "pointer", fontFamily: "inherit" }}
                            onClick={(event) =>
                              handleCraneVehicles(event, trip)
                            }
                            title="Open Crane Vehicles"
                          >
                            <Truck size={14} />
                            {allocatedVehicleCount}{" "}
                            {allocatedVehicleCount === 1
                              ? "Vehicle"
                              : "Vehicles"}
                          </button>
                        ) : (
                          <span className="trip-row-vehicle-count">
                            <Truck size={14} />
                            {allocatedVehicleCount}/{requiredVehicleCount}
                          </span>
                        )}
                        {!isCraneTrip(trip) && pendingVehicleCount > 0 && (
                          <small className="trip-row-vehicle-pending">
                            {pendingVehicleCount} Pending
                          </small>
                        )}
                      </div>
                      {/* =====================
                        STATUS
                    ===================== */}
                      <div className="trip-row-cell">
                        <span className="trip-mobile-label">Status</span>
                        <span className={`trip-status-badge ${statusClass}`}>
                          {tripStatus}
                        </span>
                      </div>
                      {/* =====================
                        CREATED DATE
                    ===================== */}
                      <div className="trip-row-cell">
                        <span className="trip-mobile-label">Created</span>
                        <div className="trip-date-cell">
                          <CalendarDays size={13} />
                          <span>{formatDate(trip.createdAt)}</span>
                        </div>
                      </div>
                      {/* =====================
                        MANAGE
                    ===================== */}
                      <div className="trip-row-actions">
                        <span className="trip-mobile-label">Action</span>
                        <div className="trip-action-buttons">
                          <button
                            type="button"
                            className="trip-action-button allocate"
                            onClick={() => handleAllocateTrip(trip)}
                            title="Allocate Vehicle"
                          >
                            <Truck size={13} />
                            <span>Allocate</span>
                          </button>
                          <button
                            type="button"
                            className="trip-action-button movement"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (isCraneTrip(trip))
                                handleCraneVehicles(event, trip);
                              else handleMovementTrip(trip);
                            }}
                            title={
                              isCraneTrip(trip)
                                ? "View Crane Vehicles"
                                : "Update Movement"
                            }
                          >
                            {isCraneTrip(trip) ? (
                              <Truck size={13} />
                            ) : (
                              <Navigation size={13} />
                            )}
                            <span>
                              {isCraneTrip(trip) ? "Vehicles" : "Movement"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="trip-empty-state">
                  <div className="trip-empty-icon">
                    <Truck size={24} />
                  </div>
                  <strong>No Trips Found</strong>
                  <p>
                    Orders will appear here after they are placed and released
                    to Tracking.
                  </p>
                  <button type="button" onClick={handleCreateTrip}>
                    <Plus size={15} />
                    Tracking Input
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}
      {movementTrip && (
        <div
          className="trip-movement-overlay"
          role={movementOnly ? "region" : "dialog"}
          aria-modal={movementOnly ? undefined : true}
          onMouseDown={(event) => {
            if (!movementOnly && event.target === event.currentTarget)
              closeMovementPopup();
          }}
        >
          <div className="trip-movement-modal">
            <header className="trip-movement-head">
              <div className="trip-movement-title">
                <span className="trip-movement-title-icon">
                  <Navigation size={18} />
                </span>
                <div>
                  <small>VEHICLE MOVEMENT</small>
                  <h2>{safeText(movementTrip.tripId)}</h2>
                  <p>
                    {safeText(movementTrip.origin)} →{" "}
                    {safeText(movementTrip.destination)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="trip-movement-close"
                onClick={closeMovementPopup}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>
            <div className="trip-movement-body">
              {getCurrentVehicles(movementTrip).length === 0 ? (
                <div className="trip-movement-empty">
                  No allocated vehicles are available for this trip.
                </div>
              ) : (
                <>
                  <div className="trip-movement-vehicle-tabs">
                    {getCurrentVehicles(movementTrip).map((vehicle, index) => {
                      const id =
                        vehicle.allocationId ||
                        vehicle._id ||
                        `vehicle-${index}`;
                      const latest = getLatestTracking(vehicle);
                      return (
                        <button
                          type="button"
                          key={id}
                          className={`trip-movement-vehicle-tab ${movementVehicleId === id ? "active" : ""}`}
                          onClick={() => selectMovementVehicle(vehicle)}
                        >
                          <Truck size={14} />
                          <span>
                            <strong>
                              {safeText(
                                vehicle.vehicleNumber,
                                `Vehicle ${index + 1}`,
                              )}
                            </strong>

                            <small>{getVehicleDisplayStatus(vehicle)}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const vehicle = getCurrentVehicles(movementTrip).find(
                      (item) =>
                        (item.allocationId || item._id) === movementVehicleId,
                    );
                    if (!vehicle || !movementForm) return null;
                    const latest = getLatestTracking(vehicle);
                    const unloadingEnabled =
                      String(latest?.status || "")
                        .trim()
                        .toLowerCase() === "reached" ||
                      String(movementForm.status || "")
                        .trim()
                        .toLowerCase() === "reached";
                    const unloadingCompleted =
                      String(
                        movementForm.unloadingStatus ||
                          vehicle?.unloading?.status ||
                          "",
                      )
                        .trim()
                        .toLowerCase() === "completed";
                    const history = buildEveryDayHistory(
                      vehicle.dailyTracking,
                      movementForm.loadingPointInDate,
                      movementForm.unloadingPointOutDate,
                      ewayToday,
                    );
                    const historyDayCount = new Set(
                      history.map((item) =>
                        String(item.date || "").slice(0, 10),
                      ),
                    ).size;
                    const savedUpdateCount = safeArray(
                      vehicle.dailyTracking,
                    ).length;
                    return (
                      <>
                        <section className="trip-movement-summary">
                          <div>
                            <span>Vehicle</span>
                            <strong>
                              <Truck size={13} />
                              {safeText(vehicle.vehicleNumber)}
                            </strong>
                          </div>
                          <div>
                            <span>Current Location</span>
                            <strong>
                              <MapPin size={13} />
                              {safeText(latest?.currentLocation)}
                            </strong>
                          </div>
                          <div>
                            <span>Running KM</span>
                            <strong>
                              <Route size={13} />
                              {latest?.runningKm ?? 0} KM
                            </strong>
                          </div>
                          <div>
                            <span>Status</span>
                            <strong>{getVehicleDisplayStatus(vehicle)}</strong>
                          </div>
                          <div>
                            <span>Driver</span>
                            <strong>
                              <UserRound size={13} />
                              {safeText(vehicle?.driver?.name)}
                            </strong>
                          </div>
                        </section>
                        <section className="trip-movement-form-card">
                          <div className="trip-movement-section-title">
                            <div>
                              <small>DAILY TRACKING</small>
                              <h3>Add Movement Details</h3>
                            </div>
                            <span>
                              Day{" "}
                              {tripDaysThroughPointOut(
                                movementForm.loadingPointInDate,
                                movementForm.unloadingPointOutDate,
                                movementForm.date,
                              )}
                            </span>
                          </div>
                          <div className="trip-movement-form-grid">
                            <label>
                              <span>Date</span>
                              <input
                                type="date"
                                value={movementForm.date}
                                onChange={(e) =>
                                  updateMovementField("date", e.target.value)
                                }
                              />
                            </label>
                            <label>
                              <span>Day</span>
                              <input
                                type="number"
                                min="1"
                                value={tripDaysThroughPointOut(
                                  movementForm.loadingPointInDate,
                                  movementForm.unloadingPointOutDate,
                                  movementForm.date,
                                )}
                                readOnly
                              />
                            </label>
                            <label>
                              <span>
                                {movementForm.day === 1
                                  ? "Starting Odometer KM *"
                                  : "Yesterday KM"}
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={movementForm.yesterdayKm}
                                onChange={(e) =>
                                  updateMovementField(
                                    "yesterdayKm",
                                    e.target.value,
                                  )
                                }
                                readOnly={movementForm.day > 1}
                                placeholder={
                                  movementForm.day === 1
                                    ? "Enter vehicle odometer KM"
                                    : ""
                                }
                              />
                            </label>
                            <label>
                              <span>Today KM *</span>
                              <input
                                type="number"
                                min={movementForm.yesterdayKm || 0}
                                value={movementForm.todayKm}
                                onChange={(e) =>
                                  updateMovementField("todayKm", e.target.value)
                                }
                                placeholder="Enter cumulative KM"
                              />
                            </label>
                            <label>
                              <span>Yesterday Location</span>
                              <input
                                value={movementForm.yesterdayLocation}
                                onChange={(e) =>
                                  updateMovementField(
                                    "yesterdayLocation",
                                    e.target.value,
                                  )
                                }
                              />
                            </label>
                            <label>
                              <span>Current Location *</span>
                              <input
                                value={movementForm.currentLocation}
                                onChange={(e) =>
                                  updateMovementField(
                                    "currentLocation",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter current location"
                              />
                            </label>
                            <label>
                              <span>Status</span>
                              <select
                                value={movementForm.status}
                                onChange={(e) =>
                                  updateMovementField("status", e.target.value)
                                }
                              >
                                <option>Idle</option>
                                <option>Moving</option>
                                <option>Stopped</option>
                                <option>Breakdown</option>
                                <option>Reached</option>
                              </select>
                            </label>
                            <label>
                              <span>Updated By *</span>
                              <input
                                value={movementForm.updatedBy}
                                onChange={(e) =>
                                  updateMovementField(
                                    "updatedBy",
                                    e.target.value,
                                  )
                                }
                                placeholder="Name"
                              />
                            </label>
                            <label>
                              <span>Remarks</span>
                              <input
                                value={movementForm.remarks}
                                onChange={(e) =>
                                  updateMovementField("remarks", e.target.value)
                                }
                                placeholder="Movement remarks"
                              />
                            </label>
                          </div>
                        </section>
                        <section className="trip-movement-operation-grid">
                          <div className="trip-movement-operation-card">
                            <div className="trip-movement-operation-head">
                              <div>
                                <small>VEHICLE OPERATION</small>
                                <h3>Loading Details</h3>
                              </div>
                              <span>{movementForm.loadingStatus}</span>
                            </div>
                            <div className="trip-movement-operation-fields">
                              <label>
                                <span>Status</span>
                                <select
                                  value={movementForm.loadingStatus}
                                  onChange={(e) =>
                                    updateMovementField(
                                      "loadingStatus",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option>Pending</option>
                                  <option>In Progress</option>
                                  <option>Completed</option>
                                </select>
                              </label>
                              <label>
                                <span>Point In Date</span>
                                <input
                                  type="date"
                                  value={movementForm.loadingPointInDate}
                                  onChange={(e) =>
                                    updateMovementField(
                                      "loadingPointInDate",
                                      e.target.value,
                                    )
                                  }
                                />
                              </label>
                              <label>
                                <span>Loading Date</span>
                                <input
                                  type="date"
                                  value={movementForm.loadingDate}
                                  onChange={(e) =>
                                    updateMovementField(
                                      "loadingDate",
                                      e.target.value,
                                    )
                                  }
                                />
                              </label>
                              <label>
                                <span>Point Out Date</span>
                                <input
                                  type="date"
                                  value={movementForm.loadingPointOutDate}
                                  onChange={(e) =>
                                    updateMovementField(
                                      "loadingPointOutDate",
                                      e.target.value,
                                    )
                                  }
                                />
                              </label>
                              <label>
                                <span>Halting Days</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={movementForm.loadingHaltingDays}
                                  readOnly
                                />
                              </label>
                              <label className="remarks">
                                <span>Remarks</span>
                                <input
                                  value={movementForm.loadingRemarks}
                                  onChange={(e) =>
                                    updateMovementField(
                                      "loadingRemarks",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Loading Details remarks"
                                />
                              </label>
                            </div>
                          </div>
                          <div className="trip-movement-operation-card">
                            <div className="trip-movement-operation-head">
                              <div>
                                <small>VEHICLE OPERATION</small>
                                <h3>Unloading Details</h3>
                              </div>
                              <span>{movementForm.unloadingStatus}</span>
                            </div>
                            {!unloadingEnabled && (
                              <div className="trip-unloading-lock">
                                Unloading will be available after the vehicle
                                reaches the final destination.
                              </div>
                            )}
                            <div className="trip-movement-operation-fields">
                              <label>
                                <span>Status</span>
                                <select
                                  value={movementForm.unloadingStatus}
                                  disabled={!unloadingEnabled}
                                  onChange={(e) =>
                                    updateMovementField(
                                      "unloadingStatus",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option>Pending</option>
                                  <option>In Progress</option>
                                  <option>Completed</option>
                                </select>
                              </label>
                              <label>
                                <span>Point In Date</span>
                                <input
                                  type="date"
                                  disabled={!unloadingEnabled}
                                  value={movementForm.unloadingPointInDate}
                                  onChange={(e) =>
                                    updateMovementField(
                                      "unloadingPointInDate",
                                      e.target.value,
                                    )
                                  }
                                />
                              </label>
                              <label>
                                <span>Unloading Date</span>
                                <input
                                  type="date"
                                  disabled={!unloadingEnabled}
                                  value={movementForm.unloadingDate}
                                  onChange={(e) =>
                                    updateMovementField(
                                      "unloadingDate",
                                      e.target.value,
                                    )
                                  }
                                />
                              </label>
                              <label>
                                <span>Point Out Date</span>
                                <input
                                  type="date"
                                  disabled={!unloadingEnabled}
                                  value={movementForm.unloadingPointOutDate}
                                  onChange={(e) =>
                                    updateMovementField(
                                      "unloadingPointOutDate",
                                      e.target.value,
                                    )
                                  }
                                />
                              </label>
                              <label>
                                <span>Halting Days</span>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!unloadingEnabled}
                                  value={movementForm.unloadingHaltingDays}
                                  readOnly
                                />
                              </label>
                              <label className="remarks">
                                <span>Remarks</span>
                                <input
                                  disabled={!unloadingEnabled}
                                  value={movementForm.unloadingRemarks}
                                  onChange={(e) =>
                                    updateMovementField(
                                      "unloadingRemarks",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Unloading Details remarks"
                                />
                              </label>
                            </div>
                          </div>
                        </section>
                        <section className="trip-movement-documents">
                          <div className="trip-movement-section-title">
                            <div>
                              <small>TRIP DOCUMENTS</small>
                              <h3>LR, E-Way Bill & POD Documents</h3>
                            </div>
                            <span>Selected Vehicle</span>
                          </div>
                          <div className="trip-movement-document-grid">
                            <div className="trip-movement-document-card">
                              <div className="trip-movement-document-head">
                                <span className="trip-movement-document-icon">
                                  <FileText size={16} />
                                </span>
                                <div>
                                  <small>LORRY RECEIPT</small>
                                  <h4>LR Details</h4>
                                </div>
                                <b
                                  className={
                                    movementForm.lrNumber ? "uploaded" : ""
                                  }
                                >
                                  {movementForm.lrNumber
                                    ? "Entered"
                                    : "Pending"}
                                </b>
                              </div>
                              <div className="trip-movement-document-fields">
                                <label>
                                  <span>LR Number *</span>
                                  <input
                                    value={movementForm.lrNumber}
                                    onChange={(e) =>
                                      updateMovementField(
                                        "lrNumber",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Enter LR number"
                                  />
                                </label>
                                <label>
                                  <span>LR Date</span>
                                  <input
                                    type="date"
                                    value={movementForm.lrDate}
                                    onChange={(e) =>
                                      updateMovementField(
                                        "lrDate",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </label>
                                <label>
                                  <span>Remarks</span>
                                  <input
                                    value={movementForm.lrRemarks}
                                    onChange={(e) =>
                                      updateMovementField(
                                        "lrRemarks",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Enter remarks"
                                  />
                                </label>
                              </div>
                              <div
                                className="trip-pod-upload-row"
                                style={{
                                  padding: "0 14px 14px",
                                  gap: "10px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div className="trip-pod-file-info">
                                  <span className="trip-pod-file-icon">
                                    <FileText size={16} />
                                  </span>
                                  <div>
                                    <small>DOCUMENT</small>
                                    <strong
                                      title={
                                        movementForm.lrFile?.name ||
                                        vehicle?.lr?.originalName ||
                                        vehicle?.lr?.fileName ||
                                        ""
                                      }
                                    >
                                      {movementForm.lrFile?.name ||
                                        vehicle?.lr?.originalName ||
                                        vehicle?.lr?.fileName ||
                                        "No file selected"}
                                    </strong>
                                  </div>
                                </div>
                                <div className="trip-pod-actions">
                                  <label className="trip-document-upload-button">
                                    <Upload size={13} />
                                    {vehicle?.lr?.fileName
                                      ? "Replace File"
                                      : "Choose File"}
                                    <input
                                      key={
                                        movementForm.lrFile
                                          ? "selected-lrFile"
                                          : "empty-lrFile"
                                      }
                                      type="file"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      disabled={movementSaving}
                                      onChange={(event) =>
                                        updateMovementField(
                                          "lrFile",
                                          event.target.files?.[0] || null,
                                        )
                                      }
                                    />
                                  </label>
                                  {movementForm.lrFile ? (
                                    <button
                                      type="button"
                                      className="trip-document-view-button"
                                      disabled={movementSaving}
                                      onClick={() =>
                                        removeMovementFile("lr", true)
                                      }
                                    >
                                      <X size={13} /> Clear Selected
                                    </button>
                                  ) : vehicle?.lr?.fileName ? (
                                    <button
                                      type="button"
                                      className="trip-document-view-button"
                                      style={{
                                        color: "#b42318",
                                        borderColor: "#f1c9c5",
                                      }}
                                      disabled={movementSaving}
                                      onClick={() => removeMovementFile("lr")}
                                    >
                                      <X size={13} /> Remove File
                                    </button>
                                  ) : null}
                                  {vehicle?.lr?.fileName && (
                                    <button
                                      type="button"
                                      className="trip-document-view-button"
                                      onClick={() =>
                                        viewMovementDocument(vehicle, "lr")
                                      }
                                    >
                                      <Eye size={13} /> View
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="trip-movement-document-card">
                              <div className="trip-movement-document-head">
                                <span className="trip-movement-document-icon">
                                  <FileText size={16} />
                                </span>
                                <div>
                                  <small>E-WAY BILL</small>
                                  <h4>E-Way Bill Details</h4>
                                </div>
                                <b
                                  className={`eway-status-${getEwayBillStatus(movementForm.ewayBillNumber, movementForm.ewayBillValidUpto, ewayToday).toLowerCase().replace(/\s+/g, "-")}`}
                                >
                                  {getEwayBillHeading(
                                    movementForm.ewayBillNumber,
                                    movementForm.ewayBillValidUpto,
                                    ewayToday,
                                  )}
                                </b>
                              </div>
                              <div className="trip-movement-document-fields">
                                <label>
                                  <span>E-Way Bill Number</span>
                                  <input
                                    value={movementForm.ewayBillNumber}
                                    onChange={(e) =>
                                      updateMovementField(
                                        "ewayBillNumber",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Enter E-Way Bill number"
                                  />
                                </label>
                                <label>
                                  <span>Valid Upto</span>
                                  <input
                                    type="date"
                                    value={movementForm.ewayBillValidUpto}
                                    onChange={(e) =>
                                      updateMovementField(
                                        "ewayBillValidUpto",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </label>
                                <label>
                                  <span>Status</span>
                                  <input
                                    value={getEwayBillStatus(
                                      movementForm.ewayBillNumber,
                                      movementForm.ewayBillValidUpto,
                                      ewayToday,
                                    )}
                                    readOnly
                                    aria-label="Automatically calculated E-Way Bill status"
                                  />
                                </label>
                              </div>
                              <div
                                className="trip-pod-upload-row"
                                style={{
                                  padding: "0 14px 14px",
                                  gap: "10px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div className="trip-pod-file-info">
                                  <span className="trip-pod-file-icon">
                                    <FileText size={16} />
                                  </span>
                                  <div>
                                    <small>DOCUMENT</small>
                                    <strong
                                      title={
                                        movementForm.ewayBillFile?.name ||
                                        vehicle?.ewayBill?.originalName ||
                                        vehicle?.ewayBill?.fileName ||
                                        ""
                                      }
                                    >
                                      {movementForm.ewayBillFile?.name ||
                                        vehicle?.ewayBill?.originalName ||
                                        vehicle?.ewayBill?.fileName ||
                                        "No file selected"}
                                    </strong>
                                  </div>
                                </div>
                                <div className="trip-pod-actions">
                                  <label className="trip-document-upload-button">
                                    <Upload size={13} />
                                    {vehicle?.ewayBill?.fileName
                                      ? "Replace File"
                                      : "Choose File"}
                                    <input
                                      key={
                                        movementForm.ewayBillFile
                                          ? "selected-ewayBillFile"
                                          : "empty-ewayBillFile"
                                      }
                                      type="file"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      disabled={movementSaving}
                                      onChange={(event) =>
                                        updateMovementField(
                                          "ewayBillFile",
                                          event.target.files?.[0] || null,
                                        )
                                      }
                                    />
                                  </label>
                                  {movementForm.ewayBillFile ? (
                                    <button
                                      type="button"
                                      className="trip-document-view-button"
                                      disabled={movementSaving}
                                      onClick={() =>
                                        removeMovementFile("ewayBill", true)
                                      }
                                    >
                                      <X size={13} /> Clear Selected
                                    </button>
                                  ) : vehicle?.ewayBill?.fileName ? (
                                    <button
                                      type="button"
                                      className="trip-document-view-button"
                                      style={{
                                        color: "#b42318",
                                        borderColor: "#f1c9c5",
                                      }}
                                      disabled={movementSaving}
                                      onClick={() =>
                                        removeMovementFile("ewayBill")
                                      }
                                    >
                                      <X size={13} /> Remove File
                                    </button>
                                  ) : null}
                                  {vehicle?.ewayBill?.fileName && (
                                    <button
                                      type="button"
                                      className="trip-document-view-button"
                                      onClick={() =>
                                        viewMovementDocument(
                                          vehicle,
                                          "ewayBill",
                                        )
                                      }
                                    >
                                      <Eye size={13} /> View
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="trip-movement-document-card trip-pod-full-row">
                              <div className="trip-movement-document-head">
                                <span className="trip-movement-document-icon">
                                  <FileText size={16} />
                                </span>
                                <div>
                                  <small>PROOF OF DELIVERY</small>
                                  <h4>POD Document</h4>
                                </div>
                                <b
                                  className={
                                    vehicle?.pod?.fileName ||
                                    movementForm.podFile
                                      ? "uploaded"
                                      : ""
                                  }
                                >
                                  {vehicle?.pod?.fileName ||
                                  movementForm.podFile
                                    ? "Uploaded"
                                    : "Pending"}
                                </b>
                              </div>
                              <div className="trip-pod-upload-row">
                                <div className="trip-pod-file-info">
                                  <span className="trip-pod-file-icon">
                                    <FileText size={16} />
                                  </span>
                                  <div>
                                    <small>POD FILE</small>
                                    <strong
                                      title={
                                        movementForm.podFile?.name ||
                                        vehicle?.pod?.fileName ||
                                        ""
                                      }
                                    >
                                      {movementForm.podFile?.name ||
                                        vehicle?.pod?.fileName ||
                                        "No POD file selected"}
                                    </strong>
                                  </div>
                                </div>
                                <div className="trip-pod-actions">
                                  <label
                                    className={`trip-document-upload-button ${!unloadingCompleted ? "disabled" : ""}`}
                                    title={
                                      !unloadingCompleted
                                        ? "Complete unloading before uploading POD"
                                        : ""
                                    }
                                  >
                                    <Upload size={13} />
                                    {vehicle?.pod?.fileName
                                      ? "Replace"
                                      : "Choose File"}
                                    <input
                                      key={
                                        movementForm.podFile
                                          ? "selected-podFile"
                                          : "empty-podFile"
                                      }
                                      type="file"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      disabled={!unloadingCompleted}
                                      onChange={(e) =>
                                        updateMovementField(
                                          "podFile",
                                          e.target.files?.[0] || null,
                                        )
                                      }
                                    />
                                  </label>
                                  {movementForm.podFile ? (
                                    <button
                                      type="button"
                                      className="trip-document-view-button"
                                      disabled={movementSaving}
                                      onClick={() =>
                                        removeMovementFile("pod", true)
                                      }
                                    >
                                      <X size={13} /> Clear Selected
                                    </button>
                                  ) : vehicle?.pod?.fileName ? (
                                    <button
                                      type="button"
                                      className="trip-document-view-button"
                                      style={{
                                        color: "#b42318",
                                        borderColor: "#f1c9c5",
                                      }}
                                      disabled={movementSaving}
                                      onClick={() => removeMovementFile("pod")}
                                    >
                                      <X size={13} /> Remove File
                                    </button>
                                  ) : null}
                                  {vehicle?.pod?.fileName && (
                                    <button
                                      type="button"
                                      className="trip-document-view-button"
                                      onClick={() =>
                                        viewMovementDocument(vehicle, "pod")
                                      }
                                    >
                                      <Eye size={13} />
                                      View
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        <section
                          id="daily-movement-history"
                          className="trip-movement-history"
                          aria-label="Daily Movement History"
                        >
                          <div className="trip-movement-section-title">
                            <div>
                              <small>HISTORY</small>
                              <h3>Daily Movement History</h3>
                            </div>
                            <span>
                              {historyDayCount} Days · {savedUpdateCount}{" "}
                              Updates
                            </span>
                          </div>
                          {history.length ? (
                            <div className="trip-movement-history-table">
                              <div className="trip-movement-history-head">
                                <span>Date</span>
                                <span>Day</span>
                                <span>Location</span>
                                <span>KM</span>
                                <span>Status</span>
                                <span>Remarks</span>
                              </div>
                              {history.map((item, index) => (
                                <div
                                  className="trip-movement-history-row"
                                  key={`${item.date || "movement"}-${index}`}
                                >
                                  <span>{formatDate(item.date)}</span>
                                  <span>Day {item.day ?? "-"}</span>
                                  <span>
                                    {item.isMissingDay
                                      ? "—"
                                      : safeText(item.currentLocation)}
                                  </span>
                                  <span>
                                    {item.isMissingDay
                                      ? "—"
                                      : `${item.runningKm ?? 0} KM`}
                                  </span>
                                  <span>
                                    {item.isMissingDay ? (
                                      <span>No update</span>
                                    ) : (
                                      <b
                                        className={`trip-history-status ${getStatusClass(item.status)}`}
                                      >
                                        {safeText(item.status, "Idle")}
                                      </b>
                                    )}
                                  </span>
                                  <span>
                                    {item.isMissingDay
                                      ? "No update recorded"
                                      : safeText(item.remarks)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="trip-movement-empty small">
                              No movement history yet.
                            </div>
                          )}
                        </section>
                        {/* =========================================
                      VEHICLE REPLACEMENT HISTORY
                  ========================================= */}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
            <footer className="trip-movement-footer">
              <div className="trip-movement-footer-message">
                {movementError && (
                  <span className="error">{movementError}</span>
                )}
              </div>
              <div className="trip-movement-footer-actions">
                <button
                  type="button"
                  className="trip-movement-cancel"
                  onClick={closeMovementPopup}
                >
                  Close
                </button>

                {movementForm && (
                  <button
                    type="button"
                    className="trip-movement-save"
                    onClick={saveMovement}
                    disabled={movementSaving}
                  >
                    <Save size={15} />
                    {movementSaving ? "Saving..." : "Save Movement"}
                  </button>
                )}
              </div>
            </footer>
            {(movementSuccess || movementError) && (
              <div
                className={`trip-movement-toast ${movementError ? "error" : "success"}`}
              >
                <div>
                  <strong>
                    {movementError ? "Unable to save" : "Saved successfully"}
                  </strong>
                  <span>{movementError || movementSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMovementError("");
                    setMovementSuccess("");
                  }}
                  aria-label="Close notification"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
const cjBASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");
const cjlist = (value) => (Array.isArray(value) ? value : []);
const cjdisplay = (value) =>
  value == null || value === "" ? "—" : String(value);
const cjtoday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const cjnewId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `CJ-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const cjlocalTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const cjformatTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const cjoperation = (raw = {}) => ({
  status: raw.status || "Pending",
  pointInAt: cjlocalTime(raw.pointInAt),
  completedAt: cjlocalTime(raw.completedAt),
  pointOutAt: cjlocalTime(raw.pointOutAt),
  remarks: raw.remarks || "",
});
const cjformFor = (record, trip, vehicle) => ({
  journeyId: record?.journeyId || cjnewId(),
  revision: record?.revision,
  date: record?.date || cjtoday(),
  origin: record?.origin || trip?.origin || "",
  destination: record?.destination || trip?.destination || "",
  startKm: record?.startKm ?? "",
  endKm: record?.endKm ?? "",
  currentLocation: record?.currentLocation || "",
  status: record?.status || "Idle",
  lrNumber: record?.lr?.number || "",
  lrDate: record?.lr?.date ? String(record.lr.date).slice(0, 10) : "",
  lrRemarks: record?.lr?.remarks || "",
  ewayBillNumber: record?.ewayBill?.number || "",
  ewayBillValidUpto: record?.ewayBill?.validUpto
    ? String(record.ewayBill.validUpto).slice(0, 10)
    : "",
  lrFile: null,
  ewayBillFile: null,
  podFile: null,
  remarks: record?.remarks || "",
  updatedBy: record?.updatedBy || "",
  loading: cjoperation(record?.loading),
  unloading: cjoperation(record?.unloading),
});
const cjunwrap = (payload) =>
  payload?.data?.trip ||
  payload?.data?.order ||
  payload?.data ||
  payload?.trip ||
  payload?.order ||
  payload;
const cjstatuses = [
  "Idle",
  "Moving",
  "Stopped",
  "Breakdown",
  "Reached",
  "Planned",
  "Loading",
  "In Transit",
  "Unloading",
  "Completed",
];

const CraneJourneyPopup = () => {
  const { id, allocationId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [form, setForm] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const vehicle = useMemo(
    () =>
      cjlist(trip?.allocatedVehicles).find(
        (v) => String(v.allocationId || v._id) === allocationId,
      ),
    [trip, allocationId],
  );
  const journeys = useMemo(
    () =>
      [...cjlist(vehicle?.craneTrips)].sort(
        (a, b) =>
          String(a.date).localeCompare(String(b.date)) ||
          new Date(a.createdAt) - new Date(b.createdAt),
      ),
    [vehicle],
  );
  const current = journeys.find((j) => j.journeyId === selectedId);
  const totalHistory = journeys.flatMap((journey, tripIndex) => {
    const records = cjlist(journey.history);
    return (records.length ? records : [journey]).map((entry, index) => ({ ...entry, journeyId: journey.journeyId, tripNumber: tripIndex + 1, rowKey: `${journey.journeyId}-${entry.historyId || index}` }));
  }).sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || new Date(a.savedAt || a.updatedAt || 0) - new Date(b.savedAt || b.updatedAt || 0));

  const day = form
    ? tripDaysThroughPointOut(
        form.loading.pointInAt,
        form.unloading.pointOutAt,
        form.date,
      )
    : 1;
  const history = buildEveryDayHistory(
    cjlist(current?.history).map((entry) => ({
      ...entry,
      runningKm:
        entry.startKm != null && entry.endKm != null
          ? entry.endKm - entry.startKm
          : 0,
    })),
    form?.loading?.pointInAt || form?.date || current?.createdAt,
    form?.unloading?.pointOutAt,
    cjtoday(),
  );
  const previousUpdate = cjlist(current?.history)
    .filter((entry) => entry.date < (form?.date || ""))
    .sort(
      (a, b) =>
        String(b.date).localeCompare(String(a.date)) ||
        new Date(b.savedAt) - new Date(a.savedAt),
    )[0];
  const unloadingCompleted = form?.unloading?.status === "Completed";
  const replaced =
    String(vehicle?.vehicleStatus || "").toLowerCase() === "replaced";
  const orderCompleted =
    ["trip complete", "trip completed", "completed"].includes(
      String(trip?.stage || "").toLowerCase(),
    ) || String(trip?.status || "").toLowerCase() === "completed";
  const locked = saving || replaced || orderCompleted;
  const headers = () => {
    const token = localStorage.getItem("token");
    if (!token?.trim())
      throw new Error("Please sign in with your main administrator account.");
    return { Authorization: `Bearer ${token}` };
  };
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setNotice("");
    setTrip(null);
    setForm(null);
    (async () => {
      try {
        const path = /^[a-f\d]{24}$/i.test(id || "")
          ? encodeURIComponent(id)
          : `trip/${encodeURIComponent(id || "")}`;
        const response = await fetch(`${cjBASE}/api/triporders/${path}`, {
          headers: headers(),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.message || "Unable to load vehicle.");
        const order = cjunwrap(payload);
        if (
          !["crane", "cranemovement"].includes(
            String(order.movementType || "")
              .toLowerCase()
              .replace(/[\s_-]+/g, ""),
          )
        )
          throw new Error("This page is for Crane vehicles only.");
        const target = cjlist(order.allocatedVehicles).find(
          (v) => String(v.allocationId || v._id) === allocationId,
        );
        if (!target) throw new Error("The selected vehicle was not found.");
        const latest = [...cjlist(target.craneTrips)].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
        )[0];
        if (controller.signal.aborted) return;
        setTrip(order);
        setSelectedId(latest?.journeyId || "");
        setForm(cjformFor(latest, order, target));
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err.message || "Unable to load movement.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id, allocationId, revision]);
  const setField = (name, value) => {
    setError("");
    setNotice("");
    setForm((previous) => ({ ...previous, [name]: value }));
  };
  const setOperation = (section, name, value) => {
    setError("");
    setNotice("");
    setForm((previous) => ({
      ...previous,
      [section]: { ...previous[section], [name]: value },
    }));
  };
  const addTrip = () => {
    setSelectedId("");
    const next = cjformFor(null, trip, vehicle);
    next.startKm = journeys[journeys.length - 1]?.endKm ?? "";
    setForm(next);
    setError("");
    setNotice("");
  };
  const selectTrip = (record) => {
    setSelectedId(record.journeyId);
    setForm(cjformFor(record, trip, vehicle));
    setError("");
    setNotice("");
  };
  const save = async (event) => {
    event.preventDefault();
    if (!form || !vehicle || locked) return;
    if (
      !form.origin.trim() ||
      !form.destination.trim() ||
      !form.updatedBy.trim() ||
      !form.currentLocation.trim()
    ) {
      setError("From, To, Current Location and Updated By are required.");
      return;
    }
    const parseKm = (value) => (value === "" ? null : Number(value));
    const startKm = parseKm(form.startKm),
      endKm = parseKm(form.endKm);
    if (
      [startKm, endKm].some(
        (v) => v != null && (!Number.isFinite(v) || v < 0),
      ) ||
      (endKm != null && (startKm == null || endKm < startKm))
    ) {
      setError("End KM must be at least Start KM.");
      return;
    }
    if (form.podFile && !unloadingCompleted) {
      setError("Complete unloading before uploading POD.");
      return;
    }
    if (
      form.endKm !== "" &&
      previousUpdate?.endKm != null &&
      Number(form.endKm) < Number(previousUpdate.endKm)
    ) {
      setError("Today KM cannot be less than yesterday KM.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const convertOperation = (raw) => ({
        ...raw,
        ...Object.fromEntries(
          ["pointInAt", "completedAt", "pointOutAt"].map((key) => [
            key,
            raw[key] ? new Date(raw[key]).toISOString() : null,
          ]),
        ),
      });
      const path = `${cjBASE}/api/triporders/${encodeURIComponent(trip._id)}/allocated-vehicles/${encodeURIComponent(vehicle.allocationId)}/crane-trips${selectedId ? `/${encodeURIComponent(selectedId)}` : ""}`;
      const response = await fetch(path, {
        method: selectedId ? "PUT" : "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          podFile: undefined,
          lrFile: undefined,
          ewayBillFile: undefined,
          lr: {
            number: form.lrNumber,
            date: form.lrDate,
            remarks: form.lrRemarks,
          },
          ewayBill: {
            number: form.ewayBillNumber,
            validUpto: form.ewayBillValidUpto,
          },
          startKm,
          endKm,
          loading: convertOperation(form.loading),
          unloading: convertOperation(form.unloading),
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.message || "Unable to save trip.");
      const order = cjunwrap(payload);
      const target = cjlist(order.allocatedVehicles).find(
        (v) => v.allocationId === vehicle.allocationId,
      );
      const saved = cjlist(target?.craneTrips).find(
        (j) => j.journeyId === form.journeyId,
      );
      if (!saved)
        throw new Error(
          "The server response did not include the saved trip. Refresh to verify it.",
        );
      let updatedOrder = order;
      let updatedVehicle = target;
      let updatedJourney = saved;
      const pendingFiles = { lrFile: form.lrFile, ewayBillFile: form.ewayBillFile, podFile: form.podFile };
      setTrip(updatedOrder);
      setSelectedId(saved.journeyId);
      setForm({ ...cjformFor(updatedJourney, updatedOrder, updatedVehicle), ...pendingFiles });
      for (const [type, field, label] of [["lr", "lrFile", "LR"], ["ewayBill", "ewayBillFile", "E-Way Bill"], ["pod", "podFile", "POD"]]) {
        if (!pendingFiles[field]) continue;
        const upload = new FormData();
        upload.append("document", pendingFiles[field]);
        upload.append("uploadedBy", form.updatedBy);
        upload.append("revision", String(updatedJourney.revision));
        const uploaded = await fetch(
          `${cjBASE}/api/triporders/${encodeURIComponent(updatedOrder._id)}/allocated-vehicles/${encodeURIComponent(vehicle.allocationId)}/crane-trips/${encodeURIComponent(saved.journeyId)}/${type}`,
          { method: "PUT", headers: headers(), body: upload },
        );
        let uploadedResult;
        try { uploadedResult = await uploaded.json(); }
        catch { throw new Error(`Movement saved, but ${label} upload could not be confirmed. Your remaining selected files are kept. Refresh to verify before retrying.`); }
        if (!uploaded.ok) throw new Error(`Movement saved, but ${label} upload failed: ${uploadedResult.message || "Please retry"}. Remaining selected files are kept.`);
        updatedOrder = cjunwrap(uploadedResult);
        updatedVehicle = cjlist(updatedOrder.allocatedVehicles).find(v => v.allocationId === vehicle.allocationId);
        updatedJourney = cjlist(updatedVehicle?.craneTrips).find(j => j.journeyId === saved.journeyId);
        if (!updatedJourney) throw new Error("Movement saved, but uploaded document could not be confirmed. Refresh to verify.");
        pendingFiles[field] = null;
        setTrip(updatedOrder);
        setForm({ ...cjformFor(updatedJourney, updatedOrder, updatedVehicle), ...pendingFiles });
      }
      setNotice(
        "Movement saved for this trip. Use Add Trip for another journey on the same date.",
      );
    } catch (err) {
      setError(err.message || "Unable to save trip.");
    } finally {
      setSaving(false);
    }
  };
  const viewPod = async (type = "pod") => {
    let preview = window.open("", "_blank");
    try {
      if (!current?.[type]?.fileName) throw new Error("Save a document first.");
      const response = await fetch(
        `${cjBASE}/api/triporders/${encodeURIComponent(trip._id)}/allocated-vehicles/${encodeURIComponent(vehicle.allocationId)}/crane-trips/${encodeURIComponent(current.journeyId)}/${type}/file`,
        { headers: headers() },
      );
      if (!response.ok) throw new Error("Unable to view document.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (preview) preview.location.href = url;
      else {
        const link = document.createElement("a");
        link.href = url;
        link.download = current[type].fileName;
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (preview) preview.close();
      setError(err.message);
    }
  };
  const documentUpload = (type, field, label) => (
    <div className="trip-pod-upload-row">
      <div className="trip-pod-file-info"><span className="trip-pod-file-icon"><FileText size={16} /></span><div><small>{label} FILE</small><strong>{form[field]?.name || current?.[type]?.fileName || "No file selected"}</strong></div></div>
      <div className="trip-pod-actions"><label className={`trip-document-upload-button ${locked ? "disabled" : ""}`}><Upload size={13} />{current?.[type]?.fileName ? "Replace" : "Upload"}<input key={`${selectedId}-${field}-${form[field] ? "chosen" : "empty"}`} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={locked} onChange={event => setField(field, event.target.files?.[0] || null)} /></label>
      {form[field] && <button type="button" className="trip-document-view-button" disabled={locked} onClick={() => setField(field, null)}>Clear selected</button>}
      {current?.[type]?.fileName && <button type="button" className="trip-document-view-button" onClick={() => viewPod(type)}><Eye size={13} />View</button>}</div>
    </div>
  );
  const input = (name, label, type = "text") => (
    <label>
      <span>{label}</span>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => setField(name, e.target.value)}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        required={["date", "origin", "destination", "updatedBy"].includes(name)}
      />
    </label>
  );
  const back = () => navigate(`/crane-vehicles/${encodeURIComponent(id)}`);
  return (
    <main className="trip-list-page">
      <div className="trip-movement-overlay" role="dialog" aria-modal="true">
        <form className="trip-movement-modal" onSubmit={save}>
          <header className="trip-movement-head">
            <div className="trip-movement-title">
              <span className="trip-movement-title-icon">
                <Navigation size={18} />
              </span>
              <div>
                <small>CRANE VEHICLE MOVEMENT</small>
                <h2>{cjdisplay(trip?.tripId)}</h2>
                <p>
                  {cjdisplay(vehicle?.vehicleNumber)} ·{" "}
                  {cjdisplay(form?.origin)} → {cjdisplay(form?.destination)}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="trip-movement-close"
              disabled={saving}
              onClick={back}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </header>
          <div className="trip-movement-body">
            {error && (
              <p role="alert" style={{ color: "#b91c1c" }}>
                {error}
              </p>
            )}
            {notice && (
              <p role="status" style={{ color: "#087f79" }}>
                {notice}
              </p>
            )}
            {loading ? (
              <div className="trip-movement-empty">
                Loading selected vehicle...
              </div>
            ) : !vehicle || !form ? (
              <div className="trip-movement-empty">
                Unable to display this vehicle.{" "}
                <button type="button" onClick={() => setRevision((v) => v + 1)}>
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="trip-movement-vehicle-tabs">
                  {journeys.map((record, index) => (
                    <button
                      type="button"
                      key={record.journeyId}
                      disabled={saving}
                      className={`trip-movement-vehicle-tab ${selectedId === record.journeyId ? "active" : ""}`}
                      onClick={() => selectTrip(record)}
                    >
                      <Route size={14} />
                      <span>
                        <strong>Trip {index + 1}</strong>
                        <small>
                          {record.date} · {record.status}
                        </small>
                      </span>
                    </button>
                  ))}
                  {!selectedId && (
                    <button
                      type="button"
                      className="trip-movement-vehicle-tab active"
                    >
                      <Route size={14} />
                      <span>
                        <strong>Trip {journeys.length + 1}</strong>
                        <small>New · Not saved</small>
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="trip-movement-vehicle-tab"
                    disabled={locked}
                    onClick={addTrip}
                  >
                    <Plus size={16} />
                    <span>
                      <strong>Add Trip</strong>
                      <small>Same date allowed</small>
                    </span>
                  </button>
                </div>
                <section className="trip-movement-summary">
                  {[
                    ["Vehicle", vehicle.vehicleNumber],
                    ["Current Location", form.currentLocation],
                    [
                      "Running KM",
                      form.startKm !== "" && form.endKm !== ""
                        ? `${Number(form.endKm) - Number(form.startKm)} KM`
                        : "—",
                    ],
                    ["Status", form.status],
                    ["Driver", vehicle.driver?.name],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{cjdisplay(value)}</strong>
                    </div>
                  ))}
                </section>
                {(replaced || orderCompleted) && (
                  <p role="status">
                    This vehicle or order is closed. Saved trips are available
                    for viewing.
                  </p>
                )}
                <fieldset
                  disabled={locked}
                  style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
                >
                  <section className="trip-movement-form-card">
                    <div className="trip-movement-section-title">
                      <div>
                        <small>DAILY TRACKING</small>
                        <h3>
                          {selectedId
                            ? "Movement Details"
                            : "Add Movement Details"}
                        </h3>
                      </div>
                      <span>Day {day}</span>
                    </div>
                    <div className="trip-movement-form-grid">
                      {input("date", "Date", "date")}
                      <label>
                        <span>Day</span>
                        <input type="number" value={day} readOnly />
                      </label>
                      <label>
                        <span>
                          {previousUpdate
                            ? "Yesterday KM"
                            : "Starting Odometer KM"}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={previousUpdate?.endKm ?? form.startKm}
                          readOnly={!!previousUpdate}
                          onChange={(e) => setField("startKm", e.target.value)}
                        />
                      </label>
                      {input("endKm", "Today KM *", "number")}
                      <label>
                        <span>Yesterday Location</span>
                        <input
                          value={previousUpdate?.currentLocation || ""}
                          readOnly
                        />
                      </label>
                      {input("currentLocation", "Current Location *")}
                      {input("origin", "From *")}
                      {input("destination", "To *")}
                      <label>
                        <span>Status</span>
                        <select
                          value={form.status}
                          onChange={(e) => setField("status", e.target.value)}
                        >
                          {cjstatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      {input("updatedBy", "Updated By *")}
                      {input("remarks", "Remarks")}
                    </div>
                  </section>
                  <section className="trip-movement-operation-grid">
                    {["loading", "unloading"].map((section) => (
                      <div
                        className="trip-movement-operation-card"
                        key={section}
                      >
                        <div className="trip-movement-operation-head">
                          <div>
                            <small>VEHICLE OPERATION</small>
                            <h3>
                              {section === "loading" ? "Loading" : "Unloading"}{" "}
                              Details
                            </h3>
                          </div>
                          <span>{form[section].status}</span>
                        </div>
                        <div className="trip-movement-operation-fields">
                          <label>
                            <span>Status</span>
                            <select
                              value={form[section].status}
                              onChange={(e) =>
                                setOperation(section, "status", e.target.value)
                              }
                            >
                              {["Pending", "In Progress", "Completed"].map(
                                (status) => (
                                  <option key={status}>{status}</option>
                                ),
                              )}
                            </select>
                          </label>
                          {[
                            ["Point In", "pointInAt"],
                            [
                              section === "loading"
                                ? "Loading Time"
                                : "Unloading Time",
                              "completedAt",
                            ],
                            ["Point Out", "pointOutAt"],
                          ].map(([label, name]) => (
                            <label key={name}>
                              <span>{label}</span>
                              <input
                                type="datetime-local"
                                value={form[section][name]}
                                onChange={(e) =>
                                  setOperation(section, name, e.target.value)
                                }
                              />
                            </label>
                          ))}
                          <label>
                            <span>Halting Days</span>
                            <input
                              value={calculateHaltingDays(
                                form[section].pointInAt,
                                form[section].pointOutAt,
                              )}
                              readOnly
                            />
                          </label>
                          <label>
                            <span>Remarks</span>
                            <input
                              value={form[section].remarks}
                              onChange={(e) =>
                                setOperation(section, "remarks", e.target.value)
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </section>
                </fieldset>
                <section className="trip-movement-documents">
                  <div className="trip-movement-section-title">
                    <div>
                      <small>TRIP DOCUMENTS</small>
                      <h3>LR, E-Way Bill & POD Documents</h3>
                    </div>
                    <span>Selected Trip</span>
                  </div>
                  <div className="trip-movement-document-grid">
                    <div className="trip-movement-document-card">
                      <div className="trip-movement-document-head">
                        <span className="trip-movement-document-icon">
                          <FileText size={16} />
                        </span>
                        <div>
                          <small>LORRY RECEIPT</small>
                          <h4>LR Details</h4>
                        </div>
                        <b className={form.lrNumber ? "uploaded" : ""}>
                          {form.lrNumber ? "Entered" : "Pending"}
                        </b>
                      </div>
                      <div className="trip-movement-document-fields">
                        <label>
                          <span>LR Number *</span>
                          <input
                            disabled={locked}
                            value={form.lrNumber}
                            onChange={(e) =>
                              setField("lrNumber", e.target.value)
                            }
                            placeholder="Enter LR number"
                          />
                        </label>
                        <label>
                          <span>LR Date</span>
                          <input
                            disabled={locked}
                            type="date"
                            value={form.lrDate}
                            onChange={(e) => setField("lrDate", e.target.value)}
                          />
                        </label>
                        <label>
                          <span>Remarks</span>
                          <input
                            disabled={locked}
                            value={form.lrRemarks}
                            onChange={(e) =>
                              setField("lrRemarks", e.target.value)
                            }
                            placeholder="Enter remarks"
                          />
                        </label>
                      </div>
                      {documentUpload("lr", "lrFile", "LR")}
                    </div>
                    <div className="trip-movement-document-card">
                      <div className="trip-movement-document-head">
                        <span className="trip-movement-document-icon">
                          <FileText size={16} />
                        </span>
                        <div>
                          <small>E-WAY BILL</small>
                          <h4>E-Way Bill Details</h4>
                        </div>
                        <b
                          className={`eway-status-${getEwayBillStatus(form.ewayBillNumber, form.ewayBillValidUpto, cjtoday()).toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {getEwayBillHeading(
                            form.ewayBillNumber,
                            form.ewayBillValidUpto,
                            cjtoday(),
                          )}
                        </b>
                      </div>
                      <div className="trip-movement-document-fields">
                        <label>
                          <span>E-Way Bill Number</span>
                          <input
                            disabled={locked}
                            value={form.ewayBillNumber}
                            onChange={(e) =>
                              setField("ewayBillNumber", e.target.value)
                            }
                            placeholder="Enter E-Way Bill number"
                          />
                        </label>
                        <label>
                          <span>Valid Upto</span>
                          <input
                            disabled={locked}
                            type="date"
                            value={form.ewayBillValidUpto}
                            onChange={(e) =>
                              setField("ewayBillValidUpto", e.target.value)
                            }
                          />
                        </label>
                        <label>
                          <span>Status</span>
                          <input
                            disabled={locked}
                            value={getEwayBillStatus(
                              form.ewayBillNumber,
                              form.ewayBillValidUpto,
                              cjtoday(),
                            )}
                            readOnly
                            aria-label="Automatically calculated E-Way Bill status"
                          />
                        </label>
                      </div>
                      {documentUpload("ewayBill", "ewayBillFile", "E-WAY BILL")}
                    </div>
                    <div className="trip-movement-document-card trip-pod-full-row">
                      <div className="trip-movement-document-head">
                        <span className="trip-movement-document-icon">
                          <FileText size={16} />
                        </span>
                        <div>
                          <small>PROOF OF DELIVERY</small>
                          <h4>POD Document</h4>
                        </div>
                        <b
                          className={
                            current?.pod?.fileName || form.podFile
                              ? "uploaded"
                              : ""
                          }
                        >
                          {current?.pod?.fileName || form.podFile
                            ? "Uploaded"
                            : "Pending"}
                        </b>
                      </div>
                      <div className="trip-pod-upload-row">
                        <div className="trip-pod-file-info">
                          <span className="trip-pod-file-icon">
                            <FileText size={16} />
                          </span>
                          <div>
                            <small>POD FILE</small>
                            <strong
                              title={
                                form.podFile?.name ||
                                current?.pod?.fileName ||
                                ""
                              }
                            >
                              {form.podFile?.name ||
                                current?.pod?.fileName ||
                                "No POD file selected"}
                            </strong>
                          </div>
                        </div>
                        <div className="trip-pod-actions">
                          <label
                            className={`trip-document-upload-button ${!unloadingCompleted ? "disabled" : ""}`}
                            title={
                              !unloadingCompleted
                                ? "Complete unloading before uploading POD"
                                : ""
                            }
                          >
                            <Upload size={13} />
                            {current?.pod?.fileName ? "Replace" : "Choose File"}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              disabled={locked || !unloadingCompleted}
                              onChange={(e) =>
                                setField("podFile", e.target.files?.[0] || null)
                              }
                            />
                          </label>
                          {current?.pod?.fileName && (
                            <button
                              type="button"
                              className="trip-document-view-button"
                              onClick={() => viewPod()}
                            >
                              <Eye size={13} />
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="trip-movement-section cj-total-history" aria-label="Full vehicle movement history">
                  <div className="trip-movement-section-head"><div><small>ALL TRIPS · SAVED UPDATES</small><h3>Total Movement History</h3></div><span>{totalHistory.length} updates · {journeys.length} trips</span></div>
                  <div style={{ overflowX: "auto", maxHeight: "380px" }}><table style={{ width: "100%", minWidth: "1100px", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}><thead><tr>{["Trip", "Date", "From", "To", "Location", "Start KM", "Today KM", "Running KM", "Status", "Updated by", "Saved at", "Remarks"].map(label => <th key={label} scope="col" style={{ padding: "11px 12px", background: "#edf6f8", color: "#42677b", position: "sticky", top: 0 }}>{label}</th>)}</tr></thead><tbody>
                    {totalHistory.map(entry => <tr key={entry.rowKey}>{[
                      `Trip ${entry.tripNumber}`, entry.date, entry.origin, entry.destination, entry.currentLocation, entry.startKm, entry.endKm,
                      entry.endKm != null && entry.startKm != null ? Number(entry.endKm) - Number(entry.startKm) : null,
                      entry.status, entry.updatedBy, cjformatTime(entry.savedAt || entry.updatedAt), entry.remarks,
                    ].map((value, index) => <td key={index} style={{ padding: "10px 12px", borderBottom: "1px solid #e5edf2", color: "#254b5e" }}>{cjdisplay(value)}</td>)}</tr>)}
                    {!totalHistory.length && <tr><td colSpan={12} style={{ padding: "24px", textAlign: "center" }}>No saved movement history yet.</td></tr>}
                  </tbody></table></div>
                </section>
              </>
            )}
          </div>
          <footer className="trip-movement-footer">
            <div className="trip-movement-footer-message" />
            <div className="trip-movement-footer-actions">
              <button
                type="button"
                className="trip-movement-cancel"
                disabled={saving}
                onClick={back}
              >
                Close
              </button>
              <button
                type="submit"
                className="trip-movement-save"
                disabled={locked || loading || !vehicle}
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Movement"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
};
const Tripdetails = (props) =>
  props.movementOnly ? (
    <CraneJourneyPopup />
  ) : (
    <StandardTripdetails {...props} />
  );

export default Tripdetails;
