import React from "react";

import {
  ChevronRight,
  MapPin,
  Truck,
} from "lucide-react";

import "../Tracking/TripListColumn.css";


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
              trip._id ||
              trip.id ||
              trip.tripId;


            const selectedTripKey =
              selectedTrip?._id ||
              selectedTrip?.id ||
              selectedTrip?.tripId;


            const active =
              selectedTripKey === tripKey;


            /* --------------------------
               VEHICLE COUNT
            -------------------------- */

            const vehicleCount =
              Array.isArray(trip.vehicles)
                ? trip.vehicles.length
                : 0;


            return (

              <button
                type="button"
                key={tripKey}
                className={`tracking-trip-card ${
                  active ? "active" : ""
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
                    title={`${vehicleCount} ${
                      vehicleCount === 1
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