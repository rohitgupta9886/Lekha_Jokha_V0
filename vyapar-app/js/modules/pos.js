// ==============================================================================
// LekhaJokha - Fast Point of Sale (POS) Counter Billing Module
// Designed for High-Speed Retail, Supermarket & Wholesale Counter Operations
// Features: Instant Barcode Add, Quick-Tender Calculator, Thermal Slip Printing
// ==============================================================================

window.POSModule = {
  cart: [],
  selectedCategory: 'ALL',
  tenderedAmount: 0,

  render(container) {
    const items = window.Store.getItems();
    const categories = ['ALL', ...new Set(items.map(i => i.category || 'General'))];
    const filteredItems = this.selectedCategory === 'ALL'
      ? items
      : items.filter(i => (i.category || 'General') === this.selectedCategory);

    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = this.cart.reduce((sum, item) => sum + (item.price * item.qty * (item.gstRate || 5) / 100), 0);
    const grandTotal = Math.round(subtotal + tax);
    const changeDue = Math.max(0, (this.tenderedAmount || grandTotal) - grandTotal);

    container.innerHTML = `
      <div class="pos-layout" style="display: grid; grid-template-columns: 1fr 380px; gap: 1.25rem; height: calc(100vh - 120px);">
        <!-- Left: Product Catalog & Quick Touch Grid -->
        <div class="card" style="display: flex; flex-direction: column; overflow: hidden; padding: 1rem;">
          <!-- Top Bar: Barcode Scanner Input & Category Filter -->
          <div style="display: flex; gap: 0.75rem; margin-bottom: 0.75rem; align-items: center;">
            <div style="flex: 1; position: relative;">
              <input type="text" id="posBarcodeInput" class="form-control" placeholder="⚡ Scan barcode or type item name..." autofocus style="font-size: 15px; padding-left: 2.25rem; font-weight: 600;">
              <span style="position: absolute; left: 10px; top: 10px; font-size: 16px;">🔍</span>
            </div>
            <button class="btn btn-outline" id="posClearCartBtn" style="font-size: 12px; color: var(--danger);">Clear Cart</button>
          </div>

          <!-- Category Filter Chips -->
          <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 0.75rem;">
            ${categories.map(cat => `
              <button class="btn btn-sm ${this.selectedCategory === cat ? 'btn-primary' : 'btn-outline'} pos-cat-btn" data-cat="${cat}" style="white-space: nowrap; border-radius: 20px;">
                ${cat}
              </button>
            `).join('')}
          </div>

          <!-- Product Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 0.75rem; overflow-y: auto; flex: 1; padding-right: 4px;">
            ${filteredItems.map(item => `
              <div class="pos-item-card" data-id="${item.id}" style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.75rem; cursor: pointer; transition: all 0.15s ease; display: flex; flex-direction: column; justify-content: space-between; user-select: none;">
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-bottom: 4px;">
                    <span>${item.category || 'General'}</span>
                    <span style="color: ${item.stock <= item.minStock ? 'var(--danger)' : 'var(--success)'}; font-weight: 700;">Stock: ${item.stock}</span>
                  </div>
                  <div style="font-weight: 700; font-size: 13px; line-height: 1.25; margin-bottom: 6px; color: var(--text-primary);">${item.name}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">HSN: ${item.hsn || '9999'} • GST: ${item.gstRate || 5}%</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                  <span style="font-size: 15px; font-weight: 800; color: var(--primary);">₹${Number(item.salePrice).toLocaleString('en-IN')}</span>
                  <span style="background: var(--primary-surface); color: var(--primary-dark); padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">+ ADD</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Current POS Cart & Cash Tender Calculator -->
        <div class="card" style="display: flex; flex-direction: column; height: 100%; padding: 1.25rem; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
              <h3 style="font-size: 16px; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 6px;">
                <span>🛒 Counter Bill</span>
                <span class="badge badge-info" style="font-size: 11px;">${this.cart.reduce((a, b) => a + b.qty, 0)} items</span>
              </h3>
              <span style="font-size: 11px; color: var(--text-muted);">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <!-- Cart Items List -->
            <div id="posCartList" style="max-height: 240px; overflow-y: auto; margin-bottom: 0.75rem;">
              ${this.cart.length === 0 ? `
                <div style="text-align: center; color: var(--text-muted); padding: 2.5rem 0;">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">🛍️</div>
                  <p style="font-size: 13px;">Cart is empty.<br>Tap items or scan barcode to add.</p>
                </div>
              ` : `
                <table class="table" style="font-size: 12px; margin: 0;">
                  <tbody>
                    ${this.cart.map((cItem, idx) => `
                      <tr>
                        <td style="padding: 6px 0;">
                          <div style="font-weight: 700; color: var(--text-primary);">${cItem.name}</div>
                          <div style="font-size: 10px; color: var(--text-muted);">₹${cItem.price} × ${cItem.qty}</div>
                        </td>
                        <td style="padding: 6px 0; text-align: right; white-space: nowrap;">
                          <div style="display: inline-flex; align-items: center; gap: 4px;">
                            <button class="btn btn-xs btn-outline pos-qty-minus" data-idx="${idx}" style="padding: 1px 6px;">-</button>
                            <span style="font-weight: 800; min-width: 18px; text-align: center;">${cItem.qty}</span>
                            <button class="btn btn-xs btn-outline pos-qty-plus" data-idx="${idx}" style="padding: 1px 6px;">+</button>
                            <button class="btn btn-xs pos-remove-item" data-idx="${idx}" style="color: var(--danger); background: none; border: none; font-size: 14px; cursor: pointer;">&times;</button>
                          </div>
                        </td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 700;">
                          ₹${(cItem.price * cItem.qty).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `}
            </div>
          </div>

          <!-- Checkout & Tender Calculation Area -->
          <div style="border-top: 1px solid var(--border); padding-top: 0.75rem;">
            <!-- Breakdown -->
            <div style="font-size: 12px; display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
                <span>Subtotal</span>
                <span>₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
                <span>GST Tax</span>
                <span>₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: var(--text-primary); border-top: 1px dashed var(--border); padding-top: 4px;">
                <span>Total Payable</span>
                <span style="color: var(--primary);">₹${grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <!-- Fast Tender Cash Buttons -->
            <div style="margin-bottom: 8px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Quick Cash Tendered:</div>
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-sm btn-outline pos-tender-btn" data-amt="${grandTotal}" style="flex: 1; padding: 4px;">Exact</button>
                <button class="btn btn-sm btn-outline pos-tender-btn" data-amt="100" style="flex: 1; padding: 4px;">₹100</button>
                <button class="btn btn-sm btn-outline pos-tender-btn" data-amt="500" style="flex: 1; padding: 4px;">₹500</button>
                <button class="btn btn-sm btn-outline pos-tender-btn" data-amt="1000" style="flex: 1; padding: 4px;">₹1000</button>
              </div>
            </div>

            <!-- Tender Input & Change Due Display -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
              <div>
                <label style="font-size: 10px; color: var(--text-muted); font-weight: 700;">Customer Paid (₹)</label>
                <input type="number" id="posTenderedInput" class="form-control" style="font-size: 14px; font-weight: 700;" value="${this.tenderedAmount || grandTotal}">
              </div>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 4px 8px; display: flex; flex-direction: column; justify-content: center; text-align: right;">
                <span style="font-size: 10px; color: #166534; font-weight: 700;">Return Change (वापसी)</span>
                <span style="font-size: 15px; font-weight: 900; color: #15803d;">₹${changeDue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <!-- Complete Bill & Thermal Print Buttons -->
            <div style="display: grid; grid-template-columns: 1fr; gap: 6px;">
              <button class="btn btn-success btn-block" id="posCheckoutCashBtn" style="padding: 10px; font-size: 14px; font-weight: 800;" ${this.cart.length === 0 ? 'disabled' : ''}>
                ✓ Complete Cash Bill (₹${grandTotal})
              </button>
              <button class="btn btn-outline btn-block" id="posCheckoutUpiBtn" style="padding: 6px; font-size: 12px;" ${this.cart.length === 0 ? 'disabled' : ''}>
                📲 Dynamic UPI QR Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    // Category filter click
    container.querySelectorAll('.pos-cat-btn').forEach(btn => {
      btn.onclick = () => {
        this.selectedCategory = btn.getAttribute('data-cat');
        this.render(container);
      };
    });

    // Tap product item to add to cart
    container.querySelectorAll('.pos-item-card').forEach(card => {
      card.onclick = () => {
        const id = card.getAttribute('data-id');
        this.addItemToCart(id);
        this.render(container);
      };
    });

    // Barcode scanner / search input
    const barcodeInput = container.querySelector('#posBarcodeInput');
    if (barcodeInput) {
      if (typeof barcodeInput.focus === 'function') {
        barcodeInput.focus();
      }
      barcodeInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const query = barcodeInput.value.trim();
          if (query) {
            const foundByBarcode = window.Store.getItemByBarcode(query);
            if (foundByBarcode) {
              this.addItemToCart(foundByBarcode.id);
              barcodeInput.value = '';
              this.render(container);
              return;
            }
            const foundByName = window.Store.getItems().find(i => i.name.toLowerCase().includes(query.toLowerCase()));
            if (foundByName) {
              this.addItemToCart(foundByName.id);
              barcodeInput.value = '';
              this.render(container);
              return;
            }
            window.app.showToast(`Item not found for '${query}'`, 'error');
          }
        }
      };
    }

    // Clear cart
    const clearBtn = container.querySelector('#posClearCartBtn');
    if (clearBtn) {
      clearBtn.onclick = () => {
        this.cart = [];
        this.tenderedAmount = 0;
        this.render(container);
      };
    }

    // Plus/Minus quantity
    container.querySelectorAll('.pos-qty-plus').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = Number(btn.getAttribute('data-idx'));
        if (this.cart[idx]) {
          this.cart[idx].qty++;
          this.render(container);
        }
      };
    });

    container.querySelectorAll('.pos-qty-minus').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = Number(btn.getAttribute('data-idx'));
        if (this.cart[idx]) {
          if (this.cart[idx].qty > 1) {
            this.cart[idx].qty--;
          } else {
            this.cart.splice(idx, 1);
          }
          this.render(container);
        }
      };
    });

    container.querySelectorAll('.pos-remove-item').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = Number(btn.getAttribute('data-idx'));
        this.cart.splice(idx, 1);
        this.render(container);
      };
    });

    // Quick tender buttons
    container.querySelectorAll('.pos-tender-btn').forEach(btn => {
      btn.onclick = () => {
        this.tenderedAmount = Number(btn.getAttribute('data-amt')) || 0;
        this.render(container);
      };
    });

    // Tendered input change
    const tenderInput = container.querySelector('#posTenderedInput');
    if (tenderInput) {
      tenderInput.oninput = () => {
        this.tenderedAmount = Number(tenderInput.value) || 0;
      };
    }

    // Complete Cash Bill
    const cashBtn = container.querySelector('#posCheckoutCashBtn');
    if (cashBtn) {
      cashBtn.onclick = () => {
        this.processCheckout('Cash', container);
      };
    }

    // Complete UPI Bill
    const upiBtn = container.querySelector('#posCheckoutUpiBtn');
    if (upiBtn) {
      upiBtn.onclick = () => {
        this.processCheckout('UPI', container);
      };
    }
  },

  addItemToCart(itemId) {
    const item = window.Store.getItem(itemId);
    if (!item) return;

    const existing = this.cart.find(c => c.id === item.id);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({
        id: item.id,
        name: item.name,
        price: Number(item.salePrice) || 0,
        gstRate: Number(item.gstRate) || 5,
        hsn: item.hsn || '9999',
        qty: 1
      });
    }
  },

  processCheckout(paymentMode, container) {
    if (this.cart.length === 0) return;

    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = this.cart.reduce((sum, item) => sum + (item.price * item.qty * (item.gstRate || 5) / 100), 0);
    const grandTotal = Math.round(subtotal + tax);
    const tendered = this.tenderedAmount > 0 ? this.tenderedAmount : grandTotal;
    const changeDue = Math.max(0, tendered - grandTotal);

    const saleResult = window.Store.addPosSale({
      partyName: "Counter Customer",
      paymentMode,
      items: this.cart.map(c => ({
        itemId: c.id,
        name: c.name,
        hsn: c.hsn,
        qty: c.qty,
        rate: c.price,
        gstRate: c.gstRate,
        amount: c.price * c.qty * (1 + c.gstRate / 100)
      })),
      subtotal,
      tax,
      total: grandTotal,
      tendered,
      changeDue
    });

    const billNumber = saleResult.sale.number;
    this.openThermalReceiptModal(saleResult.sale, tendered, changeDue);

    // Reset cart
    this.cart = [];
    this.tenderedAmount = 0;
    this.render(container);
  },

  openThermalReceiptModal(sale, tendered, changeDue) {
    const biz = window.Store.getActiveBusiness();
    const modalHtml = `
      <div class="modal-overlay active" id="thermalReceiptModalOverlay" style="z-index: 10000;">
        <div class="modal-dialog" style="max-width: 380px; padding: 1.25rem;">
          <div style="text-align: right;">
            <button class="modal-close-btn" onclick="document.getElementById('thermalReceiptModalOverlay').remove()">&times;</button>
          </div>
          <!-- 58mm / 80mm Standard POS Thermal Receipt Template -->
          <div id="thermalPrintArea" style="font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; background: #fff; padding: 10px; border: 1px dashed #ccc;">
            <div style="text-align: center; margin-bottom: 8px;">
              <div style="font-weight: 900; font-size: 15px;">${biz.name}</div>
              <div style="font-size: 10px;">${biz.address || 'Commercial Market'}</div>
              <div style="font-size: 10px;">GSTIN: ${biz.gstin} • Ph: ${biz.phone}</div>
              <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
              <div style="font-weight: 700; font-size: 12px;">TAX INVOICE / CASH BILL</div>
              <div style="display: flex; justify-content: space-between; font-size: 10px;">
                <span>Bill: ${sale.number}</span>
                <span>${sale.date}</span>
              </div>
              <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; font-size: 11px; margin-bottom: 8px; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #000;">
                  <th style="text-align: left; padding-bottom: 4px;">Item</th>
                  <th style="text-align: center; padding-bottom: 4px;">Qty</th>
                  <th style="text-align: right; padding-bottom: 4px;">Rate</th>
                  <th style="text-align: right; padding-bottom: 4px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(sale.items || []).map(i => `
                  <tr>
                    <td style="padding: 2px 0;">${i.name.substring(0, 16)}</td>
                    <td style="text-align: center;">${i.qty}</td>
                    <td style="text-align: right;">${i.rate}</td>
                    <td style="text-align: right; font-weight: 700;">₹${(i.rate * i.qty).toFixed(0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
            <div style="font-size: 11px; display: flex; flex-direction: column; gap: 2px;">
              <div style="display: flex; justify-content: space-between;">
                <span>Taxable Amount:</span>
                <span>₹${sale.subtotal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>GST Tax:</span>
                <span>₹${sale.tax.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 14px; border-top: 1px solid #000; padding-top: 4px;">
                <span>NET TOTAL:</span>
                <span>₹${sale.total.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Paid via (${sale.paymentMode}):</span>
                <span>₹${tendered.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 700;">
                <span>Change Returned:</span>
                <span>₹${changeDue.toFixed(2)}</span>
              </div>
            </div>

            <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
            <div style="text-align: center; font-size: 10px;">
              <div>Thank You! Visit Again</div>
              <div style="color: #666; font-size: 9px; margin-top: 2px;">Powered by Lekha Jokha Enterprise</div>
            </div>
          </div>

          <!-- Dialog Actions -->
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button class="btn btn-outline" style="flex: 1;" onclick="document.getElementById('thermalReceiptModalOverlay').remove()">Close</button>
            <button class="btn btn-primary" style="flex: 1;" onclick="window.print()">🖨️ Print Receipt</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }
};
