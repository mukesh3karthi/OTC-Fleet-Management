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

          <Truck
            size={18}
          />

        </div>

      </div>


      {/* =====================================
          TRIP LIST
      ===================================== */}

      <div className="tracking-trip-list">

        {trips.length > 0 ? (

          trips.map(
            (trip) => {

              const active =
                selectedTrip?.id ===
                trip.id;


              const vehicleCount =
                trip.vehicles?.length ||
                0;


              return (

                <button
                  type="button"
                  key={
                    trip.id
                  }
                  className={
                    `tracking-trip-card ${
                      active
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() =>
                    onSelectTrip?.(
                      trip
                    )
                  }
                >

                  {/* =================================
                      TOP
                  ================================= */}

                  <div className="trip-card-top">

                    <div className="trip-customer">

                      <span>
                        Customer
                      </span>

                      <strong>
                        {trip.customer ||
                          "-"}
                      </strong>

                    </div>


                    <div className="trip-vehicle-count">

                      <Truck
                        size={13}
                      />

                      <span>
                        {vehicleCount}
                      </span>

                    </div>

                  </div>


                  {/* =================================
                      MATERIAL
                  ================================= */}

                  <div className="trip-material">

                    <span>
                      Type of Material
                    </span>

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
                        size={14}
                      />

                      <span>
                        {trip.origin ||
                          "-"}
                      </span>

                    </div>


                    <ChevronRight
                      size={14}
                      className="trip-route-arrow"
                    />


                    <div className="trip-route-location destination">

                      <span>
                        {trip.destination ||
                          "-"}
                      </span>

                    </div>

                  </div>


                  {/* =================================
                      BOTTOM
                  ================================= */}

                  <div className="trip-card-bottom">

                    <span className="trip-id">
                      {trip.tripId ||
                        "-"}
                    </span>


                    <span className="trip-open-icon">

                      <ChevronRight
                        size={16}
                      />

                    </span>

                  </div>

                </button>

              );

            }
          )

        ) : (

          <div className="tracking-column-empty">

            <div className="tracking-column-empty-icon">

              <Truck
                size={24}
              />

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