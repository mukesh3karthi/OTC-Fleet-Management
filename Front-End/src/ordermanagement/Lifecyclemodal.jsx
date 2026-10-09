import React, { useEffect, useMemo, useRef, useState } from "react";
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

  return `${length ?? "—"} × ${height ?? "—"
    } × ${width ?? "—"}`;
};

const getStatusClass = (status) => {
  const value = String(status || "Pending")
    .trim()
    .toLowerCase();

  if (
    value === "approved" ||
    value === "completed" ||
    value === "tracking"
  ) {
    return "approved";
  }

  if (value === "rejected") {
    return "rejected";
  }

  if (value === "moving") {
    return "moving";
  }

  if (value === "idle") {
    return "idle";
  }

  if (value === "reached") {
    return "reached";
  }

  if (value === "breakdown") {
    return "breakdown";
  }

  if (value === "stopped") {
    return "stopped";
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

const getTransportReplacementRequests = (order) =>
  safeArray(order?.transportReplacementRequests);

const hasPendingTransportReplacement = (order) =>
  getTransportReplacementRequests(order).some(
    (request) =>
      String(request?.status || "").trim().toLowerCase() ===
      "pending"
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
  const requirements = safeArray(order?.vehicleRequirements);
  const confirmations = safeArray(order?.vehicleConfirmations);
  const quotations = safeArray(order?.trafficQuotations);
  const allocations = safeArray(order?.allocatedVehicles);

  const approvedConfirmations = confirmations.filter(
    (confirmation) =>
      String(confirmation?.status || "").trim().toLowerCase() === "approved"
  );

  const enquiryStatus = requirements.length > 0 ? "Completed" : "Pending";

  const approvalStatus = String(order?.orderApproval?.status || "")
    .trim()
    .toLowerCase();

  const orderFinalizationStatus =
    approvalStatus === "rejected"
      ? "Rejected"
      : approvalStatus === "approved"
        ? "Completed"
        : approvalStatus === "pending" && order?.orderApproval?.requestedAt
          ? "Pending"
          : order?.orderFinalization?.status || "Pending";

  const poDocumentStatus = isPoDocumentComplete(order)
    ? "Completed"
    : "Pending";

  const requiredVendorVehicleCount = requirements.reduce(
    (total, requirement) => {
      const quantity = Number(
        requirement?.quantity ??
        requirement?.vehicleQuantity ??
        requirement?.requiredQuantity ??
        requirement?.noOfVehicles ??
        requirement?.numberOfVehicles ??
        0
      );

      return total + (
        Number.isFinite(quantity) && quantity > 0 ? quantity : 0
      );
    },
    0
  );

  const approvedVendorVehicleCount = approvedConfirmations.reduce(
    (total, confirmation) => {
      const confirmationQuotationId = String(
        confirmation?.quotationId ||
        confirmation?.trafficQuotationId ||
        ""
      ).trim();

      const quotation = quotations.find((quote) => {
        const quoteId = String(
          quote?.quotationId ||
          quote?._id ||
          quote?.id ||
          ""
        ).trim();

        return quoteId && confirmationQuotationId && quoteId === confirmationQuotationId;
      });

      if (!quotation) return total;

      const quantity = Number(
        quotation?.quantity ??
        quotation?.vehicleQuantity ??
        quotation?.approvedQuantity ??
        quotation?.allocatedQuantity ??
        1
      );

      return total + (
        Number.isFinite(quantity) && quantity > 0 ? quantity : 1
      );
    },
    0
  );

  const transportReplacementPending = hasPendingTransportReplacement(order);

  const vendorFinalizationStatus =
    transportReplacementPending
      ? "Replacement Pending"
      : requiredVendorVehicleCount > 0 &&
        approvedVendorVehicleCount >= requiredVendorVehicleCount
        ? "Completed"
        : "Pending";

  const orderPlacedStatus =
    String(order?.orderPlaced?.status || "").trim().toLowerCase() === "completed"
      ? "Completed"
      : "Pending";

  const requiredVehicleCount =
    Math.max(0, Math.floor(Number(order?.totalVehicles) || 0)) ||
    requirements.reduce((total, requirement) => {
      const quantity = Number(requirement?.quantity || 0);
      return total + (
        Number.isFinite(quantity) && quantity > 0
          ? Math.floor(quantity)
          : 0
      );
    }, 0);

  const allRequiredVehiclesAllocated =
    requiredVehicleCount > 0 &&
    allocations.length >= requiredVehicleCount;

  const allAllocatedVehiclesUnloaded =
    allocations.length > 0 &&
    allocations.every(
      (allocation) =>
        String(allocation?.unloading?.status || "")
          .trim()
          .toLowerCase() === "completed"
    );

  const hasTracking = allocations.some(
    (allocation) =>
      safeArray(allocation?.dailyTracking).length > 0 ||
      String(allocation?.loading?.status || "")
        .trim()
        .toLowerCase() === "completed" ||
      String(allocation?.unloading?.status || "")
        .trim()
        .toLowerCase() === "completed"
  );

  const orderFinalizationCompleted = orderFinalizationStatus === "Completed";
  const poCompleted = poDocumentStatus === "Completed";
  const vendorCompleted = vendorFinalizationStatus === "Completed";
  const orderPlacedCompleted = orderPlacedStatus === "Completed";

  const tripCompleted =
    orderFinalizationCompleted &&
    poCompleted &&
    vendorCompleted &&
    orderPlacedCompleted &&
    allRequiredVehiclesAllocated &&
    allAllocatedVehiclesUnloaded;

  const trackingStatus = tripCompleted
    ? "Completed"
    : orderPlacedCompleted && hasTracking
      ? "Tracking"
      : orderPlacedCompleted
        ? "Pending"
        : "Pending";

  const tripCompleteStatus = tripCompleted ? "Completed" : "Pending";

  return [
    { key: "enquiry-details", title: "Enquiry Details", status: enquiryStatus },
    { key: "order-finalization", title: "Order Finalization", status: orderFinalizationStatus },
    { key: "po-document", title: "PO Document", status: poDocumentStatus },
    { key: "vendor-finalization", title: "Vendor Finalization", status: vendorFinalizationStatus },
    { key: "order-placed", title: "Order Placed", status: orderPlacedStatus },
    { key: "tracking", title: "Tracking", status: trackingStatus },
    { key: "trip-complete", title: "Trip Complete", status: tripCompleteStatus },
  ];
};

/* =========================================================
   CURRENT LIFECYCLE INDEX
========================================================= */

const getLifecycleCurrentIndex = (
  order,
  lifecycle
) => {
  const getStepStatus = (key) =>
    String(
      lifecycle.find((step) => step.key === key)?.status || "Pending"
    )
      .trim()
      .toLowerCase();

  if (getStepStatus("trip-complete") === "completed") {
    return 6;
  }

  if (getStepStatus("order-finalization") === "rejected") {
    return 1;
  }

  if (getStepStatus("order-finalization") !== "completed") {
    return 1;
  }

  if (getStepStatus("po-document") !== "completed") {
    return 2;
  }

  if (getStepStatus("vendor-finalization") !== "completed") {
    return 3;
  }

  if (getStepStatus("order-placed") !== "completed") {
    return 4;
  }

  return 5;
};

/* =========================================================
   READ ONLY FIELD
========================================================= */

const ReadOnlyField = ({
  label,
  value,
  suffix = "",
  editing = false,
  fieldKey,
  inputValue,
  onEdit,
}) => {
  const hasValue =
    value !== "" &&
    value !== null &&
    value !== undefined;

  return (
    <div className="kam-client-trip-field">
      <span>{label}</span>

      {editing && fieldKey ? (
        <input className="kam-original-edit-input" type={["enquiryDate", "placementDate"].includes(fieldKey) ? "date" : ["distance", "totalVehicles"].includes(fieldKey) ? "number" : "text"} value={inputValue ?? ""} onChange={(event) => onEdit(fieldKey, event.target.value)} />
      ) : <strong>
        {hasValue
          ? `${value}${suffix}`
          : "—"}
      </strong>}
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

const isCompletedTrip = (trip) =>
  String(trip?.stage || "").trim().toLowerCase() === "trip complete" ||
  (String(trip?.status || "").trim().toLowerCase() === "completed" &&
    Array.isArray(trip?.allocatedVehicles) && trip.allocatedVehicles.length > 0 &&
    trip.allocatedVehicles.every(v => String(v?.unloading?.status || "").toLowerCase() === "completed"));

const Lifecyclemodal = ({
  order,
  onClose,
  onOrderUpdated,
  initialEdit = false,
}) => {
  const [localOrder, setLocalOrder] = useState(null);
  const [latestOrderLoading, setLatestOrderLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [updatedByName, setUpdatedByName] = useState("");
  const [editForm, setEditForm] = useState({});
  const autoEditOpenedRef = useRef(false);
  const editBaselineRef = useRef("");
  const poBaselineRef = useRef("");
  const workingOrder = latestOrderLoading ? null : (localOrder || order);
  const openLifecycleEditor = () => {
    const o = workingOrder || order;
    if (isCompletedTrip(o)) {
      setEditOpen(false);
      showToast("Completed trips are read-only.", "error");
      return;
    }
    const initialEditForm = {
      customer: o.customer || "", contactPerson: o.contactPerson || "", contactNumber: o.contactNumber || "",
      email: o.email || "", assignedKam: o.assignedKam || "", origin: o.origin || "",
      destination: o.destination || "", materialType: o.materialType || "", remark: o.remark || "",
      siteLocation: o.siteLocation || "", period: o.period || "", dieselScope: o.dieselScope || "",
      distance: o.distance ?? "", totalVehicles: o.totalVehicles ?? "", enquiryDate: o.enquiryDate ? String(o.enquiryDate).slice(0, 10) : "", placementDate: o.placementDate ? String(o.placementDate).slice(0, 10) : "",
      orderFinalization: {
        quotedRate: o.orderFinalization?.quotedRate ?? "", finalRate: o.orderFinalization?.finalRate ?? "",
        commercialTerms: o.orderFinalization?.commercialTerms || "", deliveryCommitments: o.orderFinalization?.deliveryCommitments || "",
        clientConfirmationNotes: o.orderFinalization?.clientConfirmationNotes || ""
      },
      vehicleRequirements: safeArray(o.vehicleRequirements).map(r => ({
        requirementId: r.requirementId, vehicleType: r.vehicleType || "",
        configuration: r.configuration || "", classification: r.classification || "", quantity: r.quantity ?? 1, weight: r.weight ?? 0, dimensions: { length: r.dimensions?.length ?? "", height: r.dimensions?.height ?? "", width: r.dimensions?.width ?? "" }
      })),
      allocatedVehicles: safeArray(o.allocatedVehicles).map(v => ({
        allocationId: v.allocationId, vehicleNumber: v.vehicleNumber,
        driver: { name: v.driver?.name || "", contactNumber: v.driver?.contactNumber || "" },
        escort: { name: v.escort?.name || "", contactNumber: v.escort?.contactNumber || "", vehicleNumber: v.escort?.vehicleNumber || "" },
        supervisor: { name: v.supervisor?.name || "", contactNumber: v.supervisor?.contactNumber || "" }
      }))
    };
    setEditForm(initialEditForm);
    editBaselineRef.current = JSON.stringify(initialEditForm);
    poBaselineRef.current = JSON.stringify(poForm);
    setEditError("");
    setEditOpen(true);
  };
  const isIntercartingEdit = String((workingOrder || order)?.movementType || "").toLowerCase().includes("intercart");
  const editRequirementsLocked = String((workingOrder || order)?.orderApproval?.status || "").toLowerCase() === "approved" || safeArray((workingOrder || order)?.trafficQuotations).length > 0 || safeArray((workingOrder || order)?.allocatedVehicles).length > 0;
  const inlineTripFields = [
    ["customer", "Customer"], ["contactPerson", "Contact Person"], ["contactNumber", "Contact Number"],
    ["email", "Email"], ["materialType", "Material Type"], ["enquiryDate", "Enquiry Date"],
    ["placementDate", "Placement Date"], ["assignedKam", "Assigned KAM"],
    ...(!isIntercartingEdit ? [["origin", "Origin"], ["destination", "Destination"]] : []),
    ["distance", "Distance (km)"], ["totalVehicles", "Total Vehicles"]
  ];
  const inlineEditor = (stage) => (
    <section className="kam-inline-edit-panel">
      <div className="kam-inline-edit-heading"><h3>{stage === 0 ? "Edit Enquiry Details" : stage === 1 ? "Edit Commercial Details" : stage === 5 ? "Edit Allocated Vehicle Details" : "Edit Stage Details"}</h3><span>Editing in Order Lifecycle</span></div>
      {stage === 0 && <>
        <div className="kam-inline-edit-grid">{inlineTripFields.map(([key, label]) => <label key={key}><span>{label}</span><input type={["enquiryDate", "placementDate"].includes(key) ? "date" : ["distance", "totalVehicles"].includes(key) ? "number" : "text"} value={editForm[key] ?? ""} onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))} /></label>)}</div>
        {editForm.vehicleRequirements?.map((r, i) => <div className="kam-inline-edit-requirement" key={r.requirementId || i}><h4>Vehicle {i + 1}</h4>{editRequirementsLocked && <p>Vehicle requirements are locked after quotation, approval or allocation.</p>}<div className="kam-inline-edit-grid">{[["vehicleType", "Vehicle Type"], ["configuration", "Configuration Model"], ["classification", "Movement Classification"], ["quantity", "Quantity"], ["weight", "Weight (Ton)"]].map(([key, label]) => <label key={key}><span>{label}</span><input disabled={editRequirementsLocked} value={r[key] ?? ""} onChange={e => changeEditArray("vehicleRequirements", i, null, key, e.target.value)} /></label>)}{!isIntercartingEdit && ["length", "height", "width"].map(key => <label key={key}><span>{key}</span><input disabled={editRequirementsLocked} value={r.dimensions?.[key] ?? ""} onChange={e => changeEditArray("vehicleRequirements", i, "dimensions", key, e.target.value)} /></label>)}</div></div>)}
        <label className="kam-inline-edit-remarks"><span>Remarks</span><textarea value={editForm.remark ?? ""} onChange={e => setEditForm(prev => ({ ...prev, remark: e.target.value }))} /></label>
      </>}
      {stage === 5 && <>{editForm.allocatedVehicles?.length ? editForm.allocatedVehicles.map((v, i) => <div className="kam-inline-edit-requirement" key={v.allocationId || i}><h4>{v.vehicleNumber || `Vehicle ${i + 1}`}</h4><div className="kam-inline-edit-grid">{[["driver", "name", "Driver Name"], ["driver", "contactNumber", "Driver Contact"], ["escort", "name", "Escort Name"], ["escort", "contactNumber", "Escort Contact"], ["escort", "vehicleNumber", "Escort Vehicle"], ["supervisor", "name", "Supervisor Name"], ["supervisor", "contactNumber", "Supervisor Contact"]].map(([group, key, label]) => <label key={group + key}><span>{label}</span><input value={v[group]?.[key] ?? ""} onChange={e => changeEditArray("allocatedVehicles", i, group, key, e.target.value)} /></label>)}</div></div>) : <p>No allocated vehicles yet.</p>}</>}
      {[2, 3, 4, 6].includes(stage) && <p>Use the existing stage controls below to update this stage. Approval, vendor confirmation, order placement, and completion status are handled by their dedicated workflows.</p>}
    </section>
  );
  const originalVehicleEdit = (index, key, value, nested = false) => {
    const editable = editOpen && !editRequirementsLocked;
    if (!editable) return value;
    const row = editForm.vehicleRequirements?.[index];
    return <input className="kam-original-edit-input kam-original-vehicle-input" value={nested ? (row?.dimensions?.[key] ?? "") : (row?.[key] ?? "")} onChange={e => changeEditArray("vehicleRequirements", index, nested ? "dimensions" : null, key, e.target.value)} />;
  };
  const changeEditNested = (section, key, value) => setEditForm(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  const changeEditArray = (section, index, group, key, value) => setEditForm(prev => ({
    ...prev, [section]: prev[section].map((row, i) => i !== index ? row : group ? { ...row, [group]: { ...row[group], [key]: value } } : { ...row, [key]: value })
  }));
  const saveLifecycleCorrections = async () => {
    if (isCompletedTrip(workingOrder || order)) {
      setEditOpen(false);
      setEditError("Completed trips cannot be edited.");
      return;
    }
    if (!editForm.customer?.trim()) { setEditError("Customer is required."); return; }
    setEditSaving(true); setEditError("");
    try {
      const response = await fetch(`${TRIP_API_URL}/${(workingOrder || order)._id}/lifecycle-corrections`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editForm, ...(isIntercartingEdit ? { origin: undefined, destination: undefined } : {}), siteLocation: undefined, period: undefined, dieselScope: undefined, vehicleRequirements: editRequirementsLocked ? undefined : editForm.vehicleRequirements.map(r => isIntercartingEdit ? { ...r, dimensions: undefined } : r) })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to save changes.");
      const updated = payload.data || payload.trip || payload.order;
      if (!updated) throw new Error("Server did not return the updated order.");
      setLocalOrder(updated);
      if (typeof onOrderUpdated === "function") onOrderUpdated(updated);
      setEditOpen(false);
      showToast("Order changes saved successfully.");
    } catch (error) { setEditError(error.message || "Unable to save changes."); }
    finally { setEditSaving(false); }
  };

  // One footer action saves all modified sections, regardless of the selected stage.
  // Each section retains its existing API contract; only one user click is required.
  const saveAllLifecycleEdits = async (confirmedName) => {
    if (editSaving || poSaving || isCompletedTrip(workingOrder || order)) return;
    const trip = workingOrder || order;
    const updatedBy = String(confirmedName || "").trim();
    if (!updatedBy) { setEditError("Updated By name is required."); return; }
    const correctionsChanged = JSON.stringify(editForm) !== editBaselineRef.current;
    const poChanged = JSON.stringify(poForm) !== poBaselineRef.current || Boolean(poFile);
    if (!correctionsChanged && !poChanged) {
      setEditOpen(false);
      showToast("No changes to save.");
      return;
    }
    if (correctionsChanged && !String(editForm.customer || "").trim()) {
      setEditError("Customer is required.");
      return;
    }
    if (poChanged && (!poForm.poNumber?.trim() || !poForm.poValidityPeriod || !poForm.billingGstin?.trim())) {
      setEditError("Complete PO Number, PO Validity and Billing GSTIN before saving.");
      return;
    }
    setEditSaving(true);
    setEditError("");
    let latest = trip;
    let correctionsSaved = false;
    try {
      if (correctionsChanged) {
        const corrections = {
          ...editForm, updatedBy,
          ...(isIntercartingEdit ? { origin: undefined, destination: undefined } : {}),
          siteLocation: undefined, period: undefined, dieselScope: undefined,
          vehicleRequirements: editRequirementsLocked ? undefined :
            editForm.vehicleRequirements.map(r => isIntercartingEdit ? { ...r, dimensions: undefined } : r),
        };
        const response = await fetch(`${TRIP_API_URL}/${trip._id}/lifecycle-corrections`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corrections),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "Unable to save order corrections.");
        latest = payload.data || payload.trip || payload.order;
        if (!latest?._id) throw new Error("Order corrections were submitted, but the server did not return the updated order.");
        correctionsSaved = true;
        editBaselineRef.current = JSON.stringify(editForm);
        setLocalOrder(latest);
      }
      if (poChanged) {
        const formData = new FormData();
        formData.append("poNumber", poForm.poNumber.trim());
        formData.append("poValidityPeriod", poForm.poValidityPeriod);
        formData.append("billingGstin", poForm.billingGstin.trim().toUpperCase());
        formData.append("status", "Completed");
        formData.append("updatedBy", updatedBy);
        formData.append("documentName", poForm.documentName.trim() || poFile?.name || "PO Document");
        formData.append("uploadedBy", poForm.uploadedBy.trim() || sessionStorage.getItem("kamUsername") || "Key Account");
        if (poFile) formData.append("document", poFile);
        const response = await fetch(`${TRIP_API_URL}/${trip._id}/po-document`, {
          method: "PUT", body: formData,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "Unable to save PO details.");
        latest = payload.data || payload.trip || payload.order;
        if (!latest?._id) throw new Error("PO was submitted, but the server did not return the updated order.");
        poBaselineRef.current = JSON.stringify(poForm);
        setPoFile(null);
      }
      setLocalOrder(latest);
      if (typeof onOrderUpdated === "function") onOrderUpdated(latest);
      setEditOpen(false);
      setConfirmSaveOpen(false);
      setUpdatedByName("");
      showToast("All changes saved successfully.");
    } catch (error) {
      if (correctionsSaved) {
        if (typeof onOrderUpdated === "function") onOrderUpdated(latest);
        setEditError(`Order details were saved, but PO changes failed: ${error.message}. Retry Save Changes.`);
      } else {
        setEditError(error.message || "Unable to save changes.");
      }
    } finally {
      setEditSaving(false);
    }
  };

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

  useEffect(() => {
    if (!initialEdit || latestOrderLoading || !workingOrder || autoEditOpenedRef.current) return;
    autoEditOpenedRef.current = true;
    if (!isCompletedTrip(workingOrder)) openLifecycleEditor();
  }, [initialEdit, latestOrderLoading, workingOrder]);

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
    const status = String(workingOrder?.orderApproval?.status || "")
      .trim()
      .toLowerCase();

    if (status === "rejected") {
      setApprovalRequested(false);
      return;
    }

    setApprovalRequested(
      status === "pending" &&
      Boolean(workingOrder?.orderApproval?.requestedAt)
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

  const orderApprovalStatus = String(order?.orderApproval?.status || "")
    .trim()
    .toLowerCase();

  const orderApprovalRejected = orderApprovalStatus === "rejected";
  const orderApprovalApproved = orderApprovalStatus === "approved";
  const orderApprovalPending =
    orderApprovalStatus === "pending" &&
    Boolean(order?.orderApproval?.requestedAt);

  // Pending/Approved orders are read-only. Rejected orders reopen for editing.
  const finalizationLocked =
    !editOpen && (orderApprovalApproved || orderApprovalPending);

  const poLocked =
    !editOpen && String(order?.poDocument?.status || "")
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

      const updatedQuotations = safeArray(
        updatedOrder?.trafficQuotations
      );

      const updatedRequiredVehicleCount =
        updatedRequirements.reduce(
          (total, requirement) => {
            const quantity = Number(
              requirement?.quantity ??
              requirement?.vehicleQuantity ??
              requirement?.requiredQuantity ??
              requirement?.noOfVehicles ??
              requirement?.numberOfVehicles ??
              0
            );

            return total + (
              Number.isFinite(quantity) && quantity > 0
                ? quantity
                : 0
            );
          },
          0
        );

      const updatedApprovedVehicleCount =
        updatedApprovedConfirmations.reduce(
          (total, confirmation) => {
            const confirmationQuotationId = String(
              confirmation?.quotationId ||
              confirmation?.trafficQuotationId ||
              ""
            ).trim();

            const quotation = updatedQuotations.find((quote) => {
              const quoteId = String(
                quote?.quotationId ||
                quote?._id ||
                quote?.id ||
                ""
              ).trim();

              return (
                quoteId &&
                confirmationQuotationId &&
                quoteId === confirmationQuotationId
              );
            });

            if (!quotation) {
              return total;
            }

            const quantity = Number(
              quotation?.quantity ??
              quotation?.vehicleQuantity ??
              quotation?.approvedQuantity ??
              quotation?.allocatedQuantity ??
              1
            );

            return total + (
              Number.isFinite(quantity) && quantity > 0
                ? quantity
                : 1
            );
          },
          0
        );

      const updatedVehicleApprovalCompleted =
        updatedRequiredVehicleCount > 0 &&
        updatedApprovedVehicleCount >=
        updatedRequiredVehicleCount;

      const hasAtLeastOneConfirmedTransporter =
        safeArray(updatedOrder?.vehicleConfirmations).some(
          (confirmation) =>
            String(confirmation?.status || "")
              .trim()
              .toLowerCase() === "approved"
        );

      if (hasAtLeastOneConfirmedTransporter) {
        // Step 5: Order Placed is available after at least one transporter is confirmed.
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

    const orderApproved =
      String(order?.orderApproval?.status || "")
        .trim()
        .toLowerCase() === "approved";

    if (!orderApproved) {
      const message =
        "Order approval must be completed before placing the order.";
      setPlaceOrderError(message);
      showToast(message, "warning");
      return;
    }

    // Place Order is allowed once at least ONE transporter is confirmed.
    // Actual vehicle allocation happens later in Tracking.
    const confirmedTransporterCount = safeArray(
      order?.vehicleConfirmations
    ).filter(
      (confirmation) =>
        String(confirmation?.status || "")
          .trim()
          .toLowerCase() === "approved"
    ).length;

    if (confirmedTransporterCount < 1) {
      const message =
        "Confirm at least one transporter before placing the order.";
      setPlaceOrderError(message);
      showToast(message, "warning");
      return;
    }

    if (hasPendingTransportReplacement(order)) {
      const message =
        "Transport replacement approval is pending. Complete the replacement approval before placing the order.";
      setPlaceOrderError(message);
      showToast(message, "warning");
      return;
    }

    /*
     * IMPORTANT:
     * Place Order requires at least one confirmed transporter.
     * All remaining transporter confirmations may be completed later.
     * Actual vehicle allocation happens after Order Placed, in Tracking.
     */
    try {
      setPlaceOrderSaving(true);
      setPlaceOrderError("");
      setPlaceOrderMessage("");

      const placedBy =
        sessionStorage.getItem("kamUsername") || "Key Account";

      const body = {
        stage: "Tracking",
        status: "Tracking",
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

      // Keep this modal synced with the fresh backend response.
      setLocalOrder(updatedOrder);

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

    if (requestApproval) {
      const quotedRate = String(finalizationForm.quotedRate ?? "").trim();
      const finalRate = String(finalizationForm.finalRate ?? "").trim();
      const commercialTerms = String(finalizationForm.commercialTerms ?? "").trim();
      const deliveryCommitments = String(finalizationForm.deliveryCommitments ?? "").trim();

      if (!quotedRate || !finalRate || !commercialTerms || !deliveryCommitments) {
        const message =
          "Complete Quoted Rate, Final Rate, Commercial Terms & Payment SLAs, and Delivery Commitments & Transit SLAs before requesting approval.";
        setFinalizationError(message);
        showToast(message, "warning");
        return;
      }
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

  const handleStepClick = (index) => {
    // Trip Complete can never be opened from a stale backend stage/status.
    // It is available only when buildLifecycle() has independently validated
    // every prerequisite and every required vehicle unloading.
    if (
      index === 6 &&
      String(lifecycle.find((step) => step.key === "trip-complete")?.status || "")
        .trim()
        .toLowerCase() !== "completed"
    ) {
      return;
    }

    const orderApproved =
      String(order?.orderApproval?.status || "")
        .trim()
        .toLowerCase() === "approved";

    const orderPlacedCompleted =
      String(order?.orderPlaced?.status || "")
        .trim()
        .toLowerCase() === "completed" ||
      String(order?.stage || "")
        .trim()
        .toLowerCase() === "tracking" ||
      currentLifecycleIndex >= 5;

    const canOpenOptionalOrOrderPlaced =
      orderApproved &&
      (index === 2 || index === 3 || index === 4);

    const canOpenTracking =
      orderPlacedCompleted && index === 5;

    if (
      index <= currentLifecycleIndex ||
      canOpenOptionalOrOrderPlaced ||
      canOpenTracking
    ) {
      setActiveStepIndex(index);
    }
  };

  /* Derived order collections used by lifecycle logic */
  const requirements = safeArray(order?.vehicleRequirements);

  // Keep ALL confirmations because Vendor Finalization needs to match
  // every quotation with its Approved / Rejected / Pending confirmation.
  const confirmations = safeArray(order?.vehicleConfirmations);

  const approvedConfirmations = confirmations.filter(
    (confirmation) =>
      String(confirmation?.status || "")
        .trim()
        .toLowerCase() === "approved"
  );

  const allocations = safeArray(order?.allocatedVehicles);

  // Traffic quotations used by Vendor Finalization.
  const quotations = safeArray(order?.trafficQuotations);

  // Transport replacement requests used by Vendor Finalization history.
  const replacementRequests = safeArray(
    order?.transportReplacementRequests
  );

  const normalizeText = (value) =>
    String(value ?? "").trim();

  const normalizeLower = (value) =>
    normalizeText(value).toLowerCase();

  const getReplacementRequirementKey = (item) =>
    normalizeText(
      item?.requirementId ||
      item?.vehicleRequirementId ||
      item?.requirement?.requirementId ||
      item?.requirement?.id ||
      item?.requirement?._id ||
      ""
    );

  const getReplacementRequestsForRequirement = (requirementId) =>
    replacementRequests
      .filter(
        (item) =>
          getReplacementRequirementKey(item) ===
          normalizeText(requirementId)
      )
      .sort((a, b) => {
        const aDate = new Date(
          a?.requestedAt ||
          a?.createdAt ||
          a?.updatedAt ||
          0
        ).getTime();

        const bDate = new Date(
          b?.requestedAt ||
          b?.createdAt ||
          b?.updatedAt ||
          0
        ).getTime();

        return aDate - bDate;
      });

  const findConfirmationForRequirement = (requirementId) => {
    const requirementKey = normalizeText(requirementId);

    const matches = confirmations.filter(
      (confirmation) =>
        normalizeText(
          confirmation?.requirementId ||
          confirmation?.vehicleRequirementId
        ) === requirementKey
    );

    if (!matches.length) {
      return null;
    }

    const approved = [...matches]
      .reverse()
      .find(
        (confirmation) =>
          normalizeLower(confirmation?.status) === "approved"
      );

    return approved || matches[matches.length - 1];
  };

  const findQuotationForConfirmation = (
    confirmation,
    requirementId
  ) => {
    if (!confirmation) {
      return null;
    }

    const confirmationQuotationId = normalizeText(
      confirmation?.quotationId ||
      confirmation?.trafficQuotationId
    );

    const directMatch = quotations.find(
      (quotation) =>
        normalizeText(
          quotation?.quotationId ||
          quotation?.trafficQuotationId ||
          quotation?._id ||
          quotation?.id
        ) === confirmationQuotationId
    );

    if (directMatch) {
      return directMatch;
    }

    return quotations.find(
      (quotation) =>
        normalizeText(
          quotation?.requirementId ||
          quotation?.vehicleRequirementId
        ) === normalizeText(requirementId) &&
        normalizeLower(quotation?.status) !== "rejected"
    ) || null;
  };

  const getReplacementOldTransporter = (item, fallback = "—") =>
    normalizeText(
      item?.previousTransporter ||
      item?.previousTransportName ||
      item?.oldTransporter ||
      item?.oldTransportName ||
      item?.currentTransporter ||
      item?.currentTransportName ||
      item?.fromTransporter ||
      item?.fromTransportName
    ) || fallback;

  const getReplacementNewTransporter = (item) =>
    normalizeText(
      item?.proposedTransporter ||
      item?.proposedTransportName ||
      item?.replacementTransporter ||
      item?.replacementTransportName ||
      item?.newTransporter ||
      item?.newTransportName ||
      item?.selectedTransporter ||
      item?.selectedTransport ||
      item?.toTransporter ||
      item?.toTransportName
    ) || "—";

  const getReplacementOldAmount = (item, fallback) => {
    const value =
      item?.previousAmount ??
      item?.oldAmount ??
      item?.previousQuotedAmount ??
      item?.currentAmount ??
      item?.fromAmount ??
      fallback;

    return value;
  };

  const getReplacementNewAmount = (item) =>
    item?.proposedAmount ??
    item?.replacementAmount ??
    item?.newAmount ??
    item?.quotedAmount ??
    item?.approvedAmount ??
    item?.selectedAmount ??
    item?.toAmount ??
    null;

  const getVehicleVendorStatus = (
    requirementId,
    confirmation
  ) => {
    const history =
      getReplacementRequestsForRequirement(
        requirementId
      );

    const latestReplacement =
      history.length > 0
        ? history[history.length - 1]
        : null;

    const replacementStatus = normalizeLower(
      latestReplacement?.status
    );

    if (replacementStatus === "pending") {
      return {
        label: "Replacement Pending",
        className: "replacement-pending",
      };
    }

    if (
      replacementStatus === "approved" ||
      replacementStatus === "completed" ||
      replacementStatus === "replaced"
    ) {
      return {
        label: "Replaced",
        className: "replaced",
      };
    }

    if (
      normalizeLower(confirmation?.status) === "approved"
    ) {
      return {
        label: "Approved",
        className: "approved",
      };
    }

    return {
      label: "Approval Pending",
      className: "approval-pending",
    };
  };

  // IMPORTANT:
  // Total order quantity is still the original enquiry requirement quantity.
  const totalRequiredVehicles = requirements.reduce(
    (total, requirement) =>
      total +
      Math.max(
        Number(
          requirement?.quantity ??
          requirement?.vehicleQuantity ??
          requirement?.requiredQuantity ??
          requirement?.noOfVehicles ??
          requirement?.numberOfVehicles ??
          0
        ) || 0,
        0
      ),
    0
  );

  /*
   * QUOTATION VEHICLE STATUS
   * Pending here means vehicles whose requirement quantity is not yet
   * covered by an APPROVED vehicle confirmation/quotation.
   */
  const getRequirementQuantity = (requirement) => {
    const value =
      requirement?.quantity ??
      requirement?.vehicleQuantity ??
      requirement?.requiredQuantity ??
      requirement?.noOfVehicles ??
      requirement?.numberOfVehicles ??
      1;

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  const getRequirementKey = (item) =>
    String(
      item?.requirementId ||
      item?.vehicleRequirementId ||
      item?.requirement?.id ||
      item?.requirement?._id ||
      item?.id ||
      item?._id ||
      ""
    ).trim();

  const getQuotationKey = (item) =>
    String(
      item?.quotationId ||
      item?.trafficQuotationId ||
      item?._id ||
      item?.id ||
      ""
    ).trim();

  const getApprovedQuotationQuantity = (confirmation) => {
    const status = String(confirmation?.status || "")
      .trim()
      .toLowerCase();

    if (status !== "approved") {
      return 0;
    }

    const confirmationQuotationKey = getQuotationKey(confirmation);

    const quotation = quotations.find((quote) => {
      const quoteKey = getQuotationKey(quote);

      if (
        quoteKey &&
        confirmationQuotationKey &&
        quoteKey === confirmationQuotationKey
      ) {
        return true;
      }

      return (
        getRequirementKey(quote) &&
        getRequirementKey(quote) === getRequirementKey(confirmation) &&
        String(quote?.transporter || "").trim().toLowerCase() ===
        String(
          confirmation?.transporter ||
          confirmation?.transportProvider ||
          ""
        ).trim().toLowerCase()
      );
    });

    if (!quotation) {
      return 0;
    }

    const quantity = Number(
      quotation?.quantity ??
      quotation?.vehicleQuantity ??
      quotation?.approvedQuantity ??
      quotation?.allocatedQuantity ??
      1
    );

    return Number.isFinite(quantity) && quantity > 0
      ? quantity
      : 1;
  };

  const approvedQuotationVehicleCount =
    approvedConfirmations.reduce(
      (total, confirmation) =>
        total + getApprovedQuotationQuantity(confirmation),
      0
    );

  const quotationPendingVehicleCount = Math.max(
    totalRequiredVehicles - approvedQuotationVehicleCount,
    0
  );

  /*
   * TRACKING CAPACITY
   * Tracking must use only Approved confirmation + Approved quotation quantity.
   * Unconfirmed requirement quantity must never become allocatable.
   */
  const approvedTrackingRows = approvedConfirmations
    .map((confirmation) => {
      const confirmationQuotationKey =
        getQuotationKey(confirmation);

      const quotation = quotations.find(
        (quote) =>
          getQuotationKey(quote) &&
          getQuotationKey(quote) ===
          confirmationQuotationKey
      );

      if (!quotation) {
        return null;
      }

      const approvedQuantity = Number(
        quotation?.quantity ??
        quotation?.vehicleQuantity ??
        quotation?.approvedQuantity ??
        quotation?.allocatedQuantity ??
        0
      );

      if (
        !Number.isFinite(approvedQuantity) ||
        approvedQuantity <= 0
      ) {
        return null;
      }

      return {
        confirmation,
        quotation,
        requirementId:
          confirmation?.requirementId ||
          quotation?.requirementId ||
          "",
        approvedQuantity,
      };
    })
    .filter(Boolean);

  const approvedTrackingVehicleCount =
    approvedTrackingRows.reduce(
      (total, item) =>
        total + item.approvedQuantity,
      0
    );

  /*
   * VALID TRACKING ALLOCATIONS
   *
   * Allocation records created by older/newer Tracking screens do not always
   * contain quotationId or confirmationId. requirementId is the stable link.
   *
   * Therefore:
   * 1. Only requirements having an APPROVED transporter are allowed.
   * 2. Match allocations primarily by requirementId.
   * 3. Respect the approved quantity for each requirement.
   * 4. Do not count the same allocation twice.
   *
   * Example:
   * Hydraulic Axle Trailer approved quantity = 2
   * Two actual vehicles allocated against that requirement => 2 / 2.
   */
  const validTrackingAllocations = [];
  const usedAllocationKeys = new Set();

  const getAllocationKey = (allocation, index = 0) =>
    String(
      allocation?.allocationId ||
      allocation?._id ||
      allocation?.vehicleNumber ||
      `${allocation?.requirementId || "REQ"}-${index}`
    ).trim();

  approvedTrackingRows.forEach((item) => {
    const approvedRequirementId = String(
      item?.requirementId || ""
    ).trim();

    if (!approvedRequirementId) {
      return;
    }

    const matches = allocations.filter((allocation) => {
      const allocationRequirementId = String(
        allocation?.requirementId ||
        allocation?.vehicleRequirementId ||
        ""
      ).trim();

      return (
        allocationRequirementId &&
        allocationRequirementId === approvedRequirementId
      );
    });

    let acceptedForRequirement = 0;

    matches.forEach((allocation, allocationIndex) => {
      if (acceptedForRequirement >= item.approvedQuantity) {
        return;
      }

      const allocationKey = getAllocationKey(
        allocation,
        allocationIndex
      );

      if (usedAllocationKeys.has(allocationKey)) {
        return;
      }

      usedAllocationKeys.add(allocationKey);
      validTrackingAllocations.push(allocation);
      acceptedForRequirement += 1;
    });
  });

  const totalAllocatedVehicles = validTrackingAllocations.length;

  const pendingVehicleCount = Math.max(
    approvedTrackingVehicleCount - totalAllocatedVehicles,
    0
  );

  /*
   * Requirement-wise allocation count.
   * Used by the Tracking pending table so a requirement with quantity 2
   * correctly becomes 0 / 2, 1 / 2, then 2 / 2.
   */
  const getAllocatedQuantityForRequirement = (requirementId) => {
    const key = String(requirementId || "").trim();

    return validTrackingAllocations.filter(
      (allocation) =>
        String(
          allocation?.requirementId ||
          allocation?.vehicleRequirementId ||
          ""
        ).trim() === key
    ).length;
  };

  /* =========================================================
     VEHICLE APPROVAL COMPLETED

     Every vehicle requirement must have one approved
     transporter quotation. Rejected balance quotations
     do not block Vendor Finalization.
  ========================================================= */

  const vehicleApprovalCompleted =
    totalRequiredVehicles > 0 &&
    approvedQuotationVehicleCount >= totalRequiredVehicles;

  const displayCurrentStage = (() => {
    if (currentLifecycleIndex >= 6) {
      return "Trip Complete";
    }

    if (currentLifecycleIndex >= 5) {
      return "Tracking";
    }

    if (currentLifecycleIndex >= 4) {
      return "Order Placed";
    }

    return (
      lifecycle?.[currentLifecycleIndex]?.title ||
      order?.stage ||
      "Enquiry Details"
    );
  })();

  return (
    <div
      className="kam-workflow-modal-overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className={`kam-workflow-modal ${isCompletedTrip(order) ? "kam-trip-readonly" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Order lifecycle ${order.tripId || ""
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

                const optionalPending =
                  (
                    step.key === "po-document" ||
                    step.key === "vendor-finalization"
                  ) &&
                  statusClass === "pending" &&
                  String(order?.orderApproval?.status || "")
                    .trim()
                    .toLowerCase() === "approved";

                const isCurrent =
                  index === activeStepIndex;

                // A step is completed only when its own calculated lifecycle
                // status says Completed/Approved. Never mark earlier steps complete
                // only because a later page was selected or because MongoDB contains
                // a stale stage value.
                const completed =
                  !rejected &&
                  !optionalPending &&
                  (statusClass === "approved");

                return (
                  <React.Fragment
                    key={step.key}
                  >

                    {index > 0 && (
                      <span
                        className={`kam-top-step-line ${lifecycle
                          .slice(0, index)
                          .every((previousStep) =>
                            String(previousStep?.status || "")
                              .trim()
                              .toLowerCase() === "completed"
                          )
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
                        const tripCompleteValidated =
                          String(
                            lifecycle.find((item) => item.key === "trip-complete")?.status || ""
                          )
                            .trim()
                            .toLowerCase() === "completed";

                        if (index === 6 && !tripCompleteValidated) {
                          return true;
                        }

                        const orderApproved =
                          String(order?.orderApproval?.status || "")
                            .trim()
                            .toLowerCase() === "approved";

                        const orderPlacedCompleted =
                          String(order?.orderPlaced?.status || "")
                            .trim()
                            .toLowerCase() === "completed" ||
                          String(order?.stage || "")
                            .trim()
                            .toLowerCase() === "tracking" ||
                          currentLifecycleIndex >= 5;

                        const canOpenOptionalOrOrderPlaced =
                          orderApproved &&
                          (
                            index === 2 ||
                            index === 3 ||
                            index === 4
                          );

                        const canOpenTracking =
                          orderPlacedCompleted &&
                          index === 5;

                        return !(
                          index <= currentLifecycleIndex ||
                          canOpenOptionalOrOrderPlaced ||
                          canOpenTracking
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

                        optionalPending
                          ? "warning"
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
                        ) : rejected || optionalPending ? (
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
          {editOpen && editError && <p className="kam-inline-edit-error" role="alert">{editError}</p>}

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
                        {editOpen ? "EDITING" : "READ ONLY"}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="kam-client-trip-grid">

                  <ReadOnlyField
                    label="Customer"
                    editing={editOpen} fieldKey="customer" inputValue={editForm.customer} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
                    value={
                      order.customer
                    }
                  />

                  <ReadOnlyField
                    label="Contact Person"
                    editing={editOpen} fieldKey="contactPerson" inputValue={editForm.contactPerson} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
                    value={
                      order.contactPerson
                    }
                  />

                  <ReadOnlyField
                    label="Contact Number"
                    editing={editOpen} fieldKey="contactNumber" inputValue={editForm.contactNumber} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
                    value={
                      order.contactNumber
                    }
                  />

                  <ReadOnlyField
                    label="Email"
                    editing={editOpen} fieldKey="email" inputValue={editForm.email} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
                    value={
                      order.email
                    }
                  />

                  <ReadOnlyField
                    label="Assigned KAM"
                    editing={editOpen} fieldKey="assignedKam" inputValue={editForm.assignedKam} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
                    value={
                      order.assignedKam
                    }
                  />

                  <ReadOnlyField
                    label="Material Type"
                    editing={editOpen} fieldKey="materialType" inputValue={editForm.materialType} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
                    value={
                      order.materialType
                    }
                  />

                  <ReadOnlyField
                    label="Total Vehicles"
                    editing={editOpen} fieldKey="totalVehicles" inputValue={editForm.totalVehicles} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
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
                    editing={editOpen} fieldKey="origin" inputValue={editForm.origin} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
                    value={
                      order.origin
                    }
                  />

                  <ReadOnlyField
                    label="Destination"
                    editing={editOpen} fieldKey="destination" inputValue={editForm.destination} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
                    value={
                      order.destination
                    }
                  />

                  <ReadOnlyField
                    label="Distance"
                    editing={editOpen} fieldKey="distance" inputValue={editForm.distance} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
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
                    editing={editOpen} fieldKey="enquiryDate" inputValue={editForm.enquiryDate} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
                    value={formatDate(
                      order.enquiryDate
                    )}
                  />

                  <ReadOnlyField
                    label="Placement Date"
                    editing={editOpen} fieldKey="placementDate" inputValue={editForm.placementDate} onEdit={(key, value) => setEditForm(prev => ({ ...prev, [key]: value }))}
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

                {(order.remark || editOpen) && (
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
                        {editOpen ? <textarea className="kam-original-edit-textarea" value={editForm.remark ?? ""} onChange={e => setEditForm(prev => ({...prev, remark: e.target.value}))} /> : order.remark}
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
                                  {originalVehicleEdit(index, "vehicleType", requirement.vehicleType || "—")}
                                </strong>
                              </td>

                              <td>
                                {originalVehicleEdit(index, "configuration", requirement.configuration || "—")}
                              </td>

                              <td>
                                {editOpen && !editRequirementsLocked ? originalVehicleEdit(index, "classification", requirement.classification || "—") : requirement.classification ? (
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
                                {originalVehicleEdit(index, "quantity", formatNumber(requirement.quantity, " NOS"))}
                              </td>

                              <td>
                                {originalVehicleEdit(index, "weight", formatNumber(requirement.weight, " TON"))}
                              </td>

                              <td>
                                {editOpen && !editRequirementsLocked ? <div className="kam-original-dimensions">{["length", "height", "width"].map(key => <label key={key}>{key[0].toUpperCase()}{originalVehicleEdit(index, key, "", true)}</label>)}</div> : formatDimensions(requirement.dimensions)}
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

                {orderApprovalRejected && (
                  <div
                    className="kam-finalization-error"
                    style={{
                      display: "block",
                      marginBottom: "14px",
                      padding: "12px 14px",
                      border: "1px solid #fecaca",
                      borderLeft: "4px solid #dc2626",
                      borderRadius: "8px",
                      background: "#fff7f7",
                      color: "#991b1b",
                      lineHeight: 1.45,
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: "3px" }}>
                      Approval Rejected - Edit and Resubmit
                    </strong>
                    <span>
                      {order?.orderApproval?.remarks ||
                        order?.orderApproval?.rejectionRemarks ||
                        order?.orderApproval?.comments ||
                        "Please update the required details and request approval again."}
                    </span>
                  </div>
                )}

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
                        (editOpen ? editForm.orderFinalization?.quotedRate : finalizationForm.quotedRate)
                      }
                      onChange={
                        editOpen ? (event) => changeEditNested("orderFinalization", event.target.name, event.target.value) : handleFinalizationChange
                      }
                      placeholder="Enter quoted rate"
                      disabled={editOpen ? false : finalizationLocked}
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
                        (editOpen ? editForm.orderFinalization?.finalRate : finalizationForm.finalRate)
                      }
                      onChange={
                        editOpen ? (event) => changeEditNested("orderFinalization", event.target.name, event.target.value) : handleFinalizationChange
                      }
                      placeholder="Enter final rate"
                      disabled={editOpen ? false : finalizationLocked}
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
                        (editOpen ? editForm.orderFinalization?.commercialTerms : finalizationForm.commercialTerms)
                      }
                      onChange={
                        editOpen ? (event) => changeEditNested("orderFinalization", event.target.name, event.target.value) : handleFinalizationChange
                      }
                      placeholder="Enter commercial terms and payment SLAs"
                      rows={3}
                      disabled={editOpen ? false : finalizationLocked}
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
                        (editOpen ? editForm.orderFinalization?.deliveryCommitments : finalizationForm.deliveryCommitments)
                      }
                      onChange={
                        editOpen ? (event) => changeEditNested("orderFinalization", event.target.name, event.target.value) : handleFinalizationChange
                      }
                      placeholder="Enter delivery commitments and transit SLAs"
                      rows={3}
                      disabled={editOpen ? false : finalizationLocked}
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
                        (editOpen ? editForm.orderFinalization?.clientConfirmationNotes : finalizationForm.clientConfirmationNotes)
                      }
                      onChange={
                        editOpen ? (event) => changeEditNested("orderFinalization", event.target.name, event.target.value) : handleFinalizationChange
                      }
                      placeholder="Enter client confirmation notes"
                      rows={3}
                      disabled={editOpen ? false : finalizationLocked}
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

                </div>

              </section>

            </div>
          )}

          {/* =================================================
              VENDOR FINALIZATION
              CONFIRMED TRANSPORTERS + QUOTATION VEHICLE STATUS
          ================================================= */}

          {activeStepIndex === 3 && (
            <>
              {quotationPendingVehicleCount > 0 && (
                <div className="kam-optional-commercial-warning kam-vendor-warning">
                  <strong>⚠ Optional items pending</strong>
                  <span>Vendor Finalization</span>
                  <small>
                    {quotationPendingVehicleCount} vehicle
                    {quotationPendingVehicleCount > 1 ? "s are" : " is"} still
                    pending transporter confirmation. You can place the order and
                    start tracking. These items can be completed later.
                  </small>
                </div>
              )}

              {/* =================================================
                  CONFIRMED TRANSPORTERS
              ================================================= */}

              <div className="kam-step-page kam-step-page-confirmed-transporters">

                <section className="kam-client-vehicle-section">

                  <SectionHeading
                    title="Confirmed Transporters"
                    description="Approved transporter quotation for each vehicle requirement."
                    count={
                      requirements.length
                    }
                  />

                  {requirements.length > 0 ? (
                    <div className="kam-client-vehicle-table-wrap">
                      <table className="kam-client-vehicle-table kam-vendor-history-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Vehicle Requirement</th>
                            <th>Current Transporter</th>
                            <th>Current Amount</th>
                            <th>Status</th>
                            <th>Confirmed By</th>
                            <th>Confirmed At</th>
                            <th>Replacement History</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requirements.map((requirement, index) => {
                            const requirementId =
                              requirement?.requirementId ||
                              requirement?._id ||
                              requirement?.id ||
                              "";

                            const confirmation =
                              findConfirmationForRequirement(
                                requirementId
                              );

                            const quotation =
                              findQuotationForConfirmation(
                                confirmation,
                                requirementId
                              );

                            const history =
                              getReplacementRequestsForRequirement(
                                requirementId
                              );

                            const latestReplacement =
                              history.length > 0
                                ? history[history.length - 1]
                                : null;

                            const latestReplacementStatus =
                              normalizeLower(
                                latestReplacement?.status
                              );

                            const currentTransporter =
                              latestReplacement &&
                                (
                                  latestReplacementStatus === "approved" ||
                                  latestReplacementStatus === "completed" ||
                                  latestReplacementStatus === "replaced"
                                )
                                ? getReplacementNewTransporter(
                                  latestReplacement
                                )
                                : quotation?.transporter ||
                                confirmation?.transporter ||
                                confirmation?.transportProvider ||
                                "—";

                            const currentAmount =
                              latestReplacement &&
                                (
                                  latestReplacementStatus === "approved" ||
                                  latestReplacementStatus === "completed" ||
                                  latestReplacementStatus === "replaced"
                                )
                                ? getReplacementNewAmount(
                                  latestReplacement
                                ) ??
                                quotation?.amount
                                : quotation?.amount ??
                                confirmation?.amount ??
                                confirmation?.confirmedAmount;

                            const vehicleStatus =
                              getVehicleVendorStatus(
                                requirementId,
                                confirmation
                              );

                            return (
                              <tr
                                key={
                                  requirementId ||
                                  `vendor-row-${index}`
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
                                      requirementId ||
                                      "—"}
                                  </strong>
                                  {requirement?.configuration && (
                                    <small className="kam-vendor-config">
                                      {requirement.configuration}
                                    </small>
                                  )}
                                </td>
                                <td>
                                  <strong>
                                    {currentTransporter}
                                  </strong>
                                </td>
                                <td>
                                  <strong className="kam-vendor-current-amount">
                                    {formatAmount(currentAmount)}
                                  </strong>
                                </td>
                                <td>
                                  <span
                                    className={`kam-vehicle-vendor-status ${vehicleStatus.className}`}
                                  >
                                    <span className="kam-vehicle-vendor-status-dot" />
                                    {vehicleStatus.label}
                                  </span>
                                </td>
                                <td>
                                  {confirmation?.confirmedBy || "—"}
                                </td>
                                <td>
                                  {formatDateTime(
                                    confirmation?.confirmedAt
                                  )}
                                </td>
                                <td>
                                  {history.length > 0 ? (
                                    <div className="kam-replacement-history">
                                      {history.map(
                                        (
                                          item,
                                          historyIndex
                                        ) => {
                                          const historyStatus =
                                            normalizeLower(
                                              item?.status
                                            );

                                          const previousItem =
                                            historyIndex > 0
                                              ? history[
                                              historyIndex - 1
                                              ]
                                              : null;

                                          const previousNewTransporter =
                                            previousItem
                                              ? getReplacementNewTransporter(
                                                previousItem
                                              )
                                              : currentTransporter;

                                          const previousNewAmount =
                                            previousItem
                                              ? getReplacementNewAmount(
                                                previousItem
                                              )
                                              : currentAmount;

                                          const oldTransporter =
                                            getReplacementOldTransporter(
                                              item,
                                              previousNewTransporter
                                            );

                                          const newTransporter =
                                            getReplacementNewTransporter(
                                              item
                                            );

                                          const oldAmount =
                                            getReplacementOldAmount(
                                              item,
                                              previousNewAmount
                                            );

                                          const newAmount =
                                            getReplacementNewAmount(
                                              item
                                            );

                                          const historyLabel =
                                            historyStatus === "approved" ||
                                              historyStatus === "completed" ||
                                              historyStatus === "replaced"
                                              ? "Replaced"
                                              : historyStatus === "rejected"
                                                ? "Rejected"
                                                : "Pending";

                                          const historyClass =
                                            historyStatus === "approved" ||
                                              historyStatus === "completed" ||
                                              historyStatus === "replaced"
                                              ? "replaced"
                                              : historyStatus === "rejected"
                                                ? "rejected"
                                                : "pending";

                                          return (
                                            <div
                                              className={`kam-replacement-timeline-item ${historyClass}`}
                                              key={
                                                item?._id ||
                                                item?.requestId ||
                                                `${requirementId}-replacement-${historyIndex}`
                                              }
                                            >
                                              <div className="kam-replacement-timeline-rail">
                                                <span className="kam-replacement-timeline-dot">
                                                  {historyClass === "replaced"
                                                    ? "✓"
                                                    : historyClass === "rejected"
                                                      ? "×"
                                                      : ""}
                                                </span>
                                                {historyIndex < history.length - 1 && (
                                                  <span className="kam-replacement-timeline-line" />
                                                )}
                                              </div>
                                              <div className="kam-replacement-timeline-content">
                                                <div className="kam-replacement-timeline-route">
                                                  <div className="kam-replacement-timeline-party old">
                                                    <strong title={oldTransporter}>
                                                      {oldTransporter}
                                                    </strong>
                                                    <span>{formatAmount(oldAmount)}</span>
                                                  </div>
                                                  <span className="kam-replacement-timeline-arrow">
                                                    →
                                                  </span>
                                                  <div className="kam-replacement-timeline-party current">
                                                    <strong title={newTransporter}>
                                                      {newTransporter}
                                                    </strong>
                                                    <span>{formatAmount(newAmount)}</span>
                                                  </div>
                                                </div>
                                                <div className="kam-replacement-timeline-meta">
                                                  <span className={`kam-replacement-timeline-state ${historyClass}`}>
                                                    {historyLabel}
                                                  </span>
                                                  <time>
                                                    {formatDateTime(
                                                      item?.approvedAt ||
                                                      item?.replacedAt ||
                                                      item?.requestedAt ||
                                                      item?.updatedAt ||
                                                      item?.createdAt
                                                    )}
                                                  </time>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  ) : (
                                    <span className="kam-no-replacement-history">
                                      —
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="kam-lifecycle-empty">
                      No vehicle requirements are available.
                    </div>
                  )}

                </section>

              </div>

              {/* =================================================
                  QUOTATION VEHICLE STATUS
              ================================================= */}

              <div className="kam-step-page kam-step-page-pending-vehicles">

                <section className="kam-client-vehicle-section">

                  <SectionHeading
                    title="Quotation Vehicle Status"
                    description="Required, quotation confirmed and quotation pending vehicles for this order."
                    count={quotationPendingVehicleCount}
                  />

                  <div className="kam-client-vehicle-table-wrap">

                    <table className="kam-client-vehicle-table">

                      <thead>
                        <tr>
                          <th>Required Vehicles</th>
                          <th>Quotation Confirmed</th>
                          <th>Quotation Pending</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr>
                          <td>
                            <strong>{totalRequiredVehicles}</strong>
                          </td>

                          <td>
                            <strong>{approvedQuotationVehicleCount}</strong>
                          </td>

                          <td>
                            <strong
                              style={{
                                color:
                                  quotationPendingVehicleCount > 0
                                    ? "#b77900"
                                    : "#0d8f87",
                              }}
                            >
                              {quotationPendingVehicleCount}
                            </strong>
                          </td>

                          <td>
                            {hasPendingTransportReplacement(order) ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 10px",
                                  border: "1px solid #f0c56a",
                                  borderRadius: "999px",
                                  background: "#fff7e2",
                                  color: "#9a6200",
                                  fontSize: "10px",
                                  fontWeight: 900,
                                }}
                              >
                                ⚠ Replacement Pending
                              </span>
                            ) : quotationPendingVehicleCount > 0 ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 10px",
                                  border: "1px solid #f0c56a",
                                  borderRadius: "999px",
                                  background: "#fff7e2",
                                  color: "#9a6200",
                                  fontSize: "10px",
                                  fontWeight: 900,
                                }}
                              >
                                ⚠ {quotationPendingVehicleCount} Pending
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 10px",
                                  border: "1px solid #b9ddd8",
                                  borderRadius: "999px",
                                  background: "#eefaf8",
                                  color: "#08776f",
                                  fontSize: "10px",
                                  fontWeight: 900,
                                }}
                              >
                                ✓ Quotation Complete
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>

                    </table>

                  </div>

                  {(quotationPendingVehicleCount > 0 ||
                    hasPendingTransportReplacement(order)) && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "10px 12px",
                          border: "1px solid #f0c56a",
                          borderLeft: "4px solid #e5a62f",
                          borderRadius: "8px",
                          background: "#fff8e8",
                          color: "#8a5a00",
                          fontSize: "10px",
                          fontWeight: 700,
                          lineHeight: 1.5,
                        }}
                      >
                        {hasPendingTransportReplacement(order)
                          ? "⚠ Transport replacement approval pending"
                          : `⚠ ${quotationPendingVehicleCount} vehicle${quotationPendingVehicleCount === 1 ? "" : "s"
                          } pending`}
                        quotation/finalization. Order Placed and Tracking can still
                        continue.
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
                {(
                  !isPoDocumentComplete(order) ||
                  getStatusClass(lifecycle?.[3]?.status) === "pending"
                ) && (
                    <div className="kam-optional-commercial-warning">
                      <strong>⚠ Optional items pending</strong>
                      <span>
                        {!isPoDocumentComplete(order) && "PO Document"}
                        {!isPoDocumentComplete(order) &&
                          getStatusClass(lifecycle?.[3]?.status) === "pending" &&
                          " • "}
                        {getStatusClass(lifecycle?.[3]?.status) === "pending" &&
                          "Vendor Finalization"}
                      </span>
                      <small>
                        You can place the order and start tracking. These items can be completed later.
                      </small>
                    </div>
                  )}

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
                    {hasPendingTransportReplacement(order)
                      ? "Replacement Pending"
                      : "Ready to Place"}
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
                                <strong>
                                  {formatNumber(
                                    quotation?.quantity ??
                                    quotation?.vehicleQuantity ??
                                    1
                                  )}
                                </strong>
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
              TRACKING - ALLOCATED + PENDING VEHICLES
          ================================================= */}

          {activeStepIndex === 5 && (
            <div className="kam-step-page kam-step-page-allocated-vehicles">

              {/* TRACKING ALLOCATION SUMMARY */}
              <section className="kam-client-vehicle-section">
                <SectionHeading
                  title="Vehicle Allocation Status"
                  description="Allocated and allocation-pending vehicles for this trip."
                  count={approvedTrackingVehicleCount}
                />

                <div className="kam-client-vehicle-table-wrap">
                  <table className="kam-client-vehicle-table">
                    <thead>
                      <tr>
                        <th>Required Vehicles</th>
                        <th>Allocated Vehicles</th>
                        <th>Allocation Pending</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td>
                          <strong>{approvedTrackingVehicleCount}</strong>
                        </td>

                        <td>
                          <strong style={{ color: "#08776f" }}>
                            {totalAllocatedVehicles}
                          </strong>
                        </td>

                        <td>
                          <strong
                            style={{
                              color:
                                pendingVehicleCount > 0
                                  ? "#b77900"
                                  : "#08776f",
                            }}
                          >
                            {pendingVehicleCount}
                          </strong>
                        </td>

                        <td>
                          {pendingVehicleCount > 0 ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 10px",
                                border: "1px solid #f0c56a",
                                borderRadius: "999px",
                                background: "#fff7e2",
                                color: "#9a6200",
                                fontSize: "10px",
                                fontWeight: 900,
                              }}
                            >
                              ⚠ {pendingVehicleCount} Pending
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 10px",
                                border: "1px solid #b9ddd8",
                                borderRadius: "999px",
                                background: "#eefaf8",
                                color: "#08776f",
                                fontSize: "10px",
                                fontWeight: 900,
                              }}
                            >
                              ✓ Fully Allocated
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ALLOCATED VEHICLES */}
              <section className="kam-client-vehicle-section">
                <SectionHeading
                  title="Allocated Vehicles"
                  description="Actual vehicles allocated and managed by the Tracking team."
                  count={totalAllocatedVehicles}
                />

                {validTrackingAllocations.length > 0 ? (
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
                        {validTrackingAllocations.map((allocation, index) => {
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
                          const vehicleStatus =
                            latest?.status ||
                            allocation?.status ||
                            "Idle";

                          return (
                            <tr key={allocation.allocationId || index}>
                              <td>
                                <span className="kam-client-row-no">
                                  {index + 1}
                                </span>
                              </td>

                              <td>
                                <div className="kam-simple-vehicle-number">
                                  <strong>
                                    {allocation.vehicleNumber || "—"}
                                  </strong>

                                  {safeArray(allocation.replacementHistory).length > 0 && (() => {
                                    const history = safeArray(
                                      allocation.replacementHistory
                                    );

                                    const vehicleChain = [
                                      history[0]?.oldVehicleNumber,
                                      ...history.map(
                                        (item) => item?.newVehicleNumber
                                      ),
                                    ].filter(Boolean);

                                    const uniqueVehicleChain =
                                      vehicleChain.filter(
                                        (vehicleNumber, index, array) =>
                                          index === 0 ||
                                          vehicleNumber !== array[index - 1]
                                      );

                                    return (
                                      <div
                                        className="kam-simple-replacement-chain"
                                        title={uniqueVehicleChain.join(" → ")}
                                      >
                                        {uniqueVehicleChain.map(
                                          (vehicleNumber, index) => (
                                            <React.Fragment
                                              key={`${allocation.allocationId || allocation._id}-replacement-${vehicleNumber}-${index}`}
                                            >
                                              <span
                                                className={
                                                  index ===
                                                    uniqueVehicleChain.length - 1
                                                    ? "current"
                                                    : "previous"
                                                }
                                              >
                                                {vehicleNumber}
                                              </span>

                                              {index <
                                                uniqueVehicleChain.length - 1 && (
                                                  <b>→</b>
                                                )}
                                            </React.Fragment>
                                          )
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>

                              <td>
                                {requirement?.vehicleType ||
                                  allocation.requirementId ||
                                  "—"}
                              </td>

                              <td>
                                {quotation?.transporter ||
                                  confirmation?.selectedTransport ||
                                  confirmation?.transporter ||
                                  "—"}
                              </td>

                              <td>
                                <strong>
                                  {allocation?.driver?.name ||
                                    allocation?.driverName ||
                                    "—"}
                                </strong>

                                {(allocation?.driver?.contactNumber ||
                                  allocation?.driverNumber) && (
                                    <small style={{ display: "block" }}>
                                      {allocation?.driver?.contactNumber ||
                                        allocation?.driverNumber}
                                    </small>
                                  )}
                              </td>

                              <td>
                                {latest?.currentLocation ||
                                  allocation?.todayLocation ||
                                  "—"}
                              </td>

                              <td>
                                {latest?.day || "—"}
                              </td>

                              <td>
                                <span
                                  className={`approval-status ${getStatusClass(
                                    vehicleStatus
                                  )}`}
                                >
                                  {vehicleStatus}
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
                    No vehicles have been allocated by the Tracking team yet.
                  </div>
                )}
              </section>

              {/* ALLOCATION PENDING VEHICLES */}
              <section className="kam-client-vehicle-section">
                <SectionHeading
                  title="Allocation Pending Vehicles"
                  description="Vehicle quantity still waiting for actual vehicle allocation by the Tracking team."
                  count={pendingVehicleCount}
                />

                {pendingVehicleCount > 0 ? (
                  <div className="kam-client-vehicle-table-wrap">
                    <table className="kam-client-vehicle-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Requirement ID</th>
                          <th>Vehicle Requirement</th>
                          <th>Required</th>
                          <th>Allocated</th>
                          <th>Pending</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {approvedTrackingRows
                          .map((approvedItem) => {
                            const requirement = getRequirement(
                              order,
                              approvedItem.requirementId
                            );

                            const requiredQty =
                              approvedItem.approvedQuantity;

                            const allocatedQty = Math.min(
                              getAllocatedQuantityForRequirement(
                                approvedItem.requirementId
                              ),
                              requiredQty
                            );

                            const pendingQty = Math.max(
                              requiredQty - allocatedQty,
                              0
                            );

                            return {
                              requirement,
                              requiredQty,
                              allocatedQty,
                              pendingQty,
                            };
                          })
                          .filter((item) => item.pendingQty > 0)
                          .map((item, index) => (
                            <tr
                              key={
                                item.requirement?.requirementId ||
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
                                  {item.requirement?.requirementId || "—"}
                                </strong>
                              </td>

                              <td>
                                <strong>
                                  {item.requirement?.vehicleType || "—"}
                                </strong>

                                {item.requirement?.configuration && (
                                  <small style={{ display: "block" }}>
                                    {item.requirement.configuration}
                                  </small>
                                )}
                              </td>

                              <td>
                                <strong>{item.requiredQty}</strong>
                              </td>

                              <td>
                                <strong style={{ color: "#08776f" }}>
                                  {item.allocatedQty}
                                </strong>
                              </td>

                              <td>
                                <strong style={{ color: "#b77900" }}>
                                  {item.pendingQty}
                                </strong>
                              </td>

                              <td>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 10px",
                                    border: "1px solid #f0c56a",
                                    borderRadius: "999px",
                                    background: "#fff7e2",
                                    color: "#9a6200",
                                    fontSize: "10px",
                                    fontWeight: 900,
                                  }}
                                >
                                  ⚠ Allocation Pending
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="kam-lifecycle-empty">
                    ✓ All required vehicles have been allocated.
                  </div>
                )}
              </section>

            </div>
          )}

          {/* =================================================
              TRIP COMPLETE - COMPACT OVERALL SUMMARY
              READ ONLY
          ================================================= */}

          {activeStepIndex === 6 &&
            String(lifecycle.find((step) => step.key === "trip-complete")?.status || "")
              .trim()
              .toLowerCase() === "completed" && (
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
                      value={`${allocations.filter(
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

          {/* Show only changes belonging to the currently selected lifecycle page. */}
          {(() => {
            const historyByStage = [
              ["enquiry", "requirement", "trip detail", "order detail"],
              ["finalization", "commercial", "approval"],
              ["po document", "purchase order", "po details"],
              ["vendor", "quotation", "transport"],
              ["order placed", "placement"],
              ["tracking", "allocation", "vehicle detail", "driver", "escort", "supervisor"],
              ["trip complete", "completion", "unloading"]
            ];
            const stageHistory = safeArray(order?.lifecycleChangeHistory).filter(item => {
              const section = String(item?.section || "").trim().toLowerCase();
              return (historyByStage[activeStepIndex] || []).some(term => section.includes(term));
            });
            return (
          <section className="kam-change-history">
            <div className="kam-change-history-header"><h3>Change History</h3><span>{stageHistory.length} changes</span></div>
            {stageHistory.length ? <div className="kam-history-table-wrap"><table className="kam-history-table"><thead><tr><th>Date & Time</th><th>Section</th><th>Field</th><th>Previous Value</th><th>New Value</th><th>Updated By</th></tr></thead><tbody>{[...stageHistory].reverse().map((item, index) => <tr key={`${item.updatedAt}-${index}`}><td>{formatDateTime(item.updatedAt)}</td><td>{item.section}</td><td>{item.field}</td><td title={item.oldValue}>{item.oldValue || "—"}</td><td title={item.newValue}>{item.newValue || "—"}</td><td>{item.updatedBy}</td></tr>)}</tbody></table></div> : <p className="kam-history-empty">No changes recorded yet.</p>}
          </section>
            );
          })()}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="kam-actions kam-workflow-footer">

          <div className="kam-readonly-field">
            Current Stage:{" "}
            <strong>
              {displayCurrentStage}
            </strong>
          </div>

          <div className="kam-footer-action-buttons">
            {isCompletedTrip(order) && <><span className="kam-completed-readonly-label">✓ Trip Completed · Read Only</span><button type="button" className="kam-footer-close-btn" onClick={onClose}>Close</button></>}
            {!isCompletedTrip(order) && editOpen && <><button type="button" className="kam-footer-close-btn" disabled={editSaving} onClick={() => { setEditOpen(false); setEditError(""); }}>Cancel</button><button type="button" className="kam-request-approval-btn" disabled={editSaving || poSaving} onClick={() => { setEditError(""); setConfirmSaveOpen(true); }}>{editSaving || poSaving ? "Saving..." : "Save Changes"}</button></>}
            {!isCompletedTrip(order) && !editOpen && <>

              {/* ENQUIRY */}

              {activeStepIndex === 0 && (

                <button
                  type="button"
                  className={`kam-request-approval-btn ${currentLifecycleIndex > 0
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
                        {orderApprovalRejected
                          ? "Request Approval Again"
                          : "Request for Approval"}
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
                    disabled={
                      placeOrderSaving ||
                      hasPendingTransportReplacement(order)
                    }
                    onClick={placeOrder}
                  >
                    <span aria-hidden="true">✓</span>
                    <span>
                      {placeOrderSaving
                        ? "Placing Order..."
                        : hasPendingTransportReplacement(order)
                          ? "Replacement Pending"
                          : "Place Order"}
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
            </>}
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

      {confirmSaveOpen && <div className="kam-save-confirm-overlay"><div className="kam-save-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="kam-confirm-save-title"><h3 id="kam-confirm-save-title">Confirm Changes</h3><p>Enter your name to save changes and record them in Change History.</p><label>Updated By (Name) *<input autoFocus maxLength={100} value={updatedByName} onChange={e => setUpdatedByName(e.target.value)} placeholder="Enter your full name" /></label>{editError && <p role="alert" className="kam-inline-edit-error">{editError}</p>}<div className="kam-save-confirm-actions"><button type="button" disabled={editSaving} onClick={() => { setConfirmSaveOpen(false); setEditError(""); }}>Cancel</button><button type="button" disabled={editSaving || !updatedByName.trim()} onClick={() => saveAllLifecycleEdits(updatedByName)}>{editSaving ? "Saving..." : "Confirm & Save"}</button></div></div></div>}

    </div>
  );
};

export default Lifecyclemodal;
