import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import "../Intercartingcss/Vehicletable.css";

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

  const getVehicleId = (vehicle) =>
    vehicle?._id ?? vehicle?.id ?? null;

  const getVehicleKey = (
    vehicle,
    index
  ) => {
    const vehicleId =
      getVehicleId(vehicle);

    if (vehicleId !== null) {
      return String(vehicleId);
    }

    return [
      vehicle?.vehicleNumber || "vehicle",
      vehicle?.driverNumber || "driver",
      indexOfFirst + index,
    ].join("-");
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
                          className={`menu-btn ${
                            openMenuKey ===
                            vehicleKey
                              ? "menu-btn-active"
                              : ""
                          }`}
                          aria-label={`Open actions for ${
                            vehicle.vehicleNumber ||
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
            aria-label={`Actions for ${
              selectedVehicle.vehicleNumber ||
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

export default Vehicletable;