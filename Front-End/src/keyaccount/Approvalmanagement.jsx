import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
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



const getTotalVehicleCount = (order) => {
  const savedCount = Number(
    order?.totalVehicleCount
  );

  if (
    Number.isInteger(savedCount) &&
    savedCount >= 0
  ) {
    return savedCount;
  }

  if (
    Array.isArray(order?.vehicles)
  ) {
    return order.vehicles.reduce(
      (total, vehicle) =>
        total +
        Number(vehicle?.quantity || 0),
      0
    );
  }

  return Number(
    order?.requiredVehicles ||
    order?.vehicleCount ||
    0
  );
};


/* =========================================================
   DETAIL FIELD
========================================================= */

const DetailField = ({
  label,
  value,
  full = false,
}) => (
  <div
    className={`approval-detail-field ${full ? "full" : ""
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
    vehicleRemarks,
    setVehicleRemarks,
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

  const [
    activeRequestTab,
    setActiveRequestTab,
  ] = useState("order");

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

  const [mdRemarks, setMdRemarks] =
    useState({});

  const [rowUpdatingId, setRowUpdatingId] =
    useState(null);

  const [expandedOrderRow, setExpandedOrderRow] =
    useState(null);

  const [expandedVehicleRow, setExpandedVehicleRow] =
    useState(null);


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

                key: `${order._id || order.tripId || order.id}-${vehicle.vehicleSubId || vehicleIndex
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


  const filteredVehicleApprovalRows =
    useMemo(() => {
      const search = searchText
        .trim()
        .toLowerCase();

      return vehicleApprovalRows.filter((row) => {
        const { order, vehicle } = row;

        const status =
          vehicle.vehicleApprovalStatus ||
          (vehicle.quotationStatus === "Approved"
            ? "Approved"
            : vehicle.quotationStatus === "Rejected"
              ? "Rejected"
              : "Pending");

        const matchesStatus =
          statusFilter === "All" ||
          status === statusFilter;

        const searchable = [
          order.tripId,
          order.orderReferenceNumber,
          order.id,
          order.companyName,
          order.customer,
          order.client,
          order.movementType,
          order.siteLocation,
          order.origin,
          order.destination,
          vehicle.vehicleType,
          vehicle.configurationModel,
          vehicle.vehicleSubId,
          order.trafficAllocatedBy,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !search || searchable.includes(search);

        return matchesStatus && matchesSearch;
      });
    }, [vehicleApprovalRows, statusFilter, searchText]);


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


  const handleVehicleRemarkChange = (
    rowKey,
    value
  ) => {
    setVehicleRemarks((previous) => ({
      ...previous,
      [rowKey]: value,
    }));
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

      const reviewRemark =
        (vehicleRemarks[key] || "").trim();

      if (
        status === "Rejected" &&
        !reviewRemark
      ) {
        setError(
          "Enter MD remarks before rejecting the vehicle allocation."
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
                    reviewRemark ||
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
                  reviewRemark,

                vehicleApprovalRemarks:
                  reviewRemark,

                vehicleRejectionReason:
                  reviewRemark,
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

        setVehicleRemarks((previous) => {
          const next = { ...previous };
          delete next[key];
          return next;
        });

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
     INLINE CLIENT RATE APPROVAL
  ========================================================= */

  const handleMdRemarkChange = (
    id,
    value
  ) => {
    setMdRemarks((previous) => ({
      ...previous,
      [id]: value,
    }));

    if (error) {
      setError("");
    }
  };


  const handleInlineApprove = async (
    item
  ) => {
    const rowId = item?._id;

    if (!rowId || rowUpdatingId) {
      return;
    }

    const remark = String(
      mdRemarks[rowId] ??
      item.approvalRemarks ??
      ""
    ).trim();

    if (!remark) {
      setError(
        "Please enter MD remarks/comments before approving."
      );
      return;
    }

    try {
      setRowUpdatingId(rowId);
      setError("");

      await updateStatus(
        item,
        "Approved",
        "",
        remark
      );

      setMdRemarks((previous) => ({
        ...previous,
        [rowId]: remark,
      }));

      await fetchApprovals();
    } finally {
      setRowUpdatingId(null);
    }
  };


  const handleInlineReject = async (
    item
  ) => {
    const rowId = item?._id;

    if (!rowId || rowUpdatingId) {
      return;
    }

    const remark = String(
      mdRemarks[rowId] ??
      item.approvalRejectionReason ??
      item.approvalRemarks ??
      ""
    ).trim();

    if (!remark) {
      setError(
        "Please enter MD remarks/comments before rejecting."
      );
      return;
    }

    try {
      setRowUpdatingId(rowId);
      setError("");

      await updateStatus(
        item,
        "Rejected",
        remark,
        remark
      );

      setMdRemarks((previous) => ({
        ...previous,
        [rowId]: remark,
      }));

      await fetchApprovals();
    } finally {
      setRowUpdatingId(null);
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

        </div>
      </div>

      
      {/* ================= REQUEST TABS + TOOLS ================= */}

      <div className="approval-tabs-toolbar">

        <div className="approval-request-tabs">

          <button
            type="button"
            className={`approval-request-tab ${activeRequestTab === "order"
                ? "active"
                : ""
              }`}
            onClick={() => {
              setActiveRequestTab("order");
              setStatusFilter("All");
            }}
          >
            Order Request
          </button>

          <button
            type="button"
            className={`approval-request-tab ${activeRequestTab === "vehicle"
                ? "active"
                : ""
              }`}
            onClick={() => {
              setActiveRequestTab("vehicle");
              setStatusFilter("All");
            }}
          >
            Vehicle Request
          </button>

        </div>


        <div className="approval-tabs-tools">

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
              placeholder={
                activeRequestTab === "order"
                  ? "Search order, customer or KAM..."
                  : "Search vehicle, customer or transporter..."
              }
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


      {activeRequestTab === "order" && (
        <div className="client-rate-card">

          <div className="client-rate-heading">

            <div>
              <h2>
                📋 Client Order Finalization Rates
                <span>
                  (Agreed Rate & Terms)
                </span>
              </h2>

            
            </div>

            <span className="client-rate-badge">
              CLIENT RATES
            </span>

          </div>

          {error && (
            <div className="client-rate-error">
              {error}
            </div>
          )}

          <div className="client-rate-table-wrap">

            <table className="client-rate-table">

              <thead>
                <tr>
                  <th className="row-expand-column" aria-label="Expand row"></th>
                  <th>Customer</th>
                  <th>Responsible KAM</th>
                  <th>Vehicles</th>
                  <th>Origin → Destination</th>
                  <th>Movement Type</th>
                  <th>Final Approved Rate</th>
                  <th>Commercial Terms &amp; Payment SLAs</th>
                  <th>MD Remarks</th>
                  <th>Approval Action</th>
                </tr>
              </thead>

              <tbody>

                {isLoading ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="client-rate-empty"
                    >
                      Loading client rate approvals...
                    </td>

                      <td>
                        {getTotalVehicleCount(item)} NOS
                      </td>
                  </tr>
                ) : filteredApprovals.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="client-rate-empty"
                    >
                      No client rate approval requests found.
                    </td>
                  </tr>
                ) : (
                  filteredApprovals.map((item) => {

                    const status = safeStatus(
                      item.approvalStatus
                    );

                    const rowId =
                      item._id ||
                      item.tripId ||
                      item.id;

                    const isRowUpdating =
                      rowUpdatingId === item._id;

                    const remarkValue =
                      mdRemarks[item._id] ??
                      (status === "Rejected"
                        ? item.approvalRejectionReason ||
                        item.approvalRemarks ||
                        ""
                        : item.approvalRemarks ||
                        "");

                    const movement =
                      item.movementClassification ||
                      item.movementType ||
                      "Others";

                    const normalizedMovement =
                      String(movement)
                        .toLowerCase();

                    const movementClass =
                      normalizedMovement.includes("crane")
                        ? "crane"
                        : normalizedMovement.includes("wtg")
                          ? "wtg"
                          : normalizedMovement.includes("intercart")
                            ? "intercarting"
                            : "others";

                    const assignedKam =
                      item.responsibleKam ||
                      item.assignedKam ||
                      item.responsibleKAM ||
                      item.assignedKAM ||
                      item.kamName ||
                      "—";

                    const orderRoute =
                      String(item.movementType || "")
                        .toLowerCase()
                        .includes("intercart")
                        ? item.siteLocation || "—"
                        : `${item.origin || "—"} → ${item.destination || "—"
                        }`;

                    const isExpanded =
                      expandedOrderRow === rowId;

                    return (
                      <React.Fragment key={rowId}>
                        <tr
                          className={`approval-data-row expandable-main-row ${
                            isExpanded ? "expanded" : ""
                          }`}
                          onClick={(event) => {
                            if (
                              event.target.closest(
                                "button, textarea, select, input, a, label"
                              )
                            ) {
                              return;
                            }

                            setExpandedOrderRow(
                              isExpanded ? null : rowId
                            );
                          }}
                        >
                          <td className="row-expand-cell">
                            <button
                              type="button"
                              className={`row-expand-button ${
                                isExpanded ? "open" : ""
                              }`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedOrderRow(
                                  isExpanded ? null : rowId
                                );
                              }}
                              aria-expanded={isExpanded}
                              aria-label={
                                isExpanded
                                  ? "Hide order details"
                                  : "Show order details"
                              }
                              title={
                                isExpanded
                                  ? "Hide details"
                                  : "Show details"
                              }
                            >
                              <ChevronDown size={16} />
                            </button>
                          </td>

                          <td>
                            <strong className="client-name">
                              {item.companyName ||
                                item.client ||
                                item.customer ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <span className="assigned-kam-cell">
                              {assignedKam}
                            </span>
                          </td>

                          <td>
                            <span className="approval-route-cell">
                              {orderRoute}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`movement-chip ${movementClass}`}
                            >
                              {movement}
                            </span>
                          </td>

                          <td>
                            <strong className="client-agreed-rate">
                              {formatAmount(
                                item.agreedRate ??
                                item.finalRate ??
                                item.negotiatedRate
                              )}
                            </strong>

                            {item.rateBasis && (
                              <span className="rate-basis">
                                {item.rateBasis}
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="commercial-terms-cell">
                              <div>
                                <strong>Terms:</strong>{" "}
                                {item.paymentTerms ||
                                  item.commercialTerms ||
                                  "—"}
                              </div>

                              {item.deliveryCommitments && (
                                <div className="sla-line">
                                  <strong>SLA:</strong>{" "}
                                  {item.deliveryCommitments}
                                </div>
                              )}

                              {item.clientConfirmationNotes && (
                                <div className="sla-note">
                                  {item.clientConfirmationNotes}
                                </div>
                              )}
                            </div>
                          </td>

                          <td>
                            <textarea
                              className="md-remark-textarea"
                              rows="3"
                              value={remarkValue}
                              disabled={isRowUpdating}
                              placeholder={
                                status === "Pending"
                                  ? "Enter MD remarks..."
                                  : "MD review comments"
                              }
                              onChange={(event) =>
                                handleMdRemarkChange(
                                  item._id,
                                  event.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            <div className="md-action-buttons">
                              {status === "Approved" ? (
                                <span className="md-status approved">
                                  <Check size={13} />
                                  Approved
                                </span>
                              ) : status === "Rejected" ? (
                                <span className="md-status rejected">
                                  <X size={13} />
                                  Rejected
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="md-reject-btn md-icon-action"
                                    disabled={isRowUpdating}
                                    onClick={() => handleInlineReject(item)}
                                    title="Reject"
                                    aria-label="Reject order"
                                  >
                                    <X size={15} />
                                  </button>

                                  <button
                                    type="button"
                                    className="md-approve-btn md-icon-action"
                                    disabled={isRowUpdating}
                                    onClick={() => handleInlineApprove(item)}
                                    title="Approve"
                                    aria-label="Approve order"
                                  >
                                    <Check size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="approval-expanded-row order-expanded-row">
                            <td colSpan="9">
                              <div className="order-expand-compact">
                                <div className="order-expand-section-head">
                                  <div>
                                    <span>ORDER FINALIZATION DETAILS</span>
                                    <strong>
                                      {item.companyName ||
                                        item.client ||
                                        item.customer ||
                                        "Client Order"}
                                    </strong>
                                  </div>

                                  <span
                                    className={`md-status ${status.toLowerCase()}`}
                                  >
                                    {status === "Approved" && (
                                      <Check size={11} />
                                    )}
                                    {status === "Rejected" && (
                                      <X size={11} />
                                    )}
                                    {status}
                                  </span>
                                </div>

                                <div className="order-balance-mini-grid">
                                  <div className="order-balance-field">
                                    <span>Order Ref</span>
                                    <strong>
                                      {item.orderReferenceNumber ||
                                        item.tripId ||
                                        item.id ||
                                        "—"}
                                    </strong>
                                  </div>

                                  <div className="order-balance-field">
                                    <span>Rate Basis</span>
                                    <strong>{item.rateBasis || "—"}</strong>
                                  </div>

                                  <div className="order-balance-field order-balance-confirmation">
                                    <span>Client Confirmation</span>
                                    <strong
                                      title={item.clientConfirmationNotes || ""}
                                    >
                                      {item.clientConfirmationNotes || "—"}
                                    </strong>
                                  </div>

                                  <div className="order-balance-field">
                                    <span>Requested</span>
                                    <strong>
                                      {formatDateTime(
                                        item.approvalRequestedAt
                                      )}
                                    </strong>
                                  </div>

                                  <div className="order-balance-field">
                                    <span>Reviewed</span>
                                    <strong>
                                      {formatDateTime(
                                        item.approvalReviewedAt
                                      )}
                                    </strong>
                                  </div>

                                  <div className="order-balance-field">
                                    <span>Approval Status</span>
                                    <strong>{status}</strong>
                                  </div>

                                  <div className="order-balance-field order-balance-remarks">
                                    <span>MD Review Remarks</span>
                                    <strong
                                      title={
                                        item.approvalRejectionReason ||
                                        item.approvalRemarks ||
                                        ""
                                      }
                                    >
                                      {item.approvalRejectionReason ||
                                        item.approvalRemarks ||
                                        "—"}
                                    </strong>
                                  </div>
                                </div>

                                <div className="create-trip-mini-section">
                                  <div className="create-trip-mini-head">
                                    <div>
                                      <span>CREATE TRIP</span>
                                      <strong>Vehicle Request List</strong>
                                    </div>

                                    <span className="create-trip-mini-count">
                                      {Array.isArray(item.vehicles)
                                        ? item.vehicles.length
                                        : 0}{" "}
                                      Request
                                      {Array.isArray(item.vehicles) &&
                                      item.vehicles.length !== 1
                                        ? "s"
                                        : ""}
                                    </span>
                                  </div>

                                  <div className="create-trip-mini-table-wrap">
                                    <table className="create-trip-mini-table">
                                      <thead>
                                        <tr>
                                          <th>#</th>
                                          <th>Vehicle Type</th>
                                          <th>Configuration</th>
                                          <th>Classification</th>
                                          <th>Qty</th>
                                          <th>Weight</th>
                                          <th>Dimensions (L × H × W)</th>
                                          <th>Remarks</th>
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {(!Array.isArray(item.vehicles) ||
                                          item.vehicles.length === 0) && (
                                          <tr>
                                            <td
                                              colSpan="8"
                                              className="create-trip-mini-empty"
                                            >
                                              No Create Trip vehicle requests available.
                                            </td>
                                          </tr>
                                        )}

                                        {(Array.isArray(item.vehicles)
                                          ? item.vehicles
                                          : []
                                        ).map((requestVehicle, requestIndex) => {
                                          const requestDimensions = [
                                            requestVehicle.length,
                                            requestVehicle.height,
                                            requestVehicle.width,
                                          ];

                                          const hasRequestDimensions =
                                            requestDimensions.some(
                                              (value) =>
                                                value !== undefined &&
                                                value !== null &&
                                                value !== ""
                                            );

                                          return (
                                            <tr
                                              key={
                                                requestVehicle.vehicleSubId ||
                                                requestVehicle._id ||
                                                `${rowId}-request-${requestIndex}`
                                              }
                                            >
                                              <td>
                                                {String(
                                                  requestIndex + 1
                                                ).padStart(2, "0")}
                                              </td>
                                              <td>
                                                {requestVehicle.vehicleType ||
                                                  "—"}
                                              </td>
                                              <td>
                                                {requestVehicle.configurationModel ||
                                                  "—"}
                                              </td>
                                              <td>
                                                {requestVehicle.movementClassification ||
                                                  "—"}
                                              </td>
                                              <td>
                                                {requestVehicle.quantity || 1}
                                              </td>
                                              <td>
                                                {requestVehicle.weight !== undefined &&
                                                requestVehicle.weight !== null &&
                                                requestVehicle.weight !== ""
                                                  ? `${requestVehicle.weight} T`
                                                  : "—"}
                                              </td>
                                              <td>
                                                {hasRequestDimensions
                                                  ? `${requestVehicle.length || "—"} × ${requestVehicle.height || "—"} × ${requestVehicle.width || "—"} FT`
                                                  : "—"}
                                              </td>
                                              <td
                                                className="create-trip-mini-remarks"
                                                title={
                                                  requestVehicle.remarks ||
                                                  requestVehicle.remark ||
                                                  requestVehicle.vehicleRemarks ||
                                                  ""
                                                }
                                              >
                                                {requestVehicle.remarks ||
                                                  requestVehicle.remark ||
                                                  requestVehicle.vehicleRemarks ||
                                                  "—"}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}


      {activeRequestTab === "vehicle" && (
        <div className="client-rate-card vehicle-rate-card">

          <div className="client-rate-heading vehicle-rate-heading">
            <div>
              <h2>
                🚚 Vehicle Allocation Finalization
                <span>(Transporter &amp; Rate Approval)</span>
              </h2>

            </div>

            <span className="client-rate-badge vehicle-rate-badge">
              VEHICLE APPROVAL
            </span>
          </div>

          {error && (
            <div className="client-rate-error">
              {error}
            </div>
          )}

          <div className="client-rate-table-wrap vehicle-rate-table-wrap">
            <table className="client-rate-table vehicle-rate-table">
              <thead>
                <tr>
                  <th className="row-expand-column" aria-label="Expand row"></th>
                  <th>Customer</th>
                  <th>Responsible KAM</th>
                  <th>Vehicle Requirement</th>
                  <th>Origin → Destination</th>
                  <th>Transport Name</th>
                  <th>Quotation Amount</th>
                  <th>MD Remarks</th>
                  <th>Approval Action</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="client-rate-empty">
                      Loading vehicle approvals...
                    </td>
                  </tr>
                ) : filteredVehicleApprovalRows.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="client-rate-empty">
                      No vehicle approval requests found.
                    </td>
                  </tr>
                ) : (
                  filteredVehicleApprovalRows.map((row) => {
                    const {
                      order,
                      vehicle,
                      key,
                    } = row;

                    const options =
                      Array.isArray(vehicle.transportOptions)
                        ? vehicle.transportOptions
                        : [];

                    const vehicleStatus =
                      vehicle.vehicleApprovalStatus ||
                      (vehicle.quotationStatus === "Approved"
                        ? "Approved"
                        : vehicle.quotationStatus === "Rejected"
                          ? "Rejected"
                          : "Pending");

                    const selectedValue =
                      vehicleSelections[key] ||
                      vehicle.approvedQuotationId ||
                      vehicle.selectedTransport?.quotationId ||
                      "";

                    const selectedOption =
                      options.find(
                        (option) =>
                          option.quotationId === selectedValue
                      ) || null;

                    const isUpdating =
                      vehicleUpdatingKey === key;

                    const remarkValue =
                      vehicleRemarks[key] ??
                      (vehicleStatus === "Rejected"
                        ? vehicle.vehicleRejectionReason ||
                        vehicle.vehicleApprovalRemarks ||
                        vehicle.quotationRemark ||
                        ""
                        : vehicle.vehicleApprovalRemarks ||
                        "");

                    const assignedKam =
                      order.responsibleKam ||
                      order.assignedKam ||
                      order.responsibleKAM ||
                      order.assignedKAM ||
                      order.kamName ||
                      "—";

                    const route =
                      String(order.movementType || "")
                        .toLowerCase()
                        .includes("intercart")
                        ? order.siteLocation || "—"
                        : `${order.origin || "—"} → ${order.destination || "—"
                        }`;

                    const isExpanded =
                      expandedVehicleRow === key;

                    const displaySelectedOption =
                      selectedOption ||
                      options.find(
                        (option) =>
                          option.quotationId ===
                          vehicle.approvedQuotationId
                      ) ||
                      null;

                    return (
                      <React.Fragment key={key}>
                        <tr
                          className={`approval-data-row expandable-main-row ${
                            isExpanded ? "expanded" : ""
                          }`}
                          onClick={(event) => {
                            if (
                              event.target.closest(
                                "button, textarea, select, input, a, label"
                              )
                            ) {
                              return;
                            }

                            setExpandedVehicleRow(
                              isExpanded ? null : key
                            );
                          }}
                        >
                          <td className="row-expand-cell">
                            <button
                              type="button"
                              className={`row-expand-button ${
                                isExpanded ? "open" : ""
                              }`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedVehicleRow(
                                  isExpanded ? null : key
                                );
                              }}
                              aria-expanded={isExpanded}
                              aria-label={
                                isExpanded
                                  ? "Hide vehicle details"
                                  : "Show vehicle details"
                              }
                              title={
                                isExpanded
                                  ? "Hide details"
                                  : "Show details"
                              }
                            >
                              <ChevronDown size={16} />
                            </button>
                          </td>

                          <td>
                            <strong className="client-name">
                              {order.companyName ||
                                order.customer ||
                                order.client ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <span className="assigned-kam-cell">
                              {assignedKam}
                            </span>
                          </td>

                          <td>
                            <div className="vehicle-requirement-cell">
                              <strong>
                                {vehicle.vehicleType || "Vehicle"}
                              </strong>
                              <span>
                                {vehicle.quantity || 0} NOS
                                {vehicle.configurationModel
                                  ? ` • ${vehicle.configurationModel}`
                                  : ""}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="vehicle-inline-route">
                              {route}
                            </span>
                          </td>

                          <td>
                            {options.length === 0 ? (
                              <span className="vehicle-no-option-text">
                                No quotations
                              </span>
                            ) : (
                              <select
                                className="vehicle-quotation-select"
                                value={selectedValue}
                                disabled={
                                  isUpdating ||
                                  vehicleStatus === "Approved"
                                }
                                onChange={(event) =>
                                  handleVehicleSelection(
                                    key,
                                    event.target.value
                                  )
                                }
                              >
                                <option value="">
                                  Select transporter
                                </option>

                                {options.map((option, index) => (
                                  <option
                                    key={
                                      option.quotationId ||
                                      `${key}-${index}`
                                    }
                                    value={option.quotationId || ""}
                                  >
                                    {option.transportName ||
                                      `Transporter ${index + 1}`}
                                    {option.amount !== undefined &&
                                    option.amount !== null &&
                                    option.amount !== ""
                                      ? ` - ${formatAmount(option.amount)}`
                                      : ""}
                                  </option>
                                ))}
                              </select>
                            )}

                            {selectedOption && (
                              <span className="vehicle-selected-contact">
                                {selectedOption.contactName || ""}
                                {selectedOption.contactNumber
                                  ? `${selectedOption.contactName ? " • " : ""}${selectedOption.contactNumber}`
                                  : ""}
                              </span>
                            )}
                          </td>

                          <td>
                            <strong className="client-agreed-rate vehicle-selected-rate">
                              {selectedOption
                                ? formatAmount(selectedOption.amount)
                                : vehicle.selectedTransport?.amount !==
                                  undefined
                                  ? formatAmount(
                                      vehicle.selectedTransport.amount
                                    )
                                  : "—"}
                            </strong>
                          </td>

                          <td>
                            <textarea
                              className="md-remark-textarea"
                              rows="3"
                              value={remarkValue}
                              disabled={isUpdating}
                              placeholder="Enter MD remarks..."
                              onChange={(event) =>
                                handleVehicleRemarkChange(
                                  key,
                                  event.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            <div className="md-action-buttons">
                              {vehicleStatus === "Approved" ? (
                                <span className="md-status approved">
                                  <Check size={13} />
                                  Approved
                                </span>
                              ) : vehicleStatus === "Rejected" ? (
                                <span className="md-status rejected">
                                  <X size={13} />
                                  Rejected
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="md-approve-btn md-icon-action"
                                    disabled={
                                      isUpdating || !selectedValue
                                    }
                                    onClick={() =>
                                      updateVehicleApproval(
                                        row,
                                        "Approved"
                                      )
                                    }
                                    title="Approve"
                                    aria-label="Approve vehicle allocation"
                                  >
                                    <Check size={15} />
                                  </button>

                                  <button
                                    type="button"
                                    className="md-reject-btn md-icon-action"
                                    disabled={isUpdating}
                                    onClick={() =>
                                      updateVehicleApproval(
                                        row,
                                        "Rejected"
                                      )
                                    }
                                    title="Reject"
                                    aria-label="Reject vehicle allocation"
                                  >
                                    <X size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="approval-expanded-row vehicle-only-expanded-row">
                            <td colSpan="9">
                              <div className="vehicle-request-only-compact">
                                <div className="vehicle-request-only-head">
                                  <div>
                                    <span>REQUIRED VEHICLE DETAILS</span>
                                    <strong>
                                      {vehicle.vehicleType || "Vehicle Requirement"}
                                    </strong>
                                  </div>
                                </div>

                                <div className="vehicle-request-only-grid">
                                  <div><span>Vehicle Type</span><strong>{vehicle.vehicleType || "—"}</strong></div>
                                  <div><span>Configuration</span><strong>{vehicle.configurationModel || "—"}</strong></div>
                                  <div><span>Classification</span><strong>{vehicle.movementClassification || "—"}</strong></div>
                                  <div><span>Quantity</span><strong>{vehicle.quantity || 1}</strong></div>
                                  <div><span>Weight</span><strong>{vehicle.weight !== undefined && vehicle.weight !== null && vehicle.weight !== "" ? `${vehicle.weight} T` : "—"}</strong></div>
                                  <div><span>Dimensions</span><strong>{[vehicle.length, vehicle.height, vehicle.width].some((value) => value !== undefined && value !== null && value !== "") ? `${vehicle.length || "—"} × ${vehicle.height || "—"} × ${vehicle.width || "—"} FT` : "—"}</strong></div>
                                  <div className="vehicle-request-only-remarks"><span>Remarks</span><strong>{vehicle.remarks || vehicle.remark || vehicle.vehicleRemarks || "—"}</strong></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


    </div>
  );
};


export default Approvalmanagement;