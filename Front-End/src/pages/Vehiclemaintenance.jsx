import React from "react";
import {
  Clock3,
  Wrench,
} from "lucide-react";

import "../pagescss/ComingSoon.css";

const Vehiclemaintenance = () => {
  return (
    <div className="coming-page">

      <div className="coming-card">

        <div className="coming-icon">
          <Wrench size={40} />
        </div>

        <h2>
          Vehicle Maintenance
        </h2>

        <div className="coming-badge">
          <Clock3 size={16} />
          <span>Coming Soon</span>
        </div>

        <p>
          Vehicle maintenance and service
          management module is currently
          under development.
        </p>

        <div className="coming-progress">
          <div className="coming-progress-bar" />
        </div>

      </div>

    </div>
  );
};

export default Vehiclemaintenance;