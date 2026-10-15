import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Search, Truck } from "lucide-react";
import "../Intercartingcss/intercartingorder.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const PAGE_SIZE = 10;
const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
export const isIntercartingOrder = (order) =>
  normalize(order?.movementType).replace(/[\s-]+/g, "") === "intercarting";
export const isOrderPlaced = (order) => {
  const placedStatus = normalize(order?.orderPlaced?.status);
  const currentStage = normalize(order?.stage);
  return (
    placedStatus === "completed" ||
    currentStage === "tracking" ||
    currentStage === "trip complete"
  );
};
export const totalVehicles = (order) => {
  const requirements = Array.isArray(order?.vehicleRequirements)
    ? order.vehicleRequirements
    : [];
  if (requirements.length)
    return requirements.reduce((sum, row) => {
      const quantity = Number(
        row?.quantity ?? row?.vehicleQuantity ?? row?.requiredQuantity ?? 0,
      );
      return (
        sum +
        (Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0)
      );
    }, 0);
  const stored = Number(order?.totalVehicles);
  return Number.isFinite(stored) && stored > 0 ? Math.floor(stored) : 0;
};
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};
const kamName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(
      /(^|[\s._-])(\p{L})/gu,
      (_, space, letter) => space + letter.toUpperCase(),
    ) || "—";
const getRows = (payload) => {
  for (const candidate of [
    payload,
    payload?.data,
    payload?.orders,
    payload?.trips,
    payload?.data?.orders,
    payload?.data?.trips,
  ]) {
    if (Array.isArray(candidate)) return candidate;
  }
  throw new Error("The orders API returned an unexpected response.");
};
const statusClass = (value) => {
  const text = normalize(value);
  if (["approved", "completed", "active"].includes(text)) return "success";
  if (["rejected", "cancelled", "canceled"].includes(text)) return "danger";
  return "pending";
};

// Pass authToken from your existing Intercarting authentication state if needed.
// The default uses the main login token, without borrowing another module's identity.
export default function Intercartingorder({ authToken }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      setOrders([]);
      try {
        const token =
          authToken ??
          sessionStorage.getItem("token") ??
          localStorage.getItem("token");
        if (!token?.trim())
          throw new Error("Please sign in to view Intercarting orders.");
        const response = await fetch(`${API_BASE_URL}/api/triporders`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          if (response.status === 401)
            throw new Error("Your session has expired. Please sign in again.");
          if (response.status === 403)
            throw new Error(
              "Your account does not have access to trip orders. Ask your administrator to enable Intercarting order access.",
            );
          throw new Error(
            payload?.message || `Unable to load orders (${response.status}).`,
          );
        }
        const rows = getRows(payload).filter(
          (order) => isIntercartingOrder(order) && isOrderPlaced(order),
        );
        if (active) {
          setOrders(rows);
          setPage(1);
        }
      } catch (err) {
        if (active && err.name !== "AbortError")
          setError(err.message || "Unable to load orders.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [authToken, refresh]);

  const stages = useMemo(
    () =>
      [...new Set(orders.map((order) => order.stage).filter(Boolean))].sort(),
    [orders],
  );
  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const text = [
          order.tripId,
          order.customer,
          order.contactPerson,
          order.siteLocation,
          order.assignedKam,
          order.stage,
          order.status,
          order.orderApproval?.status,
        ]
          .join(" ")
          .toLowerCase();
        return (
          (!stage || order.stage === stage) &&
          text.includes(search.trim().toLowerCase())
        );
      }),
    [orders, search, stage],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  return (
    <main className="ico-page">
      <header className="ico-header">
        <button
          className="ico-back"
          type="button"
          aria-label="Back to Intercarting dashboard"
          onClick={() => navigate("/intercartingdash/intercarting")}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p>INTERCARTING</p>
          <h1>Intercarting Orders</h1>
          <span>Placed orders, site details and vehicle requirements.</span>
        </div>
        <button
          className="ico-refresh"
          type="button"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
        >
          <RefreshCw size={16} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </header>
      <section
        className="ico-list"
        aria-label="Intercarting orders"
        aria-busy={loading}
      >
        <div className="ico-toolbar">
          <h2>
            <Truck size={19} />
            Order List
          </h2>
          <label className="ico-search">
            <Search size={17} />
            <input
              aria-label="Search Intercarting orders"
              placeholder="Search order, customer, site, KAM…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="Filter orders by stage"
            value={stage}
            onChange={(event) => {
              setStage(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All Stages</option>
            {stages.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <span className="ico-count">
            {filtered.length} of {orders.length} orders
          </span>
        </div>
        {error ? (
          <div className="ico-message ico-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRefresh((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="ico-message" role="status">
            Loading Intercarting orders…
          </div>
        ) : (
          <>
            <div className="ico-table-wrap">
              <table className="ico-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>SITE LOCATION</th>
                    <th>VEHICLES</th>
                    <th>PLACEMENT DATE</th>
                    <th>STAGE</th>
                    <th>ORDER STATUS</th>
                    <th>ASSIGNED KAM</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length ? (
                    visible.map((order, index) => {
                      const status =
                        order.orderApproval?.status ||
                        order.status ||
                        "Pending";
                      return (
                        <tr key={String(order._id || order.tripId || index)}>
                          <td>
                            <span className="ico-id">
                              {order.tripId || "—"}
                            </span>
                          </td>
                          <td>
                            <strong>{order.customer || "—"}</strong>
                            {order.contactPerson && (
                              <small>{order.contactPerson}</small>
                            )}
                          </td>
                          <td>{order.siteLocation || "—"}</td>
                          <td>
                            <strong>{totalVehicles(order)} NOS</strong>
                          </td>
                          <td>{formatDate(order.placementDate)}</td>
                          <td>
                            <span className="ico-stage">
                              {order.stage || "Enquiry Details"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`ico-status ${statusClass(status)}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td>{kamName(order.assignedKam)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="ico-empty">
                        {orders.length
                          ? "No orders match your search or stage filter."
                          : "No placed Intercarting orders available."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="ico-pagination">
              <span>
                {filtered.length
                  ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`
                  : "0 orders"}
              </span>
              <div>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span>
                  {currentPage} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}
