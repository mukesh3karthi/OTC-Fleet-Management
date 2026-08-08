import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./Loginpage/Login";

import Dashboard from "./component/Dashboard";

import ProtectedRoute from "./Protectedroute/ProtectedRoute";
import Intercartingprotected from "./Protectedroute/Intercartingprotected";

import DashContent from "./pages/DashContent";
import Intercartingdash from "./pages/Intercartingdash";
import InAndOutBound from "./pages/InAndOutBound";
import Tracking from "./pages/Tracking";
import Warehouse from "./pages/Warehouse";
import DriverManagement from "./pages/DriverManagement";
import VehicleDocuments from "./pages/Vehicledocument";
import Assets from "./pages/Assets";
import Vehiclemaintenance from "./pages/Vehiclemaintenance";
import Ownvehicledetails from "./pages/Ownvehicledetails";

import Trackinginput from "./Tracking/Trackinginput";

import Ownvehicledash from "./Ownvehicledetails/Ownvehicledash";

import Intercarting from "./intercarting/Intercarting";
import Vehicledetails from "./intercarting/Vehicledetails";
import Dailylog from "./intercarting/Dailylog";
import Monthlylog from "./intercarting/Monthlylog";


function App() {

  return (

    <Routes>

      {/* =====================================
          LOGIN
      ===================================== */}

      <Route
        path="/"
        element={
          <Login />
        }
      />


      {/* =====================================
          DASHBOARD
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
          element={
            <DashContent />
          }
        />


        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Route>


      {/* =====================================
          ASSETS
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
            <Assets />
          }
        />

      </Route>


      {/* =====================================
          TRACKING
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
          element={
            <Tracking />
          }
        />

      </Route>


      {/* =====================================
          TRACKING INPUT

          IMPORTANT:
          Dashboard stays visible.
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
            <Trackinginput />
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
          element={
            <InAndOutBound />
          }
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
          element={
            <Vehiclemaintenance />
          }
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
          element={
            <Warehouse />
          }
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
          element={
            <DriverManagement />
          }
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
          element={
            <VehicleDocuments />
          }
        />

      </Route>


      {/* =====================================
          OWN VEHICLE
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
          element={
            <Ownvehicledash />
          }
        />


        <Route
          path="ownvehicledetails"
          element={
            <Ownvehicledetails />
          }
        />


        <Route
          path="*"
          element={
            <Navigate
              to="/ownvehicledetaildash"
              replace
            />
          }
        />

      </Route>


      {/* =====================================
          INTERCARTING
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
          element={
            <Intercartingdash />
          }
        />


        <Route
          path="intercarting"
          element={
            <Intercartingprotected>

              <Intercarting />

            </Intercartingprotected>
          }
        />


        <Route
          path="intercarting/vehicle-details"
          element={
            <Intercartingprotected>

              <Vehicledetails />

            </Intercartingprotected>
          }
        />


        <Route
          path="intercarting/daily-logs"
          element={
            <Intercartingprotected>

              <Dailylog />

            </Intercartingprotected>
          }
        />


        <Route
          path="intercarting/monthly-logs"
          element={
            <Intercartingprotected>

              <Monthlylog />

            </Intercartingprotected>
          }
        />


        <Route
          path="*"
          element={
            <Navigate
              to="/intercartingdash"
              replace
            />
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
            to="/"
            replace
          />
        }
      />

    </Routes>

  );

}


export default App;