import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

/* =========================================
   LOGIN
========================================= */

import Login from "./Loginpage/Login";

/* =========================================
   LAYOUT
========================================= */

import Dashboard from "./component/Dashboard";

/* =========================================
   PROTECTED ROUTES
========================================= */

import ProtectedRoute from "./Protectedroute/MainloginProtectedRoute";

import Intercartingprotected from "./Protectedroute/IntercartingProtectedRoute";

import Ownvehicleprotected from "./Protectedroute/OwnvehicleProtectedRoute";

import Trackingprotected from "./Protectedroute/TrackingProtectedRoute";

import AssetsProtectedRoute from "./Protectedroute/AssetsProtectedRoute";

import KeyaccountProtectedRoute from "./Protectedroute/KeyaccountProtectedRoute";

import TrafficProtectedRoute from "./Protectedroute/TrafficProtectedRoute";

/* =========================================
   MAIN PAGES
========================================= */

import DashContent from "./pages/DashContent";

import Intercartingdash from "./pages/Intercartingdash";

import InAndOutBound from "./pages/InAndOutBound";

import Tracking from "./pages/Tracking";

import Warehouse from "./pages/Warehouse";

import DriverManagement from "./pages/DriverManagement";

import VehicleDocuments from "./pages/Vehicledocument";

import Assets from "./pages/Assets";

import Vehiclemaintenance from "./pages/Vehiclemaintenance";

import Ownvehicledash from "./pages/Ownvehicledash";

import TripDashboard from "./pages/TripDashboard";

/* =========================================
   TRIPS
========================================= */

import KeyAccount from "./pages/KeyAccount";

import TrafficManagement from "./pages/Traffic";

/* =========================================
   TRACKING
========================================= */

import Trackinginput from "./Tracking/Trackinginput";

import Tripdetails from "./Tracking/Tripdetails";

/* =========================================
   OWN VEHICLE
========================================= */

import Ownvehicledetails from "./Ownvehicledetails/Ownvehicledetails";

/* =========================================
   INTERCARTING
========================================= */

import Intercarting from "./intercarting/Intercarting";

import Vehicledetails from "./intercarting/Vehicledetails";

import Dailylog from "./intercarting/Dailylog";

import Monthlylog from "./intercarting/Monthlylog";

/* =========================================
   APP
========================================= */

function App() {
  return (
    <Routes>

      {/* =====================================
          MAIN LOGIN
      ===================================== */}

      <Route
        path="/"
        element={<Login />}
      />

      {/* =====================================
          DASHBOARD
          MAIN LOGIN ONLY
      ===================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<DashContent />}
        />
      </Route>

      {/* =====================================
          ASSETS
          MAIN LOGIN + ASSETS LOGIN
      ===================================== */}

      <Route
        path="/assets"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <AssetsProtectedRoute>
              <Assets />
            </AssetsProtectedRoute>
          }
        />
      </Route>

      {/* =====================================
          TRACKING MAIN PAGE
          MAIN LOGIN ONLY
      ===================================== */}

      <Route
        path="/tracking"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Tracking />}
        />
      </Route>

      {/* =====================================
          TRIP DETAILS
          MAIN LOGIN + TRACKING LOGIN
      ===================================== */}

      <Route
        path="/trip-details"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Trackingprotected>
              <Tripdetails />
            </Trackingprotected>
          }
        />
      </Route>

      {/* =====================================
          TRACKING INPUT
          MAIN LOGIN + TRACKING LOGIN
      ===================================== */}

      <Route
        path="/tracking-input"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Trackingprotected>
              <Trackinginput />
            </Trackingprotected>
          }
        />
      </Route>

      {/* =====================================
          INBOUND & OUTBOUND
      ===================================== */}

      <Route
        path="/inbound-outbound"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<InAndOutBound />}
        />
      </Route>

      {/* =====================================
          VEHICLE MAINTENANCE
      ===================================== */}

      <Route
        path="/vehicle-maintenance"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Vehiclemaintenance />}
        />
      </Route>

      {/* =====================================
          WAREHOUSE
      ===================================== */}

      <Route
        path="/warehouse"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Warehouse />}
        />
      </Route>

      {/* =====================================
          DRIVER MANAGEMENT
      ===================================== */}

      <Route
        path="/driver-management"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<DriverManagement />}
        />
      </Route>

      {/* =====================================
          VEHICLE DOCUMENTS
      ===================================== */}

      <Route
        path="/vehicle-documents"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<VehicleDocuments />}
        />
      </Route>

      {/* =====================================
          OWN VEHICLE DASHBOARD
      ===================================== */}

      <Route
        path="/ownvehicledetaildash"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Ownvehicledash />}
        />

        {/* =================================
            OWN VEHICLE DATA ENTRY
        ================================= */}

        <Route
          path="ownvehicledetails"
          element={
            <Ownvehicleprotected>
              <Ownvehicledetails />
            </Ownvehicleprotected>
          }
        />
      </Route>

      {/* =====================================
          INTERCARTING DASHBOARD
      ===================================== */}

      <Route
        path="/intercartingdash"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Intercartingdash />}
        />

        {/* INTERCARTING */}

        <Route
          path="intercarting"
          element={
            <Intercartingprotected>
              <Intercarting />
            </Intercartingprotected>
          }
        />

        {/* VEHICLE DETAILS */}

        <Route
          path="intercarting/vehicle-details"
          element={
            <Intercartingprotected>
              <Vehicledetails />
            </Intercartingprotected>
          }
        />

        {/* DAILY LOG */}

        <Route
          path="intercarting/daily-logs"
          element={
            <Intercartingprotected>
              <Dailylog />
            </Intercartingprotected>
          }
        />

        {/* MONTHLY LOG */}

        <Route
          path="intercarting/monthly-logs"
          element={
            <Intercartingprotected>
              <Monthlylog />
            </Intercartingprotected>
          }
        />
      </Route>

      {/* =====================================
          TRIP DASHBOARD

          MAIN LOGIN
      ===================================== */}

      <Route
        path="/trip-dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >

        {/* =================================
            TRIP LANDING PAGE
        ================================= */}

        <Route
          index
          element={<TripDashboard />}
        />

        {/* =================================
            KEY ACCOUNT MANAGEMENT

            MAIN LOGIN
            +
            KEY ACCOUNT LOGIN
        ================================= */}

        <Route
          path="key-account"
          element={
            <KeyaccountProtectedRoute>
              <KeyAccount />
            </KeyaccountProtectedRoute>
          }
        />

        {/* =================================
            TRAFFIC MANAGEMENT

            MAIN LOGIN
            +
            TRAFFIC LOGIN
        ================================= */}

        <Route
          path="traffic-management"
          element={
            <TrafficProtectedRoute>
              <TrafficManagement />
            </TrafficProtectedRoute>
          }
        />

      </Route>

      {/* =====================================
          UNKNOWN ROUTE
      ===================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;