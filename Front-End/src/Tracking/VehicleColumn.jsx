import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CirclePause,
  ExternalLink,
  FileText,
  MessageSquareText,
  Navigation,
  Package,
  PackageCheck,
  Route,
  Truck,
} from "lucide-react";
import "./VehicleColumn.css";
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");
const TRIP_API_URL = `${API_BASE_URL}/api/triporders`;
const safeArray = (value) =>
  Array.isArray(value) ? value : [];
const safeText = (value, fallback = "-") => {
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
const getSafeDateValue = (value) => {
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
      return getSafeDateValue(value.$date);
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
const formatDate = (value) => {
  const safeValue = getSafeDateValue(value);
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
const formatLastUpdated = (value) => {
  const safeValue = getSafeDateValue(value);
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
const formatKm = (value) => {
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
const formatDays = (value) => {
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
const getVehicleId = (vehicle) => {
  if (!vehicle) {
    return "";
  }
  return (
    safeText(vehicle.allocationId, "") ||
    safeText(vehicle._id, "") ||
    safeText(vehicle.vehicleNumber, "")
  );
};
const getLatestTracking = (vehicle) => {
  const dailyTracking = safeArray(
    vehicle?.dailyTracking
  );
  if (!dailyTracking.length) {
    return null;
  }
  return dailyTracking[
    dailyTracking.length - 1
  ];
};
const getVehicleStatus = (vehicle) => {
  const latestTracking = getLatestTracking(vehicle);
  const rawStatus = safeText(latestTracking?.status, "Idle");
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
const getRequirement = (trip, vehicle) => {
  if (!trip || !vehicle) {
    return null;
  }
  return (
    safeArray(
      trip.vehicleRequirements
    ).find(
      (requirement) =>
        safeText(
          requirement.requirementId,
          ""
        ) ===
        safeText(
          vehicle.requirementId,
          ""
        )
    ) || null
  );
};
const getConfirmation = (trip, vehicle) => {
  if (!trip || !vehicle) {
    return null;
  }
  const confirmations = safeArray(
    trip.vehicleConfirmations
  );
  if (vehicle.confirmationId) {
    const confirmation =
      confirmations.find(
        (item) =>
          safeText(
            item.confirmationId,
            ""
          ) ===
          safeText(
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
        safeText(
          item.requirementId,
          ""
        ) ===
        safeText(
          vehicle.requirementId,
          ""
        ) &&
        item.status === "Approved"
    ) || null
  );
};
const getQuotation = (trip, vehicle) => {
  if (!trip || !vehicle) {
    return null;
  }
  const quotations = safeArray(
    trip.trafficQuotations
  );
  if (vehicle.quotationId) {
    const quotation = quotations.find(
      (item) =>
        safeText(
          item.quotationId,
          ""
        ) ===
        safeText(
          vehicle.quotationId,
          ""
        )
    );
    if (quotation) {
      return quotation;
    }
  }
  const confirmation =
    getConfirmation(trip, vehicle);
  if (!confirmation?.quotationId) {
    return null;
  }
  return (
    quotations.find(
      (item) =>
        safeText(
          item.quotationId,
          ""
        ) ===
        safeText(
          confirmation.quotationId,
          ""
        )
    ) || null
  );
};
const DetailRow = ({
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
      {safeText(value)}
    </strong>
  </div>
);
const PersonSection = ({
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
          <strong className="simple-detail-value">{safeText(value)}</strong>
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
  const vehicles = safeArray(
    trip.allocatedVehicles
  );
  const selectedVehicleId =
    typeof selectedVehicle === "object"
      ? getVehicleId(selectedVehicle)
      : safeText(
        selectedVehicle,
        ""
      );
  const activeVehicle =
    vehicles.find(
      (vehicle) =>
        getVehicleId(vehicle) ===
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
        getVehicleId(vehicle) ===
        selectedVehicleId
    ) || null;
  const handleVehicleSelect = (
    vehicle
  ) => {
    const vehicleId =
      getVehicleId(vehicle);
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
    return safeText(
      status,
      "Idle"
    )
      .toLowerCase()
      .replaceAll(" ", "-");
  };
  const latestTracking =
    getLatestTracking(activeVehicle);
  const requirement =
    getRequirement(
      trip,
      activeVehicle
    );
  const quotation =
    getQuotation(
      trip,
      activeVehicle
    );
  const vehicleStatus =
    getVehicleStatus(
      activeVehicle
    );
  const vehicleNumber =
    safeText(
      activeVehicle?.vehicleNumber
    );
  const totalKm = Number(trip.distance) || 0;
  const trackingHistory = safeArray(activeVehicle?.dailyTracking);
  const kmCovered = trackingHistory.reduce((total, tracking) => {
    const dailyRunningKm = Number(tracking?.runningKm);
    if (!Number.isFinite(dailyRunningKm) || dailyRunningKm < 0) {
      return total;
    }
    return total + dailyRunningKm;
  }, 0);
  const balanceKm = Math.max(totalKm - kmCovered, 0);
  const currentPosition =
    safeText(
      latestTracking?.currentLocation
    );
  const normalizeRouteLocation = (value) =>
    safeText(value, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  const getRouteLocationText = (value) => {
    if (typeof value === "string" || typeof value === "number") {
      return safeText(value, "").trim();
    }
    if (value && typeof value === "object") {
      return safeText(
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
        .split(/\s*(?:→|->|>|,|\|)\s*/)
        .filter(Boolean);
    }
    return [];
  })();
  const enteredRouteLocations = rawRouteLocations
    .map(getRouteLocationText)
    .filter(Boolean);
  const originLocation = safeText(trip?.origin, "").trim();
  const destinationLocation = safeText(trip?.destination, "").trim();
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
    safeText(
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
    formatLastUpdated(
      latestTracking?.updatedAt
    );
  const vehicleType =
    safeText(
      requirement?.vehicleType
    );
  const configuration =
    safeText(
      requirement?.configuration
    );
  const classification =
    safeText(
      requirement?.classification
    );
  const transporter =
    safeText(
      quotation?.transporter
    );
  const loading =
    activeVehicle?.loading || {};
  const loadingStatus =
    safeText(
      loading.status,
      "Pending"
    );
  const loadingPointInDate =
    formatDate(
      loading.pointInDate
    );
  const loadingDate =
    formatDate(
      loading.loadingDate
    );
  const loadingPointOutDate =
    formatDate(
      loading.pointOutDate
    );
  const loadingHaltingDays =
    loading.haltingDays ??
    null;
  const loadingRemarks =
    safeText(
      loading.remarks
    );
  const unloading =
    activeVehicle?.unloading || {};
  const unloadingStatus =
    safeText(
      unloading.status,
      "Pending"
    );
  const unloadingPointInDate =
    formatDate(
      unloading.pointInDate
    );
  const unloadingDate =
    formatDate(
      unloading.unloadingDate
    );
  const unloadingPointOutDate =
    formatDate(
      unloading.pointOutDate
    );
  const unloadingHaltingDays =
    unloading.haltingDays ??
    null;
  const unloadingRemarks =
    safeText(
      unloading.remarks
    );
  const driver =
    activeVehicle?.driver || {};
  const driverName =
    safeText(driver.name);
  const driverNumber =
    safeText(
      driver.contactNumber
    );
  const escort =
    activeVehicle?.escort || {};
  const escortVehicleNumber =
    safeText(
      escort.vehicleNumber
    );
  const escortName =
    safeText(escort.name);
  const escortContactNumber =
    safeText(
      escort.contactNumber
    );
  const supervisor =
    activeVehicle?.supervisor || {};
  const supervisorName =
    safeText(
      supervisor.name
    );
  const supervisorContact =
    safeText(
      supervisor.contactNumber
    );
  const lr = activeVehicle?.lr || {};
  const pod = activeVehicle?.pod || {};
  const ewayBill = activeVehicle?.ewayBill || {};
  const lrNumber = safeText(lr.number);
  const lrDate = formatDate(lr.date);
  const lrRemarks = safeText(lr.remarks);
  const lrStatus =
    lr.number || lr.date || pod.fileName
      ? "Completed"
      : "Pending";
  const podStatus = pod?.fileName
    ? "Uploaded"
    : "Pending";
  const ewayBillNumber = safeText(ewayBill.number);
  const ewayBillValidUpto = formatDate(ewayBill.validUpto);
  const ewayBillStatus = safeText(ewayBill.status, "Pending");
  const getEwayDaysLeft = (value) => {
    const raw = getSafeDateValue(value);
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
    safeText(status, "Pending")
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
      `${TRIP_API_URL}/${mongoId}/allocated-vehicles/${allocationId}/${type}/file?disposition=inline`,
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
      `${TRIP_API_URL}/${mongoId}/allocated-vehicles/${allocationId}/${type}/file?disposition=attachment`,
      "_blank",
      "noopener,noreferrer"
    );
  };
  const customerName =
    safeText(trip.customer);
  const customerContact =
    safeText(
      trip.contactPerson
    );
  const customerPhone =
    safeText(
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
                    getVehicleId(
                      vehicle
                    );
                  const active =
                    selectedVehicleId
                      ? selectedVehicleId ===
                      vehicleId
                      : index === 0;
                  const status =
                    getVehicleStatus(
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
                      title={safeText(
                        vehicle.vehicleNumber,
                        `Vehicle ${index + 1
                        }`
                      )}
                    >
                      <span>
                        {safeText(
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
                        ? safeText(
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
                            getVehicleId(
                              vehicle
                            );
                          const active =
                            selectedVehicleId ===
                            vehicleId;
                          const status =
                            getVehicleStatus(
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
                                {safeText(
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
                {formatKm(
                  totalKm
                )}
              </strong>
            </div>
            <div className="distance-summary-item covered">
              <span>
                KM Covered
              </span>
              <strong>
                {formatKm(
                  kmCovered
                )}
              </strong>
            </div>
            <div className="distance-summary-item balance">
              <span>
                Balance
              </span>
              <strong>
                {formatKm(
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
                    {formatKm(
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
                    {formatKm(
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
                    {formatKm(
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
                  <DetailRow
                    label="LP In Date"
                    value={
                      loadingPointInDate
                    }
                  />
                  <DetailRow
                    label="Loading Date"
                    value={
                      loadingDate
                    }
                  />
                  <DetailRow
                    label="LP Out Date"
                    value={
                      loadingPointOutDate
                    }
                  />
                  <DetailRow
                    label="Halting Days"
                    value={formatDays(
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
                  <DetailRow
                    label="UP In Date"
                    value={
                      unloadingPointInDate
                    }
                  />
                  <DetailRow
                    label="Unloading Date"
                    value={
                      unloadingDate
                    }
                  />
                  <DetailRow
                    label="UP Out Date"
                    value={
                      unloadingPointOutDate
                    }
                  />
                  <DetailRow
                    label="Halting Days"
                    value={formatDays(
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
                  <DetailRow label="LR Number" value={lrNumber} />
                  <DetailRow label="LR Date" value={lrDate} />
                  <DetailRow label="Remarks" value={lrRemarks} />
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
                  <DetailRow label="E-Way Bill No" value={ewayBillNumber} />
                  <DetailRow label="Valid Upto" value={ewayBillValidUpto} />
                  <DetailRow label="Status" value={ewayBillStatus} />
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
                  <span className="pod-file-name" title={safeText(pod?.fileName)}>{safeText(pod?.fileName)}</span>
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
            <PersonSection
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
            <PersonSection
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
            <PersonSection
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
const TripDetailRow = ({
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
      {safeText(value)}
    </strong>
  </div>
);
export default VehicleColumn;
