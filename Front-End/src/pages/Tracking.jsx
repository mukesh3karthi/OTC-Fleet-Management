import "../pagescss/Tracking.css";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, CircleAlert, CirclePause, Clock3, ExternalLink, FileText, MapPin, MessageSquareText, Navigation, Package, PackageCheck, Route, Search, Truck, UserRound } from "lucide-react";

/* =========================================================

   SAFE HELPERS

\========================================================= */

const TripList_safeArray = (value) =>

  Array.isArray(value) ? value : [];

const TripList_safeText = (value, fallback = "") => {

  if (value === null || value === undefined) {

    return fallback;

  }

  return String(value);

};

/* =========================================================

   LATEST TRACKING

\========================================================= */

const TripList_getLatestTracking = (vehicle) => {

  const tracking = TripList_safeArray(vehicle?.dailyTracking);

  if (!tracking.length) {

    return null;

  }

  return tracking[tracking.length - 1];

};

/* =========================================================

   VEHICLE STATUS

\========================================================= */

const TripList_getVehicleStatus = (vehicle) => {

  const latest = TripList_getLatestTracking(vehicle);

  const status = TripList_safeText(

    latest?.status || vehicle?.status,

    "Idle"

  ).trim().toLowerCase();

  if (status === "moving") return "Moving";

  if (status === "breakdown") return "Breakdown";

  if (status === "stopped") return "Idle";

  if (status !== "reached") return "Idle";

  const unloadingCompleted =

    TripList_safeText(

      vehicle?.unloading?.status,

      vehicle?.unloadingStatus || ""

    ).trim().toLowerCase() === "completed";

  const lrCompleted = Boolean(

    vehicle?.lr?.number ||

    vehicle?.lr?.date ||

    vehicle?.pod?.fileName

  );

  const ewayStatus = TripList_safeText(

    vehicle?.ewayBill?.status,

    ""

  ).trim().toLowerCase();

  const ewayCompleted = Boolean(

    (vehicle?.ewayBill?.number || vehicle?.ewayBill?.fileName) &&

    ewayStatus !== "pending" &&

    ewayStatus !== "expired"

  );

  return unloadingCompleted && lrCompleted && ewayCompleted

    ? "Reached"

    : "Pending";

};

/* =========================================================

   VEHICLE STATUS COUNTS

\========================================================= */

const TripList_getVehicleStatusCounts = (trip) => {

  const vehicles = TripList_safeArray(

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

    const status = TripList_getVehicleStatus(vehicle);

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

\========================================================= */

const TripList_getTripKey = (trip, index) =>

  TripList_safeText(trip?._id) ||

  TripList_safeText(trip?.id) ||

  TripList_safeText(trip?.tripId) ||

  `trip-${index}`;

/* =========================================================

   SELECTED TRIP

\========================================================= */

const TripList_isSameTrip = (

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

    TripList_safeText(trip.tripId) ===

    TripList_safeText(selectedTrip.tripId)

  );

};

/* =========================================================

   MATERIAL

\========================================================= */

const TripList_getMaterial = (trip) => {

  return (

    TripList_safeText(trip?.material) ||

    TripList_safeText(trip?.materialType) ||

    TripList_safeText(trip?.materialName) ||

    "-"

  );

};

/* =========================================================

   COMPONENT

\========================================================= */

const TripListColumn = ({

  trips = [],

  selectedTrip = null,

  onSelectTrip,

}) => {

  const tripList = TripList_safeArray(trips);

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

              TripList_isSameTrip(

                trip,

                selectedTrip

              );

            const vehicleStatusCounts =

              TripList_getVehicleStatusCounts(trip);

            const origin =

              TripList_safeText(

                trip?.origin,

                "-"

              ) || "-";

            const destination =

              TripList_safeText(

                trip?.destination,

                "-"

              ) || "-";

            const material =

              TripList_getMaterial(trip);

            const customer =

              TripList_safeText(

                trip?.customer,

                "Customer"

              );

            return (

              <button

                type="button"

                key={TripList_getTripKey(

                  trip,

                  index

                )}

                className={`trip-list-item ${active ? "active" : ""

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

                      {TripList_safeText(

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

                  {/* PENDING */}

                  <div className="trip-vehicle-stat pending">

                    <span className="trip-vehicle-dot" />

                    <span>Pending</span>

                    <strong>{vehicleStatusCounts.Pending}</strong>

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



const Vehicle_API_BASE_URL = (

  import.meta.env.VITE_API_URL ||

  "http://localhost:5000"

).replace(/\/+$/, "");

const Vehicle_TRIP_API_URL = `${Vehicle_API_BASE_URL}/api/triporders`;

const Vehicle_safeArray = (value) =>

  Array.isArray(value) ? value : [];

const Vehicle_safeText = (value, fallback = "-") => {

  if (

    value === null ||

    value === undefined ||

    value === ""

  ) {

    return fallback;

  }

  if (typeof value === "object") {

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

const Vehicle_getSafeDateValue = (value) => {

  if (

    value === null ||

    value === undefined ||

    value === ""

  ) {

    return null;

  }

  if (

    typeof value === "object" &&

    !Array.isArray(value)

  ) {

    if (value.$date !== undefined) {

      return Vehicle_getSafeDateValue(value.$date);

    }

    if (value.$numberLong !== undefined) {

      const timestamp = Number(value.$numberLong);

      return Number.isFinite(timestamp)

        ? timestamp

        : null;

    }

    return null;

  }

  return value;

};

const Vehicle_formatDate = (value) => {

  const safeValue = Vehicle_getSafeDateValue(value);

  if (!safeValue) {

    return "-";

  }

  const date = new Date(safeValue);

  if (Number.isNaN(date.getTime())) {

    return "-";

  }

  return date.toLocaleDateString("en-GB", {

    day: "2-digit",

    month: "short",

    year: "numeric",

  });

};

const Vehicle_formatLastUpdated = (value) => {

  const safeValue = Vehicle_getSafeDateValue(value);

  if (!safeValue) {

    return "-";

  }

  const date = new Date(safeValue);

  if (Number.isNaN(date.getTime())) {

    return "-";

  }

  return date.toLocaleString("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",

  });

};

const Vehicle_formatKm = (value) => {

  if (

    value === null ||

    value === undefined ||

    value === ""

  ) {

    return "-";

  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {

    return "-";

  }

  return `${numericValue.toLocaleString(

    "en-IN"

  )} km`;

};

const Vehicle_formatDays = (value) => {

  if (

    value === null ||

    value === undefined ||

    value === ""

  ) {

    return "-";

  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {

    return "-";

  }

  return `${numericValue} ${numericValue === 1 ? "Day" : "Days"

    }`;

};

const Vehicle_getVehicleId = (vehicle) => {

  if (!vehicle) {

    return "";

  }

  return (

    Vehicle_safeText(vehicle.allocationId, "") ||

    Vehicle_safeText(vehicle._id, "") ||

    Vehicle_safeText(vehicle.vehicleNumber, "")

  );

};

const Vehicle_getLatestTracking = (vehicle) => {

  const dailyTracking = Vehicle_safeArray(

    vehicle?.dailyTracking

  );

  if (!dailyTracking.length) {

    return null;

  }

  return dailyTracking[

    dailyTracking.length - 1

  ];

};

const Vehicle_getVehicleStatus = (vehicle) => {

  const latestTracking = Vehicle_getLatestTracking(vehicle);

  const rawStatus = Vehicle_safeText(latestTracking?.status, "Idle");

  if (rawStatus.trim().toLowerCase() !== "reached") {

    return rawStatus;

  }

  const unloadingCompleted =

    String(vehicle?.unloading?.status || "").trim().toLowerCase() === "completed";

  const lrCompleted = Boolean(

    vehicle?.lr?.number ||

    vehicle?.lr?.date ||

    vehicle?.pod?.fileName

  );

  const ewayStatus = String(vehicle?.ewayBill?.status || "").trim().toLowerCase();

  const ewayCompleted = Boolean(

    (vehicle?.ewayBill?.number || vehicle?.ewayBill?.fileName) &&

    ewayStatus !== "pending"

  );

  return unloadingCompleted && lrCompleted && ewayCompleted

    ? "Reached"

    : "Pending";

};

const Vehicle_getRequirement = (trip, vehicle) => {

  if (!trip || !vehicle) {

    return null;

  }

  return (

    Vehicle_safeArray(

      trip.vehicleRequirements

    ).find(

      (requirement) =>

        Vehicle_safeText(

          requirement.requirementId,

          ""

        ) ===

        Vehicle_safeText(

          vehicle.requirementId,

          ""

        )

    ) || null

  );

};

const Vehicle_getConfirmation = (trip, vehicle) => {

  if (!trip || !vehicle) {

    return null;

  }

  const confirmations = Vehicle_safeArray(

    trip.vehicleConfirmations

  );

  if (vehicle.confirmationId) {

    const confirmation =

      confirmations.find(

        (item) =>

          Vehicle_safeText(

            item.confirmationId,

            ""

          ) ===

          Vehicle_safeText(

            vehicle.confirmationId,

            ""

          )

      );

    if (confirmation) {

      return confirmation;

    }

  }

  return (

    confirmations.find(

      (item) =>

        Vehicle_safeText(

          item.requirementId,

          ""

        ) ===

        Vehicle_safeText(

          vehicle.requirementId,

          ""

        ) &&

        item.status === "Approved"

    ) || null

  );

};

const Vehicle_getQuotation = (trip, vehicle) => {

  if (!trip || !vehicle) {

    return null;

  }

  const quotations = Vehicle_safeArray(

    trip.trafficQuotations

  );

  if (vehicle.quotationId) {

    const quotation = quotations.find(

      (item) =>

        Vehicle_safeText(

          item.quotationId,

          ""

        ) ===

        Vehicle_safeText(

          vehicle.quotationId,

          ""

        )

    );

    if (quotation) {

      return quotation;

    }

  }

  const confirmation =

    Vehicle_getConfirmation(trip, vehicle);

  if (!confirmation?.quotationId) {

    return null;

  }

  return (

    quotations.find(

      (item) =>

        Vehicle_safeText(

          item.quotationId,

          ""

        ) ===

        Vehicle_safeText(

          confirmation.quotationId,

          ""

        )

    ) || null

  );

};

const Vehicle_DetailRow = ({

  label,

  value,

  halting = false,

}) => (

  <div className="simple-detail-row">

    <span className="simple-detail-label">

      {label}

    </span>

    <span className="simple-detail-colon">

      :

    </span>

    <strong

      className={`simple-detail-value ${halting ? "halting" : ""

        }`}

    >

      {Vehicle_safeText(value)}

    </strong>

  </div>

);

const Vehicle_PersonSection = ({

  className = "",

  icon,

  title,

  rows = [],

}) => (

  <div className={`simple-operation-card person-operation-card lr-person-section ${className}`}>

    <div className="simple-operation-header lr-person-heading common-detail-header">

      <div className="simple-operation-title">

        <span className="simple-operation-icon person">

          {icon}

        </span>

        <div>

          <strong>{title}</strong>

        </div>

      </div>

    </div>

    <div className="simple-operation-details lr-person-content">

      {rows.map(([label, value]) => (

        <div className="simple-detail-row lr-person-row" key={label}>

          <span className="simple-detail-label">{label}</span>

          <span className="simple-detail-colon lr-person-colon">:</span>

          <strong className="simple-detail-value">{Vehicle_safeText(value)}</strong>

        </div>

      ))}

    </div>

  </div>

);

const VehicleColumn = ({

  trip,

  selectedVehicle,

  onSelectVehicle,

  getStatusClass,

}) => {

  const [

    showExtraVehicles,

    setShowExtraVehicles,

  ] = useState(false);

  if (!trip) {

    return (

      <section className="vehicle-column-panel">

        <div className="vehicle-column-empty">

          <div className="vehicle-column-empty-icon">

            <Truck size={24} />

          </div>

          <strong>

            No Trip Selected

          </strong>

          <p>

            Select a trip to view vehicle

            information.

          </p>

        </div>

      </section>

    );

  }

  const vehicles = Vehicle_safeArray(

    trip.allocatedVehicles

  );

  const selectedVehicleId =

    typeof selectedVehicle === "object"

      ? Vehicle_getVehicleId(selectedVehicle)

      : Vehicle_safeText(

        selectedVehicle,

        ""

      );

  const activeVehicle =

    vehicles.find(

      (vehicle) =>

        Vehicle_getVehicleId(vehicle) ===

        selectedVehicleId

    ) ||

    (typeof selectedVehicle === "object"

      ? selectedVehicle

      : null) ||

    vehicles[0] ||

    null;

  const VISIBLE_VEHICLE_COUNT = 5;

  const visibleVehicles =

    vehicles.slice(

      0,

      VISIBLE_VEHICLE_COUNT

    );

  const extraVehicles =

    vehicles.slice(

      VISIBLE_VEHICLE_COUNT

    );

  const selectedExtraVehicle =

    extraVehicles.find(

      (vehicle) =>

        Vehicle_getVehicleId(vehicle) ===

        selectedVehicleId

    ) || null;

  const handleVehicleSelect = (

    vehicle

  ) => {

    const vehicleId =

      Vehicle_getVehicleId(vehicle);

    if (!vehicleId) {

      return;

    }

    onSelectVehicle?.(vehicleId);

    setShowExtraVehicles(false);

  };

  const getVehicleStatusIcon = (

    status

  ) => {

    if (status === "Moving") {

      return (

        <Navigation size={10} />

      );

    }

    if (

      status === "Breakdown" ||

      status === "Stopped"

    ) {

      return (

        <AlertTriangle size={10} />

      );

    }

    if (status === "Reached") {

      return (

        <CheckCircle2

          size={10}

        />

      );

    }

    return (

      <CirclePause size={10} />

    );

  };

  const getVehicleStatusClass = (

    status

  ) => {

    if (status === "Stopped") {

      return "breakdown";

    }

    if (

      typeof getStatusClass ===

      "function"

    ) {

      return getStatusClass(status);

    }

    return Vehicle_safeText(

      status,

      "Idle"

    )

      .toLowerCase()

      .replaceAll(" ", "-");

  };

  const latestTracking =

    Vehicle_getLatestTracking(activeVehicle);

  const requirement =

    Vehicle_getRequirement(

      trip,

      activeVehicle

    );

  const quotation =

    Vehicle_getQuotation(

      trip,

      activeVehicle

    );

  const vehicleStatus =

    Vehicle_getVehicleStatus(

      activeVehicle

    );

  const vehicleNumber =

    Vehicle_safeText(

      activeVehicle?.vehicleNumber

    );

  const totalKm = Number(trip.distance) || 0;

  const trackingHistory = Vehicle_safeArray(activeVehicle?.dailyTracking);

  const kmCovered = trackingHistory.reduce((total, tracking) => {

    const dailyRunningKm = Number(tracking?.runningKm);

    if (!Number.isFinite(dailyRunningKm) || dailyRunningKm < 0) {

      return total;

    }

    return total + dailyRunningKm;

  }, 0);

  const balanceKm = Math.max(totalKm - kmCovered, 0);

  const currentPosition =

    Vehicle_safeText(

      latestTracking?.currentLocation

    );

  const normalizeRouteLocation = (value) =>

    Vehicle_safeText(value, "")

      .trim()

      .toLowerCase()

      .replace(/\s+/g, " ");

  const getRouteLocationText = (value) => {

    if (typeof value === "string" || typeof value === "number") {

      return Vehicle_safeText(value, "").trim();

    }

    if (value && typeof value === "object") {

      return Vehicle_safeText(

        value.location ||

        value.name ||

        value.city ||

        value.place ||

        value.label,

        ""

      ).trim();

    }

    return "";

  };

  const rawRouteLocations = (() => {

    if (Array.isArray(trip?.routeLocations)) {

      return trip.routeLocations;

    }

    if (Array.isArray(trip?.route)) {

      return trip.route;

    }

    if (Array.isArray(trip?.routes)) {

      return trip.routes;

    }

    if (typeof trip?.route === "string") {

      return trip.route

        .split(/\s*(?:→|->|>|,|\\|)\s*/)

        .filter(Boolean);

    }

    return [];

  })();

  const enteredRouteLocations = rawRouteLocations

    .map(getRouteLocationText)

    .filter(Boolean);

  const originLocation = Vehicle_safeText(trip?.origin, "").trim();

  const destinationLocation = Vehicle_safeText(trip?.destination, "").trim();

  const routeLocations = [...enteredRouteLocations];

  if (

    originLocation &&

    !routeLocations.some(

      (location) =>

        normalizeRouteLocation(location) ===

        normalizeRouteLocation(originLocation)

    )

  ) {

    routeLocations.unshift(originLocation);

  }

  if (

    destinationLocation &&

    !routeLocations.some(

      (location) =>

        normalizeRouteLocation(location) ===

        normalizeRouteLocation(destinationLocation)

    )

  ) {

    routeLocations.push(destinationLocation);

  }

  const currentRouteIndex =

    currentPosition && currentPosition !== "-"

      ? routeLocations.findIndex(

        (location) =>

          normalizeRouteLocation(location) ===

          normalizeRouteLocation(currentPosition)

      )

      : -1;

  const yesterdayPosition =

    Vehicle_safeText(

      latestTracking

        ?.yesterdayLocation

    );

  const yesterdayKm =

    latestTracking?.yesterdayKm ??

    null;

  const todayKm =

    latestTracking?.todayKm ??

    null;

  const runningKm =

    latestTracking?.runningKm ??

    null;

  const currentDay =

    latestTracking?.day ??

    null;

  const lastUpdated =

    Vehicle_formatLastUpdated(

      latestTracking?.updatedAt

    );

  const vehicleType =

    Vehicle_safeText(

      requirement?.vehicleType

    );

  const configuration =

    Vehicle_safeText(

      requirement?.configuration

    );

  const classification =

    Vehicle_safeText(

      requirement?.classification

    );

  const transporter =

    Vehicle_safeText(

      quotation?.transporter

    );

  const loading =

    activeVehicle?.loading || {};

  const loadingStatus =

    Vehicle_safeText(

      loading.status,

      "Pending"

    );

  const loadingPointInDate =

    Vehicle_formatDate(

      loading.pointInDate

    );

  const loadingDate =

    Vehicle_formatDate(

      loading.loadingDate

    );

  const loadingPointOutDate =

    Vehicle_formatDate(

      loading.pointOutDate

    );

  const loadingHaltingDays =

    loading.haltingDays ??

    null;

  const loadingRemarks =

    Vehicle_safeText(

      loading.remarks

    );

  const unloading =

    activeVehicle?.unloading || {};

  const unloadingStatus =

    Vehicle_safeText(

      unloading.status,

      "Pending"

    );

  const unloadingPointInDate =

    Vehicle_formatDate(

      unloading.pointInDate

    );

  const unloadingDate =

    Vehicle_formatDate(

      unloading.unloadingDate

    );

  const unloadingPointOutDate =

    Vehicle_formatDate(

      unloading.pointOutDate

    );

  const unloadingHaltingDays =

    unloading.haltingDays ??

    null;

  const unloadingRemarks =

    Vehicle_safeText(

      unloading.remarks

    );

  const driver =

    activeVehicle?.driver || {};

  const driverName =

    Vehicle_safeText(driver.name);

  const driverNumber =

    Vehicle_safeText(

      driver.contactNumber

    );

  const escort =

    activeVehicle?.escort || {};

  const escortVehicleNumber =

    Vehicle_safeText(

      escort.vehicleNumber

    );

  const escortName =

    Vehicle_safeText(escort.name);

  const escortContactNumber =

    Vehicle_safeText(

      escort.contactNumber

    );

  const supervisor =

    activeVehicle?.supervisor || {};

  const supervisorName =

    Vehicle_safeText(

      supervisor.name

    );

  const supervisorContact =

    Vehicle_safeText(

      supervisor.contactNumber

    );

  const lr = activeVehicle?.lr || {};

  const pod = activeVehicle?.pod || {};

  const ewayBill = activeVehicle?.ewayBill || {};

  const lrNumber = Vehicle_safeText(lr.number);

  const lrDate = Vehicle_formatDate(lr.date);

  const lrRemarks = Vehicle_safeText(lr.remarks);

  const lrStatus =

    lr.number || lr.date || pod.fileName

      ? "Completed"

      : "Pending";

  const podStatus = pod?.fileName

    ? "Uploaded"

    : "Pending";

  const ewayBillNumber = Vehicle_safeText(ewayBill.number);

  const ewayBillValidUpto = Vehicle_formatDate(ewayBill.validUpto);

  const ewayBillStatus = Vehicle_safeText(ewayBill.status, "Pending");

  const getEwayDaysLeft = (value) => {

    const raw = Vehicle_getSafeDateValue(value);

    if (!raw) return null;

    const date = typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw)

      ? new Date(`${raw.slice(0, 10)}T00:00:00`)

      : new Date(raw);

    if (Number.isNaN(date.getTime())) return null;

    const today = new Date();

    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

    const expiryUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

    return Math.round((expiryUTC - todayUTC) / 86400000);

  };

  const ewayDaysLeft = getEwayDaysLeft(ewayBill.validUpto);

  const ewayHeadingStatus = ewayDaysLeft === null

    ? ewayBillStatus

    : ewayDaysLeft < 0

      ? "Expired"

      : ewayDaysLeft === 0

        ? "Expires Today"

        : ewayDaysLeft <= 7

          ? `${ewayDaysLeft} ${ewayDaysLeft === 1 ? "Day" : "Days"} Left`

          : "Active";

  const getDocumentStatusClass = (status) =>

    Vehicle_safeText(status, "Pending")

      .toLowerCase()

      .replaceAll(" ", "-");

  const ewayHeadingClass = ewayDaysLeft === null

    ? getDocumentStatusClass(ewayBillStatus)

    : ewayDaysLeft < 0 ? "expired" : ewayDaysLeft <= 7 ? "expiring-soon" : "active";

  const viewVehicleDocument = (type) => {

    const mongoId = trip?._id?.$oid || trip?._id;

    const allocationId = activeVehicle?.allocationId;

    if (!mongoId || !allocationId) {

      return;

    }

    window.open(

      `${Vehicle_TRIP_API_URL}/${mongoId}/allocated-vehicles/${allocationId}/${type}/file?disposition=inline`,

      "_blank",

      "noopener,noreferrer"

    );

  };

  const downloadVehicleDocument = (type) => {

    const mongoId = trip?._id?.$oid || trip?._id;

    const allocationId = activeVehicle?.allocationId;

    if (!mongoId || !allocationId) {

      return;

    }

    window.open(

      `${Vehicle_TRIP_API_URL}/${mongoId}/allocated-vehicles/${allocationId}/${type}/file?disposition=attachment`,

      "_blank",

      "noopener,noreferrer"

    );

  };

  const customerName =

    Vehicle_safeText(trip.customer);

  const customerContact =

    Vehicle_safeText(

      trip.contactPerson

    );

  const customerPhone =

    Vehicle_safeText(

      trip.contactNumber

    );

  return (

    <section className="vehicle-column-panel">

      <div className="vehicle-selector-row">

        {vehicles.length > 0 ? (

          <>

            <div className="vehicle-visible-tabs">

              {visibleVehicles.map(

                (vehicle, index) => {

                  const vehicleId =

                    Vehicle_getVehicleId(

                      vehicle

                    );

                  const active =

                    selectedVehicleId

                      ? selectedVehicleId ===

                      vehicleId

                      : index === 0;

                  const status =

                    Vehicle_getVehicleStatus(

                      vehicle

                    );

                  return (

                    <button

                      type="button"

                      key={

                        vehicleId ||

                        index

                      }

                      className={`vehicle-number-card ${active

                        ? "active"

                        : ""

                        }`}

                      onClick={() =>

                        handleVehicleSelect(

                          vehicle

                        )

                      }

                      title={Vehicle_safeText(

                        vehicle.vehicleNumber,

                        `Vehicle ${index + 1

                        }`

                      )}

                    >

                      <span>

                        {Vehicle_safeText(

                          vehicle.vehicleNumber,

                          `Vehicle ${index + 1

                          }`

                        )}

                      </span>

                      <span

                        className={`vehicle-mini-status ${getVehicleStatusClass(

                          status

                        )}`}

                      >

                        {getVehicleStatusIcon(

                          status

                        )}

                        {status}

                      </span>

                    </button>

                  );

                }

              )}

            </div>

            {extraVehicles.length >

              0 && (

                <div className="vehicle-more-dropdown">

                  <button

                    type="button"

                    className={`vehicle-more-button ${selectedExtraVehicle

                      ? "active"

                      : ""

                      }`}

                    onClick={() =>

                      setShowExtraVehicles(

                        (current) =>

                          !current

                      )

                    }

                    aria-expanded={

                      showExtraVehicles

                    }

                    aria-haspopup="listbox"

                  >

                    <span className="vehicle-more-button-text">

                      {selectedExtraVehicle

                        ? Vehicle_safeText(

                          selectedExtraVehicle.vehicleNumber,

                          "More Vehicles"

                        )

                        : `More (${extraVehicles.length})`}

                    </span>

                    {showExtraVehicles ? (

                      <ChevronUp

                        size={15}

                      />

                    ) : (

                      <ChevronDown

                        size={15}

                      />

                    )}

                  </button>

                  {showExtraVehicles && (

                    <div

                      className="vehicle-more-menu"

                      role="listbox"

                    >

                      {extraVehicles.map(

                        (

                          vehicle,

                          index

                        ) => {

                          const vehicleId =

                            Vehicle_getVehicleId(

                              vehicle

                            );

                          const active =

                            selectedVehicleId ===

                            vehicleId;

                          const status =

                            Vehicle_getVehicleStatus(

                              vehicle

                            );

                          return (

                            <button

                              type="button"

                              role="option"

                              aria-selected={

                                active

                              }

                              key={

                                vehicleId ||

                                `extra-${index}`

                              }

                              className={`vehicle-more-option ${active

                                ? "active"

                                : ""

                                }`}

                              onClick={() =>

                                handleVehicleSelect(

                                  vehicle

                                )

                              }

                            >

                              <span>

                                {Vehicle_safeText(

                                  vehicle.vehicleNumber,

                                  `Vehicle ${VISIBLE_VEHICLE_COUNT +

                                  index +

                                  1

                                  }`

                                )}

                              </span>

                              <span

                                className={`vehicle-mini-status ${getVehicleStatusClass(

                                  status

                                )}`}

                              >

                                {getVehicleStatusIcon(

                                  status

                                )}

                                {status}

                              </span>

                            </button>

                          );

                        }

                      )}

                    </div>

                  )}

                </div>

              )}

          </>

        ) : (

          <div className="vehicle-mini-empty">

            No allocated vehicles found.

          </div>

        )}

      </div>

      {!activeVehicle ? (

        <div className="vehicle-column-empty">

          <div className="vehicle-column-empty-icon">

            <Truck size={24} />

          </div>

          <strong>

            No Vehicle Allocated

          </strong>

          <p>

            Actual vehicles will appear here

            after allocation in Tracking Input.

          </p>

        </div>

      ) : (

        <>

          <div className="trip-distance-summary">

            <div className="distance-summary-item total">

              <span>

                Total KM

              </span>

              <strong>

                {Vehicle_formatKm(

                  totalKm

                )}

              </strong>

            </div>

            <div className="distance-summary-item covered">

              <span>

                KM Covered

              </span>

              <strong>

                {Vehicle_formatKm(

                  kmCovered

                )}

              </strong>

            </div>

            <div className="distance-summary-item balance">

              <span>

                Balance

              </span>

              <strong>

                {Vehicle_formatKm(

                  balanceKm

                )}

              </strong>

            </div>

          </div>

          <div className="movement-vehicle-row">

            <div className="movement-card-section">

              <div className="movement-heading-row common-detail-header">

                <span className="section-heading-icon blue">

                  <Navigation

                    size={12}

                  />

                </span>

                <div className="movement-heading-content">

                  <div className="movement-title-line">

                    <strong>

                      Movement Status

                    </strong>

                    <span className="movement-vehicle-badge">

                      {vehicleNumber}

                    </span>

                  </div>

                  <span className="movement-heading-subtitle">

                    Latest daily movement

                  </span>

                </div>

              </div>

              <div className="movement-card-grid">

                <div className="movement-info-card">

                  <span>

                    Current Position

                  </span>

                  <span className="movement-info-colon">:</span>

                  <strong>

                    {currentPosition}

                  </strong>

                </div>

                <div className="movement-info-card">

                  <span>

                    Yesterday Position

                  </span>

                  <span className="movement-info-colon">:</span>

                  <strong>

                    {yesterdayPosition}

                  </strong>

                </div>

                <div className="movement-info-card">

                  <span>

                    Yesterday KM

                  </span>

                  <span className="movement-info-colon">:</span>

                  <strong>

                    {Vehicle_formatKm(

                      yesterdayKm

                    )}

                  </strong>

                </div>

                <div className="movement-info-card">

                  <span>

                    Today KM

                  </span>

                  <span className="movement-info-colon">:</span>

                  <strong>

                    {Vehicle_formatKm(

                      todayKm

                    )}

                  </strong>

                </div>

                <div className="movement-info-card">

                  <span>

                    Running KM

                  </span>

                  <span className="movement-info-colon">:</span>

                  <strong>

                    {Vehicle_formatKm(

                      runningKm

                    )}

                  </strong>

                </div>

                <div className="movement-info-card">

                  <span>

                    Current Day

                  </span>

                  <span className="movement-info-colon">:</span>

                  <strong>

                    {currentDay ===

                      null ||

                      currentDay ===

                      undefined

                      ? "-"

                      : `Day ${currentDay}`}

                  </strong>

                </div>

                <div className="movement-info-card">

                  <span>

                    Status

                  </span>

                  <span className="movement-info-colon">:</span>

                  <strong>

                    {vehicleStatus}

                  </strong>

                </div>

              </div>

            </div>

            <div className="vehicle-transport-summary">

              <div className="vehicle-transport-header common-detail-header">

                <span className="vehicle-transport-icon">

                  <Truck size={14} />

                </span>

                <div className="vehicle-transport-heading">

                  <strong>Vehicle &amp; Transport Details</strong>

                  <span>Vehicle specification and assigned transporter</span>

                </div>

              </div>

              <div className="vehicle-transport-grid">

                <div className="vehicle-transport-item">

                  <span>Vehicle Type</span>

                  <span className="vehicle-transport-colon">:</span>

                  <strong>{vehicleType || "-"}</strong>

                </div>

                <div className="vehicle-transport-item">

                  <span>Configuration</span>

                  <span className="vehicle-transport-colon">:</span>

                  <strong>{configuration || "-"}</strong>

                </div>

                <div className="vehicle-transport-item">

                  <span>Classification</span>

                  <span className="vehicle-transport-colon">:</span>

                  <strong>{classification || "-"}</strong>

                </div>

                <div className="vehicle-transport-item vehicle-number">

                  <span>Vehicle Number</span>

                  <span className="vehicle-transport-colon">:</span>

                  <strong>{vehicleNumber || "-"}</strong>

                </div>

                <div className="vehicle-transport-item transporter">

                  <span>Transporter</span>

                  <span className="vehicle-transport-colon">:</span>

                  <strong>{transporter || "-"}</strong>

                </div>

              </div>

            </div>

          </div>

          <div className="operation-details-section">

            <div className="operation-main-grid">

              <div className="simple-operation-card loading-card">

                <div className="simple-operation-header common-detail-header">

                  <div className="simple-operation-title">

                    <span className="simple-operation-icon loading">

                      <Truck

                        size={13}

                      />

                    </span>

                    <div>

                      <strong>

                        Loading Point

                      </strong>

                      <span>

                        Dispatch information

                      </span>

                    </div>

                  </div>

                  <span className="simple-operation-status loading">

                    {loadingStatus}

                  </span>

                </div>

                <div className="simple-operation-details">

                  <Vehicle_DetailRow

                    label="LP In Date"

                    value={

                      loadingPointInDate

                    }

                  />

                  <Vehicle_DetailRow

                    label="Loading Date"

                    value={

                      loadingDate

                    }

                  />

                  <Vehicle_DetailRow

                    label="LP Out Date"

                    value={

                      loadingPointOutDate

                    }

                  />

                  <Vehicle_DetailRow

                    label="Halting Days"

                    value={Vehicle_formatDays(

                      loadingHaltingDays

                    )}

                    halting

                  />

                  <div className="simple-remarks-box">

                    <div className="simple-remarks-heading">

                      <MessageSquareText

                        size={10}

                      />

                      <span>

                        Remarks

                      </span>

                    </div>

                    <div className="simple-remarks-value">

                      {loadingRemarks}

                    </div>

                  </div>

                </div>

              </div>

              <div className="simple-operation-card unloading-card">

                <div className="simple-operation-header common-detail-header">

                  <div className="simple-operation-title">

                    <span className="simple-operation-icon unloading">

                      <PackageCheck

                        size={13}

                      />

                    </span>

                    <div>

                      <strong>

                        Unloading Point

                      </strong>

                      <span>

                        Delivery information

                      </span>

                    </div>

                  </div>

                  <span className="simple-operation-status unloading">

                    {unloadingStatus}

                  </span>

                </div>

                <div className="simple-operation-details">

                  <Vehicle_DetailRow

                    label="UP In Date"

                    value={

                      unloadingPointInDate

                    }

                  />

                  <Vehicle_DetailRow

                    label="Unloading Date"

                    value={

                      unloadingDate

                    }

                  />

                  <Vehicle_DetailRow

                    label="UP Out Date"

                    value={

                      unloadingPointOutDate

                    }

                  />

                  <Vehicle_DetailRow

                    label="Halting Days"

                    value={Vehicle_formatDays(

                      unloadingHaltingDays

                    )}

                    halting

                  />

                  <div className="simple-remarks-box">

                    <div className="simple-remarks-heading">

                      <MessageSquareText

                        size={10}

                      />

                      <span>

                        Remarks

                      </span>

                    </div>

                    <div className="simple-remarks-value">

                      {unloadingRemarks}

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

          <div className="operation-details-section document-operation-section">

            <div className="operation-main-grid document-three-column-grid">

              <div className="simple-operation-card document-operation-card">

                <div className="simple-operation-header common-detail-header">

                  <div className="simple-operation-title">

                    <span className="simple-operation-icon document">

                      <FileText size={13} />

                    </span>

                    <div>

                      <strong>LR Details</strong>

                    </div>

                  </div>

                  <span className={`simple-operation-status document ${getDocumentStatusClass(lrStatus)}`}>

                    {lrStatus}

                  </span>

                </div>

                <div className="simple-operation-details">

                  <Vehicle_DetailRow label="LR Number" value={lrNumber} />

                  <Vehicle_DetailRow label="LR Date" value={lrDate} />

                  <Vehicle_DetailRow label="Remarks" value={lrRemarks} />

                </div>

              </div>

              <div className="simple-operation-card document-operation-card">

                <div className="simple-operation-header common-detail-header">

                  <div className="simple-operation-title">

                    <span className="simple-operation-icon document">

                      <FileText size={13} />

                    </span>

                    <div>

                      <strong>E-Way Bill Details</strong>

                    </div>

                  </div>

                  <span className={`simple-operation-status document ${ewayHeadingClass}`}>

                    {ewayHeadingStatus}

                  </span>

                </div>

                <div className="simple-operation-details">

                  <Vehicle_DetailRow label="E-Way Bill No" value={ewayBillNumber} />

                  <Vehicle_DetailRow label="Valid Upto" value={ewayBillValidUpto} />

                  <Vehicle_DetailRow label="Status" value={ewayBillStatus} />

                </div>

              </div>

              <div className="simple-operation-card document-operation-card pod-operation-card">

                <div className="simple-operation-header common-detail-header">

                  <div className="simple-operation-title">

                    <span className="simple-operation-icon document">

                      <FileText size={13} />

                    </span>

                    <div>

                      <strong>POD Document</strong>

                    </div>

                  </div>

                  <span className={`simple-operation-status document ${getDocumentStatusClass(podStatus)}`}>

                    {podStatus}

                  </span>

                </div>

                <div className="simple-operation-details">

                  <div className="pod-file-info">

                    <span className="pod-file-label">POD File</span>

                    <span className="pod-file-name" title={Vehicle_safeText(pod?.fileName)}>{Vehicle_safeText(pod?.fileName)}</span>

                  </div>

                  {pod?.fileName && (

                    <div className="pod-file-buttons">

                      <button type="button" onClick={() => viewVehicleDocument("pod")} title="View POD">

                        <ExternalLink size={12} />

                        <span>View</span>

                      </button>

                      <button type="button" onClick={() => downloadVehicleDocument("pod")} title="Download POD">

                        <FileText size={12} />

                        <span>Download</span>

                      </button>

                    </div>

                  )}

                </div>

              </div>

            </div>

          </div>

          <div className="person-grid">

            <Vehicle_PersonSection

              className="driver-section"

              icon={

                <Truck

                  size={11}

                />

              }

              title="Driver Details"

              rows={[

                [

                  "Driver Name",

                  driverName,

                ],

                [

                  "Driver Number",

                  driverNumber,

                ],

              ]}

            />

            <Vehicle_PersonSection

              className="escort-section"

              icon={

                <Navigation

                  size={11}

                />

              }

              title="Escort Details"

              rows={[

                [

                  "Vehicle Number",

                  escortVehicleNumber,

                ],

                [

                  "Name",

                  escortName,

                ],

                [

                  "Contact Number",

                  escortContactNumber,

                ],

              ]}

            />

            <Vehicle_PersonSection

              className="supervisor-section"

              icon={

                <CheckCircle2

                  size={11}

                />

              }

              title="Supervisor Details"

              rows={[

                [

                  "Name",

                  supervisorName,

                ],

                [

                  "Contact",

                  supervisorContact,

                ],

              ]}

            />

          </div>

        </>

      )}

    </section>

  );

};

const Vehicle_TripDetailRow = ({

  label,

  value,

}) => (

  <div className="trip-detail-row">

    <span className="trip-detail-label">

      {label}

    </span>

    <span className="trip-detail-colon">

      :

    </span>

    <strong className="trip-detail-value">

      {Vehicle_safeText(value)}

    </strong>

  </div>

);



/* =========================================

   API

\========================================= */

const API_BASE_URL = (

  import.meta.env.VITE_API_URL ||

  "http://localhost:5000"

).replace(/\/+$/, "");

const API_URL =

  `${API_BASE_URL}/api/triporders`;

/* =========================================

   STATUS FILTERS

\========================================= */

const statusOptions = [

  "All",

  "Moving",

  "Idle",

  "Breakdown",

  "Pending",

  "Reached",

];

/* =========================================

   HELPERS

\========================================= */

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

const normalizeNumber = (

  value,

  fallback = 0

) => {

  if (

    value === null ||

    value === undefined ||

    value === ""

  ) {

    return fallback;

  }

  const number = Number(value);

  return Number.isFinite(number)

    ? number

    : fallback;

};

const normalizeNullableNumber = (

  value

) => {

  if (

    value === null ||

    value === undefined ||

    value === ""

  ) {

    return null;

  }

  const number = Number(value);

  return Number.isFinite(number)

    ? number

    : null;

};

const normalizeDate = (value) => {

  if (!value) {

    return null;

  }

  const date = new Date(value);

  if (

    Number.isNaN(

      date.getTime()

    )

  ) {

    return null;

  }

  return date.toISOString();

};

const getResponseArray = (

  payload

) => {

  if (Array.isArray(payload)) {

    return payload;

  }

  if (

    Array.isArray(

      payload?.data

    )

  ) {

    return payload.data;

  }

  if (

    Array.isArray(

      payload?.trips

    )

  ) {

    return payload.trips;

  }

  if (

    Array.isArray(

      payload?.orders

    )

  ) {

    return payload.orders;

  }

  return [];

};

/* =========================================

   LATEST TRACKING

\========================================= */

const getLatestTracking = (

  allocation

) => {

  const history =

    safeArray(

      allocation?.dailyTracking

    );

  if (!history.length) {

    return null;

  }

  return history[

    history.length - 1

  ];

};

/* =========================================

   FINAL VEHICLE DISPLAY STATUS

\========================================= */

const getFinalVehicleStatus = (vehicle) => {

  const latest = getLatestTracking(vehicle);

  const rawStatus = safeText(

    latest?.status || vehicle?.status,

    "Idle"

  ).trim().toLowerCase();

  if (rawStatus === "moving") return "Moving";

  if (rawStatus === "breakdown") return "Breakdown";

  if (rawStatus === "idle" || rawStatus === "stopped") return "Idle";

  if (rawStatus !== "reached") return "Idle";

  const unloadingCompleted =

    safeText(

      vehicle?.unloading?.status,

      vehicle?.unloadingStatus || ""

    ).trim().toLowerCase() === "completed";

  const lrCompleted = Boolean(

    vehicle?.lr?.number ||

    vehicle?.lr?.date ||

    vehicle?.pod?.fileName

  );

  const ewayStatus = safeText(

    vehicle?.ewayBill?.status,

    ""

  ).trim().toLowerCase();

  const ewayCompleted = Boolean(

    (vehicle?.ewayBill?.number || vehicle?.ewayBill?.fileName) &&

    ewayStatus !== "pending" &&

    ewayStatus !== "expired"

  );

  return unloadingCompleted && lrCompleted && ewayCompleted

    ? "Reached"

    : "Pending";

};

/* =========================================

   FINAL TRIP DISPLAY STATUS

   One trip always has one overall status.

\========================================= */

const getFinalTripStatus = (trip) => {

  const vehicles = safeArray(

    trip?.allocatedVehicles

  );

  if (!vehicles.length) {

    return "Pending";

  }

  const statuses = vehicles.map(

    (vehicle) =>

      getFinalVehicleStatus(vehicle)

  );

  if (

    statuses.every(

      (status) => status === "Reached"

    )

  ) {

    return "Reached";

  }

  if (

    statuses.some(

      (status) => status === "Breakdown"

    )

  ) {

    return "Breakdown";

  }

  if (

    statuses.some(

      (status) => status === "Moving"

    )

  ) {

    return "Moving";

  }

  if (

    statuses.some(

      (status) => status === "Pending"

    )

  ) {

    return "Pending";

  }

  return "Idle";

};

/* =========================================

   RESOLVE REQUIREMENT

\========================================= */

const getRequirement = (

  trip,

  requirementId

) =>

  safeArray(

    trip?.vehicleRequirements

  ).find(

    (requirement) =>

      requirement.requirementId ===

      requirementId

  ) || null;

/* =========================================

   RESOLVE CONFIRMATION

\========================================= */

const getConfirmation = (

  trip,

  allocation

) => {

  const confirmations =

    safeArray(

      trip?.vehicleConfirmations

    );

  if (

    allocation?.confirmationId

  ) {

    const direct =

      confirmations.find(

        (confirmation) =>

          confirmation.confirmationId ===

          allocation.confirmationId

      );

    if (direct) {

      return direct;

    }

  }

  return (

    confirmations.find(

      (confirmation) =>

        confirmation.requirementId ===

        allocation?.requirementId &&

        confirmation.status ===

        "Approved"

    ) || null

  );

};

/* =========================================

   RESOLVE QUOTATION

\========================================= */

const getQuotation = (

  trip,

  allocation

) => {

  const confirmation =

    getConfirmation(

      trip,

      allocation

    );

  const quotationId =

    allocation?.quotationId ||

    confirmation?.quotationId;

  if (!quotationId) {

    return null;

  }

  return (

    safeArray(

      trip?.trafficQuotations

    ).find(

      (quotation) =>

        quotation.quotationId ===

        quotationId

    ) || null

  );

};

/* =========================================

   NORMALIZE ALLOCATION

\========================================= */

const normalizeAllocation = (

  allocation = {},

  trip = {},

  index = 0

) => {

  const latest =

    getLatestTracking(

      allocation

    );

  const requirement =

    getRequirement(

      trip,

      allocation.requirementId

    );

  const quotation =

    getQuotation(

      trip,

      allocation

    );

  const allocationId =

    safeText(

      allocation.allocationId

    ) ||

    safeText(

      allocation._id

    ) ||

    `allocation-${index}`;

  return {

    ...allocation,

    id: allocationId,

    allocationId,

    requirementId:

      safeText(

        allocation.requirementId

      ),

    confirmationId:

      safeText(

        allocation.confirmationId

      ),

    quotationId:

      safeText(

        allocation.quotationId

      ),

    vehicleNumber:

      safeText(

        allocation.vehicleNumber

      ),

    /* Requirement information */

    vehicleType:

      safeText(

        requirement?.vehicleType

      ),

    configuration:

      safeText(

        requirement?.configuration

      ),

    classification:

      safeText(

        requirement?.classification

      ),

    /* Transporter

       Resolved only for child UI convenience.

       Amount is intentionally NOT exposed here.

    */

    transporter:

      safeText(

        quotation?.transporter

      ),

    /* Driver */

    driver:

      allocation.driver || {

        name: "",

        contactNumber: "",

      },

    driverName:

      safeText(

        allocation?.driver?.name

      ),

    driverNumber:

      safeText(

        allocation

          ?.driver

          ?.contactNumber

      ),

    /* Escort */

    escort:

      allocation.escort || {

        vehicleNumber: "",

        name: "",

        contactNumber: "",

      },

    escortVehicleNumber:

      safeText(

        allocation

          ?.escort

          ?.vehicleNumber

      ),

    escortName:

      safeText(

        allocation

          ?.escort

          ?.name

      ),

    escortContactNumber:

      safeText(

        allocation

          ?.escort

          ?.contactNumber

      ),

    /* Supervisor */

    supervisor:

      allocation.supervisor || {

        name: "",

        contactNumber: "",

      },

    supervisorName:

      safeText(

        allocation

          ?.supervisor

          ?.name

      ),

    supervisorContact:

      safeText(

        allocation

          ?.supervisor

          ?.contactNumber

      ),

    /* Loading */

    loading:

      allocation.loading || {},

    loadingStatus:

      safeText(

        allocation

          ?.loading

          ?.status,

        "Pending"

      ) || "Pending",

    loadingPointInDate:

      normalizeDate(

        allocation

          ?.loading

          ?.pointInDate

      ),

    loadingDate:

      normalizeDate(

        allocation

          ?.loading

          ?.loadingDate

      ),

    loadingPointOutDate:

      normalizeDate(

        allocation

          ?.loading

          ?.pointOutDate

      ),

    loadingHaltingDays:

      normalizeNumber(

        allocation

          ?.loading

          ?.haltingDays

      ),

    loadingRemarks:

      safeText(

        allocation

          ?.loading

          ?.remarks

      ),

    /* Unloading */

    unloading:

      allocation.unloading || {},

    unloadingStatus:

      safeText(

        allocation

          ?.unloading

          ?.status,

        "Pending"

      ) || "Pending",

    unloadingPointInDate:

      normalizeDate(

        allocation

          ?.unloading

          ?.pointInDate

      ),

    unloadingDate:

      normalizeDate(

        allocation

          ?.unloading

          ?.unloadingDate

      ),

    unloadingPointOutDate:

      normalizeDate(

        allocation

          ?.unloading

          ?.pointOutDate

      ),

    unloadingHaltingDays:

      normalizeNumber(

        allocation

          ?.unloading

          ?.haltingDays

      ),

    unloadingRemarks:

      safeText(

        allocation

          ?.unloading

          ?.remarks

      ),

    /* Latest movement derived from dailyTracking */

    dailyTracking:

      safeArray(

        allocation.dailyTracking

      ),

    latestTracking:

      latest,

    status:

      safeText(

        latest?.status,

        "Idle"

      ) || "Idle",

    currentLocation:

      safeText(

        latest?.currentLocation

      ),

    currentPosition:

      safeText(

        latest?.currentLocation

      ),

    yesterdayLocation:

      safeText(

        latest?.yesterdayLocation

      ),

    yesterdayPosition:

      safeText(

        latest?.yesterdayLocation

      ),

    yesterdayKm:

      normalizeNumber(

        latest?.yesterdayKm

      ),

    todayKm:

      normalizeNumber(

        latest?.todayKm

      ),

    runningKm:

      normalizeNumber(

        latest?.runningKm

      ),

    currentDay:

      normalizeNullableNumber(

        latest?.day

      ),

    latitude:

      normalizeNullableNumber(

        latest?.latitude

      ),

    longitude:

      normalizeNullableNumber(

        latest?.longitude

      ),

    speed:

      normalizeNumber(

        latest?.speed

      ),

    remarks:

      safeText(

        latest?.remarks

      ),

    updatedBy:

      safeText(

        latest?.updatedBy

      ),

    lastUpdated:

      normalizeDate(

        latest?.updatedAt ||

        latest?.date

      ),

  };

};

/* =========================================

   NORMALIZE TRIP

\========================================= */

const normalizeTrip = (

  trip = {},

  index = 0

) => {

  const id =

    safeText(trip._id) ||

    safeText(trip.tripId) ||

    `trip-${index}`;

  const allocations =

    safeArray(

      trip.allocatedVehicles

    ).map(

      (

        allocation,

        allocationIndex

      ) =>

        normalizeAllocation(

          allocation,

          trip,

          allocationIndex

        )

    );

  const placementDate =

    normalizeDate(

      trip.placementDate

    );

  const enquiryDate =

    normalizeDate(

      trip.enquiryDate

    );

  const createdAt =

    normalizeDate(

      trip.createdAt

    );

  const updatedAt =

    normalizeDate(

      trip.updatedAt

    );

  /*

   * Date used by the existing Tracking date filter.

   * Placement Date is the canonical operational date.

   * If not available, Enquiry/Created date is fallback.

   */

  const filterDateSource =

    placementDate ||

    enquiryDate ||

    createdAt;

  const tripDate =

    filterDateSource

      ? filterDateSource.slice(

        0,

        10

      )

      : "";

  return {

    ...trip,

    id,

    _id:

      safeText(

        trip._id

      ),

    tripId:

      safeText(

        trip.tripId

      ),

    movementType:

      safeText(

        trip.movementType

      ),

    customer:

      safeText(

        trip.customer

      ),

    contactPerson:

      safeText(

        trip.contactPerson

      ),

    contactNumber:

      safeText(

        trip.contactNumber

      ),

    email:

      safeText(

        trip.email

      ),

    assignedKam:

      safeText(

        trip.assignedKam

      ),

    materialType:

      safeText(

        trip.materialType

      ),

    origin:

      safeText(

        trip.origin

      ),

    destination:

      safeText(

        trip.destination

      ),

    distance:

      normalizeNumber(

        trip.distance

      ),

    routeLocations:

      safeArray(

        trip.routeLocations

      )

        .map(

          (location) =>

            safeText(

              location

            ).trim()

        )

        .filter(Boolean),

    remark:

      safeText(

        trip.remark

      ),

    siteLocation:

      safeText(

        trip.siteLocation

      ),

    period:

      safeText(

        trip.period

      ),

    dieselScope:

      safeText(

        trip.dieselScope

      ),

    status:

      safeText(

        trip.status,

        "Pending"

      ),

    stage:

      safeText(

        trip.stage

      ),

    orderApproval:

      trip.orderApproval || {},

    vehicleRequirements:

      safeArray(

        trip.vehicleRequirements

      ),

    trafficQuotations:

      safeArray(

        trip.trafficQuotations

      ),

    vehicleConfirmations:

      safeArray(

        trip.vehicleConfirmations

      ),

    allocatedVehicles:

      allocations,

    placementDate,

    enquiryDate,

    createdAt,

    updatedAt,

    tripDate,

  };

};

/* =========================================

   TRACKING COMPONENT

\========================================= */

const Tracking = () => {

  /* =====================================

     STATE

  ===================================== */

  const [

    trips,

    setTrips,

  ] = useState([]);

  const [

    loading,

    setLoading,

  ] = useState(true);

  const [

    apiError,

    setApiError,

  ] = useState("");

  const [

    searchTerm,

    setSearchTerm,

  ] = useState("");

  const [

    movementFilter,

    setMovementFilter,

  ] = useState("All");

  const [

    selectedDate,

    setSelectedDate,

  ] = useState("");

  const [

    selectedTripId,

    setSelectedTripId,

  ] = useState(null);

  const [

    selectedVehicleId,

    setSelectedVehicleId,

  ] = useState(null);

  /* =====================================

     FETCH TRIPS

  ===================================== */

  const fetchTrips =

    useCallback(async () => {

      try {

        setLoading(true);

        setApiError("");

        const response =

          await fetch(

            API_URL,

            {

              method: "GET",

              headers: {

                Accept:

                  "application/json",

              },

            }

          );

        const result =

          await response

            .json()

            .catch(

              () => ({})

            );

        if (!response.ok) {

          throw new Error(

            result?.message ||

            `Unable to load trips (${response.status})`

          );

        }

        const databaseTrips =

          getResponseArray(

            result

          );

        /*

         * Tracking Page should contain

         * operational trips only.

         *

         * A trip becomes operational after

         * at least one actual vehicle has

         * been allocated in Tracking Input.

         */

        const normalizedTrips =

          databaseTrips

            .filter((trip) => {

              const stage =

                safeText(

                  trip?.stage

                )

                  .trim()

                  .toLowerCase();

              const orderPlacedStatus =

                safeText(

                  trip?.orderPlaced?.status

                )

                  .trim()

                  .toLowerCase();

              return (

                orderPlacedStatus === "completed" ||

                stage === "tracking" ||

                stage === "trip complete" ||

                stage === "trip completed" ||

                stage === "completed"

              );

            })

            .map(

              (

                trip,

                index

              ) =>

                normalizeTrip(

                  trip,

                  index

                )

            );

        setTrips(

          normalizedTrips

        );

        setSelectedTripId(

          (previousId) => {

            if (

              normalizedTrips.length ===

              0

            ) {

              return null;

            }

            const exists =

              normalizedTrips.some(

                (trip) =>

                  trip.id ===

                  previousId

              );

            if (exists) {

              return previousId;

            }

            return normalizedTrips[0]

              .id;

          }

        );

      } catch (error) {

        console.error(

          "Fetch Trips Error:",

          error

        );

        setTrips([]);

        setSelectedTripId(

          null

        );

        setSelectedVehicleId(

          null

        );

        setApiError(

          error?.message ||

          "Unable to load trips."

        );

      } finally {

        setLoading(false);

      }

    }, []);

  /* =====================================

     INITIAL LOAD

  ===================================== */

  useEffect(() => {

    fetchTrips();

  }, [fetchTrips]);

  /* =====================================

     REFRESH WHEN WINDOW GETS FOCUS

  ===================================== */

  useEffect(() => {

    const handleFocus =

      () => {

        fetchTrips();

      };

    window.addEventListener(

      "focus",

      handleFocus

    );

    return () => {

      window.removeEventListener(

        "focus",

        handleFocus

      );

    };

  }, [fetchTrips]);

  /* =====================================

     STATUS COUNTS

  ===================================== */

  const statusCounts =

    useMemo(() => {

      const counts = {

        All: trips.length,

        Moving: 0,

        Idle: 0,

        Breakdown: 0,

        Pending: 0,

        Reached: 0,

      };

      trips.forEach((trip) => {

        const tripStatus =

          getFinalTripStatus(trip);

        if (

          Object.prototype.hasOwnProperty.call(

            counts,

            tripStatus

          )

        ) {

          counts[tripStatus] += 1;

        }

      });

      return counts;

    }, [trips]);

  /* =====================================

     FILTER TRIPS

  ===================================== */

  const filteredTrips =

    useMemo(() => {

      const search =

        searchTerm

          .trim()

          .toLowerCase();

      return trips.filter(

        (trip) => {

          const vehicles =

            safeArray(

              trip.allocatedVehicles

            );

          /* SEARCH */

          const searchFields = [

            trip.tripId,

            trip.customer,

            trip.contactPerson,

            trip.contactNumber,

            trip.email,

            trip.assignedKam,

            trip.materialType,

            trip.origin,

            trip.destination,

            trip.siteLocation,

            ...vehicles.map(

              (vehicle) =>

                vehicle.vehicleNumber

            ),

            ...vehicles.map(

              (vehicle) =>

                vehicle.vehicleType

            ),

            ...vehicles.map(

              (vehicle) =>

                vehicle.transporter

            ),

            ...vehicles.map(

              (vehicle) =>

                vehicle.driverName

            ),

            ...vehicles.map(

              (vehicle) =>

                vehicle.driverNumber

            ),

            ...vehicles.map(

              (vehicle) =>

                vehicle.escortName

            ),

            ...vehicles.map(

              (vehicle) =>

                vehicle.supervisorName

            ),

            ...vehicles.map(

              (vehicle) =>

                vehicle.currentLocation

            ),

          ];

          const matchesSearch =

            !search ||

            searchFields.some(

              (value) =>

                safeText(

                  value

                )

                  .toLowerCase()

                  .includes(

                    search

                  )

            );

          /* DATE */

          const matchesDate =

            !selectedDate ||

            trip.tripDate ===

            selectedDate ||

            vehicles.some(

              (vehicle) =>

                safeArray(

                  vehicle.dailyTracking

                ).some(

                  (tracking) => {

                    const date =

                      normalizeDate(

                        tracking.date

                      );

                    return (

                      date?.slice(

                        0,

                        10

                      ) ===

                      selectedDate

                    );

                  }

                )

            );

          /* STATUS */

          const matchesStatus =

            movementFilter === "All" ||

            getFinalTripStatus(trip) ===

            movementFilter;

          return (

            matchesSearch &&

            matchesDate &&

            matchesStatus

          );

        }

      );

    }, [

      trips,

      searchTerm,

      selectedDate,

      movementFilter,

    ]);

  /* =====================================

     SELECTED TRIP

  ===================================== */

  const selectedTrip =

    useMemo(

      () =>

        filteredTrips.find(

          (trip) =>

            trip.id ===

            selectedTripId

        ) ||

        filteredTrips[0] ||

        null,

      [

        filteredTrips,

        selectedTripId,

      ]

    );

  /* =====================================

     KEEP SELECTED TRIP VALID

  ===================================== */

  useEffect(() => {

    if (

      filteredTrips.length ===

      0

    ) {

      setSelectedTripId(

        null

      );

      return;

    }

    const exists =

      filteredTrips.some(

        (trip) =>

          trip.id ===

          selectedTripId

      );

    if (!exists) {

      setSelectedTripId(

        filteredTrips[0].id

      );

    }

  }, [

    filteredTrips,

    selectedTripId,

  ]);

  /* =====================================

     KEEP SELECTED VEHICLE VALID

  ===================================== */

  useEffect(() => {

    const vehicles =

      safeArray(

        selectedTrip

          ?.allocatedVehicles

      );

    if (

      !selectedTrip ||

      vehicles.length === 0

    ) {

      setSelectedVehicleId(

        null

      );

      return;

    }

    const vehicleExists =

      vehicles.some(

        (vehicle) =>

          vehicle.allocationId ===

          selectedVehicleId ||

          vehicle.id ===

          selectedVehicleId

      );

    if (!vehicleExists) {

      setSelectedVehicleId(

        vehicles[0]

          .allocationId ||

        vehicles[0].id

      );

    }

  }, [

    selectedTrip,

    selectedVehicleId,

  ]);

  /* =====================================

     SELECTED VEHICLE

  ===================================== */

  const selectedVehicle =

    useMemo(() => {

      const vehicles =

        safeArray(

          selectedTrip

            ?.allocatedVehicles

        );

      return (

        vehicles.find(

          (vehicle) =>

            vehicle.allocationId ===

            selectedVehicleId ||

            vehicle.id ===

            selectedVehicleId

        ) ||

        vehicles[0] ||

        null

      );

    }, [

      selectedTrip,

      selectedVehicleId,

    ]);

  /* =====================================

     STATUS CLASS

  ===================================== */

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

  /* =====================================

     STATUS ICON

  ===================================== */

  const getStatusIcon = (

    status

  ) => {

    if (

      status === "Moving"

    ) {

      return (

        <Navigation

          size={13}

        />

      );

    }

    if (

      status === "Reached"

    ) {

      return (

        <CheckCircle2

          size={13}

        />

      );

    }

    if (

      status === "Idle"

    ) {

      return (

        <Clock3

          size={13}

        />

      );

    }

    if (

      status ===

      "Breakdown"

    ) {

      return (

        <CircleAlert

          size={13}

        />

      );

    }

    return (

      <CirclePause

        size={13}

      />

    );

  };

  /* =====================================

     SELECT TRIP

  ===================================== */

  const handleTripSelect = (

    trip

  ) => {

    if (!trip) {

      return;

    }

    setSelectedTripId(

      trip.id

    );

    const vehicles =

      safeArray(

        trip.allocatedVehicles

      );

    if (vehicles.length) {

      setSelectedVehicleId(

        vehicles[0]

          .allocationId ||

        vehicles[0].id

      );

    } else {

      setSelectedVehicleId(

        null

      );

    }

  };

  /* =====================================

     SELECT VEHICLE

  ===================================== */

  const handleVehicleSelect = (

    vehicleOrId

  ) => {

    if (!vehicleOrId) {

      return;

    }

    if (

      typeof vehicleOrId ===

      "string"

    ) {

      setSelectedVehicleId(

        vehicleOrId

      );

      return;

    }

    setSelectedVehicleId(

      vehicleOrId.allocationId ||

      vehicleOrId.id ||

      null

    );

  };

  /* =====================================

     CLEAR FILTERS

  ===================================== */

  const clearAllFilters =

    () => {

      setSearchTerm("");

      setMovementFilter(

        "All"

      );

      setSelectedDate("");

    };

  /* =====================================

     RENDER

  ===================================== */

  return (

    <main className="tracking-page">

      {/* HEADER */}

      <header className="tracking-header">

        <div className="tracking-header-content" />

      </header>

      {/* API ERROR */}

      {apiError && (

        <div className="tracking-api-error">

          {apiError}

        </div>

      )}

      {/* TOOLBAR */}

      <section className="tracking-toolbar">

        {/* STATUS FILTER */}

        <div className="tracking-status-filter">

          {statusOptions.map(

            (status) => {

              const active =

                movementFilter ===

                status;

              return (

                <button

                  type="button"

                  key={status}

                  className={

                    active

                      ? "active"

                      : ""

                  }

                  onClick={() =>

                    setMovementFilter(

                      status

                    )

                  }

                >

                  {status !==

                    "All" &&

                    getStatusIcon(

                      status

                    )}

                  <span>

                    {status}

                  </span>

                  <small className="tracking-status-count">

                    {

                      statusCounts[

                      status

                      ]

                    }

                  </small>

                </button>

              );

            }

          )}

        </div>

        {/* SEARCH */}

        <div className="tracking-search">

          <Search

            size={18}

          />

          <input

            type="search"

            placeholder="Search trip, customer or vehicle..."

            value={

              searchTerm

            }

            onChange={(

              event

            ) =>

              setSearchTerm(

                event.target

                  .value

              )

            }

          />

          {searchTerm && (

            <button

              type="button"

              className="tracking-search-clear"

              onClick={() =>

                setSearchTerm(

                  ""

                )

              }

              aria-label="Clear search"

            >

              <X

                size={15}

              />

            </button>

          )}

        </div>

        {/* DATE FILTER */}

        <label className="tracking-date">

          <CalendarDays

            size={17}

          />

          <input

            type="date"

            value={

              selectedDate

            }

            onChange={(

              event

            ) =>

              setSelectedDate(

                event.target

                  .value

              )

            }

          />

          {selectedDate && (

            <button

              type="button"

              className="tracking-date-clear"

              onClick={(

                event

              ) => {

                event.preventDefault();

                event.stopPropagation();

                setSelectedDate(

                  ""

                );

              }}

              aria-label="Clear selected date"

            >

              <X

                size={14}

              />

            </button>

          )}

        </label>

      </section>

      {/* CONTENT */}

      {loading ? (

        <div className="tracking-loading-state">

          Loading trips...

        </div>

      ) : filteredTrips.length === 0 ? (

        <div className="tracking-no-results">

          <div className="tracking-no-results-content">

            <div

              className={`tracking-no-results-icon ${apiError

                ? "error"

                : movementFilter === "Breakdown"

                  ? "warning"

                  : ""

                }`}

            >

              {apiError || movementFilter === "Breakdown" ? (

                <CircleAlert size={24} strokeWidth={1.8} />

              ) : (

                <Search size={24} strokeWidth={1.8} />

              )}

            </div>

            <h3 className="tracking-no-results-title">

              {apiError

                ? "Unable to Load Trips"

                : selectedDate

                  ? "No Trips Found On This Date"

                  : movementFilter !== "All"

                    ? `No ${movementFilter} Trips Found`

                    : searchTerm

                      ? "No Matching Trips Found"

                      : "No Trips Found"}

            </h3>

            <p className="tracking-no-results-description">

              {apiError

                ? "Unable to load tracking data from the server."

                : selectedDate

                  ? `No trip records are available for ${selectedDate}.`

                  : movementFilter === "Breakdown"

                    ? "There are currently no trips containing a vehicle with Breakdown status."

                    : trips.length === 0

                      ? "There are no allocated vehicles available for tracking yet."

                      : searchTerm

                        ? "No trips match your current search."

                        : "No trips match the selected filter."}

            </p>

            {!apiError &&

              trips.length === 0 &&

              !searchTerm &&

              !selectedDate &&

              movementFilter === "All" && (

                <span className="tracking-no-results-hint">

                  Trips will appear here once a vehicle is allocated.

                </span>

              )}

            {(searchTerm || selectedDate || movementFilter !== "All") && (

              <button

                type="button"

                className="tracking-no-results-action"

                onClick={clearAllFilters}

              >

                <X size={14} strokeWidth={2} />

                <span>Clear Filters</span>

              </button>

            )}

          </div>

        </div>

      ) : (

        <section className="tracking-layout tracking-layout-no-map">

          {/* TRIP LIST */}

          <TripListColumn

            trips={

              filteredTrips

            }

            selectedTrip={

              selectedTrip

            }

            onSelectTrip={

              handleTripSelect

            }

          />

          {/* VEHICLE DETAILS */}

          <VehicleColumn

            trip={

              selectedTrip

            }

            selectedVehicle={

              selectedVehicle

            }

            onSelectVehicle={

              handleVehicleSelect

            }

            getStatusClass={

              getStatusClass

            }

            getStatusIcon={

              getStatusIcon

            }

          />

          {/* MAP */}

        </section>

      )}

    </main>

  );

};

export default Tracking;
