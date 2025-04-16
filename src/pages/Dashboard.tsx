
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Users, 
  DollarSign, 
  Link as LinkIcon, 
  BarChart3, 
  Settings, 
  Plus,
  ArrowRight
} from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import ProductList from '@/components/products/ProductList';

const Dashboard = () => {
  const { user } = useAuth();
  const isAffiliateUser = user?.role === 'affiliate';
  const isBusinessUser = user?.role === 'business';

  return (
    <div className="min-h-screen bg-secondary/50">
      <header className="glass shadow-sm px-4 py-3 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-semibold tracking-tight">
            <span className="text-primary">PAU</span>Affiliate
          </Link>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              {user?.email}
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
                <div className="text-2xl font-bold">0</div>
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
                <div className="text-2xl font-bold">0</div>
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

        {isBusinessUser && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium">Recent Products</h2>
              <Link to="/products">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            
            <ProductList limit={3} />
            
            <div className="mt-8">
              <Link to="/products/create">
                <Button variant="primary" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Product
                </Button>
              </Link>
            </div>
          </>
        )}

        {isAffiliateUser && (
          <>
            <GlassCard className="p-8 text-center mb-6">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Package className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-medium">Start Promoting Products</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Browse products from PAU businesses and start earning commissions by promoting them.
                </p>
                <Link to="/affiliate/browse-products">
                  <Button variant="primary" className="mt-4">
                    Browse Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </GlassCard>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </Button>
                </Link>
              </GlassCard>
              
              <GlassCard className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Performance</h3>
                </div>
                <p className="text-muted-foreground">
                  Track the performance of your referral links and commissions earned.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Clicks</div>
                    <div className="text-xl font-bold">0</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Conversions</div>
                    <div className="text-xl font-bold">0</div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
