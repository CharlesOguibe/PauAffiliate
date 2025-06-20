
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
  ArrowLeft
} from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import ProductList from '@/components/products/ProductList';
import { supabase } from '@/integrations/supabase/client';
import { ReferralLink } from '@/types';
import { useToast } from '@/hooks/use-toast';
import EarningsOverview from '@/components/earnings/EarningsOverview';
import TransactionHistory from '@/components/earnings/TransactionHistory';
import NotificationBell from '@/components/notifications/NotificationBell';
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

  useEffect(() => {
    if (isAffiliateUser && user?.id) {
      fetchReferralLinks();
      fetchEarnings();
      fetchTransactions();
      fetchNotifications();
    }
  }, [isAffiliateUser, user?.id]);

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
          thisMonth: total // Simplified - could add date filtering
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
    // Mock notifications for now - in real app, fetch from database
    setNotifications([
      {
        id: '1',
        title: 'New Sale!',
        message: 'You earned ₦500 commission from a referral sale.',
        type: 'commission',
        read: false,
        createdAt: new Date()
      }
    ]);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
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
          <h1 className="text-3xl font-medium tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground mt-2">
            Your {isAffiliateUser ? 'affiliate' : 'business'} dashboard overview
          </p>
        </div>

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
              <GlassCard>
                <div className="p-6 text-center">
                  <h3 className="text-lg font-semibold mb-4">Withdrawal Information</h3>
                  <p className="text-muted-foreground mb-6">
                    Available Balance: ₦{earnings.available.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Withdrawal system will be available soon. Contact support for manual withdrawals.
                  </p>
                </div>
              </GlassCard>
            </div>
          </>
        )}

        {isBusinessUser && (
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
