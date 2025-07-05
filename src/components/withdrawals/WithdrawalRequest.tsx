import React, { useState } from 'react';
import { Banknote, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { sendWithdrawalRequestEmail } from '@/utils/emailNotifications';

interface WithdrawalRequestProps {
  availableBalance: number;
  onWithdrawalRequest: (amount: number, bankDetails: BankDetails) => Promise<void>;
}

interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const WithdrawalRequest = ({ availableBalance, onWithdrawalRequest }: WithdrawalRequestProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    accountNumber: '',
    accountName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawalAmount = parseFloat(amount);
    
    if (withdrawalAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }

    if (withdrawalAmount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal.",
        variant: "destructive",
      });
      return;
    }

    if (withdrawalAmount < 1000) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is ₦1,000.",
        variant: "destructive",
      });
      return;
    }

    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
      toast({
        title: "Missing Bank Details",
        description: "Please fill in all bank details.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onWithdrawalRequest(withdrawalAmount, bankDetails);
      
      // Send email notification
      const user = JSON.parse(localStorage.getItem('sb-dbxgdgpmvobmrdlibauf-auth-token') || '{}');
      if (user?.user?.email && user?.user?.user_metadata?.name) {
        await sendWithdrawalRequestEmail(
          user.user.email,
          user.user.user_metadata.name,
          {
            amount: withdrawalAmount,
            bankName: bankDetails.bankName,
            accountNumber: bankDetails.accountNumber,
            accountName: bankDetails.accountName
          }
        );
      }
      
      setAmount('');
      setBankDetails({ bankName: '', accountNumber: '', accountName: '' });
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
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-primary/10 p-2 rounded-full">
            <Banknote className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Request Withdrawal</h3>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-700">
              Available Balance: <span className="font-semibold">₦{availableBalance.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Withdrawal Amount (₦)
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to withdraw"
              min="1000"
              max={availableBalance}
              step="0.01"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Minimum withdrawal: ₦1,000</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Bank Name
            </label>
            <Input
              type="text"
              value={bankDetails.bankName}
              onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
              placeholder="Enter your bank name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Account Number
            </label>
            <Input
              type="text"
              value={bankDetails.accountNumber}
              onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
              placeholder="Enter your account number"
              pattern="[0-9]{10}"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Account Name
            </label>
            <Input
              type="text"
              value={bankDetails.accountName}
              onChange={(e) => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
              placeholder="Enter account holder name"
              required
            />
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Submitting..."
            className="w-full"
            disabled={availableBalance < 1000}
          >
            Request Withdrawal
          </Button>
        </form>
      </div>
    </GlassCard>
  );
};

export default WithdrawalRequest;
