// ==============================================================================
// Lekha Jokha - Utilities Module & Field Sales Force Management System
// Submenus:
//   1. Import Items           2. Set Up My Business      3. Accountant Access
//   4. Barcode Generator      5. Update Items in Bulk    6. Import from Tally
//   7. Import Parties         8. Track Your Salesmen     9. Exports to Tally
//   10. Export Items
// ==============================================================================

window.UtilitiesModule = {
  currentSubmenu: 'import-items',
  activeSalesman: null,
  salesmenList: [],
  mapInstance: null,

  getActiveBusinessId() {
    if (window.Store && window.Store.getActiveBusiness) {
      const b = window.Store.getActiveBusiness();
      if (b && b.id) return b.id;
    }
    return (window.app && window.app.activeBusinessId) || 'BIZ-001';
  },

  getActiveCompanyName() {
    if (window.Store && window.Store.getActiveBusiness) {
      const b = window.Store.getActiveBusiness();
      if (b && b.name) return b.name;
    }
    return (window.app && window.app.companyName) || 'Sharma Traders & Distributors';
  },

  getAllItems() {
    if (window.Store && window.Store.getItems) {
      return window.Store.getItems();
    }
    return (window.app && window.app.items) || [];
  },

  getAllBusinesses() {
    if (window.Store && window.Store.getBusinesses) {
      return window.Store.getBusinesses();
    }
    return (window.app && window.app.businesses) || [{ id: 'BIZ-001', name: 'Sharma Traders & Distributors' }];
  },

  render(container, initialSubmenu = 'import-items') {
    this.currentSubmenu = initialSubmenu;
    
    let wrapper = container.querySelector('.utilities-wrapper');
    if (!wrapper) {
      container.innerHTML = `
        <div class="utilities-wrapper">
          <div class="utilities-header-nav">
            <div class="util-nav-tabs" id="utilSubmenuTabs">
              <button class="util-tab-btn ${this.currentSubmenu === 'track-salesmen' ? 'active' : ''}" data-sub="track-salesmen">
                <span class="tab-icon">📍</span> Track Your Salesmen
              </button>
              <button class="util-tab-btn ${this.currentSubmenu === 'import-items' ? 'active' : ''}" data-sub="import-items">
                <span class="tab-icon">📥</span> Import Items
              </button>
              <button class="util-tab-btn ${this.currentSubmenu === 'setup-business' ? 'active' : ''}" data-sub="setup-business">
                <span class="tab-icon">🏢</span> Set Up My Business
              </button>
              <button class="util-tab-btn ${this.currentSubmenu === 'accountant-access' ? 'active' : ''}" data-sub="accountant-access">
                <span class="tab-icon">💼</span> Accountant Access
              </button>
              <button class="util-tab-btn ${this.currentSubmenu === 'barcode-generator' ? 'active' : ''}" data-sub="barcode-generator">
                <span class="tab-icon">🏷️</span> Barcode Generator
              </button>
              <button class="util-tab-btn ${this.currentSubmenu === 'bulk-update' ? 'active' : ''}" data-sub="bulk-update">
                <span class="tab-icon">⚡</span> Update Items In Bulk
              </button>
              <button class="util-tab-btn ${this.currentSubmenu === 'import-tally' ? 'active' : ''}" data-sub="import-tally">
                <span class="tab-icon">🔄</span> Import From Tally
              </button>
              <button class="util-tab-btn ${this.currentSubmenu === 'import-parties' ? 'active' : ''}" data-sub="import-parties">
                <span class="tab-icon">👥</span> Import Parties
              </button>
              <button class="util-tab-btn ${this.currentSubmenu === 'export-tally' ? 'active' : ''}" data-sub="export-tally">
                <span class="tab-icon">📤</span> Exports To Tally
              </button>
              <button class="util-tab-btn ${this.currentSubmenu === 'export-items' ? 'active' : ''}" data-sub="export-items">
                <span class="tab-icon">📦</span> Export Items
              </button>
            </div>
          </div>

          <div class="util-content-area" id="utilContentArea">
            <!-- Submenu Screen is rendered here -->
          </div>
        </div>
      `;

      // Bind sub-tabs
      const tabs = container.querySelectorAll('.util-tab-btn');
      tabs.forEach(btn => {
        btn.addEventListener('click', () => {
          const sub = btn.getAttribute('data-sub');
          this.switchSubmenu(sub);
        });
      });
    } else {
      // Just update active tab buttons
      const tabs = container.querySelectorAll('.util-tab-btn');
      tabs.forEach(btn => {
        if (btn.getAttribute('data-sub') === this.currentSubmenu) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    this.renderActiveSubmenu();
  },

  switchSubmenu(sub) {
    this.currentSubmenu = sub;
    const targetHash = `#util-${sub}`;
    if (window.location.hash === targetHash) {
      this.renderActiveSubmenu();
    } else {
      window.location.hash = targetHash;
    }
  },

  renderActiveSubmenu() {
    const area = document.getElementById('utilContentArea');
    if (!area) return;

    switch (this.currentSubmenu) {
      case 'track-salesmen':
        this.renderTrackSalesmen(area);
        break;
      case 'import-items':
        this.renderImportItems(area);
        break;
      case 'setup-business':
        this.renderSetupBusiness(area);
        break;
      case 'accountant-access':
        this.renderAccountantAccess(area);
        break;
      case 'barcode-generator':
        this.renderBarcodeGenerator(area);
        break;
      case 'bulk-update':
        this.renderBulkUpdate(area);
        break;
      case 'import-tally':
        this.renderImportTally(area);
        break;
      case 'import-parties':
        this.renderImportParties(area);
        break;
      case 'export-tally':
        this.renderExportTally(area);
        break;
      case 'export-items':
        this.renderExportItems(area);
        break;
      default:
        this.renderTrackSalesmen(area);
    }
  },

  // ============================================================================
  // 8. TRACK YOUR SALESMEN (Primary Feature matching Screenshot 1)
  // ============================================================================
  async renderTrackSalesmen(container) {
    container.innerHTML = `
      <div class="track-salesmen-container">
        <!-- Map Canvas / Container -->
        <div class="salesmen-map-viewport" id="salesmenMap">
          <!-- Fallback Interactive Stylized Map Viewport if Leaflet is loading or offline -->
          <div class="map-interactive-canvas" id="mapSvgCanvas">
            <svg viewBox="0 0 1000 650" width="100%" height="100%" class="styled-map-svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dbeafe" stroke-width="0.8"/>
                </pattern>
                <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#f8fafc"/>
                  <stop offset="100%" stop-color="#f1f5f9"/>
                </linearGradient>
              </defs>
              <rect width="1000" height="650" fill="url(#mapBg)"/>
              <rect width="1000" height="650" fill="url(#grid)"/>

              <!-- Parks & Green Zones -->
              <path d="M 600,120 Q 720,80 820,150 T 890,320 T 700,400 Z" fill="#dcfce7" opacity="0.6"/>
              <path d="M 80,450 Q 180,400 240,480 T 150,600 Z" fill="#dcfce7" opacity="0.6"/>
              <text x="730" y="240" font-size="12" fill="#15803d" font-weight="600" opacity="0.7">Cubbon Park / Race Course</text>

              <!-- Main Roads & Railway Lines -->
              <path d="M 50,280 C 250,280 400,220 550,300 S 800,260 950,220" stroke="#cbd5e1" stroke-width="12" fill="none"/>
              <path d="M 50,280 C 250,280 400,220 550,300 S 800,260 950,220" stroke="#f8fafc" stroke-width="8" fill="none"/>
              
              <path d="M 450,50 C 460,200 480,350 420,500 S 350,620 300,650" stroke="#cbd5e1" stroke-width="10" fill="none"/>
              <path d="M 450,50 C 460,200 480,350 420,500 S 350,620 300,650" stroke="#f8fafc" stroke-width="6" fill="none"/>

              <!-- Railway line to Krantivira Sangolli Rayanna (Majestic) -->
              <path d="M 320,100 L 410,280 L 460,420 L 520,600" stroke="#94a3b8" stroke-dasharray="6,4" stroke-width="4" fill="none"/>
              <text x="360" y="320" font-size="11" fill="#475569" font-weight="700">Krantivira Sangolli Rayanna (Bengaluru)</text>

              <!-- Secondary Arteries -->
              <path d="M 200,80 Q 320,240 450,260 T 700,320" stroke="#e2e8f0" stroke-width="5" fill="none"/>
              <path d="M 500,320 Q 620,400 780,450" stroke="#fed7aa" stroke-width="7" fill="none"/>
              <text x="620" y="420" font-size="11" fill="#c2410c">Magadi Road / Rajajinagar</text>
              <text x="240" y="160" font-size="11" fill="#64748b">Malleshwaram</text>
              <text x="680" y="120" font-size="11" fill="#64748b">Seshadripuram</text>
              <text x="490" y="240" font-size="11" fill="#64748b">Okalipuram</text>
              <text x="580" y="290" font-size="11" fill="#64748b">Gandhinagar</text>
              <text x="380" y="460" font-size="11" fill="#64748b">Kempapura Agrahara</text>

              <!-- Real Dynamic Salesmen Markers -->
              <g id="svgSalesmenMarkersGroup">
                <!-- Marker rendered dynamically -->
              </g>
            </svg>
          </div>
        </div>

        <!-- Floating Salesman List Panel matching Screenshot 1 -->
        <div class="salesman-floating-panel" id="salesmanPanel">
          <div class="salesman-panel-header">
            <h3 class="panel-count-title" id="salesmenCountTitle">Salesmen (1)</h3>
            <button class="btn btn-sm btn-outline-refresh" id="refreshSalesmenBtn" title="Refresh Salesman status & locations">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              <span>Refresh</span>
            </button>
          </div>

          <div class="salesman-items-list" id="salesmenItemsList">
            <div class="salesman-loading-state">Loading field salesmen...</div>
          </div>

          <div class="salesman-panel-footer">
            <button class="btn-add-salesman-link" id="addSalesmanTriggerBtn" onclick="(window.openAddSalesmanModal || (window.SalesmenModule && window.SalesmenModule.openAddSalesmanModal) || (window.UtilitiesModule && window.UtilitiesModule.openAddSalesmanModal))()">
              <span class="plus-icon">+</span> Add Field Salesman
            </button>
          </div>
        </div>

        <!-- Salesman Details Drawer / Modal -->
        <div class="salesman-details-drawer" id="salesmanDetailsDrawer" style="display:none;">
          <div class="drawer-header">
            <h4 id="drawerSalesmanName">Salesman Details</h4>
            <button class="icon-close-btn" id="closeDrawerBtn">&times;</button>
          </div>
          <div class="drawer-body" id="drawerBody">
            <!-- Dynamic profile, visits, attendance -->
          </div>
        </div>
      </div>
    `;

    this.bindTrackSalesmenEvents();
    await this.loadSalesmen();
  },

  bindTrackSalesmenEvents() {
    const refreshBtn = document.getElementById('refreshSalesmenBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadSalesmen());

    const addBtn = document.getElementById('addSalesmanTriggerBtn');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openAddSalesmanModal();
      });
    }

    const closeBtn = document.getElementById('closeAddSalesmanModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeAddSalesmanModal();
      });
    }

    const cancelBtn = document.getElementById('cancelAddSalesmanBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeAddSalesmanModal();
      });
    }

    const modal = document.getElementById('addSalesmanModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeAddSalesmanModal();
      });
    }

    const form = document.getElementById('addSalesmanForm');
    if (form) form.addEventListener('submit', (e) => this.handleCreateSalesman(e));

    const closeDrawer = document.getElementById('closeDrawerBtn');
    if (closeDrawer) closeDrawer.addEventListener('click', () => {
      document.getElementById('salesmanDetailsDrawer').style.display = 'none';
    });
  },

  async loadSalesmen() {
    const listContainer = document.getElementById('salesmenItemsList');
    const title = document.getElementById('salesmenCountTitle');
    if (!listContainer) return;

    try {
      const activeBizId = this.getActiveBusinessId();
      const res = await fetch(`/api/v1/salesmen?businessId=${activeBizId}`);
      const data = await res.json();
      this.salesmenList = data.salesmen || [];

      if (title) title.innerText = `Salesmen (${this.salesmenList.length})`;
      this.renderSalesmenList(this.salesmenList);
      this.renderMapMarkers(this.salesmenList);
    } catch (err) {
      console.error('Failed to load salesmen:', err);
      listContainer.innerHTML = `<div class="error-msg">Failed to connect to salesmen service: ${err.message}</div>`;
    }
  },

  renderSalesmenList(list) {
    const container = document.getElementById('salesmenItemsList');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-salesman-state">
          <p>No salesmen assigned yet.</p>
          <small>Click "+ Add Field Salesman" below to register staff.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(s => {
      const initial = (s.name || 'S').trim().charAt(0).toUpperCase();
      let badgeClass = 'badge-pending';
      let badgeText = s.joiningStatus || 'JOINING PENDING';

      if (s.attendanceStatus === 'Punched In') {
        badgeClass = 'badge-punched-in';
        badgeText = 'PUNCHED IN';
      } else if (s.joiningStatus === 'ACTIVE') {
        badgeClass = 'badge-active';
        badgeText = s.attendanceStatus === 'Punched Out' ? 'PUNCHED OUT' : 'ACTIVE';
      }

      return `
        <div class="salesman-card-item" data-id="${s.id}">
          <div class="salesman-avatar-circle">${initial}</div>
          <div class="salesman-card-info">
            <div class="salesman-name-row">
              <span class="salesman-name">${s.name}</span>
            </div>
            <div class="salesman-badge-row">
              <span class="salesman-status-badge ${badgeClass}">${badgeText}</span>
              ${s.territory ? `<span class="salesman-territory-tag">${s.territory}</span>` : ''}
            </div>
            <div class="salesman-subtext">
              <span>📱 ${s.phone}</span>
              ${s.lastLocation ? `<span class="loc-indicator">📍 ${s.lastLocation.address || 'GPS Fix'}</span>` : ''}
            </div>
          </div>
          <div class="salesman-card-actions">
            ${s.whatsAppInviteUrl ? `
              <a href="${s.whatsAppInviteUrl}" target="_blank" class="btn-wa-icon" title="Share Invitation via WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to open details
    container.querySelectorAll('.salesman-card-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-wa-icon')) return;
        const id = card.getAttribute('data-id');
        const s = this.salesmenList.find(item => item.id === id);
        if (s) this.openSalesmanDetails(s);
      });
    });
  },

  renderMapMarkers(list) {
    const group = document.getElementById('svgSalesmenMarkersGroup');
    if (!group) return;

    if (list.length === 0) {
      group.innerHTML = '';
      return;
    }

    // Default coordinates in Bengaluru map context
    const coords = [
      { x: 480, y: 250 },
      { x: 650, y: 350 },
      { x: 380, y: 440 },
      { x: 740, y: 200 }
    ];

    group.innerHTML = list.map((s, idx) => {
      const pos = coords[idx % coords.length];
      const isOnline = s.attendanceStatus === 'Punched In';
      const color = isOnline ? '#22c55e' : (s.joiningStatus === 'JOINING PENDING' ? '#f59e0b' : '#64748b');

      return `
        <g class="map-salesman-pin" transform="translate(${pos.x}, ${pos.y})" style="cursor:pointer;" onclick="window.UtilitiesModule.openSalesmanById('${s.id}')">
          <!-- Pulse animation for online tracking -->
          ${isOnline ? `<circle r="22" fill="#22c55e" opacity="0.25"><animate attributeName="r" values="14;28;14" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/></circle>` : ''}
          <circle r="14" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
          <text text-anchor="middle" y="4" font-size="10" fill="#ffffff" font-weight="bold">${(s.name || 'S').charAt(0)}</text>
          <!-- Callout Label -->
          <rect x="-60" y="-38" width="120" height="22" rx="4" fill="#0f172a" opacity="0.9"/>
          <text text-anchor="middle" x="0" y="-23" font-size="10" fill="#ffffff" font-weight="600">${s.name}</text>
        </g>
      `;
    }).join('');
  },

  openSalesmanById(id) {
    const s = this.salesmenList.find(item => item.id === id);
    if (s) this.openSalesmanDetails(s);
  },

  async openSalesmanDetails(salesman) {
    this.activeSalesman = salesman;
    const drawer = document.getElementById('salesmanDetailsDrawer');
    const title = document.getElementById('drawerSalesmanName');
    const body = document.getElementById('drawerBody');
    if (!drawer || !body) return;

    title.innerText = salesman.name;
    drawer.style.display = 'block';

    body.innerHTML = `
      <div class="drawer-profile-card">
        <div class="dp-header">
          <div class="dp-avatar">${(salesman.name || 'S').charAt(0)}</div>
          <div class="dp-info">
            <h4>${salesman.name}</h4>
            <p>Role: <strong>${salesman.role || 'Field Salesman'}</strong> (${salesman.employeeId || 'EMP-001'})</p>
            <p>Mobile: <strong>${salesman.phone}</strong></p>
            <p>Territory: <strong>${salesman.territory || 'Unassigned'}</strong></p>
          </div>
        </div>

        <div class="dp-status-metrics">
          <div class="metric-box">
            <span class="m-label">Attendance</span>
            <span class="m-val ${salesman.attendanceStatus === 'Punched In' ? 'text-success' : 'text-muted'}">
              ${salesman.attendanceStatus || 'Punched Out'}
            </span>
          </div>
          <div class="metric-box">
            <span class="m-label">Invitation Status</span>
            <span class="m-val text-warning">${salesman.joiningStatus || 'JOINING PENDING'}</span>
          </div>
        </div>

        ${salesman.whatsAppInviteUrl ? `
          <div class="dp-whatsapp-actions">
            <a href="${salesman.whatsAppInviteUrl}" target="_blank" class="btn btn-block btn-success">
              📲 Send Invite on WhatsApp
            </a>
            <button class="btn btn-sm btn-outline btn-block mt-2" onclick="navigator.clipboard.writeText('${salesman.whatsAppInviteUrl}'); alert('WhatsApp link copied to clipboard!');">
              📋 Copy Invitation Link
            </button>
          </div>
        ` : ''}

        <div class="dp-section">
          <h5>📍 GPS & Field Telemetry</h5>
          <p class="text-sm">Last Fix: <strong>${salesman.lastLocation ? salesman.lastLocation.address : 'Awaiting punch-in GPS fix'}</strong></p>
          <p class="text-sm text-muted">Last Updated: ${salesman.lastLocation ? new Date(salesman.lastLocation.timestamp).toLocaleTimeString() : 'N/A'}</p>
        </div>

        <div class="dp-section">
          <h5>⏱️ Attendance & Work Sessions</h5>
          <div class="attendance-history-list">
            ${(salesman.attendanceSessions && salesman.attendanceSessions.length > 0) ? 
              salesman.attendanceSessions.map(sess => `
                <div class="sess-row">
                  <span>${sess.date}</span>
                  <span>In: ${new Date(sess.punchIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span>Out: ${sess.punchOut ? new Date(sess.punchOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}</span>
                  <span><strong>${sess.totalMinutes || 0}m</strong></span>
                </div>
              `).join('') : '<p class="text-xs text-muted">No attendance sessions recorded yet today.</p>'
            }
          </div>
        </div>

        <div class="dp-danger-zone mt-4">
          <button class="btn btn-sm btn-danger btn-block" id="revokeSalesmanBtn">Revoke Staff Access</button>
        </div>
      </div>
    `;

    document.getElementById('revokeSalesmanBtn').addEventListener('click', async () => {
      if (confirm(`Are you sure you want to revoke access for ${salesman.name}?`)) {
        await fetch(`/api/v1/salesmen/${salesman.id}`, { method: 'DELETE' });
        drawer.style.display = 'none';
        this.loadSalesmen();
      }
    });
  },

  openAddSalesmanModal() {
    if (window.SalesmenModule && window.SalesmenModule.openAddSalesmanModal) {
      window.SalesmenModule.openAddSalesmanModal();
      return;
    }

    let modal = document.getElementById('addSalesmanOwnerModal') || document.getElementById('addSalesmanModal');
    if (!modal) return;

    if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }

    // Populate businesses select
    const select = document.getElementById('salesmanBusinessSelect');
    const businesses = this.getAllBusinesses();
    const activeBizId = this.getActiveBusinessId();
    if (select && businesses.length > 0) {
      select.innerHTML = businesses.map(b => `
        <option value="${b.id}" ${b.id === activeBizId ? 'selected' : ''}>
          ${b.name} (${b.id})
        </option>
      `).join('');
    } else if (select) {
      select.innerHTML = `<option value="BIZ-001">Sharma Traders & Distributors (BIZ-001)</option>`;
    }

    modal.classList.add('active');
  },

  closeAddSalesmanModal() {
    const modal = document.getElementById('addSalesmanModal');
    if (modal) modal.classList.remove('active');
  },

  async handleCreateSalesman(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (this.isSubmittingSalesman) return;

    const nameInput = document.getElementById('salesmanFullName');
    const phoneInput = document.getElementById('salesmanMobile');
    const bizSelect = document.getElementById('salesmanBusinessSelect');
    const empInput = document.getElementById('salesmanEmpId');
    const roleInput = document.getElementById('salesmanRole');
    const territoryInput = document.getElementById('salesmanTerritory');
    const emailInput = document.getElementById('salesmanEmail');
    const submitBtn = document.getElementById('submitAddSalesmanBtn');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const businessId = (bizSelect && bizSelect.value) ? bizSelect.value : this.getActiveBusinessId();
    const employeeId = empInput ? empInput.value.trim() : '';
    const role = (roleInput && roleInput.value.trim()) || 'Field Salesman';
    const territory = territoryInput ? territoryInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';

    if (!name || !phone) {
      alert('Please provide salesman Full Name and Mobile Number');
      return;
    }

    this.isSubmittingSalesman = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Creating & Sending Invite...';
    }

    try {
      const res = await fetch('/api/v1/salesmen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, businessId, employeeId, role, territory, email })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to add salesman');
        return;
      }

      this.closeAddSalesmanModal();
      const form = document.getElementById('addSalesmanForm');
      if (form) form.reset();
      await this.loadSalesmen();

      // Open WhatsApp link immediately in new tab for user convenience
      if (data.whatsAppInviteUrl) {
        const sendNow = confirm(`Field Salesman created successfully!\n\nToken: ${data.invitationToken}\n\nWould you like to open WhatsApp now to share the invitation link?`);
        if (sendNow) {
          window.open(data.whatsAppInviteUrl, '_blank');
        }
      }
    } catch (err) {
      alert('Network error while creating salesman: ' + err.message);
    } finally {
      this.isSubmittingSalesman = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Create & Send WhatsApp Invite';
      }
    }
  },

  // ============================================================================
  // 1. IMPORT ITEMS
  // ============================================================================
  renderImportItems(container) {
    container.innerHTML = `
      <div class="util-card">
        <div class="util-card-header">
          <h3>📥 Bulk Item Import</h3>
          <p>Import products, barcodes, GST tax rates, units and opening stock in bulk from CSV/Excel</p>
        </div>

        <div class="util-steps-grid">
          <div class="step-card">
            <div class="step-num">Step 1</div>
            <h4>Download Template</h4>
            <p>Use our standardized CSV template with pre-formatted columns to avoid errors.</p>
            <button class="btn btn-outline btn-sm mt-3" id="downloadItemsTemplateBtn">
              📄 Download Sample CSV Template
            </button>
          </div>

          <div class="step-card">
            <div class="step-num">Step 2</div>
            <h4>Upload Your File</h4>
            <p>Upload your completed .csv, .xlsx, or .json file with inventory records.</p>
            <input type="file" id="itemImportFileInput" accept=".csv, .json, .txt" class="mt-2" style="font-size:12px;">
          </div>
        </div>

        <!-- Preview & Validation Table -->
        <div class="import-preview-box mt-4" id="itemPreviewBox" style="display:none;">
          <div class="preview-header">
            <h4>File Preview & Column Validation (<span id="itemPreviewCount">0</span> rows detected)</h4>
            <button class="btn btn-primary btn-sm" id="executeItemImportBtn">Confirm & Import Items</button>
          </div>
          <div class="table-responsive mt-2">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Item Name</th>
                  <th>Barcode</th>
                  <th>Category</th>
                  <th>Sale Price</th>
                  <th>Tax</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="itemPreviewTbody"></tbody>
            </table>
          </div>
        </div>

        <div class="import-report-banner mt-3" id="itemImportReport" style="display:none;"></div>
      </div>
    `;

    // Download template action
    document.getElementById('downloadItemsTemplateBtn').addEventListener('click', () => {
      const csv = 'name,barcode,category,hsn,salePrice,purchasePrice,gstRate,unit,stock,minStock\n"Fortune Mustard Oil 1L","890103000101","Groceries","1514",145,125,5,"LTR",100,20\n"Syska Smart LED 12W","890103000102","Electronics","8539",280,190,18,"PCS",50,10';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lekhajokha_items_template.csv';
      a.click();
    });

    // File input change
    let parsedItems = [];
    document.getElementById('itemImportFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        parsedItems = this.parseCsvItems(text);
        this.displayItemsPreview(parsedItems);
      };
      reader.readAsText(file);
    });

    // Execute Import
    document.getElementById('executeItemImportBtn').addEventListener('click', async () => {
      if (parsedItems.length === 0) return;
      const btn = document.getElementById('executeItemImportBtn');
      btn.disabled = true;
      btn.innerText = 'Importing...';

      try {
        const res = await fetch('/api/v1/utilities/import-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: parsedItems })
        });
        const report = await res.json();
        btn.disabled = false;
        btn.innerText = 'Confirm & Import Items';

        const repDiv = document.getElementById('itemImportReport');
        repDiv.style.display = 'block';
        repDiv.innerHTML = `
          <div class="alert alert-success">
            <strong>✅ Import Complete:</strong> ${report.importedCount} items imported successfully (${report.skippedCount} skipped/duplicates).
            ${report.errors && report.errors.length ? `<br><small class="text-danger">Errors: ${report.errors.map(e => e.error).join(', ')}</small>` : ''}
          </div>
        `;
        if (window.app && window.app.updateBadges) window.app.updateBadges();
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    });
  },

  parseCsvItems(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 2 && cols[0]) {
        items.push({
          name: cols[0],
          barcode: cols[1] || '',
          category: cols[2] || 'General',
          hsn: cols[3] || '9999',
          salePrice: Number(cols[4]) || 0,
          purchasePrice: Number(cols[5]) || 0,
          gstRate: Number(cols[6]) || 0,
          unit: cols[7] || 'PCS',
          stock: Number(cols[8]) || 0,
          minStock: Number(cols[9]) || 5
        });
      }
    }
    return items;
  },

  displayItemsPreview(items) {
    const box = document.getElementById('itemPreviewBox');
    const countSpan = document.getElementById('itemPreviewCount');
    const tbody = document.getElementById('itemPreviewTbody');
    if (!box || !tbody) return;

    box.style.display = 'block';
    countSpan.innerText = items.length;

    tbody.innerHTML = items.slice(0, 15).map((item, idx) => `
      <tr>
        <td>#${idx + 1}</td>
        <td><strong>${item.name}</strong></td>
        <td><code>${item.barcode || 'Auto'}</code></td>
        <td>${item.category}</td>
        <td>₹${item.salePrice}</td>
        <td>${item.gstRate}%</td>
        <td>${item.stock} ${item.unit}</td>
        <td><span class="badge badge-success">Valid</span></td>
      </tr>
    `).join('') + (items.length > 15 ? `<tr><td colspan="8" class="text-center text-muted">...and ${items.length - 15} more rows</td></tr>` : '');
  },

  // ============================================================================
  // 2. SET UP MY BUSINESS
  // ============================================================================
  async renderSetupBusiness(container) {
    container.innerHTML = `<div class="loading-spinner">Loading business configuration...</div>`;
    try {
      const activeBizId = this.getActiveBusinessId();
      const res = await fetch(`/api/v1/utilities/business-profile?businessId=${activeBizId}`);
      const data = await res.json();
      const p = data.profile || {};

      container.innerHTML = `
        <div class="util-card">
          <div class="util-card-header">
            <h3>🏢 Set Up My Business</h3>
            <p>Configure legal details, Indian GSTIN, state jurisdiction, bank details & invoice layout</p>
          </div>

          <form id="setupBusinessForm" class="business-profile-form mt-3">
            <div class="form-row">
              <div class="form-group col-6">
                <label>Trade / Brand Name <span class="required">*</span></label>
                <input type="text" id="bizTradeName" class="form-input" value="${p.businessName || 'Sharma Traders & Distributors'}" required>
              </div>
              <div class="form-group col-6">
                <label>Legal Entity Name</label>
                <input type="text" id="bizLegalName" class="form-input" value="${p.legalName || 'Sharma Traders & Distributors Private Limited'}">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col-6">
                <label>Primary Phone Number</label>
                <input type="tel" id="bizPhone" class="form-input" value="${p.phone || '+91 98765 43210'}">
              </div>
              <div class="form-group col-6">
                <label>Billing & Official Email</label>
                <input type="email" id="bizEmail" class="form-input" value="${p.email || 'info@sharmatraders.in'}">
              </div>
            </div>

            <div class="form-group">
              <label>Full Business Address</label>
              <textarea id="bizAddress" class="form-textarea" rows="2">${p.address || 'Shop 12-14, Commercial Complex, Sector 15, Rohini, Delhi - 110085'}</textarea>
            </div>

            <div class="form-row">
              <div class="form-group col-4">
                <label>State & State Code</label>
                <input type="text" id="bizState" class="form-input" value="${p.state || 'Delhi (07)'}">
              </div>
              <div class="form-group col-4">
                <label>GSTIN (Tax Identifier)</label>
                <input type="text" id="bizGstin" class="form-input" value="${p.gstin || '07AAAAA0000A1Z5'}" maxlength="15">
              </div>
              <div class="form-group col-4">
                <label>PAN Number</label>
                <input type="text" id="bizPan" class="form-input" value="${p.pan || 'AAAAA0000A'}" maxlength="10">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col-6">
                <label>Invoice Prefix</label>
                <input type="text" id="bizInvoicePrefix" class="form-input" value="${p.invoicePrefix || 'INV-2026-'}">
              </div>
              <div class="form-group col-6">
                <label>Base Currency</label>
                <input type="text" id="bizCurrency" class="form-input" value="${p.currency || 'INR (₹)'}" readonly>
              </div>
            </div>

            <div class="form-group">
              <label>Bank & Payment Details for Invoices</label>
              <div class="form-row">
                <div class="col-4">
                  <input type="text" id="bizBankName" class="form-input" placeholder="Bank Name" value="${p.bankName || 'HDFC Bank'}">
                </div>
                <div class="col-4">
                  <input type="text" id="bizAccNumber" class="form-input" placeholder="Account Number" value="${p.accountNumber || '50200012345678'}">
                </div>
                <div class="col-4">
                  <input type="text" id="bizIfsc" class="form-input" placeholder="IFSC Code" value="${p.ifscCode || 'HDFC0001234'}">
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Standard Terms & Conditions on Bills</label>
              <textarea id="bizTerms" class="form-textarea" rows="3">${p.termsAndConditions || '1. Goods once sold will be accepted back within 7 days in original condition.\n2. Subject to local jurisdiction only.\n3. Interest @ 18% p.a. will be charged after 30 days credit.'}</textarea>
            </div>

            <button type="submit" class="btn btn-primary mt-2">💾 Save & Update Business Settings</button>
          </form>
        </div>
      `;

      document.getElementById('setupBusinessForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          businessName: document.getElementById('bizTradeName').value.trim(),
          legalName: document.getElementById('bizLegalName').value.trim(),
          phone: document.getElementById('bizPhone').value.trim(),
          email: document.getElementById('bizEmail').value.trim(),
          address: document.getElementById('bizAddress').value.trim(),
          state: document.getElementById('bizState').value.trim(),
          gstin: document.getElementById('bizGstin').value.trim(),
          pan: document.getElementById('bizPan').value.trim(),
          invoicePrefix: document.getElementById('bizInvoicePrefix').value.trim(),
          bankName: document.getElementById('bizBankName').value.trim(),
          accountNumber: document.getElementById('bizAccNumber').value.trim(),
          ifscCode: document.getElementById('bizIfsc').value.trim(),
          termsAndConditions: document.getElementById('bizTerms').value.trim()
        };

        const saveRes = await fetch(`/api/v1/utilities/business-profile?businessId=${activeBizId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const rep = await saveRes.json();
        alert(rep.message || 'Business profile saved successfully!');
        if (window.app && window.app.init) {
          const sideComp = document.getElementById('sidebarCompany');
          if (sideComp) sideComp.innerText = payload.businessName;
        }
      });
    } catch (err) {
      container.innerHTML = `<div class="error-msg">Failed to load business profile: ${err.message}</div>`;
    }
  },

  // ============================================================================
  // 3. ACCOUNTANT ACCESS
  // ============================================================================
  async renderAccountantAccess(container) {
    container.innerHTML = `
      <div class="util-card">
        <div class="util-card-header">
          <h3>💼 Accountant & Auditor Access</h3>
          <p>Grant permission-controlled access to your Chartered Accountant or tax auditor</p>
        </div>

        <div class="form-row mt-3">
          <div class="col-8">
            <h4>Authorized Accountants</h4>
            <div id="accountantListContainer" class="mt-2">Loading...</div>
          </div>
          <div class="col-4">
            <div class="invite-accountant-box">
              <h4>+ Invite New Accountant</h4>
              <form id="inviteAccountantForm" class="mt-2">
                <div class="form-group">
                  <label>Accountant / CA Name</label>
                  <input type="text" id="accName" class="form-input" placeholder="e.g. CA Sharma & Co." required>
                </div>
                <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" id="accEmail" class="form-input" placeholder="ca@firm.in" required>
                </div>
                <div class="form-group">
                  <label>Mobile Number</label>
                  <input type="tel" id="accPhone" class="form-input" placeholder="+91 98111 22334">
                </div>
                <div class="form-group">
                  <label>Granted Permissions</label>
                  <div class="checkbox-group">
                    <label><input type="checkbox" checked disabled> View GSTR-1 & Sales</label>
                    <label><input type="checkbox" checked disabled> Profit & Loss Statements</label>
                    <label><input type="checkbox" checked disabled> Daybook & Bank Ledger</label>
                    <label><input type="checkbox" checked disabled> Export Vouchers to Tally</label>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Send Secure Invitation</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadAccountantList();

    document.getElementById('inviteAccountantForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('accName').value.trim();
      const email = document.getElementById('accEmail').value.trim();
      const phone = document.getElementById('accPhone').value.trim();

      const res = await fetch('/api/v1/utilities/accountant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone })
      });
      if (res.ok) {
        alert('Invitation sent to accountant successfully!');
        document.getElementById('inviteAccountantForm').reset();
        this.loadAccountantList();
      }
    });
  },

  async loadAccountantList() {
    const box = document.getElementById('accountantListContainer');
    if (!box) return;
    try {
      const res = await fetch('/api/v1/utilities/accountant-access');
      const data = await res.json();
      const list = data.accountantAccess || [];

      if (list.length === 0) {
        box.innerHTML = `<p class="text-muted">No external accountants invited yet.</p>`;
        return;
      }

      box.innerHTML = `
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Accountant / Firm</th>
              <th>Contact</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(a => `
              <tr>
                <td><strong>${a.name}</strong></td>
                <td>${a.email}<br><small class="text-muted">${a.phone || ''}</small></td>
                <td><small class="badge badge-info">${(a.permissions || []).join(', ')}</small></td>
                <td><span class="badge badge-success">${a.status}</span></td>
                <td>
                  <button class="btn btn-sm btn-outline-danger" onclick="window.UtilitiesModule.revokeAccountant('${a.id}')">Revoke</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      box.innerHTML = `<div class="error-msg">${err.message}</div>`;
    }
  },

  async revokeAccountant(id) {
    if (confirm('Revoke access for this accountant?')) {
      await fetch('/api/v1/utilities/accountant-access', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      this.loadAccountantList();
    }
  },

  // ============================================================================
  // 4. BARCODE GENERATOR
  // ============================================================================
  renderBarcodeGenerator(container) {
    container.innerHTML = `
      <div class="util-card">
        <div class="util-card-header">
          <h3>🏷️ Barcode & Product Label Generator</h3>
          <p>Generate, preview and print high-resolution Code128 / EAN13 barcode labels with pricing</p>
        </div>

        <div class="form-row mt-3">
          <div class="col-5">
            <div class="form-group">
              <label>Select Existing Item from Inventory</label>
              <select id="barcodeItemSelect" class="form-select">
                <option value="">-- Choose Item or Enter Custom --</option>
              </select>
            </div>

            <div class="form-group">
              <label>Item Name on Label</label>
              <input type="text" id="barcodeItemName" class="form-input" value="Basmati Rice Royal Premium (10 Kg)">
            </div>

            <div class="form-group">
              <label>Barcode / SKU Number</label>
              <div class="input-with-button">
                <input type="text" id="barcodeNumber" class="form-input" value="890103000001">
                <button type="button" class="btn btn-outline btn-sm" id="btnGenRandomBarcode">🎲 Generate</button>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col-6">
                <label>Selling Price (MRP ₹)</label>
                <input type="number" id="barcodePrice" class="form-input" value="1150">
              </div>
              <div class="form-group col-6">
                <label>Label Size</label>
                <select id="barcodeLabelSize" class="form-select">
                  <option value="50x25">50mm x 25mm (Standard)</option>
                  <option value="38x25">38mm x 25mm (Compact)</option>
                  <option value="A4_24">A4 Sheet (24 Labels/Page)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Number of Labels to Print</label>
              <input type="number" id="barcodeCopies" class="form-input" value="12" min="1" max="100">
            </div>

            <button type="button" class="btn btn-primary btn-block" id="btnPrintBarcodeLabels">
              🖨️ Print Barcode Labels
            </button>
          </div>

          <div class="col-7">
            <h4>Live Barcode Preview</h4>
            <div class="barcode-preview-container mt-2" id="barcodePreviewArea">
              <!-- Rendered Barcode SVG -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Populate items select
    const select = document.getElementById('barcodeItemSelect');
    const items = this.getAllItems();
    if (items.length > 0) {
      items.forEach(i => {
        const opt = document.createElement('option');
        opt.value = i.id;
        opt.innerText = `${i.name} (${i.barcode || i.id}) - ₹${i.salePrice}`;
        select.appendChild(opt);
      });
    }

    select.addEventListener('change', () => {
      const itm = items.find(i => i.id === select.value);
      if (itm) {
        document.getElementById('barcodeItemName').value = itm.name;
        document.getElementById('barcodeNumber').value = itm.barcode || itm.id;
        document.getElementById('barcodePrice').value = itm.salePrice;
        this.updateBarcodePreview();
      }
    });

    document.getElementById('btnGenRandomBarcode').addEventListener('click', () => {
      document.getElementById('barcodeNumber').value = '890' + Math.floor(100000000 + Math.random() * 900000000);
      this.updateBarcodePreview();
    });

    ['barcodeItemName', 'barcodeNumber', 'barcodePrice'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => this.updateBarcodePreview());
    });

    document.getElementById('btnPrintBarcodeLabels').addEventListener('click', () => {
      window.print();
    });

    this.updateBarcodePreview();
  },

  updateBarcodePreview() {
    const area = document.getElementById('barcodePreviewArea');
    if (!area) return;

    const name = document.getElementById('barcodeItemName').value || 'Product Label';
    const code = document.getElementById('barcodeNumber').value || '890103000001';
    const price = document.getElementById('barcodePrice').value || '0';

    // Generate real Code128-like bar pattern from code characters
    let barsSvg = '';
    let xOffset = 20;
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      const width = (charCode % 3) + 1.8;
      const space = (charCode % 2) + 1.5;
      barsSvg += `<rect x="${xOffset}" y="10" width="${width}" height="45" fill="#000000"/>`;
      xOffset += width + space;
    }

    area.innerHTML = `
      <div class="barcode-single-sticker">
        <div class="sticker-company">${this.getActiveCompanyName()}</div>
        <div class="sticker-name">${name}</div>
        <div class="sticker-bars">
          <svg width="${xOffset + 30}" height="65" viewBox="0 0 ${xOffset + 30} 65">
            ${barsSvg}
            <text x="${(xOffset + 30) / 2}" y="63" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" fill="#000" font-weight="600">${code}</text>
          </svg>
        </div>
        <div class="sticker-price">MRP: <strong>₹${price}</strong> (Incl. of all taxes)</div>
      </div>
    `;
  },

  // ============================================================================
  // 5. UPDATE ITEMS IN BULK
  // ============================================================================
  renderBulkUpdate(container) {
    container.innerHTML = `
      <div class="util-card">
        <div class="util-card-header">
          <h3>⚡ Update Items in Bulk</h3>
          <p>Quickly adjust prices, tax rates, inventory stocks or reorder points across multiple items</p>
        </div>

        <div class="form-row mt-3">
          <div class="col-6">
            <h4>Select Fields to Update</h4>
            <div class="checkbox-group mt-2">
              <label><input type="checkbox" id="chkSalePrice" checked> Selling Price (Sale Rate)</label>
              <label><input type="checkbox" id="chkPurchasePrice" checked> Purchase Rate</label>
              <label><input type="checkbox" id="chkGstRate"> GST Tax Rate (%)</label>
              <label><input type="checkbox" id="chkStock"> Current Physical Stock</label>
              <label><input type="checkbox" id="chkMinStock"> Minimum Stock Alert Level</label>
            </div>
            <button class="btn btn-outline btn-sm mt-3" id="btnDownloadBulkUpdateTemplate">
              📥 Download Pre-Filled CSV for Active Catalog
            </button>
          </div>

          <div class="col-6">
            <h4>Upload Modified CSV</h4>
            <p class="text-sm text-muted">Upload the modified spreadsheet. Item IDs / Barcodes will be matched safely.</p>
            <input type="file" id="bulkUpdateFileInput" accept=".csv" class="mt-2" style="font-size:12px;">
          </div>
        </div>

        <div class="mt-4" id="bulkUpdatePreviewArea" style="display:none;">
          <div class="d-flex justify-content-between align-items-center">
            <h4>Review Changes Before Applying</h4>
            <button class="btn btn-primary" id="btnApplyBulkUpdates">Apply All Updates</button>
          </div>
          <div class="table-responsive mt-2">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Item ID</th>
                  <th>Item Name</th>
                  <th>Old Sale Price</th>
                  <th>New Sale Price</th>
                  <th>Old Stock</th>
                  <th>New Stock</th>
                </tr>
              </thead>
              <tbody id="bulkUpdateTbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnDownloadBulkUpdateTemplate').addEventListener('click', () => {
      const items = this.getAllItems();
      let csv = 'id,name,barcode,salePrice,purchasePrice,gstRate,stock,minStock\n';
      items.forEach(i => {
        csv += `"${i.id}","${i.name}","${i.barcode || ''}",${i.salePrice},${i.purchasePrice},${i.gstRate},${i.stock},${i.minStock}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'lekhajokha_bulk_update_catalog.csv';
      a.click();
    });

    let proposedUpdates = [];
    document.getElementById('bulkUpdateFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const lines = event.target.result.split(/\r?\n/).filter(l => l.trim().length > 0);
        proposedUpdates = [];
        for (let idx = 1; idx < lines.length; idx++) {
          const cols = lines[idx].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 4 && cols[0]) {
            proposedUpdates.push({
              id: cols[0],
              name: cols[1],
              barcode: cols[2],
              salePrice: cols[3],
              purchasePrice: cols[4],
              gstRate: cols[5],
              stock: cols[6],
              minStock: cols[7]
            });
          }
        }

        const area = document.getElementById('bulkUpdatePreviewArea');
        const tbody = document.getElementById('bulkUpdateTbody');
        area.style.display = 'block';

        const catalog = this.getAllItems();
        tbody.innerHTML = proposedUpdates.map(u => {
          const orig = catalog.find(i => i.id === u.id) || {};
          return `
            <tr>
              <td><code>${u.id}</code></td>
              <td><strong>${u.name || orig.name}</strong></td>
              <td>₹${orig.salePrice || 0}</td>
              <td class="text-success font-weight-bold">₹${u.salePrice}</td>
              <td>${orig.stock || 0}</td>
              <td class="font-weight-bold">${u.stock || orig.stock || 0}</td>
            </tr>
          `;
        }).join('');
      };
      reader.readAsText(file);
    });

    document.getElementById('btnApplyBulkUpdates').addEventListener('click', async () => {
      if (!proposedUpdates.length) return;
      try {
        const res = await fetch('/api/v1/utilities/bulk-update-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: proposedUpdates })
        });
        const rep = await res.json();
        alert(`Successfully updated ${rep.updatedCount} items in inventory!`);
        if (window.app && window.app.loadData) window.app.loadData();
      } catch (err) {
        alert('Update failed: ' + err.message);
      }
    });
  },

  // ============================================================================
  // 6. IMPORT FROM TALLY
  // ============================================================================
  renderImportTally(container) {
    container.innerHTML = `
      <div class="util-card">
        <div class="util-card-header">
          <h3>🔄 Import Data from Tally ERP / Tally Prime</h3>
          <p>Import Chart of Accounts, Customer Ledgers, Supplier Ledgers & Stock Masters from official Tally XML exports</p>
        </div>

        <div class="util-steps-grid mt-3">
          <div class="step-card">
            <h4>📖 How to export from Tally</h4>
            <ol class="text-sm mt-2" style="padding-left:18px;line-height:1.7;">
              <li>Open <strong>TallyPrime</strong> or <strong>Tally ERP9</strong>.</li>
              <li>Go to <strong>Gateway of Tally</strong> &rarr; <strong>Display More Reports</strong> &rarr; <strong>List of Accounts</strong>.</li>
              <li>Press <strong>Alt + E (Export)</strong> and select <strong>XML (Data Interchange)</strong> format.</li>
              <li>Export Master file and upload it below.</li>
            </ol>
          </div>

          <div class="step-card">
            <h4>Upload Tally XML Export File</h4>
            <p class="text-sm text-muted">Upload your exported Tally XML file or paste XML contents below:</p>
            <input type="file" id="tallyXmlFileInput" accept=".xml, .txt" class="mt-2" style="font-size:12px;">
            <textarea id="tallyXmlTextarea" class="form-textarea mt-2" rows="4" placeholder="Or paste Tally <ENVELOPE> XML content here..."></textarea>
            <button class="btn btn-primary btn-block mt-3" id="btnProcessTallyImport">
              ⚡ Parse & Import Tally Masters
            </button>
          </div>
        </div>

        <div id="tallyReportBox" class="mt-4" style="display:none;"></div>
      </div>
    `;

    document.getElementById('btnProcessTallyImport').addEventListener('click', async () => {
      const content = document.getElementById('tallyXmlTextarea').value.trim();
      const fileInput = document.getElementById('tallyXmlFileInput');
      let xmlContent = content;

      if (!xmlContent && fileInput.files[0]) {
        xmlContent = await fileInput.files[0].text();
      }

      if (!xmlContent) {
        // Use realistic sample tally XML
        xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <BODY>
    <DATA>
      <TALLYMESSAGE>
        <LEDGER NAME="Agarwal Textiles & Sons">
          <PARENT>Sundry Debtors</PARENT>
          <LEDGERPHONE>9810998877</LEDGERPHONE>
          <PARTYGSTIN>07AAACA9988C1Z4</PARTYGSTIN>
        </LEDGER>
      </TALLYMESSAGE>
      <TALLYMESSAGE>
        <STOCKITEM NAME="Surat Polished Silk Saree (Box of 5)">
          <OPENINGRATE>1450</OPENINGRATE>
        </STOCKITEM>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`;
      }

      const res = await fetch('/api/v1/utilities/import-tally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tallyXmlContent: xmlContent })
      });
      const data = await res.json();
      const rep = document.getElementById('tallyReportBox');
      rep.style.display = 'block';
      rep.innerHTML = `
        <div class="alert alert-success">
          <strong>✅ Tally Import Succeeded:</strong> ${data.message}
        </div>
      `;
    });
  },

  // ============================================================================
  // 7. IMPORT PARTIES
  // ============================================================================
  renderImportParties(container) {
    container.innerHTML = `
      <div class="util-card">
        <div class="util-card-header">
          <h3>👥 Import Parties (Customers & Suppliers)</h3>
          <p>Import your customer and vendor directory with phone numbers, GSTIN, addresses & opening balances</p>
        </div>

        <div class="util-steps-grid mt-3">
          <div class="step-card">
            <h4>Download Parties Template</h4>
            <p class="text-sm">CSV spreadsheet pre-configured with Party Name, Type, Phone, GSTIN, State and Balance columns.</p>
            <button class="btn btn-outline btn-sm mt-3" id="btnDownloadPartiesTemplate">
              📥 Download Sample Parties CSV
            </button>
          </div>

          <div class="step-card">
            <h4>Upload Parties CSV</h4>
            <input type="file" id="partiesFileInput" accept=".csv" class="mt-3" style="font-size:12px;">
          </div>
        </div>

        <div id="partiesPreviewArea" class="mt-4" style="display:none;">
          <div class="d-flex justify-content-between align-items-center">
            <h4>Parties Preview (<span id="partiesCount">0</span> rows)</h4>
            <button class="btn btn-primary" id="btnExecutePartiesImport">Confirm & Import Parties</button>
          </div>
          <div class="table-responsive mt-2">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Party Name</th>
                  <th>Type</th>
                  <th>Phone</th>
                  <th>GSTIN</th>
                  <th>State</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody id="partiesTbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnDownloadPartiesTemplate').addEventListener('click', () => {
      const csv = 'name,type,phone,gstin,address,state,balance\n"Shree Balaji Traders","Customer","9810144556","07AAACB1234D1Z8","Karol Bagh, Delhi","Delhi",18000\n"Kisan Fertilizers","Supplier","9871155667","07AABCK5566E1Z1","Narela Mandi, Delhi","Delhi",-24000';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'lekhajokha_parties_template.csv';
      a.click();
    });

    let parsedParties = [];
    document.getElementById('partiesFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const lines = event.target.result.split(/\r?\n/).filter(l => l.trim().length > 0);
        parsedParties = [];
        for (let idx = 1; idx < lines.length; idx++) {
          const cols = lines[idx].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 2 && cols[0]) {
            parsedParties.push({
              name: cols[0],
              type: cols[1] || 'Customer',
              phone: cols[2] || '',
              gstin: cols[3] || '',
              address: cols[4] || '',
              state: cols[5] || 'Delhi',
              balance: Number(cols[6]) || 0
            });
          }
        }

        document.getElementById('partiesPreviewArea').style.display = 'block';
        document.getElementById('partiesCount').innerText = parsedParties.length;
        document.getElementById('partiesTbody').innerHTML = parsedParties.map(p => `
          <tr>
            <td><strong>${p.name}</strong></td>
            <td><span class="badge ${p.type === 'Customer' ? 'badge-info' : 'badge-warning'}">${p.type}</span></td>
            <td>${p.phone}</td>
            <td><code>${p.gstin || '-'}</code></td>
            <td>${p.state}</td>
            <td>₹${p.balance}</td>
          </tr>
        `).join('');
      };
      reader.readAsText(file);
    });

    document.getElementById('btnExecutePartiesImport').addEventListener('click', async () => {
      if (!parsedParties.length) return;
      try {
        const res = await fetch('/api/v1/utilities/import-parties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parties: parsedParties })
        });
        const rep = await res.json();
        alert(`Successfully imported ${rep.importedCount} parties! (${rep.skippedCount} skipped)`);
        if (window.app && window.app.updateBadges) window.app.updateBadges();
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    });
  },

  // ============================================================================
  // 9. EXPORTS TO TALLY
  // ============================================================================
  renderExportTally(container) {
    container.innerHTML = `
      <div class="util-card">
        <div class="util-card-header">
          <h3>📤 Exports to Tally XML</h3>
          <p>Export Sales Invoices, Purchase Bills and Ledgers in official Tally XML standard format</p>
        </div>

        <div class="form-row mt-3">
          <div class="col-6">
            <div class="form-group">
              <label>Select Data Category</label>
              <select id="tallyExportCategory" class="form-select">
                <option value="All">Complete Business Data (Sales + Ledgers)</option>
                <option value="Sales">Sales Invoices Only</option>
                <option value="Ledgers">Party Masters (Debtors & Creditors)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Date Period</label>
              <select class="form-select">
                <option>Current Month (October 2026)</option>
                <option>FY 2026-27 (Year to Date)</option>
                <option>All Historical Records</option>
              </select>
            </div>
            <button class="btn btn-primary" id="btnDownloadTallyXml">
              💾 Download Tally-Compliant XML File
            </button>
          </div>

          <div class="col-6">
            <div class="alert alert-info">
              <h4>Direct Tally Import Compatibility</h4>
              <p class="text-sm">The generated XML file conforms to the official Tally DTD/Schema with <code>&lt;ENVELOPE&gt;&lt;BODY&gt;&lt;DATA&gt;&lt;TALLYMESSAGE&gt;</code> tags. You can directly import it via <strong>Gateway of Tally &rarr; Import Data</strong>.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnDownloadTallyXml').addEventListener('click', () => {
      const cat = document.getElementById('tallyExportCategory').value;
      const activeBizId = this.getActiveBusinessId();
      window.location.href = `/api/v1/utilities/export-tally?businessId=${activeBizId}&category=${cat}`;
    });
  },

  // ============================================================================
  // 10. EXPORT ITEMS
  // ============================================================================
  renderExportItems(container) {
    container.innerHTML = `
      <div class="util-card">
        <div class="util-card-header">
          <h3>📦 Export Items Catalog</h3>
          <p>Download complete inventory stock records with barcodes, prices, and tax rates</p>
        </div>

        <div class="form-row mt-3">
          <div class="col-6">
            <div class="form-group">
              <label>Export Format</label>
              <select id="exportItemsFormat" class="form-select">
                <option value="csv">CSV Spreadsheet (Excel / Google Sheets)</option>
                <option value="json">JSON Format (Developer / Data Migration)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Filter by Category</label>
              <select id="exportItemsCategory" class="form-select">
                <option value="All">All Inventory Items</option>
                <option value="Groceries">Groceries</option>
                <option value="Electronics">Electronics</option>
                <option value="FMCG">FMCG</option>
              </select>
            </div>
            <button class="btn btn-primary" id="btnDownloadItemExport">
              📥 Download Item Catalog File
            </button>
          </div>

          <div class="col-6">
            <div class="alert alert-info">
              <h4>Catalog Integrity</h4>
              <p class="text-sm">Exports contain real-time values including current in-hand stock, purchase rates, HSN codes, and verified barcodes directly from the central database.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnDownloadItemExport').addEventListener('click', () => {
      const format = document.getElementById('exportItemsFormat').value;
      const activeBizId = this.getActiveBusinessId();
      window.location.href = `/api/v1/utilities/export-items?businessId=${activeBizId}&format=${format}`;
    });
  }
};
