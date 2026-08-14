import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileDown,
  FileText,
  FileSpreadsheet,
  Globe2,
  Leaf,
  RefreshCw,
  Search,
  ShieldCheck,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";

import "../pagescss/vehicledocument.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const OWN_VEHICLE_API =
  `${API_BASE_URL}/api/ownvehicles`;

const BACKEND_URL = API_BASE_URL;

const CURRENT_YEAR =
  new Date().getFullYear();

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const YEAR_OPTIONS = Array.from(
  { length: 21 },
  (_, index) =>
    CURRENT_YEAR - 10 + index
);

const DOCUMENT_TYPES = [
  {
    key: "insurance",
    title: "Insurance",
    icon: ShieldCheck,
  },
  {
    key: "fitness",
    title: "Fitness",
    icon: Wrench,
  },
  {
    key: "nationalPermit",
    title: "National Permit",
    icon: Globe2,
  },
  {
    key: "permit",
    title: "Permit",
    icon: ClipboardList,
  },
  {
    key: "tax",
    title: "Tax",
    icon: WalletCards,
  },
  {
    key: "puc",
    title: "PUC",
    icon: Leaf,
  },
];

const TABLE_DOCUMENT_COLUMNS = [
  {
    key: "insurance",
    label: "Insurance",
  },
  {
    key: "fitness",
    label: "Fitness",
  },
  {
    key: "nationalPermit",
    label: "National Permit",
  },
  {
    key: "permit",
    label: "Permit",
  },
  {
    key: "tax",
    label: "Tax",
  },
  {
    key: "puc",
    label: "PUC",
  },
];

/* ==========================================
   Vehicle helpers
========================================== */

const getVehicleId = (vehicle) =>
  vehicle?._id ??
  vehicle?.id ??
  "";

const getVehicleNumber = (vehicle) =>
  vehicle?.vehicleNo ??
  vehicle?.vehicleNumber ??
  vehicle?.registrationNumber ??
  "-";

const getTransportName = (vehicle) =>
  vehicle?.transportOwner ??
  vehicle?.transportName ??
  vehicle?.purchasedFrom ??
  "-";

const getVehicleType = (vehicle) =>
  vehicle?.type ??
  vehicle?.vehicleType ??
  "-";

const getDocumentData = (
  vehicle,
  documentKey
) =>
  vehicle?.documents?.[
  documentKey
  ] ?? {};

/* ==========================================
   Date helpers
========================================== */

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const normalizedValue =
    String(value).slice(0, 10);

  const date = new Date(
    `${normalizedValue}T00:00:00`
  );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};

const formatDate = (value) => {
  const date = parseDate(value);

  if (!date) {
    return "-";
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

const getStartOfToday = () => {
  const today = new Date();

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
};

const getDaysRemaining = (
  expiryValue
) => {
  const expiryDate =
    parseDate(expiryValue);

  if (!expiryDate) {
    return null;
  }

  return Math.ceil(
    (
      expiryDate.getTime() -
      getStartOfToday().getTime()
    ) / 86400000
  );
};

const isDateInsideRange = (
  dateValue,
  startDate,
  endDate
) => {
  const date = parseDate(dateValue);

  if (!date) {
    return false;
  }

  return (
    date >= startDate &&
    date <= endDate
  );
};

const getExpiryState = (
  expiryValue
) => {
  const daysRemaining =
    getDaysRemaining(expiryValue);

  if (
    daysRemaining === null
  ) {
    return {
      type: "missing",
      text: "Not available",
      daysRemaining: null,
    };
  }

  if (daysRemaining < 0) {
    const expiredDays =
      Math.abs(daysRemaining);

    return {
      type: "expired",

      text:
        `Expired ${expiredDays} day${expiredDays === 1
          ? ""
          : "s"
        } ago`,

      daysRemaining,
    };
  }

  if (daysRemaining === 0) {
    return {
      type: "critical",
      text: "Expires today",
      daysRemaining,
    };
  }

  if (daysRemaining <= 7) {
    return {
      type: "critical",

      text:
        `${daysRemaining} day${daysRemaining === 1
          ? ""
          : "s"
        } left`,

      daysRemaining,
    };
  }

  if (daysRemaining <= 30) {
    return {
      type: "warning",
      text: `${daysRemaining} days left`,
      daysRemaining,
    };
  }

  return {
    type: "active",
    text: `${daysRemaining} days left`,
    daysRemaining,
  };
};

/* ==========================================
   Document file helpers
========================================== */

const hasDocumentFile = (
  documentData
) =>
  Boolean(
    documentData?.filePath ||
    documentData?.fileUrl ||
    documentData?.url ||
    documentData?.path ||
    documentData?.fileName ||
    documentData?.filename ||
    documentData?.originalName
  );

/* ==========================================
   Vehicle status for all documents
========================================== */

const getVehicleOverallStatus = (
  vehicle
) => {
  const documentStates =
    TABLE_DOCUMENT_COLUMNS.map(
      ({ key }) => {
        const documentData =
          getDocumentData(
            vehicle,
            key
          );

        return getExpiryState(
          documentData?.expiryDate
        );
      }
    );

  if (
    documentStates.every(
      (state) =>
        state.type === "missing"
    )
  ) {
    return {
      type: "missing",
      label: "No Documents",
    };
  }

  if (
    documentStates.some(
      (state) =>
        state.type === "expired"
    )
  ) {
    return {
      type: "expired",
      label: "Expired",
    };
  }

  if (
    documentStates.some(
      (state) =>
        state.type === "critical" ||
        state.type === "warning"
    )
  ) {
    return {
      type: "warning",
      label: "Expiring Soon",
    };
  }

  return {
    type: "active",
    label: "Active",
  };
};

/* ==========================================
   Selected-period status
========================================== */

const getSelectedPeriodStatus = (
  vehicle,
  monthRange
) => {
  const matchingStates =
    TABLE_DOCUMENT_COLUMNS
      .map(({ key }) => {
        const documentData =
          getDocumentData(
            vehicle,
            key
          );

        const matchesPeriod =
          isDateInsideRange(
            documentData?.expiryDate,
            monthRange.start,
            monthRange.end
          );

        if (!matchesPeriod) {
          return null;
        }

        return getExpiryState(
          documentData?.expiryDate
        );
      })
      .filter(Boolean);

  if (
    matchingStates.length === 0
  ) {
    return {
      type: "missing",
      label: "No Match",
    };
  }

  if (
    matchingStates.some(
      (state) =>
        state.type === "expired"
    )
  ) {
    return {
      type: "expired",
      label: "Expired",
    };
  }

  if (
    matchingStates.some(
      (state) =>
        state.type === "critical" ||
        state.type === "warning"
    )
  ) {
    return {
      type: "warning",
      label: "Expiring Soon",
    };
  }

  return {
    type: "active",
    label: "Active",
  };
};

/* ==========================================
   CSV helper
========================================== */

const escapeCsvValue = (value) => {
  const text =
    String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  }

  return text;
};

const Vehicledocument = () => {
  const [
    vehicles,
    setVehicles,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    apiError,
    setApiError,
  ] = useState("");

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    exportPopup,
    setExportPopup,
  ] = useState({
    open: false,
    mode: "allVehicles",
    vehicle: null,
    title: "",
  });

  const [
    downloadingDocumentsId,
    setDownloadingDocumentsId,
  ] = useState(null);

  const currentDate =
    new Date();

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")
  );

  const [
    selectedYear,
    setSelectedYear,
  ] = useState(
    String(
      currentDate.getFullYear()
    )
  );

  /* ==========================================
     Fetch vehicles automatically
  ========================================== */

  const fetchVehicles =
    useCallback(async () => {
      try {
        setLoading(true);
        setApiError("");

        const response =
          await axios.get(
            OWN_VEHICLE_API,
            {
              timeout: 60000,
            }
          );

        const vehicleList =
          Array.isArray(
            response.data?.ownVehicles
          )
            ? response.data
              .ownVehicles
            : Array.isArray(
              response.data
            )
              ? response.data
              : [];

        setVehicles(vehicleList);
      } catch (error) {
        console.error(
          "Fetch vehicle document error:",
          error.response?.data ||
          error.message
        );

        setVehicles([]);

        setApiError(
          error.response?.data
            ?.message ||
          "Unable to fetch vehicle documents. Please check the backend server."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  /* ==========================================
     Selected period
  ========================================== */

  const selectedPeriodLabel =
    useMemo(() => {
      return new Date(
        Number(selectedYear),
        Number(selectedMonth) - 1,
        1
      ).toLocaleDateString(
        "en-IN",
        {
          month: "long",
          year: "numeric",
        }
      );
    }, [
      selectedMonth,
      selectedYear,
    ]);

  const monthRange =
    useMemo(() => {
      const year =
        Number(selectedYear);

      const month =
        Number(selectedMonth);

      return {
        start: new Date(
          year,
          month - 1,
          1,
          0,
          0,
          0,
          0
        ),

        end: new Date(
          year,
          month,
          0,
          23,
          59,
          59,
          999
        ),
      };
    }, [
      selectedMonth,
      selectedYear,
    ]);

  /* ==========================================
     Vehicles matching month/year

     Used only for overview counts.
  ========================================== */

  const monthFilteredVehicles =
    useMemo(() => {
      return vehicles.filter(
        (vehicle) =>
          TABLE_DOCUMENT_COLUMNS.some(
            ({ key }) => {
              const documentData =
                getDocumentData(
                  vehicle,
                  key
                );

              return isDateInsideRange(
                documentData?.expiryDate,
                monthRange.start,
                monthRange.end
              );
            }
          )
      );
    }, [
      vehicles,
      monthRange,
    ]);

  /* ==========================================
     Search all vehicles for the table
  ========================================== */

  const filteredVehicles =
    useMemo(() => {
      const query =
        searchText
          .trim()
          .toLowerCase();

      if (!query) {
        return vehicles;
      }

      return vehicles.filter(
        (vehicle) => {
          const searchableValues = [
            getVehicleNumber(
              vehicle
            ),

            getTransportName(
              vehicle
            ),

            getVehicleType(
              vehicle
            ),
          ];

          return searchableValues.some(
            (value) =>
              String(value)
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [
      vehicles,
      searchText,
    ]);

  /* ==========================================
     Expiry summary for selected month/year
  ========================================== */

  const documentSummaries =
    useMemo(() => {
      return DOCUMENT_TYPES.map(
        (documentType) => {
          const entries =
            vehicles
              .map((vehicle) => {
                const documentData =
                  getDocumentData(
                    vehicle,
                    documentType.key
                  );

                const expiryDate =
                  parseDate(
                    documentData?.expiryDate
                  );

                return {
                  vehicleId:
                    getVehicleId(
                      vehicle
                    ),

                  vehicleNumber:
                    getVehicleNumber(
                      vehicle
                    ),

                  expiryDate,

                  expiryState:
                    getExpiryState(
                      documentData?.expiryDate
                    ),
                };
              })
              .filter(
                (entry) =>
                  entry.expiryDate &&
                  entry.expiryDate >=
                  monthRange.start &&
                  entry.expiryDate <=
                  monthRange.end
              )
              .sort(
                (first, second) =>
                  first.expiryDate.getTime() -
                  second.expiryDate.getTime()
              );

          return {
            ...documentType,
            entries,
          };
        }
      );
    }, [
      vehicles,
      monthRange,
    ]);

  /* ==========================================
     Overview counts for selected period
  ========================================== */

  const dashboardCounts =
    useMemo(() => {
      let active = 0;
      let expiringSoon = 0;
      let expired = 0;

      monthFilteredVehicles.forEach(
        (vehicle) => {
          const status =
            getSelectedPeriodStatus(
              vehicle,
              monthRange
            );

          if (
            status.type === "expired"
          ) {
            expired += 1;
          } else if (
            status.type === "warning"
          ) {
            expiringSoon += 1;
          } else if (
            status.type === "active"
          ) {
            active += 1;
          }
        }
      );

      return {
        total:
          monthFilteredVehicles.length,
        active,
        expiringSoon,
        expired,
      };
    }, [
      monthFilteredVehicles,
      monthRange,
    ]);

  /* ==========================================
     Reset month/year
  ========================================== */

  const resetFilters = () => {
    const today = new Date();

    setSelectedMonth(
      String(
        today.getMonth() + 1
      ).padStart(2, "0")
    );

    setSelectedYear(
      String(
        today.getFullYear()
      )
    );

    setSearchText("");
  };

  /* ==========================================
     Export displayed table data
  ========================================== */

  const exportCsv = () => {
    const headers = [
      "Vehicle Number",
      "Transport Owner",
      "Vehicle Type",
      "Insurance Start Date",
      "Insurance Expiry Date",
      "Fitness Start Date",
      "Fitness Expiry Date",
      "National Permit Start Date",
      "National Permit Expiry Date",
      "Permit Start Date",
      "Permit Expiry Date",
      "Tax Start Date",
      "Tax Expiry Date",
      "PUC Start Date",
      "PUC Expiry Date",
      "Overall Status",
    ];

    const rows =
      filteredVehicles.map(
        (vehicle) => {
          const status =
            getVehicleOverallStatus(
              vehicle
            );

          return [
            getVehicleNumber(
              vehicle
            ),

            getTransportName(
              vehicle
            ),

            getVehicleType(
              vehicle
            ),

            ...TABLE_DOCUMENT_COLUMNS.flatMap(
              ({ key }) => {
                const documentData =
                  getDocumentData(
                    vehicle,
                    key
                  );

                return [
                  formatDate(
                    documentData?.startDate
                  ),

                  formatDate(
                    documentData?.expiryDate
                  ),
                ];
              }
            ),

            status.label,
          ];
        }
      );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(escapeCsvValue)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "all-vehicle-documents.csv";

    document.body.appendChild(link);

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };


  const downloadVehicleDetails = (
    vehicle
  ) => {
    const overallStatus =
      getVehicleOverallStatus(
        vehicle
      );

    const rows = [
      [
        "Vehicle Number",
        getVehicleNumber(vehicle),
      ],

      [
        "Transport Owner",
        getTransportName(vehicle),
      ],

      [
        "Vehicle Type",
        getVehicleType(vehicle),
      ],

      [
        "Overall Status",
        overallStatus.label,
      ],
    ];

    TABLE_DOCUMENT_COLUMNS.forEach(
      ({ key, label }) => {
        const documentData =
          getDocumentData(
            vehicle,
            key
          );

        rows.push(
          [
            `${label} Start Date`,
            formatDate(
              documentData?.startDate
            ),
          ],
          [
            `${label} Expiry Date`,
            formatDate(
              documentData?.expiryDate
            ),
          ],
          [
            `${label} File Name`,
            documentData?.originalName ||
            documentData?.fileName ||
            documentData?.filename ||
            "-",
          ]
        );
      }
    );

    const csvContent = rows
      .map((row) =>
        row
          .map(escapeCsvValue)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    const safeVehicleNumber =
      getVehicleNumber(vehicle)
        .replace(
          /[^a-zA-Z0-9-_]/g,
          "-"
        );

    link.href = url;

    link.download =
      `${safeVehicleNumber}-vehicle-details.csv`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  /* ==========================================
     Download uploaded document
  ========================================== */

  const downloadDocument = (
    vehicle,
    documentKey
  ) => {
    const downloadUrl =
      getDocumentDownloadUrl(
        vehicle,
        documentKey
      );

    if (!downloadUrl) {
      window.alert(
        "No uploaded document is available."
      );
      return;
    }

    window.location.assign(downloadUrl);
  };


  const getDocumentDownloadUrl = (
    vehicle,
    documentKey
  ) => {
    const documentData =
      getDocumentData(
        vehicle,
        documentKey
      );

    const storedFileName =
      documentData?.fileName ||
      documentData?.filename;

    if (!storedFileName) {
      return null;
    }

    const originalName =
      documentData?.originalName ||
      storedFileName;

    return (
      `${BACKEND_URL}/api/ownvehicles/download/` +
      `${encodeURIComponent(storedFileName)}` +
      `?name=${encodeURIComponent(originalName)}`
    );
  };

  const downloadAllVehicleDocuments = (
    vehicle
  ) => {
    const availableDocuments =
      TABLE_DOCUMENT_COLUMNS
        .map(({ key, label }) => ({
          key,
          label,
          url: getDocumentDownloadUrl(
            vehicle,
            key
          ),
        }))
        .filter((documentItem) =>
          Boolean(documentItem.url)
        );

    if (availableDocuments.length === 0) {
      window.alert(
        "No uploaded documents are available for this vehicle."
      );
      return;
    }

    /*
     * Trigger every available document.
     * The small delay helps browsers process each download.
     */
    availableDocuments.forEach(
      (documentItem, index) => {
        window.setTimeout(() => {
          const link =
            document.createElement("a");

          link.href = documentItem.url;
          link.style.display = "none";

          document.body.appendChild(link);
          link.click();
          link.remove();
        }, index * 350);
      }
    );
  };



  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () =>
        resolve(reader.result);

      reader.onerror = () =>
        reject(
          new Error(
            "Unable to read document image."
          )
        );

      reader.readAsDataURL(blob);
    });

  const loadImageDimensions = (
    dataUrl
  ) =>
    new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      };

      image.onerror = () => {
        reject(
          new Error(
            "Unable to load document image."
          )
        );
      };

      image.src = dataUrl;
    });

  const downloadAllDocumentsAsPdf =
    async (vehicle) => {
      const vehicleId =
        getVehicleId(vehicle);

      const availableDocuments =
        TABLE_DOCUMENT_COLUMNS
          .map(({ key, label }) => {
            const documentData =
              getDocumentData(
                vehicle,
                key
              );

            return {
              key,
              label,
              documentData,
              url:
                getDocumentDownloadUrl(
                  vehicle,
                  key
                ),
            };
          })
          .filter(
            (documentItem) =>
              Boolean(documentItem.url)
          );

      if (
        availableDocuments.length === 0
      ) {
        window.alert(
          "No uploaded documents are available for this vehicle."
        );
        return;
      }

      try {
        setDownloadingDocumentsId(
          vehicleId
        );

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
        });

        const pageWidth =
          pdf.internal.pageSize.getWidth();

        const pageHeight =
          pdf.internal.pageSize.getHeight();

        const margin = 36;

        /*
         * First page: vehicle and document summary.
         */
        pdf.setFillColor(
          18,
          62,
          145
        );

        pdf.rect(
          0,
          0,
          pageWidth,
          82,
          "F"
        );

        pdf.setTextColor(
          255,
          255,
          255
        );

        pdf.setFontSize(18);

        pdf.text(
          "Vehicle Document Report",
          margin,
          34
        );

        pdf.setFontSize(10);

        pdf.text(
          `Vehicle: ${getVehicleNumber(
            vehicle
          )}`,
          margin,
          55
        );

        pdf.text(
          `Generated: ${new Date().toLocaleString(
            "en-IN"
          )}`,
          margin,
          70
        );

        pdf.setTextColor(
          23,
          43,
          77
        );

        pdf.setFontSize(11);

        pdf.text(
          `Transport Owner: ${getTransportName(
            vehicle
          )}`,
          margin,
          112
        );

        pdf.text(
          `Vehicle Type: ${getVehicleType(
            vehicle
          )}`,
          margin,
          130
        );

        autoTable(pdf, {
          startY: 154,
          head: [
            [
              "Document",
              "Start Date",
              "Expiry Date",
              "Status",
              "File",
            ],
          ],
          body:
            availableDocuments.map(
              ({
                label,
                documentData,
              }) => {
                const expiryState =
                  getExpiryState(
                    documentData
                      ?.expiryDate
                  );

                return [
                  label,
                  formatDate(
                    documentData
                      ?.startDate
                  ),
                  formatDate(
                    documentData
                      ?.expiryDate
                  ),
                  expiryState.text,
                  documentData
                    ?.originalName ||
                    documentData
                      ?.fileName ||
                    documentData
                      ?.filename ||
                    "-",
                ];
              }
            ),
          theme: "grid",
          styles: {
            fontSize: 8,
            cellPadding: 5,
          },
          headStyles: {
            fillColor: [
              18,
              62,
              145,
            ],
            textColor: [
              255,
              255,
              255,
            ],
          },
          alternateRowStyles: {
            fillColor: [
              247,
              249,
              252,
            ],
          },
          margin: {
            left: margin,
            right: margin,
          },
        });

        /*
         * Following pages: one uploaded image per page.
         */
        for (
          const documentItem of
          availableDocuments
        ) {
          pdf.addPage();

          pdf.setFillColor(
            18,
            62,
            145
          );

          pdf.rect(
            0,
            0,
            pageWidth,
            68,
            "F"
          );

          pdf.setTextColor(
            255,
            255,
            255
          );

          pdf.setFontSize(16);

          pdf.text(
            documentItem.label,
            margin,
            31
          );

          pdf.setFontSize(9);

          pdf.text(
            getVehicleNumber(
              vehicle
            ),
            margin,
            49
          );

          try {
            const response =
              await fetch(
                documentItem.url
              );

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}`
              );
            }

            const blob =
              await response.blob();

            const mimeType =
              blob.type ||
              documentItem
                .documentData
                ?.mimeType ||
              "";

            if (
              !mimeType.startsWith(
                "image/"
              )
            ) {
              pdf.setTextColor(
                71,
                85,
                105
              );

              pdf.setFontSize(12);

              pdf.text(
                "This uploaded document is not an image and cannot be embedded as a photo.",
                margin,
                112,
                {
                  maxWidth:
                    pageWidth -
                    margin * 2,
                }
              );

              pdf.setFontSize(10);

              pdf.text(
                `File: ${
                  documentItem
                    .documentData
                    ?.originalName ||
                  documentItem
                    .documentData
                    ?.fileName ||
                  documentItem
                    .documentData
                    ?.filename ||
                  "-"
                }`,
                margin,
                148,
                {
                  maxWidth:
                    pageWidth -
                    margin * 2,
                }
              );

              continue;
            }

            const dataUrl =
              await blobToDataUrl(
                blob
              );

            const dimensions =
              await loadImageDimensions(
                dataUrl
              );

            const availableWidth =
              pageWidth -
              margin * 2;

            const availableHeight =
              pageHeight -
              118;

            const scale = Math.min(
              availableWidth /
                dimensions.width,
              availableHeight /
                dimensions.height
            );

            const imageWidth =
              dimensions.width *
              scale;

            const imageHeight =
              dimensions.height *
              scale;

            const imageX =
              (pageWidth -
                imageWidth) /
              2;

            const imageY =
              88 +
              (availableHeight -
                imageHeight) /
                2;

            const imageFormat =
              mimeType.includes(
                "png"
              )
                ? "PNG"
                : "JPEG";

            pdf.addImage(
              dataUrl,
              imageFormat,
              imageX,
              imageY,
              imageWidth,
              imageHeight,
              undefined,
              "FAST"
            );
          } catch (documentError) {
            console.error(
              `Unable to add ${documentItem.label}:`,
              documentError
            );

            pdf.setTextColor(
              185,
              28,
              28
            );

            pdf.setFontSize(12);

            pdf.text(
              "Unable to load this uploaded image.",
              margin,
              112
            );
          }
        }

        const safeVehicleNumber =
          getVehicleNumber(vehicle)
            .replace(
              /[^a-zA-Z0-9-_]/g,
              "-"
            );

        pdf.save(
          `${safeVehicleNumber}-all-documents.pdf`
        );
      } catch (error) {
        console.error(
          "Download all documents PDF error:",
          error
        );

        window.alert(
          "Unable to create the document PDF. Make sure the backend allows document files to be fetched from the frontend."
        );
      } finally {
        setDownloadingDocumentsId(
          null
        );
      }
    };

  const openExportPopup = (
    mode,
    vehicle = null
  ) => {
    const vehicleNumber =
      vehicle
        ? getVehicleNumber(vehicle)
        : "";

    const titles = {
      allVehicles:
        "Export All Vehicle Documents",
      allDocuments:
        `Export Documents - ${vehicleNumber}`,
      vehicleDetails:
        `Export Vehicle Details - ${vehicleNumber}`,
    };

    setExportPopup({
      open: true,
      mode,
      vehicle,
      title: titles[mode],
    });
  };

  const closeExportPopup = () => {
    setExportPopup({
      open: false,
      mode: "allVehicles",
      vehicle: null,
      title: "",
    });
  };

  const getAllVehicleExportData = () => {
    const headers = [
      "Vehicle Number",
      "Transport Owner",
      "Vehicle Type",
      ...TABLE_DOCUMENT_COLUMNS.flatMap(
        ({ label }) => [
          `${label} Start Date`,
          `${label} Expiry Date`,
          `${label} File`,
        ]
      ),
      "Overall Status",
    ];

    const rows = filteredVehicles.map(
      (vehicle) => {
        const overallStatus =
          getVehicleOverallStatus(vehicle);

        return [
          getVehicleNumber(vehicle),
          getTransportName(vehicle),
          getVehicleType(vehicle),

          ...TABLE_DOCUMENT_COLUMNS.flatMap(
            ({ key }) => {
              const documentData =
                getDocumentData(
                  vehicle,
                  key
                );

              return [
                formatDate(
                  documentData?.startDate
                ),
                formatDate(
                  documentData?.expiryDate
                ),
                documentData?.originalName ||
                  documentData?.fileName ||
                  documentData?.filename ||
                  "-",
              ];
            }
          ),

          overallStatus.label,
        ];
      }
    );

    return {
      headers,
      rows,
      fileName: "all-vehicle-documents",
      title: "All Vehicle Documents",
    };
  };

  const getVehicleExportData = (
    vehicle,
    includeOnlyDocuments = false
  ) => {
    const vehicleNumber =
      getVehicleNumber(vehicle);

    const headers = [
      "Document",
      "Start Date",
      "Expiry Date",
      "Status",
      "File Name",
    ];

    const rows =
      TABLE_DOCUMENT_COLUMNS.map(
        ({ key, label }) => {
          const documentData =
            getDocumentData(
              vehicle,
              key
            );

          const expiryState =
            getExpiryState(
              documentData?.expiryDate
            );

          return [
            label,
            formatDate(
              documentData?.startDate
            ),
            formatDate(
              documentData?.expiryDate
            ),
            expiryState.text,
            documentData?.originalName ||
              documentData?.fileName ||
              documentData?.filename ||
              "-",
          ];
        }
      );

    if (!includeOnlyDocuments) {
      rows.unshift(
        [
          "Vehicle Number",
          vehicleNumber,
          "",
          "",
          "",
        ],
        [
          "Transport Owner",
          getTransportName(vehicle),
          "",
          "",
          "",
        ],
        [
          "Vehicle Type",
          getVehicleType(vehicle),
          "",
          "",
          "",
        ],
        [
          "Overall Status",
          getVehicleOverallStatus(
            vehicle
          ).label,
          "",
          "",
          "",
        ]
      );
    }

    const safeVehicleNumber =
      vehicleNumber.replace(
        /[^a-zA-Z0-9-_]/g,
        "-"
      );

    return {
      headers,
      rows,
      fileName:
        includeOnlyDocuments
          ? `${safeVehicleNumber}-documents`
          : `${safeVehicleNumber}-vehicle-details`,
      title:
        includeOnlyDocuments
          ? `Documents - ${vehicleNumber}`
          : `Vehicle Details - ${vehicleNumber}`,
    };
  };

  const getSelectedExportData = () => {
    if (
      exportPopup.mode ===
      "allVehicles"
    ) {
      return getAllVehicleExportData();
    }

    if (!exportPopup.vehicle) {
      return null;
    }

    return getVehicleExportData(
      exportPopup.vehicle,
      exportPopup.mode ===
        "allDocuments"
    );
  };

  const exportAsExcel = () => {
    const exportData =
      getSelectedExportData();

    if (!exportData) {
      return;
    }

    const worksheet =
      XLSX.utils.aoa_to_sheet([
        exportData.headers,
        ...exportData.rows,
      ]);

    worksheet["!cols"] =
      exportData.headers.map(
        (_, columnIndex) => ({
          wch: Math.min(
            32,
            Math.max(
              14,
              ...exportData.rows.map(
                (row) =>
                  String(
                    row[columnIndex] ?? ""
                  ).length + 2
              )
            )
          ),
        })
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Vehicle Documents"
    );

    XLSX.writeFile(
      workbook,
      `${exportData.fileName}.xlsx`
    );

    closeExportPopup();
  };

  const exportAsPdf = () => {
    const exportData =
      getSelectedExportData();

    if (!exportData) {
      return;
    }

    const isWide =
      exportData.headers.length > 8;

    const pdf = new jsPDF({
      orientation:
        isWide
          ? "landscape"
          : "portrait",
      unit: "pt",
      format: "a4",
    });

    pdf.setFontSize(16);
    pdf.setTextColor(20, 44, 78);
    pdf.text(
      exportData.title,
      40,
      42
    );

    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Generated: ${new Date().toLocaleString(
        "en-IN"
      )}`,
      40,
      59
    );

    autoTable(pdf, {
      startY: 75,
      head: [exportData.headers],
      body: exportData.rows,
      theme: "grid",
      styles: {
        fontSize: isWide ? 6 : 8,
        cellPadding: isWide ? 3 : 5,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [18, 62, 145],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [247, 249, 252],
      },
      margin: {
        left: 30,
        right: 30,
      },
    });

    pdf.save(
      `${exportData.fileName}.pdf`
    );

    closeExportPopup();
  };

  return (
    <section className="vehicle-document-page">
      {/* ======================================
          Header — Refresh button removed
      ====================================== */}

      <header className="vehicle-document-header">
        <div className="vehicle-document-heading">
          <span className="vehicle-document-eyebrow">
            Fleet Compliance
          </span>

          <h1>
            Vehicle Document Dashboard
          </h1>

          <p>
            Track document expiry dates,
            uploaded certificates and fleet
            compliance for every vehicle.
          </p>
        </div>
      </header>

      {/* ======================================
          Error
      ====================================== */}

      {apiError && (
        <div
          className="vehicle-document-error"
          role="alert"
        >
          <AlertTriangle size={18} />
          <span>{apiError}</span>
        </div>
      )}

      {/* ======================================
          Overview cards
      ====================================== */}

      <section className="document-overview-grid">
        <article className="document-overview-card">
          <div className="document-overview-icon">
            <FileText size={21} />
          </div>

          <div>
            <span>
              Matching Vehicles
            </span>

            <strong>
              {dashboardCounts.total}
            </strong>

            <small>
              {selectedPeriodLabel}
            </small>
          </div>
        </article>

        <article className="document-overview-card active">
          <div className="document-overview-icon">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Active</span>

            <strong>
              {dashboardCounts.active}
            </strong>

            <small>
              Valid documents
            </small>
          </div>
        </article>

        <article className="document-overview-card warning">
          <div className="document-overview-icon">
            <CalendarDays size={21} />
          </div>

          <div>
            <span>
              Expiring Soon
            </span>

            <strong>
              {dashboardCounts.expiringSoon}
            </strong>

            <small>
              Within 30 days
            </small>
          </div>
        </article>

        <article className="document-overview-card expired">
          <div className="document-overview-icon">
            <AlertTriangle size={21} />
          </div>

          <div>
            <span>Expired</span>

            <strong>
              {dashboardCounts.expired}
            </strong>

            <small>
              Action required
            </small>
          </div>
        </article>
      </section>


      {/* ======================================
          Document Expiry Summary
      ====================================== */}

      <section className="document-summary-section">
        <div className="document-section-title document-summary-toolbar">
          <div className="document-summary-title-content">
            <h2>
              Document Expiry Summary
            </h2>

            <p>
              Expirations recorded for{" "}
              {selectedPeriodLabel}.
            </p>
          </div>

          <div className="document-summary-filter-controls">
            <div className="document-filter-field">
              <label htmlFor="document-month">
                Month
              </label>

              <select
                id="document-month"
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(
                    event.target.value
                  )
                }
              >
                {MONTH_OPTIONS.map(
                  ({
                    value,
                    label,
                  }) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="document-filter-field document-year-field">
              <label htmlFor="document-year">
                Year
              </label>

              <select
                id="document-year"
                value={selectedYear}
                onChange={(event) =>
                  setSelectedYear(
                    event.target.value
                  )
                }
              >
                {YEAR_OPTIONS.map(
                  (year) => (
                    <option
                      key={year}
                      value={String(year)}
                    >
                      {year}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="document-summary-grid">
          {documentSummaries.map(
            ({
              key,
              title,
              icon: Icon,
              entries,
            }) => {
              const urgent =
                entries.some(
                  ({
                    expiryState,
                  }) =>
                    expiryState.type ===
                    "expired" ||
                    expiryState.type ===
                    "critical"
                );

              return (
                <article
                  key={key}
                  className="document-summary-card"
                >
                  <div className="document-summary-card-header">
                    <div className="document-summary-icon">
                      <Icon size={21} />
                    </div>

                    <span
                      className={`document-expiry-count ${urgent
                        ? "urgent"
                        : ""
                        }`}
                    >
                      {entries.length}{" "}
                      {entries.length === 1
                        ? "record"
                        : "records"}
                    </span>
                  </div>

                  <h3>{title}</h3>

                  <div className="document-summary-list">
                    {entries.length > 0 ? (
                      entries
                        .slice(0, 5)
                        .map((entry) => (
                          <div
                            className="document-summary-row"
                            key={`${key}-${entry.vehicleId || entry.vehicleNumber}`}
                          >
                            <div>
                              <span>
                                {
                                  entry.vehicleNumber
                                }
                              </span>

                              <small>
                                {formatDate(
                                  entry.expiryDate
                                )}
                              </small>
                            </div>

                            <strong
                              className={`expiry-${entry.expiryState.type}`}
                            >
                              {
                                entry.expiryState.text
                              }
                            </strong>
                          </div>
                        ))
                    ) : (
                      <div className="document-summary-empty">
                        <CalendarDays size={20} />

                        <span>
                          No{" "}
                          {title.toLowerCase()}{" "}
                          expirations in{" "}
                          {selectedPeriodLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>

      {/* ======================================
          All vehicle records table
      ====================================== */}

      <section className="document-list-panel">
        <div className="document-list-toolbar">
          <div className="document-list-heading">
            <h2>
              All Vehicle Documents
            </h2>

            <p>
              {filteredVehicles.length}{" "}
              vehicle
              {filteredVehicles.length === 1
                ? ""
                : "s"}{" "}
              displayed
            </p>
          </div>

          <div className="document-list-actions">
            <label className="document-search-box">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search vehicle, owner or type"
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
              />
            </label>

            <button
              type="button"
              className="document-export-button"
              onClick={() =>
                openExportPopup(
                  "allVehicles"
                )}
              disabled={
                filteredVehicles.length ===
                0
              }
            >
              <FileDown size={17} />
              Export
            </button>
          </div>
        </div>

        <div className="document-table-wrapper">
          <table className="document-detail-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Transport Owner</th>
                <th>Type</th>

                {TABLE_DOCUMENT_COLUMNS.map(
                  ({
                    key,
                    label,
                  }) => (
                    <th key={key}>
                      {label}
                    </th>
                  )
                )}

                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    className="document-table-message"
                    colSpan={
                      TABLE_DOCUMENT_COLUMNS.length +
                      5
                    }
                  >
                    <div className="document-loading-state">
                      <RefreshCw
                        size={22}
                        className="is-spinning"
                      />

                      <span>
                        Loading vehicle
                        documents...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredVehicles.length ===
                0 ? (
                <tr>
                  <td
                    className="document-table-message"
                    colSpan={
                      TABLE_DOCUMENT_COLUMNS.length +
                      4
                    }
                  >
                    <div className="document-empty-state">
                      <FileText size={28} />

                      <strong>
                        No vehicles found
                      </strong>

                      <span>
                        No vehicle records
                        match your search.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(
                  (
                    vehicle,
                    index
                  ) => {
                    const overallStatus =
                      getVehicleOverallStatus(
                        vehicle
                      );

                    return (
                      <tr
                        key={
                          getVehicleId(
                            vehicle
                          ) ||
                          index
                        }
                      >
                        <td>
                          <strong className="document-vehicle-number">
                            {
                              getVehicleNumber(
                                vehicle
                              )
                            }
                          </strong>
                        </td>

                        <td>
                          <span className="document-table-text">
                            {
                              getTransportName(
                                vehicle
                              )
                            }
                          </span>
                        </td>

                        <td>
                          <span className="document-type-chip">
                            {
                              getVehicleType(
                                vehicle
                              )
                            }
                          </span>
                        </td>

                        {TABLE_DOCUMENT_COLUMNS.map(
                          ({ key }) => {
                            const documentData =
                              getDocumentData(
                                vehicle,
                                key
                              );

                            const expiryState =
                              getExpiryState(
                                documentData?.expiryDate
                              );

                            const fileAvailable =
                              hasDocumentFile(
                                documentData
                              );

                            return (
                              <td key={key}>
                                <div className="document-table-date-cell">
                                  <div className="document-date-content">
                                    <span
                                      className={`document-expiry-date expiry-${expiryState.type}`}
                                    >
                                      {formatDate(
                                        documentData?.expiryDate
                                      )}
                                    </span>

                                    {documentData?.expiryDate && (
                                      <small>
                                        {
                                          expiryState.text
                                        }
                                      </small>
                                    )}
                                  </div>

                                  {fileAvailable && (
                                    <button
                                      type="button"
                                      className="document-open-button"
                                      onClick={() =>
                                        downloadDocument(
                                          vehicle,
                                          key
                                        )
                                      }
                                      title="Download document"
                                      aria-label={`Download ${key} document for ${getVehicleNumber(
                                        vehicle
                                      )}`}
                                    >
                                      <Download size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          }
                        )}

                        <td>
                          <span
                            className={`document-status-badge status-${overallStatus.type}`}
                          >
                            {
                              overallStatus.label
                            }
                          </span>
                        </td>

                        <td>
                          <div className="document-row-actions">
                            <button
                              type="button"
                              className="download-all-documents-button"
                              onClick={() =>
                                downloadAllDocumentsAsPdf(
                                  vehicle
                                )
                              }
                              disabled={
                                downloadingDocumentsId ===
                                getVehicleId(
                                  vehicle
                                )
                              }
                              title={`Download all uploaded documents for ${getVehicleNumber(
                                vehicle
                              )}`}
                            >
                              {downloadingDocumentsId ===
                              getVehicleId(
                                vehicle
                              ) ? (
                                <RefreshCw
                                  size={14}
                                  className="is-spinning"
                                />
                              ) : (
                                <Download size={14} />
                              )}

                              <span>
                                {downloadingDocumentsId ===
                                getVehicleId(
                                  vehicle
                                )
                                  ? "Creating PDF..."
                                  : "All Documents"}
                              </span>
                            </button>

                            <button
                              type="button"
                              className="vehicle-details-download-button"
                              onClick={() =>
                                openExportPopup(
                                  "vehicleDetails",
                                  vehicle
                                )
                              }
                              title={`Download details CSV for ${getVehicleNumber(
                                vehicle
                              )}`}
                            >
                              <FileDown size={14} />
                              <span>Details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {exportPopup.open && (
        <div
          className="export-format-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeExportPopup();
            }
          }}
        >
          <div
            className="export-format-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-format-title"
          >
            <button
              type="button"
              className="export-format-close"
              onClick={closeExportPopup}
              aria-label="Close export popup"
            >
              <X size={19} />
            </button>

            <div className="export-format-heading">
              <div className="export-format-heading-icon">
                <FileDown size={22} />
              </div>

              <div>
                <h2 id="export-format-title">
                  {exportPopup.title}
                </h2>

                <p>
                  Choose the file format you want
                  to download.
                </p>
              </div>
            </div>

            <div className="export-format-options">
              <button
                type="button"
                className="export-format-option excel"
                onClick={exportAsExcel}
              >
                <span className="export-option-icon">
                  <FileSpreadsheet size={25} />
                </span>

                <span className="export-option-content">
                  <strong>Excel</strong>
                  <small>
                    Download as an XLSX spreadsheet
                  </small>
                </span>
              </button>

              <button
                type="button"
                className="export-format-option pdf"
                onClick={exportAsPdf}
              >
                <span className="export-option-icon">
                  <FileText size={25} />
                </span>

                <span className="export-option-content">
                  <strong>PDF</strong>
                  <small>
                    Download as a printable PDF
                  </small>
                </span>
              </button>
            </div>

            <button
              type="button"
              className="export-format-cancel"
              onClick={closeExportPopup}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Vehicledocument;