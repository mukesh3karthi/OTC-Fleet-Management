import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import companyLogo from "../asset/otclogo.jpg";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";

import "./monthlylog.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL = `${API_BASE_URL}/api/vehicles`;

const API_OPTIONS = {
  timeout: 60000,
};

const COMPANY = {
  name: "OM TRANNS INFRA CORPORATION PVT.LTD",
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
  const [isDownloading, setIsDownloading] = useState(false);

  // Notifications disappear automatically, but remain dismissible.
  useEffect(() => {
    if (!message && !error) return undefined;
    const timer = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [message, error]);

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
      if (event.key === "Escape" && downloadType && !isDownloading) {
        setDownloadType(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [downloadType, isDownloading]);

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

  const downloadExcel = async () => {
    if (!selectedVehicle) {
      setError("Please select a vehicle before downloading.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = COMPANY.name;
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Monthly Log", {
      pageSetup: {
        paperSize: 1, // US Letter, same as the existing PDF.
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        margins: {
          left: 0.22, right: 0.22, top: 0.22,
          bottom: 0.22, header: 0, footer: 0,
        },
      },
      views: [{ state: "frozen", ySplit: 8 }],
    });

    // Seven columns match the PDF's uninterrupted seven-column grid.
    const widths = [17, 13, 12, 10, 11, 54, 18];
    widths.forEach((width, i) => { sheet.getColumn(i + 1).width = width; });
    sheet.properties.defaultRowHeight = 14;
    sheet.pageSetup.printArea = `A1:G${14 + rows.length}`;
    sheet.headerFooter.oddHeader = "";
    sheet.headerFooter.oddFooter = "";

    const green = "C6DAA0";
    const grey = "C3C3C3";
    const border = {
      top: { style: "thin", color: { argb: "FF202020" } },
      left: { style: "thin", color: { argb: "FF202020" } },
      bottom: { style: "thin", color: { argb: "FF202020" } },
      right: { style: "thin", color: { argb: "FF202020" } },
    };
    const paint = (range, value, { fill, bold = false, size = 9,
      alignment = "center", height } = {}) => {
      if (range.includes(":")) sheet.mergeCells(range);
      const cell = sheet.getCell(range.split(":")[0]);
      cell.value = value ?? "";
      cell.font = { name: "Arial", size, bold, color: { argb: "FF000000" } };
      cell.alignment = {
        horizontal: alignment, vertical: "middle",
        wrapText: true, indent: alignment === "left" ? 1 : 0,
      };
      // Style every constituent cell, including those merged into labels.
      const [first, last] = range.split(":");
      const start = sheet.getCell(first);
      const end = sheet.getCell(last || first);
      for (let r = start.row; r <= end.row; r++) {
        for (let c = start.col; c <= end.col; c++) {
          const target = sheet.getCell(r, c);
          target.border = border;
          if (fill) target.fill = {
            type: "pattern", pattern: "solid",
            fgColor: { argb: `FF${fill}` },
          };
        }
      }
      if (height) sheet.getRow(start.row).height = height;
    };

    paint("A1:B2", "", { height: 25 });
    paint("C1:G1", "LOG SHEET", { fill: green, bold: true, size: 13, height: 22 });
    paint("C2:G2", COMPANY.name, { fill: green, bold: true, size: 11, height: 24 });
    paint("A3:G3", COMPANY.office, { fill: grey, bold: true, size: 9, height: 21 });
    paint("A4:E4", `GST No : ${COMPANY.gst}`, { fill: grey, bold: true, height: 19 });
    paint("F4", "Period:", { fill: grey, bold: true });
    paint("G4", formatMonth(month));
    paint("A5:B5", "Vehicle Type:", { fill: grey, bold: true, height: 19 });
    paint("C5:E5", selectedVehicle.vehicleType || "");
    paint("F5", "Client Name:", { fill: grey, bold: true });
    paint("G5", clientName);
    paint("A6:B6", "Vehicle Number:", { fill: grey, bold: true, height: 19 });
    paint("C6:E6", selectedVehicle.vehicleNumber || "");
    paint("F6", "Site Name:", { fill: grey, bold: true });
    paint("G6", siteName);

    // The company logo is placed inside the same top-left merged cell.
    try {
      const response = await fetch(companyLogo);
      if (!response.ok) throw new Error("Logo asset could not be loaded");
      const logoBlob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read logo"));
        reader.readAsDataURL(logoBlob);
      });
      const logoId = workbook.addImage({
        base64,
        extension: /png/i.test(logoBlob.type) ? "png" : "jpeg",
      });
      sheet.addImage(logoId, {
        tl: { col: 0.12, row: 0.12 },
        br: { col: 1.9, row: 1.88 },
        editAs: "oneCell",
      });
    } catch (logoError) {
      console.warn("Excel logo unavailable:", logoError);
    }

    const headers = ["DATE", "IN TIME", "OUT TIME", "Hours", "KM", "Work Description", "E.Sign"];
    headers.forEach((label, i) => paint(`${String.fromCharCode(65 + i)}7`, label,
      { fill: grey, bold: true, size: 9, height: 22 }));
    rows.forEach((row, rowIndex) => {
      const excelRow = rowIndex + 8;
      const showTime = (time) => {
        if (!time) return "";
        const [hour, minute] = time.split(":").map(Number);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return time;
        return `${hour % 12 || 12}.${pad(minute)}${hour >= 12 ? "PM" : "AM"}`;
      };
      const values = [
        new Date(`${row.date}T00:00:00`).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "2-digit",
        }).replace(/ /g, "-"),
        showTime(row.inTime), showTime(row.outTime),
        row.hours === "" ? "" : Number(row.hours),
        row.km === "" ? "" : Number(row.km),
        row.workDescription || "", row.engineerSign || "",
      ];
      values.forEach((value, index) => {
        const col = String.fromCharCode(65 + index);
        paint(`${col}${excelRow}`, value, {
          alignment: index >= 5 ? "left" : "center", size: 8, height: 14,
        });
        if (index === 3 || index === 4) {
          sheet.getCell(`${col}${excelRow}`).numFmt = "0.##";
        }
      });
    });

    const bottom = rows.length + 8;
    [["Open Kms", openKm], ["Close Kms", closeKm], ["Total Kms", totalKm]].forEach(
      ([label, value], index) => {
        const line = bottom + index;
        paint(`A${line}`, label, { bold: true, height: 17 });
        paint(`B${line}`, value === "" ? "" : Number(value));
        // Hide the A/B internal division, keeping one outlined KM box.
        sheet.getCell(`A${line}`).border = {
          top: border.top, left: border.left, bottom: border.bottom,
        };
        sheet.getCell(`B${line}`).border = {
          top: border.top, right: border.right, bottom: border.bottom,
        };
      }
    );
    // The white Remarks panel occupies the full unused area beside KM totals.
    // Merging all three rows leaves no missing border at the right edge.
    paint(`C${bottom}:G${bottom + 2}`, `Remarks: ${remarks || ""}`, {
      fill: "FFFFFF", bold: false, alignment: "left", size: 9,
    });
    const remarksCell = sheet.getCell(`C${bottom}`);
    remarksCell.alignment = {
      horizontal: "left", vertical: "top", wrapText: true, indent: 1,
    };
    remarksCell.font = { name: "Arial", size: 9, color: { argb: "FF000000" } };
    const signRow = bottom + 3;
    paint(`A${signRow}:E${signRow}`, "Om Tranns Infra corporation Pvt. Ltd.",
      { bold: true, alignment: "left", height: 82 });
    paint(`F${signRow}:G${signRow}`, siteManagerSignature || "Site Manager Sign",
      { bold: true });
    // Signature area is ONE tall outer rectangle, not two separate bordered boxes.
    for (let col = 1; col <= 7; col++) {
      const cell = sheet.getCell(signRow, col);
      cell.border = {
        top: border.top, bottom: border.bottom,
        ...(col === 1 ? { left: border.left } : {}),
        ...(col === 7 ? { right: border.right } : {}),
      };
    }
    sheet.getCell(`A${signRow}`).alignment = {
      horizontal: "left", vertical: "top", indent: 0,
    };
    sheet.getCell(`F${signRow}`).alignment = {
      horizontal: "right", vertical: "top", indent: 0,
    };
    sheet.pageSetup.printArea = `A1:G${signRow}`;

    const bytes = await workbook.xlsx.writeBuffer();
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = createFileName("xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadPdf = async () => {
    if (!selectedVehicle) {
      setError("Please select a vehicle before downloading.");
      return;
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter",
    });
    // Coordinates follow the merged-cell layout of kalikanagar.pdf.
    const x = 19, y = 17, width = 178;
    const green = [198, 218, 160];
    const grey = [195, 195, 195];
    const columnWidths = [22.5, 17, 15, 11.5, 13, 74, 25];
    const setInk = () => {
      pdf.setTextColor(0, 0, 0);
      pdf.setDrawColor(20, 20, 20);
      pdf.setLineWidth(0.22);
    };
    const box = (left, top, w, h, fill) => {
      if (fill) {
        pdf.setFillColor(...fill);
        pdf.rect(left, top, w, h, "FD");
      } else {
        pdf.rect(left, top, w, h, "S");
      }
    };
    const write = (value, left, top, w, h, opts = {}) => {
      const {
        size = 8, bold = false, align = "center", pad = 1.5,
      } = opts;
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(size);
      const raw = String(value ?? "");
      const maxWidth = Math.max(1, w - 2 * pad);
      let printed = raw;
      while (printed && pdf.getTextWidth(printed) > maxWidth) {
        printed = printed.slice(0, -1);
      }
      const textX = align === "left" ? left + pad :
        align === "right" ? left + w - pad : left + w / 2;
      pdf.text(printed, textX, top + h / 2 + size * 0.12,
        { align, baseline: "middle" });
    };
    setInk();

    // Green, merged company heading and the logo in its own cell.
    // Snap merged header and metadata edges to boundaries in the day grid.
    const firstGroupWidth = columnWidths[0] + columnWidths[1];
    const secondGroupWidth = columnWidths[2] + columnWidths[3] + columnWidths[4];
    const descriptionWidth = columnWidths[5];
    const signatureWidth = columnWidths[6];
    const logoWidth = firstGroupWidth;
    const headingWidth = width - logoWidth;
    box(x, y, logoWidth, 16);
    box(x + logoWidth, y, headingWidth, 8, green);
    box(x + logoWidth, y + 8, headingWidth, 8, green);
    write("LOG SHEET", x + logoWidth, y, headingWidth, 8,
      { size: 11, bold: true });
    write(COMPANY.name, x + logoWidth, y + 8, headingWidth, 8,
      { size: 9.7, bold: true });
    try {
      const logo = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = companyLogo;
      });
      const aspect = logo.naturalWidth / logo.naturalHeight;
      const h = 14;
      const w = Math.min(logoWidth - 4, h * aspect);
      pdf.addImage(logo, "PNG",
        x + (logoWidth - w) / 2, y + 1, w, h);
    } catch (err) {
      console.warn("Logo unavailable for export", err);
    }

    let cursor = y + 16;
    box(x, cursor, width, 7, grey);
    write(COMPANY.office, x, cursor, width, 7,
      { size: 8.5, bold: true });
    cursor += 7;

    // Label/value cells have the same merged geometry as the sample.
    const metaRow = (leftLabel, leftValue, rightLabel, rightValue, first) => {
      const h = 6;
      const cells = first
        ? [
            [0, firstGroupWidth + secondGroupWidth, leftLabel + " " + leftValue, grey],
            [firstGroupWidth + secondGroupWidth, descriptionWidth, rightLabel, grey],
            [firstGroupWidth + secondGroupWidth + descriptionWidth, signatureWidth, rightValue, null],
          ]
        : [
            [0, firstGroupWidth, leftLabel, grey],
            [firstGroupWidth, secondGroupWidth, leftValue, null],
            [firstGroupWidth + secondGroupWidth, descriptionWidth, rightLabel, grey],
            [firstGroupWidth + secondGroupWidth + descriptionWidth, signatureWidth, rightValue, null],
          ];
      cells.forEach(([offset, w, value, fill]) => {
        box(x + offset, cursor, w, h, fill);
        write(value, x + offset, cursor, w, h, {
          size: first ? 8.4 : 8.2,
          bold: Boolean(fill),
        });
      });
      cursor += h;
    };
    metaRow("GST No :", COMPANY.gst, "Period:", formatMonth(month), true);
    metaRow("Vehicle Type:", selectedVehicle.vehicleType || "", "Client Name:", clientName);
    metaRow("Vehicle Number:", selectedVehicle.vehicleNumber || "",
      "Site Name:", siteName);

    // One uninterrupted 7-column grid.
    const headers = [
      "DATE", "IN TIME", "OUT TIME", "Hours",
      "KM", "Work Description", "E.Sign",
    ];
    let colX = x;
    headers.forEach((label, index) => {
      box(colX, cursor, columnWidths[index], 8, grey);
      write(label, colX, cursor, columnWidths[index], 8,
        { size: 8, bold: true });
      colX += columnWidths[index];
    });
    cursor += 8;

    const rowHeight = 5.25;
    rows.forEach((row) => {
      const values = [
        new Date(row.date + "T00:00:00").toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "2-digit",
        }).replace(/ /g, "-"),
        row.inTime ? (() => {
          const [hr, mn] = row.inTime.split(":").map(Number);
          return `${hr % 12 || 12}.${String(mn).padStart(2, "0")}${hr >= 12 ? "PM" : "AM"}`;
        })() : "",
        row.outTime ? (() => {
          const [hr, mn] = row.outTime.split(":").map(Number);
          return `${hr % 12 || 12}.${String(mn).padStart(2, "0")}${hr >= 12 ? "PM" : "AM"}`;
        })() : "",
        row.hours, row.km, row.workDescription, row.engineerSign,
      ];
      colX = x;
      values.forEach((value, index) => {
        const w = columnWidths[index];
        box(colX, cursor, w, rowHeight);
        write(value, colX, cursor, w, rowHeight, {
          size: 7.5,
          align: index >= 5 ? "left" : "center",
        });
        colX += w;
      });
      cursor += rowHeight;
    });

    // One complete bordered bottom panel: KM rows on the left and
    // a large white Remarks cell on the right, matching the Excel export.
    const summaryTop = cursor;
    const kmBlockWidth = columnWidths[0] + columnWidths[1];
    const summaryHeight = 3 * 5.2;
    box(x + kmBlockWidth, summaryTop, width - kmBlockWidth, summaryHeight);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.text("Remarks:", x + kmBlockWidth + 2, summaryTop + 4);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    const remarkLines = pdf.splitTextToSize(
      String(remarks || ""), width - kmBlockWidth - 5
    ).slice(0, 3);
    if (remarkLines.length) {
      pdf.text(remarkLines, x + kmBlockWidth + 2, summaryTop + 8);
    }

    [
      ["Open Kms", openKm],
      ["Close Kms", closeKm],
      ["Total Kms", totalKm],
    ].forEach(([label, value]) => {
      box(x, cursor, kmBlockWidth, 5.2);
      write(label, x + 1, cursor, columnWidths[0] + 2, 5.2,
        { size: 8, bold: true, align: "left" });
      write(value, x + columnWidths[0], cursor, columnWidths[1] - 1, 5.2,
        { size: 8, align: "right" });
      cursor += 5.2;
    });

    // One tall signature area with a continuous outer border, as shown
    // in the reference screenshot. No vertical partition through the box.
    box(x, cursor, width, 22);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.text("Om Tranns Infra corporation Pvt. Ltd.", x + 1, cursor + 4.8);
    pdf.text(String(siteManagerSignature || "Site Manager Sign"),
      x + width - 3, cursor + 4.8, { align: "right" });
    // No automatic table pagination: 31 rows fit on one Letter page.
    pdf.save(createFileName("pdf"));
  };

  const requestDownload = (type) => {
    if (isDownloading) return;
    if (!selectedVehicle) {
      setError("Please select a vehicle before downloading.");
      return;
    }

    setError("");
    setDownloadType(type);
  };

  const confirmDownload = async () => {
    if (!downloadType || isDownloading) return;
    const type = downloadType;
    setIsDownloading(true);
    try {
      if (type === "excel") await downloadExcel();
      if (type === "pdf") await downloadPdf();
      setDownloadType(null);
      setError("");
      setMessage(`${type === "excel" ? "Excel" : "PDF"} report prepared successfully.`);
    } catch (downloadError) {
      console.error("Unable to prepare report:", downloadError);
      setMessage("");
      setError("Unable to prepare the report. Please try again.");
      setDownloadType(null);
    } finally {
      setIsDownloading(false);
    }
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

      {(error || message) && (
        <div className="monthly-toast-region no-print" aria-live="polite">
          <div
            className={`monthly-toast ${error ? "error" : "success"}`}
            role={error ? "alert" : "status"}
          >
            <span className="monthly-toast-icon">
              {error ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
            </span>
            <div className="monthly-toast-copy">
              <strong>{error ? "Action required" : "Report ready"}</strong>
              <span>{error || message}</span>
            </div>
            <button
              type="button"
              className="monthly-toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => { setError(""); setMessage(""); }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="monthly-sheet">
        <div className="monthly-sheet-header">
          <div className="company-logo-box">
            <img src={companyLogo} alt="OTC Company Logo" className="company-logo-image" />
          </div>

          <div className="company-heading">
            <div className="log-sheet-title">LOG SHEET</div>
            <div className="company-name">{COMPANY.name}</div>
          </div>
        </div>

        <div className="company-office">{COMPANY.office}</div>

        <div className="monthly-meta-grid">
          <div className="meta-label meta-gst">GST No : {COMPANY.gst}</div>
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
            if (event.target === event.currentTarget && !isDownloading) {
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
              disabled={isDownloading}
            >
              <X size={20} />
            </button>

            <div className={`monthly-confirm-icon ${downloadType}`}>
              {downloadType === "excel" ? <FileSpreadsheet size={25} /> : <FileText size={25} />}
            </div>

            <h2 id="monthly-download-title">
              Download monthly log
            </h2>

            <p>
              Your report is ready to export. Please confirm the details below.
            </p>

            <div className="monthly-download-details">
              <div><span>Vehicle</span><strong>{selectedVehicle?.vehicleNumber || "—"}</strong></div>
              <div><span>Period</span><strong>{formatMonth(month)}</strong></div>
              <div><span>File format</span><strong>{downloadType === "excel" ? "Excel (.xlsx)" : "PDF (.pdf)"}</strong></div>
            </div>

            <div className="monthly-confirm-actions">
              <button
                type="button"
                className="monthly-confirm-cancel"
                onClick={() => setDownloadType(null)}
                disabled={isDownloading}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`monthly-confirm-download ${downloadType}`}
                onClick={confirmDownload}
                disabled={isDownloading}
              >
                {isDownloading ? <LoaderCircle size={17} className="monthly-spinner" /> : <Download size={17} />}
                {isDownloading ? "Preparing..." : "Download file"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monthlylog;
