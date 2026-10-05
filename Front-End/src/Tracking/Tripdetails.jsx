import React, {

  useCallback,

  useEffect,

  useState,

} from "react";

import {

  ArrowLeft,

  CalendarDays,

  ChevronRight,

  Navigation,

  MapPin,

  X,

  Save,

  MessageSquareText,

  Package,

  Plus,

  RefreshCw,

  Route,

  Truck,

  UserRound,

  FileText,

  Upload,

  Eye,

} from "lucide-react";

import {

  useNavigate,

} from "react-router-dom";

import "./Tripdetails.css";

/* =========================================

   API

========================================= */

const API_BASE_URL = (

  import.meta.env.VITE_API_URL ||

  import.meta.env.VITE_API_BASE_URL ||

  "http://localhost:5000"

).replace(/\/+$/, "");

const API_URL =

  `${API_BASE_URL}/api/triporders`;

/* =========================================

   HELPERS

========================================= */

const safeArray = (value) =>

  Array.isArray(value)

    ? value

    : [];

const safeText = (

  value,

  fallback = "-"

) => {

  if (

    value === null ||

    value === undefined ||

    value === ""

  ) {

    return fallback;

  }

  if (

    typeof value === "object"

  ) {

    if (value.$oid) {

      return String(value.$oid);

    }

    if (value.$date) {

      return String(value.$date);

    }

    return fallback;

  }

  return String(value);

};

/* =========================================

   RESPONSE

========================================= */

const extractTrips = (result) => {

  if (

    Array.isArray(result)

  ) {

    return result;

  }

  if (

    Array.isArray(

      result?.data

    )

  ) {

    return result.data;

  }

  if (

    Array.isArray(

      result?.trips

    )

  ) {

    return result.trips;

  }

  if (

    Array.isArray(

      result?.orders

    )

  ) {

    return result.orders;

  }

  return [];

};

/* =========================================

   NORMALIZE TRIP

========================================= */

const normalizeTrip = (

  trip,

  index

) => {

  const allocatedVehicles =

    safeArray(

      trip?.allocatedVehicles

    );

  const vehicleRequirements =

    safeArray(

      trip?.vehicleRequirements

    );

  const trafficQuotations =

    safeArray(

      trip?.trafficQuotations

    );

  const vehicleConfirmations =

    safeArray(

      trip?.vehicleConfirmations

    );

  return {

    ...trip,

    id:

      safeText(

        trip?._id,

        ""

      ) ||

      safeText(

        trip?.tripId,

        ""

      ) ||

      `trip-${index}`,

    allocatedVehicles,

    vehicleRequirements,

    trafficQuotations,

    vehicleConfirmations,

  };

};

/* =========================================

   LATEST TRACKING

========================================= */

const getLatestTracking = (

  vehicle

) => {

  const tracking =

    safeArray(

      vehicle?.dailyTracking

    );

  if (!tracking.length) {

    return null;

  }

  return tracking[

    tracking.length - 1

  ];

};

/* =========================================

   TRIP STATUS

========================================= */

const getVehicleDisplayStatus = (vehicle) => {
  const latest = getLatestTracking(vehicle);
  const rawStatus = safeText(latest?.status, "Idle");

  if (rawStatus.trim().toLowerCase() !== "reached") {
    return rawStatus;
  }

  const unloadingCompleted =
    String(vehicle?.unloading?.status || "").trim().toLowerCase() === "completed";

  const lrCompleted = Boolean(
    vehicle?.lr?.number ||
    vehicle?.lr?.date ||
    vehicle?.pod?.fileName
  );

  const ewayStatus = String(vehicle?.ewayBill?.status || "").trim().toLowerCase();
  const ewayCompleted = Boolean(
    (vehicle?.ewayBill?.number || vehicle?.ewayBill?.fileName) &&
    ewayStatus !== "pending"
  );

  return unloadingCompleted && lrCompleted && ewayCompleted
    ? "Reached"
    : "Pending";
};

const getTripStatus = (trip) => {
  const vehicles = safeArray(trip?.allocatedVehicles);

  if (!vehicles.length) return "Pending";

  const statuses = vehicles.map(getVehicleDisplayStatus);
  const normalized = statuses.map((status) =>
    String(status || "").trim().toLowerCase()
  );

  if (normalized.every((status) => status === "reached")) return "Reached";
  if (normalized.some((status) => status === "breakdown")) return "Breakdown";
  if (normalized.some((status) => status === "moving")) return "Moving";
  if (normalized.some((status) => status === "stopped")) return "Stopped";
  if (normalized.some((status) => status === "pending")) return "Pending";
  return "Idle";
};

/* =========================================

   STATUS CLASS

========================================= */

const getStatusClass = (

  status

) => {

  const value =

    String(

      status || ""

    )

      .trim()

      .toLowerCase();

  if (

    value === "moving"

  ) {

    return "moving";

  }

  if (

    value === "idle"

  ) {

    return "idle";

  }

  if (

    value === "stopped"

  ) {

    return "stopped";

  }

  if (

    value === "breakdown"

  ) {

    return "breakdown";

  }

  if (

    value === "reached"

  ) {

    return "reached";

  }

  if (

    value === "confirmed"

  ) {

    return "confirmed";

  }

  return "pending";

};

/* =========================================

   MOVEMENT TYPE

========================================= */

const getMovementType = (trip) => {

  const rawMovement =

    trip?.movementType ||

    trip?.movement ||

    trip?.movementName ||

    trip?.movementCategory ||

    trip?.orderFinalization?.movementType ||

    trip?.enquiryDetails?.movementType ||

    "";

  if (rawMovement) {

    return safeText(rawMovement);

  }

  const material = String(trip?.materialType || "")

    .trim()

    .toLowerCase();

  if (

    material.includes("wtg") ||

    material.includes("blade") ||

    material.includes("nacelle") ||

    material.includes("tower")

  ) {

    return "WTG Movement";

  }

  if (

    trip?.craneMovement ||

    trip?.craneDetails ||

    trip?.craneDocument ||

    material.includes("crane")

  ) {

    return "Crane Movement";

  }

  return "-";

};

const getMovementClass = (movement) => {

  const value = String(movement || "")

    .trim()

    .toLowerCase();

  if (value.includes("crane")) return "crane";

  if (value.includes("wtg")) return "wtg";

  return "default";

};

/* =========================================

   FORMAT DATE

========================================= */

const formatDate = (

  value

) => {

  if (!value) {

    return "-";

  }

  const date =

    new Date(value);

  if (

    Number.isNaN(

      date.getTime()

    )

  ) {

    return "-";

  }

  return date.toLocaleDateString(

    "en-GB",

    {

      day: "2-digit",

      month: "short",

      year: "numeric",

    }

  );

};

/* =========================================

   COMPONENT

========================================= */

const Tripdetails = () => {

  const navigate =

    useNavigate();

  /* =====================================

     STATE

  ===================================== */

  const [

    trips,

    setTrips,

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

    refreshing,

    setRefreshing,

  ] = useState(false);

  const [movementTrip, setMovementTrip] = useState(null);

  const [movementVehicleId, setMovementVehicleId] = useState("");

  const [movementForm, setMovementForm] = useState(null);

  const [movementSaving, setMovementSaving] = useState(false);

  const [movementError, setMovementError] = useState("");

  const [movementSuccess, setMovementSuccess] = useState("");

  /* =====================================

     FETCH TRIPS

  ===================================== */

  const fetchTrips =

    useCallback(

      async (

        manualRefresh = false

      ) => {

        try {

          if (

            manualRefresh

          ) {

            setRefreshing(

              true

            );

          } else {

            setLoading(

              true

            );

          }

          setError("");

          const response =

            await fetch(

              API_URL,

              {

                method:

                  "GET",

                headers: {

                  Accept:

                    "application/json",

                },

              }

            );

          let result = {};

          try {

            result =

              await response.json();

          } catch {

            result = {};

          }

          if (!response.ok) {

            throw new Error(

              result?.message ||

              "Unable to load trips."

            );

          }

          const databaseTrips =

            extractTrips(

              result

            );

          /*

            Tracking trip list should

            contain orders that have

            actual allocated vehicles.

            The order remains stored in

            TripOrder as the single

            source of truth.

          */

          const trackingTrips =

            databaseTrips

              .map(

                normalizeTrip

              )

              .filter((trip) => {

                const stage =

                  safeText(

                    trip?.stage,

                    ""

                  )

                    .trim()

                    .toLowerCase();

                const orderPlacedStatus =

                  safeText(

                    trip?.orderPlaced?.status,

                    ""

                  )

                    .trim()

                    .toLowerCase();

                /*

                  Show the order in Tracking as soon as it has reached

                  the tracking flow, even when actual vehicle allocation

                  is still pending.

                  This intentionally does NOT depend on allocatedVehicles.

                  A trip with 0 allocated vehicles must remain visible so

                  the Tracking team can use the Allocate action.

                */

                const trackingStage =

                  stage === "tracking" ||

                  stage === "trip complete" ||

                  stage === "trip completed" ||

                  stage === "completed";

                const orderReleasedToTracking =

                  orderPlacedStatus === "completed" ||

                  orderPlacedStatus === "complete" ||

                  orderPlacedStatus === "placed" ||

                  orderPlacedStatus === "approved";

                return trackingStage || orderReleasedToTracking;

              });

          setTrips(

            trackingTrips

          );

        } catch (

        fetchError

        ) {

          console.error(

            "Fetch Trips Error:",

            fetchError

          );

          setError(

            fetchError?.message ||

            "Unable to load trips."

          );

          setTrips([]);

        } finally {

          setLoading(false);

          setRefreshing(

            false

          );

        }

      },

      []

    );

  /* =====================================

     INITIAL LOAD

  ===================================== */

  useEffect(() => {

    fetchTrips();

  }, [fetchTrips]);

  /* =====================================

     TRACKING INPUT

  ===================================== */

  const handleCreateTrip =

    () => {

      /*

        Orders are no longer created

        from Tracking.

        This button now opens Tracking

        Input where approved requirements

        can receive actual vehicles.

      */

      navigate(

        "/tracking-input"

      );

    };

  /* =====================================

     EDIT / MANAGE TRIP

  ===================================== */

  const handleEditTrip = (

    trip

  ) => {

    navigate(

      "/tracking-input",

      {

        state: {

          mode: "edit",

          tripId:

            trip.tripId,

          mongoId:

            trip._id,

          trip,

        },

      }

    );

  };

  const handleAllocateTrip = (trip) => {

    navigate("/tracking-input", {

      state: {

        mode: "allocate",

        tripId: trip.tripId,

        mongoId: trip._id,

        trip,

      },

    });

  };

  const buildMovementForm = (vehicle) => {

    const history = safeArray(vehicle?.dailyTracking);

    const latest = history.length ? history[history.length - 1] : null;

    const today = new Date();

    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const previousTodayKm =
      latest?.todayKm !== undefined &&
        latest?.todayKm !== null &&
        latest?.todayKm !== ""
        ? Number(latest.todayKm)
        : null;

    return {

      date,

      day: history.length + 1,

      yesterdayKm:
        history.length > 0 && Number.isFinite(previousTodayKm)
          ? previousTodayKm
          : "",

      todayKm: "",

      yesterdayLocation: latest?.currentLocation || "",

      currentLocation: "",

      status: "Idle",

      remarks: "",

      updatedBy: "",

      loadingStatus: vehicle?.loading?.status || "Pending",

      loadingPointInDate: vehicle?.loading?.pointInDate ? String(vehicle.loading.pointInDate).slice(0, 10) : "",

      loadingDate: vehicle?.loading?.loadingDate ? String(vehicle.loading.loadingDate).slice(0, 10) : "",

      loadingPointOutDate: vehicle?.loading?.pointOutDate ? String(vehicle.loading.pointOutDate).slice(0, 10) : "",

      loadingHaltingDays: vehicle?.loading?.haltingDays ?? 0,

      loadingRemarks: vehicle?.loading?.remarks || "",

      unloadingStatus: vehicle?.unloading?.status || "Pending",

      unloadingPointInDate: vehicle?.unloading?.pointInDate ? String(vehicle.unloading.pointInDate).slice(0, 10) : "",

      unloadingDate: vehicle?.unloading?.unloadingDate ? String(vehicle.unloading.unloadingDate).slice(0, 10) : "",

      unloadingPointOutDate: vehicle?.unloading?.pointOutDate ? String(vehicle.unloading.pointOutDate).slice(0, 10) : "",

      unloadingHaltingDays: vehicle?.unloading?.haltingDays ?? 0,

      unloadingRemarks: vehicle?.unloading?.remarks || "",

      lrNumber: vehicle?.lr?.number || "",

      lrDate: vehicle?.lr?.date ? String(vehicle.lr.date).slice(0, 10) : "",

      lrRemarks: vehicle?.lr?.remarks || "",

      podFile: null,

      ewayBillNumber: vehicle?.ewayBill?.number || "",

      ewayBillValidUpto: vehicle?.ewayBill?.validUpto ? String(vehicle.ewayBill.validUpto).slice(0, 10) : "",

      ewayBillStatus: vehicle?.ewayBill?.status || "Pending",

      ewayBillFile: null,

    };

  };

  const handleMovementTrip = (trip) => {

    const vehicles = safeArray(trip?.allocatedVehicles);

    setMovementTrip(trip);

    setMovementError("");

    setMovementSuccess("");

    if (vehicles.length) {

      const firstVehicle = vehicles[0];

      setMovementVehicleId(firstVehicle.allocationId || firstVehicle._id || "");

      setMovementForm(buildMovementForm(firstVehicle));

    } else {

      setMovementVehicleId("");

      setMovementForm(null);

    }

  };

  const closeMovementPopup = () => {

    if (movementSaving) return;

    setMovementTrip(null);

    setMovementVehicleId("");

    setMovementForm(null);

    setMovementError("");

    setMovementSuccess("");

  };

  const selectMovementVehicle = (vehicle) => {

    setMovementVehicleId(vehicle.allocationId || vehicle._id || "");

    setMovementForm(buildMovementForm(vehicle));

    setMovementError("");

    setMovementSuccess("");

  };

  const updateMovementField = (name, value) => {

    setMovementForm((previous) => ({ ...previous, [name]: value }));

  };

  const uploadMovementDocument = async ({

    mongoId,

    allocationId,

    type,

    number,

    date,

    validUpto,

    status,

    remarks,

    file,

    existingDocument,

    uploadedBy,

    requireFile = true,

  }) => {

    const hasExistingFile = Boolean(existingDocument?.fileName);

    const hasEnteredData = Boolean(

      String(number || "").trim() ||

      date ||

      validUpto ||

      String(remarks || "").trim() ||

      file ||

      hasExistingFile

    );

    if (!hasEnteredData) {

      return existingDocument || null;

    }

    if (type === "lr" && !String(number || "").trim()) {

      throw new Error("LR Number is required when saving LR.");

    }

    if (requireFile && !file && !hasExistingFile) {

      const label = type === "ewayBill" ? "E-Way Bill" : type.toUpperCase();

      throw new Error(`${label} document is required.`);

    }

    const formData = new FormData();

    formData.append("number", String(number || "").trim());

    formData.append("date", date || "");

    formData.append("validUpto", validUpto || "");

    formData.append("status", status || "Pending");

    formData.append("remarks", String(remarks || "").trim());

    formData.append("uploadedBy", String(uploadedBy || "Tracking").trim());

    if (file) {

      formData.append("document", file);

      formData.append("documentName", file.name);

    }

    const response = await fetch(

      `${API_URL}/${mongoId}/allocated-vehicles/${allocationId}/${type}`,

      {

        method: "PUT",

        body: formData,

      }

    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {

      const label = type === "ewayBill" ? "E-Way Bill" : type.toUpperCase();

      throw new Error(result?.message || `Unable to save ${label} document.`);

    }

    const updatedVehicle = safeArray(

      result?.data?.allocatedVehicles

    ).find((item) => item.allocationId === allocationId);

    return (

      updatedVehicle?.[type] || {

        ...existingDocument,

        number: String(number || "").trim(),

        date: date || null,

        validUpto: validUpto || null,

        status: status || "Pending",

        remarks: String(remarks || "").trim(),

        fileName: file?.name || existingDocument?.fileName || "",

      }

    );

  };

  const viewMovementDocument = (

    vehicle,

    type

  ) => {

    const mongoId =

      movementTrip?._id?.$oid ||

      movementTrip?._id;

    if (

      !mongoId ||

      !vehicle?.allocationId

    ) {

      return;

    }

    window.open(

      `${API_URL}/${mongoId}/allocated-vehicles/${vehicle.allocationId}/${type}/file?disposition=inline`,

      "_blank",

      "noopener,noreferrer"

    );

  };

  const saveMovement = async () => {

    if (!movementTrip || !movementForm || !movementVehicleId) return;

    const vehicle = safeArray(movementTrip.allocatedVehicles).find(
      (item) => (item.allocationId || item._id) === movementVehicleId
    );

    if (!vehicle) return;

    const history = safeArray(vehicle.dailyTracking);
    const latest = history.length ? history[history.length - 1] : null;

    const currentLocation = String(
      movementForm.currentLocation || ""
    ).trim();

    const updatedBy = String(
      movementForm.updatedBy || ""
    ).trim();

    const selectedDate = String(
      movementForm.date || ""
    ).trim();

    const yesterdayKm = Number(
      movementForm.yesterdayKm
    );

    const todayKm = Number(
      movementForm.todayKm
    );

    /*
      IMPORTANT:
      If the last saved movement is already Reached, the user may still
      need to finish Unloading / LR / POD / E-Way Bill.

      In that case we save vehicle operations + documents without forcing
      another daily movement entry.

      If the user starts entering a new movement (location/KM/updated by),
      the normal movement validation and tracking POST still run.
    */
    const latestRawStatus = String(
      latest?.status || ""
    ).trim().toLowerCase();

    const hasMovementEntryData = Boolean(
      currentLocation ||
      updatedBy ||
      movementForm.todayKm !== "" &&
      movementForm.todayKm !== null &&
      movementForm.todayKm !== undefined ||
      String(movementForm.remarks || "").trim()
    );

    const shouldSaveTracking =
      latestRawStatus !== "reached" ||
      hasMovementEntryData;

    const validateDateOrder = (label, values) => {
      const dates = values.filter(Boolean);

      for (
        let index = 1;
        index < dates.length;
        index += 1
      ) {
        if (dates[index] < dates[index - 1]) {
          return `${label} dates are not in the correct order.`;
        }
      }

      return "";
    };

    /*
      Loading / unloading validations must always run because these
      details are saved even when no new daily tracking row is created.
    */
    const loadingDateError = validateDateOrder(
      "Loading",
      [
        movementForm.loadingPointInDate,
        movementForm.loadingDate,
        movementForm.loadingPointOutDate,
      ]
    );

    if (loadingDateError) {
      setMovementError(loadingDateError);
      return;
    }

    const unloadingDateError = validateDateOrder(
      "Unloading",
      [
        movementForm.unloadingPointInDate,
        movementForm.unloadingDate,
        movementForm.unloadingPointOutDate,
      ]
    );

    if (unloadingDateError) {
      setMovementError(unloadingDateError);
      return;
    }

    if (
      movementForm.loadingStatus === "Completed" &&
      !movementForm.loadingPointOutDate
    ) {
      setMovementError(
        "Loading Point Out Date is required when loading is completed."
      );
      return;
    }

    if (
      movementForm.unloadingStatus === "Completed" &&
      !movementForm.unloadingPointOutDate
    ) {
      setMovementError(
        "Unloading Point Out Date is required when unloading is completed."
      );
      return;
    }

    /*
      Run the original movement validations only when a new movement
      record really needs to be saved.
    */
    if (shouldSaveTracking) {

      if (!selectedDate) {
        setMovementError("Movement date is required.");
        return;
      }

      if (!currentLocation) {
        setMovementError("Current location is required.");
        return;
      }

      if (!updatedBy) {
        setMovementError("Updated By is required.");
        return;
      }

      if (
        movementForm.todayKm === "" ||
        movementForm.todayKm === null ||
        movementForm.todayKm === undefined
      ) {
        setMovementError("Today KM is required.");
        return;
      }

      if (
        !Number.isFinite(yesterdayKm) ||
        yesterdayKm < 0
      ) {
        setMovementError(
          "Yesterday KM must be a valid non-negative number."
        );
        return;
      }

      if (
        !Number.isFinite(todayKm) ||
        todayKm < 0
      ) {
        setMovementError(
          "Today KM must be a valid non-negative number."
        );
        return;
      }

      if (todayKm < yesterdayKm) {
        setMovementError(
          `Today KM cannot be less than Yesterday KM (${yesterdayKm} KM).`
        );
        return;
      }

      const latestDate = latest?.date
        ? String(latest.date).slice(0, 10)
        : "";

      if (
        latestDate &&
        selectedDate <= latestDate
      ) {
        setMovementError(
          `Movement date must be after the previous update (${formatDate(
            latest.date
          )}).`
        );
        return;
      }

      if (
        history.some(
          (item) =>
            String(item?.date || "").slice(0, 10) ===
            selectedDate
        )
      ) {
        setMovementError(
          "A movement update already exists for this date."
        );
        return;
      }

    }

    const runningKm = shouldSaveTracking
      ? todayKm - yesterdayKm
      : 0;

    const payload = shouldSaveTracking
      ? {
        date: movementForm.date,
        day: history.length + 1,
        yesterdayKm,
        todayKm,
        runningKm,
        yesterdayLocation: String(
          movementForm.yesterdayLocation || ""
        ).trim(),
        currentLocation,
        status: movementForm.status || "Idle",
        remarks: String(
          movementForm.remarks || ""
        ).trim(),
        updatedBy,
      }
      : null;

    try {

      setMovementSaving(true);
      setMovementError("");
      setMovementSuccess("");

      const mongoId =
        movementTrip._id?.$oid ||
        movementTrip._id;

      /*
        ALWAYS save Loading / Unloading.
        This is the important fix for a reached vehicle where the user
        completes unloading and then uploads the remaining documents.
      */
      const allocationPayload = {

        vehicleNumber: String(
          vehicle.vehicleNumber || ""
        )
          .trim()
          .toUpperCase(),

        driver: {
          name: String(
            vehicle?.driver?.name || ""
          ).trim(),
          contactNumber: String(
            vehicle?.driver?.contactNumber || ""
          ).trim(),
        },

        escort: {
          vehicleNumber: String(
            vehicle?.escort?.vehicleNumber || ""
          )
            .trim()
            .toUpperCase(),
          name: String(
            vehicle?.escort?.name || ""
          ).trim(),
          contactNumber: String(
            vehicle?.escort?.contactNumber || ""
          ).trim(),
        },

        supervisor: {
          name: String(
            vehicle?.supervisor?.name || ""
          ).trim(),
          contactNumber: String(
            vehicle?.supervisor?.contactNumber || ""
          ).trim(),
        },

        loading: {
          status:
            movementForm.loadingStatus ||
            "Pending",
          pointInDate:
            movementForm.loadingPointInDate ||
            null,
          loadingDate:
            movementForm.loadingDate ||
            null,
          pointOutDate:
            movementForm.loadingPointOutDate ||
            null,
          haltingDays: Number(
            movementForm.loadingHaltingDays || 0
          ),
          remarks: String(
            movementForm.loadingRemarks || ""
          ).trim(),
        },

        unloading: {
          status:
            movementForm.unloadingStatus ||
            "Pending",
          pointInDate:
            movementForm.unloadingPointInDate ||
            null,
          unloadingDate:
            movementForm.unloadingDate ||
            null,
          pointOutDate:
            movementForm.unloadingPointOutDate ||
            null,
          haltingDays: Number(
            movementForm.unloadingHaltingDays || 0
          ),
          remarks: String(
            movementForm.unloadingRemarks || ""
          ).trim(),
        },

      };

      const allocationResponse = await fetch(
        `${API_URL}/${mongoId}/allocated-vehicles/${vehicle.allocationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            allocationPayload
          ),
        }
      );

      const allocationResult =
        await allocationResponse
          .json()
          .catch(() => ({}));

      if (!allocationResponse.ok) {
        throw new Error(
          allocationResult?.message ||
          "Unable to update loading / unloading details."
        );
      }

      /*
        Only create a daily tracking row when this is an actual new
        movement update. A reached vehicle can therefore save only
        operations/documents without Current Location / KM / Updated By.
      */
      if (shouldSaveTracking) {

        const response = await fetch(
          `${API_URL}/${mongoId}/allocated-vehicles/${vehicle.allocationId}/tracking`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "Unable to save movement."
          );
        }

      }

      /*
        Documents are independent from daily tracking.
        Keep the existing upload endpoints and validation behavior.
      */
      const savedLr =
        await uploadMovementDocument({
          mongoId,
          allocationId:
            vehicle.allocationId,
          type: "lr",
          number:
            movementForm.lrNumber,
          date:
            movementForm.lrDate,
          remarks:
            movementForm.lrRemarks,
          file: null,
          existingDocument:
            vehicle?.lr,
          uploadedBy:
            movementForm.updatedBy ||
            "Tracking",
          requireFile: false,
        });

      const savedPod =
        await uploadMovementDocument({
          mongoId,
          allocationId:
            vehicle.allocationId,
          type: "pod",
          file:
            movementForm.podFile,
          existingDocument:
            vehicle?.pod,
          uploadedBy:
            movementForm.updatedBy ||
            "Tracking",
          requireFile: true,
        });

      const savedEwayBill =
        await uploadMovementDocument({
          mongoId,
          allocationId:
            vehicle.allocationId,
          type: "ewayBill",
          number:
            movementForm.ewayBillNumber,
          validUpto:
            movementForm.ewayBillValidUpto,
          status:
            movementForm.ewayBillStatus,
          file: null,
          existingDocument:
            vehicle?.ewayBill,
          uploadedBy:
            movementForm.updatedBy ||
            "Tracking",
          requireFile: false,
        });

      /*
        Build the selected vehicle locally with the exact values just
        saved so the popup does not jump back to old Pending data.
      */
      const nextVehicle = {

        ...vehicle,

        loading:
          allocationPayload.loading,

        unloading:
          allocationPayload.unloading,

        lr:
          savedLr ||
          vehicle?.lr ||
          {},

        pod:
          savedPod ||
          vehicle?.pod ||
          {},

        ewayBill:
          savedEwayBill ||
          vehicle?.ewayBill ||
          {},

        dailyTracking:
          shouldSaveTracking && payload
            ? [
              ...safeArray(
                vehicle.dailyTracking
              ),
              payload,
            ]
            : safeArray(
              vehicle.dailyTracking
            ),

      };

      /*
        Update the popup immediately before/while the main trip list is
        refreshed from the server.
      */
      setMovementTrip((previous) => ({

        ...previous,

        allocatedVehicles:
          safeArray(
            previous?.allocatedVehicles
          ).map((item) =>
            (item.allocationId ||
              item._id) ===
              movementVehicleId
              ? nextVehicle
              : item
          ),

      }));

      setMovementForm(
        buildMovementForm(nextVehicle)
      );

      setMovementSuccess(
        shouldSaveTracking
          ? `Movement updated for ${vehicle.vehicleNumber ||
          "vehicle"
          }.`
          : `Loading, unloading and documents updated for ${vehicle.vehicleNumber ||
          "vehicle"
          }.`
      );

      /*
        Refresh the main Tracking page data after the local popup state
        has been updated.
      */
      await fetchTrips(true);

    } catch (saveError) {

      setMovementError(
        saveError?.message ||
        "Unable to save movement."
      );

    } finally {

      setMovementSaving(false);

    }

  };

  const handleBack =

    () => {

      navigate(

        "/tracking"

      );

    };

  /* =====================================

     RENDER

  ===================================== */

  return (

    <main className="trip-list-page">

      {/* =================================

          TOP ACTION BAR

      ================================= */}

      <div className="trip-page-actions">

        <button

          type="button"

          className="trip-back-button"

          onClick={

            handleBack

          }

        >

          <ArrowLeft

            size={16}

          />

          <span>

            Back to Tracking

          </span>

        </button>

      </div>

      {/* =================================

          PAGE HEADING

      ================================= */}

      <header className="trip-page-header">

        <div>

          <span className="trip-page-eyebrow">

            FLEET OPERATIONS

          </span>

          <h1>

            Trip List

          </h1>

          <p>

            View and manage all

            vehicle tracking trips.

          </p>

        </div>

        <div className="trip-page-header-actions">

          <span className="trip-total-badge">

            <Truck

              size={14}

            />

            {trips.length}

            {trips.length === 1

              ? " Trip"

              : " Trips"}

          </span>

          <button

            type="button"

            className="trip-refresh-button"

            disabled={

              refreshing

            }

            onClick={() =>

              fetchTrips(true)

            }

            aria-label="Refresh trips"

          >

            <RefreshCw

              size={15}

              className={

                refreshing

                  ? "spin"

                  : ""

              }

            />

          </button>

        </div>

      </header>

      {/* =================================

          ERROR

      ================================= */}

      {error && (

        <div className="trip-page-error">

          {error}

        </div>

      )}

      {/* =================================

          LIST CARD

      ================================= */}

      <section className="trip-table-card">

        <div className="trip-table-header">

          <div>

            <h2>

              All Trips

            </h2>

            <p>

              Complete trip and

              consignment overview.

            </p>

          </div>

        </div>

        {/* =============================

            DESKTOP COLUMN TITLES

        ============================= */}

        <div className="trip-list-column-head">

          <span>

            Trip

          </span>

          <span>

            Customer

          </span>

          <span>

            Material

          </span>

          <span>

            Movement

          </span>

          <span>

            Route

          </span>

          <span>

            Vehicles

          </span>

          <span>

            Status

          </span>

          <span>

            Created

          </span>

          <span className="trip-action-heading">

            Action

          </span>

        </div>

        {/* =============================

            BODY

        ============================= */}

        <div className="trip-full-list">

          {loading ? (

            <div className="trip-page-loading">

              <RefreshCw

                size={20}

                className="spin"

              />

              <span>

                Loading trips...

              </span>

            </div>

          ) : trips.length >

            0 ? (

            trips.map(

              (

                trip,

                index

              ) => {

                const allocatedVehicleCount =

                  safeArray(

                    trip

                      .allocatedVehicles

                  ).length;

                const requirementVehicleCount =

                  safeArray(

                    trip?.vehicleRequirements

                  ).reduce(

                    (total, requirement) => {

                      const quantity = Number(

                        requirement?.quantity ??

                        requirement?.qty ??

                        requirement?.requiredQuantity ??

                        0

                      );

                      return (

                        total +

                        (Number.isFinite(quantity)

                          ? quantity

                          : 0)

                      );

                    },

                    0

                  );

                const requiredVehicleCount =

                  requirementVehicleCount > 0

                    ? requirementVehicleCount

                    : Number(

                      trip?.totalVehicles || 0

                    );

                const pendingVehicleCount =

                  Math.max(

                    requiredVehicleCount -

                    allocatedVehicleCount,

                    0

                  );

                const tripStatus =

                  getTripStatus(

                    trip

                  );

                const statusClass =

                  getStatusClass(

                    tripStatus

                  );

                const movementType =

                  getMovementType(

                    trip

                  );

                const movementClass =

                  getMovementClass(

                    movementType

                  );

                return (

                  <article

                    key={

                      trip.id

                    }

                    className="trip-full-row"

                  >

                    {/* =====================

                        TRIP

                    ===================== */}

                    <div className="trip-row-main">

                      <span className="trip-mobile-label">

                        Trip

                      </span>

                      <div className="trip-id-box">

                        <div className="trip-id-icon">

                          <Route

                            size={

                              16

                            }

                          />

                        </div>

                        <div>

                          <strong>

                            {safeText(

                              trip.tripId

                            )}

                          </strong>

                          <small>

                            #

                            {index +

                              1}

                          </small>

                        </div>

                      </div>

                    </div>

                    {/* =====================

                        CUSTOMER

                    ===================== */}

                    <div className="trip-row-cell">

                      <span className="trip-mobile-label">

                        Customer

                      </span>

                      <div className="trip-cell-with-icon">

                        <UserRound

                          size={14}

                        />

                        <strong>

                          {safeText(

                            trip.customer

                          )}

                        </strong>

                      </div>

                    </div>

                    {/* =====================

                        MATERIAL

                    ===================== */}

                    <div className="trip-row-cell">

                      <span className="trip-mobile-label">

                        Material

                      </span>

                      <div className="trip-cell-with-icon">

                        <Package

                          size={14}

                        />

                        <span>

                          {safeText(

                            trip

                              .materialType

                          )}

                        </span>

                      </div>

                    </div>

                    {/* =====================

                        MOVEMENT

                    ===================== */}

                    <div className="trip-row-cell trip-movement-type-cell">

                      <span className="trip-mobile-label">

                        Movement

                      </span>

                      <span

                        className={`trip-movement-type-badge ${movementClass}`}

                        title={movementType}

                      >

                        <Navigation size={12} />

                        <span>

                          {movementType}

                        </span>

                      </span>

                    </div>

                    {/* =====================

                        ROUTE

                    ===================== */}

                    <div className="trip-row-cell trip-route-cell">

                      <span className="trip-mobile-label">

                        Route

                      </span>

                      <div className="trip-row-route">

                        <MapPin

                          size={14}

                        />

                        <span>

                          {safeText(

                            trip.origin

                          )}

                        </span>

                        <ChevronRight

                          size={13}

                        />

                        <span>

                          {safeText(

                            trip

                              .destination

                          )}

                        </span>

                      </div>

                    </div>

                    {/* =====================

                        VEHICLES

                    ===================== */}

                    <div className="trip-row-cell">

                      <span className="trip-mobile-label">

                        Vehicles

                      </span>

                      <span className="trip-row-vehicle-count">

                        <Truck

                          size={14}

                        />

                        {allocatedVehicleCount}

                        /

                        {requiredVehicleCount}

                      </span>

                      {pendingVehicleCount > 0 && (

                        <small className="trip-row-vehicle-pending">

                          {pendingVehicleCount} Pending

                        </small>

                      )}

                    </div>

                    {/* =====================

                        STATUS

                    ===================== */}

                    <div className="trip-row-cell">

                      <span className="trip-mobile-label">

                        Status

                      </span>

                      <span

                        className={`trip-status-badge ${statusClass}`}

                      >

                        {tripStatus}

                      </span>

                    </div>

                    {/* =====================

                        CREATED DATE

                    ===================== */}

                    <div className="trip-row-cell">

                      <span className="trip-mobile-label">

                        Created

                      </span>

                      <div className="trip-date-cell">

                        <CalendarDays

                          size={13}

                        />

                        <span>

                          {formatDate(

                            trip

                              .createdAt

                          )}

                        </span>

                      </div>

                    </div>

                    {/* =====================

                        MANAGE

                    ===================== */}

                    <div className="trip-row-actions">

                      <span className="trip-mobile-label">

                        Action

                      </span>

                      <div className="trip-action-buttons">

                        <button

                          type="button"

                          className="trip-action-button allocate"

                          onClick={() => handleAllocateTrip(trip)}

                          title="Allocate Vehicle"

                        >

                          <Truck size={13} />

                          <span>Allocate</span>

                        </button>

                        <button

                          type="button"

                          className="trip-action-button movement"

                          onClick={() => handleMovementTrip(trip)}

                          title="Update Movement"

                        >

                          <Navigation size={13} />

                          <span>Movement</span>

                        </button>

                      </div>

                    </div>

                  </article>

                );

              }

            )

          ) : (

            <div className="trip-empty-state">

              <div className="trip-empty-icon">

                <Truck

                  size={24}

                />

              </div>

              <strong>

                No Trips Found

              </strong>

              <p>

                Orders will appear

                here after they are

                placed and released

                to Tracking.

              </p>

              <button

                type="button"

                onClick={

                  handleCreateTrip

                }

              >

                <Plus

                  size={15}

                />

                Tracking Input

              </button>

            </div>

          )}

        </div>

      </section>

      {movementTrip && (

        <div

          className="trip-movement-overlay"

          role="dialog"

          aria-modal="true"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget) closeMovementPopup();

          }}

        >

          <div className="trip-movement-modal">

            <header className="trip-movement-head">

              <div className="trip-movement-title">

                <span className="trip-movement-title-icon"><Navigation size={18} /></span>

                <div>

                  <small>VEHICLE MOVEMENT</small>

                  <h2>{safeText(movementTrip.tripId)}</h2>

                  <p>{safeText(movementTrip.origin)} → {safeText(movementTrip.destination)}</p>

                </div>

              </div>

              <button type="button" className="trip-movement-close" onClick={closeMovementPopup} aria-label="Close">

                <X size={18} />

              </button>

            </header>

            <div className="trip-movement-body">

              {movementError && <div className="trip-movement-alert error">{movementError}</div>}

              {movementSuccess && <div className="trip-movement-alert success">{movementSuccess}</div>}

              {safeArray(movementTrip.allocatedVehicles).length === 0 ? (

                <div className="trip-movement-empty">No allocated vehicles are available for this trip.</div>

              ) : (

                <>

                  <div className="trip-movement-vehicle-tabs">

                    {safeArray(movementTrip.allocatedVehicles).map((vehicle, index) => {

                      const id = vehicle.allocationId || vehicle._id || `vehicle-${index}`;

                      const latest = getLatestTracking(vehicle);

                      return (

                        <button

                          type="button"

                          key={id}

                          className={`trip-movement-vehicle-tab ${movementVehicleId === id ? "active" : ""}`}

                          onClick={() => selectMovementVehicle(vehicle)}

                        >

                          <Truck size={14} />

                          <span>

                            <strong>{safeText(vehicle.vehicleNumber, `Vehicle ${index + 1}`)}</strong>
                            {safeArray(vehicle.replacementHistory).length > 0 && (
                              <em className="trip-vehicle-replaced-badge">
                                Replaced {vehicle.replacementCount || vehicle.replacementHistory.length}
                              </em>
                            )}

                            <small>{getVehicleDisplayStatus(vehicle)}</small>

                          </span>

                        </button>

                      );

                    })}

                  </div>

                  {(() => {

                    const vehicle = safeArray(movementTrip.allocatedVehicles).find(

                      (item) => (item.allocationId || item._id) === movementVehicleId

                    );

                    if (!vehicle || !movementForm) return null;

                    const latest = getLatestTracking(vehicle);

                    const unloadingEnabled =
                      String(latest?.status || "").trim().toLowerCase() === "reached" ||
                      String(movementForm.status || "").trim().toLowerCase() === "reached";

                    const history = safeArray(vehicle.dailyTracking).slice().reverse();

                    return (

                      <>

                        <section className="trip-movement-summary">

                          <div><span>Vehicle</span><strong><Truck size={13} />{safeText(vehicle.vehicleNumber)}</strong></div>

                          <div><span>Current Location</span><strong><MapPin size={13} />{safeText(latest?.currentLocation)}</strong></div>

                          <div><span>Running KM</span><strong><Route size={13} />{latest?.runningKm ?? 0} KM</strong></div>

                          <div><span>Status</span><strong>{getVehicleDisplayStatus(vehicle)}</strong></div>

                          <div><span>Driver</span><strong><UserRound size={13} />{safeText(vehicle?.driver?.name)}</strong></div>

                        </section>

                        <section className="trip-movement-form-card">

                          <div className="trip-movement-section-title">

                            <div><small>DAILY TRACKING</small><h3>Add Movement Details</h3></div>

                            <span>Day {movementForm.day}</span>

                          </div>

                          <div className="trip-movement-form-grid">

                            <label><span>Date</span><input type="date" value={movementForm.date} onChange={(e) => updateMovementField("date", e.target.value)} /></label>

                            <label><span>Day</span><input type="number" min="1" value={movementForm.day} readOnly /></label>

                            <label>
                              <span>{movementForm.day === 1 ? "Starting Odometer KM *" : "Yesterday KM"}</span>
                              <input
                                type="number"
                                min="0"
                                value={movementForm.yesterdayKm}
                                onChange={(e) => updateMovementField("yesterdayKm", e.target.value)}
                                readOnly={movementForm.day > 1}
                                placeholder={movementForm.day === 1 ? "Enter vehicle odometer KM" : ""}
                              />
                            </label>

                            <label><span>Today KM *</span><input type="number" min={movementForm.yesterdayKm || 0} value={movementForm.todayKm} onChange={(e) => updateMovementField("todayKm", e.target.value)} placeholder="Enter cumulative KM" /></label>

                            <label><span>Yesterday Location</span><input value={movementForm.yesterdayLocation} onChange={(e) => updateMovementField("yesterdayLocation", e.target.value)} /></label>

                            <label><span>Current Location *</span><input value={movementForm.currentLocation} onChange={(e) => updateMovementField("currentLocation", e.target.value)} placeholder="Enter current location" /></label>

                            <label><span>Status</span><select value={movementForm.status} onChange={(e) => updateMovementField("status", e.target.value)}><option>Idle</option><option>Moving</option><option>Stopped</option><option>Breakdown</option><option>Reached</option></select></label>

                            <label><span>Updated By *</span><input value={movementForm.updatedBy} onChange={(e) => updateMovementField("updatedBy", e.target.value)} placeholder="Name" /></label>

                            <label><span>Remarks</span><input value={movementForm.remarks} onChange={(e) => updateMovementField("remarks", e.target.value)} placeholder="Movement remarks" /></label>

                          </div>

                        </section>

                        <section className="trip-movement-operation-grid">

                          <div className="trip-movement-operation-card">

                            <div className="trip-movement-operation-head">

                              <div><small>VEHICLE OPERATION</small><h3>Loading Details</h3></div>

                              <span>{movementForm.loadingStatus}</span>

                            </div>

                            <div className="trip-movement-operation-fields">

                              <label><span>Status</span>

                                <select value={movementForm.loadingStatus} onChange={(e) => updateMovementField("loadingStatus", e.target.value)}>

                                  <option>Pending</option><option>In Progress</option><option>Completed</option>

                                </select>

                              </label>

                              <label><span>Point In Date</span><input type="date" value={movementForm.loadingPointInDate} onChange={(e) => updateMovementField("loadingPointInDate", e.target.value)} /></label>

                              <label><span>Loading Date</span><input type="date" value={movementForm.loadingDate} onChange={(e) => updateMovementField("loadingDate", e.target.value)} /></label>

                              <label><span>Point Out Date</span><input type="date" value={movementForm.loadingPointOutDate} onChange={(e) => updateMovementField("loadingPointOutDate", e.target.value)} /></label>

                              <label><span>Halting Days</span><input type="number" min="0" value={movementForm.loadingHaltingDays} onChange={(e) => updateMovementField("loadingHaltingDays", e.target.value)} /></label>

                              <label className="remarks"><span>Remarks</span><input value={movementForm.loadingRemarks} onChange={(e) => updateMovementField("loadingRemarks", e.target.value)} placeholder="Loading Details remarks" /></label>

                            </div>

                          </div>

                          <div className="trip-movement-operation-card">

                            <div className="trip-movement-operation-head">

                              <div><small>VEHICLE OPERATION</small><h3>Unloading Details</h3></div>

                              <span>{movementForm.unloadingStatus}</span>

                            </div>

                            <div className="trip-movement-operation-fields">

                              <label><span>Status</span>

                                <select value={movementForm.unloadingStatus} disabled={!unloadingEnabled} onChange={(e) => updateMovementField("unloadingStatus", e.target.value)}>

                                  <option>Pending</option><option>In Progress</option><option>Completed</option>

                                </select>

                              </label>

                              <label><span>Point In Date</span><input type="date" disabled={!unloadingEnabled} value={movementForm.unloadingPointInDate} onChange={(e) => updateMovementField("unloadingPointInDate", e.target.value)} /></label>

                              <label><span>Unloading Date</span><input type="date" disabled={!unloadingEnabled} value={movementForm.unloadingDate} onChange={(e) => updateMovementField("unloadingDate", e.target.value)} /></label>

                              <label><span>Point Out Date</span><input type="date" disabled={!unloadingEnabled} value={movementForm.unloadingPointOutDate} onChange={(e) => updateMovementField("unloadingPointOutDate", e.target.value)} /></label>

                              <label><span>Halting Days</span><input type="number" min="0" disabled={!unloadingEnabled} value={movementForm.unloadingHaltingDays} onChange={(e) => updateMovementField("unloadingHaltingDays", e.target.value)} /></label>

                              <label className="remarks"><span>Remarks</span><input disabled={!unloadingEnabled} value={movementForm.unloadingRemarks} onChange={(e) => updateMovementField("unloadingRemarks", e.target.value)} placeholder="Unloading Details remarks" /></label>

                            </div>

                          </div>

                        </section>

                        <section className="trip-movement-documents">
                          <div className="trip-movement-section-title">
                            <div>
                              <small>TRIP DOCUMENTS</small>
                              <h3>LR, E-Way Bill & POD Documents</h3>
                            </div>
                            <span>Selected Vehicle</span>
                          </div>

                          <div className="trip-movement-document-grid">
                            <div className="trip-movement-document-card">
                              <div className="trip-movement-document-head">
                                <span className="trip-movement-document-icon">
                                  <FileText size={16} />
                                </span>
                                <div>
                                  <small>LORRY RECEIPT</small>
                                  <h4>LR Details</h4>
                                </div>
                                <b className={movementForm.lrNumber ? "uploaded" : ""}>
                                  {movementForm.lrNumber ? "Entered" : "Pending"}
                                </b>
                              </div>

                              <div className="trip-movement-document-fields">
                                <label>
                                  <span>LR Number *</span>
                                  <input
                                    value={movementForm.lrNumber}
                                    onChange={(e) => updateMovementField("lrNumber", e.target.value)}
                                    placeholder="Enter LR number"
                                  />
                                </label>
                                <label>
                                  <span>LR Date</span>
                                  <input
                                    type="date"
                                    value={movementForm.lrDate}
                                    onChange={(e) => updateMovementField("lrDate", e.target.value)}
                                  />
                                </label>
                                <label>
                                  <span>Remarks</span>
                                  <input
                                    value={movementForm.lrRemarks}
                                    onChange={(e) => updateMovementField("lrRemarks", e.target.value)}
                                    placeholder="Enter remarks"
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="trip-movement-document-card">
                              <div className="trip-movement-document-head">
                                <span className="trip-movement-document-icon">
                                  <FileText size={16} />
                                </span>
                                <div>
                                  <small>E-WAY BILL</small>
                                  <h4>E-Way Bill Details</h4>
                                </div>
                                <b className={movementForm.ewayBillNumber ? "uploaded" : ""}>
                                  {movementForm.ewayBillNumber ? movementForm.ewayBillStatus : "Pending"}
                                </b>
                              </div>

                              <div className="trip-movement-document-fields">
                                <label>
                                  <span>E-Way Bill Number</span>
                                  <input
                                    value={movementForm.ewayBillNumber}
                                    onChange={(e) => updateMovementField("ewayBillNumber", e.target.value)}
                                    placeholder="Enter E-Way Bill number"
                                  />
                                </label>
                                <label>
                                  <span>Valid Upto</span>
                                  <input
                                    type="date"
                                    value={movementForm.ewayBillValidUpto}
                                    onChange={(e) => updateMovementField("ewayBillValidUpto", e.target.value)}
                                  />
                                </label>
                                <label>
                                  <span>Status</span>
                                  <select
                                    value={movementForm.ewayBillStatus}
                                    onChange={(e) => updateMovementField("ewayBillStatus", e.target.value)}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                </label>
                              </div>
                            </div>

                            <div className="trip-movement-document-card trip-pod-full-row">
                              <div className="trip-movement-document-head">
                                <span className="trip-movement-document-icon">
                                  <FileText size={16} />
                                </span>
                                <div>
                                  <small>PROOF OF DELIVERY</small>
                                  <h4>POD Document</h4>
                                </div>
                                <b className={vehicle?.pod?.fileName || movementForm.podFile ? "uploaded" : ""}>
                                  {vehicle?.pod?.fileName || movementForm.podFile ? "Uploaded" : "Pending"}
                                </b>
                              </div>

                              <div className="trip-pod-upload-row">
                                <div className="trip-pod-file-info">
                                  <span className="trip-pod-file-icon">
                                    <FileText size={16} />
                                  </span>
                                  <div>
                                    <small>POD FILE</small>
                                    <strong title={movementForm.podFile?.name || vehicle?.pod?.fileName || ""}>
                                      {movementForm.podFile?.name || vehicle?.pod?.fileName || "No POD file selected"}
                                    </strong>
                                  </div>
                                </div>

                                <div className="trip-pod-actions">
                                  <label className="trip-document-upload-button">
                                    <Upload size={13} />
                                    {vehicle?.pod?.fileName ? "Replace" : "Choose File"}
                                    <input
                                      type="file"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      onChange={(e) => updateMovementField("podFile", e.target.files?.[0] || null)}
                                    />
                                  </label>
                                  {vehicle?.pod?.fileName && (
                                    <button
                                      type="button"
                                      className="trip-document-view-button"
                                      onClick={() => viewMovementDocument(vehicle, "pod")}
                                    >
                                      <Eye size={13} />
                                      View
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        <section className="trip-movement-history">

                          <div className="trip-movement-section-title"><div><small>HISTORY</small><h3>Movement History</h3></div><span>{history.length} Updates</span></div>

                          {history.length ? (

                            <div className="trip-movement-history-table">

                              <div className="trip-movement-history-head"><span>Date</span><span>Day</span><span>Location</span><span>KM</span><span>Status</span><span>Remarks</span></div>

                              {history.map((item, index) => (

                                <div className="trip-movement-history-row" key={`${item.date || "movement"}-${index}`}>

                                  <span>{formatDate(item.date)}</span><span>Day {item.day ?? "-"}</span><span>{safeText(item.currentLocation)}</span><span>{item.runningKm ?? 0} KM</span><span><b className={`trip-history-status ${getStatusClass(item.status)}`}>{safeText(item.status, "Idle")}</b></span><span>{safeText(item.remarks)}</span>

                                </div>

                              ))}

                            </div>

                          ) : <div className="trip-movement-empty small">No movement history yet.</div>}

                        </section>

                        {/* =========================================
                      VEHICLE REPLACEMENT HISTORY
                  ========================================= */}
                        <section className="movement-section movement-replacement-history-section">
                          <div className="movement-section-header">
                            <div>
                              <span className="movement-section-eyebrow">HISTORY</span>
                              <h3>Vehicle Replacement History</h3>
                            </div>

                            <span className="movement-history-count">
                              {safeArray(
                                safeArray(movementTrip?.allocatedVehicles).find(
                                  (item) =>
                                    (item.allocationId || item._id) ===
                                    movementVehicleId
                                )?.replacementHistory
                              ).length}{" "}
                              Replacements
                            </span>
                          </div>

                          {(() => {
                            const selectedVehicle = safeArray(
                              movementTrip?.allocatedVehicles
                            ).find(
                              (item) =>
                                (item.allocationId || item._id) ===
                                movementVehicleId
                            );

                            const replacementHistory = safeArray(
                              selectedVehicle?.replacementHistory
                            )
                              .slice()
                              .reverse();

                            if (!replacementHistory.length) {
                              return (
                                <div className="movement-replacement-empty">
                                  <RefreshCw size={16} />
                                  <span>No vehicle replacement history.</span>
                                </div>
                              );
                            }

                            return (
                              <div className="movement-replacement-table-wrap">
                                <div className="movement-replacement-table-head">
                                  <span>DATE</span>
                                  <span>PREVIOUS VEHICLE</span>
                                  <span>REPLACED WITH</span>
                                  <span>SOURCE</span>
                                  <span>REASON</span>
                                  <span>REPLACED BY</span>
                                  <span>REMARKS</span>
                                </div>

                                <div className="movement-replacement-table-body">
                                  {replacementHistory.map((item, index) => (
                                    <div
                                      className="movement-replacement-table-row"
                                      key={
                                        item?.replacementId ||
                                        `${selectedVehicle?.allocationId}-replacement-${index}`
                                      }
                                    >
                                      <span>
                                        {item?.replacedAt
                                          ? formatDate(item.replacedAt)
                                          : "-"}
                                      </span>

                                      <strong className="movement-replacement-old-vehicle">
                                        {safeText(item?.oldVehicleNumber)}
                                      </strong>

                                      <strong className="movement-replacement-new-vehicle">
                                        {safeText(item?.newVehicleNumber)}
                                      </strong>

                                      <span>
                                        {safeText(
                                          item?.replacementSource || item?.source
                                        )}
                                      </span>

                                      <span>{safeText(item?.reason)}</span>

                                      <span>{safeText(item?.replacedBy)}</span>

                                      <span>{safeText(item?.remarks)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </section>

                      </>

                    );

                  })()}

                </>

              )}

            </div>

            <footer className="trip-movement-footer">

              <button type="button" className="trip-movement-cancel" onClick={closeMovementPopup}>Close</button>

              {movementForm && (

                <button type="button" className="trip-movement-save" onClick={saveMovement} disabled={movementSaving}>

                  <Save size={15} />{movementSaving ? "Saving..." : "Save Movement"}

                </button>

              )}

            </footer>

          </div>

        </div>

      )}

    </main>

  );

};

export default Tripdetails;
