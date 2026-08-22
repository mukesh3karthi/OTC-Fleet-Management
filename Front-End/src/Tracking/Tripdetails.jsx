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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const API_URL =
  `${API_BASE_URL}/api/triptracking`;


/* =========================================
   NORMALIZE TRIP
========================================= */

const normalizeTrip = (
  trip,
  index
) => {
  const vehicles =
    Array.isArray(
      trip.vehicles
    )
      ? trip.vehicles
      : [];

  return {
    ...trip,

    id:
      trip._id ||
      trip.id ||
      trip.tripId ||
      `trip-${index}`,

    vehicles,
  };
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


  /* =========================================
     STATE
  ========================================= */

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


  /* =========================================
     FETCH TRIPS
  ========================================= */

  const fetchTrips =
    useCallback(
      async (
        manualRefresh = false
      ) => {
        try {
          if (manualRefresh) {
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
                method: "GET",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );


          const result =
            await response.json();


          if (!response.ok) {
            throw new Error(
              result.message ||
              "Unable to load trips."
            );
          }


          let databaseTrips =
            [];


          if (
            Array.isArray(
              result
            )
          ) {
            databaseTrips =
              result;

          } else if (
            Array.isArray(
              result.data
            )
          ) {
            databaseTrips =
              result.data;

          } else if (
            Array.isArray(
              result.trips
            )
          ) {
            databaseTrips =
              result.trips;
          }


          const normalizedTrips =
            databaseTrips.map(
              normalizeTrip
            );


          setTrips(
            normalizedTrips
          );

        } catch (
          fetchError
        ) {
          console.error(
            "Fetch Trips Error:",
            fetchError
          );

          setError(
            fetchError.message ||
            "Unable to load trips."
          );

        } finally {
          setLoading(false);

          setRefreshing(
            false
          );
        }
      },
      []
    );


  /* =========================================
     INITIAL LOAD
  ========================================= */

  useEffect(() => {
    fetchTrips();
  }, [
    fetchTrips,
  ]);


  /* =========================================
     CREATE TRIP
  ========================================= */

  const handleCreateTrip =
    () => {
      navigate(
        "/tracking-input"
      );
    };


  /* =========================================
     EDIT TRIP
  ========================================= */

  const handleEditTrip = (
    trip
  ) => {
    /*
      We pass the selected trip
      through route state.

      Later Trackinginput.jsx can
      detect edit mode and prefill it.
    */

    navigate(
      "/tracking-input",
      {
        state: {
          mode: "edit",

          tripId:
            trip.tripId,

          mongoId:
            trip._id ||
            trip.id,

          trip,
        },
      }
    );
  };


  /* =========================================
     BACK
  ========================================= */

  const handleBack =
    () => {
      navigate(
        "/tracking"
      );
    };


  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="trip-list-page">

      {/* =====================================
          TOP ACTION BAR
      ===================================== */}

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
            Create Trip
          </span>
        </button>

      </div>


      {/* =====================================
          PAGE HEADING
      ===================================== */}

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
              fetchTrips(
                true
              )
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


      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="trip-page-error">
          {error}
        </div>
      )}


      {/* =====================================
          LIST CARD
      ===================================== */}

      <section className="trip-table-card">

        {/* =================================
            LIST HEADER
        ================================= */}

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


        {/* =================================
            DESKTOP COLUMN TITLES
        ================================= */}

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


        {/* =================================
            BODY
        ================================= */}

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

          ) : trips.length > 0 ? (

            trips.map(
              (
                trip,
                index
              ) => {

                const vehicleCount =
                  Array.isArray(
                    trip.vehicles
                  )
                    ? trip
                        .vehicles
                        .length
                    : 0;


                return (
                  <article
                    key={
                      trip.id
                    }
                    className="trip-full-row"
                  >

                    {/* =============================
                        TRIP
                    ============================= */}

                    <div className="trip-row-main">

                      <span className="trip-mobile-label">
                        Trip
                      </span>


                      <div className="trip-id-box">

                        <div className="trip-id-icon">
                          <Route
                            size={16}
                          />
                        </div>


                        <div>
                          <strong>
                            {trip.tripId ||
                              "-"}
                          </strong>

                          <small>
                            #{index + 1}
                          </small>
                        </div>

                      </div>

                    </div>


                    {/* =============================
                        CUSTOMER
                    ============================= */}

                    <div className="trip-row-cell">

                      <span className="trip-mobile-label">
                        Customer
                      </span>


                      <div className="trip-cell-with-icon">

                        <UserRound
                          size={14}
                        />

                        <strong>
                          {trip.customer ||
                            "-"}
                        </strong>

                      </div>

                    </div>


                    {/* =============================
                        MATERIAL
                    ============================= */}

                    <div className="trip-row-cell">

                      <span className="trip-mobile-label">
                        Material
                      </span>


                      <div className="trip-cell-with-icon">

                        <Package
                          size={14}
                        />

                        <span>
                          {trip.materialType ||
                            "-"}
                        </span>

                      </div>

                    </div>


                    {/* =============================
                        ROUTE
                    ============================= */}

                    <div className="trip-row-cell trip-route-cell">

                      <span className="trip-mobile-label">
                        Route
                      </span>


                      <div className="trip-row-route">

                        <MapPin
                          size={14}
                        />

                        <span>
                          {trip.origin ||
                            "-"}
                        </span>

                        <ChevronRight
                          size={13}
                        />

                        <span>
                          {trip.destination ||
                            "-"}
                        </span>

                      </div>

                    </div>


                    {/* =============================
                        VEHICLES
                    ============================= */}

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


                    {/* =============================
                        STATUS
                    ============================= */}

                    <div className="trip-row-cell">

                      <span className="trip-mobile-label">
                        Status
                      </span>


                      <span
                        className={`trip-status-badge ${
                          String(
                            trip.tripStatus ||
                            "Active"
                          )
                            .toLowerCase()
                        }`}
                      >
                        {trip.tripStatus ||
                          "Active"}
                      </span>

                    </div>


                    {/* =============================
                        CREATED DATE
                    ============================= */}

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
                            trip.createdAt
                          )}
                        </span>

                      </div>

                    </div>


                    {/* =============================
                        EDIT
                    ============================= */}

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
                Create your first
                tracking trip to
                get started.
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

                Create Trip
              </button>

            </div>

          )}

        </div>

      </section>

    </main>
  );
};


export default Tripdetails;