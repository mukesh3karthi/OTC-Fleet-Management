import React from "react";
import {
  FaWarehouse,
  FaClock,
} from "react-icons/fa";

import "../pagescss/warehouse.css";


const Warehouse = () => {
  return (
    <div className="warehouse-coming-page">

      <div className="warehouse-coming-card">


        {/* ICON */}

        <div className="warehouse-coming-icon">
          <FaWarehouse />
        </div>


        {/* TITLE */}

        <h1>
          Warehouse Management
        </h1>


        {/* BADGE */}

        <div className="warehouse-coming-badge">
          <FaClock />

          <span>
            Coming Soon
          </span>
        </div>


        {/* DESCRIPTION */}

        <p>
          Warehouse and inventory management
          module is currently under development.
        </p>


        {/* PROGRESS */}

        <div className="warehouse-coming-progress">

          <div className="warehouse-progress-fill" />

        </div>


      </div>

    </div>
  );
};


export default Warehouse;