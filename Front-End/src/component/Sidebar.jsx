import React, {
  useEffect,
  useRef,
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
  FaTimes,
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
import AssetsLogin
  from "../Loginpage/Assetslogin";
import "../css/sidebar.css";
import { createPortal } from "react-dom";
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
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <dialog
      ref={dialogRef}
      className="logout-confirm"
      aria-labelledby="logout-confirm-title"
      aria-describedby="logout-confirm-description"
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) onCancel();
      }}
    >
      <div className="logout-confirm-header">
        <span>SESSION</span>
        <button type="button" className="logout-confirm-close" aria-label="Close confirmation" onClick={onCancel}>
          <FaTimes aria-hidden="true" />
        </button>
      </div>
      <div className="logout-confirm-content">
        <div className="logout-confirm-icon"><FaSignOutAlt aria-hidden="true" /></div>
        <h2 id="logout-confirm-title">Sign out of your account?</h2>
        <p id="logout-confirm-description">You will need to sign in again to access your dashboard.</p>
        <div className="logout-confirm-actions">
          <button ref={cancelRef} type="button" className="logout-confirm-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="logout-confirm-submit" onClick={onConfirm}>
            <FaSignOutAlt aria-hidden="true" /> Sign Out
          </button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}

const MOBILE_BREAKPOINT = 560;
const Sidebar = ({
  collapsed,
  setCollapsed,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
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
  const isMobile = () => {
    return (
      window.innerWidth <=
      MOBILE_BREAKPOINT
    );
  };
  const closeMobileSidebar = () => {
    if (
      isMobile() &&
      typeof setCollapsed ===
      "function"
    ) {
      setCollapsed(true);
    }
  };
  useEffect(() => {
    const state =
      location.state || {};
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
  }, [
    location.pathname,
  ]);
  const operationsMenu = [
    {
      title: "Dashboard",
      icon:
        <FaTachometerAlt />,
      path:
        "/dashboard",
    },
    {
      title:
        "Intercarting",
      icon:
        <FaExchangeAlt />,
      path:
        "/intercartingdash",
      dataEntry: true,
    },
    {
      title:
        "Own Vehicle",
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
      title: "Order Management",
      icon:
        <FaFileAlt />,
      path:
        "/trip-dashboard",
      subLinks: [
        {
          key: "kam",
          title:
            "Key-Account",
          path:
            "/trip-dashboard/key-account",
        },
        {
          key: "traffic",
          title:
            "Traffic-Management",
          path:
            "/trip-dashboard/traffic-management",
        },
        {
          key: "approval",
          title:
            "Approval Management",
          path:
            "/trip-dashboard/approval-management",
        },
      ],
    },
  ];
  const liveMenu = [
    {
      title:
        "Tracking",
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
    // {
    //   title:
    //     "Inbound & Outbound",
    //   icon:
    //     <FaTruck />,
    //   path:
    //     "/inbound-outbound",
    // },
    {
      title: "Assets",
      icon:
        <FaBoxOpen />,
      path:
        "/assets",
      secureLogin: true,
    },
    {
      title:
        "Warehouse",
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
  const handleAssetsClick = (
    event
  ) => {
    event.preventDefault();
    sessionStorage.removeItem(
      "assetsLoggedIn"
    );
    sessionStorage.removeItem(
      "assetsUsername"
    );
    setShowAssetsLogin(
      true
    );
    closeMobileSidebar();
  };
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
  const handleTripsSubLinkClick = (
    event,
    subLink
  ) => {
    event.preventDefault();
    if (
      subLink.key === "kam"
    ) {
      sessionStorage.removeItem(
        "trafficLoggedIn"
      );
      sessionStorage.removeItem(
        "trafficUsername"
      );
      navigate(
        subLink.path
      );
      closeMobileSidebar();
      return;
    }
    if (
      subLink.key ===
      "traffic"
    ) {
      sessionStorage.removeItem(
        "kamLoggedIn"
      );
      sessionStorage.removeItem(
        "kamUsername"
      );
      navigate(
        subLink.path
      );
      closeMobileSidebar();
      return;
    }
    if (
      subLink.key ===
      "approval"
    ) {
      navigate(
        subLink.path
      );
      closeMobileSidebar();
      return;
    }
    navigate(
      subLink.path
    );
    closeMobileSidebar();
  };
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
  const handleAssetsLoginSuccess =
    () => {
      setShowAssetsLogin(
        false
      );
      navigate(
        "/assets",
        {
          replace: true,
        }
      );
      closeMobileSidebar();
    };
  const handleLogout = () => {
    setShowLogoutConfirm(false);
    sessionStorage.removeItem("mainSessionToken");
    sessionStorage.removeItem("mainLastActivity");
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
    sessionStorage.removeItem(
      "assetsLoggedIn"
    );
    sessionStorage.removeItem(
      "assetsUsername"
    );
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
  const handleMenuClick =
    () => {
      closeMobileSidebar();
    };
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
        const showSubLinks =
          Array.isArray(item.subLinks) &&
          item.subLinks.length > 0 &&
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
                `sidebar-link ${active
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
            {showSubLinks && (
              <div
                className="sidebar-submenu"
              >
                {item.subLinks.map(
                  (subLink) => (
                    <NavLink
                      key={
                        subLink.key
                      }
                      to={
                        subLink.path
                      }
                      className={({
                        isActive,
                      }) =>
                        `sidebar-submenu-link ${isActive
                          ? "active"
                          : ""
                        }`
                      }
                      onClick={(
                        event
                      ) =>
                        handleTripsSubLinkClick(
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
                        <FaDatabase />
                      </span>
                      <span
                        className="sidebar-submenu-text"
                      >
                        {
                          subLink.title
                        }
                      </span>
                    </NavLink>
                  )
                )}
              </div>
            )}
          </div>
        );
      }
    );
  };
  return (
    <>
      {!collapsed && (
        <div
          className="sidebar-mobile-overlay"
          onClick={
            closeMobileSidebar
          }
          aria-hidden="true"
        />
      )}
      <aside
        className={
          `sidebar ${collapsed
            ? "collapsed"
            : ""
          }`
        }
      >
        <nav
          className="sidebar-menu"
        >
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
        <div
          className="sidebar-footer"
        >
          <button
            type="button"
            className="logout-button"
            onClick={() => setShowLogoutConfirm(true)}
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
      <LogoutConfirm
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
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
