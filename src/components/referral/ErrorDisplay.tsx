
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/custom/Button';

interface ErrorDisplayProps {
  error: Error | null;
  onGoHome: () => void;
  onGoBack: () => void;
}

const ErrorDisplay = ({ error, onGoHome, onGoBack }: ErrorDisplayProps) => {
  const getErrorMessage = (error: Error | null) => {
    if (!error) return "Unknown error occurred";
    
    const errorMessage = error.message;
    
    if (errorMessage === "Referral code not found") {
      return "This referral code is not valid or has expired.";
    }
    if (errorMessage === "Product not found or no longer available") {
      return "The product associated with this referral link is no longer available.";
    }
    if (errorMessage.includes("unverified business")) {
      return "This product is from an unverified business.";
    }
    return "This referral link is not valid. Please check the link and try again.";
  };

  return (
    <div className="text-center max-w-md mx-auto p-6">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold mb-2">Invalid Referral Link</h1>
      <p className="text-muted-foreground mb-4">
        {getErrorMessage(error)}
      </p>
      <div className="space-y-2">
        <Button onClick={onGoHome} className="w-full">
          Go to Homepage
        </Button>
        <Button variant="outline" onClick={onGoBack} className="w-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
