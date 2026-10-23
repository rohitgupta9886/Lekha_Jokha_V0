// ========================================================
// Vyapar Pro - Dashboard View Component
// ========================================================

window.DashboardModule = {
  render(container) {
    const parties = window.Store.getParties();
    const items = window.Store.getItems();
    const sales = window.Store.getSales();
    const purchases = window.Store.getPurchases();
    const cashBank = window.Store.getCashBank();

    // 1. Calculate Metrics
    let totalReceivables = 0; // You'll Get
    let totalPayables = 0;    // You'll Pay

    parties.forEach(p => {
      const bal = Number(p.balance) || 0;
      if (bal > 0) totalReceivables += bal;
      if (bal < 0) totalPayables += Math.abs(bal);
    });

    const cashInHand = Number(cashBank.cashInHand || 0);
    const bankBalance = Number(
      (cashBank.hdfcBank || 0) + (cashBank.sbiBank || 0) ||
      (cashBank.bankAccounts && cashBank.bankAccounts.reduce((acc, b) => acc + (Number(b.balance) || 0), 0)) ||
      0
    );
    const totalCashBank = cashInHand + bankBalance;

    let stockValue = 0;
    const lowStockItems = [];
    items.forEach(itm => {
      stockValue += (Number(itm.purchasePrice) || Number(itm.salePrice) * 0.8) * itm.stock;
      if (itm.stock <= itm.minStock) {
        lowStockItems.push(itm);
      }
    });

    const totalSaleVolume = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    // 2. Render Template
    container.innerHTML = `
      <!-- Top KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-collect">
          <div class="kpi-header">
            <span class="kpi-label">You'll Get (Receivable)</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            </div>
          </div>
          <div class="kpi-value text-success">₹${totalReceivables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div class="kpi-footer">
            <span>Pending from customers</span>
          </div>
        </div>

        <div class="kpi-card kpi-pay">
          <div class="kpi-header">
            <span class="kpi-label">You'll Pay (Payable)</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
            </div>
          </div>
          <div class="kpi-value text-danger">₹${totalPayables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div class="kpi-footer">
            <span>Payable to suppliers</span>
          </div>
        </div>

        <div class="kpi-card kpi-cash">
          <div class="kpi-header">
            <span class="kpi-label">Cash & Bank Balance</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            </div>
          </div>
          <div class="kpi-value">₹${totalCashBank.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div class="kpi-footer">
            <span>Cash: ₹${cashInHand.toLocaleString('en-IN')} | Banks: ₹${bankBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="kpi-card kpi-stock">
          <div class="kpi-header">
            <span class="kpi-label">Inventory Stock Value</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            </div>
          </div>
          <div class="kpi-value" style="color: #d97706;">₹${stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div class="kpi-footer">
            <span>${items.length} total products in catalog</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons Row -->
      <div class="quick-actions-bar">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="quick-actions-badge">⚡ FAST ACTIONS</span>
          <span style="font-size: 0.82rem; color: #64748b; font-weight: 500;">Direct 1-Click Operations</span>
        </div>
        <div style="display: flex; gap: 0.65rem; flex-wrap: wrap;">
          <button class="btn-fast-action btn-fast-sale" id="dashCreateSaleBtn">+ Add Sale Invoice</button>
          <button class="btn-fast-action btn-fast-purchase" id="dashCreatePurchaseBtn">+ Record Purchase</button>
          <button class="btn-fast-action btn-fast-party" id="dashAddPartyBtn">+ Add Customer / Vendor</button>
          <button class="btn-fast-action btn-fast-item" id="dashAddItemBtn">+ Add Inventory Item</button>
        </div>
      </div>

      <!-- Low Stock Alert Banner (if any) -->
      ${lowStockItems.length > 0 ? `
        <div class="low-stock-alert-card">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(245, 158, 11, 0.2); display: flex; align-items: center; justify-content: center; color: #d97706; flex-shrink: 0;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <div>
              <div style="color: #92400e; font-weight: 800; font-size: 0.9rem;">Low Stock Inventory Warning</div>
              <div style="color: #78350f; font-size: 0.82rem; font-weight: 500;">${lowStockItems.map(i => `<strong>${i.name}</strong> (${i.stock} ${i.unit} left)`).join(' • ')}</div>
            </div>
          </div>
          <a href="#items" class="btn btn-sm btn-outline" style="border-color: #d97706; color: #b45309; background: #ffffff; font-weight: 700; border-radius: 8px;">Restock Inventory &rarr;</a>
        </div>
      ` : ''}

      <!-- Grid: Sales Trend Chart & Recent Invoices -->
      <div style="display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; margin-bottom: 1.5rem;">
        <!-- Recent Transactions Card -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
              <span>Recent Invoices</span>
            </h2>
            <a href="#sales" class="view-all-sales-link">View All Sales &rarr;</a>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Payment</th>
                    <th class="text-right">Total (₹)</th>
                    <th class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${sales.slice(0, 5).map(sale => `
                    <tr>
                      <td class="table-mono"><strong>${sale.number}</strong></td>
                      <td>${sale.date}</td>
                      <td><strong>${sale.partyName}</strong></td>
                      <td>
                        <span class="badge ${sale.balance <= 0 ? 'badge-success' : 'badge-danger'}">
                          ${sale.balance <= 0 ? 'Paid' : `Due ₹${sale.balance}`}
                        </span>
                      </td>
                      <td class="text-right table-mono">₹${Number(sale.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-outline view-invoice-btn" data-id="${sale.id}">
                          View / Print
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Business Health & Financial Summary -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
              <span>Account Summary</span>
            </h2>
            <span class="badge badge-info" style="font-size: 10px;">FY 2026-27</span>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 1.1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 14px;">📈</span>
                  <span style="color: #64748b; font-weight: 500; font-size: 13px;">Total Sales Invoiced</span>
                </div>
                <span class="table-mono" style="font-weight: 800; font-size: 14px; color: #0f172a;">₹${totalSaleVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 14px;">📦</span>
                  <span style="color: #64748b; font-weight: 500; font-size: 13px;">Purchases Recorded</span>
                </div>
                <span class="table-mono" style="font-weight: 700; font-size: 14px; color: #0f172a;">₹${purchases.reduce((a, p) => a + (Number(p.total) || 0), 0).toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 14px;">👥</span>
                  <span style="color: #64748b; font-weight: 500; font-size: 13px;">Active Customers</span>
                </div>
                <span class="table-mono" style="font-weight: 800; font-size: 14px; color: #0284c7;">${parties.filter(p => p.type === 'Customer').length}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 14px;">🏭</span>
                  <span style="color: #64748b; font-weight: 500; font-size: 13px;">Registered Vendors</span>
                </div>
                <span class="table-mono" style="font-weight: 800; font-size: 14px; color: #64748b;">${parties.filter(p => p.type === 'Supplier').length}</span>
              </div>
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 0.25rem;">
                <div style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">GST Compliance Health</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">GSTR-1 (Oct 2026)</span>
                  <span class="badge badge-success" style="font-weight: 800;">✓ Ready to Export</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 3. Attach Listeners
    container.querySelector('#dashCreateSaleBtn').addEventListener('click', () => {
      window.App.openSaleModal();
    });
    container.querySelector('#dashCreatePurchaseBtn').addEventListener('click', () => {
      window.location.hash = '#purchases';
    });
    container.querySelector('#dashAddPartyBtn').addEventListener('click', () => {
      window.App.openPartyModal();
    });
    container.querySelector('#dashAddItemBtn').addEventListener('click', () => {
      window.App.openItemModal();
    });

    container.querySelectorAll('.view-invoice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        window.App.previewInvoice(id);
      });
    });
  }
};
