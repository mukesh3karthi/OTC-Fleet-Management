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
import FleetStatusChart from "../Charts/FleetStatusChart";

import "../pagescss/dashcontent.css";


const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");


/* =========================================================
   DASHBOARD STATS
========================================================= */

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


/* =========================================================
   COMPONENT
========================================================= */

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


  /* =========================================================
     CHECK BACKEND
  ========================================================= */

  useEffect(() => {
    let isMounted = true;

    const fetchServerStatus = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          API_BASE_URL,
          {
            timeout: 60000,
          }
        );

        if (!isMounted) {
          return;
        }

        const message =
          typeof response.data === "string"
            ? response.data
            : response.data?.message;

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
          error.response?.data?.message ||
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


  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <main className="premium-dashboard">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="premium-dashboard-header">

        <div>
          <span className="dashboard-eyebrow">
            Fleet Management
          </span>

          <h1>
            Dashboard Overview
          </h1>

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
            <span>
              Server Status
            </span>

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


      {/* =====================================================
          SERVER SUCCESS MESSAGE
      ====================================================== */}

      {serverMessage && (
        <div
          className="dashboard-message success"
          role="status"
        >
          <FaCheckCircle />

          <span>
            {serverMessage}
          </span>
        </div>
      )}


      {/* =====================================================
          SERVER ERROR MESSAGE
      ====================================================== */}

      {serverError && (
        <div
          className="dashboard-message error"
          role="alert"
        >
          <FaExclamationTriangle />

          <span>
            {serverError}
          </span>
        </div>
      )}


      {/* =====================================================
          STAT CARDS
      ====================================================== */}

      <section className="dashboard-stat-grid">

        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="dashboard-stat-card"
              key={card.title}
            >
              <div>
                <p>
                  {card.title}
                </p>

                <h2>
                  {card.value}
                </h2>

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
        })}

      </section>


      {/* =====================================================
          MAIN ANALYTICS
      ====================================================== */}

      <section className="dashboard-main-grid">

        {/* ===================================================
            FLEET PERFORMANCE
        ==================================================== */}

        <article className="dashboard-chart-card">

          <div className="dashboard-card-header">

            <div>
              <span>
                Operations Analytics
              </span>

              <h2>
                Fleet Performance
              </h2>

              <p>
                Monthly trip activity and
                fleet utilization.
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


        {/* ===================================================
            FLEET STATUS CIRCLE CHART
        ==================================================== */}

        <article className="dashboard-circle-card">

          <div className="dashboard-card-header">

            <div>
              <span>
                Fleet Overview
              </span>

              <h2>
                Vehicle Status
              </h2>

              <p>
                Current vehicle availability
                and operational status.
              </p>
            </div>

          </div>


          <div className="dashboard-circle-wrapper">
            <FleetStatusChart />
          </div>

        </article>

      </section>


      {/* =====================================================
          BOTTOM SUMMARY
      ====================================================== */}

      <section className="dashboard-bottom-grid">


        {/* VEHICLE AVAILABILITY */}

        <article className="dashboard-small-card">

          <div>
            <span>
              Vehicle Availability
            </span>

            <h2>
              79%
            </h2>

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


        {/* MAINTENANCE */}

        <article className="dashboard-small-card">

          <div>
            <span>
              Maintenance Status
            </span>

            <h2>
              14
            </h2>

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


        {/* DOCUMENT COMPLIANCE */}

        <article className="dashboard-small-card">

          <div>
            <span>
              Document Compliance
            </span>

            <h2>
              92%
            </h2>

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