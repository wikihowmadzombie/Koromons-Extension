// ==UserScript==
// @name         Korone Trading Extension
// @namespace    Violentmonkey Scripts
// @version      2.0
// @description  Extension for trading and stuff
// @match        https://pekora.zip/*
// @match        https://www.pekora.zip/*
// @grant        GM_xmlhttpRequest
// @connect      www.koromons.xyz
// @updateURL    https://raw.githubusercontent.com/wikihowmadzombie/Koromons-Extension/refs/heads/main/index.js
// @downloadURL  https://raw.githubusercontent.com/wikihowmadzombie/Koromons-Extension/refs/heads/main/index.js
// @icon         https://files.catbox.moe/cyolc9.png
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const API_URL = "https://www.koromons.xyz/api/items";
  let ITEMS = [];
  let NAME_VALUE_MAP = new Map();
  let FETCHED = false;

  async function loadKoromons() {
    if (FETCHED) return { ITEMS, NAME_VALUE_MAP };
    FETCHED = true;
    return new Promise((resolve) => {
      try {
        GM_xmlhttpRequest({
          method: "GET",
          url: API_URL,
          headers: { Accept: "application/json" },
          onload(res) {
            try {
              ITEMS = JSON.parse(res.responseText) || [];
            } catch (e) {
              ITEMS = [];
              console.error("Koromons parse error", e);
            }
            buildNameValueMap();
            resolve({ ITEMS, NAME_VALUE_MAP });
          },
          onerror(err) {
            ITEMS = [];
            NAME_VALUE_MAP = new Map();
            console.error("Koromons fetch error", err);
            resolve({ ITEMS, NAME_VALUE_MAP });
          }
        });
      } catch (e) {
        console.error("GM_xmlhttpRequest error", e);
        ITEMS = [];
        NAME_VALUE_MAP = new Map();
        resolve({ ITEMS, NAME_VALUE_MAP });
      }
    });
  }

  function cleanNameForLookup(name) {
    if (!name || typeof name !== "string") return "";
    return name.replace(/[\u200B-\u200F\uFEFF]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function buildNameValueMap() {
    NAME_VALUE_MAP = new Map();
    if (!Array.isArray(ITEMS)) return;
    for (const it of ITEMS) {
      const n = (it.Name || it.name || it.title || "").toString();
      if (!n) continue;
      const v = (typeof it.Value !== "undefined" ? Number(it.Value) : (typeof it.value !== "undefined" ? Number(it.value) : 0));
      NAME_VALUE_MAP.set(cleanNameForLookup(n), isFinite(v) ? v : 0);
    }
  }

  function lookupValueForNameModal(rawName) {
    if (!rawName) return undefined;
    const name = String(rawName).trim();
    const cleaned = cleanNameForLookup(name);
    if (NAME_VALUE_MAP.has(cleaned)) return NAME_VALUE_MAP.get(cleaned);
    const stripped = name.replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, "").trim();
    const cleanedStripped = cleanNameForLookup(stripped);
    if (cleanedStripped && NAME_VALUE_MAP.has(cleanedStripped)) return NAME_VALUE_MAP.get(cleanedStripped);

    for (const [k, v] of NAME_VALUE_MAP.entries()) {
      if (!k) continue;
      if (k === cleaned) return v;
      if (k.length > 3 && cleaned.includes(k)) return v;
      if (cleaned.length > 3 && k.includes(cleaned)) return v;
      const kWords = k.split(" ").slice(0, 2).join(" ");
      if (kWords && cleaned.includes(kWords)) return v;
    }
    return undefined;
  }

  function formatNumber(n) {
    if (n === null || n === undefined || !isFinite(Number(n))) return "N/A";
    return Number(n).toLocaleString();
  }

(function () {
  "use strict";


  const API_URL = "https://www.koromons.xyz/api/items";
  let ITEMS = [];
  let FETCHED = false;


  async function loadKoromons() {
    if (FETCHED) return ITEMS;
    FETCHED = true;
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: API_URL,
        onload(res) {
          try {
            ITEMS = JSON.parse(res.responseText);
          } catch (e) {
            ITEMS = [];
            console.error("Koromons parse error", e);
          }
          resolve(ITEMS);
        },
        onerror(err) {
          ITEMS = [];
          console.error("Koromons fetch error", err);
          resolve(ITEMS);
        }
      });
    });
  }

  function getKoromonValue(id) {
    const it = ITEMS.find((i) => String(i.itemId) === String(id));
    return it && it.Value > 0 ? it.Value : 0;
  }

  /* ---------------------------
     Utilities
  --------------------------- */
  function safeText(el) {
    return el ? el.textContent.trim() : "";
  }

  function smallHash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16);
  }

  function detectRoot() {
    return (
      document.querySelector('[role="main"]') ||
      document.querySelector(".col-lg-9.col-md-9.col-sm-12.ps-0") ||
      document.querySelector(".container") ||
      document.body
    );
  }

  function hasClassPrefix(el, prefix) {
    if (!el || !el.classList) return false;
    return [...el.classList].some((c) => typeof c === "string" && c.startsWith(prefix));
  }

  function findElementContainingText(tagName, fragment) {
    const lower = String(fragment).toLowerCase();
    const els = tagName ? document.querySelectorAll(tagName) : document.querySelectorAll("*");
    for (const el of els) {
      if (el.textContent && el.textContent.toLowerCase().includes(lower)) return el;
    }
    return null;
  }

  function getFirstClassPrefix(prefix, fallback) {
    try {
      const all = document.querySelectorAll("[class]");
      for (const el of all) {
        for (const c of Array.from(el.classList)) {
          if (c.startsWith(prefix)) return c;
        }
      }
    } catch {}
    return fallback;
  }

  function formatValueShort(n) {
    if (typeof n !== "number") return String(n);
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M+";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
    return String(n);
  }


  function runCollectiblesInjector() {
    if (!location.href.includes("/internal/collectibles?userId=")) return;

    let TOTAL_VALUE = 0;

    function computeValue(itemId, rap) {
      const it = ITEMS.find((i) => String(i.itemId) === String(itemId));
      return it && it.Value > 0 ? it.Value : rap;
    }

    document.querySelectorAll(".col-6.col-md-4.col-lg-2.mb-2").forEach((card) => {
      try {
        const link = card.querySelector("a");
        if (!link) return;
        const match = link.href.match(/catalog\/(\d+)\//);
        if (!match) return;
        const itemId = match[1];

        let rap = 0;
        const rapEl = card.querySelector(".card-body p:nth-of-type(2)");
        if (rapEl) {
          const m = rapEl.textContent.match(/RAP:\s*([0-9,]+)/i);
          if (m) rap = parseInt(m[1].replace(/,/g, ""), 10);
        }

        const val = computeValue(itemId, rap);
        TOTAL_VALUE += val;

        if (!card.querySelector(".pekora-value")) {
          const p = document.createElement("p");
          p.className = "pekora-value mb-0 fw-bolder";
          p.style.color = "#00ff85";
          p.style.marginTop = "5px";
          p.textContent = "Value: " + val.toLocaleString();
          const body = card.querySelector(".card-body") || card;
          body.appendChild(p);
        }

        const title = card.querySelector(".card-body p.fw-bolder") || card.querySelector(".card-body p");
        card.dataset.value = val;
        card.dataset.rap = rap;
        card.dataset.name = title ? title.textContent.trim() : "";
      } catch (e) {
        console.debug("collectible card inject error", e);
      }
    });

    const RAPelement = [...document.querySelectorAll(".fw-bolder")].find((el) => /Total RAP/i.test(el.textContent));
    if (RAPelement) {
      let valEl = document.querySelector("#pekora-total-value");
      if (!valEl) {
        valEl = document.createElement("p");
        valEl.id = "pekora-total-value";
        valEl.style.color = "#00ff85";
        valEl.style.fontWeight = "700";
        valEl.style.marginTop = "5px";
        RAPelement.insertAdjacentElement("afterend", valEl);
      }
      valEl.textContent = "Total Value: " + TOTAL_VALUE.toLocaleString();
    }

    insertSortBar();
  }

  function insertSortBar() {
    const container = document.querySelector(".container");
    if (!container) return;

    let bar = document.querySelector("#pekora-sort-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "pekora-sort-bar";
      bar.style.position = "absolute";
      bar.style.top = "10px";
      bar.style.right = "10px";
      bar.style.display = "flex";
      bar.style.gap = "6px";
      bar.style.zIndex = "99999";
      container.style.position = "relative";
      container.appendChild(bar);
    }

    const makeBtn = (id, text, color) => {
      const btn = document.createElement("button");
      btn.id = id;
      btn.className = `btn btn-sm btn-${color}`;
      btn.textContent = text;
      return btn;
    };

    const row = document.querySelector(".col-12.col-lg-9 .row");
    if (!row) return;

    function sortGrid(type, asc) {
      const cards = [...row.querySelectorAll(".col-6.col-md-4.col-lg-2.mb-2")];
      cards.sort((a, b) => {
        if (type === "name") {
          const A = (a.dataset.name || "").toLowerCase();
          const B = (b.dataset.name || "").toLowerCase();
          return asc ? A.localeCompare(B) : B.localeCompare(A);
        }
        const A = Number(a.dataset[type] || 0);
        const B = Number(b.dataset[type] || 0);
        return asc ? A - B : B - A;
      });
      cards.forEach((c) => row.appendChild(c));
    }

    if (!document.querySelector("#btn-sort-value")) {
      const btn = makeBtn("btn-sort-value", "Value ↓", "success");
      btn.onclick = () => {
        const asc = !(btn.dataset.asc === "1");
        btn.dataset.asc = asc ? "1" : "0";
        btn.textContent = asc ? "Value ↑" : "Value ↓";
        sortGrid("value", asc);
      };
      bar.appendChild(btn);
    }

    if (!document.querySelector("#btn-sort-rap")) {
      const btn = makeBtn("btn-sort-rap", "RAP ↓", "primary");
      btn.onclick = () => {
        const asc = !(btn.dataset.asc === "1");
        btn.dataset.asc = asc ? "1" : "0";
        btn.textContent = asc ? "RAP ↑" : "RAP ↓";
        sortGrid("rap", asc);
      };
      bar.appendChild(btn);
    }

    if (!document.querySelector("#btn-sort-name")) {
      const btn = makeBtn("btn-sort-name", "A → Z", "warning");
      btn.onclick = () => {
        const asc = !(btn.dataset.asc === "1");
        btn.dataset.asc = asc ? "1" : "0";
        btn.textContent = asc ? "A → Z" : "Z → A";
        sortGrid("name", asc);
      };
      bar.appendChild(btn);
    }
  }


  const INLINE_ROBUX_SVG = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="branded" x="0px" y="0px" width="24" height="24" viewBox="0 0 24 24" xml:space="preserve">
  <style>.st0{fill:#02B757;}.st3{fill:#02B757;}</style>
  <g transform="translate(-2,-114)"><g>
    <path class="st3" d="m 14,138 c -6.6,0 -12,-5.4 -12,-12 0,-6.6 5.4,-12 12,-12 6.6,0 12,5.4 12,12 0,6.6 -5.4,12 -12,12 z m 0,-22 c -5.5,0 -10,4.5 -10,10 0,5.5 4.5,10 10,10 5.5,0 10,-4.5 10,-10 0,-5.5 -4.5,-10 -10,-10 z"/>
    <path class="st3" d="m 19,131 h -5 c -0.2,0 -0.4,-0.1 -0.6,-0.2 L 9,127.3 v 2.7 c 0,0.6 -0.4,1 -1,1 -0.6,0 -1,-0.4 -1,-1 v -8 c 0,-0.6 0.4,-1 1,-1 h 4 c 1.1,0 1.7,1.1 1.7,3 0,0.6 -0.1,1.2 -0.2,1.7 -0.4,1.2 -1.2,1.3 -1.5,1.3 h -0.1 l 2.5,2 H 19 c 0.3,0 0.5,-0.5 0.5,-1 0,-0.4 -0.1,-1 -0.5,-1 h -2 c -1.4,0 -2.5,-1.3 -2.5,-3 0,-0.7 0.2,-1.4 0.5,-1.9 0.5,-0.7 1.2,-1.1 2,-1.1 h 3 c 0.6,0 1,0.4 1,1 0,0.6 -0.4,1 -1,1 h -3 c -0.1,0 -0.2,0 -0.3,0.2 -0.1,0.2 -0.2,0.5 -0.2,0.8 0,0.4 0.2,1 0.5,1 h 2 c 1.4,0 2.5,1.3 2.5,3 0,1.7 -1.1,3 -2.5,3 z M 9,125 h 2.6 c 0.1,-0.5 0.1,-1.5 0,-2 H 9 Z"/>
  </g></g></svg>`;

  function removeCatalogInject() {
    const oldStat = document.querySelector("#pk_value_statblock");
    if (oldStat) oldStat.remove();
    document.querySelector("#pk_koromon_link")?.remove();
  }

  function runCatalogInjector(retry = true) {
    if (!location.pathname.startsWith("/catalog/")) {
      removeCatalogInject();
      return;
    }

    const idMatch = location.pathname.match(/\/catalog\/(\d+)/);
    if (!idMatch) return;
    const itemId = idMatch[1];

    const label = findElementContainingText("span", "Average Price") || findElementContainingText("*", "Average Price");
    if (!label) {
      if (retry) setTimeout(() => runCatalogInjector(false), 140);
      return;
    }

    let statBlock = label;
    for (let i = 0; i < 12; i++) {
      if (!statBlock) break;
      if (hasClassPrefix(statBlock, "priceChartStat")) break;
      statBlock = statBlock.parentElement;
    }
    if (!statBlock || !hasClassPrefix(statBlock, "priceChartStat")) {
      if (retry) setTimeout(() => runCatalogInjector(false), 140);
      return;
    }

    const statsContainer = statBlock.parentElement || statBlock.parentNode;
    if (!statsContainer) {
      if (retry) setTimeout(() => runCatalogInjector(false), 140);
      return;
    }

    if (document.querySelector("#pk_value_statblock")) {
      ensureKoromonLink(itemId);
      return;
    }

    const numericSpan = [...statBlock.querySelectorAll("span")].find((s) =>
      /^[0-9,]+$/.test(s.textContent.trim())
    );
    if (!numericSpan) {
      if (retry) setTimeout(() => runCatalogInjector(false), 140);
      return;
    }

    const korVal = getKoromonValue(itemId);
    const formatted = korVal ? korVal.toLocaleString() : "-";

    const newStat = document.createElement("div");
    newStat.className = Array.from(statBlock.classList).join(" ");
    newStat.id = "pk_value_statblock";

    const textLabelClass = getFirstClassPrefix("priceChartTextLabel", "priceChartTextLabel-0-2-125");
    const priceIconClass = getFirstClassPrefix("priceIcon", "icon-robux priceIcon-0-2-200");
    const priceLabelClass = getFirstClassPrefix("priceLabel", "priceLabel-0-2-201");

    newStat.innerHTML = `
      <span class="${textLabelClass}">Value</span>
      <div class="undefined flex">
        <div class="undefined flex">
          <span class="${priceIconClass}" aria-hidden="true">${INLINE_ROBUX_SVG}</span>
          <span class="${priceLabelClass}" style="color: #02b757;">${formatted}</span>
        </div>
      </div>
    `;

    statsContainer.appendChild(newStat);

    ensureKoromonLink(itemId);
  }

  function ensureKoromonLink(itemId) {
    if (document.querySelector("#pk_koromon_link")) return;
    const creatorLine = [...document.querySelectorAll("p, span, div")].find((e) => {
      const t = safeText(e);
      return t.startsWith("By ") || /^By\s+\S+/.test(t);
    });
    if (creatorLine) {
      const link = document.createElement("p");
      link.id = "pk_koromon_link";
      link.style.margin = "5px 0";
      link.innerHTML = `<a href="https://www.koromons.xyz/item/${itemId}" target="_blank" style="color: inherit; font-weight: 600;">View on Koromons</a>`;
      creatorLine.insertAdjacentElement("afterend", link);
    }
  }



  function fetchKoromonsUser(userId) {
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: `https://www.koromons.xyz/api/users/${userId}`,
        onload(res) {
          try {
            const json = JSON.parse(res.responseText);
            resolve(json);
          } catch (e) {
            console.error("koromons user parse error", e);
            resolve(null);
          }
        },
        onerror(err) {
          console.error("koromons user fetch error", err);
          resolve(null);
        }
      });
    });
  }

  function removeProfileValue() {
    document.querySelectorAll("#pk_profile_value").forEach(n => n.remove());
  }

  function buildProfileLiHTML(formatted, playerUrl, headerClass, textContainerClass, textClass) {
    return `
      <div class="${headerClass}">Value</div>
      <a class="${textContainerClass}" href="${playerUrl}" target="_blank">
        <h3 class="${textClass}" style="margin:0; font-weight:400; font-size:16px;">
          ${formatted}
        </h3>
      </a>
    `;
  }

  async function runProfileInjector(retry = true) {
    const m = location.pathname.match(/^\/users\/(\d+)\/profile/);
    if (!m) {
      removeProfileValue();
      return;
    }
    const userId = m[1];

    const statsList = [...document.querySelectorAll("[class]")].find((el) =>
      hasClassPrefix(el, "relationshipList")
    );
    if (!statsList) {
      if (retry) setTimeout(() => runProfileInjector(false), 180);
      return;
    }

    const data = await fetchKoromonsUser(userId);
    if (!data || typeof data.totalValue !== "number") {
      if (retry) setTimeout(() => runProfileInjector(false), 300);
      return;
    }

    const formatted = formatValueShort(data.totalValue);

    const headerClass = getFirstClassPrefix("statHeader", "statHeader-0-2-102");
    const textContainerClass = getFirstClassPrefix("statTextContainer", "statTextContainer-0-2-104");
    const textClass = getFirstClassPrefix("statText", "statText-0-2-105");

    const playerUrl = `https://www.koromons.xyz/player/${userId}`;

    const existing = statsList.querySelector("#pk_profile_value");
    if (existing) {
      try {
        existing.innerHTML = buildProfileLiHTML(formatted, playerUrl, headerClass, textContainerClass, textClass);
      } catch (e) { console.error("update existing profile value err", e); }
    } else {
      const li = document.createElement("li");
      li.id = "pk_profile_value";
      li.style.width = "20%";
      li.style.float = "left";
      li.style.padding = "0px 5px";
      li.style.textAlign = "center";

      li.innerHTML = buildProfileLiHTML(formatted, playerUrl, headerClass, textContainerClass, textClass);

      const lis = Array.from(statsList.querySelectorAll("li"));
      let rapLi = null;
      for (const candidate of lis) {
        const header = candidate.querySelector(`[class*="statHeader"]`);
        if (header && header.textContent.trim().toLowerCase() === "rap") {
          rapLi = candidate;
          break;
        }
      }

      if (rapLi) {
        if (typeof rapLi.after === "function") rapLi.after(li);
        else rapLi.parentNode.insertBefore(li, rapLi.nextSibling);
      } else {
        statsList.appendChild(li);
      }
    }

    const finalLis = statsList.querySelectorAll("li");
    finalLis.forEach((item) => {
      try {
        item.style.width = "20%";
        item.style.float = "left";
      } catch {}
    });
  }

  async function runWatcher() {
    await loadKoromons();

    const root = detectRoot();
    let lastHash = "";
    let lastURL = location.href;

    const runner = () => {
      try {
        if (location.href.includes("/internal/collectibles?userId=")) {
          runCollectiblesInjector();
        } else if (location.pathname.startsWith("/catalog/")) {
          runCatalogInjector();
        } else if (/^\/users\/\d+\/profile/.test(location.pathname)) {
          runProfileInjector();
        } else {
          removeCatalogInject();
          removeProfileValue();
        }
      } catch (e) {
        console.error("runner error", e);
      }
    };

    runner();

    setInterval(() => {
      try {
        if (location.href !== lastURL) {
          lastURL = location.href;
          runner();
          return;
        }
        const snapshot = root.innerHTML.slice(0, 200000);
        const h = smallHash(snapshot);
        if (h !== lastHash) {
          lastHash = h;
          runner();
        }
      } catch (e) {
        console.debug("watcher error", e);
      }
    }, 300);
  }

  runWatcher();

})();



  function safeText(el) { return el ? (el.textContent || "").trim() : ""; }
  function getFirstClassPrefix(prefix, fallback) {
    try {
      const all = document.querySelectorAll("[class]");
      for (const el of all) {
        for (const c of Array.from(el.classList)) {
          if (c.startsWith(prefix)) return c;
        }
      }
    } catch (e) { /* ignore */ }
    return fallback;
  }



  (function injectTradeCSS() {
const css = `
      .pekora-trade-overlay{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483600;overflow:visible}
      .pekora-value-tag{font-family:Arial,sans-serif;display:inline-block;gap:6px;font-size:13px;padding:3px 7px;border-radius:6px;background:rgba(10,10,10,0.92);color:#e6ffed;white-space:nowrap;pointer-events:auto;user-select:none;line-height:1;position:absolute;z-index:2147483650;transform:translateX(-50%);}
      .pekora-value-tag .val{color:#7ef39a;font-weight:800}
      .pekora-modal-summary{position:fixed;pointer-events:auto;padding:10px 12px;border-radius:8px;min-width:180px;text-align:left;font-weight:700;font-size:13px;box-shadow:0 6px 24px rgba(0,0,0,0.5);background:rgba(12,12,12,0.96);color:#ffffff;line-height:1.1;z-index:2147483650;left:12px;bottom:12px}
      .pekora-modal-summary .title{font-weight:900;margin-bottom:6px;color:#ffffff}
      .pekora-modal-summary .line{display:flex;justify-content:space-between;gap:8px;margin-top:6px}
      .pekora-modal-summary .line span:first-child { color:#ffffff !important; }
      .pekora-modal-summary .numbers{font-weight:900;color:#ffffff}
      .pekora-modal-summary .pos{color:#7ef39a}
      .pekora-modal-summary .neg{color:#ff7f7f}
      .trade-value-pill{display:inline-block;margin-top:6px;text-align:center;font-weight:800;font-size:12px;padding:4px 8px;border-radius:6px;background:rgba(7,7,7,0.92);color:#bfffd6;z-index:2147483650;white-space:nowrap}
      .trade-tooltip{position:fixed;padding:6px 8px;border-radius:6px;background:rgba(10,10,10,0.96);color:#fff;font-weight:700;font-size:13px;z-index:2147483750;pointer-events:none;transform:translate(-50%, -8px);white-space:nowrap}
    `;
    const st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
  })();

  function ensureOverlayForModal(parent) {
    if (!parent) return null;
    try { const cs = window.getComputedStyle(parent); if (cs.position === "static") parent.style.position = "relative"; } catch (e) {}
    if (parent._pekora_trade_overlay && parent._pekora_trade_overlay instanceof Element) return parent._pekora_trade_overlay;
    const ov = document.createElement("div");
    ov.className = "pekora-trade-overlay";
    ov.style.pointerEvents = "none";
    ov.style.position = "absolute";
    ov.style.top = "0";
    ov.style.left = "0";
    ov.style.width = "100%";
    ov.style.height = "100%";
    ov.style.overflow = "visible";
    try { parent.appendChild(ov); } catch (e) { document.body.appendChild(ov); }
    parent._pekora_trade_overlay = ov;
    return ov;
  }

  function ensureModalId(modal) {
    if (!modal) return "";
    if (modal._pekora_trade_id) return modal._pekora_trade_id;
    if (!window.__pekora_trade_modal_counter) window.__pekora_trade_modal_counter = 1;
    modal._pekora_trade_id = `pekora_trade_modal_${Date.now()}_${(window.__pekora_trade_modal_counter++)}`;
    return modal._pekora_trade_id;
  }

  function createValueTag(text, normalizedName, src) {
    const el = document.createElement("div");
    el.className = "pekora-value-tag";
    el.style.position = "absolute";
    el.style.display = "none";
    el.dataset.pekoraName = normalizedName || "";
    if (src) el.dataset.pekoraSrc = src;
    const v = document.createElement("span"); v.className = "val"; v.textContent = text; el.appendChild(v);
    return el;
  }

  function positionTagForBox(tagEl, boxEl, modalEl) {
    if (!tagEl || !boxEl || !modalEl) return;
    const rect = boxEl.getBoundingClientRect();
    const modalRect = modalEl.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) { tagEl.style.display = "none"; return; }
    tagEl.style.display = "";
    const leftCenter = (rect.left - modalRect.left) + rect.width / 2;
    const top = (rect.bottom - modalRect.top) + 6;
    tagEl.style.left = `${Math.round(leftCenter)}px`;
    tagEl.style.top = `${Math.round(top)}px`;
    tagEl.style.maxWidth = `${Math.max(80, Math.min(260, Math.round(rect.width * 1.2)))}px`;
    tagEl.style.overflow = "hidden";
    tagEl.style.textOverflow = "ellipsis";
    tagEl.style.whiteSpace = "nowrap";
  }


  function findTradeModal() {
    const candidates = [".col-9", ".TradeRequest", ".innerSection-0-2-123", ".trade-modal", ".trade-window", ".modal", '[role="dialog"]'];
    for (const s of candidates) {
      const el = document.querySelector(s);
      if (el && el.querySelector && el.querySelector("img")) {
        if (/My\/Trades\.aspx/i.test(location.pathname) || /my trades/i.test((el.textContent || "").toLowerCase())) return el;
      }
    }
    const maybe = Array.from(document.querySelectorAll('[role="dialog"], .modal, .panel, .popup'));
    for (const c of maybe) {
      try {
        const txt = (c.textContent || "").toLowerCase();
        if ((/items you gave|items you received|my trades|trade details|trade request/.test(txt)) && c.querySelector("img")) return c;
      } catch (e) {}
    }
    return null;
  }

  function gatherItemBoxes(modal) {
    if (!modal) return [];
    const strict = (() => {
      const rows = Array.from(modal.querySelectorAll(".row.ms-1.mb-4"));
      const boxes = [];
      for (const row of rows) {
        const found = Array.from(row.querySelectorAll(".col-0-2-133"));
        if (found.length) found.forEach(f => boxes.push(f));
      }
      return boxes;
    })();
    if (strict.length) return strict;

    const boxes = [];
    const imgs = Array.from(modal.querySelectorAll("img"));
    for (const img of imgs) {
      try {
        const src = (img.src || "").toLowerCase();
        const nw = img.naturalWidth || img.width || 0;
        const nh = img.naturalHeight || img.height || 0;
        if (Math.max(nw, nh) < 16) continue;
        if (src.includes("avatar") || src.includes("profile")) continue;
        if (!(src.includes("thumbnail") || src.includes("thumbnails") || src.includes("/catalog/") || src.includes("asset") || img.offsetParent !== null)) continue;
        const box = img.closest(".col-0-2-133") || img.closest(".card") || img.closest(".item") || img.closest("a") || img.parentElement;
        if (box && !boxes.includes(box)) boxes.push(box);
      } catch (e) {}
    }
    const anchors = Array.from(modal.querySelectorAll('a[href*="/catalog/"], a[href*="/catalog"]'));
    for (const a of anchors) {
      const box = a.closest(".col-0-2-133") || a.closest(".card") || a.parentElement;
      if (box && !boxes.includes(box)) boxes.push(box);
    }
    return boxes;
  }

  function findNameInBox(box) {
    if (!box) return "";
    const isLabelish = txt => {
      if (!txt) return true;
      const low = txt.toLowerCase();
      if (low.startsWith("value") || low.startsWith("items you") || low.includes("none")) return true;
      return false;
    };
    const tries = ["a[href*='/catalog/']", ".itemName-0-2-135 a", ".itemName a", ".item-name a", ".itemTitle a", "p.fw-bolder", "p", "div"];
    for (const s of tries) {
      try {
        const el = box.querySelector(s);
        if (el && el.textContent) {
          const t = el.textContent.trim();
          if (t.length && !isLabelish(t)) return t;
        }
      } catch (e) {}
    }
    const img = box.querySelector && box.querySelector("img");
    if (img) {
      if (img.alt && img.alt.trim() && !isLabelish(img.alt)) return img.alt.trim();
      if (img.title && img.title.trim() && !isLabelish(img.title)) return img.title.trim();
    }
    const full = (box.textContent || "").trim();
    if (!full) return "";
    const lines = full.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) if (!isLabelish(line)) return line;
    return "";
  }

  function attachModalReinserter(modal, callback) {
    try {
      if (modal._pekora_trade_mut && modal._pekora_trade_mut instanceof MutationObserver) return;
      const mo = new MutationObserver((muts) => {
        let removedOur = false;
        let added = false;
        for (const m of muts) {
          if (m.removedNodes && m.removedNodes.length) {
            for (const n of m.removedNodes) {
              if (n && n.dataset && n.dataset.pekoraModal) removedOur = true;
            }
          }
          if (m.addedNodes && m.addedNodes.length) added = true;
        }
        if (removedOur || added) {
          if (modal.__pekora_trade_reinsert_timer) clearTimeout(modal.__pekora_trade_reinsert_timer);
          modal.__pekora_trade_reinsert_timer = setTimeout(() => { try { callback(modal); } catch (e) {} }, 120);
        }
      });
      mo.observe(modal, { childList: true, subtree: true });
      modal._pekora_trade_mut = mo;
    } catch (e) {}
  }

  function parseRapFromElement(root) {
    if (!root) return 0;
    try {
      const els = Array.from(root.querySelectorAll('p, span, div, li'));
      for (const e of els) {
        const m = (e.textContent || "").match(/rap[:\s]*([\d,]+)/i);
        if (m) return Number(m[1].replace(/,/g, "")) || 0;
      }
      const text = (root.textContent || "");
      const m2 = text.match(/rap[:\s]*([\d,]+)/i);
      if (m2) return Number(m2[1].replace(/,/g, "")) || 0;
    } catch (e) {}
    return 0;
  }

  function parseRobuxInputValue(root) {
    if (!root) return 0;
    try {
      const input = root.querySelector('input[type="number"], input[type="text"], input.robuxInput, input[name*="robux"], input[name*="Robux"]');
      if (input && input.value) {
        const n = Number((input.value || "").replace(/[^0-9.-]/g, ""));
        return isFinite(n) ? n : 0;
      }
      const txtEl = Array.from(root.querySelectorAll('p, span, div')).find(e => /robux[:\s]*[\d,]+/i.test(e.textContent || ""));
      if (txtEl) {
        const m = (txtEl.textContent || "").match(/robux[:\s]*([\d,]+)/i);
        if (m) return Number(m[1].replace(/,/g, "")) || 0;
      }
    } catch (e) {}
    return 0;
  }

  function createOrUpdatePillForImage(imgEl, displayText, rawValue) {
    if (!imgEl) return null;
    try {
      const attachTo = imgEl.closest('td, .card, .item, .itemCard, .itemCol') || imgEl.parentElement || imgEl;
      if (!attachTo) return null;
      const existing = attachTo.querySelector && attachTo.querySelector('.trade-value-pill[data-pekora-enhanced="1"]');
      if (existing) {
        existing.textContent = displayText;
        existing.dataset.pekoraValue = String(Number(rawValue) || 0);
        return existing;
      }
      const pill = document.createElement('div');
      pill.className = 'trade-value-pill';
      pill.textContent = displayText;
      pill.dataset.pekoraValue = String(Number(rawValue) || 0);
      pill.dataset.pekoraEnhanced = "1";

      pill.addEventListener('mouseenter', (ev) => showTradeTooltip((rawValue === undefined || rawValue === null) ? "N/A" : `${formatNumber(rawValue)} R$`, ev.pageX, ev.pageY));
      pill.addEventListener('mousemove', (ev) => moveTradeTooltip(ev.pageX, ev.pageY));
      pill.addEventListener('mouseleave', hideTradeTooltip);

      imgEl.addEventListener('mouseenter', (ev) => showTradeTooltip((rawValue === undefined || rawValue === null) ? "N/A" : `${formatNumber(rawValue)} R$`, ev.pageX, ev.pageY));
      imgEl.addEventListener('mousemove', (ev) => moveTradeTooltip(ev.pageX, ev.pageY));
      imgEl.addEventListener('mouseleave', hideTradeTooltip);

      if (imgEl.nextElementSibling) imgEl.parentElement.insertBefore(pill, imgEl.nextElementSibling);
      else attachTo.appendChild(pill);
      return pill;
    } catch (e) {
      console.error("createOrUpdatePillForImage err", e);
      return null;
    }
  }

  let tradeTooltip = null;
  function showTradeTooltip(text, pageX, pageY) {
    hideTradeTooltip();
    tradeTooltip = document.createElement('div');
    tradeTooltip.className = 'trade-tooltip';
    tradeTooltip.textContent = text;
    document.body.appendChild(tradeTooltip);
    if (typeof pageX === 'number') tradeTooltip.style.left = pageX + 'px';
    if (typeof pageY === 'number') tradeTooltip.style.top = (pageY - 18) + 'px';
  }
  function moveTradeTooltip(pageX, pageY) {
    if (!tradeTooltip) return;
    tradeTooltip.style.left = pageX + 'px';
    tradeTooltip.style.top = (pageY - 18) + 'px';
  }
  function hideTradeTooltip() {
    if (tradeTooltip) { try { tradeTooltip.remove(); } catch (e) { } tradeTooltip = null; }
  }

  function annotateModalBoxes(modal) {
    if (!modal) return;
    const ov = ensureOverlayForModal(modal);
    const boxes = gatherItemBoxes(modal);
    if (!ov) return;
    const modalId = ensureModalId(modal);
    const existingTags = Array.from(ov.children).filter(c => c.dataset && c.dataset.pekoraModal === modalId && c.dataset.pekoraSrcType === 'box');
    const seenKeys = new Set();
    for (const box of boxes) {
      try {
        const name = findNameInBox(box);
        if (!name) continue;
        const normalized = cleanNameForLookup(name);
        let thumbSrc = "";
        const img = box.querySelector("img");
        if (img && (img.src || img.getAttribute('data-src'))) thumbSrc = (img.src || img.getAttribute('data-src') || "").split('?')[0];

        const exists = existingTags.find(c => (c.dataset.pekoraName === normalized) || (thumbSrc && c.dataset.pekoraSrc === thumbSrc));
        if (exists) { seenKeys.add(exists.dataset.pekoraName || (exists.dataset.pekoraSrc || "")); continue; }

        const korVal = lookupValueForNameModal(name);
        let effective = undefined;
        if (typeof korVal === "number" && korVal > 0) effective = korVal;
        else {
          const rap = parseRapFromElement(box);
          effective = rap > 0 ? rap : (typeof korVal === "number" ? korVal : undefined);
        }

        if (effective === undefined || effective === null) continue;

        const text = formatNumber(effective);
        const tag = createValueTag(text, normalized, thumbSrc);
        tag.dataset.pekoraModal = modalId;
        tag.dataset.pekoraSrcType = "box";
        Object.defineProperty(tag, "_pekora_src_element", { value: box, configurable: true });

        try { box.dataset.pekoraEnhancedFor = modalId; box.dataset.pekoraValue = String(Number(effective) || 0); } catch (e) {}

        ov.appendChild(tag);
        positionTagForBox(tag, box, modal);
      } catch (e) {
        console.error("annotateModalBoxes err", e);
      }
    }
    for (const t of existingTags) {
      const key = t.dataset.pekoraName || t.dataset.pekoraSrc || "";
      if (!seenKeys.has(key)) t.remove();
    }
  }

  function computeModalTotals(modal) {
    let giveTotal = 0, receiveTotal = 0;
    if (!modal) return { giveTotal, receiveTotal };

    const modalBoxes = Array.from(modal.querySelectorAll('[data-pekora-enhanced-for]')).filter(b => b.dataset.pekoraEnhancedFor === modal._pekora_trade_id);
    const rows = Array.from(modal.querySelectorAll(".row.ms-1.mb-4"));

    if (modalBoxes.length) {
      for (const b of modalBoxes) {
        const v = Number(b.dataset.pekoraValue) || 0;
        const contRow = b.closest(".row.ms-1.mb-4");
        if (contRow) {
          const idx = rows.indexOf(contRow);
          if (idx > 0) receiveTotal += v; else giveTotal += v;
        } else giveTotal += v;
      }
    } else {
      const overlay = modal._pekora_trade_overlay;
      if (overlay) {
        const tags = Array.from(overlay.children).filter(c => c.dataset && c.dataset.pekoraModal === modal._pekora_trade_id && c.dataset.pekoraSrcType === 'box');
        if (tags.length) {
          for (let i = 0; i < tags.length; i++) {
            const src = tags[i]._pekora_src_element;
            const v = src && src.dataset ? Number(src.dataset.pekoraValue) || 0 : 0;
            if (i < tags.length / 2) giveTotal += v; else receiveTotal += v;
          }
        }
      }
    }

    try {
      const offerBlock = (() => {
        const t = Array.from(modal.querySelectorAll('h1,h2,h3,h4,div,p,span')).find(n => {
          try { const s = (n.textContent || "").toLowerCase(); return s.includes('your offer') || s.includes("you're offering"); } catch (e) { return false; }
        });
        if (t) return t.closest('section, .col, .panel, .offerRequestCard-0-2-34') || t.parentElement;
        const cols = modal.querySelectorAll('.col, section, .panel');
        return cols[0] || null;
      })();
      const requestBlock = (() => {
        const t = Array.from(modal.querySelectorAll('h1,h2,h3,h4,div,p,span')).find(n => {
          try { const s = (n.textContent || "").toLowerCase(); return s.includes('their offer') || s.includes("they're offering"); } catch (e) { return false; }
        });
        if (t) return t.closest('section, .col, .panel, .offerRequestCard-0-2-34') || t.parentElement;
        const cols = modal.querySelectorAll('.col, section, .panel');
        return cols[1] || null;
      })();

      giveTotal += parseRobuxInputValue(offerBlock);
      receiveTotal += parseRobuxInputValue(requestBlock);
    } catch (e) { /* ignore robux errors */ }

    return { giveTotal, receiveTotal };
  }

  function createOrUpdateModalSummary(modal, giveTotal, receiveTotal) {
    const id = ensureModalId(modal);
    let el = document.querySelector(`.pekora-modal-summary[data-pekora-modal="${id}"]`);
    const overpay = Number(receiveTotal) - Number(giveTotal);
    const formattedGive = formatNumber(giveTotal);
    const formattedReceive = formatNumber(receiveTotal);
    const formattedDiff = (overpay > 0 ? `+${formatNumber(overpay)}` : formatNumber(overpay));

    if (!el) {
      el = document.createElement('div');
      el.className = "pekora-modal-summary";
      el.dataset.pekoraModal = id;
      el.innerHTML = `
        <div class="title">${overpay === 0 ? 'Fair Trade' : (overpay > 0 ? `+${formatNumber(overpay)}` : `${formatNumber(overpay)}`)}</div>
        <div class="line"><span>You're offering</span><span class="numbers offer-num">${formattedGive}</span></div>
        <div class="line"><span>They're offering</span><span class="numbers request-num">${formattedReceive}</span></div>
        <div class="line"><span>Difference</span><span class="numbers diff-num">${formattedDiff}</span></div>
      `;
      document.body.appendChild(el);
    } else {
      el.querySelector('.offer-num').textContent = formattedGive;
      el.querySelector('.request-num').textContent = formattedReceive;
      const diffNode = el.querySelector('.diff-num');
      diffNode.textContent = formattedDiff;
      diffNode.classList.remove('pos', 'neg');
      if (overpay > 0) diffNode.classList.add('pos');
      else if (overpay < 0) diffNode.classList.add('neg');
      el.querySelector('.title').textContent = (overpay === 0 ? 'Fair Trade' : (overpay > 0 ? `+${formatNumber(overpay)}` : `${formatNumber(overpay)}`));
    }

    try {
      const r = modal.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) el.style.display = 'none';
      else el.style.display = '';
    } catch (e) { el.style.display = ''; }
  }

  let _tradeRepositionPending = false;
  function tradeRequestReposition() {
    if (_tradeRepositionPending) return;
    _tradeRepositionPending = true;
    requestAnimationFrame(() => {
      _tradeRepositionPending = false;
      tradeRepositionAll();
    });
  }

  function tradeRepositionAll() {
    const overlays = Array.from(document.querySelectorAll('.pekora-trade-overlay'));
    for (const ov of overlays) {
      const parent = ov.parentElement;
      if (!parent) continue;
      for (const child of Array.from(ov.children)) {
        try {
          const type = child.dataset.pekoraSrcType;
          const src = child._pekora_src_element;
          if (type === 'box') {
            positionTagForBox(child, src, parent);
          }
        } catch (e) {}
      }
    }
  }

  async function enhanceModalIfEligible() {
    if (!/My\/Trades\.aspx/i.test(location.pathname) && !/my trades/i.test((document.body.textContent || "").toLowerCase())) {
      const prev = document.querySelectorAll('.pekora-modal-summary');
      prev.forEach(p => p.remove());
      return;
    }

    await loadKoromons();
    if (!NAME_VALUE_MAP || NAME_VALUE_MAP.size === 0) buildNameValueMap();

    const modal = findTradeModal();
    if (!modal) {
      const old = document.querySelectorAll('.pekora-modal-summary');
      old.forEach(e => e.remove());
      return;
    }

    ensureModalId(modal);
    ensureOverlayForModal(modal);

    annotateModalBoxes(modal);

    const totals = computeModalTotals(modal);

    createOrUpdateModalSummary(modal, totals.giveTotal, totals.receiveTotal);

    attachModalReinserter(modal, (m) => {
      if (m._pekora_trade_overlay) {
        const children = Array.from(m._pekora_trade_overlay.children);
        for (const c of children) {
          if (c.dataset && c.dataset.pekoraModal === m._pekora_trade_id) c.remove();
        }
      }
      setTimeout(() => { try { enhanceModalIfEligible(); } catch (e) {} }, 90);
    });

    tradeRequestReposition();
  }

  let _tradeGlobalDeb = null;
  const tradeGlobalMO = new MutationObserver((muts) => {
    let added = 0;
    for (const m of muts) if (m.addedNodes && m.addedNodes.length) added += m.addedNodes.length;
    if (added > 0) {
      if (_tradeGlobalDeb) clearTimeout(_tradeGlobalDeb);
      _tradeGlobalDeb = setTimeout(() => {
        try { enhanceModalIfEligible(); } catch (e) {}
      }, 160);
    }
  });
  tradeGlobalMO.observe(document, { childList: true, subtree: true });

  (function hijackHistoryForTrades() {
    const _push = history.pushState;
    history.pushState = function () { _push.apply(this, arguments); window.dispatchEvent(new Event("pekora_locationchange_trades")); };
    window.addEventListener("popstate", () => window.dispatchEvent(new Event("pekora_locationchange_trades")));
    window.addEventListener("pekora_locationchange_trades", () => {
      setTimeout(() => {
        try { enhanceModalIfEligible(); } catch (e) {}
      }, 300);
    });
  })();

  setTimeout(() => {
    try { enhanceModalIfEligible(); } catch (e) {}
  }, 700);

  window.addEventListener("locationchange", () => {
    try { enhanceModalIfEligible(); } catch (e) {}
  });

  window.__pekoraEnhancer = Object.assign(window.__pekoraEnhancer || {}, {
    reloadValues: async () => { FETCHED = false; await loadKoromons(); buildNameValueMap(); },
    reScanTrades: () => enhanceModalIfEligible(),
    dataCount: () => NAME_VALUE_MAP.size,
    sample: () => Array.from(NAME_VALUE_MAP.entries()).slice(0, 20)
  });

})();
