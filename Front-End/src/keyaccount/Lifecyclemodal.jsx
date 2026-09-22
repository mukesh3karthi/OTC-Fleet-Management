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

const isPoDocumentComplete = (order) => {
  const po = order?.poDocument || {};

  const hasPoNumber = Boolean(String(po?.poNumber || "").trim());
  const hasValidity = Boolean(po?.poValidityPeriod);
  const hasBillingGstin = Boolean(String(po?.billingGstin || "").trim());
  const hasDocument = Boolean(
    po?.fileName ||
    po?.documentName ||
    po?.fileUrl ||
    po?.documentUrl
  );

  return hasPoNumber && hasValidity && hasBillingGstin && hasDocument;
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
    String(order?.stage || "").trim().toLowerCase() === "trip complete" ||
    (allocations.length > 0 &&
      allocations.every(
        (allocation) =>
          String(allocation?.unloading?.status || "")
            .trim()
            .toLowerCase() === "completed"
      ));

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

  // PO is completed only when all required PO fields are actually saved.
  // Do not trust a stale `status: Completed` by itself.
  const poDocumentStatus = isPoDocumentComplete(order)
    ? "Completed"
    : "Pending";

  const vendorFinalizationStatus =
    order?.vendorFinalization?.status ||
    (approvedConfirmations.length > 0
      ? "Completed"
      : "Pending");

  const orderPlacedStatus =
    order?.orderPlaced?.status ||
    (String(order?.stage || "").trim().toLowerCase() === "tracking"
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
      key: "po-document",
      title: "PO Document",
      status: poDocumentStatus,
    },
    {
      key: "vendor-finalization",
      title: "Vendor Finalization",
      status: vendorFinalizationStatus,
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

  /*
   * IMPORTANT:
   * Once the backend has genuinely progressed to Tracking or
   * Trip Complete, never allow PO/Vendor completion logic to
   * move the lifecycle backwards.
   */
  if (
    stage === "trip complete" ||
    stage === "trip completed" ||
    stage === "completed" ||
    stage === "complete"
  ) {
    return 6;
  }

  /*
   * IMPORTANT:
   * Approval Management can leave a stale backend stage such as
   * "Tracking Input" / "Order Placed". The PO page must still win
   * until the required PO data is genuinely complete.
   *
   * Only a real Tracking order with vehicle tracking history should
   * bypass the PO gate.
   */
  const stageAllocations = safeArray(order?.allocatedVehicles);
  const hasRealTrackingProgress = stageAllocations.some(
    (allocation) =>
      safeArray(allocation?.dailyTracking).length > 0 ||
      String(allocation?.loading?.status || "").trim().toLowerCase() === "completed" ||
      String(allocation?.unloading?.status || "").trim().toLowerCase() === "completed"
  );

  const poActuallyComplete = isPoDocumentComplete(order);

  if (
    !poActuallyComplete &&
    stage !== "trip complete" &&
    stage !== "trip completed" &&
    stage !== "completed" &&
    stage !== "complete" &&
    !hasRealTrackingProgress
  ) {
    const hasApprovedVehicle = safeArray(order?.vehicleConfirmations).some(
      (confirmation) =>
        String(confirmation?.status || "").trim().toLowerCase() === "approved"
    );

    if (
      hasApprovedVehicle ||
      String(order?.orderApproval?.status || "").trim().toLowerCase() === "approved" ||
      stage === "po document" ||
      stage === "tracking input" ||
      stage === "order placed" ||
      stage === "vehicle allocation"
    ) {
      return 2;
    }
  }

  if (stage === "tracking" && hasRealTrackingProgress) {
    return 5;
  }

  const requirements = safeArray(
    order?.vehicleRequirements
  );

  const approvedConfirmations = safeArray(
    order?.vehicleConfirmations
  ).filter(
    (confirmation) =>
      confirmation?.status === "Approved"
  );

  const vehicleApprovalCompleted =
    requirements.length > 0 &&
    requirements.every(
      (requirement) =>
        approvedConfirmations.some(
          (confirmation) =>
            confirmation?.requirementId ===
            requirement?.requirementId
        )
    );

  const poDocumentCompleted =
    isPoDocumentComplete(order) &&
    getStatusClass(lifecycle?.[2]?.status) === "approved";

  const vendorFinalizationCompleted =
    getStatusClass(
      lifecycle?.[3]?.status
    ) === "approved" ||
    vehicleApprovalCompleted;

  const orderPlacedCompleted =
    getStatusClass(
      lifecycle?.[4]?.status
    ) === "approved" ||
    String(order?.orderPlaced?.status || "")
      .trim()
      .toLowerCase() === "completed";

  /*
   * "Tracking Input" can be written earlier by approval flow.
   * Only treat it as Tracking after Order Placed is completed.
   */
  if (
    stage === "tracking input" &&
    orderPlacedCompleted
  ) {
    return 5;
  }

  if (
    vehicleApprovalCompleted &&
    !poDocumentCompleted
  ) {
    return 2;
  }

  if (
    poDocumentCompleted &&
    vendorFinalizationCompleted &&
    orderPlacedCompleted
  ) {
    return 5;
  }

  if (
    poDocumentCompleted &&
    vendorFinalizationCompleted
  ) {
    return 4;
  }

  if (
    poDocumentCompleted &&
    !vendorFinalizationCompleted
  ) {
    return 3;
  }

  const stageMap = {
    enquiry: 0,
    "enquiry details": 0,
    "key account": 0,
    "order approval": 1,
    "order finalization": 1,
    po: 2,
    "po document": 2,
    traffic: 3,
    "traffic quotation": 3,
    "quotation approval": 3,
    "quotation confirmation": 3,
    "vendor finalization": 3,
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
  onOrderUpdated,
}) => {
  const [localOrder, setLocalOrder] = useState(null);
  const [latestOrderLoading, setLatestOrderLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLatestOrderLoading(true);
    setLocalOrder(null);

    const loadLatestOrder = async () => {
      if (!order?._id) {
        if (!cancelled) {
          setLocalOrder(order || null);
          setLatestOrderLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `${TRIP_API_URL}/${order._id}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload?.message || "Unable to fetch latest order."
          );
        }

        const latestOrder =
          payload?.data ||
          payload?.trip ||
          payload?.order ||
          payload;

        if (!cancelled) {
          setLocalOrder(latestOrder);
          setLatestOrderLoading(false);
        }
      } catch (error) {
        console.error("Load Latest Order Error:", error);

        // Keep the order received from the list as a safe fallback.
        if (!cancelled) {
          setLocalOrder(order || null);
          setLatestOrderLoading(false);
        }
      }
    };

    loadLatestOrder();

    return () => {
      cancelled = true;
    };
  }, [order?._id]);

  // Do not fall back to the stale table-row order while the latest
  // MongoDB order is loading. This prevents the PO page flashing first.
  const workingOrder = latestOrderLoading ? null : (localOrder || order);

  const lifecycle = useMemo(
    () => buildLifecycle(workingOrder || {}),
    [workingOrder]
  );

  const currentLifecycleIndex = useMemo(
    () =>
      getLifecycleCurrentIndex(
        workingOrder || {},
        lifecycle
      ),
    [workingOrder, lifecycle]
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

  const [poForm, setPoForm] = useState({
    poNumber: order?.poDocument?.poNumber || "",
    poValidityPeriod:
      order?.poDocument?.poValidityPeriod || "",
    billingGstin:
      order?.poDocument?.billingGstin || "",
    status: order?.poDocument?.status || "Pending",
    documentName:
      order?.poDocument?.fileName ||
      order?.poDocument?.documentName ||
      "",
    uploadedBy:
      order?.poDocument?.uploadedBy ||
      sessionStorage.getItem("kamUsername") ||
      "",
  });

  const [poFile, setPoFile] = useState(null);
  const [poSaving, setPoSaving] = useState(false);
  const [poMessage, setPoMessage] = useState("");
  const [poError, setPoError] = useState("");

  const [placeOrderSaving, setPlaceOrderSaving] = useState(false);
  const [placeOrderMessage, setPlaceOrderMessage] = useState("");
  const [placeOrderError, setPlaceOrderError] = useState("");

  /* =========================================================
     TOAST NOTIFICATION
  ========================================================= */

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
      id: Date.now(),
    });
  };

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [toast]);

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
    if (workingOrder) {
      setActiveStepIndex(
        currentLifecycleIndex
      );
    }
  }, [
    currentLifecycleIndex,
    workingOrder?._id,
    workingOrder?.stage,
    workingOrder?.poDocument?.status,
    workingOrder?.orderPlaced?.status,
  ]);

  useEffect(() => {
    setApprovalRequested(
      workingOrder?.orderApproval?.status ===
        "Pending" &&
        Boolean(
          workingOrder?.orderApproval?.requestedAt
        )
    );
  }, [
    workingOrder?.orderApproval?.status,
    workingOrder?.orderApproval?.requestedAt,
  ]);

  /* =========================================================
     KEEP INPUT VALUES SYNCED WHEN ORDER CHANGES
  ========================================================= */

  useEffect(() => {
    setFinalizationForm({
      quotedRate:
        workingOrder?.orderFinalization?.quotedRate ??
        workingOrder?.quotedRate ??
        "",
      finalRate:
        workingOrder?.orderFinalization?.finalRate ??
        workingOrder?.finalRate ??
        "",
      commercialTerms:
        workingOrder?.orderFinalization?.commercialTerms ??
        workingOrder?.commercialTerms ??
        "",
      deliveryCommitments:
        workingOrder?.orderFinalization?.deliveryCommitments ??
        workingOrder?.deliveryCommitments ??
        "",
      clientConfirmationNotes:
        workingOrder?.orderFinalization?.clientConfirmationNotes ??
        workingOrder?.clientConfirmationNotes ??
        "",
    });
  }, [workingOrder]);

  useEffect(() => {
    const savedValidity =
      workingOrder?.poDocument?.poValidityPeriod;

    setPoForm({
      poNumber:
        workingOrder?.poDocument?.poNumber || "",
      poValidityPeriod:
        savedValidity
          ? String(savedValidity).slice(0, 10)
          : "",
      billingGstin:
        workingOrder?.poDocument?.billingGstin || "",
      status:
        workingOrder?.poDocument?.status || "Pending",
      documentName:
        workingOrder?.poDocument?.documentName ||
        workingOrder?.poDocument?.fileName ||
        "",
      uploadedBy:
        workingOrder?.poDocument?.uploadedBy ||
        sessionStorage.getItem("kamUsername") ||
        "",
    });

    setPoFile(null);
    setPoMessage("");
    setPoError("");
  }, [workingOrder]);

  if (latestOrderLoading) {
    return (
      <div className="kam-lifecycle-modal-overlay">
        <div className="kam-lifecycle-modal">
          <div
            style={{
              minHeight: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "10px",
              fontWeight: 700,
            }}
          >
            <div>Loading latest order...</div>
            <small style={{ fontWeight: 500, opacity: 0.65 }}>
              Checking the current lifecycle stage
            </small>
          </div>
        </div>
      </div>
    );
  }

  if (!workingOrder) {
    return null;
  }

  // From this point onward all lifecycle rendering and actions use the
  // freshest order returned by the backend.
  order = workingOrder;

  /* =========================================================
     SAVED / LOCKED STATES
     - Order Finalization locks after a successful Save Changes
       because the backend writes orderFinalization.updatedAt.
     - PO Document locks after a successful save because its
       status is stored as Completed.
  ========================================================= */

  const finalizationLocked =
    Boolean(order?.orderFinalization?.updatedAt) ||
    String(order?.orderApproval?.status || "")
      .trim()
      .toLowerCase() === "approved";

  const poLocked =
    String(order?.poDocument?.status || "")
      .trim()
      .toLowerCase() === "completed";

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

  const handlePoChange = (event) => {
    const { name, value } = event.target;

    setPoForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const savePoDocument = async () => {
    if (!order?._id) {
      const message = "Order ID is missing.";
      setPoError(message);
      showToast(message, "error");
      return;
    }

    if (!poForm.poNumber.trim()) {
      const message = "Enter the PO number before saving.";
      setPoError(message);
      showToast(message, "warning");
      return;
    }

    if (!poForm.poValidityPeriod) {
      const message = "Select the PO validity period before saving.";
      setPoError(message);
      showToast(message, "warning");
      return;
    }

    if (!poForm.billingGstin.trim()) {
      const message = "Enter the Billing GSTIN before saving.";
      setPoError(message);
      showToast(message, "warning");
      return;
    }

    if (
      !poFile &&
      !order?.poDocument?.fileName &&
      !order?.poDocument?.fileUrl &&
      !order?.poDocument?.documentUrl
    ) {
      const message = "Select a PO document before saving.";
      setPoError(message);
      showToast(message, "warning");
      return;
    }

    try {
      setPoSaving(true);
      setPoError("");
      setPoMessage("");

      const formData = new FormData();
      formData.append("poNumber", poForm.poNumber.trim());
      formData.append("poValidityPeriod", poForm.poValidityPeriod);
      formData.append(
        "billingGstin",
        poForm.billingGstin.trim().toUpperCase()
      );
      formData.append("status", "Completed");
      formData.append(
        "documentName",
        poForm.documentName.trim() || poFile?.name || "PO Document"
      );
      formData.append(
        "uploadedBy",
        poForm.uploadedBy.trim() ||
          sessionStorage.getItem("kamUsername") ||
          "Key Account"
      );

      if (poFile) {
        formData.append("document", poFile);
      }

      const response = await fetch(
        `${TRIP_API_URL}/${order._id}/po-document`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to save PO document.");
      }

      const updatedOrder =
        payload?.data || payload?.trip || payload?.order || payload;

      setPoForm((previous) => ({
        ...previous,
        status: "Completed",
      }));
      setPoMessage("PO document saved successfully.");
      showToast("PO document saved successfully.", "success");

      // Immediately use the fresh backend order inside this modal.
      // This makes PO Number, PO Validity and Billing GSTIN appear on
      // Order Placed without closing/reopening the lifecycle modal.
      setLocalOrder(updatedOrder);

      if (typeof onOrderUpdated === "function") {
        onOrderUpdated(updatedOrder);
      }

      /*
       * AFTER PO SAVE:
       * - If Vendor Finalization was already approved -> Order Placed.
       * - Otherwise -> Vendor Finalization.
       *
       * Use updatedOrder returned by the backend so this does not depend
       * on stale React state.
       */
      const updatedRequirements = safeArray(
        updatedOrder?.vehicleRequirements
      );

      const updatedApprovedConfirmations = safeArray(
        updatedOrder?.vehicleConfirmations
      ).filter(
        (confirmation) =>
          confirmation?.status === "Approved"
      );

      const updatedVehicleApprovalCompleted =
        updatedRequirements.length > 0 &&
        updatedRequirements.every(
          (requirement) =>
            updatedApprovedConfirmations.some(
              (confirmation) =>
                confirmation?.requirementId ===
                requirement?.requirementId
            )
        );

      const vendorAlreadyApproved =
        getStatusClass(
          updatedOrder?.vendorFinalization?.status
        ) === "approved" ||
        updatedVehicleApprovalCompleted;

      if (vendorAlreadyApproved) {
        // Step 5: Order Placed
        setActiveStepIndex(4);
      } else {
        // Step 4: Vendor Finalization
        setActiveStepIndex(3);
      }
    } catch (error) {
      const message = error.message || "Unable to save PO document.";
      setPoError(message);
      showToast(message, "error");
    } finally {
      setPoSaving(false);
    }
  };

  const placeOrder = async () => {
    if (!order?._id) {
      const message = "Order ID is missing.";
      setPlaceOrderError(message);
      showToast(message, "error");
      return;
    }

    if (!vehicleApprovalCompleted) {
      const message =
        "All vehicle requirements must have an approved transporter before placing the order.";
      setPlaceOrderError(message);
      showToast(message, "warning");
      return;
    }

    const poCompleted = isPoDocumentComplete(order);

    if (!poCompleted) {
      const message = "Complete the PO Document before placing the order.";
      setPlaceOrderError(message);
      showToast(message, "warning");
      return;
    }

    try {
      setPlaceOrderSaving(true);
      setPlaceOrderError("");
      setPlaceOrderMessage("");

      const placedBy =
        sessionStorage.getItem("kamUsername") || "Key Account";

      const body = {
        stage: "Tracking",
        orderPlaced: {
          status: "Completed",
          placedAt: new Date().toISOString(),
          placedBy,
        },
      };

      // Prefer a dedicated order-placement endpoint when available.
      let response = await fetch(
        `${TRIP_API_URL}/${order._id}/order-placed`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      // Backward-compatible fallback for projects using the generic updateTrip route.
      if (response.status === 404) {
        response = await fetch(
          `${TRIP_API_URL}/${order._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        );
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.message || "Unable to place the order."
        );
      }

      const updatedOrder =
        payload?.data ||
        payload?.trip ||
        payload?.order ||
        payload;

      setPlaceOrderMessage(
        "Order placed successfully and moved to Tracking."
      );
      showToast(
        "Order placed successfully. The trip is now in Tracking.",
        "success"
      );

      if (typeof onOrderUpdated === "function") {
        onOrderUpdated(updatedOrder);
      }

      setActiveStepIndex(5);
    } catch (error) {
      const message =
        error.message || "Unable to place the order.";
      setPlaceOrderError(message);
      showToast(message, "error");
    } finally {
      setPlaceOrderSaving(false);
    }
  };


  const saveOrderFinalization = async (
    requestApproval = false
  ) => {
    if (!order?._id) {
      const message = "Order ID is missing.";
      setFinalizationError(message);
      showToast(message, "error");
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

      // Use the fresh backend response immediately. This makes
      // the saved fields read-only without closing the modal.
      setLocalOrder(updatedOrder);

      const successMessage = requestApproval
        ? "Order finalization saved and sent for approval."
        : "Order finalization saved successfully.";

      setFinalizationMessage(successMessage);
      showToast(successMessage, "success");

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
      const message =
        error.message ||
        "Unable to save order finalization.";

      setFinalizationError(message);
      showToast(message, "error");
    } finally {
      setFinalizationSaving(false);
    }
  };

  const handleStepClick = (
    index
  ) => {
    const poOrVendorStep =
      index === 2 || index === 3;

    const approvalManagementApproved =
      order?.orderApproval?.status === "Approved" ||
      vehicleApprovalCompleted ||
      String(order?.stage || "")
        .trim()
        .toLowerCase() === "tracking input";

    /*
     * After Approval Management approval:
     * - PO Document (step 3) stays as the default page.
     * - PO Document and Vendor Finalization are both clickable.
     * - Vendor Finalization does not require PO data/completion.
     */
    if (
      index <= currentLifecycleIndex ||
      (approvalManagementApproved && poOrVendorStep)
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

  const displayCurrentStage = (() => {
    const rawStage = String(order?.stage || "")
      .trim()
      .toLowerCase();

    const poCompleted = isPoDocumentComplete(order);

    const approvalManagementApproved =
      vehicleApprovalCompleted ||
      rawStage === "tracking input";

    const orderPlacedCompleted =
      getStatusClass(order?.orderPlaced?.status) === "approved";

    if (
      rawStage === "trip complete" ||
      rawStage === "trip completed" ||
      rawStage === "completed" ||
      rawStage === "complete"
    ) {
      return "Trip Complete";
    }

    const hasRealTrackingProgress = safeArray(order?.allocatedVehicles).some(
      (allocation) =>
        safeArray(allocation?.dailyTracking).length > 0 ||
        String(allocation?.loading?.status || "").trim().toLowerCase() === "completed" ||
        String(allocation?.unloading?.status || "").trim().toLowerCase() === "completed"
    );

    // PO Document is the mandatory gate after Approval Management.
    // Ignore stale Order Placed / Tracking Input values until PO is complete.
    if (
      approvalManagementApproved &&
      !poCompleted &&
      !hasRealTrackingProgress
    ) {
      return "PO Document";
    }

    if (
      (orderPlacedCompleted || rawStage === "tracking") &&
      hasRealTrackingProgress
    ) {
      return "Tracking";
    }

    if (
      poCompleted &&
      getStatusClass(
        order?.vendorFinalization?.status
      ) !== "approved"
    ) {
      return "Vendor Finalization";
    }

    if (
      poCompleted &&
      vehicleApprovalCompleted &&
      !orderPlacedCompleted
    ) {
      return "Order Placed";
    }

    return order?.stage || "Order Approval";
  })();

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
                  index === activeStepIndex;

                const completed =
                  !rejected &&
                  (
                    index <
                      activeStepIndex ||
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
                      disabled={(() => {
                        const poOrVendorStep =
                          index === 2 || index === 3;

                        const approvalManagementApproved =
                          order?.orderApproval?.status === "Approved" ||
                          vehicleApprovalCompleted ||
                          String(order?.stage || "")
                            .trim()
                            .toLowerCase() === "tracking input";

                        return !(
                          index <= currentLifecycleIndex ||
                          (approvalManagementApproved && poOrVendorStep)
                        );
                      })()}
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
                      disabled={finalizationLocked}
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
                      disabled={finalizationLocked}
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
                      disabled={finalizationLocked}
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
                      disabled={finalizationLocked}
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
                      disabled={finalizationLocked}
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

                  {finalizationLocked ? (
                    <button
                      type="button"
                      className="kam-save-finalization-btn"
                      disabled
                    >
                      ✓ Saved
                    </button>
                  ) : (
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
                  )}
                </div>

              </section>

            </div>
          )}

          {/* =================================================
              VENDOR FINALIZATION
              CONFIRMED TRANSPORTERS FIRST
              TRAFFIC QUOTATIONS SECOND
          ================================================= */}

          {activeStepIndex === 3 && (
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

          {activeStepIndex === 2 && (

            <div className="kam-step-page kam-step-page-po-document">

              <section className="kam-client-vehicle-section">

                <SectionHeading
                  title="PO Document"
                  description="Purchase order information and supporting document details."
                />

                <div className="kam-client-trip-grid">

                  <div className="kam-client-trip-field">
                    <span>
                      Client Purchase Order (PO) Number
                      <em>*</em>
                    </span>

                    <input
                      type="text"
                      name="poNumber"
                      value={poForm.poNumber}
                      onChange={handlePoChange}
                      placeholder="Enter PO number"
                      disabled={poLocked}
                    />
                  </div>

                  <div className="kam-client-trip-field">
                    <span>
                      PO Validity Period
                      <em>*</em>
                    </span>

                    <input
                      type="date"
                      name="poValidityPeriod"
                      value={poForm.poValidityPeriod}
                      onChange={handlePoChange}
                      disabled={poLocked}
                    />
                  </div>

                  <div className="kam-client-trip-field">
                    <span>
                      Billing GSTIN
                      <em>*</em>
                    </span>

                    <input
                      type="text"
                      name="billingGstin"
                      value={poForm.billingGstin}
                      onChange={(event) =>
                        setPoForm((previous) => ({
                          ...previous,
                          billingGstin: event.target.value.toUpperCase(),
                        }))
                      }
                      maxLength={15}
                      placeholder="Enter billing GSTIN"
                      disabled={poLocked}
                    />
                  </div>

                  <div className="kam-client-trip-field">
                    <span>
                      PO Status
                    </span>

                    <select
                      name="status"
                      value={poForm.status}
                      onChange={handlePoChange}
                      disabled={poLocked}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="kam-client-trip-field">
                    <span>
                      Document Name
                    </span>

                    <input
                      type="text"
                      name="documentName"
                      value={poForm.documentName}
                      onChange={handlePoChange}
                      placeholder="Enter document name"
                      disabled={poLocked}
                    />
                  </div>

                  <div className="kam-client-trip-field">
                    <span>
                      Uploaded By
                    </span>

                    <input
                      type="text"
                      name="uploadedBy"
                      value={poForm.uploadedBy}
                      onChange={handlePoChange}
                      placeholder="Enter uploaded by"
                      disabled={poLocked}
                    />
                  </div>

                  <div className="kam-client-trip-field kam-po-upload-field">
                    <span>Upload PO Document</span>

                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      disabled={poLocked}
                      onChange={(event) => {
                        const selectedFile = event.target.files?.[0] || null;
                        setPoFile(selectedFile);
                        setPoError("");

                        if (selectedFile && !poForm.documentName.trim()) {
                          setPoForm((previous) => ({
                            ...previous,
                            documentName: selectedFile.name,
                          }));
                        }
                      }}
                    />

                    <small>
                      {poFile
                        ? `Selected: ${poFile.name}`
                        : order?.poDocument?.fileName ||
                          "PDF, Word, JPG or PNG"}
                    </small>
                  </div>

                </div>

                {poMessage && (
                  <div className="kam-form-success">{poMessage}</div>
                )}

                {poError && (
                  <div className="kam-form-error">{poError}</div>
                )}

              </section>

            </div>
          )}

          {/* =================================================
              ORDER PLACED - FINAL VERIFICATION
          ================================================= */}

          {activeStepIndex === 4 && (
            <div className="kam-step-page kam-step-page-place-order">

              <section className="kam-place-order-section">
                <div className="kam-place-order-heading">
                  <div>
                    <span className="kam-place-order-kicker">
                      FINAL VERIFICATION
                    </span>
                    <h3>Order Important Details</h3>
                    <p>
                      Verify the commercial and PO details before releasing this
                      order to the Tracking team.
                    </p>
                  </div>

                  <span className="kam-place-order-ready">
                    Ready to Place
                  </span>
                </div>

                <div className="kam-place-order-detail-grid">
                  <div className="kam-place-order-detail">
                    <span>Order ID</span>
                    <strong>{order.tripId || "—"}</strong>
                  </div>

                  <div className="kam-place-order-detail">
                    <span>Final Rate</span>
                    <strong>
                      {formatAmount(
                        order?.orderFinalization?.finalRate ??
                          order?.finalRate
                      )}
                    </strong>
                  </div>

                  <div className="kam-place-order-detail">
                    <span>PO Number</span>
                    <strong>{order?.poDocument?.poNumber || "—"}</strong>
                  </div>

                  <div className="kam-place-order-detail">
                    <span>PO Validity</span>
                    <strong>
                      {formatDate(order?.poDocument?.poValidityPeriod)}
                    </strong>
                  </div>

                  <div className="kam-place-order-detail">
                    <span>Billing GSTIN</span>
                    <strong>{order?.poDocument?.billingGstin || "—"}</strong>
                  </div>

                  <div className="kam-place-order-detail">
                    <span>Commercial Terms</span>
                    <strong>
                      {order?.orderFinalization?.commercialTerms ||
                        order?.commercialTerms ||
                        "—"}
                    </strong>
                  </div>

                  <div className="kam-place-order-detail kam-place-order-detail-wide">
                    <span>Delivery Commitment</span>
                    <strong>
                      {order?.orderFinalization?.deliveryCommitments ||
                        order?.deliveryCommitments ||
                        "—"}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="kam-place-order-section">
                <div className="kam-place-order-heading">
                  <div>
                    <span className="kam-place-order-kicker">
                      APPROVED TRANSPORT
                    </span>
                    <h3>Transport Details</h3>
                    <p>
                      Final transporter selection approved against each vehicle
                      requirement.
                    </p>
                  </div>

                  <span className="kam-place-order-transport-count">
                    {approvedConfirmations.length} Confirmed
                  </span>
                </div>

                {approvedConfirmations.length > 0 ? (
                  <div className="kam-place-order-table-wrap">
                    <table className="kam-place-order-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Vehicle Type</th>
                          <th>Configuration</th>
                          <th>Qty</th>
                          <th>Transporter</th>
                          <th>Confirmed Amount</th>
                          <th>Confirmed By</th>
                        </tr>
                      </thead>

                      <tbody>
                        {approvedConfirmations.map((confirmation, index) => {
                          const requirement = getRequirement(
                            order,
                            confirmation.requirementId
                          );

                          const quotation = getQuotation(
                            order,
                            confirmation.quotationId
                          );

                          return (
                            <tr
                              key={
                                confirmation.confirmationId ||
                                confirmation.requirementId ||
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
                                  {requirement?.vehicleType || "—"}
                                </strong>
                              </td>

                              <td>{requirement?.configuration || "—"}</td>

                              <td>
                                {formatNumber(requirement?.quantity)}
                              </td>

                              <td>
                                <strong>
                                  {quotation?.transporter || "—"}
                                </strong>
                              </td>

                              <td>
                                {formatAmount(quotation?.amount)}
                              </td>

                              <td>
                                {confirmation?.confirmedBy || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="kam-lifecycle-empty">
                    No approved transporter details are available.
                  </div>
                )}
              </section>

              <div className="kam-place-order-note">
                <span className="kam-place-order-note-icon" aria-hidden="true">
                  ✓
                </span>

                <div>
                  <strong>Final verification</strong>
                  <p>
                    After you click Place Order, this order will move to Tracking.
                    The Tracking team can then allocate actual vehicles, drivers,
                    and manage daily movement updates.
                  </p>
                </div>
              </div>

              {placeOrderMessage && (
                <div className="kam-form-success">
                  {placeOrderMessage}
                </div>
              )}

              {placeOrderError && (
                <div className="kam-form-error">
                  {placeOrderError}
                </div>
              )}

            </div>
          )}

          {/* =================================================
              TRACKING - ALLOCATED VEHICLES
          ================================================= */}

          {activeStepIndex === 5 && (
            <div className="kam-step-page kam-step-page-allocated-vehicles">
              <section className="kam-client-vehicle-section">
                <SectionHeading
                  title="Allocated Vehicles"
                  description="Actual vehicles allocated and managed by the Tracking team."
                  count={allocations.length}
                />

                {allocations.length > 0 ? (
                  <div className="kam-client-vehicle-table-wrap">
                    <table className="kam-client-vehicle-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Vehicle Number</th>
                          <th>Requirement</th>
                          <th>Transporter</th>
                          <th>Driver</th>
                          <th>Current Location</th>
                          <th>Day</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {allocations.map((allocation, index) => {
                          const requirement = getRequirement(
                            order,
                            allocation.requirementId
                          );

                          const confirmation =
                            safeArray(order.vehicleConfirmations).find(
                              (item) =>
                                item.confirmationId ===
                                allocation.confirmationId
                            ) ||
                            getApprovedConfirmation(
                              order,
                              allocation.requirementId
                            );

                          const quotation = getQuotation(
                            order,
                            allocation.quotationId ||
                              confirmation?.quotationId
                          );

                          const latest = getLatestTracking(allocation);

                          return (
                            <tr key={allocation.allocationId || index}>
                              <td>
                                <span className="kam-client-row-no">
                                  {index + 1}
                                </span>
                              </td>
                              <td><strong>{allocation.vehicleNumber || "—"}</strong></td>
                              <td>{requirement?.vehicleType || allocation.requirementId || "—"}</td>
                              <td>{quotation?.transporter || "—"}</td>
                              <td>
                                <strong>{allocation?.driver?.name || "—"}</strong>
                                {allocation?.driver?.contactNumber && (
                                  <small style={{ display: "block" }}>
                                    {allocation.driver.contactNumber}
                                  </small>
                                )}
                              </td>
                              <td>{latest?.currentLocation || "—"}</td>
                              <td>{latest?.day || "—"}</td>
                              <td>
                                <span className={`approval-status ${getStatusClass(latest?.status || "Pending")}`}>
                                  {latest?.status || "Pending"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="kam-lifecycle-empty">
                    Tracking has started. Actual vehicle details will appear here after the Tracking team allocates vehicles.
                  </div>
                )}
              </section>
            </div>
          )}

          {/* =================================================
              TRIP COMPLETE - COMPACT OVERALL SUMMARY
              READ ONLY
          ================================================= */}

          {activeStepIndex === 6 && (
            <div className="kam-step-page kam-step-page-trip-complete">

              {/* ORDER SUMMARY */}
              <section className="kam-client-vehicle-section">
                <SectionHeading
                  title="Trip Complete"
                  description="Compact final summary of the completed trip."
                  count={allocations.length}
                />

                <div className="kam-client-trip-grid">
                  <ReadOnlyField label="Order ID" value={order.tripId} />
                  <ReadOnlyField label="Customer" value={order.customer} />
                  <ReadOnlyField label="Material Type" value={order.materialType} />
                  <ReadOnlyField
                    label="Route"
                    value={
                      order.origin || order.destination
                        ? `${order.origin || "—"} → ${order.destination || "—"}`
                        : "—"
                    }
                  />
                  <ReadOnlyField label="Placement Date" value={formatDate(order.placementDate)} />
                  <ReadOnlyField
                    label="Total Vehicles"
                    value={
                      Number(order?.totalVehicles) > 0
                        ? `${order.totalVehicles} NOS`
                        : totalRequiredVehicles > 0
                        ? `${totalRequiredVehicles} NOS`
                        : "—"
                    }
                  />
                </div>
              </section>

              {/* COMMERCIAL & PO */}
              <section className="kam-client-vehicle-section">
                <SectionHeading
                  title="Commercial & PO"
                  description="Final commercial and purchase order information."
                />

                <div className="kam-client-trip-grid">
                  <ReadOnlyField
                    label="Final Rate"
                    value={formatAmount(
                      order?.orderFinalization?.finalRate ?? order?.finalRate
                    )}
                  />
                  <ReadOnlyField
                    label="Commercial Terms"
                    value={
                      order?.orderFinalization?.commercialTerms ??
                      order?.commercialTerms
                    }
                  />
                  <ReadOnlyField label="PO Number" value={order?.poDocument?.poNumber} />
                  <ReadOnlyField
                    label="PO Validity"
                    value={formatDate(order?.poDocument?.poValidityPeriod)}
                  />
                  <ReadOnlyField label="Billing GSTIN" value={order?.poDocument?.billingGstin} />
                  <ReadOnlyField label="PO Status" value={order?.poDocument?.status} />
                </div>
              </section>

              {/* VEHICLE SUMMARY */}
              <section className="kam-client-vehicle-section">
                <SectionHeading
                  title="Vehicle Summary"
                  description="Final vehicle, transporter, driver and delivery status."
                  count={allocations.length}
                />

                {allocations.length > 0 ? (
                  <div className="kam-client-vehicle-table-wrap">
                    <table className="kam-client-vehicle-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Vehicle Number</th>
                          <th>Vehicle Type</th>
                          <th>Transporter</th>
                          <th>Driver</th>
                          <th>Final Location</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {allocations.map((allocation, index) => {
                          const requirement = getRequirement(
                            order,
                            allocation.requirementId
                          );

                          const confirmation =
                            safeArray(order.vehicleConfirmations).find(
                              (item) =>
                                item.confirmationId === allocation.confirmationId
                            ) ||
                            getApprovedConfirmation(
                              order,
                              allocation.requirementId
                            );

                          const quotation = getQuotation(
                            order,
                            allocation.quotationId || confirmation?.quotationId
                          );

                          const latest = getLatestTracking(allocation);

                          return (
                            <tr
                              key={
                                allocation.allocationId ||
                                allocation._id ||
                                index
                              }
                            >
                              <td><span className="kam-client-row-no">{index + 1}</span></td>
                              <td><strong>{allocation.vehicleNumber || "—"}</strong></td>
                              <td>{requirement?.vehicleType || "—"}</td>
                              <td>{quotation?.transporter || "—"}</td>
                              <td><strong>{allocation?.driver?.name || "—"}</strong></td>
                              <td>{latest?.currentLocation || order.destination || "—"}</td>
                              <td>
                                <span
                                  className={`approval-status ${getStatusClass(
                                    allocation?.unloading?.status ||
                                      latest?.status ||
                                      "Pending"
                                  )}`}
                                >
                                  {allocation?.unloading?.status ||
                                    latest?.status ||
                                    "Pending"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="kam-lifecycle-empty">No allocated vehicle data is available.</div>
                )}
              </section>

              {/* FINAL COMPLETION */}
              <section className="kam-client-vehicle-section">
                <SectionHeading
                  title="Completion"
                  description="Final trip completion status."
                />

                <div className="kam-client-trip-grid">
                  <ReadOnlyField label="Trip Stage" value={order?.stage || "Trip Complete"} />
                  <ReadOnlyField label="Trip Status" value={order?.status || "Completed"} />
                  <ReadOnlyField
                    label="Completed Vehicles"
                    value={`${
                      allocations.filter(
                        (item) =>
                          String(item?.unloading?.status || "")
                            .trim()
                            .toLowerCase() === "completed"
                      ).length
                    } / ${allocations.length}`}
                  />
                </div>
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
              {lifecycle?.[currentLifecycleIndex]?.title ||
                order?.stage ||
                displayCurrentStage}
            </strong>
          </div>

          <div className="kam-footer-action-buttons">

            {/* ENQUIRY */}

            {activeStepIndex === 0 && (

              <button
                type="button"
                className={`kam-request-approval-btn ${
                  currentLifecycleIndex > 0
                    ? "kam-approval-approved-btn"
                    : ""
                }`}
                disabled={currentLifecycleIndex > 0}
                onClick={() => {
                  if (currentLifecycleIndex === 0) {
                    setActiveStepIndex(1);
                    showToast(
                      "Order Finalization opened. Complete the details and request approval.",
                      "info"
                    );
                  }
                }}
              >
                {currentLifecycleIndex > 0 ? (
                  <>
                    <span aria-hidden="true">✓</span>
                    <span>Order Finalization Started</span>
                  </>
                ) : (
                  <>
                    <span>Order Finalization</span>
                    <span aria-hidden="true">→</span>
                  </>
                )}
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

            {activeStepIndex === 3 && (
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

            {/* PO DOCUMENT */}

            {activeStepIndex === 2 && (
              poLocked ? (
                <button
                  type="button"
                  className="kam-request-approval-btn kam-po-save-btn kam-approval-approved-btn"
                  disabled
                >
                  <span aria-hidden="true">✓</span>
                  <span>PO Saved</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="kam-request-approval-btn kam-po-save-btn"
                  disabled={poSaving}
                  onClick={savePoDocument}
                >
                  <span aria-hidden="true">✓</span>
                  <span>{poSaving ? "Saving..." : "Save PO"}</span>
                </button>
              )
            )}

            {/* ORDER PLACED */}

            {activeStepIndex === 4 && (
              currentLifecycleIndex >= 5 ||
              String(order?.stage || "")
                .trim()
                .toLowerCase() === "tracking" ||
              String(order?.orderPlaced?.status || "")
                .trim()
                .toLowerCase() === "completed" ? (
                <button
                  type="button"
                  className="kam-request-approval-btn kam-place-order-btn kam-approval-approved-btn"
                  disabled
                >
                  <span aria-hidden="true">✓</span>
                  <span>Order Placed</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="kam-request-approval-btn kam-place-order-btn"
                  disabled={placeOrderSaving}
                  onClick={placeOrder}
                >
                  <span aria-hidden="true">✓</span>
                  <span>
                    {placeOrderSaving ? "Placing Order..." : "Place Order"}
                  </span>
                  {!placeOrderSaving && (
                    <span aria-hidden="true">→</span>
                  )}
                </button>
              )
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

      {/* PROFESSIONAL TOAST */}
      {toast && (
        <div
          className={`kam-toast kam-toast-${toast.type}`}
          role="status"
          aria-live="polite"
          key={toast.id}
        >
          <div className="kam-toast-icon" aria-hidden="true">
            {toast.type === "success"
              ? "✓"
              : toast.type === "error"
              ? "!"
              : toast.type === "warning"
              ? "!"
              : "i"}
          </div>

          <div className="kam-toast-content">
            <strong>
              {toast.type === "success"
                ? "Success"
                : toast.type === "error"
                ? "Action Failed"
                : toast.type === "warning"
                ? "Required"
                : "Information"}
            </strong>
            <span>{toast.message}</span>
          </div>

          <button
            type="button"
            className="kam-toast-close"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

    </div>
  );
};

export default Lifecyclemodal;
