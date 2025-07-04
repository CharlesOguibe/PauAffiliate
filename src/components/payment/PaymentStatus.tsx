
import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';

interface PaymentStatusProps {
  status: 'loading' | 'success' | 'error';
  message: string;
  onRetry?: () => void;
  onContinue?: () => void;
}

const PaymentStatus = ({ status, message, onRetry, onContinue }: PaymentStatusProps) => {
  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processing Payment...';
      case 'success':
        return 'Payment Successful!';
      case 'error':
        return 'Payment Failed';
    }
  };

  return (
    <GlassCard className="max-w-md mx-auto">
      <div className="p-6 text-center">
        <div className="mb-4">
          {getIcon()}
        </div>
        <h2 className="text-2xl font-bold mb-2">{getTitle()}</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        
        <div className="space-y-2">
          {status === 'success' && onContinue && (
            <Button onClick={onContinue} className="w-full">
              Continue
            </Button>
          )}
          
          {status === 'error' && onRetry && (
            <Button onClick={onRetry} className="w-full">
              Try Again
            </Button>
          )}
          
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground">
              Please do not close this window...
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default PaymentStatus;
