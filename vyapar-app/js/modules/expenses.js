// ========================================================
// Vyapar Pro - Expenses Module
// ========================================================

window.ExpensesModule = {
  render(container) {
    const expenses = window.Store.getExpenses();
    const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card kpi-pay">
          <div class="kpi-header">
            <span class="kpi-label">Total Monthly Expenses</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            </div>
          </div>
          <div class="kpi-value text-danger">₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div class="kpi-footer"><span>${expenses.length} operating vouchers logged</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <h2 class="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
              <span>Business Operating Expenses</span>
            </h2>
          </div>
          <button class="btn btn-primary btn-sm" id="toggleAddExpBtn">+ Record Expense</button>
        </div>

        <!-- Add Expense Box -->
        <div id="addExpenseBox" style="display: none; padding: 1.25rem; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <form id="recordExpenseForm">
            <div class="form-grid-3">
              <div class="form-group">
                <label for="expCategory">Category *</label>
                <select id="expCategory" class="form-control" required>
                  <option value="Shop Rent">Shop / Warehouse Rent</option>
                  <option value="Electricity Bill">Electricity & Utilities</option>
                  <option value="Salaries & Wages">Staff Salaries & Wages</option>
                  <option value="Transportation & Freight">Transportation & Freight</option>
                  <option value="Printing & Stationery">Printing & Stationery</option>
                  <option value="Tea & Refreshments">Tea & Refreshments</option>
                  <option value="Repair & Maintenance">Repair & Maintenance</option>
                  <option value="Other Expenses">Other Misc Expenses</option>
                </select>
              </div>
              <div class="form-group">
                <label for="expDate">Date *</label>
                <input type="date" id="expDate" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
              </div>
              <div class="form-group">
                <label for="expAmount">Amount (₹) *</label>
                <input type="number" id="expAmount" class="form-control" step="0.01" min="1" required placeholder="0.00">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="expMode">Payment Mode *</label>
                <select id="expMode" class="form-control">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (HDFC Bank)</option>
                  <option value="UPI">UPI Payment</option>
                </select>
              </div>
              <div class="form-group">
                <label for="expDesc">Description / Notes</label>
                <input type="text" id="expDesc" class="form-control" placeholder="e.g. Paid to building owner">
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
              <button type="button" class="btn btn-secondary btn-sm" id="cancelExpBtn">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save Expense</button>
            </div>
          </form>
        </div>

        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Voucher ID</th>
                  <th>Date</th>
                  <th>Expense Category</th>
                  <th>Description</th>
                  <th>Payment Mode</th>
                  <th class="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${expenses.length === 0 ? `
                  <tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">No expenses recorded yet.</td></tr>
                ` : expenses.map(e => `
                  <tr>
                    <td class="table-mono text-muted"><strong>${e.id}</strong></td>
                    <td>${e.date}</td>
                    <td><span class="badge badge-secondary">${e.category}</span></td>
                    <td>${e.description}</td>
                    <td>${e.paymentMode}</td>
                    <td class="text-right table-mono text-danger"><strong>₹${Number(e.amount).toFixed(2)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Handlers
    const box = container.querySelector('#addExpenseBox');
    container.querySelector('#toggleAddExpBtn').addEventListener('click', () => {
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });
    container.querySelector('#cancelExpBtn').addEventListener('click', () => {
      box.style.display = 'none';
    });

    container.querySelector('#recordExpenseForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const category = container.querySelector('#expCategory').value;
      const date = container.querySelector('#expDate').value;
      const amount = Number(container.querySelector('#expAmount').value);
      const paymentMode = container.querySelector('#expMode').value;
      const description = container.querySelector('#expDesc').value;

      window.Store.addExpense({ category, date, amount, paymentMode, description });
      window.App.showToast(`Expense of ₹${amount} logged under ${category}.`, 'success');
      window.ExpensesModule.render(container);
    });
  }
};
