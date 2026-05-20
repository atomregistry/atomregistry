(function () {
'use strict';

var STORAGE_FEE = 5_000_000;
var MAX_BYTES   = 120 * 1024;

const LINK_ICONS = {
  '🌐 Website':     { fa:'fa-globe',     brand:false },
  '🐦 X / Twitter': { fa:'fa-x-twitter', brand:true  },
  '📸 Instagram':   { fa:'fa-instagram', brand:true  },
  '💼 LinkedIn':    { fa:'fa-linkedin',  brand:true  },
  '🐙 GitHub':      { fa:'fa-github',    brand:true  },
  '📺 YouTube':     { fa:'fa-youtube',   brand:true  },
  '🎵 Music':       { fa:'fa-music',     brand:false },
  '📧 Email':       { fa:'fa-envelope',  brand:false },
  '💬 Telegram':    { fa:'fa-telegram',  brand:true  },
  '🔗 Other':       { fa:'fa-link',      brand:false },
};

const LINK_OPTIONS = ['🌐 Website','🐦 X / Twitter','📸 Instagram','💼 LinkedIn','🐙 GitHub','📺 YouTube','🎵 Music','📧 Email','💬 Telegram','🔗 Other'];

const TEMPLATES = {
  minimal: {
    name:'Your Name', title:'Builder · Creator', bio:'',
    scheme:'white-gray', bg:'darker', font:'sans', layout:'centered', tags:'',
    links:[], sections:[], show_wallet:false
  },
  developer: {
    name:'Dev Name', title:'Full-Stack · CosmWasm · Rust', bio:'Building on Cosmos Hub. Open to collaborations.',
    scheme:'green-cyan', bg:'dark', font:'mono', layout:'card',
    tags:'Rust, CosmWasm, JavaScript, WebAssembly',
    links:[{label:'🐙 GitHub',url:''},{label:'💬 Telegram',url:''}],
    sections:[{title:'What I Build',body:''}], show_wallet:true
  },
  artist: {
    name:'Artist Name', title:'Digital Artist · Photographer', bio:'Creating work that lives forever on the blockchain.',
    scheme:'pink-purple', bg:'dark', font:'display', layout:'centered',
    tags:'Photography, Digital Art, NFTs',
    links:[{label:'📸 Instagram',url:''},{label:'📺 YouTube',url:''}],
    sections:[{title:'My Work',body:''}], show_wallet:false
  },
  web3: {
    name:'Web3 Name', title:'DeFi · Cosmos · ATOM', bio:'Long-term Cosmos Hub validator and contributor.',
    scheme:'purple-cyan', bg:'dark', font:'mono', layout:'card',
    tags:'Cosmos, DeFi, Validator, ATOM',
    links:[{label:'🐦 X / Twitter',url:''},{label:'💬 Telegram',url:''}],
    sections:[{title:'About',body:''}], show_wallet:true
  },
  corporate: {
    name:'Company Name', title:'Web3 · Cosmos Hub', bio:'Professional services on Cosmos Hub.',
    scheme:'white-gray', bg:'navy', font:'sans', layout:'split', tags:'',
    links:[{label:'🌐 Website',url:''},{label:'📧 Email',url:''}],
    sections:[{title:'Services',body:''}], show_wallet:false
  }
};

const SCHEMES = {
  'purple-cyan': { p:'#a78bfa', c:'#22d3ee' },
  'orange-gold': { p:'#ff6b00', c:'#ffd700' },
  'green-cyan':  { p:'#22c55e', c:'#22d3ee' },
  'pink-purple': { p:'#ec4899', c:'#a855f7' },
  'white-gray':  { p:'#ffffff', c:'#9ca3af' },
  'custom':      { p:'#a78bfa', c:'#22d3ee' },
};

const BG_COLORS = {
  'dark':   '#06020d',
  'darker': '#000000',
  'navy':   '#020b18',
  'forest': '#020d06',
};

const FONTS = {
  'mono':    "'Courier New', Courier, monospace",
  'sans':    "system-ui, -apple-system, sans-serif",
  'display': "Georgia, 'Times New Roman', serif",
};

let imgBase64    = null;
let coverBase64  = null;
let currentBlobUrl = null;
let historyStack = [];
let historyIdx   = -1;
const HISTORY_MAX = 25;

var _walletListener = null;

function serializeState(){
  const v = getValues();
  return JSON.stringify({
    name:v.name, title:v.title, bio:v.bio, domain:v.domain,
    tags:v.tags, show_wallet:v.show_wallet,
    scheme:$("f_scheme").value, bg:$("f_bg").value, font:$("f_font").value,
    layout:v.layout, color1:$("f_color1").value, color2:$("f_color2").value,
    links:v.links, sections:v.sections,
    img: imgBase64, cover: coverBase64,
  });
}

function pushHistory(){
  const state = serializeState();
  if(historyStack[historyIdx] === state) return;
  historyStack = historyStack.slice(0, historyIdx + 1);
  historyStack.push(state);
  if(historyStack.length > HISTORY_MAX) historyStack.shift();
  historyIdx = historyStack.length - 1;
  updateUndoRedo();
}

function updateUndoRedo(){
  const u = $("undoBtn"), r = $("redoBtn");
  if(u) u.disabled = historyIdx <= 0;
  if(r) r.disabled = historyIdx >= historyStack.length - 1;
}

function applyState(state){
  const s = JSON.parse(state);
  $("f_name").value          = s.name || "";
  $("f_title").value         = s.title || "";
  $("f_bio").value           = s.bio || "";
  $("f_tags").value          = s.tags || "";
  $("f_show_wallet").checked = !!s.show_wallet;
  $("f_scheme").value        = s.scheme || "purple-cyan";
  $("f_bg").value            = s.bg || "dark";
  $("f_font").value          = s.font || "mono";
  $("f_color1").value        = s.color1 || "#a78bfa";
  $("f_color2").value        = s.color2 || "#22d3ee";
  $("f_color1_hex").value    = s.color1 || "#a78bfa";
  $("f_color2_hex").value    = s.color2 || "#22d3ee";
  $("customColors").classList.toggle("hidden", s.scheme !== "custom");
  setLayout(s.layout || "centered");

  const lc = $("linksContainer");
  lc.innerHTML = "";
  (s.links || []).forEach(l => addLinkRow(l.label, l.url));
  if(!s.links || !s.links.length) addLinkRow();

  const sc = $("sectionsContainer");
  sc.innerHTML = "";
  (s.sections || []).forEach(sec => addSectionRow(sec.title, sec.body));

  imgBase64 = s.img || null;
  coverBase64 = s.cover || null;
  if(imgBase64){
    $("imgThumb").src = imgBase64;
    $("imgPreviewWrap").classList.remove("hidden");
    $("imgDropZone").classList.add("hidden");
  } else {
    $("imgPreviewWrap").classList.add("hidden");
    $("imgDropZone").classList.remove("hidden");
  }
  if(coverBase64){
    $("coverThumb").src = coverBase64;
    $("coverPreviewWrap").classList.remove("hidden");
    $("coverDropZone").classList.add("hidden");
  } else {
    $("coverPreviewWrap").classList.add("hidden");
    $("coverDropZone").classList.remove("hidden");
  }

  const pickEl = $("f_domain_pick");
  if(pickEl && !pickEl.classList.contains("hidden")){
    pickEl.value = s.domain || "";
    $("f_domain").value = pickEl.value;
  } else {
    $("f_domain").value = s.domain || "";
  }
}

function undo(){
  if(historyIdx <= 0) return;
  historyIdx--;
  applyState(historyStack[historyIdx]);
  updateUndoRedo();
  live();
}

function redo(){
  if(historyIdx >= historyStack.length - 1) return;
  historyIdx++;
  applyState(historyStack[historyIdx]);
  updateUndoRedo();
  live();
}

function setLayout(layout){
  $("f_layout").value = layout;
  document.querySelectorAll(".prof-layout-opt").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.layout === layout);
  });
}

function addSectionRow(title="", body=""){
  const sc = $("sectionsContainer");
  const idx = sc.children.length;
  const div = document.createElement("div");
  div.className = "prof-section-row";
  div.innerHTML = `
    <div class="flex items-center justify-between mb-1">
      <span class="prof-field-label" style="margin-bottom:0">Section ${idx+1}</span>
      <button class="prof-section-remove text-xs text-red-400 hover:text-red-300"><i class="fas fa-xmark"></i></button>
    </div>
    <input class="prof-sec-title mb-2" placeholder="Section Title" type="text" value="${esc(title)}"/>
    <textarea class="prof-sec-body" placeholder="Section content…" rows="3">${esc(body)}</textarea>
  `;
  div.querySelector(".prof-section-remove").addEventListener("click", ()=>{ div.remove(); renumberSections(); live(); pushHistory(); });
  div.querySelector(".prof-sec-title").addEventListener("input", ()=>{ live(); pushHistory(); });
  div.querySelector(".prof-sec-body").addEventListener("input", ()=>{ live(); pushHistory(); });
  sc.appendChild(div);
}

function renumberSections(){
  $("sectionsContainer").querySelectorAll(".prof-section-row").forEach((row, i) => {
    const lbl = row.querySelector(".prof-field-label");
    if(lbl) lbl.textContent = `Section ${i+1}`;
  });
}

function addLinkRow(label="🌐 Website", url=""){
  const row = document.createElement("div");
  row.className = "link-row";
  row.innerHTML = `
    <select class="prof-link-select flex-shrink-0">${LINK_OPTIONS.map(o=>`<option${o===label?" selected":""}>${esc(o)}</option>`).join("")}</select>
    <input type="url" placeholder="https://..." value="${esc(url)}"/>
    <button class="prof-link-remove"><i class="fas fa-xmark"></i></button>
  `;
  $("linksContainer").appendChild(row);
}

function applyTemplate(tplKey){
  const tpl = TEMPLATES[tplKey];
  if(!tpl) return;
  $("f_name").value          = tpl.name;
  $("f_title").value         = tpl.title;
  $("f_bio").value           = tpl.bio;
  $("f_tags").value          = tpl.tags;
  $("f_show_wallet").checked = !!tpl.show_wallet;
  $("f_scheme").value        = tpl.scheme;
  $("f_bg").value            = tpl.bg;
  $("f_font").value          = tpl.font;
  $("customColors").classList.add("hidden");
  setLayout(tpl.layout);

  const lc = $("linksContainer");
  lc.innerHTML = "";
  if(tpl.links && tpl.links.length) tpl.links.forEach(l => addLinkRow(l.label, l.url));
  else addLinkRow();

  const sc = $("sectionsContainer");
  sc.innerHTML = "";
  (tpl.sections || []).forEach(s => addSectionRow(s.title, s.body));

  live();
  pushHistory();
  toast("Template applied: " + tplKey);
}

async function loadFromChain(){
  const domain = ($("f_domain_pick") && !$("f_domain_pick").classList.contains("hidden"))
    ? $("f_domain_pick").value
    : $("f_domain").value.trim();

  if(!domain){ toast("Select or enter a domain first","error"); return; }

  const btn = $("loadChainBtn");
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin-icon mr-1"></span> Loading…'; }

  try {
    const enc = btoa(JSON.stringify({site:{name:domain}}));
    let html = null;
    for(const ep of CFG.REST){
      try{
        const r = await fetch(`${ep}/cosmwasm/wasm/v1/contract/${CFG.SITE_REGISTRY}/smart/${enc}`);
        if(!r.ok) continue;
        const d = await r.json();
        html = d.data?.html || d.data?.content || null;
        break;
      }catch(e){}
    }

    if(!html){ toast("No deployed profile found for " + domain, "error"); return; }

    const match = html.match(/<!--\s*AR_PROFILE_DATA:(.*?)-->/s);
    if(match){
      try{
        const saved = JSON.parse(match[1].trim());
        imgBase64   = saved.img   || null;
        coverBase64 = saved.cover || null;
        applyState(JSON.stringify(saved));
        pushHistory();
        toast("Profile loaded and restored for editing ✓");
        live();
        return;
      }catch(e){}
    }

    if(currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    const blob = new Blob([html],{type:"text/html"});
    currentBlobUrl = URL.createObjectURL(blob);
    $("liveFrame").src = currentBlobUrl;
    toast("Existing profile loaded in preview - edit fields to modify it");

  }catch(e){
    toast("Load failed: "+(e.message||String(e)),"error");
  }finally{
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-cloud-arrow-down mr-1"></i> Load'; }
  }
}

function getValues(){
  const scheme = $("f_scheme").value;
  let p, c;
  if(scheme === "custom"){
    p = $("f_color1").value;
    c = $("f_color2").value;
  } else {
    p = SCHEMES[scheme]?.p || "#a78bfa";
    c = SCHEMES[scheme]?.c || "#22d3ee";
  }

  const links = [];
  $("linksContainer").querySelectorAll(".link-row").forEach(row => {
    const sel = row.querySelector("select")?.value || "";
    const url = row.querySelector("input")?.value || "";
    if(url) links.push({ label:sel, url });
  });

  const sections = [];
  $("sectionsContainer").querySelectorAll(".prof-section-row").forEach(row => {
    const title = row.querySelector(".prof-sec-title")?.value || "";
    const body  = row.querySelector(".prof-sec-body")?.value  || "";
    if(title || body) sections.push({ title, body });
  });

  return {
    name:       $("f_name").value || "Your Name",
    title:      $("f_title").value || "",
    bio:        $("f_bio").value || "",
    domain:     $("f_domain").value || "yourname.atom",
    tags:       $("f_tags").value || "",
    show_wallet:$("f_show_wallet").checked,
    p, c,
    bg:         BG_COLORS[$("f_bg").value] || "#06020d",
    font:       FONTS[$("f_font").value] || FONTS.mono,
    layout:     $("f_layout").value || "centered",
    links,
    sections,
    img:        imgBase64  || null,
    cover:      coverBase64 || null,
  };
}

function generateHTML(v){
  const linkHTML = v.links.map(l => {
    const icon = LINK_ICONS[l.label] || { fa:'fa-link', brand:false };
    const prefix = icon.brand ? 'fab' : 'fas';
    return `<a href="${esc(l.url)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:999px;padding:9px 20px;font-size:0.8rem;color:rgba(255,255,255,0.7);text-decoration:none;transition:all 0.2s;letter-spacing:0.04em"
      onmouseover="this.style.borderColor='${v.p}';this.style.color='${v.p}';this.style.background='rgba(167,139,250,0.06)'"
      onmouseout="this.style.borderColor='rgba(255,255,255,0.08)';this.style.color='rgba(255,255,255,0.7)';this.style.background='rgba(255,255,255,0.04)'">
      <i class="${prefix} ${icon.fa}" style="font-size:0.9rem"></i> ${esc(l.label.replace(/^[^\s]+\s/,''))}
    </a>`;
  }).join("");

  const tagsHTML = v.tags ? (() => {
    const chips = v.tags.split(",").map(t=>t.trim()).filter(Boolean).map(t =>
      `<span style="display:inline-block;padding:4px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.1);font-size:0.72rem;color:rgba(255,255,255,0.5);letter-spacing:0.06em">${esc(t)}</span>`
    ).join("");
    return `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:1.5rem">${chips}</div>`;
  })() : "";

  const walletHTML = (v.show_wallet && userAddress) ? `
    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:0.6rem;padding:6px 14px;font-size:0.7rem;font-family:monospace;color:rgba(255,255,255,0.35);margin-top:1.5rem;word-break:break-all;max-width:100%;cursor:pointer"
      onclick="navigator.clipboard&&navigator.clipboard.writeText('${userAddress}');this.style.color='${v.p}';setTimeout(()=>this.style.color='rgba(255,255,255,0.35)',1200)"
      title="Click to copy">
      <i class="fas fa-wallet" style="font-size:0.7rem;color:${v.p};flex-shrink:0"></i> ${userAddress}
    </div>` : "";

  const sectionsHTML = v.sections.map(s => `
    <section style="padding:3rem 2rem;max-width:700px;margin:0 auto;border-top:1px solid rgba(255,255,255,0.06)">
      ${s.title ? `<h2 style="font-size:1.3rem;font-weight:700;margin-bottom:1rem;background:linear-gradient(90deg,${v.p},${v.c});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${esc(s.title)}</h2>` : ""}
      ${s.body  ? `<p style="color:rgba(255,255,255,0.55);line-height:1.85;font-size:0.9rem;white-space:pre-wrap">${esc(s.body)}</p>` : ""}
    </section>`).join("");

  const avatarHTML = v.img ? `
    <div style="width:120px;height:120px;border-radius:50%;overflow:hidden;border:2px solid ${v.p};box-shadow:0 0 30px ${v.p}44;margin:0 auto 1.5rem;flex-shrink:0">
      <img src="${v.img}" style="width:100%;height:100%;object-fit:cover"/>
    </div>` : "";

  const coverCSS = v.cover ? `
    .ar-cover{width:100%;height:220px;object-fit:cover;display:block;margin-bottom:-60px}
    .ar-hero{padding-top:80px!important}` : "";

  const coverHTML = v.cover ? `<img class="ar-cover" src="${v.cover}" alt=""/>` : "";

  const faLink = v.links.length
    ? `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>`
    : "";

  if(v.layout === "centered"){
    return buildPage(v, faLink, coverCSS, coverHTML, `
<main style="max-width:700px;margin:0 auto;padding:5rem 2rem 3rem;text-align:center" class="ar-hero">
  ${avatarHTML}
  <h1 style="font-size:clamp(2rem,6vw,3.8rem);font-weight:900;line-height:1;letter-spacing:-0.02em;margin-bottom:0.5rem;background:linear-gradient(135deg,#fff,${v.c},${v.p});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:fup 0.8s both">${esc(v.name)}</h1>
  ${v.title ? `<p style="font-size:0.82rem;letter-spacing:0.22em;color:rgba(232,228,255,0.38);text-transform:uppercase;margin-bottom:1.5rem;animation:fup 0.8s 0.1s both">${esc(v.title)}</p>` : ""}
  ${v.bio   ? `<p style="font-size:1rem;color:rgba(232,228,255,0.58);line-height:1.8;max-width:500px;margin:0 auto 2.5rem;animation:fup 0.8s 0.2s both">${esc(v.bio)}</p>` : ""}
  ${v.links.length ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;animation:fup 0.8s 0.3s both">${linkHTML}</div>` : ""}
  ${tagsHTML}
  ${walletHTML}
</main>
${sectionsHTML}`, v);
  }

  if(v.layout === "card"){
    return buildPage(v, faLink, coverCSS, coverHTML, `
<main style="max-width:720px;margin:0 auto;padding:4rem 2rem 3rem;text-align:center" class="ar-hero">
  <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:1.5rem;padding:3rem 2.5rem;backdrop-filter:blur(20px)">
    ${avatarHTML}
    <h1 style="font-size:clamp(1.8rem,5vw,3.2rem);font-weight:900;line-height:1.05;letter-spacing:-0.02em;margin-bottom:0.5rem;background:linear-gradient(135deg,#fff,${v.c},${v.p});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:fup 0.8s both">${esc(v.name)}</h1>
    ${v.title ? `<p style="font-size:0.82rem;letter-spacing:0.22em;color:rgba(232,228,255,0.38);text-transform:uppercase;margin-bottom:1.5rem;animation:fup 0.8s 0.1s both">${esc(v.title)}</p>` : ""}
    ${v.bio   ? `<p style="font-size:0.95rem;color:rgba(232,228,255,0.58);line-height:1.8;margin:0 auto 2rem;animation:fup 0.8s 0.2s both">${esc(v.bio)}</p>` : ""}
    ${v.links.length ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;animation:fup 0.8s 0.3s both">${linkHTML}</div>` : ""}
    ${tagsHTML}
    ${walletHTML}
  </div>
</main>
${sectionsHTML}`, v);
  }

  return buildPage(v, faLink, coverCSS, coverHTML, `
<main style="max-width:900px;margin:0 auto;padding:4rem 2rem 3rem" class="ar-hero">
  <div style="display:flex;gap:3rem;align-items:center;flex-wrap:wrap">
    <div style="flex-shrink:0;text-align:center">
      ${v.img ? `<div style="width:150px;height:150px;border-radius:50%;overflow:hidden;border:2px solid ${v.p};box-shadow:0 0 40px ${v.p}44;margin:0 auto 1rem"><img src="${v.img}" style="width:100%;height:100%;object-fit:cover"/></div>` : ""}
      ${v.title ? `<p style="font-size:0.75rem;letter-spacing:0.2em;color:rgba(232,228,255,0.38);text-transform:uppercase;white-space:nowrap">${esc(v.title)}</p>` : ""}
    </div>
    <div style="flex:1;min-width:260px">
      <h1 style="font-size:clamp(2rem,5vw,3.2rem);font-weight:900;line-height:1.05;letter-spacing:-0.02em;margin-bottom:1rem;background:linear-gradient(135deg,#fff,${v.c},${v.p});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${esc(v.name)}</h1>
      ${v.bio ? `<p style="font-size:1rem;color:rgba(232,228,255,0.58);line-height:1.8;margin-bottom:1.5rem">${esc(v.bio)}</p>` : ""}
      ${v.links.length ? `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:1rem">${linkHTML}</div>` : ""}
      ${v.tags ? (() => {
        const chips = v.tags.split(",").map(t=>t.trim()).filter(Boolean).map(t =>
          `<span style="display:inline-block;padding:4px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.1);font-size:0.72rem;color:rgba(255,255,255,0.5);letter-spacing:0.06em">${esc(t)}</span>`
        ).join("");
        return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:0.5rem">${chips}</div>`;
      })() : ""}
      ${walletHTML}
    </div>
  </div>
</main>
${sectionsHTML}`, v);
}

function buildPage(v, faLink, coverCSS, coverHTML, bodyInner, vals){
  const dataComment = `<!-- AR_PROFILE_DATA:${JSON.stringify({
    name:vals.name, title:vals.title, bio:vals.bio, domain:vals.domain,
    tags:vals.tags, show_wallet:vals.show_wallet,
    scheme:$("f_scheme").value, bg:$("f_bg").value, font:$("f_font").value,
    layout:vals.layout,
    color1:$("f_color1").value, color2:$("f_color2").value,
    links:vals.links, sections:vals.sections,
  })} -->`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(vals.name)} - ${esc(vals.domain)}</title>
${faLink}
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:radial-gradient(ellipse 80% 60% at 20% 10%,${v.p}22,transparent 55%),radial-gradient(ellipse 70% 60% at 80% 90%,${v.c}1a,transparent 55%),${v.bg};color:#e8e4ff;font-family:${v.font};min-height:100vh;overflow-x:hidden}
a{color:${v.p};text-decoration:none}
@keyframes fup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
${coverCSS}
</style>
</head>
<body>
${coverHTML}
${bodyInner}
<footer style="text-align:center;padding:2rem;border-top:1px solid rgba(255,255,255,0.05);font-size:0.6rem;letter-spacing:0.15em;color:rgba(255,255,255,0.2);text-transform:uppercase">
  ${esc(vals.domain)} · Registered on <a href="https://atomregistry.com" target="_blank" style="color:${v.p}">Atom Registry</a> · Cosmos Hub · Stored On-Chain
</footer>
${dataComment}
</body>
</html>`;
}

let liveDebounce;
function live(){
  clearTimeout(liveDebounce);
  liveDebounce = setTimeout(()=>{
    const v = getValues();
    $("livePreviewDomain").textContent = v.domain;
    const html  = generateHTML(v);
    const bytes = new TextEncoder().encode(html).length;
    const kb    = (bytes/1024).toFixed(1);
    const pct   = Math.min(100,(bytes/MAX_BYTES)*100);
    $("sizeIndicator").textContent  = `${kb} KB / 120 KB`;
    $("previewLiveSize").textContent = `${kb}KB`;
    $("mainSizeBar").style.width    = pct+"%";
    $("mainSizeBar").style.background = pct>90?"#ef4444":pct>75?"#f59e0b":"linear-gradient(90deg,#a78bfa,#22d3ee)";
    if(currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    const blob = new Blob([html],{type:"text/html"});
    currentBlobUrl = URL.createObjectURL(blob);
    $("liveFrame").src = currentBlobUrl;
  }, 220);
}

async function processImage(file){
  if(!file) return;
  const quality = parseInt($("imgQuality").value);
  const bitmap  = await createImageBitmap(file);
  const canvas  = document.createElement("canvas");
  const size    = Math.min(bitmap.width, bitmap.height, 400);
  canvas.width  = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  const scale = size / Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width  - size/scale) / 2;
  const sy = (bitmap.height - size/scale) / 2;
  ctx.drawImage(bitmap, sx, sy, size/scale, size/scale, 0, 0, size, size);
  const dataUrl = canvas.toDataURL("image/webp", quality/100);
  imgBase64 = dataUrl;
  const bytes = Math.round(dataUrl.length * 0.75);
  const kb  = (bytes/1024).toFixed(1);
  const pct = Math.min(100,(bytes/(MAX_BYTES*0.7))*100);
  $("imgThumb").src  = dataUrl;
  $("imgStats").textContent = `${size}×${size}px · ~${kb}KB · Quality ${quality}`;
  $("imgSizeBar").style.width = pct+"%";
  $("imgSizeBar").style.background = pct>85?"#ef4444":"linear-gradient(90deg,#a78bfa,#22d3ee)";
  $("imgPreviewWrap").classList.remove("hidden");
  $("imgDropZone").classList.add("hidden");
  live(); pushHistory();
}

async function processCover(file){
  if(!file) return;
  const quality = parseInt($("coverQuality").value);
  const bitmap  = await createImageBitmap(file);
  const W = 1200, H = 400;
  const canvas  = document.createElement("canvas");
  canvas.width  = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const scale = Math.max(W/bitmap.width, H/bitmap.height);
  const sw = W/scale, sh = H/scale;
  const sx = (bitmap.width  - sw) / 2;
  const sy = (bitmap.height - sh) / 2;
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, W, H);
  const dataUrl = canvas.toDataURL("image/webp", quality/100);
  coverBase64 = dataUrl;
  const bytes = Math.round(dataUrl.length * 0.75);
  const kb  = (bytes/1024).toFixed(1);
  const pct = Math.min(100,(bytes/(MAX_BYTES*0.4))*100);
  $("coverThumb").src  = dataUrl;
  $("coverStats").textContent = `1200×400px · ~${kb}KB · Quality ${quality}`;
  $("coverSizeBar").style.width = pct+"%";
  $("coverSizeBar").style.background = pct>85?"#ef4444":"linear-gradient(90deg,#a78bfa,#22d3ee)";
  $("coverPreviewWrap").classList.remove("hidden");
  $("coverDropZone").classList.add("hidden");
  live(); pushHistory();
}

function openPreview(){
  const v    = getValues();
  const html = generateHTML(v);
  const bytes = new TextEncoder().encode(html).length;
  $("previewDomain").textContent = v.domain;
  $("previewSize").textContent   = `${(bytes/1024).toFixed(1)}KB`;
  const blob = new Blob([html],{type:"text/html"});
  $("previewFrame").src = URL.createObjectURL(blob);
  $("previewModal").classList.add("show");
}

function openSave(){
  const v    = getValues();
  const html = generateHTML(v);
  const bytes = new TextEncoder().encode(html).length;
  const kb  = (bytes/1024).toFixed(1);
  const pct = Math.min(100,(bytes/MAX_BYTES)*100);
  $("saveSizeText").textContent = `${kb}KB`;
  $("saveSizeBar").style.width = pct+"%";
  $("saveSizeBar").style.background = pct>90?"#ef4444":pct>75?"#f59e0b":"linear-gradient(90deg,#a78bfa,#22d3ee)";
  const deployDomain = $("deployDomain");
  const pickEl = $("f_domain_pick");
  if(deployDomain){
    const pickerVal = pickEl && !pickEl.classList.contains("hidden") ? pickEl.value : "";
    deployDomain.value = pickerVal || $("f_domain").value || "";
  }
  $("deployTxResult").classList.add("hidden");
  $("saveModal").classList.add("show");
}

function onConnected(){
  const prompt=$("chainConnectPrompt"),form=$("chainDeployForm");
  if(prompt) prompt.classList.add("hidden");
  if(form)   form.classList.remove("hidden");
  loadOwnedDomains();
}

async function loadOwnedDomains(){
  if(!userAddress) return;
  const pickEl=$("f_domain_pick"), inputEl=$("f_domain"), hintEl=$("domainHint");
  const loadingEl=$("domainPickLoading"), noneEl=$("domainPickNone"), refreshBtn=$("domainRefreshBtn");
  if(!pickEl) return;
  loadingEl&&loadingEl.classList.remove("hidden");
  pickEl.classList.add("hidden"); inputEl.classList.add("hidden");
  hintEl&&hintEl.classList.add("hidden"); noneEl&&noneEl.classList.add("hidden");
  try{
    const enc = btoa(JSON.stringify({names_by_owner:{owner:userAddress,start_after:null,limit:100}}));
    let names=[];
    for(const ep of CFG.REST){
      try{ const r=await fetch(`${ep}/cosmwasm/wasm/v1/contract/${CFG.REGISTRY}/smart/${enc}`); if(!r.ok)continue; const d=await r.json(); const raw=d.data&&(d.data.names||d.data.list||d.data); names=Array.isArray(raw)?raw:[]; break; }catch(e){}
    }
    loadingEl&&loadingEl.classList.add("hidden");
    if(!names.length){ noneEl&&noneEl.classList.remove("hidden"); inputEl.classList.remove("hidden"); refreshBtn&&refreshBtn.classList.remove("hidden"); return; }
    const current=inputEl.value.trim();
    pickEl.innerHTML=names.map(n=>{ const name=typeof n==="string"?n:(n.name||n.full_name||""); const sel=name===current?" selected":""; return `<option value="${esc(name)}"${sel}>${esc(name)}</option>`; }).join("");
    const firstDomain=typeof names[0]==="string"?names[0]:(names[0].name||"");
    const stillValid=names.some(n=>(typeof n==="string"?n:n.name)===current);
    if(!stillValid) inputEl.value=firstDomain;
    pickEl.classList.remove("hidden"); refreshBtn&&refreshBtn.classList.remove("hidden");
    const deployDomain=$("deployDomain"); if(deployDomain) deployDomain.value=inputEl.value||firstDomain;
    live();
  }catch(e){ loadingEl&&loadingEl.classList.add("hidden"); inputEl.classList.remove("hidden"); hintEl&&hintEl.classList.remove("hidden"); refreshBtn&&refreshBtn.classList.remove("hidden"); }
}

function syncColor(n){
  const hex=$("f_color"+n+"_hex").value;
  if(/^#[0-9a-fA-F]{6}$/.test(hex)){ $("f_color"+n).value=hex; live(); }
}

function init(){
  console.log('[profiles] init');
  imgBase64=null; coverBase64=null;
  if(currentBlobUrl){ URL.revokeObjectURL(currentBlobUrl); currentBlobUrl=null; }

  if(_walletListener) document.removeEventListener('wallet:connected', _walletListener);
  _walletListener = function(){ onConnected(); };
  document.addEventListener('wallet:connected', _walletListener);
  if(userAddress) onConnected();

  ["f_name","f_title","f_bio","f_tags"].forEach(id => {
    const el=$(id); if(el) el.addEventListener("input", ()=>{ live(); pushHistory(); });
  });
  ["f_bg","f_font"].forEach(id => {
    const el=$(id); if(el) el.addEventListener("change", ()=>{ live(); pushHistory(); });
  });
  const fShowWallet = $("f_show_wallet");
  if(fShowWallet) fShowWallet.addEventListener("change", ()=>{ live(); pushHistory(); });

  const linksContainer=$("linksContainer");
  if(linksContainer){
    linksContainer.addEventListener("input",  ()=>{ live(); pushHistory(); });
    linksContainer.addEventListener("change", ()=>{ live(); pushHistory(); });
    linksContainer.addEventListener("click", e=>{
      const removeBtn=e.target.closest(".prof-link-remove");
      if(removeBtn){ removeBtn.closest(".link-row").remove(); live(); pushHistory(); }
    });
  }

  const fScheme = $("f_scheme");
  if(fScheme) fScheme.addEventListener("change", function(){
    const cc = $("customColors"); if(cc) cc.classList.toggle("hidden", this.value!=="custom");
    live(); pushHistory();
  });
  const fc1=$("f_color1"), fc2=$("f_color2"), fc1h=$("f_color1_hex"), fc2h=$("f_color2_hex");
  if(fc1)  fc1.addEventListener("input",()=>{ if(fc1h) fc1h.value=fc1.value; live(); });
  if(fc2)  fc2.addEventListener("input",()=>{ if(fc2h) fc2h.value=fc2.value; live(); });
  if(fc1h) fc1h.addEventListener("input",()=>syncColor(1));
  if(fc2h) fc2h.addEventListener("input",()=>syncColor(2));

  document.querySelectorAll(".prof-layout-opt").forEach(btn => {
    btn.addEventListener("click",()=>{ setLayout(btn.dataset.layout); live(); pushHistory(); });
  });

  const addLink=$("addLinkBtn"); if(addLink) addLink.addEventListener("click",()=>{ addLinkRow(); });
  const addSec=$("addSectionBtn"); if(addSec) addSec.addEventListener("click",()=>{ addSectionRow(); });

  document.querySelectorAll(".prof-tpl-btn").forEach(btn => {
    btn.addEventListener("click",()=>applyTemplate(btn.dataset.tpl));
  });

  const undoB=$("undoBtn"), redoB=$("redoBtn");
  if(undoB) undoB.addEventListener("click", undo);
  if(redoB) redoB.addEventListener("click", redo);
  document.addEventListener("keydown", e=>{
    if((e.ctrlKey||e.metaKey) && e.key==="z" && !e.shiftKey){ e.preventDefault(); undo(); }
    if((e.ctrlKey||e.metaKey) && (e.key==="y" || (e.key==="z"&&e.shiftKey))){ e.preventDefault(); redo(); }
  });

  const lcBtn=$("loadChainBtn"); if(lcBtn) lcBtn.addEventListener("click", loadFromChain);

  const pickEl=$("f_domain_pick");
  if(pickEl) pickEl.addEventListener("change",function(){ $("f_domain").value=this.value; const dd=$("deployDomain"); if(dd) dd.value=this.value; live(); });
  const refreshBtn=$("domainRefreshBtn");
  if(refreshBtn) refreshBtn.addEventListener("click", loadOwnedDomains);
  $("f_domain").addEventListener("input",()=>{ live(); pushHistory(); });

  const imgBr=$("imgBrowse"), imgDZ=$("imgDropZone"), imgIn=$("imgInput"), imgQ=$("imgQuality"), imgRm=$("imgRemove");
  if(imgBr)  imgBr.addEventListener("click",()=>imgIn&&imgIn.click());
  if(imgDZ){ imgDZ.addEventListener("click",()=>imgIn&&imgIn.click()); imgDZ.addEventListener("dragover",e=>{e.preventDefault();imgDZ.classList.add("over");}); imgDZ.addEventListener("dragleave",()=>imgDZ.classList.remove("over")); imgDZ.addEventListener("drop",e=>{e.preventDefault();imgDZ.classList.remove("over");processImage(e.dataTransfer.files[0]);}); }
  if(imgIn)  imgIn.addEventListener("change",e=>processImage(e.target.files[0]));
  if(imgQ)   imgQ.addEventListener("input",function(){ const v=$("imgQualityVal"); if(v) v.textContent=this.value; if(imgIn&&imgIn.files[0]) processImage(imgIn.files[0]); });
  if(imgRm)  imgRm.addEventListener("click",()=>{ imgBase64=null; const pw=$("imgPreviewWrap"),dz=$("imgDropZone"); if(pw) pw.classList.add("hidden"); if(dz) dz.classList.remove("hidden"); live(); pushHistory(); });

  const covBr=$("coverBrowse"), covDZ=$("coverDropZone"), covIn=$("coverInput"), covQ=$("coverQuality"), covRm=$("coverRemove");
  if(covBr)  covBr.addEventListener("click",()=>covIn&&covIn.click());
  if(covDZ){ covDZ.addEventListener("click",()=>covIn&&covIn.click()); covDZ.addEventListener("dragover",e=>{e.preventDefault();covDZ.classList.add("over");}); covDZ.addEventListener("dragleave",()=>covDZ.classList.remove("over")); covDZ.addEventListener("drop",e=>{e.preventDefault();covDZ.classList.remove("over");processCover(e.dataTransfer.files[0]);}); }
  if(covIn)  covIn.addEventListener("change",e=>processCover(e.target.files[0]));
  if(covQ)   covQ.addEventListener("input",function(){ const v=$("coverQualityVal"); if(v) v.textContent=this.value; if(covIn&&covIn.files[0]) processCover(covIn.files[0]); });
  if(covRm)  covRm.addEventListener("click",()=>{ coverBase64=null; const pw=$("coverPreviewWrap"),dz=$("coverDropZone"); if(pw) pw.classList.add("hidden"); if(dz) dz.classList.remove("hidden"); live(); pushHistory(); });

  const vpD=$("vpDesktopBtn"), vpM=$("vpMobileBtn"), lfr=$("liveFrame");
  if(vpD) vpD.addEventListener("click",()=>{ if(lfr) lfr.style.width="100%"; vpD.classList.add("active"); if(vpM) vpM.classList.remove("active"); });
  if(vpM) vpM.addEventListener("click",()=>{ if(lfr) lfr.style.width="375px"; vpM.classList.add("active"); if(vpD) vpD.classList.remove("active"); });

  const prevBtn=$("previewBtn"), prevSave=$("previewSaveBtn"), prevClose=$("previewCloseBtn");
  const saveBtn=$("saveBtn"), saveClose=$("saveCloseBtn"), prevModal=$("previewModal"), saveMod=$("saveModal");
  if(prevBtn)   prevBtn.addEventListener("click", openPreview);
  if(prevSave)  prevSave.addEventListener("click",()=>{ if(prevModal) prevModal.classList.remove("show"); openSave(); });
  if(prevClose) prevClose.addEventListener("click",()=>{ if(prevModal) prevModal.classList.remove("show"); });
  if(saveBtn)   saveBtn.addEventListener("click", openSave);
  if(saveClose) saveClose.addEventListener("click",()=>{ if(saveMod) saveMod.classList.remove("show"); });

  const saveComp=$("saveComputerBtn");
  if(saveComp) saveComp.addEventListener("click",()=>{
    const v=getValues(); const html=generateHTML(v);
    const blob=new Blob([html],{type:"text/html"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=(v.domain||"mypage").replace(/\./g,"-")+".html";
    a.click(); toast("Downloaded!");
  });

  const cpyUrl=$("copyProfileUrlBtn");
  if(cpyUrl) cpyUrl.addEventListener("click",()=>{
    const dd=$("deployDomain"); const domain=dd?dd.value.trim():"";
    const url=`https://${domain}`;
    if(navigator.clipboard) navigator.clipboard.writeText(url).then(()=>toast("URL copied: "+url));
  });

  const ccBtn=$("chainConnectBtn"); if(ccBtn) ccBtn.addEventListener("click", openWalletModal);

  const vdBtn=$("verifyAndDeployBtn");
  if(vdBtn) vdBtn.addEventListener("click", async()=>{
    const name=$("deployDomain").value.trim().toLowerCase();
    if(!name){ toast("Enter domain name","error"); return; }
    if(!userAddress){ toast("Connect wallet first","error"); return; }
    const status=$("domainStatus");
    status.className="text-xs mb-3 flex items-center gap-2 text-gray-400";
    status.innerHTML=`<span class="spin-icon"></span> Verifying ownership...`;
    status.classList.remove("hidden");
    try{
      const enc=btoa(JSON.stringify({owner_of:{name}}));
      let owner=null;
      for(const ep of CFG.REST){ try{ const r=await fetch(`${ep}/cosmwasm/wasm/v1/contract/${CFG.REGISTRY}/smart/${enc}`); if(!r.ok)continue; const d=await r.json(); owner=d.data?.owner; break; }catch(e){} }
      if(!owner){ status.className="text-xs mb-3 flex items-center gap-2 text-red-400"; status.innerHTML=`<i class="fas fa-circle-xmark"></i> Domain not registered`; return; }
      if(owner.toLowerCase()!==userAddress.toLowerCase()){ status.className="text-xs mb-3 flex items-center gap-2 text-red-400"; status.innerHTML=`<i class="fas fa-circle-xmark"></i> You don't own this domain`; return; }
      let isFirst=true;
      const enc2=btoa(JSON.stringify({site:{name}}));
      for(const ep of CFG.REST){ try{ const r=await fetch(`${ep}/cosmwasm/wasm/v1/contract/${CFG.SITE_REGISTRY}/smart/${enc2}`); if(r.ok){ isFirst=false; break; } }catch(e){} }
      status.className="text-xs mb-3 flex items-center gap-2 text-green-400";
      status.innerHTML=`<i class="fas fa-circle-check"></i> Verified · ${isFirst?"5 ATOM storage fee":"Free edit (gas only)"}`;
      const v=getValues(); const html=generateHTML(v);
      const bytes=new TextEncoder().encode(html).length;
      if(bytes>MAX_BYTES){ toast("Page too large - reduce content or image quality","error"); return; }
      vdBtn.disabled=true; vdBtn.innerHTML=`<span class="spin-icon mr-2"></span> Deploying...`;
      const result=await window.executeContract(CFG.SITE_REGISTRY,{set_site:{name,html}},isFirst?STORAGE_FEE:0);
      const txLink=$("deployTxLink"); if(txLink){ txLink.textContent=result.txhash; txLink.href=`https://www.mintscan.io/cosmos/tx/${result.txhash}`; }
      const txResult=$("deployTxResult"); if(txResult) txResult.classList.remove("hidden");
      toast("Deployed to Cosmos Hub!");
    }catch(e){
      const msg=e.message||String(e);
      if(/rejected|denied|cancel/i.test(msg)) toast("Cancelled","warn");
      else toast("Deploy failed: "+msg.slice(0,80),"error");
    }finally{
      vdBtn.disabled=false; vdBtn.innerHTML=`<i class="fas fa-rocket mr-2"></i> Verify &amp; Deploy On-Chain`;
    }
  });

  live();
  pushHistory();
}

window.ArViewInit = window.ArViewInit || {};
window.ArViewInit['profiles'] = init;

})();
