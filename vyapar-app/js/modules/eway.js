// ========================================================
// Vyapar Pro - GST e-Way Bill Management & Generator Engine
// Compliant with Government of India (NIC) e-Way Bill Portal Standards
// ========================================================

window.EwayModule = {
  render(container) {
    const ewayBills = window.Store.getEwayBills();
    const activeEwb = ewayBills.filter(e => e.status === 'Active');
    const totalVal = ewayBills.reduce((acc, e) => acc + (Number(e.totalValue) || 0), 0);

    container.innerHTML = `
      <!-- Top Metrics Summary -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-sales">
          <div class="kpi-header">
            <span class="kpi-label">Active e-Way Bills</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </div>
          </div>
          <div class="kpi-value text-success">${activeEwb.length} Active</div>
          <div class="kpi-footer"><span>Goods in Transit</span></div>
        </div>

        <div class="kpi-card kpi-collect">
          <div class="kpi-header">
            <span class="kpi-label">Total Consignment Value</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
          </div>
          <div class="kpi-value text-primary">₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div class="kpi-footer"><span>Consolidated Cargo Worth</span></div>
        </div>

        <div class="kpi-card kpi-stock">
          <div class="kpi-header">
            <span class="kpi-label">Transport Compliance</span>
            <div class="kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
          </div>
          <div class="kpi-value text-info">Part A + B Valid</div>
          <div class="kpi-footer"><span>NIC Portal Ready</span></div>
        </div>
      </div>

      <!-- e-Way Bills Data Table Card -->
      <div class="card">
        <div class="card-header">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <h2 class="card-title">Generated GST e-Way Bills</h2>
            <span class="badge badge-info">${ewayBills.length} records</span>
          </div>
          <div class="table-actions">
            <input type="text" class="form-control form-control-sm" id="searchEwayInput" placeholder="Search by EBN, Vehicle or Party..." style="width:240px;">
            <button class="btn btn-primary btn-sm" id="createNewEwayBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>+ Generate e-Way Bill</span>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table" id="ewayBillsTable">
            <thead>
              <tr>
                <th>e-Way Bill No.</th>
                <th>Gen. Date</th>
                <th>Valid Until</th>
                <th>Party & Destination</th>
                <th>Vehicle No.</th>
                <th>Invoice Ref</th>
                <th>Value (₹)</th>
                <th>Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${ewayBills.length === 0 ? `
                <tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--text-muted);">No e-Way bills generated yet. Click "+ Generate e-Way Bill" to create one.</td></tr>
              ` : ewayBills.map(e => `
                <tr>
                  <td>
                    <div style="font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--navy-900);">
                      ${e.ewayNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                    </div>
                    <span style="font-size:11px;color:var(--text-muted);">${e.transporterName || 'Self Transport'}</span>
                  </td>
                  <td>${e.ewayDate}</td>
                  <td>
                    <span style="font-weight:600;color:${e.status === 'Cancelled' ? 'var(--text-muted)' : 'var(--warning-text)'};">
                      ${e.validUntil}
                    </span>
                  </td>
                  <td>
                    <div style="font-weight:600;">${e.partyName}</div>
                    <span style="font-size:11px;color:var(--text-muted);">${e.placeOfDelivery}</span>
                  </td>
                  <td>
                    <span class="mono-val" style="padding:2px 6px;background:var(--bg-app);border:1px solid var(--border-subtle);border-radius:4px;font-weight:700;">
                      ${e.vehicleNumber || 'N/A'}
                    </span>
                    <div style="font-size:10px;color:var(--text-muted);">${e.distanceKm || 20} KM (${e.transportMode || 'Road'})</div>
                  </td>
                  <td><a href="#sales" class="mono-val text-primary" style="text-decoration:none;font-weight:600;">${e.invoiceNumber || 'Manual'}</a></td>
                  <td class="mono-val" style="font-weight:700;">₹${Number(e.totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span class="badge ${e.status === 'Active' ? 'badge-success' : 'badge-danger'}">
                      ${e.status}
                    </span>
                  </td>
                  <td style="text-align:right;">
                    <div style="display:flex;gap:0.35rem;justify-content:flex-end;">
                      <button class="btn btn-sm btn-outline view-eway-btn" data-id="${e.id}" title="Print Official e-Way Bill Slip">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        <span>Slip</span>
                      </button>
                      <button class="btn btn-sm btn-outline export-json-btn" data-id="${e.id}" title="Export NIC Bulk Upload JSON">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        <span>JSON</span>
                      </button>
                      ${e.status === 'Active' ? `
                        <button class="btn btn-sm btn-outline text-danger cancel-eway-btn" data-id="${e.id}" title="Cancel e-Way Bill">&times;</button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind Table Events
    document.getElementById('createNewEwayBtn').onclick = () => this.openCreateModal();

    container.querySelectorAll('.view-eway-btn').forEach(btn => {
      btn.onclick = () => this.openPrintSlipModal(btn.getAttribute('data-id'));
    });

    container.querySelectorAll('.export-json-btn').forEach(btn => {
      btn.onclick = () => this.downloadNicJson(btn.getAttribute('data-id'));
    });

    container.querySelectorAll('.cancel-eway-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        if (confirm("Are you sure you want to cancel this e-Way Bill on record?")) {
          window.Store.cancelEwayBill(id, "Cancelled by user");
          if (window.app && window.app.showToast) window.app.showToast("e-Way Bill marked as Cancelled", "warning");
          this.render(container);
        }
      };
    });

    // Search filter
    const searchInput = document.getElementById('searchEwayInput');
    searchInput.oninput = () => {
      const q = searchInput.value.toLowerCase().trim();
      const rows = container.querySelectorAll('#ewayBillsTable tbody tr');
      rows.forEach(r => {
        r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
    };
  },

  // Open the e-Way Bill Generator Modal
  openCreateModal(prefillInvoiceId = null) {
    let modal = document.getElementById('ewayGenerateModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'ewayGenerateModal';
      document.body.appendChild(modal);
    }

    const sales = window.Store.getSales();
    const biz = window.Store.getBusiness();
    const parties = window.Store.getParties();

    let prefillSale = prefillInvoiceId ? window.Store.getSale(prefillInvoiceId) : null;

    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="brand-badge" style="background:#10b981;color:#fff;">GOVT OF INDIA (NIC)</span>
            <h2 class="modal-title">Generate GST e-Way Bill</h2>
          </div>
          <button class="modal-close-btn" id="closeEwayModalBtn">&times;</button>
        </div>
        <div class="modal-body">
          <form id="ewayGenerateForm">
            <!-- Section 1: Transaction & Party Links -->
            <div style="font-weight:700;font-size:13px;color:var(--text-muted);margin-bottom:0.75rem;text-transform:uppercase;">Part A: Consignment & Invoicing Details</div>
            <div class="form-grid-3">
              <div class="form-group">
                <label>Link with Sale Invoice</label>
                <select id="ewbInvoiceSelect" class="form-control">
                  <option value="">-- Manual e-Way Bill --</option>
                  ${sales.map(s => `
                    <option value="${s.id}" ${prefillSale && prefillSale.id === s.id ? 'selected' : ''}>
                      ${s.number} - ${s.partyName} (₹${s.total})
                    </option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Supply Sub-Type *</label>
                <select id="ewbSupplyType" class="form-control" required>
                  <option value="Outward - Supply">Outward - Regular Supply</option>
                  <option value="Outward - Export">Outward - Export</option>
                  <option value="Outward - Job Work">Outward - Job Work</option>
                  <option value="Outward - Recipient Unknown">Outward - For Exhibition / Fair</option>
                </select>
              </div>
              <div class="form-group">
                <label>Document Type</label>
                <select id="ewbDocType" class="form-control">
                  <option value="Tax Invoice">Tax Invoice</option>
                  <option value="Bill of Supply">Bill of Supply</option>
                  <option value="Delivery Challan">Delivery Challan</option>
                </select>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label>Consignor / Supplier (FROM)</label>
                <input type="text" class="form-control" value="${biz.name} (${biz.gstin})" readonly>
              </div>
              <div class="form-group">
                <label>Consignee / Recipient (TO) *</label>
                <input type="text" id="ewbPartyName" class="form-control" value="${prefillSale ? prefillSale.partyName : ''}" placeholder="Customer / Party Name" required>
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label>Recipient GSTIN</label>
                <input type="text" id="ewbPartyGstin" class="form-control mono-val" value="${prefillSale ? (window.Store.getParty(prefillSale.partyId)?.gstin || 'URP') : 'URP'}" placeholder="07AAAAA0000A1Z5 / URP">
              </div>
              <div class="form-group">
                <label>Place of Delivery (City / State) *</label>
                <input type="text" id="ewbPlaceOfDelivery" class="form-control" value="${prefillSale ? prefillSale.placeOfSupply : 'Delhi'}" required>
              </div>
              <div class="form-group">
                <label>Consignment Value (₹) *</label>
                <input type="number" id="ewbTotalValue" class="form-control mono-val" value="${prefillSale ? prefillSale.total : '50000'}" required step="0.01">
              </div>
            </div>

            <!-- Section 2: Transporter & Vehicle Details -->
            <div style="font-weight:700;font-size:13px;color:var(--text-muted);margin:1.25rem 0 0.75rem 0;text-transform:uppercase;">Part B: Transporter & Transportation Details</div>
            <div class="form-grid-3">
              <div class="form-group">
                <label>Transporter ID (TRANSIN / GSTIN)</label>
                <input type="text" id="ewbTransporterId" class="form-control mono-val" placeholder="07AAACT1234M1Z2" value="07AAACT1234M1Z2">
              </div>
              <div class="form-group">
                <label>Transporter Name</label>
                <input type="text" id="ewbTransporterName" class="form-control" placeholder="Express Freight Logistics" value="Delhi Roadlines Logistics">
              </div>
              <div class="form-group">
                <label>Transport Mode *</label>
                <select id="ewbTransportMode" class="form-control">
                  <option value="Road">Road</option>
                  <option value="Rail">Rail</option>
                  <option value="Air">Air</option>
                  <option value="Ship">Ship</option>
                </select>
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label>Vehicle Number *</label>
                <input type="text" id="ewbVehicleNumber" class="form-control mono-val" placeholder="DL-1L-4421" value="DL-1L-4421" required style="text-transform:uppercase;">
              </div>
              <div class="form-group">
                <label>Approx Distance (KM) *</label>
                <input type="number" id="ewbDistanceKm" class="form-control mono-val" value="45" required min="1">
              </div>
              <div class="form-group">
                <label>Transport Doc / LR No.</label>
                <input type="text" id="ewbTransportDocNo" class="form-control mono-val" placeholder="LR-10294" value="LR-98421">
              </div>
            </div>

            <div class="modal-footer" style="padding-left:0;padding-right:0;padding-bottom:0;">
              <button type="button" class="btn btn-secondary" id="cancelEwayBtn">Cancel</button>
              <button type="submit" class="btn btn-primary" id="saveEwayBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span>Generate Official e-Way Bill</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('active');

    // Handle invoice dropdown change to prefill
    const invoiceSelect = document.getElementById('ewbInvoiceSelect');
    invoiceSelect.onchange = () => {
      const invId = invoiceSelect.value;
      if (invId) {
        const s = window.Store.getSale(invId);
        if (s) {
          document.getElementById('ewbPartyName').value = s.partyName;
          document.getElementById('ewbTotalValue').value = s.total;
          document.getElementById('ewbPlaceOfDelivery').value = s.placeOfSupply;
          const p = window.Store.getParty(s.partyId);
          if (p && p.gstin) {
            document.getElementById('ewbPartyGstin').value = p.gstin;
          }
        }
      }
    };

    const closeModal = () => modal.classList.remove('active');
    document.getElementById('closeEwayModalBtn').onclick = closeModal;
    document.getElementById('cancelEwayBtn').onclick = closeModal;

    // Form submit
    document.getElementById('ewayGenerateForm').onsubmit = (e) => {
      e.preventDefault();
      const newEwb = window.Store.addEwayBill({
        invoiceNumber: invoiceSelect.value || null,
        supplyType: document.getElementById('ewbSupplyType').value,
        docType: document.getElementById('ewbDocType').value,
        partyName: document.getElementById('ewbPartyName').value,
        partyGstin: document.getElementById('ewbPartyGstin').value || 'URP',
        placeOfDelivery: document.getElementById('ewbPlaceOfDelivery').value,
        totalValue: Number(document.getElementById('ewbTotalValue').value) || 0,
        transporterId: document.getElementById('ewbTransporterId').value,
        transporterName: document.getElementById('ewbTransporterName').value,
        transportMode: document.getElementById('ewbTransportMode').value,
        vehicleNumber: document.getElementById('ewbVehicleNumber').value.toUpperCase(),
        distanceKm: Number(document.getElementById('ewbDistanceKm').value) || 20,
        transportDocNo: document.getElementById('ewbTransportDocNo').value
      });

      closeModal();
      if (window.app && window.app.showToast) {
        window.app.showToast(`e-Way Bill #${newEwb.ewayNumber} generated successfully!`, 'success');
      }

      // If user is on #eway view, re-render
      if (window.location.hash === '#eway') {
        const container = document.getElementById('viewContainer');
        if (container) this.render(container);
      }

      // Open print slip modal automatically
      this.openPrintSlipModal(newEwb.id);
    };
  },

  // Open Government-Format Printable e-Way Bill Slip Modal
  openPrintSlipModal(ewbId) {
    const ewb = window.Store.getEwayBill(ewbId);
    if (!ewb) return;

    const biz = window.Store.getBusiness();

    let modal = document.getElementById('ewayPrintModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'ewayPrintModal';
      document.body.appendChild(modal);
    }

    const barcodeSvg = window.BarcodeModule ? window.BarcodeModule.generateBarcodeSvg(ewb.ewayNumber, 280, 65) : '';

    modal.innerHTML = `
      <div class="modal-dialog modal-xl">
        <div class="modal-header no-print">
          <div class="modal-title-group">
            <span class="brand-badge" style="background:#059669;color:#fff;">OFFICIAL SLIP</span>
            <h2 class="modal-title">GST e-Way Bill Printout</h2>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-outline btn-sm" id="downloadEwbJsonBtn">Download NIC JSON</button>
            <button class="btn btn-primary btn-sm" id="printEwbSlipBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              <span>Print Slip (PDF)</span>
            </button>
            <button class="modal-close-btn" id="closeEwbPrintBtn">&times;</button>
          </div>
        </div>
        <div class="modal-body printable-area" style="background:#fff;padding:2rem;">
          <!-- Government Form Styling -->
          <div class="ewb-slip-paper" style="border:2px solid #0f172a;padding:1.5rem;font-family:sans-serif;color:#0f172a;">
            <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:0.75rem;margin-bottom:1rem;">
              <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#475569;">GOVERNMENT OF INDIA • GOODS AND SERVICES TAX</div>
              <h1 style="font-size:20px;font-weight:800;margin:4px 0;letter-spacing:0.5px;">e-WAY BILL SYSTEM</h1>
              <div style="font-size:11px;color:#64748b;">(Generated pursuant to Rule 138 of the Central Goods and Services Tax Rules, 2017)</div>
            </div>

            <!-- Top Header & Barcode -->
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #cbd5e1;padding-bottom:1rem;margin-bottom:1rem;">
              <div>
                <div style="font-size:11px;text-transform:uppercase;color:#64748b;">e-Way Bill Number</div>
                <div style="font-size:22px;font-weight:800;font-family:'JetBrains Mono',monospace;letter-spacing:2px;color:#0f172a;">
                  ${ewb.ewayNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                </div>
                <div style="font-size:12px;margin-top:4px;">
                  <b>Generated Date:</b> ${ewb.ewayDate} &nbsp;|&nbsp; <b>Valid Until:</b> <span style="color:#b91c1c;font-weight:700;">${ewb.validUntil}</span>
                </div>
              </div>
              <div style="text-align:right;">
                ${barcodeSvg}
              </div>
            </div>

            <!-- PART A -->
            <div style="background:#f1f5f9;padding:6px 10px;font-weight:800;font-size:13px;border-left:4px solid #ed1a3b;margin-bottom:0.75rem;">
              PART - A (Consignment Information)
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:1rem;">
              <tr>
                <td style="padding:6px;border:1px solid #cbd5e1;width:25%;background:#f8fafc;font-weight:600;">GSTIN of Supplier</td>
                <td style="padding:6px;border:1px solid #cbd5e1;width:25%;font-family:monospace;font-weight:700;">${biz.gstin}</td>
                <td style="padding:6px;border:1px solid #cbd5e1;width:25%;background:#f8fafc;font-weight:600;">GSTIN of Recipient</td>
                <td style="padding:6px;border:1px solid #cbd5e1;width:25%;font-family:monospace;font-weight:700;">${ewb.partyGstin}</td>
              </tr>
              <tr>
                <td style="padding:6px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;">Dispatch From</td>
                <td style="padding:6px;border:1px solid #cbd5e1;">${biz.address}, ${biz.city}</td>
                <td style="padding:6px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;">Place of Delivery</td>
                <td style="padding:6px;border:1px solid #cbd5e1;">${ewb.placeOfDelivery}</td>
              </tr>
              <tr>
                <td style="padding:6px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;">Document No. & Date</td>
                <td style="padding:6px;border:1px solid #cbd5e1;"><b>${ewb.invoiceNumber || 'INV-2026-001'}</b> (${ewb.invoiceDate || ewb.ewayDate.split(' ')[0]})</td>
                <td style="padding:6px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;">Total Taxable Value</td>
                <td style="padding:6px;border:1px solid #cbd5e1;font-weight:700;color:#0f172a;">₹${Number(ewb.totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding:6px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;">HSN / SAC Code</td>
                <td style="padding:6px;border:1px solid #cbd5e1;">1006 / 1514 / 8539</td>
                <td style="padding:6px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;">Reason for Transportation</td>
                <td style="padding:6px;border:1px solid #cbd5e1;">${ewb.supplyType || 'Outward - Supply'}</td>
              </tr>
            </table>

            <!-- PART B -->
            <div style="background:#f1f5f9;padding:6px 10px;font-weight:800;font-size:13px;border-left:4px solid #0284c7;margin-bottom:0.75rem;">
              PART - B (Vehicle & Transporter Details)
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:1.5rem;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:6px;border:1px solid #cbd5e1;text-align:left;">Mode</th>
                  <th style="padding:6px;border:1px solid #cbd5e1;text-align:left;">Vehicle / Conveyance No.</th>
                  <th style="padding:6px;border:1px solid #cbd5e1;text-align:left;">From</th>
                  <th style="padding:6px;border:1px solid #cbd5e1;text-align:left;">Entered Date</th>
                  <th style="padding:6px;border:1px solid #cbd5e1;text-align:left;">Transporter Doc No.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding:6px;border:1px solid #cbd5e1;font-weight:600;">${ewb.transportMode || 'Road'}</td>
                  <td style="padding:6px;border:1px solid #cbd5e1;font-family:monospace;font-weight:800;color:#0f172a;font-size:13px;">${ewb.vehicleNumber}</td>
                  <td style="padding:6px;border:1px solid #cbd5e1;">${biz.city}</td>
                  <td style="padding:6px;border:1px solid #cbd5e1;">${ewb.ewayDate}</td>
                  <td style="padding:6px;border:1px solid #cbd5e1;">${ewb.transportDocNo || 'LR-99824'}</td>
                </tr>
              </tbody>
            </table>

            <div style="display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #e2e8f0;padding-top:1rem;font-size:11px;color:#64748b;">
              <div>
                * This is a computer generated e-Way Bill and does not require physical signature.<br>
                Verification QR: Scannable by GST Mobile Squad and Checking Officers.
              </div>
              <div style="text-align:right;">
                <b>Transporter:</b> ${ewb.transporterName || 'Self Transport'} (${ewb.transporterId || 'N/A'})
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');

    document.getElementById('closeEwbPrintBtn').onclick = () => modal.classList.remove('active');
    document.getElementById('printEwbSlipBtn').onclick = () => window.print();
    document.getElementById('downloadEwbJsonBtn').onclick = () => this.downloadNicJson(ewbId);
  },

  // Export NIC-compliant JSON file for portal bulk upload
  downloadNicJson(ewbId) {
    const ewb = window.Store.getEwayBill(ewbId);
    if (!ewb) return;

    const biz = window.Store.getBusiness();

    const nicPayload = {
      version: "1.0.0521",
      billLists: [
        {
          userGstin: biz.gstin,
          supplyType: "O",
          subSupplyType: "1",
          docType: "INV",
          docNo: ewb.invoiceNumber || "INV-2026-001",
          docDate: ewb.ewayDate.split(' ')[0],
          fromGstin: biz.gstin,
          fromTrdName: biz.name,
          fromAddr1: biz.address,
          fromPlace: biz.city,
          fromPincode: Number(biz.pincode) || 110006,
          fromStateCode: 7,
          toGstin: ewb.partyGstin,
          toTrdName: ewb.partyName,
          toAddr1: ewb.placeOfDelivery,
          toPlace: ewb.placeOfDelivery,
          toPincode: 110085,
          toStateCode: 7,
          totalValue: ewb.totalValue,
          cgstValue: Number((ewb.totalValue * 0.025).toFixed(2)),
          sgstValue: Number((ewb.totalValue * 0.025).toFixed(2)),
          igstValue: 0,
          transporterId: ewb.transporterId,
          transporterName: ewb.transporterName,
          transDocNo: ewb.transportDocNo,
          transDocDate: ewb.ewayDate.split(' ')[0],
          transMode: "1",
          distance: ewb.distanceKm || 30,
          vehicleNo: ewb.vehicleNumber,
          vehicleType: "R"
        }
      ]
    };

    const blob = new Blob([JSON.stringify(nicPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EWB_NIC_${ewb.ewayNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (window.app && window.app.showToast) {
      window.app.showToast(`NIC e-Way Bill JSON downloaded: EWB_NIC_${ewb.ewayNumber}.json`, 'info');
    }
  }
};
