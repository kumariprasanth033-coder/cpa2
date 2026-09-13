import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserProfile,
  GroupCPA,
  CPAAccount,
  GroupMember,
  JoinRequest,
  Wallet,
  Transaction,
  ApprovalRequest,
  ChatMessage,
  NotificationItem,
  AIInsight,
  AuditLog,
  PaymentMode,
  PersonalPocketBudget,
  PayoutDestination,
  GroupInvitation,
} from '../types';
import {
  EMPTY_USER,
  INITIAL_PERSONAL_CPA,
  INITIAL_PERSONAL_BUDGET,
} from '../data/initialData';
import { safeApiRequest } from '../lib/api';

export type MainNavTab =
  | 'login'
  | 'admin-dashboard'
  | 'landing'
  | 'dashboard'
  | 'my-cpa'
  | 'groups'
  | 'group-detail'
  | 'messages'
  | 'transactions'
  | 'split-expense'
  | 'collections'
  | 'goals'
  | 'ai-manager'
  | 'approvals'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'trust-center';

export type GroupSubTab =
  | 'overview'
  | 'wallet'
  | 'contributions'
  | 'expenses'
  | 'transactions'
  | 'members'
  | 'messages'
  | 'approvals'
  | 'ai'
  | 'qr'
  | 'audit'
  | 'settings';

export type QuickActionType =
  | 'add-money'
  | 'create-group'
  | 'contribute'
  | 'split-expense'
  | 'pay'
  | 'withdraw'
  | 'join-cpa'
  | 'scan-qr'
  | 'invite-friends';

interface AppContextType {
  // Navigation
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  activeGroupTab: GroupSubTab;
  setActiveGroupTab: (tab: GroupSubTab) => void;
  quickActionModal: QuickActionType | null;
  setQuickActionModal: (action: QuickActionType | null) => void;

  // Environment & Modes
  paymentMode: PaymentMode;
  setPaymentMode: (mode: PaymentMode) => void;

  // Real User & Auth
  currentUser: UserProfile;
  user: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  isLoggedIn: boolean;
  authToken: string | null;
  isDemoMode: boolean;
  login: (
    email: string,
    passwordPlain: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string; redirectTab?: MainNavTab }>;
  register: (
    email: string,
    passwordPlain: string,
    fullName: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;

  // Real CPA Accounts & Groups
  personalCpa: CPAAccount;
  groups: GroupCPA[];
  cpas: CPAAccount[];
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  activeGroup: GroupCPA | undefined;
  members: GroupMember[];
  joinRequests: JoinRequest[];
  wallets: Record<string, Wallet>;
  personalBudget: PersonalPocketBudget;

  // Transactions & Multi-Sig Approvals
  transactions: Transaction[];
  approvalRequests: ApprovalRequest[];
  payoutDestinations: PayoutDestination[];
  fetchPayoutDestinations: () => Promise<void>;
  addPayoutDestination: (dest: {
    type: 'UPI' | 'BANK_ACCOUNT';
    accountHolderName: string;
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  sendPhoneOtp: (
    phone?: string,
    channel?: 'sms' | 'whatsapp'
  ) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
    status?: string;
    code?: string;
    maskedPhone?: string;
    cooldownRemainingSec?: number;
    deliveryStatus?: string;
  }>;
  verifyPhoneOtp: (
    otp: string,
    phone?: string
  ) => Promise<{ success: boolean; message?: string; error?: string; phoneVerified?: boolean }>;

  // Real-Time Messaging & Notifications
  chatMessages: ChatMessage[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;

  // Real AI Insights & Audit Logs
  aiInsights: AIInsight[];
  auditLogs: AuditLog[];

  // Authoritative Operations
  formatCurrency: (paise: number, currency?: string) => string;
  createGroupCPA: (data: {
    name: string;
    purpose: string;
    description?: string;
    pin?: string;
    currency?: string;
    targetAmount?: number;
    deadline?: string;
  }) => Promise<GroupCPA | null>;
  createJoinRequest: (groupId: string, reason: string, pin?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  approveJoinRequest: (groupId: string, requestId: string) => Promise<void>;
  rejectJoinRequest: (groupId: string, requestId: string) => Promise<void>;
  createFriendInvitation: (
    groupId: string,
    friendName: string,
    mobileNumber: string,
    email?: string
  ) => Promise<{ success: boolean; invitation?: GroupInvitation; error?: string; message?: string }>;
  fetchGroupInvitations: (groupId: string) => Promise<GroupInvitation[]>;
  submitWithdrawalRequest: (
    groupId: string,
    amountPaise: number,
    destination: string,
    reason: string,
    payoutDestinationId?: string,
    idempotencyKey?: string
  ) => Promise<{ success: boolean; message: string }>;
  approveWithdrawalRequest: (requestId: string, comment?: string) => Promise<{ success: boolean; message: string }>;
  rejectWithdrawalRequest: (requestId: string, comment?: string) => Promise<{ success: boolean; message: string }>;
  recordContribution: (
    groupId: string,
    amountPaise: number,
    note?: string,
    isAnonymous?: boolean,
    paymentMethod?: string
  ) => Promise<{ success: boolean; error?: string }>;
  recordExpense: (data: {
    title: string;
    totalAmount: number;
    splitMethod: 'EQUAL' | 'PERCENTAGE' | 'EXACT';
    selectedMemberIds: string[];
    category?: string;
    receiptUrl?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  sendChatMessage: (text: string, financialData?: ChatMessage['financialData']) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');
  const [activeGroupTab, setActiveGroupTab] = useState<GroupSubTab>('overview');
  const [quickActionModal, setQuickActionModal] = useState<QuickActionType | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('LIVE');

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('cpa_auth_token') || null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('cpa_auth_token'));
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(EMPTY_USER);
  const [personalCpa, setPersonalCpa] = useState<CPAAccount>(INITIAL_PERSONAL_CPA);
  const [personalBudget, setPersonalBudget] = useState<PersonalPocketBudget>(INITIAL_PERSONAL_BUDGET);

  const [groups, setGroups] = useState<GroupCPA[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [payoutDestinations, setPayoutDestinations] = useState<PayoutDestination[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const cpas = useMemo(() => {
    const list: CPAAccount[] = [];
    if (personalCpa && personalCpa.id) {
      list.push(personalCpa);
    }
    if (groups && groups.length > 0) {
      list.push(...groups);
    }
    return list;
  }, [personalCpa, groups]);

  const activeGroup = (groups || []).find((g) => g.id === selectedGroupId) || (groups || [])[0];
  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const formatCurrency = (paise: number, currency: string = 'INR'): string => {
    const symbol = currency === 'INR' ? '₹' : '$';
    const amount = (paise / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol}${amount}`;
  };

  // Authoritative data fetcher
  const refreshUserData = useCallback(async () => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const res = await safeApiRequest<{
        success: boolean;
        user?: UserProfile;
        personalCpa?: CPAAccount;
        groups?: GroupCPA[];
      }>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        // Token expired
        localStorage.removeItem('cpa_auth_token');
        setAuthToken(null);
        setIsLoggedIn(false);
        setCurrentUser(EMPTY_USER);
        return;
      }

      if (res.ok && res.data?.success && res.data.user) {
        const data = res.data;
        setCurrentUser(data.user);
        setIsLoggedIn(true);

        if (data.personalCpa) {
          setPersonalCpa(data.personalCpa);
        }

        const userGroups: GroupCPA[] = data.groups || [];
        setGroups(userGroups);

        // Populate wallets map
        const walletMap: Record<string, Wallet> = {};
        if (data.personalCpa && data.personalCpa.walletId) {
          walletMap[data.personalCpa.walletId] = {
            id: data.personalCpa.walletId,
            cpaId: data.personalCpa.id,
            currency: data.personalCpa.currency || 'INR',
            balance: data.personalCpa.balancePaise || 0,
            updatedAt: data.personalCpa.createdAt || new Date().toISOString(),
          };
        }
        for (const g of userGroups) {
          if (g.walletId) {
            walletMap[g.walletId] = {
              id: g.walletId,
              cpaId: g.id,
              currency: g.currency || 'INR',
              balance: g.currentBalancePaise || 0,
              updatedAt: g.createdAt || new Date().toISOString(),
            };
          }
        }
        setWallets(walletMap);

        if (userGroups.length > 0) {
          setSelectedGroupId((prev) => (userGroups.some((g) => g.id === prev) ? prev : userGroups[0].id));
        } else {
          setSelectedGroupId('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  }, [authToken]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return;

    try {
      const url = selectedGroupId ? `/api/transactions?groupId=${selectedGroupId}` : '/api/transactions';
      const res = await safeApiRequest<{ success: boolean; transactions?: Transaction[] }>(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.data?.success) {
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  }, [authToken, selectedGroupId]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return;

    try {
      const res = await safeApiRequest<{ success: boolean; notifications?: NotificationItem[] }>(
        '/api/notifications',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok && res.data?.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [authToken]);

  // Fetch Payout Destinations
  const fetchPayoutDestinations = useCallback(async () => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return;
    try {
      const res = await safeApiRequest<{ success: boolean; destinations?: PayoutDestination[] }>(
        '/api/payout-destinations',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok && res.data?.success) {
        setPayoutDestinations(res.data.destinations || []);
      }
    } catch (err) {
      console.error('Failed to fetch payout destinations:', err);
    }
  }, [authToken]);

  // Fetch approvals
  const fetchApprovals = useCallback(async () => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return;

    try {
      const url = selectedGroupId ? `/api/approvals?groupId=${selectedGroupId}` : '/api/approvals';
      const res = await safeApiRequest<{ success: boolean; requests?: ApprovalRequest[] }>(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.data?.success) {
        setApprovalRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    }
  }, [authToken, selectedGroupId]);

  // Fetch chat messages
  const fetchMessages = useCallback(async () => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token || !selectedGroupId) {
      setChatMessages([]);
      return;
    }

    try {
      const res = await safeApiRequest<{ success: boolean; messages?: ChatMessage[] }>(
        `/api/messages/${selectedGroupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok && res.data?.success) {
        setChatMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [authToken, selectedGroupId]);

  // Fetch AI insights
  const fetchAiInsights = useCallback(async () => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return;

    try {
      const res = await safeApiRequest<{ success: boolean; insights?: AIInsight[] }>(
        '/api/ai/analyze',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ groupId: selectedGroupId || undefined }),
        }
      );
      if (res.ok && res.data?.success) {
        setAiInsights(res.data.insights || []);
      }
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
    }
  }, [authToken, selectedGroupId]);

  // Initial load
  useEffect(() => {
    if (authToken) {
      refreshUserData();
      fetchNotifications();
      fetchPayoutDestinations();
    }
  }, [authToken, refreshUserData, fetchNotifications, fetchPayoutDestinations]);

  // Sync group-dependent data
  useEffect(() => {
    if (isLoggedIn) {
      fetchTransactions();
      fetchApprovals();
      fetchMessages();
      fetchAiInsights();
    }
  }, [selectedGroupId, isLoggedIn, fetchTransactions, fetchApprovals, fetchMessages, fetchAiInsights]);

  // Real-time Server-Sent Events (SSE) listener
  useEffect(() => {
    if (!isLoggedIn || !authToken) return;

    const eventSource = new EventSource(`/api/events?token=${authToken}`);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event === 'TRANSACTION_COMPLETED' || parsed.event === 'WITHDRAWAL_EXECUTED') {
          refreshUserData();
          fetchTransactions();
          fetchAiInsights();
        } else if (parsed.event === 'NEW_MESSAGE') {
          setChatMessages((prev) => [...prev, parsed.payload]);
        } else if (parsed.event === 'MEMBER_JOINED' || parsed.event === 'JOIN_REQUEST_CREATED') {
          refreshUserData();
          fetchNotifications();
        } else if (parsed.event === 'APPROVAL_REQUEST_CREATED' || parsed.event === 'APPROVAL_RESOLVED') {
          fetchApprovals();
          fetchNotifications();
        }
      } catch (err) {
        // Ping or non-JSON message
      }
    };

    eventSource.onerror = () => {
      // Reconnection handled automatically by browser EventSource
    };

    return () => {
      eventSource.close();
    };
  }, [isLoggedIn, authToken, refreshUserData, fetchTransactions, fetchApprovals, fetchNotifications, fetchAiInsights]);

  // Real Auth Methods
  const register = async (
    email: string,
    passwordPlain: string,
    fullName: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeApiRequest<{
        success: boolean;
        token?: string;
        user?: UserProfile;
        error?: string;
      }>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordPlain, fullName, phone }),
      });

      if (!res.ok || !res.data?.success || !res.data?.token || !res.data?.user) {
        return {
          success: false,
          error: res.error || res.data?.error || 'Registration failed. Please try again.',
        };
      }

      const data = res.data;
      localStorage.setItem('cpa_auth_token', data.token);
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      await refreshUserData();
      setActiveTab('dashboard');
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: 'CPA authentication service is temporarily unavailable. Please try again.',
      };
    }
  };

  const login = async (
    email: string,
    passwordPlain: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string; redirectTab?: MainNavTab }> => {
    try {
      const res = await safeApiRequest<{
        success: boolean;
        token?: string;
        user?: UserProfile;
        redirectTab?: MainNavTab;
        error?: string;
      }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordPlain }),
      });

      if (!res.ok || !res.data?.success || !res.data?.token || !res.data?.user) {
        return {
          success: false,
          error: res.error || res.data?.error || 'Invalid email or password.',
        };
      }

      const data = res.data;
      if (rememberMe) {
        localStorage.setItem('cpa_auth_token', data.token);
      }
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      await refreshUserData();

      const targetTab: MainNavTab =
        data.redirectTab ||
        (data.user.role === 'SYSTEM_ADMIN' ? 'admin-dashboard' : 'dashboard');
      setActiveTab(targetTab);
      return { success: true, redirectTab: targetTab };
    } catch (err: any) {
      return {
        success: false,
        error: 'CPA authentication service is temporarily unavailable. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      if (authToken) {
        await safeApiRequest('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch (e) {
      // Clean up locally regardless
    } finally {
      localStorage.removeItem('cpa_auth_token');
      setAuthToken(null);
      setIsLoggedIn(false);
      setCurrentUser(EMPTY_USER);
      setGroups([]);
      setSelectedGroupId('');
      setTransactions([]);
      setApprovalRequests([]);
      setChatMessages([]);
      setNotifications([]);
      setActiveTab('login');
    }
  };

  // Real Group CPA creation
  const createGroupCPA = async (data: {
    name: string;
    purpose: string;
    description?: string;
    pin?: string;
    currency?: string;
    targetAmount?: number;
    deadline?: string;
  }): Promise<GroupCPA | null> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return null;

    try {
      const res = await safeApiRequest<{ success: boolean; group?: GroupCPA; error?: string }>(
        '/api/groups/create',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            purpose: data.purpose,
            description: data.description,
            currency: data.currency || 'INR',
            targetAmountPaise: data.targetAmount ? data.targetAmount * 100 : 0,
            deadline: data.deadline,
            passwordPin: data.pin,
          }),
        }
      );

      if (res.ok && res.data?.success && res.data.group) {
        await refreshUserData();
        setSelectedGroupId(res.data.group.id);
        return res.data.group;
      }
    } catch (err) {
      console.error('Failed to create group CPA:', err);
    }
    return null;
  };

  // Real Join Request
  const createJoinRequest = async (
    groupId: string,
    reason: string,
    pin?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return { success: false, error: 'Authentication required.' };

    try {
      const res = await safeApiRequest<{ success: boolean; message?: string; error?: string }>(
        `/api/groups/${groupId}/join-request`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ note: reason, pin }),
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || 'Failed to submit join request.' };
      }
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const approveJoinRequest = async (groupId: string, requestId: string) => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return;

    try {
      await safeApiRequest(`/api/groups/${groupId}/join-requests/${requestId}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision: 'APPROVE' }),
      });
      await refreshUserData();
    } catch (err) {
      console.error('Failed to approve join request:', err);
    }
  };

  const rejectJoinRequest = async (groupId: string, requestId: string) => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return;

    try {
      await safeApiRequest(`/api/groups/${groupId}/join-requests/${requestId}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision: 'REJECT' }),
      });
      await refreshUserData();
    } catch (err) {
      console.error('Failed to reject join request:', err);
    }
  };

  const createFriendInvitation = async (
    groupId: string,
    friendName: string,
    mobileNumber: string,
    email?: string
  ): Promise<{ success: boolean; invitation?: GroupInvitation; error?: string; message?: string }> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return { success: false, error: 'Authentication required.' };

    try {
      const res = await safeApiRequest<{ success: boolean; invitation?: GroupInvitation; error?: string; message?: string }>(
        `/api/groups/${groupId}/invitations`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ friendName, mobileNumber, email }),
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || 'Failed to send invitation.' };
      }
      await refreshUserData();
      return { success: true, invitation: res.data.invitation, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while inviting friend.' };
    }
  };

  const fetchGroupInvitations = async (groupId: string): Promise<GroupInvitation[]> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return [];

    try {
      const res = await safeApiRequest<{ success: boolean; invitations?: GroupInvitation[] }>(
        `/api/groups/${groupId}/invitations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok && res.data?.success && Array.isArray(res.data.invitations)) {
        return res.data.invitations;
      }
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    }
    return [];
  };

  // Real Contribution
  const recordContribution = async (
    groupId: string,
    amountPaise: number,
    note: string = '',
    isAnonymous: boolean = false,
    paymentMethod: string = 'UPI'
  ): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return { success: false, error: 'Authentication required.' };

    try {
      const res = await safeApiRequest<{ success: boolean; error?: string }>('/api/payments/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          amountPaise,
          note,
          isAnonymous,
          paymentMethod,
        }),
      });
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || 'Payment verification failed.' };
      }

      await refreshUserData();
      await fetchTransactions();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  // Real Expense recording
  const recordExpense = async (data: {
    title: string;
    totalAmount: number;
    splitMethod: 'EQUAL' | 'PERCENTAGE' | 'EXACT';
    selectedMemberIds: string[];
    category?: string;
    receiptUrl?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token || !selectedGroupId) return { success: false, error: 'Group selection required.' };

    try {
      // Calculate splits
      const memberCount = Math.max(1, data.selectedMemberIds.length);
      const splitAmount = Math.floor(data.totalAmount / memberCount);
      const splits = data.selectedMemberIds.map((userId) => ({
        userId,
        shareAmountPaise: splitAmount,
      }));

      const res = await safeApiRequest<{ success: boolean; error?: string }>('/api/expenses/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: selectedGroupId,
          title: data.title,
          totalAmountPaise: data.totalAmount,
          splitType: data.splitMethod,
          category: data.category || 'General',
          receiptUrl: data.receiptUrl,
          splits,
        }),
      });

      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || 'Failed to record expense.' };
      }

      await refreshUserData();
      await fetchTransactions();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  // Add Payout Destination
  const addPayoutDestination = async (dest: {
    type: 'UPI' | 'BANK_ACCOUNT';
    accountHolderName: string;
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return { success: false, error: 'Authentication required' };
    try {
      const res = await safeApiRequest<{ success: boolean; error?: string }>('/api/payout-destinations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dest),
      });
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || 'Failed to add payout destination' };
      }
      await fetchPayoutDestinations();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // Send Phone OTP (SMS or WhatsApp via Twilio)
  const sendPhoneOtp = async (
    phone?: string,
    channel: 'sms' | 'whatsapp' = 'sms'
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    status?: string;
    code?: string;
    maskedPhone?: string;
    cooldownRemainingSec?: number;
    deliveryStatus?: string;
  }> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return { success: false, error: 'Authentication required. Please sign in.' };
    try {
      const res = await safeApiRequest<{
        success: boolean;
        message?: string;
        error?: string;
        status?: string;
        code?: string;
        maskedPhone?: string;
        cooldownRemainingSec?: number;
        deliveryStatus?: string;
      }>(
        '/api/auth/send-otp',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone, channel }),
        }
      );
      if (!res.ok || !res.data?.success) {
        return {
          success: false,
          error: res.error || res.data?.error || 'Failed to send verification code.',
          code: res.data?.code,
          cooldownRemainingSec: res.data?.cooldownRemainingSec,
        };
      }
      return {
        success: true,
        message: res.data.message,
        status: res.data.status,
        maskedPhone: res.data.maskedPhone,
        deliveryStatus: res.data.deliveryStatus,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred while requesting OTP.' };
    }
  };

  // Verify Phone OTP
  const verifyPhoneOtp = async (
    otp: string,
    phone?: string
  ): Promise<{ success: boolean; message?: string; error?: string; phoneVerified?: boolean }> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return { success: false, error: 'Authentication required. Please sign in.' };
    try {
      const res = await safeApiRequest<{ success: boolean; message?: string; error?: string; phoneVerified?: boolean; phone?: string }>(
        '/api/auth/verify-otp',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ otp: otp.trim(), phone }),
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || 'Verification failed. Please check the code.' };
      }

      // Immediately reflect verified status in memory
      if (currentUser) {
        setCurrentUser(prev => prev ? {
          ...prev,
          phoneVerified: true,
          phone: res.data?.phone || phone || prev.phone,
        } : null);
      }

      await refreshUserData();
      return { success: true, message: res.data.message || 'Phone number verified successfully.', phoneVerified: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred during verification.' };
    }
  };

  // Real Withdrawal Request
  const submitWithdrawalRequest = async (
    groupId: string,
    amountPaise: number,
    destination: string,
    reason: string,
    payoutDestinationId?: string,
    idempotencyKey?: string
  ): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return { success: false, message: 'Authentication required.' };

    try {
      const res = await safeApiRequest<{ success: boolean; message?: string; error?: string }>(
        '/api/approvals/request-withdrawal',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId,
            amountPaise,
            destination,
            reason,
            payoutDestinationId,
            idempotencyKey: idempotencyKey || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          }),
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, message: res.error || res.data?.error || 'Withdrawal request failed.' };
      }

      await fetchApprovals();
      return { success: true, message: res.data.message || 'Withdrawal requested.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error.' };
    }
  };

  // Real Approval Signature (Anti-Self-Approval Enforced by Backend)
  const approveWithdrawalRequest = async (
    requestId: string,
    comment?: string
  ): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return { success: false, message: 'Authentication required.' };

    try {
      const res = await safeApiRequest<{ success: boolean; message?: string; error?: string }>(
        `/api/approvals/${requestId}/decide`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ decision: 'APPROVED', comment }),
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, message: res.error || res.data?.error || 'Failed to approve request.' };
      }

      await refreshUserData();
      await fetchApprovals();
      await fetchTransactions();
      return { success: true, message: res.data.message || 'Request approved successfully.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error.' };
    }
  };

  const rejectWithdrawalRequest = async (
    requestId: string,
    comment?: string
  ): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return { success: false, message: 'Authentication required.' };

    try {
      const res = await safeApiRequest<{ success: boolean; message?: string; error?: string }>(
        `/api/approvals/${requestId}/decide`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ decision: 'REJECTED', comment }),
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, message: res.error || res.data?.error || 'Failed to reject request.' };
      }

      await fetchApprovals();
      return { success: true, message: res.data.message || 'Request rejected.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error.' };
    }
  };

  // Real Chat Messaging
  const sendChatMessage = async (text: string): Promise<void> => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token || !selectedGroupId || !text.trim()) return;

    try {
      const res = await safeApiRequest<{ success: boolean; message?: ChatMessage }>(
        `/api/messages/${selectedGroupId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: text.trim() }),
        }
      );
      if (res.ok && res.data?.success && res.data.message) {
        setChatMessages((prev) => [...prev, res.data!.message!]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Notifications
  const markAllNotificationsRead = async () => {
    const token = localStorage.getItem('cpa_auth_token') || authToken;
    if (!token) return;

    try {
      await safeApiRequest('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const markAllNotificationsAsRead = markAllNotificationsRead;

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeGroupTab,
        setActiveGroupTab,
        quickActionModal,
        setQuickActionModal,
        paymentMode,
        setPaymentMode,
        currentUser,
        user: currentUser,
        setCurrentUser,
        isLoggedIn,
        authToken,
        isDemoMode: false,
        login,
        register,
        logout,
        refreshUserData,
        personalCpa,
        groups,
        cpas,
        selectedGroupId,
        setSelectedGroupId,
        activeGroup,
        members,
        joinRequests,
        wallets,
        personalBudget,
        transactions,
        approvalRequests,
        payoutDestinations,
        fetchPayoutDestinations,
        addPayoutDestination,
        sendPhoneOtp,
        verifyPhoneOtp,
        chatMessages,
        notifications,
        unreadNotificationCount,
        aiInsights,
        auditLogs,
        formatCurrency,
        createGroupCPA,
        createJoinRequest,
        approveJoinRequest,
        rejectJoinRequest,
        createFriendInvitation,
        fetchGroupInvitations,
        submitWithdrawalRequest,
        approveWithdrawalRequest,
        rejectWithdrawalRequest,
        recordContribution,
        recordExpense,
        sendChatMessage,
        markAllNotificationsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
