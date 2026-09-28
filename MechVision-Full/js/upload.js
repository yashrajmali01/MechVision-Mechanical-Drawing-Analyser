// ============================================================
// UPLOAD MODAL
// ============================================================
let uploadedFile = null;
let uploadedURL = null;

function openUploadModal() {
  document.getElementById('upload-modal').classList.add('open');
}
function closeUploadModal() {
  document.getElementById('upload-modal').classList.remove('open');
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.add('drag-over');
}
function handleDragLeave(e) {
  document.getElementById('drop-zone').classList.remove('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files.length) handleFileSelect(files);
}

function handleFileSelect(files) {
  if (!files || !files.length) return;
  const file = files[0];
  uploadedFile = file;

  const ext = file.name.split('.').pop().toUpperCase();
  const sizeMB = (file.size / 1048576).toFixed(2);

  // Show preview
  document.getElementById('upload-preview').style.display = 'block';
  document.getElementById('preview-name').textContent = file.name;
  document.getElementById('preview-meta').textContent = `${ext} · ${sizeMB} MB · ${new Date().toLocaleTimeString()}`;

  const thumbWrap = document.getElementById('preview-thumb-wrap');
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    const url = URL.createObjectURL(file);
    uploadedURL = url;
    const img = document.createElement('img');
    img.src = url;
    img.className = 'preview-thumb';
    img.alt = 'preview';
    thumbWrap.innerHTML = '';
    thumbWrap.appendChild(img);
  } else {
    const icons = {pdf:'📄', dxf:'📐', dwg:'📐', svg:'🖼️'};
    const icon = icons[ext.toLowerCase()] || '📄';
    thumbWrap.innerHTML = `<div class="preview-thumb-icon">${icon}</div>`;
    uploadedURL = null; // non-image: we'll show a placeholder
  }

  // Enable analyse btn
  document.getElementById('analyse-btn').disabled = false;
  document.getElementById('modal-progress').style.display = 'none';
}

function clearFile() {
  uploadedFile = null;
  uploadedURL = null;
  document.getElementById('upload-preview').style.display = 'none';
  document.getElementById('analyse-btn').disabled = true;
  document.getElementById('modal-progress').style.display = 'none';
  document.getElementById('file-input').value = '';
  document.getElementById('preview-thumb-wrap').innerHTML = '';
}

// ============================================================
// ANALYSIS PIPELINE (simulated ML steps)
// ============================================================
const ANALYSIS_STEPS = [
  {label:'Preprocessing image...', step:'Noise removal · edge sharpening · scale normalise', pct:10},
  {label:'Running YOLOv8 detection...', step:'Scanning for mechanical features and boundaries', pct:28},
  {label:'ResNet classification...', step:'Identifying part types from detected regions', pct:45},
  {label:'OCR dimension extraction...', step:'Reading annotation text, tolerances and symbols', pct:60},
  {label:'DBSCAN feature clustering...', step:'Grouping similar geometric patterns (unsupervised)', pct:72},
  {label:'AutoEncoder anomaly check...', step:'Detecting unusual or non-standard features', pct:82},
  {label:'GNN relationship mapping...', step:'Building part-to-part knowledge graph', pct:91},
  {label:'Fusion model scoring...', step:'Combining all model outputs into final result', pct:100},
];

// Simulated detected regions for uploaded image
// Will be placed as % of image dims so they're responsive
const SIM_DETECTIONS = [
  {key:'shaft',    label:'Main Shaft',         conf:0.96, color:'#00e5ff', l:5,  t:38, w:62, h:12},
  {key:'lbearing', label:'Left Bearing',       conf:0.93, color:'#7c3aed', l:5,  t:28, w:16, h:32},
  {key:'rbearing', label:'Right Bearing',      conf:0.91, color:'#7c3aed', l:72, t:28, w:16, h:32},
  {key:'gear',     label:'Spur Gear',          conf:0.95, color:'#f59e0b', l:32, t:18, w:26, h:50},
  {key:'bolt',     label:'M16 Bolt ×4',        conf:0.89, color:'#ef4444', l:36, t:28, w:6,  h:12},
  {key:'flangeL',  label:'Left Collar',        conf:0.87, color:'#10b981', l:19, t:32, w:8,  h:22},
  {key:'flangeR',  label:'Right Collar',       conf:0.86, color:'#10b981', l:65, t:32, w:8,  h:22},
  {key:'keyway',   label:'Keyway',             conf:0.84, color:'#10b981', l:33, t:37, w:14, h:4},
  {key:'threadL',  label:'Thread End (L)',     conf:0.85, color:'#ef4444', l:0,  t:40, w:6,  h:7},
  {key:'threadR',  label:'Thread End (R)',     conf:0.85, color:'#ef4444', l:88, t:40, w:6,  h:7},
];

function startAnalysis() {
  const btn = document.getElementById('analyse-btn');
  btn.disabled = true;
  btn.textContent = 'Analysing...';

  const prog = document.getElementById('modal-progress');
  prog.style.display = 'block';

  let stepIdx = 0;

  function runStep() {
    if (stepIdx >= ANALYSIS_STEPS.length) {
      // Done — close modal and show result
      setTimeout(() => {
        closeUploadModal();
        showUploadedDrawing();
      }, 400);
      return;
    }
    const s = ANALYSIS_STEPS[stepIdx];
    document.getElementById('mp-label').textContent = s.label;
    document.getElementById('mp-step').textContent = s.step;
    document.getElementById('mp-fill').style.width = s.pct + '%';
    addMLLogEntry(s.label.replace('...','') + ' — complete', getStepTag(stepIdx), getStepColor(stepIdx));
    stepIdx++;
    setTimeout(runStep, 380 + Math.random() * 180);
  }
  runStep();
}

function getStepTag(i) { return ['PRE','SUP','SUP','SUP','UNS','UNS','GNN','FUS'][i] || 'SYS'; }
function getStepColor(i) { return ['#8892a4','#00e5ff','#00e5ff','#00e5ff','#7c3aed','#7c3aed','#10b981','#10b981'][i] || '#8892a4'; }

// ============================================================
// SHOW UPLOADED DRAWING IN CANVAS
// ============================================================
function showUploadedDrawing() {
  const mainSvg = document.getElementById('main-svg');
  const imgWrap = document.getElementById('img-canvas-wrap');
  const imgEl = document.getElementById('uploaded-img');
  const detLayer = document.getElementById('detection-layer');

  // Hide SVG, show image canvas
  mainSvg.style.display = 'none';
  imgWrap.style.display = 'block';
  detLayer.innerHTML = '';

  // Set image source
  if (uploadedURL) {
    imgEl.src = uploadedURL;
    imgEl.style.display = 'block';
  } else {
    // Non-image file: show a styled placeholder
    imgEl.style.display = 'none';
    detLayer.innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#888;font-family:'DM Mono',monospace;font-size:13px;background:#f5f0e8;border-radius:10px"><div style="font-size:40px">📐</div><div>${uploadedFile ? uploadedFile.name : 'Drawing'}</div><div style="font-size:11px;color:#aaa">Image preview not available for this format — analysis complete</div></div>`;
  }

  // Run scan animation
  runScan();

  // Place detection boxes after image loads
  if (uploadedURL) {
    if (imgEl.complete) {
      placeDetectionBoxes();
    } else {
      imgEl.onload = () => placeDetectionBoxes();
    }
  } else {
    placeDetectionBoxes();
  }

  // Update stats
  document.getElementById('part-count').textContent = `${SIM_DETECTIONS.length} parts detected`;
  showNotif(`✓ Analysis complete — ${SIM_DETECTIONS.length} parts detected`);

  // Update info panel reset
  document.getElementById('selected-name').textContent = 'Hover a part';
  document.getElementById('selected-type').textContent = '— no selection —';
}

function placeDetectionBoxes() {
  const detLayer = document.getElementById('detection-layer');
  detLayer.innerHTML = '';
  detLayer.style.pointerEvents = 'none';

  SIM_DETECTIONS.forEach((det, idx) => {
    setTimeout(() => {
      const box = document.createElement('div');
      box.className = 'det-box';
      box.style.cssText = `
        left:${det.l}%;top:${det.t}%;width:${det.w}%;height:${det.h}%;
        border-color:${det.color};background:${det.color}18;
        animation:boxIn .25s ease both;opacity:0.85;
      `;

      const lbl = document.createElement('div');
      lbl.className = 'det-label';
      lbl.style.cssText = `background:${det.color};color:#000;`;
      lbl.textContent = det.label;
      box.appendChild(lbl);

      const conf = document.createElement('div');
      conf.className = 'det-conf';
      conf.style.cssText = `background:${det.color}33;color:${det.color};border:1px solid ${det.color}44`;
      conf.textContent = Math.round(det.conf * 100) + '%';
      box.appendChild(conf);

      box.addEventListener('mouseenter', () => {
        const part = PARTS[det.key];
        if (part) updateInfoPanel(det.key, part);
      });
      box.addEventListener('click', () => {
        document.querySelectorAll('.det-box').forEach(b => { b.style.opacity='0.85'; b.style.borderWidth='2px'; });
        box.style.opacity = '1';
        box.style.borderWidth = '3px';
        setTab('info');
      });

      detLayer.appendChild(box);
    }, idx * 120);
  });
}

// Override Train tab upload zone to open modal
document.addEventListener('DOMContentLoaded', () => {
  const oldZone = document.querySelector('#tab-train .upload-zone');
  if (oldZone) oldZone.onclick = openUploadModal;
});
