import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { QuickActionModal } from './components/layout/QuickActionModal';
import { LandingPage } from './components/landing/LandingPage';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { GroupsView } from './components/views/GroupsView';
import { PersonalCPAView } from './components/views/PersonalCPAView';
import { MessagesView } from './components/views/MessagesView';
import { SplitExpenseView } from './components/views/SplitExpenseView';
import { CollectionsView } from './components/views/CollectionsView';
import { TransactionsView } from './components/views/TransactionsView';
import { ApprovalsView } from './components/views/ApprovalsView';
import { AIManagerView } from './components/views/AIManagerView';
import { NotificationsView } from './components/views/NotificationsView';
import { ProfileView } from './components/views/ProfileView';
import { GoalsView } from './components/views/GoalsView';
import { SettingsView } from './components/views/SettingsView';
import { TrustCenter } from './components/trust/TrustCenter';
import { LoginPage } from './components/auth/LoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { JoinInviteView } from './components/views/JoinInviteView';

const MainContent: React.FC = () => {
  const { activeTab, isLoggedIn, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium tracking-wide">Loading CPA...</p>
      </div>
    );
  }

  if (window.location.pathname.startsWith('/join/')) {
    return <JoinInviteView />;
  }

  if (!isLoggedIn || activeTab === 'login') {
    return <LoginPage />;
  }

  // If activeTab is landing, render LandingPage across full width without sidebar
  if (activeTab === 'landing') {
    return <LandingPage />;
  }

  if (activeTab === 'admin-dashboard') {
    return <AdminDashboard />;
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-10">
      <ErrorBoundary>
        {activeTab === 'dashboard' && <OverviewDashboard />}
        {activeTab === 'groups' && <GroupsView />}
        {(activeTab === 'my-cpa' || activeTab === 'personal-cpa') && <PersonalCPAView />}
        {activeTab === 'messages' && <MessagesView />}
        {activeTab === 'split-expense' && <SplitExpenseView />}
        {activeTab === 'collections' && <CollectionsView />}
        {activeTab === 'goals' && <GoalsView />}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'approvals' && <ApprovalsView />}
        {activeTab === 'ai-manager' && <AIManagerView />}
        {activeTab === 'notifications' && <NotificationsView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'trust-center' && <TrustCenter />}
      </ErrorBoundary>
    </div>
  );
};

const AppShell: React.FC = () => {
  const { isLoggedIn, isAuthLoading, activeTab } = useApp();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans gap-3">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-base font-medium tracking-wide text-slate-300">Loading CPA...</p>
      </div>
    );
  }

  if (window.location.pathname.startsWith('/join/')) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        <JoinInviteView />
      </div>
    );
  }

  if (!isLoggedIn || activeTab === 'login') {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {activeTab !== 'landing' && activeTab !== 'admin-dashboard' && <Sidebar />}
        <main className="flex-1 flex flex-col overflow-hidden">
          <MainContent />
        </main>
      </div>

      <MobileNav />
      <QuickActionModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
