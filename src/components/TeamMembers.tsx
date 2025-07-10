
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TeamMembers: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('code, name, role, is_admin')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedUsers: User[] = data.map((dbUser: any) => ({
        code: dbUser.code,
        name: dbUser.name || `User ${dbUser.code}`,
        role: dbUser.role || 'Team Member',
        isAdmin: dbUser.is_admin || false
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error Loading Users",
        description: "Could not load team member data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-frc-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members ({users.length} members)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((member) => (
              <div
                key={member.code}
                className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-frc-blue to-frc-orange rounded-full">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {user?.isAdmin && (
                    <Badge variant="outline" className="text-xs">
                      {member.code}
                    </Badge>
                  )}
                  {member.isAdmin && (
                    <Badge className="bg-frc-orange/10 text-frc-orange border-frc-orange/20 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {member.code === '10101' && (
                    <Badge className="bg-frc-blue/10 text-frc-blue border-frc-blue/20 text-xs">
                      Permanent
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamMembers;
