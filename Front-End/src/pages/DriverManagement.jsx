import React from "react";

import {
  Clock3,
  UserCog,
} from "lucide-react";

import "../pagescss/ComingSoon.css";

const DriverManagement = () => {
  return (
    <div className="coming-page">

      <div className="coming-card">

        <div className="coming-icon">
          <UserCog
            size={40}
            strokeWidth={1.8}
          />
        </div>

        <h2>
          Driver Management
        </h2>

        <div className="coming-badge">
          <Clock3 size={16} />
          <span>Coming Soon</span>
        </div>

        <p>
          Driver management and allocation
          module is currently under
          development.
        </p>

        <div className="coming-progress">
          <div className="coming-progress-bar" />
        </div>

      </div>

    </div>
  );
};

export default DriverManagement;