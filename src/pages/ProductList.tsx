
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Filter, ArrowUpDown, PenSquare, Trash, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/ui/custom/GlassCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NairaIcon from '@/components/ui/icons/NairaIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Product = {
  readonly id: string;
  readonly business_id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly commission_rate: number;
  readonly image_url: string | null;
  readonly created_at: string;
};

const ProductList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect non-business users back to their dashboard
  React.useEffect(() => {
    if (user?.role === 'affiliate') {
      navigate('/dashboard');
    }
  }, [user?.role, navigate]);

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['business-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && user.role === 'business'
  });

  const handleDeleteProduct = async (productId: string) => {
    setIsDeleting(true);
    console.log('Starting delete process for product:', productId);

    try {
      // Step 1: Get all sale IDs for this product first
      console.log('Step 1: Getting sale IDs for product');
      const { data: salesData, error: salesQueryError } = await supabase
        .from('sales')
        .select('id')
        .eq('product_id', productId);
      
      if (salesQueryError) {
        console.error('Error getting sales:', salesQueryError);
        throw new Error(`Failed to get sales: ${salesQueryError.message}`);
      }
      
      const saleIds = salesData?.map(sale => sale.id) || [];
      console.log('Found sale IDs:', saleIds);

      // Step 2: Delete payment transactions for these sales
      if (saleIds.length > 0) {
        console.log('Step 2: Deleting payment transactions');
        const { error: paymentError } = await supabase
          .from('payment_transactions')
          .delete()
          .in('sale_id', saleIds);
        
        if (paymentError) {
          console.error('Error deleting payment transactions:', paymentError);
          throw new Error(`Failed to delete payment transactions: ${paymentError.message}`);
        }
        console.log('Payment transactions deleted successfully');

        // Step 3: Delete wallet transactions
        console.log('Step 3: Deleting wallet transactions');
        const { error: walletTransactionsError } = await supabase
          .from('wallet_transactions')
          .delete()
          .in('sale_id', saleIds);
        
        if (walletTransactionsError) {
          console.error('Error deleting wallet transactions:', walletTransactionsError);
          throw new Error(`Failed to delete wallet transactions: ${walletTransactionsError.message}`);
        }
        console.log('Wallet transactions deleted successfully');

        // Step 4: Delete affiliate earnings
        console.log('Step 4: Deleting affiliate earnings');
        const { error: affiliateEarningsError } = await supabase
          .from('affiliate_earnings')
          .delete()
          .in('sale_id', saleIds);
        
        if (affiliateEarningsError) {
          console.error('Error deleting affiliate earnings:', affiliateEarningsError);
          throw new Error(`Failed to delete affiliate earnings: ${affiliateEarningsError.message}`);
        }
        console.log('Affiliate earnings deleted successfully');
      }

      // Step 5: Delete sales
      console.log('Step 5: Deleting sales');
      const { error: salesError } = await supabase
        .from('sales')
        .delete()
        .eq('product_id', productId);
      
      if (salesError) {
        console.error('Error deleting sales:', salesError);
        throw new Error(`Failed to delete sales: ${salesError.message}`);
      }
      console.log('Sales deleted successfully');

      // Step 6: Delete referral links
      console.log('Step 6: Deleting referral links');
      const { error: referralLinksError } = await supabase
        .from('referral_links')
        .delete()
        .eq('product_id', productId);
      
      if (referralLinksError) {
        console.error('Error deleting referral links:', referralLinksError);
        throw new Error(`Failed to delete referral links: ${referralLinksError.message}`);
      }
      console.log('Referral links deleted successfully');

      // Step 7: Finally, delete the product
      console.log('Step 7: Deleting product');
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('business_id', user?.id);
      
      if (productError) {
        console.error('Error deleting product:', productError);
        throw new Error(`Failed to delete product: ${productError.message}`);
      }
      
      console.log('Product deleted successfully');
      
      toast({
        title: "Success!",
        description: "Product and all related data deleted successfully",
        variant: "default",
      });
      
      refetch();
      setProductToDelete(null);
    } catch (err: any) {
      console.error('Delete operation failed:', err);
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete the product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/50">
        <header className="glass shadow-sm px-4 py-3 sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-semibold tracking-tight">
              <span className="text-primary">PAU</span>Affiliate
            </Link>
          </div>
        </header>
        
        <main className="container mx-auto py-8 px-4">
          <GlassCard className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view products</p>
            <Link to="/login">
              <Button>Sign In</Button>
            </Link>
          </GlassCard>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/50">
        <header className="glass shadow-sm px-4 py-3 sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-semibold tracking-tight">
              <span className="text-primary">PAU</span>Affiliate
            </Link>
          </div>
        </header>
        
        <main className="container mx-auto py-8 px-4">
          <GlassCard className="p-6">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </GlassCard>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary/50">
        <header className="glass shadow-sm px-4 py-3 sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-semibold tracking-tight">
              <span className="text-primary">PAU</span>Affiliate
            </Link>
          </div>
        </header>
        
        <main className="container mx-auto py-8 px-4">
          <GlassCard className="p-6 text-center">
            <p className="text-destructive mb-4">Failed to load products</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </GlassCard>
        </main>
      </div>
    );
  }

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price-asc') {
        return a.price - b.price;
      } else if (sortBy === 'price-desc') {
        return b.price - a.price;
      } else if (sortBy === 'commission') {
        return b.commission_rate - a.commission_rate;
      }
      return 0;
    });

  return (
    <>
      <div className="min-h-screen bg-secondary/50">
        <header className="glass shadow-sm px-4 py-3 sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-semibold tracking-tight">
              <span className="text-primary">PAU</span>Affiliate
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm">
                {user.email}
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link to="/dashboard" className="inline-flex items-center text-sm mb-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-medium tracking-tight">Your Products</h1>
            </div>
            <Link to="/products/create">
              <Button variant="primary">
                Add New Product
              </Button>
            </Link>
          </div>

          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Input
              type="search"
              placeholder="Search products..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 md:w-44">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                <SelectItem value="commission">Commission (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredProducts.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Try adjusting your search"
                  : "You haven't created any products yet"}
              </p>
              <Link to="/products/create">
                <Button variant="primary">
                  Create Your First Product
                </Button>
              </Link>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <GlassCard
                  key={product.id}
                  className="p-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-md" />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <NairaIcon className="h-3 w-3 mr-1" />
                            <span>{product.price.toFixed(2)}</span>
                          </div>
                          <span>•</span>
                          <span>{product.commission_rate}% commission</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link to={`/products/${product.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <PenSquare className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setProductToDelete(product.id)}
                        disabled={isDeleting}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                      <Link to={`/products/${product.id}`}>
                        <Button variant="primary" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {product.description || "No description provided."}
                  </p>
                </GlassCard>
              ))}
            </div>
          )}
        </main>
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This will permanently delete the product and all related data including sales, transactions, and referral links. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productToDelete && handleDeleteProduct(productToDelete)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductList;
