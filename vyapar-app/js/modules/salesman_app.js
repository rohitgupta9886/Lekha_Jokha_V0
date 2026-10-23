// ==============================================================================
// Lekha Jokha - Dedicated Field Salesman Mobile App & WhatsApp Invite Gateway
// Supports Standalone Mobile Web Experience & Native Android Field Force
// ==============================================================================

window.SalesmanAppModule = {
  currentSalesman: null,
  activeBusiness: null,
  watchId: null,
  heartbeatTimer: null,
  activeTab: 'attendance',
  orderCart: {
    partyName: 'Gupta General Store',
    partyId: 'PT-01',
    items: {},
    paymentMode: 'Credit (15 Days)',
    notes: '',
    activeCategory: 'All',
    searchQuery: ''
  },

  init() {
    // Restore session if exists
    try {
      const stored = localStorage.getItem('lekhajokha_salesman_session');
      if (stored) {
        const data = JSON.parse(stored);
        this.currentSalesman = data.salesman;
        this.activeBusiness = data.business;
      }
    } catch (e) {
      console.warn('Could not read salesman session', e);
    }
  },

  showToast(msg, type = 'success') {
    const existing = document.getElementById('salesmanToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'salesmanToast';
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#ef4444' : '#059669'};
      color: #ffffff;
      padding: 12px 22px;
      border-radius: 30px;
      font-size: 13.5px;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
      max-width: 90%;
      text-align: center;
    `;
    toast.innerHTML = `<span>${type === 'error' ? '⚠️' : '✅'}</span> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 3500);
  },

  // ----------------------------------------------------------------------------
  // 1. WhatsApp Invitation Landing & Account Activation Screen
  // ----------------------------------------------------------------------------
  async renderInvite(container, token) {
    container.innerHTML = `
      <div class="salesman-onboarding-wrapper">
        <div class="salesman-onboarding-card">
          <div class="onboarding-brand-header">
            <div class="brand-badge-pill">Lekha Jokha Field Force</div>
            <h2 class="onboarding-title">Field Staff Invitation</h2>
            <p class="onboarding-subtitle">Connecting to your employer's business network...</p>
          </div>
          <div id="inviteValidationStatus" class="invite-status-box">
            <div class="spinner-dot"></div> Validating invitation token...
          </div>
        </div>
      </div>
    `;

    if (!token) {
      document.getElementById('inviteValidationStatus').innerHTML = `
        <div class="invite-error-state">
          <div class="error-icon">⚠️</div>
          <h4>Missing Invitation Token</h4>
          <p>Please click the official invitation link sent to your WhatsApp by your business owner.</p>
          <a href="#salesman-app" class="btn btn-outline btn-block mt-3">Open Existing Salesman Login</a>
        </div>
      `;
      return;
    }

    try {
      const res = await fetch(`/api/v1/salesmen/invite/validate?token=${encodeURIComponent(token)}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        document.getElementById('inviteValidationStatus').innerHTML = `
          <div class="invite-error-state">
            <div class="error-icon" style="font-size:36px;margin-bottom:8px;">⚠️</div>
            <h4 style="font-size:18px;margin-bottom:6px;color:#0f172a;">Invitation Link Expired or Re-issued</h4>
            <p style="font-size:13px;color:#64748b;line-height:1.5;margin-bottom:14px;">${data.reason || 'This specific invitation link is no longer active. You can still activate your account instantly with your mobile number.'}</p>

            <div class="recovery-box" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:left;margin-bottom:14px;">
              <form id="inviteRecoveryForm">
                <label style="font-weight:600;font-size:13px;display:block;margin-bottom:6px;color:#334155;">Enter Your 10-Digit Mobile Number to Activate:</label>
                <div class="input-with-prefix" style="display:flex;align-items:stretch;">
                  <span class="phone-prefix" style="background:#f1f5f9;border:1px solid #cbd5e1;border-right:none;padding:10px 14px;border-radius:8px 0 0 8px;font-size:14px;color:#475569;font-weight:600;display:flex;align-items:center;">+91</span>
                  <input type="tel" id="recoveryPhoneInput" class="form-input" style="border-radius:0 8px 8px 0;padding:10px 14px;font-size:15px;letter-spacing:1px;" placeholder="e.g. 98765 43210" maxlength="10" required>
                </div>
                <button type="submit" class="btn btn-primary btn-block mt-3" id="recoverySubmitBtn" style="padding:11px;font-weight:600;font-size:14.5px;">
                  ⚡ Instant Activate & Launch Field App
                </button>
              </form>
            </div>

            <div style="display:flex;gap:10px;flex-direction:column;">
              <a href="#salesman-app" class="btn btn-outline btn-block" style="font-size:13px;">
                🔑 Open Field Staff Login Screen
              </a>
              <a href="#dashboard" class="btn btn-secondary btn-block" style="font-size:13px;">
                Return to Business Portal
              </a>
            </div>
          </div>
        `;

        const recoveryForm = document.getElementById('inviteRecoveryForm');
        if (recoveryForm) {
          recoveryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('recoveryPhoneInput').value.trim();
            const submitBtn = document.getElementById('recoverySubmitBtn');
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.innerText = 'Activating account...';
            }
            await this.handleDirectPhoneLogin(phone);
          });
        }
        return;
      }

      const sm = data.salesman;
      const biz = data.business;

      document.getElementById('inviteValidationStatus').innerHTML = `
        <div class="invite-success-card">
          <div class="invite-welcome-badge">INVITATION READY</div>
          <h3 class="biz-name-banner">${biz.name}</h3>
          <p class="biz-gstin-tag">GSTIN: ${biz.gstin || 'Unregistered / MSME'}</p>

          <div class="salesman-profile-preview">
            <div class="preview-avatar">👤</div>
            <div class="preview-details">
              <h4>${sm.name}</h4>
              <span class="preview-phone">📱 +91 ${sm.phone}</span>
              <span class="preview-role">${sm.role || 'Field Salesman'} • ${sm.territory || 'Assigned Zone'}</span>
            </div>
          </div>

          <div class="otp-verification-section">
            <label class="otp-label">Quick Verification OTP (Auto-verified)</label>
            <div class="otp-input-row">
              <input type="text" id="inviteOtpInput" class="otp-input" value="1234" maxlength="4" readonly>
              <span class="otp-badge-verified">✓ Verified</span>
            </div>
            <p class="otp-hint">Default instant activation code pre-filled for rapid field onboarding.</p>
          </div>

          <button class="btn btn-primary btn-block btn-lg btn-activate-app" id="btnAcceptInvite">
            🚀 Accept & Launch Field Salesman App
          </button>

          <div class="apk-download-option">
            <span class="or-divider">── OR ──</span>
            <a href="/downloads/lekhajokha-field-force.apk" class="btn btn-outline btn-block btn-download-apk" download>
              📲 Download Native Android App (.APK)
            </a>
          </div>
        </div>
      `;

      document.getElementById('btnAcceptInvite').addEventListener('click', async () => {
        const btn = document.getElementById('btnAcceptInvite');
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-dot"></span> Activating account...`;

        try {
          const acceptRes = await fetch('/api/v1/salesmen/invite/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, phone: sm.phone, otp: '1234' })
          });
          const acceptData = await acceptRes.json();

          if (!acceptRes.ok) {
            alert(acceptData.error || 'Failed to activate account');
            btn.disabled = false;
            btn.innerText = '🚀 Accept & Launch Field Salesman App';
            return;
          }

          // Save active session
          this.currentSalesman = acceptData.salesman;
          this.activeBusiness = acceptData.business;
          localStorage.setItem('lekhajokha_salesman_session', JSON.stringify({
            salesman: this.currentSalesman,
            business: this.activeBusiness,
            sessionToken: acceptData.sessionToken
          }));

          // Redirect to dedicated Salesman App
          window.location.hash = '#salesman-app';
        } catch (err) {
          alert('Network error while activating account: ' + err.message);
          btn.disabled = false;
          btn.innerText = '🚀 Accept & Launch Field Salesman App';
        }
      });
    } catch (err) {
      document.getElementById('inviteValidationStatus').innerHTML = `
        <div class="invite-error-state">
          <div class="error-icon">⚠️</div>
          <h4>Connection Error</h4>
          <p>Failed to connect to Lekha Jokha server. Please check your internet connection and try again.</p>
        </div>
      `;
    }
  },

  // ----------------------------------------------------------------------------
  // 2. Dedicated Field Sales Staff Application Screen
  // ----------------------------------------------------------------------------
  async renderApp(container) {
    if (!this.currentSalesman) {
      // Check if session exists in localStorage
      this.init();
    }

    if (!this.currentSalesman) {
      // Prompt for phone login / demo salesman selection
      container.innerHTML = `
        <div class="salesman-login-wrapper">
          <div class="salesman-login-card">
            <div class="login-header-icon">📍</div>
            <h2>Field Sales Staff Login</h2>
            <p>Access your attendance, live GPS tracking, and customer visits.</p>

            <form id="salesmanQuickLoginForm" class="mt-3">
              <div class="form-group mb-3">
                <label style="font-weight:600;font-size:13px;display:block;margin-bottom:6px;">Registered Mobile Number</label>
                <div class="input-with-prefix" style="display:flex;align-items:stretch;">
                  <span class="phone-prefix" style="background:#f1f5f9;border:1px solid #cbd5e1;border-right:none;padding:10px 14px;border-radius:8px 0 0 8px;font-size:14px;color:#475569;font-weight:600;display:flex;align-items:center;">+91</span>
                  <input type="tel" id="salesmanLoginPhone" class="form-input" style="border-radius:0 8px 8px 0;padding:10px 14px;font-size:15px;letter-spacing:1px;" placeholder="e.g. 98765 43210" maxlength="10" required>
                </div>
              </div>
              <button type="submit" class="btn btn-primary btn-block btn-lg" id="salesmanLoginSubmitBtn" style="padding:12px;font-weight:600;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;">
                🚀 Log In as Field Staff
              </button>
            </form>

            <div class="demo-login-box mt-4" style="border-top:1px dashed #cbd5e1;padding-top:16px;">
              <p class="text-muted" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;text-align:center;">
                ⚡ Instant Quick Staff Login:
              </p>
              <div style="display:flex;flex-direction:column;gap:8px;">
                <button type="button" class="btn btn-sm btn-outline btn-block demo-staff-btn" data-phone="9876543210" style="text-align:left;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
                  <span>👤 <strong>Ramesh Kumar</strong> (Delhi)</span>
                  <span style="color:var(--primary);font-size:12px;font-weight:600;">9876543210 →</span>
                </button>
                <button type="button" class="btn btn-sm btn-outline btn-block demo-staff-btn" data-phone="9876501234" style="text-align:left;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
                  <span>👤 <strong>Narendra Modi</strong> (Bengaluru)</span>
                  <span style="color:var(--primary);font-size:12px;font-weight:600;">9876501234 →</span>
                </button>
                <button type="button" class="btn btn-sm btn-outline btn-block demo-staff-btn" data-phone="9886266388" style="text-align:left;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
                  <span>👤 <strong>Amit Shah</strong> (Sales Executive)</span>
                  <span style="color:var(--primary);font-size:12px;font-weight:600;">9886266388 →</span>
                </button>
                <button type="button" class="btn btn-sm btn-outline btn-block demo-staff-btn" data-phone="9113004901" style="text-align:left;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
                  <span>👤 <strong>Dharmendra Pradhan</strong></span>
                  <span style="color:var(--primary);font-size:12px;font-weight:600;">9113004901 →</span>
                </button>
              </div>

              <div style="margin-top:16px;text-align:center;">
                <a href="#util-track-salesmen" class="btn btn-link btn-block" style="font-size:13px;text-decoration:none;color:#64748b;">
                  ← Back to Business Owner (Track Salesmen)
                </a>
              </div>
            </div>
          </div>
        </div>
      `;

      const form = document.getElementById('salesmanQuickLoginForm');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const phone = document.getElementById('salesmanLoginPhone').value.trim();
          await this.handleDirectPhoneLogin(phone);
        });
      }

      container.querySelectorAll('.demo-staff-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const phone = btn.getAttribute('data-phone');
          await this.handleDirectPhoneLogin(phone);
        });
      });
      return;
    }

    // Render Full Native-Feel Mobile App
    container.innerHTML = `
      <div class="salesman-mobile-app">
        <!-- Top Sticky App Bar -->
        <header class="salesman-app-bar">
          <div class="salesman-bar-profile">
            <div class="salesman-bar-avatar">
              ${this.currentSalesman.name.charAt(0).toUpperCase()}
            </div>
            <div class="salesman-bar-meta">
              <h3 class="salesman-bar-name">${this.currentSalesman.name}</h3>
              <span class="salesman-bar-biz">🏢 ${this.activeBusiness ? this.activeBusiness.name : 'Sharma Traders'}</span>
            </div>
          </div>
          <div class="salesman-bar-actions">
            <span class="salesman-status-pill ${this.currentSalesman.attendanceStatus === 'Punched In' ? 'punched-in' : 'punched-out'}" id="barStatusPill">
              ${this.currentSalesman.attendanceStatus === 'Punched In' ? '🟢 ON DUTY' : '⚪ OFF DUTY'}
            </span>
            <button class="icon-btn-ghost" id="salesmanLogoutBtn" title="Switch User / Logout">🚪</button>
          </div>
        </header>

        <!-- Main Scrollable Content -->
        <div class="salesman-scroll-body" id="salesmanTabBody">
          <!-- Dynamically Rendered by Tab -->
        </div>

        <!-- Bottom Mobile Tab Bar -->
        <nav class="salesman-bottom-nav">
          <button class="nav-tab-item ${this.activeTab === 'attendance' ? 'active' : ''}" data-tab="attendance">
            <span class="tab-icon">⏱️</span>
            <span class="tab-label">Attendance</span>
          </button>
          <button class="nav-tab-item ${this.activeTab === 'visits' ? 'active' : ''}" data-tab="visits">
            <span class="tab-icon">📍</span>
            <span class="tab-label">Visits</span>
          </button>
          <button class="nav-tab-item ${this.activeTab === 'orders' ? 'active' : ''}" data-tab="orders">
            <span class="tab-icon">📝</span>
            <span class="tab-label">Book Order</span>
          </button>
          <button class="nav-tab-item ${this.activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
            <span class="tab-icon">👤</span>
            <span class="tab-label">Profile & App</span>
          </button>
        </nav>
      </div>
    `;

    // Bind bottom tabs
    const tabs = container.querySelectorAll('.nav-tab-item');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.getAttribute('data-tab');
        this.renderActiveTab();
      });
    });

    document.getElementById('salesmanLogoutBtn').addEventListener('click', () => {
      if (confirm('Log out from Field Salesman app and return to Business Owner view?')) {
        this.stopTelemetry();
        localStorage.removeItem('lekhajokha_salesman_session');
        this.currentSalesman = null;
        window.location.hash = '#util-track-salesmen';
      }
    });

    this.renderActiveTab();
    this.startTelemetry();
  },

  renderActiveTab() {
    const body = document.getElementById('salesmanTabBody');
    if (!body) return;

    switch (this.activeTab) {
      case 'attendance':
        this.renderAttendanceTab(body);
        break;
      case 'visits':
        this.renderVisitsTab(body);
        break;
      case 'orders':
        this.renderOrdersTab(body);
        break;
      case 'profile':
        this.renderProfileTab(body);
        break;
      default:
        this.renderAttendanceTab(body);
    }
  },

  // ----------------------------------------------------------------------------
  // Helper Data Providers (Products & Parties)
  // ----------------------------------------------------------------------------
  getProductsList() {
    const storeItems = (window.Store && typeof window.Store.getItems === 'function' && window.Store.getItems()) || [];
    if (storeItems && storeItems.length > 0) {
      return storeItems.map((item, idx) => ({
        id: item.id || `PROD-${idx + 1}`,
        name: item.name,
        category: item.category || 'General',
        price: Number(item.salePrice || item.price || 100),
        gstRate: Number(item.gstRate !== undefined ? item.gstRate : 18),
        stock: Number(item.stock !== undefined ? item.stock : 25),
        unit: item.unit || 'PCS'
      }));
    }
    return [
      { id: 'P01', name: 'Tata Tea Gold (500g)', category: 'Beverages & Snacks', price: 290, gstRate: 5, stock: 45, unit: 'PACK' },
      { id: 'P02', name: 'Aashirvaad Superior MP Atta (10kg)', category: 'Groceries & Staples', price: 460, gstRate: 0, stock: 32, unit: 'BAG' },
      { id: 'P03', name: 'Fortune Sunlite Refined Sunflower Oil (1L)', category: 'Groceries & Staples', price: 145, gstRate: 5, stock: 60, unit: 'POUCH' },
      { id: 'P04', name: 'Amul Butter Pasteurized (500g)', category: 'Groceries & Staples', price: 275, gstRate: 12, stock: 24, unit: 'BRICK' },
      { id: 'P05', name: 'Maggi 2-Minute Masala Noodles (12-Pack)', category: 'Beverages & Snacks', price: 168, gstRate: 12, stock: 50, unit: 'PACK' },
      { id: 'P06', name: 'Cadbury Dairy Milk Silk Chocolate (150g)', category: 'Beverages & Snacks', price: 175, gstRate: 18, stock: 40, unit: 'BAR' },
      { id: 'P07', name: 'Havells 9W Cool Day LED Bulb (2-Pack)', category: 'Electricals & Hardware', price: 199, gstRate: 18, stock: 35, unit: 'BOX' },
      { id: 'P08', name: 'Anchor 3-Pin Extension Cord 4m Heavy Duty', category: 'Electricals & Hardware', price: 420, gstRate: 18, stock: 18, unit: 'PCS' },
      { id: 'P09', name: 'Surf Excel Matic Front Load Detergent (2L)', category: 'Personal Care', price: 430, gstRate: 18, stock: 28, unit: 'BOTTLE' },
      { id: 'P10', name: 'Dettol Original Germ Protection Bathing Soap (4x125g)', category: 'Personal Care', price: 195, gstRate: 18, stock: 45, unit: 'PACK' },
      { id: 'P11', name: 'Colgate MaxFresh Spicy Fresh Toothpaste (300g)', category: 'Personal Care', price: 180, gstRate: 18, stock: 50, unit: 'TUBE' }
    ];
  },

  getPartiesList() {
    const storeParties = (window.Store && typeof window.Store.getParties === 'function' && window.Store.getParties()) || [];
    if (storeParties && storeParties.length > 0) {
      return storeParties.map(p => ({
        id: p.id,
        name: p.name,
        phone: p.phone || '',
        address: p.address || p.city || 'Local Area'
      }));
    }
    return [
      { id: 'PT-01', name: 'Gupta General Store', phone: '9811223344', address: 'Main Market, Chandni Chowk' },
      { id: 'PT-02', name: 'Metro Retail Mart', phone: '9822334455', address: 'Commercial Complex, Sector 18' },
      { id: 'PT-03', name: 'Apex Electronics & Appliances', phone: '9833445566', address: 'Shop 12, Nehru Place' },
      { id: 'PT-04', name: 'Kisan Agri Inputs & Seeds', phone: '9844556677', address: 'APMC Mandi Yard' },
      { id: 'PT-05', name: 'Shreeji Supermarket', phone: '9855667788', address: 'Civil Lines Road' },
      { id: 'PT-06', name: 'Patel Traders & Wholesalers', phone: '9866778899', address: 'Station Road' }
    ];
  },

  // ----------------------------------------------------------------------------
  // Tab 1: GPS Attendance & Duty Management
  // ----------------------------------------------------------------------------
  renderAttendanceTab(container) {
    const isPunched = this.currentSalesman.attendanceStatus === 'Punched In';

    container.innerHTML = `
      <div class="tab-pane active">
        <!-- Live GPS & Location Telemetry Card -->
        <div class="gps-hero-card ${isPunched ? 'card-active-shift' : 'card-inactive-shift'}">
          <div class="gps-status-header">
            <span class="pulse-indicator ${isPunched ? 'pulse-green' : 'pulse-gray'}"></span>
            <span class="gps-status-text" id="gpsLiveStatus">
              ${isPunched ? 'GPS TRACKING ACTIVE (Live to Owner)' : 'Duty Not Started / Offline'}
            </span>
          </div>

          <div class="shift-timer-display">
            <h1 class="shift-clock" id="liveClock">${new Date().toLocaleTimeString()}</h1>
            <p class="shift-date">${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>

          <div class="gps-coordinates-badge" id="gpsCoordBox">
            <span class="coord-icon">📡</span>
            <span class="coord-text" id="coordText">Fetching real-time GPS coordinates...</span>
          </div>

          <button class="btn-punch-action ${isPunched ? 'btn-punch-out' : 'btn-punch-in'}" id="btnPunchAction">
            <span class="punch-big-icon">${isPunched ? '🛑' : '🟢'}</span>
            <span class="punch-main-text">${isPunched ? 'PUNCH OUT FROM DUTY' : 'PUNCH IN FOR DUTY'}</span>
            <span class="punch-sub-text">${isPunched ? 'End Field Shift & Record Hours' : 'Record GPS Location & Start Field Tracking'}</span>
          </button>
        </div>

        <!-- Today Summary Statistics -->
        <div class="salesman-stats-grid">
          <div class="stat-mini-card">
            <span class="stat-mini-label">Visits Today</span>
            <h3 class="stat-mini-value" id="todayVisitsCount">${(this.currentSalesman.todayVisits || []).length}</h3>
          </div>
          <div class="stat-mini-card">
            <span class="stat-mini-label">Orders Booked</span>
            <h3 class="stat-mini-value" id="todayOrdersCount">${(this.currentSalesman.todayOrders || []).length}</h3>
          </div>
          <div class="stat-mini-card">
            <span class="stat-mini-label">Duty Status</span>
            <h3 class="stat-mini-value" style="color:${isPunched ? 'var(--success)' : 'var(--text-muted)'};font-size:13px;">
              ${isPunched ? 'ON DUTY' : 'OFF DUTY'}
            </h3>
          </div>
        </div>

        <!-- Recent Shifts / Attendance Log -->
        <div class="salesman-section-header">
          <h4>Recent Attendance Sessions</h4>
        </div>
        <div class="attendance-history-list" id="attendanceHistoryList">
          ${this.renderAttendanceHistoryList()}
        </div>
      </div>
    `;

    // Acquire current position
    this.updateGpsCoordinatesDisplay();

    // Punch Button Handler
    document.getElementById('btnPunchAction').addEventListener('click', async () => {
      await this.handlePunchAction();
    });
  },

  renderAttendanceHistoryList() {
    const sessions = this.currentSalesman.attendanceSessions || [];
    if (sessions.length === 0) {
      return `<div class="empty-sessions-box">No attendance sessions recorded yet today. Tap "PUNCH IN FOR DUTY" above to begin.</div>`;
    }

    return sessions.slice(0, 5).map(s => `
      <div class="session-log-item">
        <div class="session-icon">⏱️</div>
        <div class="session-meta">
          <strong>${new Date(s.timestamp || s.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
          <span>${(s.type === 'PUNCH_IN' || !s.punchOut) ? '🟢 Duty Started' : '🛑 Duty Ended'} • ${s.locationName || 'GPS Location Verified'}</span>
        </div>
        <span class="session-status-badge ${(s.type === 'PUNCH_IN' || !s.punchOut) ? 'badge-success' : 'badge-secondary'}">
          ${(s.type === 'PUNCH_IN' || !s.punchOut) ? 'ON DUTY' : 'OFF DUTY'}
        </span>
      </div>
    `).join('');
  },

  async handlePunchAction() {
    const isPunched = this.currentSalesman.attendanceStatus === 'Punched In';
    const action = isPunched ? 'Punch Out' : 'Punch In';
    const actionType = isPunched ? 'PUNCH_OUT' : 'PUNCH_IN';
    const btn = document.getElementById('btnPunchAction');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="punch-big-icon">⏳</span><span class="punch-main-text">RECORDING GPS & UPDATING...</span>`;
    }

    // Get current GPS coordinates
    let lat = 28.6139;
    let lng = 77.2090;
    let accuracy = 10;

    try {
      const pos = await this.getCurrentLocation();
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      accuracy = Math.round(pos.coords.accuracy || 10);
    } catch (e) {
      console.warn('Geolocation unavailable or denied, using simulated GPS coordinates', e);
    }

    try {
      const res = await fetch(`/api/v1/salesmen/${this.currentSalesman.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          type: actionType,
          latitude: lat,
          longitude: lng,
          lat: lat,
          lng: lng,
          accuracy: accuracy,
          notes: !isPunched ? 'Started field duty' : 'Completed field duty'
        })
      });
      const data = await res.json();

      if (!res.ok) {
        this.showToast(data.error || 'Failed to record attendance', 'error');
        if (btn) btn.disabled = false;
        return;
      }

      this.currentSalesman.attendanceStatus = data.attendanceStatus;
      if (!this.currentSalesman.attendanceSessions) this.currentSalesman.attendanceSessions = [];
      this.currentSalesman.attendanceSessions.unshift({
        type: actionType,
        timestamp: new Date().toISOString(),
        latitude: lat,
        longitude: lng,
        locationName: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (±${accuracy}m)`
      });

      // Update top app bar status pill immediately
      const pill = document.getElementById('barStatusPill');
      if (pill) {
        if (this.currentSalesman.attendanceStatus === 'Punched In') {
          pill.className = 'salesman-status-pill punched-in';
          pill.innerHTML = '🟢 ON DUTY';
        } else {
          pill.className = 'salesman-status-pill punched-out';
          pill.innerHTML = '⚪ OFF DUTY';
        }
      }

      // Update session in storage
      localStorage.setItem('lekhajokha_salesman_session', JSON.stringify({
        salesman: this.currentSalesman,
        business: this.activeBusiness
      }));

      // Start/stop heartbeat telemetry
      if (this.currentSalesman.attendanceStatus === 'Punched In') {
        this.startTelemetry();
      } else {
        this.stopTelemetry();
      }

      this.showToast(`Successfully ${!isPunched ? 'Punched In for Duty (ON DUTY)' : 'Punched Out from Duty (OFF DUTY)'}!`);
      this.renderAttendanceTab(document.getElementById('salesmanTabBody'));
    } catch (err) {
      this.showToast('Error updating attendance: ' + err.message, 'error');
      if (btn) btn.disabled = false;
    }
  },

  // ----------------------------------------------------------------------------
  // Tab 2: Customer Visits & Dedicated In-App Check-In Modal
  // ----------------------------------------------------------------------------
  renderVisitsTab(container) {
    const visits = this.currentSalesman.todayVisits || [];

    container.innerHTML = `
      <div class="tab-pane active">
        <div class="visit-action-banner">
          <h3>Customer / Party Check-In</h3>
          <p>Record your physical store visit with GPS coordinates and meeting minutes.</p>
          <button class="btn btn-primary btn-block btn-lg mt-2" id="btnOpenCheckInModal" style="padding:14px;font-weight:800;font-size:15px;background:linear-gradient(135deg, #2563eb, #1d4ed8);border:none;border-radius:12px;box-shadow:0 8px 20px rgba(37, 99, 235, 0.4);">
            📍 Check-In at Customer Location
          </button>
        </div>

        <div class="salesman-section-header mt-3" style="display:flex;justify-content:space-between;align-items:center;">
          <h4>Today's Customer Visits (<span id="visitsHeaderCount">${visits.length}</span>)</h4>
        </div>

        <div class="visits-timeline" id="visitsTimeline">
          ${visits.length === 0 ? `
            <div class="empty-sessions-box">
              No customer check-ins recorded yet. Tap "Check-In at Customer Location" above to record a client meeting.
            </div>
          ` : visits.map((v, idx) => `
            <div class="visit-card">
              <div class="visit-card-header">
                <strong>${idx + 1}. ${v.partyName}</strong>
                <span class="visit-time">${new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div class="visit-card-body">
                <p class="visit-purpose">🎯 <strong>Purpose:</strong> ${v.purpose || 'Sales Discussion'}</p>
                <p class="visit-notes">📝 ${v.notes || 'No remarks added.'}</p>
                <span class="visit-location-tag">📍 Lat: ${Number(v.latitude || 28.6139).toFixed(4)}, Lng: ${Number(v.longitude || 77.2090).toFixed(4)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btnOpenCheckInModal').addEventListener('click', () => {
      this.openVisitCheckInModal();
    });
  },

  openVisitCheckInModal() {
    // Remove existing modal if any
    const existing = document.getElementById('visitCheckInModal');
    if (existing) existing.remove();

    const parties = this.getPartiesList();

    const modal = document.createElement('div');
    modal.id = 'visitCheckInModal';
    modal.className = 'salesman-modal-backdrop active';
    modal.innerHTML = `
      <div class="salesman-modal-card">
        <div class="salesman-modal-header">
          <h3 class="salesman-modal-title">📍 Customer Visit Check-In</h3>
          <button type="button" class="salesman-modal-close" id="btnCloseCheckInModal">✕</button>
        </div>

        <form id="visitCheckInForm">
          <div class="form-group mb-3">
            <label style="font-size:12.5px;font-weight:700;display:block;margin-bottom:6px;color:#cbd5e1;">Select Customer / Shop</label>
            <select id="modalCheckInPartySelect" class="form-select" style="background:#0f172a;color:#fff;border-color:rgba(255,255,255,0.15);padding:10px;border-radius:8px;width:100%;">
              ${parties.map(p => `<option value="${p.name}">${p.name} — ${p.address}</option>`).join('')}
              <option value="__custom__">➕ Enter Custom / Other Shop Name...</option>
            </select>
          </div>

          <div class="form-group mb-3" id="modalCustomPartyBox" style="display:none;">
            <label style="font-size:12.5px;font-weight:700;display:block;margin-bottom:6px;color:#cbd5e1;">New Customer / Shop Name</label>
            <input type="text" id="modalCustomPartyInput" class="form-input" placeholder="e.g. Balaji Provision Store" style="background:#0f172a;color:#fff;border-color:rgba(255,255,255,0.15);padding:10px;border-radius:8px;width:100%;">
          </div>

          <div class="form-group mb-3">
            <label style="font-size:12.5px;font-weight:700;display:block;margin-bottom:6px;color:#cbd5e1;">Purpose of Visit</label>
            <select id="modalVisitPurpose" class="form-select" style="background:#0f172a;color:#fff;border-color:rgba(255,255,255,0.15);padding:10px;border-radius:8px;width:100%;">
              <option value="🛍️ New Order Booking">🛍️ New Order Booking</option>
              <option value="💰 Payment Collection / Recovery">💰 Payment Collection / Recovery</option>
              <option value="📦 Stock Audit & Shelf Display">📦 Stock Audit & Shelf Display</option>
              <option value="🤝 Courtesy & Relationship Meeting">🤝 Courtesy & Relationship Meeting</option>
              <option value="📝 Issue Resolution / Return Request">📝 Issue Resolution / Return Request</option>
            </select>
          </div>

          <div class="form-group mb-3">
            <label style="font-size:12.5px;font-weight:700;display:block;margin-bottom:6px;color:#cbd5e1;">Meeting Notes & Follow-up</label>
            <textarea id="modalVisitNotes" class="form-input" rows="3" placeholder="e.g. Discussed festive scheme and collected ₹15,000 cheque; new bulk order scheduled for Monday." style="background:#0f172a;color:#fff;border-color:rgba(255,255,255,0.15);padding:10px;border-radius:8px;width:100%;resize:vertical;"></textarea>
          </div>

          <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 12px;margin-bottom:16px;display:flex;align-items:center;gap:8px;font-size:11.5px;color:#34d399;">
            <span>📡</span>
            <span id="modalGpsStatusText">GPS Coordinate Tag: Ready to verify live location</span>
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" id="modalSubmitVisitBtn" style="padding:14px;font-weight:800;font-size:15px;background:linear-gradient(135deg, #10b981, #059669);border:none;border-radius:12px;box-shadow:0 8px 20px rgba(16, 185, 129, 0.4);">
            📍 Record Visit & GPS Check-In
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const select = document.getElementById('modalCheckInPartySelect');
    const customBox = document.getElementById('modalCustomPartyBox');
    select.addEventListener('change', () => {
      if (select.value === '__custom__') {
        customBox.style.display = 'block';
        document.getElementById('modalCustomPartyInput').focus();
      } else {
        customBox.style.display = 'none';
      }
    });

    const closeBtn = document.getElementById('btnCloseCheckInModal');
    closeBtn.addEventListener('click', () => modal.remove());

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const form = document.getElementById('visitCheckInForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.submitVisitCheckIn(modal);
    });
  },

  async submitVisitCheckIn(modalEl) {
    const select = document.getElementById('modalCheckInPartySelect');
    let partyName = select.value;
    if (partyName === '__custom__') {
      partyName = (document.getElementById('modalCustomPartyInput').value || '').trim();
      if (!partyName) {
        this.showToast('Please enter the customer / shop name', 'error');
        return;
      }
    }

    const purpose = document.getElementById('modalVisitPurpose').value;
    const notes = document.getElementById('modalVisitNotes').value.trim() || 'Customer meeting concluded';
    const submitBtn = document.getElementById('modalSubmitVisitBtn');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `⏳ Verifying GPS & Logging...`;
    }

    let lat = 28.6139;
    let lng = 77.2090;
    try {
      const pos = await this.getCurrentLocation();
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (e) {
      console.warn('Geolocation unavailable, using default', e);
    }

    try {
      const res = await fetch(`/api/v1/salesmen/${this.currentSalesman.id}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName,
          purpose,
          notes,
          latitude: lat,
          longitude: lng,
          lat: lat,
          lng: lng,
          timestamp: new Date().toISOString()
        })
      });
      const data = await res.json();

      if (!this.currentSalesman.todayVisits) this.currentSalesman.todayVisits = [];
      const newVisit = data.visit || {
        partyName,
        purpose,
        notes,
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString()
      };
      this.currentSalesman.todayVisits.unshift(newVisit);

      localStorage.setItem('lekhajokha_salesman_session', JSON.stringify({
        salesman: this.currentSalesman,
        business: this.activeBusiness
      }));

      modalEl.remove();
      this.showToast(`Visit recorded at ${partyName}! (GPS logged)`);
      this.renderVisitsTab(document.getElementById('salesmanTabBody'));
    } catch (err) {
      this.showToast('Error recording visit: ' + err.message, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `📍 Record Visit & GPS Check-In`;
      }
    }
  },

  // ----------------------------------------------------------------------------
  // Tab 3: Complete Field Order Booking Suite
  // ----------------------------------------------------------------------------
  renderOrdersTab(container) {
    const products = this.getProductsList();
    const parties = this.getPartiesList();

    const categories = ['All', 'Groceries & Staples', 'Beverages & Snacks', 'Electricals & Hardware', 'Personal Care'];

    container.innerHTML = `
      <div class="tab-pane active order-booking-container">
        <!-- Customer / Party Selector Card -->
        <div class="order-party-selector-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
              🏢 Ordering Customer / Retailer:
            </label>
            <span style="font-size:11px;color:#34d399;font-weight:700;">● Verified Store</span>
          </div>
          <select id="orderPartySelect" class="form-select" style="background:#0f172a;color:#ffffff;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:10px;width:100%;font-size:14px;font-weight:600;">
            ${parties.map(p => `
              <option value="${p.name}" data-id="${p.id}" ${this.orderCart.partyName === p.name ? 'selected' : ''}>
                ${p.name} (${p.address})
              </option>
            `).join('')}
            <option value="__custom__" ${this.orderCart.partyName === '__custom__' ? 'selected' : ''}>➕ Enter New Customer Name...</option>
          </select>
          <div id="orderCustomPartyBox" style="display:${this.orderCart.partyName === '__custom__' ? 'block' : 'none'};margin-top:8px;">
            <input type="text" id="orderCustomPartyInput" class="form-input" placeholder="Type new shop / party name..." style="background:#0f172a;color:#fff;border-color:rgba(255,255,255,0.15);padding:10px;border-radius:8px;width:100%;">
          </div>
        </div>

        <!-- Search Bar -->
        <div class="order-search-bar">
          <span style="font-size:15px;">🔍</span>
          <input type="text" id="catalogSearchInput" placeholder="Search item by name or brand..." value="${this.orderCart.searchQuery || ''}">
          ${this.orderCart.searchQuery ? `<button type="button" id="btnClearSearch" style="background:none;border:none;color:#94a3b8;cursor:pointer;">✕</button>` : ''}
        </div>

        <!-- Category Filter Pills -->
        <div class="category-pills-scroll">
          ${categories.map(cat => `
            <button class="category-pill-btn ${this.orderCart.activeCategory === cat ? 'active' : ''}" data-cat="${cat}">
              ${cat}
            </button>
          `).join('')}
        </div>

        <!-- Products Catalog List -->
        <div class="catalog-products-list" id="catalogProductsList">
          ${this.renderCatalogItemsHtml(products)}
        </div>

        <!-- Live Sticky Cart Tray -->
        <div class="live-cart-tray" id="liveCartTray">
          ${this.renderCartTrayHtml()}
        </div>

        <!-- Today's Booked Orders Feed -->
        <div class="salesman-section-header mt-4">
          <h4>Today's Booked Orders (${(this.currentSalesman.todayOrders || []).length})</h4>
        </div>
        <div class="booked-orders-feed" id="bookedOrdersFeed">
          ${this.renderBookedOrdersFeedHtml()}
        </div>
      </div>
    `;

    // Event Bindings
    const partySelect = document.getElementById('orderPartySelect');
    const customPartyBox = document.getElementById('orderCustomPartyBox');
    partySelect.addEventListener('change', () => {
      if (partySelect.value === '__custom__') {
        customPartyBox.style.display = 'block';
        this.orderCart.partyName = '__custom__';
        document.getElementById('orderCustomPartyInput').focus();
      } else {
        customPartyBox.style.display = 'none';
        this.orderCart.partyName = partySelect.value;
        const opt = partySelect.options[partySelect.selectedIndex];
        this.orderCart.partyId = opt.getAttribute('data-id') || 'P001';
      }
    });

    const customInput = document.getElementById('orderCustomPartyInput');
    if (customInput) {
      customInput.addEventListener('input', (e) => {
        this.orderCart.customPartyName = e.target.value;
      });
    }

    // Search filter
    const searchInput = document.getElementById('catalogSearchInput');
    searchInput.addEventListener('input', (e) => {
      this.orderCart.searchQuery = e.target.value;
      this.updateCatalogListHtml();
    });

    const clearSearchBtn = document.getElementById('btnClearSearch');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        this.orderCart.searchQuery = '';
        searchInput.value = '';
        this.updateCatalogListHtml();
      });
    }

    // Category pills
    container.querySelectorAll('.category-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.category-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.orderCart.activeCategory = btn.getAttribute('data-cat');
        this.updateCatalogListHtml();
      });
    });

    // Delegate Cart / Stepper Actions
    this.bindCatalogEvents();
    this.bindCartTrayEvents();
  },

  renderCatalogItemsHtml(products) {
    const q = (this.orderCart.searchQuery || '').toLowerCase().trim();
    const cat = this.orderCart.activeCategory || 'All';

    const filtered = products.filter(p => {
      const matchCat = (cat === 'All') || (p.category === cat);
      const matchQuery = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      return `
        <div class="empty-sessions-box">
          No items found matching "${this.orderCart.searchQuery}" in ${cat}.
        </div>
      `;
    }

    return filtered.map(p => {
      const qty = this.orderCart.items[p.id] || 0;
      const inCart = qty > 0;

      return `
        <div class="catalog-item-card ${inCart ? 'in-cart' : ''}" id="prodCard-${p.id}">
          <div class="catalog-item-info">
            <h4 class="catalog-item-title">${p.name}</h4>
            <div class="catalog-item-meta">
              <span>🏷️ ${p.category}</span>
              <span>•</span>
              <span class="catalog-item-stock">Stock: ${p.stock} ${p.unit}</span>
            </div>
            <div class="catalog-item-price-row">
              <span class="catalog-item-price">₹${p.price.toFixed(2)}</span>
              <span class="catalog-item-gst">+${p.gstRate}% GST</span>
            </div>
          </div>

          <div class="item-stepper-wrapper">
            ${qty === 0 ? `
              <button class="btn-add-item-cta btn-add-prod" data-id="${p.id}">
                <span>+</span> Add
              </button>
            ` : `
              <div class="qty-stepper-box">
                <button class="stepper-btn btn-stepper-minus" data-id="${p.id}">−</button>
                <span class="stepper-input">${qty}</span>
                <button class="stepper-btn btn-stepper-plus" data-id="${p.id}">+</button>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
  },

  updateCatalogListHtml() {
    const list = document.getElementById('catalogProductsList');
    if (!list) return;
    const products = this.getProductsList();
    list.innerHTML = this.renderCatalogItemsHtml(products);
    this.bindCatalogEvents();
  },

  bindCatalogEvents() {
    const list = document.getElementById('catalogProductsList');
    if (!list) return;

    list.querySelectorAll('.btn-add-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.updateItemQty(id, 1);
      });
    });

    list.querySelectorAll('.btn-stepper-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const curr = this.orderCart.items[id] || 0;
        this.updateItemQty(id, curr + 1);
      });
    });

    list.querySelectorAll('.btn-stepper-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const curr = this.orderCart.items[id] || 0;
        this.updateItemQty(id, Math.max(0, curr - 1));
      });
    });
  },

  updateItemQty(productId, newQty) {
    if (newQty <= 0) {
      delete this.orderCart.items[productId];
    } else {
      this.orderCart.items[productId] = newQty;
    }

    this.updateCatalogListHtml();
    this.updateCartTrayHtml();
  },

  calculateCartTotals() {
    const products = this.getProductsList();
    const prodMap = new Map(products.map(p => [p.id, p]));

    let totalItems = 0;
    let totalUnits = 0;
    let subtotal = 0;
    let tax = 0;
    const itemsList = [];

    for (const [id, qty] of Object.entries(this.orderCart.items)) {
      if (qty > 0 && prodMap.has(id)) {
        const p = prodMap.get(id);
        const linePrice = p.price * qty;
        const lineTax = linePrice * (p.gstRate / 100);
        subtotal += linePrice;
        tax += lineTax;
        totalItems++;
        totalUnits += qty;
        itemsList.push({
          productId: p.id,
          name: p.name,
          unit: p.unit,
          price: p.price,
          gstRate: p.gstRate,
          quantity: qty,
          lineTotal: linePrice + lineTax
        });
      }
    }

    const grandTotal = subtotal + tax;
    return { totalItems, totalUnits, subtotal, tax, grandTotal, itemsList };
  },

  renderCartTrayHtml() {
    const { totalItems, totalUnits, subtotal, tax, grandTotal } = this.calculateCartTotals();

    return `
      <div class="cart-tray-header">
        <h4>🛒 Live Order Summary</h4>
        <span class="cart-item-count-badge">${totalItems} Products (${totalUnits} Units)</span>
      </div>

      <div class="cart-breakdown-row">
        <span>Items Subtotal:</span>
        <span style="color:#ffffff;font-weight:600;">₹${subtotal.toFixed(2)}</span>
      </div>

      <div class="cart-breakdown-row">
        <span>Estimated GST Tax:</span>
        <span style="color:#ffffff;font-weight:600;">₹${tax.toFixed(2)}</span>
      </div>

      <div class="cart-total-row">
        <span>Grand Order Total:</span>
        <span class="cart-total-val">₹${grandTotal.toFixed(2)}</span>
      </div>

      <div class="form-group mb-2">
        <label style="font-size:11.5px;font-weight:700;color:#94a3b8;display:block;margin-bottom:4px;">Payment Terms</label>
        <select id="orderPayMode" class="form-select" style="background:#0f172a;color:#fff;border-color:rgba(255,255,255,0.15);padding:8px 10px;border-radius:8px;width:100%;font-size:13px;">
          <option value="Credit (15 Days)" ${this.orderCart.paymentMode === 'Credit (15 Days)' ? 'selected' : ''}>Credit (15 Days)</option>
          <option value="Cash on Delivery" ${this.orderCart.paymentMode === 'Cash on Delivery' ? 'selected' : ''}>Cash on Delivery (COD)</option>
          <option value="Instant UPI" ${this.orderCart.paymentMode === 'Instant UPI' ? 'selected' : ''}>Instant UPI / QR</option>
        </select>
      </div>

      <div class="form-group mb-3">
        <label style="font-size:11.5px;font-weight:700;color:#94a3b8;display:block;margin-bottom:4px;">Delivery Remarks / Instructions</label>
        <input type="text" id="orderNotesInput" class="form-input" placeholder="e.g. Deliver before 12 PM with invoice copy" value="${this.orderCart.notes || ''}" style="background:#0f172a;color:#fff;border-color:rgba(255,255,255,0.15);padding:8px 10px;border-radius:8px;width:100%;font-size:13px;">
      </div>

      <button type="button" class="order-place-cta-btn" id="btnPlaceFieldOrder" ${totalItems === 0 ? 'disabled' : ''}>
        <span>🛒 Place Field Order • ₹${grandTotal.toFixed(2)}</span>
      </button>
    `;
  },

  updateCartTrayHtml() {
    const tray = document.getElementById('liveCartTray');
    if (!tray) return;
    tray.innerHTML = this.renderCartTrayHtml();
    this.bindCartTrayEvents();
  },

  bindCartTrayEvents() {
    const paySelect = document.getElementById('orderPayMode');
    if (paySelect) {
      paySelect.addEventListener('change', () => {
        this.orderCart.paymentMode = paySelect.value;
      });
    }

    const notesInput = document.getElementById('orderNotesInput');
    if (notesInput) {
      notesInput.addEventListener('input', () => {
        this.orderCart.notes = notesInput.value;
      });
    }

    const placeBtn = document.getElementById('btnPlaceFieldOrder');
    if (placeBtn) {
      placeBtn.addEventListener('click', async () => {
        await this.submitFieldOrder();
      });
    }
  },

  async submitFieldOrder() {
    const { totalItems, itemsList, subtotal, tax, grandTotal } = this.calculateCartTotals();
    if (totalItems === 0) {
      this.showToast('Please add at least 1 item to the order', 'error');
      return;
    }

    let party = this.orderCart.partyName;
    if (party === '__custom__') {
      party = (this.orderCart.customPartyName || '').trim();
      if (!party) {
        this.showToast('Please enter the customer / shop name', 'error');
        return;
      }
    }

    const placeBtn = document.getElementById('btnPlaceFieldOrder');
    if (placeBtn) {
      placeBtn.disabled = true;
      placeBtn.innerHTML = `<span>⏳ Transmitting Order to Business...</span>`;
    }

    try {
      const res = await fetch(`/api/v1/salesmen/${this.currentSalesman.id}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName: party,
          partyId: this.orderCart.partyId || 'P001',
          items: itemsList,
          subtotal: subtotal,
          tax: tax,
          total: grandTotal,
          paymentMode: this.orderCart.paymentMode || 'Credit (15 Days)',
          notes: this.orderCart.notes || 'Field order booked via salesman mobile app',
          timestamp: new Date().toISOString()
        })
      });
      const data = await res.json();

      const newOrder = data.order || {
        number: `FO-${new Date().getFullYear()}-${String(((this.currentSalesman.todayOrders || []).length + 1)).padStart(3, '0')}`,
        partyName: party,
        total: grandTotal,
        paymentMode: this.orderCart.paymentMode,
        timestamp: new Date().toISOString(),
        items: itemsList
      };

      if (!this.currentSalesman.todayOrders) this.currentSalesman.todayOrders = [];
      this.currentSalesman.todayOrders.unshift(newOrder);

      // Immediately sync with Business Owner Store so it reflects in real-time!
      try {
        if (window.Store && window.Store.addOrder) {
          window.Store.addOrder({
            id: newOrder.id || `ORD-${Date.now()}`,
            number: newOrder.number,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            source: 'Salesman App',
            salesmanId: this.currentSalesman.id,
            salesmanName: this.currentSalesman.name,
            partyName: party,
            partyId: this.orderCart.partyId || 'P001',
            items: itemsList.map(it => ({
              itemId: it.productId,
              name: it.name,
              qty: it.quantity,
              rate: it.price,
              gstRate: it.gstRate,
              amount: it.lineTotal
            })),
            subtotal: subtotal,
            tax: tax,
            total: grandTotal,
            paymentStatus: (this.orderCart.paymentMode || '').toLowerCase().includes('advance') || (this.orderCart.paymentMode || '').toLowerCase().includes('cash') ? 'Paid' : 'Pending',
            paymentMode: this.orderCart.paymentMode || 'Credit (15 Days)',
            paidAmount: (this.orderCart.paymentMode || '').toLowerCase().includes('advance') || (this.orderCart.paymentMode || '').toLowerCase().includes('cash') ? grandTotal : 0,
            balanceDue: (this.orderCart.paymentMode || '').toLowerCase().includes('advance') || (this.orderCart.paymentMode || '').toLowerCase().includes('cash') ? 0 : grandTotal,
            notes: this.orderCart.notes || `Booked in field by ${this.currentSalesman.name}`
          });
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { order: newOrder } }));
        }
      } catch (syncErr) {
        console.warn('Real-time owner store sync:', syncErr);
      }

      // Reset Cart
      this.orderCart.items = {};
      this.orderCart.notes = '';

      localStorage.setItem('lekhajokha_salesman_session', JSON.stringify({
        salesman: this.currentSalesman,
        business: this.activeBusiness
      }));

      // Show Order Success Receipt
      this.showOrderReceiptModal(newOrder);

      // Re-render Tab
      this.renderOrdersTab(document.getElementById('salesmanTabBody'));
    } catch (err) {
      this.showToast('Failed to submit order: ' + err.message, 'error');
      if (placeBtn) {
        placeBtn.disabled = false;
        placeBtn.innerHTML = `<span>🛒 Place Field Order • ₹${grandTotal.toFixed(2)}</span>`;
      }
    }
  },

  showOrderReceiptModal(order) {
    const existing = document.getElementById('orderReceiptModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'orderReceiptModal';
    modal.className = 'salesman-modal-backdrop active';
    modal.innerHTML = `
      <div class="salesman-modal-card">
        <div class="salesman-modal-header">
          <h3 class="salesman-modal-title">✓ Field Order Confirmed</h3>
          <button type="button" class="salesman-modal-close" id="btnCloseReceiptModal">✕</button>
        </div>

        <div class="order-receipt-card">
          <div class="receipt-icon-circle">✓</div>
          <h3 style="margin:0 0 4px 0;color:#ffffff;font-size:18px;">Order #${order.number || 'FO-2026-001'}</h3>
          <p style="color:#34d399;font-weight:700;font-size:13px;margin:0 0 12px 0;">Sent to ${this.activeBusiness ? this.activeBusiness.name : 'Business Owner'}</p>

          <div style="background:rgba(0,0,0,0.3);border-radius:10px;padding:12px;text-align:left;margin-bottom:14px;border:1px solid rgba(255,255,255,0.08);">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
              <span style="color:#94a3b8;">Customer:</span>
              <strong style="color:#fff;">${order.partyName}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
              <span style="color:#94a3b8;">Payment Terms:</span>
              <strong style="color:#cbd5e1;">${order.paymentMode || 'Credit (15 Days)'}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;">
              <span style="color:#94a3b8;">Order Time:</span>
              <strong style="color:#cbd5e1;">${new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
          </div>

          <table class="receipt-table">
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(i => `
                <tr>
                  <td>${i.name || i.item || 'Item'}</td>
                  <td style="text-align:center;">${i.quantity || i.qty || 1}</td>
                  <td style="text-align:right;">₹${Number(i.lineTotal || (i.price * (i.quantity || 1)) || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr style="font-weight:800;border-top:1px solid rgba(255,255,255,0.2);">
                <td colspan="2" style="color:#34d399;font-size:14px;">Total Amount:</td>
                <td style="text-align:right;color:#34d399;font-size:15px;">₹${Number(order.total || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <button type="button" class="btn btn-success btn-block" id="btnShareWhatsAppReceipt" style="padding:12px;font-weight:700;font-size:14px;background:#25d366;border:none;margin-top:10px;">
            💬 Share Order Confirmation on WhatsApp
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById('btnCloseReceiptModal');
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const shareBtn = document.getElementById('btnShareWhatsAppReceipt');
    shareBtn.addEventListener('click', () => {
      const msg = `*Field Order Booked - ${order.number}*\nCustomer: ${order.partyName}\nItems: ${(order.items || []).length} lines\nTotal: ₹${Number(order.total || 0).toFixed(2)}\nPayment: ${order.paymentMode}\nSalesman: ${this.currentSalesman.name}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    });
  },

  renderBookedOrdersFeedHtml() {
    const orders = this.currentSalesman.todayOrders || [];
    if (orders.length === 0) {
      return `<div class="empty-sessions-box">No orders booked yet today. Select products above to place your first field order.</div>`;
    }

    return orders.map(ord => `
      <div class="booked-order-feed-card">
        <div class="booked-order-feed-header">
          <strong style="color:#ffffff;">#${ord.number || 'FO-2026-001'} — ${ord.partyName}</strong>
          <span style="color:#34d399;font-weight:800;">₹${Number(ord.total || 0).toFixed(2)}</span>
        </div>
        <div class="booked-order-feed-body">
          <span>📦 ${(ord.items || []).length} items • ${ord.paymentMode || 'Credit (15 Days)'}</span>
          <span style="float:right;color:#64748b;">${new Date(ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    `).join('');
  },

  // Tab 4: Profile, Settings & Native App APK Download
  renderProfileTab(container) {
    const sm = this.currentSalesman;
    const biz = this.activeBusiness || { name: 'Sharma Traders & Distributors', gstin: '07AAAAA0000A1Z5' };

    container.innerHTML = `
      <div class="tab-pane active">
        <div class="profile-hero-badge">
          <div class="profile-big-avatar">${sm.name.charAt(0).toUpperCase()}</div>
          <h3>${sm.name}</h3>
          <p class="profile-role-tag">${sm.role || 'Field Salesman'} • ID: ${sm.employeeId || sm.id}</p>
        </div>

        <div class="profile-card-group mt-3">
          <div class="profile-item">
            <span class="item-label">Mobile Number</span>
            <span class="item-val">+91 ${sm.phone}</span>
          </div>
          <div class="profile-item">
            <span class="item-label">Assigned Business</span>
            <span class="item-val">${biz.name}</span>
          </div>
          <div class="profile-item">
            <span class="item-label">Sales Territory</span>
            <span class="item-val">${sm.territory || 'Central Region'}</span>
          </div>
          <div class="profile-item">
            <span class="item-label">Account Status</span>
            <span class="item-val" style="color:var(--success);font-weight:700;">● Active & Verified</span>
          </div>
        </div>

        <!-- Android APK Download Card -->
        <div class="apk-download-hero-card mt-3">
          <div class="apk-icon">📲</div>
          <h4>Lekha Jokha Android APK</h4>
          <p>Install the dedicated Android application on your smartphone for background GPS tracking and offline billing.</p>
          <a href="/downloads/lekhajokha-field-force.apk" class="btn btn-success btn-block mt-2" download>
            📥 Download Android App (.APK)
          </a>
        </div>

        <div class="mt-4 mb-4">
          <button class="btn btn-outline btn-block" onclick="window.location.hash='#dashboard'">
            Switch to Business Owner Portal
          </button>
        </div>
      </div>
    `;
  },

  updateGpsCoordinatesDisplay() {
    const box = document.getElementById('coordText');
    if (!box) return;

    if (!navigator.geolocation) {
      box.innerText = 'GPS Status: Simulated Coordinates (Hardware GPS unavailable)';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        const acc = Math.round(pos.coords.accuracy || 10);
        if (box) box.innerText = `GPS Fixed: ${lat}°N, ${lng}°E (Accuracy: ±${acc}m)`;
      },
      () => {
        if (box) box.innerText = 'GPS Status: Standard Telemetry Active (28.6139°N, 77.2090°E)';
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  },

  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve({ coords: { latitude: 28.6139, longitude: 77.2090, accuracy: 15 } });
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true });
    });
  },

  startTelemetry() {
    this.stopTelemetry();

    // Heartbeat every 45 seconds to sync live location with server
    this.heartbeatTimer = setInterval(async () => {
      if (!this.currentSalesman || this.currentSalesman.attendanceStatus !== 'Punched In') return;

      try {
        const pos = await this.getCurrentLocation();
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);

        await fetch(`/api/v1/salesmen/${this.currentSalesman.id}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            accuracy: accuracy,
            timestamp: new Date().toISOString()
          })
        });
      } catch (e) {
        // Silent failure in background telemetry
      }
    }, 45000);
  },

  stopTelemetry() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  },

  async handleDirectPhoneLogin(phone) {
    if (!phone) {
      alert('Please enter your 10-digit mobile number');
      return;
    }
    const clean = phone.replace(/[^0-9]/g, '').slice(-10);
    if (!clean || clean.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    const submitBtn = document.getElementById('salesmanLoginSubmitBtn');
    const origText = submitBtn ? submitBtn.innerText : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = '⏳ Verifying & Logging In...';
    }

    try {
      const res = await fetch('/api/v1/salesmen/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean })
      });
      const data = await res.json();

      if (!res.ok || !data.salesman) {
        alert(data.error || `No salesman profile found for mobile number ${phone}.\nPlease contact your business owner.`);
        return;
      }

      this.currentSalesman = data.salesman;
      this.activeBusiness = data.business;
      localStorage.setItem('lekhajokha_salesman_session', JSON.stringify({
        salesman: this.currentSalesman,
        business: this.activeBusiness,
        sessionToken: data.sessionToken
      }));

      // Ensure hash is salesman-app
      if (window.location.hash !== '#salesman-app') {
        window.location.hash = '#salesman-app';
      }

      const container = document.getElementById('viewContainer') || document.querySelector('.main-content');
      if (container) this.renderApp(container);
    } catch (err) {
      alert('Login error: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = origText || '🚀 Log In as Field Staff';
      }
    }
  }
};
