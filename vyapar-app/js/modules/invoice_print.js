// ========================================================
// Vyapar Pro - Professional GST Invoice Renderer & QR Engine
// ========================================================

window.InvoicePrint = {
  // Generate an authentic UPI payment QR Code via SVG
  getUPIQrSvg(upiId, payeeName, amount, invoiceNum) {
    const upiUri = encodeURIComponent(`upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&cu=INR&tn=Invoice%20${invoiceNum}`);
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${upiUri}&margin=0`;
  },

  // Helper to format currency in Indian format
  formatINR(val) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(val) || 0);
  },

  // Number to Indian English words converter for Tax Invoices
  numberToWords(n) {
    n = Math.round(Number(n) || 0);
    if (n === 0) return "Zero Rupees Only";
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(num) {
      if ((num = num.toString()).length > 9) return 'Overflow';
      let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return '';
      let str = '';
      str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
      str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
      str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
      str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
      str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
      return str;
    }

    return inWords(n).trim() + " Rupees Only";
  },

  // Render Full-Fidelity Tax Invoice HTML
  render(invoice, business, party) {
    const isDelhiInterState = !invoice.placeOfSupply.includes("07");
    const qrUrl = this.getUPIQrSvg(business.upiId, business.name, invoice.total, invoice.number);

    let rowsHtml = '';
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    invoice.items.forEach((item, idx) => {
      const taxable = item.qty * item.rate;
      totalTaxable += taxable;
      const gstPercent = item.gstRate || 0;
      const taxAmount = (taxable * gstPercent) / 100;

      let taxCell = '';
      if (isDelhiInterState) {
        totalIgst += taxAmount;
        taxCell = `<td class="text-right">${gstPercent}% (₹${taxAmount.toFixed(2)})</td>`;
      } else {
        const halfRate = gstPercent / 2;
        const halfTax = taxAmount / 2;
        totalCgst += halfTax;
        totalSgst += halfTax;
        taxCell = `<td class="text-right">${halfRate}% CGST + ${halfRate}% SGST<br><span class="text-muted">(₹${taxAmount.toFixed(2)})</span></td>`;
      }

      rowsHtml += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>
            <strong>${item.name}</strong>
          </td>
          <td class="text-center table-mono">${item.hsn || '-'}</td>
          <td class="text-center table-mono">${item.qty}</td>
          <td class="text-right table-mono">₹${Number(item.rate).toFixed(2)}</td>
          <td class="text-right table-mono">₹${taxable.toFixed(2)}</td>
          ${taxCell}
          <td class="text-right table-mono"><strong>₹${(taxable + taxAmount).toFixed(2)}</strong></td>
        </tr>
      `;
    });

    return `
      <div class="invoice-paper" id="invoicePrintRoot">
        <!-- Invoice Top Header -->
        <div class="inv-doc-header">
          <div class="inv-company-brand">
            <h1>${business.name}</h1>
            <div class="inv-company-meta">
              <p>${business.address}, ${business.city}, ${business.state} - ${business.pincode}</p>
              <p><strong>GSTIN:</strong> ${business.gstin} &nbsp;|&nbsp; <strong>Phone:</strong> ${business.phone}</p>
              <p><strong>Email:</strong> ${business.email}</p>
            </div>
          </div>
          <div class="inv-doc-type-badge">
            <div class="inv-type-title">TAX INVOICE</div>
            <p style="font-size: 11px; color: #64748b; font-weight: 600;">(Original for Recipient)</p>
          </div>
        </div>

        <!-- Meta Information Cards -->
        <div class="inv-meta-grid">
          <div class="inv-meta-box">
            <h4>Billed To (Customer Details)</h4>
            <p style="font-size: 14px; font-weight: 700; color: #0f172a;">${party ? party.name : invoice.partyName}</p>
            <p>${party && party.address ? party.address : 'Address: On Record'}</p>
            <p><strong>Phone:</strong> ${party ? party.phone : '-'}</p>
            <p><strong>GSTIN:</strong> ${party && party.gstin ? party.gstin : 'Unregistered Consumer'}</p>
            <p><strong>Place of Supply:</strong> ${invoice.placeOfSupply}</p>
          </div>

          <div class="inv-meta-box">
            <h4>Invoice & Payment Details</h4>
            <p><strong>Invoice No:</strong> <span class="table-mono" style="font-weight: 700; color: #ed1a3b;">${invoice.number}</span></p>
            <p><strong>Date of Issue:</strong> ${invoice.date}</p>
            <p><strong>Payment Mode:</strong> ${invoice.paymentMode}</p>
            <p><strong>Status:</strong> <span class="badge ${invoice.balance <= 0 ? 'badge-success' : 'badge-danger'}">${invoice.balance <= 0 ? 'FULLY PAID' : 'PAYMENT PENDING'}</span></p>
          </div>
        </div>

        <!-- Items Table -->
        <table class="inv-table-print">
          <thead>
            <tr>
              <th style="width: 5%">#</th>
              <th style="width: 30%">Description of Goods</th>
              <th style="width: 10%">HSN/SAC</th>
              <th style="width: 8%">Qty</th>
              <th style="width: 12%">Rate (₹)</th>
              <th style="width: 12%">Taxable (₹)</th>
              <th style="width: 13%">GST Rate</th>
              <th style="width: 10%">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Amount In Words -->
        <div style="background: #f8fafc; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 15px;">
          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Amount in Words: </span>
          <span style="font-weight: 600; font-size: 12px; color: #0f172a;">${this.numberToWords(invoice.total)}</span>
        </div>

        <!-- Bottom Grid: Bank + Summary -->
        <div class="inv-footer-wrap">
          <div>
            <div class="inv-qr-bank-block">
              <div class="inv-qr-code">
                <img src="${qrUrl}" alt="UPI Payment QR Code" width="90" height="90">
              </div>
              <div class="inv-bank-details">
                <strong style="color: #0f172a; font-size: 12px;">Bank Transfer / UPI Details:</strong>
                <p><strong>Bank:</strong> ${business.bankName}</p>
                <p><strong>A/C No:</strong> <span class="table-mono">${business.accountNumber}</span></p>
                <p><strong>IFSC:</strong> <span class="table-mono">${business.ifsc}</span></p>
                <p><strong>UPI ID:</strong> <span class="table-mono" style="color: #ed1a3b;">${business.upiId}</span></p>
              </div>
            </div>

            <div style="margin-top: 15px; font-size: 11px; color: #64748b; line-height: 1.4;">
              <strong>Terms & Conditions:</strong><br>
              ${business.terms.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div class="invoice-summary-card">
            <div class="summary-line">
              <span>Taxable Amount:</span>
              <span class="table-mono">₹${totalTaxable.toFixed(2)}</span>
            </div>
            ${isDelhiInterState ? `
              <div class="summary-line">
                <span>IGST Total:</span>
                <span class="table-mono">₹${totalIgst.toFixed(2)}</span>
              </div>
            ` : `
              <div class="summary-line">
                <span>CGST Total:</span>
                <span class="table-mono">₹${totalCgst.toFixed(2)}</span>
              </div>
              <div class="summary-line">
                <span>SGST Total:</span>
                <span class="table-mono">₹${totalSgst.toFixed(2)}</span>
              </div>
            `}
            <div class="summary-line total-line">
              <span>Invoice Total:</span>
              <span class="table-mono text-primary" style="font-size: 1.25rem;">₹${Number(invoice.total).toFixed(2)}</span>
            </div>
            <div class="summary-line">
              <span>Amount Received:</span>
              <span class="table-mono text-success">₹${Number(invoice.paid).toFixed(2)}</span>
            </div>
            <div class="summary-line balance-line" style="border-top: 1px solid #e2e8f0; padding-top: 5px;">
              <span>Balance Due:</span>
              <span class="table-mono text-danger">₹${Number(invoice.balance).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Signature Block -->
        <div class="inv-sign-block">
          <p>For <strong>${business.name}</strong></p>
          <div class="inv-sign-line"></div>
          <p style="color: #64748b; font-size: 11px;">Authorised Signatory</p>
        </div>
      </div>
    `;
  }
};
