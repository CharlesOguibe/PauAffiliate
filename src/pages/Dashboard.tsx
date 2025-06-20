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
import { supabase } from '@/integrations/supabase/client';
import { ReferralLink } from '@/types';
import { useToast } from '@/hooks/use-toast';
import EarningsOverview from '@/components/earnings/EarningsOverview';
import TransactionHistory from '@/components/earnings/TransactionHistory';
import NotificationBell from '@/components/notifications/NotificationBell';
import WithdrawalRequest from '@/components/withdrawals/WithdrawalRequest';
import WithdrawalHistory from '@/components/withdrawals/WithdrawalHistory';
import AdminPanel from '@/components/admin/AdminPanel';
import ProductList from '@/components/products/ProductList';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isAffiliateUser = user?.role === 'affiliate';
  const isBusinessUser = user?.role === 'business';
  const isAdminUser = user?.role === 'admin';
  const [referralLinks, setReferralLinks] = useState<Array<ReferralLink & { product: { name: string; price: number; commissionRate: number } }>>([]);
  const [loading, setLoading] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [earnings, setEarnings] = useState({
    total: 0,
    pending: 0,
    available: 0,
    thisMonth: 0
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    if (user?.id) {
      if (isAffiliateUser) {
        fetchReferralLinks();
        fetchEarnings();
        fetchTransactions();
        fetchWithdrawalRequests();
      }
      if (isBusinessUser) {
        fetchProductCount();
        fetchBusinessMetrics();
      }
      fetchNotifications();
      setupRealtimeSubscriptions();
    }
  }, [user?.id, isAffiliateUser, isBusinessUser]);

  const fetchProductCount = async () => {
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', user?.id);

      if (error) {
        console.error('Error fetching product count:', error);
      } else {
        setProductCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching product count:', error);
    }
  };

  const fetchBusinessMetrics = async () => {
    try {
      // Fetch total referrals count
      const { count: referralCount, error: referralError } = await supabase
        .from('referral_links')
        .select('*', { count: 'exact', head: true })
        .in('product_id', 
          supabase
            .from('products')
            .select('id')
            .eq('business_id', user?.id)
        );

      if (referralError) {
        console.error('Error fetching referral count:', referralError);
      } else {
        setTotalReferrals(referralCount || 0);
      }

      // Fetch total sales amount
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('amount')
        .in('product_id',
          supabase
            .from('products')
            .select('id')
            .eq('business_id', user?.id)
        )
        .eq('status', 'completed');

      if (salesError) {
        console.error('Error fetching sales data:', salesError);
      } else {
        const totalAmount = salesData?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
        setTotalSales(totalAmount);
      }
    } catch (error) {
      console.error('Error fetching business metrics:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to notifications
    const notificationsChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('New notification:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    // Subscribe to product changes for business users
    let productsChannel;
    let referralLinksChannel;
    let salesChannel;
    
    if (isBusinessUser) {
      productsChannel = supabase
        .channel('products')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
            filter: `business_id=eq.${user?.id}`
          },
          (payload) => {
            console.log('Product change:', payload);
            fetchProductCount();
          }
        )
        .subscribe();

      // Subscribe to referral links changes
      referralLinksChannel = supabase
        .channel('referral_links')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'referral_links'
          },
          (payload) => {
            console.log('Referral link change:', payload);
            fetchBusinessMetrics();
          }
        )
        .subscribe();

      // Subscribe to sales changes
      salesChannel = supabase
        .channel('sales')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sales'
          },
          (payload) => {
            console.log('Sale change:', payload);
            fetchBusinessMetrics();
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(notificationsChannel);
      if (productsChannel) {
        supabase.removeChannel(productsChannel);
      }
      if (referralLinksChannel) {
        supabase.removeChannel(referralLinksChannel);
      }
      if (salesChannel) {
        supabase.removeChannel(salesChannel);
      }
    };
  };

  const fetchReferralLinks = async () => {
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
        .eq('affiliate_id', user?.id);

      if (error) {
        console.error('Error fetching referral links:', error);
      } else {
        setReferralLinks(data.map(item => ({
          id: item.id,
          productId: item.product_id,
          affiliateId: user?.id || '',
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

  const fetchEarnings = async () => {
    try {
      // Fetch wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      // Fetch affiliate earnings
      const { data: affiliateEarnings } = await supabase
        .from('affiliate_earnings')
        .select('amount, status')
        .eq('affiliate_id', user?.id);

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
        .eq('wallet_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (walletTransactions) {
        setTransactions(walletTransactions.map(tx => ({
          id: tx.id,
          type: tx.transaction_type === 'commission' ? 'commission' : 'withdrawal',
          amount: Math.abs(tx.amount),
          description: tx.description || 'Transaction',
          date: new Date(tx.created_at),
          status: 'completed'
        })));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: new Date(n.created_at)
        })));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchWithdrawalRequests = async () => {
    try {
      const { data } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('affiliate_id', user?.id)
        .order('created_at', { ascending: false });

      if (data) {
        setWithdrawalRequests(data);
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
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
      
      setNotifications([]);
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
      
      fetchWithdrawalRequests();
      
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

        {isAffiliateUser && (
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <GlassCard hover>
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Your Products
                    </div>
                    <div className="text-2xl font-bold">{productCount}</div>
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
                      Total Referrals
                    </div>
                    <div className="text-2xl font-bold">{totalReferrals}</div>
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
                      Total Sales
                    </div>
                    <div className="text-2xl font-bold">₦{totalSales.toFixed(2)}</div>
                  </div>
                </div>
              </GlassCard>
            </div>

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
            {referralLinks.length > 0 ? (
              <div className="mt-8">
                <h2 className="text-xl font-medium mb-4">Your Referral Links</h2>
                <GlassCard className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Commission Rate</TableHead>
                          <TableHead>Clicks</TableHead>
                          <TableHead>Conversions</TableHead>
                          <TableHead>Referral Link</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referralLinks.map((link) => (
                          <TableRow key={link.id}>
                            <TableCell className="font-medium">{link.product.name}</TableCell>
                            <TableCell>{link.product.commissionRate}%</TableCell>
                            <TableCell>{link.clicks}</TableCell>
                            <TableCell>{link.conversions}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <code className="bg-muted px-2 py-1 rounded text-xs">
                                  {`${window.location.origin}/ref/${link.code}`}
                                </code>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => copyToClipboard(link.code, link.id)}
                                >
                                  {copiedLinkId === link.id ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </GlassCard>
              </div>
            ) : (
              <GlassCard className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <LinkIcon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Your Referral Links</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  You haven't created any referral links yet. Browse products to start promoting.
                </p>
                <Link to="/affiliate/browse-products">
                  <Button variant="outline" size="sm">
                    Create First Link
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </GlassCard>
            )}
            
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
