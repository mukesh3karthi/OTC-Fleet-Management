import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Search,
  X,
  XCircle,
} from "lucide-react";

import "./approvalmanagement.css";


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


const formatAmount = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  const numericValue = Number(
    String(value).replace(/,/g, "")
  );

  if (Number.isNaN(numericValue)) {
    return `₹ ${value}`;
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(numericValue);
};


const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};


const safeStatus = (status) =>
  status || "Pending";


/* =========================================================
   DETAIL FIELD
========================================================= */

const DetailField = ({
  label,
  value,
  full = false,
}) => (
  <div
    className={`approval-detail-field ${
      full ? "full" : ""
    }`}
  >
    <span>{label}</span>

    <strong>
      {value === "" ||
      value === null ||
      value === undefined
        ? "—"
        : value}
    </strong>
  </div>
);


/* =========================================================
   COMPONENT
========================================================= */

const Approvalmanagement = () => {
  const [approvals, setApprovals] =
    useState([]);

  const [allOrders, setAllOrders] =
    useState([]);

  const [
    vehicleSelections,
    setVehicleSelections,
  ] = useState({});

  const [
    vehicleUpdatingKey,
    setVehicleUpdatingKey,
  ] = useState(null);

  const [
    selectedVehicleApproval,
    setSelectedVehicleApproval,
  ] = useState(null);

  const [
    selectedVehicleTrip,
    setSelectedVehicleTrip,
  ] = useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [searchText, setSearchText] =
    useState("");

  const [
    selectedApproval,
    setSelectedApproval,
  ] = useState(null);

  const [
    rejectionModal,
    setRejectionModal,
  ] = useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    approvalRemarks,
    setApprovalRemarks,
  ] = useState("");

  const [isUpdating, setIsUpdating] =
    useState(false);


  /* =========================================================
     FETCH APPROVALS
  ========================================================= */

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        TRIP_API_URL
      );

      const payload = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.message ||
            "Unable to load approval requests."
        );
      }

      const trips =
        extractTripList(payload);

      setAllOrders(trips);

      const approvalRequests =
        trips.filter(
          (trip) =>
            trip.approvalRequested === true ||
            Boolean(
              trip.approvalRequestedAt
            ) ||
            [
              "Pending",
              "Approved",
              "Rejected",
            ].includes(
              trip.approvalStatus
            )
        );

      approvalRequests.sort(
        (a, b) => {
          const aTime = new Date(
            a.approvalRequestedAt ||
              a.updatedAt ||
              0
          ).getTime();

          const bTime = new Date(
            b.approvalRequestedAt ||
              b.updatedAt ||
              0
          ).getTime();

          return bTime - aTime;
        }
      );

      setApprovals(
        approvalRequests
      );

      setSelectedApproval(
        (current) => {
          if (!current) {
            return null;
          }

          return (
            approvalRequests.find(
              (item) =>
                item._id ===
                current._id
            ) || null
          );
        }
      );
    } catch (fetchError) {
      console.error(
        "Fetch Approval Error:",
        fetchError
      );

      setError(
        fetchError.message ||
          "Unable to load approvals."
      );

      setApprovals([]);
      setAllOrders([]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchApprovals();
  }, []);


  /* =========================================================
     ESC CLOSE
  ========================================================= */

  useEffect(() => {
    if (!selectedApproval) {
      return undefined;
    }

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key === "Escape" &&
        !rejectionModal &&
        !isUpdating
      ) {
        setSelectedApproval(
          null
        );

        setApprovalRemarks("");
        setError("");
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [
    selectedApproval,
    rejectionModal,
    isUpdating,
  ]);


  useEffect(() => {
    if (
      !selectedVehicleApproval &&
      !selectedVehicleTrip
    ) {
      return undefined;
    }

    const handleVehicleModalKeyDown = (
      event
    ) => {
      if (
        event.key === "Escape" &&
        !vehicleUpdatingKey
      ) {
        if (selectedVehicleTrip) {
          handleCloseVehicleTrip();
        } else {
          handleCloseVehicleApproval();
        }
      }
    };

    window.addEventListener(
      "keydown",
      handleVehicleModalKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleVehicleModalKeyDown
      );
  }, [
    selectedVehicleApproval,
    selectedVehicleTrip,
    vehicleUpdatingKey,
  ]);


  /* =========================================================
     COUNTS
  ========================================================= */

  const counts = useMemo(
    () => ({
      total: approvals.length,

      pending:
        approvals.filter(
          (item) =>
            safeStatus(
              item.approvalStatus
            ) === "Pending"
        ).length,

      approved:
        approvals.filter(
          (item) =>
            safeStatus(
              item.approvalStatus
            ) === "Approved"
        ).length,

      rejected:
        approvals.filter(
          (item) =>
            safeStatus(
              item.approvalStatus
            ) === "Rejected"
        ).length,
    }),
    [approvals]
  );


  /* =========================================================
     FILTER
  ========================================================= */

  const filteredApprovals =
    useMemo(() => {
      const search = searchText
        .trim()
        .toLowerCase();

      return approvals.filter(
        (item) => {
          const status =
            safeStatus(
              item.approvalStatus
            );

          const matchesStatus =
            statusFilter === "All" ||
            status ===
              statusFilter;

          const searchable = [
            item.orderReferenceNumber,
            item.tripId,
            item.id,
            item.client,
            item.customer,
            item.companyName,
            item.responsibleKam,
            item.assignedKam,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !search ||
            searchable.includes(
              search
            );

          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      approvals,
      statusFilter,
      searchText,
    ]);



  /* =========================================================
     VEHICLE ALLOCATION APPROVALS
  ========================================================= */

  const vehicleApprovalRows =
    useMemo(() => {
      const rows = [];

      allOrders.forEach(
        (order) => {
          const vehicles =
            Array.isArray(order.vehicles)
              ? order.vehicles
              : [];

          vehicles.forEach(
            (vehicle, vehicleIndex) => {
              const hasRequest =
                vehicle.vehicleApprovalRequested === true ||
                Boolean(
                  vehicle.vehicleApprovalRequestedAt
                ) ||
                [
                  "Pending",
                  "Approved",
                  "Rejected",
                ].includes(
                  vehicle.vehicleApprovalStatus
                ) ||
                [
                  "Approval Pending",
                  "Approved",
                  "Rejected",
                ].includes(
                  vehicle.quotationStatus
                );

              if (!hasRequest) {
                return;
              }

              rows.push({
                order,
                vehicle,
                vehicleIndex,

                trafficAllocatedBy:
                  order.trafficAllocatedBy ||
                  "",

                trafficAllocatedAt:
                  order.trafficAllocatedAt ||
                  null,

                key: `${order._id || order.tripId || order.id}-${
                  vehicle.vehicleSubId || vehicleIndex
                }`,
              });
            }
          );
        }
      );

      return rows.sort(
        (a, b) =>
          new Date(
            b.vehicle.vehicleApprovalRequestedAt ||
              b.order.trafficAllocatedAt ||
              b.vehicle.quotationSubmittedAt ||
              b.order.updatedAt ||
              0
          ).getTime() -
          new Date(
            a.vehicle.vehicleApprovalRequestedAt ||
              a.order.trafficAllocatedAt ||
              a.vehicle.quotationSubmittedAt ||
              a.order.updatedAt ||
              0
          ).getTime()
      );
    }, [allOrders]);


  /* =========================================================
     VEHICLE APPROVAL - GROUP BY TRIP
  ========================================================= */

  const vehicleApprovalTrips =
    useMemo(() => {
      const tripMap =
        new Map();

      vehicleApprovalRows.forEach(
        (row) => {
          const {
            order,
            vehicle,
          } = row;

          const tripKey =
            order._id ||
            order.tripId ||
            order.id;

          if (!tripKey) {
            return;
          }

          if (
            !tripMap.has(
              tripKey
            )
          ) {
            tripMap.set(
              tripKey,
              {
                key:
                  tripKey,

                order,

                vehicles:
                  [],

                rows:
                  [],

                trafficAllocatedBy:
                  order
                    .trafficAllocatedBy ||
                  "",

                trafficAllocatedAt:
                  order
                    .trafficAllocatedAt ||
                  null,
              }
            );
          }

          const current =
            tripMap.get(
              tripKey
            );

          current.vehicles.push(
            vehicle
          );

          current.rows.push(
            row
          );
        }
      );

      return Array.from(
        tripMap.values()
      ).sort(
        (a, b) => {
          const bTime =
            new Date(
              b.trafficAllocatedAt ||
              b.rows?.[0]
                ?.vehicle
                ?.vehicleApprovalRequestedAt ||
              b.order.updatedAt ||
              0
            ).getTime();

          const aTime =
            new Date(
              a.trafficAllocatedAt ||
              a.rows?.[0]
                ?.vehicle
                ?.vehicleApprovalRequestedAt ||
              a.order.updatedAt ||
              0
            ).getTime();

          return (
            bTime -
            aTime
          );
        }
      );
    }, [
      vehicleApprovalRows
    ]);


  const handleVehicleSelection = (
    rowKey,
    quotationId
  ) => {
    setVehicleSelections(
      (previous) => ({
        ...previous,
        [rowKey]: quotationId,
      })
    );
  };


  const updateVehicleApproval =
    async (
      row,
      status
    ) => {
      const {
        order,
        vehicle,
        vehicleIndex,
        key,
      } = row;

      if (
        !order?._id ||
        vehicleUpdatingKey
      ) {
        return;
      }

      const options =
        Array.isArray(
          vehicle.transportOptions
        )
          ? vehicle.transportOptions
          : [];

      const selectedQuotationId =
        vehicleSelections[key] ||
        vehicle.approvedQuotationId ||
        vehicle.selectedTransport
          ?.quotationId ||
        "";

      if (
        status === "Approved" &&
        !selectedQuotationId
      ) {
        setError(
          "Select a transporter quotation before approving the vehicle."
        );
        return;
      }

      const selectedOption =
        options.find(
          (option) =>
            option.quotationId ===
            selectedQuotationId
        );

      if (
        status === "Approved" &&
        !selectedOption
      ) {
        setError(
          "Selected transporter quotation was not found."
        );
        return;
      }

      try {
        setVehicleUpdatingKey(key);
        setError("");

        const now =
          new Date().toISOString();

        const updatedVehicles =
          order.vehicles.map(
            (
              currentVehicle,
              index
            ) => {
              if (
                index !==
                vehicleIndex
              ) {
                return currentVehicle;
              }

              if (
                status ===
                "Approved"
              ) {
                return {
                  ...currentVehicle,

                  vehicleApprovalRequested:
                    true,

                  vehicleApprovalStatus:
                    "Approved",

                  vehicleApprovalReviewedAt:
                    now,

                  approvedQuotationId:
                    selectedQuotationId,

                  selectedTransport: {
                    quotationId:
                      selectedOption.quotationId,

                    transportName:
                      selectedOption.transportName,

                    contactName:
                      selectedOption.contactName ||
                      "",

                    contactNumber:
                      selectedOption.contactNumber ||
                      "",

                    amount:
                      Number(
                        selectedOption.amount
                      ),
                  },

                  transportOptions:
                    options.map(
                      (option) => ({
                        ...option,

                        status:
                          option.quotationId ===
                          selectedQuotationId
                            ? "Approved"
                            : "Not Selected",
                      })
                    ),

                  quotationStatus:
                    "Approved",

                  quotationRemark:
                    "",

                  vehicleApprovalRemarks:
                    "Approved by management",

                  vehicleRejectionReason:
                    "",
                };
              }

              return {
                ...currentVehicle,

                vehicleApprovalRequested:
                  true,

                vehicleApprovalStatus:
                  "Rejected",

                vehicleApprovalReviewedAt:
                  now,

                quotationStatus:
                  "Rejected",

                approvedQuotationId:
                  "",

                selectedTransport:
                  null,

                transportOptions:
                  options.map(
                    (option) => ({
                      ...option,
                      status:
                        "Rejected",
                    })
                  ),

                quotationRemark:
                  "Vehicle allocation rejected by management.",

                vehicleApprovalRemarks:
                  "",

                vehicleRejectionReason:
                  "Vehicle allocation rejected by management.",
              };
            }
          );

        const payload = {
          ...order,

          vehicles:
            updatedVehicles,

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
            `${TRIP_API_URL}/${order._id}`,
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
              `Unable to ${status.toLowerCase()} vehicle allocation.`
          );
        }

        setVehicleSelections(
          (previous) => {
            const next = {
              ...previous,
            };
            delete next[key];
            return next;
          }
        );

        await fetchApprovals();

        setSelectedVehicleApproval(
          null
        );

        setSelectedVehicleTrip(
          (currentTrip) => {
            if (!currentTrip) {
              return null;
            }

            const freshOrder =
              {
                ...order,
                vehicles:
                  updatedVehicles,
              };

            const freshRows =
              currentTrip.rows.map(
                (currentRow) => {
                  if (
                    currentRow.key !==
                    key
                  ) {
                    return currentRow;
                  }

                  return {
                    ...currentRow,
                    order:
                      freshOrder,
                    vehicle:
                      updatedVehicles[
                        vehicleIndex
                      ],
                  };
                }
              );

            return {
              ...currentTrip,
              order:
                freshOrder,
              vehicles:
                updatedVehicles,
              rows:
                freshRows,
            };
          }
        );
      } catch (vehicleError) {
        console.error(
          "Vehicle Approval Error:",
          vehicleError
        );

        setError(
          vehicleError.message ||
            "Unable to update vehicle approval."
        );
      } finally {
        setVehicleUpdatingKey(
          null
        );
      }
    };


  /* =========================================================
     OPEN VEHICLE APPROVAL MODAL
  ========================================================= */

  const handleOpenVehicleApproval = (
    row
  ) => {
    const {
      vehicle,
      key,
    } = row;

    const currentSelection =
      vehicle.approvedQuotationId ||
      vehicle.selectedTransport
        ?.quotationId ||
      "";

    setVehicleSelections(
      (previous) => ({
        ...previous,
        [key]: currentSelection,
      })
    );

    setSelectedVehicleApproval(
      row
    );

    setError("");

    document.body.style.overflow =
      "hidden";
  };


  const handleCloseVehicleApproval =
    () => {
      if (vehicleUpdatingKey) {
        return;
      }

      setSelectedVehicleApproval(
        null
      );

      setError("");

      if (!selectedVehicleTrip) {
        document.body.style.overflow =
          "";
      }
    };


  /* =========================================================
     OPEN VEHICLE APPROVAL TRIP
  ========================================================= */

  const handleOpenVehicleTrip =
    (trip) => {
      const selections = {};

      trip.rows.forEach(
        (row) => {
          const {
            vehicle,
            key,
          } = row;

          selections[key] =
            vehicle.approvedQuotationId ||
            vehicle.selectedTransport
              ?.quotationId ||
            "";
        }
      );

      setVehicleSelections(
        (previous) => ({
          ...previous,
          ...selections,
        })
      );

      setSelectedVehicleTrip(
        trip
      );

      setSelectedVehicleApproval(
        null
      );

      setError("");

      document.body.style.overflow =
        "hidden";
    };


  const handleCloseVehicleTrip =
    () => {
      if (vehicleUpdatingKey) {
        return;
      }

      setSelectedVehicleTrip(
        null
      );

      setError("");

      document.body.style.overflow =
        "";
    };


  /* =========================================================
     OPEN DETAILS
  ========================================================= */

  const handleOpenApproval = (
    item
  ) => {
    setSelectedApproval(item);

    setApprovalRemarks(
      item.approvalStatus ===
        "Pending"
        ? ""
        : item.approvalRemarks ||
            ""
    );

    setRejectionReason("");
    setError("");
  };


  /* =========================================================
     CLOSE DETAILS
  ========================================================= */

  const handleCloseApproval =
    () => {
      if (isUpdating) {
        return;
      }

      setSelectedApproval(null);

      setApprovalRemarks("");
      setRejectionReason("");
      setError("");
    };


  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  const updateStatus = async (
    approval,
    status,
    reason = "",
    remarks = ""
  ) => {
    if (
      !approval?._id ||
      isUpdating
    ) {
      return false;
    }

    try {
      setIsUpdating(true);
      setError("");

      const reviewedAt =
        new Date().toISOString();

      const payload = {
        ...approval,

        approvalRequested: true,

        approvalStatus:
          status,

        approvalReviewedAt:
          reviewedAt,

        approvalRemarks:
          remarks.trim(),

        approvalRejectionReason:
          status === "Rejected"
            ? reason.trim()
            : "",

        stage:
          status === "Approved"
            ? "PO Documents"
            : "Approval Rejected",

        orderStage:
          status === "Approved"
            ? "PO Documents"
            : "Approval Rejected",

        lifecycleStep:
          status === "Approved"
            ? 2
            : 1,
      };

      delete payload._id;
      delete payload.id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;

      const response =
        await fetch(
          `${TRIP_API_URL}/${approval._id}`,
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
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to update approval."
        );
      }

      const serverTrip =
        extractTrip(result);

      const savedTrip = {
        ...approval,
        ...payload,

        ...(serverTrip &&
        typeof serverTrip ===
          "object"
          ? serverTrip
          : {}),

        _id: approval._id,
      };

      setApprovals(
        (previous) =>
          previous.map(
            (item) =>
              item._id ===
              approval._id
                ? savedTrip
                : item
          )
      );

      setSelectedApproval(
        savedTrip
      );

      setApprovalRemarks("");

      return true;
    } catch (updateError) {
      console.error(
        "Approval Update Error:",
        updateError
      );

      setError(
        updateError.message ||
          "Unable to update approval."
      );

      return false;
    } finally {
      setIsUpdating(false);
    }
  };


  /* =========================================================
     APPROVE
  ========================================================= */

  const handleApprove =
    async () => {
      if (!selectedApproval) {
        return;
      }

      const remarks =
        approvalRemarks.trim();

      if (!remarks) {
        setError(
          "Please enter approval remarks before approving."
        );

        return;
      }

      const success =
        await updateStatus(
          selectedApproval,
          "Approved",
          "",
          remarks
        );

      if (success) {
        setApprovalRemarks("");
      }
    };


  /* =========================================================
     OPEN REJECT
  ========================================================= */

  const handleOpenReject =
    () => {
      setRejectionReason("");
      setError("");
      setRejectionModal(true);
    };


  /* =========================================================
     REJECT
  ========================================================= */

  const handleReject =
    async () => {
      if (!selectedApproval) {
        return;
      }

      const reason =
        rejectionReason.trim();

      if (!reason) {
        setError(
          "Please enter a rejection reason."
        );

        return;
      }

      const success =
        await updateStatus(
          selectedApproval,
          "Rejected",
          reason,
          ""
        );

      if (success) {
        setRejectionModal(
          false
        );

        setRejectionReason(
          ""
        );
      }
    };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="approval-page">

      {/* ================= HEADER ================= */}

      <div className="approval-page-header">

        <div>

          <h1>
            Approval Management
          </h1>

          <p>
            Review and approve Order
            Finalization requests.
          </p>
        </div>


        <div className="approval-header-tools">

          <div className="approval-search">
            <Search size={16} />

            <input
              type="text"
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
              placeholder="Search order, customer or KAM..."
            />
          </div>


          <select
            className="approval-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All Requests
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Rejected">
              Rejected
            </option>
          </select>

        </div>
      </div>


      {/* ================= SUMMARY ================= */}

      <div className="approval-summary">

        <button
          type="button"
          className={`approval-summary-card ${
            statusFilter === "All"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter("All")
          }
        >
          <div>
            <span>
              Total Requests
            </span>

            <small>
              All submissions
            </small>
          </div>

          <strong>
            {counts.total}
          </strong>
        </button>


        <button
          type="button"
          className={`approval-summary-card ${
            statusFilter ===
            "Pending"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter(
              "Pending"
            )
          }
        >
          <div>
            <span>
              Pending
            </span>

            <small>
              Awaiting review
            </small>
          </div>

          <strong>
            {counts.pending}
          </strong>
        </button>


        <button
          type="button"
          className={`approval-summary-card ${
            statusFilter ===
            "Approved"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter(
              "Approved"
            )
          }
        >
          <div>
            <span>
              Approved
            </span>

            <small>
              Accepted orders
            </small>
          </div>

          <strong>
            {counts.approved}
          </strong>
        </button>


        <button
          type="button"
          className={`approval-summary-card ${
            statusFilter ===
            "Rejected"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter(
              "Rejected"
            )
          }
        >
          <div>
            <span>
              Rejected
            </span>

            <small>
              Returned orders
            </small>
          </div>

          <strong>
            {counts.rejected}
          </strong>
        </button>

      </div>


      {/* ================= TABLE ================= */}

      <div className="approval-table-card">

        <div className="approval-table-heading">

          <div>
            <h2>
              Approval Requests
            </h2>

            <p>
              {
                filteredApprovals.length
              }{" "}
              request(s)
            </p>
          </div>

        </div>


        <div className="approval-table-wrap">

          <table className="approval-table">

            <thead>
              <tr>
                <th>S.No</th>

                <th>
                  Order Reference
                </th>

                <th>
                  Trip / Order ID
                </th>

                <th>
                  Client
                </th>

                <th>
                  Agreed Rate
                </th>

                <th>
                  Responsible KAM
                </th>

                <th>
                  Requested At
                </th>

                <th>
                  Status
                </th>

                <th />
              </tr>
            </thead>


            <tbody>

              {isLoading ? (

                <tr>
                  <td
                    colSpan="9"
                    className="approval-empty"
                  >
                    <div className="approval-empty-state">

                      <FileText
                        size={28}
                      />

                      <strong>
                        Loading approval
                        requests...
                      </strong>

                      <span>
                        Reading data
                        from API.
                      </span>

                    </div>
                  </td>
                </tr>

              ) : error &&
                !selectedApproval ? (

                <tr>
                  <td
                    colSpan="9"
                    className="approval-empty"
                  >
                    <div className="approval-empty-state">

                      <FileText
                        size={28}
                      />

                      <strong>
                        Unable to load
                        approval requests
                      </strong>

                      <span>
                        {error}
                      </span>

                    </div>
                  </td>
                </tr>

              ) :
              filteredApprovals.length ===
              0 ? (

                <tr>
                  <td
                    colSpan="9"
                    className="approval-empty"
                  >
                    <div className="approval-empty-state">

                      <FileText
                        size={28}
                      />

                      <strong>
                        No approval
                        requests found
                      </strong>

                      <span>
                        Requested orders
                        will appear here.
                      </span>

                    </div>
                  </td>
                </tr>

              ) : (

                filteredApprovals.map(
                  (
                    item,
                    index
                  ) => {
                    const status =
                      safeStatus(
                        item.approvalStatus
                      );

                    return (
                      <tr
                        key={
                          item._id ||
                          item.tripId
                        }
                        className="approval-clickable-row"
                        onClick={() =>
                          handleOpenApproval(
                            item
                          )
                        }
                      >

                        <td>
                          <span className="approval-row-number">
                            {index + 1}
                          </span>
                        </td>


                        <td>
                          <strong className="approval-order-ref">
                            {item.orderReferenceNumber ||
                              "—"}
                          </strong>
                        </td>


                        <td>
                          {item.tripId ||
                            item.id ||
                            "—"}
                        </td>


                        <td>
                          <div className="approval-client-cell">

                            <strong>
                              {item.client ||
                                item.customer ||
                                "—"}
                            </strong>

                          </div>
                        </td>


                        <td>
                          <strong className="approval-amount">

                            {formatAmount(
                              item.agreedRate
                            )}

                          </strong>
                        </td>


                        <td>
                          {item.responsibleKam ||
                            item.assignedKam ||
                            "—"}
                        </td>


                        <td>
                          <div className="approval-date-cell">

                            <Clock3
                              size={13}
                            />

                            <span>
                              {formatDateTime(
                                item.approvalRequestedAt
                              )}
                            </span>

                          </div>
                        </td>


                        <td>
                          <span
                            className={`approval-status ${status.toLowerCase()}`}
                          >
                            {status}
                          </span>
                        </td>


                        <td>
                          <button
                            type="button"
                            className="approval-open-button"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              handleOpenApproval(
                                item
                              );
                            }}
                            aria-label="Open approval request"
                          >
                            <ChevronRight
                              size={17}
                            />
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
      </div>



      {/* =====================================================
          VEHICLE ALLOCATION APPROVAL - TRIP TABLE
      ===================================================== */}

      <div
        className="approval-table-card"
        style={{ marginTop: "22px" }}
      >

        <div className="approval-table-heading">

          <div>
            <h2>
              Vehicle Allocation Approval
            </h2>

            <p>
              {
                vehicleApprovalTrips.length
              }{" "}
              trip request(s)
            </p>
          </div>

        </div>


        <div className="approval-table-wrap">

          <table className="approval-table vehicle-trip-approval-table">

            <thead>
              <tr>
                <th>S.No</th>
                <th>Trip / Order ID</th>
                <th>Customer</th>
                <th>Route / Site</th>
                <th>Vehicles</th>
                <th>Traffic Allocator</th>
                <th>Requested At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>


            <tbody>

              {isLoading ? (

                <tr>
                  <td
                    colSpan="9"
                    className="approval-empty"
                  >
                    Loading vehicle approvals...
                  </td>
                </tr>

              ) :
              vehicleApprovalTrips.length ===
              0 ? (

                <tr>
                  <td
                    colSpan="9"
                    className="approval-empty"
                  >
                    <div className="approval-empty-state">

                      <FileText
                        size={28}
                      />

                      <strong>
                        No vehicle approval requests
                      </strong>

                      <span>
                        Traffic submitted trips
                        will appear here.
                      </span>

                    </div>
                  </td>
                </tr>

              ) : (

                vehicleApprovalTrips.map(
                  (
                    trip,
                    index
                  ) => {
                    const {
                      order,
                      vehicles,
                    } = trip;

                    const totalQty =
                      vehicles.reduce(
                        (
                          total,
                          vehicle
                        ) =>
                          total +
                          Number(
                            vehicle.quantity ||
                            0
                          ),
                        0
                      );

                    const statuses =
                      vehicles.map(
                        (vehicle) =>
                          vehicle
                            .vehicleApprovalStatus ||
                          (
                            vehicle
                              .quotationStatus ===
                              "Approved"
                              ? "Approved"
                              : vehicle
                                  .quotationStatus ===
                                  "Rejected"
                                ? "Rejected"
                                : "Pending"
                          )
                      );

                    let tripStatus =
                      "Pending";

                    if (
                      statuses.length &&
                      statuses.every(
                        (status) =>
                          status ===
                          "Approved"
                      )
                    ) {
                      tripStatus =
                        "Approved";
                    } else if (
                      statuses.length &&
                      statuses.every(
                        (status) =>
                          status ===
                          "Rejected"
                      )
                    ) {
                      tripStatus =
                        "Rejected";
                    }

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
                          trip.key
                        }
                        className="approval-clickable-row"
                        onClick={() =>
                          handleOpenVehicleTrip(
                            trip
                          )
                        }
                      >

                        <td>
                          <span className="approval-row-number">
                            {index + 1}
                          </span>
                        </td>


                        <td>
                          <strong className="approval-order-ref">
                            {order.tripId ||
                              order.id ||
                              "—"}
                          </strong>
                        </td>


                        <td>
                          <div className="approval-client-cell">
                            <strong>
                              {order.companyName ||
                                order.customer ||
                                order.client ||
                                "—"}
                            </strong>

                            <span>
                              {order.companyName ||
                                ""}
                            </span>
                          </div>
                        </td>


                        <td>
                          <span className="vehicle-trip-route">
                            {route}
                          </span>
                        </td>


                        <td>
                          <div className="vehicle-trip-count">
                            <strong>
                              {totalQty}
                            </strong>

                            <span>
                              NOS
                            </span>
                          </div>
                        </td>


                        <td>
                          <strong className="vehicle-trip-allocator">
                            {order
                              .trafficAllocatedBy ||
                              "—"}
                          </strong>
                        </td>


                        <td>
                          <div className="approval-date-cell">

                            <Clock3
                              size={13}
                            />

                            <span>
                              {formatDateTime(
                                order
                                  .trafficAllocatedAt ||
                                trip.rows?.[0]
                                  ?.vehicle
                                  ?.vehicleApprovalRequestedAt ||
                                trip.rows?.[0]
                                  ?.vehicle
                                  ?.quotationSubmittedAt
                              )}
                            </span>

                          </div>
                        </td>


                        <td>
                          <span
                            className={`approval-status ${tripStatus.toLowerCase()}`}
                          >
                            {tripStatus}
                          </span>
                        </td>


                        <td>
                          <button
                            type="button"
                            className="vehicle-review-button"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              handleOpenVehicleTrip(
                                trip
                              );
                            }}
                          >
                            Review

                            <ChevronRight
                              size={14}
                            />
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

      </div>


      {/* =====================================================
          VEHICLE ALLOCATION APPROVAL - TRIP MODAL
      ===================================================== */}

      {selectedVehicleTrip &&
        (() => {
          const {
            order,
            rows,
            vehicles,
          } =
            selectedVehicleTrip;

          const totalQty =
            vehicles.reduce(
              (
                total,
                vehicle
              ) =>
                total +
                Number(
                  vehicle.quantity ||
                  0
                ),
              0
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

          const placementDate =
            order.placementDate ||
            order.deploymentDate ||
            rows?.[0]
              ?.vehicle
              ?.placementDate;

          return (

            <div
              className="vehicle-trip-modal-overlay"
              onMouseDown={(
                event
              ) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  handleCloseVehicleTrip();
                }
              }}
            >

              <section
                className="vehicle-trip-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Vehicle allocation approval trip details"
              >


                {/* HEADER */}

                <div className="vehicle-trip-modal-header">


                  <div className="vehicle-trip-modal-heading">

                    <span>
                      VEHICLE ALLOCATION APPROVAL
                    </span>

                    <h2>
                      Vehicle Requirements
                    </h2>

                    <p>
                      {order.tripId ||
                        order.id ||
                        "—"}
                      {" • "}
                      {order.client ||
                        order.customer ||
                        "—"}
                    </p>

                  </div>


                  <div className="vehicle-trip-modal-header-actions">


                    <div className="vehicle-trip-allocator-box">

                      <span>
                        TRAFFIC ALLOCATOR
                      </span>

                      <strong>
                        {order
                          .trafficAllocatedBy ||
                          "—"}
                      </strong>

                      {order
                        .trafficAllocatedAt && (

                        <small>
                          Allocation:{" "}
                          {formatDateTime(
                            order
                              .trafficAllocatedAt
                          )}
                        </small>

                      )}

                    </div>


                    <button
                      type="button"
                      className="vehicle-trip-modal-close"
                      disabled={
                        Boolean(
                          vehicleUpdatingKey
                        )
                      }
                      onClick={
                        handleCloseVehicleTrip
                      }
                      aria-label="Close vehicle allocation approval"
                    >
                      <X
                        size={18}
                      />
                    </button>

                  </div>

                </div>


                {/* ORDER OVERVIEW */}

                <div className="vehicle-trip-overview">


                  <div>
                    <span>
                      Order ID
                    </span>

                    <strong>
                      {order.tripId ||
                        order.id ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Client
                    </span>

                    <strong>
                      {order.client ||
                        order.customer ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Route
                    </span>

                    <strong>
                      {route}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Deployment
                    </span>

                    <strong>
                      {formatDateTime(
                        placementDate
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Vehicle Qty
                    </span>

                    <strong>
                      {totalQty} NOS
                    </strong>
                  </div>

                </div>


                {/* VEHICLES */}

                <div className="vehicle-trip-modal-body">


                  {error && (

                    <div className="approval-form-error">
                      {error}
                    </div>

                  )}


                  {rows.map(
                    (
                      row,
                      vehicleIndex
                    ) => {
                      const {
                        vehicle,
                        key,
                      } = row;

                      const vehicleStatus =
                        vehicle
                          .vehicleApprovalStatus ||
                        (
                          vehicle
                            .quotationStatus ===
                            "Approved"
                            ? "Approved"
                            : vehicle
                                .quotationStatus ===
                                "Rejected"
                              ? "Rejected"
                              : "Pending"
                        );

                      const options =
                        Array.isArray(
                          vehicle
                            .transportOptions
                        )
                          ? vehicle
                              .transportOptions
                          : [];

                      const selectedValue =
                        vehicleSelections[
                          key
                        ] ||
                        vehicle
                          .approvedQuotationId ||
                        vehicle
                          .selectedTransport
                          ?.quotationId ||
                        "";

                      const isUpdating =
                        vehicleUpdatingKey ===
                        key;

                      return (

                        <section
                          className="vehicle-trip-card"
                          key={
                            key
                          }
                        >


                          {/* VEHICLE HEADER */}

                          <div className="vehicle-trip-card-header">


                            <div className="vehicle-trip-card-title">


                              <span className="vehicle-trip-number">

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
                                  {vehicle
                                    .vehicleType ||
                                    "Vehicle"}
                                </h3>

                                <p>
                                  {vehicle.quantity ||
                                    0}{" "}
                                  NOS
                                  {" • "}
                                  Deployment:{" "}
                                  {formatDateTime(
                                    vehicle
                                      .placementDate ||
                                    placementDate
                                  )}
                                </p>

                              </div>

                            </div>


                            <span
                              className={`approval-status ${vehicleStatus.toLowerCase()}`}
                            >
                              {vehicleStatus}
                            </span>

                          </div>


                          {/* QUOTATIONS */}

                          <div className="vehicle-trip-quotation-wrap">

                            <table className="vehicle-trip-quotation-table">


                              <thead>

                                <tr>
                                  <th>Select</th>
                                  <th>S.No</th>
                                  <th>Transport Name</th>
                                  <th>Contact Name</th>
                                  <th>Contact Number</th>
                                  <th>Quoted Amount</th>
                                  <th>Status</th>
                                </tr>

                              </thead>


                              <tbody>


                                {options.length ===
                                0 ? (

                                  <tr>
                                    <td
                                      colSpan="7"
                                      className="vehicle-no-quotation"
                                    >
                                      No transporter quotations submitted.
                                    </td>
                                  </tr>

                                ) : (

                                  options.map(
                                    (
                                      option,
                                      optionIndex
                                    ) => {
                                      const optionId =
                                        option
                                          .quotationId ||
                                        `${key}-${optionIndex}`;

                                      const selected =
                                        selectedValue ===
                                        option
                                          .quotationId;

                                      return (

                                        <tr
                                          key={
                                            optionId
                                          }
                                          className={
                                            selected
                                              ? "selected"
                                              : ""
                                          }
                                          onClick={() => {
                                            if (
                                              vehicleStatus !==
                                                "Approved" &&
                                              !isUpdating
                                            ) {
                                              handleVehicleSelection(
                                                key,
                                                option
                                                  .quotationId
                                              );
                                            }
                                          }}
                                        >


                                          <td>
                                            <input
                                              type="radio"
                                              name={`vehicle-${key}`}
                                              checked={
                                                selected
                                              }
                                              disabled={
                                                vehicleStatus ===
                                                  "Approved" ||
                                                isUpdating
                                              }
                                              onChange={() =>
                                                handleVehicleSelection(
                                                  key,
                                                  option
                                                    .quotationId
                                                )
                                              }
                                            />
                                          </td>


                                          <td>
                                            {optionIndex +
                                              1}
                                          </td>


                                          <td>
                                            <strong>
                                              {option
                                                .transportName ||
                                                "—"}
                                            </strong>
                                          </td>


                                          <td>
                                            {option
                                              .contactName ||
                                              "—"}
                                          </td>


                                          <td>
                                            {option
                                              .contactNumber ||
                                              "—"}
                                          </td>


                                          <td>
                                            <strong className="vehicle-quoted-amount">
                                              {formatAmount(
                                                option
                                                  .amount
                                              )}
                                            </strong>
                                          </td>


                                          <td>
                                            <span className="vehicle-option-status">
                                              {option.status ||
                                                "Submitted"}
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


                          {/* ACTION */}

                          <div className="vehicle-trip-card-footer">


                            <span>
                              Traffic Team submitted these quotations.
                              Select the suitable transporter and approve the allocation.
                            </span>


                            <div className="vehicle-approval-actions">


                              {vehicleStatus !==
                                "Rejected" && (

                                <button
                                  type="button"
                                  className="approval-reject-button"
                                  disabled={
                                    isUpdating
                                  }
                                  onClick={() =>
                                    updateVehicleApproval(
                                      row,
                                      "Rejected"
                                    )
                                  }
                                >
                                  <XCircle
                                    size={14}
                                  />

                                  {isUpdating
                                    ? "Updating..."
                                    : "Reject"}
                                </button>

                              )}


                              {vehicleStatus !==
                                "Approved" && (

                                <button
                                  type="button"
                                  className="approval-approve-button"
                                  disabled={
                                    isUpdating ||
                                    !selectedValue
                                  }
                                  onClick={() =>
                                    updateVehicleApproval(
                                      row,
                                      "Approved"
                                    )
                                  }
                                >
                                  <Check
                                    size={14}
                                  />

                                  {isUpdating
                                    ? "Updating..."
                                    : "Approve"}
                                </button>

                              )}

                            </div>

                          </div>

                        </section>
                      );
                    }
                  )}

                </div>

              </section>

            </div>
          );
        })()}


      {/* =====================================================
          ORDER APPROVAL MODAL
      ===================================================== */}

      {selectedApproval && (() => {
        const orderStatus =
          safeStatus(
            selectedApproval.approvalStatus
          );

        const routeValue =
          selectedApproval.movementType ===
          "Intercarting"
            ? selectedApproval.siteLocation ||
              "—"
            : `${
                selectedApproval.origin ||
                "—"
              } → ${
                selectedApproval.destination ||
                "—"
              }`;

        return (
          <div
            className="order-approval-modal-overlay"
            onMouseDown={() =>
              !isUpdating &&
              handleCloseApproval()
            }
          >
            <section
              className="order-approval-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Order approval details"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              {/* HEADER */}
              <div className="order-approval-modal-header">
                <div className="order-approval-modal-title">
                  <span>
                    ORDER APPROVAL
                  </span>

                  <h2>
                    Order Finalization Review
                  </h2>

                  <p>
                    {selectedApproval.tripId ||
                      selectedApproval.id ||
                      "—"}
                    {" • "}
                    {selectedApproval.client ||
                      selectedApproval.customer ||
                      "—"}
                  </p>
                </div>

                <div className="order-approval-header-right">
                  <span
                    className={`approval-status large ${orderStatus.toLowerCase()}`}
                  >
                    {orderStatus}
                  </span>

                  <button
                    type="button"
                    className="order-approval-close"
                    disabled={isUpdating}
                    onClick={
                      handleCloseApproval
                    }
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* OVERVIEW */}
              <div className="order-approval-overview">
                <div>
                  <span>Order ID</span>
                  <strong>
                    {selectedApproval.tripId ||
                      selectedApproval.id ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Customer</span>
                  <strong>
                    {selectedApproval.client ||
                      selectedApproval.customer ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Responsible KAM</span>
                  <strong>
                    {selectedApproval.responsibleKam ||
                      selectedApproval.assignedKam ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Route</span>
                  <strong>
                    {routeValue}
                  </strong>
                </div>

                <div>
                  <span>Requested At</span>
                  <strong>
                    {formatDateTime(
                      selectedApproval.approvalRequestedAt
                    )}
                  </strong>
                </div>
              </div>

              {/* BODY */}
              <div className="order-approval-modal-body">
                {error && (
                  <div className="approval-form-error">
                    {error}
                  </div>
                )}

                <section className="order-approval-card">
                  <div className="order-approval-card-header">
                    <div>
                      <span className="order-approval-card-index">
                        01
                      </span>

                      <div>
                        <h3>
                          Commercial Details
                        </h3>
                        <p>
                          Review finalized commercial information before approval.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="order-approval-commercial-grid">
                    <div>
                      <span>
                        Order Reference
                      </span>
                      <strong>
                        {selectedApproval.orderReferenceNumber ||
                          "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Order Count / Lots
                      </span>
                      <strong>
                        {selectedApproval.orderCount ??
                          "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Quoted Rate</span>
                      <strong>
                        {formatAmount(
                          selectedApproval.quotedRate
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Negotiated Rate
                      </span>
                      <strong>
                        {formatAmount(
                          selectedApproval.negotiatedRate
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Final Rate</span>
                      <strong>
                        {formatAmount(
                          selectedApproval.finalRate
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Agreed Rate</span>
                      <strong className="order-approval-highlight-amount">
                        {formatAmount(
                          selectedApproval.agreedRate
                        )}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="order-approval-card">
                  <div className="order-approval-card-header">
                    <div>
                      <span className="order-approval-card-index">
                        02
                      </span>

                      <div>
                        <h3>
                          Terms & Commitments
                        </h3>
                        <p>
                          Client confirmation, payment and delivery commitments.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="order-approval-info-list">
                    <div>
                      <span>Payment Terms</span>
                      <strong>
                        {selectedApproval.paymentTerms ||
                          "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Commercial Terms & Payment SLAs
                      </span>
                      <strong>
                        {selectedApproval.commercialTerms ||
                          "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Delivery Commitments & SLAs
                      </span>
                      <strong>
                        {selectedApproval.deliveryCommitments ||
                          "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Client Confirmation Notes
                      </span>
                      <strong>
                        {selectedApproval.clientConfirmationNotes ||
                          "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Commercial Remarks
                      </span>
                      <strong>
                        {selectedApproval.commercialRemarks ||
                          "—"}
                      </strong>
                    </div>
                  </div>
                </section>

                {orderStatus ===
                  "Rejected" && (
                  <section className="order-approval-card order-approval-rejected-card">
                    <div className="order-approval-card-header">
                      <div>
                        <span className="order-approval-card-index danger">
                          !
                        </span>

                        <div>
                          <h3>
                            Rejection Details
                          </h3>
                          <p>
                            This order approval request was rejected.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="order-approval-rejection-text">
                      {selectedApproval.approvalRejectionReason ||
                        "No rejection reason provided."}
                    </div>
                  </section>
                )}

                {selectedApproval.approvalRemarks &&
                  orderStatus !==
                    "Pending" && (
                    <section className="order-approval-card">
                      <div className="order-approval-card-header">
                        <div>
                          <span className="order-approval-card-index">
                            03
                          </span>

                          <div>
                            <h3>
                              Approval Remark
                            </h3>
                            <p>
                              Management review comment.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="order-approval-existing-remark">
                        {selectedApproval.approvalRemarks}
                      </div>
                    </section>
                  )}

                {orderStatus ===
                  "Pending" && (
                  <section className="order-approval-card order-approval-decision-card">
                    <div className="order-approval-card-header">
                      <div>
                        <span className="order-approval-card-index">
                          03
                        </span>

                        <div>
                          <h3>
                            Approval Decision
                          </h3>
                          <p>
                            Add a management remark before approving the order.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="order-approval-remark-wrap">
                      <label htmlFor="approvalRemarks">
                        Approval Remark
                        <span>*</span>
                      </label>

                      <textarea
                        id="approvalRemarks"
                        rows={3}
                        value={
                          approvalRemarks
                        }
                        onChange={(event) => {
                          setApprovalRemarks(
                            event.target.value
                          );

                          if (error) {
                            setError("");
                          }
                        }}
                        placeholder="Enter approval comment..."
                        disabled={isUpdating}
                      />
                    </div>
                  </section>
                )}
              </div>

              {/* FOOTER */}
              <div className="order-approval-modal-footer">
                <div className="order-approval-footer-note">
                  {orderStatus ===
                  "Pending"
                    ? "Review the finalized order information before making a decision."
                    : `Reviewed: ${formatDateTime(
                        selectedApproval.approvalReviewedAt
                      )}`}
                </div>

                <div className="order-approval-actions">
                  <button
                    type="button"
                    className="order-approval-close-button"
                    disabled={isUpdating}
                    onClick={
                      handleCloseApproval
                    }
                  >
                    Close
                  </button>

                  {orderStatus ===
                    "Pending" && (
                    <>
                      <button
                        type="button"
                        className="order-approval-reject-button"
                        disabled={isUpdating}
                        onClick={
                          handleOpenReject
                        }
                      >
                        <XCircle
                          size={15}
                        />
                        Reject
                      </button>

                      <button
                        type="button"
                        className="order-approval-approve-button"
                        disabled={
                          isUpdating ||
                          !approvalRemarks.trim()
                        }
                        onClick={
                          handleApprove
                        }
                      >
                        <Check
                          size={15}
                        />

                        {isUpdating
                          ? "Approving..."
                          : "Approve Order"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        );
      })()}


      {/* =====================================================
          REJECTION MODAL
      ===================================================== */}

      {rejectionModal && (

        <div className="approval-reject-overlay">

          <div className="approval-reject-modal">

            <div className="approval-reject-heading">

              <div>

                <span>
                  REJECT REQUEST
                </span>

                <h3>
                  Rejection Reason
                </h3>

              </div>


              <button
                type="button"
                disabled={
                  isUpdating
                }
                onClick={() => {
                  if (
                    !isUpdating
                  ) {
                    setRejectionModal(
                      false
                    );

                    setRejectionReason(
                      ""
                    );

                    setError("");
                  }
                }}
              >
                <X size={18} />
              </button>

            </div>


            <p>
              Enter a reason so the
              KAM team knows why this
              request was rejected.
            </p>


            {error && (
              <div className="approval-form-error">
                {error}
              </div>
            )}


            <textarea
              rows={5}
              value={
                rejectionReason
              }
              onChange={(
                event
              ) => {
                setRejectionReason(
                  event.target.value
                );

                if (error) {
                  setError("");
                }
              }}
              placeholder="Enter rejection reason..."
              autoFocus
              disabled={
                isUpdating
              }
            />


            <div className="approval-reject-actions">

              <button
                type="button"
                className="approval-secondary-button"
                disabled={
                  isUpdating
                }
                onClick={() => {
                  setRejectionModal(
                    false
                  );

                  setRejectionReason(
                    ""
                  );

                  setError("");
                }}
              >
                Cancel
              </button>


              <button
                type="button"
                className="approval-reject-confirm"
                disabled={
                  isUpdating ||
                  !rejectionReason.trim()
                }
                onClick={
                  handleReject
                }
              >
                {isUpdating
                  ? "Rejecting..."
                  : "Reject Request"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};


export default Approvalmanagement;