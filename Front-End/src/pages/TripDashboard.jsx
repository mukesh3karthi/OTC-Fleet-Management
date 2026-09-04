import React, { useMemo, useState } from "react";
import "../pagescss/tripdashboard.css";

const INITIAL_ORDERS = [
  {
    id: "CO-3301",
    client: "Ultratech Cement",
    cargo: "Cement Bags (Grade 53)",
    weight: "28 Tons",
    origin: "Peenya Industrial Area",
    destination: "Hebbal Yard",
    stage: "Vendor Finalization",
    role: "Vendor Management / Procurement Team",
    vendor: "ABC Logistics",
    vehicle: "KA 01 AB 2345",
  },
  {
    id: "CO-3302",
    client: "Larsen & Toubro",
    cargo: "Heavy Machinery Turbine Housing",
    weight: "36 Tons",
    origin: "Whitefield Complex",
    destination: "Thermal Power Site",
    stage: "Vendor Finalization",
    role: "Vendor Management / Procurement Team",
    vendor: "Prime Transport",
    vehicle: "KA 05 CD 6721",
  },
  {
    id: "CO-3303",
    client: "JSW Steel",
    cargo: "Steel Coils",
    weight: "32 Tons",
    origin: "Hosur Industrial Area",
    destination: "Tumkur Plant",
    stage: "Vehicle Assigned",
    role: "Fleet Operations Team",
    vendor: "South India Movers",
    vehicle: "KA 51 EF 4455",
  },
  {
    id: "CO-3304",
    client: "ACC Limited",
    cargo: "Bulk Cement",
    weight: "30 Tons",
    origin: "Bidadi Plant",
    destination: "Bangalore Yard",
    stage: "Trip Started",
    role: "Transport Operations Team",
    vendor: "Karnataka Logistics",
    vehicle: "KA 02 GH 7788",
  },
  {
    id: "CO-3305",
    client: "Tata Projects",
    cargo: "Structural Steel",
    weight: "24 Tons",
    origin: "Electronic City",
    destination: "Mysore Road Site",
    stage: "Delivery In Progress",
    role: "Control Tower / Tracking Team",
    vendor: "FastTrack Movers",
    vehicle: "KA 03 JK 1122",
  },
  {
    id: "CO-3306",
    client: "Adani Power",
    cargo: "Power Equipment",
    weight: "42 Tons",
    origin: "Bangalore Warehouse",
    destination: "Bellary Power Site",
    stage: "Documentation",
    role: "Documentation Team",
    vendor: "National Carriers",
    vehicle: "KA 04 LM 9087",
  },
];

const MONTHLY_DATA = [
  { month: "MAR", enquiries: 14, orders: 11 },
  { month: "APR", enquiries: 16, orders: 13 },
  { month: "MAY", enquiries: 19, orders: 16 },
  { month: "JUN", enquiries: 17, orders: 14 },
  { month: "JUL", enquiries: 22, orders: 19 },
  { month: "AUG", enquiries: 24, orders: 21 },
];

const STAGES = [
  "All Stages",
  "Vendor Finalization",
  "Vehicle Assigned",
  "Trip Started",
  "Delivery In Progress",
  "Documentation",
];

const MOVEMENT_SUMMARY = [
  { label: "Completed Trips", value: "128", tone: "default" },
  { label: "Issue-Free Trips", value: "121", tone: "success" },
  { label: "Minor Halts", value: "5", tone: "warning" },
  { label: "Breakdowns", value: "2", tone: "danger" },
];

const TripDashboard = () => {
  const [orders] = useState(INITIAL_ORDERS);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All Stages");

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const searchableText = [
        order.id,
        order.client,
        order.cargo,
        order.weight,
        order.origin,
        order.destination,
        order.stage,
        order.role,
        order.vendor,
        order.vehicle,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);
      const matchesStage =
        stageFilter === "All Stages" || order.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [orders, search, stageFilter]);

  return (
    <div className="trip-dashboard">
      <section className="trip-kpi-grid" aria-label="Trip summary">
        <article className="trip-kpi-card">
          <div className="trip-kpi-icon blue" aria-hidden="true">▤</div>
          <div className="trip-kpi-content">
            <div className="trip-kpi-title">Total Enquiries</div>
            <div className="trip-kpi-value">28</div>
          </div>
        </article>

        <article className="trip-kpi-card">
          <div className="trip-kpi-icon orange" aria-hidden="true">◴</div>
          <div className="trip-kpi-content">
            <div className="trip-kpi-title">Pending Enquiries</div>
            <div className="trip-kpi-value">3</div>
          </div>
        </article>

        <article className="trip-kpi-card">
          <div className="trip-kpi-icon purple" aria-hidden="true">▤</div>
          <div className="trip-kpi-content">
            <div className="trip-kpi-title">PO Status</div>
            <div className="trip-po-value">
              <strong>19</strong>
              <span>/</span>
              <b>3 Pnd</b>
            </div>
          </div>
        </article>

        <article className="trip-kpi-card">
          <div className="trip-kpi-icon green" aria-hidden="true">🏆</div>
          <div className="trip-kpi-content">
            <div className="trip-kpi-title">Orders Achieved (KAM)</div>
            <div className="trip-kpi-value small-value">₹52.8 Lakhs</div>
          </div>
        </article>
      </section>

      <section className="trip-analytics-grid">
        <article className="trip-panel monthly-panel">
          <div className="trip-panel-header">
            <h2>Month-Wise Order Volume &amp; Enquiries</h2>
            <span className="trip-date-badge">Jan – Aug 2026</span>
          </div>

          <div className="monthly-chart">
            <div className="chart-bars">
              {MONTHLY_DATA.map((item) => (
                <div className="chart-column" key={item.month}>
                  <div className="bar-wrapper">
                    <div
                      className="chart-bar enquiry-bar"
                      style={{ height: `${item.enquiries * 6}px` }}
                      title={`Enquiries: ${item.enquiries}`}
                    />
                    <div
                      className="chart-bar order-bar"
                      style={{ height: `${item.orders * 6}px` }}
                      title={`Orders: ${item.orders}`}
                    />
                  </div>
                  <span className="chart-month">{item.month}</span>
                </div>
              ))}
            </div>

            <div className="chart-legend">
              <div>
                <span className="legend-box enquiry-color" />
                Total Enquiries Received
              </div>
              <div>
                <span className="legend-box order-color" />
                Confirmed Orders Executed
              </div>
            </div>
          </div>
        </article>

        <article className="trip-panel issue-panel">
          <div className="trip-panel-header issue-header">
            <h2>Movement Completed Without Any Issues</h2>
            <strong className="success-rate">94.8% Success</strong>
          </div>

          <div className="issue-content">
            <div className="donut-wrapper">
              <div className="donut-chart">
                <div className="donut-center">
                  <strong>94.8%</strong>
                  <span>ISSUE-FREE</span>
                </div>
              </div>
            </div>

            <div className="issue-right">
              <div className="issue-metrics">
                <div className="issue-metric">
                  <div className="metric-top">
                    <span>On-Time Zero-Damage</span>
                    <strong>94.8%</strong>
                  </div>
                  <div className="metric-line">
                    <span
                      className="metric-progress green-progress"
                      style={{ width: "94.8%" }}
                    />
                  </div>
                </div>

                <div className="issue-metric">
                  <div className="metric-top">
                    <span>Minor Yard Halting</span>
                    <strong>3.8%</strong>
                  </div>
                  <div className="metric-line">
                    <span
                      className="metric-progress orange-progress"
                      style={{ width: "3.8%" }}
                    />
                  </div>
                </div>

                <div className="issue-metric">
                  <div className="metric-top">
                    <span>Route Deviations / Breakdown</span>
                    <strong>1.4%</strong>
                  </div>
                  <div className="metric-line">
                    <span
                      className="metric-progress red-progress"
                      style={{ width: "1.4%" }}
                    />
                  </div>
                </div>
              </div>

              <div className="movement-summary">
                {MOVEMENT_SUMMARY.map((item) => (
                  <div className="movement-summary-item" key={item.label}>
                    <span className="movement-summary-label">{item.label}</span>
                    <strong
                      className={
                        item.tone === "default" ? "" : `summary-${item.tone}`
                      }
                    >
                      {item.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="trip-orders-panel">
        <div className="orders-header">
          <div>
            <h2>Running Order List</h2>
            <p>
              Live overview of active customer orders, routes, ownership and execution stages.
            </p>
          </div>
        </div>

        <div className="orders-toolbar">
          <div className="trip-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="text"
              placeholder="Search order, client, cargo, route..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
            className="stage-filter"
            aria-label="Filter by stage"
          >
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>

          <div className="order-count">{filteredOrders.length} Orders</div>
        </div>

        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>CLIENT NAME</th>
                <th>CARGO &amp; WEIGHT</th>
                <th>ROUTE (ORIGIN → DESTINATION)</th>
                <th>CURRENT STAGE</th>
                <th>ROLE RESPONSIBLE</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-orders">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr className="order-row" key={order.id}>
                    <td><span className="order-id">{order.id}</span></td>
                    <td><strong className="client-name">{order.client}</strong></td>
                    <td>
                      <div className="cargo-name">{order.cargo}</div>
                      <span className="weight">{order.weight}</span>
                    </td>
                    <td>
                      <div className="route">
                        {order.origin}
                        <span>→</span>
                        {order.destination}
                      </div>
                    </td>
                    <td>
                      <span className="stage-pill">
                        <span className="truck-icon" aria-hidden="true">▣</span>
                        {order.stage}
                      </span>
                    </td>
                    <td><strong className="role-text">{order.role}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default TripDashboard;
