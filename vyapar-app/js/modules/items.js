// ==============================================================================
// LekhaJokha - Items & Inventory Management Module
// Workflows: Product Catalog, Stock Adjustments, Units & Categories, Stock Movement History
// ==============================================================================

window.ItemsModule = {
  currentTab: 'products', // 'products' | 'adjustments' | 'units' | 'history'
  currentPage: 1,
  pageSize: 15,
  searchQuery: '',

  render(container) {
    const activeBiz = window.Store.getActiveBusiness();
    const allItems = window.Store.getItems();
    const adjustments = window.Store.getStockAdjustments();

    let totalStockQty = 0;
    let totalStockVal = 0;
    let lowStockCount = 0;

    allItems.forEach(itm => {
      totalStockQty += itm.stock;
      totalStockVal += itm.stock * (itm.purchasePrice || itm.salePrice * 0.8);
      if (itm.stock <= itm.minStock) lowStockCount++;
    });

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Top Sub-Navigation Tabs -->
        <div class="card" style="padding: 0.5rem 1rem;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sm ${this.currentTab === 'products' ? 'btn-primary' : 'btn-outline'} item-subtab-btn" data-tab="products">
                <span>Products & Services (${allItems.length})</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'adjustments' ? 'btn-primary' : 'btn-outline'} item-subtab-btn" data-tab="adjustments">
                <span>Stock Adjustments (${adjustments.length})</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'units' ? 'btn-primary' : 'btn-outline'} item-subtab-btn" data-tab="units">
                <span>Units & Categories</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'history' ? 'btn-primary' : 'btn-outline'} item-subtab-btn" data-tab="history">
                <span>Stock Movement History</span>
              </button>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">
              Active Business: <b>${activeBiz.name}</b>
            </div>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-stock">
            <div class="kpi-header">
              <span class="kpi-label">Total Stock Quantity</span>
              <div class="kpi-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              </div>
            </div>
            <div class="kpi-value">${totalStockQty.toLocaleString()} units</div>
            <div class="kpi-footer"><span>Across ${allItems.length} products</span></div>
          </div>

          <div class="kpi-card kpi-cash">
            <div class="kpi-header">
              <span class="kpi-label">Stock Valuation (Cost)</span>
              <div class="kpi-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
            </div>
            <div class="kpi-value">₹${totalStockVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-footer"><span>Calculated at purchase cost</span></div>
          </div>

          <div class="kpi-card ${lowStockCount > 0 ? 'kpi-pay' : 'kpi-collect'}">
            <div class="kpi-header">
              <span class="kpi-label">Low Stock Alerts</span>
              <div class="kpi-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
              </div>
            </div>
            <div class="kpi-value text-danger">${lowStockCount} items</div>
            <div class="kpi-footer"><span>Need immediate replenishment</span></div>
          </div>
        </div>

        <!-- Tab Body -->
        <div id="itemTabBody">
          ${this.renderTabBody()}
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  renderTabBody() {
    if (this.currentTab === 'adjustments') return this.renderAdjustmentsTab();
    if (this.currentTab === 'units') return this.renderUnitsTab();
    if (this.currentTab === 'history') return this.renderHistoryTab();
    return this.renderProductsTab();
  },

  renderProductsTab() {
    const allItems = window.Store.getItems();
    const filtered = this.searchQuery
      ? allItems.filter(i => (i.name + ' ' + (i.barcode || '') + ' ' + (i.hsn || '') + ' ' + (i.category || '')).toLowerCase().includes(this.searchQuery.toLowerCase()))
      : allItems;

    const paginated = window.PaginationUtils
      ? window.PaginationUtils.paginate(filtered, this.currentPage, this.pageSize)
      : { items: filtered, totalItems: filtered.length, totalPages: 1, currentPage: 1, startIndex: 1, endIndex: filtered.length };

    return `
      <div class="card">
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <h2 class="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              <span>Product & Inventory Catalog</span>
            </h2>
            <span class="badge badge-info">${allItems.length} Total</span>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <input type="text" id="itemsSearchInput" class="form-control" style="width: 220px;" placeholder="Search name, barcode, HSN..." value="${this.searchQuery}">
            <button class="btn btn-outline btn-sm" id="itemsScanBarcodeBtn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"></path></svg>
              <span>Scan Barcode</span>
            </button>
            <button class="btn btn-primary btn-sm" id="newItemBtn">+ Add New Product</button>
          </div>
        </div>

        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Item Code / Barcode</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>HSN Code</th>
                  <th class="text-right">Sale Price (₹)</th>
                  <th class="text-right">Purchase Price (₹)</th>
                  <th class="text-right">Tax Rate</th>
                  <th class="text-right">Current Stock</th>
                  <th>Stock Status</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${paginated.items.length === 0 ? `
                  <tr><td colspan="10" class="text-center text-muted" style="padding: 2.5rem;">No items found. Click <b>+ Add New Product</b> to populate inventory.</td></tr>
                ` : paginated.items.map(item => `
                  <tr>
                    <td>
                      <div class="table-mono" style="font-weight: 700; color: #1e293b;">${item.id}</div>
                      ${item.barcode ? `<div style="font-size: 11px; color: #64748b; font-family: monospace;">|||| ${item.barcode}</div>` : ''}
                    </td>
                    <td>
                      <strong>${item.name}</strong>
                      <div style="font-size: 11px; color: #64748b;">Unit: ${item.unit || 'PCS'}</div>
                    </td>
                    <td><span class="badge badge-info">${item.category || 'General'}</span></td>
                    <td><code>${item.hsn || '-'}</code></td>
                    <td class="text-right table-mono" style="font-weight: 700;">₹${Number(item.salePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right table-mono" style="color: #64748b;">₹${Number(item.purchasePrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right table-mono">${item.gstRate || 0}%</td>
                    <td class="text-right table-mono" style="font-weight: 800; font-size: 1.05rem;">
                      ${item.stock} <span style="font-size: 12px; font-weight: normal; color: #64748b;">${item.unit}</span>
                    </td>
                    <td>
                      ${item.stock <= 0 ? `
                        <span class="badge badge-danger">OUT OF STOCK</span>
                      ` : item.stock <= item.minStock ? `
                        <span class="badge badge-warning" style="background:#fef3c7;color:#92400e;">LOW STOCK</span>
                      ` : `
                        <span class="badge badge-success">IN STOCK</span>
                      `}
                    </td>
                    <td class="text-center">
                      <div class="table-action-group" style="justify-content: center; gap: 0.35rem;">
                        <button class="btn btn-sm btn-outline edit-item-btn" data-id="${item.id}" title="Edit Item Details" style="padding: 2px 7px; font-size: 11px;">
                          ✏️ Edit
                        </button>
                        <button class="btn btn-sm btn-outline print-barcode-btn" data-id="${item.id}" title="Print Barcode Label" style="padding: 2px 7px; font-size: 11px;">
                          🏷️ Label
                        </button>
                        <button class="btn btn-sm btn-outline delete-item-btn" data-id="${item.id}" data-name="${item.name}" title="Delete Item" style="padding: 2px 7px; font-size: 11px; color: var(--danger, #ef4444);">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div id="itemsPaginationContainer">
          ${window.PaginationUtils ? window.PaginationUtils.renderPaginationToolbar(paginated, 'ItemsModule') : ''}
        </div>
      </div>
    `;
  },

  renderAdjustmentsTab() {
    const adjustments = window.Store.getStockAdjustments();
    return `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path></svg>
            <span>Stock Adjustments & Physical Audit</span>
          </h2>
          <button class="btn btn-primary btn-sm" id="newAdjustmentBtn">+ Adjust Physical Stock</button>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Date</th>
                  <th>Product Name</th>
                  <th>Adjustment Type</th>
                  <th class="text-right">Quantity</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                ${adjustments.length === 0 ? `
                  <tr><td colspan="6" class="text-center text-muted" style="padding: 2.5rem;">No manual stock adjustments logged.</td></tr>
                ` : adjustments.map(adj => `
                  <tr>
                    <td><b>${adj.id}</b></td>
                    <td>${adj.date}</td>
                    <td><strong>${adj.itemName}</strong></td>
                    <td>
                      <span class="badge ${adj.type === 'Add' ? 'badge-success' : 'badge-danger'}">
                        ${adj.type === 'Add' ? '+ Stock Increase' : '- Stock Reduction'}
                      </span>
                    </td>
                    <td class="text-right table-mono" style="font-weight:700;">
                      ${adj.type === 'Add' ? '+' : '-'}${adj.qty}
                    </td>
                    <td>${adj.reason}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderUnitsTab() {
    const units = ['PCS (Pieces)', 'BAG (Bags)', 'BOX (Boxes)', 'KG (Kilograms)', 'LTR (Litres)', 'MTR (Metres)', 'CARTON', 'DOZEN'];
    const categories = ['Groceries & Provisions', 'FMCG & Packaged Foods', 'Consumer Electronics', 'Apparel & Fabrics', 'Home & Kitchen'];

    return `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.5rem;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Units of Measurement (UQC)</h3>
          </div>
          <div class="card-body">
            <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.5rem;">
              ${units.map(u => `
                <li style="display:flex; justify-content:space-between; padding:0.5rem 0.75rem; background:#f8fafc; border-radius:var(--radius-sm); border:1px solid #e2e8f0;">
                  <span><b>${u}</b></span>
                  <span class="badge badge-success">ACTIVE</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Product Categories</h3>
          </div>
          <div class="card-body">
            <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.5rem;">
              ${categories.map(c => `
                <li style="display:flex; justify-content:space-between; padding:0.5rem 0.75rem; background:#f8fafc; border-radius:var(--radius-sm); border:1px solid #e2e8f0;">
                  <span><b>${c}</b></span>
                  <span class="badge badge-info">TAG</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  },

  renderHistoryTab() {
    const auditLogs = window.Store.getAuditLogs().filter(l => l.action.toLowerCase().includes('stock') || l.action.toLowerCase().includes('invoice') || l.action.toLowerCase().includes('purchase'));

    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Complete Stock Movement Ledger</h2>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Operator</th>
                  <th>Action</th>
                  <th>Movement Details</th>
                </tr>
              </thead>
              <tbody>
                ${auditLogs.length === 0 ? `
                  <tr><td colspan="4" class="text-center text-muted" style="padding:2.5rem;">No stock movement events recorded yet.</td></tr>
                ` : auditLogs.map(l => `
                  <tr>
                    <td><code>${l.timestamp}</code></td>
                    <td><b>${l.userName}</b></td>
                    <td><span class="badge badge-info">${l.action}</span></td>
                    <td>${l.details}</td>
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
    container.querySelectorAll('.item-subtab-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentTab = btn.getAttribute('data-tab');
        this.render(container);
      };
    });

    const newItemBtn = container.querySelector('#newItemBtn');
    if (newItemBtn) newItemBtn.onclick = () => window.app.openItemModal();

    const scanBtn = container.querySelector('#itemsScanBarcodeBtn');
    if (scanBtn && window.BarcodeModule) {
      scanBtn.onclick = () => {
        window.BarcodeModule.openScannerModal((item) => {
          this.searchQuery = item.name;
          this.render(container);
        });
      };
    }

    const searchInput = container.querySelector('#itemsSearchInput');
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

    container.querySelectorAll('.edit-item-btn').forEach(btn => {
      btn.onclick = () => {
        const itemId = btn.getAttribute('data-id');
        if (window.app && window.app.openItemModal) {
          window.app.openItemModal(itemId);
        }
      };
    });

    container.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.onclick = () => {
        const itemId = btn.getAttribute('data-id');
        const itemName = btn.getAttribute('data-name') || itemId;
        if (confirm(`Are you sure you want to permanently delete item "${itemName}"?`)) {
          window.Store.deleteItem(itemId);
          window.app.showToast(`Item "${itemName}" removed.`, 'info');
          this.render(container);
        }
      };
    });

    container.querySelectorAll('.print-barcode-btn').forEach(btn => {
      btn.onclick = () => {
        const itemId = btn.getAttribute('data-id');
        if (window.BarcodeModule) {
          window.BarcodeModule.openPrintLabelModal(itemId);
        }
      };
    });

    const newAdjBtn = container.querySelector('#newAdjustmentBtn');
    if (newAdjBtn) {
      newAdjBtn.onclick = () => this.openAdjustmentModal();
    }
  },

  openAdjustmentModal() {
    const items = window.Store.getItems();
    const modalHtml = `
      <div class="modal-overlay active" id="adjModalOverlay" style="z-index: 10000;">
        <div class="modal-dialog" style="max-width: 480px;">
          <div class="modal-header">
            <h2 class="modal-title">Record Physical Stock Adjustment</h2>
            <button class="modal-close-btn" onclick="document.getElementById('adjModalOverlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="adjForm">
              <div class="form-group">
                <label>Select Product *</label>
                <select id="adjItem" class="form-control" required>
                  ${items.map(i => `<option value="${i.id}" data-name="${i.name}">${i.name} (Current: ${i.stock} ${i.unit})</option>`).join('')}
                </select>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Adjustment Type</label>
                  <select id="adjType" class="form-control">
                    <option value="Add">+ Add to Stock (Surplus)</option>
                    <option value="Reduce">- Reduce from Stock (Loss/Damage)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Quantity</label>
                  <input type="number" id="adjQty" class="form-control" value="1" min="1" required>
                </div>
              </div>
              <div class="form-group">
                <label>Reason *</label>
                <select id="adjReason" class="form-control">
                  <option value="Physical Inventory Surplus Audit">Physical Inventory Surplus Audit</option>
                  <option value="Damaged / Broken in Transit">Damaged / Broken in Transit</option>
                  <option value="Product Expiry Waste">Product Expiry Waste</option>
                  <option value="Theft / Pilferage">Theft / Pilferage</option>
                  <option value="Internal Store Consumption">Internal Store Consumption</option>
                </select>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('adjModalOverlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('adjForm').onsubmit = (e) => {
      e.preventDefault();
      const itemSel = document.getElementById('adjItem');
      const itemId = itemSel.value;
      const itemName = itemSel.options[itemSel.selectedIndex].getAttribute('data-name');
      const type = document.getElementById('adjType').value;
      const qty = Number(document.getElementById('adjQty').value);
      const reason = document.getElementById('adjReason').value;

      window.Store.addStockAdjustment({ itemId, itemName, type, qty, reason });
      document.getElementById('adjModalOverlay').remove();
      window.app.showToast(`Stock adjustment recorded for ${itemName}!`, 'success');
      this.currentTab = 'adjustments';
      this.render(window.app.viewContainer);
    };
  }
};
