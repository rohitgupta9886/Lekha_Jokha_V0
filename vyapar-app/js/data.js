// ==============================================================================
// LekhaJokha - Enterprise Multi-Tenant & Multi-Business Data Store
// Supports up to 5 Isolated Businesses per Subscriber, RBAC, SaaS Plans & Delta Sync
// ==============================================================================

const STORAGE_KEY = 'lekhajokha_pro_enterprise_store_v3';

// Unified API Base URL & Network Client (Supports Web, Android APK & Local Server)
window.getApiUrl = function(endpoint) {
  if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
  if (typeof window !== 'undefined' && window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    return window.location.origin + endpoint;
  }
  const configured = (typeof localStorage !== 'undefined' && localStorage.getItem('backend_api_base_url')) || 'http://127.0.0.1:3001';
  return configured + endpoint;
};

window.apiFetch = async function(endpoint, options = {}) {
  const url = window.getApiUrl(endpoint);
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('lekhajokha_auth_token')) || '';
  const activeBizId = (typeof localStorage !== 'undefined' && localStorage.getItem('lekhajokha_active_business_id')) || '';

  const headers = {
    'X-Client-Platform': 'Web-Desktop-Unified',
    ...(options.headers || {})
  };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (activeBizId && !headers['X-Business-Id']) {
    headers['X-Business-Id'] = activeBizId;
  }
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = { ...options, headers };

  try {
    const response = await fetch(url, fetchOptions);
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('lekhajokha_auth_token');
        localStorage.removeItem('lekhajokha_current_user');
      }
      window.dispatchEvent(new CustomEvent('lekhajokha:session-expired', { detail: { endpoint } }));
    }
    return response;
  } catch (err) {
    if (url !== endpoint) {
      return await fetch(endpoint, fetchOptions);
    }
    throw err;
  }
};

// SaaS Subscription Plans Definition
const SAAS_PLANS = {
  Free: {
    id: 'Free',
    name: 'LekhaJokha Free',
    badge: 'STARTER',
    priceMonthly: 0,
    priceYearly: 0,
    maxBusinesses: 1,
    maxUsers: 1,
    maxInvoicesMonthly: 50,
    features: {
      multiBusiness: false,
      barcodeScanning: true,
      barcodePrinting: false,
      ewayBills: false,
      aiAdvisor: false,
      gstJsonExport: false,
      customTemplates: false,
      prioritySupport: false
    },
    description: 'Essential billing for single retail counter & micro-traders.'
  },
  Pro: {
    id: 'Pro',
    name: 'LekhaJokha Pro',
    badge: 'POPULAR',
    priceMonthly: 299,
    priceYearly: 2999,
    maxBusinesses: 2,
    maxUsers: 5,
    maxInvoicesMonthly: 999999,
    features: {
      multiBusiness: true,
      barcodeScanning: true,
      barcodePrinting: true,
      ewayBills: true,
      aiAdvisor: true,
      gstJsonExport: true,
      customTemplates: true,
      prioritySupport: false
    },
    description: 'Advanced inventory, e-Way bills, AI advisor & multi-counter billing for growing SMEs.'
  },
  Max: {
    id: 'Max',
    name: 'LekhaJokha Enterprise Max',
    badge: 'ENTERPRISE',
    priceMonthly: 599,
    priceYearly: 5999,
    maxBusinesses: 5,
    maxUsers: 999999,
    maxInvoicesMonthly: 999999,
    features: {
      multiBusiness: true,
      barcodeScanning: true,
      barcodePrinting: true,
      ewayBills: true,
      aiAdvisor: true,
      gstJsonExport: true,
      customTemplates: true,
      prioritySupport: true
    },
    description: 'Up to 5 distinct businesses under 1 subscriber account, unlimited staff seats & priority compliance.'
  }
};

// Initial Realistic Multi-Business Seed Data
const initialSubscriber = {
  id: "SUB-88990",
  name: "Sharma Ji",
  email: "sharma@sharmatraders.in",
  phone: "+91 98765 43210",
  plan: "Max", // Default to Max to demonstrate up to 5 businesses
  planActivatedAt: "2026-04-01",
  planExpiresAt: "2027-03-31",
  activeBusinessId: "BIZ-001"
};

// Default Businesses (Isolated Entities)
const defaultBusinesses = [
  {
    id: "BIZ-001",
    name: "Sharma Traders & Distributors",
    tagline: "Wholesale & Retail FMCG & Groceries",
    gstin: "07AAAAA0000A1Z5",
    phone: "+91 98765 43210",
    email: "sharmatraders.delhi@gmail.com",
    address: "Shop No. 42, Main Commercial Market, Chandni Chowk",
    city: "New Delhi",
    state: "Delhi (07)",
    pincode: "110006",
    bankName: "HDFC Bank Ltd.",
    accountNumber: "50200012345678",
    ifsc: "HDFC0001234",
    branch: "Chandni Chowk Branch, Delhi",
    upiId: "sharmatraders@hdfcbank",
    terms: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not received within 15 days.\n3. Subject to Delhi jurisdiction only.",
    status: "Active",
    createdAt: "2026-01-10",
    parties: [
      { id: "P_LALU", name: "lalu singh", type: "Customer", phone: "9876543210", gstin: "None", address: "B-44, Civil Lines, Kanpur, UP", state: "Uttar Pradesh", balance: 1000, createdAt: "2026-10-18" },
      { id: "P001", name: "Gupta General Store", type: "Customer", phone: "9810123456", gstin: "07BZZPG1234C1Z9", address: "B-12, Sector 15, Rohini, Delhi", state: "Delhi", balance: 14500, createdAt: "2026-03-01" },
      { id: "P002", name: "Metro Retail Mart", type: "Customer", phone: "9871234567", gstin: "07AAACM4321D1Z2", address: "Shop 4, Karol Bagh, Delhi", state: "Delhi", balance: 28400, createdAt: "2026-03-05" },
      { id: "P003", name: "Apex Electronics Hub", type: "Customer", phone: "9988776655", gstin: "27AABCA5678E1Z4", address: "Lamington Road, Mumbai", state: "Maharashtra", balance: 0, createdAt: "2026-03-10" },
      { id: "P004", name: "Hindustan FMCG Suppliers", type: "Supplier", phone: "9811223344", gstin: "07AABCH9876F1Z1", address: "Transport Nagar, Azadpur, Delhi", state: "Delhi", balance: -32000, createdAt: "2026-02-15" },
      { id: "P005", name: "Aggarwal Mills & Grains", type: "Supplier", phone: "9899112233", gstin: "07AAACA1122B1Z8", address: "Naya Bazar, Old Delhi", state: "Delhi", balance: -18500, createdAt: "2026-02-20" }
    ],
    items: [
      { id: "ITM001", barcode: "890103000001", name: "Basmati Rice Royal Premium (10 Kg)", category: "Groceries", hsn: "1006", salePrice: 1150, purchasePrice: 950, gstRate: 5, unit: "BAG", stock: 45, minStock: 10 },
      { id: "ITM002", barcode: "890103000002", name: "Fortune Refined Mustard Oil (1 Ltr)", category: "Groceries", hsn: "1514", salePrice: 145, purchasePrice: 125, gstRate: 5, unit: "LTR", stock: 120, minStock: 25 },
      { id: "ITM003", barcode: "890103000003", name: "Tata Tea Gold (500g)", category: "FMCG", hsn: "0902", salePrice: 320, purchasePrice: 275, gstRate: 5, unit: "PCS", stock: 4, minStock: 15 },
      { id: "ITM004", barcode: "890103000004", name: "Syska Smart LED Bulb 12W", category: "Electronics", hsn: "8539", salePrice: 280, purchasePrice: 190, gstRate: 18, unit: "PCS", stock: 35, minStock: 10 },
      { id: "ITM005", barcode: "890103000005", name: "Anchor 3-Pin Extension Cord 4m", category: "Electronics", hsn: "8544", salePrice: 450, purchasePrice: 310, gstRate: 18, unit: "PCS", stock: 3, minStock: 8 }
    ],
    sales: [
      {
        id: "INV-LALU-001",
        number: "1",
        docType: "Sale",
        date: "18/10/2026",
        partyId: "P_LALU",
        partyName: "lalu singh",
        placeOfSupply: "UTTAR PRADESH (09)",
        paymentMode: "Credit",
        items: [{ itemId: "ITM001", name: "Standard Goods & Services", hsn: "1006", qty: 1, rate: 1000, gstRate: 0, amount: 1000 }],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        paid: 0,
        balance: 1000,
        status: "Unpaid",
        notes: "Sale invoice #1"
      },
      {
        id: "INV-2026-001",
        number: "INV-2026-001",
        docType: "Invoice",
        date: "2026-10-15",
        partyId: "P001",
        partyName: "Gupta General Store",
        placeOfSupply: "DELHI (07)",
        paymentMode: "Bank / UPI",
        items: [{ itemId: "ITM001", name: "Basmati Rice Royal Premium (10 Kg)", hsn: "1006", qty: 10, rate: 1150, gstRate: 5, amount: 12075 }],
        subtotal: 11500,
        tax: 575,
        total: 12075,
        paid: 12075,
        balance: 0,
        status: "Paid",
        notes: "Delivered via Tempo DL-1L-4421",
        ewayBillNumber: "241098521094"
      },
      {
        id: "INV-2026-002",
        number: "INV-2026-002",
        docType: "Invoice",
        date: "2026-10-17",
        partyId: "P002",
        partyName: "Metro Retail Mart",
        placeOfSupply: "DELHI (07)",
        paymentMode: "Credit",
        items: [
          { itemId: "ITM002", name: "Fortune Refined Mustard Oil (1 Ltr)", hsn: "1514", qty: 50, rate: 145, gstRate: 5, amount: 7612.5 },
          { itemId: "ITM004", name: "Syska Smart LED Bulb 12W", hsn: "8539", qty: 20, rate: 280, gstRate: 18, amount: 6608 }
        ],
        subtotal: 12850,
        tax: 1370.5,
        total: 14220.5,
        paid: 0,
        balance: 14220.5,
        status: "Unpaid",
        notes: "30 days credit terms apply"
      }
    ],
    estimates: [
      {
        id: "EST-2026-001",
        number: "EST-2026-001",
        date: "2026-10-16",
        partyId: "P001",
        partyName: "Gupta General Store",
        total: 8500,
        validUntil: "2026-10-31",
        status: "Open",
        items: [{ itemId: "ITM001", name: "Basmati Rice Royal Premium (10 Kg)", qty: 7, rate: 1150, amount: 8452.5 }]
      }
    ],
    salesReturns: [
      {
        id: "SR-2026-001",
        number: "SR-2026-001",
        date: "2026-10-14",
        partyId: "P002",
        partyName: "Metro Retail Mart",
        invoiceNumber: "INV-2026-002",
        total: 1450,
        reason: "Damaged outer packaging",
        items: [{ itemId: "ITM002", name: "Fortune Refined Mustard Oil (1 Ltr)", qty: 10, rate: 145, amount: 1450 }]
      }
    ],
    deliveryChallans: [
      {
        id: "DC-2026-001",
        number: "DC-2026-001",
        date: "2026-10-15",
        partyName: "Gupta General Store",
        vehicleNumber: "DL-1L-4421",
        transporter: "Delhi Freight Services",
        status: "Delivered",
        itemsSummary: "10 Bags Basmati Rice"
      }
    ],
    purchases: [
      {
        id: "PUR-2026-001",
        number: "PUR-2026-001",
        date: "2026-10-10",
        partyId: "P004",
        partyName: "Hindustan FMCG Suppliers",
        paymentMode: "Bank / Cheque",
        items: [{ itemId: "ITM001", name: "Basmati Rice Royal Premium (10 Kg)", qty: 50, rate: 950, gstRate: 5, amount: 49875 }],
        subtotal: 47500,
        tax: 2375,
        total: 49875,
        paid: 49875,
        balance: 0,
        status: "Paid"
      }
    ],
    purchaseOrders: [
      {
        id: "PO-2026-001",
        number: "PO-2026-001",
        date: "2026-10-12",
        partyId: "P005",
        partyName: "Aggarwal Mills & Grains",
        total: 35000,
        status: "Sent",
        deliveryDate: "2026-10-25"
      }
    ],
    stockAdjustments: [
      {
        id: "ADJ-001",
        date: "2026-10-01",
        itemId: "ITM001",
        itemName: "Basmati Rice Royal Premium (10 Kg)",
        type: "Add",
        qty: 5,
        reason: "Annual physical inventory surplus audit"
      }
    ],
    expenses: [
      { id: "EXP-001", date: "2026-10-01", category: "Shop Rent", description: "Monthly shop rent for October 2026", amount: 25000, paymentMode: "Bank Transfer", ref: "RENT/OCT/42" },
      { id: "EXP-002", date: "2026-10-05", category: "Electricity", description: "BSES Commercial Electricity Bill", amount: 6420, paymentMode: "Net Banking", ref: "BSES-992144" },
      { id: "EXP-003", date: "2026-10-07", category: "Staff Salary", description: "Helper & Loading Staff Wages", amount: 18000, paymentMode: "Cash", ref: "WAGE/OCT/WK1" }
    ],
    cashBank: {
      cashInHand: 42850,
      bankAccounts: [
        { id: "BANK-01", name: "HDFC Current A/c", accountNo: "50200012345678", ifsc: "HDFC0001234", balance: 342600 }
      ],
      hdfcBank: 342600,
      contraTransfers: [
        { id: "CON-001", date: "2026-10-12", from: "Cash in Hand", to: "HDFC Bank", amount: 20000, ref: "Daily cash deposit counter" }
      ]
    },
    ewayBills: [
      {
        id: "EWB-2026-001",
        ewayNumber: "241098521094",
        ewayDate: "2026-10-15 11:30",
        validUntil: "2026-10-16 23:59",
        invoiceNumber: "INV-2026-001",
        partyName: "Gupta General Store",
        partyGstin: "07BZZPG1234C1Z9",
        fromGstin: "07AAAAA0000A1Z5",
        distanceKm: 25,
        vehicleNumber: "DL-1L-4421",
        transporterName: "Delhi Freight Carriers",
        totalValue: 12075,
        status: "Active"
      }
    ],
    orders: [
      {
        id: "ORD-2026-001",
        number: "ORD-2026-001",
        date: "2026-10-20",
        timestamp: "2026-10-20T10:15:00.000Z",
        source: "Direct Counter",
        salesmanId: null,
        salesmanName: "Direct Counter / Owner",
        partyId: "P001",
        partyName: "Gupta General Store",
        phone: "9810123456",
        items: [
          { itemId: "ITM001", name: "Basmati Rice Royal Premium (10 Kg)", qty: 3, rate: 1150, gstRate: 5, amount: 3622.5 }
        ],
        subtotal: 3450,
        tax: 172.5,
        total: 3622.5,
        paymentStatus: "Paid",
        paymentMode: "UPI / QR",
        paidAmount: 3622.5,
        balanceDue: 0,
        orderStatus: "Billed",
        invoiceId: "INV-2026-001",
        invoiceNumber: "INV-2026-001",
        paymentMention: "PAID (via UPI / QR - Ref: UPI/902144)",
        notes: "Over-the-counter customer order"
      },
      {
        id: "ORD-2026-002",
        number: "ORD-2026-002",
        date: "2026-10-21",
        timestamp: "2026-10-21T02:30:00.000Z",
        source: "Salesman App",
        salesmanId: "SALES-001",
        salesmanName: "Ramesh Kumar",
        partyId: "P002",
        partyName: "Metro Retail Mart",
        phone: "9871234567",
        items: [
          { itemId: "ITM002", name: "Fortune Refined Mustard Oil (1 Ltr)", qty: 40, rate: 145, gstRate: 5, amount: 6090 },
          { itemId: "ITM003", name: "Tata Tea Gold (500g)", qty: 8, rate: 320, gstRate: 5, amount: 2688 }
        ],
        subtotal: 8360,
        tax: 418,
        total: 8778,
        paymentStatus: "Pending",
        paymentMode: "Pending",
        paidAmount: 0,
        balanceDue: 8778,
        orderStatus: "New",
        invoiceId: null,
        invoiceNumber: null,
        paymentMention: "Payment Pending",
        notes: "Booked in field by Ramesh Kumar (Indiranagar zone). Awaiting billing & payment."
      },
      {
        id: "ORD-2026-003",
        number: "ORD-2026-003",
        date: "2026-10-21",
        timestamp: "2026-10-21T03:10:00.000Z",
        source: "Salesman App",
        salesmanId: "SALES-002",
        salesmanName: "Suresh Raina",
        partyId: "P001",
        partyName: "Gupta General Store",
        phone: "9810123456",
        items: [
          { itemId: "ITM004", name: "Syska Smart LED Bulb 12W", qty: 15, rate: 280, gstRate: 18, amount: 4956 }
        ],
        subtotal: 4200,
        tax: 756,
        total: 4956,
        paymentStatus: "Paid",
        paymentMode: "Cash",
        paidAmount: 4956,
        balanceDue: 0,
        orderStatus: "New",
        invoiceId: null,
        invoiceNumber: null,
        paymentMention: "PAID (via Cash on Booking)",
        notes: "Advance cash collected by Suresh Raina during morning store visit."
      },
      {
        id: "ORD-2026-004",
        number: "ORD-2026-004",
        date: "2026-10-21",
        timestamp: "2026-10-21T03:25:00.000Z",
        source: "WhatsApp / Phone",
        salesmanId: null,
        salesmanName: "WhatsApp Catalog Order",
        partyId: "P003",
        partyName: "Apex Electronics Hub",
        phone: "9988776655",
        items: [
          { itemId: "ITM005", name: "Anchor 3-Pin Extension Cord 4m", qty: 5, rate: 450, gstRate: 18, amount: 2655 }
        ],
        subtotal: 2250,
        tax: 405,
        total: 2655,
        paymentStatus: "Pending",
        paymentMode: "Pending",
        paidAmount: 0,
        balanceDue: 2655,
        orderStatus: "New",
        invoiceId: null,
        invoiceNumber: null,
        paymentMention: "Payment Pending",
        notes: "Direct WhatsApp business catalog order from client."
      }
    ],
    salesmen: [
      {
        id: "SALES-001",
        name: "Ramesh Kumar",
        phone: "+91 98765 43210",
        employeeId: "EMP-001",
        role: "Senior Field Executive",
        territory: "Indiranagar & Commercial Market",
        email: "ramesh.field@sharmatraders.in",
        status: "Active",
        joiningStatus: "ACTIVE",
        attendanceStatus: "Punched In",
        lastPunchIn: "2026-10-21T09:15:00.000Z",
        lastPunchOut: null,
        inviteToken: "INV-RAMESH-ACTIVE",
        whatsAppInviteUrl: "https://wa.me/919876543210?text=Namaste%20Ramesh%20Kumar!%20Lekha%20Jokha%20App%20is%20ready.",
        targetMonthly: 400000,
        commissionRate: 3.0,
        stats: {
          dailySales: 24650,
          monthlySales: 384500,
          annualSales: 4210000,
          totalOrders: 84,
          traveledDistanceKm: 14.8,
          totalWorkingDuration: "6 hrs 32 mins",
          activeWorkingDuration: "5 hrs 45 mins",
          breakDuration: "47 mins",
          firstActivity: "09:15 AM - Punch In & GPS Fix Verified",
          lastActivity: "03:42 PM - Field Order #ORD-2026-002 Booked",
          syncStatus: "Online (Synced 2 mins ago via 4G)",
          missedPunches: "None (100% On-Time Record)"
        },
        punchInLocation: {
          lat: 28.6139,
          lng: 77.2090,
          address: "Shop 14, Commercial Complex, Indiranagar, New Delhi",
          time: "09:15 AM",
          accuracy: "8m (High Precision)"
        },
        punchOutLocation: {
          lat: null,
          lng: null,
          address: "Currently Active On Duty",
          time: null
        },
        lastLocation: {
          lat: 28.6185,
          lng: 77.2120,
          address: "Metro Retail Mart, Outer Ring Road, New Delhi",
          timestamp: "2026-10-21T03:45:00.000Z",
          accuracy: 6
        },
        attendanceSessions: [
          {
            id: "ATT-1021-01",
            date: "2026-10-21",
            punchIn: "2026-10-21T09:15:00.000Z",
            punchOut: null,
            startLocation: { lat: 28.6139, lng: 77.2090, address: "Shop 14, Indiranagar Market" },
            endLocation: null,
            totalMinutes: 392,
            activeMinutes: 345,
            breakMinutes: 47,
            status: "In Progress"
          },
          {
            id: "ATT-1020-01",
            date: "2026-10-20",
            punchIn: "2026-10-20T09:05:00.000Z",
            punchOut: "2026-10-20T17:45:00.000Z",
            startLocation: { lat: 28.6139, lng: 77.2090, address: "Indiranagar Hub" },
            endLocation: { lat: 28.6145, lng: 77.2105, address: "Indiranagar Metro Depot" },
            totalMinutes: 520,
            activeMinutes: 460,
            breakMinutes: 60,
            status: "Completed"
          }
        ],
        todayVisits: [
          {
            id: "VIS-01",
            partyName: "Gupta General Store",
            time: "10:05 AM",
            purpose: "🛍️ Stock Audit & New Order Discuss",
            notes: "Checked oil and rice inventory. Promised festival stock replenishment.",
            latitude: 28.6142,
            longitude: 77.2095,
            address: "Sector 15, Rohini Commercial Area",
            status: "Completed"
          },
          {
            id: "VIS-02",
            partyName: "Metro Retail Mart",
            time: "11:30 AM",
            purpose: "📦 Order Booking & Ledger Signoff",
            notes: "Booked order #ORD-2026-002 for ₹8,778. Signed balance confirmation slip.",
            latitude: 28.6185,
            longitude: 77.2120,
            address: "Karol Bagh Main Market",
            status: "Completed"
          },
          {
            id: "VIS-03",
            partyName: "Krishna Daily Needs",
            time: "01:15 PM",
            purpose: "📢 New Product Line Showcase",
            notes: "Demonstrated Syska Smart LED Bulbs and Anchor cords. Sample provided.",
            latitude: 28.6210,
            longitude: 77.2140,
            address: "Main Bazar Chowk",
            status: "Completed"
          },
          {
            id: "VIS-04",
            partyName: "City Supermarket",
            time: "03:10 PM",
            purpose: "💰 Payment Follow-up & Collection",
            notes: "Met owner Mr. Bansal. Cheque scheduled for deposit on Friday.",
            latitude: 28.6240,
            longitude: 77.2165,
            address: "Paharganj Commercial Road",
            status: "Completed"
          }
        ]
      },
      {
        id: "SALES-002",
        name: "Suresh Raina",
        phone: "+91 98450 12345",
        employeeId: "EMP-002",
        role: "Territory Sales Officer",
        territory: "Koramangala & Central Ring Road",
        email: "suresh.raina@sharmatraders.in",
        status: "Active",
        joiningStatus: "ACTIVE",
        attendanceStatus: "Punched In",
        lastPunchIn: "2026-10-21T09:45:00.000Z",
        lastPunchOut: null,
        inviteToken: "INV-SURESH-ACTIVE",
        whatsAppInviteUrl: "https://wa.me/919845012345?text=Namaste%20Suresh%20Raina!%20Lekha%20Jokha%20App%20is%20ready.",
        targetMonthly: 350000,
        commissionRate: 2.5,
        stats: {
          dailySales: 18200,
          monthlySales: 295000,
          annualSales: 3450000,
          totalOrders: 62,
          traveledDistanceKm: 11.4,
          totalWorkingDuration: "5 hrs 50 mins",
          activeWorkingDuration: "5 hrs 10 mins",
          breakDuration: "40 mins",
          firstActivity: "09:45 AM - Punch In at Koramangala Circle",
          lastActivity: "02:15 PM - Cash Order #ORD-2026-003 Booked",
          syncStatus: "Online (Synced live via 5G)",
          missedPunches: "None"
        },
        punchInLocation: {
          lat: 28.6250,
          lng: 77.2180,
          address: "Main Market Circle, Koramangala Hub, New Delhi",
          time: "09:45 AM",
          accuracy: "5m (High Precision)"
        },
        punchOutLocation: {
          lat: null,
          lng: null,
          address: "Currently Active On Duty",
          time: null
        },
        lastLocation: {
          lat: 28.6290,
          lng: 77.2210,
          address: "Koramangala 4th Block, 80ft Road",
          timestamp: "2026-10-21T03:30:00.000Z",
          accuracy: 8
        },
        attendanceSessions: [
          {
            id: "ATT-1021-02",
            date: "2026-10-21",
            punchIn: "2026-10-21T09:45:00.000Z",
            punchOut: null,
            startLocation: { lat: 28.6250, lng: 77.2180, address: "Koramangala Circle" },
            endLocation: null,
            totalMinutes: 350,
            activeMinutes: 310,
            breakMinutes: 40,
            status: "In Progress"
          }
        ],
        todayVisits: [
          {
            id: "VIS-11",
            partyName: "Gupta General Store",
            time: "10:30 AM",
            purpose: "🛍️ Field Order Booking",
            notes: "Collected cash ₹4,956 for LED bulbs order #ORD-2026-003.",
            latitude: 28.6260,
            longitude: 77.2190,
            address: "Main Commercial Block",
            status: "Completed"
          },
          {
            id: "VIS-12",
            partyName: "Aggarwal Super Mart",
            time: "12:15 PM",
            purpose: "🤝 Festive Scheme Briefing",
            notes: "Presented Diwali trade schemes and bulk purchase discounts.",
            latitude: 28.6280,
            longitude: 77.2205,
            address: "Outer Ring Junction",
            status: "Completed"
          }
        ]
      },
      {
        id: "SALES-003",
        name: "Amit Sharma",
        phone: "+91 98110 55667",
        employeeId: "EMP-003",
        role: "Field Biller & Delivery Executive",
        territory: "Whitefield & Outer Ring Road",
        email: "amit.sharma@sharmatraders.in",
        status: "Active",
        joiningStatus: "ACTIVE",
        attendanceStatus: "Punched Out",
        lastPunchIn: "2026-10-21T08:30:00.000Z",
        lastPunchOut: "2026-10-21T17:30:00.000Z",
        inviteToken: "INV-AMIT-ACTIVE",
        whatsAppInviteUrl: "https://wa.me/919811055667?text=Namaste%20Amit!%20Lekha%20Jokha%20App%20is%20ready.",
        targetMonthly: 450000,
        commissionRate: 3.5,
        stats: {
          dailySales: 31400,
          monthlySales: 460000,
          annualSales: 5120000,
          totalOrders: 104,
          traveledDistanceKm: 22.6,
          totalWorkingDuration: "9 hrs 00 mins",
          activeWorkingDuration: "7 hrs 45 mins",
          breakDuration: "1 hr 15 mins",
          firstActivity: "08:30 AM - Punch In at Whitefield Depot",
          lastActivity: "05:30 PM - Punch Out at Regional Hub",
          syncStatus: "Synced (Offline buffer clean)",
          missedPunches: "None"
        },
        punchInLocation: {
          lat: 28.6350,
          lng: 77.2250,
          address: "Whitefield Industrial Depot, Sector 62, New Delhi",
          time: "08:30 AM",
          accuracy: "10m"
        },
        punchOutLocation: {
          lat: 28.6360,
          lng: 77.2240,
          address: "Regional Hub Warehouse, Outer Ring Road",
          time: "05:30 PM",
          accuracy: "12m"
        },
        lastLocation: {
          lat: 28.6360,
          lng: 77.2240,
          address: "Regional Hub Warehouse, Outer Ring Road",
          timestamp: "2026-10-21T17:30:00.000Z",
          accuracy: 12
        },
        attendanceSessions: [
          {
            id: "ATT-1021-03",
            date: "2026-10-21",
            punchIn: "2026-10-21T08:30:00.000Z",
            punchOut: "2026-10-21T17:30:00.000Z",
            startLocation: { lat: 28.6350, lng: 77.2250, address: "Whitefield Depot" },
            endLocation: { lat: 28.6360, lng: 77.2240, address: "Regional Hub" },
            totalMinutes: 540,
            activeMinutes: 465,
            breakMinutes: 75,
            status: "Completed"
          }
        ],
        todayVisits: [
          {
            id: "VIS-21",
            partyName: "Apex Electronics Hub",
            time: "09:40 AM",
            purpose: "🚚 Heavy Delivery & Signature",
            notes: "Delivered 20 cartons. Signed challan received.",
            latitude: 28.6340,
            longitude: 77.2245,
            address: "Industrial Complex C-9",
            status: "Completed"
          }
        ]
      },
      {
        id: "SALES-004",
        name: "Priya Verma",
        phone: "+91 98234 56789",
        employeeId: "EMP-004",
        role: "Field Representative",
        territory: "South Delhi & Lajpat Nagar",
        email: "priya.verma@sharmatraders.in",
        status: "Active",
        joiningStatus: "JOINING PENDING",
        attendanceStatus: "Punched Out",
        lastPunchIn: null,
        lastPunchOut: null,
        inviteToken: "INV-PRIYA-NEW",
        whatsAppInviteUrl: "https://wa.me/919823456789?text=Namaste%20Priya!%20Join%20Sharma%20Traders%20on%20Lekha%20Jokha.",
        targetMonthly: 250000,
        commissionRate: 2.0,
        stats: {
          dailySales: 0,
          monthlySales: 0,
          annualSales: 0,
          totalOrders: 0,
          traveledDistanceKm: 0,
          totalWorkingDuration: "0 hrs 0 mins",
          activeWorkingDuration: "0 hrs 0 mins",
          breakDuration: "0 mins",
          firstActivity: "Awaiting App Download & Activation",
          lastActivity: "Invite Created Today",
          syncStatus: "Invite Pending Acceptance",
          missedPunches: "None (New Joiner)"
        },
        punchInLocation: { lat: null, lng: null, address: "Not yet punched in", time: null },
        punchOutLocation: { lat: null, lng: null, address: "N/A", time: null },
        lastLocation: { lat: 28.6139, lng: 77.2090, address: "South Delhi Territory", timestamp: new Date().toISOString() },
        attendanceSessions: [],
        todayVisits: []
      }
    ],
    auditLogs: [
      { id: "LOG-001", timestamp: "2026-10-15 10:30:12", userId: "U001", userName: "Sharma Ji (Admin)", action: "Created Tax Invoice", details: "Generated invoice INV-2026-001 for Gupta General Store (₹12,075.00)" },
      { id: "LOG-002", timestamp: "2026-10-15 11:40:05", userId: "U001", userName: "Sharma Ji (Admin)", action: "Generated e-Way Bill", details: "Generated official e-Way Bill #241098521094 for Vehicle DL-1L-4421" },
      { id: "LOG-003", timestamp: "2026-10-17 16:15:30", userId: "U002", userName: "Ramesh Kumar (Biller)", action: "Created Tax Invoice", details: "Generated invoice INV-2026-002 for Metro Retail Mart (₹14,220.50)" },
      { id: "LOG-004", timestamp: "2026-10-21 02:30:00", userId: "SALES-001", userName: "Ramesh Kumar (Field)", action: "Field Order Placed", details: "Booked order ORD-2026-002 for Metro Retail Mart (₹8,778.00)" }
    ]
  },
  {
    id: "BIZ-002",
    name: "Sharma Electronics & Appliances",
    tagline: "Consumer Tech, Appliances & Smart Devices",
    gstin: "07AAACS1234F1Z3",
    phone: "+91 98111 22334",
    email: "electronics.sharma@gmail.com",
    address: "Block C-4, Nehru Place Electronic Market",
    city: "New Delhi",
    state: "Delhi (07)",
    pincode: "110019",
    bankName: "ICICI Bank Ltd.",
    accountNumber: "001105009876",
    ifsc: "ICIC0000011",
    branch: "Nehru Place Branch, Delhi",
    upiId: "sharmaelectronics@icici",
    terms: "1. 1 Year Brand Warranty on all electronic items.\n2. Invoice mandatory for warranty claims.\n3. Defective items replaced within 7 days.",
    status: "Active",
    createdAt: "2026-02-01",
    parties: [
      { id: "P201", name: "Croma Retail Distribution", type: "Customer", phone: "9820011223", gstin: "07AAACC9988G1Z5", address: "Connaught Place, Delhi", state: "Delhi", balance: 54000, createdAt: "2026-02-10" },
      { id: "P202", name: "Samsung India Electronics Pvt Ltd", type: "Supplier", phone: "9830044556", gstin: "07AAACS7788H1Z8", address: "Gurugram Cyber Hub", state: "Haryana", balance: -85000, createdAt: "2026-02-12" }
    ],
    items: [
      { id: "ITM201", barcode: "890204000001", name: "Samsung 43-inch Crystal 4K UHD TV", category: "Televisions", hsn: "8528", salePrice: 28990, purchasePrice: 24500, gstRate: 18, unit: "PCS", stock: 12, minStock: 3 },
      { id: "ITM202", barcode: "890204000002", name: "LG 260L Double Door Smart Inverter Refrigerator", category: "Appliances", hsn: "8418", salePrice: 25490, purchasePrice: 21800, gstRate: 18, unit: "PCS", stock: 8, minStock: 2 },
      { id: "ITM203", barcode: "890204000003", name: "Voltas 1.5 Ton 5-Star Split Inverter AC", category: "Cooling", hsn: "8415", salePrice: 36990, purchasePrice: 31200, gstRate: 28, unit: "PCS", stock: 15, minStock: 4 }
    ],
    sales: [
      {
        id: "INV-ELEC-001",
        number: "INV-ELEC-001",
        docType: "Invoice",
        date: "2026-10-16",
        partyId: "P201",
        partyName: "Croma Retail Distribution",
        placeOfSupply: "DELHI (07)",
        paymentMode: "Bank / RTGS",
        items: [{ itemId: "ITM201", name: "Samsung 43-inch Crystal 4K UHD TV", hsn: "8528", qty: 2, rate: 28990, gstRate: 18, amount: 68416.4 }],
        subtotal: 57980,
        tax: 10436.4,
        total: 68416.4,
        paid: 68416.4,
        balance: 0,
        status: "Paid",
        notes: "Installation requested within 24 hours"
      }
    ],
    estimates: [],
    salesReturns: [],
    deliveryChallans: [],
    purchases: [
      {
        id: "PUR-ELEC-001",
        number: "PUR-ELEC-001",
        date: "2026-10-08",
        partyId: "P202",
        partyName: "Samsung India Electronics Pvt Ltd",
        paymentMode: "Bank / NEFT",
        items: [{ itemId: "ITM201", name: "Samsung 43-inch Crystal 4K UHD TV", qty: 5, rate: 24500, gstRate: 18, amount: 144550 }],
        subtotal: 122500,
        tax: 22050,
        total: 144550,
        paid: 100000,
        balance: 44550,
        status: "Partial"
      }
    ],
    purchaseOrders: [],
    stockAdjustments: [],
    expenses: [
      { id: "EXP-E201", date: "2026-10-02", category: "Showroom Maintenance", description: "Display lighting & AC maintenance", amount: 4500, paymentMode: "Bank Transfer", ref: "MAINT/ELEC/01" }
    ],
    cashBank: {
      cashInHand: 28500,
      bankAccounts: [{ id: "BANK-02", name: "ICICI Current A/c", accountNo: "001105009876", ifsc: "ICIC0000011", balance: 520000 }],
      hdfcBank: 520000,
      contraTransfers: []
    },
    ewayBills: [],
    auditLogs: [
      { id: "LOG-E01", timestamp: "2026-10-16 14:20:00", userId: "U001", userName: "Sharma Ji (Admin)", action: "Created Tax Invoice", details: "Generated electronics invoice INV-ELEC-001 for Croma Retail (₹68,416.40)" }
    ]
  },
  {
    id: "BIZ-003",
    name: "Royal Garments & Textiles",
    tagline: "Fine Fabrics, Ethnic Wear & Apparel Export",
    gstin: "27AABCR9988G1Z1",
    phone: "+91 98222 33445",
    email: "royalgarments.mumbai@gmail.com",
    address: "Galas 14-16, Kalbadevi Textile Market",
    city: "Mumbai",
    state: "Maharashtra (27)",
    pincode: "400002",
    bankName: "Axis Bank Ltd.",
    accountNumber: "91802000334455",
    ifsc: "UTIB0000918",
    branch: "Kalbadevi Branch, Mumbai",
    upiId: "royalgarments@axisbank",
    terms: "1. No claims accepted after cutting or washing.\n2. Goods strictly per standard GSM specs.",
    status: "Active",
    createdAt: "2026-03-01",
    parties: [
      { id: "P301", name: "Bombay Fashion Emporium", type: "Customer", phone: "9820556677", gstin: "27AAACB4433D1Z9", address: "Colaba Causeway, Mumbai", state: "Maharashtra", balance: 38000, createdAt: "2026-03-05" }
    ],
    items: [
      { id: "ITM301", barcode: "890305000001", name: "Pure Silk Chanderi Saree Fabric (6.5 Mtr)", category: "Ethnic", hsn: "5007", salePrice: 4200, purchasePrice: 3100, gstRate: 5, unit: "PCS", stock: 24, minStock: 5 },
      { id: "ITM302", barcode: "890305000002", name: "Linen Premium Suiting Fabric (3 Mtr)", category: "Fabrics", hsn: "5309", salePrice: 2800, purchasePrice: 1950, gstRate: 5, unit: "PCS", stock: 30, minStock: 8 }
    ],
    sales: [
      {
        id: "INV-TEXT-001",
        number: "INV-TEXT-001",
        docType: "Invoice",
        date: "2026-10-14",
        partyId: "P301",
        partyName: "Bombay Fashion Emporium",
        placeOfSupply: "MAHARASHTRA (27)",
        paymentMode: "Bank / UPI",
        items: [{ itemId: "ITM301", name: "Pure Silk Chanderi Saree Fabric (6.5 Mtr)", hsn: "5007", qty: 5, rate: 4200, gstRate: 5, amount: 22050 }],
        subtotal: 21000,
        tax: 1050,
        total: 22050,
        paid: 22050,
        balance: 0,
        status: "Paid",
        notes: "Direct courier delivered"
      }
    ],
    estimates: [],
    salesReturns: [],
    deliveryChallans: [],
    purchases: [],
    purchaseOrders: [],
    stockAdjustments: [],
    expenses: [],
    cashBank: {
      cashInHand: 15400,
      bankAccounts: [{ id: "BANK-03", name: "Axis Current A/c", accountNo: "91802000334455", ifsc: "UTIB0000918", balance: 210500 }],
      hdfcBank: 210500,
      contraTransfers: []
    },
    ewayBills: [],
    auditLogs: []
  }
];

// Unified Data Store Controller
class DataStore {
  constructor() {
    this.data = this.load();
    this.lastSyncTime = 0;
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.initAuthSession();
      }, 500);
    }
  }

  async initAuthSession() {
    try {
      const existingToken = (typeof localStorage !== 'undefined' && localStorage.getItem('lekhajokha_auth_token')) || '';
      if (existingToken) {
        const meRes = await window.apiFetch('/api/v1/auth/me');
        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          if (!this.data) this.data = {};
          if (meData && Array.isArray(meData.businesses)) {
            this.data.businesses = meData.businesses;
          }
          if (meData && meData.activeBusiness && meData.activeBusiness.id) {
            localStorage.setItem('lekhajokha_active_business_id', meData.activeBusiness.id);
            if (!this.data.subscriber) {
              this.data.subscriber = { name: meData.subscriber?.name || meData.user?.name || 'Admin' };
            }
            this.data.subscriber.activeBusinessId = meData.activeBusiness.id;
            if (!this.data.businesses.some(b => b.id === meData.activeBusiness.id)) {
              this.data.businesses.unshift(meData.activeBusiness);
            }
          }
          if (meData.user) {
            localStorage.setItem('lekhajokha_current_user', JSON.stringify(meData.user));
            if (!this.data) this.data = {};
            this.data.currentUserId = meData.user.id;
            if (!this.data.users) this.data.users = [];
            const idx = this.data.users.findIndex(u => u.id === meData.user.id || (u.email && u.email === meData.user.email));
            if (idx !== -1) {
              this.data.users[idx] = { ...this.data.users[idx], ...meData.user };
            } else {
              this.data.users.unshift(meData.user);
            }
          }
          await this.syncWithServer();
          window.dispatchEvent(new CustomEvent('lekhajokha:authenticated', { 
            detail: { ...meData, isRefresh: true, isSessionRestore: true } 
          }));
          return;
        } else {
          // Token is invalid/revoked or account suspended - clean up
          localStorage.removeItem('lekhajokha_auth_token');
          localStorage.removeItem('lekhajokha_current_user');
          localStorage.removeItem('lekhajokha_active_business_id');
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // If no valid session exists, do NOT auto-login as anyone! Prompt for authentication.
      this.data = {
        subscriber: null,
        businesses: [],
        users: [],
        currentUserId: null
      };
      window.dispatchEvent(new CustomEvent('lekhajokha:unauthenticated'));
    } catch (authErr) {
      console.warn("LekhaJokha Central Session Init deferred (offline/local mode):", authErr);
    }
  }

  async pushMutation(entity, action, data) {
    const activeBizId = this.getActiveBusinessId();
    const mutation = {
      mutationId: 'MUT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      entity,
      action,
      businessId: activeBizId,
      data,
      timestamp: Date.now()
    };

    try {
      const res = await window.apiFetch('/api/v1/sync', {
        method: 'POST',
        body: JSON.stringify({ mutations: [mutation] })
      });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err) {
      console.warn('Central sync deferred (queued for retry):', err);
      if (typeof localStorage !== 'undefined') {
        const queue = JSON.parse(localStorage.getItem('lekhajokha_pending_mutations') || '[]');
        queue.push(mutation);
        localStorage.setItem('lekhajokha_pending_mutations', JSON.stringify(queue));
      }
    }
  }

  async syncWithServer() {
    if (typeof localStorage === 'undefined') return;
    const token = localStorage.getItem('lekhajokha_auth_token');
    if (!token) return;
    const activeBizId = this.getActiveBusinessId();

    // 1. Flush queued offline mutations if any
    try {
      const rawQueue = localStorage.getItem('lekhajokha_pending_mutations');
      if (rawQueue) {
        const queue = JSON.parse(rawQueue);
        if (Array.isArray(queue) && queue.length > 0) {
          const flushRes = await window.apiFetch('/api/v1/sync', {
            method: 'POST',
            body: JSON.stringify({ mutations: queue })
          });
          if (flushRes && flushRes.ok) {
            localStorage.removeItem('lekhajokha_pending_mutations');
          }
        }
      }
    } catch (qErr) {
      console.warn('Flushing offline mutations deferred:', qErr);
    }

    // 2. Pull latest server-authoritative delta for the active business
    try {
      const lastSync = this.lastSyncTime || 0;
      const pullRes = await window.apiFetch(`/api/v1/sync/pull?businessId=${encodeURIComponent(activeBizId)}&lastSyncTime=${lastSync}`);
      if (pullRes && pullRes.ok) {
        const pullData = await pullRes.json();
        if (pullData && pullData.success && pullData.businessData) {
          this.lastSyncTime = pullData.serverTime || Date.now();
          const activeBiz = this.getActiveBusiness();
          if (activeBiz) {
            ['sales', 'items', 'parties', 'purchases', 'expenses', 'orders', 'ewayBills'].forEach(key => {
              if (pullData.businessData[key] && Array.isArray(pullData.businessData[key])) {
                if (!activeBiz[key]) activeBiz[key] = [];
                pullData.businessData[key].forEach(remoteItem => {
                  const existingIdx = activeBiz[key].findIndex(l => l.id === remoteItem.id || (l.number && l.number === remoteItem.number));
                  if (existingIdx !== -1) {
                    activeBiz[key][existingIdx] = remoteItem;
                  } else {
                    activeBiz[key].unshift(remoteItem);
                  }
                });
              }
            });
            this.save();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('lekhajokha:data-synced'));
            }
          }
        }
      }
    } catch (pullErr) {
      console.warn('Server delta pull deferred:', pullErr);
    }
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.subscriber) parsed.subscriber = initialSubscriber;
        if (!parsed.businesses || parsed.businesses.length === 0) parsed.businesses = defaultBusinesses;
        if (!parsed.users) parsed.users = this.getDefaultUsers();
        if (!parsed.currentUserId) parsed.currentUserId = "U001";
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse LocalStorage data, using enterprise defaults", e);
    }
    const defaultStore = {
      subscriber: initialSubscriber,
      businesses: defaultBusinesses,
      users: this.getDefaultUsers(),
      currentUserId: "U001"
    };
    this.save(defaultStore);
    return defaultStore;
  }

  getDefaultUsers() {
    let adminName = "Admin";
    try {
      const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('lekhajokha_current_user')) || '';
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name && parsed.name !== 'Sharma Ji') {
          adminName = parsed.name;
        } else if (parsed.name) {
          adminName = parsed.name;
        }
      }
    } catch (e) {}

    if (this.data && this.data.subscriber && this.data.subscriber.name && this.data.subscriber.name !== 'Sharma Ji') {
      adminName = this.data.subscriber.name;
    }

    return [
      { id: "U001", name: adminName, role: "Admin", title: "Business Owner", email: "admin@lekhajokha.in", phone: "+91 98765 43210", avatar: "👨‍💼", pin: "1234", status: "Active", permissions: ["all"] },
      { id: "U002", name: "Ramesh Kumar", role: "Biller", title: "Counter Cashier & Biller", email: "ramesh.billing@store.in", phone: "+91 98123 45678", avatar: "🧑‍💻", pin: "0000", status: "Active", permissions: ["create_sale", "view_items", "view_parties", "print_invoice", "barcode_scan"] },
      { id: "U003", name: "Priya Singh", role: "Accountant", title: "Chartered Accountant", email: "priya.accounts@store.in", phone: "+91 98234 56789", avatar: "👩‍💼", pin: "2222", status: "Active", permissions: ["view_reports", "create_sale", "create_purchase", "manage_expenses", "cash_bank", "eway_bill"] },
      { id: "U004", name: "Aman Verma", role: "Sales", title: "Field Sales Representative", email: "aman.sales@store.in", phone: "+91 98345 67890", avatar: "👔", pin: "3333", status: "Active", permissions: ["create_sale", "view_items", "view_parties"] }
    ];
  }

  save(dataToSave) {
    if (dataToSave) {
      this.data = dataToSave;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("LocalStorage quota full or disabled; persisting to IndexedDB asynchronously", e);
    }

    // Persist to IndexedDB asynchronously
    if (window.LekhaJokhaDB) {
      setTimeout(() => {
        try {
          const activeBiz = this.getActiveBusiness();
          if (activeBiz) {
            if (activeBiz.sales) window.LekhaJokhaDB.bulkPut('sales', activeBiz.sales);
            if (activeBiz.items) window.LekhaJokhaDB.bulkPut('items', activeBiz.items);
            if (activeBiz.parties) window.LekhaJokhaDB.bulkPut('parties', activeBiz.parties);
            if (activeBiz.ewayBills) window.LekhaJokhaDB.bulkPut('ewayBills', activeBiz.ewayBills);
            if (activeBiz.auditLogs) window.LekhaJokhaDB.bulkPut('auditLogs', activeBiz.auditLogs);
          }
        } catch (idbErr) {
          // Non-blocking
        }
      }, 0);
    }
  }

  // --- Central Unified Authentication & Cross-Platform Synchronization ---
  getAuthToken() {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('lekhajokha_auth_token')) || null;
  }

  async checkAuth() {
    const token = this.getAuthToken();
    if (!token) return false;
    try {
      const res = await window.apiFetch('/api/v1/auth/me');
      if (res.ok) {
        const payload = await res.json();
        if (payload.authenticated) {
          localStorage.setItem('lekhajokha_current_user', JSON.stringify(payload.user));
          if (payload.activeBusinessId) {
            localStorage.setItem('lekhajokha_active_business_id', payload.activeBusinessId);
            if (this.data.subscriber) {
              this.data.subscriber.activeBusinessId = payload.activeBusinessId;
            }
          }
          await this.syncWithServer();
          return true;
        }
      }
    } catch (err) {
      console.warn("Session check offline or error:", err);
    }
    return false;
  }

  async login(credentials) {
    let payload = {};
    if (typeof credentials === 'string') {
      payload = { pin: credentials, userId: 'U001' };
    } else {
      payload = { ...credentials };
    }
    payload.platform = 'Web';
    payload.deviceName = 'Web Desktop Client';

    const res = await window.apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || data.message || 'Login failed');
    }

    const explicitName = (credentials.name || credentials.adminName || '').trim();
    if (explicitName && data.user) {
      data.user.name = explicitName;
    }
    if (explicitName && data.subscriber) {
      data.subscriber.name = explicitName;
    }

    localStorage.setItem('lekhajokha_auth_token', data.token);
    localStorage.setItem('lekhajokha_active_business_id', data.activeBusinessId);
    localStorage.setItem('lekhajokha_current_user', JSON.stringify(data.user));
    if (!this.data) this.data = {};
    if (data.user) {
      this.data.currentUserId = data.user.id;
      if (!this.data.users) this.data.users = [];
      const idx = this.data.users.findIndex(u => u.id === data.user.id || (u.email && u.email === data.user.email) || (u.role === 'Admin' || u.role === 'Owner'));
      if (idx !== -1) {
        this.data.users[idx] = { ...this.data.users[idx], ...data.user };
      } else {
        this.data.users.unshift(data.user);
      }
    }
    if (Array.isArray(data.businesses)) {
      this.data.businesses = data.businesses;
    }
    const resolvedActive = data.activeBusiness || data.business || (Array.isArray(data.businesses) && data.businesses.find(b => b.id === data.activeBusinessId));
    if (resolvedActive && !this.data.businesses.some(b => b.id === resolvedActive.id)) {
      this.data.businesses.unshift(resolvedActive);
    }
    if (!this.data.subscriber) {
      this.data.subscriber = { name: data.user?.name || explicitName || 'Admin' };
    } else if (data.user?.name) {
      this.data.subscriber.name = data.user.name;
    }
    this.data.subscriber.activeBusinessId = data.activeBusinessId;
    await this.syncWithServer();
    window.dispatchEvent(new CustomEvent('lekhajokha:authenticated', { detail: { ...data, isInteractiveLogin: true } }));
    return data;
  }

  async register(details) {
    const payload = {
      ...details,
      platform: 'Web',
      deviceName: 'Web Desktop Client'
    };
    const res = await window.apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || data.message || 'Registration failed');
    }

    localStorage.setItem('lekhajokha_auth_token', data.token);
    localStorage.setItem('lekhajokha_active_business_id', data.business.id);
    localStorage.setItem('lekhajokha_current_user', JSON.stringify(data.user));
    if (!this.data) this.data = {};
    if (Array.isArray(data.businesses)) {
      this.data.businesses = data.businesses;
    }
    if (data.business && !this.data.businesses.some(b => b.id === data.business.id)) {
      this.data.businesses.unshift(data.business);
    }
    if (!this.data.subscriber) {
      this.data.subscriber = { name: data.user?.name || 'Admin' };
    }
    this.data.subscriber.activeBusinessId = data.business.id;
    await this.syncWithServer();
    window.dispatchEvent(new CustomEvent('lekhajokha:authenticated', { detail: { ...data, isInteractiveLogin: true } }));
    return data;
  }

  async sendOtp(phone, purpose = 'login') {
    const res = await window.apiFetch('/api/v1/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to send OTP');
    }
    return data;
  }

  async verifyOtp(phone, otp, details = {}) {
    const payload = {
      phone,
      otp,
      platform: 'Web',
      deviceName: 'Web Desktop Client',
      ...details
    };
    const res = await window.apiFetch('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to verify OTP');
    }

    const explicitName = (details.name || details.adminName || '').trim();
    if (explicitName && data.user) {
      data.user.name = explicitName;
    }
    if (explicitName && data.subscriber) {
      data.subscriber.name = explicitName;
    }

    localStorage.setItem('lekhajokha_auth_token', data.token);
    localStorage.setItem('lekhajokha_active_business_id', data.activeBusinessId);
    localStorage.setItem('lekhajokha_current_user', JSON.stringify(data.user));
    if (!this.data) this.data = {};
    if (data.user) {
      this.data.currentUserId = data.user.id;
      if (!this.data.users) this.data.users = [];
      const idx = this.data.users.findIndex(u => u.id === data.user.id || (u.phone && u.phone === data.user.phone) || (u.role === 'Admin' || u.role === 'Owner'));
      if (idx !== -1) {
        this.data.users[idx] = { ...this.data.users[idx], ...data.user };
      } else {
        this.data.users.unshift(data.user);
      }
    }
    if (Array.isArray(data.businesses)) {
      this.data.businesses = data.businesses;
    }
    const resolvedActive = data.activeBusiness || data.business || (Array.isArray(data.businesses) && data.businesses.find(b => b.id === data.activeBusinessId));
    if (resolvedActive && !this.data.businesses.some(b => b.id === resolvedActive.id)) {
      this.data.businesses.unshift(resolvedActive);
    }
    if (!this.data.subscriber) {
      this.data.subscriber = { name: data.user?.name || explicitName || 'Admin' };
    } else if (data.user?.name) {
      this.data.subscriber.name = data.user.name;
    }
    this.data.subscriber.activeBusinessId = data.activeBusinessId;
    await this.syncWithServer();
    window.dispatchEvent(new CustomEvent('lekhajokha:authenticated', { detail: { ...data, isInteractiveLogin: true } }));
    return data;
  }

  async updateAdminName(newName) {
    if (!newName || !newName.trim()) return;
    const name = newName.trim();
    const current = this.getCurrentUser();
    if (current) {
      current.name = name;
      localStorage.setItem('lekhajokha_current_user', JSON.stringify(current));
    }
    if (this.data) {
      if (this.data.subscriber) this.data.subscriber.name = name;
      if (Array.isArray(this.data.users)) {
        this.data.users.forEach(u => {
          if (u.role === 'Admin' || u.role === 'Owner' || (current && u.id === current.id)) {
            u.name = name;
          }
        });
      }
      this.save();
    }
    try {
      await window.apiFetch('/api/v1/auth/user/update-name', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('userSwitched', { detail: current }));
    return current;
  }

  async updateMobileNumber(newPhone, otp) {
    const res = await window.apiFetch('/api/v1/auth/user/update-mobile', {
      method: 'POST',
      body: JSON.stringify({ newPhone, otp })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update mobile number');
    }
    if (data.user) {
      localStorage.setItem('lekhajokha_current_user', JSON.stringify(data.user));
    }
    return data;
  }

  async getBusinessMembers() {
    const res = await window.apiFetch('/api/v1/business/members');
    if (!res.ok) throw new Error('Failed to fetch business members');
    return await res.json();
  }

  async getBusinessInvitations() {
    const res = await window.apiFetch('/api/v1/business/invitations');
    if (!res.ok) throw new Error('Failed to fetch business invitations');
    return await res.json();
  }

  async createBusinessInvitation(inviteData) {
    const res = await window.apiFetch('/api/v1/business/invitations', {
      method: 'POST',
      body: JSON.stringify(inviteData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to send invitation');
    }
    return data;
  }

  async acceptBusinessInvitation(inviteToken) {
    const res = await window.apiFetch('/api/v1/business/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ inviteToken })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to accept invitation');
    }
    return data;
  }

  async revokeBusinessMember(userId) {
    const res = await window.apiFetch(`/api/v1/business/members/${userId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to revoke member');
    }
    return data;
  }

  async logout() {
    try {
      await window.apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API error:', e);
    }
    localStorage.removeItem('lekhajokha_auth_token');
    localStorage.removeItem('lekhajokha_current_user');
    localStorage.removeItem('lekhajokha_active_business_id');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('lekhajokha_pending_mutations');
    this.data = {
      subscriber: null,
      businesses: [],
      users: [],
      currentUserId: null
    };
    window.dispatchEvent(new CustomEvent('lekhajokha:unauthenticated'));
  }

  async logoutAll() {
    try {
      await window.apiFetch('/api/v1/auth/logout-all', { method: 'POST' });
    } catch (e) {
      console.warn('LogoutAll API error:', e);
    }
    localStorage.removeItem('lekhajokha_auth_token');
    localStorage.removeItem('lekhajokha_current_user');
    localStorage.removeItem('lekhajokha_active_business_id');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('lekhajokha_pending_mutations');
    this.data = {
      subscriber: null,
      businesses: [],
      users: [],
      currentUserId: null
    };
    window.dispatchEvent(new CustomEvent('lekhajokha:unauthenticated'));
  }

  async getSessions() {
    const res = await window.apiFetch('/api/v1/auth/sessions');
    if (!res.ok) throw new Error('Failed to load active sessions');
    return await res.json();
  }

  async revokeSession(sessionId) {
    const res = await window.apiFetch('/api/v1/auth/sessions/revoke', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
    if (!res.ok) throw new Error('Failed to revoke session');
    return await res.json();
  }

  async syncWithServer() {
    try {
      // 1. Fetch accessible businesses list for active session
      const bListRes = await window.apiFetch('/api/v1/businesses');
      if (bListRes && bListRes.ok) {
        const bListData = await bListRes.json();
        if (bListData && Array.isArray(bListData.businesses)) {
          this.data.businesses = bListData.businesses;
        }
      }

      // 2. Fetch current business tenant details & records
      const res = await window.apiFetch('/api/v1/business/current');
      if (res && res.ok) {
        const payload = await res.json();
        const serverBiz = payload.business;
        const serverData = payload.data;
        if (payload.subscriber && !this.data.subscriber) {
          this.data.subscriber = payload.subscriber;
        }
        if (serverBiz && serverData) {
          let localBiz = (this.data.businesses || []).find(b => b.id === serverBiz.id);
          if (!localBiz) {
            localBiz = { ...serverBiz };
            this.data.businesses.push(localBiz);
          }
          Object.assign(localBiz, serverBiz);

          // Non-destructive reconciliation merge: ensures local additions/edits are never lost
          const mergeCollections = (localArr = [], serverArr = []) => {
            if (!Array.isArray(serverArr) || serverArr.length === 0) {
              return Array.isArray(localArr) ? localArr : [];
            }
            const map = new Map();
            // Retain local records first
            for (const item of (localArr || [])) {
              if (item && item.id) map.set(item.id, item);
            }
            // Merge authoritative server records
            for (const serverItem of serverArr) {
              if (serverItem && serverItem.id) {
                const existing = map.get(serverItem.id);
                if (!existing) {
                  map.set(serverItem.id, serverItem);
                } else {
                  // Merge while preserving locally pending non-empty fields
                  map.set(serverItem.id, { ...existing, ...serverItem });
                }
              }
            }
            return Array.from(map.values());
          };

          localBiz.items = mergeCollections(localBiz.items, serverData.items);
          localBiz.parties = mergeCollections(localBiz.parties, serverData.parties);
          localBiz.sales = mergeCollections(localBiz.sales, serverData.sales);
          localBiz.purchases = mergeCollections(localBiz.purchases, serverData.purchases);
          localBiz.expenses = mergeCollections(localBiz.expenses, serverData.expenses);
          localBiz.orders = mergeCollections(localBiz.orders, serverData.orders);
          localBiz.estimates = mergeCollections(localBiz.estimates, serverData.estimates);
          localBiz.tasks = mergeCollections(localBiz.tasks, serverData.tasks);
          localBiz.leads = mergeCollections(localBiz.leads, serverData.leads);
          localBiz.salesmen = mergeCollections(localBiz.salesmen, serverData.salesmen);
          
          if (serverData.cashBank && typeof serverData.cashBank === 'object') {
            localBiz.cashBank = { ...localBiz.cashBank, ...serverData.cashBank };
          }

          this.save();
          window.dispatchEvent(new CustomEvent('dataSynced', { detail: { businessId: serverBiz.id } }));
        }
      }
    } catch (err) {
      console.warn('Background sync with server deferred:', err);
    }
  }

  startAutoSync(intervalMs = 20000) {
    if (this._syncTimer) clearInterval(this._syncTimer);
    this._syncTimer = setInterval(() => {
      if (this.getAuthToken()) {
        this.syncWithServer();
      }
    }, intervalMs);

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        if (this.getAuthToken()) this.syncWithServer();
      });
      window.addEventListener('online', () => {
        if (this.getAuthToken()) this.syncWithServer();
      });
    }
  }

  // --- SaaS Subscription & Entitlements ---
  getSubscriber() {
    return this.data.subscriber || initialSubscriber;
  }

  getPlans() {
    return SAAS_PLANS;
  }

  getActivePlan() {
    const subscriber = this.getSubscriber();
    return SAAS_PLANS[subscriber.plan] || SAAS_PLANS.Free;
  }

  canAddBusiness() {
    const plan = this.getActivePlan();
    const maxAllowed = Math.max(5, plan.maxBusinesses || 5);
    const currentCount = (this.getBusinesses() || []).filter(b => b.status !== 'Deactivated').length;
    return {
      allowed: currentCount < maxAllowed,
      currentCount,
      maxAllowed,
      planName: plan.name
    };
  }

  upgradeSubscription(newPlanName, paymentReference = null) {
    const targetPlan = SAAS_PLANS[newPlanName];
    if (!targetPlan) throw new Error(`Unknown plan ${newPlanName}`);

    this.data.subscriber.plan = newPlanName;
    this.data.subscriber.planActivatedAt = new Date().toISOString().split('T')[0];
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    this.data.subscriber.planExpiresAt = expiry.toISOString().split('T')[0];

    this.logAction("Upgraded Subscription Plan", `Subscribed to ${targetPlan.name} (Ref: ${paymentReference || 'Online UPI Payment'})`);
    this.save();
    return {
      success: true,
      subscriber: this.data.subscriber,
      plan: targetPlan
    };
  }

  // --- Multi-Business Management ---
  getBusinesses() {
    if (this.data && Array.isArray(this.data.businesses) && this.data.businesses.length > 0) {
      return this.data.businesses;
    }
    return this.getAuthToken() ? [] : defaultBusinesses;
  }

  getActiveBusinessId() {
    const storedActive = (typeof localStorage !== 'undefined' && localStorage.getItem('lekhajokha_active_business_id')) || '';
    if (storedActive && this.getBusinesses().some(b => b.id === storedActive)) {
      return storedActive;
    }
    if (this.data && this.data.subscriber && this.data.subscriber.activeBusinessId) {
      const subActive = this.data.subscriber.activeBusinessId;
      if (this.getBusinesses().some(b => b.id === subActive)) {
        return subActive;
      }
    }
    if (storedActive) {
      return storedActive;
    }
    return (this.getBusinesses()[0] && this.getBusinesses()[0].id) || "BIZ-001";
  }

  getActiveBusiness() {
    const activeId = this.getActiveBusinessId();
    let biz = this.getBusinesses().find(b => b.id === activeId);
    if (!biz) {
      biz = this.getBusinesses()[0] || null;
      if (biz) {
        if (!this.data) this.data = {};
        if (!this.data.subscriber) this.data.subscriber = {};
        this.data.subscriber.activeBusinessId = biz.id;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('lekhajokha_active_business_id', biz.id);
        }
      }
    }
    return biz;
  }

  async setActiveBusiness(bizId) {
    // 1. Switch active business on backend first to verify authorization
    const res = await window.apiFetch('/api/v1/businesses/switch', {
      method: 'POST',
      body: JSON.stringify({ businessId: bizId })
    });
    if (!res || !res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Failed to switch to business ${bizId}`);
    }
    const switchData = await res.json();

    // 2. Set active business context locally
    if (!this.data) this.data = {};
    if (!this.data.subscriber) this.data.subscriber = {};
    this.data.subscriber.activeBusinessId = bizId;
    localStorage.setItem('lekhajokha_active_business_id', bizId);

    // 3. Immediately pull and hydrate authoritative business data
    await this.syncWithServer();

    let biz = this.getBusinesses().find(b => b.id === bizId) || switchData.business;
    this.logAction("Switched Active Business", `Switched active organization to ${biz.name} (GSTIN: ${biz.gstin || 'Unregistered'})`);
    this.save();

    // 4. Dispatch notification to UI components
    window.dispatchEvent(new CustomEvent('businessSwitched', { detail: { business: biz } }));
    return biz;
  }

  addBusiness(bizData) {
    const check = this.canAddBusiness();
    if (!check.allowed) {
      const err = new Error(`PLAN_LIMIT_REACHED: Your ${check.planName} plan allows up to ${check.maxAllowed} businesses. Please upgrade your subscription to add more businesses.`);
      err.code = 'PLAN_LIMIT_REACHED';
      err.currentCount = check.currentCount;
      err.maxAllowed = check.maxAllowed;
      throw err;
    }

    const existingIds = new Set((this.data.businesses || []).map(b => b.id));
    let count = (this.data.businesses || []).length + 1;
    while (existingIds.has(`BIZ-${String(count).padStart(3, '0')}`)) {
      count++;
    }
    const newId = `BIZ-${String(count).padStart(3, '0')}`;
    const newBiz = {
      id: newId,
      name: bizData.name,
      tagline: bizData.tagline || 'General Merchandise & Trade',
      gstin: bizData.gstin || '',
      phone: bizData.phone || this.data.subscriber.phone,
      email: bizData.email || this.data.subscriber.email,
      address: bizData.address || '',
      city: bizData.city || 'New Delhi',
      state: bizData.state || 'Delhi (07)',
      pincode: bizData.pincode || '',
      bankName: bizData.bankName || 'State Bank of India',
      accountNumber: bizData.accountNumber || '',
      ifsc: bizData.ifsc || '',
      branch: bizData.branch || '',
      upiId: bizData.upiId || '',
      terms: bizData.terms || '1. Goods once sold will not be returned.\n2. Subject to local jurisdiction only.',
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      parties: [],
      items: [],
      sales: [],
      estimates: [],
      salesReturns: [],
      deliveryChallans: [],
      purchases: [],
      purchaseOrders: [],
      stockAdjustments: [],
      expenses: [],
      cashBank: {
        cashInHand: Number(bizData.openingCash) || 10000,
        bankAccounts: [
          { id: 'BANK-01', name: bizData.bankName || 'Main Bank A/c', accountNo: bizData.accountNumber || '000000000', ifsc: bizData.ifsc || '', balance: Number(bizData.openingBank) || 50000 }
        ],
        hdfcBank: Number(bizData.openingBank) || 50000,
        contraTransfers: []
      },
      ewayBills: [],
      auditLogs: [
        { id: 'LOG-INIT', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), userId: 'SYSTEM', userName: 'System', action: 'Business Created', details: `Created business entity ${bizData.name}` }
      ]
    };

    this.data.businesses.push(newBiz);
    this.logAction("Created New Business", `Added business ${newBiz.name} (GSTIN: ${newBiz.gstin || 'Unregistered'})`);
    this.save();
    return newBiz;
  }

  updateBusinessProfile(bizId, updates) {
    const biz = this.getBusinesses().find(b => b.id === bizId);
    if (!biz) throw new Error("Business not found");
    Object.assign(biz, updates);
    this.logAction("Updated Business Profile", `Modified contact/tax profile for ${biz.name}`);
    this.save();
    return biz;
  }

  deactivateBusiness(bizId) {
    if (this.data.businesses.length <= 1) {
      throw new Error("Cannot deactivate the only remaining business.");
    }
    const biz = this.getBusinesses().find(b => b.id === bizId);
    if (!biz) throw new Error("Business not found");
    biz.status = 'Deactivated';
    if (this.getActiveBusinessId() === bizId) {
      const activeOne = this.data.businesses.find(b => b.status === 'Active');
      if (activeOne) {
        this.setActiveBusiness(activeOne.id);
      }
    }
    this.logAction("Deactivated Business", `Deactivated business ${biz.name}`);
    this.save();
    return biz;
  }

  // --- Current Active Business Entity Facades ---
  getBusiness() {
    return this.getActiveBusiness();
  }

  updateBusiness(updatedProfile) {
    const activeBiz = this.getActiveBusiness();
    return this.updateBusinessProfile(activeBiz.id, updatedProfile);
  }

  // --- Parties (Scoped to Active Business) ---
  getParties() {
    return this.getActiveBusiness().parties || [];
  }

  getParty(id) {
    return this.getParties().find(p => p.id === id);
  }

  addParty(party) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.parties) activeBiz.parties = [];
    const newId = "P" + String(activeBiz.parties.length + 1).padStart(3, '0');
    const newParty = {
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      balance: Number(party.balance) || 0,
      ...party
    };
    activeBiz.parties.unshift(newParty);
    this.logAction("Added Party", `Created ${newParty.type} profile for ${newParty.name}`);
    this.save();

    // Sync to authoritative central backend
    window.apiFetch('/api/v1/parties', {
      method: 'POST',
      body: JSON.stringify(newParty)
    }).catch(e => console.warn('Central parties sync deferred:', e));

    return newParty;
  }

  updateParty(id, partyUpdates) {
    const activeBiz = this.getActiveBusiness();
    const idx = (activeBiz.parties || []).findIndex(p => p.id === id);
    if (idx !== -1) {
      activeBiz.parties[idx] = { ...activeBiz.parties[idx], ...partyUpdates };
      this.logAction("Updated Party", `Modified party record for ${activeBiz.parties[idx].name}`);
      this.save();

      // Sync to authoritative central backend
      window.apiFetch('/api/v1/parties', {
        method: 'POST',
        body: JSON.stringify(activeBiz.parties[idx])
      }).catch(e => console.warn('Central parties update sync deferred:', e));

      return activeBiz.parties[idx];
    }
    return null;
  }

  // --- Items & Inventory (Scoped to Active Business) ---
  getItems() {
    return this.getActiveBusiness().items || [];
  }

  getItem(id) {
    return this.getItems().find(i => i.id === id);
  }

  getItemByBarcode(barcode) {
    if (!barcode) return null;
    const clean = String(barcode).trim().toLowerCase();
    return this.getItems().find(i => String(i.barcode || '').trim().toLowerCase() === clean);
  }

  addItem(item) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.items) activeBiz.items = [];

    // Collision-safe ID generation: Find maximum existing integer ID
    let maxNum = 0;
    for (const it of activeBiz.items) {
      const match = String(it.id || '').match(/(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    }
    const nextNum = Math.max(maxNum + 1, activeBiz.items.length + 1);
    const newId = item.id || ("ITM" + String(nextNum).padStart(3, '0'));
    const barcode = item.barcode || ("890103" + String(nextNum).padStart(6, '0'));

    const newItem = {
      id: newId,
      barcode,
      ...item,
      salePrice: Number(item.salePrice || 0),
      purchasePrice: Number(item.purchasePrice || 0),
      gstRate: Number(item.gstRate || 0),
      stock: Number(item.stock || 0),
      minStock: Number(item.minStock || 5)
    };

    // Upsert pattern: check if item with ID or Barcode already exists
    const existingIdx = activeBiz.items.findIndex(i => i.id === newItem.id || (newItem.barcode && i.barcode === newItem.barcode));
    if (existingIdx !== -1) {
      activeBiz.items[existingIdx] = { ...activeBiz.items[existingIdx], ...newItem };
    } else {
      activeBiz.items.unshift(newItem);
    }

    this.logAction("Added Inventory Item", `Created item ${newItem.name} (ID: ${newItem.id}, Barcode: ${barcode})`);
    this.save();

    // Sync to authoritative central backend
    window.apiFetch('/api/v1/items', {
      method: 'POST',
      body: JSON.stringify(newItem)
    }).catch(e => console.warn('Central items sync deferred:', e));

    return newItem;
  }

  updateItem(id, itemUpdates) {
    const activeBiz = this.getActiveBusiness();
    const idx = (activeBiz.items || []).findIndex(i => i.id === id);
    if (idx !== -1) {
      activeBiz.items[idx] = { ...activeBiz.items[idx], ...itemUpdates };
      this.logAction("Updated Item", `Edited inventory details for ${activeBiz.items[idx].name}`);
      this.save();

      // Sync to authoritative central backend
      window.apiFetch('/api/v1/items', {
        method: 'POST',
        body: JSON.stringify(activeBiz.items[idx])
      }).catch(e => console.warn('Central items update sync deferred:', e));

      return activeBiz.items[idx];
    }
    return null;
  }

  deleteItem(id) {
    const activeBiz = this.getActiveBusiness();
    const idx = (activeBiz.items || []).findIndex(i => i.id === id);
    if (idx !== -1) {
      const removed = activeBiz.items.splice(idx, 1)[0];
      this.logAction("Deleted Item", `Removed item ${removed.name} (${id})`);
      this.save();

      // Sync to central backend
      window.apiFetch(`/api/v1/items/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      }).catch(e => console.warn('Central item deletion sync deferred:', e));

      return true;
    }
    return false;
  }

  adjustStock(itemId, deltaQty, reason = "Transaction") {
    const item = this.getItem(itemId);
    if (item) {
      item.stock += deltaQty;
      this.logAction("Stock Adjusted", `${reason}: ${item.name} (${deltaQty > 0 ? '+' : ''}${deltaQty} ${item.unit}) => Current: ${item.stock}`);
      this.save();

      // Sync to authoritative central backend
      window.apiFetch('/api/v1/items/adjust-stock', {
        method: 'POST',
        body: JSON.stringify({ itemId, deltaQty, reason })
      }).catch(e => console.warn('Central stock adjustment sync deferred:', e));
    }
  }

  // --- Item Categories & Sub-Categories Hierarchy ---
  getItemCategories() {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.itemCategories || !Array.isArray(activeBiz.itemCategories) || activeBiz.itemCategories.length === 0) {
      activeBiz.itemCategories = [
        {
          id: 'cat_groceries',
          name: 'Groceries & Food',
          subcategories: ['Flour & Grains', 'Edible Oils', 'Spices & Masalas', 'Dairy Products', 'Beverages & Snacks']
        },
        {
          id: 'cat_electronics',
          name: 'Electronics & Hardware',
          subcategories: ['Lighting & Bulbs', 'Wires & Cables', 'Switches & Sockets', 'Appliances', 'Accessories']
        },
        {
          id: 'cat_fmcg',
          name: 'FMCG & Consumer Goods',
          subcategories: ['Soaps & Shampoos', 'Oral Care', 'Cleaning & Detergents', 'Personal Care']
        },
        {
          id: 'cat_apparel',
          name: 'Apparel & Textiles',
          subcategories: ["Men's Wear", "Women's Wear", "Kids Wear", "Fabrics & Suits"]
        },
        {
          id: 'cat_services',
          name: 'Services & Other',
          subcategories: ['Repair & Maintenance', 'Consulting & Setup', 'Installation', 'General Services']
        }
      ];
      this.save();
    }
    return activeBiz.itemCategories;
  }

  saveItemCategories(categories) {
    const activeBiz = this.getActiveBusiness();
    activeBiz.itemCategories = categories;
    this.save();
    return activeBiz.itemCategories;
  }

  addItemCategory(categoryName) {
    if (!categoryName || !categoryName.trim()) return null;
    const trimmed = categoryName.trim();
    const categories = this.getItemCategories();
    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const newCat = {
      id: 'cat_' + Date.now(),
      name: trimmed,
      subcategories: []
    };
    categories.push(newCat);
    this.saveItemCategories(categories);
    this.logAction("Added Item Category", `Created category: ${trimmed}`);
    return newCat;
  }

  addItemSubCategory(categoryName, subCategoryName) {
    if (!categoryName || !subCategoryName || !subCategoryName.trim()) return false;
    const catTrimmed = categoryName.trim();
    const subTrimmed = subCategoryName.trim();
    const categories = this.getItemCategories();
    let cat = categories.find(c => c.name.toLowerCase() === catTrimmed.toLowerCase());
    if (!cat) {
      cat = this.addItemCategory(catTrimmed);
    }
    if (!cat.subcategories) cat.subcategories = [];
    if (!cat.subcategories.some(s => s.toLowerCase() === subTrimmed.toLowerCase())) {
      cat.subcategories.push(subTrimmed);
      this.saveItemCategories(categories);
      this.logAction("Added Item Sub-Category", `Added "${subTrimmed}" to ${cat.name}`);
      return true;
    }
    return false;
  }

  deleteItemCategory(categoryName) {
    let categories = this.getItemCategories();
    categories = categories.filter(c => c.name.toLowerCase() !== String(categoryName).toLowerCase());
    this.saveItemCategories(categories);
    this.logAction("Deleted Item Category", `Removed category: ${categoryName}`);
    return true;
  }

  deleteItemSubCategory(categoryName, subCategoryName) {
    const categories = this.getItemCategories();
    const cat = categories.find(c => c.name.toLowerCase() === String(categoryName).toLowerCase());
    if (cat && cat.subcategories) {
      cat.subcategories = cat.subcategories.filter(s => s.toLowerCase() !== String(subCategoryName).toLowerCase());
      this.saveItemCategories(categories);
      this.logAction("Deleted Item Sub-Category", `Removed sub-category "${subCategoryName}" from ${categoryName}`);
      return true;
    }
    return false;
  }


  // --- Sales (Scoped to Active Business) ---
  getSales() {
    return this.getActiveBusiness().sales || [];
  }

  getSale(id) {
    return this.getSales().find(s => s.id === id || s.number === id);
  }

  getNextInvoiceNumber() {
    const year = new Date().getFullYear();
    const count = this.getSales().length + 1;
    return `INV-${year}-${String(count).padStart(3, '0')}`;
  }

  addSale(saleData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.sales) activeBiz.sales = [];
    const invNumber = this.getNextInvoiceNumber();
    const newSale = {
      id: invNumber,
      number: invNumber,
      docType: saleData.docType || "Invoice",
      createdAt: new Date().toISOString(),
      ewayBillNumber: null,
      ...saleData
    };

    // Deduct stock for sold items
    if (newSale.items && Array.isArray(newSale.items)) {
      newSale.items.forEach(line => {
        this.adjustStock(line.itemId, -Number(line.qty), `Sale ${invNumber}`);
      });
    }

    // Update customer balance if credit / unpaid
    if (newSale.balance > 0) {
      const party = this.getParty(newSale.partyId);
      if (party) {
        party.balance = (Number(party.balance) || 0) + newSale.balance;
      }
    }

    // Update cash/bank balance if paid
    if (newSale.paid > 0) {
      if (newSale.paymentMode === 'Cash') {
        activeBiz.cashBank.cashInHand += newSale.paid;
      } else {
        activeBiz.cashBank.hdfcBank = (activeBiz.cashBank.hdfcBank || 0) + newSale.paid;
      }
    }

    activeBiz.sales.unshift(newSale);
    this.logAction("Created Tax Invoice", `Generated invoice ${invNumber} for ${newSale.partyName} (₹${newSale.total.toFixed(2)})`);
    this.save();

    // Sync to authoritative central backend
    window.apiFetch('/api/v1/sales', {
      method: 'POST',
      body: JSON.stringify(newSale)
    }).catch(e => console.warn('Central sales sync deferred:', e));

    return newSale;
  }

  // --- Quotations & Estimates ---
  getEstimates() {
    return this.getActiveBusiness().estimates || [];
  }

  addEstimate(estData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.estimates) activeBiz.estimates = [];
    const count = activeBiz.estimates.length + 1;
    const estNumber = `EST-2026-${String(count).padStart(3, '0')}`;
    const newEst = {
      id: estNumber,
      number: estNumber,
      docType: "Estimate",
      date: new Date().toISOString().split('T')[0],
      status: "Open",
      ...estData
    };
    activeBiz.estimates.unshift(newEst);
    this.logAction("Created Quotation", `Issued quotation ${estNumber} for ${newEst.partyName} (₹${Number(newEst.total).toFixed(2)})`);
    this.save();
    return newEst;
  }

  convertEstimateToInvoice(estimateId) {
    const activeBiz = this.getActiveBusiness();
    const est = (activeBiz.estimates || []).find(e => e.id === estimateId);
    if (!est) throw new Error("Estimate not found");
    est.status = "Converted";

    const saleInvoice = this.addSale({
      date: new Date().toISOString().split('T')[0],
      partyId: est.partyId,
      partyName: est.partyName,
      placeOfSupply: est.placeOfSupply || "DELHI (07)",
      paymentMode: "Credit",
      items: est.items,
      subtotal: est.subtotal || est.total,
      tax: est.tax || 0,
      total: est.total,
      paid: 0,
      balance: est.total,
      status: "Unpaid",
      notes: `Converted from Quotation #${est.number}`
    });
    this.logAction("Converted Quotation", `Converted ${est.number} to Tax Invoice ${saleInvoice.number}`);
    this.save();
    return saleInvoice;
  }

  // --- Order Management (Multi-Source Orders: Direct, Salesman App, WhatsApp/Phone, Portal) ---
  getOrders() {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.orders) activeBiz.orders = [];
    return activeBiz.orders;
  }

  getOrder(id) {
    return this.getOrders().find(o => o.id === id || o.number === id);
  }

  getNextOrderNumber() {
    const year = new Date().getFullYear();
    const count = this.getOrders().length + 1;
    return `ORD-${year}-${String(count).padStart(3, '0')}`;
  }

  addOrder(orderData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.orders) activeBiz.orders = [];
    const count = activeBiz.orders.length + 1;
    const ordNumber = orderData.number || `ORD-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    const newOrder = {
      id: orderData.id || ordNumber,
      number: ordNumber,
      date: orderData.date || new Date().toISOString().split('T')[0],
      timestamp: orderData.timestamp || new Date().toISOString(),
      source: orderData.source || 'Direct Order', // 'Direct Order' | 'Salesman App' | 'WhatsApp / Phone' | 'Online Portal'
      salesmanId: orderData.salesmanId || null,
      salesmanName: orderData.salesmanName || (orderData.salesmanId ? 'Field Salesman' : 'Direct Counter / Owner'),
      partyId: orderData.partyId || '',
      partyName: orderData.partyName || 'Walk-in Customer',
      phone: orderData.phone || '',
      items: orderData.items || [],
      subtotal: Number(orderData.subtotal) || 0,
      tax: Number(orderData.tax) || 0,
      total: Number(orderData.total) || 0,
      paymentStatus: orderData.paymentStatus || 'Pending', // 'Pending' | 'Paid'
      paymentMode: orderData.paymentMode || 'Pending', // e.g. 'UPI / QR', 'Cash', 'Pending'
      paidAmount: Number(orderData.paidAmount) || 0,
      balanceDue: Number(orderData.balanceDue !== undefined ? orderData.balanceDue : (orderData.paymentStatus === 'Paid' ? 0 : orderData.total)),
      orderStatus: orderData.orderStatus || 'New', // 'New' | 'Billed' | 'Delivered' | 'Cancelled'
      invoiceId: orderData.invoiceId || null,
      invoiceNumber: orderData.invoiceNumber || null,
      paymentMention: orderData.paymentMention || (orderData.paymentStatus === 'Paid' ? `PAID (via ${orderData.paymentMode || 'Cash'})` : 'Payment Pending'),
      notes: orderData.notes || '',
      createdAt: new Date().toISOString()
    };

    activeBiz.orders.unshift(newOrder);
    this.logAction("Received New Order", `Order #${ordNumber} received via ${newOrder.source} for ${newOrder.partyName} (₹${newOrder.total.toFixed(2)})`);
    this.save();

    // Sync to authoritative central backend
    window.apiFetch('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(newOrder)
    }).catch(e => console.warn('Central orders sync deferred:', e));

    // Dispatch event so all open views (and salesman app / dashboard) update in real-time
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { order: newOrder } }));
    }
    return newOrder;
  }

  convertOrderToInvoice(orderId, paymentData = {}) {
    const activeBiz = this.getActiveBusiness();
    const order = this.getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const isPaid = paymentData.isPaid === true || paymentData.paymentStatus === 'Paid';
    const paymentMode = isPaid ? (paymentData.paymentMode || 'Cash') : 'Credit';
    const paidAmount = isPaid ? (Number(paymentData.paidAmount) || order.total) : 0;
    const balanceDue = Math.max(0, order.total - paidAmount);

    // Format bill payment label according to user specification
    const paymentMention = isPaid 
      ? `PAID (via ${paymentMode}${paymentData.reference ? ' - Ref: ' + paymentData.reference : ''})` 
      : 'Payment Pending';

    const saleInvoice = this.addSale({
      date: paymentData.invoiceDate || new Date().toISOString().split('T')[0],
      partyId: order.partyId,
      partyName: order.partyName,
      placeOfSupply: paymentData.placeOfSupply || "DELHI (07)",
      paymentMode: paymentMode,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      paid: paidAmount,
      balance: balanceDue,
      status: isPaid ? (balanceDue === 0 ? "Paid" : "Partial") : "Payment Pending",
      paymentMention: paymentMention,
      orderId: order.id,
      orderNumber: order.number,
      source: order.source,
      salesmanId: order.salesmanId,
      salesmanName: order.salesmanName,
      notes: `${order.notes ? order.notes + ' • ' : ''}Generated from Order #${order.number} [${paymentMention}]`
    });

    order.orderStatus = 'Billed';
    order.invoiceId = saleInvoice.id;
    order.invoiceNumber = saleInvoice.number;
    order.paymentStatus = isPaid ? (balanceDue === 0 ? 'Paid' : 'Partial') : 'Pending';
    order.paymentMode = paymentMode;
    order.paidAmount = paidAmount;
    order.balanceDue = balanceDue;
    order.paymentMention = paymentMention;

    this.logAction("Generated Tax Invoice from Order", `Converted Order #${order.number} to Bill #${saleInvoice.number} [${paymentMention}]`);
    this.save();

    // Sync conversion to backend
    window.apiFetch(`/api/v1/orders/${encodeURIComponent(order.id)}/convert-to-invoice`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    }).catch(e => console.warn('Central convert order sync deferred:', e));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { order, invoice: saleInvoice } }));
    }
    return { order, invoice: saleInvoice };
  }

  markOrderPaymentPaid(orderId, paymentData = {}) {
    const activeBiz = this.getActiveBusiness();
    const order = this.getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const mode = paymentData.paymentMode || 'Cash';
    const amount = Number(paymentData.paidAmount) || (order.balanceDue || order.total);
    const prevBalance = order.balanceDue !== undefined ? order.balanceDue : order.total;

    order.paymentStatus = 'Paid';
    order.paymentMode = mode;
    order.paidAmount = (order.paidAmount || 0) + amount;
    order.balanceDue = Math.max(0, prevBalance - amount);
    order.paidAt = new Date().toISOString();
    order.paymentMention = `PAID (via ${mode}${paymentData.reference ? ' - Ref: ' + paymentData.reference : ''})`;

    // Adjust Cash / Bank balance
    if (mode === 'Cash') {
      if (!activeBiz.cashBank) activeBiz.cashBank = { cashInHand: 42850, bankAccounts: [] };
      activeBiz.cashBank.cashInHand = (activeBiz.cashBank.cashInHand || 0) + amount;
    } else {
      if (!activeBiz.cashBank) activeBiz.cashBank = { cashInHand: 42850, bankAccounts: [{ id: 'BANK-01', balance: 342600 }] };
      activeBiz.cashBank.hdfcBank = (activeBiz.cashBank.hdfcBank || 0) + amount;
      if (activeBiz.cashBank.bankAccounts && activeBiz.cashBank.bankAccounts[0]) {
        activeBiz.cashBank.bankAccounts[0].balance = (activeBiz.cashBank.bankAccounts[0].balance || 0) + amount;
      }
    }

    // Deduct from Party ledger if customer had outstanding balance
    if (order.partyId) {
      const party = this.getParty(order.partyId);
      if (party) {
        party.balance = Math.max(0, (party.balance || 0) - amount);
      }
    }

    // If associated with a generated sale invoice, also mark that invoice paid!
    if (order.invoiceId) {
      const sale = this.getSale(order.invoiceId);
      if (sale) {
        sale.paid = (sale.paid || 0) + amount;
        sale.balance = Math.max(0, (sale.balance || 0) - amount);
        sale.status = sale.balance === 0 ? 'Paid' : 'Partial';
        sale.paymentMode = mode;
        sale.paymentMention = order.paymentMention;
      }
    }

    this.logAction("Order Payment Received", `Collected ₹${amount.toFixed(2)} via ${mode} for Order #${order.number} (Customer: ${order.partyName})`);
    this.save();

    // Sync payment update to backend
    window.apiFetch(`/api/v1/orders/${encodeURIComponent(order.id)}/payment`, {
      method: 'POST',
      body: JSON.stringify({ ...paymentData, paymentMode: mode, paidAmount: amount })
    }).catch(e => console.warn('Central order payment sync deferred:', e));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { order } }));
    }
    return { order, success: true };
  }

  // --- Field Salesmen Management & Telemetry ---
  getSalesmen() {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.salesmen) activeBiz.salesmen = [];
    return activeBiz.salesmen;
  }

  getSalesman(id) {
    return this.getSalesmen().find(s => s.id === id || s.phone === id);
  }

  addSalesman(salesmanData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.salesmen) activeBiz.salesmen = [];
    const count = activeBiz.salesmen.length + 1;
    const newId = `SALES-${String(count).padStart(3, '0')}`;
    const token = `INV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const cleanDigits = (salesmanData.phone || '').replace(/[^0-9]/g, '').slice(-10);

    const waMessage = `Namaste ${salesmanData.name}! You are invited to join *${activeBiz.name}* as *${salesmanData.role || 'Field Salesman'}* on Lekha Jokha.\n\nPlease open this link to activate your field force app: http://localhost:3000/#invite?token=${token}\n(Token: ${token})`;
    const waLink = `https://wa.me/91${cleanDigits}?text=${encodeURIComponent(waMessage)}`;

    const newSalesman = {
      id: newId,
      name: salesmanData.name.trim(),
      phone: `+91 ${cleanDigits}`,
      employeeId: salesmanData.employeeId || `EMP-${String(count).padStart(3, '0')}`,
      role: salesmanData.role || 'Field Salesman',
      territory: salesmanData.territory || 'Delhi Central Zone',
      email: salesmanData.email || '',
      status: 'Active',
      joiningStatus: 'JOINING PENDING',
      attendanceStatus: 'Punched Out',
      lastPunchIn: null,
      lastPunchOut: null,
      inviteToken: token,
      whatsAppInviteUrl: waLink,
      whatsAppMessage: waMessage,
      targetMonthly: Number(salesmanData.targetMonthly) || 350000,
      commissionRate: Number(salesmanData.commissionRate) || 2.5,
      stats: {
        dailySales: 0,
        monthlySales: 0,
        annualSales: 0,
        totalOrders: 0,
        traveledDistanceKm: 0,
        totalWorkingDuration: '0 hrs 0 mins',
        activeWorkingDuration: '0 hrs 0 mins',
        breakDuration: '0 mins',
        firstActivity: 'Awaiting App Download & Activation',
        lastActivity: 'Account Created',
        syncStatus: 'Invite Pending Acceptance',
        missedPunches: 'None'
      },
      punchInLocation: { lat: null, lng: null, address: 'Not yet punched in', time: null },
      punchOutLocation: { lat: null, lng: null, address: 'N/A', time: null },
      lastLocation: {
        lat: 28.6139,
        lng: 77.2090,
        address: 'Delhi NCR Central Zone',
        timestamp: new Date().toISOString()
      },
      attendanceSessions: [],
      todayVisits: [],
      locationHistory: [],
      createdAt: new Date().toISOString()
    };

    activeBiz.salesmen.unshift(newSalesman);
    this.logAction("Added Field Salesman", `Registered staff ${newSalesman.name} (${newSalesman.phone}) with role ${newSalesman.role}`);
    this.save();
    return newSalesman;
  }

  updateSalesman(id, updates) {
    const activeBiz = this.getActiveBusiness();
    const idx = (activeBiz.salesmen || []).findIndex(s => s.id === id);
    if (idx !== -1) {
      activeBiz.salesmen[idx] = { ...activeBiz.salesmen[idx], ...updates };
      this.logAction("Updated Salesman Profile", `Modified details for ${activeBiz.salesmen[idx].name}`);
      this.save();
      return activeBiz.salesmen[idx];
    }
    return null;
  }

  deleteSalesman(id) {
    const activeBiz = this.getActiveBusiness();
    const salesman = (activeBiz.salesmen || []).find(s => s.id === id);
    if (!salesman) return false;
    salesman.status = 'Revoked';
    salesman.joiningStatus = 'REVOKED';
    salesman.attendanceStatus = 'Punched Out';
    this.logAction("Revoked Salesman Access", `Deactivated account for ${salesman.name}`);
    this.save();
    return true;
  }

  // --- Sales Returns & Credit Notes ---
  getSalesReturns() {
    return this.getActiveBusiness().salesReturns || [];
  }

  addSalesReturn(returnData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.salesReturns) activeBiz.salesReturns = [];
    const count = activeBiz.salesReturns.length + 1;
    const returnNumber = `SR-2026-${String(count).padStart(3, '0')}`;
    const newReturn = {
      id: returnNumber,
      number: returnNumber,
      docType: "SalesReturn",
      date: new Date().toISOString().split('T')[0],
      ...returnData
    };

    // Restock items
    if (newReturn.items && Array.isArray(newReturn.items)) {
      newReturn.items.forEach(line => {
        this.adjustStock(line.itemId, Number(line.qty), `Sales Return ${returnNumber}`);
      });
    }

    // Adjust customer balance
    if (newReturn.partyId) {
      const party = this.getParty(newReturn.partyId);
      if (party) {
        party.balance = Math.max(0, (Number(party.balance) || 0) - Number(newReturn.total));
      }
    }

    activeBiz.salesReturns.unshift(newReturn);
    this.logAction("Recorded Sales Return", `Issued Credit Note ${returnNumber} to ${newReturn.partyName} (₹${Number(newReturn.total).toFixed(2)})`);
    this.save();
    return newReturn;
  }

  // --- Delivery Challans ---
  getDeliveryChallans() {
    return this.getActiveBusiness().deliveryChallans || [];
  }

  addDeliveryChallan(challanData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.deliveryChallans) activeBiz.deliveryChallans = [];
    const count = activeBiz.deliveryChallans.length + 1;
    const dcNumber = `DC-2026-${String(count).padStart(3, '0')}`;
    const newChallan = {
      id: dcNumber,
      number: dcNumber,
      date: new Date().toISOString().split('T')[0],
      status: "Dispatched",
      ...challanData
    };
    activeBiz.deliveryChallans.unshift(newChallan);
    this.logAction("Created Delivery Challan", `Generated Challan ${dcNumber} for ${newChallan.partyName}`);
    this.save();
    return newChallan;
  }

  convertChallanToInvoice(challanId) {
    const activeBiz = this.getActiveBusiness();
    const challan = (activeBiz.deliveryChallans || []).find(c => c.id === challanId || c.number === challanId);
    if (!challan) throw new Error("Delivery Challan not found");
    challan.status = "Converted to Invoice";

    const saleInvoice = this.addSale({
      date: new Date().toISOString().split('T')[0],
      partyId: challan.partyId,
      partyName: challan.partyName,
      placeOfSupply: "DELHI (07)",
      paymentMode: "Credit",
      items: (challan.items || []).map(ci => {
        const itm = this.getItem(ci.itemId) || {};
        return {
          itemId: ci.itemId,
          name: ci.name || itm.name || "Item",
          hsn: itm.hsn || "9999",
          qty: ci.qty || 1,
          rate: itm.salePrice || 100,
          gstRate: itm.gstRate || 5,
          amount: (itm.salePrice || 100) * (ci.qty || 1) * (1 + (itm.gstRate || 5)/100)
        };
      }),
      subtotal: (challan.items || []).reduce((acc, ci) => acc + ((this.getItem(ci.itemId)?.salePrice || 100) * (ci.qty || 1)), 0),
      tax: (challan.items || []).reduce((acc, ci) => acc + ((this.getItem(ci.itemId)?.salePrice || 100) * (ci.qty || 1) * 0.05), 0),
      total: (challan.items || []).reduce((acc, ci) => acc + ((this.getItem(ci.itemId)?.salePrice || 100) * (ci.qty || 1) * 1.05), 0),
      paid: 0,
      balance: (challan.items || []).reduce((acc, ci) => acc + ((this.getItem(ci.itemId)?.salePrice || 100) * (ci.qty || 1) * 1.05), 0),
      status: "Unpaid",
      notes: `Converted from Delivery Challan #${challan.number}`
    });
    this.logAction("Converted Challan to Invoice", `Converted ${challan.number} to Tax Invoice ${saleInvoice.number}`);
    this.save();
    return saleInvoice;
  }

  // --- Purchases (Scoped to Active Business) ---
  getPurchases() {
    return this.getActiveBusiness().purchases || [];
  }

  addPurchase(purchaseData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.purchases) activeBiz.purchases = [];
    const count = activeBiz.purchases.length + 1;
    const purNumber = `PUR-2026-${String(count).padStart(3, '0')}`;
    const newPurchase = {
      id: purNumber,
      number: purNumber,
      ...purchaseData
    };

    // Increase stock for purchased items
    if (newPurchase.items && Array.isArray(newPurchase.items)) {
      newPurchase.items.forEach(line => {
        this.adjustStock(line.itemId, Number(line.qty), `Purchase ${purNumber}`);
      });
    }

    // Adjust supplier balance if credit
    if (newPurchase.balance > 0) {
      const party = this.getParty(newPurchase.partyId);
      if (party) {
        party.balance = (Number(party.balance) || 0) - newPurchase.balance;
      }
    }

    activeBiz.purchases.unshift(newPurchase);
    this.logAction("Logged Purchase Bill", `Recorded vendor bill ${purNumber} from ${newPurchase.partyName} (₹${newPurchase.total.toFixed(2)})`);
    this.save();

    // Sync to authoritative central backend
    window.apiFetch('/api/v1/purchases', {
      method: 'POST',
      body: JSON.stringify(newPurchase)
    }).catch(e => console.warn('Central purchases sync deferred:', e));

    return newPurchase;
  }

  // --- Purchase Orders ---
  getPurchaseOrders() {
    return this.getActiveBusiness().purchaseOrders || [];
  }

  addPurchaseOrder(poData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.purchaseOrders) activeBiz.purchaseOrders = [];
    const count = activeBiz.purchaseOrders.length + 1;
    const poNumber = `PO-2026-${String(count).padStart(3, '0')}`;
    const newPO = {
      id: poNumber,
      number: poNumber,
      date: new Date().toISOString().split('T')[0],
      status: "Sent",
      ...poData
    };
    activeBiz.purchaseOrders.unshift(newPO);
    this.logAction("Generated Purchase Order", `Created PO ${poNumber} for ${newPO.partyName}`);
    this.save();
    return newPO;
  }

  // --- Purchase Returns & Debit Notes ---
  getPurchaseReturns() {
    return this.getActiveBusiness().purchaseReturns || [];
  }

  addPurchaseReturn(returnData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.purchaseReturns) activeBiz.purchaseReturns = [];
    const count = activeBiz.purchaseReturns.length + 1;
    const returnNumber = `PR-2026-${String(count).padStart(3, '0')}`;
    const newReturn = {
      id: returnNumber,
      number: returnNumber,
      docType: "PurchaseReturn",
      date: new Date().toISOString().split('T')[0],
      ...returnData
    };

    // Deduct stock from inventory
    if (newReturn.items && Array.isArray(newReturn.items)) {
      newReturn.items.forEach(line => {
        this.adjustStock(line.itemId, -Number(line.qty), `Purchase Return ${returnNumber}`);
      });
    }

    // Adjust supplier balance (debit note decreases what we owe)
    if (newReturn.partyId) {
      const party = this.getParty(newReturn.partyId);
      if (party) {
        party.balance = (Number(party.balance) || 0) + Number(newReturn.total);
      }
    }

    activeBiz.purchaseReturns.unshift(newReturn);
    this.logAction("Recorded Purchase Return", `Issued Debit Note ${returnNumber} to ${newReturn.partyName} (₹${Number(newReturn.total).toFixed(2)})`);
    this.save();
    return newReturn;
  }

  // --- Stock Adjustments (Physical Stock Reconciliation) ---
  getStockAdjustments() {
    return this.getActiveBusiness().stockAdjustments || [];
  }

  addStockAdjustment(adjData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.stockAdjustments) activeBiz.stockAdjustments = [];
    const count = activeBiz.stockAdjustments.length + 1;
    const adjNumber = `ADJ-${String(count).padStart(3, '0')}`;
    const newAdj = {
      id: adjNumber,
      date: new Date().toISOString().split('T')[0],
      ...adjData
    };

    const delta = newAdj.type === 'Add' ? Number(newAdj.qty) : -Number(newAdj.qty);
    this.adjustStock(newAdj.itemId, delta, `Manual Adjustment (${newAdj.reason})`);

    activeBiz.stockAdjustments.unshift(newAdj);
    this.save();
    return newAdj;
  }

  // --- Expenses (Scoped to Active Business) ---
  getExpenses() {
    return this.getActiveBusiness().expenses || [];
  }

  addExpense(expense) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.expenses) activeBiz.expenses = [];
    const count = activeBiz.expenses.length + 1;
    const newExp = {
      id: `EXP-${String(count).padStart(3, '0')}`,
      ...expense,
      amount: Number(expense.amount)
    };

    if (newExp.paymentMode === 'Cash') {
      activeBiz.cashBank.cashInHand = Math.max(0, (activeBiz.cashBank.cashInHand || 0) - newExp.amount);
    } else {
      activeBiz.cashBank.hdfcBank = Math.max(0, (activeBiz.cashBank.hdfcBank || 0) - newExp.amount);
    }

    activeBiz.expenses.unshift(newExp);
    this.logAction("Logged Expense", `${newExp.category}: ${newExp.description} (-₹${newExp.amount.toFixed(2)})`);
    this.save();

    // Sync to authoritative central backend
    window.apiFetch('/api/v1/expenses', {
      method: 'POST',
      body: JSON.stringify(newExp)
    }).catch(e => console.warn('Central expenses sync deferred:', e));

    return newExp;
  }

  // --- Cash & Bank Accounts (Scoped to Active Business) ---
  getCashBank() {
    return this.getActiveBusiness().cashBank || { cashInHand: 0, hdfcBank: 0, bankAccounts: [], contraTransfers: [] };
  }

  addContraTransfer(transferData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.cashBank) activeBiz.cashBank = { cashInHand: 0, hdfcBank: 0, bankAccounts: [], contraTransfers: [] };
    if (!activeBiz.cashBank.contraTransfers) activeBiz.cashBank.contraTransfers = [];

    const amount = Number(transferData.amount);
    if (transferData.from === 'Cash' && transferData.to === 'Bank') {
      activeBiz.cashBank.cashInHand -= amount;
      activeBiz.cashBank.hdfcBank += amount;
    } else if (transferData.from === 'Bank' && transferData.to === 'Cash') {
      activeBiz.cashBank.hdfcBank -= amount;
      activeBiz.cashBank.cashInHand += amount;
    }

    const count = activeBiz.cashBank.contraTransfers.length + 1;
    const transfer = {
      id: `CON-${String(count).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      ...transferData,
      amount
    };
    activeBiz.cashBank.contraTransfers.unshift(transfer);
    this.logAction("Contra Transfer", `Transferred ₹${amount.toFixed(2)} from ${transferData.from} to ${transferData.to}`);
    this.save();
    return transfer;
  }

  // --- Payment-In (Customer Khata Receipts) ---
  getPaymentsIn() {
    return this.getActiveBusiness().paymentsIn || [];
  }

  addPaymentIn(receiptData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.paymentsIn) activeBiz.paymentsIn = [];
    const count = activeBiz.paymentsIn.length + 1;
    const recNumber = `REC-2026-${String(count).padStart(3, '0')}`;
    const amount = Number(receiptData.amount) || 0;
    const newReceipt = {
      id: recNumber,
      number: recNumber,
      date: new Date().toISOString().split('T')[0],
      ...receiptData,
      amount
    };

    // Deduct party receivable balance
    if (newReceipt.partyId) {
      const party = this.getParty(newReceipt.partyId);
      if (party) {
        party.balance = Math.max(0, (Number(party.balance) || 0) - amount);
      }
    }

    // Deposit to Cash or Bank
    if (!activeBiz.cashBank) activeBiz.cashBank = { cashInHand: 0, hdfcBank: 0 };
    if (newReceipt.paymentMode === 'Cash') {
      activeBiz.cashBank.cashInHand = (activeBiz.cashBank.cashInHand || 0) + amount;
    } else {
      activeBiz.cashBank.hdfcBank = (activeBiz.cashBank.hdfcBank || 0) + amount;
    }

    activeBiz.paymentsIn.unshift(newReceipt);
    this.logAction("Payment In Collected", `Received ₹${amount.toFixed(2)} from ${newReceipt.partyName} (${newReceipt.paymentMode})`);
    this.save();
    return newReceipt;
  }

  // --- Payment-Out (Supplier Khata Vouchers) ---
  getPaymentsOut() {
    return this.getActiveBusiness().paymentsOut || [];
  }

  addPaymentOut(voucherData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.paymentsOut) activeBiz.paymentsOut = [];
    const count = activeBiz.paymentsOut.length + 1;
    const payNumber = `PAY-2026-${String(count).padStart(3, '0')}`;
    const amount = Number(voucherData.amount) || 0;
    const newVoucher = {
      id: payNumber,
      number: payNumber,
      date: new Date().toISOString().split('T')[0],
      ...voucherData,
      amount
    };

    // Deduct supplier payable balance
    if (newVoucher.partyId) {
      const party = this.getParty(newVoucher.partyId);
      if (party) {
        party.balance = (Number(party.balance) || 0) + amount; // negative balance becomes closer to 0
      }
    }

    // Deduct from Cash or Bank
    if (!activeBiz.cashBank) activeBiz.cashBank = { cashInHand: 0, hdfcBank: 0 };
    if (newVoucher.paymentMode === 'Cash') {
      activeBiz.cashBank.cashInHand = Math.max(0, (activeBiz.cashBank.cashInHand || 0) - amount);
    } else {
      activeBiz.cashBank.hdfcBank = Math.max(0, (activeBiz.cashBank.hdfcBank || 0) - amount);
    }

    activeBiz.paymentsOut.unshift(newVoucher);
    this.logAction("Payment Out Disbursed", `Paid ₹${amount.toFixed(2)} to ${newVoucher.partyName} (${newVoucher.paymentMode})`);
    this.save();
    return newVoucher;
  }

  // --- POS Fast Counter Sale ---
  addPosSale(posData) {
    const count = (this.getSales() || []).length + 1;
    const total = Number(posData.total) || 0;
    const tendered = Number(posData.tendered) || total;
    const changeDue = Math.max(0, tendered - total);

    const sale = this.addSale({
      docType: "POS Bill",
      date: new Date().toISOString().split('T')[0],
      partyId: posData.partyId || "",
      partyName: posData.partyName || "Counter Customer",
      placeOfSupply: "DELHI (07)",
      paymentMode: posData.paymentMode || "Cash",
      items: posData.items || [],
      subtotal: Number(posData.subtotal) || (total * 0.95),
      tax: Number(posData.tax) || (total * 0.05),
      total,
      paid: total,
      tendered,
      changeDue,
      balance: 0,
      status: "Paid",
      notes: "Fast POS Counter Billing"
    });

    this.logAction("POS Counter Sale", `Billed POS #${sale.number} (Total: ₹${total.toFixed(2)}, Change Due: ₹${changeDue.toFixed(2)})`);
    return { sale, changeDue };
  }

  // --- e-Way Bills (Scoped to Active Business) ---
  getEwayBills() {
    return this.getActiveBusiness().ewayBills || [];
  }

  getEwayBill(id) {
    return this.getEwayBills().find(e => e.id === id || e.ewayNumber === id);
  }

  addEwayBill(ewayData) {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz.ewayBills) activeBiz.ewayBills = [];
    const count = activeBiz.ewayBills.length + 1;
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const ewayNumber = "24" + String(Math.floor(10 + Math.random() * 90)) + String(randomSuffix);

    const now = new Date();
    const ewayDate = now.toISOString().replace('T', ' ').substring(0, 16);
    const distance = Number(ewayData.distanceKm) || 30;
    const validityDays = Math.max(1, Math.ceil(distance / 200));
    const validUntilDate = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const validUntil = validUntilDate.toISOString().split('T')[0] + " 23:59";

    const newEway = {
      id: "EWB-2026-" + String(count).padStart(3, '0'),
      ewayNumber,
      ewayDate,
      validUntil,
      status: "Active",
      fromGstin: activeBiz.gstin,
      ...ewayData
    };

    activeBiz.ewayBills.unshift(newEway);

    if (newEway.invoiceNumber) {
      const sale = this.getSale(newEway.invoiceNumber);
      if (sale) {
        sale.ewayBillNumber = ewayNumber;
      }
    }

    this.logAction("Generated e-Way Bill", `Created EWB #${ewayNumber} for ${newEway.partyName} (Vehicle: ${newEway.vehicleNumber})`);
    this.save();
    return newEway;
  }

  cancelEwayBill(ewayNumber, cancelReason = "Cancelled by User") {
    const activeBiz = this.getActiveBusiness();
    const eway = (activeBiz.ewayBills || []).find(e => e.ewayNumber === ewayNumber || e.id === ewayNumber);
    if (eway) {
      eway.status = "Cancelled";
      eway.cancelReason = cancelReason;
      this.logAction("Cancelled e-Way Bill", `Cancelled EWB #${eway.ewayNumber}: ${cancelReason}`);
      this.save();
      return eway;
    }
    return null;
  }

  // --- Audit Logs (Scoped to Active Business) ---
  getAuditLogs() {
    return this.getActiveBusiness().auditLogs || [];
  }

  logAction(action, details) {
    const currentUser = this.getCurrentUser();
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz) return null;
    if (!activeBiz.auditLogs) activeBiz.auditLogs = [];

    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const count = activeBiz.auditLogs.length + 1;
    const newLog = {
      id: "LOG-" + String(count).padStart(3, '0'),
      timestamp,
      userId: currentUser ? currentUser.id : "SYSTEM",
      userName: currentUser ? `${currentUser.name} (${currentUser.role})` : "System",
      action,
      details
    };

    activeBiz.auditLogs.unshift(newLog);
    if (activeBiz.auditLogs.length > 100) {
      activeBiz.auditLogs = activeBiz.auditLogs.slice(0, 100);
    }
    this.save();
    return newLog;
  }

  // --- Users & RBAC ---
  getCurrentUser() {
    let user = null;
    try {
      const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('lekhajokha_current_user')) || '';
      if (stored) {
        user = JSON.parse(stored);
      }
    } catch (e) {}

    if (!user && this.data) {
      if (this.data.currentUserId) {
        user = (this.data.users || []).find(u => u.id === this.data.currentUserId);
      }
      if (!user && Array.isArray(this.data.users) && this.data.users.length > 0) {
        user = this.data.users[0];
      }
    }

    if (!user) {
      user = this.getDefaultUsers()[0];
    }

    if (user && !user.avatar) {
      user.avatar = (user.role === 'Admin' || user.role === 'Owner') ? '👨‍💼' : (user.role === 'Accountant' ? '👩‍💼' : '🧑‍💻');
    }
    return user;
  }

  getUsers() {
    let list = (this.data && Array.isArray(this.data.users) && this.data.users.length > 0) ? [...this.data.users] : [];
    const current = this.getCurrentUser();

    if (list.length === 0) {
      const defaults = this.getDefaultUsers();
      if (current) {
        list = [current, ...defaults.filter(u => u.role !== 'Admin' && u.role !== 'Owner' && u.id !== current.id)];
      } else {
        list = defaults;
      }
    } else if (current) {
      const existingIdx = list.findIndex(u => u.id === current.id || (u.role === 'Admin' || u.role === 'Owner'));
      if (existingIdx !== -1) {
        list[existingIdx] = { ...list[existingIdx], ...current, name: current.name || list[existingIdx].name };
      } else {
        list.unshift(current);
      }
    }

    if (current && current.name && current.name !== 'Sharma Ji') {
      list.forEach(u => {
        if ((u.role === 'Admin' || u.role === 'Owner' || u.id === 'U001') && u.name === 'Sharma Ji') {
          u.name = current.name;
        }
      });
    }

    return list.map(u => ({
      ...u,
      avatar: u.avatar || ((u.role === 'Admin' || u.role === 'Owner') ? '👨‍💼' : (u.role === 'Accountant' ? '👩‍💼' : '🧑‍💻'))
    }));
  }

  getUser(id) {
    return this.getUsers().find(u => u.id === id);
  }

  setCurrentUser(id) {
    const user = this.getUser(id);
    if (user) {
      if (!this.data) this.data = {};
      this.data.currentUserId = id;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lekhajokha_current_user', JSON.stringify(user));
      }
      this.logAction("Switched Active User", `Switched session to ${user.name} (${user.role})`);
      this.save();
      return user;
    }
    return null;
  }

  hasPermission(permissionName) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'Admin' || (user.permissions && user.permissions.includes('all'))) return true;
    return Boolean(user.permissions && user.permissions.includes(permissionName));
  }

  addUser(userData) {
    const count = (this.data.users || []).length + 1;
    const newUser = {
      id: "U" + String(count).padStart(3, '0'),
      status: "Active",
      avatar: userData.role === 'Admin' ? '👨‍💼' : userData.role === 'Accountant' ? '👩‍💼' : '🧑‍💻',
      ...userData
    };
    if (!this.data.users) this.data.users = [];
    this.data.users.push(newUser);
    this.logAction("Created New User", `Added ${newUser.name} with role ${newUser.role}`);
    this.save();
    return newUser;
  }

  reset() {
    this.data = {
      subscriber: initialSubscriber,
      businesses: JSON.parse(JSON.stringify(defaultBusinesses)),
      users: this.getDefaultUsers(),
      currentUserId: "U001"
    };
    this.save();
    return this.data;
  }
}

// Global data store instance
window.Store = new DataStore();
