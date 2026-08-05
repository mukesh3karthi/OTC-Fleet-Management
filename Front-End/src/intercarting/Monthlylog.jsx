import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ArrowLeft,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Search,
  X,
} from "lucide-react";

import "../Intercartingcss/monthlylog.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL = `${API_BASE_URL}/api/vehicles`;

const API_OPTIONS = {
  timeout: 60000,
};

const COMPANY = {
  name: "OM TRANS INFRA CORPORATION PVT.LTD",
  office:
    "Corporate Office : I/53, Poonamallee High Road, Vanagaram, Chennai - 600095",
  gst: "33AAECO2317B1Z5",
};

const pad = (value) => String(value).padStart(2, "0");

const getCurrentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

const getDaysInMonth = (monthValue) => {
  if (!monthValue) return 31;
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month, 0).getDate();
};

const formatMonth = (monthValue) => {
  if (!monthValue) return "";
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const createRows = (monthValue) =>
  Array.from({ length: getDaysInMonth(monthValue) }, (_, index) => ({
    date: `${monthValue}-${pad(index + 1)}`,
    inTime: "08:00",
    outTime: "08:00",
    hours: "24",
    km: "",
    workDescription: "",
    engineerSign: "",
  }));

const calculateHours = (inTime, outTime) => {
  if (!inTime || !outTime) {
    return "";
  }

  const [inHour, inMinute] = inTime.split(":").map(Number);
  const [outHour, outMinute] = outTime.split(":").map(Number);

  if (
    !Number.isFinite(inHour) ||
    !Number.isFinite(inMinute) ||
    !Number.isFinite(outHour) ||
    !Number.isFinite(outMinute)
  ) {
    return "";
  }

  let minutes =
    outHour * 60 + outMinute - (inHour * 60 + inMinute);

  if (minutes === 0) {
    minutes = 24 * 60;
  } else if (minutes < 0) {
    minutes += 24 * 60;
  }

  return (minutes / 60).toFixed(2);
};

const formatDate = (dateValue) => {
  if (!dateValue) return "";
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const hasMeaningfulRowEntry = (row) =>
  Boolean(
    row.km ||
      row.workDescription?.trim() ||
      row.engineerSign?.trim() ||
      row.inTime !== "08:00" ||
      row.outTime !== "08:00"
  );


const normalizeDailyKmLogs = (vehicle) => {
  const rawLogs = vehicle?.dailyKmLogs;

  if (rawLogs instanceof Map) {
    return Object.fromEntries(rawLogs);
  }

  if (
    rawLogs &&
    typeof rawLogs === "object" &&
    !Array.isArray(rawLogs)
  ) {
    return { ...rawLogs };
  }

  // Backward compatibility for old records.
  if (vehicle?.dailyLogDate) {
    return {
      [String(vehicle.dailyLogDate).slice(0, 10)]: Number(
        vehicle.todayKm || 0
      ),
    };
  }

  return {};
};

const normalizeDailyLoadIdleLogs = (vehicle) => {
  const rawLogs = vehicle?.dailyLoadIdleLogs;

  if (rawLogs instanceof Map) {
    return Object.fromEntries(rawLogs);
  }

  if (
    rawLogs &&
    typeof rawLogs === "object" &&
    !Array.isArray(rawLogs)
  ) {
    return { ...rawLogs };
  }

  // Backward compatibility for old records.
  if (vehicle?.dailyLogDate && vehicle?.loadIdle) {
    return {
      [String(vehicle.dailyLogDate).slice(0, 10)]: String(
        vehicle.loadIdle || ""
      ).trim(),
    };
  }

  return {};
};

const normalizeMonthlyOpenKmLogs = (vehicle) => {
  const rawLogs = vehicle?.monthlyOpenKmLogs;

  if (rawLogs instanceof Map) {
    return Object.fromEntries(rawLogs);
  }

  if (
    rawLogs &&
    typeof rawLogs === "object" &&
    !Array.isArray(rawLogs)
  ) {
    return { ...rawLogs };
  }

  return {};
};

const getDailyKmForDate = (
  vehicle,
  dateValue
) => {
  const logs =
    normalizeDailyKmLogs(vehicle);

  const dateKey = String(
    dateValue || ""
  ).slice(0, 10);

  const value = logs[dateKey];

  if (
    value === undefined ||
    value === null
  ) {
    return "0";
  }

  const numericValue =
    Number(value);

  return Number.isFinite(
    numericValue
  )
    ? String(numericValue)
    : "0";
};

const getLoadIdleForDate = (vehicle, dateValue) => {
  const logs = normalizeDailyLoadIdleLogs(vehicle);
  const dateKey = String(dateValue || "").slice(0, 10);
  const value = logs[dateKey];

  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
};

const Monthlylog = () => {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState(() => createRows(getCurrentMonth()));

  const [clientName, setClientName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [openKm, setOpenKm] = useState("");
  const [breakdownDays, setBreakdownDays] = useState("");
  const [remarks, setRemarks] = useState("");
  const [siteManagerSignature, setSiteManagerSignature] = useState("");

  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [downloadType, setDownloadType] = useState(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoadingVehicles(true);
        setError("");

        const response = await axios.get(API_URL, API_OPTIONS);

        const list = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.vehicles)
            ? response.data.vehicles
            : [];

        setVehicles(list);
      } catch (apiError) {
        console.error("Unable to load vehicles:", apiError);
        setError(
          apiError.response?.data?.message ||
            "Unable to load vehicle data. Please check your backend server."
        );
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && downloadType) {
        setDownloadType(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [downloadType]);

  useEffect(() => {
    const modalIsOpen = Boolean(downloadType);

    document.documentElement.classList.toggle(
      "monthly-modal-open",
      modalIsOpen
    );
    document.body.classList.toggle(
      "monthly-modal-open",
      modalIsOpen
    );

    return () => {
      document.documentElement.classList.remove("monthly-modal-open");
      document.body.classList.remove("monthly-modal-open");
    };
  }, [downloadType]);

  const selectedVehicle = useMemo(
    () =>
      vehicles.find(
        (vehicle) =>
          String(vehicle._id ?? vehicle.id) === String(selectedVehicleId)
      ) || null,
    [vehicles, selectedVehicleId]
  );

  const filteredVehicles = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return vehicles;

    return vehicles.filter((vehicle) =>
      [
        vehicle.vehicleNumber,
        vehicle.siteName,
        vehicle.vehicleType,
        vehicle.transportProvider,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search)
      )
    );
  }, [vehicles, searchTerm]);

  useEffect(() => {
    if (!selectedVehicle) {
      setRows(createRows(month));
      setClientName("");
      setSiteName("");
      setOpenKm("");
      setBreakdownDays("");
      setRemarks("");
      setSiteManagerSignature("");
      setMessage("");
      setError("");
      return;
    }

    const monthlyOpenKmLogs = normalizeMonthlyOpenKmLogs(selectedVehicle);

    setSiteName(selectedVehicle.siteName || "");
    setOpenKm(
      monthlyOpenKmLogs[month] ??
        selectedVehicle.monthOpenKm ??
        selectedVehicle.closingKm ??
        ""
    );

    setRows(
      createRows(month).map((row) => ({
        ...row,
        km: getDailyKmForDate(selectedVehicle, row.date),
        workDescription: getLoadIdleForDate(selectedVehicle, row.date),
      }))
    );

    setMessage("");
    setError("");
  }, [selectedVehicle, month]);

  const totalKm = useMemo(
    () =>
      rows.reduce((sum, row) => sum + Number(row.km || 0), 0),
    [rows]
  );

  const workingDays = useMemo(
    () => rows.filter((row) => Number(row.km || 0) > 0).length,
    [rows]
  );

  const totalHours = useMemo(
    () =>
      rows.reduce((sum, row) => {
        if (!hasMeaningfulRowEntry(row)) {
          return sum;
        }

        const value = Number(row.hours || 0);

        return sum + (Number.isFinite(value) ? value : 0);
      }, 0),
    [rows]
  );

  const enteredDays = useMemo(
    () => rows.filter(hasMeaningfulRowEntry).length,
    [rows]
  );

  const closeKm =
    openKm === "" ? "" : Number(openKm || 0) + Number(totalKm || 0);

  const handleRowChange = (index, field, value) => {
    setRows((previous) =>
      previous.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        const updated = { ...row, [field]: value };

        if (field === "inTime" || field === "outTime") {
          updated.hours = calculateHours(
            field === "inTime" ? value : updated.inTime,
            field === "outTime" ? value : updated.outTime
          );
        }

        if (field === "km") {
          updated.km =
            value === "" || /^\d*(\.\d*)?$/.test(value)
              ? value
              : row.km;
        }

        return updated;
      })
    );
  };

  const createExportRows = () =>
    rows.map((row, index) => ({
      "S.No": index + 1,
      Date: formatDate(row.date),
      "In Time": row.inTime || "",
      "Out Time": row.outTime || "",
      Hours: row.hours || "",
      KM: row.km || "",
      "Work Description": row.workDescription || "",
      "Engineer Sign": row.engineerSign || "",
    }));

  const createFileName = (extension) => {
    const vehicleNumber = (
      selectedVehicle?.vehicleNumber || "vehicle"
    ).replace(/[^a-z0-9]+/gi, "-");

    return `monthly-log-${vehicleNumber}-${month}.${extension}`;
  };

  const downloadExcel = () => {
    if (!selectedVehicle) {
      setError("Please select a vehicle before downloading.");
      return;
    }

    const workbook = XLSX.utils.book_new();
    const summary = [
      ["LOG SHEET"],
      [COMPANY.name],
      [COMPANY.office],
      ["GST No", COMPANY.gst, "Period", formatMonth(month)],
      ["Vehicle Type", selectedVehicle.vehicleType || ""],
      ["Vehicle Number", selectedVehicle.vehicleNumber || ""],
      ["Client Name", clientName],
      ["Site Name", siteName],
      [],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summary);

    XLSX.utils.sheet_add_json(worksheet, createExportRows(), {
      origin: "A10",
      skipHeader: false,
    });

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [],
        ["Open Kms", openKm, "Total Days", enteredDays],
        ["Close Kms", closeKm, "Working days", workingDays],
        ["Total Kms", totalKm, "Breakdown days", breakdownDays],
        ["Remarks", remarks],
        ["Site Manager Signature", siteManagerSignature],
      ],
      { origin: `A${12 + rows.length}` }
    );

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 45 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Log");
    XLSX.writeFile(workbook, createFileName("xlsx"));
  };

  const downloadPdf = () => {
    if (!selectedVehicle) {
      setError("Please select a vehicle before downloading.");
      return;
    }

    const document = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    document.setFontSize(14);
    document.text("LOG SHEET", 105, 12, { align: "center" });

    document.setFontSize(11);
    document.text(COMPANY.name, 105, 18, { align: "center" });

    document.setFontSize(7);
    document.text(COMPANY.office, 105, 23, { align: "center" });

    document.setFontSize(8);
    document.text(`GST No: ${COMPANY.gst}`, 14, 29);
    document.text(`Period: ${formatMonth(month)}`, 125, 29);
    document.text(
      `Vehicle Type: ${selectedVehicle.vehicleType || "-"}`,
      14,
      34
    );
    document.text(`Client Name: ${clientName || "-"}`, 125, 34);
    document.text(
      `Vehicle Number: ${selectedVehicle.vehicleNumber || "-"}`,
      14,
      39
    );
    document.text(`Site Name: ${siteName || "-"}`, 125, 39);

    autoTable(document, {
      startY: 44,
      head: [
        [
          "DATE",
          "IN TIME",
          "OUT TIME",
          "HOURS",
          "KM",
          "WORK DESCRIPTION",
          "ENGINEER SIGN",
        ],
      ],
      body: rows.map((row) => [
        formatDate(row.date),
        row.inTime || "",
        row.outTime || "",
        row.hours || "",
        row.km || "",
        row.workDescription || "",
        row.engineerSign || "",
      ]),
      styles: {
        fontSize: 6.5,
        cellPadding: 1.1,
        minCellHeight: 5.3,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [196, 196, 196],
        textColor: [0, 0, 0],
        halign: "center",
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 18 },
        2: { cellWidth: 18 },
        3: { cellWidth: 16 },
        4: { cellWidth: 16 },
        5: { cellWidth: 76 },
        6: { cellWidth: 24 },
      },
      margin: { left: 13, right: 13 },
    });

    const finalY = document.lastAutoTable.finalY + 5;

    document.setFontSize(8);
    document.text(`Open Kms: ${openKm || "-"}`, 14, finalY);
    document.text(`Close Kms: ${closeKm || "-"}`, 14, finalY + 5);
    document.text(`Total Kms: ${totalKm}`, 14, finalY + 10);

    document.text(`Total Days: ${enteredDays}`, 70, finalY);
    document.text(
      `Working Days: ${workingDays || "-"}`,
      70,
      finalY + 5
    );
    document.text(
      `Breakdown Days: ${breakdownDays || "-"}`,
      70,
      finalY + 10
    );

    document.text(`Remarks: ${remarks || "-"}`, 120, finalY);
    document.text(
      `Site Manager Signature: ${siteManagerSignature || "-"}`,
      120,
      finalY + 10
    );

    document.save(createFileName("pdf"));
  };

  const requestDownload = (type) => {
    if (!selectedVehicle) {
      setError("Please select a vehicle before downloading.");
      return;
    }

    setError("");
    setDownloadType(type);
  };

  const confirmDownload = () => {
    if (downloadType === "excel") {
      downloadExcel();
    }

    if (downloadType === "pdf") {
      downloadPdf();
    }

    setDownloadType(null);
  };

  return (
    <div className="monthly-log-page">
      <div className="monthly-log-toolbar no-print">
        <div className="monthly-log-title">
          <button
            type="button"
            className="monthly-back-button"
            onClick={() => navigate("/intercartingdash/intercarting")}
            aria-label="Back to Intercarting"
            title="Back to Intercarting"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1>Monthly Log Sheet</h1>
            <p>Create and manage monthly vehicle work logs.</p>
          </div>
        </div>

        <div className="monthly-toolbar-actions">
          <button
            type="button"
            className="excel-log-button"
            onClick={() => requestDownload("excel")}
            disabled={!selectedVehicle}
          >
            <FileSpreadsheet size={17} />
            Excel
          </button>

          <button
            type="button"
            className="pdf-log-button"
            onClick={() => requestDownload("pdf")}
            disabled={!selectedVehicle}
          >
            <FileText size={17} />
            PDF
          </button>
        </div>
      </div>

      <div className="monthly-filter-card no-print">
        <div className="monthly-filter-field">
          <label htmlFor="monthly-log-month">Month</label>
          <div className="monthly-input-with-icon">
            <CalendarDays size={17} />
            <input
              id="monthly-log-month"
              type="month"
              value={month}
              max={getCurrentMonth()}
              onChange={(event) => {
                setMonth(event.target.value);
                setMessage("");
                setError("");
              }}
            />
          </div>
        </div>

        <div className="monthly-filter-field vehicle-search-field">
          <label htmlFor="monthly-vehicle-search">Search Vehicle</label>
          <div className="monthly-input-with-icon">
            <Search size={17} />
            <input
              id="monthly-vehicle-search"
              type="search"
              value={searchTerm}
              placeholder="Search vehicle or site..."
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <div className="monthly-filter-field vehicle-select-field">
          <label htmlFor="monthly-log-vehicle">Vehicle</label>
          <select
            id="monthly-log-vehicle"
            value={selectedVehicleId}
            disabled={loadingVehicles}
            onChange={(event) => {
              setSelectedVehicleId(event.target.value);
              setMessage("");
              setError("");
            }}
          >
            <option value="">
              {loadingVehicles ? "Loading vehicles..." : "Select Vehicle"}
            </option>

            {filteredVehicles.map((vehicle) => (
              <option
                key={vehicle._id ?? vehicle.id}
                value={vehicle._id ?? vehicle.id}
              >
                {vehicle.vehicleNumber || "No Number"} —{" "}
                {vehicle.siteName || "No Site"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          className="monthly-log-alert error no-print"
          role="alert"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className="monthly-log-alert success no-print"
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <div className="monthly-sheet">
        <div className="monthly-sheet-header">
          <div className="company-logo-box">
            <div className="company-logo-mark">OM</div>
          </div>

          <div className="company-heading">
            <div className="log-sheet-title">LOG SHEET</div>
            <div className="company-name">{COMPANY.name}</div>
          </div>
        </div>

        <div className="company-office">{COMPANY.office}</div>

        <div className="monthly-meta-grid">
          <div className="meta-label">GST No :</div>
          <div className="meta-value">{COMPANY.gst}</div>
          <div className="meta-label">Period</div>
          <div className="meta-value period-value">{formatMonth(month)}</div>

          <div className="meta-label">Vehicle Type:</div>
          <div className="meta-value">
            {selectedVehicle?.vehicleType || ""}
          </div>
          <div className="meta-label">Client Name:</div>
          <div className="meta-value editable-meta">
            <input
              type="text"
              value={clientName}
              placeholder="Enter client name"
              maxLength={100}
              onChange={(event) => setClientName(event.target.value)}
            />
          </div>

          <div className="meta-label">Vehicle Number:</div>
          <div className="meta-value">
            {selectedVehicle?.vehicleNumber || ""}
          </div>
          <div className="meta-label">Site Name:</div>
          <div className="meta-value editable-meta">
            <input
              type="text"
              value={siteName}
              placeholder="Enter site name"
              maxLength={100}
              onChange={(event) => setSiteName(event.target.value)}
            />
          </div>
        </div>

        <div className="monthly-table-wrapper">
          <table className="monthly-entry-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>IN TIME</th>
                <th>OUT TIME</th>
                <th>Hours</th>
                <th>KM</th>
                <th>Work Description</th>
                <th>Engineer Sign</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={row.date}>
                  <td className="date-cell">{formatDate(row.date)}</td>

                  <td>
                    <input
                      type="time"
                      value={row.inTime}
                      aria-label={`In time for ${formatDate(row.date)}`}
                      onChange={(event) =>
                        handleRowChange(index, "inTime", event.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="time"
                      value={row.outTime}
                      aria-label={`Out time for ${formatDate(row.date)}`}
                      onChange={(event) =>
                        handleRowChange(index, "outTime", event.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="text"
                      value={row.hours}
                      readOnly
                      aria-label={`Hours for ${formatDate(row.date)}`}
                    />
                  </td>

                  <td>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.km}
                      aria-label={`Kilometres for ${formatDate(row.date)}`}
                      onChange={(event) =>
                        handleRowChange(index, "km", event.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="text"
                      value={row.workDescription}
                      maxLength={250}
                      aria-label={`Work description for ${formatDate(row.date)}`}
                      onChange={(event) =>
                        handleRowChange(
                          index,
                          "workDescription",
                          event.target.value
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="text"
                      value={row.engineerSign}
                      maxLength={80}
                      aria-label={`Engineer sign for ${formatDate(row.date)}`}
                      onChange={(event) =>
                        handleRowChange(
                          index,
                          "engineerSign",
                          event.target.value
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="monthly-summary-section">
          <div className="summary-table">
            <div className="summary-label">Open Kms</div>
            <div className="summary-value">
              <input
                type="text"
                inputMode="decimal"
                value={openKm}
                onChange={(event) =>
                  /^\d*(\.\d*)?$/.test(event.target.value) &&
                  setOpenKm(event.target.value)
                }
              />
            </div>
            <div className="summary-label">Total Days</div>
            <div className="summary-value calculated">{enteredDays}</div>

            <div className="summary-label">Close Kms</div>
            <div className="summary-value calculated">{closeKm}</div>
            <div className="summary-label">Working days</div>
            <div className="summary-value calculated">{workingDays}</div>

            <div className="summary-label">Total Kms</div>
            <div className="summary-value calculated">{totalKm}</div>
            <div className="summary-label">Breakdown days</div>
            <div className="summary-value">
              <input
                type="number"
                min="0"
                max={getDaysInMonth(month)}
                step="1"
                value={breakdownDays}
                onChange={(event) => {
                  const value = event.target.value;

                  if (
                    value === "" ||
                    (/^\d+$/.test(value) &&
                      Number(value) <= getDaysInMonth(month))
                  ) {
                    setBreakdownDays(value);
                  }
                }}
              />
            </div>
          </div>

          <div className="remarks-box">
            <label htmlFor="monthly-remarks">Remarks:</label>
            <textarea
              id="monthly-remarks"
              value={remarks}
              maxLength={500}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </div>
        </div>

        <div className="monthly-signature-footer">
          <div className="company-footer-name">
            Om Trans Infra Corporation Pvt. Ltd
          </div>

          <div className="site-manager-signature">
            <input
              type="text"
              value={siteManagerSignature}
              placeholder="Site Manager Signature"
              maxLength={100}
              onChange={(event) =>
                setSiteManagerSignature(event.target.value)
              }
            />
            <span>Site Manager Signature</span>
          </div>
        </div>

        <div className="monthly-sheet-calculation no-print">
          Total Hours: <strong>{totalHours.toFixed(2)}</strong>
        </div>
      </div>

      {downloadType && (
        <div
          className="monthly-confirm-overlay no-print"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDownloadType(null);
            }
          }}
        >
          <div
            className="monthly-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="monthly-download-title"
          >
            <button
              type="button"
              className="monthly-confirm-close"
              onClick={() => setDownloadType(null)}
              aria-label="Close confirmation"
            >
              <X size={20} />
            </button>

            <div className={`monthly-confirm-icon ${downloadType}`}>
              {downloadType === "excel" ? (
                <FileSpreadsheet size={28} />
              ) : (
                <FileText size={28} />
              )}
            </div>

            <h2 id="monthly-download-title">
              Download {downloadType === "excel" ? "Excel" : "PDF"} file?
            </h2>

            <p>
              The monthly log for{" "}
              <strong>{selectedVehicle?.vehicleNumber || "this vehicle"}</strong>{" "}
              and <strong>{formatMonth(month)}</strong> will be downloaded.
            </p>

            <div className="monthly-confirm-actions">
              <button
                type="button"
                className="monthly-confirm-cancel"
                onClick={() => setDownloadType(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`monthly-confirm-download ${downloadType}`}
                onClick={confirmDownload}
              >
                {downloadType === "excel" ? (
                  <FileSpreadsheet size={17} />
                ) : (
                  <FileText size={17} />
                )}
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monthlylog;