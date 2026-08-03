import React from "react";
import {
  Clock3,
  UserCog,
} from "lucide-react";

import "../pagescss/drivermanagement.css";

const DriverManagement = () => {
  return (
    <main className="driver-coming-page">
      <div className="driver-background-circle circle-one" />
      <div className="driver-background-circle circle-two" />
      <div className="driver-background-circle circle-three" />

      <section className="driver-coming-card">
        <div className="driver-icon-wrapper">
          <UserCog
            size={38}
            strokeWidth={1.8}
          />
        </div>

        <h1>Driver Management</h1>

        <div className="driver-coming-badge">
          <Clock3 size={15} />
          <span>Coming Soon</span>
        </div>

        <p>
          Driver management and allocation
          module is currently under
          development.
        </p>

        <div
          className="driver-progress"
          aria-hidden="true"
        >
          <div className="driver-progress-bar" />
        </div>

        <span className="driver-progress-text">
          Preparing the module...
        </span>
      </section>
    </main>
  );
};

export default DriverManagement;