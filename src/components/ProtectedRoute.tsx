
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    
    try {
      setSendingEmail(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Confirmation email sent',
        description: 'Please check your inbox for the confirmation link',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send confirmation email',
        description: error.message,
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Show shorter loading state with spinner
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/auth/login" replace />;
  }

  // Handle email verification requirement
  if (!user.emailConfirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="bg-amber-50 border-amber-200 mb-6">
            <AlertTitle className="text-amber-800 flex items-center gap-2">
              <Mail className="h-5 w-5" /> Email verification required
            </AlertTitle>
            <AlertDescription className="text-amber-700 mt-2">
              Please check your inbox and click the confirmation link to verify your email address.
              If you didn't receive an email or the link expired, you can request a new one.
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={handleResendConfirmation}
            className="w-full"
            disabled={sendingEmail}
          >
            {sendingEmail ? 'Sending...' : 'Resend confirmation email'}
          </Button>
          
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/auth/login';
              }}
            >
              Back to login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
