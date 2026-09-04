import React, { useEffect, useMemo, useState } from "react";
import "../pagescss/keyaccount.css";

/* =========================================================
   CONSTANTS
========================================================= */

const INITIAL_ORDERS = [
  {
    id: "CO-3301",
    client: "Ultratech Cement",
    cargo: "Cement Bags (Grade 53)",
    weight: "28 Tons",
    origin: "Peenya Industrial Area",
    destination: "Hebbal Yard",
    stage: "Vendor Finalization",
    role: "Vendor Management / Procurement Team",
    vehicleType: "Open Truck",
    loadingDate: "2026-09-06",
    vendor: "South Line Logistics",
    quotedRate: "42000",
    negotiatedRate: "39500",
    instructions: "Covered vehicle preferred. Avoid water exposure.",
  },
  {
    id: "CO-3302",
    client: "Larsen & Toubro",
    cargo: "Heavy Machinery Turbine Housing",
    weight: "36 Tons",
    origin: "Whitefield Complex",
    destination: "Thermal Power Site",
    stage: "Vendor Finalization",
    role: "Vendor Management / Procurement Team",
    vehicleType: "Trailer",
    loadingDate: "2026-09-07",
    vendor: "Vega Transport",
    quotedRate: "68000",
    negotiatedRate: "65000",
    instructions: "Heavy cargo handling and escort required.",
  },
  {
    id: "CO-3303",
    client: "JSW Steel",
    cargo: "Steel Coils",
    weight: "32 Tons",
    origin: "Hosur Industrial Area",
    destination: "Tumkur Plant",
    stage: "Vehicle Assigned",
    role: "Fleet Operations Team",
    vehicleType: "Flatbed",
    loadingDate: "2026-09-05",
    vendor: "OTC Logistics",
    quotedRate: "52000",
    negotiatedRate: "50000",
    instructions: "Use coil restraints and wheel chocks.",
  },
  {
    id: "CO-3304",
    client: "ACC Limited",
    cargo: "Bulk Cement",
    weight: "30 Tons",
    origin: "Bidadi Plant",
    destination: "Bangalore Yard",
    stage: "Trip Started",
    role: "Transport Operations Team",
    vehicleType: "Container Truck",
    loadingDate: "2026-09-04",
    vendor: "Metro Roadlines",
    quotedRate: "36000",
    negotiatedRate: "34500",
    instructions: "Report at gate 30 minutes before loading slot.",
  },
  {
    id: "CO-3305",
    client: "Tata Projects",
    cargo: "Structural Steel",
    weight: "24 Tons",
    origin: "Electronic City",
    destination: "Mysore Road Site",
    stage: "Delivery In Progress",
    role: "Control Tower / Tracking Team",
    vehicleType: "Trailer",
    loadingDate: "2026-09-03",
    vendor: "South Line Logistics",
    quotedRate: "45500",
    negotiatedRate: "44000",
    instructions: "Share live location every 2 hours.",
  },
  {
    id: "CO-3306",
    client: "Adani Power",
    cargo: "Power Equipment",
    weight: "42 Tons",
    origin: "Bangalore Warehouse",
    destination: "Bellary Power Site",
    stage: "Documentation",
    role: "Documentation Team",
    vehicleType: "Trailer",
    loadingDate: "2026-09-08",
    vendor: "Vega Transport",
    quotedRate: "82000",
    negotiatedRate: "79000",
    instructions: "Verify permits before vehicle reporting.",
  },
];

const LIFECYCLE_STEPS = [
  "Client Enquiry",
  "Order Finalization",
  "PO Documents",
  "Vendor Finalization",
  "Completion & Order Placed",
];

const STAGE_TO_STEP_INDEX = {
  "Client Enquiry": 0,
  "Order Finalization": 1,
  Documentation: 2,
  "PO Documents": 2,
  "Vendor Finalization": 3,
  "Vehicle Assigned": 3,
  "Trip Started": 4,
  "Delivery In Progress": 4,
  "Completion & Order Placed": 4,
};

const STEP_TO_STAGE = [
  "Client Enquiry",
  "Order Finalization",
  "Documentation",
  "Vendor Finalization",
  "Completion & Order Placed",
];

const STEP_TO_ROLE = [
  "Key Account Management Team",
  "Commercial / Pricing Team",
  "Documentation Team",
  "Vendor Management / Procurement Team",
  "Transport Operations Team",
];

const VEHICLE_TYPES = [
  "Open Truck",
  "Trailer",
  "Container Truck",
  "Flatbed",
];

const PRIMARY_VEHICLE_TYPES = [
  "Open Truck",
  "Trailer",
  "Container Truck",
  "Flatbed",
  "Low Bed Trailer",
  "Hydraulic Axle Trailer",
  "Multi Axle Trailer",
  "Tempo / LCV",
  "Pickup Truck",
  "Crane Mounted Truck",
];

const VENDORS = [
  "OTC Logistics",
  "South Line Logistics",
  "Vega Transport",
  "Metro Roadlines",
];

const TRIP_ID_YEAR = 2026;

const EMPTY_VEHICLE = {
  vehicleNumber: "",
  vehicleType: "",
  driverName: "",
  driverNumber: "",
};

const createEmptyTripForm = (tripId = "") => ({
  movementType: "",
  client: "",
  tripId,
  enquiryDate: "",
  placementDate: "",
  origin: "",
  destination: "",
  estimatedDistance: "",
  cargo: "",
  weight: "",
  height: "",
  width: "",
  remark: "",
  requiredVehicles: "",
  primaryVehicleType: "",
  vehicles: [{ ...EMPTY_VEHICLE }],
});

/* =========================================================
   HELPERS
========================================================= */


const getNextTripId = (orders) => {
  const prefix = `${TRIP_ID_YEAR}-`;

  const highestSequence = orders.reduce((highest, order) => {
    const tripId = String(order.tripId || order.id || "").trim();

    if (!tripId.startsWith(prefix)) {
      return highest;
    }

    const sequence = Number(tripId.slice(prefix.length));

    return Number.isInteger(sequence) && sequence > highest
      ? sequence
      : highest;
  }, 0);

  return `${TRIP_ID_YEAR}-${highestSequence + 1}`;
};

const getStageClass = (stage) =>
  `stage-badge stage-${String(stage)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

const formatCurrency = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const KeyAccount = () => {
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem("kamOrders");
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [tripForm, setTripForm] = useState(() => createEmptyTripForm());
  const [toast, setToast] = useState("");
  const [tripUpload, setTripUpload] = useState(null);

  useEffect(() => {
    localStorage.setItem("kamOrders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const stages = useMemo(
    () => ["All Stages", ...Array.from(new Set(orders.map((order) => order.stage)))],
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return orders.filter((order) => {
      const haystack = [
        order.id,
        order.client,
        order.cargo,
        order.weight,
        order.origin,
        order.destination,
        order.stage,
        order.role,
        order.vehicleType,
        order.vendor,
        order.movementType,
        order.tripId,
        order.enquiryDate,
        order.placementDate,
        order.estimatedDistance,
        order.height,
        order.width,
        order.remark,
        order.requiredVehicles,
        order.primaryVehicleType,
        order.documentName,
        ...(Array.isArray(order.vehicles)
          ? order.vehicles.flatMap((vehicle) => [
              vehicle.vehicleNumber,
              vehicle.vehicleType,
              vehicle.driverName,
              vehicle.driverNumber,
            ])
          : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchText || haystack.includes(searchText);
      const matchesStage =
        stageFilter === "All Stages" || order.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [orders, search, stageFilter]);

  const stats = useMemo(() => {
    const active = orders.filter((order) =>
      ["Vehicle Assigned", "Trip Started", "Delivery In Progress"].includes(order.stage)
    ).length;

    const vendorPending = orders.filter(
      (order) => order.stage === "Vendor Finalization"
    ).length;

    const documentation = orders.filter(
      (order) => order.stage === "Documentation"
    ).length;

    return {
      total: orders.length,
      active,
      vendorPending,
      documentation,
    };
  }, [orders]);

  const handleOrderClick = (order) => {
    setSelectedOrderId(order.id);
  };

  const handleBackFromDetail = () => {
    setSelectedOrderId(null);
  };

  const handleOpenTripModal = () => {
    const nextTripId = getNextTripId(orders);
    setTripForm(createEmptyTripForm(nextTripId));
    setTripUpload(null);
    setShowTripModal(true);
  };

  const handleCloseTripModal = () => {
    setShowTripModal(false);
    setTripForm(createEmptyTripForm());
    setTripUpload(null);
  };

  const handleTripOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      handleCloseTripModal();
    }
  };

  const handleTripFieldChange = (field) => (event) => {
    setTripForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleMovementTypeChange = (event) => {
    const movementType = event.target.value;

    setTripForm((previous) => ({
      ...previous,
      movementType,
      requiredVehicles:
        movementType === "Crane" || movementType === "Other"
          ? previous.requiredVehicles || "1"
          : previous.requiredVehicles,
      primaryVehicleType:
        movementType === "Crane" || movementType === "Other"
          ? previous.primaryVehicleType
          : previous.primaryVehicleType,
    }));

    setTripUpload(null);
  };

  const handleTripFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setTripUpload(file);
  };

  const handleVehicleFieldChange = (index, field) => (event) => {
    const value = event.target.value;

    setTripForm((previous) => ({
      ...previous,
      vehicles: previous.vehicles.map((vehicle, vehicleIndex) =>
        vehicleIndex === index
          ? {
              ...vehicle,
              [field]: value,
            }
          : vehicle
      ),
    }));
  };

  const handleAddVehicle = () => {
    setTripForm((previous) => ({
      ...previous,
      vehicles: [
        ...previous.vehicles,
        { ...EMPTY_VEHICLE },
      ],
    }));
  };

  const handleRemoveVehicle = (index) => {
    setTripForm((previous) => {
      if (previous.vehicles.length === 1) {
        return previous;
      }

      return {
        ...previous,
        vehicles: previous.vehicles.filter(
          (_, vehicleIndex) => vehicleIndex !== index
        ),
      };
    });
  };

  const handleCreateTrip = () => {
    const isWTG = tripForm.movementType === "WTG Movement";
    const isCraneOrOther =
      tripForm.movementType === "Crane" ||
      tripForm.movementType === "Other";

    if (!tripForm.movementType) {
      setToast("Please select a movement type.");
      return;
    }

    const commonRequiredFields = [
      tripForm.client,
      tripForm.tripId,
      tripForm.enquiryDate,
      tripForm.placementDate,
      tripForm.origin,
      tripForm.destination,
      tripForm.estimatedDistance,
      tripForm.cargo,
      tripForm.weight,
    ];

    if (commonRequiredFields.some((value) => !String(value).trim())) {
      setToast("Please complete all required trip fields.");
      return;
    }

    if (
      isWTG &&
      [tripForm.height, tripForm.width].some(
        (value) => !String(value).trim()
      )
    ) {
      setToast("Please enter WTG height and width.");
      return;
    }

    if (
      isCraneOrOther &&
      (!String(tripForm.requiredVehicles).trim() ||
        !String(tripForm.primaryVehicleType).trim())
    ) {
      setToast(
        "Please enter Required Vehicles and select Primary Vehicle Type."
      );
      return;
    }

    if (isWTG) {
      const invalidVehicle = tripForm.vehicles.some(
        (vehicle) =>
          !String(vehicle.vehicleNumber).trim() ||
          !String(vehicle.vehicleType).trim()
      );

      if (invalidVehicle) {
        setToast(
          "Enter Vehicle Number and Vehicle Type for every WTG vehicle."
        );
        return;
      }
    }

    const duplicateTrip = orders.some(
      (order) =>
        String(order.tripId || order.id).trim().toLowerCase() ===
        String(tripForm.tripId).trim().toLowerCase()
    );

    if (duplicateTrip) {
      const latestTripId = getNextTripId(orders);

      setTripForm((previous) => ({
        ...previous,
        tripId: latestTripId,
      }));

      setToast(`Trip ID changed to ${latestTripId}. Please create again.`);
      return;
    }

    const cleanVehicles = isWTG
      ? tripForm.vehicles.map((vehicle) => ({
          vehicleNumber: vehicle.vehicleNumber.trim().toUpperCase(),
          vehicleType: vehicle.vehicleType,
          driverName: vehicle.driverName.trim(),
          driverNumber: vehicle.driverNumber.trim(),
        }))
      : [];

    const requiredVehicleCount = isWTG
      ? cleanVehicles.length
      : Number(tripForm.requiredVehicles);

    const primaryVehicleType = isWTG
      ? cleanVehicles.length === 1
        ? cleanVehicles[0].vehicleType
        : cleanVehicles[0]?.vehicleType || ""
      : tripForm.primaryVehicleType;

    const uploadMeta = tripUpload
      ? {
          name: tripUpload.name,
          type: tripUpload.type,
          size: tripUpload.size,
          lastModified: tripUpload.lastModified,
        }
      : null;

    const newOrder = {
      id: tripForm.tripId,
      tripId: tripForm.tripId,
      movementType: tripForm.movementType,
      client: tripForm.client.trim(),
      enquiryDate: tripForm.enquiryDate,
      placementDate: tripForm.placementDate,
      date: tripForm.enquiryDate,
      origin: tripForm.origin.trim(),
      destination: tripForm.destination.trim(),
      estimatedDistance: Number(tripForm.estimatedDistance),
      cargo: tripForm.cargo.trim(),
      weight: `${tripForm.weight} Tons`,
      height: isWTG ? Number(tripForm.height) : null,
      width: isWTG ? Number(tripForm.width) : null,
      remark: isWTG ? tripForm.remark.trim() : "",
      instructions: isWTG ? tripForm.remark.trim() : "",
      vehicles: cleanVehicles,
      requiredVehicles: requiredVehicleCount,
      vehicleCount: requiredVehicleCount,
      primaryVehicleType,
      vehicleType:
        isWTG && cleanVehicles.length > 1
          ? `${primaryVehicleType} +${cleanVehicles.length - 1}`
          : primaryVehicleType,
      document: uploadMeta,
      documentName: uploadMeta?.name || "",
      loadingDate: tripForm.placementDate,
      stage: "Client Enquiry",
      role: "Key Account Management Team",
      vendor: "",
      quotedRate: "",
      negotiatedRate: "",
    };

    setOrders((previous) => [newOrder, ...previous]);
    setSelectedOrderId(newOrder.id);
    setToast(
      `${newOrder.tripId} created with ${newOrder.vehicleCount} required vehicle${
        newOrder.vehicleCount > 1 ? "s" : ""
      }.`
    );
    handleCloseTripModal();
  };

  const handleUpdateOrder = (updatedOrder, message = "Order updated.") => {
    setOrders((previous) =>
      previous.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
    setToast(message);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStageFilter("All Stages");
  };

  return (
    <div className="key-account-page">
      {toast && <div className="kam-toast">{toast}</div>}

      <div className="key-account-shell">
        <section className="kam-page-heading">
          <div>
            <span className="kam-eyebrow">TRIPS / KEY ACCOUNT MANAGEMENT</span>
            <h1>Running Order Management</h1>
            <p>
              Manage client orders, commercial workflow, vendor finalization and
              trip readiness from one operational workspace.
            </p>
          </div>

          <button
            type="button"
            className="new-trip-button"
            onClick={handleOpenTripModal}
          >
            <span className="new-trip-plus">+</span>
            New Trip
          </button>
        </section>

        <section className="kam-stat-grid" aria-label="Order summary">
          <SummaryCard
            label="Total Orders"
            value={stats.total}
            caption="All running orders"
            icon="01"
          />
          <SummaryCard
            label="Active Movement"
            value={stats.active}
            caption="Assigned / in transit"
            icon="02"
          />
          <SummaryCard
            label="Vendor Pending"
            value={stats.vendorPending}
            caption="Awaiting finalization"
            icon="03"
          />
          <SummaryCard
            label="Documentation"
            value={stats.documentation}
            caption="Documents in process"
            icon="04"
          />
        </section>

          <section className="key-account-container">
            <div className="key-account-header">
              <div className="key-account-header-left">
                <h2>Running Order List</h2>
                <p>
                  Select any order to open its commercial and operational lifecycle.
                </p>
              </div>

              <div className="kam-header-indicator">
                <span className="kam-status-dot" />
                Live workspace
              </div>
            </div>

            <div className="key-account-filters">
              <div className="key-search-box">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="M16 16l4 4" />
                </svg>

                <input
                  type="text"
                  placeholder="Search order, client, cargo, route, vendor..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="key-stage-select">
                <select
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value)}
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>

                <svg
                  className="select-arrow"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>

              {(search || stageFilter !== "All Stages") && (
                <button
                  type="button"
                  className="kam-clear-filter"
                  onClick={handleClearFilters}
                >
                  Clear
                </button>
              )}

              <div className="order-count">
                <strong>{filteredOrders.length}</strong>
                <span>of {orders.length} orders</span>
              </div>
            </div>

            <div className="key-account-table-wrapper">
              <table className="key-account-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CLIENT</th>
                    <th>CARGO &amp; WEIGHT</th>
                    <th>ROUTE</th>
                    <th>STAGE</th>
                    <th>RESPONSIBLE TEAM</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="key-account-row"
                        onClick={() => handleOrderClick(order)}
                      >
                        <td>
                          <div className="order-id">{order.id}</div>
                          <span className="order-subtext">Running order</span>
                        </td>

                        <td>
                          <div className="client-name">{order.client}</div>
                          <span className="order-subtext">
                            {order.vehicleCount
                              ? `${order.vehicleCount} vehicle${
                                  Number(order.vehicleCount) > 1 ? "s" : ""
                                }`
                              : Array.isArray(order.vehicles) &&
                                order.vehicles.length
                              ? `${order.vehicles.length} vehicle${
                                  order.vehicles.length > 1 ? "s" : ""
                                }`
                              : order.vehicleType || "Vehicle pending"}
                          </span>
                        </td>

                        <td className="cargo-details">
                          <div className="cargo-name">{order.cargo}</div>
                          <div className="cargo-weight">{order.weight}</div>
                        </td>

                        <td className="route-details">
                          <span>{order.origin}</span>
                          <span className="route-arrow">→</span>
                          <span>{order.destination}</span>
                        </td>

                        <td>
                          <span className={getStageClass(order.stage)}>
                            <span className="stage-dot" />
                            {order.stage}
                          </span>
                        </td>

                        <td>
                          <div className="role-responsible">{order.role}</div>
                          <span className="order-row-arrow">Open →</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-orders">
                        <div className="no-orders-icon">⌕</div>
                        <strong>No matching orders found</strong>
                        <span>Try changing your search or stage filter.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
      </div>

      {selectedOrder && (
        <div
          className="kam-workflow-modal-overlay"
          role="presentation"
          onMouseDown={handleBackFromDetail}
        >
          <section
            className="kam-workflow-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Order workflow ${selectedOrder.id}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="kam-detail-toolbar kam-modal-toolbar">
              <div className="kam-modal-toolbar-left">
                <button
                  type="button"
                  className="kam-back-btn"
                  onClick={handleBackFromDetail}
                >
                  <span aria-hidden="true">←</span>
                  {/* Back to Orders */}
                </button>

                <div className="kam-modal-heading">
                  <span>ORDER LIFECYCLE</span>
                  <strong>{selectedOrder.client}</strong>
                </div>
              </div>

              <div className="kam-modal-toolbar-right">
                <div className="kam-detail-meta">
                  <span>{selectedOrder.client}</span>
                  <strong>{selectedOrder.id}</strong>
                </div>

                <button
                  type="button"
                  className="kam-workflow-close"
                  onClick={handleBackFromDetail}
                  aria-label="Close order workflow"
                >
                  ×
                </button>
              </div>
            </div>

            <OrderLifecyclePanel
              key={selectedOrder.id}
              order={selectedOrder}
              onUpdate={handleUpdateOrder}
            />
          </section>
        </div>
      )}

      {showTripModal && (
        <div
          className="trip-modal-overlay"
          onMouseDown={handleTripOverlayClick}
          role="presentation"
        >
          <div
            className="trip-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-trip-title"
          >
            <div className="trip-modal-header">
              <div>
                <span className="trip-modal-subtitle">KEY ACCOUNT MANAGEMENT</span>
                <h2 id="new-trip-title">New Trip Creation</h2>
                <p>Enter movement, client, route, cargo and vehicle details.</p>
              </div>

              <button
                type="button"
                className="trip-modal-close"
                onClick={handleCloseTripModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="trip-modal-body">
              <section className="trip-form-section trip-movement-section">
                <div className="trip-section-heading">
                  <div>
                    <span>01</span>
                    <div>
                      <strong>Movement Type</strong>
                      <small>Select the operation to load the correct trip form.</small>
                    </div>
                  </div>
                </div>

                <div className="trip-field-group trip-field-full">
                  <label>
                    Movement Type <span className="trip-required">*</span>
                  </label>

                  <div className="trip-select-wrap">
                    <select
                      value={tripForm.movementType}
                      onChange={handleMovementTypeChange}
                    >
                      <option value="">Select movement type...</option>
                      <option value="WTG Movement">WTG Movement</option>
                      <option value="Crane">Crane</option>
                      <option value="Other">Other</option>
                    </select>
                    <span className="trip-select-arrow">⌄</span>
                  </div>
                </div>
              </section>

              {!tripForm.movementType && (
                <div className="trip-empty-state">
                  <div className="trip-empty-state-icon">↗</div>
                  <strong>Select a movement type</strong>
                  <p>
                    WTG, Crane and Other movements use different operational
                    fields.
                  </p>
                </div>
              )}

              {tripForm.movementType === "WTG Movement" && (
                <>
                  <section className="trip-form-section">
                    <div className="trip-section-heading">
                      <div>
                        <span>02</span>
                        <div>
                          <strong>WTG Trip Information</strong>
                          <small>
                            Commercial, enquiry, placement and route details.
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="trip-form-grid">
                      <AutoTripId value={tripForm.tripId} />

                      <TripField
                        label="Client Name"
                        required
                        value={tripForm.client}
                        placeholder="Enter client name"
                        onChange={handleTripFieldChange("client")}
                      />

                      <TripField
                        label="Enquiry Date"
                        required
                        type="date"
                        value={tripForm.enquiryDate}
                        onChange={handleTripFieldChange("enquiryDate")}
                      />

                      <TripField
                        label="Placement Date"
                        required
                        type="date"
                        value={tripForm.placementDate}
                        onChange={handleTripFieldChange("placementDate")}
                      />

                      <TripField
                        label="Estimated KM"
                        required
                        type="number"
                        min="0"
                        value={tripForm.estimatedDistance}
                        placeholder="Enter estimated distance"
                        unit="KM"
                        onChange={handleTripFieldChange("estimatedDistance")}
                      />

                      <TripField
                        label="Cargo Type"
                        required
                        value={tripForm.cargo}
                        placeholder="e.g. WTG Blade / Tower Section"
                        onChange={handleTripFieldChange("cargo")}
                      />

                      <TripField
                        label="Origin"
                        required
                        value={tripForm.origin}
                        placeholder="Enter origin"
                        onChange={handleTripFieldChange("origin")}
                      />

                      <TripField
                        label="Destination"
                        required
                        value={tripForm.destination}
                        placeholder="Enter destination"
                        onChange={handleTripFieldChange("destination")}
                      />
                    </div>
                  </section>

                  <section className="trip-form-section">
                    <div className="trip-section-heading">
                      <div>
                        <span>03</span>
                        <div>
                          <strong>WTG Cargo Dimensions</strong>
                          <small>
                            Weight, height, width and placement remarks.
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="trip-form-grid">
                      <TripField
                        label="Weight"
                        required
                        type="number"
                        min="0"
                        value={tripForm.weight}
                        placeholder="Enter weight"
                        unit="TON"
                        onChange={handleTripFieldChange("weight")}
                      />

                      <TripField
                        label="Height"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={tripForm.height}
                        placeholder="Enter height"
                        unit="FT"
                        onChange={handleTripFieldChange("height")}
                      />

                      <TripField
                        label="Width"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={tripForm.width}
                        placeholder="Enter width"
                        unit="FT"
                        onChange={handleTripFieldChange("width")}
                      />

                      <div className="trip-field-group trip-field-full">
                        <label>Remark</label>
                        <textarea
                          rows={3}
                          value={tripForm.remark}
                          placeholder="Enter WTG placement, route, loading or handling remarks..."
                          onChange={handleTripFieldChange("remark")}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="trip-form-section">
                    <div className="trip-section-heading">
                      <div>
                        <span>04</span>
                        <div>
                          <strong>WTG Vehicles</strong>
                          <small>
                            One WTG trip can contain multiple assigned vehicles.
                          </small>
                        </div>
                      </div>

                      <span className="trip-vehicle-count">
                        {tripForm.vehicles.length} Vehicle
                        {tripForm.vehicles.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="trip-vehicle-list">
                      {tripForm.vehicles.map((vehicle, index) => (
                        <div
                          className="trip-vehicle-card"
                          key={`vehicle-${index}`}
                        >
                          <div className="trip-vehicle-card-header">
                            <div>
                              <span className="trip-vehicle-index">
                                Vehicle {index + 1}
                              </span>
                              <small>
                                Assignment for {tripForm.tripId || "new trip"}
                              </small>
                            </div>

                            {tripForm.vehicles.length > 1 && (
                              <button
                                type="button"
                                className="trip-remove-vehicle"
                                onClick={() => handleRemoveVehicle(index)}
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="trip-vehicle-grid">
                            <TripField
                              label="Vehicle Number"
                              required
                              value={vehicle.vehicleNumber}
                              placeholder="e.g. KA01AB1234"
                              onChange={handleVehicleFieldChange(
                                index,
                                "vehicleNumber"
                              )}
                            />

                            <div className="trip-field-group">
                              <label>
                                Vehicle Type{" "}
                                <span className="trip-required">*</span>
                              </label>

                              <div className="trip-select-wrap">
                                <select
                                  value={vehicle.vehicleType}
                                  onChange={handleVehicleFieldChange(
                                    index,
                                    "vehicleType"
                                  )}
                                >
                                  <option value="">
                                    Select vehicle type...
                                  </option>

                                  {PRIMARY_VEHICLE_TYPES.map((vehicleType) => (
                                    <option
                                      key={vehicleType}
                                      value={vehicleType}
                                    >
                                      {vehicleType}
                                    </option>
                                  ))}
                                </select>

                                <span className="trip-select-arrow">⌄</span>
                              </div>
                            </div>

                            <TripField
                              label="Driver Name"
                              value={vehicle.driverName}
                              placeholder="Enter driver name"
                              onChange={handleVehicleFieldChange(
                                index,
                                "driverName"
                              )}
                            />

                            <TripField
                              label="Driver Number"
                              type="tel"
                              value={vehicle.driverNumber}
                              placeholder="Enter mobile number"
                              onChange={handleVehicleFieldChange(
                                index,
                                "driverNumber"
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="trip-add-vehicle"
                      onClick={handleAddVehicle}
                    >
                      <span>+</span>
                      Add Another Vehicle
                    </button>
                  </section>
                </>
              )}

              {(tripForm.movementType === "Crane" ||
                tripForm.movementType === "Other") && (
                <>
                  <section className="trip-form-section">
                    <div className="trip-section-heading">
                      <div>
                        <span>02</span>
                        <div>
                          <strong>
                            {tripForm.movementType === "Crane"
                              ? "Crane Trip Details"
                              : "Other Movement Details"}
                          </strong>
                          <small>
                            Client, cargo, enquiry, placement and route
                            information.
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="trip-form-grid">
                      <AutoTripId value={tripForm.tripId} />

                      <TripField
                        label="Client Name"
                        required
                        value={tripForm.client}
                        placeholder="Enter client name"
                        onChange={handleTripFieldChange("client")}
                      />

                      <TripField
                        label="Cargo Type"
                        required
                        value={tripForm.cargo}
                        placeholder="Enter cargo type"
                        onChange={handleTripFieldChange("cargo")}
                      />

                      <TripField
                        label="Weight"
                        required
                        type="number"
                        min="0"
                        value={tripForm.weight}
                        placeholder="Enter weight"
                        unit="TON"
                        onChange={handleTripFieldChange("weight")}
                      />

                      <TripField
                        label="Enquiry Date"
                        required
                        type="date"
                        value={tripForm.enquiryDate}
                        onChange={handleTripFieldChange("enquiryDate")}
                      />

                      <TripField
                        label="Placement Date"
                        required
                        type="date"
                        value={tripForm.placementDate}
                        onChange={handleTripFieldChange("placementDate")}
                      />

                      <TripField
                        label="Estimated KM"
                        required
                        type="number"
                        min="0"
                        value={tripForm.estimatedDistance}
                        placeholder="Enter estimated distance"
                        unit="KM"
                        onChange={handleTripFieldChange("estimatedDistance")}
                      />

                      <TripField
                        label="Origin"
                        required
                        value={tripForm.origin}
                        placeholder="Enter origin"
                        onChange={handleTripFieldChange("origin")}
                      />

                      <TripField
                        label="Destination"
                        required
                        value={tripForm.destination}
                        placeholder="Enter destination"
                        onChange={handleTripFieldChange("destination")}
                      />

                      <TripField
                        label="Required Vehicles"
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={tripForm.requiredVehicles}
                        placeholder="Enter required vehicle quantity"
                        onChange={handleTripFieldChange("requiredVehicles")}
                      />
                    </div>
                  </section>

                  <section className="trip-form-section">
                    <div className="trip-section-heading">
                      <div>
                        <span>03</span>
                        <div>
                          <strong>Vehicle & Document</strong>
                          <small>
                            Select the primary vehicle type and attach the supporting document.
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="trip-form-grid">
                      <div className="trip-field-group">
                        <label>
                          Primary Vehicle Type{" "}
                          <span className="trip-required">*</span>
                        </label>

                        <div className="trip-select-wrap">
                          <select
                            value={tripForm.primaryVehicleType}
                            onChange={handleTripFieldChange(
                              "primaryVehicleType"
                            )}
                          >
                            <option value="">
                              Select primary vehicle type...
                            </option>

                            {PRIMARY_VEHICLE_TYPES.map((vehicleType) => (
                              <option
                                key={vehicleType}
                                value={vehicleType}
                              >
                                {vehicleType}
                              </option>
                            ))}
                          </select>
                          <span className="trip-select-arrow">⌄</span>
                        </div>
                      </div>

                      <div className="trip-field-group trip-field-full">
                        <label>Upload File</label>

                        <label className="trip-file-upload">
                          <input
                            type="file"
                            onChange={handleTripFileChange}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          />

                          <span className="trip-file-icon">↑</span>

                          <span className="trip-file-content">
                            <strong>
                              {tripUpload
                                ? tripUpload.name
                                : "Choose supporting document"}
                            </strong>
                            <small>
                              PDF, Word, Excel, JPG or PNG
                            </small>
                          </span>

                          <span className="trip-file-action">
                            Browse
                          </span>
                        </label>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>

            <div className="trip-modal-actions">
              <button
                type="button"
                className="trip-btn-outline"
                onClick={handleCloseTripModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="trip-btn-primary"
                onClick={handleCreateTrip}
              >
                Create Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

const SummaryCard = ({ label, value, caption, icon }) => (
  <article className="kam-stat-card">
    <div className="kam-stat-icon">{icon}</div>
    <div>
      <span className="kam-stat-label">{label}</span>
      <strong className="kam-stat-value">{value}</strong>
      <span className="kam-stat-caption">{caption}</span>
    </div>
  </article>
);


const AutoTripId = ({ value }) => (
  <div className="trip-field-group">
    <label>
      Trip ID <span className="trip-required">*</span>
    </label>

    <div className="trip-auto-id-wrap">
      <input
        type="text"
        value={value}
        readOnly
        aria-readonly="true"
      />
      <span className="trip-auto-badge">AUTO</span>
    </div>

    <small className="trip-field-hint">
      Auto sequence: 2026-1, 2026-2, 2026-3...
    </small>
  </div>
);

const TripField = ({
  label,
  value,
  placeholder = "",
  onChange,
  type = "text",
  required = false,
  unit = "",
  min,
  step,
}) => (
  <div className="trip-field-group">
    <label>
      {label} {required && <span className="trip-required">*</span>}
    </label>

    {unit ? (
      <div className="trip-input-unit">
        <input
          type={type}
          min={min}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        <span>{unit}</span>
      </div>
    ) : (
      <input
        type={type}
        min={min}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    )}
  </div>
);

/* =========================================================
   ORDER LIFECYCLE PANEL
========================================================= */

const OrderLifecyclePanel = ({ order, onUpdate }) => {
  const initialStepIndex =
    STAGE_TO_STEP_INDEX[order.stage] !== undefined
      ? STAGE_TO_STEP_INDEX[order.stage]
      : 0;

  const [activeStepIndex, setActiveStepIndex] = useState(initialStepIndex);
  const [poFile, setPoFile] = useState(null);

  const [form, setForm] = useState({
    // Step 1 - Client Enquiry
    enquiryDate: order.enquiryDate || order.date || "",
    clientContact: order.clientContact || "",
    clientPhone: order.clientPhone || "",
    requirement: order.requirement || "",
    enquiryRemarks: order.enquiryRemarks || "",

    // Step 2 - Order Finalization
    quotedRate: order.quotedRate || "",
    negotiatedRate: order.negotiatedRate || "",
    finalRate: order.finalRate || "",
    paymentTerms: order.paymentTerms || "",
    commercialRemarks: order.commercialRemarks || "",

    // Step 3 - PO Documents
    poNumber: order.poNumber || "",
    poDate: order.poDate || "",
    poDocumentName: order.poDocumentName || order.documentName || "",
    poDocumentType: order.poDocumentType || "",
    poDocumentSize: order.poDocumentSize || 0,
    poRemarks: order.poRemarks || "",

    // Step 4 - Vendor Finalization
    vendor: order.vendor || "",
    vehicleType: order.vehicleType || "",
    vendorRate: order.vendorRate || "",
    loadingDate: order.loadingDate || "",
    vendorRemarks: order.vendorRemarks || "",

    // Step 5 - Completion & Order Placed
    vehicleNumber: order.vehicleNumber || "",
    driverName: order.driverName || "",
    driverNumber: order.driverNumber || "",
    placementDate: order.placementDate || "",
    instructions: order.instructions || "",
  });

  const handleChange = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handlePoFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setPoFile(file);

    setForm((previous) => ({
      ...previous,
      poDocumentName: file?.name || "",
      poDocumentType: file?.type || "",
      poDocumentSize: file?.size || 0,
    }));
  };

  const buildUpdatedOrder = (stepIndex = activeStepIndex) => ({
    ...order,
    ...form,
    stage: STEP_TO_STAGE[stepIndex],
    role: STEP_TO_ROLE[stepIndex],
  });

  const validateCurrentStep = () => {
    if (activeStepIndex === 0) {
      if (!String(form.enquiryDate).trim()) {
        window.alert("Enter the enquiry date before proceeding.");
        return false;
      }
    }

    if (activeStepIndex === 1) {
      if (!String(form.quotedRate).trim() || !String(form.negotiatedRate).trim()) {
        window.alert("Enter quoted rate and negotiated rate before proceeding.");
        return false;
      }
    }

    if (activeStepIndex === 2) {
      if (!String(form.poNumber).trim() || !String(form.poDate).trim()) {
        window.alert("Enter PO number and PO date before proceeding.");
        return false;
      }
    }

    if (activeStepIndex === 3) {
      if (!String(form.vendor).trim() || !String(form.vehicleType).trim()) {
        window.alert("Select a vendor and vehicle type before proceeding.");
        return false;
      }
    }

    if (activeStepIndex === 4) {
      if (!String(form.vehicleNumber).trim()) {
        window.alert("Enter the vehicle number before completing the order.");
        return false;
      }
    }

    return true;
  };

  const handleSaveDraft = () => {
    onUpdate(buildUpdatedOrder(), `${order.id} draft saved.`);
  };

  const handleAdvance = () => {
    if (!validateCurrentStep()) return;

    if (activeStepIndex >= LIFECYCLE_STEPS.length - 1) {
      onUpdate(
        {
          ...buildUpdatedOrder(activeStepIndex),
          stage: "Completion & Order Placed",
          role: "Transport Operations Team",
        },
        `${order.id} completed successfully.`
      );
      return;
    }

    const nextIndex = activeStepIndex + 1;
    setActiveStepIndex(nextIndex);
    onUpdate(
      buildUpdatedOrder(nextIndex),
      `${order.id} moved to ${LIFECYCLE_STEPS[nextIndex]}.`
    );
  };

  const renderStepFields = () => {
    switch (activeStepIndex) {
      case 0:
        return (
          <>
            <div className="kam-form-grid">
              <div className="kam-field-group">
                <label>Enquiry Date</label>
                <input
                  type="date"
                  className="kam-date-input"
                  value={form.enquiryDate}
                  onChange={handleChange("enquiryDate")}
                />
              </div>

              <div className="kam-field-group">
                <label>Client Contact Person</label>
                <div className="kam-input-wrap">
                  <input
                    type="text"
                    placeholder="Enter contact person"
                    value={form.clientContact}
                    onChange={handleChange("clientContact")}
                  />
                </div>
              </div>

              <div className="kam-field-group">
                <label>Client Contact Number</label>
                <div className="kam-input-wrap">
                  <input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={form.clientPhone}
                    onChange={handleChange("clientPhone")}
                  />
                </div>
              </div>

              <div className="kam-field-group">
                <label>Current Responsible Team</label>
                <div className="kam-readonly-field">
                  {STEP_TO_ROLE[activeStepIndex]}
                </div>
              </div>
            </div>

            <div className="kam-field-group kam-field-full">
              <label>Client Requirement</label>
              <textarea
                rows={3}
                placeholder="Enter client transport requirement..."
                value={form.requirement}
                onChange={handleChange("requirement")}
              />
            </div>

            <div className="kam-field-group kam-field-full">
              <label>Enquiry Remarks</label>
              <textarea
                rows={3}
                placeholder="Enter enquiry remarks..."
                value={form.enquiryRemarks}
                onChange={handleChange("enquiryRemarks")}
              />
            </div>
          </>
        );

      case 1:
        return (
          <>
            <div className="kam-form-grid">
              <div className="kam-field-group">
                <label>Quoted Rate</label>
                <div className="kam-input-wrap">
                  <span className="kam-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.quotedRate}
                    onChange={handleChange("quotedRate")}
                  />
                </div>
              </div>

              <div className="kam-field-group">
                <label>Negotiated Rate</label>
                <div className="kam-input-wrap">
                  <span className="kam-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.negotiatedRate}
                    onChange={handleChange("negotiatedRate")}
                  />
                </div>
              </div>

              <div className="kam-field-group">
                <label>Final Approved Rate</label>
                <div className="kam-input-wrap">
                  <span className="kam-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.finalRate}
                    onChange={handleChange("finalRate")}
                  />
                </div>
              </div>

              <div className="kam-field-group">
                <label>Payment Terms</label>
                <div className="kam-input-wrap">
                  <input
                    type="text"
                    placeholder="e.g. 30 Days"
                    value={form.paymentTerms}
                    onChange={handleChange("paymentTerms")}
                  />
                </div>
              </div>

              <div className="kam-field-group">
                <label>Current Responsible Team</label>
                <div className="kam-readonly-field">
                  {STEP_TO_ROLE[activeStepIndex]}
                </div>
              </div>
            </div>

            <div className="kam-field-group kam-field-full">
              <label>Commercial Remarks</label>
              <textarea
                rows={4}
                placeholder="Enter pricing, approval or commercial remarks..."
                value={form.commercialRemarks}
                onChange={handleChange("commercialRemarks")}
              />
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="kam-form-grid">
              <div className="kam-field-group">
                <label>PO Number</label>
                <div className="kam-input-wrap">
                  <input
                    type="text"
                    placeholder="Enter PO number"
                    value={form.poNumber}
                    onChange={handleChange("poNumber")}
                  />
                </div>
              </div>

              <div className="kam-field-group">
                <label>PO Date</label>
                <input
                  type="date"
                  className="kam-date-input"
                  value={form.poDate}
                  onChange={handleChange("poDate")}
                />
              </div>

              <div className="kam-field-group">
                <label>Current Responsible Team</label>
                <div className="kam-readonly-field">
                  {STEP_TO_ROLE[activeStepIndex]}
                </div>
              </div>

              <div className="kam-field-group">
                <label>PO Document</label>
                <div className="kam-input-wrap">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={handlePoFileChange}
                  />
                </div>
                {(poFile || form.poDocumentName) && (
                  <small className="trip-field-hint">
                    {poFile?.name || form.poDocumentName}
                  </small>
                )}
              </div>
            </div>

            <div className="kam-field-group kam-field-full">
              <label>Document Remarks</label>
              <textarea
                rows={4}
                placeholder="Enter PO or document remarks..."
                value={form.poRemarks}
                onChange={handleChange("poRemarks")}
              />
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className="kam-form-grid">
              <div className="kam-field-group">
                <label>Selected Vendor</label>
                <div className="kam-select-wrap">
                  <select value={form.vendor} onChange={handleChange("vendor")}>
                    <option value="">Select vendor...</option>
                    {VENDORS.map((vendor) => (
                      <option key={vendor} value={vendor}>
                        {vendor}
                      </option>
                    ))}
                  </select>
                  <span className="select-chevron">⌄</span>
                </div>
              </div>

              <div className="kam-field-group">
                <label>Vehicle Type Required</label>
                <div className="kam-select-wrap">
                  <select
                    value={form.vehicleType}
                    onChange={handleChange("vehicleType")}
                  >
                    <option value="">Select vehicle type...</option>
                    {PRIMARY_VEHICLE_TYPES.map((vehicle) => (
                      <option key={vehicle} value={vehicle}>
                        {vehicle}
                      </option>
                    ))}
                  </select>
                  <span className="select-chevron">⌄</span>
                </div>
              </div>

              <div className="kam-field-group">
                <label>Vendor Rate</label>
                <div className="kam-input-wrap">
                  <span className="kam-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.vendorRate}
                    onChange={handleChange("vendorRate")}
                  />
                </div>
              </div>

              <div className="kam-field-group">
                <label>Expected Loading Date</label>
                <input
                  type="date"
                  className="kam-date-input"
                  value={form.loadingDate}
                  onChange={handleChange("loadingDate")}
                />
              </div>

              <div className="kam-field-group">
                <label>Current Responsible Team</label>
                <div className="kam-readonly-field">
                  {STEP_TO_ROLE[activeStepIndex]}
                </div>
              </div>
            </div>

            <div className="kam-field-group kam-field-full">
              <label>Vendor Remarks</label>
              <textarea
                rows={4}
                placeholder="Enter vendor confirmation, loading or vehicle remarks..."
                value={form.vendorRemarks}
                onChange={handleChange("vendorRemarks")}
              />
            </div>
          </>
        );

      case 4:
        return (
          <>
            <div className="kam-form-grid">
              <div className="kam-field-group">
                <label>Vehicle Number</label>
                <div className="kam-input-wrap">
                  <input
                    type="text"
                    placeholder="e.g. KA01AB1234"
                    value={form.vehicleNumber}
                    onChange={handleChange("vehicleNumber")}
                  />
                </div>
              </div>

              <div className="kam-field-group">
                <label>Driver Name</label>
                <div className="kam-input-wrap">
                  <input
                    type="text"
                    placeholder="Enter driver name"
                    value={form.driverName}
                    onChange={handleChange("driverName")}
                  />
                </div>
              </div>

              <div className="kam-field-group">
                <label>Driver Number</label>
                <div className="kam-input-wrap">
                  <input
                    type="tel"
                    placeholder="Enter driver mobile number"
                    value={form.driverNumber}
                    onChange={handleChange("driverNumber")}
                  />
                </div>
              </div>

              <div className="kam-field-group">
                <label>Placement Date</label>
                <input
                  type="date"
                  className="kam-date-input"
                  value={form.placementDate}
                  onChange={handleChange("placementDate")}
                />
              </div>

              <div className="kam-field-group">
                <label>Current Responsible Team</label>
                <div className="kam-readonly-field">
                  {STEP_TO_ROLE[activeStepIndex]}
                </div>
              </div>
            </div>

            <div className="kam-field-group kam-field-full">
              <label>Final Instructions</label>
              <textarea
                rows={4}
                placeholder="Enter final operational instructions..."
                value={form.instructions}
                onChange={handleChange("instructions")}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="kam-detail-card">
      <div className="kam-stepper">
        {LIFECYCLE_STEPS.map((label, index) => (
          <React.Fragment key={label}>
            <button
              type="button"
              onClick={() => setActiveStepIndex(index)}
              className={
                "kam-step-pill" +
                (index === activeStepIndex ? " active" : "") +
                (index < activeStepIndex ? " completed" : "")
              }
            >
              <span className="kam-step-number">
                {index < activeStepIndex ? "✓" : index + 1}
              </span>
              <span>{label}</span>
            </button>

            {index < LIFECYCLE_STEPS.length - 1 && (
              <div
                className={
                  "kam-step-connector" +
                  (index < activeStepIndex ? " completed" : "")
                }
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="kam-card-body">
        <div className="kam-card-header">
          <div>
            <span className="kam-section-kicker">ORDER WORKFLOW</span>
            <h2>{LIFECYCLE_STEPS[activeStepIndex]} Details</h2>
            <p>
              {activeStepIndex === 0 &&
                "Capture the customer enquiry, contact and transport requirement."}
              {activeStepIndex === 1 &&
                "Finalize the commercial rate, approval and payment terms."}
              {activeStepIndex === 2 &&
                "Record PO details and supporting documentation for the order."}
              {activeStepIndex === 3 &&
                "Finalize the transport vendor, vehicle requirement and loading plan."}
              {activeStepIndex === 4 &&
                "Confirm vehicle and driver details before closing the order workflow."}
            </p>
          </div>

          <div className="kam-id-badge">
            <span>Order ID</span>
            <strong>{order.id}</strong>
          </div>
        </div>

        <div className="kam-order-overview">
          <div>
            <span>Client</span>
            <strong>{order.client}</strong>
          </div>
          <div>
            <span>Route</span>
            <strong>
              {order.origin} → {order.destination}
            </strong>
          </div>
          <div>
            <span>Cargo</span>
            <strong>
              {order.cargo} · {order.weight}
            </strong>
          </div>
          <div>
            <span>Vehicles</span>
            <strong>
              {Array.isArray(order.vehicles) && order.vehicles.length
                ? `${order.vehicles.length} vehicle${
                    order.vehicles.length > 1 ? "s" : ""
                  }`
                : form.vehicleType || order.vehicleType || "Pending"}
            </strong>
          </div>
          <div>
            <span>Negotiated</span>
            <strong>{formatCurrency(form.negotiatedRate)}</strong>
          </div>
        </div>

        {renderStepFields()}

        <div className="kam-actions">
          <button
            type="button"
            className="kam-btn-outline"
            onClick={handleSaveDraft}
          >
            Save Draft
          </button>

          <button
            type="button"
            className="kam-btn-primary"
            onClick={handleAdvance}
          >
            {activeStepIndex === LIFECYCLE_STEPS.length - 1
              ? "Complete Order"
              : `Continue to ${LIFECYCLE_STEPS[activeStepIndex + 1]}`}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default KeyAccount;