import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  AlertTriangle,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Package,
  Printer,
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

  const createExportRows = () => {
    if (!currentRecord) {
      return [];
    }

    return Object.entries(
      CATEGORY_CONFIG
    ).flatMap(
      ([
        categoryKey,
        category,
      ]) =>
        currentRecord[
          categoryKey
        ].map(
          (item, index) => ({
            Category:
              category.label,
            "S.No": index + 1,
            "Item Name":
              item.itemName,
            Quantity:
              Number(
                item.quantity || 0
              ),
            Status:
              item.status,
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
                    )}: ${history.note
                    }`
                )
                .join(" | "),
          })
        )
    );
  };

  const exportExcel = () => {
    const exportRows =
      createExportRows();

    const worksheet =
      XLSX.utils.json_to_sheet(
        exportRows
      );

    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 8 },
      { wch: 28 },
      { wch: 12 },
      { wch: 15 },
      { wch: 35 },
      { wch: 50 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Vehicle Assets"
    );

    XLSX.writeFile(
      workbook,
      `vehicle-assets-${selectedVehicle
        ?.vehicleNumber ||
      "vehicle"
      }.xlsx`
    );
  };

  const exportPdf = () => {
    const document =
      new jsPDF({
        orientation:
          "landscape",
        unit: "mm",
        format: "a4",
      });

    document.setFontSize(16);

    document.text(
      "Vehicle Assets Register",
      14,
      15
    );

    document.setFontSize(9);

    document.text(
      `Vehicle: ${selectedVehicle
        ?.vehicleNumber || "-"
      }`,
      14,
      22
    );

    document.text(
      `Make: ${selectedVehicle
        ?.vehicleMake || "-"
      }`,
      75,
      22
    );

    document.text(
      `Inspection Date: ${formatDate(
        currentRecord
          ?.inspectionDate
      )}`,
      135,
      22
    );

    document.text(
      `Inspected By: ${currentRecord
        ?.inspectedBy || "-"
      }`,
      215,
      22
    );

    autoTable(document, {
      startY: 28,
      head: [
        [
          "Category",
          "S.No",
          "Item Name",
          "Quantity",
          "Status",
          "Remarks",
        ],
      ],
      body: createExportRows().map(
        (row) => [
          row.Category,
          row["S.No"],
          row["Item Name"],
          row.Quantity,
          row.Status,
          row.Remarks,
        ]
      ),
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [
          22,
          87,
          216,
        ],
      },
    });

    document.save(
      `vehicle-assets-${selectedVehicle
        ?.vehicleNumber ||
      "vehicle"
      }.pdf`
    );
  };

  const printAssets = () => {
    window.print();
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
                                  size={
                                    16
                                  }
                                />
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
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
        printAssets={printAssets}
        exportExcel={exportExcel}
        exportPdf={exportPdf}
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