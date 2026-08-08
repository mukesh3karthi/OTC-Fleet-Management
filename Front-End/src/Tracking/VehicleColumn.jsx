import React, { useMemo, useState } from "react";

import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    CirclePause,
    Clock3,
    FileSignature,
    FileText,
    MessageSquareText,
    Navigation,
    Package,
    PackageCheck,
    Route,
    Truck,
} from "lucide-react";

import "./VehicleColumn.css";

const VehicleColumn = ({
    trip,
    selectedVehicle,
    onSelectVehicle,
    getStatusClass,
}) => {
    const [showVehicles, setShowVehicles] = useState(false);

    /* =========================================
       EMPTY STATE
    ========================================= */

    if (!trip) {
        return (
            <section className="vehicle-column-panel">
                <div className="vehicle-column-empty">
                    <Truck size={30} />
                    <p>Select a trip to view vehicle information.</p>
                </div>
            </section>
        );
    }

    /* =========================================
       SAFE VEHICLE LIST
    ========================================= */

    const vehicles = Array.isArray(trip.vehicles) ? trip.vehicles : [];

    /* =========================================
       STATUS COUNTS
    ========================================= */

    const movingCount = vehicles.filter(
        (vehicle) => vehicle.status === "Moving"
    ).length;

    const breakdownCount = vehicles.filter(
        (vehicle) =>
            vehicle.status === "Breakdown" ||
            vehicle.status === "Stopped"
    ).length;

    const idleCount = vehicles.filter(
        (vehicle) => vehicle.status === "Idle"
    ).length;

    const reachedCount = vehicles.filter(
        (vehicle) => vehicle.status === "Reached"
    ).length;

    /* =========================================
       STATUS ICON
    ========================================= */

    const getVehicleStatusIcon = (status) => {
        if (status === "Moving") {
            return <Navigation size={12} />;
        }

        if (
            status === "Breakdown" ||
            status === "Stopped"
        ) {
            return <AlertTriangle size={12} />;
        }

        if (status === "Reached") {
            return <CheckCircle2 size={12} />;
        }

        return <CirclePause size={12} />;
    };

    /* =========================================
       STATUS CLASS
    ========================================= */

    const getVehicleStatusClass = (status) => {
        if (status === "Stopped") {
            return "breakdown";
        }

        if (getStatusClass) {
            return getStatusClass(status);
        }

        return String(status || "")
            .toLowerCase()
            .replaceAll(" ", "-");
    };

    /* =========================================
       FORMAT KM
    ========================================= */

    const formatKm = (value) => {
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return "-";
        }

        const numericValue = Number(value);

        if (Number.isNaN(numericValue)) {
            return `${value}`;
        }

        return `${numericValue.toLocaleString("en-IN")} km`;
    };

    /* =========================================
       FORMAT HALTING DAYS
    ========================================= */

    const formatDays = (value) => {
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return "-";
        }

        const numericValue = Number(value);

        if (Number.isNaN(numericValue)) {
            return `${value}`;
        }

        return `${numericValue} ${numericValue === 1 ? "Day" : "Days"
            }`;
    };

    /* =========================================
       TRIP / VEHICLE METRICS
    ========================================= */

    const metrics = useMemo(() => {
        const totalKm =
            Number(
                trip.totalKm ??
                trip.totalDistance ??
                0
            ) || 0;

        const kmCovered =
            Number(
                selectedVehicle?.kmCovered ??
                trip.kmCovered ??
                trip.coveredKm ??
                0
            ) || 0;

        const balanceFromData =
            trip.balanceKm ??
            selectedVehicle?.balanceKm;

        const balanceKm =
            balanceFromData !== undefined &&
                balanceFromData !== null &&
                balanceFromData !== ""
                ? Number(balanceFromData) || 0
                : totalKm > 0
                    ? Math.max(totalKm - kmCovered, 0)
                    : 0;

        return {
            totalKm,
            kmCovered,
            balanceKm,
        };
    }, [trip, selectedVehicle]);

    /* =========================================
       MOVEMENT INFORMATION
    ========================================= */

    const currentPosition =
        selectedVehicle?.currentLocation ||
        trip.currentPosition ||
        "-";

    const yesterdayPosition =
        selectedVehicle?.yesterdayPosition ||
        trip.yesterdayPosition ||
        "-";

    const runningKm =
        selectedVehicle?.runningKm ??
        trip.runningKm ??
        "-";

    const currentDay =
        selectedVehicle?.currentDay ||
        trip.currentDay ||
        "-";

    /* =========================================
       TRIP INFORMATION
    ========================================= */

    const lsp =
        trip.lsp ||
        trip.logisticsServiceProvider ||
        "-";

    const lrNo =
        trip.lrNo ||
        trip.lrNumber ||
        "-";

    const transitDays =
        trip.estimatedTransitDays ??
        trip.transitDays ??
        "-";

    /* =========================================
       LOADING INFORMATION
    ========================================= */

    const loadingPointInDate =
        trip.loadingPointInDate ||
        "-";

    const loadingDate =
        trip.loadingDate ||
        "-";

    const loadingPointOutDate =
        trip.loadingPointOutDate ||
        "-";

    const loadingHaltingDays =
        trip.loadingHaltingDays ??
        trip.loadingPointHaltingDays ??
        "-";

    const loadingRemarks =
        trip.loadingRemarks ||
        "-";

    /* =========================================
       UNLOADING INFORMATION
    ========================================= */

    const unloadingPointInDate =
        trip.unloadingPointInDate ||
        "-";

    const unloadingDate =
        trip.unloadingDate ||
        "-";

    const unloadingPointOutDate =
        trip.unloadingPointOutDate ||
        "-";

    const unloadingHaltingDays =
        trip.unloadingHaltingDays ??
        trip.unloadingPointHaltingDays ??
        "-";

    const unloadingRemarks =
        trip.unloadingRemarks ||
        "-";

    /* =========================================
       LR / POD INFORMATION
    ========================================= */

    const lrRemarks =
        trip.lrRemarks ||
        "-";

    const lrSignature =
        trip.lrSignature ||
        "-";

    const podCourierDate =
        trip.podCourierDate ||
        "-";

    const podRemarks =
        trip.podRemarks ||
        "-";

    return (
        <section className="vehicle-column-panel">
            {/* =====================================
          STATUS STRIP
      ===================================== */}

            <div className="vehicle-status-strip">
                <div className="status-strip-left">
                    <div className="status-item moving">
                        <Navigation size={13} />
                        <strong>{movingCount}</strong>
                        <span>Moving</span>
                    </div>

                    <div className="status-item breakdown">
                        <AlertTriangle size={13} />
                        <strong>{breakdownCount}</strong>
                        <span>Breakdown</span>
                    </div>

                    <div className="status-item idle">
                        <CirclePause size={13} />
                        <strong>{idleCount}</strong>
                        <span>Idle</span>
                    </div>

                    <div className="status-item reached">
                        <CheckCircle2 size={13} />
                        <strong>{reachedCount}</strong>
                        <span>Reached</span>
                    </div>
                </div>

                <button
                    type="button"
                    className={`vehicle-toggle-btn ${showVehicles ? "open" : ""
                        }`}
                    onClick={() =>
                        setShowVehicles((previous) => !previous)
                    }
                    aria-expanded={showVehicles}
                    aria-label={
                        showVehicles
                            ? "Hide vehicle list"
                            : "Show vehicle list"
                    }
                >
                    {showVehicles ? (
                        <ChevronUp size={17} />
                    ) : (
                        <ChevronDown size={17} />
                    )}
                </button>
            </div>

            {/* =====================================
          VEHICLE LIST
      ===================================== */}

            {showVehicles && (
                <div className="vehicle-list-section">
                    <div className="vehicle-list-heading">
                        <div>
                            <strong>Vehicle List</strong>
                            <span>
                                Select a vehicle to view its details
                            </span>
                        </div>

                        <span className="vehicle-list-count">
                            {vehicles.length}
                        </span>
                    </div>

                    <div className="vehicle-mini-list">
                        {vehicles.map((vehicle) => {
                            const active =
                                selectedVehicle?.id === vehicle.id;

                            const statusClass =
                                getVehicleStatusClass(
                                    vehicle.status
                                );

                            return (
                                <button
                                    type="button"
                                    key={vehicle.id}
                                    className={`vehicle-mini-row ${active ? "active" : ""
                                        }`}
                                    onClick={() =>
                                        onSelectVehicle?.(vehicle.id)
                                    }
                                >
                                    <div className="vehicle-mini-main">
                                        <span className="vehicle-mini-truck">
                                            <Truck size={14} />
                                        </span>

                                        <div className="vehicle-mini-info">
                                            <strong>
                                                {vehicle.vehicleNumber}
                                            </strong>

                                            <span>
                                                {vehicle.currentLocation ||
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

                                            {vehicle.status}
                                        </span>

                                        <small>
                                            Updated{" "}
                                            {vehicle.lastUpdated || "-"}
                                        </small>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* =====================================
          ROUTE
      ===================================== */}

            <div className="trip-route-card">
                <div className="trip-route-point">
                    <span>Origin</span>
                    <strong>{trip.origin || "-"}</strong>
                </div>

                <div className="trip-route-direction">
                    <span className="route-line" />

                    <div>
                        <Truck size={15} />
                    </div>

                    <span className="route-line" />
                </div>

                <div className="trip-route-point destination">
                    <span>Destination</span>
                    <strong>
                        {trip.destination || "-"}
                    </strong>
                </div>
            </div>

            {/* =====================================
          DISTANCE SUMMARY
      ===================================== */}

            <div className="trip-distance-summary">
                <div className="distance-summary-item total">
                    <span>Total KM</span>
                    <strong>
                        {formatKm(metrics.totalKm)}
                    </strong>
                </div>

                <div className="distance-summary-item covered">
                    <span>KM Covered</span>
                    <strong>
                        {formatKm(metrics.kmCovered)}
                    </strong>
                </div>

                <div className="distance-summary-item balance">
                    <span>Balance</span>
                    <strong>
                        {formatKm(metrics.balanceKm)}
                    </strong>
                </div>
            </div>

            {/* =====================================
    MOVEMENT DETAILS
===================================== */}

            <div className="movement-card-section">

                <div className="movement-heading-row">

                    <span className="section-heading-icon blue">
                        <Navigation size={14} />
                    </span>

                    <div className="movement-heading-content">

                        <div className="movement-title-line">

                            <strong>
                                Movement Details
                            </strong>

                            <span className="movement-vehicle-badge">

                                <Truck size={12} />

                                <span>
                                    Vehicle No.
                                </span>

                                <strong>
                                    {selectedVehicle?.vehicleNumber ||
                                        trip.vehicleNumber ||
                                        vehicles[0]?.vehicleNumber ||
                                        "-"}
                                </strong>

                            </span>

                        </div>

                        <span className="movement-heading-subtitle">
                            Current trip information
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
                                : formatKm(runningKm)}
                        </strong>
                    </div>


                    <div className="movement-info-card">
                        <span>
                            Current Day
                        </span>

                        <strong>
                            {currentDay}
                        </strong>
                    </div>

                </div>

            </div>


            {/* =====================================
          TRIP DETAILS
      ===================================== */}

            <div className="consignment-card">
                <div className="consignment-title">
                    <Package size={15} />
                    <strong>Trip Details</strong>
                </div>

                <div className="consignment-grid">
                    <div className="consignment-field">
                        <span>Type of Material</span>
                        <strong>
                            {trip.materialType || "-"}
                        </strong>
                    </div>

                    <div className="consignment-field">
                        <span>Customer</span>
                        <strong>
                            {trip.customer || "-"}
                        </strong>
                    </div>

                    <div className="consignment-field">
                        <span>LSP</span>
                        <strong>{lsp}</strong>
                    </div>

                    <div className="consignment-field">
                        <span>LR No.</span>
                        <strong>{lrNo}</strong>
                    </div>
                </div>

                <div className="transit-day-row">
                    <div>
                        <Route size={15} />
                        <span>Estimated Transit</span>
                    </div>

                    <strong>
                        {transitDays === "-"
                            ? "-"
                            : formatDays(transitDays)}
                    </strong>
                </div>
            </div>

            {/* =====================================
          LOADING & UNLOADING
      ===================================== */}

            <div className="operation-details-section">

                <div className="operation-main-grid">
                    {/* LOADING POINT */}
                    <div className="operation-card loading-card">
                        <div className="operation-card-header">
                            <div className="operation-card-title">
                                <span className="operation-card-icon loading">
                                    <Truck size={15} />
                                </span>

                                <div>
                                    <strong>Loading Point</strong>
                                    <span>Dispatch information</span>
                                </div>
                            </div>

                            <span className="operation-status-badge loading">
                                Loading
                            </span>
                        </div>

                        <div className="operation-info-grid">
                            <div className="operation-primary-row">
                                <div className="operation-info-item">
                                    <div className="operation-info-label">
                                        <CalendarDays size={13} />
                                        <span>Point In Date</span>
                                    </div>
                                    <strong>{loadingPointInDate}</strong>
                                </div>

                                <div className="operation-info-item">
                                    <div className="operation-info-label">
                                        <CalendarDays size={13} />
                                        <span>Loading Date</span>
                                    </div>
                                    <strong>{loadingDate}</strong>
                                </div>

                                <div className="operation-info-item">
                                    <div className="operation-info-label">
                                        <CalendarDays size={13} />
                                        <span>Point Out Date</span>
                                    </div>
                                    <strong>{loadingPointOutDate}</strong>
                                </div>
                            </div>

                            <div className="operation-secondary-row">
                                <div className="operation-info-item halting-info-item">
                                    <div className="operation-info-label">
                                        <Clock3 size={13} />
                                        <span>Halting Days</span>
                                    </div>
                                    <strong className="halting-value">
                                        {formatDays(loadingHaltingDays)}
                                    </strong>
                                </div>

                                <div className="operation-info-item remarks-info-item">
                                    <div className="operation-info-label">
                                        <MessageSquareText size={13} />
                                        <span>Remarks</span>
                                    </div>
                                    <strong className="operation-remarks-value">
                                        {loadingRemarks}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* UNLOADING POINT */}
                    <div className="operation-card unloading-card">
                        <div className="operation-card-header">
                            <div className="operation-card-title">
                                <span className="operation-card-icon unloading">
                                    <PackageCheck size={15} />
                                </span>

                                <div>
                                    <strong>Unloading Point</strong>
                                    <span>Delivery information</span>
                                </div>
                            </div>

                            <span className="operation-status-badge unloading">
                                Unloading
                            </span>
                        </div>

                        <div className="operation-info-grid">
                            <div className="operation-primary-row">
                                <div className="operation-info-item">
                                    <div className="operation-info-label">
                                        <CalendarDays size={13} />
                                        <span>Point In Date</span>
                                    </div>
                                    <strong>{unloadingPointInDate}</strong>
                                </div>

                                <div className="operation-info-item">
                                    <div className="operation-info-label">
                                        <CalendarDays size={13} />
                                        <span>Unloading Date</span>
                                    </div>
                                    <strong>{unloadingDate}</strong>
                                </div>

                                <div className="operation-info-item">
                                    <div className="operation-info-label">
                                        <CalendarDays size={13} />
                                        <span>Point Out Date</span>
                                    </div>
                                    <strong>{unloadingPointOutDate}</strong>
                                </div>
                            </div>

                            <div className="operation-secondary-row">
                                <div className="operation-info-item halting-info-item">
                                    <div className="operation-info-label">
                                        <Clock3 size={13} />
                                        <span>Halting Days</span>
                                    </div>
                                    <strong className="halting-value">
                                        {formatDays(unloadingHaltingDays)}
                                    </strong>
                                </div>

                                <div className="operation-info-item remarks-info-item">
                                    <div className="operation-info-label">
                                        <MessageSquareText size={13} />
                                        <span>Remarks</span>
                                    </div>
                                    <strong className="operation-remarks-value">
                                        {unloadingRemarks}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LR & POD DETAILS */}
                <div className="document-details-card">
                    <div className="document-details-heading">
                        <FileText size={14} />
                        <strong>LR & POD Details</strong>
                    </div>

                    <div className="document-details-grid">
                        <div className="document-info-item">
                            <div className="document-info-label">
                                <MessageSquareText size={12} />
                                <span>LR Remarks</span>
                            </div>
                            <strong>{lrRemarks}</strong>
                        </div>

                        <div className="document-info-item">
                            <div className="document-info-label">
                                <FileSignature size={12} />
                                <span>LR Signature</span>
                            </div>
                            <strong>{lrSignature}</strong>
                        </div>

                        <div className="document-info-item">
                            <div className="document-info-label">
                                <CalendarDays size={12} />
                                <span>POD Courier Date</span>
                            </div>
                            <strong>{podCourierDate}</strong>
                        </div>

                        <div className="document-info-item">
                            <div className="document-info-label">
                                <MessageSquareText size={12} />
                                <span>POD Remarks</span>
                            </div>
                            <strong>{podRemarks}</strong>
                        </div>
                    </div>
                </div>
            </div>

            

        </section>
    );
};

export default VehicleColumn;