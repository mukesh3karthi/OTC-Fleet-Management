import React, { useEffect, useState } from "react";

import "./lifecyclemodal.css";

const LIFECYCLE_STEPS = [
  "Client Enquiry",
  "Order Finalization",
  "Vendor Finalization",
  "PO Documents",
  "Completion & Order Placed",
];

const STAGE_TO_STEP_INDEX = {
  "Client Enquiry": 0,
  "Order Finalization": 1,
  "Approval Pending": 1,
  "Approval Rejected": 1,
  "Vendor Finalization": 2,
  "Vehicle Assigned": 2,
  Documentation: 3,
  "PO Documents": 3,
  "Trip Started": 4,
  "Delivery In Progress": 4,
  "Completion & Order Placed": 4,
};

const STEP_TO_STAGE = [
  "Client Enquiry",
  "Order Finalization",
  "Vendor Finalization",
  "PO Documents",
  "Completion & Order Placed",
];

const STEP_TO_ROLE = [
  "Key Account Management Team",
  "Commercial / Pricing Team",
  "Vendor Management / Procurement Team",
  "Documentation Team",
  "Transport Operations Team",
];

const VENDORS = [
  "OTC Logistics",
  "South Line Logistics",
  "Vega Transport",
  "Metro Roadlines",
];


const toDateInput = (value) => {
  if (!value) return "";
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
};

const formatDisplayDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

  if (Number.isNaN(number)) {
    return `₹ ${value}`;
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(number);
};

const Lifecyclemodal = ({
  order,
  onClose,
  onUpdate,
  primaryVehicleTypes = [],
}) => {
  if (!order) return null;

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
        aria-label={`Order workflow ${order.tripId || order.id || ""}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
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
              <span>ORDER LIFECYCLE</span>
              <strong>{order.companyName || order.customer || order.client || "—"}</strong>
            </div>
          </div>

          <div className="kam-modal-toolbar-right">
            <div className="kam-detail-meta">
              <span>{order.companyName || order.customer || order.client || "—"}</span>
              <strong>{order.tripId || order.id || "—"}</strong>
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

        <OrderLifecyclePanel
          key={order._id || order.id}
          order={order}
          onUpdate={onUpdate}
          primaryVehicleTypes={primaryVehicleTypes}
        />
      </section>
    </div>
  );
};

const ClientEnquiryField = ({
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

      <span>
        {label}
      </span>

      <strong>
        {hasValue
          ? `${value}${suffix}`
          : "—"}
      </strong>

    </div>
  );
};

const OrderLifecyclePanel = ({
  order,
  onUpdate,
  primaryVehicleTypes = [],
}) => {

  const initialStepIndex =
    STAGE_TO_STEP_INDEX[
      order.stage
    ] !== undefined
      ? STAGE_TO_STEP_INDEX[
      order.stage
      ]
      : 0;

  const [
    activeStepIndex,
    setActiveStepIndex,
  ] = useState(
    initialStepIndex
  );

  const [
    poFile,
    setPoFile,
  ] = useState(null);

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  const [approvalStatus, setApprovalStatus] = useState(
    order.approvalStatus ||
    (order.approvalRequested ? "Pending" : "Not Requested")
  );

  useEffect(() => {
    setApprovalStatus(
      order.approvalStatus ||
      (order.approvalRequested ? "Pending" : "Not Requested")
    );
  }, [order.approvalStatus, order.approvalRequested]);

  useEffect(() => {
    const nextStepIndex =
      STAGE_TO_STEP_INDEX[
      order.stage || order.orderStage
      ];

    if (nextStepIndex !== undefined) {
      setActiveStepIndex(nextStepIndex);
    }
  }, [order.stage, order.orderStage]);

  const firstVehicle =
    Array.isArray(
      order.vehicles
    )
      ? order.vehicles[0] ||
      {}
      : {};

  const isWTG =
    order.movementType ===
    "WTG Movement";

  const isIntercarting =
    order.movementType ===
    "Intercarting" ||
    order.movementType ===
    "Other";

  const isCrane =
    order.movementType ===
    "Crane";


  const approvedVehicles =
    Array.isArray(order.vehicles)
      ? order.vehicles.filter(
          (vehicle) =>
            vehicle.vehicleApprovalStatus ===
              "Approved" &&
            vehicle.selectedTransport
        )
      : [];



  const [
    form,
    setForm,
  ] = useState({

    commercialTerms:
      order.commercialTerms ||
      order.commercialTermsPaymentSlas ||
      "",

    deliveryCommitments:
      order.deliveryCommitments ||
      order.deliveryCommitmentsSlas ||
      "",

    clientConfirmationNotes:
      order.clientConfirmationNotes || "",

    orderReferenceNumber:
      order.orderReferenceNumber ||
      order.orderReference ||
      "",

    orderCount:
      order.orderCount ||
      order.tripLots ||
      "",

    responsibleKam:
      order.responsibleKam ||
      order.assignedKam ||
      "",

    quotedRate:
      order.quotedRate || "",

    negotiatedRate:
      order.negotiatedRate || "",

    finalRate:
      order.finalRate || "",

    paymentTerms:
      order.paymentTerms || "",

    commercialRemarks:
      order.commercialRemarks || "",

    poNumber:
      order.poNumber || "",

    poDate:
      toDateInput(
        order.poDate ||
        order.poValidityPeriod
      ),

    scopeOfWork:
      order.scopeOfWork ||
      "",

    billingGstin:
      order.billingGstin ||
      order.billingGSTIN ||
      "",

    registeredBillingAddress:
      order.registeredBillingAddress ||
      order.billingAddress ||
      "",

    poDocumentName:
      order.poDocumentName ||
      order.documentName ||
      "",

    poDocumentType:
      order.poDocumentType || "",

    poDocumentSize:
      order.poDocumentSize || 0,

    poRemarks:
      order.poRemarks || "",

    vendor:
      order.vendor || "",

    vehicleType:
      order.vehicleType ||
      order.primaryVehicleType ||
      firstVehicle.vehicleType ||
      "",

    vendorRate:
      order.vendorRate || "",

    loadingDate:
      toDateInput(
        order.loadingDate
      ),

    vendorRemarks:
      order.vendorRemarks || "",

    vehicleNumber:
      order.vehicleNumber ||
      firstVehicle.vehicleNumber ||
      "",

    driverName:
      order.driverName ||
      firstVehicle.driverName ||
      "",

    driverNumber:
      order.driverNumber ||
      firstVehicle.driverNumber ||
      firstVehicle.driverPhone ||
      "",

    placementDate:
      toDateInput(
        order.placementDate
      ),

    instructions:
      order.instructions ||
      order.remark ||
      "",
  });



  const handleChange =
    (field) =>
      (event) => {

        setForm(
          (previous) => ({
            ...previous,

            [field]:
              event.target.value,
          })
        );
      };



  const handlePoFileChange =
    (event) => {

      const file =
        event.target
          .files?.[0] ||
        null;

      setPoFile(file);

      setForm(
        (previous) => ({
          ...previous,

          poDocumentName:
            file?.name ||
            "",

          poDocumentType:
            file?.type ||
            "",

          poDocumentSize:
            file?.size ||
            0,
        })
      );
    };



  const buildUpdatedOrder = (
    stepIndex =
      activeStepIndex
  ) => ({
    ...order,

    ...form,

    stage:
      STEP_TO_STAGE[
      stepIndex
      ],

    orderStage:
      STEP_TO_STAGE[
      stepIndex
      ],

    role:
      STEP_TO_ROLE[
      stepIndex
      ],

    responsibleTeam:
      STEP_TO_ROLE[
      stepIndex
      ],

    lifecycleStep:
      stepIndex,
  });



  const validateCurrentStep =
    () => {

      if (
        activeStepIndex === 0
      ) {
        return true;
      }

      if (
        activeStepIndex === 1
      ) {

        const requiredOrderFinalizationFields = [
          [form.commercialTerms, "Commercial Terms & Payment SLAs"],
          [form.deliveryCommitments, "Delivery Commitments & SLAs"],
          [form.clientConfirmationNotes, "Client Confirmation Notes"],
          [form.orderReferenceNumber, "Order Reference Number"],
          [form.orderCount, "Order Count / Trip Lots"],
          [form.responsibleKam, "Responsible KAM"],
        ];

        const missingField =
          requiredOrderFinalizationFields.find(
            ([value]) =>
              !String(value ?? "").trim()
          );

        if (missingField) {
          window.alert(
            `Enter ${missingField[1]}.`
          );

          return false;
        }

        if (
          String(form.orderCount).trim() &&
          Number(form.orderCount) <= 0
        ) {
          window.alert(
            "Order Count / Trip Lots must be greater than 0."
          );

          return false;
        }
      }

      if (
        activeStepIndex === 2
      ) {

        if (
          approvedVehicles.length ===
          0
        ) {

          window.alert(
            "No management-approved vehicle allocation is available for Vendor Finalization."
          );

          return false;
        }
      }

      if (
        activeStepIndex === 3
      ) {

        const requiredPoFields = [
          [form.poNumber, "Client Purchase Order (PO) Number"],
          [form.poDate, "PO Validity Period"],
          [form.scopeOfWork, "Scope of Work"],
          [form.billingGstin, "Billing GSTIN"],
        ];

        const missingPoField =
          requiredPoFields.find(
            ([value]) =>
              !String(value ?? "").trim()
          );

        if (missingPoField) {
          window.alert(
            `Enter ${missingPoField[1]}.`
          );

          return false;
        }
      }

      if (
        activeStepIndex === 4
      ) {

        if (
          !String(
            form.vehicleNumber
          ).trim()
        ) {

          window.alert(
            "Enter vehicle number."
          );

          return false;
        }
      }

      return true;
    };



  const handleSaveDraft =
    async () => {

      if (isUpdating) {
        return;
      }

      try {

        setIsUpdating(true);

        await onUpdate(
          buildUpdatedOrder(),

          `${order.id} draft saved.`
        );

      } catch (error) {

        console.error(
          "Draft Error:",
          error
        );

      } finally {

        setIsUpdating(false);
      }
    };



  const handleRequestApproval = async () => {
    if (isUpdating || !validateCurrentStep()) return;

    try {
      setIsUpdating(true);

      const now = new Date().toISOString();

      const updatedOrder = {
        ...buildUpdatedOrder(activeStepIndex),
        stage: "Approval Pending",
        orderStage: "Approval Pending",
        approvalRequested: true,
        approvalStatus: "Pending",
        approvalRequestedAt: now,
        approvalReviewedAt: null,
        approvalRejectionReason: "",
      };

      await onUpdate(
        updatedOrder,
        `${order.tripId || order.id} sent for approval.`
      );

      setApprovalStatus("Pending");
    } catch (error) {
      console.error("Approval Request Error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdvance =
    async () => {

      if (
        isUpdating ||
        !validateCurrentStep()
      ) {
        return;
      }

      try {

        setIsUpdating(true);

        if (
          activeStepIndex >=
          LIFECYCLE_STEPS.length -
          1
        ) {

          await onUpdate(
            {
              ...buildUpdatedOrder(
                activeStepIndex
              ),

              stage:
                "Completion & Order Placed",

              orderStage:
                "Completion & Order Placed",

              role:
                "Transport Operations Team",

              responsibleTeam:
                "Transport Operations Team",
            },

            `${order.id} completed successfully.`
          );

          return;
        }

        const nextIndex =
          activeStepIndex + 1;

        await onUpdate(
          buildUpdatedOrder(
            nextIndex
          ),

          `${order.id} moved to ${LIFECYCLE_STEPS[
          nextIndex
          ]
          }.`
        );

        setActiveStepIndex(
          nextIndex
        );

      } catch (error) {

        console.error(
          "Lifecycle Error:",
          error
        );

      } finally {

        setIsUpdating(false);
      }
    };



  const renderClientEnquiry =
    () => (

      <div className="kam-client-enquiry-content">

        <section className="kam-client-trip-info">

          <div className="kam-client-trip-header">

            <div>

              <h3>

                {isWTG
                  ? "WTG Trip Information"
                  : isIntercarting
                    ? `${order.movementType
                    } Trip Information`
                    : isCrane
                      ? "Crane Trip Information"
                      : "Trip Information"}

              </h3>

              <p>
                Commercial, enquiry,
                placement and route
                details.
              </p>

            </div>

            <div className="kam-client-trip-id">

              <span>
                TRIP ID
              </span>

              <strong>
                {order.tripId ||
                  order.id ||
                  "—"}
              </strong>

            </div>

          </div>



          {isWTG && (

            <div className="kam-client-trip-grid">

              <ClientEnquiryField
                label="Customer"
                value={
                  order.companyName
                }
              />

              <ClientEnquiryField
                label="Contact Person"
                value={
                  order.client ||
                  order.customer
                }
              />

              <ClientEnquiryField
                label="Contact Number"
                value={
                  order.clientContact ||
                  order.clientPhone
                }
              />

              <ClientEnquiryField
                label="Email"
                value={
                  order.clientEmail
                }
              />

              <ClientEnquiryField
                label="Cargo Type"
                value={
                  order.cargo ||
                  order.materialType
                }
              />

              <ClientEnquiryField
                label="Enquiry Date"
                value={
                  formatDisplayDate(
                    order.enquiryDate
                  )
                }
              />

              <ClientEnquiryField
                label="Deployment Date"
                value={
                  formatDisplayDate(
                    order.placementDate ||
                    order.deploymentDate
                  )
                }
              />

              <ClientEnquiryField
                label="Assigned KAM"
                value={
                  order.assignedKam
                }
              />

              <ClientEnquiryField
                label="Vehicles"
                value={
                  order.totalVehicleCount
                }
                suffix=" NOS"
              />

              <ClientEnquiryField
                label="Origin"
                value={
                  order.origin
                }
              />

              <ClientEnquiryField
                label="Destination"
                value={
                  order.destination
                }
              />

              <ClientEnquiryField
                label="Estimated KM"
                value={
                  order.estimatedDistance ||
                  order.totalKm
                }
                suffix=" KM"
              />

            </div>
          )}



          {isIntercarting && (

            <div className="kam-client-trip-grid">

              <ClientEnquiryField
                label="Customer"
                value={
                  order.companyName
                }
              />

              <ClientEnquiryField
                label="Contact Person"
                value={
                  order.client ||
                  order.customer
                }
              />

              <ClientEnquiryField
                label="Contact Number"
                value={
                  order.clientContact ||
                  order.clientPhone
                }
              />

              <ClientEnquiryField
                label="Email"
                value={
                  order.clientEmail
                }
              />

              <ClientEnquiryField
                label="Site Location"
                value={
                  order.siteLocation
                }
              />

              <ClientEnquiryField
                label="Period"
                value={
                  order.period
                }
              />

              <ClientEnquiryField
                label="Diesel Scope"
                value={
                  order.dieselScope
                }
              />

              <ClientEnquiryField
                label="Total Quantity"
                value={
                  order.totalQuantity
                }
                suffix=" NOS"
              />

              <ClientEnquiryField
                label="Enquiry Date"
                value={
                  formatDisplayDate(
                    order.enquiryDate
                  )
                }
              />

              <ClientEnquiryField
                label="Deployment Date"
                value={
                  formatDisplayDate(
                    order.deploymentDate ||
                    order.placementDate
                  )
                }
              />

              <ClientEnquiryField
                label="Assigned KAM"
                value={
                  order.assignedKam
                }
              />

              <ClientEnquiryField
                label="Vehicles"
                value={
                  order.totalVehicleCount
                }
                suffix=" NOS"
              />

            </div>
          )}



          {isCrane && (

            <div className="kam-client-trip-grid">

              <ClientEnquiryField
                label="Customer"
                value={
                  order.companyName
                }
              />

              <ClientEnquiryField
                label="Contact Person"
                value={
                  order.client
                }
              />

              <ClientEnquiryField
                label="Contact Number"
                value={
                  order.clientContact
                }
              />

              <ClientEnquiryField
                label="Email"
                value={
                  order.clientEmail
                }
              />

              <ClientEnquiryField
                label="Crane Name"
                value={
                  order.cargo
                }
              />

              <ClientEnquiryField
                label="Weight"
                value={
                  order.weight
                }
                suffix=" TON"
              />

              <ClientEnquiryField
                label="Required Vehicles"
                value={
                  order.requiredVehicles
                }
                suffix=" NOS"
              />

              <ClientEnquiryField
                label="Vehicle Type"
                value={
                  order.primaryVehicleType ||
                  order.vehicleType
                }
              />

              <ClientEnquiryField
                label="Enquiry Date"
                value={
                  formatDisplayDate(
                    order.enquiryDate
                  )
                }
              />

              <ClientEnquiryField
                label="Deployment Date"
                value={
                  formatDisplayDate(
                    order.placementDate
                  )
                }
              />

              <ClientEnquiryField
                label="Assigned KAM"
                value={
                  order.assignedKam
                }
              />

              <ClientEnquiryField
                label="Vehicles"
                value={
                  order.totalVehicleCount
                }
                suffix=" NOS"
              />

              <ClientEnquiryField
                label="Origin"
                value={
                  order.origin
                }
              />

              <ClientEnquiryField
                label="Destination"
                value={
                  order.destination
                }
              />

              <ClientEnquiryField
                label="Estimated KM"
                value={
                  order.estimatedDistance
                }
                suffix=" KM"
              />

            </div>
          )}

        </section>



        {Array.isArray(
          order.vehicles
        ) &&
          order.vehicles.length >
          0 && (

            <section className="kam-client-vehicle-section">

              <div className="kam-client-vehicle-heading">

                <div>

                  <h3>
                    Vehicle Requirement
                  </h3>

                  <p>
                    Requirement entered during
                    New Trip Creation.
                  </p>

                </div>

                <span>
                  {
                    order.vehicles
                      .length
                  }
                </span>

              </div>

              <div className="kam-client-vehicle-table-wrap">

                <table className="kam-client-vehicle-table">

                  <thead>

                    <tr>

                      <th>
                        #
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

                      {isWTG && (
                        <th>
                          L × H × W
                        </th>
                      )}

                    </tr>

                  </thead>

                  <tbody>

                    {order.vehicles.map(
                      (
                        vehicle,
                        index
                      ) => (

                        <tr
                          key={
                            vehicle._id ||
                            vehicle.vehicleSubId ||
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
                              {vehicle.vehicleType ||
                                "—"}
                            </strong>

                          </td>

                          <td>
                            {vehicle.configurationModel ||
                              "—"}
                          </td>

                          <td>

                            {vehicle.movementClassification ? (

                              <span
                                className={`kam-client-classification ${String(
                                  vehicle.movementClassification
                                ).toUpperCase() ===
                                  "ODC"
                                  ? "odc"
                                  : "non-odc"
                                  }`}
                              >
                                {
                                  vehicle.movementClassification
                                }
                              </span>

                            ) : (
                              "—"
                            )}

                          </td>

                          <td>

                            {vehicle.quantity !==
                              undefined &&
                              vehicle.quantity !==
                              null
                              ? `${vehicle.quantity} NOS`
                              : "—"}

                          </td>

                          <td>

                            {vehicle.weight !==
                              undefined &&
                              vehicle.weight !==
                              null &&
                              vehicle.weight !==
                              ""
                              ? `${vehicle.weight} TON`
                              : "—"}

                          </td>

                          {isWTG && (

                            <td>

                              {vehicle.length !==
                                undefined &&
                                vehicle.length !==
                                null &&
                                vehicle.height !==
                                undefined &&
                                vehicle.height !==
                                null &&
                                vehicle.width !==
                                undefined &&
                                vehicle.width !==
                                null
                                ? `${vehicle.length} × ${vehicle.height} × ${vehicle.width} FT`
                                : vehicle.dimensions ||
                                "—"}

                            </td>

                          )}

                        </tr>
                      ))}

                  </tbody>

                </table>

              </div>

            </section>
          )}



        {order.remark && (

          <section className="kam-client-remark">

            <span>
              REMARK
            </span>

            <p>
              {order.remark}
            </p>

          </section>
        )}





      </div>
    );



  const renderStepFields =
    () => {

      switch (
      activeStepIndex
      ) {

        case 0:

          return renderClientEnquiry();



        case 1:

          return (
            <div className="kam-finalization-flat-grid">

              <LifecycleField
                label="Quoted Rate"
                prefix="₹"
                type="number"
                value={form.quotedRate}
                onChange={handleChange("quotedRate")}
                placeholder="Enter quoted rate"
              />

              <LifecycleField
                label="Negotiated Rate"
                prefix="₹"
                type="number"
                value={form.negotiatedRate}
                onChange={handleChange("negotiatedRate")}
                placeholder="Enter negotiated rate"
              />

              <LifecycleField
                label="Final Approved Rate"
                prefix="₹"
                type="number"
                value={form.finalRate}
                onChange={handleChange("finalRate")}
                placeholder="Enter final approved rate"
              />

              <LifecycleField
                label="Order Reference Number"
                value={form.orderReferenceNumber}
                onChange={handleChange("orderReferenceNumber")}
                placeholder="e.g. OTC-ORD-88915"
                required
              />

              <LifecycleField
                label="Order Count / Trip Lots"
                type="number"
                value={form.orderCount}
                onChange={handleChange("orderCount")}
                placeholder="Enter count"
                required
              />

              <LifecycleField
                label="Responsible KAM"
                value={form.responsibleKam}
                onChange={handleChange("responsibleKam")}
                placeholder="Enter responsible KAM"
                required
              />

              <LifecycleField
                label="Payment Terms"
                value={form.paymentTerms}
                onChange={handleChange("paymentTerms")}
                placeholder="e.g. 30 Days"
              />

              <div className="kam-finalization-details-grid">

                <div className="kam-field-group">
                  <label>
                    Commercial Terms &amp; Payment SLAs
                    <span className="kam-required-mark">*</span>
                  </label>
                  <textarea
                    className="kam-finalization-textarea"
                    rows={3}
                    value={form.commercialTerms}
                    onChange={handleChange("commercialTerms")}
                    placeholder="e.g. 50% fuel advance on mobilization, balance on delivery."
                  />
                </div>

                <div className="kam-field-group">
                  <label>
                    Delivery Commitments &amp; SLAs
                    <span className="kam-required-mark">*</span>
                  </label>
                  <textarea
                    className="kam-finalization-textarea"
                    rows={3}
                    value={form.deliveryCommitments}
                    onChange={handleChange("deliveryCommitments")}
                    placeholder="e.g. 8 trailers mobilized within 48 hours for crane shift."
                  />
                </div>

                <div className="kam-field-group">
                  <label>
                    Client Confirmation Notes
                    <span className="kam-required-mark">*</span>
                  </label>
                  <textarea
                    className="kam-finalization-textarea"
                    rows={3}
                    value={form.clientConfirmationNotes}
                    onChange={handleChange("clientConfirmationNotes")}
                    placeholder="e.g. Approved via plant project engineer authorization."
                  />
                </div>

                <div className="kam-field-group">
                  <label>Commercial Remarks</label>
                  <textarea
                    className="kam-finalization-textarea"
                    rows={3}
                    value={form.commercialRemarks}
                    onChange={handleChange("commercialRemarks")}
                    placeholder="Enter commercial remarks..."
                  />
                </div>

              </div>

            </div>
          );


        case 2:

          return (
            <>

              <section className="kam-approved-allocation-card">

                <div className="kam-approved-allocation-head">

                  <div className="kam-approved-allocation-title">

                    <div className="kam-approved-allocation-icon">
                      ✓
                    </div>

                    <div>
                      <span className="kam-approved-allocation-kicker">
                        APPROVAL MANAGEMENT
                      </span>

                      <h3>
                        Approved Vehicle Allocations
                      </h3>

                      <p>
                        Only management-approved vehicle allocations are available
                        for Vendor Finalization.
                      </p>
                    </div>

                  </div>


                  <div className="kam-approved-allocation-summary">

                    <div>
                      <span>
                        Approved Types
                      </span>

                      <strong>
                        {approvedVehicles.length}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Total Quantity
                      </span>

                      <strong>
                        {approvedVehicles.reduce(
                          (
                            total,
                            vehicle
                          ) =>
                            total +
                            Number(
                              vehicle.quantity ||
                              0
                            ),
                          0
                        )}{" "}
                        NOS
                      </strong>
                    </div>

                  </div>

                </div>


                {approvedVehicles.length > 0 ? (

                  <div className="kam-approved-allocation-table-wrap">

                    <table className="kam-approved-allocation-table">

                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Vehicle Requirement</th>
                          <th>Quantity</th>
                          <th>Approved Transporter</th>
                          <th>Contact Person / Number</th>
                          <th>Approved Rate</th>
                          <th>Status</th>
                        </tr>
                      </thead>


                      <tbody>

                        {approvedVehicles.map(
                          (
                            vehicle,
                            index
                          ) => {

                            const selectedTransport =
                              vehicle.selectedTransport ||
                              {};

                            return (

                              <tr
                                key={
                                  vehicle._id ||
                                  vehicle.vehicleSubId ||
                                  index
                                }
                              >

                                <td>

                                  <span className="kam-approved-row-number">
                                    {String(
                                      index + 1
                                    ).padStart(
                                      2,
                                      "0"
                                    )}
                                  </span>

                                </td>


                                <td>

                                  <div className="kam-approved-vehicle-cell">

                                    <div className="kam-approved-vehicle-mark">
                                      ✓
                                    </div>

                                    <div>
                                      <strong>
                                        {vehicle.vehicleType ||
                                          "—"}
                                      </strong>

                                      <span>
                                        {vehicle.vehicleSubId ||
                                          "Vehicle Requirement"}
                                      </span>
                                    </div>

                                  </div>

                                </td>


                                <td>

                                  <div className="kam-approved-qty">

                                    <strong>
                                      {vehicle.quantity ||
                                        0}
                                    </strong>

                                    <span>
                                      NOS
                                    </span>

                                  </div>

                                </td>


                                <td>

                                  <div className="kam-approved-vendor-cell">

                                    <strong>
                                      {selectedTransport.transportName ||
                                        "—"}
                                    </strong>

                                    {selectedTransport.quotationId && (
                                      <span>
                                        {selectedTransport.quotationId}
                                      </span>
                                    )}

                                  </div>

                                </td>


                                <td>

                                  <div className="kam-approved-contact-cell">

                                    <strong>
                                      {selectedTransport.contactName ||
                                        "—"}
                                    </strong>

                                    <span>
                                      {selectedTransport.contactNumber ||
                                        "No contact number"}
                                    </span>

                                  </div>

                                </td>


                                <td>

                                  <strong className="kam-approved-rate">
                                    {formatAmount(
                                      selectedTransport.amount
                                    )}
                                  </strong>

                                </td>


                                <td>

                                  <span className="kam-approved-status">
                                    <span>
                                      ✓
                                    </span>

                                    Approved
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

                  <div className="kam-approved-empty">

                    <div className="kam-approved-empty-icon">
                      !
                    </div>

                    <div>
                      <strong>
                        No approved vehicle allocations
                      </strong>

                      <span>
                        Pending or rejected Traffic allocations are not shown
                        in Vendor Finalization.
                      </span>
                    </div>

                  </div>

                )}

              </section>


              <div className="kam-vendor-remarks-card">

                <div className="kam-vendor-remarks-head">

                  <div>
                    <span>
                      VENDOR FINALIZATION
                    </span>

                    <h3>
                      Vendor Remarks
                    </h3>

                    <p>
                      Add final remarks or instructions related to the approved allocation.
                    </p>
                  </div>

                </div>


                <textarea
                  rows={4}
                  value={
                    form.vendorRemarks
                  }
                  onChange={
                    handleChange(
                      "vendorRemarks"
                    )
                  }
                  placeholder="Enter vendor finalization remarks..."
                />

              </div>

            </>
          );


        case 3:

          return (
            <>

              <div className="kam-form-grid">

                <div className="kam-field-group">
                  <label>
                    Trip / Order Number
                  </label>
                  <div className="kam-readonly-field">
                    {order.tripId || order.id || "—"}
                  </div>
                </div>

                <LifecycleField
                  label="Client Purchase Order (PO) Number"
                  placeholder="Enter client PO number"
                  value={form.poNumber}
                  onChange={handleChange("poNumber")}
                  required
                />

                <div className="kam-field-group">
                  <label>
                    PO Validity Period
                    <span className="kam-required-mark">*</span>
                  </label>
                  <input
                    type="date"
                    className="kam-date-input"
                    value={form.poDate}
                    onChange={handleChange("poDate")}
                  />
                </div>

                <LifecycleField
                  label="Billing GSTIN"
                  value={form.billingGstin}
                  onChange={handleChange("billingGstin")}
                  placeholder="Enter billing GSTIN"
                  required
                />

                <div className="kam-field-group">
                  <label>
                    Scope of Work
                    <span className="kam-required-mark">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.scopeOfWork}
                    onChange={handleChange("scopeOfWork")}
                    placeholder="Enter scope of work"
                  />
                </div>

                <div className="kam-field-group">
                  <label>
                    Registered Billing Address
                  </label>
                  <textarea
                    rows={3}
                    value={form.registeredBillingAddress}
                    onChange={handleChange("registeredBillingAddress")}
                    placeholder="Enter registered billing address"
                  />
                </div>

              </div>

              <div className="kam-po-bottom-row">

                <div className="kam-field-group">
                  <label>PO Document</label>

                  <label
                    className={`kam-po-upload-modern ${
                      poFile || form.poDocumentName ? "has-file" : ""
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={handlePoFileChange}
                      className="kam-po-file-input"
                    />

                    <div className="kam-po-modern-icon" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 16V4M12 4L7.5 8.5M12 4L16.5 8.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5 15.5V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V15.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <div className="kam-po-modern-info">
                      <strong>
                        {poFile || form.poDocumentName
                          ? "PO Document Ready"
                          : "Upload Purchase Order"}
                      </strong>

                      <span className="kam-po-modern-file-name">
                        {poFile?.name ||
                          form.poDocumentName ||
                          "PDF, DOC, DOCX, XLS, XLSX, JPG or PNG"}
                      </span>
                    </div>

                    <div className="kam-po-modern-action">
                      {poFile || form.poDocumentName
                        ? "Replace File"
                        : "Select File"}
                    </div>
                  </label>
                </div>

                <div className="kam-field-group">
                  <label>
                    Document Remarks
                  </label>

                  <textarea
                    className="kam-po-remarks"
                    rows={3}
                    value={form.poRemarks}
                    onChange={handleChange("poRemarks")}
                    placeholder="Enter document remarks..."
                  />
                </div>

              </div>

            </>
          );


        case 4:

          return (
            <div className="kam-completion-shell">

              {/* =========================================
                  ORDER / CUSTOMER INFORMATION
              ========================================= */}

              <section className="kam-completion-card">

                <div className="kam-completion-card-head">

                  <div className="kam-completion-step-icon">
                    01
                  </div>

                  <div>
                    <span className="kam-completion-eyebrow">
                      ORDER INFORMATION
                    </span>

                    <h3>
                      Customer &amp; Trip Details
                    </h3>

                    <p>
                      Complete enquiry and route information for this order.
                    </p>
                  </div>

                </div>


                <div className="kam-completion-info-grid">

                  <div>
                    <span>
                      Trip / Order ID
                    </span>

                    <strong>
                      {order.tripId ||
                        order.id ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Movement Type
                    </span>

                    <strong>
                      {order.movementType ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Customer
                    </span>

                    <strong>
                      {order.companyName ||
                        order.customer ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Contact Person
                    </span>

                    <strong>
                      {order.client ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Contact Number
                    </span>

                    <strong>
                      {order.clientContact ||
                        order.clientPhone ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Email
                    </span>

                    <strong>
                      {order.clientEmail ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Cargo Type
                    </span>

                    <strong>
                      {order.cargo ||
                        order.materialType ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Assigned KAM
                    </span>

                    <strong>
                      {order.assignedKam ||
                        order.responsibleKam ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Enquiry Date
                    </span>

                    <strong>
                      {formatDisplayDate(
                        order.enquiryDate
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Deployment Date
                    </span>

                    <strong>
                      {formatDisplayDate(
                        order.deploymentDate ||
                        order.placementDate
                      )}
                    </strong>
                  </div>


                  {isIntercarting ? (
                    <>
                      <div>
                        <span>
                          Site Location
                        </span>

                        <strong>
                          {order.siteLocation ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Period
                        </span>

                        <strong>
                          {order.period ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Diesel Scope
                        </span>

                        <strong>
                          {order.dieselScope ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Total Quantity
                        </span>

                        <strong>
                          {order.totalQuantity !==
                            undefined &&
                          order.totalQuantity !==
                            null &&
                          order.totalQuantity !==
                            ""
                            ? `${order.totalQuantity} NOS`
                            : "—"}
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span>
                          Origin
                        </span>

                        <strong>
                          {order.origin ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Destination
                        </span>

                        <strong>
                          {order.destination ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Estimated KM
                        </span>

                        <strong>
                          {order.estimatedDistance !==
                            undefined &&
                          order.estimatedDistance !==
                            null &&
                          order.estimatedDistance !==
                            ""
                            ? `${order.estimatedDistance} KM`
                            : order.totalKm !==
                                  undefined &&
                                order.totalKm !==
                                  null &&
                                order.totalKm !==
                                  ""
                              ? `${order.totalKm} KM`
                              : "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Weight
                        </span>

                        <strong>
                          {order.weight !==
                            undefined &&
                          order.weight !==
                            null &&
                          order.weight !==
                            ""
                            ? `${order.weight} TON`
                            : "—"}
                        </strong>
                      </div>
                    </>
                  )}

                </div>

              </section>


              {/* =========================================
                  COMMERCIAL / ORDER FINALIZATION
              ========================================= */}

              <section className="kam-completion-card">

                <div className="kam-completion-card-head">

                  <div className="kam-completion-step-icon">
                    02
                  </div>

                  <div>
                    <span className="kam-completion-eyebrow">
                      ORDER FINALIZATION
                    </span>

                    <h3>
                      Commercial &amp; Approval Details
                    </h3>

                    <p>
                      Final commercial values and approval information.
                    </p>
                  </div>

                </div>


                <div className="kam-completion-info-grid">

                  <div>
                    <span>
                      Order Reference Number
                    </span>

                    <strong>
                      {order.orderReferenceNumber ||
                        form.orderReferenceNumber ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Order Count / Trip Lots
                    </span>

                    <strong>
                      {order.orderCount ??
                        form.orderCount ??
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Responsible KAM
                    </span>

                    <strong>
                      {order.responsibleKam ||
                        form.responsibleKam ||
                        order.assignedKam ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Quoted Rate
                    </span>

                    <strong>
                      {formatAmount(
                        order.quotedRate ??
                        form.quotedRate
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Negotiated Rate
                    </span>

                    <strong>
                      {formatAmount(
                        order.negotiatedRate ??
                        form.negotiatedRate
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Final Approved Rate
                    </span>

                    <strong className="kam-completion-rate">
                      {formatAmount(
                        order.finalRate ??
                        form.finalRate
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Payment Terms
                    </span>

                    <strong>
                      {order.paymentTerms ||
                        form.paymentTerms ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Approval Status
                    </span>

                    <strong className="kam-completion-approved-text">
                      {order.approvalStatus ||
                        approvalStatus ||
                        "—"}
                    </strong>
                  </div>

                </div>


                <div className="kam-completion-notes-grid">

                  <div>
                    <span>
                      Commercial Terms &amp; Payment SLAs
                    </span>

                    <p>
                      {order.commercialTerms ||
                        form.commercialTerms ||
                        "—"}
                    </p>
                  </div>


                  <div>
                    <span>
                      Delivery Commitments &amp; SLAs
                    </span>

                    <p>
                      {order.deliveryCommitments ||
                        form.deliveryCommitments ||
                        "—"}
                    </p>
                  </div>


                  <div>
                    <span>
                      Client Confirmation Notes
                    </span>

                    <p>
                      {order.clientConfirmationNotes ||
                        form.clientConfirmationNotes ||
                        "—"}
                    </p>
                  </div>


                  <div>
                    <span>
                      Commercial Remarks
                    </span>

                    <p>
                      {order.commercialRemarks ||
                        form.commercialRemarks ||
                        "—"}
                    </p>
                  </div>

                </div>

              </section>


              {/* =========================================
                  VEHICLE / TRANSPORT ALLOCATIONS
              ========================================= */}

              <section className="kam-completion-card">

                <div className="kam-completion-card-head kam-completion-card-head-between">

                  <div className="kam-completion-card-head-left">

                    <div className="kam-completion-step-icon">
                      03
                    </div>

                    <div>
                      <span className="kam-completion-eyebrow">
                        VEHICLE ALLOCATION
                      </span>

                      <h3>
                        Approved Vehicle &amp; Transport Details
                      </h3>

                      <p>
                        All management-approved vehicle allocations for this order.
                      </p>
                    </div>

                  </div>


                  <div className="kam-completion-count">

                    <span>
                      Approved Vehicles
                    </span>

                    <strong>
                      {approvedVehicles.length}
                    </strong>

                  </div>

                </div>


                {approvedVehicles.length > 0 ? (

                  <div className="kam-completion-table-wrap">

                    <table className="kam-completion-table">

                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Vehicle Type</th>
                          <th>Configuration Model</th>
                          <th>Movement Classification</th>
                          <th>Quantity</th>
                          <th>Weight</th>
                          <th>Dimensions (L × H × W)</th>
                          <th>Approved Transporter</th>
                          <th>Contact Person</th>
                          <th>Contact Number</th>
                          <th>Approved Rate</th>
                          <th>Status</th>
                        </tr>
                      </thead>


                      <tbody>

                        {approvedVehicles.map(
                          (
                            vehicle,
                            index
                          ) => {

                            const selectedTransport =
                              vehicle.selectedTransport ||
                              {};

                            const dimensions =
                              vehicle.length !==
                                undefined &&
                              vehicle.length !==
                                null &&
                              vehicle.length !==
                                "" &&
                              vehicle.height !==
                                undefined &&
                              vehicle.height !==
                                null &&
                              vehicle.height !==
                                "" &&
                              vehicle.width !==
                                undefined &&
                              vehicle.width !==
                                null &&
                              vehicle.width !==
                                ""
                                ? `${vehicle.length} × ${vehicle.height} × ${vehicle.width}`
                                : vehicle.dimensions ||
                                  "—";

                            return (

                              <tr
                                key={
                                  vehicle._id ||
                                  vehicle.vehicleSubId ||
                                  index
                                }
                              >

                                <td>
                                  <span className="kam-completion-row-no">
                                    {String(
                                      index + 1
                                    ).padStart(
                                      2,
                                      "0"
                                    )}
                                  </span>
                                </td>


                                <td>
                                  <div className="kam-completion-vehicle-cell">

                                    <strong>
                                      {vehicle.vehicleType ||
                                        "—"}
                                    </strong>

                                    <span>
                                      {vehicle.vehicleSubId ||
                                        ""}
                                    </span>

                                  </div>
                                </td>


                                <td>
                                  {vehicle.configurationModel ||
                                    "—"}
                                </td>


                                <td>
                                  {vehicle.movementClassification ||
                                    "—"}
                                </td>


                                <td>
                                  <strong>
                                    {vehicle.quantity ||
                                      0}
                                  </strong>{" "}
                                  NOS
                                </td>


                                <td>
                                  {vehicle.weight !==
                                    undefined &&
                                  vehicle.weight !==
                                    null &&
                                  vehicle.weight !==
                                    ""
                                    ? `${vehicle.weight} TON`
                                    : "—"}
                                </td>


                                <td>
                                  {dimensions}
                                </td>


                                <td>
                                  <div className="kam-completion-vehicle-cell">

                                    <strong>
                                      {selectedTransport.transportName ||
                                        "—"}
                                    </strong>

                                    <span>
                                      {selectedTransport.quotationId ||
                                        ""}
                                    </span>

                                  </div>
                                </td>


                                <td>
                                  {selectedTransport.contactName ||
                                    "—"}
                                </td>


                                <td>
                                  {selectedTransport.contactNumber ||
                                    "—"}
                                </td>


                                <td>
                                  <strong className="kam-completion-rate">
                                    {formatAmount(
                                      selectedTransport.amount
                                    )}
                                  </strong>
                                </td>


                                <td>
                                  <span className="kam-completion-status">
                                    ✓ Approved
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

                  <div className="kam-completion-empty">
                    No approved vehicle allocations are available.
                  </div>

                )}

              </section>


              {/* =========================================
                  PO / DOCUMENT DETAILS
              ========================================= */}

              <section className="kam-completion-card">

                <div className="kam-completion-card-head">

                  <div className="kam-completion-step-icon">
                    04
                  </div>

                  <div>
                    <span className="kam-completion-eyebrow">
                      PO DOCUMENTS
                    </span>

                    <h3>
                      Purchase Order &amp; Billing Details
                    </h3>

                    <p>
                      Purchase order and supporting documentation information.
                    </p>
                  </div>

                </div>


                <div className="kam-completion-info-grid">

                  <div>
                    <span>
                      Client PO Number
                    </span>

                    <strong>
                      {order.poNumber ||
                        form.poNumber ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      PO Validity Period
                    </span>

                    <strong>
                      {formatDisplayDate(
                        order.poDate ||
                        form.poDate
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Billing GSTIN
                    </span>

                    <strong>
                      {order.billingGstin ||
                        order.billingGSTIN ||
                        form.billingGstin ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      PO Document
                    </span>

                    <strong>
                      {order.poDocumentName ||
                        form.poDocumentName ||
                        "—"}
                    </strong>
                  </div>

                </div>


                <div className="kam-completion-notes-grid">

                  <div>
                    <span>
                      Scope of Work
                    </span>

                    <p>
                      {order.scopeOfWork ||
                        form.scopeOfWork ||
                        "—"}
                    </p>
                  </div>


                  <div>
                    <span>
                      Registered Billing Address
                    </span>

                    <p>
                      {order.registeredBillingAddress ||
                        order.billingAddress ||
                        form.registeredBillingAddress ||
                        "—"}
                    </p>
                  </div>


                  <div className="kam-completion-note-full">
                    <span>
                      Document Remarks
                    </span>

                    <p>
                      {order.poRemarks ||
                        form.poRemarks ||
                        "—"}
                    </p>
                  </div>

                </div>

              </section>


              {/* =========================================
                  FINAL VEHICLE / DRIVER CONFIRMATION
              ========================================= */}

              <section className="kam-completion-card kam-completion-final-card">

                <div className="kam-completion-card-head">

                  <div className="kam-completion-step-icon">
                    05
                  </div>

                  <div>
                    <span className="kam-completion-eyebrow">
                      FINAL CONFIRMATION
                    </span>

                    <h3>
                      Vehicle &amp; Driver Confirmation
                    </h3>

                    <p>
                      Enter final operational details before completing the order.
                    </p>
                  </div>

                </div>


                <div className="kam-completion-form-grid">

                  <LifecycleField
                    label="Vehicle Number"
                    placeholder="e.g. KA01AB1234"
                    value={
                      form.vehicleNumber
                    }
                    onChange={
                      handleChange(
                        "vehicleNumber"
                      )
                    }
                  />


                  <LifecycleField
                    label="Driver Name"
                    placeholder="Enter driver name"
                    value={
                      form.driverName
                    }
                    onChange={
                      handleChange(
                        "driverName"
                      )
                    }
                  />


                  <LifecycleField
                    label="Driver Number"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={
                      form.driverNumber
                    }
                    onChange={
                      handleChange(
                        "driverNumber"
                      )
                    }
                  />


                  <div className="kam-field-group">

                    <label>
                      Deployment Date
                    </label>

                    <input
                      type="date"
                      className="kam-date-input"
                      value={
                        form.placementDate
                      }
                      onChange={
                        handleChange(
                          "placementDate"
                        )
                      }
                    />

                  </div>

                </div>


                <div className="kam-field-group kam-field-full kam-completion-instruction">

                  <label>
                    Final Instructions
                  </label>

                  <textarea
                    rows={3}
                    value={
                      form.instructions
                    }
                    onChange={
                      handleChange(
                        "instructions"
                      )
                    }
                    placeholder="Enter final instructions..."
                  />

                </div>

              </section>

            </div>
          );


        default:

          return null;
      }
    };



  return (

    <div
      className={`kam-detail-card ${
        activeStepIndex === 2
          ? "kam-vendor-step-active"
          : ""
      } ${
        activeStepIndex === 4
          ? "kam-completion-step-active"
          : ""
      }`}
    >

      <div className="kam-stepper">

        {LIFECYCLE_STEPS.map(
          (
            label,
            index
          ) => (

            <React.Fragment
              key={label}
            >

              <button
                type="button"
                onClick={() => {
                  const allowedStep =
                    index <= activeStepIndex ||
                    (
                      index === 2 &&
                      approvalStatus === "Approved"
                    );

                  if (allowedStep) {
                    setActiveStepIndex(index);
                  }
                }}
                className={
                  "kam-step-pill" +
                  (
                    index ===
                      activeStepIndex
                      ? " active"
                      : ""
                  ) +
                  (
                    index <
                      activeStepIndex
                      ? " completed"
                      : ""
                  )
                }
              >

                <span className="kam-step-number">

                  {index <
                    activeStepIndex
                    ? "✓"
                    : index + 1}

                </span>

                <span>
                  {label}
                </span>

              </button>

              {index <
                LIFECYCLE_STEPS.length -
                1 && (

                  <div
                    className={
                      "kam-step-connector" +
                      (
                        index <
                          activeStepIndex
                          ? " completed"
                          : ""
                      )
                    }
                  />
                )}

            </React.Fragment>
          ))}

      </div>



      <div className="kam-card-body">

        <div className="kam-card-header">

          <div>

            <span className="kam-section-kicker">
              ORDER WORKFLOW
            </span>

            <h2>
              {
                LIFECYCLE_STEPS[
                activeStepIndex
                ]
              }{" "}
              Details
            </h2>

            <p>

              {activeStepIndex ===
                0 &&
                "Review all client enquiry and trip requirement information."}

              {activeStepIndex ===
                1 &&
                "Finalize the commercial rate, approval and payment terms."}

              {activeStepIndex ===
                2 &&
                "Finalize vendor and vehicle requirement."}

              {activeStepIndex ===
                3 &&
                "Record PO details and supporting documentation."}

              {activeStepIndex ===
                4 &&
                "Confirm vehicle and driver details before completion."}

            </p>

          </div>

          <div className="kam-id-badge">

              <span>
                ORDER ID
              </span>

              <strong>
                {order.id}
              </strong>

            </div>

        </div>



        {activeStepIndex !== 0 && (

          <div className="kam-order-overview">

            <div>

              <span>
                Customer
              </span>

              <strong>
                {order.companyName ||
                  order.customer ||
                  "—"}
              </strong>

            </div>

            <div>

              <span>
                {isIntercarting
                  ? "Site"
                  : "Route"}
              </span>

              <strong>

                {isIntercarting
                  ? order.siteLocation ||
                  "—"
                  : `${order.origin ||
                  "—"
                  } → ${order.destination ||
                  "—"
                  }`}

              </strong>

            </div>

            <div>

              <span>
                Cargo Type
              </span>

              <strong>
                {order.cargo ||
                  "—"}
              </strong>

            </div>

            <div>

              <span>
                Vehicles
              </span>

              <strong>
                {order.vehicles?.length ||
                  "Pending"}
              </strong>

            </div>

          </div>
        )}

        {renderStepFields()}



        <div className="kam-actions">

          <button
            type="button"
            className="kam-btn-outline"
            onClick={
              handleSaveDraft
            }
            disabled={
              isUpdating
            }
          >

            {isUpdating
              ? "Saving..."
              : "Save Draft"}

          </button>

          <button
            type="button"
            className="kam-btn-primary"
            onClick={
              activeStepIndex === 1 && approvalStatus !== "Approved"
                ? handleRequestApproval
                : handleAdvance
            }
            disabled={
              isUpdating ||
              (activeStepIndex === 1 && approvalStatus === "Pending")
            }
          >
            {isUpdating
              ? activeStepIndex === 1
                ? "Submitting..."
                : "Updating..."
              : activeStepIndex === 1
                ? approvalStatus === "Pending"
                  ? "Approval Pending"
                  : approvalStatus === "Approved"
                    ? "Proceed to Vendor Finalization"
                    : approvalStatus === "Rejected"
                      ? "Request Approval Again"
                      : "Request Approval"
                : activeStepIndex === LIFECYCLE_STEPS.length - 1
                  ? "Complete Order"
                  : `Continue to ${LIFECYCLE_STEPS[activeStepIndex + 1]}`}

            {!isUpdating && approvalStatus !== "Pending" && (
              <span>→</span>
            )}
          </button>

        </div>

      </div>

    </div>
  );
};

const LifecycleField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  prefix = "",
  required = false,
}) => (

  <div className="kam-field-group">

    <label>
      {label}
      {required && (
        <span className="kam-required-mark">*</span>
      )}
    </label>

    <div className="kam-input-wrap">

      {prefix && (
        <span className="kam-prefix">
          {prefix}
        </span>
      )}

      <input
        type={type}
        min={
          type === "number"
            ? "0"
            : undefined
        }
        value={
          value ?? ""
        }
        placeholder={
          placeholder
        }
        onChange={
          onChange
        }
      />

    </div>

  </div>
);


export default Lifecyclemodal;