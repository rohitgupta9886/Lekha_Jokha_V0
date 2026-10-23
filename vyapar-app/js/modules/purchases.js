// ==============================================================================
// LekhaJokha - Purchases & Supplier Sourcing Module
// Workflows: Purchase Bills, Purchase Orders, Supplier Payment Out & Purchase Returns
// ==============================================================================

window.PurchasesModule = {
  currentTab: 'bills', // 'bills' | 'orders' | 'payments' | 'returns'

  switchTab(tabName) {
    this.currentTab = tabName;
    const container = (window.app && window.app.viewContainer) || document.getElementById('viewContainer') || document.querySelector('.main-content');
    if (container) this.render(container);
  },

  render(container) {
    const activeBiz = window.Store.getActiveBusiness();
    const purchases = window.Store.getPurchases();
    const purchaseOrders = window.Store.getPurchaseOrders();
    const suppliers = window.Store.getParties().filter(p => p.type === 'Supplier');
    const totalPurchaseAmt = purchases.reduce((acc, p) => acc + (Number(p.total) || 0), 0);

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Top Sub-Navigation Tabs -->
        <div class="card" style="padding: 0.5rem 1rem;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sm ${this.currentTab === 'bills' ? 'btn-primary' : 'btn-outline'} pur-subtab-btn" data-tab="bills" onclick="window.PurchasesModule.switchTab('bills')">
                <span>Purchase Bills (${purchases.length})</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'orders' ? 'btn-primary' : 'btn-outline'} pur-subtab-btn" data-tab="orders" onclick="window.PurchasesModule.switchTab('orders')">
                <span>Purchase Orders (${purchaseOrders.length})</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'returns' ? 'btn-primary' : 'btn-outline'} pur-subtab-btn" data-tab="returns" onclick="window.PurchasesModule.switchTab('returns')">
                <span>Purchase Returns / Debit Notes (${(window.Store.getPurchaseReturns() || []).length})</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'payments' ? 'btn-primary' : 'btn-outline'} pur-subtab-btn" data-tab="payments" onclick="window.PurchasesModule.switchTab('payments')">
                <span>Payment Out (Suppliers)</span>
              </button>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">
              Active Business: <b>${activeBiz.name}</b>
            </div>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-pay">
            <div class="kpi-header">
              <span class="kpi-label">Total Purchases (Stock In)</span>
              <div class="kpi-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path></svg>
              </div>
            </div>
            <div class="kpi-value text-danger">₹${totalPurchaseAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-footer"><span>${purchases.length} vendor bills logged</span></div>
          </div>
        </div>

        <!-- Tab Body -->
        <div id="purTabBody">
          ${this.renderTabBody()}
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  renderTabBody() {
    if (this.currentTab === 'orders') return this.renderOrdersTab();
    if (this.currentTab === 'payments') return this.renderPaymentsTab();
    if (this.currentTab === 'returns') return this.renderReturnsTab();
    return this.renderBillsTab();
  },

  renderBillsTab() {
    const purchases = window.Store.getPurchases();
    const suppliers = window.Store.getParties().filter(p => p.type === 'Supplier');
    const items = window.Store.getItems();

    return `
      <div class="card">
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <h2 class="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path></svg>
              <span>Purchase Bills (Stock In)</span>
            </h2>
          </div>
          <button class="btn btn-primary btn-sm" id="toggleAddPurchaseFormBtn">+ Record Purchase Bill</button>
        </div>

        <!-- Collapsible Quick Purchase Form -->
        <div id="quickPurchaseBox" style="display: none; padding: 1.25rem; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <form id="recordPurchaseForm">
            <div class="form-grid-3">
              <div class="form-group">
                <label for="purSupplier">Supplier *</label>
                <select id="purSupplier" class="form-control" required>
                  <option value="">Select Supplier...</option>
                  ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="purDate">Bill Date *</label>
                <input type="date" id="purDate" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
              </div>
              <div class="form-group">
                <label for="purItem">Item Stock In *</label>
                <select id="purItem" class="form-control" required>
                  <option value="">Select Product...</option>
                  ${items.map(i => `<option value="${i.id}" data-price="${i.purchasePrice}">${i.name} (Current: ${i.stock} ${i.unit})</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-grid-3">
              <div class="form-group">
                <label for="purQty">Quantity Purchased *</label>
                <input type="number" id="purQty" class="form-control" required min="1" value="10">
              </div>
              <div class="form-group">
                <label for="purRate">Purchase Rate per Unit (₹) *</label>
                <input type="number" id="purRate" class="form-control" required step="0.01" value="100">
              </div>
              <div class="form-group">
                <label for="purTotal">Total Bill Amount (₹)</label>
                <input type="text" id="purTotal" class="form-control" readonly value="₹1,000.00">
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
              <button type="button" class="btn btn-secondary btn-sm" id="cancelPurchaseBoxBtn">Cancel</button>
              <button type="submit" class="btn btn-success btn-sm">Confirm & Update Stock</button>
            </div>
          </form>
        </div>

        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Date</th>
                  <th>Supplier Name</th>
                  <th>Payment Mode</th>
                  <th class="text-right">Total (₹)</th>
                  <th class="text-right">Balance Due (₹)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${purchases.length === 0 ? `
                  <tr><td colspan="7" class="text-center text-muted" style="padding: 2.5rem;">No purchase bills logged.</td></tr>
                ` : purchases.map(pur => `
                  <tr>
                    <td><strong>${pur.number}</strong></td>
                    <td>${pur.date}</td>
                    <td><strong>${pur.partyName}</strong></td>
                    <td>${pur.paymentMode || 'Credit'}</td>
                    <td class="text-right table-mono" style="font-weight:700;">₹${Number(pur.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right table-mono ${pur.balance > 0 ? 'text-danger' : 'text-success'}">
                      ₹${Number(pur.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td><span class="badge ${pur.balance <= 0 ? 'badge-success' : 'badge-danger'}">${pur.status || (pur.balance <= 0 ? 'Paid' : 'Unpaid')}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderOrdersTab() {
    const orders = window.Store.getPurchaseOrders();
    return `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path></svg>
            <span>Purchase Orders to Vendors</span>
          </h2>
          <button class="btn btn-primary btn-sm" id="newPOBtn">+ Create Purchase Order</button>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Date</th>
                  <th>Supplier / Vendor</th>
                  <th>Expected Delivery</th>
                  <th class="text-right">Estimated Total (₹)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${orders.length === 0 ? `
                  <tr><td colspan="6" class="text-center text-muted" style="padding: 2.5rem;">No purchase orders issued.</td></tr>
                ` : orders.map(po => `
                  <tr>
                    <td><b>${po.number}</b></td>
                    <td>${po.date}</td>
                    <td><strong>${po.partyName}</strong></td>
                    <td>${po.deliveryDate || 'Within 7 days'}</td>
                    <td class="text-right table-mono" style="font-weight:700;">₹${Number(po.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td><span class="badge badge-info">${po.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderPaymentsTab() {
    const suppliers = window.Store.getParties().filter(p => p.type === 'Supplier');
    const payments = window.Store.getPaymentsOut() || [];

    return `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <span>Payment Out (Supplier Settlements)</span>
          </h2>
          <button class="btn btn-danger btn-sm" id="newPayOutBtn" onclick="window.PurchasesModule.openPaymentOutModal()">+ Record Payment Out</button>
        </div>
        <div class="card-body">
          <div style="background: #f8fafc; padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 1.5rem;">
            <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 0.75rem;">Outstanding Supplier Payables</h4>
            <div style="display:flex; gap:1rem; flex-wrap:wrap;">
              ${suppliers.map(s => `
                <div style="background:#fff; padding:0.75rem 1rem; border-radius:var(--radius-md); border:1px solid var(--border); min-width:200px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <div style="font-weight:700; font-size:13px;">${s.name}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${s.phone}</div>
                    <div style="font-size:1.1rem; font-weight:800; color:var(--danger); margin-top:0.25rem;">
                      ₹${Math.abs(Number(s.balance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })} To Pay
                    </div>
                  </div>
                  <button class="btn btn-xs btn-outline-danger pay-supplier-direct-btn" data-id="${s.id}" data-name="${s.name}" style="margin-top:0.5rem; width:100%;">Pay Now</button>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h3 style="font-size: 15px; font-weight: 700; margin: 0;">Disbursed Payment Out Vouchers</h3>
            <span class="badge badge-info">${payments.length} Recorded</span>
          </div>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Payment Mode</th>
                  <th>Reference / Note</th>
                  <th class="text-right">Amount Paid (₹)</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                ${payments.length === 0 ? `
                  <tr><td colspan="7" class="text-center text-muted" style="padding:2.5rem;">No payment out records found. Click "+ Record Payment Out" to disburse supplier payments.</td></tr>
                ` : payments.map(p => `
                  <tr>
                    <td><strong>${p.number || p.id}</strong></td>
                    <td>${p.date}</td>
                    <td>${p.partyName}</td>
                    <td><span class="badge badge-info">${p.paymentMode}</span></td>
                    <td class="text-muted" style="font-size:12px;">${p.txRef || p.reference || p.notes || '-'}</td>
                    <td class="text-right table-mono text-danger" style="font-weight:700;">₹${Number(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td class="text-center">
                      <span class="badge badge-success">Disbursed</span>
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

  renderReturnsTab() {
    const returns = window.Store.getPurchaseReturns() || [];
    const suppliers = window.Store.getParties().filter(p => p.type === 'Supplier');
    const items = window.Store.getItems();

    return `
      <div class="card">
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <h2 class="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6m-6-6l6-6"/></svg>
              <span>Purchase Returns / Debit Notes</span>
            </h2>
            <span class="badge badge-warning">${returns.length} Total</span>
          </div>
          <button class="btn btn-primary btn-sm" id="toggleAddReturnFormBtn">+ Issue Debit Note</button>
        </div>

        <!-- Collapsible Debit Note Form -->
        <div id="quickReturnBox" style="display: none; padding: 1.25rem; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <form id="recordReturnForm">
            <div class="form-grid-3">
              <div class="form-group">
                <label for="retSupplier">Supplier / Vendor *</label>
                <select id="retSupplier" class="form-control" required>
                  <option value="">Select Vendor...</option>
                  ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="retItem">Item to Return *</label>
                <select id="retItem" class="form-control" required>
                  <option value="">Select Item...</option>
                  ${items.map(i => `<option value="${i.id}" data-price="${i.purchasePrice || i.salePrice}">${i.name} (Stock: ${i.stock})</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="retQty">Quantity Returned *</label>
                <input type="number" id="retQty" class="form-control" min="1" value="1" required>
              </div>
              <div class="form-group">
                <label for="retRate">Purchase Rate (₹) *</label>
                <input type="number" id="retRate" class="form-control" step="0.01" value="0" required>
              </div>
              <div class="form-group">
                <label for="retReason">Return Reason *</label>
                <select id="retReason" class="form-control" required>
                  <option value="Damaged Goods">Damaged Goods</option>
                  <option value="Quality Defect">Quality Defect</option>
                  <option value="Near Expiry">Near Expiry</option>
                  <option value="Wrong Delivery">Wrong Delivery</option>
                </select>
              </div>
              <div class="form-group">
                <label for="retTotal">Total Debit Note Value</label>
                <input type="text" id="retTotal" class="form-control" readonly value="₹0.00" style="background:#e2e8f0;font-weight:700;">
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
              <button type="button" class="btn btn-outline btn-sm" id="cancelReturnBoxBtn">Cancel</button>
              <button type="submit" class="btn btn-danger btn-sm">Confirm Debit Note & Deduct Stock</button>
            </div>
          </form>
        </div>

        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Debit Note No</th>
                  <th>Date</th>
                  <th>Supplier Name</th>
                  <th>Items Returned</th>
                  <th class="text-right">Debit Total (₹)</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${returns.length === 0 ? `
                  <tr>
                    <td colspan="7" class="text-center" style="padding: 3rem; color: var(--text-muted);">
                      <p>No purchase return debit notes recorded.</p>
                      <button class="btn btn-sm btn-primary" onclick="document.getElementById('toggleAddReturnFormBtn').click()">+ Issue First Debit Note</button>
                    </td>
                  </tr>
                ` : returns.map(r => `
                  <tr>
                    <td><b>${r.number}</b></td>
                    <td>${r.date || 'Today'}</td>
                    <td>${r.partyName}</td>
                    <td>${(r.items || []).map(i => `${i.name} (x${i.qty})`).join(', ') || 'Returned Goods'}</td>
                    <td class="text-right text-danger font-weight-bold">₹${Number(r.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td><span class="badge badge-warning">${r.reason || 'Vendor Return'}</span></td>
                    <td><span class="badge badge-success">${r.status || 'Returned'}</span></td>
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
    container.querySelectorAll('.pur-subtab-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentTab = btn.getAttribute('data-tab');
        this.render(container);
      };
    });

    const toggleBtn = container.querySelector('#toggleAddPurchaseFormBtn');
    const box = container.querySelector('#quickPurchaseBox');
    const cancelBtn = container.querySelector('#cancelPurchaseBoxBtn');

    if (toggleBtn && box) {
      toggleBtn.onclick = () => {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      };
    }
    if (cancelBtn && box) {
      cancelBtn.onclick = () => {
        box.style.display = 'none';
      };
    }

    const purItem = container.querySelector('#purItem');
    const purRate = container.querySelector('#purRate');
    const purQty = container.querySelector('#purQty');
    const purTotal = container.querySelector('#purTotal');

    function recalc() {
      if (purQty && purRate && purTotal) {
        const q = Number(purQty.value) || 0;
        const r = Number(purRate.value) || 0;
        purTotal.value = `₹${(q * r).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      }
    }

    if (purItem && purRate) {
      purItem.onchange = () => {
        const opt = purItem.options[purItem.selectedIndex];
        if (opt && opt.getAttribute('data-price')) {
          purRate.value = opt.getAttribute('data-price');
          recalc();
        }
      };
    }
    if (purQty) purQty.oninput = recalc;
    if (purRate) purRate.oninput = recalc;

    const purForm = container.querySelector('#recordPurchaseForm');
    if (purForm) {
      purForm.onsubmit = (e) => {
        e.preventDefault();
        const supplierSelect = container.querySelector('#purSupplier');
        const supplierId = supplierSelect.value;
        const supplierName = supplierSelect.options[supplierSelect.selectedIndex].text;
        const itemSelect = container.querySelector('#purItem');
        const itemId = itemSelect.value;
        const itemName = itemSelect.options[itemSelect.selectedIndex].text.split(' (')[0];
        const date = container.querySelector('#purDate').value;
        const qty = Number(purQty.value);
        const rate = Number(purRate.value);
        const total = qty * rate;

        window.Store.addPurchase({
          date,
          partyId: supplierId,
          partyName: supplierName,
          paymentMode: "Bank / Cheque",
          items: [{ itemId, name: itemName, qty, rate, amount: total }],
          subtotal: total,
          tax: 0,
          total,
          paid: total,
          balance: 0,
          status: "Paid"
        });

        window.app.showToast(`Purchase bill recorded and stock increased for ${itemName}!`, 'success');
        this.render(container);
      };
    }

    const newPOBtn = container.querySelector('#newPOBtn');
    if (newPOBtn) {
      newPOBtn.onclick = () => {
        const suppliers = window.Store.getParties().filter(p => p.type === 'Supplier');
        const supplier = suppliers[0];
        window.Store.addPurchaseOrder({
          partyId: supplier ? supplier.id : 'P004',
          partyName: supplier ? supplier.name : 'Vendor',
          total: 25000,
          deliveryDate: new Date(Date.now() + 7*86400000).toISOString().split('T')[0]
        });
        window.app.showToast('Purchase Order generated successfully!', 'success');
        this.render(container);
      };
    }

    const toggleRetBtn = container.querySelector('#toggleAddReturnFormBtn');
    const retBox = container.querySelector('#quickReturnBox');
    const cancelRetBtn = container.querySelector('#cancelReturnBoxBtn');
    if (toggleRetBtn && retBox) {
      toggleRetBtn.onclick = () => {
        retBox.style.display = retBox.style.display === 'none' ? 'block' : 'none';
      };
    }
    if (cancelRetBtn && retBox) {
      cancelRetBtn.onclick = () => {
        retBox.style.display = 'none';
      };
    }

    const retItem = container.querySelector('#retItem');
    const retRate = container.querySelector('#retRate');
    const retQty = container.querySelector('#retQty');
    const retTotal = container.querySelector('#retTotal');
    function recalcReturn() {
      if (retQty && retRate && retTotal) {
        const q = Number(retQty.value) || 0;
        const r = Number(retRate.value) || 0;
        retTotal.value = `₹${(q * r).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      }
    }
    if (retItem && retRate) {
      retItem.onchange = () => {
        const opt = retItem.options[retItem.selectedIndex];
        if (opt && opt.getAttribute('data-price')) {
          retRate.value = opt.getAttribute('data-price');
          recalcReturn();
        }
      };
    }
    if (retQty) retQty.oninput = recalcReturn;
    if (retRate) retRate.oninput = recalcReturn;

    const retForm = container.querySelector('#recordReturnForm');
    if (retForm) {
      retForm.onsubmit = (e) => {
        e.preventDefault();
        const supSelect = container.querySelector('#retSupplier');
        const supplierId = supSelect.value;
        const supplierName = supSelect.options[supSelect.selectedIndex].text;
        const itmSelect = container.querySelector('#retItem');
        const itemId = itmSelect.value;
        const itemName = itmSelect.options[itmSelect.selectedIndex].text.split(' (')[0];
        const qty = Number(retQty.value) || 1;
        const rate = Number(retRate.value) || 0;
        const reason = container.querySelector('#retReason').value;
        const total = qty * rate;

        window.Store.addPurchaseReturn({
          partyId: supplierId,
          partyName: supplierName,
          items: [{ itemId, name: itemName, qty, rate, amount: total }],
          total,
          reason
        });

        window.app.showToast(`Debit Note issued and stock adjusted for ${itemName}!`, 'success');
        this.render(container);
      };
    }

    // Bind + Record Payment Out Button
    const newPayOutBtn = container.querySelector('#newPayOutBtn');
    if (newPayOutBtn) {
      newPayOutBtn.onclick = () => {
        this.openPaymentOutModal(container);
      };
    }

    // Bind Quick Direct Pay for individual suppliers
    container.querySelectorAll('.pay-supplier-direct-btn').forEach(btn => {
      btn.onclick = () => {
        const supId = btn.getAttribute('data-id');
        this.openPaymentOutModal(container, supId);
      };
    });
  },

  openPaymentOutModal(container, preselectedSupplierId) {
    const targetContainer = container || (window.app && window.app.viewContainer) || document.getElementById('viewContainer') || document.querySelector('.main-content');
    const allParties = window.Store.getParties() || [];
    let suppliers = allParties.filter(p => p.type === 'Supplier');
    if (suppliers.length === 0) suppliers = allParties;

    const modalHtml = `
      <div class="modal-overlay active" id="payOutModalOverlay" style="z-index: 10000; opacity: 1 !important; visibility: visible !important; display: flex !important;">
        <div class="modal-dialog" style="max-width: 520px;">
          <div class="modal-header">
            <h2 class="modal-title">Record Payment Out (Supplier Settlement)</h2>
            <button class="modal-close-btn" id="closePayOutModalBtn">&times;</button>
          </div>
          <div class="modal-body">
            <form id="payOutForm">
              <div class="form-group">
                <label for="payOutSupplier">Paid To Supplier *</label>
                <select id="payOutSupplier" class="form-control" required>
                  <option value="">Select Supplier...</option>
                  ${suppliers.map(s => {
                    const bal = Math.abs(Number(s.balance || 0));
                    const selected = (preselectedSupplierId === s.id) ? 'selected' : '';
                    return `<option value="${s.id}" data-name="${s.name}" ${selected}>${s.name} (Payable: ₹${bal.toLocaleString('en-IN')})</option>`;
                  }).join('')}
                </select>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label for="payOutAmount">Amount Paid (₹) *</label>
                  <input type="number" id="payOutAmount" class="form-control" step="0.01" min="1" placeholder="0.00" required>
                </div>
                <div class="form-group">
                  <label for="payOutMode">Payment Mode *</label>
                  <select id="payOutMode" class="form-control">
                    <option value="Bank / UPI">Bank / UPI Transfer</option>
                    <option value="Cash">Cash in Hand</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label for="payOutDate">Payment Date</label>
                  <input type="date" id="payOutDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                  <label for="payOutRef">Reference / UTR / Cheque #</label>
                  <input type="text" id="payOutRef" class="form-control" placeholder="e.g. UTR-998829 / Chq #4092">
                </div>
              </div>

              <div class="form-group">
                <label for="payOutNotes">Notes / Remarks</label>
                <input type="text" id="payOutNotes" class="form-control" placeholder="e.g. Cleared bill invoice / advance">
              </div>

              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-outline" id="cancelPayOutBtn">Cancel</button>
                <button type="submit" class="btn btn-danger">Disburse & Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('payOutModalOverlay');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const close = () => {
      const modal = document.getElementById('payOutModalOverlay');
      if (modal) modal.remove();
    };

    const closeBtn = document.getElementById('closePayOutModalBtn');
    if (closeBtn) closeBtn.onclick = close;
    const cancelBtn = document.getElementById('cancelPayOutBtn');
    if (cancelBtn) cancelBtn.onclick = close;

    const form = document.getElementById('payOutForm');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const supSelect = document.getElementById('payOutSupplier');
        const supplierId = supSelect.value;
        const supplierName = supSelect.options[supSelect.selectedIndex].getAttribute('data-name');
        const amount = Number(document.getElementById('payOutAmount').value) || 0;
        const paymentMode = document.getElementById('payOutMode').value;
        const date = document.getElementById('payOutDate').value;
        const reference = document.getElementById('payOutRef').value;
        const notes = document.getElementById('payOutNotes').value;

        if (!supplierId || amount <= 0) {
          window.app.showToast('Please select a supplier and enter a valid amount.', 'error');
          return;
        }

        window.Store.addPaymentOut({
          partyId: supplierId,
          partyName: supplierName,
          amount,
          paymentMode,
          date,
          txRef: reference,
          reference,
          notes
        });

        close();
        window.app.showToast(`Recorded payment of ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to ${supplierName}!`, 'success');
        this.currentTab = 'payments';
        this.render(targetContainer);
      };
    }
  }
};
