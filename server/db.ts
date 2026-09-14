import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Initialize production SQLite database path safely across environments
function getProductionDbPath(): string {
  if (process.env.DATABASE_FILE) {
    return process.env.DATABASE_FILE;
  }

  // Detect serverless environment (Vercel Lambda, AWS Lambda) where root fs is read-only
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );

  if (isServerless) {
    const tmpDbPath = path.join('/tmp', 'cpa_production.db');
    
    // Check candidate locations where Vercel might place cpa_production.db
    const candidateDirs = [
      process.cwd(),
      __dirname,
      path.resolve(__dirname, '..'),
      path.resolve(__dirname, '../..'),
    ];

    let foundSeedPath: string | null = null;
    for (const dir of candidateDirs) {
      const p = path.join(dir, 'cpa_production.db');
      if (fs.existsSync(p)) {
        foundSeedPath = p;
        break;
      }
    }

    if (foundSeedPath) {
      const tmpExists = fs.existsSync(tmpDbPath);
      const tmpSize = tmpExists ? fs.statSync(tmpDbPath).size : 0;
      const seedSize = fs.statSync(foundSeedPath).size;

      // Copy if /tmp does not exist or is empty
      if (!tmpExists || tmpSize === 0) {
        try {
          fs.copyFileSync(foundSeedPath, tmpDbPath);
          // Also copy WAL/SHM companion files if present
          const seedWal = `${foundSeedPath}-wal`;
          const seedShm = `${foundSeedPath}-shm`;
          if (fs.existsSync(seedWal)) fs.copyFileSync(seedWal, `${tmpDbPath}-wal`);
          if (fs.existsSync(seedShm)) fs.copyFileSync(seedShm, `${tmpDbPath}-shm`);
        } catch (err) {
          console.warn('Could not copy seed database to /tmp:', err);
        }
      }
    }
    return tmpDbPath;
  }

  return path.join(process.cwd(), 'cpa_production.db');
}

const DB_PATH = getProductionDbPath();
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for production ACID guarantees
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    role TEXT NOT NULL DEFAULT 'MEMBER',
    email_verified INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS cpas (
    id TEXT PRIMARY KEY,
    cpa_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    purpose TEXT NOT NULL,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    wallet_id TEXT UNIQUE NOT NULL,
    owner_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    cpa_id TEXT NOT NULL REFERENCES cpas(id) ON DELETE CASCADE,
    group_code TEXT UNIQUE NOT NULL,
    secure_join_token TEXT UNIQUE NOT NULL,
    target_amount_paise INTEGER DEFAULT 0,
    deadline TEXT,
    join_security_level TEXT DEFAULT 'protected',
    has_password_pin INTEGER DEFAULT 0,
    pin_hash TEXT,
    allow_anonymous INTEGER DEFAULT 1,
    public_progress INTEGER DEFAULT 1,
    status TEXT DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER',
    joined_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    UNIQUE(group_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    cpa_id TEXT NOT NULL REFERENCES cpas(id) ON DELETE CASCADE,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wallet_ledger (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL,
    entry_type TEXT NOT NULL, -- 'CREDIT' or 'DEBIT'
    amount_paise INTEGER NOT NULL,
    balance_after_paise INTEGER NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    cpa_id TEXT NOT NULL REFERENCES cpas(id),
    group_id TEXT,
    wallet_id TEXT NOT NULL REFERENCES wallets(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    user_name TEXT NOT NULL,
    amount_paise INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    payment_reference TEXT,
    description TEXT NOT NULL,
    category TEXT,
    approval_state TEXT DEFAULT 'NOT_REQUIRED',
    is_anonymous INTEGER DEFAULT 0,
    metadata TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS platform_fees (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL REFERENCES transactions(id),
    fee_amount_paise INTEGER NOT NULL,
    fee_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'FINALIZED',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contributions (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    amount_paise INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    payment_ref TEXT,
    is_anonymous INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id),
    creator_id TEXT NOT NULL REFERENCES users(id),
    creator_name TEXT NOT NULL,
    title TEXT NOT NULL,
    total_amount_paise INTEGER NOT NULL,
    split_type TEXT NOT NULL,
    category TEXT,
    receipt_url TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expense_splits (
    id TEXT PRIMARY KEY,
    expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    user_name TEXT NOT NULL,
    share_amount_paise INTEGER NOT NULL,
    is_paid INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS approval_requests (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id),
    requester_id TEXT NOT NULL REFERENCES users(id),
    requester_name TEXT NOT NULL,
    amount_paise INTEGER NOT NULL,
    destination TEXT NOT NULL,
    reason TEXT NOT NULL,
    required_approvals INTEGER NOT NULL DEFAULT 2,
    approved_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    payout_status TEXT DEFAULT 'PENDING_APPROVAL',
    payout_provider_reference TEXT,
    payout_destination_id TEXT REFERENCES payout_destinations(id),
    idempotency_key TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    approval_request_id TEXT NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    approver_id TEXT NOT NULL REFERENCES users(id),
    approver_name TEXT NOT NULL,
    decision TEXT NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(approval_request_id, approver_id)
  );

  CREATE TABLE IF NOT EXISTS join_requests (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    reviewer_id TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id),
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'TEXT',
    text TEXT NOT NULL,
    financial_data TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    cpa_id TEXT,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS personal_budgets (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_pocket_money_paise INTEGER DEFAULT 0,
    savings_goal_paise INTEGER DEFAULT 0,
    savings_current_paise INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS budget_categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    allocated_paise INTEGER NOT NULL DEFAULT 0,
    spent_paise INTEGER NOT NULL DEFAULT 0,
    icon TEXT NOT NULL DEFAULT 'Circle'
  );

  CREATE TABLE IF NOT EXISTS qr_tokens (
    token TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    group_id TEXT NOT NULL REFERENCES groups(id),
    cpa_id TEXT NOT NULL,
    amount_paise INTEGER,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS phone_verifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    verified_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payout_destinations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'UPI' or 'BANK_ACCOUNT'
    account_holder_name TEXT NOT NULL,
    upi_id TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    bank_name TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'PENDING',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    inviter_id TEXT NOT NULL REFERENCES users(id),
    invitee_name TEXT,
    invitee_phone TEXT NOT NULL,
    invitee_email TEXT,
    invitee_user_id TEXT REFERENCES users(id),
    secure_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, OPENED, JOIN_REQUESTED, ACCEPTED, REJECTED, EXPIRED, CANCELLED
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Safe incremental column additions for existing production database
try { db.exec('ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0;'); } catch (_) {}
try { db.exec('ALTER TABLE wallets ADD COLUMN balance INTEGER DEFAULT 0;'); } catch (_) {}
try { db.exec('ALTER TABLE transactions ADD COLUMN idempotency_key TEXT;'); } catch (_) {}
try { db.exec("ALTER TABLE approval_requests ADD COLUMN payout_status TEXT DEFAULT 'PENDING_APPROVAL';"); } catch (_) {}
try { db.exec('ALTER TABLE approval_requests ADD COLUMN payout_provider_reference TEXT;'); } catch (_) {}
try { db.exec('ALTER TABLE approval_requests ADD COLUMN payout_destination_id TEXT REFERENCES payout_destinations(id);'); } catch (_) {}
try { db.exec('ALTER TABLE approval_requests ADD COLUMN idempotency_key TEXT;'); } catch (_) {}
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      inviter_id TEXT NOT NULL REFERENCES users(id),
      invitee_name TEXT,
      invitee_phone TEXT NOT NULL,
      invitee_email TEXT,
      invitee_user_id TEXT REFERENCES users(id),
      secure_token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'PENDING',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_invitations (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      inviter_user_id TEXT NOT NULL REFERENCES users(id),
      invitee_user_id TEXT REFERENCES users(id),
      invitee_name TEXT,
      invitee_phone TEXT,
      invitee_email TEXT,
      secure_token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'INVITE_SENT',
      accepted_at TEXT,
      cancelled_at TEXT
    );

    CREATE TABLE IF NOT EXISTS group_join_requests (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      applicant_user_id TEXT NOT NULL REFERENCES users(id),
      invitation_id TEXT REFERENCES group_invitations(id),
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      reviewed_by TEXT REFERENCES users(id),
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      cpa_id TEXT NOT NULL REFERENCES cpas(id) ON DELETE CASCADE,
      group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
      amount_paise INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      gateway_provider TEXT NOT NULL DEFAULT 'RAZORPAY',
      gateway_order_id TEXT UNIQUE,
      gateway_payment_id TEXT UNIQUE,
      gateway_signature TEXT,
      idempotency_key TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'CREATED',
      payment_method TEXT,
      mode TEXT NOT NULL DEFAULT 'TEST',
      receipt_id TEXT UNIQUE,
      error_code TEXT,
      error_description TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_gateway_configs (
      id TEXT PRIMARY KEY DEFAULT 'default',
      provider TEXT NOT NULL DEFAULT 'RAZORPAY',
      mode TEXT NOT NULL DEFAULT 'TEST',
      test_key_id TEXT,
      test_key_secret TEXT,
      live_key_id TEXT,
      live_key_secret TEXT,
      webhook_secret TEXT,
      is_active INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS processed_webhook_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      payment_id TEXT,
      order_id TEXT,
      created_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO payment_gateway_configs (id, provider, mode, updated_at)
    VALUES ('default', 'RAZORPAY', 'TEST', datetime('now'));

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      phone_number TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'PHONE_VERIFICATION',
      channel TEXT NOT NULL DEFAULT 'SMS',
      expires_at TEXT NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      verified_at TEXT,
      created_at TEXT NOT NULL,
      provider_message_id TEXT,
      delivery_status TEXT NOT NULL DEFAULT 'REQUESTED'
    );

    CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON otp_verifications(phone_number, created_at);
    CREATE INDEX IF NOT EXISTS idx_otp_verifications_user ON otp_verifications(user_id, created_at);
  `);
} catch (err) {
  console.error('Database migration error for tables:', err);
}

try { db.exec('ALTER TABLE users ADD COLUMN phone_verified_at TEXT;'); } catch (_) {}


// Cryptographic Password Hashing Helpers (Scrypt)
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

// Compute accurate authoritative wallet balance from double-entry ledger
export function getWalletBalancePaise(walletId: string): number {
  const stmt = db.prepare(`
    SELECT COALESCE(SUM(
      CASE WHEN entry_type = 'CREDIT' THEN amount_paise ELSE -amount_paise END
    ), 0) AS balance
    FROM wallet_ledger
    WHERE wallet_id = ?
  `);
  const res = stmt.get(walletId) as { balance: number } | undefined;
  return res ? Number(res.balance) : 0;
}

// Post an ACID double-entry ledger entry
export function postLedgerEntry(params: {
  walletId: string;
  transactionId: string;
  entryType: 'CREDIT' | 'DEBIT';
  amountPaise: number;
  description?: string;
}): { ledgerId: string; newBalancePaise: number } {
  const currentBalance = getWalletBalancePaise(params.walletId);
  const newBalance = params.entryType === 'CREDIT' 
    ? currentBalance + params.amountPaise 
    : currentBalance - params.amountPaise;

  if (params.entryType === 'DEBIT' && newBalance < 0) {
    throw new Error('Insufficient wallet funds for this operation');
  }

  const ledgerId = `led_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO wallet_ledger (id, wallet_id, transaction_id, entry_type, amount_paise, balance_after_paise, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    ledgerId,
    params.walletId,
    params.transactionId,
    params.entryType,
    params.amountPaise,
    newBalance,
    params.description || '',
    now
  );

  // Keep wallets table balance synchronized with ledger
  db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?').run(
    newBalance,
    now,
    params.walletId
  );

  return { ledgerId, newBalancePaise: newBalance };
}

// Helper to log audit events
export function recordAuditLog(params: {
  cpaId?: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, cpa_id, actor_id, actor_name, action, entity_type, entity_id, metadata, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    `aud_${crypto.randomUUID()}`,
    params.cpaId || null,
    params.actorId,
    params.actorName,
    params.action,
    params.entityType,
    params.entityId,
    params.metadata ? JSON.stringify(params.metadata) : null,
    params.ipAddress || null,
    new Date().toISOString()
  );
}

// Helper to create notifications
export function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, link_url, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `);
  stmt.run(
    `notif_${crypto.randomUUID()}`,
    params.userId,
    params.type,
    params.title,
    params.message,
    params.linkUrl || null,
    new Date().toISOString()
  );
}

// Payment Gateway Configuration in Database
export interface PaymentGatewayConfigRow {
  id: string;
  provider: string;
  mode: 'TEST' | 'LIVE';
  test_key_id?: string | null;
  test_key_secret?: string | null;
  live_key_id?: string | null;
  live_key_secret?: string | null;
  webhook_secret?: string | null;
  is_active: number;
  updated_at: string;
}

export function getPaymentGatewayConfig(): PaymentGatewayConfigRow {
  let row = db.prepare('SELECT * FROM payment_gateway_configs WHERE id = ?').get('default') as unknown as PaymentGatewayConfigRow | undefined;
  if (!row) {
    db.prepare(`
      INSERT INTO payment_gateway_configs (id, provider, mode, updated_at)
      VALUES ('default', 'RAZORPAY', 'TEST', datetime('now'))
    `).run();
    row = db.prepare('SELECT * FROM payment_gateway_configs WHERE id = ?').get('default') as unknown as PaymentGatewayConfigRow;
  }
  return row;
}

export function savePaymentGatewayConfig(params: {
  mode?: 'TEST' | 'LIVE';
  testKeyId?: string;
  testKeySecret?: string;
  liveKeyId?: string;
  liveKeySecret?: string;
  webhookSecret?: string;
}) {
  const current = getPaymentGatewayConfig();
  const newMode = params.mode || current.mode;
  const newTestKeyId = params.testKeyId !== undefined ? params.testKeyId : current.test_key_id;
  const newTestKeySecret = params.testKeySecret !== undefined ? params.testKeySecret : current.test_key_secret;
  const newLiveKeyId = params.liveKeyId !== undefined ? params.liveKeyId : current.live_key_id;
  const newLiveKeySecret = params.liveKeySecret !== undefined ? params.liveKeySecret : current.live_key_secret;
  const newWebhookSecret = params.webhookSecret !== undefined ? params.webhookSecret : current.webhook_secret;

  db.prepare(`
    UPDATE payment_gateway_configs
    SET mode = ?, test_key_id = ?, test_key_secret = ?, live_key_id = ?, live_key_secret = ?, webhook_secret = ?, updated_at = ?
    WHERE id = 'default'
  `).run(
    newMode,
    newTestKeyId,
    newTestKeySecret,
    newLiveKeyId,
    newLiveKeySecret,
    newWebhookSecret,
    new Date().toISOString()
  );

  return getPaymentGatewayConfig();
}

// Payment Order Helpers
export interface PaymentOrderRow {
  id: string;
  user_id: string;
  wallet_id: string;
  cpa_id: string;
  group_id?: string | null;
  amount_paise: number;
  currency: string;
  gateway_provider: string;
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;
  gateway_signature?: string | null;
  idempotency_key: string;
  status: string;
  payment_method?: string | null;
  mode: 'TEST' | 'LIVE';
  receipt_id?: string | null;
  error_code?: string | null;
  error_description?: string | null;
  metadata?: string | null;
  created_at: string;
  updated_at: string;
}

export function createPaymentOrderRecord(params: {
  userId: string;
  walletId: string;
  cpaId: string;
  groupId?: string;
  amountPaise: number;
  currency?: string;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  idempotencyKey?: string;
  mode: 'TEST' | 'LIVE';
  receiptId?: string;
  metadata?: Record<string, any>;
}): PaymentOrderRow {
  const id = `ord_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const idempotencyKey = params.idempotencyKey || `idem_${crypto.randomBytes(16).toString('hex')}`;
  const receiptId = params.receiptId || `REC-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  db.prepare(`
    INSERT INTO payment_orders (
      id, user_id, wallet_id, cpa_id, group_id, amount_paise, currency,
      gateway_provider, gateway_order_id, idempotency_key, status, mode,
      receipt_id, metadata, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CREATED', ?, ?, ?, ?, ?)
  `).run(
    id,
    params.userId,
    params.walletId,
    params.cpaId,
    params.groupId || null,
    params.amountPaise,
    params.currency || 'INR',
    params.gatewayProvider || 'RAZORPAY',
    params.gatewayOrderId || null,
    idempotencyKey,
    params.mode,
    receiptId,
    params.metadata ? JSON.stringify(params.metadata) : null,
    now,
    now
  );

  return db.prepare('SELECT * FROM payment_orders WHERE id = ?').get(id) as unknown as PaymentOrderRow;
}

export function getPaymentOrderByGatewayOrderId(orderId: string): PaymentOrderRow | undefined {
  return db.prepare('SELECT * FROM payment_orders WHERE gateway_order_id = ?').get(orderId) as unknown as PaymentOrderRow | undefined;
}

export function getPaymentOrderById(id: string): PaymentOrderRow | undefined {
  return db.prepare('SELECT * FROM payment_orders WHERE id = ?').get(id) as unknown as PaymentOrderRow | undefined;
}

export function updatePaymentOrderStatus(params: {
  id: string;
  status: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  paymentMethod?: string;
  errorCode?: string;
  errorDescription?: string;
}) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE payment_orders
    SET status = ?,
        gateway_order_id = COALESCE(?, gateway_order_id),
        gateway_payment_id = COALESCE(?, gateway_payment_id),
        gateway_signature = COALESCE(?, gateway_signature),
        payment_method = COALESCE(?, payment_method),
        error_code = COALESCE(?, error_code),
        error_description = COALESCE(?, error_description),
        updated_at = ?
    WHERE id = ?
  `).run(
    params.status,
    params.gatewayOrderId || null,
    params.gatewayPaymentId || null,
    params.gatewaySignature || null,
    params.paymentMethod || null,
    params.errorCode || null,
    params.errorDescription || null,
    now,
    params.id
  );
  return getPaymentOrderById(params.id);
}

// ==========================================
// OTP VERIFICATIONS REPOSITORY (Sections 3, 4, 5)
// ==========================================

export interface OtpVerificationRow {
  id: string;
  user_id?: string | null;
  phone_number: string;
  otp_hash: string;
  purpose: string;
  channel: 'SMS' | 'WHATSAPP';
  expires_at: string;
  attempt_count: number;
  max_attempts: number;
  verified_at?: string | null;
  created_at: string;
  provider_message_id?: string | null;
  delivery_status: 'REQUESTED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'EXPIRED' | 'VERIFIED' | 'BLOCKED';
}

export function createOtpVerificationRecord(params: {
  userId?: string | null;
  phoneNumber: string;
  otpHash: string;
  purpose?: string;
  channel?: 'SMS' | 'WHATSAPP';
  expiresAt: string;
  providerMessageId?: string | null;
  deliveryStatus?: 'REQUESTED' | 'SENT' | 'DELIVERED' | 'FAILED';
}): OtpVerificationRow {
  const id = `otp_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const purpose = params.purpose || 'PHONE_VERIFICATION';
  const channel = params.channel || 'SMS';
  const deliveryStatus = params.deliveryStatus || 'SENT';

  db.prepare(`
    INSERT INTO otp_verifications (
      id, user_id, phone_number, otp_hash, purpose, channel,
      expires_at, attempt_count, max_attempts, created_at,
      provider_message_id, delivery_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 5, ?, ?, ?)
  `).run(
    id,
    params.userId || null,
    params.phoneNumber,
    params.otpHash,
    purpose,
    channel,
    params.expiresAt,
    now,
    params.providerMessageId || null,
    deliveryStatus
  );

  return db.prepare('SELECT * FROM otp_verifications WHERE id = ?').get(id) as unknown as OtpVerificationRow;
}

export function getActiveOtpVerification(phoneNumber: string): OtpVerificationRow | undefined {
  return db.prepare(`
    SELECT * FROM otp_verifications
    WHERE phone_number = ? AND verified_at IS NULL
    ORDER BY created_at DESC LIMIT 1
  `).get(phoneNumber) as unknown as OtpVerificationRow | undefined;
}

export function updateOtpDeliveryStatus(id: string, status: string, messageId?: string | null) {
  if (messageId) {
    db.prepare('UPDATE otp_verifications SET delivery_status = ?, provider_message_id = ? WHERE id = ?').run(status, messageId, id);
  } else {
    db.prepare('UPDATE otp_verifications SET delivery_status = ? WHERE id = ?').run(status, id);
  }
}

export function incrementOtpAttemptCount(id: string): number {
  db.prepare('UPDATE otp_verifications SET attempt_count = attempt_count + 1 WHERE id = ?').run(id);
  const row = db.prepare('SELECT attempt_count, max_attempts FROM otp_verifications WHERE id = ?').get(id) as any;
  if (row && row.attempt_count >= row.max_attempts) {
    db.prepare("UPDATE otp_verifications SET delivery_status = 'BLOCKED' WHERE id = ?").run(id);
  }
  return row?.attempt_count || 0;
}

export function markOtpAsVerified(id: string, verifiedAt: string) {
  db.prepare("UPDATE otp_verifications SET verified_at = ?, delivery_status = 'VERIFIED' WHERE id = ?").run(verifiedAt, id);
}

export function checkOtpRateLimits(phoneNumber: string): { allowed: boolean; cooldownRemainingSec?: number; error?: string } {
  // 1. Check cooldown: 60 seconds since last OTP request
  const lastReq = db.prepare(`
    SELECT created_at FROM otp_verifications
    WHERE phone_number = ?
    ORDER BY created_at DESC LIMIT 1
  `).get(phoneNumber) as any;

  if (lastReq) {
    const elapsedSec = Math.floor((Date.now() - new Date(lastReq.created_at).getTime()) / 1000);
    if (elapsedSec < 60) {
      const cooldownRemainingSec = 60 - elapsedSec;
      return {
        allowed: false,
        cooldownRemainingSec,
        error: `Please wait ${cooldownRemainingSec} seconds before requesting another OTP.`,
      };
    }
  }

  // 2. Maximum 3 OTP requests within 15 minutes (Section 6)
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const recentCountRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM otp_verifications
    WHERE phone_number = ? AND created_at > ?
  `).get(phoneNumber, fifteenMinsAgo) as any;

  if (recentCountRow && recentCountRow.cnt >= 3) {
    return {
      allowed: false,
      error: 'Too many OTP requests for this phone number. Please wait 15 minutes before trying again.',
    };
  }

  return { allowed: true };
}


