import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Edit2, Save, X, Trash2, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { TimeSession, UserHoursSummary } from '@/types';
import { withUserContext } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TimeTracking: React.FC = () => {
  const { user } = useAuth();
  const { showIds } = useGlobalSettings();
  const { toast } = useToast();
  const [userHours, setUserHours] = useState<UserHoursSummary[]>([]);
  const [userSessions, setUserSessions] = useState<TimeSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [viewingUserSessions, setViewingUserSessions] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<TimeSession | null>(null);
  const [editHours, setEditHours] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserHours();
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
        toast({
          title: "Error",
          description: "Failed to load time tracking data.",
          variant: "destructive",
        });
        return;
      }

      setUserHours(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUserSessions = async (userCode: string) => {
    if (!user) return;

    try {
      const { data, error } = await withUserContext(user.code, async () => {
        return supabase
          .from('time_sessions')
          .select('*')
          .eq('user_code', userCode)
          .not('check_out_time', 'is', null)
          .order('created_at', { ascending: false });
      });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return;
      }

      setUserSessions(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };


  const handleEditHours = async (userCode: string) => {
    if (!user?.isAdmin || !editHours) return;

    setLoading(true);
    try {
      const hours = parseFloat(editHours);
      if (isNaN(hours) || hours < 0) {
        toast({
          title: "Error",
          description: "Please enter a valid number of hours.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await withUserContext(user.code, async () => {
        return supabase
          .from('time_sessions')
          .insert({
            user_code: userCode,
            check_in_time: new Date().toISOString(),
            check_out_time: new Date().toISOString(),
            total_hours: hours,
            admin_notes: editNotes || 'Manually added by admin',
          });
      });

      if (error) {
        console.error('Error adding hours:', error);
        toast({
          title: "Error",
          description: "Failed to add hours.",
          variant: "destructive",
        });
        return;
      }

      setEditingUser(null);
      setEditHours('');
      setEditNotes('');
      fetchUserHours();

      toast({
        title: "Hours Added",
        description: `Successfully added ${hours} hours for the user.`,
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

  const handleEditSessionHours = async () => {
    if (!user?.isAdmin || !editingSession) return;

    const hours = parseFloat(editHours);
    if (isNaN(hours) || hours < 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of hours.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await withUserContext(user.code, async () => {
        return supabase
          .from('time_sessions')
          .update({
            total_hours: hours,
            admin_notes: editNotes || `Hours adjusted by admin from ${editingSession.total_hours}h to ${hours}h`,
          })
          .eq('id', editingSession.id);
      });

      if (error) {
        console.error('Error updating hours:', error);
        toast({
          title: "Error",
          description: "Failed to update hours.",
          variant: "destructive",
        });
        return;
      }

      if (viewingUserSessions) {
        fetchUserSessions(viewingUserSessions);
      }
      fetchUserHours();
      setEditingSession(null);
      setEditHours('');
      setEditNotes('');

      toast({
        title: "Hours Updated",
        description: `Session hours adjusted to ${hours} hours.`,
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

  const handleDeleteSession = async (sessionId: string) => {
    if (!user?.isAdmin) return;

    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await withUserContext(user.code, async () => {
        return supabase
          .from('time_sessions')
          .delete()
          .eq('id', sessionId);
      });

      if (error) {
        console.error('Error deleting session:', error);
        toast({
          title: "Error",
          description: "Failed to delete session.",
          variant: "destructive",
        });
        return;
      }

      if (viewingUserSessions) {
        fetchUserSessions(viewingUserSessions);
      }
      fetchUserHours();

      toast({
        title: "Session Deleted",
        description: "Time session has been removed.",
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


  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p>Please log in to access time tracking.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Time Tracking</h1>
        <p className="text-muted-foreground">View team hours and manage time tracking</p>
      </div>

      {/* Hours Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Team Hours Summary</CardTitle>
          <CardDescription>Total hours spent by all team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userHours.map((userHour) => (
              <div key={userHour.code} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{userHour.name || `User ${showIds ? userHour.code : '****'}`}</h3>
                    <Badge variant="outline">{userHour.role}</Badge>
                    {showIds && (
                      <Badge variant="secondary">ID: {userHour.code}</Badge>
                    )}
                    {userHour.flagged_sessions > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {userHour.flagged_sessions} flagged
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {userHour.total_hours.toFixed(2)} hours total
                    {userHour.last_activity && (
                      <span> • Last activity: {new Date(userHour.last_activity).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
                
                {user.isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewingUserSessions(userHour.code);
                        fetchUserSessions(userHour.code);
                      }}
                      className="flex items-center gap-2"
                    >
                      <History className="h-3 w-3" />
                      View Sessions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUser(userHour.code);
                        setEditHours('');
                        setEditNotes('');
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit2 className="h-3 w-3" />
                      Add Hours
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Hours Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Hours</DialogTitle>
            <DialogDescription>
              Manually add hours for {userHours.find(u => u.code === editingUser)?.name || 'this user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Hours</Label>
              <Input
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
                placeholder="Enter hours (e.g., 2.5)"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Admin Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes about this manual entry..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setEditingUser(null)}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={() => editingUser && handleEditHours(editingUser)}
                disabled={loading || !editHours}
              >
                <Save className="h-4 w-4 mr-2" />
                Add Hours
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View User Sessions Dialog */}
      <Dialog open={!!viewingUserSessions} onOpenChange={() => setViewingUserSessions(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session History</DialogTitle>
            <DialogDescription>
              All sessions for {userHours.find(u => u.code === viewingUserSessions)?.name || 'this user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {userSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No sessions found</p>
            ) : (
              userSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {session.is_flagged && (
                        <Badge variant="destructive" className="text-xs">Flagged</Badge>
                      )}
                    </div>
                    <div className="text-sm">
                      <div className="text-foreground">
                        {format(new Date(session.check_in_time), 'MMM d, yyyy h:mm a')} →{' '}
                        {session.check_out_time && format(new Date(session.check_out_time), 'h:mm a')}
                      </div>
                      <div className="font-medium text-foreground mt-1">
                        Hours: {session.total_hours?.toFixed(2) || '0.00'}h
                      </div>
                      {session.admin_notes && (
                        <div className="text-xs text-muted-foreground italic mt-1">
                          Note: {session.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>
                  {user.isAdmin && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSession(session);
                          setEditHours(session.total_hours?.toString() || '0');
                          setEditNotes('');
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Session Hours Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session Hours</DialogTitle>
            <DialogDescription>
              Adjust hours for this session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Hours</Label>
              <Input value={editingSession?.total_hours?.toFixed(2) || '0.00'} disabled />
            </div>
            <div>
              <Label htmlFor="newHours">New Hours</Label>
              <Input
                id="newHours"
                type="number"
                step="0.01"
                min="0"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
                placeholder="Enter new hours"
              />
            </div>
            <div>
              <Label htmlFor="editNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Reason for adjustment..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setEditingSession(null)}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleEditSessionHours} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Update Hours
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeTracking;