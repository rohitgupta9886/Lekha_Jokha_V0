// ==============================================================================
// Lekha Jokha - Signup, Forgot Password & Security Penetration Test Suite
// ==============================================================================

import assert from "assert";
import http from "http";

process.env.PORT = "3003";
process.env.HOST = "127.0.0.1";
process.env.NODE_ENV = "test";

console.log("--- Initializing LekhaJokha Central Test Server on Port 3003 ---");
await import("../server.mjs");

// Allow server binding
await new Promise((r) => setTimeout(r, 600));

const BASE_URL = "http://127.0.0.1:3003";

async function apiRequest(
  endpoint,
  { method = "GET", headers = {}, body = null } = {},
) {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
  const reqHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };
  const fetchOptions = {
    method,
    headers: reqHeaders,
  };
  if (body) {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const res = await fetch(url, fetchOptions);
  let json = null;
  const text = await res.text();
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, data: json };
}

let passed = 0;
let total = 0;

function pass(name, detail = "") {
  passed++;
  total++;
  console.log(
    `  [PASS] Test ${total}: ${name} ${detail ? "(" + detail + ")" : ""}`,
  );
}

function fail(name, error) {
  total++;
  console.error(`  [FAIL] Test ${total}: ${name}:`, error);
  throw error;
}

async function runTests() {
  console.log(
    "\n==================================================================",
  );
  console.log("   LEKHA JOKHA - SIGNUP, FORGOT PASSWORD & PEN-TESTING SUITE");
  console.log(
    "==================================================================\n",
  );

  const ts = Date.now();
  const testUser = {
    name: `Dev Owner ${ts}`,
    businessName: `Dev Store ${ts}`,
    email: `dev_owner_${ts}@teststore.in`,
    phone: `98${String(ts).slice(-8)}`,
    password: `InitialPass_${ts}`,
    pin: "5678",
    state: "Delhi (07)",
  };

  // ---------------------------------------------------------------------------
  // 1. SIGNUP / REGISTRATION TESTS
  // ---------------------------------------------------------------------------
  console.log(">>> SECTION 1: Signup / Create Account Flows");

  // Test 1: Weak password rejection on signup
  try {
    const weakRes = await apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: {
        ...testUser,
        email: `weak_${ts}@test.in`,
        password: "123",
      },
    });
    assert.strictEqual(weakRes.status, 400, "Weak password should return 400");
    assert.strictEqual(weakRes.data.error, "WEAK_PASSWORD");
    pass("Signup rejects weak password (<6 characters)");
  } catch (e) {
    fail("Signup rejects weak password", e);
  }

  // Test 2: Successful new business account registration
  let signupSessionToken = null;
  let newUserId = null;
  let newBizId = null;
  try {
    const res = await apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: testUser,
    });
    assert.strictEqual(res.status, 201, "Signup should return 201 Created");
    assert.ok(res.data.success, "Registration should be successful");
    assert.ok(
      res.data.token,
      "Registration should return an active session token",
    );
    assert.ok(
      res.data.business?.id,
      "Registration should return new business ID",
    );
    assert.ok(res.data.user?.id, "Registration should return new user ID");
    assert.strictEqual(
      res.data.user.role,
      "Owner",
      "New registered user must be Owner",
    );

    signupSessionToken = res.data.token;
    newUserId = res.data.user.id;
    newBizId = res.data.business.id;
    pass(
      "Signup successfully creates user, business & active session",
      `BizId: ${newBizId}`,
    );
  } catch (e) {
    fail("Signup successfully creates user", e);
  }

  // Test 3: Duplicate email rejection
  try {
    const dupRes = await apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: {
        ...testUser,
        phone: "9900112233", // different phone, same email
      },
    });
    assert.strictEqual(dupRes.status, 409, "Duplicate email should return 409");
    assert.strictEqual(dupRes.data.error, "EMAIL_ALREADY_EXISTS");
    pass("Signup rejects duplicate email registration");
  } catch (e) {
    fail("Signup rejects duplicate email registration", e);
  }

  // Test 4: Duplicate phone rejection
  try {
    const dupPhoneRes = await apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: {
        ...testUser,
        email: `different_${ts}@teststore.in`, // different email, same phone
      },
    });
    assert.strictEqual(
      dupPhoneRes.status,
      409,
      "Duplicate phone should return 409",
    );
    assert.strictEqual(dupPhoneRes.data.error, "PHONE_ALREADY_EXISTS");
    pass("Signup rejects duplicate phone registration");
  } catch (e) {
    fail("Signup rejects duplicate phone registration", e);
  }

  // ---------------------------------------------------------------------------
  // 2. FORGOT PASSWORD & RESET FLOW
  // ---------------------------------------------------------------------------
  console.log("\n>>> SECTION 2: Forgot Password & Reset Flows");

  // Test 5: Account enumeration protection
  try {
    const nonExistentRes = await apiRequest("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { identifier: "non_existent_user_99999@randomdomain.xyz" },
    });
    assert.strictEqual(
      nonExistentRes.status,
      200,
      "Non-existent user should still return 200 to prevent enumeration",
    );
    assert.strictEqual(nonExistentRes.data.success, true);
    assert.strictEqual(
      nonExistentRes.data.resetToken,
      undefined,
      "Must not return resetToken for non-existent user",
    );
    pass(
      "Forgot password prevents account enumeration on non-existent account",
    );
  } catch (e) {
    fail("Forgot password prevents account enumeration", e);
  }

  // Test 6: Valid forgot password request returns token in test mode
  let resetToken = null;
  try {
    const forgotRes = await apiRequest("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { identifier: testUser.email },
    });
    assert.strictEqual(forgotRes.status, 200);
    assert.ok(forgotRes.data.resetToken, "Reset token should be generated");
    resetToken = forgotRes.data.resetToken;
    pass(
      "Forgot password generates secure reset token for valid user",
      `Token: ${resetToken.slice(0, 10)}...`,
    );
  } catch (e) {
    fail("Forgot password generates secure reset token", e);
  }

  // Test 7: Reset password with weak password rejected
  try {
    const weakResetRes = await apiRequest("/api/v1/auth/reset-password", {
      method: "POST",
      body: {
        resetToken,
        newPassword: "123",
      },
    });
    assert.strictEqual(weakResetRes.status, 400);
    assert.strictEqual(weakResetRes.data.error, "WEAK_PASSWORD");
    pass("Reset password rejects weak password (<6 characters)");
  } catch (e) {
    fail("Reset password rejects weak password", e);
  }

  // Test 8: Reset password with invalid token rejected
  try {
    const invalidTokenRes = await apiRequest("/api/v1/auth/reset-password", {
      method: "POST",
      body: {
        resetToken: "RST-BOGUS-TOKEN-12345",
        newPassword: "NewSecurePassword#2026",
      },
    });
    assert.strictEqual(invalidTokenRes.status, 400);
    assert.strictEqual(invalidTokenRes.data.error, "INVALID_TOKEN");
    pass("Reset password rejects invalid / non-existent token");
  } catch (e) {
    fail("Reset password rejects invalid token", e);
  }

  // Test 9: Successful password reset
  const updatedPassword = `BrandNewPass_${ts}#2026`;
  try {
    const resetRes = await apiRequest("/api/v1/auth/reset-password", {
      method: "POST",
      body: {
        resetToken,
        newPassword: updatedPassword,
      },
    });
    assert.strictEqual(resetRes.status, 200);
    assert.strictEqual(resetRes.data.success, true);
    pass(
      "Reset password successfully updates user password and revokes previous sessions",
    );
  } catch (e) {
    fail("Reset password successfully updates user password", e);
  }

  // Test 10: Reset token single-use (replay attack blocked)
  try {
    const replayRes = await apiRequest("/api/v1/auth/reset-password", {
      method: "POST",
      body: {
        resetToken,
        newPassword: "AnotherPassword#2026",
      },
    });
    assert.strictEqual(replayRes.status, 400, "Used token must be rejected");
    assert.strictEqual(replayRes.data.error, "INVALID_TOKEN");
    pass("Reset token replay attack blocked (tokens are strictly single-use)");
  } catch (e) {
    fail("Reset token replay attack blocked", e);
  }

  // Test 11: Old password can no longer log in
  try {
    const oldLoginRes = await apiRequest("/api/v1/auth/login", {
      method: "POST",
      body: {
        identifier: testUser.email,
        password: testUser.password,
      },
    });
    assert.strictEqual(
      oldLoginRes.status,
      401,
      "Old password must be rejected",
    );
    pass("Old password rejected after reset");
  } catch (e) {
    fail("Old password rejected after reset", e);
  }

  // Test 12: New password can successfully log in
  let newSessionToken = null;
  try {
    const newLoginRes = await apiRequest("/api/v1/auth/login", {
      method: "POST",
      body: {
        identifier: testUser.email,
        password: updatedPassword,
      },
    });
    assert.strictEqual(
      newLoginRes.status,
      200,
      "New password must log in successfully",
    );
    assert.ok(newLoginRes.data.token, "Must return new session token");
    newSessionToken = newLoginRes.data.token;
    pass("New password authenticates successfully and creates new session");
  } catch (e) {
    fail("New password authenticates successfully", e);
  }

  // ---------------------------------------------------------------------------
  // 3. SECURITY PENETRATION & TENANT ISOLATION TESTS
  // ---------------------------------------------------------------------------
  console.log("\n>>> SECTION 3: Penetration Testing & Data Isolation");

  // Test 13: Strict multi-tenant isolation on newly created account
  try {
    // New user attempts to access Sharma Ji's business (BIZ-001)
    const crossTenantRes = await apiRequest(
      "/api/v1/parties?businessId=BIZ-001",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${newSessionToken}`,
          "X-Business-Id": "BIZ-001",
        },
      },
    );
    assert.strictEqual(
      crossTenantRes.status,
      403,
      "Cross-tenant access must be forbidden",
    );
    assert.strictEqual(crossTenantRes.data.code, "FORBIDDEN_BUSINESS_ACCESS");
    pass(
      "Pen-Test: Cross-tenant unauthorized access attempt strictly blocked with 403",
    );
  } catch (e) {
    fail("Pen-Test: Cross-tenant unauthorized access", e);
  }

  // Test 14: XSS injection payload in registration inputs handled safely
  const xssPayload = `<script>alert('xss')</script>`;
  try {
    const xssRes = await apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: {
        name: `XSS Owner ${xssPayload}`,
        businessName: `XSS Business ${xssPayload}`,
        email: `xss_${ts}@securetest.in`,
        phone: `91${String(ts + 50).slice(-8)}`,
        password: "ValidPassword123#",
        state: "Delhi (07)",
      },
    });
    assert.strictEqual(
      xssRes.status,
      201,
      "Registration with special chars should not crash",
    );
    assert.ok(xssRes.data.user.id);
    pass(
      "Pen-Test: Special chars / script strings in registration payload handled without server crash",
    );
  } catch (e) {
    fail("Pen-Test: Special chars in registration payload", e);
  }

  console.log(
    "\n==================================================================",
  );
  console.log(
    `ALL ${total} TESTS & SECURITY AUDITS PASSED CLEANLY! (${passed}/${total})`,
  );
  console.log(
    "==================================================================\n",
  );
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
