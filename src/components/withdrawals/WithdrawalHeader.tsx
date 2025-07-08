
import React from 'react';
import { Banknote } from 'lucide-react';

const WithdrawalHeader = () => {
  return (
    <div className="flex items-center space-x-3 mb-6">
      <div className="bg-primary/10 p-2 rounded-full">
        <Banknote className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">Request Withdrawal</h3>
    </div>
  );
};

export default WithdrawalHeader;
