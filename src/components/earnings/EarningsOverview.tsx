
import React from 'react';
import { DollarSign, TrendingUp, Wallet, Clock } from 'lucide-react';
import GlassCard from '@/components/ui/custom/GlassCard';
import NairaIcon from '@/components/ui/icons/NairaIcon';

interface EarningsOverviewProps {
  totalEarnings: number;
  pendingEarnings: number;
  availableBalance: number;
  thisMonthEarnings: number;
}

const EarningsOverview = ({ totalEarnings, pendingEarnings, availableBalance, thisMonthEarnings }: EarningsOverviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <GlassCard hover>
        <div className="flex items-center space-x-4">
          <div className="bg-green-500/10 p-3 rounded-full">
            <NairaIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Total Earnings</div>
            <div className="text-2xl font-bold text-green-600">₦{totalEarnings.toFixed(2)}</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover>
        <div className="flex items-center space-x-4">
          <div className="bg-blue-500/10 p-3 rounded-full">
            <Wallet className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Available Balance</div>
            <div className="text-2xl font-bold text-blue-600">₦{availableBalance.toFixed(2)}</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover>
        <div className="flex items-center space-x-4">
          <div className="bg-orange-500/10 p-3 rounded-full">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Pending Earnings</div>
            <div className="text-2xl font-bold text-orange-600">₦{pendingEarnings.toFixed(2)}</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover>
        <div className="flex items-center space-x-4">
          <div className="bg-purple-500/10 p-3 rounded-full">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">This Month</div>
            <div className="text-2xl font-bold text-purple-600">₦{thisMonthEarnings.toFixed(2)}</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default EarningsOverview;
