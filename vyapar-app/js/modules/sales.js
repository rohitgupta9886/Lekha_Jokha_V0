// ==============================================================================
// Vyapar Pro - Comprehensive Sales & Invoicing Module
// Workflows: Tax Invoices, Quotations/Estimates, Sales Returns, Delivery Challans & Payment In
// ==============================================================================

window.SalesModule = {
  currentTab: 'invoices', // 'invoices' | 'estimates' | 'returns' | 'challans' | 'payments'
  currentPage: 1,
  pageSize: 15,
  searchQuery: '',

  render(container) {
    const activeBiz = window.Store.getActiveBusiness();
    const allSales = window.Store.getSales();
    const allEstimates = window.Store.getEstimates();
    const allReturns = window.Store.getSalesReturns();
    const allChallans = window.Store.getDeliveryChallans();

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Top Sub-Navigation Tabs -->
        <div class="card" style="padding: 0.5rem 1rem;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sm ${this.currentTab === 'invoices' ? 'btn-primary' : 'btn-outline'} sales-subtab-btn" data-tab="invoices">
                <span>Sale Invoices (${allSales.length})</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'estimates' ? 'btn-primary' : 'btn-outline'} sales-subtab-btn" data-tab="estimates">
                <span>Estimates & Quotations (${allEstimates.length})</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'returns' ? 'btn-primary' : 'btn-outline'} sales-subtab-btn" data-tab="returns">
                <span>Sales Returns / Credit Notes (${allReturns.length})</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'challans' ? 'btn-primary' : 'btn-outline'} sales-subtab-btn" data-tab="challans">
                <span>Delivery Challans (${allChallans.length})</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'payments' ? 'btn-primary' : 'btn-outline'} sales-subtab-btn" data-tab="payments">
                <span>Payment In (Receipts)</span>
              </button>
            </div>

            <div style="font-size: 12px; color: var(--text-muted);">
              Active Business: <b>${activeBiz.name}</b>
            </div>
          </div>
        </div>

        <!-- Tab Body Content -->
        <div id="salesTabContent">
          ${this.renderTabContent()}
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  renderTabContent() {
    switch (this.currentTab) {
      case 'estimates':
        return this.renderEstimatesTab();
      case 'returns':
        return this.renderReturnsTab();
      case 'challans':
        return this.renderChallansTab();
      case 'payments':
        return this.renderPaymentsTab();
      case 'invoices':
      default:
        return this.renderInvoicesTab();
    }
  },

  // --- Sub-Tab: Tax Invoices ---
  renderInvoicesTab() {
    const allSales = window.Store.getSales();
    const filtered = this.searchQuery
      ? allSales.filter(s => (s.number + ' ' + s.partyName).toLowerCase().includes(this.searchQuery.toLowerCase()))
      : allSales;

    const paginated = window.PaginationUtils
      ? window.PaginationUtils.paginate(filtered, this.currentPage, this.pageSize)
      : { items: filtered, totalItems: filtered.length, totalPages: 1, currentPage: 1, startIndex: 1, endIndex: filtered.length };

    return `
      <div class="card">
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <h2 class="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              <span>Tax Invoices (GST)</span>
            </h2>
            <span class="badge badge-info">${allSales.length} Total</span>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <input type="text" id="salesSearchInput" class="form-control" style="width: 200px;" placeholder="Search invoice or party..." value="${this.searchQuery}">
            <button class="btn btn-outline btn-sm" id="salesVoiceBillingBtn" style="border-color:#7c3aed;color:#7c3aed;">
              <span>✨ AI Smart Bill</span>
            </button>
            <button class="btn btn-primary btn-sm" id="newSaleBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>+ Create Tax Invoice</span>
            </button>
          </div>
        </div>

        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="table" id="salesTable">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>Place of Supply</th>
                  <th>Payment Type</th>
                  <th class="text-right">Total (₹)</th>
                  <th class="text-right">Balance Due (₹)</th>
                  <th>Status</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody id="salesTableBody">
                ${paginated.items.length === 0 ? `
                  <tr><td colspan="9" class="text-center text-muted" style="padding: 2.5rem;">No invoices found. Click <b>+ Create Tax Invoice</b> to issue your first bill.</td></tr>
                ` : paginated.items.map(sale => `
                  <tr>
                    <td class="table-mono">
                      <strong>${sale.number}</strong>
                      ${sale.ewayBillNumber ? `
                        <div style="font-size:10px;color:#059669;font-weight:700;">EWB: ${sale.ewayBillNumber}</div>
                      ` : ''}
                    </td>
                    <td>${sale.date}</td>
                    <td><strong>${sale.partyName}</strong></td>
                    <td><span style="font-size: 0.75rem; color: #475569;">${sale.placeOfSupply}</span></td>
                    <td>${sale.paymentMode}</td>
                    <td class="text-right table-mono" style="font-weight:700;">₹${Number(sale.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right table-mono ${sale.balance > 0 ? 'text-danger' : 'text-success'}">
                      ₹${Number(sale.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span class="badge ${sale.balance <= 0 ? 'badge-success' : 'badge-danger'}">
                        ${sale.balance <= 0 ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td class="text-center">
                      <div class="table-action-group" style="justify-content: center; gap: 0.35rem;">
                        <button class="btn btn-sm btn-outline view-sale-action" data-id="${sale.id}" title="View & Print Invoice">
                          Print
                        </button>
                        <button class="btn btn-sm btn-outline eway-sale-action" data-id="${sale.id}" title="${sale.ewayBillNumber ? 'View e-Way Bill' : 'Generate e-Way Bill'}" style="${sale.ewayBillNumber ? 'color:#059669;border-color:#059669;' : ''}">
                          ${sale.ewayBillNumber ? 'EWB ✓' : '+ e-Way'}
                        </button>
                        <button class="btn btn-sm btn-outline whatsapp-sale-action" data-id="${sale.id}" title="Send on WhatsApp">
                          WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div id="salesPaginationContainer">
          ${window.PaginationUtils ? window.PaginationUtils.renderPaginationToolbar(paginated, 'SalesModule') : ''}
        </div>
      </div>
    `;
  },

  // --- Sub-Tab: Estimates & Quotations ---
  renderEstimatesTab() {
    const estimates = window.Store.getEstimates();
    return `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            <span>Estimates & Price Quotations</span>
          </h2>
          <button class="btn btn-primary btn-sm" id="newEstimateBtn">+ Create Quotation</button>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Quotation No</th>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Valid Until</th>
                  <th class="text-right">Total Amount (₹)</th>
                  <th>Status</th>
                  <th class="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                ${estimates.length === 0 ? `
                  <tr><td colspan="7" class="text-center text-muted" style="padding: 2.5rem;">No quotations created yet. Quotations can be converted to Sale Invoices in 1-click.</td></tr>
                ` : estimates.map(est => `
                  <tr>
                    <td><b>${est.number}</b></td>
                    <td>${est.date}</td>
                    <td><strong>${est.partyName}</strong></td>
                    <td>${est.validUntil || 'N/A'}</td>
                    <td class="text-right table-mono" style="font-weight:700;">₹${Number(est.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span class="badge ${est.status === 'Converted' ? 'badge-success' : 'badge-info'}">${est.status}</span>
                    </td>
                    <td class="text-center">
                      ${est.status === 'Converted' ? `
                        <span class="badge badge-success">Converted to Invoice</span>
                      ` : `
                        <button class="btn btn-sm btn-success convert-est-btn" data-id="${est.id}">
                          Convert to Invoice ⚡
                        </button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // --- Sub-Tab: Sales Returns ---
  renderReturnsTab() {
    const returns = window.Store.getSalesReturns();
    return `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            <span>Sales Returns / Credit Notes</span>
          </h2>
          <button class="btn btn-primary btn-sm" id="newReturnBtn">+ Record Sales Return</button>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Credit Note No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Original Invoice</th>
                  <th>Reason</th>
                  <th class="text-right">Credit Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${returns.length === 0 ? `
                  <tr><td colspan="6" class="text-center text-muted" style="padding: 2.5rem;">No sales returns logged. Returned goods automatically restock inventory and reduce customer balances.</td></tr>
                ` : returns.map(ret => `
                  <tr>
                    <td><b>${ret.number}</b></td>
                    <td>${ret.date}</td>
                    <td><strong>${ret.partyName}</strong></td>
                    <td><code>${ret.invoiceNumber || 'N/A'}</code></td>
                    <td>${ret.reason || 'Customer Return'}</td>
                    <td class="text-right table-mono text-danger" style="font-weight:700;">-₹${Number(ret.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // --- Sub-Tab: Delivery Challans ---
  renderChallansTab() {
    const challans = window.Store.getDeliveryChallans();
    return `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon></svg>
            <span>Delivery Challans (Goods Dispatch)</span>
          </h2>
          <button class="btn btn-primary btn-sm" id="newChallanBtn">+ Create Delivery Challan</button>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Date</th>
                  <th>Consignee / Party</th>
                  <th>Vehicle Number</th>
                  <th>Transporter</th>
                  <th>Items Summary</th>
                  <th>Status</th>
                  <th class="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                ${challans.length === 0 ? `
                  <tr><td colspan="8" class="text-center text-muted" style="padding: 2.5rem;">No delivery challans issued. Use challans for goods transfer or job work without an invoice.</td></tr>
                ` : challans.map(ch => `
                  <tr>
                    <td><b>${ch.number}</b></td>
                    <td>${ch.date}</td>
                    <td><strong>${ch.partyName}</strong></td>
                    <td><code>${ch.vehicleNumber || ch.vehicleNo || 'Self Delivery'}</code></td>
                    <td>${ch.transporter || ch.driverName || 'Direct'}</td>
                    <td>${ch.itemsSummary || (ch.items ? ch.items.map(i => `${i.name || 'Item'} (x${i.qty})`).join(', ') : 'Goods Package')}</td>
                    <td><span class="badge ${ch.status && ch.status.includes('Converted') ? 'badge-info' : 'badge-success'}">${ch.status || 'Dispatched'}</span></td>
                    <td class="text-center">
                      ${ch.status && ch.status.includes('Converted') ? `
                        <span style="font-size:11px;color:var(--text-muted);">Invoiced</span>
                      ` : `
                        <button class="btn btn-xs btn-primary convert-challan-btn" data-id="${ch.id}">
                          Convert to Invoice
                        </button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // --- Sub-Tab: Payment In Receipts ---
  renderPaymentsTab() {
    const parties = window.Store.getParties().filter(p => p.type === 'Customer');
    const sales = window.Store.getSales();
    const unpaidSales = sales.filter(s => s.balance > 0);

    return `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <span>Payment In (Customer Collections)</span>
          </h2>
          <button class="btn btn-success btn-sm" id="recordPaymentInBtn">+ Record Payment In</button>
        </div>
        <div class="card-body">
          <div style="background: #f8fafc; padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; border: 1px solid var(--border);">
            <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 0.5rem;">Outstanding Customer Balances</h4>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              ${parties.map(p => `
                <div style="background: #fff; padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border); min-width: 200px;">
                  <div style="font-weight: 700; font-size: 13px;">${p.name}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">${p.phone}</div>
                  <div style="font-size: 1.1rem; font-weight: 800; color: ${p.balance > 0 ? 'var(--danger)' : 'var(--success)'}; margin-top: 0.25rem;">
                    ₹${Number(p.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 0.75rem;">Pending Unpaid Invoices</h4>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th class="text-right">Total (₹)</th>
                  <th class="text-right">Due Amount (₹)</th>
                  <th class="text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody>
                ${unpaidSales.length === 0 ? `
                  <tr><td colspan="6" class="text-center text-success" style="padding: 1.5rem;">All customer invoices are fully settled! Zero outstanding dues.</td></tr>
                ` : unpaidSales.map(s => `
                  <tr>
                    <td><b>${s.number}</b></td>
                    <td>${s.date}</td>
                    <td><strong>${s.partyName}</strong></td>
                    <td class="text-right table-mono">₹${Number(s.total).toFixed(2)}</td>
                    <td class="text-right table-mono text-danger" style="font-weight:700;">₹${Number(s.balance).toFixed(2)}</td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-outline quick-settle-btn" data-id="${s.id}" style="color:var(--success);border-color:var(--success);">
                        Receive Full Payment
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    // Sub-tab button clicks
    container.querySelectorAll('.sales-subtab-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentTab = btn.getAttribute('data-tab');
        this.render(container);
      };
    });

    // Invoices Tab Actions
    const newSaleBtn = container.querySelector('#newSaleBtn');
    if (newSaleBtn) newSaleBtn.onclick = () => window.app.openSaleModal();

    const voiceBtn = container.querySelector('#salesVoiceBillingBtn');
    if (voiceBtn && window.AICopilotModule) {
      voiceBtn.onclick = () => window.AICopilotModule.openVoiceBillingModal();
    }

    const searchInput = container.querySelector('#salesSearchInput');
    if (searchInput) {
      searchInput.oninput = window.PaginationUtils
        ? window.PaginationUtils.debounce((e) => {
            this.searchQuery = e.target.value.trim();
            this.currentPage = 1;
            this.render(container);
          }, 250)
        : (e) => {
            this.searchQuery = e.target.value.trim();
            this.render(container);
          };
    }

    container.querySelectorAll('.view-sale-action').forEach(btn => {
      btn.onclick = () => window.app.previewInvoice(btn.getAttribute('data-id'));
    });

    container.querySelectorAll('.whatsapp-sale-action').forEach(btn => {
      btn.onclick = () => window.app.shareOnWhatsApp(btn.getAttribute('data-id'));
    });

    container.querySelectorAll('.eway-sale-action').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const sale = window.Store.getSale(id);
        if (sale && sale.ewayBillNumber) {
          window.location.hash = '#eway';
        } else if (window.EwayModule) {
          window.EwayModule.openGenerateModal(id);
        }
      };
    });

    // Estimates Tab Actions
    const newEstBtn = container.querySelector('#newEstimateBtn');
    if (newEstBtn) {
      newEstBtn.onclick = () => this.openEstimateModal();
    }

    container.querySelectorAll('.convert-est-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        try {
          const inv = window.Store.convertEstimateToInvoice(id);
          window.app.showToast(`Quotation converted to Tax Invoice #${inv.number}!`, 'success');
          this.currentTab = 'invoices';
          this.render(container);
        } catch (e) {
          window.app.showToast(e.message, 'error');
        }
      };
    });

    // Returns Tab Actions
    const newReturnBtn = container.querySelector('#newReturnBtn');
    if (newReturnBtn) {
      newReturnBtn.onclick = () => this.openReturnModal();
    }

    // Challans Tab Actions
    const newChallanBtn = container.querySelector('#newChallanBtn');
    if (newChallanBtn) {
      newChallanBtn.onclick = () => this.openChallanModal();
    }

    container.querySelectorAll('.convert-challan-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        try {
          const inv = window.Store.convertChallanToInvoice(id);
          window.app.showToast(`Converted Delivery Challan to Tax Invoice ${inv.number}!`, 'success');
          this.currentTab = 'invoices';
          this.render(container);
        } catch (e) {
          window.app.showToast(e.message, 'error');
        }
      };
    });

    // Payments Tab Actions
    const recordPayBtn = container.querySelector('#recordPaymentInBtn');
    if (recordPayBtn) {
      recordPayBtn.onclick = () => this.openPaymentInModal();
    }

    container.querySelectorAll('.quick-settle-btn').forEach(btn => {
      btn.onclick = () => {
        const saleId = btn.getAttribute('data-id');
        const sale = window.Store.getSale(saleId);
        if (sale) {
          const due = sale.balance;
          sale.paid += due;
          sale.balance = 0;
          sale.status = "Paid";
          
          const party = window.Store.getParty(sale.partyId);
          if (party) {
            party.balance = Math.max(0, (party.balance || 0) - due);
          }
          const cashBank = window.Store.getCashBank();
          cashBank.cashInHand = (cashBank.cashInHand || 0) + due;
          window.Store.logAction("Payment In Received", `Full settlement of ₹${due.toFixed(2)} received for ${sale.number}`);
          window.Store.save();
          window.app.showToast(`Received ₹${due.toFixed(2)} full payment for ${sale.number}!`, 'success');
          this.render(container);
        }
      };
    });
  },

  // Modals for Sub-documents
  openEstimateModal() {
    const customers = window.Store.getParties().filter(p => p.type === 'Customer');
    const items = window.Store.getItems();
    const modalHtml = `
      <div class="modal-overlay active" id="estimateModalOverlay" style="z-index: 10000;">
        <div class="modal-dialog" style="max-width: 500px;">
          <div class="modal-header">
            <h2 class="modal-title">Create Price Quotation / Estimate</h2>
            <button class="modal-close-btn" onclick="document.getElementById('estimateModalOverlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="estForm">
              <div class="form-group">
                <label>Select Customer *</label>
                <select id="estParty" class="form-control" required>
                  ${customers.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Product *</label>
                <select id="estItem" class="form-control" required>
                  ${items.map(i => `<option value="${i.id}" data-name="${i.name}" data-rate="${i.salePrice}">${i.name} (₹${i.salePrice})</option>`).join('')}
                </select>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Quantity</label>
                  <input type="number" id="estQty" class="form-control" value="5" min="1" required>
                </div>
                <div class="form-group">
                  <label>Valid Until</label>
                  <input type="date" id="estValid" class="form-control" value="${new Date(Date.now() + 15*86400000).toISOString().split('T')[0]}">
                </div>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('estimateModalOverlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Quotation</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('estForm').onsubmit = (e) => {
      e.preventDefault();
      const partySel = document.getElementById('estParty');
      const partyId = partySel.value;
      const partyName = partySel.options[partySel.selectedIndex].getAttribute('data-name');
      const itemSel = document.getElementById('estItem');
      const itemId = itemSel.value;
      const itemName = itemSel.options[itemSel.selectedIndex].getAttribute('data-name');
      const rate = Number(itemSel.options[itemSel.selectedIndex].getAttribute('data-rate'));
      const qty = Number(document.getElementById('estQty').value);
      const validUntil = document.getElementById('estValid').value;

      const total = rate * qty;
      window.Store.addEstimate({
        partyId,
        partyName,
        validUntil,
        total,
        items: [{ itemId, name: itemName, qty, rate, amount: total }]
      });

      document.getElementById('estimateModalOverlay').remove();
      window.app.showToast('Quotation created successfully!', 'success');
      this.currentTab = 'estimates';
      this.render(window.app.viewContainer);
    };
  },

  openReturnModal() {
    const customers = window.Store.getParties().filter(p => p.type === 'Customer');
    const items = window.Store.getItems();
    const modalHtml = `
      <div class="modal-overlay active" id="returnModalOverlay" style="z-index: 10000;">
        <div class="modal-dialog" style="max-width: 500px;">
          <div class="modal-header">
            <h2 class="modal-title">Record Sales Return (Credit Note)</h2>
            <button class="modal-close-btn" onclick="document.getElementById('returnModalOverlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="returnForm">
              <div class="form-group">
                <label>Customer *</label>
                <select id="retParty" class="form-control" required>
                  ${customers.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Returned Item *</label>
                <select id="retItem" class="form-control" required>
                  ${items.map(i => `<option value="${i.id}" data-name="${i.name}" data-rate="${i.salePrice}">${i.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Returned Quantity</label>
                  <input type="number" id="retQty" class="form-control" value="1" min="1" required>
                </div>
                <div class="form-group">
                  <label>Return Reason</label>
                  <input type="text" id="retReason" class="form-control" placeholder="e.g. Defective / Expiry" value="Customer return">
                </div>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('returnModalOverlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-danger">Issue Credit Note</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('returnForm').onsubmit = (e) => {
      e.preventDefault();
      const partySel = document.getElementById('retParty');
      const partyId = partySel.value;
      const partyName = partySel.options[partySel.selectedIndex].getAttribute('data-name');
      const itemSel = document.getElementById('retItem');
      const itemId = itemSel.value;
      const itemName = itemSel.options[itemSel.selectedIndex].getAttribute('data-name');
      const rate = Number(itemSel.options[itemSel.selectedIndex].getAttribute('data-rate'));
      const qty = Number(document.getElementById('retQty').value);
      const reason = document.getElementById('retReason').value;

      const total = rate * qty;
      window.Store.addSalesReturn({
        partyId,
        partyName,
        reason,
        total,
        items: [{ itemId, name: itemName, qty, rate, amount: total }]
      });

      document.getElementById('returnModalOverlay').remove();
      window.app.showToast('Sales return recorded and inventory replenished!', 'success');
      this.currentTab = 'returns';
      this.render(window.app.viewContainer);
    };
  },

  openChallanModal() {
    const customers = window.Store.getParties().filter(p => p.type === 'Customer');
    const modalHtml = `
      <div class="modal-overlay active" id="challanModalOverlay" style="z-index: 10000;">
        <div class="modal-dialog" style="max-width: 500px;">
          <div class="modal-header">
            <h2 class="modal-title">Create Delivery Challan</h2>
            <button class="modal-close-btn" onclick="document.getElementById('challanModalOverlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="chForm">
              <div class="form-group">
                <label>Consignee (Customer) *</label>
                <select id="chParty" class="form-control" required>
                  ${customers.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Vehicle Number</label>
                  <input type="text" id="chVehicle" class="form-control" placeholder="e.g. DL-1L-4421" required>
                </div>
                <div class="form-group">
                  <label>Transporter Name</label>
                  <input type="text" id="chTransporter" class="form-control" placeholder="e.g. V-Trans Logistics">
                </div>
              </div>
              <div class="form-group">
                <label>Package / Item Description</label>
                <input type="text" id="chSummary" class="form-control" placeholder="e.g. 5 Cartons Electronic Goods" required>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('challanModalOverlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-primary">Dispatch Challan</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('chForm').onsubmit = (e) => {
      e.preventDefault();
      const partyName = document.getElementById('chParty').value;
      const vehicleNumber = document.getElementById('chVehicle').value.trim();
      const transporter = document.getElementById('chTransporter').value.trim();
      const itemsSummary = document.getElementById('chSummary').value.trim();

      window.Store.addDeliveryChallan({ partyName, vehicleNumber, transporter, itemsSummary });
      document.getElementById('challanModalOverlay').remove();
      window.app.showToast('Delivery Challan created successfully!', 'success');
      this.currentTab = 'challans';
      this.render(window.app.viewContainer);
    };
  },

  openPaymentInModal() {
    const customers = window.Store.getParties().filter(p => p.type === 'Customer');
    const modalHtml = `
      <div class="modal-overlay active" id="payInModalOverlay" style="z-index: 10000;">
        <div class="modal-dialog" style="max-width: 500px;">
          <div class="modal-header">
            <h2 class="modal-title">Record Payment In Receipt</h2>
            <button class="modal-close-btn" onclick="document.getElementById('payInModalOverlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="payInForm">
              <div class="form-group">
                <label>Received From Customer *</label>
                <select id="payParty" class="form-control" required>
                  ${customers.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name} (Balance: ₹${c.balance})</option>`).join('')}
                </select>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Amount Received (₹) *</label>
                  <input type="number" id="payAmount" class="form-control" step="0.01" min="1" required>
                </div>
                <div class="form-group">
                  <label>Payment Mode</label>
                  <select id="payMode" class="form-control">
                    <option value="Cash">Cash in Hand</option>
                    <option value="Bank / UPI">Bank / UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Reference / Transaction Note</label>
                <input type="text" id="payRef" class="form-control" placeholder="e.g. Paid via GPay / Cheque #10293">
              </div>
              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('payInModalOverlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-success">Save Payment Receipt</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('payInForm').onsubmit = (e) => {
      e.preventDefault();
      const partySel = document.getElementById('payParty');
      const partyId = partySel.value;
      const party = window.Store.getParty(partyId);
      const amount = Number(document.getElementById('payAmount').value);
      const mode = document.getElementById('payMode').value;
      const ref = document.getElementById('payRef').value;

      if (party) {
        party.balance = Math.max(0, (party.balance || 0) - amount);
      }
      const cashBank = window.Store.getCashBank();
      if (mode === 'Cash') {
        cashBank.cashInHand = (cashBank.cashInHand || 0) + amount;
      } else {
        cashBank.hdfcBank = (cashBank.hdfcBank || 0) + amount;
      }

      window.Store.logAction("Payment In Received", `Received ₹${amount.toFixed(2)} from ${party ? party.name : 'Customer'} via ${mode} (${ref})`);
      window.Store.save();

      document.getElementById('payInModalOverlay').remove();
      window.app.showToast(`Recorded receipt of ₹${amount.toFixed(2)}!`, 'success');
      this.currentTab = 'payments';
      this.render(window.app.viewContainer);
    };
  }
};
