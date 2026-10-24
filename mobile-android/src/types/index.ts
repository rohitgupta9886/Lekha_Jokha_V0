// ==============================================================================
// Lekha Jokha - Mobile Data Models & Business Contracts
// ==============================================================================

export type PlanType = 'Free' | 'Pro' | 'Max';

export interface SaaSPlanDetails {
  id: PlanType;
  name: string;
  maxBusinesses: number;
  maxUsers: number;
  maxInvoicesMonthly: number;
  priceMonthly: number;
  features: string[];
}

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: PlanType;
  planActivatedAt: string;
  planExpiresAt: string;
  activeBusinessId: string;
}

export interface Business {
  id: string;
  name: string;
  gstin: string;
  state: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Party {
  id: string;
  name: string;
  type: 'Customer' | 'Supplier';
  phone: string;
  gstin: string;
  address: string;
  state: string;
  balance: number; // Positive = Receivable (for Customer), Negative = Payable (for Supplier)
  createdAt: string;
}

export interface Item {
  id: string;
  barcode: string;
  name: string;
  category: string;
  hsn: string;
  salePrice: number;
  purchasePrice: number;
  gstRate: number; // e.g. 0, 5, 12, 18, 28
  unit: string; // PCS, BAG, LTR, KG, MTR, BOX
  stock: number;
  minStock: number;
}

export interface InvoiceItem {
  itemId: string;
  name: string;
  hsn?: string;
  qty: number;
  rate: number;
  gstRate: number;
  amount: number;
}

export interface SaleInvoice {
  id: string;
  number: string;
  docType: 'Invoice' | 'Estimate' | 'Return' | 'Challan';
  date: string;
  partyId: string;
  partyName: string;
  placeOfSupply: string;
  paymentMode: 'Cash' | 'Bank / UPI' | 'Credit' | 'Cheque';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  notes?: string;
}

export interface PurchaseBill {
  id: string;
  number: string;
  date: string;
  partyId: string;
  partyName: string;
  paymentMode: 'Cash' | 'Bank / Cheque' | 'Credit' | 'UPI';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMode: string;
  ref?: string;
}

export interface CashBankAccount {
  id: string;
  name: string;
  accountNo: string;
  ifsc: string;
  balance: number;
}

export interface CashBankData {
  cashInHand: number;
  bankAccounts: CashBankAccount[];
}

export interface DashboardSummary {
  businessId: string;
  businessName: string;
  totalSales: number;
  totalPurchases: number;
  totalReceivable: number;
  totalPayable: number;
  stockValuation: number;
  cashInHand: number;
  bankBalance: number;
  totalCashBank: number;
  lowStockCount: number;
  lowStockItems: Item[];
  recentSales: SaleInvoice[];
  recentPurchases: PurchaseBill[];
}

export interface GSTVerificationResult {
  valid: boolean;
  gstin: string;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  entityType?: string;
  status?: string;
  verifiedAt?: string;
  reason?: string;
}

export interface UserSession {
  token: string;
  subscriberId: string;
  activeBusinessId: string;
  user: {
    id: string;
    name: string;
    role: 'Admin' | 'Accountant' | 'Sales Staff';
  };
}

export interface DeliveryChallan {
  id: string;
  number: string;
  date: string;
  partyId: string;
  partyName: string;
  vehicleNo?: string;
  items: InvoiceItem[];
  totalQty: number;
  total: number;
  status: 'Dispatched' | 'Delivered' | 'Converted to Invoice';
  notes?: string;
}

export interface SalesReturn {
  id: string;
  number: string;
  invoiceNo?: string;
  date: string;
  partyId: string;
  partyName: string;
  items: InvoiceItem[];
  total: number;
  refundMode: 'Credit Note' | 'Cash' | 'Bank';
  reason?: string;
}

export interface PurchaseReturn {
  id: string;
  number: string;
  billNo?: string;
  date: string;
  partyId: string;
  partyName: string;
  items: InvoiceItem[];
  total: number;
  refundMode: 'Debit Note' | 'Cash' | 'Bank';
  reason?: string;
}

export interface PaymentIn {
  id: string;
  number: string;
  date: string;
  partyId: string;
  partyName: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
  notes?: string;
}

export interface PaymentOut {
  id: string;
  number: string;
  date: string;
  partyId: string;
  partyName: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
  notes?: string;
}

export interface PnlSummary {
  revenue: {
    grossSales: number;
    salesReturns: number;
    netSales: number;
  };
  cogs: {
    grossPurchases: number;
    purchaseReturns: number;
    netPurchases: number;
  };
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: number;
  netProfit: number;
  netMarginPercent: number;
  period: string;
}

export interface DaybookSummary {
  date: string;
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  transactions: Array<{
    type: string;
    refNo: string;
    party: string;
    inflow: number;
    outflow: number;
    mode: string;
  }>;
}

export interface UpiQrResponse {
  vpa: string;
  name: string;
  amount: number;
  note: string;
  upiUrl: string;
  qrImageUrl: string;
}

