import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CirclePause,
  Clock3,
  Navigation,
  Search,
  X,
} from "lucide-react";

import TripListColumn from "../Tracking/TripListColumn";
import VehicleColumn from "../Tracking/VehicleColumn";
import TrackingMapColumn from "../Tracking/TrackingMapColumn";

import "../pagescss/tracking.css";


/* =========================================
   API
========================================= */

const API_BASE_URL =
  (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");

const API_URL =
  `${API_BASE_URL}/api/triptracking`;


/* =========================================
   STATUS FILTERS
========================================= */

const statusOptions = [
  "All",
  "Moving",
  "Idle",
  "Breakdown",
  "Reached",
];


/* =========================================
   NORMALIZE VEHICLE
========================================= */

const normalizeVehicle = (
  vehicle,
  index
) => {
  return {
    ...vehicle,

    id:
      vehicle._id ||
      vehicle.id ||
      vehicle.vehicleSubId ||
      `vehicle-${index}`,

    currentLocation:
      vehicle.currentLocation ||
      vehicle.currentPosition ||
      "",

    currentPosition:
      vehicle.currentPosition ||
      vehicle.currentLocation ||
      "",

    status:
      vehicle.status ||
      "Moving",

    speed:
      vehicle.speed ??
      0,

    lastUpdated:
      vehicle.lastUpdated ||
      "-",

    latitude:
      vehicle.latitude ??
      null,

    longitude:
      vehicle.longitude ??
      null,
  };
};


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
      ? trip.vehicles.map(
          normalizeVehicle
        )
      : [];


  /*
    IMPORTANT:

    HTML date input returns:

    2026-08-13

    But backend/MongoDB may return:

    2026-08-13T00:00:00.000Z

    So we convert both tripDate / createdAt
    to YYYY-MM-DD.
  */

  const normalizedTripDate =
    trip.tripDate
      ? String(
          trip.tripDate
        ).slice(
          0,
          10
        )
      : trip.createdAt
        ? String(
            trip.createdAt
          ).slice(
            0,
            10
          )
        : "";


  return {
    ...trip,

    id:
      trip._id ||
      trip.id ||
      trip.tripId ||
      `trip-${index}`,

    vehicles,

    tripDate:
      normalizedTripDate,
  };
};


/* =========================================
   TRACKING COMPONENT
========================================= */

const Tracking = () => {

  const [
    trips,
    setTrips,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    apiError,
    setApiError,
  ] = useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    movementFilter,
    setMovementFilter,
  ] = useState("All");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");

  const [
    selectedTripId,
    setSelectedTripId,
  ] = useState(null);

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState(null);


  /* =========================================
     FETCH TRIPS
  ========================================= */

  const fetchTrips =
    useCallback(
      async () => {

        try {

          setLoading(true);

          setApiError("");


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


          if (!response.ok) {

            const errorData =
              await response
                .json()
                .catch(
                  () => ({})
                );


            throw new Error(
              errorData.message ||
                `Unable to load trips (${response.status})`
            );
          }


          const result =
            await response.json();


          console.log(
            "Trip API Response:",
            result
          );


          let databaseTrips = [];


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


          console.log(
            "Normalized Trips:",
            normalizedTrips
          );


          setTrips(
            normalizedTrips
          );


          setSelectedTripId(
            (
              previousId
            ) => {

              if (
                normalizedTrips.length ===
                0
              ) {

                return null;
              }


              const exists =
                normalizedTrips.some(
                  (
                    trip
                  ) =>
                    trip.id ===
                    previousId
                );


              if (exists) {

                return previousId;
              }


              return normalizedTrips[0]
                .id;
            }
          );

        } catch (error) {

          console.error(
            "Fetch Trips Error:",
            error
          );


          setTrips([]);


          setApiError(
            error.message ||
              "Unable to load trips."
          );

        } finally {

          setLoading(false);
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
     REFRESH ON WINDOW FOCUS
  ========================================= */

  useEffect(() => {

    const handleFocus =
      () => {

        fetchTrips();
      };


    window.addEventListener(
      "focus",
      handleFocus
    );


    return () => {

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };

  }, [
    fetchTrips,
  ]);


  /* =========================================
     STATUS COUNTS
  ========================================= */

  const statusCounts =
    useMemo(() => {

      const counts = {

        All:
          trips.length,

        Moving:
          0,

        Idle:
          0,

        Breakdown:
          0,

        Reached:
          0,
      };


      trips.forEach(
        (
          trip
        ) => {

          const vehicles =
            Array.isArray(
              trip.vehicles
            )
              ? trip.vehicles
              : [];


          const tripStatuses =
            new Set(
              vehicles.map(
                (
                  vehicle
                ) =>
                  vehicle.status
              )
            );


          [
            "Moving",
            "Idle",
            "Breakdown",
            "Reached",
          ].forEach(
            (
              status
            ) => {

              if (
                tripStatuses.has(
                  status
                )
              ) {

                counts[status] +=
                  1;
              }
            }
          );
        }
      );


      return counts;

    }, [
      trips,
    ]);


  /* =========================================
     FILTER TRIPS
  ========================================= */

  const filteredTrips =
    useMemo(() => {

      const search =
        searchTerm
          .trim()
          .toLowerCase();


      return trips.filter(
        (
          trip
        ) => {

          const vehicles =
            Array.isArray(
              trip.vehicles
            )
              ? trip.vehicles
              : [];


          const searchFields = [

            trip.tripId,

            trip.customer,

            trip.materialType,

            trip.origin,

            trip.destination,

            trip.lsp,

            trip.lrNo,

            ...vehicles.map(
              (
                vehicle
              ) =>
                vehicle.vehicleNumber
            ),
          ];


          const matchesSearch =
            !search ||
            searchFields.some(
              (
                value
              ) =>
                String(
                  value ||
                    ""
                )
                  .toLowerCase()
                  .includes(
                    search
                  )
            );


          /*
            DATE FILTER

            selectedDate:
            2026-08-13

            trip.tripDate:
            already normalized to 2026-08-13
          */

          const matchesDate =
            !selectedDate ||
            trip.tripDate ===
              selectedDate;


          const matchesStatus =
            movementFilter ===
              "All" ||
            vehicles.some(
              (
                vehicle
              ) =>
                vehicle.status ===
                movementFilter
            );


          return (
            matchesSearch &&
            matchesDate &&
            matchesStatus
          );
        }
      );

    }, [
      trips,
      searchTerm,
      selectedDate,
      movementFilter,
    ]);


  /* =========================================
     SELECTED TRIP
  ========================================= */

  const selectedTrip =
    filteredTrips.find(
      (
        trip
      ) =>
        trip.id ===
        selectedTripId
    ) ||
    filteredTrips[0] ||
    null;


  /* =========================================
     KEEP TRIP VALID
  ========================================= */

  useEffect(() => {

    if (
      filteredTrips.length ===
      0
    ) {

      setSelectedTripId(
        null
      );

      return;
    }


    const exists =
      filteredTrips.some(
        (
          trip
        ) =>
          trip.id ===
          selectedTripId
      );


    if (!exists) {

      setSelectedTripId(
        filteredTrips[0]
          .id
      );
    }

  }, [
    filteredTrips,
    selectedTripId,
  ]);


  /* =========================================
     KEEP VEHICLE VALID
  ========================================= */

  useEffect(() => {

    if (
      !selectedTrip ||
      !selectedTrip
        .vehicles?.length
    ) {

      setSelectedVehicleId(
        null
      );

      return;
    }


    const vehicleExists =
      selectedTrip
        .vehicles
        .some(
          (
            vehicle
          ) =>
            vehicle.id ===
            selectedVehicleId
        );


    if (
      !vehicleExists
    ) {

      setSelectedVehicleId(
        selectedTrip
          .vehicles[0]
          .id
      );
    }

  }, [
    selectedTrip,
    selectedVehicleId,
  ]);


  /* =========================================
     SELECTED VEHICLE
  ========================================= */

  const selectedVehicle =
    selectedTrip
      ?.vehicles
      ?.find(
        (
          vehicle
        ) =>
          vehicle.id ===
          selectedVehicleId
      ) ||
    selectedTrip
      ?.vehicles?.[0] ||
    null;


  /* =========================================
     STATUS CLASS
  ========================================= */

  const getStatusClass = (
    status
  ) => {

    return String(
      status || ""
    )
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );
  };


  /* =========================================
     STATUS ICON
  ========================================= */

  const getStatusIcon = (
    status
  ) => {

    if (
      status ===
      "Moving"
    ) {

      return (
        <Navigation
          size={13}
        />
      );
    }


    if (
      status ===
      "Reached"
    ) {

      return (
        <CheckCircle2
          size={13}
        />
      );
    }


    if (
      status ===
      "Idle"
    ) {

      return (
        <Clock3
          size={13}
        />
      );
    }


    if (
      status ===
      "Breakdown"
    ) {

      return (
        <CircleAlert
          size={13}
        />
      );
    }


    return (
      <CirclePause
        size={13}
      />
    );
  };


  /* =========================================
     SELECT TRIP
  ========================================= */

  const handleTripSelect = (
    trip
  ) => {

    setSelectedTripId(
      trip.id
    );


    if (
      trip.vehicles?.length
    ) {

      setSelectedVehicleId(
        trip.vehicles[0]
          .id
      );

    } else {

      setSelectedVehicleId(
        null
      );
    }
  };


  /* =========================================
     CLEAR FILTERS
  ========================================= */

  const clearAllFilters =
    () => {

      setSearchTerm("");

      setMovementFilter(
        "All"
      );

      setSelectedDate("");
    };


  /* =========================================
     RENDER
  ========================================= */

  return (

    <main className="tracking-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <header className="tracking-header">

        <div className="tracking-header-content">

        </div>

      </header>


      {/* =====================================
          API ERROR
      ===================================== */}

      {apiError && (

        <div className="tracking-api-error">

          {apiError}

        </div>
      )}


      {/* =====================================
          TOOLBAR
      ===================================== */}

      <section className="tracking-toolbar">


        {/* SEARCH */}

        <div className="tracking-search">

          <Search
            size={18}
          />


          <input
            type="search"
            placeholder="Search trip, customer or vehicle..."
            value={
              searchTerm
            }
            onChange={(
              event
            ) =>
              setSearchTerm(
                event.target
                  .value
              )
            }
          />


          {searchTerm && (

            <button
              type="button"
              className="tracking-search-clear"
              onClick={() =>
                setSearchTerm("")
              }
              aria-label="Clear search"
            >

              <X
                size={15}
              />

            </button>
          )}

        </div>


        {/* =====================================
            STATUS FILTER
        ===================================== */}

        <div className="tracking-status-filter">

          {statusOptions.map(
            (
              status
            ) => {

              const active =
                movementFilter ===
                status;


              return (

                <button
                  type="button"
                  key={status}
                  className={
                    active
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setMovementFilter(
                      status
                    )
                  }
                >

                  {status !==
                    "All" &&
                    getStatusIcon(
                      status
                    )}


                  <span>

                    {status}

                  </span>


                  <small className="tracking-status-count">

                    {
                      statusCounts[
                        status
                      ]
                    }

                  </small>

                </button>
              );
            }
          )}

        </div>


        {/* =====================================
            DATE FILTER
        ===================================== */}

        <label className="tracking-date">

          <CalendarDays
            size={17}
          />


          <input
            type="date"
            value={
              selectedDate
            }
            onChange={(
              event
            ) => {

              setSelectedDate(
                event.target
                  .value
              );
            }}
          />


          {selectedDate && (

            <button
              type="button"
              className="tracking-date-clear"
              onClick={(
                event
              ) => {

                event.preventDefault();

                event.stopPropagation();

                setSelectedDate("");
              }}
              aria-label="Clear selected date"
            >

              <X
                size={14}
              />

            </button>
          )}

        </label>

      </section>


      {/* =====================================
          LOADING
      ===================================== */}

      {loading ? (

        <div className="tracking-loading-state">

          Loading trips...

        </div>

      ) : filteredTrips.length ===
        0 ? (

        /* =====================================
           EMPTY STATE
        ===================================== */

        <div className="tracking-no-results">


          <div className="tracking-no-results-icon">

            {movementFilter ===
            "Breakdown" ? (

              <CircleAlert
                size={26}
              />

            ) : (

              <Search
                size={26}
              />
            )}

          </div>


          <strong>

            {selectedDate
              ? "No Trips Found On This Date"
              : movementFilter !==
                  "All"
                ? `No ${movementFilter} Trips Found`
                : "No Trips Found"}

          </strong>


          <p>

            {selectedDate
              ? `No trip records are available for ${selectedDate}.`
              : movementFilter ===
                  "Breakdown"
                ? "There are currently no trips containing a vehicle with Breakdown status."
                : "Try changing the status, search text or date filter."}

          </p>


          <button
            type="button"
            onClick={
              clearAllFilters
            }
          >

            Show All Trips

          </button>

        </div>

      ) : (

        /* =====================================
           TRACKING COLUMNS
        ===================================== */

        <section className="tracking-layout">


          {/* TRIP LIST */}

          <TripListColumn
            trips={
              filteredTrips
            }
            selectedTrip={
              selectedTrip
            }
            onSelectTrip={
              handleTripSelect
            }
          />


          {/* VEHICLE COLUMN */}

          <VehicleColumn
            trip={
              selectedTrip
            }
            selectedVehicle={
              selectedVehicle
            }
            onSelectVehicle={
              setSelectedVehicleId
            }
            getStatusClass={
              getStatusClass
            }
            getStatusIcon={
              getStatusIcon
            }
          />


          {/* MAP COLUMN */}

          <TrackingMapColumn
            trip={
              selectedTrip
            }
            selectedVehicle={
              selectedVehicle
            }
            onSelectVehicle={
              setSelectedVehicleId
            }
            getStatusClass={
              getStatusClass
            }
          />

        </section>
      )}

    </main>
  );
};


export default Tracking;