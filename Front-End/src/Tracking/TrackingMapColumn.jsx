import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Truck,
} from "lucide-react";

import "./TrackingMapColumn.css";


/* =========================================
   SVG CONFIG
========================================= */

const ROUTE_VIEWBOX_WIDTH = 420;
const ROUTE_VIEWBOX_HEIGHT = 650;


/*
  Route starts from BOTTOM
  and moves towards TOP.

  Origin       = bottom
  Destination  = top
*/

const ROUTE_PATH = `
  M 92 610

  C 115 570,
    135 535,
    125 490

  C 112 440,
    155 420,
    165 375

  C 177 325,
    115 300,
    135 245

  C 155 190,
    230 205,
    255 155

  C 282 105,
    272 70,
    250 38
`;


/* =========================================
   NORMALIZE TEXT
========================================= */

const normalizeText = (
  value
) =>
  String(
    value || ""
  )
    .trim()
    .toLowerCase();


/* =========================================
   UNIQUE STRINGS
========================================= */

const uniqueStrings = (
  values
) => {
  const seen =
    new Set();

  return values.filter(
    (value) => {
      const clean =
        String(
          value || ""
        ).trim();

      if (!clean) {
        return false;
      }

      const key =
        clean.toLowerCase();

      if (
        seen.has(
          key
        )
      ) {
        return false;
      }

      seen.add(
        key
      );

      return true;
    }
  );
};


/* =========================================
   GET ROUTE STOP NAME
========================================= */

const getStopName = (
  stop
) => {
  if (
    typeof stop ===
    "string"
  ) {
    return stop;
  }

  if (
    stop &&
    typeof stop ===
    "object"
  ) {
    return (
      stop.name ||
      stop.location ||
      stop.city ||
      stop.place ||
      stop.label ||
      ""
    );
  }

  return "";
};


/* =========================================
   VEHICLE IDENTIFIER
========================================= */

const getVehicleIdentifier = (
  vehicle
) =>
  vehicle?._id ||
  vehicle?.id ||
  vehicle?.vehicleSubId ||
  vehicle?.vehicleNumber ||
  "";


/* =========================================
   STATUS CLASS
========================================= */

const getStatusClass = (
  status
) => {
  const value =
    normalizeText(
      status
    );

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
    value === "breakdown" ||
    value === "stopped"
  ) {
    return "stopped";
  }

  return "default";
};


/* =========================================
   COMPONENT
========================================= */

const TrackingMapColumn = ({
  trip,
  selectedVehicle,
}) => {
  const routePathRef =
    useRef(null);


  /* =========================================
     STATE
  ========================================= */

  const [
    stopPoints,
    setStopPoints,
  ] = useState([]);


  const [
    vehiclePoint,
    setVehiclePoint,
  ] = useState({
    x: 0,
    y: 0,
  });


  const [
    totalPathLength,
    setTotalPathLength,
  ] = useState(1);


  /* =========================================
     VEHICLES
  ========================================= */

  const vehicles =
    useMemo(
      () => {
        if (
          !Array.isArray(
            trip?.vehicles
          )
        ) {
          return [];
        }

        return trip.vehicles;
      },
      [
        trip?.vehicles,
      ]
    );


  /* =========================================
     ACTIVE VEHICLE
  ========================================= */

const activeVehicle = useMemo(() => {
  if (!vehicles.length) {
    return null;
  }

  if (!selectedVehicle) {
    return vehicles[0];
  }

  /*
    Always try to get the newest vehicle
    object from trip.vehicles.

    This keeps the selected vehicle synced with
    the latest vehicle object in the trip.
  */

  const selectedId =
    typeof selectedVehicle === "object"
      ? String(
          getVehicleIdentifier(
            selectedVehicle
          )
        )
      : String(selectedVehicle);

  const matchedVehicle =
    vehicles.find(
      (vehicle) =>
        String(
          getVehicleIdentifier(
            vehicle
          )
        ) === selectedId
    );

  return (
    matchedVehicle ||
    (
      typeof selectedVehicle === "object"
        ? selectedVehicle
        : vehicles[0]
    )
  );
}, [
  selectedVehicle,
  vehicles,
]);

  /* =========================================
   ROUTE STOPS
========================================= */

const routeStops = useMemo(() => {
  if (!trip) {
    return [];
  }

  const origin =
    String(
      trip.origin || ""
    ).trim();

  const destination =
    String(
      trip.destination || ""
    ).trim();

  const rawTripLocations =
    trip.routeLocations ||
    trip.routeStops ||
    trip.checkpoints ||
    trip.waypoints ||
    trip.routePoints ||
    trip.stops ||
    [];

  let intermediateLocations = [];

  if (
    Array.isArray(
      rawTripLocations
    )
  ) {
    intermediateLocations =
      rawTripLocations
        .map((location) =>
          String(
            getStopName(location) || ""
          ).trim()
        )
        .filter(Boolean);
  }

  intermediateLocations =
    uniqueStrings(
      intermediateLocations
    );

  intermediateLocations =
    intermediateLocations.filter(
      (location) => {
        const normalized =
          normalizeText(location);

        return (
          normalized !==
            normalizeText(origin) &&
          normalized !==
            normalizeText(destination)
        );
      }
    );

  const stops = [];

  if (origin) {
    stops.push(origin);
  }

  stops.push(
    ...intermediateLocations
  );

  if (destination) {
    stops.push(destination);
  }

  if (stops.length === 0) {
    return [
      "Origin",
      "Destination",
    ];
  }

  if (stops.length === 1) {
    stops.push(
      destination ||
      "Destination"
    );
  }

  return stops;

}, [
  trip,
]);


  /* =========================================
     VEHICLE PROGRESS
  ========================================= */

  const vehicleProgress =
    useMemo(
      () => {
        if (
          !activeVehicle ||
          routeStops.length < 2
        ) {
          return 0;
        }


        /* =====================================
           REACHED
        ===================================== */

        if (
          normalizeText(
            activeVehicle.status
          ) === "reached"
        ) {
          return 1;
        }


        const currentPosition =
          normalizeText(
            activeVehicle
              ?.currentPosition ||
            activeVehicle
              ?.currentLocation
          );


        /* =====================================
           EXACT LOCATION MATCH
        ===================================== */

        if (
          currentPosition
        ) {
          const currentIndex =
            routeStops.findIndex(
              (stop) =>
                normalizeText(
                  stop
                ) ===
                currentPosition
            );


          if (
            currentIndex >= 0
          ) {
            return (
              currentIndex /
              Math.max(
                routeStops.length -
                  1,
                1
              )
            );
          }
        }


        /* =====================================
           RUNNING KM
        ===================================== */

        const totalKm =
          Number(
            trip?.totalKm ??
            trip?.totalDistance
          );


        const runningKm =
          Number(
            activeVehicle
              ?.runningKm ??
            activeVehicle
              ?.kmCovered
          );


        if (
          Number.isFinite(
            totalKm
          ) &&
          totalKm > 0 &&
          Number.isFinite(
            runningKm
          )
        ) {
          return Math.min(
            Math.max(
              runningKm /
                totalKm,
              0
            ),
            1
          );
        }


        /* =====================================
           CURRENT DAY
        ===================================== */

        const currentDay =
          Number(
            activeVehicle
              ?.currentDay
          );


        const transitDays =
          Number(
            trip
              ?.estimatedTransitDays ??
            trip
              ?.transitDays
          );


        if (
          Number.isFinite(
            currentDay
          ) &&
          Number.isFinite(
            transitDays
          ) &&
          transitDays > 0
        ) {
          return Math.min(
            Math.max(
              currentDay /
                transitDays,
              0
            ),
            1
          );
        }


        return 0;
      },
      [
        activeVehicle,
        routeStops,
        trip,
      ]
    );


  /* =========================================
     CALCULATE SVG POSITIONS
  ========================================= */

  useEffect(
    () => {
      const path =
        routePathRef.current;


      if (!path) {
        return;
      }


      const length =
        path.getTotalLength();


      setTotalPathLength(
        length
      );


      /* =====================================
         ROUTE STOPS
      ===================================== */

      const points =
        routeStops.map(
          (
            stop,
            index
          ) => {
            const percentage =
              routeStops.length <=
                1
                ? 0
                : index /
                  (
                    routeStops.length -
                    1
                  );


            const point =
              path.getPointAtLength(
                length *
                  percentage
              );


            return {
              name:
                stop,

              x:
                point.x,

              y:
                point.y,

              percentage,
            };
          }
        );


      setStopPoints(
        points
      );


      /* =====================================
         VEHICLE POSITION
      ===================================== */

      const safeProgress =
        Math.min(
          Math.max(
            vehicleProgress,
            0
          ),
          1
        );


      const currentPoint =
        path.getPointAtLength(
          length *
            safeProgress
        );


      setVehiclePoint({
        x:
          currentPoint.x,

        y:
          currentPoint.y,
      });
    },
    [
      routeStops,
      vehicleProgress,
    ]
  );


  /* =========================================
     EMPTY
  ========================================= */

  if (!trip) {
    return (
      <section className="journey-column">

        <div className="journey-empty">

          <Truck
            size={26}
          />

          <strong>
            No Trip Selected
          </strong>

          <span>
            Select a trip to view
            vehicle progress.
          </span>

        </div>

      </section>
    );
  }


  /* =========================================
     VEHICLE VALUES
  ========================================= */

  const status =
    activeVehicle
      ?.status ||
    "Unknown";


  const statusClass =
    getStatusClass(
      status
    );


  const vehicleNumber =
    activeVehicle
      ?.vehicleNumber ||
    "-";


  const currentPosition =
    activeVehicle
      ?.currentPosition ||
    activeVehicle
      ?.currentLocation ||
    "-";


  /* =========================================
     ROUTE PROGRESS
  ========================================= */

  const completedLength =
    Math.max(
      totalPathLength *
        vehicleProgress,
      0
    );


  const remainingLength =
    Math.max(
      totalPathLength -
        completedLength,
      0
    );


  /* =========================================
     RENDER
  ========================================= */

  return (
    <section className="journey-column">

      {/* =====================================
          VEHICLE HEADER
      ===================================== */}

      <div className="journey-vehicle-summary">

        <div className="journey-vehicle-main">

          <span
            className={`journey-vehicle-icon ${statusClass}`}
          >
            <Truck
              size={14}
            />
          </span>


          <div>

            <span>
              Vehicle
            </span>

            <strong>
              {vehicleNumber}
            </strong>

            <small className="journey-route-stop-count">
              {Math.max(routeStops.length - 2, 0)}
              {" "}
              added location
              {Math.max(routeStops.length - 2, 0) === 1
                ? ""
                : "s"}
            </small>

          </div>

        </div>


        <span
          className={`journey-status ${statusClass}`}
        >
          <span />

          {status}
        </span>

      </div>


      {/* =====================================
          FULL HEIGHT ROUTE
      ===================================== */}

      <div className="journey-route-wrapper">

        <svg
          className="journey-route-svg"
          viewBox={`0 0 ${ROUTE_VIEWBOX_WIDTH} ${ROUTE_VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >

          {/* =================================
              UPCOMING ROUTE
          ================================= */}

          <path
            ref={
              routePathRef
            }
            d={
              ROUTE_PATH
            }
            className="journey-path-base"
          />


          {/* =================================
              COVERED ROUTE
          ================================= */}

          <path
            d={
              ROUTE_PATH
            }
            className="journey-path-progress"
            style={{
              strokeDasharray:
                `${completedLength} ${remainingLength}`,
            }}
          />


          {/* =================================
              ROUTE STOPS
          ================================= */}

          {stopPoints.map(
            (
              stop,
              index
            ) => {
              const completed =
                stop.percentage <=
                vehicleProgress;


              const isOrigin =
                index === 0;


              const isDestination =
                index ===
                stopPoints.length -
                  1;


              /*
                Alternate labels.
              */

              const labelRight =
                index % 2 !== 0;


              return (
                <g
                  key={`${stop.name}-${index}`}
                  className={`journey-stop ${
                    completed
                      ? "completed"
                      : ""
                  }`}
                >

                  {/* OUTER DOT */}

                  <circle
                    cx={
                      stop.x
                    }
                    cy={
                      stop.y
                    }
                    r={
                      isOrigin ||
                      isDestination
                        ? 7
                        : 5.5
                    }
                    className="journey-stop-outer"
                  />


                  {/* INNER DOT */}

                  <circle
                    cx={
                      stop.x
                    }
                    cy={
                      stop.y
                    }
                    r={
                      isOrigin ||
                      isDestination
                        ? 3
                        : 2.5
                    }
                    className="journey-stop-inner"
                  />


                  {/* LOCATION */}

                  <text
                    x={
                      labelRight
                        ? stop.x + 18
                        : stop.x - 18
                    }
                    y={
                      stop.y + 4
                    }
                    textAnchor={
                      labelRight
                        ? "start"
                        : "end"
                    }
                    className="journey-stop-name"
                  >
                    {stop.name}
                  </text>


                  {/* ORIGIN */}

                  {isOrigin && (

                    <text
                      x={
                        labelRight
                          ? stop.x + 18
                          : stop.x - 18
                      }
                      y={
                        stop.y + 17
                      }
                      textAnchor={
                        labelRight
                          ? "start"
                          : "end"
                      }
                      className="journey-stop-type"
                    >
                      Start
                    </text>

                  )}


                  {/* DESTINATION */}

                  {isDestination && (

                    <text
                      x={
                        labelRight
                          ? stop.x + 18
                          : stop.x - 18
                      }
                      y={
                        stop.y + 17
                      }
                      textAnchor={
                        labelRight
                          ? "start"
                          : "end"
                      }
                      className="journey-stop-type"
                    >
                      Destination
                    </text>

                  )}

                </g>
              );
            }
          )}


          {/* =================================
              VEHICLE
          ================================= */}

          {activeVehicle && (

            <g
              className="journey-vehicle-marker"
              transform={`translate(
                ${vehiclePoint.x},
                ${vehiclePoint.y}
              )`}
            >

              <circle
                cx="0"
                cy="0"
                r="19"
                className={`journey-vehicle-marker-ring ${statusClass}`}
              />


              <circle
                cx="0"
                cy="0"
                r="14"
                className={`journey-vehicle-marker-circle ${statusClass}`}
              />


              <foreignObject
                x="-10"
                y="-10"
                width="20"
                height="20"
              >

                <div className="journey-svg-truck">
                  🚚
                </div>

              </foreignObject>

            </g>

          )}

        </svg>


        {/* =====================================
            VEHICLE DETAILS CARD
        ===================================== */}

        {activeVehicle && (

          <div
            className="journey-current-card"
            style={{
              left:
                `${(
                  vehiclePoint.x /
                  ROUTE_VIEWBOX_WIDTH
                ) * 100}%`,

              top:
                `${(
                  vehiclePoint.y /
                  ROUTE_VIEWBOX_HEIGHT
                ) * 100}%`,
            }}
          >

            <div className="journey-current-card-title">

              <span>
                <Truck
                  size={11}
                />
              </span>


              <strong>
                {vehicleNumber}
              </strong>

            </div>


            <p>
              {currentPosition}
            </p>


            <small
              className={
                statusClass
              }
            >
              <i />

              {status}
            </small>

          </div>

        )}

      </div>

    </section>
  );
};


export default TrackingMapColumn;