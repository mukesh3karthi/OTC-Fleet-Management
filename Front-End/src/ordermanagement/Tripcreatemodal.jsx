import React from "react";
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

const CLASSIFICATION_OPTIONS = [
  "ODC",
  "Non-ODC",
];

const DIESEL_SCOPE_OPTIONS = [
  "Client Scope",
  "OTC Scope",
];

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
  disabled = false,
}) => (
  <div className="trip-field-group">

    <label>
      {label}

      {required && (
        <span className="trip-required">
          *
        </span>
      )}
    </label>

    {unit ? (
      <div className="trip-input-unit">

        <input
          type={type}
          min={min}
          step={step}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
        />

        <span>
          {unit}
        </span>

      </div>
    ) : (
      <input
        type={type}
        min={min}
        step={step}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
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
      classification,
      quantity,
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
  const isWtg =
    rowType === "wtg";

  const rowClass =
    isWtg
      ? `wtg-vehicle-row ${index > 0
        ? "wtg-vehicle-row-compact"
        : ""
      }`
      : `intercarting-vehicle-row ${index > 0
        ? "intercarting-vehicle-row-compact"
        : ""
      }`;

  const indexClass =
    isWtg
      ? "wtg-vehicle-index"
      : "intercarting-vehicle-index";

  const prefix =
    isWtg
      ? "wtg"
      : "intercarting";

  return (
    <div
      className={rowClass}
      key={
        requirement.requirementId ||
        `${prefix}-requirement-${index}`
      }
    >

      <div className={indexClass}>
        {index + 1}
      </div>

      {/* ===================================================
          VEHICLE TYPE
      =================================================== */}

      <div
        className={`trip-field-group ${isWtg
            ? "wtg-field-vehicle-type"
            : "intercarting-field-vehicle-type"
          }`}
      >

        <label
          htmlFor={`${prefix}-vehicle-type-${index}`}
        >
          Vehicle Type

          <span className="trip-required">
            *
          </span>
        </label>

        <div className="wtg-suggest-input">

          <input
            id={`${prefix}-vehicle-type-${index}`}
            type="text"
            list={`${prefix}-vehicle-types-${index}`}
            value={
              requirement.vehicleType ||
              ""
            }
            placeholder="Enter vehicle type"
            autoComplete="off"
            onChange={
              handleWtgVehicleFieldChange(
                index,
                "vehicleType"
              )
            }
          />

        </div>

        <datalist
          id={`${prefix}-vehicle-types-${index}`}
        >
          {vehicleTypes.map(
            (vehicleType) => (
              <option
                key={vehicleType}
                value={vehicleType}
              />
            )
          )}
        </datalist>

      </div>

      {/* ===================================================
          CONFIGURATION
      =================================================== */}

      <div
        className={`trip-field-group ${isWtg
            ? "wtg-field-configuration"
            : "intercarting-field-configuration"
          }`}
      >

        <label
          htmlFor={`${prefix}-configuration-${index}`}
        >
          Configuration Model

          <span className="trip-required">
            *
          </span>
        </label>

        <div className="wtg-suggest-input">

          <input
            id={`${prefix}-configuration-${index}`}
            type="text"
            list={`${prefix}-configurations-${index}`}
            value={
              requirement.configuration ||
              ""
            }
            placeholder="Enter configuration"
            autoComplete="off"
            onChange={
              handleWtgVehicleFieldChange(
                index,
                "configuration"
              )
            }
          />

        </div>

        <datalist
          id={`${prefix}-configurations-${index}`}
        >
          {CONFIGURATION_OPTIONS.map(
            (configuration) => (
              <option
                key={configuration}
                value={configuration}
              />
            )
          )}
        </datalist>

      </div>

      {/* ===================================================
          CLASSIFICATION
      =================================================== */}

      <div
        className={`trip-field-group ${isWtg
            ? "wtg-field-classification"
            : "intercarting-field-classification"
          }`}
      >

        <label
          htmlFor={`${prefix}-classification-${index}`}
        >
          Movement Classification

          <span className="trip-required">
            *
          </span>
        </label>

        <div className="trip-select-wrap">

          <select
            id={`${prefix}-classification-${index}`}
            value={
              requirement.classification ||
              ""
            }
            onChange={
              handleWtgVehicleFieldChange(
                index,
                "classification"
              )
            }
          >
            <option value="">
              Select type
            </option>

            {CLASSIFICATION_OPTIONS.map(
              (classification) => (
                <option
                  key={classification}
                  value={classification}
                >
                  {classification}
                </option>
              )
            )}
          </select>

          <span className="trip-select-arrow">
            ⌄
          </span>

        </div>

      </div>

      {/* ===================================================
          QUANTITY
      =================================================== */}

      <div
        className={`trip-field-group ${isWtg
            ? "wtg-field-quantity"
            : "intercarting-field-quantity"
          }`}
      >

        <label
          htmlFor={`${prefix}-quantity-${index}`}
        >
          Quantity

          <span className="trip-required">
            *
          </span>
        </label>

        <div className="wtg-quantity-control">

          <input
            id={`${prefix}-quantity-${index}`}
            type="number"
            min="1"
            step="1"
            value={
              requirement.quantity ??
              "1"
            }
            placeholder="1"
            onChange={
              handleWtgVehicleFieldChange(
                index,
                "quantity"
              )
            }
          />

          <span>
            NOS
          </span>

        </div>

      </div>

      {/* ===================================================
          WEIGHT
      =================================================== */}

      <div
        className={`trip-field-group ${isWtg
            ? "wtg-field-weight"
            : "intercarting-field-weight"
          }`}
      >

        <label
          htmlFor={`${prefix}-weight-${index}`}
        >
          Weight

          <span className="trip-required">
            *
          </span>
        </label>

        <div className="wtg-weight-control">

          <input
            id={`${prefix}-weight-${index}`}
            type="number"
            min="0"
            step="0.01"
            value={
              requirement.weight ??
              ""
            }
            placeholder="0.00"
            onChange={
              handleWtgVehicleFieldChange(
                index,
                "weight"
              )
            }
          />

          <span>
            TON
          </span>

        </div>

      </div>

      {/* ===================================================
          DIMENSIONS
      =================================================== */}

      <div
        className={`trip-field-group wtg-dimensions-group ${isWtg
            ? "wtg-field-dimensions"
            : "intercarting-field-dimensions"
          }`}
      >

        <label>
          Dimensions (L × H × W)
        </label>

        <div className="wtg-dimensions-control">

          <div className="wtg-dimension-part">

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                requirement
                  ?.dimensions
                  ?.length ??
                ""
              }
              placeholder="L"
              aria-label={`Requirement ${index + 1
                } length`}
              onChange={
                handleWtgVehicleFieldChange(
                  index,
                  "length"
                )
              }
            />

          </div>

          <span className="wtg-dimension-separator">
            ×
          </span>

          <div className="wtg-dimension-part">

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                requirement
                  ?.dimensions
                  ?.height ??
                ""
              }
              placeholder="H"
              aria-label={`Requirement ${index + 1
                } height`}
              onChange={
                handleWtgVehicleFieldChange(
                  index,
                  "height"
                )
              }
            />

          </div>

          <span className="wtg-dimension-separator">
            ×
          </span>

          <div className="wtg-dimension-part">

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                requirement
                  ?.dimensions
                  ?.width ??
                ""
              }
              placeholder="W"
              aria-label={`Requirement ${index + 1
                } width`}
              onChange={
                handleWtgVehicleFieldChange(
                  index,
                  "width"
                )
              }
            />

          </div>

          <span className="wtg-dimensions-unit">
            FT
          </span>

        </div>

      </div>

      {/* ===================================================
          REMOVE
      =================================================== */}

      {totalRequirements > 1 && (
        <button
          type="button"
          className="wtg-remove-vehicle-btn"
          onClick={() =>
            handleRemoveWtgVehicle(
              index
            )
          }
          aria-label={`Remove vehicle requirement ${index + 1
            }`}
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
  handleCreateTrip,
  isEditing = false,
  isSaving = false,
}) => {
  if (!showTripModal) {
    return null;
  }

  const requirements =
    Array.isArray(
      tripForm.vehicleRequirements
    )
      ? tripForm.vehicleRequirements
      : [];

  const isWTG =
    tripForm.movementType ===
    "WTG Movement";

  const isIntercartingOrOther =
    [
      "Intercarting",
      "Other",
    ].includes(
      tripForm.movementType
    );

  const isCrane =
    tripForm.movementType ===
    "Crane";

  return (
    <div
      className="trip-modal-overlay"
      onMouseDown={
        handleTripOverlayClick
      }
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

            <span className="trip-modal-subtitle">
              KEY ACCOUNT MANAGEMENT
            </span>

            <div className="trip-modal-title-row">

              <div className="trip-modal-title-copy">

                <h2 id="new-trip-title">
                  {isEditing
                    ? "Edit Trip"
                    : "New Trip Creation"}
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

                  <span className="trip-required">
                    *
                  </span>
                </label>

                <div className="trip-header-select-wrap">

                  <select
                    id="trip-movement-type"
                    value={
                      tripForm.movementType ||
                      ""
                    }
                    onChange={
                      handleMovementTypeChange
                    }
                    disabled={
                      isEditing
                    }
                  >

                    <option value="">
                      Select Movement...
                    </option>

                    <option value="WTG Movement">
                      WTG Movement
                    </option>

                    <option value="Intercarting">
                      Intercarting
                    </option>

                    <option value="Crane">
                      Crane
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                  <span className="trip-header-select-arrow">
                    ⌄
                  </span>

                </div>

              </div>

            </div>

          </div>

          <button
            type="button"
            className="trip-modal-close"
            onClick={
              handleCloseTripModal
            }
            disabled={
              isSaving
            }
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

              <div className="trip-empty-state-icon">
                ↗
              </div>

              <strong>
                Select a movement type
              </strong>

              <p>
                WTG, Intercarting,
                Crane and Other
                movements use
                different operational
                details.
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

                      <strong>
                        WTG Trip Information
                      </strong>

                      <small>
                        Customer, enquiry,
                        placement and route
                        details.
                      </small>

                    </div>
                  </div>

                  <div className="trip-heading-trip-id">

                    <small>
                      TRIP ID
                    </small>

                    <strong>
                      {tripForm.tripId}
                    </strong>

                  </div>

                </div>

                <div className="trip-form-grid">

                  <TripField
                    label="Customer"
                    required
                    value={
                      tripForm.customer
                    }
                    placeholder="Enter customer name"
                    onChange={
                      handleTripFieldChange(
                        "customer"
                      )
                    }
                  />

                  <TripField
                    label="Contact Person"
                    required
                    value={
                      tripForm.contactPerson
                    }
                    placeholder="Enter contact person name"
                    onChange={
                      handleTripFieldChange(
                        "contactPerson"
                      )
                    }
                  />

                  <TripField
                    label="Contact Number"
                    required
                    type="tel"
                    value={
                      tripForm.contactNumber
                    }
                    placeholder="Enter contact number"
                    onChange={
                      handleTripFieldChange(
                        "contactNumber"
                      )
                    }
                  />

                  <TripField
                    label="Email"
                    required
                    type="email"
                    value={
                      tripForm.email
                    }
                    placeholder="Enter contact email"
                    onChange={
                      handleTripFieldChange(
                        "email"
                      )
                    }
                  />

                  <TripField
                    label="Material Type"
                    required
                    value={
                      tripForm.materialType
                    }
                    placeholder="e.g. WTG Blade / Tower Section"
                    onChange={
                      handleTripFieldChange(
                        "materialType"
                      )
                    }
                  />

                  <TripField
                    label="Enquiry Date"
                    required
                    type="date"
                    value={
                      tripForm.enquiryDate
                    }
                    onChange={
                      handleTripFieldChange(
                        "enquiryDate"
                      )
                    }
                  />

                  <TripField
                    label="Placement Date"
                    type="date"
                    value={
                      tripForm.placementDate
                    }
                    onChange={
                      handleTripFieldChange(
                        "placementDate"
                      )
                    }
                  />

                  <TripField
                    label="Assigned KAM"
                    required
                    value={
                      tripForm.assignedKam
                    }
                    placeholder="Enter KAM name"
                    onChange={
                      handleTripFieldChange(
                        "assignedKam"
                      )
                    }
                  />

                  <TripField
                    label="Origin"
                    required
                    value={
                      tripForm.origin
                    }
                    placeholder="Enter origin"
                    onChange={
                      handleTripFieldChange(
                        "origin"
                      )
                    }
                  />

                  <TripField
                    label="Destination"
                    required
                    value={
                      tripForm.destination
                    }
                    placeholder="Enter destination"
                    onChange={
                      handleTripFieldChange(
                        "destination"
                      )
                    }
                  />

                  <TripField
                    label="Distance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      tripForm.distance
                    }
                    placeholder="Enter route distance"
                    unit="KM"
                    onChange={
                      handleTripFieldChange(
                        "distance"
                      )
                    }
                  />

                  <TripField
                    label="Total Vehicles"
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={tripForm.totalVehicles}
                    placeholder="Enter total vehicles"
                    unit="NOS"
                    onChange={handleTripFieldChange("totalVehicles")}
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

                      <strong>
                        WTG Vehicle &amp; Dimensions
                      </strong>

                      <small>
                        Add each vehicle
                        requirement with type,
                        configuration,
                        classification,
                        quantity, weight and
                        dimensions.
                      </small>

                    </div>
                  </div>

                  <button
                    type="button"
                    className="trip-add-vehicle-btn"
                    onClick={
                      handleAddWtgVehicle
                    }
                    title="Add another vehicle requirement"
                  >

                    <span
                      className="trip-add-vehicle-icon"
                      aria-hidden="true"
                    >
                      +
                    </span>

                    <span className="trip-add-vehicle-text">
                      Add Vehicle
                    </span>

                    <span className="trip-add-vehicle-count">
                      {requirements.length}
                    </span>

                  </button>

                </div>

                <div className="wtg-vehicle-rows">

                  {requirements.map(
                    (
                      requirement,
                      index
                    ) => (

                      <VehicleRequirementRow
                        key={
                          requirement.requirementId ||
                          `wtg-${index}`
                        }
                        requirement={
                          requirement
                        }
                        index={
                          index
                        }
                        vehicleTypes={
                          WTG_VEHICLE_TYPES
                        }
                        handleWtgVehicleFieldChange={
                          handleWtgVehicleFieldChange
                        }
                        handleRemoveWtgVehicle={
                          handleRemoveWtgVehicle
                        }
                        totalRequirements={
                          requirements.length
                        }
                        rowType="wtg"
                      />

                    )
                  )}

                </div>

                <div className="trip-field-group trip-field-full wtg-remark-field">

                  <label>
                    Remarks
                  </label>

                  <textarea
                    rows={2}
                    value={
                      tripForm.remark ||
                      ""
                    }
                    placeholder="Enter placement, route, loading or handling remarks..."
                    onChange={
                      handleTripFieldChange(
                        "remark"
                      )
                    }
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
                        {tripForm.movementType ===
                          "Intercarting"
                          ? "Intercarting Details"
                          : "Other Movement Details"}
                      </strong>

                      <small>
                        Customer, site,
                        placement and
                        commercial scope
                        information.
                      </small>

                    </div>
                  </div>

                  <div className="trip-heading-trip-id">

                    <small>
                      TRIP ID
                    </small>

                    <strong>
                      {tripForm.tripId}
                    </strong>

                  </div>

                </div>

                <div className="trip-form-grid">

                  <TripField
                    label="Customer"
                    required
                    value={
                      tripForm.customer
                    }
                    placeholder="Enter customer name"
                    onChange={
                      handleTripFieldChange(
                        "customer"
                      )
                    }
                  />

                  <TripField
                    label="Contact Person"
                    required
                    value={
                      tripForm.contactPerson
                    }
                    placeholder="Enter contact person name"
                    onChange={
                      handleTripFieldChange(
                        "contactPerson"
                      )
                    }
                  />

                  <TripField
                    label="Contact Number"
                    required
                    type="tel"
                    value={
                      tripForm.contactNumber
                    }
                    placeholder="Enter contact number"
                    onChange={
                      handleTripFieldChange(
                        "contactNumber"
                      )
                    }
                  />

                  <TripField
                    label="Email"
                    required
                    type="email"
                    value={
                      tripForm.email
                    }
                    placeholder="Enter email address"
                    onChange={
                      handleTripFieldChange(
                        "email"
                      )
                    }
                  />

                  <TripField
                    label="Material Type"
                    required
                    value={
                      tripForm.materialType
                    }
                    placeholder="Enter material type"
                    onChange={
                      handleTripFieldChange(
                        "materialType"
                      )
                    }
                  />

                  <TripField
                    label="Site Location"
                    value={
                      tripForm.siteLocation
                    }
                    placeholder="Enter site location"
                    onChange={
                      handleTripFieldChange(
                        "siteLocation"
                      )
                    }
                  />

                  <TripField
                    label="Period"
                    value={
                      tripForm.period
                    }
                    placeholder="Enter period"
                    onChange={
                      handleTripFieldChange(
                        "period"
                      )
                    }
                  />

                  {/* DIESEL SCOPE */}

                  <div className="trip-field-group">

                    <label htmlFor="intercarting-diesel-scope">
                      Diesel Scope
                    </label>

                    <div className="trip-select-wrap">

                      <select
                        id="intercarting-diesel-scope"
                        value={
                          tripForm.dieselScope ||
                          ""
                        }
                        onChange={
                          handleTripFieldChange(
                            "dieselScope"
                          )
                        }
                      >

                        <option value="">
                          Select scope
                        </option>

                        {DIESEL_SCOPE_OPTIONS.map(
                          (scope) => (
                            <option
                              key={scope}
                              value={scope}
                            >
                              {scope}
                            </option>
                          )
                        )}

                      </select>

                      <span className="trip-select-arrow">
                        ⌄
                      </span>

                    </div>

                  </div>

                  <TripField
                    label="Enquiry Date"
                    required
                    type="date"
                    value={
                      tripForm.enquiryDate
                    }
                    onChange={
                      handleTripFieldChange(
                        "enquiryDate"
                      )
                    }
                  />

                  <TripField
                    label="Placement Date"
                    type="date"
                    value={
                      tripForm.placementDate
                    }
                    onChange={
                      handleTripFieldChange(
                        "placementDate"
                      )
                    }
                  />

                  <TripField
                    label="Assigned KAM"
                    required
                    value={
                      tripForm.assignedKam
                    }
                    placeholder="Enter KAM name"
                    onChange={
                      handleTripFieldChange(
                        "assignedKam"
                      )
                    }
                  />

                  <TripField
                    label="Origin"
                    value={
                      tripForm.origin
                    }
                    placeholder="Enter origin"
                    onChange={
                      handleTripFieldChange(
                        "origin"
                      )
                    }
                  />

                  <TripField
                    label="Destination"
                    value={
                      tripForm.destination
                    }
                    placeholder="Enter destination"
                    onChange={
                      handleTripFieldChange(
                        "destination"
                      )
                    }
                  />

                  <TripField
                    label="Distance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      tripForm.distance
                    }
                    placeholder="Enter route distance"
                    unit="KM"
                    onChange={
                      handleTripFieldChange(
                        "distance"
                      )
                    }
                  />

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
                        {tripForm.movementType ===
                          "Intercarting"
                          ? "Intercarting Vehicle Details"
                          : "Other Vehicle Details"}
                      </strong>

                      <small>
                        Add each required
                        vehicle with type,
                        configuration,
                        classification,
                        quantity and weight.
                      </small>

                    </div>
                  </div>

                  <button
                    type="button"
                    className="trip-add-vehicle-btn"
                    onClick={
                      handleAddWtgVehicle
                    }
                    title="Add another vehicle requirement"
                  >

                    <span
                      className="trip-add-vehicle-icon"
                      aria-hidden="true"
                    >
                      +
                    </span>

                    <span className="trip-add-vehicle-text">
                      Add Vehicle
                    </span>

                    <span className="trip-add-vehicle-count">
                      {requirements.length}
                    </span>

                  </button>

                </div>

                <div className="intercarting-vehicle-rows">

                  {requirements.map(
                    (
                      requirement,
                      index
                    ) => (

                      <VehicleRequirementRow
                        key={
                          requirement.requirementId ||
                          `intercarting-${index}`
                        }
                        requirement={
                          requirement
                        }
                        index={
                          index
                        }
                        vehicleTypes={
                          primaryVehicleTypes
                        }
                        handleWtgVehicleFieldChange={
                          handleWtgVehicleFieldChange
                        }
                        handleRemoveWtgVehicle={
                          handleRemoveWtgVehicle
                        }
                        totalRequirements={
                          requirements.length
                        }
                        rowType="intercarting"
                      />

                    )
                  )}

                </div>

                <div className="trip-field-group trip-field-full intercarting-remark-field">

                  <label htmlFor="intercarting-remark">
                    Remarks
                  </label>

                  <textarea
                    id="intercarting-remark"
                    rows={2}
                    value={
                      tripForm.remark ||
                      ""
                    }
                    placeholder={
                      tripForm.movementType ===
                        "Intercarting"
                        ? "Enter intercarting, site, vehicle or operational remarks..."
                        : "Enter movement, vehicle or operational remarks..."
                    }
                    onChange={
                      handleTripFieldChange(
                        "remark"
                      )
                    }
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

                      <strong>
                        Crane Trip Details
                      </strong>

                      <small>
                        Customer, material,
                        enquiry, placement
                        and route information.
                      </small>

                    </div>
                  </div>

                  <div className="trip-heading-trip-id">

                    <small>
                      TRIP ID
                    </small>

                    <strong>
                      {tripForm.tripId}
                    </strong>

                  </div>

                </div>

                <div className="trip-form-grid">

                  <TripField
                    label="Customer"
                    required
                    value={
                      tripForm.customer
                    }
                    placeholder="Enter customer name"
                    onChange={
                      handleTripFieldChange(
                        "customer"
                      )
                    }
                  />

                  <TripField
                    label="Contact Person"
                    required
                    value={
                      tripForm.contactPerson
                    }
                    placeholder="Enter contact person name"
                    onChange={
                      handleTripFieldChange(
                        "contactPerson"
                      )
                    }
                  />

                  <TripField
                    label="Contact Number"
                    required
                    type="tel"
                    value={
                      tripForm.contactNumber
                    }
                    placeholder="Enter contact number"
                    onChange={
                      handleTripFieldChange(
                        "contactNumber"
                      )
                    }
                  />

                  <TripField
                    label="Email"
                    required
                    type="email"
                    value={
                      tripForm.email
                    }
                    placeholder="Enter contact email"
                    onChange={
                      handleTripFieldChange(
                        "email"
                      )
                    }
                  />

                  <TripField
                    label="Material Type"
                    required
                    value={
                      tripForm.materialType
                    }
                    placeholder="Enter crane / material type"
                    onChange={
                      handleTripFieldChange(
                        "materialType"
                      )
                    }
                  />

                  <TripField
                    label="Enquiry Date"
                    required
                    type="date"
                    value={
                      tripForm.enquiryDate
                    }
                    onChange={
                      handleTripFieldChange(
                        "enquiryDate"
                      )
                    }
                  />

                  <TripField
                    label="Placement Date"
                    type="date"
                    value={
                      tripForm.placementDate
                    }
                    onChange={
                      handleTripFieldChange(
                        "placementDate"
                      )
                    }
                  />

                  <TripField
                    label="Assigned KAM"
                    required
                    value={
                      tripForm.assignedKam
                    }
                    placeholder="Enter KAM name"
                    onChange={
                      handleTripFieldChange(
                        "assignedKam"
                      )
                    }
                  />

                  <TripField
                    label="Origin"
                    required
                    value={
                      tripForm.origin
                    }
                    placeholder="Enter origin"
                    onChange={
                      handleTripFieldChange(
                        "origin"
                      )
                    }
                  />

                  <TripField
                    label="Destination"
                    required
                    value={
                      tripForm.destination
                    }
                    placeholder="Enter destination"
                    onChange={
                      handleTripFieldChange(
                        "destination"
                      )
                    }
                  />

                  <TripField
                    label="Distance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      tripForm.distance
                    }
                    placeholder="Enter route distance"
                    unit="KM"
                    onChange={
                      handleTripFieldChange(
                        "distance"
                      )
                    }
                  />

                </div>

              </section>

              {/* ===========================================
                  CRANE VEHICLE REQUIREMENTS
              =========================================== */}

              <section className="trip-form-section">

                <div className="trip-section-heading">

                  <div>
                    <div>

                      <strong>
                        Vehicle Requirements
                      </strong>

                      <small>
                        Add the required
                        vehicle types and
                        quantities for this
                        crane movement.
                      </small>

                    </div>
                  </div>

                  <button
                    type="button"
                    className="trip-add-vehicle-btn"
                    onClick={
                      handleAddWtgVehicle
                    }
                    title="Add another vehicle requirement"
                  >

                    <span
                      className="trip-add-vehicle-icon"
                      aria-hidden="true"
                    >
                      +
                    </span>

                    <span className="trip-add-vehicle-text">
                      Add Vehicle
                    </span>

                    <span className="trip-add-vehicle-count">
                      {requirements.length}
                    </span>

                  </button>

                </div>

                <div className="intercarting-vehicle-rows">

                  {requirements.map(
                    (
                      requirement,
                      index
                    ) => (

                      <VehicleRequirementRow
                        key={
                          requirement.requirementId ||
                          `crane-${index}`
                        }
                        requirement={
                          requirement
                        }
                        index={
                          index
                        }
                        vehicleTypes={
                          primaryVehicleTypes
                        }
                        handleWtgVehicleFieldChange={
                          handleWtgVehicleFieldChange
                        }
                        handleRemoveWtgVehicle={
                          handleRemoveWtgVehicle
                        }
                        totalRequirements={
                          requirements.length
                        }
                        rowType="intercarting"
                      />

                    )
                  )}

                </div>

                {/* SUPPORTING DOCUMENT */}

                <div className="trip-form-grid">

                  <div className="trip-field-group trip-field-full">

                    <label>
                      Upload File
                    </label>

                    <label className="trip-file-upload">

                      <input
                        type="file"
                        onChange={
                          handleTripFileChange
                        }
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      />

                      <span className="trip-file-icon">
                        ↑
                      </span>

                      <span className="trip-file-content">

                        <strong>
                          {tripUpload
                            ? tripUpload.name
                            : "Choose supporting document"}
                        </strong>

                        <small>
                          PDF, Word, Excel,
                          JPG or PNG
                        </small>

                      </span>

                      <span className="trip-file-action">
                        Browse
                      </span>

                    </label>

                  </div>

                </div>

                <div className="trip-field-group trip-field-full crane-remark-field">

                  <label htmlFor="crane-remark">
                    Remarks
                  </label>

                  <textarea
                    id="crane-remark"
                    rows={2}
                    value={
                      tripForm.remark ||
                      ""
                    }
                    placeholder="Enter crane, lifting, route, vehicle or operational remarks..."
                    onChange={
                      handleTripFieldChange(
                        "remark"
                      )
                    }
                  />

                </div>

              </section>

            </>
          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="trip-modal-actions">

          <button
            type="button"
            className="trip-btn-outline"
            onClick={
              handleCloseTripModal
            }
            disabled={
              isSaving
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="trip-btn-primary"
            onClick={
              handleCreateTrip
            }
            disabled={
              isSaving ||
              !tripForm.movementType
            }
          >
            {isSaving
              ? isEditing
                ? "Saving Changes..."
                : "Creating Trip..."
              : isEditing
                ? "Save Changes"
                : "Create Trip"}
          </button>

        </div>

      </div>

    </div>
  );
};

export default Tripcreatemodal;