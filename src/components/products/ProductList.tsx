
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Plus, PenSquare, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { Product } from '@/types';
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

const fetchProducts = async () => {
  const { data: user } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', user.user?.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Transform the data to match our Product type
  return (data || []).map((product): Product => ({
    id: product.id,
    businessId: product.business_id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.image_url || undefined,
    commissionRate: product.commission_rate,
    affiliates: []
  }));
};

interface ProductListProps {
  limit?: number;
}

const ProductList: React.FC<ProductListProps> = ({ limit }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
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

  if (isLoading) {
    return (
      <GlassCard className="p-6 text-center">
        <div className="animate-pulse">Loading products...</div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6 text-center text-destructive">
        Error loading products. Please try again.
      </GlassCard>
    );
  }

  if (!products || products.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-medium">No Products Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven't added any products yet. Start by creating your first product to attract affiliates.
          </p>
          <Link to="/products/create">
            <Button variant="primary" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          </Link>
        </div>
      </GlassCard>
    );
  }

  const displayProducts = limit ? products.slice(0, limit) : products;
  const isBusinessOwner = user?.role === 'business';

  return (
    <>
      <GlassCard>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Your Products</h3>
          {isBusinessOwner && (
            <Link to="/products/create">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
            </Link>
          )}
        </div>
        
        <div className="space-y-4">
          {displayProducts.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4 border border-border rounded-md hover:bg-accent/5 transition-colors">
              <div className="flex items-center flex-1 space-x-6">
                <div className="w-14 h-14 bg-muted rounded-md flex items-center justify-center">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <Package className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">{product.name}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>₦{product.price.toFixed(2)}</span>
                    <span className="mx-2">|</span>
                    <span>{product.commissionRate}% commission</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isBusinessOwner && (
                  <div className="flex gap-2 mr-2">
                    <Link to={`/products/${product.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <PenSquare className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setProductToDelete(product.id)}
                      disabled={isDeleting}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Link to={`/products/${product.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs h-8">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {limit && products.length > limit && (
            <Link to="/products">
              <Button variant="outline" size="sm" className="w-full mt-2">
                View All Products ({products.length})
              </Button>
            </Link>
          )}
        </div>
      </GlassCard>

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
