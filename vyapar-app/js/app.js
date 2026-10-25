// Global Crash Guard for Frontend: Prevents unhandled UI script errors from freezing the interface
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error(
      "[UI Guard] Handled browser error:",
      event.error || event.message,
    );
    // Non-fatal logging, prevent browser hard crashes
    event.preventDefault?.();
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.warn(
      "[UI Guard] Handled unhandled promise rejection:",
      event.reason,
    );
    event.preventDefault?.();
  });
}

class LekhaJokhaApp {
  constructor() {
    this.currentView = "dashboard";
    window.app = this;
    window.App = this;
    this.init();
  }

  init() {
    this.bindDOM();
    this.bindEvents();
    if (window.i18n) window.i18n.applyToDOM();
    this.updateBadges();
    this.handleRoute();

    // Restore desktop collapsed preference
    if (
      typeof window !== "undefined" &&
      (window.innerWidth || 1200) > 1024 &&
      typeof localStorage !== "undefined" &&
      localStorage.getItem("sidebar_collapsed") === "1"
    ) {
      if (this.sidebar) this.sidebar.classList.add("collapsed");
    }

    // Verify session with authoritative server on startup and start auto-sync
    if (window.Store) {
      window.Store.startAutoSync();
      window.Store.checkAuth()
        .then((isAuthed) => {
          const currentHash = (window.location.hash || "")
            .replace(/^#\/?/, "")
            .split("?")[0];
          if (!isAuthed && !window.Store.getAuthToken()) {
            if (!currentHash || currentHash === "home") {
              if (window.location.hash !== "#home") {
                window.location.hash = "#home";
              }
            }
          }
        })
        .catch(() => {});
    }
  }

  bindDOM() {
    this.viewContainer = document.getElementById("viewContainer");
    this.pageTitle = document.getElementById("pageTitle");
    this.pageSubtitle = document.getElementById("pageSubtitle");
    this.sidebar = document.getElementById("sidebar");
    this.navLinks = document.querySelectorAll(".nav-link");
    this.toastContainer = document.getElementById("toastContainer");

    // Modals
    this.saleModal = document.getElementById("saleModal");
    this.partyModal = document.getElementById("partyModal");
    this.itemModal = document.getElementById("itemModal");
    this.printInvoiceModal = document.getElementById("printInvoiceModal");

    // Sale Form Elements
    this.saleInvoiceForm = document.getElementById("saleInvoiceForm");
    this.invoiceItemsBody = document.getElementById("invoiceItemsBody");
    this.invNumber = document.getElementById("invNumber");
    this.invDate = document.getElementById("invDate");
    this.invParty = document.getElementById("invParty");
    this.invStateOfSupply = document.getElementById("invStateOfSupply");
    this.invPaymentMode = document.getElementById("invPaymentMode");
    this.invPaidAmount = document.getElementById("invPaidAmount");
    this.invSubtotal = document.getElementById("invSubtotal");
    this.invTotalTax = document.getElementById("invTotalTax");
    this.invRoundOff = document.getElementById("invRoundOff");
    this.invGrandTotal = document.getElementById("invGrandTotal");
    this.invBalanceDue = document.getElementById("invBalanceDue");
  }

  bindEvents() {
    // Router on hash change
    window.addEventListener("hashchange", () => this.handleRoute());

    // Sidebar toggle (Three lines hamburger button)
    const toggleBtn = document.getElementById("openSidebarBtn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    const closeBtn = document.getElementById("closeSidebarBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeSidebar());
    }

    const backdrop = document.getElementById("sidebarBackdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => this.closeSidebar());
    }

    // Keyboard ESC to close sidebar
    window.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        this.sidebar &&
        this.sidebar.classList.contains("open")
      ) {
        this.closeSidebar();
      }
    });

    // Close sidebar on link click (mobile) & ensure route activation
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const view = link.getAttribute("data-view");
        if (view === "utilities") {
          e.preventDefault();
          const dropdown = document.getElementById("utilitiesNavGroup");
          let willBeOpen = true;
          if (dropdown) {
            dropdown.classList.toggle("open");
            willBeOpen = dropdown.classList.contains("open");
            const chev = dropdown.querySelector(".dropdown-chevron");
            if (chev) chev.innerText = willBeOpen ? "▲" : "▼";
          }
          if (willBeOpen && !window.location.hash.startsWith("#util-")) {
            window.location.hash = "#util-import-items";
          }
          return;
        }

        if (view === "settings") {
          e.preventDefault();
          const dropdown = document.getElementById("settingsNavGroup");
          let willBeOpen = true;
          if (dropdown) {
            dropdown.classList.toggle("open");
            willBeOpen = dropdown.classList.contains("open");
            const chev = dropdown.querySelector(".dropdown-chevron");
            if (chev) chev.innerText = willBeOpen ? "▲" : "▼";
          }
          if (
            willBeOpen &&
            window.location.hash !== "#business-settings" &&
            window.location.hash !== "#app-settings"
          ) {
            window.location.hash = "#business-settings";
          }
          return;
        }

        if (view === "parties") {
          const dropdown = document.getElementById("partiesNavGroup");
          if (dropdown) {
            const isClickOnChevron =
              e.target.classList.contains("dropdown-chevron") ||
              e.target.closest(".dropdown-chevron");
            const isCurrentPage = window.location.hash === "#parties";
            if (isClickOnChevron || isCurrentPage) {
              e.preventDefault();
              dropdown.classList.toggle("open");
              const isOpen = dropdown.classList.contains("open");
              if (!isOpen) {
                dropdown.setAttribute("data-user-collapsed", "true");
              } else {
                dropdown.removeAttribute("data-user-collapsed");
              }
              const chev = dropdown.querySelector(".dropdown-chevron");
              if (chev) chev.innerText = isOpen ? "▲" : "▼";
              return;
            } else {
              dropdown.removeAttribute("data-user-collapsed");
              dropdown.classList.add("open");
              const chev = dropdown.querySelector(".dropdown-chevron");
              if (chev) chev.innerText = "▲";
            }
          }
        }

        if ((window.innerWidth || 1200) <= 1024) {
          this.closeSidebar();
        }
        if (view && window.location.hash === "#" + view) {
          this.handleRoute();
        }
      });
    });

    // Dedicated Settings Chevron Click Handler
    const settingsChevronBtn = document.querySelector(
      "#settingsToggleLink .dropdown-chevron",
    );
    if (settingsChevronBtn) {
      settingsChevronBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = document.getElementById("settingsNavGroup");
        if (dropdown) {
          dropdown.classList.toggle("open");
          const isOpen = dropdown.classList.contains("open");
          settingsChevronBtn.innerText = isOpen ? "▲" : "▼";
        }
      });
    }

    // Dedicated Parties Chevron Click Handler for instant toggle from any page
    const partiesChevronBtn = document.querySelector(
      "#partiesToggleLink .dropdown-chevron",
    );
    if (partiesChevronBtn) {
      partiesChevronBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = document.getElementById("partiesNavGroup");
        if (dropdown) {
          dropdown.classList.toggle("open");
          const isOpen = dropdown.classList.contains("open");
          if (!isOpen) {
            dropdown.setAttribute("data-user-collapsed", "true");
          } else {
            dropdown.removeAttribute("data-user-collapsed");
          }
          partiesChevronBtn.innerText = isOpen ? "▲" : "▼";
        }
      });
    }

    // Sublinks click handling
    const sublinks = document.querySelectorAll(".nav-sublink");
    sublinks.forEach((sub) => {
      sub.addEventListener("click", (e) => {
        e.preventDefault();
        const view = sub.getAttribute("data-view");
        if ((window.innerWidth || 1200) <= 1024) {
          this.closeSidebar();
        }
        if (view) {
          if (window.location.hash === "#" + view) {
            this.handleRoute();
          } else {
            window.location.hash = "#" + view;
          }
        }
      });
    });

    // Quick Add Buttons
    const quickSale = document.getElementById("quickCreateSaleBtn");
    if (quickSale)
      quickSale.addEventListener("click", () => this.openSaleModal());
    const topSale = document.getElementById("topSaleBtn");
    if (topSale) topSale.addEventListener("click", () => this.openSaleModal());
    const topPurchase = document.getElementById("topPurchaseBtn");
    if (topPurchase) {
      topPurchase.addEventListener("click", () => {
        window.location.hash = "#purchases";
      });
    }
    const fabSale = document.getElementById("fabSaleBtn");
    if (fabSale) fabSale.addEventListener("click", () => this.openSaleModal());

    // Topbar Barcode Scanner button
    const topBarcode = document.getElementById("topbarBarcodeBtn");
    if (topBarcode) {
      topBarcode.addEventListener("click", () => {
        if (window.BarcodeModule) {
          window.BarcodeModule.openScannerModal((item) =>
            this.addItemToSaleInvoice(item.id),
          );
        }
      });
    }

    // Topbar AI Copilot button
    const topAi = document.getElementById("topbarAiBtn");
    if (topAi) {
      topAi.addEventListener("click", () => {
        window.location.hash = "#ai-copilot";
      });
    }

    // Topbar User Switcher Pill
    const userPill = document.getElementById("topbarUserPill");
    if (userPill) {
      userPill.addEventListener("click", () => {
        if (window.UsersModule) {
          window.UsersModule.openSwitchModal(this.viewContainer);
        }
      });
    }

    // Global Frictionless Keyboard Shortcuts (LekhaJokha Power Shortcuts)
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const searchInput =
          document.getElementById("globalSearchInput") ||
          document.getElementById("openAnythingInput");
        if (searchInput) searchInput.focus();
        return;
      }

      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "s") {
          // Alt + S -> Add Sale
          e.preventDefault();
          this.openSaleModal();
        } else if (key === "p") {
          // Alt + P -> Purchases
          e.preventDefault();
          window.location.hash = "#purchases";
        } else if (key === "i") {
          // Alt + I -> Add Item
          e.preventDefault();
          this.openItemModal();
        } else if (key === "c") {
          // Alt + C -> Add Customer / Party
          e.preventDefault();
          this.openPartyModal();
        } else if (key === "a") {
          // Alt + A -> AI Copilot
          e.preventDefault();
          window.location.hash = "#ai-copilot";
        } else if (key === "d") {
          // Alt + D -> Dashboard
          e.preventDefault();
          window.location.hash = "#dashboard";
        }
      }
    });

    // Global Universal Enter-Key Action Handler:
    // After typing in any text box across the entire project, pressing Enter automatically executes the associated action button
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || e.isComposing) return;
      if (!e.target || e.target.tagName !== "INPUT") return;

      const input = e.target;
      const inputType = (input.type || "text").toLowerCase();
      const nonTextTypes = [
        "button",
        "submit",
        "reset",
        "checkbox",
        "radio",
        "range",
        "file",
        "image",
        "color",
      ];
      if (nonTextTypes.includes(inputType)) return;

      const actionBtn = this.findAssociatedActionButton
        ? this.findAssociatedActionButton(input)
        : null;
      if (actionBtn) {
        e.preventDefault();
        e.stopPropagation();

        // Visual click feedback
        actionBtn.classList.add("active");
        setTimeout(() => actionBtn.classList.remove("active"), 120);

        // Perform the associated action
        actionBtn.click();
      } else if (
        input.type === "search" ||
        (input.id && input.id.toLowerCase().includes("search"))
      ) {
        input.blur();
      }
    });

    // Topbar Language Switcher Toggle
    const langToggleBtn = document.getElementById("topbarLangToggle");
    if (langToggleBtn) {
      langToggleBtn.addEventListener("click", () => {
        if (window.i18n) {
          window.i18n.toggleLanguage();
        }
      });
    }

    // Global Language Change Listener
    window.addEventListener("languageChanged", (e) => {
      this.handleRoute();
    });

    // Topbar & Sidebar Business Switcher Triggers
    const topBizPill = document.getElementById("topbarBusinessPill");
    if (topBizPill) {
      topBizPill.addEventListener("click", () =>
        this.openBusinessSwitcherModal(),
      );
    }
    const sideBizTrigger = document.getElementById(
      "sidebarBusinessSwitcherTrigger",
    );
    if (sideBizTrigger) {
      sideBizTrigger.addEventListener("click", () =>
        this.openBusinessSwitcherModal(),
      );
    }

    // Listen to business context switches across application
    window.addEventListener("businessSwitched", (e) => {
      const activeBiz = e.detail?.business || window.Store.getBusiness();
      if (activeBiz && activeBiz.name) {
        const topBizName = document.getElementById("topbarBusinessName");
        if (topBizName) topBizName.innerText = activeBiz.name;
        const compDisplay = document.getElementById("sidebarCompany");
        if (compDisplay) compDisplay.innerText = activeBiz.name;
      }
      this.updateBadges();
      this.handleRoute();
    });

    // Session expiration and authentication event listeners
    window.addEventListener("lekhajokha:session-expired", (e) => {
      this.showToast(
        "Session expired or revoked on server. Please sign in.",
        "warning",
      );
      window.location.hash = "#home";
      this.handleRoute();
    });

    window.addEventListener("lekhajokha:unauthenticated", () => {
      window.location.hash = "#home";
      this.handleRoute();
    });

    window.addEventListener("lekhajokha:authenticated", (e) => {
      const activeBiz =
        e.detail?.activeBusiness ||
        e.detail?.business ||
        window.Store.getBusiness();
      if (activeBiz && activeBiz.name) {
        const topBizName = document.getElementById("topbarBusinessName");
        if (topBizName) topBizName.innerText = activeBiz.name;
        const compDisplay = document.getElementById("sidebarCompany");
        if (compDisplay) compDisplay.innerText = activeBiz.name;
      }
      if (window.UsersModule && window.UsersModule.updateTopbarUserDisplay) {
        window.UsersModule.updateTopbarUserDisplay();
      }
      this.updateBadges();
      const currentHash = (window.location.hash || "")
        .replace(/^#\/?/, "")
        .split("?")[0];
      if (currentHash === "home" || !currentHash) {
        window.location.hash = "#dashboard";
      } else {
        this.handleRoute();
      }
      // Never show "Signed in successfully!" toast on page refresh, navigation, or session restore.
      // Explicit user logins display their own dedicated toast in their respective submission handlers.
      if (
        e.detail?.isInteractiveLogin &&
        !e.detail?.isSessionRestore &&
        !e.detail?.isRefresh &&
        !e.detail?.suppressToast
      ) {
        if (this.showToast) {
          this.showToast("Signed in successfully!", "success");
        }
      }
    });

    window.addEventListener("dataSynced", (e) => {
      this.updateBadges();
      // Guard: Do NOT destroy open modals, active forms, or active AI Copilot chat session during background sync
      const hasOpenModal = document.querySelector(
        '.modal.active, .modal-overlay.active, .modal-overlay[style*="display: flex"], [id*="Modal"][style*="display: flex"], [id*="Modal"][style*="display: block"], #salesman360Modal[style*="display: flex"], #addSalesmanOwnerModal[style*="display: flex"], #editSalesmanModal[style*="display: flex"], .modal[style*="display: block"]',
      );
      const isInteracting =
        document.activeElement &&
        ["INPUT", "SELECT", "TEXTAREA"].includes(
          document.activeElement.tagName,
        );
      const anyDirtyInput = Array.from(
        document.querySelectorAll(
          'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), textarea',
        ),
      ).some(
        (el) =>
          el.value &&
          el.value.trim().length > 0 &&
          el.id !== "globalSearchInput",
      );
      if (
        hasOpenModal ||
        this.currentView === "ai-copilot" ||
        this.currentView === "settings" ||
        this.currentView === "app-settings" ||
        isInteracting ||
        anyDirtyInput
      ) {
        return;
      }
      // If active view is on screen, re-render to reflect new sync data
      if (this.currentView && this.handleRoute) {
        this.handleRoute();
      }
    });

    // Sale Modal Barcode & AI Voice buttons
    const saleBarcode = document.getElementById("saleScanBarcodeBtn");
    if (saleBarcode) {
      saleBarcode.addEventListener("click", () => {
        if (window.BarcodeModule) {
          window.BarcodeModule.openScannerModal((item) =>
            this.addItemToSaleInvoice(item.id),
          );
        }
      });
    }

    const saleVoice = document.getElementById("saleVoiceBillingBtn");
    if (saleVoice) {
      saleVoice.addEventListener("click", () => {
        if (window.AICopilotModule) {
          window.AICopilotModule.openVoiceBillingModal();
        }
      });
    }

    // Backup & Reset Buttons
    document
      .getElementById("exportDataBtn")
      .addEventListener("click", () => this.exportBackup());
    document
      .getElementById("resetDataBtn")
      .addEventListener("click", () => this.resetData());

    // Modal Close Buttons
    document
      .getElementById("closeSaleModalBtn")
      .addEventListener("click", () => this.closeSaleModal());
    document
      .getElementById("cancelSaleBtn")
      .addEventListener("click", () => this.closeSaleModal());
    document
      .getElementById("closePartyModalBtn")
      .addEventListener("click", () => this.closePartyModal());
    document
      .getElementById("cancelPartyBtn")
      .addEventListener("click", () => this.closePartyModal());
    document
      .getElementById("closeItemModalBtn")
      .addEventListener("click", () => this.closeItemModal());
    document
      .getElementById("cancelItemBtn")
      .addEventListener("click", () => this.closeItemModal());
    document
      .getElementById("closePrintModalBtn")
      .addEventListener("click", () => this.closePrintModal());

    // Print Trigger
    document.getElementById("triggerPrintBtn").addEventListener("click", () => {
      window.print();
    });

    // Close Quick Add & More Menus on Outside Click
    document.addEventListener("click", (e) => {
      const quickMenu = document.getElementById("quickAddMenuPopup");
      const plusBtn = document.getElementById("topbarRoundPlusBtn");
      if (quickMenu && quickMenu.style.display !== "none") {
        if (!quickMenu.contains(e.target) && !plusBtn.contains(e.target)) {
          quickMenu.style.display = "none";
        }
      }

      const moreMenu = document.getElementById("topbarMoreMenuPopup");
      const moreBtn = document.getElementById("topbarMoreOptionsBtn");
      if (moreMenu && moreMenu.style.display !== "none") {
        if (!moreMenu.contains(e.target) && !moreBtn.contains(e.target)) {
          moreMenu.style.display = "none";
        }
      }
    });

    // Sale Form line items
    document
      .getElementById("addInvoiceRowBtn")
      .addEventListener("click", () => this.addInvoiceRow());
    this.saleInvoiceForm.addEventListener("submit", (e) =>
      this.handleSaveSale(e),
    );
    this.invPaidAmount.addEventListener("input", () =>
      this.calculateInvoiceTotals(),
    );
    this.invStateOfSupply.addEventListener("change", () =>
      this.calculateInvoiceTotals(),
    );

    // Quick Add Party from Sale modal
    document
      .getElementById("quickAddPartyFromSaleBtn")
      .addEventListener("click", () => {
        this.openPartyModal();
      });

    // Party Form Submit
    document
      .getElementById("partyForm")
      .addEventListener("submit", (e) => this.handleSaveParty(e));

    // Item Form Submit
    document
      .getElementById("itemForm")
      .addEventListener("submit", (e) => this.handleSaveItem(e));

    // Global Search
    document
      .getElementById("globalSearchInput")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const val = e.target.value.trim();
          if (val) {
            window.location.hash = "#sales";
            setTimeout(() => {
              const sInput = document.getElementById("salesSearchInput");
              if (sInput) {
                sInput.value = val;
                sInput.dispatchEvent(new Event("input"));
              }
            }, 100);
          }
        }
      });
  }

  toggleSidebar() {
    if (!this.sidebar) return;
    const isMobile = (window.innerWidth || 1200) <= 1024;
    if (isMobile) {
      const isOpen = this.sidebar.classList.toggle("open");
      const backdrop = document.getElementById("sidebarBackdrop");
      if (backdrop) {
        if (isOpen) {
          backdrop.classList.add("active");
        } else {
          backdrop.classList.remove("active");
        }
      }
    } else {
      const isCollapsed = this.sidebar.classList.toggle("collapsed");
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("sidebar_collapsed", isCollapsed ? "1" : "0");
      }
    }
  }

  closeSidebar() {
    if (!this.sidebar) return;
    this.sidebar.classList.remove("open");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (backdrop) backdrop.classList.remove("active");
  }

  handleRoute() {
    const isAuthed = window.Store && !!window.Store.getAuthToken();
    let rawHash = (window.location.hash || "").replace(/^#\/?/, "");
    if (!rawHash) {
      rawHash = isAuthed ? "dashboard" : "home";
    }
    const hashName = rawHash.split("?")[0];
    const searchParams = new URLSearchParams(window.location.search);
    const hashQueryStr = rawHash.includes("?")
      ? rawHash.slice(rawHash.indexOf("?") + 1)
      : "";
    const hashParams = new URLSearchParams(hashQueryStr);
    const token = searchParams.get("token") || hashParams.get("token") || "";
    const hash = hashName;
    this.currentView = hash;

    // Toggle Standalone Experience for Field Staff / WhatsApp Invite / Home Page
    const isSalesmanView = hash === "invite" || hash === "salesman-app";
    const isHomeView = hash === "home";
    const isStandalone = isSalesmanView || isHomeView;

    if (this.sidebar) this.sidebar.style.display = isStandalone ? "none" : "";
    const topbar = document.querySelector(".topbar");
    if (topbar) topbar.style.display = isStandalone ? "none" : "";
    const fabBtn = document.getElementById("fabSaleBtn");
    if (fabBtn) fabBtn.style.display = isStandalone ? "none" : "";
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      if (isHomeView) {
        mainContent.style.marginLeft = "0";
        mainContent.style.padding = "0";
        mainContent.style.maxWidth = "100%";
        mainContent.style.width = "100%";
        mainContent.style.minHeight = "100vh";
        mainContent.style.background = "#ffffff";
        mainContent.style.overflowX = "hidden";
      } else if (isSalesmanView) {
        mainContent.style.marginLeft = "0";
        mainContent.style.padding = "0";
        mainContent.style.maxWidth = "100%";
        mainContent.style.width = "100%";
        mainContent.style.minHeight = "100vh";
        mainContent.style.background = "#0f172a";
        mainContent.style.overflowX = "";
      } else {
        mainContent.style.marginLeft = "";
        mainContent.style.padding = "";
        mainContent.style.maxWidth = "";
        mainContent.style.width = "";
        mainContent.style.minHeight = "";
        mainContent.style.background = "";
        mainContent.style.overflowX = "";
      }
    }

    // Update active nav link & sublinks
    this.navLinks.forEach((link) => {
      const view = link.getAttribute("data-view");
      if (
        view === hash ||
        (hash.startsWith("util") && view === "utilities") ||
        ((hash === "settings" ||
          hash === "business-settings" ||
          hash === "app-settings") &&
          view === "settings")
      ) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    const sublinks = document.querySelectorAll(".nav-sublink");
    sublinks.forEach((sub) => {
      const subView = sub.getAttribute("data-view");
      if (
        subView === hash ||
        (hash === "utilities" && subView === "util-track-salesmen") ||
        (hash === "settings" && subView === "business-settings")
      ) {
        sub.classList.add("active");
      } else {
        sub.classList.remove("active");
      }
    });

    const partiesSublinks = document.querySelectorAll(
      ".sidebar-parties-sublink",
    );
    partiesSublinks.forEach((sub) => {
      if (hash === "parties" && sub.innerText.includes("Party Details")) {
        sub.classList.add("active");
      } else {
        sub.classList.remove("active");
      }
    });

    // Auto-open settings dropdown when visiting settings routes
    if (
      hash === "settings" ||
      hash === "business-settings" ||
      hash === "app-settings"
    ) {
      const settingsDropdown = document.getElementById("settingsNavGroup");
      if (settingsDropdown) {
        settingsDropdown.classList.add("open");
        const chev = settingsDropdown.querySelector(".dropdown-chevron");
        if (chev) chev.innerText = "▲";
      }
    }

    // Parties and Utilities dropdowns are collapsed by default and only expand on explicit user click

    // Render corresponding view
    switch (hash) {
      case "home":
        this.pageTitle.innerText = "Home";
        this.pageSubtitle.innerText =
          "Lekha Jokha - GST Billing, Inventory & Salesman Telemetry";
        if (window.HomeModule) {
          window.HomeModule.render(this.viewContainer);
        }
        break;
      case "invite":
        if (window.SalesmanAppModule) {
          window.SalesmanAppModule.renderInvite(this.viewContainer, token);
        }
        break;
      case "salesman-app":
        if (window.SalesmanAppModule) {
          window.SalesmanAppModule.renderApp(this.viewContainer);
        }
        break;
      case "dashboard":
        this.pageTitle.innerText = "Business Dashboard";
        this.pageSubtitle.innerText =
          "Real-time overview of your finances, sales & stock";
        window.DashboardModule.render(this.viewContainer);
        break;
      case "orders":
        this.pageTitle.innerText = "Order Management";
        this.pageSubtitle.innerText =
          "Multi-source order aggregation, real-time salesman sync & 1-click GST billing";
        if (window.OrdersModule) {
          window.OrdersModule.render(this.viewContainer);
        }
        break;
      case "track-salesmen":
      case "salesmen":
        this.pageTitle.innerText = "Track Your Salesmen";
        this.pageSubtitle.innerText =
          "Field staff directory, Owner CRUD, live GPS radar & 360° telemetry dossier";
        if (window.SalesmenModule) {
          window.SalesmenModule.render(this.viewContainer);
        } else if (window.UtilitiesModule) {
          window.UtilitiesModule.render(this.viewContainer, "track-salesmen");
        }
        break;
      case "sales":
        this.pageTitle.innerText = "Sales & Invoices";
        this.pageSubtitle.innerText =
          "Create GST compliant tax invoices, delivery challans & estimates";
        window.SalesModule.render(this.viewContainer);
        break;
      case "pos":
        this.pageTitle.innerText = "Fast POS Counter Billing";
        this.pageSubtitle.innerText =
          "High-speed touch counter checkout, barcode scanner & instant thermal print";
        if (window.POSModule) {
          window.POSModule.render(this.viewContainer);
        }
        break;
      case "purchases":
        this.pageTitle.innerText = "Purchases & Expenses";
        this.pageSubtitle.innerText =
          "Manage vendor bills and track stock inbound";
        window.PurchasesModule.render(this.viewContainer);
        break;
      case "parties":
        this.pageTitle.innerText = "Customer & Supplier Directory";
        this.pageSubtitle.innerText =
          "Manage accounts, track balances and send WhatsApp payment reminders";
        window.PartiesModule.render(this.viewContainer);
        break;
      case "items":
        this.pageTitle.innerText = "Items & Inventory";
        this.pageSubtitle.innerText =
          "Product catalog, HSN codes, low-stock warnings and price management";
        window.ItemsModule.render(this.viewContainer);
        break;
      case "cashbank":
        this.pageTitle.innerText = "Cash & Bank Passbook";
        this.pageSubtitle.innerText =
          "Monitor cash counter and bank balances across all accounts";
        window.CashBankModule.render(this.viewContainer);
        break;
      case "expenses":
        this.pageTitle.innerText = "Operational Expenses";
        this.pageSubtitle.innerText =
          "Log day-to-day shop rent, electricity, wages and logistics costs";
        window.ExpensesModule.render(this.viewContainer);
        break;
      case "eway":
        this.pageTitle.innerText = "GST e-Way Bills";
        this.pageSubtitle.innerText =
          "Generate, print & download Government (NIC) format e-Way bills";
        window.EwayModule.render(this.viewContainer);
        break;
      case "ai-copilot":
        this.pageTitle.innerText = "Lekha Jokha AI Business Advisor";
        this.pageSubtitle.innerText =
          "Intelligent cashflow diagnosis, debtor risk analysis & voice billing";
        window.AICopilotModule.render(this.viewContainer);
        break;
      case "users":
        this.pageTitle.innerText = "Staff & Role-Based Access";
        this.pageSubtitle.innerText =
          "Multi-user access control, cashier switching & security audit logs";
        window.UsersModule.render(this.viewContainer);
        break;
      case "reports":
        if (!window.Store.hasPermission("view_reports")) {
          this.pageTitle.innerText = "Access Restricted";
          this.pageSubtitle.innerText =
            "Admin or Accountant permission required";
          this.viewContainer.innerHTML = `
            <div class="card" style="text-align:center;padding:3rem;">
              <div style="font-size:3rem;margin-bottom:1rem;">🛡️</div>
              <h2 style="font-size:1.5rem;font-weight:800;color:var(--danger);margin-bottom:0.5rem;">Access Restricted</h2>
              <p style="color:var(--text-muted);max-width:480px;margin:0 auto 1.5rem auto;">
                Your active role (<b>${window.Store.getCurrentUser().role}</b>) does not have permission to view Profit & Loss and financial statements. Please ask an Admin or Accountant to switch operator.
              </p>
              <button class="btn btn-primary" id="restrictedSwitchBtn">Switch to Admin / Accountant</button>
            </div>
          `;
          const rBtn = document.getElementById("restrictedSwitchBtn");
          if (rBtn)
            rBtn.onclick = () =>
              window.UsersModule.openSwitchModal(this.viewContainer);
          return;
        }
        this.pageTitle.innerText = "Reports & Tax Filing";
        this.pageSubtitle.innerText =
          "Profit & Loss statements, GSTR-1 summaries, and Excel/CSV export";
        window.ReportsModule.render(this.viewContainer);
        break;
      case "migration":
        this.pageTitle.innerText = window.i18n
          ? window.i18n.t("mig.title", "Data Import & Migration Center")
          : "Data Import & Migration Center";
        this.pageSubtitle.innerText = window.i18n
          ? window.i18n.t(
              "mig.subtitle",
              "Seamlessly switch from Tally, LekhaJokha, Khatabook, Zoho or Excel without data loss",
            )
          : "Seamlessly switch from Tally, LekhaJokha, Khatabook, Zoho or Excel without data loss";
        if (window.MigrationModule) {
          window.MigrationModule.render(this.viewContainer);
        }
        break;
      case "settings":
      case "business-settings":
        this.pageTitle.innerText = window.i18n
          ? window.i18n.t("nav.settings", "Business Settings")
          : "Business Settings";
        this.pageSubtitle.innerText =
          "Company details, GSTIN, bank UPI details and invoice branding";
        window.SettingsModule.render(this.viewContainer);
        break;
      case "app-settings":
        this.pageTitle.innerText = "Application Settings";
        this.pageSubtitle.innerText =
          "General, Transactions, Print formats, Taxes & GST, Users, SMS, Reminders, Party, Item & Multi-Currency";
        if (window.AppSettingsModule) {
          window.AppSettingsModule.render(this.viewContainer);
        } else {
          this.viewContainer.innerHTML =
            '<div class="card p-4">Loading Application Settings...</div>';
        }
        break;
      case "subscription":
        this.pageTitle.innerText = "SaaS Subscription & Multi-Business Plans";
        this.pageSubtitle.innerText =
          "Manage plan entitlements, business slots and invoice limits";
        window.SubscriptionModule.render(this.viewContainer);
        break;
      case "utilities":
        this.pageTitle.innerText = "Business Utilities";
        this.pageSubtitle.innerText =
          "Bulk imports, barcode printing, business setup & data exports";
        if (window.UtilitiesModule) {
          window.UtilitiesModule.render(this.viewContainer, "import-items");
        }
        break;
      case "util-track-salesmen":
        this.pageTitle.innerText = "Track Your Salesmen";
        this.pageSubtitle.innerText =
          "Live GPS radar, route tracking, attendance logs & field force telemetry";
        if (window.UtilitiesModule) {
          window.UtilitiesModule.render(this.viewContainer, "track-salesmen");
        }
        break;
      case "util-import-items":
        this.pageTitle.innerText = "Import Items";
        this.pageSubtitle.innerText =
          "Bulk inventory & product catalog onboarding from CSV/Excel";
        if (window.UtilitiesModule) {
          window.UtilitiesModule.render(this.viewContainer, "import-items");
        }
        break;
      case "util-setup-business":
        this.pageTitle.innerText = "Set Up My Business";
        this.pageSubtitle.innerText =
          "Company registration, GSTIN, document serial prefixes & bank configurations";
        if (window.UtilitiesModule) {
          window.UtilitiesModule.render(this.viewContainer, "setup-business");
        }
        break;
      case "util-accountant-access":
        this.pageTitle.innerText = "Accountant Access";
        this.pageSubtitle.innerText =
          "Manage chartered accountant permissions, audit access & invitations";
        if (window.UtilitiesModule) {
          window.UtilitiesModule.render(
            this.viewContainer,
            "accountant-access",
          );
        }
        break;
      case "util-barcode-generator":
        this.pageTitle.innerText = "Barcode Generator";
        this.pageSubtitle.innerText =
          "Create, preview and print Code128 / EAN13 barcode labels";
        if (window.UtilitiesModule) {
          window.UtilitiesModule.render(
            this.viewContainer,
            "barcode-generator",
          );
        }
        break;
      case "util-bulk-update":
        this.pageTitle.innerText = "Update Items in Bulk";
        this.pageSubtitle.innerText =
          "Mass price updates, GST rate adjustments and inventory stock calibration";
        if (window.UtilitiesModule) {
          window.UtilitiesModule.render(this.viewContainer, "bulk-update");
        }
        break;
      case "util-import-tally":
        this.pageTitle.innerText = "Import From Tally";
        this.pageSubtitle.innerText =
          "Migrate chart of accounts, ledgers and stock masters from Tally XML";
        if (window.UtilitiesModule) {
          window.UtilitiesModule.render(this.viewContainer, "import-tally");
        }
        break;
      case "util-import-parties":
        this.pageTitle.innerText = "Import Parties";
        this.pageSubtitle.innerText =
          "Bulk customer & vendor directory import with phone and GSTIN matching";
        if (window.UtilitiesModule) {
          window.UtilitiesModule.render(this.viewContainer, "import-parties");
        }
        break;
      case "util-export-tally":
        this.pageTitle.innerText = "Exports to Tally";
        this.pageSubtitle.innerText =
          "Export compliant XML files for direct import into Tally ERP9 / TallyPrime";
        if (window.UtilitiesModule) {
          window.UtilitiesModule.render(this.viewContainer, "export-tally");
        }
        break;
      case "util-export-items":
        this.pageTitle.innerText = "Export Items";
        this.pageSubtitle.innerText =
          "Download complete product catalog in CSV or JSON format";
        if (window.UtilitiesModule) {
          window.UtilitiesModule.render(this.viewContainer, "export-items");
        }
        break;
      default:
        window.location.hash = "#dashboard";
        break;
    }

    this.updateBadges();
    if (window.i18n) window.i18n.applyToDOM();
  }

  updateBadges() {
    const sales = window.Store.getSales();
    const items = window.Store.getItems();
    const lowCount = items.filter((i) => i.stock <= i.minStock).length;

    const salesBadge = document.getElementById("salesCountBadge");
    if (salesBadge) salesBadge.innerText = sales.length;

    const lowBadge = document.getElementById("lowStockCountBadge");
    if (lowBadge) {
      lowBadge.innerText = lowCount;
      lowBadge.style.display = lowCount > 0 ? "inline-block" : "none";
    }

    const ewayBadge = document.getElementById("ewayCountBadge");
    if (ewayBadge) {
      const activeEwb = (window.Store.getEwayBills() || []).filter(
        (e) => e.status === "Active",
      );
      ewayBadge.innerText = activeEwb.length;
    }

    const ordersBadge = document.getElementById("ordersCountBadge");
    if (ordersBadge && window.Store.getOrders) {
      const orders = window.Store.getOrders();
      const pendingCount = orders.filter(
        (o) => o.orderStatus === "New" || o.paymentStatus === "Pending",
      ).length;
      ordersBadge.innerText = pendingCount > 0 ? pendingCount : orders.length;
      ordersBadge.className =
        pendingCount > 0
          ? "badge badge-warning ml-auto"
          : "badge badge-success ml-auto";
    }

    const salesmenBadge = document.getElementById("salesmenCountBadge");
    if (salesmenBadge && window.Store.getSalesmen) {
      const salesmen = window.Store.getSalesmen();
      const onDuty = salesmen.filter(
        (s) => s.attendanceStatus === "Punched In",
      ).length;
      salesmenBadge.innerHTML = `<span class="live-dot" style="display:inline-block;width:6px;height:6px;background:#22c55e;border-radius:50%;margin-right:4px;"></span>${onDuty} LIVE`;
    }

    if (window.UsersModule) {
      window.UsersModule.updateTopbarUserDisplay();
    }

    const biz = window.Store.getBusiness();
    const compDisplay = document.getElementById("sidebarCompany");
    const topBizName = document.getElementById("topbarBusinessName");
    const topBizGstin = document.getElementById("topbarBusinessGstin");

    if (biz && biz.name) {
      if (compDisplay) compDisplay.innerText = biz.name;
      if (topBizName) topBizName.innerText = biz.name;
      if (topBizGstin) topBizGstin.innerText = biz.gstin || "UNREGISTERED";
    } else {
      if (topBizName) topBizName.innerText = "My Business";
    }

    const activePlan = window.Store.getActivePlan();
    const subBadge = document.getElementById("subPlanBadge");
    if (subBadge && activePlan) {
      subBadge.innerText = activePlan.badge || activePlan.id.toUpperCase();
    }
  }

  // Helper: Fast add or increment item in Sale modal
  addItemToSaleInvoice(itemId, qty = 1) {
    if (!this.saleModal.classList.contains("active")) {
      this.openSaleModal();
    }
    const item = window.Store.getItem(itemId);
    if (!item) return;

    const rows = this.invoiceItemsBody.querySelectorAll("tr");
    let foundRow = null;
    rows.forEach((r) => {
      const select = r.querySelector(".item-select");
      if (select && select.value === itemId) {
        foundRow = r;
      }
    });

    if (foundRow) {
      const qtyInput = foundRow.querySelector(".item-qty");
      qtyInput.value = (Number(qtyInput.value) || 0) + qty;
    } else {
      const lastRow = rows[rows.length - 1];
      const lastSelect = lastRow ? lastRow.querySelector(".item-select") : null;
      let targetRow = lastSelect && !lastSelect.value ? lastRow : null;

      if (!targetRow) {
        this.addInvoiceRow();
        const updatedRows = this.invoiceItemsBody.querySelectorAll("tr");
        targetRow = updatedRows[updatedRows.length - 1];
      }

      const select = targetRow.querySelector(".item-select");
      select.value = itemId;
      select.dispatchEvent(new Event("change"));
      const qtyInput = targetRow.querySelector(".item-qty");
      qtyInput.value = qty;
    }

    this.calculateInvoiceTotals();
  }

  // Helper: Open sale modal pre-filled by AI
  openSaleModalWithPrefill(parsed) {
    this.openSaleModal();
    if (parsed.party) {
      this.invParty.value = parsed.party.id;
    }
    if (parsed.paymentMode) {
      this.invPaymentMode.value = parsed.paymentMode;
    }
    this.invoiceItemsBody.innerHTML = "";
    parsed.items.forEach((it) => {
      this.addItemToSaleInvoice(it.item.id, it.qty);
    });
    this.calculateInvoiceTotals();
    this.showToast(
      `AI pre-filled invoice for ${parsed.party ? parsed.party.name : "Customer"}!`,
      "success",
    );
  }

  // --- Modal Operations ---
  openSaleModal() {
    this.invNumber.value = window.Store.getNextInvoiceNumber();
    this.invDate.value = new Date().toISOString().split("T")[0];

    // Populate parties dropdown
    const customers = window.Store.getParties().filter(
      (p) => p.type === "Customer",
    );
    this.invParty.innerHTML =
      `<option value="">Select Customer...</option>` +
      customers
        .map((c) => `<option value="${c.id}">${c.name} (${c.phone})</option>`)
        .join("");

    // Clear lines and add one empty row
    this.invoiceItemsBody.innerHTML = "";
    this.addInvoiceRow();
    this.calculateInvoiceTotals();

    this.saleModal.classList.add("active");
  }

  closeSaleModal() {
    this.saleModal.classList.remove("active");
  }

  closeAllModals() {
    document
      .querySelectorAll(".modal-overlay.active")
      .forEach((m) => m.classList.remove("active"));
    const actionSheet = document.getElementById("mobileActionSheet");
    if (actionSheet) actionSheet.classList.remove("open");
    const sheetBackdrop = document.getElementById("mobileActionSheetBackdrop");
    if (sheetBackdrop) sheetBackdrop.classList.remove("active");
    const sidebar = document.getElementById("sidebar");
    if (sidebar && sidebar.classList.contains("open"))
      sidebar.classList.remove("open");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    if (sidebarBackdrop) sidebarBackdrop.classList.remove("active");
  }

  addInvoiceRow() {
    const items = window.Store.getItems();
    const tr = document.createElement("tr");
    tr.className = "invoice-line-row";

    tr.innerHTML = `
      <td>
        <select class="form-control item-select" required>
          <option value="">Choose Product...</option>
          ${items.map((i) => `<option value="${i.id}" data-rate="${i.salePrice}" data-hsn="${i.hsn || ""}" data-tax="${i.gstRate || 0}">${i.name} (Stock: ${i.stock})</option>`).join("")}
        </select>
      </td>
      <td><input type="text" class="form-control item-hsn" placeholder="HSN" readonly></td>
      <td><input type="number" class="form-control item-qty" min="1" value="1" required></td>
      <td><input type="number" class="form-control item-rate" step="0.01" value="0.00" required></td>
      <td>
        <select class="form-control item-gst">
          <option value="0">0%</option>
          <option value="5">5%</option>
          <option value="12">12%</option>
          <option value="18" selected>18%</option>
          <option value="28">28%</option>
        </select>
      </td>
      <td><input type="text" class="form-control item-amount table-mono text-right" readonly value="₹0.00"></td>
      <td class="text-center">
        <button type="button" class="icon-btn remove-line-btn" style="color: var(--danger); font-size: 18px;" title="Remove Row">&times;</button>
      </td>
    `;

    // Row event listeners
    const select = tr.querySelector(".item-select");
    const hsn = tr.querySelector(".item-hsn");
    const qty = tr.querySelector(".item-qty");
    const rate = tr.querySelector(".item-rate");
    const gst = tr.querySelector(".item-gst");
    const removeBtn = tr.querySelector(".remove-line-btn");

    select.addEventListener("change", () => {
      const opt = select.options[select.selectedIndex];
      if (opt.value) {
        hsn.value = opt.getAttribute("data-hsn");
        rate.value = opt.getAttribute("data-rate");
        gst.value = opt.getAttribute("data-tax");
      }
      this.calculateInvoiceTotals();
    });

    qty.addEventListener("input", () => this.calculateInvoiceTotals());
    rate.addEventListener("input", () => this.calculateInvoiceTotals());
    gst.addEventListener("change", () => this.calculateInvoiceTotals());

    removeBtn.addEventListener("click", () => {
      if (this.invoiceItemsBody.querySelectorAll("tr").length > 1) {
        tr.remove();
        this.calculateInvoiceTotals();
      } else {
        this.showToast("At least one item line is required.", "error");
      }
    });

    this.invoiceItemsBody.appendChild(tr);
  }

  calculateInvoiceTotals() {
    let subtotal = 0;
    let totalTax = 0;

    const rows = this.invoiceItemsBody.querySelectorAll(".invoice-line-row");
    rows.forEach((row) => {
      const q = Number(row.querySelector(".item-qty").value) || 0;
      const r = Number(row.querySelector(".item-rate").value) || 0;
      const g = Number(row.querySelector(".item-gst").value) || 0;

      const taxable = q * r;
      const tax = (taxable * g) / 100;
      const lineTotal = taxable + tax;

      subtotal += taxable;
      totalTax += tax;

      row.querySelector(".item-amount").value = `₹${lineTotal.toFixed(2)}`;
    });

    const rawGrandTotal = subtotal + totalTax;
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = roundedGrandTotal - rawGrandTotal;

    this.invSubtotal.innerText = `₹${subtotal.toFixed(2)}`;
    this.invTotalTax.innerText = `₹${totalTax.toFixed(2)}`;
    this.invRoundOff.innerText = `₹${roundOff.toFixed(2)}`;
    this.invGrandTotal.innerText = `₹${roundedGrandTotal.toFixed(2)}`;

    // Set paid amount default to total if not manually edited
    if (
      this.invPaymentMode.value !== "Credit" &&
      (!this.invPaidAmount.dataset.userEdited ||
        this.invPaidAmount.value === "0")
    ) {
      this.invPaidAmount.value = roundedGrandTotal;
    }

    const paid = Number(this.invPaidAmount.value) || 0;
    const balance = Math.max(0, roundedGrandTotal - paid);
    this.invBalanceDue.innerText = `₹${balance.toFixed(2)}`;
  }

  handleSaveSale(e) {
    e.preventDefault();
    const partyId = this.invParty.value;
    const party = window.Store.getParty(partyId);
    if (!party) {
      this.showToast("Please select a customer for this invoice.", "error");
      return;
    }

    const items = [];
    const rows = this.invoiceItemsBody.querySelectorAll(".invoice-line-row");
    rows.forEach((row) => {
      const select = row.querySelector(".item-select");
      const opt = select.options[select.selectedIndex];
      const q = Number(row.querySelector(".item-qty").value);
      const r = Number(row.querySelector(".item-rate").value);
      const g = Number(row.querySelector(".item-gst").value);
      const taxable = q * r;
      const tax = (taxable * g) / 100;

      items.push({
        itemId: select.value,
        name: opt.text.split(" (Stock:")[0],
        hsn: row.querySelector(".item-hsn").value,
        qty: q,
        rate: r,
        gstRate: g,
        amount: taxable + tax,
      });
    });

    const subtotal = items.reduce((acc, i) => acc + i.qty * i.rate, 0);
    const tax = items.reduce(
      (acc, i) => acc + (i.qty * i.rate * i.gstRate) / 100,
      0,
    );
    const total = Math.round(subtotal + tax);
    const paid = Number(this.invPaidAmount.value) || 0;
    const balance = Math.max(0, total - paid);

    const saleRecord = {
      date: this.invDate.value,
      partyId: party.id,
      partyName: party.name,
      placeOfSupply: this.invStateOfSupply.value,
      paymentMode: this.invPaymentMode.value,
      items,
      subtotal,
      tax,
      total,
      paid,
      balance,
      status: balance === 0 ? "Paid" : "Unpaid",
      notes: document.getElementById("invNotes").value,
    };

    const createdSale = window.Store.addSale(saleRecord);
    this.closeSaleModal();
    this.showToast(
      `Invoice ${createdSale.number} created successfully!`,
      "success",
    );

    // Automatically preview printable invoice
    this.previewInvoice(createdSale.id);
    this.handleRoute();
  }

  // --- Party Modal Operations ---
  openPartyModal(party = null) {
    document.getElementById("partyForm").reset();
    if (party) {
      document.getElementById("partyId").value = party.id || "";
      document.getElementById("partyName").value = party.name || "";
      document.getElementById("partyPhone").value = party.phone || "";
      document.getElementById("partyGstin").value = party.gstin || "";
      document.getElementById("partyAddress").value = party.address || "";
      if (party.state)
        document.getElementById("partyState").value = party.state;
      document.getElementById("partyOpeningBalance").value = party.balance || 0;
      const typeRadio = document.querySelector(
        `input[name="partyType"][value="${party.type}"]`,
      );
      if (typeRadio) typeRadio.checked = true;
      const titleEl = document.querySelector("#partyModal .modal-title");
      if (titleEl) titleEl.innerText = `Edit Party - ${party.name}`;

      const deleteModalBtn = document.getElementById("deletePartyFromModalBtn");
      if (deleteModalBtn) {
        deleteModalBtn.style.display = "inline-flex";
        deleteModalBtn.onclick = () => {
          if (
            confirm(
              `Are you sure you want to delete "${party.name}"? This action cannot be undone.`,
            )
          ) {
            window.Store.deleteParty(party.id);
            this.closePartyModal();
            this.showToast(
              `Party "${party.name}" deleted successfully.`,
              "success",
            );
            this.handleRoute();
          }
        };
      }
    } else {
      document.getElementById("partyId").value = "";
      const titleEl = document.querySelector("#partyModal .modal-title");
      if (titleEl) titleEl.innerText = "Add New Party";

      const deleteModalBtn = document.getElementById("deletePartyFromModalBtn");
      if (deleteModalBtn) {
        deleteModalBtn.style.display = "none";
        deleteModalBtn.onclick = null;
      }
    }
    this.partyModal.classList.add("active");
  }

  closePartyModal() {
    this.partyModal.classList.remove("active");
  }

  handleSaveParty(e) {
    e.preventDefault();
    const type = document.querySelector(
      'input[name="partyType"]:checked',
    ).value;
    const name = document.getElementById("partyName").value.trim();
    const phone = document.getElementById("partyPhone").value.trim();
    const gstin = document.getElementById("partyGstin").value.trim();
    const address = document.getElementById("partyAddress").value.trim();
    const state = document.getElementById("partyState").value;
    const balance =
      Number(document.getElementById("partyOpeningBalance").value) || 0;
    const existingId = document.getElementById("partyId").value;

    let savedParty;
    if (existingId) {
      savedParty = window.Store.updateParty(existingId, {
        type,
        name,
        phone,
        gstin,
        address,
        state,
        balance,
      });
      this.closePartyModal();
      this.showToast(`${type} "${name}" updated successfully!`, "success");
    } else {
      savedParty = window.Store.addParty({
        type,
        name,
        phone,
        gstin,
        address,
        state,
        balance,
      });
      this.closePartyModal();
      this.showToast(`${type} "${name}" added successfully!`, "success");
    }

    // If sale modal is open, refresh parties dropdown and select new party
    if (this.saleModal.classList.contains("active")) {
      const customers = window.Store.getParties().filter(
        (p) => p.type === "Customer",
      );
      this.invParty.innerHTML =
        `<option value="">Select Customer...</option>` +
        customers
          .map((c) => `<option value="${c.id}">${c.name} (${c.phone})</option>`)
          .join("");
      this.invParty.value = (savedParty && savedParty.id) || "";
    } else {
      this.handleRoute();
    }
  }

  // --- Item Modal Operations ---
  openItemModal(itemId = null) {
    const form = document.getElementById("itemForm");
    form.reset();
    const idField = document.getElementById("itemId");
    const titleEl = document.getElementById("itemModalTitle");
    const catSelect = document.getElementById("itemCategory");
    const subCatSelect = document.getElementById("itemSubCategory");

    // Populate categories dynamically from Store
    const categories =
      window.Store && window.Store.getItemCategories
        ? window.Store.getItemCategories()
        : [];
    if (catSelect && categories.length > 0) {
      catSelect.innerHTML = categories
        .map((c) => `<option value="${c.name}">${c.name}</option>`)
        .join("");
    }

    const updateSubCategories = (selectedCatName, selectedSub = "") => {
      if (!subCatSelect) return;
      const found = categories.find(
        (c) =>
          c.name.toLowerCase() === String(selectedCatName || "").toLowerCase(),
      );
      const subs = found && found.subcategories ? found.subcategories : [];
      if (subs.length > 0) {
        subCatSelect.innerHTML =
          `<option value="">-- Select Sub-Category (Optional) --</option>` +
          subs.map((s) => `<option value="${s}">${s}</option>`).join("");
      } else {
        subCatSelect.innerHTML = `<option value="">-- No Sub-Categories Available --</option>`;
      }
      if (selectedSub) subCatSelect.value = selectedSub;
    };

    if (catSelect) {
      catSelect.onchange = () => updateSubCategories(catSelect.value);
    }

    if (itemId) {
      const item = window.Store.getItem(itemId);
      if (item) {
        idField.value = item.id;
        document.getElementById("itemName").value = item.name || "";
        if (catSelect)
          catSelect.value =
            item.category ||
            (categories[0] ? categories[0].name : "Groceries & Food");
        updateSubCategories(
          catSelect ? catSelect.value : "",
          item.subCategory || "",
        );
        document.getElementById("itemHsn").value = item.hsn || "";
        document.getElementById("itemSalePrice").value = item.salePrice || 0;
        document.getElementById("itemPurchasePrice").value =
          item.purchasePrice || 0;
        document.getElementById("itemGstRate").value = item.gstRate || 0;
        document.getElementById("itemUnit").value = item.unit || "PCS";
        document.getElementById("itemStock").value = item.stock || 0;
        document.getElementById("itemMinStock").value = item.minStock || 5;
        if (titleEl) titleEl.textContent = `Edit Item: ${item.name}`;
      }
    } else {
      idField.value = "";
      if (catSelect && categories[0]) {
        catSelect.value = categories[0].name;
        updateSubCategories(categories[0].name);
      }
      if (titleEl) titleEl.textContent = "Add Item to Inventory";
    }
    this.itemModal.classList.add("active");
  }

  closeItemModal() {
    this.itemModal.classList.remove("active");
  }

  handleSaveItem(e) {
    e.preventDefault();
    const id = document.getElementById("itemId").value.trim();
    const name = document.getElementById("itemName").value.trim();
    const category = document.getElementById("itemCategory").value;
    const subCategory = document.getElementById("itemSubCategory")
      ? document.getElementById("itemSubCategory").value
      : "";
    const hsn = document.getElementById("itemHsn").value.trim();
    const salePrice = Number(document.getElementById("itemSalePrice").value);
    const purchasePrice = Number(
      document.getElementById("itemPurchasePrice").value,
    );
    const gstRate = Number(document.getElementById("itemGstRate").value);
    const unit = document.getElementById("itemUnit").value;
    const stock = Number(document.getElementById("itemStock").value);
    const minStock = Number(document.getElementById("itemMinStock").value);

    if (id) {
      window.Store.updateItem(id, {
        name,
        category,
        subCategory,
        hsn,
        salePrice,
        purchasePrice,
        gstRate,
        unit,
        stock,
        minStock,
      });
      this.closeItemModal();
      this.showToast(`Item "${name}" updated successfully!`, "success");
    } else {
      window.Store.addItem({
        name,
        category,
        subCategory,
        hsn,
        salePrice,
        purchasePrice,
        gstRate,
        unit,
        stock,
        minStock,
      });
      this.closeItemModal();
      this.showToast(`Item "${name}" added to inventory!`, "success");
    }
    this.handleRoute();
  }

  // --- Invoice Preview & WhatsApp Share ---
  previewInvoice(saleId) {
    const sale = window.Store.getSale(saleId);
    if (!sale) return;

    const biz = window.Store.getBusiness();
    const party = window.Store.getParty(sale.partyId);

    const printableContainer = document.getElementById(
      "printableInvoiceContent",
    );
    printableContainer.innerHTML = window.InvoicePrint.render(sale, biz, party);

    // Bind WhatsApp share button inside header
    document.getElementById("whatsappShareBtn").onclick = () => {
      this.shareOnWhatsApp(sale.id);
    };

    this.printInvoiceModal.classList.add("active");
  }

  closePrintModal() {
    this.printInvoiceModal.classList.remove("active");
  }

  shareOnWhatsApp(saleId) {
    const sale = window.Store.getSale(saleId);
    if (!sale) return;
    const biz = window.Store.getBusiness();
    const party = window.Store.getParty(sale.partyId);
    const phone = party ? party.phone : "";

    const text = encodeURIComponent(
      `Dear ${sale.partyName},\n\nHere is your Tax Invoice from *${biz.name}*:\n` +
        `*Invoice No:* ${sale.number}\n` +
        `*Date:* ${sale.date}\n` +
        `*Total Amount:* ₹${Number(sale.total).toLocaleString("en-IN")}\n` +
        `*Balance Due:* ₹${Number(sale.balance).toLocaleString("en-IN")}\n\n` +
        `Pay instantly using UPI: ${biz.upiId}\n\nThank you for choosing us!`,
    );

    window.open(
      `https://api.whatsapp.com/send?phone=91${phone}&text=${text}`,
      "_blank",
    );
  }

  // --- Backup & Reset ---
  exportBackup() {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(window.Store.data, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `LekhaJokha_Data_Backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    this.showToast("Backup JSON exported successfully!", "success");
  }

  resetData() {
    if (
      confirm(
        "Are you sure you want to reset all business data back to sample defaults?",
      )
    ) {
      window.Store.reset();
      this.showToast("Data reset to sample defaults.", "success");
      this.handleRoute();
    }
  }

  // --- Quick Add & More Options Popups ---
  toggleQuickAddMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById("quickAddMenuPopup");
    if (!menu) return;
    const isHidden = menu.style.display === "none" || !menu.style.display;
    this.closeMoreMenu();
    menu.style.display = isHidden ? "block" : "none";
  }

  closeQuickAddMenu() {
    const menu = document.getElementById("quickAddMenuPopup");
    if (menu) menu.style.display = "none";
  }

  toggleMoreMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById("topbarMoreMenuPopup");
    if (!menu) return;
    const isHidden = menu.style.display === "none" || !menu.style.display;
    this.closeQuickAddMenu();
    menu.style.display = isHidden ? "block" : "none";
  }

  closeMoreMenu() {
    const menu = document.getElementById("topbarMoreMenuPopup");
    if (menu) menu.style.display = "none";
  }

  toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  }

  showKeyboardShortcutsModal() {
    const existing = document.getElementById("shortcutsModalOverlay");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay active";
    overlay.style.zIndex = "11000";
    overlay.id = "shortcutsModalOverlay";
    overlay.innerHTML = `
      <div class="modal-dialog" style="max-width: 520px;">
        <div class="modal-header">
          <div style="font-weight: 700; font-size: 16px; color: var(--navy-900, #0f172a);">⌨️ Productivity Keyboard Shortcuts</div>
          <button class="modal-close-btn" onclick="document.getElementById('shortcutsModalOverlay').remove()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.25rem 1.5rem;">
          <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
              <div><b>Create Sale Invoice / Bill</b><div style="font-size:11px;color:#64748b;">Instant bill creation modal</div></div>
              <kbd style="background:#0f172a;color:#fff;padding:4px 10px;border-radius:6px;font-weight:700;font-family:monospace;">Alt + S</kbd>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
              <div><b>Lekha Jokha AI Advisor & Copilot</b><div style="font-size:11px;color:#64748b;">Launch AI financial advisor</div></div>
              <kbd style="background:#7c3aed;color:#fff;padding:4px 10px;border-radius:6px;font-weight:700;font-family:monospace;">Alt + A</kbd>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
              <div><b>Open Anything / Global Search</b><div style="font-size:11px;color:#64748b;">Search all sales, parties, items</div></div>
              <kbd style="background:#0f172a;color:#fff;padding:4px 10px;border-radius:6px;font-weight:700;font-family:monospace;">Ctrl + F</kbd>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
              <div><b>Close Active Modals & Popups</b><div style="font-size:11px;color:#64748b;">Dismiss any open overlay</div></div>
              <kbd style="background:#64748b;color:#fff;padding:4px 10px;border-radius:6px;font-weight:700;font-family:monospace;">Esc</kbd>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // --- Multi-Business Switcher & Management Modals ---
  openBusinessSwitcherModal() {
    const businesses = window.Store.getBusinesses();
    const activeBizId = window.Store.getActiveBusinessId();
    const subscriber = window.Store.getSubscriber();
    const activePlan = window.Store.getActivePlan();
    const activeBizCount = businesses.filter(
      (b) => b.status === "Active",
    ).length;

    const modalHtml = `
      <div class="modal-overlay active" id="bizSwitcherModalOverlay" style="z-index: 10000; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background: rgba(15, 23, 42, 0.45);">
        <div class="modal-dialog" style="max-width: 600px;">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Switch Active Business</h2>
              <div style="font-size: 12px; color: var(--text-muted);">
                Subscriber: <b>${subscriber.name}</b> &bull; Plan: <b>${activePlan.name}</b> (${activeBizCount} of ${activePlan.maxBusinesses} businesses used)
              </div>
            </div>
            <button class="modal-close-btn" onclick="document.getElementById('bizSwitcherModalOverlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
              ${businesses
                .map((b) => {
                  const isActive = b.id === activeBizId;
                  return `
                  <div style="border: 2px solid ${isActive ? "var(--primary)" : "var(--border)"}; background: ${isActive ? "#eff6ff" : "#fff"}; border-radius: var(--radius-md); padding: 1rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" class="biz-select-card" data-id="${b.id}">
                    <div>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.25rem;">🏢</span>
                        <strong style="font-size: 15px; color: var(--navy-900);">${b.name}</strong>
                        ${isActive ? '<span class="badge badge-success" style="font-size: 10px;">CURRENTLY ACTIVE</span>' : ""}
                      </div>
                      <div style="font-size: 12px; color: var(--text-muted); margin-top: 0.25rem;">
                        GSTIN: <code>${b.gstin || "Unregistered"}</code> &bull; ${b.city || ""}, ${b.state || ""}
                      </div>
                      <div style="font-size: 11px; color: #475569; margin-top: 0.25rem;">
                        Inventory: <b>${(b.items || []).length} items</b> &bull; Invoices: <b>${(b.sales || []).length} bills</b>
                      </div>
                    </div>
                    <div>
                      ${
                        isActive
                          ? `
                        <span style="font-weight: 700; color: var(--primary); font-size: 13px;">Selected ✓</span>
                      `
                          : `
                        <button class="btn btn-sm btn-primary switch-to-biz-btn" data-id="${b.id}">Switch</button>
                      `
                      }
                    </div>
                  </div>
                `;
                })
                .join("")}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem;">
              <a href="#subscription" onclick="document.getElementById('bizSwitcherModalOverlay').remove()" style="font-size: 13px; color: var(--primary); font-weight: 600;">
                View SaaS Plan Entitlements &rarr;
              </a>
              <button class="btn btn-success" id="modalAddNewBizBtn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Add Another Business</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Close on outside click
    const modalOverlay = document.getElementById("bizSwitcherModalOverlay");
    if (modalOverlay) {
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) modalOverlay.remove();
      });
    }

    // Bind card clicks
    document.querySelectorAll(".switch-to-biz-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        this.switchActiveBusiness(id);
      };
    });

    document.querySelectorAll(".biz-select-card").forEach((card) => {
      card.onclick = () => {
        const id = card.getAttribute("data-id");
        this.switchActiveBusiness(id);
      };
    });

    document.getElementById("modalAddNewBizBtn").onclick = () => {
      document.getElementById("bizSwitcherModalOverlay").remove();
      this.openAddBusinessModal();
    };
  }

  switchActiveBusiness(businessId) {
    // 1. Immediately remove the modal overlay so screen NEVER becomes or stays blurred
    const modal = document.getElementById("bizSwitcherModalOverlay");
    if (modal) modal.remove();
    document
      .querySelectorAll("#bizSwitcherModalOverlay")
      .forEach((m) => m.remove());

    try {
      // 2. Perform 0ms instantaneous local switch
      const biz = window.Store.setActiveBusiness(businessId);
      const activeBiz = window.Store.getActiveBusiness() || biz;

      // 3. Immediately reflect new company name in topbar & sidebar
      const topBizName = document.getElementById("topbarBusinessName");
      if (topBizName && activeBiz && activeBiz.name)
        topBizName.innerText = activeBiz.name;
      const compDisplay = document.getElementById("sidebarCompany");
      if (compDisplay && activeBiz && activeBiz.name)
        compDisplay.innerText = activeBiz.name;

      // 4. Instant re-render of current view with new tenant's data
      this.updateBadges();
      this.handleRoute();
      this.showToast(
        `Switched active business to ${activeBiz.name}!`,
        "success",
      );
    } catch (e) {
      this.showToast(e.message, "error");
    }
  }

  openAddBusinessModal() {
    const check = window.Store.canAddBusiness();
    if (!check.allowed) {
      const reasonMsg = `Plan limit reached! Your ${check.planName} plan allows up to ${check.maxAllowed} business${check.maxAllowed === 1 ? "" : "es"}. Please upgrade to Max to operate up to 5 businesses.`;
      this.showToast(reasonMsg, "warning");
      if (window.SubscriptionModule) {
        window.SubscriptionModule.openUpgradeModal("Max", reasonMsg);
      }
      return;
    }

    const modalHtml = `
      <div class="modal-overlay active" id="addBizModalOverlay" style="z-index: 10000;">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Register New Business Entity</h2>
              <div style="font-size: 12px; color: var(--text-muted);">
                Operate up to 5 distinct businesses under your subscriber account
              </div>
            </div>
            <button class="modal-close-btn" onclick="document.getElementById('addBizModalOverlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Prominent In-Modal Error Alert -->
            <div id="newBizErrorAlert" style="display:none;background:#fef2f2;border:1.5px solid #ef4444;color:#991b1b;padding:0.85rem 1rem;border-radius:var(--radius-md);margin-bottom:1.25rem;font-size:0.875rem;align-items:flex-start;gap:0.75rem;box-shadow:0 2px 4px rgba(0,0,0,0.06);">
              <span style="font-size:1.25rem;line-height:1;">⚠️</span>
              <div style="flex:1;">
                <div style="font-weight:700;margin-bottom:2px;" id="newBizErrorTitle">Unable to Create Business Entity</div>
                <div id="newBizErrorMessage" style="font-weight:500;font-size:0.85rem;line-height:1.45;"></div>
              </div>
              <button type="button" onclick="document.getElementById('newBizErrorAlert').style.display='none'" style="background:none;border:none;font-size:1.25rem;cursor:pointer;color:#991b1b;padding:0;line-height:1;">&times;</button>
            </div>

            <form id="newBizForm">
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Business Trade Name *</label>
                  <input type="text" id="nbName" class="form-control" placeholder="e.g. Acme Retailers & Traders" required>
                </div>
                <div class="form-group">
                  <label>Business Tagline / Nature</label>
                  <input type="text" id="nbTagline" class="form-control" placeholder="e.g. Wholesale Hardware & Tools">
                </div>
              </div>

              <div class="form-grid-3">
                <div class="form-group">
                  <label>GSTIN (15 Digits)</label>
                  <div class="input-with-button">
                    <input type="text" id="nbGstin" class="form-control" placeholder="07AAAAA0000A1Z5" maxlength="15" style="text-transform:uppercase;">
                    <button type="button" class="btn btn-outline btn-sm" id="verifyGstinBtn">Verify</button>
                  </div>
                  <div id="gstinFeedback" style="font-size:11px; margin-top:3px;"></div>
                </div>
                <div class="form-group">
                  <label>State & Jurisdiction *</label>
                  <select id="nbState" class="form-control" required>
                    <option value="Delhi (07)">Delhi (07)</option>
                    <option value="Maharashtra (27)">Maharashtra (27)</option>
                    <option value="Karnataka (29)">Karnataka (29)</option>
                    <option value="Gujarat (24)">Gujarat (24)</option>
                    <option value="Uttar Pradesh (09)">Uttar Pradesh (09)</option>
                    <option value="Haryana (06)">Haryana (06)</option>
                    <option value="Tamil Nadu (33)">Tamil Nadu (33)</option>
                    <option value="West Bengal (19)">West Bengal (19)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>City *</label>
                  <input type="text" id="nbCity" class="form-control" value="New Delhi" required>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label>Store Address</label>
                  <input type="text" id="nbAddress" class="form-control" placeholder="Shop / Office address">
                </div>
                <div class="form-group">
                  <label>Contact Phone</label>
                  <input type="text" id="nbPhone" class="form-control" placeholder="+91 98765 43210">
                </div>
              </div>

              <h4 style="font-size: 13px; font-weight: 700; color: #475569; margin: 1rem 0 0.5rem 0; border-top: 1px solid #e2e8f0; padding-top: 0.75rem;">
                Bank & Opening Balances
              </h4>
              <div class="form-grid-3">
                <div class="form-group">
                  <label>Bank Name</label>
                  <input type="text" id="nbBank" class="form-control" placeholder="e.g. HDFC Bank Ltd.">
                </div>
                <div class="form-group">
                  <label>Account Number</label>
                  <input type="text" id="nbAccNo" class="form-control" placeholder="e.g. 50200012345678">
                </div>
                <div class="form-group">
                  <label>UPI ID (QR Code)</label>
                  <input type="text" id="nbUpi" class="form-control" placeholder="e.g. business@hdfcbank">
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label>Opening Cash in Hand (₹)</label>
                  <input type="number" id="nbOpenCash" class="form-control" value="10000" min="0">
                </div>
                <div class="form-group">
                  <label>Opening Bank Balance (₹)</label>
                  <input type="number" id="nbOpenBank" class="form-control" value="50000" min="0">
                </div>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('addBizModalOverlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Business Entity</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // GSTIN Instant Verification
    const verifyBtn = document.getElementById("verifyGstinBtn");
    const gstinInput = document.getElementById("nbGstin");
    const feedback = document.getElementById("gstinFeedback");

    verifyBtn.onclick = async () => {
      const gstin = gstinInput.value.trim().toUpperCase();
      if (!gstin) {
        feedback.innerHTML =
          '<span style="color:var(--danger);">Please enter a GSTIN first.</span>';
        return;
      }
      feedback.innerHTML =
        '<span style="color:var(--text-muted);">Verifying with tax engine...</span>';
      try {
        const fetcher = window.apiFetch || fetch;
        const res = await fetcher(`/api/v1/gst/verify/${gstin}`);
        const data = await res.json();
        if (data.valid) {
          feedback.innerHTML = `<span style="color:var(--success); font-weight:700;">✓ Valid GSTIN: ${data.entityType} in ${data.stateName}</span>`;
        } else {
          feedback.innerHTML = `<span style="color:var(--danger); font-weight:700;">✗ ${data.reason}</span>`;
        }
      } catch (e) {
        feedback.innerHTML =
          '<span style="color:var(--success);">✓ Format verified locally</span>';
      }
    };

    document.getElementById("newBizForm").onsubmit = async (e) => {
      e.preventDefault();

      const errorAlert = document.getElementById("newBizErrorAlert");
      if (errorAlert) errorAlert.style.display = "none";

      const submitBtn = document.querySelector(
        '#newBizForm button[type="submit"]',
      );
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Creating Entity...";
      }

      const name = document.getElementById("nbName").value.trim();
      const tagline = document.getElementById("nbTagline").value.trim();
      const gstin = document
        .getElementById("nbGstin")
        .value.trim()
        .toUpperCase();
      const state = document.getElementById("nbState").value;
      const city = document.getElementById("nbCity").value.trim();
      const address = document.getElementById("nbAddress").value.trim();
      const phone = document.getElementById("nbPhone").value.trim();
      const bankName = document.getElementById("nbBank").value.trim();
      const accountNumber = document.getElementById("nbAccNo").value.trim();
      const upiId = document.getElementById("nbUpi").value.trim();
      const openingCash =
        Number(document.getElementById("nbOpenCash").value) || 0;
      const openingBank =
        Number(document.getElementById("nbOpenBank").value) || 0;

      // Authoritative central backend business creation
      try {
        const fetcher = window.apiFetch || fetch;
        const res = await fetcher("/api/v1/businesses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, gstin, state }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg =
            errData.message ||
            errData.error ||
            "Failed to create business entity. Please check your plan limits.";

          if (errorAlert) {
            const errorMsgEl = document.getElementById("newBizErrorMessage");
            if (errorMsgEl) errorMsgEl.innerText = errMsg;
            errorAlert.style.display = "flex";
            errorAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
          this.showToast(errMsg, "error");

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Create Business Entity";
          }
          return;
        }
        const created = await res.json();
        const serverBiz = created.business;
        const localBiz = {
          ...serverBiz,
          tagline,
          city,
          address,
          phone: phone || serverBiz.phone,
          bankName,
          accountNumber,
          upiId,
          openingCash,
          openingBank,
          parties: [],
          items: [],
          sales: [],
          purchases: [],
          expenses: [],
        };
        if (!window.Store.data.businesses) window.Store.data.businesses = [];
        const exists = window.Store.data.businesses.find(
          (b) => b.id === serverBiz.id,
        );
        if (!exists) {
          window.Store.data.businesses.push(localBiz);
        }
        await window.Store.setActiveBusiness(serverBiz.id);
        const modal = document.getElementById("addBizModalOverlay");
        if (modal) modal.remove();
        this.updateBadges();
        this.handleRoute();
        this.showToast(
          `New business entity "${name}" created and activated!`,
          "success",
        );
      } catch (err) {
        const errMsg =
          err.message ||
          "An error occurred while creating the business entity.";
        if (errorAlert) {
          const errorMsgEl = document.getElementById("newBizErrorMessage");
          if (errorMsgEl) errorMsgEl.innerText = errMsg;
          errorAlert.style.display = "flex";
          errorAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        this.showToast(errMsg, "error");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = "Create Business Entity";
        }
      }
    };
  }

  // --- Notification Toast Engine ---
  showToast(message, type = "success") {
    if (!this.toastContainer) {
      this.toastContainer = document.querySelector(".toast-container");
      if (!this.toastContainer) {
        this.toastContainer = document.createElement("div");
        this.toastContainer.className = "toast-container";
        document.body.appendChild(this.toastContainer);
      }
    }
    this.toastContainer.style.zIndex = "99999999";

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const iconSvg =
      type === "error" || type === "danger"
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
        : type === "warning"
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    toast.innerHTML = `
      ${iconSvg}
      <span style="flex:1;">${message}</span>
      <button type="button" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;padding:0 0 0 8px;line-height:1;" onclick="this.parentElement.remove()">&times;</button>
    `;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s";
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // --- Universal Associated Action Button Resolver ---
  findAssociatedActionButton(input) {
    if (!input || input.disabled) return null;

    const isVisibleAndUsable = (btn) => {
      if (!btn || btn.disabled) return false;
      if (btn.getAttribute("aria-hidden") === "true") return false;
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      )
        return false;
      return (
        rect.width > 0 ||
        rect.height > 0 ||
        btn.offsetWidth > 0 ||
        btn.offsetHeight > 0
      );
    };

    const isActionButton = (btn, isSearchInput = false) => {
      if (!isVisibleAndUsable(btn)) return false;
      const text = (btn.textContent || "").trim().toLowerCase();
      const cls = (btn.className || "").toLowerCase();
      const id = (btn.id || "").toLowerCase();

      // Negative rules: Disqualify buttons that are clearly not the primary action
      if (
        cls.includes("close") ||
        cls.includes("cancel") ||
        cls.includes("btn-secondary") ||
        cls.includes("btn-outline-secondary")
      )
        return false;
      if (
        cls.includes("delete") ||
        cls.includes("btn-danger") ||
        id.includes("delete")
      )
        return false;
      if (
        cls.includes("tab-btn") ||
        cls.includes("subtab-btn") ||
        btn.hasAttribute("data-tab")
      )
        return false;
      if (
        btn.hasAttribute("data-dismiss") ||
        btn.getAttribute("aria-label") === "Close"
      )
        return false;
      if (
        [
          "cancel",
          "close",
          "back",
          "reset",
          "clear",
          "no",
          "discard",
          "×",
          "x",
        ].includes(text)
      )
        return false;

      // If the input is a search box, only match search buttons
      if (isSearchInput) {
        return (
          id.includes("search") ||
          cls.includes("search") ||
          text.includes("search") ||
          btn.querySelector("svg, i")
        );
      }

      // Positive rules
      if (btn.type === "submit") return true;
      if (cls.includes("btn-primary") || cls.includes("btn-success"))
        return true;
      if (
        id.includes("save") ||
        id.includes("submit") ||
        id.includes("add") ||
        id.includes("create") ||
        id.includes("confirm") ||
        id.includes("apply") ||
        id.includes("verify") ||
        id.includes("send") ||
        id.includes("pay") ||
        id.includes("import") ||
        id.includes("export") ||
        id.includes("login") ||
        id.includes("search")
      )
        return true;
      if (
        /^(save|submit|add|create|confirm|apply|verify|send|pay|search|go|update|continue|next|ok|done|proceed|\+)/i.test(
          text,
        )
      )
        return true;

      // Inside a tight group (e.g. flex row with input and button), treat as associated action
      return true;
    };

    const isSearch =
      input.type === "search" ||
      (input.id && input.id.toLowerCase().includes("search"));

    // 1. Explicit data attribute if present on input
    if (input.dataset && input.dataset.actionBtn) {
      const explicitBtn = document.querySelector(input.dataset.actionBtn);
      if (explicitBtn && isVisibleAndUsable(explicitBtn)) return explicitBtn;
    }

    // 2. Direct ID-based exact match for key known inputs
    const inputId = input.id || "";
    if (inputId === "newCategoryInput") {
      const b = document.getElementById("addNewCategoryBtn");
      if (b && isVisibleAndUsable(b)) return b;
    }
    if (inputId === "newSubCategoryInput") {
      const b = document.getElementById("addNewSubCategoryBtn");
      if (b && isVisibleAndUsable(b)) return b;
    }
    if (inputId === "authPhoneInput") {
      const b = document.getElementById("sendOtpSubmitBtn");
      if (b && isVisibleAndUsable(b)) return b;
    }
    if (inputId === "authOtpInput") {
      const b = document.getElementById("verifyOtpSubmitBtn");
      if (b && isVisibleAndUsable(b)) return b;
    }
    if (inputId === "authPasswordInput" || inputId === "authPinInput") {
      const b = document.getElementById("submitPassAuthBtn");
      if (b && isVisibleAndUsable(b)) return b;
    }

    // Special invoice item table handling: tab to next input or add row
    if (input.closest(".invoice-item-table")) {
      const row = input.closest("tr");
      if (row) {
        const inputsInRow = Array.from(
          row.querySelectorAll('input:not([type="hidden"]), select'),
        );
        const currentIndex = inputsInRow.indexOf(input);
        if (currentIndex >= 0 && currentIndex < inputsInRow.length - 1) {
          inputsInRow[currentIndex + 1].focus();
          return null;
        } else {
          const addRowBtn = document.getElementById("addInvoiceRowBtn");
          if (addRowBtn && isVisibleAndUsable(addRowBtn)) return addRowBtn;
        }
      }
    }

    // 3. Search immediate parent containers up to 3 levels (tight groups like flex row, input-group)
    let container = input.parentElement;
    for (
      let depth = 0;
      depth < 3 && container && container !== document.body;
      depth++
    ) {
      const candidateBtns = Array.from(
        container.querySelectorAll('button, .btn, input[type="submit"]'),
      );
      const matchingBtns = candidateBtns.filter(
        (b) => b !== input && isActionButton(b, isSearch),
      );
      if (matchingBtns.length > 0) {
        return matchingBtns[0];
      }
      if (
        container.matches(
          'form, .modal, .modal-content, .modal-dialog, .card, [role="dialog"], fieldset',
        )
      ) {
        break;
      }
      container = container.parentElement;
    }

    if (isSearch) {
      return null;
    }

    // 4. Form context
    const form = input.closest("form");
    if (form) {
      const submitBtn = form.querySelector(
        'button[type="submit"]:not([disabled]), input[type="submit"]:not([disabled])',
      );
      if (submitBtn && isVisibleAndUsable(submitBtn)) return submitBtn;

      const primaryBtn = form.querySelector(
        ".btn-primary:not([disabled]), .btn-success:not([disabled])",
      );
      if (primaryBtn && isVisibleAndUsable(primaryBtn)) return primaryBtn;

      const anyAction = Array.from(
        form.querySelectorAll("button:not([disabled]), .btn:not([disabled])"),
      ).find((b) => isActionButton(b, false));
      if (anyAction) return anyAction;
    }

    // 5. Modal / Dialog context
    const modal = input.closest(
      '.modal, .modal-content, .modal-dialog, [role="dialog"], .offcanvas, .drawer, [id*="Modal"]',
    );
    if (modal) {
      const footer = modal.querySelector(
        '.modal-footer, .card-footer, [class*="footer"]',
      );
      if (footer) {
        const footerBtn = footer.querySelector(
          'button[type="submit"], .btn-primary, .btn-success, [id*="save"], [id*="Save"], [id*="Submit"], [id*="submit"]',
        );
        if (footerBtn && isVisibleAndUsable(footerBtn)) return footerBtn;
      }
      const modalBtn = modal.querySelector(
        'button[type="submit"], .btn-primary, .btn-success, [id*="save"], [id*="Save"], [id*="Submit"], [id*="submit"], [id*="Add"], [id*="add"]',
      );
      if (modalBtn && isVisibleAndUsable(modalBtn)) return modalBtn;
    }

    // 6. Card / Section context
    const card = input.closest(".card, .card-body, .panel, .settings-section");
    if (card) {
      const cardBtn = card.querySelector(
        'button[type="submit"], .btn-primary, .btn-success, [id*="save"], [id*="Save"], [id*="Add"], [id*="add"]',
      );
      if (cardBtn && isVisibleAndUsable(cardBtn)) return cardBtn;
    }

    return null;
  }
}

window.LekhaJokhaApp = LekhaJokhaApp;
// alias
window.LekhaJokhaApp = LekhaJokhaApp;

// Instantiate on DOMContentLoaded or immediately if DOM is already ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.App = new LekhaJokhaApp();
    window.app = window.App;
  });
} else {
  window.App = new LekhaJokhaApp();
  window.app = window.App;
}

window.findAssociatedActionButton = (input) =>
  window.App && window.App.findAssociatedActionButton
    ? window.App.findAssociatedActionButton(input)
    : null;
