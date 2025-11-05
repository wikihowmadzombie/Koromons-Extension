// ==UserScript==
// @name         Koromons Trading Extension
// @namespace    arz/ami
// @version      2.1
// @description  Values Show up on limiteds,User Profiles, Users Collectibles Page and Trades.
// @match        *://pekora.zip/*
// @match        *://www.Pekora.zip/*
// @match        *://*.Pekora.zip/*
// @grant        GM_xmlhttpRequest
// @icon         https://files.catbox.moe/cyolc9.png
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/wikihowmadzombie/Koromons-Extension/refs/heads/main/index.js
// @downloadURL  https://raw.githubusercontent.com/wikihowmadzombie/Koromons-Extension/refs/heads/main/index.js
// ==/UserScript==

(async function(){
  "use strict";
  const LOG = "[KoroneEnhancer]";
  function log(...args){ console.log(LOG, ...args); }


  function cleanName(name){
    if(!name || typeof name !== "string") return "";
    return name.replace(/[\u200B-\u200F\uFEFF]/g,"")
               .replace(/[^a-zA-Z0-2 0-9 ]/g," ")
               .replace(/\s+/g," ")
               .trim()
               .toLowerCase();
  }
  function formatNumber(n){
    if(n === null || n === undefined || !isFinite(Number(n))) return "N/A";
    n = Number(n);
    if(n >= 1000000) return (n/1000000).toFixed(1) + "M";
    if(n >= 1000) return (n/1000).toFixed(1) + "K";
    return n.toLocaleString();
  }
  async function fetchJSON(url){
    if(typeof GM_xmlhttpRequest === "function"){
      return new Promise((resolve,reject)=>{
        GM_xmlhttpRequest({
          method: "GET",
          url,
          headers: { Accept: "application/json" },
          onload: r => { try{ resolve(JSON.parse(r.responseText)); } catch(e){ reject(e); } },
          onerror: e => reject(e)
        });
      });
    } else {
      const r = await fetch(url, { headers: { Accept: "application/json" }});
      if(!r.ok) throw new Error("fetch failed " + r.status);
      return r.json();
    }
  }

  let valueMap = new Map();
  async function loadValues(){
    try{
      const raw = await fetchJSON("https://koromons.xyz/api/items");
      valueMap = new Map();
      if(Array.isArray(raw)){
        raw.forEach(it=>{
          const n = (it.Name ?? it.name ?? "").toString();
          if(!n) return;
          const v = (typeof it.Value !== 'undefined' ? Number(it.Value) : (typeof it.value !== 'undefined' ? Number(it.value) : 0));
          valueMap.set(cleanName(n), isFinite(v) ? v : 0);
        });
      } else if(raw && typeof raw === 'object'){
        for(const k of Object.keys(raw)){
          const v = raw[k];
          if(Array.isArray(v)){
            v.forEach(it=>{
              const n = (it.Name ?? it.name ?? "").toString();
              if(!n) return;
              const val = (typeof it.Value !== 'undefined' ? Number(it.Value) : (typeof it.value !== 'undefined' ? Number(it.value) : 0));
              valueMap.set(cleanName(n), isFinite(val) ? val : 0);
            });
          }
        }
      }
      log("value map loaded ->", valueMap.size, "entries");
    }catch(e){
      log("couldn't fetch items API:", e && e.message ? e.message : e);
      valueMap = new Map();
    }
  }
  await loadValues();

  function lookupValueForName(rawName){
    if(!rawName) return undefined;
    const name = rawName.trim();
    const cleaned = cleanName(name);
    if(valueMap.has(cleaned)) return valueMap.get(cleaned);
    const stripped = name.replace(/\(.*?\)|\[.*?\]|\{.*?\}/g,"").trim();
    const cleanedStripped = cleanName(stripped);
    if(cleanedStripped && valueMap.has(cleanedStripped)) return valueMap.get(cleanedStripped);
    return undefined;
  }

  const css = `
.pekora-value-clamp{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;white-space:normal;margin-top:6px;font-weight:300;font-family:"HCo Gotham SSm","Helvetica Neue",Helvetica,Arial,sans-serif;}
.pekora-inserted-value{margin-top:8px;z-index:99999}
.pekora-overlay{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483600;overflow:visible}
.custom-value-tag{font-family:Arial,sans-serif;display:inline-block;gap:6px;font-size:13px;padding:4px 8px;border-radius:6px;background:rgba(10,10,10,0.92);color:#e6ffed;white-space:nowrap;pointer-events:auto;user-select:none;line-height:1;position:absolute;z-index:2147483650;transform:translateX(-50%);max-width:calc(100% - 12px);box-sizing:border-box;overflow:hidden;text-overflow:ellipsis}
.custom-value-tag.small{padding:3px 6px;font-size:12px;border-radius:5px;box-shadow:none !important}
.custom-value-tag .value{color:#00e676;font-weight:700;font-size:13px}
.custom-overpay-summary{font-family:Arial,sans-serif;position:absolute;pointer-events:auto;padding:8px 10px;border-radius:8px;min-width:140px;text-align:left;font-weight:700;font-size:13px;box-shadow:0 6px 24px rgba(0,0,0,0.5);background:rgba(12,12,12,0.96);color:#ffffff;line-height:1.1;z-index:2147483650;left:8px;bottom:10px;top:auto;right:auto;transform:none;max-width:calc(100% - 16px);box-sizing:border-box}
.custom-overpay-summary .line span:first-child{ color: #ffffff; font-weight:700; }
.custom-overpay-summary .title{font-weight:800;margin-bottom:6px;font-size:14px}
.custom-overpay-summary .line{margin-top:4px;font-size:13px;display:flex;justify-content:space-between;gap:8px;font-weight:600}
.custom-overpay-summary .numbers{font-weight:900;margin-left:8px}
.custom-overpay-summary .pos{color:#7ef39a!important}
.custom-overpay-summary .neg{color:#ff7f7f!important}
.collectible-value-inline{position:absolute;left:50%;transform:translateX(-50%);bottom:6px;pointer-events:auto;font-weight:700;font-size:12px;padding:3px 6px;border-radius:6px;background:rgba(8,8,8,0.85);color:#bfffd6;z-index:2147483650;white-space:nowrap}
.total-value-added{color:#7ef39a;font-weight:800;margin-top:6px}
.pekora-inserted-value-only{display:block;margin-top:8px;z-index:999999}
.pekora-inserted-value-only p{display:inline-block;background:rgba(74,74,74,0.92);color:#fff;padding:6px 10px;border-radius:8px;font-weight:600;margin-top:6px;line-height:1.1}
.pekora-value-num{font-weight:800;color:#7ef39a}
#pekora-profile-value-inline{display:inline-block;vertical-align:middle;margin-left:10px;z-index:999999}
#pekora-profile-value-inline a{display:inline-block;text-decoration:none;padding:6px 10px;border-radius:8px;background:rgba(40,40,40,0.92);color:#fff !important;font-weight:700;border:1px solid rgba(255,255,255,0.04);}
#pekora-profile-value-inline a .pekora-value-num{color:#7ef39a;margin-left:6px;font-weight:900}
`;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  const NAME_SELECTORS = [
    ".itemHeaderContainer-0-2-45 h2",
    ".itemHeaderContainer-0-2-45 .title",
    ".item-title",
    ".item-name",
    ".detailTitle",
    ".fw-bolder",
    ".product-title",
    ".title",
  ];
  function findNameOnPage(){
    try{
      const og = document.querySelector('meta[property="og:title"]');
      if(og && og.content) return og.content.trim();
      const tw = document.querySelector('meta[name="twitter:title"]');
      if(tw && tw.content) return tw.content.trim();
      for(const s of NAME_SELECTORS){
        const el = document.querySelector(s);
        if(el){
          const text = (el.textContent || el.content || el.value || "").trim();
          if(text) return text;
        }
      }
      const headings = Array.from(document.querySelectorAll("h1,h2"));
      for(const h of headings){
        const t = (h.textContent || "").trim();
        if(t && t.length > 2 && t.length < 120) return t;
      }
      if(document.title && document.title.trim()) return document.title.trim();
    }catch(e){}
    return "";
  }

  function findImageInsertionPoint(){
    const preferred = [".item-image", ".item-media", ".itemImage-0-2-36", ".itemDisplay-0-2-20", ".itemVisualizer-0-2-55", ".thumbnail-0-2-1", ".image", ".item__media"];
    for(const s of preferred){
      try{ const el = document.querySelector(s); if(el) return el; } catch(e){}
    }
    const imgs = Array.from(document.querySelectorAll("img")).filter(img => {
      try{ if(img.offsetParent === null) return false; const nw = img.naturalWidth || img.width || 0; const nh = img.naturalHeight || img.height || 0; return Math.max(nw, nh) >= 60; }catch(e){ return false; }
    });
    if(imgs.length){
      const sorted = imgs.map(img=>{
        try{ const r = img.getBoundingClientRect(); const area = Math.max(0, r.width) * Math.max(0, r.height); const centerX = r.left + r.width/2; const leftBias = centerX < (window.innerWidth * 0.6) ? 1 : 0; return { img, area, leftBias, r }; }catch(e){ return { img, area:0, leftBias:0 }; }
      }).sort((a,b)=> (b.leftBias - a.leftBias) || (b.area - a.area));
      const cand = sorted[0];
      if(cand && cand.img){
        const parent = cand.img.closest("figure, .card, .thumbnail, .image, .item, .col, .item-media, .item-image") || cand.img.parentElement || cand.img;
        return parent;
      }
    }
    return null;
  }

  function findTitleInsertionPoint(){
    const titleSelectors = [".itemHeaderContainer-0-2-45", ".itemHeader", ".item-title", ".product-title", ".detailTitle", ".title"];
    for(const s of titleSelectors){
      try{ const el = document.querySelector(s); if(el) return el; }catch(e){}
    }
    const h = document.querySelector("h1") || document.querySelector("h2");
    if(h) return h;
    return document.querySelector("main") || document.querySelector(".page") || document.body;
  }

  function isCatalogPage(){ return /\/catalog\/\d+(?:\/|$|\?)/i.test(location.pathname); }

  const VALUE_WRAPPER_ID = "pekora-catalog-value-only";
  const VALUE_P_ID = "pekora-catalog-value-only-p";
  function buildValuePill(valueText, rawVal){
    const wrapper = document.createElement("div");
    wrapper.id = VALUE_WRAPPER_ID;
    wrapper.className = "pekora-inserted-value-only";
    wrapper.style.setProperty('display','block','important');
    wrapper.style.setProperty('margin-top','8px','important');
    wrapper.style.setProperty('z-index','999999','important');
    const p = document.createElement("p");
    p.id = VALUE_P_ID;
    p.className = "pekora-value-clamp";
    p.dataset.pekoraCatalogValue = String(rawVal ?? "");
    p.innerHTML = `<b>Value</b> <span class="pekora-value-num">${valueText}</span> <span class="icon-robux priceIcon-0-2-218 pekora-value-icon" aria-hidden="true"></span>`;
    p.style.setProperty('display','inline-block','important');
    p.style.setProperty('background','rgba(74,74,74,0.92)','important');
    p.style.setProperty('color','#ffffff','important');
    p.style.setProperty('padding','6px 10px','important');
    p.style.setProperty('border-radius','8px','important');
    p.style.setProperty('font-weight','600','important');
    p.style.setProperty('margin-top','6px','important');
    p.style.setProperty('line-height','1.1','important');
    wrapper.appendChild(p);
    return wrapper;
  }

  function removeStrayCatalogPill(){ if(isCatalogPage()) return; const stray = document.getElementById(VALUE_WRAPPER_ID); if(stray) stray.remove(); }

  async function insertValueUnderImageOnce(){
    try{
      if(!isCatalogPage()){ removeStrayCatalogPill(); return false; }
      const name = findNameOnPage();
      if(!name || !name.trim()){ log("no item name detected — aborting catalog insert"); return false; }
      const rawVal = lookupValueForName(name);
      const valueText = rawVal === undefined || rawVal === null ? "N/A" : formatNumber(rawVal);
      const existingWrapper = document.getElementById(VALUE_WRAPPER_ID);
      if(existingWrapper){
        const p = document.getElementById(VALUE_P_ID);
        if(p){
          p.dataset.pekoraCatalogValue = String(rawVal ?? "");
          const num = p.querySelector('.pekora-value-num'); if(num) num.textContent = valueText;
          ensureVisibleUpchain(existingWrapper, 6);
          log("updated catalog value pill for:", name, "->", valueText);
          return true;
        } else existingWrapper.remove();
      }
      const imageContainer = findImageInsertionPoint();
      const titleContainer = findTitleInsertionPoint();
      if(!imageContainer && !titleContainer){ log("no image or title container found — aborting insert for:", name); return false; }
      const wrapper = buildValuePill(valueText, rawVal);
      try{
        if(imageContainer){
          const tagName = (imageContainer.tagName || "").toLowerCase();
          if(tagName === "img") (imageContainer.parentElement || document.body).appendChild(wrapper); else imageContainer.appendChild(wrapper);
          ensureVisibleUpchain(wrapper, 6);
          log("inserted catalog value under image for:", name, "->", valueText);
        } else {
          if(titleContainer && titleContainer.parentElement) titleContainer.insertAdjacentElement("afterend", wrapper);
          else (document.querySelector("main") || document.body).insertAdjacentElement("afterbegin", wrapper);
          ensureVisibleUpchain(wrapper, 6);
          log("inserted catalog value near title for:", name, "->", valueText);
        }
      }catch(e){
        try{ document.body.appendChild(wrapper); ensureVisibleUpchain(wrapper, 6); }catch(e){}
        log("fallback inserted catalog value for:", name, "->", valueText);
      }
      return true;
    }catch(e){ console.error(LOG, "insertValueUnderImageOnce error", e); return false; }
  }

  function tryInsertValueWithRetries(maxAttempts = 14, intervalMs = 450){
    let attempts = 0;
    const id = setInterval(async ()=>{
      attempts++;
      try{
        const ok = await insertValueUnderImageOnce();
        if(ok || attempts >= maxAttempts){ clearInterval(id); if(!ok) log("value insertion gave up after", attempts, "attempts"); }
      }catch(e){ console.error(LOG, "tryInsertValueWithRetries err", e); if(attempts >= maxAttempts) clearInterval(id); }
    }, intervalMs);
    return ()=> clearInterval(id);
  }
  function ensureVisibleUpchain(el, levels = 6){ let cur = el; let depth = 0; while(cur && cur !== document.body && depth < levels){ try{ const cs = window.getComputedStyle(cur); if(cs.overflow && cs.overflow !== 'visible') cur.style.setProperty('overflow','visible','important'); if(cs.visibility && cs.visibility !== 'visible') cur.style.setProperty('visibility','visible','important'); if(cs.display && cs.display === 'none') cur.style.setProperty('display','block','important'); }catch(e){} cur = cur.parentElement; depth++; } }

  function ensureOverlayFor(parent){
    if(!parent) return null;
    try { const cs = window.getComputedStyle(parent); if(cs.position === "static") parent.style.position = "relative"; } catch(e){}
    if(parent._pekora_overlay && parent._pekora_overlay instanceof Element) return parent._pekora_overlay;
    const ov = document.createElement("div");
    ov.className = "pekora-overlay";
    ov.style.pointerEvents = "none";
    ov.style.position = "absolute";
    ov.style.top = "0";
    ov.style.left = "0";
    ov.style.width = "100%";
    ov.style.height = "100%";
    ov.style.overflow = "visible";
    try{ parent.appendChild(ov); }catch(e){ document.body.appendChild(ov); }
    parent._pekora_overlay = ov;
    return ov;
  }
  function ensureModalId(modal){
    if(!modal) return "";
    if(modal._pekora_id) return modal._pekora_id;
    if(!window.__pekora_modal_counter) window.__pekora_modal_counter = 1;
    modal._pekora_id = `pekora_modal_${Date.now()}_${(window.__pekora_modal_counter++)}`;
    return modal._pekora_id;
  }
  function clearBoxTags(overlay, modalId){
    if(!overlay) return;
    const boxes = Array.from(overlay.children).filter(c => c.dataset && c.dataset.pekoraModal === modalId && c.dataset.pekoraSrcType === 'box');
    boxes.forEach(n => n.remove());
  }
  function createValueTag(text, normalizedName, src){
    const el = document.createElement("div");
    el.className = "custom-value-tag small";
    el.style.position = "absolute";
    el.style.display = "none";
    const v = document.createElement("div"); v.className = "value"; v.textContent = text; el.appendChild(v);
    if(normalizedName) el.dataset.pekoraName = normalizedName;
    if(src) el.dataset.pekoraSrc = src;
    return el;
  }
  function positionTagForBox(tagEl, boxEl, modalEl){
    if(!tagEl || !boxEl || !modalEl) return;
    const rect = boxEl.getBoundingClientRect();
    const modalRect = modalEl.getBoundingClientRect();
    if(rect.width === 0 && rect.height === 0){ tagEl.style.display = "none"; return; }
    tagEl.style.display = "";
    const leftCenter = (rect.left - modalRect.left) + rect.width/2;
    const top = (rect.bottom - modalRect.top) + 6;
    tagEl.style.left = `${Math.round(leftCenter)}px`;
    tagEl.style.top = `${Math.round(top)}px`;
    tagEl.style.maxWidth = `${Math.max(80, Math.min(260, Math.round(rect.width * 1.2)))}px`;
    tagEl.style.overflow = "hidden";
    tagEl.style.textOverflow = "ellipsis";
    tagEl.style.whiteSpace = "nowrap";
  }
  function findTradeModal(){
    const candidates = [".col-9", ".TradeRequest", ".innerSection-0-2-123", ".trade-modal", ".trade-window", ".modal", '[role="dialog"]'];
    for(const s of candidates){
      const el = document.querySelector(s);
      if(el && el.querySelector && el.querySelector("img")) return el;
    }
    const maybe = Array.from(document.querySelectorAll('[role="dialog"], .modal, .panel, .popup'));
    for(const c of maybe){
      try{
        const txt = (c.textContent||"").toLowerCase();
        if(txt.includes("items you gave") || txt.includes("trade request") || c.querySelector("img")) return c;
      }catch(e){}
    }
    return null;
  }
  function gatherItemBoxes(modal){
    if(!modal) return [];
    const strict = (() => {
      const rows = Array.from(modal.querySelectorAll(".row.ms-1.mb-4"));
      const boxes = [];
      for(const row of rows){
        const found = Array.from(row.querySelectorAll(".col-0-2-133"));
        if(found.length) found.forEach(f => boxes.push(f));
      }
      return boxes;
    })();
    if(strict.length) return strict;
    const boxes = [];
    const imgs = Array.from(modal.querySelectorAll("img"));
    for(const img of imgs){
      try{
        const src = (img.src||"").toLowerCase();
        const nw = img.naturalWidth || img.width || 0;
        const nh = img.naturalHeight || img.height || 0;
        if(Math.max(nw,nh) < 16) continue;
        if(src.includes("avatar") || src.includes("profile")) continue;
        if(!(src.includes("thumbnail") || src.includes("thumbnails") || src.includes("/catalog/") || src.includes("asset") || img.offsetParent !== null)) continue;
        const box = img.closest(".col-0-2-133") || img.closest(".card") || img.closest(".item") || img.closest("a") || img.parentElement;
        if(box && !boxes.includes(box)) boxes.push(box);
      }catch(e){}
    }
    const anchors = Array.from(modal.querySelectorAll('a[href*="/catalog/"], a[href*="/catalog"]'));
    for(const a of anchors){
      const box = a.closest(".col-0-2-133") || a.closest(".card") || a.parentElement;
      if(box && !boxes.includes(box)) boxes.push(box);
    }
    return boxes;
  }
  function findNameInBox(box){
    if(!box) return "";
    const isLabelish = txt => {
      if(!txt) return true;
      const low = txt.toLowerCase();
      if(low.startsWith("value") || low.startsWith("items you") || low.includes("none")) return true;
      return false;
    };
    const tries = ["a[href*='/catalog/']", ".itemName-0-2-135 a", ".itemName a", ".item-name a", ".itemTitle a", "p.fw-bolder", "p", "div"];
    for(const s of tries){
      try{
        const el = box.querySelector(s);
        if(el && el.textContent){
          const t = el.textContent.trim();
          if(t.length && !isLabelish(t)) return t;
        }
      }catch(e){}
    }
    const img = box.querySelector && box.querySelector("img");
    if(img){
      if(img.alt && img.alt.trim() && !isLabelish(img.alt)) return img.alt.trim();
      if(img.title && img.title.trim() && !isLabelish(img.title)) return img.title.trim();
    }
    const full = (box.textContent||"").trim();
    if(!full) return "";
    const lines = full.split('\n').map(l=>l.trim()).filter(Boolean);
    for(const line of lines) if(!isLabelish(line)) return line;
    return "";
  }

  function attachModalReinserter(modal, callback){
    try{
      if(modal._pekora_mut && modal._pekora_mut instanceof MutationObserver) return;
      const mo = new MutationObserver((muts)=>{
        let removedOur = false;
        let added = false;
        for(const m of muts){
          if(m.removedNodes && m.removedNodes.length){
            for(const n of m.removedNodes){
              if(n && n.dataset && n.dataset.pekoraModal) removedOur = true;
            }
          }
          if(m.addedNodes && m.addedNodes.length) added = true;
        }
        if(removedOur || added){
          if(modal.__pekora_reinsert_timer) clearTimeout(modal.__pekora_reinsert_timer);
          modal.__pekora_reinsert_timer = setTimeout(()=> { try{ callback(modal); }catch(e){} }, 120);
        }
      });
      mo.observe(modal, { childList:true, subtree:true });
      modal._pekora_mut = mo;
    }catch(e){}
  }

  function enhanceModal(modal){
    if(!modal) return 0;
    ensureModalId(modal);
    const overlay = ensureOverlayFor(modal);
    modal._pekora_overlay = overlay;

    clearBoxTags(overlay, modal._pekora_id);

    const boxes = gatherItemBoxes(modal);
    log("candidate boxes for modal:", boxes.length);
    let inserted = 0;

    for(const box of boxes){
      try {
        const name = findNameInBox(box);
        if(!name){ log("no name found for a box, skipping"); continue; }
        const normalizedName = cleanName(name);

        let thumbSrc = "";
        const img = box.querySelector("img");
        if(img && (img.src || img.getAttribute('data-src'))) thumbSrc = (img.src || img.getAttribute('data-src') || "").split('?')[0];

        const existsByNameOrSrc = Array.from(overlay.children).some(c => c.dataset && c.dataset.pekoraModal === modal._pekora_id && (c.dataset.pekoraName === normalizedName || (thumbSrc && c.dataset.pekoraSrc === thumbSrc)));
        if(existsByNameOrSrc) continue;

        const value = lookupValueForName(name);
        if(value === undefined || value === null) continue;

        const valueText = formatNumber(value);

        const tag = createValueTag(valueText, normalizedName, thumbSrc);
        tag.dataset.pekoraModal = modal._pekora_id;
        tag.dataset.pekoraSrcType = "box";
        Object.defineProperty(tag, "_pekora_src_element", { value: box, configurable:true });

        try { box.dataset.pekoraEnhancedFor = modal._pekora_id; box.dataset.pekoraValue = String(Number(value) || 0); } catch(e){}

        overlay.appendChild(tag);
        positionTagForBox(tag, box, modal);
        inserted++;
      } catch(err){ console.error(LOG,"enhanceModal error", err); }
    }

    const modalBoxes = Array.from(modal.querySelectorAll('[data-pekora-enhanced-for]')).filter(b => b.dataset.pekoraEnhancedFor === modal._pekora_id);
    let giveTotal = 0, receiveTotal = 0;
    const rows = Array.from(modal.querySelectorAll(".row.ms-1.mb-4"));
    if(modalBoxes.length){
      modalBoxes.forEach((b) => {
        const v = Number(b.dataset.pekoraValue) || 0;
        const contRow = b.closest(".row.ms-1.mb-4");
        if(contRow){
          const idx = rows.indexOf(contRow);
          if(idx > 0) receiveTotal += v; else giveTotal += v;
        } else giveTotal += v;
      });
    } else {
      const tags = Array.from(overlay.children).filter(c => c.dataset && c.dataset.pekoraModal === modal._pekora_id && c.dataset.pekoraSrcType === 'box');
      if(tags.length){
        for(let i=0;i<tags.length;i++){
          const src = tags[i]._pekora_src_element;
          const v = src && src.dataset ? Number(src.dataset.pekoraValue) || 0 : 0;
          if(i < tags.length/2) giveTotal += v; else receiveTotal += v;
        }
      }
    }

    const oldSummary = Array.from(overlay.children).find(c => c.dataset && c.dataset.pekoraModal === modal._pekora_id && c.dataset.pekoraSrcType === 'modal-summary');
    if(oldSummary) oldSummary.remove();

    const overpay = receiveTotal - giveTotal;
    const summary = document.createElement("div");
    summary.className = "custom-overpay-summary";
    summary.style.position = "absolute";
    summary.style.display = "none";
    summary.dataset.pekoraModal = modal._pekora_id;
    summary.dataset.pekoraSrcType = 'modal-summary';
    const title = document.createElement('div'); title.className = 'title';
    title.textContent = overpay === 0 ? 'Fair Trade' : (overpay > 0 ? `+${formatNumber(overpay)}` : `${formatNumber(overpay)}`);
    if(overpay > 0) title.classList.add('pos'); else if(overpay < 0) title.classList.add('neg');
    summary.appendChild(title);
    const youLine = document.createElement('div'); youLine.className = 'line';
    youLine.innerHTML = `<span>You're offering</span><span class="numbers">${formatNumber(giveTotal)}</span>`;
    if(overpay < 0) youLine.querySelector('.numbers').classList.add('neg'); else if(overpay > 0) youLine.querySelector('.numbers').classList.add('pos');
    summary.appendChild(youLine);
    const themLine = document.createElement('div'); themLine.className = 'line';
    themLine.innerHTML = `<span>They're offering</span><span class="numbers">${formatNumber(receiveTotal)}</span>`;
    if(overpay > 0) themLine.querySelector('.numbers').classList.add('pos'); else if(overpay < 0) themLine.querySelector('.numbers').classList.add('neg');
    summary.appendChild(themLine);

    overlay.appendChild(summary);

    attachModalReinserter(modal, (m)=> { try{ clearBoxTags(m._pekora_overlay, m._pekora_id); enhanceModal(m); }catch(e){} });

    requestReposition();
    log("enhanceModal inserted tags:", inserted, "giveTotal:", giveTotal, "receiveTotal:", receiveTotal, "overpay:", overpay);
    return inserted;
  }

  function findCollectibleCards(){
    const container = document.querySelector('main, .container, body') || document.body;
    const imgs = Array.from(container.querySelectorAll('img')).filter(img => {
      try{
        if(img.offsetParent === null) return false;
        const nw = img.naturalWidth || img.width || 0;
        const nh = img.naturalHeight || img.height || 0;
        return Math.max(nw, nh) >= 24;
      }catch(e){ return false; }
    });
    const set = new Set();
    for(const img of imgs){
      const src = (img.src||"").toLowerCase();
      if(src.includes('avatar') || src.includes('profile')) continue;
      const card = img.closest('.card') || img.closest('.col') || img.closest('a') || img.parentElement;
      if(card) set.add(card);
    }
    return Array.from(set);
  }

  function enhanceCollectiblesPage(){
    try {
      if(!/collectibles/i.test(location.pathname)) return;
      const container = document.querySelector('.container') || document.body;
      ensureOverlayFor(container);
      const cards = findCollectibleCards();
      let totalValue = 0;
      let seen = 0;
      for(const card of cards){
        try {
          const nameEl = card.querySelector('p.fw-bolder, p, h3, h4, h5, .title');
          const name = nameEl ? (nameEl.textContent || '').trim() : '';
          if(!name) continue;

          const prev = card.querySelector('.collectible-value-inline');
          if(prev) prev.remove();

          const value = lookupValueForName(name);
          const display = (value === undefined || value === null) ? "N/A" : formatNumber(value);

          const inline = document.createElement('div');
          inline.className = 'collectible-value-inline';
          inline.textContent = display;
          inline.setAttribute('aria-hidden','true');
          inline.dataset.pekoraValue = String(Number(value) || 0);
          try{ const cs = window.getComputedStyle(card); if(cs.position === 'static') card.style.position = 'relative'; }catch(e){}
          card.appendChild(inline);

          totalValue += Number(value) || 0;
          seen++;
        } catch(e){}
      }
      const totalRapEl = document.querySelector('.col-12.col-lg-3 p.fw-bolder') || Array.from(document.querySelectorAll('p.fw-bolder')).find(p=>/total rap/i.test(p.textContent||''));
      if(totalRapEl){
        const prevTotal = totalRapEl.parentElement && totalRapEl.parentElement.querySelector('.total-value-added');
        if(prevTotal) prevTotal.remove();
        const totalValueEl = document.createElement('p');
        totalValueEl.className = 'total-value-added';
        totalValueEl.textContent = `Total Value: ${formatNumber(totalValue)}`;
        totalRapEl.parentElement.appendChild(totalValueEl);
      }
    } catch(e){ console.error(LOG, "enhanceCollectiblesPage err", e); }
  }

  function requestRepositionFactory(){
    let pending = false;
    return function requestReposition(){
      if(pending) return;
      pending = true;
      requestAnimationFrame(()=>{ pending = false; repositionAll(); });
    };
  }
  const requestReposition = requestRepositionFactory();
  window.addEventListener('resize', requestReposition, { passive:true });
  window.addEventListener('scroll', requestReposition, { passive:true });
  const repositionInterval = setInterval(requestReposition, 800);

  function repositionAll(){
    const overlays = Array.from(document.querySelectorAll('.pekora-overlay'));
    for(const ov of overlays){
      const parent = ov.parentElement;
      if(!parent) continue;
      for(const child of Array.from(ov.children)){
        try {
          const type = child.dataset.pekoraSrcType;
          const src = child._pekora_src_element;
          if(type === 'box'){
            positionTagForBox(child, src, parent);
          } else if(type === 'modal-summary'){
            const modalRect = parent.getBoundingClientRect();
            if(modalRect.width === 0 && modalRect.height === 0){ child.style.display='none'; continue; }
            child.style.display = "";
            let sW = child.offsetWidth || 160;
            let sH = child.offsetHeight || 64;
            const outsideLeftCandidate = modalRect.left - sW - 12 + window.scrollX;
            const minViewportX = 6 + window.scrollX;
            if(outsideLeftCandidate >= minViewportX){
              child.style.position = "absolute";
              child.style.left = `${Math.round(-sW - 12)}px`;
              let preferredTop = Math.round((modalRect.height - sH)/2 + 120);
              const maxTop = Math.max(6, Math.round(modalRect.height - sH - 6));
              if(preferredTop < 6) preferredTop = 6;
              if(preferredTop > maxTop) preferredTop = maxTop;
              child.style.top = `${preferredTop}px`;
              child.style.right = "unset";
              child.style.bottom = "unset";
              child.style.transform = "none";
            } else {
              const insetX = 12;
              const insetY = 20;
              child.style.position = "absolute";
              child.style.left = `${insetX}px`;
              child.style.bottom = `${insetY}px`;
              child.style.top = "unset";
              child.style.right = "unset";
              child.style.transform = "none";
            }
          }
        } catch(e){}
      }
    }
  }

  (function hijackHistory(){
    const _push = history.pushState;
    history.pushState = function(){
      _push.apply(this, arguments);
      window.dispatchEvent(new Event("locationchange"));
    };
    window.addEventListener("popstate", ()=> window.dispatchEvent(new Event("locationchange")));
    window.addEventListener("locationchange", () => {
      log("location changed ->", location.href);
      setTimeout(()=> {
        if(isCatalogPage()) tryInsertValueWithRetries(12, 400);
        const modal = findTradeModal(); if(modal) enhanceModal(modal);
        enhanceCollectiblesPage();
        startProfileInsertRetries();
      }, 350);
    });
  })();

  const globalMO = new MutationObserver((muts)=>{
    let added = 0;
    for(const m of muts) if(m.addedNodes && m.addedNodes.length) added += m.addedNodes.length;
    if(added>0){
      if(window.__pekoraDeb) clearTimeout(window.__pekoraDeb);
      window.__pekoraDeb = setTimeout(()=>{
        const modal = findTradeModal();
        if(modal) enhanceModal(modal);
        enhanceCollectiblesPage();
        if(isCatalogPage()) tryInsertValueWithRetries(8, 400);
        startProfileInsertRetries();
      }, 160);
    }
  });
  globalMO.observe(document, { childList: true, subtree: true });


  function getProfileUserIdFromDom(){
    let m = location.pathname.match(/\/player\/(\d+)/i) || location.pathname.match(/\/users\/(\d+)(?:\/|$)/i);
    if(m) return m[1];
    const a = document.querySelector('a[href*="/player/"], a[href*="/users/"], a[href*="playerId="], a[href*="userId="]');
    if(a){
      const href = a.getAttribute('href') || "";
      const mm = href.match(/playerId=(\d+)/i) || href.match(/userId=(\d+)/i) || href.match(/\/player\/(\d+)/i) || href.match(/\/users\/(\d+)/i);
      if(mm) return mm[1];
    }
    return null;
  }

  function isProfilePage(){
    const p = location.pathname || "";
    return /\/users\/\d+\/profile/i.test(p) || /\/player\/\d+/.test(p);
  }

  function findUsernameElement(){
    const selectors = [
      '.username','.profile-username','.display-name','h1.username','h1.display-name','h1','h2'
    ];
    for(const sel of selectors){
      const el = document.querySelector(sel);
      if(el && el.textContent.trim()) return el;
    }
    return null;
  }

  async function fetchLatestPlayerSnapshot(userId){
    if(!userId) return null;
    const url = `https://koromons.xyz/api/users/${encodeURIComponent(userId)}`;
    try{
      const data = await fetchJSON(url);
      if(!data) return null;
      return {
        value: Number(data.totalValue) || 0,
        rank: data.leaderboardRank || null,
        _raw: data
      };
    }catch(e){
      log("fetchLatestPlayerSnapshot error", e && e.message ? e.message : e);
      return null;
    }
  }

  function insertAfter(refNode, newNode){
    if(refNode && refNode.parentNode)
      refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
    else document.body.appendChild(newNode);
  }

  async function ensureProfileValueBox(){
    try{
      if(!isProfilePage()){
        const ex = document.getElementById('pekora-profile-value-inline');
        if(ex) ex.remove();
        return false;
      }

      const userId = getProfileUserIdFromDom();
      if(!userId) return false;

      const data = await fetchLatestPlayerSnapshot(userId);
      const valueNum = data ? Number(data.value) || 0 : null;
      const rankNum = data ? data.rank : null;
      const displayVal = valueNum === null ? "N/A" : formatNumber(valueNum);
      const displayRank = rankNum ? `#${rankNum}` : "N/A";

      const usernameEl = findUsernameElement();
      const existing = document.getElementById('pekora-profile-value-inline');

      if(existing){
        existing.dataset.pekoraUserid = userId;
        const a = existing.querySelector('a');
        if(a){
          a.href = `https://koromons.xyz/player/${encodeURIComponent(userId)}`;
          const spanVal = a.querySelector('.pekora-value-num.value-num');
          if(spanVal) spanVal.textContent = `${displayVal} | Rank: ${displayRank}`;
        }
        return true;
      }

      const wrapper = document.createElement('div');
      wrapper.id = 'pekora-profile-value-inline';
      wrapper.dataset.pekoraUserid = userId;
      const a = document.createElement('a');
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.href = `https://koromons.xyz/player/${encodeURIComponent(userId)}`;
      a.title = "Open koromons profile";
      a.innerHTML = `<b>Value</b> <span class="pekora-value-num value-num">${displayVal} | Rank: ${displayRank}</span>`;
      wrapper.appendChild(a);

      if(usernameEl) insertAfter(usernameEl, wrapper);
      else document.body.appendChild(wrapper);
      return true;
    }catch(e){
      console.error(LOG,"ensureProfileValueBox err", e);
      return false;
    }
  }

  let __profile_retry_timer = null;
  function startProfileInsertRetries(maxAttempts = 12, intervalMs = 600){
    if(!isProfilePage()){
      const ex = document.getElementById('pekora-profile-value-inline');
      if(ex) ex.remove();
      return;
    }
    let attempts = 0;
    if(__profile_retry_timer) clearInterval(__profile_retry_timer);
    __profile_retry_timer = setInterval(async ()=>{
      attempts++;
      const ok = await ensureProfileValueBox();
      if(ok || attempts >= maxAttempts){
        clearInterval(__profile_retry_timer);
        __profile_retry_timer = null;
      }
    }, intervalMs);
  }

  setTimeout(()=>{ if(isCatalogPage()) tryInsertValueWithRetries(12, 400); const m=findTradeModal(); if(m) enhanceModal(m); enhanceCollectiblesPage(); startProfileInsertRetries(); }, 700);
  setTimeout(()=>{ if(isCatalogPage()) tryInsertValueWithRetries(8, 600); const m=findTradeModal(); if(m) enhanceModal(m); enhanceCollectiblesPage(); startProfileInsertRetries(); }, 1600);
  setTimeout(()=>{ if(isCatalogPage()) tryInsertValueWithRetries(4, 1000); }, 4000);

  window.__pekoraEnhancer = {
    reScan: ()=> { if(isCatalogPage()) tryInsertValueWithRetries(8, 400); const m = findTradeModal(); if(m) { clearBoxTags(m._pekora_overlay, m._pekora_id); enhanceModal(m); } enhanceCollectiblesPage(); },
    reloadValues: async ()=> { await loadValues(); if(isCatalogPage()) tryInsertValueWithRetries(8,400); },
    dataCount: ()=> valueMap.size,
    sample: ()=> Array.from(valueMap.entries()).slice(0,12),
    ensureProfile: ensureProfileValueBox,
    startProfileRetries: startProfileInsertRetries
  };

  window.addEventListener("beforeunload", ()=>{ try{ if(repositionInterval) clearInterval(repositionInterval); globalMO.disconnect(); }catch(e){} });
  setInterval(removeStrayCatalogPill, 2500);

  log("KoroneEnhancer ready");
})();

(async function(){
  "use strict";
  const LOG = "[KoroneEnhancer]";
  function log(...args){ console.log(LOG, ...args); }

  function cleanName(name){
    if(!name || typeof name !== "string") return "";
    return name.replace(/[\u200B-\u200F\uFEFF]/g,"")
               .replace(/[^a-zA-Z0-2 0-9 ]/g," ")
               .replace(/\s+/g," ")
               .trim()
               .toLowerCase();
  }
  function formatNumber(n){
    if(n === null || n === undefined || !isFinite(Number(n))) return "N/A";
    n = Number(n);
    if(n >= 1000000) return (n/1000000).toFixed(1) + "M";
    if(n >= 1000) return (n/1000).toFixed(1) + "K";
    return n.toLocaleString();
  }
  async function fetchJSON(url){
    if(typeof GM_xmlhttpRequest === "function"){
      return new Promise((resolve,reject)=>{
        GM_xmlhttpRequest({
          method: "GET",
          url,
          headers: { Accept: "application/json" },
          onload: r => { try{ resolve(JSON.parse(r.responseText)); } catch(e){ reject(e); } },
          onerror: e => reject(e)
        });
      });
    } else {
      const r = await fetch(url, { headers: { Accept: "application/json" }});
      if(!r.ok) throw new Error("fetch failed " + r.status);
      return r.json();
    }
  }

  let valueMap = new Map();
  async function loadValues(){
    try{
      const raw = await fetchJSON("https://koromons.xyz/api/items");
      valueMap = new Map();
      if(Array.isArray(raw)){
        raw.forEach(it=>{
          const n = (it.Name ?? it.name ?? "").toString();
          if(!n) return;
          const v = (typeof it.Value !== 'undefined' ? Number(it.Value) : (typeof it.value !== 'undefined' ? Number(it.value) : 0));
          valueMap.set(cleanName(n), isFinite(v) ? v : 0);
        });
      } else if(raw && typeof raw === 'object'){
        for(const k of Object.keys(raw)){
          const v = raw[k];
          if(Array.isArray(v)){
            v.forEach(it=>{
              const n = (it.Name ?? it.name ?? "").toString();
              if(!n) return;
              const val = (typeof it.Value !== 'undefined' ? Number(it.Value) : (typeof it.value !== 'undefined' ? Number(it.value) : 0));
              valueMap.set(cleanName(n), isFinite(val) ? val : 0);
            });
          }
        }
      }
      log("value map loaded ->", valueMap.size, "entries");
    }catch(e){
      log("couldn't fetch items API:", e && e.message ? e.message : e);
      valueMap = new Map();
    }
  }
  await loadValues();


  function lookupValueForName(rawName){
    if(!rawName) return undefined;
    const name = String(rawName).trim();
    const cleaned = cleanName(name);
    if(valueMap.has(cleaned)) return valueMap.get(cleaned);

    const stripped = name.replace(/\(.*?\)|\[.*?\]|\{.*?\}/g,"").trim();
    const cleanedStripped = cleanName(stripped);
    if(cleanedStripped && valueMap.has(cleanedStripped)) return valueMap.get(cleanedStripped);

    // substring & approximate match
    for(const [k,v] of valueMap.entries()){
      if(!k) continue;
      if(k === cleaned) return v;
      if(k.length > 3 && cleaned.includes(k)) return v;
      if(cleaned.length > 3 && k.includes(cleaned)) return v;
      // try first two words
      const kWords = k.split(' ').slice(0,2).join(' ');
      if(kWords && cleaned.includes(kWords)) return v;
    }
    return undefined;
  }

  const css = `
.pekora-value-clamp{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;white-space:normal;margin-top:6px;font-weight:300;font-family:"HCo Gotham SSm","Helvetica Neue",Helvetica,Arial,sans-serif;}
.pekora-inserted-value{margin-top:8px;z-index:99999}
.pekora-overlay{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483600;overflow:visible}
.custom-value-tag{font-family:Arial,sans-serif;display:inline-block;gap:6px;font-size:13px;padding:4px 8px;border-radius:6px;background:rgba(10,10,10,0.92);color:#e6ffed;white-space:nowrap;pointer-events:auto;user-select:none;line-height:1;position:absolute;z-index:2147483650;transform:translateX(-50%);max-width:calc(100% - 12px);box-sizing:border-box;overflow:hidden;text-overflow:ellipsis}
.custom-value-tag.small{padding:3px 6px;font-size:12px;border-radius:5px;box-shadow:none !important}
.custom-value-tag .value{color:#00e676;font-weight:700;font-size:13px}
.custom-overpay-summary{font-family:Arial,sans-serif;position:fixed;pointer-events:auto;padding:8px 10px;border-radius:8px;min-width:140px;text-align:left;font-weight:700;font-size:13px;box-shadow:0 6px 24px rgba(0,0,0,0.5);background:rgba(12,12,12,0.96);color:#ffffff;line-height:1.1;z-index:2147483650;left:8px;bottom:10px;top:auto;right:auto;transform:none;max-width:calc(100% - 16px);box-sizing:border-box}
.custom-overpay-summary .line span:first-child{ color: #ffffff; font-weight:700; }
.custom-overpay-summary .title{
  font-weight:800;
  margin-bottom:6px;
  font-size:14px;
  color:#ffffff !important;
}
.custom-overpay-summary .line{margin-top:4px;font-size:13px;display:flex;justify-content:space-between;gap:8px;font-weight:600}
.custom-overpay-summary .numbers{
  font-weight:900;
  margin-left:8px;
  color:#ffffff !important;
}
.custom-overpay-summary .pos{color:#7ef39a!important}
.custom-overpay-summary .neg{color:#ff7f7f!important}
.collectible-value-inline{position:absolute;left:50%;transform:translateX(-50%);bottom:6px;pointer-events:auto;font-weight:700;font-size:12px;padding:3px 6px;border-radius:6px;background:rgba(8,8,8,0.85);color:#bfffd6;z-index:2147483650;white-space:nowrap}
.trade-value-pill{display:inline-block;margin-top:6px;text-align:center;font-weight:800;font-size:12px;padding:4px 8px;border-radius:6px;background:rgba(7,7,7,0.92);color:#bfffd6;z-index:2147483650;white-space:nowrap}
.trade-tooltip{position:fixed;padding:6px 8px;border-radius:6px;background:rgba(10,10,10,0.96);color:#fff;font-weight:700;font-size:13px;z-index:2147483750;pointer-events:none;transform:translate(-50%, -8px);white-space:nowrap}`
;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);


  let tradeTooltip = null;
  function showTooltip(text, pageX, pageY){
    hideTooltip();
    tradeTooltip = document.createElement('div');
    tradeTooltip.className = 'trade-tooltip';
    tradeTooltip.textContent = text;
    document.body.appendChild(tradeTooltip);
    if(typeof pageX === 'number') tradeTooltip.style.left = pageX + 'px';
    if(typeof pageY === 'number') tradeTooltip.style.top = (pageY - 18) + 'px';
  }
  function moveTooltip(pageX, pageY){
    if(!tradeTooltip) return;
    tradeTooltip.style.left = pageX + 'px';
    tradeTooltip.style.top = (pageY - 18) + 'px';
  }
  function hideTooltip(){
    if(tradeTooltip){ try{ tradeTooltip.remove(); }catch(e){} tradeTooltip = null; }
  }


  const MODERN_ITEM_CARD = ".itemCard-0-2-134";
  const MODERN_ITEM_NAME = ".itemName-0-2-143";
  const MODERN_ITEM_IMAGE = ".image-0-2-146";

  function isLikelyThumbnail(img){
    if(!img) return false;
    try{
      if(img.offsetParent === null) return false;
      const src = (img.src || "").toLowerCase();
      const nw = img.naturalWidth || img.width || 0;
      const nh = img.naturalHeight || img.height || 0;
      if(Math.max(nw, nh) < 12) return false;
      if(src.includes('avatar') || src.includes('profile')) return false;
      if(src.includes('/catalog/') || src.includes('thumbnail') || src.includes('thumbnails') || src.includes('/asset') || /\d{4,}/.test(src)) return true;
      return true;
    }catch(e){ return false; }
  }

  function findTradeLeftContainers(){
    const texts = Array.from(document.querySelectorAll('h1,h2,h3,h4,p,div,span')).filter(n => {
      try{ const t = (n.textContent||"").trim().toLowerCase(); return t.startsWith('your offer') || t.startsWith('your request'); }catch(e){return false;}
    });
    if(texts.length){
      const first = texts[0];
      const container = first.closest('.col-3, .col-md-3, .leftColumn, .offerRequestCard-0-2-34') || first.parentElement;
      return container;
    }
    const all = Array.from(document.querySelectorAll('body *')).find(el => {
      try{ const txt = (el.textContent||"").toLowerCase(); return txt.includes('your offer') && txt.includes('your request'); }catch(e){return false;}
    });
    if(all) return all;
    return null;
  }

  function findInventoryContainers(){
    let myInv = null, partnerInv = null;
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,p,div,span')).filter(n => {
      try{ const t = (n.textContent||"").trim().toLowerCase(); return /my inventory|partner's inventory|partners inventory|partner inventory/.test(t); }catch(e){return false;}
    });
    for(const h of headings){
      const txt = (h.textContent||"").trim().toLowerCase();
      if(/my inventory/.test(txt) && !myInv) myInv = h.closest('section, .inventory, .col, .container, .panel') || h.parentElement;
      if (/partner/.test(txt) && !partnerInv) partnerInv = h.closest('section, .inventory, .col, .container, .panel') || h.parentElement;
    }
    if(!myInv || !partnerInv){
      myInv = myInv || document.querySelector('.myInventory, #MyInventory, .inventoryList, .inventoryContainer') || null;
      partnerInv = partnerInv || document.querySelector('.partnerInventory, #PartnerInventory, .otherInventory, .friendInventory') || null;
    }
    return { myInv, partnerInv };
  }


  function readNameFromCardElement(el){
    if(!el) return "";
    try{
      const nameAnchor = el.querySelector && (el.querySelector('.itemName-0-2-143 a, .itemName a, .item-name a, a[title], a[href*="/catalog/"]'));
      if(nameAnchor && nameAnchor.textContent && nameAnchor.textContent.trim()) return nameAnchor.textContent.trim();

      const nameElem = el.querySelector && (el.querySelector('.itemName-0-2-143, .itemName, .item-name, .title, p.fw-bolder, h4, h5'));
      if(nameElem && nameElem.textContent && nameElem.textContent.trim()) return nameElem.textContent.trim();

      const img = el.querySelector && (el.querySelector('img') || el.querySelector('image'));
      if(img){
        if(img.alt && img.alt.trim()) return img.alt.trim();
        if(img.title && img.title.trim()) return img.title.trim();
      }

      if(el.parentElement){
        const siblingsText = Array.from(el.parentElement.childNodes).map(n => (n.textContent||'').trim()).filter(Boolean);
        if(siblingsText.length){
          for(const s of siblingsText){
            if(s.length > 1 && s.length < 80 && !/value|page|category|enter amount|send request/i.test(s)) return s;
          }
        }
      }

      const txt = (el.textContent||"").trim();
      if(txt && txt.length < 120) {
        const lines = txt.split('\n').map(l=>l.trim()).filter(Boolean);
        for(const l of lines) if(l && !/value|enter amount|send request|page/i.test(l)) return l;
      }
    }catch(e){}
    return "";
  }


  function createOrUpdatePillForImage(imgEl, value){
    if(!imgEl) return null;
    try{
      let attachTo = imgEl.closest('.itemCard-0-2-134') || imgEl.closest('.itemColEntry-0-2-133') || imgEl.closest('td') || imgEl.parentElement || imgEl;
      const existing = attachTo.querySelector && attachTo.querySelector('.trade-value-pill');
      const display = (value === undefined || value === null) ? "N/A" : formatNumber(value);
      if(existing){
        existing.textContent = display;
        existing.dataset.pekoraValue = String(Number(value) || 0);
        return existing;
      }
      const pill = document.createElement('div');
      pill.className = 'trade-value-pill';
      pill.textContent = display;
      pill.dataset.pekoraValue = String(Number(value) || 0);

      pill.addEventListener('mouseenter', (ev)=> showTooltip((value === undefined || value === null) ? "N/A" : `${formatNumber(value)} R$`, ev.pageX, ev.pageY));
      pill.addEventListener('mousemove', (ev)=> moveTooltip(ev.pageX, ev.pageY));
      pill.addEventListener('mouseleave', hideTooltip);

imgEl.addEventListener('mouseenter', (ev) =>
  showTooltip((value === undefined || value === null) ? "N/A" : `${formatNumber(value)} R$`, ev.pageX, ev.pageY)
);
      imgEl.addEventListener('mousemove', (ev)=> moveTooltip(ev.pageX, ev.pageY));
      imgEl.addEventListener('mouseleave', hideTooltip);

      if(imgEl.nextElementSibling) imgEl.parentElement.insertBefore(pill, imgEl.nextElementSibling);
      else attachTo.appendChild(pill);

      return pill;
    }catch(e){
      console.error(LOG, "createOrUpdatePillForImage err", e);
      return null;
    }
  }


  function annotateModernCards(){
    try{
      const cards = Array.from(document.querySelectorAll(MODERN_ITEM_CARD));
      for(const c of cards){
        const name = readNameFromCardElement(c);
        const v = lookupValueForName(name);

        const img = c.querySelector(MODERN_ITEM_IMAGE) || c.querySelector('img');
        if(img) createOrUpdatePillForImage(img, v);
        try{ c.dataset.pekoraValue = String(Number(v) || 0); }catch(e){}
      }
    }catch(e){ console.error(LOG, "annotateModernCards err", e); }
  }

  function annotateImagesInContainer(container){
    if(!container) return [];
    const imgs = Array.from(container.querySelectorAll('img')).filter(isLikelyThumbnail);
    const processed = [];
    for(const img of imgs){
      try{
        const name = img.alt && img.alt.trim() ? img.alt.trim() : (img.title && img.title.trim() ? img.title.trim() : "");
        if(!name){
          const parent = img.parentElement;
          const caption = parent && Array.from(parent.querySelectorAll('a, p, span, div')).map(n => (n.textContent||'').trim()).find(Boolean);
          if(caption) name = caption;
        }
        const v = lookupValueForName(name || readNameFromCardElement(img.parentElement || img));
        createOrUpdatePillForImage(img, v);
        // annotate dataset on the parent container for sums
        const attach = img.closest('td, .itemColEntry-0-2-133, .col-3, .card') || img.parentElement;
        if(attach) try{ attach.dataset.pekoraValue = String(Number(v) || 0); }catch(e){}
        processed.push(img);
      }catch(e){}
    }
    return processed;
  }


  function findOfferRequestAreas(){
    const modernCard = document.querySelector('.offerRequestCard-0-2-34');
    if(modernCard){
      const rows = Array.from(modernCard.querySelectorAll('.row.row-0-2-119, .row-0-2-119'));
      const offerRow = rows.length >= 1 ? rows[0] : null;
      const requestRow = rows.length >= 2 ? rows[1] : null;
      return { offerRow, requestRow, container: modernCard };
    }

    const leftContainer = findTradeLeftContainers();
    if(leftContainer){

      const rows = Array.from(leftContainer.querySelectorAll('div, table, tbody, tr')).filter(n => n.querySelector && n.querySelector('img'));
      const offerRow = rows[0] || leftContainer.querySelector('table, div');
      const requestRow = rows[1] || Array.from(leftContainer.querySelectorAll('img')).slice(4).length ? leftContainer : null;
      return { offerRow, requestRow, container: leftContainer };
    }

    const any = Array.from(document.querySelectorAll('div, section, main')).find(el => {
      try{ const t = (el.textContent||"").toLowerCase(); return t.includes('your offer') && t.includes('your request'); }catch(e){return false;}
    });
    if(any){
      const rows = Array.from(any.querySelectorAll('div, table')).filter(n => n.querySelector && n.querySelector('img'));
      return { offerRow: rows[0] || null, requestRow: rows[1] || null, container: any };
    }

    return { offerRow: null, requestRow: null, container: null };
  }

  function findInventoryAreas(){
    const invs = findInventoryContainers();
    return { myInv: invs.myInv, partnerInv: invs.partnerInv };
  }


  function computeTradeTotals(){
    try{
      const { offerRow, requestRow } = findOfferRequestAreas();
      let offerTotal = 0, requestTotal = 0;

      if(offerRow){
        const imgs = Array.from(offerRow.querySelectorAll('img')).filter(isLikelyThumbnail);
        if(imgs.length){
          for(const img of imgs){
            const attach = img.closest('td, .itemColEntry-0-2-133, .col-3, .card') || img.parentElement;
            const v = Number(attach && attach.dataset && attach.dataset.pekoraValue ? Number(attach.dataset.pekoraValue) : 0) || 0;
            offerTotal += v;
          }
        } else {
          const cards = Array.from(offerRow.querySelectorAll('.itemCard-0-2-134, .card'));
          for(const c of cards){
            const v = Number(c.dataset && c.dataset.pekoraValue ? Number(c.dataset.pekoraValue) : 0) || 0;
            offerTotal += v;
          }
        }
        try{
          const plusInput = offerRow.closest('.offerRequestCard-0-2-34')?.querySelector('input.robuxInput-0-2-122, input[type="text"].robuxInput-0-2-122') ||
                            offerRow.querySelector('input[type="text"], input');
          if(plusInput && plusInput.value) offerTotal += Number((plusInput.value||'').replace(/[^0-9.-]/g,'')) || 0;
        }catch(e){}
      }

      if(requestRow){
        const imgs = Array.from(requestRow.querySelectorAll('img')).filter(isLikelyThumbnail);
        if(imgs.length){
          for(const img of imgs){
            const attach = img.closest('td, .itemColEntry-0-2-133, .col-3, .card') || img.parentElement;
            const v = Number(attach && attach.dataset && attach.dataset.pekoraValue ? Number(attach.dataset.pekoraValue) : 0) || 0;
            requestTotal += v;
          }
        } else {
          const cards = Array.from(requestRow.querySelectorAll('.itemCard-0-2-134, .card'));
          for(const c of cards){
            const v = Number(c.dataset && c.dataset.pekoraValue ? Number(c.dataset.pekoraValue) : 0) || 0;
            requestTotal += v;
          }
        }
        try{
          const plusInput = requestRow.closest('.offerRequestCard-0-2-34')?.querySelector('input.robuxInput-0-2-122, input[type="text"].robuxInput-0-2-122') ||
                            requestRow.querySelector('input[type="text"], input');
          if(plusInput && plusInput.value) requestTotal += Number((plusInput.value||'').replace(/[^0-9.-]/g,'')) || 0;
        }catch(e){}
      }

      return { offerTotal, requestTotal };
    }catch(e){
      console.error(LOG, "computeTradeTotals err", e);
      return { offerTotal:0, requestTotal:0 };
    }
  }

  function createOrUpdateFloatingSummary(offerTotal, requestTotal){
    let el = document.getElementById('__pekora_trade_floating_summary');
    const diff = Number(requestTotal) - Number(offerTotal);
    const formattedOffer = formatNumber(offerTotal);
    const formattedRequest = formatNumber(requestTotal);
    const formattedDiff = (diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff));
    if(!el){
      el = document.createElement('div');
      el.id = '__pekora_trade_floating_summary';
      el.className = 'custom-overpay-summary';
      el.style.position = 'fixed';
      el.style.left = '12px';
      el.style.bottom = '12px';
el.innerHTML = `
  <div class="title">Trade Summary</div>
  <div class="line"><span>You're offering</span><span class="numbers offer-num"></span></div>
  <div class="line"><span>They're offering</span><span class="numbers request-num"></span></div>
  <div class="line"><span>Difference</span><span class="numbers diff-num"></span></div> `;

      document.body.appendChild(el);
    }
    const offerNode = el.querySelector('.offer-num');
    const reqNode = el.querySelector('.request-num');
    const diffNode = el.querySelector('.diff-num');
    if(offerNode) offerNode.textContent = formattedOffer;
    if(reqNode) reqNode.textContent = formattedRequest;
    if(diffNode){
      diffNode.textContent = formattedDiff;
      diffNode.classList.remove('pos','neg');
      if(diff > 0) diffNode.classList.add('pos');
      else if(diff < 0) diffNode.classList.add('neg');
    }
  }


  function updateAllTradeAnnotations(){
    try{
      if(!/\/Trade\/TradeWindow\.aspx/i.test(location.pathname)){
        const prev = document.getElementById('__pekora_trade_floating_summary');
        if(prev) prev.remove();
        return;
      }

      if(!window.__pekora_last_values_reload) window.__pekora_last_values_reload = Date.now();
      if(Date.now() - window.__pekora_last_values_reload > 30000){
        window.__pekora_last_values_reload = Date.now();
        loadValues().catch(()=>{});
      }

      annotateModernCards();

      const { offerRow, requestRow } = findOfferRequestAreas();
      const { myInv, partnerInv } = findInventoryAreas();

      if(offerRow) annotateImagesInContainer(offerRow);
      if(requestRow) annotateImagesInContainer(requestRow);
      if(myInv) annotateImagesInContainer(myInv);
      if(partnerInv) annotateImagesInContainer(partnerInv);

      const allImgs = Array.from(document.querySelectorAll('img')).filter(isLikelyThumbnail);
      for(const img of allImgs) {
        const attach = img.closest('td, .itemColEntry-0-2-133, .col-3, .card') || img.parentElement;
        if(attach && attach.querySelector && attach.querySelector('.trade-value-pill')) continue;
        const guessName = img.alt && img.alt.trim() ? img.alt.trim() : readNameFromCardElement(img.parentElement || img);
        const v = lookupValueForName(guessName);
        createOrUpdatePillForImage(img, v);
        if(attach) try{ attach.dataset.pekoraValue = String(Number(v) || 0); }catch(e){}
      }

      const totals = computeTradeTotals();
      createOrUpdateFloatingSummary(totals.offerTotal, totals.requestTotal);

    }catch(e){
      console.error(LOG, "updateAllTradeAnnotations err", e);
    }
  }


  let updateInterval = null;
  let mo = null;
  function startTradeEnhancer(){
    if(updateInterval) return;
    updateAllTradeAnnotations();
    updateInterval = setInterval(updateAllTradeAnnotations, 1000);

    if(!mo){
      mo = new MutationObserver((muts) => {
        if(window.__pekora_trade_debounce) clearTimeout(window.__pekora_trade_debounce);
        window.__pekora_trade_debounce = setTimeout(()=> {
          try{ updateAllTradeAnnotations(); }catch(e){}
        }, 70);
      });
      mo.observe(document, { childList:true, subtree:true, attributes:true, characterData:false });
    }

    document.addEventListener('click', onInteraction, true);
    document.addEventListener('input', onInteraction, true);
    document.addEventListener('change', onInteraction, true);
  }
  function stopTradeEnhancer(){
    try{
      if(updateInterval){ clearInterval(updateInterval); updateInterval = null; }
      if(mo){ mo.disconnect(); mo = null; }
      document.removeEventListener('click', onInteraction, true);
      document.removeEventListener('input', onInteraction, true);
      document.removeEventListener('change', onInteraction, true);
    }catch(e){}
  }
  function onInteraction(e){
    if(window.__pekora_trade_interact_debounce) clearTimeout(window.__pekora_trade_interact_debounce);
    window.__pekora_trade_interact_debounce = setTimeout(()=> updateAllTradeAnnotations(), 50);
  }


  (function hijackHistorySimple(){
    const _push = history.pushState;
    history.pushState = function(){
      _push.apply(this, arguments);
      window.dispatchEvent(new Event("pekora_locationchange_trade"));
    };
    window.addEventListener("popstate", ()=> window.dispatchEvent(new Event("pekora_locationchange_trade")));
    window.addEventListener("pekora_locationchange_trade", () => {
      setTimeout(()=> {
        if(/\/Trade\/TradeWindow\.aspx/i.test(location.pathname)) startTradeEnhancer();
        else stopTradeEnhancer();
      }, 300);
    });
  })();

  window.addEventListener("locationchange", ()=> {
    if(/\/Trade\/TradeWindow\.aspx/i.test(location.pathname)) startTradeEnhancer(); else stopTradeEnhancer();
  });

  setTimeout(()=> {
    if(/\/Trade\/TradeWindow\.aspx/i.test(location.pathname)) startTradeEnhancer();
  }, 700);

  if(!window.__pekoraEnhancer) window.__pekoraEnhancer = {};
  Object.assign(window.__pekoraEnhancer, {
    reScan: ()=> updateAllTradeAnnotations(),
    reloadValues: async ()=> { await loadValues(); updateAllTradeAnnotations(); },
    dataCount: ()=> valueMap.size,
    sample: ()=> Array.from(valueMap.entries()).slice(0,12)
  });


  window.addEventListener("beforeunload", ()=> { try{ stopTradeEnhancer(); }catch(e){} });

  log("KoroneEnhancer Ready ");
})();
