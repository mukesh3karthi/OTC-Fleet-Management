import React from "react";
import {
  ChevronRight,
  MapPin,
  Truck,
  Package,
  UserRound,
} from "lucide-react";

import "./TripListColumn.css";

/* =========================================================
   SAFE HELPERS
========================================================= */

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const safeText = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
};

/* =========================================================
   LATEST TRACKING
========================================================= */

const getLatestTracking = (vehicle) => {
  const tracking = safeArray(vehicle?.dailyTracking);

  if (!tracking.length) {
    return null;
  }

  return tracking[tracking.length - 1];
};

/* =========================================================
   VEHICLE STATUS
========================================================= */

const getVehicleStatus = (vehicle) => {
  const latest = getLatestTracking(vehicle);

  const status = safeText(
    latest?.status || vehicle?.status,
    "Idle"
  )
    .trim()
    .toLowerCase();

  if (status === "moving") {
    return "Moving";
  }

  if (status === "breakdown") {
    return "Breakdown";
  }

  if (status === "reached") {
    return "Reached";
  }

  /* Stopped is counted under Idle */
  if (status === "stopped") {
    return "Idle";
  }

  return "Idle";
};

/* =========================================================
   VEHICLE STATUS COUNTS
========================================================= */

const getVehicleStatusCounts = (trip) => {
  const vehicles = safeArray(
    trip?.allocatedVehicles
  );

  const counts = {
    total: vehicles.length,
    Moving: 0,
    Idle: 0,
    Breakdown: 0,
    Reached: 0,
  };

  vehicles.forEach((vehicle) => {
    const status = getVehicleStatus(vehicle);

    if (
      Object.prototype.hasOwnProperty.call(
        counts,
        status
      )
    ) {
      counts[status] += 1;
    }
  });

  return counts;
};

/* =========================================================
   TRIP KEY
========================================================= */

const getTripKey = (trip, index) =>
  safeText(trip?._id) ||
  safeText(trip?.id) ||
  safeText(trip?.tripId) ||
  `trip-${index}`;

/* =========================================================
   SELECTED TRIP
========================================================= */

const isSameTrip = (
  trip,
  selectedTrip
) => {
  if (!trip || !selectedTrip) {
    return false;
  }

  if (trip._id && selectedTrip._id) {
    return (
      String(trip._id) ===
      String(selectedTrip._id)
    );
  }

  if (trip.id && selectedTrip.id) {
    return (
      String(trip.id) ===
      String(selectedTrip.id)
    );
  }

  return (
    safeText(trip.tripId) ===
    safeText(selectedTrip.tripId)
  );
};

/* =========================================================
   MATERIAL
========================================================= */

const getMaterial = (trip) => {
  return (
    safeText(trip?.material) ||
    safeText(trip?.materialType) ||
    safeText(trip?.materialName) ||
    "-"
  );
};

/* =========================================================
   COMPONENT
========================================================= */

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
          <Truck size={15} />

          <strong>
            {tripList.length}
          </strong>
        </div>

      </div>

      {/* TRIP LIST */}
      <div className="trip-list-scroll">

        {tripList.length === 0 ? (

          <div className="trip-list-empty">

            <Truck size={22} />

            <strong>
              No active trips
            </strong>

            <span>
              Active trips will appear here.
            </span>

          </div>

        ) : (

          tripList.map((trip, index) => {

            const active =
              isSameTrip(
                trip,
                selectedTrip
              );

            const vehicleStatusCounts =
              getVehicleStatusCounts(trip);

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

            const material =
              getMaterial(trip);

            const customer =
              safeText(
                trip?.customer,
                "Customer"
              );

            return (

              <button
                type="button"
                key={getTripKey(
                  trip,
                  index
                )}
                className={`trip-list-item ${
                  active ? "active" : ""
                }`}
                onClick={() =>
                  onSelectTrip?.(trip)
                }
              >

                {/* =============================================
                    TOP ROW
                    CUSTOMER + MATERIAL LEFT
                    ORDER ID RIGHT
                ============================================= */}

                <div className="trip-card-top">

                  <div className="trip-card-main-info">

                    {/* CUSTOMER */}
                    <div
                      className="trip-list-customer"
                      title={customer}
                    >
                      <span className="trip-customer-icon">
                        <UserRound size={12} />
                      </span>

                      <strong>
                        {customer}
                      </strong>
                    </div>

                    {/* SEPARATOR */}
                    <span
                      className="trip-info-separator"
                      aria-hidden="true"
                    />

                    {/* MATERIAL */}
                    <div
                      className="trip-list-material"
                      title={material}
                    >
                      <Package size={12} />

                      <span>
                        {material}
                      </span>
                    </div>

                  </div>

                  {/* ORDER ID */}
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

                </div>

                {/* =============================================
                    ROUTE
                ============================================= */}

                <div
                  className="trip-list-route"
                  title={`${origin} → ${destination}`}
                >

                  <MapPin size={12} />

                  <span>
                    {origin}
                  </span>

                  <ChevronRight size={11} />

                  <span>
                    {destination}
                  </span>

                </div>

                {/* =============================================
                    VEHICLE STATUS SUMMARY
                ============================================= */}

                <div className="trip-list-vehicle-summary">

                  {/* TOTAL */}
                  <div className="trip-vehicle-total">

                    <Truck size={11} />

                    <span>
                      Total
                    </span>

                    <strong>
                      {vehicleStatusCounts.total}
                    </strong>

                  </div>

                  {/* MOVING */}
                  <div className="trip-vehicle-stat moving">

                    <span className="trip-vehicle-dot" />

                    <span>
                      Moving
                    </span>

                    <strong>
                      {vehicleStatusCounts.Moving}
                    </strong>

                  </div>

                  {/* IDLE */}
                  <div className="trip-vehicle-stat idle">

                    <span className="trip-vehicle-dot" />

                    <span>
                      Idle
                    </span>

                    <strong>
                      {vehicleStatusCounts.Idle}
                    </strong>

                  </div>

                  {/* BREAKDOWN */}
                  <div className="trip-vehicle-stat breakdown">

                    <span className="trip-vehicle-dot" />

                    <span>
                      Breakdown
                    </span>

                    <strong>
                      {vehicleStatusCounts.Breakdown}
                    </strong>

                  </div>

                  {/* REACHED */}
                  <div className="trip-vehicle-stat reached">

                    <span className="trip-vehicle-dot" />

                    <span>
                      Reached
                    </span>

                    <strong>
                      {vehicleStatusCounts.Reached}
                    </strong>

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