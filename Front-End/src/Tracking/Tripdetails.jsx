import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Edit3,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Route,
  Truck,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import "./Tripdetails.css";

/* =========================================
   API
========================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL =
  `${API_BASE_URL}/api/triporders`;

/* =========================================
   HELPERS
========================================= */

const safeArray = (value) =>
  Array.isArray(value)
    ? value
    : [];

const safeText = (
  value,
  fallback = "-"
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (
    typeof value === "object"
  ) {
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
  if (
    Array.isArray(result)
  ) {
    return result;
  }

  if (
    Array.isArray(
      result?.data
    )
  ) {
    return result.data;
  }

  if (
    Array.isArray(
      result?.trips
    )
  ) {
    return result.trips;
  }

  if (
    Array.isArray(
      result?.orders
    )
  ) {
    return result.orders;
  }

  return [];
};

/* =========================================
   NORMALIZE TRIP
========================================= */

const normalizeTrip = (
  trip,
  index
) => {
  const allocatedVehicles =
    safeArray(
      trip?.allocatedVehicles
    );

  const vehicleRequirements =
    safeArray(
      trip?.vehicleRequirements
    );

  const trafficQuotations =
    safeArray(
      trip?.trafficQuotations
    );

  const vehicleConfirmations =
    safeArray(
      trip?.vehicleConfirmations
    );

  return {
    ...trip,

    id:
      safeText(
        trip?._id,
        ""
      ) ||
      safeText(
        trip?.tripId,
        ""
      ) ||
      `trip-${index}`,

    allocatedVehicles,
    vehicleRequirements,
    trafficQuotations,
    vehicleConfirmations,
  };
};

/* =========================================
   LATEST TRACKING
========================================= */

const getLatestTracking = (
  vehicle
) => {
  const tracking =
    safeArray(
      vehicle?.dailyTracking
    );

  if (!tracking.length) {
    return null;
  }

  return tracking[
    tracking.length - 1
  ];
};

/* =========================================
   TRIP STATUS
========================================= */

const getTripStatus = (
  trip
) => {
  const vehicles =
    safeArray(
      trip?.allocatedVehicles
    );

  if (!vehicles.length) {
    return "Pending";
  }

  const statuses =
    vehicles.map(
      (vehicle) =>
        safeText(
          getLatestTracking(
            vehicle
          )?.status,
          "Idle"
        )
    );

  if (
    statuses.length > 0 &&
    statuses.every(
      (status) =>
        status
          .trim()
          .toLowerCase() ===
        "reached"
    )
  ) {
    return "Reached";
  }

  if (
    statuses.some(
      (status) =>
        status
          .trim()
          .toLowerCase() ===
        "breakdown"
    )
  ) {
    return "Breakdown";
  }

  if (
    statuses.some(
      (status) =>
        status
          .trim()
          .toLowerCase() ===
        "moving"
    )
  ) {
    return "Moving";
  }

  if (
    statuses.some(
      (status) =>
        status
          .trim()
          .toLowerCase() ===
        "stopped"
    )
  ) {
    return "Stopped";
  }

  return "Idle";
};

/* =========================================
   STATUS CLASS
========================================= */

const getStatusClass = (
  status
) => {
  const value =
    String(
      status || ""
    )
      .trim()
      .toLowerCase();

  if (
    value === "moving"
  ) {
    return "moving";
  }

  if (
    value === "idle"
  ) {
    return "idle";
  }

  if (
    value === "stopped"
  ) {
    return "stopped";
  }

  if (
    value === "breakdown"
  ) {
    return "breakdown";
  }

  if (
    value === "reached"
  ) {
    return "reached";
  }

  if (
    value === "confirmed"
  ) {
    return "confirmed";
  }

  return "pending";
};

/* =========================================
   FORMAT DATE
========================================= */

const formatDate = (
  value
) => {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

/* =========================================
   COMPONENT
========================================= */

const Tripdetails = () => {
  const navigate =
    useNavigate();

  /* =====================================
     STATE
  ===================================== */

  const [
    trips,
    setTrips,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  /* =====================================
     FETCH TRIPS
  ===================================== */

  const fetchTrips =
    useCallback(
      async (
        manualRefresh = false
      ) => {
        try {
          if (
            manualRefresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError("");

          const response =
            await fetch(
              API_URL,
              {
                method:
                  "GET",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          let result = {};

          try {
            result =
              await response.json();
          } catch {
            result = {};
          }

          if (!response.ok) {
            throw new Error(
              result?.message ||
                "Unable to load trips."
            );
          }

          const databaseTrips =
            extractTrips(
              result
            );

          /*
            Tracking trip list should
            contain orders that have
            actual allocated vehicles.

            The order remains stored in
            TripOrder as the single
            source of truth.
          */

          const trackingTrips =
            databaseTrips
              .map(
                normalizeTrip
              )
              .filter(
                (trip) =>
                  trip
                    .allocatedVehicles
                    .length > 0
              );

          setTrips(
            trackingTrips
          );
        } catch (
          fetchError
        ) {
          console.error(
            "Fetch Trips Error:",
            fetchError
          );

          setError(
            fetchError?.message ||
              "Unable to load trips."
          );

          setTrips([]);
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      []
    );

  /* =====================================
     INITIAL LOAD
  ===================================== */

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  /* =====================================
     TRACKING INPUT
  ===================================== */

  const handleCreateTrip =
    () => {
      /*
        Orders are no longer created
        from Tracking.

        This button now opens Tracking
        Input where approved requirements
        can receive actual vehicles.
      */

      navigate(
        "/tracking-input"
      );
    };

  /* =====================================
     EDIT / MANAGE TRIP
  ===================================== */

  const handleEditTrip = (
    trip
  ) => {
    navigate(
      "/tracking-input",
      {
        state: {
          mode: "edit",

          tripId:
            trip.tripId,

          mongoId:
            trip._id,

          trip,
        },
      }
    );
  };

  /* =====================================
     BACK
  ===================================== */

  const handleBack =
    () => {
      navigate(
        "/tracking"
      );
    };

  /* =====================================
     RENDER
  ===================================== */

  return (
    <main className="trip-list-page">
      {/* =================================
          TOP ACTION BAR
      ================================= */}

      <div className="trip-page-actions">
        <button
          type="button"
          className="trip-back-button"
          onClick={
            handleBack
          }
        >
          <ArrowLeft
            size={16}
          />

          <span>
            Back to Tracking
          </span>
        </button>

        <button
          type="button"
          className="trip-create-button"
          onClick={
            handleCreateTrip
          }
        >
          <Plus
            size={16}
          />

          <span>
            Tracking Input
          </span>
        </button>
      </div>

      {/* =================================
          PAGE HEADING
      ================================= */}

      <header className="trip-page-header">
        <div>
          <span className="trip-page-eyebrow">
            FLEET OPERATIONS
          </span>

          <h1>
            Trip List
          </h1>

          <p>
            View and manage all
            vehicle tracking trips.
          </p>
        </div>

        <div className="trip-page-header-actions">
          <span className="trip-total-badge">
            <Truck
              size={14}
            />

            {trips.length}

            {trips.length === 1
              ? " Trip"
              : " Trips"}
          </span>

          <button
            type="button"
            className="trip-refresh-button"
            disabled={
              refreshing
            }
            onClick={() =>
              fetchTrips(true)
            }
            aria-label="Refresh trips"
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />
          </button>
        </div>
      </header>

      {/* =================================
          ERROR
      ================================= */}

      {error && (
        <div className="trip-page-error">
          {error}
        </div>
      )}

      {/* =================================
          LIST CARD
      ================================= */}

      <section className="trip-table-card">
        <div className="trip-table-header">
          <div>
            <h2>
              All Trips
            </h2>

            <p>
              Complete trip and
              consignment overview.
            </p>
          </div>
        </div>

        {/* =============================
            DESKTOP COLUMN TITLES
        ============================= */}

        <div className="trip-list-column-head">
          <span>
            Trip
          </span>

          <span>
            Customer
          </span>

          <span>
            Material
          </span>

          <span>
            Route
          </span>

          <span>
            Vehicles
          </span>

          <span>
            Status
          </span>

          <span>
            Created
          </span>

          <span className="trip-action-heading">
            Action
          </span>
        </div>

        {/* =============================
            BODY
        ============================= */}

        <div className="trip-full-list">
          {loading ? (
            <div className="trip-page-loading">
              <RefreshCw
                size={20}
                className="spin"
              />

              <span>
                Loading trips...
              </span>
            </div>
          ) : trips.length >
            0 ? (
            trips.map(
              (
                trip,
                index
              ) => {
                const vehicleCount =
                  safeArray(
                    trip
                      .allocatedVehicles
                  ).length;

                const tripStatus =
                  getTripStatus(
                    trip
                  );

                const statusClass =
                  getStatusClass(
                    tripStatus
                  );

                return (
                  <article
                    key={
                      trip.id
                    }
                    className="trip-full-row"
                  >
                    {/* =====================
                        TRIP
                    ===================== */}

                    <div className="trip-row-main">
                      <span className="trip-mobile-label">
                        Trip
                      </span>

                      <div className="trip-id-box">
                        <div className="trip-id-icon">
                          <Route
                            size={
                              16
                            }
                          />
                        </div>

                        <div>
                          <strong>
                            {safeText(
                              trip.tripId
                            )}
                          </strong>

                          <small>
                            #
                            {index +
                              1}
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* =====================
                        CUSTOMER
                    ===================== */}

                    <div className="trip-row-cell">
                      <span className="trip-mobile-label">
                        Customer
                      </span>

                      <div className="trip-cell-with-icon">
                        <UserRound
                          size={14}
                        />

                        <strong>
                          {safeText(
                            trip.customer
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* =====================
                        MATERIAL
                    ===================== */}

                    <div className="trip-row-cell">
                      <span className="trip-mobile-label">
                        Material
                      </span>

                      <div className="trip-cell-with-icon">
                        <Package
                          size={14}
                        />

                        <span>
                          {safeText(
                            trip
                              .materialType
                          )}
                        </span>
                      </div>
                    </div>

                    {/* =====================
                        ROUTE
                    ===================== */}

                    <div className="trip-row-cell trip-route-cell">
                      <span className="trip-mobile-label">
                        Route
                      </span>

                      <div className="trip-row-route">
                        <MapPin
                          size={14}
                        />

                        <span>
                          {safeText(
                            trip.origin
                          )}
                        </span>

                        <ChevronRight
                          size={13}
                        />

                        <span>
                          {safeText(
                            trip
                              .destination
                          )}
                        </span>
                      </div>
                    </div>

                    {/* =====================
                        VEHICLES
                    ===================== */}

                    <div className="trip-row-cell">
                      <span className="trip-mobile-label">
                        Vehicles
                      </span>

                      <span className="trip-row-vehicle-count">
                        <Truck
                          size={14}
                        />

                        {vehicleCount}
                      </span>
                    </div>

                    {/* =====================
                        STATUS
                    ===================== */}

                    <div className="trip-row-cell">
                      <span className="trip-mobile-label">
                        Status
                      </span>

                      <span
                        className={`trip-status-badge ${statusClass}`}
                      >
                        {tripStatus}
                      </span>
                    </div>

                    {/* =====================
                        CREATED DATE
                    ===================== */}

                    <div className="trip-row-cell">
                      <span className="trip-mobile-label">
                        Created
                      </span>

                      <div className="trip-date-cell">
                        <CalendarDays
                          size={13}
                        />

                        <span>
                          {formatDate(
                            trip
                              .createdAt
                          )}
                        </span>
                      </div>
                    </div>

                    {/* =====================
                        MANAGE
                    ===================== */}

                    <div className="trip-row-actions">
                      <span className="trip-mobile-label">
                        Action
                      </span>

                      <button
                        type="button"
                        className="trip-edit-button"
                        onClick={() =>
                          handleEditTrip(
                            trip
                          )
                        }
                      >
                        <Edit3
                          size={14}
                        />

                        <span>
                          Edit
                        </span>
                      </button>
                    </div>
                  </article>
                );
              }
            )
          ) : (
            <div className="trip-empty-state">
              <div className="trip-empty-icon">
                <Truck
                  size={24}
                />
              </div>

              <strong>
                No Trips Found
              </strong>

              <p>
                Trips will appear
                here after actual
                vehicles are
                allocated in
                Tracking Input.
              </p>

              <button
                type="button"
                onClick={
                  handleCreateTrip
                }
              >
                <Plus
                  size={15}
                />

                Tracking Input
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Tripdetails;