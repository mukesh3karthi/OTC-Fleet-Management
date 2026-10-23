import React from "react";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  History,
  Package,
  Save,
  Trash2,
  Truck,
  Upload,
  X,
} from "lucide-react";
import "./assetsmodal.css";

export default function Assetsmodal({
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
  saveAssets,
  replacementItem,
  replacementDate,
  replacementNote,
  addReplacementHistory,
  formatDate,
  deleteReplacementHistory,
}) {
  if (!selectedVehicle || !currentRecord) return null;

  const ActiveCategoryIcon =
    categoryConfig?.[selectedCategory]?.icon || Package;
  const statusClass = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "-");

  return (
    <>
      <div
        className="vehicle-assets-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving)
            closeAssetModal();
        }}
      >
        <section
          className="vehicle-assets-modal"
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vehicle-assets-title"
        >
          <header className="vehicle-assets-modal-header">
            <div className="vehicle-assets-heading">
              <span className="vehicle-assets-header-icon">
                <Package size={22} />
              </span>
              <div>
                <h2 id="vehicle-assets-title">Vehicle Asset Management</h2>
                <p>
                  {selectedVehicle.vehicleNumber} ·{" "}
                  {selectedVehicle.siteName || "Site not assigned"}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="vehicle-assets-close"
              onClick={closeAssetModal}
              disabled={saving}
              aria-label="Close assets"
            >
              <X size={19} />
            </button>
          </header>

          <div className="vehicle-assets-modal-body">
            <section
              className="vehicle-assets-details-card"
              aria-label="Vehicle overview"
            >
              <div>
                <span>Vehicle Number</span>
                <strong>{selectedVehicle.vehicleNumber}</strong>
              </div>
              <div>
                <span>Site</span>
                <strong>{selectedVehicle.siteName || "—"}</strong>
              </div>
              <div>
                <span>Vehicle Type</span>
                <strong>{selectedVehicle.vehicleType || "—"}</strong>
              </div>
              <div>
                <span>Transport Provider</span>
                <strong>{selectedVehicle.transportProvider || "—"}</strong>
              </div>
            </section>

            <section
              className="vehicle-inspection-card"
              aria-label="Inspection details"
            >
              <div className="inspection-field">
                <label htmlFor="asset-inspection-date">
                  <CalendarDays size={15} /> Last Inspection
                </label>
                <input
                  id="asset-inspection-date"
                  type="date"
                  value={currentRecord.inspectionDate || ""}
                  onChange={(e) =>
                    updateInspectionField("inspectionDate", e.target.value)
                  }
                />
              </div>
              <div className="inspection-field">
                <label htmlFor="asset-inspected-by">
                  <CheckCircle2 size={15} /> Inspected By
                </label>
                <input
                  id="asset-inspected-by"
                  type="text"
                  placeholder="Inspector name"
                  value={currentRecord.inspectedBy || ""}
                  onChange={(e) =>
                    updateInspectionField("inspectedBy", e.target.value)
                  }
                />
              </div>
              <div className="inspection-progress">
                <div className="inspection-progress-title">
                  <span>Overall Completion</span>
                  <strong>{vehicleSummary.completion}%</strong>
                </div>
                <div className="inspection-progress-track">
                  <span
                    style={{
                      width: `${Math.max(0, Math.min(100, Number(vehicleSummary.completion) || 0))}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <nav className="vehicle-assets-tabs" aria-label="Asset categories">
              {Object.entries(categoryConfig || {}).map(([key, category]) => {
                const Icon = category.icon || Package;
                const summary = calculateCategorySummary(currentRecord[key]);
                return (
                  <button
                    type="button"
                    key={key}
                    className={selectedCategory === key ? "active" : ""}
                    aria-current={selectedCategory === key ? "page" : undefined}
                    onClick={() => setSelectedCategory(key)}
                  >
                    <Icon size={15} />
                    <span>{category.label}</span>
                    <small>
                      {summary.available}/{summary.total}
                    </small>
                  </button>
                );
              })}
            </nav>

            <section
              className="asset-category-summary"
              aria-label="Category summary"
            >
              <div>
                <span>Total Items</span>
                <strong>{categorySummary.total}</strong>
              </div>
              <div>
                <span>Available</span>
                <strong className="available-text">
                  {categorySummary.available}
                </strong>
              </div>
              <div>
                <span>Missing</span>
                <strong className="missing-text">
                  {categorySummary.missing}
                </strong>
              </div>
              <div>
                <span>Damaged</span>
                <strong className="damaged-text">
                  {categorySummary.damaged}
                </strong>
              </div>
            </section>

            <div
              className="asset-items-table-wrapper"
              tabIndex={0}
              aria-label="Vehicle asset items table"
            >
              <table className="asset-items-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Item Name</th>
                    <th>Image</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>History</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentItems || []).map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td className="asset-item-name-cell">
                        <div className="asset-item-name-content">
                          <span className="asset-item-thumbnail">
                            {item.image ? (
                              <img src={item.image} alt="" />
                            ) : (
                              <ActiveCategoryIcon size={17} />
                            )}
                          </span>
                          <strong>{item.itemName}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="asset-image-cell">
                          {item.image ? (
                            <>
                              <img src={item.image} alt={item.itemName} />
                              <button
                                type="button"
                                title="Remove image"
                                aria-label={`Remove ${item.itemName} image`}
                                onClick={() => removeImage(index)}
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <label title="Upload image">
                              <Camera size={17} />
                              <input
                                type="file"
                                accept="image/*"
                                aria-label={`Upload ${item.itemName} image`}
                                onChange={(e) => handleImageUpload(index, e)}
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
                          aria-label={`${item.itemName} quantity`}
                          value={item.quantity ?? ""}
                          onChange={(e) =>
                            updateAssetItem(index, "quantity", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <select
                          aria-label={`${item.itemName} status`}
                          value={item.status}
                          className={`asset-status-select ${statusClass(item.status)}`}
                          onChange={(e) =>
                            updateAssetItem(index, "status", e.target.value)
                          }
                        >
                          {[
                            "Available",
                            "Missing",
                            "Damaged",
                            "Under Repair",
                            "Not Required",
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          maxLength={250}
                          aria-label={`${item.itemName} remarks`}
                          placeholder="Add remarks"
                          value={item.remarks || ""}
                          onChange={(e) =>
                            updateAssetItem(index, "remarks", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="asset-history-button"
                          aria-label={`${item.itemName} replacement history`}
                          onClick={() => {
                            setReplacementItem(item);
                            setReplacementDate("");
                            setReplacementNote("");
                          }}
                        >
                          <History size={15} />{" "}
                          {(item.replacementHistory || []).length}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {message && (
              <div className="vehicle-assets-message" role="status">
                {message}
              </div>
            )}
          </div>

          <footer className="vehicle-assets-modal-footer">
            <span className="assets-footer-help">
              Update assets and save the vehicle record
            </span>
            <div className="vehicle-assets-save-actions">
              <button
                type="button"
                className="assets-cancel-button"
                onClick={closeAssetModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="assets-save-button"
                onClick={saveAssets}
                disabled={saving}
              >
                <Save size={16} /> {saving ? "Saving..." : "Save Assets"}
              </button>
            </div>
          </footer>
        </section>
      </div>

      {replacementItem && (
        <div className="replacement-history-overlay">
          <section
            className="replacement-history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="replacement-history-title"
          >
            <header>
              <div>
                <h3 id="replacement-history-title">Replacement History</h3>
                <p>{replacementItem.itemName}</p>
              </div>
              <button
                type="button"
                aria-label="Close replacement history"
                onClick={() => setReplacementItem(null)}
              >
                <X size={19} />
              </button>
            </header>
            <div className="replacement-history-form">
              <label>
                Replacement Date
                <input
                  type="date"
                  value={replacementDate}
                  onChange={(e) => setReplacementDate(e.target.value)}
                />
              </label>
              <label>
                Details
                <textarea
                  rows={2}
                  maxLength={300}
                  placeholder="Enter replacement details"
                  value={replacementNote}
                  onChange={(e) => setReplacementNote(e.target.value)}
                />
              </label>
              <button type="button" onClick={addReplacementHistory}>
                <Upload size={15} /> Add History
              </button>
            </div>
            <div className="replacement-history-list">
              {(replacementItem.replacementHistory || []).length ? (
                replacementItem.replacementHistory.map((history) => (
                  <article key={history.id}>
                    <div>
                      <strong>{formatDate(history.date)}</strong>
                      <p>{history.note}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Delete replacement entry"
                      onClick={() =>
                        deleteReplacementHistory(replacementItem.id, history.id)
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))
              ) : (
                <p className="replacement-empty">
                  No replacement history available.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
