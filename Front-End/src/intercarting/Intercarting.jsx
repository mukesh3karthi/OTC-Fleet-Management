import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Calendar, Car, ClipboardList, Truck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./intercarting.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const VEHICLES_URL = `${API_BASE_URL}/api/vehicles`;

const pages = [
  {
    icon: Car,
    title: "Vehicle Details",
    description: "Vehicle registration, documents and current status.",
    label: "Vehicle Details",
    path: "/intercartingdash/intercarting/vehicle-details",
  },
  {
    icon: ClipboardList,
    title: "Daily Logs",
    description: "Daily distance, diesel, attendance and driver records.",
    label: "Review Logs",
    path: "/intercartingdash/intercarting/daily-logs",
  },
  {
    icon: Calendar,
    title: "Monthly Logs",
    description: "Monthly vehicle utilization and operational reports.",
    label: "View Reports",
    path: "/intercartingdash/intercarting/monthly-logs",
  },
  {
    icon: Truck,
    title: "Intercarting Orders",
    description: "Customer orders and intercarting movement progress.",
    label: "View Orders",
    path: "/intercartingdash/intercarting/intercarting-orders",
  },
];

const localDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const readKm = (logs, dateKey) => {
  if (!logs || typeof logs !== "object") return 0;
  const number = Number(logs[dateKey] ?? 0);
  return Number.isFinite(number) ? number : 0;
};

export default function Intercarting() {
  const navigate = useNavigate();
  const [range, setRange] = useState("Week");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("token");
    axios
      .get(VEHICLES_URL, {
        signal: controller.signal,
        timeout: 20000,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then(({ data }) => {
        const records = Array.isArray(data)
          ? data
          : data?.vehicles || data?.data || [];
        setVehicles(Array.isArray(records) ? records : []);
        setError("");
      })
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          setError(
            requestError.response?.data?.message ||
              "Unable to load fleet data.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const chartData = useMemo(() => {
    const today = new Date();
    if (range === "Week") {
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - (6 - index),
        );
        const key = localDate(date);
        return {
          name: date.toLocaleDateString("en-IN", { weekday: "short" }),
          km: vehicles.reduce(
            (sum, vehicle) => sum + readKm(vehicle.dailyKmLogs, key),
            0,
          ),
        };
      });
    }
    return Array.from({ length: 4 }, (_, index) => {
      const end = index === 3 ? today.getDate() : (index + 1) * 7;
      const start = index * 7 + 1;
      const month = today.getMonth();
      const year = today.getFullYear();
      let km = 0;
      for (let day = start; day <= Math.min(end, today.getDate()); day += 1) {
        const key = localDate(new Date(year, month, day));
        km += vehicles.reduce(
          (sum, vehicle) => sum + readKm(vehicle.dailyKmLogs, key),
          0,
        );
      }
      return { name: `Week ${index + 1}`, km };
    });
  }, [range, vehicles]);

  return (
    <main className="fleet-page">
      <header className="fleet-header">
        <span className="fleet-title-line" aria-hidden="true" />
        <div className="fleet-heading-content">
          <h1>Intercarting Vehicle Overview</h1>
          <p>
            Manage vehicle registrations, daily logs, monthly reports and
            customer movements.
          </p>
        </div>
      </header>

      <section className="fleet-card-grid" aria-label="Intercarting pages">
        {pages.map(({ icon: Icon, ...page }) => (
          <article className="fleet-feature-card" key={page.path}>
            <div className="fleet-icon-box">
              <Icon size={23} aria-hidden="true" />
            </div>
            <h2>{page.title}</h2>
            <p>{page.description}</p>
            <button
              type="button"
              className="fleet-card-link"
              onClick={() => navigate(page.path)}
            >
              {page.label}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </article>
        ))}
      </section>

      <section
        className="fleet-chart-card"
        aria-label="Recorded vehicle distance"
      >
        <div className="fleet-chart-top">
          <div>
            <h2>Fleet Distance Trends</h2>
            <p>
              Recorded distance in kilometers ·{" "}
              {range === "Week" ? "Last 7 days" : "Current month"}
            </p>
          </div>
          <div className="fleet-range-toggle" aria-label="Chart date range">
            {["Week", "Month"].map((option) => (
              <button
                type="button"
                key={option}
                className={`fleet-range-button ${range === option ? "active" : ""}`}
                onClick={() => setRange(option)}
                aria-pressed={range === option}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p className="fleet-error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="fleet-loading">Loading vehicle activity…</p>
        ) : (
          <div className="fleet-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 14, right: 12, bottom: 5, left: 0 }}
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
                  tick={{ fill: "#667085", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tick={{ fill: "#667085", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString("en-IN")} km`,
                    "Distance",
                  ]}
                />
                <Bar
                  dataKey="km"
                  fill="#1683a6"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={74}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="fleet-chart-note">
          Based on saved Daily Logs records. Blank days are counted as zero.
        </p>
      </section>
    </main>
  );
}
