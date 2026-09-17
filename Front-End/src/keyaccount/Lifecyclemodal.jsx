import React, { useEffect, useMemo, useState } from "react";
import "./lifecyclemodal.css";


/* =========================================================
   API
========================================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const TRIP_API_URL =
  `${API_BASE_URL}/api/triporders`;


/* =========================================================
   HELPERS
========================================================= */

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatAmount = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

const formatNumber = (value, suffix = "") => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return `${value}${suffix}`;
};

const formatDimensions = (dimensions = {}) => {
  const { length, height, width } = dimensions;

  const hasValue = [
    length,
    height,
    width,
  ].some(
    (value) =>
      value !== "" &&
      value !== null &&
      value !== undefined
  );

  if (!hasValue) {
    return "—";
  }

  return `${length ?? "—"} × ${
    height ?? "—"
  } × ${width ?? "—"}`;
};

const getStatusClass = (status) => {
  const value = String(status || "Pending")
    .trim()
    .toLowerCase();

  if (value === "approved") {
    return "approved";
  }

  if (value === "rejected") {
    return "rejected";
  }

  if (
    value === "completed" ||
    value === "tracking"
  ) {
    return "approved";
  }

  return "pending";
};

const getRequirement = (
  order,
  requirementId
) =>
  safeArray(order?.vehicleRequirements).find(
    (requirement) =>
      requirement.requirementId === requirementId
  );

const getQuotation = (
  order,
  quotationId
) =>
  safeArray(order?.trafficQuotations).find(
    (quotation) =>
      quotation.quotationId === quotationId
  );

const getApprovedConfirmation = (
  order,
  requirementId
) =>
  safeArray(order?.vehicleConfirmations).find(
    (confirmation) =>
      confirmation.requirementId === requirementId &&
      confirmation.status === "Approved"
  );

const getLatestTracking = (allocation) => {
  const history = safeArray(
    allocation?.dailyTracking
  );

  if (!history.length) {
    return null;
  }

  return history[history.length - 1];
};

/* =========================================================
   LIFECYCLE STATUS
========================================================= */

const buildLifecycle = (order) => {
  const requirements = safeArray(
    order?.vehicleRequirements
  );

  const confirmations = safeArray(
    order?.vehicleConfirmations
  );

  const allocations = safeArray(
    order?.allocatedVehicles
  );

  const approvedConfirmations =
    confirmations.filter(
      (confirmation) =>
        confirmation?.status === "Approved"
    );

  const hasTracking = allocations.some(
    (allocation) =>
      safeArray(allocation?.dailyTracking)
        .length > 0
  );

  const latestTrackingStatuses = allocations
    .map((allocation) =>
      getLatestTracking(allocation)
    )
    .filter(Boolean)
    .map((tracking) =>
      String(tracking?.status || "")
        .trim()
        .toLowerCase()
    );

  const allVehiclesCompleted =
    allocations.length > 0 &&
    latestTrackingStatuses.length ===
      allocations.length &&
    latestTrackingStatuses.every((status) =>
      [
        "reached",
        "completed",
        "complete",
        "delivered",
        "trip complete",
      ].includes(status)
    );

  const enquiryStatus =
    requirements.length > 0
      ? "Completed"
      : "Pending";

  const orderFinalizationStatus =
    order?.orderFinalization?.status ||
    (order?.orderApproval?.status === "Approved"
      ? "Completed"
      : order?.orderApproval?.status === "Rejected"
      ? "Rejected"
      : "Pending");

  const poDocumentStatus =
    order?.poDocument?.status ||
    (order?.poDocument?.documentUrl ||
    order?.poDocument?.fileUrl ||
    order?.poDocument?.poNumber
      ? "Completed"
      : "Pending");

  const vendorFinalizationStatus =
    order?.vendorFinalization?.status ||
    (approvedConfirmations.length > 0
      ? "Completed"
      : "Pending");

  const orderPlacedStatus =
    order?.orderPlaced?.status ||
    (allocations.length > 0
      ? "Completed"
      : "Pending");

  const trackingStatus =
    order?.tracking?.status ||
    (hasTracking ? "Tracking" : "Pending");

  const tripCompleteStatus =
    order?.tripCompletion?.status ||
    (allVehiclesCompleted
      ? "Completed"
      : "Pending");

  return [
    {
      key: "enquiry-details",
      title: "Enquiry Details",
      status: enquiryStatus,
    },
    {
      key: "order-finalization",
      title: "Order Finalization",
      status: orderFinalizationStatus,
    },
    {
      key: "vendor-finalization",
      title: "Vendor Finalization",
      status: vendorFinalizationStatus,
    },
    {
      key: "po-document",
      title: "PO Document",
      status: poDocumentStatus,
    },
    {
      key: "order-placed",
      title: "Order Placed",
      status: orderPlacedStatus,
    },
    {
      key: "tracking",
      title: "Tracking",
      status: trackingStatus,
    },
    {
      key: "trip-complete",
      title: "Trip Complete",
      status: tripCompleteStatus,
    },
  ];
};

/* =========================================================
   CURRENT LIFECYCLE INDEX
========================================================= */

const getLifecycleCurrentIndex = (
  order,
  lifecycle
) => {
  const stage = String(order?.stage || "")
    .trim()
    .toLowerCase();

  const stageMap = {
    enquiry: 0,
    "enquiry details": 0,
    "key account": 0,

    "order approval": 1,
    "order finalization": 1,

    traffic: 2,
    "traffic quotation": 2,
    "quotation approval": 2,
    "quotation confirmation": 2,
    "vendor finalization": 2,

    po: 3,
    "po document": 3,

    "order placed": 4,
    "vehicle allocation": 4,
    "tracking input": 4,

    tracking: 5,

    "trip complete": 6,
    "trip completed": 6,
    completed: 6,
    complete: 6,
  };

  if (stageMap[stage] !== undefined) {
    return stageMap[stage];
  }

  const rejectedIndex =
    lifecycle.findIndex(
      (step) =>
        getStatusClass(step.status) ===
        "rejected"
    );

  if (rejectedIndex >= 0) {
    return rejectedIndex;
  }

  const pendingIndex =
    lifecycle.findIndex(
      (step) =>
        getStatusClass(step.status) ===
        "pending"
    );

  return pendingIndex >= 0
    ? pendingIndex
    : Math.max(lifecycle.length - 1, 0);
};

/* =========================================================
   READ ONLY FIELD
========================================================= */

const ReadOnlyField = ({
  label,
  value,
  suffix = "",
}) => {
  const hasValue =
    value !== "" &&
    value !== null &&
    value !== undefined;

  return (
    <div className="kam-client-trip-field">
      <span>{label}</span>

      <strong>
        {hasValue
          ? `${value}${suffix}`
          : "—"}
      </strong>
    </div>
  );
};

/* =========================================================
   SECTION HEADING
========================================================= */

const SectionHeading = ({
  title,
  description,
  count,
}) => (
  <div className="kam-client-vehicle-heading">
    <div>
      <h3>{title}</h3>

      {description && (
        <p>{description}</p>
      )}
    </div>

    {count !== undefined && (
      <span>{count}</span>
    )}
  </div>
);

/* =========================================================
   COMMON DETAILS
   READ ONLY ON ALL PAGES AFTER ENQUIRY
========================================================= */

const CommonStepDetails = ({
  order,
  totalRequiredVehicles,
}) => {
  const storedTotalVehicles = Number(order?.totalVehicles) || 0;
  const displayTotalVehicles =
    storedTotalVehicles > 0 ? storedTotalVehicles : totalRequiredVehicles;

  return (
    <div className="kam-common-step-details">
      <div className="kam-common-step-item">
        <span>Customer</span>
        <strong title={order?.customer || ""}>
          {order?.customer || "—"}
        </strong>
      </div>

      <div className="kam-common-step-item">
        <span>Material Type</span>
        <strong title={order?.materialType || ""}>
          {order?.materialType || "—"}
        </strong>
      </div>

      <div className="kam-common-step-item">
        <span>Total Vehicles</span>
        <strong>
          {displayTotalVehicles > 0 ? `${displayTotalVehicles} NOS` : "—"}
        </strong>
      </div>

      <div className="kam-common-step-item">
        <span>Assigned KAM</span>
        <strong title={order?.assignedKam || ""}>
          {order?.assignedKam || "—"}
        </strong>
      </div>

      <div className="kam-common-step-item">
        <span>Origin</span>
        <strong title={order?.origin || ""}>
          {order?.origin || "—"}
        </strong>
      </div>

      <div className="kam-common-step-item">
        <span>Destination</span>
        <strong title={order?.destination || ""}>
          {order?.destination || "—"}
        </strong>
      </div>

      <div className="kam-common-step-item">
        <span>Placement Date</span>
        <strong>{formatDate(order?.placementDate)}</strong>
      </div>
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const Lifecyclemodal = ({
  order,
  onClose,
}) => {
  const lifecycle = useMemo(
    () => buildLifecycle(order || {}),
    [order]
  );

  const currentLifecycleIndex = useMemo(
    () =>
      getLifecycleCurrentIndex(
        order || {},
        lifecycle
      ),
    [order, lifecycle]
  );

  const [
    activeStepIndex,
    setActiveStepIndex,
  ] = useState(0);

  const [
    approvalRequested,
    setApprovalRequested,
  ] = useState(
    order?.orderApproval?.status ===
      "Pending" &&
      Boolean(
        order?.orderApproval?.requestedAt
      )
  );

  const [finalizationSaving, setFinalizationSaving] =
    useState(false);

  const [finalizationMessage, setFinalizationMessage] =
    useState("");

  const [finalizationError, setFinalizationError] =
    useState("");

  /* =========================================================
     ORDER FINALIZATION INPUT DATA
  ========================================================= */

  const [
    finalizationForm,
    setFinalizationForm,
  ] = useState({
    quotedRate:
      order?.orderFinalization?.quotedRate ??
      order?.quotedRate ??
      "",
    finalRate:
      order?.orderFinalization?.finalRate ??
      order?.finalRate ??
      "",
    commercialTerms:
      order?.orderFinalization?.commercialTerms ??
      order?.commercialTerms ??
      "",
    deliveryCommitments:
      order?.orderFinalization?.deliveryCommitments ??
      order?.deliveryCommitments ??
      "",
    clientConfirmationNotes:
      order?.orderFinalization?.clientConfirmationNotes ??
      order?.clientConfirmationNotes ??
      "",
  });

  useEffect(() => {
    if (order) {
      setActiveStepIndex(
        currentLifecycleIndex
      );
    }
  }, [
    currentLifecycleIndex,
    order,
  ]);

  useEffect(() => {
    setApprovalRequested(
      order?.orderApproval?.status ===
        "Pending" &&
        Boolean(
          order?.orderApproval?.requestedAt
        )
    );
  }, [
    order?.orderApproval?.status,
    order?.orderApproval?.requestedAt,
  ]);

  /* =========================================================
     KEEP INPUT VALUES SYNCED WHEN ORDER CHANGES
  ========================================================= */

  useEffect(() => {
    setFinalizationForm({
      quotedRate:
        order?.orderFinalization?.quotedRate ??
        order?.quotedRate ??
        "",
      finalRate:
        order?.orderFinalization?.finalRate ??
        order?.finalRate ??
        "",
      commercialTerms:
        order?.orderFinalization?.commercialTerms ??
        order?.commercialTerms ??
        "",
      deliveryCommitments:
        order?.orderFinalization?.deliveryCommitments ??
        order?.deliveryCommitments ??
        "",
      clientConfirmationNotes:
        order?.orderFinalization?.clientConfirmationNotes ??
        order?.clientConfirmationNotes ??
        "",
    });
  }, [order]);

  if (!order) {
    return null;
  }

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleFinalizationChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFinalizationForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const saveOrderFinalization = async (
    requestApproval = false
  ) => {
    if (!order?._id) {
      setFinalizationError(
        "Order ID is missing."
      );
      return;
    }

    setFinalizationSaving(true);
    setFinalizationMessage("");
    setFinalizationError("");

    try {
      const response = await fetch(
        `${TRIP_API_URL}/${order._id}/order-finalization`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quotedRate:
              finalizationForm.quotedRate,
            finalRate:
              finalizationForm.finalRate,
            commercialTerms:
              finalizationForm.commercialTerms,
            deliveryCommitments:
              finalizationForm.deliveryCommitments,
            clientConfirmationNotes:
              finalizationForm.clientConfirmationNotes,
            updatedBy:
              sessionStorage.getItem(
                "kamUsername"
              ) || "Key Account",
            requestApproval,
          }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            "Unable to save order finalization."
        );
      }

      const updatedOrder =
        payload?.data ||
        payload?.trip ||
        payload?.order ||
        payload;

      setFinalizationMessage(
        requestApproval
          ? "Saved and sent for approval."
          : "Changes saved successfully."
      );

      if (requestApproval) {
        setApprovalRequested(true);
      }

      if (
        typeof onOrderUpdated ===
        "function"
      ) {
        onOrderUpdated(updatedOrder);
      }
    } catch (error) {
      setFinalizationError(
        error.message ||
          "Unable to save order finalization."
      );
    } finally {
      setFinalizationSaving(false);
    }
  };

  const handleStepClick = (
    index
  ) => {
    if (
      index <=
      currentLifecycleIndex
    ) {
      setActiveStepIndex(index);
    }
  };

  const requirements = safeArray(
    order.vehicleRequirements
  );

  const quotations = safeArray(
    order.trafficQuotations
  );

  const confirmations = safeArray(
    order.vehicleConfirmations
  );

  const allocations = safeArray(
    order.allocatedVehicles
  );

  const approvedConfirmations =
    confirmations.filter(
      (confirmation) =>
        confirmation.status ===
        "Approved"
    );

  /* =========================================================
     VEHICLE APPROVAL COMPLETED

     Every vehicle requirement must have one approved
     transporter quotation. Rejected balance quotations
     do not block Vendor Finalization.
  ========================================================= */

  const vehicleApprovalCompleted =
    requirements.length > 0 &&
    requirements.every(
      (requirement) =>
        approvedConfirmations.some(
          (confirmation) =>
            confirmation.requirementId ===
            requirement.requirementId
        )
    );

  const totalRequiredVehicles =
    requirements.reduce(
      (
        total,
        requirement
      ) =>
        total +
        Math.max(
          Number(
            requirement.quantity
          ) || 0,
          0
        ),
      0
    );

  return (
    <div
      className="kam-workflow-modal-overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="kam-workflow-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Order lifecycle ${
          order.tripId || ""
        }`}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="kam-detail-toolbar">

          <div className="kam-modal-toolbar-left">

            <button
              type="button"
              className="kam-back-btn"
              onClick={onClose}
              aria-label="Back"
            >
              ←
            </button>

            <div className="kam-modal-heading">
              <span>
                ORDER LIFECYCLE
              </span>

              <strong>
                {order.customer || "—"}
              </strong>
            </div>

          </div>

          <div className="kam-modal-toolbar-right">

            <div className="kam-detail-meta">
              <span>
                {order.movementType ||
                  "—"}
              </span>

              <strong>
                {order.tripId || "—"}
              </strong>
            </div>

            <button
              type="button"
              className="kam-workflow-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>

          </div>

        </div>

        {/* =================================================
            LIFECYCLE STEPPER
        ================================================= */}

        <div
          className="kam-top-lifecycle"
          role="navigation"
          aria-label="Order lifecycle progress"
        >
          <div className="kam-top-lifecycle-track">

            {lifecycle.map(
              (step, index) => {
                const statusClass =
                  getStatusClass(
                    step.status
                  );

                const rejected =
                  statusClass ===
                  "rejected";

                const isCurrent =
                  index ===
                  currentLifecycleIndex;

                const completed =
                  !rejected &&
                  (
                    index <
                      currentLifecycleIndex ||
                    (
                      index ===
                        lifecycle.length -
                          1 &&
                      isCurrent &&
                      statusClass ===
                        "approved"
                    )
                  );

                return (
                  <React.Fragment
                    key={step.key}
                  >

                    {index > 0 && (
                      <span
                        className={`kam-top-step-line ${
                          index <=
                          currentLifecycleIndex
                            ? "completed"
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleStepClick(
                          index
                        )
                      }
                      disabled={
                        index >
                        currentLifecycleIndex
                      }
                      className={[
                        "kam-top-step",

                        completed
                          ? "completed"
                          : "",

                        isCurrent
                          ? "active"
                          : "",

                        rejected
                          ? "rejected"
                          : "",

                        activeStepIndex ===
                        index
                          ? "selected"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-current={
                        isCurrent
                          ? "step"
                          : undefined
                      }
                      aria-pressed={
                        activeStepIndex ===
                        index
                      }
                      title={`${step.title}: ${step.status}`}
                    >

                      <span className="kam-top-step-marker">
                        {completed ? (
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              d="M5 12.5 9.2 17 19 7"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : rejected ? (
                          "!"
                        ) : (
                          index + 1
                        )}
                      </span>

                      <span className="kam-top-step-text">
                        {step.title}
                      </span>

                    </button>

                  </React.Fragment>
                );
              }
            )}

          </div>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="kam-workflow-content">

          {/* =================================================
              COMMON DATA
              READ ONLY
              NOT SHOWN IN ENQUIRY
          ================================================= */}

          {activeStepIndex > 0 && (
            <CommonStepDetails
              order={order}
              totalRequiredVehicles={
                totalRequiredVehicles
              }
            />
          )}

          {/* =================================================
              ENQUIRY
              EVERYTHING READ ONLY
          ================================================= */}

          {activeStepIndex === 0 && (
            <div className="kam-step-page kam-step-page-order-summary">

              <section className="kam-client-enquiry-section">

                <div className="kam-client-enquiry-heading kam-professional-order-heading">

                  <div className="kam-order-title-block">

                    <span className="kam-order-eyebrow">
                      ORDER OVERVIEW
                    </span>

                    <div className="kam-order-title-row">

                      <h2>
                        {order.tripId ||
                          "—"}
                      </h2>

                      <span className="kam-order-readonly-badge">
                        READ ONLY
                      </span>

                    </div>

                  </div>

                </div>

                <div className="kam-client-trip-grid">

                  <ReadOnlyField
                    label="Customer"
                    value={
                      order.customer
                    }
                  />

                  <ReadOnlyField
                    label="Contact Person"
                    value={
                      order.contactPerson
                    }
                  />

                  <ReadOnlyField
                    label="Contact Number"
                    value={
                      order.contactNumber
                    }
                  />

                  <ReadOnlyField
                    label="Email"
                    value={
                      order.email
                    }
                  />

                  <ReadOnlyField
                    label="Assigned KAM"
                    value={
                      order.assignedKam
                    }
                  />

                  <ReadOnlyField
                    label="Material Type"
                    value={
                      order.materialType
                    }
                  />

                  <ReadOnlyField
                    label="Total Vehicles"
                    value={
                      order.totalVehicles
                    }
                    suffix={
                      order.totalVehicles !==
                        "" &&
                      order.totalVehicles !==
                        null &&
                      order.totalVehicles !==
                        undefined
                        ? " NOS"
                        : ""
                    }
                  />

                  <ReadOnlyField
                    label="Origin"
                    value={
                      order.origin
                    }
                  />

                  <ReadOnlyField
                    label="Destination"
                    value={
                      order.destination
                    }
                  />

                  <ReadOnlyField
                    label="Distance"
                    value={
                      order.distance
                    }
                    suffix={
                      order.distance !==
                        "" &&
                      order.distance !==
                        null &&
                      order.distance !==
                        undefined
                        ? " KM"
                        : ""
                    }
                  />

                  <ReadOnlyField
                    label="Enquiry Date"
                    value={formatDate(
                      order.enquiryDate
                    )}
                  />

                  <ReadOnlyField
                    label="Placement Date"
                    value={formatDate(
                      order.placementDate
                    )}
                  />

                  {order.siteLocation && (
                    <ReadOnlyField
                      label="Site Location"
                      value={
                        order.siteLocation
                      }
                    />
                  )}

                  {order.period && (
                    <ReadOnlyField
                      label="Period"
                      value={
                        order.period
                      }
                    />
                  )}

                  {order.dieselScope && (
                    <ReadOnlyField
                      label="Diesel Scope"
                      value={
                        order.dieselScope
                      }
                    />
                  )}

                </div>

                {order.remark && (
                  <div className="kam-professional-remark">

                    <div
                      className="kam-professional-remark-icon"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24">

                        <path
                          d="M5 4.5h14A1.5 1.5 0 0 1 20.5 6v9A1.5 1.5 0 0 1 19 16.5h-7.2L7 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        <path
                          d="M7.5 9h9M7.5 12.5h6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />

                      </svg>
                    </div>

                    <div className="kam-professional-remark-copy">
                      <span>
                        ADDITIONAL INFORMATION
                      </span>

                      <strong>
                        Remarks
                      </strong>

                      <p>
                        {order.remark}
                      </p>
                    </div>

                  </div>
                )}

              </section>

            </div>
          )}

          {/* =================================================
              VEHICLE REQUIREMENTS
              ENQUIRY READ ONLY
          ================================================= */}

          {activeStepIndex === 0 && (
            <div className="kam-step-page kam-step-page-vehicle-requirements">

              <section className="kam-client-vehicle-section">

                <SectionHeading
                  title="Vehicle Requirements"
                  description="Vehicle requirements entered during New Trip Creation."
                  count={
                    requirements.length
                  }
                />

                {requirements.length > 0 ? (

                  <div className="kam-client-vehicle-table-wrap">

                    <table className="kam-client-vehicle-table">

                      <thead>
                        <tr>
                          <th>#</th>
                          <th>
                            Requirement ID
                          </th>
                          <th>
                            Vehicle Type
                          </th>
                          <th>
                            Configuration
                          </th>
                          <th>
                            Classification
                          </th>
                          <th>
                            Quantity
                          </th>
                          <th>
                            Weight
                          </th>
                          <th>
                            L × H × W
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {requirements.map(
                          (
                            requirement,
                            index
                          ) => (

                            <tr
                              key={
                                requirement.requirementId ||
                                index
                              }
                            >

                              <td>
                                <span className="kam-client-row-no">
                                  {index + 1}
                                </span>
                              </td>

                              <td>
                                <strong>
                                  {requirement.requirementId ||
                                    "—"}
                                </strong>
                              </td>

                              <td>
                                <strong>
                                  {requirement.vehicleType ||
                                    "—"}
                                </strong>
                              </td>

                              <td>
                                {requirement.configuration ||
                                  "—"}
                              </td>

                              <td>
                                {requirement.classification ? (
                                  <span className="kam-client-classification">
                                    {
                                      requirement.classification
                                    }
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>

                              <td>
                                {formatNumber(
                                  requirement.quantity,
                                  " NOS"
                                )}
                              </td>

                              <td>
                                {formatNumber(
                                  requirement.weight,
                                  " TON"
                                )}
                              </td>

                              <td>
                                {formatDimensions(
                                  requirement.dimensions
                                )}
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                      <tfoot>
                        <tr>

                          <td
                            colSpan="5"
                            style={{
                              textAlign:
                                "right",
                            }}
                          >
                            <strong>
                              Total Required
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {
                                totalRequiredVehicles
                              }{" "}
                              NOS
                            </strong>
                          </td>

                          <td colSpan="2" />

                        </tr>
                      </tfoot>

                    </table>

                  </div>

                ) : (

                  <div className="kam-lifecycle-empty">
                    No vehicle requirements available.
                  </div>

                )}

              </section>

            </div>
          )}

          {/* =================================================
              ORDER FINALIZATION
              EDITABLE INPUT FIELDS
          ================================================= */}

          {activeStepIndex === 1 && (
            <div className="kam-step-page kam-step-page-first-approval">

              <section className="kam-client-vehicle-section">

                <div className="kam-client-trip-grid">

                  {/* QUOTED RATE */}

                  <div className="kam-client-trip-field">
                    <span>
                      Quoted Rate *
                    </span>

                    <input
                      type="number"
                      name="quotedRate"
                      value={
                        finalizationForm.quotedRate
                      }
                      onChange={
                        handleFinalizationChange
                      }
                      placeholder="Enter quoted rate"
                    />
                  </div>

                  {/* FINAL RATE */}

                  <div className="kam-client-trip-field">
                    <span>
                      Final Rate *
                    </span>

                    <input
                      type="number"
                      name="finalRate"
                      value={
                        finalizationForm.finalRate
                      }
                      onChange={
                        handleFinalizationChange
                      }
                      placeholder="Enter final rate"
                    />
                  </div>

                  {/* COMMERCIAL TERMS */}

                  <div className="kam-client-trip-field">
                    <span>
                      Commercial Terms & Payment SLAs *
                    </span>

                    <textarea
                      name="commercialTerms"
                      value={
                        finalizationForm.commercialTerms
                      }
                      onChange={
                        handleFinalizationChange
                      }
                      placeholder="Enter commercial terms and payment SLAs"
                      rows={3}
                    />
                  </div>

                  {/* DELIVERY COMMITMENTS */}

                  <div className="kam-client-trip-field">
                    <span>
                      Delivery Commitments & Transit SLAs *
                    </span>

                    <textarea
                      name="deliveryCommitments"
                      value={
                        finalizationForm.deliveryCommitments
                      }
                      onChange={
                        handleFinalizationChange
                      }
                      placeholder="Enter delivery commitments and transit SLAs"
                      rows={3}
                    />
                  </div>

                  {/* CLIENT CONFIRMATION */}

                  <div className="kam-client-trip-field">
                    <span>
                      Client Confirmation Notes
                    </span>

                    <textarea
                      name="clientConfirmationNotes"
                      value={
                        finalizationForm.clientConfirmationNotes
                      }
                      onChange={
                        handleFinalizationChange
                      }
                      placeholder="Enter client confirmation notes"
                      rows={3}
                    />
                  </div>

                </div>

                <div className="kam-finalization-actions">
                  <div className="kam-finalization-feedback">
                    {finalizationError && (
                      <span className="kam-finalization-error">
                        {finalizationError}
                      </span>
                    )}

                    {finalizationMessage && (
                      <span className="kam-finalization-success">
                        {finalizationMessage}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="kam-save-finalization-btn"
                    disabled={finalizationSaving}
                    onClick={() =>
                      saveOrderFinalization(false)
                    }
                  >
                    {finalizationSaving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>

              </section>

            </div>
          )}

          {/* =================================================
              VENDOR FINALIZATION
              CONFIRMED TRANSPORTERS FIRST
              TRAFFIC QUOTATIONS SECOND
          ================================================= */}

          {activeStepIndex === 2 && (
            <>
              {/* =================================================
                  CONFIRMED TRANSPORTERS
              ================================================= */}

              <div className="kam-step-page kam-step-page-confirmed-transporters">

                <section className="kam-client-vehicle-section">

                  <SectionHeading
                    title="Confirmed Transporters"
                    description="Approved transporter quotation for each vehicle requirement."
                    count={
                      approvedConfirmations.length
                    }
                  />

                  {approvedConfirmations.length > 0 ? (

                    <div className="kam-client-vehicle-table-wrap">

                      <table className="kam-client-vehicle-table">

                        <thead>
                          <tr>
                            <th>#</th>

                            <th>
                              Vehicle Requirement
                            </th>

                            <th>
                              Transporter
                            </th>

                            <th>
                              Confirmed Amount
                            </th>

                            <th>
                              Confirmed By
                            </th>

                            <th>
                              Confirmed At
                            </th>
                          </tr>
                        </thead>

                        <tbody>

                          {approvedConfirmations.map(
                            (
                              confirmation,
                              index
                            ) => {

                              const requirement =
                                getRequirement(
                                  order,
                                  confirmation.requirementId
                                );

                              const quotation =
                                getQuotation(
                                  order,
                                  confirmation.quotationId
                                );

                              return (

                                <tr
                                  key={
                                    confirmation.confirmationId ||
                                    index
                                  }
                                >

                                  <td>
                                    <span className="kam-client-row-no">
                                      {index + 1}
                                    </span>
                                  </td>

                                  <td>
                                    <strong>
                                      {requirement?.vehicleType ||
                                        confirmation.requirementId ||
                                        "—"}
                                    </strong>

                                    {requirement?.configuration && (
                                      <small
                                        style={{
                                          display: "block",
                                        }}
                                      >
                                        {
                                          requirement.configuration
                                        }
                                      </small>
                                    )}
                                  </td>

                                  <td>
                                    <strong>
                                      {quotation?.transporter ||
                                        "—"}
                                    </strong>
                                  </td>

                                  <td>
                                    {formatAmount(
                                      quotation?.amount
                                    )}
                                  </td>

                                  <td>
                                    {confirmation.confirmedBy ||
                                      "—"}
                                  </td>

                                  <td>
                                    {formatDateTime(
                                      confirmation.confirmedAt
                                    )}
                                  </td>

                                </tr>

                              );
                            }
                          )}

                        </tbody>

                      </table>

                    </div>

                  ) : (

                    <div className="kam-lifecycle-empty">
                      No transporter has been confirmed yet.
                    </div>

                  )}

                </section>

              </div>


              {/* =================================================
                  TRAFFIC QUOTATIONS
              ================================================= */}

              <div className="kam-step-page kam-step-page-traffic-quotations">

                <section className="kam-client-vehicle-section">

                  <SectionHeading
                    title="Traffic Quotations"
                    description="Transporter quotations submitted by Traffic."
                    count={
                      quotations.length
                    }
                  />

                  {quotations.length > 0 ? (

                    <div className="kam-client-vehicle-table-wrap">

                      <table className="kam-client-vehicle-table">

                        <thead>
                          <tr>
                            <th>#</th>

                            <th>
                              Requirement
                            </th>

                            <th>
                              Transporter
                            </th>

                            <th>
                              Amount
                            </th>

                            <th>
                              Quoted By
                            </th>

                            <th>
                              Quoted At
                            </th>

                            <th>
                              Status
                            </th>
                          </tr>
                        </thead>

                        <tbody>

                          {quotations.map(
                            (
                              quotation,
                              index
                            ) => {

                              const confirmation =
                                confirmations.find(
                                  (item) =>
                                    item.quotationId ===
                                    quotation.quotationId
                                );

                              return (
                                <tr
                                  key={
                                    quotation.quotationId ||
                                    index
                                  }
                                >

                                  <td>
                                    <span className="kam-client-row-no">
                                      {index + 1}
                                    </span>
                                  </td>

                                  <td>
                                    {quotation.requirementId ||
                                      "—"}
                                  </td>

                                  <td>
                                    <strong>
                                      {quotation.transporter ||
                                        "—"}
                                    </strong>
                                  </td>

                                  <td>
                                    {formatAmount(
                                      quotation.amount
                                    )}
                                  </td>

                                  <td>
                                    {quotation.quotedBy ||
                                      "—"}
                                  </td>

                                  <td>
                                    {formatDateTime(
                                      quotation.quotedAt
                                    )}
                                  </td>

                                  <td>
                                    <span
                                      className={`approval-status ${getStatusClass(
                                        confirmation?.status ||
                                          "Pending"
                                      )}`}
                                    >
                                      {confirmation?.status ||
                                        "Pending"}
                                    </span>
                                  </td>

                                </tr>
                              );
                            }
                          )}

                        </tbody>

                      </table>

                    </div>

                  ) : (

                    <div className="kam-lifecycle-empty">
                      No Traffic quotations have been submitted yet.
                    </div>

                  )}

                </section>

              </div>
            </>
          )}

          {/* =================================================
              PO DOCUMENT
              DATA ENTRY FIELDS
          ================================================= */}

          {activeStepIndex === 3 && (

            <div className="kam-step-page kam-step-page-po-document">

              <section className="kam-client-vehicle-section">

                <SectionHeading
                  title="PO Document"
                  description="Purchase order information and supporting document details."
                />

                <div className="kam-client-trip-grid">

                  <div className="kam-client-trip-field">
                    <span>
                      PO Number
                    </span>

                    <input
                      type="text"
                      defaultValue={
                        order?.poDocument?.poNumber ||
                        ""
                      }
                      placeholder="Enter PO number"
                    />
                  </div>

                  <div className="kam-client-trip-field">
                    <span>
                      PO Status
                    </span>

                    <input
                      type="text"
                      defaultValue={
                        order?.poDocument?.status ||
                        ""
                      }
                      placeholder="Enter PO status"
                    />
                  </div>

                  <div className="kam-client-trip-field">
                    <span>
                      Document Name
                    </span>

                    <input
                      type="text"
                      defaultValue={
                        order?.poDocument?.fileName ||
                        order?.poDocument
                          ?.documentName ||
                        ""
                      }
                      placeholder="Enter document name"
                    />
                  </div>

                  <div className="kam-client-trip-field">
                    <span>
                      Uploaded By
                    </span>

                    <input
                      type="text"
                      defaultValue={
                        order?.poDocument?.uploadedBy ||
                        ""
                      }
                      placeholder="Enter uploaded by"
                    />
                  </div>

                </div>

              </section>

            </div>
          )}

          {/* =================================================
              ALLOCATED VEHICLES
          ================================================= */}

          {(activeStepIndex === 4 ||
            activeStepIndex === 5 ||
            activeStepIndex === 6) && (

            <div className="kam-step-page kam-step-page-allocated-vehicles">

              <section className="kam-client-vehicle-section">

                <SectionHeading
                  title="Allocated Vehicles"
                  description="Actual vehicles allocated by Tracking Input after transporter confirmation."
                  count={
                    allocations.length
                  }
                />

                {allocations.length > 0 ? (

                  <div className="kam-client-vehicle-table-wrap">

                    <table className="kam-client-vehicle-table">

                      <thead>
                        <tr>
                          <th>#</th>
                          <th>
                            Vehicle Number
                          </th>
                          <th>
                            Requirement
                          </th>
                          <th>
                            Transporter
                          </th>
                          <th>
                            Driver
                          </th>
                          <th>
                            Current Location
                          </th>
                          <th>
                            Day
                          </th>
                          <th>
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {allocations.map(
                          (
                            allocation,
                            index
                          ) => {

                            const requirement =
                              getRequirement(
                                order,
                                allocation.requirementId
                              );

                            const confirmation =
                              safeArray(
                                order.vehicleConfirmations
                              ).find(
                                (item) =>
                                  item.confirmationId ===
                                  allocation.confirmationId
                              ) ||
                              getApprovedConfirmation(
                                order,
                                allocation.requirementId
                              );

                            const quotation =
                              getQuotation(
                                order,
                                allocation.quotationId ||
                                  confirmation?.quotationId
                              );

                            const latest =
                              getLatestTracking(
                                allocation
                              );

                            return (

                              <tr
                                key={
                                  allocation.allocationId ||
                                  index
                                }
                              >

                                <td>
                                  <span className="kam-client-row-no">
                                    {index + 1}
                                  </span>
                                </td>

                                <td>
                                  <strong>
                                    {allocation.vehicleNumber ||
                                      "—"}
                                  </strong>
                                </td>

                                <td>
                                  {requirement?.vehicleType ||
                                    allocation.requirementId ||
                                    "—"}
                                </td>

                                <td>
                                  {quotation?.transporter ||
                                    "—"}
                                </td>

                                <td>

                                  <strong>
                                    {allocation?.driver?.name ||
                                      "—"}
                                  </strong>

                                  {allocation?.driver
                                    ?.contactNumber && (

                                    <small
                                      style={{
                                        display:
                                          "block",
                                      }}
                                    >
                                      {
                                        allocation.driver
                                          .contactNumber
                                      }
                                    </small>

                                  )}

                                </td>

                                <td>
                                  {latest?.currentLocation ||
                                    "—"}
                                </td>

                                <td>
                                  {latest?.day ||
                                    "—"}
                                </td>

                                <td>

                                  <span
                                    className={`approval-status ${getStatusClass(
                                      latest?.status ||
                                        "Pending"
                                    )}`}
                                  >
                                    {latest?.status ||
                                      "Pending"}
                                  </span>

                                </td>

                              </tr>

                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                ) : (

                  <div className="kam-lifecycle-empty">
                    No actual vehicles have been allocated yet.
                  </div>

                )}

              </section>

            </div>
          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="kam-actions kam-workflow-footer">

          <div className="kam-readonly-field">
            Current Stage:{" "}
            <strong>
              {order.stage ||
                "Order Approval"}
            </strong>
          </div>

          <div className="kam-footer-action-buttons">

            {/* ENQUIRY */}

            {activeStepIndex === 0 && (

              <button
                type="button"
                className="kam-request-approval-btn"
                onClick={() =>
                  setActiveStepIndex(1)
                }
              >
                <span>
                  Order Finalization
                </span>

                <span aria-hidden="true">
                  →
                </span>
              </button>

            )}

            {/* ORDER FINALIZATION */}

            {activeStepIndex === 1 && (
              <>

                {order?.orderApproval?.status ===
                "Approved" ? (

                  <button
                    type="button"
                    className="kam-request-approval-btn kam-approval-approved-btn"
                    disabled
                  >
                    <span aria-hidden="true">
                      ✓
                    </span>

                    <span>
                      Approved
                    </span>
                  </button>

                ) : approvalRequested ||
                  (
                    order?.orderApproval?.status ===
                      "Pending" &&
                    Boolean(
                      order?.orderApproval
                        ?.requestedAt
                    )
                  ) ? (

                  <button
                    type="button"
                    className="kam-request-approval-btn kam-approval-waiting-btn"
                    disabled
                  >

                    <span
                      className="kam-waiting-dot"
                      aria-hidden="true"
                    />

                    <span>
                      Waiting for Approval
                    </span>

                  </button>

                ) : (

                  <button
                    type="button"
                    className="kam-request-approval-btn"
                    disabled={finalizationSaving}
                    onClick={() =>
                      saveOrderFinalization(
                        true
                      )
                    }
                  >

                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M22 2 11 13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        d="m22 2-7 20-4-9-9-4 20-7Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <span>
                      Request for Approval
                    </span>

                  </button>

                )}

              </>
            )}

            {/* VENDOR FINALIZATION */}

            {activeStepIndex === 2 && (
              <>

                {!vehicleApprovalCompleted ? (

                  <button
                    type="button"
                    className="kam-request-approval-btn kam-approval-waiting-btn"
                    disabled
                  >

                    <span
                      className="kam-waiting-dot"
                      aria-hidden="true"
                    />

                    <span>
                      Waiting for Vehicle Approval
                    </span>

                  </button>

                ) : (

                  <button
                    type="button"
                    className="kam-request-approval-btn kam-approval-approved-btn"
                    disabled
                  >

                    <span aria-hidden="true">
                      ✓
                    </span>

                    <span>
                      Approved
                    </span>

                  </button>

                )}

              </>
            )}

            <button
              type="button"
              className="kam-footer-close-btn"
              onClick={onClose}
            >
              Close
            </button>

          </div>

        </div>

      </section>
    </div>
  );
};

export default Lifecyclemodal;