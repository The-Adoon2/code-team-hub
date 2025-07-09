
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ProgressTask } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Clock, Plus, User, Calendar } from 'lucide-react';

const Progress: React.FC = () => {
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<ProgressTask[]>([
    {
      id: '1',
      title: 'Design Robot Chassis',
      description: 'Create detailed CAD drawings for the robot chassis including mounting points for all subsystems.',
      completed: true,
      assignedTo: 'Design Team',
      dueDate: new Date('2024-01-20'),
      category: 'Design'
    },
    {
      id: '2',
      title: 'Program Autonomous Routine',
      description: 'Develop and test autonomous routine for scoring in the speaker during the autonomous period.',
      completed: false,
      assignedTo: 'Programming Team',
      dueDate: new Date('2024-01-25'),
      category: 'Programming'
    },
    {
      id: '3',
      title: 'Build Drivetrain',
      description: 'Assemble the drivetrain using the completed chassis design and install motors.',
      completed: false,
      assignedTo: 'Build Team',
      dueDate: new Date('2024-01-30'),
      category: 'Build'
    },
    {
      id: '4',
      title: 'Create Team Strategy',
      description: 'Develop comprehensive strategy for alliance selection and match play.',
      completed: false,
      assignedTo: 'Strategy Team',
      dueDate: new Date('2024-02-05'),
      category: 'Strategy'
    },
    {
      id: '5',
      title: 'Test Safety Systems',
      description: 'Verify all safety systems are working properly including emergency stops and guards.',
      completed: false,
      assignedTo: 'Safety Team',
      dueDate: new Date('2024-02-01'),
      category: 'Safety'
    }
  ]);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
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

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = (completedTasks / totalTasks) * 100;

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
              <Button size="sm" className="frc-accent-button text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.map((task) => (
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
                    <Badge className={getCategoryColor(task.category)}>
                      {task.category}
                    </Badge>
                  </div>
                  <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                    {task.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {task.assignedTo && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{task.assignedTo}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {task.dueDate.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Progress;
