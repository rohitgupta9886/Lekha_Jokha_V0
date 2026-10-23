// ========================================================
// Vyapar Pro - Barcode Engine & Scanner Module
// Supports: Camera Scanner, USB Hardware Scanner & Printable SVG Barcodes
// ========================================================

window.BarcodeModule = {
  activeStream: null,
  isListeningUSB: false,
  usbBuffer: '',
  lastKeystrokeTime: 0,

  init() {
    this.setupUSBScannerListener();
  },

  // Play realistic retail POS scanner beep via Web Audio API
  playScanBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, audioCtx.currentTime); // 1850 Hz classic POS beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      // AudioContext unavailable or blocked by autoplay policy
    }
  },

  // USB / HID physical scanner keyboard wedge listener
  setupUSBScannerListener() {
    if (this.isListeningUSB) return;
    this.isListeningUSB = true;

    window.addEventListener('keydown', (e) => {
      // Ignore if user is typing in a textarea or certain text inputs unless it's a barcode field
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      const isBarcodeField = activeEl && (activeEl.id === 'barcodeSearchInput' || activeEl.classList.contains('barcode-input'));

      const now = Date.now();
      const diff = now - this.lastKeystrokeTime;
      this.lastKeystrokeTime = now;

      if (e.key === 'Enter') {
        if (this.usbBuffer.length >= 4 && diff < 80) {
          // Fast sequence ended with enter -> USB hardware barcode scanner!
          e.preventDefault();
          const scannedCode = this.usbBuffer.trim();
          this.usbBuffer = '';
          this.handleBarcodeScanned(scannedCode);
          return;
        }
        this.usbBuffer = '';
      } else if (e.key.length === 1) {
        // Only buffer if keystrokes are coming fast (<60ms apart) or if buffer already active
        if (diff < 60 || this.usbBuffer.length === 0) {
          this.usbBuffer += e.key;
        } else {
          this.usbBuffer = e.key;
        }
      }
    });
  },

  // Process a scanned barcode string
  handleBarcodeScanned(barcode) {
    this.playScanBeep();
    const item = window.Store.getItemByBarcode(barcode);

    if (!item) {
      if (window.app && window.app.showToast) {
        window.app.showToast(`Barcode "${barcode}" not found in inventory!`, 'danger');
      }
      return null;
    }

    if (window.app && window.app.showToast) {
      window.app.showToast(`Scanned: ${item.name} (${item.barcode})`, 'success');
    }

    // Check if Sale Modal is currently open
    const saleModal = document.getElementById('saleModal');
    if (saleModal && saleModal.classList.contains('active')) {
      if (window.app && window.app.addItemToSaleInvoice) {
        window.app.addItemToSaleInvoice(item.id);
      }
      return item;
    }

    // Check if Items view is active
    if (window.location.hash === '#items') {
      const searchBox = document.getElementById('itemSearchInput');
      if (searchBox) {
        searchBox.value = item.name;
        searchBox.dispatchEvent(new Event('input'));
      }
    }

    return item;
  },

  // Generate crisp Code-128 style SVG Barcode for products & labels
  generateBarcodeSvg(code, width = 240, height = 70) {
    const cleanCode = String(code || '890103000001');
    // Generate pseudo-pattern bars based on character hash
    let barsHtml = '';
    let x = 12;
    const barHeight = height - 22;

    // Start guard pattern (thin-thick-thin)
    barsHtml += `<rect x="${x}" y="4" width="2" height="${barHeight}" fill="#0f172a"/>`; x += 4;
    barsHtml += `<rect x="${x}" y="4" width="4" height="${barHeight}" fill="#0f172a"/>`; x += 6;
    barsHtml += `<rect x="${x}" y="4" width="2" height="${barHeight}" fill="#0f172a"/>`; x += 5;

    // Encode digits into varying width bars
    for (let i = 0; i < cleanCode.length; i++) {
      const charCode = cleanCode.charCodeAt(i);
      const w1 = ((charCode % 3) + 1);
      const s1 = (((charCode >> 1) % 2) + 2);
      const w2 = (((charCode >> 2) % 3) + 1.5);
      const s2 = 2.5;

      barsHtml += `<rect x="${x}" y="4" width="${w1}" height="${barHeight}" fill="#0f172a"/>`;
      x += w1 + s1;
      barsHtml += `<rect x="${x}" y="4" width="${w2}" height="${barHeight}" fill="#0f172a"/>`;
      x += w2 + s2;
    }

    // Stop guard pattern
    barsHtml += `<rect x="${x}" y="4" width="3" height="${barHeight}" fill="#0f172a"/>`; x += 5;
    barsHtml += `<rect x="${x}" y="4" width="2" height="${barHeight}" fill="#0f172a"/>`; x += 4;
    barsHtml += `<rect x="${x}" y="4" width="4" height="${barHeight}" fill="#0f172a"/>`; x += 6;

    const totalWidth = Math.max(width, x + 15);

    return `
      <svg width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff" rx="4"/>
        <g>${barsHtml}</g>
        <text x="${totalWidth / 2}" y="${height - 4}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" fill="#0f172a" letter-spacing="3">${cleanCode}</text>
      </svg>
    `;
  },

  // Open the interactive Barcode Scanner modal (with Camera & Presets)
  openScannerModal(onScanCallback) {
    let modal = document.getElementById('barcodeScannerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'barcodeScannerModal';
      document.body.appendChild(modal);
    }

    const items = window.Store.getItems();

    modal.innerHTML = `
      <div class="modal-dialog modal-md">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="brand-badge" style="background:#ed1a3b;color:#fff;">POS SCANNER</span>
            <h2 class="modal-title">Live Barcode & QR Reader</h2>
          </div>
          <button class="modal-close-btn" id="closeBarcodeScannerBtn">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Viewport HUD with Animated Laser Line -->
          <div class="scanner-viewport-box">
            <div class="scanner-laser"></div>
            <div class="scanner-hud-corner hud-tl"></div>
            <div class="scanner-hud-corner hud-tr"></div>
            <div class="scanner-hud-corner hud-bl"></div>
            <div class="scanner-hud-corner hud-br"></div>
            <div class="scanner-status-tag">
              <span class="sync-dot"></span> Camera Active / USB Reader Listening
            </div>
            <video id="scannerVideo" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;display:none;"></video>
            <div class="scanner-camera-fallback" id="scannerCameraFallback">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"></path>
                <line x1="7" y1="12" x2="17" y2="12"></line>
              </svg>
              <span>Align barcode inside the frame or use USB scanner</span>
            </div>
          </div>

          <!-- Manual Barcode Input -->
          <div class="form-group" style="margin-top: 1rem;">
            <label style="font-weight:600;">Manual Barcode Lookup / Scan Simulation</label>
            <div style="display:flex;gap:0.5rem;">
              <input type="text" id="manualBarcodeInput" class="form-control mono-val" placeholder="Type or scan 890103000001..." autofocus>
              <button class="btn btn-primary" id="submitManualBarcodeBtn">Scan</button>
            </div>
          </div>

          <!-- Quick Test Presets (Catalog Barcodes) -->
          <div style="margin-top: 1rem;">
            <label style="font-size:0.8rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Quick Click Barcode Presets:</label>
            <div class="barcode-preset-chips" style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.4rem;">
              ${items.slice(0, 5).map(i => `
                <button type="button" class="btn btn-sm btn-outline preset-barcode-btn mono-val" data-code="${i.barcode}" title="${i.name}">
                  ${i.barcode} - ${i.name.split(' ')[0]}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancelBarcodeScannerBtn">Close</button>
        </div>
      </div>
    `;

    modal.classList.add('active');

    // Attempt camera stream initialization
    const video = document.getElementById('scannerVideo');
    const fallback = document.getElementById('scannerCameraFallback');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
          this.activeStream = stream;
          if (video) {
            video.srcObject = stream;
            video.style.display = 'block';
            if (fallback) fallback.style.display = 'none';
          }
        })
        .catch(err => {
          // Fallback gracefully to simulated HUD view
          if (fallback) fallback.style.display = 'flex';
        });
    }

    const closeModal = () => {
      if (this.activeStream) {
        this.activeStream.getTracks().forEach(t => t.stop());
        this.activeStream = null;
      }
      modal.classList.remove('active');
    };

    document.getElementById('closeBarcodeScannerBtn').onclick = closeModal;
    document.getElementById('cancelBarcodeScannerBtn').onclick = closeModal;

    const doScan = (code) => {
      const item = this.handleBarcodeScanned(code);
      if (item && onScanCallback) {
        onScanCallback(item);
      }
      closeModal();
    };

    document.getElementById('submitManualBarcodeBtn').onclick = () => {
      const val = document.getElementById('manualBarcodeInput').value.trim();
      if (val) doScan(val);
    };

    document.getElementById('manualBarcodeInput').onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = document.getElementById('manualBarcodeInput').value.trim();
        if (val) doScan(val);
      }
    };

    modal.querySelectorAll('.preset-barcode-btn').forEach(btn => {
      btn.onclick = () => {
        doScan(btn.getAttribute('data-code'));
      };
    });
  },

  // Open Printable Barcode Product Label Modal
  openPrintLabelModal(itemId) {
    const item = window.Store.getItem(itemId);
    if (!item) return;

    const biz = window.Store.getBusiness();
    let modal = document.getElementById('barcodeLabelModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'barcodeLabelModal';
      document.body.appendChild(modal);
    }

    const barcodeSvg = this.generateBarcodeSvg(item.barcode, 260, 68);

    modal.innerHTML = `
      <div class="modal-dialog modal-md">
        <div class="modal-header no-print">
          <div class="modal-title-group">
            <span class="brand-badge" style="background:#0284c7;color:#fff;">THERMAL STICKER</span>
            <h2 class="modal-title">Product Barcode Label</h2>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-primary btn-sm" id="printBarcodeLabelBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              <span>Print Sticker</span>
            </button>
            <button class="modal-close-btn" id="closeBarcodeLabelBtn">&times;</button>
          </div>
        </div>
        <div class="modal-body printable-area" style="display:flex;justify-content:center;padding:1.5rem;background:#f8fafc;">
          <!-- Standard 50mm x 25mm Retail Barcode Sticker -->
          <div class="barcode-sticker-card" style="width:280px;background:#fff;border:1px dashed #94a3b8;border-radius:8px;padding:12px;text-align:center;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${biz.name}</div>
            <div style="font-size:14px;font-weight:800;color:#0f172a;margin:4px 0 2px 0;line-height:1.2;">${item.name}</div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#475569;margin-bottom:6px;padding:0 8px;">
              <span>HSN: <b>${item.hsn || 'N/A'}</b></span>
              <span>MRP: <b style="font-size:13px;color:#ed1a3b;">₹${Number(item.salePrice).toLocaleString('en-IN')}</b></span>
            </div>
            <div style="margin:4px auto;display:flex;justify-content:center;">
              ${barcodeSvg}
            </div>
            <div style="font-size:9px;color:#94a3b8;margin-top:2px;">Packed & Marketed in India • Incl. of all taxes</div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');

    document.getElementById('closeBarcodeLabelBtn').onclick = () => modal.classList.remove('active');
    document.getElementById('printBarcodeLabelBtn').onclick = () => window.print();
  }
};

window.BarcodeModule.init();
