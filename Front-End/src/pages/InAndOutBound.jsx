import React from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock3,
  Truck,
} from "lucide-react";

import "../pagescss/inandoutbound.css";

const InAndOutBound = () => {
  return (
    <div className="inout-page">

      <div className="inout-card">

        {/* MAIN ICON */}

        <div className="inout-icon">

          <ArrowDownToLine size={30} />

          <ArrowUpFromLine size={30} />

        </div>


        {/* TITLE */}

        <h2>
          Inbound & Outbound
        </h2>


        {/* COMING SOON */}

        <div className="inout-coming-soon">

          <Clock3 size={16} />

          <span>
            Coming Soon
          </span>

        </div>


        {/* DESCRIPTION */}

        <p>
          Inbound and outbound vehicle
          movement management module is
          currently under development.
        </p>


        {/* SMALL TRUCK */}

        <div className="inout-truck">

          <Truck size={18} />

          <span>
            Preparing logistics workflow
          </span>

        </div>


        {/* PROGRESS */}

        <div className="inout-progress">

          <div className="inout-progress-bar" />

        </div>

      </div>

    </div>
  );
};

export default InAndOutBound;