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

const API_URL =
  "http://localhost:5000/api/triptracking";


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

    /*
      MongoDB uses _id.
      Existing frontend components use id.
    */

    id:
      vehicle._id ||
      vehicle.id ||
      vehicle.vehicleSubId ||
      `vehicle-${index}`,


    /*
      Create Trip uses currentPosition.

      Existing VehicleColumn and Map
      use currentLocation.

      Keep both so all components work.
    */

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


  return {
    ...trip,

    /*
      MongoDB _id -> frontend id
    */

    id:
      trip._id ||
      trip.id ||
      trip.tripId ||
      `trip-${index}`,

    vehicles,


    /*
      Support different possible
      date fields from backend.
    */

    tripDate:
      trip.tripDate ||
      trip.createdAt?.slice(
        0,
        10
      ) ||
      "",
  };
};


/* =========================================
   TRACKING COMPONENT
========================================= */

const Tracking = () => {

  /* =========================================
     DATABASE TRIPS
  ========================================= */

  const [
    trips,
    setTrips,
  ] = useState([]);


  /* =========================================
     LOADING
  ========================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);


  /* =========================================
     API ERROR
  ========================================= */

  const [
    apiError,
    setApiError,
  ] = useState("");


  /* =========================================
     SEARCH
  ========================================= */

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");


  /* =========================================
     MOVEMENT FILTER
  ========================================= */

  const [
    movementFilter,
    setMovementFilter,
  ] = useState("All");


  /* =========================================
     DATE FILTER
  ========================================= */

  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");


  /* =========================================
     SELECTED TRIP
  ========================================= */

  const [
    selectedTripId,
    setSelectedTripId,
  ] = useState(null);


  /* =========================================
     SELECTED VEHICLE
  ========================================= */

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState(null);


  /* =========================================
     FETCH TRIPS FROM DATABASE
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


          /*
            Supports backend responses like:

            [ ... ]

            OR

            {
              success: true,
              data: [...]
            }

            OR

            {
              success: true,
              trips: [...]
            }
          */

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


          /*
            Select first trip automatically.
          */

          setSelectedTripId(
            (previousId) => {

              if (
                normalizedTrips.length ===
                0
              ) {

                return null;
              }


              const exists =
                normalizedTrips.some(
                  (trip) =>
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
     LOAD DATABASE DATA
  ========================================= */

  useEffect(() => {

    fetchTrips();

  }, [
    fetchTrips,
  ]);


  /* =========================================
     REFRESH WHEN PAGE GETS FOCUS
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
        All: trips.length,
        Moving: 0,
        Idle: 0,
        Breakdown: 0,
        Reached: 0,
      };


      trips.forEach(
        (trip) => {

          const vehicles =
            Array.isArray(
              trip.vehicles
            )
              ? trip.vehicles
              : [];


          const tripStatuses =
            new Set(
              vehicles.map(
                (vehicle) =>
                  vehicle.status
              )
            );


          [
            "Moving",
            "Idle",
            "Breakdown",
            "Reached",
          ].forEach(
            (status) => {

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
        (trip) => {

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
              (vehicle) =>
                vehicle.vehicleNumber
            ),
          ];


          /* =============================
             SEARCH
          ============================= */

          const matchesSearch =
            !search ||
            searchFields.some(
              (value) =>
                String(
                  value || ""
                )
                  .toLowerCase()
                  .includes(
                    search
                  )
            );


          /* =============================
             DATE
          ============================= */

          const matchesDate =
            !selectedDate ||
            trip.tripDate ===
              selectedDate;


          /* =============================
             STATUS
          ============================= */

          const matchesStatus =
            movementFilter ===
              "All" ||
            vehicles.some(
              (vehicle) =>
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
     GET SELECTED TRIP
  ========================================= */

  const selectedTrip =
    filteredTrips.find(
      (trip) =>
        trip.id ===
        selectedTripId
    ) ||
    filteredTrips[0] ||
    null;


  /* =========================================
     KEEP SELECTED TRIP VALID
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
        (trip) =>
          trip.id ===
          selectedTripId
      );


    if (!exists) {

      setSelectedTripId(
        filteredTrips[0].id
      );

    }

  }, [
    filteredTrips,
    selectedTripId,
  ]);


  /* =========================================
     KEEP SELECTED VEHICLE VALID
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
          (vehicle) =>
            vehicle.id ===
            selectedVehicleId
        );


    if (!vehicleExists) {

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
     GET SELECTED VEHICLE
  ========================================= */

  const selectedVehicle =
    selectedTrip
      ?.vehicles
      ?.find(
        (vehicle) =>
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
     RENDER
  ========================================= */

  return (

    <main className="tracking-page">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <header className="tracking-header">

        <div className="tracking-header-content">

          {/* <span className="tracking-eyebrow">
            FLEET OPERATIONS
          </span>


          <h1>
            Vehicle Tracking
          </h1>


          <p>
            Track trips and multiple
            vehicles travelling under
            the same consignment.
          </p> */}

        </div>
</header>


      {/* =====================================
          API ERROR
      ===================================== */}

      {apiError && (

        <div
          style={{
            marginBottom:
              "12px",

            padding:
              "10px 14px",

            border:
              "1px solid #fecaca",

            borderRadius:
              "8px",

            background:
              "#fef2f2",

            color:
              "#b91c1c",

            fontSize:
              "12px",

            fontWeight:
              600,
          }}
        >

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
                event.target.value
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


        {/* STATUS FILTER */}

        <div className="tracking-status-filter">

          {statusOptions.map(
            (status) => {

              const active =
                movementFilter ===
                status;


              return (
                <button
                  type="button"
                  key={
                    status
                  }
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
                    {statusCounts[
                      status
                    ]}
                  </small>

                </button>
              );

            }
          )}

        </div>


        {/* DATE */}

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
            ) =>
              setSelectedDate(
                event.target.value
              )
            }
          />

        </label>

      </section>


      {/* =====================================
          LOADING
      ===================================== */}

      {loading ? (

        <div className="tracking-loading-state">
          Loading trips...
        </div>

      ) : filteredTrips.length === 0 ? (

        <div className="tracking-no-results">

          <div className="tracking-no-results-icon">
            {movementFilter === "Breakdown" ? (
              <CircleAlert size={26} />
            ) : (
              <Search size={26} />
            )}
          </div>


          <strong>
            No {movementFilter === "All"
              ? ""
              : `${movementFilter} `}Trips Found
          </strong>


          <p>
            {movementFilter === "Breakdown"
              ? "There are currently no trips containing a vehicle with Breakdown status."
              : "Try changing the status, search text or date filter."}
          </p>


          <button
            type="button"
            onClick={() => {
              setMovementFilter("All");
              setSearchTerm("");
              setSelectedDate("");
            }}
          >
            Show All Trips
          </button>

        </div>

      ) : (

        /* =====================================
           MAIN TRACKING LAYOUT
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


          {/* VEHICLE DETAILS */}

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


          {/* VEHICLE MAP */}

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