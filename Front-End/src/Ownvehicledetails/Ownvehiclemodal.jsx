import React, {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  Save,
  Truck,
  X,
} from "lucide-react";

import "../Ownvehicledetails/ownvehiclemodal.css";

const createInitialForm = () => ({
  vehicleNo: "",
  type: "",
  vehicleMake: "",
  manufacturingYear: "",
  registrationDate: "",
  transportOwner: "",
  engineNo: "",
  chassisNo: "",
  gps: true,
  purchaseYear: "",
  purchasedFrom: "",
});

const getVehicleId = (vehicle) => vehicle?._id ?? vehicle?.id ?? null;

const normalizeDateInput = (value) =>
  value ? String(value).slice(0, 10) : "";

const getTodayInputValue = () =>
  new Date().toISOString().slice(0, 10);

const getVehicleFormData = (vehicle) => {
  if (!vehicle) {
    return createInitialForm();
  }

  return {
    vehicleNo: vehicle.vehicleNo || "",
    type: vehicle.type || "",
    vehicleMake: vehicle.vehicleMake || "",
    manufacturingYear:
      vehicle.manufacturingYear || "",
    registrationDate:
      normalizeDateInput(vehicle.registrationDate),
    transportOwner:
      vehicle.transportOwner || "",
    engineNo: vehicle.engineNo || "",
    chassisNo: vehicle.chassisNo || "",
    gps: vehicle.gps !== false,
    purchaseYear:
      vehicle.purchaseYear || "",
    purchasedFrom:
      vehicle.purchasedFrom || "",
  };
};

const Ownvehiclemodal = ({
  open,
  vehicle = null,
  onClose,
  onSave,
  saving = false,
  apiError = "",
}) => {
  const [formData, setFormData] =
    useState(createInitialForm);

  const [formError, setFormError] =
    useState("");

  const isEditMode = Boolean(getVehicleId(vehicle));

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormData(
      getVehicleFormData(vehicle)
    );

    setFormError("");
  }, [open, vehicle]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscapeKey = (event) => {
      if (
        event.key === "Escape" &&
        !saving
      ) {
        onClose();
      }
    };

    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    document.addEventListener(
      "keydown",
      handleEscapeKey
    );

    return () => {
      document.body.style.overflow = previousBodyOverflow;

      document.removeEventListener(
        "keydown",
        handleEscapeKey
      );
    };
  }, [open, saving, onClose]);

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    let updatedValue =
      type === "checkbox"
        ? checked
        : value;

    if (
      name === "vehicleNo" ||
      name === "engineNo" ||
      name === "chassisNo"
    ) {
      updatedValue = String(
        updatedValue
      ).toUpperCase();
    }

    if (
      name === "manufacturingYear" ||
      name === "purchaseYear"
    ) {
      updatedValue = String(value)
        .replace(/\D/g, "")
        .slice(0, 4);
    }

    setFormData((previousData) => ({
      ...previousData,
      [name]: updatedValue,
    }));

    setFormError("");
  };

  const validateForm = () => {
    const requiredFields = [
      {
        name: "vehicleNo",
        label: "Vehicle Number",
      },
      {
        name: "type",
        label: "Vehicle Type",
      },
      {
        name: "vehicleMake",
        label: "Vehicle Make",
      },
      {
        name: "manufacturingYear",
        label: "Manufacturing Year",
      },
      {
        name: "registrationDate",
        label: "Registration Date",
      },
      {
        name: "transportOwner",
        label: "Transport Owner",
      },
      {
        name: "engineNo",
        label: "Engine Number",
      },
      {
        name: "chassisNo",
        label: "Chassis Number",
      },
      {
        name: "purchaseYear",
        label: "Purchase Year",
      },
      {
        name: "purchasedFrom",
        label: "Purchased From",
      },
    ];

    const emptyField =
      requiredFields.find(
        (field) =>
          !String(
            formData[field.name] || ""
          ).trim()
      );

    if (emptyField) {
      setFormError(
        `Please enter ${emptyField.label}.`
      );

      return false;
    }

    const vehicleNumber =
      formData.vehicleNo
        .replace(/\s/g, "")
        .toUpperCase();

    const vehicleNumberPattern =
      /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/;

    if (
      !vehicleNumberPattern.test(
        vehicleNumber
      )
    ) {
      setFormError(
        "Please enter a valid vehicle number, for example TN74Y0524."
      );

      return false;
    }

    const currentYear =
      new Date().getFullYear();

    const manufacturingYear =
      Number(formData.manufacturingYear);

    if (
      !/^\d{4}$/.test(
        formData.manufacturingYear
      ) ||
      manufacturingYear < 1950 ||
      manufacturingYear >
        currentYear + 1
    ) {
      setFormError(
        "Please enter a valid manufacturing year."
      );

      return false;
    }

    const purchaseYear = Number(
      formData.purchaseYear
    );

    if (
      !/^\d{4}$/.test(
        formData.purchaseYear
      ) ||
      purchaseYear < manufacturingYear ||
      purchaseYear > currentYear + 1
    ) {
      setFormError(
        "Purchase year cannot be before the manufacturing year."
      );

      return false;
    }

    if (
      new Date(
        formData.registrationDate
      ).getFullYear() <
      manufacturingYear
    ) {
      setFormError(
        "Registration date cannot be before the manufacturing year."
      );

      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const cleanedVehicleData = {
      ...(getVehicleId(vehicle)
        ? {
            id: getVehicleId(vehicle),
          }
        : {}),

      vehicleNo:
        formData.vehicleNo
          .replace(/\s/g, "")
          .toUpperCase(),

      type: formData.type.trim(),

      vehicleMake:
        formData.vehicleMake.trim(),

      manufacturingYear:
        formData.manufacturingYear,

      registrationDate:
        formData.registrationDate,

      transportOwner:
        formData.transportOwner.trim(),

      engineNo:
        formData.engineNo
          .trim()
          .toUpperCase(),

      chassisNo:
        formData.chassisNo
          .trim()
          .toUpperCase(),

      gps: Boolean(formData.gps),

      purchaseYear:
        formData.purchaseYear,

      purchasedFrom:
        formData.purchasedFrom.trim(),
    };

    try {
      setFormError("");

      await onSave(cleanedVehicleData);
    } catch (error) {
      setFormError(
        error?.message ||
          "Unable to save vehicle."
      );
    }
  };

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget && !saving) {
      onClose();
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="ownvehicle-form-overlay"
      onMouseDown={handleOverlayMouseDown}
    >
      <section
        className="ownvehicle-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ownvehicle-modal-title"
        aria-describedby="ownvehicle-modal-description"
      >
        <header className="ownvehicle-form-header">
          <div className="ownvehicle-form-heading">
            <span className="ownvehicle-form-heading-icon">
              <Truck size={22} />
            </span>

            <div>
              <h2 id="ownvehicle-modal-title">
                {isEditMode
                  ? "Edit Vehicle"
                  : "Add Vehicle"}
              </h2>

              <p id="ownvehicle-modal-description">
                Enter the company-owned
                vehicle information.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ownvehicle-form-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close vehicle form"
          >
            <X size={21} />
          </button>
        </header>

        <form
          className="ownvehicle-entry-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="ownvehicle-form-body">
            <div className="ownvehicle-form-section-title">
              <Truck size={18} />

              <span>
                Vehicle Information
              </span>
            </div>

            <div className="ownvehicle-form-grid">
              <FormInput
                label="Vehicle Number"
                name="vehicleNo"
                value={formData.vehicleNo}
                onChange={handleChange}
                placeholder="TN74Y0524"
                required
                autoFocus
                maxLength={15}
              />

              <FormInput
                label="Vehicle Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="Trailer"
                maxLength={60}
                required
              />

              <FormInput
                label="Vehicle Make"
                name="vehicleMake"
                value={formData.vehicleMake}
                onChange={handleChange}
                placeholder="Eicher Motors"
                maxLength={80}
                required
              />

              <FormInput
                label="Manufacturing Year"
                name="manufacturingYear"
                value={
                  formData.manufacturingYear
                }
                onChange={handleChange}
                placeholder="2024"
                inputMode="numeric"
                maxLength={4}
                required
              />

              <FormInput
                label="Registration Date"
                name="registrationDate"
                type="date"
                max={getTodayInputValue()}
                value={
                  formData.registrationDate
                }
                onChange={handleChange}
                icon={
                  <CalendarDays
                    size={16}
                  />
                }
                required
              />

              <FormInput
                label="Transport Owner"
                name="transportOwner"
                value={
                  formData.transportOwner
                }
                onChange={handleChange}
                placeholder="OTC Groups"
                maxLength={100}
                required
              />

              <FormInput
                label="Engine Number"
                name="engineNo"
                value={formData.engineNo}
                onChange={handleChange}
                placeholder="ENG-ECR-7452"
                maxLength={40}
                required
              />

              <FormInput
                label="Chassis Number"
                name="chassisNo"
                value={formData.chassisNo}
                onChange={handleChange}
                placeholder="CHS-ECR-0015"
                maxLength={50}
                required
              />

              <FormInput
                label="Purchase Year"
                name="purchaseYear"
                value={formData.purchaseYear}
                onChange={handleChange}
                placeholder="2024"
                inputMode="numeric"
                maxLength={4}
                required
              />

              <FormInput
                label="Purchased From"
                name="purchasedFrom"
                value={
                  formData.purchasedFrom
                }
                onChange={handleChange}
                placeholder="Eicher Motors"
                maxLength={100}
                required
              />

              <label className="ownvehicle-gps-field">
                <input
                  type="checkbox"
                  name="gps"
                  checked={formData.gps}
                  onChange={handleChange}
                />

                <span className="ownvehicle-gps-switch" />

                <span className="ownvehicle-gps-text">
                  <strong>
                    GPS Available
                  </strong>

                  <small>
                    Enable when GPS is
                    installed in this vehicle.
                  </small>
                </span>
              </label>
            </div>

            {(formError || apiError) && (
              <p
                className="ownvehicle-form-error"
                role="alert"
              >
                {formError || apiError}
              </p>
            )}
          </div>

          <footer className="ownvehicle-form-footer">
            <button
              type="button"
              className="ownvehicle-form-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ownvehicle-form-save"
              disabled={saving}
            >
              <Save size={17} />

              <span>
                {saving
                  ? "Saving..."
                  : isEditMode
                    ? "Update Vehicle"
                    : "Add Vehicle"}
              </span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

const FormInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  icon = null,
  required = false,
  ...inputProperties
}) => {
  return (
    <label className="ownvehicle-form-field">
      <span className="ownvehicle-field-label">
        {label}

        {required && (
          <strong aria-hidden="true">
            *
          </strong>
        )}
      </span>

      <div className="ownvehicle-input-wrapper">
        {icon && (
          <span className="ownvehicle-input-icon">
            {icon}
          </span>
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={
            icon ? "has-icon" : ""
          }
          {...inputProperties}
        />
      </div>
    </label>
  );
};

export default Ownvehiclemodal;