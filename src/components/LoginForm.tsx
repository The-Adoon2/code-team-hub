
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Zap, Loader2 } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await login(code);
      
      if (success) {
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
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full frc-button text-white font-semibold py-2"
                disabled={code.length !== 5 || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accessing...
                  </>
                ) : (
                  'Access Portal'
                )}
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
