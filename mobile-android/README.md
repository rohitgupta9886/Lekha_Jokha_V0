# Lekha Jokha - Dedicated Mobile Android Frontend

A completely new, independent Android mobile frontend built from scratch for **Lekha Jokha**, India's leading GST billing, accounting, and multi-business management platform for MSMEs.

---

## 1. Architectural Independence

- **Zero WebView:** Does not embed desktop web pages or use browser wrappers.
- **Dedicated Mobile UX:** Built from zero with native touch-first components, bottom navigation, card-based metric overviews, and mobile dialogs.
- **Independent Directory:** Located in `mobile-android/` with its own configuration, design tokens, API client, navigation, and state models.
- **Shared Backend API:** Seamlessly connects to the live production Node.js core backend (`/api/v1/auth`, `/api/v1/businesses`, `/api/v1/sales`, `/api/v1/purchases`, `/api/v1/items`, `/api/v1/parties`, `/api/v1/expenses`, `/api/v1/subscription`, `/api/v1/gst/verify`).
- **Protected Web App:** The existing web application remains 100% intact and unaffected.

---

## 2. Implemented Mobile Capabilities

1. **Authentication & Onboarding:**
   - Fast 4-digit PIN authentication (`POST /api/v1/auth/login`).
   - New business and subscriber registration (`POST /api/v1/auth/register`).
   - Secure token storage with automatic session expiration handling.

2. **Mobile Home Dashboard:**
   - Active business switcher header.
   - Financial KPI cards: Today's Sales, Purchases, Receivables ("You'll Get"), Payables ("You'll Pay"), Cash & Bank Balance, and Stock Valuation.
   - Low-stock inventory alert banners with immediate adjustment links.
   - Recent transaction audit feed.
   - Quick Action touch shortcuts (+ Sale, + Purchase, + Item, + Party).

3. **Sales & Tax Invoicing:**
   - Fast touch invoice creation with customer picker and multi-item line selector.
   - Real-time GST auto-calculation (CGST, SGST, IGST across 0%, 5%, 12%, 18%, 28%).
   - Partial, full, and credit payment tracking with balance due calculation.
   - WhatsApp document share and PDF/Thermal print preview dialogs.

4. **Purchases & Suppliers:**
   - Purchase bill recording with supplier selector, stock-in quantity updates, and payment logging.
   - Supplier payables tracking and transaction history.

5. **Inventory & Stock Management:**
   - Catalog browsing with barcode, HSN/SAC, category, and real-time stock levels.
   - Modal-based stock adjustment (+ Add / - Reduce) with audit reasons.
   - Low-stock indicators and reorder alerts.

6. **Parties (Customers & Vendors):**
   - Filterable party directory with phone, GSTIN, and state jurisdiction.
   - Instant phone call and WhatsApp statement reminder actions.

7. **Bilingual Support (English & हिंदी):**
   - Instant language switching across all screens without logout.
   - Full Hindi translation dictionary (`TRANSLATIONS.hi`).

8. **SaaS Plan Quotas & Multi-Business:**
   - Free (1 Business), Pro (2 Businesses), Enterprise Max (Up to 5 Businesses).
   - Strict server-side and client-side quota validation.
   - Instant in-app subscription upgrade workflow.

9. **Official Indian GSTIN Verification Tool:**
   - Validates 15-character GSTIN structure, state code, PAN, and active taxpayer status.

---

## 3. Running Tests

```bash
cd mobile-android
node --test tests/*.test.js
```
