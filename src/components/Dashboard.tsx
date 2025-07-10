
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Announcement, CompetitionSettings } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Plus, Calendar, User, AlertTriangle, Info, CheckCircle, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [competitionSettings, setCompetitionSettings] = useState<CompetitionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [newCompetitionDate, setNewCompetitionDate] = useState('');
  const [newTeamMemberCount, setNewTeamMemberCount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load announcements using raw SQL query
      const { data: announcementsData, error: announcementsError } = await supabase
        .rpc('sql', { 
          query: 'SELECT * FROM public.announcements ORDER BY created_at DESC' 
        }) as any;

      if (announcementsError) {
        console.error('Error loading announcements:', announcementsError);
      } else if (announcementsData) {
        setAnnouncements(announcementsData);
      }

      // Load competition settings using raw SQL query
      const { data: settingsData, error: settingsError } = await supabase
        .rpc('sql', { 
          query: 'SELECT * FROM public.competition_settings LIMIT 1' 
        }) as any;

      if (settingsError) {
        console.error('Error loading competition settings:', settingsError);
      } else if (settingsData && settingsData.length > 0) {
        setCompetitionSettings(settingsData[0]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error Loading Data",
        description: "Could not load dashboard information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('sql', {
          query: `
            INSERT INTO public.announcements (title, content, author, priority)
            VALUES ('${newAnnouncement.title}', '${newAnnouncement.content}', '${user?.name || 'Admin'}', '${newAnnouncement.priority}')
            RETURNING *
          `
        }) as any;

      if (error) throw error;

      if (data && data.length > 0) {
        setAnnouncements(prev => [data[0], ...prev]);
        setNewAnnouncement({ title: '', content: '', priority: 'medium' });
        setShowAddDialog(false);
        
        toast({
          title: "Announcement Added",
          description: "New announcement has been created successfully.",
        });
      }
    } catch (error) {
      console.error('Error adding announcement:', error);
      toast({
        title: "Error",
        description: "Could not add announcement.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const { error } = await supabase
        .rpc('sql', {
          query: `DELETE FROM public.announcements WHERE id = '${id}'`
        }) as any;

      if (error) throw error;

      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast({
        title: "Announcement Deleted",
        description: "Announcement has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: "Could not delete announcement.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSettings = async () => {
    try {
      let query = '';
      if (competitionSettings) {
        // Update existing settings
        const updates = [];
        if (newCompetitionDate) updates.push(`competition_date = '${newCompetitionDate}'`);
        if (newTeamMemberCount) updates.push(`team_member_count = ${parseInt(newTeamMemberCount)}`);
        if (updates.length > 0) {
          query = `UPDATE public.competition_settings SET ${updates.join(', ')}, updated_at = NOW() WHERE id = '${competitionSettings.id}' RETURNING *`;
        }
      } else {
        // Insert new settings
        query = `INSERT INTO public.competition_settings (competition_date, team_member_count) VALUES ('${newCompetitionDate || '2024-03-15'}', ${parseInt(newTeamMemberCount) || 0}) RETURNING *`;
      }

      if (query) {
        const { data, error } = await supabase.rpc('sql', { query }) as any;

        if (error) throw error;
        if (data && data.length > 0) {
          setCompetitionSettings(data[0]);
        }
      }

      await loadData();
      setShowSettingsDialog(false);
      setNewCompetitionDate('');
      setNewTeamMemberCount('');
      
      toast({
        title: "Settings Updated",
        description: "Competition settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Could not update settings.",
        variant: "destructive",
      });
    }
  };

  const getDaysToCompetition = () => {
    if (!competitionSettings?.competition_date) return null;
    const today = new Date();
    const competitionDate = new Date(competitionSettings.competition_date);
    const diffTime = competitionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-frc-blue"></div>
      </div>
    );
  }

  const daysToCompetition = getDaysToCompetition();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-frc-blue/10 via-frc-blue/5 to-frc-orange/10 rounded-lg p-6 border border-frc-blue/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user?.name}! 
            </h2>
            <p className="text-muted-foreground">
              Role: {user?.role} | Code: {user?.code}
            </p>
          </div>
          {user?.code === '10101' && (
            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Competition Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="competitionDate">Competition Date</Label>
                    <Input
                      id="competitionDate"
                      type="date"
                      value={newCompetitionDate || competitionSettings?.competition_date || ''}
                      onChange={(e) => setNewCompetitionDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="teamMemberCount">Team Member Count</Label>
                    <Input
                      id="teamMemberCount"
                      type="number"
                      value={newTeamMemberCount || competitionSettings?.team_member_count || ''}
                      onChange={(e) => setNewTeamMemberCount(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleUpdateSettings} className="w-full">
                    Update Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-frc-blue/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Announcements</p>
                <p className="text-2xl font-bold text-frc-blue">{announcements.length}</p>
              </div>
              <Bell className="w-8 h-8 text-frc-blue" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-frc-orange/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold text-frc-orange">{competitionSettings?.team_member_count || 0}</p>
              </div>
              <User className="w-8 h-8 text-frc-orange" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Days to Competition</p>
                <p className="text-2xl font-bold text-green-500">
                  {daysToCompetition !== null ? daysToCompetition : '—'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Team Announcements
            </CardTitle>
            {user?.isAdmin && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="frc-accent-button text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Announcement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter announcement title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter announcement content"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={newAnnouncement.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewAnnouncement(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddAnnouncement} className="w-full">
                      Create Announcement
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No announcements yet.</p>
              <p className="text-sm">Admins can create announcements to keep the team informed!</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {getPriorityIcon(announcement.priority)}
                    <h3 className="font-semibold">{announcement.title}</h3>
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                    {user?.isAdmin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground mb-2">{announcement.content}</p>
                <p className="text-sm text-muted-foreground">
                  By: {announcement.author}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
