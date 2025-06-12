
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Plus, PenSquare, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Attempting to delete product:', productId);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('business_id', user?.id); // Ensure user can only delete their own products
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Product deleted successfully');
      
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
        variant: "default",
      });
      
      // Refresh the products list
      refetch();
    } catch (err) {
      console.error('Error deleting product:', err);
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      });
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
                    onClick={() => handleDeleteProduct(product.id)}
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
  );
};

export default ProductList;
