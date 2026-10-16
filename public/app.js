/**
 * Creative Print Calculator — Engine & State Controller
 * Conforms to DESIGN-airtable specifications
 */

(function () {
  "use strict";

  // --- DEFAULT MASTER DATA SEED ---
  const DEFAULT_SETTINGS = {
    pin: "1234",
    defaultPrintSingle: 2.60,
    defaultPrintDouble: 4.50,
    lamSingle: 1.50,
    lamDouble: 3.00,
    bindingSaddle: 1.50,
    bindingPerfect: 8.00,
    bindingWiro: 12.00,
    bindingMethods: [
      { id: "saddle", name: "Saddle Stitch (Center Pin Staple)", rate: 1.50 },
      { id: "perfect", name: "Perfect Binding", rate: 8.00 },
      { id: "wiro", name: "Wiro / Spiral Binding", rate: 12.00 },
      { id: "none", name: "No Binding (Loose Fold)", rate: 0.00 }
    ],
    cuttingFixed: 0,
    fixedOther: 0,
    wastagePercent: 5,
    marginPercent: 25,
    gstPercent: 18,
    useSlabs: true,
    minOrderCharge: 50,
    customServices: [
      { id: "srv_crease", name: "Creasing / Scoring", rate: 0.50, unit: "sheet" },
      { id: "srv_spotuv", name: "Spot UV Coating", rate: 3.50, unit: "sheet" },
      { id: "srv_foiling", name: "Gold / Silver Foiling", rate: 6.00, unit: "sheet" },
      { id: "srv_diepunch", name: "Die Punching", rate: 1.00, unit: "sheet" },
      { id: "srv_hardcover", name: "Hardcover Case Binding", rate: 45.00, unit: "book" }
    ]
  };

  const DEFAULT_SLABS = [
    { min: 1, max: 10, name: "Sample / Short-Run (1-10)", printAdjust: 3.00, marginAdjust: 15 },
    { min: 11, max: 50, name: "Small Retail (11-50)", printAdjust: 1.00, marginAdjust: 5 },
    { min: 51, max: 200, name: "Standard (51-200)", printAdjust: 0, marginAdjust: 0 },
    { min: 201, max: 999999, name: "Bulk Wholesale (200+)", printAdjust: -0.50, marginAdjust: -7 }
  ];

  const DEFAULT_SUBSTRATES = [
    { id: "sub_1", name: "12×18 – Art Paper 130 GSM", size: "12×18", sheetCost: 1.50, printSingle: 2.60, printDouble: 4.50, category: "paper" },
    { id: "sub_2", name: "12×18 – Art Paper 170 GSM", size: "12×18", sheetCost: 2.00, printSingle: 2.60, printDouble: 4.50, category: "paper" },
    { id: "sub_3", name: "12×18 – Art Card 250 GSM", size: "12×18", sheetCost: 3.00, printSingle: 2.60, printDouble: 4.50, category: "paper" },
    { id: "sub_4", name: "12×18 – Art Card 300 GSM", size: "12×18", sheetCost: 3.60, printSingle: 2.60, printDouble: 4.50, category: "paper" },
    { id: "sub_5", name: "12×18 – Art Card 350 GSM", size: "12×18", sheetCost: 4.20, printSingle: 2.60, printDouble: 4.50, category: "paper" },
    { id: "sub_6", name: "13×19 – Art Paper 130 GSM", size: "13×19", sheetCost: 1.80, printSingle: 2.80, printDouble: 4.80, category: "paper" },
    { id: "sub_7", name: "13×19 – Art Paper 170 GSM", size: "13×19", sheetCost: 2.30, printSingle: 2.80, printDouble: 4.80, category: "paper" },
    { id: "sub_8", name: "13×19 – Art Card 250 GSM", size: "13×19", sheetCost: 3.40, printSingle: 2.80, printDouble: 4.80, category: "paper" },
    { id: "sub_9", name: "13×19 – Art Card 300 GSM", size: "13×19", sheetCost: 4.20, printSingle: 2.80, printDouble: 4.80, category: "paper" },
    { id: "sub_10", name: "13×19 – Art Card 350 GSM", size: "13×19", sheetCost: 5.00, printSingle: 2.80, printDouble: 4.80, category: "paper" },
    { id: "sub_11", name: "12×18 – SBS Paper 300 GSM", size: "12×18", sheetCost: 4.80, printSingle: 2.80, printDouble: 4.80, category: "paper" },
    { id: "sub_12", name: "12×18 – Normal Gumming Sheet", size: "12×18", sheetCost: 4.50, printSingle: 3.50, printDouble: 0.00, category: "sticker" },
    { id: "sub_13", name: "12×18 – AD Gumming Sheet", size: "12×18", sheetCost: 5.50, printSingle: 3.50, printDouble: 0.00, category: "sticker" },
    { id: "sub_14", name: "13×19 – AD Gumming Sheet", size: "13×19", sheetCost: 6.50, printSingle: 3.80, printDouble: 0.00, category: "sticker" },
    { id: "sub_15", name: "13×19 – White Vinyl Sticker", size: "13×19", sheetCost: 12.00, printSingle: 4.50, printDouble: 0.00, category: "sticker" },
    { id: "sub_16", name: "13×19 – Clear Vinyl Sticker", size: "13×19", sheetCost: 14.50, printSingle: 5.00, printDouble: 0.00, category: "sticker" },
    { id: "sub_17", name: "12×18 – Golden Vinyl Sticker", size: "12×18", sheetCost: 16.00, printSingle: 5.00, printDouble: 0.00, category: "sticker" },
    { id: "sub_18", name: "12×18 – Silver / Metallic Vinyl Sticker", size: "12×18", sheetCost: 16.00, printSingle: 5.00, printDouble: 0.00, category: "sticker" },
    { id: "sub_19", name: "12×18 – Texture Paper 250 GSM", size: "12×18", sheetCost: 7.50, printSingle: 3.50, printDouble: 6.00, category: "specialty" },
    { id: "sub_20", name: "12×18 – Texture Paper 300 GSM", size: "12×18", sheetCost: 9.00, printSingle: 3.50, printDouble: 6.00, category: "specialty" },
    { id: "sub_21", name: "12×18 – Bond / Executive 100 GSM", size: "12×18", sheetCost: 1.80, printSingle: 2.60, printDouble: 4.50, category: "paper" },
    { id: "sub_22", name: "12×18 – NTR / Synthetic Non-Tearable", size: "12×18", sheetCost: 11.00, printSingle: 4.50, printDouble: 8.00, category: "specialty" },
    { id: "sub_23", name: "12×18 – Sunshine Super White", size: "12×18", sheetCost: 2.80, printSingle: 2.60, printDouble: 4.50, category: "paper" }
  ];

  // --- PERSISTENCE LAYER ---
  const STORAGE_KEY_SETTINGS = "cpc_settings_v1";
  const STORAGE_KEY_SUBSTRATES = "cpc_substrates_v1";
  const STORAGE_KEY_SLABS = "cpc_slabs_v1";

  let settings = loadData(STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS);
  let substrates = loadData(STORAGE_KEY_SUBSTRATES, DEFAULT_SUBSTRATES);
  let slabs = loadData(STORAGE_KEY_SLABS, DEFAULT_SLABS);

  function loadData(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      const parsed = JSON.parse(data);
      if (Array.isArray(fallback)) {
        if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
        if (key === STORAGE_KEY_SUBSTRATES) {
          // Merge in any newly added default items that are missing
          const existingNames = new Set(parsed.map((s) => (s.name || "").toLowerCase().trim()));
          const merged = [...parsed];
          for (const def of fallback) {
            if (!existingNames.has(def.name.toLowerCase().trim())) {
              merged.push({ ...def });
            }
          }
          return merged;
        }
        return parsed;
      }
      const loaded = { ...fallback, ...parsed };
      if (!loaded.bindingMethods || !Array.isArray(loaded.bindingMethods) || loaded.bindingMethods.length === 0) {
        loaded.bindingMethods = JSON.parse(JSON.stringify(fallback.bindingMethods));
      }
      if (!loaded.customServices || !Array.isArray(loaded.customServices)) {
        loaded.customServices = JSON.parse(JSON.stringify(fallback.customServices));
      }
      return loaded;
    } catch (e) {
      console.warn("Storage read error, using fallback", e);
      return fallback;
    }
  }

  function saveData(syncToServer = true) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEY_SUBSTRATES, JSON.stringify(substrates));
      localStorage.setItem(STORAGE_KEY_SLABS, JSON.stringify(slabs));

      if (syncToServer) {
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings, substrates, slabs })
        })
          .then((r) => r.json())
          .then((res) => {
            if (res && res.success) {
              console.log("Central rates synchronized to server ✓");
            }
          })
          .catch((err) => {
            console.warn("Server sync unreachable (running in local storage mode):", err.message);
          });
      }
    } catch (e) {
      console.error("Storage write error", e);
    }
  }

  async function syncWithServer() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.substrates) && data.substrates.length > 0) {
          substrates = data.substrates;
          if (data.settings) settings = { ...DEFAULT_SETTINGS, ...data.settings };
          if (Array.isArray(data.slabs) && data.slabs.length > 0) slabs = data.slabs;
          saveData(false);
          populateSubstrateDropdowns();
          populateBindingDropdown();
          renderCalculatorCustomServices();
          if (document.body.classList.contains("modal-open")) {
            renderAdminSubstrateTable();
            renderAdminSlabsTable();
            renderAdminBindingMethodsTable();
            renderAdminCustomChargesTable();
            populateAdminSettingsForm();
          }
          calculateQuote();
          console.log("Central rates synchronized from server ✓");
        }
      }
    } catch (e) {
      console.warn("Server sync unreachable (offline mode):", e.message);
    }
  }

  // --- STATE VARIABLES ---
  let currentMode = "standard"; // 'standard' | 'brochure'
  let currentLayoutType = "preset"; // 'preset' | 'custom'
  let currentUps = 2; // 1, 2, 4, 8, 16 or custom (default: Half A4)
  let currentCustomNesting = null;
  let currentForcedSheetSize = "auto"; // 'auto' | '12×18' | '13×19'
  let lastCalculatedQuote = null;
  let isOwnerUnlocked = false;

  // --- UTILITY FORMATTERS ---
  const fmtINR = (val) =>
    "₹ " +
    (Number(val) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const $ = (id) => document.getElementById(id);

  // --- INITIALIZATION ---
  window.addEventListener("DOMContentLoaded", () => {
    populateSubstrateDropdowns();
    populateBindingDropdown();
    renderCalculatorCustomServices();
    setupEventListeners();
    setupAdminModal();
    setupAIParserListeners();
    calculateQuote();
    // Synchronize master rates from server for multi-user consistency
    syncWithServer();
  });

  window.addEventListener("focus", () => {
    if (!document.body.classList.contains("modal-open")) {
      syncWithServer();
    }
  });

  // --- POPULATE SELECTS ---
  function populateSubstrateDropdowns() {
    const stdSelect = $("std-substrate");
    const covSelect = $("bro-cover-substrate");
    const inSelect = $("bro-inner-substrate");

    const buildOptions = (selId, filterCat = null) => {
      return substrates
        .map((s, idx) => {
          return `<option value="${s.id}">${escapeHtml(s.name)} [Sheet: ₹${s.sheetCost} | Print: ₹${s.printSingle}/₹${s.printDouble}]</option>`;
        })
        .join("");
    };

    if (stdSelect) {
      const prev = stdSelect.value;
      stdSelect.innerHTML = buildOptions("std");
      if (prev && substrates.some((s) => s.id === prev)) {
        stdSelect.value = prev;
      }
      renderUniversalCustomDropdown("std-substrate");
    }

    if (covSelect) {
      const prev = covSelect.value;
      covSelect.innerHTML = buildOptions("cov");
      // Default to 300 GSM for cover if available
      const covDefault = substrates.find((s) => s.name.includes("300 GSM")) || substrates[3];
      covSelect.value = prev || (covDefault ? covDefault.id : substrates[0].id);
      renderUniversalCustomDropdown("bro-cover-substrate");
    }

    if (inSelect) {
      const prev = inSelect.value;
      inSelect.innerHTML = buildOptions("in");
      // Default to 130 GSM for inner if available
      const inDefault = substrates.find((s) => s.name.includes("130 GSM")) || substrates[0];
      inSelect.value = prev || (inDefault ? inDefault.id : substrates[0].id);
      renderUniversalCustomDropdown("bro-inner-substrate");
    }
  }

  // --- UNIVERSAL CUSTOM DROPDOWN COMPONENT ---
  // Pinned blue selection with checkmark, light grey hover, and linked flush positioning for ALL dropdowns
  const ALL_CUSTOM_DROPDOWN_IDS = [
    "std-substrate",
    "dim-unit",
    "bro-size",
    "bro-cover-substrate",
    "bro-inner-substrate",
    "bro-binding"
  ];

  function renderUniversalCustomDropdown(selectId) {
    const hiddenSelect = $(selectId);
    const trigger = $(`${selectId}-trigger`);
    const panel = $(`${selectId}-panel`);
    if (!hiddenSelect || !trigger || !panel) return;

    const options = Array.from(hiddenSelect.options);
    if (options.length === 0) return;

    let selectedValue = hiddenSelect.value;
    if (!options.some((o) => o.value === selectedValue)) {
      selectedValue = options[0].value;
      hiddenSelect.value = selectedValue;
    }

    const currentOpt = options.find((o) => o.value === selectedValue) || options[0];

    const parseOptText = (txt) => {
      const squareMatch = txt.match(/^(.*?)\s*(\[.*?\])\s*$/);
      if (squareMatch) {
        return { title: squareMatch[1].trim(), meta: squareMatch[2].trim() };
      }
      const roundMatch = txt.match(/^(.*?)\s*(\(.*?\))\s*$/);
      if (roundMatch && roundMatch[1].trim().length > 0) {
        return { title: roundMatch[1].trim(), meta: roundMatch[2].trim() };
      }
      return { title: txt, meta: "" };
    };

    const currentParsed = parseOptText(currentOpt.text);

    // Structure the trigger so the field itself contains both the formatted text AND the embedded search input!
    trigger.innerHTML = `
      <div class="custom-select-input-box">
        <span class="custom-select-trigger-text" id="${selectId}-trigger-text">
          <span style="font-weight: 600; color: var(--color-ink);">${escapeHtml(currentParsed.title)}</span>
          ${currentParsed.meta ? `<span style="color: #64748b; font-size: 12px; margin-left: 6px;">${escapeHtml(currentParsed.meta)}</span>` : ""}
        </span>
        <input type="text" class="custom-select-search-field" id="${selectId}-search-field" placeholder="Search (e.g. 220, gumming, A4)..." autocomplete="off" spellcheck="false" style="display: none;">
      </div>
      <div class="custom-select-actions">
        <button type="button" class="custom-select-clear-btn" id="${selectId}-clear-btn" style="display: none;" title="Clear search">✕</button>
        <svg class="custom-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
    `;

    const itemsHtml = options.map((opt, idx) => {
      const isSelected = opt.value === selectedValue;
      const parsed = parseOptText(opt.text);
      return `
        <div class="custom-dropdown-item ${isSelected ? "selected" : ""}" 
             data-val="${escapeHtml(opt.value)}" 
             data-title="${escapeHtml(parsed.title)}" 
             data-meta="${escapeHtml(parsed.meta)}" 
             data-index="${idx}"
             role="option" 
             aria-selected="${isSelected}">
          <div class="dropdown-item-info">
            <span class="dropdown-item-title">${escapeHtml(parsed.title)}</span>
            ${parsed.meta ? `<span class="dropdown-item-meta">${escapeHtml(parsed.meta)}</span>` : ""}
          </div>
          <span class="dropdown-item-check">${isSelected ? "✓" : ""}</span>
        </div>
      `;
    }).join("");

    // Direct items list at top of panel — NO REDUNDANT INNER SEARCH BOX!
    panel.innerHTML = `
      <div class="custom-dropdown-items-list" role="listbox">
        ${itemsHtml}
      </div>
      <div class="custom-dropdown-empty" style="display: none;">
        🔍 No matching options found
      </div>
    `;

    const triggerText = $(`${selectId}-trigger-text`);
    const searchField = $(`${selectId}-search-field`);
    const clearBtn = $(`${selectId}-clear-btn`);
    const itemsList = panel.querySelector(".custom-dropdown-items-list");
    const emptyNotice = panel.querySelector(".custom-dropdown-empty");

    // Close helper for this select
    const closeThisDropdown = () => {
      panel.style.display = "none";
      trigger.classList.remove("open");
      const wrapper = trigger.closest(".custom-select-wrapper");
      if (wrapper) wrapper.classList.remove("is-open");
      const card = trigger.closest(".content-card");
      if (card) card.classList.remove("has-open-dropdown");

      if (searchField) {
        searchField.value = "";
        searchField.style.display = "none";
      }
      if (triggerText) {
        triggerText.style.display = "block";
      }
      if (clearBtn) {
        clearBtn.style.display = "none";
      }
    };

    // Item click
    panel.querySelectorAll(".custom-dropdown-item").forEach((item) => {
      item.onclick = (e) => {
        e.stopPropagation();
        const clickedVal = item.dataset.val;
        hiddenSelect.value = clickedVal;
        closeThisDropdown();
        renderUniversalCustomDropdown(selectId);
        hiddenSelect.dispatchEvent(new Event("change", { bubbles: true }));
        calculateQuote();
      };
    });

    // Real-time live filtering using the trigger's search field
    if (searchField && itemsList) {
      const handleFilter = () => {
        const q = searchField.value.trim().toLowerCase();
        if (clearBtn) {
          clearBtn.style.display = q.length > 0 ? "inline-flex" : "none";
        }

        const allItems = Array.from(itemsList.querySelectorAll(".custom-dropdown-item"));

        if (!q) {
          allItems.sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));
          allItems.forEach((it) => {
            it.style.display = "flex";
            itemsList.appendChild(it);
          });
          if (emptyNotice) emptyNotice.style.display = "none";
          return;
        }

        let matchCount = 0;
        allItems.forEach((it) => {
          const title = (it.dataset.title || "").toLowerCase();
          const meta = (it.dataset.meta || "").toLowerCase();
          let score = 0;

          if (title.includes(q)) {
            if (title.startsWith(q) || title.includes(" " + q)) {
              score = 100;
            } else {
              score = 60;
            }
          } else if (meta.includes(q)) {
            score = 30;
          }

          it.dataset.score = score;
          if (score > 0) {
            it.style.display = "flex";
            matchCount++;
          } else {
            it.style.display = "none";
          }
        });

        allItems.sort((a, b) => {
          const diff = (Number(b.dataset.score) || 0) - (Number(a.dataset.score) || 0);
          if (diff !== 0) return diff;
          return Number(a.dataset.index) - Number(b.dataset.index);
        });
        allItems.forEach((it) => itemsList.appendChild(it));

        if (emptyNotice) {
          if (matchCount === 0) {
            emptyNotice.textContent = `🔍 No options matching "${searchField.value.trim()}"`;
            emptyNotice.style.display = "block";
          } else {
            emptyNotice.style.display = "none";
          }
        }
      };

      searchField.addEventListener("input", handleFilter);

      searchField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          const firstVisible = Array.from(itemsList.querySelectorAll(".custom-dropdown-item"))
            .find((it) => it.style.display !== "none");
          if (firstVisible) {
            firstVisible.click();
          }
        } else if (e.key === "Escape") {
          e.stopPropagation();
          closeThisDropdown();
        }
      });

      if (clearBtn) {
        clearBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          searchField.value = "";
          handleFilter();
          searchField.focus();
        });
      }
    }
  }

  let allCustomDropdownsInitialized = false;
  function setupAllCustomDropdownEvents() {
    if (allCustomDropdownsInitialized) return;
    allCustomDropdownsInitialized = true;

    ALL_CUSTOM_DROPDOWN_IDS.forEach((id) => {
      const trigger = $(`${id}-trigger`);
      const panel = $(`${id}-panel`);
      if (!trigger || !panel) return;

      trigger.addEventListener("click", (e) => {
        // If clicking the input or clear button while open, don't toggle close!
        if (e.target.classList.contains("custom-select-search-field") && trigger.classList.contains("open")) {
          return;
        }
        if (e.target.classList.contains("custom-select-clear-btn")) {
          return;
        }
        e.stopPropagation();
        const isOpen = trigger.classList.contains("open");

        // Close all other dropdown panels
        ALL_CUSTOM_DROPDOWN_IDS.forEach((otherId) => {
          if (otherId !== id) {
            const op = $(`${otherId}-panel`);
            const ot = $(`${otherId}-trigger`);
            const ow = ot?.closest(".custom-select-wrapper");
            const oc = ot?.closest(".content-card");
            const otText = $(`${otherId}-trigger-text`);
            const otSearch = $(`${otherId}-search-field`);
            const otClear = $(`${otherId}-clear-btn`);
            if (op) op.style.display = "none";
            if (ot) ot.classList.remove("open");
            if (ow) ow.classList.remove("is-open");
            if (oc) oc.classList.remove("has-open-dropdown");
            if (otText) otText.style.display = "block";
            if (otSearch) { otSearch.style.display = "none"; otSearch.value = ""; }
            if (otClear) otClear.style.display = "none";
          }
        });

        const wrapper = trigger.closest(".custom-select-wrapper");
        const card = trigger.closest(".content-card");
        const triggerText = $(`${id}-trigger-text`);
        const searchField = $(`${id}-search-field`);
        const clearBtn = $(`${id}-clear-btn`);
        const itemsList = panel.querySelector(".custom-dropdown-items-list");
        const emptyNotice = panel.querySelector(".custom-dropdown-empty");

        if (isOpen) {
          panel.style.display = "none";
          trigger.classList.remove("open");
          if (wrapper) wrapper.classList.remove("is-open");
          if (card) card.classList.remove("has-open-dropdown");
          if (triggerText) triggerText.style.display = "block";
          if (searchField) { searchField.style.display = "none"; searchField.value = ""; }
          if (clearBtn) clearBtn.style.display = "none";
        } else {
          panel.style.display = "flex";
          trigger.classList.add("open");
          if (wrapper) wrapper.classList.add("is-open");
          if (card) card.classList.add("has-open-dropdown");

          // Switch field from text display to live search input!
          if (triggerText) triggerText.style.display = "none";
          if (searchField) {
            searchField.style.display = "block";
            searchField.value = "";
            searchField.focus();
          }
          if (clearBtn) clearBtn.style.display = "none";
          if (emptyNotice) emptyNotice.style.display = "none";

          if (itemsList) {
            const allItems = Array.from(itemsList.querySelectorAll(".custom-dropdown-item"));
            allItems.sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));
            allItems.forEach((it) => {
              it.style.display = "flex";
              itemsList.appendChild(it);
            });
          }

          const sel = panel.querySelector(".custom-dropdown-item.selected");
          if (sel) sel.scrollIntoView({ block: "nearest" });
        }
      });
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      ALL_CUSTOM_DROPDOWN_IDS.forEach((id) => {
        const trigger = $(`${id}-trigger`);
        const panel = $(`${id}-panel`);
        const wrapper = trigger?.closest(".custom-select-wrapper");
        const card = trigger?.closest(".content-card");
        if (wrapper && !wrapper.contains(e.target)) {
          if (panel) panel.style.display = "none";
          if (trigger) trigger.classList.remove("open");
          if (wrapper) wrapper.classList.remove("is-open");
          if (card) card.classList.remove("has-open-dropdown");
          const triggerText = $(`${id}-trigger-text`);
          const searchField = $(`${id}-search-field`);
          const clearBtn = $(`${id}-clear-btn`);
          if (triggerText) triggerText.style.display = "block";
          if (searchField) { searchField.style.display = "none"; searchField.value = ""; }
          if (clearBtn) clearBtn.style.display = "none";
        }
      });
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        ALL_CUSTOM_DROPDOWN_IDS.forEach((id) => {
          const panel = $(`${id}-panel`);
          const trigger = $(`${id}-trigger`);
          const wrapper = trigger?.closest(".custom-select-wrapper");
          const card = trigger?.closest(".content-card");
          if (panel) panel.style.display = "none";
          if (trigger) trigger.classList.remove("open");
          if (wrapper) wrapper.classList.remove("is-open");
          if (card) card.classList.remove("has-open-dropdown");
          const triggerText = $(`${id}-trigger-text`);
          const searchField = $(`${id}-search-field`);
          const clearBtn = $(`${id}-clear-btn`);
          if (triggerText) triggerText.style.display = "block";
          if (searchField) { searchField.style.display = "none"; searchField.value = ""; }
          if (clearBtn) clearBtn.style.display = "none";
        });
      }
    });
  }

  function populateBindingDropdown() {
    const bindSelect = $("bro-binding");
    if (!bindSelect) return;
    const prev = bindSelect.value;
    const methods = settings.bindingMethods || [];
    bindSelect.innerHTML = methods
      .map((b) => `<option value="${b.id}">${escapeHtml(b.name)} (₹${b.rate.toFixed(2)}/book)</option>`)
      .join("");
    if (prev && methods.some((b) => b.id === prev)) {
      bindSelect.value = prev;
    } else if (methods.length > 0) {
      bindSelect.value = methods[0].id;
    }
    renderUniversalCustomDropdown("bro-binding");
  }

  function renderCalculatorCustomServices() {
    const stdList = $("std-custom-services-list");
    const broList = $("bro-custom-services-list");
    const services = settings.customServices || [];

    const prevCheckedStd = new Set(
      Array.from(document.querySelectorAll(".std-custom-srv-chk:checked")).map((c) => c.dataset.id)
    );
    const prevCheckedBro = new Set(
      Array.from(document.querySelectorAll(".bro-custom-srv-chk:checked")).map((c) => c.dataset.id)
    );

    if (stdList) {
      if (services.length === 0) {
        stdList.innerHTML = `<span style="font-size: 12px; color: var(--color-muted); font-style: italic;">No additional finishing services configured in Admin.</span>`;
      } else {
        stdList.innerHTML = services
          .map((srv) => {
            const isChecked = prevCheckedStd.has(srv.id);
            const unitLabel = srv.unit === "sheet" ? "/ sheet" : "/ pc";
            return `
              <label class="custom-srv-chk-card">
                <input type="checkbox" class="std-custom-srv-chk" data-id="${srv.id}" ${isChecked ? "checked" : ""}>
                <div class="custom-srv-info">
                  <span class="custom-srv-name">${escapeHtml(srv.name)}</span>
                  <span class="custom-srv-rate-badge">+₹${srv.rate.toFixed(2)} ${unitLabel}</span>
                </div>
              </label>
            `;
          })
          .join("");

        stdList.querySelectorAll(".std-custom-srv-chk").forEach((chk) => {
          chk.addEventListener("change", calculateQuote);
        });
      }
    }

    if (broList) {
      if (services.length === 0) {
        broList.innerHTML = `<span style="font-size: 12px; color: var(--color-muted); font-style: italic;">No additional finishing services configured in Admin.</span>`;
      } else {
        broList.innerHTML = services
          .map((srv) => {
            const isChecked = prevCheckedBro.has(srv.id);
            const unitLabel = srv.unit === "sheet" ? "/ sheet" : "/ book";
            return `
              <label class="custom-srv-chk-card">
                <input type="checkbox" class="bro-custom-srv-chk" data-id="${srv.id}" ${isChecked ? "checked" : ""}>
                <div class="custom-srv-info">
                  <span class="custom-srv-name">${escapeHtml(srv.name)}</span>
                  <span class="custom-srv-rate-badge">+₹${srv.rate.toFixed(2)} ${unitLabel}</span>
                </div>
              </label>
            `;
          })
          .join("");

        broList.querySelectorAll(".bro-custom-srv-chk").forEach((chk) => {
          chk.addEventListener("change", calculateQuote);
        });
      }
    }
  }

  function escapeHtml(str) {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Mode switcher buttons
    document.querySelectorAll(".mode-tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".mode-tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentMode = btn.dataset.mode;

        $("standard-mode-section").style.display = currentMode === "standard" ? "block" : "none";
        $("brochure-mode-section").style.display = currentMode === "brochure" ? "block" : "none";
        calculateQuote();
      });
    });

    // Ups cards click
    document.querySelectorAll(".ups-card").forEach((card) => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".ups-card").forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        const upsVal = card.dataset.ups;

        if (upsVal === "custom") {
          $("custom-ups-container").style.display = "block";
          currentUps = Math.max(1, parseInt($("custom-ups-input").value) || 1);
        } else {
          $("custom-ups-container").style.display = "none";
          currentUps = parseInt(upsVal) || 1;
        }
        calculateQuote();
      });
    });

    $("custom-ups-input").addEventListener("input", (e) => {
      currentUps = Math.max(1, parseInt(e.target.value) || 1);
      calculateQuote();
    });

    // All form input changes
    const watchIds = [
      "std-qty", "std-substrate", "std-cutting", "std-other",
      "bro-qty", "bro-pages", "bro-size", "bro-cover-substrate",
      "bro-inner-substrate", "bro-binding", "bro-cutting", "bro-other"
    ];

    watchIds.forEach((id) => {
      const el = $(id);
      if (el) {
        el.addEventListener("input", calculateQuote);
        el.addEventListener("change", calculateQuote);
      }
    });

    if ($("bro-pages")) {
      $("bro-pages").addEventListener("blur", () => {
        const val = $("bro-pages").value.trim();
        if (!val) return;
        let p = parseInt(val) || 4;
        if (p < 4) p = 4;
        if (p % 4 !== 0) p = Math.ceil(p / 4) * 4;
        $("bro-pages").value = p;
        calculateQuote();
      });
    }

    document.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener("change", calculateQuote);
    });

    // WhatsApp Copy Button
    $("btn-copy-quote").addEventListener("click", copyWhatsAppQuote);

    // Reset Form / Clear All Buttons (Header Bar & Sticky Quote Card)
    $("btn-reset-app")?.addEventListener("click", () => resetCalculator(true));
    $("btn-reset-quote")?.addEventListener("click", () => resetCalculator(true));

    // Owner Auth & Toggle & Logout
    $("btn-toggle-owner").addEventListener("click", handleOwnerToggle);
    $("owner-card-header").addEventListener("click", toggleOwnerBreakdownCard);
    $("btn-admin-logout")?.addEventListener("click", logoutAdmin);
    $("btn-modal-logout")?.addEventListener("click", logoutAdmin);

    // PIN Modal Buttons
    $("btn-pin-submit").addEventListener("click", submitPinAuth);
    $("btn-pin-cancel").addEventListener("click", closePinModal);
    $("pin-modal-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitPinAuth();
      if (e.key === "Escape") closePinModal();
    });
    $("pin-modal-overlay").addEventListener("click", (e) => {
      if (e.target === $("pin-modal-overlay")) closePinModal();
    });

    // Layout Toggle (Preset vs Custom Dimension)
    const togglePreset = $("layout-toggle-preset");
    const toggleCustom = $("layout-toggle-custom");
    if (togglePreset && toggleCustom) {
      togglePreset.addEventListener("click", () => {
        togglePreset.classList.add("active");
        toggleCustom.classList.remove("active");
        currentLayoutType = "preset";
        $("preset-cuts-section").style.display = "block";
        $("custom-dimension-section").style.display = "none";
        calculateQuote();
      });

      toggleCustom.addEventListener("click", () => {
        toggleCustom.classList.add("active");
        togglePreset.classList.remove("active");
        currentLayoutType = "custom";
        $("preset-cuts-section").style.display = "none";
        $("custom-dimension-section").style.display = "block";
        calculateQuote();
      });
    }

    // Universal custom dropdowns initialization
    setupAllCustomDropdownEvents();
    renderUniversalCustomDropdown("dim-unit");
    renderUniversalCustomDropdown("bro-size");

    // Custom dimension inputs & plotter calibration
    const dimWatchIds = ["dim-width", "dim-height", "dim-unit", "dim-designs", "dim-diecut", "dim-sensor-margin", "dim-blade-gap"];
    dimWatchIds.forEach((id) => {
      const el = $(id);
      if (el) {
        el.addEventListener("input", calculateQuote);
        el.addEventListener("change", calculateQuote);
      }
    });

    const diecutChk = $("dim-diecut");
    if (diecutChk) {
      diecutChk.addEventListener("change", () => {
        const calibPanel = $("plotter-calibration-panel");
        if (calibPanel) {
          calibPanel.style.display = diecutChk.checked ? "block" : "none";
        }
      });
    }

    // Machine Sheet Switcher Buttons (Auto, 12×18, 13×19, 25×36, 26×38)
    const sheetBtns = [
      { id: "btn-sheet-auto", size: "auto" },
      { id: "btn-sheet-1218", size: "12×18" },
      { id: "btn-sheet-1319", size: "13×19" },
      { id: "btn-sheet-2536", size: "25×36" },
      { id: "btn-sheet-2638", size: "26×38" }
    ];

    sheetBtns.forEach((b) => {
      const el = $(b.id);
      if (el) {
        el.addEventListener("click", () => {
          currentForcedSheetSize = b.size;
          updateSheetToggleButtons();
          calculateQuote();
        });
      }
    });

    const stdSubSelect = $("std-substrate");
    if (stdSubSelect) {
      stdSubSelect.addEventListener("change", () => {
        const sub = substrates.find((s) => s.id === stdSubSelect.value);
        if (sub && sub.size) {
          currentForcedSheetSize = sub.size;
          updateSheetToggleButtons();
        }
        calculateQuote();
      });
    }
  }

  function updateSheetToggleButtons() {
    const sheetBtns = [
      { id: "btn-sheet-auto", size: "auto" },
      { id: "btn-sheet-1218", size: "12×18" },
      { id: "btn-sheet-1319", size: "13×19" },
      { id: "btn-sheet-2536", size: "25×36" },
      { id: "btn-sheet-2638", size: "26×38" }
    ];
    sheetBtns.forEach((b) => {
      const el = $(b.id);
      if (el) {
        if (b.size === currentForcedSheetSize) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }
      }
    });
  }

  // --- 2D IMPOSITION & NESTING ENGINE ---
  function calculate2DNesting(itemW, itemH, unit = "in", isDieCut = false, totalPieces = 500, forcedSheetSize = null) {
    let w = parseFloat(itemW) || 1;
    let h = parseFloat(itemH) || 1;
    if (unit === "mm") {
      w = +(w / 25.4).toFixed(3);
      h = +(h / 25.4).toFixed(3);
    } else if (unit === "cm") {
      w = +(w / 2.54).toFixed(3);
      h = +(h / 2.54).toFixed(3);
    }

    // Outer margin (gripper / plotter registration optical sensor marks)
    // Normal: 0.25" (~6.35mm) gripper margin
    // Die Cut: adjustable optical mark margin from input (default 15mm)
    let marginMm = 6.35;
    let gapMm = 1.0;

    if (isDieCut) {
      const sensorInput = parseFloat($("dim-sensor-margin") ? $("dim-sensor-margin").value : 15);
      const gapInput = parseFloat($("dim-blade-gap") ? $("dim-blade-gap").value : 2.5);
      marginMm = !isNaN(sensorInput) && sensorInput >= 0 ? sensorInput : 15;
      gapMm = !isNaN(gapInput) && gapInput >= 0 ? gapInput : 2.5;
    }

    const margin = +(marginMm / 25.4).toFixed(3);
    const gap = +(gapMm / 25.4).toFixed(3);

    let candidates = [
      { name: "12×18", sheetW: 12, sheetH: 18 },
      { name: "13×19", sheetW: 13, sheetH: 19 }
    ];

    if (forcedSheetSize === "12×18") {
      candidates = [{ name: "12×18", sheetW: 12, sheetH: 18 }];
    } else if (forcedSheetSize === "13×19") {
      candidates = [{ name: "13×19", sheetW: 13, sheetH: 19 }];
    } else if (forcedSheetSize === "25×36") {
      candidates = [{ name: "25×36", sheetW: 25, sheetH: 36 }];
    } else if (forcedSheetSize === "26×38") {
      candidates = [{ name: "26×38", sheetW: 26, sheetH: 38 }];
    } else {
      // Auto mode: evaluate machine sheets, or if oversize (e.g. 23x30), evaluate full mill sheets
      if (w > 13 || h > 19 || (w > 18 && h > 12)) {
        candidates = [
          { name: "25×36", sheetW: 25, sheetH: 36 },
          { name: "26×38", sheetW: 26, sheetH: 38 }
        ];
      }
    }

    let bestOption = null;

    candidates.forEach((cand) => {
      const usableW = Math.max(0, cand.sheetW - 2 * margin);
      const usableH = Math.max(0, cand.sheetH - 2 * margin);

      // Orientation 1: Straight
      const cols1 = Math.floor((usableW + gap) / (w + gap));
      const rows1 = Math.floor((usableH + gap) / (h + gap));
      const yield1 = Math.max(0, cols1 * rows1);

      // Orientation 2: Rotated 90 degrees
      const cols2 = Math.floor((usableW + gap) / (h + gap));
      const rows2 = Math.floor((usableH + gap) / (w + gap));
      const yield2 = Math.max(0, cols2 * rows2);

      let chosenYield = yield1;
      let chosenCols = cols1;
      let chosenRows = rows1;
      let rotated = false;
      let itemRenderW = w;
      let itemRenderH = h;

      if (yield2 > yield1) {
        chosenYield = yield2;
        chosenCols = cols2;
        chosenRows = rows2;
        rotated = true;
        itemRenderW = h;
        itemRenderH = w;
      }

      if (chosenYield > 0) {
        const sheetsNeeded = Math.ceil(totalPieces / chosenYield);
        const itemArea = w * h * chosenYield;
        const sheetArea = cand.sheetW * cand.sheetH;
        const wastePct = Math.max(0, +((1 - itemArea / sheetArea) * 100).toFixed(1));

        if (!bestOption || chosenYield > bestOption.yield || (chosenYield === bestOption.yield && cand.name === "12×18")) {
          bestOption = {
            sheetName: cand.name,
            sheetW: cand.sheetW,
            sheetH: cand.sheetH,
            margin: margin,
            gap: gap,
            itemW: w,
            itemH: h,
            itemRenderW: itemRenderW,
            itemRenderH: itemRenderH,
            cols: chosenCols,
            rows: chosenRows,
            yield: chosenYield,
            rotated: rotated,
            totalPieces: totalPieces,
            sheetsNeeded: sheetsNeeded,
            wastePct: wastePct,
            isDieCut: isDieCut
          };
        }
      }
    });

    if (!bestOption) {
      bestOption = {
        sheetName: forcedSheetSize || "12×18",
        sheetW: forcedSheetSize === "25×36" ? 25 : forcedSheetSize === "26×38" ? 26 : forcedSheetSize === "13×19" ? 13 : 12,
        sheetH: forcedSheetSize === "25×36" ? 36 : forcedSheetSize === "26×38" ? 38 : forcedSheetSize === "13×19" ? 19 : 18,
        margin: margin,
        gap: gap,
        itemW: w,
        itemH: h,
        itemRenderW: w,
        itemRenderH: h,
        cols: 1,
        rows: 1,
        yield: 1,
        rotated: false,
        totalPieces: totalPieces,
        sheetsNeeded: totalPieces,
        wastePct: 50,
        isDieCut: isDieCut
      };
    }

    return bestOption;
  }

  // --- SVG SHEET LAYOUT VISUALIZER ---
  function renderSheetSVG(nesting) {
    const container = $("sheet-svg-wrapper");
    if (!container || !nesting) return;

    const scale = nesting.sheetW > 20 ? 8 : 14;
    const svgW = nesting.sheetW * scale;
    const svgH = nesting.sheetH * scale;

    const marginPx = nesting.margin * scale;
    const gapPx = nesting.gap * scale;
    const itemWPx = nesting.itemRenderW * scale;
    const itemHPx = nesting.itemRenderH * scale;

    let itemsSvg = "";
    const isCircle = nesting.isDieCut && Math.abs(nesting.itemW - nesting.itemH) < 0.1;

    for (let r = 0; r < nesting.rows; r++) {
      for (let c = 0; c < nesting.cols; c++) {
        const x = marginPx + c * (itemWPx + gapPx);
        const y = marginPx + r * (itemHPx + gapPx);

        if (isCircle) {
          const cx = x + itemWPx / 2;
          const cy = y + itemHPx / 2;
          const radius = Math.max(2, Math.min(itemWPx, itemHPx) / 2 - 1);
          itemsSvg += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#e8f0fe" stroke="#1b61c9" stroke-width="1.2" />`;
        } else {
          itemsSvg += `<rect x="${x}" y="${y}" width="${itemWPx}" height="${itemHPx}" rx="${nesting.isDieCut ? 4 : 1}" fill="#e8f0fe" stroke="#1b61c9" stroke-width="1.2" />`;
        }
      }
    }

    let regMarksSvg = "";
    if (nesting.isDieCut) {
      const ms = 8;
      regMarksSvg = `
        <line x1="6" y1="6" x2="6" y2="${6 + ms}" stroke="#181d26" stroke-width="2" />
        <line x1="6" y1="6" x2="${6 + ms}" y2="6" stroke="#181d26" stroke-width="2" />
        <line x1="${svgW - 6}" y1="6" x2="${svgW - 6}" y2="${6 + ms}" stroke="#181d26" stroke-width="2" />
        <line x1="${svgW - 6}" y1="6" x2="${svgW - 6 - ms}" y2="6" stroke="#181d26" stroke-width="2" />
        <line x1="6" y1="${svgH - 6}" x2="6" y2="${svgH - 6 - ms}" stroke="#181d26" stroke-width="2" />
        <line x1="6" y1="${svgH - 6}" x2="${6 + ms}" y2="${svgH - 6}" stroke="#181d26" stroke-width="2" />
        <line x1="${svgW - 6}" y1="${svgH - 6}" x2="${svgW - 6}" y2="${svgH - 6 - ms}" stroke="#181d26" stroke-width="2" />
        <line x1="${svgW - 6}" y1="${svgH - 6}" x2="${svgW - 6 - ms}" y2="${svgH - 6}" stroke="#181d26" stroke-width="2" />
      `;
    }

    const svg = `
      <svg class="sheet-svg-element" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; border:1px solid #9297a0;">
        <rect x="${marginPx}" y="${marginPx}" width="${svgW - 2 * marginPx}" height="${svgH - 2 * marginPx}" fill="none" stroke="#d0d7e6" stroke-dasharray="3,3" stroke-width="1" />
        ${regMarksSvg}
        ${itemsSvg}
      </svg>
    `;

    container.innerHTML = svg;
    $("visualizer-info-badge").innerHTML = `<b>${nesting.sheetName} Sheet</b> (${nesting.cols} × ${nesting.rows} layout${nesting.rotated ? ", Rotated 90°" : ""})`;
    $("visualizer-yield-badge").innerHTML = `<b>${nesting.yield} stickers / sheet</b> (${nesting.wastePct}% blank space)`;
  }

  // --- SUBSTRATE MATCH HELPER ---
  function selectSubstrateByMatch(selectId, keyword) {
    const sel = $(selectId);
    if (!sel) return;
    const lowerKey = keyword.toLowerCase();
    const found = substrates.find((s) => s.name.toLowerCase().includes(lowerKey));
    if (found) {
      sel.value = found.id;
      if (selectId === "std-substrate" && found.size) {
        currentForcedSheetSize = found.size;
        updateSheetToggleButtons();
      }
      renderUniversalCustomDropdown(selectId);
    }
  }

  // --- AI FEEDBACK BANNER HELPER WITH RESET / START OVER ---
  function renderAIFeedbackBanner(contentHtml) {
    const banner = $("ai-feedback-banner");
    if (!banner) return;
    banner.style.display = "block";
    banner.innerHTML = `
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #15803d; margin-bottom: 3px; display: flex; align-items: center; gap: 6px;">
            <span>✨</span><span>AI Specification Configured</span>
          </div>
          <div style="color: #14532d; font-size: 13px; line-height: 1.45;">
            ${contentHtml}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-top: 2px;">
          <button type="button" class="btn-banner-reset-action" style="background: #ffffff; border: 1px solid #86efac; color: #166534; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); transition: all 0.15s ease;" title="Clear search and start over">
            🔄 Start Over
          </button>
          <button type="button" class="btn-banner-close-action" style="background: none; border: none; font-size: 16px; color: #15803d; cursor: pointer; padding: 0 4px; line-height: 1; opacity: 0.75;" title="Dismiss">✕</button>
        </div>
      </div>
    `;
    banner.querySelector(".btn-banner-reset-action")?.addEventListener("click", () => resetCalculator(true));
    banner.querySelector(".btn-banner-close-action")?.addEventListener("click", () => {
      banner.style.display = "none";
    });
  }

  // --- AI NATURAL LANGUAGE / WHATSAPP PARSER ---
  function setupAIParserListeners() {
    const parseBtn = $("btn-ai-parse");
    const promptInput = $("ai-prompt-input");
    const clearBtn = $("btn-ai-clear");

    if (promptInput) {
      promptInput.addEventListener("input", () => {
        if (clearBtn) {
          clearBtn.style.display = promptInput.value.length > 0 ? "inline-flex" : "none";
        }
      });
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          promptInput.value = "";
          clearBtn.style.display = "none";
          const banner = $("ai-feedback-banner");
          if (banner) {
            banner.style.display = "none";
            banner.innerHTML = "";
          }
          promptInput.focus();
        });
      }
    }

    if (parseBtn && promptInput) {
      parseBtn.addEventListener("click", () => parseAIPrompt(promptInput.value));
      promptInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") parseAIPrompt(promptInput.value);
      });
    }

    document.querySelectorAll(".ai-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const text = chip.dataset.example;
        if (promptInput) {
          promptInput.value = text;
          if (clearBtn) clearBtn.style.display = "inline-flex";
        }
        parseAIPrompt(text);
      });
    });
  }

  async function parseAIPrompt(rawText) {
    if (!rawText || !rawText.trim()) return;
    const text = rawText.trim();
    const banner = $("ai-feedback-banner");
    banner.style.display = "block";
    banner.innerHTML = `<span style="display:inline-flex; align-items:center; gap:6px;"><span>✨</span><span>AI configuring specifications...</span></span>`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const spec = await res.json();
        if (spec && (spec.mode || spec.width || spec.pages || spec.qty !== null)) {
          applyParsedData(spec, text);
          return;
        }
      }
    } catch (e) {
      // Offline / Local static server -> smoothly fallback to built-in smart NLP parser
    }

    parseAIPromptOffline(text);
  }

  function applyParsedData(spec, text) {
    const banner = $("ai-feedback-banner");
    const hasExplicitQty = spec.hasExplicitQty || (spec.qty !== null && spec.qty !== undefined && spec.qty > 0);
    const defaultQty = spec.mode === "brochure" ? (parseInt($("bro-qty").value) || 100) : (parseInt($("std-qty").value) || 500);
    const qty = hasExplicitQty ? spec.qty : defaultQty;

    if (spec.mode === "brochure") {
      document.querySelector('.mode-tab-btn[data-mode="brochure"]').click();
      $("bro-qty").value = qty;

      let pages = spec.pages || (text.match(/(\d+)\s*(?:pages?|pgs?|pg|pp)/i) ? parseInt(text.match(/(\d+)\s*(?:pages?|pgs?|pg|pp)/i)[1]) : 16);
      if (/single\s*fold/i.test(text) && (!spec.pages || spec.pages <= 4)) {
        pages = 4;
      }
      $("bro-pages").value = pages;

      // 1. Booklet Size
      let bookSizeName = "A4 Booklet";
      if (spec.is2Fold || spec.preset === "a4_2fold" || /2\s*fold|two\s*fold|tri\s*fold|3\s*fold/i.test(text)) {
        $("bro-size").value = "a4_2fold";
        bookSizeName = "A4 2-Fold Brochure (Uses 26×38 Paper)";
      } else if (spec.preset === "a5" || /a5/i.test(text)) {
        $("bro-size").value = "a5";
        bookSizeName = "A5 Booklet";
      } else {
        $("bro-size").value = "a4";
        bookSizeName = "A4 Booklet";
      }
      renderUniversalCustomDropdown("bro-size");

      // 2. Binding Method
      let bindingName = "Saddle Stitch";
      if (spec.binding === "none" || /single\s*fold|loose\s*fold|no\s*binding|fold\s*only/i.test(text)) {
        $("bro-binding").value = "none";
        bindingName = "No Binding (Single Fold)";
      } else if (spec.binding === "perfect" || /perfect/i.test(text)) {
        $("bro-binding").value = "perfect";
        bindingName = "Perfect Binding";
      } else if (spec.binding === "wiro" || /wiro|spiral/i.test(text)) {
        $("bro-binding").value = "wiro";
        bindingName = "Wiro / Spiral Binding";
      } else {
        $("bro-binding").value = "saddle";
        bindingName = "Saddle Stitch (Center Pin)";
      }
      renderUniversalCustomDropdown("bro-binding");

      // 3. Cover Lamination
      let lamName = "Single Lamination (Outer)";
      if (spec.lamination === "d" || /both\s*side|both\s*sides|double\s*lam|b\/s/i.test(text)) {
        document.getElementById("bro-cl-d").checked = true;
        lamName = "Both Sides Lamination (Double)";
      } else if (spec.lamination === "n" || /no\s*lam|without\s*lam/i.test(text)) {
        document.getElementById("bro-cl-n").checked = true;
        lamName = "No Lamination";
      } else {
        document.getElementById("bro-cl-s").checked = true;
        lamName = "Single Lamination (Outer)";
      }

      // 4. Cover Printing (Double sided F/B vs Single Sided)
      if (spec.printSides === "s" || /single\s*side\s*print|outer\s*only/i.test(text)) {
        document.getElementById("bro-cp-s").checked = true;
      } else {
        document.getElementById("bro-cp-d").checked = true; // Default F/B
      }

      // 5. Paper Match
      if (spec.substrateMatch) {
        selectSubstrateByMatch("bro-cover-substrate", spec.substrateMatch);
      } else if (/250\s*gsm/i.test(text)) {
        selectSubstrateByMatch("bro-cover-substrate", "250 GSM");
      } else if (/350\s*gsm/i.test(text)) {
        selectSubstrateByMatch("bro-cover-substrate", "350 GSM");
      } else if (/170\s*gsm/i.test(text)) {
        selectSubstrateByMatch("bro-cover-substrate", "170 GSM");
      }

      calculateQuote();

      renderAIFeedbackBanner(`
        Detected: <b>${pages}-Page ${bookSizeName}</b> · <b>${bindingName}</b> · <b>${lamName}</b> · <b>Double Sided Print (F/B)</b><br>
        Quantity: <b>${qty} ${qty === 1 ? "book" : "books"}</b>${!hasExplicitQty ? ` <span style="color: #64748b; font-size: 11.5px;">(Standard default · specify in prompt if different, e.g. "500 books")</span>` : ""}
        ${pages % 4 !== 0 ? `<br><span style="color: #b45309; font-weight: 500;">⚠️ Auto-adjusted ${pages} pages to <b>${Math.ceil(pages / 4) * 4} pages</b> (multiples of 4 required for binding).</span>` : ""}
      `);
      return;
    }

    // Standard mode
    document.querySelector('.mode-tab-btn[data-mode="standard"]').click();
    $("std-qty").value = qty;
    if (spec.substrateMatch) {
      selectSubstrateByMatch("std-substrate", spec.substrateMatch);
    } else if (/certificates?/i.test(text)) {
      selectSubstrateByMatch("std-substrate", "300 GSM");
    }

    if (spec.width > 0 && spec.height > 0) {
      document.getElementById("layout-toggle-custom").click();
      $("dim-width").value = spec.width;
      $("dim-height").value = spec.height;
      $("dim-diecut").checked = !!spec.isDieCut;
      $("dim-designs").value = 1;
      calculateQuote();

      const nesting = currentCustomNesting;
      const totalSheets = nesting ? nesting.sheetsNeeded : Math.ceil(qty / currentUps);
      const yieldPerSheet = nesting ? nesting.yield : currentUps;

      renderAIFeedbackBanner(`
        <b>Size:</b> ${spec.width}" × ${spec.height}" (${spec.isDieCut ? "Plotter Die Cut with 15mm sensor margins" : "Straight Cut"}) · <b>Quantity:</b> ${qty} pcs<br>
        <b>Imposition:</b> <b>${yieldPerSheet} stickers / sheet</b> on ${nesting ? nesting.sheetName : "12×18"} → <b>${totalSheets} parent sheets</b> needed.
      `);
    } else if (spec.preset === "a4" || /a4/i.test(text)) {
      document.getElementById("layout-toggle-preset").click();
      document.querySelector('.ups-card[data-ups="2"]').click();
      calculateQuote();
      const mediaName = substrates.find((s) => s.id === $("std-substrate").value)?.name || "Art Card";
      const sheetsNeeded = Math.ceil(qty / 2);
      renderAIFeedbackBanner(`
        <b>Preset:</b> A4 Size (Half Sheet / 2 ups) · <b>Quantity:</b> ${qty} pcs · <b>Sheet Consumption:</b> <b>${sheetsNeeded} Machine Sheets (12×18)</b> [${qty} pcs ÷ 2 per sheet] · <b>Media:</b> ${escapeHtml(mediaName)}
      `);
    } else if (spec.preset === "a5" || /a5/i.test(text)) {
      document.getElementById("layout-toggle-preset").click();
      document.querySelector('.ups-card[data-ups="4"]').click();
      calculateQuote();
      const mediaName = substrates.find((s) => s.id === $("std-substrate").value)?.name || "Art Paper";
      const sheetsNeeded = Math.ceil(qty / 4);
      renderAIFeedbackBanner(`
        <b>Preset:</b> A5 Size (Quarter Sheet / 4 ups) · <b>Quantity:</b> ${qty} pcs · <b>Sheet Consumption:</b> <b>${sheetsNeeded} Machine Sheets (12×18)</b> [${qty} pcs ÷ 4 per sheet] · <b>Media:</b> ${escapeHtml(mediaName)}
      `);
    } else if (spec.preset === "a6" || /a6/i.test(text)) {
      document.getElementById("layout-toggle-preset").click();
      document.querySelector('.ups-card[data-ups="8"]').click();
      calculateQuote();
      const mediaName = substrates.find((s) => s.id === $("std-substrate").value)?.name || "Art Paper";
      const sheetsNeeded = Math.ceil(qty / 8);
      renderAIFeedbackBanner(`
        <b>Preset:</b> A6 Size (1/8th Sheet / 8 ups) · <b>Quantity:</b> ${qty} pcs · <b>Sheet Consumption:</b> <b>${sheetsNeeded} Machine Sheets (12×18)</b> [${qty} pcs ÷ 8 per sheet] · <b>Media:</b> ${escapeHtml(mediaName)}
      `);
    } else if (spec.preset === "a7" || /a7/i.test(text)) {
      document.getElementById("layout-toggle-preset").click();
      document.querySelector('.ups-card[data-ups="16"]').click();
      calculateQuote();
      const mediaName = substrates.find((s) => s.id === $("std-substrate").value)?.name || "Art Paper";
      const sheetsNeeded = Math.ceil(qty / 16);
      renderAIFeedbackBanner(`
        <b>Preset:</b> A7 Size (1/16th Sheet / 16 ups) · <b>Quantity:</b> ${qty} pcs · <b>Sheet Consumption:</b> <b>${sheetsNeeded} Machine Sheets (12×18)</b> [${qty} pcs ÷ 16 per sheet] · <b>Media:</b> ${escapeHtml(mediaName)}
      `);
    } else if (spec.preset === "a3" || /a3/i.test(text)) {
      document.getElementById("layout-toggle-preset").click();
      document.querySelector('.ups-card[data-ups="1"]').click();
      calculateQuote();
      renderAIFeedbackBanner(`
        <b>Preset:</b> A3 / Full Sheet (1 up) · <b>Quantity:</b> ${qty} pcs · <b>Sheet Consumption:</b> <b>${qty} Machine Sheets (12×18)</b>
      `);
    } else {
      calculateQuote();
      renderAIFeedbackBanner(`
        Updated specifications for <b>${qty} pieces</b>.
      `);
    }
  }

  function parseAIPromptOffline(rawText) {
    if (!rawText || !rawText.trim()) return;
    const text = rawText.trim();
    const banner = $("ai-feedback-banner");
    banner.style.display = "block";

    // 1. Extract Explicit Quantity (ignoring page counts, GSM, dimensions)
    let qty = null;
    let hasExplicitQty = false;

    const explicitQtyMatch = text.match(/(?:qty\.?|quantity:?)\s*(\d+)/i) ||
                             text.match(/(\d+)\s*(?:pcs?|pieces?|qty|nug|sheets?|certificates?|cards?|flyers?|prints?|copies?|nos?|count|books?|booklets?)/i) ||
                             text.match(/(?:each\s*)(\d+)/i);

    if (explicitQtyMatch) {
      qty = parseInt(explicitQtyMatch[1]);
      hasExplicitQty = true;
    } else {
      // Find standalone number ONLY if it is NOT part of a page count, GSM, dimension, or fold!
      const cleaned = text.replace(/(\d+(?:\.\d+)?)\s*(?:pages?|pgs?|pg|pp|gsm|g\/m2|fold|folds|folding|sides?|in|inch|inches|\"|''|mm|cm|col|designs?)/gi, "");
      const standalone = cleaned.match(/\b(\d+)\b/);
      if (standalone) {
        const num = parseInt(standalone[1]);
        if (num > 0 && num < 100000 && num !== 130 && num !== 170 && num !== 250 && num !== 300 && num !== 350) {
          qty = num;
          hasExplicitQty = true;
        }
      }
    }

    // 2. Extract Dimensions (e.g. 2.25" x 6.6", 10.5 x 2.7, 1.5x1.5)
    const dimMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\"|''|in|inch|inches)?\s*(?:x|\*|by|×)\s*(\d+(?:\.\d+)?)\s*(?:\"|''|in|inch|inches)?/i);

    // 3. Check if Brochure / Catalogue / Booklet / Single Fold
    const isBrochure = /catalogue|catalog|brochure|booklet|pages|\.pdf|single\s*fold/i.test(text);
    const is2Fold = /2\s*fold|two\s*fold|tri\s*fold|3\s*fold/i.test(text);
    const pageMatch = text.match(/(\d+)\s*(?:pages?|pgs?|pg|pp)/i);

    if (isBrochure) {
      document.querySelector('.mode-tab-btn[data-mode="brochure"]').click();
      const defaultQty = parseInt($("bro-qty").value) || 100;
      qty = hasExplicitQty ? qty : defaultQty;
      $("bro-qty").value = qty;

      let pages = 16;
      if (pageMatch) {
        pages = parseInt(pageMatch[1]);
      } else if (/single\s*fold/i.test(text)) {
        pages = 4; // A single fold sheet makes 4 pages
      }
      $("bro-pages").value = pages;

      // 1. Booklet Size
      let bookSize = "a4";
      let bookSizeName = "A4 Booklet";
      if (is2Fold) {
        bookSize = "a4_2fold";
        bookSizeName = "A4 2-Fold Brochure (Uses 26×38 Paper)";
      } else if (/a5/i.test(text)) {
        bookSize = "a5";
        bookSizeName = "A5 Booklet";
      } else if (/a4/i.test(text)) {
        bookSize = "a4";
        bookSizeName = "A4 Booklet";
      }
      $("bro-size").value = bookSize;
      renderUniversalCustomDropdown("bro-size");

      // 2. Binding Method
      let bindingName = "Saddle Stitch";
      if (/single\s*fold|loose\s*fold|no\s*binding|fold\s*only/i.test(text)) {
        $("bro-binding").value = "none";
        bindingName = "No Binding (Single Fold)";
      } else if (/perfect/i.test(text)) {
        $("bro-binding").value = "perfect";
        bindingName = "Perfect Binding";
      } else if (/wiro|spiral/i.test(text)) {
        $("bro-binding").value = "wiro";
        bindingName = "Wiro / Spiral Binding";
      } else {
        $("bro-binding").value = "saddle";
        bindingName = "Saddle Stitch (Center Pin)";
      }
      renderUniversalCustomDropdown("bro-binding");

      // 3. Cover Lamination
      let lamName = "Single Lamination (Outer)";
      if (/both\s*side|both\s*sides|double\s*lam|b\/s/i.test(text)) {
        document.getElementById("bro-cl-d").checked = true;
        lamName = "Both Sides Lamination (Double)";
      } else if (/no\s*lam|without\s*lam/i.test(text)) {
        document.getElementById("bro-cl-n").checked = true;
        lamName = "No Lamination";
      } else {
        document.getElementById("bro-cl-s").checked = true;
        lamName = "Single Lamination (Outer)";
      }

      // 4. Cover Printing (Double sided F/B vs Single Sided)
      if (/single\s*side\s*print|outer\s*only/i.test(text)) {
        document.getElementById("bro-cp-s").checked = true;
      } else {
        document.getElementById("bro-cp-d").checked = true; // F/B
      }

      // 5. Paper Match
      if (/250\s*gsm/i.test(text)) {
        selectSubstrateByMatch("bro-cover-substrate", "250 GSM");
      } else if (/350\s*gsm/i.test(text)) {
        selectSubstrateByMatch("bro-cover-substrate", "350 GSM");
      } else if (/300\s*gsm/i.test(text)) {
        selectSubstrateByMatch("bro-cover-substrate", "300 GSM");
      } else if (/170\s*gsm/i.test(text)) {
        selectSubstrateByMatch("bro-cover-substrate", "170 GSM");
      }

      calculateQuote();

      renderAIFeedbackBanner(`
        Detected: <b>${pages}-Page ${bookSizeName}</b> · <b>${bindingName}</b> · <b>${lamName}</b> · <b>Double Sided Print (F/B)</b><br>
        Quantity: <b>${qty} ${qty === 1 ? "book" : "books"}</b>${!hasExplicitQty ? ` <span style="color: #64748b; font-size: 11.5px;">(Standard default · specify in prompt if different, e.g. "500 books")</span>` : ""}
        ${pages % 4 !== 0 ? `<br><span style="color: #b45309; font-weight: 500;">⚠️ Auto-adjusted ${pages} pages to <b>${Math.ceil(pages / 4) * 4} pages</b> (multiples of 4 required for binding).</span>` : ""}
      `);
      return;
    }

    const defaultStdQty = parseInt($("std-qty").value) || 500;
    qty = hasExplicitQty ? qty : defaultStdQty;
    $("std-qty").value = qty;

    // Single Sheet / Sticker / Card Mode
    document.querySelector('.mode-tab-btn[data-mode="standard"]').click();
    $("std-qty").value = qty;

    const isDieCut = /die\s*cut|diecutting|die-cutting|kiss\s*cut|round|circle/i.test(text);
    const isClearVinyl = /transparent|clear\s*vinyl/i.test(text);
    const isGoldenVinyl = /golden\s*vinyl|gold\s*vinyl/i.test(text);
    const isNormalVinyl = /vinyl\s*sticker|vinyl/i.test(text);
    const isGumming = /gumming/i.test(text);
    const isTexture = /texture/i.test(text);

    if (isClearVinyl) {
      selectSubstrateByMatch("std-substrate", "Clear Vinyl");
    } else if (isGoldenVinyl) {
      selectSubstrateByMatch("std-substrate", "Golden Vinyl");
    } else if (isNormalVinyl) {
      selectSubstrateByMatch("std-substrate", "White Vinyl");
    } else if (/ad\s*gumming/i.test(text)) {
      selectSubstrateByMatch("std-substrate", "AD Gumming");
    } else if (isGumming) {
      selectSubstrateByMatch("std-substrate", "Normal Gumming");
    } else if (isTexture) {
      selectSubstrateByMatch("std-substrate", "Texture");
    } else if (/sbs/i.test(text)) {
      selectSubstrateByMatch("std-substrate", "SBS");
    } else if (/certificates?/i.test(text)) {
      selectSubstrateByMatch("std-substrate", "300 GSM");
    }

    if (dimMatch) {
      document.getElementById("layout-toggle-custom").click();
      const w = parseFloat(dimMatch[1]);
      const h = parseFloat(dimMatch[2]);
      $("dim-width").value = w;
      $("dim-height").value = h;
      $("dim-diecut").checked = isDieCut;

      const desMatch = text.match(/(\d+)\s*designs?/i);
      if (desMatch) {
        $("dim-designs").value = parseInt(desMatch[1]);
      } else {
        $("dim-designs").value = 1;
      }

      calculateQuote();

      const nesting = currentCustomNesting;
      const totalSheets = nesting ? nesting.sheetsNeeded : Math.ceil(qty / currentUps);
      const yieldPerSheet = nesting ? nesting.yield : currentUps;

      renderAIFeedbackBanner(`
        <b>Size:</b> ${w}" × ${h}" (${isDieCut ? "Plotter Die Cut with 15mm sensor margins" : "Straight Cut"}) · <b>Quantity:</b> ${qty} pcs<br>
        <b>Imposition:</b> <b>${yieldPerSheet} stickers / sheet</b> on ${nesting ? nesting.sheetName : "12×18"} → <b>${totalSheets} parent sheets</b> needed.
      `);
    } else if (/a4/i.test(text)) {
      document.getElementById("layout-toggle-preset").click();
      document.querySelector('.ups-card[data-ups="2"]').click();
      calculateQuote();
      const sheetsNeeded = Math.ceil(qty / 2);
      renderAIFeedbackBanner(`
        <b>Preset:</b> A4 Size (Half Sheet / 2 ups) · <b>Quantity:</b> ${qty} pcs · <b>Sheet Consumption:</b> <b>${sheetsNeeded} Machine Sheets (12×18)</b> [${qty} pcs ÷ 2 per sheet]
      `);
    } else if (/a5/i.test(text)) {
      document.getElementById("layout-toggle-preset").click();
      document.querySelector('.ups-card[data-ups="4"]').click();
      calculateQuote();
      const sheetsNeeded = Math.ceil(qty / 4);
      renderAIFeedbackBanner(`
        <b>Preset:</b> A5 Size (Quarter Sheet / 4 ups) · <b>Quantity:</b> ${qty} pcs · <b>Sheet Consumption:</b> <b>${sheetsNeeded} Machine Sheets (12×18)</b> [${qty} pcs ÷ 4 per sheet]
      `);
    } else if (/a6/i.test(text)) {
      document.getElementById("layout-toggle-preset").click();
      document.querySelector('.ups-card[data-ups="8"]').click();
      calculateQuote();
      const sheetsNeeded = Math.ceil(qty / 8);
      renderAIFeedbackBanner(`
        <b>Preset:</b> A6 Size (1/8th Sheet / 8 ups) · <b>Quantity:</b> ${qty} pcs · <b>Sheet Consumption:</b> <b>${sheetsNeeded} Machine Sheets (12×18)</b> [${qty} pcs ÷ 8 per sheet]
      `);
    } else if (/a7/i.test(text)) {
      document.getElementById("layout-toggle-preset").click();
      document.querySelector('.ups-card[data-ups="16"]').click();
      calculateQuote();
      const sheetsNeeded = Math.ceil(qty / 16);
      renderAIFeedbackBanner(`
        <b>Preset:</b> A7 Size (1/16th Sheet / 16 ups) · <b>Quantity:</b> ${qty} pcs · <b>Sheet Consumption:</b> <b>${sheetsNeeded} Machine Sheets (12×18)</b> [${qty} pcs ÷ 16 per sheet]
      `);
    } else if (/a3/i.test(text)) {
      document.getElementById("layout-toggle-preset").click();
      document.querySelector('.ups-card[data-ups="1"]').click();
      calculateQuote();
      renderAIFeedbackBanner(`
        <b>Preset:</b> A3 / Full Sheet (1 up) · <b>Quantity:</b> ${qty} pcs · <b>Sheet Consumption:</b> <b>${qty} Machine Sheets (12×18)</b>
      `);
    } else {
      calculateQuote();
      renderAIFeedbackBanner(`
        Updated specifications for <b>${qty} pieces</b>.
      `);
    }
  }

  // --- CORE CALCULATION ENGINE ---
  function calculateQuote() {
    if (currentMode === "standard") {
      calculateStandardQuote();
    } else {
      calculateBrochureQuote();
    }
  }

  // 1. STANDARD SHEET / FLYER / STICKER CALCULATION
  function calculateStandardQuote() {
    const qtyVal = $("std-qty").value.trim();
    if (!qtyVal || parseInt(qtyVal) <= 0) {
      renderBlankQuote("Enter quantity (finished pieces) to calculate instant quotation");
      return;
    }
    const qty = parseInt(qtyVal);
    const subId = $("std-substrate").value;
    const substrate = substrates.find((s) => s.id === subId) || substrates[0];

    const printSide = getRadioValue("std-print"); // 's' | 'd'
    const lamChoice = getRadioValue("std-lam"); // 'n' | 's' | 'd'

    let parentSheets = 0;
    let cutsDesc = "";
    let isDieCutActive = false;
    let dieCutCharge = 0;

    if (currentLayoutType === "custom") {
      const wVal = $("dim-width").value.trim();
      const hVal = $("dim-height").value.trim();
      if (!wVal || !hVal || parseFloat(wVal) <= 0 || parseFloat(hVal) <= 0) {
        const svgContainer = $("sheet-svg-wrapper");
        if (svgContainer) {
          svgContainer.innerHTML = `<div style="padding: 28px; text-align: center; color: var(--color-muted); font-size: 13px;">Enter sticker dimensions (Width × Height) to render sheet imposition</div>`;
        }
        const infoBadge = $("visualizer-info-badge");
        if (infoBadge) infoBadge.innerHTML = `<b>Awaiting Dimensions</b>`;
        const yieldBadge = $("visualizer-yield-badge");
        if (yieldBadge) yieldBadge.innerHTML = `— stickers / sheet`;
        renderBlankQuote("Enter sticker width and height to calculate 2D imposition");
        return;
      }
      const w = parseFloat(wVal);
      const h = parseFloat(hVal);
      const unit = $("dim-unit").value || "in";
      const designs = Math.max(1, parseInt($("dim-designs").value) || 1);
      isDieCutActive = $("dim-diecut").checked;

      const totalItems = qty * designs;
      const targetSheetSize = currentForcedSheetSize === "auto" ? (substrate ? substrate.size : undefined) : currentForcedSheetSize;
      const nesting = calculate2DNesting(w, h, unit, isDieCutActive, totalItems, targetSheetSize);
      currentCustomNesting = nesting;

      parentSheets = nesting.sheetsNeeded;
      currentUps = nesting.yield;
      cutsDesc = `${w}" × ${h}" (${nesting.yield} pcs/sheet on ${nesting.sheetName}${nesting.rotated ? ", Rotated 90°" : ""})`;

      renderSheetSVG(nesting);

      if (isDieCutActive) {
        dieCutCharge = Math.max(50, parentSheets * 0.50);
      }
    } else {
      let ups = currentUps;
      const customUpsCard = document.querySelector('.ups-card[data-ups="custom"]');
      if (customUpsCard && customUpsCard.classList.contains("active")) {
        const customUpsVal = $("custom-ups-input").value.trim();
        if (!customUpsVal || parseInt(customUpsVal) <= 0) {
          renderBlankQuote("Enter custom number of pieces per sheet (Ups)");
          return;
        }
        ups = parseInt(customUpsVal);
      }
      parentSheets = Math.ceil(qty / ups);
      cutsDesc = ups === 1 ? "Full Sheet (1 pc)" : `${ups} pieces per sheet`;
    }

    // Determine Applicable Slab
    const slab = getApplicableSlab(parentSheets);
    const printRateAdjust = settings.useSlabs ? slab.printAdjust : 0;
    const marginRateAdjust = settings.useSlabs ? slab.marginAdjust : 0;

    // Unit Paper Cost
    const paperCostPerSheet = substrate.sheetCost;

    // Unit Print Cost
    const basePrintRate = printSide === "d" ? substrate.printDouble : substrate.printSingle;
    const effectivePrintRate = Math.max(0, basePrintRate + printRateAdjust);

    // Unit Lamination Cost
    let lamRate = 0;
    if (lamChoice === "s") lamRate = settings.lamSingle;
    else if (lamChoice === "d") lamRate = settings.lamDouble;

    // Raw Cost per Parent Sheet
    const rawPerParentSheet = paperCostPerSheet + effectivePrintRate + lamRate;

    // Total Base Raw Material & Run Cost
    const totalBaseCost = rawPerParentSheet * parentSheets;

    // Wastage
    const wastageAmount = (totalBaseCost * settings.wastagePercent) / 100;

    // Post-press extras
    const cutInput = parseFloat($("std-cutting").value) || 0;
    const cutType = getRadioValue("std-cut-type");
    const totalCutting = cutType === "p" ? cutInput * qty : cutInput;

    const othInput = parseFloat($("std-other").value) || 0;
    const othType = getRadioValue("std-oth-type");
    const totalOther = othType === "p" ? othInput * qty : othInput;

    // Additional Post-press custom finishing services from Admin
    let totalCustomServices = 0;
    const activeCustomServices = [];
    document.querySelectorAll(".std-custom-srv-chk:checked").forEach((chk) => {
      const srvId = chk.dataset.id;
      const srv = (settings.customServices || []).find((s) => s.id === srvId);
      if (srv) {
        const cost = srv.unit === "sheet" ? srv.rate * parentSheets : srv.rate * qty;
        totalCustomServices += cost;
        activeCustomServices.push({ name: srv.name, cost: cost, rate: srv.rate, unit: srv.unit });
      }
    });

    // Subtotal Production Cost
    const totalProductionCost = totalBaseCost + wastageAmount + totalCutting + totalOther + dieCutCharge + totalCustomServices + settings.fixedOther;

    // Margin
    const effectiveMarginPct = Math.max(5, settings.marginPercent + marginRateAdjust);
    const marginAmount = (totalProductionCost * effectiveMarginPct) / 100;

    // Selling Price Pre-GST
    let preGstTotal = totalProductionCost + marginAmount;

    // Enforce Minimum Order Charge if enabled
    if (settings.minOrderCharge && preGstTotal < settings.minOrderCharge) {
      preGstTotal = settings.minOrderCharge;
    }

    const gstAmount = (preGstTotal * settings.gstPercent) / 100;
    const finalTotal = preGstTotal + gstAmount;

    const preGstPerPiece = preGstTotal / qty;
    const finalPerPiece = finalTotal / qty;

    // Update Live Machine Sheet Consumption Callout
    const consumptionEl = $("sheet-consumption-callout");
    if (consumptionEl) {
      const presetNames = {
        1: "Full Sheet (A3)",
        2: "Half Sheet (A4)",
        4: "Quarter Sheet (A5)",
        8: "1/8th Sheet (A6)",
        16: "1/16th Sheet (A7)"
      };

      const presetLabel = presetNames[currentUps] || `${currentUps} ups`;
      const isCustom = currentLayoutType === "custom";
      const effectiveSheetSize = isCustom && currentCustomNesting ? currentCustomNesting.sheetName : substrate.size;

      if (isCustom) {
        $("consumption-headline").innerHTML = `Machine Sheet Consumption: <b>${parentSheets} Sheets (${effectiveSheetSize})</b>`;
        const exactYield = parentSheets * currentUps;
        const extraYield = exactYield - qty;
        $("consumption-subtext").innerHTML = `${qty} finished pieces ÷ ${currentUps} stickers/sheet = <b>${parentSheets} machine sheets (${effectiveSheetSize})</b>${extraYield > 0 ? ` · Yields ${exactYield} total (${extraYield} extra stickers)` : ""}`;
        $("consumption-tag").textContent = `${currentUps} stickers / sheet`;
      } else {
        $("consumption-headline").innerHTML = `Machine Sheet Consumption: <b>${parentSheets} Sheets (${effectiveSheetSize})</b>`;
        const exactYield = parentSheets * currentUps;
        const extraYield = exactYield - qty;
        const divCalc = (qty / currentUps).toFixed(currentUps === 1 ? 0 : 2);
        $("consumption-subtext").innerHTML = `${qty} finished pieces ÷ ${currentUps} pcs/sheet (${presetLabel}) = ${divCalc} → <b>${parentSheets} machine sheets (${effectiveSheetSize})</b>${extraYield > 0 ? ` · Yields ${exactYield} finished pcs (${extraYield} extra)` : ""}`;
        $("consumption-tag").textContent = `${currentUps} pcs / sheet`;
      }
    }

    // Save calculation object
    lastCalculatedQuote = {
      mode: "Standard / Sheet Item",
      productName: substrate.name,
      qty: qty,
      parentSheets: parentSheets,
      ups: currentUps,
      cutsDesc: cutsDesc,
      isDieCut: isDieCutActive,
      printType: printSide === "d" ? "Double Sided Print" : "Single Sided Print",
      lamType: lamChoice === "n" ? "No Lamination" : lamChoice === "s" ? "Single Sided Lamination" : "Double Sided Lamination",
      slabName: settings.useSlabs ? slab.name : "Flat Pricing",
      effectiveMarginPct: effectiveMarginPct,
      costs: {
        paperCost: paperCostPerSheet * parentSheets,
        printCost: effectivePrintRate * parentSheets,
        lamCost: lamRate * parentSheets,
        cuttingCost: totalCutting + dieCutCharge,
        otherCost: totalOther + settings.fixedOther,
        customServicesCost: totalCustomServices,
        activeCustomServices: activeCustomServices,
        wastageCost: wastageAmount,
        totalRawCost: totalProductionCost,
        marginAmount: marginAmount,
        preGstTotal: preGstTotal,
        gstAmount: gstAmount,
        finalTotal: finalTotal,
        finalPerPiece: finalPerPiece,
        preGstPerPiece: preGstPerPiece
      },
      breakdownDetails: {
        paperCostPerSheet: paperCostPerSheet,
        parentSheets: parentSheets,
        paperTotal: paperCostPerSheet * parentSheets,
        basePrintRate: basePrintRate,
        printRateAdjust: printRateAdjust,
        effectivePrintRate: effectivePrintRate,
        printTotal: effectivePrintRate * parentSheets,
        slabName: slab.name,
        rawBaseCost: totalBaseCost,
        wastagePercent: settings.wastagePercent,
        wastageAmount: wastageAmount,
        baseMarginPct: settings.marginPercent,
        marginRateAdjust: marginRateAdjust,
        effectiveMarginPct: effectiveMarginPct,
        marginAmount: marginAmount,
        subtotalPreGst: preGstTotal,
        gstPercent: settings.gstPercent,
        gstAmount: gstAmount,
        finalTotal: finalTotal,
        sheetSize: effectiveSheetSize
      }
    };

    renderQuoteDisplay(lastCalculatedQuote);
  }

  // 2. MULTI-PAGE BROCHURE / BOOKLET CALCULATION
  function calculateBrochureQuote() {
    const qtyVal = $("bro-qty").value.trim();
    const pagesVal = $("bro-pages").value.trim();

    if (!qtyVal || parseInt(qtyVal) <= 0 || !pagesVal || parseInt(pagesVal) <= 0) {
      renderBlankQuote("Enter booklet quantity & total pages to calculate quotation");
      return;
    }

    const qty = parseInt(qtyVal);
    const rawPages = parseInt(pagesVal);
    const totalPages = Math.max(4, rawPages);
    const effectivePages = totalPages % 4 === 0 ? totalPages : Math.ceil(totalPages / 4) * 4;

    const bookSize = $("bro-size").value; // 'a4' | 'a5' | 'a4_2fold'
    let pagesPerSheet = 4;
    const is2Fold = (bookSize === "a4_2fold");

    if (bookSize === "a5") {
      pagesPerSheet = 8;
    } else if (is2Fold) {
      pagesPerSheet = 2; // 2 brochures per 26x38 parent sheet
    }

    // Cover Substrate & Options
    const covSubId = $("bro-cover-substrate").value;
    const covSubstrate = substrates.find((s) => s.id === covSubId) || substrates[0];
    const covPrint = getRadioValue("bro-cov-print");
    const covLam = getRadioValue("bro-cov-lam");

    // Inner Substrate & Options
    const inSubId = $("bro-inner-substrate").value;
    const inSubstrate = substrates.find((s) => s.id === inSubId) || substrates[0];
    const inPrint = getRadioValue("bro-in-print");

    // Binding selection from dynamic settings
    const bindingChoice = $("bro-binding").value;
    const foundBinding = (settings.bindingMethods || []).find((b) => b.id === bindingChoice);
    const bindingRatePerBook = foundBinding ? foundBinding.rate : 0;
    const bindingName = foundBinding ? foundBinding.name : "None";

    // Calculations:
    let coverSheetsPerBook = 0;
    let innerPages = 0;
    let innerSheetsPerBook = 0;
    let totalCoverParentSheets = 0;
    let totalInnerParentSheets = 0;
    let grandTotalParentSheets = 0;

    if (is2Fold) {
      coverSheetsPerBook = 0.5; // 2 brochures per parent sheet
      totalCoverParentSheets = Math.ceil(qty / 2);
      totalInnerParentSheets = 0;
      grandTotalParentSheets = totalCoverParentSheets;
    } else {
      coverSheetsPerBook = 4 / pagesPerSheet;
      innerPages = Math.max(0, effectivePages - 4);
      innerSheetsPerBook = innerPages / pagesPerSheet;
      totalCoverParentSheets = Math.ceil(coverSheetsPerBook * qty);
      totalInnerParentSheets = Math.ceil(innerSheetsPerBook * qty);
      grandTotalParentSheets = totalCoverParentSheets + totalInnerParentSheets;
    }

    // Slab lookup
    const slab = getApplicableSlab(grandTotalParentSheets);
    const printRateAdjust = settings.useSlabs ? slab.printAdjust : 0;
    const marginRateAdjust = settings.useSlabs ? slab.marginAdjust : 0;

    // Cover Costs
    const covPaperTotal = covSubstrate.sheetCost * totalCoverParentSheets;
    const covBasePrint = covPrint === "d" ? covSubstrate.printDouble : covSubstrate.printSingle;
    const covPrintTotal = Math.max(0, covBasePrint + printRateAdjust) * totalCoverParentSheets;
    let covLamRate = 0;
    if (covLam === "s") covLamRate = settings.lamSingle;
    else if (covLam === "d") covLamRate = settings.lamDouble;
    const covLamTotal = covLamRate * totalCoverParentSheets;

    // Inner Costs
    const inPaperTotal = inSubstrate.sheetCost * totalInnerParentSheets;
    const inBasePrint = inPrint === "d" ? inSubstrate.printDouble : inSubstrate.printSingle;
    const inPrintTotal = Math.max(0, inBasePrint + printRateAdjust) * totalInnerParentSheets;

    // Binding & Post-press
    const totalBindingCost = bindingRatePerBook * qty;

    const cutInput = parseFloat($("bro-cutting").value) || 0;
    const cutType = getRadioValue("bro-cut-type");
    const totalCutting = cutType === "p" ? cutInput * qty : cutInput;

    const othInput = parseFloat($("bro-other").value) || 0;
    const othType = getRadioValue("bro-oth-type");
    const totalOther = othType === "p" ? othInput * qty : othInput;

    // Additional Post-press custom finishing services from Admin
    let totalCustomServices = 0;
    const activeCustomServices = [];
    document.querySelectorAll(".bro-custom-srv-chk:checked").forEach((chk) => {
      const srvId = chk.dataset.id;
      const srv = (settings.customServices || []).find((s) => s.id === srvId);
      if (srv) {
        const cost = srv.unit === "sheet" ? srv.rate * grandTotalParentSheets : srv.rate * qty;
        totalCustomServices += cost;
        activeCustomServices.push({ name: srv.name, cost: cost, rate: srv.rate, unit: srv.unit });
      }
    });

    // Total Raw Material & Base Labor Cost
    const totalBaseCost =
      covPaperTotal + covPrintTotal + covLamTotal +
      inPaperTotal + inPrintTotal +
      totalBindingCost;

    // Wastage
    const wastageAmount = (totalBaseCost * settings.wastagePercent) / 100;

    // Total Production Cost
    const totalProductionCost = totalBaseCost + wastageAmount + totalCutting + totalOther + totalCustomServices + settings.fixedOther;

    // Margin
    const effectiveMarginPct = Math.max(5, settings.marginPercent + marginRateAdjust);
    const marginAmount = (totalProductionCost * effectiveMarginPct) / 100;

    // Pre & Post GST
    let preGstTotal = totalProductionCost + marginAmount;
    if (settings.minOrderCharge && preGstTotal < settings.minOrderCharge) {
      preGstTotal = settings.minOrderCharge;
    }

    const gstAmount = (preGstTotal * settings.gstPercent) / 100;
    const finalTotal = preGstTotal + gstAmount;

    const preGstPerPiece = preGstTotal / qty;
    const finalPerPiece = finalTotal / qty;

    // Update Helper Note in UI
    const noteEl = $("brochure-sheet-breakdown-note");
    if (noteEl) {
      if (is2Fold) {
        noteEl.innerHTML = `📘 <b>A4 2-Fold / Tri-Fold Brochure (Open 25×11.7")</b>: Uses <b>26×38 inch Paper</b> (2 brochures per sheet). Total: <b>${totalCoverParentSheets} sheets of 26×38</b> for ${qty} brochures.`;
      } else {
        const roundingNotice = totalPages !== effectivePages ? ` <span style="color:#aa2d00;">(${totalPages} entered → will print as ${effectivePages} pages)</span>` : "";
        noteEl.innerHTML = `📘 <b>${effectivePages} Pages (${bookSize.toUpperCase()})</b>${roundingNotice} = Cover: ${coverSheetsPerBook} sheet + Inner: ${innerSheetsPerBook} sheets (${innerPages} inner pages). Total: <b>${coverSheetsPerBook + innerSheetsPerBook} parent sheets per book</b>.`;
      }
    }

    lastCalculatedQuote = {
      mode: "Multi-Page Brochure / Booklet",
      productName: is2Fold ? "A4 2-Fold Brochure (26×38 Paper)" : `${effectivePages}-Page ${bookSize.toUpperCase()} Brochure`,
      qty: qty,
      totalPages: is2Fold ? 6 : effectivePages,
      bookSize: is2Fold ? "A4 2-Fold (Open 25×11.7\")" : bookSize.toUpperCase(),
      coverPaper: covSubstrate.name,
      innerPaper: inSubstrate.name,
      binding: is2Fold ? "Creasing & 2-Fold" : bindingName,
      covLamType: covLam === "n" ? "No Lamination" : covLam === "s" ? "Single Lamination" : "Double Lamination",
      slabName: settings.useSlabs ? slab.name : "Flat Pricing",
      effectiveMarginPct: effectiveMarginPct,
      costs: {
        coverPaperCost: covPaperTotal,
        coverPrintCost: covPrintTotal,
        coverLamCost: covLamTotal,
        innerPaperCost: inPaperTotal,
        innerPrintCost: inPrintTotal,
        bindingCost: totalBindingCost,
        cuttingCost: totalCutting,
        otherCost: totalOther + settings.fixedOther,
        customServicesCost: totalCustomServices,
        activeCustomServices: activeCustomServices,
        wastageCost: wastageAmount,
        totalRawCost: totalProductionCost,
        marginAmount: marginAmount,
        preGstTotal: preGstTotal,
        gstAmount: gstAmount,
        finalTotal: finalTotal,
        finalPerPiece: finalPerPiece,
        preGstPerPiece: preGstPerPiece
      }
    };

    renderQuoteDisplay(lastCalculatedQuote);
  }

  // --- RENDERING BLANK / UNCALCULATED STATE ---
  function renderBlankQuote(message) {
    lastCalculatedQuote = null;

    $("quote-unit-price").textContent = "₹ 0.00";
    $("quote-total-pre").textContent = "₹ 0.00";
    $("quote-gst-amt").textContent = "₹ 0.00";
    $("quote-total-final").textContent = "₹ 0.00";
    $("quote-qty-label").textContent = currentMode === "brochure" ? "— Books" : "— Pcs";

    const sheetsLabel = $("quote-sheets-label");
    if (sheetsLabel) {
      sheetsLabel.textContent = "—";
    }

    $("mobile-unit-price").textContent = "₹ 0.00";
    $("mobile-total-price").textContent = "₹ 0.00";

    const slabEl = $("active-slab-tag");
    if (slabEl) {
      slabEl.textContent = "Awaiting Input";
    }

    const consumptionEl = $("sheet-consumption-callout");
    if (consumptionEl) {
      $("consumption-headline").innerHTML = `Machine Sheet Consumption: <b>— Sheets</b>`;
      $("consumption-subtext").innerHTML = `Enter finished quantity to calculate machine sheet consumption & layout yield`;
      $("consumption-tag").textContent = `— pcs / sheet`;
    }

    const noteEl = $("brochure-sheet-breakdown-note");
    if (noteEl) {
      noteEl.innerHTML = `📘 Enter quantity and pages to calculate sheet consumption & binding details.`;
    }

    const tableEl = $("owner-breakdown-table");
    if (tableEl) {
      tableEl.innerHTML = `
        <div style="padding: 16px; text-align: center; color: var(--color-muted); font-size: 13px;">
          ${message || "Enter product specifications to calculate quotation & cost breakdown"}
        </div>
      `;
    }
  }

  // --- RENDERING QUOTE DISPLAY & BREAKDOWN ---
  function renderQuoteDisplay(q) {
    if (!q) return;

    // Top Signature Price Cards
    $("quote-unit-price").textContent = fmtINR(q.costs.finalPerPiece);
    $("quote-total-pre").textContent = fmtINR(q.costs.preGstTotal);
    $("quote-gst-amt").textContent = fmtINR(q.costs.gstAmount);
    $("quote-total-final").textContent = fmtINR(q.costs.finalTotal);
    $("quote-qty-label").textContent = `${q.qty.toLocaleString("en-IN")} ${q.mode === "Multi-Page Brochure / Booklet" ? "Books" : "Pcs"}`;

    // Machine Sheets Row in summary card
    const sheetsLabel = $("quote-sheets-label");
    if (sheetsLabel) {
      if (q.mode === "Standard / Sheet Item") {
        sheetsLabel.textContent = `${q.parentSheets} Sheets (${q.breakdownDetails?.sheetSize || "12×18"})`;
      } else {
        sheetsLabel.textContent = `${q.parentSheets || "—"} Sheets`;
      }
    }

    // Mobile sticky bar values
    $("mobile-unit-price").textContent = fmtINR(q.costs.finalPerPiece);
    $("mobile-total-price").textContent = fmtINR(q.costs.finalTotal);

    // Active slab indicator
    const slabEl = $("active-slab-tag");
    if (slabEl) {
      slabEl.textContent = q.slabName;
    }

    // Owner Breakdown (Itemized table)
    renderOwnerBreakdown(q);
  }

  function renderOwnerBreakdown(q) {
    const tableEl = $("owner-breakdown-table");
    if (!tableEl) return;

    let rowsHtml = "";

    if (q.mode === "Standard / Sheet Item") {
      const b = q.breakdownDetails;
      const paperPerSh = b ? b.paperCostPerSheet : (q.costs.paperCost / Math.max(1, q.parentSheets));
      const effPrint = b ? b.effectivePrintRate : (q.costs.printCost / Math.max(1, q.parentSheets));
      const basePrint = b ? b.basePrintRate : effPrint;
      const printAdj = b ? b.printRateAdjust : 0;
      const rawBase = b ? b.rawBaseCost : (q.costs.paperCost + q.costs.printCost);
      const marginAdj = b ? b.marginRateAdjust : 0;
      const baseMargin = b ? b.baseMarginPct : settings.marginPercent;

      rowsHtml += `
        <div class="breakdown-row">
          <span>Paper Sheets (${q.parentSheets} sh @ ₹${paperPerSh.toFixed(2)}/sh):</span>
          <b>${fmtINR(q.costs.paperCost)}</b>
        </div>

        <div class="breakdown-row">
          <span>Print Impressions (${q.parentSheets} sh @ ₹${effPrint.toFixed(2)}/sh):</span>
          <b>${fmtINR(q.costs.printCost)}</b>
        </div>
        <div class="breakdown-subtext">
          ↳ Click Rate: ₹${effPrint.toFixed(2)}/sh ${printAdj !== 0 ? `(Base ₹${basePrint.toFixed(2)} + Short-Run Tier Surcharge ${printAdj > 0 ? "+" : ""}₹${printAdj.toFixed(2)} [${escapeHtml(q.slabName)}])` : `(Standard Base Click Rate)`}
        </div>

        ${q.costs.lamCost > 0 ? `<div class="breakdown-row"><span>Lamination (${q.parentSheets} sh):</span><b>${fmtINR(q.costs.lamCost)}</b></div>` : ""}
        ${q.costs.cuttingCost > 0 ? `<div class="breakdown-row"><span>Cutting / Die-Cut:</span><b>${fmtINR(q.costs.cuttingCost)}</b></div>` : ""}
        ${(q.costs.activeCustomServices || []).map((cs) => `<div class="breakdown-row"><span>${escapeHtml(cs.name)}:</span><b>${fmtINR(cs.cost)}</b></div>`).join("")}
        ${q.costs.otherCost > 0 ? `<div class="breakdown-row"><span>Other / Fixed:</span><b>${fmtINR(q.costs.otherCost)}</b></div>` : ""}

        <div class="breakdown-row">
          <span>Wastage (${settings.wastagePercent}%):</span>
          <b>${fmtINR(q.costs.wastageCost)}</b>
        </div>
        <div class="breakdown-subtext">
          ↳ ${settings.wastagePercent}% calculated on Raw Materials Base of ${fmtINR(rawBase)} (Paper ${fmtINR(q.costs.paperCost)} + Print ${fmtINR(q.costs.printCost)})
        </div>
      `;
    } else {
      const covPaper = q.costs.coverPaperCost || 0;
      const covPrint = q.costs.coverPrintCost || 0;
      const inPaper = q.costs.innerPaperCost || 0;
      const inPrint = q.costs.innerPrintCost || 0;
      const rawBase = covPaper + covPrint + inPaper + inPrint;

      rowsHtml += `
        <div class="breakdown-row"><span>Cover Paper:</span><b>${fmtINR(covPaper)}</b></div>
        <div class="breakdown-row"><span>Cover Print:</span><b>${fmtINR(covPrint)}</b></div>
        ${q.costs.coverLamCost > 0 ? `<div class="breakdown-row"><span>Cover Lam:</span><b>${fmtINR(q.costs.coverLamCost)}</b></div>` : ""}
        <div class="breakdown-row"><span>Inner Paper:</span><b>${fmtINR(inPaper)}</b></div>
        <div class="breakdown-row"><span>Inner Print:</span><b>${fmtINR(inPrint)}</b></div>
        <div class="breakdown-row"><span>Binding (${escapeHtml(q.binding)}):</span><b>${fmtINR(q.costs.bindingCost)}</b></div>
        ${(q.costs.activeCustomServices || []).map((cs) => `<div class="breakdown-row"><span>${escapeHtml(cs.name)}:</span><b>${fmtINR(cs.cost)}</b></div>`).join("")}
        ${q.costs.cuttingCost > 0 ? `<div class="breakdown-row"><span>Cutting:</span><b>${fmtINR(q.costs.cuttingCost)}</b></div>` : ""}
        <div class="breakdown-row"><span>Wastage (${settings.wastagePercent}%):</span><b>${fmtINR(q.costs.wastageCost)}</b></div>
        <div class="breakdown-subtext">
          ↳ ${settings.wastagePercent}% calculated on Base Paper & Print Impressions (${fmtINR(rawBase)})
        </div>
      `;
    }

    rowsHtml += `
      <div class="breakdown-row total"><span>Net Raw Cost:</span><b>${fmtINR(q.costs.totalRawCost)}</b></div>
      <div class="breakdown-row" style="color: #15803d;"><span>Profit Margin (${q.effectiveMarginPct.toFixed(1)}%):</span><b>${fmtINR(q.costs.marginAmount)}</b></div>
      <div class="breakdown-subtext">
        ↳ Margin applied on total production cost [${escapeHtml(q.slabName)}]
      </div>
      <div class="breakdown-row total"><span>Subtotal (Pre-GST):</span><b>${fmtINR(q.costs.preGstTotal)}</b></div>
      <div class="breakdown-row"><span>GST (${settings.gstPercent}%):</span><b>${fmtINR(q.costs.gstAmount)}</b></div>
      <div class="breakdown-row total" style="color: var(--color-ink); font-size: 13.5px;"><span>Final Billed:</span><b>${fmtINR(q.costs.finalTotal)}</b></div>
    `;

    tableEl.innerHTML = rowsHtml;
  }

  // --- APPLICABLE SLAB RESOLVER ---
  function getApplicableSlab(totalSheets) {
    if (!settings.useSlabs || !slabs.length) {
      return { printAdjust: 0, marginAdjust: 0, name: "Flat Pricing" };
    }
    const found = slabs.find((s) => totalSheets >= s.min && totalSheets <= s.max);
    return found || slabs[slabs.length - 1];
  }

  function getRadioValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  }

  // --- WHATSAPP QUOTATION FORMATTER ---
  function copyWhatsAppQuote() {
    if (!lastCalculatedQuote) {
      showToast("⚠️ Enter quantity first to generate a quote before copying");
      return;
    }
    const q = lastCalculatedQuote;

    let text = `*ESTIMATE / QUOTATION*\n`;
    text += `*Product:* ${q.productName}\n`;
    text += `*Quantity:* ${q.qty.toLocaleString("en-IN")} ${q.mode.includes("Brochure") ? "Books" : "Pieces"}\n`;

    if (q.mode.includes("Brochure")) {
      text += `*Size:* ${q.bookSize} (Total ${q.totalPages} Pages)\n`;
      text += `*Cover:* ${q.coverPaper} (${q.covLamType})\n`;
      text += `*Inner:* ${q.innerPaper}\n`;
      text += `*Binding:* ${q.binding}\n`;
    } else {
      text += `*Paper / Media:* ${q.productName}\n`;
      text += `*Printing:* ${q.printType}\n`;
      text += `*Lamination:* ${q.lamType}\n`;
      if (q.cutsDesc) text += `*Layout:* ${q.cutsDesc}\n`;
      if (q.parentSheets) text += `*Machine Sheets:* ${q.parentSheets} Sheets (${q.breakdownDetails?.sheetSize || "12×18"})\n`;
    }

    if (q.costs.activeCustomServices && q.costs.activeCustomServices.length > 0) {
      text += `*Finishing:* ${q.costs.activeCustomServices.map((cs) => cs.name).join(", ")}\n`;
    }

    text += `--------------------------\n`;
    text += `*Rate per Unit:* ₹${q.costs.finalPerPiece.toFixed(2)} (Incl. GST)\n`;
    text += `*Subtotal:* ₹${q.costs.preGstTotal.toFixed(2)}\n`;
    text += `*GST (${settings.gstPercent}%):* ₹${q.costs.gstAmount.toFixed(2)}\n`;
    text += `*Total Order Value:* ₹${q.costs.finalTotal.toFixed(2)}\n`;
    text += `--------------------------\n`;
    text += `_Valid for 7 days. Taxes included._`;

    navigator.clipboard.writeText(text).then(
      () => showToast("Quotation copied to clipboard ✓"),
      () => showToast("Please copy manually")
    );
  }

  function showToast(msg) {
    const toast = $("toast-notification");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  }

  // --- RESET CALCULATOR TO CLEAN INITIAL STATE ---
  function resetCalculator(showToastMsg = true) {
    // 1. Reset AI Smart Search / Parser
    const promptInput = $("ai-prompt-input");
    if (promptInput) promptInput.value = "";
    const aiClearBtn = $("btn-ai-clear");
    if (aiClearBtn) aiClearBtn.style.display = "none";
    const aiBanner = $("ai-feedback-banner");
    if (aiBanner) {
      aiBanner.style.display = "none";
      aiBanner.innerHTML = "";
    }

    // 2. Standard Mode Inputs
    if ($("std-qty")) $("std-qty").value = "";
    if ($("custom-ups-input")) $("custom-ups-input").value = "";
    if ($("dim-width")) $("dim-width").value = "";
    if ($("dim-height")) $("dim-height").value = "";
    if ($("dim-designs")) $("dim-designs").value = "";
    if ($("std-cutting")) $("std-cutting").value = "";
    if ($("std-other")) $("std-other").value = "";

    // Radios
    const stdPrS = $("std-pr-s");
    if (stdPrS) stdPrS.checked = true;
    const stdLmN = $("std-lm-n");
    if (stdLmN) stdLmN.checked = true;
    const stdCmT = $("std-cm-t");
    if (stdCmT) stdCmT.checked = true;
    const stdOmT = $("std-om-t");
    if (stdOmT) stdOmT.checked = true;

    // Checkboxes
    if ($("dim-diecut")) $("dim-diecut").checked = false;
    const plotterPanel = $("plotter-calibration-panel");
    if (plotterPanel) plotterPanel.style.display = "none";

    document.querySelectorAll(".std-custom-srv-chk").forEach((chk) => (chk.checked = false));

    // Preset / Custom Layout
    const togglePreset = $("layout-toggle-preset");
    const toggleCustom = $("layout-toggle-custom");
    if (togglePreset && toggleCustom) {
      togglePreset.classList.add("active");
      toggleCustom.classList.remove("active");
      currentLayoutType = "preset";
      const presetSec = $("preset-cuts-section");
      if (presetSec) presetSec.style.display = "block";
      const customSec = $("custom-dimension-section");
      if (customSec) customSec.style.display = "none";
    }

    // Default ups = 2 (A4 Half Sheet)
    document.querySelectorAll(".ups-card").forEach((c) => c.classList.remove("active"));
    const defUpsCard = document.querySelector('.ups-card[data-ups="2"]');
    if (defUpsCard) defUpsCard.classList.add("active");
    if ($("custom-ups-container")) $("custom-ups-container").style.display = "none";
    currentUps = 2;

    // 3. Brochure Mode Inputs
    if ($("bro-qty")) $("bro-qty").value = "";
    if ($("bro-pages")) $("bro-pages").value = "";
    if ($("bro-cutting")) $("bro-cutting").value = "";
    if ($("bro-other")) $("bro-other").value = "";

    const broCpD = $("bro-cp-d");
    if (broCpD) broCpD.checked = true;
    const broClN = $("bro-cl-n");
    if (broClN) broClN.checked = true;
    const broIpD = $("bro-ip-d");
    if (broIpD) broIpD.checked = true;
    const broCmT = $("bro-cm-t");
    if (broCmT) broCmT.checked = true;
    const broOmT = $("bro-om-t");
    if (broOmT) broOmT.checked = true;

    document.querySelectorAll(".bro-custom-srv-chk").forEach((chk) => (chk.checked = false));

    // 4. Reset substrates and select dropdowns to clean defaults
    if ($("std-substrate") && substrates.length > 0) {
      $("std-substrate").value = substrates[0].id;
    }
    if ($("bro-cover-substrate") && substrates.length > 0) {
      const covDefault = substrates.find((s) => s.name.includes("300 GSM")) || substrates[3] || substrates[0];
      $("bro-cover-substrate").value = covDefault.id;
    }
    if ($("bro-inner-substrate") && substrates.length > 0) {
      const inDefault = substrates.find((s) => s.name.includes("130 GSM")) || substrates[0];
      $("bro-inner-substrate").value = inDefault.id;
    }
    if ($("bro-size")) $("bro-size").value = "a4";
    if ($("bro-binding") && settings.bindingMethods && settings.bindingMethods.length > 0) {
      $("bro-binding").value = settings.bindingMethods[0].id;
    }
    if ($("dim-unit")) $("dim-unit").value = "in";

    // Close all open dropdown panels and remove is-open / has-open-dropdown
    ALL_CUSTOM_DROPDOWN_IDS.forEach((id) => {
      const panel = $(`${id}-panel`);
      const trigger = $(`${id}-trigger`);
      const wrapper = trigger?.closest(".custom-select-wrapper");
      const card = trigger?.closest(".content-card");
      if (panel) panel.style.display = "none";
      if (trigger) trigger.classList.remove("open");
      if (wrapper) wrapper.classList.remove("is-open");
      if (card) card.classList.remove("has-open-dropdown");
      renderUniversalCustomDropdown(id);
    });

    // Reset sheet size to auto
    currentForcedSheetSize = "auto";
    updateSheetToggleButtons();

    // Clear Sheet SVG
    const svgWrapper = $("sheet-svg-wrapper");
    if (svgWrapper) {
      svgWrapper.innerHTML = `<div style="padding: 28px; text-align: center; color: var(--color-muted); font-size: 13px;">Enter sticker dimensions (Width × Height) to render sheet imposition</div>`;
    }

    // 5. Recalculate quote (will hit renderBlankQuote)
    calculateQuote();

    if (showToastMsg) {
      showToast("Calculator reset to clean state ✓");
    }
  }

  // --- OWNER AUTHENTICATION & ADMIN MODAL ---
  function handleOwnerToggle() {
    if (isOwnerUnlocked) {
      openAdminModal();
    } else {
      openPinModal();
    }
  }

  function openPinModal() {
    const overlay = $("pin-modal-overlay");
    const input = $("pin-modal-input");
    const err = $("pin-error-msg");
    if (!overlay) return;
    input.value = "";
    if (err) err.textContent = "";
    overlay.classList.add("active");
    document.body.classList.add("modal-open");
    setTimeout(() => input.focus(), 100);
  }

  function closePinModal() {
    const overlay = $("pin-modal-overlay");
    if (overlay) overlay.classList.remove("active");
    if (!$("admin-modal-overlay")?.classList.contains("active")) {
      document.body.classList.remove("modal-open");
    }
  }

  function submitPinAuth() {
    const input = $("pin-modal-input");
    const err = $("pin-error-msg");
    const entered = (input.value || "").trim();

    if (entered === settings.pin) {
      isOwnerUnlocked = true;
      closePinModal();
      $("btn-toggle-owner").textContent = "⚙️ Admin Settings";
      const logoutBtn = $("btn-admin-logout");
      if (logoutBtn) logoutBtn.style.display = "inline-flex";
      $("owner-breakdown-card").style.display = "block";
      showToast("Owner Mode Unlocked ✓");
      openAdminModal();
      calculateQuote();
    } else {
      if (err) err.textContent = "Incorrect PIN. Please try again.";
      input.value = "";
      input.focus();
    }
  }

  function logoutAdmin() {
    isOwnerUnlocked = false;
    $("btn-toggle-owner").textContent = "🔒 Owner Admin";
    const logoutBtn = $("btn-admin-logout");
    if (logoutBtn) logoutBtn.style.display = "none";
    const ownerCard = $("owner-breakdown-card");
    if (ownerCard) ownerCard.style.display = "none";
    closeAdminModal();
    showToast("🔒 Admin logged out. Session locked.");
    calculateQuote();
  }

  function toggleOwnerBreakdownCard() {
    const content = $("owner-breakdown-table");
    if (content) {
      content.style.display = content.style.display === "none" ? "flex" : "none";
    }
  }

  function openAdminModal() {
    renderAdminSubstrateTable();
    renderAdminSlabsTable();
    renderAdminBindingMethodsTable();
    renderAdminCustomChargesTable();
    populateAdminSettingsForm();
    $("admin-modal-overlay").classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeAdminModal() {
    $("admin-modal-overlay").classList.remove("active");
    if (!$("pin-modal-overlay")?.classList.contains("active")) {
      document.body.classList.remove("modal-open");
    }
    saveData();
    populateSubstrateDropdowns();
    populateBindingDropdown();
    renderCalculatorCustomServices();
    calculateQuote();
  }

  function setupAdminModal() {
    $("btn-close-admin-modal").addEventListener("click", closeAdminModal);
    $("admin-modal-overlay").addEventListener("click", (e) => {
      if (e.target === $("admin-modal-overlay")) closeAdminModal();
    });

    // Add new substrate button
    $("btn-admin-add-substrate").addEventListener("click", () => {
      const newSub = {
        id: "sub_" + Date.now(),
        name: "12×18 – New Media / Paper",
        size: "12×18",
        sheetCost: 3.00,
        printSingle: settings.defaultPrintSingle,
        printDouble: settings.defaultPrintDouble,
        category: "paper"
      };
      substrates.push(newSub);
      renderAdminSubstrateTable();
      saveData();
    });

    // Add Slab Row button
    $("btn-add-slab-row")?.addEventListener("click", () => {
      const last = slabs[slabs.length - 1];
      const newMin = last ? last.max + 1 : 1;
      slabs.push({
        min: newMin,
        max: newMin + 500,
        name: `Custom Tier (${newMin}+)`,
        printAdjust: 0,
        marginAdjust: 0
      });
      saveData();
      renderAdminSlabsTable();
      calculateQuote();
    });

    // Add binding method button
    $("btn-add-binding-method")?.addEventListener("click", () => {
      if (!settings.bindingMethods) settings.bindingMethods = [];
      settings.bindingMethods.push({
        id: "bm_" + Date.now(),
        name: "New Binding Method",
        rate: 5.00
      });
      saveData();
      renderAdminBindingMethodsTable();
      populateBindingDropdown();
      calculateQuote();
    });

    // Add custom finishing service button
    $("btn-add-custom-charge")?.addEventListener("click", () => {
      if (!settings.customServices) settings.customServices = [];
      settings.customServices.push({
        id: "srv_" + Date.now(),
        name: "New Finishing Service",
        rate: 1.00,
        unit: "sheet"
      });
      saveData();
      renderAdminCustomChargesTable();
      renderCalculatorCustomServices();
    });

    // Save Admin Settings
    $("btn-save-admin-settings").addEventListener("click", () => {
      settings.lamSingle = parseFloat($("adm-lam-s").value) || 0;
      settings.lamDouble = parseFloat($("adm-lam-d").value) || 0;
      settings.wastagePercent = parseFloat($("adm-wastage").value) || 0;
      settings.marginPercent = parseFloat($("adm-margin").value) || 0;
      settings.gstPercent = parseFloat($("adm-gst").value) || 0;
      settings.minOrderCharge = parseFloat($("adm-min-charge").value) || 0;
      settings.useSlabs = $("adm-use-slabs").checked;

      const newPin = $("adm-new-pin").value.trim();
      if (newPin && newPin.length >= 4) {
        settings.pin = newPin;
      }

      saveData(true);
      populateBindingDropdown();
      renderCalculatorCustomServices();
      showToast("Admin Settings Saved & Synced ✓");
      closeAdminModal();
    });

    // Export & Backup
    $("btn-export-backup").addEventListener("click", () => {
      const dump = { settings, substrates, slabs };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `print_rates_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    });

    // Import Backup
    $("btn-import-backup").addEventListener("click", () => {
      const fileInput = $("file-import-backup");
      fileInput.click();
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const parsed = JSON.parse(evt.target.result);
            if (parsed.settings && parsed.substrates) {
              settings = parsed.settings;
              substrates = parsed.substrates;
              if (parsed.slabs) slabs = parsed.slabs;
              saveData();
              populateSubstrateDropdowns();
              renderAdminSubstrateTable();
              populateAdminSettingsForm();
              calculateQuote();
              showToast("Backup Restored Successfully ✓");
            }
          } catch (err) {
            alert("Invalid backup file format.");
          }
        };
        reader.readAsText(file);
      };
    });
  }

  // Admin Substrates Table with 2 distinct boxes per item: Sheet Cost + Print Cost
  function renderAdminSubstrateTable() {
    const tbody = $("admin-substrate-tbody");
    if (!tbody) return;

    tbody.innerHTML = substrates
      .map((s, idx) => {
        return `
        <tr data-id="${s.id}">
          <td>
            <input type="text" class="adm-sub-name" value="${escapeHtml(s.name)}" placeholder="Item name (e.g. 12×18 – Art Card 300 GSM)">
          </td>
          <!-- BOX 1: Sheet Cost -->
          <td style="width: 140px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 11px; color: var(--color-muted);">₹</span>
              <input type="number" step="0.1" class="adm-sub-sheet-cost" value="${s.sheetCost}" placeholder="0.00">
            </div>
          </td>
          <!-- BOX 2: Printing Cost (Single & Double) -->
          <td style="width: 190px;">
            <div style="display: flex; gap: 6px; align-items: center;">
              <input type="number" step="0.1" class="adm-sub-print-single" value="${s.printSingle}" title="Single side print click ₹" placeholder="Single">
              <input type="number" step="0.1" class="adm-sub-print-double" value="${s.printDouble}" title="Double side print click ₹" placeholder="Double">
            </div>
          </td>
          <td style="width: 45px; text-align: center;">
            <button class="btn btn-secondary btn-sm adm-sub-del" data-idx="${idx}" style="padding: 4px 8px; color: #aa2d00;" title="Delete">✕</button>
          </td>
        </tr>
      `;
      })
      .join("");

    // Wire live update listeners for table
    tbody.querySelectorAll("tr").forEach((row) => {
      const id = row.dataset.id;
      const sub = substrates.find((x) => x.id === id);
      if (!sub) return;

      row.querySelector(".adm-sub-name").oninput = (e) => {
        sub.name = e.target.value;
        if (/13\s*[×x*]\s*19/i.test(sub.name)) {
          sub.size = "13×19";
        } else if (/12\s*[×x*]\s*18/i.test(sub.name)) {
          sub.size = "12×18";
        }
        saveData();
      };
      row.querySelector(".adm-sub-sheet-cost").oninput = (e) => {
        sub.sheetCost = parseFloat(e.target.value) || 0;
        saveData();
      };
      row.querySelector(".adm-sub-print-single").oninput = (e) => {
        sub.printSingle = parseFloat(e.target.value) || 0;
        saveData();
      };
      row.querySelector(".adm-sub-print-double").oninput = (e) => {
        sub.printDouble = parseFloat(e.target.value) || 0;
        saveData();
      };
      row.querySelector(".adm-sub-del").onclick = () => {
        if (substrates.length <= 1) return;
        substrates = substrates.filter((x) => x.id !== id);
        renderAdminSubstrateTable();
        saveData();
      };
    });
  }

  function renderAdminSlabsTable() {
    const tbody = $("admin-slabs-tbody");
    if (!tbody) return;

    tbody.innerHTML = slabs
      .map((sl, idx) => {
        return `
        <tr data-idx="${idx}">
          <td>
            <input type="text" class="text-input slab-name-input" value="${escapeHtml(sl.name || '')}" placeholder="Tier Name" style="height: 34px; font-size: 12.5px; width: 100%;">
          </td>
          <td style="width: 100px;">
            <input type="number" class="text-input slab-min-input" value="${sl.min}" style="height: 34px; font-size: 13px; text-align: center; padding: 4px 4px; width: 100%;">
          </td>
          <td style="width: 110px;">
            <input type="number" class="text-input slab-max-input" value="${sl.max}" style="height: 34px; font-size: 13px; text-align: center; padding: 4px 4px; width: 100%;">
          </td>
          <td style="width: 130px;">
            <div style="display: flex; align-items: center; gap: 3px;">
              <span style="font-size: 11px; color: var(--color-muted);">₹</span>
              <input type="number" step="0.1" class="text-input slab-print-input" value="${sl.printAdjust}" placeholder="0.00" style="height: 34px; font-size: 12.5px; width: 100%;">
            </div>
          </td>
          <td style="width: 125px;">
            <div style="display: flex; align-items: center; gap: 3px;">
              <input type="number" step="1" class="text-input slab-margin-input" value="${sl.marginAdjust}" placeholder="0" style="height: 34px; font-size: 12.5px; width: 100%;">
              <span style="font-size: 11px; color: var(--color-muted);">%</span>
            </div>
          </td>
          <td style="width: 45px; text-align: center;">
            <button type="button" class="btn btn-secondary btn-sm btn-del-slab" data-idx="${idx}" style="padding: 4px 8px; color: #aa2d00;" title="Delete Slab">✕</button>
          </td>
        </tr>
      `;
      })
      .join("");

    tbody.querySelectorAll("tr").forEach((row) => {
      const idx = parseInt(row.dataset.idx);
      row.querySelector(".slab-name-input").oninput = (e) => {
        slabs[idx].name = e.target.value;
        saveData();
      };
      row.querySelector(".slab-min-input").oninput = (e) => {
        slabs[idx].min = parseInt(e.target.value) || 1;
        saveData();
      };
      row.querySelector(".slab-max-input").oninput = (e) => {
        slabs[idx].max = parseInt(e.target.value) || 999999;
        saveData();
      };
      row.querySelector(".slab-print-input").oninput = (e) => {
        slabs[idx].printAdjust = parseFloat(e.target.value) || 0;
        saveData();
      };
      row.querySelector(".slab-margin-input").oninput = (e) => {
        slabs[idx].marginAdjust = parseFloat(e.target.value) || 0;
        saveData();
      };
      row.querySelector(".btn-del-slab").onclick = () => {
        if (slabs.length <= 1) return;
        slabs.splice(idx, 1);
        saveData();
        renderAdminSlabsTable();
        calculateQuote();
      };
    });
  }

  function renderAdminBindingMethodsTable() {
    const tbody = $("admin-binding-tbody");
    if (!tbody) return;
    if (!settings.bindingMethods) settings.bindingMethods = [];

    tbody.innerHTML = settings.bindingMethods
      .map((bm, idx) => {
        return `
        <tr data-idx="${idx}">
          <td>
            <input type="text" class="text-input adm-bm-name" value="${escapeHtml(bm.name)}" placeholder="Binding Method (e.g. Perfect Binding)" style="height: 34px; font-size: 12.5px;">
          </td>
          <td style="width: 160px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 11px; color: var(--color-muted);">₹</span>
              <input type="number" step="0.5" class="text-input adm-bm-rate" value="${bm.rate}" placeholder="0.00" style="height: 34px; font-size: 12.5px;">
            </div>
          </td>
          <td style="width: 45px; text-align: center;">
            <button type="button" class="btn btn-secondary btn-sm adm-bm-del" data-idx="${idx}" style="padding: 4px 8px; color: #aa2d00;" title="Delete Method">✕</button>
          </td>
        </tr>
      `;
      })
      .join("");

    tbody.querySelectorAll("tr").forEach((row) => {
      const idx = parseInt(row.dataset.idx);
      const bm = settings.bindingMethods[idx];
      if (!bm) return;

      row.querySelector(".adm-bm-name").oninput = (e) => {
        bm.name = e.target.value;
        saveData();
        populateBindingDropdown();
      };
      row.querySelector(".adm-bm-rate").oninput = (e) => {
        bm.rate = parseFloat(e.target.value) || 0;
        saveData();
        populateBindingDropdown();
      };
      row.querySelector(".adm-bm-del").onclick = () => {
        if (settings.bindingMethods.length <= 1) return;
        settings.bindingMethods.splice(idx, 1);
        saveData();
        renderAdminBindingMethodsTable();
        populateBindingDropdown();
        calculateQuote();
      };
    });
  }

  function renderAdminCustomChargesTable() {
    const tbody = $("admin-custom-charges-tbody");
    if (!tbody) return;
    if (!settings.customServices) settings.customServices = [];

    tbody.innerHTML = settings.customServices
      .map((cs, idx) => {
        return `
        <tr data-idx="${idx}">
          <td>
            <input type="text" class="text-input adm-cs-name" value="${escapeHtml(cs.name)}" placeholder="Service name (e.g. Spot UV, Creasing)" style="height: 34px; font-size: 12.5px;">
          </td>
          <td style="width: 140px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 11px; color: var(--color-muted);">₹</span>
              <input type="number" step="0.1" class="text-input adm-cs-rate" value="${cs.rate}" placeholder="0.00" style="height: 34px; font-size: 12.5px;">
            </div>
          </td>
          <td style="width: 140px;">
            <select class="select-input adm-cs-unit" style="height: 34px; padding: 4px 8px; font-size: 12px;">
              <option value="sheet" ${cs.unit === "sheet" ? "selected" : ""}>Per Sheet</option>
              <option value="book" ${cs.unit === "book" ? "selected" : ""}>Per Book / Pcs</option>
            </select>
          </td>
          <td style="width: 45px; text-align: center;">
            <button type="button" class="btn btn-secondary btn-sm adm-cs-del" data-idx="${idx}" style="padding: 4px 8px; color: #aa2d00;" title="Delete Service">✕</button>
          </td>
        </tr>
      `;
      })
      .join("");

    tbody.querySelectorAll("tr").forEach((row) => {
      const idx = parseInt(row.dataset.idx);
      const srv = settings.customServices[idx];
      if (!srv) return;

      row.querySelector(".adm-cs-name").oninput = (e) => {
        srv.name = e.target.value;
        saveData();
        renderCalculatorCustomServices();
      };
      row.querySelector(".adm-cs-rate").oninput = (e) => {
        srv.rate = parseFloat(e.target.value) || 0;
        saveData();
        renderCalculatorCustomServices();
      };
      row.querySelector(".adm-cs-unit").onchange = (e) => {
        srv.unit = e.target.value;
        saveData();
        renderCalculatorCustomServices();
      };
      row.querySelector(".adm-cs-del").onclick = () => {
        settings.customServices.splice(idx, 1);
        saveData();
        renderAdminCustomChargesTable();
        renderCalculatorCustomServices();
        calculateQuote();
      };
    });
  }

  function populateAdminSettingsForm() {
    $("adm-lam-s").value = settings.lamSingle;
    $("adm-lam-d").value = settings.lamDouble;
    $("adm-wastage").value = settings.wastagePercent;
    $("adm-margin").value = settings.marginPercent;
    $("adm-gst").value = settings.gstPercent;
    $("adm-min-charge").value = settings.minOrderCharge || 0;
    $("adm-use-slabs").checked = settings.useSlabs;
    $("adm-new-pin").value = "";
  }
})();
