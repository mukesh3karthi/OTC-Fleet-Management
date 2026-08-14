import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  CirclePause,
  Clock3,
  Navigation,
  Plus,
  Search,
  X,
} from "lucide-react";

import TripListColumn from "../Tracking/TripListColumn";
import VehicleColumn from "../Tracking/VehicleColumn";
import TrackingMapColumn from "../Tracking/TrackingMapColumn";
import Trackinglogin from "../Loginpage/Trackinglogin";

import "../pagescss/tracking.css";


/* =========================================
   SAMPLE TRIP DATA
========================================= */

const tripData = [
  {
    id: 1,

    tripId: "2026-1",

    customer: "Hydraulic Transport",

    materialType: "Steel Coil",

    origin: "Bangalore",

    destination: "Chennai",

    tripDate: "2026-08-07",

    vehicles: [
      {
        id: 1,

        vehicleNumber: "GJ06AX5788",

        status: "Moving",

        currentLocation: "Vellore",

        speed: 52,

        lastUpdated: "2 min ago",

        latitude: 12.9165,

        longitude: 79.1325,
      },

      {
        id: 2,

        vehicleNumber: "MH46DC6140",

        status: "Moving",

        currentLocation: "Krishnagiri",

        speed: 48,

        lastUpdated: "3 min ago",

        latitude: 12.5266,

        longitude: 78.2149,
      },

      {
        id: 3,

        vehicleNumber: "GJ12BT1765",

        status: "Idle",

        currentLocation: "Hosur",

        speed: 0,

        lastUpdated: "5 min ago",

        latitude: 12.7409,

        longitude: 77.8253,
      },

      {
        id: 4,

        vehicleNumber: "RJ09GB7010",

        status: "Moving",

        currentLocation: "Sriperumbudur",

        speed: 44,

        lastUpdated: "1 min ago",

        latitude: 12.9675,

        longitude: 79.9419,
      },

      {
        id: 5,

        vehicleNumber: "RJ09GC0253",

        status: "Stopped",

        currentLocation: "Bangalore Warehouse",

        speed: 0,

        lastUpdated: "8 min ago",

        latitude: 12.9716,

        longitude: 77.5946,
      },
    ],
  },


  {
    id: 2,

    tripId: "2026-2",

    customer: "OTC Logistics",

    materialType: "Heavy Machinery",

    origin: "Hosur",

    destination: "Hyderabad",

    tripDate: "2026-08-07",

    vehicles: [
      {
        id: 1,

        vehicleNumber: "TN88AB1023",

        status: "Moving",

        currentLocation: "Anantapur",

        speed: 51,

        lastUpdated: "2 min ago",

        latitude: 14.6819,

        longitude: 77.6006,
      },

      {
        id: 2,

        vehicleNumber: "KA01MN8812",

        status: "Idle",

        currentLocation: "Chikkaballapur",

        speed: 0,

        lastUpdated: "6 min ago",

        latitude: 13.4355,

        longitude: 77.7315,
      },

      {
        id: 3,

        vehicleNumber: "TN22CD4521",

        status: "Moving",

        currentLocation: "Kurnool",

        speed: 46,

        lastUpdated: "1 min ago",

        latitude: 15.8281,

        longitude: 78.0373,
      },
    ],
  },


  {
    id: 3,

    tripId: "2026-3",

    customer: "National Engineering",

    materialType: "Fabrication Material",

    origin: "Chennai",

    destination: "Coimbatore",

    tripDate: "2026-08-07",

    vehicles: [
      {
        id: 1,

        vehicleNumber: "TN09GT5512",

        status: "Reached",

        currentLocation: "Coimbatore",

        speed: 0,

        lastUpdated: "10 min ago",

        latitude: 11.0168,

        longitude: 76.9558,
      },

      {
        id: 2,

        vehicleNumber: "TN11BK7712",

        status: "Moving",

        currentLocation: "Avinashi",

        speed: 42,

        lastUpdated: "2 min ago",

        latitude: 11.1926,

        longitude: 77.268,
      },
    ],
  },
];


/* =========================================
   STATUS FILTERS
========================================= */

const statusOptions = [
  "All",
  "Moving",
  "Idle",
  "Stopped",
  "Reached",
];


/* =========================================
   TRACKING COMPONENT
========================================= */

const Tracking = () => {

  /* =========================================
     SEARCH
  ========================================= */

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");


  /* =========================================
     MOVEMENT FILTER
  ========================================= */

  const [
    movementFilter,
    setMovementFilter,
  ] = useState("All");


  /* =========================================
     DATE FILTER
  ========================================= */

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    "2026-08-07"
  );


  /* =========================================
     SELECTED TRIP
  ========================================= */

  const [
    selectedTripId,
    setSelectedTripId,
  ] = useState(
    tripData[0].id
  );


  /* =========================================
     SELECTED VEHICLE
  ========================================= */

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState(
    tripData[0]
      .vehicles[0].id
  );


  /* =========================================
     TRACKING LOGIN POPUP
  ========================================= */

  const [
    showTrackingLogin,
    setShowTrackingLogin,
  ] = useState(false);


  /* =========================================
     FILTER TRIPS
  ========================================= */

  const filteredTrips =
    useMemo(() => {

      const search =
        searchTerm
          .trim()
          .toLowerCase();


      return tripData.filter(
        (trip) => {

          const searchFields = [
            trip.tripId,
            trip.customer,
            trip.materialType,
            trip.origin,
            trip.destination,

            ...trip.vehicles.map(
              (vehicle) =>
                vehicle.vehicleNumber
            ),
          ];


          /* SEARCH */

          const matchesSearch =
            !search ||
            searchFields.some(
              (value) =>
                String(
                  value || ""
                )
                  .toLowerCase()
                  .includes(
                    search
                  )
            );


          /* DATE */

          const matchesDate =
            !selectedDate ||
            trip.tripDate ===
              selectedDate;


          /* STATUS */

          const matchesStatus =
            movementFilter ===
              "All" ||
            trip.vehicles.some(
              (vehicle) =>
                vehicle.status ===
                movementFilter
            );


          return (
            matchesSearch &&
            matchesDate &&
            matchesStatus
          );

        }
      );

    }, [
      searchTerm,
      selectedDate,
      movementFilter,
    ]);


  /* =========================================
     GET SELECTED TRIP
  ========================================= */

  const selectedTrip =
    filteredTrips.find(
      (trip) =>
        trip.id ===
        selectedTripId
    ) ||
    filteredTrips[0] ||
    null;


  /* =========================================
     KEEP SELECTED VEHICLE VALID
  ========================================= */

  useEffect(() => {

    if (
      !selectedTrip ||
      !selectedTrip.vehicles?.length
    ) {

      setSelectedVehicleId(
        null
      );

      return;
    }


    const vehicleExists =
      selectedTrip.vehicles.some(
        (vehicle) =>
          vehicle.id ===
          selectedVehicleId
      );


    if (!vehicleExists) {

      setSelectedVehicleId(
        selectedTrip
          .vehicles[0].id
      );

    }

  }, [
    selectedTrip,
    selectedVehicleId,
  ]);


  /* =========================================
     GET SELECTED VEHICLE
  ========================================= */

  const selectedVehicle =
    selectedTrip?.vehicles?.find(
      (vehicle) =>
        vehicle.id ===
        selectedVehicleId
    ) ||
    selectedTrip?.vehicles?.[0] ||
    null;


  /* =========================================
     STATUS CLASS
  ========================================= */

  const getStatusClass = (
    status
  ) => {

    return String(
      status || ""
    )
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );

  };


  /* =========================================
     STATUS ICON
  ========================================= */

  const getStatusIcon = (
    status
  ) => {

    if (
      status === "Moving"
    ) {

      return (
        <Navigation
          size={13}
        />
      );

    }


    if (
      status === "Reached"
    ) {

      return (
        <CheckCircle2
          size={13}
        />
      );

    }


    if (
      status === "Idle"
    ) {

      return (
        <Clock3
          size={13}
        />
      );

    }


    return (
      <CirclePause
        size={13}
      />
    );

  };


  /* =========================================
     SELECT TRIP
  ========================================= */

  const handleTripSelect = (
    trip
  ) => {

    setSelectedTripId(
      trip.id
    );


    if (
      trip.vehicles?.length
    ) {

      setSelectedVehicleId(
        trip.vehicles[0].id
      );

    } else {

      setSelectedVehicleId(
        null
      );

    }

  };


  /* =========================================
     DATA ENTRY BUTTON
  ========================================= */

  const handleDataEntry = () => {

    /*
      Data Entry first opens
      the Tracking Login popup.
    */

    setShowTrackingLogin(
      true
    );

  };


  /* =========================================
     CLOSE LOGIN
  ========================================= */

  const handleTrackingLoginClose =
    () => {

      setShowTrackingLogin(
        false
      );

    };


  /* =========================================
     LOGIN SUCCESS
  ========================================= */

  const handleTrackingLoginSuccess =
    () => {

      /*
        Trackinglogin.jsx will navigate
        to /tracking-input.

        Here we only close the modal.
      */

      setShowTrackingLogin(
        false
      );

    };


  /* =========================================
     RENDER
  ========================================= */

  return (

    <main className="tracking-page">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <header className="tracking-header">

        <div className="tracking-header-content">

          <span className="tracking-eyebrow">
            FLEET OPERATIONS
          </span>


          <h1>
            Vehicle Tracking
          </h1>


          <p>
            Track trips and multiple
            vehicles travelling under
            the same consignment.
          </p>

        </div>


        <button
          type="button"
          className="tracking-data-entry-button"
          onClick={
            handleDataEntry
          }
        >

          <Plus
            size={16}
          />


          <span>
            Data Entry
          </span>

        </button>

      </header>


      {/* =====================================
          TOOLBAR
      ===================================== */}

      <section className="tracking-toolbar">

        {/* =================================
            SEARCH
        ================================= */}

        <div className="tracking-search">

          <Search
            size={18}
          />


          <input
            type="search"
            placeholder="Search trip, customer or vehicle..."
            value={
              searchTerm
            }
            onChange={(
              event
            ) =>
              setSearchTerm(
                event.target.value
              )
            }
          />


          {searchTerm && (

            <button
              type="button"
              className="tracking-search-clear"
              onClick={() =>
                setSearchTerm("")
              }
              aria-label="Clear search"
            >

              <X
                size={15}
              />

            </button>

          )}

        </div>


        {/* =================================
            STATUS FILTER
        ================================= */}

        <div className="tracking-status-filter">

          {statusOptions.map(
            (status) => (

              <button
                type="button"
                key={
                  status
                }
                className={
                  movementFilter ===
                  status
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMovementFilter(
                    status
                  )
                }
              >

                {status !==
                  "All" &&
                  getStatusIcon(
                    status
                  )}


                <span>
                  {status}
                </span>

              </button>

            )
          )}

        </div>


        {/* =================================
            DATE
        ================================= */}

        <label className="tracking-date">

          <CalendarDays
            size={17}
          />


          <input
            type="date"
            value={
              selectedDate
            }
            onChange={(
              event
            ) =>
              setSelectedDate(
                event.target.value
              )
            }
          />

        </label>

      </section>


      {/* =====================================
          MAIN TRACKING LAYOUT
      ===================================== */}

      <section className="tracking-layout">

        {/* =================================
            TRIP LIST
        ================================= */}

        <TripListColumn
          trips={
            filteredTrips
          }
          selectedTrip={
            selectedTrip
          }
          onSelectTrip={
            handleTripSelect
          }
        />


        {/* =================================
            VEHICLE DETAILS
        ================================= */}

        <VehicleColumn
          trip={
            selectedTrip
          }
          selectedVehicle={
            selectedVehicle
          }
          onSelectVehicle={
            setSelectedVehicleId
          }
          getStatusClass={
            getStatusClass
          }
          getStatusIcon={
            getStatusIcon
          }
        />


        {/* =================================
            VEHICLE MAP
        ================================= */}

        <TrackingMapColumn
          trip={
            selectedTrip
          }
          selectedVehicle={
            selectedVehicle
          }
          onSelectVehicle={
            setSelectedVehicleId
          }
          getStatusClass={
            getStatusClass
          }
        />

      </section>


      {/* =====================================
          TRACKING LOGIN POPUP
      ===================================== */}

      {showTrackingLogin && (

        <Trackinglogin
          onClose={
            handleTrackingLoginClose
          }
          onLoginSuccess={
            handleTrackingLoginSuccess
          }
        />

      )}

    </main>

  );

};


export default Tracking;