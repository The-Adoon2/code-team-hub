import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, LogIn, LogOut, ArrowLeft, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TimeSession, UserHoursSummary } from '@/types';
import { withUserContext } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

interface AdminTimeTrackingProps {
  onExit: () => void;
}

const AdminTimeTracking: React.FC<AdminTimeTrackingProps> = ({ onExit }) => {
  const { user } = useAuth();
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

      {/* Team Members - Sign In */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Click to sign in team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {userHours.map((userHour) => {
              const hasActiveSession = activeSessions.some(session => session.user_code === userHour.code);
              return (
                <div key={userHour.code} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{userHour.name || `User ${userHour.code}`}</h3>
                      <Badge variant="outline">{userHour.role}</Badge>
                      <Badge variant="secondary">ID: {userHour.code}</Badge>
                      {hasActiveSession && (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total hours: {userHour.total_hours.toFixed(2)}
                      {userHour.last_activity && (
                        <span> • Last activity: {new Date(userHour.last_activity).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => handleSignIn(userHour.code)}
                    disabled={loading || hasActiveSession}
                    className="flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    {hasActiveSession ? 'Already Signed In' : 'Sign In'}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTimeTracking;