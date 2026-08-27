import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  AlertTriangle,
  Building2,
  CircleDot,
  MapPin,
  Navigation,
  Server,
  Truck,
  Warehouse,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "../pagescss/dashcontent.css";


/* =========================================================
   API
========================================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const INTERCARTING_API =
  `${API_BASE_URL}/api/vehicles`;

const OWN_VEHICLE_API =
  `${API_BASE_URL}/api/ownvehicles`;

const TRACKING_API =
  `${API_BASE_URL}/api/triptracking`;


/* =========================================================
   COLORS
========================================================= */

const CHART_COLORS = [
  "#0f9b8e",
  "#2563eb",
  "#f59e0b",
  "#7c3aed",
  "#16a34a",
  "#dc2626",
  "#0891b2",
  "#64748b",
  "#db2777",
  "#4f46e5",
  "#84cc16",
  "#ea580c",
];


const TRACKING_COLORS = {
  Moving: "#2563eb",
  Idle: "#f59e0b",
  Stopped: "#64748b",
  Breakdown: "#dc2626",
  Reached: "#16a34a",
};


const TRIP_STATUS_COLORS = {
  Active: "#0f9b8e",
  Completed: "#2563eb",
  Pending: "#f59e0b",
  Cancelled: "#dc2626",
};


/* =========================================================
   NORMALIZE API ARRAY
========================================================= */

const normalizeArray = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.vehicles)) {
    return data.vehicles;
  }

  if (Array.isArray(data?.ownVehicles)) {
    return data.ownVehicles;
  }

  if (Array.isArray(data?.trips)) {
    return data.trips;
  }

  if (Array.isArray(data?.tripTracking)) {
    return data.tripTracking;
  }

  return [];
};


/* =========================================================
   TEXT NORMALIZER
========================================================= */

const normalizeText = (
  value,
  fallback = ""
) => {

  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }


  if (
    typeof value === "object"
  ) {

    if (
      value.$oid !== undefined
    ) {
      return String(value.$oid);
    }


    if (
      value.$date !== undefined
    ) {
      return String(value.$date);
    }


    if (
      value.$numberLong !== undefined
    ) {
      return String(value.$numberLong);
    }


    if (
      value.$numberInt !== undefined
    ) {
      return String(value.$numberInt);
    }


    return fallback;
  }


  return String(value).trim();
};


/* =========================================================
   BOOLEAN NORMALIZER
========================================================= */

const normalizeBoolean = (
  value
) => {

  if (
    value === true ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }


  if (
    typeof value === "string"
  ) {

    return (
      value.toLowerCase() ===
      "true"
    );

  }


  return false;
};


/* =========================================================
   OWN VEHICLE NORMALIZER
========================================================= */

const normalizeOwnVehicle = (
  vehicle = {}
) => {

  return {
    ...vehicle,

    id:
      normalizeText(
        vehicle._id
      ) ||
      normalizeText(
        vehicle.id
      ) ||
      normalizeText(
        vehicle.vehicleId
      ) ||
      normalizeText(
        vehicle.vehicleNo
      ) ||
      normalizeText(
        vehicle.vehicleNumber
      ),


    vehicleNo:
      normalizeText(
        vehicle.vehicleNo
      ) ||
      normalizeText(
        vehicle.vehicleNumber
      ),


    type:
      normalizeText(
        vehicle.vehicleType
      ) ||
      normalizeText(
        vehicle.type
      ),


    gps:
      normalizeBoolean(
        vehicle.gps
      ) ||
      normalizeBoolean(
        vehicle.gpsAvailable
      ) ||
      normalizeBoolean(
        vehicle.hasGps
      ),


    purchaseYear:
      normalizeText(
        vehicle.purchaseYear
      ) ||
      normalizeText(
        vehicle.year
      ) ||
      normalizeText(
        vehicle.manufacturingYear
      ),
  };
};


/* =========================================================
   INTERCARTING STATUS
========================================================= */

const getIntercartingStatus = (
  vehicle = {}
) => {

  const status =
    normalizeText(
      vehicle.status
    ).toLowerCase();


  const active =
    vehicle.activeStatus ??
    vehicle.active ??
    vehicle.isActive ??
    false;


  if (
    status.includes(
      "maintenance"
    ) ||
    status.includes(
      "service"
    )
  ) {
    return "maintenance";
  }


  if (
    active === true ||
    active === "true" ||
    status === "active"
  ) {
    return "active";
  }


  return "released";
};


/* =========================================================
   VEHICLE CATEGORY
========================================================= */

const getVehicleCategory = (
  vehicle = {}
) => {

  const category =
    normalizeText(
      vehicle.vehicleCategory
    ) ||
    normalizeText(
      vehicle.vehicleType
    ) ||
    normalizeText(
      vehicle.type
    ) ||
    normalizeText(
      vehicle.category
    ) ||
    normalizeText(
      vehicle.vehicle_category
    ) ||
    normalizeText(
      vehicle.vehicle_category_name
    );


  return (
    category ||
    "Unspecified"
  );
};


/* =========================================================
   SITE NAME
========================================================= */

const getVehicleSite = (
  vehicle = {}
) => {

  return (
    normalizeText(
      vehicle.siteName
    ) ||
    normalizeText(
      vehicle.site
    ) ||
    normalizeText(
      vehicle.location
    ) ||
    normalizeText(
      vehicle.site_name
    ) ||
    "Unspecified"
  );
};


/* =========================================================
   TRIP VEHICLES
========================================================= */

const getTripVehicles = (
  trip = {}
) => {

  if (
    Array.isArray(
      trip.vehicles
    )
  ) {
    return trip.vehicles;
  }


  if (
    Array.isArray(
      trip.vehicleDetails
    )
  ) {
    return trip.vehicleDetails;
  }


  if (
    Array.isArray(
      trip.vehicleData
    )
  ) {
    return trip.vehicleData;
  }


  if (
    trip.vehicle &&
    typeof trip.vehicle ===
      "object"
  ) {
    return [
      trip.vehicle,
    ];
  }


  return [];
};


/* =========================================================
   TRIP VEHICLE STATUS
========================================================= */

const getTripVehicleStatus = (
  vehicle = {}
) => {

  return (
    normalizeText(
      vehicle.status
    ) ||
    normalizeText(
      vehicle.vehicleStatus
    ) ||
    normalizeText(
      vehicle.trackingStatus
    ) ||
    normalizeText(
      vehicle.movementStatus
    )
  ).toLowerCase();
};


/* =========================================================
   COMPONENT
========================================================= */

const DashContent = () => {

  /* =======================================================
     STATE
  ======================================================= */

  const [
    selectedModule,
    setSelectedModule,
  ] = useState(
    "intercarting"
  );


  const [
    intercartingVehicles,
    setIntercartingVehicles,
  ] = useState([]);


  const [
    ownVehicles,
    setOwnVehicles,
  ] = useState([]);


  const [
    trips,
    setTrips,
  ] = useState([]);


  /*
    Warehouse API is not available yet.
    Therefore warehouse remains empty until
    an API is created.
  */

  const [
    warehouses,
    setWarehouses,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    serverConnected,
    setServerConnected,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  /* =======================================================
     FETCH DASHBOARD DATA
  ======================================================= */

  const fetchDashboardData =
    useCallback(
      async () => {

        setLoading(true);
        setError("");


        const apiRequests = [
          {
            name:
              "Intercarting",
            url:
              INTERCARTING_API,
          },

          {
            name:
              "Own Vehicle",
            url:
              OWN_VEHICLE_API,
          },

          {
            name:
              "Tracking",
            url:
              TRACKING_API,
          },
        ];


        try {

          /*
            Do not request API_BASE_URL "/".
            Some backends do not have a root route.
          */


          const results =
            await Promise.allSettled(

              apiRequests.map(
                api =>
                  axios.get(
                    api.url,
                    {
                      timeout:
                        60000,
                    }
                  )
              )

            );


          /* =================================================
             CHECK SERVER
          ================================================= */

          const hasSuccessfulApi =
            results.some(
              result =>
                result.status ===
                "fulfilled"
            );


          setServerConnected(
            hasSuccessfulApi
          );


          /* =================================================
             INTERCARTING
          ================================================= */

          if (
            results[0].status ===
            "fulfilled"
          ) {

            const data =
              normalizeArray(
                results[0].value
              );


            setIntercartingVehicles(
              data
            );

          } else {

            console.error(
              "Intercarting API Error:",
              results[0].reason
            );


            setIntercartingVehicles(
              []
            );

          }


          /* =================================================
             OWN VEHICLE
          ================================================= */

          if (
            results[1].status ===
            "fulfilled"
          ) {

            const data =
              normalizeArray(
                results[1].value
              );


            setOwnVehicles(
              data.map(
                normalizeOwnVehicle
              )
            );

          } else {

            console.error(
              "Own Vehicle API Error:",
              results[1].reason
            );


            setOwnVehicles(
              []
            );

          }


          /* =================================================
             TRACKING
          ================================================= */

          if (
            results[2].status ===
            "fulfilled"
          ) {

            const data =
              normalizeArray(
                results[2].value
              );


            setTrips(
              data
            );

          } else {

            console.error(
              "Tracking API Error:",
              results[2].reason
            );


            setTrips(
              []
            );

          }


          /* =================================================
             FAILED API MESSAGE
          ================================================= */

          const failedApis =
            results
              .map(
                (
                  result,
                  index
                ) => {

                  if (
                    result.status ===
                    "rejected"
                  ) {

                    return (
                      apiRequests[
                        index
                      ].name
                    );

                  }

                  return null;

                }
              )
              .filter(
                Boolean
              );


          if (
            failedApis.length >
            0
          ) {

            setError(
              `${failedApis.join(
                ", "
              )} API ${
                failedApis.length ===
                1
                  ? "request"
                  : "requests"
              } could not be loaded.`
            );

          }

        } catch (
          requestError
        ) {

          console.error(
            "Dashboard Error:",
            requestError
          );


          setServerConnected(
            false
          );


          setError(
            "Dashboard information could not be loaded."
          );

        } finally {

          setLoading(
            false
          );

        }

      },
      []
    );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(
    () => {

      fetchDashboardData();

    },
    [
      fetchDashboardData,
    ]
  );


  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(
    () => {

      const interval =
        setInterval(
          () => {

            fetchDashboardData();

          },
          60000
        );


      return () => {

        clearInterval(
          interval
        );

      };

    },
    [
      fetchDashboardData,
    ]
  );


  /* =======================================================
     INTERCARTING STATS
  ======================================================= */

  const intercartingStats =
    useMemo(
      () => {

        let active = 0;

        let maintenance = 0;

        let released = 0;


        intercartingVehicles.forEach(
          vehicle => {

            const status =
              getIntercartingStatus(
                vehicle
              );


            if (
              status ===
              "active"
            ) {

              active++;

            } else if (
              status ===
              "maintenance"
            ) {

              maintenance++;

            } else {

              released++;

            }

          }
        );


        return {

          total:
            intercartingVehicles.length,

          active,

          maintenance,

          released,

        };

      },
      [
        intercartingVehicles,
      ]
    );


  /* =======================================================
     VEHICLES BY SITE
  ======================================================= */

  const intercartingSiteData =
    useMemo(
      () => {

        const counts = {};


        intercartingVehicles.forEach(
          vehicle => {

            const site =
              getVehicleSite(
                vehicle
              );


            counts[site] =
              (
                counts[site] ||
                0
              ) + 1;

          }
        );


        return Object.entries(
          counts
        )
          .map(
            ([
              name,
              value,
            ]) => ({
              name,
              value,
            })
          )
          .sort(
            (a, b) =>
              b.value -
              a.value
          );

      },
      [
        intercartingVehicles,
      ]
    );


  /* =======================================================
     VEHICLE CATEGORY
  ======================================================= */

  const intercartingCategoryData =
    useMemo(
      () => {

        const counts = {};


        intercartingVehicles.forEach(
          vehicle => {

            const category =
              getVehicleCategory(
                vehicle
              );


            counts[category] =
              (
                counts[category] ||
                0
              ) + 1;

          }
        );


        return Object.entries(
          counts
        )
          .map(
            ([
              name,
              value,
            ]) => ({
              name,
              value,
            })
          )
          .sort(
            (a, b) =>
              b.value -
              a.value
          );

      },
      [
        intercartingVehicles,
      ]
    );


  /* =======================================================
     OWN VEHICLE STATS
  ======================================================= */

  const ownVehicleStats =
    useMemo(
      () => {

        const currentYear =
          new Date().getFullYear();


        let gps = 0;

        let noGps = 0;

        let purchased = 0;


        ownVehicles.forEach(
          vehicle => {

            if (
              vehicle.gps
            ) {

              gps++;

            } else {

              noGps++;

            }


            if (
              Number(
                vehicle.purchaseYear
              ) ===
              currentYear
            ) {

              purchased++;

            }

          }
        );


        return {

          total:
            ownVehicles.length,

          gps,

          noGps,

          purchased,

          currentYear,

        };

      },
      [
        ownVehicles,
      ]
    );


  /* =======================================================
     OWN VEHICLES BY PURCHASE YEAR
  ======================================================= */

  const ownVehicleYearData =
    useMemo(
      () => {

        const counts = {};


        ownVehicles.forEach(
          vehicle => {

            const year =
              normalizeText(
                vehicle.purchaseYear
              ) ||
              "Unknown";


            counts[year] =
              (
                counts[year] ||
                0
              ) + 1;

          }
        );


        return Object.entries(
          counts
        )
          .map(
            ([
              name,
              value,
            ]) => ({
              name,
              value,
            })
          )
          .sort(
            (a, b) => {

              if (
                a.name ===
                "Unknown"
              ) {

                return 1;

              }


              if (
                b.name ===
                "Unknown"
              ) {

                return -1;

              }


              return (
                Number(a.name) -
                Number(b.name)
              );

            }
          );

      },
      [
        ownVehicles,
      ]
    );


  /* =======================================================
     GPS DATA
  ======================================================= */

  const ownVehicleGpsData =
    useMemo(
      () => [

        {
          name:
            "GPS Available",

          value:
            ownVehicleStats.gps,
        },

        {
          name:
            "Without GPS",

          value:
            ownVehicleStats.noGps,
        },

      ],
      [
        ownVehicleStats,
      ]
    );


  /* =======================================================
     TRACKING STATS
  ======================================================= */

  const trackingStats =
    useMemo(
      () => {

        let moving = 0;

        let breakdown = 0;

        let reached = 0;


        trips.forEach(
          trip => {

            const vehicles =
              getTripVehicles(
                trip
              );


            vehicles.forEach(
              vehicle => {

                const status =
                  getTripVehicleStatus(
                    vehicle
                  );


                if (
                  status ===
                  "moving"
                ) {

                  moving++;

                }


                if (
                  status ===
                  "breakdown"
                ) {

                  breakdown++;

                }


                if (
                  status ===
                  "reached"
                ) {

                  reached++;

                }

              }
            );

          }
        );


        return {

          total:
            trips.length,

          moving,

          breakdown,

          reached,

        };

      },
      [
        trips,
      ]
    );


  /* =======================================================
     TRACKING MOVEMENT
  ======================================================= */

  const trackingMovementData =
    useMemo(
      () => {

        const counts = {

          Moving: 0,

          Idle: 0,

          Stopped: 0,

          Breakdown: 0,

          Reached: 0,

        };


        trips.forEach(
          trip => {

            const vehicles =
              getTripVehicles(
                trip
              );


            vehicles.forEach(
              vehicle => {

                const status =
                  getTripVehicleStatus(
                    vehicle
                  );


                const key =
                  Object.keys(
                    counts
                  ).find(
                    item =>
                      item.toLowerCase() ===
                      status
                  );


                if (
                  key
                ) {

                  counts[key]++;

                }

              }
            );

          }
        );


        return Object.entries(
          counts
        ).map(
          ([
            name,
            value,
          ]) => ({
            name,
            value,
          })
        );

      },
      [
        trips,
      ]
    );


  /* =======================================================
     TRIP STATUS
  ======================================================= */

  const tripStatusData =
    useMemo(
      () => {

        const counts = {};


        trips.forEach(
          trip => {

            const status =
              normalizeText(
                trip.tripStatus
              ) ||
              normalizeText(
                trip.status
              ) ||
              "Unknown";


            counts[status] =
              (
                counts[status] ||
                0
              ) + 1;

          }
        );


        return Object.entries(
          counts
        )
          .map(
            ([
              name,
              value,
            ]) => ({
              name,
              value,
            })
          )
          .sort(
            (a, b) =>
              b.value -
              a.value
          );

      },
      [
        trips,
      ]
    );


  /* =======================================================
     WAREHOUSE STATS
     
     NO API YET
     
     Therefore all values are zero.
  ======================================================= */

  const warehouseStats =
    useMemo(
      () => {

        let active = 0;

        let occupied = 0;

        let available = 0;


        warehouses.forEach(
          warehouse => {

            const status =
              (
                normalizeText(
                  warehouse.status
                ) ||
                normalizeText(
                  warehouse.warehouseStatus
                )
              ).toLowerCase();


            if (
              status.includes(
                "active"
              )
            ) {

              active++;

            }


            if (
              status.includes(
                "occupied"
              )
            ) {

              occupied++;

            }


            if (
              status.includes(
                "available"
              ) ||
              status.includes(
                "vacant"
              )
            ) {

              available++;

            }

          }
        );


        return {

          total:
            warehouses.length,

          active,

          occupied,

          available,

        };

      },
      [
        warehouses,
      ]
    );


  /* =======================================================
     WAREHOUSE CHART
  ======================================================= */

  const warehouseChartData =
    useMemo(
      () => [

        {
          name:
            "Active",

          value:
            warehouseStats.active,
        },

        {
          name:
            "Occupied",

          value:
            warehouseStats.occupied,
        },

        {
          name:
            "Available",

          value:
            warehouseStats.available,
        },

      ],
      [
        warehouseStats,
      ]
    );


  /* =======================================================
     MODULE CARDS
  ======================================================= */

  const moduleCards =
    useMemo(
      () => [

        /* ===============================================
           INTERCARTING
        =============================================== */

        {
          key:
            "intercarting",

          title:
            "Intercarting",

          subtitle:
            "Fleet Operations",

          icon:
            Truck,

          totalLabel:
            "Total",

          total:
            intercartingStats.total,

          statuses: [

            {
              label:
                "Active On-Road",

              description:
                "Operational",

              value:
                intercartingStats.active,

              tone:
                "green",
            },

            {
              label:
                "Maintenance",

              description:
                "Under service",

              value:
                intercartingStats.maintenance,

              tone:
                "orange",
            },

            {
              label:
                "Released",

              description:
                "Off fleet",

              value:
                intercartingStats.released,

              tone:
                "purple",
            },

          ],
        },


        /* ===============================================
           OWN VEHICLE
        =============================================== */

        {
          key:
            "ownvehicle",

          title:
            "Own Vehicle",

          subtitle:
            "Owned Fleet",

          icon:
            Navigation,

          totalLabel:
            "Total",

          total:
            ownVehicleStats.total,

          statuses: [

            {
              label:
                "GPS Available",

              description:
                "Tracking enabled",

              value:
                ownVehicleStats.gps,

              tone:
                "blue",
            },

            {
              label:
                "Without GPS",

              description:
                "Not connected",

              value:
                ownVehicleStats.noGps,

              tone:
                "orange",
            },

            {
              label:
                `Purchased ${ownVehicleStats.currentYear}`,

              description:
                "New fleet",

              value:
                ownVehicleStats.purchased,

              tone:
                "purple",
            },

          ],
        },


        /* ===============================================
           TRACKING
        =============================================== */

        {
          key:
            "tracking",

          title:
            "Tracking",

          subtitle:
            "Live Movement",

          icon:
            MapPin,

          totalLabel:
            "Total Trips",

          total:
            trackingStats.total,

          statuses: [

            {
              label:
                "Moving",

              description:
                "In transit",

              value:
                trackingStats.moving,

              tone:
                "blue",
            },

            {
              label:
                "Breakdown",

              description:
                "Needs attention",

              value:
                trackingStats.breakdown,

              tone:
                "orange",
            },

            {
              label:
                "Reached",

              description:
                "Destination reached",

              value:
                trackingStats.reached,

              tone:
                "green",
            },

          ],
        },


        /* ===============================================
           WAREHOUSE
        =============================================== */

        {
          key:
            "warehouse",

          title:
            "Warehouse",

          subtitle:
            "Storage Operations",

          icon:
            Warehouse,

          totalLabel:
            "Total",

          total:
            warehouseStats.total,

          statuses: [

            {
              label:
                "Active",

              description:
                "Operational",

              value:
                warehouseStats.active,

              tone:
                "green",
            },

            {
              label:
                "Occupied",

              description:
                "In use",

              value:
                warehouseStats.occupied,

              tone:
                "orange",
            },

            {
              label:
                "Available",

              description:
                "Ready to use",

              value:
                warehouseStats.available,

              tone:
                "purple",
            },

          ],
        },

      ],
      [
        intercartingStats,
        ownVehicleStats,
        trackingStats,
        warehouseStats,
      ]
    );


  /* =======================================================
     SELECTED CARD
  ======================================================= */

  const selectedCard =
    moduleCards.find(
      card =>
        card.key ===
        selectedModule
    ) ||
    moduleCards[0];


  /* =======================================================
     BAR CHART
  ======================================================= */

  const renderBarChart = (
    data,
    type = "default"
  ) => {

    const validData =
      data.filter(
        item =>
          Number(
            item.value
          ) > 0
      );


    if (
      validData.length ===
      0
    ) {

      return (
        <div className="dashboard-chart-empty">
          No data available
        </div>
      );

    }


    return (
      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <BarChart
          data={validData}
          margin={{
            top: 25,
            right: 12,
            left: -8,
            bottom: 5,
          }}
          barCategoryGap="35%"
        >

          <CartesianGrid
            vertical={false}
            stroke="#e2e8f0"
            strokeDasharray="4 5"
          />


          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{
              fontSize: 9,
              fill: "#64748b",
            }}
          />


          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 9,
              fill: "#94a3b8",
            }}
          />


          <Tooltip
            cursor={{
              fill:
                "rgba(15,155,142,0.035)",
            }}
            formatter={
              value => [
                value,
                "Count",
              ]
            }
          />


          <Bar
            dataKey="value"
            maxBarSize={50}
            radius={[
              6,
              6,
              1,
              1,
            ]}
          >

            {validData.map(
              (
                item,
                index
              ) => {

                let color =
                  CHART_COLORS[
                    index %
                    CHART_COLORS.length
                  ];


                if (
                  type ===
                  "tracking"
                ) {

                  color =
                    TRACKING_COLORS[
                      item.name
                    ] ||
                    color;

                }


                return (
                  <Cell
                    key={
                      `${item.name}-${index}`
                    }
                    fill={
                      color
                    }
                  />
                );

              }
            )}


            <LabelList
              dataKey="value"
              position="top"
              fill="#082b45"
              fontSize={9}
              fontWeight={700}
            />

          </Bar>

        </BarChart>

      </ResponsiveContainer>
    );

  };


  /* =======================================================
     PIE CHART
  ======================================================= */

  const renderPieChart = (
    data,
    total,
    label,
    type = "default"
  ) => {

    const validData =
      data.filter(
        item =>
          Number(
            item.value
          ) > 0
      );


    return (
      <div className="module-pie-wrapper">

        {validData.length >
        0 ? (

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <PieChart>

              <Pie
                data={validData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="64%"
                outerRadius="84%"
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={1}
              >

                {validData.map(
                  (
                    item,
                    index
                  ) => {

                    let color =
                      CHART_COLORS[
                        index %
                        CHART_COLORS.length
                      ];


                    if (
                      type ===
                      "tracking"
                    ) {

                      color =
                        TRIP_STATUS_COLORS[
                          item.name
                        ] ||
                        color;

                    }


                    return (
                      <Cell
                        key={
                          `${item.name}-${index}`
                        }
                        fill={
                          color
                        }
                      />
                    );

                  }
                )}

              </Pie>


              <Tooltip
                formatter={
                  value => [
                    value,
                    label,
                  ]
                }
              />

            </PieChart>

          </ResponsiveContainer>

        ) : (

          <div className="dashboard-chart-empty">
            No data available
          </div>

        )}


        <div className="module-pie-center">

          <strong>
            {total}
          </strong>

          <span>
            {label}
          </span>

        </div>

      </div>
    );

  };


  /* =======================================================
     LEGEND
  ======================================================= */

  const renderLegend = (
    data,
    type = "default"
  ) => {

    const total =
      data.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.value ||
            0
          ),
        0
      );


    return (
      <div className="module-chart-legend">

        {data.map(
          (
            item,
            index
          ) => {

            let color =
              CHART_COLORS[
                index %
                CHART_COLORS.length
              ];


            if (
              type ===
              "tracking"
            ) {

              color =
                TRIP_STATUS_COLORS[
                  item.name
                ] ||
                color;

            }


            const percentage =
              total > 0
                ? (
                    (
                      Number(
                        item.value
                      ) /
                      total
                    ) *
                    100
                  ).toFixed(1)
                : "0.0";


            return (
              <div
                key={
                  `${item.name}-${index}`
                }
                className="module-legend-row"
              >

                <div className="module-legend-name">

                  <i
                    style={{
                      background:
                        color,
                    }}
                  />


                  <span>
                    {
                      item.name
                    }
                  </span>

                </div>


                <div className="module-legend-value">

                  <strong>
                    {
                      item.value
                    }
                  </strong>


                  <small>
                    {
                      percentage
                    }%
                  </small>

                </div>

              </div>
            );

          }
        )}

      </div>
    );

  };


  /* =======================================================
     SELECTED CHARTS
  ======================================================= */

  const renderSelectedCharts =
    () => {

      /* ===================================================
         INTERCARTING
      =================================================== */

      if (
        selectedModule ===
        "intercarting"
      ) {

        return (
          <>

            <article className="module-chart-card large">

              <div className="module-chart-header">

                <div>

                  <span>
                    Fleet Distribution
                  </span>


                  <h2>
                    Vehicles by Site
                  </h2>


                  <p>
                    Intercarting vehicle allocation across operating sites.
                  </p>

                </div>


                <div className="chart-total-badge">

                  <small>
                    TOTAL
                  </small>


                  <strong>
                    {
                      intercartingStats.total
                    }
                  </strong>

                </div>

              </div>


              <div className="module-bar-chart">

                {renderBarChart(
                  intercartingSiteData
                )}

              </div>

            </article>


            <article className="module-chart-card category-card">

              <div className="module-chart-header">

                <div>

                  <span>
                    Fleet Mix
                  </span>


                  <h2>
                    Vehicle Category
                  </h2>


                  <p>
                    Distribution of vehicles by category.
                  </p>

                </div>

              </div>


              <div className="module-pie-layout">

                {renderPieChart(
                  intercartingCategoryData,
                  intercartingStats.total,
                  "Vehicles"
                )}


                {renderLegend(
                  intercartingCategoryData
                )}

              </div>

            </article>

          </>
        );

      }


      /* ===================================================
         OWN VEHICLE
      =================================================== */

      if (
        selectedModule ===
        "ownvehicle"
      ) {

        return (
          <>

            <article className="module-chart-card large">

              <div className="module-chart-header">

                <div>

                  <span>
                    Fleet History
                  </span>


                  <h2>
                    Vehicles by Purchase Year
                  </h2>


                  <p>
                    Owned vehicle distribution by purchase year.
                  </p>

                </div>


                <div className="chart-total-badge">

                  <small>
                    TOTAL
                  </small>


                  <strong>
                    {
                      ownVehicleStats.total
                    }
                  </strong>

                </div>

              </div>


              <div className="module-bar-chart">

                {renderBarChart(
                  ownVehicleYearData
                )}

              </div>

            </article>


            <article className="module-chart-card">

              <div className="module-chart-header">

                <div>

                  <span>
                    GPS Coverage
                  </span>


                  <h2>
                    GPS Availability
                  </h2>


                  <p>
                    GPS-enabled versus non-GPS vehicles.
                  </p>

                </div>

              </div>


              <div className="module-pie-layout">

                {renderPieChart(
                  ownVehicleGpsData,
                  ownVehicleStats.total,
                  "Vehicles"
                )}


                {renderLegend(
                  ownVehicleGpsData
                )}

              </div>

            </article>

          </>
        );

      }


      /* ===================================================
         TRACKING
      =================================================== */

      if (
        selectedModule ===
        "tracking"
      ) {

        return (
          <>

            <article className="module-chart-card large">

              <div className="module-chart-header">

                <div>

                  <span>
                    Live Operations
                  </span>


                  <h2>
                    Vehicle Movement
                  </h2>


                  <p>
                    Current movement status of tracking vehicles.
                  </p>

                </div>


                <div className="chart-total-badge">

                  <small>
                    TRIPS
                  </small>


                  <strong>
                    {
                      trackingStats.total
                    }
                  </strong>

                </div>

              </div>


              <div className="module-bar-chart">

                {renderBarChart(
                  trackingMovementData,
                  "tracking"
                )}

              </div>

            </article>


            <article className="module-chart-card">

              <div className="module-chart-header">

                <div>

                  <span>
                    Trip Overview
                  </span>


                  <h2>
                    Trip Status
                  </h2>


                  <p>
                    Current distribution of trip statuses.
                  </p>

                </div>

              </div>


              <div className="module-pie-layout">

                {renderPieChart(
                  tripStatusData,
                  trackingStats.total,
                  "Trips",
                  "tracking"
                )}


                {renderLegend(
                  tripStatusData,
                  "tracking"
                )}

              </div>

            </article>

          </>
        );

      }


      /* ===================================================
         WAREHOUSE
         
         NO API CURRENTLY
      =================================================== */

      return (
        <>

          <article className="module-chart-card large">

            <div className="module-chart-header">

              <div>

                <span>
                  Warehouse Overview
                </span>


                <h2>
                  Warehouse Status
                </h2>


                <p>
                  Warehouse API is not available yet.
                </p>

              </div>


              <div className="chart-total-badge">

                <small>
                  TOTAL
                </small>


                <strong>
                  {warehouseStats.total}
                </strong>

              </div>

            </div>


            <div className="module-bar-chart">

              {renderBarChart(
                warehouseChartData
              )}

            </div>

          </article>


          <article className="module-chart-card warehouse-information">

            <div className="module-chart-header">

              <div>

                <span>
                  Storage
                </span>


                <h2>
                  Warehouse Summary
                </h2>


                <p>
                  Warehouse API is not connected.
                </p>

              </div>

            </div>


            <div className="warehouse-summary">

              <Building2
                size={30}
              />


              <strong>
                {
                  warehouseStats.total
                }
              </strong>


              <span>
                Total Warehouses
              </span>

            </div>

          </article>

        </>
      );

    };


  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <main className="premium-dashboard">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="premium-dashboard-header">

        <div>

          <span className="dashboard-eyebrow">
            Fleet Management
          </span>


          <h1>
            Dashboard Overview
          </h1>

        </div>


        <div
          className={`server-status ${
            serverConnected
              ? "connected"
              : "error"
          }`}
        >

          <Server
            size={17}
          />


          <div>

            <span>
              Server Status
            </span>


            <strong>

              {loading
                ? "Checking..."
                : serverConnected
                  ? "Connected"
                  : "Disconnected"}

            </strong>

          </div>

        </div>

      </header>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (

        <div className="dashboard-message error">

          <AlertTriangle
            size={14}
          />


          <span>
            {error}
          </span>

        </div>

      )}


      {/* ===================================================
          MODULE CARDS
      =================================================== */}

      <section className="dashboard-module-grid">

        {moduleCards.map(
          card => {

            const ModuleIcon =
              card.icon;


            const active =
              selectedModule ===
              card.key;


            return (
              <button
                type="button"
                key={
                  card.key
                }
                className={`dashboard-module-card ${
                  active
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedModule(
                    card.key
                  )
                }
              >

                <div className="module-card-header">

                  <div className="module-card-title">

                    <div className="module-card-icon">

                      <ModuleIcon
                        size={18}
                      />

                    </div>


                    <div>

                      <h2>
                        {
                          card.title
                        }
                      </h2>


                      <span>
                        {
                          card.subtitle
                        }
                      </span>

                    </div>

                  </div>


                  <div className="module-header-total">

                    <span>
                      {
                        card.totalLabel
                      }
                    </span>


                    <strong>

                      {loading
                        ? "-"
                        : card.total}

                    </strong>

                  </div>

                </div>

              </button>
            );

          }
        )}

      </section>


      {/* ===================================================
          ANALYTICS HEADER
      =================================================== */}

      <section className="selected-module-heading">

        <div>

          <span>
            Module Analytics
          </span>


          <h2>
            {
              selectedCard.title
            }{" "}
            Overview
          </h2>

        </div>


        <div className="selected-module-indicator">

          <CircleDot
            size={12}
          />

          Live Data

        </div>

      </section>


      {/* ===================================================
          CHARTS
      =================================================== */}

      <section className="dashboard-dynamic-charts">

        {
          renderSelectedCharts()
        }

      </section>

    </main>
  );

};


export default DashContent;