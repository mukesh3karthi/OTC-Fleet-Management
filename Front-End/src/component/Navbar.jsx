import React, {
  useEffect,
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

import OTClogo from "../asset/otclogo.jpg";


/* =========================================================
   SEARCHABLE PAGES
========================================================= */

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
========================================================= */

const initialNotifications = [
  {
    id: 1,
    title: "Vehicle document updated",
    time: "10 min ago",
    unread: true,
  },
  {
    id: 2,
    title: "New vehicle added",
    time: "30 min ago",
    unread: true,
  },
  {
    id: 3,
    title: "Maintenance record updated",
    time: "1 hour ago",
    unread: false,
  },
];


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


  const [
    notifications,
    setNotifications,
  ] = useState(
    initialNotifications
  );


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


  const markAllAsRead = () => {

    setNotifications(
      (previous) =>
        previous.map(
          (item) => ({
            ...item,
            unread: false,
          })
        )
    );

  };


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
                className="notification-dot"
              />
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

                        setNotifications(
                          (previous) =>
                            previous.map(
                              (item) =>
                                item.id ===
                                notification.id
                                  ? {
                                      ...item,
                                      unread:
                                        false,
                                    }
                                  : item
                            )
                        );

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


              <button
                type="button"
                onClick={() => {
                  navigate(
                    "/dashboard"
                  );

                  setShowSettings(
                    false
                  );
                }}
              >
                Dashboard Settings
              </button>


              <button
                type="button"
                onClick={() => {

                  setShowSettings(
                    false
                  );

                }}
              >
                Preferences
              </button>

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