import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./approvalmanagement.css";

/* =========================================================
   API
========================================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const TRIP_API_URL =
  `${API_BASE_URL}/api/triporders`;

/* =========================================================
   HELPERS
========================================================= */

const getArrayFromResponse = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.orders)) {
    return payload.orders;
  }

  return [];
};

const getObjectFromResponse = (payload) => {
  if (
    payload?.data &&
    typeof payload.data === "object"
  ) {
    return payload.data;
  }

  return payload;
};

const safeArray = (value) =>
  Array.isArray(value)
    ? value
    : [];

const normalizeStatus = (value) =>
  String(value || "Pending").trim();

const getStatusClass = (status) => {
  const normalized =
    normalizeStatus(status)
      .toLowerCase();

  if (normalized === "approved") {
    return "approved";
  }

  if (normalized === "rejected") {
    return "rejected";
  }

  return "pending";
};

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

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatDateTime = (value) => {
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

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const formatAmount = (value) => {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
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
  ).format(amount);
};

const formatDimension = (
  dimensions
) => {
  const length =
    dimensions?.length;

  const height =
    dimensions?.height;

  const width =
    dimensions?.width;

  const hasDimension =
    length !== null &&
      length !== undefined &&
      length !== "" ||
    height !== null &&
      height !== undefined &&
      height !== "" ||
    width !== null &&
      width !== undefined &&
      width !== "";

  if (!hasDimension) {
    return "—";
  }

  return `${
    length ?? "-"
  } × ${
    height ?? "-"
  } × ${
    width ?? "-"
  }`;
};

const getRequirement = (
  order,
  requirementId
) =>
  safeArray(
    order?.vehicleRequirements
  ).find(
    (requirement) =>
      requirement.requirementId ===
      requirementId
  );

const getQuotationsForRequirement = (
  order,
  requirementId
) =>
  safeArray(
    order?.trafficQuotations
  ).filter(
    (quotation) =>
      quotation.requirementId ===
      requirementId
  );

const getConfirmationsForRequirement = (
  order,
  requirementId
) =>
  safeArray(
    order?.vehicleConfirmations
  ).filter(
    (confirmation) =>
      confirmation.requirementId ===
      requirementId
  );

const getApprovedConfirmation = (
  order,
  requirementId
) =>
  getConfirmationsForRequirement(
    order,
    requirementId
  ).find(
    (confirmation) =>
      confirmation.status ===
      "Approved"
  );

const getLatestConfirmation = (
  order,
  requirementId
) => {
  const confirmations =
    getConfirmationsForRequirement(
      order,
      requirementId
    );

  if (
    confirmations.length === 0
  ) {
    return null;
  }

  return (
    confirmations.find(
      (confirmation) =>
        confirmation.status ===
        "Approved"
    ) ||
    confirmations[
      confirmations.length - 1
    ]
  );
};

const getQuotationById = (
  order,
  quotationId
) =>
  safeArray(
    order?.trafficQuotations
  ).find(
    (quotation) =>
      quotation.quotationId ===
      quotationId
  );

const getRequirementQuotationStatus = (
  order,
  requirementId
) => {
  const approved =
    getApprovedConfirmation(
      order,
      requirementId
    );

  if (approved) {
    return "Approved";
  }

  const confirmations =
    getConfirmationsForRequirement(
      order,
      requirementId
    );

  const quotations =
    getQuotationsForRequirement(
      order,
      requirementId
    );

  if (
    quotations.length === 0
  ) {
    return "Waiting for Traffic";
  }

  if (
    confirmations.length > 0 &&
    confirmations.every(
      (confirmation) =>
        confirmation.status ===
        "Rejected"
    )
  ) {
    return "Rejected";
  }

  return "Pending";
};

const getQuotationStatusClass = (
  status
) => {
  if (
    status === "Approved"
  ) {
    return "approved";
  }

  if (
    status === "Rejected"
  ) {
    return "rejected";
  }

  return "pending";
};

const getOrderApprovalStatus = (
  order
) =>
  normalizeStatus(
    order?.orderApproval?.status
  );

const getTotalRequiredVehicles = (
  order
) =>
  safeArray(
    order?.vehicleRequirements
  ).reduce(
    (total, requirement) =>
      total +
      Math.max(
        Number(
          requirement?.quantity
        ) || 0,
        0
      ),
    0
  );

const getApprovedRequirementCount = (
  order
) =>
  safeArray(
    order?.vehicleRequirements
  ).filter(
    (requirement) =>
      Boolean(
        getApprovedConfirmation(
          order,
          requirement.requirementId
        )
      )
  ).length;

/* =========================================================
   COMPONENT
========================================================= */

const Approvalmanagement = () => {
  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    activeView,
    setActiveView,
  ] = useState(
    "order"
  );

  const [
    expandedOrderId,
    setExpandedOrderId,
  ] = useState(null);

  const [
    orderRemarks,
    setOrderRemarks,
  ] = useState({});

  const [
    orderRejectionReasons,
    setOrderRejectionReasons,
  ] = useState({});

  const [
    quotationSelections,
    setQuotationSelections,
  ] = useState({});

  const [
    quotationRemarks,
    setQuotationRemarks,
  ] = useState({});

  const [
    quotationRejectionReasons,
    setQuotationRejectionReasons,
  ] = useState({});

  const [
    orderUpdatingId,
    setOrderUpdatingId,
  ] = useState("");

  const [orderActionModal, setOrderActionModal] = useState(null);
  const [orderActionRemark, setOrderActionRemark] = useState("");

  const openOrderActionModal = (order, action) => {
    if (!order?._id || orderUpdatingId) return;

    setOrderActionRemark(
      orderRemarks[order._id] ??
        order.orderApproval?.remarks ??
        ""
    );

    setOrderActionModal({ order, action });
  };

  const closeOrderActionModal = () => {
    if (orderUpdatingId) return;
    setOrderActionModal(null);
    setOrderActionRemark("");
  };


  const [
    quotationUpdatingKey,
    setQuotationUpdatingKey,
  ] = useState("");

  const [
    quotationActionModal,
    setQuotationActionModal,
  ] = useState(null);

  const [
    quotationActionRemark,
    setQuotationActionRemark,
  ] = useState("");

  const openQuotationActionModal = (
    order,
    requirement,
    action
  ) => {
    if (quotationUpdatingKey) return;

    const rowKey = getRowKey(
      order._id,
      requirement.requirementId
    );

    const selectedQuotationId =
      quotationSelections[rowKey] || "";

    if (!selectedQuotationId) {
      setError(
        action === "Approved"
          ? "Select a transporter quotation before approving."
          : "Select the quotation you want to reject."
      );
      return;
    }

    const selectedQuotation =
      getQuotationsForRequirement(
        order,
        requirement.requirementId
      ).find(
        (quotation) =>
          quotation.quotationId === selectedQuotationId
      );

    if (!selectedQuotation) {
      setError("Selected quotation was not found.");
      return;
    }

    setError("");
    setQuotationActionRemark("");
    setQuotationActionModal({
      order,
      requirement,
      action,
      rowKey,
      quotation: selectedQuotation,
    });
  };

  const closeQuotationActionModal = () => {
    if (quotationUpdatingKey) return;
    setQuotationActionModal(null);
    setQuotationActionRemark("");
  };

  /* =======================================================
     FETCH
  ======================================================= */

  const fetchApprovals =
    useCallback(
      async (
        silent = false
      ) => {
        try {
          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const response =
            await fetch(
              TRIP_API_URL,
              {
                method: "GET",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const payload =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (!response.ok) {
            throw new Error(
              payload?.message ||
                "Unable to load approval orders."
            );
          }

          const nextOrders =
            getArrayFromResponse(
              payload
            );

          setOrders(
            nextOrders
          );
        } catch (
          fetchError
        ) {
          console.error(
            "Approval fetch error:",
            fetchError
          );

          setError(
            fetchError.message ||
              "Unable to load approval orders."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredOrders =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      if (!query) {
        return orders;
      }

      return orders.filter(
        (order) => {
          const requirementText =
            safeArray(
              order.vehicleRequirements
            )
              .map(
                (requirement) =>
                  [
                    requirement.vehicleType,
                    requirement.configuration,
                    requirement.classification,
                    requirement.requirementId,
                  ]
                    .filter(Boolean)
                    .join(" ")
              )
              .join(" ");

          const quotationText =
            safeArray(
              order.trafficQuotations
            )
              .map(
                (quotation) =>
                  [
                    quotation.transporter,
                    quotation.quotedBy,
                    quotation.quotationId,
                  ]
                    .filter(Boolean)
                    .join(" ")
              )
              .join(" ");

          return [
            order.tripId,
            order.customer,
            order.contactPerson,
            order.contactNumber,
            order.email,
            order.assignedKam,
            order.origin,
            order.destination,
            order.materialType,
            requirementText,
            quotationText,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query);
        }
      );
    }, [
      orders,
      searchTerm,
    ]);

  /* =======================================================
     ORDER APPROVAL DATA
  ======================================================= */

  const orderApprovalRows =
    useMemo(
      () =>
        filteredOrders.filter(
          (order) =>
            safeArray(
              order.vehicleRequirements
            ).length > 0
        ),
      [filteredOrders]
    );

  /* =======================================================
     QUOTATION APPROVAL DATA
  ======================================================= */

  const quotationApprovalOrders =
    useMemo(
      () =>
        filteredOrders.filter(
          (order) =>
            getOrderApprovalStatus(
              order
            ) ===
              "Approved" &&
            safeArray(
              order.trafficQuotations
            ).length > 0
        ),
      [filteredOrders]
    );

  /* =======================================================
     COUNTS
  ======================================================= */

  const summary =
    useMemo(() => {
      const pendingOrders =
        orders.filter(
          (order) =>
            getOrderApprovalStatus(
              order
            ) ===
            "Pending"
        ).length;

      const approvedOrders =
        orders.filter(
          (order) =>
            getOrderApprovalStatus(
              order
            ) ===
            "Approved"
        ).length;

      const rejectedOrders =
        orders.filter(
          (order) =>
            getOrderApprovalStatus(
              order
            ) ===
            "Rejected"
        ).length;

      let pendingQuotations =
        0;

      let approvedQuotations =
        0;

      orders.forEach(
        (order) => {
          safeArray(
            order.vehicleRequirements
          ).forEach(
            (requirement) => {
              const quotations =
                getQuotationsForRequirement(
                  order,
                  requirement.requirementId
                );

              if (
                quotations.length ===
                0
              ) {
                return;
              }

              const status =
                getRequirementQuotationStatus(
                  order,
                  requirement.requirementId
                );

              if (
                status ===
                "Approved"
              ) {
                approvedQuotations +=
                  1;
              } else if (
                status ===
                "Pending"
              ) {
                pendingQuotations +=
                  1;
              }
            }
          );
        }
      );

      return {
        pendingOrders,
        approvedOrders,
        rejectedOrders,
        pendingQuotations,
        approvedQuotations,
      };
    }, [orders]);

  /* =======================================================
     ORDER APPROVAL
  ======================================================= */

  const updateOrderApproval =
    async (
      order,
      status,
      modalRemark = null
    ) => {
      if (
        !order?._id ||
        orderUpdatingId
      ) {
        return;
      }

      const approvedBy =
        "Approval Management";

      const remarks =
        (
          modalRemark !== null
            ? modalRemark
            : orderRemarks[order._id] || ""
        ).trim();

      const rejectionReason =
        status === "Rejected"
          ? remarks
          : (
              orderRejectionReasons[order._id] || ""
            ).trim();

      if (
        status ===
          "Rejected" &&
        !rejectionReason
      ) {
        setError(
          "Enter a rejection reason before rejecting the order."
        );

        return;
      }

      try {
        setOrderUpdatingId(
          order._id
        );

        setError("");
        setSuccessMessage("");

        const response =
          await fetch(
            `${TRIP_API_URL}/${order._id}/order-approval`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    status,
                    approvedBy,
                    remarks,
                    rejectionReason:
                      status ===
                      "Rejected"
                        ? rejectionReason
                        : "",
                  }
                ),
            }
          );

        const payload =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              `Unable to ${status.toLowerCase()} order.`
          );
        }

        const updatedOrder =
          getObjectFromResponse(
            payload
          );

        if (
          updatedOrder?._id
        ) {
          setOrders(
            (previous) =>
              previous.map(
                (
                  currentOrder
                ) =>
                  currentOrder._id ===
                  updatedOrder._id
                    ? updatedOrder
                    : currentOrder
              )
          );
        } else {
          await fetchApprovals(
            true
          );
        }

        setSuccessMessage(
          status === "Approved"
            ? `${order.tripId} approved and released to Traffic.`
            : `${order.tripId} rejected.`
        );

        setOrderActionModal(null);
        setOrderActionRemark("");

        setOrderRemarks(
          (previous) => {
            const next = {
              ...previous,
            };

            delete next[
              order._id
            ];

            return next;
          }
        );

        setOrderRejectionReasons(
          (previous) => {
            const next = {
              ...previous,
            };

            delete next[
              order._id
            ];

            return next;
          }
        );
      } catch (
        approvalError
      ) {
        console.error(
          "Order approval error:",
          approvalError
        );

        setError(
          approvalError.message ||
            "Unable to update order approval."
        );
      } finally {
        setOrderUpdatingId(
          ""
        );
      }
    };

  /* =======================================================
     QUOTATION SELECTION
  ======================================================= */

  const getRowKey = (
    orderId,
    requirementId
  ) =>
    `${orderId}::${requirementId}`;

  const handleQuotationSelection = (
    rowKey,
    quotationId
  ) => {
    setQuotationSelections(
      (previous) => ({
        ...previous,
        [rowKey]:
          quotationId,
      })
    );
  };

  /* =======================================================
     QUOTATION CONFIRMATION
  ======================================================= */

  const updateQuotationApproval =
    async (
      order,
      requirement,
      status,
      modalRemark = ""
    ) => {
      if (
        !order?._id ||
        !requirement
          ?.requirementId
      ) {
        return;
      }

      const rowKey =
        getRowKey(
          order._id,
          requirement.requirementId
        );

      if (
        quotationUpdatingKey
      ) {
        return;
      }

      const approvedConfirmation =
        getApprovedConfirmation(
          order,
          requirement.requirementId
        );

      if (
        approvedConfirmation
      ) {
        setError(
          "This vehicle requirement already has an approved transporter quotation."
        );

        return;
      }

      const quotations =
        getQuotationsForRequirement(
          order,
          requirement.requirementId
        );

      const selectedQuotationId =
        quotationSelections[
          rowKey
        ] || "";

      if (
        !selectedQuotationId
      ) {
        setError(
          status === "Approved"
            ? "Select a transporter quotation before approving."
            : "Select the quotation you want to reject."
        );

        return;
      }

      const selectedQuotation =
        quotations.find(
          (quotation) =>
            quotation.quotationId ===
            selectedQuotationId
        );

      if (
        !selectedQuotation
      ) {
        setError(
          "Selected quotation was not found."
        );

        return;
      }

      const remarks =
        String(modalRemark || "").trim();

      const rejectionReason =
        status === "Rejected"
          ? remarks
          : "";

      if (
        status ===
          "Rejected" &&
        !rejectionReason
      ) {
        setError(
          "Enter a rejection reason before rejecting the quotation."
        );

        return;
      }

      try {
        setQuotationUpdatingKey(
          rowKey
        );

        setError("");
        setSuccessMessage("");

        const response =
          await fetch(
            `${TRIP_API_URL}/${order._id}/confirm-quotation`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    requirementId:
                      requirement.requirementId,

                    quotationId:
                      selectedQuotationId,

                    status,

                    confirmedBy:
                      "Approval Management",

                    remarks,

                    rejectionReason:
                      status ===
                      "Rejected"
                        ? rejectionReason
                        : "",
                  }
                ),
            }
          );

        const payload =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              `Unable to ${status.toLowerCase()} transporter quotation.`
          );
        }

        const updatedOrder =
          getObjectFromResponse(
            payload
          );

        if (
          updatedOrder?._id
        ) {
          setOrders(
            (previous) =>
              previous.map(
                (
                  currentOrder
                ) =>
                  currentOrder._id ===
                  updatedOrder._id
                    ? updatedOrder
                    : currentOrder
              )
          );
        } else {
          await fetchApprovals(
            true
          );
        }

        setSuccessMessage(
          status === "Approved"
            ? `${selectedQuotation.transporter} confirmed for ${requirement.vehicleType || requirement.requirementId}. The requirement is now available in Tracking Input.`
            : `${selectedQuotation.transporter} quotation rejected.`
        );

        setQuotationActionModal(null);
        setQuotationActionRemark("");

        setQuotationSelections(
          (previous) => {
            const next = {
              ...previous,
            };

            delete next[
              rowKey
            ];

            return next;
          }
        );

        setQuotationRemarks(
          (previous) => {
            const next = {
              ...previous,
            };

            delete next[
              rowKey
            ];

            return next;
          }
        );

        setQuotationRejectionReasons(
          (previous) => {
            const next = {
              ...previous,
            };

            delete next[
              rowKey
            ];

            return next;
          }
        );
      } catch (
        quotationError
      ) {
        console.error(
          "Quotation approval error:",
          quotationError
        );

        setError(
          quotationError.message ||
            "Unable to update transporter quotation."
        );
      } finally {
        setQuotationUpdatingKey(
          ""
        );
      }
    };

  /* =======================================================
     EXPAND
  ======================================================= */

  const toggleOrder =
    (orderId) => {
      setExpandedOrderId(
        (previous) =>
          previous ===
          orderId
            ? null
            : orderId
      );
    };

  /* =======================================================
     RENDER ORDER REQUIREMENTS
  ======================================================= */

  const renderRequirements = (order) => {
    const requirements = safeArray(order.vehicleRequirements);

    if (!requirements.length) {
      return (
        <div className="approval-vehicle-empty">
          No vehicle requirements available.
        </div>
      );
    }

    const getVehicleDimension = (vehicle) => {
      const dimensions = vehicle?.dimensions || {};

      const length =
        vehicle?.length ??
        dimensions?.length ??
        dimensions?.l ??
        "";

      const height =
        vehicle?.height ??
        dimensions?.height ??
        dimensions?.h ??
        "";

      const width =
        vehicle?.width ??
        dimensions?.width ??
        dimensions?.w ??
        "";

      if (
        (length === "" || length === null || length === undefined) &&
        (height === "" || height === null || height === undefined) &&
        (width === "" || width === null || width === undefined)
      ) {
        return "—";
      }

      return `${length || "—"} × ${height || "—"} × ${width || "—"}`;
    };

    return (
      <div className="approval-vehicle-readonly-list">
        <div className="approval-vehicle-readonly-header">
          <div>No.</div>
          <div>Vehicle Type</div>
          <div>Configuration Model</div>
          <div>Movement Classification</div>
          <div>Quantity</div>
          <div>Weight</div>
          <div>Dimensions (L × H × W)</div>
        </div>

        {requirements.map((vehicle, index) => {
          const requirementId =
            vehicle?.vehicleSubId ||
            vehicle?.requirementId ||
            vehicle?._id ||
            "";

          const vehicleType =
            vehicle?.vehicleType ||
            vehicle?.type ||
            "—";

          const configuration =
            vehicle?.configurationModel ||
            vehicle?.configuration ||
            vehicle?.model ||
            "—";

          const classification =
            vehicle?.movementClassification ||
            vehicle?.classification ||
            "—";

          const quantity =
            vehicle?.quantity ?? "—";

          const weight =
            vehicle?.weight ?? "—";

          return (
            <div
              className="approval-vehicle-readonly-row"
              key={vehicle?._id || vehicle?.vehicleSubId || `${order?._id}-vehicle-${index}`}
            >
              <div className="approval-vehicle-row-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="approval-vehicle-readonly-field approval-vehicle-type-field">
                <span>Vehicle Type</span>
                <strong>{vehicleType}</strong>
                {requirementId ? (
                  <small>Req: {requirementId}</small>
                ) : null}
              </div>

              <div className="approval-vehicle-readonly-field">
                <span>Configuration Model</span>
                <strong>{configuration}</strong>
              </div>

              <div className="approval-vehicle-readonly-field">
                <span>Movement Classification</span>
                <strong>{classification}</strong>
              </div>

              <div className="approval-vehicle-readonly-field approval-vehicle-center-field">
                <span>Quantity</span>
                <strong>
                  {quantity}
                  {quantity !== "—" ? <small> NOS</small> : null}
                </strong>
              </div>

              <div className="approval-vehicle-readonly-field approval-vehicle-center-field">
                <span>Weight</span>
                <strong>
                  {weight}
                  {weight !== "—" ? <small> TON</small> : null}
                </strong>
              </div>

              <div className="approval-vehicle-readonly-field approval-vehicle-dimension-field">
                <span>Dimensions (L × H × W)</span>
                <strong>{getVehicleDimension(vehicle)}</strong>
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  const renderOrderApproval = () => (
    <div className="approval-table-card">
      <div className="approval-table-head">
        <div>
          <h3>Order Approval</h3>
          <p>Review Key Account orders before releasing them to Traffic.</p>
        </div>

        <span className="approval-table-count">
          {orderApprovalRows.length} Orders
        </span>
      </div>

      {orderApprovalRows.length === 0 ? (
        <div className="approval-empty">No orders found.</div>
      ) : (
        <div className="approval-table-wrap">
          <table className="approval-table approval-md-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Client Name</th>
                <th>Movement Type</th>
                <th>Route</th>
                <th>Placement Date</th>
                <th>Assigned KAM</th>
                <th>Agreed Rate</th>
                <th>Commercial Terms &amp; SLAs</th>
                <th>MD Status</th>
                <th>MD Action</th>
              </tr>
            </thead>

            <tbody>
              {orderApprovalRows.map((order) => {
                const status = getOrderApprovalStatus(order);
                const isExpanded = expandedOrderId === order._id;
                const updating = orderUpdatingId === order._id;

                const finalization =
                  order.orderFinalization ||
                  order.finalization ||
                  {};

                const agreedRate =
                  finalization.finalRate ??
                  finalization.agreedRate ??
                  order.finalRate ??
                  order.agreedRate ??
                  null;

                const commercialTerms =
                  finalization.commercialTerms ||
                  finalization.paymentTerms ||
                  order.commercialTerms ||
                  order.paymentTerms ||
                  "—";

                const deliverySla =
                  finalization.deliveryCommitments ||
                  finalization.deliverySla ||
                  finalization.transitSla ||
                  order.deliveryCommitments ||
                  order.transitSla ||
                  "";

                return (
                  <React.Fragment key={order._id || order.tripId}>
                    <tr
                      className={`approval-md-main-row ${
                        isExpanded
                          ? "approval-row-expanded approval-md-row-selected"
                          : ""
                      }`}
                      onClick={() => toggleOrder(order._id)}
                    >
                      <td>
                        <button
                          type="button"
                          className="approval-md-order-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleOrder(order._id);
                          }}
                        >
                          <span
                            className={`approval-md-arrow ${
                              isExpanded ? "open" : ""
                            }`}
                          >
                            ›
                          </span>
                          <span className="approval-md-trip">
                            {order.tripId || "—"}
                          </span>
                        </button>
                      </td>

                      <td>
                        <strong className="approval-md-client">
                          {order.customer || "—"}
                        </strong>
                      </td>

                      <td>
                        <span className="approval-md-movement">
                          {order.movementType || "—"}
                        </span>
                      </td>

                      <td>
                        <div className="approval-md-route">
                          <strong>{order.origin || "—"}</strong>
                          <span>→</span>
                          <strong>{order.destination || "—"}</strong>
                        </div>
                      </td>

                      <td>
                        <span className="approval-md-placement">
                          {formatDate(order.placementDate)}
                        </span>
                      </td>

                      <td>
                        <span className="approval-md-kam">
                          {order.assignedKam || "—"}
                        </span>
                      </td>

                      <td>
                        <strong className="approval-md-rate">
                          {agreedRate !== null &&
                          agreedRate !== undefined &&
                          agreedRate !== ""
                            ? formatAmount(agreedRate)
                            : "—"}
                        </strong>
                      </td>

                      <td>
                        <div className="approval-md-terms">
                          <div>
                            <strong>Terms:</strong> {commercialTerms}
                          </div>

                          {deliverySla && (
                            <div className="approval-md-sla">
                              <strong>SLA:</strong> {deliverySla}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`approval-md-status ${getStatusClass(
                            status
                          )}`}
                        >
                          {status === "Approved" && "✓ "}
                          {status === "Rejected" && "× "}
                          {status.toUpperCase()}
                        </span>
                      </td>

                      <td onClick={(event) => event.stopPropagation()}>
                        <div className="approval-md-actions approval-md-icon-actions">
                          <button
                            type="button"
                            className="approval-md-action-icon approval-md-approve-icon"
                            title="Approve order"
                            aria-label="Approve order"
                            disabled={updating || status !== "Pending"}
                            onClick={() =>
                              openOrderActionModal(order, "Approved")
                            }
                          >
                            <span aria-hidden="true">✓</span>
                          </button>

                          <button
                            type="button"
                            className="approval-md-action-icon approval-md-reject-icon"
                            title="Reject order"
                            aria-label="Reject order"
                            disabled={updating || status !== "Pending"}
                            onClick={() =>
                              openOrderActionModal(order, "Rejected")
                            }
                          >
                            <span aria-hidden="true">×</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="approval-expand-row">
                        <td colSpan="10">
                          <div className="approval-expand-content">
                            <div className="approval-md-expand-section">
                              <div className="approval-order-info-grid">
                                <div>
                                  <span>Material Type</span>
                                  <strong>{order.materialType || "—"}</strong>
                                </div>

                                <div>
                                  <span>Total Vehicles</span>
                                  <strong>
                                    {getTotalRequiredVehicles(order)} NOS
                                  </strong>
                                </div>

                                <div>
                                  <span>Distance</span>
                                  <strong>
                                    {order.distance ?? "—"}
                                    {order.distance !== null &&
                                    order.distance !== undefined &&
                                    order.distance !== ""
                                      ? " KM"
                                      : ""}
                                  </strong>
                                </div>

                                <div>
                                  <span>Enquiry Date</span>
                                  <strong>{formatDate(order.enquiryDate)}</strong>
                                </div>

                                <div className="approval-order-wide-info">
                                  <span>Commercial Terms &amp; Payment SLAs</span>
                                  <strong>
                                    {finalization.commercialTerms ||
                                      finalization.paymentTerms ||
                                      order.commercialTerms ||
                                      order.paymentTerms ||
                                      "—"}
                                  </strong>
                                </div>

                                <div className="approval-order-wide-info">
                                  <span>Delivery Commitments &amp; Transit SLAs</span>
                                  <strong>
                                    {finalization.deliveryCommitments ||
                                      finalization.deliverySla ||
                                      finalization.transitSla ||
                                      order.deliveryCommitments ||
                                      order.transitSla ||
                                      "—"}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            <div className="approval-md-expand-section">
                              <div className="approval-md-section-head">
                                <div>
                                  <h4>Vehicle Details</h4>
                                  <p>Vehicle requirement details</p>
                                </div>
                              </div>

                              {renderRequirements(order)}
                            </div>

                            {order.remark && (
                              <div className="approval-order-remark">
                                <span>Order Remarks</span>
                                <p>{order.remark}</p>
                              </div>
                            )}

                            {status !== "Pending" && (
                              <div className="approval-decision-summary">
                                <span
                                  className={`approval-status ${getStatusClass(
                                    status
                                  )}`}
                                >
                                  {status}
                                </span>

                                <div>
                                  <strong>
                                    {order.orderApproval?.approvedBy ||
                                      "Approval Management"}
                                  </strong>
                                  <small>
                                    {formatDateTime(
                                      order.orderApproval?.approvedAt
                                    )}
                                  </small>
                                </div>

                                {(order.orderApproval?.remarks ||
                                  order.orderApproval?.rejectionReason) && (
                                  <p>
                                    {order.orderApproval?.rejectionReason ||
                                      order.orderApproval?.remarks}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderQuotationApproval = () => (
    <div className="approval-table-card approval-quotation-table-card">
      <div className="approval-table-head">
        <div>
          <h3>Transporter Quotation Approval</h3>
          <p>
            Click an order row to review vehicle requirements and transporter quotations.
          </p>
        </div>

        <span className="approval-table-count">
          {quotationApprovalOrders.length} Orders
        </span>
      </div>

      {quotationApprovalOrders.length === 0 ? (
        <div className="approval-empty">
          No transporter quotations are waiting for review.
        </div>
      ) : (
        <div className="approval-table-wrap approval-quotation-main-wrap">
          <table className="approval-table approval-quotation-main-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Movement</th>
                <th>Route</th>
                <th>Placement</th>
                <th>Vehicle Requirements</th>
                <th>Confirmed</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {quotationApprovalOrders.map((order, orderIndex) => {
                const isExpanded = expandedOrderId === order._id;
                const requirements = safeArray(order.vehicleRequirements);
                const confirmedCount = getApprovedRequirementCount(order);
                const totalRequirements = requirements.length;
                const orderQuotationStatus =
                  totalRequirements > 0 && confirmedCount === totalRequirements
                    ? "Approved"
                    : confirmedCount > 0
                      ? "In Progress"
                      : "Pending";

                return (
                  <React.Fragment key={order._id || order.tripId}>
                    <tr
                      className={`approval-quotation-order-row ${
                        isExpanded ? "expanded" : ""
                      }`}
                      onClick={() => toggleOrder(order._id)}
                    >
                      <td>
                        <span className="approval-quotation-sno">
                          {String(orderIndex + 1).padStart(2, "0")}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="approval-quotation-order-toggle"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleOrder(order._id);
                          }}
                        >
                          <span
                            className={`approval-quotation-chevron ${
                              isExpanded ? "open" : ""
                            }`}
                          >
                            ›
                          </span>
                          <strong>{order.tripId || "—"}</strong>
                        </button>
                      </td>

                      <td>
                        <strong className="approval-quotation-customer">
                          {order.customer || "—"}
                        </strong>
                      </td>

                      <td>
                        <strong className="approval-quotation-row-value">
                          {order.movementType || "—"}
                        </strong>
                      </td>

                      <td>
                        <div className="approval-quotation-route">
                          <span>{order.origin || "—"}</span>
                          <b>→</b>
                          <span>{order.destination || "—"}</span>
                        </div>
                      </td>

                      <td>
                        <strong className="approval-quotation-row-value">
                          {formatDate(order.placementDate)}
                        </strong>
                      </td>

                      <td>
                        <span className="approval-quotation-requirement-count">
                          {totalRequirements} Requirement{totalRequirements === 1 ? "" : "s"}
                        </span>
                      </td>

                      <td>
                        <strong className="approval-quotation-confirmed-count">
                          {confirmedCount}/{totalRequirements}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`approval-status ${
                            orderQuotationStatus === "Approved"
                              ? "approved"
                              : "pending"
                          }`}
                        >
                          {orderQuotationStatus}
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="approval-quotation-expand-row">
                        <td colSpan="9">
                          <div
                            className="approval-quotation-expand-panel"
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Transporter quotation details for ${order.tripId || "order"}`}
                          >
                            <div className="approval-quotation-modal-head">
                              <div className="approval-quotation-modal-title">
                                <span>TRANSPORTER QUOTATION REVIEW</span>
                                <h3>{order.tripId || "Order Details"}</h3>
                                <p>
                                  {order.customer || "—"} <b>•</b> {order.movementType || "—"}
                                  <b>•</b> {order.origin || "—"} → {order.destination || "—"}
                                </p>
                              </div>

                              <div className="approval-quotation-modal-summary">
                                <div>
                                  <span>Requirements</span>
                                  <strong>{totalRequirements}</strong>
                                </div>
                                <div>
                                  <span>Confirmed</span>
                                  <strong>{confirmedCount}/{totalRequirements}</strong>
                                </div>
                                <div>
                                  <span>Status</span>
                                  <strong>{orderQuotationStatus}</strong>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="approval-quotation-modal-close"
                                onClick={() => setExpandedOrderId(null)}
                                aria-label="Close quotation details"
                              >
                                ×
                              </button>
                            </div>

                            <div className="approval-quotation-modal-body">
                              <div className="approval-quotation-vehicle-list">
                              {requirements.map((requirement, index) => {
                                const quotations = getQuotationsForRequirement(
                                  order,
                                  requirement.requirementId
                                );

                                if (!quotations.length) return null;

                                const rowKey = getRowKey(
                                  order._id,
                                  requirement.requirementId
                                );

                                const status = getRequirementQuotationStatus(
                                  order,
                                  requirement.requirementId
                                );

                                const approvedConfirmation = getApprovedConfirmation(
                                  order,
                                  requirement.requirementId
                                );

                                const latestConfirmation = getLatestConfirmation(
                                  order,
                                  requirement.requirementId
                                );

                                const approvedQuotation = approvedConfirmation
                                  ? getQuotationById(
                                      order,
                                      approvedConfirmation.quotationId
                                    )
                                  : null;

                                const updating = quotationUpdatingKey === rowKey;
                                const selectedQuotationId =
                                  quotationSelections[rowKey] || "";
                                const selectedQuotation = quotations.find(
                                  (quotation) =>
                                    quotation.quotationId === selectedQuotationId
                                );

                                return (
                                  <section
                                    className={`approval-qv-card ${
                                      status === "Approved" ? "is-approved" : ""
                                    }`}
                                    key={requirement.requirementId || index}
                                  >
                                    <div className="approval-qv-header">
                                      <div className="approval-qv-number">
                                        {String(index + 1).padStart(2, "0")}
                                      </div>

                                      <div className="approval-qv-title">
                                        <span>VEHICLE REQUIREMENT</span>
                                        <h4>{requirement.vehicleType || "Vehicle"}</h4>
                                        <div className="approval-qv-tags">
                                          <span>{requirement.configuration || "—"}</span>
                                          <span>{requirement.classification || "—"}</span>
                                          <span>Qty {requirement.quantity || 0}</span>
                                          <span>
                                            {requirement.weight ?? "—"}
                                            {requirement.weight !== null &&
                                            requirement.weight !== undefined &&
                                            requirement.weight !== ""
                                              ? " Ton"
                                              : ""}
                                          </span>
                                          <span>{formatDimension(requirement.dimensions)}</span>
                                        </div>
                                      </div>

                                      <span
                                        className={`approval-status ${getQuotationStatusClass(
                                          status
                                        )}`}
                                      >
                                        {status}
                                      </span>
                                    </div>

                                    <div className="approval-qv-table-wrap">
                                      <table className="approval-qv-table">
                                        <thead>
                                          <tr>
                                            <th>Pick</th>
                                            <th>Transporter</th>
                                            <th>Amount</th>
                                            <th>Allocated By</th>
                                            <th>Quoted At</th>
                                            <th>Status</th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {quotations.map((quotation) => {
                                            const selected =
                                              selectedQuotationId ===
                                              quotation.quotationId;
                                            const confirmed =
                                              approvedConfirmation?.quotationId ===
                                              quotation.quotationId;

                                            return (
                                              <tr
                                                key={quotation.quotationId}
                                                className={`${
                                                  selected ? "selected" : ""
                                                } ${confirmed ? "confirmed" : ""}`}
                                                onClick={() => {
                                                  if (!approvedConfirmation && !updating) {
                                                    handleQuotationSelection(
                                                      rowKey,
                                                      quotation.quotationId
                                                    );
                                                  }
                                                }}
                                              >
                                                <td>
                                                  <label
                                                    className="approval-qv-radio"
                                                    onClick={(event) =>
                                                      event.stopPropagation()
                                                    }
                                                  >
                                                    <input
                                                      type="radio"
                                                      name={`quotation-${rowKey}`}
                                                      value={quotation.quotationId}
                                                      checked={confirmed || selected}
                                                      disabled={
                                                        Boolean(approvedConfirmation) ||
                                                        updating
                                                      }
                                                      onChange={() =>
                                                        handleQuotationSelection(
                                                          rowKey,
                                                          quotation.quotationId
                                                        )
                                                      }
                                                    />
                                                    <span />
                                                  </label>
                                                </td>

                                                <td>
                                                  <div className="approval-qv-transporter">
                                                    <strong>
                                                      {quotation.transporter || "—"}
                                                    </strong>
                                                    <small>
                                                      {quotation.quotationId || "—"}
                                                    </small>
                                                  </div>
                                                </td>

                                                <td>
                                                  <strong className="approval-qv-amount">
                                                    {formatAmount(quotation.amount)}
                                                  </strong>
                                                </td>

                                                <td>
                                                  <span className="approval-qv-allocator">
                                                    {quotation.quotedBy || "—"}
                                                  </span>
                                                </td>

                                                <td>
                                                  <span className="approval-qv-date">
                                                    {formatDateTime(quotation.quotedAt)}
                                                  </span>
                                                </td>

                                                <td>
                                                  <span
                                                    className={`approval-qv-row-status ${
                                                      confirmed
                                                        ? "approved"
                                                        : selected
                                                          ? "selected"
                                                          : "pending"
                                                    }`}
                                                  >
                                                    {confirmed
                                                      ? "Confirmed"
                                                      : selected
                                                        ? "Selected"
                                                        : "Pending"}
                                                  </span>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>

                                    {approvedConfirmation ? (
                                      <div className="approval-qv-confirmed-bar">
                                        <div className="approval-qv-confirmed-icon">✓</div>
                                        <div>
                                          <span>Confirmed Transporter</span>
                                          <strong>
                                            {approvedQuotation?.transporter || "—"}
                                          </strong>
                                        </div>
                                        <div>
                                          <span>Amount</span>
                                          <strong>
                                            {formatAmount(approvedQuotation?.amount)}
                                          </strong>
                                        </div>
                                        <div>
                                          <span>Allocated By</span>
                                          <strong>
                                            {approvedQuotation?.quotedBy || "—"}
                                          </strong>
                                        </div>
                                        <div>
                                          <span>Confirmed At</span>
                                          <strong>
                                            {formatDateTime(
                                              approvedConfirmation.confirmedAt
                                            )}
                                          </strong>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="approval-qv-actionbar">
                                        <div className="approval-qv-selected-summary">
                                          {selectedQuotation ? (
                                            <>
                                              <span>Selected quotation</span>
                                              <strong>
                                                {selectedQuotation.transporter || "—"}
                                                <b>•</b>
                                                {formatAmount(selectedQuotation.amount)}
                                                <b>•</b>
                                                Allocated by {selectedQuotation.quotedBy || "—"}
                                              </strong>
                                            </>
                                          ) : (
                                            <>
                                              <span>Selection required</span>
                                              <strong>
                                                Select one transporter quotation above.
                                              </strong>
                                            </>
                                          )}
                                        </div>

                                        <div className="approval-qv-actions">
                                          <button
                                            type="button"
                                            className="approval-qv-reject-btn"
                                            disabled={updating || !selectedQuotationId}
                                            onClick={() =>
                                              openQuotationActionModal(
                                                order,
                                                requirement,
                                                "Rejected"
                                              )
                                            }
                                          >
                                            Reject
                                          </button>

                                          <button
                                            type="button"
                                            className="approval-qv-approve-btn"
                                            disabled={updating || !selectedQuotationId}
                                            onClick={() =>
                                              openQuotationActionModal(
                                                order,
                                                requirement,
                                                "Approved"
                                              )
                                            }
                                          >
                                            Confirm Transporter
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {!approvedConfirmation &&
                                      latestConfirmation?.status === "Rejected" && (
                                        <div className="approval-qv-last-rejection">
                                          <strong>Last quotation rejected</strong>
                                          <span>
                                            {latestConfirmation.rejectionReason ||
                                              latestConfirmation.remarks ||
                                              "No rejection remarks"}
                                          </span>
                                        </div>
                                      )}
                                  </section>
                                );
                              })}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="approval-management-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="approval-page-header">

        <div>

          <span className="approval-page-eyebrow">
            KEY ACCOUNT MANAGEMENT
          </span>

          <h2>
            Approval Management
          </h2>

          <p>
            Review customer orders and
            transporter quotations
            before operational tracking.
          </p>

        </div>

        <button
          type="button"
          className="approval-refresh-btn"
          onClick={() =>
            fetchApprovals(true)
          }
          disabled={
            refreshing
          }
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* ===================================================
          MESSAGES
      =================================================== */}

      {error && (
        <div className="approval-alert approval-alert-error">
          <span>
            !
          </span>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="approval-alert approval-alert-success">
          <span>
            ✓
          </span>

          <p>
            {successMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage(
                ""
              )
            }
          >
            ×
          </button>
        </div>
      )}

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <div className="approval-summary-grid">

        <div className="approval-summary-card">

          <span>
            Pending Orders
          </span>

          <strong>
            {summary.pendingOrders}
          </strong>

          <small>
            Awaiting first approval
          </small>

        </div>

        <div className="approval-summary-card">

          <span>
            Approved Orders
          </span>

          <strong>
            {summary.approvedOrders}
          </strong>

          <small>
            Released to Traffic
          </small>

        </div>

        <div className="approval-summary-card">

          <span>
            Pending Quotations
          </span>

          <strong>
            {summary.pendingQuotations}
          </strong>

          <small>
            Awaiting transporter selection
          </small>

        </div>

        <div className="approval-summary-card">

          <span>
            Confirmed Vehicles
          </span>

          <strong>
            {summary.approvedQuotations}
          </strong>

          <small>
            Released to Tracking Input
          </small>

        </div>

      </div>

      {/* ===================================================
          TOOLBAR
      =================================================== */}

      <div className="approval-toolbar">

        <div className="approval-tabs">

          <button
            type="button"
            className={
              activeView ===
              "order"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveView(
                "order"
              )
            }
          >
            Order Approval

            {summary.pendingOrders >
              0 && (
              <span>
                {
                  summary.pendingOrders
                }
              </span>
            )}
          </button>

          <button
            type="button"
            className={
              activeView ===
              "quotation"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveView(
                "quotation"
              )
            }
          >
            Quotation Approval

            {summary.pendingQuotations >
              0 && (
              <span>
                {
                  summary.pendingQuotations
                }
              </span>
            )}
          </button>

        </div>

        <div className="approval-search">

          <span>
            ⌕
          </span>

          <input
            type="text"
            value={
              searchTerm
            }
            placeholder="Search trip, customer, route or transporter..."
            onChange={(
              event
            ) =>
              setSearchTerm(
                event.target
                  .value
              )
            }
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() =>
                setSearchTerm(
                  ""
                )
              }
            >
              ×
            </button>
          )}

        </div>

      </div>

      {/* ===================================================
          CONTENT
      =================================================== */}

      {loading ? (
        <div className="approval-loading">

          <div className="approval-loading-spinner" />

          <strong>
            Loading approval data...
          </strong>

        </div>
      ) : activeView ===
        "order" ? (
        renderOrderApproval()
      ) : (
        renderQuotationApproval()
      )}

      {quotationActionModal && (
        <div
          className="approval-qaction-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeQuotationActionModal();
            }
          }}
        >
          <div
            className={`approval-qaction-modal ${
              quotationActionModal.action === "Approved"
                ? "is-approve"
                : "is-reject"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-qaction-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="approval-qaction-head">
              <div className="approval-qaction-heading">
                <div className="approval-qaction-icon">
                  {quotationActionModal.action === "Approved" ? "✓" : "×"}
                </div>
                <div>
                  <span>QUOTATION DECISION</span>
                  <h3 id="approval-qaction-title">
                    {quotationActionModal.action === "Approved"
                      ? "Confirm Transporter"
                      : "Reject Quotation"}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                className="approval-qaction-close"
                onClick={closeQuotationActionModal}
                disabled={Boolean(quotationUpdatingKey)}
                aria-label="Close quotation confirmation"
              >
                ×
              </button>
            </div>

            <div className="approval-qaction-summary">
              <div>
                <span>Vehicle</span>
                <strong>
                  {quotationActionModal.requirement?.vehicleType || "—"}
                </strong>
              </div>
              <div>
                <span>Transporter</span>
                <strong>
                  {quotationActionModal.quotation?.transporter || "—"}
                </strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>
                  {formatAmount(quotationActionModal.quotation?.amount)}
                </strong>
              </div>
              <div>
                <span>Allocated By</span>
                <strong>
                  {quotationActionModal.quotation?.quotedBy || "—"}
                </strong>
              </div>
            </div>

            <label className="approval-qaction-label">
              {quotationActionModal.action === "Approved"
                ? "Approval Remarks"
                : "Rejection Remarks"}
              {quotationActionModal.action === "Rejected" && <span> *</span>}
            </label>

            <textarea
              className="approval-qaction-textarea"
              rows="4"
              autoFocus
              placeholder={
                quotationActionModal.action === "Approved"
                  ? "Enter approval remarks..."
                  : "Enter reason for rejecting this quotation..."
              }
              value={quotationActionRemark}
              onChange={(event) =>
                setQuotationActionRemark(event.target.value)
              }
              disabled={Boolean(quotationUpdatingKey)}
            />

            {quotationActionModal.action === "Rejected" && (
              <p className="approval-qaction-required-note">
                Rejection remarks are required before confirming rejection.
              </p>
            )}

            <div className="approval-qaction-footer">
              <button
                type="button"
                className="approval-qaction-cancel"
                onClick={closeQuotationActionModal}
                disabled={Boolean(quotationUpdatingKey)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`approval-qaction-confirm ${
                  quotationActionModal.action === "Approved"
                    ? "approve"
                    : "reject"
                }`}
                disabled={
                  Boolean(quotationUpdatingKey) ||
                  (quotationActionModal.action === "Rejected" &&
                    !quotationActionRemark.trim())
                }
                onClick={() =>
                  updateQuotationApproval(
                    quotationActionModal.order,
                    quotationActionModal.requirement,
                    quotationActionModal.action,
                    quotationActionRemark
                  )
                }
              >
                {quotationUpdatingKey
                  ? "Processing..."
                  : quotationActionModal.action === "Approved"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {orderActionModal && (
        <div
          className="approval-action-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeOrderActionModal();
            }
          }}
        >
          <div
            className={`approval-action-modal ${
              orderActionModal.action === "Approved"
                ? "is-approve"
                : "is-reject"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-action-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="approval-action-modal-icon" aria-hidden="true">
              {orderActionModal.action === "Approved" ? "✓" : "×"}
            </div>

            <div className="approval-action-modal-copy">
              <h3 id="approval-action-modal-title">
                {orderActionModal.action === "Approved"
                  ? "Approve Order"
                  : "Reject Order"}
              </h3>
              <p>
                {orderActionModal.action === "Approved"
                  ? `Add remarks and confirm approval for ${
                      orderActionModal.order?.tripId || "this order"
                    }.`
                  : `Add remarks and confirm rejection for ${
                      orderActionModal.order?.tripId || "this order"
                    }.`}
              </p>
            </div>

            <label className="approval-action-modal-label">
              Remarks
              {orderActionModal.action === "Rejected" && <span> *</span>}
            </label>

            <textarea
              className="approval-action-modal-textarea"
              rows="4"
              autoFocus
              placeholder={
                orderActionModal.action === "Approved"
                  ? "Enter approval remarks..."
                  : "Enter rejection remarks..."
              }
              value={orderActionRemark}
              onChange={(event) =>
                setOrderActionRemark(event.target.value)
              }
              disabled={Boolean(orderUpdatingId)}
            />

            <div className="approval-action-modal-footer">
              <button
                type="button"
                className="approval-action-modal-cancel"
                onClick={closeOrderActionModal}
                disabled={Boolean(orderUpdatingId)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`approval-action-modal-confirm ${
                  orderActionModal.action === "Approved"
                    ? "approve"
                    : "reject"
                }`}
                disabled={
                  Boolean(orderUpdatingId) ||
                  (orderActionModal.action === "Rejected" &&
                    !orderActionRemark.trim())
                }
                onClick={() =>
                  updateOrderApproval(
                    orderActionModal.order,
                    orderActionModal.action,
                    orderActionRemark
                  )
                }
              >
                {orderUpdatingId
                  ? "Processing..."
                  : orderActionModal.action === "Approved"
                    ? "Approve"
                    : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default Approvalmanagement;