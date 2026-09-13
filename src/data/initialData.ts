import {
  UserProfile,
  GroupCPA,
  CPAAccount,
  GroupMember,
  JoinRequest,
  Wallet,
  LedgerEntry,
  Transaction,
  ApprovalRequest,
  ExpenseSplit,
  ChatMessage,
  NotificationItem,
  AIInsight,
  AuditLog,
  PersonalPocketBudget,
  AdminPlatformMetrics,
  AdminGroupItem,
} from '../types';

// Zeroed Production Defaults for Empty States
export const EMPTY_USER: UserProfile = {
  id: '',
  email: '',
  fullName: '',
  role: 'MEMBER',
  createdAt: new Date().toISOString(),
};

export const INITIAL_USER: UserProfile = EMPTY_USER;

export const INITIAL_PERSONAL_CPA: CPAAccount = {
  id: '',
  cpaNumber: '',
  type: 'PERSONAL',
  name: 'My Personal Pocket',
  purpose: 'Personal Spending & Pocket Money',
  currency: 'INR',
  walletId: '',
  ownerId: '',
  createdAt: new Date().toISOString(),
};

export const INITIAL_PERSONAL_BUDGET: PersonalPocketBudget = {
  totalPocketMoney: 0,
  categories: [
    { name: 'Food & Canteen', allocated: 0, spent: 0, icon: 'Utensils' },
    { name: 'Travel & Metro', allocated: 0, spent: 0, icon: 'Train' },
    { name: 'Entertainment', allocated: 0, spent: 0, icon: 'Film' },
    { name: 'Shopping & Books', allocated: 0, spent: 0, icon: 'ShoppingBag' },
    { name: 'Savings & Emergency', allocated: 0, spent: 0, icon: 'PiggyBank' },
  ],
  savingsGoal: 0,
  savingsCurrent: 0,
};

export const DEMO_GROUP_CPA: GroupCPA = {
  id: '',
  cpaNumber: '',
  type: 'GROUP',
  name: '',
  purpose: '',
  currency: 'INR',
  walletId: '',
  ownerId: '',
  groupCode: '',
  secureToken: '',
  targetAmount: 0,
  collectedAmount: 0,
  spentAmount: 0,
  withdrawnAmount: 0,
  pendingAmount: 0,
  joinSecurityLevel: 'protected',
  hasPasswordPin: false,
  memberCount: 0,
  allowAnonymousContribution: true,
  publicProgress: true,
  approvalRulesCount: 0,
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
};

export const INITIAL_MEMBERS: GroupMember[] = [];
export const INITIAL_JOIN_REQUESTS: JoinRequest[] = [];
export const INITIAL_WALLETS: Record<string, Wallet> = {};
export const INITIAL_LEDGER: LedgerEntry[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_APPROVALS: ApprovalRequest[] = [];
export const INITIAL_EXPENSE_SPLITS: ExpenseSplit[] = [];
export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_AI_INSIGHTS: AIInsight[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const ALL_PLATFORM_GROUPS: AdminGroupItem[] = [];

export const INITIAL_ADMIN_METRICS: AdminPlatformMetrics = {
  totalUsers: 0,
  totalCpaGroups: 0,
  activeGroups: 0,
  totalMembers: 0,
  totalTransactions: 0,
  grossTransactionVolumePaise: 0,
  totalCustomerMoneyHeldPaise: 0,
  platformFeesPaise: 0,
  netPlatformRevenuePaise: 0,
  paymentGatewayFeesPaise: 0,
  netRevenueAfterGatewayFeesPaise: 0,
  totalContributionVolumePaise: 0,
  totalExpensesPaise: 0,
  pendingSystemIssues: 0,
  securityAlertsCount: 0,
  systemHealth: '100%',
  uptimeSeconds: 0,
  recentPlatformActivity: [],
  realtimeActivity: {
    activeSessions: 0,
    sseConnections: 0,
    transactionsLastHour: 0,
  },
  charts: {
    groupsOverTime: [],
    userGrowth: [],
    transactionVolume: [],
    contributionsVsExpenses: [],
    activeVsInactive: [],
    securityEvents: [],
  },
};
