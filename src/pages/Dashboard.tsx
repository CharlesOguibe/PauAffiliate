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

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isAffiliateUser = user?.role === 'affiliate';
  const isBusinessUser = user?.role === 'business';
  const isAdminUser = user?.role === 'admin';
  
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
      <header className="glass shadow-sm px-4 py-3 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-semibold tracking-tight">
            <span className="text-primary">PAU</span>Affiliate
          </Link>
          
          <div className="flex items-center space-x-4">
            <NotificationBell 
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationAsRead}
              onClearAll={handleClearNotifications}
            />
            {isAffiliateUser && <TestFundsButton />}
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Home
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight">
            Welcome back, {user?.name}!
            {isAdminUser && <Shield className="inline-block h-6 w-6 ml-2 text-yellow-500" />}
          </h1>
          <p className="text-muted-foreground mt-2">
            Your {isAffiliateUser ? 'affiliate' : isBusinessUser ? 'business' : 'admin'} dashboard overview
          </p>
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
            <BusinessMetrics referralLinks={referralLinks} isAffiliateUser={false} />

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
            <BusinessMetrics referralLinks={referralLinks} isAffiliateUser={true} />
            
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
