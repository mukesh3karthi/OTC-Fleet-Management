import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Search, RefreshCw, Truck, Navigation } from "lucide-react";
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
        const requirement = items(trip?.vehicleRequirements).find(
          (r) => r.requirementId === vehicle.requirementId,
        );
        return {
          ...vehicle,
          displayType:
            vehicle.vehicleType || vehicle.type || requirement?.vehicleType,
          displayLsp: vehicle.lsp || "",
          displayCargo: vehicle.cargo || trip?.materialType,
          displayPo:
            vehicle.poNo ||
            trip?.poNo ||
            trip?.poNumber ||
            trip?.poDocument?.poNumber ||
            trip?.orderFinalization?.poNo ||
            trip?.orderFinalization?.poNumber,
        };
      }),
    [trip],
  );
  const visible = vehicles.filter((vehicle) =>
    [
      vehicle.vehicleNumber,
      vehicle.displayType,
      trip?.customer,
      vehicle.displayLsp,
      vehicle.displayCargo,
      vehicle.lr?.number,
      vehicle.ewayBill?.number,
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
            <h2>Allocated Vehicles</h2>
            <p>Select Movement to update a vehicle’s trip progress.</p>
          </div>
          <label className="crane-search">
            <Search size={16} />
            <input
              aria-label="Search Crane vehicles"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vehicle, LSP, cargo..."
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
                    "Vehicle No",
                    "Type",
                    "Customer",
                    "LSP",
                    "From",
                    "To",
                    "Cargo",
                    "PO No",
                    "LR No",
                    "E-Way",
                    "Weight",
                    "Dimensions (L × H × W)",
                    "Status",
                    "Action",
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
                        <td>
                          <strong>{text(trip?.customer)}</strong>
                        </td>
                        <td>{text(vehicle.displayLsp)}</td>
                        <td>{text(vehicle.origin || trip?.origin)}</td>
                        <td>
                          {text(vehicle.destination || trip?.destination)}
                        </td>
                        <td>{text(vehicle.displayCargo)}</td>
                        <td className="crane-mono">
                          {text(vehicle.displayPo)}
                        </td>
                        <td className="crane-mono">
                          {text(vehicle.lr?.number)}
                        </td>
                        <td className="crane-mono">
                          {text(vehicle.ewayBill?.number)}
                        </td>
                        <td>
                          {vehicle.weight == null || vehicle.weight === ""
                            ? "—"
                            : `${vehicle.weight} TON`}
                        </td>
                        <td>{dimensions(vehicle.dimensions)}</td>
                        <td>
                          <span
                            className={`crane-vehicle-status ${replaced ? "replaced" : "active"}`}
                          >
                            {text(vehicle.vehicleStatus || "Active")}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="crane-movement-btn"
                            disabled={!allocationId || replaced}
                            onClick={() =>
                              navigate(
                                `/crane-vehicles/${encodeURIComponent(trip._id || id)}/movement/${encodeURIComponent(allocationId)}`,
                                {
                                  state: { returnTo: location.state?.returnTo },
                                },
                              )
                            }
                          >
                            <Navigation size={13} />
                            Movement
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={14} className="crane-empty">
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
export default CraneVehicles;
