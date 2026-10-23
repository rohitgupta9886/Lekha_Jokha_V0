// ==============================================================================
// Lekha Jokha - Order Management Module (Business Owner App)
// Multi-Source Orders: Direct Counter, Field Salesman App, WhatsApp/Phone & Web
// Features: Instant Real-time Sync, Bill Generation with Payment Prompt,
//           Payment Status Toggle (Pending -> Paid) with Medium & Amount Display,
//           Inventory Stock Deduction, Cash/Bank & Party Ledger Adjustments
// ==============================================================================

window.OrdersModule = {
  activeFilter: 'all', // 'all' | 'salesman' | 'direct' | 'pending' | 'billed'
  searchQuery: '',
  selectedOrderId: null,
  container: null,

  render(container) {
    this.container = container;
    const orders = this.getFilteredOrders();
    const allOrders = window.Store.getOrders();
    
    // Calculate telemetry summary
    const totalOrdersCount = allOrders.length;
    const pendingOrdersCount = allOrders.filter(o => o.orderStatus === 'New' || o.paymentStatus === 'Pending').length;
    const salesmanOrdersCount = allOrders.filter(o => o.source === 'Salesman App').length;
    const totalOrderValue = allOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pendingCollectionValue = allOrders.filter(o => o.paymentStatus === 'Pending').reduce((sum, o) => sum + (Number(o.balanceDue !== undefined ? o.balanceDue : o.total) || 0), 0);

    container.innerHTML = `
      <div class="orders-module-wrapper" style="display:flex;flex-direction:column;gap:1.5rem;">
        
        <!-- Header Banner & Action Bar -->
        <div class="card" style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);color:#ffffff;padding:1.75rem;border-radius:var(--radius-lg);border-left:4px solid #3b82f6;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
            <div>
              <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.35rem;">
                <span class="badge" style="background:#3b82f6;color:#ffffff;font-weight:800;font-size:11px;padding:3px 8px;border-radius:4px;">
                  OMNI-CHANNEL ORDERS
                </span>
                <span style="font-size:13px;color:#94a3b8;display:flex;align-items:center;gap:4px;">
                  <span class="live-dot" style="display:inline-block;width:7px;height:7px;background:#22c55e;border-radius:50%;"></span>
                  Real-time Field Force Sync Active
                </span>
              </div>
              <h2 style="font-size:1.8rem;font-weight:800;margin:0 0 0.3rem 0;color:#f8fafc;">
                Order Management Center
              </h2>
              <p style="color:#cbd5e1;font-size:13.5px;margin:0;max-width:720px;line-height:1.4;">
                Centralized dashboard aggregating orders booked directly at counter, by field salesmen via Field Force App, or received via WhatsApp. Convert orders to GST Tax Invoices in 1-click with payment verification.
              </p>
            </div>

            <div style="display:flex;gap:0.75rem;align-items:center;">
              <button class="btn btn-primary" id="openCreateOrderBtn" style="background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);box-shadow:0 4px 14px rgba(37,99,235,0.4);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                New Direct Order
              </button>
            </div>
          </div>
        </div>

        <!-- 4 Key Performance Metrics -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:1rem;">
          <div class="card" style="padding:1.2rem;border-radius:var(--radius-md);border-top:3px solid #3b82f6;">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Total Orders</div>
            <div style="font-size:1.8rem;font-weight:800;color:#0f172a;margin-top:4px;">${totalOrdersCount}</div>
            <div style="font-size:12px;color:#3b82f6;font-weight:600;margin-top:2px;">₹${totalOrderValue.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})} Booked</div>
          </div>

          <div class="card" style="padding:1.2rem;border-radius:var(--radius-md);border-top:3px solid #10b981;">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Field Salesman Orders</div>
            <div style="font-size:1.8rem;font-weight:800;color:#059669;margin-top:4px;">${salesmanOrdersCount}</div>
            <div style="font-size:12px;color:#10b981;font-weight:600;margin-top:2px;">From Field Force App</div>
          </div>

          <div class="card" style="padding:1.2rem;border-radius:var(--radius-md);border-top:3px solid #f59e0b;">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Pending Invoicing / Action</div>
            <div style="font-size:1.8rem;font-weight:800;color:#d97706;margin-top:4px;">${pendingOrdersCount}</div>
            <div style="font-size:12px;color:#f59e0b;font-weight:600;margin-top:2px;">Ready to Bill</div>
          </div>

          <div class="card" style="padding:1.2rem;border-radius:var(--radius-md);border-top:3px solid #ef4444;">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Pending Collections</div>
            <div style="font-size:1.8rem;font-weight:800;color:#dc2626;margin-top:4px;">₹${pendingCollectionValue.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
            <div style="font-size:12px;color:#ef4444;font-weight:600;margin-top:2px;">Payment Pending on Orders</div>
          </div>
        </div>

        <!-- Filter Bar & Search Box -->
        <div class="card" style="padding:1rem 1.25rem;border-radius:var(--radius-md);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
            <!-- Filter Tabs -->
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-sm ${this.activeFilter === 'all' ? 'btn-primary' : 'btn-outline'}" data-filter="all">
                All Orders (${allOrders.length})
              </button>
              <button class="btn btn-sm ${this.activeFilter === 'salesman' ? 'btn-primary' : 'btn-outline'}" data-filter="salesman">
                🛵 Field Salesman (${allOrders.filter(o => o.source === 'Salesman App').length})
              </button>
              <button class="btn btn-sm ${this.activeFilter === 'direct' ? 'btn-primary' : 'btn-outline'}" data-filter="direct">
                🏪 Direct Counter (${allOrders.filter(o => o.source !== 'Salesman App').length})
              </button>
              <button class="btn btn-sm ${this.activeFilter === 'pending' ? 'btn-primary' : 'btn-outline'}" data-filter="pending">
                ⏳ Payment Pending (${allOrders.filter(o => o.paymentStatus === 'Pending').length})
              </button>
              <button class="btn btn-sm ${this.activeFilter === 'billed' ? 'btn-primary' : 'btn-outline'}" data-filter="billed">
                📄 Billed (${allOrders.filter(o => o.orderStatus === 'Billed').length})
              </button>
            </div>

            <!-- Search Box -->
            <div style="position:relative;min-width:260px;max-width:340px;flex:1;">
              <input type="text" id="orderSearchInput" class="form-control" placeholder="Search order #, customer, salesman..." value="${this.searchQuery}" style="padding-left:34px;font-size:13px;border-radius:20px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>
        </div>

        <!-- Orders Table / List View -->
        <div class="card" style="padding:0;overflow:hidden;border-radius:var(--radius-md);">
          <div class="table-responsive">
            <table class="table table-hover" style="margin:0;width:100%;font-size:13.5px;border-collapse:collapse;">
              <thead style="background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;text-transform:uppercase;">
                <tr>
                  <th style="padding:14px 16px;">Order Details</th>
                  <th style="padding:14px 16px;">Source & Salesman</th>
                  <th style="padding:14px 16px;">Customer / Party</th>
                  <th style="padding:14px 16px;">Items Summary</th>
                  <th style="padding:14px 16px;text-align:right;">Order Total</th>
                  <th style="padding:14px 16px;text-align:center;">Payment Status</th>
                  <th style="padding:14px 16px;text-align:center;">Bill / Invoicing</th>
                  <th style="padding:14px 16px;text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${orders.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align:center;padding:3rem 1rem;color:#94a3b8;">
                      <div style="font-size:2.5rem;margin-bottom:0.5rem;">📦</div>
                      <div style="font-size:15px;font-weight:700;color:#475569;">No orders found matching this filter</div>
                      <p style="font-size:13px;margin:4px 0 0 0;">New orders created in Field Salesman App or at Counter will appear here instantly.</p>
                    </td>
                  </tr>
                ` : orders.map(order => this.renderOrderRow(order)).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Generate Bill & Payment Verification Modal -->
      ${this.renderGenerateBillModal()}

      <!-- Update Payment Status Modal (Pending -> Paid) -->
      ${this.renderPaymentStatusModal()}

      <!-- New Direct Order Creation Modal -->
      ${this.renderCreateOrderModal()}

      <!-- Order Details Drawer -->
      ${this.renderOrderDetailsDrawer()}
    `;

    this.bindEvents(container);
  },

  getFilteredOrders() {
    let orders = window.Store.getOrders();
    if (this.activeFilter === 'salesman') {
      orders = orders.filter(o => o.source === 'Salesman App');
    } else if (this.activeFilter === 'direct') {
      orders = orders.filter(o => o.source !== 'Salesman App');
    } else if (this.activeFilter === 'pending') {
      orders = orders.filter(o => o.paymentStatus === 'Pending');
    } else if (this.activeFilter === 'billed') {
      orders = orders.filter(o => o.orderStatus === 'Billed');
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      orders = orders.filter(o => 
        (o.number || '').toLowerCase().includes(q) ||
        (o.partyName || '').toLowerCase().includes(q) ||
        (o.salesmanName || '').toLowerCase().includes(q) ||
        (o.source || '').toLowerCase().includes(q)
      );
    }
    return orders;
  },

  renderOrderRow(order) {
    const isBilled = order.orderStatus === 'Billed';
    const isPaid = order.paymentStatus === 'Paid';
    const sourceClass = order.source === 'Salesman App' ? 'badge-info' : (order.source === 'Direct Counter' ? 'badge-primary' : 'badge-warning');
    const sourceIcon = order.source === 'Salesman App' ? '🛵' : (order.source === 'Direct Counter' ? '🏪' : '📱');

    const itemsSummary = (order.items || []).map(i => `${i.name} (x${i.qty || i.quantity || 1})`).join(', ');

    return `
      <tr style="border-bottom:1px solid #f1f5f9;transition:background 0.15s;" class="order-table-row" data-id="${order.id}">
        <!-- Order # & Date -->
        <td style="padding:14px 16px;">
          <div style="font-weight:800;color:#0f172a;cursor:pointer;" class="order-click-details" data-id="${order.id}">
            #${order.number}
          </div>
          <div style="font-size:11.5px;color:#64748b;margin-top:2px;">
            ${new Date(order.date || order.timestamp).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}
          </div>
        </td>

        <!-- Source & Salesman -->
        <td style="padding:14px 16px;">
          <div style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;background:#e0f2fe;color:#0369a1;">
            <span>${sourceIcon}</span>
            <span>${order.source}</span>
          </div>
          <div style="font-size:12px;font-weight:600;color:#334155;margin-top:4px;">
            ${order.salesmanName || (order.source === 'Salesman App' ? 'Field Salesman' : 'Direct / Owner')}
          </div>
        </td>

        <!-- Customer -->
        <td style="padding:14px 16px;">
          <div style="font-weight:700;color:#0f172a;">${order.partyName || 'Cash Sale'}</div>
          ${order.phone ? `<div style="font-size:11.5px;color:#64748b;">📞 ${order.phone}</div>` : ''}
        </td>

        <!-- Items Summary -->
        <td style="padding:14px 16px;max-width:240px;">
          <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#334155;" title="${itemsSummary}">
            ${itemsSummary || 'Standard Inventory Items'}
          </div>
          <div style="font-size:11.5px;color:#64748b;">${(order.items || []).length} items</div>
        </td>

        <!-- Total Amount -->
        <td style="padding:14px 16px;text-align:right;">
          <div style="font-weight:800;font-size:14.5px;color:#0f172a;">
            ₹${Number(order.total || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}
          </div>
          ${order.tax ? `<div style="font-size:11px;color:#64748b;">(Incl. GST ₹${Number(order.tax).toFixed(2)})</div>` : ''}
        </td>

        <!-- Payment Status Column with Paid Amount nearby -->
        <td style="padding:14px 16px;text-align:center;">
          ${isPaid ? `
            <div style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;">
              <span class="badge" style="background:#dcfce7;color:#15803d;font-weight:700;font-size:11px;padding:3px 8px;border-radius:12px;">
                ✓ PAID
              </span>
              <span style="font-size:11px;font-weight:700;color:#166534;margin-top:2px;">
                ₹${(order.paidAmount || order.total).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}
              </span>
              <span style="font-size:10px;color:#475569;">
                via ${order.paymentMode || 'Cash'}
              </span>
            </div>
          ` : `
            <div style="display:inline-flex;flex-direction:column;align-items:center;gap:3px;">
              <span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:700;font-size:11px;padding:3px 8px;border-radius:12px;">
                ⏳ Payment Pending
              </span>
              <button class="btn btn-xs btn-outline btn-mark-paid" data-id="${order.id}" style="font-size:10.5px;padding:2px 8px;margin-top:4px;border-color:#10b981;color:#059669;font-weight:700;" title="Update payment status to Paid">
                Mark as Paid ➔
              </button>
            </div>
          `}
        </td>

        <!-- Invoicing / Bill Status -->
        <td style="padding:14px 16px;text-align:center;">
          ${isBilled ? `
            <div style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;">
              <span class="badge" style="background:#ede9fe;color:#6d28d9;font-weight:700;font-size:11px;padding:3px 8px;border-radius:12px;">
                📄 BILLED
              </span>
              <span style="font-size:11px;font-weight:700;color:#5b21b6;margin-top:2px;">
                #${order.invoiceNumber || order.invoiceId}
              </span>
            </div>
          ` : `
            <button class="btn btn-sm btn-primary btn-generate-bill shadow-pulse" data-id="${order.id}" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);border:none;font-size:12px;font-weight:700;padding:6px 12px;border-radius:6px;box-shadow:0 2px 8px rgba(16,185,129,0.3);">
              ⚡ Generate Bill
            </button>
          `}
        </td>

        <!-- Actions -->
        <td style="padding:14px 16px;text-align:right;">
          <div style="display:inline-flex;gap:6px;">
            <button class="btn btn-sm btn-outline btn-view-order" data-id="${order.id}" title="View Order Breakdown" style="padding:4px 8px;">
              👁️
            </button>
            ${isBilled ? `
              <button class="btn btn-sm btn-outline btn-print-bill" data-id="${order.invoiceId || order.invoiceNumber}" title="Print Generated Tax Invoice" style="padding:4px 8px;">
                🖨️
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  },

  // --------------------------------------------------------------------------
  // MODAL 1: Payment Verification & Bill Generation Prompt
  // --------------------------------------------------------------------------
  renderGenerateBillModal() {
    return `
      <div class="modal-overlay" id="generateBillModal" style="display:none;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.7);z-index:99999;backdrop-filter:blur(4px);">
        <div class="modal-dialog" style="background:#ffffff;border-radius:12px;max-width:520px;width:95%;padding:0;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
          
          <div style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);color:#fff;padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;">Step 1 of 1 • Payment Verification</div>
              <h3 style="margin:2px 0 0 0;font-size:1.2rem;font-weight:800;">Generate Tax Bill for Order #<span id="billModalOrderNumber"></span></h3>
            </div>
            <button type="button" id="closeGenerateBillModalBtn" style="background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;">&times;</button>
          </div>

          <form id="generateBillForm" style="padding:1.5rem;">
            <input type="hidden" id="billModalOrderId">

            <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 14px;border-radius:8px;margin-bottom:1.25rem;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:12px;color:#64748b;">Customer / Party</div>
                <div style="font-size:14px;font-weight:700;color:#0f172a;" id="billModalPartyName"></div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px;color:#64748b;">Order Total Amount</div>
                <div style="font-size:16px;font-weight:800;color:#059669;" id="billModalTotal"></div>
              </div>
            </div>

            <!-- Crucial User Prompt: Payment Done or Not? -->
            <div class="form-group" style="margin-bottom:1.25rem;">
              <label style="font-size:13.5px;font-weight:800;color:#0f172a;display:block;margin-bottom:8px;">
                Has the payment been received for this order? *
              </label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <label style="border:2px solid #e2e8f0;border-radius:8px;padding:12px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.15s;" id="labelPaymentDone">
                  <input type="radio" name="paymentDoneChoice" value="yes" checked style="accent-color:#10b981;transform:scale(1.2);">
                  <div>
                    <div style="font-weight:700;color:#065f46;font-size:13.5px;">✓ YES, Payment Done</div>
                    <div style="font-size:11px;color:#64748b;">Mention paid mode on bill</div>
                  </div>
                </label>

                <label style="border:2px solid #e2e8f0;border-radius:8px;padding:12px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.15s;" id="labelPaymentNotDone">
                  <input type="radio" name="paymentDoneChoice" value="no" style="accent-color:#ef4444;transform:scale(1.2);">
                  <div>
                    <div style="font-weight:700;color:#991b1b;font-size:13.5px;">✗ NO, Not Paid Yet</div>
                    <div style="font-size:11px;color:#64748b;">Mark 'Payment Pending'</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Conditional Section: If Payment is Done, Ask Medium of Payment -->
            <div id="paymentMediumSection" style="margin-bottom:1.25rem;background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:8px;">
              <label for="billPaymentMediumSelect" style="font-size:13px;font-weight:700;color:#166534;display:block;margin-bottom:6px;">
                Medium of Payment * (Will be prominently printed on Tax Bill)
              </label>
              <select id="billPaymentMediumSelect" class="form-control" style="font-weight:600;font-size:13.5px;">
                <option value="UPI / QR">📱 UPI / QR Code (Google Pay, PhonePe, Paytm)</option>
                <option value="Cash">💵 Cash in Hand</option>
                <option value="Net Banking / NEFT">🏦 Bank Transfer / NEFT / RTGS</option>
                <option value="Credit / Debit Card">💳 POS Card Swipe (Visa / Mastercard / RuPay)</option>
                <option value="Cheque">🧾 Bank Cheque</option>
              </select>

              <div style="margin-top:10px;">
                <label for="billPaymentReference" style="font-size:12px;font-weight:600;color:#166534;display:block;margin-bottom:4px;">
                  Transaction ID / UTR / Reference (Optional)
                </label>
                <input type="text" id="billPaymentReference" class="form-control" placeholder="e.g. UPI/0219485291 or CHQ-402911" style="font-size:13px;">
              </div>
            </div>

            <!-- Notice when Payment Not Made -->
            <div id="paymentPendingNoticeSection" style="display:none;margin-bottom:1.25rem;background:#fef2f2;border:1px solid #fecaca;padding:12px 14px;border-radius:8px;">
              <div style="font-weight:700;color:#991b1b;font-size:13px;display:flex;align-items:center;gap:6px;">
                <span>⚠️</span> Bill will be generated with <b>"Payment Pending"</b> status.
              </div>
              <p style="font-size:12px;color:#7f1d1d;margin:4px 0 0 0;">
                The order total will be added as outstanding receivable to the customer's Khata balance. You can change payment status to 'Paid' anytime later.
              </p>
            </div>

            <!-- Inventory Deduction Reminder -->
            <div style="background:#f8fafc;padding:10px 12px;border-radius:6px;font-size:12px;color:#64748b;margin-bottom:1.25rem;">
              📦 <b>Inventory & Accounting Impact:</b> Generating this bill will automatically deduct item stocks and update your financial balance.
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;">
              <button type="button" class="btn btn-secondary" id="cancelGenerateBillBtn">Cancel</button>
              <button type="submit" class="btn btn-primary" id="confirmGenerateBillBtn" style="background:#10b981;border-color:#059669;font-weight:700;">
                ✓ Confirm & Generate Bill
              </button>
            </div>
          </form>

        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // MODAL 2: Change Payment Status (Pending -> Paid)
  // --------------------------------------------------------------------------
  renderPaymentStatusModal() {
    return `
      <div class="modal-overlay" id="markPaidModal" style="display:none;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.7);z-index:99999;backdrop-filter:blur(4px);">
        <div class="modal-dialog" style="background:#ffffff;border-radius:12px;max-width:480px;width:95%;padding:0;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
          
          <div style="background:linear-gradient(135deg, #059669 0%, #047857 100%);color:#fff;padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:11px;font-weight:800;color:#a7f3d0;text-transform:uppercase;">Collect Outstanding Payment</div>
              <h3 style="margin:2px 0 0 0;font-size:1.2rem;font-weight:800;">Mark Order #<span id="markPaidOrderNumber"></span> as PAID</h3>
            </div>
            <button type="button" id="closeMarkPaidModalBtn" style="background:none;border:none;color:#d1fae5;font-size:24px;cursor:pointer;">&times;</button>
          </div>

          <form id="markPaidForm" style="padding:1.5rem;">
            <input type="hidden" id="markPaidOrderId">

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px 14px;border-radius:8px;margin-bottom:1.25rem;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:12px;color:#166534;">Customer</div>
                <div style="font-size:14px;font-weight:700;color:#065f46;" id="markPaidPartyName"></div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px;color:#166534;">Pending Balance</div>
                <div style="font-size:18px;font-weight:800;color:#059669;" id="markPaidAmountDisplay"></div>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:1rem;">
              <label for="markPaidMediumSelect" style="font-size:13px;font-weight:700;color:#0f172a;display:block;margin-bottom:6px;">
                Medium of Payment Received *
              </label>
              <select id="markPaidMediumSelect" class="form-control" style="font-weight:600;font-size:13.5px;" required>
                <option value="UPI / QR">📱 UPI / QR (Google Pay / PhonePe / Paytm)</option>
                <option value="Cash" selected>💵 Cash in Hand</option>
                <option value="Net Banking / NEFT">🏦 Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="Credit / Debit Card">💳 POS Card Swipe</option>
                <option value="Cheque">🧾 Bank Cheque</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom:1rem;">
              <label for="markPaidAmountInput" style="font-size:13px;font-weight:700;color:#0f172a;display:block;margin-bottom:6px;">
                Amount Received (₹) *
              </label>
              <input type="number" step="0.01" id="markPaidAmountInput" class="form-control" style="font-size:15px;font-weight:700;" required>
            </div>

            <div class="form-group" style="margin-bottom:1.25rem;">
              <label for="markPaidReferenceInput" style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">
                Transaction Reference / Receipt Note
              </label>
              <input type="text" id="markPaidReferenceInput" class="form-control" placeholder="e.g. Received via GPay at shop">
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;">
              <button type="button" class="btn btn-secondary" id="cancelMarkPaidBtn">Cancel</button>
              <button type="submit" class="btn btn-primary" style="background:#059669;border-color:#047857;font-weight:700;">
                ✓ Save & Mark as Paid
              </button>
            </div>
          </form>

        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // MODAL 3: Direct Order Creation Modal
  // --------------------------------------------------------------------------
  renderCreateOrderModal() {
    const parties = window.Store.getParties().filter(p => p.type === 'Customer');
    const items = window.Store.getItems();

    return `
      <div class="modal-overlay" id="createOrderModal" style="display:none;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.7);z-index:99999;backdrop-filter:blur(4px);">
        <div class="modal-dialog" style="background:#ffffff;border-radius:12px;max-width:640px;width:95%;padding:0;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
          
          <div style="background:linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);color:#fff;padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:11px;font-weight:800;color:#93c5fd;text-transform:uppercase;">Counter & Remote Booking</div>
              <h3 style="margin:2px 0 0 0;font-size:1.2rem;font-weight:800;">Create New Order</h3>
            </div>
            <button type="button" id="closeCreateOrderModalBtn" style="background:none;border:none;color:#bfdbfe;font-size:24px;cursor:pointer;">&times;</button>
          </div>

          <form id="createOrderForm" style="padding:1.5rem;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
              <div class="form-group">
                <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Order Source *</label>
                <select id="newOrderSource" class="form-control" required>
                  <option value="Direct Counter">🏪 Direct Counter Order</option>
                  <option value="WhatsApp / Phone">📱 WhatsApp / Phone Order</option>
                  <option value="Online Portal">🌐 Online Portal / Web Store</option>
                </select>
              </div>

              <div class="form-group">
                <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Customer / Party *</label>
                <select id="newOrderParty" class="form-control" required>
                  ${parties.map(p => `<option value="${p.id}" data-name="${p.name}" data-phone="${p.phone || ''}">${p.name} (${p.phone || 'No Phone'})</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:1rem;">
              <label style="font-size:12.5px;font-weight:700;color:#0f172a;">Select Item to Add *</label>
              <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;">
                <select id="newOrderItemSelect" class="form-control">
                  ${items.map(i => `<option value="${i.id}" data-price="${i.salePrice}" data-gst="${i.gstRate || 0}">${i.name} (₹${i.salePrice}) - Stock: ${i.stock}</option>`).join('')}
                </select>
                <input type="number" id="newOrderItemQty" class="form-control" value="1" min="1" placeholder="Qty">
                <button type="button" class="btn btn-outline" id="addItemToCartBtn" style="font-weight:700;">+ Add</button>
              </div>
            </div>

            <!-- Item Cart Table -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:1rem;">
              <table style="width:100%;font-size:12.5px;">
                <thead>
                  <tr style="color:#64748b;border-bottom:1px solid #e2e8f0;">
                    <th style="text-align:left;padding-bottom:6px;">Item</th>
                    <th style="text-align:center;padding-bottom:6px;">Qty</th>
                    <th style="text-align:right;padding-bottom:6px;">Rate</th>
                    <th style="text-align:right;padding-bottom:6px;">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="cartItemsTableBody">
                  <!-- Injected dynamically -->
                </tbody>
              </table>
              <div style="text-align:right;margin-top:8px;font-size:14px;font-weight:800;color:#0f172a;">
                Total: <span id="cartTotalDisplay" style="color:#2563eb;">₹0.00</span>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:1.25rem;">
              <label style="font-size:12px;color:#64748b;">Order Notes / Delivery Instructions</label>
              <input type="text" id="newOrderNotes" class="form-control" placeholder="e.g. Urgent evening delivery requested">
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;">
              <button type="button" class="btn btn-secondary" id="cancelCreateOrderBtn">Cancel</button>
              <button type="submit" class="btn btn-primary" style="background:#2563eb;font-weight:700;">Create Order</button>
            </div>
          </form>

        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // DRAWER 4: Order Details Breakdown
  // --------------------------------------------------------------------------
  renderOrderDetailsDrawer() {
    return `
      <div id="orderDetailsDrawer" style="display:none;position:fixed;top:0;right:0;width:480px;max-width:90vw;height:100vh;background:#ffffff;box-shadow:-10px 0 30px rgba(0,0,0,0.25);z-index:999999;overflow-y:auto;padding:0;">
        <div style="background:#0f172a;color:#fff;padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:11px;color:#38bdf8;font-weight:800;text-transform:uppercase;">Order Dossier</div>
            <h3 style="margin:0;font-size:1.2rem;font-weight:800;" id="drawerOrderNumber"></h3>
          </div>
          <button id="closeOrderDrawerBtn" style="background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;">&times;</button>
        </div>
        <div id="drawerOrderContent" style="padding:1.5rem;">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    // 1. Filter buttons
    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.onclick = () => {
        this.activeFilter = btn.getAttribute('data-filter');
        this.render(container);
      };
    });

    // 2. Search input
    const searchInput = container.querySelector('#orderSearchInput');
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value;
        this.render(container);
      };
    }

    // 3. Open Create Order Modal
    const createBtn = container.querySelector('#openCreateOrderBtn');
    if (createBtn) {
      createBtn.onclick = () => this.openCreateOrderModal();
    }

    // 4. Generate Bill Trigger buttons
    container.querySelectorAll('.btn-generate-bill').forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute('data-id');
        this.openGenerateBillModal(orderId);
      };
    });

    // 5. Mark as Paid Trigger buttons
    container.querySelectorAll('.btn-mark-paid').forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute('data-id');
        this.openMarkPaidModal(orderId);
      };
    });

    // 6. View Order Details
    container.querySelectorAll('.btn-view-order, .order-click-details').forEach(el => {
      el.onclick = () => {
        const orderId = el.getAttribute('data-id');
        this.openOrderDetails(orderId);
      };
    });

    // 7. Print Generated Bill
    container.querySelectorAll('.btn-print-bill').forEach(btn => {
      btn.onclick = () => {
        const invId = btn.getAttribute('data-id');
        if (window.app && window.app.openPrintInvoice) {
          window.app.openPrintInvoice(invId);
        } else {
          alert('Opening print preview for Invoice: ' + invId);
        }
      };
    });

    // 8. Bind Generate Bill Modal interactions
    this.bindGenerateBillModalEvents();

    // 9. Bind Mark Paid Modal interactions
    this.bindMarkPaidModalEvents();

    // 10. Bind Create Order Modal
    this.bindCreateOrderModalEvents();

    // 11. Listen for real-time order updates dispatched across apps
    if (!this.hasBoundGlobalListener) {
      window.addEventListener('ordersUpdated', () => {
        if (this.container && window.location.hash.includes('orders')) {
          this.render(this.container);
        }
      });
      this.hasBoundGlobalListener = true;
    }
  },

  openGenerateBillModal(orderId) {
    const order = window.Store.getOrder(orderId);
    if (!order) return;

    const modal = document.getElementById('generateBillModal');
    if (!modal) return;

    document.getElementById('billModalOrderId').value = order.id;
    document.getElementById('billModalOrderNumber').innerText = order.number;
    document.getElementById('billModalPartyName').innerText = order.partyName;
    document.getElementById('billModalTotal').innerText = `₹${Number(order.total).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}`;

    // Default to 'yes' (Payment Done)
    const yesRadio = document.querySelector('input[name="paymentDoneChoice"][value="yes"]');
    if (yesRadio) yesRadio.checked = true;

    document.getElementById('paymentMediumSection').style.display = 'block';
    document.getElementById('paymentPendingNoticeSection').style.display = 'none';

    modal.style.display = 'flex';
  },

  bindGenerateBillModalEvents() {
    const modal = document.getElementById('generateBillModal');
    if (!modal) return;

    const closeBtn = document.getElementById('closeGenerateBillModalBtn');
    const cancelBtn = document.getElementById('cancelGenerateBillBtn');
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    if (cancelBtn) cancelBtn.onclick = () => modal.style.display = 'none';

    // Radio change: YES (Payment Done) vs NO (Payment Pending)
    document.querySelectorAll('input[name="paymentDoneChoice"]').forEach(r => {
      r.onchange = (e) => {
        const isYes = e.target.value === 'yes';
        document.getElementById('paymentMediumSection').style.display = isYes ? 'block' : 'none';
        document.getElementById('paymentPendingNoticeSection').style.display = isYes ? 'none' : 'block';
      };
    });

    // Form submit
    const form = document.getElementById('generateBillForm');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const orderId = document.getElementById('billModalOrderId').value;
        const choice = document.querySelector('input[name="paymentDoneChoice"]:checked').value;
        const isPaid = choice === 'yes';
        const mode = isPaid ? document.getElementById('billPaymentMediumSelect').value : 'Credit';
        const ref = isPaid ? document.getElementById('billPaymentReference').value : '';

        try {
          const res = window.Store.convertOrderToInvoice(orderId, {
            isPaid,
            paymentMode: mode,
            reference: ref
          });

          modal.style.display = 'none';
          window.app.showToast(`Bill #${res.invoice.number} generated successfully! ${isPaid ? `Marked Paid via ${mode}` : 'Payment Pending'}`, 'success');
          this.render(this.container);

          // Update badges
          if (window.app && window.app.updateBadges) window.app.updateBadges();
        } catch (err) {
          alert('Error generating bill: ' + err.message);
        }
      };
    }
  },

  openMarkPaidModal(orderId) {
    const order = window.Store.getOrder(orderId);
    if (!order) return;

    const modal = document.getElementById('markPaidModal');
    if (!modal) return;

    const due = order.balanceDue !== undefined ? order.balanceDue : order.total;

    document.getElementById('markPaidOrderId').value = order.id;
    document.getElementById('markPaidOrderNumber').innerText = order.number;
    document.getElementById('markPaidPartyName').innerText = order.partyName;
    document.getElementById('markPaidAmountDisplay').innerText = `₹${Number(due).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    document.getElementById('markPaidAmountInput').value = due;

    modal.style.display = 'flex';
  },

  bindMarkPaidModalEvents() {
    const modal = document.getElementById('markPaidModal');
    if (!modal) return;

    const closeBtn = document.getElementById('closeMarkPaidModalBtn');
    const cancelBtn = document.getElementById('cancelMarkPaidBtn');
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    if (cancelBtn) cancelBtn.onclick = () => modal.style.display = 'none';

    const form = document.getElementById('markPaidForm');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const orderId = document.getElementById('markPaidOrderId').value;
        const mode = document.getElementById('markPaidMediumSelect').value;
        const amount = Number(document.getElementById('markPaidAmountInput').value) || 0;
        const ref = document.getElementById('markPaidReferenceInput').value;

        try {
          window.Store.markOrderPaymentPaid(orderId, {
            paymentMode: mode,
            paidAmount: amount,
            reference: ref
          });

          modal.style.display = 'none';
          window.app.showToast(`Order #${orderId} marked as Paid (₹${amount.toFixed(2)} via ${mode})!`, 'success');
          this.render(this.container);

          if (window.app && window.app.updateBadges) window.app.updateBadges();
        } catch (err) {
          alert('Error recording payment: ' + err.message);
        }
      };
    }
  },

  // Direct Order Cart State
  orderCart: [],

  openCreateOrderModal() {
    const modal = document.getElementById('createOrderModal');
    if (!modal) return;

    this.orderCart = [];
    this.renderOrderCart();
    modal.style.display = 'flex';
  },

  renderOrderCart() {
    const tbody = document.getElementById('cartItemsTableBody');
    const totalDisplay = document.getElementById('cartTotalDisplay');
    if (!tbody || !totalDisplay) return;

    if (this.orderCart.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:12px;color:#94a3b8;">No items in order cart. Select an item above.</td></tr>`;
      totalDisplay.innerText = '₹0.00';
      return;
    }

    let sub = 0;
    tbody.innerHTML = this.orderCart.map((item, idx) => {
      const lineTotal = item.rate * item.qty;
      sub += lineTotal;
      return `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:6px 0;"><strong>${item.name}</strong></td>
          <td style="text-align:center;padding:6px 0;">${item.qty}</td>
          <td style="text-align:right;padding:6px 0;">₹${item.rate}</td>
          <td style="text-align:right;padding:6px 0;font-weight:700;">₹${lineTotal.toFixed(2)}</td>
          <td style="text-align:right;padding:6px 0;"><button type="button" class="btn btn-xs btn-outline remove-cart-item" data-idx="${idx}" style="color:#ef4444;border:none;">&times;</button></td>
        </tr>
      `;
    }).join('');

    const gst = sub * 0.05; // 5% standard demo tax
    const total = sub + gst;
    totalDisplay.innerText = `₹${total.toFixed(2)} (Tax: ₹${gst.toFixed(2)})`;

    // Bind remove
    tbody.querySelectorAll('.remove-cart-item').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-idx'));
        this.orderCart.splice(idx, 1);
        this.renderOrderCart();
      };
    });
  },

  bindCreateOrderModalEvents() {
    const modal = document.getElementById('createOrderModal');
    if (!modal) return;

    const closeBtn = document.getElementById('closeCreateOrderModalBtn');
    const cancelBtn = document.getElementById('cancelCreateOrderBtn');
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    if (cancelBtn) cancelBtn.onclick = () => modal.style.display = 'none';

    const addItemBtn = document.getElementById('addItemToCartBtn');
    if (addItemBtn) {
      addItemBtn.onclick = () => {
        const select = document.getElementById('newOrderItemSelect');
        const qtyInput = document.getElementById('newOrderItemQty');
        if (!select || !qtyInput) return;

        const opt = select.selectedOptions[0];
        const itemId = select.value;
        const name = opt.innerText.split(' (')[0];
        const price = Number(opt.getAttribute('data-price')) || 100;
        const gst = Number(opt.getAttribute('data-gst')) || 5;
        const qty = Number(qtyInput.value) || 1;

        this.orderCart.push({
          itemId,
          name,
          qty,
          rate: price,
          gstRate: gst
        });
        this.renderOrderCart();
      };
    }

    const form = document.getElementById('createOrderForm');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        if (this.orderCart.length === 0) {
          alert('Please add at least 1 item to the order');
          return;
        }

        const source = document.getElementById('newOrderSource').value;
        const partySelect = document.getElementById('newOrderParty');
        const partyOpt = partySelect.selectedOptions[0];
        const partyId = partySelect.value;
        const partyName = partyOpt.getAttribute('data-name');
        const phone = partyOpt.getAttribute('data-phone');
        const notes = document.getElementById('newOrderNotes').value;

        const subtotal = this.orderCart.reduce((sum, i) => sum + (i.rate * i.qty), 0);
        const tax = subtotal * 0.05;
        const total = subtotal + tax;

        const newOrder = window.Store.addOrder({
          source,
          partyId,
          partyName,
          phone,
          items: this.orderCart,
          subtotal,
          tax,
          total,
          notes,
          paymentStatus: 'Pending',
          paymentMode: 'Pending'
        });

        modal.style.display = 'none';
        window.app.showToast(`Direct order #${newOrder.number} created successfully!`, 'success');
        this.render(this.container);

        if (window.app && window.app.updateBadges) window.app.updateBadges();
      };
    }
  },

  openOrderDetails(orderId) {
    const order = window.Store.getOrder(orderId);
    if (!order) return;

    const drawer = document.getElementById('orderDetailsDrawer');
    const title = document.getElementById('drawerOrderNumber');
    const content = document.getElementById('drawerOrderContent');
    const closeBtn = document.getElementById('closeOrderDrawerBtn');
    if (!drawer || !content) return;

    title.innerText = `#${order.number}`;
    closeBtn.onclick = () => drawer.style.display = 'none';

    content.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:1.25rem;">
        
        <!-- Status Banner -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 14px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;">Order Status</div>
            <div style="font-size:15px;font-weight:800;color:${order.orderStatus === 'Billed' ? '#059669' : '#d97706'};">
              ${order.orderStatus === 'Billed' ? '✓ BILLED (Invoice #' + (order.invoiceNumber || order.invoiceId) + ')' : '⏳ PENDING BILLING'}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;">Payment Status</div>
            <div style="font-size:14px;font-weight:800;color:${order.paymentStatus === 'Paid' ? '#059669' : '#dc2626'};">
              ${order.paymentStatus === 'Paid' ? '✓ PAID (' + order.paymentMode + ')' : '⏳ PAYMENT PENDING'}
            </div>
          </div>
        </div>

        <!-- Meta -->
        <div>
          <h4 style="font-size:13px;color:#64748b;margin:0 0 8px 0;text-transform:uppercase;">Source & Salesman</h4>
          <div style="background:#f1f5f9;padding:10px 12px;border-radius:6px;font-size:13px;">
            <div>Source: <b>${order.source}</b></div>
            <div>Booked By: <b>${order.salesmanName || 'Direct Counter'}</b></div>
            <div>Date & Time: <b>${new Date(order.timestamp || order.date).toLocaleString()}</b></div>
          </div>
        </div>

        <!-- Customer -->
        <div>
          <h4 style="font-size:13px;color:#64748b;margin:0 0 8px 0;text-transform:uppercase;">Customer Profile</h4>
          <div style="background:#f1f5f9;padding:10px 12px;border-radius:6px;font-size:13px;">
            <div style="font-weight:700;font-size:14px;color:#0f172a;">${order.partyName}</div>
            ${order.phone ? `<div>Phone: <b>${order.phone}</b></div>` : ''}
            ${order.notes ? `<div style="margin-top:4px;color:#475569;">Notes: <i>"${order.notes}"</i></div>` : ''}
          </div>
        </div>

        <!-- Line Items -->
        <div>
          <h4 style="font-size:13px;color:#64748b;margin:0 0 8px 0;text-transform:uppercase;">Itemized Breakdown</h4>
          <div style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
            <table style="width:100%;font-size:12.5px;border-collapse:collapse;">
              <thead style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                <tr>
                  <th style="padding:8px 10px;text-align:left;">Item</th>
                  <th style="padding:8px 10px;text-align:center;">Qty</th>
                  <th style="padding:8px 10px;text-align:right;">Rate</th>
                  <th style="padding:8px 10px;text-align:right;">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || []).map(i => `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:8px 10px;font-weight:600;">${i.name}</td>
                    <td style="padding:8px 10px;text-align:center;">${i.qty || i.quantity || 1}</td>
                    <td style="padding:8px 10px;text-align:right;">₹${i.rate || i.price}</td>
                    <td style="padding:8px 10px;text-align:right;font-weight:700;">₹${((i.rate || i.price) * (i.qty || i.quantity || 1)).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Financial Summary -->
        <div style="background:#fafafa;padding:12px;border-radius:8px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span>Subtotal:</span>
            <span>₹${Number(order.subtotal || 0).toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span>GST Tax:</span>
            <span>₹${Number(order.tax || 0).toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#0f172a;border-top:1px solid #e2e8f0;padding-top:6px;margin-top:4px;">
            <span>Grand Total:</span>
            <span style="color:#059669;">₹${Number(order.total || 0).toFixed(2)}</span>
          </div>
          ${order.paymentStatus === 'Paid' ? `
            <div style="margin-top:6px;font-size:12px;color:#15803d;font-weight:700;">
              ✓ Paid Amount: ₹${Number(order.paidAmount || order.total).toFixed(2)} (${order.paymentMode || 'Cash'})
            </div>
          ` : `
            <div style="margin-top:6px;font-size:12px;color:#dc2626;font-weight:700;">
              ⏳ Balance Due: ₹${Number(order.balanceDue !== undefined ? order.balanceDue : order.total).toFixed(2)}
            </div>
          `}
        </div>

        <!-- Quick Actions inside Drawer -->
        <div style="display:flex;gap:10px;">
          ${order.orderStatus !== 'Billed' ? `
            <button class="btn btn-primary btn-block" style="background:#10b981;border:none;" onclick="document.getElementById('orderDetailsDrawer').style.display='none';window.OrdersModule.openGenerateBillModal('${order.id}');">
              ⚡ Generate Bill
            </button>
          ` : `
            <button class="btn btn-primary btn-block" onclick="window.app.openPrintInvoice('${order.invoiceId || order.invoiceNumber}');">
              🖨️ View & Print Bill
            </button>
          `}
          ${order.paymentStatus === 'Pending' ? `
            <button class="btn btn-outline btn-block" style="border-color:#059669;color:#059669;" onclick="document.getElementById('orderDetailsDrawer').style.display='none';window.OrdersModule.openMarkPaidModal('${order.id}');">
              Mark as Paid
            </button>
          ` : ''}
        </div>

      </div>
    `;

    drawer.style.display = 'block';
  }
};
