import React from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock3,
} from "lucide-react";

import "../pagescss/ComingSoon.css";

const InAndOutBound = () => {
  return (
    <div className="coming-page">

      <div className="coming-card">

        <div className="coming-icon">
          <ArrowDownToLine size={28} />
          <ArrowUpFromLine size={28} />
        </div>

        <h2>
          Inbound & Outbound
        </h2>

        <div className="coming-badge">
          <Clock3 size={16} />
          <span>Coming Soon</span>
        </div>

        <p>
          Inbound and outbound vehicle
          movement management module is
          currently under development.
        </p>

        <div className="coming-progress">
          <div className="coming-progress-bar" />
        </div>

      </div>

    </div>
  );
};

export default InAndOutBound;