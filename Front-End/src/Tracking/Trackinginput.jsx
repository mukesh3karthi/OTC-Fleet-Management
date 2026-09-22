import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  Gauge,
  MapPin,
  MessageSquareText,
  Navigation,
  Package,
  PackageCheck,
  Plus,
  Route,
  Save,
  Truck,
  UserRound,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./Trackinginput.css";

/* =========================================================
   API
========================================================= */

const API_URL =
  "http://localhost:5000/api/triporders";

/* =========================================================
   HELPERS
========================================================= */

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const safeText = (
  value,
  fallback = ""
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value);
};

const numberValue = (
  value,
  fallback = 0
) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
};

const nullableNumber = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
};

const formatDateForInput = (
  value
) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayInputDate = () => {
  const today = new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      today.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getResponseData = (
  payload
) => {
  if (!payload) {
    return null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      "data"
    )
  ) {
    return payload.data;
  }

  return payload;
};

const getMongoId = (order) =>
  safeText(order?._id).trim();

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
  ) || null;

const getConfirmation = (
  order,
  confirmationId
) =>
  safeArray(
    order?.vehicleConfirmations
  ).find(
    (confirmation) =>
      confirmation.confirmationId ===
      confirmationId
  ) || null;

const getApprovedConfirmation = (
  order,
  requirementId
) =>
  safeArray(
    order?.vehicleConfirmations
  ).find(
    (confirmation) =>
      confirmation.requirementId ===
        requirementId &&
      confirmation.status ===
        "Approved"
  ) || null;

const getQuotation = (
  order,
  quotationId
) =>
  safeArray(
    order?.trafficQuotations
  ).find(
    (quotation) =>
      quotation.quotationId ===
      quotationId
  ) || null;

const getConfirmedRequirementData = (
  order
) => {
  const requirements =
    safeArray(
      order?.vehicleRequirements
    );

  return requirements
    .map((requirement) => {
      const confirmation =
        getApprovedConfirmation(
          order,
          requirement.requirementId
        );

      if (!confirmation) {
        return null;
      }

      const quotation =
        getQuotation(
          order,
          confirmation.quotationId
        );

      if (!quotation) {
        return null;
      }

      return {
        requirement,
        confirmation,
        quotation,
      };
    })
    .filter(Boolean);
};

const getLatestTracking = (
  allocation
) => {
  const history =
    safeArray(
      allocation?.dailyTracking
    );

  if (!history.length) {
    return null;
  }

  return history[
    history.length - 1
  ];
};

const formatDimensions = (
  dimensions = {}
) => {
  const {
    length,
    height,
    width,
  } = dimensions;

  if (
    length === null &&
    height === null &&
    width === null
  ) {
    return "—";
  }

  if (
    length === undefined &&
    height === undefined &&
    width === undefined
  ) {
    return "—";
  }

  return `${length ?? "—"} × ${
    height ?? "—"
  } × ${width ?? "—"}`;
};

/* =========================================================
   EMPTY FORMS
========================================================= */

const createAllocationForm = (
  requirementId = "",
  confirmationId = "",
  quotationId = ""
) => ({
  requirementId,
  confirmationId,
  quotationId,

  vehicleNumber: "",

  driverName: "",
  driverContactNumber: "",

  escortVehicleNumber: "",
  escortName: "",
  escortContactNumber: "",

  supervisorName: "",
  supervisorContactNumber: "",

  loadingStatus: "Pending",
  loadingPointInDate: "",
  loadingDate: "",
  loadingPointOutDate: "",
  loadingHaltingDays: "",
  loadingRemarks: "",

  unloadingStatus: "Pending",
  unloadingPointInDate: "",
  unloadingDate: "",
  unloadingPointOutDate: "",
  unloadingHaltingDays: "",
  unloadingRemarks: "",
});

const createTrackingForm = (
  allocation
) => {
  const latest =
    getLatestTracking(
      allocation
    );

  return {
    date:
      getTodayInputDate(),

    day:
      latest?.day
        ? Number(
            latest.day
          ) + 1
        : 1,

    yesterdayKm:
      latest?.todayKm ?? 0,

    todayKm:
      latest?.todayKm ?? "",

    yesterdayLocation:
      latest?.currentLocation ||
      "",

    currentLocation: "",

    latitude: "",
    longitude: "",
    speed: 0,

    status: "Idle",

    remarks: "",
    updatedBy: "",
  };
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const Trackinginput = () => {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const incomingTrip =
    location.state?.trip ||
    null;

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    selectedOrderId,
    setSelectedOrderId,
  ] = useState(
    getMongoId(
      incomingTrip
    )
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    allocationForms,
    setAllocationForms,
  ] = useState({});

  const [
    trackingForms,
    setTrackingForms,
  ] = useState({});

  /* =======================================================
     FETCH ORDERS
  ======================================================= */

  const fetchOrders =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            API_URL
          );

        const payload =
          await response.json();

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              "Unable to load tracking orders."
          );
        }

        const result =
          getResponseData(
            payload
          );

        const allOrders =
          Array.isArray(result)
            ? result
            : [];

        /*
         * TRACKING INPUT ELIGIBILITY:
         *
         * An order enters Tracking Input only after
         * Key Account verifies the final order and clicks
         * Place Order. Approved transporter confirmation
         * must also be available.
         */
        const eligibleOrders =
          allOrders.filter((order) => {
            const hasConfirmedTransport =
              getConfirmedRequirementData(order).length > 0;

            const stage =
              safeText(order?.stage)
                .trim()
                .toLowerCase();

            const orderPlacedStatus =
              safeText(order?.orderPlaced?.status)
                .trim()
                .toLowerCase();

            const releasedToTracking =
              orderPlacedStatus === "completed" ||
              stage === "tracking" ||
              stage === "trip complete" ||
              stage === "trip completed" ||
              stage === "completed";

            return (
              hasConfirmedTransport &&
              releasedToTracking
            );
          });

        setOrders(
          eligibleOrders
        );

        setSelectedOrderId(
          (previous) => {
            if (
              previous &&
              eligibleOrders.some(
                (order) =>
                  getMongoId(
                    order
                  ) === previous
              )
            ) {
              return previous;
            }

            const incomingId =
              getMongoId(
                incomingTrip
              );

            if (
              incomingId &&
              eligibleOrders.some(
                (order) =>
                  getMongoId(
                    order
                  ) === incomingId
              )
            ) {
              return incomingId;
            }

            return (
              getMongoId(
                eligibleOrders[0]
              ) || ""
            );
          }
        );
      } catch (fetchError) {
        console.error(
          fetchError
        );

        setOrders([]);

        setError(
          fetchError.message ||
            "Unable to load tracking orders."
        );
      } finally {
        setLoading(false);
      }
    }, [incomingTrip]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* =======================================================
     SELECTED ORDER
  ======================================================= */

  const selectedOrder =
    useMemo(
      () =>
        orders.find(
          (order) =>
            getMongoId(
              order
            ) ===
            selectedOrderId
        ) || null,
      [
        orders,
        selectedOrderId,
      ]
    );

  const confirmedRequirements =
    useMemo(
      () =>
        selectedOrder
          ? getConfirmedRequirementData(
              selectedOrder
            )
          : [],
      [selectedOrder]
    );

  const allocations =
    useMemo(
      () =>
        safeArray(
          selectedOrder
            ?.allocatedVehicles
        ),
      [selectedOrder]
    );

  /* =======================================================
     ALLOCATION COUNTS
  ======================================================= */

  const getAllocatedCount = (
    requirementId
  ) =>
    allocations.filter(
      (allocation) =>
        allocation.requirementId ===
        requirementId
    ).length;

  /* =======================================================
     ALLOCATION FORM
  ======================================================= */

  const openAllocationForm = (
    requirement,
    confirmation,
    quotation
  ) => {
    const requirementId =
      requirement.requirementId;

    setAllocationForms(
      (previous) => ({
        ...previous,

        [requirementId]:
          createAllocationForm(
            requirementId,
            confirmation.confirmationId,
            quotation.quotationId
          ),
      })
    );
  };

  const closeAllocationForm = (
    requirementId
  ) => {
    setAllocationForms(
      (previous) => {
        const next = {
          ...previous,
        };

        delete next[
          requirementId
        ];

        return next;
      }
    );
  };

  const handleAllocationChange = (
    requirementId,
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setAllocationForms(
      (previous) => ({
        ...previous,

        [requirementId]: {
          ...previous[
            requirementId
          ],

          [name]:
            value,
        },
      })
    );
  };

  /* =======================================================
     CREATE ALLOCATION
  ======================================================= */

  const handleAllocateVehicle =
    async (
      requirement,
      confirmation,
      quotation
    ) => {
      if (
        !selectedOrder
      ) {
        return;
      }

      const requirementId =
        requirement.requirementId;

      const form =
        allocationForms[
          requirementId
        ];

      if (!form) {
        return;
      }

      const vehicleNumber =
        safeText(
          form.vehicleNumber
        )
          .trim()
          .toUpperCase();

      if (!vehicleNumber) {
        setError(
          "Vehicle number is required."
        );

        return;
      }

      const requiredQuantity =
        Math.max(
          Number(
            requirement.quantity
          ) || 0,
          0
        );

      const allocatedCount =
        getAllocatedCount(
          requirementId
        );

      if (
        requiredQuantity > 0 &&
        allocatedCount >=
          requiredQuantity
      ) {
        setError(
          `Required quantity for ${requirement.vehicleType || requirementId} is already fully allocated.`
        );

        return;
      }

      const payload = {
        requirementId:
          requirement.requirementId,

        confirmationId:
          confirmation.confirmationId,

        quotationId:
          quotation.quotationId,

        vehicleNumber,

        driver: {
          name:
            safeText(
              form.driverName
            ).trim(),

          contactNumber:
            safeText(
              form.driverContactNumber
            ).trim(),
        },

        escort: {
          vehicleNumber:
            safeText(
              form.escortVehicleNumber
            )
              .trim()
              .toUpperCase(),

          name:
            safeText(
              form.escortName
            ).trim(),

          contactNumber:
            safeText(
              form.escortContactNumber
            ).trim(),
        },

        supervisor: {
          name:
            safeText(
              form.supervisorName
            ).trim(),

          contactNumber:
            safeText(
              form.supervisorContactNumber
            ).trim(),
        },

        loading: {
          status:
            form.loadingStatus ||
            "Pending",

          pointInDate:
            form.loadingPointInDate ||
            null,

          loadingDate:
            form.loadingDate ||
            null,

          pointOutDate:
            form.loadingPointOutDate ||
            null,

          haltingDays:
            numberValue(
              form.loadingHaltingDays,
              0
            ),

          remarks:
            safeText(
              form.loadingRemarks
            ).trim(),
        },

        unloading: {
          status:
            form.unloadingStatus ||
            "Pending",

          pointInDate:
            form.unloadingPointInDate ||
            null,

          unloadingDate:
            form.unloadingDate ||
            null,

          pointOutDate:
            form.unloadingPointOutDate ||
            null,

          haltingDays:
            numberValue(
              form.unloadingHaltingDays,
              0
            ),

          remarks:
            safeText(
              form.unloadingRemarks
            ).trim(),
        },
      };

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await fetch(
            `${API_URL}/${getMongoId(
              selectedOrder
            )}/allocated-vehicles`,
            {
              method: "POST",

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
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Unable to allocate vehicle."
          );
        }

        closeAllocationForm(
          requirementId
        );

        setSuccess(
          `${vehicleNumber} allocated successfully.`
        );

        await fetchOrders();
      } catch (
        allocationError
      ) {
        console.error(
          allocationError
        );

        setError(
          allocationError.message ||
            "Unable to allocate vehicle."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     EDIT ALLOCATED VEHICLE
  ======================================================= */

  const handleAllocatedVehicleChange =
    (
      allocationId,
      section,
      field,
      value
    ) => {
      setOrders(
        (previousOrders) =>
          previousOrders.map(
            (order) => {
              if (
                getMongoId(
                  order
                ) !==
                selectedOrderId
              ) {
                return order;
              }

              return {
                ...order,

                allocatedVehicles:
                  safeArray(
                    order.allocatedVehicles
                  ).map(
                    (
                      allocation
                    ) => {
                      if (
                        allocation.allocationId !==
                        allocationId
                      ) {
                        return allocation;
                      }

                      if (
                        section ===
                        "root"
                      ) {
                        return {
                          ...allocation,
                          [field]:
                            value,
                        };
                      }

                      return {
                        ...allocation,

                        [section]: {
                          ...(
                            allocation[
                              section
                            ] || {}
                          ),

                          [field]:
                            value,
                        },
                      };
                    }
                  ),
              };
            }
          )
      );
    };

  /* =======================================================
     SAVE ALLOCATED VEHICLE DETAILS
  ======================================================= */

  const handleUpdateAllocation =
    async (
      allocation
    ) => {
      if (
        !selectedOrder ||
        !allocation
          ?.allocationId
      ) {
        return;
      }

      const payload = {
        vehicleNumber:
          safeText(
            allocation.vehicleNumber
          )
            .trim()
            .toUpperCase(),

        driver: {
          name:
            safeText(
              allocation
                ?.driver
                ?.name
            ).trim(),

          contactNumber:
            safeText(
              allocation
                ?.driver
                ?.contactNumber
            ).trim(),
        },

        escort: {
          vehicleNumber:
            safeText(
              allocation
                ?.escort
                ?.vehicleNumber
            )
              .trim()
              .toUpperCase(),

          name:
            safeText(
              allocation
                ?.escort
                ?.name
            ).trim(),

          contactNumber:
            safeText(
              allocation
                ?.escort
                ?.contactNumber
            ).trim(),
        },

        supervisor: {
          name:
            safeText(
              allocation
                ?.supervisor
                ?.name
            ).trim(),

          contactNumber:
            safeText(
              allocation
                ?.supervisor
                ?.contactNumber
            ).trim(),
        },

        loading: {
          status:
            allocation
              ?.loading
              ?.status ||
            "Pending",

          pointInDate:
            allocation
              ?.loading
              ?.pointInDate ||
            null,

          loadingDate:
            allocation
              ?.loading
              ?.loadingDate ||
            null,

          pointOutDate:
            allocation
              ?.loading
              ?.pointOutDate ||
            null,

          haltingDays:
            numberValue(
              allocation
                ?.loading
                ?.haltingDays,
              0
            ),

          remarks:
            safeText(
              allocation
                ?.loading
                ?.remarks
            ).trim(),
        },

        unloading: {
          status:
            allocation
              ?.unloading
              ?.status ||
            "Pending",

          pointInDate:
            allocation
              ?.unloading
              ?.pointInDate ||
            null,

          unloadingDate:
            allocation
              ?.unloading
              ?.unloadingDate ||
            null,

          pointOutDate:
            allocation
              ?.unloading
              ?.pointOutDate ||
            null,

          haltingDays:
            numberValue(
              allocation
                ?.unloading
                ?.haltingDays,
              0
            ),

          remarks:
            safeText(
              allocation
                ?.unloading
                ?.remarks
            ).trim(),
        },
      };

      if (
        !payload.vehicleNumber
      ) {
        setError(
          "Vehicle number is required."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await fetch(
            `${API_URL}/${getMongoId(
              selectedOrder
            )}/allocated-vehicles/${allocation.allocationId}`,
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
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Unable to update vehicle."
          );
        }

        setSuccess(
          `${payload.vehicleNumber} updated successfully.`
        );

        await fetchOrders();
      } catch (
        updateError
      ) {
        console.error(
          updateError
        );

        setError(
          updateError.message ||
            "Unable to update vehicle."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     TRACKING FORM
  ======================================================= */

  const openTrackingForm = (
    allocation
  ) => {
    setTrackingForms(
      (previous) => ({
        ...previous,

        [allocation.allocationId]:
          createTrackingForm(
            allocation
          ),
      })
    );
  };

  const closeTrackingForm = (
    allocationId
  ) => {
    setTrackingForms(
      (previous) => {
        const next = {
          ...previous,
        };

        delete next[
          allocationId
        ];

        return next;
      }
    );
  };

  const handleTrackingChange = (
    allocationId,
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setTrackingForms(
      (previous) => ({
        ...previous,

        [allocationId]: {
          ...previous[
            allocationId
          ],

          [name]:
            value,
        },
      })
    );
  };

  /* =======================================================
     ADD DAILY TRACKING
  ======================================================= */

  const handleAddTracking =
    async (
      allocation
    ) => {
      if (
        !selectedOrder ||
        !allocation
          ?.allocationId
      ) {
        return;
      }

      const form =
        trackingForms[
          allocation.allocationId
        ];

      if (!form) {
        return;
      }

      if (
        !safeText(
          form.currentLocation
        ).trim()
      ) {
        setError(
          "Current location is required."
        );

        return;
      }

      const yesterdayKm =
        numberValue(
          form.yesterdayKm,
          0
        );

      const todayKm =
        numberValue(
          form.todayKm,
          yesterdayKm
        );

      const payload = {
        date:
          form.date ||
          getTodayInputDate(),

        day:
          numberValue(
            form.day,
            1
          ),

        yesterdayKm,

        todayKm,

        runningKm:
          Math.max(
            todayKm -
              yesterdayKm,
            0
          ),

        yesterdayLocation:
          safeText(
            form.yesterdayLocation
          ).trim(),

        currentLocation:
          safeText(
            form.currentLocation
          ).trim(),

        latitude:
          nullableNumber(
            form.latitude
          ),

        longitude:
          nullableNumber(
            form.longitude
          ),

        speed:
          numberValue(
            form.speed,
            0
          ),

        status:
          form.status ||
          "Idle",

        remarks:
          safeText(
            form.remarks
          ).trim(),

        updatedBy:
          safeText(
            form.updatedBy
          ).trim(),
      };

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await fetch(
            `${API_URL}/${getMongoId(
              selectedOrder
            )}/allocated-vehicles/${allocation.allocationId}/tracking`,
            {
              method: "POST",

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
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Unable to add movement update."
          );
        }

        closeTrackingForm(
          allocation.allocationId
        );

        setSuccess(
          `Movement updated for ${allocation.vehicleNumber}.`
        );

        await fetchOrders();
      } catch (
        trackingError
      ) {
        console.error(
          trackingError
        );

        setError(
          trackingError.message ||
            "Unable to add movement update."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     RENDER LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="tracking-input-page">
        <section className="tracking-form-card">
          <div className="tracking-form-card-body">
            Loading approved
            tracking orders...
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="tracking-input-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="tracking-input-page-header">
        <div>
          <span className="tracking-input-eyebrow">
            FLEET OPERATIONS
          </span>

          <h1>
            Tracking Input
          </h1>

          
        </div>

        <button
          type="button"
          className="tracking-input-back"
          disabled={saving}
          onClick={() =>
            navigate(
              "/trip-details"
            )
          }
        >
          <ArrowLeft
            size={16}
          />

          <span>
            Back to Trip Details
          </span>
        </button>
      </header>

      {/* =================================================
          MESSAGES
      ================================================= */}

      {error && (
        <div
          className="tracking-form-card"
          style={{
            padding: "12px 16px",
            marginBottom: "14px",
          }}
        >
          <strong>
            {error}
          </strong>
        </div>
      )}

      {/* =================================================
          NO ORDERS
      ================================================= */}

      {orders.length === 0 ? (
        <section className="tracking-form-card">
          <CardHeader
            icon={
              <Truck size={18} />
            }
            iconClass="indigo"
            title="No Confirmed Orders"
            subtitle="Orders will appear here after Key Account verifies the final details and clicks Place Order."
          />

          <div className="tracking-form-card-body">
            There are currently no
            placed orders ready
            for Tracking Input.
          </div>
        </section>
      ) : (
        <>
          {selectedOrder && (
            <>

              {/* =========================================
                  TRIP INFORMATION
              ========================================= */}

              <section className="tracking-form-card tracking-trip-information-card">
                <CardHeader
                  icon={
                    <Route
                      size={18}
                    />
                  }
                  iconClass="blue"
                  title="Order Snapshot"
                  subtitle="Essential trip information for the operations team."
                >
                  <span className="tracking-trip-id-badge">
                    {
                      selectedOrder.tripId
                    }
                  </span>
                </CardHeader>

                <div className="tracking-form-card-body">
                  <div className="tracking-form-grid tracking-order-snapshot-grid">
                    <FormField
                      label="Trip ID"
                      icon={
                        <Navigation
                          size={15}
                        />
                      }
                      readOnly
                      value={
                        selectedOrder.tripId
                      }
                    />

                    <FormField
                      label="Customer"
                      icon={
                        <UserRound
                          size={15}
                        />
                      }
                      readOnly
                      value={
                        selectedOrder.customer
                      }
                    />

                    <FormField
                      label="Contact Person"
                      icon={
                        <UserRound
                          size={15}
                        />
                      }
                      readOnly
                      value={
                        selectedOrder.contactPerson
                      }
                    />

                    <FormField
                      label="Contact Number"
                      icon={
                        <UserRound
                          size={15}
                        />
                      }
                      readOnly
                      value={
                        selectedOrder.contactNumber
                      }
                    />

                    <FormField
                      label="Material Type"
                      icon={
                        <Package
                          size={15}
                        />
                      }
                      readOnly
                      value={
                        selectedOrder.materialType
                      }
                    />

                    <FormField
                      label="Origin"
                      icon={
                        <MapPin
                          size={15}
                        />
                      }
                      readOnly
                      value={
                        selectedOrder.origin
                      }
                    />

                    <FormField
                      label="Destination"
                      icon={
                        <MapPin
                          size={15}
                        />
                      }
                      readOnly
                      value={
                        selectedOrder.destination
                      }
                    />

                    <FormField
                      label="Distance"
                      icon={
                        <Gauge
                          size={15}
                        />
                      }
                      readOnly
                      value={
                        selectedOrder.distance !==
                          null &&
                        selectedOrder.distance !==
                          undefined
                          ? `${selectedOrder.distance} KM`
                          : ""
                      }
                    />

                    <FormField
                      label="Placement Date"
                      icon={
                        <CalendarDays
                          size={15}
                        />
                      }
                      readOnly
                      value={
                        formatDateForInput(
                          selectedOrder.placementDate
                        )
                      }
                    />

                    <FormField
                      label="Assigned KAM"
                      icon={
                        <UserRound
                          size={15}
                        />
                      }
                      readOnly
                      value={
                        selectedOrder.assignedKam
                      }
                    />
                  </div>

                  {/* ROUTE */}

                  <div className="tracking-route-locations tracking-trip-route-locations">
                    <div className="tracking-route-locations-header">
                      <div>
                        <strong>
                          Trip Route
                        </strong>

                        <span>
                          Approved route
                          information.
                        </span>
                      </div>
                    </div>

                    <div className="tracking-route-location-flow">
                      <span className="tracking-route-fixed-point origin">
                        <MapPin
                          size={12}
                        />

                        {selectedOrder.origin ||
                          "Origin"}
                      </span>

                      {safeArray(
                        selectedOrder.routeLocations
                      ).map(
                        (
                          routeLocation,
                          index
                        ) => (
                          <React.Fragment
                            key={`${routeLocation}-${index}`}
                          >
                            <ChevronRight
                              size={13}
                              className="tracking-route-flow-arrow"
                            />

                            <span className="tracking-route-location-chip">
                              {
                                routeLocation
                              }
                            </span>
                          </React.Fragment>
                        )
                      )}

                      <ChevronRight
                        size={13}
                        className="tracking-route-flow-arrow"
                      />

                      <span className="tracking-route-fixed-point destination">
                        <MapPin
                          size={12}
                        />

                        {selectedOrder.destination ||
                          "Destination"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* =========================================
                  REQUIRED VEHICLE DETAILS
              ========================================= */}

              <section className="tracking-form-card tracking-required-vehicle-card">
                <CardHeader
                  icon={
                    <Building2
                      size={18}
                    />
                  }
                  iconClass="indigo"
                  title="Vehicle Allocation Plan"
                  subtitle="Review each approved requirement and allocate actual vehicles."
                />

                <div className="tracking-form-card-body tracking-required-vehicle-body">
                  <div className="tracking-required-vehicle-table-wrap">
                    <table className="tracking-required-vehicle-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Vehicle Type</th>
                          <th>Configuration</th>
                          <th>Classification</th>
                          <th>Required Qty</th>
                          <th>Weight</th>
                          <th>L × H × W</th>
                          <th>Confirmed Transporter</th>
                          <th>Allocated</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {confirmedRequirements.map(
                          (
                            {
                              requirement,
                              confirmation,
                              quotation,
                            },
                            index
                          ) => {
                            const requirementId =
                              requirement.requirementId;

                            const allocatedCount =
                              getAllocatedCount(
                                requirementId
                              );

                            const requiredQuantity =
                              Math.max(
                                Number(
                                  requirement.quantity
                                ) || 0,
                                0
                              );

                            const fullyAllocated =
                              requiredQuantity > 0 &&
                              allocatedCount >=
                                requiredQuantity;

                            const allocationForm =
                              allocationForms[
                                requirementId
                              ];

                            return (
                              <React.Fragment
                                key={
                                  requirementId
                                }
                              >
                                <tr>
                                  <td>
                                    <span className="tracking-required-row-number">
                                      {index + 1}
                                    </span>
                                  </td>

                                  <td>
                                    <strong className="tracking-required-primary">
                                      {requirement.vehicleType || "—"}
                                    </strong>
                                  </td>

                                  <td>
                                    {requirement.configuration || "—"}
                                  </td>

                                  <td>
                                    {requirement.classification || "—"}
                                  </td>

                                  <td>
                                    {requirement.quantity ?? "—"}
                                  </td>

                                  <td>
                                    {requirement.weight !== null &&
                                    requirement.weight !== undefined
                                      ? `${requirement.weight} TON`
                                      : "—"}
                                  </td>

                                  <td>
                                    {formatDimensions(
                                      requirement.dimensions
                                    )}
                                  </td>

                                  <td>
                                    <div className="tracking-required-transporter">
                                      <Building2 size={14} />
                                      <span>
                                        {quotation.transporter || "—"}
                                      </span>
                                    </div>
                                  </td>

                                  <td>
                                    <span
                                      className={
                                        fullyAllocated
                                          ? "tracking-required-allocation complete"
                                          : "tracking-required-allocation"
                                      }
                                    >
                                      {allocatedCount} / {requiredQuantity}
                                    </span>
                                  </td>

                                  <td>
                                    {!fullyAllocated ? (
                                      <button
                                        type="button"
                                        className="tracking-required-allocate-btn"
                                        disabled={
                                          saving
                                        }
                                        onClick={() =>
                                          allocationForm
                                            ? closeAllocationForm(
                                                requirementId
                                              )
                                            : openAllocationForm(
                                                requirement,
                                                confirmation,
                                                quotation
                                              )
                                        }
                                      >
                                        <Plus
                                          size={14}
                                        />
                                        <span>
                                          {allocationForm
                                            ? "Cancel"
                                            : "Allocate"}
                                        </span>
                                      </button>
                                    ) : (
                                      <span className="tracking-required-complete-badge">
                                        Allocated
                                      </span>
                                    )}
                                  </td>
                                </tr>

                                {allocationForm && (
                                  <tr className="tracking-required-form-row">
                                    <td colSpan={10}>
                                      <article className="tracking-vehicle-entry-card tracking-vehicle-expanded-card tracking-required-allocation-form">


                                <VehicleSectionTitle
                                  icon={
                                    <Plus
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  title="Allocate Actual Vehicle"
                                  type="driver"
                                />

                                <div className="tracking-vehicle-entry-grid tracking-driver-data-grid">
                                  <FormField
                                    label="Vehicle Number"
                                    required
                                    icon={
                                      <Truck
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="vehicleNumber"
                                    value={
                                      allocationForm.vehicleNumber
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                    placeholder="KA01AB1234"
                                  />

                                  <FormField
                                    label="Driver Name"
                                    icon={
                                      <UserRound
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="driverName"
                                    value={
                                      allocationForm.driverName
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                    placeholder="Driver name"
                                  />

                                  <FormField
                                    label="Driver Contact Number"
                                    icon={
                                      <UserRound
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="driverContactNumber"
                                    value={
                                      allocationForm.driverContactNumber
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                    placeholder="Contact number"
                                  />
                                </div>

                                <div className="tracking-trip-support-grid">
                                  <SupportCard
                                    title="Escort Details"
                                    subtitle="Vehicle-specific escort information"
                                    icon={
                                      <Truck
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    className="escort"
                                  >
                                    <FormField
                                      label="Escort Vehicle Number"
                                      icon={
                                        <Truck
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="escortVehicleNumber"
                                      value={
                                        allocationForm.escortVehicleNumber
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleAllocationChange(
                                          requirementId,
                                          event
                                        )
                                      }
                                      placeholder="Escort vehicle"
                                    />

                                    <FormField
                                      label="Escort Name"
                                      icon={
                                        <UserRound
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="escortName"
                                      value={
                                        allocationForm.escortName
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleAllocationChange(
                                          requirementId,
                                          event
                                        )
                                      }
                                      placeholder="Escort name"
                                    />

                                    <FormField
                                      label="Escort Contact Number"
                                      icon={
                                        <UserRound
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="escortContactNumber"
                                      value={
                                        allocationForm.escortContactNumber
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleAllocationChange(
                                          requirementId,
                                          event
                                        )
                                      }
                                      placeholder="Contact number"
                                    />
                                  </SupportCard>

                                  <SupportCard
                                    title="Supervisor Details"
                                    subtitle="Vehicle-specific supervisor information"
                                    icon={
                                      <UserRound
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    className="supervisor"
                                  >
                                    <FormField
                                      label="Supervisor Name"
                                      icon={
                                        <UserRound
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="supervisorName"
                                      value={
                                        allocationForm.supervisorName
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleAllocationChange(
                                          requirementId,
                                          event
                                        )
                                      }
                                      placeholder="Supervisor name"
                                    />

                                    <FormField
                                      label="Supervisor Contact"
                                      icon={
                                        <UserRound
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="supervisorContactNumber"
                                      value={
                                        allocationForm.supervisorContactNumber
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleAllocationChange(
                                          requirementId,
                                          event
                                        )
                                      }
                                      placeholder="Contact number"
                                    />
                                  </SupportCard>
                                </div>

                                <VehicleSectionTitle
                                  icon={
                                    <Truck
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  title="Loading Details"
                                  type="loading"
                                />

                                <div className="tracking-vehicle-entry-grid tracking-driver-data-grid">
                                  <NormalSelect
                                    label="Loading Status"
                                    icon={
                                      <Truck
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="loadingStatus"
                                    value={
                                      allocationForm.loadingStatus
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                    options={[
                                      "Pending",
                                      "At Loading Point",
                                      "Loading",
                                      "Loaded",
                                      "Departed",
                                    ]}
                                  />

                                  <FormField
                                    label="Point In Date"
                                    type="date"
                                    icon={
                                      <CalendarDays
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="loadingPointInDate"
                                    value={
                                      allocationForm.loadingPointInDate
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                  />

                                  <FormField
                                    label="Loading Date"
                                    type="date"
                                    icon={
                                      <CalendarDays
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="loadingDate"
                                    value={
                                      allocationForm.loadingDate
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                  />

                                  <FormField
                                    label="Point Out Date"
                                    type="date"
                                    icon={
                                      <CalendarDays
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="loadingPointOutDate"
                                    value={
                                      allocationForm.loadingPointOutDate
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                  />

                                  <FormField
                                    label="Halting Days"
                                    type="number"
                                    min="0"
                                    icon={
                                      <Clock3
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="loadingHaltingDays"
                                    value={
                                      allocationForm.loadingHaltingDays
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                  />

                                  <FormField
                                    label="Loading Remarks"
                                    icon={
                                      <MessageSquareText
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="loadingRemarks"
                                    value={
                                      allocationForm.loadingRemarks
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                  />
                                </div>

                                <VehicleSectionTitle
                                  icon={
                                    <PackageCheck
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  title="Unloading Details"
                                  type="unloading"
                                />

                                <div className="tracking-vehicle-entry-grid tracking-driver-data-grid">
                                  <NormalSelect
                                    label="Unloading Status"
                                    icon={
                                      <PackageCheck
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="unloadingStatus"
                                    value={
                                      allocationForm.unloadingStatus
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                    options={[
                                      "Pending",
                                      "At Unloading Point",
                                      "Unloading",
                                      "Unloaded",
                                      "Completed",
                                    ]}
                                  />

                                  <FormField
                                    label="Point In Date"
                                    type="date"
                                    icon={
                                      <CalendarDays
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="unloadingPointInDate"
                                    value={
                                      allocationForm.unloadingPointInDate
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                  />

                                  <FormField
                                    label="Unloading Date"
                                    type="date"
                                    icon={
                                      <CalendarDays
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="unloadingDate"
                                    value={
                                      allocationForm.unloadingDate
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                  />

                                  <FormField
                                    label="Point Out Date"
                                    type="date"
                                    icon={
                                      <CalendarDays
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="unloadingPointOutDate"
                                    value={
                                      allocationForm.unloadingPointOutDate
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                  />

                                  <FormField
                                    label="Halting Days"
                                    type="number"
                                    min="0"
                                    icon={
                                      <Clock3
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="unloadingHaltingDays"
                                    value={
                                      allocationForm.unloadingHaltingDays
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                  />

                                  <FormField
                                    label="Unloading Remarks"
                                    icon={
                                      <MessageSquareText
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    name="unloadingRemarks"
                                    value={
                                      allocationForm.unloadingRemarks
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleAllocationChange(
                                        requirementId,
                                        event
                                      )
                                    }
                                  />
                                </div>

                                <div className="tracking-form-footer">
                                  <div />

                                  <div className="tracking-form-footer-actions">
                                    <button
                                      type="button"
                                      className="tracking-form-cancel"
                                      disabled={
                                        saving
                                      }
                                      onClick={() =>
                                        closeAllocationForm(
                                          requirementId
                                        )
                                      }
                                    >
                                      Cancel
                                    </button>

                                    <button
                                      type="button"
                                      className="tracking-form-save"
                                      disabled={
                                        saving
                                      }
                                      onClick={() =>
                                        handleAllocateVehicle(
                                          requirement,
                                          confirmation,
                                          quotation
                                        )
                                      }
                                    >
                                      <Save
                                        size={
                                          15
                                        }
                                      />

                                      <span>
                                        {saving
                                          ? "Saving..."
                                          : "Allocate Vehicle"}
                                      </span>
                                    </button>
                                  </div>
                                </div>

                                      </article>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* =========================================
                  ALLOCATED VEHICLES
              ========================================= */}

              <section className="tracking-form-card">
                <CardHeader
                  icon={
                    <Truck
                      size={18}
                    />
                  }
                  iconClass="indigo"
                  title="Live Vehicle Operations"
                  subtitle="Manage driver, escort, supervisor, loading, unloading and daily movement."
                >
                  <span className="tracking-trip-id-badge">
                    {
                      allocations.length
                    }{" "}
                    Vehicles
                  </span>
                </CardHeader>

                <div className="tracking-form-card-body">
                  {allocations.length ===
                  0 ? (
                    <div className="tracking-route-location-empty">
                      No actual vehicles
                      have been allocated
                      yet.
                    </div>
                  ) : (
                    <div className="tracking-vehicle-list">
                      {allocations.map(
                        (
                          allocation,
                          index
                        ) => {
                          const requirement =
                            getRequirement(
                              selectedOrder,
                              allocation.requirementId
                            );

                          const confirmation =
                            getConfirmation(
                              selectedOrder,
                              allocation.confirmationId
                            ) ||
                            getApprovedConfirmation(
                              selectedOrder,
                              allocation.requirementId
                            );

                          const quotation =
                            getQuotation(
                              selectedOrder,
                              allocation.quotationId ||
                                confirmation?.quotationId
                            );

                          const latest =
                            getLatestTracking(
                              allocation
                            );

                          const trackingForm =
                            trackingForms[
                              allocation.allocationId
                            ];

                          return (
                            <article
                              key={
                                allocation.allocationId
                              }
                              className="tracking-vehicle-entry-card tracking-vehicle-expanded-card"
                            >
                              <div className="tracking-vehicle-entry-header">
                                <div className="tracking-vehicle-entry-title">
                                  <span className="tracking-vehicle-number-icon">
                                    <Truck
                                      size={
                                        15
                                      }
                                    />
                                  </span>

                                  <div>
                                    <strong>
                                      {allocation.vehicleNumber ||
                                        `Vehicle ${index + 1}`}
                                    </strong>

                                    <small>
                                      {requirement?.vehicleType ||
                                        allocation.requirementId}
                                    </small>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="tracking-add-vehicle-btn"
                                  disabled={
                                    saving
                                  }
                                  onClick={() =>
                                    openTrackingForm(
                                      allocation
                                    )
                                  }
                                >
                                  <Plus
                                    size={
                                      15
                                    }
                                  />

                                  Add Movement
                                </button>
                              </div>

                              {/* CONFIRMED DETAILS */}

                              <VehicleSectionTitle
                                icon={
                                  <Building2
                                    size={
                                      15
                                    }
                                  />
                                }
                                title="Confirmed Requirement"
                                type="tracking"
                              />

                              <div className="tracking-requirement-summary">
                                <div className="tracking-summary-item">
                                  <span className="tracking-summary-label">Vehicle Type</span>
                                  <div className="tracking-summary-value">
                                    <Truck size={15} />
                                    <strong>{requirement?.vehicleType || "—"}</strong>
                                  </div>
                                </div>

                                <span className="tracking-summary-divider" aria-hidden="true" />

                                <div className="tracking-summary-item">
                                  <span className="tracking-summary-label">Configuration</span>
                                  <div className="tracking-summary-value">
                                    <Truck size={15} />
                                    <strong>{requirement?.configuration || "—"}</strong>
                                  </div>
                                </div>

                                <span className="tracking-summary-divider" aria-hidden="true" />

                                <div className="tracking-summary-item">
                                  <span className="tracking-summary-label">Confirmed Transporter</span>
                                  <div className="tracking-summary-value">
                                    <Building2 size={15} />
                                    <strong>{quotation?.transporter || "—"}</strong>
                                  </div>
                                </div>

                                <span className="tracking-summary-divider" aria-hidden="true" />

                                <div className="tracking-summary-item">
                                  <span className="tracking-summary-label">Latest Status</span>
                                  <div className="tracking-summary-value">
                                    <Navigation size={15} />
                                    <strong>{latest?.status || "Idle"}</strong>
                                  </div>
                                </div>

                                <span className="tracking-summary-divider" aria-hidden="true" />

                                <div className="tracking-summary-item">
                                  <span className="tracking-summary-label">Latest Location</span>
                                  <div className="tracking-summary-value">
                                    <MapPin size={15} />
                                    <strong>{latest?.currentLocation || "—"}</strong>
                                  </div>
                                </div>

                                <span className="tracking-summary-divider" aria-hidden="true" />

                                <div className="tracking-summary-item">
                                  <span className="tracking-summary-label">Current Day</span>
                                  <div className="tracking-summary-value">
                                    <CalendarDays size={15} />
                                    <strong>
                                      {latest?.day
                                        ? `Day ${latest.day}`
                                        : "No movement update"}
                                    </strong>
                                  </div>
                                </div>
                              </div>

                              {/* DRIVER / ESCORT / SUPERVISOR - SINGLE ROW */}
                              <div className="tracking-personnel-row">
                                <SupportCard
                                  title="Driver Details"
                                  subtitle="Vehicle and driver information"
                                  icon={
                                    <UserRound size={15} />
                                  }
                                  className="driver"
                                >
                                <AllocatedField
                                  label="Vehicle Number"
                                  icon={
                                    <Truck
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={
                                    allocation.vehicleNumber
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "root",
                                      "vehicleNumber",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Driver Name"
                                  icon={
                                    <UserRound
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={
                                    allocation
                                      ?.driver
                                      ?.name
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "driver",
                                      "name",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Driver Contact Number"
                                  icon={
                                    <UserRound
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={
                                    allocation
                                      ?.driver
                                      ?.contactNumber
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "driver",
                                      "contactNumber",
                                      value
                                    )
                                  }
                                />
                                </SupportCard>

                                <SupportCard
                                  title="Escort Details"
                                  subtitle="Vehicle-specific escort information"
                                  icon={
                                    <Truck
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  className="escort"
                                >
                                  <AllocatedField
                                    label="Escort Vehicle Number"
                                    icon={
                                      <Truck
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    value={
                                      allocation
                                        ?.escort
                                        ?.vehicleNumber
                                    }
                                    onChange={(
                                      value
                                    ) =>
                                      handleAllocatedVehicleChange(
                                        allocation.allocationId,
                                        "escort",
                                        "vehicleNumber",
                                        value
                                      )
                                    }
                                  />

                                  <AllocatedField
                                    label="Escort Name"
                                    icon={
                                      <UserRound
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    value={
                                      allocation
                                        ?.escort
                                        ?.name
                                    }
                                    onChange={(
                                      value
                                    ) =>
                                      handleAllocatedVehicleChange(
                                        allocation.allocationId,
                                        "escort",
                                        "name",
                                        value
                                      )
                                    }
                                  />

                                  <AllocatedField
                                    label="Escort Contact"
                                    icon={
                                      <UserRound
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    value={
                                      allocation
                                        ?.escort
                                        ?.contactNumber
                                    }
                                    onChange={(
                                      value
                                    ) =>
                                      handleAllocatedVehicleChange(
                                        allocation.allocationId,
                                        "escort",
                                        "contactNumber",
                                        value
                                      )
                                    }
                                  />
                                </SupportCard>

                                <SupportCard
                                  title="Supervisor Details"
                                  subtitle="Vehicle-specific supervisor information"
                                  icon={
                                    <UserRound
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  className="supervisor"
                                >
                                  <AllocatedField
                                    label="Supervisor Name"
                                    icon={
                                      <UserRound
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    value={
                                      allocation
                                        ?.supervisor
                                        ?.name
                                    }
                                    onChange={(
                                      value
                                    ) =>
                                      handleAllocatedVehicleChange(
                                        allocation.allocationId,
                                        "supervisor",
                                        "name",
                                        value
                                      )
                                    }
                                  />

                                  <AllocatedField
                                    label="Supervisor Contact"
                                    icon={
                                      <UserRound
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    value={
                                      allocation
                                        ?.supervisor
                                        ?.contactNumber
                                    }
                                    onChange={(
                                      value
                                    ) =>
                                      handleAllocatedVehicleChange(
                                        allocation.allocationId,
                                        "supervisor",
                                        "contactNumber",
                                        value
                                      )
                                    }
                                  />
                                </SupportCard>
                              </div>

                              {/* LOADING + UNLOADING - SIDE BY SIDE */}
                              <div className="tracking-operation-row">
                                <section className="tracking-operation-card loading">
                                  <div className="tracking-operation-card-header">
                                    <div className="tracking-operation-card-icon">
                                      <Truck size={17} />
                                    </div>
                                    <div>
                                      <strong>Loading Details</strong>
                                      <span>Loading point and dispatch information</span>
                                    </div>
                                  </div>

                                  <div className="tracking-operation-card-grid">
                                <AllocatedSelect
                                  label="Loading Status"
                                  icon={
                                    <Truck
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={
                                    allocation
                                      ?.loading
                                      ?.status ||
                                    "Pending"
                                  }
                                  options={[
                                    "Pending",
                                    "At Loading Point",
                                    "Loading",
                                    "Loaded",
                                    "Departed",
                                  ]}
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "loading",
                                      "status",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Point In Date"
                                  type="date"
                                  icon={
                                    <CalendarDays
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={formatDateForInput(
                                    allocation
                                      ?.loading
                                      ?.pointInDate
                                  )}
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "loading",
                                      "pointInDate",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Loading Date"
                                  type="date"
                                  icon={
                                    <CalendarDays
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={formatDateForInput(
                                    allocation
                                      ?.loading
                                      ?.loadingDate
                                  )}
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "loading",
                                      "loadingDate",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Point Out Date"
                                  type="date"
                                  icon={
                                    <CalendarDays
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={formatDateForInput(
                                    allocation
                                      ?.loading
                                      ?.pointOutDate
                                  )}
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "loading",
                                      "pointOutDate",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Halting Days"
                                  type="number"
                                  min="0"
                                  icon={
                                    <Clock3
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={
                                    allocation
                                      ?.loading
                                      ?.haltingDays ??
                                    ""
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "loading",
                                      "haltingDays",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Loading Remarks"
                                  icon={
                                    <MessageSquareText
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={
                                    allocation
                                      ?.loading
                                      ?.remarks
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "loading",
                                      "remarks",
                                      value
                                    )
                                  }
                                />
                              </div>
                                </section>

                                <section className="tracking-operation-card unloading">
                                  <div className="tracking-operation-card-header">
                                    <div className="tracking-operation-card-icon">
                                      <PackageCheck size={17} />
                                    </div>
                                    <div>
                                      <strong>Unloading Details</strong>
                                      <span>Delivery point and unloading information</span>
                                    </div>
                                  </div>

                                  <div className="tracking-operation-card-grid">
                                <AllocatedSelect
                                  label="Unloading Status"
                                  icon={
                                    <PackageCheck
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={
                                    allocation
                                      ?.unloading
                                      ?.status ||
                                    "Pending"
                                  }
                                  options={[
                                    "Pending",
                                    "At Unloading Point",
                                    "Unloading",
                                    "Unloaded",
                                    "Completed",
                                  ]}
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "unloading",
                                      "status",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Point In Date"
                                  type="date"
                                  icon={
                                    <CalendarDays
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={formatDateForInput(
                                    allocation
                                      ?.unloading
                                      ?.pointInDate
                                  )}
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "unloading",
                                      "pointInDate",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Unloading Date"
                                  type="date"
                                  icon={
                                    <CalendarDays
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={formatDateForInput(
                                    allocation
                                      ?.unloading
                                      ?.unloadingDate
                                  )}
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "unloading",
                                      "unloadingDate",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Point Out Date"
                                  type="date"
                                  icon={
                                    <CalendarDays
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={formatDateForInput(
                                    allocation
                                      ?.unloading
                                      ?.pointOutDate
                                  )}
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "unloading",
                                      "pointOutDate",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Halting Days"
                                  type="number"
                                  min="0"
                                  icon={
                                    <Clock3
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={
                                    allocation
                                      ?.unloading
                                      ?.haltingDays ??
                                    ""
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "unloading",
                                      "haltingDays",
                                      value
                                    )
                                  }
                                />

                                <AllocatedField
                                  label="Unloading Remarks"
                                  icon={
                                    <MessageSquareText
                                      size={
                                        15
                                      }
                                    />
                                  }
                                  value={
                                    allocation
                                      ?.unloading
                                      ?.remarks
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    handleAllocatedVehicleChange(
                                      allocation.allocationId,
                                      "unloading",
                                      "remarks",
                                      value
                                    )
                                  }
                                />
                              </div>
                                </section>
                              </div>

                              <div className="tracking-form-footer">
                                <div />

                                <button
                                  type="button"
                                  className="tracking-form-save"
                                  disabled={
                                    saving
                                  }
                                  onClick={() =>
                                    handleUpdateAllocation(
                                      allocation
                                    )
                                  }
                                >
                                  <Save
                                    size={
                                      15
                                    }
                                  />

                                  <span>
                                    {saving
                                      ? "Saving..."
                                      : "Save Vehicle Details"}
                                  </span>
                                </button>
                              </div>

                              {/* DAILY TRACKING */}

                              {trackingForm && (
                                <div
                                  className="tracking-movement-modal-overlay"
                                  role="dialog"
                                  aria-modal="true"
                                  aria-label={`Add movement for ${allocation.vehicleNumber || "vehicle"}`}
                                  onMouseDown={(event) => {
                                    if (event.target === event.currentTarget) {
                                      closeTrackingForm(allocation.allocationId);
                                    }
                                  }}
                                >
                                  <div className="tracking-movement-modal">
                                    <div className="tracking-movement-modal-head">
                                      <div>
                                        <span className="tracking-movement-modal-kicker">DAILY TRACKING</span>
                                        <h3>Add Movement</h3>
                                        <p>{allocation.vehicleNumber || "Vehicle"} · Update today’s movement information.</p>
                                      </div>
                                      <button
                                        type="button"
                                        className="tracking-movement-modal-close"
                                        disabled={saving}
                                        onClick={() => closeTrackingForm(allocation.allocationId)}
                                        aria-label="Close movement modal"
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <div className="tracking-movement-modal-body">
                                  <VehicleSectionTitle
                                    icon={
                                      <Navigation
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    title="Daily Movement"
                                    type="tracking"
                                  />

                                  <div className="tracking-vehicle-entry-grid tracking-driver-data-grid tracking-movement-grid">
                                    <FormField
                                      label="Date"
                                      type="date"
                                      icon={
                                        <CalendarDays
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="date"
                                      value={
                                        trackingForm.date
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleTrackingChange(
                                          allocation.allocationId,
                                          event
                                        )
                                      }
                                    />

                                    <FormField
                                      label="Day"
                                      type="number"
                                      min="1"
                                      icon={
                                        <CalendarDays
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="day"
                                      value={
                                        trackingForm.day
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleTrackingChange(
                                          allocation.allocationId,
                                          event
                                        )
                                      }
                                    />

                                    <FormField
                                      label="Yesterday KM"
                                      type="number"
                                      min="0"
                                      icon={
                                        <Gauge
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="yesterdayKm"
                                      value={
                                        trackingForm.yesterdayKm
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleTrackingChange(
                                          allocation.allocationId,
                                          event
                                        )
                                      }
                                    />

                                    <FormField
                                      label="Today KM"
                                      type="number"
                                      min="0"
                                      icon={
                                        <Gauge
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="todayKm"
                                      value={
                                        trackingForm.todayKm
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleTrackingChange(
                                          allocation.allocationId,
                                          event
                                        )
                                      }
                                    />

                                    <FormField
                                      label="Running KM"
                                      readOnly
                                      icon={
                                        <Gauge
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      value={Math.max(
                                        numberValue(
                                          trackingForm.todayKm,
                                          0
                                        ) -
                                          numberValue(
                                            trackingForm.yesterdayKm,
                                            0
                                          ),
                                        0
                                      )}
                                    />

                                    <FormField
                                      label="Yesterday Location"
                                      icon={
                                        <MapPin
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="yesterdayLocation"
                                      value={
                                        trackingForm.yesterdayLocation
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleTrackingChange(
                                          allocation.allocationId,
                                          event
                                        )
                                      }
                                    />

                                    <FormField
                                      label="Current Location"
                                      required
                                      icon={
                                        <MapPin
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="currentLocation"
                                      value={
                                        trackingForm.currentLocation
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleTrackingChange(
                                          allocation.allocationId,
                                          event
                                        )
                                      }
                                    />

                                    <NormalSelect
                                      label="Movement Status"
                                      icon={
                                        <Navigation
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="status"
                                      value={
                                        trackingForm.status
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleTrackingChange(
                                          allocation.allocationId,
                                          event
                                        )
                                      }
                                      options={[
                                        "Moving",
                                        "Idle",
                                        "Stopped",
                                        "Breakdown",
                                        "Reached",
                                      ]}
                                    />

                                    <FormField
                                      label="Updated By"
                                      icon={
                                        <UserRound
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="updatedBy"
                                      value={
                                        trackingForm.updatedBy
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleTrackingChange(
                                          allocation.allocationId,
                                          event
                                        )
                                      }
                                    />

                                    <FormField
                                      label="Remarks"
                                      icon={
                                        <MessageSquareText
                                          size={
                                            15
                                          }
                                        />
                                      }
                                      name="remarks"
                                      value={
                                        trackingForm.remarks
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleTrackingChange(
                                          allocation.allocationId,
                                          event
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="tracking-form-footer">
                                    <div />

                                    <div className="tracking-form-footer-actions">
                                      <button
                                        type="button"
                                        className="tracking-form-cancel"
                                        disabled={
                                          saving
                                        }
                                        onClick={() =>
                                          closeTrackingForm(
                                            allocation.allocationId
                                          )
                                        }
                                      >
                                        Cancel
                                      </button>

                                      <button
                                        type="button"
                                        className="tracking-form-save"
                                        disabled={
                                          saving
                                        }
                                        onClick={() =>
                                          handleAddTracking(
                                            allocation
                                          )
                                        }
                                      >
                                        <Save
                                          size={
                                            15
                                          }
                                        />

                                        <span>
                                          {saving
                                            ? "Saving..."
                                            : "Save Movement"}
                                        </span>
                                      </button>
                                    </div>
                                  </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* HISTORY */}

                              {safeArray(
                                allocation.dailyTracking
                              ).length >
                                0 && (
                                <>
                                  <VehicleSectionTitle
                                    icon={
                                      <Clock3
                                        size={
                                          15
                                        }
                                      />
                                    }
                                    title="Movement History"
                                    type="tracking"
                                  />

                                  <div className="tracking-route-location-list">
                                    {safeArray(
                                      allocation.dailyTracking
                                    )
                                      .slice()
                                      .reverse()
                                      .map(
                                        (
                                          tracking,
                                          trackingIndex
                                        ) => (
                                          <div
                                            key={
                                              tracking.trackingId ||
                                              trackingIndex
                                            }
                                            className="tracking-route-location-row"
                                          >
                                            <span className="tracking-route-location-number">
                                              {tracking.day ||
                                                trackingIndex +
                                                  1}
                                            </span>

                                            <div className="tracking-route-location-input">
                                              <MapPin
                                                size={
                                                  14
                                                }
                                              />

                                              <span>
                                                {tracking.currentLocation ||
                                                  "—"}{" "}
                                                •{" "}
                                                {tracking.runningKm ??
                                                  0}{" "}
                                                KM •{" "}
                                                {tracking.status ||
                                                  "Idle"}
                                              </span>
                                            </div>
                                          </div>
                                        )
                                      )}
                                  </div>
                                </>
                              )}
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
};

/* =========================================================
   CARD HEADER
========================================================= */

const CardHeader = ({
  icon,
  iconClass,
  title,
  subtitle,
  children,
}) => (
  <div className="tracking-form-card-header">
    <div
      className={`tracking-form-card-icon ${iconClass}`}
    >
      {icon}
    </div>

    <div>
      <h2>
        {title}
      </h2>

      <p>
        {subtitle}
      </p>
    </div>

    {children}
  </div>
);

/* =========================================================
   SUPPORT CARD
========================================================= */

const SupportCard = ({
  title,
  subtitle,
  icon,
  className,
  children,
}) => (
  <div
    className={`tracking-trip-support-card ${className}`}
  >
    <div className="tracking-trip-support-heading">
      {icon}

      <div>
        <strong>
          {title}
        </strong>

        <span>
          {subtitle}
        </span>
      </div>
    </div>

    <div className="tracking-support-fields">
      {children}
    </div>
  </div>
);

/* =========================================================
   NORMAL FIELD
========================================================= */

const FormField = ({
  label,
  icon,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  min,
  readOnly = false,
  required = false,
}) => (
  <div className="tracking-form-field">
    <label>
      {label}

      {required && (
        <span>
          *
        </span>
      )}
    </label>

    <div
      className={`tracking-form-control ${
        readOnly
          ? "tracking-readonly-control"
          : ""
      }`}
    >
      {icon}

      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={
          placeholder
        }
        min={min}
        readOnly={
          readOnly
        }
        required={
          required
        }
      />
    </div>
  </div>
);

/* =========================================================
   NORMAL SELECT
========================================================= */

const NormalSelect = ({
  label,
  icon,
  name,
  value,
  onChange,
  options = [],
}) => (
  <div className="tracking-form-field">
    <label>
      {label}
    </label>

    <div className="tracking-form-control">
      {icon}

      <select
        name={name}
        value={
          value ||
          options[0] ||
          ""
        }
        onChange={
          onChange
        }
      >
        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>
    </div>
  </div>
);

/* =========================================================
   ALLOCATED VEHICLE FIELD
========================================================= */

const AllocatedField = ({
  label,
  icon,
  type = "text",
  value,
  onChange,
  min,
}) => (
  <div className="tracking-form-field">
    <label>
      {label}
    </label>

    <div className="tracking-form-control">
      {icon}

      <input
        type={type}
        min={min}
        value={
          value ?? ""
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
      />
    </div>
  </div>
);

/* =========================================================
   ALLOCATED VEHICLE SELECT
========================================================= */

const AllocatedSelect = ({
  label,
  icon,
  value,
  options = [],
  onChange,
}) => (
  <div className="tracking-form-field">
    <label>
      {label}
    </label>

    <div className="tracking-form-control">
      {icon}

      <select
        value={
          value ||
          options[0] ||
          ""
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
      >
        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>
    </div>
  </div>
);

/* =========================================================
   VEHICLE SECTION TITLE
========================================================= */

const VehicleSectionTitle = ({
  icon,
  title,
  type,
}) => (
  <div
    className={`tracking-vehicle-subsection-title ${type}`}
  >
    <span>
      {icon}
    </span>

    <strong>
      {title}
    </strong>
  </div>
);

export default Trackinginput;