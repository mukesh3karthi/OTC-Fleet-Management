import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import {
  Car,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  PauseCircle,
  Search,
  Truck,
  UserPlus,
  Wrench,
} from "lucide-react";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Intercarttinglogin from "../Loginpage/Intercartinglogin";

import "../pagescss/intercartingdash.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const VEHICLE_API =
  `${API_BASE_URL}/api/vehicles`;

const RECORDS_PER_PAGE = 15;

const getVehicleId = (vehicle) =>
  vehicle?._id ??
  vehicle?.id ??
  vehicle?.vehicleNumber;

const getVehicleStatus = (vehicle) => {
  const isActive =
    vehicle?.activeStatus ??
    vehicle?.active ??
    false;

  return {
    isActive,
    label: isActive
      ? "Active"
      : "Inactive",
  };
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const Intercartingdash = () => {
  const navigate = useNavigate();

  const [vehicles, setVehicles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [showLogin, setShowLogin] =
    useState(false);

  // Remove the Intercarting login session whenever this dashboard opens.
  // After returning with the browser Back button, the user must log in again.
  useEffect(() => {
    sessionStorage.removeItem(
      "intercartingLoggedIn"
    );
  }, []);

  const fetchVehicles =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await axios.get(
            VEHICLE_API,
            {
              timeout: 60000,
            }
          );

        const vehicleData =
          Array.isArray(response.data)
            ? response.data
            : Array.isArray(
              response.data?.vehicles
            )
              ? response.data.vehicles
              : [];

        setVehicles(vehicleData);
      } catch (requestError) {
        console.error(
          "Vehicle fetch error:",
          requestError.response?.data ||
          requestError.message
        );

        setVehicles([]);

        setError(
          requestError.response?.data
            ?.message ||
          "Unable to load vehicle details."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const filteredVehicles =
    useMemo(() => {
      const query =
        searchText
          .trim()
          .toLowerCase();

      if (!query) {
        return vehicles;
      }

      return vehicles.filter(
        (vehicle) => {
          const searchableValues = [
            vehicle?.vehicleNumber,
            vehicle?.siteName,
            vehicle?.vehicleType,
            vehicle
              ?.transportProvider,
            vehicle?.dieselScope,
          ];

          return searchableValues.some(
            (value) =>
              String(value ?? "")
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [
      vehicles,
      searchText,
    ]);

  const vehicleStatistics =
    useMemo(() => {
      const activeVehicles =
        vehicles.filter(
          (vehicle) =>
            getVehicleStatus(vehicle)
              .isActive
        ).length;

      const maintenanceVehicles =
        vehicles.filter(
          (vehicle) => {
            const status =
              String(
                vehicle?.status ?? ""
              ).toLowerCase();

            return (
              status ===
              "maintenance" ||
              status ===
              "in maintenance"
            );
          }
        ).length;

      return {
        total:
          vehicles.length,
        active:
          activeVehicles,
        maintenance:
          maintenanceVehicles,
        inactive:
          vehicles.length -
          activeVehicles,
      };
    }, [vehicles]);

  const siteWiseChartData =
    useMemo(() => {
      const siteCounts =
        vehicles.reduce(
          (
            result,
            vehicle
          ) => {
            const siteName =
              String(
                vehicle?.siteName ||
                "Unspecified Site"
              ).trim() ||
              "Unspecified Site";

            result[siteName] =
              (result[siteName] ||
                0) + 1;

            return result;
          },
          {}
        );

      return Object.entries(
        siteCounts
      )
        .map(
          ([name, total]) => ({
            name,
            total,
          })
        )
        .sort(
          (
            firstSite,
            secondSite
          ) =>
            secondSite.total -
            firstSite.total
        );
    }, [vehicles]);

  const fleetStatusChartData =
    useMemo(
      () => [
        {
          name: "Total",
          value: vehicleStatistics.total,
        },
        {
          name: "Active",
          value: vehicleStatistics.active,
        },
        {
          name: "Maintenance",
          value: vehicleStatistics.maintenance,
        },
        {
          name: "Off-duty",
          value: vehicleStatistics.inactive,
        },
      ],
      [vehicleStatistics]
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredVehicles.length /
      RECORDS_PER_PAGE
    )
  );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const startIndex =
    (currentPage - 1) *
    RECORDS_PER_PAGE;

  const endIndex =
    startIndex +
    RECORDS_PER_PAGE;

  const paginatedVehicles =
    filteredVehicles.slice(
      startIndex,
      endIndex
    );

  const showingStart =
    filteredVehicles.length === 0
      ? 0
      : startIndex + 1;

  const showingEnd =
    Math.min(
      endIndex,
      filteredVehicles.length
    );

  const handleLoginSuccess = () => {
    setShowLogin(false);

    navigate(
      "/intercartingdash/intercarting",
      {
        replace: true,
      }
    );
  };

  const goToPreviousPage = () => {
    setCurrentPage(
      (page) =>
        Math.max(
          1,
          page - 1
        )
    );
  };

  const goToNextPage = () => {
    setCurrentPage(
      (page) =>
        Math.min(
          totalPages,
          page + 1
        )
    );
  };

  return (
    <main className="intercarting-dashboard">
      <header className="intercarting-dashboard-header">
        <div>
          <span className="intercarting-dashboard-eyebrow">
            Fleet Management
          </span>

          <h1>
            Vehicle Inventory
          </h1>

          <p>
            View and monitor all
            registered fleet vehicles
            and operational status.
          </p>
        </div>

        <button
          type="button"
          className="intercarting-data-entry-button"
          onClick={() =>
            setShowLogin(true)
          }
        >
          <UserPlus
            size={18}
            aria-hidden="true"
          />

          <span>
            Data Entry
          </span>
        </button>
      </header>

      <Intercarttinglogin
        open={showLogin}
        onClose={() =>
          setShowLogin(false)
        }
        onLogin={
          handleLoginSuccess
        }
      />

      {error && (
        <div
          className="intercarting-dashboard-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section
        className="intercarting-dashboard-stats"
        aria-label="Vehicle statistics"
      >
        <article className="intercarting-stat-card">
          <div className="intercarting-stat-icon total">
            <Car size={23} />
          </div>

          <div>
            <span>
              Total Vehicles
            </span>

            <strong>
              {
                vehicleStatistics
                  .total
              }
            </strong>

            <small>
              Registered fleet assets
            </small>
          </div>
        </article>

        <article className="intercarting-stat-card">
          <div className="intercarting-stat-icon active">
            <CircleCheck
              size={23}
            />
          </div>

          <div>
            <span>
              Active On-Road
            </span>

            <strong>
              {
                vehicleStatistics
                  .active
              }
            </strong>

            <small>
              Currently operational
            </small>
          </div>
        </article>

        <article className="intercarting-stat-card">
          <div className="intercarting-stat-icon maintenance">
            <Wrench size={23} />
          </div>

          <div>
            <span>
              In Maintenance
            </span>

            <strong>
              {
                vehicleStatistics
                  .maintenance
              }
            </strong>

            <small>
              Under service
            </small>
          </div>
        </article>

        <article className="intercarting-stat-card">
          <div className="intercarting-stat-icon inactive">
            <PauseCircle
              size={23}
            />
          </div>

          <div>
            <span>
              Off-Duty
            </span>

            <strong>
              {
                vehicleStatistics
                  .inactive
              }
            </strong>

            <small>
              Currently inactive
            </small>
          </div>
        </article>
      </section>

      <section
        className="intercarting-mini-charts"
        aria-label="Fleet charts"
      >
        <article className="intercarting-mini-chart-card">
          <div className="intercarting-mini-chart-header">
            <div>
              <span>Fleet overview</span>
              <h2>Vehicles by Site</h2>
            </div>

            <strong>
              {vehicleStatistics.total}
            </strong>
          </div>

          <div className="intercarting-mini-chart-body">
            {loading ? (
              <div className="intercarting-chart-state">
                Loading chart...
              </div>
            ) : siteWiseChartData.length === 0 ? (
              <div className="intercarting-chart-state">
                No site data available.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={siteWiseChartData}
                  margin={{
                    top: 10,
                    right: 4,
                    bottom: 0,
                    left: 4,
                  }}
                  barCategoryGap="28%"
                >
                  <XAxis
                    dataKey="name"
                    hide
                  />

                  <YAxis hide />

                  <Tooltip
                    cursor={{
                      fill:
                        "rgba(37, 99, 235, 0.05)",
                    }}
                    formatter={(value) => [
                      value,
                      "Vehicles",
                    ]}
                    labelFormatter={(label) =>
                      `Site: ${label}`
                    }
                    contentStyle={{
                      border:
                        "1px solid #e2e8f0",
                      borderRadius: "10px",
                      backgroundColor: "#ffffff",
                      boxShadow:
                        "0 10px 24px rgba(15, 23, 42, 0.10)",
                    }}
                  />

                  <Bar
                    dataKey="total"
                    fill="#fbbf24"
                    radius={[7, 7, 7, 7]}
                    maxBarSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="intercarting-mini-chart-card">
          <div className="intercarting-mini-chart-header">
            <div>
              <span>Operational status</span>
              <h2>Fleet Activity</h2>
            </div>

            <strong>
              {vehicleStatistics.active}
            </strong>
          </div>

          <div className="intercarting-mini-chart-body">
            {loading ? (
              <div className="intercarting-chart-state">
                Loading chart...
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={fleetStatusChartData}
                  margin={{
                    top: 12,
                    right: 6,
                    bottom: 0,
                    left: 6,
                  }}
                >
                  <XAxis
                    dataKey="name"
                    hide
                  />

                  <YAxis hide />

                  <Tooltip
                    formatter={(value) => [
                      value,
                      "Vehicles",
                    ]}
                    contentStyle={{
                      border:
                        "1px solid #e2e8f0",
                      borderRadius: "10px",
                      backgroundColor: "#ffffff",
                      boxShadow:
                        "0 10px 24px rgba(15, 23, 42, 0.10)",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 4,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section className="intercarting-vehicle-panel">
        <div className="intercarting-vehicle-panel-header">
          <div>
            <h2>
              Vehicle List
            </h2>

            <p>
              Complete fleet vehicle
              information
            </p>
          </div>

          <div className="intercarting-vehicle-panel-actions">
            <div className="intercarting-dashboard-search">
              <Search
                size={18}
                aria-hidden="true"
              />

              <input
                type="search"
                value={
                  searchText
                }
                placeholder="Search vehicle..."
                onChange={(
                  event
                ) =>
                  setSearchText(
                    event.target
                      .value
                  )
                }
              />
            </div>

            <div className="intercarting-vehicle-count">
              <Truck size={17} />

              <span>
                {
                  filteredVehicles
                    .length
                }{" "}
                vehicles
              </span>
            </div>
          </div>
        </div>

        <div className="intercarting-table-wrapper">
          <table className="intercarting-vehicle-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>
                  Vehicle No
                </th>
                <th>
                  Site Name
                </th>
                <th>
                  Vehicle Type
                </th>
                <th>
                  Transport Provider
                </th>
                <th>
                  Diesel Scope
                </th>
                <th>
                  Vehicle In Date
                </th>
                <th>
                  Vehicle Out Date
                </th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="intercarting-table-message"
                  >
                    Loading vehicle
                    details...
                  </td>
                </tr>
              ) : paginatedVehicles
                .length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="intercarting-table-message"
                  >
                    No vehicles found.
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map(
                  (
                    vehicle,
                    index
                  ) => {
                    const status =
                      getVehicleStatus(
                        vehicle
                      );

                    return (
                      <tr
                        key={
                          getVehicleId(
                            vehicle
                          ) ??
                          `${startIndex}-${index}`
                        }
                      >
                        <td>
                          {startIndex +
                            index +
                            1}
                        </td>

                        <td>
                          {vehicle
                            ?.vehicleNumber ||
                            "-"}
                        </td>

                        <td>
                          {vehicle
                            ?.siteName ||
                            "-"}
                        </td>

                        <td>
                          {vehicle
                            ?.vehicleType ||
                            "-"}
                        </td>

                        <td>
                          {vehicle
                            ?.transportProvider ||
                            "-"}
                        </td>

                        <td>
                          {vehicle
                            ?.dieselScope ||
                            "-"}
                        </td>

                        <td>
                          {formatDate(
                            vehicle
                              ?.vehicleInDate
                          )}
                        </td>

                        <td>
                          {formatDate(
                            vehicle
                              ?.vehicleOutDate
                          )}
                        </td>

                        <td>
                          <span
                            className={`intercarting-status ${status.isActive
                              ? "active"
                              : "inactive"
                              }`}
                          >
                            {
                              status.label
                            }
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

        <footer className="intercarting-pagination">
          <p>
            Showing{" "}
            <strong>
              {showingStart}–
              {showingEnd}
            </strong>{" "}
            of{" "}
            <strong>
              {
                filteredVehicles
                  .length
              }
            </strong>{" "}
            vehicles
          </p>

          <div className="intercarting-pagination-controls">
            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={
                goToPreviousPage
              }
            >
              <ChevronLeft
                size={17}
              />
            </button>

            {Array.from(
              {
                length:
                  totalPages,
              },
              (_, index) =>
                index + 1
            ).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  className={
                    currentPage ===
                      page
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCurrentPage(
                      page
                    )
                  }
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={
                goToNextPage
              }
            >
              <ChevronRight
                size={17}
              />
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
};

export default Intercartingdash;