import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./Loginpage/Login";

import Dashboard from "./component/Dashboard";

import ProtectedRoute
  from "./Protectedroute/MainloginProtectedRoute";

import Intercartingprotected
  from "./Protectedroute/IntercartingProtectedRoute";

import Ownvehicleprotected
  from "./Protectedroute/OwnvehicleProtectedRoute";

import Trackingprotected
  from "./Protectedroute/TrackingProtectedRoute";

import AssetsProtectedRoute
  from "./Protectedroute/AssetsProtectedRoute";

import KeyaccountProtectedRoute
  from "./Protectedroute/KeyaccountProtectedRoute";

import TrafficProtectedRoute
  from "./Protectedroute/TrafficProtectedRoute";

import DashContent
  from "./pages/DashContent";

import Intercartingdash
  from "./pages/Intercartingdash";

import InAndOutBound
  from "./pages/InAndOutBound";

import Tracking
  from "./pages/Tracking";

import Warehouse
  from "./pages/Warehouse";

import DriverManagement
  from "./pages/DriverManagement";

import VehicleDocuments
  from "./pages/Vehicledocument";

import Assets
  from "./pages/Assets";

import Vehiclemaintenance
  from "./pages/Vehiclemaintenance";

import Ownvehicledash
  from "./pages/Ownvehicledash";

import TripDashboard
  from "./pages/OrderManagement";

import KeyAccount
  from "./ordermanagement/KeyAccount";

import TrafficManagement
  from "./ordermanagement/Traffic";

import Approvalmanagement
  from "./ordermanagement/Approvalmanagement";

import Trackinginput
  from "./Tracking/AllocateVehicle";

import Tripdetails
  from "./Tracking/Tripdetails";

import Ownvehicledetails
  from "./Ownvehicledetails/Ownvehicledetails";

import Intercarting
  from "./intercarting/Intercarting";

import Vehicledetails
  from "./intercarting/Vehicledetails";

import Dailylog
  from "./intercarting/Dailylog";

import Monthlylog
  from "./intercarting/Monthlylog";

function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Login />}
      />

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
      </Route>

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
            <Ownvehicleprotected>
              <Ownvehicledetails />
            </Ownvehicleprotected>
          }
        />
      </Route>

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
      </Route>

      <Route
        path="/trip-dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <TripDashboard />
          }
        />

        <Route
          path="key-account"
          element={
            <KeyaccountProtectedRoute>
              <KeyAccount />
            </KeyaccountProtectedRoute>
          }
        />

        <Route
          path="traffic-management"
          element={
            <TrafficProtectedRoute>
              <TrafficManagement />
            </TrafficProtectedRoute>
          }
        />

        <Route
          path="approval-management"
          element={
            <Approvalmanagement />
          }
        />
      </Route>

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