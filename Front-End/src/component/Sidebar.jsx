
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  FaTimes,
  FaTachometerAlt,
  FaTools,
  FaTruck,
  FaUsers,
} from "react-icons/fa";

import Intercarttinglogin from "../Loginpage/Intercartinglogin";
import Ownvehiclelogin from "../Loginpage/Ownvehiclelogin";
import Trackinglogin from "../Loginpage/Trackinglogin";
import AssetsLogin from "../Loginpage/Assetslogin";

import "../css/sidebar.css";

/* ==========================================
   LOGOUT CONFIRMATION POPUP
========================================== */

function LogoutConfirm({ open, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    dialog.showModal();
    cancelRef.current?.focus();

    document.body.style.overflow = "hidden";

    return () => {
      if (dialog.open) {
        dialog.close();
      }

      document.body.style.overflow = previousOverflow;

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="logout-confirm"
      aria-labelledby="logout-confirm-title"
      aria-describedby="logout-confirm-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;

        const bounds =
          event.currentTarget.getBoundingClientRect();

        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          onCancel();
        }
      }}
    >
      <div className="logout-confirm-header">
        <span>SESSION</span>

        <button
          type="button"
          className="logout-confirm-close"
          aria-label="Close confirmation"
          onClick={onCancel}
        >
          <FaTimes aria-hidden="true" />
        </button>
      </div>

      <div className="logout-confirm-content">
        <div className="logout-confirm-icon">
          <FaSignOutAlt aria-hidden="true" />
        </div>

        <h2 id="logout-confirm-title">
          Sign out of your account?
        </h2>

        <p id="logout-confirm-description">
          You will need to sign in again to access your dashboard.
        </p>

        <div className="logout-confirm-actions">
          <button
            ref={cancelRef}
            type="button"
            className="logout-confirm-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="logout-confirm-submit"
            onClick={onConfirm}
          >
            <FaSignOutAlt aria-hidden="true" />
            {" "}Sign Out
          </button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}

/* ==========================================
   SIDEBAR COMPONENT
========================================== */

const MOBILE_BREAKPOINT = 560;

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [
    showLogoutConfirm,
    setShowLogoutConfirm,
  ] = useState(false);

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

  /* ==========================================
     MOBILE SIDEBAR
  ========================================== */

  const isMobile = () => {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  };

  const closeMobileSidebar = () => {
    if (
      isMobile() &&
      typeof setCollapsed === "function"
    ) {
      setCollapsed(true);
    }
  };

  /* ==========================================
     OPEN LOGIN FROM NAVIGATION STATE
  ========================================== */

  useEffect(() => {
    const state = location.state || {};

    if (state.openAssetsLogin) {
      setShowAssetsLogin(true);

      navigate(location.pathname, {
        replace: true,
        state: {},
      });

      return;
    }

    if (state.openOwnVehicleLogin) {
      setShowOwnVehicleLogin(true);

      navigate(location.pathname, {
        replace: true,
        state: {},
      });

      return;
    }

    if (state.openIntercartingLogin) {
      setShowIntercartingLogin(true);

      navigate(location.pathname, {
        replace: true,
        state: {},
      });

      return;
    }

    if (state.openTrackingLogin) {
      setShowTrackingLogin(true);

      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    }
  }, [
    location.pathname,
    location.state,
    navigate,
  ]);

  /* ==========================================
     RESET MODULE SESSION ON MAIN PAGE
  ========================================== */

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

    if (location.pathname === "/tracking") {
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

    if (
      location.pathname ===
      "/trip-dashboard"
    ) {
      sessionStorage.removeItem(
        "kamLoggedIn"
      );

      sessionStorage.removeItem(
        "kamUsername"
      );

      sessionStorage.removeItem(
        "trafficLoggedIn"
      );

      sessionStorage.removeItem(
        "trafficUsername"
      );
    }
  }, [location.pathname]);

  /* ==========================================
     OPERATIONS MENU
     MAIN HEADINGS UNCHANGED
  ========================================== */

  const operationsMenu = [
    {
      title: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/dashboard",
    },

    {
      title: "Intercarting",
      icon: <FaExchangeAlt />,
      path: "/intercartingdash",
      dataEntry: true,
    },

    {
      title: "Order Management",
      icon: <FaFileAlt />,
      path: "/trip-dashboard",

      excludedPaths: [
        "/trip-dashboard/traffic-management",
        "/trip-dashboard/approval-management",
      ],

      subLinks: [
        {
          key: "kam",
          title: "Key-Account",
          path: "/trip-dashboard/key-account",
        },
      ],
    },

    {
      key: "traffic",
      title: "Traffic Management",
      icon: <FaTruck />,
      path: "/trip-dashboard/traffic-management",
    },

    {
      key: "approval",
      title: "Management Approval",
      icon: <FaFileAlt />,
      path: "/trip-dashboard/approval-management",
    },
  ];

  /* ==========================================
     LIVE MENU
     MAIN HEADINGS UNCHANGED
  ========================================== */

  const liveMenu = [
    {
      title: "Tracking",
      icon: <FaMapMarkerAlt />,
      path: "/tracking",
      dataEntry: true,

      relatedPaths: [
        "/tracking",
        "/tracking-input",
        "/trip-details",
      ],
    },

    {
      title: "Own Vehicle",
      icon: <FaCar />,
      path: "/ownvehicledetaildash",
      dataEntry: true,

      relatedPaths: [
        "/ownvehicledetaildash",
        "/assets",
      ],

      subLinks: [
        {
          key: "assets",
          title: "Fleet Assets",
          path: "/assets",
        },
      ],
    },

    {
      title: "Vehicle Documents",
      icon: <FaFileAlt />,
      path: "/vehicle-documents",
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

  /* ==========================================
     SUBHEADING LABELS
     ONLY DISPLAY NAMES CHANGED
  ========================================== */

  const getDataEntryLabel = (item) => {
    switch (item.title) {
      case "Intercarting":
        return "Movement Entry";

      case "Tracking":
        return "Tracking Updates";

      case "Own Vehicle":
        return "Vehicle Registration";

      default:
        return "Data Entry";
    }
  };

  /* ==========================================
     NORMALIZE URL
  ========================================== */

  const normalizePath = (path) => {
    const normalizedPath = String(path || "")
      .toLowerCase()
      .replace(/\/+$/, "");

    return normalizedPath || "/";
  };

  /* ==========================================
     MAIN MENU ACTIVE STATE
  ========================================== */

  const isItemActive = (item) => {
    const currentPath = normalizePath(
      location.pathname
    );

    if (
      item.excludedPaths?.some((path) => {
        const excludedPath = normalizePath(path);

        return (
          currentPath === excludedPath ||
          currentPath.startsWith(
            `${excludedPath}/`
          )
        );
      })
    ) {
      return false;
    }

    if (Array.isArray(item.relatedPaths)) {
      return item.relatedPaths.some((path) => {
        const relatedPath = normalizePath(path);

        return (
          currentPath === relatedPath ||
          currentPath.startsWith(
            `${relatedPath}/`
          )
        );
      });
    }

    const itemPath = normalizePath(item.path);

    if (itemPath === "/dashboard") {
      return currentPath === "/dashboard";
    }

    return (
      currentPath === itemPath ||
      currentPath.startsWith(
        `${itemPath}/`
      )
    );
  };

  /* ==========================================
     FLEET ASSETS LOGIN
  ========================================== */

  const handleAssetsClick = (event) => {
    event.preventDefault();

    sessionStorage.removeItem(
      "assetsLoggedIn"
    );

    sessionStorage.removeItem(
      "assetsUsername"
    );

    setShowAssetsLogin(true);

    closeMobileSidebar();
  };

  /* ==========================================
     DATA ENTRY LOGIN HANDLERS
     ORIGINAL MAIN TITLES PRESERVED
  ========================================== */

  const handleDataEntry = (section) => {
    if (section === "Intercarting") {
      sessionStorage.removeItem(
        "intercartingLoggedIn"
      );

      sessionStorage.removeItem(
        "intercartingUsername"
      );

      setShowIntercartingLogin(true);
      return;
    }

    if (section === "Own Vehicle") {
      sessionStorage.removeItem(
        "ownVehicleLoggedIn"
      );

      sessionStorage.removeItem(
        "ownVehicleUsername"
      );

      setShowOwnVehicleLogin(true);
      return;
    }

    if (section === "Tracking") {
      sessionStorage.removeItem(
        "trackingLoggedIn"
      );

      sessionStorage.removeItem(
        "trackingUsername"
      );

      setShowTrackingLogin(true);
    }
  };

  /* ==========================================
     ORDER MANAGEMENT NAVIGATION
  ========================================== */

  const handleTripsSubLinkClick = (
    event,
    subLink
  ) => {
    event.preventDefault();

    if (subLink.key === "kam") {
      sessionStorage.removeItem(
        "trafficLoggedIn"
      );

      sessionStorage.removeItem(
        "trafficUsername"
      );

      navigate(subLink.path);
      closeMobileSidebar();
      return;
    }

    if (subLink.key === "traffic") {
      sessionStorage.removeItem(
        "kamLoggedIn"
      );

      sessionStorage.removeItem(
        "kamUsername"
      );

      navigate(subLink.path);
      closeMobileSidebar();
      return;
    }

    if (subLink.key === "approval") {
      navigate(subLink.path);
      closeMobileSidebar();
      return;
    }

    navigate(subLink.path);
    closeMobileSidebar();
  };

  /* ==========================================
     LOGIN SUCCESS NAVIGATION
  ========================================== */

  const handleIntercartingLoginSuccess = () => {
    setShowIntercartingLogin(false);

    navigate(
      "/intercartingdash/intercarting",
      { replace: true }
    );

    closeMobileSidebar();
  };

  const handleOwnVehicleLoginSuccess = () => {
    setShowOwnVehicleLogin(false);

    navigate(
      "/ownvehicledetaildash/ownvehicledetails",
      { replace: true }
    );

    closeMobileSidebar();
  };

  const handleTrackingLoginSuccess = () => {
    setShowTrackingLogin(false);

    navigate("/trip-details", {
      replace: true,
    });

    closeMobileSidebar();
  };

  const handleAssetsLoginSuccess = () => {
    setShowAssetsLogin(false);

    navigate("/assets", {
      replace: true,
    });

    closeMobileSidebar();
  };

  /* ==========================================
     LOGOUT FUNCTION
  ========================================== */

  const handleLogout = () => {
    setShowLogoutConfirm(false);

    sessionStorage.removeItem(
      "mainSessionToken"
    );

    sessionStorage.removeItem(
      "mainLastActivity"
    );

    localStorage.removeItem("token");
    localStorage.removeItem("username");

    const sessionKeys = [
      "intercartingLoggedIn",
      "intercartingUsername",
      "ownVehicleLoggedIn",
      "ownVehicleUsername",
      "trackingLoggedIn",
      "trackingUsername",
      "assetsLoggedIn",
      "assetsUsername",
      "kamLoggedIn",
      "kamUsername",
      "trafficLoggedIn",
      "trafficUsername",
    ];

    sessionKeys.forEach((key) => {
      sessionStorage.removeItem(key);
    });

    setShowIntercartingLogin(false);
    setShowOwnVehicleLogin(false);
    setShowTrackingLogin(false);
    setShowAssetsLogin(false);

    if (
      typeof setCollapsed === "function"
    ) {
      setCollapsed(true);
    }

    navigate("/", {
      replace: true,
    });
  };

  /* ==========================================
     CLOSE SIDEBAR ON MOBILE
  ========================================== */

  const handleMenuClick = () => {
    closeMobileSidebar();
  };

  /* ==========================================
     SUBHEADING ACTIVE STATE
  ========================================== */

  const isDataEntryActive = (item) => {
    const currentPath = normalizePath(
      location.pathname
    );

    if (item.title === "Intercarting") {
      return (
        showIntercartingLogin ||
        currentPath ===
          "/intercartingdash/intercarting" ||
        currentPath.startsWith(
          "/intercartingdash/intercarting/"
        )
      );
    }

    if (item.title === "Own Vehicle") {
      return (
        showOwnVehicleLogin ||
        currentPath ===
          "/ownvehicledetaildash/ownvehicledetails" ||
        currentPath.startsWith(
          "/ownvehicledetaildash/ownvehicledetails/"
        )
      );
    }

    if (item.title === "Tracking") {
      return (
        showTrackingLogin ||
        currentPath === "/trip-details" ||
        currentPath.startsWith(
          "/trip-details/"
        ) ||
        currentPath === "/tracking-input" ||
        currentPath.startsWith(
          "/tracking-input/"
        )
      );
    }

    return false;
  };

  /* ==========================================
     RENDER MAIN MENU AND SUBMENUS
  ========================================== */

  const renderMenuItems = (items) => {
    return items.map((item) => {
      const active = isItemActive(item);

      const showDataEntry =
        item.dataEntry &&
        active &&
        !collapsed;

      const showSubLinks =
        Array.isArray(item.subLinks) &&
        item.subLinks.length > 0 &&
        active &&
        !collapsed;

      return (
        <div
          key={item.path}
          className="sidebar-menu-group"
        >
          {/* MAIN HEADING */}

          <NavLink
            to={item.path}
            end={item.path === "/dashboard"}
            className={() =>
              `sidebar-link ${
                active ? "active" : ""
              }`
            }
            aria-current={
              active ? "page" : undefined
            }
            title={
              collapsed ? item.title : undefined
            }
            onClick={
              item.key === "traffic" ||
              item.key === "approval"
                ? (event) =>
                    handleTripsSubLinkClick(
                      event,
                      item
                    )
                : item.secureLogin
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

            <span className="sidebar-text">
              {item.title}
            </span>
          </NavLink>

          {/* UPDATED SUBHEADING */}

          {(showDataEntry || showSubLinks) && (
            <div className="sidebar-submenu">
              {showDataEntry && (
              <button
                type="button"
                className={`sidebar-submenu-link ${
                  isDataEntryActive(item)
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleDataEntry(item.title)
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

                <span className="sidebar-submenu-text">
                  {getDataEntryLabel(item)}
                </span>
              </button>
              )}

              {/* ADDITIONAL SUBHEADINGS */}

              {showSubLinks && item.subLinks.map((subLink) => (
                <NavLink
                  key={subLink.key}
                  to={subLink.path}
                  className={({ isActive }) =>
                    `sidebar-submenu-link ${
                      isActive ||
                      (
                        subLink.key === "assets" &&
                        showAssetsLogin
                      )
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={(event) =>
                    subLink.key === "assets"
                      ? handleAssetsClick(event)
                      : handleTripsSubLinkClick(
                          event,
                          subLink
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
                    {subLink.key === "assets" ? (
                      <FaBoxOpen />
                    ) : (
                      <FaDatabase />
                    )}
                  </span>

                  <span className="sidebar-submenu-text">
                    {subLink.title}
                  </span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  /* ==========================================
     SIDEBAR JSX
  ========================================== */

  return (
    <>
      {/* MOBILE OVERLAY */}

      {!collapsed && (
        <div
          className="sidebar-mobile-overlay"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          collapsed ? "collapsed" : ""
        }`}
      >
        <nav className="sidebar-menu">
          {/* OPERATIONS SECTION */}

          <div className="sidebar-section">
            {!collapsed && (
              <div className="sidebar-section-title">
                Operations
              </div>
            )}

            <div className="sidebar-section-menu">
              {renderMenuItems(operationsMenu)}
            </div>
          </div>

          {/* LIVE SECTION */}

          <div className="sidebar-section">
            {!collapsed && (
              <div className="sidebar-section-title">
                Live
              </div>
            )}

            <div className="sidebar-section-menu">
              {renderMenuItems(liveMenu)}
            </div>
          </div>
        </nav>

        {/* LOGOUT BUTTON */}

        <div className="sidebar-footer">
          <button
            type="button"
            className="logout-button"
            onClick={() =>
              setShowLogoutConfirm(true)
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

      {/* LOGOUT CONFIRMATION */}

      <LogoutConfirm
        open={showLogoutConfirm}
        onCancel={() =>
          setShowLogoutConfirm(false)
        }
        onConfirm={handleLogout}
      />

      {/* INTERCARTING LOGIN */}

      <Intercarttinglogin
        open={showIntercartingLogin}
        onClose={() =>
          setShowIntercartingLogin(false)
        }
        onLogin={
          handleIntercartingLoginSuccess
        }
      />

      {/* OWN VEHICLE LOGIN */}

      <Ownvehiclelogin
        open={showOwnVehicleLogin}
        onClose={() =>
          setShowOwnVehicleLogin(false)
        }
        onLogin={
          handleOwnVehicleLoginSuccess
        }
      />

      {/* TRACKING LOGIN */}

      <Trackinglogin
        open={showTrackingLogin}
        onClose={() =>
          setShowTrackingLogin(false)
        }
        onLoginSuccess={
          handleTrackingLoginSuccess
        }
      />

      {/* FLEET ASSETS LOGIN */}

      <AssetsLogin
        open={showAssetsLogin}
        onClose={() =>
          setShowAssetsLogin(false)
        }
        onLoginSuccess={
          handleAssetsLoginSuccess
        }
      />
    </>
  );
};

export default Sidebar;
