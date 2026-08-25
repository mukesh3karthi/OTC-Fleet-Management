import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  AlertTriangle,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  History,
  Package,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  Upload,
  Wrench,
  X,
} from "lucide-react";

import "../pagescss/assets.css";
import Assetsmodal from "../Assets/Asssetsmodal";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const OWN_VEHICLE_API_URL =
  `${API_BASE_URL}/api/ownvehicles`;

const API_OPTIONS = {
  timeout: 60000,
};


const CATEGORY_CONFIG = {
  tools: {
    label: "Tools",
    icon: Wrench,
    items: [
      "Hydraulic Jack",
      "Jackey Lever",
      "Tyre Lever",
      "Kokki Lever",
      "Wheel Spanner",
      "Stepney Remove Tools",
      "Grease Gun",
      "Towing Lock",
      "Hammer",
      "Adjustment Spanner",
      "Cutting Plier",
      "Screw Driver",
      "Cabin Cleaning Brush",
      "Bent Lever",
      "Double End Spanner",
      "Pipe Wrench",
      "Ring Spanner",
      "Allen Key",
      "Tilter Lever",
      "Punches",
      "Fan",
      "Others",
    ],
  },

  safety: {
    label: "Safety Materials",
    icon: ShieldCheck,
    items: [
      "Traffic Reflector",
      "Safety Helmet",
      "Wheel Stopper",
      "Red Flag",
      "Reflective Jacket",
      "Safety Shoe",
      "Hand Gloves",
      "Fire Extinguisher",
      "First Aid Box",
      "Safety Button Light",
      "Safety Angle",
      "Safety Serial Light for Blade",
      "Reflective Tape & Sticker",
      "Others",
    ],
  },

  lashing: {
    label: "Lashing Materials",
    icon: Package,
    items: [
      "MS Chain 40 ft",
      "MS Chain 20 ft",
      "Chain Tightener",
      "D Shackle",
      "Lashing Belt",
      "Lashing Belt Hook",
      "Belt Tightener",
      "Wooden Piece",
      "Frame",
      "Spare Wheel",
      "Spare Tube",
      "Spare Flap",
      "Insulation Tape",
      "Spare Electrical Items",
      "Spare Bulb",
      "Bamboo Stick",
      "Others",
    ],
  },

  cooking: {
    label: "Cooking Materials",
    icon: ChefHat,
    items: [
      "Gas Stove",
      "Gas Cylinder",
      "Cooking Pot",
      "Frying Pan",
      "Pressure Cooker",
      "Plate",
      "Glass",
      "Spoon",
      "Knife",
      "Bucket",
      "Water Can",
      "Storage Box",
      "Others",
    ],
  },
};

const createDefaultItems = (
  categoryKey
) => {
  return CATEGORY_CONFIG[
    categoryKey
  ].items.map((itemName, index) => ({
    id:
      `${categoryKey}-${index + 1}`,
    itemName,
    quantity: 0,
    status: "Missing",
    remarks: "",
    image: "",
    replacementHistory: [],
  }));
};

const createDefaultAssetRecord = () => ({
  inspectionDate: "",
  inspectedBy: "",
  tools:
    createDefaultItems("tools"),
  safety:
    createDefaultItems("safety"),
  lashing:
    createDefaultItems("lashing"),
  cooking:
    createDefaultItems("cooking"),
});

const mergeAssetItems = (
  categoryKey,
  savedItems = []
) => {
  const defaults =
    createDefaultItems(categoryKey);

  if (!Array.isArray(savedItems)) {
    return defaults;
  }

  const savedById = new Map(
    savedItems.map((item) => [
      String(item?.id || ""),
      item,
    ])
  );

  const mergedDefaults =
    defaults.map((defaultItem) => ({
      ...defaultItem,
      ...(savedById.get(
        defaultItem.id
      ) || {}),
      replacementHistory:
        Array.isArray(
          savedById.get(
            defaultItem.id
          )?.replacementHistory
        )
          ? savedById.get(
              defaultItem.id
            ).replacementHistory
          : [],
    }));

  const defaultIds = new Set(
    defaults.map((item) => item.id)
  );

  const customItems =
    savedItems.filter(
      (item) =>
        item?.id &&
        !defaultIds.has(
          String(item.id)
        )
    );

  return [
    ...mergedDefaults,
    ...customItems,
  ];
};

const mergeAssetRecord = (
  savedAssets
) => {
  const defaults =
    createDefaultAssetRecord();

  if (
    !savedAssets ||
    typeof savedAssets !== "object"
  ) {
    return defaults;
  }

  return {
    ...defaults,
    ...savedAssets,
    tools: mergeAssetItems(
      "tools",
      savedAssets.tools
    ),
    safety: mergeAssetItems(
      "safety",
      savedAssets.safety
    ),
    lashing: mergeAssetItems(
      "lashing",
      savedAssets.lashing
    ),
    cooking: mergeAssetItems(
      "cooking",
      savedAssets.cooking
    ),
  };
};




const normalizeOwnVehicle = (
  vehicle
) => ({
  ...vehicle,

  /*
    Assetsmodal.jsx currently expects these common
    field names. They are mapped from Own Vehicle
    Details without changing the backend response.
  */
  vehicleNumber:
    vehicle?.vehicleNo ??
    vehicle?.vehicleNumber ??
    "",

  vehicleType:
    vehicle?.type ??
    vehicle?.vehicleType ??
    "",

  transportProvider:
    vehicle?.transportOwner ??
    vehicle?.transportProvider ??
    "",

  siteName:
    vehicle?.siteName ??
    vehicle?.site ??
    "",
});

const getVehicleKey = (
  vehicle
) =>
  String(
    vehicle?._id ??
    vehicle?.id ??
    vehicle?.vehicleId ??
    vehicle?.ownVehicleId ??
    vehicle?.vehicleNo ??
    vehicle?.vehicleNumber ??
    ""
  );

const calculateCategorySummary = (
  items
) => {
  const total = items.length;

  const available =
    items.filter(
      (item) =>
        item.status ===
        "Available"
    ).length;

  const missing =
    items.filter(
      (item) =>
        item.status === "Missing"
    ).length;

  const damaged =
    items.filter(
      (item) =>
        item.status === "Damaged"
    ).length;

  const completion =
    total > 0
      ? Math.round(
        (available / total) * 100
      )
      : 0;

  return {
    total,
    available,
    missing,
    damaged,
    completion,
  };
};

const calculateVehicleSummary = (
  record
) => {
  const allItems =
    Object.keys(
      CATEGORY_CONFIG
    ).flatMap(
      (categoryKey) =>
        record?.[categoryKey] || []
    );

  return calculateCategorySummary(
    allItems
  );
};

const formatDate = (
  dateValue
) => {
  if (!dateValue) {
    return "-";
  }

  return new Date(
    `${dateValue}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Assets = () => {
  const [vehicles, setVehicles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    selectedVehicle,
    setSelectedVehicle,
  ] = useState(null);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("tools");

  const [
    currentRecord,
    setCurrentRecord,
  ] = useState(null);

  const [saving, setSaving] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [
    replacementItem,
    setReplacementItem,
  ] = useState(null);

  const [
    replacementNote,
    setReplacementNote,
  ] = useState("");

  const [
    replacementDate,
    setReplacementDate,
  ] = useState("");

  const modalRef = useRef(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await axios.get(
            OWN_VEHICLE_API_URL,
            API_OPTIONS
          );

        const rawList =
          Array.isArray(
            response.data?.ownVehicles
          )
            ? response.data.ownVehicles
            : Array.isArray(
              response.data
            )
              ? response.data
              : [];

        const normalizedList =
          rawList.map(
            normalizeOwnVehicle
          );

        setVehicles(
          normalizedList
        );
      } catch (apiError) {
        console.error(
          "Unable to load vehicles:",
          apiError
        );

        setError(
          apiError.response?.data
            ?.message ||
          "Unable to load own vehicle details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  useEffect(() => {
    const modalOpen =
      Boolean(selectedVehicle);

    document.body.classList.toggle(
      "vehicle-assets-modal-open",
      modalOpen
    );

    return () => {
      document.body.classList.remove(
        "vehicle-assets-modal-open"
      );
    };
  }, [selectedVehicle]);

  useEffect(() => {
    const handleEscape = (
      event
    ) => {
      if (
        event.key === "Escape" &&
        !saving
      ) {
        if (replacementItem) {
          setReplacementItem(null);
          return;
        }

        closeAssetModal();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    selectedVehicle,
    replacementItem,
    saving,
  ]);

  const filteredVehicles =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (!search) {
        return vehicles;
      }

      return vehicles.filter(
        (vehicle) =>
          [
            vehicle.vehicleNumber,
            vehicle.vehicleNo,
            vehicle.vehicleType,
            vehicle.type,
            vehicle.vehicleMake,
            vehicle.transportProvider,
            vehicle.transportOwner,
            vehicle.engineNo,
            vehicle.chassisNo,
            vehicle.purchasedFrom,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(search)
          )
      );
    }, [vehicles, searchTerm]);

  const currentItems =
    currentRecord?.[
    selectedCategory
    ] || [];

  const categorySummary =
    calculateCategorySummary(
      currentItems
    );

  const vehicleSummary =
    currentRecord
      ? calculateVehicleSummary(
        currentRecord
      )
      : {
        total: 0,
        available: 0,
        missing: 0,
        damaged: 0,
        completion: 0,
      };

  const openAssetModal = async (
    vehicle
  ) => {
    try {
      setSelectedVehicle(
        vehicle
      );

      setSelectedCategory(
        "tools"
      );

      setMessage("");
      setError("");
      setCurrentRecord(
        createDefaultAssetRecord()
      );

      const vehicleId =
        Number(vehicle?.id);

      if (!vehicleId) {
        throw new Error(
          "Vehicle ID is missing."
        );
      }

      const response =
        await axios.get(
          `${OWN_VEHICLE_API_URL}/${vehicleId}/assets`,
          API_OPTIONS
        );

      const savedAssets =
        response.data?.assets;

      setCurrentRecord(
        savedAssets
          ? {
            ...createDefaultAssetRecord(),
            ...savedAssets,

            tools:
              savedAssets.tools
                ?.length
                ? savedAssets.tools
                : createDefaultItems(
                  "tools"
                ),

            safety:
              savedAssets.safety
                ?.length
                ? savedAssets.safety
                : createDefaultItems(
                  "safety"
                ),

            lashing:
              savedAssets.lashing
                ?.length
                ? savedAssets.lashing
                : createDefaultItems(
                  "lashing"
                ),

            cooking:
              savedAssets.cooking
                ?.length
                ? savedAssets.cooking
                : createDefaultItems(
                  "cooking"
                ),
          }
          : createDefaultAssetRecord()
      );
    } catch (apiError) {
      console.error(
        "Fetch vehicle assets error:",
        apiError
      );

      setCurrentRecord(
        createDefaultAssetRecord()
      );

      setMessage(
        apiError.response?.data
          ?.message ||
        apiError.message ||
        "Unable to load vehicle assets."
      );
    }
  };

  const closeAssetModal = () => {
    if (saving) {
      return;
    }

    setSelectedVehicle(null);
    setCurrentRecord(null);
    setSelectedCategory("tools");
    setMessage("");
    setReplacementItem(null);
  };

  const updateInspectionField = (
    field,
    value
  ) => {
    setCurrentRecord(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };

  const updateAssetItem = (
    itemIndex,
    field,
    value
  ) => {
    setCurrentRecord(
      (previous) => {
        const updatedItems = [
          ...previous[
          selectedCategory
          ],
        ];

        const currentItem = {
          ...updatedItems[itemIndex],
        };

        if (
          field === "quantity"
        ) {
          const numericValue =
            value === ""
              ? ""
              : Math.max(
                0,
                Number(value)
              );

          currentItem.quantity =
            Number.isFinite(
              numericValue
            )
              ? numericValue
              : 0;

          if (
            Number(
              currentItem.quantity
            ) > 0 &&
            currentItem.status ===
            "Missing"
          ) {
            currentItem.status =
              "Available";
          }

          if (
            Number(
              currentItem.quantity
            ) === 0
          ) {
            currentItem.status =
              "Missing";
          }
        } else {
          currentItem[field] =
            value;
        }

        updatedItems[itemIndex] =
          currentItem;

        return {
          ...previous,
          [selectedCategory]:
            updatedItems,
        };
      }
    );
  };

  const handleImageUpload = (
    itemIndex,
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setMessage(
        "Please select an image file."
      );

      return;
    }

    if (
      file.size >
      1024 * 1024
    ) {
      setMessage(
        "Image must be smaller than 1 MB."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      updateAssetItem(
        itemIndex,
        "image",
        reader.result
      );
    };

    reader.readAsDataURL(file);
  };

  const removeImage = (
    itemIndex
  ) => {
    updateAssetItem(
      itemIndex,
      "image",
      ""
    );
  };

  const addReplacementHistory = () => {
    if (!replacementItem) {
      return;
    }

    if (
      !replacementDate ||
      !replacementNote.trim()
    ) {
      setMessage(
        "Enter replacement date and details."
      );

      return;
    }

    setCurrentRecord(
      (previous) => {
        const updatedItems = [
          ...previous[
          selectedCategory
          ],
        ];

        const itemIndex =
          updatedItems.findIndex(
            (item) =>
              item.id ===
              replacementItem.id
          );

        if (itemIndex === -1) {
          return previous;
        }

        updatedItems[itemIndex] = {
          ...updatedItems[
          itemIndex
          ],
          replacementHistory: [
            ...(updatedItems[
              itemIndex
            ].replacementHistory ||
              []),
            {
              id: Date.now(),
              date:
                replacementDate,
              note:
                replacementNote.trim(),
            },
          ],
        };

        return {
          ...previous,
          [selectedCategory]:
            updatedItems,
        };
      }
    );

    setReplacementItem(null);
    setReplacementDate("");
    setReplacementNote("");
    setMessage("");
  };

  const deleteReplacementHistory = (
    itemId,
    historyId
  ) => {
    setCurrentRecord(
      (previous) => ({
        ...previous,
        [selectedCategory]:
          previous[
            selectedCategory
          ].map((item) =>
            item.id === itemId
              ? {
                ...item,
                replacementHistory:
                  (
                    item.replacementHistory ||
                    []
                  ).filter(
                    (history) =>
                      history.id !==
                      historyId
                  ),
              }
              : item
          ),
      })
    );
  };

  const saveAssets = async () => {
  if (
    !selectedVehicle ||
    !currentRecord
  ) {
    return;
  }

  try {
    setSaving(true);
    setMessage("");

    const vehicleId =
      Number(
        selectedVehicle.id
      );

    if (!vehicleId) {
      throw new Error(
        "Vehicle ID is missing."
      );
    }

    const requestData = {
      inspectionDate:
        currentRecord
          .inspectionDate ||
        "",

      inspectedBy:
        currentRecord
          .inspectedBy ||
        "",

      tools:
        currentRecord.tools ||
        [],

      safety:
        currentRecord.safety ||
        [],

      lashing:
        currentRecord.lashing ||
        [],

      cooking:
        currentRecord.cooking ||
        [],
    };

    const response =
      await axios.put(
        `${OWN_VEHICLE_API_URL}/${vehicleId}/assets`,
        requestData,
        API_OPTIONS
      );

    const savedAssets =
      response.data?.assets ||
      requestData;

    setCurrentRecord(
      mergeAssetRecord(
        savedAssets
      )
    );

    setVehicles(
      (previousVehicles) =>
        previousVehicles.map(
          (vehicle) =>
            Number(vehicle.id) ===
            vehicleId
              ? {
                  ...vehicle,
                  assets:
                    savedAssets,
                }
              : vehicle
        )
    );

    setMessage(
      response.data?.message ||
      "Vehicle assets saved successfully."
    );

    setTimeout(() => {
      setSelectedVehicle(null);
      setCurrentRecord(null);
      setSelectedCategory("tools");
      setMessage("");
      setReplacementItem(null);
    }, 700);
  } catch (saveError) {
    console.error(
      "Save vehicle assets error:",
      saveError
    );

    setMessage(
      saveError.response?.data
        ?.message ||
        saveError.message ||
        "Unable to save vehicle assets."
    );
  } finally {
    setSaving(false);
  }
};

  const createExportRowsForRecord = (
    record
  ) => {
    if (!record) {
      return [];
    }

    return Object.entries(
      CATEGORY_CONFIG
    ).flatMap(
      ([
        categoryKey,
        category,
      ]) =>
        (
          record[categoryKey] ||
          []
        ).map(
          (item, index) => ({
            Category:
              category.label,
            "S.No":
              index + 1,
            "Item Name":
              item.itemName,
            Image:
              item.image || "",
            Quantity:
              Number(
                item.quantity || 0
              ),
            Status:
              item.status || "-",
            Remarks:
              item.remarks || "",
            "Replacement Records":
              (
                item.replacementHistory ||
                []
              )
                .map(
                  (history) =>
                    `${formatDate(
                      history.date
                    )}: ${
                      history.note
                    }`
                )
                .join(" | "),
          })
        )
    );
  };


  const getVehicleAssetRecord =
    async (vehicle) => {

      if (
        vehicle?.assets &&
        typeof vehicle.assets ===
          "object"
      ) {
        return mergeAssetRecord(
          vehicle.assets
        );
      }

      const vehicleId =
        Number(vehicle?.id);

      if (!vehicleId) {
        return createDefaultAssetRecord();
      }

      try {
        const response =
          await axios.get(
            `${OWN_VEHICLE_API_URL}/${vehicleId}/assets`,
            API_OPTIONS
          );

        return mergeAssetRecord(
          response.data?.assets
        );
      } catch (exportError) {
        console.error(
          `Unable to load assets for ${
            vehicle?.vehicleNumber ||
            "vehicle"
          }:`,
          exportError
        );

        return createDefaultAssetRecord();
      }
    };


  const getImageAsDataUrl =
    async (imageSource) => {

      if (
        !imageSource ||
        typeof imageSource !==
          "string"
      ) {
        return "";
      }

      if (
        imageSource.startsWith(
          "data:image/"
        )
      ) {
        return imageSource;
      }

      try {
        const response =
          await fetch(
            imageSource
          );

        if (!response.ok) {
          throw new Error(
            `Image request failed: ${
              response.status
            }`
          );
        }

        const blob =
          await response.blob();

        return await new Promise(
          (
            resolve,
            reject
          ) => {
            const reader =
              new FileReader();

            reader.onloadend =
              () =>
                resolve(
                  String(
                    reader.result ||
                    ""
                  )
                );

            reader.onerror =
              reject;

            reader.readAsDataURL(
              blob
            );
          }
        );
      } catch (imageError) {
        console.warn(
          "Unable to load export image:",
          imageSource,
          imageError
        );

        return "";
      }
    };


  const getImageExtension = (
    dataUrl
  ) => {

    const normalized =
      String(
        dataUrl || ""
      ).toLowerCase();

    if (
      normalized.startsWith(
        "data:image/jpeg"
      ) ||
      normalized.startsWith(
        "data:image/jpg"
      )
    ) {
      return "jpeg";
    }

    if (
      normalized.startsWith(
        "data:image/gif"
      )
    ) {
      return "gif";
    }

    return "png";
  };


  const sanitizeSheetName = (
    value
  ) => {

    return String(
      value ||
      "Vehicle"
    )
      .replace(
        /[\\/*?:[\]]/g,
        "-"
      )
      .slice(
        0,
        31
      );
  };


  const styleExcelHeader = (
    row
  ) => {

    row.height = 24;

    row.eachCell(
      (cell) => {
        cell.font = {
          bold: true,
          color: {
            argb:
              "FFFFFFFF",
          },
          size: 11,
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb:
              "FF123B5D",
          },
        };

        cell.alignment = {
          vertical:
            "middle",
          horizontal:
            "center",
        };

        cell.border = {
          top: {
            style: "thin",
            color: {
              argb:
                "FFD8E2E8",
            },
          },
          left: {
            style: "thin",
            color: {
              argb:
                "FFD8E2E8",
            },
          },
          bottom: {
            style: "thin",
            color: {
              argb:
                "FFD8E2E8",
            },
          },
          right: {
            style: "thin",
            color: {
              argb:
                "FFD8E2E8",
            },
          },
        };
      }
    );
  };


  const addVehicleSheetToWorkbook =
    async (
      workbook,
      vehicle,
      record,
      sheetName
    ) => {

      const worksheet =
        workbook.addWorksheet(
          sanitizeSheetName(
            sheetName ||
            vehicle?.vehicleNumber ||
            "Vehicle"
          )
        );

      worksheet.properties.defaultRowHeight =
        20;

      worksheet.mergeCells(
        "A1:H1"
      );

      const titleCell =
        worksheet.getCell(
          "A1"
        );

      titleCell.value =
        `Vehicle Assets - ${
          vehicle?.vehicleNumber ||
          "-"
        }`;

      titleCell.font = {
        size: 16,
        bold: true,
        color: {
          argb:
            "FF123B5D",
        },
      };

      titleCell.alignment = {
        vertical:
          "middle",
        horizontal:
          "left",
      };

      worksheet.getRow(
        1
      ).height = 28;

      const summary =
        calculateVehicleSummary(
          record
        );

      const vehicleDetails = [
        [
          "Vehicle Number",
          vehicle?.vehicleNumber ||
            "-",
          "Vehicle Type",
          vehicle?.vehicleType ||
            "-",
        ],
        [
          "Vehicle Make",
          vehicle?.vehicleMake ||
            "-",
          "Transport Owner",
          vehicle?.transportOwner ||
            vehicle?.transportProvider ||
            "-",
        ],
        [
          "Site",
          vehicle?.siteName ||
            "-",
          "Completion",
          `${summary.completion}%`,
        ],
        [
          "Inspection Date",
          formatDate(
            record?.inspectionDate
          ),
          "Inspected By",
          record?.inspectedBy ||
            "-",
        ],
      ];

      vehicleDetails.forEach(
        (values) => {
          const row =
            worksheet.addRow(
              values
            );

          row.height = 22;

          [
            1,
            3,
          ].forEach(
            (columnIndex) => {
              const cell =
                row.getCell(
                  columnIndex
                );

              cell.font = {
                bold: true,
                color: {
                  argb:
                    "FF5C7083",
                },
              };

              cell.fill = {
                type:
                  "pattern",
                pattern:
                  "solid",
                fgColor: {
                  argb:
                    "FFF4F7F9",
                },
              };
            }
          );

          row.eachCell(
            (cell) => {
              cell.alignment = {
                vertical:
                  "middle",
              };

              cell.border = {
                bottom: {
                  style:
                    "thin",
                  color: {
                    argb:
                      "FFE4EAEF",
                  },
                },
              };
            }
          );
        }
      );

      worksheet.addRow(
        []
      );

      const headerRow =
        worksheet.addRow([
          "Category",
          "S.No",
          "Item Name",
          "Image",
          "Quantity",
          "Status",
          "Remarks",
          "Replacement Records",
        ]);

      styleExcelHeader(
        headerRow
      );

      const rows =
        createExportRowsForRecord(
          record
        );

      for (
        const rowData
        of rows
      ) {
        const row =
          worksheet.addRow([
            rowData.Category,
            rowData["S.No"],
            rowData[
              "Item Name"
            ],
            "",
            rowData.Quantity,
            rowData.Status,
            rowData.Remarks,
            rowData[
              "Replacement Records"
            ],
          ]);

        row.height = 50;

        row.eachCell(
          (cell) => {
            cell.alignment = {
              vertical:
                "middle",
              wrapText:
                true,
            };

            cell.border = {
              bottom: {
                style:
                  "thin",
                color: {
                  argb:
                    "FFE7ECEF",
                },
              },
            };
          }
        );

        if (
          rowData.Image
        ) {
          const dataUrl =
            await getImageAsDataUrl(
              rowData.Image
            );

          if (dataUrl) {
            try {
              const imageId =
                workbook.addImage({
                  base64:
                    dataUrl,
                  extension:
                    getImageExtension(
                      dataUrl
                    ),
                });

              worksheet.addImage(
                imageId,
                {
                  tl: {
                    col: 3.12,
                    row:
                      row.number -
                      0.88,
                  },
                  ext: {
                    width: 58,
                    height: 58,
                  },
                  editAs:
                    "oneCell",
                }
              );
            } catch (
              imageError
            ) {
              console.warn(
                "Excel image insert error:",
                imageError
              );
            }
          }
        }
      }

      worksheet.columns = [
        {
          width: 21,
        },
        {
          width: 8,
        },
        {
          width: 30,
        },
        {
          width: 12,
        },
        {
          width: 12,
        },
        {
          width: 17,
        },
        {
          width: 32,
        },
        {
          width: 48,
        },
      ];

      worksheet.views = [
        {
          state:
            "frozen",
          ySplit: 7,
        },
      ];

      return worksheet;
    };


  const exportVehicleExcel =
    async (
      vehicle,
      record
    ) => {

      const workbook =
        new ExcelJS.Workbook();

      workbook.creator =
        "OTC Groups";

      workbook.created =
        new Date();

      await addVehicleSheetToWorkbook(
        workbook,
        vehicle,
        record,
        "Asset Checklist"
      );

      const buffer =
        await workbook.xlsx.writeBuffer();

      const blob =
        new Blob(
          [buffer],
          {
            type:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }
        );

      saveAs(
        blob,
        `vehicle-assets-${
          vehicle?.vehicleNumber ||
          "vehicle"
        }.xlsx`
      );
    };


  const buildPdfRowsWithImages =
    async (record) => {

      const rows =
        createExportRowsForRecord(
          record
        );

      return await Promise.all(
        rows.map(
          async (row) => ({
            ...row,
            Image:
              row.Image
                ? await getImageAsDataUrl(
                    row.Image
                  )
                : "",
          })
        )
      );
    };


  const drawVehiclePdfSection =
    async (
      document,
      vehicle,
      record,
      {
        firstSection =
          false,
      } = {}
    ) => {

      if (!firstSection) {
        document.addPage();
      }

      const summary =
        calculateVehicleSummary(
          record
        );

      document.setFontSize(
        16
      );

      document.setTextColor(
        18,
        59,
        93
      );

      document.text(
        "Vehicle Assets Register",
        14,
        15
      );

      document.setFontSize(
        9
      );

      document.setTextColor(
        55,
        75,
        92
      );

      document.text(
        `Vehicle: ${
          vehicle?.vehicleNumber ||
          "-"
        }`,
        14,
        22
      );

      document.text(
        `Type: ${
          vehicle?.vehicleType ||
          "-"
        }`,
        70,
        22
      );

      document.text(
        `Make: ${
          vehicle?.vehicleMake ||
          "-"
        }`,
        120,
        22
      );

      document.text(
        `Owner: ${
          vehicle?.transportOwner ||
          vehicle?.transportProvider ||
          "-"
        }`,
        170,
        22
      );

      document.text(
        `Completion: ${
          summary.completion
        }%`,
        240,
        22
      );

      document.text(
        `Inspection: ${formatDate(
          record?.inspectionDate
        )}`,
        14,
        28
      );

      document.text(
        `Inspected By: ${
          record?.inspectedBy ||
          "-"
        }`,
        85,
        28
      );

      const rows =
        await buildPdfRowsWithImages(
          record
        );

      autoTable(
        document,
        {
          startY: 34,

          head: [[
            "Category",
            "S.No",
            "Item Name",
            "Image",
            "Qty",
            "Status",
            "Remarks",
            "Replacement Records",
          ]],

          body:
            rows.map(
              (row) => [
                row.Category,
                row["S.No"],
                row[
                  "Item Name"
                ],
                "",
                row.Quantity,
                row.Status,
                row.Remarks,
                row[
                  "Replacement Records"
                ],
              ]
            ),

          styles: {
            fontSize: 7.2,
            cellPadding: 2,
            valign:
              "middle",
            textColor: [
              49,
              73,
              94,
            ],
            minCellHeight: 17,
          },

          headStyles: {
            fillColor: [
              18,
              59,
              93,
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
              250,
              251,
            ],
          },

          columnStyles: {
            0: {
              cellWidth: 27,
            },
            1: {
              cellWidth: 11,
            },
            2: {
              cellWidth: 40,
            },
            3: {
              cellWidth: 22,
            },
            4: {
              cellWidth: 14,
            },
            5: {
              cellWidth: 24,
            },
            6: {
              cellWidth: 47,
            },
            7: {
              cellWidth: 66,
            },
          },

          didDrawCell: (
            data
          ) => {

            if (
              data.section !==
                "body" ||
              data.column.index !==
                3
            ) {
              return;
            }

            const row =
              rows[
                data.row.index
              ];

            if (
              !row?.Image
            ) {
              return;
            }

            try {
              const format =
                getImageExtension(
                  row.Image
                ) ===
                "jpeg"
                  ? "JPEG"
                  : "PNG";

              const padding = 1.5;

              const maxWidth =
                data.cell.width -
                padding * 2;

              const maxHeight =
                data.cell.height -
                padding * 2;

              const imageSize =
                Math.max(
                  1,
                  Math.min(
                    14,
                    maxWidth,
                    maxHeight
                  )
                );

              const x =
                data.cell.x +
                (
                  data.cell.width -
                  imageSize
                ) /
                2;

              const y =
                data.cell.y +
                (
                  data.cell.height -
                  imageSize
                ) /
                2;

              document.addImage(
                row.Image,
                format,
                x,
                y,
                imageSize,
                imageSize
              );
            } catch (
              imageError
            ) {
              console.warn(
                "PDF image insert error:",
                imageError
              );
            }
          },
        }
      );
    };


  const exportVehiclePdf =
    async (
      vehicle,
      record
    ) => {

      const document =
        new jsPDF({
          orientation:
            "landscape",
          unit: "mm",
          format: "a4",
        });

      await drawVehiclePdfSection(
        document,
        vehicle,
        record,
        {
          firstSection:
            true,
        }
      );

      document.save(
        `vehicle-assets-${
          vehicle?.vehicleNumber ||
          "vehicle"
        }.pdf`
      );
    };


  const handleVehicleExcel =
    async (vehicle) => {

      try {
        setExporting(
          true
        );

        const record =
          await getVehicleAssetRecord(
            vehicle
          );

        await exportVehicleExcel(
          vehicle,
          record
        );
      } catch (
        exportError
      ) {
        console.error(
          "Vehicle Excel export error:",
          exportError
        );

        setError(
          "Unable to export vehicle Excel."
        );
      } finally {
        setExporting(
          false
        );
      }
    };


  const handleVehiclePdf =
    async (vehicle) => {

      try {
        setExporting(
          true
        );

        const record =
          await getVehicleAssetRecord(
            vehicle
          );

        await exportVehiclePdf(
          vehicle,
          record
        );
      } catch (
        exportError
      ) {
        console.error(
          "Vehicle PDF export error:",
          exportError
        );

        setError(
          "Unable to export vehicle PDF."
        );
      } finally {
        setExporting(
          false
        );
      }
    };


  const getAllVehicleExportData =
    async () => {

      return await Promise.all(
        vehicles.map(
          async (
            vehicle,
            index
          ) => {
            const record =
              await getVehicleAssetRecord(
                vehicle
              );

            const summary =
              calculateVehicleSummary(
                record
              );

            return {
              index,
              vehicle,
              record,
              summary,
            };
          }
        )
      );
    };


  const exportAllVehiclesExcel =
    async () => {

      try {
        setExporting(true);
        setError("");

        const vehicleData =
          await getAllVehicleExportData();

        const workbook =
          new ExcelJS.Workbook();

        workbook.creator =
          "OTC Groups";

        workbook.created =
          new Date();

        const summarySheet =
          workbook.addWorksheet(
            "All Vehicles"
          );

        const headerRow =
          summarySheet.addRow([
            "S.No",
            "Vehicle Number",
            "Vehicle Type",
            "Vehicle Make",
            "Transport Owner",
            "Site",
            "Total Items",
            "Available",
            "Missing",
            "Damaged",
            "Completion",
            "Last Inspection",
            "Inspected By",
          ]);

        styleExcelHeader(
          headerRow
        );

        vehicleData.forEach(
          ({
            index,
            vehicle,
            record,
            summary,
          }) => {
            summarySheet.addRow([
              index + 1,
              vehicle.vehicleNumber ||
                "-",
              vehicle.vehicleType ||
                "-",
              vehicle.vehicleMake ||
                "-",
              vehicle.transportOwner ||
                vehicle.transportProvider ||
                "-",
              vehicle.siteName ||
                "-",
              summary.total,
              summary.available,
              summary.missing,
              summary.damaged,
              `${summary.completion}%`,
              formatDate(
                record.inspectionDate
              ),
              record.inspectedBy ||
                "-",
            ]);
          }
        );

        summarySheet.columns = [
          {
            width: 8,
          },
          {
            width: 20,
          },
          {
            width: 18,
          },
          {
            width: 20,
          },
          {
            width: 26,
          },
          {
            width: 20,
          },
          {
            width: 12,
          },
          {
            width: 12,
          },
          {
            width: 12,
          },
          {
            width: 12,
          },
          {
            width: 14,
          },
          {
            width: 20,
          },
          {
            width: 22,
          },
        ];

        summarySheet.views = [
          {
            state:
              "frozen",
            ySplit: 1,
          },
        ];

        for (
          let dataIndex = 0;
          dataIndex <
          vehicleData.length;
          dataIndex++
        ) {
          const {
            vehicle,
            record,
          } =
            vehicleData[
              dataIndex
            ];

          await addVehicleSheetToWorkbook(
            workbook,
            vehicle,
            record,
            `${
              dataIndex + 1
            }-${
              vehicle.vehicleNumber ||
              "Vehicle"
            }`
          );
        }

        const buffer =
          await workbook.xlsx.writeBuffer();

        const blob =
          new Blob(
            [buffer],
            {
              type:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }
          );

        saveAs(
          blob,
          "all-vehicle-assets-with-images.xlsx"
        );
      } catch (
        exportError
      ) {
        console.error(
          "All vehicle Excel export error:",
          exportError
        );

        setError(
          "Unable to export all vehicle data."
        );
      } finally {
        setExporting(false);
      }
    };


  const exportAllVehiclesPdf =
    async () => {

      try {
        setExporting(true);
        setError("");

        const vehicleData =
          await getAllVehicleExportData();

        const document =
          new jsPDF({
            orientation:
              "landscape",
            unit: "mm",
            format: "a4",
          });

        document.setFontSize(
          16
        );

        document.setTextColor(
          18,
          59,
          93
        );

        document.text(
          "All Vehicle Assets Summary",
          14,
          15
        );

        document.setFontSize(
          9
        );

        document.setTextColor(
          90,
          108,
          124
        );

        document.text(
          `Total Vehicles: ${
            vehicleData.length
          }`,
          14,
          22
        );

        autoTable(
          document,
          {
            startY: 28,
            head: [[
              "S.No",
              "Vehicle No.",
              "Type",
              "Make",
              "Transport Owner",
              "Available",
              "Missing",
              "Damaged",
              "Completion",
              "Last Inspection",
            ]],
            body:
              vehicleData.map(
                ({
                  index,
                  vehicle,
                  record,
                  summary,
                }) => [
                  index + 1,
                  vehicle.vehicleNumber ||
                    "-",
                  vehicle.vehicleType ||
                    "-",
                  vehicle.vehicleMake ||
                    "-",
                  vehicle.transportOwner ||
                    vehicle.transportProvider ||
                    "-",
                  summary.available,
                  summary.missing,
                  summary.damaged,
                  `${summary.completion}%`,
                  formatDate(
                    record.inspectionDate
                  ),
                ]
              ),
            styles: {
              fontSize: 7.5,
              cellPadding: 2.2,
              textColor: [
                49,
                73,
                94,
              ],
            },
            headStyles: {
              fillColor: [
                18,
                59,
                93,
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
                250,
                251,
              ],
            },
          }
        );

        for (
          const {
            vehicle,
            record,
          }
          of vehicleData
        ) {
          await drawVehiclePdfSection(
            document,
            vehicle,
            record,
            {
              firstSection:
                false,
            }
          );
        }

        document.save(
          "all-vehicle-assets-with-images.pdf"
        );
      } catch (
        exportError
      ) {
        console.error(
          "All vehicle PDF export error:",
          exportError
        );

        setError(
          "Unable to export all vehicle data."
        );
      } finally {
        setExporting(false);
      }
    };


  return (
    <div className="assets-page">
      <section className="assets-header">
        <div>
          <span className="assets-eyebrow">
            FLEET MANAGEMENT
          </span>

          <h1>
            Vehicle Assets
          </h1>

          <p>
            Manage tools, safety,
            lashing and cooking
            materials for every
            vehicle.
          </p>
        </div>

        <div className="assets-header-icon">
          <Package size={28} />
        </div>
      </section>

      <section className="assets-toolbar-card">
        <div className="assets-search-box">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search vehicle number, type, make or owner..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() =>
                setSearchTerm("")
              }
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="assets-total-count">
          <Truck size={18} />

          <span>
            {
              filteredVehicles.length
            }{" "}
            vehicles
          </span>
        </div>
      </section>

      {loading && (
        <div className="assets-message">
          Loading own vehicle details...
        </div>
      )}

      {!loading && error && (
        <div className="assets-error">
          <AlertTriangle
            size={18}
          />
          {error}
        </div>
      )}

      {!loading &&
        !error && (
          <section className="assets-vehicle-card">
            <div className="assets-table-heading">
              <div>
                <h2>
                  Vehicle List
                </h2>

                <p>
                  Click a vehicle number
                  to manage its assets.
                </p>
              </div>

              <div className="assets-table-export-actions">
                <button
                  type="button"
                  className="assets-export-button excel"
                  onClick={
                    exportAllVehiclesExcel
                  }
                  disabled={
                    exporting ||
                    vehicles.length === 0
                  }
                >
                  <FileSpreadsheet
                    size={17}
                  />

                  {exporting
                    ? "Preparing..."
                    : "All Excel"}
                </button>

                <button
                  type="button"
                  className="assets-export-button pdf"
                  onClick={
                    exportAllVehiclesPdf
                  }
                  disabled={
                    exporting ||
                    vehicles.length === 0
                  }
                >
                  <FileText
                    size={17}
                  />

                  {exporting
                    ? "Preparing..."
                    : "All PDF"}
                </button>
              </div>
            </div>

            <div className="assets-table-wrapper">
              <table className="assets-vehicle-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>
                      Vehicle Number
                    </th>
                    <th>
                      Vehicle Type
                    </th>
                    <th>
                      Vehicle Make
                    </th>
                    <th>
                      Transport Owner
                    </th>
                    <th>
                      Completion
                    </th>
                    <th>
                      Last Inspection
                    </th>
                    <th>Action</th>
                    <th>Excel</th>
                    <th>PDF</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVehicles.length >
                    0 ? (
                    filteredVehicles.map(
                      (
                        vehicle,
                        index
                      ) => {
                        const vehicleKey =
                          getVehicleKey(
                            vehicle
                          );

                        const record =
                          vehicle.assets ||
                          null;

                        const summary =
                          record
                            ? calculateVehicleSummary(
                              record
                            )
                            : {
                              completion: 0,
                            };

                        return (
                          <tr
                            key={
                              vehicleKey ||
                              index
                            }
                          >
                            <td>
                              {index +
                                1}
                            </td>

                            <td>
                              <button
                                type="button"
                                className="vehicle-number-link"
                                onClick={() =>
                                  openAssetModal(
                                    vehicle
                                  )
                                }
                              >
                                {vehicle.vehicleNumber ||
                                  "-"}
                              </button>
                            </td>

                            <td>
                              {vehicle.vehicleType ||
                                "-"}
                            </td>

                            <td>
                              {vehicle.vehicleMake ||
                                "-"}
                            </td>

                            <td>
                              {vehicle.transportOwner ||
                                vehicle.transportProvider ||
                                "-"}
                            </td>

                            <td>
                              <div className="assets-progress-cell">
                                <div className="assets-progress-track">
                                  <span
                                    style={{
                                      width: `${summary.completion}%`,
                                    }}
                                  />
                                </div>

                                <strong>
                                  {
                                    summary.completion
                                  }
                                  %
                                </strong>
                              </div>
                            </td>

                            <td>
                              {record
                                ?.inspectionDate
                                ? formatDate(
                                  record.inspectionDate
                                )
                                : "-"}
                            </td>

                            <td>
                              <button
                                type="button"
                                className="manage-assets-button"
                                onClick={() =>
                                  openAssetModal(
                                    vehicle
                                  )
                                }
                              >
                                Manage

                                <ChevronRight
                                  size={15}
                                />
                              </button>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="vehicle-export-button excel"
                                onClick={() =>
                                  handleVehicleExcel(
                                    vehicle
                                  )
                                }
                              >
                                <FileSpreadsheet
                                  size={15}
                                />

                                Excel
                              </button>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="vehicle-export-button pdf"
                                onClick={() =>
                                  handleVehiclePdf(
                                    vehicle
                                  )
                                }
                              >
                                <FileText
                                  size={15}
                                />

                                PDF
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="assets-empty-row"
                      >
                        No vehicles
                        found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

      <Assetsmodal
        selectedVehicle={selectedVehicle}
        currentRecord={currentRecord}
        saving={saving}
        closeAssetModal={closeAssetModal}
        modalRef={modalRef}
        vehicleSummary={vehicleSummary}
        updateInspectionField={updateInspectionField}
        categoryConfig={CATEGORY_CONFIG}
        calculateCategorySummary={calculateCategorySummary}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categorySummary={categorySummary}
        currentItems={currentItems}
        removeImage={removeImage}
        handleImageUpload={handleImageUpload}
        updateAssetItem={updateAssetItem}
        setReplacementItem={setReplacementItem}
        setReplacementDate={setReplacementDate}
        setReplacementNote={setReplacementNote}
        message={message}
        saveAssets={saveAssets}
        replacementItem={replacementItem}
        replacementDate={replacementDate}
        replacementNote={replacementNote}
        addReplacementHistory={addReplacementHistory}
        formatDate={formatDate}
        deleteReplacementHistory={deleteReplacementHistory}
      />
    </div>
  );
};

export default Assets;