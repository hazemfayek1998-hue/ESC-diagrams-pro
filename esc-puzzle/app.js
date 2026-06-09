/* ESC Puzzle — main app
 * 3 modes: algorithm-order, label-drag, piece-puzzle
 * Anchor system: pin steps in place
 * localStorage persistence
 * Personal use, no external network calls
 */
(() => {
  'use strict';

  // ============================================================
  // STORAGE
  // ============================================================
  const STORE_KEY = 'escpuzzle.v1.charts';
  const PREFS_KEY = 'escpuzzle.v1.prefs';

  const Store = {
    list() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
      catch { return []; }
    },
    save(charts) {
      localStorage.setItem(STORE_KEY, JSON.stringify(charts));
    },
    get(id) { return Store.list().find(c => c.id === id); },
    upsert(chart) {
      const charts = Store.list();
      const i = charts.findIndex(c => c.id === chart.id);
      if (i >= 0) charts[i] = chart; else charts.push(chart);
      Store.save(charts);
    },
    remove(id) {
      Store.save(Store.list().filter(c => c.id !== id));
    },
    getPrefs() {
      try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); }
      catch { return {}; }
    },
    setPrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }
  };

  // ============================================================
  // UTILITIES
  // ============================================================
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const escapeHTML = s => String(s || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg, ms = 2200) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, ms);
  }

  // ============================================================
  // ROUTER (simple tab switcher)
  // ============================================================
  const Router = {
    current: 'library',
    currentChartId: null,
    currentMode: 'order',
    show(view) {
      $$('.view').forEach(v => {
        v.classList.toggle('active', v.id === 'view-' + view);
      });
      $$('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.view === view);
      });
      Router.current = view;
      if (view === 'library') renderLibrary();
      if (view === 'study') renderStudy();
    }
  };

  // ============================================================
  // LIBRARY VIEW
  // ============================================================
  function renderLibrary() {
    const charts = Store.list();
    const grid = $('#library-grid');
    const empty = $('#library-empty');
    grid.innerHTML = '';
    if (charts.length === 0) {
      grid.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }
    grid.classList.remove('hidden');
    empty.classList.add('hidden');
    charts.forEach(c => {
      const card = document.createElement('div');
      card.className = 'lib-card';
      const nodeCount = (c.nodes || []).length;
      card.innerHTML = `
        <h3>${escapeHTML(c.title)}</h3>
        <div class="src">${escapeHTML(c.source || '—')}</div>
        <div class="meta">
          <span class="tag">${modeLabel(c.mode)}</span>
          <span class="tag">${nodeCount} steps</span>
          <span class="tag">${c.style || 'hf'}</span>
        </div>
        <div class="lib-actions">
          <button class="btn primary" data-act="study">Study</button>
          <button class="btn" data-act="edit">Edit</button>
          <button class="btn danger" data-act="del">Delete</button>
        </div>
      `;
      card.querySelector('[data-act=study]').onclick = () => {
        Router.currentChartId = c.id;
        Router.currentMode = c.mode || 'order';
        Router.show('study');
      };
      card.querySelector('[data-act=edit]').onclick = () => {
        Router.currentChartId = c.id;
        Router.show('builder');
        loadBuilder(c);
      };
      card.querySelector('[data-act=del]').onclick = () => {
        if (confirm(`Delete "${c.title}"?`)) {
          Store.remove(c.id);
          renderLibrary();
          toast('Chart deleted');
        }
      };
      grid.appendChild(card);
    });
  }

  function modeLabel(m) {
    return { order: 'Algorithm', label: 'Label-drag', piece: 'Piece-puzzle' }[m] || m;
  }

  // ============================================================
  // SAMPLE CHARTS (built from user's screenshots)
  // ============================================================
  function loadSamples() {
    const samples = [sampleHF(), sampleSMVT(), sampleAR()];
    const existing = Store.list();
    samples.forEach(s => {
      if (!existing.find(c => c.title === s.title)) Store.upsert(s);
    });
    renderLibrary();
    toast('Loaded ' + samples.length + ' ESC sample charts');
  }

  function sampleHF() {
    // ESC 2021 HF guideline — Figure 1 (Diagnostic algorithm for heart failure)
    return {
      id: uid(),
      title: 'Diagnostic algorithm for heart failure',
      source: '2021 ESC HF Guideline, Figure 1',
      mode: 'order',
      style: 'hf',
      edges: [
        ['n0','n1'], ['n1','n2'], ['n2','n3', 'N'], ['n3','n4', 'Y'],
        ['n2','n9', 'N'], ['n4','n5', 'Y'], ['n4','n9', 'N'],
        ['n5','n6'], ['n5','n7'], ['n5','n8'],
        ['n6','n11'], ['n7','n11'], ['n8','n11'],
        ['n9','n10']
      ],
      nodes: [
        { id: 'n0', x: 50, y: 10,  w: 40, h: 6,  text: 'Diagnostic algorithm for heart failure', kind: 'title' },
        { id: 'n1', x: 42, y: 22, w: 16, h: 12, text: 'Suspected heart failure', kind: 'q',
          sub: '• Risk factors\n• Symptoms/signs\n• Abnormal ECG' },
        { id: 'n2', x: 42, y: 38, w: 16, h: 10, text: 'NT-proBNP ≥ 125 pg/mL\nor BNP ≥ 35 pg/mL', kind: 'q' },
        { id: 'n3', x: 42, y: 52, w: 16, h: 7,  text: 'Echocardiography', kind: 'q' },
        { id: 'n4', x: 42, y: 63, w: 16, h: 7,  text: 'Abnormal findings', kind: 'q' },
        { id: 'n5', x: 38, y: 75, w: 24, h: 10, text: 'Heart failure confirmed\nDefine HF phenotype (LVEF)', kind: 'q' },
        { id: 'n6', x: 28, y: 88, w: 10, h: 8,  text: '≤40%\n(HFrEF)', kind: 'class-iia' },
        { id: 'n7', x: 45, y: 88, w: 10, h: 8,  text: '41–49%\n(HFmrEF)', kind: 'class-iia' },
        { id: 'n8', x: 62, y: 88, w: 10, h: 8,  text: '≥50%\n(HFpEF)', kind: 'class-iia' },
        { id: 'n9', x: 4,  y: 75, w: 18, h: 8,  text: 'Heart failure unlikely', kind: 'outcome' },
        { id: 'n10', x: 4, y: 88, w: 18, h: 8,  text: 'Consider other diagnoses', kind: 'outcome' },
        { id: 'n11', x: 36, y: 100, w: 28, h: 7, text: 'Determine aetiology and commence treatment', kind: 'action' }
      ],
      // correct sequence (the order they should be placed in, top-to-bottom logical)
      solution: ['n0','n1','n2','n3','n4','n5','n6','n7','n8','n9','n10','n11']
    };
  }

  function sampleSMVT() {
    // ESC 2022 VA & SCD prevention — Figure 13 (SMVT in chronic CAD)
    return {
      id: uid(),
      title: 'Management of SMVT in chronic CAD',
      source: '2022 ESC VA & SCD Prevention, Figure 13',
      mode: 'order',
      style: 'arr',
      edges: [
        ['n0','n1'], ['n0','n2'],
        ['n1','n5'], ['n1','n6'], ['n1','n7'],
        ['n5','n8'], ['n6','n8'], ['n7','n12'],
        ['n8','n11', 'Y'], ['n8','n12', 'N'],
        ['n2','n3'], ['n2','n4'],
        ['n3','n9'], ['n4','n10'],
        ['n10','n13', 'Y'], ['n10','n14', 'N']
      ],
      nodes: [
        { id: 'n0', x: 30, y: 4,  w: 40, h: 6,  text: 'SMVT in a patient with chronic CAD', kind: 'title' },
        { id: 'n1', x: 12, y: 16, w: 18, h: 7,  text: 'First presentation', kind: 'q' },
        { id: 'n2', x: 60, y: 16, w: 22, h: 7,  text: 'SMVT in ICD carriers', kind: 'q' },
        { id: 'n3', x: 60, y: 28, w: 18, h: 7,  text: 'Electrical storm', kind: 'q' },
        { id: 'n4', x: 78, y: 28, w: 18, h: 7,  text: 'Symptomatic SMVT', kind: 'q' },
        { id: 'n5', x: 6,  y: 36, w: 14, h: 6,  text: '≥40%', kind: 'q' },
        { id: 'n6', x: 22, y: 36, w: 14, h: 6,  text: 'LVEF', kind: 'q' },
        { id: 'n7', x: 36, y: 36, w: 14, h: 6,  text: '<40%', kind: 'q' },
        { id: 'n8', x: 4,  y: 50, w: 18, h: 8,  text: 'Haemodynamically tolerated', kind: 'q' },
        { id: 'n9', x: 58, y: 44, w: 22, h: 8,  text: 'Go to flowchart — electrical storm (Fig 11)', kind: 'action' },
        { id: 'n10', x: 78, y: 50, w: 18, h: 7, text: 'On amiodarone', kind: 'q' },
        { id: 'n11', x: 4,  y: 70, w: 18, h: 11, text: 'Catheter ablation (IIa)\nICD implantation (IIa)\nAmiodarone (IIa)', kind: 'class-iia' },
        { id: 'n12', x: 28, y: 70, w: 18, h: 11, text: 'ICD implantation (I)\nCatheter ablation (IIb)', kind: 'class-i' },
        { id: 'n13', x: 62, y: 70, w: 14, h: 9,  text: 'Catheter ablation (I)', kind: 'class-i' },
        { id: 'n14', x: 80, y: 70, w: 18, h: 11, text: 'Catheter ablation (IIa)\nSotalol (IIa)\nAmiodarone (IIa)', kind: 'class-iia' }
      ],
      solution: ['n0','n1','n2','n3','n4','n5','n6','n7','n8','n9','n10','n11','n12','n13','n14']
    };
  }

  function sampleAR() {
    // ESC/EACTS 2021 Valvular — Figure 5 (Aortic regurgitation management)
    return {
      id: uid(),
      title: 'Management of patients with aortic regurgitation',
      source: '2021 ESC/EACTS Valvular, Figure 5',
      mode: 'order',
      style: 'valve',
      edges: [
        ['n0','n1'],
        ['n1','n2', 'N'], ['n1','n3', 'Y'],
        ['n2','n4', 'Y'], ['n2','n7', 'N'],
        ['n3','n5', 'N'], ['n3','n6', 'Y'],
        ['n5','n14', 'N'], ['n5','n6', 'Y'],
        ['n4','n8', 'Y'], ['n4','n7', 'N'],
        ['n6','n15', 'Y'], ['n6','n8', 'N'],
        ['n7','n10', 'Y'],
        ['n8','n11', 'Y'],
        ['n11','n15', 'Y'], ['n11','n14', 'N'],
        ['n12','n8', 'Y'], ['n12','n16', 'N'],
        ['n2','n13', 'N']
      ],
      nodes: [
        { id: 'n0',  x: 40, y: 3,  w: 22, h: 6,  text: 'Patient with AR', kind: 'title' },
        { id: 'n1',  x: 30, y: 13, w: 38, h: 6,  text: 'Significant aortic root enlargement', kind: 'q' },
        { id: 'n2',  x: 8,  y: 23, w: 18, h: 6,  text: 'Severe AR', kind: 'q' },
        { id: 'n3',  x: 50, y: 23, w: 22, h: 6,  text: 'Significant AR', kind: 'q' },
        { id: 'n4',  x: 32, y: 33, w: 18, h: 6,  text: 'Symptoms', kind: 'q' },
        { id: 'n5',  x: 50, y: 33, w: 18, h: 6,  text: 'VSARR', kind: 'q' },
        { id: 'n6',  x: 70, y: 33, w: 18, h: 9,  text: 'Good tissue quality\nTeam expertise\nYoung patient', kind: 'q' },
        { id: 'n7',  x: 4,  y: 48, w: 18, h: 7,  text: 'LVEF ≤50% or\nLVESD >50 mm or\nLVESDi >25 mm/m²', kind: 'q' },
        { id: 'n8',  x: 28, y: 48, w: 22, h: 7,  text: 'AV surgery\n(Class I)', kind: 'class-i' },
        { id: 'n9',  x: 4,  y: 60, w: 18, h: 8,  text: 'LVEF ≤55% or\nLVESDi >22 mm/m² or\nLVESVi >45 mL/m²', kind: 'q' },
        { id: 'n10', x: 28, y: 60, w: 18, h: 7,  text: 'AV surgery\n(Class IIb)', kind: 'class-iib' },
        { id: 'n11', x: 52, y: 50, w: 18, h: 6,  text: 'Good tissue quality\nTeam expertise\nYoung patient', kind: 'q' },
        { id: 'n12', x: 76, y: 48, w: 18, h: 6,  text: 'Eligible for surgery', kind: 'q' },
        { id: 'n13', x: 4,  y: 76, w: 14, h: 7,  text: 'Follow-up', kind: 'outcome' },
        { id: 'n14', x: 50, y: 60, w: 14, h: 7,  text: 'SAVR', kind: 'outcome' },
        { id: 'n15', x: 66, y: 60, w: 14, h: 7,  text: 'AV repair (IIa)', kind: 'class-iia' },
        { id: 'n16', x: 82, y: 60, w: 14, h: 7,  text: 'TAVI (IIb)', kind: 'class-iib' }
      ],
      solution: ['n0','n1','n2','n3','n4','n5','n6','n7','n8','n9','n10','n11','n12','n13','n14','n15','n16']
    };
  }

  // ============================================================
  // STUDY VIEW
  // ============================================================
  function renderStudy() {
    const chart = Store.get(Router.currentChartId);
    const head = $('#study-head');
    const canvas = $('#study-canvas');
    const fb = $('#study-feedback');
    fb.textContent = '';
    canvas.innerHTML = '';
    if (!chart) {
      head.innerHTML = '<p class="dim">No chart loaded. Pick one from the library.</p>';
      return;
    }
    head.innerHTML = `
      <h1>${escapeHTML(chart.title)}</h1>
      <div class="src">${escapeHTML(chart.source || '')}</div>
    `;
    // mode buttons
    $$('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === Router.currentMode);
    });
    // dispatch to mode
    if (Router.currentMode === 'order') renderModeOrder(chart, canvas, fb);
    else if (Router.currentMode === 'label') renderModeLabel(chart, canvas, fb);
    else if (Router.currentMode === 'piece') renderModePiece(chart, canvas, fb);

    // ESC figure title bar (mimics the title pill at the top of ESC figures)
    const titleBar = document.createElement('div');
    titleBar.className = 'fig-title-bar';
    titleBar.textContent = chart.title;
    canvas.appendChild(titleBar);

    // ESC mark
    const mark = document.createElement('div');
    mark.className = 'esc-mark';
    mark.innerHTML = `<span class="h">♥</span><span>ESC</span>`;
    canvas.appendChild(mark);
  }

  // ---- Shared: drag engine (pointer events) ----
  // Uses % coordinates inside the canvas so it scales with the box.
  function makeDraggable(el, onDragEnd) {
    let startX, startY, origLeftPct, origTopPct, dragging = false;
    const canvas = el.parentElement;
    el.addEventListener('pointerdown', (e) => {
      if (el.classList.contains('locked')) return;
      try { el.setPointerCapture(e.pointerId); } catch {}
      dragging = true;
      el.classList.add('dragging');
      startX = e.clientX; startY = e.clientY;
      origLeftPct = parseFloat(el.style.left) || 0;
      origTopPct = parseFloat(el.style.top) || 0;
      e.preventDefault();
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const sw = canvas.scrollWidth || canvas.clientWidth;
      const sh = canvas.scrollHeight || canvas.clientHeight;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newLeft = origLeftPct + (dx / sw) * 100;
      let newTop = origTopPct + (dy / sh) * 100;
      newLeft = Math.max(-5, Math.min(105, newLeft));
      newTop = Math.max(-5, Math.min(105, newTop));
      el.style.left = newLeft + '%';
      el.style.top = newTop + '%';
    });
    el.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      try { el.releasePointerCapture(e.pointerId); } catch {}
      if (onDragEnd) onDragEnd(el);
    });
    el.addEventListener('pointercancel', () => { dragging = false; el.classList.remove('dragging'); });
  }

  function makeNodeEl(node, chart) {
    const el = document.createElement('div');
    el.className = 'node ' + (node.kind === 'q' ? '' :
                              node.kind === 'action' ? 'action' :
                              node.kind === 'outcome' ? 'outcome' :
                              node.kind === 'dec' ? 'dec' :
                              node.kind === 'title' ? 'title-node' :
                              node.kind === 'class-i' ? 'class-i' :
                              node.kind === 'class-iia' ? 'class-iia' :
                              node.kind === 'class-iib' ? 'class-iib' :
                              node.kind === 'class-iii' ? 'class-iii' : '');
    el.dataset.id = node.id;
    el.style.left = node.x + '%';
    el.style.top = node.y + '%';
    el.style.width = node.w + '%';
    el.style.minHeight = node.h + '%';
    const main = (node.text || '').split('\n')[0];
    const rest = (node.text || '').split('\n').slice(1);
    el.innerHTML = `<div><strong>${escapeHTML(main)}</strong></div>${rest.length ? '<div class="badge">' + rest.map(escapeHTML).join(' · ') + '</div>' : ''}<button class="pin-btn" title="Pin this step in place">📌</button>`;
    if (chart.pinned && chart.pinned.includes(node.id)) {
      el.classList.add('locked');
    }
    // Pin button click — toggle pin state
    const pinBtn = el.querySelector('.pin-btn');
    pinBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      togglePin(chart, node.id);
      el.classList.toggle('locked');
      toast(el.classList.contains('locked') ? 'Pinned — step is now an anchor' : 'Unpinned');
    });
    // prevent pin click from initiating drag
    pinBtn.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    return el;
  }

  // Pin/unpin a node (lock it in place). Persists to chart.
  function togglePin(chart, nodeId) {
    chart.pinned = chart.pinned || [];
    const i = chart.pinned.indexOf(nodeId);
    if (i >= 0) chart.pinned.splice(i, 1);
    else chart.pinned.push(nodeId);
    Store.upsert(chart);
  }

  // ---- Helper: draw connecting arrows between nodes (ESC style) ----
  // Arrows always go to the ghost position (the "correct" location), regardless
  // of where the actual draggable node currently is. This makes the figure
  // read as the answer key, and the user fills in the nodes.
  function drawArrows(canvas, chart, opts = {}) {
    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    layer.setAttribute('class', 'svg-layer');
    canvas.appendChild(layer);
    requestAnimationFrame(() => {
      const cRect = canvas.getBoundingClientRect();
      const w = canvas.scrollWidth;
      const h = canvas.scrollHeight;
      layer.setAttribute('width', w);
      layer.setAttribute('height', h);
      layer.setAttribute('viewBox', `0 0 ${w} ${h}`);
      layer.style.width = w + 'px';
      layer.style.height = h + 'px';
      const edges = (chart.edges || []);
      edges.forEach(([fromId, toId, label]) => {
        // Always prefer ghost (correct position) over actual node position
        const fromGhost = canvas.querySelector(`.target[data-ghost="${fromId}"]`);
        const toGhost = canvas.querySelector(`.target[data-ghost="${toId}"]`);
        if (!fromGhost || !toGhost) return;
        const f = fromGhost.getBoundingClientRect();
        const t = toGhost.getBoundingClientRect();
        const x1 = f.left + f.width / 2 - cRect.left;
        const y1 = f.bottom - cRect.top;
        const x2 = t.left + t.width / 2 - cRect.left;
        const y2 = t.top - cRect.top;
        const midY = (y1 + y2) / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#777');
        path.setAttribute('stroke-width', '1.4');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        path.setAttribute('opacity', '0.45');
        layer.appendChild(path);
        if (label) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', (x1 + x2) / 2);
          text.setAttribute('y', midY - 4);
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('font-size', '11');
          text.setAttribute('font-family', 'Arial');
          text.setAttribute('fill', label === 'N' ? '#C46C6C' : label === 'Y' ? '#6CA76C' : '#5a5a5a');
          text.setAttribute('font-weight', 'bold');
          text.textContent = label;
          layer.appendChild(text);
        }
      });
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = '<marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="#777" /></marker>';
      layer.insertBefore(defs, layer.firstChild);
    });
  }

  // ---- MODE 1: Algorithm order ----
  // Scrambles node positions into a "tray" at the bottom; user drags them
  // back to the correct x,y spots. Anchored nodes stay where they are.
  function renderModeOrder(chart, canvas, fb) {
    canvas.style.minHeight = '500px';
    const solution = chart.solution || chart.nodes.map(n => n.id);
    // Compute canvas area based on node positions
    const maxX = Math.max(...chart.nodes.map(n => n.x + n.w));
    const maxY = Math.max(...chart.nodes.map(n => n.y + n.h));
    canvas.style.minHeight = (maxY * 6 + 80) + 'px';

    // Anchored nodes stay in place. All other nodes get tossed to a tray
    // along the bottom for the user to drag back to their original spots.
    // We make the canvas tall enough to contain both the figure and the tray.
    const trayStartPct = Math.min(120, maxY + 10);
    canvas.style.minHeight = ((trayStartPct + 30) * 6) + 'px';
    let trayX = 2;
    let trayY = trayStartPct;
    // Get non-anchored nodes in scrambled order
    const anchored = (chart.pinned || []);
    const movable = shuffle(chart.nodes.filter(n => !anchored.includes(n.id)));

    // First, draw ghost outlines (faint dashed boxes) at every node's correct position
    // so the user has a visual map of where things go.
    chart.nodes.forEach(n => {
      const ghost = document.createElement('div');
      ghost.className = 'target ghost';
      ghost.style.left = n.x + '%';
      ghost.style.top = n.y + '%';
      ghost.style.width = n.w + '%';
      ghost.style.minHeight = n.h + '%';
      ghost.style.pointerEvents = 'none';
      ghost.dataset.ghost = n.id;
      canvas.appendChild(ghost);
    });

    // Place anchored nodes at their original positions
    chart.nodes.filter(n => anchored.includes(n.id)).forEach(node => {
      const el = makeNodeEl(node, chart);
      el.classList.add('locked');
      canvas.appendChild(el);
    });

    // Place movable nodes in a tray along the bottom, in scrambled order
    movable.forEach(node => {
      const placed = { ...node, x: trayX, y: trayY };
      const el = makeNodeEl(placed, chart);
      el.style.opacity = '0.92';
      canvas.appendChild(el);
      trayX += node.w + 1.5;
      if (trayX > 88) { trayX = 2; trayY += 12; }

      makeDraggable(el, (draggedEl) => {
        // snap to original spot when close
        const original = chart.nodes.find(n => n.id === draggedEl.dataset.id);
        const dleft = parseFloat(draggedEl.style.left);
        const dtop = parseFloat(draggedEl.style.top);
        const tolX = 5, tolY = 4;
        if (Math.abs(dleft - original.x) < tolX && Math.abs(dtop - original.y) < tolY) {
          draggedEl.style.left = original.x + '%';
          draggedEl.style.top = original.y + '%';
          draggedEl.classList.add('correct');
          draggedEl.style.opacity = '1';
          // strengthen the ghost
          const ghost = canvas.querySelector(`.target[data-ghost="${original.id}"]`);
          if (ghost) ghost.style.opacity = '0.45';
          checkOrderComplete(chart, canvas, fb);
        }
      });
    });

    // Draw connecting arrows as the static reference answer
    // (user drags scrambled chips to match this layout)
    drawArrows(canvas, chart);
  }

  function checkOrderComplete(chart, canvas, fb) {
    const allNodes = $$('.node', canvas);
    const placed = allNodes.filter(n => n.classList.contains('correct') || n.classList.contains('locked'));
    if (placed.length === allNodes.length) {
      fb.className = 'feedback ok';
      fb.textContent = '✓ All steps in place. Lock them in muscle memory.';
    } else {
      fb.className = 'feedback hint';
      fb.textContent = `${placed.length}/${allNodes.length} steps correct. Keep going.`;
    }
  }

  // ---- MODE 2: Label-drag ----
  // In label mode, the chart has `labels: [{id, text, target: nodeId, x, y, w, h}]`
  // We draw the target boxes on the chart and floating label chips to drag in.
  function renderModeLabel(chart, canvas, fb) {
    canvas.style.minHeight = '500px';
    if (!chart.labels || chart.labels.length === 0) {
      fb.className = 'feedback hint';
      fb.textContent = 'This chart has no labels defined. Use Algorithm or Piece-puzzle mode for now.';
      return;
    }
    // Draw target boxes at each labeled node
    chart.labels.forEach(lab => {
      const t = document.createElement('div');
      t.className = 'target';
      t.dataset.target = lab.target;
      t.style.left = lab.x + '%';
      t.style.top = lab.y + '%';
      t.style.width = lab.w + '%';
      t.style.minHeight = (lab.h || 8) + '%';
      t.textContent = '?';
      canvas.appendChild(t);
    });
    // Scrambled label chips
    const scrambled = shuffle([...chart.labels]);
    let tx = 2, ty = 70;
    scrambled.forEach((lab, i) => {
      const chip = document.createElement('div');
      chip.className = 'node action';
      chip.dataset.id = lab.id;
      chip.dataset.target = lab.target;
      chip.textContent = lab.text;
      chip.style.left = tx + '%';
      chip.style.top = ty + '%';
      chip.style.width = '18%';
      chip.style.minHeight = '6%';
      chip.style.fontSize = '12px';
      canvas.appendChild(chip);
      tx += 19;
      if (tx > 80) { tx = 2; ty += 8; }
      makeDraggable(chip, (el) => {
        // check overlap with target
        const target = $$('.target', canvas).find(t => t.dataset.target === el.dataset.target);
        if (!target) return;
        const elRect = el.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        const overlap = !(elRect.right < tRect.left || elRect.left > tRect.right ||
                          elRect.bottom < tRect.top || elRect.top > tRect.bottom);
        if (overlap) {
          el.style.left = target.style.left;
          el.style.top = target.style.top;
          el.style.width = target.style.width;
          target.classList.add('correct');
          target.classList.add('filled');
          target.textContent = lab.text;
          el.style.opacity = '0';
          setTimeout(() => el.remove(), 200);
          checkLabelComplete(chart, canvas, fb);
        }
      });
    });
  }

  function checkLabelComplete(chart, canvas, fb) {
    const remaining = $$('.node.action', canvas).filter(n => n.style.opacity !== '0');
    if (remaining.length === 0) {
      fb.className = 'feedback ok';
      fb.textContent = '✓ All labels placed correctly.';
    } else {
      fb.className = 'feedback hint';
      fb.textContent = `${chart.labels.length - remaining.length}/${chart.labels.length} labels placed.`;
    }
  }

  // ---- MODE 3: Piece puzzle (free rearrange) ----
  // Nodes are scrambled across the canvas; user drags them where they belong.
  // "Check" button reveals correct positions with color hints.
  function renderModePiece(chart, canvas, fb) {
    canvas.style.minHeight = '500px';
    const maxX = Math.max(...chart.nodes.map(n => n.x + n.w));
    const maxY = Math.max(...chart.nodes.map(n => n.y + n.h));
    canvas.style.minHeight = (maxY * 6 + 80) + 'px';

    // Show ghost outlines at correct positions
    chart.nodes.forEach(n => {
      const ghost = document.createElement('div');
      ghost.className = 'target';
      ghost.style.left = n.x + '%';
      ghost.style.top = n.y + '%';
      ghost.style.width = n.w + '%';
      ghost.style.minHeight = n.h + '%';
      ghost.style.opacity = '0.25';
      ghost.style.borderStyle = 'dotted';
      ghost.dataset.ghost = n.id;
      canvas.appendChild(ghost);
    });

    // Place nodes in scrambled order across the canvas
    const scrambled = shuffle([...chart.nodes]);
    let x = 2, y = maxY + 6;
    scrambled.forEach(n => {
      const el = makeNodeEl(n, chart);
      el.style.left = x + '%';
      el.style.top = y + '%';
      canvas.appendChild(el);
      makeDraggable(el, (dragged) => {
        // proximity check
        const ghost = $$('.target[data-ghost]', canvas).find(g => g.dataset.ghost === dragged.dataset.id);
        if (!ghost) return;
        const dRect = dragged.getBoundingClientRect();
        const gRect = ghost.getBoundingClientRect();
        const close = Math.abs(dRect.left - gRect.left) < 30 && Math.abs(dRect.top - gRect.top) < 30;
        if (close) {
          dragged.classList.add('correct');
          ghost.style.opacity = '0.6';
        } else {
          dragged.classList.remove('correct');
          ghost.style.opacity = '0.25';
        }
        checkPieceComplete(canvas, fb);
      });
      x += n.w + 2;
      if (x > 90) { x = 2; y += 10; }
    });

    // Add a "snap to correct" button
    const snap = document.createElement('button');
    snap.className = 'btn primary';
    snap.textContent = 'Snap all to correct';
    snap.style.position = 'absolute';
    snap.style.top = '8px';
    snap.style.right = '40px';
    snap.onclick = () => {
      $$('.node', canvas).forEach(el => {
        const n = chart.nodes.find(nn => nn.id === el.dataset.id);
        if (n) {
          el.style.left = n.x + '%';
          el.style.top = n.y + '%';
          el.classList.add('correct');
        }
      });
      $$('.target[data-ghost]', canvas).forEach(g => g.style.opacity = '0.6');
      fb.className = 'feedback ok';
      fb.textContent = '✓ Snapped. Study the layout.';
    };
    canvas.appendChild(snap);
  }

  function checkPieceComplete(canvas, fb) {
    const total = $$('.node', canvas).length;
    const correct = $$('.node.correct', canvas).length;
    if (correct === total && total > 0) {
      fb.className = 'feedback ok';
      fb.textContent = '✓ All pieces in place.';
    } else if (correct > 0) {
      fb.className = 'feedback hint';
      fb.textContent = `${correct}/${total} pieces positioned.`;
    }
  }

  // Fisher–Yates shuffle
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ============================================================
  // BUILDER
  // ============================================================
  function loadBuilder(chart) {
    $('#b-title').value = chart.title || '';
    $('#b-source').value = chart.source || '';
    $('#b-mode').value = chart.mode || 'order';
    $('#b-style').value = chart.style || 'hf';
    $('#b-steps').value = (chart.nodes || []).map(n => n.text).join('\n');
    $('#b-edges').value = '';
    renderBuilderPreview();
  }

  function renderBuilderPreview() {
    const title = $('#b-title').value || 'Untitled chart';
    const source = $('#b-source').value || '';
    const style = $('#b-style').value;
    const steps = $('#b-steps').value.split('\n').filter(s => s.trim());
    const mode = $('#b-mode').value;
    const canvas = $('#b-preview');
    canvas.innerHTML = '';
    if (steps.length === 0) {
      canvas.innerHTML = '<p class="dim">Add steps to see a preview</p>';
      return;
    }
    // create a simple auto-layout preview: vertical chain
    const fakeChart = {
      mode, style, source,
      title, pinned: [],
      nodes: steps.map((t, i) => ({
        id: 'p' + i, x: 30, y: 4 + i * 11, w: 40, h: 8, text: t
      })),
      solution: steps.map((_, i) => 'p' + i)
    };
    if (mode === 'order') renderModeOrder(fakeChart, canvas, $('#study-feedback') || document.createElement('div'));
    else if (mode === 'piece') renderModePiece(fakeChart, canvas, $('#study-feedback') || document.createElement('div'));
    else renderModeLabel({ ...fakeChart, labels: steps.map((t, i) => ({ id: 'L'+i, text: t, target: 'p'+i, x: 30, y: 4 + i * 11, w: 40, h: 8 })) }, canvas, $('#study-feedback') || document.createElement('div'));
  }

  function saveBuilder() {
    const title = $('#b-title').value.trim();
    if (!title) { toast('Title required'); return; }
    const steps = $('#b-steps').value.split('\n').map(s => s.trim()).filter(Boolean);
    if (steps.length < 2) { toast('Add at least 2 steps'); return; }
    const mode = $('#b-mode').value;
    const style = $('#b-style').value;
    const source = $('#b-source').value.trim();
    // For label mode, default: each step is its own target
    const nodes = steps.map((t, i) => ({
      id: 'n' + i, x: 30, y: 4 + i * 11, w: 40, h: 8, text: t
    }));
    const chart = {
      id: Router.currentChartId || uid(),
      title, source, mode, style,
      nodes,
      solution: nodes.map(n => n.id)
    };
    if (mode === 'label') {
      chart.labels = steps.map((t, i) => ({
        id: 'L' + i, text: t, target: 'n' + i, x: 30, y: 4 + i * 11, w: 40, h: 8
      }));
    }
    Store.upsert(chart);
    toast('Chart saved');
    Router.currentChartId = chart.id;
    Router.show('library');
  }

  // ============================================================
  // IMPORT / EXPORT
  // ============================================================
  function exportAll() {
    const data = { version: 1, exported: new Date().toISOString(), charts: Store.list() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `esc-puzzle-${Date.now()}.json`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
    toast('Exported');
  }

  function importJSON(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        const incoming = Array.isArray(data) ? data : (data.charts || []);
        if (!Array.isArray(incoming)) throw new Error('Bad format');
        const existing = Store.list();
        let added = 0;
        incoming.forEach(c => {
          if (!c.id) c.id = uid();
          if (!existing.find(e => e.id === c.id || e.title === c.title)) {
            existing.push(c); added++;
          }
        });
        Store.save(existing);
        renderLibrary();
        toast(`Imported ${added} chart(s)`);
      } catch (err) {
        toast('Import failed: ' + err.message);
      }
    };
    r.readAsText(file);
  }

  // ============================================================
  // EVENT WIRING
  // ============================================================
  function wire() {
    // tabs
    $('#tabs').addEventListener('click', (e) => {
      const t = e.target.closest('.tab');
      if (!t) return;
      Router.show(t.dataset.view);
    });

    // library actions
    $('#export-all').onclick = exportAll;
    $('#import-file').onchange = (e) => {
      const f = e.target.files[0];
      if (f) importJSON(f);
      e.target.value = '';
    };
    $('#load-samples').onclick = loadSamples;

    // study
    $('#mode-switch').addEventListener('click', (e) => {
      const b = e.target.closest('.mode-btn');
      if (!b) return;
      Router.currentMode = b.dataset.mode;
      renderStudy();
    });
    $('#reset-puzzle').onclick = () => renderStudy();
    $('#show-solution').addEventListener('change', (e) => {
      const show = e.target.checked;
      if (!show) { renderStudy(); return; }
      // visualize solution: snap everything
      const chart = Store.get(Router.currentChartId);
      if (!chart) return;
      $$('.node', $('#study-canvas')).forEach(el => {
        const n = chart.nodes.find(nn => nn.id === el.dataset.id);
        if (n) {
          el.style.left = n.x + '%';
          el.style.top = n.y + '%';
          el.classList.add('correct');
        }
      });
      $('#study-feedback').className = 'feedback hint';
      $('#study-feedback').textContent = 'Solution shown.';
    });

    // builder
    ['b-title','b-source','b-mode','b-style','b-steps','b-edges'].forEach(id => {
      $('#' + id).addEventListener('input', renderBuilderPreview);
      $('#' + id).addEventListener('change', renderBuilderPreview);
    });
    $('#b-save').onclick = saveBuilder;
    $('#b-cancel').onclick = () => { Router.currentChartId = null; Router.show('library'); };

    // about link
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-view]')) Router.show(e.target.dataset.view);
    });
  }

  // ============================================================
  // BOOT
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    wire();
    Router.show('library');
  });

  // register service worker for offline PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
