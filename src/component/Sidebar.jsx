import React from "react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaBoxOpen,
  FaCar,
  FaExchangeAlt,
  FaFileAlt,
  FaMapMarkerAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTools,
  FaTruck,
  FaUsers,
  FaWarehouse,
} from "react-icons/fa";

import "../css/sidebar.css";


const Sidebar = ({
  collapsed,
}) => {
  const navigate =
    useNavigate();

  const location =
    useLocation();


  /* =========================================
     MENU ITEMS
  ========================================= */

  const menuItems = [
    {
      title: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/dashboard",
    },

    {
      title: "Intercarting",
      icon: <FaExchangeAlt />,
      path: "/intercartingdash",
    },

    {
      title: "Own Vehicle",
      icon: <FaCar />,
      path: "/ownvehicledetaildash",
    },

    {
      title: "Vehicle Documents",
      icon: <FaFileAlt />,
      path: "/vehicle-documents",
    },

    {
      title: "Assets",
      icon: <FaBoxOpen />,
      path: "/assets",
    },

    {
      title: "Tracking",
      icon: <FaMapMarkerAlt />,
      path: "/tracking",

      relatedPaths: [
        "/tracking",
        "/tracking-input",
        "/trip-details",
      ],
    },

    {
      title: "Inbound & Outbound",
      icon: <FaTruck />,
      path: "/inbound-outbound",
    },

    {
      title: "Warehouse",
      icon: <FaWarehouse />,
      path: "/warehouse",
    },

    {
      title: "Vehicle Maintenance",
      icon: <FaTools />,
      path: "/vehicle-maintenance",
    },

    {
      title: "Driver Management",
      icon: <FaUsers />,
      path: "/driver-management",
    },
  ];


  /* =========================================
     NORMALIZE PATH
  ========================================= */

  const normalizePath = (
    path
  ) => {
    const normalizedPath =
      String(
        path || ""
      )
        .toLowerCase()
        .replace(
          /\/+$/,
          ""
        );

    return (
      normalizedPath ||
      "/"
    );
  };


  /* =========================================
     ACTIVE MENU CHECK
  ========================================= */

  const isItemActive = (
    item
  ) => {
    const currentPath =
      normalizePath(
        location.pathname
      );


    /*
      Tracking has multiple
      related pages.
    */

    if (
      Array.isArray(
        item.relatedPaths
      )
    ) {
      return item.relatedPaths.some(
        (path) => {
          const relatedPath =
            normalizePath(
              path
            );

          return (
            currentPath ===
              relatedPath ||
            currentPath.startsWith(
              `${relatedPath}/`
            )
          );
        }
      );
    }


    const itemPath =
      normalizePath(
        item.path
      );


    /*
      Dashboard should only
      be active on exact dashboard.
    */

    if (
      itemPath ===
      "/dashboard"
    ) {
      return (
        currentPath ===
        "/dashboard"
      );
    }


    return (
      currentPath ===
        itemPath ||
      currentPath.startsWith(
        `${itemPath}/`
      )
    );
  };


  /* =========================================
     LOGOUT
  ========================================= */

  const handleLogout =
    () => {
      /* Main login */

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "username"
      );


      /* Intercarting */

      sessionStorage.removeItem(
        "intercartingLoggedIn"
      );


      /* Own Vehicle */

      sessionStorage.removeItem(
        "ownVehicleLoggedIn"
      );

      sessionStorage.removeItem(
        "ownVehicleUsername"
      );


      /* Tracking */

      sessionStorage.removeItem(
        "trackingLoggedIn"
      );

      sessionStorage.removeItem(
        "trackingUsername"
      );


      navigate(
        "/",
        {
          replace: true,
        }
      );
    };


  /* =========================================
     RENDER
  ========================================= */

  return (
    <aside
      className={`sidebar ${
        collapsed
          ? "collapsed"
          : ""
      }`}
    >

      {/* =====================================
          MENU
      ===================================== */}

      <nav className="sidebar-menu">

        {menuItems.map(
          (item) => {
            const active =
              isItemActive(
                item
              );

            return (
              <NavLink
                key={
                  item.path
                }
                to={
                  item.path
                }
                end={
                  item.path ===
                  "/dashboard"
                }
                className={`sidebar-link ${
                  active
                    ? "active"
                    : ""
                }`}
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                title={
                  collapsed
                    ? item.title
                    : undefined
                }
              >

                <span
                  className="sidebar-icon"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>


                <span className="sidebar-text">
                  {item.title}
                </span>

              </NavLink>
            );
          }
        )}

      </nav>


      {/* =====================================
          FOOTER / SIGN OUT
      ===================================== */}

      <div className="sidebar-footer">

        <button
          type="button"
          className="logout-button"
          onClick={
            handleLogout
          }
          title={
            collapsed
              ? "Sign Out"
              : undefined
          }
        >

          <span
            className="logout-icon"
            aria-hidden="true"
          >
            <FaSignOutAlt />
          </span>


          <span className="logout-text">
            Sign Out
          </span>

        </button>

      </div>

    </aside>
  );
};


export default Sidebar;