// ==============================================================================
// Lekha Jokha - Production PostgreSQL Repository Layer
// Parameterized Queries, Transaction Boundaries, Strict Multi-Tenancy & Idempotency
// ==============================================================================

import { postgresDb } from "./postgres_db_manager.mjs";

export class PostgresRepository {
  constructor(db = postgresDb) {
    this.db = db;
  }

  // ============================================================================
  // 1. AUTHENTICATION & USERS
  // ============================================================================

  async findUserByIdentifier(identifier) {
    if (!identifier) return null;
    const cleanIdent = String(identifier).trim().toLowerCase();
    // Strictly enforce minimum 10-digit normalized phone number to prevent substring ambiguity
    const rawDigits = String(identifier).replace(/[^0-9]/g, "");
    const phoneLookupKey = rawDigits.length >= 10 ? rawDigits.slice(-10) : "";

    const res = await this.db.query(
      `
      SELECT u.*, s.plan_tier, s.status as subscriber_status
      FROM users u
      LEFT JOIN subscribers s ON u.subscriber_id = s.id
      WHERE LOWER(u.id) = $1
         OR LOWER(u.email) = $1
         OR ($2 != '' AND u.phone IS NOT NULL AND u.phone LIKE '%' || $2)
      LIMIT 1;
    `,
      [cleanIdent, phoneLookupKey],
    );

    if (res.rows.length > 0) {
      return this._mapUser(res.rows[0]);
    }

    // Fallback check in subscribers table for owner accounts
    const subRes = await this.db.query(
      `
      SELECT * FROM subscribers
      WHERE LOWER(id) = $1
         OR LOWER(email) = $1
         OR ($2 != '' AND phone IS NOT NULL AND phone LIKE '%' || $2)
      LIMIT 1;
    `,
      [cleanIdent, phoneLookupKey],
    );

    if (subRes.rows.length > 0) {
      const sub = subRes.rows[0];
      return {
        id: `U-${sub.id}`,
        subscriberId: sub.id,
        name: sub.name,
        email: sub.email,
        phone: sub.phone,
        role: "Owner",
        permissions: ["*"],
        passwordHash: sub.password_hash,
        salt: sub.salt,
        pinHash: sub.pin_hash,
        status: sub.status || "Active",
        plan: sub.plan_tier,
      };
    }

    return null;
  }

  async findUserById(userId) {
    if (!userId) return null;
    const res = await this.db.query(
      `
      SELECT u.*, s.plan_tier
      FROM users u
      LEFT JOIN subscribers s ON u.subscriber_id = s.id
      WHERE u.id = $1
      LIMIT 1;
    `,
      [userId],
    );

    return res.rows.length > 0 ? this._mapUser(res.rows[0]) : null;
  }

  _mapUser(row) {
    return {
      id: row.id,
      subscriberId: row.subscriber_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      title: row.title,
      permissions:
        typeof row.permissions === "string"
          ? JSON.parse(row.permissions)
          : row.permissions || [],
      passwordHash: row.password_hash,
      salt: row.salt,
      pin: row.pin,
      pinHash: row.pin_hash,
      status: row.status,
      createdAt: row.created_at,
      plan: row.plan_tier,
    };
  }

  async saveUser(user) {
    const res = await this.db.query(
      `
      INSERT INTO users (
        id, subscriber_id, name, email, phone, role, title,
        permissions, password_hash, salt, pin, pin_hash, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
        salt = COALESCE(EXCLUDED.salt, users.salt),
        pin = COALESCE(EXCLUDED.pin, users.pin),
        pin_hash = COALESCE(EXCLUDED.pin_hash, users.pin_hash),
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING *;
    `,
      [
        user.id,
        user.subscriberId,
        user.name,
        user.email || null,
        user.phone || null,
        user.role || "Biller",
        user.title || null,
        JSON.stringify(user.permissions || []),
        user.passwordHash || null,
        user.salt || null,
        user.pin || null,
        user.pinHash || null,
        user.status || "Active",
        user.createdAt || new Date(),
      ],
    );
    return this._mapUser(res.rows[0]);
  }

  // ============================================================================
  // 2. SESSIONS & SECURITY
  // ============================================================================

  async createSession(token, sessionData) {
    await this.db.query(
      `
      INSERT INTO sessions (token, user_id, subscriber_id, business_id, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (token) DO UPDATE SET
        business_id = EXCLUDED.business_id,
        expires_at = EXCLUDED.expires_at;
    `,
      [
        token,
        sessionData.userId,
        sessionData.subscriberId || null,
        sessionData.businessId || null,
        sessionData.ipAddress || null,
        sessionData.userAgent || null,
        sessionData.expiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000),
      ],
    );
  }

  async getSession(token) {
    if (!token) return null;
    const res = await this.db.query(
      `
      SELECT s.*, u.name, u.role, u.permissions, u.status as user_status
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = $1 AND s.expires_at > NOW()
      LIMIT 1;
    `,
      [token],
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      token: row.token,
      userId: row.user_id,
      subscriberId: row.subscriber_id,
      businessId: row.business_id,
      user: this._mapUser(row),
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }

  async revokeSession(token) {
    await this.db.query("DELETE FROM sessions WHERE token = $1;", [token]);
  }

  async revokeAllUserSessions(userId) {
    await this.db.query("DELETE FROM sessions WHERE user_id = $1;", [userId]);
  }

  // ============================================================================
  // 3. BUSINESSES & MEMBERSHIP
  // ============================================================================

  async getBusinessesForUser(userId) {
    const res = await this.db.query(
      `
      SELECT b.*, m.role as user_role
      FROM businesses b
      JOIN business_memberships m ON b.id = m.business_id
      WHERE m.user_id = $1 AND m.status = 'Active' AND b.status = 'Active'
      ORDER BY b.created_at ASC;
    `,
      [userId],
    );

    return res.rows.map((r) => ({
      id: r.id,
      subscriberId: r.subscriber_id,
      name: r.name,
      legalName: r.legal_name,
      gstin: r.gstin,
      state: r.state,
      phone: r.phone,
      email: r.email,
      status: r.status,
      userRole: r.user_role,
      createdAt: r.created_at,
    }));
  }

  async getBusinessById(bizId) {
    const res = await this.db.query(
      "SELECT * FROM businesses WHERE id = $1 LIMIT 1;",
      [bizId],
    );
    return res.rows[0] || null;
  }

  async checkMembership(businessId, userId) {
    const res = await this.db.query(
      `
      SELECT * FROM business_memberships
      WHERE business_id = $1 AND user_id = $2 AND status = 'Active'
      LIMIT 1;
    `,
      [businessId, userId],
    );
    return res.rows[0] || null;
  }

  async saveBusiness(biz, subscriberId) {
    const res = await this.db.query(
      `
      INSERT INTO businesses (id, subscriber_id, name, legal_name, gstin, state, phone, email, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        gstin = EXCLUDED.gstin,
        state = EXCLUDED.state,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING *;
    `,
      [
        biz.id,
        subscriberId,
        biz.name,
        biz.legalName || biz.name,
        biz.gstin || null,
        biz.state || "Delhi (07)",
        biz.phone || null,
        biz.email || null,
        biz.status || "Active",
      ],
    );

    // Ensure business profile exists
    await this.db.query(
      `
      INSERT INTO business_profiles (business_id, business_name, legal_name, state, gstin)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (business_id) DO NOTHING;
    `,
      [
        biz.id,
        biz.name,
        biz.legalName || biz.name,
        biz.state || "Delhi (07)",
        biz.gstin || null,
      ],
    );

    return res.rows[0];
  }

  async saveMembership(id, businessId, userId, role = "Owner") {
    const res = await this.db.query(
      `
      INSERT INTO business_memberships (id, business_id, user_id, role, status)
      VALUES ($1, $2, $3, $4, 'Active')
      ON CONFLICT (business_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = 'Active'
      RETURNING *;
    `,
      [id, businessId, userId, role],
    );
    return res.rows[0];
  }

  // ============================================================================
  // 4. PARTIES (Customers & Suppliers)
  // ============================================================================

  async getParties(businessId) {
    const res = await this.db.query(
      `
      SELECT * FROM parties
      WHERE business_id = $1
      ORDER BY name ASC;
    `,
      [businessId],
    );

    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      phone: r.phone || "",
      email: r.email || "",
      gstin: r.gstin || "",
      address: r.address || "",
      state: r.state || "",
      balance: parseFloat(r.current_balance || 0),
      createdAt: r.created_at,
    }));
  }

  async saveParty(businessId, party) {
    const res = await this.db.query(
      `
      INSERT INTO parties (
        id, business_id, name, type, phone, email, gstin, address, state, current_balance, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (business_id, id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        gstin = EXCLUDED.gstin,
        address = EXCLUDED.address,
        state = EXCLUDED.state,
        current_balance = EXCLUDED.current_balance,
        updated_at = NOW()
      RETURNING *;
    `,
      [
        party.id,
        businessId,
        party.name,
        party.type || "Customer",
        party.phone || null,
        party.email || null,
        party.gstin || null,
        party.address || null,
        party.state || null,
        Number(party.balance || 0),
        party.createdAt || new Date(),
      ],
    );

    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      phone: r.phone || "",
      email: r.email || "",
      gstin: r.gstin || "",
      address: r.address || "",
      state: r.state || "",
      balance: parseFloat(r.current_balance || 0),
      createdAt: r.created_at,
    };
  }

  async deleteParty(businessId, partyId) {
    if (!businessId || !partyId) return false;
    const res = await this.db.query(
      `
      DELETE FROM parties
      WHERE business_id = $1 AND id = $2
      RETURNING *;
    `,
      [businessId, partyId],
    );
    return res.rows.length > 0;
  }

  // ============================================================================
  // 5. ITEMS & INVENTORY
  // ============================================================================

  async getItems(businessId) {
    const res = await this.db.query(
      `
      SELECT * FROM items
      WHERE business_id = $1
      ORDER BY name ASC;
    `,
      [businessId],
    );

    return res.rows.map((r) => ({
      id: r.id,
      barcode: r.barcode || "",
      name: r.name,
      category: r.category || "General",
      hsn: r.hsn || "",
      unit: r.unit || "PCS",
      salePrice: parseFloat(r.sale_price || 0),
      purchasePrice: parseFloat(r.purchase_price || 0),
      gstRate: parseFloat(r.gst_rate || 0),
      stock: parseFloat(r.current_stock || 0),
      minStock: parseFloat(r.min_stock_alert || 0),
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  async saveItem(businessId, item) {
    const res = await this.db.query(
      `
      INSERT INTO items (
        id, business_id, barcode, name, category, hsn, unit,
        sale_price, purchase_price, gst_rate, current_stock, min_stock_alert, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (business_id, id) DO UPDATE SET
        barcode = EXCLUDED.barcode,
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        hsn = EXCLUDED.hsn,
        unit = EXCLUDED.unit,
        sale_price = EXCLUDED.sale_price,
        purchase_price = EXCLUDED.purchase_price,
        gst_rate = EXCLUDED.gst_rate,
        current_stock = EXCLUDED.current_stock,
        min_stock_alert = EXCLUDED.min_stock_alert,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING *;
    `,
      [
        item.id,
        businessId,
        item.barcode || null,
        item.name,
        item.category || "General",
        item.hsn || null,
        item.unit || "PCS",
        Number(item.salePrice || 0),
        Number(item.purchasePrice || 0),
        Number(item.gstRate || 0),
        Number(item.stock || item.currentStock || 0),
        Number(item.minStock || 5),
        item.status || "Active",
        item.createdAt || new Date(),
      ],
    );

    const r = res.rows[0];
    return {
      id: r.id,
      barcode: r.barcode || "",
      name: r.name,
      category: r.category || "General",
      hsn: r.hsn || "",
      unit: r.unit || "PCS",
      salePrice: parseFloat(r.sale_price || 0),
      purchasePrice: parseFloat(r.purchase_price || 0),
      gstRate: parseFloat(r.gst_rate || 0),
      stock: parseFloat(r.current_stock || 0),
      minStock: parseFloat(r.min_stock_alert || 0),
      status: r.status,
      createdAt: r.created_at,
    };
  }

  // ============================================================================
  // 6. SALES & INVOICES (With Transaction & Idempotency Protection)
  // ============================================================================

  async getSales(businessId) {
    const res = await this.db.query(
      `
      SELECT * FROM sales
      WHERE business_id = $1
      ORDER BY invoice_date DESC, created_at DESC;
    `,
      [businessId],
    );

    return res.rows.map((r) => ({
      id: r.id,
      number: r.invoice_number,
      invoiceNumber: r.invoice_number,
      docType: r.doc_type,
      date: r.invoice_date,
      partyId: r.party_id,
      partyName: r.party_name,
      placeOfSupply: r.place_of_supply,
      paymentMode: r.payment_mode,
      subtotal: parseFloat(r.subtotal || 0),
      taxAmount: parseFloat(r.tax_amount || 0),
      total: parseFloat(r.grand_total || 0),
      grandTotal: parseFloat(r.grand_total || 0),
      paidAmount: parseFloat(r.paid_amount || 0),
      paid: parseFloat(r.paid_amount || 0),
      balanceDue: parseFloat(r.balance_due || 0),
      status: r.payment_status,
      paymentStatus: r.payment_status,
      ewayBillNumber: r.eway_bill_number,
      notes: r.notes,
      items:
        typeof r.items_json === "string"
          ? JSON.parse(r.items_json)
          : r.items_json || [],
      createdAt: r.created_at,
    }));
  }

  async saveSaleWithTransaction(businessId, sale) {
    return await this.db.withTransaction(async (client) => {
      // 1. Idempotency Check
      if (sale.idempotencyKey) {
        const existing = await client.query(
          `
          SELECT * FROM sales WHERE business_id = $1 AND idempotency_key = $2 LIMIT 1;
        `,
          [businessId, sale.idempotencyKey],
        );
        if (existing.rows.length > 0) {
          const r = existing.rows[0];
          return {
            id: r.id,
            invoiceNumber: r.invoice_number,
            grandTotal: parseFloat(r.grand_total),
            _idempotent: true,
          };
        }
      }

      const sId = sale.id || sale.invoiceNumber || sale.number;
      const subtotal = Number(sale.subtotal || 0);
      const taxAmount = Number(sale.taxAmount || sale.tax || 0);
      const grandTotal = Number(sale.grandTotal || sale.total || 0);
      const paidAmount = Number(sale.paidAmount || sale.paid || 0);
      const balanceDue = Number(sale.balanceDue || grandTotal - paidAmount);
      const itemsList = Array.isArray(sale.items) ? sale.items : [];

      // 2. Insert or Update Sale Header
      const res = await client.query(
        `
        INSERT INTO sales (
          id, business_id, invoice_number, doc_type, invoice_date,
          party_id, party_name, place_of_supply, payment_mode,
          subtotal, tax_amount, grand_total, paid_amount, balance_due,
          payment_status, eway_bill_number, notes, idempotency_key, items_json, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (business_id, id) DO UPDATE SET
          invoice_date = EXCLUDED.invoice_date,
          subtotal = EXCLUDED.subtotal,
          tax_amount = EXCLUDED.tax_amount,
          grand_total = EXCLUDED.grand_total,
          paid_amount = EXCLUDED.paid_amount,
          balance_due = EXCLUDED.balance_due,
          payment_status = EXCLUDED.payment_status,
          items_json = EXCLUDED.items_json,
          notes = EXCLUDED.notes,
          updated_at = NOW()
        RETURNING *;
      `,
        [
          sId,
          businessId,
          sale.invoiceNumber || sale.number || sId,
          sale.docType || "Invoice",
          sale.date ||
            sale.invoiceDate ||
            new Date().toISOString().slice(0, 10),
          sale.partyId || null,
          sale.partyName || "Cash Sale",
          sale.placeOfSupply || null,
          sale.paymentMode || "Credit",
          subtotal,
          taxAmount,
          grandTotal,
          paidAmount,
          balanceDue,
          sale.paymentStatus ||
            (balanceDue <= 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid"),
          sale.ewayBillNumber || null,
          sale.notes || null,
          sale.idempotencyKey || null,
          JSON.stringify(itemsList),
          sale.createdAt || new Date(),
        ],
      );

      // 3. Atomically Replace Line Items
      await client.query(
        "DELETE FROM sale_line_items WHERE business_id = $1 AND sale_id = $2;",
        [businessId, sId],
      );

      for (const item of itemsList) {
        await client.query(
          `
          INSERT INTO sale_line_items (
            business_id, sale_id, item_id, item_name, hsn, quantity, unit, rate, gst_rate, tax_amount, total_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
        `,
          [
            businessId,
            sId,
            item.itemId || item.id || null,
            item.name || item.itemName || "Item",
            item.hsn || null,
            Number(item.qty || item.quantity || 1),
            item.unit || "PCS",
            Number(item.rate || item.salePrice || 0),
            Number(item.gstRate || 0),
            Number(item.taxAmount || 0),
            Number(item.total || item.amount || 0),
          ],
        );

        // Stock deduction for Invoices
        if (
          (sale.docType || "Invoice") === "Invoice" &&
          (item.itemId || item.id)
        ) {
          await client.query(
            `
            UPDATE items
            SET current_stock = current_stock - $1, updated_at = NOW()
            WHERE business_id = $2 AND id = $3;
          `,
            [
              Number(item.qty || item.quantity || 1),
              businessId,
              item.itemId || item.id,
            ],
          );
        }
      }

      // 4. Update Party Balance if Credit Sale
      if (sale.partyId && balanceDue !== 0) {
        await client.query(
          `
          UPDATE parties
          SET current_balance = current_balance + $1, updated_at = NOW()
          WHERE business_id = $2 AND id = $3;
        `,
          [balanceDue, businessId, sale.partyId],
        );
      }

      const r = res.rows[0];
      return {
        id: r.id,
        number: r.invoice_number,
        invoiceNumber: r.invoice_number,
        grandTotal: parseFloat(r.grand_total),
        paidAmount: parseFloat(r.paid_amount),
        balanceDue: parseFloat(r.balance_due),
        status: r.payment_status,
      };
    });
  }

  // ============================================================================
  // 7. COMPLETE TENANT DATA EXPORT FOR COMPATIBILITY
  // ============================================================================

  async getCompleteTenantData(businessId) {
    const [
      parties,
      items,
      sales,
      purchases,
      expenses,
      orders,
      paymentsIn,
      paymentsOut,
      ewayBills,
      salesmen,
      profileRes,
      cashRes,
      bankRes,
    ] = await Promise.all([
      this.getParties(businessId),
      this.getItems(businessId),
      this.getSales(businessId),
      this.db.query(
        "SELECT * FROM purchases WHERE business_id = $1 ORDER BY bill_date DESC;",
        [businessId],
      ),
      this.db.query(
        "SELECT * FROM expenses WHERE business_id = $1 ORDER BY expense_date DESC;",
        [businessId],
      ),
      this.db.query(
        "SELECT * FROM orders WHERE business_id = $1 ORDER BY order_date DESC;",
        [businessId],
      ),
      this.db.query(
        "SELECT * FROM payments_in WHERE business_id = $1 ORDER BY payment_date DESC;",
        [businessId],
      ),
      this.db.query(
        "SELECT * FROM payments_out WHERE business_id = $1 ORDER BY payment_date DESC;",
        [businessId],
      ),
      this.db.query(
        "SELECT * FROM eway_bills WHERE business_id = $1 ORDER BY eway_date DESC;",
        [businessId],
      ),
      this.db.query(
        "SELECT * FROM salesmen WHERE business_id = $1 ORDER BY name ASC;",
        [businessId],
      ),
      this.db.query(
        "SELECT * FROM business_profiles WHERE business_id = $1 LIMIT 1;",
        [businessId],
      ),
      this.db.query(
        "SELECT * FROM cash_in_hand WHERE business_id = $1 LIMIT 1;",
        [businessId],
      ),
      this.db.query(
        "SELECT * FROM cash_bank_accounts WHERE business_id = $1;",
        [businessId],
      ),
    ]);

    const bp = profileRes.rows[0] || {};
    const cashInHand = cashRes.rows[0] ? parseFloat(cashRes.rows[0].amount) : 0;
    const bankAccounts = bankRes.rows.map((b) => ({
      id: b.id,
      accountName: b.account_name,
      bankName: b.bank_name,
      accountNumber: b.account_number,
      ifsc: b.ifsc,
      openingBalance: parseFloat(b.opening_balance || 0),
      currentBalance: parseFloat(b.current_balance || 0),
    }));

    return {
      parties,
      items,
      sales,
      purchases: purchases.rows.map((r) => ({
        id: r.id,
        number: r.bill_number,
        billNumber: r.bill_number,
        date: r.bill_date,
        partyId: r.party_id,
        partyName: r.party_name,
        paymentMode: r.payment_mode,
        subtotal: parseFloat(r.subtotal || 0),
        taxAmount: parseFloat(r.tax_amount || 0),
        total: parseFloat(r.grand_total || 0),
        grandTotal: parseFloat(r.grand_total || 0),
        paidAmount: parseFloat(r.paid_amount || 0),
        balanceDue: parseFloat(r.balance_due || 0),
        items:
          typeof r.items_json === "string"
            ? JSON.parse(r.items_json)
            : r.items_json || [],
        createdAt: r.created_at,
      })),
      orders: orders.rows.map((r) => ({
        id: r.id,
        orderNumber: r.order_number,
        date: r.order_date,
        partyId: r.party_id,
        partyName: r.party_name,
        total: parseFloat(r.total || 0),
        status: r.status,
        deliveryDate: r.delivery_date,
        notes: r.notes,
        items:
          typeof r.items_json === "string"
            ? JSON.parse(r.items_json)
            : r.items_json || [],
        createdAt: r.created_at,
      })),
      expenses: expenses.rows.map((r) => ({
        id: r.id,
        date: r.expense_date,
        category: r.category,
        description: r.description,
        amount: parseFloat(r.amount || 0),
        paymentMode: r.payment_mode,
        referenceNumber: r.reference_number,
        createdAt: r.created_at,
      })),
      cashBank: {
        cashInHand,
        bankAccounts,
      },
      paymentsIn: paymentsIn.rows.map((r) => ({
        id: r.id,
        number: r.payment_number,
        date: r.payment_date,
        partyId: r.party_id,
        partyName: r.party_name,
        amount: parseFloat(r.amount || 0),
        paymentMode: r.payment_mode,
        txRef: r.tx_ref,
        notes: r.notes,
        createdAt: r.created_at,
      })),
      paymentsOut: paymentsOut.rows.map((r) => ({
        id: r.id,
        number: r.payment_number,
        date: r.payment_date,
        partyId: r.party_id,
        partyName: r.party_name,
        amount: parseFloat(r.amount || 0),
        paymentMode: r.payment_mode,
        txRef: r.tx_ref,
        notes: r.notes,
        createdAt: r.created_at,
      })),
      ewayBills: ewayBills.rows.map((r) => ({
        id: r.id,
        ewayNumber: r.eway_number,
        ewayDate: r.eway_date,
        validUntil: r.valid_until,
        invoiceNumber: r.invoice_number,
        partyName: r.party_name,
        partyGstin: r.party_gstin,
        vehicleNumber: r.vehicle_number,
        transporterName: r.transporter_name,
        totalValue: parseFloat(r.total_value || 0),
        status: r.status,
        createdAt: r.created_at,
      })),
      salesmen: salesmen.rows.map((r) => ({
        id: r.id,
        empId: r.emp_id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        territory: r.territory,
        role: r.role,
        status: r.status,
        createdAt: r.created_at,
      })),
      businessProfile: {
        businessName: bp.business_name || `Business ${businessId}`,
        legalName: bp.legal_name || bp.business_name || "",
        phone: bp.phone || "",
        email: bp.email || "",
        address: bp.address || "",
        state: bp.state || "Delhi (07)",
        gstin: bp.gstin || "",
        pan: bp.pan || "",
        currency: bp.currency || "INR (₹)",
        invoicePrefix: bp.invoice_prefix || "INV-2026-",
        termsAndConditions: bp.terms_and_conditions || "",
        bankName: bp.bank_name || "",
        accountNumber: bp.account_number || "",
        ifscCode: bp.ifsc_code || "",
        branchName: bp.branch_name || "",
        upiId: bp.upi_id || "",
        logoUrl: bp.logo_url || "",
      },
    };
  }

  // ============================================================================
  // 8. PRODUCTION E-WAY BILL REPOSITORY METHODS
  // ============================================================================

  async getEwayConfig(businessId) {
    const res = await this.db.query(
      "SELECT * FROM business_eway_configs WHERE business_id = $1 LIMIT 1;",
      [businessId],
    );
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      provider: r.provider,
      isSandbox: r.is_sandbox,
      gstin: r.gstin,
      username: r.username,
      encryptedPassword: r.encrypted_password,
      clientId: r.client_id,
      encryptedClientSecret: r.encrypted_client_secret,
      gspBaseUrl: r.gsp_base_url,
      nicPublicKeyPem: r.nic_public_key_pem,
      authToken: r.auth_token,
      tokenExpiry: r.token_expiry,
    };
  }

  async saveEwayConfig(businessId, config) {
    const query = `
      INSERT INTO business_eway_configs (
        business_id, provider, is_sandbox, gstin, username,
        encrypted_password, client_id, encrypted_client_secret,
        gsp_base_url, nic_public_key_pem, auth_token, token_expiry, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (business_id) DO UPDATE SET
        provider = EXCLUDED.provider,
        is_sandbox = EXCLUDED.is_sandbox,
        gstin = EXCLUDED.gstin,
        username = EXCLUDED.username,
        encrypted_password = EXCLUDED.encrypted_password,
        client_id = EXCLUDED.client_id,
        encrypted_client_secret = EXCLUDED.encrypted_client_secret,
        gsp_base_url = EXCLUDED.gsp_base_url,
        nic_public_key_pem = EXCLUDED.nic_public_key_pem,
        auth_token = EXCLUDED.auth_token,
        token_expiry = EXCLUDED.token_expiry,
        updated_at = NOW();
    `;
    await this.db.query(query, [
      businessId,
      config.provider || "NIC_SANDBOX",
      config.isSandbox !== undefined ? config.isSandbox : true,
      config.gstin || "",
      config.username || "",
      config.encryptedPassword || "",
      config.clientId || "",
      config.encryptedClientSecret || "",
      config.gspBaseUrl || "",
      config.nicPublicKeyPem || "",
      config.authToken || null,
      config.tokenExpiry || null,
    ]);
  }

  async saveEwayRecord(r) {
    const query = `
      INSERT INTO eway_bills (
        id, business_id, eway_number, eway_date, valid_until,
        invoice_number, party_name, party_gstin, vehicle_number,
        transporter_name, total_value, status, doc_type, doc_date,
        supply_type, sub_supply_type, from_gstin, from_trd_name,
        from_addr1, from_place, from_pincode, from_state_code,
        to_gstin, to_trd_name, to_addr1, to_place, to_pincode, to_state_code,
        cgst_value, sgst_value, igst_value, cess_value,
        transporter_id, trans_distance, trans_mode, trans_doc_no, trans_doc_date,
        vehicle_type, item_list_json, raw_gov_response, audit_history_json,
        cancel_date, cancel_reason_code, cancel_remarks,
        idempotency_key, last_error_code, last_error_message, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
        $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38,
        $39, $40, $41, $42, $43, $44, $45, $46, $47, NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        eway_number = EXCLUDED.eway_number,
        eway_date = EXCLUDED.eway_date,
        valid_until = EXCLUDED.valid_until,
        vehicle_number = EXCLUDED.vehicle_number,
        status = EXCLUDED.status,
        audit_history_json = EXCLUDED.audit_history_json,
        cancel_date = EXCLUDED.cancel_date,
        cancel_reason_code = EXCLUDED.cancel_reason_code,
        cancel_remarks = EXCLUDED.cancel_remarks,
        last_error_code = EXCLUDED.last_error_code,
        last_error_message = EXCLUDED.last_error_message,
        raw_gov_response = EXCLUDED.raw_gov_response,
        updated_at = NOW();
    `;

    await this.db.query(query, [
      r.id,
      r.businessId,
      r.ewayBillNo || null,
      r.ewayBillDate || null,
      r.validUpto || null,
      r.docNo,
      r.toTrdName,
      r.toGstin,
      r.vehicleNo || null,
      r.transporterName || null,
      parseFloat(r.totalInvoiceValue || 0),
      r.status,
      r.docType || "INV",
      r.docDate,
      r.supplyType || "O",
      r.subSupplyType || "1",
      r.fromGstin,
      r.fromTrdName,
      r.fromAddr1,
      r.fromPlace,
      r.fromPincode,
      r.fromStateCode,
      r.toGstin,
      r.toTrdName,
      r.toAddr1,
      r.toPlace,
      r.toPincode,
      r.toStateCode,
      parseFloat(r.cgstValue || 0),
      parseFloat(r.sgstValue || 0),
      parseFloat(r.igstValue || 0),
      parseFloat(r.cessValue || 0),
      r.transporterId || null,
      parseFloat(r.transDistance || 0),
      r.transMode || "1",
      r.transDocNo || null,
      r.transDocDate || null,
      r.vehicleType || "R",
      JSON.stringify(r.itemList || []),
      r.rawGovResponse ? JSON.stringify(r.rawGovResponse) : null,
      JSON.stringify(r.auditHistory || []),
      r.cancelDate || null,
      r.cancelReasonCode || null,
      r.cancelRemarks || null,
      r.idempotencyKey || null,
      r.lastErrorCode || null,
      r.lastErrorMessage || null,
    ]);
  }

  async getEwayRecord(businessId, idOrNo) {
    const res = await this.db.query(
      `SELECT * FROM eway_bills WHERE business_id = $1 AND (id = $2 OR eway_number = $2) LIMIT 1;`,
      [businessId, idOrNo],
    );
    if (!res.rows[0]) return null;
    return this._mapEwayRow(res.rows[0]);
  }

  async findEwayByDocOrKey(businessId, docNo, idempotencyKey) {
    const res = await this.db.query(
      `SELECT * FROM eway_bills WHERE business_id = $1 AND (invoice_number = $2 OR idempotency_key = $3) LIMIT 1;`,
      [businessId, docNo, idempotencyKey],
    );
    if (!res.rows[0]) return null;
    return this._mapEwayRow(res.rows[0]);
  }

  async listEwayBills(businessId, filters = {}) {
    let query = `SELECT * FROM eway_bills WHERE business_id = $1`;
    const params = [businessId];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC;`;
    const res = await this.db.query(query, params);
    return res.rows.map((r) => this._mapEwayRow(r));
  }

  _mapEwayRow(r) {
    return {
      id: r.id,
      businessId: r.business_id,
      ewayBillNo: r.eway_number,
      ewayBillDate: r.eway_date,
      validUpto: r.valid_until,
      docNo: r.invoice_number,
      docType: r.doc_type || "INV",
      docDate: r.doc_date,
      status: r.status,
      fromGstin: r.from_gstin,
      fromTrdName: r.from_trd_name,
      fromAddr1: r.from_addr1,
      fromPlace: r.from_place,
      fromPincode: r.from_pincode,
      fromStateCode: r.from_state_code,
      toGstin: r.to_gstin,
      toTrdName: r.to_trd_name,
      toAddr1: r.to_addr1,
      toPlace: r.to_place,
      toPincode: r.to_pincode,
      toStateCode: r.to_state_code,
      totalInvoiceValue: parseFloat(r.total_value || 0),
      cgstValue: parseFloat(r.cgst_value || 0),
      sgstValue: parseFloat(r.sgst_value || 0),
      igstValue: parseFloat(r.igst_value || 0),
      cessValue: parseFloat(r.cess_value || 0),
      transporterId: r.transporter_id,
      transporterName: r.transporter_name,
      transDistance: parseFloat(r.trans_distance || 0),
      transMode: r.trans_mode,
      transDocNo: r.trans_doc_no,
      transDocDate: r.trans_doc_date,
      vehicleNo: r.vehicle_number,
      vehicleType: r.vehicle_type,
      itemList:
        typeof r.item_list_json === "string"
          ? JSON.parse(r.item_list_json)
          : r.item_list_json || [],
      rawGovResponse:
        typeof r.raw_gov_response === "string"
          ? JSON.parse(r.raw_gov_response)
          : r.raw_gov_response,
      auditHistory:
        typeof r.audit_history_json === "string"
          ? JSON.parse(r.audit_history_json)
          : r.audit_history_json || [],
      cancelDate: r.cancel_date,
      cancelReasonCode: r.cancel_reason_code,
      cancelRemarks: r.cancel_remarks,
      idempotencyKey: r.idempotency_key,
      lastErrorCode: r.last_error_code,
      lastErrorMessage: r.last_error_message,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

export const postgresRepo = new PostgresRepository();
export default postgresRepo;
