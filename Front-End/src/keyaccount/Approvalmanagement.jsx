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
              placeholder="Search order, client or KAM..."
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
          APPROVAL DETAIL MODAL
      ===================================================== */}

      {selectedApproval && (

        <div
          className="approval-modal-overlay"
          onMouseDown={() =>
            !isUpdating &&
            handleCloseApproval()
          }
        >

          <section
            className="approval-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Approval request details"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            {/* ================ MODAL HEADER ================ */}

            <div className="approval-modal-header">

              <div className="approval-modal-title">

                <span>
                  APPROVAL REQUEST
                </span>

                <h2>
                  {selectedApproval.orderReferenceNumber ||
                    selectedApproval.tripId ||
                    selectedApproval.id ||
                    "Order Details"}
                </h2>

                <p>
                  {selectedApproval.client ||
                    selectedApproval.customer ||
                    "—"}
                </p>

              </div>


              <div className="approval-modal-header-right">

                <span
                  className={`approval-status large ${safeStatus(
                    selectedApproval.approvalStatus
                  ).toLowerCase()}`}
                >
                  {safeStatus(
                    selectedApproval.approvalStatus
                  )}
                </span>


                <button
                  type="button"
                  className="approval-modal-close"
                  disabled={
                    isUpdating
                  }
                  onClick={
                    handleCloseApproval
                  }
                >
                  <X size={19} />
                </button>

              </div>

            </div>


            {/* ================ BODY ================ */}

            <div className="approval-modal-body">

              {error && (
                <div className="approval-form-error">
                  {error}
                </div>
              )}


              {/* ORDER INFORMATION */}

              <div className="approval-detail-section">

                <div className="approval-detail-section-title">
                  Order Information
                </div>


                <div className="approval-detail-grid">

                  <DetailField
                    label="Order Reference Number"
                    value={
                      selectedApproval.orderReferenceNumber
                    }
                  />

                  <DetailField
                    label="Trip / Order ID"
                    value={
                      selectedApproval.tripId ||
                      selectedApproval.id
                    }
                  />

                  <DetailField
                    label="Client"
                    value={
                      selectedApproval.client ||
                      selectedApproval.customer
                    }
                  />

                  <DetailField
                    label="Order Count / Trip Lots"
                    value={
                      selectedApproval.orderCount
                    }
                  />

                  <DetailField
                    label="Responsible KAM"
                    value={
                      selectedApproval.responsibleKam ||
                      selectedApproval.assignedKam
                    }
                  />

                  <DetailField
                    label="Requested At"
                    value={
                      formatDateTime(
                        selectedApproval.approvalRequestedAt
                      )
                    }
                  />

                </div>

              </div>


              {/* COMMERCIAL DETAILS */}

              <div className="approval-detail-section">

                <div className="approval-detail-section-title">
                  Commercial Details
                </div>


                <div className="approval-detail-grid">

                  <DetailField
                    label="Agreed Rate"
                    value={
                      formatAmount(
                        selectedApproval.agreedRate
                      )
                    }
                  />

                  <DetailField
                    label="Quoted Rate"
                    value={
                      formatAmount(
                        selectedApproval.quotedRate
                      )
                    }
                  />

                  <DetailField
                    label="Negotiated Rate"
                    value={
                      formatAmount(
                        selectedApproval.negotiatedRate
                      )
                    }
                  />

                  <DetailField
                    label="Final Approved Rate"
                    value={
                      formatAmount(
                        selectedApproval.finalRate
                      )
                    }
                  />

                  <DetailField
                    label="Payment Terms"
                    value={
                      selectedApproval.paymentTerms
                    }
                  />

                  <DetailField
                    label="Commercial Terms & Payment SLAs"
                    value={
                      selectedApproval.commercialTerms
                    }
                    full
                  />

                </div>

              </div>


              {/* COMMITMENTS */}

              <div className="approval-detail-section">

                <div className="approval-detail-section-title">
                  Commitments & Confirmation
                </div>


                <div className="approval-detail-grid">

                  <DetailField
                    label="Delivery Commitments & SLAs"
                    value={
                      selectedApproval.deliveryCommitments
                    }
                    full
                  />

                  <DetailField
                    label="Client Confirmation Notes"
                    value={
                      selectedApproval.clientConfirmationNotes
                    }
                    full
                  />

                  <DetailField
                    label="Commercial Remarks"
                    value={
                      selectedApproval.commercialRemarks
                    }
                    full
                  />

                </div>

              </div>


              {/* APPROVAL STATUS */}

              <div className="approval-detail-section approval-status-section">

                <div className="approval-detail-section-title">
                  Approval Status
                </div>


                <div className="approval-status-detail">

                  <div>

                    <span>
                      Current Status
                    </span>

                    <strong>

                      <span
                        className={`approval-status ${safeStatus(
                          selectedApproval.approvalStatus
                        ).toLowerCase()}`}
                      >
                        {safeStatus(
                          selectedApproval.approvalStatus
                        )}
                      </span>

                    </strong>

                  </div>


                  <div>

                    <span>
                      Reviewed At
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedApproval.approvalReviewedAt
                      )}
                    </strong>

                  </div>


                  {selectedApproval.approvalRemarks && (

                    <div className="approval-status-reason approval-remark-display">

                      <span>
                        Approval Remark
                      </span>

                      <strong>
                        {
                          selectedApproval.approvalRemarks
                        }
                      </strong>

                    </div>

                  )}


                  {safeStatus(
                    selectedApproval.approvalStatus
                  ) === "Rejected" && (

                    <div className="approval-status-reason">

                      <span>
                        Rejection Reason
                      </span>

                      <strong>
                        {selectedApproval.approvalRejectionReason ||
                          "No reason provided"}
                      </strong>

                    </div>

                  )}

                </div>

              </div>


              {/* =============================================
                  APPROVAL REMARK INPUT
              ============================================= */}

              {safeStatus(
                selectedApproval.approvalStatus
              ) === "Pending" && (

                <div className="approval-detail-section approval-remark-section">

                  <div className="approval-detail-section-title">
                    Approval Decision
                  </div>


                  <div className="approval-remark-input">

                    <label htmlFor="approvalRemarks">

                      Approval Remark

                      <span>
                        *
                      </span>

                    </label>


                    <textarea
                      id="approvalRemarks"
                      rows={3}
                      value={
                        approvalRemarks
                      }
                      onChange={(
                        event
                      ) => {
                        setApprovalRemarks(
                          event.target.value
                        );

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="Enter your approval comment..."
                      disabled={
                        isUpdating
                      }
                    />


                    <small>
                      Enter a remark
                      before approving
                      this request.
                    </small>

                  </div>

                </div>

              )}

            </div>


            {/* ================ FOOTER ================ */}

            <div className="approval-modal-footer">

              <button
                type="button"
                className="approval-secondary-button"
                disabled={
                  isUpdating
                }
                onClick={
                  handleCloseApproval
                }
              >
                Close
              </button>


              {safeStatus(
                selectedApproval.approvalStatus
              ) === "Pending" && (

                <div className="approval-modal-actions">

                  <button
                    type="button"
                    className="approval-reject-button"
                    disabled={
                      isUpdating
                    }
                    onClick={
                      handleOpenReject
                    }
                  >
                    <XCircle
                      size={16}
                    />

                    Reject
                  </button>


                  <button
                    type="button"
                    className="approval-approve-button"
                    disabled={
                      isUpdating ||
                      !approvalRemarks.trim()
                    }
                    onClick={
                      handleApprove
                    }
                  >
                    <Check
                      size={16}
                    />

                    {isUpdating
                      ? "Approving..."
                      : "Approve Request"}
                  </button>

                </div>

              )}

            </div>

          </section>

        </div>

      )}


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