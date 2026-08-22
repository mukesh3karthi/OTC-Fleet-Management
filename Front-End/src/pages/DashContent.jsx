import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaServer,
  FaTruck,
  FaUsers,
  FaWarehouse,
} from "react-icons/fa";

import DashChart from "../Charts/DashChart";

// import "./pagecss/dashcontent.css";
import "../pagescss/dashcontent.css";


const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const dashboardCards = [
  {
    title: "Total Vehicles",
    value: "124",
    description: "Registered fleet vehicles",
    icon: FaTruck,
    className: "blue",
  },
  {
    title: "Active Vehicles",
    value: "98",
    description: "Currently operational",
    icon: FaCheckCircle,
    className: "green",
  },
  {
    title: "Total Drivers",
    value: "86",
    description: "Registered fleet drivers",
    icon: FaUsers,
    className: "purple",
  },
  {
    title: "Warehouses",
    value: "12",
    description: "Active warehouse locations",
    icon: FaWarehouse,
    className: "orange",
  },
];

const recentActivities = [
  {
    title: "Vehicle TN 38 AB 2456 added",
    time: "10 minutes ago",
  },
  {
    title: "Driver information updated",
    time: "35 minutes ago",
  },
  {
    title: "Vehicle document uploaded",
    time: "1 hour ago",
  },
  {
    title: "Maintenance record created",
    time: "2 hours ago",
  },
];

const DashContent = () => {
  const [
    serverMessage,
    setServerMessage,
  ] = useState("");

  const [
    serverError,
    setServerError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchServerStatus =
      async () => {
        try {
          setLoading(true);

          const response =
            await axios.get(
              API_BASE_URL,
              {
                timeout: 60000,
              }
            );

          if (!isMounted) {
            return;
          }

          const message =
            typeof response.data ===
            "string"
              ? response.data
              : response.data
                  ?.message;

          setServerMessage(
            message ||
              "Backend server connected."
          );

          setServerError("");
        } catch (error) {
          if (!isMounted) {
            return;
          }

          console.error(
            "Dashboard API error:",
            error.response?.data ||
              error.message
          );

          setServerMessage("");

          setServerError(
            error.response?.data
              ?.message ||
              "Unable to connect to the backend server."
          );
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

    fetchServerStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="premium-dashboard">
      <header className="premium-dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            Fleet Management
          </span>

          <h1>Dashboard Overview</h1>

          <p>
            Monitor fleet operations,
            vehicle activity and system
            performance.
          </p>
        </div>

        <div
          className={`server-status ${
            serverError
              ? "error"
              : "connected"
          }`}
        >
          <FaServer />

          <div>
            <span>Server Status</span>

            <strong>
              {loading
                ? "Checking..."
                : serverError
                  ? "Disconnected"
                  : "Connected"}
            </strong>
          </div>
        </div>
      </header>

      {serverMessage && (
        <div
          className="dashboard-message success"
          role="status"
        >
          <FaCheckCircle />

          <span>{serverMessage}</span>
        </div>
      )}

      {serverError && (
        <div
          className="dashboard-message error"
          role="alert"
        >
          <FaExclamationTriangle />

          <span>{serverError}</span>
        </div>
      )}

      <section className="dashboard-stat-grid">
        {dashboardCards.map(
          (card) => {
            const Icon = card.icon;

            return (
              <article
                className="dashboard-stat-card"
                key={card.title}
              >
                <div>
                  <p>{card.title}</p>

                  <h2>{card.value}</h2>

                  <span>
                    {card.description}
                  </span>
                </div>

                <div
                  className={`dashboard-stat-icon ${card.className}`}
                >
                  <Icon />
                </div>
              </article>
            );
          }
        )}
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-chart-card">
          <div className="dashboard-card-header">
            <div>
              <span>
                Operations Analytics
              </span>

              <h2>
                Fleet Activity Overview
              </h2>

              <p>
                Monthly operational
                performance and fleet
                activity.
              </p>
            </div>

            <select
              className="dashboard-period-select"
              defaultValue="year"
              aria-label="Select chart period"
            >
              <option value="month">
                This Month
              </option>

              <option value="quarter">
                This Quarter
              </option>

              <option value="year">
                This Year
              </option>
            </select>
          </div>

          <div className="dashboard-chart-wrapper">
            <DashChart />
          </div>
        </article>

        <article className="dashboard-activity-card">
          <div className="dashboard-card-header">
            <div>
              <span>Latest Updates</span>

              <h2>Recent Activity</h2>

              <p>
                Latest fleet management
                actions.
              </p>
            </div>
          </div>

          <div className="dashboard-activity-list">
            {recentActivities.map(
              (activity, index) => (
                <div
                  className="dashboard-activity-item"
                  key={`${activity.title}-${index}`}
                >
                  <div className="activity-marker">
                    <span />
                  </div>

                  <div>
                    <strong>
                      {activity.title}
                    </strong>

                    <p>{activity.time}</p>
                  </div>
                </div>
              )
            )}
          </div>

          <button
            type="button"
            className="dashboard-view-button"
          >
            View all activity
          </button>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-small-card">
          <div>
            <span>
              Vehicle Availability
            </span>

            <h2>79%</h2>

            <p>
              98 of 124 vehicles are
              currently operational.
            </p>
          </div>

          <div className="dashboard-progress">
            <span
              style={{
                width: "79%",
              }}
            />
          </div>
        </article>

        <article className="dashboard-small-card">
          <div>
            <span>
              Maintenance Status
            </span>

            <h2>14</h2>

            <p>
              Vehicles currently scheduled
              or under maintenance.
            </p>
          </div>

          <div className="dashboard-progress orange">
            <span
              style={{
                width: "34%",
              }}
            />
          </div>
        </article>

        <article className="dashboard-small-card">
          <div>
            <span>
              Document Compliance
            </span>

            <h2>92%</h2>

            <p>
              Vehicles with valid and
              updated documents.
            </p>
          </div>

          <div className="dashboard-progress green">
            <span
              style={{
                width: "92%",
              }}
            />
          </div>
        </article>
      </section>
    </main>
  );
};

export default DashContent;