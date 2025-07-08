
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/custom/Button';
import { BankDetails } from './types';

interface WithdrawalFormProps {
  availableBalance: number;
  onSubmit: (amount: number, bankDetails: BankDetails) => Promise<void>;
  isSubmitting: boolean;
}

const WithdrawalForm = ({ availableBalance, onSubmit, isSubmitting }: WithdrawalFormProps) => {
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawalAmount = parseFloat(amount);
    await onSubmit(withdrawalAmount, bankDetails);
    setAmount('');
    setBankDetails({ bankName: '', accountNumber: '', accountName: '' });
  };

  return (
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
  );
};

export default WithdrawalForm;
