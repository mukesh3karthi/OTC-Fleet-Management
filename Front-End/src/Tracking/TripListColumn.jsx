import React from "react";
import {
  ChevronRight,
  MapPin,
  Truck,
} from "lucide-react";

import "./TripListColumn.css";

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

/* =========================================
   LATEST DAILY TRACKING
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
   VEHICLE STATUS
========================================= */

const getVehicleStatus = (
  vehicle
) => {
  /*
   * Tracking.jsx already provides a derived
   * status for normalized allocatedVehicles.
   *
   * We still read dailyTracking directly here
   * so this component also works if a raw
   * TripOrder object is passed to it.
   */
  const latest =
    getLatestTracking(
      vehicle
    );

  return (
    safeText(
      latest?.status ||
        vehicle?.status,
      "Idle"
    ) || "Idle"
  );
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
    return "Idle";
  }

  const statuses =
    vehicles.map(
      getVehicleStatus
    );

  if (
    statuses.includes(
      "Breakdown"
    )
  ) {
    return "Breakdown";
  }

  if (
    statuses.includes(
      "Moving"
    )
  ) {
    return "Moving";
  }

  if (
    statuses.includes(
      "Stopped"
    )
  ) {
    return "Stopped";
  }

  if (
    statuses.every(
      (status) =>
        status === "Reached"
    )
  ) {
    return "Reached";
  }

  if (
    statuses.includes(
      "Reached"
    )
  ) {
    return "Reached";
  }

  return "Idle";
};

/* =========================================
   STATUS CLASS
========================================= */

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

/* =========================================
   TRIP ID
========================================= */

const getTripKey = (
  trip,
  index
) =>
  safeText(
    trip?._id
  ) ||
  safeText(
    trip?.id
  ) ||
  safeText(
    trip?.tripId
  ) ||
  `trip-${index}`;

/* =========================================
   IS SELECTED
========================================= */

const isSameTrip = (
  trip,
  selectedTrip
) => {
  if (
    !trip ||
    !selectedTrip
  ) {
    return false;
  }

  if (
    trip._id &&
    selectedTrip._id
  ) {
    return (
      String(trip._id) ===
      String(
        selectedTrip._id
      )
    );
  }

  if (
    trip.id &&
    selectedTrip.id
  ) {
    return (
      String(trip.id) ===
      String(
        selectedTrip.id
      )
    );
  }

  return (
    safeText(
      trip.tripId
    ) ===
    safeText(
      selectedTrip.tripId
    )
  );
};

/* =========================================
   COMPONENT
========================================= */

const TripListColumn = ({
  trips = [],
  selectedTrip = null,
  onSelectTrip,
}) => {
  const tripList =
    safeArray(trips);

  return (
    <aside className="trip-list-column">
      {/* HEADER */}

      <div className="trip-list-header">
        <div>
          <h3>
            Active Trips
          </h3>

          <span>
            {tripList.length}{" "}
            {tripList.length === 1
              ? "active trip"
              : "active trips"}
          </span>
        </div>
      </div>

      {/* LIST */}

      <div className="trip-list-scroll">
        {tripList.length ===
        0 ? (
          <div className="trip-list-empty">
            <Truck
              size={22}
            />

            <span>
              No trips available
            </span>
          </div>
        ) : (
          tripList.map(
            (
              trip,
              index
            ) => {
              const active =
                isSameTrip(
                  trip,
                  selectedTrip
                );

              const vehicles =
                safeArray(
                  trip
                    ?.allocatedVehicles
                );

              const tripStatus =
                getTripStatus(
                  trip
                );

              const origin =
                safeText(
                  trip?.origin,
                  "-"
                ) || "-";

              const destination =
                safeText(
                  trip?.destination,
                  "-"
                ) || "-";

              return (
                <button
                  type="button"
                  key={getTripKey(
                    trip,
                    index
                  )}
                  className={`trip-list-item ${
                    active
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    onSelectTrip?.(
                      trip
                    )
                  }
                >
                  {/* TOP */}

                  <div className="trip-list-item-top">
                    <div className="trip-list-trip-id">
                      <Truck
                        size={15}
                      />

                      <strong>
                        {safeText(
                          trip?.tripId,
                          `Trip ${
                            index +
                            1
                          }`
                        )}
                      </strong>
                    </div>

                    <ChevronRight
                      size={17}
                      className="trip-list-chevron"
                    />
                  </div>

                  {/* CUSTOMER */}

                  <div className="trip-list-customer">
                    {safeText(
                      trip?.customer,
                      "Customer"
                    )}
                  </div>

                  {/* ROUTE */}

                  <div className="trip-list-route">
                    <MapPin
                      size={13}
                    />

                    <span>
                      {origin}
                    </span>

                    <ChevronRight
                      size={12}
                    />

                    <span>
                      {destination}
                    </span>
                  </div>

                  {/* META */}

                  <div className="trip-list-meta">
                    <span className="trip-list-vehicle-count">
                      <Truck
                        size={12}
                      />

                      {
                        vehicles.length
                      }{" "}
                      {vehicles.length ===
                      1
                        ? "Vehicle"
                        : "Vehicles"}
                    </span>

                    <span
                      className={`trip-list-status ${getStatusClass(
                        tripStatus
                      )}`}
                    >
                      {tripStatus}
                    </span>
                  </div>
                </button>
              );
            }
          )
        )}
      </div>
    </aside>
  );
};

export default TripListColumn;