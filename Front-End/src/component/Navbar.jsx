import React, {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FaBars,
  FaBell,
  FaCog,
  FaSearch,
  FaSignOutAlt,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import {
  useNavigate,
} from "react-router-dom";
import "../css/navbar.css";
import axios from "axios";

import OTClogo from "../asset/otclogo.jpg";
/* =========================================================
   SEARCHABLE PAGES
\========================================================= */
const dashboardPages = [
  {
    title: "Dashboard",
    path: "/dashboard",
    keywords: [
      "dashboard",
      "home",
      "overview",
    ],
  },
  {
    title: "Intercarting",
    path: "/dashboard/Intercarting",
    keywords: [
      "intercarting",
      "carting",
    ],
  },
  {
    title: "Own Vehicle",
    path: "/dashboard/own-vehicle",
    keywords: [
      "own vehicle",
      "vehicle",
      "fleet",
    ],
  },
  {
    title: "Vehicle Documents",
    path: "/dashboard/vehicle-documents",
    keywords: [
      "vehicle documents",
      "documents",
      "rc",
      "insurance",
    ],
  },
  {
    title: "Assets",
    path: "/dashboard/assets",
    keywords: [
      "assets",
      "asset",
    ],
  },
  {
    title: "Tracking",
    path: "/dashboard/tracking",
    keywords: [
      "tracking",
      "vehicle tracking",
      "gps",
    ],
  },
  {
    title: "Inbound & Outbound",
    path: "/dashboard/inbound-outbound",
    keywords: [
      "inbound",
      "outbound",
      "movement",
    ],
  },
  {
    title: "Warehouse",
    path: "/dashboard/warehouse",
    keywords: [
      "warehouse",
      "stock",
      "inventory",
    ],
  },
  {
    title: "Vehicle Maintenance",
    path: "/dashboard/vehicle-maintenance",
    keywords: [
      "maintenance",
      "vehicle maintenance",
      "service",
    ],
  },
  {
    title: "Driver Management",
    path: "/dashboard/driver-management",
    keywords: [
      "driver",
      "driver management",
    ],
  },
];
/* =========================================================
   SAMPLE NOTIFICATIONS
\========================================================= */
const DOCUMENT_ALERT_TYPES = [
  ["insurance", "Insurance"], ["fitness", "Fitness"],
  ["nationalPermit", "National Permit"], ["permit", "Permit"],
  ["tax", "Tax"], ["puc", "PUC"],
];
const ALERT_API = `${(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "")}/api/ownvehicles`;
const readStored = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const calendarDay = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.getTime() / 86400000;
};
export const buildDocumentAlerts = (vehicles, today = new Date(), includeExpired = true) => {
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000;
  return vehicles.flatMap(vehicle => DOCUMENT_ALERT_TYPES.flatMap(([key, label]) => {
    const expiry = vehicle?.documents?.[key]?.expiryDate;
    const day = calendarDay(expiry);
    if (day === null) return [];
    const days = day - todayDay;
    if (days > 2 || (!includeExpired && days < 0)) return [];
    const number = vehicle.vehicleNo || vehicle.vehicleNumber || vehicle.registrationNumber || "Unknown vehicle";
    const date = String(expiry).slice(0, 10);
    const status = days < 0 ? "Expired" : days === 0 ? "Expires today" : `Expires in ${days} day${days === 1 ? "" : "s"}`;
    return [{ id: `${vehicle._id || vehicle.id || number}:${key}:${date}:${status}`, title: `${number} · ${label}`, time: `${status} · ${date}`, days, expiry: date }];
  })).sort((a, b) => a.days - b.days || a.title.localeCompare(b.title));
};

const Navbar = ({
  collapsed,
  toggleSidebar,
}) => {
  const navigate =
    useNavigate();
  /* =========================================================
     STATE
  ========================================================= */
  const [
    searchText,
    setSearchText,
  ] = useState("");
  const [
    showSearchResults,
    setShowSearchResults,
  ] = useState(false);
  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);
  const [
    showSettings,
    setShowSettings,
  ] = useState(false);
  const [
    showProfile,
    setShowProfile,
  ] = useState(false);
  const userKey = localStorage.getItem("username") || "default";
  const preferenceKey = `otc-document-preferences:${userKey}`;
  const readKey = `otc-document-read:${userKey}`;
  const [preferences, setPreferences] = useState(() => readStored(preferenceKey, { enabled: true, includeExpired: true }));
  const [readIds, setReadIds] = useState(() => readStored(readKey, []));
  const [alertVehicles, setAlertVehicles] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState("");
  const [today, setToday] = useState(() => new Date());
  const requestRunning = useRef(false);
  const mounted = useRef(false);
  const notifications = useMemo(() => preferences.enabled
    ? buildDocumentAlerts(alertVehicles, today, preferences.includeExpired).map(item => ({ ...item, unread: !readIds.includes(item.id) }))
    : [], [alertVehicles, today, preferences, readIds]);
  const updatePreference = (key, value) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    try { localStorage.setItem(preferenceKey, JSON.stringify(next)); } catch {}
  };
  const markRead = (ids) => {
    setReadIds(previous => {
      const next = [...new Set([...previous, ...ids])];
      try { localStorage.setItem(readKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const refreshAlerts = useCallback(async () => {
    if (requestRunning.current) return;
    requestRunning.current = true;
    setAlertsLoading(true);
    setAlertsError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(ALERT_API, { timeout: 30000, headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const list = Array.isArray(data) ? data : data?.ownVehicles;
      if (!Array.isArray(list)) throw new Error("Unexpected vehicle response");
      if (mounted.current) { setAlertVehicles(list); setToday(new Date()); }
    } catch {
      if (mounted.current) setAlertsError("Unable to refresh document alerts. Please try again.");
    } finally {
      requestRunning.current = false;
      if (mounted.current) setAlertsLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    refreshAlerts();
    const timer = window.setInterval(refreshAlerts, 60000);
    const onFocus = () => refreshAlerts();
    window.addEventListener("focus", onFocus);
    return () => { mounted.current = false; window.clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [refreshAlerts]);
  /* =========================================================
     REFS
  ========================================================= */
  const navbarRef =
    useRef(null);
  /* =========================================================
     USER
  ========================================================= */
  const storedUsername =
    localStorage.getItem(
      "username"
    );
  const username =
    storedUsername &&
    storedUsername.trim()
      ? storedUsername.trim()
      : "OTCL";
  const avatarLetter =
    username
      .charAt(0)
      .toUpperCase() ||
    "O";
  /* =========================================================
     UNREAD COUNT
  ========================================================= */
  const unreadCount =
    notifications.filter(
      (item) =>
        item.unread
    ).length;
  /* =========================================================
     SEARCH FILTER
  ========================================================= */
  const filteredPages =
    searchText.trim()
      ? dashboardPages.filter(
          (page) => {
            const text =
              searchText
                .toLowerCase()
                .trim();
            return (
              page.title
                .toLowerCase()
                .includes(text) ||
              page.keywords.some(
                (keyword) =>
                  keyword.includes(
                    text
                  )
              )
            );
          }
        )
      : [];
  /* =========================================================
     SEARCH CHANGE
  ========================================================= */
  const handleSearchChange = (
    event
  ) => {
    const value =
      event.target.value;
    setSearchText(value);
    setShowSearchResults(
      Boolean(
        value.trim()
      )
    );
  };
  /* =========================================================
     CLEAR SEARCH
  ========================================================= */
  const clearSearch = () => {
    setSearchText("");
    setShowSearchResults(
      false
    );
  };
  /* =========================================================
     SELECT SEARCH RESULT
  ========================================================= */
  const handleSearchSelect = (
    page
  ) => {
    navigate(page.path);
    clearSearch();
  };
  /* =========================================================
     SEARCH ENTER
  ========================================================= */
  const handleSearchKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      filteredPages.length > 0
    ) {
      handleSearchSelect(
        filteredPages[0]
      );
    }
  };
  /* =========================================================
     NOTIFICATIONS
  ========================================================= */
  const toggleNotifications =
    () => {
      setShowNotifications(
        (previous) =>
          !previous
      );
      setShowSettings(false);
      setShowProfile(false);
      setShowSearchResults(false);
    };
  const markAllAsRead = () => markRead(notifications.map(item => item.id));
  /* =========================================================
     SETTINGS
  ========================================================= */
  const toggleSettings =
    () => {
      setShowSettings(
        (previous) =>
          !previous
      );
      setShowNotifications(false);
      setShowProfile(false);
      setShowSearchResults(false);
    };
  /* =========================================================
     PROFILE
  ========================================================= */
  const toggleProfile =
    () => {
      setShowProfile(
        (previous) =>
          !previous
      );
      setShowNotifications(false);
      setShowSettings(false);
      setShowSearchResults(false);
    };
  /* =========================================================
     LOGOUT
  ========================================================= */
  const handleLogout = () => {
    localStorage.removeItem(
      "username"
    );
    localStorage.removeItem(
      "token"
    );
    sessionStorage.clear();
    navigate(
      "/",
      {
        replace: true,
      }
    );
  };
  /* =========================================================
     CLOSE WHEN CLICKING OUTSIDE
  ========================================================= */
  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(
          event.target
        )
      ) {
        setShowNotifications(
          false
        );
        setShowSettings(
          false
        );
        setShowProfile(
          false
        );
        setShowSearchResults(
          false
        );
      }
    };
    const handleEscape = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        setShowNotifications(
          false
        );
        setShowSettings(
          false
        );
        setShowProfile(
          false
        );
        setShowSearchResults(
          false
        );
      }
    };
    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );
    document.addEventListener(
      "keydown",
      handleEscape
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
    };
  }, []);
  /* =========================================================
     RETURN
  ========================================================= */
  return (
    <header
      className="navbar"
      ref={navbarRef}
    >
      {/* =====================================================
          LEFT
      ====================================================== */}
      <div
        className={`navbar-left ${
          collapsed
            ? "navbar-left-collapsed"
            : ""
        }`}
      >
        <button
          type="button"
          className="navbar-menu-button"
          onClick={
            toggleSidebar
          }
          aria-label={
            collapsed
              ? "Open sidebar"
              : "Close sidebar"
          }
          title={
            collapsed
              ? "Open sidebar"
              : "Close sidebar"
          }
        >
          <FaBars />
        </button>
        {!collapsed && (
          <div className="navbar-brand">
            <img
              src={OTClogo}
              alt="OTC Groups logo"
              className="navbar-logo"
            />
            <div className="navbar-company">
              <h1>
                OTC Groups
              </h1>
              <p>
                Thinking the way forward...
              </p>
            </div>
          </div>
        )}
      </div>
      {/* =====================================================
          SEARCH
      ====================================================== */}
      <div className="navbar-center">
        <div className="navbar-search-container">
          <div className="navbar-search">
            <FaSearch
              className="navbar-search-icon"
            />
            <input
              type="search"
              value={searchText}
              onChange={
                handleSearchChange
              }
              onFocus={() => {
                if (
                  searchText.trim()
                ) {
                  setShowSearchResults(
                    true
                  );
                }
              }}
              onKeyDown={
                handleSearchKeyDown
              }
              placeholder="Search..."
              aria-label="Search dashboard"
            />
            {searchText && (
              <button
                type="button"
                className="navbar-search-clear"
                onClick={
                  clearSearch
                }
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
          {/* SEARCH RESULT */}
          {showSearchResults && (
            <div className="navbar-search-results">
              {filteredPages.length >
              0 ? (
                filteredPages.map(
                  (page) => (
                    <button
                      type="button"
                      key={page.path}
                      className="navbar-search-result"
                      onClick={() =>
                        handleSearchSelect(
                          page
                        )
                      }
                    >
                      <FaSearch />
                      <span>
                        {page.title}
                      </span>
                    </button>
                  )
                )
              ) : (
                <div className="navbar-no-result">
                  No pages found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* =====================================================
          RIGHT
      ====================================================== */}
      <div className="navbar-right">
        {/* NOTIFICATION */}
        <div className="navbar-action-wrapper">
          <button
            type="button"
            className="navbar-icon-button"
            onClick={
              toggleNotifications
            }
            aria-label="Notifications"
            title="Notifications"
          >
            <FaBell />
            {unreadCount > 0 && (
              <span
                className="navbar-alert-count"
              >{unreadCount > 99 ? "99+" : unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <div className="navbar-dropdown notification-dropdown">
              <div className="navbar-dropdown-header">
                <div>
                  <strong>
                    Notifications
                  </strong>
                  <span>
                    {unreadCount} unread
                  </span>
                </div>
                {unreadCount >
                  0 && (
                  <button
                    type="button"
                    onClick={
                      markAllAsRead
                    }
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {alertsLoading && <p className="navbar-alert-message" role="status">Refreshing document alerts...</p>}
                {alertsError && <p className="navbar-alert-error" role="alert">{alertsError}</p>}
                {!alertsLoading && !alertsError && notifications.length === 0 && <p className="navbar-alert-message">{preferences.enabled ? "No documents expiring within two days." : "Document reminders are turned off."}</p>}
                {notifications.map(
                  (notification) => (
                    <button
                      type="button"
                      className={`notification-item ${
                        notification.unread
                          ? "unread"
                          : ""
                      }`}
                      key={
                        notification.id
                      }
                      onClick={() => {
                        markRead([notification.id]);
                        setShowNotifications(false);
                        navigate("/vehicle-documents");
                      }}
                    >
                      <span className="notification-status" />
                      <div>
                        <strong>
                          {
                            notification.title
                          }
                        </strong>
                        <span>
                          {
                            notification.time
                          }
                        </span>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
        {/* SETTINGS */}
        <div className="navbar-action-wrapper">
          <button
            type="button"
            className="navbar-icon-button"
            onClick={
              toggleSettings
            }
            aria-label="Settings"
            title="Settings"
          >
            <FaCog />
          </button>
          {showSettings && (
            <div className="navbar-dropdown settings-dropdown">
              <div className="navbar-dropdown-title">
                Settings
              </div>
              <p className="navbar-alert-message">Document reminders appear two days before expiry.</p>
              <label className="navbar-setting-row"><span>Document reminders</span><input type="checkbox" checked={preferences.enabled} onChange={event => updatePreference("enabled", event.target.checked)} /></label>
              <label className="navbar-setting-row"><span>Include expired documents</span><input type="checkbox" checked={preferences.includeExpired} onChange={event => updatePreference("includeExpired", event.target.checked)} /></label>
              <button type="button" onClick={refreshAlerts} disabled={alertsLoading}>{alertsLoading ? "Refreshing..." : "Refresh document alerts"}</button>
              {alertsError && <p className="navbar-alert-error" role="alert">{alertsError}</p>}
              <p className="navbar-alert-message">Preferences are saved automatically.</p>
            </div>
          )}
        </div>
        {/* USER */}
        <div className="navbar-action-wrapper">
          <button
            type="button"
            className="navbar-user"
            onClick={
              toggleProfile
            }
          >
            <div className="navbar-avatar">
              {avatarLetter}
            </div>
            <div className="navbar-user-details">
              <strong>
                {username}
              </strong>
              <span>
                Administrator
              </span>
            </div>
          </button>
          {showProfile && (
            <div className="navbar-dropdown profile-dropdown">
              <div className="navbar-profile-header">
                <div className="navbar-profile-avatar">
                  {avatarLetter}
                </div>
                <div>
                  <strong>
                    {username}
                  </strong>
                  <span>
                    Administrator
                  </span>
                </div>
              </div>
              <div className="navbar-dropdown-divider" />
              <button
                type="button"
                onClick={() => {
                  setShowProfile(
                    false
                  );
                }}
              >
                <FaUser />
                My Profile
              </button>
              <button
                type="button"
                className="navbar-logout-button"
                onClick={
                  handleLogout
                }
              >
                <FaSignOutAlt />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;