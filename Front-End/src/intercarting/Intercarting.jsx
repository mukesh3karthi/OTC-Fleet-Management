import React, {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  Calendar,
  Car,
  ClipboardList,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "../Intercartingcss/intercarting.css";

const weeklyChartData = [
  { name: "Mon", value: 180 },
  { name: "Tue", value: 280 },
  { name: "Wed", value: 360 },
  { name: "Thu", value: 240 },
  { name: "Fri", value: 390 },
  { name: "Sat", value: 300 },
  { name: "Sun", value: 160 },
];

const monthlyChartData = [
  { name: "Week 1", value: 780 },
  { name: "Week 2", value: 950 },
  { name: "Week 3", value: 1120 },
  { name: "Week 4", value: 890 },
];

const cards = [
  {
    icon: Car,
    title: "Vehicle Details",
    description:
      "View individual asset metrics, maintenance history, and health status.",
    linkText: "Vehicle Details",
    path:
      "/intercartingdash/intercarting/vehicle-details",
  },
  {
    icon: ClipboardList,
    title: "Daily Logs",
    description:
      "Access operational activity records and driver shift performance logs.",
    linkText: "Review Logs",
    path:
      "/intercartingdash/intercarting/daily-logs",
  },
  {
    icon: Calendar,
    title: "Monthly Logs",
    description:
      "Generate comprehensive monthly trends and fiscal efficiency reports.",
    linkText: "View Reports",
    path:
      "/intercartingdash/intercarting/monthly-logs",
  },
];

const stats = [
  {
    title: "TOTAL FLEET",
    value: "124",
    unit: "units",
  },
  {
    title: "ACTIVE NOW",
    value: "98",
    unit: "79%",
  },
  {
    title: "FUEL EFFICIENCY",
    value: "12.4",
    unit: "km/L",
  },
  {
    title: "INCIDENTS",
    value: "0",
    unit: "Today",
    danger: true,
  },
];

const Intercarting = () => {
  const [range, setRange] =
    useState("Month");

  const navigate = useNavigate();

  const chartData = useMemo(() => {
    return range === "Week"
      ? weeklyChartData
      : monthlyChartData;
  }, [range]);

  const highlightIndex =
    chartData.length >= 3 ? 2 : 0;

  const handleCardNavigation = (
    path
  ) => {
    navigate(path);
  };

  const handleCardKeyDown = (
    event,
    path
  ) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      navigate(path);
    }
  };

  return (
    <main className="fleet-page">
      <header className="fleet-header">
        <span
          className="fleet-title-line"
          aria-hidden="true"
        />

        <div className="fleet-heading-content">
          <h1>
            Fleet Performance Overview
          </h1>

          <p>
            Monitor real-time operational
            efficiency and logistics
            telemetry across your regional
            fleet assets.
          </p>
        </div>
      </header>

      <section
        className="fleet-card-grid"
        aria-label="Fleet management pages"
      >
        {cards.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.path}
              className="fleet-feature-card"
              role="link"
              tabIndex={0}
              aria-label={`Open ${item.title}`}
              onClick={() =>
                handleCardNavigation(
                  item.path
                )
              }
              onKeyDown={(event) =>
                handleCardKeyDown(
                  event,
                  item.path
                )
              }
            >
              <div className="fleet-icon-box">
                <Icon
                  size={28}
                  aria-hidden="true"
                />
              </div>

              <h2>{item.title}</h2>

              <p>{item.description}</p>

              <button
                type="button"
                className="fleet-card-link"
                onClick={(event) => {
                  event.stopPropagation();

                  handleCardNavigation(
                    item.path
                  );
                }}
                aria-label={`Open ${item.title}`}
              >
                <span>
                  {item.linkText}
                </span>

                <ArrowRight
                  size={16}
                  aria-hidden="true"
                />
              </button>
            </article>
          );
        })}
      </section>

      <section className="fleet-chart-card">
        <div className="fleet-chart-top">
          <div>
            <h2>
              Fleet Activity Trends
            </h2>

            <p>
              REGIONAL OPERATIONAL OUTPUT
              {" • "}
              {range === "Week"
                ? "LAST 7 DAYS"
                : "LAST 30 DAYS"}
            </p>
          </div>

          <div
            className="fleet-range-toggle"
            aria-label="Chart date range"
          >
            <button
              type="button"
              className={`fleet-range-button ${
                range === "Week"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setRange("Week")
              }
              aria-pressed={
                range === "Week"
              }
            >
              Week
            </button>

            <button
              type="button"
              className={`fleet-range-button ${
                range === "Month"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setRange("Month")
              }
              aria-pressed={
                range === "Month"
              }
            >
              Month
            </button>
          </div>
        </div>

        <div className="fleet-chart-container">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={chartData}
              margin={{
                top: 16,
                right: 12,
                bottom: 8,
                left: 0,
              }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="4 4"
                stroke="#e5eaf1"
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#667085",
                  fontSize: 12,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                width={42}
                tick={{
                  fill: "#667085",
                  fontSize: 12,
                }}
              />

              <Tooltip
                cursor={{
                  fill:
                    "rgba(18, 62, 145, 0.05)",
                }}
                contentStyle={{
                  border:
                    "1px solid #dbe2ea",
                  borderRadius: "8px",
                  boxShadow:
                    "0 8px 20px rgba(15, 23, 42, 0.1)",
                }}
              />

              <Bar
                dataKey="value"
                name="Operations"
                radius={[5, 5, 0, 0]}
                maxBarSize={70}
              >
                {chartData.map(
                  (entry, index) => (
                    <Cell
                      key={`${entry.name}-${entry.value}`}
                      fill={
                        index ===
                        highlightIndex
                          ? "#123e91"
                          : "#c8dbf7"
                      }
                    />
                  )
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <footer className="fleet-chart-footer">
          <div className="fleet-legend">
            <span
              className="fleet-legend-dot fleet-legend-active"
              aria-hidden="true"
            />

            <span>
              Active Operations
            </span>
          </div>

          <div className="fleet-legend">
            <span
              className="fleet-legend-dot fleet-legend-idle"
              aria-hidden="true"
            />

            <span>
              Scheduled Idle
            </span>
          </div>
        </footer>
      </section>

      <section
        className="fleet-stats-grid"
        aria-label="Fleet statistics"
      >
        {stats.map((item) => (
          <article
            className="fleet-stat-card"
            key={item.title}
          >
            <p>{item.title}</p>

            <h2
              className={
                item.danger
                  ? "fleet-stat-danger"
                  : ""
              }
            >
              {item.value}

              <span>{item.unit}</span>
            </h2>
          </article>
        ))}
      </section>
    </main>
  );
};

export default Intercarting;
