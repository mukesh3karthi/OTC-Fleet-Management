import React from "react";

import {
  CalendarDays,
  Camera,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  History,
  Package,
  Printer,
  Save,
  Trash2,
  Truck,
  Upload,
  X,
} from "lucide-react";

import "../Assets/assetsmodal.css";

const Assetsmodal = ({
  selectedVehicle,
  currentRecord,
  saving,
  closeAssetModal,
  modalRef,
  vehicleSummary,
  updateInspectionField,
  categoryConfig,
  calculateCategorySummary,
  selectedCategory,
  setSelectedCategory,
  categorySummary,
  currentItems,
  removeImage,
  handleImageUpload,
  updateAssetItem,
  setReplacementItem,
  setReplacementDate,
  setReplacementNote,
  message,
  printAssets,
  exportExcel,
  exportPdf,
  saveAssets,
  replacementItem,
  replacementDate,
  replacementNote,
  addReplacementHistory,
  formatDate,
  deleteReplacementHistory,
}) => {
  if (!selectedVehicle || !currentRecord) {
    return null;
  }

  const CATEGORY_CONFIG = categoryConfig;

  const ActiveCategoryIcon =
    CATEGORY_CONFIG?.[
      selectedCategory
    ]?.icon || Package;

  /*
    Keep mouse-wheel scrolling inside the asset table.
    The parent modal will not scroll while the pointer
    is over this table.
  */
  const handleAssetTableWheel = (
    event
  ) => {
    const tableContainer =
      event.currentTarget;

    const canScrollVertically =
      tableContainer.scrollHeight >
      tableContainer.clientHeight;

    if (!canScrollVertically) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    tableContainer.scrollTop +=
      event.deltaY;
  };

  return (
    <>
      {selectedVehicle &&
        currentRecord && (
          <div
            className="vehicle-assets-overlay"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                  event.currentTarget &&
                !saving
              ) {
                closeAssetModal();
              }
            }}
          >
            <section
              ref={modalRef}
              className="vehicle-assets-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="vehicle-assets-title"
            >
              <header className="vehicle-assets-modal-header">
                <div>
                  <div className="vehicle-assets-title-row">
                    <Package
                      size={24}
                    />

                    <h2 id="vehicle-assets-title">
                      Vehicle Assets -{" "}
                      {
                        selectedVehicle.vehicleNumber
                      }
                    </h2>
                  </div>

                  <p>
                    Manage all materials
                    assigned to this
                    vehicle.
                  </p>
                </div>

                <button
                  type="button"
                  className="vehicle-assets-close"
                  onClick={
                    closeAssetModal
                  }
                  disabled={saving}
                  aria-label="Close modal"
                >
                  <X size={22} />
                </button>
              </header>

              <div className="vehicle-assets-modal-body">
                <section className="vehicle-assets-details-card">
                  <div className="vehicle-detail-icon">
                    <Truck size={32} />
                  </div>

                  <div>
                    <span>
                      Vehicle Number
                    </span>
                    <strong>
                      {
                        selectedVehicle.vehicleNumber
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Site</span>
                    <strong>
                      {selectedVehicle.siteName ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Vehicle Type
                    </span>
                    <strong>
                      {selectedVehicle.vehicleType ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Transport Provider
                    </span>
                    <strong>
                      {selectedVehicle.transportProvider ||
                        "-"}
                    </strong>
                  </div>
                </section>

                <section className="vehicle-inspection-card">
                  <div className="inspection-field">
                    <label htmlFor="asset-inspection-date">
                      <CalendarDays
                        size={16}
                      />
                      Last Inspection
                      Date
                    </label>

                    <input
                      id="asset-inspection-date"
                      type="date"
                      value={
                        currentRecord.inspectionDate
                      }
                      onChange={(
                        event
                      ) =>
                        updateInspectionField(
                          "inspectionDate",
                          event.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="inspection-field">
                    <label htmlFor="asset-inspected-by">
                      <CheckCircle2
                        size={16}
                      />
                      Inspected By
                    </label>

                    <input
                      id="asset-inspected-by"
                      type="text"
                      placeholder="Enter inspector name"
                      value={
                        currentRecord.inspectedBy
                      }
                      onChange={(
                        event
                      ) =>
                        updateInspectionField(
                          "inspectedBy",
                          event.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="inspection-progress">
                    <span>
                      Overall Completion
                    </span>

                    <strong>
                      {
                        vehicleSummary.completion
                      }
                      %
                    </strong>

                    <div>
                      <span
                        style={{
                          width: `${vehicleSummary.completion}%`,
                        }}
                      />
                    </div>
                  </div>
                </section>

                <nav className="vehicle-assets-tabs">
                  {Object.entries(
                    CATEGORY_CONFIG
                  ).map(
                    ([
                      categoryKey,
                      category,
                    ]) => {
                      const Icon =
                        category.icon;

                      const summary =
                        calculateCategorySummary(
                          currentRecord[
                            categoryKey
                          ]
                        );

                      return (
                        <button
                          type="button"
                          key={
                            categoryKey
                          }
                          className={
                            selectedCategory ===
                            categoryKey
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setSelectedCategory(
                              categoryKey
                            )
                          }
                        >
                          <Icon
                            size={18}
                          />

                          <span>
                            {
                              category.label
                            }
                          </span>

                          <small>
                            {
                              summary.available
                            }
                            /
                            {
                              summary.total
                            }
                          </small>
                        </button>
                      );
                    }
                  )}
                </nav>

                <section className="asset-category-summary">
                  <div>
                    <span>
                      Total Items
                    </span>
                    <strong>
                      {
                        categorySummary.total
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Available
                    </span>
                    <strong className="available-text">
                      {
                        categorySummary.available
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Missing
                    </span>
                    <strong className="missing-text">
                      {
                        categorySummary.missing
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Damaged
                    </span>
                    <strong className="damaged-text">
                      {
                        categorySummary.damaged
                      }
                    </strong>
                  </div>
                </section>

                <div
                  className="asset-items-table-wrapper"
                  onWheel={
                    handleAssetTableWheel
                  }
                  tabIndex={0}
                  aria-label="Vehicle asset items table"
                >
                  <table className="asset-items-table">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>
                          Item Name
                        </th>
                        <th>Image</th>
                        <th>
                          Quantity
                        </th>
                        <th>Status</th>
                        <th>
                          Remarks
                        </th>
                        <th>
                          History
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentItems.map(
                        (
                          item,
                          itemIndex
                        ) => (
                          <tr
                            key={
                              item.id
                            }
                          >
                            <td>
                              {itemIndex +
                                1}
                            </td>

                            <td className="asset-item-name-cell">
                              <div className="asset-item-name-content">
                                <div className="asset-item-thumbnail">
                                  {item.image ? (
                                    <img
                                      src={
                                        item.image
                                      }
                                      alt=""
                                    />
                                  ) : (
                                    <ActiveCategoryIcon
                                      size={17}
                                      aria-hidden="true"
                                    />
                                  )}
                                </div>

                                <strong>
                                  {
                                    item.itemName
                                  }
                                </strong>
                              </div>
                            </td>

                            <td>
                              <div className="asset-image-cell">
                                {item.image ? (
                                  <>
                                    <img
                                      src={
                                        item.image
                                      }
                                      alt={
                                        item.itemName
                                      }
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeImage(
                                          itemIndex
                                        )
                                      }
                                      title="Remove image"
                                    >
                                      <X
                                        size={
                                          13
                                        }
                                      />
                                    </button>
                                  </>
                                ) : (
                                  <label>
                                    <Camera
                                      size={
                                        17
                                      }
                                    />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(
                                        event
                                      ) =>
                                        handleImageUpload(
                                          itemIndex,
                                          event
                                        )
                                      }
                                    />
                                  </label>
                                )}
                              </div>
                            </td>

                            <td>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={
                                  item.quantity
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateAssetItem(
                                    itemIndex,
                                    "quantity",
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <select
                                value={
                                  item.status
                                }
                                className={`asset-status-select ${item.status
                                  .toLowerCase()
                                  .replaceAll(
                                    " ",
                                    "-"
                                  )}`}
                                onChange={(
                                  event
                                ) =>
                                  updateAssetItem(
                                    itemIndex,
                                    "status",
                                    event
                                      .target
                                      .value
                                  )
                                }
                              >
                                <option value="Available">
                                  Available
                                </option>

                                <option value="Missing">
                                  Missing
                                </option>

                                <option value="Damaged">
                                  Damaged
                                </option>

                                <option value="Under Repair">
                                  Under
                                  Repair
                                </option>

                                <option value="Not Required">
                                  Not
                                  Required
                                </option>
                              </select>
                            </td>

                            <td>
                              <input
                                type="text"
                                placeholder="Enter remarks"
                                maxLength={
                                  250
                                }
                                value={
                                  item.remarks
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateAssetItem(
                                    itemIndex,
                                    "remarks",
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <button
                                type="button"
                                className="asset-history-button"
                                onClick={() => {
                                  setReplacementItem(
                                    item
                                  );

                                  setReplacementDate(
                                    ""
                                  );

                                  setReplacementNote(
                                    ""
                                  );
                                }}
                              >
                                <History
                                  size={
                                    16
                                  }
                                />

                                {
                                  (
                                    item.replacementHistory ||
                                    []
                                  )
                                    .length
                                }
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {message && (
                  <div className="vehicle-assets-message">
                    {message}
                  </div>
                )}
              </div>

              <footer className="vehicle-assets-modal-footer">
                <div className="vehicle-assets-export-actions">
                  <button
                    type="button"
                    onClick={
                      printAssets
                    }
                    title="Print checklist"
                  >
                    <Printer
                      size={17}
                    />
                    Print
                  </button>

                  <button
                    type="button"
                    onClick={
                      exportExcel
                    }
                  >
                    <FileSpreadsheet
                      size={17}
                    />
                    Excel
                  </button>

                  <button
                    type="button"
                    onClick={
                      exportPdf
                    }
                  >
                    <FileText
                      size={17}
                    />
                    PDF
                  </button>
                </div>

                <div className="vehicle-assets-save-actions">
                  <button
                    type="button"
                    className="assets-cancel-button"
                    onClick={
                      closeAssetModal
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="assets-save-button"
                    onClick={
                      saveAssets
                    }
                    disabled={saving}
                  >
                    <Save size={17} />

                    {saving
                      ? "Saving..."
                      : "Save Assets"}
                  </button>
                </div>
              </footer>
            </section>
          </div>
        )}

      {replacementItem && (
        <div className="replacement-history-overlay">
          <section className="replacement-history-modal">
            <header>
              <div>
                <h3>
                  Replacement History
                </h3>

                <p>
                  {
                    replacementItem.itemName
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setReplacementItem(
                    null
                  )
                }
              >
                <X size={20} />
              </button>
            </header>

            <div className="replacement-history-form">
              <label>
                Replacement Date

                <input
                  type="date"
                  value={
                    replacementDate
                  }
                  onChange={(
                    event
                  ) =>
                    setReplacementDate(
                      event.target
                        .value
                    )
                  }
                />
              </label>

              <label>
                Details

                <textarea
                  placeholder="Enter replacement details"
                  maxLength={300}
                  value={
                    replacementNote
                  }
                  onChange={(
                    event
                  ) =>
                    setReplacementNote(
                      event.target
                        .value
                    )
                  }
                />
              </label>

              <button
                type="button"
                onClick={
                  addReplacementHistory
                }
              >
                <Upload size={16} />
                Add History
              </button>
            </div>

            <div className="replacement-history-list">
              {(
                replacementItem.replacementHistory ||
                []
              ).length > 0 ? (
                replacementItem.replacementHistory.map(
                  (history) => (
                    <article
                      key={
                        history.id
                      }
                    >
                      <div>
                        <strong>
                          {formatDate(
                            history.date
                          )}
                        </strong>

                        <p>
                          {
                            history.note
                          }
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          deleteReplacementHistory(
                            replacementItem.id,
                            history.id
                          )
                        }
                      >
                        <Trash2
                          size={16}
                        />
                      </button>
                    </article>
                  )
                )
              ) : (
                <p className="replacement-empty">
                  No replacement history
                  available.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

    </>
  );
};

export default Assetsmodal;