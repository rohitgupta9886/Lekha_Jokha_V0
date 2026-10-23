// ==============================================================================
// LekhaJokha - Financial Reports, Balance Sheet & GST Compliance Module
// Workflows: Profit & Loss, Balance Sheet, Cash Flow, Daybook & GSTR-1 JSON Portal Export
// ==============================================================================

window.ReportsModule = {
  currentTab: 'pnl', // 'pnl' | 'balancesheet' | 'cashflow' | 'daybook' | 'gst'

  render(container) {
    const activeBiz = window.Store.getActiveBusiness();
    const sales = window.Store.getSales();
    const purchases = window.Store.getPurchases();
    const expenses = window.Store.getExpenses();
    const parties = window.Store.getParties();
    const items = window.Store.getItems();
    const cashBank = window.Store.getCashBank();

    // 1. P&L Financials
    const totalSales = sales.reduce((a, s) => a + (Number(s.subtotal) || 0), 0);
    const totalPurchases = purchases.reduce((a, p) => a + (Number(p.total) || 0), 0);
    const grossProfit = totalSales - (totalPurchases * 0.80);
    const totalExpenses = expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
    const netProfit = grossProfit - totalExpenses;

    // 2. GST Summary
    let totalTaxable = 0;
    let totalTaxCollected = 0;
    sales.forEach(s => {
      totalTaxable += Number(s.subtotal) || 0;
      totalTaxCollected += Number(s.tax) || 0;
    });

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Top Sub-Navigation Tabs -->
        <div class="card" style="padding: 0.5rem 1rem;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sm ${this.currentTab === 'pnl' ? 'btn-primary' : 'btn-outline'} rep-subtab-btn" data-tab="pnl">
                <span>Profit & Loss</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'balancesheet' ? 'btn-primary' : 'btn-outline'} rep-subtab-btn" data-tab="balancesheet">
                <span>Balance Sheet</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'cashflow' ? 'btn-primary' : 'btn-outline'} rep-subtab-btn" data-tab="cashflow">
                <span>Cash Flow</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'daybook' ? 'btn-primary' : 'btn-outline'} rep-subtab-btn" data-tab="daybook">
                <span>Daybook</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'gst' ? 'btn-primary' : 'btn-outline'} rep-subtab-btn" data-tab="gst">
                <span>GST Filing (GSTR-1 & 3B)</span>
              </button>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">
              Active Business: <b>${activeBiz.name}</b> (GSTIN: <code>${activeBiz.gstin}</code>)
            </div>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card ${netProfit >= 0 ? 'kpi-collect' : 'kpi-pay'}">
            <div class="kpi-header">
              <span class="kpi-label">Estimated Net Profit</span>
              <div class="kpi-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline></svg>
              </div>
            </div>
            <div class="kpi-value ${netProfit >= 0 ? 'text-success' : 'text-danger'}">
              ₹${netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div class="kpi-footer"><span>Revenue minus COGS & Expenses</span></div>
          </div>

          <div class="kpi-card kpi-stock">
            <div class="kpi-header">
              <span class="kpi-label">GSTR-1 Output Tax Liability</span>
              <div class="kpi-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect></svg>
              </div>
            </div>
            <div class="kpi-value" style="color: #0284c7;">
              ₹${totalTaxCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div class="kpi-footer"><span>Collected on outward GST invoices</span></div>
          </div>
        </div>

        <!-- Tab Body Content -->
        <div id="repTabBody">
          ${this.renderTabBody()}
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  renderTabBody() {
    switch (this.currentTab) {
      case 'balancesheet':
        return this.renderBalanceSheetTab();
      case 'cashflow':
        return this.renderCashFlowTab();
      case 'daybook':
        return this.renderDaybookTab();
      case 'gst':
        return this.renderGstTab();
      case 'pnl':
      default:
        return this.renderPnlTab();
    }
  },

  // --- Sub-Tab: Profit & Loss ---
  renderPnlTab() {
    const sales = window.Store.getSales();
    const purchases = window.Store.getPurchases();
    const expenses = window.Store.getExpenses();

    const totalSales = sales.reduce((a, s) => a + (Number(s.subtotal) || 0), 0);
    const totalPurchases = purchases.reduce((a, p) => a + (Number(p.total) || 0), 0);
    const cogs = totalPurchases * 0.80;
    const grossProfit = totalSales - cogs;
    const totalExpenses = expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
    const netProfit = grossProfit - totalExpenses;

    return `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <span>Profit & Loss Statement (FY 2026-27)</span>
          </h2>
          <button class="btn btn-outline btn-sm" id="exportPnlCsvBtn">Export P&L (CSV)</button>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th class="text-right">Debit / Expenses (₹)</th>
                  <th class="text-right">Credit / Income (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Gross Sales Revenue (Taxable Turnover)</strong></td>
                  <td class="text-right text-muted">-</td>
                  <td class="text-right table-mono text-success"><strong>₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
                <tr>
                  <td>Cost of Goods Sold (Purchases Incurred)</td>
                  <td class="text-right table-mono text-danger">₹${cogs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td class="text-right text-muted">-</td>
                </tr>
                <tr style="background:#f8fafc; font-weight:700;">
                  <td>Gross Business Profit</td>
                  <td class="text-right text-muted">-</td>
                  <td class="text-right table-mono">₹${grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                ${expenses.map(e => `
                  <tr>
                    <td style="padding-left: 2rem; color: #475569;">Less: ${e.category} (${e.description})</td>
                    <td class="text-right table-mono text-danger">₹${Number(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right text-muted">-</td>
                  </tr>
                `).join('')}
                <tr style="background:#f1f5f9; font-weight:800; font-size:1.1rem;">
                  <td>NET BUSINESS PROFIT / (LOSS)</td>
                  <td class="text-right text-muted">-</td>
                  <td class="text-right table-mono ${netProfit >= 0 ? 'text-success' : 'text-danger'}">
                    ₹${netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // --- Sub-Tab: Balance Sheet ---
  renderBalanceSheetTab() {
    const cashBank = window.Store.getCashBank();
    const parties = window.Store.getParties();
    const items = window.Store.getItems();

    const cashInHand = Number(cashBank.cashInHand || 0);
    const bankBalance = Number(cashBank.hdfcBank || 0);
    
    // Sundry Debtors (Receivables from Customers)
    const debtors = parties.filter(p => p.type === 'Customer').reduce((acc, p) => acc + (p.balance > 0 ? Number(p.balance) : 0), 0);
    
    // Stock in Hand (Valuation)
    const stockValuation = items.reduce((acc, i) => acc + (i.stock * (i.purchasePrice || i.salePrice * 0.8)), 0);

    const totalAssets = cashInHand + bankBalance + debtors + stockValuation;

    // Sundry Creditors (Payables to Suppliers)
    const creditors = parties.filter(p => p.type === 'Supplier').reduce((acc, p) => acc + Math.abs(Number(p.balance || 0)), 0);
    const ownerCapital = totalAssets - creditors;

    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Balance Sheet Statement (As on Today)</h2>
        </div>
        <div class="card-body">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:2rem;">
            <!-- Assets Side -->
            <div>
              <h3 style="font-size:15px; font-weight:800; color:var(--success); border-bottom:2px solid var(--success); padding-bottom:0.5rem; margin-bottom:1rem;">
                ASSETS (What the Business Owns)
              </h3>
              <table class="table">
                <tbody>
                  <tr>
                    <td><b>Cash in Hand (Store Counter)</b></td>
                    <td class="text-right table-mono">₹${cashInHand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td><b>Bank Current Accounts</b></td>
                    <td class="text-right table-mono">₹${bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td><b>Sundry Debtors (Customer Receivables)</b></td>
                    <td class="text-right table-mono">₹${debtors.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td><b>Inventory Closing Stock (Valuation)</b></td>
                    <td class="text-right table-mono">₹${stockValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr style="background:#f8fafc; font-weight:800;">
                    <td>TOTAL ASSETS</td>
                    <td class="text-right table-mono text-success" style="font-size:1.1rem;">
                      ₹${totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Liabilities Side -->
            <div>
              <h3 style="font-size:15px; font-weight:800; color:var(--danger); border-bottom:2px solid var(--danger); padding-bottom:0.5rem; margin-bottom:1rem;">
                LIABILITIES & CAPITAL
              </h3>
              <table class="table">
                <tbody>
                  <tr>
                    <td><b>Sundry Creditors (Supplier Payables)</b></td>
                    <td class="text-right table-mono">₹${creditors.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td><b>Owner's Net Worth / Equity Capital</b></td>
                    <td class="text-right table-mono">₹${ownerCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr style="background:#f8fafc; font-weight:800;">
                    <td>TOTAL LIABILITIES & EQUITY</td>
                    <td class="text-right table-mono text-danger" style="font-size:1.1rem;">
                      ₹${(creditors + ownerCapital).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // --- Sub-Tab: Cash Flow ---
  renderCashFlowTab() {
    const sales = window.Store.getSales();
    const expenses = window.Store.getExpenses();

    const cashInflows = sales.reduce((acc, s) => acc + (Number(s.paid) || 0), 0);
    const cashOutflows = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const netCashFlow = cashInflows - cashOutflows;

    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Cash Flow Statement</h2>
        </div>
        <div class="card-body" style="padding:0;">
          <table class="table">
            <thead>
              <tr>
                <th>Cash Flow Activity</th>
                <th class="text-right">Inflow (₹)</th>
                <th class="text-right">Outflow (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cash Collections from Customers (Sales)</td>
                <td class="text-right table-mono text-success">₹${cashInflows.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="text-right text-muted">-</td>
              </tr>
              <tr>
                <td>Operating Expense Disbursements (Rent, Salaries, Logistics)</td>
                <td class="text-right text-muted">-</td>
                <td class="text-right table-mono text-danger">₹${cashOutflows.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="background:#f1f5f9; font-weight:800;">
                <td>NET OPERATING CASH FLOW</td>
                <td colspan="2" class="text-right table-mono ${netCashFlow >= 0 ? 'text-success' : 'text-danger'}" style="font-size:1.1rem;">
                  ₹${netCashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --- Sub-Tab: Daybook Register ---
  renderDaybookTab() {
    const sales = window.Store.getSales();
    const purchases = window.Store.getPurchases();
    const expenses = window.Store.getExpenses();

    const allEvents = [];
    sales.forEach(s => allEvents.push({ date: s.date, type: 'Sale Invoice', ref: s.number, party: s.partyName, amount: s.total, inOut: 'IN' }));
    purchases.forEach(p => allEvents.push({ date: p.date, type: 'Purchase Bill', ref: p.number, party: p.partyName, amount: p.total, inOut: 'OUT' }));
    expenses.forEach(e => allEvents.push({ date: e.date, type: 'Expense Voucher', ref: e.id, party: e.category, amount: e.amount, inOut: 'OUT' }));

    allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Daily Financial Daybook Register</h2>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voucher Type</th>
                  <th>Reference No</th>
                  <th>Entity / Particulars</th>
                  <th class="text-right">Transaction Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${allEvents.map(ev => `
                  <tr>
                    <td>${ev.date}</td>
                    <td><span class="badge ${ev.inOut === 'IN' ? 'badge-success' : 'badge-danger'}">${ev.type}</span></td>
                    <td><b>${ev.ref}</b></td>
                    <td>${ev.party}</td>
                    <td class="text-right table-mono ${ev.inOut === 'IN' ? 'text-success' : 'text-danger'}" style="font-weight:700;">
                      ${ev.inOut === 'IN' ? '+' : '-'}₹${Number(ev.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

  // --- Sub-Tab: GST Filing ---
  renderGstTab() {
    const activeBiz = window.Store.getActiveBusiness();
    const sales = window.Store.getSales();

    return `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2 class="card-title">GSTR-1 Outward Supplies Summary</h2>
            <div style="font-size:12px; color:var(--text-muted);">Ready for Indian GST Portal (JSON / Excel upload)</div>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-primary btn-sm" id="downloadGstr1JsonBtn">
              Download GSTR-1 JSON (Govt Portal) ⚡
            </button>
            <button class="btn btn-outline btn-sm" id="exportGstReportBtn">Export GSTR-1 (CSV)</button>
          </div>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer GSTIN</th>
                  <th>Place of Supply</th>
                  <th class="text-right">Taxable Value (₹)</th>
                  <th class="text-right">CGST (₹)</th>
                  <th class="text-right">SGST (₹)</th>
                  <th class="text-right">IGST (₹)</th>
                  <th class="text-right">Total Invoice (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${sales.map(s => {
                  const isInterstate = !s.placeOfSupply.includes('07');
                  const tax = Number(s.tax) || 0;
                  const cgst = isInterstate ? 0 : tax / 2;
                  const sgst = isInterstate ? 0 : tax / 2;
                  const igst = isInterstate ? tax : 0;
                  const party = window.Store.getParty(s.partyId);

                  return `
                    <tr>
                      <td><b>${s.number}</b></td>
                      <td>${s.date}</td>
                      <td><code>${party ? (party.gstin || 'Unregistered') : 'UR'}</code></td>
                      <td>${s.placeOfSupply}</td>
                      <td class="text-right table-mono">₹${Number(s.subtotal).toFixed(2)}</td>
                      <td class="text-right table-mono">₹${cgst.toFixed(2)}</td>
                      <td class="text-right table-mono">₹${sgst.toFixed(2)}</td>
                      <td class="text-right table-mono">₹${igst.toFixed(2)}</td>
                      <td class="text-right table-mono" style="font-weight:700;">₹${Number(s.total).toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    container.querySelectorAll('.rep-subtab-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentTab = btn.getAttribute('data-tab');
        this.render(container);
      };
    });

    const jsonBtn = container.querySelector('#downloadGstr1JsonBtn');
    if (jsonBtn) {
      jsonBtn.onclick = () => this.exportGstr1Json();
    }

    const csvBtn = container.querySelector('#exportGstReportBtn');
    if (csvBtn) {
      csvBtn.onclick = () => this.exportGstr1Csv();
    }
  },

  exportGstr1Json() {
    const activeBiz = window.Store.getActiveBusiness();
    const sales = window.Store.getSales();

    const gstr1Payload = {
      gstin: activeBiz.gstin,
      fp: "102026",
      version: "GSTR1_V1.1",
      b2b: sales.map(s => {
        const party = window.Store.getParty(s.partyId);
        return {
          ctin: party ? (party.gstin || "07AAAAA0000A1Z5") : "UR",
          inv: [{
            inum: s.number,
            idt: s.date,
            val: s.total,
            pos: s.placeOfSupply.substring(0, 2),
            itms: s.items.map((line, idx) => ({
              num: idx + 1,
              itm_det: {
                txval: line.amount,
                rt: line.gstRate || 18,
                iamt: s.placeOfSupply.includes('07') ? 0 : line.amount * (line.gstRate / 100),
                camt: s.placeOfSupply.includes('07') ? (line.amount * (line.gstRate / 100)) / 2 : 0,
                samt: s.placeOfSupply.includes('07') ? (line.amount * (line.gstRate / 100)) / 2 : 0
              }
            }))
          }]
        };
      })
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gstr1Payload, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `GSTR1_${activeBiz.gstin}_Oct2026.json`);
    dlAnchorElem.click();
    window.app.showToast('GSTR-1 Portal JSON Exported successfully!', 'success');
  },

  exportGstr1Csv() {
    const sales = window.Store.getSales();
    let csv = "Invoice Number,Date,Customer,Place of Supply,Subtotal,Tax,Total\n";
    sales.forEach(s => {
      csv += `"${s.number}","${s.date}","${s.partyName}","${s.placeOfSupply}",${s.subtotal},${s.tax},${s.total}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lekha_Jokha_GSTR1_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.app.showToast('GSTR-1 CSV exported successfully!', 'success');
  }
};
