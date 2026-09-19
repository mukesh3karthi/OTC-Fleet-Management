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

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL =
  `${API_BASE_URL}/api/triporders`;

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
   HELPERS
========================================= */

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const safeText = (
  value,
  fallback = ""
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value);
};

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

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

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

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
};

const getResponseArray = (
  payload
) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    Array.isArray(
      payload?.data
    )
  ) {
    return payload.data;
  }

  if (
    Array.isArray(
      payload?.trips
    )
  ) {
    return payload.trips;
  }

  if (
    Array.isArray(
      payload?.orders
    )
  ) {
    return payload.orders;
  }

  return [];
};

/* =========================================
   LATEST TRACKING
========================================= */

const getLatestTracking = (
  allocation
) => {
  const history =
    safeArray(
      allocation?.dailyTracking
    );

  if (!history.length) {
    return null;
  }

  return history[
    history.length - 1
  ];
};

/* =========================================
   RESOLVE REQUIREMENT
========================================= */

const getRequirement = (
  trip,
  requirementId
) =>
  safeArray(
    trip?.vehicleRequirements
  ).find(
    (requirement) =>
      requirement.requirementId ===
      requirementId
  ) || null;

/* =========================================
   RESOLVE CONFIRMATION
========================================= */

const getConfirmation = (
  trip,
  allocation
) => {
  const confirmations =
    safeArray(
      trip?.vehicleConfirmations
    );

  if (
    allocation?.confirmationId
  ) {
    const direct =
      confirmations.find(
        (confirmation) =>
          confirmation.confirmationId ===
          allocation.confirmationId
      );

    if (direct) {
      return direct;
    }
  }

  return (
    confirmations.find(
      (confirmation) =>
        confirmation.requirementId ===
          allocation?.requirementId &&
        confirmation.status ===
          "Approved"
    ) || null
  );
};

/* =========================================
   RESOLVE QUOTATION
========================================= */

const getQuotation = (
  trip,
  allocation
) => {
  const confirmation =
    getConfirmation(
      trip,
      allocation
    );

  const quotationId =
    allocation?.quotationId ||
    confirmation?.quotationId;

  if (!quotationId) {
    return null;
  }

  return (
    safeArray(
      trip?.trafficQuotations
    ).find(
      (quotation) =>
        quotation.quotationId ===
        quotationId
    ) || null
  );
};

/* =========================================
   NORMALIZE ALLOCATION
========================================= */

const normalizeAllocation = (
  allocation = {},
  trip = {},
  index = 0
) => {
  const latest =
    getLatestTracking(
      allocation
    );

  const requirement =
    getRequirement(
      trip,
      allocation.requirementId
    );

  const quotation =
    getQuotation(
      trip,
      allocation
    );

  const allocationId =
    safeText(
      allocation.allocationId
    ) ||
    safeText(
      allocation._id
    ) ||
    `allocation-${index}`;

  return {
    ...allocation,

    id: allocationId,

    allocationId,

    requirementId:
      safeText(
        allocation.requirementId
      ),

    confirmationId:
      safeText(
        allocation.confirmationId
      ),

    quotationId:
      safeText(
        allocation.quotationId
      ),

    vehicleNumber:
      safeText(
        allocation.vehicleNumber
      ),

    /* Requirement information */

    vehicleType:
      safeText(
        requirement?.vehicleType
      ),

    configuration:
      safeText(
        requirement?.configuration
      ),

    classification:
      safeText(
        requirement?.classification
      ),

    /* Transporter
       Resolved only for child UI convenience.
       Amount is intentionally NOT exposed here.
    */

    transporter:
      safeText(
        quotation?.transporter
      ),

    /* Driver */

    driver:
      allocation.driver || {
        name: "",
        contactNumber: "",
      },

    driverName:
      safeText(
        allocation?.driver?.name
      ),

    driverNumber:
      safeText(
        allocation
          ?.driver
          ?.contactNumber
      ),

    /* Escort */

    escort:
      allocation.escort || {
        vehicleNumber: "",
        name: "",
        contactNumber: "",
      },

    escortVehicleNumber:
      safeText(
        allocation
          ?.escort
          ?.vehicleNumber
      ),

    escortName:
      safeText(
        allocation
          ?.escort
          ?.name
      ),

    escortContactNumber:
      safeText(
        allocation
          ?.escort
          ?.contactNumber
      ),

    /* Supervisor */

    supervisor:
      allocation.supervisor || {
        name: "",
        contactNumber: "",
      },

    supervisorName:
      safeText(
        allocation
          ?.supervisor
          ?.name
      ),

    supervisorContact:
      safeText(
        allocation
          ?.supervisor
          ?.contactNumber
      ),

    /* Loading */

    loading:
      allocation.loading || {},

    loadingStatus:
      safeText(
        allocation
          ?.loading
          ?.status,
        "Pending"
      ) || "Pending",

    loadingPointInDate:
      normalizeDate(
        allocation
          ?.loading
          ?.pointInDate
      ),

    loadingDate:
      normalizeDate(
        allocation
          ?.loading
          ?.loadingDate
      ),

    loadingPointOutDate:
      normalizeDate(
        allocation
          ?.loading
          ?.pointOutDate
      ),

    loadingHaltingDays:
      normalizeNumber(
        allocation
          ?.loading
          ?.haltingDays
      ),

    loadingRemarks:
      safeText(
        allocation
          ?.loading
          ?.remarks
      ),

    /* Unloading */

    unloading:
      allocation.unloading || {},

    unloadingStatus:
      safeText(
        allocation
          ?.unloading
          ?.status,
        "Pending"
      ) || "Pending",

    unloadingPointInDate:
      normalizeDate(
        allocation
          ?.unloading
          ?.pointInDate
      ),

    unloadingDate:
      normalizeDate(
        allocation
          ?.unloading
          ?.unloadingDate
      ),

    unloadingPointOutDate:
      normalizeDate(
        allocation
          ?.unloading
          ?.pointOutDate
      ),

    unloadingHaltingDays:
      normalizeNumber(
        allocation
          ?.unloading
          ?.haltingDays
      ),

    unloadingRemarks:
      safeText(
        allocation
          ?.unloading
          ?.remarks
      ),

    /* Latest movement derived from dailyTracking */

    dailyTracking:
      safeArray(
        allocation.dailyTracking
      ),

    latestTracking:
      latest,

    status:
      safeText(
        latest?.status,
        "Idle"
      ) || "Idle",

    currentLocation:
      safeText(
        latest?.currentLocation
      ),

    currentPosition:
      safeText(
        latest?.currentLocation
      ),

    yesterdayLocation:
      safeText(
        latest?.yesterdayLocation
      ),

    yesterdayPosition:
      safeText(
        latest?.yesterdayLocation
      ),

    yesterdayKm:
      normalizeNumber(
        latest?.yesterdayKm
      ),

    todayKm:
      normalizeNumber(
        latest?.todayKm
      ),

    runningKm:
      normalizeNumber(
        latest?.runningKm
      ),

    currentDay:
      normalizeNullableNumber(
        latest?.day
      ),

    latitude:
      normalizeNullableNumber(
        latest?.latitude
      ),

    longitude:
      normalizeNullableNumber(
        latest?.longitude
      ),

    speed:
      normalizeNumber(
        latest?.speed
      ),

    remarks:
      safeText(
        latest?.remarks
      ),

    updatedBy:
      safeText(
        latest?.updatedBy
      ),

    lastUpdated:
      normalizeDate(
        latest?.updatedAt ||
        latest?.date
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
  const id =
    safeText(trip._id) ||
    safeText(trip.tripId) ||
    `trip-${index}`;

  const allocations =
    safeArray(
      trip.allocatedVehicles
    ).map(
      (
        allocation,
        allocationIndex
      ) =>
        normalizeAllocation(
          allocation,
          trip,
          allocationIndex
        )
    );

  const placementDate =
    normalizeDate(
      trip.placementDate
    );

  const enquiryDate =
    normalizeDate(
      trip.enquiryDate
    );

  const createdAt =
    normalizeDate(
      trip.createdAt
    );

  const updatedAt =
    normalizeDate(
      trip.updatedAt
    );

  /*
   * Date used by the existing Tracking date filter.
   * Placement Date is the canonical operational date.
   * If not available, Enquiry/Created date is fallback.
   */
  const filterDateSource =
    placementDate ||
    enquiryDate ||
    createdAt;

  const tripDate =
    filterDateSource
      ? filterDateSource.slice(
          0,
          10
        )
      : "";

  return {
    ...trip,

    id,

    _id:
      safeText(
        trip._id
      ),

    tripId:
      safeText(
        trip.tripId
      ),

    movementType:
      safeText(
        trip.movementType
      ),

    customer:
      safeText(
        trip.customer
      ),

    contactPerson:
      safeText(
        trip.contactPerson
      ),

    contactNumber:
      safeText(
        trip.contactNumber
      ),

    email:
      safeText(
        trip.email
      ),

    assignedKam:
      safeText(
        trip.assignedKam
      ),

    materialType:
      safeText(
        trip.materialType
      ),

    origin:
      safeText(
        trip.origin
      ),

    destination:
      safeText(
        trip.destination
      ),

    distance:
      normalizeNumber(
        trip.distance
      ),

    routeLocations:
      safeArray(
        trip.routeLocations
      )
        .map(
          (location) =>
            safeText(
              location
            ).trim()
        )
        .filter(Boolean),

    remark:
      safeText(
        trip.remark
      ),

    siteLocation:
      safeText(
        trip.siteLocation
      ),

    period:
      safeText(
        trip.period
      ),

    dieselScope:
      safeText(
        trip.dieselScope
      ),

    status:
      safeText(
        trip.status,
        "Pending"
      ),

    stage:
      safeText(
        trip.stage
      ),

    orderApproval:
      trip.orderApproval || {},

    vehicleRequirements:
      safeArray(
        trip.vehicleRequirements
      ),

    trafficQuotations:
      safeArray(
        trip.trafficQuotations
      ),

    vehicleConfirmations:
      safeArray(
        trip.vehicleConfirmations
      ),

    allocatedVehicles:
      allocations,

    placementDate,
    enquiryDate,
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

  /* =====================================
     FETCH TRIPS
  ===================================== */

  const fetchTrips =
    useCallback(async () => {
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

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            result?.message ||
              `Unable to load trips (${response.status})`
          );
        }

        const databaseTrips =
          getResponseArray(
            result
          );

        /*
         * Tracking Page should contain
         * operational trips only.
         *
         * A trip becomes operational after
         * at least one actual vehicle has
         * been allocated in Tracking Input.
         */
        const normalizedTrips =
          databaseTrips
            .filter((trip) => {
              const stage =
                safeText(
                  trip?.stage
                )
                  .trim()
                  .toLowerCase();

              const orderPlacedStatus =
                safeText(
                  trip?.orderPlaced?.status
                )
                  .trim()
                  .toLowerCase();

              return (
                orderPlacedStatus === "completed" ||
                stage === "tracking" ||
                stage === "trip complete" ||
                stage === "trip completed" ||
                stage === "completed"
              );
            })
            .map(
              (
                trip,
                index
              ) =>
                normalizeTrip(
                  trip,
                  index
                )
            );

        setTrips(
          normalizedTrips
        );

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

        setSelectedTripId(
          null
        );

        setSelectedVehicleId(
          null
        );

        setApiError(
          error?.message ||
            "Unable to load trips."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* =====================================
     INITIAL LOAD
  ===================================== */

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  /* =====================================
     REFRESH WHEN WINDOW GETS FOCUS
  ===================================== */

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
  }, [fetchTrips]);

  /* =====================================
     STATUS COUNTS
  ===================================== */

  const statusCounts =
    useMemo(() => {
      const counts = {
        All: trips.length,
        Moving: 0,
        Idle: 0,
        Stopped: 0,
        Breakdown: 0,
        Reached: 0,
      };

      trips.forEach(
        (trip) => {
          const statuses =
            new Set(
              safeArray(
                trip.allocatedVehicles
              ).map(
                (vehicle) =>
                  vehicle.status ||
                  "Idle"
              )
            );

          [
            "Moving",
            "Idle",
            "Stopped",
            "Breakdown",
            "Reached",
          ].forEach(
            (status) => {
              if (
                statuses.has(
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
    }, [trips]);

  /* =====================================
     FILTER TRIPS
  ===================================== */

  const filteredTrips =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return trips.filter(
        (trip) => {
          const vehicles =
            safeArray(
              trip.allocatedVehicles
            );

          /* SEARCH */

          const searchFields = [
            trip.tripId,
            trip.customer,
            trip.contactPerson,
            trip.contactNumber,
            trip.email,
            trip.assignedKam,
            trip.materialType,
            trip.origin,
            trip.destination,
            trip.siteLocation,

            ...vehicles.map(
              (vehicle) =>
                vehicle.vehicleNumber
            ),

            ...vehicles.map(
              (vehicle) =>
                vehicle.vehicleType
            ),

            ...vehicles.map(
              (vehicle) =>
                vehicle.transporter
            ),

            ...vehicles.map(
              (vehicle) =>
                vehicle.driverName
            ),

            ...vehicles.map(
              (vehicle) =>
                vehicle.driverNumber
            ),

            ...vehicles.map(
              (vehicle) =>
                vehicle.escortName
            ),

            ...vehicles.map(
              (vehicle) =>
                vehicle.supervisorName
            ),

            ...vehicles.map(
              (vehicle) =>
                vehicle.currentLocation
            ),
          ];

          const matchesSearch =
            !search ||
            searchFields.some(
              (value) =>
                safeText(
                  value
                )
                  .toLowerCase()
                  .includes(
                    search
                  )
            );

          /* DATE */

          const matchesDate =
            !selectedDate ||
            trip.tripDate ===
              selectedDate ||
            vehicles.some(
              (vehicle) =>
                safeArray(
                  vehicle.dailyTracking
                ).some(
                  (tracking) => {
                    const date =
                      normalizeDate(
                        tracking.date
                      );

                    return (
                      date?.slice(
                        0,
                        10
                      ) ===
                      selectedDate
                    );
                  }
                )
            );

          /* STATUS */

          const matchesStatus =
            movementFilter ===
              "All" ||
            vehicles.some(
              (vehicle) =>
                (
                  vehicle.status ||
                  "Idle"
                ) ===
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

  /* =====================================
     SELECTED TRIP
  ===================================== */

  const selectedTrip =
    useMemo(
      () =>
        filteredTrips.find(
          (trip) =>
            trip.id ===
            selectedTripId
        ) ||
        filteredTrips[0] ||
        null,
      [
        filteredTrips,
        selectedTripId,
      ]
    );

  /* =====================================
     KEEP SELECTED TRIP VALID
  ===================================== */

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

  /* =====================================
     KEEP SELECTED VEHICLE VALID
  ===================================== */

  useEffect(() => {
    const vehicles =
      safeArray(
        selectedTrip
          ?.allocatedVehicles
      );

    if (
      !selectedTrip ||
      vehicles.length === 0
    ) {
      setSelectedVehicleId(
        null
      );

      return;
    }

    const vehicleExists =
      vehicles.some(
        (vehicle) =>
          vehicle.allocationId ===
            selectedVehicleId ||
          vehicle.id ===
            selectedVehicleId
      );

    if (!vehicleExists) {
      setSelectedVehicleId(
        vehicles[0]
          .allocationId ||
          vehicles[0].id
      );
    }
  }, [
    selectedTrip,
    selectedVehicleId,
  ]);

  /* =====================================
     SELECTED VEHICLE
  ===================================== */

  const selectedVehicle =
    useMemo(() => {
      const vehicles =
        safeArray(
          selectedTrip
            ?.allocatedVehicles
        );

      return (
        vehicles.find(
          (vehicle) =>
            vehicle.allocationId ===
              selectedVehicleId ||
            vehicle.id ===
              selectedVehicleId
        ) ||
        vehicles[0] ||
        null
      );
    }, [
      selectedTrip,
      selectedVehicleId,
    ]);

  /* =====================================
     STATUS CLASS
  ===================================== */

  const getStatusClass = (
    status
  ) =>
    safeText(
      status,
      "Idle"
    )
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );

  /* =====================================
     STATUS ICON
  ===================================== */

  const getStatusIcon = (
    status
  ) => {
    if (
      status === "Moving"
    ) {
      return (
        <Navigation
          size={13}
        />
      );
    }

    if (
      status === "Reached"
    ) {
      return (
        <CheckCircle2
          size={13}
        />
      );
    }

    if (
      status === "Idle"
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
    if (!trip) {
      return;
    }

    setSelectedTripId(
      trip.id
    );

    const vehicles =
      safeArray(
        trip.allocatedVehicles
      );

    if (vehicles.length) {
      setSelectedVehicleId(
        vehicles[0]
          .allocationId ||
          vehicles[0].id
      );
    } else {
      setSelectedVehicleId(
        null
      );
    }
  };

  /* =====================================
     SELECT VEHICLE
  ===================================== */

  const handleVehicleSelect = (
    vehicleOrId
  ) => {
    if (!vehicleOrId) {
      return;
    }

    if (
      typeof vehicleOrId ===
      "string"
    ) {
      setSelectedVehicleId(
        vehicleOrId
      );

      return;
    }

    setSelectedVehicleId(
      vehicleOrId.allocationId ||
        vehicleOrId.id ||
        null
    );
  };

  /* =====================================
     CLEAR FILTERS
  ===================================== */

  const clearAllFilters =
    () => {
      setSearchTerm("");
      setMovementFilter(
        "All"
      );
      setSelectedDate("");
    };

  /* =====================================
     RENDER
  ===================================== */

  return (
    <main className="tracking-page">
      {/* HEADER */}

      <header className="tracking-header">
        <div className="tracking-header-content" />
      </header>

      {/* API ERROR */}

      {apiError && (
        <div className="tracking-api-error">
          {apiError}
        </div>
      )}

      {/* TOOLBAR */}

      <section className="tracking-toolbar">
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

        {/* DATE FILTER */}

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
                event.target
                  .value
              )
            }
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

      {/* CONTENT */}

      {loading ? (
        <div className="tracking-loading-state">
          Loading trips...
        </div>
      ) : filteredTrips.length ===
        0 ? (
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
            {apiError
              ? "Unable to load tracking data from the server."
              : selectedDate
                ? `No trip records are available for ${selectedDate}.`
                : movementFilter ===
                    "Breakdown"
                  ? "There are currently no trips containing a vehicle with Breakdown status."
                  : trips.length ===
                      0
                    ? "No allocated vehicles are available in Tracking yet."
                    : "Try changing the status, search text or date filter."}
          </p>

          {(searchTerm ||
            selectedDate ||
            movementFilter !==
              "All") && (
            <button
              type="button"
              onClick={
                clearAllFilters
              }
            >
              Show All Trips
            </button>
          )}
        </div>
      ) : (
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
              handleVehicleSelect
            }
            getStatusClass={
              getStatusClass
            }
            getStatusIcon={
              getStatusIcon
            }
          />

          {/* MAP */}

          <TrackingMapColumn
            trip={
              selectedTrip
            }
            selectedVehicle={
              selectedVehicle
            }
            onSelectVehicle={
              handleVehicleSelect
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