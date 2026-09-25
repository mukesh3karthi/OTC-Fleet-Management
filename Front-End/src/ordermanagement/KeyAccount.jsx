  import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";

  import "../ordermanagement/keyaccount.css";

  import jsPDF from "jspdf";
  import autoTable from "jspdf-autotable";

  import Tripcreatemodal from "./Tripcreatemodal";
  import Lifecyclemodal from "./Lifecyclemodal";

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
    VEHICLE TYPES
  ========================================================= */

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

  /* =========================================================
    EMPTY VEHICLE REQUIREMENT
  ========================================================= */

  const createEmptyVehicleRequirement = () => ({
    requirementId: "",
    vehicleType: "",
    configuration: "",
    classification: "",
    quantity: "1",
    weight: "",

    dimensions: {
      length: "",
      height: "",
      width: "",
    },
  });

  /* =========================================================
    EMPTY TRIP FORM
  ========================================================= */

  const createEmptyTripForm = (
    tripId = ""
  ) => ({
    tripId,

    movementType: "",

    customer: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    assignedKam: "",

    enquiryDate: "",
    placementDate: "",

    origin: "",
    destination: "",
    distance: "",
    totalVehicles: "",

    materialType: "",
    remark: "",

    siteLocation: "",
    period: "",
    dieselScope: "",

    routeLocations: [],

    vehicleRequirements: [
      createEmptyVehicleRequirement(),
    ],
  });

  /* =========================================================
    DATE
  ========================================================= */

  const toDateInput = (value) => {
    if (!value) {
      return "";
    }

    if (
      typeof value === "object" &&
      value.$date
    ) {
      return toDateInput(
        value.$date
      );
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      const text =
        String(value);

      return text.length >= 10
        ? text.slice(0, 10)
        : text;
    }

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /* =========================================================
    NUMBER
  ========================================================= */

  const numberText = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "";
    }

    const number =
      Number(value);

    return Number.isFinite(number)
      ? String(number)
      : "";
  };

  /* =========================================================
    MONGO ID
  ========================================================= */

  const getMongoId = (value) => {
    if (!value) {
      return "";
    }

    if (
      typeof value === "object"
    ) {
      return String(
        value.$oid ||
        value.toString?.() ||
        ""
      );
    }

    return String(value);
  };

  /* =========================================================
    ORDER KEY
  ========================================================= */

  const getOrderKey = (order) =>
    getMongoId(
      order?._id
    ) ||
    String(
      order?.tripId || ""
    );


  /* =========================================================
    EDIT MOVEMENT TYPE
  ========================================================= */

  const getEditableMovementType = (order = {}) => {
    const normalized = String(
      order?.movementType || ""
    )
      .trim()
      .toLowerCase();

    if (
      normalized === "wtg movement" ||
      normalized === "wtg"
    ) {
      return "WTG Movement";
    }

    if (
      normalized === "intercarting" ||
      normalized === "inter carting" ||
      normalized === "inter-carting"
    ) {
      return "Intercarting";
    }

    if (
      normalized === "crane" ||
      normalized === "crane movement"
    ) {
      return "Crane";
    }

    if (normalized === "other") {
      return "Other";
    }

    if (
      order?.dieselScope ||
      order?.siteLocation ||
      order?.period
    ) {
      return "Intercarting";
    }

    const requirements = Array.isArray(
      order?.vehicleRequirements
    )
      ? order.vehicleRequirements
      : [];

    const vehicleText = requirements
      .map((requirement) =>
        String(
          requirement?.vehicleType || ""
        ).toLowerCase()
      )
      .join(" ");

    if (vehicleText.includes("crane")) {
      return "Crane";
    }

    const wtgKeywords = [
      "low bed",
      "hydraulic axle",
      "multi axle",
      "flatbed trailer",
      "extendable trailer",
      "modular hydraulic",
      "spmt",
    ];

    if (
      wtgKeywords.some((keyword) =>
        vehicleText.includes(keyword)
      )
    ) {
      return "WTG Movement";
    }

    return "Other";
  };

  /* =========================================================
    STAGE CLASS
  ========================================================= */

  const getStageClass = (
    stage
  ) =>
    `stage-badge stage-${String(
      stage || ""
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )}`;

  /* =========================================================
    DISPLAY STAGE
    Keeps the UI lifecycle stage aligned with PO/Vendor flow
    without changing the raw backend stage.
  ========================================================= */

  /* =========================================================
   DISPLAY STAGE
   Keeps table stage aligned with complete lifecycle
========================================================= */

const getDisplayStage = (order = {}) => {
  const requirements = Array.isArray(
    order?.vehicleRequirements
  )
    ? order.vehicleRequirements
    : [];

  const confirmations = Array.isArray(
    order?.vehicleConfirmations
  )
    ? order.vehicleConfirmations
    : [];

  const allocatedVehicles = Array.isArray(
    order?.allocatedVehicles
  )
    ? order.allocatedVehicles
    : [];

  const approvedConfirmations =
    confirmations.filter(
      (confirmation) =>
        String(
          confirmation?.status || ""
        )
          .trim()
          .toLowerCase() === "approved"
    );

  /* =====================================================
     VEHICLE APPROVAL COMPLETED
  ===================================================== */

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

  /* =====================================================
     RAW BACKEND STAGE
  ===================================================== */

  const rawStage = String(
    order?.stage || ""
  )
    .trim()
    .toLowerCase();

  const rawStatus = String(
    order?.status || ""
  )
    .trim()
    .toLowerCase();

  /* =====================================================
     TRIP COMPLETE

     Trip is complete when:
     1. Backend stage = Trip Complete
        OR
     2. Backend status = Completed
        OR
     3. All allocated vehicles have
        unloading.status = Completed
  ===================================================== */

  const allVehiclesUnloaded =
    allocatedVehicles.length > 0 &&
    allocatedVehicles.every(
      (vehicle) =>
        String(
          vehicle?.unloading?.status || ""
        )
          .trim()
          .toLowerCase() === "completed"
    );

  const tripCompleted =
    rawStage === "trip complete" ||
    rawStatus === "completed" ||
    allVehiclesUnloaded;

  /*
   * IMPORTANT:
   * Check Trip Complete BEFORE Tracking.
   */

  if (tripCompleted) {
    return "Trip Complete";
  }

  /* =====================================================
     APPROVAL MANAGEMENT
  ===================================================== */

  const approvalManagementApproved =
    vehicleApprovalCompleted ||
    rawStage === "tracking input";

  /* =====================================================
     PO DOCUMENT
  ===================================================== */

  const poCompleted =
    String(
      order?.poDocument?.status || ""
    )
      .trim()
      .toLowerCase() === "completed" ||
    Boolean(
      order?.poDocument?.poNumber &&
        (
          order?.poDocument?.fileName ||
          order?.poDocument?.fileUrl ||
          order?.poDocument?.documentUrl
        )
    );

  /* =====================================================
     VENDOR FINALIZATION
  ===================================================== */

  const vendorCompleted =
    String(
      order?.vendorFinalization?.status || ""
    )
      .trim()
      .toLowerCase() === "completed" ||
    vehicleApprovalCompleted;

  /* =====================================================
     ORDER PLACED
  ===================================================== */

  const orderPlacedCompleted =
    String(
      order?.orderPlaced?.status || ""
    )
      .trim()
      .toLowerCase() === "completed";

  /* =====================================================
     TRACKING
  ===================================================== */

  if (
    orderPlacedCompleted ||
    rawStage === "tracking"
  ) {
    return "Tracking";
  }

  /* =====================================================
     PO DOCUMENT
  ===================================================== */

  if (
    approvalManagementApproved &&
    !poCompleted
  ) {
    return "PO Document";
  }

  /* =====================================================
     VENDOR FINALIZATION
  ===================================================== */

  if (
    poCompleted &&
    !vendorCompleted
  ) {
    return "Vendor Finalization";
  }

  /* =====================================================
     ORDER PLACED
  ===================================================== */

  if (
    poCompleted &&
    vendorCompleted &&
    !orderPlacedCompleted
  ) {
    return "Order Placed";
  }

  /* =====================================================
     DEFAULT
  ===================================================== */

  const backendStage =
    String(order?.stage || "").trim();

  // Display-only stage names.
  // Backend/API values remain unchanged.
  if (
    backendStage.toLowerCase() ===
    "first approval management"
  ) {
    return "Order Approval";
  }

  if (
    backendStage.toLowerCase() ===
    "second approval management"
  ) {
    return "Quotation Approval";
  }

  return (
    backendStage ||
    "Order Approval"
  );
};

  /* =========================================================
    ORDER APPROVAL STATUS

    IMPORTANT:
    This is FIRST approval only.

    Key Account
          ↓
    Approval Management
          ↓
    Traffic
  ========================================================= */

  const getDisplayOrderStatus = (
    order
  ) => {
    const status =
      order?.orderApproval
        ?.status ||
      "Pending";

    if (
      status === "Approved"
    ) {
      return "Approved";
    }

    if (
      status === "Rejected"
    ) {
      return "Rejected";
    }

    return "Pending";
  };

  const getOrderStatusClass = (
    order
  ) => {
    const status =
      getDisplayOrderStatus(
        order
      );

    return `order-status-badge order-status-${status.toLowerCase()}`;
  };

  /* =========================================================
    NEXT TRIP ID
  ========================================================= */

  const getNextTripId = (orders = []) => {
    const year = new Date().getFullYear();

    // Common Order ID for every movement:
    // 2026-1, 2026-2, 2026-3...
    // Movement type is never included in the Order ID.
    const pattern = new RegExp(`^${year}-(\\d+)$`);

    const highestNumber = orders.reduce(
      (highest, order) => {
        const tripId = String(
          order?.tripId || ""
        ).trim();

        const match = tripId.match(pattern);

        if (!match) {
          return highest;
        }

        const sequence = Number(match[1]);

        if (
          !Number.isInteger(sequence) ||
          sequence < 1
        ) {
          return highest;
        }

        return Math.max(
          highest,
          sequence
        );
      },
      0
    );

    return `${year}-${highestNumber + 1}`;
  };

  /* =========================================================
    NORMALIZE VEHICLE REQUIREMENT
  ========================================================= */

  const normalizeRequirement = (
    requirement = {}
  ) => ({
    requirementId:
      requirement.requirementId ||
      "",

    vehicleType:
      requirement.vehicleType ||
      "",

    configuration:
      requirement.configuration ||
      "",

    classification:
      requirement.classification ||
      "",

    quantity:
      numberText(
        requirement.quantity ?? 1
      ) || "1",

    weight:
      numberText(
        requirement.weight
      ),

    dimensions: {
      length:
        numberText(
          requirement
            ?.dimensions
            ?.length
        ),

      height:
        numberText(
          requirement
            ?.dimensions
            ?.height
        ),

      width:
        numberText(
          requirement
            ?.dimensions
            ?.width
        ),
    },
  });

  /* =========================================================
    DATABASE -> UI
  ========================================================= */

  const mapDbTripToOrder = (
    trip = {}
  ) => {
    const vehicleRequirements =
      Array.isArray(
        trip.vehicleRequirements
      )
        ? trip.vehicleRequirements.map(
            normalizeRequirement
          )
        : [];

    return {
      ...trip,

      _id:
        getMongoId(
          trip._id
        ),

      id:
        trip.tripId ||
        getMongoId(
          trip._id
        ),

      tripId:
        trip.tripId ||
        "",

      movementType:
        trip.movementType ||
        "",

      customer:
        trip.customer ||
        "",

      contactPerson:
        trip.contactPerson ||
        "",

      contactNumber:
        trip.contactNumber ||
        "",

      email:
        trip.email ||
        "",

      assignedKam:
        trip.assignedKam ||
        "",

      enquiryDate:
        toDateInput(
          trip.enquiryDate
        ),

      placementDate:
        toDateInput(
          trip.placementDate
        ),

      origin:
        trip.origin ||
        "",

      destination:
        trip.destination ||
        "",

      distance:
        trip.distance ?? "",

      totalVehicles:
        trip.totalVehicles ?? "",

      routeLocations:
        Array.isArray(
          trip.routeLocations
        )
          ? trip.routeLocations
          : [],

      materialType:
        trip.materialType ||
        "",

      remark:
        trip.remark ||
        "",

      siteLocation:
        trip.siteLocation ||
        "",

      period:
        trip.period ||
        "",

      dieselScope:
        trip.dieselScope ||
        "",

      status:
        trip.status ||
        "Pending",

      stage:
        trip.stage ||
        "Order Approval",

      orderApproval: {
        status:
          trip.orderApproval
            ?.status ||
          "Pending",

        approvedBy:
          trip.orderApproval
            ?.approvedBy ||
          "",

        approvedAt:
          trip.orderApproval
            ?.approvedAt ||
          null,

        remarks:
          trip.orderApproval
            ?.remarks ||
          "",

        rejectionReason:
          trip.orderApproval
            ?.rejectionReason ||
          "",
      },

      vehicleRequirements,

      trafficQuotations:
        Array.isArray(
          trip.trafficQuotations
        )
          ? trip.trafficQuotations
          : [],

      vehicleConfirmations:
        Array.isArray(
          trip.vehicleConfirmations
        )
          ? trip.vehicleConfirmations
          : [],

      allocatedVehicles:
        Array.isArray(
          trip.allocatedVehicles
        )
          ? trip.allocatedVehicles
          : [],
    };
  };

  /* =========================================================
    API RESPONSE
  ========================================================= */

  const getResponseData = (
    data
  ) => {
    if (
      Array.isArray(data)
    ) {
      return data;
    }

    if (
      Array.isArray(
        data?.data
      )
    ) {
      return data.data;
    }

    if (
      Array.isArray(
        data?.trips
      )
    ) {
      return data.trips;
    }

    if (
      data?.data &&
      typeof data.data ===
        "object"
    ) {
      return data.data;
    }

    if (
      data?.trip &&
      typeof data.trip ===
        "object"
    ) {
      return data.trip;
    }

    return data;
  };

  /* =========================================================
    API REQUEST
  ========================================================= */

  const apiRequest = async (
    url,
    options = {}
  ) => {
    const response =
      await fetch(
        url,
        {
          ...options,

          headers: {
            "Content-Type":
              "application/json",

            ...(options.headers ||
              {}),
          },
        }
      );

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
      );
    }

    return getResponseData(
      data
    );
  };

  /* =========================================================
    PROFESSIONAL PDF EXPORT
  ========================================================= */

  const pdfText = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object" && value.$date) return pdfText(value.$date);
    return String(value);
  };

  const pdfDate = (value) => {
    if (!value) return "—";
    const date = new Date(value?.$date || value);
    if (Number.isNaN(date.getTime())) return pdfText(value);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const humanizePdfKey = (key = "") =>
    String(key)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const flattenPdfObject = (value, prefix = "", rows = []) => {
    if (value === null || value === undefined || value === "") return rows;

    if (Array.isArray(value)) {
      if (!value.length) return rows;
      value.forEach((item, index) => {
        const label = `${prefix}${prefix ? " " : ""}${index + 1}`;
        if (item && typeof item === "object") {
          flattenPdfObject(item, label, rows);
        } else {
          rows.push([label, pdfText(item)]);
        }
      });
      return rows;
    }

    if (typeof value === "object") {
      Object.entries(value).forEach(([key, item]) => {
        if (["__v"].includes(key)) return;
        const label = prefix
          ? `${prefix} / ${humanizePdfKey(key)}`
          : humanizePdfKey(key);
        if (item && typeof item === "object" && !item.$date) {
          flattenPdfObject(item, label, rows);
        } else if (item !== "" && item !== null && item !== undefined) {
          rows.push([label, item?.$date ? pdfDate(item.$date) : pdfText(item)]);
        }
      });
      return rows;
    }

    rows.push([prefix || "Value", pdfText(value)]);
    return rows;
  };

  const downloadOrderPdf = (order = {}) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 18;

    const addPageHeader = () => {
      doc.setFillColor(15, 56, 68);
      doc.rect(0, 0, pageWidth, 23, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("OTC GROUPS", margin, 10);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text("Trip Order & Logistics Lifecycle Report", margin, 16);
      doc.text(`Order ID: ${pdfText(order.tripId)}`, pageWidth - margin, 10, { align: "right" });
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, pageWidth - margin, 16, { align: "right" });
      doc.setTextColor(30, 41, 59);
      y = 31;
    };

    const ensureSpace = (needed = 22) => {
      if (y + needed > pageHeight - 18) {
        doc.addPage();
        addPageHeader();
      }
    };

    const addSectionTitle = (title) => {
      ensureSpace(14);
      doc.setFillColor(232, 246, 246);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 1.5, 1.5, "F");
      doc.setTextColor(15, 93, 102);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title, margin + 3, y + 5.3);
      doc.setTextColor(30, 41, 59);
      y += 11;
    };

    const addKeyValueTable = (title, rows) => {
      const cleanRows = rows.filter((row) => row[1] !== undefined && row[1] !== null && row[1] !== "");
      if (!cleanRows.length) return;
      addSectionTitle(title);
      autoTable(doc, {
        startY: y,
        body: cleanRows.map(([label, value]) => [label, pdfText(value)]),
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: { font: "helvetica", fontSize: 8.2, cellPadding: 2.4, textColor: [30, 41, 59], lineColor: [220, 228, 232], lineWidth: 0.15 },
        columnStyles: { 0: { cellWidth: 48, fontStyle: "bold", fillColor: [248, 250, 252] } },
        didDrawPage: () => {},
      });
      y = doc.lastAutoTable.finalY + 7;
    };

    const addDataTable = (title, headers, body) => {
      if (!Array.isArray(body) || !body.length) return;
      addSectionTitle(title);
      autoTable(doc, {
        startY: y,
        head: [headers],
        body,
        theme: "grid",
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [15, 93, 102], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
        styles: { font: "helvetica", fontSize: 7.2, cellPadding: 2, textColor: [30, 41, 59], lineColor: [220, 228, 232], lineWidth: 0.15, overflow: "linebreak" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      y = doc.lastAutoTable.finalY + 7;
    };

    addPageHeader();

    addKeyValueTable("ORDER OVERVIEW", [
      ["Order ID", order.tripId],
      ["Movement Type", order.movementType],
      ["Stage", getDisplayStage(order)],
      ["Order Status", getDisplayOrderStatus(order)],
      ["Customer", order.customer],
      ["Assigned KAM", order.assignedKam],
      ["Material Type", order.materialType],
      ["Total Vehicles", order.totalVehicles],
      ["Enquiry Date", pdfDate(order.enquiryDate)],
      ["Placement Date", pdfDate(order.placementDate)],
    ]);

    addKeyValueTable("CUSTOMER & CONTACT DETAILS", [
      ["Customer", order.customer],
      ["Contact Person", order.contactPerson],
      ["Contact Number", order.contactNumber],
      ["Email", order.email],
      ["Assigned KAM", order.assignedKam],
      ["Remark", order.remark],
    ]);

    addKeyValueTable("ROUTE & MOVEMENT DETAILS", [
      ["Origin", order.origin],
      ["Route Locations", Array.isArray(order.routeLocations) && order.routeLocations.length ? order.routeLocations.join("  →  ") : "—"],
      ["Destination", order.destination],
      ["Planned Distance", order.distance ? `${order.distance} KM` : "—"],
      ["Site Location", order.siteLocation],
      ["Period", order.period],
      ["Diesel Scope", order.dieselScope],
    ]);

    addDataTable(
      "VEHICLE REQUIREMENTS",
      ["#", "Requirement ID", "Vehicle Type", "Configuration", "Class", "Qty", "Weight", "Dimensions (L×W×H)"],
      (order.vehicleRequirements || []).map((item, index) => [
        index + 1,
        pdfText(item.requirementId),
        pdfText(item.vehicleType),
        pdfText(item.configuration),
        pdfText(item.classification),
        pdfText(item.quantity),
        item.weight !== undefined && item.weight !== "" ? `${item.weight} Ton` : "—",
        `${pdfText(item.dimensions?.length)} × ${pdfText(item.dimensions?.width)} × ${pdfText(item.dimensions?.height)}`,
      ])
    );

    addKeyValueTable("FIRST APPROVAL", [
      ["Status", order.orderApproval?.status],
      ["Approved By", order.orderApproval?.approvedBy],
      ["Approved At", pdfDate(order.orderApproval?.approvedAt)],
      ["Remarks", order.orderApproval?.remarks],
      ["Rejection Reason", order.orderApproval?.rejectionReason],
    ]);

    addDataTable(
      "TRAFFIC QUOTATIONS",
      ["#", "Requirement", "Transporter", "Vehicle", "Rate", "Allocator", "Contact", "Status"],
      (order.trafficQuotations || []).map((item, index) => [
        index + 1,
        pdfText(item.requirementId),
        pdfText(item.selectedTransport || item.transportProvider || item.vendorAssigned || item.vendorName),
        pdfText(item.vehicleType || item.type),
        pdfText(item.finalRate ?? item.rate ?? item.quotedRate),
        pdfText(item.allocatorName),
        pdfText(item.contactNumber),
        pdfText(item.status),
      ])
    );

    addDataTable(
      "VEHICLE / QUOTATION APPROVALS",
      ["#", "Requirement", "Vehicle", "Transporter", "Status", "Approved By", "Remarks"],
      (order.vehicleConfirmations || []).map((item, index) => [
        index + 1,
        pdfText(item.requirementId),
        pdfText(item.vehicleType || item.type),
        pdfText(item.selectedTransport || item.transportProvider || item.vendorAssigned || item.vendorName),
        pdfText(item.status),
        pdfText(item.approvedBy || item.confirmedBy),
        pdfText(item.remarks || item.remark),
      ])
    );

    addKeyValueTable("PO & ORDER PLACEMENT", [
      ["PO Status", order.poDocument?.status],
      ["PO Number", order.poDocument?.poNumber],
      ["PO File", order.poDocument?.fileName],
      ["PO Uploaded At", pdfDate(order.poDocument?.uploadedAt || order.poDocument?.updatedAt)],
      ["Vendor Finalization", order.vendorFinalization?.status],
      ["Order Placed Status", order.orderPlaced?.status],
      ["Order Placed At", pdfDate(order.orderPlaced?.placedAt || order.orderPlaced?.updatedAt)],
    ]);

    (order.allocatedVehicles || []).forEach((vehicle, index) => {
      addKeyValueTable(`ALLOCATED VEHICLE ${index + 1}`, [
        ["Vehicle Number", vehicle.vehicleNumber],
        ["Vehicle Type", vehicle.vehicleType || vehicle.type],
        ["Transporter", vehicle.transportProvider || vehicle.selectedTransport || vehicle.vendorName],
        ["Driver Name", vehicle.driverName],
        ["Driver Contact", vehicle.driverNumber || vehicle.contactNumber],
        ["Escort Name", vehicle.escortName],
        ["Escort Vehicle", vehicle.escortVehicleNumber],
        ["Supervisor", vehicle.supervisorName],
        ["Loading Point", vehicle.loadingPoint],
        ["Unloading Point", vehicle.unloadingPoint],
        ["Placement Date", pdfDate(vehicle.placementDate)],
        ["Loading Status", vehicle.loading?.status],
        ["Unloading Status", vehicle.unloading?.status],
      ]);

      addDataTable(
        `DAILY TRACKING — ${pdfText(vehicle.vehicleNumber)}`,
        ["#", "Date", "Current Location", "Yesterday Location", "Today KM", "Yesterday KM", "Day KM", "Status", "Remarks"],
        (vehicle.dailyTracking || []).map((track, trackIndex) => [
          trackIndex + 1,
          pdfDate(track.date || track.trackingDate || track.createdAt),
          pdfText(track.currentLocation || track.todayLocation),
          pdfText(track.yesterdayLocation),
          pdfText(track.todayKm),
          pdfText(track.yesterdayKm),
          pdfText(track.dayKm),
          pdfText(track.status),
          pdfText(track.remarks || track.remark),
        ])
      );
    });

    // Complete appendix ensures backend fields added later are not silently omitted.
    const appendixRows = flattenPdfObject(order).filter(([key]) => !/^_id$/i.test(key));
    addKeyValueTable("COMPLETE ORDER DATA APPENDIX", appendixRows);

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(220, 228, 232);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("OTC Groups • Confidential Operational Report", margin, pageHeight - 7);
      doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
    }

    const safeId = String(order.tripId || "order").replace(/[^a-z0-9-_]+/gi, "-");
    doc.save(`OTC-Trip-Report-${safeId}.pdf`);
  };

  /* =========================================================
    MAIN COMPONENT
  ========================================================= */

  const KeyAccount = () => {
    const [
      orders,
      setOrders,
    ] = useState([]);

    const [
      search,
      setSearch,
    ] = useState("");

    const [
      stageFilter,
      setStageFilter,
    ] = useState(
      "All Stages"
    );

    const [
      selectedOrderId,
      setSelectedOrderId,
    ] = useState(null);

    const [
      showTripModal,
      setShowTripModal,
    ] = useState(false);

    const [
      tripForm,
      setTripForm,
    ] = useState(
      () =>
        createEmptyTripForm()
    );

    const [
      toast,
      setToast,
    ] = useState("");

    const [
      tripUpload,
      setTripUpload,
    ] = useState(null);

    const [
      editingOrderId,
      setEditingOrderId,
    ] = useState(null);

    const [
      isSaving,
      setIsSaving,
    ] = useState(false);

    const [
      isLoadingOrders,
      setIsLoadingOrders,
    ] = useState(true);

    const [
      openActionMenu,
      setOpenActionMenu,
    ] = useState(null);

    const [
      actionMenuPosition,
      setActionMenuPosition,
    ] = useState(null);

    /* =======================================================
      LOAD ORDERS
    ======================================================= */

    const loadOrders =
      useCallback(
        async () => {
          setIsLoadingOrders(
            true
          );

          try {
            const data =
              await apiRequest(
                TRIP_API_URL
              );

            const list =
              Array.isArray(data)
                ? data
                : [];

            setOrders(
              list.map(
                mapDbTripToOrder
              )
            );
          } catch (error) {
            console.error(
              "Load trip orders error:",
              error
            );

            setOrders([]);

            setToast(
              error.message ||
              "Unable to load orders."
            );
          } finally {
            setIsLoadingOrders(
              false
            );
          }
        },
        []
      );

    useEffect(() => {
      loadOrders();
    }, [loadOrders]);

    /* =======================================================
      TOAST
    ======================================================= */

    useEffect(() => {
      if (!toast) {
        return undefined;
      }

      const timer =
        window.setTimeout(
          () =>
            setToast(""),
          3000
        );

      return () =>
        window.clearTimeout(
          timer
        );
    }, [toast]);

    /* =======================================================
      ACTION MENU
    ======================================================= */

    useEffect(() => {
      if (!openActionMenu) {
        return undefined;
      }

      const closeMenu = () => {
        setOpenActionMenu(null);
        setActionMenuPosition(null);
      };

      document.addEventListener(
        "click",
        closeMenu
      );

      window.addEventListener(
        "resize",
        closeMenu
      );

      window.addEventListener(
        "scroll",
        closeMenu,
        true
      );

      return () => {
        document.removeEventListener(
          "click",
          closeMenu
        );

        window.removeEventListener(
          "resize",
          closeMenu
        );

        window.removeEventListener(
          "scroll",
          closeMenu,
          true
        );
      };
    }, [openActionMenu]);

    /* =======================================================
      SELECTED ORDER
    ======================================================= */

    const selectedOrder =
      useMemo(
        () =>
          orders.find(
            (order) =>
              getOrderKey(
                order
              ) ===
              selectedOrderId
          ) || null,
        [
          orders,
          selectedOrderId,
        ]
      );

    /* =======================================================
      STAGES
    ======================================================= */

    const stages =
      useMemo(
        () => [
          "All Stages",

          ...Array.from(
            new Set(
              orders
                .map(
                  (order) =>
                    getDisplayStage(order)
                )
                .filter(Boolean)
            )
          ),
        ],
        [orders]
      );

    /* =======================================================
      FILTER
    ======================================================= */

    const filteredOrders =
      useMemo(() => {
        const searchText =
          search
            .trim()
            .toLowerCase();

        return orders.filter(
          (order) => {
            const requirementData =
              Array.isArray(
                order
                  .vehicleRequirements
              )
                ? order
                    .vehicleRequirements
                    .flatMap(
                      (
                        requirement
                      ) => [
                        requirement
                          .requirementId,

                        requirement
                          .vehicleType,

                        requirement
                          .configuration,

                        requirement
                          .classification,

                        requirement
                          .quantity,

                        requirement
                          .weight,
                      ]
                    )
                : [];

            const haystack = [
              order.tripId,
              order.movementType,

              order.customer,
              order.contactPerson,
              order.contactNumber,
              order.email,

              order.assignedKam,

              order.materialType,

              order.origin,
              order.destination,
              order.distance,
              order.totalVehicles,

              getDisplayStage(order),
              order.status,

              order.orderApproval
                ?.status,

              order.enquiryDate,
              order.placementDate,

              order.siteLocation,
              order.period,
              order.dieselScope,

              order.remark,

              ...requirementData,
            ]
              .filter(
                (value) =>
                  value !==
                    undefined &&
                  value !== null
              )
              .join(" ")
              .toLowerCase();

            const matchesSearch =
              !searchText ||
              haystack.includes(
                searchText
              );

            const matchesStage =
              stageFilter ===
                "All Stages" ||
              getDisplayStage(order) ===
                stageFilter;

            return (
              matchesSearch &&
              matchesStage
            );
          }
        );
      }, [
        orders,
        search,
        stageFilter,
      ]);

    /* =======================================================
      STATS
    ======================================================= */

    const stats =
      useMemo(() => {
        const active =
          orders.filter(
            (order) =>
              Array.isArray(
                order
                  .allocatedVehicles
              ) &&
              order
                .allocatedVehicles
                .length > 0
          ).length;

        const approvalPending =
          orders.filter(
            (order) =>
              (
                order
                  .orderApproval
                  ?.status ||
                "Pending"
              ) === "Pending"
          ).length;

        const quotationPending =
          orders.filter(
            (order) => {
              if (
                order
                  .orderApproval
                  ?.status !==
                "Approved"
              ) {
                return false;
              }

              const confirmations =
                Array.isArray(
                  order
                    .vehicleConfirmations
                )
                  ? order
                      .vehicleConfirmations
                  : [];

              return (
                !confirmations.some(
                  (
                    confirmation
                  ) =>
                    confirmation
                      .status ===
                    "Approved"
                )
              );
            }
          ).length;

        return {
          total:
            orders.length,

          active,

          approvalPending,

          quotationPending,
        };
      }, [orders]);

    /* =======================================================
      OPEN ORDER
    ======================================================= */

    const handleOrderClick =
      (order) => {
        setSelectedOrderId(
          getOrderKey(
            order
          )
        );
      };

    const handleBackFromDetail =
      () => {
        setSelectedOrderId(
          null
        );
      };

    /* =======================================================
      NEW TRIP
    ======================================================= */

    const handleOpenTripModal =
      () => {
        setEditingOrderId(
          null
        );

        setTripForm(
          createEmptyTripForm(
            getNextTripId(
              orders
            )
          )
        );

        setTripUpload(
          null
        );

        setShowTripModal(
          true
        );
      };

    /* =======================================================
      EDIT TRIP

      All orders can be edited.
    ======================================================= */

    const handleEditTrip =
      (order) => {

        const orderId =
          getMongoId(
            order._id
          );

        if (!orderId) {
          setToast(
            "Order database ID is missing."
          );

          return;
        }

        setEditingOrderId(
          orderId
        );

        setTripUpload(
          null
        );

        setTripForm({
          ...createEmptyTripForm(
            order.tripId || ""
          ),

          tripId:
            order.tripId || "",

          movementType:
            getEditableMovementType(
              order
            ),

          customer:
            order.customer ||
            "",

          contactPerson:
            order.contactPerson ||
            "",

          contactNumber:
            order.contactNumber ||
            "",

          email:
            order.email ||
            "",

          assignedKam:
            order.assignedKam ||
            "",

          enquiryDate:
            toDateInput(
              order.enquiryDate
            ),

          placementDate:
            toDateInput(
              order.placementDate
            ),

          origin:
            order.origin || "",

          destination:
            order.destination ||
            "",

          distance:
            numberText(
              order.distance
            ),

          totalVehicles:
            numberText(
              order.totalVehicles
            ),

          materialType:
            order.materialType ||
            "",

          remark:
            order.remark || "",

          siteLocation:
            order.siteLocation ||
            "",

          period:
            order.period || "",

          dieselScope:
            order.dieselScope ||
            "",

          routeLocations:
            Array.isArray(
              order.routeLocations
            )
              ? [
                  ...order
                    .routeLocations,
                ]
              : [],

          vehicleRequirements:
            Array.isArray(
              order
                .vehicleRequirements
            ) &&
            order
              .vehicleRequirements
              .length
              ? order
                  .vehicleRequirements
                  .map(
                    normalizeRequirement
                  )
              : [
                  createEmptyVehicleRequirement(),
                ],
        });

        setShowTripModal(
          true
        );
      };

    /* =======================================================
      CLOSE MODAL
    ======================================================= */

    const handleCloseTripModal =
      () => {
        if (isSaving) {
          return;
        }

        setShowTripModal(
          false
        );

        setEditingOrderId(
          null
        );

        setTripForm(
          createEmptyTripForm()
        );

        setTripUpload(
          null
        );
      };

    const handleTripOverlayClick =
      (event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleCloseTripModal();
        }
      };

    /* =======================================================
      FORM FIELD
    ======================================================= */

    const handleTripFieldChange =
      (field) =>
      (event) => {
        setTripForm(
          (previous) => ({
            ...previous,

            [field]:
              event.target.value,
          })
        );
      };

    const handleMovementTypeChange =
      (event) => {
        const movementType =
          event.target.value;

        setTripForm(
          (previous) => ({
            ...previous,
            movementType,
          })
        );

        setTripUpload(
          null
        );
      };

    const handleTripFileChange =
      (event) => {
        setTripUpload(
          event.target
            .files?.[0] ||
          null
        );
      };

    /* =======================================================
      REQUIREMENT FIELD
    ======================================================= */

    const handleWtgVehicleFieldChange =
      (
        index,
        field
      ) =>
      (event) => {
        const value =
          event.target.value;

        setTripForm(
          (previous) => ({
            ...previous,

            vehicleRequirements:
              previous
                .vehicleRequirements
                .map(
                  (
                    requirement,
                    requirementIndex
                  ) => {
                    if (
                      requirementIndex !==
                      index
                    ) {
                      return requirement;
                    }

                    if (
                      [
                        "length",
                        "height",
                        "width",
                      ].includes(
                        field
                      )
                    ) {
                      return {
                        ...requirement,

                        dimensions: {
                          ...requirement
                            .dimensions,

                          [field]:
                            value,
                        },
                      };
                    }

                    return {
                      ...requirement,

                      [field]:
                        value,
                    };
                  }
                ),
          })
        );
      };

    /* =======================================================
      ADD REQUIREMENT
    ======================================================= */

    const handleAddWtgVehicle =
      () => {
        setTripForm(
          (previous) => ({
            ...previous,

            vehicleRequirements: [
              ...previous
                .vehicleRequirements,

              createEmptyVehicleRequirement(),
            ],
          })
        );
      };

    /* =======================================================
      REMOVE REQUIREMENT
    ======================================================= */

    const handleRemoveWtgVehicle =
      (index) => {
        setTripForm(
          (previous) => {
            if (
              previous
                .vehicleRequirements
                .length <= 1
            ) {
              return previous;
            }

            return {
              ...previous,

              vehicleRequirements:
                previous
                  .vehicleRequirements
                  .filter(
                    (
                      _,
                      requirementIndex
                    ) =>
                      requirementIndex !==
                      index
                  ),
            };
          }
        );
      };

    /* =======================================================
      VALIDATION
    ======================================================= */

    const validateTripForm =
      () => {
        const requiredFields = [
          tripForm.tripId,
          tripForm.movementType,
          tripForm.customer,
          tripForm.contactPerson,
          tripForm.contactNumber,
          tripForm.email,
          tripForm.enquiryDate,
        ];

        if (
          requiredFields.some(
            (value) =>
              !String(
                value ?? ""
              ).trim()
          )
        ) {
          return (
            "Please complete all required customer and order details."
          );
        }

        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            String(
              tripForm.email
            ).trim()
          )
        ) {
          return (
            "Please enter a valid email address."
          );
        }

        if (
          tripForm.movementType ===
            "WTG Movement"
        ) {
          const totalVehicles =
            Number(
              tripForm.totalVehicles
            );

          if (
            !Number.isInteger(
              totalVehicles
            ) ||
            totalVehicles < 1
          ) {
            return (
              "Please enter a valid Total Vehicles value."
            );
          }
        }

        /*
         * Crane movement uses an uploaded vehicle requirement document.
         * Existing WTG / Intercarting / Other validation stays unchanged.
         */
        if (
          tripForm.movementType ===
          "Crane"
        ) {
          if (
            !editingOrderId &&
            !tripUpload
          ) {
            return (
              "Upload the Crane Vehicle Requirement document."
            );
          }

          return "";
        }

        if (
          !Array.isArray(
            tripForm
              .vehicleRequirements
          ) ||
          !tripForm
            .vehicleRequirements
            .length
        ) {
          return (
            "Add at least one vehicle requirement."
          );
        }

        const invalidRequirement =
          tripForm
            .vehicleRequirements
            .some(
              (requirement) => {
                if (
                  !String(
                    requirement
                      .vehicleType ||
                    ""
                  ).trim()
                ) {
                  return true;
                }

                const quantity =
                  Number(
                    requirement.quantity
                  );

                if (
                  !Number.isInteger(
                    quantity
                  ) ||
                  quantity < 1
                ) {
                  return true;
                }

                if (
                  requirement.weight !==
                    "" &&
                  (
                    !Number.isFinite(
                      Number(
                        requirement
                          .weight
                      )
                    ) ||
                    Number(
                      requirement.weight
                    ) < 0
                  )
                ) {
                  return true;
                }

                return false;
              }
            );

        if (
          invalidRequirement
        ) {
          return (
            "Please enter a valid Vehicle Type, Quantity and Weight for every vehicle requirement."
          );
        }

        return "";
      };

    /* =======================================================
      BUILD REQUIREMENTS
    ======================================================= */

    const buildVehicleRequirements =
      () =>
        tripForm
          .vehicleRequirements
          .map(
            (
              requirement,
              index
            ) => ({
              requirementId:
                requirement
                  .requirementId ||
                `${tripForm.tripId}-REQ-${
                  index + 1
                }`,

              vehicleType:
                String(
                  requirement
                    .vehicleType ||
                  ""
                ).trim(),

              configuration:
                String(
                  requirement
                    .configuration ||
                  ""
                ).trim(),

              classification:
                String(
                  requirement
                    .classification ||
                  ""
                ).trim(),

              quantity:
                Number(
                  requirement.quantity ||
                  1
                ),

              weight:
                Number(
                  requirement.weight ||
                  0
                ),

              dimensions: {
                length:
                  requirement
                    .dimensions
                    ?.length ===
                    "" ||
                  requirement
                    .dimensions
                    ?.length ===
                    undefined
                    ? null
                    : Number(
                        requirement
                          .dimensions
                          .length
                      ),

                height:
                  requirement
                    .dimensions
                    ?.height ===
                    "" ||
                  requirement
                    .dimensions
                    ?.height ===
                    undefined
                    ? null
                    : Number(
                        requirement
                          .dimensions
                          .height
                      ),

                width:
                  requirement
                    .dimensions
                    ?.width ===
                    "" ||
                  requirement
                    .dimensions
                    ?.width ===
                    undefined
                    ? null
                    : Number(
                        requirement
                          .dimensions
                          .width
                      ),
              },
            })
          );

    /* =======================================================
      BUILD PAYLOAD

      IMPORTANT:
      No orderApproval.
      No trafficQuotations.
      No vehicleConfirmations.
      No allocatedVehicles.
      No workflow status manipulation.

      Backend controls workflow.
    ======================================================= */

    const buildTripPayload =
      () => ({
        tripId:
          tripForm
            .tripId
            .trim()
            .toUpperCase(),

        movementType:
          tripForm
            .movementType
            .trim(),

        customer:
          tripForm
            .customer
            .trim(),

        contactPerson:
          tripForm
            .contactPerson
            .trim(),

        contactNumber:
          tripForm
            .contactNumber
            .trim(),

        email:
          tripForm
            .email
            .trim(),

        assignedKam:
          tripForm
            .assignedKam
            .trim(),

        enquiryDate:
          tripForm.enquiryDate ||
          null,

        placementDate:
          tripForm.placementDate ||
          null,

        origin:
          tripForm
            .origin
            .trim(),

        destination:
          tripForm
            .destination
            .trim(),

        distance:
          Number(
            tripForm.distance ||
            0
          ),

        totalVehicles:
          tripForm.totalVehicles ===
            "" ||
          tripForm.totalVehicles ===
            null ||
          tripForm.totalVehicles ===
            undefined
            ? 0
            : Number(
                tripForm.totalVehicles
              ),

        routeLocations:
          Array.isArray(
            tripForm.routeLocations
          )
            ? tripForm
                .routeLocations
                .map(
                  (location) =>
                    typeof location ===
                      "string"
                      ? location.trim()
                      : String(
                          location?.name ||
                          ""
                        ).trim()
                )
                .filter(Boolean)
            : [],

        materialType:
          tripForm
            .materialType
            .trim(),

        remark:
          tripForm
            .remark
            .trim(),

        siteLocation:
          tripForm
            .siteLocation
            .trim(),

        period:
          tripForm
            .period
            .trim(),

        dieselScope:
          tripForm
            .dieselScope
            .trim(),

        vehicleRequirements:
          buildVehicleRequirements(),
      });

    /* =======================================================
      CREATE / UPDATE
    ======================================================= */

    const handleCreateTrip =
      async () => {
        if (isSaving) {
          return;
        }

        const validationError =
          validateTripForm();

        if (validationError) {
          setToast(
            validationError
          );

          return;
        }

        const duplicate =
          orders.some(
            (order) =>
              getMongoId(
                order._id
              ) !==
                editingOrderId &&
              String(
                order.tripId || ""
              )
                .trim()
                .toLowerCase() ===
              String(
                tripForm.tripId ||
                ""
              )
                .trim()
                .toLowerCase()
          );

        if (duplicate) {
          setToast(
            "Trip ID already exists."
          );

          return;
        }

        const payload =
          buildTripPayload();

        setIsSaving(
          true
        );

        try {
          let savedData;

          if (
            editingOrderId
          ) {
            savedData =
              await apiRequest(
                `${TRIP_API_URL}/${editingOrderId}`,
                {
                  method: "PUT",

                  body:
                    JSON.stringify(
                      payload
                    ),
                }
              );
          } else if (
            tripForm.movementType ===
            "Crane"
          ) {
            /*
             * Crane creation is intentionally separate.
             * Old JSON createTrip flow is not changed.
             */
            const formData =
              new FormData();

            formData.append(
              "data",
              JSON.stringify(
                payload
              )
            );

            formData.append(
              "document",
              tripUpload
            );

            const response =
              await fetch(
                `${TRIP_API_URL}/crane`,
                {
                  method: "POST",
                  body: formData,
                }
              );

            let responseData =
              null;

            try {
              responseData =
                await response.json();
            } catch {
              responseData =
                null;
            }

            if (!response.ok) {
              throw new Error(
                responseData?.message ||
                responseData?.error ||
                `Request failed with status ${response.status}`
              );
            }

            savedData =
              getResponseData(
                responseData
              );
          } else {
            savedData =
              await apiRequest(
                TRIP_API_URL,
                {
                  method: "POST",

                  body:
                    JSON.stringify(
                      payload
                    ),
                }
              );
          }

          const savedOrder =
            mapDbTripToOrder(
              savedData
            );

          setOrders(
            (previous) => {
              if (
                editingOrderId
              ) {
                return previous.map(
                  (order) =>
                    getMongoId(
                      order._id
                    ) ===
                    editingOrderId
                      ? savedOrder
                      : order
                );
              }

              return [
                savedOrder,
                ...previous,
              ];
            }
          );

          setSelectedOrderId(
            getOrderKey(
              savedOrder
            )
          );

          setToast(
            editingOrderId
              ? `${savedOrder.tripId} updated successfully.`
              : `${savedOrder.tripId} created and sent for approval.`
          );

          setShowTripModal(
            false
          );

          setEditingOrderId(
            null
          );

          setTripForm(
            createEmptyTripForm()
          );

          setTripUpload(
            null
          );
        } catch (error) {
          console.error(
            "Save trip order error:",
            error
          );

          setToast(
            error.message ||
            "Unable to save order."
          );
        } finally {
          setIsSaving(
            false
          );
        }
      };

    /* =======================================================
      DELETE
    ======================================================= */

    const handleDeleteTrip =
      async (order) => {
        const orderId =
          getMongoId(
            order?._id
          );

        if (!orderId) {
          setToast(
            "Order database ID is missing."
          );

          return;
        }

        const tripLabel =
          order.tripId ||
          "this trip";

        const confirmed =
          window.confirm(
            `Are you sure you want to delete ${tripLabel}?`
          );

        if (!confirmed) {
          return;
        }

        try {
          await apiRequest(
            `${TRIP_API_URL}/${orderId}`,
            {
              method:
                "DELETE",
            }
          );

          setOrders(
            (previous) =>
              previous.filter(
                (item) =>
                  getMongoId(
                    item._id
                  ) !==
                  orderId
              )
          );

          if (
            selectedOrderId ===
            getOrderKey(
              order
            )
          ) {
            setSelectedOrderId(
              null
            );
          }

          if (
            editingOrderId ===
            orderId
          ) {
            setShowTripModal(
              false
            );

            setEditingOrderId(
              null
            );
          }

          setToast(
            `${tripLabel} deleted successfully.`
          );
        } catch (error) {
          console.error(
            "Delete trip error:",
            error
          );

          setToast(
            error.message ||
            "Unable to delete order."
          );
        }
      };

    /* =======================================================
      CLEAR FILTER
    ======================================================= */

    const handleClearFilters =
      () => {
        setSearch("");

        setStageFilter(
          "All Stages"
        );
      };

    /* =======================================================
      PAGE
    ======================================================= */

    return (
      <div className="key-account-page">

        {toast && (
          <div
            className={`kam-toast ${
              /success|created|updated|deleted|sent for approval/i.test(toast)
                ? "kam-toast-success"
                : /required|missing|complete|valid|exists/i.test(toast)
                ? "kam-toast-warning"
                : "kam-toast-error"
            }`}
            role="status"
            aria-live="polite"
          >
            <span className="kam-toast-icon" aria-hidden="true">
              {/success|created|updated|deleted|sent for approval/i.test(toast)
                ? "✓"
                : /required|missing|complete|valid|exists/i.test(toast)
                ? "!"
                : "×"}
            </span>

            <div className="kam-toast-content">
              <strong>
                {/success|created|updated|deleted|sent for approval/i.test(toast)
                  ? "Success"
                  : /required|missing|complete|valid|exists/i.test(toast)
                  ? "Required"
                  : "Action Failed"}
              </strong>
              <span>{toast}</span>
            </div>

            <button
              type="button"
              className="kam-toast-close"
              onClick={() => setToast("")}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        )}

        <div className="key-account-shell">

          {/* =================================================
              HEADER
          ================================================= */}

          <section className="kam-page-heading">

            <div>
              <h1>
                Order Management
              </h1>

              <p>
                Manage customer orders,
                vehicle requirements,
                approvals and trip
                readiness from one
                operational workspace.
              </p>
            </div>

            <button
              type="button"
              className="new-trip-button"
              onClick={
                handleOpenTripModal
              }
            >
              <span className="new-trip-plus">
                +
              </span>

              New Trip
            </button>

          </section>

          {/* =================================================
              STATS
          ================================================= */}

          <section className="kam-stat-grid">

            <SummaryCard
              label="Total Orders"
              value={
                stats.total
              }
              caption="All orders"
              icon="01"
            />

            <SummaryCard
              label="Active Movement"
              value={
                stats.active
              }
              caption="Vehicles in tracking"
              icon="02"
            />

            <SummaryCard
              label="Approval Pending"
              value={
                stats.approvalPending
              }
              caption="Awaiting order approval"
              icon="03"
            />

            <SummaryCard
              label="Quotation Pending"
              value={
                stats.quotationPending
              }
              caption="Awaiting transporter confirmation"
              icon="04"
            />

          </section>

          {/* =================================================
              ORDER LIST
          ================================================= */}

          <section className="key-account-container">

            <div className="key-account-header">

              <div className="key-account-header-left">
                <h2>
                  Running Order List
                </h2>
              </div>

              <div className="kam-header-indicator">
                <span className="kam-status-dot" />
                Live workspace
              </div>

            </div>

            {/* ===============================================
                FILTERS
            =============================================== */}

            <div className="key-account-filters">

              <div className="key-search-box">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <path
                    d="M16 16l4 4"
                  />
                </svg>

                <input
                  type="text"
                  placeholder="Search order, customer, material, route, status..."
                  value={
                    search
                  }
                  onChange={
                    (event) =>
                      setSearch(
                        event.target.value
                      )
                  }
                />

              </div>

              <div className="key-stage-select">

                <select
                  value={
                    stageFilter
                  }
                  onChange={
                    (event) =>
                      setStageFilter(
                        event.target.value
                      )
                  }
                >
                  {stages.map(
                    (stage) => (
                      <option
                        key={stage}
                        value={stage}
                      >
                        {stage}
                      </option>
                    )
                  )}
                </select>

                <svg
                  className="select-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M6 9l6 6 6-6"
                  />
                </svg>

              </div>

              {(
                search ||
                stageFilter !==
                  "All Stages"
              ) && (
                <button
                  type="button"
                  className="kam-clear-filter"
                  onClick={
                    handleClearFilters
                  }
                >
                  Clear
                </button>
              )}

              <div className="order-count">

                <strong>
                  {
                    filteredOrders.length
                  }
                </strong>

                <span>
                  of {orders.length} orders
                </span>

              </div>

            </div>

            {/* ===============================================
                TABLE
            =============================================== */}

            <div className="key-account-table-wrapper">

              <table className="key-account-table">

                <thead>
                  <tr>

                    <th>
                      ORDER ID
                    </th>

                    <th>
                      CUSTOMER
                    </th>

                    <th>
                      MATERIAL &amp; WEIGHT
                    </th>

                    <th>
    MOVEMENT
  </th>

                    <th>
                      ROUTE
                    </th>

                    <th>
                      STAGE
                    </th>

                    <th>
                      ORDER STATUS
                    </th>

                    <th>
                      ASSIGNED KAM
                    </th>

                    <th className="kam-actions-column">
                      ACTION
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredOrders.length >
                  0 ? (

                    filteredOrders.map(
                      (order, index) => {
                        const firstRequirement =
                          order
                            .vehicleRequirements
                            ?.[0] ||
                          {};

                        const orderStatus =
                          getDisplayOrderStatus(
                            order
                          );

                        const menuId =
                          getOrderKey(
                            order
                          );


                        return (
                          <tr
                            key={
                              menuId
                            }
                            className="key-account-row"
                            onClick={() =>
                              handleOrderClick(
                                order
                              )
                            }
                          >

                            {/* ORDER ID */}

                            <td>
                              <div className="order-id">
                                {order.tripId}
                              </div>
                            </td>

                            {/* CUSTOMER */}

                            <td>

                              <div className="client-name">
                                {order.customer ||
                                  "—"}
                              </div>

                              {order.contactPerson && (
                                <span className="order-subtext">
                                  Contact Person:{" "}
                                  {
                                    order.contactPerson
                                  }
                                </span>
                              )}

                            </td>

                            {/* MATERIAL */}

                            <td>

                              <div className="cargo-name">
                                {order.materialType ||
                                  "—"}
                              </div>

                              {firstRequirement
                                .weight !==
                                "" &&
                                firstRequirement
                                  .weight !==
                                  null &&
                                firstRequirement
                                  .weight !==
                                  undefined && (

                                <div className="cargo-weight">
                                  {
                                    firstRequirement
                                      .weight
                                  }{" "}
                                  TON
                                </div>

                              )}

                            </td>

                          {/* MOVEMENT */}

                          <td>
                            <div
                              className={`kam-movement-type kam-movement-${String(
                                order.movementType || "other"
                              )
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")}`}
                            >
                              {order.movementType || "—"}
                            </div>
                          </td>

                            


                            {/* ROUTE */}

                            <td>

                              <span>
                                {order.origin ||
                                  "—"}
                              </span>

                              <span className="route-arrow">
                                →
                              </span>

                              <span>
                                {order.destination ||
                                  "—"}
                              </span>

                            </td>

                            {/* STAGE */}

                            <td>

                              <span
                                className={
                                  getStageClass(
                                    getDisplayStage(order)
                                  )
                                }
                              >
                                <span className="stage-dot" />

                                {getDisplayStage(order)}
                              </span>

                            </td>

                            {/* ORDER STATUS */}

                            <td>

                              <span
                                className={
                                  getOrderStatusClass(
                                    order
                                  )
                                }
                              >
                                <span className="order-status-dot" />

                                {
                                  orderStatus
                                }
                              </span>

                            </td>

                            {/* ASSIGNED KAM */}

                            <td>
                              <div className="role-responsible">
                                {order.assignedKam ||
                                  "—"}
                              </div>
                            </td>

                            {/* ACTION */}

                            <td
                              className="kam-actions-cell"
                              onClick={
                                (event) =>
                                  event.stopPropagation()
                              }
                            >

                              <div className="kam-action-menu-wrap">

                                <button
                                  type="button"
                                  className={`kam-three-dot-btn ${
                                    openActionMenu ===
                                    menuId
                                      ? "active"
                                      : ""
                                  }`}
                                  aria-label={`Actions for ${order.tripId}`}
                                  aria-expanded={
                                    openActionMenu ===
                                    menuId
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();

                                    if (openActionMenu === menuId) {
                                      setOpenActionMenu(null);
                                      setActionMenuPosition(null);
                                      return;
                                    }

                                    const rect =
                                      event.currentTarget.getBoundingClientRect();

                                    const menuWidth = 122;
                                    const menuHeight = 110;
                                    const gap = 6;
                                    const edge = 10;

                                    const spaceBelow =
                                      window.innerHeight - rect.bottom;

                                    const openUp =
                                      spaceBelow < menuHeight + gap + edge &&
                                      rect.top > menuHeight + gap + edge;

                                    const top = openUp
                                      ? Math.max(
                                          edge,
                                          rect.top - menuHeight - gap
                                        )
                                      : Math.min(
                                          window.innerHeight - menuHeight - edge,
                                          rect.bottom + gap
                                        );

                                    const left = Math.min(
                                      window.innerWidth - menuWidth - edge,
                                      Math.max(
                                        edge,
                                        rect.right - menuWidth
                                      )
                                    );

                                    setActionMenuPosition({
                                      top,
                                      left,
                                      openUp,
                                    });

                                    setOpenActionMenu(menuId);
                                  }}
                                >
                                  <span />
                                  <span />
                                  <span />
                                </button>

                                {openActionMenu ===
                                  menuId && (

                                  <div
                                    className={`kam-action-dropdown kam-action-dropdown-fixed ${
                                      actionMenuPosition?.openUp
                                        ? "kam-action-dropdown-up"
                                        : ""
                                    }`}
                                    style={{
                                      top: actionMenuPosition?.top ?? 0,
                                      left: actionMenuPosition?.left ?? 0,
                                    }}
                                    role="menu"
                                    onClick={
                                      (event) =>
                                        event.stopPropagation()
                                    }
                                  >

                                    {/* EDIT */}

                                    <button
                                      type="button"
                                      className="kam-dropdown-item"
                                      role="menuitem"
                                      onClick={
                                        (event) => {
                                          event.stopPropagation();

                                          setOpenActionMenu(
                                            null
                                          );

                                          handleEditTrip(
                                            order
                                          );
                                        }
                                      }
                                    >

                                      <span className="kam-action-item-icon">

                                        <svg
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M12 20h9"
                                          />

                                          <path
                                            d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
                                          />
                                        </svg>

                                      </span>

                                      <span className="kam-action-item-text">
                                        <strong>
                                          Edit
                                        </strong>
                                      </span>

                                    </button>

                                    {/* DOWNLOAD PDF */}

                                    <button
                                      type="button"
                                      className="kam-dropdown-item"
                                      role="menuitem"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setOpenActionMenu(null);
                                        setActionMenuPosition(null);

                                        try {
                                          downloadOrderPdf(order);
                                          setToast(`${order.tripId || "Order"} PDF downloaded successfully.`);
                                        } catch (error) {
                                          console.error("PDF download error:", error);
                                          setToast("Unable to generate PDF report.");
                                        }
                                      }}
                                    >
                                      <span className="kam-action-item-icon">
                                        <svg
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          aria-hidden="true"
                                        >
                                          <path d="M12 3v12" />
                                          <path d="m7 10 5 5 5-5" />
                                          <path d="M5 21h14" />
                                        </svg>
                                      </span>

                                      <span className="kam-action-item-text">
                                        <strong>Download PDF</strong>
                                      </span>
                                    </button>

                                    {/* DELETE */}

                                    <button
                                      type="button"
                                      className="kam-dropdown-item kam-dropdown-delete"
                                      role="menuitem"
                                      onClick={
                                        (event) => {
                                          event.stopPropagation();

                                          setOpenActionMenu(
                                            null
                                          );

                                          handleDeleteTrip(
                                            order
                                          );
                                        }
                                      }
                                    >

                                      <span className="kam-action-item-icon">

                                        <svg
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M3 6h18"
                                          />

                                          <path
                                            d="M8 6V4h8v2"
                                          />

                                          <path
                                            d="M19 6l-1 14H6L5 6"
                                          />

                                          <path
                                            d="M10 11v5"
                                          />

                                          <path
                                            d="M14 11v5"
                                          />
                                        </svg>

                                      </span>

                                      <span className="kam-action-item-text">
                                        <strong>
                                          Delete
                                        </strong>
                                      </span>

                                    </button>

                                  </div>

                                )}

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan="9"
                        className="no-orders"
                      >

                        <div className="no-orders-icon">
                          ⌕
                        </div>

                        <strong>
                          {isLoadingOrders
                            ? "Loading orders..."
                            : "No matching orders found"}
                        </strong>

                        <span>
                          {isLoadingOrders
                            ? "Loading orders from the server."
                            : "Try changing search or stage filter."}
                        </span>

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </section>

        </div>

        {/* ===================================================
            READ-ONLY ORDER LIFECYCLE

            No onUpdate.
            Lifecyclemodal will be converted to read-only.
        =================================================== */}

        {selectedOrder && (

          <Lifecyclemodal
            key={
              getOrderKey(
                selectedOrder
              )
            }
            order={
              selectedOrder
            }
            onClose={
              handleBackFromDetail
            }
            primaryVehicleTypes={
              PRIMARY_VEHICLE_TYPES
            }
          />

        )}

        {/* ===================================================
            CREATE / EDIT
        =================================================== */}

        <Tripcreatemodal
          showTripModal={
            showTripModal
          }

          tripForm={
            tripForm
          }

          tripUpload={
            tripUpload
          }

          primaryVehicleTypes={
            PRIMARY_VEHICLE_TYPES
          }

          handleTripOverlayClick={
            handleTripOverlayClick
          }

          handleMovementTypeChange={
            handleMovementTypeChange
          }

          handleCloseTripModal={
            handleCloseTripModal
          }

          handleTripFieldChange={
            handleTripFieldChange
          }

          handleAddWtgVehicle={
            handleAddWtgVehicle
          }

          handleWtgVehicleFieldChange={
            handleWtgVehicleFieldChange
          }

          handleRemoveWtgVehicle={
            handleRemoveWtgVehicle
          }

          handleTripFileChange={
            handleTripFileChange
          }

          handleCreateTrip={
            handleCreateTrip
          }

          isEditing={
            Boolean(
              editingOrderId
            )
          }

          isSaving={
            isSaving
          }
        />

      </div>
    );
  };

  /* =========================================================
    SUMMARY CARD
  ========================================================= */

  const SummaryCard = ({
    label,
    value,
    caption,
    icon,
  }) => (
    <article className="kam-stat-card">

      <div className="kam-stat-icon">
        {icon}
      </div>

      <div>

        <span className="kam-stat-label">
          {label}
        </span>

        <strong className="kam-stat-value">
          {value}
        </strong>

        <span className="kam-stat-caption">
          {caption}
        </span>

      </div>

    </article>
  );

  export default KeyAccount;