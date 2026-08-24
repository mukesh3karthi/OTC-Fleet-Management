import React from "react";
import {
  Clock3,
  Warehouse as WarehouseIcon,
} from "lucide-react";

import "../pagescss/ComingSoon.css";

const Warehouse = () => {
  return (
    <div className="coming-page">

      <div className="coming-card">

        <div className="coming-icon">
          <WarehouseIcon size={40} />
        </div>

        <h2>
          Warehouse Management
        </h2>

        <div className="coming-badge">
          <Clock3 size={16} />
          <span>Coming Soon</span>
        </div>

        <p>
          Warehouse and inventory management
          module is currently under development.
        </p>

        <div className="coming-progress">
          <div className="coming-progress-bar" />
        </div>

      </div>

    </div>
  );
};

export default Warehouse;