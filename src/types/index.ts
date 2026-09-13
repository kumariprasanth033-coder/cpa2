// CPA — Centralized Pocket Account Types & Domain Models

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type AuthRole = 'SYSTEM_ADMIN' | 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type PaymentMode = 'TEST' | 'LIVE';

export type CPAType = 'PERSONAL' | 'GROUP';

export type JoinSecurityLevel = 'standard' | 'protected' | 'strong' | 'private';

export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export type TransactionType =
  | 'Contribution'
  | 'Deposit'
  | 'Expense'
  | 'Payment'
  | 'Transfer'
  | 'Withdrawal'
  | 'Refund'
  | 'Reversal'
  | 'Adjustment'
  | 'Fee';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'FAILED' | 'REVERSED';

export type LedgerEntryType = 'CREDIT' | 'DEBIT';

export type ExpenseSplitType = 'EQUAL' | 'PERCENTAGE' | 'CUSTOM' | 'ITEM_BASED' | 'PAID_BY';

export type ApprovalState = 'NOT_REQUIRED' | 'PENDING' | 'PARTIALLY_APPROVED' | 'APPROVED' | 'REJECTED';

export type QRConcept = 'JOIN' | 'CONTRIBUTION' | 'WALLET_PAYMENT';

export type InvitationStatus =
  | 'PENDING'
  | 'OPENED'
  | 'JOIN_REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName?: string;
  cpaNumber?: string;
  purpose?: string;
  inviterId: string;
  inviterName?: string;
  inviteeName?: string;
  inviteePhone: string;
  inviteeEmail?: string;
  inviteeUserId?: string;
  isExistingUser?: boolean;
  secureToken: string;
  status: InvitationStatus;
  joinUrl?: string;
  whatsappText?: string;
  whatsappUrl?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  phoneVerified?: boolean;
  avatarUrl?: string;
  bio?: string;
  role?: AuthRole;
  roleTag?: string;
  createdAt: string;
}

export interface PayoutDestination {
  id: string;
  userId: string;
  type: 'UPI' | 'BANK_ACCOUNT';
  accountHolderName: string;
  upiId?: string;
  accountNumber?: string;
  maskedDestination: string;
  ifscCode?: string;
  bankName?: string;
  isVerified: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  createdAt: string;
}

export interface CPAAccount {
  id: string;
  cpaNumber: string; // e.g. CPA-GRP-8F42X9 or CPA-PER-9912A3
  type: CPAType;
  name: string;
  purpose: string;
  description?: string;
  currency: string; // e.g. 'INR'
  balancePaise?: number;
  walletId: string;
  ownerId: string;
  createdAt: string;
}

export interface GroupCPA extends CPAAccount {
  type: 'GROUP';
  groupCode: string;
  secureToken: string;
  targetAmount?: number; // stored in base currency / paise
  collectedAmount: number;
  spentAmount: number;
  withdrawnAmount: number;
  pendingAmount: number;
  deadline?: string;
  joinSecurityLevel: JoinSecurityLevel;
  hasPasswordPin: boolean;
  memberCount: number;
  allowAnonymousContribution: boolean;
  publicProgress: boolean;
  approvalRulesCount: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'NEW' | 'HIGH_ACTIVITY';
  currentBalancePaise?: number;
  myRole?: UserRole;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  user: UserProfile;
  role: UserRole;
  joinedAt: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
}

export interface JoinRequest {
  id: string;
  groupId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantAvatar?: string;
  contactInfo?: string;
  reason?: string;
  timestamp: string;
  status: JoinRequestStatus;
  verificationState: string;
  reviewerId?: string;
  reviewTimestamp?: string;
}

export interface Wallet {
  id: string;
  cpaId: string;
  currency: string;
  balance: number; // in integer paise (1 INR = 100 paise)
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  transactionId: string;
  entryType: LedgerEntryType;
  amount: number; // in paise
  balanceAfter: number; // in paise
  createdAt: string;
}

export interface Transaction {
  id: string;
  cpaId: string;
  walletId: string;
  userId: string;
  userName: string;
  amount: number; // in paise (divide by 100 for display)
  currency: string;
  type: TransactionType;
  timestamp: string;
  status: TransactionStatus;
  paymentReference: string;
  description: string;
  approvalState: ApprovalState;
  category?: string;
  isAnonymous?: boolean;
}

export interface ApprovalRule {
  id: string;
  groupId: string;
  minAmount: number; // in paise
  maxAmount?: number; // in paise
  requiredApprovals: number;
  ruleName: string;
  description: string;
}

export interface ApprovalRequest {
  id: string;
  groupId: string;
  requesterId: string;
  requesterName: string;
  amount: number; // in paise
  destination: string;
  reason: string;
  requiredApprovals: number;
  approvedCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvers: Array<{
    userId: string;
    userName: string;
    decision: 'APPROVED' | 'REJECTED';
    timestamp: string;
    comment?: string;
  }>;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  assignedUserIds: string[];
}

export interface ExpenseSplit {
  id: string;
  groupId: string;
  creatorId: string;
  creatorName: string;
  title: string;
  totalAmount: number; // in paise
  splitType: ExpenseSplitType;
  items?: ExpenseItem[];
  splits: Array<{
    userId: string;
    userName: string;
    shareAmount: number;
    isPaid: boolean;
  }>;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  role: UserRole;
  text: string;
  type: 'TEXT' | 'FINANCIAL_CARD' | 'APPROVAL_CARD' | 'SYSTEM';
  timestamp: string;
  financialData?: {
    type: 'CONTRIBUTION' | 'EXPENSE' | 'WITHDRAWAL' | 'APPROVAL';
    amount?: number;
    referenceId?: string;
    status?: string;
    summary: string;
  };
  reactions?: Array<{ emoji: string; count: number; userIds: string[] }>;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type:
    | 'INVITATION'
    | 'JOIN_REQUEST'
    | 'JOIN_RESULT'
    | 'PAYMENT_RECEIVED'
    | 'APPROVAL_NEEDED'
    | 'APPROVAL_RESULT'
    | 'EXPENSE_ADDED'
    | 'AI_WARNING'
    | 'GOAL_MILESTONE';
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  cpaId: string;
  category: 'SPENDING' | 'COLLECTION' | 'ANOMALY' | 'BUDGET_RISK' | 'HEALTH';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  text: string;
  metrics?: Record<string, any>;
  timestamp: string;
  suggestedAction?: string;
}

export interface AuditLog {
  id: string;
  cpaId?: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface PersonalPocketBudget {
  totalPocketMoney: number; // in paise
  categories: Array<{
    name: string;
    allocated: number;
    spent: number;
    icon: string;
  }>;
  savingsGoal: number;
  savingsCurrent: number;
}

// Admin Platform Monitoring Types
export interface AdminPlatformMetrics {
  totalUsers: number;
  totalCpaGroups: number;
  activeGroups: number;
  totalMembers: number;
  totalTransactions: number;
  grossTransactionVolumePaise: number;
  totalCustomerMoneyHeldPaise: number;
  platformFeesPaise: number;
  netPlatformRevenuePaise: number;
  paymentGatewayFeesPaise: number;
  netRevenueAfterGatewayFeesPaise: number;
  totalContributionVolumePaise: number;
  totalExpensesPaise: number;
  pendingSystemIssues: number;
  securityAlertsCount: number;
  systemHealth: string;
  uptimeSeconds: number;
  recentPlatformActivity: PlatformActivityItem[];
  realtimeActivity: {
    activeSessions: number;
    sseConnections: number;
    transactionsLastHour: number;
  };
  charts: {
    groupsOverTime: Array<{ month: string; groups: number; targetVolume: number }>;
    userGrowth: Array<{ month: string; users: number; active: number }>;
    transactionVolume: Array<{ date: string; volumePaise: number; count: number }>;
    contributionsVsExpenses: Array<{ month: string; contributions: number; expenses: number }>;
    activeVsInactive: Array<{ name: string; value: number; color: string }>;
    securityEvents: Array<{ type: string; count: number }>;
  };
}

export interface PlatformActivityItem {
  id: string;
  type:
    | 'GROUP_CREATED'
    | 'USER_REGISTERED'
    | 'TRANSACTION_PROCESSED'
    | 'MEMBER_JOINED'
    | 'SECURITY_EVENT'
    | 'PAYMENT_VERIFIED'
    | 'WITHDRAWAL_APPROVED'
    | 'SYSTEM_ALERT';
  title: string;
  description: string;
  severity: 'INFO' | 'NOTICE' | 'WARNING' | 'CRITICAL';
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AdminGroupItem {
  id: string;
  name: string;
  cpaNumber: string;
  purpose: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'NEW' | 'HIGH_ACTIVITY';
  targetAmountPaise?: number;
  currentBalancePaise: number;
  collectedAmountPaise: number;
  recentActivity: string;
  securityStatus: 'PROTECTED' | 'PIN_ENABLED' | 'RESTRICTED' | 'STANDARD';
  hasPasswordPin: boolean;
  joinSecurityLevel: string;
}
