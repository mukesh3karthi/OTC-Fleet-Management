import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

  import windmillTransport from "../asset/Dash-image.png";

  import windProjectTransport from "../asset/wind-project-transport.jpg";
import jswLogo from "../asset/jsw.png";
import heftLogo from "../asset/heft.png";
import serenticaLogo from "../asset/serentica.png";
import avadaLogo from "../asset/avada.png";
import suzlonLogo from "../asset/suzlon.png";

  /* =========================================================

    API CONFIGURATION

    If your backend isn't on localhost:5000 while testing,

    change API_BASE below (or set VITE_API_URL in a .env file

    at your project root).

    ========================================================= */

  const RAW_API_BASE =

    import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

  const API_BASE = (() => {

    const trimmed = RAW_API_BASE.replace(/\/+$/, "");

    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;

  })();

  const VEHICLES_URL = `${API_BASE}/vehicles`;

  const OWNVEHICLES_URL = `${API_BASE}/ownvehicles`;

  const TRIPORDERS_URL = `${API_BASE}/triporders`;

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

      api.get(TRIPORDERS_URL),

    ]);

    const result = {

      vehicles: vehiclesRes.status === "fulfilled" ? unwrapList(vehiclesRes.value.data, "vehicles") : [],

      ownVehicles: ownRes.status === "fulfilled" ? unwrapList(ownRes.value.data, "ownVehicles", "vehicles") : [],

      trips: tripsRes.status === "fulfilled" ? unwrapList(tripsRes.value.data, "trips") : [],

      errors: {},

    };

    if (vehiclesRes.status === "rejected") result.errors.vehicles = vehiclesRes.reason?.message || "Failed to load /api/vehicles";

    if (ownRes.status === "rejected") result.errors.ownVehicles = ownRes.reason?.message || "Failed to load /api/ownvehicles";

    if (tripsRes.status === "rejected") result.errors.trips = tripsRes.reason?.message || "Failed to load /api/triporders";

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
    const clientSliderRef = useRef(null);
    const [clientSlide, setClientSlide] = useState(0);

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

      { number: "4", title: "Branches", description: "Strategic Locations" },

      { number: "1000+", title: "Clients", description: "Successfully Served" },

      { number: "24/7", title: "Operations", description: "Logistics Support" },

    ];

    const locations = [

      {

        name: "Mumbai",

        type: "Head Office",

        address: "Office No. 1309, 13th Floor, Satra Plaza, Sector 19D, Vashi, Navi Mumbai, Maharashtra - 400703",

      },

      {

        name: "Chennai",

        type: "Corporate Office",

        address: "OM Trans Infra Corporation Pvt Ltd, 1/53, Poonamallee Highway, Vanagaram, Near Mahesh Kumar Hotel, Chennai - 600095",

      },

      {

        name: "Bangalore",

        type: "Branch Office",

        address: "OM Trans Infra Corporation Pvt Ltd, No. 33, RAB Complex, 4th Floor, 18th Main Road, 15th Cross, J.P. Nagar 2nd Phase, Bangalore - 560078",

      },

      {

        name: "Pune",

        type: "Branch Office",

        address: "Shop No. 49/50, Tapaswi Plaza, Old Pune-Mumbai Highway, Akurdi, Pune - 411019, Maharashtra",

      },

    ];

    const clients = [
      { name: "JSW", short: "JSW", logo: jswLogo, tone: "blue" },
      { name: "HEFT", short: "HEFT", logo: heftLogo, tone: "orange" },
      { name: "Serentica", short: "SERENTICA", logo: serenticaLogo, tone: "teal" },
      { name: "Avada", short: "AVADA", logo: avadaLogo, tone: "sky" },
      { name: "Suzlon", short: "SUZLON", logo: suzlonLogo, tone: "green" },
    ];

    const scrollClientSlider = useCallback((direction = 1) => {
      const slider = clientSliderRef.current;
      if (!slider) return;
      const card = slider.querySelector(".client-logo-slide");
      if (!card) return;
      const gap = 14;
      const step = card.getBoundingClientRect().width + gap;
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      let nextLeft = slider.scrollLeft + direction * step;
      if (direction > 0 && nextLeft >= maxScroll - 4) nextLeft = 0;
      if (direction < 0 && nextLeft < 0) nextLeft = maxScroll;
      slider.scrollTo({ left: nextLeft, behavior: "smooth" });
      setClientSlide((current) => (current + direction + clients.length) % clients.length);
    }, [clients.length]);

    const goToClientSlide = useCallback((index) => {
      const slider = clientSliderRef.current;
      if (!slider) return;
      const card = slider.querySelector(".client-logo-slide");
      if (!card) return;
      const gap = 14;
      const step = card.getBoundingClientRect().width + gap;
      slider.scrollTo({ left: index * step, behavior: "smooth" });
      setClientSlide(index);
    }, []);

    useEffect(() => {
      const timer = window.setInterval(() => scrollClientSlider(1), 3500);
      return () => window.clearInterval(timer);
    }, [scrollClientSlider]);

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

          <div

            className="hero-visual"

            style={{ backgroundImage: `url(${windmillTransport})` }}

          >

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

        {/* WIND ENERGY PROJECT LOGISTICS */}

        <section className="dashboard-section wind-project-section">

          <div className="wind-project-visual">

            <img

              src={windProjectTransport}

              alt="Wind turbine blade transportation"

            />

            <div className="wind-project-image-overlay"></div>

            <div className="wind-project-image-badge">

              <FaShippingFast />

              <div>

                <strong>Specialized Project Logistics</strong>

                <span>Planning • Transport • Tracking</span>

              </div>

            </div>

          </div>

          <div className="wind-project-content">

            <span className="section-label">WIND ENERGY LOGISTICS</span>

            <h2>End-to-End Wind Project Logistics</h2>

            <p>

              OTC Groups delivers safe, reliable and efficient transportation for wind turbine blades and heavy project components with coordinated route planning, specialized vehicles and end-to-end movement visibility.

            </p>

            <div className="wind-capability-grid">

              <div className="wind-capability-card">

                <div className="wind-capability-icon"><FaRoute /></div>

                <div><strong>Route Planning</strong><span>Movement planning for long and oversized cargo.</span></div>

              </div>

              <div className="wind-capability-card">

                <div className="wind-capability-icon"><FaTruck /></div>

                <div><strong>Specialized Transport</strong><span>Vehicle coordination for blades and project cargo.</span></div>

              </div>

              <div className="wind-capability-card">

                <div className="wind-capability-icon"><FaMapMarkerAlt /></div>

                <div><strong>Movement Visibility</strong><span>Operational tracking from loading point to destination.</span></div>

              </div>

              <div className="wind-capability-card">

                <div className="wind-capability-icon"><FaCheckCircle /></div>

                <div><strong>Execution Control</strong><span>Structured coordination across every movement stage.</span></div>

              </div>

            </div>

            <div className="wind-project-footer">

              <div><strong>End-to-End</strong><span>Project Coordination</span></div>

              <div><strong>24/7</strong><span>Operational Support</span></div>

              <div><strong>Live</strong><span>Movement Visibility</span></div>

            </div>

          </div>

        </section>

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

        {/* =========================================================
       OUR CLIENTS - IMAGE SLIDER
       ========================================================= */}
      <section className="dashboard-section otc-clients-section client-logo-section">
        <div className="client-logo-header">
          <div>
            <span className="client-logo-kicker">OUR CLIENTS</span>
            <h2>Trusted By Leading <span>Companies</span></h2>
            <p>Powering progress with reliable transportation, project logistics and fleet operations.</p>
          </div>
          <div className="client-logo-header-right">
            <div className="client-logo-total">
              <div className="client-logo-total-icon"><FaUsers /></div>
              <div><strong>{clients.length}</strong><span>Key Clients</span></div>
            </div>
            <div className="client-logo-buttons">
              <button type="button" onClick={() => scrollClientSlider(-1)} aria-label="Previous client"><FaChevronLeft /></button>
              <button type="button" onClick={() => scrollClientSlider(1)} aria-label="Next client"><FaChevronRight /></button>
            </div>
          </div>
        </div>
        <div className="client-logo-window" ref={clientSliderRef}>
          <div className="client-logo-track">
            {[...clients, ...clients].map((client,index)=>(
              <article className={`client-logo-slide client-logo-${client.tone}`} key={`${client.name}-${index}`}>
                <div className="client-logo-image">
                  <img src={client.logo} alt={`${client.name} logo`} />
                </div>
                <div className="client-logo-text">
                  <strong>{client.short}</strong>
                  <span>Valued Client</span>
                </div>
                <div className="client-logo-arrow"><FaChevronRight /></div>
              </article>
            ))}
          </div>
        </div>
        <div className="client-logo-pagination">
          {clients.map((client,index)=>(
            <button
              type="button"
              key={client.name}
              className={clientSlide===index?"active":""}
              onClick={()=>goToClientSlide(index)}
              aria-label={`Show ${client.name}`}
            />
          ))}
        </div>
      </section>

      <section className="dashboard-section simple-order-operations">

          <div className="simple-operations-header">

            <span className="simple-operations-kicker">ORDER OPERATIONS</span>

            <h2>End-to-End <span>Order Management</span></h2>

            <p>Manage enquiries, approvals, quotations, vehicle allocation, documentation and trip execution in one streamlined workflow.</p>

          </div>

          <div className="simple-operations-flow">

            <div className="simple-operation-item">

              <div className="simple-operation-main">

                <div className="simple-operation-icon"><FaFileAlt /></div>

                <div className="simple-operation-title"><span>01</span><h3>Order &amp; Enquiry</h3></div>

              </div>

              <p>Capture customer requirements and initiate the operational order.</p>

            </div>

            <div className="simple-operation-connector"><span></span><div><FaChevronRight /></div><span></span></div>

            <div className="simple-operation-item">

              <div className="simple-operation-main">

                <div className="simple-operation-icon"><FaCheckCircle /></div>

                <div className="simple-operation-title"><span>02</span><h3>Quotation &amp; Approval</h3></div>

              </div>

              <p>Manage traffic quotations, commercial review and approvals.</p>

            </div>

            <div className="simple-operation-connector"><span></span><div><FaChevronRight /></div><span></span></div>

            <div className="simple-operation-item">

              <div className="simple-operation-main">

                <div className="simple-operation-icon"><FaShippingFast /></div>

                <div className="simple-operation-title"><span>03</span><h3>Vehicle &amp; Movement</h3></div>

              </div>

              <p>Allocate vehicles and maintain visibility of trip movement.</p>

            </div>

            <div className="simple-operation-connector"><span></span><div><FaChevronRight /></div><span></span></div>

            <div className="simple-operation-item">

              <div className="simple-operation-main">

                <div className="simple-operation-icon"><FaFileAlt /></div>

                <div className="simple-operation-title"><span>04</span><h3>PO, LR &amp; POD</h3></div>

              </div>

              <p>Keep operational documents organized through order completion.</p>

            </div>

          </div>

        </section>

        <section className="dashboard-section otc-network-section professional-network-section">

          <div className="professional-network-head">

            <div>

              <span className="professional-network-kicker">OUR NETWORK</span>

              <h2>Company Presence</h2>

              <p>Strategically positioned offices supporting customers and operations across key logistics markets.</p>

            </div>

            <div className="professional-network-total">

              <strong>{locations.length}</strong>

              <span>Locations</span>

            </div>

          </div>

          <div className="professional-location-grid">

            {locations.map((location,index)=>{

              const stateMap={

                "Mumbai":"Maharashtra",

                Chennai:"Tamil Nadu",

                Bangalore:"Karnataka",

                Pune:"Maharashtra",

              };

              return(

                <article className={`professional-location-card ${index===0?"professional-location-hq":""}`} key={location.name}>

                  <div className="professional-location-top">

                    <div className="professional-location-icon"><FaMapMarkerAlt /></div>

                    {index===0&&<span className="professional-location-hq-badge">HQ</span>}

                  </div>

                  <span className="professional-location-type">{location.type}</span>

                  <h3>{location.name}</h3>

                  <div className="professional-location-address">

                    <span>OFFICE ADDRESS</span>

                    <p>{location.address}</p>

                  </div>

                  <div className="professional-location-footer">

                    <strong>{stateMap[location.name]||"India"}</strong>

                    <span>INDIA</span>

                  </div>

                </article>

              );

            })}

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
