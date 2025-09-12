import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, LogIn, LogOut, ArrowLeft, Shield, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { TimeSession, UserHoursSummary } from '@/types';
import { withUserContext } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

interface AdminTimeTrackingProps {
  onExit: () => void;
}

const AdminTimeTracking: React.FC<AdminTimeTrackingProps> = ({ onExit }) => {
  const { user } = useAuth();
  const { showIds } = useGlobalSettings();
  const { toast } = useToast();
  const [userHours, setUserHours] = useState<UserHoursSummary[]>([]);
  const [activeSessions, setActiveSessions] = useState<TimeSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [exitCode, setExitCode] = useState('');
  const [showExitInput, setShowExitInput] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserHours();
      fetchActiveSessions();
    }
  }, [user]);

  const fetchUserHours = async () => {
    if (!user) return;

    try {
      const { data, error } = await withUserContext(user.code, async () => {
        return supabase
          .from('user_hours_summary')
          .select('*');
      });

      if (error) {
        console.error('Error fetching user hours:', error);
        return;
      }

      setUserHours(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchActiveSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await withUserContext(user.code, async () => {
        return supabase
          .from('time_sessions')
          .select('*')
          .is('check_out_time', null)
          .order('check_in_time', { ascending: false });
      });

      if (error) {
        console.error('Error fetching active sessions:', error);
        return;
      }

      setActiveSessions(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSignIn = async (userCode: string) => {
    if (!user) return;

    // Check if user already has an active session
    const hasActiveSession = activeSessions.some(session => session.user_code === userCode);
    if (hasActiveSession) {
      toast({
        title: "Already Signed In",
        description: "This user already has an active session.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await withUserContext(user.code, async () => {
        return supabase
          .from('time_sessions')
          .insert({
            user_code: userCode,
          })
          .select()
          .single();
      });

      if (error) {
        console.error('Error signing in user:', error);
        toast({
          title: "Error",
          description: "Failed to sign in user.",
          variant: "destructive",
        });
        return;
      }

      fetchActiveSessions();
      toast({
        title: "User Signed In",
        description: "User has been successfully signed in.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (sessionId: string, userCode: string) => {
    if (!user) return;

    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    setLoading(true);
    try {
      const checkOutTime = new Date();
      const checkInTime = new Date(session.check_in_time);
      const hoursSpent = Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100;
      
      // Cap at 5 hours and flag if exceeded
      const cappedHours = Math.min(hoursSpent, 5);
      const isFlagged = hoursSpent > 5;

      const { error } = await withUserContext(user.code, async () => {
        return supabase
          .from('time_sessions')
          .update({
            check_out_time: checkOutTime.toISOString(),
            total_hours: cappedHours,
            is_flagged: isFlagged,
          })
          .eq('id', sessionId);
      });

      if (error) {
        console.error('Error signing out user:', error);
        toast({
          title: "Error",
          description: "Failed to sign out user.",
          variant: "destructive",
        });
        return;
      }

      fetchActiveSessions();
      fetchUserHours();

      toast({
        title: "User Signed Out",
        description: isFlagged 
          ? `User signed out. Session was capped at 5 hours (actual: ${hoursSpent.toFixed(2)}h).`
          : `User signed out. Total time: ${cappedHours.toFixed(2)} hours.`,
        variant: isFlagged ? "destructive" : "default",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    if (exitCode === '10101') {
      onExit();
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid permanent admin code.",
        variant: "destructive",
      });
      setExitCode('');
    }
  };

  // Create a 7x6 grid (42 total slots)
  const createGrid = () => {
    const grid = [];
    const totalSlots = 42; // 7 columns × 6 rows
    
    for (let i = 0; i < totalSlots; i++) {
      const userHour = userHours[i];
      grid.push(userHour || null);
    }
    
    return grid;
  };

  const gridData = createGrid();
  
  const getSessionDuration = (checkInTime: string) => {
    const now = new Date();
    const start = new Date(checkInTime);
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getUserName = (userCode: string) => {
    const userHour = userHours.find(u => u.code === userCode);
    return userHour?.name || `User ${userCode}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-frc-blue to-frc-orange rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Time Tracking</h1>
            <p className="text-muted-foreground">Manage team member sign-ins and sign-outs</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showExitInput ? (
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder="Enter admin code"
                value={exitCode}
                onChange={(e) => setExitCode(e.target.value)}
                className="w-40"
                onKeyPress={(e) => e.key === 'Enter' && handleExit()}
              />
              <Button variant="outline" onClick={() => setShowExitInput(false)}>
                Cancel
              </Button>
              <Button onClick={handleExit}>
                Exit
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowExitInput(true)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit Admin Mode
            </Button>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Currently signed in team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No active sessions</p>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{getUserName(session.user_code)}</h3>
                    <p className="text-sm text-muted-foreground">
                      Signed in at {new Date(session.check_in_time).toLocaleTimeString()}
                      • Duration: {getSessionDuration(session.check_in_time)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => handleSignOut(session.id, session.user_code)}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members Grid - 7x6 */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Click to sign members in/out</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {gridData.map((userHour, index) => {
              if (!userHour) {
                // Empty slot
                return (
                  <div
                    key={`empty-${index}`}
                    className="aspect-square flex items-center justify-center p-2 border-2 border-dashed border-muted-foreground/20 rounded-lg"
                  >
                    <User className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                );
              }

              const hasActiveSession = activeSessions.some(session => session.user_code === userHour.code);
              const activeSession = activeSessions.find(session => session.user_code === userHour.code);
              
              return (
                <Card 
                  key={userHour.code}
                  className={`aspect-square cursor-pointer transition-all duration-200 hover:shadow-md ${
                    hasActiveSession 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'hover:border-frc-blue'
                  }`}
                  onClick={() => {
                    if (hasActiveSession && activeSession) {
                      handleSignOut(activeSession.id, userHour.code);
                    } else {
                      handleSignIn(userHour.code);
                    }
                  }}
                >
                  <CardContent className="p-3 h-full flex flex-col justify-between">
                    <div className="flex-1 min-h-0">
                      <div className="mb-2">
                        <div className="text-xs font-medium truncate">
                          {userHour.name || 'Unknown'}
                        </div>
                        {showIds && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {userHour.code}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <Badge 
                          variant={hasActiveSession ? "default" : "outline"}
                          className={`text-xs px-1 py-0 ${
                            hasActiveSession ? 'bg-green-500' : ''
                          }`}
                        >
                          {hasActiveSession ? 'ACTIVE' : 'OFFLINE'}
                        </Badge>
                        
                        <div className="text-xs text-muted-foreground">
                          {userHour.total_hours.toFixed(1)}h total
                        </div>
                      </div>
                    </div>
                    
                    {hasActiveSession && activeSession && (
                      <div className="text-xs text-center font-medium text-green-600 dark:text-green-400 mt-2">
                        {getSessionDuration(activeSession.check_in_time)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground text-center">
            <span className="font-medium text-green-600 dark:text-green-400">
              {activeSessions.length}
            </span> of {userHours.length} members currently signed in
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTimeTracking;