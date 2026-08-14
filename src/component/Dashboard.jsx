import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

import "../css/dashboard.css";

const Dashboard = () => {
  // Sidebar collapse state
  const [collapsed, setCollapsed] = useState(false);

  // Toggle sidebar
  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <Navbar
        collapsed={collapsed}
        toggleSidebar={toggleSidebar}
      />

      {/* Sidebar + Main Content */}
      <div className="dashboard-body">
        {/* Left Sidebar */}
        <Sidebar collapsed={collapsed} />

        {/* Page Content */}
        <main
          className={`dashboard-main-content ${
            collapsed ? "sidebar-collapsed" : ""
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;