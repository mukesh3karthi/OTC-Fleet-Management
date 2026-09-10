import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Truck,
  X,
  XCircle,
} from "lucide-react";

import "./traffic.css";


/* =========================================================
   API
========================================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const TRIP_API_URL =
  `${API_BASE_URL}/api/triptracking`;


/* =========================================================
   HELPERS
========================================================= */

const extractTripList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.trips)) {
    return payload.trips;
  }

  return [];
};


const extractTrip = (payload) =>
  payload?.data ||
  payload?.trip ||
  payload;


const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
};


const formatAmount = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  const number =
    Number(value);

  if (
    Number.isNaN(number)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(number);
};


const createQuotation = () => ({
  quotationId:
    `Q-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,

  transportName: "",

  amount: "",

  status: "Pending",
});


const getOrderVehicles = (
  order
) => {
  if (
    Array.isArray(
      order?.vehicles
    ) &&
    order.vehicles.length
  ) {
    return order.vehicles;
  }

  return [
    {
      vehicleSubId:
        `${order?.tripId || "TRIP"}-V1`,

      vehicleType:
        order?.primaryVehicleType ||
        order?.vehicleType ||
        "",

      quantity:
        Number(
          order?.requiredVehicles ||
          order?.vehicleCount ||
          1
        ),

      placementDate:
        order?.placementDate ||
        order?.deploymentDate ||
        null,

      transportOptions: [],

      quotationStatus:
        "Quotation Pending",
    },
  ];
};


const getVehicleQuantity = (
  vehicle
) =>
  Number(
    vehicle?.quantity || 0
  );


const getTotalVehicleQuantity = (
  order
) =>
  getOrderVehicles(order)
    .reduce(
      (
        total,
        vehicle
      ) =>
        total +
        getVehicleQuantity(
          vehicle
        ),
      0
    );


const normalizeQuotationStatus = (
  status
) => {
  switch (status) {
    case "Selected":
    case "Approved":
      return "Approved";

    case "Rejected":
    case "Options Rejected":
      return "Rejected";

    case "Revision Requested":
      return "Revision Requested";

    case "Submitted":
    case "Waiting for Selection":
    case "Approval Pending":
      return "Approval Pending";

    case "Quotation Pending":
    case "Pending":
    default:
      return "Quotation Pending";
  }
};


const getOrderQuotationStatus = (
  order
) => {
  const vehicles =
    getOrderVehicles(order);

  if (!vehicles.length) {
    return "Quotation Pending";
  }

  const statuses =
    vehicles.map(
      (vehicle) =>
        normalizeQuotationStatus(
          vehicle.quotationStatus
        )
    );


  if (
    statuses.every(
      (status) =>
        status ===
        "Approved"
    )
  ) {
    return "Approved";
  }


  if (
    statuses.some(
      (status) =>
        status ===
        "Revision Requested"
    )
  ) {
    return "Revision Requested";
  }


  if (
    statuses.some(
      (status) =>
        status ===
        "Rejected"
    )
  ) {
    return "Rejected";
  }


  if (
    statuses.some(
      (status) =>
        status ===
        "Approval Pending"
    )
  ) {
    return "Approval Pending";
  }


  return "Quotation Pending";
};


const getStatusClass = (
  status
) => {
  switch (status) {
    case "Approved":
      return "selected";

    case "Rejected":
      return "rejected";

    case "Revision Requested":
      return "revision";

    case "Approval Pending":
      return "waiting";

    default:
      return "pending";
  }
};


const StatusIcon = ({
  status,
}) => {
  switch (status) {
    case "Approved":
      return (
        <CheckCircle2
          size={13}
        />
      );

    case "Rejected":
      return (
        <XCircle
          size={13}
        />
      );

    case "Revision Requested":
      return (
        <CircleAlert
          size={13}
        />
      );

    case "Approval Pending":
      return (
        <Clock3
          size={13}
        />
      );

    default:
      return (
        <Clock3
          size={13}
        />
      );
  }
};


/* =========================================================
   TRAFFIC
========================================================= */

const Traffic = () => {
  const [
    orders,
    setOrders,
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
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);

  const [
    vehicleForms,
    setVehicleForms,
  ] = useState([]);

  const [
    savingVehicleId,
    setSavingVehicleId,
  ] = useState(null);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    trafficAllocatedBy,
    setTrafficAllocatedBy,
  ] = useState("");


  /* =========================================================
     FETCH APPROVED ORDERS
  ========================================================= */

  const fetchOrders =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            TRIP_API_URL
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            result.message ||
            "Unable to load traffic requests."
          );
        }

        const allOrders =
          extractTripList(
            result
          );

        const approvedOrders =
          allOrders.filter(
            (order) =>
              order.approvalStatus ===
              "Approved"
          );

        setOrders(
          approvedOrders
        );


        if (selectedOrder) {
          const fresh =
            approvedOrders.find(
              (order) =>
                order._id ===
                selectedOrder._id
            );

          if (fresh) {
            setSelectedOrder(
              fresh
            );

            loadVehicleForms(
              fresh
            );
          }
        }

      } catch (err) {
        console.error(
          "Traffic Fetch Error:",
          err
        );

        setError(
          err.message ||
          "Unable to load requests."
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    fetchOrders();
  }, []);


  /* =========================================================
     LOAD MODAL VEHICLES
  ========================================================= */

  const loadVehicleForms = (
    order
  ) => {
    const vehicles =
      getOrderVehicles(
        order
      );

    const normalized =
      vehicles.map(
        (
          vehicle,
          index
        ) => {
          let transportOptions =
            Array.isArray(
              vehicle.transportOptions
            )
              ? vehicle.transportOptions.map(
                  (
                    option,
                    optionIndex
                  ) => ({
                    quotationId:
                      option.quotationId ||
                      `${vehicle.vehicleSubId || index}-Q${optionIndex + 1}`,

                    transportName:
                      option.transportName ||
                      "",

                    amount:
                      option.amount ??
                      "",

                    status:
                      option.status ||
                      "Pending",
                  })
                )
              : [];


          if (
            transportOptions.length ===
              0 &&
            normalizeQuotationStatus(
              vehicle.quotationStatus
            ) !==
              "Approved"
          ) {
            transportOptions = [
              createQuotation(),
            ];
          }


          return {
            ...vehicle,

            vehicleSubId:
              vehicle.vehicleSubId ||
              `${
                order.tripId ||
                "TRIP"
              }-V${index + 1}`,

            placementDate:
              vehicle.placementDate ||
              order.placementDate ||
              order.deploymentDate ||
              null,

            quotationStatus:
              normalizeQuotationStatus(
                vehicle.quotationStatus
              ),

            transportOptions,

            selectedTransport:
              vehicle.selectedTransport ||
              null,

            quotationRemark:
              vehicle.quotationRemark ||
              vehicle.transportRemark ||
              "",
          };
        }
      );

    setVehicleForms(
      normalized
    );
  };


  /* =========================================================
     OPEN ORDER
  ========================================================= */

  const handleOpenOrder = (
    order
  ) => {
    setSelectedOrder(
      order
    );

    loadVehicleForms(
      order
    );

    setTrafficAllocatedBy(
      order.trafficAllocatedBy ||
        ""
    );

    setMessage("");

    document.body.style.overflow =
      "hidden";
  };


  const handleCloseOrder =
    () => {
      setSelectedOrder(
        null
      );

      setVehicleForms([]);

      setTrafficAllocatedBy("");

      document.body.style.overflow =
        "";
    };


  /* =========================================================
     FILTER
  ========================================================= */

  const filteredOrders =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          const status =
            getOrderQuotationStatus(
              order
            );

          const matchesStatus =
            statusFilter ===
              "All" ||
            status ===
              statusFilter;


          const searchable = [
            order.tripId,
            order.id,
            order.client,
            order.customer,
            order.companyName,
            order.origin,
            order.destination,
            order.siteLocation,
            order.cargo,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          const matchesSearch =
            !text ||
            searchable.includes(
              text
            );


          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      orders,
      search,
      statusFilter,
    ]);


  /* =========================================================
     COUNTS
  ========================================================= */

  const counts =
    useMemo(() => {
      let pending = 0;
      let waiting = 0;
      let selected = 0;
      let action = 0;

      orders.forEach(
        (order) => {
          const status =
            getOrderQuotationStatus(
              order
            );

          if (
            status ===
            "Quotation Pending"
          ) {
            pending += 1;
          }

          if (
            status ===
            "Approval Pending"
          ) {
            waiting += 1;
          }

          if (
            status ===
            "Approved"
          ) {
            selected += 1;
          }

          if (
            status ===
              "Rejected" ||
            status ===
              "Revision Requested"
          ) {
            action += 1;
          }
        }
      );

      return {
        pending,
        waiting,
        selected,
        action,
      };
    }, [orders]);


  /* =========================================================
     QUOTATION INPUT
  ========================================================= */

  const handleQuotationChange = (
    vehicleIndex,
    quotationIndex,
    field,
    value
  ) => {
    setVehicleForms(
      (previous) =>
        previous.map(
          (
            vehicle,
            vIndex
          ) => {
            if (
              vIndex !==
              vehicleIndex
            ) {
              return vehicle;
            }

            const options = [
              ...vehicle.transportOptions,
            ];

            options[
              quotationIndex
            ] = {
              ...options[
                quotationIndex
              ],

              [field]:
                value,
            };

            return {
              ...vehicle,
              transportOptions:
                options,
            };
          }
        )
    );
  };


  /* =========================================================
     ADD OPTION
  ========================================================= */

  const handleAddTransport = (
    vehicleIndex
  ) => {
    setVehicleForms(
      (previous) =>
        previous.map(
          (
            vehicle,
            index
          ) =>
            index ===
            vehicleIndex
              ? {
                  ...vehicle,

                  transportOptions: [
                    ...(vehicle.transportOptions ||
                      []),

                    createQuotation(),
                  ],
                }
              : vehicle
        )
    );
  };


  /* =========================================================
     REMOVE OPTION
  ========================================================= */

  const handleRemoveTransport = (
    vehicleIndex,
    quotationIndex
  ) => {
    setVehicleForms(
      (previous) =>
        previous.map(
          (
            vehicle,
            index
          ) => {
            if (
              index !==
              vehicleIndex
            ) {
              return vehicle;
            }

            return {
              ...vehicle,

              transportOptions:
                vehicle.transportOptions.filter(
                  (
                    _,
                    optionIndex
                  ) =>
                    optionIndex !==
                    quotationIndex
                ),
            };
          }
        )
    );
  };


  /* =========================================================
     REQUEST APPROVAL FOR ALL VEHICLES
  ========================================================= */

  const handleRequestApproval =
    async () => {
      if (
        !selectedOrder?._id
      ) {
        setMessage(
          "Database order ID is missing."
        );

        return;
      }


      const allocatorName =
        String(
          trafficAllocatedBy ||
          ""
        ).trim();


      if (!allocatorName) {
        setMessage(
          "Please enter the Traffic Allocator name before requesting approval."
        );

        return;
      }


      if (
        !Array.isArray(
          vehicleForms
        ) ||
        vehicleForms.length ===
          0
      ) {
        setMessage(
          "No vehicle requirements found."
        );

        return;
      }


      const now =
        new Date()
          .toISOString();


      const updatedVehicles =
        [];

      let validationError =
        "";


      for (
        let vehicleIndex = 0;
        vehicleIndex <
        vehicleForms.length;
        vehicleIndex += 1
      ) {
        const vehicle =
          vehicleForms[
            vehicleIndex
          ];


        const status =
          normalizeQuotationStatus(
            vehicle.quotationStatus
          );


        if (
          status ===
          "Approved"
        ) {
          updatedVehicles.push(
            vehicle
          );

          continue;
        }


        const validOptions =
          (
            vehicle.transportOptions ||
            []
          )
            .map(
              (option) => ({
                ...option,

                transportName:
                  String(
                    option.transportName ||
                    ""
                  ).trim(),

                amount:
                  option.amount ===
                    "" ||
                  option.amount ===
                    null ||
                  option.amount ===
                    undefined
                    ? ""
                    : Number(
                        option.amount
                      ),
              })
            )
            .filter(
              (option) =>
                option.transportName ||
                option.amount !== ""
            );


        if (
          validOptions.length ===
          0
        ) {
          validationError =
            `Please enter at least one transport quotation for ${
              vehicle.vehicleType ||
              `Vehicle ${
                vehicleIndex + 1
              }`
            }.`;

          break;
        }


        const invalid =
          validOptions.some(
            (option) =>
              !option.transportName ||
              !Number.isFinite(
                Number(
                  option.amount
                )
              ) ||
              Number(
                option.amount
              ) <= 0
          );


        if (invalid) {
          validationError =
            `Enter Transport Name and valid Amount for every quotation in ${
              vehicle.vehicleType ||
              `Vehicle ${
                vehicleIndex + 1
              }`
            }.`;

          break;
        }


        updatedVehicles.push({
          ...vehicle,

          transportOptions:
            validOptions.map(
              (option) => ({
                ...option,

                status:
                  "Submitted",
              })
            ),

          quotationStatus:
            "Approval Pending",

          quotationSubmittedAt:
            now,

          vehicleApprovalRequested:
            true,

          vehicleApprovalStatus:
            "Pending",

          vehicleApprovalRequestedAt:
            now,

          vehicleApprovalReviewedAt:
            null,

          approvedQuotationId:
            "",

          vehicleApprovalRemarks:
            "",

          vehicleRejectionReason:
            "",

          quotationRemark:
            "",

          selectedTransport:
            null,
        });
      }


      if (validationError) {
        setMessage(
          validationError
        );

        return;
      }


      try {
        setSavingVehicleId(
          "__ALL__"
        );

        setMessage("");


        const payload = {
          ...selectedOrder,

          vehicles:
            updatedVehicles,

          trafficAllocatedBy:
            allocatorName,

          trafficAllocatedAt:
            now,

          trafficQuotationUpdatedAt:
            now,

          vehicleApprovalUpdatedAt:
            now,
        };


        delete payload._id;
        delete payload.id;
        delete payload.__v;
        delete payload.createdAt;
        delete payload.updatedAt;


        const response =
          await fetch(
            `${TRIP_API_URL}/${selectedOrder._id}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );


        const result =
          await response
            .json()
            .catch(
              () => ({})
            );


        if (!response.ok) {
          throw new Error(
            result.message ||
            "Unable to request vehicle allocation approval."
          );
        }


        const saved =
          extractTrip(
            result
          );


        const updatedOrder = {
          ...selectedOrder,

          ...(saved &&
          typeof saved ===
            "object"
            ? saved
            : {}),

          _id:
            selectedOrder._id,

          vehicles:
            saved?.vehicles ||
            updatedVehicles,
        };


        setSelectedOrder(
          updatedOrder
        );


        setOrders(
          (previous) =>
            previous.map(
              (order) =>
                order._id ===
                selectedOrder._id
                  ? updatedOrder
                  : order
            )
        );


        loadVehicleForms(
          updatedOrder
        );


        setMessage(
          "Vehicle allocation approval requested successfully."
        );

      } catch (err) {
        console.error(
          "Request Approval Error:",
          err
        );

        setMessage(
          err.message ||
          "Unable to request approval."
        );

      } finally {
        setSavingVehicleId(
          null
        );
      }
    };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="traffic-page">

      {/* HEADER */}

      <header className="traffic-page-header">

        <div>

          <span className="traffic-eyebrow">
            TRAFFIC MANAGEMENT
          </span>

          <h1>
            Transport Quotations
          </h1>

          <p>
            Add transport options and
            commercial rates for approved
            vehicle requirements.
          </p>

        </div>


        <button
          type="button"
          className="traffic-refresh-btn"
          onClick={
            fetchOrders
          }
          disabled={
            loading
          }
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? "traffic-spin"
                : ""
            }
          />

          Refresh
        </button>

      </header>


      {/* MESSAGE */}

      {message && (
        <div className="traffic-message">

          <span>
            {message}
          </span>

          <button
            type="button"
            onClick={() =>
              setMessage("")
            }
          >
            <X size={14} />
          </button>

        </div>
      )}


      {/* SUMMARY */}

      <section className="traffic-summary">

        <article>

          <div className="traffic-summary-icon pending">
            <Clock3 size={17} />
          </div>

          <div>
            <span>
              Quotation Pending
            </span>

            <strong>
              {counts.pending}
            </strong>
          </div>

        </article>


        <article>

          <div className="traffic-summary-icon waiting">
            <Send size={17} />
          </div>

          <div>
            <span>
              Approval Pending
            </span>

            <strong>
              {counts.waiting}
            </strong>
          </div>

        </article>


        <article>

          <div className="traffic-summary-icon selected">
            <CheckCircle2
              size={17}
            />
          </div>

          <div>
            <span>
              Approved
            </span>

            <strong>
              {counts.selected}
            </strong>
          </div>

        </article>


        <article>

          <div className="traffic-summary-icon action">
            <CircleAlert
              size={17}
            />
          </div>

          <div>
            <span>
              Need Action
            </span>

            <strong>
              {counts.action}
            </strong>
          </div>

        </article>

      </section>


      {/* MAIN CARD */}

      <section className="traffic-card">

        <div className="traffic-card-title">

          <div>

            <div className="traffic-title-icon">
              <Truck size={17} />
            </div>

            <div>

              <h2>
                Approved Order Requests
              </h2>

              <p>
                Click View Order to see
                vehicle requirements and
                quotation status.
              </p>

            </div>

          </div>


          <span className="traffic-order-count">
            {filteredOrders.length}
            {" "}
            Orders
          </span>

        </div>


        {/* FILTERS */}

        <div className="traffic-toolbar">

          <div className="traffic-search">

            <Search
              size={15}
            />

            <input
              type="text"
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search order, client or route..."
            />

          </div>


          <div className="traffic-filter-select">

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="All">
                All Status
              </option>

              <option value="Quotation Pending">
                Quotation Pending
              </option>

              <option value="Approval Pending">
                Approval Pending
              </option>

              <option value="Approved">
                Approved
              </option>

              <option value="Rejected">
                Rejected
              </option>

              <option value="Revision Requested">
                Revision Requested
              </option>

            </select>

            <ChevronDown
              size={14}
            />

          </div>

        </div>


        {/* TABLE */}

        <div className="traffic-table-wrap">

          <table className="traffic-order-table">

            <thead>

              <tr>

                <th>
                  S.No
                </th>

                <th>
                  Order ID
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Route / Site
                </th>

                <th>
                  Vehicles
                </th>

                <th>
                  Deployment Date
                </th>

                <th>
                  Quotation Status
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="8"
                    className="traffic-empty-row"
                  >
                    <RefreshCw
                      size={19}
                      className="traffic-spin"
                    />

                    Loading approved
                    orders...
                  </td>
                </tr>

              ) : error ? (

                <tr>
                  <td
                    colSpan="8"
                    className="traffic-empty-row error"
                  >
                    {error}
                  </td>
                </tr>

              ) :
              filteredOrders.length ===
              0 ? (

                <tr>
                  <td
                    colSpan="8"
                    className="traffic-empty-row"
                  >
                    No approved orders
                    found.
                  </td>
                </tr>

              ) : (

                filteredOrders.map(
                  (
                    order,
                    index
                  ) => {
                    const status =
                      getOrderQuotationStatus(
                        order
                      );

                    const route =
                      order.movementType ===
                        "Intercarting"
                        ? order.siteLocation ||
                          "—"
                        : `${
                            order.origin ||
                            "—"
                          } → ${
                            order.destination ||
                            "—"
                          }`;

                    return (

                      <tr
                        key={
                          order._id ||
                          order.tripId ||
                          index
                        }
                      >

                        <td>
                          <span className="traffic-sl">
                            {index + 1}
                          </span>
                        </td>


                        <td>

                          <strong className="traffic-order-id">
                            {order.tripId ||
                              order.id ||
                              "—"}
                          </strong>

                        </td>


                        <td>

                          <strong className="traffic-client">
                            {order.client ||
                              order.customer ||
                              "—"}
                          </strong>

                          <span className="traffic-company">
                            {order.companyName ||
                              ""}
                          </span>

                        </td>


                        <td>
                          <span className="traffic-route">
                            {route}
                          </span>
                        </td>


                        <td>

                          <span className="traffic-vehicle-count">

                            <Truck
                              size={12}
                            />

                            {getTotalVehicleQuantity(
                              order
                            )}{" "}
                            NOS

                          </span>

                        </td>


                        <td>

                          {formatDate(
                            order.placementDate ||
                              order.deploymentDate
                          )}

                        </td>


                        <td>

                          <span
                            className={`traffic-status ${getStatusClass(
                              status
                            )}`}
                          >

                            <StatusIcon
                              status={
                                status
                              }
                            />

                            {status}

                          </span>

                        </td>


                        <td>

                          <button
                            type="button"
                            className="traffic-view-btn"
                            onClick={() =>
                              handleOpenOrder(
                                order
                              )
                            }
                          >

                            <Eye
                              size={13}
                            />

                            View Order

                          </button>

                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </section>


      {/* =====================================================
          ORDER DETAILS MODAL
      ===================================================== */}

      {selectedOrder && (

        <div
          className="traffic-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseOrder();
            }
          }}
        >

          <div className="traffic-modal">

            {/* MODAL HEADER */}

            <div className="traffic-modal-header">

              <div className="traffic-modal-heading">

                <span>
                  TRANSPORT QUOTATION
                </span>

                <h2>
                  Vehicle Requirements
                </h2>

                <p>
                  {selectedOrder.tripId ||
                    selectedOrder.id}
                  {" • "}
                  {selectedOrder.client ||
                    selectedOrder.customer ||
                    "—"}
                </p>

              </div>


              <div className="traffic-modal-header-actions">

                <div className="traffic-allocator-field">

                  <label
                    htmlFor="traffic-allocated-by"
                  >
                    Traffic Allocator
                    <b>*</b>
                  </label>

                  <input
                    id="traffic-allocated-by"
                    type="text"
                    value={
                      trafficAllocatedBy
                    }
                    onChange={(
                      event
                    ) =>
                      setTrafficAllocatedBy(
                        event.target.value
                      )
                    }
                    placeholder="Enter your name"
                    autoComplete="name"
                  />

                  {selectedOrder.trafficAllocatedAt && (
                    <small>
                      Last allocation:{" "}
                      {formatDate(
                        selectedOrder
                          .trafficAllocatedAt
                      )}
                    </small>
                  )}

                </div>


                <button
                  type="button"
                  className="traffic-modal-close"
                  onClick={
                    handleCloseOrder
                  }
                  aria-label="Close quotation modal"
                >
                  <X size={17} />
                </button>

              </div>

            </div>


            {/* ORDER INFO */}

            <div className="traffic-order-overview">

              <div>
                <span>
                  Order ID
                </span>

                <strong>
                  {selectedOrder.tripId ||
                    selectedOrder.id ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  Customer
                </span>

                <strong>
                  {selectedOrder.client ||
                    selectedOrder.customer ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  Route
                </span>

                <strong>
                  {selectedOrder.movementType ===
                  "Intercarting"
                    ? selectedOrder.siteLocation ||
                      "—"
                    : `${
                        selectedOrder.origin ||
                        "—"
                      } → ${
                        selectedOrder.destination ||
                        "—"
                      }`}
                </strong>
              </div>


              <div>
                <span>
                  Deployment
                </span>

                <strong>
                  {formatDate(
                    selectedOrder.placementDate ||
                      selectedOrder.deploymentDate
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Vehicle Qty
                </span>

                <strong>
                  {getTotalVehicleQuantity(
                    selectedOrder
                  )}{" "}
                  NOS
                </strong>
              </div>

            </div>


            {/* VEHICLES */}

            <div className="traffic-modal-body">

              {vehicleForms.map(
                (
                  vehicle,
                  vehicleIndex
                ) => {
                  const status =
                    normalizeQuotationStatus(
                      vehicle.quotationStatus
                    );

                  const isSelected =
                    status ===
                    "Approved";

                  const vehicleKey =
                    vehicle.vehicleSubId ||
                    vehicleIndex;

                  return (

                    <section
                      className="traffic-vehicle-card"
                      key={
                        vehicleKey
                      }
                    >

                      {/* VEHICLE HEADER */}

                      <div className="traffic-vehicle-card-header">

                        <div className="traffic-vehicle-header-main">

                          <span className="traffic-vehicle-index">
                            {String(
                              vehicleIndex +
                                1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>


                          <div>

                            <h3>
                              {vehicle.vehicleType ||
                                "Vehicle"}
                            </h3>

                            <p>
                              {vehicle.quantity ||
                                0}{" "}
                              NOS
                              {" • "}
                              Deployment:
                              {" "}
                              {formatDate(
                                vehicle.placementDate
                              )}
                            </p>

                          </div>

                        </div>


                        <div className="traffic-vehicle-header-actions">

                          <span
                            className={`traffic-status ${getStatusClass(
                              status
                            )}`}
                          >

                            <StatusIcon
                              status={
                                status
                              }
                            />

                            {status}

                          </span>

                          {!isSelected && (
                            <button
                              type="button"
                              className="traffic-add-btn traffic-add-btn-header"
                              onClick={() =>
                                handleAddTransport(
                                  vehicleIndex
                                )
                              }
                            >
                              <Plus size={13} />
                              Add Transport
                            </button>
                          )}

                        </div>

                      </div>


                      {/* KAM RESPONSE */}

                      {(status ===
                        "Approved" ||
                        status ===
                          "Rejected" ||
                        status ===
                          "Revision Requested") && (

                        <div
                          className={`traffic-kam-response ${getStatusClass(
                            status
                          )}`}
                        >

                          <div>

                            <strong>
                              Management Response
                            </strong>


                            {status ===
                              "Approved" &&
                              vehicle.selectedTransport && (

                                <p>

                                  Selected{" "}

                                  <b>
                                    {
                                      vehicle
                                        .selectedTransport
                                        .transportName
                                    }
                                  </b>

                                  {" at "}

                                  <b>
                                    {formatAmount(
                                      vehicle
                                        .selectedTransport
                                        .amount
                                    )}
                                  </b>

                                </p>

                              )}


                            {status ===
                              "Rejected" && (

                                <p>
                                  Quotations rejected.
                                  {vehicle.quotationRemark
                                    ? ` ${vehicle.quotationRemark}`
                                    : ""}
                                </p>

                              )}


                            {status ===
                              "Revision Requested" && (

                                <p>
                                  New quotation /
                                  negotiation requested.
                                  {vehicle.quotationRemark
                                    ? ` ${vehicle.quotationRemark}`
                                    : ""}
                                </p>

                              )}

                          </div>

                        </div>

                      )}


                      {/* QUOTATION SECTION */}

                      <div className="traffic-quotation-section">

                        <div className="traffic-quotation-table-wrap">

                          <table className="traffic-quotation-table">

                            <thead>

                              <tr>

                                <th>
                                  S.No
                                </th>

                                <th>
                                  Transport Name
                                </th>

                                <th>
                                  Quoted Amount
                                </th>

                                <th>
                                  KAM Status
                                </th>

                                {!isSelected && (
                                  <th>
                                    Action
                                  </th>
                                )}

                              </tr>

                            </thead>


                            <tbody>

                              {vehicle.transportOptions?.length ? (

                                vehicle.transportOptions.map(
                                  (
                                    option,
                                    quotationIndex
                                  ) => {
                                    const selectedOption =
                                      vehicle.selectedTransport &&
                                      (
                                        vehicle.selectedTransport.quotationId ===
                                          option.quotationId ||
                                        (
                                          vehicle.selectedTransport.transportName ===
                                            option.transportName &&
                                          Number(
                                            vehicle.selectedTransport.amount
                                          ) ===
                                            Number(
                                              option.amount
                                            )
                                        )
                                      );


                                    return (

                                      <tr
                                        key={
                                          option.quotationId ||
                                          quotationIndex
                                        }
                                        className={
                                          selectedOption
                                            ? "selected-option"
                                            : ""
                                        }
                                      >

                                        <td>
                                          {quotationIndex +
                                            1}
                                        </td>


                                        <td>

                                          {isSelected ? (

                                            <strong>
                                              {option.transportName ||
                                                "—"}
                                            </strong>

                                          ) : (

                                            <input
                                              type="text"
                                              value={
                                                option.transportName ||
                                                ""
                                              }
                                              onChange={(
                                                event
                                              ) =>
                                                handleQuotationChange(
                                                  vehicleIndex,
                                                  quotationIndex,
                                                  "transportName",
                                                  event.target.value
                                                )
                                              }
                                              placeholder="Enter transport name"
                                            />

                                          )}

                                        </td>


                                        <td>

                                          {isSelected ? (

                                            <strong className="traffic-table-amount">
                                              {formatAmount(
                                                option.amount
                                              )}
                                            </strong>

                                          ) : (

                                            <div className="traffic-amount-input">

                                              <span>
                                                ₹
                                              </span>

                                              <input
                                                type="number"
                                                min="0"
                                                value={
                                                  option.amount ??
                                                  ""
                                                }
                                                onChange={(
                                                  event
                                                ) =>
                                                  handleQuotationChange(
                                                    vehicleIndex,
                                                    quotationIndex,
                                                    "amount",
                                                    event.target.value
                                                  )
                                                }
                                                placeholder="Enter amount"
                                              />

                                            </div>

                                          )}

                                        </td>


                                        <td>

                                          {selectedOption ? (

                                            <span className="traffic-option-selected">
                                              <CheckCircle2
                                                size={12}
                                              />
                                              Approved
                                            </span>

                                          ) : status ===
                                            "Approved" ? (

                                            <span className="traffic-option-not-selected">
                                              Not Selected
                                            </span>

                                          ) : (

                                            <span className="traffic-option-pending">
                                              {option.status ===
                                              "Submitted"
                                                ? "Submitted"
                                                : "Pending"}
                                            </span>

                                          )}

                                        </td>


                                        {!isSelected && (

                                          <td>

                                            <button
                                              type="button"
                                              className="traffic-delete-option"
                                              onClick={() =>
                                                handleRemoveTransport(
                                                  vehicleIndex,
                                                  quotationIndex
                                                )
                                              }
                                              title="Remove transport option"
                                            >
                                              <Trash2
                                                size={13}
                                              />
                                            </button>

                                          </td>

                                        )}

                                      </tr>

                                    );
                                  }
                                )

                              ) : (

                                <tr>

                                  <td
                                    colSpan={
                                      isSelected
                                        ? 4
                                        : 5
                                    }
                                    className="traffic-no-options"
                                  >
                                    No transport
                                    quotations.
                                  </td>

                                </tr>

                              )}

                            </tbody>

                          </table>

                        </div>


                      </div>

                    </section>

                  );
                }
              )}

              <div className="traffic-quotation-footer">

                <span>
                  Traffic Team only
                  submits quotations.
                  Management will approve the
                  suitable transporter.
                </span>


                <button
                  type="button"
                  className="traffic-submit-btn"
                  disabled={
                    savingVehicleId ===
                      "__ALL__" ||
                    !trafficAllocatedBy.trim()
                  }
                  onClick={
                    handleRequestApproval
                  }
                >

                  <Send
                    size={14}
                  />

                  {savingVehicleId ===
                  "__ALL__"
                    ? "Requesting..."
                    : "Request Approval"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};


export default Traffic;