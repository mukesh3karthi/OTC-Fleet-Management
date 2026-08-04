import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  useNavigate,
} from "react-router-dom";

import {
  FaChevronLeft,
  FaChevronRight,
  FaDatabase,
  FaExclamationCircle,
  FaTruck,
} from "react-icons/fa";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Ownvehiclelogin from "../Loginpage/Ownvehiclelogin";

import "./ownvehicledash.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const OWN_VEHICLE_API =
  `${API_BASE_URL}/api/ownvehicles`;

const RECORDS_PER_PAGE = 5;

const normalizeVehicle = (
  vehicle
) => ({
  id:
    vehicle?._id ||
    vehicle?.id ||
    vehicle?.vehicleId ||
    vehicle?.vehicleNo,

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

  gps:
    vehicle?.gps === true ||
    vehicle?.gps === "true" ||
    vehicle?.gpsAvailable ===
    true ||
    vehicle?.gpsAvailable ===
    "true",

  purchaseYear:
    vehicle?.purchaseYear ||
    "",

  purchasedFrom:
    vehicle?.purchasedFrom ||
    vehicle?.purchaseFrom ||
    "",
});

const formatDate = (
  dateValue
) => {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(
    dateValue
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
};

const Ownvehicledash = () => {
  const navigate =
    useNavigate();

  const [
    vehicles,
    setVehicles,
  ] = useState([]);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    pageError,
    setPageError,
  ] = useState("");

  const [
    isLoginModalOpen,
    setIsLoginModalOpen,
  ] = useState(false);

  const currentYear =
    new Date().getFullYear();

  /* =====================================
     Fetch vehicles
  ===================================== */

  const fetchVehicles =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setPageError("");

        const response =
          await axios.get(
            OWN_VEHICLE_API,
            {
              timeout: 60000,
            }
          );

        const responseData =
          response?.data
            ?.ownVehicles ||
          response?.data
            ?.vehicles ||
          response?.data?.data ||
          response?.data ||
          [];

        const vehicleList =
          Array.isArray(
            responseData
          )
            ? responseData
            : [];

        setVehicles(
          vehicleList.map(
            normalizeVehicle
          )
        );
      } catch (error) {
        console.error(
          "Unable to fetch own vehicles:",
          error
        );

        setVehicles([]);

        setPageError(
          error?.response?.data
            ?.message ||
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

  /* =====================================
     Statistics
  ===================================== */

  const totalVehicles =
    vehicles.length;

  const gpsAvailable =
    useMemo(
      () =>
        vehicles.filter(
          (vehicle) =>
            vehicle.gps
        ).length,
      [vehicles]
    );

  const withoutGps =
    useMemo(
      () =>
        vehicles.filter(
          (vehicle) =>
            !vehicle.gps
        ).length,
      [vehicles]
    );

  const purchasedThisYear =
    useMemo(
      () =>
        vehicles.filter(
          (vehicle) =>
            Number(
              vehicle.purchaseYear
            ) === currentYear
        ).length,
      [
        vehicles,
        currentYear,
      ]
    );

  /* =====================================
     Pagination
  ===================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalVehicles /
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

  const currentVehicles =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        RECORDS_PER_PAGE;

      return vehicles.slice(
        startIndex,
        startIndex +
        RECORDS_PER_PAGE
      );
    }, [
      currentPage,
      vehicles,
    ]);

  const firstRecord =
    totalVehicles === 0
      ? 0
      : (currentPage - 1) *
      RECORDS_PER_PAGE +
      1;

  const lastRecord =
    Math.min(
      currentPage *
      RECORDS_PER_PAGE,
      totalVehicles
    );

  /* =====================================
     Login modal
  ===================================== */

  const openLoginModal =
    () => {
      setIsLoginModalOpen(
        true
      );
    };

  const closeLoginModal =
    () => {
      setIsLoginModalOpen(
        false
      );
    };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);

    navigate(
  "/ownvehicledetaildash/ownvehicledetails"
);
  };

  /* =====================================
     Dashboard data
  ===================================== */

  const stats = [
    {
      title:
        "Total Vehicles",
      value: totalVehicles,
      icon: <FaTruck />,
      iconClass: "truck",
    },
    {
      title:
        "GPS Available",
      value: gpsAvailable,
      icon: (
        <span className="text-icon">
          GPS
        </span>
      ),
    },
    {
      title: "Without GPS",
      value: withoutGps,
      icon: (
        <span className="text-icon">
          GPS
        </span>
      ),
    },
    {
      title:
        "Purchased This Year",
      value:
        purchasedThisYear,
      icon: (
        <span className="text-icon">
          {currentYear}
        </span>
      ),
    },
  ];

  const chartData = [
    {
      name:
        "Total Vehicles",
      value: totalVehicles,
    },
    {
      name:
        "GPS Available",
      value: gpsAvailable,
    },
    {
      name: "Without GPS",
      value: withoutGps,
    },
    {
      name:
        "Purchased This Year",
      value:
        purchasedThisYear,
    },
  ];

  return (
    <div className="own-vehicle-page">
      {/* Header */}

      <div className="own-vehicle-header">
        <div className="own-vehicle-header-content">
          <h1>
            Own Vehicle Details
          </h1>

          <p>
            Manage and monitor
            all company-owned
            vehicle records.
          </p>
        </div>

        <button
          type="button"
          className="own-data-entry-button"
          onClick={
            openLoginModal
          }
        >
          <FaDatabase />

          <span>
            Data Entry
          </span>
        </button>
      </div>

      {/* API error */}

      {pageError && (
        <div
          className="own-page-error"
          role="alert"
        >
          <FaExclamationCircle />

          <span>
            {pageError}
          </span>

          <button
            type="button"
            onClick={
              fetchVehicles
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}

      <div className="own-vehicle-stats">
        {stats.map(
          (item) => (
            <div
              className="own-stat-card"
              key={item.title}
            >
              <div>
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
                className={`own-stat-icon ${item.iconClass ||
                  ""
                  }`}
              >
                {item.icon}
              </div>
            </div>
          )
        )}
      </div>

      {/* Chart */}

      <section className="own-chart-card">
        <div className="own-chart-header">
          <h2>
            Vehicle Overview
          </h2>

          <p>
            Summary of vehicle
            availability and GPS
            status.
          </p>
        </div>

        <div className="own-chart-wrapper">
          {isLoading ? (
            <div className="own-loading-state">
              Loading vehicle
              overview...
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={chartData}
                margin={{
                  top: 15,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e5eaf2"
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill:
                      "#61728e",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  allowDecimals={
                    false
                  }
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill:
                      "#61728e",
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  cursor={{
                    fill:
                      "rgba(23, 71, 159, 0.05)",
                  }}
                  contentStyle={{
                    borderRadius:
                      "10px",
                    border:
                      "1px solid #e1e7f0",
                    boxShadow:
                      "0 8px 20px rgba(15, 35, 70, 0.08)",
                  }}
                />

                <Bar
                  dataKey="value"
                  fill="#17479f"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                  maxBarSize={65}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Table */}

      <section className="own-record-card">
        <div className="own-record-header">
          <div>
            <h2>
              Vehicle Records
            </h2>

            <p>
              Complete information
              about company-owned
              vehicles.
            </p>
          </div>
        </div>

        <div className="own-table-wrapper">
          <table className="own-vehicle-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>
                  Vehicle No.
                </th>
                <th>
                  Vehicle Type
                </th>
                <th>
                  Vehicle Make
                </th>
                <th>
                  Manufacturing
                  Year
                </th>
                <th>
                  Registration
                  Date
                </th>
                <th>
                  Transport Owner
                </th>
                <th>
                  Engine No.
                </th>
                <th>
                  Chassis No.
                </th>
                <th>GPS</th>
                <th>
                  Purchase Year
                </th>
                <th>
                  Purchased From
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={12}
                    className="own-empty-row"
                  >
                    Loading vehicle
                    records...
                  </td>
                </tr>
              ) : currentVehicles.length >
                0 ? (
                currentVehicles.map(
                  (
                    vehicle,
                    index
                  ) => (
                    <tr
                      key={
                        vehicle.id ||
                        index
                      }
                    >
                      <td>
                        {(currentPage -
                          1) *
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
                        {vehicle.type ||
                          "-"}
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
                        {vehicle.engineNo ||
                          "-"}
                      </td>

                      <td>
                        {vehicle.chassisNo ||
                          "-"}
                      </td>

                      <td>
                        <span
                          className={
                            vehicle.gps
                              ? "own-gps-badge available"
                              : "own-gps-badge unavailable"
                          }
                        >
                          {vehicle.gps
                            ? "Available"
                            : "Not Available"}
                        </span>
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
                    colSpan={12}
                    className="own-empty-row"
                  >
                    No vehicles
                    found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination */}

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
              setCurrentPage(
                (page) =>
                  Math.max(
                    page - 1,
                    1
                  )
              )
            }
            disabled={
              currentPage === 1 ||
              isLoading
            }
            aria-label="Previous page"
          >
            <FaChevronLeft />
          </button>

          {Array.from(
            {
              length:
                totalPages,
            },
            (_, index) =>
              index + 1
          ).map(
            (pageNumber) => (
              <button
                type="button"
                key={
                  pageNumber
                }
                className={`own-page-number ${currentPage ===
                    pageNumber
                    ? "active"
                    : ""
                  }`}
                onClick={() =>
                  setCurrentPage(
                    pageNumber
                  )
                }
                disabled={
                  isLoading
                }
              >
                {pageNumber}
              </button>
            )
          )}

          <button
            type="button"
            className="own-page-arrow"
            onClick={() =>
              setCurrentPage(
                (page) =>
                  Math.min(
                    page + 1,
                    totalPages
                  )
              )
            }
            disabled={
              currentPage ===
              totalPages ||
              isLoading
            }
            aria-label="Next page"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Login modal */}

      <Ownvehiclelogin
        open={
          isLoginModalOpen
        }
        onClose={
          closeLoginModal
        }
        onLogin={
          handleLoginSuccess
        }
      />
    </div>
  );
};

export default Ownvehicledash;