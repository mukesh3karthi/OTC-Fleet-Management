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

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");
const API_URL = `${API_BASE}/api/triporders`;
const array = (value) => (Array.isArray(value) ? value : []);
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
  const [today, setToday] = useState(() => dateKey(new Date()));
  const [documentError, setDocumentError] = useState("");
  const [documentBusy, setDocumentBusy] = useState("");
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
            (array(item.allocatedVehicles).length ||
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
    const vehicles = array(trip?.allocatedVehicles),
      preferred =
        searchParams.get("allocationId") || location.state?.allocationId;
    setSelectedVehicle((current) =>
      vehicleId(
        vehicles.find((item) => vehicleId(item) === current) ||
          vehicles.find((item) => vehicleId(item) === preferred) ||
          vehicles[0],
      ),
    );
    setDocumentError("");
  }, [trip, searchParams, location.state?.allocationId]);
  const vehicles = array(trip?.allocatedVehicles);
  const vehicle =
    vehicles.find((item) => vehicleId(item) === selectedVehicle) || vehicles[0];
  const latest = latestEntry(vehicle);
  const history = useMemo(
    () => everyDayHistory(vehicle, today),
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
  const coveredKm = array(vehicle?.dailyTracking).reduce(
    (sum, entry) => sum + Math.max(0, number(entry.runningKm)),
    0,
  );
  const currentDay = daysBetween(
    vehicle?.loading?.pointInDate,
    vehicle?.unloading?.pointOutDate || today,
    true,
  );
  const status = getVehicleStatus(vehicle, today);
  const points = routePoints(trip);
  const currentPosition = display(
    latest?.currentLocation || vehicle?.currentLocation,
    "",
  );
  const currentIndex = points.findIndex(
    (point) => point.toLowerCase() === currentPosition.trim().toLowerCase(),
  );
  const routeReached = display(latest?.status, "").toLowerCase() === "reached";
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
        `${API_URL}/${encodeURIComponent(mongoId)}/allocated-vehicles/${encodeURIComponent(allocationId)}/${type}/file?disposition=${download ? "attachment" : "inline"}`,
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
      <header className="vdt-page-heading">
        <button
          type="button"
          className="vdt-button vdt-back"
          onClick={() => navigate("/tracking")}
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <div className="vdt-title">
          <h1>Vehicle Details</h1>
          <p>
            {trip
              ? `${display(trip.tripId)} · ${display(trip.origin)} → ${display(trip.destination)}`
              : "Trip vehicle information"}
          </p>
        </div>
        <div className="vdt-heading-actions">
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
          <section className="vdt-vehicle-selector" aria-label="Select vehicle">
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
              {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}
            </span>
          </section>
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
                    <ol>
                      {points.map((point, index) => (
                        <li
                          key={`${point}-${index}`}
                          className={
                            routeReached || index <= currentIndex
                              ? "is-covered"
                              : ""
                          }
                          aria-current={
                            index === currentIndex ? "location" : undefined
                          }
                        >
                          <span className="vdt-route-icon">
                            {index === points.length - 1 ? (
                              <Truck size={13} />
                            ) : (
                              <MapPin size={13} />
                            )}
                          </span>
                          <strong>{point}</strong>
                          <small>
                            {index === 0
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
                      ["Balance", Math.max(0, totalKm - coveredKm), "balance"],
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
                          [
                            "Current Day",
                            currentDay === null ? "—" : `Day ${currentDay}`,
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
                              requirement.vehicleType ||
                                vehicle.vehicleType ||
                                trip.vehicleType,
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
                            display(vehicle.vehicleNumber || vehicle.vehicleNo),
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
                              vehicle.lr?.originalName || vehicle.lr?.fileName,
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
                          ["E-Way Number", display(vehicle.ewayBill?.number)],
                          ["Valid Upto", dateText(vehicle.ewayBill?.validUpto)],
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
                          ["Uploaded On", dateText(vehicle.pod?.uploadedAt)],
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
                            display(vehicle.driver?.name || vehicle.driverName),
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
                          ["Contact", display(vehicle.escort?.contactNumber)],
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
                    title="Daily Movement History"
                    icon={History}
                    right={
                      <span className="vdt-count">
                        {
                          new Set(history.map((entry) => dateKey(entry.date)))
                            .size
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
                              <td>{dateText(entry.date)}</td>
                              <td>
                                {entry.day == null ? "—" : `Day ${entry.day}`}
                              </td>
                              <td>
                                {entry.missing
                                  ? "—"
                                  : display(entry.currentLocation)}
                              </td>
                              <td>
                                {entry.missing ? "—" : km(entry.runningKm)}
                              </td>
                              <td>
                                {entry.missing ? (
                                  <span className="vdt-muted">No update</span>
                                ) : (
                                  <Badge>{display(entry.status, "Idle")}</Badge>
                                )}
                              </td>
                              <td>
                                {entry.missing ? "—" : display(entry.updatedBy)}
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
                                      entry.replacementSource || entry.source,
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
                      <p className="vdt-no-file">No vehicle replacements.</p>
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
                                  (sum, item) => sum + number(item.quantity),
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
                              trip.clientContactPerson || trip.contactPerson,
                            ),
                          ],
                          [
                            "Phone",
                            display(trip.clientPhone || trip.contactNumber),
                          ],
                          ["Email", display(trip.email)],
                          ["LSP", display(trip.lsp)],
                          [
                            "Transport Contact",
                            display(trip.transporterContactPerson),
                          ],
                          ["Transport Phone", display(trip.transporterPhone)],
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
    </main>
  );
};

export default VehicleDetails;
