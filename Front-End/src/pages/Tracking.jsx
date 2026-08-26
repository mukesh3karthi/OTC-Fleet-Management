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

import TripListColumn
  from "../Tracking/TripListColumn";

import VehicleColumn
  from "../Tracking/VehicleColumn";

import TrackingMapColumn
  from "../Tracking/TrackingMapColumn";

import "../pagescss/tracking.css";


/* =========================================
   API
========================================= */

const API_BASE_URL =
  (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  ).replace(
    /\/+$/,
    ""
  );


const API_URL =
  `${API_BASE_URL}/api/triptracking`;


/* =========================================
   STATUS FILTERS
========================================= */

const statusOptions = [
  "All",
  "Moving",
  "Idle",
  "Stopped",
  "Breakdown",
  "Reached",
];


/* =========================================
   NORMALIZE MONGODB DATE
========================================= */

const normalizeDateValue = (
  value
) => {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }


  /*
    MongoDB Extended JSON

    {
      "$date":
      "2026-08-01T09:00:00.000Z"
    }
  */

  if (
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {

    if (
      value.$date !==
      undefined
    ) {

      return normalizeDateValue(
        value.$date
      );

    }


    /*
      Sometimes dates can contain:

      {
        "$date": {
          "$numberLong": "..."
        }
      }
    */

    if (
      value.$numberLong !==
      undefined
    ) {

      const timestamp =
        Number(
          value.$numberLong
        );


      if (
        Number.isFinite(
          timestamp
        )
      ) {

        return new Date(
          timestamp
        ).toISOString();

      }

    }


    return null;

  }


  if (
    value instanceof Date
  ) {

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return null;
    }


    return value
      .toISOString();

  }


  if (
    typeof value ===
    "number"
  ) {

    const date =
      new Date(
        value
      );


    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date.toISOString();

  }


  if (
    typeof value ===
    "string"
  ) {

    const text =
      value.trim();


    if (!text) {
      return null;
    }


    return text;

  }


  return null;

};


/* =========================================
   NORMALIZE TEXT
========================================= */

const normalizeTextValue = (
  value,
  fallback = ""
) => {

  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }


  if (
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {

    if (
      value.$date !==
      undefined
    ) {

      return (
        normalizeDateValue(
          value
        ) ||
        fallback
      );

    }


    if (
      value.$oid !==
      undefined
    ) {

      return String(
        value.$oid
      );

    }


    return fallback;

  }


  return String(
    value
  );

};


/* =========================================
   NORMALIZE NUMBER
========================================= */

const normalizeNumber = (
  value,
  fallback = 0
) => {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }


  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : fallback;

};


/* =========================================
   NORMALIZE NULLABLE NUMBER
========================================= */

const normalizeNullableNumber = (
  value
) => {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }


  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : null;

};


/* =========================================
   NORMALIZE OBJECT ID
========================================= */

const normalizeId = (
  value,
  fallback = ""
) => {

  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }


  if (
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {

    if (
      value.$oid
    ) {

      return String(
        value.$oid
      );

    }


    if (
      value.toString &&
      typeof value.toString ===
        "function"
    ) {

      const result =
        value.toString();


      if (
        result !==
        "[object Object]"
      ) {

        return result;

      }

    }


    return fallback;

  }


  return String(
    value
  );

};


/* =========================================
   NORMALIZE VEHICLE
========================================= */

const normalizeVehicle = (
  vehicle = {},
  index = 0
) => {

  const vehicleId =
    normalizeId(
      vehicle._id
    ) ||
    normalizeId(
      vehicle.id
    ) ||
    normalizeTextValue(
      vehicle.vehicleSubId
    ) ||
    `vehicle-${index}`;


  return {

    ...vehicle,


    /* =====================================
       ID
    ===================================== */

    id:
      vehicleId,


    vehicleSubId:
      normalizeTextValue(
        vehicle.vehicleSubId
      ),


    vehicleNumber:
      normalizeTextValue(
        vehicle.vehicleNumber
      ),


    /* =====================================
       POSITION
    ===================================== */

    currentLocation:
      normalizeTextValue(
        vehicle.currentLocation ||
        vehicle.currentPosition
      ),


    currentPosition:
      normalizeTextValue(
        vehicle.currentPosition ||
        vehicle.currentLocation
      ),


    yesterdayPosition:
      normalizeTextValue(
        vehicle.yesterdayPosition
      ),


    /* =====================================
       MOVEMENT
    ===================================== */

    runningKm:
      normalizeNumber(
        vehicle.runningKm
      ),


    status:
      normalizeTextValue(
        vehicle.status,
        "Moving"
      ) ||
      "Moving",


    currentDay:
      normalizeNullableNumber(
        vehicle.currentDay
      ),


    speed:
      normalizeNumber(
        vehicle.speed
      ),


    /* =====================================
       MAP
    ===================================== */

    latitude:
      normalizeNullableNumber(
        vehicle.latitude
      ),


    longitude:
      normalizeNullableNumber(
        vehicle.longitude
      ),


    lastUpdated:
      normalizeDateValue(
        vehicle.lastUpdated
      ),


    /* =====================================
       LOADING
    ===================================== */

    loadingStatus:
      normalizeTextValue(
        vehicle.loadingStatus,
        "Pending"
      ) ||
      "Pending",


    loadingPointInDate:
      normalizeDateValue(
        vehicle.loadingPointInDate
      ),


    loadingDate:
      normalizeDateValue(
        vehicle.loadingDate
      ),


    loadingPointOutDate:
      normalizeDateValue(
        vehicle.loadingPointOutDate
      ),


    loadingHaltingDays:
      normalizeNumber(
        vehicle.loadingHaltingDays
      ),


    loadingRemarks:
      normalizeTextValue(
        vehicle.loadingRemarks
      ),


    /* =====================================
       UNLOADING
    ===================================== */

    unloadingStatus:
      normalizeTextValue(
        vehicle.unloadingStatus,
        "Pending"
      ) ||
      "Pending",


    unloadingPointInDate:
      normalizeDateValue(
        vehicle.unloadingPointInDate
      ),


    unloadingDate:
      normalizeDateValue(
        vehicle.unloadingDate
      ),


    unloadingPointOutDate:
      normalizeDateValue(
        vehicle.unloadingPointOutDate
      ),


    unloadingHaltingDays:
      normalizeNumber(
        vehicle.unloadingHaltingDays
      ),


    unloadingRemarks:
      normalizeTextValue(
        vehicle.unloadingRemarks
      ),


    /* =====================================
       LR
    ===================================== */

    lrNo:
      normalizeTextValue(
        vehicle.lrNo
      ),


    lrStatus:
      normalizeTextValue(
        vehicle.lrStatus
      ),


    lrRemarks:
      normalizeTextValue(
        vehicle.lrRemarks
      ),


    lrSignature:
      normalizeTextValue(
        vehicle.lrSignature
      ),


    /* =====================================
       POD
    ===================================== */

    podStatus:
      normalizeTextValue(
        vehicle.podStatus,
        "Pending"
      ) ||
      "Pending",


    courierName:
      normalizeTextValue(
        vehicle.courierName
      ),


    trackingId:
      normalizeTextValue(
        vehicle.trackingId
      ),


    podCourierDate:
      normalizeDateValue(
        vehicle.podCourierDate
      ),


    podRemarks:
      normalizeTextValue(
        vehicle.podRemarks
      ),


    /* =====================================
       DRIVER
    ===================================== */

    driverName:
      normalizeTextValue(
        vehicle.driverName
      ),


    driverNumber:
      normalizeTextValue(
        vehicle.driverNumber
      ),

  };

};


/* =========================================
   NORMALIZE TRIP
========================================= */

const normalizeTrip = (
  trip = {},
  index = 0
) => {

  const vehicles =
    Array.isArray(
      trip.vehicles
    )
      ? trip.vehicles.map(
          (
            vehicle,
            vehicleIndex
          ) =>
            normalizeVehicle(
              vehicle,
              vehicleIndex
            )
        )
      : [];


  /* =====================================
     TRIP ID
  ===================================== */

  const tripId =
    normalizeTextValue(
      trip.tripId
    );


  const id =
    normalizeId(
      trip._id
    ) ||
    normalizeId(
      trip.id
    ) ||
    tripId ||
    `trip-${index}`;


  /* =====================================
     DATES
  ===================================== */

  const createdAt =
    normalizeDateValue(
      trip.createdAt
    );


  const updatedAt =
    normalizeDateValue(
      trip.updatedAt
    );


  const providedTripDate =
    normalizeDateValue(
      trip.tripDate
    );


  const rawTripDate =
    providedTripDate ||
    createdAt ||
    "";


  const tripDate =
    rawTripDate
      ? String(
          rawTripDate
        ).slice(
          0,
          10
        )
      : "";


  /* =====================================
     ROUTE LOCATIONS
  ===================================== */

  const routeLocations =
    Array.isArray(
      trip.routeLocations
    )
      ? trip.routeLocations
          .map(
            (
              location
            ) =>
              normalizeTextValue(
                location
              )
          )
          .filter(
            Boolean
          )
      : [];


  return {

    ...trip,


    id,

    tripId,


    /* =====================================
       CLIENT
    ===================================== */

    customer:
      normalizeTextValue(
        trip.customer
      ),


    clientContactPerson:
      normalizeTextValue(
        trip.clientContactPerson
      ),


    clientPhone:
      normalizeTextValue(
        trip.clientPhone
      ),


    /* =====================================
       MATERIAL
    ===================================== */

    materialType:
      normalizeTextValue(
        trip.materialType
      ),


    /* =====================================
       TRANSPORTER
    ===================================== */

    lsp:
      normalizeTextValue(
        trip.lsp
      ),


    transporterContactPerson:
      normalizeTextValue(
        trip.transporterContactPerson
      ),


    transporterPhone:
      normalizeTextValue(
        trip.transporterPhone
      ),


    /* =====================================
       ROUTE
    ===================================== */

    origin:
      normalizeTextValue(
        trip.origin
      ),


    destination:
      normalizeTextValue(
        trip.destination
      ),


    routeLocations,


    /* =====================================
       ESCORT
    ===================================== */

    escortVehicleNumber:
      normalizeTextValue(
        trip.escortVehicleNumber
      ),


    escortName:
      normalizeTextValue(
        trip.escortName
      ),


    escortContactNumber:
      normalizeTextValue(
        trip.escortContactNumber
      ),


    /* =====================================
       SUPERVISOR
    ===================================== */

    supervisorName:
      normalizeTextValue(
        trip.supervisorName
      ),


    supervisorContact:
      normalizeTextValue(
        trip.supervisorContact
      ),


    /* =====================================
       TRIP VALUES
    ===================================== */

    estimatedTransitDays:
      normalizeNumber(
        trip.estimatedTransitDays
      ),


    totalKm:
      normalizeNumber(
        trip.totalKm
      ),


    tripStatus:
      normalizeTextValue(
        trip.tripStatus,
        "Active"
      ) ||
      "Active",


    /* =====================================
       VEHICLES
    ===================================== */

    vehicles,


    /* =====================================
       NORMALIZED DATES
    ===================================== */

    createdAt,

    updatedAt,

    tripDate,

  };

};


/* =========================================
   TRACKING COMPONENT
========================================= */

const Tracking = () => {

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
  ] = useState(
    "All"
  );


  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");


  const [
    selectedTripId,
    setSelectedTripId,
  ] = useState(
    null
  );


  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState(
    null
  );


  /* =====================================
     FETCH TRIPS
  ===================================== */

  const fetchTrips =
    useCallback(
      async () => {

        try {

          setLoading(
            true
          );


          setApiError(
            ""
          );


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


          if (
            !response.ok
          ) {

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
              (
                trip,
                index
              ) =>
                normalizeTrip(
                  trip,
                  index
                )
            );


          console.log(
            "Normalized Trips:",
            normalizedTrips
          );


          setTrips(
            normalizedTrips
          );


          /* =================================
             KEEP SELECTED TRIP IF POSSIBLE
          ================================= */

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


              if (
                exists
              ) {

                return previousId;

              }


              return normalizedTrips[0]
                .id;

            }
          );

        } catch (
          error
        ) {

          console.error(
            "Fetch Trips Error:",
            error
          );


          setTrips(
            []
          );


          setSelectedTripId(
            null
          );


          setSelectedVehicleId(
            null
          );


          setApiError(
            error.message ||
            "Unable to load trips."
          );

        } finally {

          setLoading(
            false
          );

        }

      },
      []
    );


  /* =====================================
     INITIAL LOAD
  ===================================== */

  useEffect(
    () => {

      fetchTrips();

    },
    [
      fetchTrips,
    ]
  );


  /* =====================================
     REFRESH ON WINDOW FOCUS
  ===================================== */

  useEffect(
    () => {

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

    },
    [
      fetchTrips,
    ]
  );


  /* =====================================
     STATUS COUNTS
  ===================================== */

  const statusCounts =
    useMemo(
      () => {

        const counts = {

          All:
            trips.length,

          Moving:
            0,

          Idle:
            0,

          Stopped:
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
              "Stopped",
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

                  counts[
                    status
                  ] += 1;

                }

              }
            );

          }
        );


        return counts;

      },
      [
        trips,
      ]
    );


  /* =====================================
     FILTER TRIPS
  ===================================== */

  const filteredTrips =
    useMemo(
      () => {

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


            /* =============================
               SEARCH
            ============================= */

            const searchFields = [

              trip.tripId,

              trip.customer,

              trip.materialType,

              trip.origin,

              trip.destination,

              trip.lsp,

              trip.clientContactPerson,

              trip.transporterContactPerson,

              trip.supervisorName,

              trip.escortName,

              ...vehicles.map(
                (
                  vehicle
                ) =>
                  vehicle.vehicleNumber
              ),

              ...vehicles.map(
                (
                  vehicle
                ) =>
                  vehicle.driverName
              ),

              ...vehicles.map(
                (
                  vehicle
                ) =>
                  vehicle.lrNo
              ),

              ...vehicles.map(
                (
                  vehicle
                ) =>
                  vehicle.currentPosition
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

      },
      [

        trips,

        searchTerm,

        selectedDate,

        movementFilter,

      ]
    );


  /* =====================================
     SELECTED TRIP
  ===================================== */

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


  /* =====================================
     KEEP SELECTED TRIP VALID
  ===================================== */

  useEffect(
    () => {

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


      if (
        !exists
      ) {

        setSelectedTripId(
          filteredTrips[0]
            .id
        );

      }

    },
    [

      filteredTrips,

      selectedTripId,

    ]
  );


  /* =====================================
     KEEP VEHICLE VALID
  ===================================== */

  useEffect(
    () => {

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

    },
    [

      selectedTrip,

      selectedVehicleId,

    ]
  );


  /* =====================================
     SELECTED VEHICLE
  ===================================== */

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


  /* =====================================
     STATUS CLASS
  ===================================== */

  const getStatusClass = (
    status
  ) => {

    return String(
      status ||
      ""
    )
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );

  };


  /* =====================================
     STATUS ICON
  ===================================== */

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


  /* =====================================
     SELECT TRIP
  ===================================== */

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


  /* =====================================
     CLEAR FILTERS
  ===================================== */

  const clearAllFilters =
    () => {

      setSearchTerm(
        ""
      );


      setMovementFilter(
        "All"
      );


      setSelectedDate(
        ""
      );

    };


  /* =====================================
     RENDER
  ===================================== */

  return (

    <main
      className="tracking-page"
    >


      {/* =================================
          HEADER
      ================================= */}

      <header
        className="tracking-header"
      >

        <div
          className="tracking-header-content"
        />

      </header>


      {/* =================================
          API ERROR
      ================================= */}

      {apiError && (

        <div
          className="tracking-api-error"
        >

          {apiError}

        </div>

      )}


      {/* =================================
          TOOLBAR
      ================================= */}

      <section
        className="tracking-toolbar"
      >


        {/* ===============================
            SEARCH
        =============================== */}

        <div
          className="tracking-search"
        >

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
                setSearchTerm(
                  ""
                )
              }
              aria-label="Clear search"
            >

              <X
                size={15}
              />

            </button>

          )}

        </div>


        {/* ===============================
            STATUS FILTER
        =============================== */}

        <div
          className="tracking-status-filter"
        >

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


                  <small
                    className="tracking-status-count"
                  >

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


        {/* ===============================
            DATE FILTER
        =============================== */}

        <label
          className="tracking-date"
        >

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

                setSelectedDate(
                  ""
                );

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


      {/* =================================
          CONTENT
      ================================= */}

      {loading ? (

        <div
          className="tracking-loading-state"
        >

          Loading trips...

        </div>

      ) : filteredTrips.length ===
        0 ? (

        /* ===============================
           EMPTY
        =============================== */

        <div
          className="tracking-no-results"
        >


          <div
            className="tracking-no-results-icon"
          >

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

        /* ===============================
           TRACKING LAYOUT
        =============================== */

        <section
          className="tracking-layout"
        >


          {/* =============================
              TRIP LIST
          ============================= */}

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


          {/* =============================
              VEHICLES
          ============================= */}

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


          {/* =============================
              MAP
          ============================= */}

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