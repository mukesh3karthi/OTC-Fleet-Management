// Intercarting orders are managed in the Intercarting module.
const isIntercartingOrder = (order) => {
  const movement =
    order?.movementType ||
    order?.movement ||
    order?.movementName ||
    order?.movementCategory ||
    order?.orderFinalization?.movementType ||
    order?.enquiryDetails?.movementType ||
    "";
  return (
    String(movement)
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "") === "intercarting"
  );
};

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileClock,
  FileWarning,
  Download,
  FileSpreadsheet,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Search,
  Truck,
  X,
} from "lucide-react";
import "../pagescss/tracking.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");
const API_URL = `${API_BASE}/api/triporders`;
const STATUSES = ["Moving", "Idle", "Breakdown", "Pending", "Reached"];
const list = (value) => (Array.isArray(value) ? value : []);
const text = (value) => (value == null ? "" : String(value?.$oid ?? value));
const keyOf = (trip) => text(trip?._id) || text(trip?.tripId) || text(trip?.id);
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dateKey = (value) => {
  if (value == null || value === "") return "";
  if (typeof value === "object" && !(value instanceof Date)) {
    if (value.$date !== undefined) return dateKey(value.$date);
    if (value.$numberLong !== undefined)
      return dateKey(Number(value.$numberLong));
    return "";
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
      ? value
      : "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = dateFormatter.formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};
const dateNumber = (key) => (key ? Date.parse(`${key}T00:00:00Z`) : NaN);
const shortDate = (key) =>
  key
    ? new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      })
    : "—";
const normalizeSearch = (value) =>
  text(value).normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
const latestTracking = (vehicle) =>
  list(vehicle?.dailyTracking)
    .slice()
    .sort(
      (a, b) =>
        (dateNumber(dateKey(a.date || a.updatedAt)) || 0) -
        (dateNumber(dateKey(b.date || b.updatedAt)) || 0),
    )
    .at(-1);
const hasDocument = (doc) =>
  Boolean(
    doc?.fileName ||
    doc?.originalName ||
    doc?.filePath ||
    doc?.fileUrl ||
    doc?.mimeType,
  );
const isDelivered = (vehicle) =>
  text(latestTracking(vehicle)?.status || vehicle?.status)
    .trim()
    .toLowerCase() === "reached" ||
  text(vehicle?.unloading?.status).trim().toLowerCase() === "completed";
const podPending = (vehicle) =>
  isDelivered(vehicle) && !hasDocument(vehicle?.pod);
const ewayExpiring = (vehicle, today) => {
  const doc = vehicle?.ewayBill;
  if (!doc?.number && !hasDocument(doc)) return false;
  const expiry = dateKey(doc?.validUpto);
  const days = (dateNumber(expiry) - dateNumber(today)) / 86400000;
  return Number.isFinite(days) && days >= 0 && days <= 2;
};
// Retain the previous tracking page's document-aware arrival status.
const vehicleStatus = (vehicle, today) => {
  const unloading = text(vehicle?.unloading?.status || vehicle?.unloadingStatus)
    .trim()
    .toLowerCase();
  // Unloading completion is more authoritative than an older daily movement.
  if (unloading === "completed") return "Reached";
  const status = text(
    latestTracking(vehicle)?.status || vehicle?.status || "Idle",
  )
    .trim()
    .toLowerCase();
  if (status === "moving") return "Moving";
  if (status === "breakdown") return "Breakdown";
  if (status !== "reached") return "Idle";
  const unloaded =
    text(vehicle?.unloading?.status || vehicle?.unloadingStatus)
      .trim()
      .toLowerCase() === "completed";
  const lrReady = Boolean(
    vehicle?.lr?.number || vehicle?.lr?.date || hasDocument(vehicle?.pod),
  );
  const bill = vehicle?.ewayBill || {};
  const billStatus = text(bill.status).trim().toLowerCase();
  const billReady =
    Boolean(bill.number || hasDocument(bill)) &&
    !["pending", "expired"].includes(billStatus) &&
    (!dateKey(bill.validUpto) || dateKey(bill.validUpto) >= today);
  return unloaded && lrReady && billReady ? "Reached" : "Pending";
};
const tripStatus = (trip, today) => {
  const savedStage = text(trip?.stage).trim().toLowerCase();
  const savedStatus = text(trip?.status).trim().toLowerCase();
  if (
    ["trip complete", "trip completed", "completed"].includes(savedStage) ||
    ["trip complete", "trip completed", "completed"].includes(savedStatus)
  ) return "Reached";
  const statuses = list(trip?.allocatedVehicles)
    .filter((vehicle) =>
      text(vehicle?.vehicleStatus).trim().toLowerCase() !== "replaced"
    )
    .map((vehicle) =>
    vehicleStatus(vehicle, today),
  );
  if (!statuses.length) return "Pending";
  if (statuses.every((status) => status === "Reached")) return "Reached";
  return (
    ["Breakdown", "Moving", "Pending", "Idle"].find((status) =>
      statuses.includes(status),
    ) || "Idle"
  );
};
const isOperational = (trip) =>
  list(trip?.allocatedVehicles).length > 0 ||
  text(trip?.orderPlaced?.status).trim().toLowerCase() === "completed" ||
  ["tracking", "trip complete", "trip completed", "completed"].includes(
    text(trip?.stage).trim().toLowerCase(),
  );
const matchesSearch = (trip, query) => {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  const vehicles = list(trip.allocatedVehicles);
  const fields = [
    trip.tripId,
    trip.customer,
    trip.contactPerson,
    trip.contactNumber,
    trip.materialType,
    trip.origin,
    trip.destination,
    trip.siteLocation,
    ...vehicles.flatMap((vehicle) => [
      vehicle.vehicleNumber,
      vehicle.vehicleNo,
      vehicle.vehicleType,
      vehicle.transporter,
      vehicle.driver?.name,
      vehicle.driver?.contactNumber,
      latestTracking(vehicle)?.currentLocation,
    ]),
  ].map(normalizeSearch);
  const joined = fields.join(" ");
  const compact = normalizeSearch(query).replace(/[\s-]+/g, "");
  return (
    fields.some((field) => field.replace(/[\s-]+/g, "").includes(compact)) ||
    words.every((word) => joined.includes(word))
  );
};
const matchesDate = (trip, selectedDate) =>
  !selectedDate ||
  [trip.placementDate, trip.enquiryDate, trip.createdAt, trip.tripDate].some(
    (value) => dateKey(value) === selectedDate,
  ) ||
  list(trip.allocatedVehicles).some((vehicle) =>
    list(vehicle.dailyTracking).some(
      (entry) => dateKey(entry.date || entry.updatedAt) === selectedDate,
    ),
  );
const extractTrips = (payload) => {
  for (const value of [
    payload,
    payload?.data,
    payload?.trips,
    payload?.orders,
    payload?.data?.trips,
    payload?.data?.orders,
  ])
    if (Array.isArray(value)) return value;
  throw new Error("The server returned an unexpected trip list.");
};
const buildActivity = (trips, endDate) => {
  const end = dateNumber(endDate);
  const days = Array.from({ length: 7 }, (_, index) => ({
    date: new Date(end - (6 - index) * 86400000).toISOString().slice(0, 10),
    count: 0,
  }));
  trips.forEach((trip) => {
    const key = dateKey(
      trip.createdAt || trip.enquiryDate || trip.placementDate,
    );
    const entry = days.find((day) => day.date === key);
    if (entry) entry.count += 1;
  });
  return days;
};


/* Tracking register: each vehicle has its own row, grouped by trip. */
const trackingRegisterFields = [
  "S.NO", "Customer", "Vehicle NO", "Origin", "Destination",
  "Current Location", "Vehicle Type", "Driver NO", "Total KM",
  "Running Kms", "Balance KM", "Current Status", "Remarks", "Description",
];
const registerText = (...values) => {
  for (const v of values) {
    if (v !== null && v !== undefined && String(v).trim()) return String(v).trim();
  }
  return "—";
};
const registerKm = (...values) => {
  for (const raw of values) {
    if (raw === "" || raw == null) continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
};
const trackingExportGroups = (selectedTrips, today) => selectedTrips.map((trip, index) => {
  const vehicles = list(trip.allocatedVehicles).filter(
    (vehicle) => text(vehicle?.vehicleStatus).trim().toLowerCase() !== "replaced",
  );
  const total = registerKm(trip.totalKm, trip.totalKM, trip.distance, trip.totalDistance);
  const entries = (vehicles.length ? vehicles : [null]).map((vehicle) => {
    const latest = vehicle ? latestTracking(vehicle) : null;
    const running = registerKm(
      latest?.runningKms, latest?.runningKm, latest?.kmCovered,
      vehicle?.runningKms, vehicle?.runningKm, vehicle?.kmsCovered,
    );
    const explicitBalance = registerKm(latest?.balanceKm, latest?.remainingKm, vehicle?.balanceKm);
    const balance = explicitBalance !== null ? explicitBalance
      : total !== null && running !== null ? Math.max(0, total - running) : null;
    return {
      "S.NO": String(index + 1),
      Customer: registerText(trip.customer),
      "Vehicle NO": registerText(vehicle?.vehicleNumber, vehicle?.vehicleNo),
      Origin: registerText(trip.origin, trip.siteLocation),
      Destination: registerText(trip.destination),
      "Current Location": registerText(latest?.currentLocation, vehicle?.currentLocation),
      "Vehicle Type": registerText(vehicle?.vehicleType, vehicle?.type,
        list(trip.vehicleRequirements)[0]?.vehicleType),
      "Driver NO": registerText(vehicle?.driver?.contactNumber, vehicle?.driverContactNumber),
      "Total KM": total === null ? "—" : String(total),
      "Running Kms": running === null ? "—" : String(running),
      "Balance KM": balance === null ? "—" : String(balance),
      "Current Status": vehicle ? registerText(latest?.remarks, latest?.status, vehicleStatus(vehicle, today)) : tripStatus(trip, today),
      Remarks: registerText(latest?.remarks, vehicle?.remarks, trip.remark, trip.remarks),
      Description: registerText(vehicle?.description, latest?.description,
        list(trip.vehicleRequirements)[0]?.vehicleType, trip.materialType),
    };
  });
  return { trip, rows: entries };
});

const exportTrackingExcel = async (groups) => {
  // Unlike CSV, XLSX preserves merged cells, fills, widths and borders.
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "OTC Groups";
  workbook.title = "Vehicle Tracking Register";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Tracking Register", {
    views: [{ state: "frozen", ySplit: 4 }],
    pageSetup: { paperSize: 8, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    properties: { defaultRowHeight: 23 },
  });
  const headings = trackingRegisterFields;
  sheet.columns = [
    { width: 8 }, { width: 29 }, { width: 23 }, { width: 25 },
    { width: 25 }, { width: 24 }, { width: 17 }, { width: 19 },
    { width: 15 }, { width: 15 }, { width: 15 }, { width: 38 },
    { width: 36 }, { width: 29 },
  ];
  const darkBlue = "315493";
  const darkNavy = "0D3B50";
  const navyText = "163C52";
  const border = { style: "thin", color: { argb: "FF9AA5B0" } };
  const generated = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const vehicleRows = groups.reduce((sum, group) => sum + group.rows.length, 0);

  sheet.mergeCells("A1:N2");
  const title = sheet.getCell("A1");
  title.value = "OTC GROUPS  |  VEHICLE TRACKING REGISTER";
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${darkNavy}` } };
  title.font = { name: "Calibri", bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  title.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(1).height = 24;
  sheet.getRow(2).height = 17;
  sheet.mergeCells("A3:N3");
  const subtitle = sheet.getCell("A3");
  subtitle.value = `${groups.length} trip(s)  |  ${vehicleRows} vehicle row(s)  |  Generated: ${generated}`;
  subtitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF5F7" } };
  subtitle.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF355C70" } };
  subtitle.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
  sheet.getRow(3).height = 25;

  const head = sheet.getRow(4);
  headings.forEach((heading, index) => {
    const cell = head.getCell(index + 1);
    cell.value = heading;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${darkBlue}` } };
    cell.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { top: border, left: border, right: border, bottom: border };
  });
  head.height = 34;
  sheet.autoFilter = { from: "A4", to: "N4" };
  const grouped = new Set([1, 2, 4, 5, 9]); // S.NO, Customer, Origin, Destination, Total KM
  let rowNumber = 5;
  groups.forEach(({ rows }) => {
    const first = rowNumber;
    rows.forEach((record) => {
      const row = sheet.getRow(rowNumber);
      headings.forEach((field, i) => {
        const cell = row.getCell(i + 1);
        const value = record[field];
        const isKm = [9, 10, 11].includes(i + 1);
        const number = isKm && value !== "—" ? Number(value) : NaN;
        cell.value = isKm && Number.isFinite(number) ? number : String(value ?? "—");
        cell.alignment = { vertical: "middle", horizontal: isKm ? "center" : "center", wrapText: true };
        cell.font = { name: "Calibri", bold: [1, 2, 3, 12].includes(i + 1), size: 10, color: { argb: `FF${navyText}` } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb:
          i === 1 ? "FFFFF2CD" : i === 11 ? "FFF9CDB2" : i === 13 ? "FFCAF0D3" : "FFFFFFFF" } };
        cell.border = { top: border, bottom: border, left: border, right: border };
        if (isKm && Number.isFinite(number)) cell.numFmt = "#,##0.##";
      });
      row.height = 32;
      rowNumber += 1;
    });
    const last = rowNumber - 1;
    if (last > first) {
      grouped.forEach((column) => {
        sheet.mergeCells(first, column, last, column);
        sheet.getCell(first, column).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      });
    }
  });
  sheet.printTitlesRow = "1:4";
  sheet.pageMargins = { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 };
  const data = await workbook.xlsx.writeBuffer();
  const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Tracking_Register_${dateKey(new Date())}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const exportTrackingPdf = (groups) => {
  // Landscape A3 keeps all 14 register columns usable without tiny text.
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
  const width = doc.internal.pageSize.getWidth();
  const generated = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  doc.setFillColor(13, 59, 80);
  doc.rect(0, 0, width, 23, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("OTC GROUPS | VEHICLE TRACKING REGISTER", 9, 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${groups.length} trip(s)  |  ${groups.reduce((n, g) => n + g.rows.length, 0)} vehicle row(s)  |  ${generated}`, 9, 17);

  const groupedColumns = new Set(["S.NO", "Customer", "Origin", "Destination", "Total KM"]);
  // autoTable requires a column-key body for row-span cells to stay aligned.
  const objectBody = [];
  groups.forEach(({ rows }) => rows.forEach((row, index) => {
    const record = {};
    trackingRegisterFields.forEach((field) => {
      if (groupedColumns.has(field) && index > 0) return;
      record[field] = groupedColumns.has(field)
        ? { content: row[field], rowSpan: rows.length }
        : row[field];
    });
    objectBody.push(record);
  }));
  autoTable(doc, {
    startY: 27,
    columns: trackingRegisterFields.map((field) => ({ header: field, dataKey: field })),
    body: objectBody,
    theme: "grid",
    showHead: "everyPage",
    styles: { font: "helvetica", fontSize: 7.1, cellPadding: 2.1,
      textColor: [19, 53, 73], lineWidth: 0.15, lineColor: [142, 156, 168],
      valign: "middle", halign: "center", overflow: "linebreak" },
    headStyles: { fillColor: [49, 84, 147], textColor: [255, 255, 255], fontStyle: "bold", minCellHeight: 13 },
    columnStyles: {
      "S.NO": { cellWidth: 10 }, Customer: { cellWidth: 36, fillColor: [255, 242, 205] },
      "Vehicle NO": { cellWidth: 30 }, Origin: { cellWidth: 35 },
      Destination: { cellWidth: 34 }, "Current Location": { cellWidth: 31 },
      "Vehicle Type": { cellWidth: 20 }, "Driver NO": { cellWidth: 28 },
      "Total KM": { cellWidth: 17 }, "Running Kms": { cellWidth: 18 },
      "Balance KM": { cellWidth: 18 }, "Current Status": { cellWidth: 43, fillColor: [249, 205, 178] },
      Remarks: { cellWidth: 39 }, Description: { cellWidth: 37, fillColor: [202, 240, 211] },
    },
    margin: { left: 6, right: 6, bottom: 13 },
    didDrawPage: ({ pageNumber }) => {
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${pageNumber}`, width - 9, doc.internal.pageSize.getHeight() - 6, { align: "right" });
    },
  });
  doc.save(`Tracking_Register_${dateKey(new Date())}.pdf`);
};

const StatusBadge = ({ status }) => (
  <span className={`td-status td-status-${status.toLowerCase()}`}>
    {status}
  </span>
);

const TripActivity = ({ data }) => {
  const container = useRef(null);
  const [width, setWidth] = useState(300);
  const [hoverIndex, setHoverIndex] = useState(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return undefined;
    const measure = () => setWidth(Math.max(180, element.clientWidth));
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const max = Math.max(
    3,
    Math.ceil(Math.max(...data.map((day) => day.count), 0) / 3) * 3,
  );
  const left = 28,
    right = width - 15,
    top = 17,
    bottom = 142;
  const points = data.map((day, index) => ({
    ...day,
    x: left + (index * (right - left)) / 6,
    y: bottom - (day.count / max) * (bottom - top),
  }));
  const line = points
    .map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`)
    .join(" ");
  const selected = points[hoverIndex ?? 6];
  return (
    <section className="td-panel td-activity">
      <header className="td-panel-heading">
        <div>
          <h2>Trip activity</h2>
          <p>New trips · Last 7 days</p>
        </div>
        <span className="td-chart-total">
          {data.reduce((sum, day) => sum + day.count, 0)} trips
        </span>
      </header>
      <div className="td-chart-container" ref={container}>
        <svg
          className="td-chart-svg"
          viewBox={`0 0 ${width} 174`}
          role="img"
          aria-label={`Daily new trip counts: ${data.map((day) => `${shortDate(day.date)}: ${day.count}`).join(", ")}`}
        >
          {[0, 1, 2, 3].map((index) => {
            const y = bottom - (index / 3) * (bottom - top);
            return (
              <g key={index}>
                <line
                  x1={left}
                  x2={right}
                  y1={y}
                  y2={y}
                  className="td-chart-grid"
                />
                <text x={left - 9} y={y + 4} textAnchor="end">
                  {(index * max) / 3}
                </text>
              </g>
            );
          })}
          <path
            d={`${line} L${right},${bottom} L${left},${bottom} Z`}
            className="td-chart-area"
          />
          <path d={line} className="td-chart-line" />
          {points.map((point, index) => (
            <g key={point.date}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoverIndex === index ? 4 : 3}
                className="td-chart-point"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill="transparent"
                tabIndex="0"
                role="img"
                aria-label={`${shortDate(point.date)}: ${point.count} trips`}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(index)}
                onBlur={() => setHoverIndex(null)}
              >
                <title>
                  {shortDate(point.date)}: {point.count} trips
                </title>
              </circle>
              {[0, 3, 6].includes(index) && (
                <text
                  x={point.x}
                  y="166"
                  textAnchor={
                    index === 0 ? "start" : index === 6 ? "end" : "middle"
                  }
                >
                  {shortDate(point.date)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className="td-chart-caption">
        {shortDate(selected.date)}
        <strong>
          {selected.count} {selected.count === 1 ? "trip" : "trips"}
        </strong>
      </div>
    </section>
  );
};

const trackingTimestamp = (value) => {
  const raw = value?.$date ?? value;
  const parsed = new Date(raw?.$numberLong ? Number(raw.$numberLong) : raw).getTime();
  return raw == null || raw === "" || !Number.isFinite(parsed) ? 0 : parsed;
};
const buildRecentTrackingUpdates = (trips) => trips.flatMap((trip) =>
  list(trip.allocatedVehicles).filter((vehicle) =>
    text(vehicle?.vehicleStatus).trim().toLowerCase() !== "replaced",
  ).flatMap((vehicle, vehicleIndex) => {
    const entries = list(vehicle.dailyTracking);
    if (!entries.length) return [];
    const entry = entries.reduce((latest, candidate) => {
      const latestTime = trackingTimestamp(latest.updatedAt) || trackingTimestamp(latest.date);
      const candidateTime = trackingTimestamp(candidate.updatedAt) || trackingTimestamp(candidate.date);
      return candidateTime >= latestTime ? candidate : latest;
    });
    return [{ trip, vehicle, vehicleIndex, entry,
      timestamp: trackingTimestamp(entry.updatedAt) || trackingTimestamp(entry.date) }];
  }),
).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

const RecentTrackingUpdates = ({ trips }) => {
  const updates = useMemo(() => buildRecentTrackingUpdates(trips), [trips]);
  return (
    <section className="td-panel td-recent-tracking-panel">
      <header className="td-panel-heading">
        <div><h2>Recent tracking updates</h2></div>
      </header>
      {updates.length ? (
        <ul className="td-recent-list">
          {updates.map(({ trip, vehicle, vehicleIndex, entry, timestamp }) => {
            const id = keyOf(trip);
            const vehicleNo = text(vehicle.vehicleNumber || vehicle.vehicleNo);
            return (
              <li className="td-recent-row" key={`${id}-${vehicle.allocationId || vehicleIndex}`}>
                <div className="td-recent-heading">
                  <div className="td-recent-identity">
                  {id ? (
                    <Link className="td-trip-link" to={`/vehicle-details/${encodeURIComponent(id)}`}
                      state={{ mongoId: id, tripId: trip.tripId }}>
                      {text(trip.tripId) || id}<ArrowUpRight size={12} />
                    </Link>
                  ) : <strong>{text(trip.tripId) || "Missing trip ID"}</strong>}
                  <span className="td-recent-vehicle">{vehicleNo || "Vehicle not specified"}</span>
                  </div>
                  <span className="td-recent-status">{text(entry.status) || "Not recorded"}</span>
                </div>
                <div className="td-recent-meta">
                  <strong className="td-recent-location">{text(entry.currentLocation) || "Location not recorded"}</strong>
                  <span>{timestamp ? new Date(timestamp).toLocaleString("en-IN", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
                  }) : "Time not recorded"}</span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : <p className="td-recent-empty">No tracking updates for the current filters.</p>}
    </section>
  );
};

const Tracking = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState("filtered");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [exportSelected, setExportSelected] = useState([]);
  const [exportQuery, setExportQuery] = useState("");
  const [exportError, setExportError] = useState("");
  const [today, setToday] = useState(() => dateKey(new Date()));
  const [lastUpdated, setLastUpdated] = useState(null);
  const activeRequest = useRef(null);
  const mounted = useRef(false);
  const fetchTrips = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setRefreshing(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token?.trim())
        throw new Error("Please sign in with your main administrator account.");
      const response = await fetch(API_URL, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => {
        throw new Error("The server did not return JSON. Check your API URL.");
      });
      if (!response.ok)
        throw new Error(
          payload?.message || `Unable to load trips (${response.status}).`,
        );
      const loaded = extractTrips(payload).filter(
        (trip) =>
          trip &&
          typeof trip === "object" &&
          !isIntercartingOrder(trip) &&
          isOperational(trip),
      );
      if (!controller.signal.aborted && mounted.current) {
        setTrips(loaded);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!controller.signal.aborted && mounted.current)
        setError(err.message || "Unable to load trips.");
    } finally {
      if (!controller.signal.aborted && mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    fetchTrips();
    const timer = window.setInterval(() => {
      setToday(dateKey(new Date()));
      if (document.visibilityState === "visible") fetchTrips();
    }, 60000);
    const onFocus = () => {
      setToday(dateKey(new Date()));
      fetchTrips();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      mounted.current = false;
      activeRequest.current?.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchTrips]);

  const scopedTrips = useMemo(
    () =>
      trips.filter(
        (trip) =>
          matchesSearch(trip, search) && matchesDate(trip, selectedDate),
      ),
    [trips, search, selectedDate],
  );
  const counts = useMemo(() => {
    const result = Object.fromEntries(STATUSES.map((status) => [status, 0]));
    scopedTrips.forEach((trip) => {
      result[tripStatus(trip, today)] += 1;
    });
    return result;
  }, [scopedTrips, today]);
  const vehicles = useMemo(
    () => scopedTrips.flatMap((trip) => list(trip.allocatedVehicles)),
    [scopedTrips],
  );
  const podCount = vehicles.filter(podPending).length;
  const ewayCount = vehicles.filter((vehicle) =>
    ewayExpiring(vehicle, today),
  ).length;
  const filteredTrips = useMemo(
    () =>
      scopedTrips
        .filter((trip) => {
          if (
            statusFilter !== "All" &&
            tripStatus(trip, today) !== statusFilter
          )
            return false;
          return true;
        })
        .slice()
        .sort(
          (a, b) =>
            (dateNumber(dateKey(b.createdAt || b.enquiryDate)) || 0) -
              (dateNumber(dateKey(a.createdAt || a.enquiryDate)) || 0) ||
            text(b.tripId).localeCompare(text(a.tripId), undefined, {
              numeric: true,
            }),
        ),
    [scopedTrips, statusFilter, today],
  );
  const openExportModal = () => {
    setExportScope("filtered");
    setExportFormat("pdf");
    setExportSelected([]);
    setExportQuery("");
    setExportError("");
    setExportOpen(true);
  };
  const exportCandidates = filteredTrips.filter((trip) => matchesSearch(trip, exportQuery));
  const toggleExportTrip = (id) => setExportSelected((current) =>
    current.includes(id) ? current.filter((key) => key !== id) : [...current, id],
  );
  const selectedForExport = exportScope === "filtered"
    ? filteredTrips
    : filteredTrips.filter((trip) => exportSelected.includes(keyOf(trip)));
  const runTripExport = async () => {
    if (!selectedForExport.length) {
      setExportError(exportScope === "filtered" ? "No trips match the current filters." : "Select at least one trip.");
      return;
    }
    try {
      const groups = trackingExportGroups(selectedForExport, today);
      if (exportFormat === "pdf") exportTrackingPdf(groups);
      else await exportTrackingExcel(groups);
      setExportOpen(false);
    } catch (error) {
      setExportError(error?.message || "Unable to export these trips.");
    }
  };
  useEffect(() => {
    if (!exportOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setExportOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exportOpen]);
  const activity = useMemo(
    () => buildActivity(scopedTrips, selectedDate || today),
    [scopedTrips, selectedDate, today],
  );
  const selectStatus = (status) => {
    setStatusFilter(status);
  };
  const clearFilters = () => {
    setSearch("");
    setSelectedDate("");
    setStatusFilter("All");
  };
  const cards = [
    {
      id: "all",
      label: "Total Trips",
      value: scopedTrips.length,
      description: "All trips",
      icon: Route,
    },
    {
      id: "moving",
      label: "Moving",
      value: counts.Moving,
      description: "On the road",
      icon: Navigation,
    },
    {
      id: "pod",
      label: "POD Pending",
      value: podCount,
      description: "Awaiting POD",
      icon: FileClock,
    },
    {
      id: "eway",
      label: "E-Way Bill",
      value: ewayCount,
      description: "Expires in 2 days",
      icon: FileWarning,
    },
    {
      id: "reached",
      label: "Reached",
      value: counts.Reached,
      description: "At destination",
      icon: CheckCircle2,
    },
  ];
  const hasFilter = search || selectedDate || statusFilter !== "All";
  const openTrip = (trip) => {
    const id = keyOf(trip);
    if (!id) return;
    navigate(`/vehicle-details/${encodeURIComponent(id)}`, {
      state: { mongoId: id, tripId: trip.tripId },
    });
  };

  return (
    <main className="tracking-dashboard">
      <header className="td-page-heading">
        <div>
          <h1>Tracking overview</h1>
        </div>
        <div className="td-heading-actions">
          <span className="td-today">
            <CalendarDays size={14} />
            {shortDate(today)} {today.slice(0, 4)}
          </span>
          <button
            type="button"
            className="td-refresh"
            onClick={() => fetchTrips()}
            disabled={refreshing}
            aria-label="Refresh trips"
          >
            <RefreshCw size={14} className={refreshing ? "td-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </header>
      {error && (
        <div role="alert" className="td-alert">
          {error}
          <button
            type="button"
            onClick={() => fetchTrips()}
            disabled={refreshing}
          >
            Retry
          </button>
        </div>
      )}
      <section className="td-metrics" aria-label="Tracking summary">
        {cards.map(({ id, label, value, description, icon: Icon }) => (
          <div
            className={`td-metric td-metric-${id}`}
            key={id}
            title={`${description}: ${value}`}
          >
            <span className="td-metric-top">
              <span>{label}</span>
              <span className="td-metric-icon">
                <Icon size={17} />
              </span>
            </span>
            <strong>{loading ? "—" : value.toLocaleString("en-IN")}</strong>
            <small>{description}</small>
          </div>
        ))}
      </section>
      <div className="td-dashboard-row">
        <section
          className="td-panel td-trip-panel"
          aria-labelledby="td-trip-heading"
        >
          <div className="td-trip-toolbar">
            <header className="td-list-heading">
              <div>
                <h2 id="td-trip-heading">
                  <Truck size={17} />
                  Trip list <span>{filteredTrips.length}</span>
                </h2>
                <p>{hasFilter ? "Filtered trips" : "All operational trips"}</p>
              </div>
              <label className="td-search">
                <Search size={14} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search trip, customer, vehicle…"
                  aria-label="Search trip, customer or vehicle"
                />
              </label>
            </header>
            <div className="td-list-filters">
              <label>
                <CalendarDays size={13} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  aria-label="Filter trips by date"
                />
              </label>
              <label>
                <span className="td-sr-only">Trip status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => selectStatus(event.target.value)}
                >
                  <option value="All">All statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="td-export-btn" onClick={openExportModal} disabled={loading || !filteredTrips.length}>
                <Download size={15} /> Download
              </button>
              {hasFilter && (
                <button
                  type="button"
                  className="td-clear"
                  onClick={clearFilters}
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="td-trip-list" aria-busy={loading}>
            <table className="td-table">
              <thead>
                <tr>
                  <th scope="col">Trip</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Route</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  filteredTrips.map((trip, index) => {
                    const id = keyOf(trip),
                      status = tripStatus(trip, today),
                      allocated = list(trip.allocatedVehicles).filter(
                        (vehicle) =>
                          text(vehicle?.vehicleStatus).trim().toLowerCase() !== "replaced"
                      );
                    const pending = allocated.filter(podPending).length,
                      expiring = allocated.filter((vehicle) =>
                        ewayExpiring(vehicle, today),
                      ).length;
                    return (
                      <tr
                        key={id || `missing-${index}`}
                        className={id ? "td-clickable-trip" : undefined}
                        onClick={(event) => {
                          if (
                            event.defaultPrevented ||
                            event.target.closest(
                              "a, button, input, select, textarea",
                            ) ||
                            window.getSelection()?.toString()
                          )
                            return;
                          if (id) openTrip(trip);
                        }}
                      >
                        <td>
                          {id ? (
                            <Link
                              to={`/vehicle-details/${encodeURIComponent(id)}`}
                              state={{ mongoId: id, tripId: trip.tripId }}
                              className="td-trip-link"
                              aria-label={`Open vehicle details for ${text(trip.tripId) || id}`}
                            >
                              {text(trip.tripId) || id}
                              <ArrowUpRight size={12} />
                            </Link>
                          ) : (
                            <strong>Missing trip ID</strong>
                          )}
                          <small>
                            {allocated.length}{" "}
                            {allocated.length === 1 ? "vehicle" : "vehicles"}
                          </small>
                        </td>
                        <td>
                          <strong className="td-customer">
                            {text(trip.customer) || "—"}
                          </strong>
                          <small>
                            {text(trip.materialType || trip.materialName) ||
                              "—"}
                          </small>
                        </td>
                        <td>
                          <span className="td-route-text">
                            <MapPin size={12} />
                            <span>
                              {text(trip.origin) || "—"}
                              <span className="td-route-arrow"> → </span>
                              {text(trip.destination) || "—"}
                            </span>
                          </span>
                          {(pending > 0 || expiring > 0) && (
                            <small className="td-document-note">
                              {[
                                pending > 0 ? `POD pending ${pending}` : "",
                                expiring > 0
                                  ? `E-Way expiring ${expiring}`
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </small>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={status} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {loading && (
              <div className="td-empty" role="status">
                <RefreshCw size={20} className="td-spin" />
                <strong>Loading trips…</strong>
              </div>
            )}
            {!loading && !filteredTrips.length && (
              <div className="td-empty">
                <Truck size={27} />
                <strong>
                  {error
                    ? "Trips could not be loaded"
                    : hasFilter
                      ? "No matching trips"
                      : "No operational trips yet"}
                </strong>
                <p>
                  {hasFilter
                    ? "Try another search or clear the filters."
                    : "Allocated trips and orders placed for tracking will appear here."}
                </p>
                {hasFilter && (
                  <button type="button" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
          <footer className="td-list-footer">
            <span>Showing all {filteredTrips.length} trips</span>
            <span>
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}`
                : "Waiting for data"}
            </span>
          </footer>
        </section>
        <aside className="td-graphs" aria-label="Trip graphs">
          <TripActivity data={activity} />
          <RecentTrackingUpdates trips={scopedTrips} />
        </aside>
      </div>
      {exportOpen && (
        <div className="td-export-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setExportOpen(false);
        }}>
          <section className="td-export-modal" role="dialog" aria-modal="true" aria-labelledby="td-export-title">
            <header className="td-export-head">
              <div>
                <span className="td-export-kicker">TRACKING REPORT</span>
                <h2 id="td-export-title">Download Trip Report</h2>
                <p>Export filtered trips or choose specific trips.</p>
              </div>
              <button type="button" className="td-export-close" onClick={() => setExportOpen(false)} aria-label="Close download popup"><X size={18}/></button>
            </header>
            <div className="td-export-body">
              <div className="td-export-choices" role="radiogroup" aria-label="Which trips to export">
                <label className={exportScope === "filtered" ? "selected" : ""}>
                  <input type="radio" name="tdExportScope" value="filtered" checked={exportScope === "filtered"} onChange={() => setExportScope("filtered")}/>
                  <span><strong>Filtered Trips</strong><small>Use current search, date and status filters · {filteredTrips.length} trips</small></span>
                </label>
                <label className={exportScope === "selected" ? "selected" : ""}>
                  <input type="radio" name="tdExportScope" value="selected" checked={exportScope === "selected"} onChange={() => setExportScope("selected")}/>
                  <span><strong>Select Trips</strong><small>Choose individual trips from the filtered list</small></span>
                </label>
              </div>
              {exportScope === "selected" && (
                <div className="td-export-picker">
                  <div className="td-export-picker-top">
                    <label><Search size={14}/><input type="search" value={exportQuery} onChange={(event) => setExportQuery(event.target.value)} placeholder="Find trip or customer"/></label>
                    <button type="button" onClick={() => {
                      const ids = exportCandidates.map(keyOf).filter(Boolean);
                      setExportSelected((current) => ids.every((id) => current.includes(id))
                        ? current.filter((id) => !ids.includes(id))
                        : [...new Set([...current, ...ids])]);
                    }}>Select / Clear Visible</button>
                  </div>
                  <div className="td-export-trip-options">
                    {exportCandidates.map((trip) => (
                      <label key={keyOf(trip)}>
                        <input type="checkbox" checked={exportSelected.includes(keyOf(trip))} onChange={() => toggleExportTrip(keyOf(trip))}/>
                        <span><strong>{text(trip.tripId) || "Trip"}</strong><small>{text(trip.customer) || "—"} · {text(trip.origin) || "—"} → {text(trip.destination) || "—"}</small></span>
                        <em>{tripStatus(trip, today)}</em>
                      </label>
                    ))}
                    {!exportCandidates.length && <p className="td-export-noresults">No matching trips.</p>}
                  </div>
                </div>
              )}
              <div className="td-export-format-row">
                <label htmlFor="td-export-format">Download format</label>
                <select id="td-export-format" value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
                  <option value="pdf">PDF Report</option>
                  <option value="excel">Excel (.xlsx — styled)</option>
                </select>
              </div>
              {exportError && <p className="td-export-error" role="alert">{exportError}</p>}
            </div>
            <footer className="td-export-footer">
              <span>{selectedForExport.length} trip(s) selected</span>
              <div>
                <button type="button" className="td-export-cancel" onClick={() => setExportOpen(false)}>Cancel</button>
                <button type="button" className="td-export-submit" onClick={runTripExport} disabled={!selectedForExport.length}><Download size={15}/> Download {exportFormat === "pdf" ? "PDF" : "Excel"}</button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
};

export default Tracking;
