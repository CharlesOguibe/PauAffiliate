
import React from 'react';
import { DollarSign, LinkIcon, Package } from 'lucide-react';
import GlassCard from '@/components/ui/custom/GlassCard';
import { ReferralLink } from '@/types';

interface BusinessMetricsProps {
  referralLinks: Array<ReferralLink & { product: { name: string; price: number; commissionRate: number } }>;
  isAffiliateUser: boolean;
}

const BusinessMetrics = ({ referralLinks, isAffiliateUser }: BusinessMetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <GlassCard hover>
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              {isAffiliateUser ? 'Products Promoting' : 'Your Products'}
            </div>
            <div className="text-2xl font-bold">
              {isAffiliateUser ? referralLinks.length : '0'}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover>
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <LinkIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              {isAffiliateUser ? 'Referral Links' : 'Total Referrals'}
            </div>
            <div className="text-2xl font-bold">
              {isAffiliateUser ? referralLinks.length : '0'}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard hover>
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              {isAffiliateUser ? 'Earnings' : 'Total Sales'}
            </div>
            <div className="text-2xl font-bold">₦0.00</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default BusinessMetrics;
