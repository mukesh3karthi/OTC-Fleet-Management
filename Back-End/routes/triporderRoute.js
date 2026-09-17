const express = require("express");

const router = express.Router();

const {
  createTrip,
  getAllTrips,
  getTripById,
  getTripByTripId,
  updateTrip,

  // Key Account - Order Finalization
  saveOrderFinalization,

  // First Approval Management
  approveOrder,

  // Traffic
  addTrafficQuotation,

  // Second Approval Management
  confirmVehicleQuotation,

  // Tracking Input
  allocateVehicle,
  updateAllocatedVehicle,
  addDailyTracking,

  // Delete
  deleteTrip,
} = require("../controllers/triporderController");

/* =========================================================
   CREATE ORDER / TRIP
   KEY ACCOUNT

   POST /api/triporders
========================================================= */

router.post(
  "/",
  createTrip
);

/* =========================================================
   GET ALL ORDERS / TRIPS

   GET /api/triporders
========================================================= */

router.get(
  "/",
  getAllTrips
);

/* =========================================================
   GET ORDER BY BUSINESS TRIP ID

   GET /api/triporders/trip/:tripId

   IMPORTANT:
   Keep this route BEFORE /:id
========================================================= */

router.get(
  "/trip/:tripId",
  getTripByTripId
);

/* =========================================================
   KEY ACCOUNT - ORDER FINALIZATION

   PUT /api/triporders/:id/order-finalization

   BODY:

   {
     quotedRate,
     finalRate,
     commercialTerms,
     deliveryCommitments,
     clientConfirmationNotes,
     updatedBy,
     requestApproval
   }

   requestApproval: false
   -> Save Changes only

   requestApproval: true
   -> Save + Request for Approval
========================================================= */

router.put(
  "/:id/order-finalization",
  saveOrderFinalization
);

/* =========================================================
   FIRST APPROVAL MANAGEMENT

   PUT /api/triporders/:id/order-approval

   BODY:

   {
     status: "Approved" | "Rejected",
     approvedBy,
     remarks,
     rejectionReason
   }
========================================================= */

router.put(
  "/:id/order-approval",
  approveOrder
);

/* =========================================================
   TRAFFIC QUOTATION

   POST /api/triporders/:id/quotations

   BODY:

   {
     requirementId,
     transporter,
     amount,
     quotedBy,
     remarks
   }
========================================================= */

router.post(
  "/:id/quotations",
  addTrafficQuotation
);

/* =========================================================
   SECOND APPROVAL MANAGEMENT
   APPROVE / REJECT TRANSPORTER QUOTATION

   PUT /api/triporders/:id/confirm-quotation

   BODY:

   {
     requirementId,
     quotationId,
     status: "Approved" | "Rejected",
     confirmedBy,
     remarks,
     rejectionReason
   }
========================================================= */

router.put(
  "/:id/confirm-quotation",
  confirmVehicleQuotation
);

/* =========================================================
   TRACKING INPUT
   ALLOCATE ACTUAL VEHICLE

   POST /api/triporders/:id/allocated-vehicles

   BODY:

   {
     requirementId,
     confirmationId,
     quotationId,
     vehicleNumber,

     driver: {
       name,
       contactNumber
     },

     escort: {
       vehicleNumber,
       name,
       contactNumber
     },

     supervisor: {
       name,
       contactNumber
     },

     loading: {
       status,
       pointInDate,
       loadingDate,
       pointOutDate,
       haltingDays,
       remarks
     },

     unloading: {
       status,
       pointInDate,
       unloadingDate,
       pointOutDate,
       haltingDays,
       remarks
     }
   }
========================================================= */

router.post(
  "/:id/allocated-vehicles",
  allocateVehicle
);

/* =========================================================
   TRACKING INPUT
   UPDATE ALLOCATED VEHICLE

   PUT
   /api/triporders/:id/allocated-vehicles/:allocationId
========================================================= */

router.put(
  "/:id/allocated-vehicles/:allocationId",
  updateAllocatedVehicle
);

/* =========================================================
   TRACKING INPUT
   ADD DAILY TRACKING

   POST
   /api/triporders/:id/allocated-vehicles/:allocationId/tracking
========================================================= */

router.post(
  "/:id/allocated-vehicles/:allocationId/tracking",
  addDailyTracking
);

/* =========================================================
   GET ORDER BY MONGODB ID

   GET /api/triporders/:id

   IMPORTANT:
   Generic /:id route must remain BELOW
   all specific routes.
========================================================= */

router.get(
  "/:id",
  getTripById
);

/* =========================================================
   UPDATE ORDER
   KEY ACCOUNT

   PUT /api/triporders/:id
========================================================= */

router.put(
  "/:id",
  updateTrip
);

/* =========================================================
   DELETE ORDER

   DELETE /api/triporders/:id
========================================================= */

router.delete(
  "/:id",
  deleteTrip
);

/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;