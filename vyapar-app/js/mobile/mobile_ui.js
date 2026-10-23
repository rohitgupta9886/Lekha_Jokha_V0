// ==============================================================================
// Lekha Jokha (लेखा जोखा) - Mobile UI Coordinator
// Handles Mobile Header, Bottom Navigation Bar, Action Sheets, Touch Form
// Enhancements, Business Switching & Android Back Navigation
// ==============================================================================

(function() {
  class MobileUIManager {
    constructor() {
      this.isInitialized = false;
      this.activeTab = 'dashboard';
      this.init();
    }

    init() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      // Ensure DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      if (this.isInitialized) return;
      this.isInitialized = true;

      this.renderMobileHeader();
      this.renderBottomNav();
      this.renderActionSheet();
      this.bindEvents();
      this.enhanceFormInputModes();
      this.updateActiveNav();
      this.updateBusinessDisplay();
      this.updateBadges();

      console.log('[Lekha Jokha] Mobile UI Engine initialized successfully.');
    }

    // 1. Sticky Mobile Header
    renderMobileHeader() {
      if (document.getElementById('mobileTopHeader')) return;

      const header = document.createElement('header');
      header.id = 'mobileTopHeader';
      header.className = 'mobile-top-header';
      header.innerHTML = `
        <div class="m-header-left">
          <button class="m-menu-btn" id="mobileMenuBtn" aria-label="Open Navigation Menu" title="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div class="m-brand-biz" id="mobileBusinessSwitcherBtn" title="Switch Business / व्यापार बदलें" style="display:flex;align-items:center;gap:8px;">
            <img src="assets/app-logo.png" alt="Lekha Jokha Logo" style="height:32px;max-width:130px;object-fit:contain;flex-shrink:0;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4));">
            <div style="display:flex;flex-direction:column;min-width:0;">
              <div class="m-biz-pill" id="mobileActiveBizName">
                <span>Sharma Traders</span>
                <span style="font-size:8px;">▼</span>
              </div>
            </div>
          </div>
        </div>

        <div class="m-header-right">
          <!-- Live Barcode Scanner -->
          <button class="m-header-icon-btn" id="mobileScanBarcodeBtn" title="Scan Barcode / बारकोड स्कैन">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"></path><line x1="7" y1="12" x2="17" y2="12"></line></svg>
          </button>

          <!-- Language Switcher (EN/HI) -->
          <button class="m-header-icon-btn m-lang-toggle-btn" id="mobileLangToggleBtn" title="Switch Language / भाषा बदलें">
            <span style="font-size:13px;">🇮🇳</span>
            <b id="mobileLangLabel">हिंदी</b>
          </button>

          <!-- Staff / User Switcher -->
          <button class="m-header-icon-btn" id="mobileUserBtn" title="Staff Role / कर्मचारी">
            <span style="font-size:15px;">👨‍💼</span>
          </button>
        </div>
      `;

      document.body.prepend(header);
    }

    // 2. Fixed Bottom Navigation Bar
    renderBottomNav() {
      if (document.getElementById('mobileBottomNav')) return;

      const nav = document.createElement('nav');
      nav.id = 'mobileBottomNav';
      nav.className = 'mobile-bottom-nav';
      nav.innerHTML = `
        <!-- 1. Dashboard -->
        <a href="#dashboard" class="m-nav-item active" data-tab="dashboard">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span data-i18n="nav.dashboard">Dashboard</span>
        </a>

        <!-- 2. Sales -->
        <a href="#sales" class="m-nav-item" data-tab="sales">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <span data-i18n="nav.sales">Sales</span>
          <span class="m-nav-badge" id="mSalesBadge" style="display:none;">0</span>
        </a>

        <!-- 3. Center Quick Add Button -->
        <div class="m-nav-fab-wrap">
          <button class="m-center-fab" id="mobileCenterFab" aria-label="Quick Actions" title="Add / बनाएं">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <span class="m-nav-fab-label">+ Create</span>
        </div>

        <!-- 4. Purchases -->
        <a href="#purchases" class="m-nav-item" data-tab="purchases">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          <span data-i18n="nav.purchases">Purchases</span>
        </a>

        <!-- 5. Parties & More -->
        <a href="#parties" class="m-nav-item" data-tab="parties">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span data-i18n="nav.parties">Parties</span>
        </a>
      `;

      document.body.appendChild(nav);
    }

    // 3. Quick Action Sheet (Slide up)
    renderActionSheet() {
      if (document.getElementById('mobileActionSheet')) return;

      const backdrop = document.createElement('div');
      backdrop.id = 'mobileActionSheetBackdrop';
      backdrop.className = 'mobile-action-sheet-backdrop';

      const sheet = document.createElement('div');
      sheet.id = 'mobileActionSheet';
      sheet.className = 'mobile-action-sheet';
      sheet.innerHTML = `
        <div class="m-sheet-drag-handle"></div>
        <div class="m-sheet-header">
          <div class="m-sheet-title">⚡ Quick Actions / त्वरित कार्य</div>
          <button class="icon-btn" id="closeMobileActionSheetBtn" style="font-size:20px;">&times;</button>
        </div>

        <div class="m-sheet-grid">
          <!-- Add Sale -->
          <div class="m-sheet-action-card" id="mActionSale">
            <div class="m-sheet-icon" style="background: linear-gradient(135deg, #e11d48, #be123c);">🧾</div>
            <div class="m-sheet-label">+ Sale Invoice</div>
          </div>

          <!-- Add Purchase -->
          <div class="m-sheet-action-card" id="mActionPurchase">
            <div class="m-sheet-icon" style="background: linear-gradient(135deg, #0284c7, #0369a1);">🛒</div>
            <div class="m-sheet-label">+ Purchase Bill</div>
          </div>

          <!-- Add Customer / Supplier -->
          <div class="m-sheet-action-card" id="mActionParty">
            <div class="m-sheet-icon" style="background: linear-gradient(135deg, #10b981, #059669);">👥</div>
            <div class="m-sheet-label">+ Add Party</div>
          </div>

          <!-- Add Item / Product -->
          <div class="m-sheet-action-card" id="mActionItem">
            <div class="m-sheet-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">📦</div>
            <div class="m-sheet-label">+ Add Item</div>
          </div>

          <!-- Barcode Scanner -->
          <div class="m-sheet-action-card" id="mActionBarcode">
            <div class="m-sheet-icon" style="background: linear-gradient(135deg, #475569, #1e293b);">📷</div>
            <div class="m-sheet-label">Scan Barcode</div>
          </div>

          <!-- AI Voice Billing -->
          <div class="m-sheet-action-card" id="mActionAiVoice">
            <div class="m-sheet-icon" style="background: linear-gradient(135deg, #7c3aed, #6d28d9);">✨</div>
            <div class="m-sheet-label">AI Copilot</div>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(sheet);
    }

    // Bind all mobile interactions
    bindEvents() {
      // Menu Hamburger button -> Toggles off-canvas sidebar
      const menuBtn = document.getElementById('mobileMenuBtn');
      if (menuBtn) {
        menuBtn.addEventListener('click', () => {
          if (window.app && window.app.toggleSidebar) {
            window.app.toggleSidebar();
          } else {
            const sb = document.getElementById('sidebar');
            if (sb) sb.classList.toggle('open');
            const bd = document.getElementById('sidebarBackdrop');
            if (bd) bd.classList.toggle('active');
          }
        });
      }

      // Business Switcher Click -> Open Business Switcher
      const bizBtn = document.getElementById('mobileBusinessSwitcherBtn');
      if (bizBtn) {
        bizBtn.addEventListener('click', () => {
          if (window.SubscriptionModule && window.SubscriptionModule.openBusinessSwitchModal) {
            window.SubscriptionModule.openBusinessSwitchModal();
          } else {
            window.location.hash = '#subscription';
          }
        });
      }

      // Barcode Scanner Click
      const scanBtn = document.getElementById('mobileScanBarcodeBtn');
      if (scanBtn) {
        scanBtn.addEventListener('click', () => {
          if (window.BarcodeModule && window.BarcodeModule.openScannerModal) {
            window.BarcodeModule.openScannerModal((item) => {
              if (window.app && window.app.addItemToSaleInvoice) {
                window.app.addItemToSaleInvoice(item.id);
              }
            });
          }
        });
      }

      // Language Switcher Toggle
      const langBtn = document.getElementById('mobileLangToggleBtn');
      if (langBtn) {
        langBtn.addEventListener('click', () => {
          if (window.i18n && window.i18n.toggleLanguage) {
            window.i18n.toggleLanguage();
            this.updateLanguageDisplay();
          }
        });
      }

      // Staff / User Switcher
      const userBtn = document.getElementById('mobileUserBtn');
      if (userBtn) {
        userBtn.addEventListener('click', () => {
          if (window.UsersModule && window.UsersModule.openSwitchModal) {
            const container = document.getElementById('viewContainer');
            if (container) window.UsersModule.openSwitchModal(container);
          } else {
            window.location.hash = '#users';
          }
        });
      }

      // Center FAB -> Open Action Sheet
      const fab = document.getElementById('mobileCenterFab');
      if (fab) {
        fab.addEventListener('click', () => this.openActionSheet());
      }

      // Close Action Sheet
      const closeSheetBtn = document.getElementById('closeMobileActionSheetBtn');
      if (closeSheetBtn) closeSheetBtn.addEventListener('click', () => this.closeActionSheet());
      const sheetBackdrop = document.getElementById('mobileActionSheetBackdrop');
      if (sheetBackdrop) sheetBackdrop.addEventListener('click', () => this.closeActionSheet());

      // Action Sheet Card triggers
      const aSale = document.getElementById('mActionSale');
      if (aSale) {
        aSale.addEventListener('click', () => {
          this.closeActionSheet();
          if (window.app && window.app.openSaleModal) window.app.openSaleModal();
        });
      }

      const aPurchase = document.getElementById('mActionPurchase');
      if (aPurchase) {
        aPurchase.addEventListener('click', () => {
          this.closeActionSheet();
          window.location.hash = '#purchases';
        });
      }

      const aParty = document.getElementById('mActionParty');
      if (aParty) {
        aParty.addEventListener('click', () => {
          this.closeActionSheet();
          if (window.app && window.app.openPartyModal) window.app.openPartyModal();
        });
      }

      const aItem = document.getElementById('mActionItem');
      if (aItem) {
        aItem.addEventListener('click', () => {
          this.closeActionSheet();
          if (window.app && window.app.openItemModal) window.app.openItemModal();
        });
      }

      const aBarcode = document.getElementById('mActionBarcode');
      if (aBarcode) {
        aBarcode.addEventListener('click', () => {
          this.closeActionSheet();
          if (window.BarcodeModule && window.BarcodeModule.openScannerModal) {
            window.BarcodeModule.openScannerModal();
          }
        });
      }

      const aAiVoice = document.getElementById('mActionAiVoice');
      if (aAiVoice) {
        aAiVoice.addEventListener('click', () => {
          this.closeActionSheet();
          window.location.hash = '#ai-copilot';
        });
      }

      // Hash change listener to keep bottom navigation synced
      window.addEventListener('hashchange', () => {
        this.updateActiveNav();
        this.enhanceFormInputModes();
        this.updateBadges();
      });

      // Listen for i18n change events
      window.addEventListener('i18n:change', () => {
        this.updateLanguageDisplay();
      });

      // Intercept Android hardware back button & web back
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.handleBackIntercept();
        }
      });
    }

    openActionSheet() {
      const sheet = document.getElementById('mobileActionSheet');
      const backdrop = document.getElementById('mobileActionSheetBackdrop');
      if (sheet) sheet.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
    }

    closeActionSheet() {
      const sheet = document.getElementById('mobileActionSheet');
      const backdrop = document.getElementById('mobileActionSheetBackdrop');
      if (sheet) sheet.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
    }

    handleBackIntercept() {
      // 1. If Action Sheet is open, close it
      const sheet = document.getElementById('mobileActionSheet');
      if (sheet && sheet.classList.contains('open')) {
        this.closeActionSheet();
        return true;
      }

      // 2. If Sidebar is open, close it
      const sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        if (window.app && window.app.closeSidebar) window.app.closeSidebar();
        return true;
      }

      // 3. If any modal is open, close it
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        activeModal.classList.remove('active');
        return true;
      }

      return false;
    }

    updateActiveNav() {
      const hash = (window.location.hash || '#dashboard').replace('#', '');
      this.activeTab = hash;

      const navItems = document.querySelectorAll('.m-nav-item');
      navItems.forEach(item => {
        const tab = item.getAttribute('data-tab');
        if (tab === hash) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    updateBusinessDisplay() {
      if (!window.Store) return;
      const biz = window.Store.getActiveBusiness();
      const nameEl = document.getElementById('mobileActiveBizName');
      if (nameEl && biz) {
        nameEl.innerHTML = `<span>${biz.name}</span><span style="font-size:8px;">▼</span>`;
      }
    }

    updateLanguageDisplay() {
      if (!window.i18n) return;
      const current = window.i18n.currentLang || 'en';
      const label = document.getElementById('mobileLangLabel');
      if (label) {
        label.innerText = current === 'hi' ? 'EN' : 'हिंदी';
      }
      if (window.i18n.applyToDOM) {
        window.i18n.applyToDOM();
      }
    }

    updateBadges() {
      if (!window.Store) return;
      const sales = window.Store.getSales ? window.Store.getSales() : [];
      const badge = document.getElementById('mSalesBadge');
      if (badge) {
        if (sales.length > 0) {
          badge.innerText = sales.length;
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }
    }

    // Touch Optimization: Inject decimal / numeric keyboards on mobile inputs
    enhanceFormInputModes() {
      const numericFields = [
        'invPaidAmount', 'itemSalePrice', 'itemPurchasePrice', 'itemGstRate',
        'itemStock', 'itemMinStock', 'partyBalance', 'expenseAmount'
      ];

      numericFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.setAttribute('inputmode', 'decimal');
          el.setAttribute('autocomplete', 'off');
        }
      });

      const phoneFields = ['partyPhone', 'userPhone', 'companyPhone'];
      phoneFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.setAttribute('inputmode', 'numeric');
          el.setAttribute('type', 'tel');
        }
      });

      const pinFields = ['partyPincode', 'companyPincode', 'userPin'];
      pinFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.setAttribute('inputmode', 'numeric');
        }
      });
    }
  }

  // Instantiate globally
  window.MobileUI = new MobileUIManager();
})();
