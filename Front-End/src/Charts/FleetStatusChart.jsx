import React from "react";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import "./FleetStatusChart.css";


/* =========================================================
   FLEET STATUS DATA
========================================================= */

const fleetData = [
  {
    name: "Active",
    value: 98,
    color: "#0f9488",
  },

  {
    name: "Maintenance",
    value: 14,
    color: "#f59e0b",
  },

  {
    name: "Inactive",
    value: 12,
    color: "#cbd5e1",
  },
];


const totalVehicles = fleetData.reduce(
  (total, item) =>
    total + item.value,
  0
);


/* =========================================================
   CUSTOM TOOLTIP
========================================================= */

const CustomTooltip = ({
  active,
  payload,
}) => {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  const item = payload[0]?.payload;

  const percentage = Math.round(
    (item.value / totalVehicles) * 100
  );

  return (
    <div className="fleet-circle-tooltip">

      <div
        className="fleet-circle-tooltip-dot"
        style={{
          backgroundColor:
            item.color,
        }}
      />

      <div>
        <span>
          {item.name}
        </span>

        <strong>
          {item.value} vehicles
        </strong>

        <small>
          {percentage}% of fleet
        </small>
      </div>

    </div>
  );
};


/* =========================================================
   COMPONENT
========================================================= */

const FleetStatusChart = () => {
  return (
    <div className="fleet-status-container">


      {/* =====================================================
          CIRCLE CHART
      ====================================================== */}

      <div className="fleet-circle-chart">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <PieChart>

            <Tooltip
              content={
                <CustomTooltip />
              }
            />


            <Pie
              data={fleetData}
              dataKey="value"
              nameKey="name"

              cx="50%"
              cy="50%"

              innerRadius="68%"
              outerRadius="88%"

              startAngle={90}
              endAngle={-270}

              paddingAngle={3}

              stroke="none"

              animationBegin={100}
              animationDuration={900}
            >

              {fleetData.map(
                (entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                  />
                )
              )}

            </Pie>

          </PieChart>

        </ResponsiveContainer>


        {/* ===================================================
            CENTER CONTENT
        ==================================================== */}

        <div className="fleet-circle-center">

          <span>
            Total Fleet
          </span>

          <strong>
            {totalVehicles}
          </strong>

          <small>
            Vehicles
          </small>

        </div>

      </div>


      {/* =====================================================
          STATUS LIST
      ====================================================== */}

      <div className="fleet-status-list">

        {fleetData.map((item) => {

          const percentage =
            Math.round(
              (
                item.value /
                totalVehicles
              ) *
                100
            );

          return (
            <div
              className="fleet-status-row"
              key={item.name}
            >

              <div className="fleet-status-name">

                <span
                  className="fleet-status-dot"
                  style={{
                    backgroundColor:
                      item.color,
                  }}
                />

                <span>
                  {item.name}
                </span>

              </div>


              <div className="fleet-status-value">

                <strong>
                  {item.value}
                </strong>

                <span>
                  {percentage}%
                </span>

              </div>

            </div>
          );
        })}

      </div>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <div className="fleet-status-footer">

        <div>
          <span className="fleet-live-dot" />

          <span>
            Live fleet status
          </span>
        </div>

        <strong>
          79% Available
        </strong>

      </div>

    </div>
  );
};


export default FleetStatusChart;