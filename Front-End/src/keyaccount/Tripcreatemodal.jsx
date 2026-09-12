import React from "react";
// import "../keyaccount/Tripcreatemodal.css";
import "./tripcreatemodal.css";


const WTG_VEHICLE_TYPES = [
    "Low Bed Trailer",
    "Hydraulic Axle Trailer",
    "Multi Axle Trailer",
    "Flatbed Trailer",
    "Extendable Trailer",
    "Modular Hydraulic Trailer",
    "SPMT",
];


const WTG_CONFIGURATION_MODELS = [
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


const WTG_MOVEMENT_CLASSIFICATIONS = [
    "ODC",
    "Non-ODC",
];


const DIESEL_SCOPE_OPTIONS = [
    "Client Scope",
    "OTC Scope",
];


/* =========================================================
   COMMON INPUT FIELD
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
            />

        )}

    </div>
);


/* =========================================================
   TRIP CREATE MODAL
========================================================= */

const Tripcreatemodal = ({
    showTripModal,
    tripForm,
    tripUpload,
    primaryVehicleTypes,
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

                {/* =====================================================
                    HEADER
                ===================================================== */}

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
                                        ? "Update customer, contact, route, cargo and vehicle details."
                                        : "Enter customer, contact, route, cargo and vehicle details."}

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
                                        value={tripForm.movementType}
                                        onChange={handleMovementTypeChange}
                                        disabled={isEditing}
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
                        onClick={handleCloseTripModal}
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>


                {/* =====================================================
                    MODAL BODY
                ===================================================== */}

                <div className="trip-modal-body">


                    {/* =================================================
                        EMPTY STATE
                    ================================================= */}

                    {!tripForm.movementType && (

                        <div className="trip-empty-state">

                            <div className="trip-empty-state-icon">
                                ↗
                            </div>

                            <strong>
                                Select a movement type
                            </strong>

                            <p>
                                WTG, Intercarting, Crane and Other
                                movements use different operational
                                fields.
                            </p>

                        </div>

                    )}


                    {/* =================================================
                        WTG MOVEMENT
                    ================================================= */}

                    {tripForm.movementType === "WTG Movement" && (

                        <>

                            {/* =========================================
                                WTG TRIP INFORMATION
                            ========================================= */}

                            <section className="trip-form-section">

                                <div className="trip-section-heading">

                                    <div>

                                        <div>

                                            <strong>
                                                WTG Trip Information
                                            </strong>

                                            <small>
                                                Commercial, enquiry,
                                                placement and route details.
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


                                    {/* CUSTOMER */}

                                    <TripField
                                        label="Customer"
                                        required
                                        value={tripForm.companyName}
                                        placeholder="Enter customer name"
                                        onChange={handleTripFieldChange(
                                            "companyName"
                                        )}
                                    />


                                    {/* CONTACT PERSON */}

                                    <TripField
                                        label="Contact Person"
                                        required
                                        value={tripForm.client}
                                        placeholder="Enter contact person name"
                                        onChange={handleTripFieldChange(
                                            "client"
                                        )}
                                    />


                                    {/* CONTACT NUMBER */}

                                    <TripField
                                        label="Contact Number"
                                        required
                                        type="tel"
                                        value={tripForm.clientContact}
                                        placeholder="Enter contact number"
                                        onChange={handleTripFieldChange(
                                            "clientContact"
                                        )}
                                    />


                                    {/* EMAIL */}

                                    <TripField
                                        label="Email"
                                        required
                                        type="email"
                                        value={tripForm.clientEmail}
                                        placeholder="Enter contact email"
                                        onChange={handleTripFieldChange(
                                            "clientEmail"
                                        )}
                                    />


                                    {/* CARGO TYPE */}

                                    <TripField
                                        label="Cargo Type"
                                        required
                                        value={tripForm.cargo}
                                        placeholder="e.g. WTG Blade / Tower Section"
                                        onChange={handleTripFieldChange(
                                            "cargo"
                                        )}
                                    />


                                    {/* ENQUIRY DATE */}

                                    <TripField
                                        label="Enquiry Date"
                                        required
                                        type="date"
                                        value={tripForm.enquiryDate}
                                        onChange={handleTripFieldChange(
                                            "enquiryDate"
                                        )}
                                    />


                                    {/* DEPLOYMENT DATE */}

                                    <TripField
                                        label="Deployment Date"
                                        required
                                        type="date"
                                        value={tripForm.placementDate}
                                        onChange={handleTripFieldChange(
                                            "placementDate"
                                        )}
                                    />


                                    {/* ASSIGNED KAM */}

                                    <TripField
                                        label="Assigned KAM"
                                        required
                                        type="text"
                                        value={tripForm.assignedKam}
                                        placeholder="Enter KAM name"
                                        onChange={handleTripFieldChange(
                                            "assignedKam"
                                        )}
                                    />


                                    {/* TOTAL VEHICLE COUNT */}

                                    <TripField
                                        label="Vehicles"
                                        required
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={tripForm.totalVehicleCount}
                                        placeholder="Enter vehicle count"
                                        onChange={handleTripFieldChange(
                                            "totalVehicleCount"
                                        )}
                                    />


                                    {/* ORIGIN */}

                                    <TripField
                                        label="Origin"
                                        required
                                        value={tripForm.origin}
                                        placeholder="Enter origin"
                                        onChange={handleTripFieldChange(
                                            "origin"
                                        )}
                                    />


                                    {/* DESTINATION */}

                                    <TripField
                                        label="Destination"
                                        required
                                        value={tripForm.destination}
                                        placeholder="Enter destination"
                                        onChange={handleTripFieldChange(
                                            "destination"
                                        )}
                                    />


                                    {/* ESTIMATED KM */}

                                    <TripField
                                        label="Estimated KM"
                                        required
                                        type="number"
                                        min="0"
                                        value={tripForm.estimatedDistance}
                                        placeholder="Enter estimated distance"
                                        unit="KM"
                                        onChange={handleTripFieldChange(
                                            "estimatedDistance"
                                        )}
                                    />

                                </div>

                            </section>


                            {/* =========================================
                                WTG VEHICLE DETAILS
                            ========================================= */}

                            <section className="trip-form-section">

                                <div className="trip-section-heading">

                                    <div>

                                        <div>

                                            <strong>
                                                WTG Vehicle &amp; Dimensions
                                            </strong>

                                            <small>
                                                Add each required vehicle
                                                with its type and dimensions.
                                            </small>

                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        className="trip-add-vehicle-btn"
                                        onClick={handleAddWtgVehicle}
                                        title="Add another vehicle"
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
                                            {tripForm.vehicles.length}
                                        </span>

                                    </button>

                                </div>


                                <div className="wtg-vehicle-rows">

                                    {tripForm.vehicles.map(
                                        (vehicle, index) => (

                                            <div
                                                className={`wtg-vehicle-row ${
                                                    index > 0
                                                        ? "wtg-vehicle-row-compact"
                                                        : ""
                                                }`}
                                                key={`wtg-vehicle-${index}`}
                                            >

                                                <div className="wtg-vehicle-index">
                                                    {index + 1}
                                                </div>


                                                {/* VEHICLE TYPE */}

                                                <div className="trip-field-group wtg-field-vehicle-type">

                                                    <label
                                                        htmlFor={`wtg-vehicle-type-${index}`}
                                                    >
                                                        Vehicle Type

                                                        <span className="trip-required">
                                                            *
                                                        </span>
                                                    </label>


                                                    <div className="wtg-suggest-input">

                                                        <input
                                                            id={`wtg-vehicle-type-${index}`}
                                                            type="text"
                                                            list={`wtg-vehicle-types-${index}`}
                                                            value={
                                                                vehicle.vehicleType
                                                            }
                                                            placeholder="Enter vehicle type"
                                                            autoComplete="off"
                                                            onChange={handleWtgVehicleFieldChange(
                                                                index,
                                                                "vehicleType"
                                                            )}
                                                        />

                                                    </div>


                                                    <datalist
                                                        id={`wtg-vehicle-types-${index}`}
                                                    >

                                                        {WTG_VEHICLE_TYPES.map(
                                                            (vehicleType) => (

                                                                <option
                                                                    key={
                                                                        vehicleType
                                                                    }
                                                                    value={
                                                                        vehicleType
                                                                    }
                                                                />

                                                            )
                                                        )}

                                                    </datalist>

                                                </div>


                                                {/* CONFIGURATION */}

                                                <div className="trip-field-group wtg-field-configuration">

                                                    <label
                                                        htmlFor={`wtg-configuration-${index}`}
                                                    >
                                                        Configuration Model{" "}

                                                        <span className="trip-required">
                                                            *
                                                        </span>

                                                    </label>


                                                    <div className="wtg-suggest-input">

                                                        <input
                                                            id={`wtg-configuration-${index}`}
                                                            type="text"
                                                            list={`wtg-configuration-models-${index}`}
                                                            value={
                                                                vehicle.configurationModel
                                                            }
                                                            placeholder="Enter configuration"
                                                            autoComplete="off"
                                                            onChange={handleWtgVehicleFieldChange(
                                                                index,
                                                                "configurationModel"
                                                            )}
                                                        />

                                                    </div>


                                                    <datalist
                                                        id={`wtg-configuration-models-${index}`}
                                                    >

                                                        {WTG_CONFIGURATION_MODELS.map(
                                                            (model) => (

                                                                <option
                                                                    key={model}
                                                                    value={model}
                                                                />

                                                            )
                                                        )}

                                                    </datalist>

                                                </div>


                                                {/* MOVEMENT CLASSIFICATION */}

                                                <div className="trip-field-group wtg-field-classification">

                                                    <label
                                                        htmlFor={`wtg-classification-${index}`}
                                                    >
                                                        Movement Classification{" "}

                                                        <span className="trip-required">
                                                            *
                                                        </span>

                                                    </label>


                                                    <div className="trip-select-wrap">

                                                        <select
                                                            id={`wtg-classification-${index}`}
                                                            value={
                                                                vehicle.movementClassification
                                                            }
                                                            onChange={handleWtgVehicleFieldChange(
                                                                index,
                                                                "movementClassification"
                                                            )}
                                                        >

                                                            <option value="">
                                                                Select type
                                                            </option>


                                                            {WTG_MOVEMENT_CLASSIFICATIONS.map(
                                                                (
                                                                    classification
                                                                ) => (

                                                                    <option
                                                                        key={
                                                                            classification
                                                                        }
                                                                        value={
                                                                            classification
                                                                        }
                                                                    >
                                                                        {
                                                                            classification
                                                                        }
                                                                    </option>

                                                                )
                                                            )}

                                                        </select>


                                                        <span className="trip-select-arrow">
                                                            ⌄
                                                        </span>

                                                    </div>

                                                </div>


                                                {/* QUANTITY */}

                                                <div className="trip-field-group wtg-field-quantity">

                                                    <label
                                                        htmlFor={`wtg-quantity-${index}`}
                                                    >
                                                        Quantity

                                                        <span className="trip-required">
                                                            *
                                                        </span>
                                                    </label>


                                                    <div className="wtg-quantity-control">

                                                        <input
                                                            id={`wtg-quantity-${index}`}
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            value={
                                                                vehicle.quantity
                                                            }
                                                            placeholder="1"
                                                            onChange={handleWtgVehicleFieldChange(
                                                                index,
                                                                "quantity"
                                                            )}
                                                        />

                                                        <span>
                                                            NOS
                                                        </span>

                                                    </div>

                                                </div>


                                                {/* WEIGHT */}

                                                <div className="trip-field-group wtg-field-weight">

                                                    <label
                                                        htmlFor={`wtg-weight-${index}`}
                                                    >
                                                        Weight

                                                        <span className="trip-required">
                                                            *
                                                        </span>
                                                    </label>


                                                    <div className="wtg-weight-control">

                                                        <input
                                                            id={`wtg-weight-${index}`}
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                vehicle.weight
                                                            }
                                                            placeholder="0.00"
                                                            onChange={handleWtgVehicleFieldChange(
                                                                index,
                                                                "weight"
                                                            )}
                                                        />

                                                        <span>
                                                            TON
                                                        </span>

                                                    </div>

                                                </div>


                                                {/* DIMENSIONS */}

                                                <div className="trip-field-group wtg-dimensions-group wtg-field-dimensions">

                                                    <label>
                                                        Dimensions (L × H × W){" "}

                                                        <span className="trip-required">
                                                            *
                                                        </span>
                                                    </label>


                                                    <div className="wtg-dimensions-control">


                                                        {/* LENGTH */}

                                                        <div className="wtg-dimension-part">

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    vehicle.length
                                                                }
                                                                placeholder="L"
                                                                aria-label={`Vehicle ${
                                                                    index + 1
                                                                } length in feet`}
                                                                onChange={handleWtgVehicleFieldChange(
                                                                    index,
                                                                    "length"
                                                                )}
                                                            />

                                                        </div>


                                                        <span className="wtg-dimension-separator">
                                                            ×
                                                        </span>


                                                        {/* HEIGHT */}

                                                        <div className="wtg-dimension-part">

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    vehicle.height
                                                                }
                                                                placeholder="H"
                                                                aria-label={`Vehicle ${
                                                                    index + 1
                                                                } height in feet`}
                                                                onChange={handleWtgVehicleFieldChange(
                                                                    index,
                                                                    "height"
                                                                )}
                                                            />

                                                        </div>


                                                        <span className="wtg-dimension-separator">
                                                            ×
                                                        </span>


                                                        {/* WIDTH */}

                                                        <div className="wtg-dimension-part">

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    vehicle.width
                                                                }
                                                                placeholder="W"
                                                                aria-label={`Vehicle ${
                                                                    index + 1
                                                                } width in feet`}
                                                                onChange={handleWtgVehicleFieldChange(
                                                                    index,
                                                                    "width"
                                                                )}
                                                            />

                                                        </div>


                                                        <span className="wtg-dimensions-unit">
                                                            FT
                                                        </span>

                                                    </div>

                                                </div>


                                                {/* REMOVE VEHICLE */}

                                                {tripForm.vehicles.length >
                                                    1 && (

                                                    <button
                                                        type="button"
                                                        className="wtg-remove-vehicle-btn"
                                                        onClick={() =>
                                                            handleRemoveWtgVehicle(
                                                                index
                                                            )
                                                        }
                                                        aria-label={`Remove vehicle ${
                                                            index + 1
                                                        }`}
                                                        title="Remove vehicle"
                                                    >
                                                        ×
                                                    </button>

                                                )}

                                            </div>

                                        )
                                    )}

                                </div>


                                {/* REMARK */}

                                <div className="trip-field-group trip-field-full wtg-remark-field">

                                    <label>
                                        Remarks
                                    </label>

                                    <textarea
                                        rows={2}
                                        value={tripForm.remark}
                                        placeholder="Enter placement, route, loading or handling remarks..."
                                        onChange={handleTripFieldChange(
                                            "remark"
                                        )}
                                    />

                                </div>

                            </section>

                        </>

                    )}


                    {/* =================================================
                        INTERCARTING / OTHER
                    ================================================= */}

                    {[
                        "Intercarting",
                        "Other",
                    ].includes(tripForm.movementType) && (

                        <>

                            {/* =========================================
                                BASIC DETAILS
                            ========================================= */}

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
                                                Customer, contact, site,
                                                deployment and commercial
                                                scope information.
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


                                    {/* CUSTOMER */}

                                    <TripField
                                        label="Customer"
                                        required
                                        value={tripForm.companyName}
                                        placeholder="Enter customer name"
                                        onChange={handleTripFieldChange(
                                            "companyName"
                                        )}
                                    />


                                    {/* CONTACT PERSON */}

                                    <TripField
                                        label="Contact Person"
                                        required
                                        value={tripForm.client}
                                        placeholder="Enter contact person name"
                                        onChange={handleTripFieldChange(
                                            "client"
                                        )}
                                    />


                                    {/* CONTACT NUMBER */}

                                    <TripField
                                        label="Contact Number"
                                        required
                                        type="tel"
                                        value={tripForm.clientContact}
                                        placeholder="Enter contact number"
                                        onChange={handleTripFieldChange(
                                            "clientContact"
                                        )}
                                    />


                                    {/* EMAIL */}

                                    <TripField
                                        label="Email"
                                        required
                                        type="email"
                                        value={tripForm.clientEmail}
                                        placeholder="Enter email address"
                                        onChange={handleTripFieldChange(
                                            "clientEmail"
                                        )}
                                    />


                                    {/* SITE LOCATION */}

                                    <TripField
                                        label="Site Location"
                                        required
                                        value={tripForm.siteLocation}
                                        placeholder="Enter site location"
                                        onChange={handleTripFieldChange(
                                            "siteLocation"
                                        )}
                                    />


                                    {/* PERIOD */}

                                    <TripField
                                        label="Period"
                                        required
                                        value={tripForm.period}
                                        placeholder="Enter period"
                                        onChange={handleTripFieldChange(
                                            "period"
                                        )}
                                    />


                                    {/* DIESEL SCOPE */}

                                    <div className="trip-field-group">

                                        <label htmlFor="intercarting-diesel-scope">

                                            Diesel Scope{" "}

                                            <span className="trip-required">
                                                *
                                            </span>

                                        </label>


                                        <div className="trip-select-wrap">

                                            <select
                                                id="intercarting-diesel-scope"
                                                value={
                                                    tripForm.dieselScope
                                                }
                                                onChange={handleTripFieldChange(
                                                    "dieselScope"
                                                )}
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


                                    {/* TOTAL QUANTITY */}

                                    <TripField
                                        label="Total Quantity"
                                        required
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={tripForm.totalQuantity}
                                        placeholder="Enter quantity"
                                        unit="NOS"
                                        onChange={handleTripFieldChange(
                                            "totalQuantity"
                                        )}
                                    />


                                    {/* ENQUIRY DATE */}

                                    <TripField
                                        label="Enquiry Date"
                                        required
                                        type="date"
                                        value={tripForm.enquiryDate}
                                        onChange={handleTripFieldChange(
                                            "enquiryDate"
                                        )}
                                    />


                                    {/* DEPLOYMENT DATE */}

                                    <TripField
                                        label="Deployment Date"
                                        required
                                        type="date"
                                        value={tripForm.deploymentDate}
                                        onChange={handleTripFieldChange(
                                            "deploymentDate"
                                        )}
                                    />


                                    {/* ASSIGNED KAM */}

                                    <TripField
                                        label="Assigned KAM"
                                        required
                                        type="text"
                                        value={tripForm.assignedKam}
                                        placeholder="Enter KAM name"
                                        onChange={handleTripFieldChange(
                                            "assignedKam"
                                        )}
                                    />


                                    {/* TOTAL VEHICLE COUNT */}

                                    <TripField
                                        label="Vehicles"
                                        required
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={tripForm.totalVehicleCount}
                                        placeholder="Enter vehicle count"
                                        onChange={handleTripFieldChange(
                                            "totalVehicleCount"
                                        )}
                                    />

                                </div>

                            </section>


                            {/* =========================================
                                INTERCARTING VEHICLE DETAILS
                            ========================================= */}

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
                                                Add each required vehicle
                                                with type, configuration,
                                                classification and weight.
                                            </small>

                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        className="trip-add-vehicle-btn"
                                        onClick={handleAddWtgVehicle}
                                        title="Add another vehicle"
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
                                            {tripForm.vehicles.length}
                                        </span>

                                    </button>

                                </div>


                                <div className="intercarting-vehicle-rows">

                                    {tripForm.vehicles.map(
                                        (vehicle, index) => (

                                            <div
                                                className={`intercarting-vehicle-row ${
                                                    index > 0
                                                        ? "intercarting-vehicle-row-compact"
                                                        : ""
                                                }`}
                                                key={`intercarting-vehicle-${index}`}
                                            >

                                                <div className="intercarting-vehicle-index">
                                                    {index + 1}
                                                </div>


                                                {/* VEHICLE TYPE */}

                                                <div className="trip-field-group intercarting-field-vehicle-type">

                                                    <label
                                                        htmlFor={`intercarting-vehicle-type-${index}`}
                                                    >
                                                        Vehicle Type{" "}

                                                        <span className="trip-required">
                                                            *
                                                        </span>

                                                    </label>


                                                    <div className="wtg-suggest-input">

                                                        <input
                                                            id={`intercarting-vehicle-type-${index}`}
                                                            type="text"
                                                            list={`intercarting-vehicle-types-${index}`}
                                                            value={
                                                                vehicle.vehicleType
                                                            }
                                                            placeholder="Enter vehicle type"
                                                            autoComplete="off"
                                                            onChange={handleWtgVehicleFieldChange(
                                                                index,
                                                                "vehicleType"
                                                            )}
                                                        />

                                                    </div>


                                                    <datalist
                                                        id={`intercarting-vehicle-types-${index}`}
                                                    >

                                                        {primaryVehicleTypes.map(
                                                            (vehicleType) => (

                                                                <option
                                                                    key={
                                                                        vehicleType
                                                                    }
                                                                    value={
                                                                        vehicleType
                                                                    }
                                                                />

                                                            )
                                                        )}

                                                    </datalist>

                                                </div>


                                                {/* CONFIGURATION */}

                                                <div className="trip-field-group intercarting-field-configuration">

                                                    <label
                                                        htmlFor={`intercarting-configuration-${index}`}
                                                    >
                                                        Configuration Model{" "}

                                                        <span className="trip-required">
                                                            *
                                                        </span>

                                                    </label>


                                                    <div className="wtg-suggest-input">

                                                        <input
                                                            id={`intercarting-configuration-${index}`}
                                                            type="text"
                                                            list={`intercarting-configurations-${index}`}
                                                            value={
                                                                vehicle.configurationModel
                                                            }
                                                            placeholder="Enter configuration"
                                                            autoComplete="off"
                                                            onChange={handleWtgVehicleFieldChange(
                                                                index,
                                                                "configurationModel"
                                                            )}
                                                        />

                                                    </div>


                                                    <datalist
                                                        id={`intercarting-configurations-${index}`}
                                                    >

                                                        {WTG_CONFIGURATION_MODELS.map(
                                                            (model) => (

                                                                <option
                                                                    key={model}
                                                                    value={model}
                                                                />

                                                            )
                                                        )}

                                                    </datalist>

                                                </div>


                                                {/* CLASSIFICATION */}

                                                <div className="trip-field-group intercarting-field-classification">

                                                    <label
                                                        htmlFor={`intercarting-classification-${index}`}
                                                    >
                                                        Movement Classification{" "}

                                                        <span className="trip-required">
                                                            *
                                                        </span>

                                                    </label>


                                                    <div className="trip-select-wrap">

                                                        <select
                                                            id={`intercarting-classification-${index}`}
                                                            value={
                                                                vehicle.movementClassification
                                                            }
                                                            onChange={handleWtgVehicleFieldChange(
                                                                index,
                                                                "movementClassification"
                                                            )}
                                                        >

                                                            <option value="">
                                                                Select type
                                                            </option>


                                                            {WTG_MOVEMENT_CLASSIFICATIONS.map(
                                                                (
                                                                    classification
                                                                ) => (

                                                                    <option
                                                                        key={
                                                                            classification
                                                                        }
                                                                        value={
                                                                            classification
                                                                        }
                                                                    >
                                                                        {
                                                                            classification
                                                                        }
                                                                    </option>

                                                                )
                                                            )}

                                                        </select>


                                                        <span className="trip-select-arrow">
                                                            ⌄
                                                        </span>

                                                    </div>

                                                </div>


                                                {/* QUANTITY */}

                                                <div className="trip-field-group intercarting-field-quantity">

                                                    <label
                                                        htmlFor={`intercarting-quantity-${index}`}
                                                    >
                                                        Quantity{" "}

                                                        <span className="trip-required">
                                                            *
                                                        </span>

                                                    </label>


                                                    <div className="wtg-quantity-control">

                                                        <input
                                                            id={`intercarting-quantity-${index}`}
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            value={
                                                                vehicle.quantity
                                                            }
                                                            placeholder="1"
                                                            onChange={handleWtgVehicleFieldChange(
                                                                index,
                                                                "quantity"
                                                            )}
                                                        />

                                                        <span>
                                                            NOS
                                                        </span>

                                                    </div>

                                                </div>


                                                {/* WEIGHT */}

                                                <div className="trip-field-group intercarting-field-weight">

                                                    <label
                                                        htmlFor={`intercarting-weight-${index}`}
                                                    >
                                                        Weight{" "}

                                                        <span className="trip-required">
                                                            *
                                                        </span>

                                                    </label>


                                                    <div className="wtg-weight-control">

                                                        <input
                                                            id={`intercarting-weight-${index}`}
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                vehicle.weight
                                                            }
                                                            placeholder="0.00"
                                                            onChange={handleWtgVehicleFieldChange(
                                                                index,
                                                                "weight"
                                                            )}
                                                        />

                                                        <span>
                                                            TON
                                                        </span>

                                                    </div>

                                                </div>


                                                {/* REMOVE */}

                                                {tripForm.vehicles.length >
                                                    1 && (

                                                    <button
                                                        type="button"
                                                        className="wtg-remove-vehicle-btn"
                                                        onClick={() =>
                                                            handleRemoveWtgVehicle(
                                                                index
                                                            )
                                                        }
                                                        aria-label={`Remove vehicle ${
                                                            index + 1
                                                        }`}
                                                        title="Remove vehicle"
                                                    >
                                                        ×
                                                    </button>

                                                )}

                                            </div>

                                        )
                                    )}

                                </div>


                                {/* REMARK */}

                                <div className="trip-field-group trip-field-full intercarting-remark-field">

                                    <label htmlFor="intercarting-remark">
                                        Remarks
                                    </label>


                                    <textarea
                                        id="intercarting-remark"
                                        rows={2}
                                        value={tripForm.remark || ""}
                                        placeholder={
                                            tripForm.movementType ===
                                            "Intercarting"
                                                ? "Enter intercarting, site, vehicle or operational remarks..."
                                                : "Enter movement, vehicle or operational remarks..."
                                        }
                                        onChange={handleTripFieldChange(
                                            "remark"
                                        )}
                                    />

                                </div>

                            </section>

                        </>

                    )}


                    {/* =================================================
                        CRANE MOVEMENT
                    ================================================= */}

                    {tripForm.movementType === "Crane" && (

                        <>

                            {/* =========================================
                                CRANE TRIP DETAILS
                            ========================================= */}

                            <section className="trip-form-section">

                                <div className="trip-section-heading">

                                    <div>

                                        <div>

                                            <strong>
                                                Crane Trip Details
                                            </strong>

                                            <small>
                                                Customer, contact, cargo,
                                                enquiry, placement and route
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


                                    {/* CUSTOMER */}

                                    <TripField
                                        label="Customer"
                                        required
                                        value={tripForm.companyName}
                                        placeholder="Enter customer name"
                                        onChange={handleTripFieldChange(
                                            "companyName"
                                        )}
                                    />


                                    {/* CONTACT PERSON */}

                                    <TripField
                                        label="Contact Person"
                                        required
                                        value={tripForm.client}
                                        placeholder="Enter contact person name"
                                        onChange={handleTripFieldChange(
                                            "client"
                                        )}
                                    />


                                    {/* CONTACT NUMBER */}

                                    <TripField
                                        label="Contact Number"
                                        required
                                        type="tel"
                                        value={tripForm.clientContact}
                                        placeholder="Enter contact number"
                                        onChange={handleTripFieldChange(
                                            "clientContact"
                                        )}
                                    />


                                    {/* EMAIL */}

                                    <TripField
                                        label="Email"
                                        required
                                        type="email"
                                        value={tripForm.clientEmail}
                                        placeholder="Enter contact email"
                                        onChange={handleTripFieldChange(
                                            "clientEmail"
                                        )}
                                    />


                                    {/* CRANE NAME */}

                                    <TripField
                                        label="Crane Name"
                                        required
                                        value={tripForm.cargo}
                                        placeholder="Enter Crane type"
                                        onChange={handleTripFieldChange(
                                            "cargo"
                                        )}
                                    />


                                    {/* CRANE WEIGHT */}

                                    <TripField
                                        label="Weight"
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={tripForm.weight}
                                        placeholder="Enter crane weight"
                                        unit="TON"
                                        onChange={handleTripFieldChange(
                                            "weight"
                                        )}
                                    />


                                    {/* REQUIRED VEHICLES */}

                                    <TripField
                                        label="Required Vehicles"
                                        required
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={tripForm.requiredVehicles}
                                        placeholder="Enter required vehicle quantity"
                                        onChange={handleTripFieldChange(
                                            "requiredVehicles"
                                        )}
                                    />


                                    {/* PRIMARY VEHICLE */}

                                    <div className="trip-field-group">

                                        <label htmlFor="crane-primary-vehicle-type">

                                            Primary Vehicle Type

                                            <span className="trip-required">
                                                *
                                            </span>

                                        </label>


                                        <div className="trip-select-wrap">

                                            <select
                                                id="crane-primary-vehicle-type"
                                                value={
                                                    tripForm.primaryVehicleType ||
                                                    ""
                                                }
                                                onChange={handleTripFieldChange(
                                                    "primaryVehicleType"
                                                )}
                                            >

                                                <option value="">
                                                    Select vehicle type
                                                </option>


                                                {primaryVehicleTypes.map(
                                                    (vehicleType) => (

                                                        <option
                                                            key={
                                                                vehicleType
                                                            }
                                                            value={
                                                                vehicleType
                                                            }
                                                        >
                                                            {vehicleType}
                                                        </option>

                                                    )
                                                )}

                                            </select>


                                            <span className="trip-select-arrow">
                                                ⌄
                                            </span>

                                        </div>

                                    </div>


                                    {/* ESTIMATED KM */}

                                    <TripField
                                        label="Estimated KM"
                                        required
                                        type="number"
                                        min="0"
                                        value={tripForm.estimatedDistance}
                                        placeholder="Enter estimated distance"
                                        unit="KM"
                                        onChange={handleTripFieldChange(
                                            "estimatedDistance"
                                        )}
                                    />


                                    {/* ENQUIRY DATE */}

                                    <TripField
                                        label="Enquiry Date"
                                        required
                                        type="date"
                                        value={tripForm.enquiryDate}
                                        onChange={handleTripFieldChange(
                                            "enquiryDate"
                                        )}
                                    />


                                    {/* PLACEMENT DATE */}

                                    <TripField
                                        label="Deployment Date"
                                        required
                                        type="date"
                                        value={tripForm.placementDate}
                                        onChange={handleTripFieldChange(
                                            "placementDate"
                                        )}
                                    />


                                    {/* ORIGIN */}

                                    <TripField
                                        label="Origin"
                                        required
                                        value={tripForm.origin}
                                        placeholder="Enter origin"
                                        onChange={handleTripFieldChange(
                                            "origin"
                                        )}
                                    />


                                    {/* DESTINATION */}

                                    <TripField
                                        label="Destination"
                                        required
                                        value={tripForm.destination}
                                        placeholder="Enter destination"
                                        onChange={handleTripFieldChange(
                                            "destination"
                                        )}
                                    />


                                    {/* ASSIGNED KAM */}

                                    <TripField
                                        label="Assigned KAM"
                                        required
                                        type="text"
                                        value={tripForm.assignedKam}
                                        placeholder="Enter KAM name"
                                        onChange={handleTripFieldChange(
                                            "assignedKam"
                                        )}
                                    />


                                    {/* TOTAL VEHICLE COUNT */}

                                    <TripField
                                        label="Vehicles"
                                        required
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={tripForm.totalVehicleCount}
                                        placeholder="Enter vehicle count"
                                        onChange={handleTripFieldChange(
                                            "totalVehicleCount"
                                        )}
                                    />

                                </div>

                            </section>


                            {/* =========================================
                                VEHICLE & DOCUMENT
                            ========================================= */}

                            <section className="trip-form-section">

                                <div className="trip-section-heading">

                                    <div>

                                        <div>

                                            <strong>
                                                Vehicle &amp; Document
                                            </strong>

                                            <small>
                                                Select the primary vehicle
                                                type and attach the
                                                supporting document.
                                            </small>

                                        </div>

                                    </div>

                                </div>


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


                                {/* REMARK */}

                                <div className="trip-field-group trip-field-full crane-remark-field">

                                    <label htmlFor="crane-remark">
                                        Remarks
                                    </label>


                                    <textarea
                                        id="crane-remark"
                                        rows={2}
                                        value={tripForm.remark || ""}
                                        placeholder="Enter crane, lifting, route, vehicle or operational remarks..."
                                        onChange={handleTripFieldChange(
                                            "remark"
                                        )}
                                    />

                                </div>

                            </section>

                        </>

                    )}

                </div>


                {/* =====================================================
                    FOOTER ACTIONS
                ===================================================== */}

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
                        disabled={isSaving}
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