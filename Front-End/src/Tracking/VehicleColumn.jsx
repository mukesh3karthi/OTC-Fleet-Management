import React, { useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CirclePause,
  MessageSquareText,
  Navigation,
  Package,
  PackageCheck,
  Route,
  Truck,
} from "lucide-react";

import "./VehicleColumn.css";

/* =========================================================
   HELPERS
========================================================= */

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

  return `${numericValue} ${
    numericValue === 1 ? "Day" : "Days"
  }`;
};

/* =========================================================
   ALLOCATED VEHICLE HELPERS
========================================================= */

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
  const latestTracking =
    getLatestTracking(vehicle);

  return safeText(
    latestTracking?.status,
    "Idle"
  );
};

/* =========================================================
   REQUIREMENT
========================================================= */

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

/* =========================================================
   CONFIRMATION
========================================================= */

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

/* =========================================================
   QUOTATION / TRANSPORTER
========================================================= */

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

/* =========================================================
   DETAIL ROW
========================================================= */

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
      className={`simple-detail-value ${
        halting ? "halting" : ""
      }`}
    >
      {safeText(value)}
    </strong>
  </div>
);

/* =========================================================
   PERSON SECTION
========================================================= */

const PersonSection = ({
  className = "",
  icon,
  title,
  rows = [],
}) => (
  <div
    className={`lr-person-section ${className}`}
  >
    <div className="lr-person-heading">
      {icon}

      <strong>{title}</strong>
    </div>

    <div className="lr-person-content">
      {rows.map(([label, value]) => (
        <div
          className="lr-person-row"
          key={label}
        >
          <span>{label}</span>

          <span className="lr-person-colon">
            :
          </span>

          <strong>
            {safeText(value)}
          </strong>
        </div>
      ))}
    </div>
  </div>
);

/* =========================================================
   COMPONENT
========================================================= */

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

  /* =======================================================
     EMPTY TRIP
  ======================================================= */

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

  /* =======================================================
     ALLOCATED VEHICLES
  ======================================================= */

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

  /* =======================================================
     VEHICLE SELECTOR
  ======================================================= */

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

  /* =======================================================
     STATUS
  ======================================================= */

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

  /* =======================================================
     ACTIVE VEHICLE DATA
  ======================================================= */

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

  /* =======================================================
     DISTANCE
  ======================================================= */

  const totalKm =
    Number(trip.distance) || 0;

  /*
   * todayKm represents the latest cumulative
   * travelled KM.
   */
  const kmCovered =
    Number(
      latestTracking?.todayKm
    ) || 0;

  const balanceKm =
    Math.max(
      totalKm - kmCovered,
      0
    );

  /* =======================================================
     MOVEMENT
  ======================================================= */

  const currentPosition =
    safeText(
      latestTracking?.currentLocation
    );

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

  const speed =
    latestTracking?.speed ??
    null;

  const lastUpdated =
    formatLastUpdated(
      latestTracking?.updatedAt
    );

  /* =======================================================
     REQUIREMENT DETAILS
  ======================================================= */

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

  /*
   * IMPORTANT:
   * Quotation amount is intentionally NOT
   * displayed anywhere in Tracking UI.
   */

  /* =======================================================
     LOADING
  ======================================================= */

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

  /* =======================================================
     UNLOADING
  ======================================================= */

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

  /* =======================================================
     DRIVER
  ======================================================= */

  const driver =
    activeVehicle?.driver || {};

  const driverName =
    safeText(driver.name);

  const driverNumber =
    safeText(
      driver.contactNumber
    );

  /* =======================================================
     ESCORT
  ======================================================= */

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

  /* =======================================================
     SUPERVISOR
  ======================================================= */

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

  /* =======================================================
     CUSTOMER
  ======================================================= */

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

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="vehicle-column-panel">
      {/* =====================================
          VEHICLE SELECTOR
      ===================================== */}

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
                      className={`vehicle-number-card ${
                        active
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
                        `Vehicle ${
                          index + 1
                        }`
                      )}
                    >
                      <span>
                        {safeText(
                          vehicle.vehicleNumber,
                          `Vehicle ${
                            index + 1
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
                  className={`vehicle-more-button ${
                    selectedExtraVehicle
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
                            className={`vehicle-more-option ${
                              active
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
                                `Vehicle ${
                                  VISIBLE_VEHICLE_COUNT +
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
          {/* =================================
              CURRENT STATUS
          ================================= */}

          <div className="vehicle-status-strip">
            <div
              className={`status-item ${getVehicleStatusClass(
                vehicleStatus
              )}`}
            >
              {getVehicleStatusIcon(
                vehicleStatus
              )}

              <span>
                Current Status
              </span>

              <strong>
                {vehicleStatus}
              </strong>
            </div>

            <div className="status-item">
              <Navigation
                size={11}
              />

              <span>
                Current Location
              </span>

              <strong>
                {currentPosition}
              </strong>
            </div>

            <div className="status-item">
              <Route size={11} />

              <span>
                Last Updated
              </span>

              <strong>
                {lastUpdated}
              </strong>
            </div>
          </div>

          {/* =================================
              ROUTE
          ================================= */}

          <div className="trip-route-card">
            <div className="trip-route-point">
              <span>
                Origin
              </span>

              <strong>
                {safeText(
                  trip.origin
                )}
              </strong>
            </div>

            <div className="trip-route-direction">
              <span className="route-line" />

              <div className="route-center-content">
                <span className="route-material-name">
                  {safeText(
                    trip.materialType
                  )}
                </span>

                <span className="route-vehicle-icon">
                  <Truck
                    size={13}
                  />
                </span>
              </div>

              <span className="route-line" />
            </div>

            <div className="trip-route-point destination">
              <span>
                Destination
              </span>

              <strong>
                {safeText(
                  trip.destination
                )}
              </strong>
            </div>
          </div>

          {/* =================================
              DISTANCE
          ================================= */}

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

          {/* =================================
              MOVEMENT
          ================================= */}

          <div className="movement-card-section">
            <div className="movement-heading-row">
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

                <strong>
                  {currentPosition}
                </strong>
              </div>

              <div className="movement-info-card">
                <span>
                  Yesterday Position
                </span>

                <strong>
                  {yesterdayPosition}
                </strong>
              </div>

              <div className="movement-info-card">
                <span>
                  Yesterday KM
                </span>

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
                  Speed
                </span>

                <strong>
                  {speed === null ||
                  speed ===
                    undefined ||
                  speed === ""
                    ? "-"
                    : `${speed} km/h`}
                </strong>
              </div>

              <div className="movement-info-card">
                <span>
                  Status
                </span>

                <strong>
                  {vehicleStatus}
                </strong>
              </div>
            </div>
          </div>

          {/* =================================
              REQUIREMENT
          ================================= */}

          <div className="trip-detail-group client-group">
            <div className="trip-detail-group-title">
              <span className="trip-detail-group-icon client">
                <Truck
                  size={12}
                />
              </span>

              <strong>
                Vehicle Requirement
              </strong>
            </div>

            <TripDetailRow
              label="Vehicle Type"
              value={vehicleType}
            />

            <TripDetailRow
              label="Configuration"
              value={
                configuration
              }
            />

            <TripDetailRow
              label="Classification"
              value={
                classification
              }
            />

            <TripDetailRow
              label="Vehicle Number"
              value={
                vehicleNumber
              }
            />
          </div>

          {/* =================================
              TRANSPORTER
          ================================= */}

          <div className="trip-detail-group transporter-group">
            <div className="trip-detail-group-title">
              <span className="trip-detail-group-icon transporter">
                <Truck
                  size={12}
                />
              </span>

              <strong>
                Transporter Details
              </strong>
            </div>

            <TripDetailRow
              label="Transporter"
              value={transporter}
            />
          </div>

          {/* =================================
              CUSTOMER
          ================================= */}

          <div className="trip-detail-group client-group">
            <div className="trip-detail-group-title">
              <span className="trip-detail-group-icon client">
                <Package
                  size={12}
                />
              </span>

              <strong>
                Customer Details
              </strong>
            </div>

            <TripDetailRow
              label="Customer Name"
              value={
                customerName
              }
            />

            <TripDetailRow
              label="Contact Person"
              value={
                customerContact
              }
            />

            <TripDetailRow
              label="Phone No."
              value={
                customerPhone
              }
            />
          </div>

          {/* =================================
              LOADING + UNLOADING
          ================================= */}

          <div className="operation-details-section">
            <div className="operation-main-grid">
              {/* LOADING */}

              <div className="simple-operation-card loading-card">
                <div className="simple-operation-header">
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

              {/* UNLOADING */}

              <div className="simple-operation-card unloading-card">
                <div className="simple-operation-header">
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

          {/* =================================
              DRIVER / ESCORT / SUPERVISOR
          ================================= */}

          <div className="lr-pod-card">
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

/* =========================================================
   TRIP DETAIL ROW
========================================================= */

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