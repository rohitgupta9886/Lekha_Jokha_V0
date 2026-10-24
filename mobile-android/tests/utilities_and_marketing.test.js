// ==============================================================================
// Lekha Jokha Mobile & Utilities API Integration Tests
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = 'http://127.0.0.1:3000';

test('1. Utilities - Field Salesmen Listing & Creation', async () => {
  const uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const addRes = await fetch(`${API_BASE}/api/v1/salesmen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Narendra Modi',
      phone: uniquePhone,
      email: 'narendra@field.lekhajokha.in',
      territory: 'Bengaluru Central',
      role: 'Senior Sales Executive'
    })
  });
  assert.equal(addRes.status, 201);
  const addData = await addRes.json();
  assert.equal(addData.success, true);
  assert.ok(addData.salesman.id);
  assert.equal(addData.salesman.joiningStatus, 'JOINING PENDING');
  assert.ok(addData.salesman.whatsAppInviteUrl.includes('wa.me'));

  // List salesmen
  const listRes = await fetch(`${API_BASE}/api/v1/salesmen`);
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.ok(Array.isArray(listData.salesmen));
  const found = listData.salesmen.find(s => s.phone === uniquePhone);
  assert.ok(found);
  assert.equal(found.name, 'Narendra Modi');
});

test('2. Salesman Invite Validation & Mobile OTP Acceptance', async () => {
  const uniquePhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
  const addRes = await fetch(`${API_BASE}/api/v1/salesmen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Pooja Sharma',
      phone: uniquePhone,
      territory: 'Delhi NCR'
    })
  });
  const addData = await addRes.json();
  const token = addData.salesman.inviteToken;

  // Validate Token
  const valRes = await fetch(`${API_BASE}/api/v1/salesmen/invite/validate?token=${token}`);
  assert.equal(valRes.status, 200);
  const valData = await valRes.json();
  assert.equal(valData.valid, true);
  assert.equal(valData.salesman.phone, uniquePhone);

  // Accept Invite with OTP
  const acceptRes = await fetch(`${API_BASE}/api/v1/salesmen/invite/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      phone: uniquePhone,
      otp: '123456'
    })
  });
  assert.equal(acceptRes.status, 200);
  const acceptData = await acceptRes.json();
  assert.equal(acceptData.success, true);
  assert.equal(acceptData.salesman.joiningStatus, 'ACTIVE');
  assert.ok(acceptData.token);
});

test('3. Field Staff Marketing Attendance & Location Telemetry', async () => {
  const listRes = await fetch(`${API_BASE}/api/v1/salesmen`);
  const listData = await listRes.json();
  const salesmanId = listData.salesmen[0].id;

  // Punch In
  const punchInRes = await fetch(`${API_BASE}/api/v1/salesmen/${salesmanId}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'Punch In',
      lat: 12.9716,
      lng: 77.5946
    })
  });
  assert.equal(punchInRes.status, 200);
  const punchInData = await punchInRes.json();
  assert.equal(punchInData.attendanceStatus, 'Punched In');

  // Push Location GPS Breadcrumb
  const locRes = await fetch(`${API_BASE}/api/v1/salesmen/${salesmanId}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat: 12.9720,
      lng: 77.5950,
      accuracy: 5.2
    })
  });
  assert.equal(locRes.status, 200);

  // Punch Out
  const punchOutRes = await fetch(`${API_BASE}/api/v1/salesmen/${salesmanId}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'Punch Out',
      lat: 12.9725,
      lng: 77.5955
    })
  });
  assert.equal(punchOutRes.status, 200);
  const punchOutData = await punchOutRes.json();
  assert.equal(punchOutData.attendanceStatus, 'Punched Out');
});

test('4. Marketing Tasks & Leads CRUD', async () => {
  // Create Task
  const taskRes = await fetch(`${API_BASE}/api/v1/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Drop Product Samples at Rajesh Enterprises',
      customer: 'Rajesh Enterprises',
      dueTime: 'Today, 4:30 PM',
      priority: 'HIGH'
    })
  });
  assert.equal(taskRes.status, 201);
  const taskData = await taskRes.json();
  assert.equal(taskData.success, true);
  assert.ok(taskData.task.id);

  // Create Lead
  const leadRes = await fetch(`${API_BASE}/api/v1/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Pooja Departmental Stores',
      phone: '9844001122',
      address: 'Brigade Road, Bengaluru',
      requirement: 'Basmati Rice 20 Bags'
    })
  });
  assert.equal(leadRes.status, 201);
  const leadData = await leadRes.json();
  assert.equal(leadData.success, true);
  assert.ok(leadData.lead.id);
});

test('5. Utilities - Set Up My Business & Accountant Access', async () => {
  // Save Business Profile
  const profRes = await fetch(`${API_BASE}/api/v1/utilities/business-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Sharma Mega Distributors Pvt Ltd',
      gstin: '29ABCDE1234F1Z5',
      phone: '9876543210',
      address: 'MG Road, Bengaluru',
      invoicePrefix: 'SMD-2026-'
    })
  });
  assert.equal(profRes.status, 200);
  const profData = await profRes.json();
  assert.equal(profData.success, true);

  // Accountant Access Invite
  const acctRes = await fetch(`${API_BASE}/api/v1/utilities/accountant-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'CA Ankit Agrawal',
      email: 'ankit@agrawalassociates.in',
      phone: '9888776655',
      permissions: ['VIEW_LEDGERS', 'AUDIT']
    })
  });
  assert.equal(acctRes.status, 201);
  const acctData = await acctRes.json();
  assert.equal(acctData.success, true);
  assert.ok(acctData.accountantAccess.id);
});

test('6. Utilities - Import & Export Items', async () => {
  // Bulk Import Items
  const uniqueName1 = `Imported Headset ${Date.now()}`;
  const uniqueName2 = `Imported PowerBank ${Date.now()}`;
  const importRes = await fetch(`${API_BASE}/api/v1/utilities/import-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { name: uniqueName1, salePrice: 1999, purchasePrice: 1200, stock: 45, unit: 'PCS', gstRate: 18 },
        { name: uniqueName2, salePrice: 1499, purchasePrice: 950, stock: 60, unit: 'PCS', gstRate: 18 }
      ]
    })
  });
  assert.equal(importRes.status, 200);
  const importData = await importRes.json();
  assert.equal(importData.success, true);
  assert.equal(importData.importedCount, 2);

  // Export Items
  const exportRes = await fetch(`${API_BASE}/api/v1/utilities/export-items`);
  assert.equal(exportRes.status, 200);
  const csvText = await exportRes.text();
  assert.ok(csvText.includes('Item ID'));
  assert.ok(csvText.includes(uniqueName1));
});

test('7. Utilities - Tally Prime XML Import and Export', async () => {
  // Import Tally XML
  const tallyXml = `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC></IMPORTDATA></BODY></ENVELOPE>`;
  const tallyImpRes = await fetch(`${API_BASE}/api/v1/utilities/import-tally`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xmlData: tallyXml })
  });
  assert.equal(tallyImpRes.status, 200);
  const tallyImpData = await tallyImpRes.json();
  assert.equal(tallyImpData.success, true);

  // Export Tally XML
  const tallyExpRes = await fetch(`${API_BASE}/api/v1/utilities/export-tally`);
  assert.equal(tallyExpRes.status, 200);
  const xmlContent = await tallyExpRes.text();
  assert.ok(xmlContent.includes('<ENVELOPE>'));
  assert.ok(xmlContent.includes('<TALLYMESSAGE'));
});
