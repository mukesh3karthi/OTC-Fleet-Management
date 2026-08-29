import React from "react";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CirclePause,
  MapPin,
  Navigation,
  Truck,
} from "lucide-react";

import "../Tracking/TripListColumn.css";


/* =========================================
   VEHICLE STATUS COUNTS

   Same status matching rules as VehicleColumn:
   "Stopped" counts as a Breakdown.
========================================= */

const getStatusCounts = (vehicles) => {
  const list = Array.isArray(vehicles) ? vehicles : [];

  return {
    moving: list.filter((v) => v.status === "Moving").length,
    breakdown: list.filter(
      (v) => v.status === "Breakdown" || v.status === "Stopped"
    ).length,
    idle: list.filter((v) => v.status === "Idle").length,
    reached: list.filter((v) => v.status === "Reached").length,
  };
};


const TripListColumn = ({
  trips = [],
  selectedTrip,
  onSelectTrip,
}) => {
  return (
    <aside className="tracking-trip-panel">

      {/* ================================
          HEADER
      ================================= */}

      <div className="tracking-column-heading">

        <div>
          <h2>Trip List</h2>

          <p>
            {trips.length}{" "}
            {trips.length === 1
              ? "active trip"
              : "active trips"}
          </p>
        </div>


        <div className="tracking-column-heading-icon">
          <Truck size={16} />
        </div>

      </div>


      {/* ================================
          TRIP LIST
      ================================= */}

      <div className="tracking-trip-list">

        {trips.length > 0 ? (

          trips.map((trip) => {

            /* --------------------------
               TRIP KEY
            -------------------------- */

            const tripKey =
              trip.id ||
              trip.tripId ||
              String(
                trip._id?.$oid ||
                trip._id ||
                ""
              );

            const selectedTripKey =
              selectedTrip?.id ||
              selectedTrip?.tripId ||
              String(
                selectedTrip?._id?.$oid ||
                selectedTrip?._id ||
                ""
              );


            const active =
              selectedTripKey === tripKey;


            /* --------------------------
               VEHICLE COUNT
            -------------------------- */

            const vehicleCount =
              Array.isArray(trip.vehicles)
                ? trip.vehicles.length
                : 0;


            /* --------------------------
               STATUS COUNTS
            -------------------------- */

            const statusCounts =
              getStatusCounts(trip.vehicles);


            return (

              <button
                type="button"
                key={tripKey}
                className={`tracking-trip-card ${active ? "active" : ""
                  }`}
                onClick={() =>
                  onSelectTrip?.(trip)
                }
              >

                {/* =========================
                    CUSTOMER + MATERIAL
                    + VEHICLE COUNT
                ========================== */}

                <div className="trip-primary-row">

                  <div className="trip-primary-details">

                    <strong className="trip-customer-name">
                      {trip.customer || "-"}
                    </strong>


                    <span className="trip-primary-divider">
                      •
                    </span>


                    <strong className="trip-material-name">
                      {trip.materialType || "-"}
                    </strong>

                  </div>


                  {/* VEHICLE COUNT */}

                  <div
                    className="trip-card-vehicle-count"
                    title={`${vehicleCount} ${vehicleCount === 1
                        ? "vehicle"
                        : "vehicles"
                      }`}
                  >

                    <Truck size={11} />

                    <span>
                      {vehicleCount}
                    </span>

                  </div>

                </div>


                {/* =========================
                    VEHICLE STATUS STRIP
                ========================== */}

                <div className="trip-card-status-strip">

                  <div className="trip-card-status-item moving">
                    <Navigation size={11} />
                    <strong>{statusCounts.moving}</strong>
                    <span>Moving</span>
                  </div>

                  <div className="trip-card-status-item breakdown">
                    <AlertTriangle size={11} />
                    <strong>{statusCounts.breakdown}</strong>
                    <span>Breakdown</span>
                  </div>

                  <div className="trip-card-status-item idle">
                    <CirclePause size={11} />
                    <strong>{statusCounts.idle}</strong>
                    <span>Idle</span>
                  </div>

                  <div className="trip-card-status-item reached">
                    <CheckCircle2 size={11} />
                    <strong>{statusCounts.reached}</strong>
                    <span>Reached</span>
                  </div>

                </div>


                {/* =========================
                    ROUTE
                ========================== */}

                <div className="trip-route">

                  {/* ORIGIN */}

                  <div className="trip-route-location">

                    <MapPin size={12} />

                    <span>
                      {trip.origin || "-"}
                    </span>

                  </div>


                  <ChevronRight
                    size={12}
                    className="trip-route-arrow"
                  />


                  {/* DESTINATION */}

                  <div className="trip-route-location destination">

                    <span>
                      {trip.destination || "-"}
                    </span>

                  </div>


                  {/* OPEN */}

                  <span className="trip-open-icon">

                    <ChevronRight size={14} />

                  </span>

                </div>

              </button>

            );

          })

        ) : (

          /* ================================
             EMPTY STATE
          ================================= */

          <div className="tracking-column-empty">

            <div className="tracking-column-empty-icon">
              <Truck size={22} />
            </div>


            <strong>
              No Trips Found
            </strong>


            <p>
              Try changing your search,
              status or date filter.
            </p>

          </div>

        )}

      </div>

    </aside>
  );
};


export default TripListColumn;
