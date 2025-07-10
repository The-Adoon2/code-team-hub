import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProgressTask } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Clock, Plus, User, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Progress: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<ProgressTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    category: ''
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks' as any)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks((data || []) as unknown as ProgressTask[]);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error Loading Tasks",
        description: "Could not load project tasks.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim() || !newTask.category.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, description, and category.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks' as any)
        .insert([{
          title: newTask.title,
          description: newTask.description,
          assigned_to: newTask.assigned_to || null,
          due_date: newTask.due_date || null,
          category: newTask.category
        }])
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [...prev, data as unknown as ProgressTask]);
      setNewTask({ title: '', description: '', assigned_to: '', due_date: '', category: '' });
      setShowAddDialog(false);
      
      toast({
        title: "Task Added",
        description: "New task has been created successfully.",
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Could not add task.",
        variant: "destructive",
      });
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks' as any)
        .update({ completed: !task.completed })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Could not update task.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks' as any)
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({
        title: "Task Deleted",
        description: "Task has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Could not delete task.",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Design': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'Programming': 'bg-green-500/10 text-green-500 border-green-500/20',
      'Build': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'Strategy': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'Safety': 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return colors[category] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-frc-blue"></div>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress Overview */}
      <Card className="border-frc-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Team Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Progress</span>
              <span className="text-sm font-medium">{completedTasks}/{totalTasks} tasks completed</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-frc-blue to-frc-orange h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-frc-blue">{Math.round(progressPercentage)}%</span>
              <span className="text-muted-foreground ml-2">Complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Project Tasks
            </CardTitle>
            {user?.isAdmin && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="frc-accent-button text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="taskTitle">Title</Label>
                      <Input
                        id="taskTitle"
                        value={newTask.title}
                        onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter task title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taskDescription">Description</Label>
                      <Textarea
                        id="taskDescription"
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter task description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taskCategory">Category</Label>
                      <Input
                        id="taskCategory"
                        value={newTask.category}
                        onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., Design, Programming, Build"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taskAssignee">Assigned To (Optional)</Label>
                      <Input
                        id="taskAssignee"
                        value={newTask.assigned_to}
                        onChange={(e) => setNewTask(prev => ({ ...prev, assigned_to: e.target.value }))}
                        placeholder="Enter team member name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taskDueDate">Due Date (Optional)</Label>
                      <Input
                        id="taskDueDate"
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleAddTask} className="w-full">
                      Create Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tasks created yet.</p>
              <p className="text-sm">Admins can add tasks to track team progress!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  task.completed ? 'bg-green-500/5 border-green-500/20' : 'border-border hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(task.category)}>
                          {task.category}
                        </Badge>
                        {user?.isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {task.assigned_to && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{task.assigned_to}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Progress;
