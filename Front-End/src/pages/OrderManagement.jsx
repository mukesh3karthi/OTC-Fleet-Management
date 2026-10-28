import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCheckCircle,
  FaClipboardCheck,
  FaClock,
  FaFileInvoice,
  FaMapMarkerAlt,
  FaRoute,
  FaSearch,
  FaShippingFast,
  FaTruck,
  FaUserTie,
  FaChevronDown,
  FaSyncAlt,
} from "react-icons/fa";
import "../pagescss/ordermanagement.css";

/* =========================================================
   API
========================================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const TRIP_API = `${API_BASE_URL}/api/triporders`;

const getAdminAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token?.trim()) {
    throw new Error("Please sign in with your administrator account.");
  }

  return { Authorization: `Bearer ${token}` };
};

/* =========================================================
   COMMON HELPERS
========================================================= */

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getFirstValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  ) ?? "";

const getArray = (...values) =>
  values.find((value) => Array.isArray(value)) || [];

/* =========================================================
   KAM HELPERS
========================================================= */

const getOrderCreatorKey = (trip) => {
  const creator = trip?.createdBy;

  if (creator && typeof creator === "object") {
    const id = getFirstValue(creator._id, creator.id);

    if (id) return `id:${String(id)}`;

    const username = normalize(creator.username);

    if (username) return `username:${username}`;

    const name = normalize(creator.name);

    if (name) return `name:${name}`;
  }

  if (typeof creator === "string" && creator.trim()) {
    return `id:${creator.trim()}`;
  }

  return "unassigned";
};

const getOrderCreatorName = (trip) => {
  const creator = trip?.createdBy;

  if (creator && typeof creator === "object") {
    const name = String(getFirstValue(creator.name, creator.username)).trim();

    if (name) return name;
  }

  const key = getOrderCreatorKey(trip);

  if (key === "unassigned") {
    return "Unassigned / Deleted User";
  }

  return `KAM (${key.replace(/^id:/, "")})`;
};

/* =========================================================
   ORDER HELPERS
========================================================= */

const getTripId = (trip) =>
  getFirstValue(
    trip?.tripId,
    trip?.orderId,
    trip?.orderNumber,
    trip?.id,
    trip?._id,
  );

const getCustomer = (trip) =>
  getFirstValue(
    trip?.customer,
    trip?.customerName,
    trip?.client,
    trip?.enquiryDetails?.customer,
    trip?.enquiryDetails?.customerName,
  );

const getMaterial = (trip) =>
  getFirstValue(
    trip?.materialType,
    trip?.material,
    trip?.cargo,
    trip?.materialName,
    trip?.enquiryDetails?.materialType,
    trip?.enquiryDetails?.material,
  );

const getOrigin = (trip) =>
  getFirstValue(
    trip?.origin,
    trip?.loadingPoint,
    trip?.fromLocation,
    trip?.route?.origin,
    trip?.enquiryDetails?.origin,
  );

const getDestination = (trip) =>
  getFirstValue(
    trip?.destination,
    trip?.unloadingPoint,
    trip?.toLocation,
    trip?.route?.destination,
    trip?.enquiryDetails?.destination,
  );

const getMovement = (trip) =>
  getFirstValue(
    trip?.movement,
    trip?.movementType,
    trip?.typeOfMovement,
    trip?.enquiryDetails?.movementType,
    "General",
  );

const isIntercartingOrder = (trip) =>
  normalize(getMovement(trip)).replace(/[\s_-]+/g, "") === "intercarting";

const getSiteLocation = (trip) =>
  getFirstValue(trip?.siteLocation, trip?.enquiryDetails?.siteLocation);

const getRawStage = (trip) =>
  getFirstValue(
    trip?.stage,
    trip?.currentStage,
    trip?.orderStage,
    trip?.lifecycleStage,
    "Enquiry Details",
  );

const getStatus = (trip) =>
  getFirstValue(
    trip?.status,
    trip?.tripStatus,
    trip?.trackingStatus,
    trip?.currentStatus,
    "Pending",
  );

/* =========================================================
   VEHICLE AND TRACKING HELPERS
========================================================= */

const getAllocatedVehicles = (trip) =>
  getArray(
    trip?.allocatedVehicles,
    trip?.vehicleAllocated,
    trip?.tracking?.allocatedVehicles,
    trip?.trackingInput?.allocatedVehicles,
  );

const getCurrentVehicles = (trip) =>
  getAllocatedVehicles(trip).filter(
    (vehicle) => normalize(vehicle?.vehicleStatus) !== "replaced",
  );

const isTransportCompleted = (trip) => {
  const vehicles = getCurrentVehicles(trip);
  const required = Math.max(0, Math.floor(Number(trip?.totalVehicles) || 0)) ||
    (Array.isArray(trip?.vehicleRequirements) ? trip.vehicleRequirements : [])
      .reduce((sum, item) => sum + Math.max(0, Math.floor(Number(item?.quantity) || 0)), 0);
  return required > 0 && vehicles.length >= required &&
    vehicles.every((vehicle) =>
      normalize(vehicle?.unloading?.status) === "completed" &&
      Boolean(vehicle?.unloading?.pointOutDate));
};

const isInvoiceFullyPaid = (trip) => {
  const invoice = trip?.invoicePayment || {};
  const total = Number(invoice.totalAmount);
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  const receivedCents = payments.length
    ? payments.reduce((sum, payment) => sum + Math.round(Number(payment.amount || 0) * 100), 0)
    : Math.round(Number(invoice.receivedAmount || 0) * 100);
  return Boolean(
    String(invoice.invoiceNumber || "").trim() &&
    String(invoice.invoiceDate || "").trim() &&
    invoice.totalAmount != null && Number.isFinite(total) && total > 0 &&
    receivedCents >= Math.round(total * 100)
  );
};

const getStage = (trip) => {
  if (isTransportCompleted(trip))
    return isInvoiceFullyPaid(trip) ? "Trip Complete" : "Invoice & Payment";
  const raw = getRawStage(trip);
  return ["trip complete", "trip completed", "completed"].includes(normalize(raw))
    ? "Tracking" : raw;
};

const getVehicleNumber = (trip) => {
  const allocated = getAllocatedVehicles(trip);

  if (allocated.length > 0) {
    return getFirstValue(
      allocated[0]?.vehicleNumber,
      allocated[0]?.vehicleNo,
      allocated[0]?.registrationNumber,
      "-",
    );
  }

  return getFirstValue(
    trip?.vehicleNumber,
    trip?.vehicleNo,
    trip?.vehicle,
    "-",
  );
};

const getDailyTracking = (trip) =>
  getCurrentVehicles(trip).flatMap((vehicle) =>
    getArray(vehicle?.dailyTracking)
  ).concat(getArray(
    trip?.dailyTracking, trip?.trackingUpdates,
    trip?.tracking?.dailyTracking, trip?.trackingInput?.dailyTracking,
  ));

const getLatestTracking = (trip) => {
  const tracking = getDailyTracking(trip);
  return tracking.length ? tracking[tracking.length - 1] : null;
};

const getMovementStatus = (trip) => {
  const vehicles = getCurrentVehicles(trip);
  if (vehicles.length && vehicles.every((vehicle) =>
    normalize(vehicle?.unloading?.status) === "completed")) return "Reached";
  const currentStatuses = vehicles.map((vehicle) => {
    const entries = getArray(vehicle?.dailyTracking);
    const last = entries.at(-1);
    return normalize(getFirstValue(last?.status, vehicle?.status));
  });
  for (const status of ["breakdown", "moving", "loading", "idle", "reached"]) {
    if (currentStatuses.some((item) => item === status)) return status;
  }
  const latest = getLatestTracking(trip);

  return getFirstValue(
    latest?.status,
    latest?.movementStatus,
    latest?.vehicleStatus,
    trip?.trackingStatus,
    trip?.status,
    "",
  );
};

const getTrackingStatus = (item) =>
  normalize(
    getFirstValue(item?.status, item?.movementStatus, item?.vehicleStatus),
  );

const isHaltStatus = (status) =>
  status.includes("halt") ||
  status.includes("idle") ||
  status.includes("stopped");

/* =========================================================
   STATUS CHECKERS
========================================================= */

const isCompletedTrip = (trip) => {
  return isTransportCompleted(trip) && isInvoiceFullyPaid(trip);
};

const isMovingTrip = (trip) => {
  if (isCompletedTrip(trip)) return false;
  return getCurrentVehicles(trip).some((vehicle) => {
    if (normalize(vehicle?.unloading?.status) === "completed") return false;
    const last = getArray(vehicle?.dailyTracking).at(-1);
    return ["moving", "in transit", "in-transit"].includes(
      normalize(getFirstValue(last?.status, vehicle?.status))
    );
  });
};

const isPendingTrip = (trip) => {
  if (isCompletedTrip(trip)) return false;

  const status = normalize(getStatus(trip));
  const stage = normalize(getStage(trip));

  return (
    status.includes("pending") ||
    status.includes("await") ||
    stage.includes("approval") ||
    stage.includes("quotation") ||
    stage.includes("vendor finalization") ||
    stage.includes("po document")
  );
};

/* =========================================================
   PIPELINE
========================================================= */

const PIPELINE_CONFIG = [
  {
    label: "Enquiry",
    icon: <FaClipboardCheck />,
    keywords: ["enquiry"],
  },
  {
    label: "Approval",
    icon: <FaCheckCircle />,
    keywords: ["first approval", "approval management"],
  },
  {
    label: "Quotation",
    icon: <FaFileInvoice />,
    keywords: ["traffic quotation", "second approval", "quotation approval"],
  },
  {
    label: "Vendor Finalization",
    icon: <FaBoxOpen />,
    keywords: ["vendor finalization"],
  },
  {
    label: "PO Document",
    icon: <FaFileInvoice />,
    keywords: ["po document", "order placed"],
  },
  {
    label: "Tracking",
    icon: <FaMapMarkerAlt />,
    keywords: ["tracking", "tracking input"],
  },
  {
    label: "Invoice & Payment",
    icon: <FaFileInvoice />,
    keywords: ["invoice", "payment"],
  },
  {
    label: "Completed",
    icon: <FaCheckCircle />,
    keywords: [],
  },
];

/* =========================================================
   SHARED KPI CARD
========================================================= */

const KpiCard = ({ variant, icon, title, subtitle, value }) => (
  <article className={`control-kpi-card control-kpi-${variant}`}>
    <div className={`control-kpi-icon ${variant}`}>{icon}</div>

    <div className="control-kpi-content">
      <span>{title}</span>
      <small>{subtitle}</small>
    </div>

    <strong className="control-kpi-number">{value}</strong>

    <div className="control-kpi-wave" aria-hidden="true">
      <svg viewBox="0 0 400 40" preserveAspectRatio="none">
        <path
          d="M0 20 C70 0 130 38 200 20 S330 0 400 20 V40 H0 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  </article>
);

/* =========================================================
   COMPONENT
========================================================= */

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [kamFilter, setKamFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [movementFilter, setMovementFilter] = useState("All Movements");

  /* -------------------------------------------------------
     FETCH ORDERS
  ------------------------------------------------------- */

  const fetchOrders = async (isRefresh = false) => {
    const manualRefresh = isRefresh === true;
    try {
      if (manualRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const response = await axios.get(TRIP_API, {
        headers: getAdminAuthHeaders(),
      });

      const result = getArray(
        response.data,
        response.data?.trips,
        response.data?.data,
        response.data?.orders,
      );

      setOrders(result);
    } catch (err) {
      console.error("Order dashboard API error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load dashboard data.",
      );

      if (!manualRefresh) setOrders([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* -------------------------------------------------------
     KAM OPTIONS AND DASHBOARD SCOPE
  ------------------------------------------------------- */

  const kamOptions = useMemo(() => {
    const users = new Map();

    orders.forEach((trip) => {
      const value = getOrderCreatorKey(trip);
      const label = getOrderCreatorName(trip);

      if (!users.has(value)) {
        users.set(value, { value, label });
      }
    });

    return [...users.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [orders]);

  const selectedKamName =
    kamFilter === "all"
      ? "All KAMs"
      : kamOptions.find((kam) => kam.value === kamFilter)?.label ||
        "Selected KAM";

  const kamOrders = useMemo(() => {
    if (kamFilter === "all") return orders;

    return orders.filter((trip) => getOrderCreatorKey(trip) === kamFilter);
  }, [orders, kamFilter]);

  const handleKamChange = (event) => {
    setKamFilter(event.target.value);
    setSearch("");
    setStageFilter("All Stages");
    setMovementFilter("All Movements");
  };

  /* -------------------------------------------------------
     KPI
  ------------------------------------------------------- */

  const dashboardStats = useMemo(
    () => ({
      totalOrders: kamOrders.length,
      completed: kamOrders.filter(isCompletedTrip).length,
      inTransit: kamOrders.filter(isMovingTrip).length,
      pending: kamOrders.filter(isPendingTrip).length,
    }),
    [kamOrders],
  );

  /* -------------------------------------------------------
     PIPELINE
  ------------------------------------------------------- */

  const pipelineData = useMemo(() => {
    const total = kamOrders.length || 1;

    return PIPELINE_CONFIG.map((config) => ({
      ...config,
      total,
      value: kamOrders.filter((trip) => {
        const completed = isCompletedTrip(trip);
        if (config.label === "Completed") return completed;
        if (completed) return false;

        const stage = normalize(getStage(trip));
        const invoiceStage = ["invoice", "payment"].some((keyword) =>
          stage.includes(keyword),
        );
        if (config.label === "Invoice & Payment") return invoiceStage;
        if (invoiceStage) return false;

        return config.keywords.some((keyword) =>
          stage.includes(normalize(keyword)),
        );
      }).length,
    }));
  }, [kamOrders]);

  /* -------------------------------------------------------
     MOVEMENT
  ------------------------------------------------------- */

  const movementData = useMemo(() => {
    const counters = {
      moving: 0,
      loading: 0,
      halted: 0,
      breakdown: 0,
      reached: 0,
    };

    kamOrders.forEach((trip) => {
      const status = normalize(getMovementStatus(trip));

      if (isCompletedTrip(trip)) {
        counters.reached += 1;
        return;
      }

      if (status.includes("breakdown")) {
        counters.breakdown += 1;
        return;
      }

      if (isHaltStatus(status)) {
        counters.halted += 1;
        return;
      }

      if (status.includes("reach") || status.includes("deliver")) {
        counters.reached += 1;
        return;
      }

      // Avoid treating "unloading" as "loading".
      if (status.includes("loading") && !status.includes("unloading")) {
        counters.loading += 1;
        return;
      }

      if (status.includes("moving") || status.includes("transit")) {
        counters.moving += 1;
      }
    });

    return [
      {
        label: "Moving",
        value: counters.moving,
        className: "moving",
      },
      {
        label: "Loading",
        value: counters.loading,
        className: "loading",
      },
      {
        label: "Halted",
        value: counters.halted,
        className: "halted",
      },
      {
        label: "Breakdown",
        value: counters.breakdown,
        className: "breakdown",
      },
      {
        label: "Reached",
        value: counters.reached,
        className: "reached",
      },
    ];
  }, [kamOrders]);

  const activeMovementTotal = movementData
    .filter((item) => item.className !== "reached")
    .reduce((sum, item) => sum + item.value, 0);

  /* -------------------------------------------------------
     OPERATION HEALTH
  ------------------------------------------------------- */

  const healthStats = useMemo(() => {
    const completed = kamOrders.filter(isCompletedTrip);

    const hasIssue = (trip) =>
      getDailyTracking(trip).some((item) => {
        const status = getTrackingStatus(item);

        return status.includes("breakdown") || isHaltStatus(status);
      });

    const breakdowns = kamOrders.filter((trip) =>
      getDailyTracking(trip).some((item) =>
        getTrackingStatus(item).includes("breakdown"),
      ),
    ).length;

    const minorHalts = kamOrders.filter((trip) =>
      getDailyTracking(trip).some((item) =>
        isHaltStatus(getTrackingStatus(item)),
      ),
    ).length;

    // Only completed trips belong in the issue-free calculation.
    const issueFreeTrips = completed.filter((trip) => !hasIssue(trip)).length;

    return {
      completedTrips: completed.length,
      breakdowns,
      minorHalts,
      issueFreeTrips,
      issueFreePercentage: completed.length
        ? ((issueFreeTrips / completed.length) * 100).toFixed(1)
        : "0.0",
    };
  }, [kamOrders]);

  /* -------------------------------------------------------
     MONTHLY PERFORMANCE
  ------------------------------------------------------- */

  const monthlyData = useMemo(() => {
    const today = new Date();
    const months = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);

      months.push({
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
        enquiries: 0,
        orders: 0,
      });
    }

    kamOrders.forEach((trip) => {
      const createdDate = getFirstValue(
        trip?.createdAt,
        trip?.enquiryDate,
        trip?.createdDate,
        trip?.date,
      );

      if (!createdDate) return;

      const date = new Date(createdDate);

      if (Number.isNaN(date.getTime())) return;

      const target = months.find(
        (month) =>
          month.year === date.getFullYear() &&
          month.monthIndex === date.getMonth(),
      );

      if (!target) return;

      target.enquiries += 1;

      const stage = normalize(getStage(trip));

      if (!stage.includes("enquiry") || isCompletedTrip(trip)) {
        target.orders += 1;
      }
    });

    return months;
  }, [kamOrders]);

  const maxChartValue = Math.max(
    1,
    ...monthlyData.flatMap((item) => [item.enquiries, item.orders]),
  );

  /* -------------------------------------------------------
     TABLE FILTER OPTIONS
  ------------------------------------------------------- */

  const stages = useMemo(
    () => [
      "All Stages",
      ...Array.from(new Set(kamOrders.map(getStage).filter(Boolean))),
    ],
    [kamOrders],
  );

  const movements = useMemo(
    () => [
      "All Movements",
      ...Array.from(new Set(kamOrders.map(getMovement).filter(Boolean))),
    ],
    [kamOrders],
  );

  /* -------------------------------------------------------
     FILTERED TABLE
  ------------------------------------------------------- */

  const filteredOrders = useMemo(() => {
    const query = normalize(search);

    return kamOrders.filter((trip) => {
      const stage = getStage(trip);
      const movement = getMovement(trip);

      const searchableText = [
        getTripId(trip),
        getCustomer(trip),
        getMaterial(trip),
        getOrigin(trip),
        getDestination(trip),
        getSiteLocation(trip),
        stage,
        movement,
        getVehicleNumber(trip),
        getMovementStatus(trip) || getStatus(trip),
        getOrderCreatorName(trip),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesStage =
        stageFilter === "All Stages" || stage === stageFilter;

      const matchesMovement =
        movementFilter === "All Movements" || movement === movementFilter;

      return matchesSearch && matchesStage && matchesMovement;
    });
  }, [kamOrders, search, stageFilter, movementFilter]);

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="control-dashboard">
        <div
          style={{
            minHeight: "240px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0b5260",
            fontWeight: 700,
          }}
        >
          Loading dashboard...
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="control-dashboard">
      {/* HEADER */}
      <section className="control-header">
        <div className="control-header-left">
          <div className="control-header-icon">
            <FaRoute />
          </div>

          <div>
            <span className="control-eyebrow">OPERATIONS CONTROL</span>

            <h1>Order Management Dashboard</h1>

            <p>
              Live operational overview of orders, movements and execution
              performance.
            </p>
          </div>
        </div>

        <div className="control-header-right">
          <button type="button" className="dashboard-refresh-btn"
            onClick={() => fetchOrders(true)} disabled={refreshing}
            aria-label="Refresh order dashboard">
            <FaSyncAlt className={refreshing ? "refresh-spinning" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
          <div className="kam-compact-filter">
            <FaUserTie className="kam-compact-filter__icon" />

            <select
              aria-label="KAM performance"
              value={kamFilter}
              onChange={handleKamChange}
            >
              <option value="all">All KAMs</option>

              {kamOptions.map((kam) => (
                <option key={kam.value} value={kam.value}>
                  {kam.label}
                </option>
              ))}
            </select>

            <FaChevronDown
              className="kam-compact-filter__arrow"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          style={{
            marginBottom: "14px",
            padding: "11px 14px",
            border: "1px solid #f0c6c3",
            borderRadius: "9px",
            background: "#fff3f2",
            color: "#b33b33",
            fontSize: "11px",
            fontWeight: 650,
          }}
        >
          {error}

          <button
            type="button"
            onClick={fetchOrders}
            style={{
              marginLeft: "12px",
              border: 0,
              background: "transparent",
              color: "#0b817a",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* SELECTED KAM */}
      {kamFilter !== "all" && (
        <div
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "12px",
            padding: "9px 13px",
            border: "1px solid #d8e8e7",
            borderRadius: "9px",
            background: "#ffffff",
            color: "#123447",
            fontSize: "12px",
          }}
        >
          <span>
            Performance: <strong>{selectedKamName}</strong>
            {" · "}
            {kamOrders.length} orders
          </span>

          <button
            type="button"
            onClick={() => {
              setKamFilter("all");
              setSearch("");
              setStageFilter("All Stages");
              setMovementFilter("All Movements");
            }}
            style={{
              border: 0,
              padding: "4px 0",
              background: "transparent",
              color: "#087e78",
              fontFamily: "inherit",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Show All KAMs
          </button>
        </div>
      )}

      {/* KPI */}
      <section className="control-kpi-grid">
        <KpiCard
          variant="total"
          icon={<FaClipboardCheck />}
          title="Total Orders"
          subtitle={kamFilter === "all" ? "Overall orders" : "Selected KAM"}
          value={dashboardStats.totalOrders}
        />

        <KpiCard
          variant="transit"
          icon={<FaTruck />}
          title="In Transit"
          subtitle="Active movements"
          value={dashboardStats.inTransit}
        />

        <KpiCard
          variant="pending"
          icon={<FaClock />}
          title="Pending Action"
          subtitle="Requires attention"
          value={dashboardStats.pending}
        />

        <KpiCard
          variant="completed"
          icon={<FaCheckCircle />}
          title="Completed"
          subtitle="Successfully completed"
          value={dashboardStats.completed}
        />
      </section>

      {/* PIPELINE AND MOVEMENT */}
      <section className="control-main-grid">
        <article className="control-card pipeline-card">
          <div className="control-card-header">
            <div>
              <span className="control-card-eyebrow">WORKFLOW</span>
              <h2>Order Pipeline</h2>
              <p>Current orders across lifecycle stages</p>
            </div>

            <div className="control-card-header-icon">
              <FaShippingFast />
            </div>
          </div>

          <div className="pipeline-list">
            {pipelineData.map((item) => {
              const percentage = Math.min((item.value / item.total) * 100, 100);

              return (
                <div className="pipeline-row" key={item.label}>
                  <div className="pipeline-name">
                    <span className="pipeline-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>

                  <div className="pipeline-progress-area">
                    <div className="pipeline-track">
                      <span
                        className="pipeline-progress"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <strong className="pipeline-value">{item.value}</strong>
                </div>
              );
            })}
          </div>
        </article>

        <article className="control-card movement-card">
          <div className="control-card-header">
            <div>
              <span className="control-card-eyebrow">TRACKING</span>
              <h2>Live Movement</h2>
              <p>Current vehicle movement status</p>
            </div>

            <div className="movement-live-badge">
              <span />
              LIVE
            </div>
          </div>

          <div className="movement-overview">
            <div className="movement-total">
              <div className="movement-ring">
                <div className="movement-ring-inner">
                  <strong>{activeMovementTotal}</strong>
                  <span>ACTIVE</span>
                </div>
              </div>
            </div>

            <div className="movement-status-list">
              {movementData.map((item) => (
                <div className="movement-status-row" key={item.label}>
                  <div className="movement-status-name">
                    <span className={`movement-dot ${item.className}`} />
                    {item.label}
                  </div>

                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      {/* ANALYTICS */}
      <section className="control-analytics-grid">
        <article className="control-card performance-card">
          <div className="control-card-header">
            <div>
              <span className="control-card-eyebrow">ANALYTICS</span>
              <h2>Monthly Performance</h2>
              <p>Enquiries compared with confirmed orders</p>
            </div>

            <div className="performance-legend">
              <span>
                <i className="legend-enquiry" />
                Enquiries
              </span>

              <span>
                <i className="legend-order" />
                Orders
              </span>
            </div>
          </div>

          <div className="performance-chart">
            <div className="chart-grid-lines">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="performance-columns">
              {monthlyData.map((item) => (
                <div
                  className="performance-column"
                  key={`${item.year}-${item.monthIndex}`}
                >
                  <div className="performance-bars">
                    <div
                      className="performance-bar enquiry"
                      title={`${item.month} ${item.year}: ${item.enquiries} enquiries`}
                      style={{
                        height: `${(item.enquiries / maxChartValue) * 150}px`,
                      }}
                    >
                      <span>{item.enquiries}</span>
                    </div>

                    <div
                      className="performance-bar order"
                      title={`${item.month} ${item.year}: ${item.orders} orders`}
                      style={{
                        height: `${(item.orders / maxChartValue) * 150}px`,
                      }}
                    >
                      <span>{item.orders}</span>
                    </div>
                  </div>

                  <strong>{item.month}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="control-card health-card">
          <div className="control-card-header">
            <div>
              <span className="control-card-eyebrow">PERFORMANCE</span>
              <h2>Operation Health</h2>
              <p>Trip execution and movement quality</p>
            </div>

            <FaCheckCircle className="health-header-icon" />
          </div>

          <div className="health-content">
            <div className="health-score">
              <div
                className="health-ring"
                style={{
                  background: `conic-gradient(
                    #0a978d 0deg ${
                      Number(healthStats.issueFreePercentage) * 3.6
                    }deg,
                    #e0e9ea ${
                      Number(healthStats.issueFreePercentage) * 3.6
                    }deg 360deg
                  )`,
                }}
              >
                <div className="health-ring-inner">
                  <strong>{healthStats.issueFreePercentage}%</strong>
                  <span>ISSUE FREE</span>
                </div>
              </div>
            </div>

            <div className="health-metrics">
              <div className="health-metric">
                <div>
                  <span>Completed Trips</span>
                  <strong>{healthStats.completedTrips}</strong>
                </div>
              </div>

              <div className="health-metric success">
                <div>
                  <span>Issue-Free Trips</span>
                  <strong>{healthStats.issueFreeTrips}</strong>
                </div>
              </div>

              <div className="health-metric warning">
                <div>
                  <span>Minor Halts</span>
                  <strong>{healthStats.minorHalts}</strong>
                </div>
              </div>

              <div className="health-metric danger">
                <div>
                  <span>Breakdowns</span>
                  <strong>{healthStats.breakdowns}</strong>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* ORDERS */}
      <section className="active-orders-card">
        <div className="active-orders-header">
          <div>
            <span className="control-card-eyebrow">OPERATIONS</span>
            <h2>Orders</h2>
            <p>
              {kamFilter === "all"
                ? "Monitor customer orders and execution status."
                : `Orders created by ${selectedKamName}.`}
            </p>
          </div>

          <div className="active-order-count">
            <span />
            {filteredOrders.length} Orders
          </div>
        </div>

        {/* TABLE FILTERS */}
        <div className="active-orders-toolbar">
          <div className="dashboard-search">
            <FaSearch />

            <input
              type="text"
              aria-label="Search orders"
              placeholder="Search order, customer, vehicle, route, KAM..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            aria-label="Filter by movement"
            value={movementFilter}
            onChange={(event) => setMovementFilter(event.target.value)}
            className="dashboard-filter"
          >
            {movements.map((movement) => (
              <option key={movement} value={movement}>
                {movement}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by stage"
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
            className="dashboard-filter"
          >
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        {/* TABLE */}
        <div className="active-orders-table-wrap">
          <table className="active-orders-table">
            <thead>
              <tr>
                <th>ORDER</th>
                <th>CUSTOMER</th>
                <th>MOVEMENT</th>
                <th>ROUTE / SITE</th>
                <th>STAGE</th>
                <th>STATUS</th>
                <th>CREATED BY</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="dashboard-empty">
                    {error
                      ? "Unable to load orders."
                      : "No orders found for the selected filters."}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((trip) => {
                  const tripId = getTripId(trip);
                  const customer = getCustomer(trip);
                  const material = getMaterial(trip);
                  const movement = getMovement(trip);
                  const origin = getOrigin(trip);
                  const destination = getDestination(trip);
                  const stage = getStage(trip);
                  const status = getMovementStatus(trip) || getStatus(trip);

                  const movementClass = normalize(movement).replace(
                    /[^a-z0-9]+/g,
                    "-",
                  );

                  const statusClass = normalize(status).replace(
                    /[^a-z0-9]+/g,
                    "-",
                  );

                  return (
                    <tr key={trip?._id || tripId}>
                      <td>
                        <span className="dashboard-order-id">
                          {tripId || "-"}
                        </span>
                      </td>

                      <td>
                        <div className="customer-cell">
                          <strong>{customer || "-"}</strong>
                          <span>{material || "-"}</span>
                        </div>
                      </td>

                      <td>
                        <span className={`movement-badge ${movementClass}`}>
                          {movement || "-"}
                        </span>
                      </td>

                      <td>
                        <div className="dashboard-route">
                          {isIntercartingOrder(trip) ? (
                            <span>{getSiteLocation(trip) || "—"}</span>
                          ) : (
                            <>
                              <span>{origin || "-"}</span>
                              <FaArrowRight />
                              <span>{destination || "-"}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="dashboard-stage">{stage || "-"}</span>
                      </td>

                      <td>
                        <span className={`dashboard-status ${statusClass}`}>
                          <i />
                          {status || "-"}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#123447",
                          }}
                        >
                          {getOrderCreatorName(trip)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default OrderManagement;
