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
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Search,
  Truck,
  X,
} from "lucide-react";
import "../pagescss/tracking.css";

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
  const statuses = list(trip?.allocatedVehicles).map((vehicle) =>
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

const TripStatusChart = ({ counts, selectedStatus, onSelect }) => {
  const total = STATUSES.reduce((sum, status) => sum + counts[status], 0);
  const circumference = 2 * Math.PI * 49;
  let consumed = 0;
  return (
    <section className="td-panel">
      <header className="td-panel-heading">
        <div>
          <h2>Trip status</h2>
          <p>Click a status to filter</p>
        </div>
        <span className="td-chart-total">{total} trips</span>
      </header>
      <div className="td-distribution">
        <svg
          viewBox="0 0 134 134"
          className="td-donut"
          role="img"
          aria-label={`Trip status: ${STATUSES.map((status) => `${status}: ${counts[status]}`).join(", ")}`}
        >
          <circle cx="67" cy="67" r="49" className="td-donut-track" />
          {STATUSES.map((status) => {
            const length = total ? (counts[status] / total) * circumference : 0;
            const offset = consumed;
            consumed += length;
            return length > 0 ? (
              <circle
                key={status}
                cx="67"
                cy="67"
                r="49"
                className={`td-donut-segment td-color-${status.toLowerCase()}`}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 67 67)"
              />
            ) : null;
          })}
          <text x="67" y="65" className="td-donut-value" textAnchor="middle">
            {total}
          </text>
          <text x="67" y="85" className="td-donut-label" textAnchor="middle">
            Trips
          </text>
        </svg>
        <div className="td-legend">
          {STATUSES.map((status) => (
            <button
              type="button"
              key={status}
              onClick={() =>
                onSelect(selectedStatus === status ? "All" : status)
              }
              aria-pressed={selectedStatus === status}
            >
              <span
                className={`td-legend-dot td-color-${status.toLowerCase()}`}
              />
              <span>{status}</span>
              <strong>{counts[status]}</strong>
            </button>
          ))}
        </div>
      </div>
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
                      allocated = list(trip.allocatedVehicles);
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
          <TripStatusChart
            counts={counts}
            selectedStatus={statusFilter}
            onSelect={selectStatus}
          />
        </aside>
      </div>
    </main>
  );
};

export default Tracking;
