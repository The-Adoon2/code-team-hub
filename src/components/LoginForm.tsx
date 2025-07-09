
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Zap } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [code, setCode] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (login(code)) {
      toast({
        title: "Login Successful",
        description: "Welcome to the FRC Team Portal!",
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Please enter a valid 5-digit code.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-frc-blue/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-frc-blue to-frc-orange rounded-full mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-frc-blue to-frc-orange bg-clip-text text-transparent">
            FRC Team Portal
          </h1>
          <p className="text-muted-foreground mt-2">Enter your 5-digit team code</p>
        </div>

        <Card className="border-2 border-border/50 backdrop-blur-sm bg-card/90">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" />
              Team Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter 5-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="text-center text-lg font-mono tracking-widest"
                  maxLength={5}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full frc-button text-white font-semibold py-2"
                disabled={code.length !== 5}
              >
                Access Portal
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Demo codes: 10101 (Admin), 12345, 54321</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
