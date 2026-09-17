import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Truck } from "lucide-react";

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
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (
    typeof value === "object"
  ) {
    if (value.$oid) {
      return String(value.$oid);
    }

    if (value.$date) {
      return String(value.$date);
    }

    return fallback;
  }

  return String(value);
};

const normalizeText = (value) =>
  safeText(value, "")
    .trim()
    .toLowerCase();

/* =========================================
   UNIQUE STRINGS
========================================= */

const uniqueStrings = (values) => {
  const seen = new Set();

  return values.filter((value) => {
    const clean = safeText(
      value,
      ""
    ).trim();

    if (!clean) {
      return false;
    }

    const key =
      clean.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
};

/* =========================================
   ROUTE STOP NAME
========================================= */

const getStopName = (stop) => {
  /*
    Canonical routeLocations[]
    contains strings.
  */

  if (
    typeof stop === "string"
  ) {
    return stop;
  }

  return "";
};

/* =========================================
   VEHICLE IDENTIFIER
========================================= */

const getVehicleIdentifier = (
  vehicle
) => {
  if (!vehicle) {
    return "";
  }

  return (
    safeText(
      vehicle.allocationId,
      ""
    ) ||
    safeText(
      vehicle._id,
      ""
    ) ||
    safeText(
      vehicle.vehicleNumber,
      ""
    )
  );
};

/* =========================================
   LATEST DAILY TRACKING
========================================= */

const getLatestTracking = (
  vehicle
) => {
  const dailyTracking =
    safeArray(
      vehicle?.dailyTracking
    );

  if (!dailyTracking.length) {
    return null;
  }

  return dailyTracking[
    dailyTracking.length - 1
  ];
};

/* =========================================
   STATUS
========================================= */

const getVehicleStatus = (
  vehicle
) => {
  const latestTracking =
    getLatestTracking(vehicle);

  return safeText(
    latestTracking?.status,
    "Idle"
  );
};

const getStatusClass = (
  status
) => {
  const value =
    normalizeText(status);

  if (value === "moving") {
    return "moving";
  }

  if (value === "idle") {
    return "idle";
  }

  if (value === "reached") {
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

  /* =====================================
     ALLOCATED VEHICLES
  ===================================== */

  const vehicles = useMemo(
    () =>
      safeArray(
        trip?.allocatedVehicles
      ),
    [trip?.allocatedVehicles]
  );

  /* =====================================
     ACTIVE VEHICLE
  ===================================== */

  const activeVehicle =
    useMemo(() => {
      if (!vehicles.length) {
        return null;
      }

      if (!selectedVehicle) {
        return vehicles[0];
      }

      const selectedId =
        typeof selectedVehicle ===
        "object"
          ? getVehicleIdentifier(
              selectedVehicle
            )
          : safeText(
              selectedVehicle,
              ""
            );

      const matchedVehicle =
        vehicles.find(
          (vehicle) =>
            getVehicleIdentifier(
              vehicle
            ) === selectedId
        );

      return (
        matchedVehicle ||
        (typeof selectedVehicle ===
        "object"
          ? selectedVehicle
          : vehicles[0])
      );
    }, [
      selectedVehicle,
      vehicles,
    ]);

  /* =====================================
     LATEST TRACKING
  ===================================== */

  const latestTracking =
    useMemo(
      () =>
        getLatestTracking(
          activeVehicle
        ),
      [activeVehicle]
    );

  /* =====================================
     ROUTE STOPS
  ===================================== */

  const routeStops = useMemo(
    () => {
      if (!trip) {
        return [];
      }

      const origin =
        safeText(
          trip.origin,
          ""
        ).trim();

      const destination =
        safeText(
          trip.destination,
          ""
        ).trim();

      const rawLocations =
        safeArray(
          trip.routeLocations
        );

      let intermediateLocations =
        rawLocations
          .map((location) =>
            safeText(
              getStopName(
                location
              ),
              ""
            ).trim()
          )
          .filter(Boolean);

      intermediateLocations =
        uniqueStrings(
          intermediateLocations
        );

      intermediateLocations =
        intermediateLocations.filter(
          (location) => {
            const normalized =
              normalizeText(
                location
              );

            return (
              normalized !==
                normalizeText(
                  origin
                ) &&
              normalized !==
                normalizeText(
                  destination
                )
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
        stops.push(
          destination
        );
      }

      if (!stops.length) {
        return [
          "Origin",
          "Destination",
        ];
      }

      if (
        stops.length === 1
      ) {
        stops.push(
          destination ||
            "Destination"
        );
      }

      return stops;
    },
    [trip]
  );

  /* =====================================
     VEHICLE PROGRESS
  ===================================== */

  const vehicleProgress =
    useMemo(() => {
      if (
        !activeVehicle ||
        routeStops.length < 2
      ) {
        return 0;
      }

      const status =
        normalizeText(
          latestTracking?.status
        );

      /*
        Reached = destination.
      */

      if (
        status === "reached"
      ) {
        return 1;
      }

      const currentLocation =
        normalizeText(
          latestTracking
            ?.currentLocation
        );

      /*
        First use exact route
        location match.
      */

      if (currentLocation) {
        const currentIndex =
          routeStops.findIndex(
            (stop) =>
              normalizeText(
                stop
              ) ===
              currentLocation
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

      /*
        Otherwise calculate
        progress from KM.

        trip.distance =
        planned total distance.

        todayKm =
        cumulative travelled KM.
      */

      const totalKm =
        Number(
          trip?.distance
        );

      const todayKm =
        Number(
          latestTracking
            ?.todayKm
        );

      if (
        Number.isFinite(
          totalKm
        ) &&
        totalKm > 0 &&
        Number.isFinite(
          todayKm
        )
      ) {
        return Math.min(
          Math.max(
            todayKm /
              totalKm,
            0
          ),
          1
        );
      }

      return 0;
    }, [
      activeVehicle,
      latestTracking,
      routeStops,
      trip?.distance,
    ]);

  /* =====================================
     CALCULATE SVG POSITIONS
  ===================================== */

  useEffect(() => {
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

    /*
      Route stop points.
    */

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
                (routeStops.length -
                  1);

          const point =
            path.getPointAtLength(
              length *
                percentage
            );

          return {
            name: stop,
            x: point.x,
            y: point.y,
            percentage,
          };
        }
      );

    setStopPoints(
      points
    );

    /*
      Vehicle position.
    */

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
      x: currentPoint.x,
      y: currentPoint.y,
    });
  }, [
    routeStops,
    vehicleProgress,
  ]);

  /* =====================================
     EMPTY TRIP
  ===================================== */

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
            Select a trip to
            view vehicle
            progress.
          </span>
        </div>
      </section>
    );
  }

  /* =====================================
     NO ALLOCATED VEHICLE
  ===================================== */

  if (!activeVehicle) {
    return (
      <section className="journey-column">
        <div className="journey-empty">
          <Truck
            size={26}
          />

          <strong>
            No Vehicle Allocated
          </strong>

          <span>
            Actual vehicle
            allocation will
            appear here after
            Tracking Input.
          </span>
        </div>
      </section>
    );
  }

  /* =====================================
     VEHICLE VALUES
  ===================================== */

  const status =
    getVehicleStatus(
      activeVehicle
    );

  const statusClass =
    getStatusClass(status);

  const vehicleNumber =
    safeText(
      activeVehicle
        ?.vehicleNumber,
      "-"
    );

  const currentPosition =
    safeText(
      latestTracking
        ?.currentLocation,
      "-"
    );

  const speed =
    latestTracking?.speed;

  const currentDay =
    latestTracking?.day;

  const runningKm =
    latestTracking
      ?.runningKm;

  const latitude =
    latestTracking?.latitude;

  const longitude =
    latestTracking?.longitude;

  /* =====================================
     ROUTE PROGRESS
  ===================================== */

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

  /* =====================================
     RENDER
  ===================================== */

  return (
    <section className="journey-column">
      {/* =================================
          VEHICLE HEADER
      ================================= */}

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
              {Math.max(
                routeStops.length -
                  2,
                0
              )}{" "}
              added location
              {Math.max(
                routeStops.length -
                  2,
                0
              ) === 1
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

      {/* =================================
          FULL HEIGHT ROUTE
      ================================= */}

      <div className="journey-route-wrapper">
        <svg
          className="journey-route-svg"
          viewBox={`0 0 ${ROUTE_VIEWBOX_WIDTH} ${ROUTE_VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* UPCOMING ROUTE */}

          <path
            ref={
              routePathRef
            }
            d={ROUTE_PATH}
            className="journey-path-base"
          />

          {/* COVERED ROUTE */}

          <path
            d={ROUTE_PATH}
            className="journey-path-progress"
            style={{
              strokeDasharray:
                `${completedLength} ${remainingLength}`,
            }}
          />

          {/* ROUTE STOPS */}

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

              const labelRight =
                index % 2 !==
                0;

              return (
                <g
                  key={`${stop.name}-${index}`}
                  className={`journey-stop ${
                    completed
                      ? "completed"
                      : ""
                  }`}
                >
                  <circle
                    cx={stop.x}
                    cy={stop.y}
                    r={
                      isOrigin ||
                      isDestination
                        ? 7
                        : 5.5
                    }
                    className="journey-stop-outer"
                  />

                  <circle
                    cx={stop.x}
                    cy={stop.y}
                    r={
                      isOrigin ||
                      isDestination
                        ? 3
                        : 2.5
                    }
                    className="journey-stop-inner"
                  />

                  <text
                    x={
                      labelRight
                        ? stop.x +
                          18
                        : stop.x -
                          18
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

                  {isOrigin && (
                    <text
                      x={
                        labelRight
                          ? stop.x +
                            18
                          : stop.x -
                            18
                      }
                      y={
                        stop.y +
                        17
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

                  {isDestination && (
                    <text
                      x={
                        labelRight
                          ? stop.x +
                            18
                          : stop.x -
                            18
                      }
                      y={
                        stop.y +
                        17
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

          {/* VEHICLE MARKER */}

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
        </svg>

        {/* =================================
            CURRENT VEHICLE CARD
        ================================= */}

        <div
          className="journey-current-card"
          style={{
            left: `${
              (vehiclePoint.x /
                ROUTE_VIEWBOX_WIDTH) *
              100
            }%`,

            top: `${
              (vehiclePoint.y /
                ROUTE_VIEWBOX_HEIGHT) *
              100
            }%`,
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
      </div>

      {/* Values are read from canonical dailyTracking.
          Existing route UI remains unchanged. */}

      <div
        style={{
          display: "none",
        }}
        aria-hidden="true"
      >
        <span>
          {safeText(
            currentDay,
            ""
          )}
        </span>

        <span>
          {safeText(
            runningKm,
            ""
          )}
        </span>

        <span>
          {safeText(
            speed,
            ""
          )}
        </span>

        <span>
          {safeText(
            latitude,
            ""
          )}
        </span>

        <span>
          {safeText(
            longitude,
            ""
          )}
        </span>
      </div>
    </section>
  );
};

export default TrackingMapColumn;