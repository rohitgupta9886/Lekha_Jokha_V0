// ==============================================================================
// Lekha Jokha - Dedicated Mobile API Client
// Connects to Real Backend, Handles Auth Headers, Session Expiry & Retries
// ==============================================================================

import { ENV } from "../config/env";
import {
  Business,
  Subscriber,
  SaaSPlanDetails,
  DashboardSummary,
  SaleInvoice,
  PurchaseBill,
  Item,
  Party,
  Expense,
  GSTVerificationResult,
  UserSession,
  DeliveryChallan,
  SalesReturn,
  PurchaseReturn,
  PaymentIn,
  PaymentOut,
  PnlSummary,
  DaybookSummary,
  UpiQrResponse,
} from "../types";

class MobileApiClient {
  private token: string | null = null;
  private activeBusinessId: string = "BIZ-001";
  private baseUrl: string = ENV.getApiBaseUrl();

  constructor() {
    this.loadSession();
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, "");
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setToken(token: string) {
    this.token = token;
    this.saveSession();
  }

  public getToken(): string | null {
    return this.token;
  }

  public setActiveBusinessId(id: string) {
    this.activeBusinessId = id;
    this.saveSession();
  }

  public getActiveBusinessId(): string {
    return this.activeBusinessId;
  }

  private saveSession() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("lekhajokha_auth_token", this.token || "");
        localStorage.setItem(
          "lekhajokha_active_biz",
          this.activeBusinessId || "BIZ-001",
        );
      }
    } catch {
      // Storage unavailable
    }
  }

  private loadSession() {
    try {
      if (typeof localStorage !== "undefined") {
        this.token = localStorage.getItem("lekhajokha_auth_token") || null;
        this.activeBusinessId =
          localStorage.getItem("lekhajokha_active_biz") || "BIZ-001";
      }
    } catch {
      // Storage unavailable
    }
  }

  public clearSession() {
    this.token = null;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("lekhajokha_auth_token");
        localStorage.removeItem("lekhajokha_active_biz");
      }
    } catch {
      // Storage unavailable
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = ENV.MAX_RETRIES,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Client-Platform": "Android-Mobile-Native",
      "X-App-Version": ENV.APP_VERSION,
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 429) {
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, ENV.RATE_LIMIT_RETRY_MS));
          return this.request<T>(endpoint, options, retries - 1);
        }
        throw new Error("Too many requests. Please wait a moment.");
      }

      if (response.status === 401) {
        this.clearSession();
        throw new Error("Session expired. Please sign in again.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.error ||
            `Request failed with HTTP ${response.status}`,
        );
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (retries > 0 && err.name === "TypeError") {
        // Network retry for transient connection glitches
        await new Promise((r) => setTimeout(r, 1000));
        return this.request<T>(endpoint, options, retries - 1);
      }
      throw err;
    }
  }

  // --- Auth APIs ---
  public async login(
    param1:
      | string
      | {
          identifier?: string;
          email?: string;
          phone?: string;
          password?: string;
          pin?: string;
          userId?: string;
          deviceName?: string;
        },
    param2?: string,
  ): Promise<UserSession> {
    let payload: any = {};
    if (typeof param1 === "object" && param1 !== null) {
      payload = {
        ...param1,
        platform: "Android-Mobile-Native",
        deviceName: param1.deviceName || "Android Client App",
      };
    } else if (typeof param1 === "string" && param2 !== undefined) {
      payload = {
        identifier: param1,
        password: param2,
        platform: "Android-Mobile-Native",
        deviceName: "Android Client App",
      };
    } else {
      payload = {
        pin: param1,
        userId: "U001",
        platform: "Android-Mobile-Native",
        deviceName: "Android Client App",
      };
    }

    const result = await this.request<{
      success: boolean;
      token: string;
      subscriberId: string;
      activeBusinessId: string;
      user: { id: string; role: any; name: string };
      session?: any;
    }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    this.setToken(result.token);
    this.setActiveBusinessId(result.activeBusinessId || "BIZ-001");
    return result;
  }

  public async register(
    param1:
      | string
      | {
          name: string;
          phone?: string;
          email?: string;
          password?: string;
          pin?: string;
          businessName: string;
          state?: string;
          deviceName?: string;
        },
    phone?: string,
    businessName?: string,
    state?: string,
  ): Promise<UserSession> {
    let payload: any = {};
    if (typeof param1 === "object" && param1 !== null) {
      payload = {
        ...param1,
        platform: "Android-Mobile-Native",
        deviceName: param1.deviceName || "Android Client App",
      };
    } else {
      payload = {
        name: param1,
        phone,
        businessName,
        state,
        platform: "Android-Mobile-Native",
        deviceName: "Android Client App",
      };
    }

    const result = await this.request<{
      success: boolean;
      token: string;
      subscriber: Subscriber;
      business: Business;
      user?: any;
    }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    this.setToken(result.token);
    this.setActiveBusinessId(result.business.id);
    return {
      token: result.token,
      subscriberId: result.subscriber.id,
      activeBusinessId: result.business.id,
      user: result.user || {
        id: "U001",
        name: result.subscriber.name,
        role: "Admin",
      },
    };
  }

  public async getMe(): Promise<{
    authenticated: boolean;
    user: any;
    subscriber: Subscriber;
    activeBusinessId: string;
    activeBusiness: Business;
    permissions: string[];
  }> {
    return this.request("/api/v1/auth/me");
  }

  public async getSessions(): Promise<{
    sessions: any[];
    currentSessionId: string;
  }> {
    return this.request("/api/v1/auth/sessions");
  }

  public async revokeSession(
    sessionId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/api/v1/auth/sessions/revoke", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
  }

  public async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request("/api/v1/auth/logout", { method: "POST" });
    } finally {
      this.clearSession();
    }
    return { success: true, message: "Logged out successfully" };
  }

  public async logoutAll(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request("/api/v1/auth/logout-all", { method: "POST" });
    } finally {
      this.clearSession();
    }
    return {
      success: true,
      message: "Logged out from all devices successfully",
    };
  }

  public async forgotPassword(
    identifier: string,
  ): Promise<{ success: boolean; message: string; resetToken?: string }> {
    return this.request("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    });
  }

  public async resetPassword(
    resetToken: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ resetToken, newPassword }),
    });
  }

  public async changePassword(
    currentPasswordOrPin: string,
    newPasswordOrPin: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/api/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: currentPasswordOrPin,
        newPassword: newPasswordOrPin,
      }),
    });
  }

  public async sync(
    mutations: any[] = [],
  ): Promise<{
    success: boolean;
    processedMutations: number;
    results: any[];
    serverTimestamp: string;
    businessId: string;
    snapshot: any;
  }> {
    return this.request("/api/v1/sync", {
      method: "POST",
      body: JSON.stringify({
        mutations,
        lastSyncTimestamp: new Date().toISOString(),
      }),
    });
  }

  // --- Business & Multi-Tenant APIs ---
  public async getBusinesses(): Promise<{
    businesses: Business[];
    activeBusinessId: string;
  }> {
    return this.request("/api/v1/businesses");
  }

  public async createBusiness(
    name: string,
    gstin?: string,
    state?: string,
  ): Promise<{ success: boolean; business: Business }> {
    return this.request("/api/v1/businesses", {
      method: "POST",
      body: JSON.stringify({ name, gstin, state }),
    });
  }

  public async switchBusiness(
    businessId: string,
  ): Promise<{
    success: boolean;
    activeBusinessId: string;
    business: Business;
  }> {
    const result = await this.request<{
      success: boolean;
      activeBusinessId: string;
      business: Business;
    }>("/api/v1/businesses/switch", {
      method: "POST",
      body: JSON.stringify({ businessId }),
    });
    this.setActiveBusinessId(result.activeBusinessId);
    return result;
  }

  public async getCurrentBusinessDetails(): Promise<{
    business: Business;
    subscriber: Subscriber;
    data: any;
  }> {
    return this.request("/api/v1/business/current");
  }

  // --- SaaS Subscription APIs ---
  public async getSubscription(): Promise<{
    subscriber: Subscriber;
    currentPlan: SaaSPlanDetails;
    availablePlans: Record<string, SaaSPlanDetails>;
    usage: {
      businessesActive: number;
      maxBusinessesAllowed: number;
      canAddBusiness: boolean;
      invoicesThisMonth: number;
      maxInvoicesAllowed: number;
    };
  }> {
    return this.request("/api/v1/subscription");
  }

  public async upgradeSubscription(
    planName: "Pro" | "Max",
    paymentMethod = "UPI",
    paymentReference?: string,
  ) {
    return this.request("/api/v1/subscription/upgrade", {
      method: "POST",
      body: JSON.stringify({ planName, paymentMethod, paymentReference }),
    });
  }

  // --- Dashboard Summary ---
  public async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request("/api/v1/dashboard/summary");
  }

  // --- Sales APIs ---
  public async getSales(): Promise<{ sales: SaleInvoice[]; total: number }> {
    return this.request("/api/v1/sales");
  }

  public async createSale(
    saleData: Partial<SaleInvoice>,
  ): Promise<{ success: boolean; sale: SaleInvoice }> {
    return this.request("/api/v1/sales", {
      method: "POST",
      body: JSON.stringify(saleData),
    });
  }

  // --- Purchases APIs ---
  public async getPurchases(): Promise<{
    purchases: PurchaseBill[];
    total: number;
  }> {
    return this.request("/api/v1/purchases");
  }

  public async createPurchase(
    purchaseData: Partial<PurchaseBill>,
  ): Promise<{ success: boolean; purchase: PurchaseBill }> {
    return this.request("/api/v1/purchases", {
      method: "POST",
      body: JSON.stringify(purchaseData),
    });
  }

  // --- Inventory APIs ---
  public async getItems(): Promise<{ items: Item[]; total: number }> {
    return this.request("/api/v1/items");
  }

  public async createItem(
    itemData: Partial<Item>,
  ): Promise<{ success: boolean; item: Item }> {
    return this.request("/api/v1/items", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  }

  public async adjustStock(
    itemId: string,
    type: "Add" | "Reduce",
    qty: number,
    reason: string,
  ): Promise<{ success: boolean; item: Item; newStock: number }> {
    return this.request("/api/v1/items/adjust-stock", {
      method: "POST",
      body: JSON.stringify({ itemId, type, qty, reason }),
    });
  }

  // --- Parties APIs ---
  public async getParties(): Promise<{ parties: Party[]; total: number }> {
    return this.request("/api/v1/parties");
  }

  public async createParty(
    partyData: Partial<Party>,
  ): Promise<{ success: boolean; party: Party }> {
    return this.request("/api/v1/parties", {
      method: "POST",
      body: JSON.stringify(partyData),
    });
  }

  // --- Expenses APIs ---
  public async getExpenses(): Promise<{ expenses: Expense[]; total: number }> {
    return this.request("/api/v1/expenses");
  }

  public async createExpense(
    expenseData: Partial<Expense>,
  ): Promise<{ success: boolean; expense: Expense }> {
    return this.request("/api/v1/expenses", {
      method: "POST",
      body: JSON.stringify(expenseData),
    });
  }

  // --- GSTIN Verification API ---
  public async verifyGstin(gstin: string): Promise<GSTVerificationResult> {
    return this.request(
      `/api/v1/gst/verify/${encodeURIComponent(gstin.trim())}`,
    );
  }

  // --- Delivery Challans APIs ---
  public async getDeliveryChallans(): Promise<{
    challans: DeliveryChallan[];
    total: number;
  }> {
    return this.request("/api/v1/delivery-challans");
  }

  public async createDeliveryChallan(
    data: Partial<DeliveryChallan>,
  ): Promise<{ success: boolean; challan: DeliveryChallan }> {
    return this.request("/api/v1/delivery-challans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async convertDeliveryChallan(
    challanId: string,
  ): Promise<{ success: boolean; invoice: SaleInvoice }> {
    return this.request("/api/v1/delivery-challans/convert", {
      method: "POST",
      body: JSON.stringify({ challanId }),
    });
  }

  // --- Sales Returns (Credit Notes) APIs ---
  public async getSalesReturns(): Promise<{
    returns: SalesReturn[];
    total: number;
  }> {
    return this.request("/api/v1/sales-returns");
  }

  public async createSalesReturn(
    data: Partial<SalesReturn>,
  ): Promise<{ success: boolean; returnDoc: SalesReturn }> {
    return this.request("/api/v1/sales-returns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Purchase Returns (Debit Notes) APIs ---
  public async getPurchaseReturns(): Promise<{
    returns: PurchaseReturn[];
    total: number;
  }> {
    return this.request("/api/v1/purchase-returns");
  }

  public async createPurchaseReturn(
    data: Partial<PurchaseReturn>,
  ): Promise<{ success: boolean; returnDoc: PurchaseReturn }> {
    return this.request("/api/v1/purchase-returns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Payments-In (Customer Khata) APIs ---
  public async getPaymentsIn(): Promise<{
    payments: PaymentIn[];
    total: number;
  }> {
    return this.request("/api/v1/payments-in");
  }

  public async createPaymentIn(
    data: Partial<PaymentIn>,
  ): Promise<{ success: boolean; payment: PaymentIn }> {
    return this.request("/api/v1/payments-in", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Payments-Out (Vendor Khata) APIs ---
  public async getPaymentsOut(): Promise<{
    payments: PaymentOut[];
    total: number;
  }> {
    return this.request("/api/v1/payments-out");
  }

  public async createPaymentOut(
    data: Partial<PaymentOut>,
  ): Promise<{ success: boolean; payment: PaymentOut }> {
    return this.request("/api/v1/payments-out", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- POS Fast Counter Billing API ---
  public async processPosBilling(posData: {
    items: Array<{
      id: string;
      name: string;
      qty: number;
      rate: number;
      gstRate: number;
    }>;
    tenderCash: number;
    paymentMode?: string;
    customerPhone?: string;
  }): Promise<{ success: boolean; invoice: SaleInvoice; change: number }> {
    return this.request("/api/v1/pos/billing", {
      method: "POST",
      body: JSON.stringify(posData),
    });
  }

  // --- Financial Reports (P&L, Daybook, UPI) ---
  public async getPnlReport(): Promise<PnlSummary> {
    return this.request("/api/v1/reports/pnl");
  }

  public async getDaybookReport(date?: string): Promise<DaybookSummary> {
    const q = date ? `?date=${encodeURIComponent(date)}` : "";
    return this.request(`/api/v1/reports/daybook${q}`);
  }

  public async getUpiQr(
    amount = 0,
    note = "Vyapar Bill Payment",
  ): Promise<UpiQrResponse> {
    return this.request(
      `/api/v1/upi/qr?amount=${amount}&note=${encodeURIComponent(note)}`,
    );
  }

  // --- Orders API ---
  public async getOrders(): Promise<{ orders: any[]; total: number }> {
    return this.request("/api/v1/orders");
  }

  public async createOrder(
    orderData: any,
  ): Promise<{ success: boolean; order: any }> {
    return this.request("/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }
}

export const apiClient = new MobileApiClient();
