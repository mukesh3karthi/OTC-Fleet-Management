const isCraneVehicleTrip = (trip) =>
  ["crane", "cranemovement"].includes(
    String(
      trip?.movementType ||
        trip?.movement ||
        trip?.movementName ||
        trip?.movementCategory ||
        trip?.orderFinalization?.movementType ||
        trip?.enquiryDetails?.movementType ||
        "",
    )
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, ""),
  );
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
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  History,
  Info,
  LayoutDashboard,
  MapPin,
  Navigation,
  PackageCheck,
  RefreshCw,
  Truck,
  UsersRound,
} from "lucide-react";
import "./vehicledetails.css";

// ExcelJS preserves the colours, merged title, borders and column widths
// used by the supplied vehicle report sample. Install: npm i exceljs
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");
const API_URL = `${API_BASE}/api/triporders`;
const array = (value) => (Array.isArray(value) ? value : []);
const reportDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
};
const reportStatus = (vehicle) => {
  const unloading = String(vehicle?.unloading?.status || "").toLowerCase();
  const loading = String(vehicle?.loading?.status || "").toLowerCase();
  if (unloading === "in progress") return "Unloading Process";
  if (unloading === "completed") return "Unloading Completed";
  if (loading === "in progress") return "Loading Process";
  return vehicle?.status || vehicle?.vehicleStatus || "Pending";
};
// Preserve all saved allocations on the trip; current views exclude replacements.
const getCurrentVehicles = (trip) =>
  array(trip?.allocatedVehicles).filter(
    (vehicle) =>
      String(vehicle?.vehicleStatus || "")
        .trim()
        .toLowerCase() !== "replaced",
  );
const idText = (value) => String(value?.$oid ?? value ?? "");
const display = (value, fallback = "—") =>
  value == null || value === ""
    ? fallback
    : typeof value === "object"
      ? idText(value.$oid || value.name || "") || fallback
      : String(value);
const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const km = (value) =>
  value == null || value === ""
    ? "—"
    : `${number(value).toLocaleString("en-IN")} km`;
const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dateKey = (value) => {
  if (value == null || value === "") return "";
  if (typeof value === "object" && !(value instanceof Date))
    return value.$date !== undefined
      ? dateKey(value.$date)
      : value.$numberLong !== undefined
        ? dateKey(Number(value.$numberLong))
        : "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
      ? value
      : "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = indiaDate.formatToParts(date),
    part = (type) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};
const dateText = (value) => {
  const key = dateKey(value);
  return key
    ? new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";
};
const dateNumber = (key) => (key ? Date.parse(`${key}T00:00:00Z`) : NaN);
const daysBetween = (start, end, inclusive = false) => {
  const first = dateKey(start),
    last = dateKey(end);
  return !first || !last || last < first
    ? null
    : Math.round((dateNumber(last) - dateNumber(first)) / 86400000) +
        (inclusive ? 1 : 0);
};
const vehicleId = (vehicle) =>
  idText(
    vehicle?.allocationId ||
      vehicle?._id ||
      vehicle?.id ||
      vehicle?.vehicleNumber,
  );

// Present saved per-journey Crane data using the existing read-only detail fields.
const craneVehicleView = (vehicle, selectedJourneyId = "") => {
  const journeys = array(vehicle?.craneTrips);
  if (!journeys.length) return vehicle;
  const rows = journeys
    .flatMap((journey, journeyIndex) => {
      const records = array(journey.history);
      return (records.length ? records : [journey]).map((entry, index) => ({
        ...entry,
        journeyId: journey.journeyId,
        tripNumber: journeyIndex + 1,
        trackingId: entry.historyId || `${journey.journeyId}-${index}`,
        updatedAt: entry.savedAt || entry.updatedAt || journey.updatedAt,
        date: entry.date || journey.date,
        _journeyStart:
          journey.loading?.pointInAt || records[0]?.date || journey.date,
      }));
    })
    .sort(
      (a, b) =>
        String(a.date || "").localeCompare(String(b.date || "")) ||
        (new Date(a.updatedAt || 0).getTime() || 0) -
          (new Date(b.updatedAt || 0).getTime() || 0),
    );
  const allTracking = rows.map((entry, index) => {
    const previous = rows
      .slice(0, index)
      .reverse()
      .find(
        (row) => row.journeyId === entry.journeyId && row.date < entry.date,
      );
    const start =
      entry.startKm == null || entry.startKm === ""
        ? null
        : Number(entry.startKm);
    const end =
      entry.endKm == null || entry.endKm === "" ? null : Number(entry.endKm);
    return {
      ...entry,
      day: daysBetween(entry._journeyStart, entry.date, true),
      todayKm: end,
      runningKm: start != null && end != null ? Math.max(0, end - start) : null,
      yesterdayKm: previous?.endKm ?? null,
      yesterdayLocation: previous?.currentLocation || "",
    };
  });
  const journey =
    journeys.find((item) => item.journeyId === selectedJourneyId) ||
    journeys.find((item) => item.journeyId === allTracking.at(-1)?.journeyId) ||
    journeys.at(-1);
  const dailyTracking = allTracking.filter(
    (entry) => entry.journeyId === journey.journeyId,
  );
  const latest = dailyTracking.at(-1);
  const operation = (raw = {}, type) => ({
    ...raw,
    pointInDate: raw.pointInAt || null,
    pointOutDate: raw.pointOutAt || null,
    [type === "loading" ? "loadingDate" : "unloadingDate"]:
      raw.completedAt || null,
  });
  return {
    ...vehicle,
    dailyTracking,
    latestTracking: latest,
    currentLocation: latest?.currentLocation || journey.currentLocation,
    loadedMaterial: latest?.loadedMaterial || journey.loadedMaterial || "",
    loadedWeightTons: latest?.loadedWeightTons ?? journey.loadedWeightTons ?? null,
    tgNo: latest?.tgNo || journey.tgNo || "",
    status: latest?.status || journey.status,
    loading: operation(journey.loading, "loading"),
    unloading: operation(journey.unloading, "unloading"),
    lr: journey.lr || {},
    ewayBill: journey.ewayBill || {},
    pod: journey.pod || {},
    _craneJourneyId: journey.journeyId,
    _craneCoveredKm: latest?.runningKm ?? 0,
    _craneTripNumber: journeys.indexOf(journey) + 1,
  };
};
const trackingEntries = (vehicle) =>
  array(vehicle?.dailyTracking)
    .slice()
    .sort(
      (a, b) =>
        (dateNumber(dateKey(a.date || a.updatedAt)) || 0) -
        (dateNumber(dateKey(b.date || b.updatedAt)) || 0),
    );
const latestEntry = (vehicle) =>
  trackingEntries(vehicle).at(-1) || vehicle?.latestTracking || null;
const hasFile = (doc) =>
  Boolean(
    doc?.fileName ||
    doc?.originalName ||
    doc?.filePath ||
    doc?.fileUrl ||
    doc?.mimeType,
  );
const billStatus = (doc, today) => {
  if (!doc?.number && !hasFile(doc)) return "Pending";
  const expiry = dateKey(doc?.validUpto);
  if (!expiry) return display(doc?.status, "Pending");
  if (expiry < today) return "Expired";
  const days = daysBetween(today, expiry);
  return days === 0 ? "Expires Today" : days <= 7 ? "Expiring Soon" : "Active";
};
const getVehicleStatus = (vehicle, today) => {
  const raw = display(latestEntry(vehicle)?.status || vehicle?.status, "Idle");
  if (raw.toLowerCase() !== "reached") return raw;
  const unloaded =
    display(vehicle?.unloading?.status, "").toLowerCase() === "completed";
  const lr = Boolean(
    vehicle?.lr?.number || vehicle?.lr?.date || hasFile(vehicle?.pod),
  );
  const bill = billStatus(vehicle?.ewayBill, today).toLowerCase();
  return unloaded && lr && !["pending", "expired"].includes(bill)
    ? "Reached"
    : "Pending";
};
const tripEndpoint = (id) =>
  /^[a-f0-9]{24}$/i.test(idText(id).trim())
    ? `${API_URL}/${encodeURIComponent(idText(id).trim())}`
    : `${API_URL}/trip/${encodeURIComponent(idText(id).trim())}`;
const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("token");
  if (!token?.trim())
    throw new Error("Please sign in with your main administrator account.");
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
};
const routePoints = (trip) => {
  let raw = trip?.routeLocations;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = raw.split(/[,\n]/);
    }
  }
  const names = array(raw)
    .map((point) =>
      typeof point === "string"
        ? point
        : point?.location || point?.name || point?.locationName,
    )
    .filter(Boolean);
  const points = [trip?.origin, ...names, trip?.destination]
    .filter(Boolean)
    .map((point) => String(point).trim())
    .filter(Boolean);
  const seen = new Set();
  return points.filter((point) => {
    const key = point.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const everyDayHistory = (vehicle, today) => {
  const saved = trackingEntries(vehicle);
  const start = dateKey(vehicle?.loading?.pointInDate),
    end = dateKey(vehicle?.unloading?.pointOutDate) || today;
  if (!start || !end || end < start) return saved.reverse();
  const groups = new Map();
  saved.forEach((entry) => {
    const key = dateKey(entry.date);
    groups.set(key, [...(groups.get(key) || []), entry]);
  });
  const rows = [];
  for (
    let time = dateNumber(end);
    time >= dateNumber(start);
    time -= 86400000
  ) {
    const key = new Date(time).toISOString().slice(0, 10),
      day = daysBetween(start, key, true);
    const entries = groups.get(key);
    if (entries?.length)
      rows.push(
        ...entries
          .slice()
          .reverse()
          .map((entry) => ({ ...entry, day })),
      );
    else rows.push({ date: key, day, missing: true });
  }
  rows.push(
    ...saved
      .filter(
        (entry) =>
          !dateKey(entry.date) ||
          dateKey(entry.date) < start ||
          dateKey(entry.date) > end,
      )
      .reverse(),
  );
  return rows;
};
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "operations", label: "Loading / Unloading", icon: PackageCheck },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "contacts", label: "Contacts", icon: UsersRound },
  { id: "history", label: "Movement History", icon: History },
  { id: "trip", label: "Trip Details", icon: Info },
];
const Badge = ({ children }) => (
  <span
    className={`vdt-badge vdt-status-${String(children || "Pending")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`}
  >
    {children || "Pending"}
  </span>
);
const Rows = ({ rows }) => (
  <dl className="vdt-rows">
    {rows.map(([label, value]) => (
      <div className="vdt-row" key={label}>
        <dt>{label}</dt>
        <dd>
          <span className="vdt-colon" aria-hidden="true">
            :
          </span>
          <span>{value == null || value === "" ? "—" : value}</span>
        </dd>
      </div>
    ))}
  </dl>
);
const Card = ({
  title,
  icon: Icon = FileText,
  right,
  children,
  className = "",
}) => (
  <section className={`vdt-card ${className}`}>
    <header className="vdt-card-heading">
      <div>
        <span className="vdt-card-icon">
          <Icon size={16} />
        </span>
        <h2>{title}</h2>
      </div>
      {right}
    </header>
    <div className="vdt-card-content">{children}</div>
  </section>
);

const VehicleDetails = () => {
  const params = useParams(),
    location = useLocation(),
    navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = idText(
    params.id ||
      params.tripId ||
      searchParams.get("id") ||
      searchParams.get("tripId") ||
      location.state?.mongoId ||
      location.state?.tripId,
  );
  const [trip, setTrip] = useState(null);
  const [tripList, setTripList] = useState([]);
  const [tripListLoading, setTripListLoading] = useState(true);
  const [tripListError, setTripListError] = useState("");
  const tripListRequest = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [craneDetailOpen, setCraneDetailOpen] = useState(false);
  const [selectedCraneJourney, setSelectedCraneJourney] = useState("");
  useEffect(() => {
    setSelectedCraneJourney("");
  }, [tripId, selectedVehicle]);
  const [craneSearch, setCraneSearch] = useState("");
  useEffect(() => {
    setCraneDetailOpen(
      Boolean(searchParams.get("allocationId") || location.state?.allocationId),
    );
    setCraneSearch("");
    setActiveTab("overview");
  }, [tripId, searchParams, location.state?.allocationId]);
  const [today, setToday] = useState(() => dateKey(new Date()));
  const [documentError, setDocumentError] = useState("");
  const [documentBusy, setDocumentBusy] = useState("");
  const [exportChoiceOpen, setExportChoiceOpen] = useState(false);
  const request = useRef(null),
    mounted = useRef(false),
    tabRefs = useRef([]);
  const loadTrip = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    try {
      if (!tripId.trim())
        throw new Error("No trip selected. Open a trip from Tracking.");
      const response = await authFetch(tripEndpoint(tripId), {
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => {
        throw new Error(
          "The trip API did not return JSON. Check your API URL.",
        );
      });
      if (!response.ok)
        throw new Error(payload?.message || "Unable to load vehicle details.");
      const loaded =
        payload?.data?.trip ||
        payload?.data?.order ||
        payload?.data ||
        payload?.trip ||
        payload?.order ||
        payload;
      if (
        !loaded ||
        typeof loaded !== "object" ||
        Array.isArray(loaded) ||
        (!loaded._id &&
          !loaded.tripId &&
          !Array.isArray(loaded.allocatedVehicles))
      )
        throw new Error("The API returned invalid trip details.");
      if (isIntercartingOrder(loaded)) {
        throw new Error(
          "This is an Intercarting order. Open it from the Intercarting Orders page.",
        );
      }
      if (!controller.signal.aborted && mounted.current) setTrip(loaded);
    } catch (err) {
      if (!controller.signal.aborted && mounted.current) {
        setError(err.message || "Unable to load vehicle details.");
        setTrip(null);
      }
    } finally {
      if (!controller.signal.aborted && mounted.current) setLoading(false);
    }
  }, [tripId]);
  const loadTripList = useCallback(async () => {
    tripListRequest.current?.abort();
    const controller = new AbortController();
    tripListRequest.current = controller;
    setTripListLoading(true);
    setTripListError("");
    try {
      const response = await authFetch(API_URL, { signal: controller.signal });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload?.message || "Unable to load the trip list.");
      const entries = [
        payload,
        payload?.data,
        payload?.trips,
        payload?.orders,
        payload?.data?.trips,
        payload?.data?.orders,
      ].find(Array.isArray);
      if (!entries)
        throw new Error("The server returned an invalid trip list.");
      const available = entries
        .filter(
          (item) =>
            item &&
            !isIntercartingOrder(item) &&
            (item._id || item.tripId) &&
            (getCurrentVehicles(item).length ||
              display(item.orderPlaced?.status, "").toLowerCase() ===
                "completed" ||
              [
                "tracking",
                "trip complete",
                "trip completed",
                "completed",
              ].includes(display(item.stage, "").toLowerCase())),
        )
        .sort((a, b) =>
          idText(b.tripId).localeCompare(idText(a.tripId), undefined, {
            numeric: true,
          }),
        );
      if (!controller.signal.aborted) setTripList(available);
    } catch (err) {
      if (!controller.signal.aborted)
        setTripListError(err.message || "Unable to load the trip list.");
    } finally {
      if (!controller.signal.aborted) setTripListLoading(false);
    }
  }, []);
  useEffect(() => {
    loadTripList();
    return () => tripListRequest.current?.abort();
  }, [loadTripList]);
  const selectedTripValue =
    idText(trip?._id || trip?.tripId) ||
    idText(
      tripList.find(
        (item) => idText(item._id) === tripId || idText(item.tripId) === tripId,
      )?._id,
    ) ||
    tripId;
  const tripOptions = useMemo(() => {
    const items = tripList.slice();
    if (
      selectedTripValue &&
      !items.some(
        (item) => idText(item._id || item.tripId) === selectedTripValue,
      )
    ) {
      items.unshift(trip || { _id: selectedTripValue, tripId });
    }
    return items;
  }, [tripList, trip, selectedTripValue, tripId]);
  const switchTrip = (event) => {
    const nextId = event.target.value;
    if (!nextId || nextId === selectedTripValue) return;
    const nextTrip = tripOptions.find(
      (item) => idText(item._id || item.tripId) === nextId,
    );
    setTrip(null);
    setSelectedVehicle("");
    setDocumentError("");
    navigate(`/vehicle-details/${encodeURIComponent(nextId)}`, {
      state: { mongoId: nextId, tripId: nextTrip?.tripId },
    });
  };
  useEffect(() => {
    mounted.current = true;
    loadTrip();
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, [loadTrip]);
  useEffect(() => {
    const timer = window.setInterval(
      () => setToday(dateKey(new Date())),
      60000,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const vehicles = getCurrentVehicles(trip).map((item) =>
        isCraneVehicleTrip(trip) ? craneVehicleView(item) : item,
      ),
      preferred =
        searchParams.get("allocationId") || location.state?.allocationId;
    setSelectedVehicle((current) =>
      vehicleId(
        vehicles.find((item) => vehicleId(item) === preferred) ||
          vehicles.find((item) => vehicleId(item) === current) ||
          vehicles[0],
      ),
    );
    setDocumentError("");
  }, [trip, searchParams, location.state?.allocationId]);
  const vehicles = getCurrentVehicles(trip).map((item) =>
    isCraneVehicleTrip(trip)
      ? craneVehicleView(
          item,
          vehicleId(item) === selectedVehicle ? selectedCraneJourney : "",
        )
      : item,
  );
  const craneReportRows = () =>
    getCurrentVehicles(trip).flatMap((item, vehicleIndex) => {
      if (!isCraneVehicleTrip(trip)) {
        return [{ vehicle: item, vehicleIndex, tripNumber: 1 }];
      }
      const journeys = array(item.craneTrips);
      if (!journeys.length) return [{ vehicle: item, vehicleIndex, tripNumber: 1 }];
      return journeys.map((journey, journeyIndex) => ({
        vehicle: craneVehicleView(item, journey.journeyId),
        vehicleIndex,
        tripNumber: journeyIndex + 1,
      }));
    });
  const craneReportValues = ({ vehicle, vehicleIndex, tripNumber }) => {
    const journey = !isCraneVehicleTrip(trip) || vehicle._craneJourneyId ? vehicle : null;
    const loading = journey?.loading || {};
    const unloading = journey?.unloading || {};
    return [
      vehicleIndex + 1,
      tripNumber,
      journey?.tgNo || "",
      vehicle.vehicleNumber || vehicle.vehicleNo || "",
      vehicle.driver?.contactNumber || vehicle.driverNumber || "",
      vehicle.vehicleType || vehicle.type || "",
      journey?.lr?.number || vehicle.lrNumber || "",
      reportDate(loading.pointInAt || loading.pointInDate),
      reportDate(loading.completedAt || loading.loadingDate),
      reportDate(unloading.pointInAt || unloading.pointInDate),
      reportDate(unloading.completedAt || unloading.unloadingDate),
      journey?.currentLocation || vehicle.currentLocation || vehicle.latestTracking?.currentLocation || "",
      journey ? reportStatus(journey) : "Not Started",
    ];
  };
  const downloadCraneVehicleReport = async () => {
    if (!trip) return;
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "OTC Groups";
      workbook.created = new Date();
      const sheet = workbook.addWorksheet("Vehicle Details", {
        pageSetup: { orientation: "landscape", paperSize: 8, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
        views: [{ state: "frozen", ySplit: 2 }],
      });
      const headings = [
        "Si No", "Trip", "TG No", "Vehicle NO", "Mobile No", "Vehicle Type",
        "LR No", "L/P In date", "Loaded Date", "U/P In date",
        "Unloaded Date", "Current Location", "Status",
      ];
      const widths = [8, 9, 10, 20, 17, 17, 20, 16, 16, 16, 18, 22, 23];
      widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
      sheet.mergeCells(1, 1, 1, headings.length);
      const reportTitle = `${trip.customer || "Customer"} - ${trip.origin || "Origin"} to ${trip.destination || "Destination"} - Vehicle Details - ${reportDate(new Date())}`;
      const titleCell = sheet.getCell("A1");
      titleCell.value = reportTitle;
      titleCell.font = { name: "Cambria", size: 17, bold: true, color: { argb: "FF132775" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6E0B4" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      sheet.getRow(1).height = 32;
      const border = {
        top: { style: "thin", color: { argb: "FF222222" } },
        bottom: { style: "thin", color: { argb: "FF222222" } },
        left: { style: "thin", color: { argb: "FF222222" } },
        right: { style: "thin", color: { argb: "FF222222" } },
      };
      const headRow = sheet.getRow(2);
      headRow.values = headings;
      headRow.height = 42;
      headRow.eachCell((cell) => {
        cell.font = { name: "Cambria", bold: true, size: 11, color: { argb: "FF7030A0" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = border;
      });
      // Every saved Crane journey is included, including earlier completed trips.
      craneReportRows().forEach((entry, index) => {
        const row = sheet.addRow(craneReportValues(entry));
        row.height = 30;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.font = { name: "Cambria", size: 11, color: { argb: "FF111111" } };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = border;
          if (index % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F7F7" } };
          }
        });
        row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC9C9C9" } };
      });
      const bytes = await workbook.xlsx.writeBuffer();
      const objectUrl = URL.createObjectURL(new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }));
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `Vehicle_Report_${String(trip.tripId || "Crane").replace(/[^a-z0-9_-]/gi, "_")}_${reportDate(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      setExportChoiceOpen(false);
    } catch (error) {
      setDocumentError(error.message || "Unable to download vehicle report.");
    }
  };
  const downloadCranePdfReport = () => {
    if (!trip) return;
    try {
      setDocumentError("");
      const headings = [
        "Si No", "Trip", "TG No", "Vehicle NO", "Mobile No", "Vehicle Type",
        "LR No", "L/P In date", "Loaded Date", "U/P In date",
        "Unloaded Date", "Current Location", "Status",
      ];
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
      const title = `${trip.customer || "Customer"} - ${trip.origin || "Origin"} to ${trip.destination || "Destination"}`;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFillColor(198, 224, 180);
      doc.rect(10, 10, pageWidth - 20, 14, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(19, 39, 117);
      doc.text(title, pageWidth / 2, 16, { align: "center", maxWidth: pageWidth - 30 });
      doc.setFontSize(8);
      doc.text(`Vehicle Details - ${reportDate(new Date())}`, pageWidth / 2, 21, { align: "center" });
      autoTable(doc, {
        startY: 26,
        head: [headings],
        body: craneReportRows().map((entry) => craneReportValues(entry).map((value) => String(value ?? ""))),
        theme: "grid",
        showHead: "everyPage",
        margin: { top: 15, left: 10, right: 10, bottom: 16 },
        styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5, lineColor: [45, 55, 65], lineWidth: 0.15, valign: "middle", halign: "center", overflow: "linebreak" },
        headStyles: { fillColor: [255, 242, 204], textColor: [112, 48, 160], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [247, 247, 247] },
        columnStyles: { 3: { fillColor: [222, 222, 222] } },
      });
      const totalPages = doc.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setFontSize(8);
        doc.setTextColor(90, 105, 115);
        doc.text(`Page ${page} of ${totalPages}`, pageWidth - 12, doc.internal.pageSize.getHeight() - 7, { align: "right" });
      }
      const safeTripId = String(trip.tripId || "Crane").replace(/[^a-z0-9_-]/gi, "_");
      doc.save(`Vehicle_Report_${safeTripId}_${reportDate(new Date())}.pdf`);
      setExportChoiceOpen(false);
    } catch (error) {
      setDocumentError(error.message || "Unable to download PDF report.");
    }
  };
  const vehicle =
    vehicles.find((item) => vehicleId(item) === selectedVehicle) || vehicles[0];
  const latest = latestEntry(vehicle);
  const history = useMemo(
    () =>
      vehicle?._craneJourneyId
        ? trackingEntries(vehicle).slice().reverse()
        : everyDayHistory(vehicle, today),
    [vehicle, today],
  );
  const requirement =
    array(trip?.vehicleRequirements).find(
      (item) => item.requirementId === vehicle?.requirementId,
    ) || {};
  const confirmation =
    array(trip?.vehicleConfirmations).find(
      (item) => item.confirmationId === vehicle?.confirmationId,
    ) || {};
  const quotation =
    array(trip?.trafficQuotations).find(
      (item) =>
        item.quotationId === (vehicle?.quotationId || confirmation.quotationId),
    ) || {};
  const totalKm = number(trip?.totalKm ?? trip?.distance ?? trip?.totalKM);
  const coveredKm = vehicle?._craneJourneyId
    ? vehicle._craneCoveredKm
    : array(vehicle?.dailyTracking).reduce(
        (sum, entry) => sum + Math.max(0, number(entry.runningKm)),
        0,
      );
  // Match Current Day to the latest saved movement shown in the history.
  const currentDay = (() => {
    const recordedDay = Number(latest?.day);
    if (Number.isInteger(recordedDay) && recordedDay > 0) return recordedDay;
    const movementDate = latest?.date || latest?.updatedAt;
    const end = vehicle?.unloading?.pointOutDate || movementDate || today;
    const loadingDay = daysBetween(vehicle?.loading?.pointInDate, end, true);
    if (loadingDay !== null) return loadingDay;
    const entries = trackingEntries(vehicle);
    const first = entries[0];
    return daysBetween(first?.date || first?.updatedAt, end, true);
  })();
  const status = getVehicleStatus(vehicle, today);
  const points = routePoints(trip);
  const currentPosition = display(
    latest?.currentLocation || vehicle?.currentLocation,
    "",
  );
  const matchedRouteIndex = points.findIndex(
    (point) => point.toLowerCase() === currentPosition.trim().toLowerCase(),
  );
  const routeReached = display(latest?.status, "").toLowerCase() === "reached";
  const currentIndex =
    routeReached && points.length ? points.length - 1 : matchedRouteIndex;
  const replacements = array(vehicle?.replacementHistory);

  const activateTab = (index) => {
    setActiveTab(TABS[index].id);
    tabRefs.current[index]?.focus();
  };
  const handleTabKeys = (event, index) => {
    let target;
    if (event.key === "ArrowRight") target = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft")
      target = (index + TABS.length - 1) % TABS.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = TABS.length - 1;
    else return;
    event.preventDefault();
    activateTab(target);
  };
  const openDocument = async (type, download = false) => {
    const preview = download ? null : window.open("about:blank", "_blank");
    setDocumentBusy(type);
    setDocumentError("");
    try {
      if (!download && !preview)
        throw new Error("Allow pop-ups for this site to view documents.");
      if (preview) {
        preview.opener = null;
        preview.document.body.textContent = "Loading document…";
      }
      const mongoId = idText(trip?._id),
        allocationId = idText(vehicle?.allocationId);
      if (!mongoId || !allocationId)
        throw new Error("Trip or allocation ID is missing. Refresh this page.");
      const response = await authFetch(
        `${API_URL}/${encodeURIComponent(mongoId)}/allocated-vehicles/${encodeURIComponent(allocationId)}${vehicle?._craneJourneyId ? `/crane-trips/${encodeURIComponent(vehicle._craneJourneyId)}` : ""}/${type}/file?disposition=${download ? "attachment" : "inline"}`,
      );
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || /application\/json|text\/html/i.test(contentType)) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.message ||
            "The document is unavailable. Check that the file was uploaded.",
        );
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("This document is empty.");
      const url = URL.createObjectURL(blob);
      if (download) {
        const link = document.createElement("a");
        link.href = url;
        link.download =
          vehicle?.[type]?.originalName ||
          vehicle?.[type]?.fileName ||
          `${type}-document`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (preview && !preview.closed) preview.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (err) {
      preview?.close();
      setDocumentError(err.message || "Unable to open document.");
    } finally {
      setDocumentBusy("");
    }
  };
  const documentButtons = (type) =>
    hasFile(vehicle?.[type]) ? (
      <div className="vdt-document-actions">
        <button
          type="button"
          onClick={() => openDocument(type)}
          disabled={Boolean(documentBusy)}
        >
          <Eye size={14} />
          View
        </button>
        <button
          type="button"
          onClick={() => openDocument(type, true)}
          disabled={Boolean(documentBusy)}
        >
          <Download size={14} />
          Download
        </button>
      </div>
    ) : (
      <p className="vdt-no-file">No file uploaded</p>
    );
  const operationsCard = (type) => {
    const loadingOperation = type === "loading",
      operation = vehicle?.[type] || {};
    const halt = daysBetween(
      operation.pointInDate,
      operation.pointOutDate || today,
    );
    return (
      <Card
        key={type}
        title={loadingOperation ? "Loading Point" : "Unloading Point"}
        icon={loadingOperation ? Truck : PackageCheck}
        right={<Badge>{display(operation.status, "Pending")}</Badge>}
      >
        <Rows
          rows={[
            [
              loadingOperation ? "LP In Date" : "UP In Date",
              dateText(operation.pointInDate),
            ],
            [
              loadingOperation ? "Loading Date" : "Unloading Date",
              dateText(
                operation[loadingOperation ? "loadingDate" : "unloadingDate"],
              ),
            ],
            [
              loadingOperation ? "LP Out Date" : "UP Out Date",
              dateText(operation.pointOutDate),
            ],
            [
              "Halting Days",
              halt === null ? "—" : `${halt} ${halt === 1 ? "Day" : "Days"}`,
            ],
            ["Remarks", display(operation.remarks)],
          ]}
        />
      </Card>
    );
  };

  return (
    <main className="vdt-page">
      <style>{`.vct-panel{border:1px solid #d6e4ed;border-radius:11px;background:#fff;overflow:hidden;color:#163d50}.vct-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px}.vct-toolbar h2{font-size:14px;margin:0;font-weight:700}.vct-toolbar h2 span{display:inline-block;padding:2px 7px;margin-left:5px;border-radius:5px;background:#e9f6f5;color:#008780;font-size:11px}.vct-toolbar p{font-size:11px;margin:5px 0 0;color:#708798}.vct-search input{width:270px;max-width:100%;height:35px;padding:8px 11px;border:1px solid #d5e3eb;border-radius:7px;background:#fff;color:#23495d;font:inherit;font-size:11px}.vct-search input:focus{outline:2px solid #72c5c0;outline-offset:1px}.vct-scroll{max-height:62vh;overflow:auto}.vct-table{width:100%;min-width:1080px;border-collapse:collapse;text-align:left;font-size:11px;white-space:nowrap}.vct-table thead{position:sticky;top:0;z-index:1}.vct-table th{background:#edf5f8;color:#507083;font-size:10px;font-weight:700;padding:11px 12px;border-top:1px solid #dce9ef;border-bottom:1px solid #dce9ef;text-transform:uppercase;letter-spacing:.3px}.vct-table td{padding:10px 12px;border-bottom:1px solid #edf2f6;color:#355466}.vct-table tbody tr{background:#fff;cursor:pointer}.vct-table tbody tr:nth-child(even){background:#fafcfd}.vct-table tbody tr:hover{background:#eaf7f5}.vct-table tbody tr:focus-visible{outline:2px solid #08978c;outline-offset:-2px}.vct-table td strong{color:#16495c;font-weight:700}.vct-table button,.vct-selected button{display:inline-flex;align-items:center;gap:6px;border:1px solid #b8dcd9;background:#eef9f7;color:#087e77;border-radius:6px;padding:6px 9px;font:inherit;font-size:10px;font-weight:600;cursor:pointer}.vct-table button:focus-visible,.vct-selected button:focus-visible{outline:2px solid #08978c;outline-offset:2px}.vct-table .vct-empty{text-align:center;padding:30px;color:#7d919e;cursor:default}.vct-footer{padding:10px 16px;font-size:10px;color:#7b8e9c;background:#fbfdfe;border-top:1px solid #e2ecf2}.vct-selected{display:flex;align-items:center;gap:14px;background:#fff;padding:10px 12px;border:1px solid #d6e4ed;border-radius:9px;margin-bottom:10px;color:#174a5b;font-size:12px}@media(max-width:650px){.vct-toolbar{align-items:stretch;flex-direction:column;padding:12px}.vct-search input{width:100%}.vct-scroll{max-height:58vh}}`}</style>
      <header className="vdt-page-heading">
        <button
          type="button"
          className="vdt-button vdt-back"
          onClick={() => {
            if (isCraneVehicleTrip(trip) && craneDetailOpen) {
              setCraneDetailOpen(false);
              return;
            }
            navigate(location.state?.returnTo || "/tracking");
          }}
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <div className="vdt-title">
          <h1>
            {isCraneVehicleTrip(trip) && !craneDetailOpen
              ? "Crane Vehicles"
              : "Vehicle Details"}
          </h1>
          <p>
            {trip
              ? `${display(trip.tripId)} · ${display(trip.origin)} → ${display(trip.destination)}`
              : "Trip vehicle information"}
          </p>
        </div>
        <div className="vdt-heading-actions">
          <button
            type="button"
            className="vdt-button"
            onClick={() => {
              setDocumentError("");
              setExportChoiceOpen(true);
            }}
            disabled={!trip || !getCurrentVehicles(trip).length}
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
          <label className="vdt-trip-dropdown">
            <span className="vdt-sr-only">Select trip</span>
            <select
              value={selectedTripValue}
              onChange={switchTrip}
              disabled={tripListLoading || loading || !tripOptions.length}
              aria-label="Select trip"
              title="Switch trip"
            >
              {!tripOptions.length && (
                <option value="">
                  {tripListLoading ? "Loading trips…" : "No trips available"}
                </option>
              )}
              {tripOptions.map((item) => (
                <option
                  key={idText(item._id || item.tripId)}
                  value={idText(item._id || item.tripId)}
                >
                  {display(item.tripId)}
                  {item.customer ? ` · ${display(item.customer)}` : ""}
                  {item.origin && item.destination
                    ? ` · ${item.origin} → ${item.destination}`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="vdt-button"
            onClick={() => {
              loadTrip();
              loadTripList();
            }}
            disabled={loading || tripListLoading}
          >
            <RefreshCw
              size={14}
              className={loading || tripListLoading ? "vdt-spin" : ""}
            />
            <span>Refresh</span>
          </button>
        </div>
      </header>
      {exportChoiceOpen && (
        <div className="vct-export-overlay" onClick={() => setExportChoiceOpen(false)}>
          <div className="vct-export-dialog" role="dialog" aria-modal="true" aria-labelledby="vct-export-title" onClick={(event) => event.stopPropagation()}>
            <div className="vct-export-dialog-heading">
              <span className="vct-export-dialog-icon"><Download size={19} /></span>
              <div>
                <h3 id="vct-export-title">Download Movement Report</h3>
                <p>{isCraneVehicleTrip(trip) ? "All allocated vehicles and every saved Crane trip." : "All allocated vehicles for this movement."}</p>
              </div>
            </div>
            <div className="vct-export-formats">
              <button type="button" onClick={downloadCraneVehicleReport}>
                <FileText size={19} />
                <span><strong>Excel (.xlsx)</strong><small>Editable spreadsheet</small></span>
                <Download size={15} />
              </button>
              <button type="button" onClick={downloadCranePdfReport}>
                <FileText size={19} />
                <span><strong>PDF (.pdf)</strong><small>Printable report</small></span>
                <Download size={15} />
              </button>
            </div>
            <button type="button" className="vct-export-cancel" onClick={() => setExportChoiceOpen(false)}>Cancel</button>
            {documentError && <p role="alert" className="vdt-error">{documentError}</p>}
          </div>
        </div>
      )}
      {tripListError && (
        <div className="vdt-trip-list-message" role="status">
          {tripListError} Use Refresh to retry.
        </div>
      )}
      {error && (
        <div className="vdt-error" role="alert">
          {error}
        </div>
      )}
      {loading && !trip && (
        <div className="vdt-empty" role="status">
          Loading vehicle details…
        </div>
      )}
      {trip && (
        <>
          {isCraneVehicleTrip(trip) && !craneDetailOpen ? (
            <section className="vct-panel" aria-label="Crane vehicle list">
              <div className="vct-toolbar">
                <div>
                  <h2>
                    Allocated vehicles <span>{vehicles.length}</span>
                  </h2>
                  <p>Select a row to view the vehicle’s details.</p>
                </div>
                <div className="vct-toolbar-actions">
                  <label className="vct-search">
                    <span className="vdt-sr-only">Search vehicles</span>
                    <input
                      value={craneSearch}
                      onChange={(event) => setCraneSearch(event.target.value)}
                      placeholder="Search vehicle, LSP, loaded material, TG…"
                    />
                  </label>
                </div>
              </div>
              {documentError && (
                <p className="vdt-error" role="alert">{documentError}</p>
              )}
              <div className="vct-scroll">
                <table className="vct-table">
                  <thead>
                    <tr>
                      {[
                        "Vehicle number",
                        "Type",
                        "LSP",
                        "Loaded Material",
                        "TG No",
                        "Current Location",
                        "Trip",
                        "Loading",
                        "Unloading",
                        "Weight (tons)",
                        "Details",
                      ].map((label) => (
                        <th key={label} scope="col">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles
                      .filter((item) =>
                        [
                          item.vehicleNumber,
                          item.vehicleNo,
                          item.vehicleType,
                          item.type,
                          item.lsp,
                          item.loadedMaterial,
                          item.tgNo,
                          item.currentLocation,
                          item._craneTripNumber,
                          item.loading?.status,
                          item.unloading?.status,
                        ]
                          .filter(Boolean)
                          .join(" ")
                          .toLowerCase()
                          .includes(craneSearch.trim().toLowerCase()),
                      )
                      .map((item, index) => {
                        const openDetails = () => {
                          setSelectedVehicle(vehicleId(item));
                          setDocumentError("");
                          setActiveTab("overview");
                          setCraneDetailOpen(true);
                        };
                        return (
                          <tr
                            key={vehicleId(item) || index}
                            tabIndex={0}
                            aria-label={`View ${display(item.vehicleNumber || item.vehicleNo)}`}
                            onClick={openDetails}
                            onKeyDown={(event) => {
                              if (
                                event.target === event.currentTarget &&
                                (event.key === "Enter" || event.key === " ")
                              ) {
                                event.preventDefault();
                                openDetails();
                              }
                            }}
                          >
                            <td>
                              <strong>
                                {display(item.vehicleNumber || item.vehicleNo)}
                              </strong>
                            </td>
                            <td>
                              {display(item.vehicleType || item.type)}
                            </td>
                            <td>{display(item.lsp)}</td>
                            <td>{display(item.loadedMaterial)}</td>
                            <td>{display(item.tgNo)}</td>
                            <td>{display(item.currentLocation)}</td>
                            <td>{item._craneTripNumber ? `Trip ${item._craneTripNumber}` : "—"}</td>
                            <td>{item._craneJourneyId ? display(item.loading?.status) : "—"}</td>
                            <td>{item._craneJourneyId ? display(item.unloading?.status) : "—"}</td>
                            <td>
                              {(item.loadedWeightTons ?? item.weight) == null ||
                              (item.loadedWeightTons ?? item.weight) === ""
                                ? "—"
                                : `${item.loadedWeightTons ?? item.weight} TON`}
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openDetails();
                                }}
                              >
                                View details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    {!vehicles.some((item) =>
                      [
                        item.vehicleNumber,
                        item.vehicleNo,
                        item.vehicleType,
                        item.type,
                        item.lsp,
                          item.loadedMaterial,
                          item.tgNo,
                          item.currentLocation,
                          item._craneTripNumber,
                          item.loading?.status,
                          item.unloading?.status,
                      ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase()
                        .includes(craneSearch.trim().toLowerCase()),
                    ) && (
                      <tr>
                        <td colSpan={11} className="vct-empty">
                          {vehicles.length
                            ? "No matching vehicles."
                            : "No vehicles allocated to this trip."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="vct-footer">
                {vehicles.length} allocated vehicles · Click a row to view
                details
              </div>
            </section>
          ) : null}
          {(!isCraneVehicleTrip(trip) || craneDetailOpen) && (
            <>
              {isCraneVehicleTrip(trip) ? (
                <div className="vct-selected">
                  
                  <strong>
                    {display(vehicle?.vehicleNumber || vehicle?.vehicleNo)}
                  </strong>
                  {array(vehicle?.craneTrips).length > 0 && (
                    <div
                      role="group"
                      aria-label="Select crane trip"
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "7px",
                        alignItems: "center",
                      }}
                    >
                      {array(vehicle.craneTrips).map((journey, index) => (
                        <button
                          key={journey.journeyId}
                          type="button"
                          aria-pressed={
                            vehicle._craneJourneyId === journey.journeyId
                          }
                          onClick={() => {
                            setSelectedCraneJourney(journey.journeyId);
                            setDocumentError("");
                            setActiveTab("overview");
                          }}
                          style={{
                            background:
                              vehicle._craneJourneyId === journey.journeyId
                                ? "#087f80"
                                : "#f5fafb",
                            color:
                              vehicle._craneJourneyId === journey.journeyId
                                ? "#fff"
                                : "#315a6b",
                            borderColor:
                              vehicle._craneJourneyId === journey.journeyId
                                ? "#087f80"
                                : "#d2e3e9",
                            padding: "8px 12px",
                          }}
                        >
                          <span>Trip {index + 1}</span>
                          <span style={{ fontSize: "10px", opacity: 0.8 }}>
                            {dateText(journey.date)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <section
                  className="vdt-vehicle-selector"
                  aria-label="Select vehicle"
                >
                  <div className="vdt-vehicle-options">
                    {vehicles.map((item, index) => (
                      <button
                        type="button"
                        key={vehicleId(item) || index}
                        className="vdt-vehicle-option"
                        aria-pressed={vehicleId(item) === vehicleId(vehicle)}
                        onClick={() => {
                          setSelectedVehicle(vehicleId(item));
                          setDocumentError("");
                        }}
                      >
                        <Truck size={15} />
                        <strong>
                          {display(item.vehicleNumber || item.vehicleNo)}
                        </strong>
                        <Badge>{getVehicleStatus(item, today)}</Badge>
                      </button>
                    ))}
                  </div>
                  <span className="vdt-vehicle-total">
                    {vehicles.length}{" "}
                    {vehicles.length === 1 ? "vehicle" : "vehicles"}
                  </span>
                </section>
              )}
              {!vehicle ? (
                <div className="vdt-empty">
                  <Truck size={28} />
                  <strong>No vehicles allocated</strong>
                  <p>Allocate a vehicle to this trip to view its details.</p>
                </div>
              ) : (
                <>
                  <div className="vdt-tab-shell">
                    <nav
                      className="vdt-tab-list"
                      role="tablist"
                      aria-label="Vehicle information"
                    >
                      {TABS.map(({ id, label, icon: Icon }, index) => (
                        <button
                          type="button"
                          key={id}
                          role="tab"
                          id={`vdt-tab-${id}`}
                          aria-controls={`vdt-panel-${id}`}
                          aria-selected={activeTab === id}
                          tabIndex={activeTab === id ? 0 : -1}
                          ref={(element) => {
                            tabRefs.current[index] = element;
                          }}
                          onClick={() => setActiveTab(id)}
                          onKeyDown={(event) => handleTabKeys(event, index)}
                        >
                          <Icon size={15} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </nav>
                    <section
                      className="vdt-tab-panel"
                      id="vdt-panel-overview"
                      role="tabpanel"
                      aria-labelledby="vdt-tab-overview"
                      hidden={activeTab !== "overview"}
                    >
                      <section className="vdt-route" aria-label="Vehicle route">
                        <div className="vdt-route-update">
                          <span>
                            Current position:{" "}
                            <strong>
                              {currentPosition || "Awaiting update"}
                            </strong>
                          </span>
                        </div>
                        <ol>
                          {points.map((point, index) => (
                            <li
                              key={`${point}-${index}`}
                              className={
                                index === currentIndex
                                  ? "is-current"
                                  : index < currentIndex
                                    ? "is-covered"
                                    : "is-upcoming"
                              }
                              aria-current={
                                index === currentIndex ? "location" : undefined
                              }
                            >
                              <span className="vdt-route-icon">
                                {index === currentIndex ||
                                index === points.length - 1 ? (
                                  <Truck size={13} />
                                ) : (
                                  <MapPin size={13} />
                                )}
                              </span>
                              <strong>{point}</strong>
                              <small>
                                {index === currentIndex
                                  ? "Current"
                                  : index === 0
                                    ? "Origin"
                                    : index === points.length - 1
                                      ? "Destination"
                                      : ""}
                              </small>
                            </li>
                          ))}
                        </ol>
                        {!points.length && (
                          <p className="vdt-no-file">
                            No route locations available.
                          </p>
                        )}
                      </section>
                      <div className="vdt-distance-grid">
                        {[
                          ["Total KM", totalKm, "total"],
                          ["KM Covered", coveredKm, "covered"],
                          [
                            "Balance",
                            Math.max(0, totalKm - coveredKm),
                            "balance",
                          ],
                        ].map(([label, value, type]) => (
                          <div
                            className={`vdt-distance vdt-distance-${type}`}
                            key={type}
                          >
                            <span>{label}</span>
                            <strong>{km(value)}</strong>
                          </div>
                        ))}
                      </div>
                      <div className="vdt-two-columns">
                        <Card
                          title="Movement Status"
                          icon={Navigation}
                          right={<Badge>{status}</Badge>}
                        >
                          <Rows
                            rows={[
                              ["Current Position", display(currentPosition)],
                              [
                                "Yesterday Position",
                                display(latest?.yesterdayLocation),
                              ],
                              ["Yesterday KM", km(latest?.yesterdayKm)],
                              ["Today KM", km(latest?.todayKm)],
                              ["Running KM", km(latest?.runningKm)],
                              ["Loaded Material", display(latest?.loadedMaterial || vehicle.loadedMaterial)],
                              ["Weight (tons)",
                                (latest?.loadedWeightTons ?? vehicle.loadedWeightTons) == null
                                  ? "—"
                                  : `${latest?.loadedWeightTons ?? vehicle.loadedWeightTons} TON`,
                              ],
                              ...(isCraneVehicleTrip(trip)
                                ? [["TG No", display(latest?.tgNo || vehicle.tgNo)]]
                                : []),
                              [
                                "Current Day",
                                currentDay === null
                                  ? "Not started"
                                  : `Day ${currentDay}`,
                              ],
                              [
                                "Last Update",
                                dateText(latest?.updatedAt || latest?.date),
                              ],
                            ]}
                          />
                        </Card>
                        <Card title="Vehicle & Transport Details" icon={Truck}>
                          <Rows
                            rows={[
                              [
                                "Vehicle Type",
                                display(
                                  vehicle.vehicleType ||
                                    vehicle.type ||
                                    requirement.vehicleType,
                                ),
                              ],
                              [
                                "Configuration",
                                display(
                                  requirement.configuration ||
                                    vehicle.configuration,
                                ),
                              ],
                              [
                                "Classification",
                                display(
                                  requirement.classification ||
                                    vehicle.classification,
                                ),
                              ],
                              [
                                "Vehicle Number",
                                display(
                                  vehicle.vehicleNumber || vehicle.vehicleNo,
                                ),
                              ],
                              [
                                "Transporter",
                                display(
                                  quotation.transporter ||
                                    vehicle.transporter ||
                                    trip.lsp,
                                ),
                              ],
                              [
                                "LSP",
                                display(
                                  vehicle.lsp ||
                                    quotation.lsp ||
                                    requirement.lsp ||
                                    trip.lsp,
                                ),
                              ],
                              ["Dimensions (L × H × W)",
                                [vehicle.dimensions?.length, vehicle.dimensions?.height, vehicle.dimensions?.width]
                                  .some((value) => value != null && value !== "")
                                  ? [vehicle.dimensions?.length, vehicle.dimensions?.height, vehicle.dimensions?.width]
                                      .map(display).join(" × ") + " FT"
                                  : "—",
                              ],
                              [
                                "Allocation Source",
                                display(vehicle.allocatedSource),
                              ],
                              ["Allocated On", dateText(vehicle.allocatedAt)],
                            ]}
                          />
                        </Card>
                      </div>
                    </section>
                    <section
                      className="vdt-tab-panel"
                      id="vdt-panel-operations"
                      role="tabpanel"
                      aria-labelledby="vdt-tab-operations"
                      hidden={activeTab !== "operations"}
                    >
                      <div className="vdt-two-columns">
                        {operationsCard("loading")}
                        {operationsCard("unloading")}
                      </div>
                    </section>
                    <section
                      className="vdt-tab-panel"
                      id="vdt-panel-documents"
                      role="tabpanel"
                      aria-labelledby="vdt-tab-documents"
                      hidden={activeTab !== "documents"}
                    >
                      {documentError && (
                        <div className="vdt-error" role="alert">
                          {documentError}
                        </div>
                      )}
                      <div className="vdt-three-columns">
                        <Card
                          title="LR Details"
                          right={
                            <Badge>
                              {vehicle.lr?.number || vehicle.lr?.date
                                ? "Completed"
                                : "Pending"}
                            </Badge>
                          }
                        >
                          <Rows
                            rows={[
                              ["LR Number", display(vehicle.lr?.number)],
                              ["LR Date", dateText(vehicle.lr?.date)],
                              [
                                "File Name",
                                display(
                                  vehicle.lr?.originalName ||
                                    vehicle.lr?.fileName,
                                ),
                              ],
                              ["Remarks", display(vehicle.lr?.remarks)],
                            ]}
                          />
                          {documentButtons("lr")}
                        </Card>
                        <Card
                          title="E-Way Bill"
                          right={
                            <Badge>{billStatus(vehicle.ewayBill, today)}</Badge>
                          }
                        >
                          <Rows
                            rows={[
                              [
                                "E-Way Number",
                                display(vehicle.ewayBill?.number),
                              ],
                              [
                                "Valid Upto",
                                dateText(vehicle.ewayBill?.validUpto),
                              ],
                              [
                                "File Name",
                                display(
                                  vehicle.ewayBill?.originalName ||
                                    vehicle.ewayBill?.fileName,
                                ),
                              ],
                              ["Remarks", display(vehicle.ewayBill?.remarks)],
                            ]}
                          />
                          {documentButtons("ewayBill")}
                        </Card>
                        <Card
                          title="POD Document"
                          right={
                            <Badge>
                              {hasFile(vehicle.pod) ? "Uploaded" : "Pending"}
                            </Badge>
                          }
                        >
                          <Rows
                            rows={[
                              [
                                "File Name",
                                display(
                                  vehicle.pod?.originalName ||
                                    vehicle.pod?.fileName,
                                ),
                              ],
                              [
                                "Uploaded On",
                                dateText(vehicle.pod?.uploadedAt),
                              ],
                              ["Uploaded By", display(vehicle.pod?.uploadedBy)],
                              ["Remarks", display(vehicle.pod?.remarks)],
                            ]}
                          />
                          {documentButtons("pod")}
                        </Card>
                      </div>
                    </section>
                    <section
                      className="vdt-tab-panel"
                      id="vdt-panel-contacts"
                      role="tabpanel"
                      aria-labelledby="vdt-tab-contacts"
                      hidden={activeTab !== "contacts"}
                    >
                      <div className="vdt-three-columns">
                        <Card title="Driver Details" icon={UsersRound}>
                          <Rows
                            rows={[
                              [
                                "Name",
                                display(
                                  vehicle.driver?.name || vehicle.driverName,
                                ),
                              ],
                              [
                                "Contact",
                                display(
                                  vehicle.driver?.contactNumber ||
                                    vehicle.driverNumber,
                                ),
                              ],
                            ]}
                          />
                        </Card>
                        <Card title="Escort Details" icon={UsersRound}>
                          <Rows
                            rows={[
                              [
                                "Vehicle Number",
                                display(vehicle.escort?.vehicleNumber),
                              ],
                              ["Name", display(vehicle.escort?.name)],
                              [
                                "Contact",
                                display(vehicle.escort?.contactNumber),
                              ],
                            ]}
                          />
                        </Card>
                        <Card title="Supervisor Details" icon={UsersRound}>
                          <Rows
                            rows={[
                              ["Name", display(vehicle.supervisor?.name)],
                              [
                                "Contact",
                                display(vehicle.supervisor?.contactNumber),
                              ],
                            ]}
                          />
                        </Card>
                      </div>
                    </section>
                    <section
                      className="vdt-tab-panel"
                      id="vdt-panel-history"
                      role="tabpanel"
                      aria-labelledby="vdt-tab-history"
                      hidden={activeTab !== "history"}
                    >
                      <Card
                        title={
                          vehicle?._craneJourneyId
                            ? `Trip ${vehicle._craneTripNumber} Movement History`
                            : "Daily Movement History"
                        }
                        icon={History}
                        right={
                          <span className="vdt-count">
                            {
                              new Set(
                                history.map((entry) => dateKey(entry.date)),
                              ).size
                            }{" "}
                            Days · {array(vehicle.dailyTracking).length} Updates
                          </span>
                        }
                      >
                        <div className="vdt-table-wrap">
                          <table className="vdt-table">
                            <thead>
                              <tr>
                                {[
                                  "Date",
                                  "Day",
                                  "Location",
                                  "Loaded Material",
                                  "Weight (tons)",
                                  ...(isCraneVehicleTrip(trip) ? ["TG No"] : []),
                                  "Running KM",
                                  "Status",
                                  "Updated By",
                                  "Remarks",
                                ].map((label) => (
                                  <th scope="col" key={label}>
                                    {label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {history.map((entry, index) => (
                                <tr
                                  key={`${entry.trackingId || entry.date}-${index}`}
                                >
                                  <td>
                                    {dateText(entry.date)}
                                    {entry.tripNumber && (
                                      <small
                                        style={{
                                          display: "block",
                                          color: "#6f8797",
                                          marginTop: "3px",
                                        }}
                                      >
                                        Trip {entry.tripNumber}
                                      </small>
                                    )}
                                  </td>
                                  <td>
                                    {entry.day == null
                                      ? "—"
                                      : `Day ${entry.day}`}
                                  </td>
                                  <td>
                                    {entry.missing
                                      ? "—"
                                      : display(entry.currentLocation)}
                                  </td>
                                  <td>{entry.missing ? "—" : display(entry.loadedMaterial)}</td>
                                  <td>{entry.missing || entry.loadedWeightTons == null
                                    ? "—"
                                    : `${entry.loadedWeightTons} TON`}</td>
                                  {isCraneVehicleTrip(trip) && (
                                    <td>{entry.missing ? "—" : display(entry.tgNo)}</td>
                                  )}
                                  <td>
                                    {entry.missing ? "—" : km(entry.runningKm)}
                                  </td>
                                  <td>
                                    {entry.missing ? (
                                      <span className="vdt-muted">
                                        No update
                                      </span>
                                    ) : (
                                      <Badge>
                                        {display(entry.status, "Idle")}
                                      </Badge>
                                    )}
                                  </td>
                                  <td>
                                    {entry.missing
                                      ? "—"
                                      : display(entry.updatedBy)}
                                  </td>
                                  <td>
                                    {entry.missing
                                      ? "No update recorded"
                                      : display(entry.remarks)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {!history.length && (
                            <p className="vdt-no-file">
                              No movement history available.
                            </p>
                          )}
                        </div>
                      </Card>
                      <Card
                        title="Vehicle Replacement History"
                        icon={Truck}
                        right={
                          <span className="vdt-count">
                            {replacements.length} Replacements
                          </span>
                        }
                      >
                        {replacements.length ? (
                          <div className="vdt-table-wrap">
                            <table className="vdt-table">
                              <thead>
                                <tr>
                                  {[
                                    "Date",
                                    "Previous Vehicle",
                                    "New Vehicle",
                                    "Source",
                                    "Reason",
                                  ].map((label) => (
                                    <th scope="col" key={label}>
                                      {label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {replacements
                                  .slice()
                                  .reverse()
                                  .map((entry, index) => (
                                    <tr key={entry.replacementId || index}>
                                      <td>{dateText(entry.replacedAt)}</td>
                                      <td>{display(entry.oldVehicleNumber)}</td>
                                      <td>{display(entry.newVehicleNumber)}</td>
                                      <td>
                                        {display(
                                          entry.replacementSource ||
                                            entry.source,
                                        )}
                                      </td>
                                      <td>
                                        {display(entry.reason || entry.remarks)}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="vdt-no-file">
                            No vehicle replacements.
                          </p>
                        )}
                      </Card>
                    </section>
                    <section
                      className="vdt-tab-panel"
                      id="vdt-panel-trip"
                      role="tabpanel"
                      aria-labelledby="vdt-tab-trip"
                      hidden={activeTab !== "trip"}
                    >
                      <div className="vdt-two-columns">
                        <Card title="Order Information" icon={Info}>
                          <Rows
                            rows={[
                              ["Trip ID", display(trip.tripId)],
                              ["Customer", display(trip.customer)],
                              [
                                "Material",
                                display(trip.materialType || trip.materialName),
                              ],
                              ["Origin", display(trip.origin)],
                              ["Destination", display(trip.destination)],
                              ["Total KM", km(totalKm)],
                              [
                                "Required Vehicles",
                                display(
                                  trip.totalVehicles ??
                                    array(trip.vehicleRequirements).reduce(
                                      (sum, item) =>
                                        sum + number(item.quantity),
                                      0,
                                    ),
                                ),
                              ],
                              ["Stage", display(trip.stage)],
                              ["Created On", dateText(trip.createdAt)],
                            ]}
                          />
                        </Card>
                        <Card title="Customer & Logistics" icon={UsersRound}>
                          <Rows
                            rows={[
                              [
                                "Contact Person",
                                display(
                                  trip.clientContactPerson ||
                                    trip.contactPerson,
                                ),
                              ],
                              [
                                "Phone",
                                display(trip.clientPhone || trip.contactNumber),
                              ],
                              ["Email", display(trip.email)],
                              [
                                "LSP",
                                display(
                                  vehicle.lsp ||
                                    quotation.lsp ||
                                    requirement.lsp ||
                                    trip.lsp,
                                ),
                              ],
                              [
                                "Transport Contact",
                                display(
                                  vehicle.transporterContactPerson ||
                                    quotation.transporterContactPerson ||
                                    trip.transporterContactPerson,
                                ),
                              ],
                              [
                                "Transport Phone",
                                display(
                                  vehicle.transporterPhone ||
                                    quotation.transporterPhone ||
                                    trip.transporterPhone,
                                ),
                              ],
                              ["Assigned KAM", display(trip.assignedKam)],
                              [
                                "Estimated Transit",
                                trip.estimatedTransitDays == null
                                  ? "—"
                                  : `${trip.estimatedTransitDays} Days`,
                              ],
                              ["Remarks", display(trip.remarks || trip.remark)],
                            ]}
                          />
                        </Card>
                      </div>
                    </section>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
};

export default VehicleDetails;
