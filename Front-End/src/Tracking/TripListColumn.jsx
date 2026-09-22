import React from "react";
import {
  ChevronRight,
  MapPin,
  Truck,
} from "lucide-react";

import "./TripListColumn.css";

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const safeText = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
};

const getLatestTracking = (vehicle) => {
  const tracking = safeArray(vehicle?.dailyTracking);

  if (!tracking.length) {
    return null;
  }

  return tracking[tracking.length - 1];
};

const getVehicleStatus = (vehicle) => {
  const latest = getLatestTracking(vehicle);

  return (
    safeText(
      latest?.status || vehicle?.status,
      "Idle"
    ) || "Idle"
  );
};

const getTripStatus = (trip) => {
  const vehicles = safeArray(trip?.allocatedVehicles);

  if (!vehicles.length) {
    return "Idle";
  }

  const statuses = vehicles.map(getVehicleStatus);

  if (statuses.includes("Breakdown")) return "Breakdown";
  if (statuses.includes("Moving")) return "Moving";
  if (statuses.includes("Stopped")) return "Stopped";

  if (
    statuses.every(
      (status) => status === "Reached"
    )
  ) {
    return "Reached";
  }

  if (statuses.includes("Reached")) {
    return "Reached";
  }

  return "Idle";
};

const getStatusClass = (status) =>
  safeText(status, "Idle")
    .toLowerCase()
    .replaceAll(" ", "-");

const getTripKey = (trip, index) =>
  safeText(trip?._id) ||
  safeText(trip?.id) ||
  safeText(trip?.tripId) ||
  `trip-${index}`;

const isSameTrip = (trip, selectedTrip) => {
  if (!trip || !selectedTrip) {
    return false;
  }

  if (trip._id && selectedTrip._id) {
    return String(trip._id) === String(selectedTrip._id);
  }

  if (trip.id && selectedTrip.id) {
    return String(trip.id) === String(selectedTrip.id);
  }

  return (
    safeText(trip.tripId) ===
    safeText(selectedTrip.tripId)
  );
};

const TripListColumn = ({
  trips = [],
  selectedTrip = null,
  onSelectTrip,
}) => {
  const tripList = safeArray(trips);

  return (
    <aside className="trip-list-column">
      {/* HEADER */}
      <div className="trip-list-header">
        <div className="trip-list-header-content">
          <h3>Active Trips</h3>

          <span>
            {tripList.length}{" "}
            {tripList.length === 1
              ? "active trip"
              : "active trips"}
          </span>
        </div>

        <div className="trip-list-total">
          <Truck size={13} />
          <strong>{tripList.length}</strong>
        </div>
      </div>

      {/* TRIP LIST */}
      <div className="trip-list-scroll">
        {tripList.length === 0 ? (
          <div className="trip-list-empty">
            <Truck size={20} />

            <strong>No active trips</strong>

            <span>
              Active trips will appear here.
            </span>
          </div>
        ) : (
          tripList.map((trip, index) => {
            const active = isSameTrip(
              trip,
              selectedTrip
            );

            const vehicles = safeArray(
              trip?.allocatedVehicles
            );

            const tripStatus =
              getTripStatus(trip);

            const origin =
              safeText(trip?.origin, "-") || "-";

            const destination =
              safeText(
                trip?.destination,
                "-"
              ) || "-";

            return (
              <button
                type="button"
                key={getTripKey(trip, index)}
                className={`trip-list-item ${
                  active ? "active" : ""
                }`}
                onClick={() =>
                  onSelectTrip?.(trip)
                }
              >
                {/* TOP */}
                <div className="trip-list-item-top">
                  <div className="trip-list-trip-id">
                    <span className="trip-list-truck-icon">
                      <Truck size={13} />
                    </span>

                    <strong>
                      {safeText(
                        trip?.tripId,
                        `Trip ${index + 1}`
                      )}
                    </strong>
                  </div>

                  <span
                    className={`trip-list-status ${getStatusClass(
                      tripStatus
                    )}`}
                  >
                    <span className="trip-list-status-dot" />
                    {tripStatus}
                  </span>
                </div>

                {/* CUSTOMER */}
                <div className="trip-list-customer">
                  {safeText(
                    trip?.customer,
                    "Customer"
                  )}
                </div>

                {/* BOTTOM */}
                <div className="trip-list-bottom">
                  <div
                    className="trip-list-route"
                    title={`${origin} → ${destination}`}
                  >
                    <MapPin size={11} />

                    <span>{origin}</span>

                    <ChevronRight size={10} />

                    <span>{destination}</span>
                  </div>

                  <div className="trip-list-vehicle-count">
                    <Truck size={10} />

                    <span>
                      {vehicles.length}{" "}
                      {vehicles.length === 1
                        ? "Vehicle"
                        : "Vehicles"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default TripListColumn;