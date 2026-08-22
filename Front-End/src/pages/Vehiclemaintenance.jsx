import React from "react";
import { Wrench, Clock3 } from "lucide-react";
import "../pagescss/vehiclemaintenance.css";

const Vehiclemaintenance = () => {
  return (
    <div className="maintenance-page">
      <div className="maintenance-card">
        <div className="maintenance-icon">
          <Wrench size={40} />
        </div>

        <h2>Vehicle Maintenance</h2>

        <div className="coming-soon">
          <Clock3 size={16} />
          <span>Coming Soon</span>
        </div>

        <p>
          Vehicle maintenance and service
          management module is currently
          under development.
        </p>

        <div className="progress">
          <div className="progress-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default Vehiclemaintenance;