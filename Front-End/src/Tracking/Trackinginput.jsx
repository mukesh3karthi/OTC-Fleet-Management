import React, {
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
  FileSignature,
  FileText,
  Gauge,
  MapPin,
  MessageSquareText,
  Navigation,
  Package,
  PackageCheck,
  Plus,
  Route,
  Save,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./Trackinginput.css";


/* =========================================
   API
========================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");


const API_URL =
  `${API_BASE_URL}/api/triptracking`;


/* =========================================
   CURRENT YEAR
========================================= */

const CURRENT_YEAR =
  new Date().getFullYear();


/* =========================================
   SAFE TEXT
========================================= */

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

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    if (value.$oid) {
      return String(
        value.$oid
      );
    }

    if (value.$date) {
      return String(
        value.$date
      );
    }

    return fallback;
  }

  return String(value);
};


/* =========================================
   SAFE ID
========================================= */

const safeId = (
  value
) => {
  if (!value) {
    return "";
  }

  if (
    typeof value === "object"
  ) {
    return (
      value.$oid ||
      value.toString?.() ||
      ""
    );
  }

  return String(value);
};


/* =========================================
   SAFE DATE VALUE
========================================= */

const getSafeDateValue = (
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
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    if (
      value.$date !==
      undefined
    ) {
      return getSafeDateValue(
        value.$date
      );
    }

    if (
      value.$numberLong !==
      undefined
    ) {
      const timestamp =
        Number(
          value.$numberLong
        );

      return Number.isFinite(
        timestamp
      )
        ? timestamp
        : null;
    }

    return null;
  }

  return value;
};


/* =========================================
   DATE FOR HTML INPUT
========================================= */

const formatDateForInput = (
  value
) => {
  const safeValue =
    getSafeDateValue(
      value
    );

  if (!safeValue) {
    return "";
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
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
};


/* =========================================
   CURRENT DAY
========================================= */

const calculateCurrentDay = (
  loadingPointOutDate
) => {
  if (!loadingPointOutDate) {
    return "";
  }

  const startDate =
    new Date(
      `${loadingPointOutDate}T00:00:00`
    );

  if (
    Number.isNaN(
      startDate.getTime()
    )
  ) {
    return "";
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const difference =
    today.getTime() -
    startDate.getTime();

  const days =
    Math.floor(
      difference /
        (
          1000 *
          60 *
          60 *
          24
        )
    );

  if (days < 0) {
    return "";
  }

  return days + 1;
};


/* =========================================
   CREATE VEHICLE
========================================= */

const createVehicle = (
  index,
  tripId = ""
) => ({
  id:
    `${Date.now()}-${index}-${Math.random()}`,

  vehicleSubId:
    tripId
      ? `${tripId}-V${index}`
      : "",

  vehicleNumber: "",

  currentPosition: "",

  yesterdayPosition: "",

  runningKm: "",

  status:
    "Moving",

  currentDay: "",

  latitude: null,

  longitude: null,

  speed: 0,

  lastUpdated: null,


  /* LOADING */

  loadingStatus:
    "Pending",

  loadingPointInDate:
    "",

  loadingDate:
    "",

  loadingPointOutDate:
    "",

  loadingHaltingDays:
    "",

  loadingRemarks:
    "",


  /* UNLOADING */

  unloadingStatus:
    "Pending",

  unloadingPointInDate:
    "",

  unloadingDate:
    "",

  unloadingPointOutDate:
    "",

  unloadingHaltingDays:
    "",

  unloadingRemarks:
    "",


  /* LR */

  lrNo: "",

  lrStatus: "",

  lrRemarks: "",

  lrSignature: "",


  /* POD */

  podStatus:
    "Pending",

  courierName: "",

  trackingId: "",

  podCourierDate:
    "",

  podRemarks:
    "",


  /* DRIVER */

  driverName: "",

  driverNumber: "",
});


/* =========================================
   NORMALIZE VEHICLE FOR EDIT
========================================= */

const normalizeVehicleForForm = (
  vehicle = {},
  index,
  tripId
) => {
  const loadingOut =
    formatDateForInput(
      vehicle.loadingPointOutDate
    );

  return {
    id:
      safeId(vehicle._id) ||
      safeText(
        vehicle.id
      ) ||
      safeText(
        vehicle.vehicleSubId
      ) ||
      `vehicle-${index}`,

    vehicleSubId:
      safeText(
        vehicle.vehicleSubId
      ) ||
      `${tripId}-V${index + 1}`,

    vehicleNumber:
      safeText(
        vehicle.vehicleNumber
      ),

    currentPosition:
      safeText(
        vehicle.currentPosition ||
        vehicle.currentLocation
      ),

    yesterdayPosition:
      safeText(
        vehicle.yesterdayPosition
      ),

    runningKm:
      vehicle.runningKm ??
      "",

    status:
      safeText(
        vehicle.status,
        "Moving"
      ) ||
      "Moving",

    currentDay:
      vehicle.currentDay ??
      calculateCurrentDay(
        loadingOut
      ),

    latitude:
      vehicle.latitude ??
      null,

    longitude:
      vehicle.longitude ??
      null,

    speed:
      vehicle.speed ??
      0,

    lastUpdated:
      getSafeDateValue(
        vehicle.lastUpdated
      ),


    /* LOADING */

    loadingStatus:
      safeText(
        vehicle.loadingStatus,
        "Pending"
      ) ||
      "Pending",

    loadingPointInDate:
      formatDateForInput(
        vehicle.loadingPointInDate
      ),

    loadingDate:
      formatDateForInput(
        vehicle.loadingDate
      ),

    loadingPointOutDate:
      loadingOut,

    loadingHaltingDays:
      vehicle.loadingHaltingDays ??
      "",

    loadingRemarks:
      safeText(
        vehicle.loadingRemarks
      ),


    /* UNLOADING */

    unloadingStatus:
      safeText(
        vehicle.unloadingStatus,
        "Pending"
      ) ||
      "Pending",

    unloadingPointInDate:
      formatDateForInput(
        vehicle.unloadingPointInDate
      ),

    unloadingDate:
      formatDateForInput(
        vehicle.unloadingDate
      ),

    unloadingPointOutDate:
      formatDateForInput(
        vehicle.unloadingPointOutDate
      ),

    unloadingHaltingDays:
      vehicle.unloadingHaltingDays ??
      "",

    unloadingRemarks:
      safeText(
        vehicle.unloadingRemarks
      ),


    /* LR */

    lrNo:
      safeText(
        vehicle.lrNo
      ),

    lrStatus:
      safeText(
        vehicle.lrStatus
      ),

    lrRemarks:
      safeText(
        vehicle.lrRemarks
      ),

    lrSignature:
      safeText(
        vehicle.lrSignature
      ),


    /* POD */

    podStatus:
      safeText(
        vehicle.podStatus,
        "Pending"
      ) ||
      "Pending",

    courierName:
      safeText(
        vehicle.courierName ||
        vehicle.podCourierName
      ),

    trackingId:
      safeText(
        vehicle.trackingId ||
        vehicle.podTrackingId
      ),

    podCourierDate:
      formatDateForInput(
        vehicle.podCourierDate
      ),

    podRemarks:
      safeText(
        vehicle.podRemarks
      ),


    /* DRIVER */

    driverName:
      safeText(
        vehicle.driverName
      ),

    driverNumber:
      safeText(
        vehicle.driverNumber ||
        vehicle.driverPhone
      ),
  };
};


/* =========================================
   NEXT TRIP ID FROM DATABASE
========================================= */

const getNextTripIdFromDatabase =
  async () => {
    try {
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

      if (!response.ok) {
        throw new Error(
          "Unable to load trips."
        );
      }

      const result =
        await response.json();

      let trips = [];

      if (
        Array.isArray(result)
      ) {
        trips =
          result;
      } else if (
        Array.isArray(
          result.data
        )
      ) {
        trips =
          result.data;
      } else if (
        Array.isArray(
          result.trips
        )
      ) {
        trips =
          result.trips;
      }

      let highestNumber =
        0;

      trips.forEach(
        (trip) => {
          const tripId =
            safeText(
              trip.tripId
            );

          const match =
            tripId.match(
              /^(\d{4})-(\d+)$/
            );

          if (!match) {
            return;
          }

          const year =
            Number(
              match[1]
            );

          const number =
            Number(
              match[2]
            );

          if (
            year ===
              CURRENT_YEAR &&
            Number.isInteger(
              number
            ) &&
            number >
              highestNumber
          ) {
            highestNumber =
              number;
          }
        }
      );

      return (
        `${CURRENT_YEAR}-${highestNumber + 1}`
      );
    } catch (error) {
      console.error(
        "Next Trip ID Error:",
        error
      );

      return (
        `${CURRENT_YEAR}-1`
      );
    }
  };


/* =========================================
   COMPONENT
========================================= */

const Trackinginput = () => {
  const navigate =
    useNavigate();

  const location =
    useLocation();


  /* =====================================
     EDIT MODE
  ===================================== */

  const editTrip =
    location.state?.trip ||
    null;


  const editMongoId =
    location.state?.mongoId ||
    safeId(
      editTrip?._id
    ) ||
    safeText(
      editTrip?.id
    ) ||
    null;


  const isEditMode =
    location.state?.mode ===
      "edit" &&
    Boolean(
      editTrip
    );


  /* =====================================
     STATE
  ===================================== */

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);


  const [
    loadingTripId,
    setLoadingTripId,
  ] = useState(
    !isEditMode
  );


  const [
    formData,
    setFormData,
  ] = useState({
    tripId:
      isEditMode
        ? safeText(
            editTrip?.tripId
          )
        : "",

    customer: "",

    clientContactPerson:
      "",

    clientPhone: "",

    materialType: "",

    lsp: "",

    transporterContactPerson:
      "",

    transporterPhone:
      "",

    origin: "",

    destination: "",

    routeLocations: [],

    escortVehicleNumber:
      "",

    escortName: "",

    escortContactNumber:
      "",

    supervisorName: "",

    supervisorContact:
      "",

    estimatedTransitDays:
      "",

    totalKm: "",

    vehicles: [
      createVehicle(1),
    ],

    tripStatus:
      "Active",
  });


  /* =====================================
     LOAD NEXT TRIP ID
  ===================================== */

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    let cancelled =
      false;

    const loadTripId =
      async () => {
        setLoadingTripId(
          true
        );

        const tripId =
          await getNextTripIdFromDatabase();

        if (cancelled) {
          return;
        }

        setFormData(
          (previous) => ({
            ...previous,

            tripId,

            vehicles:
              previous.vehicles.map(
                (
                  vehicle,
                  index
                ) => ({
                  ...vehicle,

                  vehicleSubId:
                    `${tripId}-V${index + 1}`,
                })
              ),
          })
        );

        setLoadingTripId(
          false
        );
      };

    loadTripId();

    return () => {
      cancelled =
        true;
    };
  }, [
    isEditMode,
  ]);


  /* =====================================
     PREFILL EDIT DATA
  ===================================== */

  useEffect(() => {
    if (
      !isEditMode ||
      !editTrip
    ) {
      return;
    }

    const tripId =
      safeText(
        editTrip.tripId
      );

    const vehicles =
      Array.isArray(
        editTrip.vehicles
      ) &&
      editTrip.vehicles
        .length > 0
        ? editTrip.vehicles.map(
            (
              vehicle,
              index
            ) =>
              normalizeVehicleForForm(
                vehicle,
                index,
                tripId
              )
          )
        : [
            createVehicle(
              1,
              tripId
            ),
          ];


    const rawRouteLocations =
      editTrip.routeLocations ||
      editTrip.routeStops ||
      editTrip.checkpoints ||
      editTrip.waypoints ||
      [];


    const routeLocations =
      Array.isArray(
        rawRouteLocations
      )
        ? rawRouteLocations.map(
            (
              routeLocation,
              index
            ) => ({
              id:
                safeId(
                  routeLocation?._id
                ) ||
                safeText(
                  routeLocation?.id
                ) ||
                `trip-route-${index}`,

              name:
                typeof routeLocation ===
                "string"
                  ? routeLocation
                  : safeText(
                      routeLocation?.name ||
                      routeLocation?.location ||
                      routeLocation?.city ||
                      routeLocation?.place ||
                      routeLocation?.label
                    ),
            })
          )
        : [];


    setFormData({
      tripId,

      customer:
        safeText(
          editTrip.customer
        ),

      clientContactPerson:
        safeText(
          editTrip.clientContactPerson ||
          editTrip.customerContactPerson ||
          editTrip.contactPerson
        ),

      clientPhone:
        safeText(
          editTrip.clientPhone ||
          editTrip.customerPhone ||
          editTrip.contactNumber
        ),

      materialType:
        safeText(
          editTrip.materialType
        ),

      lsp:
        safeText(
          editTrip.lsp
        ),

      transporterContactPerson:
        safeText(
          editTrip.transporterContactPerson ||
          editTrip.lspContactPerson
        ),

      transporterPhone:
        safeText(
          editTrip.transporterPhone ||
          editTrip.lspPhone
        ),

      origin:
        safeText(
          editTrip.origin
        ),

      destination:
        safeText(
          editTrip.destination
        ),

      routeLocations,

      escortVehicleNumber:
        safeText(
          editTrip.escortVehicleNumber
        ),

      escortName:
        safeText(
          editTrip.escortName
        ),

      escortContactNumber:
        safeText(
          editTrip.escortContactNumber ||
          editTrip.escortPhone
        ),

      supervisorName:
        safeText(
          editTrip.supervisorName
        ),

      supervisorContact:
        safeText(
          editTrip.supervisorContact ||
          editTrip.supervisorPhone
        ),

      estimatedTransitDays:
        editTrip
          .estimatedTransitDays ??
        "",

      totalKm:
        editTrip.totalKm ??
        "",

      vehicles,

      tripStatus:
        safeText(
          editTrip.tripStatus,
          "Active"
        ) ||
        "Active",
    });
  }, [
    editTrip,
    isEditMode,
  ]);


  /* =====================================
     FORM CHANGE
  ===================================== */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } =
      event.target;

    setFormData(
      (previous) => ({
        ...previous,

        [name]:
          value,
      })
    );
  };


  /* =====================================
     VEHICLE CHANGE
  ===================================== */

  const handleVehicleChange = (
    vehicleId,
    event
  ) => {
    const {
      name,
      value,
    } =
      event.target;

    setFormData(
      (previous) => ({
        ...previous,

        vehicles:
          previous.vehicles.map(
            (vehicle) => {
              if (
                vehicle.id !==
                vehicleId
              ) {
                return vehicle;
              }

              const updatedVehicle = {
                ...vehicle,

                [name]:
                  value,
              };


              if (
                name ===
                "loadingPointOutDate"
              ) {
                updatedVehicle.currentDay =
                  calculateCurrentDay(
                    value
                  );
              }


              if (
                name ===
                  "status" &&
                value ===
                  "Reached"
              ) {
                updatedVehicle.speed =
                  0;
              }


              return updatedVehicle;
            }
          ),
      })
    );
  };


  /* =====================================
     ADD ROUTE LOCATION
  ===================================== */

  const handleAddRouteLocation =
    () => {
      setFormData(
        (previous) => ({
          ...previous,

          routeLocations: [
            ...(
              previous.routeLocations ||
              []
            ),

            {
              id:
                `trip-route-${Date.now()}-${Math.random()}`,

              name: "",
            },
          ],
        })
      );
    };


  /* =====================================
     ROUTE LOCATION CHANGE
  ===================================== */

  const handleRouteLocationChange = (
    locationId,
    value
  ) => {
    setFormData(
      (previous) => ({
        ...previous,

        routeLocations:
          (
            previous.routeLocations ||
            []
          ).map(
            (
              routeLocation
            ) =>
              routeLocation.id ===
              locationId
                ? {
                    ...routeLocation,

                    name:
                      value,
                  }
                : routeLocation
          ),
      })
    );
  };


  /* =====================================
     REMOVE ROUTE
  ===================================== */

  const handleRemoveRouteLocation = (
    locationId
  ) => {
    setFormData(
      (previous) => ({
        ...previous,

        routeLocations:
          (
            previous.routeLocations ||
            []
          ).filter(
            (
              routeLocation
            ) =>
              routeLocation.id !==
              locationId
          ),
      })
    );
  };


  /* =====================================
     ADD VEHICLE
  ===================================== */

  const handleAddVehicle =
    () => {
      setFormData(
        (previous) => {
          const nextIndex =
            previous
              .vehicles
              .length + 1;

          const vehicle =
            createVehicle(
              nextIndex,
              previous.tripId
            );

          return {
            ...previous,

            vehicles: [
              ...previous.vehicles,
              vehicle,
            ],
          };
        }
      );
    };


  /* =====================================
     REMOVE VEHICLE
  ===================================== */

  const handleRemoveVehicle = (
    vehicleId
  ) => {
    setFormData(
      (previous) => {
        if (
          previous
            .vehicles
            .length <= 1
        ) {
          return previous;
        }

        const remaining =
          previous
            .vehicles
            .filter(
              (
                vehicle
              ) =>
                vehicle.id !==
                vehicleId
            );

        return {
          ...previous,

          vehicles:
            remaining.map(
              (
                vehicle,
                index
              ) => ({
                ...vehicle,

                vehicleSubId:
                  `${previous.tripId}-V${index + 1}`,
              })
            ),
        };
      }
    );
  };


  /* =====================================
     PREPARE VEHICLE
  ===================================== */

  const prepareVehicle = (
    vehicle,
    index
  ) => ({
    vehicleSubId:
      safeText(
        vehicle.vehicleSubId
      ) ||
      `${formData.tripId}-V${index + 1}`,

    vehicleNumber:
      safeText(
        vehicle.vehicleNumber
      )
        .trim()
        .toUpperCase(),

    currentPosition:
      safeText(
        vehicle.currentPosition
      ).trim(),

    yesterdayPosition:
      safeText(
        vehicle.yesterdayPosition
      ).trim(),

    runningKm:
      Number(
        vehicle.runningKm ||
        0
      ),

    status:
      vehicle.status ||
      "Moving",

    currentDay:
      vehicle.currentDay ===
      ""
        ? null
        : Number(
            vehicle.currentDay
          ),

    latitude:
      vehicle.latitude ??
      null,

    longitude:
      vehicle.longitude ??
      null,

    speed:
      Number(
        vehicle.speed ||
        0
      ),

    lastUpdated:
      new Date()
        .toISOString(),


    /* LOADING */

    loadingStatus:
      vehicle.loadingStatus ||
      "Pending",

    loadingPointInDate:
      vehicle.loadingPointInDate ||
      null,

    loadingDate:
      vehicle.loadingDate ||
      null,

    loadingPointOutDate:
      vehicle.loadingPointOutDate ||
      null,

    loadingHaltingDays:
      Number(
        vehicle
          .loadingHaltingDays ||
        0
      ),

    loadingRemarks:
      safeText(
        vehicle.loadingRemarks
      ).trim(),


    /* UNLOADING */

    unloadingStatus:
      vehicle.unloadingStatus ||
      "Pending",

    unloadingPointInDate:
      vehicle.unloadingPointInDate ||
      null,

    unloadingDate:
      vehicle.unloadingDate ||
      null,

    unloadingPointOutDate:
      vehicle.unloadingPointOutDate ||
      null,

    unloadingHaltingDays:
      Number(
        vehicle
          .unloadingHaltingDays ||
        0
      ),

    unloadingRemarks:
      safeText(
        vehicle.unloadingRemarks
      ).trim(),


    /* LR */

    lrNo:
      safeText(
        vehicle.lrNo
      ).trim(),

    lrStatus:
      safeText(
        vehicle.lrStatus
      ).trim(),

    lrRemarks:
      safeText(
        vehicle.lrRemarks
      ).trim(),

    lrSignature:
      safeText(
        vehicle.lrSignature
      ).trim(),


    /* POD */

    podStatus:
      vehicle.podStatus ||
      "Pending",

    courierName:
      safeText(
        vehicle.courierName
      ).trim(),

    trackingId:
      safeText(
        vehicle.trackingId
      ).trim(),

    podCourierDate:
      vehicle.podCourierDate ||
      null,

    podRemarks:
      safeText(
        vehicle.podRemarks
      ).trim(),


    /* DRIVER */

    driverName:
      safeText(
        vehicle.driverName
      ).trim(),

    driverNumber:
      safeText(
        vehicle.driverNumber
      ).trim(),
  });


  /* =====================================
     SUBMIT
  ===================================== */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        isSaving ||
        loadingTripId
      ) {
        return;
      }


      if (
        !formData.tripId
      ) {
        alert(
          "Trip ID is not ready."
        );

        return;
      }


      const invalidVehicle =
        formData
          .vehicles
          .some(
            (
              vehicle
            ) =>
              !safeText(
                vehicle.vehicleNumber
              ).trim()
          );


      if (
        invalidVehicle
      ) {
        alert(
          "Please enter vehicle number for all vehicles."
        );

        return;
      }


      const vehicles =
        formData
          .vehicles
          .map(
            prepareVehicle
          );


      const finalData = {
        tripId:
          formData.tripId,

        customer:
          safeText(
            formData.customer
          ).trim(),

        clientContactPerson:
          safeText(
            formData.clientContactPerson
          ).trim(),

        clientPhone:
          safeText(
            formData.clientPhone
          ).trim(),

        materialType:
          safeText(
            formData.materialType
          ).trim(),

        lsp:
          safeText(
            formData.lsp
          ).trim(),

        transporterContactPerson:
          safeText(
            formData.transporterContactPerson
          ).trim(),

        transporterPhone:
          safeText(
            formData.transporterPhone
          ).trim(),

        origin:
          safeText(
            formData.origin
          ).trim(),

        destination:
          safeText(
            formData.destination
          ).trim(),

        routeLocations:
          (
            formData.routeLocations ||
            []
          )
            .map(
              (
                routeLocation
              ) =>
                safeText(
                  routeLocation?.name
                ).trim()
            )
            .filter(
              Boolean
            ),

        escortVehicleNumber:
          safeText(
            formData.escortVehicleNumber
          )
            .trim()
            .toUpperCase(),

        escortName:
          safeText(
            formData.escortName
          ).trim(),

        escortContactNumber:
          safeText(
            formData.escortContactNumber
          ).trim(),

        supervisorName:
          safeText(
            formData.supervisorName
          ).trim(),

        supervisorContact:
          safeText(
            formData.supervisorContact
          ).trim(),

        estimatedTransitDays:
          Number(
            formData
              .estimatedTransitDays ||
            0
          ),

        totalKm:
          Number(
            formData.totalKm ||
            0
          ),

        vehicles,

        tripStatus:
          formData.tripStatus ||
          "Active",
      };


      try {
        setIsSaving(
          true
        );


        const requestUrl =
          isEditMode
            ? `${API_URL}/${editMongoId}`
            : API_URL;


        const response =
          await fetch(
            requestUrl,
            {
              method:
                isEditMode
                  ? "PUT"
                  : "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  finalData
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
            (
              isEditMode
                ? "Unable to update trip."
                : "Unable to create trip."
            )
          );
        }


        alert(
          isEditMode
            ? `Trip ${formData.tripId} updated successfully.`
            : `Trip ${formData.tripId} created successfully.`
        );


        navigate(
          "/trip-details",
          {
            replace:
              true,
          }
        );
      } catch (
        error
      ) {
        console.error(
          isEditMode
            ? "Update Trip Error:"
            : "Create Trip Error:",
          error
        );

        alert(
          error.message ||
          "Unable to save trip."
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };


  /* =====================================
     PAGE TEXT
  ===================================== */

  const pageTitle =
    isEditMode
      ? "Update Trip"
      : "Create Trip";


  const pageDescription =
    isEditMode
      ? `Update tracking details for ${formData.tripId}.`
      : "Create a trip and manage tracking, loading, unloading, LR and POD for each vehicle.";


  /* =====================================
     RENDER
  ===================================== */

  return (
    <main
      className="tracking-input-page"
    >

      {/* =================================
          HEADER
      ================================= */}

      <header
        className="tracking-input-page-header"
      >
        <div>
          <span
            className="tracking-input-eyebrow"
          >
            FLEET OPERATIONS
          </span>

          <h1>
            {pageTitle}
          </h1>

          <p>
            {pageDescription}
          </p>
        </div>


        <button
          type="button"
          className="tracking-input-back"
          disabled={
            isSaving
          }
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


      <form
        className="tracking-master-form"
        onSubmit={
          handleSubmit
        }
      >

        {/* =================================
            TRIP INFORMATION
        ================================= */}

        <section
          className="tracking-form-card"
        >

          <CardHeader
            icon={
              <Route size={18} />
            }
            iconClass="blue"
            title="Trip Information"
            subtitle={
              isEditMode
                ? "Trip master information is locked while editing."
                : "Common information for all vehicles in this trip."
            }
          >
            <span
              className="tracking-trip-id-badge"
            >
              {loadingTripId
                ? "Generating..."
                : formData.tripId}
            </span>
          </CardHeader>


          <div
            className="tracking-form-card-body"
          >

            <div
              className="tracking-form-grid"
            >

              <FormField
                label="Trip ID"
                icon={
                  <Navigation
                    size={15}
                  />
                }
                readOnly
                value={
                  loadingTripId
                    ? "Generating..."
                    : formData.tripId
                }
              />


              <FormField
                label="Customer"
                icon={
                  <UserRound
                    size={15}
                  />
                }
                name="customer"
                value={
                  formData.customer
                }
                onChange={
                  handleChange
                }
                readOnly={
                  isEditMode
                }
                placeholder="Customer name"
              />


              <FormField
                label="Client Contact Person"
                icon={
                  <UserRound
                    size={15}
                  />
                }
                name="clientContactPerson"
                value={
                  formData.clientContactPerson
                }
                onChange={
                  handleChange
                }
                readOnly={
                  isEditMode
                }
                placeholder="Client contact person"
              />


              <FormField
                label="Client Phone No."
                icon={
                  <UserRound
                    size={15}
                  />
                }
                name="clientPhone"
                value={
                  formData.clientPhone
                }
                onChange={
                  handleChange
                }
                readOnly={
                  isEditMode
                }
                placeholder="Client phone number"
              />


              <FormField
                label="Type of Material"
                icon={
                  <Package
                    size={15}
                  />
                }
                name="materialType"
                value={
                  formData.materialType
                }
                onChange={
                  handleChange
                }
                readOnly={
                  isEditMode
                }
                placeholder="Material type"
              />


              <FormField
                label="LSP"
                icon={
                  <Building2
                    size={15}
                  />
                }
                name="lsp"
                value={
                  formData.lsp
                }
                onChange={
                  handleChange
                }
                readOnly={
                  isEditMode
                }
                placeholder="Logistics provider"
              />


              <FormField
                label="Transporter Contact Person"
                icon={
                  <Building2
                    size={15}
                  />
                }
                name="transporterContactPerson"
                value={
                  formData.transporterContactPerson
                }
                onChange={
                  handleChange
                }
                readOnly={
                  isEditMode
                }
                placeholder="Transporter contact person"
              />


              <FormField
                label="Transporter Phone No."
                icon={
                  <Building2
                    size={15}
                  />
                }
                name="transporterPhone"
                value={
                  formData.transporterPhone
                }
                onChange={
                  handleChange
                }
                readOnly={
                  isEditMode
                }
                placeholder="Transporter phone"
              />


              <FormField
                label="Origin"
                icon={
                  <MapPin
                    size={15}
                  />
                }
                name="origin"
                value={
                  formData.origin
                }
                onChange={
                  handleChange
                }
                readOnly={
                  isEditMode
                }
                placeholder="Origin"
              />


              <FormField
                label="Destination"
                icon={
                  <MapPin
                    size={15}
                  />
                }
                name="destination"
                value={
                  formData.destination
                }
                onChange={
                  handleChange
                }
                readOnly={
                  isEditMode
                }
                placeholder="Destination"
              />


              <FormField
                label="Total KM"
                type="number"
                min="0"
                icon={
                  <Gauge
                    size={15}
                  />
                }
                name="totalKm"
                value={
                  formData.totalKm
                }
                onChange={
                  handleChange
                }
                readOnly={
                  isEditMode
                }
                placeholder="Total KM"
              />


              <FormField
                label="Transit Days"
                type="number"
                min="0"
                icon={
                  <Clock3
                    size={15}
                  />
                }
                name="estimatedTransitDays"
                value={
                  formData
                    .estimatedTransitDays
                }
                onChange={
                  handleChange
                }
                readOnly={
                  isEditMode
                }
                placeholder="Transit days"
              />

            </div>


            {/* ROUTE LOCATIONS */}

            <div
              className="tracking-route-locations tracking-trip-route-locations"
            >

              <div
                className="tracking-route-locations-header"
              >
                <div>
                  <strong>
                    Trip Route Locations
                  </strong>

                  <span>
                    Add intermediate
                    locations between
                    origin and destination.
                  </span>
                </div>


                <button
                  type="button"
                  className="tracking-add-location-btn"
                  disabled={
                    isSaving
                  }
                  onClick={
                    handleAddRouteLocation
                  }
                >
                  <Plus size={14} />

                  Add Location
                </button>
              </div>


              <div
                className="tracking-route-location-flow"
              >
                <span
                  className="tracking-route-fixed-point origin"
                >
                  <MapPin size={12} />

                  {formData.origin ||
                    "Origin"}
                </span>


                {formData
                  .routeLocations
                  .map(
                    (
                      routeLocation,
                      index
                    ) => (
                      <React.Fragment
                        key={
                          routeLocation.id
                        }
                      >
                        <ChevronRight
                          size={13}
                          className="tracking-route-flow-arrow"
                        />

                        <span
                          className="tracking-route-location-chip"
                        >
                          {routeLocation.name ||
                            `Location ${index + 1}`}
                        </span>
                      </React.Fragment>
                    )
                  )}


                <ChevronRight
                  size={13}
                  className="tracking-route-flow-arrow"
                />


                <span
                  className="tracking-route-fixed-point destination"
                >
                  <MapPin size={12} />

                  {formData.destination ||
                    "Destination"}
                </span>
              </div>


              {formData
                .routeLocations
                .length > 0 ? (

                <div
                  className="tracking-route-location-list"
                >
                  {formData
                    .routeLocations
                    .map(
                      (
                        routeLocation,
                        index
                      ) => (
                        <div
                          className="tracking-route-location-row"
                          key={
                            routeLocation.id
                          }
                        >
                          <span
                            className="tracking-route-location-number"
                          >
                            {index + 1}
                          </span>


                          <div
                            className="tracking-route-location-input"
                          >
                            <MapPin
                              size={14}
                            />

                            <input
                              type="text"
                              value={
                                routeLocation.name
                              }
                              placeholder={
                                `Enter location ${index + 1}`
                              }
                              onChange={(
                                event
                              ) =>
                                handleRouteLocationChange(
                                  routeLocation.id,
                                  event.target.value
                                )
                              }
                            />
                          </div>


                          <button
                            type="button"
                            className="tracking-remove-location-btn"
                            onClick={() =>
                              handleRemoveRouteLocation(
                                routeLocation.id
                              )
                            }
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        </div>
                      )
                    )}
                </div>

              ) : (

                <div
                  className="tracking-route-location-empty"
                >
                  Click{" "}
                  <strong>
                    Add Location
                  </strong>{" "}
                  to add intermediate
                  route points.
                </div>

              )}

            </div>


            {/* ESCORT + SUPERVISOR */}

            <div
              className="tracking-trip-support-grid"
            >

              <SupportCard
                title="Escort Details"
                subtitle="Common escort information"
                icon={
                  <Truck size={15} />
                }
                className="escort"
              >
                <FormField
                  label="Escort Vehicle Number"
                  icon={
                    <Truck size={15} />
                  }
                  name="escortVehicleNumber"
                  value={
                    formData.escortVehicleNumber
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Escort vehicle"
                />

                <FormField
                  label="Escort Name"
                  icon={
                    <UserRound
                      size={15}
                    />
                  }
                  name="escortName"
                  value={
                    formData.escortName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Escort name"
                />

                <FormField
                  label="Escort Contact Number"
                  icon={
                    <UserRound
                      size={15}
                    />
                  }
                  name="escortContactNumber"
                  value={
                    formData.escortContactNumber
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Contact number"
                />
              </SupportCard>


              <SupportCard
                title="Supervisor Details"
                subtitle="Common supervisor information"
                icon={
                  <UserRound
                    size={15}
                  />
                }
                className="supervisor"
              >
                <FormField
                  label="Supervisor Name"
                  icon={
                    <UserRound
                      size={15}
                    />
                  }
                  name="supervisorName"
                  value={
                    formData.supervisorName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Supervisor name"
                />

                <FormField
                  label="Supervisor Contact"
                  icon={
                    <UserRound
                      size={15}
                    />
                  }
                  name="supervisorContact"
                  value={
                    formData.supervisorContact
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Contact number"
                />
              </SupportCard>

            </div>

          </div>
        </section>


        {/* =================================
            VEHICLES
        ================================= */}

        <section
          className="tracking-form-card"
        >

          <CardHeader
            icon={
              <Truck size={18} />
            }
            iconClass="indigo"
            title="Vehicle Details"
            subtitle="Tracking, loading, unloading, LR, POD and driver information."
          >
            {!isEditMode && (
              <button
                type="button"
                className="tracking-add-vehicle-btn"
                disabled={
                  isSaving ||
                  loadingTripId
                }
                onClick={
                  handleAddVehicle
                }
              >
                <Plus size={15} />

                Add Vehicle
              </button>
            )}
          </CardHeader>


          <div
            className="tracking-form-card-body"
          >
            <div
              className="tracking-vehicle-list"
            >

              {formData
                .vehicles
                .map(
                  (
                    vehicle,
                    index
                  ) => (
                    <article
                      key={
                        vehicle.id
                      }
                      className="tracking-vehicle-entry-card tracking-vehicle-expanded-card"
                    >

                      <div
                        className="tracking-vehicle-entry-header"
                      >
                        <div
                          className="tracking-vehicle-entry-title"
                        >
                          <span
                            className="tracking-vehicle-number-icon"
                          >
                            <Truck
                              size={15}
                            />
                          </span>

                          <div>
                            <strong>
                              Vehicle{" "}
                              {index + 1}
                            </strong>

                            <small>
                              {vehicle.vehicleSubId ||
                                `${formData.tripId}-V${index + 1}`}
                            </small>
                          </div>
                        </div>


                        {!isEditMode &&
                          formData
                            .vehicles
                            .length >
                            1 && (
                            <button
                              type="button"
                              className="tracking-remove-vehicle-btn"
                              onClick={() =>
                                handleRemoveVehicle(
                                  vehicle.id
                                )
                              }
                            >
                              <Trash2
                                size={14}
                              />

                              Remove
                            </button>
                          )}
                      </div>


                      {/* TRACKING */}

                      <VehicleSectionTitle
                        icon={
                          <Navigation
                            size={15}
                          />
                        }
                        title="Tracking Details"
                        type="tracking"
                      />


                      <div
                        className="tracking-vehicle-entry-grid"
                      >

                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Vehicle Number"
                          name="vehicleNumber"
                          required
                          readOnly={
                            isEditMode
                          }
                          icon={
                            <Truck
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="KA01AB1234"
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Current Position"
                          name="currentPosition"
                          icon={
                            <MapPin
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Current position"
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Yesterday Position"
                          name="yesterdayPosition"
                          icon={
                            <MapPin
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Yesterday position"
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Running KM"
                          name="runningKm"
                          type="number"
                          min="0"
                          icon={
                            <Gauge
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Running KM"
                        />


                        <VehicleSelect
                          vehicle={
                            vehicle
                          }
                          label="Movement Status"
                          name="status"
                          icon={
                            <Navigation
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
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
                          label="Current Day"
                          icon={
                            <CalendarDays
                              size={15}
                            />
                          }
                          readOnly
                          value={
                            vehicle.currentDay
                              ? `Day ${vehicle.currentDay}`
                              : "Waiting for Loading Point Out"
                          }
                        />

                      </div>


                      {/* LOADING */}

                      <VehicleSectionTitle
                        icon={
                          <Truck
                            size={15}
                          />
                        }
                        title="Loading Details"
                        type="loading"
                      />


                      <div
                        className="tracking-vehicle-entry-grid"
                      >

                        <VehicleSelect
                          vehicle={
                            vehicle
                          }
                          label="Loading Status"
                          name="loadingStatus"
                          icon={
                            <Truck
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          options={[
                            "Pending",
                            "At Loading Point",
                            "Loading",
                            "Loaded",
                            "Departed",
                          ]}
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Point In Date"
                          name="loadingPointInDate"
                          type="date"
                          icon={
                            <CalendarDays
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Loading Date"
                          name="loadingDate"
                          type="date"
                          icon={
                            <CalendarDays
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Point Out Date"
                          name="loadingPointOutDate"
                          type="date"
                          icon={
                            <CalendarDays
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Halting Days"
                          name="loadingHaltingDays"
                          type="number"
                          min="0"
                          icon={
                            <Clock3
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Days"
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Loading Remarks"
                          name="loadingRemarks"
                          icon={
                            <MessageSquareText
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Loading remarks"
                        />

                      </div>


                      {/* UNLOADING */}

                      <VehicleSectionTitle
                        icon={
                          <PackageCheck
                            size={15}
                          />
                        }
                        title="Unloading Details"
                        type="unloading"
                      />


                      <div
                        className="tracking-vehicle-entry-grid"
                      >

                        <VehicleSelect
                          vehicle={
                            vehicle
                          }
                          label="Unloading Status"
                          name="unloadingStatus"
                          icon={
                            <PackageCheck
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          options={[
                            "Pending",
                            "At Unloading Point",
                            "Unloading",
                            "Unloaded",
                            "Completed",
                          ]}
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Point In Date"
                          name="unloadingPointInDate"
                          type="date"
                          icon={
                            <CalendarDays
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Unloading Date"
                          name="unloadingDate"
                          type="date"
                          icon={
                            <CalendarDays
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Point Out Date"
                          name="unloadingPointOutDate"
                          type="date"
                          icon={
                            <CalendarDays
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Halting Days"
                          name="unloadingHaltingDays"
                          type="number"
                          min="0"
                          icon={
                            <Clock3
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Days"
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Unloading Remarks"
                          name="unloadingRemarks"
                          icon={
                            <MessageSquareText
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Unloading remarks"
                        />

                      </div>


                      {/* LR & POD */}

                      <VehicleSectionTitle
                        icon={
                          <FileText
                            size={15}
                          />
                        }
                        title="LR & POD Details"
                        type="document"
                      />


                      <div
                        className="tracking-vehicle-entry-grid"
                      >

                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="LR No."
                          name="lrNo"
                          icon={
                            <FileText
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="LR number"
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="LR Status"
                          name="lrStatus"
                          icon={
                            <FileText
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="LR status"
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="LR Signature"
                          name="lrSignature"
                          icon={
                            <FileSignature
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Received by"
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="LR Remarks"
                          name="lrRemarks"
                          icon={
                            <MessageSquareText
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="LR remarks"
                        />


                        <VehicleSelect
                          vehicle={
                            vehicle
                          }
                          label="POD Status"
                          name="podStatus"
                          icon={
                            <PackageCheck
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          options={[
                            "Pending",
                            "Received",
                            "Couriered",
                            "Delivered",
                          ]}
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Courier Name"
                          name="courierName"
                          icon={
                            <PackageCheck
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Courier name"
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Tracking ID"
                          name="trackingId"
                          icon={
                            <Navigation
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Tracking ID"
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="POD Courier Date"
                          name="podCourierDate"
                          type="date"
                          icon={
                            <CalendarDays
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="POD Remarks"
                          name="podRemarks"
                          icon={
                            <MessageSquareText
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="POD remarks"
                        />

                      </div>


                      {/* DRIVER */}

                      <VehicleSectionTitle
                        icon={
                          <UserRound
                            size={15}
                          />
                        }
                        title="Driver Details"
                        type="driver"
                      />


                      <div
                        className="tracking-vehicle-entry-grid"
                      >

                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Driver Name"
                          name="driverName"
                          icon={
                            <UserRound
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Driver name"
                        />


                        <VehicleField
                          vehicle={
                            vehicle
                          }
                          label="Driver Number"
                          name="driverNumber"
                          icon={
                            <UserRound
                              size={15}
                            />
                          }
                          onChange={
                            handleVehicleChange
                          }
                          placeholder="Driver contact number"
                        />

                      </div>

                    </article>
                  )
                )}

            </div>
          </div>

        </section>


        {/* =================================
            FOOTER
        ================================= */}

        <div
          className="tracking-form-footer"
        >

          <div
            className="tracking-create-summary"
          >
            <strong>
              {
                formData
                  .vehicles
                  .length
              }
            </strong>

            <span>
              {formData
                .vehicles
                .length ===
              1
                ? "Vehicle"
                : "Vehicles"}{" "}
              assigned to{" "}
              {formData.tripId ||
                "-"}
            </span>
          </div>


          <div
            className="tracking-form-footer-actions"
          >
            <button
              type="button"
              className="tracking-form-cancel"
              disabled={
                isSaving
              }
              onClick={() =>
                navigate(
                  "/trip-details"
                )
              }
            >
              Cancel
            </button>


            <button
              type="submit"
              className="tracking-form-save"
              disabled={
                isSaving ||
                loadingTripId
              }
            >
              <Save size={15} />

              <span>
                {isSaving
                  ? (
                      isEditMode
                        ? "Updating..."
                        : "Creating..."
                    )
                  : (
                      isEditMode
                        ? "Update Trip"
                        : "Create Trip"
                    )}
              </span>
            </button>
          </div>

        </div>

      </form>

    </main>
  );
};


/* =========================================
   CARD HEADER
========================================= */

const CardHeader = ({
  icon,
  iconClass,
  title,
  subtitle,
  children,
}) => (
  <div
    className="tracking-form-card-header"
  >
    <div
      className={
        `tracking-form-card-icon ${iconClass}`
      }
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


/* =========================================
   SUPPORT CARD
========================================= */

const SupportCard = ({
  title,
  subtitle,
  icon,
  className,
  children,
}) => (
  <div
    className={
      `tracking-trip-support-card ${className}`
    }
  >
    <div
      className="tracking-trip-support-heading"
    >
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

    <div
      className="tracking-form-grid"
    >
      {children}
    </div>
  </div>
);


/* =========================================
   NORMAL FIELD
========================================= */

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
  <div
    className="tracking-form-field"
  >
    <label>
      {label}

      {required && (
        <span>
          *
        </span>
      )}
    </label>

    <div
      className={
        `tracking-form-control ${
          readOnly
            ? "tracking-readonly-control"
            : ""
        }`
      }
    >
      {icon}

      <input
        type={
          type
        }
        name={
          name
        }
        value={
          value ?? ""
        }
        onChange={
          onChange
        }
        placeholder={
          placeholder
        }
        min={
          min
        }
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


/* =========================================
   VEHICLE FIELD
========================================= */

const VehicleField = ({
  vehicle,
  label,
  name,
  icon,
  type = "text",
  min,
  required = false,
  placeholder,
  onChange,
  readOnly = false,
}) => (
  <div
    className="tracking-form-field"
  >
    <label>
      {label}

      {required && (
        <span>
          *
        </span>
      )}
    </label>

    <div
      className={
        `tracking-form-control ${
          readOnly
            ? "tracking-readonly-control"
            : ""
        }`
      }
    >
      {icon}

      <input
        type={
          type
        }
        name={
          name
        }
        min={
          min
        }
        required={
          required
        }
        placeholder={
          placeholder
        }
        value={
          vehicle[name] ??
          ""
        }
        readOnly={
          readOnly
        }
        onChange={(
          event
        ) =>
          onChange(
            vehicle.id,
            event
          )
        }
      />
    </div>
  </div>
);


/* =========================================
   VEHICLE SELECT
========================================= */

const VehicleSelect = ({
  vehicle,
  label,
  name,
  icon,
  options = [],
  onChange,
}) => (
  <div
    className="tracking-form-field"
  >
    <label>
      {label}
    </label>

    <div
      className="tracking-form-control"
    >
      {icon}

      <select
        name={
          name
        }
        value={
          vehicle[name] ||
          options[0] ||
          ""
        }
        onChange={(
          event
        ) =>
          onChange(
            vehicle.id,
            event
          )
        }
      >
        {options.map(
          (
            option
          ) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {option}
            </option>
          )
        )}
      </select>
    </div>
  </div>
);


/* =========================================
   VEHICLE SECTION
========================================= */

const VehicleSectionTitle = ({
  icon,
  title,
  type,
}) => (
  <div
    className={
      `tracking-vehicle-subsection-title ${type}`
    }
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