import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  FaChevronLeft,
  FaChevronRight,
  FaExclamationCircle,
  FaTruck,
} from "react-icons/fa";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Bar, Line } from "react-chartjs-2";

import "../pagescss/ownvehicledash.css";

/* =========================================
   CHART.JS REGISTRATION
========================================= */

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const OWN_VEHICLE_API =
  `${API_BASE_URL}/api/ownvehicles`;

const RECORDS_PER_PAGE = 5;

/* =========================================
   NORMALIZE VEHICLE
========================================= */

const normalizeVehicle = (vehicle) => ({
  id:
    vehicle?._id ||
    vehicle?.id ||
    vehicle?.vehicleId ||
    vehicle?.vehicleNo ||
    "",

  vehicleNo:
    vehicle?.vehicleNo ||
    vehicle?.vehicleNumber ||
    "",

  type:
    vehicle?.type ||
    vehicle?.vehicleType ||
    "",

  vehicleMake:
    vehicle?.vehicleMake ||
    vehicle?.make ||
    "",

  manufacturingYear:
    vehicle?.manufacturingYear ||
    "",

  registrationDate:
    vehicle?.registrationDate ||
    "",

  transportOwner:
    vehicle?.transportOwner ||
    vehicle?.ownerName ||
    "",

  engineNo:
    vehicle?.engineNo ||
    vehicle?.engineNumber ||
    "",

  chassisNo:
    vehicle?.chassisNo ||
    vehicle?.chassisNumber ||
    "",

  purchaseYear:
    vehicle?.purchaseYear ||
    "",

  purchasedFrom:
    vehicle?.purchasedFrom ||
    vehicle?.purchaseFrom ||
    "",

  status: String(
    vehicle?.status ||
    vehicle?.vehicleStatus ||
    vehicle?.availabilityStatus ||
    vehicle?.currentStatus ||
    ""
  )
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " "),
});

/* =========================================
   DATE
========================================= */

const formatDate = (dateValue) => {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

/* =========================================
   STATUS
========================================= */

const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, "")
    .replace(/\s+/g, "");

/* =========================================
   CHART.JS COMMON OPTIONS
========================================= */

const commonChartOptions = {
  responsive: true,

  maintainAspectRatio: false,

  animation: {
    duration: 500,
  },

  plugins: {
    legend: {
      display: false,
    },

    tooltip: {
      backgroundColor: "#ffffff",
      titleColor: "#0b2942",
      bodyColor: "#334b5f",
      borderColor: "#dce5e9",
      borderWidth: 1,

      padding: 9,

      titleFont: {
        size: 10,
        weight: "600",
      },

      bodyFont: {
        size: 10,
      },

      displayColors: false,
    },
  },

  interaction: {
    intersect: false,
    mode: "index",
  },
};

/* =========================================
   COMPONENT
========================================= */

const Ownvehicledash = () => {
  const [vehicles, setVehicles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  /* =========================================
     FETCH VEHICLES
  ========================================= */

  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError("");

      const response = await axios.get(
        OWN_VEHICLE_API,
        {
          timeout: 60000,
        }
      );

      const responseData =
        response?.data?.ownVehicles ||
        response?.data?.vehicles ||
        response?.data?.data ||
        response?.data ||
        [];

      const vehicleList = Array.isArray(responseData)
        ? responseData
        : [];

      const normalizedVehicles =
        vehicleList.map(normalizeVehicle);

      console.log(
        "OWN VEHICLES:",
        normalizedVehicles
      );

      setVehicles(normalizedVehicles);
    } catch (error) {
      console.error(
        "Unable to fetch own vehicles:",
        error
      );

      setVehicles([]);

      setPageError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load own vehicle records."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  /* =========================================
     TOTAL
  ========================================= */

  const totalVehicles = vehicles.length;

  /* =========================================
     STATUS COUNTS
  ========================================= */

  const statusCounts = useMemo(() => {
    const counts = {
      active: 0,
      idle: 0,
      inmaintenance: 0,
    };

    vehicles.forEach((vehicle) => {
      const status = normalizeStatus(
        vehicle.status
      );

      if (status === "active") {
        counts.active += 1;
      }

      if (status === "idle") {
        counts.idle += 1;
      }

      if (
        status === "inmaintenance" ||
        status === "maintenance" ||
        status === "undermaintenance"
      ) {
        counts.inmaintenance += 1;
      }
    });

    return counts;
  }, [vehicles]);

  /* =========================================
     SUMMARY CARDS
  ========================================= */

  const stats = useMemo(
    () => [
      {
        title: "Total Vehicles",
        value: totalVehicles,
        icon: <FaTruck />,
        iconClass: "truck",
      },
      {
        title: "Active",
        value: statusCounts.active,
        icon: (
          <span className="text-icon">
            A
          </span>
        ),
        iconClass: "active",
      },
      {
        title: "Idle",
        value: statusCounts.idle,
        icon: (
          <span className="text-icon">
            I
          </span>
        ),
        iconClass: "idle",
      },
      {
        title: "In Maintenance",
        value: statusCounts.inmaintenance,
        icon: (
          <span className="text-icon">
            M
          </span>
        ),
        iconClass: "maintenance",
      },
    ],
    [
      totalVehicles,
      statusCounts,
    ]
  );

  /* =========================================
     VEHICLES BY MAKE
  ========================================= */

  const vehicleMakeChartData = useMemo(() => {
    const counts = {};

    vehicles.forEach((vehicle) => {
      const make =
        String(
          vehicle?.vehicleMake || ""
        ).trim() || "Unknown";

      counts[make] =
        (counts[make] || 0) + 1;
    });

    const result = Object.entries(counts)
      .map(([make, count]) => ({
        make,
        vehicles: Number(count),
      }))
      .sort(
        (a, b) =>
          b.vehicles - a.vehicles
      );

    console.log(
      "VEHICLES BY MAKE:",
      result
    );

    return result;
  }, [vehicles]);

  /* =========================================
     VEHICLES BY TYPE
  ========================================= */

  const vehicleTypeChartData = useMemo(() => {
    const counts = {};

    vehicles.forEach((vehicle) => {
      const type =
        String(
          vehicle?.type || ""
        ).trim() || "Unknown";

      counts[type] =
        (counts[type] || 0) + 1;
    });

    const result = Object.entries(counts)
      .map(([type, count]) => ({
        type,
        vehicles: Number(count),
      }))
      .sort(
        (a, b) =>
          b.vehicles - a.vehicles
      );

    console.log(
      "VEHICLES BY TYPE:",
      result
    );

    return result;
  }, [vehicles]);

  /* =========================================
     FLEET GROWTH
  ========================================= */

  const currentYear =
    new Date().getFullYear();

  const activityChartData = useMemo(() => {
    const years = Array.from(
      { length: 6 },
      (_, index) =>
        currentYear - 5 + index
    );

    const result = years.map((year) => ({
      year: String(year),
      vehicles: vehicles.filter(
        (vehicle) =>
          Number(
            vehicle.purchaseYear
          ) === year
      ).length,
    }));

    console.log(
      "FLEET GROWTH:",
      result
    );

    return result;
  }, [vehicles, currentYear]);

  /* =========================================
     MAKE BAR CHART
  ========================================= */

  const makeChartData = useMemo(
    () => ({
      labels:
        vehicleMakeChartData.map(
          (item) =>
            String(item.make).length > 15
              ? `${String(item.make).slice(
                  0,
                  15
                )}…`
              : item.make
        ),

      datasets: [
        {
          label: "Vehicles",

          data:
            vehicleMakeChartData.map(
              (item) => item.vehicles
            ),

          backgroundColor: "#f59e0b",

          borderColor: "#f59e0b",

          borderWidth: 0,

          borderRadius: 7,

          borderSkipped: false,

          maxBarThickness: 55,
        },
      ],
    }),
    [vehicleMakeChartData]
  );

  const makeChartOptions = useMemo(
    () => ({
      ...commonChartOptions,

      scales: {
        x: {
          grid: {
            display: false,
          },

          border: {
            color: "#d8e3e9",
          },

          ticks: {
            color: "#61798c",

            font: {
              size: 9,
            },

            maxRotation: 0,

            minRotation: 0,
          },
        },

        y: {
          beginAtZero: true,

          suggestedMax:
            Math.max(
              ...vehicleMakeChartData.map(
                (item) => item.vehicles
              ),
              0
            ) + 1,

          ticks: {
            color: "#61798c",

            font: {
              size: 9,
            },

            precision: 0,

            stepSize: 5,
          },

          grid: {
            color: "#e4edf1",

            borderDash: [3, 3],
          },

          border: {
            display: false,
          },
        },
      },
    }),
    [vehicleMakeChartData]
  );

  /* =========================================
     TYPE BAR CHART
  ========================================= */

  const typeChartData = useMemo(
    () => ({
      labels:
        vehicleTypeChartData.map(
          (item) => item.type
        ),

      datasets: [
        {
          label: "Vehicles",

          data:
            vehicleTypeChartData.map(
              (item) => item.vehicles
            ),

          backgroundColor: "#7c3aed",

          borderColor: "#7c3aed",

          borderWidth: 0,

          borderRadius: 7,

          borderSkipped: false,

          maxBarThickness: 45,
        },
      ],
    }),
    [vehicleTypeChartData]
  );

  const typeChartOptions = useMemo(
    () => ({
      ...commonChartOptions,

      scales: {
        x: {
          grid: {
            display: false,
          },

          border: {
            color: "#d8e3e9",
          },

          ticks: {
            color: "#61798c",

            font: {
              size: 9,
            },

            maxRotation: 0,

            minRotation: 0,
          },
        },

        y: {
          beginAtZero: true,

          suggestedMax:
            Math.max(
              ...vehicleTypeChartData.map(
                (item) => item.vehicles
              ),
              0
            ) + 1,

          ticks: {
            color: "#61798c",

            font: {
              size: 9,
            },

            precision: 0,

            stepSize: 5,
          },

          grid: {
            color: "#e4edf1",

            borderDash: [3, 3],
          },

          border: {
            display: false,
          },
        },
      },
    }),
    [vehicleTypeChartData]
  );

  /* =========================================
     FLEET GROWTH LINE CHART
  ========================================= */

  const fleetGrowthChartData = useMemo(
    () => ({
      labels:
        activityChartData.map(
          (item) => item.year
        ),

      datasets: [
        {
          label: "Vehicles",

          data:
            activityChartData.map(
              (item) => item.vehicles
            ),

          borderColor: "#7c3aed",

          backgroundColor:
            "rgba(124, 58, 237, 0.08)",

          borderWidth: 3,

          tension: 0.35,

          fill: false,

          pointRadius: 4,

          pointHoverRadius: 6,

          pointBackgroundColor: "#7c3aed",

          pointBorderColor: "#ffffff",

          pointBorderWidth: 2,
        },
      ],
    }),
    [activityChartData]
  );

  const fleetGrowthChartOptions = useMemo(
    () => ({
      ...commonChartOptions,

      scales: {
        x: {
          grid: {
            display: false,
          },

          border: {
            color: "#d8e3e9",
          },

          ticks: {
            color: "#61798c",

            font: {
              size: 9,
            },
          },
        },

        y: {
          beginAtZero: true,

          suggestedMax:
            Math.max(
              ...activityChartData.map(
                (item) => item.vehicles
              ),
              0
            ) + 1,

          ticks: {
            color: "#61798c",

            font: {
              size: 9,
            },

            precision: 0,

            stepSize: 5,
          },

          grid: {
            color: "#e4edf1",

            borderDash: [3, 3],
          },

          border: {
            display: false,
          },
        },
      },
    }),
    [activityChartData]
  );

  /* =========================================
     PAGINATION
  ========================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalVehicles /
        RECORDS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentVehicles = useMemo(() => {
    const start =
      (currentPage - 1) *
      RECORDS_PER_PAGE;

    return vehicles.slice(
      start,
      start + RECORDS_PER_PAGE
    );
  }, [currentPage, vehicles]);

  const firstRecord =
    totalVehicles === 0
      ? 0
      : (currentPage - 1) *
          RECORDS_PER_PAGE +
        1;

  const lastRecord = Math.min(
    currentPage * RECORDS_PER_PAGE,
    totalVehicles
  );

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="own-vehicle-page">

      {/* ERROR */}

      {pageError && (
        <div
          className="own-page-error"
          role="alert"
        >
          <FaExclamationCircle />

          <span>{pageError}</span>

          <button
            type="button"
            onClick={fetchVehicles}
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================
          SUMMARY
      ===================================== */}

      <section className="own-vehicle-stats">

        {stats.map((item) => (
          <div
            className="own-stat-card"
            key={item.title}
          >
            <div className="own-stat-content">

              <p className="own-stat-title">
                {item.title}
              </p>

              <h2>
                {isLoading
                  ? "..."
                  : item.value}
              </h2>

            </div>

            <div
              className={`own-stat-icon ${item.iconClass}`}
            >
              {item.icon}
            </div>

          </div>
        ))}

      </section>

      {/* =====================================
          CHARTS
      ===================================== */}

      <section className="own-mini-charts">

        {/* ===================================
            VEHICLES BY MAKE
        =================================== */}

        <article className="own-mini-chart-card own-wide-chart">

          <div className="own-mini-chart-header">

            <div>
              <span>
                Fleet composition
              </span>

              <h2>
                Vehicles by Make
              </h2>
            </div>

            <strong>
              {isLoading
                ? "..."
                : totalVehicles}
            </strong>

          </div>

          <div className="own-make-chart-container">

            {isLoading ? (
              <div className="own-loading-state">
                Loading chart...
              </div>
            ) : vehicleMakeChartData.length === 0 ? (
              <div className="own-loading-state">
                No vehicle make data available.
              </div>
            ) : (
              <Bar
                data={makeChartData}
                options={makeChartOptions}
              />
            )}

          </div>

        </article>

        {/* ===================================
            VEHICLES BY TYPE
        =================================== */}

        <article className="own-mini-chart-card">

          <div className="own-mini-chart-header">

            <div>
              <span>
                Fleet composition
              </span>

              <h2>
                Vehicles by Type
              </h2>
            </div>

            <strong>
              {isLoading
                ? "..."
                : vehicleTypeChartData.length}
            </strong>

          </div>

          <div className="own-small-chart-container">

            {isLoading ? (
              <div className="own-loading-state">
                Loading chart...
              </div>
            ) : vehicleTypeChartData.length === 0 ? (
              <div className="own-loading-state">
                No vehicle type data available.
              </div>
            ) : (
              <Bar
                data={typeChartData}
                options={typeChartOptions}
              />
            )}

          </div>

        </article>

        {/* ===================================
            FLEET GROWTH
        =================================== */}

        <article className="own-mini-chart-card">

          <div className="own-mini-chart-header">

            <div>
              <span>
                Purchase trend
              </span>

              <h2>
                Fleet Growth
              </h2>
            </div>

            <strong>
              {isLoading
                ? "..."
                : activityChartData.reduce(
                    (total, item) =>
                      total +
                      item.vehicles,
                    0
                  )}
            </strong>

          </div>

          <div className="own-small-chart-container">

            {isLoading ? (
              <div className="own-loading-state">
                Loading chart...
              </div>
            ) : (
              <Line
                data={fleetGrowthChartData}
                options={
                  fleetGrowthChartOptions
                }
              />
            )}

          </div>

        </article>

      </section>

      {/* =====================================
          VEHICLE RECORDS
      ===================================== */}

      <section className="own-record-card">

        <div className="own-record-header">

          <div>
            <h2>
              Vehicle Records
            </h2>

            <p>
              Complete information about
              company-owned vehicles.
            </p>
          </div>

        </div>

        <div className="own-table-wrapper">

          <table className="own-vehicle-table">

            <thead>
              <tr>
                <th>S.No</th>
                <th>Vehicle No.</th>
                <th>Vehicle Type</th>
                <th>Vehicle Make</th>
                <th>Manufacturing Year</th>
                <th>Registration Date</th>
                <th>Transport Owner</th>
                <th>Engine No.</th>
                <th>Chassis No.</th>
                <th>Purchase Year</th>
                <th>Purchased From</th>
              </tr>
            </thead>

            <tbody>

              {isLoading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="own-empty-row"
                  >
                    Loading vehicle records...
                  </td>
                </tr>
              ) : currentVehicles.length > 0 ? (
                currentVehicles.map(
                  (vehicle, index) => (
                    <tr
                      key={
                        vehicle.id ||
                        vehicle.vehicleNo ||
                        index
                      }
                    >

                      <td>
                        {(currentPage - 1) *
                          RECORDS_PER_PAGE +
                          index +
                          1}
                      </td>

                      <td>
                        <span className="own-vehicle-number">
                          {vehicle.vehicleNo ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        {vehicle.type || "-"}
                      </td>

                      <td>
                        {vehicle.vehicleMake ||
                          "-"}
                      </td>

                      <td>
                        {vehicle.manufacturingYear ||
                          "-"}
                      </td>

                      <td>
                        {formatDate(
                          vehicle.registrationDate
                        )}
                      </td>

                      <td>
                        {vehicle.transportOwner ||
                          "-"}
                      </td>

                      <td>
                        {vehicle.engineNo || "-"}
                      </td>

                      <td>
                        {vehicle.chassisNo || "-"}
                      </td>

                      <td>
                        {vehicle.purchaseYear ||
                          "-"}
                      </td>

                      <td>
                        {vehicle.purchasedFrom ||
                          "-"}
                      </td>

                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={11}
                    className="own-empty-row"
                  >
                    No vehicles found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* =====================================
          PAGINATION
      ===================================== */}

      <div className="own-pagination-card">

        <p>
          Showing {firstRecord}–
          {lastRecord} of{" "}
          {totalVehicles} vehicles
        </p>

        <div className="own-pagination-controls">

          <button
            type="button"
            className="own-page-arrow"
            onClick={() =>
              setCurrentPage((page) =>
                Math.max(page - 1, 1)
              )
            }
            disabled={
              currentPage === 1 ||
              isLoading
            }
          >
            <FaChevronLeft />
          </button>

          {Array.from(
            {
              length: totalPages,
            },
            (_, index) => index + 1
          ).map((pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              className={`own-page-number ${
                currentPage === pageNumber
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setCurrentPage(pageNumber)
              }
              disabled={isLoading}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            className="own-page-arrow"
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(
                  page + 1,
                  totalPages
                )
              )
            }
            disabled={
              currentPage === totalPages ||
              isLoading
            }
          >
            <FaChevronRight />
          </button>

        </div>

      </div>

    </div>
  );
};

export default Ownvehicledash;