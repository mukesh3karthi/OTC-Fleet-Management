import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";
import { createPortal } from "react-dom";

import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import "../Ownvehicledetails/ownvehicledetails.css";
// import "../pagescss/ownvehicledetails-actions.css";

import DocumentUploadModal, {
  createInitialDocuments,
} from "./Documentuploadmodal";

import Ownvehiclemodal from "./Ownvehiclemodal";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const OWN_VEHICLE_API =
  `${API_BASE_URL}/api/ownvehicles`;

const API_OPTIONS = {
  timeout: 60000,
};

const RECORDS_PER_PAGE = 4;

/*
 * IMPORTANT:
 * The backend own-vehicle routes use the numeric `id` field,
 * not MongoDB `_id`.
 */
const getVehicleId = (vehicle) =>
  vehicle?.id ??
  vehicle?.vehicleId ??
  vehicle?.ownVehicleId ??
  null;

const Ownvehicledetails = () => {
  const [vehicles, setVehicles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [apiError, setApiError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  /* ==========================================
     Add / Edit modal
  ========================================== */

  const [vehicleModalOpen, setVehicleModalOpen] =
    useState(false);

  const [selectedVehicle, setSelectedVehicle] =
    useState(null);

  /* ==========================================
     Document modal
  ========================================== */

  const [
    documentModalOpen,
    setDocumentModalOpen,
  ] = useState(false);

  const [
    selectedDocumentVehicle,
    setSelectedDocumentVehicle,
  ] = useState(null);

  const [
    vehicleDocuments,
    setVehicleDocuments,
  ] = useState(createInitialDocuments);

  const [
    documentSaving,
    setDocumentSaving,
  ] = useState(false);

  /* ==========================================
     Action menu
  ========================================== */

  const [
    activeActionMenu,
    setActiveActionMenu,
  ] = useState(null);

  const [actionMenuPosition, setActionMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  /* ==========================================
     Delete confirmation
  ========================================== */

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState({
    open: false,
    vehicle: null,
  });

  /* ==========================================
     Pagination
  ========================================== */

  const [currentPage, setCurrentPage] =
    useState(1);

  /* ==========================================
     Fetch own vehicles
  ========================================== */

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setApiError("");

      const response = await axios.get(
        OWN_VEHICLE_API,
        API_OPTIONS
      );

      const vehicleList = Array.isArray(
        response.data?.ownVehicles
      )
        ? response.data.ownVehicles
        : Array.isArray(response.data)
          ? response.data
          : [];

      setVehicles(vehicleList);
    } catch (error) {
      console.error(
        "Fetch own vehicles error:",
        error.response?.data ||
        error.message
      );

      setVehicles([]);

      setApiError(
        error.response?.data?.message ||
        "Unable to fetch own vehicles. Please check whether the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  /* ==========================================
     Close action menu outside
  ========================================== */

  useEffect(() => {
    if (activeActionMenu === null) {
      return undefined;
    }

    const closeActionMenu = () => {
      setActiveActionMenu(null);
    };

    document.addEventListener(
      "mousedown",
      closeActionMenu
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeActionMenu
      );
    };
  }, [activeActionMenu]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      setActiveActionMenu(null);

      if (deleteConfirmation.open && !deleting) {
        setDeleteConfirmation({
          open: false,
          vehicle: null,
        });
      }

      if (vehicleModalOpen && !saving) {
        setVehicleModalOpen(false);
        setSelectedVehicle(null);
      }

      if (documentModalOpen && !documentSaving) {
        setDocumentModalOpen(false);
        setSelectedDocumentVehicle(null);
        setVehicleDocuments(createInitialDocuments());
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [
    deleteConfirmation.open,
    deleting,
    vehicleModalOpen,
    saving,
    documentModalOpen,
    documentSaving,
  ]);

  useEffect(() => {
    const modalIsOpen =
      vehicleModalOpen ||
      documentModalOpen ||
      deleteConfirmation.open;

    document.documentElement.classList.toggle(
      "ownvehicle-modal-open",
      modalIsOpen
    );
    document.body.classList.toggle(
      "ownvehicle-modal-open",
      modalIsOpen
    );

    return () => {
      document.documentElement.classList.remove(
        "ownvehicle-modal-open"
      );
      document.body.classList.remove(
        "ownvehicle-modal-open"
      );
    };
  }, [
    vehicleModalOpen,
    documentModalOpen,
    deleteConfirmation.open,
  ]);

  /* ==========================================
     Pagination calculations
  ========================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      vehicles.length / RECORDS_PER_PAGE
    )
  );

  const currentVehicles = useMemo(() => {
    const lastIndex =
      currentPage * RECORDS_PER_PAGE;

    const firstIndex =
      lastIndex - RECORDS_PER_PAGE;

    return vehicles.slice(
      firstIndex,
      lastIndex
    );
  }, [vehicles, currentPage]);

  const firstRecord =
    vehicles.length === 0
      ? 0
      : (currentPage - 1) *
      RECORDS_PER_PAGE +
      1;

  const lastRecord = Math.min(
    currentPage * RECORDS_PER_PAGE,
    vehicles.length
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* ==========================================
     Statistics
  ========================================== */

  const gpsAvailableCount =
    vehicles.filter(
      (vehicle) => vehicle.gps === true
    ).length;

  const withoutGpsCount =
    vehicles.filter(
      (vehicle) => vehicle.gps !== true
    ).length;

  const currentYear = String(
    new Date().getFullYear()
  );

  const purchasedThisYearCount =
    vehicles.filter(
      (vehicle) =>
        String(vehicle.purchaseYear) ===
        currentYear
    ).length;

  /* ==========================================
     Open add vehicle modal
  ========================================== */

  const openAddVehicleModal = () => {
    setSelectedVehicle(null);
    setApiError("");
    setActiveActionMenu(null);
    setVehicleModalOpen(true);
  };

  /* ==========================================
     Open edit vehicle modal
  ========================================== */

  const openEditVehicleModal = (
    vehicle
  ) => {
    setSelectedVehicle(vehicle);
    setApiError("");
    setActiveActionMenu(null);
    setVehicleModalOpen(true);
  };

  /* ==========================================
     Close vehicle modal
  ========================================== */

  const closeVehicleModal = () => {
    if (saving) {
      return;
    }

    setVehicleModalOpen(false);
    setSelectedVehicle(null);
    setApiError("");
  };

  /* ==========================================
     Add / update vehicle
  ========================================== */

  const saveVehicle = async (
    vehicleData
  ) => {
    try {
      setSaving(true);
      setApiError("");

      const vehicleId =
        vehicleData.id ??
        vehicleData._id ??
        getVehicleId(selectedVehicle);

      // Do not send MongoDB/client-only IDs inside the request body.
      const { id, _id, ...requestData } = vehicleData;

      if (vehicleId) {
        await axios.put(
          `${OWN_VEHICLE_API}/${vehicleId}`,
          requestData,
          API_OPTIONS
        );
      } else {
        await axios.post(
          OWN_VEHICLE_API,
          requestData,
          API_OPTIONS
        );
      }

      await fetchVehicles();

      setVehicleModalOpen(false);
      setSelectedVehicle(null);
    } catch (error) {
      console.error(
        "Save own vehicle error:",
        error.response?.data ||
        error.message
      );

      const errorMessage =
        error.response?.data?.message ||
        "Unable to save vehicle.";

      setApiError(errorMessage);

      throw new Error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================
     Open document modal
  ========================================== */

  const openDocumentModal = (
    vehicle
  ) => {
    setSelectedDocumentVehicle(
      vehicle
    );

    setVehicleDocuments({
      ...createInitialDocuments(),
      ...(vehicle.documents || {}),
    });

    setActiveActionMenu(null);
    setDocumentModalOpen(true);
  };

  /* ==========================================
     Close document modal
  ========================================== */

  const closeDocumentModal = () => {
    if (documentSaving) {
      return;
    }

    setDocumentModalOpen(false);

    setSelectedDocumentVehicle(null);

    setVehicleDocuments(
      createInitialDocuments()
    );
  };

  /* ==========================================
     Save documents
  ========================================== */

  const saveVehicleDocuments = async (documents) => {
  if (!selectedDocumentVehicle) {
    throw new Error("Vehicle information is missing.");
  }

  try {
    setDocumentSaving(true);
    setApiError("");

    const vehicleId =
      getVehicleId(
        selectedDocumentVehicle
      );

    const numericVehicleId =
      Number(vehicleId);

    if (
      !Number.isInteger(
        numericVehicleId
      ) ||
      numericVehicleId <= 0
    ) {
      console.error(
        "Invalid own vehicle ID:",
        {
          vehicleId,
          selectedDocumentVehicle,
        }
      );

      throw new Error(
        "Vehicle ID is missing or invalid."
      );
    }

    const formData = new FormData();

    const documentKeys = [
      "insurance",
      "fitness",
      "nationalPermit",
      "permit",
      "tax",
      "puc",
      "rcBook",
    ];

    documentKeys.forEach((key) => {
      const documentData = documents[key] || {};

      // Save start date
      formData.append(
        `${key}StartDate`,
        documentData.startDate || ""
      );

      // Save expiry date
      formData.append(
        `${key}ExpiryDate`,
        documentData.expiryDate || ""
      );

      // Upload new or replacement file
      if (documentData.file instanceof File) {
        formData.append(
          `${key}File`,
          documentData.file
        );
      }

      // Inform backend when an old file was cancelled
      formData.append(
        `${key}RemoveExisting`,
        documentData.replacementRequired
          ? "true"
          : "false"
      );
    });

    const response = await axios.put(
      `${OWN_VEHICLE_API}/${numericVehicleId}/documents`,
      formData,
      {
        timeout: 30000,
      }
    );

    await fetchVehicles();

    setDocumentModalOpen(false);
    setSelectedDocumentVehicle(null);
    setVehicleDocuments(
      createInitialDocuments()
    );

    return response.data;
  } catch (error) {
    console.error(
      "Save vehicle documents error:",
      error.response?.data ||
        error.message
    );

    throw new Error(
      error.response?.data?.message ||
        "Unable to save vehicle documents."
    );
  } finally {
    setDocumentSaving(false);
  }
};

  /* ==========================================
   Open delete confirmation
========================================== */

  const openDeleteConfirmation = (
    vehicle
  ) => {
    setDeleteConfirmation({
      open: true,
      vehicle,
    });

    setActiveActionMenu(null);
  };

  /* ==========================================
     Close delete confirmation
  ========================================== */

  const closeDeleteConfirmation = () => {
    if (deleting) {
      return;
    }

    setDeleteConfirmation({
      open: false,
      vehicle: null,
    });
  };

  /* ==========================================
     Delete vehicle
  ========================================== */

  const confirmDeleteVehicle = async () => {
    const vehicle =
      deleteConfirmation.vehicle;

    const vehicleId = getVehicleId(vehicle);

    if (!vehicleId) {
      setApiError("Vehicle ID is missing.");
      closeDeleteConfirmation();
      return;
    }

    try {
      setDeleting(true);
      setApiError("");

      await axios.delete(
        `${OWN_VEHICLE_API}/${vehicleId}`,
        API_OPTIONS
      );

      setDeleteConfirmation({
        open: false,
        vehicle: null,
      });

      await fetchVehicles();
    } catch (error) {
      console.error(
        "Delete own vehicle error:",
        error.response?.data ||
        error.message
      );

      setApiError(
        error.response?.data?.message ||
        "Unable to delete vehicle."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ==========================================
     Toggle action menu
  ========================================== */

  const toggleActionMenu = (event, vehicleId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!vehicleId) {
      setApiError("Vehicle ID is missing.");
      return;
    }

    if (activeActionMenu === vehicleId) {
      setActiveActionMenu(null);
      return;
    }

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 104;
    const gap = 8;

    const availableBelow = window.innerHeight - buttonRect.bottom;
    const openAbove = availableBelow < menuHeight + gap;

    const top = openAbove
      ? Math.max(8, buttonRect.top - menuHeight - gap)
      : buttonRect.bottom + gap;

    const left = Math.min(
      Math.max(8, buttonRect.right - menuWidth),
      window.innerWidth - menuWidth - 8
    );

    setActionMenuPosition({ top, left });
    setActiveActionMenu(vehicleId);
  };

  /* ==========================================
     Pagination handlers
  ========================================== */

  const goToPreviousPage = () => {
    setCurrentPage((page) =>
      Math.max(1, page - 1)
    );
  };

  const goToNextPage = () => {
    setCurrentPage((page) =>
      Math.min(totalPages, page + 1)
    );
  };

  /* ==========================================
     Format date
  ========================================== */

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(
      `${dateValue}T00:00:00`
    );

    if (
      Number.isNaN(date.getTime())
    ) {
      return dateValue;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <section className="ownvehicle-page">
      <div className="ownvehicle-page-header">
        <div>
          <span className="ownvehicle-page-eyebrow">Fleet Management</span>
          <h1>Own Vehicle Management</h1>
          <p>Manage company-owned vehicles, GPS availability, documents, purchase details and vehicle records.</p>
        </div>
      </div>
{/* API error */}

      {apiError &&
        !vehicleModalOpen && (
          <div
            className="error-message"
            role="alert"
          >
            {apiError}
          </div>
        )}

      {/* Statistics */}

      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-details">
            <h4>Total Vehicles</h4>

            <h2>{vehicles.length}</h2>
          </div>

          <div className="stat-icon">
            <TruckIcon />
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-details">
            <h4>GPS Available</h4>

            <h2>
              {gpsAvailableCount}
            </h2>
          </div>

          <div className="stat-icon">
            GPS
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-details">
            <h4>Without GPS</h4>

            <h2>{withoutGpsCount}</h2>
          </div>

          <div className="stat-icon">
            GPS
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-details">
            <h4>
              Purchased This Year
            </h4>

            <h2>
              {purchasedThisYearCount}
            </h2>
          </div>

          <div className="stat-icon">
            {currentYear}
          </div>
        </article>
      </div>

      {/* Toolbar */}

      <div className="toolbar">
        <div className="toolbar-left">
          <div>
            <h3>Vehicle Records</h3>

            <p>
              Complete information about
              company-owned vehicles.
            </p>
          </div>
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className="btn-success"
            onClick={openAddVehicleModal}
          >
            <Plus size={17} />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Vehicle table */}

      <div className="table-container">
        <table className="vehicle-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Vehicle No.</th>
              <th>Vehicle Type</th>
              <th>Vehicle Make</th>
              <th>Manufacturing Year</th>
              <th>Registration Date</th>
              <th>Transport Owner</th>
              <th>Engine No.</th>
              <th>Chassis No.</th>
              <th>GPS</th>
              <th>Purchase Year</th>
              <th>Purchased From</th>
              <th>Documents</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="14"
                  className="no-data"
                >
                  Loading vehicle
                  records...
                </td>
              </tr>
            ) : currentVehicles.length ===
              0 ? (
              <tr>
                <td
                  colSpan="14"
                  className="no-data"
                >
                  No vehicles found.
                </td>
              </tr>
            ) : (
              currentVehicles.map(
                (vehicle, index) => (
                  <tr key={getVehicleId(vehicle) ?? index}>
                    <td>
                      {(currentPage - 1) *
                        RECORDS_PER_PAGE +
                        index +
                        1}
                    </td>

                    <td>
                      <span className="vehicle-number">
                        {vehicle.vehicleNo ||
                          "-"}
                      </span>
                    </td>

                    <td>
                      {vehicle.type || "-"}
                    </td>

                    <td>
                      {vehicle.vehicleMake ||
                        "-"}
                    </td>

                    <td>
                      {vehicle.manufacturingYear ||
                        "-"}
                    </td>

                    <td>
                      {formatDate(
                        vehicle.registrationDate
                      )}
                    </td>

                    <td>
                      {vehicle.transportOwner ||
                        "-"}
                    </td>

                    <td>
                      {vehicle.engineNo || "-"}
                    </td>

                    <td>
                      {vehicle.chassisNo || "-"}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${vehicle.gps
                            ? "status-active"
                            : "status-inactive"
                          }`}
                      >
                        {vehicle.gps
                          ? "Available"
                          : "Not Available"}
                      </span>
                    </td>

                    <td>
                      {vehicle.purchaseYear ||
                        "-"}
                    </td>

                    <td>
                      {vehicle.purchasedFrom ||
                        "-"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="upload-btn"
                        onClick={() =>
                          openDocumentModal(vehicle)
                        }
                      >
                        <FolderOpen size={15} />

                        <span>Open</span>
                      </button>
                    </td>

                    <td>
                      <div className="vehicle-action-menu">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Open vehicle actions"
                          aria-haspopup="menu"
                          aria-expanded={
                            activeActionMenu === getVehicleId(vehicle)
                          }
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) =>
                            toggleActionMenu(event, getVehicleId(vehicle))
                          }
                        >
                          <MoreVertical size={19} />
                        </button>

                        {activeActionMenu === getVehicleId(vehicle) &&
                          createPortal(
                            <div
                              className="action-dropdown action-dropdown-portal"
                              role="menu"
                              style={{
                                top: actionMenuPosition.top,
                                left: actionMenuPosition.left,
                              }}
                              onMouseDown={(event) =>
                                event.stopPropagation()
                              }
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() =>
                                  openEditVehicleModal(vehicle)
                                }
                              >
                                <Pencil size={16} />
                                <span>Edit Vehicle</span>
                              </button>

                              <div className="action-menu-divider" />

                              <button
                                type="button"
                                role="menuitem"
                                className="delete-action"
                                onClick={() =>
                                  openDeleteConfirmation(vehicle)
                                }
                              >
                                <Trash2 size={16} />
                                <span>Delete Vehicle</span>
                              </button>
                            </div>,
                            document.body
                          )}
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}

      {!loading &&
        vehicles.length > 0 && (
          <div className="pagination">
            <p className="pagination-info">
              Showing {firstRecord}–
              {lastRecord} of{" "}
              {vehicles.length} vehicles
            </p>

            <div className="pagination-buttons">
              <button
                type="button"
                className="page-btn"
                onClick={
                  goToPreviousPage
                }
                disabled={
                  currentPage === 1
                }
                aria-label="Previous page"
              >
                <ChevronLeft
                  size={18}
                />
              </button>

              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) =>
                  index + 1
              ).map((pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  className={`page-btn ${currentPage ===
                      pageNumber
                      ? "active"
                      : ""
                    }`}
                  onClick={() =>
                    setCurrentPage(
                      pageNumber
                    )
                  }
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                className="page-btn"
                onClick={goToNextPage}
                disabled={
                  currentPage ===
                  totalPages
                }
                aria-label="Next page"
              >
                <ChevronRight
                  size={18}
                />
              </button>
            </div>
          </div>
        )}

      {/* Add / Edit modal */}

      <Ownvehiclemodal
        open={vehicleModalOpen}
        vehicle={selectedVehicle}
        saving={saving}
        apiError={apiError}
        onClose={closeVehicleModal}
        onSave={saveVehicle}
      />

      {/* Document upload modal */}

      <DocumentUploadModal
        open={documentModalOpen}
        vehicleNumber={
          selectedDocumentVehicle
            ?.vehicleNo || ""
        }
        initialDocuments={
          vehicleDocuments
        }
        saving={documentSaving}
        onClose={closeDocumentModal}
        onSave={
          saveVehicleDocuments
        }
      />

      {/* Delete confirmation modal */}

      {deleteConfirmation.open && (
        <div
          className="delete-confirm-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteConfirmation();
            }
          }}
        >
          <div
            className="delete-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
          >
            <div
              className="delete-confirm-icon"
              aria-hidden="true"
            >
              <Trash2 size={25} />
            </div>

            <h2 id="delete-title">
              Delete Vehicle?
            </h2>

            <p id="delete-description">
              Are you sure you want to
              delete vehicle{" "}
              <strong>
                {
                  deleteConfirmation
                    .vehicle?.vehicleNo
                }
              </strong>
              ? This action cannot be
              undone.
            </p>

            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-cancel-button"
                onClick={
                  closeDeleteConfirmation
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-submit-button"
                onClick={
                  confirmDeleteVehicle
                }
                disabled={deleting}
              >
                <Trash2 size={16} />

                {deleting
                  ? "Deleting..."
                  : "Delete Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* ==========================================
   Small truck icon
========================================== */

const TruckIcon = () => (
  <svg
    width="25"
    height="25"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 17h4V5H2v12h3" />
    <path d="M14 9h4l4 4v4h-3" />
    <circle cx="7.5" cy="17.5" r="2.5" />
    <circle cx="16.5" cy="17.5" r="2.5" />
  </svg>
);

export default Ownvehicledetails;