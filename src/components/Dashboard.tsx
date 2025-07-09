
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Announcement } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Plus, Calendar, User, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [announcements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Team Meeting Tomorrow',
      content: 'Don\'t forget about our team meeting tomorrow at 6 PM in the workshop. We\'ll be discussing the upcoming competition strategy.',
      author: 'Team Captain',
      timestamp: new Date('2024-01-15T10:00:00'),
      priority: 'high'
    },
    {
      id: '2',
      title: 'New Safety Protocols',
      content: 'Please review the updated safety guidelines posted in the workshop. Safety glasses are now mandatory at all times.',
      author: 'Safety Officer',
      timestamp: new Date('2024-01-14T14:30:00'),
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Parts Order Update',
      content: 'The motor controllers we ordered have arrived and are ready for pickup from the main office.',
      author: 'Build Team Lead',
      timestamp: new Date('2024-01-13T09:15:00'),
      priority: 'low'
    }
  ]);

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-frc-blue/10 via-frc-blue/5 to-frc-orange/10 rounded-lg p-6 border border-frc-blue/20">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}! 
        </h2>
        <p className="text-muted-foreground">
          Role: {user?.role} | Code: {user?.code}
        </p>
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
                <p className="text-2xl font-bold text-frc-orange">23</p>
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
                <p className="text-2xl font-bold text-green-500">42</p>
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
              <Button size="sm" className="frc-accent-button text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getPriorityIcon(announcement.priority)}
                  <h3 className="font-semibold">{announcement.title}</h3>
                  <Badge className={getPriorityColor(announcement.priority)}>
                    {announcement.priority}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {announcement.timestamp.toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted-foreground mb-2">{announcement.content}</p>
              <p className="text-sm text-muted-foreground">
                By: {announcement.author}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
