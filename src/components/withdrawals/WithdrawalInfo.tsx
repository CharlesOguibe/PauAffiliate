
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface WithdrawalInfoProps {
  availableBalance: number;
}

const WithdrawalInfo = ({ availableBalance }: WithdrawalInfoProps) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <p className="text-sm text-blue-700">
          Available Balance: <span className="font-semibold">₦{availableBalance.toFixed(2)}</span>
        </p>
      </div>
      <p className="text-xs text-blue-600 mt-1">
        Withdrawals are processed within 24-48 hours. You'll receive email notifications about status updates.
      </p>
    </div>
  );
};

export default WithdrawalInfo;
