// ==============================================================================
// Vyapar Pro - Internationalization (i18n) Engine
// Comprehensive Bilingual Support: English (EN) & हिंदी (HI)
// Covers Navigation, Dashboards, Invoicing, Inventory, Reports, Settings & Migration
// ==============================================================================

const TRANSLATIONS = {
  en: {
    // Brand & Topbar
    'app.title': 'Lekha Jokha',
    'app.tagline': 'GST Billing, Inventory & Multi-Business Accounting',
    'topbar.search_placeholder': 'Search invoices, parties, items...',
    'topbar.scan_barcode': 'Scan Barcode',
    'topbar.ai_advisor': 'Lekha Jokha AI',
    'topbar.sale_btn': '+ Sale',
    'topbar.purchase_btn': '+ Purchase',
    'topbar.switch_user': 'Switch User',
    'topbar.switch_business': 'Switch Business',
    'topbar.lang_switch': 'हिंदी',

    // Sidebar Navigation
    'nav.main_menu': 'MAIN MENU',
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'TRANSACTIONS',
    'nav.orders': 'Order Management',
    'nav.sales': 'Sale Invoices',
    'nav.purchases': 'Purchase Bills',
    'nav.parties': 'Parties (Customers/Vendors)',
    'nav.eway': 'e-Way Bills (GST)',
    'nav.catalog_money': 'CATALOG & MONEY',
    'nav.items': 'Items & Inventory',
    'nav.cashbank': 'Cash & Bank',
    'nav.expenses': 'Expenses',
    'nav.intelligence': 'INTELLIGENCE & CONFIG',
    'nav.track_salesmen': 'Track Your Salesmen',
    'nav.ai_advisor': 'Lekha Jokha AI Advisor',
    'nav.reports': 'Reports & GST Filing',
    'nav.users': 'Staff & Roles (RBAC)',
    'nav.subscription': 'SaaS Plans & Multi-Biz',
    'nav.migration': 'Data Import & Migration',
    'nav.settings': 'Business Settings',
    'nav.offline_active': 'Offline-First Engine Active',
    'nav.backup': 'Backup',
    'nav.reset': 'Reset',

    // Dashboard
    'dash.title': 'Business Dashboard',
    'dash.subtitle': 'Real-time overview of your finances, sales & stock',
    'dash.to_collect': "You'll Get (Receivable)",
    'dash.to_pay': "You'll Pay (Payable)",
    'dash.cash_bank': 'Cash & Bank Balance',
    'dash.stock_value': 'Stock Valuation (Cost)',
    'dash.total_sales': 'Total Sales Volume',
    'dash.recent_sales': 'Recent Sales Invoices',
    'dash.low_stock': 'Low Stock Inventory Alerts',
    'dash.view_all': 'View All',
    'dash.quick_actions': 'Quick Business Shortcuts',
    'dash.add_customer': '+ Add Customer',
    'dash.add_product': '+ Add Item',
    'dash.create_bill': '+ Create Invoice',
    'dash.record_purchase': '+ Record Purchase',

    // Sales Module
    'sales.title': 'Tax Invoices (GST)',
    'sales.create_invoice': '+ Create Tax Invoice',
    'sales.smart_bill': '✨ AI Smart Bill',
    'sales.search_placeholder': 'Search invoice or party...',
    'sales.tab_invoices': 'Sale Invoices',
    'sales.tab_estimates': 'Estimates & Quotations',
    'sales.tab_returns': 'Sales Returns / Credit Notes',
    'sales.tab_challans': 'Delivery Challans',
    'sales.tab_payments': 'Payment In (Receipts)',
    'sales.th_inv_no': 'Invoice No',
    'sales.th_date': 'Date',
    'sales.th_customer': 'Customer Name',
    'sales.th_place_of_supply': 'Place of Supply',
    'sales.th_payment_type': 'Payment Type',
    'sales.th_total': 'Total (₹)',
    'sales.th_balance': 'Balance Due (₹)',
    'sales.th_status': 'Status',
    'sales.th_actions': 'Actions',
    'sales.paid': 'Paid',
    'sales.unpaid': 'Unpaid',
    'sales.print': 'Print',
    'sales.whatsapp': 'WhatsApp',
    'sales.convert_invoice': 'Convert to Invoice ⚡',

    // Purchases Module
    'pur.title': 'Purchase Bills (Stock In)',
    'pur.record_bill': '+ Record Purchase Bill',
    'pur.tab_bills': 'Purchase Bills',
    'pur.tab_orders': 'Purchase Orders',
    'pur.tab_payments': 'Payment Out (Suppliers)',
    'pur.total_purchases': 'Total Purchases (Stock In)',
    'pur.th_bill_no': 'Bill No',
    'pur.th_supplier': 'Supplier Name',

    // Items & Inventory
    'items.title': 'Product & Inventory Catalog',
    'items.add_product': '+ Add New Product',
    'items.scan_barcode': 'Scan Barcode',
    'items.search_placeholder': 'Search name, barcode, HSN...',
    'items.tab_products': 'Products & Services',
    'items.tab_adjustments': 'Stock Adjustments',
    'items.tab_units': 'Units & Categories',
    'items.tab_history': 'Stock Movement History',
    'items.total_qty': 'Total Stock Quantity',
    'items.valuation': 'Stock Valuation (Cost)',
    'items.low_stock_alerts': 'Low Stock Alerts',
    'items.th_code': 'Item Code / Barcode',
    'items.th_name': 'Item Name',
    'items.th_category': 'Category',
    'items.th_hsn': 'HSN Code',
    'items.th_sale_price': 'Sale Price (₹)',
    'items.th_purchase_price': 'Purchase Price (₹)',
    'items.th_tax_rate': 'Tax Rate',
    'items.th_stock': 'Current Stock',
    'items.th_status': 'Stock Status',
    'items.in_stock': 'IN STOCK',
    'items.low_stock': 'LOW STOCK',
    'items.out_of_stock': 'OUT OF STOCK',
    'items.label': '🏷️ Label',

    // Parties
    'parties.title': 'Customer & Supplier Directory',
    'parties.add_party': '+ Add Party',
    'parties.to_collect': "To Collect (You'll Get)",
    'parties.to_pay': "To Pay (You'll Pay)",
    'parties.all': 'All',
    'parties.customers': 'Customers',
    'parties.suppliers': 'Suppliers',

    // Cash & Bank
    'cb.title': 'Cash & Bank Passbook',
    'cb.cash_in_hand': 'Cash in Hand',
    'cb.bank_ac': 'Bank Current A/C',
    'cb.liquidity': 'Total Liquid Capital',
    'cb.contra_btn': '+ Contra Transfer',
    'cb.tab_passbook': 'Passbook & Accounts',
    'cb.tab_contra': 'Contra Transfers',

    // Reports
    'rep.title': 'Financial Statements & Tax Registers',
    'rep.pnl': 'Profit & Loss',
    'rep.balancesheet': 'Balance Sheet',
    'rep.cashflow': 'Cash Flow',
    'rep.daybook': 'Daybook',
    'rep.gst': 'GST Filing (GSTR-1 & 3B)',
    'rep.net_profit': 'Estimated Net Profit',
    'rep.gstr1_liability': 'GSTR-1 Output Tax Liability',
    'rep.download_json': 'Download GSTR-1 JSON (Govt Portal) ⚡',

    // SaaS Subscription
    'sub.title': 'SaaS Subscription & Multi-Business Plans',
    'sub.subtitle': 'Manage plan entitlements, business slots and invoice limits',
    'sub.slots_used': 'Business Slots Used',
    'sub.add_biz': '+ Add Business',
    'sub.switch_to_this': 'Switch to this',
    'sub.currently_active': 'Currently Active',

    // Data Migration & Switcher
    'mig.title': 'Data Import & Migration Center',
    'mig.subtitle': 'Seamlessly switch from Tally, Vyapar, Khatabook, Zoho or Excel without data loss',
    'mig.step1': '1. Select Source Software',
    'mig.step2': '2. Destination & Mode',
    'mig.step3': '3. Upload File & Analyze',
    'mig.step4': '4. Field Mapping & Validation',
    'mig.step5': '5. Confirm & Import',
    'mig.btn_import': 'Start Safe Migration',
    'mig.btn_confirm': 'Confirm & Execute Live Import',
    'mig.btn_rollback': 'Rollback Previous Batch',

    // Settings
    'set.title': 'Business Settings',
    'set.subtitle': 'Company details, GSTIN, bank UPI details and language preferences',
    'set.general': '1. General Business Information',
    'set.lang_section': '2. Application Language & Regional Localization',
    'set.lang_region': '3. Language & Region / भाषा एवं क्षेत्र',
    'set.app_lang': 'Application Language (एप्लिकेशन भाषा)',
    'set.select_lang': 'Display Language',
    'set.save_btn': 'Save Settings & Preferences',

    // Modals & Billing Forms
    'modal.create_sale': 'Create Tax Invoice (GST)',
    'modal.invoice_no': 'Invoice No.',
    'modal.invoice_date': 'Invoice Date',
    'modal.bill_to': 'Bill To (Party)',
    'modal.place_of_supply': 'Place of Supply',
    'modal.payment_type': 'Payment Type',
    'modal.notes': 'Notes / Terms & Conditions',
    'modal.subtotal': 'Subtotal (Taxable)',
    'modal.total_tax': 'Total GST Tax',
    'modal.grand_total': 'Total Amount',
    'modal.balance_due': 'Balance Due',
    'modal.save_print': 'Save & Print Invoice',

    // Inventory & Item Fields
    'modal.add_item': 'Add Item to Inventory',
    'modal.item_name': 'Item Name',
    'modal.category': 'Category',
    'modal.hsn_code': 'HSN / SAC Code',
    'modal.sale_price': 'Sale Price (₹)',
    'modal.purchase_price': 'Purchase Price (₹)',
    'modal.gst_rate': 'Applicable GST Rate',
    'modal.unit': 'Unit of Measurement',
    'modal.opening_stock': 'Opening Stock Qty',
    'modal.min_stock': 'Low Stock Alert Level',

    // Party Management
    'modal.add_party': 'Add New Party (Customer/Supplier)',
    'modal.party_type': 'Party Type',
    'modal.customer': 'Customer (Buyer)',
    'modal.supplier': 'Supplier (Vendor)',
    'modal.party_name': 'Party / Business Name',
    'modal.mobile': 'Mobile / WhatsApp Number',
    'modal.gstin': 'GSTIN (Tax ID)',
    'modal.address': 'Billing Address',
    'modal.opening_balance': 'Opening Balance (₹)',

    // e-Way Bills
    'eway.title': 'GST e-Way Bills',
    'eway.generate': 'Generate e-Way Bill',
    'eway.vehicle_no': 'Vehicle Number',
    'eway.distance': 'Distance (km)',
    'eway.transporter': 'Transporter ID / Name',

    // RBAC & Staff Management
    'users.title': 'Staff & Role-Based Access Control',
    'users.add_user': 'Add Staff Operator',
    'users.role_admin': 'Admin (Business Owner)',
    'users.role_accountant': 'Accountant (Full Books)',
    'users.role_salesman': 'Salesman (Billing Only)',
    'users.role_delivery': 'Delivery Agent',

    // Reports & Statements
    'rep.pnl': 'Profit & Loss Statement',
    'rep.balance_sheet': 'Balance Sheet',
    'rep.gstr1': 'GSTR-1 Portal JSON Export',
    'rep.daybook': 'Daybook & Daily Cash Flow',
    'rep.export_excel': 'Export Spreadsheet (.xlsx)',
    'rep.export_pdf': 'Download Statement (.pdf)',

    // Migration Extra Keys
    'mig.tally_prime': 'Tally ERP 9 / TallyPrime',
    'mig.vyapar_app': 'Vyapar App Backup',
    'mig.khatabook': 'Khatabook Ledger',
    'mig.zoho_books': 'Zoho Books Export',
    'mig.excel_csv': 'Excel / CSV Spreadsheets',
    'mig.mode1_title': 'Mode 1: Opening Balances Only',
    'mig.mode2_title': 'Mode 2: Full Historical Migration',
    'mig.mode3_title': 'Mode 3: Selective Migration',
    'mig.safe_rollback': 'Safe 1-Click Rollback',
    'mig.batch_audit': 'Batch Provenance Audit Log',

    // Common UI Elements
    'common.active': 'Active',
    'common.deactivated': 'Deactivated',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.warning': 'Warning'
  },

  hi: {
    // Brand & Topbar
    'app.title': 'लेखा जोखा',
    'app.tagline': 'जीएसटी बिलिंग, इन्वेंटरी और बहीखाता लेखांकन',
    'topbar.search_placeholder': 'बिल, पार्टी या सामान खोजें...',
    'topbar.scan_barcode': 'बारकोड स्कैन करें',
    'topbar.ai_advisor': 'लेखा जोखा AI',
    'topbar.sale_btn': '+ बिक्री (सेल)',
    'topbar.purchase_btn': '+ खरीद (पर्चेज)',
    'topbar.switch_user': 'उपयोगकर्ता बदलें',
    'topbar.switch_business': 'व्यवसाय बदलें',
    'topbar.lang_switch': 'English',

    // Sidebar Navigation
    'nav.main_menu': 'मुख्य मेन्यू',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.transactions': 'लेन-देन (ट्रांजेक्शन)',
    'nav.orders': 'ऑर्डर प्रबंधन (Orders)',
    'nav.sales': 'बिक्री चालान (सेल बिल)',
    'nav.purchases': 'खरीद बिल (पर्चेज)',
    'nav.parties': 'पार्टियां (ग्राहक / व्यापारी)',
    'nav.eway': 'ई-वे बिल (जीएसटी)',
    'nav.catalog_money': 'इन्वेंटरी और रोकड़',
    'nav.items': 'सामान और इन्वेंटरी',
    'nav.cashbank': 'रोकड़ और बैंक खाता',
    'nav.expenses': 'दुकान / व्यापार खर्चे',
    'nav.intelligence': 'AI और रिपोर्ट',
    'nav.track_salesmen': 'सेल्समैन लाइव ट्रैकिंग',
    'nav.ai_advisor': 'लेखा जोखा AI सलाहकार',
    'nav.reports': 'रिपोर्ट और जीएसटी रिटर्न',
    'nav.users': 'स्टाफ और अनुमतियां (RBAC)',
    'nav.subscription': 'SaaS प्लान और बहु-व्यवसाय',
    'nav.migration': 'डेटा आयात और माइग्रेशन',
    'nav.settings': 'व्यवसाय सेटिंग्स',
    'nav.offline_active': 'ऑफलाइन इंजन सक्रिय',
    'nav.backup': 'बैकअप',
    'nav.reset': 'रीसेट',

    // Dashboard
    'dash.title': 'लेखा जोखा डैशबोर्ड',
    'dash.subtitle': 'आपकी बिक्री, रोकड़ और स्टॉक का संपूर्ण वास्तविक विवरण',
    'dash.to_collect': 'लेना है (ग्राहक उधारी)',
    'dash.to_pay': 'देना है (व्यापारी बकाया)',
    'dash.cash_bank': 'कुल रोकड़ व बैंक बैलेंस',
    'dash.stock_value': 'कुल स्टॉक मूल्यांकन (लागत)',
    'dash.total_sales': 'कुल बिक्री टर्नओवर',
    'dash.recent_sales': 'हाल के बिक्री बिल',
    'dash.low_stock': 'कम स्टॉक वाले सामान (चेतावनी)',
    'dash.view_all': 'सभी देखें',
    'dash.quick_actions': 'त्वरित कार्य शॉर्टकट',
    'dash.add_customer': '+ नया ग्राहक जोड़ें',
    'dash.add_product': '+ नया सामान जोड़ें',
    'dash.create_bill': '+ नया बिल बनाएं',
    'dash.record_purchase': '+ खरीद दर्ज करें',

    // Sales Module
    'sales.title': 'जीएसटी टैक्स इनवॉइस (बिक्री)',
    'sales.create_invoice': '+ नया टैक्स इनवॉइस बनाएं',
    'sales.smart_bill': '✨ AI स्मार्ट बिलिंग',
    'sales.search_placeholder': 'बिल नंबर या ग्राहक खोजें...',
    'sales.tab_invoices': 'बिक्री बिल (इनवॉइस)',
    'sales.tab_estimates': 'अनुमान और कोटेशन',
    'sales.tab_returns': 'बिक्री वापसी / क्रेडिट नोट',
    'sales.tab_challans': 'डिलीवरी चालान',
    'sales.tab_payments': 'भुगतान प्राप्ति (रसीद)',
    'sales.th_inv_no': 'बिल नंबर',
    'sales.th_date': 'दिनांक',
    'sales.th_customer': 'ग्राहक का नाम',
    'sales.th_place_of_supply': 'आपूर्ति का स्थान',
    'sales.th_payment_type': 'भुगतान का प्रकार',
    'sales.th_total': 'कुल राशि (₹)',
    'sales.th_balance': 'बकाया राशि (₹)',
    'sales.th_status': 'स्थिति',
    'sales.th_actions': 'कार्य',
    'sales.paid': 'भुगतान प्राप्त',
    'sales.unpaid': 'बकाया (उधार)',
    'sales.print': 'प्रिंट',
    'sales.whatsapp': 'व्हाट्सएप',
    'sales.convert_invoice': 'बिल में बदलें ⚡',

    // Purchases Module
    'pur.title': 'खरीद बिल (स्टॉक आवक)',
    'pur.record_bill': '+ खरीद बिल दर्ज करें',
    'pur.tab_bills': 'खरीद बिल',
    'pur.tab_orders': 'खरीद आदेश (PO)',
    'pur.tab_payments': 'आपूर्तिकर्ता भुगतान (भुगतान जावक)',
    'pur.total_purchases': 'कुल खरीद (स्टॉक आवक)',
    'pur.th_bill_no': 'खरीद बिल नं.',
    'pur.th_supplier': 'आपूर्तिकर्ता / व्यापारी',

    // Items & Inventory
    'items.title': 'उत्पाद और इन्वेंटरी सूची',
    'items.add_product': '+ नया उत्पाद जोड़ें',
    'items.scan_barcode': 'बारकोड स्कैन करें',
    'items.search_placeholder': 'नाम, बारकोड या HSN खोजें...',
    'items.tab_products': 'उत्पाद और सेवाएं',
    'items.tab_adjustments': 'स्टॉक मिलान (एडजस्टमेंट)',
    'items.tab_units': 'इकाइयां और श्रेणियां',
    'items.tab_history': 'स्टॉक आवागमन खाता',
    'items.total_qty': 'कुल उपलब्ध मात्रा',
    'items.valuation': 'स्टॉक मूल्यांकन (लागत)',
    'items.low_stock_alerts': 'कम स्टॉक चेतावनी',
    'items.th_code': 'कोड / बारकोड',
    'items.th_name': 'सामान का नाम',
    'items.th_category': 'श्रेणी',
    'items.th_hsn': 'HSN कोड',
    'items.th_sale_price': 'बिक्री दर (₹)',
    'items.th_purchase_price': 'खरीद दर (₹)',
    'items.th_tax_rate': 'टैक्स दर',
    'items.th_stock': 'वर्तमान स्टॉक',
    'items.th_status': 'स्टॉक स्थिति',
    'items.in_stock': 'उपलब्ध है',
    'items.low_stock': 'कम स्टॉक',
    'items.out_of_stock': 'स्टॉक समाप्त',
    'items.label': '🏷️ स्टीकर',

    // Parties
    'parties.title': 'ग्राहक एवं आपूर्तिकर्ता खाता',
    'parties.add_party': '+ नई पार्टी जोड़ें',
    'parties.to_collect': 'लेना है (कुल उधारी)',
    'parties.to_pay': 'देना है (कुल बकाया)',
    'parties.all': 'सभी पार्टियां',
    'parties.customers': 'ग्राहक',
    'parties.suppliers': 'आपूर्तिकर्ता',

    // Cash & Bank
    'cb.title': 'रोकड़ और बैंक पासबुक',
    'cb.cash_in_hand': 'दुकान गल्ला (नकद)',
    'cb.bank_ac': 'बैंक चालू खाता',
    'cb.liquidity': 'कुल उपलब्ध नकदी पूंजी',
    'cb.contra_btn': '+ कॉन्ट्रा ट्रांसफर (नकद-बैंक)',
    'cb.tab_passbook': 'पासबुक विवरण',
    'cb.tab_contra': 'कॉन्ट्रा ट्रांसफर',

    // Reports
    'rep.title': 'वित्तीय विवरण और टैक्स रजिस्टर',
    'rep.pnl': 'लाभ-हानि (P&L)',
    'rep.balancesheet': 'तुलन पत्र (बैलेंस शीट)',
    'rep.cashflow': 'नकदी प्रवाह (कैश फ्लो)',
    'rep.daybook': 'दैनिक बही (डे-बुक)',
    'rep.gst': 'जीएसटी फाइलिंग (GSTR-1 और 3B)',
    'rep.net_profit': 'अनुमानित शुद्ध लाभ',
    'rep.gstr1_liability': 'GSTR-1 टैक्स देनदारी',
    'rep.download_json': 'GSTR-1 JSON डाउनलोड करें (सरकारी पोर्टल हेतु) ⚡',

    // SaaS Subscription
    'sub.title': 'SaaS सदस्यता और बहु-व्यवसाय प्लान',
    'sub.subtitle': 'प्लान सीमाएं, व्यवसाय स्लॉट और इनवॉइस कोटा प्रबंधित करें',
    'sub.slots_used': 'प्रयुक्त व्यवसाय स्लॉट',
    'sub.add_biz': '+ नया व्यवसाय जोड़ें',
    'sub.switch_to_this': 'इस व्यवसाय में जाएं',
    'sub.currently_active': 'वर्तमान में सक्रिय',

    // Data Migration & Switcher
    'mig.title': 'डेटा आयात और माइग्रेशन केंद्र',
    'mig.subtitle': 'टेली (Tally), व्यापार, खाता-बुक, ज़ोहो या एक्सेल से बिना डेटा खोए आसानी से स्विच करें',
    'mig.step1': '१. पुराना सॉफ्टवेयर चुनें',
    'mig.step2': '२. गंतव्य व्यवसाय व मोड',
    'mig.step3': '३. फाइल अपलोड व विश्लेषण',
    'mig.step4': '४. कॉलम मैपिंग व सत्यापन',
    'mig.step5': '५. पुष्टि व सुरक्षित आयात',
    'mig.btn_import': 'सुरक्षित माइग्रेशन शुरू करें',
    'mig.btn_confirm': 'पुष्टि करें और लाइव आयात निष्पादित करें',
    'mig.btn_rollback': 'पिछला माइग्रेशन वापस लें (रोलबैक)',

    // Settings
    'set.title': 'व्यवसाय सेटिंग्स',
    'set.subtitle': 'कंपनी का विवरण, जीएसटी नंबर, बैंक खाता और भाषा सेटिंग्स',
    'set.general': '१. सामान्य व्यापार जानकारी',
    'set.lang_section': '२. ऐप की भाषा और क्षेत्रीय सेटिंग्स',
    'set.lang_region': '३. भाषा एवं क्षेत्र (Language & Region)',
    'set.app_lang': 'एप्लिकेशन भाषा (Application Language)',
    'set.select_lang': 'भाषा चुनें',
    'set.save_btn': 'सेटिंग्स और प्राथमिकताएं सहेजें',

    // Modals & Billing Forms
    'modal.create_sale': 'टैक्स चालान बनाएं (जीएसटी इनवॉइस)',
    'modal.invoice_no': 'चालान संख्या (बिल नं.)',
    'modal.invoice_date': 'चालान तिथि',
    'modal.bill_to': 'बिल पार्टी (ग्राहक का नाम)',
    'modal.place_of_supply': 'आपूर्ति का राज्य (Place of Supply)',
    'modal.payment_type': 'भुगतान का माध्यम (कैश/बैंक)',
    'modal.notes': 'शर्तें व नियम / टिप्पणी',
    'modal.subtotal': 'उप-योग (कर योग्य राशि)',
    'modal.total_tax': 'कुल जीएसटी कर',
    'modal.grand_total': 'कुल बिल राशि',
    'modal.balance_due': 'बकाया उधारी (शेष राशि)',
    'modal.save_print': 'सहेजें और बिल प्रिंट करें',

    // Inventory & Item Fields
    'modal.add_item': 'इन्वेंटरी में नया सामान जोड़ें',
    'modal.item_name': 'सामान का नाम (आइटम)',
    'modal.category': 'श्रेणी (कैटेगरी)',
    'modal.hsn_code': 'एचएसएन / एसएसी कोड',
    'modal.sale_price': 'बिक्री मूल्य (₹)',
    'modal.purchase_price': 'खरीद मूल्य (₹)',
    'modal.gst_rate': 'लागू जीएसटी दर (%)',
    'modal.unit': 'इकाई / यूनिट (PCS, KG, आदि)',
    'modal.opening_stock': 'प्रारंभिक स्टॉक मात्रा',
    'modal.min_stock': 'कम स्टॉक अलर्ट सीमा',

    // Party Management
    'modal.add_party': 'नई पार्टी जोड़ें (ग्राहक / सप्लायर)',
    'modal.party_type': 'पार्टी का प्रकार',
    'modal.customer': 'ग्राहक (कस्टमर)',
    'modal.supplier': 'आपूर्तिकर्ता (सप्लायर/व्यापारी)',
    'modal.party_name': 'पार्टी या दुकान का नाम',
    'modal.mobile': 'मोबाइल / व्हाट्सएप नंबर',
    'modal.gstin': 'जीएसटी नंबर (GSTIN)',
    'modal.address': 'दुकान या बिलिंग पता',
    'modal.opening_balance': 'प्रारंभिक उधारी / शेष (₹)',

    // e-Way Bills
    'eway.title': 'जीएसटी ई-वे बिल (NIC)',
    'eway.generate': 'नया ई-वे बिल बनाएं',
    'eway.vehicle_no': 'वाहन / गाड़ी नंबर',
    'eway.distance': 'दूरी (किलोमीटर में)',
    'eway.transporter': 'ट्रांसपोर्टर आईडी / नाम',

    // RBAC & Staff Management
    'users.title': 'स्टाफ और अनुमतियां (RBAC)',
    'users.add_user': 'नया स्टाफ ऑपरेटर जोड़ें',
    'users.role_admin': 'व्यवस्थापक / दुकान मालिक',
    'users.role_accountant': 'मुनीम जी (अकाउंटेंट)',
    'users.role_salesman': 'सेल्समैन (कैश काउंटर)',
    'users.role_delivery': 'डिलीवरी एजेंट',

    // Reports & Statements
    'rep.pnl': 'लाभ और हानि विवरण (P&L)',
    'rep.balance_sheet': 'तुलन पत्र (बैलेंस शीट)',
    'rep.gstr1': 'जीएसटीआर-1 पोर्टल JSON फाइल',
    'rep.daybook': 'दैनिक बहीखाता (रोज़नामचा)',
    'rep.export_excel': 'एक्सेल में डाउनलोड करें (.xlsx)',
    'rep.export_pdf': 'खाता विवरण पीडीएफ में निकालें',

    // Migration Extra Keys
    'mig.tally_prime': 'टैली ईआरपी ९ / टैलीप्राइम',
    'mig.vyapar_app': 'व्यापार ऐप बैकअप',
    'mig.khatabook': 'खाताबुक बहीखाता',
    'mig.zoho_books': 'ज़ोहो बुक्स एक्सपोर्ट',
    'mig.excel_csv': 'एक्सेल / सीएसवी स्प्रेडशीट',
    'mig.mode1_title': 'मोड १: केवल प्रारंभिक शेष (ओपनिंग बैलेंस)',
    'mig.mode2_title': 'मोड २: पूर्ण ऐतिहासिक लेन-देन माइग्रेशन',
    'mig.mode3_title': 'मोड ३: चुनिंदा रिकॉर्ड आयात',
    'mig.safe_rollback': 'सुरक्षित १-क्लिक रोलबैक',
    'mig.batch_audit': 'बैच ऑडिट और स्रोत ट्रैकिंग',

    // Common UI Elements
    'common.active': 'सक्रिय',
    'common.deactivated': 'निष्क्रिय',
    'common.cancel': 'रद्द करें',
    'common.confirm': 'पुष्टि करें',
    'common.success': 'सफल',
    'common.error': 'त्रुटि',
    'common.warning': 'चेतावनी'
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('vyapar_lang') || 'en';
  }

  t(key, defaultVal = '') {
    const langDict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    // Fallback to English
    if (TRANSLATIONS.en && TRANSLATIONS.en[key] !== undefined) {
      return TRANSLATIONS.en[key];
    }
    return defaultVal || key;
  }

  setLanguage(lang) {
    if (lang !== 'en' && lang !== 'hi') lang = 'en';
    this.currentLang = lang;
    localStorage.setItem('vyapar_lang', lang);

    // Persist to store if available
    if (window.Store && window.Store.getSubscriber()) {
      window.Store.getSubscriber().languagePreference = lang;
      window.Store.save();
    }

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Apply translations across DOM
    this.applyToDOM();

    // Dispatch global event
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  toggleLanguage() {
    const nextLang = this.currentLang === 'en' ? 'hi' : 'en';
    this.setLanguage(nextLang);
    return nextLang;
  }

  getLanguage() {
    return this.currentLang;
  }

  applyToDOM(root = document) {
    const elements = root.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.innerText = this.t(key, el.innerText);
      }
    });

    const placeholders = root.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key, el.getAttribute('placeholder')));
      }
    });

    const titles = root.querySelectorAll('[data-i18n-title]');
    titles.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key, el.getAttribute('title')));
      }
    });

    // Update language toggle button text if present
    const langToggleBtn = document.getElementById('topbarLangToggle');
    if (langToggleBtn) {
      langToggleBtn.innerHTML = this.currentLang === 'en' 
        ? `<span style="font-size:14px;">🇮🇳</span> <b style="font-size:12px;">हिंदी</b>` 
        : `<span style="font-size:14px;">🌐</span> <b style="font-size:12px;">English</b>`;
    }
  }
}

// Global i18n singleton & dictionary export
window.TRANSLATIONS = TRANSLATIONS;
window.i18n = new I18nManager();
