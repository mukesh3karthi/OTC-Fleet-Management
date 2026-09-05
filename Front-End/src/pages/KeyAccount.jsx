import React, { useEffect, useMemo, useState } from "react";
import "../pagescss/keyaccount.css";
import Tripcreatemodal from "../keyaccount/Tripcreatemodal";

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

const EMPTY_WTG_VEHICLE = {
  vehicleType: "",
  configurationModel: "",
  movementClassification: "",
  quantity: "1",
  weight: "",
  length: "",
  height: "",
  width: "",
};

const createEmptyTripForm = (tripId = "") => ({
  movementType: "",

  client: "",
  companyName: "",
  clientContact: "",
  clientEmail: "",
  assignedKam: "",

  tripId,
  enquiryDate: "",
  placementDate: "",
  deploymentDate: "",

  siteLocation: "",
  period: "",
  dieselScope: "",
  totalQuantity: "",

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

  vehicles: [{ ...EMPTY_WTG_VEHICLE }],
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
        order.companyName,
        order.clientContact,
        order.clientEmail,
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
        order.assignedKam,
        order.siteLocation,
        order.period,
        order.dieselScope,
        order.totalQuantity,
        order.deploymentDate,
        ...(Array.isArray(order.vehicles)
          ? order.vehicles.flatMap((vehicle) => [
            vehicle.vehicleNumber,
            vehicle.vehicleType,
            vehicle.configurationModel,
            vehicle.movementClassification,
            vehicle.quantity,
            vehicle.weight,
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

  const handleWtgVehicleFieldChange = (index, field) => (event) => {
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

  const handleAddWtgVehicle = () => {
    setTripForm((previous) => ({
      ...previous,
      vehicles: [
        ...(previous.vehicles.length
          ? previous.vehicles
          : [{ ...EMPTY_WTG_VEHICLE }]),
        { ...EMPTY_WTG_VEHICLE },
      ],
    }));
  };

  const handleRemoveWtgVehicle = (index) => {
    setTripForm((previous) => {
      if (previous.vehicles.length <= 1) {
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
    const isIntercarting = tripForm.movementType === "Intercarting";
    const isStandardMovement =
      tripForm.movementType === "Crane" ||
      tripForm.movementType === "Other";

    if (!tripForm.movementType) {
      setToast("Please select a movement type.");
      return;
    }

    if (!String(tripForm.tripId).trim()) {
      setToast("Trip ID is required.");
      return;
    }

    if (isWTG) {
      const requiredWtgFields = [
        tripForm.client,
        tripForm.companyName,
        tripForm.clientContact,
        tripForm.clientEmail,
        tripForm.enquiryDate,
        tripForm.placementDate,
        tripForm.assignedKam,
        tripForm.origin,
        tripForm.destination,
        tripForm.estimatedDistance,
        tripForm.cargo,
      ];

      if (
        requiredWtgFields.some(
          (value) => !String(value ?? "").trim()
        )
      ) {
        setToast("Please complete all required WTG trip fields.");
        return;
      }
    }

    if (isIntercarting) {
      const requiredIntercartingFields = [
        tripForm.companyName,
        tripForm.client,
        tripForm.clientContact,
        tripForm.clientEmail,
        tripForm.siteLocation,
        tripForm.period,
        tripForm.dieselScope,
        tripForm.totalQuantity,
        tripForm.enquiryDate,
        tripForm.deploymentDate,
        tripForm.assignedKam,
      ];

      if (
        requiredIntercartingFields.some(
          (value) => !String(value ?? "").trim()
        )
      ) {
        setToast("Please complete all required Intercarting fields.");
        return;
      }

      const totalQuantity = Number(tripForm.totalQuantity);

      if (
        !Number.isInteger(totalQuantity) ||
        totalQuantity < 1
      ) {
        setToast("Total Quantity must be at least 1.");
        return;
      }
    }

    if (isStandardMovement) {
      const requiredStandardFields = [
        tripForm.client,
        tripForm.companyName,
        tripForm.clientContact,
        tripForm.clientEmail,
        tripForm.enquiryDate,
        tripForm.placementDate,
        tripForm.origin,
        tripForm.destination,
        tripForm.estimatedDistance,
        tripForm.cargo,
      ];

      if (
        requiredStandardFields.some(
          (value) => !String(value ?? "").trim()
        )
      ) {
        setToast("Please complete all required client and trip fields.");
        return;
      }
    }

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      String(tripForm.clientEmail).trim()
    );

    if (!emailIsValid) {
      setToast("Please enter a valid client email address.");
      return;
    }

    if (isWTG) {
      const invalidWtgVehicle = tripForm.vehicles.some((vehicle) => {
        const requiredValues = [
          vehicle.vehicleType,
          vehicle.configurationModel,
          vehicle.movementClassification,
          vehicle.quantity,
          vehicle.weight,
          vehicle.length,
          vehicle.height,
          vehicle.width,
        ];

        const hasMissingValue = requiredValues.some(
          (value) => !String(value ?? "").trim()
        );

        const numericValues = [
          vehicle.quantity,
          vehicle.weight,
          vehicle.length,
          vehicle.height,
          vehicle.width,
        ].map(Number);

        const hasInvalidNumber = numericValues.some(
          (value) => !Number.isFinite(value) || value <= 0
        );

        const invalidQuantity =
          !Number.isInteger(Number(vehicle.quantity)) ||
          Number(vehicle.quantity) < 1;

        return hasMissingValue || hasInvalidNumber || invalidQuantity;
      });

      if (invalidWtgVehicle) {
        setToast(
          "Complete Vehicle Type, Configuration Model, Classification, Quantity, Weight and L × H × W dimensions for every WTG vehicle."
        );
        return;
      }
    }

    if (isIntercarting) {
      const invalidIntercartingVehicle = tripForm.vehicles.some(
        (vehicle) => {
          const requiredValues = [
            vehicle.vehicleType,
            vehicle.configurationModel,
            vehicle.movementClassification,
            vehicle.quantity,
            vehicle.weight,
          ];

          const hasMissingValue = requiredValues.some(
            (value) => !String(value ?? "").trim()
          );

          const quantity = Number(vehicle.quantity);
          const weight = Number(vehicle.weight);

          const invalidQuantity =
            !Number.isInteger(quantity) || quantity < 1;

          const invalidWeight =
            !Number.isFinite(weight) || weight <= 0;

          return hasMissingValue || invalidQuantity || invalidWeight;
        }
      );

      if (invalidIntercartingVehicle) {
        setToast(
          "Complete Vehicle Type, Configuration Model, Classification, Quantity and Weight for every Intercarting vehicle."
        );
        return;
      }
    }

    if (
      isStandardMovement &&
      (!String(tripForm.requiredVehicles).trim() ||
        !String(tripForm.primaryVehicleType).trim() ||
        !String(tripForm.weight).trim())
    ) {
      setToast(
        "Please enter Weight, Required Vehicles and select Primary Vehicle Type."
      );
      return;
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

    const usesVehicleRows = isWTG || isIntercarting;

    const cleanVehicles = usesVehicleRows
      ? tripForm.vehicles.map((vehicle) => ({
          vehicleType: String(vehicle.vehicleType).trim(),
          configurationModel: String(vehicle.configurationModel).trim(),
          movementClassification: vehicle.movementClassification,
          quantity: Number(vehicle.quantity),
          weight: Number(vehicle.weight),
          ...(isWTG
            ? {
                length: Number(vehicle.length),
                height: Number(vehicle.height),
                width: Number(vehicle.width),
                dimensions: `${Number(vehicle.length)} × ${Number(
                  vehicle.height
                )} × ${Number(vehicle.width)} FT`,
              }
            : {}),
        }))
      : [];

    const requiredVehicleCount = usesVehicleRows
      ? cleanVehicles.reduce(
          (total, vehicle) => total + vehicle.quantity,
          0
        )
      : Number(tripForm.requiredVehicles);

    const primaryVehicleType = usesVehicleRows
      ? cleanVehicles[0]?.vehicleType || ""
      : tripForm.primaryVehicleType;

    const uploadMeta = tripUpload
      ? {
          name: tripUpload.name,
          type: tripUpload.type,
          size: tripUpload.size,
          lastModified: tripUpload.lastModified,
        }
      : null;

    const effectivePlacementDate = isIntercarting
      ? tripForm.deploymentDate
      : tripForm.placementDate;

    const newOrder = {
      id: tripForm.tripId,
      tripId: tripForm.tripId,
      movementType: tripForm.movementType,

      client: tripForm.client.trim(),
      companyName: tripForm.companyName.trim(),
      clientContact: tripForm.clientContact.trim(),
      clientEmail: tripForm.clientEmail.trim(),
      assignedKam: String(tripForm.assignedKam || "").trim(),

      enquiryDate: tripForm.enquiryDate,
      placementDate: effectivePlacementDate,
      deploymentDate: isIntercarting ? tripForm.deploymentDate : "",
      date: tripForm.enquiryDate,

      siteLocation: isIntercarting
        ? tripForm.siteLocation.trim()
        : "",
      period: isIntercarting ? tripForm.period.trim() : "",
      dieselScope: isIntercarting ? tripForm.dieselScope : "",
      totalQuantity: isIntercarting
        ? Number(tripForm.totalQuantity)
        : null,

      origin: isIntercarting
        ? tripForm.siteLocation.trim()
        : tripForm.origin.trim(),
      destination: isIntercarting
        ? ""
        : tripForm.destination.trim(),
      estimatedDistance: isIntercarting
        ? null
        : Number(tripForm.estimatedDistance),

      cargo: isIntercarting
        ? "Intercarting"
        : tripForm.cargo.trim(),

      weight: usesVehicleRows
        ? `${cleanVehicles[0]?.weight || 0} Tons`
        : `${tripForm.weight} Tons`,

      length: isWTG ? cleanVehicles[0]?.length || null : null,
      height: isWTG ? cleanVehicles[0]?.height || null : null,
      width: isWTG ? cleanVehicles[0]?.width || null : null,

      configurationModel: usesVehicleRows
        ? cleanVehicles[0]?.configurationModel || ""
        : "",

      movementClassification: usesVehicleRows
        ? cleanVehicles[0]?.movementClassification || ""
        : "",

      remark: isWTG ? tripForm.remark.trim() : "",
      instructions: isWTG ? tripForm.remark.trim() : "",

      vehicles: cleanVehicles,
      requiredVehicles: requiredVehicleCount,
      vehicleCount: requiredVehicleCount,
      primaryVehicleType,

      vehicleType:
        usesVehicleRows && cleanVehicles.length > 1
          ? cleanVehicles
              .map((vehicle) => vehicle.vehicleType)
              .join(", ")
          : primaryVehicleType,

      document: uploadMeta,
      documentName: uploadMeta?.name || "",
      loadingDate: effectivePlacementDate,

      stage: "Client Enquiry",
      role: "Key Account Management Team",
      vendor: "",
      quotedRate: "",
      negotiatedRate: "",
    };

    setOrders((previous) => [newOrder, ...previous]);
    setSelectedOrderId(newOrder.id);
    setToast(`${newOrder.tripId} created successfully.`);
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
            <h1>Order Management</h1>
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
                  <th>Key Account Name</th>
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
                      </td>

                      <td>
                        <div className="client-name">{order.client}</div>

                      </td>

                      <td className="cargo-details">
                        <div className="cargo-name">
                          {order.movementType === "Intercarting"
                            ? `Intercarting · ${order.totalQuantity || 0} Nos`
                            : order.cargo}
                        </div>
                      </td>

                      <td className="route-details">
                        {order.movementType === "Intercarting" ? (
                          <span>{order.siteLocation || "—"}</span>
                        ) : (
                          <>
                            <span>{order.origin}</span>
                            <span className="route-arrow">→</span>
                            <span>{order.destination}</span>
                          </>
                        )}
                      </td>

                      <td>
                        <span className={getStageClass(order.stage)}>
                          <span className="stage-dot" />
                          {order.stage}
                        </span>
                      </td>

                      <td>
                        <div className="role-responsible">
                          {order.assignedKam || order.role}
                        </div>
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

      <Tripcreatemodal
        showTripModal={showTripModal}
        tripForm={tripForm}
        tripUpload={tripUpload}
        primaryVehicleTypes={PRIMARY_VEHICLE_TYPES}
        handleTripOverlayClick={handleTripOverlayClick}
        handleMovementTypeChange={handleMovementTypeChange}
        handleCloseTripModal={handleCloseTripModal}
        handleTripFieldChange={handleTripFieldChange}
        handleAddWtgVehicle={handleAddWtgVehicle}
        handleWtgVehicleFieldChange={handleWtgVehicleFieldChange}
        handleRemoveWtgVehicle={handleRemoveWtgVehicle}
        handleTripFileChange={handleTripFileChange}
        handleCreateTrip={handleCreateTrip}
      />
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
            <span>
              {order.movementType === "Intercarting" ? "Site" : "Route"}
            </span>
            <strong>
              {order.movementType === "Intercarting"
                ? order.siteLocation || "—"
                : `${order.origin} → ${order.destination}`}
            </strong>
          </div>
          <div>
            <span>
              {order.movementType === "Intercarting"
                ? "Requirement"
                : "Cargo"}
            </span>
            <strong>
              {order.movementType === "Intercarting"
                ? `${order.totalQuantity || 0} Nos · ${
                    order.dieselScope || "Diesel scope pending"
                  }`
                : `${order.cargo} · ${order.weight}`}
            </strong>
          </div>
          <div>
            <span>Vehicles</span>
            <strong>
              {Array.isArray(order.vehicles) && order.vehicles.length
                ? `${order.vehicles.length} vehicle${order.vehicles.length > 1 ? "s" : ""
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