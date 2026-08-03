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

import Ownvehicledash from "./Ownvehicledetails/Ownvehicledash";

import Intercarting from "./intercarting/Intercarting";
import Vehicledetails from "./intercarting/Vehicledetails";
import Dailylog from "./intercarting/Dailylog";
import Monthlylog from "./intercarting/Monthlylog";

function App() {
  return (
    <Routes>
      {/* Login */}
      <Route
        path="/"
        element={<Login />}
      />

      {/* Main dashboard routes */}
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

        <Route
          path="vehicle-maintenance"
          element={<Vehiclemaintenance />}
        />

        <Route
          path="assets"
          element={<Assets />}
        />

        <Route
          path="inbound-outbound"
          element={<InAndOutBound />}
        />

        <Route
          path="tracking"
          element={<Tracking />}
        />

        <Route
          path="warehouse"
          element={<Warehouse />}
        />

        <Route
          path="driver-management"
          element={<DriverManagement />}
        />

        <Route
          path="vehicle-documents"
          element={<VehicleDocuments />}
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

      {/* Own Vehicle routes */}
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

        <Route
          path="ownvehicledetails"
          element={<Ownvehicledetails />}
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

      {/* Intercarting routes */}
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

      {/* Unknown routes */}
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