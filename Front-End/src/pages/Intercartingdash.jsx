import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  Car,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  PauseCircle,
  Search,
  Truck,
  Wrench,
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

import "../pagescss/intercartingdash.css";


/* =========================================================
   API
========================================================= */

const API_BASE_URL =
  (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  ).replace(
    /\/+$/,
    ""
  );

const VEHICLE_API =
  `${API_BASE_URL}/api/vehicles`;

const RECORDS_PER_PAGE = 15;


/* =========================================================
   CHART COLORS
========================================================= */

const OWNERSHIP_COLORS = {
  OTC: "#0f9488",
  Market: "#2f7de1",
};


const CATEGORY_COLORS = [
  "#0f9488",
  "#2f7de1",
  "#f28c18",
  "#8a5cc7",
  "#8393a3",
  "#16a05d",
  "#d946b8",
  "#0891b2",
  "#eab308",
  "#64748b",
];


/* =========================================================
   VEHICLE ID
========================================================= */

const getVehicleId = (
  vehicle
) => {

  const rawId =
    vehicle?._id ??
    vehicle?.id ??
    vehicle?.vehicleNumber;


  if (
    rawId &&
    typeof rawId === "object"
  ) {

    return (
      rawId.$oid ||
      vehicle?.vehicleNumber ||
      ""
    );

  }


  return rawId;

};


/* =========================================================
   VEHICLE STATUS
========================================================= */

const getVehicleStatus = (
  vehicle
) => {

  const isActive =
    vehicle?.activeStatus ??
    vehicle?.active ??
    false;


  const rawStatus =
    String(
      vehicle?.status ??
      ""
    )
      .trim()
      .toLowerCase();


  if (
    rawStatus === "maintenance" ||
    rawStatus === "in maintenance" ||
    rawStatus === "under maintenance"
  ) {

    return {
      isActive: false,
      key: "maintenance",
      label: "Maintenance",
    };

  }


  if (
    isActive === true ||
    rawStatus === "active"
  ) {

    return {
      isActive: true,
      key: "active",
      label: "Active",
    };

  }


  return {
    isActive: false,
    key: "inactive",
    label: "Inactive",
  };

};


/* =========================================================
   MONGODB DATE
========================================================= */

const normalizeDateValue = (
  value
) => {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return null;

  }


  if (
    typeof value === "object"
  ) {

    if (
      value.$date !== undefined
    ) {

      return normalizeDateValue(
        value.$date
      );

    }


    if (
      value.$numberLong !==
      undefined
    ) {

      return Number(
        value.$numberLong
      );

    }


    return null;

  }


  return value;

};


/* =========================================================
   FORMAT DATE
========================================================= */

const formatDate = (
  value
) => {

  const safeValue =
    normalizeDateValue(
      value
    );


  if (!safeValue) {

    return "-";

  }


  const date =
    new Date(
      safeValue
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "-";

  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

};


/* =========================================================
   OWNERSHIP TYPE
========================================================= */

const getOwnershipType = (
  vehicle
) => {

  const values = [

    vehicle?.ownership,

    vehicle?.ownershipType,

    vehicle?.vehicleOwnership,

    vehicle?.fleetType,

    vehicle?.transportProvider,

    vehicle?.provider,

  ];


  const combined =
    values
      .filter(
        (
          value
        ) =>
          value !== null &&
          value !== undefined
      )
      .map(
        (
          value
        ) =>
          String(
            value
          )
            .trim()
            .toLowerCase()
      )
      .join(" ");


  if (
    combined.includes(
      "otc"
    ) ||
    combined.includes(
      "own"
    ) ||
    combined.includes(
      "owned"
    )
  ) {

    return "OTC";

  }


  return "Market";

};


/* =========================================================
   PERCENTAGE
========================================================= */

const calculatePercentage = (
  value,
  total
) => {

  if (
    !total ||
    total <= 0
  ) {

    return "0.0";

  }


  return (
    (
      Number(value) /
      Number(total)
    ) *
    100
  ).toFixed(1);

};


/* =========================================================
   COMPONENT
========================================================= */

const Intercartingdash = () => {

  /* =====================================================
     STATE
  ====================================================== */

  const [
    vehicles,
    setVehicles,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    searchText,
    setSearchText,
  ] = useState("");


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  const [
    selectedOwnership,
    setSelectedOwnership,
  ] = useState(null);


  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState(null);


  /* =====================================================
     INTERCARTING SESSION
  ====================================================== */

  useEffect(
    () => {

      sessionStorage.removeItem(
        "intercartingLoggedIn"
      );

    },
    []
  );


  /* =====================================================
     FETCH VEHICLES
  ====================================================== */

  const fetchVehicles =
    useCallback(
      async () => {

        try {

          setLoading(
            true
          );

          setError(
            ""
          );


          const response =
            await axios.get(
              VEHICLE_API,
              {
                timeout:
                  60000,
              }
            );


          const vehicleData =
            Array.isArray(
              response.data
            )
              ? response.data

              : Array.isArray(
                  response.data
                    ?.vehicles
                )
                ? response.data
                    .vehicles

                : Array.isArray(
                    response.data
                      ?.data
                  )
                  ? response.data
                      .data

                  : [];


          setVehicles(
            vehicleData
          );

        } catch (
          requestError
        ) {

          console.error(
            "Vehicle fetch error:",
            requestError
              .response?.data ||
            requestError.message
          );


          setVehicles(
            []
          );


          setError(
            requestError
              .response?.data
              ?.message ||
            "Unable to load vehicle details."
          );

        } finally {

          setLoading(
            false
          );

        }

      },
      []
    );


  /* =====================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(
    () => {

      fetchVehicles();

    },
    [
      fetchVehicles,
    ]
  );


  /* =====================================================
     SEARCH
  ====================================================== */

  const filteredVehicles =
    useMemo(
      () => {

        const query =
          searchText
            .trim()
            .toLowerCase();


        if (!query) {

          return vehicles;

        }


        return vehicles.filter(
          (
            vehicle
          ) => {

            const searchableValues = [

              vehicle
                ?.vehicleNumber,

              vehicle
                ?.siteName,

              vehicle
                ?.vehicleType,

              vehicle
                ?.transportProvider,

              vehicle
                ?.dieselScope,

            ];


            return searchableValues.some(
              (
                value
              ) =>

                String(
                  value ??
                  ""
                )
                  .toLowerCase()
                  .includes(
                    query
                  )

            );

          }
        );

      },
      [
        vehicles,
        searchText,
      ]
    );


  /* =====================================================
     STATISTICS
  ====================================================== */

  const vehicleStatistics =
    useMemo(
      () => {

        let active = 0;

        let maintenance = 0;

        let inactive = 0;


        vehicles.forEach(
          (
            vehicle
          ) => {

            const status =
              getVehicleStatus(
                vehicle
              );


            if (
              status.key ===
              "maintenance"
            ) {

              maintenance += 1;

            } else if (
              status.key ===
              "active"
            ) {

              active += 1;

            } else {

              inactive += 1;

            }

          }
        );


        return {

          total:
            vehicles.length,

          active,

          maintenance,

          inactive,

        };

      },
      [
        vehicles,
      ]
    );


  /* =====================================================
     VEHICLES BY SITE
  ====================================================== */

  const siteWiseChartData =
    useMemo(
      () => {

        const siteCounts = {};


        vehicles.forEach(
          (
            vehicle
          ) => {

            const siteName =
              String(
                vehicle?.siteName ||
                "Unspecified Site"
              ).trim() ||
              "Unspecified Site";


            siteCounts[
              siteName
            ] =
              (
                siteCounts[
                  siteName
                ] ||
                0
              ) +
              1;

          }
        );


        return Object.entries(
          siteCounts
        )
          .map(
            (
              [
                name,
                total,
              ]
            ) => ({

              name,

              total,

            })
          )
          .sort(
            (
              first,
              second
            ) =>
              second.total -
              first.total
          );

      },
      [
        vehicles,
      ]
    );


  /* =====================================================
     OTC VS MARKET
  ====================================================== */

  const ownershipChartData =
    useMemo(
      () => {

        let otc = 0;

        let market = 0;


        vehicles.forEach(
          (
            vehicle
          ) => {

            if (
              getOwnershipType(
                vehicle
              ) ===
              "OTC"
            ) {

              otc += 1;

            } else {

              market += 1;

            }

          }
        );


        return [

          {
            name:
              "OTC",
            value:
              otc,
          },

          {
            name:
              "Market",
            value:
              market,
          },

        ];

      },
      [
        vehicles,
      ]
    );


  /* =====================================================
     VEHICLE CATEGORY
  ====================================================== */

  const categoryChartData =
    useMemo(
      () => {

        const categories = {};


        vehicles.forEach(
          (
            vehicle
          ) => {

            const category =
              String(
                vehicle?.vehicleType ||
                "Others"
              ).trim() ||
              "Others";


            categories[
              category
            ] =
              (
                categories[
                  category
                ] ||
                0
              ) +
              1;

          }
        );


        return Object.entries(
          categories
        )
          .map(
            (
              [
                name,
                value,
              ]
            ) => ({

              name,

              value,

            })
          )
          .sort(
            (
              first,
              second
            ) =>
              second.value -
              first.value
          );

      },
      [
        vehicles,
      ]
    );


  /* =====================================================
     OWNERSHIP CLICK
  ====================================================== */

  const handleOwnershipClick = (
    name
  ) => {

    if (!name) {

      return;

    }


    setSelectedOwnership(
      (
        previous
      ) =>
        previous === name
          ? null
          : name
    );

  };


  /* =====================================================
     CATEGORY CLICK
  ====================================================== */

  const handleCategoryClick = (
    name
  ) => {

    if (!name) {

      return;

    }


    setSelectedCategory(
      (
        previous
      ) =>
        previous === name
          ? null
          : name
    );

  };


  /* =====================================================
     SEARCH → PAGE 1
  ====================================================== */

  useEffect(
    () => {

      setCurrentPage(
        1
      );

    },
    [
      searchText,
    ]
  );


  /* =====================================================
     PAGINATION
  ====================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredVehicles
          .length /
        RECORDS_PER_PAGE
      )
    );


  useEffect(
    () => {

      if (
        currentPage >
        totalPages
      ) {

        setCurrentPage(
          totalPages
        );

      }

    },
    [
      currentPage,
      totalPages,
    ]
  );


  const startIndex =
    (
      currentPage -
      1
    ) *
    RECORDS_PER_PAGE;


  const endIndex =
    startIndex +
    RECORDS_PER_PAGE;


  const paginatedVehicles =
    filteredVehicles.slice(
      startIndex,
      endIndex
    );


  const showingStart =
    filteredVehicles
      .length ===
    0
      ? 0
      : startIndex +
        1;


  const showingEnd =
    Math.min(
      endIndex,
      filteredVehicles
        .length
    );


  /* =====================================================
     PREVIOUS PAGE
  ====================================================== */

  const goToPreviousPage =
    () => {

      setCurrentPage(
        (
          page
        ) =>
          Math.max(
            1,
            page - 1
          )
      );

    };


  /* =====================================================
     NEXT PAGE
  ====================================================== */

  const goToNextPage =
    () => {

      setCurrentPage(
        (
          page
        ) =>
          Math.min(
            totalPages,
            page + 1
          )
      );

    };


  /* =====================================================
     RENDER
  ====================================================== */

  return (

    <main
      className="intercarting-dashboard"
    >


      {/* =================================================
          ERROR
      ================================================== */}

      {error && (

        <div
          className="intercarting-dashboard-error"
          role="alert"
        >

          {error}

        </div>

      )}


      {/* =================================================
          STAT CARDS
      ================================================== */}

      <section
        className="intercarting-dashboard-stats"
        aria-label="Vehicle statistics"
      >


        {/* TOTAL */}

        <article
          className="intercarting-stat-card"
        >

          <div
            className="intercarting-stat-icon total"
          >

            <Car
              size={23}
            />

          </div>


          <div>

            <span>
              Total Vehicles
            </span>

            <strong>
              {
                vehicleStatistics
                  .total
              }
            </strong>

            <small>
              Registered fleet assets
            </small>

          </div>

        </article>


        {/* ACTIVE */}

        <article
          className="intercarting-stat-card"
        >

          <div
            className="intercarting-stat-icon active"
          >

            <CircleCheck
              size={23}
            />

          </div>


          <div>

            <span>
              Active On-Road
            </span>

            <strong>
              {
                vehicleStatistics
                  .active
              }
            </strong>

            <small>
              Currently operational
            </small>

          </div>

        </article>


        {/* MAINTENANCE */}

        <article
          className="intercarting-stat-card"
        >

          <div
            className="intercarting-stat-icon maintenance"
          >

            <Wrench
              size={23}
            />

          </div>


          <div>

            <span>
              In Maintenance
            </span>

            <strong>
              {
                vehicleStatistics
                  .maintenance
              }
            </strong>

            <small>
              Under service
            </small>

          </div>

        </article>


        {/* OFF DUTY */}

        <article
          className="intercarting-stat-card"
        >

          <div
            className="intercarting-stat-icon inactive"
          >

            <PauseCircle
              size={23}
            />

          </div>


          <div>

            <span>
              Off-Duty
            </span>

            <strong>
              {
                vehicleStatistics
                  .inactive
              }
            </strong>

            <small>
              Currently inactive
            </small>

          </div>

        </article>

      </section>


      {/* =================================================
          VEHICLES BY SITE
      ================================================== */}

      <section
        className="intercarting-site-chart-card"
      >

        <div
          className="intercarting-site-chart-header"
        >

          <div>

            <span>
              Fleet Overview
            </span>

            <h2>
              Vehicles by Site
            </h2>

            <p>
              Vehicle allocation across
              operating locations
            </p>

          </div>


          <div
            className="site-total-badge"
          >

            <small>
              TOTAL FLEET
            </small>

            <strong>
              {
                vehicleStatistics
                  .total
              }
            </strong>

          </div>

        </div>


        <div
          className="intercarting-site-chart-body"
        >

          {loading ? (

            <div
              className="intercarting-chart-state"
            >

              Loading chart...

            </div>

          ) : siteWiseChartData
              .length ===
            0 ? (

            <div
              className="intercarting-chart-state"
            >

              No site data available.

            </div>

          ) : (

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  siteWiseChartData
                }
                margin={{
                  top: 28,
                  right: 16,
                  bottom: 8,
                  left: -12,
                }}
                barCategoryGap="38%"
              >

                <CartesianGrid
                  vertical={false}
                  stroke="#dfe8ed"
                  strokeDasharray="4 4"
                />


                <XAxis
                  dataKey="name"
                  axisLine={{
                    stroke:
                      "#d5e0e6",
                  }}
                  tickLine={false}
                  interval={0}
                  tick={{
                    fill:
                      "#455f74",
                    fontSize:
                      10,
                  }}
                />


                <YAxis
                  allowDecimals={
                    false
                  }
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill:
                      "#6d8293",
                    fontSize:
                      9,
                  }}
                />


                <Tooltip
                  cursor={{
                    fill:
                      "rgba(15,148,136,0.04)",
                  }}
                  formatter={(
                    value
                  ) => [
                    value,
                    "Vehicles",
                  ]}
                  labelFormatter={(
                    label
                  ) =>
                    `Site: ${label}`
                  }
                  contentStyle={{
                    border:
                      "1px solid #dce5e9",
                    borderRadius:
                      "9px",
                    background:
                      "#ffffff",
                    boxShadow:
                      "0 10px 24px rgba(11,41,66,.10)",
                    fontSize:
                      "10px",
                  }}
                />


                <Bar
                  dataKey="total"
                  fill="#0f9488"
                  maxBarSize={60}
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                >

                  <LabelList
                    dataKey="total"
                    position="top"
                    fill="#0b2942"
                    fontSize={9}
                    fontWeight={700}
                  />

                </Bar>

              </BarChart>

            </ResponsiveContainer>

          )}

        </div>

      </section>


      {/* =================================================
          DONUT CHARTS
      ================================================== */}

      <section
        className="fleet-secondary-charts"
      >


        {/* =================================================
            OTC VS MARKET
        ================================================== */}

        <article
          className="fleet-modern-chart-card"
        >

          <div
            className="fleet-modern-chart-header"
          >

            <div>

              <span>
                OWNERSHIP
              </span>

              <h2>
                OTC vs Market
              </h2>

              <p>
                Fleet ownership distribution
              </p>

            </div>


            <div
              className="fleet-chart-header-total"
            >

              <small>
                TOTAL
              </small>

              <strong>
                {
                  vehicleStatistics
                    .total
                }
              </strong>

            </div>

          </div>


          <div
            className="fleet-modern-chart-content"
          >


            {/* DONUT */}

            <div
              className="fleet-modern-donut"
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={
                      ownershipChartData
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="88%"
                    paddingAngle={2}
                    stroke="none"
                    onClick={(
                      data
                    ) =>
                      handleOwnershipClick(
                        data?.name
                      )
                    }
                  >

                    {ownershipChartData.map(
                      (
                        item
                      ) => {

                        const active =
                          selectedOwnership ===
                            null ||
                          selectedOwnership ===
                            item.name;


                        return (

                          <Cell
                            key={
                              item.name
                            }
                            fill={
                              OWNERSHIP_COLORS[
                                item.name
                              ]
                            }
                            opacity={
                              active
                                ? 1
                                : 0.22
                            }
                            className="fleet-pie-cell"
                          />

                        );

                      }
                    )}

                  </Pie>


                  <Tooltip
                    formatter={(
                      value,
                      name
                    ) => [

                      `${value} vehicles`,

                      name,

                    ]}
                    contentStyle={{
                      border:
                        "1px solid #dce5e9",
                      borderRadius:
                        "9px",
                      background:
                        "#ffffff",
                      boxShadow:
                        "0 10px 25px rgba(11,41,66,.11)",
                      fontSize:
                        "10px",
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>


              <div
                className="fleet-modern-donut-center"
              >

                <strong>
                  {
                    vehicleStatistics
                      .total
                  }
                </strong>

                <span>
                  Total Vehicles
                </span>

              </div>

            </div>


            {/* LEGEND */}

            <div
              className="fleet-modern-legend"
            >

              {ownershipChartData.map(
                (
                  item
                ) => (

                  <button
                    type="button"
                    key={
                      item.name
                    }
                    className={`fleet-modern-legend-row ${
                      selectedOwnership ===
                        item.name
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleOwnershipClick(
                        item.name
                      )
                    }
                  >

                    <div
                      className="fleet-legend-left"
                    >

                      <i
                        style={{
                          background:
                            OWNERSHIP_COLORS[
                              item.name
                            ],
                        }}
                      />


                      <span>
                        {
                          item.name
                        }
                      </span>

                    </div>


                    <div
                      className="fleet-legend-right"
                    >

                      <strong>
                        {
                          item.value
                        }
                      </strong>


                      <small>
                        {
                          calculatePercentage(
                            item.value,
                            vehicleStatistics
                              .total
                          )
                        }
                        %
                      </small>

                    </div>

                  </button>

                )
              )}

            </div>

          </div>

        </article>


        {/* =================================================
            VEHICLE CATEGORY
        ================================================== */}

        <article
          className="fleet-modern-chart-card"
        >

          <div
            className="fleet-modern-chart-header"
          >

            <div>

              <span>
                FLEET MIX
              </span>

              <h2>
                Vehicle Category
              </h2>

              <p>
                Distribution by vehicle type
              </p>

            </div>


            <div
              className="fleet-chart-header-total"
            >

              <small>
                TYPES
              </small>

              <strong>
                {
                  categoryChartData
                    .length
                }
              </strong>

            </div>

          </div>


          <div
            className="fleet-modern-chart-content"
          >


            {/* DONUT */}

            <div
              className="fleet-modern-donut"
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={
                      categoryChartData
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="88%"
                    paddingAngle={2}
                    stroke="none"
                    onClick={(
                      data
                    ) =>
                      handleCategoryClick(
                        data?.name
                      )
                    }
                  >

                    {categoryChartData.map(
                      (
                        item,
                        index
                      ) => {

                        const active =
                          selectedCategory ===
                            null ||
                          selectedCategory ===
                            item.name;


                        return (

                          <Cell
                            key={
                              item.name
                            }
                            fill={
                              CATEGORY_COLORS[
                                index %
                                  CATEGORY_COLORS.length
                              ]
                            }
                            opacity={
                              active
                                ? 1
                                : 0.22
                            }
                            className="fleet-pie-cell"
                          />

                        );

                      }
                    )}

                  </Pie>


                  <Tooltip
                    formatter={(
                      value,
                      name
                    ) => [

                      `${value} vehicles`,

                      name,

                    ]}
                    contentStyle={{
                      border:
                        "1px solid #dce5e9",
                      borderRadius:
                        "9px",
                      background:
                        "#ffffff",
                      boxShadow:
                        "0 10px 25px rgba(11,41,66,.11)",
                      fontSize:
                        "10px",
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>


              <div
                className="fleet-modern-donut-center"
              >

                <strong>
                  {
                    vehicleStatistics
                      .total
                  }
                </strong>

                <span>
                  Total Vehicles
                </span>

              </div>

            </div>


            {/* LEGEND */}

            <div
              className="fleet-modern-legend category"
            >

              {categoryChartData.map(
                (
                  item,
                  index
                ) => (

                  <button
                    type="button"
                    key={
                      item.name
                    }
                    className={`fleet-modern-legend-row ${
                      selectedCategory ===
                        item.name
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleCategoryClick(
                        item.name
                      )
                    }
                  >

                    <div
                      className="fleet-legend-left"
                    >

                      <i
                        style={{
                          background:
                            CATEGORY_COLORS[
                              index %
                                CATEGORY_COLORS.length
                            ],
                        }}
                      />


                      <span
                        title={
                          item.name
                        }
                      >
                        {
                          item.name
                        }
                      </span>

                    </div>


                    <div
                      className="fleet-legend-right"
                    >

                      <strong>
                        {
                          item.value
                        }
                      </strong>


                      <small>
                        {
                          calculatePercentage(
                            item.value,
                            vehicleStatistics
                              .total
                          )
                        }
                        %
                      </small>

                    </div>

                  </button>

                )
              )}

            </div>

          </div>

        </article>

      </section>


      {/* =================================================
          VEHICLE LIST
      ================================================== */}

      <section
        className="intercarting-vehicle-panel"
      >

        <div
          className="intercarting-vehicle-panel-header"
        >

          <div>

            <h2>
              Vehicle List
            </h2>

            <p>
              Complete fleet vehicle
              information
            </p>

          </div>


          <div
            className="intercarting-vehicle-panel-actions"
          >

            <div
              className="intercarting-dashboard-search"
            >

              <Search
                size={18}
                aria-hidden="true"
              />


              <input
                type="search"
                value={
                  searchText
                }
                placeholder="Search vehicle..."
                onChange={(
                  event
                ) =>
                  setSearchText(
                    event.target
                      .value
                  )
                }
              />

            </div>


            <div
              className="intercarting-vehicle-count"
            >

              <Truck
                size={17}
              />


              <span>

                {
                  filteredVehicles
                    .length
                }{" "}
                vehicles

              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            TABLE
        ================================================== */}

        <div
          className="intercarting-table-wrapper"
        >

          <table
            className="intercarting-vehicle-table"
          >

            <thead>

              <tr>

                <th>
                  S.No
                </th>

                <th>
                  Vehicle No
                </th>

                <th>
                  Site Name
                </th>

                <th>
                  Vehicle Type
                </th>

                <th>
                  Transport Provider
                </th>

                <th>
                  Diesel Scope
                </th>

                <th>
                  Vehicle In Date
                </th>

                <th>
                  Vehicle Out Date
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={9}
                    className="intercarting-table-message"
                  >

                    Loading vehicle
                    details...

                  </td>

                </tr>

              ) : paginatedVehicles
                  .length ===
                0 ? (

                <tr>

                  <td
                    colSpan={9}
                    className="intercarting-table-message"
                  >

                    No vehicles found.

                  </td>

                </tr>

              ) : (

                paginatedVehicles.map(
                  (
                    vehicle,
                    index
                  ) => {

                    const status =
                      getVehicleStatus(
                        vehicle
                      );


                    return (

                      <tr
                        key={
                          getVehicleId(
                            vehicle
                          ) ??
                          `${startIndex}-${index}`
                        }
                      >

                        <td>

                          {
                            startIndex +
                            index +
                            1
                          }

                        </td>


                        <td>

                          {
                            vehicle
                              ?.vehicleNumber ||
                            "-"
                          }

                        </td>


                        <td>

                          {
                            vehicle
                              ?.siteName ||
                            "-"
                          }

                        </td>


                        <td>

                          {
                            vehicle
                              ?.vehicleType ||
                            "-"
                          }

                        </td>


                        <td>

                          {
                            vehicle
                              ?.transportProvider ||
                            "-"
                          }

                        </td>


                        <td>

                          {
                            vehicle
                              ?.dieselScope ||
                            "-"
                          }

                        </td>


                        <td>

                          {
                            formatDate(
                              vehicle
                                ?.vehicleInDate
                            )
                          }

                        </td>


                        <td>

                          {
                            formatDate(
                              vehicle
                                ?.vehicleOutDate
                            )
                          }

                        </td>


                        <td>

                          <span
                            className={`intercarting-status ${
                              status.isActive
                                ? "active"
                                : "inactive"
                            }`}
                          >

                            {
                              status.label
                            }

                          </span>

                        </td>

                      </tr>

                    );

                  }
                )

              )}

            </tbody>

          </table>

        </div>


        {/* =================================================
            PAGINATION
        ================================================== */}

        <footer
          className="intercarting-pagination"
        >

          <p>

            Showing{" "}

            <strong>

              {
                showingStart
              }
              –
              {
                showingEnd
              }

            </strong>

            {" "}of{" "}

            <strong>

              {
                filteredVehicles
                  .length
              }

            </strong>

            {" "}vehicles

          </p>


          <div
            className="intercarting-pagination-controls"
          >

            <button
              type="button"
              disabled={
                currentPage ===
                1
              }
              onClick={
                goToPreviousPage
              }
            >

              <ChevronLeft
                size={17}
              />

            </button>


            {Array.from(
              {
                length:
                  totalPages,
              },
              (
                _,
                index
              ) =>
                index + 1
            ).map(
              (
                page
              ) => (

                <button
                  type="button"
                  key={
                    page
                  }
                  className={
                    currentPage ===
                    page
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCurrentPage(
                      page
                    )
                  }
                >

                  {page}

                </button>

              )
            )}


            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={
                goToNextPage
              }
            >

              <ChevronRight
                size={17}
              />

            </button>

          </div>

        </footer>

      </section>

    </main>

  );

};


export default Intercartingdash;