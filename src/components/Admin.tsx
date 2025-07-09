
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Settings, Users, Shield, UserCheck, UserX, Edit3, Save, X } from 'lucide-react';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isPermanentAdmin = user?.code === '10101';
  
  const [users, setUsers] = useState<User[]>([
    { code: '10101', name: 'Permanent Admin', role: 'Team Captain', isAdmin: true },
    { code: '12345', name: 'John Smith', role: 'Programmer', isAdmin: false },
    { code: '54321', name: 'Sarah Johnson', role: 'Designer', isAdmin: false },
    { code: '11111', name: 'Mike Wilson', role: 'Build Lead', isAdmin: true },
    { code: '22222', name: 'Emily Davis', role: 'Safety Officer', isAdmin: false },
  ]);

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', role: '' });
  const [newUserCode, setNewUserCode] = useState('');

  const handleEditUser = (userCode: string) => {
    const userToEdit = users.find(u => u.code === userCode);
    if (userToEdit) {
      setEditingUser(userCode);
      setEditForm({ name: userToEdit.name, role: userToEdit.role });
    }
  };

  const handleSaveEdit = (userCode: string) => {
    setUsers(prev => prev.map(u => 
      u.code === userCode 
        ? { ...u, name: editForm.name, role: editForm.role }
        : u
    ));
    setEditingUser(null);
    toast({
      title: "User Updated",
      description: `User ${userCode} has been updated successfully.`,
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', role: '' });
  };

  const toggleAdminStatus = (userCode: string) => {
    if (userCode === '10101') {
      toast({
        title: "Action Not Allowed",
        description: "Cannot modify permanent admin status.",
        variant: "destructive",
      });
      return;
    }

    if (!isPermanentAdmin) {
      toast({
        title: "Access Denied",
        description: "Only the permanent admin can modify admin privileges.",
        variant: "destructive",
      });
      return;
    }

    setUsers(prev => prev.map(u => 
      u.code === userCode ? { ...u, isAdmin: !u.isAdmin } : u
    ));

    const targetUser = users.find(u => u.code === userCode);
    toast({
      title: targetUser?.isAdmin ? "Admin Rights Removed" : "Admin Rights Granted",
      description: `User ${userCode} admin status has been updated.`,
    });
  };

  const handleAddUser = () => {
    if (newUserCode.length !== 5 || !/^\d{5}$/.test(newUserCode)) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 5-digit code.",
        variant: "destructive",
      });
      return;
    }

    if (users.some(u => u.code === newUserCode)) {
      toast({
        title: "User Exists",
        description: "A user with this code already exists.",
        variant: "destructive",
      });
      return;
    }

    const newUser: User = {
      code: newUserCode,
      name: `User ${newUserCode}`,
      role: 'Team Member',
      isAdmin: false
    };

    setUsers(prev => [...prev, newUser]);
    setNewUserCode('');
    toast({
      title: "User Added",
      description: `User ${newUserCode} has been added to the system.`,
    });
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Status */}
      <Card className="border-frc-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Logged in as: {user.name}</p>
              <p className="text-sm text-muted-foreground">Code: {user.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-frc-orange/10 text-frc-orange border-frc-orange/20">
                Admin
              </Badge>
              {isPermanentAdmin && (
                <Badge className="bg-frc-blue/10 text-frc-blue border-frc-blue/20">
                  Permanent Admin
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Add New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="newUserCode">5-Digit User Code</Label>
              <Input
                id="newUserCode"
                value={newUserCode}
                onChange={(e) => setNewUserCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="Enter 5-digit code"
                className="font-mono"
                maxLength={5}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddUser}
                disabled={newUserCode.length !== 5}
                className="frc-accent-button text-white"
              >
                Add User
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((userItem) => (
              <div
                key={userItem.code}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  {editingUser === userItem.code ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`name-${userItem.code}`}>Name</Label>
                        <Input
                          id={`name-${userItem.code}`}
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`role-${userItem.code}`}>Role</Label>
                        <Input
                          id={`role-${userItem.code}`}
                          value={editForm.role}
                          onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{userItem.name}</h3>
                        <Badge variant="outline">{userItem.code}</Badge>
                        {userItem.isAdmin && (
                          <Badge className="bg-frc-orange/10 text-frc-orange border-frc-orange/20">
                            Admin
                          </Badge>
                        )}
                        {userItem.code === '10101' && (
                          <Badge className="bg-frc-blue/10 text-frc-blue border-frc-blue/20">
                            Permanent
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{userItem.role}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingUser === userItem.code ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(userItem.code)}
                        className="frc-button text-white"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(userItem.code)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      {isPermanentAdmin && userItem.code !== '10101' && (
                        <Button
                          size="sm"
                          variant={userItem.isAdmin ? "destructive" : "default"}
                          onClick={() => toggleAdminStatus(userItem.code)}
                          className={userItem.isAdmin ? "" : "frc-accent-button text-white"}
                        >
                          {userItem.isAdmin ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Privileges Info */}
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <Shield className="w-5 h-5" />
            Admin Privileges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Regular Admins can:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Create and manage announcements</li>
              <li>Add and modify progress tasks</li>
              <li>Edit user profiles (name and role)</li>
              <li>View all scouting data</li>
            </ul>
            
            {isPermanentAdmin && (
              <>
                <p className="mt-4"><strong>Permanent Admin (10101) can additionally:</strong></p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Grant and revoke admin privileges</li>
                  <li>Add new users to the system</li>
                  <li>Access all administrative functions</li>
                </ul>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
