
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, User, Settings, Zap, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
  isAdminTimeLocked?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, currentTab, onTabChange, isAdminTimeLocked = false }) => {
  const { user, logout } = useAuth();
  const { showIds, setShowIds } = useGlobalSettings();
  const { toast } = useToast();
  const [adminCodeInput, setAdminCodeInput] = useState('');

  const handleToggleGlobalIdVisibility = () => {
    if (showIds) {
      setShowIds(false);
      setAdminCodeInput('');
    } else {
      // Check if the entered code is the permanent admin code
      if (adminCodeInput === '10101') {
        setShowIds(true);
        setAdminCodeInput('');
        toast({
          title: "Global ID Visibility Enabled",
          description: "User IDs are now visible across all pages.",
        });
      } else {
        toast({
          title: "Access Denied",
          description: "Invalid permanent admin code.",
          variant: "destructive",
        });
      }
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "See you next time!",
    });
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'progress', label: 'Progress' },
    { id: 'scouting', label: 'Scouting' },
    { id: 'time', label: 'Time Tracking' },
    { id: 'team', label: 'Team' },
    ...(user?.isAdmin ? [{ id: 'admin', label: 'Admin' }] : []),
    ...(user?.code === '10101' ? [{ id: 'admin-time', label: 'Admin Time Control' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-frc-blue to-frc-orange rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-frc-blue to-frc-orange bg-clip-text text-transparent">
                Hastings Robotics Team Portal
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {user?.code === '10101' && (
                <div className="flex items-center gap-2">
                  {!showIds && (
                    <Input
                      type="password"
                      placeholder="Admin code"
                      value={adminCodeInput}
                      onChange={(e) => setAdminCodeInput(e.target.value)}
                      className="w-32"
                    />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleGlobalIdVisibility}
                    className="flex items-center gap-2"
                  >
                    {showIds ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showIds ? 'Hide IDs' : 'Show IDs'}
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span className="font-medium">{user?.name}</span>
                {showIds && <span className="text-muted-foreground">({user?.code})</span>}
                {user?.isAdmin && (
                  <span className="bg-frc-orange text-white px-2 py-1 rounded-full text-xs font-medium">
                    Admin
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      {!isAdminTimeLocked && (
        <nav className="border-b border-border bg-card/30">
          <div className="container mx-auto px-4">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                    currentTab === tab.id
                      ? 'text-frc-blue border-frc-blue bg-frc-blue/5'
                      : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
