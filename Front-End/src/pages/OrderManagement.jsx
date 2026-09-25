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
} from "react-icons/fa";

import "../pagescss/ordermanagement.css";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const TRIP_API = `${API_BASE_URL}/api/triporders`;

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getFirstValue = (...values) => {
  const value = values.find(
    (item) =>
      item !== undefined &&
      item !== null &&
      String(item).trim() !== ""
  );

  return value ?? "";
};

const getArray = (...values) => {
  const value = values.find((item) => Array.isArray(item));
  return value || [];
};

/* =========================================================
   TRIP FIELD HELPERS
========================================================= */

const getTripId = (trip) =>
  getFirstValue(
    trip?.tripId,
    trip?.orderId,
    trip?.orderNumber,
    trip?.id,
    trip?._id
  );

const getCustomer = (trip) =>
  getFirstValue(
    trip?.customer,
    trip?.customerName,
    trip?.client,
    trip?.enquiryDetails?.customer,
    trip?.enquiryDetails?.customerName
  );

const getMaterial = (trip) =>
  getFirstValue(
    trip?.materialType,
    trip?.material,
    trip?.cargo,
    trip?.materialName,
    trip?.enquiryDetails?.materialType,
    trip?.enquiryDetails?.material
  );

const getOrigin = (trip) =>
  getFirstValue(
    trip?.origin,
    trip?.loadingPoint,
    trip?.fromLocation,
    trip?.route?.origin,
    trip?.enquiryDetails?.origin
  );

const getDestination = (trip) =>
  getFirstValue(
    trip?.destination,
    trip?.unloadingPoint,
    trip?.toLocation,
    trip?.route?.destination,
    trip?.enquiryDetails?.destination
  );

const getMovement = (trip) =>
  getFirstValue(
    trip?.movement,
    trip?.movementType,
    trip?.typeOfMovement,
    trip?.enquiryDetails?.movementType,
    "General"
  );

const getStage = (trip) =>
  getFirstValue(
    trip?.currentStage,
    trip?.stage,
    trip?.orderStage,
    trip?.lifecycleStage,
    "Enquiry Details"
  );

const getStatus = (trip) =>
  getFirstValue(
    trip?.status,
    trip?.tripStatus,
    trip?.trackingStatus,
    trip?.currentStatus,
    "Pending"
  );

/* =========================================================
   VEHICLE HELPERS
========================================================= */

const getAllocatedVehicles = (trip) =>
  getArray(
    trip?.allocatedVehicles,
    trip?.vehicleAllocated,
    trip?.tracking?.allocatedVehicles,
    trip?.trackingInput?.allocatedVehicles
  );

const getVehicleRequirements = (trip) =>
  getArray(
    trip?.vehicleRequirements,
    trip?.vehicles,
    trip?.requiredVehicles
  );

const getVehicleNumber = (trip) => {
  const allocated = getAllocatedVehicles(trip);

  if (allocated.length > 0) {
    return getFirstValue(
      allocated[0]?.vehicleNumber,
      allocated[0]?.vehicleNo,
      allocated[0]?.registrationNumber
    );
  }

  return getFirstValue(
    trip?.vehicleNumber,
    trip?.vehicleNo,
    trip?.vehicle,
    "-"
  );
};

/* =========================================================
   TRACKING HELPERS
========================================================= */

const getDailyTracking = (trip) =>
  getArray(
    trip?.dailyTracking,
    trip?.trackingUpdates,
    trip?.tracking?.dailyTracking,
    trip?.trackingInput?.dailyTracking
  );

const getLatestTracking = (trip) => {
  const tracking = getDailyTracking(trip);

  if (!tracking.length) {
    return null;
  }

  return tracking[tracking.length - 1];
};

const getMovementStatus = (trip) => {
  const latest = getLatestTracking(trip);

  return getFirstValue(
    latest?.status,
    latest?.movementStatus,
    latest?.vehicleStatus,
    trip?.trackingStatus,
    trip?.status,
    ""
  );
};

/* =========================================================
   STATUS CHECKERS
========================================================= */

const isCompletedTrip = (trip) => {
  const stage = normalize(getStage(trip));
  const status = normalize(getStatus(trip));

  return (
    stage.includes("trip complete") ||
    stage.includes("completed") ||
    status === "completed" ||
    status === "trip complete" ||
    status === "reached" ||
    status === "delivered"
  );
};

const isMovingTrip = (trip) => {
  if (isCompletedTrip(trip)) return false;

  const status = normalize(getMovementStatus(trip));
  const stage = normalize(getStage(trip));

  return (
    status === "moving" ||
    status === "in transit" ||
    status === "in-transit" ||
    stage.includes("tracking") ||
    stage.includes("trip started")
  );
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
   PIPELINE CONFIG
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
    keywords: [
      "first approval",
      "approval management",
    ],
  },
  {
    label: "Quotation",
    icon: <FaFileInvoice />,
    keywords: [
      "traffic quotation",
      "second approval",
      "quotation approval",
    ],
  },
  {
    label: "Vendor Finalization",
    icon: <FaBoxOpen />,
    keywords: ["vendor finalization"],
  },
  {
    label: "PO Document",
    icon: <FaFileInvoice />,
    keywords: [
      "po document",
      "order placed",
    ],
  },
  {
    label: "Tracking",
    icon: <FaMapMarkerAlt />,
    keywords: [
      "tracking",
      "tracking input",
      "trip complete",
    ],
  },
];

/* =========================================================
   COMPONENT
========================================================= */

const OrderManagement = () => {
  /* =======================================================
     STATE
  ======================================================= */

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [stageFilter, setStageFilter] =
    useState("All Stages");

  const [movementFilter, setMovementFilter] =
    useState("All Movements");

  /* =======================================================
     LOAD API DATA
  ======================================================= */

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(TRIP_API);

      let result = [];

      if (Array.isArray(response.data)) {
        result = response.data;
      } else if (Array.isArray(response.data?.trips)) {
        result = response.data.trips;
      } else if (Array.isArray(response.data?.data)) {
        result = response.data.data;
      } else if (
        Array.isArray(response.data?.orders)
      ) {
        result = response.data.orders;
      }

      setOrders(result);
    } catch (err) {
      console.error(
        "Order dashboard API error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load dashboard data."
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* =======================================================
     TOTAL KPI
  ======================================================= */

  const dashboardStats = useMemo(() => {
    const totalOrders = orders.length;

    const completed = orders.filter(
      isCompletedTrip
    ).length;

    const inTransit = orders.filter(
      isMovingTrip
    ).length;

    const pending = orders.filter(
      isPendingTrip
    ).length;

    const completedPercentage =
      totalOrders > 0
        ? Math.round(
            (completed / totalOrders) * 100
          )
        : 0;

    const transitPercentage =
      totalOrders > 0
        ? Math.round(
            (inTransit / totalOrders) * 100
          )
        : 0;

    const pendingPercentage =
      totalOrders > 0
        ? Math.round(
            (pending / totalOrders) * 100
          )
        : 0;

    return {
      totalOrders,
      completed,
      inTransit,
      pending,
      completedPercentage,
      transitPercentage,
      pendingPercentage,
    };
  }, [orders]);

  /* =======================================================
     PIPELINE DATA
  ======================================================= */

  const pipelineData = useMemo(() => {
    const total = orders.length || 1;

    return PIPELINE_CONFIG.map((config) => {
      const value = orders.filter((trip) => {
        const stage = normalize(
          getStage(trip)
        );

        return config.keywords.some(
          (keyword) =>
            stage.includes(
              normalize(keyword)
            )
        );
      }).length;

      return {
        ...config,
        value,
        total,
      };
    });
  }, [orders]);

  /* =======================================================
     MOVEMENT DATA
  ======================================================= */

  const movementData = useMemo(() => {
    const counters = {
      moving: 0,
      loading: 0,
      halted: 0,
      breakdown: 0,
      reached: 0,
    };

    orders.forEach((trip) => {
      const status = normalize(
        getMovementStatus(trip)
      );

      if (
        status.includes("breakdown")
      ) {
        counters.breakdown += 1;
        return;
      }

      if (
        status.includes("halt") ||
        status.includes("idle") ||
        status.includes("stopped")
      ) {
        counters.halted += 1;
        return;
      }

      if (
        status.includes("loading")
      ) {
        counters.loading += 1;
        return;
      }

      if (
        status.includes("reach") ||
        status.includes("deliver") ||
        isCompletedTrip(trip)
      ) {
        counters.reached += 1;
        return;
      }

      if (
        status.includes("moving") ||
        status.includes("transit")
      ) {
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
  }, [orders]);

  const activeMovementTotal =
    movementData
      .filter(
        (item) =>
          item.className !== "reached"
      )
      .reduce(
        (sum, item) =>
          sum + item.value,
        0
      );

  /* =======================================================
     OPERATION HEALTH
  ======================================================= */

  const healthStats = useMemo(() => {
    const completedTrips =
      orders.filter(
        isCompletedTrip
      ).length;

    let breakdowns = 0;
    let minorHalts = 0;

    orders.forEach((trip) => {
      const tracking =
        getDailyTracking(trip);

      const hasBreakdown =
        tracking.some((item) =>
          normalize(
            getFirstValue(
              item?.status,
              item?.movementStatus,
              item?.vehicleStatus
            )
          ).includes("breakdown")
        );

      const hasHalt =
        tracking.some((item) => {
          const status = normalize(
            getFirstValue(
              item?.status,
              item?.movementStatus,
              item?.vehicleStatus
            )
          );

          return (
            status.includes("halt") ||
            status.includes("idle") ||
            status.includes("stopped")
          );
        });

      if (hasBreakdown) {
        breakdowns += 1;
      }

      if (hasHalt) {
        minorHalts += 1;
      }
    });

    const issueTrips =
      orders.filter((trip) => {
        const tracking =
          getDailyTracking(trip);

        return tracking.some((item) => {
          const status = normalize(
            getFirstValue(
              item?.status,
              item?.movementStatus,
              item?.vehicleStatus
            )
          );

          return (
            status.includes("breakdown") ||
            status.includes("halt") ||
            status.includes("idle") ||
            status.includes("stopped")
          );
        });
      }).length;

    const issueFreeTrips =
      Math.max(
        completedTrips - issueTrips,
        0
      );

    const issueFreePercentage =
      completedTrips > 0
        ? (
            (issueFreeTrips /
              completedTrips) *
            100
          ).toFixed(1)
        : "0.0";

    return {
      completedTrips,
      breakdowns,
      minorHalts,
      issueFreeTrips,
      issueFreePercentage,
    };
  }, [orders]);

  /* =======================================================
     MONTHLY PERFORMANCE
  ======================================================= */

  const monthlyData = useMemo(() => {
    const today = new Date();

    const months = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth() - i,
        1
      );

      months.push({
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        month: date
          .toLocaleString("en-US", {
            month: "short",
          })
          .toUpperCase(),
        enquiries: 0,
        orders: 0,
      });
    }

    orders.forEach((trip) => {
      const createdDate = getFirstValue(
        trip?.createdAt,
        trip?.enquiryDate,
        trip?.createdDate,
        trip?.date
      );

      if (!createdDate) return;

      const date = new Date(createdDate);

      if (
        Number.isNaN(date.getTime())
      ) {
        return;
      }

      const target = months.find(
        (month) =>
          month.year ===
            date.getFullYear() &&
          month.monthIndex ===
            date.getMonth()
      );

      if (!target) return;

      target.enquiries += 1;

      const stage = normalize(
        getStage(trip)
      );

      if (
        !stage.includes("enquiry") ||
        isCompletedTrip(trip)
      ) {
        target.orders += 1;
      }
    });

    return months;
  }, [orders]);

  const maxChartValue = Math.max(
    1,
    ...monthlyData.flatMap((item) => [
      item.enquiries,
      item.orders,
    ])
  );

  /* =======================================================
     DYNAMIC STAGE FILTER
  ======================================================= */

  const stages = useMemo(() => {
    const values = orders
      .map((trip) => getStage(trip))
      .filter(Boolean);

    return [
      "All Stages",
      ...Array.from(new Set(values)),
    ];
  }, [orders]);

  /* =======================================================
     DYNAMIC MOVEMENT FILTER
  ======================================================= */

  const movements = useMemo(() => {
    const values = orders
      .map((trip) => getMovement(trip))
      .filter(Boolean);

    return [
      "All Movements",
      ...Array.from(new Set(values)),
    ];
  }, [orders]);

  /* =======================================================
     FILTER ACTIVE ORDERS
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const query = normalize(search);

    return orders.filter((trip) => {
      const tripId = getTripId(trip);
      const customer = getCustomer(trip);
      const material = getMaterial(trip);
      const origin = getOrigin(trip);
      const destination =
        getDestination(trip);
      const stage = getStage(trip);
      const movement =
        getMovement(trip);
      const vehicle =
        getVehicleNumber(trip);
      const status =
        getMovementStatus(trip) ||
        getStatus(trip);

      const searchableText = [
        tripId,
        customer,
        material,
        origin,
        destination,
        stage,
        movement,
        vehicle,
        status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      const matchesStage =
        stageFilter ===
          "All Stages" ||
        stage === stageFilter;

      const matchesMovement =
        movementFilter ===
          "All Movements" ||
        movement === movementFilter;

      return (
        matchesSearch &&
        matchesStage &&
        matchesMovement
      );
    });
  }, [
    orders,
    search,
    stageFilter,
    movementFilter,
  ]);

  /* =======================================================
     CURRENT MONTH
  ======================================================= */

  const currentPeriod =
    new Date()
      .toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      })
      .toUpperCase();

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="control-dashboard">
        <div
          style={{
            minHeight: "70vh",
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

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <div className="control-dashboard">
      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <section className="control-header">
        <div className="control-header-left">
          <div className="control-header-icon">
            <FaRoute />
          </div>

          <div>
            <span className="control-eyebrow">
              OPERATIONS CONTROL
            </span>

            <h1>
              Order Management Dashboard
            </h1>

            <p>
              Live operational overview of orders,
              movements and execution performance.
            </p>
          </div>
        </div>

        <div className="control-header-right">
          <span className="live-indicator">
            <span />
            Live Operations
          </span>

          <div className="dashboard-period">
            {currentPeriod}
          </div>
        </div>
      </section>

      {/* API ERROR */}

      {error && (
        <div
          style={{
            marginBottom: "14px",
            padding: "11px 14px",
            border:
              "1px solid #f0c6c3",
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

      {/* ===================================================
          KPI CARDS
      =================================================== */}

      <section className="control-kpi-grid">
        {/* TOTAL ORDERS */}

        <article className="control-kpi-card">
          <div className="control-kpi-top">
            <div className="control-kpi-icon total">
              <FaClipboardCheck />
            </div>

            <span className="control-kpi-trend positive">
              LIVE
            </span>
          </div>

          <div className="control-kpi-label">
            Total Orders
          </div>

          <div className="control-kpi-number">
            {dashboardStats.totalOrders}
          </div>

          <div className="control-kpi-footer">
            <span>Overall orders</span>
            <strong>100%</strong>
          </div>
        </article>

        {/* IN TRANSIT */}

        <article className="control-kpi-card">
          <div className="control-kpi-top">
            <div className="control-kpi-icon transit">
              <FaTruck />
            </div>

            <span className="control-kpi-status">
              LIVE
            </span>
          </div>

          <div className="control-kpi-label">
            In Transit
          </div>

          <div className="control-kpi-number">
            {dashboardStats.inTransit}
          </div>

          <div className="control-kpi-footer">
            <span>Active movements</span>

            <strong>
              {dashboardStats.transitPercentage}%
            </strong>
          </div>
        </article>

        {/* PENDING */}

        <article className="control-kpi-card">
          <div className="control-kpi-top">
            <div className="control-kpi-icon pending">
              <FaClock />
            </div>

            <span className="control-kpi-trend warning">
              {dashboardStats.pending} Action
            </span>
          </div>

          <div className="control-kpi-label">
            Pending Action
          </div>

          <div className="control-kpi-number">
            {dashboardStats.pending}
          </div>

          <div className="control-kpi-footer">
            <span>Requires attention</span>

            <strong>
              {dashboardStats.pendingPercentage}%
            </strong>
          </div>
        </article>

        {/* COMPLETED */}

        <article className="control-kpi-card">
          <div className="control-kpi-top">
            <div className="control-kpi-icon completed">
              <FaCheckCircle />
            </div>

            <span className="control-kpi-trend positive">
              COMPLETED
            </span>
          </div>

          <div className="control-kpi-label">
            Completed
          </div>

          <div className="control-kpi-number">
            {dashboardStats.completed}
          </div>

          <div className="control-kpi-footer">
            <span>
              Successfully completed
            </span>

            <strong>
              {
                dashboardStats
                  .completedPercentage
              }
              %
            </strong>
          </div>
        </article>
      </section>

      {/* ===================================================
          PIPELINE + MOVEMENT
      =================================================== */}

      <section className="control-main-grid">
        {/* PIPELINE */}

        <article className="control-card pipeline-card">
          <div className="control-card-header">
            <div>
              <span className="control-card-eyebrow">
                WORKFLOW
              </span>

              <h2>Order Pipeline</h2>

              <p>
                Current orders across lifecycle
                stages
              </p>
            </div>

            <div className="control-card-header-icon">
              <FaShippingFast />
            </div>
          </div>

          <div className="pipeline-list">
            {pipelineData.map((item) => {
              const percentage =
                Math.min(
                  (item.value /
                    item.total) *
                    100,
                  100
                );

              return (
                <div
                  className="pipeline-row"
                  key={item.label}
                >
                  <div className="pipeline-name">
                    <span className="pipeline-icon">
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>
                  </div>

                  <div className="pipeline-progress-area">
                    <div className="pipeline-track">
                      <span
                        className="pipeline-progress"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <strong className="pipeline-value">
                    {item.value}
                  </strong>
                </div>
              );
            })}
          </div>
        </article>

        {/* LIVE MOVEMENT */}

        <article className="control-card movement-card">
          <div className="control-card-header">
            <div>
              <span className="control-card-eyebrow">
                TRACKING
              </span>

              <h2>Live Movement</h2>

              <p>
                Current vehicle movement status
              </p>
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
                  <strong>
                    {activeMovementTotal}
                  </strong>

                  <span>ACTIVE</span>
                </div>
              </div>
            </div>

            <div className="movement-status-list">
              {movementData.map((item) => (
                <div
                  className="movement-status-row"
                  key={item.label}
                >
                  <div className="movement-status-name">
                    <span
                      className={`movement-dot ${item.className}`}
                    />

                    {item.label}
                  </div>

                  <strong>
                    {item.value}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      {/* ===================================================
          ANALYTICS
      =================================================== */}

      <section className="control-analytics-grid">
        {/* MONTHLY PERFORMANCE */}

        <article className="control-card performance-card">
          <div className="control-card-header">
            <div>
              <span className="control-card-eyebrow">
                ANALYTICS
              </span>

              <h2>
                Monthly Performance
              </h2>

              <p>
                Enquiries compared with
                confirmed orders
              </p>
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
                      style={{
                        height: `${
                          (item.enquiries /
                            maxChartValue) *
                          150
                        }px`,
                      }}
                    >
                      <span>
                        {item.enquiries}
                      </span>
                    </div>

                    <div
                      className="performance-bar order"
                      style={{
                        height: `${
                          (item.orders /
                            maxChartValue) *
                          150
                        }px`,
                      }}
                    >
                      <span>
                        {item.orders}
                      </span>
                    </div>
                  </div>

                  <strong>
                    {item.month}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* OPERATION HEALTH */}

        <article className="control-card health-card">
          <div className="control-card-header">
            <div>
              <span className="control-card-eyebrow">
                PERFORMANCE
              </span>

              <h2>
                Operation Health
              </h2>

              <p>
                Trip execution and movement
                quality
              </p>
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
                      Number(
                        healthStats.issueFreePercentage
                      ) * 3.6
                    }deg,
                    #e0e9ea ${
                      Number(
                        healthStats.issueFreePercentage
                      ) * 3.6
                    }deg 360deg
                  )`,
                }}
              >
                <div className="health-ring-inner">
                  <strong>
                    {
                      healthStats
                        .issueFreePercentage
                    }
                    %
                  </strong>

                  <span>
                    ISSUE FREE
                  </span>
                </div>
              </div>
            </div>

            <div className="health-metrics">
              <div className="health-metric">
                <div>
                  <span>
                    Completed Trips
                  </span>

                  <strong>
                    {
                      healthStats
                        .completedTrips
                    }
                  </strong>
                </div>
              </div>

              <div className="health-metric success">
                <div>
                  <span>
                    Issue-Free Trips
                  </span>

                  <strong>
                    {
                      healthStats
                        .issueFreeTrips
                    }
                  </strong>
                </div>
              </div>

              <div className="health-metric warning">
                <div>
                  <span>
                    Minor Halts
                  </span>

                  <strong>
                    {
                      healthStats
                        .minorHalts
                    }
                  </strong>
                </div>
              </div>

              <div className="health-metric danger">
                <div>
                  <span>
                    Breakdowns
                  </span>

                  <strong>
                    {
                      healthStats
                        .breakdowns
                    }
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* ===================================================
          ACTIVE ORDERS
      =================================================== */}

      <section className="active-orders-card">
        <div className="active-orders-header">
          <div>
            <span className="control-card-eyebrow">
              OPERATIONS
            </span>

            <h2>Active Orders</h2>

            <p>
              Monitor current customer orders
              and execution status.
            </p>
          </div>

          <div className="active-order-count">
            <span />
            {filteredOrders.length} Active
          </div>
        </div>

        {/* FILTER */}

        <div className="active-orders-toolbar">
          <div className="dashboard-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Search order, customer, vehicle, route..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={movementFilter}
            onChange={(event) =>
              setMovementFilter(
                event.target.value
              )
            }
            className="dashboard-filter"
          >
            {movements.map(
              (movement) => (
                <option
                  key={movement}
                  value={movement}
                >
                  {movement}
                </option>
              )
            )}
          </select>

          <select
            value={stageFilter}
            onChange={(event) =>
              setStageFilter(
                event.target.value
              )
            }
            className="dashboard-filter"
          >
            {stages.map((stage) => (
              <option
                key={stage}
                value={stage}
              >
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
                <th>ROUTE</th>
                <th>VEHICLE</th>
                <th>STAGE</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="dashboard-empty"
                  >
                    {error
                      ? "Unable to load orders."
                      : "No orders found."}
                  </td>
                </tr>
              ) : (
                filteredOrders.map(
                  (trip) => {
                    const tripId =
                      getTripId(trip);

                    const customer =
                      getCustomer(trip);

                    const material =
                      getMaterial(trip);

                    const movement =
                      getMovement(trip);

                    const origin =
                      getOrigin(trip);

                    const destination =
                      getDestination(trip);

                    const vehicle =
                      getVehicleNumber(trip);

                    const stage =
                      getStage(trip);

                    const status =
                      getMovementStatus(
                        trip
                      ) ||
                      getStatus(trip);

                    const movementClass =
                      normalize(movement)
                        .replace(
                          /[^a-z0-9]+/g,
                          "-"
                        );

                    const statusClass =
                      normalize(status)
                        .replace(
                          /[^a-z0-9]+/g,
                          "-"
                        );

                    return (
                      <tr
                        key={
                          trip?._id ||
                          tripId
                        }
                      >
                        <td>
                          <span className="dashboard-order-id">
                            {tripId || "-"}
                          </span>
                        </td>

                        <td>
                          <div className="customer-cell">
                            <strong>
                              {customer ||
                                "-"}
                            </strong>

                            <span>
                              {material ||
                                "-"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`movement-badge ${movementClass}`}
                          >
                            {movement ||
                              "-"}
                          </span>
                        </td>

                        <td>
                          <div className="dashboard-route">
                            <span>
                              {origin ||
                                "-"}
                            </span>

                            <FaArrowRight />

                            <span>
                              {destination ||
                                "-"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="vehicle-cell">
                            <FaTruck />

                            <span>
                              {vehicle ||
                                "-"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="dashboard-stage">
                            {stage || "-"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`dashboard-status ${statusClass}`}
                          >
                            <i />

                            {status ||
                              "-"}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default OrderManagement;