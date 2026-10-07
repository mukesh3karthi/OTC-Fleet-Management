import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";



import {

  createPortal,

} from "react-dom";



import {

  useNavigate,

} from "react-router-dom";



import axios from "axios";



import {

  ArrowLeft,

  ChevronLeft,

  ChevronRight,

  CircleCheck,

  PauseCircle,

  Plus,

  Search,

  Truck,

  Wrench,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";



import Addvehicles from "./Addvehicles";



import "../Intercartingcss/vehicledetails.css";



const API_BASE_URL = (

  import.meta.env.VITE_API_URL ||

  "http://localhost:5000"

).replace(/\/+$/, "");



const API_URL =

  `${API_BASE_URL}/api/vehicles`;



const API_OPTIONS = {

  timeout: 60000,

  headers: {

    "Content-Type":

      "application/json",

  },

};



const RECORDS_PER_PAGE = 10;



const getVehicleId = (vehicle) => {

  const rawId =

    vehicle?.id ??

    vehicle?.vehicleId ??

    null;



  if (

    rawId === null ||

    rawId === undefined ||

    rawId === ""

  ) {

    return null;

  }



  const numericId = Number(rawId);



  return Number.isInteger(numericId) &&

    numericId > 0

    ? numericId

    : null;

};



const getVehicleStatus = (

  vehicle

) => {

  const storedStatus = String(

    vehicle?.status || ""

  )

    .trim()

    .toLowerCase();



  if (

    storedStatus ===

    "maintenance"

  ) {

    return "Maintenance";

  }



  if (

    storedStatus ===

    "inactive" ||

    storedStatus ===

    "off duty" ||

    storedStatus ===

    "off-duty"

  ) {

    return "Inactive";

  }



  if (

    storedStatus === "active"

  ) {

    return "Active";

  }



  return vehicle?.activeStatus ===

    false

    ? "Inactive"

    : "Active";

};



const VehicleModal = ({

  children,

  onClose,

  disabled,

}) => {

  const modalRoot =

    document.getElementById(

      "modal-root"

    );



  if (!modalRoot) {

    console.error(

      'Add <div id="modal-root"></div> to index.html.'

    );



    return null;

  }



  const handleOverlayMouseDown = (

    event

  ) => {

    if (

      event.target ===

      event.currentTarget &&

      !disabled

    ) {

      onClose();

    }

  };



  return createPortal(

    <div

      className="vehicle-modal-overlay"

      onMouseDown={

        handleOverlayMouseDown

      }

    >

      <div

        className="vehicle-modal-container"

        role="dialog"

        aria-modal="true"

        aria-label="Vehicle details"

      >

        {children}

      </div>

    </div>,

    modalRoot

  );

};



const ACTION_MENU_WIDTH = 155;

const ACTION_MENU_HEIGHT = 106;

const ACTION_MENU_SPACING = 8;

const SCREEN_PADDING = 10;



const Vehicletable = ({

  vehicles = [],

  currentPage = 1,

  recordsPerPage = 5,

  onEdit,

  onDelete,

  loading = false,

}) => {

  const [selectedVehicle, setSelectedVehicle] =

    useState(null);



  const [openMenuKey, setOpenMenuKey] =

    useState(null);



  const [menuPosition, setMenuPosition] =

    useState({

      top: 0,

      left: 0,

    });



  const menuRef = useRef(null);

  const menuButtonRef = useRef(null);



  const safeCurrentPage = Math.max(

    Number(currentPage) || 1,

    1

  );



  const safeRecordsPerPage = Math.max(

    Number(recordsPerPage) || 5,

    1

  );



  const indexOfLast =

    safeCurrentPage *

    safeRecordsPerPage;



  const indexOfFirst =

    indexOfLast -

    safeRecordsPerPage;



  const currentVehicles = vehicles.slice(

    indexOfFirst,

    indexOfLast

  );



  const getVehicleId = (vehicle) => {

    const rawId =

      vehicle?.id ??

      vehicle?.vehicleId ??

      null;



    if (

      rawId === null ||

      rawId === undefined ||

      rawId === ""

    ) {

      return null;

    }



    const numericId = Number(rawId);



    return Number.isInteger(numericId) &&

      numericId > 0

      ? numericId

      : null;

  };



  const getVehicleKey = (

    vehicle,

    index

  ) => {

    return String(

      vehicle?._id ??

      vehicle?.id ??

      vehicle?.vehicleId ??

      `${vehicle?.vehicleNumber || "vehicle"}-${indexOfFirst + index}`

    );

  };



  const getVehicleStatus = (vehicle) => {

    const storedStatus = String(

      vehicle?.status || ""

    )

      .trim()

      .toLowerCase();



    if (

      storedStatus === "maintenance"

    ) {

      return "Maintenance";

    }



    if (

      storedStatus === "inactive" ||

      storedStatus === "off duty" ||

      storedStatus === "off-duty"

    ) {

      return "Inactive";

    }



    if (storedStatus === "active") {

      return "Active";

    }



    return vehicle?.activeStatus ===

      false

      ? "Inactive"

      : "Active";

  };



  const getStatusClassName = (

    status

  ) => {

    switch (status) {

      case "Active":

        return "status-active";



      case "Maintenance":

        return "status-maintenance";



      default:

        return "status-inactive";

    }

  };



  const formatDate = (dateValue) => {

    if (!dateValue) {

      return "-";

    }



    const normalizedDate = String(

      dateValue

    ).slice(0, 10);



    const parsedDate = new Date(

      `${normalizedDate}T00:00:00`

    );



    if (

      Number.isNaN(

        parsedDate.getTime()

      )

    ) {

      return String(dateValue);

    }



    return parsedDate.toLocaleDateString(

      "en-IN",

      {

        day: "2-digit",

        month: "short",

        year: "numeric",

      }

    );

  };



  const formatCurrency = (amount) => {

    if (

      amount === undefined ||

      amount === null ||

      amount === ""

    ) {

      return "-";

    }



    const numericAmount =

      Number(amount);



    if (

      Number.isNaN(numericAmount)

    ) {

      return String(amount);

    }



    return `₹${numericAmount.toLocaleString(

      "en-IN"

    )}`;

  };



  const closeMenu = () => {

    setOpenMenuKey(null);

    setSelectedVehicle(null);

    menuButtonRef.current = null;

  };



  const calculateMenuPosition = (

    buttonElement

  ) => {

    const buttonRect =

      buttonElement.getBoundingClientRect();



    let left =

      buttonRect.right -

      ACTION_MENU_WIDTH;



    let top =

      buttonRect.bottom +

      ACTION_MENU_SPACING;



    if (

      left + ACTION_MENU_WIDTH >

      window.innerWidth -

      SCREEN_PADDING

    ) {

      left =

        window.innerWidth -

        ACTION_MENU_WIDTH -

        SCREEN_PADDING;

    }



    if (left < SCREEN_PADDING) {

      left = SCREEN_PADDING;

    }



    if (

      top + ACTION_MENU_HEIGHT >

      window.innerHeight -

      SCREEN_PADDING

    ) {

      top =

        buttonRect.top -

        ACTION_MENU_HEIGHT -

        ACTION_MENU_SPACING;

    }



    if (top < SCREEN_PADDING) {

      top = SCREEN_PADDING;

    }



    return {

      top,

      left,

    };

  };



  const handleMenuClick = (

    event,

    vehicle,

    vehicleKey

  ) => {

    event.stopPropagation();



    if (

      openMenuKey === vehicleKey

    ) {

      closeMenu();

      return;

    }



    menuButtonRef.current =

      event.currentTarget;



    setSelectedVehicle(vehicle);



    setMenuPosition(

      calculateMenuPosition(

        event.currentTarget

      )

    );



    setOpenMenuKey(vehicleKey);

  };



  useEffect(() => {

    const handleOutsideClick = (

      event

    ) => {

      const clickedInsideMenu =

        menuRef.current?.contains(

          event.target

        );



      const clickedMenuButton =

        menuButtonRef.current?.contains(

          event.target

        );



      if (

        !clickedInsideMenu &&

        !clickedMenuButton

      ) {

        closeMenu();

      }

    };



    const handleEscape = (event) => {

      if (event.key === "Escape") {

        closeMenu();

      }

    };



    const handleViewportChange =

      () => {

        closeMenu();

      };



    document.addEventListener(

      "mousedown",

      handleOutsideClick

    );



    document.addEventListener(

      "keydown",

      handleEscape

    );



    window.addEventListener(

      "scroll",

      handleViewportChange,

      true

    );



    window.addEventListener(

      "resize",

      handleViewportChange

    );



    return () => {

      document.removeEventListener(

        "mousedown",

        handleOutsideClick

      );



      document.removeEventListener(

        "keydown",

        handleEscape

      );



      window.removeEventListener(

        "scroll",

        handleViewportChange,

        true

      );



      window.removeEventListener(

        "resize",

        handleViewportChange

      );

    };

  }, []);



  useEffect(() => {

    closeMenu();

  }, [

    safeCurrentPage,

    vehicles,

  ]);



  const handleEdit = () => {

    if (

      selectedVehicle &&

      typeof onEdit === "function"

    ) {

      onEdit(selectedVehicle);

    }



    closeMenu();

  };



  const handleDelete = () => {

    if (

      !selectedVehicle ||

      typeof onDelete !== "function"

    ) {

      closeMenu();

      return;

    }



    const vehicleId =

      getVehicleId(

        selectedVehicle

      );



    if (vehicleId === null) {

      console.error(

        "Vehicle cannot be deleted because its ID is missing.",

        selectedVehicle

      );



      closeMenu();

      return;

    }



    onDelete(vehicleId);

    closeMenu();

  };



  return (

    <>

      <div className="table-wrapper">

        <table className="vehicle-table">

          <thead>

            <tr>

              <th scope="col">S.No</th>

              <th scope="col">

                Vehicle No

              </th>

              <th scope="col">

                Site Name

              </th>

              <th scope="col">

                Vehicle Type

              </th>

              <th scope="col">

                Transport Provider

              </th>

              <th scope="col">

                Diesel Scope

              </th>

              <th scope="col">

                Vehicle In Date

              </th>

              <th scope="col">

                Vehicle Out Date

              </th>

              <th scope="col">

                Driver Name

              </th>

              <th scope="col">

                Driver Number

              </th>

              <th scope="col">

                Vendor Name

              </th>

              <th scope="col">

                Vendor Email

              </th>

              <th scope="col">

                Manufacturing Year

              </th>

              <th scope="col">

                Hire Amount

              </th>

              <th scope="col">

                Status

              </th>

              <th

                scope="col"

                className="action-header"

              >

                Actions

              </th>

            </tr>

          </thead>



          <tbody>

            {loading ? (

              <tr>

                <td

                  colSpan={16}

                  className="no-data"

                >

                  <span className="table-loading">

                    Loading vehicles...

                  </span>

                </td>

              </tr>

            ) : currentVehicles.length >

              0 ? (

              currentVehicles.map(

                (vehicle, index) => {

                  const vehicleKey =

                    getVehicleKey(

                      vehicle,

                      index

                    );



                  const vehicleStatus =

                    getVehicleStatus(

                      vehicle

                    );



                  return (

                    <tr key={vehicleKey}>

                      <td>

                        {indexOfFirst +

                          index +

                          1}

                      </td>



                      <td className="vehicle-number-cell">

                        {vehicle.vehicleNumber ||

                          "-"}

                      </td>



                      <td>

                        {vehicle.siteName ||

                          "-"}

                      </td>



                      <td>

                        {vehicle.vehicleType ||

                          "-"}

                      </td>



                      <td>

                        {vehicle.transportProvider ||

                          "-"}

                      </td>



                      <td>

                        {vehicle.dieselScope ||

                          "-"}

                      </td>



                      <td>

                        {formatDate(

                          vehicle.vehicleInDate

                        )}

                      </td>



                      <td>

                        {formatDate(

                          vehicle.vehicleOutDate

                        )}

                      </td>



                      <td>

                        {vehicle.driverName ||

                          "-"}

                      </td>



                      <td>

                        {vehicle.driverNumber ||

                          "-"}

                      </td>



                      <td>

                        {vehicle.vendorName ||

                          "-"}

                      </td>



                      <td>

                        {vehicle.vendorEmail ||

                          "-"}

                      </td>



                      <td>

                        {vehicle.manufacturingYear ||

                          "-"}

                      </td>



                      <td>

                        {formatCurrency(

                          vehicle.hireAmount

                        )}

                      </td>



                      <td>

                        <span

                          className={`vehicle-status-badge ${getStatusClassName(

                            vehicleStatus

                          )}`}

                        >

                          {vehicleStatus}

                        </span>

                      </td>



                      <td className="action-cell">

                        <button

                          ref={

                            openMenuKey ===

                              vehicleKey

                              ? menuButtonRef

                              : null

                          }

                          type="button"

                          className={`menu-btn ${openMenuKey ===

                            vehicleKey

                            ? "menu-btn-active"

                            : ""

                            }`}

                          aria-label={`Open actions for ${vehicle.vehicleNumber ||

                            "vehicle"

                            }`}

                          aria-haspopup="menu"

                          aria-expanded={

                            openMenuKey ===

                            vehicleKey

                          }

                          onClick={(

                            event

                          ) =>

                            handleMenuClick(

                              event,

                              vehicle,

                              vehicleKey

                            )

                          }

                        >

                          <MoreVertical

                            size={18}

                            aria-hidden="true"

                          />

                        </button>

                      </td>

                    </tr>

                  );

                }

              )

            ) : (

              <tr>

                <td

                  colSpan={16}

                  className="no-data"

                >

                  No vehicles found

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>



      {openMenuKey !== null &&

        selectedVehicle &&

        createPortal(

          <div

            ref={menuRef}

            className="action-menu-portal"

            style={{

              top: `${menuPosition.top}px`,

              left: `${menuPosition.left}px`,

            }}

            role="menu"

            aria-label={`Actions for ${selectedVehicle.vehicleNumber ||

              "vehicle"

              }`}

            onMouseDown={(event) =>

              event.stopPropagation()

            }

          >

            <button

              type="button"

              role="menuitem"

              onClick={handleEdit}

            >

              <Pencil

                size={17}

                aria-hidden="true"

              />



              <span>Edit</span>

            </button>



            <button

              type="button"

              role="menuitem"

              className="delete-btn"

              onClick={handleDelete}

            >

              <Trash2

                size={17}

                aria-hidden="true"

              />



              <span>Delete</span>

            </button>

          </div>,

          document.body

        )}

    </>

  );

};

const Vehicledetails = () => {

  const navigate =

    useNavigate();



  const [vehicles, setVehicles] =

    useState([]);



  const [search, setSearch] =

    useState("");



  const [status, setStatus] =

    useState("All Status");



  const [

    currentPage,

    setCurrentPage,

  ] = useState(1);



  const [

    selectedVehicle,

    setSelectedVehicle,

  ] = useState(null);



  const [

    openModal,

    setOpenModal,

  ] = useState(false);



  const [loading, setLoading] =

    useState(false);



  const [

    savingVehicle,

    setSavingVehicle,

  ] = useState(false);



  const [

    deletingVehicleId,

    setDeletingVehicleId,

  ] = useState(null);



  const [

    pageError,

    setPageError,

  ] = useState("");



  const fetchVehicles = async () => {

    try {

      setLoading(true);

      setPageError("");



      const response =

        await axios.get(

          API_URL,

          API_OPTIONS

        );



      const vehicleList =

        Array.isArray(

          response.data?.vehicles

        )

          ? response.data.vehicles

          : Array.isArray(

            response.data?.data

          )

            ? response.data.data

            : Array.isArray(

              response.data

            )

              ? response.data

              : [];



      setVehicles(vehicleList);

    } catch (error) {

      console.error(

        "Fetch vehicles error:",

        error.response?.data ||

        error.message

      );



      setVehicles([]);



      setPageError(

        error.response?.data

          ?.message ||

        error.message ||

        "Unable to load vehicles."

      );

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchVehicles();

  }, []);



  useEffect(() => {

    if (!openModal) {

      document.body.classList.remove(

        "modal-open"

      );



      document.documentElement.classList.remove(

        "modal-open"

      );



      return undefined;

    }



    document.body.classList.add(

      "modal-open"

    );



    document.documentElement.classList.add(

      "modal-open"

    );



    const handleEscape = (

      event

    ) => {

      if (

        event.key === "Escape" &&

        !savingVehicle

      ) {

        setOpenModal(false);

        setSelectedVehicle(null);

      }

    };



    document.addEventListener(

      "keydown",

      handleEscape

    );



    return () => {

      document.body.classList.remove(

        "modal-open"

      );



      document.documentElement.classList.remove(

        "modal-open"

      );



      document.removeEventListener(

        "keydown",

        handleEscape

      );

    };

  }, [

    openModal,

    savingVehicle,

  ]);



  const openAddVehicleModal =

    () => {

      setPageError("");

      setSelectedVehicle(null);

      setOpenModal(true);

    };



  const handleEditVehicle = (

    vehicle

  ) => {

    setPageError("");

    setSelectedVehicle(vehicle);

    setOpenModal(true);

  };



  const closeVehicleModal =

    () => {

      if (savingVehicle) {

        return;

      }



      setOpenModal(false);

      setSelectedVehicle(null);

    };



  const handleSaveVehicle = async (

    vehicleData

  ) => {

    if (savingVehicle) {

      return;

    }



    try {

      setSavingVehicle(true);

      setPageError("");



      if (selectedVehicle) {

        const vehicleId =

          getVehicleId(

            selectedVehicle

          );



        if (

          vehicleId === null ||

          vehicleId === undefined ||

          vehicleId === ""

        ) {

          throw new Error(

            "Vehicle ID is missing."

          );

        }



        await axios.put(

          `${API_URL}/${vehicleId}`,

          vehicleData,

          API_OPTIONS

        );

      } else {

        await axios.post(

          API_URL,

          vehicleData,

          API_OPTIONS

        );



        setCurrentPage(1);

      }



      await fetchVehicles();



      setOpenModal(false);

      setSelectedVehicle(null);

    } catch (error) {

      console.error(

        "Save vehicle error:",

        error.response?.data ||

        error.message

      );



      const message =

        error.response?.data

          ?.message ||

        error.message ||

        "Unable to save vehicle.";



      setPageError(message);



      throw error;

    } finally {

      setSavingVehicle(false);

    }

  };



  const handleDeleteVehicle =

    async (vehicleId) => {

      if (

        vehicleId === null ||

        vehicleId === undefined ||

        vehicleId === ""

      ) {

        setPageError(

          "Vehicle ID is missing."

        );



        return;

      }



      const confirmed =

        window.confirm(

          "Are you sure you want to delete this vehicle?"

        );



      if (!confirmed) {

        return;

      }



      try {

        setDeletingVehicleId(

          vehicleId

        );



        setPageError("");



        await axios.delete(

          `${API_URL}/${vehicleId}`,

          API_OPTIONS

        );



        await fetchVehicles();

      } catch (error) {

        console.error(

          "Delete vehicle error:",

          error.response?.data ||

          error.message

        );



        setPageError(

          error.response?.data

            ?.message ||

          error.message ||

          "Unable to delete vehicle."

        );

      } finally {

        setDeletingVehicleId(

          null

        );

      }

    };



  const normalizedSearch =

    search

      .trim()

      .toLowerCase();



  const filteredVehicles =

    useMemo(() => {

      return vehicles.filter(

        (vehicle) => {

          const searchableValues = [

            vehicle.vehicleNumber,

            vehicle.siteName,

            vehicle.driverName,

            vehicle.driverNumber,

            vehicle.vehicleType,

            vehicle.transportProvider,

            vehicle.vendorName,

            vehicle.vendorEmail,

            vehicle.dieselScope,

            vehicle.manufacturingYear,

          ].map((value) =>

            String(value ?? "")

              .trim()

              .toLowerCase()

          );



          const matchesSearch =

            !normalizedSearch ||

            searchableValues.some(

              (value) =>

                value.includes(

                  normalizedSearch

                )

            );



          const matchesStatus =

            status ===

            "All Status" ||

            getVehicleStatus(

              vehicle

            ) === status;



          return (

            matchesSearch &&

            matchesStatus

          );

        }

      );

    }, [

      vehicles,

      normalizedSearch,

      status,

    ]);



  useEffect(() => {

    setCurrentPage(1);

  }, [search, status]);



  const totalRecords =

    filteredVehicles.length;



  const totalPages = Math.max(

    1,

    Math.ceil(

      totalRecords /

      RECORDS_PER_PAGE

    )

  );



  useEffect(() => {

    if (

      currentPage >

      totalPages

    ) {

      setCurrentPage(

        totalPages

      );

    }

  }, [

    currentPage,

    totalPages,

  ]);



  const firstVisibleRecord =

    totalRecords === 0

      ? 0

      : (currentPage - 1) *

      RECORDS_PER_PAGE +

      1;



  const lastVisibleRecord =

    Math.min(

      currentPage *

      RECORDS_PER_PAGE,

      totalRecords

    );



  const statistics =

    useMemo(

      () => [

        {

          title:

            "Total Vehicles",

          value:

            vehicles.length,

          subtitle:

            "Registered Vehicles",

          icon: (

            <Truck size={24} />

          ),

          className: "blue",

        },

        {

          title:

            "Active On-Road",

          value:

            vehicles.filter(

              (vehicle) =>

                getVehicleStatus(

                  vehicle

                ) === "Active"

            ).length,

          subtitle:

            "Active Vehicles",

          icon: (

            <CircleCheck

              size={24}

            />

          ),

          className: "green",

        },

        {

          title:

            "In Maintenance",

          value:

            vehicles.filter(

              (vehicle) =>

                getVehicleStatus(

                  vehicle

                ) ===

                "Maintenance"

            ).length,

          subtitle:

            "Maintenance Vehicles",

          icon: (

            <Wrench size={24} />

          ),

          className: "orange",

        },

        {

          title: "Off-Duty",

          value:

            vehicles.filter(

              (vehicle) =>

                getVehicleStatus(

                  vehicle

                ) ===

                "Inactive"

            ).length,

          subtitle:

            "Inactive Vehicles",

          icon: (

            <PauseCircle

              size={24}

            />

          ),

          className: "red",

        },

      ],

      [vehicles]

    );



  return (

    <main className="vehicle-page">

      <div className="vehicle-breadcrumb">

        Fleet Management

        <span>/</span>

        Inventory

      </div>



      <header className="vehicle-header">

        <div className="vehicle-title-section">

          <button

            type="button"

            className="vehicle-back-button"

            onClick={() =>

              navigate(

                "/intercartingdash/intercarting"

              )

            }

            aria-label="Back"

          >

            <ArrowLeft

              size={20}

            />

          </button>



          <div>

            <h1>

              Vehicle Inventory

            </h1>



            <p className="vehicle-header-subtitle">

              Manage registered fleet

              vehicles and asset

              information.

            </p>

          </div>

        </div>



        <div className="vehicle-header-actions">

          <label className="vehicle-search-box">

            <Search size={18} />



            <input

              type="search"

              placeholder="Search vehicle, site or driver..."

              value={search}

              onChange={(event) =>

                setSearch(

                  event.target.value

                )

              }

            />

          </label>



          <button

            type="button"

            className="register-btn"

            onClick={

              openAddVehicleModal

            }

            disabled={

              loading ||

              savingVehicle

            }

          >

            <Plus size={18} />



            <span>

              Add Vehicle

            </span>

          </button>

        </div>

      </header>



      <section className="vehicle-stats-grid">

        {statistics.map(

          (item) => (

            <article

              className="vehicle-stat-card"

              key={item.title}

            >

              <div className="vehicle-stat-content">

                <div>

                  <p className="vehicle-stat-title">

                    {item.title}

                  </p>



                  <h2>

                    {item.value}

                  </h2>



                  <p className="vehicle-stat-subtitle">

                    {

                      item.subtitle

                    }

                  </p>

                </div>



                <div

                  className={`vehicle-stat-icon ${item.className}`}

                >

                  {item.icon}

                </div>

              </div>

            </article>

          )

        )}

      </section>



      <section className="vehicle-asset-card">

        <div className="vehicle-asset-header">

          <div className="vehicle-asset-left">

            <div>

              <h2>Asset List</h2>



            </div>



            <label className="vehicle-status-filter">




              <select

                value={status}

                onChange={(event) =>

                  setStatus(

                    event.target.value

                  )

                }

              >

                <option value="All Status">

                  All Status

                </option>



                <option value="Active">

                  Active

                </option>



                <option value="Maintenance">

                  Maintenance

                </option>



                <option value="Inactive">

                  Inactive

                </option>

              </select>

            </label>

          </div>

        </div>



        {pageError && (

          <div

            className="vehicle-page-error"

            role="alert"

          >

            <span>

              {pageError}

            </span>



            <button

              type="button"

              onClick={() =>

                setPageError("")

              }

            >

              ×

            </button>

          </div>

        )}



        <Vehicletable

          vehicles={

            filteredVehicles

          }

          currentPage={

            currentPage

          }

          recordsPerPage={

            RECORDS_PER_PAGE

          }

          onEdit={

            handleEditVehicle

          }

          onDelete={

            handleDeleteVehicle

          }

          loading={loading}

          deletingVehicleId={

            deletingVehicleId

          }

        />



        <footer className="vehicle-pagination">

          <p>

            Showing{" "}

            <strong>

              {firstVisibleRecord}

            </strong>

            –

            <strong>

              {lastVisibleRecord}

            </strong>{" "}

            of{" "}

            <strong>

              {totalRecords}

            </strong>{" "}

            vehicles

          </p>



          <div className="vehicle-page-buttons">

            <button

              type="button"

              onClick={() =>

                setCurrentPage(

                  (page) =>

                    Math.max(

                      page - 1,

                      1

                    )

                )

              }

              disabled={

                currentPage === 1

              }

            >

              <ChevronLeft

                size={18}

              />

            </button>



            {Array.from(

              {

                length:

                  totalPages,

              },

              (_, index) =>

                index + 1

            ).map(

              (pageNumber) => (

                <button

                  type="button"

                  key={

                    pageNumber

                  }

                  className={

                    currentPage ===

                      pageNumber

                      ? "active"

                      : ""

                  }

                  onClick={() =>

                    setCurrentPage(

                      pageNumber

                    )

                  }

                >

                  {pageNumber}

                </button>

              )

            )}



            <button

              type="button"

              onClick={() =>

                setCurrentPage(

                  (page) =>

                    Math.min(

                      page + 1,

                      totalPages

                    )

                )

              }

              disabled={

                currentPage ===

                totalPages

              }

            >

              <ChevronRight

                size={18}

              />

            </button>

          </div>

        </footer>

      </section>



      {openModal && (

        <VehicleModal

          onClose={

            closeVehicleModal

          }

          disabled={

            savingVehicle

          }

        >

          <Addvehicles

            vehicle={

              selectedVehicle

            }

            onSave={

              handleSaveVehicle

            }

            closeModal={

              closeVehicleModal

            }

            saving={

              savingVehicle

            }

          />

        </VehicleModal>

      )}

    </main>

  );

};



export default Vehicledetails;