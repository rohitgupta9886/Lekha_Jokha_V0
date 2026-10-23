// ========================================================
// LekhaJokha - Settings & Business Profile Module
// ========================================================

window.SettingsModule = {
  render(container) {
    const business = window.Store.getBusiness();

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span>Company Profile & Invoicing Settings</span>
          </h2>
        </div>

        <div class="card-body">
          <form id="businessProfileForm">
            <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem;">1. General Business Information</h3>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="setBizName">Business / Trade Name *</label>
                <input type="text" id="setBizName" class="form-control" required value="${business.name}">
              </div>
              <div class="form-group">
                <label for="setBizTagline">Business Tagline / Subtitle</label>
                <input type="text" id="setBizTagline" class="form-control" value="${business.tagline || ''}">
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label for="setGstin">GSTIN Number *</label>
                <input type="text" id="setGstin" class="form-control" required value="${business.gstin}">
              </div>
              <div class="form-group">
                <label for="setPhone">Business Phone / WhatsApp *</label>
                <input type="text" id="setPhone" class="form-control" required value="${business.phone}">
              </div>
              <div class="form-group">
                <label for="setEmail">Email Address</label>
                <input type="email" id="setEmail" class="form-control" value="${business.email}">
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label for="setAddress">Street Address *</label>
                <input type="text" id="setAddress" class="form-control" required value="${business.address}">
              </div>
              <div class="form-group">
                <label for="setCity">City</label>
                <input type="text" id="setCity" class="form-control" value="${business.city}">
              </div>
              <div class="form-group">
                <label for="setPincode">PIN Code</label>
                <input type="text" id="setPincode" class="form-control" value="${business.pincode}">
              </div>
            </div>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;">

            <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem;">2. Bank Transfer & UPI Collection Setup</h3>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="setBankName">Bank Name</label>
                <input type="text" id="setBankName" class="form-control" value="${business.bankName}">
              </div>
              <div class="form-group">
                <label for="setAccountNo">Account Number</label>
                <input type="text" id="setAccountNo" class="form-control" value="${business.accountNumber}">
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label for="setIfsc">IFSC Code</label>
                <input type="text" id="setIfsc" class="form-control" value="${business.ifsc}">
              </div>
              <div class="form-group">
                <label for="setUpiId">UPI ID (For QR Code Payments) *</label>
                <input type="text" id="setUpiId" class="form-control" required value="${business.upiId}">
              </div>
            </div>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;">

            <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem;" data-i18n="set.lang_region">
              3. Language & Region / भाषा एवं क्षेत्र
            </h3>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="setAppLang" data-i18n="set.app_lang">Application Language (एप्लिकेशन भाषा)</label>
                <select id="setAppLang" class="form-control" style="font-weight: 600;">
                  <option value="en" ${(window.i18n && window.i18n.getLanguage() === 'en') ? 'selected' : ''}>English (Indian Business English)</option>
                  <option value="hi" ${(window.i18n && window.i18n.getLanguage() === 'hi') ? 'selected' : ''}>हिंदी (Hindi - लेखा जोखा एवं बहीखाता)</option>
                </select>
                <small style="color:var(--text-muted);margin-top:4px;display:block;">
                  Changes apply immediately across all navigation, billing screens, and reports.
                </small>
              </div>

              <div class="form-group">
                <label>Currency & Financial Number Format</label>
                <input type="text" class="form-control" value="INR (₹) - Indian Lakhs/Crores (1,00,000)" readonly style="background:#f8fafc;">
              </div>
            </div>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;">

            <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">
              4. Google Gemini AI & Guardrails Architecture
            </h3>
            <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 1rem;">
              Powers AI Voice Billing, Financial Advisory Copilot, Receipt OCR, and WhatsApp Payment Reminders.
            </p>

            <div class="form-grid-2">
              <div class="form-group">
                <label for="setGeminiApiKey">Google Gemini API Key *</label>
                <div style="display:flex; gap:0.5rem;">
                  <input type="password" id="setGeminiApiKey" class="form-control" value="${window.GeminiService ? window.GeminiService.getApiKey() : ''}" placeholder="Enter Google Gemini API Key">
                  <button type="button" class="btn btn-outline" id="toggleSettingsApiKeyVis" style="padding:0.4rem 0.75rem;">👁️</button>
                </div>
              </div>

              <div class="form-group">
                <label for="setGeminiModel">AI Model</label>
                <select id="setGeminiModel" class="form-control" style="font-weight: 600;">
                  <option value="gemini-3.8-flash" ${(window.GeminiService && window.GeminiService.getSelectedModel() === 'gemini-3.8-flash') ? 'selected' : ''}>gemini-3.8-flash (Recommended State-of-the-Art)</option>
                  <option value="gemini-3.5-flash" ${(window.GeminiService && window.GeminiService.getSelectedModel() === 'gemini-3.5-flash') ? 'selected' : ''}>gemini-3.5-flash (High-Speed Fallback)</option>
                  <option value="gemini-flash-latest" ${(window.GeminiService && window.GeminiService.getSelectedModel() === 'gemini-flash-latest') ? 'selected' : ''}>gemini-flash-latest (Auto-Updating)</option>
                </select>
              </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 1rem; margin: 1rem 0;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
                <label style="font-weight: 700; margin: 0;">Active Multi-Layer Guardrails</label>
                <span class="badge badge-success">5 Guardrails Active</span>
              </div>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.5rem; font-size: 12.5px;">
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                  <input type="checkbox" id="setGuardSafety" checked>
                  <span>🛡️ <b>Safety Guardrail:</b> Block Harassment & Harm</span>
                </label>
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                  <input type="checkbox" id="setGuardScope" checked>
                  <span>🛡️ <b>Domain Scope:</b> MSME Accounting & GST Only</span>
                </label>
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                  <input type="checkbox" id="setGuardInjection" checked>
                  <span>🛡️ <b>Anti-Injection:</b> Defend Against Prompt Overrides</span>
                </label>
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                  <input type="checkbox" id="setGuardSchema" checked>
                  <span>🛡️ <b>Schema Validation:</b> Strict JSON & Bounds Check</span>
                </label>
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                  <input type="checkbox" id="setGuardDisclaimer" checked>
                  <span>🛡️ <b>Disclaimer:</b> Statutory CA Verification Note</span>
                </label>
              </div>
              <div style="margin-top: 0.75rem; display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm btn-outline" id="setTestAiConnectionBtn">⚡ Test Connection to Google Gemini</button>
                <span id="setAiConnStatus" style="font-size: 12px;"></span>
              </div>
            </div>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;">

            <div class="form-group">
              <label for="setTerms">Default Invoice Terms & Conditions</label>
              <textarea id="setTerms" class="form-control" rows="3">${business.terms}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
              <button type="submit" class="btn btn-primary">Save Business Settings</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Settings Sub-Card: Data Import & Migration Shortcut -->
      <div class="card" style="margin-top: 1.5rem; border-left: 4px solid var(--primary);">
        <div class="card-body" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div>
            <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:0.25rem;">
              🚀 Switch from Another Software / Data Migration
            </h3>
            <p style="color:var(--text-muted); font-size:13px; margin:0; max-width:600px;">
              Migrate your existing customers, suppliers, inventory stock, and historical vouchers from Tally ERP 9/TallyPrime, LekhaJokha, Khatabook, Zoho Books, or Excel files.
            </p>
          </div>
          <a href="#migration" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:0.5rem;">
            <span>Open Migration Center</span>
            <span>&rarr;</span>
          </a>
        </div>
      </div>
    `;

    // Language Change Listener
    const langSelect = container.querySelector('#setAppLang');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        if (window.i18n) {
          window.i18n.setLanguage(e.target.value);
          window.App.showToast(`Language switched to ${e.target.value === 'hi' ? 'हिंदी' : 'English'}!`, 'success');
        }
      });
    }

    // AI Key Visibility Toggle
    const toggleKeyBtn = container.querySelector('#toggleSettingsApiKeyVis');
    const apiKeyInput = container.querySelector('#setGeminiApiKey');
    if (toggleKeyBtn && apiKeyInput) {
      toggleKeyBtn.onclick = () => {
        apiKeyInput.type = (apiKeyInput.type === 'password') ? 'text' : 'password';
      };
    }

    // AI Live Test Connection
    const testAiBtn = container.querySelector('#setTestAiConnectionBtn');
    const connStatus = container.querySelector('#setAiConnStatus');
    if (testAiBtn && connStatus) {
      testAiBtn.onclick = async () => {
        const testKey = apiKeyInput.value.trim();
        const testModel = container.querySelector('#setGeminiModel').value;
        connStatus.innerHTML = `<span style="color:#0284c7;">Testing connection to ${testModel}...</span>`;
        try {
          if (window.GeminiService) {
            const res = await window.GeminiService.testConnection(testKey, testModel);
            if (res.success) {
              connStatus.innerHTML = `<b style="color:#059669;">🟢 Connected! (${res.model}, ${res.elapsed}ms)</b>`;
            } else {
              connStatus.innerHTML = `<b style="color:#dc2626;">🔴 Failed: ${res.error}</b>`;
            }
          }
        } catch (e) {
          connStatus.innerHTML = `<b style="color:#dc2626;">🔴 Error: ${e.message}</b>`;
        }
      };
    }

    // Handler
    container.querySelector('#businessProfileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        name: container.querySelector('#setBizName').value,
        tagline: container.querySelector('#setBizTagline').value,
        gstin: container.querySelector('#setGstin').value,
        phone: container.querySelector('#setPhone').value,
        email: container.querySelector('#setEmail').value,
        address: container.querySelector('#setAddress').value,
        city: container.querySelector('#setCity').value,
        pincode: container.querySelector('#setPincode').value,
        bankName: container.querySelector('#setBankName').value,
        accountNumber: container.querySelector('#setAccountNo').value,
        ifsc: container.querySelector('#setIfsc').value,
        upiId: container.querySelector('#setUpiId').value,
        terms: container.querySelector('#setTerms').value
      };

      // Save AI & Guardrail settings
      if (window.GeminiService) {
        const newKey = container.querySelector('#setGeminiApiKey').value.trim();
        const newModel = container.querySelector('#setGeminiModel').value;
        window.GeminiService.setApiKey(newKey);
        window.GeminiService.setSelectedModel(newModel);
        window.GeminiService.setGuardrailsConfig({
          enabled: true,
          blockHarmfulContent: container.querySelector('#setGuardSafety').checked,
          enforceAccountingScope: container.querySelector('#setGuardScope').checked,
          filterPromptInjections: container.querySelector('#setGuardInjection').checked,
          validateSchemas: container.querySelector('#setGuardSchema').checked,
          addRegulatoryDisclaimer: container.querySelector('#setGuardDisclaimer').checked
        });
      }

      window.Store.updateBusiness(updated);
      document.getElementById('sidebarCompany').innerText = updated.name;
      window.App.showToast('Settings & AI Guardrails configuration saved successfully!', 'success');
    });
  }
};
