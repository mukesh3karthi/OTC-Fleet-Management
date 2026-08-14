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

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="tracking-column-heading">

        <div>
          <h2>
            Trip List
          </h2>

          <p>
            {trips.length}{" "}
            {trips.length === 1
              ? "active trip"
              : "active trips"}
          </p>
        </div>


        <div className="tracking-column-heading-icon">
          <Truck size={17} />
        </div>

      </div>


      {/* =====================================
          TRIP LIST
      ===================================== */}

      <div className="tracking-trip-list">

        {trips.length > 0 ? (

          trips.map((trip) => {

            const tripKey =
              trip._id ||
              trip.id ||
              trip.tripId;


            const selectedTripKey =
              selectedTrip?._id ||
              selectedTrip?.id ||
              selectedTrip?.tripId;


            const active =
              selectedTripKey ===
              tripKey;


            const vehicleCount =
              Array.isArray(
                trip.vehicles
              )
                ? trip.vehicles.length
                : 0;


            return (
              <button
                type="button"
                key={tripKey}
                className={`tracking-trip-card ${
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

                {/* =================================
                    TOP ROW
                ================================= */}

                <div className="trip-compact-top">

                  {/* CUSTOMER NAME ONLY */}

                  <div className="trip-customer-info">

                    <strong>
                      {trip.customer ||
                        "-"}
                    </strong>

                  </div>


                  {/* VEHICLE COUNT */}

                  <div className="trip-vehicle-count">

                    <Truck
                      size={12}
                    />

                    <span>
                      {vehicleCount}
                    </span>

                  </div>

                </div>


                {/* =================================
                    MATERIAL NAME ONLY
                ================================= */}

                <div className="trip-material-info">

                  <strong>
                    {trip.materialType ||
                      "-"}
                  </strong>

                </div>


                {/* =================================
                    ROUTE
                ================================= */}

                <div className="trip-route">

                  <div className="trip-route-location">

                    <MapPin
                      size={13}
                    />

                    <span>
                      {trip.origin ||
                        "-"}
                    </span>

                  </div>


                  <ChevronRight
                    size={13}
                    className="trip-route-arrow"
                  />


                  <div className="trip-route-location destination">

                    <span>
                      {trip.destination ||
                        "-"}
                    </span>

                  </div>


                  <span className="trip-open-icon">

                    <ChevronRight
                      size={15}
                    />

                  </span>

                </div>

              </button>
            );

          })

        ) : (

          <div className="tracking-column-empty">

            <div className="tracking-column-empty-icon">
              <Truck size={24} />
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