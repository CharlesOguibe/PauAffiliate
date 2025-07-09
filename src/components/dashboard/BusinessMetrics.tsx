
import React from 'react';
import { DollarSign, LinkIcon, Package } from 'lucide-react';
import GlassCard from '@/components/ui/custom/GlassCard';
import { ReferralLink } from '@/types';

interface BusinessMetricsProps {
  referralLinks: Array<ReferralLink & { product: { name: string; price: number; commissionRate: number } }>;
  isAffiliateUser: boolean;
  totalEarnings?: number;
  productsCount?: number;
  totalReferralLinks?: number;
}

const BusinessMetrics = ({ 
  referralLinks, 
  isAffiliateUser, 
  totalEarnings = 0,
  productsCount = 0,
  totalReferralLinks = 0
}: BusinessMetricsProps) => {
  // For affiliate users, show products they're promoting and their referral links
  // For business users, show their products and total referrals to their products
  const productsMetric = isAffiliateUser ? referralLinks.length : productsCount;
  const linksMetric = isAffiliateUser ? referralLinks.length : totalReferralLinks;

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
              {productsMetric}
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
              {linksMetric}
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
            <div className="text-2xl font-bold">₦{totalEarnings.toFixed(2)}</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default BusinessMetrics;
