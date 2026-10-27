import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Search, RefreshCw, Truck, Navigation, X, Save, Plus, Route, FileText, Upload, Eye } from "lucide-react";
import "./cranevehicles.css";

const BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");
const text = (value) =>
  value === undefined || value === null || value === "" ? "—" : String(value);
const items = (value) => (Array.isArray(value) ? value : []);
const isCrane = (trip) =>
  ["crane", "cranemovement"].includes(
    String(trip?.movementType || "")
      .toLowerCase()
      .replace(/[\s_-]+/g, ""),
  );
const dimensions = (value) =>
  [value?.length, value?.height, value?.width].some(
    (v) => v !== "" && v != null,
  )
    ? `${text(value?.length)} × ${text(value?.height)} × ${text(value?.width)} FT`
    : "—";
const firstFilled = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") ?? "";
const latestTracking = (vehicle) => {
  const history = items(vehicle?.dailyTracking);
  return history[history.length - 1] || {};
};

const CraneVehicles = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [trip, setTrip] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setTrip(null);
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token?.trim())
          throw new Error(
            "Please sign in with your main administrator account.",
          );
        if (!id) throw new Error("No Crane order selected.");
        const path = /^[a-f\d]{24}$/i.test(id)
          ? encodeURIComponent(id)
          : `trip/${encodeURIComponent(id)}`;
        const response = await fetch(`${BASE}/api/triporders/${path}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.message || "Unable to load Crane vehicles.");
        const order =
          payload?.data?.trip ||
          payload?.data?.order ||
          payload?.data ||
          payload?.trip ||
          payload?.order ||
          payload;
        if (!isCrane(order))
          throw new Error("This page is available for Crane orders only.");
        if (!controller.signal.aborted) setTrip(order);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err.message || "Unable to load vehicles.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id, revision]);
  const vehicles = useMemo(
    () =>
      items(trip?.allocatedVehicles).map((vehicle) => {
        const savedMovements = [...items(vehicle.craneTrips)].sort(
          (a, b) =>
            new Date(b.updatedAt || b.date || 0) -
            new Date(a.updatedAt || a.date || 0),
        );
        const latestMovement = savedMovements[0] || {};
        return {
          ...vehicle,
          // The requirement is named "Crane" for every vehicle in this order.
          // It is not the actual vehicle type entered during allocation.
          displayType: firstFilled(vehicle.vehicleType, vehicle.type),
          displayLsp: vehicle.lsp || "",
          // LR and E-Way details belong to the saved Crane journey.
          displayLrNo: firstFilled(
            latestMovement.lr?.number,
            vehicle.lr?.number,
          ),
          displayEwayNo: firstFilled(
            latestMovement.ewayBill?.number,
            vehicle.ewayBill?.number,
          ),
          displayWeight: latestMovement.loadedWeightTons ?? vehicle.weight ?? null,
          displayTripCount: savedMovements.length,
          displayLoading: firstFilled(latestMovement.loading?.status, vehicle.loading?.status),
          displayUnloading: firstFilled(latestMovement.unloading?.status, vehicle.unloading?.status),
          // Show what was actually loaded on the latest saved Crane journey.
          // Never fall back to the order's separate materialType field.
          displayLoadedMaterial: firstFilled(
            savedMovements[0]?.loadedMaterial,
            savedMovements[0]?.movementMaterial,
            savedMovements[0]?.material,
          ),
          displayTg: firstFilled(
            savedMovements.find((record) => record.tgNo || record.tgNumber)?.tgNo,
            savedMovements.find((record) => record.tgNo || record.tgNumber)?.tgNumber,
            vehicle.tgNo, vehicle.tgNumber, vehicle.TGNo,
            trip?.tgNo, trip?.tgNumber, trip?.TGNo,
            trip?.orderFinalization?.tgNo,
          ),
          displayLocation: firstFilled(
            latestMovement.currentLocation,
            latestTracking(vehicle).currentLocation,
            latestTracking(vehicle).location,
            vehicle.currentLocation,
            vehicle.location,
          ),
          displayStatus: firstFilled(
            vehicle.vehicleStatus,
            latestTracking(vehicle).status,
            latestTracking(vehicle).movementStatus,
            "Active",
          ),
        };
      }),
    [trip],
  );
  const visible = vehicles.filter((vehicle) =>
    [
      vehicle.vehicleNumber,
      vehicle.displayType,
      vehicle.displayTg,
      vehicle.displayLocation,
      vehicle.displayStatus,
      vehicle.displayLsp,
      vehicle.displayLoadedMaterial,
      vehicle.displayLrNo,
      vehicle.displayEwayNo,
      vehicle.displayWeight,
      vehicle.displayTripCount,
      vehicle.displayLoading,
      vehicle.displayUnloading,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const activeCount = vehicles.filter(
    (v) => String(v.vehicleStatus || "Active").toLowerCase() !== "replaced",
  ).length;
  return (
    <main className="crane-vehicles-page">
      <header className="crane-vehicles-header">
        <div className="crane-vehicles-heading">
          <button
            type="button"
            className="crane-back"
            onClick={() => navigate(location.state?.returnTo || "/tracking")}
            aria-label="Back to trips"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="crane-eyebrow">CRANE OPERATIONS</span>
            <h1>Crane Vehicles</h1>
            <p>
              {text(trip?.tripId)} <span>·</span> {text(trip?.customer)}{" "}
              <span>·</span> {text(trip?.origin)} → {text(trip?.destination)}
            </p>
          </div>
        </div>
        <div className="crane-header-actions">
          <span className="crane-count">
            <Truck size={15} />
            {vehicles.length} Vehicles <small>{activeCount} Active</small>
          </span>
          <button
            type="button"
            className="crane-refresh"
            disabled={loading}
            onClick={() => setRevision((v) => v + 1)}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </header>
      <section className="crane-vehicles-panel">
        <div className="crane-table-toolbar">
          <div>
            <h2>Allocated vehicles <span className="crane-allocated-count">{visible.length}</span></h2>
            <p>Select a row to view the vehicle’s details.</p>
          </div>
          <label className="crane-search">
            <Search size={16} />
            <input
              aria-label="Search Crane vehicles"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vehicle, LSP, loaded material..."
            />
          </label>
        </div>
        {error ? (
          <div className="crane-page-message" role="alert">
            {error}
            <button type="button" onClick={() => setRevision((v) => v + 1)}>
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="crane-page-message" role="status">
            Loading vehicles...
          </div>
        ) : (
          <div className="crane-vehicles-table-wrap">
            <table className="crane-vehicles-table">
              <thead>
                <tr>
                  {[
                    "Vehicle Number",
                    "Type",
                    "LSP",
                    "Loaded Material",
                    "TG No",
                    "Current Location",
                    "Trip",
                    "Loading",
                    "Unloading",
                    "Weight (Tons)",
                    "Details",
                  ].map((heading) => (
                    <th key={heading}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length ? (
                  visible.map((vehicle, index) => {
                    const allocationId = vehicle.allocationId || vehicle._id;
                    const replaced =
                      String(
                        vehicle.vehicleStatus || "Active",
                      ).toLowerCase() === "replaced";
                    return (
                      <tr
                        key={
                          allocationId || `${vehicle.vehicleNumber}-${index}`
                        }
                      >
                        <td>
                          <strong className="crane-vehicle-number">
                            {text(vehicle.vehicleNumber)}
                          </strong>
                        </td>
                        <td>{text(vehicle.displayType)}</td>
                        <td>{text(vehicle.displayLsp)}</td>
                        <td>{text(vehicle.displayLoadedMaterial)}</td>
                        <td className="crane-mono">{text(vehicle.displayTg)}</td>
                        <td>{text(vehicle.displayLocation)}</td>
                        <td>{vehicle.displayTripCount > 0 ? vehicle.displayTripCount : "—"}</td>
                        <td>{text(vehicle.displayLoading)}</td>
                        <td>{text(vehicle.displayUnloading)}</td>
                        <td>{vehicle.displayWeight == null || vehicle.displayWeight === "" ? "—" : vehicle.displayWeight}</td>
                        <td>
                          <button
                            type="button"
                            className="crane-movement-btn"
                            disabled={!allocationId || replaced}
                            onClick={() => navigate(
                              `/crane-vehicles/${encodeURIComponent(trip._id || id)}/movement/${encodeURIComponent(allocationId)}`,
                              { state: { returnTo: location.state?.returnTo } },
                            )}
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="crane-empty">
                      {vehicles.length
                        ? "No vehicles match your search."
                        : "No vehicles have been allocated to this Crane order."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

/* Crane movement form and its independent helpers. */
const safeArray = items;
const getLocalYmd = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getEwayBillStatus = (number, validUpto, today = getLocalYmd()) => {
  if (!String(number || "").trim() || !validUpto) return "Pending";
  const date = String(validUpto).slice(0, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(new Date(`${date}T00:00:00`).getTime())
  )
    return "Pending";
  const expiry = Date.parse(`${date}T00:00:00`);
  const current = Date.parse(`${today}T00:00:00`);
  const daysRemaining = Math.round((expiry - current) / 86400000);
  if (daysRemaining < 0) return "Expired";
  if (daysRemaining === 0) return "Expires Today";
  if (daysRemaining <= 7) return "Expiring Soon";
  return "Active";
};
const getEwayBillHeading = (number, validUpto, today = getLocalYmd()) => {
  const status = getEwayBillStatus(number, validUpto, today);
  if (status !== "Expiring Soon") return status;
  const [ey, em, ed] = String(validUpto).slice(0, 10).split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const days = Math.round(
    (Date.UTC(ey, em - 1, ed) - Date.UTC(ty, tm - 1, td)) / 86400000,
  );
  return `${days} ${days === 1 ? "Day" : "Days"} Left`;
};
// Inclusive movement durations are calculated in whole elapsed days.
const calculateHaltingDays = (pointInDate, pointOutDate = "") => {
  if (!pointInDate) return 0;
  const parseDate = (value) => {
    const [year, month, day] = String(value)
      .slice(0, 10)
      .split("-")
      .map(Number);
    if (!year || !month || !day) return null;
    return Date.UTC(year, month - 1, day);
  };
  const start = parseDate(pointInDate);
  const end = parseDate(pointOutDate || getLocalYmd());
  if (start === null || end === null || end < start) return 0;
  return Math.floor((end - start) / 86400000);
};
const movementDayFromLoading = (pointInDate, movementDate) => {
  if (!pointInDate || !movementDate) return 1;
  const parseDate = (value) => {
    const [year, month, day] = String(value)
      .slice(0, 10)
      .split("-")
      .map(Number);
    if (!year || !month || !day) return null;
    return Date.UTC(year, month - 1, day);
  };
  const start = parseDate(pointInDate);
  const current = parseDate(movementDate);
  if (start === null || current === null || current < start) return 1;
  return Math.floor((current - start) / 86400000) + 1;
};
// Build display rows without creating movement records for missing dates.
const buildEveryDayHistory = (
  entries,
  pointInDate,
  pointOutDate,
  today = getLocalYmd(),
) => {
  const dateKey = (value) => {
    const key = String(value || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return "";
    const time = Date.parse(`${key}T00:00:00Z`);
    return Number.isFinite(time) &&
      new Date(time).toISOString().slice(0, 10) === key
      ? key
      : "";
  };
  const saved = safeArray(entries);
  const start = dateKey(pointInDate);
  const end = dateKey(pointOutDate || today);
  if (!start || !end || end < start) {
    return saved
      .slice()
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }
  const grouped = new Map();
  for (const entry of saved) {
    const key = dateKey(entry.date);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(entry);
  }
  const first = Date.parse(`${start}T00:00:00Z`);
  const last = Date.parse(`${end}T00:00:00Z`);
  const rows = [];
  for (let time = last; time >= first; time -= 86400000) {
    const key = new Date(time).toISOString().slice(0, 10);
    const day = Math.floor((time - first) / 86400000) + 1;
    const updates = grouped.get(key);
    if (updates?.length) {
      rows.push(
        ...updates
          .slice()
          .reverse()
          .map((entry) => ({ ...entry, day, isMissingDay: false })),
      );
    } else {
      rows.push({ date: key, day, isMissingDay: true });
    }
  }
  // Retain legacy entries outside the selected date range.
  rows.push(
    ...saved.filter((entry) => {
      const key = dateKey(entry.date);
      return !key || key < start || key > end;
    }),
  );
  return rows;
};
// Trip duration includes both Loading Point In and Unloading Point Out.
const tripDaysThroughPointOut = (pointInDate, pointOutDate, movementDate) =>
  movementDayFromLoading(
    pointInDate,
    pointOutDate || movementDate || getLocalYmd(),
  );
/* =========================================
   COMPONENT
========================================= */
const cjBASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");
const cjlist = (value) => (Array.isArray(value) ? value : []);
const cjdisplay = (value) =>
  value == null || value === "" ? "—" : String(value);
const cjfirstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") ?? "";
const cjtoday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const cjnewId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `CJ-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const cjlocalTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const cjformatTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const cjoperation = (raw = {}) => ({
  status: raw.status || "Pending",
  pointInAt: cjlocalTime(raw.pointInAt),
  completedAt: cjlocalTime(raw.completedAt),
  pointOutAt: cjlocalTime(raw.pointOutAt),
  remarks: raw.remarks || "",
});
const cjformFor = (record, trip, vehicle) => ({
  journeyId: record?.journeyId || cjnewId(),
  revision: record?.revision,
  date: record?.date || cjtoday(),
  // Each Crane journey has its own movement material. Do not default
  // to the order or allocated-vehicle material.
  loadedMaterial: cjfirstValue(
    record?.loadedMaterial,
    record?.movementMaterial,
    record?.material,
  ),
  loadedWeightTons: record?.loadedWeightTons ?? "",
  tgNo: cjfirstValue(
    record?.tgNo,
    record?.tgNumber,
    vehicle?.tgNo,
    vehicle?.tgNumber,
    vehicle?.TGNo,
    trip?.tgNo,
    trip?.tgNumber,
    trip?.TGNo,
    trip?.orderFinalization?.tgNo,
  ),
  origin: record?.origin || trip?.origin || "",
  destination: record?.destination || trip?.destination || "",
  startKm: record?.startKm ?? "",
  endKm: record?.endKm ?? "",
  currentLocation: record?.currentLocation || "",
  status: record?.status || "Idle",
  lrNumber: record?.lr?.number || "",
  lrDate: record?.lr?.date ? String(record.lr.date).slice(0, 10) : "",
  lrRemarks: record?.lr?.remarks || "",
  ewayBillNumber: record?.ewayBill?.number || "",
  ewayBillValidUpto: record?.ewayBill?.validUpto
    ? String(record.ewayBill.validUpto).slice(0, 10)
    : "",
  lrFile: null,
  ewayBillFile: null,
  podFile: null,
  remarks: record?.remarks || "",
  updatedBy: record?.updatedBy || "",
  loading: cjoperation(record?.loading),
  unloading: cjoperation(record?.unloading),
});
const cjunwrap = (payload) =>
  payload?.data?.trip ||
  payload?.data?.order ||
  payload?.data ||
  payload?.trip ||
  payload?.order ||
  payload;
const cjstatuses = [
  "Idle",
  "Moving",
  "Stopped",
  "Breakdown",
  "Reached",
  "Planned",
  "Loading",
  "In Transit",
  "Unloading",
  "Completed",
];

const CraneJourneyPopup = () => {
  const { id, allocationId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [form, setForm] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const vehicle = useMemo(
    () =>
      cjlist(trip?.allocatedVehicles).find(
        (v) => String(v.allocationId || v._id) === allocationId,
      ),
    [trip, allocationId],
  );
  const journeys = useMemo(
    () =>
      [...cjlist(vehicle?.craneTrips)].sort(
        (a, b) =>
          String(a.date).localeCompare(String(b.date)) ||
          new Date(a.createdAt) - new Date(b.createdAt),
      ),
    [vehicle],
  );
  const current = journeys.find((j) => j.journeyId === selectedId);
  const totalHistory = journeys.flatMap((journey, tripIndex) => {
    const records = cjlist(journey.history);
    return (records.length ? records : [journey]).map((entry, index) => ({ ...entry, journeyId: journey.journeyId, tripNumber: tripIndex + 1, rowKey: `${journey.journeyId}-${entry.historyId || index}` }));
  }).sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || new Date(a.savedAt || a.updatedAt || 0) - new Date(b.savedAt || b.updatedAt || 0));

  const day = form
    ? tripDaysThroughPointOut(
        form.loading.pointInAt,
        form.unloading.pointOutAt,
        form.date,
      )
    : 1;
  const history = buildEveryDayHistory(
    cjlist(current?.history).map((entry) => ({
      ...entry,
      runningKm:
        entry.startKm != null && entry.endKm != null
          ? entry.endKm - entry.startKm
          : 0,
    })),
    form?.loading?.pointInAt || form?.date || current?.createdAt,
    form?.unloading?.pointOutAt,
    cjtoday(),
  );
  const previousUpdate = cjlist(current?.history)
    .filter((entry) => entry.date < (form?.date || ""))
    .sort(
      (a, b) =>
        String(b.date).localeCompare(String(a.date)) ||
        new Date(b.savedAt) - new Date(a.savedAt),
    )[0];
  const unloadingCompleted = form?.unloading?.status === "Completed";
  const replaced =
    String(vehicle?.vehicleStatus || "").toLowerCase() === "replaced";
  const orderCompleted =
    ["trip complete", "trip completed", "completed"].includes(
      String(trip?.stage || "").toLowerCase(),
    ) || String(trip?.status || "").toLowerCase() === "completed";
  const locked = saving || replaced || orderCompleted;
  const headers = () => {
    const token = localStorage.getItem("token");
    if (!token?.trim())
      throw new Error("Please sign in with your main administrator account.");
    return { Authorization: `Bearer ${token}` };
  };
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setNotice("");
    setTrip(null);
    setForm(null);
    (async () => {
      try {
        const path = /^[a-f\d]{24}$/i.test(id || "")
          ? encodeURIComponent(id)
          : `trip/${encodeURIComponent(id || "")}`;
        const response = await fetch(`${cjBASE}/api/triporders/${path}`, {
          headers: headers(),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.message || "Unable to load vehicle.");
        const order = cjunwrap(payload);
        if (
          !["crane", "cranemovement"].includes(
            String(order.movementType || "")
              .toLowerCase()
              .replace(/[\s_-]+/g, ""),
          )
        )
          throw new Error("This page is for Crane vehicles only.");
        const target = cjlist(order.allocatedVehicles).find(
          (v) => String(v.allocationId || v._id) === allocationId,
        );
        if (!target) throw new Error("The selected vehicle was not found.");
        const latest = [...cjlist(target.craneTrips)].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
        )[0];
        if (controller.signal.aborted) return;
        setTrip(order);
        setSelectedId(latest?.journeyId || "");
        setForm(cjformFor(latest, order, target));
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err.message || "Unable to load movement.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id, allocationId, revision]);
  const setField = (name, value) => {
    setError("");
    setNotice("");
    setForm((previous) => ({ ...previous, [name]: value }));
  };
  const setOperation = (section, name, value) => {
    setError("");
    setNotice("");
    setForm((previous) => ({
      ...previous,
      [section]: { ...previous[section], [name]: value },
    }));
  };
  const addTrip = () => {
    setSelectedId("");
    const next = cjformFor(null, trip, vehicle);
    next.startKm = journeys[journeys.length - 1]?.endKm ?? "";
    setForm(next);
    setError("");
    setNotice("");
  };
  const selectTrip = (record) => {
    setSelectedId(record.journeyId);
    setForm(cjformFor(record, trip, vehicle));
    setError("");
    setNotice("");
  };
  const save = async (event) => {
    event.preventDefault();
    if (!form || !vehicle || locked) return;
    if (
      !form.origin.trim() ||
      !form.destination.trim() ||
      !form.updatedBy.trim() ||
      !form.currentLocation.trim()
    ) {
      setError("From, To, Current Location and Updated By are required.");
      return;
    }
    if (
      form.loadedWeightTons !== "" &&
      (!Number.isFinite(Number(form.loadedWeightTons)) || Number(form.loadedWeightTons) < 0)
    ) {
      setError("Enter a valid loaded weight in tons (zero or greater).");
      return;
    }
    const parseKm = (value) => (value === "" ? null : Number(value));
    const startKm = parseKm(form.startKm),
      endKm = parseKm(form.endKm);
    if (
      [startKm, endKm].some(
        (v) => v != null && (!Number.isFinite(v) || v < 0),
      ) ||
      (endKm != null && (startKm == null || endKm < startKm))
    ) {
      setError("End KM must be at least Start KM.");
      return;
    }
    if (form.podFile && !unloadingCompleted) {
      setError("Complete unloading before uploading POD.");
      return;
    }
    if (
      form.endKm !== "" &&
      previousUpdate?.endKm != null &&
      Number(form.endKm) < Number(previousUpdate.endKm)
    ) {
      setError("Today KM cannot be less than yesterday KM.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const convertOperation = (raw) => ({
        ...raw,
        ...Object.fromEntries(
          ["pointInAt", "completedAt", "pointOutAt"].map((key) => [
            key,
            raw[key] ? new Date(raw[key]).toISOString() : null,
          ]),
        ),
      });
      const path = `${cjBASE}/api/triporders/${encodeURIComponent(trip._id)}/allocated-vehicles/${encodeURIComponent(vehicle.allocationId)}/crane-trips${selectedId ? `/${encodeURIComponent(selectedId)}` : ""}`;
      const response = await fetch(path, {
        method: selectedId ? "PUT" : "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          loadedWeightTons: form.loadedWeightTons === ""
            ? null
            : Number(form.loadedWeightTons),
          podFile: undefined,
          lrFile: undefined,
          ewayBillFile: undefined,
          lr: {
            number: form.lrNumber,
            date: form.lrDate,
            remarks: form.lrRemarks,
          },
          ewayBill: {
            number: form.ewayBillNumber,
            validUpto: form.ewayBillValidUpto,
          },
          startKm,
          endKm,
          loading: convertOperation(form.loading),
          unloading: convertOperation(form.unloading),
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.message || "Unable to save trip.");
      const order = cjunwrap(payload);
      const target = cjlist(order.allocatedVehicles).find(
        (v) => v.allocationId === vehicle.allocationId,
      );
      const saved = cjlist(target?.craneTrips).find(
        (j) => j.journeyId === form.journeyId,
      );
      if (!saved)
        throw new Error(
          "The server response did not include the saved trip. Refresh to verify it.",
        );
      let updatedOrder = order;
      let updatedVehicle = target;
      let updatedJourney = saved;
      const pendingFiles = { lrFile: form.lrFile, ewayBillFile: form.ewayBillFile, podFile: form.podFile };
      setTrip(updatedOrder);
      setSelectedId(saved.journeyId);
      setForm({ ...cjformFor(updatedJourney, updatedOrder, updatedVehicle), ...pendingFiles });
      for (const [type, field, label] of [["lr", "lrFile", "LR"], ["ewayBill", "ewayBillFile", "E-Way Bill"], ["pod", "podFile", "POD"]]) {
        if (!pendingFiles[field]) continue;
        const upload = new FormData();
        upload.append("document", pendingFiles[field]);
        upload.append("uploadedBy", form.updatedBy);
        upload.append("revision", String(updatedJourney.revision));
        const uploaded = await fetch(
          `${cjBASE}/api/triporders/${encodeURIComponent(updatedOrder._id)}/allocated-vehicles/${encodeURIComponent(vehicle.allocationId)}/crane-trips/${encodeURIComponent(saved.journeyId)}/${type}`,
          { method: "PUT", headers: headers(), body: upload },
        );
        let uploadedResult;
        try { uploadedResult = await uploaded.json(); }
        catch { throw new Error(`Movement saved, but ${label} upload could not be confirmed. Your remaining selected files are kept. Refresh to verify before retrying.`); }
        if (!uploaded.ok) throw new Error(`Movement saved, but ${label} upload failed: ${uploadedResult.message || "Please retry"}. Remaining selected files are kept.`);
        updatedOrder = cjunwrap(uploadedResult);
        updatedVehicle = cjlist(updatedOrder.allocatedVehicles).find(v => v.allocationId === vehicle.allocationId);
        updatedJourney = cjlist(updatedVehicle?.craneTrips).find(j => j.journeyId === saved.journeyId);
        if (!updatedJourney) throw new Error("Movement saved, but uploaded document could not be confirmed. Refresh to verify.");
        pendingFiles[field] = null;
        setTrip(updatedOrder);
        setForm({ ...cjformFor(updatedJourney, updatedOrder, updatedVehicle), ...pendingFiles });
      }
      setNotice(
        "Movement saved for this trip. Use Add Trip for another journey on the same date.",
      );
    } catch (err) {
      setError(err.message || "Unable to save trip.");
    } finally {
      setSaving(false);
    }
  };
  const viewPod = async (type = "pod") => {
    let preview = window.open("", "_blank");
    try {
      if (!current?.[type]?.fileName) throw new Error("Save a document first.");
      const response = await fetch(
        `${cjBASE}/api/triporders/${encodeURIComponent(trip._id)}/allocated-vehicles/${encodeURIComponent(vehicle.allocationId)}/crane-trips/${encodeURIComponent(current.journeyId)}/${type}/file`,
        { headers: headers() },
      );
      if (!response.ok) throw new Error("Unable to view document.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (preview) preview.location.href = url;
      else {
        const link = document.createElement("a");
        link.href = url;
        link.download = current[type].fileName;
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (preview) preview.close();
      setError(err.message);
    }
  };
  const documentUpload = (type, field, label) => (
    <div className="trip-pod-upload-row">
      <div className="trip-pod-file-info"><span className="trip-pod-file-icon"><FileText size={16} /></span><div><small>{label} FILE</small><strong>{form[field]?.name || current?.[type]?.fileName || "No file selected"}</strong></div></div>
      <div className="trip-pod-actions"><label className={`trip-document-upload-button ${locked ? "disabled" : ""}`}><Upload size={13} />{current?.[type]?.fileName ? "Replace" : "Upload"}<input key={`${selectedId}-${field}-${form[field] ? "chosen" : "empty"}`} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={locked} onChange={event => setField(field, event.target.files?.[0] || null)} /></label>
      {form[field] && <button type="button" className="trip-document-view-button" disabled={locked} onClick={() => setField(field, null)}>Clear selected</button>}
      {current?.[type]?.fileName && <button type="button" className="trip-document-view-button" onClick={() => viewPod(type)}><Eye size={13} />View</button>}</div>
    </div>
  );
  const input = (name, label, type = "text") => (
    <label>
      <span>{label}</span>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => setField(name, e.target.value)}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        required={["date", "origin", "destination", "updatedBy"].includes(name)}
      />
    </label>
  );
  const back = () => navigate(`/crane-vehicles/${encodeURIComponent(id)}`);
  return (
    <main className="trip-list-page crane-journey-page">
      <div className="trip-movement-overlay" role="dialog" aria-modal="true">
        <form className="trip-movement-modal" onSubmit={save}>
          <header className="trip-movement-head">
            <div className="trip-movement-title">
              <span className="trip-movement-title-icon">
                <Navigation size={18} />
              </span>
              <div>
                <small>CRANE VEHICLE MOVEMENT</small>
                <h2>{cjdisplay(trip?.tripId)}</h2>
                <p>
                  {cjdisplay(vehicle?.vehicleNumber)} ·{" "}
                  {cjdisplay(form?.origin)} → {cjdisplay(form?.destination)}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="trip-movement-close"
              disabled={saving}
              onClick={back}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </header>
          <div className="trip-movement-body">
            {error && (
              <p role="alert" style={{ color: "#b91c1c" }}>
                {error}
              </p>
            )}
            {notice && (
              <p role="status" style={{ color: "#087f79" }}>
                {notice}
              </p>
            )}
            {loading ? (
              <div className="trip-movement-empty">
                Loading selected vehicle...
              </div>
            ) : !vehicle || !form ? (
              <div className="trip-movement-empty">
                Unable to display this vehicle.{" "}
                <button type="button" onClick={() => setRevision((v) => v + 1)}>
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="trip-movement-vehicle-tabs">
                  {journeys.map((record, index) => (
                    <button
                      type="button"
                      key={record.journeyId}
                      disabled={saving}
                      className={`trip-movement-vehicle-tab ${selectedId === record.journeyId ? "active" : ""}`}
                      onClick={() => selectTrip(record)}
                    >
                      <Route size={14} />
                      <span>
                        <strong>Trip {index + 1}</strong>
                        <small>
                          {record.date} · {record.status}
                        </small>
                      </span>
                    </button>
                  ))}
                  {!selectedId && (
                    <button
                      type="button"
                      className="trip-movement-vehicle-tab active"
                    >
                      <Route size={14} />
                      <span>
                        <strong>Trip {journeys.length + 1}</strong>
                        <small>New · Not saved</small>
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="trip-movement-vehicle-tab"
                    disabled={locked}
                    onClick={addTrip}
                  >
                    <Plus size={16} />
                    <span>
                      <strong>Add Trip</strong>
                      <small>Same date allowed</small>
                    </span>
                  </button>
                </div>
                <section className="trip-movement-summary crane-journey-summary">
                  {[
                    ["Vehicle", vehicle.vehicleNumber],
                    ["Loaded Material", form.loadedMaterial],
                    ["TG No", form.tgNo],
                    ["Current Location", form.currentLocation],
                    [
                      "Running KM",
                      form.startKm !== "" && form.endKm !== ""
                        ? `${Number(form.endKm) - Number(form.startKm)} KM`
                        : "—",
                    ],
                    ["Status", form.status],
                    ["Driver", vehicle.driver?.name],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{cjdisplay(value)}</strong>
                    </div>
                  ))}
                </section>
                {(replaced || orderCompleted) && (
                  <p role="status">
                    This vehicle or order is closed. Saved trips are available
                    for viewing.
                  </p>
                )}
                <fieldset
                  disabled={locked}
                  style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
                >
                  <section className="trip-movement-form-card">
                    <div className="trip-movement-section-title">
                      <div>
                        <small>DAILY TRACKING</small>
                        <h3>
                          {selectedId
                            ? "Movement Details"
                            : "Add Movement Details"}
                        </h3>
                      </div>
                      <span>Day {day}</span>
                    </div>
                    <div className="trip-movement-form-grid">
                      {input("date", "Date", "date")}
                      <label>
                        <span>Day</span>
                        <input type="number" value={day} readOnly />
                      </label>
                      <label>
                        <span>
                          {previousUpdate
                            ? "Yesterday KM"
                            : "Starting Odometer KM"}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={previousUpdate?.endKm ?? form.startKm}
                          readOnly={!!previousUpdate}
                          onChange={(e) => setField("startKm", e.target.value)}
                        />
                      </label>
                      {input("endKm", "Today KM *", "number")}
                      <label>
                        <span>Yesterday Location</span>
                        <input
                          value={previousUpdate?.currentLocation || ""}
                          readOnly
                        />
                      </label>
                      {input("currentLocation", "Current Location *")}
                      {input("origin", "From *")}
                      {input("destination", "To *")}
                      <label>
                        <span>Status</span>
                        <select
                          value={form.status}
                          onChange={(e) => setField("status", e.target.value)}
                        >
                          {cjstatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      {input("updatedBy", "Updated By *")}
                      {input("loadedMaterial", "Loaded Material")}
                      {input("tgNo", "TG No")}
                      {input("loadedWeightTons", "Weight (tons)", "number")}
                      {input("remarks", "Remarks")}
                    </div>
                  </section>
                  <section className="trip-movement-operation-grid">
                    {["loading", "unloading"].map((section) => (
                      <div
                        className="trip-movement-operation-card"
                        key={section}
                      >
                        <div className="trip-movement-operation-head">
                          <div>
                            <small>VEHICLE OPERATION</small>
                            <h3>
                              {section === "loading" ? "Loading" : "Unloading"}{" "}
                              Details
                            </h3>
                          </div>
                          <span>{form[section].status}</span>
                        </div>
                        <div className="trip-movement-operation-fields">
                          <label>
                            <span>Status</span>
                            <select
                              value={form[section].status}
                              onChange={(e) =>
                                setOperation(section, "status", e.target.value)
                              }
                            >
                              {["Pending", "In Progress", "Completed"].map(
                                (status) => (
                                  <option key={status}>{status}</option>
                                ),
                              )}
                            </select>
                          </label>
                          {[
                            ["Point In", "pointInAt"],
                            [
                              section === "loading"
                                ? "Loading Time"
                                : "Unloading Time",
                              "completedAt",
                            ],
                            ["Point Out", "pointOutAt"],
                          ].map(([label, name]) => (
                            <label key={name}>
                              <span>{label}</span>
                              <input
                                type="datetime-local"
                                value={form[section][name]}
                                onChange={(e) =>
                                  setOperation(section, name, e.target.value)
                                }
                              />
                            </label>
                          ))}
                          <label>
                            <span>Halting Days</span>
                            <input
                              value={calculateHaltingDays(
                                form[section].pointInAt,
                                form[section].pointOutAt,
                              )}
                              readOnly
                            />
                          </label>
                          <label>
                            <span>Remarks</span>
                            <input
                              value={form[section].remarks}
                              onChange={(e) =>
                                setOperation(section, "remarks", e.target.value)
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </section>
                </fieldset>
                <section className="trip-movement-documents">
                  <div className="trip-movement-section-title">
                    <div>
                      <small>TRIP DOCUMENTS</small>
                      <h3>LR, E-Way Bill & POD Documents</h3>
                    </div>
                    <span>Selected Trip</span>
                  </div>
                  <div className="trip-movement-document-grid">
                    <div className="trip-movement-document-card">
                      <div className="trip-movement-document-head">
                        <span className="trip-movement-document-icon">
                          <FileText size={16} />
                        </span>
                        <div>
                          <small>LORRY RECEIPT</small>
                          <h4>LR Details</h4>
                        </div>
                        <b className={form.lrNumber ? "uploaded" : ""}>
                          {form.lrNumber ? "Entered" : "Pending"}
                        </b>
                      </div>
                      <div className="trip-movement-document-fields">
                        <label>
                          <span>LR Number *</span>
                          <input
                            disabled={locked}
                            value={form.lrNumber}
                            onChange={(e) =>
                              setField("lrNumber", e.target.value)
                            }
                            placeholder="Enter LR number"
                          />
                        </label>
                        <label>
                          <span>LR Date</span>
                          <input
                            disabled={locked}
                            type="date"
                            value={form.lrDate}
                            onChange={(e) => setField("lrDate", e.target.value)}
                          />
                        </label>
                        <label>
                          <span>Remarks</span>
                          <input
                            disabled={locked}
                            value={form.lrRemarks}
                            onChange={(e) =>
                              setField("lrRemarks", e.target.value)
                            }
                            placeholder="Enter remarks"
                          />
                        </label>
                      </div>
                      {documentUpload("lr", "lrFile", "LR")}
                    </div>
                    <div className="trip-movement-document-card">
                      <div className="trip-movement-document-head">
                        <span className="trip-movement-document-icon">
                          <FileText size={16} />
                        </span>
                        <div>
                          <small>E-WAY BILL</small>
                          <h4>E-Way Bill Details</h4>
                        </div>
                        <b
                          className={`eway-status-${getEwayBillStatus(form.ewayBillNumber, form.ewayBillValidUpto, cjtoday()).toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {getEwayBillHeading(
                            form.ewayBillNumber,
                            form.ewayBillValidUpto,
                            cjtoday(),
                          )}
                        </b>
                      </div>
                      <div className="trip-movement-document-fields">
                        <label>
                          <span>E-Way Bill Number</span>
                          <input
                            disabled={locked}
                            value={form.ewayBillNumber}
                            onChange={(e) =>
                              setField("ewayBillNumber", e.target.value)
                            }
                            placeholder="Enter E-Way Bill number"
                          />
                        </label>
                        <label>
                          <span>Valid Upto</span>
                          <input
                            disabled={locked}
                            type="date"
                            value={form.ewayBillValidUpto}
                            onChange={(e) =>
                              setField("ewayBillValidUpto", e.target.value)
                            }
                          />
                        </label>
                        <label>
                          <span>Status</span>
                          <input
                            disabled={locked}
                            value={getEwayBillStatus(
                              form.ewayBillNumber,
                              form.ewayBillValidUpto,
                              cjtoday(),
                            )}
                            readOnly
                            aria-label="Automatically calculated E-Way Bill status"
                          />
                        </label>
                      </div>
                      {documentUpload("ewayBill", "ewayBillFile", "E-WAY BILL")}
                    </div>
                    <div className="trip-movement-document-card trip-pod-full-row">
                      <div className="trip-movement-document-head">
                        <span className="trip-movement-document-icon">
                          <FileText size={16} />
                        </span>
                        <div>
                          <small>PROOF OF DELIVERY</small>
                          <h4>POD Document</h4>
                        </div>
                        <b
                          className={
                            current?.pod?.fileName || form.podFile
                              ? "uploaded"
                              : ""
                          }
                        >
                          {current?.pod?.fileName || form.podFile
                            ? "Uploaded"
                            : "Pending"}
                        </b>
                      </div>
                      <div className="trip-pod-upload-row">
                        <div className="trip-pod-file-info">
                          <span className="trip-pod-file-icon">
                            <FileText size={16} />
                          </span>
                          <div>
                            <small>POD FILE</small>
                            <strong
                              title={
                                form.podFile?.name ||
                                current?.pod?.fileName ||
                                ""
                              }
                            >
                              {form.podFile?.name ||
                                current?.pod?.fileName ||
                                "No POD file selected"}
                            </strong>
                          </div>
                        </div>
                        <div className="trip-pod-actions">
                          <label
                            className={`trip-document-upload-button ${!unloadingCompleted ? "disabled" : ""}`}
                            title={
                              !unloadingCompleted
                                ? "Complete unloading before uploading POD"
                                : ""
                            }
                          >
                            <Upload size={13} />
                            {current?.pod?.fileName ? "Replace" : "Choose File"}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              disabled={locked || !unloadingCompleted}
                              onChange={(e) =>
                                setField("podFile", e.target.files?.[0] || null)
                              }
                            />
                          </label>
                          {current?.pod?.fileName && (
                            <button
                              type="button"
                              className="trip-document-view-button"
                              onClick={() => viewPod()}
                            >
                              <Eye size={13} />
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="trip-movement-section cj-total-history" aria-label="Full vehicle movement history">
                  <div className="trip-movement-section-head"><div><small>ALL TRIPS · SAVED UPDATES</small><h3>Total Movement History</h3></div><span>{totalHistory.length} updates · {journeys.length} trips</span></div>
                  <div style={{ overflowX: "auto", maxHeight: "380px" }}><table style={{ width: "100%", minWidth: "1100px", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}><thead><tr>{["Trip", "Date", "From", "To", "Location", "Start KM", "Today KM", "Running KM", "Status", "Updated by", "Saved at", "Remarks"].map(label => <th key={label} scope="col" style={{ padding: "11px 12px", background: "#edf6f8", color: "#42677b", position: "sticky", top: 0 }}>{label}</th>)}</tr></thead><tbody>
                    {totalHistory.map(entry => <tr key={entry.rowKey}>{[
                      `Trip ${entry.tripNumber}`, entry.date, entry.origin, entry.destination, entry.currentLocation, entry.startKm, entry.endKm,
                      entry.endKm != null && entry.startKm != null ? Number(entry.endKm) - Number(entry.startKm) : null,
                      entry.status, entry.updatedBy, cjformatTime(entry.savedAt || entry.updatedAt), entry.remarks,
                    ].map((value, index) => <td key={index} style={{ padding: "10px 12px", borderBottom: "1px solid #e5edf2", color: "#254b5e" }}>{cjdisplay(value)}</td>)}</tr>)}
                    {!totalHistory.length && <tr><td colSpan={12} style={{ padding: "24px", textAlign: "center" }}>No saved movement history yet.</td></tr>}
                  </tbody></table></div>
                </section>
              </>
            )}
          </div>
          <footer className="trip-movement-footer">
            <div className="trip-movement-footer-message" />
            <div className="trip-movement-footer-actions">
              <button
                type="button"
                className="trip-movement-cancel"
                disabled={saving}
                onClick={back}
              >
                Close
              </button>
              <button
                type="submit"
                className="trip-movement-save"
                disabled={locked || loading || !vehicle}
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Movement"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
};

export { CraneJourneyPopup };
export default CraneVehicles;
