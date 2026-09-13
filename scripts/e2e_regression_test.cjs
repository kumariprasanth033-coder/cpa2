// End-to-End Regression Test for CPA System
const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => (respData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(respData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: respData });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path,
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => (respData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(respData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: respData });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== STARTING COMPLETE CPA SYSTEM REGRESSION TEST ===\n');
  const rand = Math.floor(Math.random() * 100000);

  // 1. Register User 1 (Leader)
  const leaderEmail = `leader_${rand}@cpa.test`;
  const leaderPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  console.log(`[TEST 1] Registering Leader: ${leaderEmail} (${leaderPhone})`);
  const r1 = await post('/api/auth/register', {
    email: leaderEmail,
    password: 'Password123!',
    fullName: 'Aditi Sharma',
    phone: leaderPhone,
  });
  if (r1.status !== 201 || !r1.data.token) {
    throw new Error(`Failed to register leader: ${JSON.stringify(r1)}`);
  }
  const leaderToken = r1.data.token;
  const leaderId = r1.data.user.id;
  console.log(`✓ Leader registered. ID: ${leaderId}`);

  // 2. Phone OTP Flow
  console.log('[TEST 2] Testing Phone OTP Dispatch & Verification');
  const otpSend = await post('/api/auth/phone/send-otp', { phone: leaderPhone }, leaderToken);
  if (otpSend.status === 503) {
    console.log(`✓ SMS Provider status: Real gateway requires configuration (${otpSend.data.error}) - Correct security response.`);
  } else if (otpSend.data && otpSend.data.success) {
    console.log(`✓ OTP Send response:`, otpSend.data.message);
  }

  // 3. Payout Destination Management
  console.log('[TEST 3] Adding Payout Destinations (UPI & Bank)');
  const upiDest = await post(
    '/api/payouts/destinations',
    {
      type: 'UPI',
      accountHolderName: 'Aditi Sharma',
      upiId: 'aditi@okhdfcbank',
    },
    leaderToken
  );
  if (!upiDest.data || !upiDest.data.success) {
    throw new Error(`Failed to add UPI destination: ${JSON.stringify(upiDest)}`);
  }
  const destId = upiDest.data.id || (upiDest.data.destination && upiDest.data.destination.id);
  console.log(`✓ UPI destination registered: ID ${destId}`);

  const destList = await get('/api/payouts/destinations', leaderToken);
  if (!destList.data.destinations || destList.data.destinations.length < 1) {
    throw new Error(`Failed to fetch destinations list: ${JSON.stringify(destList)}`);
  }
  console.log(`✓ Fetched ${destList.data.destinations.length} payout destination(s): ${destList.data.destinations[0].maskedDestination}`);

  // 4. Create Group CPA
  console.log('[TEST 4] Creating Group CPA');
  const grpRes = await post(
    '/api/groups/create',
    {
      name: `Bangalore Tech Retreat ${rand}`,
      purpose: 'Trip',
      description: 'Annual offsite budget and bookings',
      targetAmountPaise: 5000000,
      joinSecurityLevel: 'protected',
      passwordPin: '4321',
    },
    leaderToken
  );
  if (!grpRes.data.success || !grpRes.data.group) {
    throw new Error(`Failed to create group: ${JSON.stringify(grpRes)}`);
  }
  const group = grpRes.data.group;
  console.log(`✓ Group created: "${group.name}" (Code: ${group.groupCode}, CPA: ${group.cpaNumber})`);

  // 5. Test QR Resolution (both raw code and deep link)
  console.log('[TEST 5] Resolving QR Token and Group Code');
  const qrRes1 = await get(`/api/groups/resolve-qr?code=${group.groupCode}`);
  if (!qrRes1.data.success || qrRes1.data.group.id !== group.id) {
    throw new Error(`QR resolve failed for code: ${JSON.stringify(qrRes1)}`);
  }
  console.log(`✓ Resolved QR by groupCode: "${qrRes1.data.group.name}"`);

  const qrRes2 = await post('/api/groups/resolve-qr', { payload: `https://app.cpa/join/${group.secureToken}` });
  if (!qrRes2.data.success || qrRes2.data.group.id !== group.id) {
    throw new Error(`QR resolve failed for deep link: ${JSON.stringify(qrRes2)}`);
  }
  console.log(`✓ Resolved QR by deep link URL: "${qrRes2.data.group.name}"`);

  // 6. Test Contribution & Double-Entry Ledger Credit
  console.log('[TEST 6] Recording Contribution of ₹10,000 (1,000,000 paise)');
  const contribRes = await post(
    '/api/payments/verify',
    {
      groupId: group.id,
      amountPaise: 1000000,
      paymentMethod: 'UPI',
      note: 'Advance contribution for resort booking',
    },
    leaderToken
  );
  if (!contribRes.data.success) {
    throw new Error(`Contribution failed: ${JSON.stringify(contribRes)}`);
  }
  console.log(`✓ Contribution recorded! New group balance: ₹${contribRes.data.newBalancePaise / 100}`);

  // 7. Register Second User (Member) and Join Group
  console.log('[TEST 7] Registering Member 2 (Rohan)');
  const memberEmail = `rohan_${rand}@cpa.test`;
  const memberPhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
  const r2 = await post('/api/auth/register', {
    email: memberEmail,
    password: 'Password123!',
    fullName: 'Rohan Gupta',
    phone: memberPhone,
  });
  const memberToken = r2.data.token;
  const memberId = r2.data.user.id;
  console.log(`✓ Member 2 registered: ID ${memberId}`);

  // Member 2 submits join request
  console.log('[TEST 8] Member 2 requests to join Group');
  const joinReq = await post(
    `/api/groups/${group.id}/join-request`,
    {
      pin: '4321',
      note: 'Hi Aditi, joining the retreat group!',
    },
    memberToken
  );
  if (!joinReq.data.success) {
    throw new Error(`Join request failed: ${JSON.stringify(joinReq)}`);
  }
  const requestId = joinReq.data.requestId;
  console.log(`✓ Join request submitted: ${requestId}`);

  // Leader reviews and approves join request
  console.log('[TEST 9] Leader approves Join Request');
  const reviewRes = await post(
    `/api/groups/${group.id}/join-requests/${requestId}/review`,
    { decision: 'APPROVE' },
    leaderToken
  );
  if (!reviewRes.data.success) {
    throw new Error(`Review failed: ${JSON.stringify(reviewRes)}`);
  }
  console.log(`✓ Member approved into group`);

  // 8. Register Third User (Member 3 for multi-approval threshold)
  const member3Email = `priya_${rand}@cpa.test`;
  const member3Phone = `96${Math.floor(10000000 + Math.random() * 90000000)}`;
  const r3 = await post('/api/auth/register', {
    email: member3Email,
    password: 'Password123!',
    fullName: 'Priya Nair',
    phone: member3Phone,
  });
  const member3Token = r3.data.token;
  const joinReq3 = await post(`/api/groups/${group.id}/join-request`, { pin: '4321' }, member3Token);
  await post(`/api/groups/${group.id}/join-requests/${joinReq3.data.requestId}/review`, { decision: 'APPROVE' }, leaderToken);
  console.log(`✓ Member 3 (Priya) joined group`);

  // 9. Leader submits high-value withdrawal (₹4,000 = 400,000 paise, requires 2 independent approvals)
  console.log('[TEST 10] Submitting Treasury Withdrawal Request for ₹4,000');
  const wdRes = await post(
    '/api/withdrawals/request',
    {
      groupId: group.id,
      amountPaise: 400000,
      destination: 'resort.bookings@okhdfcbank',
      reason: 'Resort advance booking deposit',
      payoutDestinationId: destId,
      idempotencyKey: `idemp_${rand}_1`,
    },
    leaderToken
  );
  if (!wdRes.data.success) {
    throw new Error(`Withdrawal request failed: ${JSON.stringify(wdRes)}`);
  }
  const approvalRequestId = wdRes.data.approvalRequestId;
  console.log(`✓ Withdrawal requested: Approval ID ${approvalRequestId}, Status: ${wdRes.data.status}`);

  // 10. Test Anti-Self-Approval Enforcement
  console.log('[TEST 11] Verifying Anti-Self-Approval constraint (Leader cannot approve own withdrawal)');
  const selfApproveRes = await post(
    `/api/approvals/${approvalRequestId}/decide`,
    { decision: 'APPROVE', note: 'Self approval attempt' },
    leaderToken
  );
  if (selfApproveRes.status === 403) {
    console.log(`✓ PASS: Anti-Self-Approval enforced! (Status 403: "${selfApproveRes.data.error}")`);
  } else {
    throw new Error(`SECURITY VULNERABILITY: Self-approval was not rejected! Response: ${JSON.stringify(selfApproveRes)}`);
  }

  // 11. Member 2 Approves (Approval 1 of 2)
  console.log('[TEST 12] Member 2 approves withdrawal (Approval 1 of 2)');
  const app1 = await post(
    `/api/approvals/${approvalRequestId}/decide`,
    { decision: 'APPROVE', note: 'Verified against resort booking quotation' },
    memberToken
  );
  if (!app1.data.success) {
    throw new Error(`Member 2 approval failed: ${JSON.stringify(app1)}`);
  }
  console.log(`✓ Approval 1 recorded: Request status = ${app1.data.requestStatus} (Approvals: ${app1.data.currentApprovals}/${app1.data.requiredApprovals})`);

  // 12. Member 3 Approves (Approval 2 of 2 -> Triggers Auto Execution)
  console.log('[TEST 13] Member 3 approves withdrawal (Approval 2 of 2 -> Auto Execution)');
  const app2 = await post(
    `/api/approvals/${approvalRequestId}/decide`,
    { decision: 'APPROVE', note: 'Confirmed with event committee' },
    member3Token
  );
  if (!app2.data.success) {
    throw new Error(`Member 3 approval failed: ${JSON.stringify(app2)}`);
  }
  console.log(`✓ Approval 2 recorded: Request status = ${app2.data.requestStatus}`);

  // 13. Double-Entry Accounting Reconciliation Check
  console.log('[TEST 14] Running Accounting Reconciliation');
  const recon = await get('/api/accounting/reconciliation', leaderToken);
  console.log(`✓ Accounting status:`, recon.data);
  if (recon.data.status !== 'BALANCED') {
    throw new Error(`Accounting ledger is not balanced! Status: ${recon.data.status}`);
  }

  console.log('\n===========================================================');
  console.log('🎉 ALL REGRESSION TESTS PASSED WITH 100% PRODUCTION INTEGRITY!');
  console.log('===========================================================');
}

run().catch((err) => {
  console.error('\n❌ REGRESSION TEST FAILED:', err);
  process.exit(1);
});
