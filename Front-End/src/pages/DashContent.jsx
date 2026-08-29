import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  FaTruck,
  FaExchangeAlt,
  FaTools,
  FaFileAlt,
  FaSyncAlt,
  FaArrowRight,
  FaMapMarkerAlt,
  FaTrophy,
  FaBuilding,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaRoute,
  FaUsers,
  FaChartLine,
  FaSearch,
  FaTimes,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUpload,
  FaDownload,
  FaLayerGroup,
  FaListUl,
  FaShippingFast,
  FaSave,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

import "../pagescss/dashcontent.css";

/* =========================================================
   API CONFIGURATION

   If your backend isn't on localhost:5000 while testing,
   change API_BASE below (or set VITE_API_URL in a .env file
   at your project root).
   ========================================================= */

const RAW_API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

// Normalizes the base URL so it always ends in exactly one "/api",
// even if VITE_API_URL was set without it (e.g. "http://localhost:5000")
// or with a trailing slash. This is what was causing 404s: the base
// was resolving to "http://localhost:5000" instead of ".../api".
const API_BASE = (() => {
  const trimmed = RAW_API_BASE.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
})();

const VEHICLES_URL = `${API_BASE}/vehicles`;
const OWNVEHICLES_URL = `${API_BASE}/ownvehicles`;
const TRIPTRACKING_URL = `${API_BASE}/triptracking`;

/* =========================================================
   AXIOS INSTANCE + DEBUG LOGGING

   Logs every request/response/error to the browser console
   so you can see exactly what each endpoint returned, or why
   it failed, instead of it failing silently.
   ========================================================= */

const api = axios.create({ timeout: 20000 });

api.interceptors.request.use((config) => {
  console.log(
    `%c[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`,
    "color:#159e9a;font-weight:bold;"
  );
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(
      `%c[API RESPONSE] ${response.config.url} -> ${response.status}`,
      "color:#2875a8;font-weight:bold;",
      response.data
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API ERROR] ${error.config?.url} -> ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.error(
        `[API ERROR] No response received for ${error.config?.url}.`,
        "This usually means: backend isn't running, wrong API_BASE, or CORS blocked it.",
        error.message
      );
    } else {
      console.error("[API ERROR] Request setup failed:", error.message);
    }
    return Promise.reject(error);
  }
);

/* Normalizes whatever shape the backend sends back (raw array,
   { data: [...] }, { vehicles: [...] }, { trips: [...] }, etc.)
   into a plain array, and warns if nothing usable was found. */
const unwrapList = (payload, ...possibleKeys) => {
  if (Array.isArray(payload)) return payload;
  for (const key of possibleKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  console.warn("[API WARNING] Could not find an array in the response payload:", payload);
  return [];
};

/* ---- /api/vehicles ---- */
const apiAddVehicle = async (payload) => (await api.post(VEHICLES_URL, payload)).data;
const apiUpdateVehicle = async (id, payload) => (await api.put(`${VEHICLES_URL}/${id}`, payload)).data;
const apiDeleteVehicle = async (id) => (await api.delete(`${VEHICLES_URL}/${id}`)).data;

/* ---- /api/ownvehicles ---- */
const apiAddOwnVehicle = async (fields, files = []) => {
  const formData = new FormData();
  Object.entries(fields || {}).forEach(([key, value]) => formData.append(key, value ?? ""));
  files.forEach((file) => formData.append("documents", file));
  return (await api.post(OWNVEHICLES_URL, formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
};

const apiUpdateOwnVehicle = async (id, fields, files = []) => {
  const formData = new FormData();
  Object.entries(fields || {}).forEach(([key, value]) => formData.append(key, value ?? ""));
  files.forEach((file) => formData.append("documents", file));
  return (await api.put(`${OWNVEHICLES_URL}/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
};

const apiDeleteOwnVehicle = async (id) => (await api.delete(`${OWNVEHICLES_URL}/${id}`)).data;

const apiSaveVehicleDocuments = async (id, files = []) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("documents", file));
  return (await api.put(`${OWNVEHICLES_URL}/${id}/documents`, formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
};

const apiDownloadVehicleDocument = (fileName) => {
  if (!fileName) {
    console.warn("[API WARNING] downloadVehicleDocument called without a fileName.");
    return;
  }
  window.open(`${OWNVEHICLES_URL}/download/${fileName}`, "_blank", "noopener,noreferrer");
};

/* ---- combined fetch: pulls all 3 sources, reports per-source errors ---- */
const fetchAllFleetData = async () => {
  const [vehiclesRes, ownRes, tripsRes] = await Promise.allSettled([
    api.get(VEHICLES_URL),
    api.get(OWNVEHICLES_URL),
    api.get(TRIPTRACKING_URL),
  ]);

  const result = {
    vehicles: vehiclesRes.status === "fulfilled" ? unwrapList(vehiclesRes.value.data, "vehicles") : [],
    ownVehicles: ownRes.status === "fulfilled" ? unwrapList(ownRes.value.data, "ownVehicles", "vehicles") : [],
    trips: tripsRes.status === "fulfilled" ? unwrapList(tripsRes.value.data, "trips") : [],
    errors: {},
  };

  if (vehiclesRes.status === "rejected") result.errors.vehicles = vehiclesRes.reason?.message || "Failed to load /api/vehicles";
  if (ownRes.status === "rejected") result.errors.ownVehicles = ownRes.reason?.message || "Failed to load /api/ownvehicles";
  if (tripsRes.status === "rejected") result.errors.trips = tripsRes.reason?.message || "Failed to load /api/triptracking";

  if (Object.keys(result.errors).length > 0) {
    console.error("[fetchAllFleetData] One or more sources failed:", result.errors);
  }

  return result;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const STATUS_COLORS = [
  "#159e9a",
  "#2875a8",
  "#e28a18",
  "#d45252",
  "#7d5bb5",
  "#718594",
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const PAGE_SIZE = 8;

/* If your backend uses different field names than the ones
   guessed below, adjust ONLY this list - every getter reads
   from here so you don't have to touch the rest of the file. */
const FIELD_ALIASES = {
  vehicleNo: ["vehicleNo", "vehicleNumber", "VehicleNo", "Vehicle No", "registrationNumber", "registrationNo"],
  vehicleType: ["vehicleType", "type", "Type", "Vehicle Type"],
  status: ["status", "vehicleStatus", "Status"],
  source: ["vehicleSource", "source", "ownership", "category", "vehicleCategory", "VehicleCategory"],
  site: ["siteName", "site", "SiteName", "Site Name"],
  driver: ["driverName", "driver", "DriverName", "Driver Name"],
  inDate: ["vehicleInDate", "inDate", "VehicleInDate", "Vehicle In Date"],
  outDate: ["vehicleOutDate", "outDate", "VehicleOutDate", "Vehicle Out Date"],
  documentStatus: ["documentStatus", "documentsStatus", "document", "documents", "DocumentStatus"],
  ownerName: ["ownerName", "owner", "OwnerName"],
};

/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

const normalize = (value) => String(value ?? "").trim().toLowerCase();

const pick = (obj, key) => {
  for (const alias of FIELD_ALIASES[key] || [key]) {
    if (obj && obj[alias] !== undefined && obj[alias] !== null && obj[alias] !== "") {
      return obj[alias];
    }
  }
  return "";
};

const getId = (v) => v._id || v.id || v.vehicleId || "";
const getVehicleNumber = (v) => pick(v, "vehicleNo") || "N/A";
const getVehicleType = (v) => pick(v, "vehicleType") || "Unknown";
const getStatus = (v) => pick(v, "status") || "Unknown";
const getSource = (v) => pick(v, "source");
const getSiteName = (v) => pick(v, "site") || "Not Assigned";
const getDriverName = (v) => pick(v, "driver") || "Not Assigned";
const getVehicleInDate = (v) => pick(v, "inDate") || null;
const getVehicleOutDate = (v) => pick(v, "outDate") || null;
const getDocumentStatus = (v) => pick(v, "documentStatus");
const getOwnerName = (v) => pick(v, "ownerName");

const isOwnVehicle = (v) => {
  const source = normalize(getSource(v));
  return source.includes("own") || source.includes("company") || source.includes("owned") || v.__isOwnFleet;
};

const isIntercarting = (v) => {
  const source = normalize(getSource(v));
  return source.includes("intercart") || source.includes("vendor") || source.includes("attached") || source.includes("market");
};

const isMaintenance = (v) => {
  const status = normalize(getStatus(v));
  return status.includes("maintenance") || status.includes("maintain") || status.includes("repair");
};

const isInTransit = (v) => {
  const status = normalize(getStatus(v));
  return status.includes("transit") || status.includes("running") || status.includes("moving") || status.includes("on road");
};

const isAvailable = (v) => {
  const status = normalize(getStatus(v));
  return status.includes("available") || status.includes("active") || status.includes("idle") || status.includes("ready");
};

const isDocumentAlert = (v) => {
  const documentStatus = normalize(getDocumentStatus(v));
  return documentStatus.includes("expire") || documentStatus.includes("expired") || documentStatus.includes("due") || documentStatus.includes("renew");
};

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = safeDate(value);
  if (!date) return "N/A";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getMonthName = (date) => {
  const parsedDate = safeDate(date);
  return parsedDate ? MONTHS[parsedDate.getMonth()] : null;
};

const emptyForm = {
  vehicleNo: "",
  vehicleType: "",
  status: "Available",
  vehicleSource: "Own",
  siteName: "",
  driverName: "",
  vehicleInDate: "",
  vehicleOutDate: "",
  documentStatus: "Valid",
};

/* =========================================================
   DASHBOARD COMPONENT
   ========================================================= */

const DashContent = () => {
  const [vehicles, setVehicles] = useState([]);
  const [ownVehicles, setOwnVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [modalTarget, setModalTarget] = useState(null); // "fleet" | "own"
  const [formState, setFormState] = useState(emptyForm);
  const [formFiles, setFormFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, source }

  const [docsVehicle, setDocsVehicle] = useState(null);

  /* =======================================================
     FETCH ALL DATA SOURCES
     ======================================================= */

  const fetchAll = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      // fetchAllFleetData logs every request/response/error to the
      // console (look for [API REQUEST] / [API RESPONSE] / [API ERROR])
      // so you can see exactly what each of the 3 endpoints returned.
      const { vehicles: vehicleData, ownVehicles: ownDataRaw, trips: tripData, errors } =
        await fetchAllFleetData();

      const ownData = ownDataRaw.map((v) => ({ ...v, __isOwnFleet: true }));

      setVehicles(vehicleData);
      setOwnVehicles(ownData);
      setTrips(tripData);
      setLastUpdated(new Date());

      const errorKeys = Object.keys(errors || {});
      if (errorKeys.length > 0) {
        const messages = errorKeys.map((key) => `${key}: ${errors[key]}`).join(" | ");
        setError(
          `Some data failed to load (${messages}). Check the browser console for [API ERROR] details, and confirm the backend is reachable at ${API_BASE}.`
        );
      } else if (vehicleData.length === 0 && ownData.length === 0 && tripData.length === 0) {
        setError(
          `Connected, but all three endpoints returned no records. Check the console for the raw [API RESPONSE] payloads to confirm the data shape.`
        );
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Dashboard API error:", err);
      setError(`Unable to load vehicle information. Please confirm the backend is running at ${API_BASE}.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* =======================================================
     COMBINED FLEET (for stats/charts/overview table)
     ======================================================= */

  const combinedFleet = useMemo(() => {
    const ownIds = new Set(ownVehicles.map((v) => normalize(getVehicleNumber(v))));
    const nonDuplicateVehicles = vehicles.filter(
      (v) => !ownIds.has(normalize(getVehicleNumber(v)))
    );
    return [...ownVehicles, ...nonDuplicateVehicles];
  }, [vehicles, ownVehicles]);

  /* =======================================================
     ACTIVE TABLE DATA SOURCE (per tab)
     ======================================================= */

  const tableSource = useMemo(() => {
    if (activeTab === "own") return ownVehicles;
    if (activeTab === "fleet") return vehicles;
    return combinedFleet;
  }, [activeTab, vehicles, ownVehicles, combinedFleet]);

  /* =======================================================
     FILTER + SORT + PAGINATE
     ======================================================= */

  const filteredVehicles = useMemo(() => {
    const search = normalize(searchTerm);

    let result = tableSource.filter((vehicle) => {
      const number = normalize(getVehicleNumber(vehicle));
      const type = normalize(getVehicleType(vehicle));
      const site = normalize(getSiteName(vehicle));
      const driver = normalize(getDriverName(vehicle));
      const status = getStatus(vehicle);

      const matchesSearch =
        !search ||
        number.includes(search) ||
        type.includes(search) ||
        site.includes(search) ||
        driver.includes(search);

      const matchesStatus =
        selectedStatus === "All" || normalize(status) === normalize(selectedStatus);

      return matchesSearch && matchesStatus;
    });

    if (sortField) {
      const getters = {
        vehicleNo: getVehicleNumber,
        vehicleType: getVehicleType,
        status: getStatus,
        site: getSiteName,
        driver: getDriverName,
        inDate: (v) => safeDate(getVehicleInDate(v))?.getTime() || 0,
      };
      const getter = getters[sortField];
      if (getter) {
        result = [...result].sort((a, b) => {
          const av = getter(a);
          const bv = getter(b);
          if (av < bv) return sortDir === "asc" ? -1 : 1;
          if (av > bv) return sortDir === "asc" ? 1 : -1;
          return 0;
        });
      }
    }

    return result;
  }, [tableSource, searchTerm, selectedStatus, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));

  const pagedVehicles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredVehicles.slice(start, start + PAGE_SIZE);
  }, [filteredVehicles, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedStatus, activeTab]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    return sortDir === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  /* =======================================================
     VEHICLE STATISTICS (based on combined fleet)
     ======================================================= */

  const statistics = useMemo(() => {
    const source = combinedFleet;

    const own = source.filter(isOwnVehicle).length;
    const intercarting = source.filter(isIntercarting).length;
    const maintenance = source.filter(isMaintenance).length;
    const inTransit = source.filter(isInTransit).length;
    const available = source.filter(isAvailable).length;
    const documentAlerts = source.filter(isDocumentAlert).length;

    const assigned = source.filter((vehicle) => {
      const site = getSiteName(vehicle);
      return site && normalize(site) !== "not assigned";
    }).length;

    const drivers = new Set(
      source.map(getDriverName).filter((name) => name && normalize(name) !== "not assigned")
    ).size;

    const activeTrips = trips.filter((t) => {
      const status = normalize(t.status || t.tripStatus || "");
      return status.includes("progress") || status.includes("active") || status.includes("running") || status === "";
    }).length;

    return { own, intercarting, maintenance, inTransit, available, documentAlerts, assigned, drivers, activeTrips };
  }, [combinedFleet, trips]);

  const sourceChartData = useMemo(
    () => [
      { name: "Own Vehicle", count: statistics.own },
      { name: "Intercarting", count: statistics.intercarting },
    ],
    [statistics]
  );

  const statusChartData = useMemo(() => {
    const statusMap = {};
    combinedFleet.forEach((vehicle) => {
      const status = String(getStatus(vehicle)).trim();
      if (!status) return;
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    return Object.entries(statusMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [combinedFleet]);

  const vehicleTypeData = useMemo(() => {
    const typeMap = {};
    combinedFleet.forEach((vehicle) => {
      const type = String(getVehicleType(vehicle)).trim();
      if (!type) return;
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    return Object.entries(typeMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [combinedFleet]);

  const monthlyTrend = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = MONTHS.map((month) => ({ month, vehicles: 0 }));

    combinedFleet.forEach((vehicle) => {
      const date = safeDate(getVehicleInDate(vehicle)) || safeDate(getVehicleOutDate(vehicle));
      if (!date || date.getFullYear() !== currentYear) return;
      months[date.getMonth()].vehicles += 1;
    });

    return months;
  }, [combinedFleet]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set();
    tableSource.forEach((vehicle) => {
      const status = String(getStatus(vehicle)).trim();
      if (status) statuses.add(status);
    });
    return ["All", ...Array.from(statuses)];
  }, [tableSource]);

  const achievements = [
    { number: "15+", title: "Years", description: "Industry Experience" },
    { number: "20+", title: "Branches", description: "Across India" },
    { number: "1000+", title: "Clients", description: "Successfully Served" },
    { number: "24/7", title: "Operations", description: "Logistics Support" },
  ];

  const locations = [
    { name: "Bangalore", type: "Head Office" },
    { name: "Chennai", type: "Regional Office" },
    { name: "Hyderabad", type: "Regional Office" },
    { name: "Mumbai", type: "Regional Office" },
    { name: "Pune", type: "Regional Office" },
    { name: "Delhi", type: "Regional Office" },
  ];

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("All");
  };

  /* =======================================================
     CRUD ACTIONS
     ======================================================= */

  const openCreateModal = (target) => {
    setModalMode("create");
    setModalTarget(target);
    setFormState(emptyForm);
    setFormFiles([]);
    setModalOpen(true);
  };

  const openEditModal = (vehicle, target) => {
    setModalMode("edit");
    setModalTarget(target);
    setFormState({
      _id: getId(vehicle),
      vehicleNo: getVehicleNumber(vehicle) === "N/A" ? "" : getVehicleNumber(vehicle),
      vehicleType: getVehicleType(vehicle) === "Unknown" ? "" : getVehicleType(vehicle),
      status: getStatus(vehicle) === "Unknown" ? "Available" : getStatus(vehicle),
      vehicleSource: getSource(vehicle) || (target === "own" ? "Own" : "Intercarting"),
      siteName: getSiteName(vehicle) === "Not Assigned" ? "" : getSiteName(vehicle),
      driverName: getDriverName(vehicle) === "Not Assigned" ? "" : getDriverName(vehicle),
      vehicleInDate: safeDate(getVehicleInDate(vehicle))
        ? safeDate(getVehicleInDate(vehicle)).toISOString().slice(0, 10)
        : "",
      vehicleOutDate: safeDate(getVehicleOutDate(vehicle))
        ? safeDate(getVehicleOutDate(vehicle)).toISOString().slice(0, 10)
        : "",
      documentStatus: getDocumentStatus(vehicle) || "Valid",
    });
    setFormFiles([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalTarget(null);
    setFormState(emptyForm);
    setFormFiles([]);
  };

  const handleFormChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isOwn = modalTarget === "own";

      if (isOwn) {
        const fields = { ...formState };
        delete fields._id;

        if (modalMode === "create") {
          await apiAddOwnVehicle(fields, formFiles);
        } else {
          await apiUpdateOwnVehicle(formState._id, fields, formFiles);
        }
      } else {
        const payload = { ...formState };
        delete payload._id;

        if (modalMode === "create") {
          await apiAddVehicle(payload);
        } else {
          await apiUpdateVehicle(formState._id, payload);
        }
      }

      closeModal();
      await fetchAll(true);
    } catch (err) {
      console.error("Save vehicle error:", err);
      setError("Unable to save the vehicle. Check the console for [API ERROR] details.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (vehicle, source) => {
    setDeleteTarget({ id: getId(vehicle), source, label: getVehicleNumber(vehicle) });
  };

  const performDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.source === "own") {
        await apiDeleteOwnVehicle(deleteTarget.id);
      } else {
        await apiDeleteVehicle(deleteTarget.id);
      }
      setDeleteTarget(null);
      await fetchAll(true);
    } catch (err) {
      console.error("Delete vehicle error:", err);
      setError("Unable to delete the vehicle. Check the console for [API ERROR] details.");
      setDeleteTarget(null);
    }
  };

  const openDocuments = (vehicle) => setDocsVehicle(vehicle);
  const closeDocuments = () => setDocsVehicle(null);

  const handleDownloadDocument = (fileName) => {
    apiDownloadVehicleDocument(fileName);
  };

  const rowSource = (vehicle) => (vehicle.__isOwnFleet ? "own" : "fleet");

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <h3>Loading Dashboard</h3>
        <p>Fetching the latest fleet information...</p>
      </div>
    );
  }

  /* =======================================================
     MAIN RETURN
     ======================================================= */

  return (
    <div className="dashboard-overview">
      {/* TOPBAR */}
      <div className="dashboard-topbar">
        <div>
          <span className="topbar-label">OTC GROUPS / DASHBOARD</span>
          <h1>Dashboard Overview</h1>
          <p>Monitor fleet operations, vehicle activity and company performance from one place.</p>
        </div>

        <div className="topbar-actions">
          {lastUpdated && (
            <div className="last-updated">
              <FaClock />
              <span>Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}

          <button
            className={`refresh-button ${refreshing ? "refreshing" : ""}`}
            onClick={() => fetchAll(true)}
            disabled={refreshing}
          >
            <FaSyncAlt />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="api-error">
          <div className="api-error-icon"><FaExclamationTriangle /></div>
          <div>
            <strong>Vehicle data unavailable</strong>
            <span>{error}</span>
          </div>
          <button onClick={() => fetchAll()}>Retry</button>
        </div>
      )}

      {/* HERO */}
      <section className="dashboard-hero">
        <div className="hero-content">
          <span className="hero-eyebrow">WELCOME TO OTC GROUPS</span>
          <h2>Moving Business <span>Forward</span></h2>
          <p className="hero-subtitle">Transportation<b>•</b>Logistics<b>•</b>Fleet Management</p>
          <p className="hero-description">
            Reliable transportation solutions powered by experienced teams, efficient operations and
            technology-driven fleet management.
          </p>

          <div className="hero-mini-stats">
            <div><strong>{combinedFleet.length}</strong><span>Vehicles</span></div>
            <div><strong>{statistics.inTransit}</strong><span>In Transit</span></div>
            <div><strong>{statistics.available}</strong><span>Available</span></div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-overlay"></div>
          <div className="hero-floating-card">
            <div className="hero-floating-icon"><FaRoute /></div>
            <div>
              <strong>Fleet Operations</strong>
              <span>Connected • Efficient • Reliable</span>
            </div>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="dash-tabs">
        <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
          <FaLayerGroup /> Overview
        </button>
        <button className={activeTab === "fleet" ? "active" : ""} onClick={() => setActiveTab("fleet")}>
          <FaListUl /> Fleet Vehicles
        </button>
        <button className={activeTab === "own" ? "active" : ""} onClick={() => setActiveTab("own")}>
          <FaTruck /> Own Vehicles
        </button>
        <button className={activeTab === "trips" ? "active" : ""} onClick={() => setActiveTab("trips")}>
          <FaShippingFast /> Trip Tracking
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* FLEET SNAPSHOT */}
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <span className="section-label">LIVE FLEET DATA</span>
                <h2>Fleet Snapshot</h2>
              </div>
              <p>Current vehicle information retrieved from your fleet management system.</p>
            </div>

            <div className="fleet-grid">
              <div className="fleet-card fleet-own">
                <div className="fleet-icon"><FaTruck /></div>
                <div className="fleet-card-content">
                  <span>OWN VEHICLES</span>
                  <strong>{statistics.own}</strong>
                  <small>Company fleet</small>
                </div>
                <div className="fleet-card-arrow"><FaArrowRight /></div>
              </div>

              <div className="fleet-card fleet-inter">
                <div className="fleet-icon"><FaExchangeAlt /></div>
                <div className="fleet-card-content">
                  <span>INTERCARTING</span>
                  <strong>{statistics.intercarting}</strong>
                  <small>External fleet</small>
                </div>
                <div className="fleet-card-arrow"><FaArrowRight /></div>
              </div>

              <div className="fleet-card fleet-transit">
                <div className="fleet-icon"><FaRoute /></div>
                <div className="fleet-card-content">
                  <span>IN TRANSIT</span>
                  <strong>{statistics.inTransit}</strong>
                  <small>Currently moving</small>
                </div>
                <div className="fleet-card-arrow"><FaArrowRight /></div>
              </div>

              <div className="fleet-card fleet-maintenance">
                <div className="fleet-icon"><FaTools /></div>
                <div className="fleet-card-content">
                  <span>MAINTENANCE</span>
                  <strong>{statistics.maintenance}</strong>
                  <small>Requires attention</small>
                </div>
                <div className="fleet-card-arrow"><FaArrowRight /></div>
              </div>
            </div>
          </section>

          {/* SECONDARY STATS */}
          <section className="secondary-stats">
            <div className="secondary-stat">
              <div className="secondary-stat-icon"><FaCheckCircle /></div>
              <div><span>AVAILABLE</span><strong>{statistics.available}</strong></div>
            </div>
            <div className="secondary-stat">
              <div className="secondary-stat-icon"><FaFileAlt /></div>
              <div><span>DOCUMENT ALERTS</span><strong>{statistics.documentAlerts}</strong></div>
            </div>
            <div className="secondary-stat">
              <div className="secondary-stat-icon"><FaMapMarkerAlt /></div>
              <div><span>ASSIGNED VEHICLES</span><strong>{statistics.assigned}</strong></div>
            </div>
            <div className="secondary-stat">
              <div className="secondary-stat-icon"><FaUsers /></div>
              <div><span>ACTIVE DRIVERS</span><strong>{statistics.drivers}</strong></div>
            </div>
            <div className="secondary-stat">
              <div className="secondary-stat-icon"><FaShippingFast /></div>
              <div><span>ACTIVE TRIPS</span><strong>{statistics.activeTrips}</strong></div>
            </div>
          </section>

          {/* ANALYTICS */}
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <span className="section-label">FLEET ANALYTICS</span>
                <h2>Operational Overview</h2>
              </div>
              <p>Simple analytics based on your current vehicle records.</p>
            </div>

            <div className="analytics-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <div><span>FLEET COMPOSITION</span><h3>Own vs Intercarting</h3></div>
                  <FaTruck />
                </div>
                <div className="chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceChartData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip cursor={{ fill: "rgba(21,158,154,0.04)" }} />
                      <Bar dataKey="count" fill="#159e9a" radius={[7, 7, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div><span>OPERATIONAL STATUS</span><h3>Current Vehicle Status</h3></div>
                  <FaChartLine />
                </div>
                <div className="chart-area">
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={58} outerRadius={88} paddingAngle={3}>
                          {statusChartData.map((_, index) => (
                            <Cell key={`status-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={35} wrapperStyle={{ fontSize: "10px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart">No status information available</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="analytics-grid">
              <div className="chart-card chart-card-large">
                <div className="chart-header">
                  <div><span>FLEET ACTIVITY</span><h3>Vehicle Activity Trend</h3></div>
                  <FaChartLine />
                </div>
                <div className="chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="vehicles" stroke="#159e9a" fill="#159e9a" fillOpacity={0.12} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div><span>VEHICLE CATEGORY</span><h3>Vehicle Types</h3></div>
                  <FaTruck />
                </div>
                <div className="vehicle-type-list">
                  {vehicleTypeData.length > 0 ? (
                    vehicleTypeData.map((item) => {
                      const max = vehicleTypeData[0]?.count || 1;
                      const percentage = (item.count / max) * 100;
                      return (
                        <div className="vehicle-type-item" key={item.name}>
                          <div className="vehicle-type-top"><span>{item.name}</span><strong>{item.count}</strong></div>
                          <div className="vehicle-type-progress"><div style={{ width: `${percentage}%` }}></div></div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-list">No vehicle type information</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ALERTS */}
          <section className="dashboard-section">
            <div className="section-heading">
              <div><span className="section-label">ATTENTION REQUIRED</span><h2>Operational Alerts</h2></div>
            </div>

            <div className="alerts-grid">
              <div className="alert-card alert-maintenance">
                <div className="alert-icon"><FaTools /></div>
                <div className="alert-content">
                  <span>MAINTENANCE</span>
                  <strong>{statistics.maintenance}</strong>
                  <p>vehicle{statistics.maintenance !== 1 ? "s" : ""} currently require maintenance attention.</p>
                </div>
                <FaArrowRight />
              </div>

              <div className="alert-card alert-document">
                <div className="alert-icon"><FaFileAlt /></div>
                <div className="alert-content">
                  <span>DOCUMENTS</span>
                  <strong>{statistics.documentAlerts}</strong>
                  <p>document{statistics.documentAlerts !== 1 ? "s" : ""} require attention or renewal.</p>
                </div>
                <FaArrowRight />
              </div>
            </div>
          </section>
        </>
      )}

      {/* FLEET / OWN VEHICLE TABLE (shared UI, different data source) */}
      {(activeTab === "fleet" || activeTab === "own" || activeTab === "overview") && (
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="section-label">
                {activeTab === "own" ? "OWN FLEET RECORDS" : activeTab === "fleet" ? "MASTER FLEET LIST" : "LATEST ACTIVITY"}
              </span>
              <h2>{activeTab === "own" ? "Own Vehicles" : activeTab === "fleet" ? "All Vehicles" : "Recent Vehicle Activity"}</h2>
            </div>

            {activeTab !== "overview" && (
              <button className="add-vehicle-button" onClick={() => openCreateModal(activeTab === "own" ? "own" : "fleet")}>
                <FaPlus /> Add Vehicle
              </button>
            )}
          </div>

          <div className="activity-card">
            <div className="activity-toolbar">
              <div className="activity-search">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search vehicle, driver, site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && <button onClick={() => setSearchTerm("")}><FaTimes /></button>}
              </div>

              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                {availableStatuses.map((status) => (
                  <option value={status} key={status}>{status}</option>
                ))}
              </select>
            </div>

            {(searchTerm || selectedStatus !== "All") && (
              <div className="filter-info">
                <span>Showing <strong>{filteredVehicles.length}</strong> of <strong>{tableSource.length}</strong> vehicles</span>
                <button onClick={clearFilters}>Clear Filters</button>
              </div>
            )}

            <div className="activity-table-wrapper">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort("vehicleNo")} className="sortable">VEHICLE {sortIcon("vehicleNo")}</th>
                    <th onClick={() => toggleSort("vehicleType")} className="sortable">TYPE {sortIcon("vehicleType")}</th>
                    <th onClick={() => toggleSort("status")} className="sortable">STATUS {sortIcon("status")}</th>
                    <th onClick={() => toggleSort("site")} className="sortable">SITE {sortIcon("site")}</th>
                    <th onClick={() => toggleSort("driver")} className="sortable">DRIVER {sortIcon("driver")}</th>
                    <th onClick={() => toggleSort("inDate")} className="sortable">IN DATE {sortIcon("inDate")}</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {(activeTab === "overview" ? filteredVehicles.slice(0, 6) : pagedVehicles).length > 0 ? (
                    (activeTab === "overview" ? filteredVehicles.slice(0, 6) : pagedVehicles).map((vehicle, index) => {
                      const status = getStatus(vehicle);
                      const source = rowSource(vehicle);

                      return (
                        <tr key={getId(vehicle) || index}>
                          <td>
                            <div className="vehicle-cell">
                              <div className="vehicle-cell-icon"><FaTruck /></div>
                              <strong>{getVehicleNumber(vehicle)}</strong>
                            </div>
                          </td>
                          <td>{getVehicleType(vehicle)}</td>
                          <td>
                            <span className={`status-badge status-${normalize(status).replace(/\s+/g, "-")}`}>
                              {status}
                            </span>
                          </td>
                          <td>
                            <div className="site-cell">
                              <FaMapMarkerAlt />
                              <span>{getSiteName(vehicle)}</span>
                            </div>
                          </td>
                          <td>{getDriverName(vehicle)}</td>
                          <td>{formatDate(getVehicleInDate(vehicle))}</td>
                          <td>
                            <div className="row-actions">
                              <button title="Edit" onClick={() => openEditModal(vehicle, source)}><FaEdit /></button>
                              {source === "own" && (
                                <button title="Documents" onClick={() => openDocuments(vehicle)}><FaFileAlt /></button>
                              )}
                              <button title="Delete" className="danger" onClick={() => confirmDelete(vehicle, source)}><FaTrash /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty-table">
                        <FaSearch />
                        <span>No vehicles found</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {activeTab !== "overview" && totalPages > 1 && (
              <div className="pagination-bar">
                <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <FaChevronLeft /> Prev
                </button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TRIP TRACKING */}
      {activeTab === "trips" && (
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="section-label">LIVE TRIPS</span>
              <h2>Trip Tracking</h2>
            </div>
            <p>Vehicle-level status inside each active trip manifest.</p>
          </div>

          {trips.length > 0 ? (
            <div className="trips-grid">
              {trips.map((trip) => {
                const tripId = trip.tripId || trip._id;
                const tripVehicles = trip.vehicles || [];

                return (
                  <div className="trip-card" key={trip._id || tripId}>
                    <div className="trip-card-header">
                      <div>
                        <span>TRIP</span>
                        <strong>{tripId}</strong>
                      </div>
                      <span className={`status-badge status-${normalize(trip.status || "pending").replace(/\s+/g, "-")}`}>
                        {trip.status || "Pending"}
                      </span>
                    </div>

                    <div className="trip-card-meta">
                      <span><FaClock /> {formatDate(trip.startDate)} → {formatDate(trip.endDate)}</span>
                    </div>

                    <div className="trip-vehicle-list">
                      {tripVehicles.length > 0 ? (
                        tripVehicles.map((tv, i) => (
                          <div className="trip-vehicle-row" key={tv.vehicleSubId || i}>
                            <div>
                              <strong>{tv.vehicleNo || tv.vehicleSubId || "Vehicle"}</strong>
                              <span>{tv.driverName || "Driver not assigned"}</span>
                            </div>
                            <span className={`status-badge status-${normalize(tv.status || "pending").replace(/\s+/g, "-")}`}>
                              {tv.status || "Pending"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="empty-list">No vehicles in this trip yet</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="activity-card">
              <div className="empty-table" style={{ height: 140 }}>
                <FaShippingFast />
                <span>No trips found</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ACHIEVEMENTS */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-label">OUR JOURNEY</span>
            <h2>OTC Groups at a Glance</h2>
          </div>
          <p>Built through experience, reliability and continuous operational improvement.</p>
        </div>

        <div className="achievements-grid">
          {achievements.map((achievement, index) => (
            <div className="achievement-card" key={index}>
              <div className="achievement-icon">
                {index === 0 ? <FaTrophy /> : index === 1 ? <FaBuilding /> : index === 2 ? <FaUsers /> : <FaClock />}
              </div>
              <strong>{achievement.number}</strong>
              <h3>{achievement.title}</h3>
              <p>{achievement.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPANY + NETWORK */}
      <section className="dashboard-section company-grid">
        <div className="content-card">
          <div className="card-heading">
            <div className="card-heading-icon"><FaBuilding /></div>
            <div><span>ABOUT OTC GROUPS</span><h2>Who We Are</h2></div>
          </div>

          <p className="about-description">
            OTC Groups is focused on delivering dependable transportation and logistics solutions
            through efficient operations, experienced teams and technology-driven processes.
          </p>

          <div className="about-points">
            <div><FaCheckCircle /><span>Reliable transportation operations</span></div>
            <div><FaCheckCircle /><span>Professional fleet management</span></div>
            <div><FaCheckCircle /><span>Technology-driven processes</span></div>
            <div><FaCheckCircle /><span>Customer-focused service</span></div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-heading">
            <div className="card-heading-icon"><FaMapMarkerAlt /></div>
            <div><span>OUR NETWORK</span><h2>Branch Locations</h2></div>
          </div>

          <div className="location-mini-grid">
            {locations.map((location, index) => (
              <div className="location-mini" key={index}>
                <div className="location-mini-icon"><FaMapMarkerAlt /></div>
                <div>
                  <strong>{location.name}</strong>
                  <span>{location.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <section className="dashboard-footer">
        <div className="footer-logo"><FaTruck /></div>
        <div>
          <span>OTC GROUPS</span>
          <h2>Moving Business Forward</h2>
        </div>
        <div className="footer-right"><span>Transportation • Logistics • Fleet</span></div>
      </section>

      {/* =====================================================
          ADD / EDIT VEHICLE MODAL
          ===================================================== */}

      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalMode === "create" ? "Add" : "Edit"} {modalTarget === "own" ? "Own" : "Fleet"} Vehicle
              </h3>
              <button onClick={closeModal}><FaTimes /></button>
            </div>

            <form className="modal-form" onSubmit={handleSubmitForm}>
              <div className="form-grid">
                <label>
                  Vehicle No
                  <input
                    required
                    value={formState.vehicleNo}
                    onChange={(e) => handleFormChange("vehicleNo", e.target.value)}
                    placeholder="KA-01-AB-1234"
                  />
                </label>

                <label>
                  Vehicle Type
                  <input
                    value={formState.vehicleType}
                    onChange={(e) => handleFormChange("vehicleType", e.target.value)}
                    placeholder="Truck / Van / Trailer"
                  />
                </label>

                <label>
                  Status
                  <select value={formState.status} onChange={(e) => handleFormChange("status", e.target.value)}>
                    <option>Available</option>
                    <option>In Transit</option>
                    <option>Maintenance</option>
                    <option>Idle</option>
                  </select>
                </label>

                <label>
                  Source
                  <select value={formState.vehicleSource} onChange={(e) => handleFormChange("vehicleSource", e.target.value)}>
                    <option>Own</option>
                    <option>Intercarting</option>
                  </select>
                </label>

                <label>
                  Site
                  <input
                    value={formState.siteName}
                    onChange={(e) => handleFormChange("siteName", e.target.value)}
                    placeholder="Assigned site"
                  />
                </label>

                <label>
                  Driver
                  <input
                    value={formState.driverName}
                    onChange={(e) => handleFormChange("driverName", e.target.value)}
                    placeholder="Driver name"
                  />
                </label>

                <label>
                  Vehicle In Date
                  <input
                    type="date"
                    value={formState.vehicleInDate}
                    onChange={(e) => handleFormChange("vehicleInDate", e.target.value)}
                  />
                </label>

                <label>
                  Vehicle Out Date
                  <input
                    type="date"
                    value={formState.vehicleOutDate}
                    onChange={(e) => handleFormChange("vehicleOutDate", e.target.value)}
                  />
                </label>

                <label>
                  Document Status
                  <select value={formState.documentStatus} onChange={(e) => handleFormChange("documentStatus", e.target.value)}>
                    <option>Valid</option>
                    <option>Due for Renewal</option>
                    <option>Expired</option>
                  </select>
                </label>

                {modalTarget === "own" && (
                  <label className="full-width">
                    Upload Documents
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setFormFiles(Array.from(e.target.files || []))}
                    />
                    {formFiles.length > 0 && (
                      <small>{formFiles.length} file{formFiles.length !== 1 ? "s" : ""} selected</small>
                    )}
                  </label>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  <FaSave /> {saving ? "Saving..." : "Save Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          DELETE CONFIRMATION
          ===================================================== */}

      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card modal-card-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Vehicle</h3>
              <button onClick={() => setDeleteTarget(null)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteTarget.label}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="danger-button" onClick={performDelete}><FaTrash /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DOCUMENTS DRAWER (own vehicles only)
          ===================================================== */}

      {docsVehicle && (
        <div className="modal-backdrop" onClick={closeDocuments}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Documents — {getVehicleNumber(docsVehicle)}</h3>
              <button onClick={closeDocuments}><FaTimes /></button>
            </div>

            <div className="modal-body">
              {(docsVehicle.documents || []).length > 0 ? (
                <div className="documents-list">
                  {docsVehicle.documents.map((doc, i) => (
                    <div className="document-row" key={i}>
                      <div className="document-row-icon"><FaFileAlt /></div>
                      <div className="document-row-info">
                        <strong>{doc.name || doc.docType || `Document ${i + 1}`}</strong>
                        <span>Expires: {formatDate(doc.expiryDate)}</span>
                      </div>
                      <button onClick={() => handleDownloadDocument(doc.fileName || doc.fileUrl)}>
                        <FaDownload /> Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-list">No documents uploaded for this vehicle</div>
              )}

              <label className="upload-more">
                <FaUpload /> Upload additional documents
                <input
                  type="file"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;

                    try {
                      await apiSaveVehicleDocuments(getId(docsVehicle), files);

                      closeDocuments();
                      await fetchAll(true);
                    } catch (err) {
                      console.error("Upload documents error:", err);
                      setError("Unable to upload documents. Check the console for [API ERROR] details.");
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashContent;
