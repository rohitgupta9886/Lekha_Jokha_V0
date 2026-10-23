// ==============================================================================
// Lekha Jokha - Dedicated Top-Level Track Your Salesmen & Field Force Module
// Complete Field Sales Management:
//   1. All Salesmen Directory & Owner CRUD (Create, Read, Update, Delete/Revoke)
//   2. Searchbox by Name, Phone, Employee ID, Territory
//   3. Deep 360° Salesman Profile & Telemetry Dossier (Sales Generated Daily/Monthly/Annually,
//      Punch-In/Out times & GPS Coordinates + Addresses, Total/Active/Break Durations,
//      First/Last Activity, Traveled Distance, Sync/Offline Telemetry, Customer Visits)
//   4. Interactive SVG Live Fleet Map
// ==============================================================================

window.SalesmenModule = {
  currentSubTab: 'live-map', // 'live-map' | 'directory' | 'performance' | 'salesman-app'
  activeSalesman: null,
  searchQuery: '',
  statusFilter: 'all', // 'all' | 'on-duty' | 'punched-out' | 'pending'
  container: null,

  render(container) {
    this.container = container;
    const allSalesmen = window.Store.getSalesmen();
    const salesmen = this.getFilteredSalesmen();

    const onDutyCount = allSalesmen.filter(s => s.attendanceStatus === 'Punched In').length;
    const totalKm = allSalesmen.reduce((acc, s) => acc + (s.stats?.traveledDistanceKm || 0), 0);
    const totalSalesToday = allSalesmen.reduce((acc, s) => acc + (s.stats?.dailySales || 0), 0);

    container.innerHTML = `
      <div class="salesmen-module-wrapper" style="display:flex;flex-direction:column;gap:1.5rem;">
        
        <!-- Header Banner -->
        <div class="card" style="background:linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);color:#ffffff;padding:1.75rem;border-radius:var(--radius-lg);border-left:4px solid #6366f1;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
            <div>
              <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.35rem;">
                <span class="badge" style="background:#6366f1;color:#ffffff;font-weight:800;font-size:11px;padding:3px 8px;border-radius:4px;">
                  FIELD FORCE COMMAND CENTER
                </span>
                <span style="font-size:13px;color:#a5b4fc;display:flex;align-items:center;gap:4px;">
                  <span class="live-dot" style="display:inline-block;width:7px;height:7px;background:#22c55e;border-radius:50%;"></span>
                  ${onDutyCount} Staff Currently Live On Field
                </span>
              </div>
              <h2 style="font-size:1.8rem;font-weight:800;margin:0 0 0.3rem 0;color:#f8fafc;">
                Track Your Salesmen & Field Force
              </h2>
              <p style="color:#cbd5e1;font-size:13.5px;margin:0;max-width:720px;line-height:1.4;">
                Real-time field staff directory with Owner CRUD management, GPS telemetry, punch-in/out timestamps, daily distance tracking, customer visit logs, and comprehensive sales performance analytics.
              </p>
            </div>

            <div style="display:flex;gap:0.75rem;align-items:center;">
              <button class="btn btn-primary" id="openAddSalesmanModalBtn" onclick="window.SalesmenModule.openAddSalesmanModal()" style="background:linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);box-shadow:0 4px 14px rgba(79,70,229,0.4);cursor:pointer;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                + Add New Salesman
              </button>
            </div>
          </div>
        </div>

        <!-- 4 Top KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:1rem;">
          <div class="card" style="padding:1.2rem;border-radius:var(--radius-md);border-top:3px solid #6366f1;">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Registered Staff</div>
            <div style="font-size:1.8rem;font-weight:800;color:#0f172a;margin-top:4px;">${allSalesmen.length}</div>
            <div style="font-size:12px;color:#6366f1;font-weight:600;margin-top:2px;">Field Sales Representatives</div>
          </div>

          <div class="card" style="padding:1.2rem;border-radius:var(--radius-md);border-top:3px solid #22c55e;">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Active On Duty Now</div>
            <div style="font-size:1.8rem;font-weight:800;color:#15803d;margin-top:4px;">${onDutyCount}</div>
            <div style="font-size:12px;color:#22c55e;font-weight:600;margin-top:2px;">Punched In & GPS Broadcasting</div>
          </div>

          <div class="card" style="padding:1.2rem;border-radius:var(--radius-md);border-top:3px solid #3b82f6;">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Total Traveled Today</div>
            <div style="font-size:1.8rem;font-weight:800;color:#1d4ed8;margin-top:4px;">${totalKm.toFixed(1)} km</div>
            <div style="font-size:12px;color:#3b82f6;font-weight:600;margin-top:2px;">Fleet Odometer Sum</div>
          </div>

          <div class="card" style="padding:1.2rem;border-radius:var(--radius-md);border-top:3px solid #f59e0b;">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Field Sales Today</div>
            <div style="font-size:1.8rem;font-weight:800;color:#d97706;margin-top:4px;">₹${totalSalesToday.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
            <div style="font-size:12px;color:#f59e0b;font-weight:600;margin-top:2px;">Booked via Field Force App</div>
          </div>
        </div>

        <!-- Sub-Tabs Navigation Bar & Searchbox -->
        <div class="card" style="padding:1rem 1.25rem;border-radius:var(--radius-md);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
            <!-- Sub-Tabs (Previous map + New directory + Performance + App launcher) -->
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-sm ${this.currentSubTab === 'live-map' ? 'btn-primary' : 'btn-outline'} subtab-btn" data-tab="live-map" style="font-weight:700;">
                🗺️ Live Fleet GPS Radar & Map
              </button>
              <button class="btn btn-sm ${this.currentSubTab === 'directory' ? 'btn-primary' : 'btn-outline'} subtab-btn" data-tab="directory" style="font-weight:700;">
                👥 All Salesmen Directory & CRUD
              </button>
              <button class="btn btn-sm ${this.currentSubTab === 'performance' ? 'btn-primary' : 'btn-outline'} subtab-btn" data-tab="performance" style="font-weight:700;">
                📊 Performance & Target Analytics
              </button>
              <button class="btn btn-sm ${this.currentSubTab === 'salesman-app' ? 'btn-primary' : 'btn-outline'} subtab-btn" data-tab="salesman-app" style="font-weight:700;">
                📲 Field Salesman App Switcher
              </button>
            </div>

            <!-- Searchbox -->
            <div style="position:relative;min-width:280px;max-width:360px;flex:1;">
              <input type="text" id="salesmanSearchInput" class="form-control" placeholder="Search by name, mobile, territory, EMP ID..." value="${this.searchQuery}" style="padding-left:36px;font-size:13px;border-radius:20px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>
        </div>

        <!-- Dynamic Subtab Content -->
        ${this.currentSubTab === 'live-map' ? this.renderLiveMapView(salesmen) : ''}
        ${this.currentSubTab === 'directory' ? this.renderDirectoryView(salesmen) : ''}
        ${this.currentSubTab === 'performance' ? this.renderPerformanceView(salesmen) : ''}
        ${this.currentSubTab === 'salesman-app' ? this.renderSalesmanAppSwitcher(salesmen) : ''}

      </div>

      <!-- Add New Salesman Modal -->
      ${this.renderAddSalesmanModal()}

      <!-- Edit Salesman Modal -->
      ${this.renderEditSalesmanModal()}

      <!-- 360° Comprehensive Salesman Dossier Modal -->
      ${this.renderSalesman360Modal()}
    `;

    this.bindEvents(container);

    // If 360 modal was active, re-open it to ensure it never disappears on background re-render
    if (this.activeSalesman && (this._is360ModalOpen || document.getElementById('salesman360Modal')?.style.display === 'flex')) {
      this.openSalesman360(this.activeSalesman.id);
    }
  },

  getFilteredSalesmen() {
    let list = window.Store.getSalesmen();
    if (this.statusFilter === 'on-duty') {
      list = list.filter(s => s.attendanceStatus === 'Punched In');
    } else if (this.statusFilter === 'punched-out') {
      list = list.filter(s => s.attendanceStatus === 'Punched Out');
    } else if (this.statusFilter === 'pending') {
      list = list.filter(s => s.joiningStatus === 'JOINING PENDING');
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.employeeId || '').toLowerCase().includes(q) ||
        (s.territory || '').toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q)
      );
    }
    return list;
  },

  // --------------------------------------------------------------------------
  // SUB-TAB 1: DIRECTORY TABLE & OWNER CRUD
  // --------------------------------------------------------------------------
  renderDirectoryView(salesmen) {
    return `
      <div class="card" style="padding:0;overflow:hidden;border-radius:var(--radius-md);">
        <div style="padding:14px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-weight:700;font-size:13.5px;color:#334155;">
            Field Staff List (${salesmen.length} Representatives) • <span style="font-size:12px;color:#64748b;font-weight:normal;">Click any row to open 360° Activity & GPS Dossier</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn btn-primary btn-sm" id="dirAddSalesmanBtn" onclick="window.SalesmenModule.openAddSalesmanModal()" style="background:#4f46e5;font-weight:700;padding:6px 14px;border-radius:6px;cursor:pointer;">
              + Add Field Salesman
            </button>
            <div style="font-size:12px;color:#64748b;">
              Owner CRUD Permissions: <b>Full Access Granted</b>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover" style="margin:0;width:100%;font-size:13px;border-collapse:collapse;">
            <thead style="background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:11.5px;color:#64748b;text-transform:uppercase;">
              <tr>
                <th style="padding:12px 16px;">Salesman Profile</th>
                <th style="padding:12px 16px;">Contact & Territory</th>
                <th style="padding:12px 16px;text-align:center;">Duty Status</th>
                <th style="padding:12px 16px;">Punch-In & GPS Location</th>
                <th style="padding:12px 16px;text-align:right;">Working Time</th>
                <th style="padding:12px 16px;text-align:right;">Sales Generated</th>
                <th style="padding:12px 16px;text-align:right;">Owner Actions</th>
              </tr>
            </thead>
            <tbody>
              ${salesmen.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align:center;padding:3rem 1rem;color:#94a3b8;">
                    <div style="font-size:2.5rem;margin-bottom:0.5rem;">👨‍💼</div>
                    <div style="font-size:15px;font-weight:700;color:#475569;">No field salesmen found matching search query</div>
                    <p style="font-size:13px;margin:4px 0 0 0;">Use "+ Add New Salesman" above to recruit field force.</p>
                  </td>
                </tr>
              ` : salesmen.map(s => this.renderSalesmanRow(s)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderSalesmanRow(s) {
    const isOnline = s.attendanceStatus === 'Punched In';
    const initial = (s.name || 'S').charAt(0).toUpperCase();
    const stats = s.stats || {};
    const lastLoc = s.lastLocation || s.punchInLocation || {};

    return `
      <tr class="salesman-table-row" data-id="${s.id}" style="border-bottom:1px solid #f1f5f9;cursor:pointer;transition:background 0.15s;">
        <!-- Profile & Name -->
        <td style="padding:12px 16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:38px;height:38px;border-radius:50%;background:${isOnline ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#cbd5e1'};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;box-shadow:${isOnline ? '0 0 0 3px rgba(16,185,129,0.2)' : 'none'};">
              ${initial}
            </div>
            <div>
              <div style="font-weight:800;color:#0f172a;font-size:14px;" class="open-salesman-360-link" data-id="${s.id}">
                ${s.name}
              </div>
              <div style="font-size:11.5px;color:#64748b;">
                ${s.role || 'Field Salesman'} • <b>${s.employeeId || 'EMP'}</b>
              </div>
            </div>
          </div>
        </td>

        <!-- Contact & Territory -->
        <td style="padding:12px 16px;">
          <div style="font-weight:600;color:#334155;">📞 ${s.phone}</div>
          <div style="font-size:11.5px;color:#64748b;margin-top:2px;">📍 ${s.territory || 'Unassigned'}</div>
        </td>

        <!-- Duty Status -->
        <td style="padding:12px 16px;text-align:center;">
          ${isOnline ? `
            <span class="badge" style="background:#dcfce7;color:#15803d;font-weight:800;font-size:11px;padding:3px 8px;border-radius:12px;display:inline-flex;align-items:center;gap:4px;">
              <span class="live-dot" style="display:inline-block;width:6px;height:6px;background:#22c55e;border-radius:50%;"></span>
              ON DUTY
            </span>
          ` : `
            <span class="badge" style="background:#f1f5f9;color:#64748b;font-weight:700;font-size:11px;padding:3px 8px;border-radius:12px;">
              OFF DUTY
            </span>
          `}
        </td>

        <!-- Punch-In & GPS Location -->
        <td style="padding:12px 16px;max-width:260px;">
          ${s.punchInLocation && s.punchInLocation.time ? `
            <div style="font-size:12px;font-weight:700;color:#0f172a;">
              ⏱️ In: ${s.punchInLocation.time}
            </div>
            <div style="font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${lastLoc.address || 'GPS Fix'}">
              📍 ${lastLoc.address || 'Delhi Region'}
            </div>
            ${lastLoc.lat ? `<div style="font-size:10px;color:#94a3b8;font-family:monospace;">GPS: ${Number(lastLoc.lat).toFixed(4)}°, ${Number(lastLoc.lng).toFixed(4)}°</div>` : ''}
          ` : `
            <div style="font-size:12px;color:#94a3b8;font-style:italic;">Not punched in today</div>
          `}
        </td>

        <!-- Working Time & Traveled Distance -->
        <td style="padding:12px 16px;text-align:right;">
          <div style="font-weight:700;color:#0f172a;">${stats.totalWorkingDuration || '0h 0m'}</div>
          <div style="font-size:11.5px;color:#3b82f6;font-weight:600;">🚶 ${stats.traveledDistanceKm ? stats.traveledDistanceKm.toFixed(1) + ' km' : '0 km'}</div>
        </td>

        <!-- Sales Generated -->
        <td style="padding:12px 16px;text-align:right;">
          <div style="font-weight:800;color:#059669;font-size:13.5px;">
            ₹${Number(stats.dailySales || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}
          </div>
          <div style="font-size:11px;color:#64748b;">Month: ₹${Number(stats.monthlySales || 0).toLocaleString('en-IN')}</div>
        </td>

        <!-- Owner Actions (CRUD) -->
        <td style="padding:12px 16px;text-align:right;" onclick="event.stopPropagation();">
          <div style="display:inline-flex;gap:4px;">
            <button class="btn btn-xs btn-outline btn-view-salesman-360" data-id="${s.id}" title="Inspect Full 360° Dossier" style="padding:3px 7px;">
              👁️ 360°
            </button>
            <button class="btn btn-xs btn-outline btn-edit-salesman" data-id="${s.id}" title="Edit Salesman Profile" style="padding:3px 7px;">
              ✏️
            </button>
            ${s.whatsAppInviteUrl ? `
              <a href="${s.whatsAppInviteUrl}" target="_blank" class="btn btn-xs btn-outline" style="padding:3px 7px;color:#10b981;border-color:#10b981;" title="Send WhatsApp Invite Link">
                📲
              </a>
            ` : ''}
            <button class="btn btn-xs btn-outline btn-revoke-salesman" data-id="${s.id}" data-name="${s.name}" title="Revoke Staff Access" style="padding:3px 7px;color:#ef4444;border-color:#ef4444;">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  // --------------------------------------------------------------------------
  // SUB-TAB 1: LIVE FLEET GPS MAP RADAR & FLOATING PANEL (ORIGINAL SIGNATURE FEATURE)
  // --------------------------------------------------------------------------
  renderLiveMapView(salesmen) {
    const list = salesmen || window.Store.getSalesmen();
    return `
      <div class="card" style="padding:0;overflow:hidden;border-radius:var(--radius-md);box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <!-- Top Toolbar for Map -->
        <div style="padding:12px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <span style="font-weight:800;font-size:14px;color:#0f172a;">🗺️ Live Field Fleet Radar & Real-Time Tracking</span>
            <span style="font-size:12px;color:#64748b;margin-left:8px;">Interactive city grid, real-time GPS fixes, live pulse radar & slide-over dossier</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:12px;color:#059669;font-weight:700;display:flex;align-items:center;gap:6px;">
              <span class="live-dot" style="display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:50%;"></span>
              GPS Polling Active
            </div>
            <button class="btn btn-xs btn-outline" id="refreshMapSalesmenBtn" style="padding:4px 10px;font-size:12px;">
              🔄 Refresh Locations
            </button>
          </div>
        </div>

        <div class="track-salesmen-container" style="position:relative;height:580px;width:100%;background:#e2e8f0;overflow:hidden;">
          <!-- Map Canvas / Container -->
          <div class="salesmen-map-viewport" id="salesmenMap" style="position:absolute;top:0;left:0;width:100%;height:100%;">
            <div class="map-interactive-canvas" id="mapSvgCanvas" style="width:100%;height:100%;overflow:hidden;">
              <svg viewBox="0 0 1000 650" width="100%" height="100%" class="styled-map-svg" preserveAspectRatio="none">
                <defs>
                  <pattern id="gridPatternSm" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dbeafe" stroke-width="0.8"/>
                  </pattern>
                  <linearGradient id="mapBgSm" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#f8fafc"/>
                    <stop offset="100%" stop-color="#f1f5f9"/>
                  </linearGradient>
                </defs>
                <rect width="1000" height="650" fill="url(#mapBgSm)"/>
                <rect width="1000" height="650" fill="url(#gridPatternSm)"/>

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
                  ${this.generateSvgMapPins(list)}
                </g>
              </svg>
            </div>
          </div>

          <!-- Floating Salesman List Panel matching Screenshot 1 -->
          <div class="salesman-floating-panel" id="salesmanPanel" style="position:absolute;top:20px;left:20px;width:340px;background:#ffffff;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,0.15);border:1px solid rgba(226,232,240,0.9);z-index:20;display:flex;flex-direction:column;max-height:calc(100% - 40px);overflow:hidden;">
            <div class="salesman-panel-header" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f1f5f9;">
              <h3 class="panel-count-title" style="margin:0;font-size:15px;font-weight:700;color:#1e293b;">Field Salesmen (${list.length})</h3>
              <button class="btn btn-sm btn-outline-refresh" id="panelRefreshBtn" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;font-size:12px;border-radius:14px;background:#fff;border:1px solid #e2e8f0;cursor:pointer;">
                <span>Refresh</span>
              </button>
            </div>

            <div class="salesman-items-list" style="padding:8px 10px;overflow-y:auto;max-height:360px;">
              ${this.generateFloatingSalesmenListHtml(list)}
            </div>

            <div class="salesman-panel-footer" style="padding:10px 14px;border-top:1px solid #f1f5f9;background:#fafafa;">
              <button class="btn btn-primary btn-block btn-sm" id="floatingAddSalesmanBtn" onclick="window.SalesmenModule.openAddSalesmanModal()" style="width:100%;border-radius:8px;font-weight:700;cursor:pointer;">
                + Add Field Salesman
              </button>
            </div>
          </div>

          <!-- Salesman Details Drawer / Slide-Over Modal -->
          <div class="salesman-details-drawer" id="salesmanDetailsDrawer" style="display:none;position:absolute;top:0;right:0;width:380px;height:100%;background:#ffffff;z-index:30;box-shadow:-6px 0 25px rgba(0,0,0,0.15);overflow-y:auto;border-left:1px solid #e2e8f0;">
            <div class="drawer-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f1f5f9;background:#f8fafc;">
              <h4 id="drawerSalesmanName" style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">Salesman Details</h4>
              <button class="icon-close-btn" id="closeDrawerBtn" style="background:none;border:none;font-size:22px;cursor:pointer;color:#64748b;">&times;</button>
            </div>
            <div class="drawer-body" id="drawerBody" style="padding:18px 20px;">
              <!-- Dynamic profile, visits, attendance -->
            </div>
          </div>
        </div>
      </div>
    `;
  },

  generateSvgMapPins(list) {
    if (!list || list.length === 0) return '';
    const coords = [
      { x: 480, y: 250 },
      { x: 650, y: 350 },
      { x: 380, y: 440 },
      { x: 740, y: 200 },
      { x: 260, y: 280 }
    ];

    return list.map((s, idx) => {
      const pos = coords[idx % coords.length];
      const isOnline = s.attendanceStatus === 'Punched In';
      const color = isOnline ? '#22c55e' : (s.joiningStatus === 'JOINING PENDING' ? '#f59e0b' : '#64748b');

      return `
        <g class="map-salesman-pin" transform="translate(${pos.x}, ${pos.y})" style="cursor:pointer;" onclick="window.SalesmenModule.openDrawerForSalesman('${s.id}')">
          ${isOnline ? `
            <circle r="22" fill="#22c55e" opacity="0.25">
              <animate attributeName="r" values="14;28;14" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
            </circle>
          ` : ''}
          <circle r="14" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
          <text text-anchor="middle" y="4" font-size="10" fill="#ffffff" font-weight="bold">${(s.name || 'S').charAt(0)}</text>
          
          <!-- Name Tag -->
          <rect x="-65" y="-38" width="130" height="22" rx="4" fill="#0f172a" opacity="0.9" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
          <text text-anchor="middle" x="0" y="-23" font-size="10" fill="#ffffff" font-weight="700">${s.name} ${isOnline ? '🟢' : '⚪'}</text>
        </g>
      `;
    }).join('');
  },

  generateFloatingSalesmenListHtml(list) {
    if (!list || list.length === 0) {
      return `
        <div style="text-align:center;padding:24px 10px;color:#94a3b8;font-size:13px;">
          No field staff found.<br>
          <small>Click "+ Add Field Salesman" below to register staff.</small>
        </div>
      `;
    }

    return list.map(s => {
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

      const lastLoc = s.lastLocation || {};

      return `
        <div class="salesman-card-item" data-id="${s.id}" style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;cursor:pointer;transition:background 0.15s;border-bottom:1px solid #f8fafc;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
          <div class="salesman-avatar-circle" style="width:40px;height:40px;border-radius:50%;background:#bbf7d0;color:#15803d;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0;">${initial}</div>
          <div class="salesman-card-info" style="flex:1;min-width:0;">
            <div class="salesman-name-row" style="display:flex;align-items:center;gap:6px;">
              <span class="salesman-name" style="font-size:14px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name}</span>
            </div>
            <div class="salesman-badge-row" style="margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span class="salesman-status-badge ${badgeClass}" style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:700;">${badgeText}</span>
              ${s.territory ? `<span class="salesman-territory-tag" style="font-size:10px;color:#64748b;background:#f1f5f9;padding:2px 6px;border-radius:4px;">${s.territory}</span>` : ''}
            </div>
            <div class="salesman-subtext" style="margin-top:3px;font-size:11px;color:#64748b;">
              <span>📱 ${s.phone}</span>
              ${lastLoc.address ? `<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#0284c7;">📍 ${lastLoc.address}</div>` : ''}
            </div>
          </div>
          <div class="salesman-card-actions" onclick="event.stopPropagation();">
            ${s.whatsAppInviteUrl ? `
              <a href="${s.whatsAppInviteUrl}" target="_blank" class="btn-wa-icon" title="Share Invitation via WhatsApp" style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#dcfce7;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  openDrawerForSalesman(salesmanId) {
    const s = window.Store.getSalesman(salesmanId);
    if (!s) return;

    const drawer = document.getElementById('salesmanDetailsDrawer');
    const title = document.getElementById('drawerSalesmanName');
    const body = document.getElementById('drawerBody');
    if (!drawer || !body) return;

    title.innerText = s.name;
    drawer.style.display = 'block';

    const lastLoc = s.lastLocation || {};
    const stats = s.stats || {};
    const initial = (s.name || 'S').trim().charAt(0).toUpperCase();

    body.innerHTML = `
      <div class="drawer-profile-card">
        <div class="dp-header" style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <div class="dp-avatar" style="width:48px;height:48px;border-radius:50%;background:#4f46e5;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;">${initial}</div>
          <div class="dp-info">
            <h4 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">${s.name}</h4>
            <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">Role: <b>${s.role || 'Field Salesman'}</b> (${s.employeeId || 'EMP-001'})</p>
            <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">Mobile: <b>${s.phone}</b></p>
            <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">Territory: <b>${s.territory || 'Unassigned'}</b></p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:8px 10px;border-radius:6px;">
            <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Attendance</div>
            <div style="font-size:13px;font-weight:800;color:${s.attendanceStatus === 'Punched In' ? '#15803d' : '#64748b'};">
              ${s.attendanceStatus || 'Punched Out'}
            </div>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:8px 10px;border-radius:6px;">
            <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Join Status</div>
            <div style="font-size:13px;font-weight:800;color:#d97706;">
              ${s.joiningStatus || 'JOINING PENDING'}
            </div>
          </div>
        </div>

        ${s.whatsAppInviteUrl ? `
          <div style="margin-bottom:14px;">
            <a href="${s.whatsAppInviteUrl}" target="_blank" class="btn btn-block btn-success btn-sm" style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-bottom:6px;">
              📲 Share Invite on WhatsApp
            </a>
            <button class="btn btn-outline btn-sm btn-block" style="width:100%;font-size:11.5px;" onclick="navigator.clipboard.writeText('${s.whatsAppInviteUrl}');window.app && window.app.showToast('WhatsApp invite link copied!','success');">
              📋 Copy Invitation Link
            </button>
          </div>
        ` : ''}

        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px;margin-bottom:14px;">
          <h5 style="margin:0 0 6px 0;font-size:12.5px;color:#0f172a;">📍 GPS & Field Telemetry</h5>
          <p style="margin:0;font-size:12px;color:#334155;">Location: <b>${lastLoc.address || 'Indiranagar Commercial Market'}</b></p>
          <p style="margin:2px 0 0 0;font-size:11px;color:#64748b;font-family:monospace;">Coordinates: ${lastLoc.lat || 28.6139}°, ${lastLoc.lng || 77.2090}°</p>
          <p style="margin:2px 0 0 0;font-size:11px;color:#94a3b8;">Last Ping: ${lastLoc.timestamp ? new Date(lastLoc.timestamp).toLocaleTimeString() : 'Just now'}</p>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px;margin-bottom:14px;">
          <h5 style="margin:0 0 6px 0;font-size:12.5px;color:#0f172a;">⏱️ Attendance & Work Sessions</h5>
          <div style="font-size:12px;color:#64748b;">
            <div>Active Working: <b>${stats.activeWorkingDuration || '5h 45m'}</b></div>
            <div>Traveled Distance: <b>${stats.traveledDistanceKm ? stats.traveledDistanceKm.toFixed(1) + ' km' : '14.8 km'}</b></div>
            <div>Daily Sales: <b>₹${Number(stats.dailySales || 0).toLocaleString('en-IN')}</b></div>
          </div>
        </div>

        <button class="btn btn-primary btn-block btn-sm" style="width:100%;margin-bottom:8px;font-weight:700;" onclick="window.SalesmenModule.openSalesman360('${s.id}')">
          📊 Inspect Full 360° Field Dossier
        </button>

        <button class="btn btn-outline btn-sm btn-block" style="width:100%;color:#ef4444;border-color:#ef4444;" onclick="window.SalesmenModule.revokeSalesmanPrompt('${s.id}', '${s.name}')">
          Revoke Staff Access
        </button>
      </div>
    `;
  },

  renderSalesmanAppSwitcher(salesmen) {
    const list = salesmen || window.Store.getSalesmen();
    return `
      <div class="card" style="padding:1.5rem;border-radius:var(--radius-md);">
        <h3 style="margin:0 0 6px 0;font-size:1.2rem;font-weight:800;color:#0f172a;">📲 Field Salesman App Launcher & Live Simulator</h3>
        <p style="margin:0 0 1.25rem 0;font-size:13px;color:#64748b;">
          Experience what your on-ground field agents see on their phones: GPS punch-in/out, live customer visits, and instant order creation that syncs directly into your Owner console.
        </p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1rem;">
          ${list.map(s => `
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-weight:700;font-size:14px;color:#0f172a;">👤 ${s.name}</span>
                  <span class="badge ${s.attendanceStatus === 'Punched In' ? 'badge-success' : 'badge-neutral'}" style="font-size:10px;">${s.attendanceStatus || 'Punched Out'}</span>
                </div>
                <div style="font-size:12px;color:#64748b;margin-top:4px;">
                  ${s.role || 'Field Salesman'} • 📱 ${s.phone}
                </div>
                <div style="font-size:11.5px;color:#0284c7;margin-top:2px;">
                  📍 Territory: ${s.territory || 'General'}
                </div>
              </div>

              <div style="display:flex;gap:8px;">
                <button class="btn btn-primary btn-sm btn-block" onclick="window.SalesmenModule.launchSalesmanApp('${s.id}')" style="flex:1;">
                  📲 Launch Mobile App View
                </button>
                ${s.whatsAppInviteUrl ? `
                  <a href="${s.whatsAppInviteUrl}" target="_blank" class="btn btn-outline btn-sm" title="Share WhatsApp Invite Link">
                    💬
                  </a>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUB-TAB 3: PERFORMANCE & TARGET ANALYTICS
  // --------------------------------------------------------------------------
  renderPerformanceView(salesmen) {
    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(360px, 1fr));gap:1.25rem;">
        ${salesmen.map(s => {
          const stats = s.stats || {};
          const target = s.targetMonthly || 400000;
          const monthly = stats.monthlySales || 0;
          const pct = Math.min(100, Math.round((monthly / target) * 100));

          return `
            <div class="card" style="padding:1.4rem;border-radius:var(--radius-md);cursor:pointer;" onclick="window.SalesmenModule.openSalesman360('${s.id}')">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                <div>
                  <h4 style="margin:0;font-size:1.15rem;font-weight:800;color:#0f172a;">${s.name}</h4>
                  <div style="font-size:12px;color:#64748b;">${s.role || 'Field Salesman'} • ${s.territory}</div>
                </div>
                <button class="btn btn-xs btn-outline">View 360° ➔</button>
              </div>

              <!-- Daily, Monthly, Annual Metrics -->
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;background:#f8fafc;padding:10px;border-radius:8px;margin-bottom:1rem;text-align:center;">
                <div>
                  <div style="font-size:10.5px;color:#64748b;font-weight:700;">DAILY SALES</div>
                  <div style="font-size:14px;font-weight:800;color:#059669;">₹${Number(stats.dailySales || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style="font-size:10.5px;color:#64748b;font-weight:700;">MONTHLY</div>
                  <div style="font-size:14px;font-weight:800;color:#2563eb;">₹${Number(stats.monthlySales || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style="font-size:10.5px;color:#64748b;font-weight:700;">ANNUAL</div>
                  <div style="font-size:14px;font-weight:800;color:#7c3aed;">₹${Number(stats.annualSales || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>

              <!-- Monthly Target Progress Bar -->
              <div>
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                  <span style="color:#64748b;">Monthly Target Achievement:</span>
                  <span style="font-weight:800;color:#0f172a;">${pct}% (₹${monthly.toLocaleString('en-IN')} / ₹${target.toLocaleString('en-IN')})</span>
                </div>
                <div style="height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;">
                  <div style="width:${pct}%;height:100%;background:${pct >= 90 ? '#10b981' : (pct >= 50 ? '#3b82f6' : '#f59e0b')};border-radius:4px;"></div>
                </div>
              </div>

              <!-- Telemetry summary -->
              <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9;">
                <span>🚶 Traveled: <b>${stats.traveledDistanceKm ? stats.traveledDistanceKm.toFixed(1) + ' km' : '0 km'}</b></span>
                <span>⏱️ Active Time: <b>${stats.activeWorkingDuration || '0h 0m'}</b></span>
                <span>📋 Visits: <b>${(s.todayVisits || []).length}</b></span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // MODAL 3: 360° COMPREHENSIVE SALESMAN REPORT & TELEMETRY DOSSIER
  // --------------------------------------------------------------------------
  renderSalesman360Modal() {
    return `
      <div class="modal-overlay" id="salesman360Modal" style="display:none;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.75);z-index:999999;backdrop-filter:blur(5px);">
        <div class="modal-dialog" style="background:#ffffff;border-radius:14px;max-width:860px;width:95%;max-height:92vh;padding:0;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,0.35);">
          
          <div id="salesman360ModalHeader" style="background:linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);color:#fff;padding:1.5rem 2rem;position:sticky;top:0;z-index:10;display:flex;justify-content:space-between;align-items:center;">
            <!-- Injected dynamically -->
          </div>

          <div id="salesman360ModalBody" style="padding:1.75rem 2rem;">
            <!-- Comprehensive Report & Telemetry Injected dynamically -->
          </div>

        </div>
      </div>
    `;
  },

  openSalesman360(salesmanId) {
    const s = window.Store.getSalesman(salesmanId);
    if (!s) return;

    this.activeSalesman = s;
    this._is360ModalOpen = true;
    let modal = document.getElementById('salesman360Modal');
    if (!modal) {
      const wrap = document.createElement('div');
      wrap.innerHTML = this.renderSalesman360Modal();
      modal = wrap.firstElementChild;
      document.body.appendChild(modal);
    } else if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }
    const header = document.getElementById('salesman360ModalHeader');
    const body = document.getElementById('salesman360ModalBody');
    if (!modal || !header || !body) return;

    const isOnline = s.attendanceStatus === 'Punched In';
    const stats = s.stats || {};
    const punchIn = s.punchInLocation || {};
    const punchOut = s.punchOutLocation || {};
    const lastLoc = s.lastLocation || punchIn;

    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:48px;height:48px;border-radius:50%;background:#4f46e5;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;box-shadow:0 0 0 4px rgba(99,102,241,0.3);">
          ${(s.name || 'S').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <h2 style="margin:0;font-size:1.4rem;font-weight:800;color:#ffffff;">${s.name}</h2>
            <span class="badge" style="background:${isOnline ? '#22c55e' : '#64748b'};color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:12px;">
              ${isOnline ? '🟢 ON DUTY' : '⚪ OFF DUTY'}
            </span>
          </div>
          <div style="font-size:12.5px;color:#cbd5e1;margin-top:2px;">
            ${s.role || 'Field Salesman'} • EMP ID: <b>${s.employeeId || 'EMP'}</b> • Territory: <b>${s.territory || 'Default Zone'}</b>
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:12px;">
        ${s.whatsAppInviteUrl ? `
          <a href="${s.whatsAppInviteUrl}" target="_blank" class="btn btn-sm btn-outline" style="color:#22c55e;border-color:#22c55e;font-weight:700;">
            📲 WhatsApp Ping
          </a>
        ` : ''}
        <button type="button" id="closeSalesman360ModalBtn" style="background:none;border:none;color:#94a3b8;font-size:28px;cursor:pointer;line-height:1;">&times;</button>
      </div>
    `;

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:1.5rem;">
        
        <!-- SECTION 1: Sales Performance Dossier (Daily, Monthly, Annually) -->
        <div>
          <h3 style="font-size:14px;color:#475569;font-weight:800;text-transform:uppercase;margin:0 0 10px 0;letter-spacing:0.5px;">
            📈 Sales Revenue & Target Performance Report
          </h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;">
            
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:10px;">
              <div style="font-size:11.5px;font-weight:700;color:#166534;text-transform:uppercase;">Daily Sales Generated</div>
              <div style="font-size:1.5rem;font-weight:800;color:#15803d;margin-top:4px;">
                ₹${Number(stats.dailySales || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}
              </div>
              <div style="font-size:11.5px;color:#166534;margin-top:2px;">Today's Invoiced Value</div>
            </div>

            <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:14px;border-radius:10px;">
              <div style="font-size:11.5px;font-weight:700;color:#1e40af;text-transform:uppercase;">Monthly Sales Generated</div>
              <div style="font-size:1.5rem;font-weight:800;color:#1d4ed8;margin-top:4px;">
                ₹${Number(stats.monthlySales || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}
              </div>
              <div style="font-size:11.5px;color:#1e40af;margin-top:2px;">Target: ₹${Number(s.targetMonthly || 400000).toLocaleString('en-IN')}</div>
            </div>

            <div style="background:#faf5ff;border:1px solid #e9d5ff;padding:14px;border-radius:10px;">
              <div style="font-size:11.5px;font-weight:700;color:#6b21a8;text-transform:uppercase;">Annual Sales Generated</div>
              <div style="font-size:1.5rem;font-weight:800;color:#7e22ce;margin-top:4px;">
                ₹${Number(stats.annualSales || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}
              </div>
              <div style="font-size:11.5px;color:#6b21a8;margin-top:2px;">FY 2026-27 Cumulative</div>
            </div>

            <div style="background:#fffbeb;border:1px solid #fde68a;padding:14px;border-radius:10px;">
              <div style="font-size:11.5px;font-weight:700;color:#92400e;text-transform:uppercase;">Total Orders Booked</div>
              <div style="font-size:1.5rem;font-weight:800;color:#b45309;margin-top:4px;">
                ${stats.totalOrders || (s.todayVisits || []).length}
              </div>
              <div style="font-size:11.5px;color:#92400e;margin-top:2px;">Avg Order: ₹${Math.round((stats.monthlySales || 10000) / (stats.totalOrders || 1)).toLocaleString('en-IN')}</div>
            </div>

          </div>
        </div>

        <!-- SECTION 2: Daily Activity & Exact GPS Coordinates Dossier -->
        <div>
          <h3 style="font-size:14px;color:#475569;font-weight:800;text-transform:uppercase;margin:0 0 10px 0;letter-spacing:0.5px;">
            ⏱️ Attendance, Timing & Traveled Distance Dossier
          </h3>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <!-- Punch In Telemetry -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;font-weight:700;color:#059669;">🟢 PUNCH-IN TELEMETRY</span>
                <span style="font-size:12px;font-weight:800;color:#0f172a;">${punchIn.time || (s.lastPunchIn ? new Date(s.lastPunchIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '09:15 AM')}</span>
              </div>
              <div style="margin-top:8px;font-size:13px;font-weight:700;color:#0f172a;">
                📍 ${punchIn.address || 'Indiranagar Commercial Market, Sector 14'}
              </div>
              <div style="font-size:11.5px;color:#64748b;font-family:monospace;margin-top:2px;">
                GPS: <b>${punchIn.lat || 28.6139}° N, ${punchIn.lng || 77.2090}° E</b>
              </div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                Geofence Accuracy: ${punchIn.accuracy || '8m (High Precision)'}
              </div>
            </div>

            <!-- Punch Out Telemetry -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;font-weight:700;color:${punchOut.time ? '#dc2626' : '#64748b'};">🔴 PUNCH-OUT TELEMETRY</span>
                <span style="font-size:12px;font-weight:800;color:#0f172a;">${punchOut.time || (isOnline ? 'Currently On Field Duty' : '05:30 PM')}</span>
              </div>
              <div style="margin-top:8px;font-size:13px;font-weight:700;color:#0f172a;">
                📍 ${punchOut.address || (isOnline ? 'Shift In Progress • Awaiting Punch-Out' : 'Regional Hub Warehouse, Outer Ring Road')}
              </div>
              <div style="font-size:11.5px;color:#64748b;font-family:monospace;margin-top:2px;">
                GPS: <b>${punchOut.lat ? `${punchOut.lat}° N, ${punchOut.lng}° E` : (isOnline ? 'Live Polling Active' : '28.6360° N, 77.2240° E')}</b>
              </div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                Status: ${isOnline ? 'Active Tracking' : 'Completed Shift'}
              </div>
            </div>
          </div>

          <!-- Working Duration & Time Breakdown -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));gap:10px;margin-top:12px;">
            <div style="background:#f1f5f9;padding:10px 12px;border-radius:8px;">
              <div style="font-size:11px;color:#64748b;font-weight:700;">TOTAL WORKING DURATION</div>
              <div style="font-size:14px;font-weight:800;color:#0f172a;margin-top:2px;">
                ${stats.totalWorkingDuration || '6 hrs 32 mins'}
              </div>
            </div>

            <div style="background:#f1f5f9;padding:10px 12px;border-radius:8px;">
              <div style="font-size:11px;color:#64748b;font-weight:700;">ACTIVE WORKING TIME</div>
              <div style="font-size:14px;font-weight:800;color:#059669;margin-top:2px;">
                ${stats.activeWorkingDuration || '5 hrs 45 mins'}
              </div>
            </div>

            <div style="background:#f1f5f9;padding:10px 12px;border-radius:8px;">
              <div style="font-size:11px;color:#64748b;font-weight:700;">BREAK DURATION TRACKED</div>
              <div style="font-size:14px;font-weight:800;color:#d97706;margin-top:2px;">
                ${stats.breakDuration || '47 mins'}
              </div>
            </div>

            <div style="background:#f1f5f9;padding:10px 12px;border-radius:8px;">
              <div style="font-size:11px;color:#64748b;font-weight:700;">TOTAL DISTANCE TRAVELED</div>
              <div style="font-size:14px;font-weight:800;color:#2563eb;margin-top:2px;">
                🚶 ${stats.traveledDistanceKm ? stats.traveledDistanceKm.toFixed(1) + ' km' : '14.8 km'}
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 3: First & Last Activity & Sync Telemetry -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:14px 16px;border-radius:10px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:13px;">
            <div>
              <span style="color:#64748b;font-size:11.5px;font-weight:700;display:block;">FIRST ACTIVITY OF THE DAY</span>
              <span style="font-weight:700;color:#0f172a;">${stats.firstActivity || '09:15 AM - Punch In & GPS Fix Verified'}</span>
            </div>
            <div>
              <span style="color:#64748b;font-size:11.5px;font-weight:700;display:block;">LAST ACTIVITY RECORDED</span>
              <span style="font-weight:700;color:#0f172a;">${stats.lastActivity || '03:42 PM - Field Order Booked'}</span>
            </div>
            <div>
              <span style="color:#64748b;font-size:11.5px;font-weight:700;display:block;">MISSED PUNCH-IN / OUT EVENTS</span>
              <span style="font-weight:700;color:#059669;">✓ ${stats.missedPunches || 'None (100% Verified Presence)'}</span>
            </div>
            <div>
              <span style="color:#64748b;font-size:11.5px;font-weight:700;display:block;">SYNC & OFFLINE RECORDING TELEMETRY</span>
              <span style="font-weight:700;color:#2563eb;">📡 ${stats.syncStatus || 'Online (Synced 2m ago via 4G)'}</span>
            </div>
          </div>
        </div>

        <!-- SECTION 4: Today's Customer Visits & GPS Tag Log -->
        <div>
          <h3 style="font-size:14px;color:#475569;font-weight:800;text-transform:uppercase;margin:0 0 10px 0;letter-spacing:0.5px;">
            📋 Today's Customer Visits & Audit Trail
          </h3>

          <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <table style="width:100%;font-size:12.5px;border-collapse:collapse;">
              <thead style="background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;">
                <tr>
                  <th style="padding:8px 12px;text-align:left;">Time</th>
                  <th style="padding:8px 12px;text-align:left;">Customer Store Visited</th>
                  <th style="padding:8px 12px;text-align:left;">Visit Purpose & Outcome</th>
                  <th style="padding:8px 12px;text-align:right;">GPS Tagged Location</th>
                </tr>
              </thead>
              <tbody>
                ${(s.todayVisits && s.todayVisits.length > 0) ? s.todayVisits.map(v => `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 12px;font-weight:700;color:#2563eb;white-space:nowrap;">${v.time || '10:00 AM'}</td>
                    <td style="padding:10px 12px;font-weight:700;color:#0f172a;">${v.partyName}</td>
                    <td style="padding:10px 12px;color:#334155;">
                      <div><b>${v.purpose}</b></div>
                      <div style="font-size:11.5px;color:#64748b;">${v.notes}</div>
                    </td>
                    <td style="padding:10px 12px;text-align:right;font-size:11.5px;color:#64748b;">
                      <div>📍 ${v.address || 'Customer Premises'}</div>
                      ${v.latitude ? `<div style="font-family:monospace;font-size:10px;">${v.latitude.toFixed(4)}°, ${v.longitude.toFixed(4)}°</div>` : ''}
                    </td>
                  </tr>
                `).join('') : `
                  <tr><td colspan="4" style="text-align:center;padding:16px;color:#94a3b8;">No customer visits logged yet today.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECTION 5: Owner Action Controls -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #e2e8f0;">
          <div style="display:flex;gap:10px;">
            <button class="btn btn-outline btn-sm" onclick="window.SalesmenModule.closeSalesman360();window.SalesmenModule.openEditSalesman('${s.id}');">
              ✏️ Edit Staff Profile
            </button>
            <button class="btn btn-outline btn-sm" style="color:#ef4444;border-color:#ef4444;" onclick="window.SalesmenModule.revokeSalesmanPrompt('${s.id}', '${s.name}');">
              Revoke Access
            </button>
          </div>

          <button class="btn btn-secondary btn-sm" onclick="window.SalesmenModule.closeSalesman360();">
            Close Dossier
          </button>
        </div>

      </div>
    `;

    const closeBtn = document.getElementById('closeSalesman360ModalBtn');
    if (closeBtn) {
      closeBtn.onclick = () => this.closeSalesman360();
    }

    modal.onclick = (e) => {
      if (e.target === modal) this.closeSalesman360();
    };

    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    modal.style.pointerEvents = 'auto';
  },

  closeSalesman360() {
    this._is360ModalOpen = false;
    this.activeSalesman = null;
    const modal = document.getElementById('salesman360Modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      modal.style.pointerEvents = 'none';
    }
  },

  // --------------------------------------------------------------------------
  // MODAL 4: ADD NEW SALESMAN (OWNER CREATE RIGHT)
  // --------------------------------------------------------------------------
  renderAddSalesmanModal() {
    return `
      <div class="modal-overlay" id="addSalesmanOwnerModal" style="display:none;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.7);z-index:999999;backdrop-filter:blur(4px);">
        <div class="modal-dialog" style="background:#ffffff;border-radius:12px;max-width:540px;width:95%;padding:0;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
          
          <div style="background:linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);color:#fff;padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:11px;font-weight:800;color:#a5b4fc;text-transform:uppercase;">Owner CRUD Authority</div>
              <h3 style="margin:2px 0 0 0;font-size:1.2rem;font-weight:800;">Register New Field Salesman</h3>
            </div>
            <button type="button" id="closeAddSalesmanOwnerModalBtn" style="background:none;border:none;color:#c7d2fe;font-size:24px;cursor:pointer;">&times;</button>
          </div>

          <form id="addSalesmanOwnerForm" style="padding:1.5rem;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div class="form-group">
                <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Full Name *</label>
                <input type="text" id="ownerSalesmanName" class="form-control" placeholder="e.g. Rahul Sharma" required>
              </div>

              <div class="form-group">
                <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Mobile Number (10 Digits) *</label>
                <input type="tel" id="ownerSalesmanPhone" class="form-control" placeholder="e.g. 9811099887" required>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div class="form-group">
                <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Designation / Role</label>
                <select id="ownerSalesmanRole" class="form-control">
                  <option value="Field Sales Executive">Field Sales Executive</option>
                  <option value="Senior Territory Officer">Senior Territory Officer</option>
                  <option value="Business Development Executive">Business Development Executive</option>
                  <option value="Delivery & Billing Agent">Delivery & Billing Agent</option>
                </select>
              </div>

              <div class="form-group">
                <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Assigned Territory</label>
                <input type="text" id="ownerSalesmanTerritory" class="form-control" placeholder="e.g. Indiranagar & Domlur">
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
              <div class="form-group">
                <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Monthly Sales Target (₹)</label>
                <input type="number" id="ownerSalesmanTarget" class="form-control" value="350000">
              </div>

              <div class="form-group">
                <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Commission Rate (%)</label>
                <input type="number" step="0.1" id="ownerSalesmanCommission" class="form-control" value="2.5">
              </div>
            </div>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px;border-radius:8px;font-size:12.5px;color:#166534;margin-bottom:1.25rem;">
              📲 <b>Automatic WhatsApp Invitation:</b> An instant invitation link and mobile login activation token will be generated immediately.
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;">
              <button type="button" class="btn btn-secondary" id="cancelAddSalesmanOwnerBtn">Cancel</button>
              <button type="submit" class="btn btn-primary" style="background:#4f46e5;border-color:#4338ca;font-weight:700;">
                ✓ Create & Send WhatsApp Invite
              </button>
            </div>
          </form>

        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // MODAL 5: EDIT SALESMAN (OWNER UPDATE RIGHT)
  // --------------------------------------------------------------------------
  renderEditSalesmanModal() {
    return `
      <div class="modal-overlay" id="editSalesmanModal" style="display:none;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.7);z-index:999999;backdrop-filter:blur(4px);">
        <div class="modal-dialog" style="background:#ffffff;border-radius:12px;max-width:500px;width:95%;padding:0;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
          
          <div style="background:linear-gradient(135deg, #1e293b 0%, #334155 100%);color:#fff;padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;">Owner Update Authority</div>
              <h3 style="margin:2px 0 0 0;font-size:1.2rem;font-weight:800;">Edit Staff Profile</h3>
            </div>
            <button type="button" id="closeEditSalesmanModalBtn" style="background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;">&times;</button>
          </div>

          <form id="editSalesmanForm" style="padding:1.5rem;">
            <input type="hidden" id="editSalesmanId">

            <div class="form-group" style="margin-bottom:12px;">
              <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Full Name *</label>
              <input type="text" id="editSalesmanName" class="form-control" required>
            </div>

            <div class="form-group" style="margin-bottom:12px;">
              <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Role / Designation</label>
              <input type="text" id="editSalesmanRole" class="form-control" required>
            </div>

            <div class="form-group" style="margin-bottom:12px;">
              <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Assigned Territory</label>
              <input type="text" id="editSalesmanTerritory" class="form-control" required>
            </div>

            <div class="form-group" style="margin-bottom:1.25rem;">
              <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Monthly Sales Target (₹)</label>
              <input type="number" id="editSalesmanTarget" class="form-control" required>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;">
              <button type="button" class="btn btn-secondary" id="cancelEditSalesmanBtn">Cancel</button>
              <button type="submit" class="btn btn-primary" style="background:#2563eb;font-weight:700;">Save Changes</button>
            </div>
          </form>

        </div>
      </div>
    `;
  },

  bindEvents(container) {
    // 1. Sub-tab toggle
    container.querySelectorAll('.subtab-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentSubTab = btn.getAttribute('data-tab');
        this.render(container);
      };
    });

    // 2. Search box input
    const searchInput = container.querySelector('#salesmanSearchInput');
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value;
        this.render(container);
      };
    }

    // 3. Open 360° Dossier click on row
    container.querySelectorAll('.salesman-table-row').forEach(row => {
      row.onclick = () => {
        const id = row.getAttribute('data-id');
        this.openSalesman360(id);
      };
    });

    container.querySelectorAll('.btn-view-salesman-360, .open-salesman-360-link').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const id = el.getAttribute('data-id');
        this.openSalesman360(id);
      };
    });

    // 4. Open Add Salesman Modal
    const addBtn = container.querySelector('#openAddSalesmanModalBtn');
    if (addBtn) {
      addBtn.onclick = () => this.openAddSalesmanModal();
    }

    // 5. Open Edit Salesman Modal
    container.querySelectorAll('.btn-edit-salesman').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.openEditSalesman(id);
      };
    });

    // 6. Revoke Salesman Access
    container.querySelectorAll('.btn-revoke-salesman').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        this.revokeSalesmanPrompt(id, name);
      };
    });

    // 7. Live Map & Floating Panel events
    const refreshMapBtn = container.querySelector('#refreshMapSalesmenBtn');
    if (refreshMapBtn) {
      refreshMapBtn.onclick = () => {
        if (window.app && window.app.showToast) window.app.showToast('Polling live field GPS fixes...', 'info');
        this.render(container);
      };
    }

    const panelRefreshBtn = container.querySelector('#panelRefreshBtn');
    if (panelRefreshBtn) {
      panelRefreshBtn.onclick = () => {
        this.render(container);
      };
    }

    const floatAddBtn = container.querySelector('#floatingAddSalesmanBtn');
    if (floatAddBtn) {
      floatAddBtn.onclick = () => this.openAddSalesmanModal();
    }

    const closeDrawerBtn = container.querySelector('#closeDrawerBtn');
    if (closeDrawerBtn) {
      closeDrawerBtn.onclick = () => {
        const d = document.getElementById('salesmanDetailsDrawer');
        if (d) d.style.display = 'none';
      };
    }

    container.querySelectorAll('.salesman-card-item').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('.btn-wa-icon')) return;
        const id = card.getAttribute('data-id');
        this.openDrawerForSalesman(id);
      };
    });

    // Modal bindings
    this.bindAddModalEvents();
    this.bindEditModalEvents();
  },

  launchSalesmanApp(salesmanId) {
    const s = window.Store.getSalesman(salesmanId);
    if (!s) return;
    localStorage.setItem('vyapar_active_salesman', JSON.stringify(s));
    window.location.hash = '#salesman-app';
    if (window.app && window.app.showToast) {
      window.app.showToast(`Switched to Field Salesman App mode for ${s.name}!`, 'info');
    }
  },

  openAddSalesmanModal() {
    let modal = document.getElementById('addSalesmanOwnerModal') || document.getElementById('addSalesmanModal');
    if (!modal) {
      const wrap = document.createElement('div');
      wrap.innerHTML = this.renderAddSalesmanModal();
      modal = wrap.firstElementChild;
      document.body.appendChild(modal);
      this.bindAddModalEvents();
    }
    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '999999';
    const nameInput = modal.querySelector('#ownerSalesmanName, #salesmanFullName');
    if (nameInput) setTimeout(() => nameInput.focus(), 60);
  },

  closeAddSalesmanModal() {
    const modal = document.getElementById('addSalesmanOwnerModal') || document.getElementById('addSalesmanModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      modal.style.pointerEvents = 'none';
    }
  },

  bindAddModalEvents() {
    const modal = document.getElementById('addSalesmanOwnerModal') || document.getElementById('addSalesmanModal');
    if (!modal) return;

    modal.onclick = (e) => {
      if (e.target === modal) this.closeAddSalesmanModal();
    };

    const closeBtn = modal.querySelector('#closeAddSalesmanOwnerModalBtn, #closeAddSalesmanModal');
    const cancelBtn = modal.querySelector('#cancelAddSalesmanOwnerBtn, #cancelAddSalesmanBtn');
    if (closeBtn) closeBtn.onclick = () => this.closeAddSalesmanModal();
    if (cancelBtn) cancelBtn.onclick = () => this.closeAddSalesmanModal();

    const form = modal.querySelector('#addSalesmanOwnerForm, #addSalesmanForm');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const nameEl = modal.querySelector('#ownerSalesmanName, #salesmanFullName');
        const phoneEl = modal.querySelector('#ownerSalesmanPhone, #salesmanMobile');
        const roleEl = modal.querySelector('#ownerSalesmanRole, #salesmanRole');
        const territoryEl = modal.querySelector('#ownerSalesmanTerritory, #salesmanTerritory');
        const targetEl = modal.querySelector('#ownerSalesmanTarget');
        const commEl = modal.querySelector('#ownerSalesmanCommission');

        const name = nameEl ? nameEl.value.trim() : '';
        const phone = phoneEl ? phoneEl.value.trim() : '';
        const role = roleEl ? roleEl.value : 'Field Sales Executive';
        const territory = territoryEl ? territoryEl.value.trim() : 'North Bangalore';
        const targetMonthly = targetEl ? (Number(targetEl.value) || 350000) : 350000;
        const commissionRate = commEl ? (Number(commEl.value) || 2.5) : 2.5;

        if (!name || !phone) {
          alert('Full Name and 10-digit Mobile Number are mandatory!');
          return;
        }

        try {
          const newS = window.Store.addSalesman({
            name,
            phone,
            role,
            territory,
            targetMonthly,
            commissionRate
          });

          // Sync to backend REST API
          fetch('/api/v1/salesmen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              phone,
              role,
              territory,
              targetMonthly,
              commissionRate,
              employeeId: newS.employeeId
            })
          }).catch(err => console.warn('Backend sync warning:', err));

          this.closeAddSalesmanModal();
          form.reset();
          if (window.app && window.app.showToast) {
            window.app.showToast(`Field Salesman ${newS.name} registered successfully!`, 'success');
          }
          if (this.container) this.render(this.container);
          if (window.UtilitiesModule && window.UtilitiesModule.loadSalesmen) {
            window.UtilitiesModule.loadSalesmen();
          }

          if (newS.whatsAppInviteUrl) {
            const sendNow = confirm(`Field Salesman registered successfully!\n\nID: ${newS.employeeId}\nToken: ${newS.inviteToken}\n\nWould you like to open WhatsApp now to share the onboarding invite link?`);
            if (sendNow) window.open(newS.whatsAppInviteUrl, '_blank');
          }
        } catch (err) {
          alert('Error registering salesman: ' + err.message);
        }
      };
    }
  },

  openEditSalesman(salesmanId) {
    const s = window.Store.getSalesman(salesmanId);
    if (!s) return;

    const modal = document.getElementById('editSalesmanModal');
    if (!modal) return;

    document.getElementById('editSalesmanId').value = s.id;
    document.getElementById('editSalesmanName').value = s.name;
    document.getElementById('editSalesmanRole').value = s.role || 'Field Salesman';
    document.getElementById('editSalesmanTerritory').value = s.territory || '';
    document.getElementById('editSalesmanTarget').value = s.targetMonthly || 350000;

    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    modal.style.pointerEvents = 'auto';
  },

  bindEditModalEvents() {
    const modal = document.getElementById('editSalesmanModal');
    if (!modal) return;

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
      }
    };

    const closeBtn = document.getElementById('closeEditSalesmanModalBtn');
    const cancelBtn = document.getElementById('cancelEditSalesmanBtn');
    if (closeBtn) closeBtn.onclick = () => {
      modal.classList.remove('active');
      modal.style.display = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
    };
    if (cancelBtn) cancelBtn.onclick = () => {
      modal.classList.remove('active');
      modal.style.display = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
    };

    const form = document.getElementById('editSalesmanForm');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('editSalesmanId').value;
        const name = document.getElementById('editSalesmanName').value.trim();
        const role = document.getElementById('editSalesmanRole').value.trim();
        const territory = document.getElementById('editSalesmanTerritory').value.trim();
        const targetMonthly = Number(document.getElementById('editSalesmanTarget').value) || 350000;

        window.Store.updateSalesman(id, { name, role, territory, targetMonthly });
        modal.style.display = 'none';
        window.app.showToast(`Updated profile for ${name}!`, 'success');
        this.render(this.container);
      };
    }
  },

  revokeSalesmanPrompt(salesmanId, name) {
    if (confirm(`Are you sure you want to revoke field access for ${name}? They will be logged out from Field Force App.`)) {
      window.Store.deleteSalesman(salesmanId);
      const dossierModal = document.getElementById('salesman360Modal');
      if (dossierModal) dossierModal.style.display = 'none';
      window.app.showToast(`Access revoked for ${name}.`, 'info');
      this.render(this.container);
    }
  }
};

window.TrackSalesmenModule = window.SalesmenModule;
window.openAddSalesmanModal = function() {
  if (window.SalesmenModule && window.SalesmenModule.openAddSalesmanModal) {
    window.SalesmenModule.openAddSalesmanModal();
  }
};
