
import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import Login from "./Loginpage/Login";
import Dashboard from "./component/Dashboard";

import ProtectedRoute from "./Protectedroute/MainloginProtectedRoute";
import Intercartingprotected from "./Protectedroute/IntercartingProtectedRoute";
import Ownvehicleprotected from "./Protectedroute/OwnvehicleProtectedRoute";
import Trackingprotected from "./Protectedroute/TrackingProtectedRoute";
import AssetsProtectedRoute from "./Protectedroute/AssetsProtectedRoute";
import KeyaccountProtectedRoute from "./Protectedroute/KeyaccountProtectedRoute";
import TrafficProtectedRoute from "./Protectedroute/TrafficProtectedRoute";
import ApprovalProtectedRoute from "./Protectedroute/ApprovalProtectedRoute";

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
import TripDashboard from "./pages/OrderManagement";

import KeyAccount from "./ordermanagement/KeyAccount";
import Lifecyclemodal from "./ordermanagement/Lifecyclemodal";
import TrafficManagement from "./ordermanagement/Traffic";
import Approvalmanagement from "./ordermanagement/Approvalmanagement";

import Trackinginput from "./Tracking/AllocateVehicle";
import Tripdetails from "./Tracking/Tripdetails";
import VehicleDetails from "./Tracking/VehicleDetails";
import CraneVehicles from "./Tracking/CraneVehicles";
import ProjectMovement from "./Tracking/ProjectMovement";

import Ownvehicledetails from "./Ownvehicledetails/Ownvehicledetails";

import Intercarting from "./intercarting/Intercarting";
import Intercartingorder from "./intercarting/Intercartingorder";
import Vehicledetails from "./intercarting/Vehicledetails";
import Dailylog from "./intercarting/Dailylog";
import Monthlylog from "./intercarting/Monthlylog";

function App() {
  return (
    <Routes>
      {/* MAIN LOGIN */}
      <Route path="/" element={<Login />} />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashContent />} />
      </Route>

      {/* ASSETS */}
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

      {/* TRACKING DASHBOARD */}
      <Route
        path="/tracking"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Tracking />} />
      </Route>

      {/* PROJECT MOVEMENT */}
      {/* Main login protection only */}
      <Route
        path="/project-movement/:id"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProjectMovement />} />
      </Route>

      {/* VEHICLE DETAILS */}
      <Route
        path="/vehicle-details/:id"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<VehicleDetails />} />
      </Route>

      {/* TRIP DETAILS */}
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

      {/* CRANE VEHICLES */}
      <Route
        path="/crane-vehicles/:id"
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
              <CraneVehicles />
            </Trackingprotected>
          }
        />
      </Route>

      {/* CRANE VEHICLE MOVEMENT */}
      <Route
        path="/crane-vehicles/:id/movement/:allocationId"
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
              <Tripdetails movementOnly />
            </Trackingprotected>
          }
        />
      </Route>

      {/* TRACKING INPUT / VEHICLE ALLOCATION */}
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

      {/* INBOUND AND OUTBOUND */}
      <Route
        path="/inbound-outbound"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<InAndOutBound />} />
      </Route>

      {/* VEHICLE MAINTENANCE */}
      <Route
        path="/vehicle-maintenance"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Vehiclemaintenance />} />
      </Route>

      {/* WAREHOUSE */}
      <Route
        path="/warehouse"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Warehouse />} />
      </Route>

      {/* DRIVER MANAGEMENT */}
      <Route
        path="/driver-management"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DriverManagement />} />
      </Route>

      {/* VEHICLE DOCUMENTS */}
      <Route
        path="/vehicle-documents"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<VehicleDocuments />} />
      </Route>

      {/* OWN VEHICLE DASHBOARD */}
      <Route
        path="/ownvehicledetaildash"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Ownvehicledash />} />

        <Route
          path="ownvehicledetails"
          element={
            <Ownvehicleprotected>
              <Ownvehicledetails />
            </Ownvehicleprotected>
          }
        />
      </Route>

      {/* INTERCARTING DASHBOARD */}
      <Route
        path="/intercartingdash"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Intercartingdash />} />

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
          path="intercarting/intercarting-orders"
          element={
            <Intercartingprotected>
              <Intercartingorder />
            </Intercartingprotected>
          }
        />
      </Route>

      {/* ORDER MANAGEMENT DASHBOARD */}
      <Route
        path="/trip-dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<TripDashboard />} />

        {/* KEY ACCOUNT - SHARED PROTECTED ROUTE */}
        <Route
          path="key-account"
          element={
            <KeyaccountProtectedRoute>
              <Outlet />
            </KeyaccountProtectedRoute>
          }
        >
          {/* KEY ACCOUNT DASHBOARD */}
          <Route index element={<KeyAccount />} />

          {/* ORDER LIFECYCLE FULL PAGE */}
          <Route
            path="orders/:orderId"
            element={<Lifecyclemodal />}
          />
        </Route>

        {/* TRAFFIC MANAGEMENT */}
        <Route
          path="traffic-management"
          element={
            <TrafficProtectedRoute>
              <TrafficManagement />
            </TrafficProtectedRoute>
          }
        />

        {/* APPROVAL MANAGEMENT */}
        <Route
          path="approval-management"
          element={
            <ApprovalProtectedRoute>
              <Approvalmanagement />
            </ApprovalProtectedRoute>
          }
        />
      </Route>

      {/* FALLBACK ROUTE */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;
