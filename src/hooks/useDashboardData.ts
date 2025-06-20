
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReferralLink } from '@/types';
import { DashboardEarnings, DashboardTransaction, DashboardNotification, WithdrawalRequest } from '@/types/dashboard';

export const useDashboardData = (userId: string | undefined, isAffiliateUser: boolean) => {
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
      const { data, error } = await supabase
        .from('referral_links')
        .select(`
          id, 
          code, 
          clicks, 
          conversions, 
          product_id, 
          created_at,
          products (
            name, 
            price, 
            commission_rate
          )
        `)
        .eq('affiliate_id', userId);

      if (error) {
        console.error('Error fetching referral links:', error);
      } else {
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
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      // Fetch affiliate earnings
      const { data: affiliateEarnings } = await supabase
        .from('affiliate_earnings')
        .select('amount, status')
        .eq('affiliate_id', userId);

      if (affiliateEarnings) {
        const total = affiliateEarnings.reduce((sum, earning) => sum + earning.amount, 0);
        const pending = affiliateEarnings
          .filter(e => e.status === 'pending')
          .reduce((sum, earning) => sum + earning.amount, 0);
        
        setEarnings({
          total,
          pending,
          available: wallet?.balance || 0,
          thisMonth: total
        });
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!userId) return;
    
    try {
      const { data: walletTransactions } = await supabase
        .from('wallet_transactions')
        .select(`
          id,
          amount,
          transaction_type,
          description,
          created_at
        `)
        .eq('wallet_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

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
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

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
      const { data } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('affiliate_id', userId)
        .order('created_at', { ascending: false });

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
      if (isAffiliateUser) {
        fetchReferralLinks();
        fetchEarnings();
        fetchTransactions();
        fetchWithdrawalRequests();
      }
      fetchNotifications();
    }
  }, [userId, isAffiliateUser]);

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
