import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Users, ArrowRight, BarChart, PlusCircle, Tag, LogOut, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProductList from '@/components/products/ProductList';
import NairaIcon from '@/components/ui/icons/NairaIcon';



const fetchBusinessProducts = async (userId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', userId);

  if (error) throw error;
  return data || [];
};

const EmptyBusinessDashboard = () => {
  return (
    <div className="space-y-6">
      <GlassCard className="animate-fade-in p-8 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-medium">Welcome to your Business Dashboard!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your dashboard is ready, but you haven't added any products yet. 
            Start by creating your first product to attract affiliates.
          </p>
          <Link to="/products/create">
            <Button variant="primary" className="mt-4">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          </Link>
        </div>
      </GlassCard>
      
      <GlassCard className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Getting Started</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 border border-border rounded-md">
            <div className="bg-primary/10 p-2 rounded-full">
              <Tag className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Create Your Products</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Add products you want to promote through affiliates. Include details, pricing, and commission rates.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 border border-border rounded-md">
            <div className="bg-primary/10 p-2 rounded-full">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Attract Affiliates</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Once your products are set up, affiliates can find and promote them, earning commissions on sales.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 border border-border rounded-md">
            <div className="bg-primary/10 p-2 rounded-full">
              <BarChart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Track Your Performance</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Monitor sales, revenue, and affiliate performance right from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const EmptyAffiliateDashboard = () => {
  return (
    <div className="space-y-6">
      <GlassCard className="animate-fade-in p-8 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Tag className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-medium">Welcome to your Affiliate Dashboard!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your dashboard is ready! Start by browsing products from our verified businesses
            and create your first referral link.
          </p>
          <Link to="/products">
            <Button variant="primary" className="mt-4">
              <Package className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </div>
      </GlassCard>
      
      <GlassCard className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Getting Started</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 border border-border rounded-md">
            <div className="bg-primary/10 p-2 rounded-full">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Select Products</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Browse and select products that align with your audience and promotional strategy.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 border border-border rounded-md">
            <div className="bg-primary/10 p-2 rounded-full">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Get Referral Links</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Generate unique referral links for each product to track your promotions and earnings.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 border border-border rounded-md">
          <div className="bg-primary/10 p-2 rounded-full">
  <NairaIcon className="h-6 w-6 text-primary" />
</div>

            <div>
              <h4 className="text-sm font-medium">Earn Commissions</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Start promoting products and earn commissions for every sale made through your referral links.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const BusinessDashboard = () => {
  const { user } = useAuth();
  const { data: products, isLoading } = useQuery({
    queryKey: ['business-products', user?.id],
    queryFn: () => fetchBusinessProducts(user?.id || ''),
    enabled: !!user?.id,
  });
  
  const hasProducts = products && products.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6 text-center">
          <div className="animate-pulse">Loading your business dashboard...</div>
        </GlassCard>
      </div>
    );
  }
  
  if (!hasProducts) {
    return <EmptyBusinessDashboard />;
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center">
          <div className="bg-primary/10 p-3 rounded-full">
  <NairaIcon className="h-6 w-6 text-primary" />
</div>

            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Products</p>
              <h4 className="text-2xl font-semibold">{products.length}</h4>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Affiliates</p>
              <h4 className="text-2xl font-semibold">0</h4>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <NairaIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Revenue</p>
              <h4 className="text-2xl font-semibold">₦0.00</h4>
            </div>
          </div>
        </GlassCard>
      </div>
      
      <ProductList limit={5} />
    </div>
  );
};

const AffiliateDashboard = () => {
  const [hasProducts, setHasProducts] = useState(false);
  
  if (!hasProducts) {
    return <EmptyAffiliateDashboard />;
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center">
          <div className="bg-primary/10 p-3 rounded-full">
  <NairaIcon className="h-6 w-6 text-primary" />
</div>

            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Earnings</p>
              <h4 className="text-2xl font-semibold">₦348.75</h4>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Products</p>
              <h4 className="text-2xl font-semibold">8</h4>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <BarChart className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Conversions</p>
              <h4 className="text-2xl font-semibold">24</h4>
            </div>
          </div>
        </GlassCard>
      </div>
      
      <GlassCard className="animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Your Referrals</h3>
          <Link to="/dashboard/referrals">
            <Button variant="ghost" size="sm" className="text-xs">
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-sm">
                    {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    Product {i + 1}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    ₦{(Math.random() * 100 + 20).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    ₦{(Math.random() * 20 + 5).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${i % 3 === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {i % 3 === 0 ? 'Pending' : 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Your Products</h3>
            <Link to="/dashboard/products">
              <Button variant="ghost" size="sm" className="text-xs">
                Find More
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Product {i + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      <Tag className="h-3 w-3 inline mr-1" />
                      {Math.floor(Math.random() * 10 + 5)}% commission
                    </p>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  ₦{(Math.random() * 50 + 10).toFixed(2)} earned
                </div>
              </div>
            ))}
            
            <Link to="/dashboard/products/browse">
              <Button variant="outline" size="sm" className="w-full mt-2">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add More Products
              </Button>
            </Link>
          </div>
        </GlassCard>
        
        <GlassCard className="animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Referral Links</h3>
            <Link to="/dashboard/links">
              <Button variant="ghost" size="sm" className="text-xs">
                Manage Links
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                    <Tag className="h-4 w-4" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Product {i + 1}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                      example.com/ref/{100 + i}
                    </p>
                  </div>
                </div>
                <div className="text-xs">
                  <p><span className="font-medium">{Math.floor(Math.random() * 100 + 20)}</span> clicks</p>
                  <p><span className="font-medium">{Math.floor(Math.random() * 10 + 1)}</span> conversions</p>
                </div>
              </div>
            ))}
            
            <Button variant="outline" size="sm" className="w-full mt-2">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Link
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [verificationSent, setVerificationSent] = useState(false);
  
  const userRole = user?.role || 'business';

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
      });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      
      if (error) throw error;
      
      setVerificationSent(true);
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and click the confirmation link",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error sending verification email",
        description: error.message,
      });
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
            <div className="text-sm mr-2">
              {user?.name || 'User'} ({userRole})
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight mb-1">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'User'}! Here's an overview of your {userRole === 'business' ? 'business' : 'affiliate'} activity.
          </p>
        </div>
        
        {userRole === 'business' ? (
          <BusinessDashboard />
        ) : (
          <AffiliateDashboard />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
