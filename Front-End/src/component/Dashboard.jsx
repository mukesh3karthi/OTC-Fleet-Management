import React, {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

import "../css/dashboard.css";


const MOBILE_BREAKPOINT = 560;


const Dashboard = () => {

  /*
    DESKTOP
    false = full sidebar
    true  = collapsed sidebar

    MOBILE
    false = sidebar open
    true  = sidebar closed
  */

  const [
    collapsed,
    setCollapsed,
  ] = useState(
    () =>
      window.innerWidth <=
      MOBILE_BREAKPOINT
  );


  /* =========================================
     TOGGLE SIDEBAR
  ========================================= */

  const toggleSidebar = () => {

    setCollapsed(
      (prev) => !prev
    );

  };


  /* =========================================
     WINDOW RESIZE
  ========================================= */

  useEffect(() => {

    const handleResize = () => {

      if (
        window.innerWidth <=
        MOBILE_BREAKPOINT
      ) {

        setCollapsed(true);

      }

    };


    window.addEventListener(
      "resize",
      handleResize
    );


    return () => {

      window.removeEventListener(
        "resize",
        handleResize
      );

    };

  }, []);


  /* =========================================
     DISABLE BODY SCROLL
     WHEN MOBILE SIDEBAR OPEN
  ========================================= */

  useEffect(() => {

    const mobile =
      window.innerWidth <=
      MOBILE_BREAKPOINT;


    if (
      mobile &&
      !collapsed
    ) {

      document.body.style.overflow =
        "hidden";

    } else {

      document.body.style.overflow =
        "";

    }


    return () => {

      document.body.style.overflow =
        "";

    };

  }, [
    collapsed,
  ]);


  /* =========================================
     RETURN
  ========================================= */

  return (

    <div className="dashboard-layout">


      {/* =========================
          NAVBAR
      ========================= */}

      <Navbar
        collapsed={
          collapsed
        }
        toggleSidebar={
          toggleSidebar
        }
      />


      {/* =========================
          DASHBOARD BODY
      ========================= */}

      <div className="dashboard-body">


        {/* =========================
            SIDEBAR
        ========================= */}

        <Sidebar
          collapsed={
            collapsed
          }
          setCollapsed={
            setCollapsed
          }
        />


        {/* =========================
            MAIN CONTENT
        ========================= */}

        <main
          className={`dashboard-main-content ${
            collapsed
              ? "sidebar-collapsed"
              : ""
          }`}
        >

          <Outlet />

        </main>

      </div>

    </div>

  );

};


export default Dashboard;