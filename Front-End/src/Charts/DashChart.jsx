import React from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./DashChart.css";


const chartData = [
  {
    month: "Jan",
    trips: 42,
    utilization: 68,
  },
  {
    month: "Feb",
    trips: 48,
    utilization: 71,
  },
  {
    month: "Mar",
    trips: 55,
    utilization: 74,
  },
  {
    month: "Apr",
    trips: 51,
    utilization: 72,
  },
  {
    month: "May",
    trips: 64,
    utilization: 78,
  },
  {
    month: "Jun",
    trips: 72,
    utilization: 82,
  },
  {
    month: "Jul",
    trips: 68,
    utilization: 80,
  },
  {
    month: "Aug",
    trips: 79,
    utilization: 86,
  },
  {
    month: "Sep",
    trips: 75,
    utilization: 84,
  },
  {
    month: "Oct",
    trips: 84,
    utilization: 89,
  },
  {
    month: "Nov",
    trips: 88,
    utilization: 91,
  },
  {
    month: "Dec",
    trips: 92,
    utilization: 93,
  },
];


const CustomTooltip = ({
  active,
  payload,
  label,
}) => {

  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }


  return (

    <div className="fleet-chart-tooltip">

      <div className="fleet-tooltip-header">
        {label}
      </div>


      {payload.map(
        (item) => {

          const isTrips =
            item.dataKey === "trips";


          return (

            <div
              className="fleet-tooltip-row"
              key={item.dataKey}
            >

              <span
                className="fleet-tooltip-dot"
                style={{
                  background:
                    item.color,
                }}
              />


              <span className="fleet-tooltip-label">

                {isTrips
                  ? "Trips Completed"
                  : "Fleet Utilization"}

              </span>


              <strong>

                {item.value}

                {!isTrips && "%"}

              </strong>

            </div>

          );

        }
      )}

    </div>

  );

};


const DashChart = () => {

  return (

    <div className="fleet-chart-container">


      {/* =====================================
          LEGEND
      ===================================== */}

      <div className="fleet-chart-legend">

        <div className="fleet-legend-item">

          <span className="fleet-legend-dot trips" />

          <span>
            Trips Completed
          </span>

        </div>


        <div className="fleet-legend-item">

          <span className="fleet-legend-dot utilization" />

          <span>
            Fleet Utilization
          </span>

        </div>

      </div>


      {/* =====================================
          CHART
      ===================================== */}

      <div className="fleet-chart-body">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <AreaChart
            data={chartData}

            margin={{
              top: 10,
              right: 15,
              left: -10,
              bottom: 5,
            }}
          >

            {/* ===============================
                GRADIENTS
            =============================== */}

            <defs>

              <linearGradient
                id="tripsGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >

                <stop
                  offset="0%"
                  stopColor="#0f9488"
                  stopOpacity={0.28}
                />

                <stop
                  offset="100%"
                  stopColor="#0f9488"
                  stopOpacity={0.02}
                />

              </linearGradient>


              <linearGradient
                id="utilizationGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >

                <stop
                  offset="0%"
                  stopColor="#3b82f6"
                  stopOpacity={0.17}
                />

                <stop
                  offset="100%"
                  stopColor="#3b82f6"
                  stopOpacity={0.01}
                />

              </linearGradient>

            </defs>


            {/* ===============================
                GRID
            =============================== */}

            <CartesianGrid
              vertical={false}
              stroke="#e5ecef"
              strokeDasharray="4 4"
            />


            {/* ===============================
                X AXIS
            =============================== */}

            <XAxis
              dataKey="month"

              axisLine={false}

              tickLine={false}

              tick={{
                fill: "#718096",
                fontSize: 10,
              }}

              dy={8}
            />


            {/* ===============================
                Y AXIS
            =============================== */}

            <YAxis
              axisLine={false}

              tickLine={false}

              width={38}

              tick={{
                fill: "#718096",
                fontSize: 10,
              }}

              domain={[
                0,
                100,
              ]}
            />


            {/* ===============================
                TOOLTIP
            =============================== */}

            <Tooltip

              content={
                <CustomTooltip />
              }

              cursor={{
                stroke: "#b9c9cf",
                strokeWidth: 1,
                strokeDasharray:
                  "4 4",
              }}

            />


            {/* ===============================
                TRIPS
            =============================== */}

            <Area
              type="monotone"

              dataKey="trips"

              name="Trips Completed"

              stroke="#0f9488"

              strokeWidth={2.6}

              fill="url(#tripsGradient)"

              dot={false}

              activeDot={{
                r: 5,
                fill: "#0f9488",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}

              animationDuration={700}
            />


            {/* ===============================
                UTILIZATION
            =============================== */}

            <Area
              type="monotone"

              dataKey="utilization"

              name="Fleet Utilization"

              stroke="#3b82f6"

              strokeWidth={2.2}

              fill="url(#utilizationGradient)"

              dot={false}

              activeDot={{
                r: 4,
                fill: "#3b82f6",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}

              animationDuration={850}
            />

          </AreaChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

};


export default DashChart;