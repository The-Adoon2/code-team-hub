import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Edit2, Save, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TimeSession, UserHoursSummary } from '@/types';
import { withUserContext } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TimeTracking: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userHours, setUserHours] = useState<UserHoursSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editHours, setEditHours] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showIds, setShowIds] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');

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

  const handleToggleIdVisibility = () => {
    if (showIds) {
      setShowIds(false);
      setAdminCodeInput('');
    } else {
      // Check if the entered code is the permanent admin code
      if (adminCodeInput === '10101') {
        setShowIds(true);
        setAdminCodeInput('');
        toast({
          title: "ID Visibility Enabled",
          description: "User IDs are now visible.",
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Time Tracking</h1>
          <p className="text-muted-foreground">View team hours and manage time tracking</p>
        </div>
        
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
              onClick={handleToggleIdVisibility}
              className="flex items-center gap-2"
            >
              {showIds ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showIds ? 'Hide IDs' : 'Show IDs'}
            </Button>
          </div>
        )}
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
              <label className="text-sm font-medium">Hours</label>
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
              <label className="text-sm font-medium">Admin Notes</label>
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
    </div>
  );
};

export default TimeTracking;