import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  FileUp,
  FolderOpen,
  Globe2,
  Receipt,
  Save,
  ShieldCheck,
  Upload,
  Wrench,
  X,
  Wind,
} from "lucide-react";

import "./documentuploadmodal.css";

const BACKEND_URL = "http://localhost:5000";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const createDocumentValue = () => ({
  startDate: "",
  expiryDate: "",
  file: null,
  fileName: "",
  originalName: "",
  filePath: "",
  fileUrl: "",
  url: "",
  path: "",
  replacementRequired: false,
});

export const createInitialDocuments = () => ({
  insurance: createDocumentValue(),
  fitness: createDocumentValue(),
  nationalPermit: createDocumentValue(),
  permit: createDocumentValue(),
  tax: createDocumentValue(),
  puc: createDocumentValue(),
  rcBook: createDocumentValue(),
});

const DOCUMENT_ITEMS = [
  {
    key: "rcBook",
    title: "RC Book",
    description: "Vehicle registration certificate",
    icon: FileText,
  },
  {
    key: "insurance",
    title: "Insurance",
    description: "Copy of insurance policy",
    icon: ShieldCheck,
  },
  {
    key: "fitness",
    title: "Fitness",
    description: "Fitness certificate",
    icon: Wrench,
  },
  {
    key: "nationalPermit",
    title: "National Permit",
    description: "All states permit document",
    icon: Globe2,
  },
  {
    key: "permit",
    title: "Permit",
    description: "Local or state permit document",
    icon: ClipboardList,
  },
  {
    key: "tax",
    title: "Tax Receipt",
    description: "Latest road tax payment receipt",
    icon: Receipt,
  },
  {
    key: "puc",
    title: "PUC",
    description: "Pollution certificate",
    icon: Wind,
  },
];

const VALIDITY_ITEMS = [
  { key: "insurance", title: "INSURANCE" },
  { key: "fitness", title: "FITNESS" },
  { key: "nationalPermit", title: "NATIONAL PERMIT" },
  { key: "permit", title: "PERMIT" },
  { key: "tax", title: "TAX" },
  { key: "puc", title: "PUC" },
];

const cloneDocuments = (documents) => {
  const defaults = createInitialDocuments();

  return Object.keys(defaults).reduce((result, key) => {
    result[key] = {
      ...defaults[key],
      ...(documents?.[key] || {}),
      file: null,
      replacementRequired: false,
    };
    return result;
  }, {});
};

const getStoredPath = (documentData) =>
  documentData?.fileUrl ||
  documentData?.url ||
  documentData?.filePath ||
  documentData?.path ||
  "";

const getDocumentUrl = (documentData) => {
  const storedPath = getStoredPath(documentData);

  if (!storedPath) {
    return "";
  }

  if (
    storedPath.startsWith("http://") ||
    storedPath.startsWith("https://") ||
    storedPath.startsWith("blob:")
  ) {
    return storedPath;
  }

  const normalizedPath = storedPath.startsWith("/")
    ? storedPath
    : `/${storedPath}`;

  return `${BACKEND_URL}${normalizedPath}`;
};

const hasStoredDocument = (documentData) =>
  Boolean(
    getStoredPath(documentData) ||
      documentData?.fileName ||
      documentData?.filename ||
      documentData?.originalName
  );

const getStoredFileName = (documentData, fallbackTitle) =>
  documentData?.originalName ||
  documentData?.fileName ||
  documentData?.filename ||
  documentData?.name ||
  `${fallbackTitle} document`;

const formatFileSize = (size) => {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const clearStoredDocumentFields = (documentData) => ({
  ...documentData,
  file: null,
  fileName: "",
  filename: "",
  originalName: "",
  name: "",
  filePath: "",
  fileUrl: "",
  url: "",
  path: "",
  replacementRequired: true,
});

const DocumentUploadModal = ({
  open,
  vehicleNumber = "",
  initialDocuments,
  saving = false,
  onClose,
  onSave,
}) => {
  const [documents, setDocuments] = useState(createInitialDocuments);
  const [uploadMode, setUploadMode] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setDocuments(cloneDocuments(initialDocuments));
    setUploadMode(false);
    setError("");
  }, [open, initialDocuments]);

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, saving, onClose]);

  const availableDocumentCount = useMemo(
    () =>
      Object.values(documents).filter(
        (documentData) => documentData?.file || hasStoredDocument(documentData)
      ).length,
    [documents]
  );

  const newFileCount = useMemo(
    () =>
      Object.values(documents).filter((documentData) => documentData?.file)
        .length,
    [documents]
  );

  if (!open) return null;

  const handleDateChange = (documentKey, fieldName, value) => {
    setDocuments((current) => ({
      ...current,
      [documentKey]: {
        ...current[documentKey],
        [fieldName]: value,
      },
    }));
  };

  const handleFileChange = (event, documentKey) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) return;

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setError("Only PDF, JPG and PNG files are allowed.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("The selected file exceeds the 5 MB limit.");
      return;
    }

    setError("");
    setDocuments((current) => ({
      ...current,
      [documentKey]: {
        ...current[documentKey],
        file: selectedFile,
        replacementRequired: false,
      },
    }));
  };

  const openSelectedFile = (file) => {
    const previewUrl = URL.createObjectURL(file);
    window.open(previewUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(previewUrl), 10000);
  };

  const openFilePicker = (key) => {
    document.getElementById(`${key}-file`)?.click();
  };

  const handleCardClick = (key, documentData) => {
    if (saving) return;

    if (uploadMode) {
      openFilePicker(key);
      return;
    }

    if (documentData?.file) {
      openSelectedFile(documentData.file);
      return;
    }

    const storedUrl = getDocumentUrl(documentData);
    if (storedUrl) {
      window.open(storedUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setError("Click Upload Documents first to add a document.");
  };

  const handleCardKeyDown = (event, key, documentData) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick(key, documentData);
    }
  };

  const handleCancelExisting = (event, key) => {
    event.stopPropagation();

    setDocuments((current) => ({
      ...current,
      [key]: clearStoredDocumentFields(current[key]),
    }));

    setError("Existing document removed from this form. Select a new file before saving.");
  };

  const handleCancelNewFile = (event, key) => {
    event.stopPropagation();

    setDocuments((current) => ({
      ...current,
      [key]: {
        ...current[key],
        file: null,
      },
    }));
  };

  const validateDates = () => {
    for (const item of VALIDITY_ITEMS) {
      const documentData = documents[item.key];

      if (
        documentData?.startDate &&
        documentData?.expiryDate &&
        documentData.startDate > documentData.expiryDate
      ) {
        setError(`${item.title}: expiry date must be after the start date.`);
        return false;
      }
    }

    return true;
  };

  const validateReplacements = () => {
    const missingReplacement = DOCUMENT_ITEMS.find(
      ({ key }) => documents[key]?.replacementRequired && !documents[key]?.file
    );

    if (missingReplacement) {
      setError(
        `${missingReplacement.title}: select a new document after cancelling the existing document.`
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    setError("");

    if (!validateDates() || !validateReplacements()) return;

    try {
      await onSave?.(documents);
    } catch (saveError) {
      setError(saveError?.message || "Unable to save vehicle documents.");
    }
  };

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget && !saving) {
      onClose?.();
    }
  };

  return (
    <div className="document-upload-overlay" onMouseDown={handleOverlayMouseDown}>
      <div
        className="document-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-modal-title"
      >
        <header className="document-upload-header">
          <div className="document-upload-title">
            <ShieldCheck size={27} />
            <div>
              <h2 id="document-modal-title">
                Compliance &amp; Document Management
              </h2>
              {vehicleNumber && (
                <p>
                  Vehicle Number: <strong>{vehicleNumber}</strong>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="document-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close popup"
          >
            <X size={24} />
          </button>
        </header>

        <div className="document-upload-body">
          <section className="document-section">
            <div className="document-section-heading">
              <CalendarDays size={21} />
              <h3>Validity Dates</h3>
            </div>

            <div className="validity-grid">
              {VALIDITY_ITEMS.map(({ key, title }) => {
                const documentData = documents[key] || {};

                return (
                  <article className="validity-card" key={key}>
                    <h4>{title}</h4>
                    <div className="validity-input-grid">
                      <div className="document-input-group">
                        <label htmlFor={`${key}-start-date`}>START DATE</label>
                        <input
                          id={`${key}-start-date`}
                          type="date"
                          value={documentData.startDate || ""}
                          onChange={(event) =>
                            handleDateChange(key, "startDate", event.target.value)
                          }
                          disabled={saving}
                        />
                      </div>

                      <div className="document-input-group">
                        <label htmlFor={`${key}-expiry-date`}>EXPIRY DATE</label>
                        <input
                          id={`${key}-expiry-date`}
                          type="date"
                          value={documentData.expiryDate || ""}
                          onChange={(event) =>
                            handleDateChange(key, "expiryDate", event.target.value)
                          }
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="document-section upload-section">
            <div className="document-upload-section-heading">
              <div className="document-section-heading">
                <FileUp size={21} />
                <h3>Document Details</h3>
              </div>

              <span>
                {uploadMode
                  ? "Upload mode is active. Cancel an existing document, then choose a new file."
                  : "Click an uploaded document to view it."}
              </span>
            </div>

            <div className="document-upload-grid">
              {DOCUMENT_ITEMS.map(({ key, title, description, icon: Icon }) => {
                const documentData = documents[key] || {};
                const selectedFile = documentData.file;
                const storedAvailable = hasStoredDocument(documentData);
                const storedUrl = getDocumentUrl(documentData);
                const documentAvailable = Boolean(selectedFile) || storedAvailable;
                const fileName = selectedFile
                  ? selectedFile.name
                  : getStoredFileName(documentData, title);

                let statusText = description;
                if (selectedFile) {
                  statusText = uploadMode
                    ? "New file selected — click to replace"
                    : "Click to preview new document";
                } else if (documentData.replacementRequired) {
                  statusText = "Click to upload replacement document";
                } else if (storedAvailable && storedUrl) {
                  statusText = uploadMode
                    ? "Cancel existing document or click card to replace"
                    : "Click to view document";
                } else if (storedAvailable) {
                  statusText = "Saved document URL unavailable";
                } else {
                  statusText = uploadMode
                    ? "Click to upload document"
                    : "No document uploaded";
                }

                return (
                  <article
                    key={key}
                    className={`document-upload-card ${
                      documentAvailable ? "file-selected" : ""
                    } ${uploadMode ? "upload-mode" : ""} ${
                      documentData.replacementRequired ? "replacement-required" : ""
                    }`}
                    role="button"
                    tabIndex={saving ? -1 : 0}
                    aria-label={`${title}: ${statusText}`}
                    onClick={() => handleCardClick(key, documentData)}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, key, documentData)
                    }
                  >
                    <input
                      id={`${key}-file`}
                      className="document-hidden-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) => handleFileChange(event, key)}
                      disabled={saving || !uploadMode}
                    />

                    {uploadMode && storedAvailable && !selectedFile && (
                      <button
                        type="button"
                        className="document-card-cancel-corner"
                        onClick={(event) => handleCancelExisting(event, key)}
                        disabled={saving}
                        aria-label={`Cancel existing ${title} document`}
                        title="Cancel existing document"
                      >
                        <X size={16} />
                      </button>
                    )}

                    {uploadMode && selectedFile && (
                      <button
                        type="button"
                        className="document-card-cancel-corner"
                        onClick={(event) => handleCancelNewFile(event, key)}
                        disabled={saving}
                        aria-label={`Cancel selected ${title} document`}
                        title="Cancel selected file"
                      >
                        <X size={16} />
                      </button>
                    )}

                    <div className="document-card-content">
                      {documentAvailable ? (
                        <FolderOpen size={34} />
                      ) : (
                        <Icon size={34} />
                      )}

                      <strong>{title}</strong>
                      <span>{statusText}</span>

                      {documentAvailable && (
                        <small title={fileName}>
                          {fileName}
                          {selectedFile ? ` · ${formatFileSize(selectedFile.size)}` : ""}
                        </small>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {error && (
            <div className="document-modal-error" role="alert">
              {error}
            </div>
          )}
        </div>

        <footer className="document-upload-footer">
          <div className="document-upload-summary">
            {availableDocumentCount > 0
              ? `${availableDocumentCount} document${
                  availableDocumentCount === 1 ? "" : "s"
                } available`
              : "No documents uploaded"}

            {newFileCount > 0 && (
              <span>
                {" "}
                · {newFileCount} new file{newFileCount === 1 ? "" : "s"} selected
              </span>
            )}
          </div>

          <div className="document-footer-buttons">
            <button
              type="button"
              className="document-cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              Close
            </button>

            <button
              type="button"
              className={`document-upload-mode-button ${uploadMode ? "active" : ""}`}
              onClick={() => {
                setUploadMode(true);
                setError("");
              }}
              disabled={saving || uploadMode}
            >
              <Upload size={17} />
              {uploadMode ? "Upload Mode" : "Upload Documents"}
            </button>

            <button
              type="button"
              className="document-save-button"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Documents"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DocumentUploadModal;