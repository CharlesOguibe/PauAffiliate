
import React, { useState } from 'react';
import GlassCard from '@/components/ui/custom/GlassCard';
import { useToast } from '@/hooks/use-toast';
import { useWithdrawalSubmit } from '@/hooks/useWithdrawalSubmit';
import WithdrawalHeader from './WithdrawalHeader';
import WithdrawalInfo from './WithdrawalInfo';
import WithdrawalForm from './WithdrawalForm';
import { BankDetails } from './types';

interface WithdrawalRequestProps {
  availableBalance: number;
  onWithdrawalRequest: (amount: number, bankDetails: BankDetails) => Promise<void>;
}

const WithdrawalRequest = ({ availableBalance, onWithdrawalRequest }: WithdrawalRequestProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validateWithdrawal, sendNotifications } = useWithdrawalSubmit();

  const handleSubmit = async (amount: number, bankDetails: BankDetails) => {
    if (!validateWithdrawal(amount, availableBalance, bankDetails)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onWithdrawalRequest(amount, bankDetails);
      await sendNotifications(amount, bankDetails);
      
      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal request has been submitted and will be processed within 24-48 hours. Check your email for confirmation.",
      });
    } catch (error) {
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Failed to submit withdrawal request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard>
      <div className="p-6">
        <WithdrawalHeader />
        <WithdrawalInfo availableBalance={availableBalance} />
        <WithdrawalForm
          availableBalance={availableBalance}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </GlassCard>
  );
};

export default WithdrawalRequest;
