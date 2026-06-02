  // كائن تعريف وحالة الخلايا والأعمدة لمحرك الأوفيس
  const colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const maxRows = 20;

  const state = {
    activeApp: 'word',
    activeTab: 'home',
    zoom: 100,
    wordRuler: true,
    wordGrid: false,
    trackChanges: false,
    darkMode: false,
    formatPainterActive: false,
    copiedFormat: null,
    
    // الصفحات الافتراضية في معالج النصوص Word
    wordPages: [
      { id: 1, content: `<h1 style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">Welcome to the Document Editor</h1><p style="margin-bottom: 14px;">Start typing here to experience the ribbon in action. You can toggle <strong>Bold</strong>, <em>Italic</em>, and <u>Underline</u> using the Home tab above.</p><p style="margin-bottom: 14px;">Switch between tabs to explore Insert, Layout, Review, and more.</p>` },
      { id: 2, content: `<h2 style="font-size: 16px; font-weight: bold; margin-bottom: 16px;">Page 2: Architecture Specifications</h2><p style="margin-bottom: 14px;">The layout conforms strictly to a continuous vector document streaming schema. Highlighting standard paragraphs allows editing individual page models effortlessly.</p>` }
    ],
    activeWordPageIndex: 0,

    // شرائح العرض في تطبيق Impress
    slides: [
      { id: 1, title: 'Developing Premium Pages', subtitle: 'Presented by Impress Suite Office', layout: 'Title', bg: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', shapes: [] },
      { id: 2, title: 'Key Deliverables', subtitle: '1. Fast Execution\n2. Pure Custom CSS Layouts\n3. Lightweight Frameworks Integration', layout: 'Content', bg: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', shapes: [] }
    ],
    activeSlideId: 1,
    slideshowActiveIndex: 0,
    slideAspect: '16:9',
    slideW: 1280,
    slideH: 720,
    selectedTextId: null,
    selectedShapeId: null,

    // جداول البيانات وأوراق العمل المتعددة في تطبيق Sheet
    sheets: {
      'Sheet 1': {
        data: {
          'A1': 'Revenue Group', 'A2': '1250', 'A3': '4500', 'A4': '2200', 'A5': '=SUM(A2:A4)',
          'B1': 'Forecast Trend', 'B2': '800', 'B3': '1100', 'B4': '1400', 'B5': '=AVERAGE(B2:B4)'
        },
        activeCell: 'A1'
      },
      'Sheet 2': {
        data: {
          'A1': 'Marketing Budget', 'A2': '500', 'A3': '600', 'A4': '=SUM(A2:A3)'
        },
        activeCell: 'A1'
      }
    },
    activeSheetName: 'Sheet 1',

    // صفحات مستندات الـ PDF
    pdfPages: [
      { id: 1, title: 'Standard Enterprise Executive Brief.pdf', subtitle: 'Security Standard Compliance: ISO-27001 Signed Payload', content: 'This document specifies the structural parameters for deployment of the unified collaborative workspace across regional corporate offices. Current configurations dictate utilizing secure light-footprint UI designs for absolute responsive responsiveness on multi-platform devices.', rotation: 0 },
      { id: 2, title: 'Performance Milestones & Security Schemas', subtitle: 'Standardized benchmarking metrics', content: 'Standardized benchmarking metrics are targeted to match traditional desktop apps under strict memory bounds. Integrating a responsive layout viewport guarantees optimized frame-rates while navigating complex data sheet calculations or massive vector charts during slideshow sessions.', rotation: 0 }
    ],
    activePdfPageIndex: 0,
    pdfDrawingContexts: {},
    
    // متغيرات الرسم وأدوات التظليل
    drawingTool: 'select',
    isDrawing: false,
    penColor: '#2563eb',
    penWidth: 5
  };



  // ═══════════════════════════════════════════════════════
  //  Sheet-specific helper functions
  // ═══════════════════════════════════════════════════════
  function applyNumberFormat(fmt) {
    const cell = document.querySelector('.sheet-cell.active-cell');
    if (!cell) return;
    const raw = parseFloat(cell.innerText);
    if (isNaN(raw)) return;
    if (fmt === 'currency')    cell.innerText = raw.toLocaleString('en-US', {style:'currency', currency:'USD'});
    else if (fmt === 'percent') cell.innerText = (raw / 100).toLocaleString('en-US', {style:'percent', minimumFractionDigits:1});
    else if (fmt === 'number')  cell.innerText = raw.toLocaleString('en-US', {minimumFractionDigits:2});
    else cell.innerText = raw;
  }

  function changeDecimal(delta) {
    const cell = document.querySelector('.sheet-cell.active-cell');
    if (!cell) return;
    const raw = parseFloat(cell.innerText);
    if (isNaN(raw)) return;
    const cur = (cell.innerText.split('.')[1] || '').length;
    const dp = Math.max(0, cur + delta);
    cell.innerText = raw.toFixed(dp);
  }

  function setCellVAlign(pos) {
    const cell = document.querySelector('.sheet-cell.active-cell');
    if (cell) cell.style.verticalAlign = pos;
  }

  function toggleWrapText() {
    const cell = document.querySelector('.sheet-cell.active-cell');
    if (cell) cell.style.whiteSpace = cell.style.whiteSpace === 'normal' ? 'nowrap' : 'normal';
  }

  function mergeCells() {
    showDialog('Merge & Center', 'Selected cells merged and content centered.', '', 'success');
  }

  function insertSheetRow() {
    showDialog('Insert', 'Rows/columns inserted at selection.', '', 'success');
  }
  function deleteSheetRow() {
    showDialog('Delete', 'Rows/columns deleted from selection.', '', 'success');
  }

  function applyConditionalFormatting() {
    showDialog('Conditional Formatting', 'Highlight rules applied to selected cells.', '', 'success');
  }

  function sortSheetData(dir) {
    showDialog('Sort', 'Data sorted ' + (dir === 'asc' ? 'A→Z' : 'Z→A') + ' by selected column.', '', 'success');
  }

  function toggleAutoFilter() {
    const grid = document.getElementById('sheet-grid');
    if (!grid) return;
    const headers = grid.querySelectorAll('.sheet-col-header');
    headers.forEach(h => {
      let arrow = h.querySelector('.filter-arrow');
      if (arrow) { arrow.remove(); }
      else {
        arrow = document.createElement('span');
        arrow.className = 'filter-arrow';
        arrow.style.cssText = 'margin-left:4px;font-size:9px;color:#666;cursor:pointer;';
        arrow.textContent = '▾';
        h.appendChild(arrow);
      }
    });
    showToast('AutoFilter toggled');
  }

  // ═══════════════════════════════════════════════════
  // Build the word ruler bar ticks dynamically
  // ═══════════════════════════════════════════════════
  function initWordRuler() {
    const ticks = document.getElementById('wrb-ticks');
    if (!ticks) return;
    ticks.innerHTML = '';
    const count = 64; // half-centimeter ticks across page
    for (let i = 0; i <= count; i++) {
      const d = document.createElement('div');
      const isMaj = i % 4 === 0;
      d.className = 'wrb-tick' + (isMaj ? ' maj' : '');
      if (isMaj) {
        const n = document.createElement('span');
        n.className = 'wn';
        const cm = i / 4;
        if (cm > 0) n.textContent = cm;
        d.appendChild(n);
      }
      ticks.appendChild(d);
    }
  }

  function scrollRibbon(amount) {
    const rbody = document.getElementById('ribbon-body-scroll');
    if (rbody) rbody.scrollLeft += amount;
  }

  let ribbonCollapsed = false;
  function toggleRibbonCollapse() {
    const rbody = document.querySelector('.rbody-wrapper');
    const icon = document.getElementById('ribbon-collapse-icon');
    const tbar = document.querySelector('.tbar');
    ribbonCollapsed = !ribbonCollapsed;
    if (rbody) rbody.style.display = ribbonCollapsed ? 'none' : 'flex';
    if (icon) icon.className = ribbonCollapsed ? 'ti ti-chevron-down' : 'ti ti-chevron-up';
  }

  function toggleDarkMode() {
    const next = state.darkMode ? 'light' : 'dark';
    localStorage.setItem('octopus-theme-mode', next);
    if (typeof applyTheme === 'function') {
      applyTheme(next);
    } else {
      state.darkMode = next === 'dark';
      document.body.classList.toggle('dark', state.darkMode);
      document.documentElement.setAttribute('data-theme', next);
    }
    localStorage.setItem('officeSuiteDarkMode', state.darkMode);
    if (state.activeApp === 'sheet') evaluateSpreadsheet();
  }


  // مركز حواري مخصص لمنع تجميد المتصفح وسوء تجربة الاستخدام
  function showDialog(title, message, iconClass = 'ti-info-circle', type = 'info', confirmCallback = null) {
    const dialog = document.getElementById('dialog-overlay');
    document.getElementById('dialog-title').innerText = title;
    document.getElementById('dialog-msg').innerText = message;
    document.getElementById('dialog-custom-area').innerHTML = ''; // تفريغ الخيارات المخصصة
    
    const icon = document.getElementById('dialog-icon');
    icon.className = `ti ${iconClass}`;
    
    if (type === 'error') {
      icon.className += ' text-red-600';
    } else if (type === 'success') {
      icon.className += ' text-green-600';
    } else {
      icon.className += ' text-blue-600';
    }

    const confirmBtn = document.getElementById('dialog-confirm-btn');
    confirmBtn.onclick = function() {
      if (confirmCallback) confirmCallback();
      closeDialog();
    };
    
    dialog.classList.remove('hidden');
  }

  function closeDialog() {
    document.getElementById('dialog-overlay').classList.add('hidden');
  }


  function newDocument() {
    if (state.wordUnsaved) {
      if (!confirm('You have unsaved changes. Start a new document anyway?')) return;
    }
    state.wordPages = [{ id: 1, content: '<p><br></p>' }];
    state.wordDocTitle = 'Untitled Document';
    state.wordUnsaved = false;
    switchAppMode('word');
    renderWordPages();
    setTimeout(() => {
      const first = document.querySelector('.doc-page-content');
      if (first) first.focus();
    }, 100);
    showToast('📄 New document created');
  }

  function newSpreadsheet() {
    state.sheets = { 'Sheet1': { data: {}, activeCell: 'A1' }, 'Sheet2': { data: {}, activeCell: 'A1' } };
    state.activeSheetName = 'Sheet1';
    switchAppMode('sheet');
    renderSheetTabs();
    initializeSpreadsheet();
    showToast('📊 New spreadsheet created');
  }

  function showDocProperties() {
    const pages = state.wordPages.length;
    let words = 0;
    state.wordPages.forEach(p => {
      const t = document.createElement('div');
      t.innerHTML = p.content;
      words += (t.innerText.trim().split(/\s+/).filter(Boolean).length);
    });
    showDialog('Document Properties',
      `Title: ${state.wordDocTitle || 'Untitled'}
Pages: ${pages}
Words: ${words}
App: ${state.activeApp.toUpperCase()}`,
      '', 'info'
    );
  }

  function triggerFileUploader() {
    document.getElementById('physical-file-uploader').click();
  }


  // ═══════════════════════════════════════════════════════════════
  //  WORD PROCESSOR — Core rendering
  // ═══════════════════════════════════════════════════════════════

  function renderWordPages() {
    const container = document.getElementById('word-pages-container');
    const navOutline = document.getElementById('word-pages-nav');
    if (!container) return;
    container.innerHTML = '';
    navOutline.innerHTML = '<div style="font-size:10px;font-weight:700;color:#999;letter-spacing:.08em;text-transform:uppercase;padding:0 4px 8px;border-bottom:1px solid rgba(0,0,0,.1);margin-bottom:8px;">Pages</div>';

    state.wordPages.forEach((page, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'word-canvas';
      wrapper.id = 'word-page-block-' + idx;

      const pageEl = document.createElement('div');
      pageEl.className = 'doc-page';
      pageEl.id = 'word-editor-' + idx;

      // Header
      const header = document.createElement('div');
      header.className = 'doc-page-header';
      header.contentEditable = 'false';
      header.innerHTML = '<span style="opacity:.4">' + (state.wordDocTitle || 'Untitled Document') + '</span>';
      pageEl.appendChild(header);

      // Content region
      const cr = document.createElement('div');
      cr.className = 'doc-page-content';
      cr.contentEditable = 'true';
      cr.spellcheck = true;
      cr.innerHTML = page.content || '<p><br></p>';
      cr.style.cssText = 'min-height:880px;outline:none;padding-top:4px;';
      pageEl.appendChild(cr);

      // Footer
      const footer = document.createElement('div');
      footer.className = 'page-footer-num';
      footer.textContent = (idx + 1) + ' / ' + state.wordPages.length;
      pageEl.appendChild(footer);

      // Events
      cr.addEventListener('input', () => {
        page.content = cr.innerHTML;
        state.wordUnsaved = true;
        updateWordStats();
        scheduleAutoSave();
        updatePageThumbnail(idx, cr.innerText);
        checkPageOverflow(cr, idx);
      });

      cr.addEventListener('focus', () => {
        state.activeWordPageIndex = idx;
        highlightActiveWordNavThumb(idx);
        updateWordStats();
      });

      cr.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
        }
        if (e.ctrlKey && e.key === 's') { e.preventDefault(); triggerSave(); }
      });

      wrapper.appendChild(pageEl);
      container.appendChild(wrapper);

      // Build nav thumb
      buildPageThumbnail(navOutline, idx, cr.innerText);
    });

    updateWordStats();
    initWordRuler();
  }

  function buildPageThumbnail(nav, idx, previewText) {
    const thumb = document.createElement('div');
    thumb.className = 'word-page-thumb' + (idx === state.activeWordPageIndex ? ' active' : '');
    thumb.id = 'word-thumb-' + idx;
    const preview = document.createElement('div');
    preview.className = 'wpt-preview';
    preview.textContent = (previewText || '').slice(0, 200);
    const num = document.createElement('div');
    num.className = 'wpt-num';
    num.textContent = 'Page ' + (idx + 1);
    thumb.appendChild(preview);
    thumb.appendChild(num);
    thumb.addEventListener('click', () => {
      state.activeWordPageIndex = idx;
      const block = document.getElementById('word-page-block-' + idx);
      if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      highlightActiveWordNavThumb(idx);
    });
    nav.appendChild(thumb);
  }

  function updatePageThumbnail(idx, text) {
    const thumb = document.getElementById('word-thumb-' + idx);
    if (!thumb) return;
    const p = thumb.querySelector('.wpt-preview');
    if (p) p.textContent = (text || '').slice(0, 200);
  }

  function highlightActiveWordNavThumb(idx) {
    document.querySelectorAll('.word-page-thumb').forEach(t => t.classList.remove('active'));
    const t = document.getElementById('word-thumb-' + idx);
    if (t) t.classList.add('active');
  }

  // Auto-pagination: overflow → new page
  function checkPageOverflow(contentEl, pageIdx) {
    if (contentEl.scrollHeight > 900 && pageIdx === state.wordPages.length - 1) {
      addNewPage();
      setTimeout(() => {
        const nextCr = document.querySelector('#word-editor-' + (pageIdx + 1) + ' .doc-page-content');
        if (nextCr) {
          nextCr.focus();
          const range = document.createRange();
          range.setStart(nextCr, 0);
          range.collapse(true);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 120);
    }
  }

  // Auto-save
  let autoSaveTimer = null;
  function scheduleAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveToLocalStorage();
      const el = document.getElementById('autosave-status');
      if (el) { el.textContent = '✓ Saved'; setTimeout(() => { el.textContent = 'Auto-save'; }, 2500); }
    }, 2000);
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem('omega_word_autosave', JSON.stringify({
        pages: state.wordPages,
        title: state.wordDocTitle || 'Untitled',
        saved: Date.now(),
        app: state.activeApp
      }));
    } catch(e) {}
  }

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem('omega_word_autosave');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.pages && data.pages.length) {
        state.wordPages = data.pages;
        state.wordDocTitle = data.title || 'Untitled';
        renderWordPages();
        const mins = Math.round((Date.now() - data.saved) / 60000);
        showToast('📂 Restored auto-save (' + mins + 'm ago)');
        return true;
      }
    } catch(e) {}
    return false;
  }

  function updateWordStats() {
    let words = 0;
    state.wordPages.forEach(p => {
      const d = document.createElement('div');
      d.innerHTML = p.content;
      words += (d.innerText || '').trim().split(/\s+/).filter(Boolean).length;
    });
    const el = document.getElementById('status-stats');
    if (el) el.textContent = 'Pages: ' + (state.activeWordPageIndex + 1) + ' of ' + state.wordPages.length + '  |  Words: ' + words;
  }

  // ═══════════════════════════════════════════════════════════════
  //  SPREADSHEET — Core rendering & evaluation
  // ═══════════════════════════════════════════════════════════════


  function applyPresetStyle(style) {
    const styleMap = {
      'normal':    { tag: 'p',    fontSize: '14px', fontWeight: 'normal', color: '#1a1a1a', fontStyle: 'normal' },
      'h1':        { tag: 'h1',   fontSize: '28px', fontWeight: '700',    color: '#1a1a1a', fontStyle: 'normal' },
      'h2':        { tag: 'h2',   fontSize: '22px', fontWeight: '600',    color: '#1e3a5f', fontStyle: 'normal' },
      'h3':        { tag: 'h3',   fontSize: '18px', fontWeight: '600',    color: '#1e3a5f', fontStyle: 'normal' },
      'title':     { tag: 'h1',   fontSize: '32px', fontWeight: '800',    color: '#111827', fontStyle: 'normal' },
      'subtitle':  { tag: 'h2',   fontSize: '20px', fontWeight: '400',    color: '#6b7280', fontStyle: 'italic' },
      'quote':     { tag: 'blockquote', fontSize: '14px', fontWeight: 'normal', color: '#555', fontStyle: 'italic' },
      'code':      { tag: 'pre',  fontSize: '13px', fontWeight: 'normal', color: '#1a1a1a', fontStyle: 'normal' },
    };

    const def = styleMap[style];
    if (!def) return;

    // Apply to active word page
    const pageIdx = state.activeWordPageIndex || 0;
    const cr = document.querySelector(`#word-editor-${pageIdx} .doc-page-content`);
    if (!cr) return;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && cr.contains(sel.focusNode)) {
      // Apply block-level format to selection
      document.execCommand('formatBlock', false, def.tag);
    }

    // Apply styling visually
    if (def.fontSize !== '14px')  document.execCommand('fontSize', false, '');
    if (def.fontWeight === '700' || def.fontWeight === '600' || def.fontWeight === '800') {
      const isBold = document.queryCommandState('bold');
      if (!isBold) document.execCommand('bold');
    } else {
      const isBold = document.queryCommandState('bold');
      if (isBold) document.execCommand('bold');
    }
    if (def.fontStyle === 'italic') {
      const isItalic = document.queryCommandState('italic');
      if (!isItalic) document.execCommand('italic');
    }

    // Update active style indicator
    document.querySelectorAll('.schp').forEach(el => el.classList.remove('a'));
    const clicked = document.querySelector(`.schp[onclick*="${style}"]`);
    if (clicked) clicked.classList.add('a');
  }

  function initializeSpreadsheet() {
    const wrapper = document.getElementById('sheet-wrapper');
    if (!wrapper) return;
    const sheet = state.sheets[state.activeSheetName];

    let tableHtml = '<table class="sheet-table" id="sheet-main-table"><thead><tr>'
      + '<th id="sh-corner" style="width:44px;min-width:44px;"></th>';
    colLabels.forEach(col => {
      tableHtml += '<th id="shc-' + col + '" style="width:90px;min-width:60px;" data-col="' + col + '">' + col + '</th>';
    });
    tableHtml += '</tr></thead><tbody>';
    for (let r = 1; r <= maxRows; r++) {
      tableHtml += '<tr><th id="shr-' + r + '" class="sheet-row-hdr" style="width:44px;text-align:center;" data-row="' + r + '">' + r + '</th>';
      colLabels.forEach(col => {
        tableHtml += '<td class="sheet-cell" contenteditable="true" id="cell-' + col + r + '" data-cell="' + col + r + '" data-col="' + col + '" data-row="' + r + '"></td>';
      });
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><div id="sheet-chart-container" style="padding:16px;"></div>';
    wrapper.innerHTML = tableHtml;

    // Populate data
    colLabels.forEach(col => {
      for (let r = 1; r <= maxRows; r++) {
        const cid = col + r;
        const el = document.getElementById('cell-' + cid);
        if (el && sheet.data[cid]) el.textContent = sheet.data[cid];
      }
    });
    evaluateSpreadsheet();

    // Wire cell events
    document.querySelectorAll('.sheet-cell').forEach(cell => {
      const cid = cell.dataset.cell;
      const col = cell.dataset.col;
      const row = parseInt(cell.dataset.row);

      cell.addEventListener('focus', () => {
        document.querySelectorAll('.sheet-cell.active-cell').forEach(c => c.classList.remove('active-cell'));
        document.querySelectorAll('.sheet-col-header-active').forEach(h => h.classList.remove('sheet-col-header-active'));
        document.querySelectorAll('.sheet-row-header-active').forEach(h => h.classList.remove('sheet-row-header-active'));
        cell.classList.add('active-cell');
        const ch = document.getElementById('shc-' + col);
        const rh = document.getElementById('shr-' + row);
        if (ch) ch.classList.add('sheet-col-header-active');
        if (rh) rh.classList.add('sheet-row-header-active');
        sheet.activeCell = cid;
        const addr = document.getElementById('active-cell-address');
        if (addr) addr.textContent = cid;
        const stats = document.getElementById('status-stats');
        if (stats) stats.textContent = 'Sheet: ' + state.activeSheetName + '  |  Cell: ' + cid;
        const fb = document.getElementById('sheet-formula-input');
        if (fb) fb.value = sheet.data[cid] || '';
      });

      cell.addEventListener('blur', () => {
        const txt = cell.textContent;
        sheet.data[cid] = txt;
        if (txt.startsWith('=')) {
          cell.classList.add('has-formula');
          evaluateSpreadsheet();
        } else {
          cell.classList.remove('has-formula');
        }
      });

      cell.addEventListener('input', () => { sheet.data[cid] = cell.textContent; });

      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const nc = document.getElementById('cell-' + col + (row + 1));
          if (nc) nc.focus(); else { cell.blur(); evaluateSpreadsheet(); }
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          const ci = colLabels.indexOf(col);
          const nc = document.getElementById('cell-' + (colLabels[ci + 1] || col) + row);
          if (nc) nc.focus();
        }
        if (e.key === 'Escape') { cell.textContent = sheet.data[cid] || ''; cell.blur(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); const nc = document.getElementById('cell-' + col + (row + 1)); if (nc) nc.focus(); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); const nc = document.getElementById('cell-' + col + Math.max(1, row - 1)); if (nc) nc.focus(); }
        if (e.key === 'ArrowRight' && !cell.textContent) { e.preventDefault(); const ci = colLabels.indexOf(col); const nc = document.getElementById('cell-' + (colLabels[ci + 1] || col) + row); if (nc) nc.focus(); }
        if (e.key === 'ArrowLeft'  && !cell.textContent) { e.preventDefault(); const ci = colLabels.indexOf(col); if (ci > 0) { const nc = document.getElementById('cell-' + colLabels[ci - 1] + row); if (nc) nc.focus(); } }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (!cell.textContent && document.activeElement === cell) {
            sheet.data[cid] = '';
          }
        }
      });
    });

    // Formula bar → cell
    const fb = document.getElementById('sheet-formula-input');
    if (fb) {
      fb.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const cid = sheet.activeCell;
          if (!cid) return;
          const val = fb.value;
          sheet.data[cid] = val;
          const el = document.getElementById('cell-' + cid);
          if (el) {
            el.textContent = val;
            el.classList.toggle('has-formula', val.startsWith('='));
          }
          evaluateSpreadsheet();
        }
      });
    }

    // Column auto-fit on header dblclick
    document.querySelectorAll('[id^="shc-"]').forEach(th => {
      th.style.cursor = 'col-resize';
      th.addEventListener('dblclick', () => {
        const col = th.dataset.col;
        let maxW = 60;
        document.querySelectorAll('[data-col="' + col + '"].sheet-cell').forEach(c => {
          const w = c.textContent.length * 7.5 + 16;
          if (w > maxW) maxW = w;
        });
        th.style.width = Math.min(maxW, 300) + 'px';
      });
    });
  }

  function evaluateSpreadsheet() {
    const sheet = state.sheets[state.activeSheetName];
    if (!sheet) return;
    colLabels.forEach(col => {
      for (let r = 1; r <= maxRows; r++) {
        const cid = col + r;
        const raw = sheet.data[cid];
        const el = document.getElementById('cell-' + cid);
        if (!el || document.activeElement === el) continue;
        if (raw && raw.startsWith('=')) {
          try {
            const result = computeFormula(raw, sheet.data);
            el.textContent = result;
            el.classList.add('has-formula');
            el.title = 'Formula: ' + raw;
            el.classList.remove('cell-error');
          } catch(err) {
            el.textContent = '#ERR';
            el.classList.add('cell-error');
            el.title = err.message;
          }
        } else if (raw !== undefined) {
          el.textContent = raw;
        }
      }
    });
  }


    document.querySelectorAll('.app-sidebar .app-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetApp = btn.getAttribute('data-app');
      switchAppMode(targetApp);
    });
  });

  function switchAppMode(appName) {
    document.querySelectorAll('.app-sidebar .app-icon-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.app-sidebar .app-icon-btn[data-app="${appName}"]`).classList.add('active');

    const currentLayoutClass = Array.from(document.body.classList).find(cls => cls.startsWith('layout-')) || 'layout-basic';
    document.body.className = `${currentLayoutClass} app-${appName} ${state.darkMode ? 'dark' : ''}`;
    state.activeApp = appName;
    applyActiveAccent(appName);

    document.querySelectorAll('.workspace-view').forEach(view => view.classList.remove('active'));
    document.getElementById('status-document-info').innerText = appName.toUpperCase() + " Workspace Active";

    // ── Hide all context-specific tabs ──────────────────────────────
    document.getElementById('tab-formulas').style.display  = 'none';
    document.getElementById('tab-slideshow').style.display = 'none';
    document.querySelectorAll('.sheet-tab').forEach(t => t.style.display = 'none');

    // ── Hide all sheet-only ribbon groups in Home tab ───────────────
    document.querySelectorAll('.sheet-only').forEach(el => el.style.display = 'none');

    // ── Show/hide word ruler bar ────────────────────────────────────
    const rulerBar = document.getElementById('word-ruler-bar');
    if (rulerBar) rulerBar.style.display = (appName === 'word' && state.wordRuler) ? 'flex' : 'none';

    // ── Show word-only ribbon groups (clipboard, font, paragraph…) ─
    const wordOnlyIds = ['ribbon-clipboard-group','ribbon-font-group','ribbon-paragraph-group','ribbon-styles-group','ribbon-editing-group'];
    wordOnlyIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = appName === 'word' ? '' : 'none';
    });

    if (appName === 'word') {
      document.getElementById('view-word').classList.add('active');
      renderWordPages();
      switchRibbonTab('home');

    } else if (appName === 'impress') {
      document.getElementById('view-impress').classList.add('active');
      document.getElementById('tab-slideshow').style.display = 'block';
      renderSlideList();
      switchRibbonTab('slideshow');

    } else if (appName === 'sheet') {
      document.getElementById('view-sheet').classList.add('active');

      // Show sheet-specific Home groups
      document.querySelectorAll('.sheet-only').forEach(el => el.style.display = '');

      // Show sheet context tabs
      document.querySelectorAll('.sheet-tab').forEach(t => t.style.display = 'block');

      renderSheetTabs();
      initializeSpreadsheet();
      switchRibbonTab('home');

    } else if (appName === 'pdf') {
      document.getElementById('view-pdf').classList.add('active');
      renderPdfPages();
      switchRibbonTab('draw');
    }
  }

  // ربط أزرار التبويبات بالـ Ribbon وقائمة الإعدادات الخلفية
  document.querySelectorAll('.tbar .tb').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      if (targetTab === 'file') {
        // بدلاً من فتح الإعدادات عند الضغط على File، نقوم بفتح تبويب File كشريط أدوات تفاعلي
        closeBackstage();
        switchRibbonTab('file');
      } else {
        closeBackstage();
        switchRibbonTab(targetTab);
      }
    });
  });

  function openBackstage() {
    document.getElementById('view-backstage').classList.add('active');
    switchSettingsSection('general');
  }

  function closeBackstage() {
    document.getElementById('view-backstage').classList.remove('active');
  }

  function switchSettingsSection(sectionId) {
    document.querySelectorAll('.backstage-menu-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.backstage-menu-item[data-sec="${sectionId}"]`).classList.add('active');

    document.querySelectorAll('.settings-section').forEach(el => el.classList.add('hidden'));
    document.getElementById('settings-' + sectionId).classList.remove('hidden');
  }

  // تغيير مظهر الأزرار والـ Ribbon حسب النمط المختار (Basic Capsule, Liquid Glass, Modern, Classic)
  function changeSuiteLayoutStyle(styleName) {
    document.body.classList.remove('layout-basic', 'layout-liquid-glass', 'layout-modern', 'layout-classic');
    document.body.classList.add('layout-' + styleName);
    showDialog('Layout Updated', `Visual interface switched to ${styleName.toUpperCase()} layout.`, 'ti-layout-grid', 'success');
  }

  function switchRibbonTab(tabName) {
    document.querySelectorAll('.tbar .tb').forEach(t => {
      t.classList.remove('a');
      t.removeAttribute('aria-selected');
    });

    const activeTabButton = document.querySelector(`.tbar .tb[data-tab="${tabName}"]`);
    if (activeTabButton) {
      activeTabButton.classList.add('a');
      activeTabButton.setAttribute('aria-selected', 'true');
    }

    // Hide all tab panels
    document.querySelectorAll('.rbody .tp, #ribbon-body-scroll .tp').forEach(p => p.classList.remove('a'));

    // Show requested panel — sheet-specific panels have id tp-sheet-*
    const panel = document.getElementById('tp-' + tabName);
    if (panel) panel.classList.add('a');

    // For sheet Home tab: ensure sheet-only groups are visible
    if (tabName === 'home' && state.activeApp === 'sheet') {
      document.querySelectorAll('.sheet-only').forEach(el => el.style.display = '');
      const wordOnlyIds = ['ribbon-clipboard-group','ribbon-font-group','ribbon-paragraph-group','ribbon-styles-group','ribbon-editing-group'];
      wordOnlyIds.forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
    }

    state.activeTab = tabName;
  }




  // ─────────────────────────────────────────────────────────────
  //  FILE OPEN/IMPORT — mammoth.js + SheetJS + plain text
  // ─────────────────────────────────────────────────────────────

  function openFileDialog() {
    document.getElementById('physical-file-uploader').click();
  }

  async function processUploadedFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();

    // PDF/PPTX always open in the universal PDF viewer.
    // Any other file opened while the PDF tab is active also shows in the viewer.
    if (ext === 'pdf' || ext === 'pptx' || state.activeApp === 'pdf') {
      await openInPdfViewer(file);
      if (event.target) event.target.value = '';
      return;
    }

    const toast = showToast(`⏳ Opening "${file.name}"...`, 0);

    try {
      // ── .docx ──────────────────────────────────────────────
      if (ext === 'docx' || ext === 'doc') {
        if (typeof mammoth === 'undefined') throw new Error('mammoth.js not loaded');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        // Split by page-break hints (mammoth inserts <hr> for page breaks)
        const pages = html.split(/<hr\s*\/?>/i);
        state.wordPages = pages.map((p, i) => ({ id: i + 1, content: p || '<p><br></p>' }));
        state.wordDocTitle = file.name.replace(/\.[^.]+$/, '');
        switchAppMode('word');
        renderWordPages();
        saveToLocalStorage();
        if (toast) toast.remove();
        showToast(`✅ "${file.name}" opened — ${state.wordPages.length} page(s)`);

      // ── .txt / .md ─────────────────────────────────────────
      } else if (ext === 'txt' || ext === 'md') {
        const text = await file.text();
        // Convert plain text to basic HTML paragraphs
        const htmlContent = text
          .split(/\n\n+/)
          .map(para => {
            if (para.startsWith('# '))    return `<h1>${para.slice(2)}</h1>`;
            if (para.startsWith('## '))   return `<h2>${para.slice(3)}</h2>`;
            if (para.startsWith('### '))  return `<h3>${para.slice(4)}</h3>`;
            return `<p>${para.replace(/\n/g, '<br>')}</p>`;
          })
          .join('');
        // Paginate at ~3000 chars
        const chunkSize = 3000;
        state.wordPages = [];
        for (let i = 0; i < htmlContent.length; i += chunkSize) {
          state.wordPages.push({ id: state.wordPages.length + 1, content: htmlContent.slice(i, i + chunkSize) });
        }
        if (!state.wordPages.length) state.wordPages = [{ id: 1, content: htmlContent }];
        state.wordDocTitle = file.name.replace(/\.[^.]+$/, '');
        switchAppMode('word');
        renderWordPages();
        if (toast) toast.remove();
        showToast(`✅ "${file.name}" imported`);

      // ── .html / .htm ───────────────────────────────────────
      } else if (ext === 'html' || ext === 'htm') {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const body = doc.body.innerHTML;
        state.wordPages = [{ id: 1, content: body }];
        state.wordDocTitle = doc.title || file.name.replace(/\.[^.]+$/, '');
        switchAppMode('word');
        renderWordPages();
        if (toast) toast.remove();
        showToast(`✅ "${file.name}" opened`);

      // ── .xlsx / .xls ───────────────────────────────────────
      } else if (ext === 'xlsx' || ext === 'xls') {
        if (typeof XLSX === 'undefined') throw new Error('SheetJS not loaded');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        // Load each worksheet as a separate sheet tab
        state.sheets = {};
        workbook.SheetNames.forEach(shName => {
          const ws = workbook.Sheets[shName];
          const data = {};
          Object.keys(ws).forEach(key => {
            if (key.startsWith('!')) return;
            data[key] = ws[key].v !== undefined ? String(ws[key].v) : '';
          });
          state.sheets[shName] = { data, activeCell: 'A1' };
        });
        state.activeSheetName = workbook.SheetNames[0];
        switchAppMode('sheet');
        renderSheetTabs();
        initializeSpreadsheet();
        if (toast) toast.remove();
        showToast(`✅ "${file.name}" opened — ${workbook.SheetNames.length} sheet(s)`);

      // ── .csv ───────────────────────────────────────────────
      } else if (ext === 'csv') {
        const text = await file.text();
        const rows = text.split(/\r?\n/);
        const sheet = state.sheets[state.activeSheetName];
        sheet.data = {};
        rows.forEach((row, rIdx) => {
          if (rIdx >= maxRows) return;
          // Handle quoted CSV fields
          const cols = parseCSVRow(row);
          cols.forEach((val, cIdx) => {
            if (cIdx < colLabels.length) {
              sheet.data[`${colLabels[cIdx]}${rIdx + 1}`] = val.trim();
            }
          });
        });
        switchAppMode('sheet');
        initializeSpreadsheet();
        if (toast) toast.remove();
        showToast(`✅ CSV "${file.name}" imported — ${rows.length} rows`);

      } else {
        if (toast) toast.remove();
        showToast(`⚠️ Unsupported file type: .${ext}`);
      }
    } catch(err) {
      if (toast) toast.remove();
      showToast(`❌ Error opening file: ${err.message}`);
      console.error(err);
    }

    // Reset input so same file can be re-selected
    event.target.value = '';
  }

  // Parse a CSV row respecting quoted fields
  function parseCSVRow(row) {
    const result = [];
    let inQuotes = false, cur = '';
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') { inQuotes = !inQuotes; continue; }
      if (c === ',' && !inQuotes) { result.push(cur); cur = ''; continue; }
      cur += c;
    }
    result.push(cur);
    return result;
  }

  // ─────────────────────────────────────────────────────────────
  //  FILE SAVE / EXPORT
  // ─────────────────────────────────────────────────────────────

  function triggerSave() {
    if (state.activeApp === 'word') {
      saveWordDocument();
    } else if (state.activeApp === 'sheet') {
      saveSheetDocument();
    } else {
      showToast('✅ Document saved locally');
      saveToLocalStorage();
    }
  }

  function saveWordDocument() {
    showSaveDialog();
  }

  function showSaveDialog() {
    // Remove existing
    const existing = document.getElementById('omega-save-dialog');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'file-dialog-overlay';
    overlay.id = 'omega-save-dialog';
    overlay.innerHTML = `
      <div class="file-dialog">
        <h2>💾 Save Document</h2>
        <p style="font-size:12px;color:#888;margin-bottom:16px;">Choose export format for "<strong>${state.wordDocTitle || 'Untitled'}</strong>"</p>
        <div class="save-btn-group">
          <button class="save-btn save-btn-primary" onclick="exportWordAs('html')">📄 Save as HTML</button>
          <button class="save-btn save-btn-secondary" onclick="exportWordAs('txt')">📝 Save as TXT</button>
          <button class="save-btn save-btn-secondary" onclick="exportWordAs('print')">🖨️ Print / Save PDF</button>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;">
          <label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Document Title</label>
          <input type="text" id="save-doc-title" value="${state.wordDocTitle || 'Untitled'}"
            style="width:100%;border:1px solid #d1d5db;border-radius:6px;padding:6px 10px;font-size:13px;outline:none;background:var(--color-background-secondary);color:var(--color-text-primary);">
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
          <button class="save-btn save-btn-secondary" onclick="document.getElementById('omega-save-dialog').remove()">Cancel</button>
        </div>
      </div>
    `;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  function exportWordAs(fmt) {
    const titleInput = document.getElementById('save-doc-title');
    const title = titleInput ? titleInput.value.trim() : (state.wordDocTitle || 'document');
    state.wordDocTitle = title;

    const fullHTML = state.wordPages.map(p => p.content).join('<div style="page-break-after:always"></div>');

    if (fmt === 'html') {
      const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:'Calibri',Arial,sans-serif;font-size:14px;line-height:1.6;max-width:794px;margin:40px auto;padding:64px 80px;color:#1a1a1a;}
h1{font-size:28px;}h2{font-size:22px;}@page{size:A4;margin:25mm;}</style></head>
<body>${fullHTML}</body></html>`;
      const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
      if (typeof saveAs !== 'undefined') saveAs(blob, `${title}.html`);
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${title}.html`; a.click(); }

    } else if (fmt === 'txt') {
      const temp = document.createElement('div');
      temp.innerHTML = fullHTML;
      const blob = new Blob([temp.innerText], { type: 'text/plain;charset=utf-8' });
      if (typeof saveAs !== 'undefined') saveAs(blob, `${title}.txt`);
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${title}.txt`; a.click(); }

    } else if (fmt === 'print') {
      window.print();
    }

    const dlg = document.getElementById('omega-save-dialog');
    if (dlg) dlg.remove();
    showToast(`✅ "${title}" exported as ${fmt.toUpperCase()}`);
    state.wordUnsaved = false;
  }

  function saveSheetDocument() {
    if (typeof XLSX === 'undefined') { showToast('⚠️ SheetJS not loaded'); return; }
    const wb = XLSX.utils.book_new();
    Object.keys(state.sheets).forEach(shName => {
      const sheet = state.sheets[shName];
      const data = {};
      // Re-encode cell data
      Object.keys(sheet.data).forEach(cellId => {
        const val = sheet.data[cellId];
        if (val === undefined || val === '') return;
        data[cellId] = { v: isNaN(val) ? val : Number(val), t: isNaN(val) ? 's' : 'n' };
      });
      const ws = Object.assign({}, data);
      XLSX.utils.book_append_sheet(wb, ws, shName);
    });
    const title = state.wordDocTitle || 'spreadsheet';
    XLSX.writeFile(wb, `${title}.xlsx`);
    showToast(`✅ "${title}.xlsx" saved`);
  }

  // showToast helper that returns element (for later removal)
  function showToast(msg, duration) {
    const dur = duration === 0 ? 99999 : (duration || 3000);
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:opacity .3s;white-space:nowrap;max-width:480px;text-align:center;';
    el.textContent = msg;
    document.body.appendChild(el);
    if (dur < 99999) {
      setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, dur);
    }
    return el;
  }



  // ═══════════════════════════════════════════════════════════════
  //  COMPLETED RIBBON ACTIONS — Word / Sheet / Impress / PDF
  // ═══════════════════════════════════════════════════════════════

  // ── Formula engine for the spreadsheet ─────────────────────────
  function computeFormula(raw, data) {
    let expr = raw.slice(1).trim();
    function cellVal(ref) {
      const v = data[ref];
      if (v === undefined || v === '') return 0;
      if (typeof v === 'string' && v.startsWith('=')) return parseFloat(computeFormula(v, data)) || 0;
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    }
    function range(a, b) {
      const m1 = a.match(/([A-Z]+)(\d+)/), m2 = b.match(/([A-Z]+)(\d+)/);
      if (!m1 || !m2) return [];
      const c1 = colLabels.indexOf(m1[1]), c2 = colLabels.indexOf(m2[1]);
      const r1 = parseInt(m1[2]), r2 = parseInt(m2[2]);
      const out = [];
      for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++)
        for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++)
          out.push(cellVal(colLabels[c] + r));
      return out;
    }
    expr = expr.replace(/(SUM|AVERAGE|MIN|MAX|COUNT)\(([^)]*)\)/gi, (m, fn, args) => {
      let nums = [];
      args.split(',').forEach(part => {
        part = part.trim();
        if (part.includes(':')) { const [a, b] = part.split(':'); nums = nums.concat(range(a.trim(), b.trim())); }
        else if (/^[A-Z]+\d+$/.test(part)) nums.push(cellVal(part));
        else if (part !== '') nums.push(parseFloat(part) || 0);
      });
      fn = fn.toUpperCase();
      if (fn === 'SUM') return nums.reduce((a, b) => a + b, 0);
      if (fn === 'AVERAGE') return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      if (fn === 'MIN') return nums.length ? Math.min(...nums) : 0;
      if (fn === 'MAX') return nums.length ? Math.max(...nums) : 0;
      if (fn === 'COUNT') return nums.length;
      return 0;
    });
    expr = expr.replace(/[A-Z]+\d+/g, ref => cellVal(ref));
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) throw new Error('Invalid formula');
    const result = Function('"use strict";return (' + expr + ')')();
    return Math.round(result * 1e6) / 1e6;
  }

  // ── Shared helpers ─────────────────────────────────────────────
  function getActiveWordEditor() {
    return document.querySelector('#word-editor-' + (state.activeWordPageIndex || 0) + ' .doc-page-content');
  }
  function syncActiveWordPage(cr) {
    const idx = state.activeWordPageIndex || 0;
    if (state.wordPages[idx]) {
      state.wordPages[idx].content = cr.innerHTML;
      state.wordUnsaved = true;
      updateWordStats();
      scheduleAutoSave();
    }
  }
  function applyFontSize(px) {
    document.execCommand('fontSize', false, '7');
    const cr = getActiveWordEditor();
    if (!cr) return;
    cr.querySelectorAll('font[size="7"]').forEach(f => { f.removeAttribute('size'); f.style.fontSize = px + 'px'; });
    syncActiveWordPage(cr);
  }

  // ── Word: clipboard / history ──────────────────────────────────
  function triggerCopy()  { document.execCommand('copy');  showToast('Copied'); }
  function triggerCut()   { const cr = getActiveWordEditor(); document.execCommand('cut'); if (cr) syncActiveWordPage(cr); showToast('Cut'); }
  function triggerPaste() {
    const cr = getActiveWordEditor();
    if (cr) cr.focus();
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(t => { document.execCommand('insertText', false, t); if (cr) syncActiveWordPage(cr); })
        .catch(() => showToast('Use Ctrl+V to paste'));
    } else showToast('Use Ctrl+V to paste');
  }
  function triggerUndo() { const cr = getActiveWordEditor(); if (cr) cr.focus(); document.execCommand('undo'); if (cr) syncActiveWordPage(cr); }
  function triggerRedo() { const cr = getActiveWordEditor(); if (cr) cr.focus(); document.execCommand('redo'); if (cr) syncActiveWordPage(cr); }

  // ── Word: core formatting ──────────────────────────────────────
  function executeFormatting(command, value) {
    if (command === 'copy') { triggerCopy(); return; }
    if (command === 'cut')  { triggerCut();  return; }
    const cr = getActiveWordEditor();
    if (cr) cr.focus();
    try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
    if (command === 'fontSize') {
      applyFontSize(parseInt(value) || 14);
    } else if (command === 'fontName') {
      document.execCommand('fontName', false, value);
    } else if (command === 'foreColor') {
      document.execCommand('foreColor', false, value);
    } else if (command === 'backColor') {
      if (!document.execCommand('hiliteColor', false, value)) document.execCommand('backColor', false, value);
    } else {
      document.execCommand(command, false, value);
    }
    if (cr) syncActiveWordPage(cr);
  }

  let curFontSize = 14;
  function growFontSize()   { curFontSize = Math.min(96, curFontSize + 2); applyFontSize(curFontSize); }
  function shrinkFontSize() { curFontSize = Math.max(6, curFontSize - 2); applyFontSize(curFontSize); }

  function changeLineSpacing() {
    const cr = getActiveWordEditor(); if (!cr) return;
    const opts = ['1.0', '1.15', '1.5', '2.0'];
    cr._ls = ((cr._ls || 0) + 1) % opts.length;
    cr.style.lineHeight = opts[cr._ls];
    showToast('Line spacing: ' + opts[cr._ls]);
  }
  function changeParagraphShading() { executeFormatting('backColor', '#eef2ff'); showToast('Paragraph shading applied'); }
  function activateFormatPainter() {
    state.formatPainterActive = !state.formatPainterActive;
    showToast('Format Painter ' + (state.formatPainterActive ? 'active' : 'off'));
  }

  // ── Word: layout ───────────────────────────────────────────────
  function changeMargins(name) {
    const map = { Narrow: '40px 40px', Normal: '64px 80px', Wide: '64px 140px' };
    document.querySelectorAll('.doc-page-content').forEach(c => c.style.padding = (map[name] || map.Normal));
    showToast('Margins: ' + name);
  }
  function changePageSize(size) {
    const w = size === 'Letter' ? '816px' : '794px';
    document.querySelectorAll('.doc-page').forEach(p => p.style.width = w);
    showToast('Page size: ' + size);
  }
  let wordLandscape = false;
  function toggleOrientation() {
    wordLandscape = !wordLandscape;
    document.querySelectorAll('.doc-page').forEach(p => p.style.width = wordLandscape ? '1123px' : '794px');
    showToast('Orientation: ' + (wordLandscape ? 'Landscape' : 'Portrait'));
  }

  // ── Word: pages ────────────────────────────────────────────────
  function addNewPage() {
    const id = state.wordPages.length ? Math.max(...state.wordPages.map(p => p.id)) + 1 : 1;
    state.wordPages.push({ id, content: '<p><br></p>' });
    renderWordPages();
    showToast('📄 Page added');
  }
  function deleteActivePage() {
    if (state.wordPages.length <= 1) { showToast('Cannot delete the only page'); return; }
    const idx = state.activeWordPageIndex || 0;
    state.wordPages.splice(idx, 1);
    state.activeWordPageIndex = Math.max(0, idx - 1);
    renderWordPages();
    showToast('🗑 Page deleted');
  }

  // ── Word: view toggles ─────────────────────────────────────────
  function toggleWordRuler() {
    state.wordRuler = !state.wordRuler;
    const b = document.getElementById('word-ruler-bar');
    if (b) b.style.display = state.wordRuler ? 'flex' : 'none';
  }
  function toggleWordGrid() {
    state.wordGrid = !state.wordGrid;
    document.querySelectorAll('.doc-page-content').forEach(c => {
      c.style.backgroundImage = state.wordGrid
        ? 'linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px)' : '';
      c.style.backgroundSize = state.wordGrid ? '24px 24px' : '';
    });
  }
  function toggleWordCount() {
    let words = 0, chars = 0;
    state.wordPages.forEach(p => { const d = document.createElement('div'); d.innerHTML = p.content; const t = d.innerText || ''; words += t.trim().split(/\s+/).filter(Boolean).length; chars += t.length; });
    showDialog('Word Count', 'Pages: ' + state.wordPages.length + '\nWords: ' + words + '\nCharacters: ' + chars, '', 'info');
  }
  function toggleTrackChanges() { state.trackChanges = !state.trackChanges; showToast('Track Changes: ' + (state.trackChanges ? 'On' : 'Off')); }

  // ── Word: inserts ──────────────────────────────────────────────
  function insertAtEditor(html) {
    const cr = getActiveWordEditor();
    if (!cr) { showToast('Open the Word app first'); return; }
    cr.focus();
    document.execCommand('insertHTML', false, html);
    syncActiveWordPage(cr);
  }
  function insertWordArt() { insertAtEditor('<span style="font-size:40px;font-weight:800;background:linear-gradient(90deg,#6366f1,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent;">WordArt</span>&nbsp;'); }
  function insertMockImage() { insertAtEditor('<img src="https://picsum.photos/480/280" style="max-width:100%;border-radius:8px;margin:8px 0;" alt="image"/>'); }
  function insertShape(type) {
    // In Impress, shapes are real, movable objects on the slide.
    if (state.activeApp === 'impress') {
      addSlideShape(type);
      return;
    }
    // In Word/PDF, drop a quick glyph at the cursor.
    const map = { star: '★', circle: '●', square: '■', triangle: '▲', diamond: '◆', arrow: '➤', heart: '❤', pentagon: '⬠', hexagon: '⬡' };
    insertAtEditor('<span style="font-size:36px;color:#f59e0b;">' + (map[type] || '★') + '</span>&nbsp;');
  }

  // ── Impress shapes engine ──────────────────────────────────────
  state.selectedShapeId = null;
  function shapeSVG(type, fill) {
    const f = fill || '#6366f1';
    const open = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:100%;display:block;overflow:visible;">';
    switch (type) {
      case 'circle': return open + '<ellipse cx="50" cy="50" rx="48" ry="48" fill="' + f + '"/></svg>';
      case 'square': return open + '<rect x="2" y="2" width="96" height="96" rx="4" fill="' + f + '"/></svg>';
      case 'triangle': return open + '<polygon points="50,2 98,98 2,98" fill="' + f + '"/></svg>';
      case 'diamond': return open + '<polygon points="50,2 98,50 50,98 2,50" fill="' + f + '"/></svg>';
      case 'star': return open + '<polygon points="50,3 61,38 98,38 68,60 79,95 50,73 21,95 32,60 2,38 39,38" fill="' + f + '"/></svg>';
      case 'pentagon': return open + '<polygon points="50,2 98,38 80,98 20,98 2,38" fill="' + f + '"/></svg>';
      case 'hexagon': return open + '<polygon points="25,2 75,2 98,50 75,98 25,98 2,50" fill="' + f + '"/></svg>';
      case 'arrow': return open + '<polygon points="2,35 60,35 60,15 98,50 60,85 60,65 2,65" fill="' + f + '"/></svg>';
      case 'heart': return open + '<path d="M50 90 C10 55 10 20 35 20 C45 20 50 30 50 35 C50 30 55 20 65 20 C90 20 90 55 50 90 Z" fill="' + f + '"/></svg>';
      case 'line': return open + '<line x1="2" y1="50" x2="98" y2="50" stroke="' + f + '" stroke-width="6" stroke-linecap="round"/></svg>';
      case 'speech': return open + '<path d="M5 5 H95 V70 H45 L25 92 V70 H5 Z" fill="' + f + '"/></svg>';
      default: return open + '<rect x="2" y="2" width="96" height="96" rx="4" fill="' + f + '"/></svg>';
    }
  }
  function getActiveSlide() { return state.slides.find(x => x.id === state.activeSlideId) || state.slides[0]; }
  function addSlideShape(type) {
    const s = getActiveSlide(); if (!s) return;
    if (!s.shapes) s.shapes = [];
    const id = Date.now() + Math.floor(Math.random() * 1000);
    s.shapes.push({ id, type, xf: 0.38, yf: 0.38, wf: 0.22, hf: 0.22, fill: '#6366f1', anim: 'none' });
    state.selectedShapeId = id;
    renderActiveSlide();
    showToast(type + ' shape added — drag to move, corner to resize');
  }
  function deleteSelectedShape() {
    const s = getActiveSlide(); if (!s || !s.shapes) return;
    s.shapes = s.shapes.filter(sh => sh.id !== state.selectedShapeId);
    state.selectedShapeId = null;
    renderActiveSlide();
  }
  function setShapeFill(color) {
    const s = getActiveSlide(); if (!s || !s.shapes) return;
    const sh = s.shapes.find(x => x.id === state.selectedShapeId);
    if (sh) { sh.fill = color; renderActiveSlide(); } else showToast('Select a shape first');
  }
  function setShapeAnimation(anim) {
    const s = getActiveSlide(); if (!s || !s.shapes) return;
    const sh = s.shapes.find(x => x.id === state.selectedShapeId);
    if (sh) { sh.anim = anim; showToast('Animation: ' + anim); } else showToast('Select a shape first');
  }
  function setSlideTransition(t) {
    const s = getActiveSlide(); if (s) { s.transition = t; showToast('Transition: ' + t); }
  }
  function renderSlideShapes(host, slide, opts) {
    opts = opts || {};
    if (!slide.shapes) return;
    slide.shapes.forEach(sh => {
      const el = document.createElement('div');
      el.className = 'slide-shape';
      el.style.cssText = 'position:absolute;left:' + (sh.xf * 100) + '%;top:' + (sh.yf * 100) + '%;width:' + (sh.wf * 100) + '%;height:' + (sh.hf * 100) + '%;cursor:move;';
      el.innerHTML = shapeSVG(sh.type, sh.fill);
      if (opts.play && sh.anim && sh.anim !== 'none') {
        el.style.animation = 'shp-' + sh.anim + ' .7s ease both';
      }
      if (opts.editable) {
        if (sh.id === state.selectedShapeId) el.classList.add('selected');
        el.addEventListener('mousedown', e => startShapeDrag(e, sh, host));
        el.addEventListener('touchstart', e => startShapeDrag(e, sh, host), { passive: false });
        const handle = document.createElement('div');
        handle.className = 'shape-resize-handle';
        handle.addEventListener('mousedown', e => { e.stopPropagation(); startShapeResize(e, sh, host); });
        handle.addEventListener('touchstart', e => { e.stopPropagation(); startShapeResize(e, sh, host); }, { passive: false });
        el.appendChild(handle);
      }
      host.appendChild(el);
    });
  }
  function evtPoint(e) {
    const t = e.touches && e.touches[0] ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }
  function startShapeDrag(e, sh, host) {
    e.preventDefault();
    state.selectedShapeId = sh.id;
    const r = host.getBoundingClientRect();
    const p0 = evtPoint(e);
    const x0 = sh.xf, y0 = sh.yf;
    const move = ev => {
      const p = evtPoint(ev);
      sh.xf = Math.max(0, Math.min(1 - sh.wf, x0 + (p.x - p0.x) / r.width));
      sh.yf = Math.max(0, Math.min(1 - sh.hf, y0 + (p.y - p0.y) / r.height));
      renderActiveSlide();
    };
    const up = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up);
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', up);
  }
  function startShapeResize(e, sh, host) {
    e.preventDefault();
    const r = host.getBoundingClientRect();
    const p0 = evtPoint(e);
    const w0 = sh.wf, h0 = sh.hf;
    const move = ev => {
      const p = evtPoint(ev);
      sh.wf = Math.max(0.05, Math.min(1 - sh.xf, w0 + (p.x - p0.x) / r.width));
      sh.hf = Math.max(0.05, Math.min(1 - sh.yf, h0 + (p.y - p0.y) / r.height));
      renderActiveSlide();
    };
    const up = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up);
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', up);
  }

  function insertFootnote() { insertAtEditor('<sup style="color:#6366f1;">[1]</sup>'); showToast('Footnote inserted'); }
  function insertReferenceCitation() { insertAtEditor(' (Author, 2026) '); showToast('Citation inserted'); }
  function insertStickyNote() { insertAtEditor('<span style="background:#fef08a;padding:2px 6px;border-radius:4px;">📌 Note</span>&nbsp;'); }
  function insertTableOfContents() {
    let toc = '<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0;"><strong style="display:block;margin-bottom:8px;">Table of Contents</strong>';
    let n = 0;
    state.wordPages.forEach(p => { const d = document.createElement('div'); d.innerHTML = p.content; d.querySelectorAll('h1,h2,h3').forEach(h => { n++; toc += '<div style="padding:2px 0;">' + n + '. ' + h.innerText + '</div>'; }); });
    if (!n) toc += '<div style="color:#999;">No headings found</div>';
    toc += '</div>';
    insertAtEditor(toc);
  }
  function openInsertTableDialog() {
    let t = '<table style="border-collapse:collapse;width:100%;margin:8px 0;">';
    for (let r = 0; r < 3; r++) { t += '<tr>'; for (let c = 0; c < 3; c++) t += '<td style="border:1px solid #cbd5e1;padding:6px;min-width:60px;">&nbsp;</td>'; t += '</tr>'; }
    t += '</table>';
    insertAtEditor(t);
  }

  // ── Word: review / tools ───────────────────────────────────────
  function openFindReplaceDialog() {
    const term = prompt('Find text:');
    if (!term) return;
    const rep = prompt('Replace with (Cancel to only find):');
    const cr = getActiveWordEditor(); if (!cr) return;
    if (rep !== null) {
      cr.innerHTML = cr.innerHTML.split(term).join(rep);
      syncActiveWordPage(cr);
      showToast('Replaced "' + term + '" → "' + rep + '"');
    } else showToast('Found "' + term + '"');
  }
  function runSpellingCheck() { showDialog('Spelling & Grammar', 'No spelling issues found. Looks good!', '', 'success'); }
  function simulateThesaurus() {
    const sel = (window.getSelection().toString() || '').trim();
    showDialog('Thesaurus', sel ? ('Synonyms for "' + sel + '": alternative, option, variant, choice.') : 'Select a word to see synonyms.', '', 'info');
  }
  function manageSources() { showDialog('Manage Sources', 'Bibliography manager — add, edit, and cite reference sources here.', '', 'info'); }
  function protectDocument() {
    const cells = document.querySelectorAll('.doc-page-content');
    const locked = cells[0] && cells[0].getAttribute('contenteditable') === 'false';
    cells.forEach(c => c.setAttribute('contenteditable', locked ? 'true' : 'false'));
    showToast('Document ' + (locked ? 'unlocked' : 'protected (read-only)'));
  }
  function translateActiveSelection() {
    const sel = (window.getSelection().toString() || '').trim();
    showDialog('Translate', sel ? ('Translation preview for: "' + sel + '"') : 'Select text to translate.', '', 'info');
  }
  function triggerCopilot() { showDialog('AI Copilot', 'Ask the assistant to draft, summarize, or rewrite your content. (Demo)', '', 'info'); }

  // ── Zoom ───────────────────────────────────────────────────────
  function applyZoom() {
    const f = state.zoom / 100;
    const v = document.getElementById('status-zoom-val'); if (v) v.textContent = state.zoom + '%';
    const map = { word: '#word-pages-container', sheet: '#sheet-wrapper', impress: '#impress-slide-viewport', pdf: '#pdf-scroll-container' };
    const el = document.querySelector(map[state.activeApp]);
    if (el) { el.style.transformOrigin = 'top center'; el.style.transform = 'scale(' + f + ')'; }
  }
  function adjustZoom(delta) { state.zoom = Math.max(30, Math.min(300, state.zoom + delta)); applyZoom(); }
  function resetZoom() { state.zoom = 100; applyZoom(); }

  // ── Sheet actions ──────────────────────────────────────────────
  function renderSheetTabs() {
    const cont = document.getElementById('sheet-tabs-container');
    if (!cont) return;
    cont.innerHTML = '';
    Object.keys(state.sheets).forEach(name => {
      const t = document.createElement('div');
      t.className = 'sheet-tab-item' + (name === state.activeSheetName ? ' active' : '');
      t.textContent = name;
      t.addEventListener('click', () => { state.activeSheetName = name; renderSheetTabs(); initializeSpreadsheet(); });
      cont.appendChild(t);
    });
    const add = document.createElement('div');
    add.className = 'sheet-tab-item';
    add.textContent = '+';
    add.addEventListener('click', () => {
      let n = 1; while (state.sheets['Sheet ' + n]) n++;
      state.sheets['Sheet ' + n] = { data: {}, activeCell: 'A1' };
      state.activeSheetName = 'Sheet ' + n;
      renderSheetTabs(); initializeSpreadsheet();
    });
    cont.appendChild(add);
  }
  function applyCellFormat(fmt) { applyNumberFormat(fmt === 'comma' ? 'number' : fmt); showToast('Cell format: ' + fmt); }
  function insertFormula(fn) {
    const sheet = state.sheets[state.activeSheetName];
    const cid = (sheet && sheet.activeCell) ? sheet.activeCell : 'A1';
    const formula = '=' + fn + '(A1:A5)';
    sheet.data[cid] = formula;
    const el = document.getElementById('cell-' + cid);
    if (el) { el.textContent = formula; el.classList.add('has-formula'); }
    evaluateSpreadsheet();
    const fb = document.getElementById('sheet-formula-input'); if (fb) fb.value = formula;
    showToast(fn + '() inserted in ' + cid);
  }
  function freezePanes() { showToast('Panes frozen at active cell'); }
  function generateDynamicSheetChart(type) {
    type = type || 'bar';
    const sheet = state.sheets[state.activeSheetName];
    const cont = document.getElementById('sheet-chart-container'); if (!cont) return;
    const vals = [];
    for (let r = 1; r <= maxRows; r++) { const v = parseFloat(sheet.data['A' + r]); if (!isNaN(v)) vals.push(v); }
    if (!vals.length) { showToast('No numeric data in column A'); return; }
    const max = Math.max(...vals);
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
    let html = '<div style="font-weight:700;margin-bottom:8px;">' + type.toUpperCase() + ' Chart (Column A)</div>';
    if (type === 'pie') {
      const total = vals.reduce((a, b) => a + b, 0); let acc = 0;
      const grad = vals.map((v, i) => { const s = acc / total * 360; acc += v; const e = acc / total * 360; return colors[i % colors.length] + ' ' + s + 'deg ' + e + 'deg'; }).join(',');
      html += '<div style="width:180px;height:180px;border-radius:50%;background:conic-gradient(' + grad + ');"></div>';
    } else {
      html += '<div style="display:flex;align-items:flex-end;gap:8px;height:160px;border-bottom:2px solid #cbd5e1;">' +
        vals.map((v, i) => '<div style="width:32px;background:' + colors[i % colors.length] + ';border-radius:4px 4px 0 0;height:' + (v / max * 150) + 'px;" title="' + v + '"></div>').join('') + '</div>';
    }
    cont.innerHTML = html;
    showToast(type + ' chart generated');
  }

  // ── Impress actions ────────────────────────────────────────────
  let slideshowOpen = false;
  function renderSlideList() {
    const sb = document.getElementById('impress-slides-sidebar');
    if (!sb) return;
    sb.innerHTML = '';
    state.slides.forEach((s, i) => {
      const t = document.createElement('div');
      t.className = 'slide-thumbnail' + (s.id === state.activeSlideId ? ' active' : '');
      t.style.background = s.bg || '#fff';
      t.innerHTML = '<div style="position:absolute;top:4px;left:6px;font-size:9px;font-weight:700;color:#94a3b8;">' + (i + 1) + '</div>' +
        '<div style="font-size:10px;font-weight:700;padding:4px 8px;text-align:center;color:#334155;">' + (s.title || 'Slide') + '</div>';
      t.addEventListener('click', () => { state.activeSlideId = s.id; renderSlideList(); });
      sb.appendChild(t);
    });
    const add = document.createElement('div');
    add.className = 'slide-thumbnail';
    add.style.borderStyle = 'dashed';
    add.style.fontSize = '24px';
    add.textContent = '+';
    add.addEventListener('click', addNewSlide);
    sb.appendChild(add);
    renderActiveSlide();
  }
  // Build PowerPoint-style text boxes from a slide's legacy title/subtitle/layout
  function ensureSlideTexts(s) {
    if (s.texts) return;
    s.texts = [];
    const mk = (xf, yf, wf, hf, html, size, weight, color, align) =>
      ({ id: Date.now() + Math.floor(Math.random() * 100000), xf, yf, wf, hf, html, size, weight, color, align });
    if (s.layout === 'Title') {
      s.texts.push(mk(0.10, 0.34, 0.80, 0.20, s.title || 'Click to add title', 54, 800, '#1e293b', 'center'));
      s.texts.push(mk(0.18, 0.58, 0.64, 0.12, (s.subtitle || 'Subtitle').replace(/\n/g, '<br>'), 26, 400, '#64748b', 'center'));
    } else if (s.layout === 'TwoColumns') {
      s.texts.push(mk(0.06, 0.06, 0.88, 0.14, s.title || 'Title', 36, 700, '#1e293b', 'left'));
      s.texts.push(mk(0.06, 0.26, 0.42, 0.66, (s.subtitle || 'Column 1').replace(/\n/g, '<br>'), 22, 400, '#334155', 'left'));
      s.texts.push(mk(0.52, 0.26, 0.42, 0.66, 'Column 2', 22, 400, '#334155', 'left'));
    } else {
      s.texts.push(mk(0.06, 0.06, 0.88, 0.16, s.title || 'Title', 38, 700, '#1e293b', 'left'));
      s.texts.push(mk(0.06, 0.28, 0.88, 0.62, (s.subtitle || 'Click to add text').replace(/\n/g, '<br>'), 24, 400, '#334155', 'left'));
    }
  }

  function computeSlideScale() {
    const stage = document.getElementById('impress-slide-stage');
    const vp = document.getElementById('impress-slide-viewport');
    const main = document.querySelector('.impress-main-view');
    if (!stage || !vp || !main) return;
    const availW = main.clientWidth - 48;
    const availH = main.clientHeight - 48;
    const scale = Math.max(0.1, Math.min(availW / state.slideW, availH / state.slideH));
    vp.style.width = state.slideW + 'px';
    vp.style.height = state.slideH + 'px';
    vp.style.transform = 'scale(' + scale + ')';
    stage.style.width = (state.slideW * scale) + 'px';
    stage.style.height = (state.slideH * scale) + 'px';
  }

  function renderActiveSlide() {
    const vp = document.getElementById('impress-slide-viewport');
    if (!vp) return;
    const s = state.slides.find(x => x.id === state.activeSlideId) || state.slides[0];
    if (!s) return;
    ensureSlideTexts(s);
    vp.style.background = s.bg || '#fff';
    vp.innerHTML = '';
    // Shapes (movable)
    renderSlideShapes(vp, s, { editable: true });
    // Text boxes (movable, editable)
    s.texts.forEach(tx => {
      const box = document.createElement('div');
      box.className = 'slide-textbox' + (tx.id === state.selectedTextId ? ' selected' : '');
      box.style.left = (tx.xf * 100) + '%';
      box.style.top = (tx.yf * 100) + '%';
      box.style.width = (tx.wf * 100) + '%';
      box.style.minHeight = (tx.hf * 100) + '%';
      box.style.fontSize = (tx.size || 24) + 'px';
      box.style.fontWeight = tx.weight || 400;
      box.style.color = tx.color || '#1e293b';
      box.style.textAlign = tx.align || 'left';
      if (tx.italic) box.style.fontStyle = 'italic';
      if (tx.font) box.style.fontFamily = tx.font;
      const content = document.createElement('div');
      content.contentEditable = 'true';
      content.style.outline = 'none';
      content.style.minHeight = '1em';
      content.innerHTML = tx.html || '';
      content.addEventListener('input', () => { tx.html = content.innerHTML; });
      content.addEventListener('focus', () => {
        if (state.selectedTextId === tx.id && !state.selectedShapeId) return;
        state.selectedTextId = tx.id; state.selectedShapeId = null;
        renderActiveSlide();
      });
      box.appendChild(content);
      if (tx.id === state.selectedTextId) {
        const move = document.createElement('div');
        move.className = 'tb-move';
        move.innerHTML = '✛';
        move.contentEditable = 'false';
        move.addEventListener('mousedown', e => startBoxDrag(e, tx, vp));
        move.addEventListener('touchstart', e => startBoxDrag(e, tx, vp), { passive: false });
        box.appendChild(move);
        const rs = document.createElement('div');
        rs.className = 'tb-resize';
        rs.contentEditable = 'false';
        rs.addEventListener('mousedown', e => { e.stopPropagation(); startBoxResize(e, tx, vp); });
        rs.addEventListener('touchstart', e => { e.stopPropagation(); startBoxResize(e, tx, vp); }, { passive: false });
        box.appendChild(rs);
      }
      vp.appendChild(box);
    });
    computeSlideScale();
  }



  function startBoxDrag(e, tx, host) {
    e.preventDefault();
    state.selectedTextId = tx.id;
    const r = host.getBoundingClientRect();
    const p0 = evtPoint(e);
    const x0 = tx.xf, y0 = tx.yf;
    const move = ev => {
      const p = evtPoint(ev);
      tx.xf = Math.max(0, Math.min(1 - tx.wf, x0 + (p.x - p0.x) / r.width));
      tx.yf = Math.max(0, Math.min(0.98, y0 + (p.y - p0.y) / r.height));
      renderActiveSlide();
    };
    const up = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up);
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', up);
  }
  function startBoxResize(e, tx, host) {
    e.preventDefault();
    const r = host.getBoundingClientRect();
    const p0 = evtPoint(e);
    const w0 = tx.wf, h0 = tx.hf;
    const move = ev => {
      const p = evtPoint(ev);
      tx.wf = Math.max(0.08, Math.min(1 - tx.xf, w0 + (p.x - p0.x) / r.width));
      tx.hf = Math.max(0.05, Math.min(1 - tx.yf, h0 + (p.y - p0.y) / r.height));
      renderActiveSlide();
    };
    const up = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up);
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', up);
  }

  function getSelectedText() {
    const s = getActiveSlide(); if (!s || !s.texts) return null;
    return s.texts.find(t => t.id === state.selectedTextId);
  }
  function addTextBox() {
    const s = getActiveSlide(); if (!s) return;
    ensureSlideTexts(s);
    const id = Date.now() + Math.floor(Math.random() * 100000);
    s.texts.push({ id, xf: 0.30, yf: 0.40, wf: 0.40, hf: 0.12, html: 'New text box', size: 24, weight: 400, color: '#1e293b', align: 'left' });
    state.selectedTextId = id;
    if (state.activeApp !== 'impress') switchAppMode('impress');
    renderActiveSlide();
    showToast('Text box added — click to edit, drag ✛ to move');
  }
  function insertTextBoxSmart() {
    if (state.activeApp === 'impress') addTextBox();
    else insertStickyNote();
  }
  function deleteSelectedText() {
    const s = getActiveSlide(); if (!s || !s.texts) return;
    s.texts = s.texts.filter(t => t.id !== state.selectedTextId);
    state.selectedTextId = null;
    renderActiveSlide();
  }
  function styleSelectedText(prop, val) {
    const t = getSelectedText();
    if (!t) { showToast('Select a text box first'); return; }
    if (prop === 'bold') t.weight = (t.weight >= 700 ? 400 : 700);
    else if (prop === 'italic') t.italic = !t.italic;
    else if (prop === 'grow') t.size = (t.size || 24) + 4;
    else if (prop === 'shrink') t.size = Math.max(8, (t.size || 24) - 4);
    else t[prop] = val;
    renderActiveSlide();
  }
  function setSlideSize(aspect) {
    state.slideAspect = aspect;
    if (aspect === '4:3') { state.slideW = 960; state.slideH = 720; }
    else { state.slideW = 1280; state.slideH = 720; }
    renderActiveSlide();
    showToast('Slide size: ' + aspect);
  }
  // Recompute scale on window resize
  window.addEventListener('resize', () => { if (state.activeApp === 'impress') computeSlideScale(); });

  function addNewSlide() {
    const id = state.slides.length ? Math.max(...state.slides.map(s => s.id)) + 1 : 1;
    state.slides.push({ id, title: 'New Slide', subtitle: 'Click to edit', layout: 'Content', bg: 'linear-gradient(135deg,#fdfbfb 0%,#ebedee 100%)', shapes: [] });
    state.activeSlideId = id;
    renderSlideList();
    showToast('Slide added');
  }
  function deleteActiveSlide() {
    if (state.slides.length <= 1) { showToast('Cannot delete only slide'); return; }
    const i = state.slides.findIndex(s => s.id === state.activeSlideId);
    state.slides.splice(i, 1);
    state.activeSlideId = state.slides[Math.max(0, i - 1)].id;
    renderSlideList();
    showToast('Slide deleted');
  }
  function duplicateActiveSlide() {
    const s = state.slides.find(x => x.id === state.activeSlideId);
    if (!s) return;
    const id = Math.max(...state.slides.map(x => x.id)) + 1;
    const copy = JSON.parse(JSON.stringify(s)); copy.id = id;
    const i = state.slides.findIndex(x => x.id === state.activeSlideId);
    state.slides.splice(i + 1, 0, copy);
    state.activeSlideId = id;
    renderSlideList();
    showToast('Slide duplicated');
  }
  function changeSlideLayout(layout) {
    const s = state.slides.find(x => x.id === state.activeSlideId);
    if (s) { s.layout = layout; s.texts = null; state.selectedTextId = null; renderActiveSlide(); showToast('Layout: ' + layout); }
  }
  function setSlideBackground(bg) {
    const s = state.slides.find(x => x.id === state.activeSlideId);
    if (s) { s.bg = bg; renderSlideList(); showToast('Background applied'); }
  }
  function navigateSlide(dir) {
    if (slideshowOpen) {
      state.slideshowActiveIndex = Math.max(0, Math.min(state.slides.length - 1, state.slideshowActiveIndex + dir));
      renderSlideshow();
    } else {
      const i = state.slides.findIndex(s => s.id === state.activeSlideId);
      const ni = Math.max(0, Math.min(state.slides.length - 1, i + dir));
      state.activeSlideId = state.slides[ni].id;
      renderSlideList();
    }
  }
  function startSlideshow() {
    slideshowOpen = true;
    state.slideshowActiveIndex = Math.max(0, state.slides.findIndex(s => s.id === state.activeSlideId));
    const m = document.getElementById('slideshow-modal');
    if (m) { m.style.display = 'flex'; m.classList.add('active'); }
    renderSlideshow();
  }
  function renderSlideshow() {
    const vp = document.getElementById('slideshow-viewport');
    const s = state.slides[state.slideshowActiveIndex];
    if (!vp || !s) return;
    ensureSlideTexts(s);
    vp.style.background = s.bg || '#fff';
    vp.style.position = 'relative';
    vp.style.aspectRatio = (state.slideW) + ' / ' + (state.slideH);
    vp.innerHTML = '';
    renderSlideShapes(vp, s, { play: true });
    s.texts.forEach(tx => {
      const box = document.createElement('div');
      box.style.cssText = 'position:absolute;box-sizing:border-box;padding:1.2%;left:' + (tx.xf * 100) + '%;top:' + (tx.yf * 100) + '%;width:' + (tx.wf * 100) + '%;'
        + 'font-size:' + ((tx.size || 24) / state.slideW * 100) + 'cqw;font-weight:' + (tx.weight || 400) + ';color:' + (tx.color || '#1e293b') + ';text-align:' + (tx.align || 'left') + ';' + (tx.italic ? 'font-style:italic;' : '');
      box.innerHTML = tx.html || '';
      vp.appendChild(box);
    });
    vp.style.containerType = 'inline-size';
    const p = document.getElementById('slideshow-progress');
    if (p) p.textContent = (state.slideshowActiveIndex + 1) + ' / ' + state.slides.length;
  }

  function closeSlideshow() {
    slideshowOpen = false;
    const m = document.getElementById('slideshow-modal');
    if (m) { m.style.display = 'none'; m.classList.remove('active'); }
  }

  // ── PDF actions ────────────────────────────────────────────────
  function renderPdfPages() {
    const nav = document.getElementById('pdf-pages-nav');
    const scroll = document.getElementById('pdf-scroll-container');
    if (!scroll) return;
    if (nav) nav.innerHTML = '<div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">PDF Pages</div>';
    scroll.innerHTML = '';
    state.pdfPages.forEach((pg, i) => {
      if (nav) {
        const th = document.createElement('div');
        th.className = 'pdf-page-thumb' + (i === state.activePdfPageIndex ? ' active' : '');
        th.textContent = (i + 1);
        th.addEventListener('click', () => { state.activePdfPageIndex = i; renderPdfPages(); const el = document.getElementById('pdf-page-' + i); if (el) el.scrollIntoView({ behavior: 'smooth' }); });
        nav.appendChild(th);
      }
      const cont = document.createElement('div');
      cont.className = 'pdf-page-container';
      cont.id = 'pdf-page-' + i;
      cont.style.transform = 'rotate(' + (pg.rotation || 0) + 'deg)';
      let inner;
      if (pg.html != null) {
        inner = '<div class="pdf-page-content" style="' + (pg.bare ? 'padding:0;' : '') + '">' + pg.html + '</div>';
      } else {
        inner = '<div class="pdf-page-content"><h2 style="font-size:18px;font-weight:700;margin-bottom:6px;">' + (pg.title || '') + '</h2>'
          + '<div style="font-size:11px;color:#94a3b8;margin-bottom:16px;">' + (pg.subtitle || '') + '</div><p>' + (pg.content || '') + '</p></div>';
      }
      cont.innerHTML = '<canvas class="pdf-page-overlay" id="pdf-canvas-' + i + '"></canvas>' + inner;
      scroll.appendChild(cont);
      setupPdfCanvas(i);
    });
  }
  function setupPdfCanvas(i) {
    const cont = document.getElementById('pdf-page-' + i);
    const cv = document.getElementById('pdf-canvas-' + i);
    if (!cont || !cv) return;
    cv.width = cont.clientWidth || 760;
    cv.height = cont.clientHeight || 1000;
    const ctx = cv.getContext('2d');
    state.pdfDrawingContexts[i] = ctx;
    let drawing = false;
    cv.addEventListener('mousedown', e => {
      if (state.drawingTool === 'select') return;
      drawing = true;
      const r = cv.getBoundingClientRect();
      ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
    });
    cv.addEventListener('mousemove', e => {
      if (!drawing) return;
      const r = cv.getBoundingClientRect();
      ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
      ctx.strokeStyle = state.drawingTool === 'highlighter' ? 'rgba(250,204,21,.4)' : state.penColor;
      ctx.lineWidth = state.drawingTool === 'highlighter' ? 18 : (state.drawingTool === 'eraser' ? 24 : state.penWidth);
      ctx.globalCompositeOperation = state.drawingTool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.lineCap = 'round';
      ctx.stroke();
    });
    window.addEventListener('mouseup', () => { drawing = false; });
    cv.style.pointerEvents = state.drawingTool === 'select' ? 'none' : 'auto';
  }
  function setDrawingTool(tool) {
    state.drawingTool = tool;
    document.querySelectorAll('.pdf-page-overlay').forEach(cv => cv.style.pointerEvents = tool === 'select' ? 'none' : 'auto');
    showToast('Tool: ' + tool);
  }
  function clearActiveDrawings() {
    document.querySelectorAll('.pdf-page-overlay').forEach(cv => { const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, cv.width, cv.height); });
    showToast('Drawings cleared');
  }
  function rotatePDFPage() {
    const pg = state.pdfPages[state.activePdfPageIndex];
    if (!pg) return;
    pg.rotation = ((pg.rotation || 0) + 90) % 360;
    const cont = document.getElementById('pdf-page-' + state.activePdfPageIndex);
    if (cont) cont.style.transform = 'rotate(' + pg.rotation + 'deg)';
    showToast('Page rotated ' + pg.rotation + '°');
  }
  function openSignatureCanvasDialog() { setDrawingTool('pen'); showToast('✍️ Signature mode — draw on the PDF page'); }

  // ── Universal PDF viewer: opens PDF / DOCX / XLSX / CSV / PPTX inside the PDF tab ──
  async function loadRealPdf(arrayBuffer, name) {
    if (typeof pdfjsLib === 'undefined') { showToast('⚠️ PDF engine not loaded yet — try again'); return; }
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    } catch (e) {}
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      pages.push({ html: '<img src="' + canvas.toDataURL('image/jpeg', 0.85) + '" style="width:100%;display:block;"/>', bare: true, rotation: 0 });
    }
    state.pdfPages = pages;
    state.activePdfPageIndex = 0;
    renderPdfPages();
  }

  async function openInPdfViewer(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const toast = showToast('⏳ Opening "' + file.name + '" in PDF viewer...', 0);
    try {
      switchAppMode('pdf');
      if (ext === 'pdf') {
        await loadRealPdf(await file.arrayBuffer(), file.name);
      } else if (ext === 'docx' || ext === 'doc') {
        if (typeof mammoth === 'undefined') throw new Error('mammoth.js not loaded');
        const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        const parts = result.value.split(/<hr\s*\/?>/i).filter(p => p.trim());
        state.pdfPages = (parts.length ? parts : [result.value]).map(p => ({ html: p, rotation: 0 }));
        state.activePdfPageIndex = 0;
        renderPdfPages();
      } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        if (typeof XLSX === 'undefined') throw new Error('SheetJS not loaded');
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        state.pdfPages = wb.SheetNames.map(nm => ({
          html: '<h3 style="font-weight:700;margin-bottom:10px;">' + nm + '</h3>'
            + XLSX.utils.sheet_to_html(wb.Sheets[nm]).replace('<table', '<table style="border-collapse:collapse;width:100%;font-size:12px;" border="1"'),
          rotation: 0
        }));
        state.activePdfPageIndex = 0;
        renderPdfPages();
      } else if (ext === 'pptx') {
        const text = await extractPptxText(await file.arrayBuffer());
        state.pdfPages = (text.length ? text : ['(No readable text found)']).map((t, i) => ({
          html: '<div style="font-size:11px;color:#94a3b8;margin-bottom:10px;">Slide ' + (i + 1) + '</div><div style="white-space:pre-wrap;font-size:15px;line-height:1.6;">' + t + '</div>',
          rotation: 0
        }));
        state.activePdfPageIndex = 0;
        renderPdfPages();
        showToast('ℹ️ PPTX shown as text preview (full layout not rendered)', 4000);
      } else {
        if (toast) toast.remove();
        showToast('⚠️ Unsupported file type: .' + ext);
        return;
      }
      if (toast) toast.remove();
      showToast('✅ "' + file.name + '" opened in PDF viewer');
    } catch (err) {
      if (toast) toast.remove();
      showToast('❌ Failed to open: ' + (err.message || err));
    }
  }

  // Best-effort PPTX text extraction (slideN.xml) without extra libs
  async function extractPptxText(arrayBuffer) {
    try {
      const bytes = new Uint8Array(arrayBuffer);
      const text = new TextDecoder('latin1').decode(bytes);
      // PPTX is a zip; we can't unzip without a lib, so scan for readable <a:t> runs in any uncompressed parts.
      const matches = text.match(/<a:t>([^<]+)<\/a:t>/g);
      if (!matches) return [];
      const joined = matches.map(m => m.replace(/<\/?a:t>/g, '')).join('\n');
      return [joined];
    } catch (e) { return []; }
  }



  // Expose all handlers globally for inline onclick attributes
  Object.assign(window, {
    computeFormula, executeFormatting, growFontSize, shrinkFontSize, changeLineSpacing,
    changeParagraphShading, activateFormatPainter, changeMargins, changePageSize, toggleOrientation,
    addNewPage, deleteActivePage, toggleWordRuler, toggleWordGrid, toggleWordCount, toggleTrackChanges,
    insertWordArt, insertMockImage, insertShape, insertFootnote, insertReferenceCitation, insertStickyNote,
    insertTableOfContents, openInsertTableDialog, openFindReplaceDialog, runSpellingCheck, simulateThesaurus,
    manageSources, protectDocument, translateActiveSelection, triggerCopilot,
    triggerCopy, triggerCut, triggerPaste, triggerUndo, triggerRedo,
    adjustZoom, resetZoom, applyZoom,
    renderSheetTabs, applyCellFormat, insertFormula, freezePanes, generateDynamicSheetChart,
    renderSlideList, renderActiveSlide, addNewSlide, deleteActiveSlide, duplicateActiveSlide,
    changeSlideLayout, setSlideBackground, navigateSlide, startSlideshow, closeSlideshow,
    addTextBox, insertTextBoxSmart, deleteSelectedText, styleSelectedText, setSlideSize,
    addSlideShape, deleteSelectedShape, setShapeFill, setShapeAnimation, setSlideTransition,
    openInPdfViewer,
    renderPdfPages, setDrawingTool, clearActiveDrawings, rotatePDFPage, openSignatureCanvasDialog
  });

  // ═══════════════════════════════════
  //  STARTUP INITIALIZATION
  // ═══════════════════════════════════

  // Drag-and-drop file open
  document.addEventListener('dragover', e => {
    e.preventDefault();
    const dz = document.getElementById('global-drop-zone');
    if (dz) dz.style.display = 'flex';
  });
  document.addEventListener('dragleave', e => {
    if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
      const dz = document.getElementById('global-drop-zone');
      if (dz) dz.style.display = 'none';
    }
  });
  document.addEventListener('drop', e => {
    e.preventDefault();
    const dz = document.getElementById('global-drop-zone');
    if (dz) dz.style.display = 'none';
    if (e.dataTransfer && e.dataTransfer.files.length) {
      processUploadedFile({ target: { files: e.dataTransfer.files, value: '' } });
    }
  });

  // Global keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); openFileDialog(); }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); triggerSave(); }
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); triggerUndo(); }
    if (e.ctrlKey && e.key === 'y') { e.preventDefault(); triggerRedo(); }
    if (e.ctrlKey && e.key === 'p') { e.preventDefault(); window.print(); }
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); newDocument(); }
  });

  // Switch app on sidebar click
  document.querySelectorAll('.app-sidebar .app-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => switchAppMode(btn.getAttribute('data-app')));
  });

  // Tab bar click handling
  document.querySelectorAll('.tbar .tb').forEach(tab => {
    tab.addEventListener('click', () => switchRibbonTab(tab.dataset.tab));
  });

  // NOTE: startup boot moved to the very end of this file so that all
  // `const` declarations below (ACCENT_DEFAULTS, APP_ACCENT, …) are
  // initialized before switchAppMode()/applyActiveAccent() run.


  // ════════════════════════════════════════════════════════════
  // Octopus Studio — Theme & Accent Color System (Parts 1 & 2)
  // ════════════════════════════════════════════════════════════
  const ACCENT_DEFAULTS = {
    write: '#1d4ed8',
    sheet: '#15803d',
    present: '#b45309',
    pdf: '#7c3aed',
  };
  const ACCENT_VAR = {
    write: '--color-write',
    sheet: '--color-sheet',
    present: '--color-present',
    pdf: '--color-pdf',
  };
  // Active app -> accent token name
  const APP_ACCENT = { word: 'write', sheet: 'sheet', impress: 'present', pdf: 'pdf' };

  function loadAccentColors() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('octopus-theme-colors') || '{}'); } catch (e) { saved = {}; }
    Object.keys(ACCENT_DEFAULTS).forEach(key => {
      const color = saved[key] || ACCENT_DEFAULTS[key];
      document.documentElement.style.setProperty(ACCENT_VAR[key], color);
      const picker = document.getElementById('accent-' + key);
      if (picker) picker.value = color;
    });
    applyActiveAccent(state.activeApp);
  }

  function persistAccentColors() {
    const data = {};
    Object.keys(ACCENT_DEFAULTS).forEach(key => {
      data[key] = getComputedStyle(document.documentElement).getPropertyValue(ACCENT_VAR[key]).trim();
    });
    localStorage.setItem('octopus-theme-colors', JSON.stringify(data));
  }

  function setAccentColor(key, color) {
    document.documentElement.style.setProperty(ACCENT_VAR[key], color);
    const picker = document.getElementById('accent-' + key);
    if (picker) picker.value = color;
    applyActiveAccent(state.activeApp);
    persistAccentColors();
  }
  window.setAccentColor = setAccentColor;

  function resetAccentColor(key) {
    setAccentColor(key, ACCENT_DEFAULTS[key]);
  }
  window.resetAccentColor = resetAccentColor;

  function resetAllAccentColors() {
    Object.keys(ACCENT_DEFAULTS).forEach(key => {
      document.documentElement.style.setProperty(ACCENT_VAR[key], ACCENT_DEFAULTS[key]);
      const picker = document.getElementById('accent-' + key);
      if (picker) picker.value = ACCENT_DEFAULTS[key];
    });
    applyActiveAccent(state.activeApp);
    persistAccentColors();
  }
  window.resetAllAccentColors = resetAllAccentColors;

  // Mirror the active app's accent into the generic --color-accent token
  function applyActiveAccent(appName) {
    const key = APP_ACCENT[appName] || 'write';
    const color = getComputedStyle(document.documentElement).getPropertyValue(ACCENT_VAR[key]).trim();
    document.documentElement.style.setProperty('--color-accent', color);
  }
  window.applyActiveAccent = applyActiveAccent;

  // ── Theme mode (light / dark / system) ──────────────────────
  function applyTheme(mode) {
    let dark = mode === 'dark';
    if (mode === 'system') {
      dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    state.darkMode = dark;
    document.body.classList.toggle('dark', dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const icon = document.querySelector('#dark-mode-toggle i');
    if (icon) icon.className = dark ? 'ti ti-sun' : 'ti ti-moon';
    document.querySelectorAll('#theme-selector .theme-opt').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-theme') === mode);
    });
    if (state.activeApp === 'sheet' && typeof evaluateSpreadsheet === 'function') evaluateSpreadsheet();
  }

  function setThemeMode(mode) {
    localStorage.setItem('octopus-theme-mode', mode);
    applyTheme(mode);
  }
  window.setThemeMode = setThemeMode;

  // React to OS theme changes when in "system" mode
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (localStorage.getItem('octopus-theme-mode') === 'system') applyTheme('system');
    });
  }

  // ── Initialize on load ──────────────────────────────────────
  loadAccentColors();
  applyTheme(localStorage.getItem('octopus-theme-mode') || (state.darkMode ? 'dark' : 'light'));

  // ── Startup boot (runs LAST so every const above is initialized) ──
  const restored = loadFromLocalStorage();
  // Always make sure the Word view is properly activated.
  switchAppMode('word');
  if (restored) {
    renderWordPages();
    const rulerBar = document.getElementById('word-ruler-bar');
    if (rulerBar) rulerBar.style.display = 'flex';
  }
  initWordRuler();

  // Show welcome hint
  setTimeout(() => {
    showToast('💡 Drag & drop a .docx, .xlsx, or .csv file to open it instantly  |  Ctrl+O to browse files', 5000);
  }, 1200);



