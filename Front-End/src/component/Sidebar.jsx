import React, {
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaBoxOpen,
  FaCar,
  FaDatabase,
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

import Intercarttinglogin
  from "../Loginpage/Intercartinglogin";

import Ownvehiclelogin
  from "../Loginpage/Ownvehiclelogin";

import Trackinglogin
  from "../Loginpage/Trackinglogin";

import "../css/sidebar.css";


const MOBILE_BREAKPOINT = 560;


const Sidebar = ({
  collapsed,
  setCollapsed,
}) => {

  const navigate =
    useNavigate();

  const location =
    useLocation();


  /* =========================================
     LOGIN POPUPS
  ========================================= */

  const [
    showIntercartingLogin,
    setShowIntercartingLogin,
  ] = useState(false);


  const [
    showOwnVehicleLogin,
    setShowOwnVehicleLogin,
  ] = useState(false);


  const [
    showTrackingLogin,
    setShowTrackingLogin,
  ] = useState(false);


  /* =========================================
     MOBILE CHECK
  ========================================= */

  const isMobile = () => {

    return (
      window.innerWidth <=
      MOBILE_BREAKPOINT
    );

  };


  /* =========================================
     CLOSE SIDEBAR ON MOBILE
  ========================================= */

  const closeMobileSidebar =
    () => {

      if (
        isMobile() &&
        typeof setCollapsed ===
          "function"
      ) {

        setCollapsed(true);

      }

    };


  /* =========================================
     OPEN LOGIN POPUPS
     FROM ROUTE STATE
  ========================================= */

  useEffect(() => {

    const state =
      location.state || {};


    if (
      state.openOwnVehicleLogin
    ) {

      setShowOwnVehicleLogin(
        true
      );


      navigate(
        location.pathname,
        {
          replace: true,
          state: {},
        }
      );


      return;

    }


    if (
      state.openIntercartingLogin
    ) {

      setShowIntercartingLogin(
        true
      );


      navigate(
        location.pathname,
        {
          replace: true,
          state: {},
        }
      );


      return;

    }


    if (
      state.openTrackingLogin
    ) {

      setShowTrackingLogin(
        true
      );


      navigate(
        location.pathname,
        {
          replace: true,
          state: {},
        }
      );

    }

  }, [
    location.pathname,
    location.state,
    navigate,
  ]);


  /* =========================================
     CLEAR LOGIN SESSION
  ========================================= */

  useEffect(() => {

    if (
      location.pathname ===
      "/ownvehicledetaildash"
    ) {

      sessionStorage.removeItem(
        "ownVehicleLoggedIn"
      );

      sessionStorage.removeItem(
        "ownVehicleUsername"
      );

    }


    if (
      location.pathname ===
      "/tracking"
    ) {

      sessionStorage.removeItem(
        "trackingLoggedIn"
      );

      sessionStorage.removeItem(
        "trackingUsername"
      );

    }


    if (
      location.pathname ===
      "/intercartingdash"
    ) {

      sessionStorage.removeItem(
        "intercartingLoggedIn"
      );

      sessionStorage.removeItem(
        "intercartingUsername"
      );

    }

  }, [
    location.pathname,
  ]);


  /* =========================================
     OPERATIONS MENU
  ========================================= */

  const operationsMenu = [

    {
      title: "Dashboard",
      icon:
        <FaTachometerAlt />,
      path: "/dashboard",
    },

    {
      title: "Intercarting",
      icon:
        <FaExchangeAlt />,
      path:
        "/intercartingdash",
      dataEntry: true,
    },

    {
      title: "Own Vehicle",
      icon:
        <FaCar />,
      path:
        "/ownvehicledetaildash",
      dataEntry: true,
    },

    {
      title:
        "Vehicle Documents",
      icon:
        <FaFileAlt />,
      path:
        "/vehicle-documents",
    },

    {
      title: "Assets",
      icon:
        <FaBoxOpen />,
      path: "/assets",
    },

  ];


  /* =========================================
     LIVE MENU
  ========================================= */

  const liveMenu = [

    {
      title: "Tracking",
      icon:
        <FaMapMarkerAlt />,
      path: "/tracking",

      dataEntry: true,

      relatedPaths: [
        "/tracking",
        "/tracking-input",
        "/trip-details",
      ],
    },

    {
      title:
        "Inbound & Outbound",
      icon:
        <FaTruck />,
      path:
        "/inbound-outbound",
    },

    {
      title: "Warehouse",
      icon:
        <FaWarehouse />,
      path:
        "/warehouse",
    },

    {
      title:
        "Vehicle Maintenance",
      icon:
        <FaTools />,
      path:
        "/vehicle-maintenance",
    },

    {
      title:
        "Driver Management",
      icon:
        <FaUsers />,
      path:
        "/driver-management",
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
      normalizedPath || "/"
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


    if (
      Array.isArray(
        item.relatedPaths
      )
    ) {

      return (
        item.relatedPaths.some(
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
        )
      );

    }


    const itemPath =
      normalizePath(
        item.path
      );


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
     DATA ENTRY CLICK
  ========================================= */

  const handleDataEntry = (
    section
  ) => {

    if (
      section ===
      "Intercarting"
    ) {

      sessionStorage.removeItem(
        "intercartingLoggedIn"
      );

      sessionStorage.removeItem(
        "intercartingUsername"
      );

      setShowIntercartingLogin(
        true
      );

      return;

    }


    if (
      section ===
      "Own Vehicle"
    ) {

      sessionStorage.removeItem(
        "ownVehicleLoggedIn"
      );

      sessionStorage.removeItem(
        "ownVehicleUsername"
      );

      setShowOwnVehicleLogin(
        true
      );

      return;

    }


    if (
      section ===
      "Tracking"
    ) {

      sessionStorage.removeItem(
        "trackingLoggedIn"
      );

      sessionStorage.removeItem(
        "trackingUsername"
      );

      setShowTrackingLogin(
        true
      );

    }

  };


  /* =========================================
     LOGIN SUCCESS
  ========================================= */

  const handleIntercartingLoginSuccess =
    () => {

      setShowIntercartingLogin(
        false
      );


      navigate(
        "/intercartingdash/intercarting",
        {
          replace: true,
        }
      );


      closeMobileSidebar();

    };


  const handleOwnVehicleLoginSuccess =
    () => {

      setShowOwnVehicleLogin(
        false
      );


      navigate(
        "/ownvehicledetaildash/ownvehicledetails",
        {
          replace: true,
        }
      );


      closeMobileSidebar();

    };


  const handleTrackingLoginSuccess =
    () => {

      setShowTrackingLogin(
        false
      );


      navigate(
        "/trip-details",
        {
          replace: true,
        }
      );


      closeMobileSidebar();

    };


  /* =========================================
     LOGOUT
  ========================================= */

  const handleLogout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "username"
    );


    sessionStorage.removeItem(
      "intercartingLoggedIn"
    );

    sessionStorage.removeItem(
      "intercartingUsername"
    );


    sessionStorage.removeItem(
      "ownVehicleLoggedIn"
    );

    sessionStorage.removeItem(
      "ownVehicleUsername"
    );


    sessionStorage.removeItem(
      "trackingLoggedIn"
    );

    sessionStorage.removeItem(
      "trackingUsername"
    );


    setShowIntercartingLogin(
      false
    );

    setShowOwnVehicleLogin(
      false
    );

    setShowTrackingLogin(
      false
    );


    setCollapsed(true);


    navigate(
      "/",
      {
        replace: true,
      }
    );

  };


  /* =========================================
     MENU CLICK
  ========================================= */

  const handleMenuClick =
    () => {

      closeMobileSidebar();

    };


  /* =========================================
     RENDER MENU
  ========================================= */

  const renderMenuItems = (
    items
  ) => {

    return items.map(
      (item) => {

        const active =
          isItemActive(
            item
          );


        const showDataEntry =
          item.dataEntry &&
          active &&
          !collapsed;


        return (

          <div
            key={
              item.path
            }
            className="sidebar-menu-group"
          >

            <NavLink
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

              onClick={
                handleMenuClick
              }
            >

              <span
                className="sidebar-icon"
                aria-hidden="true"
              >
                {item.icon}
              </span>


              <span
                className="sidebar-text"
              >
                {item.title}
              </span>

            </NavLink>


            {showDataEntry && (

              <div
                className="sidebar-submenu"
              >

                <button
                  type="button"

                  className="sidebar-submenu-link"

                  onClick={() =>
                    handleDataEntry(
                      item.title
                    )
                  }
                >

                  <span
                    className="sidebar-submenu-connector"
                    aria-hidden="true"
                  />


                  <span
                    className="sidebar-submenu-icon"
                    aria-hidden="true"
                  >
                    <FaDatabase />
                  </span>


                  <span
                    className="sidebar-submenu-text"
                  >
                    Data Entry
                  </span>

                </button>

              </div>

            )}

          </div>

        );

      }
    );

  };


  /* =========================================
     RETURN
  ========================================= */

  return (

    <>


      {/* =====================================
          MOBILE OVERLAY
      ===================================== */}

      {!collapsed && (

        <div
          className="sidebar-mobile-overlay"

          onClick={
            closeMobileSidebar
          }

          aria-hidden="true"
        />

      )}


      {/* =====================================
          SIDEBAR
      ===================================== */}

      <aside
        className={`sidebar ${
          collapsed
            ? "collapsed"
            : ""
        }`}
      >

        <nav
          className="sidebar-menu"
        >


          {/* OPERATIONS */}

          <div
            className="sidebar-section"
          >

            {!collapsed && (

              <div
                className="sidebar-section-title"
              >
                Operations
              </div>

            )}


            <div
              className="sidebar-section-menu"
            >

              {renderMenuItems(
                operationsMenu
              )}

            </div>

          </div>


          {/* LIVE */}

          <div
            className="sidebar-section"
          >

            {!collapsed && (

              <div
                className="sidebar-section-title"
              >
                Live
              </div>

            )}


            <div
              className="sidebar-section-menu"
            >

              {renderMenuItems(
                liveMenu
              )}

            </div>

          </div>

        </nav>


        {/* =================================
            FOOTER
        ================================= */}

        <div
          className="sidebar-footer"
        >

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


            <span
              className="logout-text"
            >
              Sign Out
            </span>

          </button>

        </div>

      </aside>


      {/* =====================================
          LOGIN POPUPS
      ===================================== */}

      <Intercarttinglogin
        open={
          showIntercartingLogin
        }

        onClose={() =>
          setShowIntercartingLogin(
            false
          )
        }

        onLogin={
          handleIntercartingLoginSuccess
        }
      />


      <Ownvehiclelogin
        open={
          showOwnVehicleLogin
        }

        onClose={() =>
          setShowOwnVehicleLogin(
            false
          )
        }

        onLogin={
          handleOwnVehicleLoginSuccess
        }
      />


      <Trackinglogin
        open={
          showTrackingLogin
        }

        onClose={() =>
          setShowTrackingLogin(
            false
          )
        }

        onLoginSuccess={
          handleTrackingLoginSuccess
        }
      />

    </>

  );

};


export default Sidebar;