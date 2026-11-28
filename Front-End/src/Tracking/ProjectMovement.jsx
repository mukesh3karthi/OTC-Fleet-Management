import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Truck,
  ChevronDown,
  Filter,
} from "lucide-react";
import "./projectmovement.css";
const API =
  (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "") + "/api/triporders";
const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => String(v?.$oid ?? v ?? "");
const materialOf = (order, vehicle) => {
  const requirement = arr(order.vehicleRequirements).find(
    (r) =>
      vehicle.requirementId &&
      str(r.requirementId || r._id) === str(vehicle.requirementId),
  );
  return (
    str(vehicle.materialType || requirement?.materialType || "").trim() ||
    "Not specified"
  );
};
// Resolve the vehicle's own linked requirement and approved quotation.
const linkedRecord = (records, id, field) => {
  const key = str(id).trim();
  return key ? arr(records).find((record) =>
    [record[field], record._id].some((value) => str(value).trim() === key)
  ) : undefined;
};
const firstText = (...values) => values.map((value) =>
  typeof value === "string" ? value.trim() : ""
).find((value) => value && value !== "—" && value !== "-") || "—";
const vehicleDetailsOf = (order, vehicle) => {
  const confirmation = linkedRecord(order.vehicleConfirmations, vehicle.confirmationId, "confirmationId");
  const requirement = linkedRecord(order.vehicleRequirements, vehicle.requirementId || confirmation?.requirementId, "requirementId");
  const quotation = linkedRecord(order.trafficQuotations, vehicle.quotationId || confirmation?.quotationId, "quotationId");
  return {
    vehicleType: firstText(vehicle.vehicleType, vehicle.type, requirement?.vehicleType, quotation?.vehicleType),
    transporter: firstText(quotation?.transporter, vehicle.transporter, vehicle.lsp),
  };
};
const materialKey = (value) => value.trim().toLowerCase();
function groupsFor(order) {
  const requests = arr(order.projectVehicleAllocationRequests);
  const groups = new Map();
  const batch = (r) => str(r.batchId || r.requestBatchId);
  [...requests]
    .sort(
      (a, b) =>
        (Date.parse(a.requestedAt) || 0) - (Date.parse(b.requestedAt) || 0),
    )
    .forEach((r) => {
      const key = batch(r);
      if (key && !groups.has(key))
        groups.set(key, {
          key,
          label: `Batch ${String(groups.size + 1).padStart(2, "0")}`,
          vehicles: [],
        });
    });
  arr(order.allocatedVehicles)
    .filter((v) => str(v.vehicleStatus).trim().toLowerCase() !== "replaced")
    .forEach((v) => {
      const exact = requests.filter(
        (r) =>
          v.confirmationId && str(r.confirmationId) === str(v.confirmationId),
      );
      const matches = exact.length
        ? exact
        : requests.filter(
            (r) =>
              v.requirementId && str(r.requirementId) === str(v.requirementId),
          );
      const keys = new Set(matches.map(batch).filter(Boolean));
      const key = keys.size === 1 ? [...keys][0] : "unassigned";
      if (!groups.has(key))
        groups.set(key, {
          key,
          label: "Unassigned / legacy vehicles",
          vehicles: [],
        });
      groups.get(key).vehicles.push(v);
    });
  return [...groups.values()];
}
export default function ProjectMovement() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [material, setMaterial] = useState("");
  useEffect(() => setMaterial(""), [id]);
  useEffect(() => {
    const controller = new AbortController();
    setOrder(null);
    setError("");
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Please sign in again.");
        const response = await fetch(
          `${API}/${/^[a-f0-9]{24}$/i.test(id) ? "" : "trip/"}${encodeURIComponent(id)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Unable to load project.");
        const value =
          data?.data?.trip ||
          data?.data?.order ||
          data?.data ||
          data?.trip ||
          data?.order ||
          data;
        if (!value || (!value._id && !value.tripId))
          throw new Error("Invalid project response.");
        if (!controller.signal.aborted) setOrder(value);
      } catch (e) {
        if (!controller.signal.aborted) setError(e.message);
      }
    })();
    return () => controller.abort();
  }, [id, retry]);
  const groups = order ? groupsFor(order) : [];
  const materials = [
    ...new Map(
      groups
        .flatMap((g) => g.vehicles)
        .map((v) => {
          const label = materialOf(order, v);
          return [materialKey(label), label];
        }),
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1]));
  const visibleGroups = material
    ? groups
        .map((g) => ({
          ...g,
          vehicles: g.vehicles.filter(
            (v) => materialKey(materialOf(order, v)) === material,
          ),
        }))
        .filter((g) => g.vehicles.length)
    : groups;
  const visibleCount = visibleGroups.reduce((n, g) => n + g.vehicles.length, 0);
  return (
    <main className="pm-page">
      <header className="pm-header">
        <div className="pm-header-left">
          <Link className="pm-back-button" to="/tracking">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="pm-header-title">
            <h1>Project Movement</h1>
            <p>
              {order
                ? `${order.tripId || id} · ${order.customer || "—"}`
                : "Batch-wise vehicle overview"}
            </p>
          </div>
        </div>
        {order && (
          <section className="pm-summary">
            <div>
              Order ID<strong>{order.tripId || id}</strong>
            </div>
            <div>
              Customer<strong>{order.customer || "—"}</strong>
            </div>
            <div>
              Allocated vehicles
              <strong>
                {groups.reduce((n, g) => n + g.vehicles.length, 0)}
              </strong>
            </div>
          </section>
        )}
      </header>
      {error ? (
        <section className="pm-panel" role="alert">
          {error}{" "}
          <button className="pm-button" onClick={() => setRetry((n) => n + 1)}>
            Retry
          </button>
        </section>
      ) : !order ? (
        <section className="pm-panel" role="status">
          Loading project details…
        </section>
      ) : (
        <>
          <section className="pm-filter">
            <div className="pm-filter-field">
              <label htmlFor="pm-material">
                <Filter size={15} /> Material Type
              </label>
              <select
                id="pm-material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              >
                <option value="">All Materials</option>
                {materials.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {material && (
              <button
                type="button"
                className="pm-button"
                onClick={() => setMaterial("")}
              >
                Clear Filter
              </button>
            )}
            <span className="pm-filter-count">
              Showing {visibleCount} of{" "}
              {groups.reduce((n, g) => n + g.vehicles.length, 0)} allocated
              vehicles
            </span>
          </section>
          {material && !visibleCount && (
            <section className="pm-panel">
              No vehicles match the selected material.
            </section>
          )}
          {!groups.length && (
            <section className="pm-panel">No vehicles allocated yet.</section>
          )}
          {visibleGroups.map((g) => (
            <details className="pm-batch" key={`${id}-${g.key}`} open>
              <summary>
                <ChevronDown size={16} />
                {g.label}
                <span>{g.vehicles.length} allocated vehicles</span>
              </summary>
              <div className="pm-scroll">
                <table>
                  <thead>
                    <tr>
                      {[
                        "#",
                        "Vehicle Number",
                        "Vehicle Type",
                        "Material Type",
                        "Transporter",
                        "Driver",
                        "Status",
                        "Action",
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.vehicles.map((v, i) => {
                      const details = vehicleDetailsOf(order, v);
                      const allocationId = str(
                        v.allocationId || v._id || v.id || v.vehicleNumber,
                      );
                      return (
                        <tr key={allocationId || i}>
                          <td>{i + 1}</td>
                          <td>{v.vehicleNumber || v.vehicleNo || "—"}</td>
                          <td>{details.vehicleType}</td>
                          <td>{materialOf(order, v)}</td>
                          <td>{details.transporter}</td>
                          <td>{v.driver?.name || "—"}</td>
                          <td>
                            {arr(v.dailyTracking).at(-1)?.status ||
                              v.status ||
                              "Idle"}
                          </td>
                          <td>
                            {allocationId ? (
                              <Link
                                className="pm-button"
                                to={`/vehicle-details/${encodeURIComponent(id)}?allocationId=${encodeURIComponent(allocationId)}`}
                                state={{
                                  allocationId,
                                  returnTo: `/project-movement/${encodeURIComponent(id)}`,
                                }}
                              >
                                <Truck size={14} /> View Details{" "}
                                <ArrowUpRight size={13} />
                              </Link>
                            ) : (
                              "Unavailable"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!g.vehicles.length && (
                      <tr>
                        <td colSpan={8}>
                          No allocated vehicles in this batch.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </>
      )}
    </main>
  );
}
