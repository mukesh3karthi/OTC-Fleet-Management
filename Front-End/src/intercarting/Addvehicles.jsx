import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Building2,
  Info,
  Save,
  Truck,
  User,
  X,
} from "lucide-react";

import "../Intercartingcss/Addvehicle.css";

const createInitialState = () => ({
  vehicleNumber: "",
  manufacturingYear: "",
  siteName: "",
  vehicleType: "",
  transportProvider: "",
  dieselScope: "",
  hireAmount: "",
  status: "Active",
  vehicleInDate: "",
  vehicleOutDate: "",
  driverName: "",
  driverNumber: "",
  vendorName: "",
  vendorEmail: "",
});

const normalizeDateValue = (value) => {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
};

const normalizeStatus = (vehicle) => {
  const status = String(
    vehicle?.status || ""
  )
    .trim()
    .toLowerCase();

  if (status === "maintenance") {
    return "Maintenance";
  }

  if (
    status === "inactive" ||
    status === "off duty" ||
    status === "off-duty"
  ) {
    return "Inactive";
  }

  return vehicle?.activeStatus === false
    ? "Inactive"
    : "Active";
};

const Addvehicles = ({
  closeModal,
  onSave,
  vehicle = null,
  saving = false,
}) => {
  const [formData, setFormData] =
    useState(createInitialState);

  const [errors, setErrors] =
    useState({});

  const [formError, setFormError] =
    useState("");

  const firstInputRef = useRef(null);

  const isEditing = Boolean(vehicle);

  const modalTitle = isEditing
    ? "Edit Vehicle Details"
    : "Add Vehicle Details";

  const saveButtonText = saving
    ? isEditing
      ? "Updating..."
      : "Saving..."
    : isEditing
      ? "Update Vehicle"
      : "Save Vehicle";

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicleNumber: String(
          vehicle.vehicleNumber || ""
        )
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 11),

        manufacturingYear: String(
          vehicle.manufacturingYear || ""
        ),

        siteName:
          vehicle.siteName || "",

        vehicleType:
          vehicle.vehicleType || "",

        transportProvider:
          vehicle.transportProvider || "",

        dieselScope:
          vehicle.dieselScope || "",

        hireAmount:
          vehicle.hireAmount === undefined ||
          vehicle.hireAmount === null
            ? ""
            : String(vehicle.hireAmount),

        status:
          normalizeStatus(vehicle),

        vehicleInDate:
          normalizeDateValue(
            vehicle.vehicleInDate
          ),

        vehicleOutDate:
          normalizeDateValue(
            vehicle.vehicleOutDate
          ),

        driverName:
          vehicle.driverName || "",

        driverNumber: String(
          vehicle.driverNumber || ""
        ),

        vendorName:
          vehicle.vendorName || "",

        vendorEmail:
          vehicle.vendorEmail || "",
      });
    } else {
      setFormData(
        createInitialState()
      );
    }

    setErrors({});
    setFormError("");
  }, [vehicle]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const clearFieldError = (
    fieldName
  ) => {
    setErrors((previous) => ({
      ...previous,
      [fieldName]: "",
    }));

    setFormError("");
  };

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    clearFieldError(name);
  };

  const handleVehicleNumberChange = (
    event
  ) => {
    const value =
      event.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 11);

    setFormData((previous) => ({
      ...previous,
      vehicleNumber: value,
    }));

    clearFieldError(
      "vehicleNumber"
    );
  };

  const handleManufacturingYearChange = (
    event
  ) => {
    const value =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 4);

    setFormData((previous) => ({
      ...previous,
      manufacturingYear: value,
    }));

    clearFieldError(
      "manufacturingYear"
    );
  };

  const handleDriverNumberChange = (
    event
  ) => {
    const value =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 10);

    setFormData((previous) => ({
      ...previous,
      driverNumber: value,
    }));

    clearFieldError(
      "driverNumber"
    );
  };

  const handleHireAmountChange = (
    event
  ) => {
    let value =
      event.target.value
        .replace(/[^\d.]/g, "")
        .replace(
          /(\..*)\./g,
          "$1"
        );

    const [
      wholePart,
      decimalPart,
    ] = value.split(".");

    if (
      decimalPart !== undefined
    ) {
      value = `${wholePart}.${decimalPart.slice(
        0,
        2
      )}`;
    }

    setFormData((previous) => ({
      ...previous,
      hireAmount: value,
    }));

    clearFieldError(
      "hireAmount"
    );
  };

  const validateForm = () => {
    const newErrors = {};

    const vehicleNumber =
      formData.vehicleNumber.trim();

    const vehicleNumberPattern =
      /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/;

    if (!vehicleNumber) {
      newErrors.vehicleNumber =
        "Vehicle number is required.";
    } else if (
      !vehicleNumberPattern.test(
        vehicleNumber
      )
    ) {
      newErrors.vehicleNumber =
        "Enter a valid vehicle number such as TN74Y0524 or TN01AB1234.";
    }

    if (
      formData.manufacturingYear
    ) {
      const currentYear =
        new Date().getFullYear();

      const year = Number(
        formData.manufacturingYear
      );

      if (
        !/^\d{4}$/.test(
          formData.manufacturingYear
        )
      ) {
        newErrors.manufacturingYear =
          "Manufacturing year must contain four digits.";
      } else if (
        year < 1900 ||
        year > currentYear + 1
      ) {
        newErrors.manufacturingYear =
          `Enter a year between 1900 and ${
            currentYear + 1
          }.`;
      }
    }

    if (
      formData.driverNumber &&
      !/^\d{10}$/.test(
        formData.driverNumber
      )
    ) {
      newErrors.driverNumber =
        "Driver number must contain 10 digits.";
    }

    if (
      formData.vendorEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.vendorEmail.trim()
      )
    ) {
      newErrors.vendorEmail =
        "Enter a valid email address.";
    }

    if (
      formData.hireAmount &&
      Number(
        formData.hireAmount
      ) <= 0
    ) {
      newErrors.hireAmount =
        "Hire amount must be greater than zero.";
    }

    if (
      formData.vehicleInDate &&
      formData.vehicleOutDate &&
      formData.vehicleOutDate <
        formData.vehicleInDate
    ) {
      newErrors.vehicleOutDate =
        "Vehicle out date cannot be before vehicle in date.";
    }

    setErrors(newErrors);

    if (
      Object.keys(newErrors)
        .length > 0
    ) {
      setFormError(
        "Please correct the highlighted fields."
      );

      return false;
    }

    setFormError("");

    return true;
  };

  const buildVehicleData = () => ({
    vehicleNumber:
      formData.vehicleNumber
        .trim()
        .toUpperCase(),

    manufacturingYear:
      formData.manufacturingYear,

    siteName:
      formData.siteName.trim(),

    vehicleType:
      formData.vehicleType,

    transportProvider:
      formData.transportProvider.trim(),

    dieselScope:
      formData.dieselScope,

    hireAmount:
      formData.hireAmount,

    status:
      formData.status,

    activeStatus:
      formData.status === "Active",

    vehicleInDate:
      formData.vehicleInDate,

    vehicleOutDate:
      formData.vehicleOutDate,

    driverName:
      formData.driverName.trim(),

    driverNumber:
      formData.driverNumber.trim(),

    vendorName:
      formData.vendorName.trim(),

    vendorEmail:
      formData.vendorEmail
        .trim()
        .toLowerCase(),
  });

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setFormError("");

      await onSave(
        buildVehicleData()
      );
    } catch (error) {
      console.error(
        "Vehicle form save error:",
        error
      );

      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Unable to save vehicle."
      );
    }
  };

  return (
    <form
      className="add-vehicle"
      onSubmit={handleSubmit}
      noValidate
    >
      <header className="add-vehicle-header">
        <div>
          <h2>{modalTitle}</h2>

          <p>
            Enter the vehicle,
            logistics, driver and
            vendor information.
          </p>
        </div>

        <button
          type="button"
          className="add-vehicle-close-button"
          onClick={closeModal}
          disabled={saving}
          aria-label="Close vehicle form"
          title="Close"
        >
          <X
            size={22}
            aria-hidden="true"
          />
        </button>
      </header>

      {formError && (
        <div
          className="add-vehicle-form-error"
          role="alert"
        >
          {formError}
        </div>
      )}

      <div className="add-vehicle-primary-grid">
        <section className="add-vehicle-card">
          <h3>
            <Info size={20} />

            <span>
              General Information
            </span>
          </h3>

          <div className="add-vehicle-form-grid">
            <div className="add-vehicle-form-group">
              <label htmlFor="vehicleNumber">
                Vehicle Number

                <span className="required-mark">
                  *
                </span>
              </label>

              <input
                ref={firstInputRef}
                id="vehicleNumber"
                type="text"
                name="vehicleNumber"
                value={
                  formData.vehicleNumber
                }
                onChange={
                  handleVehicleNumberChange
                }
                placeholder="TN74Y0524"
                maxLength={11}
                autoComplete="off"
                disabled={saving}
              />

              <p className="field-help">
                Format: state, district,
                series and four digits.
              </p>

              {errors.vehicleNumber && (
                <p className="field-error">
                  {
                    errors.vehicleNumber
                  }
                </p>
              )}
            </div>

            <div className="add-vehicle-form-group">
              <label htmlFor="manufacturingYear">
                Manufacturing Year
              </label>

              <input
                id="manufacturingYear"
                type="text"
                name="manufacturingYear"
                value={
                  formData.manufacturingYear
                }
                onChange={
                  handleManufacturingYearChange
                }
                placeholder="2025"
                maxLength={4}
                inputMode="numeric"
                disabled={saving}
              />

              {errors.manufacturingYear && (
                <p className="field-error">
                  {
                    errors.manufacturingYear
                  }
                </p>
              )}
            </div>

            <div className="add-vehicle-form-group">
              <label htmlFor="siteName">
                Site Name
              </label>

              <select
                id="siteName"
                name="siteName"
                value={
                  formData.siteName
                }
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">
                  Select site
                </option>

                <option value="Kalikanagar">
                  Kalikanagar
                </option>

                <option value="Heft-Mudgal">
                  Heft-Mudgal
                </option>

                <option value="Hyderabad">
                  Hyderabad
                </option>
              </select>
            </div>

            <div className="add-vehicle-form-group">
              <label htmlFor="vehicleType">
                Vehicle Type
              </label>

              <select
                id="vehicleType"
                name="vehicleType"
                value={
                  formData.vehicleType
                }
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">
                  Select type
                </option>

                <option value="T1">
                  T1
                </option>

                <option value="T2">
                  T2
                </option>

                <option value="T3">
                  T3
                </option>

                <option value="T4">
                  T4
                </option>

                <option value="T5">
                  T5
                </option>

                <option value="LBT">
                  LBT
                </option>

                <option value="II crown">
                  II crown
                </option>

                <option value="Axle Puller">
                  Axle Puller
                </option>

                <option value="Towing puller">
                  Towing puller
                </option>
              </select>
            </div>

            <div className="add-vehicle-form-group">
              <label htmlFor="transportProvider">
                Transport Provider
              </label>

              <input
                id="transportProvider"
                type="text"
                name="transportProvider"
                value={
                  formData.transportProvider
                }
                onChange={handleChange}
                placeholder="Enter provider name"
                disabled={saving}
              />
            </div>

            <div className="add-vehicle-form-group">
              <label htmlFor="dieselScope">
                Diesel Scope
              </label>

              <select
                id="dieselScope"
                name="dieselScope"
                value={
                  formData.dieselScope
                }
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">
                  Select scope
                </option>

                <option value="OTC">
                  OTC
                </option>

                <option value="Customer">
                  Customer
                </option>

                <option value="Vendor">
                  Vendor
                </option>
              </select>
            </div>

            <div className="add-vehicle-form-group">
              <label htmlFor="hireAmount">
                Hire Amount
              </label>

              <div className="currency-input">
                <span>₹</span>

                <input
                  id="hireAmount"
                  type="text"
                  name="hireAmount"
                  value={
                    formData.hireAmount
                  }
                  onChange={
                    handleHireAmountChange
                  }
                  placeholder="0.00"
                  inputMode="decimal"
                  disabled={saving}
                />
              </div>

              {errors.hireAmount && (
                <p className="field-error">
                  {errors.hireAmount}
                </p>
              )}
            </div>

            <div className="add-vehicle-form-group">
              <label htmlFor="status">
                Status
              </label>

              <select
                id="status"
                name="status"
                value={
                  formData.status
                }
                onChange={handleChange}
                disabled={saving}
              >
                <option value="Active">
                  Active
                </option>

                <option value="Maintenance">
                  Maintenance
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>
        </section>

        <section className="add-vehicle-card">
          <h3>
            <Truck size={20} />

            <span>Logistics</span>
          </h3>

          <div className="add-vehicle-form-grid logistics-grid">
            <div className="add-vehicle-form-group">
              <label htmlFor="vehicleInDate">
                Vehicle In Date
              </label>

              <input
                id="vehicleInDate"
                type="date"
                name="vehicleInDate"
                value={
                  formData.vehicleInDate
                }
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="add-vehicle-form-group">
              <label htmlFor="vehicleOutDate">
                Vehicle Out Date
              </label>

              <input
                id="vehicleOutDate"
                type="date"
                name="vehicleOutDate"
                value={
                  formData.vehicleOutDate
                }
                onChange={handleChange}
                min={
                  formData.vehicleInDate ||
                  undefined
                }
                disabled={saving}
              />

              {errors.vehicleOutDate && (
                <p className="field-error">
                  {
                    errors.vehicleOutDate
                  }
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="add-vehicle-secondary-grid">
        <section className="add-vehicle-card">
          <h3>
            <User size={20} />

            <span>
              Driver Information
            </span>
          </h3>

          <div className="add-vehicle-form-grid">
            <div className="add-vehicle-form-group">
              <label htmlFor="driverName">
                Driver Name
              </label>

              <input
                id="driverName"
                type="text"
                name="driverName"
                value={
                  formData.driverName
                }
                onChange={handleChange}
                placeholder="Enter driver name"
                disabled={saving}
              />
            </div>

            <div className="add-vehicle-form-group">
              <label htmlFor="driverNumber">
                Driver Number
              </label>

              <input
                id="driverNumber"
                type="tel"
                name="driverNumber"
                value={
                  formData.driverNumber
                }
                onChange={
                  handleDriverNumberChange
                }
                placeholder="10-digit number"
                maxLength={10}
                inputMode="numeric"
                disabled={saving}
              />

              {errors.driverNumber && (
                <p className="field-error">
                  {
                    errors.driverNumber
                  }
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="add-vehicle-card">
          <h3>
            <Building2 size={20} />

            <span>
              Vendor Details
            </span>
          </h3>

          <div className="add-vehicle-form-grid">
            <div className="add-vehicle-form-group">
              <label htmlFor="vendorName">
                Vendor Name
              </label>

              <input
                id="vendorName"
                type="text"
                name="vendorName"
                value={
                  formData.vendorName
                }
                onChange={handleChange}
                placeholder="Enter vendor name"
                disabled={saving}
              />
            </div>

            <div className="add-vehicle-form-group">
              <label htmlFor="vendorEmail">
                Vendor Email
              </label>

              <input
                id="vendorEmail"
                type="email"
                name="vendorEmail"
                value={
                  formData.vendorEmail
                }
                onChange={handleChange}
                placeholder="vendor@example.com"
                disabled={saving}
              />

              {errors.vendorEmail && (
                <p className="field-error">
                  {
                    errors.vendorEmail
                  }
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <footer className="add-vehicle-footer">
        <button
          type="button"
          className="vehicle-form-cancel-button"
          onClick={closeModal}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="vehicle-form-save-button"
          disabled={saving}
        >
          <Save size={18} />

          <span>
            {saveButtonText}
          </span>
        </button>
      </footer>
    </form>
  );
};

export default Addvehicles;