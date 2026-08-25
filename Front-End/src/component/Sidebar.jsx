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


/* =========================================
   LOGIN MODALS
========================================= */

import Intercarttinglogin
  from "../Loginpage/Intercartinglogin";

import Ownvehiclelogin
  from "../Loginpage/Ownvehiclelogin";

import Trackinglogin
  from "../Loginpage/Trackinglogin";

import AssetsLogin
  from "../Loginpage/Assetslogin";


/* =========================================
   CSS
========================================= */

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


  const [
    showAssetsLogin,
    setShowAssetsLogin,
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
     OPEN LOGIN MODAL FROM ROUTE STATE

     Used when user manually enters a
     protected route URL.
  ========================================= */

  useEffect(() => {

    const state =
      location.state || {};


    /* ASSETS */

    if (
      state.openAssetsLogin
    ) {

      setShowAssetsLogin(true);


      navigate(
        location.pathname,
        {
          replace: true,
          state: {},
        }
      );


      return;

    }


    /* OWN VEHICLE */

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


    /* INTERCARTING */

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


    /* TRACKING */

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
     CLEAR SUB LOGIN SESSION
     WHEN LANDING DASHBOARD IS OPENED
  ========================================= */

  useEffect(() => {

    /* OWN VEHICLE */

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


    /* TRACKING */

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


    /* INTERCARTING */

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

      path:
        "/dashboard",
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

      path:
        "/assets",

      secureLogin: true,
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

      path:
        "/tracking",

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
     ASSETS CLICK
     SHOW LOGIN BEFORE NAVIGATION
  ========================================= */

  const handleAssetsClick = (
    event
  ) => {

    event.preventDefault();


    /*
      Require Assets login every time
      Assets menu is clicked.
    */

    sessionStorage.removeItem(
      "assetsLoggedIn"
    );

    sessionStorage.removeItem(
      "assetsUsername"
    );


    setShowAssetsLogin(true);


    closeMobileSidebar();

  };


  /* =========================================
     DATA ENTRY CLICK
  ========================================= */

  const handleDataEntry = (
    section
  ) => {

    /* INTERCARTING */

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


    /* OWN VEHICLE */

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


    /* TRACKING */

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
     ASSETS LOGIN SUCCESS
  ========================================= */

  const handleAssetsLoginSuccess =
    () => {

      setShowAssetsLogin(false);


      /*
        AssetsLogin should already save:

        assetsLoggedIn = true
        assetsUsername = username
      */


      navigate(
        "/assets",
        {
          replace: true,
        }
      );


      closeMobileSidebar();

    };


  /* =========================================
     MAIN LOGOUT
  ========================================= */

  const handleLogout = () => {

    /* MAIN LOGIN */

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "username"
    );


    /* INTERCARTING */

    sessionStorage.removeItem(
      "intercartingLoggedIn"
    );

    sessionStorage.removeItem(
      "intercartingUsername"
    );


    /* OWN VEHICLE */

    sessionStorage.removeItem(
      "ownVehicleLoggedIn"
    );

    sessionStorage.removeItem(
      "ownVehicleUsername"
    );


    /* TRACKING */

    sessionStorage.removeItem(
      "trackingLoggedIn"
    );

    sessionStorage.removeItem(
      "trackingUsername"
    );


    /* ASSETS */

    sessionStorage.removeItem(
      "assetsLoggedIn"
    );

    sessionStorage.removeItem(
      "assetsUsername"
    );


    /* CLOSE POPUPS */

    setShowIntercartingLogin(
      false
    );

    setShowOwnVehicleLogin(
      false
    );

    setShowTrackingLogin(
      false
    );

    setShowAssetsLogin(
      false
    );


    if (
      typeof setCollapsed ===
      "function"
    ) {

      setCollapsed(true);

    }


    navigate(
      "/",
      {
        replace: true,
      }
    );

  };


  /* =========================================
     NORMAL MENU CLICK
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

              className={
                `sidebar-link ${
                  active
                    ? "active"
                    : ""
                }`
              }

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
                item.secureLogin
                  ? handleAssetsClick
                  : handleMenuClick
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


            {/* DATA ENTRY SUB MENU */}

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
          MOBILE SIDEBAR OVERLAY
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
        className={
          `sidebar ${
            collapsed
              ? "collapsed"
              : ""
          }`
        }
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


      {/* ASSETS LOGIN */}

      <AssetsLogin
        open={
          showAssetsLogin
        }

        onClose={() =>
          setShowAssetsLogin(
            false
          )
        }

        onLoginSuccess={
          handleAssetsLoginSuccess
        }
      />


    </>

  );

};


export default Sidebar;