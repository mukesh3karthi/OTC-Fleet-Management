import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../pagescss/keyaccount.css";

import Tripcreatemodal from "../keyaccount/Tripcreatemodal";
import Lifecyclemodal from "../keyaccount/Lifecyclemodal";


/* =========================================================
   VEHICLE TYPES
========================================================= */

const PRIMARY_VEHICLE_TYPES = [
  "Open Truck",
  "Trailer",
  "Container Truck",
  "Flatbed",
  "Low Bed Trailer",
  "Hydraulic Axle Trailer",
  "Multi Axle Trailer",
  "Tempo / LCV",
  "Pickup Truck",
  "Crane Mounted Truck",
];


const EMPTY_WTG_VEHICLE = {
  vehicleType: "",
  configurationModel: "",
  movementClassification: "",
  quantity: "1",
  weight: "",
  length: "",
  height: "",
  width: "",
};


const TRIP_ID_YEAR =
  new Date().getFullYear();


/* =========================================================
   EMPTY TRIP FORM
========================================================= */

const createEmptyTripForm = (
  tripId = ""
) => ({
  movementType: "",

  client: "",
  companyName: "",
  clientContact: "",
  clientEmail: "",
  assignedKam: "",

  tripId,

  enquiryDate: "",
  placementDate: "",
  deploymentDate: "",

  siteLocation: "",
  period: "",
  dieselScope: "",
  totalQuantity: "",

  origin: "",
  destination: "",
  estimatedDistance: "",

  cargo: "",

  weight: "",
  length: "",
  height: "",
  width: "",

  remark: "",

  requiredVehicles: "",
  primaryVehicleType: "",

  vehicles: [
    {
      ...EMPTY_WTG_VEHICLE,
    },
  ],
});


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

const extractTripList = (
  payload
) => {

  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    Array.isArray(
      payload?.data
    )
  ) {
    return payload.data;
  }

  if (
    Array.isArray(
      payload?.trips
    )
  ) {
    return payload.trips;
  }

  return [];
};


const extractTrip = (
  payload
) =>
  payload?.data ||
  payload?.trip ||
  payload;


const toDateInput = (
  value
) => {

  if (!value) {
    return "";
  }

  const text =
    String(value);

  return text.length >= 10
    ? text.slice(0, 10)
    : text;
};


const numberText = (
  value
) => {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const match =
    String(value).match(
      /-?\d+(?:\.\d+)?/
    );

  return match
    ? match[0]
    : "";
};


/* =========================================================
   STAGE CLASS
========================================================= */

const getStageClass = (
  stage
) =>
  `stage-badge stage-${String(
    stage || ""
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )}`;


/* =========================================================
   APPROVAL / ORDER STATUS
========================================================= */

const normalizeApprovalStatus = (
  value
) => {

  const status =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  if (
    [
      "approved",
      "approve",
      "accepted",
    ].includes(status)
  ) {
    return "Approved";
  }

  if (
    [
      "rejected",
      "reject",
      "declined",
    ].includes(status)
  ) {
    return "Rejected";
  }

  return "Pending";
};


const getOrderStatusClass = (
  status
) => {

  const normalized =
    normalizeApprovalStatus(
      status
    );

  return `order-status-badge order-status-${normalized.toLowerCase()}`;
};


/* =========================================================
   NEXT TRIP ID
========================================================= */

const getNextTripId = (
  orders
) => {

  const prefix =
    `${TRIP_ID_YEAR}-`;

  const highestSequence =
    orders.reduce(
      (
        highest,
        order
      ) => {

        const tripId =
          String(
            order.tripId ||
            order.id ||
            ""
          ).trim();

        if (
          !tripId.startsWith(
            prefix
          )
        ) {
          return highest;
        }

        const sequence =
          Number(
            tripId.slice(
              prefix.length
            )
          );

        return (
          Number.isInteger(
            sequence
          ) &&
          sequence > highest
        )
          ? sequence
          : highest;
      },
      0
    );

  return `${TRIP_ID_YEAR}-${
    highestSequence + 1
  }`;
};


/* =========================================================
   DATABASE -> UI
========================================================= */

const mapDbTripToOrder = (
  trip = {}
) => {

  const vehicles =
    Array.isArray(
      trip.vehicles
    )
      ? trip.vehicles
      : [];

  const firstVehicle =
    vehicles[0] || {};


  /*
   * Approval Management can save any ONE
   * of these fields.
   *
   * Preferred field:
   * approvalStatus
   *
   * Supported fallbacks:
   * orderStatus
   * approvalDecision
   * approval?.status
   *
   * If there is no value:
   * Pending
   */

  const approvalStatus =
    normalizeApprovalStatus(
      trip.approvalStatus ||
      trip.orderStatus ||
      trip.approvalDecision ||
      trip.approval?.status ||
      "Pending"
    );


  return {

    ...trip,

    _id:
      trip._id,

    id:
      trip.tripId ||
      trip.id ||
      trip._id,

    tripId:
      trip.tripId ||
      trip.id ||
      "",

    movementType:
      trip.movementType ||
      "",

    companyName:
      trip.companyName ||
      "",

    client:
      trip.client ||
      trip.customer ||
      "",

    customer:
      trip.customer ||
      trip.client ||
      "",

    clientContact:
      trip.clientContact ||
      trip.clientPhone ||
      trip.clientContactPerson ||
      "",

    clientPhone:
      trip.clientPhone ||
      trip.clientContact ||
      "",

    clientEmail:
      trip.clientEmail ||
      "",

    assignedKam:
      trip.assignedKam ||
      "",

    cargo:
      trip.cargo ||
      trip.materialType ||
      "",

    materialType:
      trip.materialType ||
      trip.cargo ||
      "",

    enquiryDate:
      toDateInput(
        trip.enquiryDate
      ),

    placementDate:
      toDateInput(
        trip.placementDate
      ),

    deploymentDate:
      toDateInput(
        trip.deploymentDate
      ),

    poDate:
      toDateInput(
        trip.poDate
      ),

    loadingDate:
      toDateInput(
        trip.loadingDate ||
        firstVehicle.loadingDate
      ),

    origin:
      trip.origin ||
      "",

    destination:
      trip.destination ||
      "",

    estimatedDistance:
      trip.estimatedDistance ??
      trip.totalKm ??
      "",

    totalKm:
      trip.totalKm ??
      trip.estimatedDistance ??
      "",

    siteLocation:
      trip.siteLocation ||
      "",

    period:
      trip.period ||
      "",

    dieselScope:
      trip.dieselScope ||
      "",

    totalQuantity:
      trip.totalQuantity ??
      "",

    weight:
      trip.weight ??
      firstVehicle.weight ??
      "",

    length:
      trip.length ??
      firstVehicle.length ??
      "",

    height:
      trip.height ??
      firstVehicle.height ??
      "",

    width:
      trip.width ??
      firstVehicle.width ??
      "",

    remark:
      trip.remark ||
      "",

    instructions:
      trip.instructions ||
      "",

    requiredVehicles:
      trip.requiredVehicles ??
      trip.vehicleCount ??
      "",

    primaryVehicleType:
      trip.primaryVehicleType ||
      trip.vehicleType ||
      firstVehicle.vehicleType ||
      "",

    vehicleType:
      trip.vehicleType ||
      trip.primaryVehicleType ||
      firstVehicle.vehicleType ||
      "",

    vehicles,

    /* NEW ORDER STATUS */

    approvalStatus,

    orderStatus:
      approvalStatus,

    stage:
      trip.stage ||
      trip.orderStage ||
      "Client Enquiry",

    role:
      trip.role ||
      trip.responsibleTeam ||
      "Key Account Management Team",
  };
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

const KeyAccount = () => {

  const [
    orders,
    setOrders,
  ] = useState([]);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    stageFilter,
    setStageFilter,
  ] = useState(
    "All Stages"
  );


  const [
    selectedOrderId,
    setSelectedOrderId,
  ] = useState(null);


  const [
    showTripModal,
    setShowTripModal,
  ] = useState(false);


  const [
    tripForm,
    setTripForm,
  ] = useState(
    () =>
      createEmptyTripForm()
  );


  const [
    toast,
    setToast,
  ] = useState("");


  const [
    tripUpload,
    setTripUpload,
  ] = useState(null);


  const [
    editingOrderId,
    setEditingOrderId,
  ] = useState(null);


  const [
    isSaving,
    setIsSaving,
  ] = useState(false);


  const [
    isLoadingOrders,
    setIsLoadingOrders,
  ] = useState(true);



  const [
    openActionMenu,
    setOpenActionMenu,
  ] = useState(null);

  /* =========================================================
     LOAD ORDERS
  ========================================================= */

  const fetchTrips =
    async () => {

      try {

        setIsLoadingOrders(
          true
        );


        const response =
          await fetch(
            TRIP_API_URL
          );


        const payload =
          await response
            .json()
            .catch(
              () => ({})
            );


        if (!response.ok) {

          throw new Error(
            payload.message ||
            "Unable to load trips."
          );
        }


        setOrders(
          extractTripList(
            payload
          ).map(
            mapDbTripToOrder
          )
        );

      } catch (error) {

        console.error(
          "Fetch Trips Error:",
          error
        );

        setToast(
          error.message ||
          "Unable to load trips from database."
        );

      } finally {

        setIsLoadingOrders(
          false
        );
      }
    };


  useEffect(() => {

    fetchTrips();

  }, []);


  /* =========================================================
     TOAST
  ========================================================= */

  useEffect(() => {

    if (!toast) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () =>
          setToast(""),
        2600
      );

    return () =>
      window.clearTimeout(
        timer
      );

  }, [toast]);



  /* =========================================================
     ACTION MENU
  ========================================================= */

  useEffect(() => {
    if (!openActionMenu) {
      return undefined;
    }

    const handleDocumentClick = () => {
      setOpenActionMenu(null);
    };

    document.addEventListener(
      "click",
      handleDocumentClick
    );

    return () => {
      document.removeEventListener(
        "click",
        handleDocumentClick
      );
    };
  }, [openActionMenu]);

  /* =========================================================
     SELECTED ORDER
  ========================================================= */

  const selectedOrder =
    useMemo(
      () =>
        orders.find(
          (order) =>
            (
              order._id ||
              order.id
            ) ===
            selectedOrderId
        ) ||
        null,
      [
        orders,
        selectedOrderId,
      ]
    );


  /* =========================================================
     STAGES
  ========================================================= */

  const stages =
    useMemo(
      () => [
        "All Stages",

        ...Array.from(
          new Set(
            orders.map(
              (order) =>
                order.stage
            )
          )
        ),
      ],
      [orders]
    );


  /* =========================================================
     FILTER
  ========================================================= */

  const filteredOrders =
    useMemo(() => {

      const searchText =
        search
          .trim()
          .toLowerCase();


      return orders.filter(
        (order) => {

          const vehicleData =
            Array.isArray(
              order.vehicles
            )
              ? order.vehicles.flatMap(
                  (
                    vehicle
                  ) => [
                    vehicle.vehicleNumber,
                    vehicle.vehicleType,
                    vehicle.configurationModel,
                    vehicle.movementClassification,
                    vehicle.quantity,
                    vehicle.weight,
                    vehicle.driverName,
                    vehicle.driverNumber,
                  ]
                )
              : [];


          const haystack = [

            order.id,
            order.tripId,

            order.client,
            order.companyName,
            order.clientContact,
            order.clientEmail,

            order.assignedKam,

            order.cargo,
            order.weight,

            order.origin,
            order.destination,

            order.stage,

            /* NEW */
            order.approvalStatus,

            order.role,
            order.vehicleType,
            order.vendor,
            order.movementType,

            order.enquiryDate,
            order.placementDate,
            order.deploymentDate,

            order.estimatedDistance,

            order.siteLocation,
            order.period,
            order.dieselScope,
            order.totalQuantity,

            order.remark,

            ...vehicleData,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          const matchesSearch =
            !searchText ||
            haystack.includes(
              searchText
            );


          const matchesStage =
            stageFilter ===
              "All Stages" ||
            order.stage ===
              stageFilter;


          return (
            matchesSearch &&
            matchesStage
          );
        }
      );

    }, [
      orders,
      search,
      stageFilter,
    ]);


  /* =========================================================
     STATS
  ========================================================= */

  const stats =
    useMemo(() => {

      const active =
        orders.filter(
          (order) =>
            [
              "Vehicle Assigned",
              "Trip Started",
              "Delivery In Progress",
            ].includes(
              order.stage
            )
        ).length;


      const vendorPending =
        orders.filter(
          (order) =>
            order.stage ===
            "Vendor Finalization"
        ).length;


      const documentation =
        orders.filter(
          (order) =>
            [
              "Documentation",
              "PO Documents",
            ].includes(
              order.stage
            )
        ).length;


      return {

        total:
          orders.length,

        active,

        vendorPending,

        documentation,
      };

    }, [orders]);


  /* =========================================================
     OPEN ORDER
  ========================================================= */

  const handleOrderClick =
    (order) => {

      setSelectedOrderId(
        order._id ||
        order.id
      );
    };


  const handleBackFromDetail =
    () => {

      setSelectedOrderId(
        null
      );
    };


  /* =========================================================
     NEW TRIP
  ========================================================= */

  const handleOpenTripModal =
    () => {

      setEditingOrderId(
        null
      );

      setTripForm(
        createEmptyTripForm(
          getNextTripId(
            orders
          )
        )
      );

      setTripUpload(
        null
      );

      setShowTripModal(
        true
      );
    };


  /* =========================================================
     EDIT TRIP
  ========================================================= */

  const handleEditTrip =
    (order) => {

      setEditingOrderId(
        order._id ||
        null
      );

      setTripUpload(
        null
      );


      setTripForm({

        ...createEmptyTripForm(
          order.tripId ||
          order.id ||
          ""
        ),

        movementType:
          order.movementType ||
          "",

        client:
          order.client ||
          order.customer ||
          "",

        companyName:
          order.companyName ||
          "",

        clientContact:
          order.clientContact ||
          order.clientPhone ||
          "",

        clientEmail:
          order.clientEmail ||
          "",

        assignedKam:
          order.assignedKam ||
          "",

        tripId:
          order.tripId ||
          order.id ||
          "",

        enquiryDate:
          toDateInput(
            order.enquiryDate
          ),

        placementDate:
          toDateInput(
            order.placementDate
          ),

        deploymentDate:
          toDateInput(
            order.deploymentDate
          ),

        siteLocation:
          order.siteLocation ||
          "",

        period:
          order.period ||
          "",

        dieselScope:
          order.dieselScope ||
          "",

        totalQuantity:
          order.totalQuantity ??
          "",

        origin:
          order.origin ||
          "",

        destination:
          order.destination ||
          "",

        estimatedDistance:
          order.estimatedDistance ??
          order.totalKm ??
          "",

        cargo:
          order.cargo ||
          order.materialType ||
          "",

        weight:
          numberText(
            order.weight ??
            order.vehicles?.[0]
              ?.weight
          ),

        length:
          order.length ??
          order.vehicles?.[0]
            ?.length ??
          "",

        height:
          order.height ??
          order.vehicles?.[0]
            ?.height ??
          "",

        width:
          order.width ??
          order.vehicles?.[0]
            ?.width ??
          "",

        remark:
          order.remark ||
          order.instructions ||
          "",

        requiredVehicles:
          order.requiredVehicles ??
          order.vehicleCount ??
          "",

        primaryVehicleType:
          order.primaryVehicleType ||
          order.vehicleType ||
          order.vehicles?.[0]
            ?.vehicleType ||
          "",

        vehicles:
          Array.isArray(
            order.vehicles
          ) &&
          order.vehicles.length
            ? order.vehicles.map(
                (
                  vehicle
                ) => ({

                  ...EMPTY_WTG_VEHICLE,

                  ...vehicle,

                  quantity:
                    String(
                      vehicle.quantity ??
                      1
                    ),

                  weight:
                    String(
                      vehicle.weight ??
                      ""
                    ),

                  length:
                    vehicle.length ??
                    "",

                  height:
                    vehicle.height ??
                    "",

                  width:
                    vehicle.width ??
                    "",
                })
              )
            : [
                {
                  ...EMPTY_WTG_VEHICLE,
                },
              ],
      });


      setShowTripModal(
        true
      );
    };
  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const handleCloseTripModal =
    () => {

      if (isSaving) {
        return;
      }

      setShowTripModal(
        false
      );

      setEditingOrderId(
        null
      );

      setTripForm(
        createEmptyTripForm()
      );

      setTripUpload(
        null
      );
    };


  const handleTripOverlayClick =
    (event) => {

      if (
        event.target ===
        event.currentTarget
      ) {
        handleCloseTripModal();
      }
    };


  /* =========================================================
     FORM INPUT
  ========================================================= */

  const handleTripFieldChange =
    (field) =>
    (event) => {

      setTripForm(
        (previous) => ({

          ...previous,

          [field]:
            event.target.value,
        })
      );
    };


  const handleMovementTypeChange =
    (event) => {

      const movementType =
        event.target.value;

      setTripForm(
        (previous) => ({

          ...previous,

          movementType,

          requiredVehicles:
            movementType ===
              "Crane"
              ? previous
                  .requiredVehicles ||
                "1"
              : previous
                  .requiredVehicles,
        })
      );

      setTripUpload(
        null
      );
    };


  const handleTripFileChange =
    (event) => {

      setTripUpload(
        event.target
          .files?.[0] ||
        null
      );
    };


  /* =========================================================
     VEHICLES
  ========================================================= */

  const handleWtgVehicleFieldChange =
    (
      index,
      field
    ) =>
    (event) => {

      const value =
        event.target.value;

      setTripForm(
        (previous) => ({

          ...previous,

          vehicles:
            previous.vehicles.map(
              (
                vehicle,
                vehicleIndex
              ) =>
                vehicleIndex ===
                index
                  ? {

                      ...vehicle,

                      [field]:
                        value,
                    }
                  : vehicle
            ),
        })
      );
    };


  const handleAddWtgVehicle =
    () => {

      setTripForm(
        (previous) => ({

          ...previous,

          vehicles: [
            ...(
              previous
                .vehicles.length
                ? previous.vehicles
                : [
                    {
                      ...EMPTY_WTG_VEHICLE,
                    },
                  ]
            ),

            {
              ...EMPTY_WTG_VEHICLE,
            },
          ],
        })
      );
    };


  const handleRemoveWtgVehicle =
    (index) => {

      setTripForm(
        (previous) => {

          if (
            previous
              .vehicles.length <=
            1
          ) {
            return previous;
          }

          return {

            ...previous,

            vehicles:
              previous.vehicles.filter(
                (
                  _,
                  vehicleIndex
                ) =>
                  vehicleIndex !==
                  index
              ),
          };
        }
      );
    };


  /* =========================================================
     CREATE / UPDATE TRIP
  ========================================================= */

  const handleCreateTrip =
    async () => {

      const isWTG =
        tripForm.movementType ===
        "WTG Movement";


      const isIntercarting =
        tripForm.movementType ===
          "Intercarting" ||
        tripForm.movementType ===
          "Other";


      const isCrane =
        tripForm.movementType ===
        "Crane";


      if (
        !tripForm.movementType
      ) {

        setToast(
          "Please select a movement type."
        );

        return;
      }


      if (
        !String(
          tripForm.tripId
        ).trim()
      ) {

        setToast(
          "Trip ID is required."
        );

        return;
      }


      const commonFields = [

        tripForm.companyName,
        tripForm.client,
        tripForm.clientContact,
        tripForm.clientEmail,
        tripForm.enquiryDate,
      ];


      if (
        commonFields.some(
          (value) =>
            !String(
              value ?? ""
            ).trim()
        )
      ) {

        setToast(
          "Please complete all required client details."
        );

        return;
      }


      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          String(
            tripForm.clientEmail
          ).trim()
        )
      ) {

        setToast(
          "Please enter a valid client email address."
        );

        return;
      }


      /* =========================
         WTG VALIDATION
      ========================= */

      if (isWTG) {

        const required = [

          tripForm.placementDate,
          tripForm.assignedKam,
          tripForm.origin,
          tripForm.destination,
          tripForm.estimatedDistance,
          tripForm.cargo,
        ];


        if (
          required.some(
            (value) =>
              !String(
                value ?? ""
              ).trim()
          )
        ) {

          setToast(
            "Please complete all required WTG trip fields."
          );

          return;
        }


        const invalidVehicle =
          tripForm.vehicles.some(
            (vehicle) => {

              const values = [

                vehicle.vehicleType,
                vehicle.configurationModel,
                vehicle.movementClassification,
                vehicle.quantity,
                vehicle.weight,
                vehicle.length,
                vehicle.height,
                vehicle.width,
              ];


              return (

                values.some(
                  (value) =>
                    !String(
                      value ?? ""
                    ).trim()
                ) ||

                !Number.isInteger(
                  Number(
                    vehicle.quantity
                  )
                ) ||

                Number(
                  vehicle.quantity
                ) < 1 ||

                [
                  vehicle.weight,
                  vehicle.length,
                  vehicle.height,
                  vehicle.width,
                ].some(
                  (value) =>
                    !Number.isFinite(
                      Number(value)
                    ) ||
                    Number(value) <=
                      0
                )
              );
            }
          );


        if (invalidVehicle) {

          setToast(
            "Complete Vehicle Type, Configuration, Classification, Quantity, Weight and L × H × W for every WTG vehicle."
          );

          return;
        }
      }


      /* =========================
         INTERCARTING / OTHER
      ========================= */

      if (isIntercarting) {

        const required = [

          tripForm.siteLocation,
          tripForm.period,
          tripForm.dieselScope,
          tripForm.totalQuantity,
          tripForm.deploymentDate,
          tripForm.assignedKam,
        ];


        if (
          required.some(
            (value) =>
              !String(
                value ?? ""
              ).trim()
          )
        ) {

          setToast(
            "Please complete all required Intercarting / Other fields."
          );

          return;
        }


        const invalidVehicle =
          tripForm.vehicles.some(
            (vehicle) =>
              [
                vehicle.vehicleType,
                vehicle.configurationModel,
                vehicle.movementClassification,
                vehicle.quantity,
                vehicle.weight,
              ].some(
                (value) =>
                  !String(
                    value ?? ""
                  ).trim()
              ) ||

              Number(
                vehicle.quantity
              ) < 1 ||

              Number(
                vehicle.weight
              ) <= 0
          );


        if (invalidVehicle) {

          setToast(
            "Complete vehicle details for every vehicle row."
          );

          return;
        }
      }


      /* =========================
         CRANE
      ========================= */

      if (isCrane) {

        const required = [

          tripForm.placementDate,
          tripForm.assignedKam,
          tripForm.origin,
          tripForm.destination,
          tripForm.estimatedDistance,
          tripForm.cargo,
          tripForm.requiredVehicles,
          tripForm.primaryVehicleType,
          tripForm.weight,
        ];


        if (
          required.some(
            (value) =>
              !String(
                value ?? ""
              ).trim()
          )
        ) {

          setToast(
            "Please complete all required Crane fields."
          );

          return;
        }
      }


      /* =========================
         DUPLICATE CHECK
      ========================= */

      const duplicate =
        orders.some(
          (order) =>
            order._id !==
              editingOrderId &&
            String(
              order.tripId ||
              order.id
            )
              .trim()
              .toLowerCase() ===
            String(
              tripForm.tripId
            )
              .trim()
              .toLowerCase()
        );


      if (duplicate) {

        setToast(
          "Trip ID already exists."
        );

        return;
      }


      const existing =
        editingOrderId
          ? orders.find(
              (order) =>
                order._id ===
                editingOrderId
            )
          : null;


      const usesVehicleRows =
        isWTG ||
        isIntercarting;


      let vehicles = [];


      if (usesVehicleRows) {

        vehicles =
          tripForm.vehicles.map(
            (
              vehicle,
              index
            ) => ({

              ...vehicle,

              vehicleSubId:
                vehicle.vehicleSubId ||
                `${tripForm.tripId}-V${
                  index + 1
                }`,

              vehicleNumber:
                vehicle.vehicleNumber ||
                "",

              vehicleType:
                String(
                  vehicle.vehicleType ||
                  ""
                ).trim(),

              configurationModel:
                String(
                  vehicle.configurationModel ||
                  ""
                ).trim(),

              movementClassification:
                String(
                  vehicle.movementClassification ||
                  ""
                ).trim(),

              quantity:
                Number(
                  vehicle.quantity
                ),

              weight:
                Number(
                  vehicle.weight
                ),

              length:
                isWTG
                  ? Number(
                      vehicle.length
                    )
                  : null,

              height:
                isWTG
                  ? Number(
                      vehicle.height
                    )
                  : null,

              width:
                isWTG
                  ? Number(
                      vehicle.width
                    )
                  : null,
            })
          );

      } else {

        const oldVehicle =
          existing
            ?.vehicles?.[0] ||
          {};


        vehicles = [
          {

            ...oldVehicle,

            vehicleSubId:
              oldVehicle
                .vehicleSubId ||
              `${tripForm.tripId}-V1`,

            vehicleType:
              tripForm
                .primaryVehicleType
                .trim(),

            quantity:
              Number(
                tripForm.requiredVehicles
              ),

            weight:
              Number(
                tripForm.weight
              ),
          },
        ];
      }


      const requiredVehicleCount =
        usesVehicleRows
          ? vehicles.reduce(
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
            )
          : Number(
              tripForm.requiredVehicles
            );


      const firstVehicle =
        vehicles[0] || {};


      const uploadMeta =
        tripUpload
          ? {

              name:
                tripUpload.name,

              type:
                tripUpload.type,

              size:
                tripUpload.size,

              lastModified:
                tripUpload
                  .lastModified,
            }
          : existing?.document ||
            null;


      /* =====================================================
         PAYLOAD

         IMPORTANT:
         New orders = Pending.

         Existing order status is preserved, so editing
         the order from Key Account will NOT reset an
         Approved/Rejected order back to Pending.
      ===================================================== */

      const currentApprovalStatus =
        existing
          ? normalizeApprovalStatus(
              existing.approvalStatus ||
              existing.orderStatus ||
              "Pending"
            )
          : "Pending";


      const payload = {

        ...(existing || {}),

        tripId:
          tripForm.tripId.trim(),

        movementType:
          tripForm.movementType,

        companyName:
          tripForm.companyName.trim(),

        customer:
          tripForm.client.trim(),

        client:
          tripForm.client.trim(),

        clientContact:
          tripForm.clientContact.trim(),

        clientPhone:
          tripForm.clientContact.trim(),

        clientContactPerson:
          tripForm.clientContact.trim(),

        clientEmail:
          tripForm.clientEmail.trim(),

        assignedKam:
          tripForm.assignedKam.trim(),

        materialType:
          isIntercarting
            ? tripForm.movementType
            : tripForm.cargo.trim(),

        cargo:
          isIntercarting
            ? tripForm.movementType
            : tripForm.cargo.trim(),

        enquiryDate:
          tripForm.enquiryDate ||
          null,

        placementDate:
          isIntercarting
            ? tripForm.deploymentDate ||
              null
            : tripForm.placementDate ||
              null,

        deploymentDate:
          isIntercarting
            ? tripForm.deploymentDate ||
              null
            : null,

        siteLocation:
          isIntercarting
            ? tripForm
                .siteLocation
                .trim()
            : "",

        period:
          isIntercarting
            ? tripForm.period.trim()
            : "",

        dieselScope:
          isIntercarting
            ? tripForm.dieselScope
            : "",

        totalQuantity:
          isIntercarting
            ? Number(
                tripForm
                  .totalQuantity
              )
            : 0,

        origin:
          isIntercarting
            ? tripForm
                .siteLocation
                .trim()
            : tripForm
                .origin
                .trim(),

        destination:
          isIntercarting
            ? ""
            : tripForm
                .destination
                .trim(),

        estimatedDistance:
          isIntercarting
            ? 0
            : Number(
                tripForm
                  .estimatedDistance ||
                0
              ),

        totalKm:
          isIntercarting
            ? 0
            : Number(
                tripForm
                  .estimatedDistance ||
                0
              ),

        weight:
          Number(
            firstVehicle.weight ||
            tripForm.weight ||
            0
          ),

        length:
          isWTG
            ? Number(
                firstVehicle.length ||
                0
              )
            : null,

        height:
          isWTG
            ? Number(
                firstVehicle.height ||
                0
              )
            : null,

        width:
          isWTG
            ? Number(
                firstVehicle.width ||
                0
              )
            : null,

        configurationModel:
          firstVehicle
            .configurationModel ||
          "",

        movementClassification:
          firstVehicle
            .movementClassification ||
          "",

        remark:
          tripForm.remark.trim(),

        instructions:
          tripForm.remark.trim(),

        vehicles,

        requiredVehicles:
          requiredVehicleCount,

        vehicleCount:
          requiredVehicleCount,

        primaryVehicleType:
          firstVehicle
            .vehicleType ||
          tripForm
            .primaryVehicleType
            .trim(),

        vehicleType:
          firstVehicle
            .vehicleType ||
          tripForm
            .primaryVehicleType
            .trim(),

        document:
          uploadMeta,

        documentName:
          uploadMeta?.name ||
          existing?.documentName ||
          "",

        loadingDate:
          isIntercarting
            ? tripForm.deploymentDate ||
              null
            : tripForm.placementDate ||
              null,


        /* ===============================================
           NEW ORDER APPROVAL STATUS
        =============================================== */

        approvalStatus:
          currentApprovalStatus,

        orderStatus:
          currentApprovalStatus,


        /* ===============================================
           WORKFLOW
        =============================================== */

        orderStage:
          existing?.orderStage ||
          existing?.stage ||
          "Client Enquiry",

        responsibleTeam:
          existing
            ?.responsibleTeam ||
          existing?.role ||
          "Key Account Management Team",

        stage:
          existing?.stage ||
          existing?.orderStage ||
          "Client Enquiry",

        role:
          existing?.role ||
          existing
            ?.responsibleTeam ||
          "Key Account Management Team",
      };


      delete payload._id;
      delete payload.id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;


      try {

        setIsSaving(
          true
        );


        const url =
          editingOrderId
            ? `${TRIP_API_URL}/${editingOrderId}`
            : TRIP_API_URL;


        const response =
          await fetch(
            url,
            {
              method:
                editingOrderId
                  ? "PUT"
                  : "POST",

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
            "Unable to save trip."
          );
        }


        const savedOrder =
          mapDbTripToOrder(
            extractTrip(
              result
            )
          );


        setOrders(
          (previous) =>
            editingOrderId
              ? previous.map(
                  (order) =>
                    order._id ===
                    editingOrderId
                      ? savedOrder
                      : order
                )
              : [
                  savedOrder,
                  ...previous,
                ]
        );


        setSelectedOrderId(
          savedOrder._id ||
          savedOrder.id
        );


        setShowTripModal(
          false
        );


        setEditingOrderId(
          null
        );


        setTripForm(
          createEmptyTripForm()
        );


        setTripUpload(
          null
        );


        setToast(
          `${savedOrder.tripId} ${
            editingOrderId
              ? "updated"
              : "created"
          } successfully.`
        );

      } catch (error) {

        console.error(
          "Save Trip Error:",
          error
        );

        setToast(
          error.message ||
          "Unable to save trip."
        );

      } finally {

        setIsSaving(
          false
        );
      }
    };


  /* =========================================================
     UPDATE LIFECYCLE
  ========================================================= */

  const handleUpdateOrder =
    async (
      updatedOrder,
      message =
        "Order updated."
    ) => {

      const mongoId =
        updatedOrder._id;


      if (!mongoId) {

        setToast(
          "Database ID missing."
        );

        throw new Error(
          "Database ID missing."
        );
      }


      const currentApprovalStatus =
        normalizeApprovalStatus(
          updatedOrder.approvalStatus ||
          updatedOrder.orderStatus ||
          updatedOrder.approvalDecision ||
          updatedOrder.approval?.status ||
          "Pending"
        );


      const payload = {

        ...updatedOrder,

        customer:
          updatedOrder.client ||
          updatedOrder.customer ||
          "",

        client:
          updatedOrder.client ||
          updatedOrder.customer ||
          "",

        clientPhone:
          updatedOrder.clientPhone ||
          updatedOrder.clientContact ||
          "",

        clientContact:
          updatedOrder.clientContact ||
          updatedOrder.clientPhone ||
          "",

        materialType:
          updatedOrder.cargo ||
          updatedOrder.materialType ||
          "",

        cargo:
          updatedOrder.cargo ||
          updatedOrder.materialType ||
          "",


        /* PRESERVE APPROVAL */

        approvalStatus:
          currentApprovalStatus,

        orderStatus:
          currentApprovalStatus,


        orderStage:
          updatedOrder.stage ||
          updatedOrder.orderStage ||
          "Client Enquiry",

        responsibleTeam:
          updatedOrder.role ||
          updatedOrder.responsibleTeam ||
          "Key Account Management Team",
      };


      delete payload._id;
      delete payload.id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;


      try {

        const response =
          await fetch(
            `${TRIP_API_URL}/${mongoId}`,
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
            "Unable to update order."
          );
        }


        const savedOrder =
          mapDbTripToOrder(
            extractTrip(
              result
            )
          );


        setOrders(
          (previous) =>
            previous.map(
              (order) =>
                order._id ===
                mongoId
                  ? savedOrder
                  : order
            )
        );


        setToast(
          message
        );


        return savedOrder;

      } catch (error) {

        console.error(
          "Update Order Error:",
          error
        );

        setToast(
          error.message ||
          "Unable to update order."
        );

        throw error;
      }
    };


  /* =========================================================
     DELETE TRIP
  ========================================================= */

  const handleDeleteTrip =
    async (
      order
    ) => {

      const mongoId =
        order?._id;


      if (!mongoId) {

        setToast(
          "Database ID missing."
        );

        return;
      }


      const tripLabel =
        order.tripId ||
        order.id ||
        "this trip";


      const confirmed =
        window.confirm(
          `Are you sure you want to delete ${tripLabel}?`
        );


      if (!confirmed) {
        return;
      }


      try {

        const response =
          await fetch(
            `${TRIP_API_URL}/${mongoId}`,
            {
              method:
                "DELETE",
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
            "Unable to delete trip."
          );
        }


        setOrders(
          (previous) =>
            previous.filter(
              (item) =>
                item._id !==
                mongoId
            )
        );


        if (
          selectedOrderId ===
          mongoId
        ) {
          setSelectedOrderId(
            null
          );
        }


        if (
          editingOrderId ===
          mongoId
        ) {
          handleCloseTripModal();
        }


        setToast(
          `${tripLabel} deleted successfully.`
        );

      } catch (error) {

        console.error(
          "Delete Trip Error:",
          error
        );

        setToast(
          error.message ||
          "Unable to delete trip."
        );
      }
    };


  /* =========================================================
     CLEAR FILTER
  ========================================================= */

  const handleClearFilters =
    () => {

      setSearch("");

      setStageFilter(
        "All Stages"
      );
    };


  /* =========================================================
     PAGE
  ========================================================= */

  return (

    <div className="key-account-page">

      {toast && (
        <div className="kam-toast">
          {toast}
        </div>
      )}


      <div className="key-account-shell">

        {/* PAGE HEADER */}

        <section className="kam-page-heading">

          <div>

            <h1>
              Order Management
            </h1>

            <p>
              Manage client orders,
              commercial workflow,
              vendor finalization and
              trip readiness from one
              operational workspace.
            </p>

          </div>


          <button
            type="button"
            className="new-trip-button"
            onClick={
              handleOpenTripModal
            }
          >

            <span className="new-trip-plus">
              +
            </span>

            New Trip

          </button>

        </section>


        {/* STATS */}

        <section className="kam-stat-grid">

          <SummaryCard
            label="Total Orders"
            value={
              stats.total
            }
            caption="All running orders"
            icon="01"
          />


          <SummaryCard
            label="Active Movement"
            value={
              stats.active
            }
            caption="Assigned / in transit"
            icon="02"
          />


          <SummaryCard
            label="Vendor Pending"
            value={
              stats.vendorPending
            }
            caption="Awaiting finalization"
            icon="03"
          />


          <SummaryCard
            label="Documentation"
            value={
              stats.documentation
            }
            caption="Documents in process"
            icon="04"
          />

        </section>


        {/* ORDER LIST */}

        <section className="key-account-container">

          <div className="key-account-header">

            <div className="key-account-header-left">

              <h2>
                Running Order List
              </h2>

            </div>


            <div className="kam-header-indicator">

              <span className="kam-status-dot" />

              Live workspace

            </div>

          </div>


          {/* FILTER */}

          <div className="key-account-filters">

            <div className="key-search-box">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >

                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />

                <path
                  d="M16 16l4 4"
                />

              </svg>


              <input
                type="text"
                placeholder="Search order, client, cargo, route, status..."
                value={
                  search
                }
                onChange={
                  (event) =>
                    setSearch(
                      event.target.value
                    )
                }
              />

            </div>


            <div className="key-stage-select">

              <select
                value={
                  stageFilter
                }
                onChange={
                  (event) =>
                    setStageFilter(
                      event.target.value
                    )
                }
              >

                {stages.map(
                  (stage) => (

                    <option
                      key={stage}
                      value={stage}
                    >
                      {stage}
                    </option>

                  )
                )}

              </select>


              <svg
                className="select-arrow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >

                <path
                  d="M6 9l6 6 6-6"
                />

              </svg>

            </div>


            {(
              search ||
              stageFilter !==
                "All Stages"
            ) && (

              <button
                type="button"
                className="kam-clear-filter"
                onClick={
                  handleClearFilters
                }
              >
                Clear
              </button>

            )}


            <div className="order-count">

              <strong>
                {
                  filteredOrders.length
                }
              </strong>

              <span>
                of {orders.length} orders
              </span>

            </div>

          </div>


          {/* =================================================
              TABLE
          ================================================= */}

          <div className="key-account-table-wrapper">

            <table className="key-account-table">

              <thead>

                <tr>

                  <th>
                    ORDER ID
                  </th>

                  <th>
                    CLIENT
                  </th>

                  <th>
                    CARGO &amp; WEIGHT
                  </th>

                  <th>
                    ROUTE
                  </th>

                  <th>
                    STAGE
                  </th>

                  {/* NEW */}

                  <th>
                    ORDER STATUS
                  </th>

                  <th>
                    KEY ACCOUNT NAME
                  </th>

                  <th className="kam-actions-column">
                    ACTION
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredOrders.length >
                0 ? (

                  filteredOrders.map(
                    (order) => (

                      <tr
                        key={
                          order._id ||
                          order.id
                        }
                        className="key-account-row"
                        onClick={() =>
                          handleOrderClick(
                            order
                          )
                        }
                      >

                        {/* ORDER ID */}

                        <td>

                          <div className="order-id">
                            {order.id}
                          </div>

                        </td>


                        {/* CLIENT */}

                        <td>

                          <div className="client-name">

                            {order.client ||
                              "—"}

                          </div>


                          {order.companyName && (

                            <span className="order-subtext">

                              {
                                order.companyName
                              }

                            </span>

                          )}

                        </td>


                        {/* CARGO */}

                        <td>

                          <div className="cargo-name">

                            {[
                              "Intercarting",
                              "Other",
                            ].includes(
                              order.movementType
                            )
                              ? `${
                                  order.movementType
                                } · ${
                                  order.totalQuantity ||
                                  0
                                } Nos`
                              : order.cargo ||
                                "—"}

                          </div>


                          {order.weight !==
                            "" &&
                            order.weight !==
                              null &&
                            order.weight !==
                              undefined && (

                            <div className="cargo-weight">

                              {order.weight} TON

                            </div>

                          )}

                        </td>


                        {/* ROUTE */}

                        <td>

                          {[
                            "Intercarting",
                            "Other",
                          ].includes(
                            order.movementType
                          ) ? (

                            <span>

                              {order.siteLocation ||
                                "—"}

                            </span>

                          ) : (

                            <>

                              <span>
                                {order.origin ||
                                  "—"}
                              </span>


                              <span className="route-arrow">
                                →
                              </span>


                              <span>
                                {order.destination ||
                                  "—"}
                              </span>

                            </>

                          )}

                        </td>


                        {/* STAGE */}

                        <td>

                          <span
                            className={
                              getStageClass(
                                order.stage
                              )
                            }
                          >

                            <span className="stage-dot" />

                            {order.stage}

                          </span>

                        </td>


                        {/* =====================================
                            NEW ORDER STATUS
                        ===================================== */}

                        <td>

                          <span
                            className={
                              getOrderStatusClass(
                                order.approvalStatus
                              )
                            }
                          >

                            <span className="order-status-dot" />

                            {
                              normalizeApprovalStatus(
                                order.approvalStatus
                              )
                            }

                          </span>

                        </td>


                        {/* KEY ACCOUNT */}

                        <td>

                          <div className="role-responsible">

                            {order.assignedKam ||
                              order.role ||
                              "—"}

                          </div>

                        </td>


                        {/* ACTION */}

                        <td
                          className="kam-actions-cell"
                          onClick={
                            (event) =>
                              event.stopPropagation()
                          }
                        >

                          <div className="kam-action-menu-wrap">

                            <button
                              type="button"
                              className={`kam-three-dot-btn ${
                                openActionMenu ===
                                (order._id || order.id)
                                  ? "active"
                                  : ""
                              }`}
                              aria-label={`Actions for ${
                                order.tripId ||
                                order.id
                              }`}
                              aria-expanded={
                                openActionMenu ===
                                (order._id || order.id)
                              }
                              onClick={
                                (event) => {
                                  event.stopPropagation();

                                  const menuId =
                                    order._id ||
                                    order.id;

                                  setOpenActionMenu(
                                    (current) =>
                                      current === menuId
                                        ? null
                                        : menuId
                                  );
                                }
                              }
                            >
                              <span />
                              <span />
                              <span />
                            </button>


                            {openActionMenu ===
                              (order._id || order.id) && (

                              <div
                                className="kam-action-dropdown"
                                role="menu"
                                onClick={
                                  (event) =>
                                    event.stopPropagation()
                                }
                              >

                                <button
                                  type="button"
                                  className="kam-dropdown-item"
                                  role="menuitem"
                                  onClick={
                                    (event) => {
                                      event.stopPropagation();

                                      setOpenActionMenu(
                                        null
                                      );

                                      handleEditTrip(
                                        order
                                      );
                                    }
                                  }
                                >
                                  <span className="kam-action-item-icon">
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      aria-hidden="true"
                                    >
                                      <path d="M12 20h9" />
                                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                    </svg>
                                  </span>

                                  <span className="kam-action-item-text">
                                    <strong>Edit</strong>
                                  </span>
                                </button>


                                <button
                                  type="button"
                                  className="kam-dropdown-item kam-dropdown-delete"
                                  role="menuitem"
                                  onClick={
                                    (event) => {
                                      event.stopPropagation();

                                      setOpenActionMenu(
                                        null
                                      );

                                      handleDeleteTrip(
                                        order
                                      );
                                    }
                                  }
                                >
                                  <span className="kam-action-item-icon">
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      aria-hidden="true"
                                    >
                                      <path d="M3 6h18" />
                                      <path d="M8 6V4h8v2" />
                                      <path d="M19 6l-1 14H6L5 6" />
                                      <path d="M10 11v5" />
                                      <path d="M14 11v5" />
                                    </svg>
                                  </span>

                                  <span className="kam-action-item-text">
                                    <strong>Delete</strong>
                                  </span>
                                </button>

                              </div>
                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  )

                ) : (

                  <tr>

                    <td
                      colSpan="8"
                      className="no-orders"
                    >

                      <div className="no-orders-icon">
                        ⌕
                      </div>


                      <strong>

                        {isLoadingOrders
                          ? "Loading orders..."
                          : "No matching orders found"}

                      </strong>


                      <span>

                        {isLoadingOrders
                          ? "Reading trip data from database."
                          : "Try changing search or stage filter."}

                      </span>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>


      {/* =====================================================
          ORDER LIFECYCLE
      ===================================================== */}

      {selectedOrder && (

        <Lifecyclemodal
          key={
            selectedOrder._id ||
            selectedOrder.id
          }
          order={
            selectedOrder
          }
          onClose={
            handleBackFromDetail
          }
          onUpdate={
            handleUpdateOrder
          }
          primaryVehicleTypes={
            PRIMARY_VEHICLE_TYPES
          }
        />

      )}


      {/* =====================================================
          CREATE / EDIT
      ===================================================== */}

      <Tripcreatemodal
        showTripModal={
          showTripModal
        }

        tripForm={
          tripForm
        }

        tripUpload={
          tripUpload
        }

        primaryVehicleTypes={
          PRIMARY_VEHICLE_TYPES
        }

        handleTripOverlayClick={
          handleTripOverlayClick
        }

        handleMovementTypeChange={
          handleMovementTypeChange
        }

        handleCloseTripModal={
          handleCloseTripModal
        }

        handleTripFieldChange={
          handleTripFieldChange
        }

        handleAddWtgVehicle={
          handleAddWtgVehicle
        }

        handleWtgVehicleFieldChange={
          handleWtgVehicleFieldChange
        }

        handleRemoveWtgVehicle={
          handleRemoveWtgVehicle
        }

        handleTripFileChange={
          handleTripFileChange
        }

        handleCreateTrip={
          handleCreateTrip
        }

        isEditing={
          Boolean(
            editingOrderId
          )
        }

        isSaving={
          isSaving
        }
      />

    </div>
  );
};


/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  label,
  value,
  caption,
  icon,
}) => (

  <article className="kam-stat-card">

    <div className="kam-stat-icon">
      {icon}
    </div>

    <div>

      <span className="kam-stat-label">
        {label}
      </span>

      <strong className="kam-stat-value">
        {value}
      </strong>

      <span className="kam-stat-caption">
        {caption}
      </span>

    </div>

  </article>
);


export default KeyAccount;