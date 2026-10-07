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

const getTransportReplacementRequests = (order) =>
  safeArray(order?.transportReplacementRequests);

const getPendingTransportReplacementForRequirement = (
  order,
  requirementId
) =>
  getTransportReplacementRequests(order).find(
    (request) =>
      String(request?.requirementId || "") ===
        String(requirementId || "") &&
      String(request?.status || "").trim().toLowerCase() ===
        "pending"
  );

const hasPendingTransportReplacement = (order) =>
  getTransportReplacementRequests(order).some(
    (request) =>
      String(request?.status || "").trim().toLowerCase() ===
      "pending"
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

const getApprovedConfirmationsForRequirement = (
  order,
  requirementId
) =>
  getConfirmationsForRequirement(
    order,
    requirementId
  ).filter(
    (confirmation) =>
      confirmation.status === "Approved"
  );

const getApprovedQuantityForRequirement = (
  order,
  requirementId
) =>
  getApprovedConfirmationsForRequirement(
    order,
    requirementId
  ).reduce(
    (total, confirmation) => {
      const quotation =
        getQuotationById(
          order,
          confirmation.quotationId
        );

      return (
        total +
        Math.max(
          1,
          Number(quotation?.quantity) || 1
        )
      );
    },
    0
  );

const getRequirementQuotationStatus = (
  order,
  requirementId
) => {
  const pendingReplacement =
    getPendingTransportReplacementForRequirement(
      order,
      requirementId
    );

  if (pendingReplacement) {
    return "Replacement Pending";
  }

  const requirement =
    getRequirement(order, requirementId);

  const requiredQuantity =
    Math.max(
      1,
      Number(requirement?.quantity) || 1
    );

  const approvedQuantity =
    getApprovedQuantityForRequirement(
      order,
      requirementId
    );

  if (approvedQuantity >= requiredQuantity) {
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

  if (quotations.length === 0) {
    return "Waiting for Traffic";
  }

  if (
    approvedQuantity === 0 &&
    confirmations.length > 0 &&
    confirmations.every(
      (confirmation) =>
        confirmation.status === "Rejected"
    )
  ) {
    return "Rejected";
  }

  return "Pending";
};

const getQuotationStatusClass = (
  status
) => {
  if (status === "Approved") {
    return "approved";
  }

  if (status === "Rejected") {
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
        Number(requirement?.quantity) || 0,
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
    (requirement) => {
      const requiredQuantity =
        Math.max(
          1,
          Number(requirement?.quantity) || 1
        );

      const approvedQuantity =
        getApprovedQuantityForRequirement(
          order,
          requirement.requirementId
        );

      return approvedQuantity >= requiredQuantity;
    }
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

  /* =========================================================
     COMPACT APPROVAL TOAST
  ========================================================= */

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
      id: Date.now(),
    });
  };

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  // Separate filters for each approval tab
  const [orderMovementFilter, setOrderMovementFilter] = useState("All");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [quotationMovementFilter, setQuotationMovementFilter] = useState("All");
  const [quotationStatusFilter, setQuotationStatusFilter] = useState("All");

  const [
    activeView,
    setActiveView,
  ] = useState(
    "order"
  );

  const [
    selectedTransportReplacement,
    setSelectedTransportReplacement,
  ] = useState(null);

  const openTransportReplacementDetails = (order, requests) => {
    if (!order) return;

    const replacementRequests = Array.isArray(requests)
      ? requests
      : requests
        ? [requests]
        : [];

    if (!replacementRequests.length) return;

    setSelectedTransportReplacement({
      order,
      requests: replacementRequests,
    });
  };

  const closeTransportReplacementDetails = () => {
    if (replacementUpdatingKey) return;
    setSelectedTransportReplacement(null);
  };

  const [
    expandedOrderId,
    setExpandedOrderId,
  ] = useState(null);

  const [
    orderDetailsModal,
    setOrderDetailsModal,
  ] = useState(null);

  const openOrderDetailsModal = (order) => {
    if (!order) return;
    setOrderDetailsModal(order);
  };

  const closeOrderDetailsModal = () => {
    setOrderDetailsModal(null);
  };

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
    replacementUpdatingKey,
    setReplacementUpdatingKey,
  ] = useState("");

  const [
    replacementRemarks,
    setReplacementRemarks,
  ] = useState({});

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

    const rawSelection =
      quotationSelections[rowKey];

    const selectedQuotationIds =
      Array.isArray(rawSelection)
        ? rawSelection
        : rawSelection
          ? [rawSelection]
          : [];

    if (!selectedQuotationIds.length) {
      const message =
        action === "Approved"
          ? "Select transporter quotation(s) before approving."
          : "Select the quotation(s) you want to reject.";

      setError(message);
      showToast(message, "warning");
      return;
    }

    const selectedQuotations =
      getQuotationsForRequirement(
        order,
        requirement.requirementId
      ).filter((quotation) =>
        selectedQuotationIds.includes(quotation.quotationId)
      );

    if (!selectedQuotations.length) {
      const message = "Selected quotation was not found.";
      setError(message);
      showToast(message, "error");
      return;
    }

    setError("");
    setQuotationActionRemark("");
    setQuotationActionModal({
      order,
      requirement,
      action,
      rowKey,
      quotation: selectedQuotations[0],
      quotations: selectedQuotations,
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
        filteredOrders.filter((order) => {
          if (safeArray(order.vehicleRequirements).length === 0) {
            return false;
          }

          // Only show orders that Key Account has explicitly sent
          // through Request for Approval. Draft/new orders have no requestedAt.
          if (!order?.orderApproval?.requestedAt) {
            return false;
          }

          const movement = String(order.movementType || "").trim().toLowerCase();
          const status = getOrderApprovalStatus(order).toLowerCase();

          const movementMatches =
            orderMovementFilter === "All" ||
            movement === orderMovementFilter.toLowerCase();

          const statusMatches =
            orderStatusFilter === "All" ||
            status === orderStatusFilter.toLowerCase();

          return movementMatches && statusMatches;
        }),
      [filteredOrders, orderMovementFilter, orderStatusFilter]
    );

  /* =======================================================
     QUOTATION APPROVAL DATA
  ======================================================= */

  const quotationApprovalOrders =
    useMemo(
      () =>
        filteredOrders.filter((order) => {
          if (
            getOrderApprovalStatus(order) !== "Approved" ||
            safeArray(order.trafficQuotations).length === 0
          ) {
            return false;
          }

          const movement = String(order.movementType || "").trim().toLowerCase();

          const requirements = safeArray(order.vehicleRequirements);
          const confirmedCount = getApprovedRequirementCount(order);
          const replacementPending = hasPendingTransportReplacement(order);
          const quotationStatus =
            replacementPending
              ? "Replacement Pending"
              : requirements.length > 0 && confirmedCount === requirements.length
              ? "Approved"
              : confirmedCount > 0
              ? "In Progress"
              : "Pending";

          const movementMatches =
            quotationMovementFilter === "All" ||
            movement === quotationMovementFilter.toLowerCase();

          const statusMatches =
            quotationStatusFilter === "All" ||
            quotationStatus.toLowerCase() === quotationStatusFilter.toLowerCase();

          return movementMatches && statusMatches;
        }),
      [
        filteredOrders,
        quotationMovementFilter,
        quotationStatusFilter,
      ]
    );

  /* =======================================================
     TRANSPORT REPLACEMENT APPROVAL DATA
  ======================================================= */

  const transportReplacementRows =
    useMemo(
      () =>
        filteredOrders.flatMap((order) =>
          getTransportReplacementRequests(order).map(
            (request) => ({
              order,
              request,
            })
          )
        ),
      [filteredOrders]
    );

  const pendingTransportReplacementCount =
    useMemo(
      () =>
        transportReplacementRows.filter(
          ({ request }) =>
            request.status === "Pending"
        ).length,
      [transportReplacementRows]
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
                status === "Pending" ||
                status === "Replacement Pending"
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
        const message =
          "Enter a rejection reason before rejecting the order.";

        setError(message);
        showToast(message, "warning");
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

          // Keep the currently opened Order Approval Details modal
          // synchronized with the latest approval response.
          setOrderDetailsModal((currentModalOrder) =>
            currentModalOrder?._id === updatedOrder._id
              ? updatedOrder
              : currentModalOrder
          );
        } else {
          await fetchApprovals(
            true
          );

          // If the API does not return the updated order object,
          // refresh and close the stale modal so it cannot keep
          // displaying the old Pending state.
          setOrderDetailsModal(null);
        }

        const successText =
          status === "Approved"
            ? `${order.tripId} approved and released to Traffic.`
            : `${order.tripId} rejected.`;

        setSuccessMessage(successText);
        showToast(
          successText,
          status === "Approved" ? "success" : "error"
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

        const message =
          approvalError.message ||
          "Unable to update order approval.";

        setError(message);
        showToast(message, "error");
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
    quotationId,
    quotationQuantity = 1,
    availableQuantity = 1
  ) => {
    setQuotationSelections((previous) => {
      const current = Array.isArray(previous[rowKey])
        ? previous[rowKey]
        : previous[rowKey]
          ? [previous[rowKey]]
          : [];

      const alreadySelected =
        current.includes(quotationId);

      if (alreadySelected) {
        return {
          ...previous,
          [rowKey]: current.filter(
            (id) => id !== quotationId
          ),
        };
      }

      const currentSelectedQuantity =
        current.reduce((total, id) => {
          const quantityMap =
            previous[`${rowKey}__quantities`] || {};

          return (
            total +
            Math.max(
              1,
              Number(quantityMap[id]) || 1
            )
          );
        }, 0);

      const nextQuantity =
        currentSelectedQuantity +
        Math.max(
          1,
          Number(quotationQuantity) || 1
        );

      if (nextQuantity > availableQuantity) {
        const remaining =
          Math.max(
            0,
            availableQuantity -
              currentSelectedQuantity
          );

        const message =
          remaining > 0
            ? `Only ${remaining} NOS remaining for this vehicle requirement.`
            : "Available pending vehicle quantity is already fully selected.";

        setError(message);
        showToast(message, "warning");
        return previous;
      }

      return {
        ...previous,
        [rowKey]: [
          ...current,
          quotationId,
        ],
        [`${rowKey}__quantities`]: {
          ...(previous[
            `${rowKey}__quantities`
          ] || {}),
          [quotationId]:
            Math.max(
              1,
              Number(quotationQuantity) || 1
            ),
        },
      };
    });
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
        !requirement?.requirementId
      ) {
        return;
      }

      const rowKey =
        getRowKey(
          order._id,
          requirement.requirementId
        );

      if (quotationUpdatingKey) {
        return;
      }

      const quotations =
        getQuotationsForRequirement(
          order,
          requirement.requirementId
        );

      const rawSelection =
        quotationSelections[rowKey];

      const selectedQuotationIds =
        Array.isArray(rawSelection)
          ? rawSelection
          : rawSelection
            ? [rawSelection]
            : [];

      if (!selectedQuotationIds.length) {
        const message =
          status === "Approved"
            ? "Select transporter quotation(s) before confirming."
            : "Select the quotation you want to reject.";

        setError(message);
        showToast(message, "warning");
        return;
      }

      const selectedQuotations =
        quotations.filter((quotation) =>
          selectedQuotationIds.includes(
            quotation.quotationId
          )
        );

      if (!selectedQuotations.length) {
        const message =
          "Selected quotation was not found.";

        setError(message);
        showToast(message, "error");
        return;
      }

      const requiredQuantity =
        Math.max(
          1,
          Number(requirement.quantity) || 1
        );

      const selectedQuantity =
        selectedQuotations.reduce(
          (total, quotation) =>
            total +
            Math.max(
              1,
              Number(quotation.quantity) || 1
            ),
          0
        );

      const alreadyApprovedQuantity =
        getApprovedQuantityForRequirement(
          order,
          requirement.requirementId
        );

      const pendingQuantity =
        Math.max(
          0,
          requiredQuantity -
            alreadyApprovedQuantity
        );

      if (
        status === "Approved" &&
        (
          selectedQuantity <= 0 ||
          selectedQuantity > pendingQuantity
        )
      ) {
        const message =
          pendingQuantity <= 0
            ? "This vehicle requirement is already fully approved."
            : `You can approve up to ${pendingQuantity} pending NOS. Selected ${selectedQuantity} NOS.`;

        setError(message);
        showToast(message, "warning");
        return;
      }

      const remarks =
        String(modalRemark || "").trim();

      const rejectionReason =
        status === "Rejected"
          ? remarks
          : "";

      if (
        status === "Rejected" &&
        !rejectionReason
      ) {
        const message =
          "Enter a rejection reason before rejecting the quotation.";

        setError(message);
        showToast(message, "warning");
        return;
      }

      try {
        setQuotationUpdatingKey(rowKey);
        setError("");
        setSuccessMessage("");

        const response =
          await fetch(
            `${TRIP_API_URL}/${order._id}/confirm-quotation`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                requirementId:
                  requirement.requirementId,

                // Backward compatible single id + new multi-id payload.
                quotationId:
                  selectedQuotationIds[0],

                quotationIds:
                  selectedQuotationIds,

                selectedQuantity,

                status,

                confirmedBy:
                  "Approval Management",

                remarks,

                rejectionReason:
                  status === "Rejected"
                    ? rejectionReason
                    : "",
              }),
            }
          );

        const payload =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              `Unable to ${status.toLowerCase()} transporter quotation.`
          );
        }

        const updatedOrder =
          payload?.data ||
          payload?.trip ||
          payload?.order ||
          payload;

        if (updatedOrder?._id) {
          setOrders((previous) =>
            previous.map((currentOrder) =>
              currentOrder._id ===
              updatedOrder._id
                ? updatedOrder
                : currentOrder
            )
          );
        } else {
          await fetchApprovals(true);
        }

        const transporterNames =
          selectedQuotations
            .map(
              (quotation) =>
                quotation.transporter
            )
            .filter(Boolean)
            .join(", ");

        const successText =
          status === "Approved"
            ? `${transporterNames} confirmed for ${selectedQuantity} NOS of ${requirement.vehicleType || requirement.requirementId}.`
            : `${transporterNames} quotation rejected.`;

        setSuccessMessage(successText);
        showToast(
          successText,
          status === "Approved"
            ? "success"
            : "error"
        );

        setQuotationActionModal(null);
        setQuotationActionRemark("");

        setQuotationSelections(
          (previous) => {
            const next = {
              ...previous,
            };

            delete next[rowKey];
            delete next[
              `${rowKey}__quantities`
            ];

            return next;
          }
        );
      } catch (error) {
        const message =
          error.message ||
          "Unable to update quotation approval.";

        setError(message);
        showToast(message, "error");
      } finally {
        setQuotationUpdatingKey("");
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

  /* =======================================================
     TRANSPORT REPLACEMENT APPROVAL
  ======================================================= */

  const updateTransportReplacement = async (
    order,
    request,
    status
  ) => {
    if (
      !order?._id ||
      !request?.requestId ||
      replacementUpdatingKey
    ) {
      return;
    }

    const key = `${order._id}::${request.requestId}`;
    const reviewRemarks =
      String(replacementRemarks[key] || "").trim();

    if (
      status === "Rejected" &&
      !reviewRemarks
    ) {
      const message =
        "Enter a rejection reason before rejecting the transport replacement.";

      setError(message);
      showToast(message, "warning");
      return;
    }

    try {
      setReplacementUpdatingKey(key);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${TRIP_API_URL}/${order._id}/transport-replacement-requests/${request.requestId}/review`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status,
            reviewedBy: "Approval Management",
            reviewRemarks,
          }),
        }
      );

      const payload = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            "Unable to review transport replacement."
        );
      }

      const updatedOrder =
        getObjectFromResponse(payload);

      if (updatedOrder?._id) {
        setOrders((previous) =>
          previous.map((currentOrder) =>
            currentOrder._id === updatedOrder._id
              ? updatedOrder
              : currentOrder
          )
        );
      } else {
        await fetchApprovals(true);
      }

      const successText =
        status === "Approved"
          ? `${order.tripId} transport replacement approved.`
          : `${order.tripId} transport replacement rejected.`;

      setSuccessMessage(successText);
      showToast(
        successText,
        status === "Approved"
          ? "success"
          : "error"
      );

      setReplacementRemarks((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    } catch (reviewError) {
      console.error(
        "Transport replacement approval error:",
        reviewError
      );

      const message =
        reviewError.message ||
        "Unable to review transport replacement.";

      setError(message);
      showToast(message, "error");
    } finally {
      setReplacementUpdatingKey("");
    }
  };

  const renderTransportReplacementApproval = () => {
    const groupedOrders = transportReplacementRows.reduce(
      (groups, { order, request }) => {
        const orderKey = String(order?._id || order?.tripId || "");

        if (!groups[orderKey]) {
          groups[orderKey] = {
            order,
            requests: [],
          };
        }

        groups[orderKey].requests.push(request);
        return groups;
      },
      {}
    );

    const rows = Object.values(groupedOrders)
      .map(({ order, requests }) => {
        const sortedRequests = requests.slice().sort((a, b) => {
          if (a.status === "Pending" && b.status !== "Pending") return -1;
          if (b.status === "Pending" && a.status !== "Pending") return 1;
          return new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0);
        });

        const pendingCount = sortedRequests.filter(
          (request) => request.status === "Pending"
        ).length;

        const approvedCount = sortedRequests.filter(
          (request) => request.status === "Approved"
        ).length;

        const rejectedCount = sortedRequests.filter(
          (request) => request.status === "Rejected"
        ).length;

        const totalQuantity = sortedRequests.reduce(
          (total, request) =>
            total + Math.max(1, Number(request.quantity) || 1),
          0
        );

        const latestRequestedAt = sortedRequests.reduce((latest, request) => {
          const time = new Date(request.requestedAt || 0).getTime();
          return time > latest ? time : latest;
        }, 0);

        return {
          order,
          requests: sortedRequests,
          pendingCount,
          approvedCount,
          rejectedCount,
          totalQuantity,
          latestRequestedAt,
        };
      })
      .sort((a, b) => {
        if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
        if (b.pendingCount > 0 && a.pendingCount === 0) return 1;
        return b.latestRequestedAt - a.latestRequestedAt;
      });

    return (
      <div className="approval-table-card approval-replacement-table-card">
        <div className="approval-table-head">
          <div>
            <h3>Transport Replacement Approval</h3>
            <p>Each order is shown once. Click the row to see all replacement vehicles.</p>
          </div>

          <span className="approval-table-count">
            {pendingTransportReplacementCount} Pending
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="approval-empty">
            No transport replacement requests.
          </div>
        ) : (
          <div className="approval-replacement-table-wrap">
            <table className="approval-replacement-table approval-replacement-order-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Order ID</th>
                  <th>Customer / Route</th>
                  <th>Movement Type</th>
                  <th>Placement Date</th>
                  <th>Replacement Vehicles</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  ({
                    order,
                    requests,
                    pendingCount,
                    approvedCount,
                    rejectedCount,
                    totalQuantity,
                  }, index) => (
                    <tr
                      key={order._id || order.tripId}
                      className={`approval-replacement-click-row ${
                        pendingCount > 0 ? "is-pending" : ""
                      }`}
                      tabIndex="0"
                      role="button"
                      onClick={() =>
                        openTransportReplacementDetails(order, requests)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openTransportReplacementDetails(order, requests);
                        }
                      }}
                    >
                      <td>
                        <span className="approval-replacement-serial">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </td>

                      <td>
                        <strong className="approval-replacement-order-id">
                          {order.tripId || "—"}
                        </strong>
                      </td>

                      <td>
                        <div className="approval-replacement-order">
                          <strong>{order.customer || "—"}</strong>
                          <span>
                            {order.origin || "—"} → {order.destination || "—"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="approval-replacement-movement">
                          {order.movementType || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="approval-replacement-placement">
                          {formatDate(order.placementDate)}
                        </span>
                      </td>

                      <td>
                        <strong>{requests.length} Vehicle{requests.length === 1 ? "" : "s"}</strong>
                      </td>

                      <td>
                        <strong className="approval-replacement-qty">
                          {totalQuantity} NOS
                        </strong>
                      </td>

                      <td>
                        <div className="approval-replacement-order-statuses">
                          {pendingCount > 0 && (
                            <span className="approval-status pending">
                              {pendingCount} Pending
                            </span>
                          )}
                          {approvedCount > 0 && (
                            <span className="approval-status approved">
                              {approvedCount} Approved
                            </span>
                          )}
                          {rejectedCount > 0 && (
                            <span className="approval-status rejected">
                              {rejectedCount} Rejected
                            </span>
                          )}
                        </div>
                      </td>

                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
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

        <div className="approval-section-head-actions">
          <div className="approval-section-filters">
            <label className="approval-filter-field">
              
              <select
                value={orderMovementFilter}
                onChange={(event) => setOrderMovementFilter(event.target.value)}
              >
                <option value="All">All Movement</option>
                <option value="WTG">WTG</option>
                <option value="Crane">Crane</option>
                <option value="Intercarting">Intercarting</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="approval-filter-field">
              
              <select
                value={orderStatusFilter}
                onChange={(event) => setOrderStatusFilter(event.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </label>

            <button
              type="button"
              className="approval-filter-clear"
              onClick={() => {
                setOrderMovementFilter("All");
                setOrderStatusFilter("All");
              }}
            >
              Clear
            </button>
          </div>

          <span className="approval-table-count">
            {orderApprovalRows.length} Orders
          </span>
        </div>
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
                <th>Agreed Rate</th>
                <th>Commercial Terms &amp; SLAs</th>
                <th>MD Status</th>
                <th>MD Action</th>
              </tr>
            </thead>

            <tbody>
              {orderApprovalRows.map((order) => {
                const status = getOrderApprovalStatus(order);
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
                      className="approval-md-main-row approval-md-clickable-row"
                      onClick={() => openOrderDetailsModal(order)}
                      title="Click to view complete order details"
                    >
                      <td>
                        <span className="approval-md-trip">
                          {order.tripId || "—"}
                        </span>
                      </td>

                      <td>
                        <strong className="approval-md-client">
                          {order.customer || "—"}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`approval-md-movement movement-${String(
                            order.movementType || "other"
                          )
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
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

        <div className="approval-section-head-actions">
          <div className="approval-section-filters">
            <label className="approval-filter-field">
              
              <select
                value={quotationMovementFilter}
                onChange={(event) => setQuotationMovementFilter(event.target.value)}
              >
                <option value="All">All Movement</option>
                <option value="WTG">WTG</option>
                <option value="Crane">Crane</option>
                <option value="Intercarting">Intercarting</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="approval-filter-field">
              
              <select
                value={quotationStatusFilter}
                onChange={(event) => setQuotationStatusFilter(event.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Replacement Pending">Replacement Pending</option>
                <option value="Approved">Approved</option>
              </select>
            </label>

            <button
              type="button"
              className="approval-filter-clear"
              onClick={() => {
                setQuotationMovementFilter("All");
                setQuotationStatusFilter("All");
              }}
            >
              Clear
            </button>
          </div>

          <span className="approval-table-count">
            {quotationApprovalOrders.length} Orders
          </span>
        </div>
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
                // A pending transporter replacement must override the
                // previously approved quotation status.
                const replacementPending =
                  hasPendingTransportReplacement(order);

                const orderQuotationStatus =
                  replacementPending
                    ? "Replacement Pending"
                    : totalRequirements > 0 &&
                        confirmedCount === totalRequirements
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
                        <span
                          className={`approval-quotation-movement movement-${String(
                            order.movementType || "other"
                          )
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {order.movementType || "—"}
                        </span>
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
                            <div className="approval-quotation-modal-head approval-quotation-modal-head-single">
                              <div className="approval-quotation-modal-title approval-quotation-modal-title-single">
                                <span>TRANSPORT QUOTATION</span>
                                <h3>Quotation Approval</h3>
                              </div>

                              <div className="approval-quotation-head-details">
                                <div className="approval-quotation-head-item">
                                  <span>ORDER ID</span>
                                  <strong>{order.tripId || "—"}</strong>
                                </div>

                                <div className="approval-quotation-head-item approval-quotation-head-route">
                                  <span>ROUTE</span>
                                  <strong>
                                    {order.origin || "—"} → {order.destination || "—"}
                                  </strong>
                                </div>

                                <div className="approval-quotation-head-item">
                                  <span>PLACEMENT</span>
                                  <strong>{formatDate(order.placementDate)}</strong>
                                </div>

                                <div className="approval-quotation-head-item">
                                  <span>VEHICLES</span>
                                  <strong>{getTotalRequiredVehicles(order)} NOS</strong>
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

                                const rawSelectedQuotationIds =
                                  quotationSelections[rowKey];

                                const selectedQuotationIds =
                                  Array.isArray(rawSelectedQuotationIds)
                                    ? rawSelectedQuotationIds
                                    : rawSelectedQuotationIds
                                      ? [rawSelectedQuotationIds]
                                      : [];

                                const selectedQuotations =
                                  quotations.filter(
                                    (quotation) =>
                                      selectedQuotationIds.includes(
                                        quotation.quotationId
                                      )
                                  );

                                const selectedQuotation =
                                  selectedQuotations[0] || null;

                                const requiredQuantity =
                                  Math.max(
                                    1,
                                    Number(requirement.quantity) || 1
                                  );

                                const approvedConfirmations =
                                  getApprovedConfirmationsForRequirement(
                                    order,
                                    requirement.requirementId
                                  );

                                const approvedQuotationIds =
                                  approvedConfirmations.map(
                                    (confirmation) =>
                                      confirmation.quotationId
                                  );

                                const approvedQuantity =
                                  getApprovedQuantityForRequirement(
                                    order,
                                    requirement.requirementId
                                  );

                                const pendingQuantity =
                                  Math.max(
                                    0,
                                    requiredQuantity -
                                      approvedQuantity
                                  );

                                const selectedQuantity =
                                  selectedQuotations.reduce(
                                    (total, quotation) =>
                                      total +
                                      Math.max(
                                        1,
                                        Number(quotation.quantity) || 1
                                      ),
                                    0
                                  );

                                const remainingQuantity =
                                  Math.max(
                                    0,
                                    pendingQuantity -
                                      selectedQuantity
                                  );

                                const selectionCanApprove =
                                  selectedQuantity > 0 &&
                                  selectedQuantity <= pendingQuantity;

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

                                      <div className="approval-qv-content">
                                        <span className="approval-qv-label">
                                          VEHICLE REQUIREMENT
                                        </span>

                                        <div className="approval-qv-data-row">
                                          <h4 className="approval-qv-vehicle-type">
                                            {requirement.vehicleType || "Vehicle"}
                                          </h4>

                                          <span
                                            className="approval-qv-divider"
                                            aria-hidden="true"
                                          />

                                          <span className="approval-qv-data-item">
                                            {requirement.configuration || "—"}
                                          </span>

                                          <span className="approval-qv-data-item">
                                            {requirement.classification || "—"}
                                          </span>

                                          <span className="approval-qv-data-item">
                                            Qty {requirement.quantity || 0}
                                          </span>

                                          <span className="approval-qv-data-item">
                                            {requirement.weight ?? "—"}
                                            {requirement.weight !== null &&
                                            requirement.weight !== undefined &&
                                            requirement.weight !== ""
                                              ? " Ton"
                                              : ""}
                                          </span>

                                          <span className="approval-qv-data-item">
                                            {formatDimension(requirement.dimensions)}
                                          </span>
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
                                            <th>Quantity</th>
                                            <th>Amount</th>
                                            <th>Allocated By</th>
                                            <th>Quoted At</th>
                                            <th>Status</th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {quotations.map((quotation) => {
                                            const selected =
                                              selectedQuotationIds.includes(
                                                quotation.quotationId
                                              );
                                            const confirmed =
                                              approvedQuotationIds.includes(
                                                quotation.quotationId
                                              );

                                            return (
                                              <tr
                                                key={quotation.quotationId}
                                                className={`${
                                                  selected ? "selected" : ""
                                                } ${confirmed ? "confirmed" : ""}`}
                                                onClick={() => {
                                                  if (
                                                    !confirmed &&
                                                    !updating &&
                                                    pendingQuantity > 0
                                                  ) {
                                                    handleQuotationSelection(
                                                      rowKey,
                                                      quotation.quotationId,
                                                      quotation.quantity,
                                                      pendingQuantity
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
                                                      type="checkbox"
                                                      name={`quotation-${rowKey}-${quotation.quotationId}`}
                                                      value={quotation.quotationId}
                                                      checked={confirmed || selected}
                                                      disabled={
                                                        updating ||
                                                        confirmed ||
                                                        pendingQuantity <= 0
                                                      }
                                                      onChange={() =>
                                                        handleQuotationSelection(
                                                          rowKey,
                                                          quotation.quotationId,
                                                          quotation.quantity,
                                                          pendingQuantity
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
                                                  <strong className="approval-qv-quantity">
                                                    {Math.max(
                                                      1,
                                                      Number(
                                                        quotation.quantity
                                                      ) || 1
                                                    )} NOS
                                                  </strong>
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

                                    {approvedQuantity > 0 && (
                                      <div className="approval-qv-confirmed-bar">
                                        <div className="approval-qv-confirmed-icon">✓</div>
                                        <div>
                                          <span>Approved Transporter(s)</span>
                                          <strong>
                                            {approvedConfirmations
                                              .map((confirmation) =>
                                                getQuotationById(
                                                  order,
                                                  confirmation.quotationId
                                                )?.transporter
                                              )
                                              .filter(Boolean)
                                              .join(", ") || "—"}
                                          </strong>
                                        </div>
                                        <div>
                                          <span>Quantity</span>
                                          <strong>
                                            {approvedQuantity} / {requiredQuantity} NOS
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
                                    )}

                                    {pendingQuantity > 0 && (
                                      <div className="approval-qv-actionbar">
                                        <div className="approval-qv-selected-summary">
                                          {selectedQuotations.length ? (
                                            <>
                                              <span>
                                                VEHICLE QUANTITY SELECTION
                                              </span>

                                              <div className="approval-qv-selection-progress">
                                                <strong>
                                                  {selectedQuantity}
                                                  <small>
                                                    {" / "}
                                                    {pendingQuantity} PENDING NOS
                                                  </small>
                                                </strong>

                                                <div className="approval-qv-selection-track">
                                                  <span
                                                    style={{
                                                      width: `${Math.min(
                                                        100,
                                                        (selectedQuantity /
                                                          Math.max(1, pendingQuantity)) *
                                                          100
                                                      )}%`,
                                                    }}
                                                  />
                                                </div>

                                                <em
                                                  className={
                                                    selectionCanApprove
                                                      ? "is-complete"
                                                      : ""
                                                  }
                                                >
                                                  {selectionCanApprove
                                                    ? `${selectedQuantity} NOS ready to approve`
                                                    : `${remainingQuantity} NOS remaining`}
                                                </em>
                                              </div>

                                              <div className="approval-qv-selected-list">
                                                {selectedQuotations.map(
                                                  (quotation) => (
                                                    <span
                                                      key={
                                                        quotation.quotationId
                                                      }
                                                    >
                                                      {quotation.transporter ||
                                                        "—"}
                                                      <b>
                                                        {Math.max(
                                                          1,
                                                          Number(
                                                            quotation.quantity
                                                          ) || 1
                                                        )} NOS
                                                      </b>
                                                    </span>
                                                  )
                                                )}
                                              </div>
                                            </>
                                          ) : (
                                            <>
                                              <span>
                                                VEHICLE QUANTITY SELECTION
                                              </span>
                                              <strong>
                                                Required {requiredQuantity} NOS • Approved {approvedQuantity} NOS • Pending {pendingQuantity} NOS.
                                              </strong>
                                            </>
                                          )}
                                        </div>

                                        <div className="approval-qv-actions">
                                          <button
                                            type="button"
                                            className="approval-qv-reject-btn"
                                            disabled={
                                              updating ||
                                              selectedQuotationIds.length === 0
                                            }
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
                                            disabled={
                                              updating ||
                                              !selectionCanApprove
                                            }
                                            onClick={() =>
                                              openQuotationActionModal(
                                                order,
                                                requirement,
                                                "Approved"
                                              )
                                            }
                                          >
                                            Confirm Transporter(s)
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
    <div id="approval-management-root" className="approval-management-page">
      {toast && (
        <div
          className={`approval-toast approval-toast-${toast.type}`}
          role="status"
          aria-live="polite"
          key={toast.id}
        >
          <span className="approval-toast-icon" aria-hidden="true">
            {toast.type === "success"
              ? "✓"
              : toast.type === "error"
              ? "×"
              : "!"}
          </span>

          <div className="approval-toast-content">
            <strong>
              {toast.type === "success"
                ? "Approved"
                : toast.type === "error"
                ? "Updated"
                : "Required"}
            </strong>
            <span>{toast.message}</span>
          </div>

          <button
            type="button"
            className="approval-toast-close"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="approval-page-header">

        <div>


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

      

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <div className="approval-summary-grid">
        <div className="approval-summary-card approval-summary-pending">
          <div className="approval-summary-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h9l4 4v14H6z" />
              <path d="M15 3v5h5" />
              <path d="M9 12h6M9 16h4" />
            </svg>
          </div>
          <div className="approval-summary-content">
            <span>Pending Orders</span>
            <small>Awaiting first approval</small>
          </div>
          <strong>{summary.pendingOrders}</strong>
          <div className="approval-summary-wave" aria-hidden="true">
            <svg viewBox="0 0 400 55" preserveAspectRatio="none">
              <path d="M0 31C62 8 111 52 176 33C241 14 280 5 334 22C361 30 382 31 400 25V55H0Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        <div className="approval-summary-card approval-summary-approved">
          <div className="approval-summary-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4 4L19 7" />
            </svg>
          </div>
          <div className="approval-summary-content">
            <span>Approved Orders</span>
            <small>Released to Traffic</small>
          </div>
          <strong>{summary.approvedOrders}</strong>
          <div className="approval-summary-wave" aria-hidden="true">
            <svg viewBox="0 0 400 55" preserveAspectRatio="none">
              <path d="M0 31C62 8 111 52 176 33C241 14 280 5 334 22C361 30 382 31 400 25V55H0Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        <div className="approval-summary-card approval-summary-quotation">
          <div className="approval-summary-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5h16v11H8l-4 4z" />
              <path d="M8 9h8M8 12h5" />
            </svg>
          </div>
          <div className="approval-summary-content">
            <span>Pending Quotations</span>
            <small>Awaiting transporter selection</small>
          </div>
          <strong>{summary.pendingQuotations}</strong>
          <div className="approval-summary-wave" aria-hidden="true">
            <svg viewBox="0 0 400 55" preserveAspectRatio="none">
              <path d="M0 31C62 8 111 52 176 33C241 14 280 5 334 22C361 30 382 31 400 25V55H0Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        <div className="approval-summary-card approval-summary-vehicle">
          <div className="approval-summary-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="18" cy="18" r="2" />
            </svg>
          </div>
          <div className="approval-summary-content">
            <span>Confirmed Vehicles</span>
            <small>Released to Tracking Input</small>
          </div>
          <strong>{summary.approvedQuotations}</strong>
          <div className="approval-summary-wave" aria-hidden="true">
            <svg viewBox="0 0 400 55" preserveAspectRatio="none">
              <path d="M0 31C62 8 111 52 176 33C241 14 280 5 334 22C361 30 382 31 400 25V55H0Z" fill="currentColor" />
            </svg>
          </div>
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

          <button
            type="button"
            className={activeView === "replacement" ? "active" : ""}
            onClick={() => setActiveView("replacement")}
          >
            Transport Replacement

            {pendingTransportReplacementCount > 0 && (
              <span>{pendingTransportReplacementCount}</span>
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
      ) : activeView === "order" ? (
        renderOrderApproval()
      ) : activeView === "quotation" ? (
        renderQuotationApproval()
      ) : (
        renderTransportReplacementApproval()
      )}

      {selectedTransportReplacement && (() => {
        const { order, requests } = selectedTransportReplacement;

        const pendingCount = requests.filter(
          (request) => request.status === "Pending"
        ).length;

        const overallStatus =
          pendingCount > 0
            ? "Pending"
            : requests.every((request) => request.status === "Approved")
              ? "Approved"
              : requests.some((request) => request.status === "Rejected")
                ? "Reviewed"
                : "Completed";

        return (
          <div
            className="approval-replacement-detail-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeTransportReplacementDetails();
              }
            }}
          >
            <div
              className="approval-replacement-detail-modal approval-replacement-order-detail-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Transport Replacement Details"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="approval-replacement-detail-head">
                <div>
                  <span>Transport Replacement Details</span>
                  <h3>{order.tripId || "—"}</h3>
                  <p>
                    {order.customer || "—"} • {order.origin || "—"} →{" "}
                    {order.destination || "—"}
                  </p>
                </div>

                <div className="approval-replacement-detail-head-right">
                  <span
                    className={`approval-status ${getStatusClass(
                      overallStatus === "Reviewed" ? "Approved" : overallStatus
                    )}`}
                  >
                    {overallStatus}
                  </span>

                  <button
                    type="button"
                    onClick={closeTransportReplacementDetails}
                    disabled={Boolean(replacementUpdatingKey)}
                    aria-label="Close transport replacement details"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="approval-replacement-detail-body approval-replacement-order-detail-body">
                <div className="approval-replacement-popup-summary">
                  <div>
                    <span>Replacement Vehicles</span>
                    <strong>{requests.length}</strong>
                  </div>
                  <div>
                    <span>Total Quantity</span>
                    <strong>
                      {requests.reduce(
                        (total, request) =>
                          total + Math.max(1, Number(request.quantity) || 1),
                        0
                      )}{" "}
                      NOS
                    </strong>
                  </div>
                  <div>
                    <span>Pending</span>
                    <strong>{pendingCount}</strong>
                  </div>
                </div>

                <div className="approval-replacement-popup-list">
                  {requests.map((request, requestIndex) => {
                    const key = `${order._id}::${request.requestId}`;
                    const updating = replacementUpdatingKey === key;
                    const currentAmount = Number(request.currentAmount) || 0;
                    const proposedAmount = Number(request.proposedAmount) || 0;
                    const amountDifference = proposedAmount - currentAmount;
                    const isPending = request.status === "Pending";

                    return (
                      <section
                        key={request.requestId}
                        className={`approval-replacement-popup-vehicle ${
                          isPending ? "is-pending" : ""
                        }`}
                      >
                        <div className="approval-replacement-popup-vehicle-head">
                          <div>
                            <small>
                              VEHICLE {String(requestIndex + 1).padStart(2, "0")}
                            </small>
                            <strong>
                              {request.requirementId ||
                                request.requestId ||
                                "Replacement Vehicle"}
                            </strong>
                          </div>

                          <span
                            className={`approval-status ${getStatusClass(
                              request.status
                            )}`}
                          >
                            {request.status || "Pending"}
                          </span>
                        </div>

                        <div className="approval-replacement-compare">
                          <div className="approval-replacement-compare-card current">
                            <span>Current Transport</span>
                            <strong>{request.currentTransporter || "—"}</strong>
                            <div>
                              <small>Current Amount</small>
                              <b>{formatAmount(currentAmount)}</b>
                            </div>
                          </div>

                          <div className="approval-replacement-arrow">→</div>

                          <div className="approval-replacement-compare-card proposed">
                            <span>Proposed Transport</span>
                            <strong>{request.proposedTransporter || "—"}</strong>
                            <div>
                              <small>Proposed Amount</small>
                              <b>{formatAmount(proposedAmount)}</b>
                            </div>
                          </div>
                        </div>

                        <div className="approval-replacement-detail-grid">
                          <div>
                            <span>Amount Difference</span>
                            <strong
                              className={
                                amountDifference < 0
                                  ? "replacement-value-decrease"
                                  : amountDifference > 0
                                    ? "replacement-value-increase"
                                    : ""
                              }
                            >
                              {amountDifference === 0
                                ? "No Change"
                                : `${amountDifference > 0 ? "+" : "−"}${formatAmount(
                                    Math.abs(amountDifference)
                                  )}`}
                            </strong>
                          </div>

                          <div>
                            <span>Quantity</span>
                            <strong>
                              {Math.max(1, Number(request.quantity) || 1)} NOS
                            </strong>
                          </div>

                          <div>
                            <span>Reason</span>
                            <strong>{request.reason || "—"}</strong>
                          </div>

                          <div>
                            <span>Requested By</span>
                            <strong>
                              {request.requestedBy || "Traffic Team"}
                            </strong>
                          </div>

                          <div>
                            <span>Requested At</span>
                            <strong>
                              {formatDateTime(request.requestedAt)}
                            </strong>
                          </div>

                          <div>
                            <span>Movement</span>
                            <strong>{order.movementType || "—"}</strong>
                          </div>
                        </div>

                        <div className="approval-replacement-detail-note">
                          <span>Traffic Remarks</span>
                          <p>{request.remarks || "No remarks provided."}</p>
                        </div>

                        {isPending ? (
                          <div className="approval-replacement-detail-review">
                            <label>
                              <span>
                                Approval Remarks / Rejection Reason
                              </span>
                              <textarea
                                value={replacementRemarks[key] || ""}
                                onChange={(event) =>
                                  setReplacementRemarks((previous) => ({
                                    ...previous,
                                    [key]: event.target.value,
                                  }))
                                }
                                placeholder="Add approval remarks or enter the rejection reason..."
                                disabled={updating}
                              />
                            </label>

                            <div className="approval-replacement-detail-actions">
                              <button
                                type="button"
                                className="approval-replacement-reject"
                                disabled={updating}
                                onClick={() =>
                                  updateTransportReplacement(
                                    order,
                                    request,
                                    "Rejected"
                                  )
                                }
                              >
                                Reject
                              </button>

                              <button
                                type="button"
                                className="approval-replacement-approve"
                                disabled={updating}
                                onClick={() =>
                                  updateTransportReplacement(
                                    order,
                                    request,
                                    "Approved"
                                  )
                                }
                              >
                                {updating
                                  ? "Updating..."
                                  : "Approve Replacement"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="approval-replacement-review-result">
                            <div>
                              <span>Reviewed By</span>
                              <strong>
                                {request.reviewedBy || "Approval Management"}
                              </strong>
                            </div>
                            <div>
                              <span>Reviewed At</span>
                              <strong>
                                {formatDateTime(request.reviewedAt)}
                              </strong>
                            </div>
                            <div className="wide">
                              <span>Review Remarks</span>
                              <strong>
                                {request.reviewRemarks || "—"}
                              </strong>
                            </div>
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {orderDetailsModal && (() => {
        const order = orderDetailsModal;
        const status = getOrderApprovalStatus(order);
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
          "—";

        return (
          <div
            className="approval-order-details-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeOrderDetailsModal();
              }
            }}
          >
            <div
              className="approval-order-details-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="approval-order-details-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="approval-order-details-head">
                <div>
                  <span className="approval-order-details-eyebrow">
                    ORDER APPROVAL DETAILS
                  </span>
                  <h3 id="approval-order-details-title">
                    {order.tripId || "Order Details"}
                  </h3>
                  <p>
                    {order.customer || "—"} · {order.origin || "—"} →{" "}
                    {order.destination || "—"}
                  </p>
                </div>

                <div className="approval-order-details-head-right">
                  <span
                    className={`approval-md-status ${getStatusClass(status)}`}
                  >
                    {status === "Approved" && "✓ "}
                    {status === "Rejected" && "× "}
                    {status.toUpperCase()}
                  </span>

                  <button
                    type="button"
                    className="approval-order-details-close"
                    onClick={closeOrderDetailsModal}
                    aria-label="Close order details"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="approval-order-details-body">
                <section className="approval-order-details-section">
                  <div className="approval-order-details-section-head">
                    <div>
                      <span>ORDER SNAPSHOT</span>
                      <h4>Order Information</h4>
                    </div>
                  </div>

                  <div className="approval-order-details-grid">
                    <div>
                      <span>Client Name</span>
                      <strong>{order.customer || "—"}</strong>
                    </div>

                    <div>
                      <span>Movement Type</span>
                      <strong>{order.movementType || "—"}</strong>
                    </div>

                    <div>
                      <span>Material Type</span>
                      <strong>{order.materialType || "—"}</strong>
                    </div>

                    <div>
                      <span>Total Vehicles</span>
                      <strong>{getTotalRequiredVehicles(order)} NOS</strong>
                    </div>

                    <div>
                      <span>Origin</span>
                      <strong>{order.origin || "—"}</strong>
                    </div>

                    <div>
                      <span>Destination</span>
                      <strong>{order.destination || "—"}</strong>
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
                      <span>Placement Date</span>
                      <strong>{formatDate(order.placementDate)}</strong>
                    </div>

                    <div>
                      <span>Enquiry Date</span>
                      <strong>{formatDate(order.enquiryDate)}</strong>
                    </div>

                    <div>
                      <span>Assigned KAM</span>
                      <strong>{order.assignedKam || "—"}</strong>
                    </div>

                    <div>
                      <span>Agreed Rate</span>
                      <strong>
                        {agreedRate !== null &&
                        agreedRate !== undefined &&
                        agreedRate !== ""
                          ? formatAmount(agreedRate)
                          : "—"}
                      </strong>
                    </div>

                    <div>
                      <span>MD Status</span>
                      <strong>{status}</strong>
                    </div>
                  </div>
                </section>

                <section className="approval-order-details-section">
                  <div className="approval-order-details-section-head">
                    <div>
                      <span>COMMERCIAL</span>
                      <h4>Terms &amp; Service Commitments</h4>
                    </div>
                  </div>

                  <div className="approval-order-details-sla-grid">
                    <div>
                      <span>Commercial Terms &amp; Payment SLAs</span>
                      <strong>{commercialTerms}</strong>
                    </div>

                    <div>
                      <span>Delivery Commitments &amp; Transit SLAs</span>
                      <strong>{deliverySla}</strong>
                    </div>
                  </div>
                </section>

                <section className="approval-order-details-section">
                  <div className="approval-order-details-section-head">
                    <div>
                      <span>VEHICLE REQUIREMENTS</span>
                      <h4>Vehicle Details</h4>
                    </div>
                  </div>

                  {renderRequirements(order)}
                </section>

                {order.remark && (
                  <section className="approval-order-details-section">
                    <div className="approval-order-details-section-head">
                      <div>
                        <span>REMARKS</span>
                        <h4>Order Remarks</h4>
                      </div>
                    </div>

                    <div className="approval-order-details-remark">
                      {order.remark}
                    </div>
                  </section>
                )}

                {status !== "Pending" && (
                  <section className="approval-order-details-section">
                    <div className="approval-order-details-section-head">
                      <div>
                        <span>DECISION</span>
                        <h4>Approval Summary</h4>
                      </div>
                    </div>

                    <div className="approval-order-details-decision">
                      <span
                        className={`approval-status ${getStatusClass(status)}`}
                      >
                        {status}
                      </span>

                      <div>
                        <span>Decision By</span>
                        <strong>
                          {order.orderApproval?.approvedBy ||
                            "Approval Management"}
                        </strong>
                      </div>

                      <div>
                        <span>Decision Date</span>
                        <strong>
                          {formatDateTime(order.orderApproval?.approvedAt)}
                        </strong>
                      </div>

                      {(order.orderApproval?.remarks ||
                        order.orderApproval?.rejectionReason) && (
                        <div className="approval-order-details-decision-remark">
                          <span>Decision Remarks</span>
                          <strong>
                            {order.orderApproval?.rejectionReason ||
                              order.orderApproval?.remarks}
                          </strong>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              <div className="approval-order-details-footer">
                <button
                  type="button"
                  className="approval-order-details-done"
                  onClick={closeOrderDetailsModal}
                >
                  Close
                </button>
                <div className="approval-order-details-decision-actions">
                  {status === "Pending" && (
                    <>
                      <button
                        type="button"
                        className="approval-order-details-reject"
                        onClick={() => openOrderActionModal(order, "Rejected")}
                        disabled={orderUpdatingId === order._id}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="approval-order-details-approve"
                        onClick={() => openOrderActionModal(order, "Approved")}
                        disabled={orderUpdatingId === order._id}
                      >
                        Approve
                      </button>
                    </>
                  )}

                  {status === "Approved" && (
                    <button
                      type="button"
                      className="approval-order-details-approve"
                      disabled
                    >
                      ✓ Approved
                    </button>
                  )}

                  {status === "Rejected" && (
                    <button
                      type="button"
                      className="approval-order-details-reject"
                      disabled
                    >
                      × Rejected
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                      ? "Confirm Transporter(s)"
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
