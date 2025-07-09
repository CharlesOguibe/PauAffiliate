
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Users, 
  DollarSign, 
  Link as LinkIcon, 
  BarChart3, 
  Settings, 
  Plus,
  ArrowRight,
  Copy,
  CheckCircle,
  LogOut,
  ArrowLeft,
  Shield
} from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EarningsOverview from '@/components/earnings/EarningsOverview';
import TransactionHistory from '@/components/earnings/TransactionHistory';
import NotificationBell from '@/components/notifications/NotificationBell';
import WithdrawalRequest from '@/components/withdrawals/WithdrawalRequest';
import WithdrawalHistory from '@/components/withdrawals/WithdrawalHistory';
import AdminPanel from '@/components/admin/AdminPanel';
import ProductList from '@/components/products/ProductList';
import ReferralLinksTable from '@/components/dashboard/ReferralLinksTable';
import BusinessMetrics from '@/components/dashboard/BusinessMetrics';
import TestFundsButton from '@/components/admin/TestFundsButton';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isAffiliateUser = user?.role === 'affiliate';
  const isBusinessUser = user?.role === 'business';
  const isAdminUser = user?.role === 'admin';
  
  // Enable earnings data fetching for both affiliate and business users
  const {
    referralLinks,
    earnings,
    transactions,
    notifications,
    withdrawalRequests,
    loading,
    refetch
  } = useDashboardData(user?.id, isAffiliateUser || isBusinessUser);

  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [productsCount, setProductsCount] = useState(0);
  const [totalReferralLinks, setTotalReferralLinks] = useState(0);

  // Fetch products count and total referral links for business users
  useEffect(() => {
    const fetchBusinessMetrics = async () => {
      if (isBusinessUser && user?.id) {
        try {
          // Fetch products count
          const { count: productCount, error: productError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', user.id);

          if (productError) {
            console.error('Error fetching products count:', productError);
          } else {
            setProductsCount(productCount || 0);
          }

          // Fetch total referral links for business products
          const { count: referralCount, error: referralError } = await supabase
            .from('referral_links')
            .select('*, products!fk_referral_links_product!inner(business_id)', { count: 'exact', head: true })
            .eq('products.business_id', user.id);

          if (referralError) {
            console.error('Error fetching referral links count:', referralError);
          } else {
            setTotalReferralLinks(referralCount || 0);
          }
        } catch (error) {
          console.error('Error fetching business metrics:', error);
        }
      }
    };

    fetchBusinessMetrics();
  }, [isBusinessUser, user?.id]);

  const copyToClipboard = (code: string, id: string) => {
    const referralLink = `${window.location.origin}/ref/${code}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopiedLinkId(id);
      toast({
        title: "Success!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopiedLinkId(null), 2000);
    });
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      refetch.notifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id);
      
      refetch.notifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleWithdrawalRequest = async (amount: number, bankDetails: any) => {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          affiliate_id: user?.id,
          amount,
          bank_name: bankDetails.bankName,
          account_number: bankDetails.accountNumber,
          account_name: bankDetails.accountName
        });

      if (error) throw error;
      
      refetch.withdrawalRequests();
      
      // Create notification
      await supabase.rpc('create_notification', {
        target_user_id: user?.id,
        notification_title: 'Withdrawal Request Submitted',
        notification_message: `Your withdrawal request for ₦${amount.toFixed(2)} has been submitted and is being processed.`,
        notification_type: 'withdrawal'
      });
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/50">
      <DashboardHeader
        user={user}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onClearNotifications={handleClearNotifications}
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto py-8 px-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-medium tracking-tight flex items-center gap-3">
                Welcome back, {user?.name}!
                {isAdminUser && <Shield className="h-6 w-6 text-yellow-500" />}
              </h1>
              <p className="text-muted-foreground mt-2">
                Your {isAffiliateUser ? 'affiliate' : isBusinessUser ? 'business' : 'admin'} dashboard overview
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAffiliateUser && <TestFundsButton />}
            </div>
          </div>
        </div>

        {isAdminUser && <AdminPanel />}

        {(isAffiliateUser || isBusinessUser) && (
          <>
            <EarningsOverview 
              totalEarnings={earnings.total}
              pendingEarnings={earnings.pending}
              availableBalance={earnings.available}
              thisMonthEarnings={earnings.thisMonth}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <TransactionHistory transactions={transactions} />
              <WithdrawalRequest 
                availableBalance={earnings.available}
                onWithdrawalRequest={handleWithdrawalRequest}
              />
            </div>

            <WithdrawalHistory withdrawalRequests={withdrawalRequests} />
          </>
        )}

        {isBusinessUser && (
          <>
            <BusinessMetrics 
              referralLinks={referralLinks} 
              isAffiliateUser={false}
              totalEarnings={earnings.total}
              productsCount={productsCount}
              totalReferralLinks={totalReferralLinks}
            />

            <div className="mb-8">
              <ProductList limit={5} />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                  <Package className="h-4 w-4 mr-2" />
                  Manage All Products
                </Button>
              </Link>
              <Link to="/products/create" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Product
                </Button>
              </Link>
            </div>
          </>
        )}

        {isAffiliateUser && (
          <>
            <BusinessMetrics 
              referralLinks={referralLinks} 
              isAffiliateUser={true}
              totalEarnings={earnings.total}
              productsCount={0}
              totalReferralLinks={0}
            />
            
            <ReferralLinksTable 
              referralLinks={referralLinks}
              copiedLinkId={copiedLinkId}
              onCopyToClipboard={copyToClipboard}
            />
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/affiliate/browse-products" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse More Products
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
