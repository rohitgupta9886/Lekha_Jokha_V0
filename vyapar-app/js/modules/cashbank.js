// ==============================================================================
// LekhaJokha - Cash & Bank Accounting Module
// Workflows: Passbook Ledger, Multiple Bank Accounts & Contra Transfers
// ==============================================================================

window.CashBankModule = {
  currentTab: 'passbook', // 'passbook' | 'contra'

  render(container) {
    const activeBiz = window.Store.getActiveBusiness();
    const cashBank = window.Store.getCashBank();
    const contraTransfers = cashBank.contraTransfers || [];
    const sales = window.Store.getSales();
    const expenses = window.Store.getExpenses();

    const cashInHand = Number(cashBank.cashInHand || 0);
    const bankBalance = Number(cashBank.hdfcBank || (cashBank.bankAccounts && cashBank.bankAccounts[0] ? cashBank.bankAccounts[0].balance : 0) || 0);
    const totalLiquidity = cashInHand + bankBalance;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Top Sub-Navigation Tabs -->
        <div class="card" style="padding: 0.5rem 1rem;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sm ${this.currentTab === 'passbook' ? 'btn-primary' : 'btn-outline'} cb-subtab-btn" data-tab="passbook">
                <span>Passbook & Accounts</span>
              </button>
              <button class="btn btn-sm ${this.currentTab === 'contra' ? 'btn-primary' : 'btn-outline'} cb-subtab-btn" data-tab="contra">
                <span>Contra Transfers (${contraTransfers.length})</span>
              </button>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">
              Active Business: <b>${activeBiz.name}</b>
            </div>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-cash">
            <div class="kpi-header">
              <span class="kpi-label">Cash in Hand</span>
              <div class="kpi-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle></svg>
              </div>
            </div>
            <div class="kpi-value text-primary">₹${cashInHand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-footer"><span>Physical store cash counter</span></div>
          </div>

          <div class="kpi-card kpi-collect">
            <div class="kpi-header">
              <span class="kpi-label">${activeBiz.bankName || 'Primary Bank Account'}</span>
              <div class="kpi-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
              </div>
            </div>
            <div class="kpi-value text-success">₹${bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-footer"><span>A/C: ${activeBiz.accountNumber || 'N/A'} (UPI: ${activeBiz.upiId || 'N/A'})</span></div>
          </div>

          <div class="kpi-card kpi-stock">
            <div class="kpi-header">
              <span class="kpi-label">Total Liquid Capital</span>
              <div class="kpi-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
            </div>
            <div class="kpi-value" style="color: #0284c7;">₹${totalLiquidity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-footer"><span>Available for operations</span></div>
          </div>
        </div>

        <!-- Tab Body -->
        <div id="cbTabBody">
          ${this.currentTab === 'contra' ? this.renderContraTab() : this.renderPassbookTab()}
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  renderPassbookTab() {
    const sales = window.Store.getSales();
    const expenses = window.Store.getExpenses();

    const transactions = [];
    sales.forEach(s => {
      if (s.paid > 0) {
        transactions.push({
          date: s.date,
          type: 'Receipt (Sale)',
          desc: `Payment received for ${s.number} (${s.partyName})`,
          mode: s.paymentMode,
          in: s.paid,
          out: 0
        });
      }
    });

    expenses.forEach(e => {
      transactions.push({
        date: e.date,
        type: 'Payment (Expense)',
        desc: `${e.category}: ${e.description}`,
        mode: e.paymentMode,
        in: 0,
        out: e.amount
      });
    });

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <span>Live Passbook & Statement</span>
          </h2>
          <button class="btn btn-primary btn-sm" id="openContraModalBtn">+ Contra Transfer</button>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction Type</th>
                  <th>Description</th>
                  <th>Payment Mode</th>
                  <th class="text-right text-success">Credit In (₹)</th>
                  <th class="text-right text-danger">Debit Out (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.length === 0 ? `
                  <tr><td colspan="6" class="text-center text-muted" style="padding:2.5rem;">No financial transactions logged yet.</td></tr>
                ` : transactions.map(t => `
                  <tr>
                    <td>${t.date}</td>
                    <td><span class="badge ${t.in > 0 ? 'badge-success' : 'badge-danger'}">${t.type}</span></td>
                    <td><strong>${t.desc}</strong></td>
                    <td>${t.mode}</td>
                    <td class="text-right table-mono text-success" style="font-weight:700;">${t.in > 0 ? `+₹${Number(t.in).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}</td>
                    <td class="text-right table-mono text-danger" style="font-weight:700;">${t.out > 0 ? `-₹${Number(t.out).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderContraTab() {
    const cashBank = window.Store.getCashBank();
    const transfers = cashBank.contraTransfers || [];

    return `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
            <span>Contra Transfers (Internal Account Movements)</span>
          </h2>
          <button class="btn btn-primary btn-sm" id="openContraModalBtn2">+ Record Contra Transfer</button>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Voucher No</th>
                  <th>Date</th>
                  <th>From Account</th>
                  <th>To Account</th>
                  <th class="text-right">Amount (₹)</th>
                  <th>Reference Note</th>
                </tr>
              </thead>
              <tbody>
                ${transfers.length === 0 ? `
                  <tr><td colspan="6" class="text-center text-muted" style="padding:2.5rem;">No contra transfers recorded. Use this to log cash deposits into bank or ATM withdrawals.</td></tr>
                ` : transfers.map(c => `
                  <tr>
                    <td><b>${c.id}</b></td>
                    <td>${c.date}</td>
                    <td><span class="badge badge-warning">${c.from}</span></td>
                    <td><span class="badge badge-success">${c.to}</span></td>
                    <td class="text-right table-mono" style="font-weight:700;">₹${Number(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>${c.ref || 'Cash Counter Movement'}</td>
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
    container.querySelectorAll('.cb-subtab-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentTab = btn.getAttribute('data-tab');
        this.render(container);
      };
    });

    const contraBtn1 = container.querySelector('#openContraModalBtn');
    const contraBtn2 = container.querySelector('#openContraModalBtn2');
    if (contraBtn1) contraBtn1.onclick = () => this.openContraModal();
    if (contraBtn2) contraBtn2.onclick = () => this.openContraModal();
  },

  openContraModal() {
    const modalHtml = `
      <div class="modal-overlay active" id="contraModalOverlay" style="z-index: 10000;">
        <div class="modal-dialog" style="max-width: 480px;">
          <div class="modal-header">
            <h2 class="modal-title">Record Contra Transfer (Cash/Bank)</h2>
            <button class="modal-close-btn" onclick="document.getElementById('contraModalOverlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="contraForm">
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Transfer From *</label>
                  <select id="conFrom" class="form-control" required>
                    <option value="Cash">Cash in Hand (Counter)</option>
                    <option value="Bank">Bank Account</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Transfer To *</label>
                  <select id="conTo" class="form-control" required>
                    <option value="Bank">Bank Account (Deposit)</option>
                    <option value="Cash">Cash in Hand (Withdrawal)</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Amount (₹) *</label>
                <input type="number" id="conAmount" class="form-control" min="1" step="0.01" required value="5000">
              </div>
              <div class="form-group">
                <label>Reference Note / Bank Branch</label>
                <input type="text" id="conRef" class="form-control" placeholder="e.g. Daily sales deposit at branch">
              </div>
              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('contraModalOverlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-primary">Transfer Funds</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('contraForm').onsubmit = (e) => {
      e.preventDefault();
      const from = document.getElementById('conFrom').value;
      const to = document.getElementById('conTo').value;
      const amount = Number(document.getElementById('conAmount').value);
      const ref = document.getElementById('conRef').value;

      if (from === to) {
        window.app.showToast('Source and destination accounts must be different!', 'error');
        return;
      }

      window.Store.addContraTransfer({ from, to, amount, ref });
      document.getElementById('contraModalOverlay').remove();
      window.app.showToast(`Contra transfer of ₹${amount.toFixed(2)} completed!`, 'success');
      this.currentTab = 'contra';
      this.render(window.app.viewContainer);
    };
  }
};
