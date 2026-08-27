import React, {
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CirclePause,
  FileText,
  MessageSquareText,
  Navigation,
  Package,
  PackageCheck,
  Route,
  Truck,
} from "lucide-react";

import "./VehicleColumn.css";


/* =========================================
   SAFE TEXT
========================================= */

const safeText = (
  value,
  fallback = "-"
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
    /*
      MongoDB ObjectId
    */

    if (value.$oid) {
      return String(
        value.$oid
      );
    }

    /*
      MongoDB Extended JSON date

      {
        $date: "2026-08-01..."
      }
    */

    if (value.$date) {
      return String(
        value.$date
      );
    }

    return fallback;
  }

  return String(
    value
  );
};


/* =========================================
   SAFE DATE VALUE
========================================= */

const getSafeDateValue = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  /*
    MongoDB Extended JSON

    {
      "$date":
      "2026-08-01T09:00:00.000Z"
    }
  */

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    if (
      value.$date !== undefined
    ) {
      return getSafeDateValue(
        value.$date
      );
    }

    /*
      {
        "$numberLong": "..."
      }
    */

    if (
      value.$numberLong !==
      undefined
    ) {
      const timestamp =
        Number(
          value.$numberLong
        );

      if (
        Number.isFinite(
          timestamp
        )
      ) {
        return timestamp;
      }
    }

    return null;
  }

  return value;
};


/* =========================================
   FORMAT DATE
========================================= */

const formatDate = (
  value
) => {
  const safeValue =
    getSafeDateValue(
      value
    );

  if (!safeValue) {
    return "-";
  }

  const date =
    new Date(
      safeValue
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
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


/* =========================================
   LAST UPDATED
========================================= */

const formatLastUpdated = (
  value
) => {
  const safeValue =
    getSafeDateValue(
      value
    );

  if (!safeValue) {
    return "-";
  }

  const date =
    new Date(
      safeValue
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};


/* =========================================
   KM
========================================= */

const formatKm = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  const numericValue =
    Number(
      value
    );

  if (
    Number.isNaN(
      numericValue
    )
  ) {
    return "-";
  }

  return `${numericValue.toLocaleString(
    "en-IN"
  )} km`;
};


/* =========================================
   DAYS
========================================= */

const formatDays = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  const numericValue =
    Number(
      value
    );

  if (
    Number.isNaN(
      numericValue
    )
  ) {
    return "-";
  }

  return `${numericValue} ${numericValue === 1
      ? "Day"
      : "Days"
    }`;
};


/* =========================================
   COMPONENT
========================================= */

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


  /* =====================================
     EMPTY TRIP
  ===================================== */

  if (!trip) {
    return (
      <section
        className="vehicle-column-panel"
      >
        <div
          className="vehicle-column-empty"
        >
          <div
            className="vehicle-column-empty-icon"
          >
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


  /* =====================================
     VEHICLES
  ===================================== */

  const vehicles =
    Array.isArray(
      trip.vehicles
    )
      ? trip.vehicles
      : [];


  /* =====================================
     VEHICLE ID
  ===================================== */

  const getVehicleId = (
    vehicle
  ) => {
    if (!vehicle) {
      return "";
    }

    return (
      safeText(
        vehicle._id,
        ""
      ) ||
      safeText(
        vehicle.id,
        ""
      ) ||
      safeText(
        vehicle.vehicleSubId,
        ""
      ) ||
      safeText(
        vehicle.vehicleNumber,
        ""
      )
    );
  };


  /* =====================================
     SELECTED VEHICLE ID
  ===================================== */

  const selectedVehicleId =
    typeof selectedVehicle ===
      "object"
      ? getVehicleId(
        selectedVehicle
      )
      : safeText(
        selectedVehicle,
        ""
      );


  /* =====================================
     ACTIVE VEHICLE
  ===================================== */

  const activeVehicle =
    vehicles.find(
      (
        vehicle
      ) =>
        getVehicleId(
          vehicle
        ) ===
        selectedVehicleId
    ) ||
    (
      typeof selectedVehicle ===
        "object"
        ? selectedVehicle
        : null
    ) ||
    vehicles[0] ||
    null;


  /* =====================================
     STATUS COUNTS
  ===================================== */

  const movingCount =
    vehicles.filter(
      (
        vehicle
      ) =>
        vehicle.status ===
        "Moving"
    ).length;


  const idleCount =
    vehicles.filter(
      (
        vehicle
      ) =>
        vehicle.status ===
        "Idle"
    ).length;


  const breakdownCount =
    vehicles.filter(
      (
        vehicle
      ) =>
        vehicle.status ===
        "Breakdown" ||
        vehicle.status ===
        "Stopped"
    ).length;


  const reachedCount =
    vehicles.filter(
      (
        vehicle
      ) =>
        vehicle.status ===
        "Reached"
    ).length;


  /* =====================================
     STATUS ICON
  ===================================== */

  const getVehicleStatusIcon = (
    status
  ) => {
    if (
      status ===
      "Moving"
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
      status ===
      "Reached"
    ) {
      return (
        <CheckCircle2 size={10} />
      );
    }

    return (
      <CirclePause size={10} />
    );
  };


  /* =====================================
     STATUS CLASS
  ===================================== */

  const getVehicleStatusClass = (
    status
  ) => {
    if (
      status ===
      "Stopped"
    ) {
      return "breakdown";
    }

    if (
      typeof getStatusClass ===
      "function"
    ) {
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


  /* =====================================
     DISTANCE
  ===================================== */

  const totalKm =
    Number(
      trip.totalKm ??
      trip.totalDistance ??
      0
    ) || 0;


  const kmCovered =
    Number(
      activeVehicle?.kmCovered ??
      activeVehicle?.runningKm ??
      trip.kmCovered ??
      trip.coveredKm ??
      0
    ) || 0;


  const balanceFromData =
    trip.balanceKm ??
    activeVehicle?.balanceKm;


  const balanceKm =
    balanceFromData !==
      undefined &&
      balanceFromData !==
      null &&
      balanceFromData !== ""
      ? Number(
        balanceFromData
      ) || 0
      : Math.max(
        totalKm -
        kmCovered,
        0
      );


  /* =====================================
     MOVEMENT
  ===================================== */

  const currentPosition =
    safeText(
      activeVehicle
        ?.currentPosition ||
      activeVehicle
        ?.currentLocation ||
      trip.currentPosition
    );


  const yesterdayPosition =
    safeText(
      activeVehicle
        ?.yesterdayPosition ||
      trip.yesterdayPosition
    );


  const runningKm =
    activeVehicle
      ?.runningKm ??
    trip.runningKm ??
    null;


  const currentDay =
    activeVehicle
      ?.currentDay ??
    trip.currentDay ??
    null;


  /* =====================================
     TRIP DETAILS
  ===================================== */

  const lsp =
    safeText(
      trip.lsp ||
      trip.logisticsServiceProvider
    );


  const transitDays =
    trip.estimatedTransitDays ??
    trip.transitDays ??
    null;


  /* =====================================
     LOADING
  ===================================== */

  const loadingStatus =
    safeText(
      activeVehicle
        ?.loadingStatus,
      "Pending"
    );


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
    null;


  const loadingRemarks =
    safeText(
      activeVehicle
        ?.loadingRemarks
    );


  /* =====================================
     UNLOADING
  ===================================== */

  const unloadingStatus =
    safeText(
      activeVehicle
        ?.unloadingStatus,
      "Pending"
    );


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
    null;


  const unloadingRemarks =
    safeText(
      activeVehicle
        ?.unloadingRemarks
    );


  /* =====================================
     LR
  ===================================== */

  const vehicleNumber =
    safeText(
      activeVehicle
        ?.vehicleNumber
    );


  const lrNo =
    safeText(
      activeVehicle
        ?.lrNo
    );


  const lrStatus =
    safeText(
      activeVehicle
        ?.lrStatus
    );


  const lrRemarks =
    safeText(
      activeVehicle
        ?.lrRemarks
    );


  const lrSignature =
    safeText(
      activeVehicle
        ?.lrSignature
    );


  /* =====================================
     POD
  ===================================== */

  const podStatus =
    safeText(
      activeVehicle
        ?.podStatus,
      "Pending"
    );


  const courierName =
    safeText(
      activeVehicle
        ?.courierName ||
      activeVehicle
        ?.podCourierName
    );


  const trackingId =
    safeText(
      activeVehicle
        ?.trackingId ||
      activeVehicle
        ?.podTrackingId
    );


  const podCourierDate =
    formatDate(
      activeVehicle
        ?.podCourierDate
    );


  const podRemarks =
    safeText(
      activeVehicle
        ?.podRemarks
    );


  /* =====================================
     DRIVER
  ===================================== */

  const driverName =
    safeText(
      activeVehicle
        ?.driverName ||
      trip.driverName
    );


  const driverNumber =
    safeText(
      activeVehicle
        ?.driverNumber ||
      activeVehicle
        ?.driverPhone ||
      trip.driverNumber ||
      trip.driverPhone
    );


  /* =====================================
     ESCORT
  ===================================== */

  const escortVehicleNumber =
    safeText(
      trip.escortVehicleNumber
    );


  const escortName =
    safeText(
      trip.escortName
    );


  const escortContactNumber =
    safeText(
      trip.escortContactNumber ||
      trip.escortPhone
    );


  /* =====================================
     SUPERVISOR
  ===================================== */

  const supervisorName =
    safeText(
      trip.supervisorName
    );


  const supervisorContact =
    safeText(
      trip.supervisorContact ||
      trip.supervisorPhone
    );


  /* =====================================
     CLIENT
  ===================================== */

  const clientName =
    safeText(
      trip.customer
    );


  const clientContact =
    safeText(
      trip.clientContactPerson ||
      trip.customerContactPerson ||
      trip.contactPerson
    );


  const clientPhone =
    safeText(
      trip.clientPhone ||
      trip.customerPhone ||
      trip.contactNumber
    );


  /* =====================================
     TRANSPORTER
  ===================================== */

  const transporterContact =
    safeText(
      trip.transporterContactPerson ||
      trip.lspContactPerson
    );


  const transporterPhone =
    safeText(
      trip.transporterPhone ||
      trip.lspPhone
    );


  /* =====================================
     RENDER
  ===================================== */

  return (
    <section
      className="vehicle-column-panel"
    >

      {/* =================================
          STATUS STRIP
      ================================= */}

      <div
        className="vehicle-status-strip"
      >
        <div
          className="status-strip-left"
        >

          <div
            className="status-item moving"
          >
            <Navigation size={11} />

            <strong>
              {movingCount}
            </strong>

            <span>
              Moving
            </span>
          </div>


          <div
            className="status-item breakdown"
          >
            <AlertTriangle size={11} />

            <strong>
              {breakdownCount}
            </strong>

            <span>
              Breakdown
            </span>
          </div>


          <div
            className="status-item idle"
          >
            <CirclePause size={11} />

            <strong>
              {idleCount}
            </strong>

            <span>
              Idle
            </span>
          </div>


          <div
            className="status-item reached"
          >
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
          className={
            `vehicle-toggle-btn ${showVehicles
              ? "open"
              : ""
            }`
          }
          onClick={() =>
            setShowVehicles(
              (
                previous
              ) =>
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


      {/* =================================
          VEHICLE LIST
      ================================= */}

      {showVehicles && (

        <div
          className="vehicle-list-section"
        >

          <div
            className="vehicle-list-heading"
          >
            <div>
              <strong>
                Vehicle List
              </strong>

              <span>
                Select vehicle
              </span>
            </div>

            <span
              className="vehicle-list-count"
            >
              {vehicles.length}
            </span>
          </div>


          <div
            className="vehicle-mini-list"
          >

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
                      className={
                        `vehicle-mini-row ${active
                          ? "active"
                          : ""
                        }`
                      }
                      onClick={() =>
                        onSelectVehicle?.(
                          vehicleId
                        )
                      }
                    >

                      <div
                        className="vehicle-mini-main"
                      >

                        <span
                          className="vehicle-mini-truck"
                        >
                          <Truck size={12} />
                        </span>


                        <div
                          className="vehicle-mini-info"
                        >
                          <strong>
                            {safeText(
                              vehicle
                                .vehicleNumber,
                              `Vehicle ${index + 1
                              }`
                            )}
                          </strong>

                          <span>
                            {safeText(
                              vehicle
                                .currentPosition ||
                              vehicle
                                .currentLocation,
                              "Location unavailable"
                            )}
                          </span>
                        </div>

                      </div>


                      <div
                        className="vehicle-mini-right"
                      >
                        <span
                          className={
                            `vehicle-mini-status ${statusClass}`
                          }
                        >
                          {getVehicleStatusIcon(
                            vehicle.status
                          )}

                          {safeText(
                            vehicle.status,
                            "Unknown"
                          )}
                        </span>

                        <small>
                          {formatLastUpdated(
                            vehicle
                              .lastUpdated
                          )}
                        </small>
                      </div>

                    </button>
                  );
                }
              )

            ) : (

              <div
                className="vehicle-mini-empty"
              >
                No vehicles found.
              </div>

            )}

          </div>

        </div>

      )}


      {/* =================================
          ROUTE
      ================================= */}

      <div
        className="trip-route-card"
      >

        <div
          className="trip-route-point"
        >
          <span>
            Origin
          </span>

          <strong>
            {safeText(
              trip.origin
            )}
          </strong>
        </div>


        <div
          className="trip-route-direction"
        >
          <span
            className="route-line"
          />

          <div
            className="route-center-content"
          >
            <span
              className="route-material-name"
            >
              {safeText(
                trip.materialType
              )}
            </span>

            <span
              className="route-vehicle-icon"
            >
              <Truck size={13} />
            </span>
          </div>

          <span
            className="route-line"
          />
        </div>


        <div
          className="trip-route-point destination"
        >
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

      <div
        className="trip-distance-summary"
      >

        <div
          className="distance-summary-item total"
        >
          <span>
            Total KM
          </span>

          <strong>
            {formatKm(
              totalKm
            )}
          </strong>
        </div>


        <div
          className="distance-summary-item covered"
        >
          <span>
            KM Covered
          </span>

          <strong>
            {formatKm(
              kmCovered
            )}
          </strong>
        </div>


        <div
          className="distance-summary-item balance"
        >
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

      <div
        className="movement-card-section"
      >

        <div
          className="movement-heading-row"
        >

          <span
            className="section-heading-icon blue"
          >
            <Navigation size={12} />
          </span>


          <div
            className="movement-heading-content"
          >

            <div
              className="movement-title-line"
            >
              <strong>
                Movement Status
              </strong>

              <span
                className="movement-vehicle-badge"
              >
                {vehicleNumber}
              </span>
            </div>

            <span
              className="movement-heading-subtitle"
            >
              Current vehicle movement
            </span>

          </div>

        </div>


        <div
          className="movement-card-grid"
        >

          <div
            className="movement-info-card"
          >
            <span>
              Current Position
            </span>

            <strong>
              {currentPosition}
            </strong>
          </div>


          <div
            className="movement-info-card"
          >
            <span>
              Yesterday Position
            </span>

            <strong>
              {yesterdayPosition}
            </strong>
          </div>


          <div
            className="movement-info-card"
          >
            <span>
              Running KM
            </span>

            <strong>
              {formatKm(
                runningKm
              )}
            </strong>
          </div>


          <div
            className="movement-info-card"
          >
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

        </div>

      </div>


      {/* =================================
          TRIP DETAILS
      ================================= */}

      

        {/* TRANSIT */}

        <div
          className="transit-day-row"
        >
          <div>
            <Route size={12} />

            <span>
              Estimated Transit
            </span>
          </div>

          <strong>
            {formatDays(
              transitDays
            )}
          </strong>
        </div>


        {/* =================================
            LOADING + UNLOADING
        ================================= */}

        <div
          className="operation-details-section"
        >

          <div
            className="operation-main-grid"
          >

            {/* LOADING */}

            <div
              className="simple-operation-card loading-card"
            >

              <div
                className="simple-operation-header"
              >

                <div
                  className="simple-operation-title"
                >
                  <span
                    className="simple-operation-icon loading"
                  >
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


                <span
                  className="simple-operation-status loading"
                >
                  {loadingStatus}
                </span>

              </div>


              <div
                className="simple-operation-details"
              >

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
                  value={
                    formatDays(
                      loadingHaltingDays
                    )
                  }
                  halting
                />


                <div
                  className="simple-remarks-box"
                >
                  <div
                    className="simple-remarks-heading"
                  >
                    <MessageSquareText
                      size={10}
                    />

                    <span>
                      Remarks
                    </span>
                  </div>

                  <div
                    className="simple-remarks-value"
                  >
                    {loadingRemarks}
                  </div>
                </div>

              </div>

            </div>


            {/* UNLOADING */}

            <div
              className="simple-operation-card unloading-card"
            >

              <div
                className="simple-operation-header"
              >

                <div
                  className="simple-operation-title"
                >
                  <span
                    className="simple-operation-icon unloading"
                  >
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


                <span
                  className="simple-operation-status unloading"
                >
                  {unloadingStatus}
                </span>

              </div>


              <div
                className="simple-operation-details"
              >

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
                  value={
                    formatDays(
                      unloadingHaltingDays
                    )
                  }
                  halting
                />


                <div
                  className="simple-remarks-box"
                >
                  <div
                    className="simple-remarks-heading"
                  >
                    <MessageSquareText
                      size={10}
                    />

                    <span>
                      Remarks
                    </span>
                  </div>

                  <div
                    className="simple-remarks-value"
                  >
                    {unloadingRemarks}
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>


        {/* CLIENT */}

        <div
          className="trip-detail-group client-group"
        >

          <div
            className="trip-detail-group-title"
          >
            <span
              className="trip-detail-group-icon client"
            >
              <Package size={12} />
            </span>

            <strong>
              Client Details
            </strong>
          </div>


          <div
            className="trip-detail-row"
          >
            <span
              className="trip-detail-label"
            >
              Client Name
            </span>

            <span
              className="trip-detail-colon"
            >
              :
            </span>

            <strong
              className="trip-detail-value"
            >
              {clientName}
            </strong>
          </div>


          <div
            className="trip-detail-row"
          >
            <span
              className="trip-detail-label"
            >
              Contact Person
            </span>

            <span
              className="trip-detail-colon"
            >
              :
            </span>

            <strong
              className="trip-detail-value"
            >
              {clientContact}
            </strong>
          </div>


          <div
            className="trip-detail-row"
          >
            <span
              className="trip-detail-label"
            >
              Phone No.
            </span>

            <span
              className="trip-detail-colon"
            >
              :
            </span>

            <strong
              className="trip-detail-value"
            >
              {clientPhone}
            </strong>
          </div>

        </div>


        {/* TRANSPORTER */}

        <div
          className="trip-detail-group transporter-group"
        >

          <div
            className="trip-detail-group-title"
          >
            <span
              className="trip-detail-group-icon transporter"
            >
              <Truck size={12} />
            </span>

            <strong>
              Transporter Details
            </strong>
          </div>


          <div
            className="trip-detail-row"
          >
            <span
              className="trip-detail-label"
            >
              Transporter
            </span>

            <span
              className="trip-detail-colon"
            >
              :
            </span>

            <strong
              className="trip-detail-value"
            >
              {lsp}
            </strong>
          </div>


          <div
            className="trip-detail-row"
          >
            <span
              className="trip-detail-label"
            >
              Contact Person
            </span>

            <span
              className="trip-detail-colon"
            >
              :
            </span>

            <strong
              className="trip-detail-value"
            >
              {transporterContact}
            </strong>
          </div>


          <div
            className="trip-detail-row"
          >
            <span
              className="trip-detail-label"
            >
              Phone No.
            </span>

            <span
              className="trip-detail-colon"
            >
              :
            </span>

            <strong
              className="trip-detail-value"
            >
              {transporterPhone}
            </strong>
          </div>

        </div>





        {/* =================================
            LR & POD
        ================================= */}

        <div
          className="lr-pod-card"
        >

          <div
            className="lr-pod-heading"
          >
            <FileText size={12} />

            <strong>
              LR & POD Details
            </strong>
          </div>


          <div
            className="lr-primary-grid"
          >

            <PrimaryItem
              label="Vehicle No."
              value={
                vehicleNumber
              }
            />

            <PrimaryItem
              label="LR No."
              value={
                lrNo
              }
            />

            <PrimaryItem
              label="LR Status"
              value={
                lrStatus
              }
            />

            <PrimaryItem
              label="LR Signature date"
              value={
                lrSignature
              }
            />

          </div>


          <div
            className="lr-remarks-box"
          >
            <div
              className="lr-remarks-label"
            >
              <MessageSquareText
                size={10}
              />

              <span>
                LR Remarks
              </span>
            </div>

            <div
              className="lr-remarks-value"
            >
              {lrRemarks}
            </div>
          </div>


          <div
            className="pod-details-grid"
          >

            <PrimaryItem
              pod
              label="POD Status"
              value={
                podStatus
              }
            />

            <PrimaryItem
              pod
              label="Courier Name"
              value={
                courierName
              }
            />

            <PrimaryItem
              pod
              label="Tracking ID"
              value={
                trackingId
              }
            />

            <PrimaryItem
              pod
              label="Courier Date"
              value={
                podCourierDate
              }
            />

          </div>


          {/* DRIVER */}

          <PersonSection
            className="driver-section"
            icon={
              <Truck size={11} />
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


          {/* ESCORT */}

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


          {/* SUPERVISOR */}

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


          {/* POD REMARKS */}

          <div
            className="pod-remarks-box"
          >
            <div
              className="pod-remarks-label"
            >
              <MessageSquareText
                size={10}
              />

              <span>
                Remarks
              </span>
            </div>

            <div
              className="pod-remarks-value"
            >
              {podRemarks}
            </div>
          </div>

        </div>

      

    </section>
  );
};


/* =========================================
   DETAIL ROW
========================================= */

const DetailRow = ({
  label,
  value,
  halting = false,
}) => {
  return (
    <div
      className="simple-detail-row"
    >
      <span
        className="simple-detail-label"
      >
        {label}
      </span>

      <span
        className="simple-detail-colon"
      >
        :
      </span>

      <strong
        className={
          `simple-detail-value ${halting
            ? "halting"
            : ""
          }`
        }
      >
        {safeText(
          value
        )}
      </strong>
    </div>
  );
};


/* =========================================
   PRIMARY ITEM
========================================= */

const PrimaryItem = ({
  label,
  value,
  pod = false,
}) => {
  return (
    <div
      className={
        pod
          ? "pod-detail-item"
          : "lr-primary-item"
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {safeText(
          value
        )}
      </strong>
    </div>
  );
};


/* =========================================
   PERSON SECTION
========================================= */

const PersonSection = ({
  className = "",
  icon,
  title,
  rows = [],
}) => {
  return (
    <div
      className={
        `lr-person-section ${className}`
      }
    >

      <div
        className="lr-person-heading"
      >
        {icon}

        <strong>
          {title}
        </strong>
      </div>


      <div
        className="lr-person-content"
      >

        {rows.map(
          (
            [
              label,
              value,
            ]
          ) => (
            <div
              className="lr-person-row"
              key={label}
            >
              <span>
                {label}
              </span>

              <span
                className="lr-person-colon"
              >
                :
              </span>

              <strong>
                {safeText(
                  value
                )}
              </strong>
            </div>
          )
        )}

      </div>

    </div>
  );
};


export default VehicleColumn;