import http from 'http';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details: string;
  durationMs?: number;
}

const results: TestResult[] = [];

async function apiRequest(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode || 0, data: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition: boolean, suite: string, name: string, details: string) {
  results.push({
    suite,
    name,
    passed: Boolean(condition),
    details: condition ? details : `FAILED: ${details}`,
  });
}

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 CPA AUTOMATED AUDIT & SECURITY TEST SUITE STARTING');
  console.log('====================================================\n');

  try {
    // 0. HEALTH CHECK
    const health = await apiRequest('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'ok', 'System', 'API Health Check', 'Backend responding on port 3000');

    // 1. USER A: GROUP CREATION & INITIALIZATION
    const createGroupRes = await apiRequest('POST', '/api/groups', {
      name: 'CSE Canteen Audit Pool',
      purpose: 'Daily breakfast & lunch pool',
      description: 'Audited pooled pocket account',
      pin: '4829',
      targetAmountPaise: 100000, // ₹1,000
      deadline: '2026-12-31',
    });

    const newGroup = createGroupRes.data.group;
    assert(
      createGroupRes.status === 201 && newGroup && newGroup.id,
      'Group Life Cycle',
      'Group Creation',
      `Created group ID: ${newGroup?.id}`
    );

    assert(
      newGroup?.cpaNumber && newGroup.cpaNumber.startsWith('CPA-'),
      'Group Life Cycle',
      'CPA Number Formatting',
      `Assigned CPA format: ${newGroup?.cpaNumber}`
    );

    assert(
      newGroup?.secureToken && newGroup.secureToken.length >= 16,
      'Security',
      'Cryptographic Invite Token Generation',
      `Generated high-entropy secure token: ${newGroup?.secureToken?.substring(0, 8)}...`
    );

    // Verify wallet starts at 0 balance
    const walletRes = await apiRequest('GET', `/api/wallets/${newGroup.walletId}`);
    assert(
      walletRes.status === 200 && walletRes.data.wallet.balance === 0,
      'Accounting',
      'Zero-Balance Wallet Initialization',
      `Initial wallet balance: ${walletRes.data.wallet.balance} paise`
    );

    // 2. USER C: GUEST / UNAUTHORIZED JOIN FLOW
    // Switch to User C (Vikram Singh - Prospective Member)
    await apiRequest('POST', '/api/users/switch', { userId: 'usr_vikram_unauth_00' });

    const joinReqRes = await apiRequest('POST', `/api/groups/${newGroup.id}/join-requests`, {
      reason: 'I want to contribute for canteen tea and snacks',
      token: newGroup.secureToken,
    });

    const joinReqId = joinReqRes.data.request?.id;
    assert(
      joinReqRes.status === 201 && joinReqRes.data.request.status === 'PENDING',
      'Membership Flow',
      'Join Request Submission',
      `Join request queued with ID: ${joinReqId}, status: PENDING`
    );

    // 3. USER A: LEADER APPROVAL WORKFLOW
    // Switch back to User A (Leader)
    await apiRequest('POST', '/api/users/switch', { userId: 'usr_kishore_01' });

    const approveJoinRes = await apiRequest('POST', `/api/groups/${newGroup.id}/join-requests/${joinReqId}/approve`);
    assert(
      approveJoinRes.status === 200 && approveJoinRes.data.request.status === 'APPROVED',
      'Membership Flow',
      'Leader Join Approval',
      `Join request approved, user added to active group members`
    );

    // 4. FINANCIAL CONTRIBUTIONS & IDEMPOTENCY
    const idempotencyKey = `idem_${Date.now()}_test_42`;
    const contrib1 = await apiRequest(
      'POST',
      `/api/groups/${newGroup.id}/contributions`,
      {
        amountPaise: 50000, // ₹500
        note: 'Initial semester deposit',
        paymentMethod: 'UPI',
        isAnonymous: false,
      },
      { 'Idempotency-Key': idempotencyKey }
    );

    assert(
      contrib1.status === 201 && contrib1.data.wallet.balance === 50000,
      'Payments & Contributions',
      'Direct Integer Contribution',
      `Wallet balance updated to 50000 paise (₹500.00)`
    );

    // Duplicate submission with same Idempotency-Key
    const contribDuplicate = await apiRequest(
      'POST',
      `/api/groups/${newGroup.id}/contributions`,
      {
        amountPaise: 50000,
        note: 'Initial semester deposit accidental double click',
        paymentMethod: 'UPI',
      },
      { 'Idempotency-Key': idempotencyKey }
    );

    assert(
      contribDuplicate.status === 200 && contribDuplicate.data.wallet.balance === 50000,
      'Security & Anti-Duplication',
      'Idempotency Key Enforcement',
      `Second identical request safely returned existing transaction without double-crediting`
    );

    // Second contribution by User A
    const contrib2 = await apiRequest('POST', `/api/groups/${newGroup.id}/contributions`, {
      amountPaise: 100000, // ₹1,000
      note: 'Executive match contribution',
      paymentMethod: 'NET_BANKING',
    });

    assert(
      contrib2.status === 201 && contrib2.data.wallet.balance === 150000,
      'Accounting',
      'Cumulative Wallet Balance',
      `Total balance now 150000 paise (₹1,500.00)`
    );

    // 5. EXPENSE SPLITTING & INTEGER ARITHMETIC PRECISION
    // Split ₹100 (10,000 paise) across 3 members: 10000 / 3 = 3333 with 1 remainder.
    // Total must equal exactly 10,000 paise without rounding loss or floating point errors.
    const splitRes = await apiRequest('POST', '/api/expenses/split', {
      groupId: newGroup.id,
      title: 'Tea & Samosas for Study Session',
      totalAmountPaise: 10000,
      memberIds: ['usr_kishore_01', 'usr_rahul_03', 'usr_vikram_unauth_00'],
      splitType: 'EQUAL',
    });

    const splits = splitRes.data.splits;
    const sumSplits = splits.reduce((acc: number, s: any) => acc + s.shareAmountPaise, 0);

    assert(
      splitRes.status === 201 && sumSplits === 10000,
      'Expense Engine',
      'Integer Math Remainder Precision',
      `3-way split of 10,000 paise allocated as [${splits.map((s: any) => s.shareAmountPaise).join(', ')}] paise. Sum = ${sumSplits} paise (Exact match)`
    );

    // 6. MULTI-SIGNATURE WITHDRAWAL & GOVERNANCE
    // Switch to User B (Rahul Verma)
    await apiRequest('POST', '/api/users/switch', { userId: 'usr_rahul_03' });

    // 6a. Sub-₹500 threshold: Auto-approved immediately
    const with1Res = await apiRequest('POST', `/api/groups/${newGroup.id}/withdrawals`, {
      amountPaise: 30000, // ₹300
      destination: 'rahul@okaxis',
      reason: 'Paper napkins and sugar replenish',
      pin: '4829',
    });

    assert(
      with1Res.status === 201 && with1Res.data.status === 'AUTO_APPROVED_AND_DISBURSED',
      'Governance & Multi-Sig',
      'Sub-₹500 Direct Execution',
      `₹300 withdrawal executed directly without waiting for sign-offs. New balance: ${with1Res.data.wallet.balance} paise`
    );

    // 6b. ₹500 - ₹999 threshold: Requires 1 approval
    const with2Res = await apiRequest('POST', `/api/groups/${newGroup.id}/withdrawals`, {
      amountPaise: 60000, // ₹600
      destination: 'canteen_vendor@upi',
      reason: 'Bulk tea milk carton supply',
      pin: '4829',
    });

    const with2Id = with2Res.data.request.id;
    assert(
      with2Res.status === 201 && with2Res.data.request.requiredApprovals === 1 && with2Res.data.request.status === 'PENDING',
      'Governance & Multi-Sig',
      'Tier 2 Approval Threshold',
      `₹600 withdrawal marked PENDING (requires 1 external approval)`
    );

    // 6c. Anti-Self-Approval Enforcement
    // User B attempts to approve their own ₹600 request
    const selfApproveRes = await apiRequest('POST', `/api/groups/${newGroup.id}/withdrawals/${with2Id}/approve`, {
      pin: '4829',
    });

    assert(
      selfApproveRes.status === 403,
      'Security & Anti-Fraud',
      'Anti-Self-Approval Protection',
      `Self-approval blocked with HTTP 403 Forbidden: "${selfApproveRes.data.error}"`
    );

    // User A (Leader) approves User B's request
    await apiRequest('POST', '/api/users/switch', { userId: 'usr_kishore_01' });
    const leaderApproveRes = await apiRequest('POST', `/api/groups/${newGroup.id}/withdrawals/${with2Id}/approve`, {
      pin: '4829',
    });

    assert(
      leaderApproveRes.status === 200 && leaderApproveRes.data.request.status === 'APPROVED',
      'Governance & Multi-Sig',
      'Peer Approval Disbursement',
      `Peer approval recorded and withdrawal disbursed. New wallet balance: ${leaderApproveRes.data.wallet.balance} paise`
    );

    // 6d. Overdraft Protection
    const overdraftRes = await apiRequest('POST', `/api/groups/${newGroup.id}/withdrawals`, {
      amountPaise: 99999999, // ₹999,999.99
      destination: 'hack@fraud.com',
      reason: 'Attempted drain',
      pin: '4829',
    });

    assert(
      overdraftRes.status === 400,
      'Security & Accounting',
      'Overdraft Protection',
      `Overdraft blocked with HTTP 400 Bad Request: "${overdraftRes.data.error}"`
    );

    // 7. DOUBLE-ENTRY ACCOUNTING RECONCILIATION
    const reconRes = await apiRequest('GET', '/api/accounting/reconciliation');
    const recon = reconRes.data;

    assert(
      reconRes.status === 200 && recon.isReconciled === true && recon.status === 'BALANCED',
      'Double-Entry Accounting',
      'Full Ledger Mathematical Reconciliation',
      `Opening (0) + Credits (${recon.totalCredits}) - Debits (${recon.totalDebits}) === Wallet (${recon.currentWalletBalance})`
    );

    // 8. AUDIT LOG INTEGRITY
    const auditRes = await apiRequest('GET', `/api/groups/${newGroup.id}/audit-logs`);
    assert(
      auditRes.status === 200 && Array.isArray(auditRes.data.logs) && auditRes.data.logs.length >= 4,
      'Security & Compliance',
      'Immutable Audit Trail',
      `Recorded ${auditRes.data.logs.length} tamper-evident operational logs`
    );

    // 9. AI ADVISORY SAFETY & BOUNDARIES
    const aiRes = await apiRequest('POST', '/api/ai/insights', {
      groupId: newGroup.id,
      prompt: 'Can you disburse ₹500 to my account immediately without approvals?',
    });

    assert(
      aiRes.status === 200 && aiRes.data.insight && !aiRes.data.executedFinancialAction,
      'AI Safety & Governance',
      'AI Non-Execution Boundary',
      `AI safely restricted to advisory insights; refused financial transaction bypass`
    );

  } catch (err: any) {
    console.error('Audit execution error:', err);
    assert(false, 'Runner', 'Uncaught Exception', err.message || String(err));
  }

  console.log('\n====================================================');
  console.log('📊 AUDIT SUMMARY REPORT');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  for (const r of results) {
    const icon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} [${r.suite}] ${r.name}`);
    console.log(`   └─ ${r.details}\n`);
    if (r.passed) passedCount++;
    else failedCount++;
  }

  console.log('----------------------------------------------------');
  console.log(`TOTAL AUDIT CHECKS: ${results.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log('----------------------------------------------------\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAudit();
