import React, { useState } from "react";
import {
  FaBars,
  FaBell,
  FaCog,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import "../css/navbar.css";
import OTClogo from "../assets/otclogo.jpg"

const Navbar = ({ collapsed, toggleSidebar }) => {
  const [searchText, setSearchText] = useState("");

  const storedUsername = localStorage.getItem("username");

  const username =
    storedUsername && storedUsername.trim()
      ? storedUsername.trim()
      : "Admin";

  const avatarLetter =
    username.charAt(0).toUpperCase() || "A";

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const clearSearch = () => {
    setSearchText("");
  };

  return (
    <header className="navbar">
      {/* Left section */}
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-menu-button"
          onClick={toggleSidebar}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >
          <FaBars />
        </button>

        <div
          className={`navbar-brand ${
            collapsed
              ? "navbar-brand-hidden"
              : ""
          }`}
        >
          <img
            src={OTClogo}
            alt="OTC Groups logo"
            className="navbar-logo"
          />

          <div className="navbar-company">
            <h1>OTC Groups</h1>

            <p>Thinking the way forward...</p>
          </div>
        </div>
      </div>

      {/* Center search section */}
      <div className="navbar-center">
        <div className="navbar-search">
          <FaSearch className="navbar-search-icon" />

          <input
            type="search"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search..."
            aria-label="Search dashboard"
          />

          {searchText && (
            <button
              type="button"
              className="navbar-search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="navbar-right">
        <button
          type="button"
          className="navbar-icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <FaBell />

          <span
            className="notification-dot"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="navbar-icon-button"
          aria-label="Settings"
          title="Settings"
        >
          <FaCog />
        </button>

        <div className="navbar-user">
          <div className="navbar-avatar">
            {avatarLetter}
          </div>

          <div className="navbar-user-details">
            <strong>{username}</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;