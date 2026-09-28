
// ============================================================
// INIT
// ============================================================
function init() {
  buildBOM();
  buildMLLog();
  setupPartHover();
}

function buildBOM() {
  const el = document.getElementById('bom-list');
  el.innerHTML = BOM.map(b => `
    <div class="bom-row" onclick="highlightByBOM(${b.num})">
      <div class="bom-num" style="background:${b.color}22;color:${b.color}">${b.num}</div>
      <div class="bom-info">
        <div class="bom-name">${b.name}</div>
        <div class="bom-detail">${b.mat}</div>
      </div>
      <div class="bom-qty">${b.qty}</div>
    </div>
  `).join('');
}

function buildMLLog() {
  const el = document.getElementById('ml-log');
  el.innerHTML = ML_LOG.map(e => `
    <div class="ml-event">
      <div class="ml-time">${e.time}s</div>
      <div><div class="ml-msg">${e.msg}</div><div class="ml-tag" style="background:${e.color}22;color:${e.color}">${e.tag}</div></div>
    </div>
  `).join('');
}

function setupPartHover() {
  const parts = document.querySelectorAll('.part-highlight');
  const tt = document.getElementById('tooltip');

  parts.forEach(el => {
    el.addEventListener('mouseenter', function(e) {
      const key = this.getAttribute('data-part');
      const part = PARTS[key];
      if (!part) return;
      showTooltip(part, e);
      updateInfoPanel(key, part);
    });
    el.addEventListener('mousemove', function(e) {
      moveTooltip(e);
    });
    el.addEventListener('mouseleave', function() {
      tt.classList.remove('visible');
    });
    el.addEventListener('click', function() {
      const key = this.getAttribute('data-part');
      selectPart(key, this);
    });
  });
}

function showTooltip(part, e) {
  const tt = document.getElementById('tooltip');
  const inner = document.getElementById('tt-inner');
  const avg = Math.round((part.conf.yolo + part.conf.resnet + part.conf.cluster) / 3 * 100);
  const dimEntries = Object.entries(part.dims || {}).slice(0,3);
  inner.innerHTML = `
    <div class="tt-part">${part.name}</div>
    <div class="tt-type">${part.type}</div>
    ${dimEntries.map(([k,v]) => `<div class="tt-row"><span class="tt-key">${k}</span><span class="tt-val">${v}</span></div>`).join('')}
    <div class="tt-row"><span class="tt-key">material</span><span class="tt-val">${part.material}</span></div>
    <div class="tt-conf">
      <span class="tt-key" style="font-size:10px">confidence</span>
      <div class="tt-conf-bar"><div class="tt-conf-fill" style="width:${avg}%"></div></div>
      <span class="tt-conf-pct">${avg}%</span>
    </div>
  `;
  tt.classList.add('visible');
  moveTooltip(e);
}

function moveTooltip(e) {
  const tt = document.getElementById('tooltip');
  let x = e.clientX + 16;
  let y = e.clientY - 10;
  if (x + 240 > window.innerWidth) x = e.clientX - 236;
  if (y + 280 > window.innerHeight) y = e.clientY - 260;
  tt.style.left = x + 'px';
  tt.style.top = y + 'px';
}

function updateInfoPanel(key, part) {
  document.getElementById('selected-name').textContent = part.name;
  document.getElementById('selected-type').textContent = part.type;

  const chips = ['material','standard','function','finish','hardness','torque','load','rpm'].filter(k => part[k]);
  document.getElementById('selected-chips').innerHTML = chips.map(k =>
    `<span class="info-chip" style="border-color:${part.color}44;color:${part.color}">${part[k]}</span>`
  ).join('');

  const dims = part.dims || {};
  document.getElementById('part-data-rows').innerHTML = Object.entries(dims).map(([k,v]) =>
    `<div class="data-row"><span class="dr-key">${k}</span><span class="dr-val">${v}</span></div>`
  ).join('');
  document.getElementById('part-data-section').style.display = 'block';

  const conf = part.conf || {};
  document.getElementById('ml-scores-rows').innerHTML = Object.entries(conf).map(([k,v]) => {
    const pct = Math.round(v*100);
    const color = pct>90?'#10b981':pct>80?'#00e5ff':'#f59e0b';
    return `<div class="progress-row">
      <div class="pr-label">${k}</div>
      <div class="pr-bar"><div class="pr-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="pr-val">${pct}%</div>
    </div>`;
  }).join('');
  document.getElementById('ml-scores-section').style.display = 'block';

  const rel = (part.related || []);
  document.getElementById('related-chips').innerHTML = rel.map(r => {
    const rp = PARTS[r];
    return rp ? `<span class="info-chip" style="cursor:pointer;border-color:#333" onclick="document.querySelector('[data-part=${r}]').dispatchEvent(new MouseEvent('click'))">${rp.name}</span>` : '';
  }).join('');
  document.getElementById('related-section').style.display = rel.length ? 'block' : 'none';
  document.getElementById('feedback-section').style.display = 'block';
}

function selectPart(key, el) {
  document.querySelectorAll('.part-highlight').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  selectedPart = key;
  if (currentTab !== 'info') setTab('info');
}

function highlightByBOM(num) {
  const match = Object.entries(PARTS).find(([k,p]) => p.bom === num);
  if (!match) return;
  const [key, part] = match;
  const el = document.querySelector(`[data-part="${key}"]`);
  if (el) {
    el.dispatchEvent(new MouseEvent('click'));
    setTab('info');
    showNotif(`Part ${num}: ${part.name} selected`);
  }
}

// ============================================================
// TABS
// ============================================================
function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.sr-tab').forEach((t,i) => {
    const tabs = ['info','bom','ml','train'];
    t.classList.toggle('active', tabs[i] === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
}

// ============================================================
// TOOLBAR
// ============================================================
function setMode(m) {
  document.querySelectorAll('.topbar-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  if (m === 'export') exportBOM();
}

function setTool(t) {
  currentTool = t;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('main-svg').style.cursor = t === 'pan' ? 'grab' : 'crosshair';
}

function zoom(factor) {
  zoomLevel = Math.max(0.3, Math.min(3, zoomLevel * factor));
  const wrap = document.getElementById('canvas-wrap');
  wrap.style.transform = `scale(${zoomLevel})`;
  wrap.style.transformOrigin = 'center center';
}

function resetZoom() {
  zoomLevel = 1;
  const wrap = document.getElementById('canvas-wrap');
  wrap.style.transform = '';
}

// ============================================================
// SCAN ANIMATION
// ============================================================
function runScan() {
  const line = document.getElementById('scan-line');
  line.classList.remove('scanning');
  void line.offsetWidth;
  line.classList.add('scanning');
  showNotif('Running full ML scan...');
  setTimeout(() => {
    showNotif('Scan complete — 23 parts detected');
    addMLLogEntry('Re-scan complete: all 23 parts verified', 'FUS', '#10b981');
  }, 2200);
}

function addMLLogEntry(msg, tag, color) {
  const log = document.getElementById('ml-log');
  const div = document.createElement('div');
  div.className = 'ml-event';
  div.innerHTML = `<div class="ml-time">now</div><div><div class="ml-msg">${msg}</div><div class="ml-tag" style="background:${color}22;color:${color}">${tag}</div></div>`;
  log.insertBefore(div, log.firstChild);
}

// ============================================================
// FEEDBACK / SELF-LEARNING
// ============================================================
function sendFeedback(type) {
  feedbackCount++;
  document.getElementById('feedback-count').textContent = feedbackCount;
  const msgs = {
    correct:'✓ Confirmed — reinforcing model weights',
    wrong:'✗ Flagged — queued for re-annotation',
    partial:'~ Partial signal — uncertainty logged',
  };
  showNotif(msgs[type]);
  addMLLogEntry(msgs[type], 'SLF', '#f59e0b');

  // Animate training progress
  const sup = document.getElementById('pr-sup');
  const cur = parseInt(sup.style.width);
  if (type === 'correct' && cur < 99) sup.style.width = (cur+1)+'%';
}

// ============================================================
// RETRAIN
// ============================================================
function triggerRetrain() {
  showNotif('Retraining pipeline triggered...');
  addMLLogEntry('Manual retrain triggered by user', 'SYS', '#8892a4');
  let p = 0;
  const bars = ['pr-sup','pr-unsup','pr-self','pr-fuse'];
  const interval = setInterval(() => {
    p++;
    bars.forEach(id => {
      const el = document.getElementById(id);
      const cur = parseInt(el.style.width);
      if (cur < 99) el.style.width = Math.min(99, cur + Math.random()*2)+'%';
    });
    if (p > 30) {
      clearInterval(interval);
      showNotif('Retraining complete — models updated!');
      addMLLogEntry('Retrain complete — all models updated', 'FUS', '#10b981');
    }
  }, 100);
}

// ============================================================
// EXPORT — opens a modal with the full BOM so user can copy/save
// ============================================================
function exportBOM() {
  // Build CSV text
  const csvRows = ['No.,Part Name,Material,Qty,Standard'];
  BOM.forEach(b => csvRows.push(`${b.num},"${b.name}","${b.mat}",${b.qty},ISO/DIN`));
  const csvText = csvRows.join('\n');

  // Build HTML table text for display
  const tableRows = BOM.map(b => `
    <tr>
      <td style="padding:7px 10px;border-bottom:1px solid #222733;font-family:'DM Mono',monospace;font-size:12px;color:#00e5ff">${b.num}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #222733;font-size:13px">${b.name}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #222733;font-family:'DM Mono',monospace;font-size:11px;color:#8892a4">${b.mat}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #222733;font-family:'DM Mono',monospace;font-size:11px;color:#e8ecf4">${b.qty}</td>
    </tr>`).join('');

  // Create or reuse export modal
  let modal = document.getElementById('export-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'export-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div onclick="document.getElementById('export-modal').remove()" style="position:absolute;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px)"></div>
    <div style="position:relative;background:#11141a;border:1px solid #2e3545;border-radius:16px;width:600px;max-width:calc(100vw - 32px);max-height:80vh;display:flex;flex-direction:column;z-index:1;overflow:hidden">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #222733">
        <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:700;color:#e8ecf4">Bill of Materials — MV-2024-001</div>
        <button onclick="document.getElementById('export-modal').remove()" style="width:28px;height:28px;border-radius:50%;border:1px solid #222733;background:transparent;color:#8892a4;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">✕</button>
      </div>

      <!-- Table -->
      <div style="overflow-y:auto;flex:1;padding:0 22px">
        <table style="width:100%;border-collapse:collapse;margin:12px 0">
          <thead>
            <tr style="background:#181c24">
              <th style="padding:8px 10px;text-align:left;font-size:10px;letter-spacing:1px;color:#4a5568;font-family:'DM Mono',monospace;text-transform:uppercase;font-weight:500">No.</th>
              <th style="padding:8px 10px;text-align:left;font-size:10px;letter-spacing:1px;color:#4a5568;font-family:'DM Mono',monospace;text-transform:uppercase;font-weight:500">Part Name</th>
              <th style="padding:8px 10px;text-align:left;font-size:10px;letter-spacing:1px;color:#4a5568;font-family:'DM Mono',monospace;text-transform:uppercase;font-weight:500">Material</th>
              <th style="padding:8px 10px;text-align:left;font-size:10px;letter-spacing:1px;color:#4a5568;font-family:'DM Mono',monospace;text-transform:uppercase;font-weight:500">Qty</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>

      <!-- CSV Preview box -->
      <div style="margin:0 22px 0;background:#0a0c10;border:1px solid #222733;border-radius:8px;padding:12px;overflow:auto;max-height:110px">
        <div style="font-size:10px;color:#4a5568;font-family:'DM Mono',monospace;letter-spacing:1px;margin-bottom:6px">CSV PREVIEW</div>
        <pre id="csv-preview" style="font-family:'DM Mono',monospace;font-size:11px;color:#8892a4;white-space:pre;margin:0;line-height:1.6">${csvText}</pre>
      </div>

      <!-- Action buttons -->
      <div style="display:flex;gap:10px;padding:16px 22px;border-top:1px solid #222733">
        <button onclick="copyBOM()" style="flex:1;padding:10px;border-radius:8px;border:1px solid #2e3545;background:transparent;color:#e8ecf4;font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:.2s;display:flex;align-items:center;justify-content:center;gap:6px" onmouseover="this.style.background='#181c24'" onmouseout="this.style.background='transparent'">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M1 9V2a1 1 0 011-1h7"/></svg>
          Copy CSV to Clipboard
        </button>
        <button onclick="printBOM()" style="flex:1;padding:10px;border-radius:8px;border:none;background:linear-gradient(135deg,#7c3aed,#00e5ff);color:#fff;font-family:'Syne',sans-serif;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="8" width="9" height="4" rx="1"/><path d="M4 8V1h5l2 2v5"/><rect x="4" y="10" width="5" height="1" rx=".5" fill="currentColor" stroke="none"/></svg>
          Print / Save as PDF
        </button>
      </div>
    </div>`;

  // Store CSV text for copy function
  window._bomCSV = csvText;
  addMLLogEntry('BOM export opened — ' + BOM.length + ' items', 'SYS', '#8892a4');
}

function copyBOM() {
  const text = window._bomCSV || '';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showNotif('✓ CSV copied to clipboard!');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;top:-999px;left:-999px;opacity:0';
  document.body.appendChild(el);
  el.focus();
  el.select();
  try {
    document.execCommand('copy');
    showNotif('✓ CSV copied to clipboard!');
  } catch(e) {
    showNotif('Select the CSV text above and copy manually');
  }
  document.body.removeChild(el);
}

function printBOM() {
  const csv = window._bomCSV || '';
  const rows = BOM.map(b => `<tr><td>${b.num}</td><td>${b.name}</td><td>${b.mat}</td><td>${b.qty}</td></tr>`).join('');
  const win = window.open('', '_blank');
  if (!win) { showNotif('Allow pop-ups to print BOM'); return; }
  win.document.write(`<!DOCTYPE html><html><head><title>BOM MV-2024-001</title>
  <style>body{font-family:Arial,sans-serif;padding:30px;color:#111}
  h2{margin-bottom:4px}p{color:#666;font-size:12px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse}
  th{background:#f0f0f0;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #ddd}
  td{padding:8px 12px;border-bottom:1px solid #eee;font-size:13px}
  tr:nth-child(even) td{background:#fafafa}
  @media print{body{padding:10px}}</style></head>
  <body><h2>Bill of Materials</h2><p>Drawing No: MV-2024-001 &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</p>
  <table><thead><tr><th>No.</th><th>Part Name</th><th>Material</th><th>Qty</th></tr></thead>
  <tbody>${rows}</tbody></table></body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function showNotif(msg) {
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

// ============================================================
// MODEL TOGGLE
// ============================================================
function toggleModel(el, name) {
  el.classList.toggle('active');
  const on = el.classList.contains('active');
  showNotif(`${name} ${on ? 'enabled' : 'disabled'}`);
}


