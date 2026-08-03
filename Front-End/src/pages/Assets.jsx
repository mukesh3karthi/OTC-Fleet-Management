import React from "react";
import { Package, Clock3 } from "lucide-react";
import "../pagescss/assets.css";

const Assets = () => {
  return (
    <div className="assets-page">
      <div className="assets-card">
        <div className="assets-icon">
          <Package size={40} />
        </div>

        <h2>Assets</h2>

        <div className="coming-soon">
          <Clock3 size={16} />
          <span>Coming Soon</span>
        </div>

        <p>
          Asset Management module is under
          development.
        </p>

        <div className="progress">
          <div className="progress-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default Assets;