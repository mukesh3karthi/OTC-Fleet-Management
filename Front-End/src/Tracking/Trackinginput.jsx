import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const API_URL =
  `${API_BASE_URL}/api/triptracking`;


/* =========================================
   CURRENT YEAR
========================================= */

const CURRENT_YEAR =
  new Date().getFullYear();


/* =========================================
   NEXT TRIP ID
========================================= */

const getNextTripId = () => {
  const storageKey =
    `trackingTripCounter-${CURRENT_YEAR}`;

  const storedCounter =
    Number(
      localStorage.getItem(
        storageKey
      ) || 0
    );

  const counter =
    storedCounter + 1;

  return {
    storageKey,
    counter,
    tripId:
      `${CURRENT_YEAR}-${counter}`,
  };
};


/* =========================================
   DATE FORMAT FOR INPUT
========================================= */

const formatDateForInput = (
  value
) => {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

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
   VEHICLE TEMPLATE
========================================= */

const createVehicle = (
  index
) => ({
  id:
    `${Date.now()}-${index}-${Math.random()}`,

  vehicleSubId: "",

  vehicleNumber: "",

  currentPosition: "",

  yesterdayPosition: "",

  runningKm: "",

  status: "Moving",

  currentDay: "",


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

  lrRemarks: "",

  lrSignature: "",


  /* POD */

  podStatus:
    "Pending",

  podCourierDate:
    "",

  podRemarks:
    "",
});


/* =========================================
   NORMALIZE VEHICLE FOR EDIT
========================================= */

const normalizeVehicleForForm = (
  vehicle,
  index,
  tripId
) => {
  const loadingOut =
    formatDateForInput(
      vehicle.loadingPointOutDate
    );

  return {
    id:
      vehicle._id ||
      vehicle.id ||
      vehicle.vehicleSubId ||
      `vehicle-${index}`,

    vehicleSubId:
      vehicle.vehicleSubId ||
      `${tripId}-V${index + 1}`,

    vehicleNumber:
      vehicle.vehicleNumber ||
      "",

    currentPosition:
      vehicle.currentPosition ||
      vehicle.currentLocation ||
      "",

    yesterdayPosition:
      vehicle.yesterdayPosition ||
      "",

    runningKm:
      vehicle.runningKm ??
      "",

    status:
      vehicle.status ||
      "Moving",

    currentDay:
      vehicle.currentDay ??
      calculateCurrentDay(
        loadingOut
      ),


    /* LOADING */

    loadingStatus:
      vehicle.loadingStatus ||
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
      vehicle.loadingRemarks ||
      "",


    /* UNLOADING */

    unloadingStatus:
      vehicle.unloadingStatus ||
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
      vehicle.unloadingRemarks ||
      "",


    /* LR */

    lrNo:
      vehicle.lrNo ||
      "",

    lrRemarks:
      vehicle.lrRemarks ||
      "",

    lrSignature:
      vehicle.lrSignature ||
      "",


    /* POD */

    podStatus:
      vehicle.podStatus ||
      "Pending",

    podCourierDate:
      formatDateForInput(
        vehicle.podCourierDate
      ),

    podRemarks:
      vehicle.podRemarks ||
      "",
  };
};


/* =========================================
   COMPONENT
========================================= */

const Trackinginput = () => {
  const navigate =
    useNavigate();

  const location =
    useLocation();


  /* =========================================
     EDIT MODE
  ========================================= */

  const editTrip =
    location.state?.trip ||
    null;

  const editMongoId =
    location.state?.mongoId ||
    editTrip?._id ||
    editTrip?.id ||
    null;

  const isEditMode =
    location.state?.mode ===
      "edit" &&
    Boolean(
      editTrip
    );


  /* =========================================
     SAVING
  ========================================= */

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);


  /* =========================================
     GENERATED TRIP
  ========================================= */

  const generatedTrip =
    useMemo(
      () =>
        getNextTripId(),
      []
    );


  /* =========================================
     INITIAL FORM
  ========================================= */

  const createInitialForm =
    () => ({
      tripId:
        generatedTrip.tripId,

      customer: "",

      materialType: "",

      lsp: "",

      origin: "",

      destination: "",

      estimatedTransitDays:
        "",

      totalKm: "",

      vehicles: [
        createVehicle(1),
      ],
    });


  const [
    formData,
    setFormData,
  ] = useState(
    createInitialForm
  );


  /* =========================================
     PREFILL EDIT DATA
  ========================================= */

  useEffect(() => {
    if (
      !isEditMode ||
      !editTrip
    ) {
      return;
    }

    const tripId =
      editTrip.tripId ||
      "";

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
            createVehicle(1),
          ];

    setFormData({
      tripId,

      customer:
        editTrip.customer ||
        "",

      materialType:
        editTrip.materialType ||
        "",

      lsp:
        editTrip.lsp ||
        "",

      origin:
        editTrip.origin ||
        "",

      destination:
        editTrip.destination ||
        "",

      estimatedTransitDays:
        editTrip
          .estimatedTransitDays ??
        "",

      totalKm:
        editTrip.totalKm ??
        "",

      vehicles,
    });

  }, [
    editTrip,
    isEditMode,
  ]);


  /* =========================================
     TRIP CHANGE
  ========================================= */

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


  /* =========================================
     VEHICLE CHANGE
  ========================================= */

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

              return updatedVehicle;
            }
          ),
      })
    );
  };


  /* =========================================
     ADD VEHICLE
  ========================================= */

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
              nextIndex
            );

          vehicle.vehicleSubId =
            `${previous.tripId}-V${nextIndex}`;

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


  /* =========================================
     REMOVE VEHICLE
  ========================================= */

  const handleRemoveVehicle = (
    vehicleId
  ) => {
    setFormData(
      (previous) => {
        if (
          previous
            .vehicles
            .length === 1
        ) {
          return previous;
        }

        const remaining =
          previous.vehicles.filter(
            (vehicle) =>
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


  /* =========================================
     SUBMIT
  ========================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      const invalidVehicle =
        formData.vehicles.some(
          (vehicle) =>
            !vehicle
              .vehicleNumber
              .trim()
        );

      if (invalidVehicle) {
        alert(
          "Please enter vehicle number for all vehicles."
        );

        return;
      }


      /* =====================================
         PREPARE VEHICLES
      ===================================== */

      const vehicles =
        formData.vehicles.map(
          (
            vehicle,
            index
          ) => ({
            vehicleSubId:
              vehicle.vehicleSubId ||
              `${formData.tripId}-V${index + 1}`,

            vehicleNumber:
              vehicle
                .vehicleNumber
                .trim()
                .toUpperCase(),

            currentPosition:
              vehicle
                .currentPosition
                .trim(),

            yesterdayPosition:
              vehicle
                .yesterdayPosition
                .trim(),

            runningKm:
              Number(
                vehicle.runningKm ||
                0
              ),

            status:
              vehicle.status,

            currentDay:
              vehicle.currentDay ===
              ""
                ? null
                : Number(
                    vehicle.currentDay
                  ),


            /* LOADING */

            loadingStatus:
              vehicle.loadingStatus,

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
              vehicle
                .loadingRemarks
                .trim(),


            /* UNLOADING */

            unloadingStatus:
              vehicle.unloadingStatus,

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
              vehicle
                .unloadingRemarks
                .trim(),


            /* LR */

            lrNo:
              vehicle.lrNo
                .trim(),

            lrRemarks:
              vehicle.lrRemarks
                .trim(),

            lrSignature:
              vehicle.lrSignature
                .trim(),


            /* POD */

            podStatus:
              vehicle.podStatus,

            podCourierDate:
              vehicle.podCourierDate ||
              null,

            podRemarks:
              vehicle.podRemarks
                .trim(),
          })
        );


      const finalData = {
        tripId:
          formData.tripId,

        customer:
          formData.customer
            .trim(),

        materialType:
          formData.materialType
            .trim(),

        lsp:
          formData.lsp
            .trim(),

        origin:
          formData.origin
            .trim(),

        destination:
          formData.destination
            .trim(),

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
          editTrip?.tripStatus ||
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

        const method =
          isEditMode
            ? "PUT"
            : "POST";

        const response =
          await fetch(
            requestUrl,
            {
              method,

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
          await response.json();

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

        if (!isEditMode) {
          localStorage.setItem(
            generatedTrip.storageKey,
            String(
              generatedTrip.counter
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
            replace: true,
          }
        );

      } catch (error) {
        console.error(
          isEditMode
            ? "Update Trip Error:"
            : "Create Trip Error:",
          error
        );

        alert(
          error.message ||
          (
            isEditMode
              ? "Unable to update trip."
              : "Unable to create trip."
          )
        );

      } finally {
        setIsSaving(
          false
        );
      }
    };


  /* =========================================
     PAGE TEXT
  ========================================= */

  const pageTitle =
    isEditMode
      ? "Update Trip"
      : "Create Trip";

  const pageDescription =
    isEditMode
      ? `Update vehicle tracking and operation details for ${formData.tripId}.`
      : "Create one trip and manage loading, unloading, LR and POD separately for every vehicle.";


  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="tracking-input-page">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <header className="tracking-input-page-header">

        <div>
          <span className="tracking-input-eyebrow">
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

        {/* =====================================
            TRIP INFORMATION
        ===================================== */}

        <section className="tracking-form-card">

          <CardHeader
            icon={
              <Route
                size={18}
              />
            }
            iconClass="blue"
            title="Trip Information"
            subtitle={
              isEditMode
                ? "Trip information is locked while updating vehicle details."
                : "Common information for every vehicle in this trip."
            }
          >

            <span className="tracking-trip-id-badge">
              {formData.tripId}
            </span>

          </CardHeader>


          <div className="tracking-form-card-body">

            <div className="tracking-form-grid">

              {/* TRIP ID */}

              <FormField
                label="Trip ID"
                icon={
                  <Navigation
                    size={15}
                  />
                }
                readOnly
                value={
                  formData.tripId
                }
              />


              {/* CUSTOMER */}

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


              {/* MATERIAL */}

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


              {/* LSP */}

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


              {/* ORIGIN */}

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


              {/* DESTINATION */}

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


              {/* TOTAL KM */}

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


              {/* TRANSIT DAYS */}

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

          </div>

        </section>


        {/* =====================================
            VEHICLE DETAILS
        ===================================== */}

        <section className="tracking-form-card">

          <CardHeader
            icon={
              <Truck
                size={18}
              />
            }
            iconClass="indigo"
            title="Vehicle Details"
            subtitle="Each vehicle has independent tracking, loading, unloading, LR and POD details."
          >

            {!isEditMode && (
              <button
                type="button"
                className="tracking-add-vehicle-btn"
                disabled={
                  isSaving
                }
                onClick={
                  handleAddVehicle
                }
              >
                <Plus
                  size={15}
                />

                Add Vehicle
              </button>
            )}

          </CardHeader>


          <div className="tracking-form-card-body">

            <div className="tracking-vehicle-list">

              {formData.vehicles.map(
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

                    {/* =================================
                        VEHICLE HEADER
                    ================================= */}

                    <div className="tracking-vehicle-entry-header">

                      <div className="tracking-vehicle-entry-title">

                        <span className="tracking-vehicle-number-icon">
                          <Truck
                            size={15}
                          />
                        </span>

                        <div>
                          <strong>
                            Vehicle {index + 1}
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
                          .length > 1 && (

                          <button
                            type="button"
                            className="tracking-remove-vehicle-btn"
                            disabled={
                              isSaving
                            }
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


                    {/* =================================
                        TRACKING
                    ================================= */}

                    <VehicleSectionTitle
                      icon={
                        <Navigation
                          size={15}
                        />
                      }
                      title="Tracking Details"
                      type="tracking"
                    />


                    <div className="tracking-vehicle-entry-grid">

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
                            : "Waiting for loading Point Out"
                        }
                      />

                    </div>


                    {/* =================================
                        LOADING
                    ================================= */}

                    <VehicleSectionTitle
                      icon={
                        <Truck
                          size={15}
                        />
                      }
                      title="Loading Details"
                      type="loading"
                    />


                    <div className="tracking-vehicle-entry-grid">

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


                    {/* =================================
                        UNLOADING
                    ================================= */}

                    <VehicleSectionTitle
                      icon={
                        <PackageCheck
                          size={15}
                        />
                      }
                      title="Unloading Details"
                      type="unloading"
                    />


                    <div className="tracking-vehicle-entry-grid">

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


                    {/* =================================
                        LR / POD
                    ================================= */}

                    <VehicleSectionTitle
                      icon={
                        <FileText
                          size={15}
                        />
                      }
                      title="LR & POD Details"
                      type="document"
                    />


                    <div className="tracking-vehicle-entry-grid">

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

                  </article>
                )
              )}

            </div>

          </div>

        </section>


        {/* =====================================
            FOOTER
        ===================================== */}

        <div className="tracking-form-footer">

          <div className="tracking-create-summary">

            <strong>
              {formData.vehicles.length}
            </strong>

            <span>
              {formData.vehicles.length === 1
                ? "Vehicle"
                : "Vehicles"}{" "}
              assigned to{" "}
              {formData.tripId}
            </span>

          </div>


          <div className="tracking-form-footer-actions">

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
                isSaving
              }
            >
              <Save
                size={15}
              />

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


/* =========================================
   NORMAL FORM FIELD
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
}) => (
  <div className="tracking-form-field">

    <label>
      {label}
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
  options,
  onChange,
}) => (
  <div className="tracking-form-field">

    <label>
      {label}
    </label>


    <div className="tracking-form-control">

      {icon}


      <select
        name={
          name
        }
        value={
          vehicle[name] ||
          options[0]
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
          (option) => (
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
   VEHICLE SECTION TITLE
========================================= */

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