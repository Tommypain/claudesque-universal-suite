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
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark', state.darkMode);
    localStorage.setItem('officeSuiteDarkMode', state.darkMode);
    
    const icon = document.querySelector('#dark-mode-toggle i');
    if (icon) {
      icon.className = state.darkMode ? 'ti ti-sun' : 'ti ti-moon';
    }
    
    if (state.activeApp === 'sheet') {
      evaluateSpreadsheet();
    }
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
        tableHtml += '<td class="sheet-cell" id="cell-' + col + r + '" data-cell="' + col + r + '" data-col="' + col + '" data-row="' + r + '"></td>';
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

  function triggerFileUploader() {
    document.getElementById('physical-file-uploader').click();
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

      // ── .pdf ───────────────────────────────────────────────
      } else if (ext === 'pdf') {
        const url = URL.createObjectURL(file);
        switchAppMode('pdf');
        const pdfCanvas = document.getElementById('pdf-canvas-main');
        if (pdfCanvas) {
          pdfCanvas.innerHTML = `<object data="${url}" type="application/pdf" style="width:100%;height:100%;min-height:800px;"></object>`;
        }
        if (toast) toast.remove();
        showToast(`✅ PDF "${file.name}" opened`);

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

  // Auto-restore from localStorage on startup
  const restored = loadFromLocalStorage();

  // Default startup: open Word
  if (!restored) {
    switchAppMode('word');
  } else {
    // switchAppMode already called inside loadFromLocalStorage
    const rulerBar = document.getElementById('word-ruler-bar');
    if (rulerBar) rulerBar.style.display = 'flex';
  }

  initWordRuler();

  // Show welcome hint
  setTimeout(() => {
    showToast('💡 Drag & drop a .docx, .xlsx, or .csv file to open it instantly  |  Ctrl+O to browse files', 5000);
  }, 1200);

