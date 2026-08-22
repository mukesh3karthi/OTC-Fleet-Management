import React, { useMemo, useState } from "react";

import { AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, CirclePause, Clock3, FileSignature, FileText, MessageSquareText, Navigation, Package, PackageCheck, Route, Truck } from "lucide-react";

import "./VehicleColumn.css";

const VehicleColumn = ({
  trip,
  selectedVehicle,
  onSelectVehicle,
  getStatusClass,
}) => {
  const [
    showVehicles,
    setShowVehicles,
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
            Select a trip to view
            vehicle information.
          </p>
        </div>
      </section>
    );
  }

  const vehicles =
    Array.isArray(
      trip.vehicles
    )
      ? trip.vehicles
      : [];

  const getVehicleId = (
    vehicle
  ) =>
    vehicle?._id ||
    vehicle?.id ||
    vehicle?.vehicleSubId;

  const selectedVehicleId =
    getVehicleId(
      selectedVehicle
    );

  const activeVehicle =
    selectedVehicle ||
    vehicles[0] ||
    null;

  const movingCount =
    vehicles.filter(
      (vehicle) =>
        vehicle.status ===
        "Moving"
    ).length;

  const breakdownCount =
    vehicles.filter(
      (vehicle) =>
        vehicle.status ===
          "Breakdown" ||
        vehicle.status ===
          "Stopped"
    ).length;

  const idleCount =
    vehicles.filter(
      (vehicle) =>
        vehicle.status ===
        "Idle"
    ).length;

  const reachedCount =
    vehicles.filter(
      (vehicle) =>
        vehicle.status ===
        "Reached"
    ).length;

  const getVehicleStatusIcon = (
    status
  ) => {
    if (
      status === "Moving"
    ) {
      return (
        <Navigation size={10} />
      );
    }

    if (
      status ===
        "Breakdown" ||
      status ===
        "Stopped"
    ) {
      return (
        <AlertTriangle size={10} />
      );
    }

    if (
      status === "Reached"
    ) {
      return (
        <CheckCircle2 size={10} />
      );
    }

    return (
      <CirclePause size={10} />
    );
  };

  const getVehicleStatusClass = (
    status
  ) => {
    if (
      status === "Stopped"
    ) {
      return "breakdown";
    }

    if (getStatusClass) {
      return getStatusClass(
        status
      );
    }

    return String(
      status || ""
    )
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );
  };

  const formatKm = (
    value
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return "-";
    }

    const numericValue =
      Number(value);

    if (
      Number.isNaN(
        numericValue
      )
    ) {
      return `${value}`;
    }

    return `${numericValue.toLocaleString(
      "en-IN"
    )} km`;
  };

  const formatDays = (
    value
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return "-";
    }

    const numericValue =
      Number(value);

    if (
      Number.isNaN(
        numericValue
      )
    ) {
      return `${value}`;
    }

    return `${numericValue} ${
      numericValue === 1
        ? "Day"
        : "Days"
    }`;
  };

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatLastUpdated = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const metrics =
    useMemo(
      () => {
        const totalKm =
          Number(
            trip.totalKm ??
            trip.totalDistance ??
            0
          ) || 0;

        const kmCovered =
          Number(
            activeVehicle
              ?.kmCovered ??
            activeVehicle
              ?.runningKm ??
            trip.kmCovered ??
            trip.coveredKm ??
            0
          ) || 0;

        const balanceFromData =
          trip.balanceKm ??
          activeVehicle
            ?.balanceKm;

        const balanceKm =
          balanceFromData !==
            undefined &&
          balanceFromData !==
            null &&
          balanceFromData !==
            ""
            ? Number(
                balanceFromData
              ) || 0
            : totalKm > 0
              ? Math.max(
                  totalKm -
                    kmCovered,
                  0
                )
              : 0;

        return {
          totalKm,
          kmCovered,
          balanceKm,
        };
      },
      [
        trip,
        activeVehicle,
      ]
    );

  const currentPosition =
    activeVehicle
      ?.currentPosition ||
    activeVehicle
      ?.currentLocation ||
    trip.currentPosition ||
    "-";

  const yesterdayPosition =
    activeVehicle
      ?.yesterdayPosition ||
    trip.yesterdayPosition ||
    "-";

  const runningKm =
    activeVehicle
      ?.runningKm ??
    trip.runningKm ??
    "-";

  const currentDay =
    activeVehicle
      ?.currentDay ??
    trip.currentDay ??
    "-";

  const lsp =
    trip.lsp ||
    trip.logisticsServiceProvider ||
    "-";

  const transitDays =
    trip.estimatedTransitDays ??
    trip.transitDays ??
    "-";

  const loadingStatus =
    activeVehicle
      ?.loadingStatus ||
    "Pending";

  const loadingPointInDate =
    formatDate(
      activeVehicle
        ?.loadingPointInDate
    );

  const loadingDate =
    formatDate(
      activeVehicle
        ?.loadingDate
    );

  const loadingPointOutDate =
    formatDate(
      activeVehicle
        ?.loadingPointOutDate
    );

  const loadingHaltingDays =
    activeVehicle
      ?.loadingHaltingDays ??
    "-";

  const loadingRemarks =
    activeVehicle
      ?.loadingRemarks ||
    "-";

  const unloadingStatus =
    activeVehicle
      ?.unloadingStatus ||
    "Pending";

  const unloadingPointInDate =
    formatDate(
      activeVehicle
        ?.unloadingPointInDate
    );

  const unloadingDate =
    formatDate(
      activeVehicle
        ?.unloadingDate
    );

  const unloadingPointOutDate =
    formatDate(
      activeVehicle
        ?.unloadingPointOutDate
    );

  const unloadingHaltingDays =
    activeVehicle
      ?.unloadingHaltingDays ??
    "-";

  const unloadingRemarks =
    activeVehicle
      ?.unloadingRemarks ||
    "-";

  const lrNo =
    activeVehicle
      ?.lrNo ||
    "-";

  const lrRemarks =
    activeVehicle
      ?.lrRemarks ||
    "-";

  const lrSignature =
    activeVehicle
      ?.lrSignature ||
    "-";

  const podStatus =
    activeVehicle
      ?.podStatus ||
    "Pending";

  const podCourierDate =
    formatDate(
      activeVehicle
        ?.podCourierDate
    );

  const podRemarks =
    activeVehicle
      ?.podRemarks ||
    "-";

  const vehicleNumber =
    activeVehicle?.vehicleNumber ||
    "-";

  const lrStatus =
    activeVehicle?.lrStatus ||
    "-";

  const courierName =
    activeVehicle?.courierName ||
    activeVehicle?.podCourierName ||
    "-";

  const trackingId =
    activeVehicle?.trackingId ||
    activeVehicle?.podTrackingId ||
    "-";

  const driverName =
    activeVehicle?.driverName ||
    trip.driverName ||
    "-";

  const driverNumber =
    activeVehicle?.driverNumber ||
    activeVehicle?.driverPhone ||
    trip.driverNumber ||
    trip.driverPhone ||
    "-";

  const escortVehicleNumber =
    trip.escortVehicleNumber ||
    "-";

  const escortName =
    trip.escortName ||
    "-";

  const escortContactNumber =
    trip.escortContactNumber ||
    trip.escortPhone ||
    "-";

  const supervisorName =
    trip.supervisorName ||
    "-";

  const supervisorContact =
    trip.supervisorContact ||
    trip.supervisorPhone ||
    "-";

  return (
    <section className="vehicle-column-panel">
      {}

      <div className="vehicle-status-strip">
        <div className="status-strip-left">
          <div className="status-item moving">
            <Navigation size={11} />
            <strong>
              {movingCount}
            </strong>
            <span>
              Moving
            </span>
          </div>
          <div className="status-item breakdown">
            <AlertTriangle size={11} />
            <strong>
              {breakdownCount}
            </strong>
            <span>
              Breakdown
            </span>
          </div>
          <div className="status-item idle">
            <CirclePause size={11} />
            <strong>
              {idleCount}
            </strong>
            <span>
              Idle
            </span>
          </div>
          <div className="status-item reached">
            <CheckCircle2 size={11} />
            <strong>
              {reachedCount}
            </strong>
            <span>
              Reached
            </span>
          </div>
        </div>
        <button
          type="button"
          className={`vehicle-toggle-btn ${
            showVehicles
              ? "open"
              : ""
          }`}
          onClick={() =>
            setShowVehicles(
              (previous) =>
                !previous
            )
          }
          aria-expanded={
            showVehicles
          }
          title={
            showVehicles
              ? "Hide vehicles"
              : "Show vehicles"
          }
        >
          {showVehicles ? (
            <ChevronUp size={15} />
          ) : (
            <ChevronDown size={15} />
          )}
        </button>
      </div>
      {}

      {showVehicles && (
        <div className="vehicle-list-section">
          <div className="vehicle-list-heading">
            <div>
              <strong>
                Vehicle List
              </strong>
              <span>
                Select vehicle
              </span>
            </div>
            <span className="vehicle-list-count">
              {vehicles.length}
            </span>
          </div>
          <div className="vehicle-mini-list">
            {vehicles.length > 0 ? (
              vehicles.map(
                (
                  vehicle,
                  index
                ) => {
                  const vehicleId =
                    getVehicleId(
                      vehicle
                    );

                  const active =
                    selectedVehicleId
                      ? selectedVehicleId ===
                        vehicleId
                      : index === 0;

                  const statusClass =
                    getVehicleStatusClass(
                      vehicle.status
                    );

                  return (
                    <button
                      type="button"
                      key={
                        vehicleId ||
                        index
                      }
                      className={`vehicle-mini-row ${
                        active
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        onSelectVehicle?.(
                          vehicleId
                        )
                      }
                    >
                      <div className="vehicle-mini-main">
                        <span className="vehicle-mini-truck">
                          <Truck size={12} />
                        </span>
                        <div className="vehicle-mini-info">
                          <strong>
                            {vehicle.vehicleNumber ||
                              `Vehicle ${index + 1}`}
                          </strong>
                          <span>
                            {vehicle.currentPosition ||
                              vehicle.currentLocation ||
                              "Location unavailable"}
                          </span>
                        </div>
                      </div>
                      <div className="vehicle-mini-right">
                        <span
                          className={`vehicle-mini-status ${statusClass}`}
                        >
                          {getVehicleStatusIcon(
                            vehicle.status
                          )}

                          {vehicle.status ||
                            "Unknown"}
                        </span>
                        <small>
                          {formatLastUpdated(
                            vehicle.lastUpdated
                          )}
                        </small>
                      </div>
                    </button>
                  );
                }
              )
            ) : (
              <div className="vehicle-mini-empty">
                No vehicles found.
              </div>
            )}
          </div>
        </div>
      )}

      {}

      <div className="trip-route-card">
        <div className="trip-route-point">
          <span>
            Origin
          </span>
          <strong>
            {trip.origin ||
              "-"}
          </strong>
        </div>
        <div className="trip-route-direction">
          <span className="route-line" />
          <div className="route-center-content">
            <span className="route-material-name">
              {trip.materialType ||
                "-"}
            </span>
            <span className="route-vehicle-icon">
              <Truck size={13} />
            </span>
          </div>
          <span className="route-line" />
        </div>
        <div className="trip-route-point destination">
          <span>
            Destination
          </span>
          <strong>
            {trip.destination ||
              "-"}
          </strong>
        </div>
      </div>
      {}

      <div className="trip-distance-summary">
        <div className="distance-summary-item total">
          <span>
            Total KM
          </span>
          <strong>
            {formatKm(
              metrics.totalKm
            )}
          </strong>
        </div>
        <div className="distance-summary-item covered">
          <span>
            KM Covered
          </span>
          <strong>
            {formatKm(
              metrics.kmCovered
            )}
          </strong>
        </div>
        <div className="distance-summary-item balance">
          <span>
            Balance
          </span>
          <strong>
            {formatKm(
              metrics.balanceKm
            )}
          </strong>
        </div>
      </div>
      {}

      <div className="movement-card-section">
        <div className="movement-heading-row">
          <span className="section-heading-icon blue">
            <Navigation size={12} />
          </span>
          <div className="movement-heading-content">
            <div className="movement-title-line">
              <strong>
                Movement Status
              </strong>
              <span className="movement-vehicle-badge">
                {activeVehicle?.vehicleNumber || "-"}
              </span>
            </div>
            <span className="movement-heading-subtitle">
              Current vehicle movement
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
              Running KM
            </span>
            <strong>
              {runningKm === "-"
                ? "-"
                : formatKm(
                    runningKm
                  )}
            </strong>
          </div>
          <div className="movement-info-card">
            <span>
              Current Day
            </span>
            <strong>
              {currentDay === "-"
                ? "-"
                : `Day ${currentDay}`}
            </strong>
          </div>
        </div>
      </div>
      {}

      <div className="consignment-card">
        <div className="consignment-title">
          <Package size={13} />
          <strong>
            Trip Details
          </strong>
        </div>
        {}

        <div className="trip-detail-group client-group">
          <div className="trip-detail-group-title">
            <span className="trip-detail-group-icon client">
              <Package size={12} />
            </span>
            <strong>
              Client Details
            </strong>
          </div>
          <div className="trip-detail-row">
            <span className="trip-detail-label">
              Client Name
            </span>
            <span className="trip-detail-colon">
              :
            </span>
            <strong className="trip-detail-value">
              {trip.customer || "-"}
            </strong>
          </div>
          <div className="trip-detail-row">
            <span className="trip-detail-label">
              Contact Person
            </span>
            <span className="trip-detail-colon">
              :
            </span>
            <strong className="trip-detail-value">
              {trip.clientContactPerson ||
                trip.customerContactPerson ||
                trip.contactPerson ||
                "-"}
            </strong>
          </div>
          <div className="trip-detail-row">
            <span className="trip-detail-label">
              Phone No.
            </span>
            <span className="trip-detail-colon">
              :
            </span>
            <strong className="trip-detail-value">
              {trip.clientPhone ||
                trip.customerPhone ||
                trip.contactNumber ||
                "-"}
            </strong>
          </div>
        </div>
        {}

        <div className="trip-detail-group transporter-group">
          <div className="trip-detail-group-title">
            <span className="trip-detail-group-icon transporter">
              <Truck size={12} />
            </span>
            <strong>
              Transporter Details
            </strong>
          </div>
          <div className="trip-detail-row">
            <span className="trip-detail-label">
              Transporter
            </span>
            <span className="trip-detail-colon">
              :
            </span>
            <strong className="trip-detail-value">
              {lsp}
            </strong>
          </div>
          <div className="trip-detail-row">
            <span className="trip-detail-label">
              Contact Person
            </span>
            <span className="trip-detail-colon">
              :
            </span>
            <strong className="trip-detail-value">
              {trip.transporterContactPerson ||
                trip.lspContactPerson ||
                "-"}
            </strong>
          </div>
          <div className="trip-detail-row">
            <span className="trip-detail-label">
              Phone No.
            </span>
            <span className="trip-detail-colon">
              :
            </span>
            <strong className="trip-detail-value">
              {trip.transporterPhone ||
                trip.lspPhone ||
                "-"}
            </strong>
          </div>
        </div>
        {}

        <div className="transit-day-row">
          <div>
            <Route size={12} />
            <span>
              Estimated Transit
            </span>
          </div>
          <strong>
            {transitDays === "-"
              ? "-"
              : formatDays(
                  transitDays
                )}
          </strong>
        </div>
      </div>
      {}

      <div className="operation-details-section">
        <div className="operation-main-grid">
          {}

          <div className="simple-operation-card loading-card">
            <div className="simple-operation-header">
              <div className="simple-operation-title">
                <span className="simple-operation-icon loading">
                  <Truck size={13} />
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
              <div className="simple-detail-row">
                <span className="simple-detail-label">
                  LP In Date
                </span>
                <span className="simple-detail-colon">
                  :
                </span>
                <strong className="simple-detail-value">
                  {loadingPointInDate}
                </strong>
              </div>
              <div className="simple-detail-row">
                <span className="simple-detail-label">
                  Loading Date
                </span>
                <span className="simple-detail-colon">
                  :
                </span>
                <strong className="simple-detail-value">
                  {loadingDate}
                </strong>
              </div>
              <div className="simple-detail-row">
                <span className="simple-detail-label">
                  LP Out Date
                </span>
                <span className="simple-detail-colon">
                  :
                </span>
                <strong className="simple-detail-value">
                  {loadingPointOutDate}
                </strong>
              </div>
              <div className="simple-detail-row">
                <span className="simple-detail-label">
                  Halting Days
                </span>
                <span className="simple-detail-colon">
                  :
                </span>
                <strong className="simple-detail-value halting">
                  {formatDays(
                    loadingHaltingDays
                  )}
                </strong>
              </div>
              <div className="simple-remarks-box">
                <div className="simple-remarks-heading">
                  <MessageSquareText size={10} />
                  <span>
                    Remarks
                  </span>
                </div>
                <div className="simple-remarks-value">
                  {loadingRemarks || "-"}
                </div>
              </div>
            </div>
          </div>
          {}

          <div className="simple-operation-card unloading-card">
            <div className="simple-operation-header">
              <div className="simple-operation-title">
                <span className="simple-operation-icon unloading">
                  <PackageCheck size={13} />
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
              <div className="simple-detail-row">
                <span className="simple-detail-label">
                  UP In Date
                </span>
                <span className="simple-detail-colon">
                  :
                </span>
                <strong className="simple-detail-value">
                  {unloadingPointInDate}
                </strong>
              </div>
              <div className="simple-detail-row">
                <span className="simple-detail-label">
                  Unloading Date
                </span>
                <span className="simple-detail-colon">
                  :
                </span>
                <strong className="simple-detail-value">
                  {unloadingDate}
                </strong>
              </div>
              <div className="simple-detail-row">
                <span className="simple-detail-label">
                  UP Out Date
                </span>
                <span className="simple-detail-colon">
                  :
                </span>
                <strong className="simple-detail-value">
                  {unloadingPointOutDate}
                </strong>
              </div>
              <div className="simple-detail-row">
                <span className="simple-detail-label">
                  Halting Days
                </span>
                <span className="simple-detail-colon">
                  :
                </span>
                <strong className="simple-detail-value halting">
                  {formatDays(
                    unloadingHaltingDays
                  )}
                </strong>
              </div>
              <div className="simple-remarks-box">
                <div className="simple-remarks-heading">
                  <MessageSquareText size={10} />
                  <span>
                    Remarks
                  </span>
                </div>
                <div className="simple-remarks-value">
                  {unloadingRemarks || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>
        {}

        <div className="lr-pod-card">
          {}

          <div className="lr-pod-heading">
            <FileText size={12} />
            <strong>
              LR & POD Details
            </strong>
          </div>
          {}

          <div className="lr-primary-grid">
            <div className="lr-primary-item">
              <span>
                Vehicle No.
              </span>
              <strong>
                {vehicleNumber}
              </strong>
            </div>
            <div className="lr-primary-item">
              <span>
                LR No.
              </span>
              <strong>
                {lrNo}
              </strong>
            </div>
            <div className="lr-primary-item">
              <span>
                LR Status
              </span>
              <strong>
                {lrStatus}
              </strong>
            </div>
            <div className="lr-primary-item">
              <span>
                LR Signature
              </span>
              <strong>
                {lrSignature}
              </strong>
            </div>
          </div>
          {}

          <div className="lr-remarks-box">
            <div className="lr-remarks-label">
              <MessageSquareText size={10} />
              <span>
                LR Remarks
              </span>
            </div>
            <div className="lr-remarks-value">
              {lrRemarks}
            </div>
          </div>
          {}

          <div className="pod-details-grid">
            <div className="pod-detail-item">
              <span>
                POD Status
              </span>
              <strong>
                {podStatus}
              </strong>
            </div>
            <div className="pod-detail-item">
              <span>
                Courier Name
              </span>
              <strong>
                {courierName}
              </strong>
            </div>
            <div className="pod-detail-item">
              <span>
                Tracking ID
              </span>
              <strong>
                {trackingId}
              </strong>
            </div>
            <div className="pod-detail-item">
              <span>
                Courier Date
              </span>
              <strong>
                {podCourierDate}
              </strong>
            </div>
          </div>
          {}

          <div className="lr-person-section driver-section">
            <div className="lr-person-heading">
              <Truck size={11} />
              <strong>
                Driver Details
              </strong>
            </div>
            <div className="lr-person-content">
              <div className="lr-person-row">
                <span>
                  Driver Name
                </span>
                <span className="lr-person-colon">
                  :
                </span>
                <strong>
                  {driverName}
                </strong>
              </div>
              <div className="lr-person-row">
                <span>
                  Driver Number
                </span>
                <span className="lr-person-colon">
                  :
                </span>
                <strong>
                  {driverNumber}
                </strong>
              </div>
            </div>
          </div>
          {}

          <div className="lr-person-section escort-section">
            <div className="lr-person-heading">
              <Navigation size={11} />
              <strong>
                Escort Details
              </strong>
            </div>
            <div className="lr-person-content">
              <div className="lr-person-row">
                <span>
                  Vehicle Number
                </span>
                <span className="lr-person-colon">
                  :
                </span>
                <strong>
                  {escortVehicleNumber}
                </strong>
              </div>
              <div className="lr-person-row">
                <span>
                  Name
                </span>
                <span className="lr-person-colon">
                  :
                </span>
                <strong>
                  {escortName}
                </strong>
              </div>
              <div className="lr-person-row">
                <span>
                  Contact Number
                </span>
                <span className="lr-person-colon">
                  :
                </span>
                <strong>
                  {escortContactNumber}
                </strong>
              </div>
            </div>
          </div>
          {}

          <div className="lr-person-section supervisor-section">
            <div className="lr-person-heading">
              <CheckCircle2 size={11} />
              <strong>
                Supervisor Details
              </strong>
            </div>
            <div className="lr-person-content">
              <div className="lr-person-row">
                <span>
                  Name
                </span>
                <span className="lr-person-colon">
                  :
                </span>
                <strong>
                  {supervisorName}
                </strong>
              </div>
              <div className="lr-person-row">
                <span>
                  Contact
                </span>
                <span className="lr-person-colon">
                  :
                </span>
                <strong>
                  {supervisorContact}
                </strong>
              </div>
            </div>
          </div>
          {}

          <div className="pod-remarks-box">
            <div className="pod-remarks-label">
              <MessageSquareText size={10} />
              <span>
                POD Remarks
              </span>
            </div>
            <div className="pod-remarks-value">
              {podRemarks}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const OperationItem = ({
  icon,
  label,
  value,
}) => (
  <div className="operation-info-item">
    <div className="operation-info-label">
      {icon}

      <span>
        {label}
      </span>
    </div>
    <strong>
      {value}
    </strong>
  </div>
);

const DocumentItem = ({
  icon,
  label,
  value,
  wide = false,
}) => (
  <div
    className={`document-info-item ${
      wide
        ? "wide"
        : ""
    }`}
  >
    <div className="document-info-label">
      {icon}

      <span>
        {label}
      </span>
    </div>
    <strong>
      {value}
    </strong>
  </div>
);

export default VehicleColumn;