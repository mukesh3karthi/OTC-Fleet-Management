import React, { useEffect, useRef, useState } from "react";
import "./tripcreatemodal.css";

/* =========================================================
   OPTIONS
========================================================= */

const WTG_VEHICLE_TYPES = [
  "Low Bed Trailer",
  "Hydraulic Axle Trailer",
  "Multi Axle Trailer",
  "Flatbed Trailer",
  "Extendable Trailer",
  "Modular Hydraulic Trailer",
  "SPMT",
];

const CONFIGURATION_OPTIONS = [
  "2 Axle",
  "3 Axle",
  "4 Axle",
  "5 Axle",
  "6 Axle",
  "8 Axle",
  "10 Axle",
  "12 Axle",
  "16 Axle",
];

const CLASSIFICATION_OPTIONS = ["ODC", "Non-ODC"];

const DIESEL_SCOPE_OPTIONS = ["Client Scope", "OTC Scope"];

/* =========================================================
   COMMON INPUT
========================================================= */

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
  maxLength,
  inputMode,
  disabled = false,
  readOnly = false,
}) => (
  <div className="trip-field-group">
    <label>
      {label}

      {required && <span className="trip-required">*</span>}
    </label>

    {unit ? (
      <div className="trip-input-unit">
        <input
          type={type}
          min={min}
          step={step}
          maxLength={maxLength}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
        />

        <span>{unit}</span>
      </div>
    ) : (
      <input
        type={type}
        min={min}
        step={step}
        maxLength={maxLength}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
      />
    )}
  </div>
);

/* =========================================================
   VEHICLE REQUIREMENT ROW

   Canonical structure:

   vehicleRequirements[]
   {
      requirementId,
      vehicleType,
      configuration,
      classification, // Intercarting / Other only
      materialType,    // WTG-specific
      origin,          // WTG-specific
      destination,     // WTG-specific
      placementDate,   // WTG-specific
      quantity: 1,       // Each requirement row represents exactly one vehicle.
      weight,
      dimensions: {
         length,
         height,
         width
      }
   }
========================================================= */

const VehicleRequirementRow = ({
  requirement,
  index,
  vehicleTypes,
  handleWtgVehicleFieldChange,
  handleRemoveWtgVehicle,
  totalRequirements,
  rowType = "wtg",
}) => {
  const isWtg = rowType === "wtg";

  const rowClass = isWtg
    ? "wtg-vehicle-row"
    : `intercarting-vehicle-row ${
        index > 0 ? "intercarting-vehicle-row-compact" : ""
      }`;

  const indexClass = isWtg ? "wtg-vehicle-index" : "intercarting-vehicle-index";

  const prefix = isWtg ? "wtg" : "intercarting";

  return (
    <div
      className={rowClass}
      key={requirement.requirementId || `${prefix}-requirement-${index}`}
    >
      <div className={indexClass}>{index + 1}</div>

      {/* ===================================================
          VEHICLE TYPE
      =================================================== */}

      <div
        className={`trip-field-group ${
          isWtg ? "wtg-field-vehicle-type" : "intercarting-field-vehicle-type"
        }`}
      >
        <label htmlFor={`${prefix}-vehicle-type-${index}`}>
          Vehicle Type
          <span className="trip-required">*</span>
        </label>

        <div className="wtg-suggest-input">
          <input
            id={`${prefix}-vehicle-type-${index}`}
            type="text"
            list={`${prefix}-vehicle-types-${index}`}
            value={requirement.vehicleType || ""}
            placeholder="Enter vehicle type"
            autoComplete="off"
            onChange={handleWtgVehicleFieldChange(index, "vehicleType")}
          />
        </div>

        <datalist id={`${prefix}-vehicle-types-${index}`}>
          {vehicleTypes.map((vehicleType) => (
            <option key={vehicleType} value={vehicleType} />
          ))}
        </datalist>
      </div>

      {/* ===================================================
          CONFIGURATION
      =================================================== */}

      <div
        className={`trip-field-group ${
          isWtg ? "wtg-field-configuration" : "intercarting-field-configuration"
        }`}
      >
        <label htmlFor={`${prefix}-configuration-${index}`}>
          Configuration Model
          <span className="trip-required">*</span>
        </label>

        <div className="wtg-suggest-input">
          <input
            id={`${prefix}-configuration-${index}`}
            type="text"
            list={`${prefix}-configurations-${index}`}
            value={requirement.configuration || ""}
            placeholder="Enter configuration"
            autoComplete="off"
            onChange={handleWtgVehicleFieldChange(index, "configuration")}
          />
        </div>

        <datalist id={`${prefix}-configurations-${index}`}>
          {CONFIGURATION_OPTIONS.map((configuration) => (
            <option key={configuration} value={configuration} />
          ))}
        </datalist>
      </div>

      {/* ===================================================
          WTG VEHICLE-SPECIFIC DETAILS
      =================================================== */}

      {isWtg ? (
        <div className="trip-field-group wtg-field-material">
          <label htmlFor={`${prefix}-material-${index}`}>
            Material Type<span className="trip-required">*</span>
          </label>
          <input
            id={`${prefix}-material-${index}`}
            type="text"
            value={requirement.materialType || ""}
            placeholder="Material"
            onChange={handleWtgVehicleFieldChange(index, "materialType")}
          />
        </div>
      ) : (
        <div className="trip-field-group intercarting-field-classification">
          <label htmlFor={`${prefix}-classification-${index}`}>
            Movement Classification<span className="trip-required">*</span>
          </label>
          <div className="trip-select-wrap">
            <select
              id={`${prefix}-classification-${index}`}
              value={requirement.classification || ""}
              onChange={handleWtgVehicleFieldChange(index, "classification")}
            >
              <option value="">Select type</option>
              {CLASSIFICATION_OPTIONS.map((classification) => (
                <option key={classification} value={classification}>
                  {classification}
                </option>
              ))}
            </select>
            <span className="trip-select-arrow">⌄</span>
          </div>
        </div>
      )}

      {/* ===================================================
          WEIGHT
      =================================================== */}

      <div
        className={`trip-field-group ${
          isWtg ? "wtg-field-weight" : "intercarting-field-weight"
        }`}
      >
        <label htmlFor={`${prefix}-weight-${index}`}>
          Weight
          <span className="trip-required">*</span>
        </label>

        <div className="wtg-weight-control">
          <input
            id={`${prefix}-weight-${index}`}
            type="number"
            min="0"
            step="0.01"
            value={requirement.weight ?? ""}
            placeholder="0.00"
            onChange={handleWtgVehicleFieldChange(index, "weight")}
          />

          <span>TON</span>
        </div>
      </div>

      {/* ===================================================
          WTG ROUTE AND PLACEMENT
      =================================================== */}
      {isWtg && (
        <>
          <div className="trip-field-group wtg-field-origin">
            <label htmlFor={`${prefix}-origin-${index}`}>
              Origin<span className="trip-required">*</span>
            </label>
            <input
              id={`${prefix}-origin-${index}`}
              type="text"
              placeholder="Origin"
              value={requirement.origin || ""}
              onChange={handleWtgVehicleFieldChange(index, "origin")}
            />
          </div>
          <div className="trip-field-group wtg-field-destination">
            <label htmlFor={`${prefix}-destination-${index}`}>
              Destination<span className="trip-required">*</span>
            </label>
            <input
              id={`${prefix}-destination-${index}`}
              type="text"
              placeholder="Destination"
              value={requirement.destination || ""}
              onChange={handleWtgVehicleFieldChange(index, "destination")}
            />
          </div>
          <div className="trip-field-group wtg-field-placement">
            <label htmlFor={`${prefix}-placement-${index}`}>
              Placement Date
            </label>
            <input
              id={`${prefix}-placement-${index}`}
              type="date"
              value={requirement.placementDate || ""}
              onChange={handleWtgVehicleFieldChange(index, "placementDate")}
            />
          </div>
        </>
      )}

      {/* DIMENSIONS */}

      <div
        className={`trip-field-group wtg-dimensions-group ${
          isWtg ? "wtg-field-dimensions" : "intercarting-field-dimensions"
        }`}
      >
        <label>Dimensions (L × H × W)</label>

        <div className="wtg-dimensions-control">
          <div className="wtg-dimension-part">
            <input
              type="number"
              min="0"
              step="0.01"
              value={requirement?.dimensions?.length ?? ""}
              placeholder="L"
              aria-label={`Requirement ${index + 1} length`}
              onChange={handleWtgVehicleFieldChange(index, "length")}
            />
          </div>

          <span className="wtg-dimension-separator">×</span>

          <div className="wtg-dimension-part">
            <input
              type="number"
              min="0"
              step="0.01"
              value={requirement?.dimensions?.height ?? ""}
              placeholder="H"
              aria-label={`Requirement ${index + 1} height`}
              onChange={handleWtgVehicleFieldChange(index, "height")}
            />
          </div>

          <span className="wtg-dimension-separator">×</span>

          <div className="wtg-dimension-part">
            <input
              type="number"
              min="0"
              step="0.01"
              value={requirement?.dimensions?.width ?? ""}
              placeholder="W"
              aria-label={`Requirement ${index + 1} width`}
              onChange={handleWtgVehicleFieldChange(index, "width")}
            />
          </div>

          <span className="wtg-dimensions-unit">FT</span>
        </div>
      </div>

      {/* ===================================================
          REMOVE
      =================================================== */}

      {totalRequirements > 1 && (
        <button
          type="button"
          className="wtg-remove-vehicle-btn"
          onClick={() => handleRemoveWtgVehicle(index)}
          aria-label={`Remove vehicle requirement ${index + 1}`}
          title="Remove vehicle"
        >
          ×
        </button>
      )}
    </div>
  );
};

/* =========================================================
   TRIP CREATE MODAL
========================================================= */

const getLoggedInKamUsername = () => {
  try {
    if (
      !sessionStorage.getItem("kamToken")?.trim() ||
      sessionStorage.getItem("kamLoggedIn") !== "true"
    )
      return "";
    return String(sessionStorage.getItem("kamUsername") || "").trim();
  } catch {
    return "";
  }
};

const formatKamName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(
      /(^|[\s._-])(\p{L})/gu,
      (_, separator, letter) => separator + letter.toUpperCase(),
    );

// One row = one vehicle for every movement type.
const getTotalVehicles = (requirements) =>
  Array.isArray(requirements) ? requirements.length : 0;

/* =========================================================
   CRANE SUPPORTING FILES (multiple upload, view / download each)
========================================================= */

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 12 * 1024 * 1024;

const formatSize = (bytes = 0) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const getToken = () => {
  try {
    return sessionStorage.getItem("kamToken") || "";
  } catch {
    return "";
  }
};

/**
 * Props
 *  apiBase          e.g. import.meta.env.VITE_API_URL
 *  selectedFiles    File[]  new files not yet saved (create mode)
 *  onAddFiles       (File[]) => void   append to your tripUpload state
 *  onRemoveSelected (index) => void
 *  orderId          Mongo _id of the order (edit mode only)
 *  existingFiles    trip.craneDocuments (edit mode only)
 *  onTripUpdated    (updatedTrip) => void   called after upload/remove in edit mode
 */
const CraneFilesSection = ({
  apiBase = "",
  selectedFiles = [],
  onAddFiles,
  onPickEvent,
  onRemoveSelected,
  orderId = "",
  existingFiles = [],
  onTripUpdated,
}) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = { Authorization: `Bearer ${getToken()}` };
  const fileUrl = (file, disposition) =>
    `${apiBase}/api/triporders/${orderId}/crane-documents/${file._id}/file?disposition=${disposition}`;

  const savedBytes = existingFiles.reduce((s, f) => s + (f.fileSize || 0), 0);
  const pendingBytes = selectedFiles.reduce((s, f) => s + f.size, 0);

  const validate = (incoming) => {
    const count = existingFiles.length + selectedFiles.length + incoming.length;
    if (count > MAX_FILES) return `You can attach up to ${MAX_FILES} documents.`;
    const total = savedBytes + pendingBytes + incoming.reduce((s, f) => s + f.size, 0);
    if (total > MAX_TOTAL_BYTES) return "Total size of all documents must be 12 MB or less.";
    return "";
  };

  const uploadToOrder = async (files) => {
    setBusy(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("documents", f));
      const res = await fetch(`${apiBase}/api/triporders/${orderId}/crane-documents`, {
        method: "POST",
        headers: authHeaders,
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Upload failed.");
      onTripUpdated?.(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePick = async (event) => {
    const input = event.target;
    const incoming = Array.from(input.files || []);
    if (!incoming.length) return;
    const problem = validate(incoming);
    if (problem) {
      input.value = "";
      return setError(problem);
    }
    setError("");
    if (orderId) {
      // Edit mode: upload straight to the saved order.
      await uploadToOrder(incoming);
      input.value = "";
    } else if (onAddFiles) {
      onAddFiles(incoming);
      input.value = "";
    } else {
      // Create mode: hand the original change event to the parent's existing
      // handler, exactly as the old input did (value is left untouched).
      onPickEvent?.(event);
    }
  };

  const viewLocal = (file) => {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const fetchSaved = async (file, download) => {
    try {
      const res = await fetch(fileUrl(file, download ? "attachment" : "inline"), {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Unable to load document.");
      const url = URL.createObjectURL(await res.blob());
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        window.open(url, "_blank", "noopener");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const removeSaved = async (file) => {
    if (!window.confirm(`Remove ${file.fileName}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${apiBase}/api/triporders/${orderId}/crane-documents/${file._id}`,
        { method: "DELETE", headers: authHeaders },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Unable to remove document.");
      onTripUpdated?.(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const total = existingFiles.length + selectedFiles.length;

  return (
    <div className="trip-field-group trip-field-full">
      <label>Upload Supporting Files</label>

      <div
        className="trip-file-upload"
        role="button"
        tabIndex={0}
        aria-disabled={busy}
        style={{ position: "relative", cursor: busy ? "wait" : "pointer" }}
        onClick={() => {
          if (!busy) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (!busy && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          disabled={busy}
          onClick={(event) => event.stopPropagation()}
          onChange={handlePick}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
          aria-label="Choose multiple supporting files"
        />
        <span className="trip-file-icon">↑</span>
        <span className="trip-file-content">
          <strong>
            {total ? `${total} of ${MAX_FILES} file(s) attached` : "Choose supporting documents"}
          </strong>
          <small>PDF, Word, Excel, CSV, JPG or PNG. Up to {MAX_FILES} files, 12 MB total.</small>
        </span>
        <span className="trip-file-action">{busy ? "Working..." : "Browse"}</span>
      </div>

      {error && (
        <p role="alert" style={{ color: "#b91c1c", fontSize: 13, margin: "6px 0 0" }}>
          {error}
        </p>
      )}

      {existingFiles.length > 0 && (
        <div className="trip-selected-files">
          {existingFiles.map((file) => (
            <div className="trip-selected-file" key={file._id}>
              <span className="trip-selected-file-name">
                {file.fileName} <small>({formatSize(file.fileSize)})</small>
              </span>
              <button type="button" onClick={() => fetchSaved(file, false)}>View</button>
              <button type="button" onClick={() => fetchSaved(file, true)}>Download</button>
              {existingFiles.length > 1 && (
                <button
                  type="button"
                  className="trip-selected-file-remove"
                  disabled={busy}
                  onClick={() => removeSaved(file)}
                  aria-label={`Remove ${file.fileName}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="trip-selected-files">
          {selectedFiles.map((file, index) => (
            <div
              className="trip-selected-file"
              key={`${file.name}-${file.lastModified || index}-${index}`}
            >
              <span className="trip-selected-file-name">
                {file.name} <small>({formatSize(file.size)})</small>
              </span>
              <button type="button" onClick={() => viewLocal(file)}>View</button>
              <button
                type="button"
                className="trip-selected-file-remove"
                onClick={() => onRemoveSelected?.(index)}
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Tripcreatemodal = ({
  showTripModal,
  tripForm,
  tripUpload,
  primaryVehicleTypes = [],
  handleTripOverlayClick,
  handleMovementTypeChange,
  handleCloseTripModal,
  handleTripFieldChange,
  handleAddWtgVehicle,
  handleWtgVehicleFieldChange,
  handleRemoveWtgVehicle,
  handleTripFileChange,
  removeTripFile,
  handleCreateTrip,
  isEditing = false,
  isSaving = false,
  handleAddTripFiles, // (File[]) => void  (append to tripUpload)
  apiBase = "",
  orderDbId = "",
  existingCraneFiles = [],
  onCraneTripUpdated,
}) => {
  const selectedTripFiles = Array.isArray(tripUpload) ? tripUpload : [];
  const loggedInKamUsername = getLoggedInKamUsername();
  const loggedInKamName = formatKamName(loggedInKamUsername);
  const totalVehicles = getTotalVehicles(tripForm.vehicleRequirements);
  const assignedKamValue = isEditing
    ? formatKamName(tripForm.assignedKam)
    : loggedInKamName;

  // Keep the parent's form in sync so its existing save handler receives the KAM.
  // Hooks must run before the conditional return when the modal is closed.
  useEffect(() => {
    if (
      showTripModal &&
      !isEditing &&
      loggedInKamUsername &&
      tripForm.assignedKam !== loggedInKamName
    ) {
      handleTripFieldChange("assignedKam")({
        target: { name: "assignedKam", value: loggedInKamName },
      });
    }
  }, [
    showTripModal,
    isEditing,
    loggedInKamUsername,
    loggedInKamName,
    tripForm.assignedKam,
    handleTripFieldChange,
  ]);

  useEffect(() => {
    if (
      showTripModal &&
      tripForm.movementType !== "Crane" &&
      String(tripForm.totalVehicles ?? "") !== String(totalVehicles)
    ) {
      handleTripFieldChange("totalVehicles")({
        target: { name: "totalVehicles", value: String(totalVehicles) },
      });
    }
  }, [
    showTripModal,
    totalVehicles,
    tripForm.movementType,
    tripForm.totalVehicles,
    handleTripFieldChange,
  ]);

  // The quantity control was removed for every movement. Keep the underlying
  // payload consistent with the one-row-per-vehicle rule used by the backend.
  useEffect(() => {
    if (!showTripModal || tripForm.movementType === "Crane") return;
    (Array.isArray(tripForm.vehicleRequirements)
      ? tripForm.vehicleRequirements
      : []
    ).forEach((requirement, index) => {
      if (Number(requirement.quantity) !== 1) {
        handleWtgVehicleFieldChange(
          index,
          "quantity",
        )({ target: { value: "1" } });
      }
    });
  }, [
    showTripModal,
    tripForm.vehicleRequirements,
    tripForm.movementType,
    handleWtgVehicleFieldChange,
  ]);

  const totalVehiclesReady =
    tripForm.movementType === "Crane" ||
    String(tripForm.totalVehicles ?? "") === String(totalVehicles);

  const assignedKamReady =
    isEditing ||
    Boolean(loggedInKamUsername && tripForm.assignedKam === loggedInKamName);

  if (!showTripModal) {
    return null;
  }

  const requirements = Array.isArray(tripForm.vehicleRequirements)
    ? tripForm.vehicleRequirements
    : [];

  const isWTG = tripForm.movementType === "WTG Movement";

  const isIntercarting = tripForm.movementType === "Intercarting";

  const isIntercartingOrOther = ["Intercarting", "Other"].includes(
    tripForm.movementType,
  );

  const isCrane = tripForm.movementType === "Crane";

  return (
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
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="trip-modal-header">
          <div className="trip-modal-header-left">
            <span className="trip-modal-subtitle">KEY ACCOUNT MANAGEMENT</span>

            <div className="trip-modal-title-row">
              <div className="trip-modal-title-copy">
                <h2 id="new-trip-title">
                  {isEditing ? "Edit Order" : "New Order Creation"}
                </h2>

                <p>
                  {isEditing
                    ? "Update customer, contact, route, material and vehicle requirement details."
                    : "Enter customer, contact, route, material and vehicle requirement details."}
                </p>
              </div>

              {/* MOVEMENT TYPE */}

              <div className="trip-header-movement">
                <label htmlFor="trip-movement-type">
                  Movement Type
                  <span className="trip-required">*</span>
                </label>

                <div className="trip-header-select-wrap">
                  <select
                    id="trip-movement-type"
                    value={tripForm.movementType || ""}
                    onChange={handleMovementTypeChange}
                    disabled={isEditing}
                  >
                    <option value="">Select Movement...</option>

                    <option value="WTG Movement">Line Movement</option>

                    <option value="Intercarting">Intercarting</option>

                    <option value="Crane">Crane</option>

                    <option value="Other">Project Movement</option>
                  </select>

                  <span className="trip-header-select-arrow">⌄</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="trip-modal-close"
            onClick={handleCloseTripModal}
            disabled={isSaving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="trip-modal-body">
          {/* ===============================================
              EMPTY STATE
          =============================================== */}

          {!tripForm.movementType && (
            <div className="trip-empty-state">
              <div className="trip-empty-state-icon">↗</div>

              <strong>Select a movement type</strong>

              <p>
                Line, Intercarting, Crane and Project movements use different
                operational details.
              </p>
            </div>
          )}

          {/* ===============================================
              WTG MOVEMENT
          =============================================== */}

          {isWTG && (
            <>
              {/* WTG TRIP INFORMATION */}

              <section className="trip-form-section">
                <div className="trip-section-heading">
                  <div>
                    <div>
                      <strong>WTG Order Information</strong>

                      <small>Customer and enquiry details.</small>
                    </div>
                  </div>

                  <div className="trip-heading-trip-id">
                    <small>ORDER ID</small>

                    <strong>{tripForm.tripId}</strong>
                  </div>
                </div>

                <div className="trip-form-grid">
                  <TripField
                    label="Customer"
                    required
                    value={tripForm.customer}
                    placeholder="Enter customer name"
                    onChange={handleTripFieldChange("customer")}
                  />

                  <TripField
                    label="Contact Person"
                    required
                    value={tripForm.contactPerson}
                    placeholder="Enter contact person name"
                    onChange={handleTripFieldChange("contactPerson")}
                  />

                  <TripField
                    label="Contact Number"
                    required
                    type="tel"
                    value={tripForm.contactNumber}
                    placeholder="Enter contact number"
                    onChange={handleTripFieldChange("contactNumber")}
                  />

                  <TripField
                    label="Email"
                    required
                    type="email"
                    value={tripForm.email}
                    placeholder="Enter contact email"
                    onChange={handleTripFieldChange("email")}
                  />

                  <TripField
                    label="Enquiry Date"
                    required
                    type="date"
                    value={tripForm.enquiryDate}
                    onChange={handleTripFieldChange("enquiryDate")}
                  />

                  <TripField
                    label="Assigned KAM"
                    required
                    value={assignedKamValue}
                    placeholder="Login required"
                    readOnly
                  />

                  <TripField
                    label="Total Vehicles"
                    value={totalVehicles}
                    unit="NOS"
                    readOnly
                  />
                </div>
              </section>

              {/* ===========================================
                  VEHICLE REQUIREMENTS
              =========================================== */}

              <section className="trip-form-section">
                <div className="trip-section-heading">
                  <div>
                    <div>
                      <strong>WTG Vehicle &amp; Dimensions</strong>

                      <small>
                        Each vehicle has its own material, route, placement,
                        weight and dimensions.
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="trip-add-vehicle-btn"
                    onClick={handleAddWtgVehicle}
                    title="Add another vehicle requirement"
                  >
                    <span className="trip-add-vehicle-icon" aria-hidden="true">
                      +
                    </span>

                    <span className="trip-add-vehicle-text">Add Vehicle</span>

                    <span className="trip-add-vehicle-count">
                      {requirements.length}
                    </span>
                  </button>
                </div>

                <div className="wtg-vehicle-rows">
                  <div
                    className="trip-vehicle-table-header trip-vehicle-table-header-wtg"
                    aria-hidden="true"
                  >
                    {[
                      "No.",
                      "Vehicle Type",
                      "Configuration Model",
                      "Material Type",
                      "Weight",
                      "Origin",
                      "Destination",
                      "Placement Date",
                      "Dimensions (L × H × W)",
                      "",
                    ].map((heading, i) => (
                      <span key={`${heading}-${i}`}>{heading}</span>
                    ))}
                  </div>
                  {requirements.map((requirement, index) => (
                    <VehicleRequirementRow
                      key={requirement.requirementId || `wtg-${index}`}
                      requirement={requirement}
                      index={index}
                      vehicleTypes={WTG_VEHICLE_TYPES}
                      handleWtgVehicleFieldChange={handleWtgVehicleFieldChange}
                      handleRemoveWtgVehicle={handleRemoveWtgVehicle}
                      totalRequirements={requirements.length}
                      rowType="wtg"
                    />
                  ))}
                </div>

                <div className="trip-field-group trip-field-full wtg-remark-field">
                  <label>Remarks</label>

                  <textarea
                    rows={2}
                    value={tripForm.remark || ""}
                    placeholder="Enter placement, route, loading or handling remarks..."
                    onChange={handleTripFieldChange("remark")}
                  />
                </div>
              </section>
            </>
          )}

          {/* ===============================================
              INTERCARTING / OTHER
          =============================================== */}

          {isIntercartingOrOther && (
            <>
              {/* BASIC DETAILS */}

              <section className="trip-form-section">
                <div className="trip-section-heading">
                  <div>
                    <div>
                      <strong>
                        {tripForm.movementType === "Intercarting"
                          ? "Intercarting Details"
                          : "Project Movement Details"}
                      </strong>

                      <small>
                        Customer, site, placement and commercial scope
                        information.
                      </small>
                    </div>
                  </div>

                  <div className="trip-heading-trip-id">
                    <small>ORDER ID</small>

                    <strong>{tripForm.tripId}</strong>
                  </div>
                </div>

                <div className="trip-form-grid">
                  <TripField
                    label="Customer"
                    required
                    value={tripForm.customer}
                    placeholder="Enter customer name"
                    onChange={handleTripFieldChange("customer")}
                  />

                  <TripField
                    label="Contact Person"
                    required
                    value={tripForm.contactPerson}
                    placeholder="Enter contact person name"
                    onChange={handleTripFieldChange("contactPerson")}
                  />

                  <TripField
                    label="Contact Number"
                    required
                    type="tel"
                    value={tripForm.contactNumber}
                    placeholder="Enter contact number"
                    onChange={handleTripFieldChange("contactNumber")}
                  />

                  <TripField
                    label="Email"
                    required
                    type="email"
                    value={tripForm.email}
                    placeholder="Enter email address"
                    onChange={handleTripFieldChange("email")}
                  />

                  {!isIntercarting && (
                    <TripField
                      label="Material Type"
                      required
                      value={tripForm.materialType}
                      placeholder="Enter material type"
                      onChange={handleTripFieldChange("materialType")}
                    />
                  )}

                  <TripField
                    label="Site Location"
                    value={tripForm.siteLocation}
                    placeholder="Enter site location"
                    onChange={handleTripFieldChange("siteLocation")}
                  />

                  <TripField
                    label="Period"
                    value={tripForm.period}
                    placeholder="Enter period"
                    onChange={handleTripFieldChange("period")}
                  />

                  {/* DIESEL SCOPE */}

                  <div className="trip-field-group">
                    <label htmlFor="intercarting-diesel-scope">
                      Diesel Scope
                    </label>

                    <div className="trip-select-wrap">
                      <select
                        id="intercarting-diesel-scope"
                        value={tripForm.dieselScope || ""}
                        onChange={handleTripFieldChange("dieselScope")}
                      >
                        <option value="">Select scope</option>

                        {DIESEL_SCOPE_OPTIONS.map((scope) => (
                          <option key={scope} value={scope}>
                            {scope}
                          </option>
                        ))}
                      </select>

                      <span className="trip-select-arrow">⌄</span>
                    </div>
                  </div>

                  <TripField
                    label="Enquiry Date"
                    required
                    type="date"
                    value={tripForm.enquiryDate}
                    onChange={handleTripFieldChange("enquiryDate")}
                  />

                  <TripField
                    label="Placement Date"
                    type="date"
                    value={tripForm.placementDate}
                    onChange={handleTripFieldChange("placementDate")}
                  />

                  <TripField
                    label="Assigned KAM"
                    required
                    value={assignedKamValue}
                    placeholder="Login required"
                    readOnly
                  />

                  <TripField
                    label="Total Vehicles"
                    value={totalVehicles}
                    unit="NOS"
                    readOnly
                  />

                  {!isIntercarting && (
                    <TripField
                      label="Origin"
                      value={tripForm.origin}
                      placeholder="Enter origin"
                      onChange={handleTripFieldChange("origin")}
                    />
                  )}

                  {!isIntercarting && (
                    <TripField
                      label="Destination"
                      value={tripForm.destination}
                      placeholder="Enter destination"
                      onChange={handleTripFieldChange("destination")}
                    />
                  )}

                  {!isIntercarting && (
                    <TripField
                      label="Distance"
                      type="number"
                      min="0"
                      step="0.01"
                      value={tripForm.distance}
                      placeholder="Enter route distance"
                      unit="KM"
                      onChange={handleTripFieldChange("distance")}
                    />
                  )}
                </div>
              </section>

              {/* ===========================================
                  VEHICLE REQUIREMENTS
              =========================================== */}

              <section className="trip-form-section intercarting-vehicle-section">
                <div className="trip-section-heading">
                  <div>
                    <div>
                      <strong>
                        {tripForm.movementType === "Intercarting"
                          ? "Intercarting Vehicle Details"
                          : "Project Vehicle Details"}
                      </strong>

                      <small>
                        Add each required vehicle with type, configuration,
                        classification and weight.
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="trip-add-vehicle-btn"
                    onClick={handleAddWtgVehicle}
                    title="Add another vehicle requirement"
                  >
                    <span className="trip-add-vehicle-icon" aria-hidden="true">
                      +
                    </span>

                    <span className="trip-add-vehicle-text">Add Vehicle</span>

                    <span className="trip-add-vehicle-count">
                      {requirements.length}
                    </span>
                  </button>
                </div>

                <div className="intercarting-vehicle-rows">
                  <div
                    className="trip-vehicle-table-header trip-vehicle-table-header-intercarting"
                    aria-hidden="true"
                  >
                    {[
                      "No.",
                      "Vehicle Type",
                      "Configuration Model",
                      "Classification",
                      "Weight",
                      "Dimensions (L × H × W)",
                      "",
                    ].map((heading, i) => (
                      <span key={`${heading}-${i}`}>{heading}</span>
                    ))}
                  </div>
                  {requirements.map((requirement, index) => (
                    <VehicleRequirementRow
                      key={requirement.requirementId || `intercarting-${index}`}
                      requirement={requirement}
                      index={index}
                      vehicleTypes={primaryVehicleTypes}
                      handleWtgVehicleFieldChange={handleWtgVehicleFieldChange}
                      handleRemoveWtgVehicle={handleRemoveWtgVehicle}
                      totalRequirements={requirements.length}
                      rowType="intercarting"
                    />
                  ))}
                </div>

                <div className="trip-field-group trip-field-full intercarting-remark-field">
                  <label htmlFor="intercarting-remark">Remarks</label>

                  <textarea
                    id="intercarting-remark"
                    rows={2}
                    value={tripForm.remark || ""}
                    placeholder={
                      tripForm.movementType === "Intercarting"
                        ? "Enter intercarting, site, vehicle or operational remarks..."
                        : "Enter movement, vehicle or operational remarks..."
                    }
                    onChange={handleTripFieldChange("remark")}
                  />
                </div>
              </section>
            </>
          )}

          {/* ===============================================
              CRANE MOVEMENT
          =============================================== */}

          {isCrane && (
            <>
              <section className="trip-form-section">
                <div className="trip-section-heading">
                  <div>
                    <div>
                      <strong>Crane Order Details</strong>

                      <small>
                        Customer, material, enquiry, placement and route
                        information.
                      </small>
                    </div>
                  </div>

                  <div className="trip-heading-trip-id">
                    <small>ORDER ID</small>

                    <strong>{tripForm.tripId}</strong>
                  </div>
                </div>

                <div className="trip-form-grid">
                  <TripField
                    label="Customer"
                    required
                    value={tripForm.customer}
                    placeholder="Enter customer name"
                    onChange={handleTripFieldChange("customer")}
                  />

                  <TripField
                    label="Contact Person"
                    required
                    value={tripForm.contactPerson}
                    placeholder="Enter contact person name"
                    onChange={handleTripFieldChange("contactPerson")}
                  />

                  <TripField
                    label="Contact Number"
                    required
                    type="tel"
                    value={tripForm.contactNumber}
                    placeholder="Enter contact number"
                    onChange={handleTripFieldChange("contactNumber")}
                  />

                  <TripField
                    label="Email"
                    required
                    type="email"
                    value={tripForm.email}
                    placeholder="Enter contact email"
                    onChange={handleTripFieldChange("email")}
                  />

                  <TripField
                    label="Material Type"
                    required
                    value={tripForm.materialType}
                    placeholder="Enter crane / material type"
                    onChange={handleTripFieldChange("materialType")}
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
                    type="date"
                    value={tripForm.placementDate}
                    onChange={handleTripFieldChange("placementDate")}
                  />

                  <TripField
                    label="Assigned KAM"
                    required
                    value={assignedKamValue}
                    placeholder="Login required"
                    readOnly
                  />

                  <TripField
                    label="Origin"
                    required
                    value={tripForm.origin}
                    placeholder="Enter origin"
                    onChange={handleTripFieldChange("origin")}
                  />

                  <TripField
                    label="Origin Pincode"
                    type="text"
                    value={tripForm.originPincode}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    inputMode="numeric"
                    onChange={handleTripFieldChange("originPincode")}
                  />

                  <TripField
                    label="Destination"
                    required
                    value={tripForm.destination}
                    placeholder="Enter destination"
                    onChange={handleTripFieldChange("destination")}
                  />

                  <TripField
                    label="Destination Pincode"
                    type="text"
                    value={tripForm.destinationPincode}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    inputMode="numeric"
                    onChange={handleTripFieldChange("destinationPincode")}
                  />

                  <TripField
                    label="Weight in Tons"
                    type="number"
                    min="0"
                    step="0.01"
                    value={tripForm.weight}
                    placeholder="Enter weight"
                    unit="TON"
                    onChange={handleTripFieldChange("weight")}
                  />

                  <TripField
                    label="Distance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={tripForm.distance}
                    placeholder="Enter route distance"
                    unit="KM"
                    onChange={handleTripFieldChange("distance")}
                  />
                </div>
              </section>

              <section className="trip-form-section">
                {/* SUPPORTING DOCUMENTS (multiple, view / download each) */}

                <div className="trip-form-grid">
                  <CraneFilesSection
                    apiBase={apiBase || import.meta.env?.VITE_API_URL || ""}
                    selectedFiles={selectedTripFiles}
                    onAddFiles={handleAddTripFiles}
                    onPickEvent={handleTripFileChange}
                    onRemoveSelected={removeTripFile}
                    orderId={isEditing ? orderDbId : ""}
                    existingFiles={existingCraneFiles}
                    onTripUpdated={onCraneTripUpdated}
                  />
                </div>

                <div className="trip-field-group trip-field-full crane-remark-field">
                  <label htmlFor="crane-remark">Remarks</label>

                  <textarea
                    id="crane-remark"
                    rows={2}
                    value={tripForm.remark || ""}
                    placeholder="Enter crane, lifting, route, vehicle or operational remarks..."
                    onChange={handleTripFieldChange("remark")}
                  />
                </div>
              </section>
            </>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        {!isEditing && !loggedInKamUsername && (
          <p className="trip-login-error" role="alert">
            Please sign in with your Key Account credentials to create an order.
          </p>
        )}

        <div className="trip-modal-actions">
          <button
            type="button"
            className="trip-btn-outline"
            onClick={handleCloseTripModal}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="trip-btn-primary"
            onClick={(event) => {
              if (assignedKamReady && totalVehiclesReady)
                handleCreateTrip(event);
            }}
            disabled={
              isSaving ||
              !tripForm.movementType ||
              !assignedKamReady ||
              !totalVehiclesReady
            }
          >
            {isSaving
              ? isEditing
                ? "Saving Changes..."
                : "Creating Order..."
              : isEditing
                ? "Save Changes"
                : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tripcreatemodal;
