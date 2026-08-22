import React from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Truck,
} from "lucide-react";

import "../pagescss/inandoutbound.css";

const InAndOutBound = () => {
  return (
    <main className="inout-page">
      <section className="inout-card">
        <div className="inout-orbit">
          <div className="inout-center-icon">
            <Boxes size={44} />
          </div>

          <div className="inout-moving-icon inbound-icon">
            <ArrowDownToLine size={24} />
          </div>

          <div className="inout-moving-icon outbound-icon">
            <ArrowUpFromLine size={24} />
          </div>

          <div className="inout-moving-icon truck-icon">
            <Truck size={25} />
          </div>
        </div>

        <div className="inout-content">
          <span className="inout-badge">
            Module in progress
          </span>

          <h1>Inbound & Outbound</h1>

          <p>
            This module is currently under
            development. Soon you will be
            able to manage vehicle entries,
            dispatches, loading, unloading,
            and movement records here.
          </p>

          <div className="inout-progress">
            <div className="inout-progress-bar" />
          </div>

          <span className="inout-progress-text">
            Preparing logistics workflow...
          </span>
        </div>

        <div className="inout-floating-shape shape-one" />
        <div className="inout-floating-shape shape-two" />
        <div className="inout-floating-shape shape-three" />
      </section>
    </main>
  );
};

export default InAndOutBound;