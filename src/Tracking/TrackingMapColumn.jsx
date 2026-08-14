import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import {
  AlertCircle,
  Navigation,
  Truck,
} from "lucide-react";

import "leaflet/dist/leaflet.css";
import "./TrackingMapColumn.css";


/* =========================================
   DEFAULT LOCATIONS
========================================= */

const DEFAULT_ORIGIN = {
  lat: 12.9716,
  lng: 77.5946,
};

const DEFAULT_DESTINATION = {
  lat: 13.0827,
  lng: 80.2707,
};


/* =========================================
   SAFE COORDINATE PARSER
========================================= */

const parseCoordinates = (
  value,
  fallback
) => {

  if (!value) {
    return fallback;
  }


  /* Array: [lat, lng] */

  if (
    Array.isArray(value) &&
    value.length >= 2
  ) {

    const lat =
      Number(value[0]);

    const lng =
      Number(value[1]);


    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {

      return {
        lat,
        lng,
      };

    }

  }


  /* Object */

  if (
    typeof value === "object"
  ) {

    const lat =
      Number(
        value.lat ??
        value.latitude
      );

    const lng =
      Number(
        value.lng ??
        value.lon ??
        value.longitude
      );


    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {

      return {
        lat,
        lng,
      };

    }

  }


  return fallback;
};


/* =========================================
   VEHICLE STATUS CLASS
========================================= */

const getVehicleStatusClass = (
  status
) => {

  const value =
    String(status || "")
      .toLowerCase();


  if (
    value === "moving"
  ) {
    return "moving";
  }


  if (
    value === "idle"
  ) {
    return "idle";
  }


  if (
    value === "reached"
  ) {
    return "reached";
  }


  if (
    value === "stopped" ||
    value === "breakdown"
  ) {
    return "stopped";
  }


  return "default";
};


/* =========================================
   CUSTOM VEHICLE MARKER
========================================= */

const createVehicleIcon = (
  vehicle,
  selected = false
) => {

  const statusClass =
    getVehicleStatusClass(
      vehicle?.status
    );


  return L.divIcon({
    className:
      "vehicle-map-marker-wrapper",

    html: `
      <div
        class="
          vehicle-map-marker
          ${statusClass}
          ${selected ? "selected" : ""}
        "
      >
        <div class="vehicle-map-marker-icon">
          🚚
        </div>
      </div>
    `,

    iconSize: [38, 38],

    iconAnchor: [
      19,
      19,
    ],

    popupAnchor: [
      0,
      -20,
    ],
  });
};


/* =========================================
   ORIGIN MARKER
========================================= */

const originIcon =
  L.divIcon({
    className:
      "route-location-marker-wrapper",

    html: `
      <div class="
        route-location-marker
        origin
      ">
        <span></span>
      </div>
    `,

    iconSize: [24, 24],

    iconAnchor: [
      12,
      12,
    ],

    popupAnchor: [
      0,
      -14,
    ],
  });


/* =========================================
   DESTINATION MARKER
========================================= */

const destinationIcon =
  L.divIcon({
    className:
      "route-location-marker-wrapper",

    html: `
      <div class="
        route-location-marker
        destination
      ">
        <span></span>
      </div>
    `,

    iconSize: [24, 24],

    iconAnchor: [
      12,
      12,
    ],

    popupAnchor: [
      0,
      -14,
    ],
  });


/* =========================================
   AUTO FIT MAP
========================================= */

const FitMapBounds = ({
  origin,
  destination,
  vehicles,
  routeCoordinates,
}) => {

  const map =
    useMap();


  useEffect(() => {

    const points = [];


    if (origin) {

      points.push([
        origin.lat,
        origin.lng,
      ]);

    }


    if (destination) {

      points.push([
        destination.lat,
        destination.lng,
      ]);

    }


    vehicles.forEach(
      (vehicle) => {

        const lat =
          Number(vehicle.latitude);

        const lng =
          Number(vehicle.longitude);


        if (
          Number.isFinite(lat) &&
          Number.isFinite(lng)
        ) {

          points.push([
            lat,
            lng,
          ]);

        }

      }
    );


    if (
      routeCoordinates.length > 0
    ) {

      points.push(
        ...routeCoordinates
      );

    }


    if (
      points.length === 0
    ) {
      return;
    }


    if (
      points.length === 1
    ) {

      map.setView(
        points[0],
        10
      );

      return;
    }


    const bounds =
      L.latLngBounds(
        points
      );


    map.fitBounds(
      bounds,
      {
        padding: [
          45,
          45,
        ],

        maxZoom: 11,
      }
    );

  }, [
    map,
    origin,
    destination,
    vehicles,
    routeCoordinates,
  ]);


  return null;
};


/* =========================================
   SELECTED VEHICLE FOCUS
========================================= */

const SelectedVehicleFocus = ({
  selectedVehicle,
}) => {

  const map =
    useMap();


  useEffect(() => {

    if (!selectedVehicle) {
      return;
    }


    const lat =
      Number(
        selectedVehicle.latitude
      );

    const lng =
      Number(
        selectedVehicle.longitude
      );


    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return;
    }


    map.flyTo(
      [
        lat,
        lng,
      ],
      Math.max(
        map.getZoom(),
        10
      ),
      {
        duration: 0.8,
      }
    );

  }, [
    map,
    selectedVehicle,
  ]);


  return null;
};


/* =========================================
   MAIN COMPONENT
========================================= */

const TrackingMapColumn = ({
  trip,
  selectedVehicle,
  onSelectVehicle,
}) => {

  /* =========================================
     ROUTE STATES
  ========================================= */

  const [
    routeCoordinates,
    setRouteCoordinates,
  ] = useState([]);


  const [
    routeLoading,
    setRouteLoading,
  ] = useState(false);


  const [
    routeError,
    setRouteError,
  ] = useState("");


  /* =========================================
     VEHICLES
  ========================================= */

  const vehicles =
    useMemo(
      () =>
        Array.isArray(
          trip?.vehicles
        )
          ? trip.vehicles
          : [],
      [
        trip?.vehicles,
      ]
    );


  /* =========================================
     ORIGIN
  ========================================= */

  const origin =
    useMemo(
      () =>
        parseCoordinates(
          trip?.originCoordinates,
          DEFAULT_ORIGIN
        ),
      [
        trip?.originCoordinates,
      ]
    );


  /* =========================================
     DESTINATION
  ========================================= */

  const destination =
    useMemo(
      () =>
        parseCoordinates(
          trip?.destinationCoordinates,
          DEFAULT_DESTINATION
        ),
      [
        trip?.destinationCoordinates,
      ]
    );


  /* =========================================
     FETCH ROAD ROUTE FROM OSRM
  ========================================= */

  useEffect(() => {

    let active = true;


    const getRoute =
      async () => {

        if (
          !origin ||
          !destination
        ) {
          return;
        }


        try {

          setRouteLoading(true);

          setRouteError("");


          /*
            IMPORTANT:

            OSRM uses:
            longitude,latitude

            NOT:
            latitude,longitude
          */

          const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${origin.lng},${origin.lat};` +
            `${destination.lng},${destination.lat}` +
            `?overview=full&geometries=geojson`;


          const response =
            await fetch(url);


          if (!response.ok) {

            throw new Error(
              "Unable to load road route."
            );

          }


          const data =
            await response.json();


          if (!active) {
            return;
          }


          if (
            data.code !== "Ok" ||
            !data.routes?.length
          ) {

            throw new Error(
              "Route is not available."
            );

          }


          const coordinates =
            data.routes[0]
              .geometry
              .coordinates
              .map(
                ([lng, lat]) => [
                  lat,
                  lng,
                ]
              );


          setRouteCoordinates(
            coordinates
          );


        } catch (error) {

          console.error(
            "OSRM route error:",
            error
          );


          if (!active) {
            return;
          }


          /*
            Map will continue working
            even if OSRM route fails.
          */

          setRouteCoordinates([]);

          setRouteError(
            error?.message ||
            "Route could not be loaded."
          );


        } finally {

          if (active) {

            setRouteLoading(
              false
            );

          }

        }

      };


    getRoute();


    return () => {

      active = false;

    };

  }, [
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng,
  ]);


  /* =========================================
     EMPTY TRIP
  ========================================= */

  if (!trip) {

    return (
      <section className="tracking-map-column">

        <div className="tracking-map-empty">

          <Navigation size={30} />

          <strong>
            No Trip Selected
          </strong>

          <span>
            Select a trip to view
            vehicle location and route.
          </span>

        </div>

      </section>
    );

  }


  /* =========================================
     RENDER
  ========================================= */

  return (
    <section className="tracking-map-column">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="tracking-map-header">

        <div>

          <strong>
            Vehicle Map
          </strong>

          <p>
            Live vehicle route and location
          </p>

        </div>


        <Navigation
          size={20}
        />

      </div>


      {/* =====================================
          ROUTE SUMMARY
      ===================================== */}

      <div className="map-route-summary">

        {/* ORIGIN */}

        <div className="map-route-place">

          <span>
            Origin
          </span>

          <strong>
            {trip.origin ||
              "Bangalore"}
          </strong>

        </div>


        {/* CONNECTOR */}

        <div className="map-route-line">

          <span />

          <div>
            <Navigation
              size={14}
            />
          </div>

          <span />

        </div>


        {/* DESTINATION */}

        <div className="map-route-place destination">

          <span>
            Destination
          </span>

          <strong>
            {trip.destination ||
              "Chennai"}
          </strong>

        </div>

      </div>


      {/* =====================================
          MAP
      ===================================== */}

      <div className="tracking-map-wrapper">

        <MapContainer
          center={[
            origin.lat,
            origin.lng,
          ]}
          zoom={7}
          scrollWheelZoom
          className="tracking-leaflet-map"
        >

          {/* OPENSTREETMAP */}

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          {/* AUTO FIT */}

          <FitMapBounds
            origin={origin}
            destination={
              destination
            }
            vehicles={vehicles}
            routeCoordinates={
              routeCoordinates
            }
          />


          {/* SELECTED VEHICLE */}

          <SelectedVehicleFocus
            selectedVehicle={
              selectedVehicle
            }
          />


          {/* =====================================
              ROAD ROUTE
          ===================================== */}

          {routeCoordinates.length >
            0 && (

              <Polyline
                positions={
                  routeCoordinates
                }
                pathOptions={{
                  color:
                    "#2f66c7",

                  weight: 5,

                  opacity: 0.9,
                }}
              />

            )}


          {/* =====================================
              FALLBACK STRAIGHT LINE
          ===================================== */}

          {routeCoordinates.length ===
            0 &&
            !routeLoading && (

              <Polyline
                positions={[
                  [
                    origin.lat,
                    origin.lng,
                  ],

                  [
                    destination.lat,
                    destination.lng,
                  ],
                ]}
                pathOptions={{
                  color:
                    "#8ba9d8",

                  weight: 3,

                  opacity: 0.7,

                  dashArray:
                    "7 7",
                }}
              />

            )}


          {/* =====================================
              ORIGIN MARKER
          ===================================== */}

          <Marker
            position={[
              origin.lat,
              origin.lng,
            ]}
            icon={originIcon}
          >

            <Popup>

              <div className="map-popup">

                <strong>
                  {trip.origin ||
                    "Bangalore"}
                </strong>

                <span>
                  Origin
                </span>

              </div>

            </Popup>

          </Marker>


          {/* =====================================
              DESTINATION MARKER
          ===================================== */}

          <Marker
            position={[
              destination.lat,
              destination.lng,
            ]}
            icon={
              destinationIcon
            }
          >

            <Popup>

              <div className="map-popup">

                <strong>
                  {trip.destination ||
                    "Chennai"}
                </strong>

                <span>
                  Destination
                </span>

              </div>

            </Popup>

          </Marker>


          {/* =====================================
              VEHICLES
          ===================================== */}

          {vehicles.map(
            (vehicle) => {

              const latitude =
                Number(
                  vehicle.latitude
                );

              const longitude =
                Number(
                  vehicle.longitude
                );


              if (
                !Number.isFinite(
                  latitude
                ) ||
                !Number.isFinite(
                  longitude
                )
              ) {

                return null;

              }


              const selected =
                selectedVehicle?.id ===
                vehicle.id;


              return (
                <Marker
                  key={
                    vehicle.id ??
                    vehicle.vehicleNumber
                  }
                  position={[
                    latitude,
                    longitude,
                  ]}
                  icon={createVehicleIcon(
                    vehicle,
                    selected
                  )}
                  eventHandlers={{
                    click: () => {

                      onSelectVehicle?.(
                        vehicle.id
                      );

                    },
                  }}
                >

                  <Popup>

                    <div className="map-popup vehicle-popup">

                      <div className="vehicle-popup-heading">

                        <span className="vehicle-popup-icon">
                          <Truck
                            size={13}
                          />
                        </span>

                        <strong>
                          {vehicle.vehicleNumber ||
                            "-"}
                        </strong>

                      </div>


                      <span className="vehicle-popup-location">

                        {vehicle.currentLocation ||
                          "Location unavailable"}

                      </span>


                      <div className="vehicle-popup-bottom">

                        <span
                          className={`vehicle-popup-status ${getVehicleStatusClass(
                            vehicle.status
                          )}`}
                        >

                          {vehicle.status ||
                            "Unknown"}

                        </span>


                        <small>

                          {vehicle.speed ??
                            0}

                          {" km/h"}

                        </small>

                      </div>

                    </div>

                  </Popup>

                </Marker>
              );

            }
          )}

        </MapContainer>


        {/* =====================================
            ROUTE LOADING
        ===================================== */}

        {routeLoading && (

          <div className="route-loading-badge">

            <span className="route-loading-spinner" />

            Loading route...

          </div>

        )}


        {/* =====================================
            ROUTE ERROR
        ===================================== */}

        {routeError && (

          <div className="route-error-badge">

            <AlertCircle
              size={13}
            />

            <span>
              Road route unavailable
            </span>

          </div>

        )}

      </div>


      {/* =====================================
          SELECTED VEHICLE
      ===================================== */}

      {selectedVehicle && (

        <div className="map-selected-info">

          <span className="map-selected-label">
            Selected Vehicle
          </span>


          <strong>
            {selectedVehicle
              .vehicleNumber ||
              "-"}
          </strong>


          <span className="map-selected-location">

            {selectedVehicle
              .currentLocation ||
              "-"}

          </span>


          <small>

            {selectedVehicle
              .status ||
              "-"}

            {" · "}

            {selectedVehicle
              .speed ??
              0}

            {" km/h"}

          </small>

        </div>

      )}


      {/* =====================================
          LEGEND
      ===================================== */}

      <div className="tracking-map-legend">

        <span>
          <i className="moving" />
          Moving
        </span>

        <span>
          <i className="idle" />
          Idle
        </span>

        <span>
          <i className="stopped" />
          Stopped
        </span>

        <span>
          <i className="reached" />
          Reached
        </span>

      </div>

    </section>
  );
};


export default TrackingMapColumn;