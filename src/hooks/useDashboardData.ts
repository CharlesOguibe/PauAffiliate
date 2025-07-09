
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReferralLink } from '@/types';
import { DashboardEarnings, DashboardTransaction, DashboardNotification, WithdrawalRequest } from '@/types/dashboard';

export const useDashboardData = (userId: string | undefined, shouldFetchEarningsData: boolean) => {
  const [referralLinks, setReferralLinks] = useState<Array<ReferralLink & { product: { name: string; price: number; commissionRate: number } }>>([]);
  const [earnings, setEarnings] = useState<DashboardEarnings>({
    total: 0,
    pending: 0,
    available: 0,
    thisMonth: 0
  });
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReferralLinks = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      console.log('Fetching referral links for user:', userId);
      
      const { data, error } = await supabase
        .from('referral_links')
        .select(`
          id, 
          code, 
          clicks, 
          conversions, 
          product_id, 
          created_at,
          products!fk_referral_links_product (
            name, 
            price, 
            commission_rate
          )
        `)
        .eq('affiliate_id', userId);

      console.log('User referral links query result:', data, error);

      if (error) {
        console.error('Error fetching referral links:', error);
      } else {
        console.log('Found referral links for user:', data?.length || 0);
        setReferralLinks(data.map(item => ({
          id: item.id,
          productId: item.product_id,
          affiliateId: userId,
          code: item.code,
          clicks: item.clicks,
          conversions: item.conversions,
          createdAt: new Date(item.created_at),
          product: {
            name: item.products.name,
            price: item.products.price,
            commissionRate: item.products.commission_rate
          }
        })));
      }
    } catch (error) {
      console.error('Error fetching referral links:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    if (!userId) return;
    
    try {
      // Fetch wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Wallet query result:', wallet, walletError);

      // For business users, fetch earnings from sales of their products
      // For affiliate users, fetch earnings from affiliate_earnings table
      let totalEarnings = 0;
      let pendingEarnings = 0;

      // Check if user is business by looking at business_profiles
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      console.log('Business profile query result:', businessProfile, businessError);

      if (businessProfile) {
        // Business user - calculate earnings from sales of their products
        const { data: businessSales, error: salesError } = await supabase
          .from('sales')
          .select(`
            amount,
            commission_amount,
            status,
            products!fk_sales_product!inner(business_id)
          `)
          .eq('products.business_id', userId);

        console.log('Business sales query result:', businessSales, salesError);

        if (businessSales) {
          // Business gets the sale amount minus the commission paid to affiliates
          totalEarnings = businessSales.reduce((sum, sale) => sum + (sale.amount - sale.commission_amount), 0);
          pendingEarnings = businessSales
            .filter(sale => sale.status === 'pending')
            .reduce((sum, sale) => sum + (sale.amount - sale.commission_amount), 0);
        }
      } else {
        // Affiliate user - fetch from affiliate_earnings
        const { data: affiliateEarnings, error: earningsError } = await supabase
          .from('affiliate_earnings')
          .select('amount, status')
          .eq('affiliate_id', userId);

        console.log('Affiliate earnings query result:', affiliateEarnings, earningsError);

        if (affiliateEarnings) {
          totalEarnings = affiliateEarnings.reduce((sum, earning) => sum + earning.amount, 0);
          pendingEarnings = affiliateEarnings
            .filter(e => e.status === 'pending')
            .reduce((sum, earning) => sum + earning.amount, 0);
        }
      }
      
      setEarnings({
        total: totalEarnings,
        pending: pendingEarnings,
        available: wallet?.balance || 0,
        thisMonth: totalEarnings
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!userId) return;
    
    try {
      // First ensure we have a wallet for this user
      const { data: userWallet, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('User wallet lookup:', userWallet, walletError);

      if (!userWallet) {
        console.log('No wallet found for user, checking if user is business for direct sales transactions');
        
        // Check if this is a business user - if so, show their sales as transactions
        const { data: businessProfile } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (businessProfile) {
          // For business users, show sales of their products as transactions
          const { data: businessSales, error: salesError } = await supabase
            .from('sales')
            .select(`
              id,
              amount,
              commission_amount,
              created_at,
              status,
              products!fk_sales_product!inner(name, business_id)
            `)
            .eq('products.business_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

          console.log('Business sales query result:', businessSales, salesError);

          if (businessSales) {
            const businessTransactions = businessSales.map(sale => ({
              id: sale.id,
              type: 'commission' as const,
              amount: sale.amount - sale.commission_amount, // Business gets sale amount minus commission
              description: `Sale of ${sale.products.name}`,
              date: new Date(sale.created_at),
              status: sale.status === 'completed' ? 'completed' as const : 'pending' as const
            }));
            setTransactions(businessTransactions);
            return;
          }
        }
        
        return;
      }

      const { data: walletTransactions, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select(`
          id,
          amount,
          transaction_type,
          description,
          created_at
        `)
        .eq('wallet_id', userWallet.id)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('Wallet transactions query result:', walletTransactions, transactionsError);

      if (walletTransactions) {
        setTransactions(walletTransactions.map(tx => ({
          id: tx.id,
          type: tx.transaction_type === 'commission' ? 'commission' : 'withdrawal',
          amount: Math.abs(tx.amount),
          description: tx.description || 'Transaction',
          date: new Date(tx.created_at),
          status: 'completed' as const
        })));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('Notifications query result:', data, error);

      if (data) {
        const transformedNotifications: DashboardNotification[] = data.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type as 'sale' | 'commission' | 'withdrawal' | 'info',
          read: n.read,
          createdAt: new Date(n.created_at)
        }));
        setNotifications(transformedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchWithdrawalRequests = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('affiliate_id', userId)
        .order('created_at', { ascending: false });

      console.log('Withdrawal requests query result:', data, error);

      if (data) {
        const transformedRequests: WithdrawalRequest[] = data.map(req => ({
          id: req.id,
          amount: req.amount,
          bank_name: req.bank_name,
          account_number: req.account_number,
          account_name: req.account_name,
          status: req.status as 'pending' | 'approved' | 'rejected' | 'completed',
          created_at: req.created_at,
          processed_at: req.processed_at,
          affiliate_id: req.affiliate_id,
          profiles: { name: '', email: '' } // Placeholder, will be populated by admin panel
        }));
        setWithdrawalRequests(transformedRequests);
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      // Always fetch notifications for any user type
      fetchNotifications();
      
      if (shouldFetchEarningsData) {
        fetchEarnings();
        fetchTransactions();
        fetchWithdrawalRequests();
        
        // Only fetch referral links for affiliate users
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'affiliate') {
          fetchReferralLinks();
        }
      }
    }
  }, [userId, shouldFetchEarningsData]);

  return {
    referralLinks,
    earnings,
    transactions,
    notifications,
    withdrawalRequests,
    loading,
    refetch: {
      referralLinks: fetchReferralLinks,
      earnings: fetchEarnings,
      transactions: fetchTransactions,
      notifications: fetchNotifications,
      withdrawalRequests: fetchWithdrawalRequests
    }
  };
};
