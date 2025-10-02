import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalSettingsProvider } from '@/contexts/GlobalSettingsContext';
import LoginForm from '@/components/LoginForm';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import Progress from '@/components/Progress';
import Scouting from '@/components/Scouting';
import TeamMembers from '@/components/TeamMembers';
import Admin from '@/components/Admin';
import TimeTracking from '@/components/TimeTracking';
import AdminTimeTracking from '@/components/AdminTimeTracking';
import Chat from '@/components/Chat';
import { requestNotificationPermission } from '@/utils/notifications';

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [showAdminTime, setShowAdminTime] = useState(false);

  // Request notification permission when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      requestNotificationPermission();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderCurrentTab = () => {
    if (showAdminTime) {
      return <AdminTimeTracking onExit={() => setShowAdminTime(false)} />;
    }

    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'progress':
        return <Progress />;
      case 'scouting':
        return <Scouting />;
      case 'time':
        return <TimeTracking />;
      case 'team':
        return <TeamMembers />;
      case 'chat':
        return <Chat />;
      case 'admin':
        return user?.isAdmin ? <Admin /> : <Dashboard />;
      case 'admin-time':
        if (user?.code === '10101') {
          setShowAdminTime(true);
          return null;
        }
        return <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <GlobalSettingsProvider>
      <Layout 
        currentTab={showAdminTime ? 'admin-time' : currentTab} 
        onTabChange={(tab) => {
          if (tab === 'admin-time') {
            setShowAdminTime(true);
          } else {
            setShowAdminTime(false);
            setCurrentTab(tab);
          }
        }}
        isAdminTimeLocked={showAdminTime}
      >
        {renderCurrentTab()}
      </Layout>
    </GlobalSettingsProvider>
  );
};

export default Index;