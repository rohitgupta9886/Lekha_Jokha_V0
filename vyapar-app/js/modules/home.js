// ==============================================================================
// Lekha Jokha - Landing & Product Home Page Module
// High-conversion, aesthetic first page with login, registration & live demo
// ==============================================================================

window.HomeModule = {
  render(container) {
    if (!container) return;

    const isAuthed = window.Store && !!window.Store.getAuthToken();
    let currentUser = null;
    let activeBusiness = null;

    if (isAuthed && window.Store) {
      currentUser = window.Store.getCurrentUser();
      activeBusiness = window.Store.getBusiness();
    }

    const currentYear = new Date().getFullYear();

    container.innerHTML = `
      <div class="home-page" id="homePageRoot">
        <!-- Top Sticky Navigation Bar -->
        <header class="home-nav-container">
          <div class="home-nav">
            <div class="home-brand" id="homeBrandLogoLink" style="display:flex;align-items:center;">
              <img src="assets/app-logo.png" alt="Lekha Jokha" style="height:44px;max-width:210px;object-fit:contain;filter:drop-shadow(0 3px 10px rgba(0,0,0,0.18));">
            </div>

            <ul class="home-nav-links">
              <li><a href="#home" class="home-nav-link" style="color:#ed1a3b;">Home</a></li>
              <li><a href="#features-section" class="home-nav-link">Features</a></li>
              <li><a href="#salesman-radar-section" class="home-nav-link">Salesman Radar</a></li>
              <li><a href="#multi-biz-section" class="home-nav-link">5-in-1 Multi-Business</a></li>
              <li><a href="#pricing-section" class="home-nav-link">SaaS Pricing</a></li>
            </ul>

            <div class="home-nav-actions">
              ${isAuthed ? `
                <div class="home-user-pill">
                  <span>👤</span>
                  <span style="font-weight:700;">${currentUser?.name || 'Admin'}</span>
                  ${activeBusiness?.name ? `<span style="color:#64748b;font-size:11.5px;">(${activeBusiness.name})</span>` : ''}
                </div>
                <a href="#dashboard" class="home-btn-cta" id="homeNavDashboardBtn">
                  <span>🚀 Go to Dashboard &rarr;</span>
                </a>
              ` : `
                <button type="button" class="home-btn-login" id="homeNavLoginBtn">
                  <span>🔑 Sign In / Login</span>
                </button>
                <button type="button" class="home-btn-cta" id="homeNavRegisterBtn">
                  <span>✨ Get Started Free</span>
                </button>
              `}
            </div>
          </div>
        </header>

        <!-- Hero Section -->
        <section class="home-hero-section">
          <div class="home-hero-container">
            <div class="home-pill-badge">
              <span>🇮🇳</span>
              <span>Bharat's #1 Offline-First GST Invoicing & Live Salesman GPS Suite</span>
            </div>

            <h1 class="home-hero-title">
              Fast GST Invoicing, Live Field Radar & <span class="home-hero-highlight">Multi-Business Control</span>
            </h1>

            <p class="home-hero-subtitle">
              Issue professional GST invoices in under 10 seconds, track field salesmen in real time with GPS telemetry, manage up to 5 distinct businesses under 1 account, and collect payments faster via automated WhatsApp reminders.
            </p>

            <div class="home-hero-cta-group">
              ${isAuthed ? `
                <a href="#dashboard" class="home-btn-large-primary" id="homeHeroDashboardBtn">
                  <span>🚀 Launch Business Dashboard &rarr;</span>
                </a>
                <button type="button" class="home-btn-large-secondary" id="homeHeroSwitchAccountBtn">
                  <span>👤 Switch Account / Re-Login</span>
                </button>
              ` : `
                <button type="button" class="home-btn-large-primary" id="homeHeroLoginBtn">
                  <span>🔑 Sign In to Your Account &rarr;</span>
                </button>
                <button type="button" class="home-btn-large-secondary" id="homeHeroRegisterBtn">
                  <span>✨ Create Business Free</span>
                </button>
                <button type="button" class="home-btn-demo-badge" id="homeHeroDemoBtn" title="Instant 1-Click Demo Login as Admin">
                  <span>⚡ 1-Click Instant Demo</span>
                </button>
              `}
            </div>

            <div class="home-trust-strip">
              <div class="home-trust-item"><span class="home-trust-check">✓</span> 100% GST & E-Way Bill Ready</div>
              <div class="home-trust-item"><span class="home-trust-check">✓</span> Zero-Internet Offline Mode</div>
              <div class="home-trust-item"><span class="home-trust-check">✓</span> 5 Businesses Per Account</div>
              <div class="home-trust-item"><span class="home-trust-check">✓</span> Real-Time GPS Fleet Radar</div>
              <div class="home-trust-item"><span class="home-trust-check">✓</span> Automated WhatsApp Slips</div>
            </div>

            <!-- Interactive Live Mockup Preview -->
            <div class="home-preview-wrapper">
              <div class="home-preview-bar">
                <div class="home-preview-dots">
                  <span class="home-preview-dot red"></span>
                  <span class="home-preview-dot yellow"></span>
                  <span class="home-preview-dot green"></span>
                </div>
                <div class="home-preview-tabs">
                  <button type="button" class="home-preview-tab-btn active" data-tab="pos">⚡ 10s POS Billing</button>
                  <button type="button" class="home-preview-tab-btn" data-tab="radar">📍 Salesman GPS Radar</button>
                  <button type="button" class="home-preview-tab-btn" data-tab="multibiz">🏢 5-in-1 Multi-Business</button>
                </div>
                <div style="font-size:11.5px;color:#94a3b8;font-weight:600;display:flex;align-items:center;gap:6px;">
                  <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px #10b981;"></span>
                  <span>Live App Preview</span>
                </div>
              </div>

              <div class="home-preview-viewport" id="homePreviewContent">
                <!-- Dynamic Mockup Body (Switched via Tab) -->
                <div class="home-kpi-row">
                  <div class="home-kpi-card">
                    <div class="home-kpi-label">Today's Total Sales</div>
                    <div class="home-kpi-value">₹48,290</div>
                    <div class="home-kpi-trend">↑ 18.4% vs yesterday</div>
                  </div>
                  <div class="home-kpi-card">
                    <div class="home-kpi-label">Invoices Generated</div>
                    <div class="home-kpi-value">36 Bills</div>
                    <div class="home-kpi-trend">⚡ Avg 7.8 sec / bill</div>
                  </div>
                  <div class="home-kpi-card">
                    <div class="home-kpi-label">Active Field Salesmen</div>
                    <div class="home-kpi-value">4 Online</div>
                    <div class="home-kpi-trend" style="color:#0284c7;">📍 All routes monitored</div>
                  </div>
                  <div class="home-kpi-card">
                    <div class="home-kpi-label">Active Business</div>
                    <div class="home-kpi-value" style="font-size:17px;color:#e11d48;">Sharma Traders</div>
                    <div class="home-kpi-trend" style="color:#64748b;">Plan: MAX (5 Biz Allowed)</div>
                  </div>
                </div>

                <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
                    <div>
                      <h4 style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">Recent Counter Transactions (Fast POS)</h4>
                      <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">Instant barcode scan, auto CGST/SGST, and thermal printing</p>
                    </div>
                    <button class="btn btn-sm btn-primary" id="previewActionBtn" style="font-size:12px;">
                      + Open Full POS Counter &rarr;
                    </button>
                  </div>

                  <div style="overflow-x:auto;">
                    <table style="width:100%;font-size:12.5px;border-collapse:collapse;">
                      <thead>
                        <tr style="background:#f8fafc;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0;">
                          <th style="padding:8px 12px;">Invoice #</th>
                          <th style="padding:8px 12px;">Party / Customer</th>
                          <th style="padding:8px 12px;">Items</th>
                          <th style="padding:8px 12px;">Tax Type</th>
                          <th style="padding:8px 12px;text-align:right;">Amount (₹)</th>
                          <th style="padding:8px 12px;text-align:center;">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style="border-bottom:1px solid #f1f5f9;">
                          <td style="padding:9px 12px;font-weight:700;color:#0f172a;">#INV-2026-089</td>
                          <td style="padding:9px 12px;">Rajesh General Store</td>
                          <td style="padding:9px 12px;">Tata Tea Gold (5kg), Fortune Oil</td>
                          <td style="padding:9px 12px;"><span style="background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-size:10.5px;font-weight:700;">Intra-state (CGST+SGST)</span></td>
                          <td style="padding:9px 12px;text-align:right;font-weight:800;color:#0f172a;">₹4,850.00</td>
                          <td style="padding:9px 12px;text-align:center;"><span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">PAID (UPI)</span></td>
                        </tr>
                        <tr style="border-bottom:1px solid #f1f5f9;">
                          <td style="padding:9px 12px;font-weight:700;color:#0f172a;">#INV-2026-088</td>
                          <td style="padding:9px 12px;">Gupta Electronics</td>
                          <td style="padding:9px 12px;">Havells LED Panel 15W (x10)</td>
                          <td style="padding:9px 12px;"><span style="background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-size:10.5px;font-weight:700;">Intra-state (CGST+SGST)</span></td>
                          <td style="padding:9px 12px;text-align:right;font-weight:800;color:#0f172a;">₹8,200.00</td>
                          <td style="padding:9px 12px;text-align:center;"><span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">PAID (CASH)</span></td>
                        </tr>
                        <tr>
                          <td style="padding:9px 12px;font-weight:700;color:#0f172a;">#INV-2026-087</td>
                          <td style="padding:9px 12px;">Shree Balaji Traders</td>
                          <td style="padding:9px 12px;">Basmati Rice Premium (20 bags)</td>
                          <td style="padding:9px 12px;"><span style="background:#fae8ff;color:#86198f;padding:2px 6px;border-radius:4px;font-size:10.5px;font-weight:700;">Inter-state (IGST 5%)</span></td>
                          <td style="padding:9px 12px;text-align:right;font-weight:800;color:#0f172a;">₹26,400.00</td>
                          <td style="padding:9px 12px;text-align:center;"><span style="background:#fef3c7;color:#b45309;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">PARTIAL</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Core Feature Highlights Section -->
        <section class="home-section" id="features-section">
          <div class="home-section-header">
            <span class="home-section-tag">BUILT FOR REAL INDIAN COMMERCE</span>
            <h2 class="home-section-title">Everything Your Business Needs to Grow & Scale</h2>
            <p class="home-section-desc">Designed with obsession for speed, offline resilience, and Indian GST tax rules. Replace messy paper bills and complex accounting with 1 modern tool.</p>
          </div>

          <div class="home-grid-3">
            <!-- Feature 1 -->
            <div class="home-feature-card">
              <div class="home-card-icon" style="background:#fef2f2;color:#ef4444;">🧾</div>
              <h3 class="home-card-title">10-Second GST Invoicing</h3>
              <p class="home-card-desc">Generate B2B and B2C tax invoices in seconds. Auto-calculates CGST, SGST, IGST, reverse charges, round-offs, and generates instant thermal receipts.</p>
              <div class="home-card-tags">
                <span class="home-tag">B2B & B2C</span>
                <span class="home-tag">E-Way Bill</span>
                <span class="home-tag">Thermal & A4 Print</span>
              </div>
            </div>

            <!-- Feature 2 -->
            <div class="home-feature-card" id="salesman-radar-section">
              <div class="home-card-icon" style="background:#f0fdf4;color:#16a34a;">🛰️</div>
              <h3 class="home-card-title">Live Salesman GPS Radar</h3>
              <p class="home-card-desc">Track field salesmen live on an interactive radar map. Field staff book orders on customer visits, and the orders sync directly into owner billing in real time.</p>
              <div class="home-card-tags">
                <span class="home-tag">Live GPS</span>
                <span class="home-tag">Route History</span>
                <span class="home-tag">Mobile Order Booking</span>
              </div>
            </div>

            <!-- Feature 3 -->
            <div class="home-feature-card" id="multi-biz-section">
              <div class="home-card-icon" style="background:#eff6ff;color:#2563eb;">🏢</div>
              <h3 class="home-card-title">5-in-1 Multi-Business Hub</h3>
              <p class="home-card-desc">Operate up to 5 different companies, branches, or retail shops under one master account. Zero ledger mixing with strict tenant database isolation.</p>
              <div class="home-card-tags">
                <span class="home-tag">Up to 5 Entities</span>
                <span class="home-tag">1-Click Switch</span>
                <span class="home-tag">Separate GSTINs</span>
              </div>
            </div>

            <!-- Feature 4 -->
            <div class="home-feature-card">
              <div class="home-card-icon" style="background:#fdf4ff;color:#c026d3;">⚡</div>
              <h3 class="home-card-title">Fast POS Touch Billing</h3>
              <p class="home-card-desc">Engineered for supermarkets, retail counters, and busy wholesale desks. Supports barcode scanning, quick cash buttons, and hotkeys (F1-F12).</p>
              <div class="home-card-tags">
                <span class="home-tag">Barcode Scanners</span>
                <span class="home-tag">Touch Screen</span>
                <span class="home-tag">Speed Checkout</span>
              </div>
            </div>

            <!-- Feature 5 -->
            <div class="home-feature-card">
              <div class="home-card-icon" style="background:#fffbeb;color:#d97706;">💬</div>
              <h3 class="home-card-title">WhatsApp Reminders & Ledger</h3>
              <p class="home-card-desc">Send bills, payment receipts, and outstanding Udhar balance reminders directly to party WhatsApp in Hindi or English with UPI pay links.</p>
              <div class="home-card-tags">
                <span class="home-tag">WhatsApp API</span>
                <span class="home-tag">Payment Links</span>
                <span class="home-tag">Udhar Khata</span>
              </div>
            </div>

            <!-- Feature 6 -->
            <div class="home-feature-card">
              <div class="home-card-icon" style="background:#f8fafc;color:#0f172a;border:1px solid #e2e8f0;">🛡️</div>
              <h3 class="home-card-title">Zero-Internet Offline-First</h3>
              <p class="home-card-desc">Network down? No problem. The app continues working 100% offline using local cryptographic cache and syncs seamlessly once connectivity returns.</p>
              <div class="home-card-tags">
                <span class="home-tag">100% Offline</span>
                <span class="home-tag">Auto Delta Sync</span>
                <span class="home-tag">Never Stops</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Comparison Table Section -->
        <section class="home-comparison-section">
          <div class="home-section-header" style="margin-bottom:2.5rem;">
            <span class="home-section-tag">WHY BUSINESSES SWITCH</span>
            <h2 class="home-section-title">Lekha Jokha vs Outdated Software</h2>
            <p class="home-section-desc">See why modern business owners are replacing slow, clunky tools with Lekha Jokha.</p>
          </div>

          <div class="home-table-wrap">
            <table class="home-comp-table">
              <thead>
                <tr>
                  <th style="width:40%;">Capability / Feature</th>
                  <th class="home-comp-highlight" style="width:30%;">⚡ Lekha Jokha Pro</th>
                  <th style="width:30%;">Old Paper / Clunky Desktop Tools</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Works When Internet Drops</strong></td>
                  <td class="home-comp-highlight">✓ 100% Full Offline Capability</td>
                  <td style="color:#ef4444;">✗ Freezes or requires manual retry</td>
                </tr>
                <tr>
                  <td><strong>Salesman Tracking & Ordering</strong></td>
                  <td class="home-comp-highlight">✓ Built-in Live GPS Radar & Mobile App</td>
                  <td style="color:#ef4444;">✗ None (requires expensive 3rd party apps)</td>
                </tr>
                <tr>
                  <td><strong>Multi-Business Support</strong></td>
                  <td class="home-comp-highlight">✓ Up to 5 Businesses Under 1 Plan</td>
                  <td style="color:#ef4444;">✗ Must purchase separate license for each</td>
                </tr>
                <tr>
                  <td><strong>GST Tax Calculations</strong></td>
                  <td class="home-comp-highlight">✓ Automated CGST, SGST, IGST & HSN</td>
                  <td style="color:#ef4444;">✗ Manual tax configuration prone to errors</td>
                </tr>
                <tr>
                  <td><strong>Customer Payment Reminders</strong></td>
                  <td class="home-comp-highlight">✓ 1-Click WhatsApp Reminders in Hindi & Eng</td>
                  <td style="color:#ef4444;">✗ Manual phone calls & paper ledgers</td>
                </tr>
                <tr>
                  <td><strong>Setup & Learning Curve</strong></td>
                  <td class="home-comp-highlight">✓ Ready in 60 seconds (No training required)</td>
                  <td style="color:#ef4444;">✗ Requires weeks of accounting training</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Pricing Plans Section -->
        <section class="home-section" id="pricing-section">
          <div class="home-section-header">
            <span class="home-section-tag">TRANSPARENT SAAS PLANS</span>
            <h2 class="home-section-title">Simple, Honest Pricing for Every Scale</h2>
            <p class="home-section-desc">Start free today and upgrade as your business expands across stores and field staff.</p>
          </div>

          <div class="home-pricing-grid">
            <!-- Free -->
            <div class="home-price-card">
              <div class="home-price-title">Starter (Free)</div>
              <p style="color:#64748b;font-size:13px;margin:0;">For solo entrepreneurs & small retailers</p>
              <div class="home-price-num">₹0 <span class="home-price-period">/ forever</span></div>
              <ul class="home-price-features">
                <li><span class="check">✓</span> 1 Business Entity</li>
                <li><span class="check">✓</span> Unlimited GST Invoices</li>
                <li><span class="check">✓</span> Offline-First Engine</li>
                <li><span class="check">✓</span> Basic Reports</li>
              </ul>
              <button class="btn btn-outline home-plan-select-btn" data-plan="Free" style="width:100%;font-weight:700;">
                Get Started Free
              </button>
            </div>

            <!-- Silver -->
            <div class="home-price-card">
              <div class="home-price-title">Silver Pro</div>
              <p style="color:#64748b;font-size:13px;margin:0;">For retail shops & growing distributors</p>
              <div class="home-price-num">₹1,499 <span class="home-price-period">/ year</span></div>
              <ul class="home-price-features">
                <li><span class="check">✓</span> 2 Businesses Included</li>
                <li><span class="check">✓</span> 3 Staff Logins (RBAC)</li>
                <li><span class="check">✓</span> Multi-Device Real-Time Sync</li>
                <li><span class="check">✓</span> Barcode Generation & POS</li>
              </ul>
              <button class="btn btn-outline home-plan-select-btn" data-plan="Silver" style="width:100%;font-weight:700;">
                Choose Silver Pro
              </button>
            </div>

            <!-- Gold -->
            <div class="home-price-card">
              <div class="home-price-title">Gold Enterprise</div>
              <p style="color:#64748b;font-size:13px;margin:0;">For wholesalers & multi-counter stores</p>
              <div class="home-price-num">₹2,999 <span class="home-price-period">/ year</span></div>
              <ul class="home-price-features">
                <li><span class="check">✓</span> 3 Businesses Included</li>
                <li><span class="check">✓</span> 10 Staff Roles & Permissions</li>
                <li><span class="check">✓</span> Automated WhatsApp Alerts</li>
                <li><span class="check">✓</span> E-Way Bill & Tally Import/Export</li>
              </ul>
              <button class="btn btn-outline home-plan-select-btn" data-plan="Gold" style="width:100%;font-weight:700;">
                Choose Gold
              </button>
            </div>

            <!-- Max -->
            <div class="home-price-card popular">
              <div class="home-popular-badge">MOST POPULAR • BEST VALUE</div>
              <div class="home-price-title">Max Ultimate</div>
              <p style="color:#64748b;font-size:13px;margin:0;">For enterprises with field salesmen</p>
              <div class="home-price-num">₹4,999 <span class="home-price-period">/ year</span></div>
              <ul class="home-price-features">
                <li><span class="check">✓</span> <strong>Full 5 Businesses Allowed</strong></li>
                <li><span class="check">✓</span> <strong>Live Salesman GPS Radar & App</strong></li>
                <li><span class="check">✓</span> Unlimited Multi-Device Sessions</li>
                <li><span class="check">✓</span> Dedicated Tenant Cloud DB</li>
                <li><span class="check">✓</span> Priority 24/7 WhatsApp Support</li>
              </ul>
              <button class="btn btn-primary home-plan-select-btn" data-plan="Max" style="width:100%;font-weight:700;">
                Get Max Ultimate
              </button>
            </div>
          </div>
        </section>

        <!-- Big CTA Bottom Banner -->
        <div style="padding:0 1.5rem;">
          <div class="home-cta-banner">
            <h2 class="home-cta-banner-title">Ready to Transform Your Business Accounting?</h2>
            <p class="home-cta-banner-desc">Join thousands of smart retailers and distributors across India. Generate your first GST bill in less than 60 seconds.</p>
            <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
              ${isAuthed ? `
                <a href="#dashboard" class="home-btn-large-primary" style="background:#ffffff;color:#0f172a;">
                  <span>Enter Dashboard &rarr;</span>
                </a>
              ` : `
                <button type="button" class="home-btn-large-primary" id="homeCtaLoginBtn" style="background:#ffffff;color:#0f172a;">
                  <span>🔑 Sign In to Your Account &rarr;</span>
                </button>
                <button type="button" class="home-btn-large-primary" id="homeCtaRegisterBtn">
                  <span>✨ Create Free Business Account</span>
                </button>
              `}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer class="home-footer">
          <div class="home-footer-inner">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:28px;height:28px;border-radius:8px;background:#ed1a3b;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;">
                ल
              </div>
              <div>
                <strong style="color:#0f172a;">Lekha Jokha Pro</strong> — GST Invoicing, Accounting & Field Staff Telemetry
              </div>
            </div>

            <div class="home-footer-links">
              <a href="#home">Home</a>
              <a href="#features-section">Features</a>
              <a href="#pricing-section">Pricing</a>
              ${isAuthed ? '<a href="#dashboard">Dashboard</a>' : '<a href="#" id="homeFooterLoginLink">Login</a>'}
            </div>

            <div>
              &copy; ${currentYear} Lekha Jokha. Made with ❤️ in India 🇮🇳
            </div>
          </div>
        </footer>
      </div>
    `;

    // Bind Interactive Events
    this.bindEvents(container);
  },

  bindEvents(container) {
    // 1. Navigation Actions
    const navLoginBtn = container.querySelector('#homeNavLoginBtn');
    if (navLoginBtn) {
      navLoginBtn.onclick = () => {
        if (window.UsersModule) window.UsersModule.openAuthModal('login');
      };
    }

    const navRegisterBtn = container.querySelector('#homeNavRegisterBtn');
    if (navRegisterBtn) {
      navRegisterBtn.onclick = () => {
        if (window.UsersModule) window.UsersModule.openAuthModal('register');
      };
    }

    // 2. Hero Actions
    const heroLoginBtn = container.querySelector('#homeHeroLoginBtn');
    if (heroLoginBtn) {
      heroLoginBtn.onclick = () => {
        if (window.UsersModule) window.UsersModule.openAuthModal('login');
      };
    }

    const heroRegisterBtn = container.querySelector('#homeHeroRegisterBtn');
    if (heroRegisterBtn) {
      heroRegisterBtn.onclick = () => {
        if (window.UsersModule) window.UsersModule.openAuthModal('register');
      };
    }

    const heroSwitchBtn = container.querySelector('#homeHeroSwitchAccountBtn');
    if (heroSwitchBtn) {
      heroSwitchBtn.onclick = () => {
        if (window.UsersModule) window.UsersModule.openAuthModal('login');
      };
    }

    // 3. Instant 1-Click Demo Login
    const demoBtn = container.querySelector('#homeHeroDemoBtn');
    if (demoBtn) {
      demoBtn.onclick = async () => {
        try {
          demoBtn.disabled = true;
          demoBtn.innerText = 'Initializing Demo...';
          if (window.Store && window.Store.login) {
            await window.Store.login({
              identifier: 'sharma@sharmatraders.in',
              pin: '1234',
              password: 'password123',
              name: 'Sharma Ji'
            });
            window.location.hash = '#dashboard';
          }
        } catch (err) {
          console.warn("Demo direct login fallback:", err);
          if (window.UsersModule) {
            window.UsersModule.openAuthModal('login');
          }
        } finally {
          demoBtn.disabled = false;
          demoBtn.innerText = '⚡ 1-Click Instant Demo';
        }
      };
    }

    // 4. CTA Banner Actions
    const ctaLoginBtn = container.querySelector('#homeCtaLoginBtn');
    if (ctaLoginBtn) {
      ctaLoginBtn.onclick = () => {
        if (window.UsersModule) window.UsersModule.openAuthModal('login');
      };
    }

    const ctaRegisterBtn = container.querySelector('#homeCtaRegisterBtn');
    if (ctaRegisterBtn) {
      ctaRegisterBtn.onclick = () => {
        if (window.UsersModule) window.UsersModule.openAuthModal('register');
      };
    }

    const footerLoginLink = container.querySelector('#homeFooterLoginLink');
    if (footerLoginLink) {
      footerLoginLink.onclick = (e) => {
        e.preventDefault();
        if (window.UsersModule) window.UsersModule.openAuthModal('login');
      };
    }

    // 5. Plan Selection Buttons
    container.querySelectorAll('.home-plan-select-btn').forEach(btn => {
      btn.onclick = () => {
        const isAuthed = window.Store && !!window.Store.getAuthToken();
        const plan = btn.getAttribute('data-plan');
        if (isAuthed) {
          window.location.hash = '#subscription';
          if (window.SubscriptionModule) {
            window.SubscriptionModule.openUpgradeModal(plan);
          }
        } else {
          if (window.UsersModule) {
            window.UsersModule.openAuthModal('login');
          }
        }
      };
    });

    // 6. Interactive Preview Mockup Tabs
    const previewContent = container.querySelector('#homePreviewContent');
    const tabBtns = container.querySelectorAll('.home-preview-tab-btn');

    tabBtns.forEach(tab => {
      tab.onclick = () => {
        tabBtns.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.getAttribute('data-tab');

        if (!previewContent) return;

        if (mode === 'pos') {
          previewContent.innerHTML = `
            <div class="home-kpi-row">
              <div class="home-kpi-card">
                <div class="home-kpi-label">Today's Total Sales</div>
                <div class="home-kpi-value">₹48,290</div>
                <div class="home-kpi-trend">↑ 18.4% vs yesterday</div>
              </div>
              <div class="home-kpi-card">
                <div class="home-kpi-label">Invoices Generated</div>
                <div class="home-kpi-value">36 Bills</div>
                <div class="home-kpi-trend">⚡ Avg 7.8 sec / bill</div>
              </div>
              <div class="home-kpi-card">
                <div class="home-kpi-label">Active Field Salesmen</div>
                <div class="home-kpi-value">4 Online</div>
                <div class="home-kpi-trend" style="color:#0284c7;">📍 All routes monitored</div>
              </div>
              <div class="home-kpi-card">
                <div class="home-kpi-label">Active Business</div>
                <div class="home-kpi-value" style="font-size:17px;color:#e11d48;">Sharma Traders</div>
                <div class="home-kpi-trend" style="color:#64748b;">Plan: MAX (5 Biz Allowed)</div>
              </div>
            </div>
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem;">
              <h4 style="margin:0 0 0.5rem 0;font-size:15px;font-weight:700;color:#0f172a;">⚡ High-Speed Counter POS (Touch & Barcode)</h4>
              <p style="font-size:12.5px;color:#475569;margin-bottom:1rem;">Scan barcode or press hotkeys to add items with auto-computed CGST/SGST tax split.</p>
              <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
                <div style="flex:1;min-width:200px;background:#f8fafc;padding:0.75rem;border-radius:8px;border:1px dashed #cbd5e1;">
                  <div style="font-size:11px;color:#64748b;font-weight:700;">ACTIVE PRODUCT</div>
                  <div style="font-weight:800;color:#0f172a;">Tata Tea Gold (1kg)</div>
                  <div style="font-size:12px;color:#10b981;font-weight:700;">₹420.00 • In Stock (120 pkts)</div>
                </div>
                <div style="flex:1;min-width:200px;background:#f8fafc;padding:0.75rem;border-radius:8px;border:1px dashed #cbd5e1;">
                  <div style="font-size:11px;color:#64748b;font-weight:700;">CURRENT BILL TOTAL</div>
                  <div style="font-weight:800;color:#0f172a;font-size:18px;">₹1,840.00</div>
                  <div style="font-size:12px;color:#64748b;">Tax Included: CGST (₹82) + SGST (₹82)</div>
                </div>
              </div>
            </div>
          `;
        } else if (mode === 'radar') {
          previewContent.innerHTML = `
            <div style="background:#0f172a;border-radius:10px;padding:1.5rem;color:#ffffff;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
                <div>
                  <h4 style="margin:0;font-size:15px;font-weight:700;color:#38bdf8;">📍 Real-Time Field Salesman GPS Radar</h4>
                  <p style="margin:2px 0 0 0;font-size:12px;color:#94a3b8;">Live GPS telemetry, battery health & customer visit timelines</p>
                </div>
                <span style="background:#22c55e;color:#ffffff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:12px;">● LIVE TRACKING</span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1rem;">
                <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:1rem;">
                  <div style="font-size:11px;color:#38bdf8;font-weight:700;">SALESMAN 1 • NORTH ZONE</div>
                  <div style="font-weight:800;font-size:15px;margin:2px 0;">Amit Verma</div>
                  <div style="font-size:12px;color:#cbd5e1;">📍 Near Chandni Chowk Market</div>
                  <div style="font-size:11.5px;color:#34d399;margin-top:4px;">🔋 88% Battery • 4 Orders Booked</div>
                </div>
                <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:1rem;">
                  <div style="font-size:11px;color:#38bdf8;font-weight:700;">SALESMAN 2 • SOUTH ZONE</div>
                  <div style="font-weight:800;font-size:15px;margin:2px 0;">Pooja Sharma</div>
                  <div style="font-size:12px;color:#cbd5e1;">📍 Lajpat Nagar Central</div>
                  <div style="font-size:11.5px;color:#34d399;margin-top:4px;">🔋 74% Battery • 6 Orders Booked</div>
                </div>
              </div>
            </div>
          `;
        } else if (mode === 'multibiz') {
          previewContent.innerHTML = `
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:1.5rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
                <div>
                  <h4 style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">🏢 5-in-1 Multi-Business Isolation Hub</h4>
                  <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">Manage up to 5 distinct businesses under 1 plan with 1-click switching</p>
                </div>
                <span style="background:#eab308;color:#000;font-size:11px;font-weight:800;padding:2px 8px;border-radius:12px;">MAX PLAN (5/5)</span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:0.75rem;">
                <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:8px;padding:0.85rem;">
                  <div style="font-size:10.5px;color:#166534;font-weight:800;">ACTIVE ENTITY (ACTIVE)</div>
                  <div style="font-weight:800;color:#0f172a;font-size:14px;">Sharma Traders</div>
                  <div style="font-size:11.5px;color:#64748b;">GSTIN: 07AAAAA0000A1Z5</div>
                </div>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.85rem;">
                  <div style="font-size:10.5px;color:#64748b;font-weight:800;">BUSINESS #2</div>
                  <div style="font-weight:800;color:#0f172a;font-size:14px;">Sharma Electronics</div>
                  <div style="font-size:11.5px;color:#64748b;">Separate Books & Stock</div>
                </div>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.85rem;">
                  <div style="font-size:10.5px;color:#64748b;font-weight:800;">BUSINESS #3</div>
                  <div style="font-weight:800;color:#0f172a;font-size:14px;">Apex Distributors</div>
                  <div style="font-size:11.5px;color:#64748b;">Wholesale Goods</div>
                </div>
              </div>
            </div>
          `;
        }
      };
    });

    const previewActionBtn = container.querySelector('#previewActionBtn');
    if (previewActionBtn) {
      previewActionBtn.onclick = () => {
        const isAuthed = window.Store && !!window.Store.getAuthToken();
        if (isAuthed) {
          window.location.hash = '#pos';
        } else {
          if (window.UsersModule) window.UsersModule.openAuthModal('login');
        }
      };
    }

    // 7. Smooth Scroll for Nav Anchor Links
    container.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId && targetId.startsWith('#') && targetId.length > 1) {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  }
};
