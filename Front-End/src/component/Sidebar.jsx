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
  FaSignOutAlt,
  FaTachometerAlt,
  FaTools,
  FaTruck,
  FaUsers,
} from "react-icons/fa";

import "../css/sidebar.css";

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
      path: "/dashboard/vehicle-documents",
    },
    {
      title: "Assets",
      icon: <FaBoxOpen />,
      path: "/dashboard/assets",
    },
    {
      title: "Inbound & Outbound",
      icon: <FaTruck />,
      path: "/dashboard/inbound-outbound",
    },
    {
      title: "Vehicle Maintenance",
      icon: <FaTools />,
      path: "/dashboard/vehicle-maintenance",
    },
    {
      title: "Driver Management",
      icon: <FaUsers />,
      path: "/dashboard/driver-management",
    },
  ];

  const normalizePath = (path) => {
    const normalizedPath = String(path || "")
      .toLowerCase()
      .replace(/\/+$/, "");

    return normalizedPath || "/";
  };

  const isItemActive = (item) => {
    const currentPath = normalizePath(
      location.pathname
    );

    const itemPath = normalizePath(
      item.path
    );

    // Dashboard active only on exact /dashboard.
    if (itemPath === "/dashboard") {
      return currentPath === "/dashboard";
    }

    // Intercarting stays active on all its child routes.
    if (itemPath === "/intercartingdash") {
      return (
        currentPath === "/intercartingdash" ||
        currentPath.startsWith(
          "/intercartingdash/"
        )
      );
    }

    // Own Vehicle stays active on dashboard and details pages.
    if (
      itemPath ===
      "/ownvehicledetaildash"
    ) {
      return (
        currentPath ===
          "/ownvehicledetaildash" ||
        currentPath.startsWith(
          "/ownvehicledetaildash/"
        )
      );
    }

    // Other dashboard routes.
    return (
      currentPath === itemPath ||
      currentPath.startsWith(
        `${itemPath}/`
      )
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    sessionStorage.removeItem(
      "intercartingLoggedIn"
    );

    sessionStorage.removeItem(
      "ownVehicleLoggedIn"
    );

    sessionStorage.removeItem(
      "ownVehicleUsername"
    );

    navigate("/", {
      replace: true,
    });
  };

  return (
    <aside
      className={`sidebar ${
        collapsed ? "collapsed" : ""
      }`}
    >
      <nav
        className="sidebar-menu"
        aria-label="Dashboard navigation"
      >
        {menuItems.map((item) => {
          const active =
            isItemActive(item);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={
                item.path ===
                "/dashboard"
              }
              className={`sidebar-link ${
                active ? "active" : ""
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
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
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