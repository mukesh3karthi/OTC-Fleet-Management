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
  useNavigate,
} from "react-router-dom";

import "../Tracking/Trackinginput.css";


/* =========================================
   CURRENT YEAR
========================================= */

const CURRENT_YEAR =
  new Date().getFullYear();


/* =========================================
   GENERATE NEXT TRIP ID
========================================= */

const getNextTripId = () => {

  const storageKey =
    `trackingTripCounter-${CURRENT_YEAR}`;


  const currentCounter =
    Number(
      localStorage.getItem(
        storageKey
      ) || 0
    );


  const nextCounter =
    currentCounter + 1;


  return {
    storageKey,
    counter: nextCounter,
    tripId:
      `${CURRENT_YEAR}-${nextCounter}`,
  };

};


/* =========================================
   VEHICLE TEMPLATE
========================================= */

const createVehicle = (
  index
) => ({
  id:
    `${Date.now()}-${index}`,

  vehicleSubId: "",

  vehicleNumber: "",

  currentPosition: "",

  yesterdayPosition: "",

  runningKm: "",

  status: "Moving",

  currentDay: "",
});


/* =========================================
   DATE -> CURRENT DAY
========================================= */

const calculateCurrentDay = (
  loadingPointOutDate
) => {

  if (!loadingPointOutDate) {
    return "";
  }


  const start =
    new Date(
      `${loadingPointOutDate}T00:00:00`
    );


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  if (
    Number.isNaN(
      start.getTime()
    )
  ) {
    return "";
  }


  const difference =
    today.getTime() -
    start.getTime();


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


  /*
    Loading Point Out Date = Day 1
  */

  return days + 1;

};


/* =========================================
   COMPONENT
========================================= */

const Trackinginput = () => {

  const navigate =
    useNavigate();


  const generatedTrip =
    useMemo(
      () =>
        getNextTripId(),
      []
    );


  const [
    formData,
    setFormData,
  ] = useState({

    /* =====================================
       TRIP
    ===================================== */

    tripId:
      generatedTrip.tripId,

    customer: "",

    materialType: "",

    lsp: "",

    lrNo: "",

    origin: "",

    destination: "",

    estimatedTransitDays: "",

    totalKm: "",


    /* =====================================
       VEHICLES
    ===================================== */

    vehicles: [
      createVehicle(1),
    ],


    /* =====================================
       LOADING
    ===================================== */

    loadingPointInDate: "",

    loadingDate: "",

    loadingPointOutDate: "",

    loadingHaltingDays: "",

    loadingRemarks: "",


    /* =====================================
       UNLOADING
    ===================================== */

    unloadingPointInDate: "",

    unloadingDate: "",

    unloadingPointOutDate: "",

    unloadingHaltingDays: "",

    unloadingRemarks: "",


    /* =====================================
       LR / POD
    ===================================== */

    lrRemarks: "",

    lrSignature: "",

    podCourierDate: "",

    podRemarks: "",
  });


  /* =========================================
     CURRENT DAY
  ========================================= */

  const currentDay =
    useMemo(
      () =>
        calculateCurrentDay(
          formData.loadingPointOutDate
        ),
      [
        formData
          .loadingPointOutDate,
      ]
    );


  /* =========================================
     UPDATE CURRENT DAY FOR ALL VEHICLES
  ========================================= */

  useEffect(() => {

    setFormData(
      (previous) => ({
        ...previous,

        vehicles:
          previous.vehicles.map(
            (vehicle) => ({
              ...vehicle,

              currentDay:
                currentDay,
            })
          ),
      })
    );

  }, [
    currentDay,
  ]);


  /* =========================================
     NORMAL INPUT CHANGE
  ========================================= */

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      (previous) => ({
        ...previous,

        [name]:
          value,
      })
    );

  };


  /* =========================================
     VEHICLE INPUT CHANGE
  ========================================= */

  const handleVehicleChange = (
    vehicleId,
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      (previous) => ({
        ...previous,

        vehicles:
          previous.vehicles.map(
            (vehicle) =>

              vehicle.id ===
              vehicleId

                ? {
                    ...vehicle,

                    [name]:
                      value,
                  }

                : vehicle
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
            previous.vehicles.length +
            1;


          const newVehicle =
            createVehicle(
              nextIndex
            );


          newVehicle.vehicleSubId =
            `${previous.tripId}-V${nextIndex}`;


          newVehicle.currentDay =
            currentDay;


          return {
            ...previous,

            vehicles: [
              ...previous.vehicles,

              newVehicle,
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
          previous.vehicles.length <=
          1
        ) {

          return previous;

        }


        const filteredVehicles =
          previous.vehicles.filter(
            (vehicle) =>
              vehicle.id !==
              vehicleId
          );


        const updatedVehicles =
          filteredVehicles.map(
            (
              vehicle,
              index
            ) => ({
              ...vehicle,

              vehicleSubId:
                `${previous.tripId}-V${index + 1}`,
            })
          );


        return {
          ...previous,

          vehicles:
            updatedVehicles,
        };

      }
    );

  };


  /* =========================================
     INITIAL VEHICLE SUB ID
  ========================================= */

  useEffect(() => {

    setFormData(
      (previous) => ({
        ...previous,

        vehicles:
          previous.vehicles.map(
            (
              vehicle,
              index
            ) => ({
              ...vehicle,

              vehicleSubId:
                `${previous.tripId}-V${index + 1}`,
            })
          ),
      })
    );

  }, []);


  /* =========================================
     SUBMIT
  ========================================= */

  const handleSubmit = (
    event
  ) => {

    event.preventDefault();


    const hasEmptyVehicle =
      formData.vehicles.some(
        (vehicle) =>
          !vehicle.vehicleNumber
            .trim()
      );


    if (hasEmptyVehicle) {

      alert(
        "Please enter vehicle number for all vehicles."
      );

      return;
    }


    const finalData = {
      ...formData,

      vehicles:
        formData.vehicles.map(
          (
            vehicle,
            index
          ) => ({
            ...vehicle,

            vehicleSubId:
              `${formData.tripId}-V${index + 1}`,

            currentDay:
              currentDay,
          })
        ),
    };


    console.log(
      "Create Trip Data:",
      finalData
    );


    /*
      TEMPORARY FRONTEND COUNTER

      Once backend is connected,
      the backend should generate
      or validate this unique ID.
    */

    localStorage.setItem(
      generatedTrip.storageKey,

      String(
        generatedTrip.counter
      )
    );


    alert(
      `Trip ${formData.tripId} created successfully.`
    );


    navigate(
      "/tracking"
    );

  };


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
            Create Trip
          </h1>


          <p>
            Create one trip and assign
            multiple vehicles under the
            same consignment.
          </p>

        </div>


        <button
          type="button"
          className="tracking-input-back"
          onClick={() =>
            navigate(
              "/tracking"
            )
          }
        >

          <ArrowLeft
            size={16}
          />


          <span>
            Back to Tracking
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

          <div className="tracking-form-card-header">

            <div className="tracking-form-card-icon blue">

              <Route
                size={18}
              />

            </div>


            <div>

              <h2>
                Trip Information
              </h2>

              <p>
                Common information for
                all vehicles in this trip.
              </p>

            </div>


            <span className="tracking-trip-id-badge">

              {formData.tripId}

            </span>

          </div>


          <div className="tracking-form-card-body">

            <div className="tracking-form-grid">

              {/* TRIP ID */}

              <div className="tracking-form-field">

                <label>
                  Trip ID
                </label>


                <div className="tracking-form-control tracking-readonly-control">

                  <Navigation
                    size={15}
                  />


                  <input
                    type="text"
                    value={
                      formData.tripId
                    }
                    readOnly
                  />

                </div>

              </div>


              {/* CUSTOMER */}

              <div className="tracking-form-field">

                <label>
                  Customer
                </label>


                <div className="tracking-form-control">

                  <UserRound
                    size={15}
                  />


                  <input
                    type="text"
                    name="customer"
                    placeholder="Customer name"
                    value={
                      formData.customer
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              {/* MATERIAL */}

              <div className="tracking-form-field">

                <label>
                  Type of Material
                </label>


                <div className="tracking-form-control">

                  <Package
                    size={15}
                  />


                  <input
                    type="text"
                    name="materialType"
                    placeholder="Material type"
                    value={
                      formData.materialType
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              {/* LSP */}

              <div className="tracking-form-field">

                <label>
                  LSP
                </label>


                <div className="tracking-form-control">

                  <Building2
                    size={15}
                  />


                  <input
                    type="text"
                    name="lsp"
                    placeholder="Logistics provider"
                    value={
                      formData.lsp
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              {/* LR */}

              <div className="tracking-form-field">

                <label>
                  LR No.
                </label>


                <div className="tracking-form-control">

                  <FileText
                    size={15}
                  />


                  <input
                    type="text"
                    name="lrNo"
                    placeholder="LR number"
                    value={
                      formData.lrNo
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              {/* ORIGIN */}

              <div className="tracking-form-field">

                <label>
                  Origin
                </label>


                <div className="tracking-form-control">

                  <MapPin
                    size={15}
                  />


                  <input
                    type="text"
                    name="origin"
                    placeholder="Origin"
                    value={
                      formData.origin
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              {/* DESTINATION */}

              <div className="tracking-form-field">

                <label>
                  Destination
                </label>


                <div className="tracking-form-control">

                  <MapPin
                    size={15}
                  />


                  <input
                    type="text"
                    name="destination"
                    placeholder="Destination"
                    value={
                      formData.destination
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              {/* TOTAL KM */}

              <div className="tracking-form-field">

                <label>
                  Total KM
                </label>


                <div className="tracking-form-control">

                  <Gauge
                    size={15}
                  />


                  <input
                    type="number"
                    name="totalKm"
                    placeholder="Total KM"
                    min="0"
                    value={
                      formData.totalKm
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              {/* TRANSIT */}

              <div className="tracking-form-field">

                <label>
                  Transit Days
                </label>


                <div className="tracking-form-control">

                  <Clock3
                    size={15}
                  />


                  <input
                    type="number"
                    name="estimatedTransitDays"
                    placeholder="Transit days"
                    min="0"
                    value={
                      formData
                        .estimatedTransitDays
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================
            VEHICLES
        ===================================== */}

        <section className="tracking-form-card">

          <div className="tracking-form-card-header tracking-vehicle-section-header">

            <div className="tracking-form-card-icon indigo">

              <Truck
                size={18}
              />

            </div>


            <div>

              <h2>
                Vehicles
              </h2>

              <p>
                Add one or more vehicles
                for this trip.
              </p>

            </div>


            <button
              type="button"
              className="tracking-add-vehicle-btn"
              onClick={
                handleAddVehicle
              }
            >

              <Plus
                size={15}
              />

              <span>
                Add Vehicle
              </span>

            </button>

          </div>


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
                    className="tracking-vehicle-entry-card"
                  >

                    {/* HEADER */}

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
                            {formData.tripId}
                            -V{index + 1}
                          </small>

                        </div>

                      </div>


                      {formData
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

                          <span>
                            Remove
                          </span>

                        </button>

                      )}

                    </div>


                    {/* VEHICLE INPUTS */}

                    <div className="tracking-vehicle-entry-grid">

                      {/* NUMBER */}

                      <div className="tracking-form-field">

                        <label>
                          Vehicle Number
                          <span>*</span>
                        </label>


                        <div className="tracking-form-control">

                          <Truck
                            size={15}
                          />


                          <input
                            type="text"
                            name="vehicleNumber"
                            placeholder="KA01AB1234"
                            value={
                              vehicle.vehicleNumber
                            }
                            onChange={(
                              event
                            ) =>
                              handleVehicleChange(
                                vehicle.id,
                                event
                              )
                            }
                            required
                          />

                        </div>

                      </div>


                      {/* CURRENT POSITION */}

                      <div className="tracking-form-field">

                        <label>
                          Current Position
                        </label>


                        <div className="tracking-form-control">

                          <MapPin
                            size={15}
                          />


                          <input
                            type="text"
                            name="currentPosition"
                            placeholder="Current position"
                            value={
                              vehicle.currentPosition
                            }
                            onChange={(
                              event
                            ) =>
                              handleVehicleChange(
                                vehicle.id,
                                event
                              )
                            }
                          />

                        </div>

                      </div>


                      {/* YESTERDAY POSITION */}

                      <div className="tracking-form-field">

                        <label>
                          Yesterday Position
                        </label>


                        <div className="tracking-form-control">

                          <MapPin
                            size={15}
                          />


                          <input
                            type="text"
                            name="yesterdayPosition"
                            placeholder="Yesterday position"
                            value={
                              vehicle.yesterdayPosition
                            }
                            onChange={(
                              event
                            ) =>
                              handleVehicleChange(
                                vehicle.id,
                                event
                              )
                            }
                          />

                        </div>

                      </div>


                      {/* RUNNING KM */}

                      <div className="tracking-form-field">

                        <label>
                          Running KM
                        </label>


                        <div className="tracking-form-control">

                          <Gauge
                            size={15}
                          />


                          <input
                            type="number"
                            name="runningKm"
                            placeholder="Running KM"
                            min="0"
                            value={
                              vehicle.runningKm
                            }
                            onChange={(
                              event
                            ) =>
                              handleVehicleChange(
                                vehicle.id,
                                event
                              )
                            }
                          />

                        </div>

                      </div>


                      {/* STATUS */}

                      <div className="tracking-form-field">

                        <label>
                          Status
                        </label>


                        <div className="tracking-form-control">

                          <Navigation
                            size={15}
                          />


                          <select
                            name="status"
                            value={
                              vehicle.status
                            }
                            onChange={(
                              event
                            ) =>
                              handleVehicleChange(
                                vehicle.id,
                                event
                              )
                            }
                          >

                            <option value="Moving">
                              Moving
                            </option>

                            <option value="Idle">
                              Idle
                            </option>

                            <option value="Stopped">
                              Stopped
                            </option>

                            <option value="Breakdown">
                              Breakdown
                            </option>

                            <option value="Reached">
                              Reached
                            </option>

                          </select>

                        </div>

                      </div>


                      {/* CURRENT DAY */}

                      <div className="tracking-form-field">

                        <label>
                          Current Day
                        </label>


                        <div className="tracking-form-control tracking-readonly-control">

                          <CalendarDays
                            size={15}
                          />


                          <input
                            type="text"
                            value={
                              currentDay
                                ? `Day ${currentDay}`
                                : "Waiting for Point Out Date"
                            }
                            readOnly
                          />

                        </div>

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          </div>

        </section>


        {/* =====================================
            LOADING POINT
        ===================================== */}

        <section className="tracking-form-card operation-form-card loading">

          <div className="tracking-form-card-header">

            <div className="tracking-form-card-icon loading">

              <Truck
                size={18}
              />

            </div>


            <div>

              <h2>
                Loading Point
              </h2>

              <p>
                Common loading details
                for this trip.
              </p>

            </div>


            <span className="tracking-form-badge loading">
              Loading
            </span>

          </div>


          <div className="tracking-form-card-body">

            <div className="tracking-operation-primary">

              <div className="tracking-form-field">

                <label>
                  Point In Date
                </label>


                <div className="tracking-form-control">

                  <CalendarDays
                    size={15}
                  />


                  <input
                    type="date"
                    name="loadingPointInDate"
                    value={
                      formData
                        .loadingPointInDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="tracking-form-field">

                <label>
                  Loading Date
                </label>


                <div className="tracking-form-control">

                  <CalendarDays
                    size={15}
                  />


                  <input
                    type="date"
                    name="loadingDate"
                    value={
                      formData.loadingDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="tracking-form-field">

                <label>
                  Point Out Date
                </label>


                <div className="tracking-form-control">

                  <CalendarDays
                    size={15}
                  />


                  <input
                    type="date"
                    name="loadingPointOutDate"
                    value={
                      formData
                        .loadingPointOutDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

            </div>


            <div className="tracking-operation-secondary">

              <div className="tracking-form-field tracking-halting-field">

                <label>
                  Halting Days
                </label>


                <div className="tracking-form-control">

                  <Clock3
                    size={15}
                  />


                  <input
                    type="number"
                    name="loadingHaltingDays"
                    placeholder="Days"
                    min="0"
                    value={
                      formData
                        .loadingHaltingDays
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="tracking-form-field tracking-operation-remark">

                <label>
                  Remarks
                </label>


                <div className="tracking-form-control">

                  <MessageSquareText
                    size={15}
                  />


                  <input
                    type="text"
                    name="loadingRemarks"
                    placeholder="Loading remarks"
                    value={
                      formData.loadingRemarks
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================
            UNLOADING POINT
        ===================================== */}

        <section className="tracking-form-card operation-form-card unloading">

          <div className="tracking-form-card-header">

            <div className="tracking-form-card-icon unloading">

              <PackageCheck
                size={18}
              />

            </div>


            <div>

              <h2>
                Unloading Point
              </h2>

              <p>
                Common unloading details
                for this trip.
              </p>

            </div>


            <span className="tracking-form-badge unloading">
              Unloading
            </span>

          </div>


          <div className="tracking-form-card-body">

            <div className="tracking-operation-primary">

              <div className="tracking-form-field">

                <label>
                  Point In Date
                </label>


                <div className="tracking-form-control">

                  <CalendarDays
                    size={15}
                  />


                  <input
                    type="date"
                    name="unloadingPointInDate"
                    value={
                      formData
                        .unloadingPointInDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="tracking-form-field">

                <label>
                  Unloading Date
                </label>


                <div className="tracking-form-control">

                  <CalendarDays
                    size={15}
                  />


                  <input
                    type="date"
                    name="unloadingDate"
                    value={
                      formData.unloadingDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="tracking-form-field">

                <label>
                  Point Out Date
                </label>


                <div className="tracking-form-control">

                  <CalendarDays
                    size={15}
                  />


                  <input
                    type="date"
                    name="unloadingPointOutDate"
                    value={
                      formData
                        .unloadingPointOutDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

            </div>


            <div className="tracking-operation-secondary">

              <div className="tracking-form-field tracking-halting-field">

                <label>
                  Halting Days
                </label>


                <div className="tracking-form-control">

                  <Clock3
                    size={15}
                  />


                  <input
                    type="number"
                    name="unloadingHaltingDays"
                    placeholder="Days"
                    min="0"
                    value={
                      formData
                        .unloadingHaltingDays
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="tracking-form-field tracking-operation-remark">

                <label>
                  Remarks
                </label>


                <div className="tracking-form-control">

                  <MessageSquareText
                    size={15}
                  />


                  <input
                    type="text"
                    name="unloadingRemarks"
                    placeholder="Unloading remarks"
                    value={
                      formData
                        .unloadingRemarks
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================
            LR & POD
        ===================================== */}

        <section className="tracking-form-card">

          <div className="tracking-form-card-header">

            <div className="tracking-form-card-icon purple">

              <FileText
                size={18}
              />

            </div>


            <div>

              <h2>
                LR & POD Details
              </h2>

              <p>
                Document and delivery
                confirmation.
              </p>

            </div>

          </div>


          <div className="tracking-form-card-body">

            <div className="tracking-document-grid">

              <div className="tracking-form-field">

                <label>
                  LR Remarks
                </label>


                <div className="tracking-form-control">

                  <MessageSquareText
                    size={15}
                  />


                  <input
                    type="text"
                    name="lrRemarks"
                    placeholder="LR remarks"
                    value={
                      formData.lrRemarks
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="tracking-form-field">

                <label>
                  LR Signature
                </label>


                <div className="tracking-form-control">

                  <FileSignature
                    size={15}
                  />


                  <input
                    type="text"
                    name="lrSignature"
                    placeholder="Received by"
                    value={
                      formData.lrSignature
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="tracking-form-field">

                <label>
                  POD Courier Date
                </label>


                <div className="tracking-form-control">

                  <CalendarDays
                    size={15}
                  />


                  <input
                    type="date"
                    name="podCourierDate"
                    value={
                      formData
                        .podCourierDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="tracking-form-field">

                <label>
                  POD Remarks
                </label>


                <div className="tracking-form-control">

                  <MessageSquareText
                    size={15}
                  />


                  <input
                    type="text"
                    name="podRemarks"
                    placeholder="POD remarks"
                    value={
                      formData.podRemarks
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

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
              {formData.vehicles.length ===
              1
                ? "Vehicle"
                : "Vehicles"}
              {" "}assigned to{" "}
              {formData.tripId}
            </span>

          </div>


          <div className="tracking-form-footer-actions">

            <button
              type="button"
              className="tracking-form-cancel"
              onClick={() =>
                navigate(
                  "/tracking"
                )
              }
            >
              Cancel
            </button>


            <button
              type="submit"
              className="tracking-form-save"
            >

              <Save
                size={15}
              />


              <span>
                Create Trip
              </span>

            </button>

          </div>

        </div>

      </form>

    </main>

  );

};


export default Trackinginput;