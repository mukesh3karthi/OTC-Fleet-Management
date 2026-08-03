import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import DashChart from "../Charts/DashChart";

const API_URL =
  "http://localhost:5000/";

const DashContent = () => {
  const [serverMessage, setServerMessage] =
    useState("");

  const [serverError, setServerError] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response =
          await axios.get(API_URL, {
            timeout: 10000,
          });

        if (!isMounted) {
          return;
        }

        const message =
          typeof response.data ===
          "string"
            ? response.data
            : response.data?.message;

        setServerMessage(
          message || "Server connected"
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

        setServerError(
          "Unable to connect to the backend server."
        );
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="content">
      <header>
        <h1>Welcome</h1>

        <p>
          Thinking the way forward...
        </p>
      </header>

      {serverMessage && (
        <p
          role="status"
          style={{
            marginTop: "16px",
            color: "#15803d",
          }}
        >
          {serverMessage}
        </p>
      )}

      {serverError && (
        <p
          role="alert"
          style={{
            marginTop: "16px",
            color: "#dc2626",
          }}
        >
          {serverError}
        </p>
      )}

      <div
        style={{
          marginTop: "28px",
          minHeight: "360px",
        }}
      >
        <DashChart />
      </div>
    </section>
  );
};

export default DashContent;