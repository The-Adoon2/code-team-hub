
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import Progress from '@/components/Progress';
import Scouting from '@/components/Scouting';
import Admin from '@/components/Admin';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'progress':
        return <Progress />;
      case 'scouting':
        return <Scouting />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderCurrentTab()}
    </Layout>
  );
};

export default Index;
