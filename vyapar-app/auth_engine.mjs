// ==============================================================================
// Lekha Jokha - Production-Grade Unified Auth, RBAC & Strict Tenant Isolation Engine
// Shared by Web, Android, and Desktop platforms
// ==============================================================================

import crypto from 'node:crypto';

// Password Hashing using PBKDF2 with SHA-512 & unique 16-byte cryptographically secure salt
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  if (!password) {
    throw new Error('Password or PIN is required for hashing');
  }
  const hash = crypto.pbkdf2Sync(String(password), salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, storedHash, salt) {
  if (!password || !storedHash || !salt) return false;
  try {
    const computed = crypto.pbkdf2Sync(String(password), salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
  } catch {
    return false;
  }
}

// Role Permissions Matrix
export const ROLE_PERMISSIONS = {
  Owner: ['*'],
  Admin: ['*'],
  Accountant: [
    'view_dashboard',
    'view_reports',
    'view_sales',
    'create_sale',
    'view_purchases',
    'create_purchase',
    'manage_expenses',
    'view_parties',
    'create_party',
    'view_items',
    'cash_bank',
    'eway_bill',
    'view_orders'
  ],
  Salesperson: [
    'view_dashboard',
    'view_sales',
    'create_sale',
    'view_items',
    'view_parties',
    'create_party',
    'view_orders',
    'create_order'
  ],
  'Inventory Manager': [
    'view_dashboard',
    'view_items',
    'create_item',
    'edit_item',
    'adjust_stock',
    'view_purchases',
    'create_purchase'
  ],
  Cashier: [
    'view_dashboard',
    'view_sales',
    'create_sale',
    'pos_billing',
    'view_items',
    'view_parties',
    'create_party'
  ],
  Biller: [
    'view_dashboard',
    'view_sales',
    'create_sale',
    'pos_billing',
    'view_items',
    'view_parties',
    'create_party'
  ],
  'Read-Only User': [
    'view_dashboard',
    'view_sales',
    'view_purchases',
    'view_items',
    'view_parties',
    'view_reports',
    'view_orders'
  ]
};

export function hasPermission(role, permission) {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  if (perms.includes('*')) return true;
  return perms.includes(permission);
}

// Session Creation Helper
export function createSession(serverDb, user, subscriber, activeBusinessId, req, extra = {}) {
  if (!serverDb.sessions) serverDb.sessions = {};

  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = `SESS-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day session validity

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Client';
  const platform = extra.platform || req.headers['x-client-platform'] || (
    userAgent.includes('Android') ? 'Android' : userAgent.includes('Electron') ? 'Desktop' : 'Web'
  );
  const deviceId = extra.deviceId || req.headers['x-device-id'] || `DEV-${crypto.randomBytes(8).toString('hex')}`;
  const deviceName = extra.deviceName || `${platform} Device (${clientIp.slice(0, 15)})`;

  const session = {
    id: sessionId,
    token,
    userId: user.id,
    subscriberId: subscriber ? subscriber.id : user.subscriberId,
    activeBusinessId: activeBusinessId || subscriber?.activeBusinessId || 'BIZ-001',
    platform,
    deviceId,
    deviceName,
    ip: clientIp,
    userAgent,
    status: 'Active',
    createdAt: now.toISOString(),
    lastActiveAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  serverDb.sessions[token] = session;
  return session;
}

// Session Revocation
export function revokeSession(serverDb, tokenOrSessionId) {
  if (!serverDb.sessions) return false;
  for (const [token, sess] of Object.entries(serverDb.sessions)) {
    if (token === tokenOrSessionId || sess.id === tokenOrSessionId || sess.deviceId === tokenOrSessionId) {
      sess.status = 'Revoked';
      sess.revokedAt = new Date().toISOString();
      delete serverDb.sessions[token];
      return true;
    }
  }
  return false;
}

// Revoke All Sessions for User (Except optionally keepCurrentToken)
export function revokeAllUserSessions(serverDb, userId, keepToken = null) {
  if (!serverDb.sessions) return 0;
  let revokedCount = 0;
  for (const [token, sess] of Object.entries(serverDb.sessions)) {
    if (sess.userId === userId && token !== keepToken) {
      sess.status = 'Revoked';
      sess.revokedAt = new Date().toISOString();
      delete serverDb.sessions[token];
      revokedCount++;
    }
  }
  return revokedCount;
}

// Authenticate Request & Enforce Tenant Isolation
export function authenticateRequest(req, res, serverDb, requiredPermission = null) {
  // 1. Extract bearer token
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  let token = null;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token || !serverDb.sessions || !serverDb.sessions[token]) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication token is required to access protected business resources.'
    }));
    return null;
  }

  const session = serverDb.sessions[token];

  // 2. Check session expiry & status
  const now = new Date();
  if (session.status !== 'Active' || new Date(session.expiresAt) < now) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'SESSION_EXPIRED',
      message: 'Your login session has expired or been revoked. Please sign in again.'
    }));
    return null;
  }

  // Touch session activity
  session.lastActiveAt = now.toISOString();

  // 3. Resolve user
  const user = (serverDb.users || []).find(u => u.id === session.userId);
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'USER_NOT_FOUND',
      message: 'The user account associated with this session no longer exists.'
    }));
    return null;
  }

  if (user.status === 'Suspended' || user.status === 'Deactivated') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'FORBIDDEN_ACCOUNT_SUSPENDED',
      code: 'FORBIDDEN_ACCOUNT_SUSPENDED',
      message: 'This user account has been suspended or deactivated. Access is denied.'
    }));
    return null;
  }

  // 4. Resolve and Validate Target Business Context
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const explicitBizId = req.headers['x-business-id'] || urlObj.searchParams.get('businessId');
  let targetBizId = explicitBizId || session.activeBusinessId || 'BIZ-001';

  // Find target business
  let business = (serverDb.businesses || []).find(b => b.id === targetBizId);
  let isOwner = business && user.subscriberId === business.subscriberId;
  let membership = business && (serverDb.businessMemberships || []).find(
    m => m.businessId === targetBizId && m.userId === user.id && m.status === 'Active'
  );

  // Fallback for global session restoration and discovery (/api/v1/auth/me, /api/v1/businesses)
  // If the client's cached businessId is invalid or unauthorized, gracefully fall back to their first authorized business
  const isGlobalAuthOrListing = urlObj.pathname === '/api/v1/auth/me' || urlObj.pathname === '/api/v1/businesses' || urlObj.pathname === '/api/v1/auth/sessions';
  if (isGlobalAuthOrListing && (!business || (!isOwner && !membership))) {
    const accessible = (serverDb.businesses || []).filter(b => {
      if (b.status === 'Deactivated') return false;
      if (b.subscriberId === user.subscriberId) return true;
      return (serverDb.businessMemberships || []).some(
        m => m.businessId === b.id && m.userId === user.id && m.status === 'Active'
      );
    });
    if (accessible.length > 0) {
      targetBizId = accessible[0].id;
      business = accessible[0];
      isOwner = user.subscriberId === business.subscriberId;
      membership = (serverDb.businessMemberships || []).find(
        m => m.businessId === targetBizId && m.userId === user.id && m.status === 'Active'
      );
      session.activeBusinessId = targetBizId;
    }
  }

  if (!business) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'BUSINESS_NOT_FOUND',
      code: 'BUSINESS_NOT_FOUND',
      message: `Business entity ${targetBizId} does not exist.`
    }));
    return null;
  }

  if (business.status === 'Deactivated') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'BUSINESS_DEACTIVATED',
      code: 'BUSINESS_DEACTIVATED',
      message: `Business ${business.name} is currently deactivated.`
    }));
    return null;
  }

  // 5. ENFORCE STRICT DATA ISOLATION (Verify membership or ownership)
  if (!isOwner && !membership) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'FORBIDDEN_BUSINESS_ACCESS',
      code: 'FORBIDDEN_BUSINESS_ACCESS',
      message: 'Unauthorized: You do not have permissions to access or modify records for this business.'
    }));
    return null;
  }

  const effectiveRole = isOwner ? 'Owner' : (membership.role || user.role || 'Biller');

  // 6. Check Granular RBAC Permissions
  if (requiredPermission && !hasPermission(effectiveRole, requiredPermission)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'FORBIDDEN_PERMISSION_DENIED',
      code: 'FORBIDDEN_PERMISSION_DENIED',
      message: `Role '${effectiveRole}' lacks required permission '${requiredPermission}' for this operation.`
    }));
    return null;
  }

  const subscriber = (serverDb.subscribers || []).find(s => s.id === business.subscriberId) || serverDb.subscriber;
  const bData = (serverDb.businessData && serverDb.businessData[targetBizId]) || null;

  return {
    user,
    subscriber,
    session,
    business,
    businessId: targetBizId,
    activeBusinessId: targetBizId,
    businessData: bData,
    role: effectiveRole,
    isOwner
  };
}

// Related-Record Cross-Tenant Integrity Check
export function validateRelatedRecords(businessData, { partyId, items } = {}) {
  if (!businessData) {
    return { valid: false, error: 'Business data store not initialized' };
  }
  if (partyId) {
    const partyExists = (businessData.parties || []).some(p => p.id === partyId);
    if (!partyExists) {
      const error = `CROSS_TENANT_VIOLATION: Customer/Supplier '${partyId}' does not belong to the authorized business.`;
      return { valid: false, error };
    }
  }

  if (Array.isArray(items)) {
    for (const line of items) {
      if (line && line.itemId) {
        const itemExists = (businessData.items || []).some(i => i.id === line.itemId);
        if (!itemExists) {
          const error = `CROSS_TENANT_VIOLATION: Product/Inventory item '${line.itemId}' does not belong to the authorized business.`;
          return { valid: false, error };
        }
      }
    }
  }
  return { valid: true };
}

export function assertRelatedRecords(businessData, related) {
  const check = validateRelatedRecords(businessData, related);
  if (!check.valid) {
    throw new Error(check.error);
  }
}
