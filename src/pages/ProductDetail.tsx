import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Tag, Users, PenSquare, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import NairaIcon from '@/components/ui/icons/NairaIcon';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform the data to match our Product type
      return {
        id: data.id,
        businessId: data.business_id,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.image_url || undefined,
        commissionRate: data.commission_rate,
        affiliates: []
      } as Product;
    },
  });

  const handleDeleteProduct = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
        variant: "default",
      });
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/50 py-8">
        <div className="container mx-auto px-4">
          <GlassCard className="p-6 text-center">
            <div className="animate-pulse">Loading product details...</div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-secondary/50 py-8">
        <div className="container mx-auto px-4">
          <GlassCard className="p-6 text-center text-destructive">
            <p>Error loading product details. The product may not exist.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === product.businessId;

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="container mx-auto py-8 px-4">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <GlassCard>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-medium">{product.name}</h1>
                  <p className="text-muted-foreground mt-1">
                    Product ID: {product.id}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center p-4 bg-background/50 rounded-lg">
  <NairaIcon className="h-5 w-5 text-primary mr-3" />
  <div>
    <p className="text-sm text-muted-foreground">Price</p>
    <p className="text-lg font-medium">₦{product.price.toFixed(2)}</p>
  </div>
</div>

                  
                  <div className="flex items-center p-4 bg-background/50 rounded-lg">
                    <Tag className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">Commission Rate</p>
                      <p className="text-lg font-medium">{product.commissionRate}%</p>
                    </div>
                  </div>
                </div>
                
                {isOwner && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-lg font-medium mb-2">Actions</h3>
                    <div className="flex flex-wrap gap-4">
                      <Link to={`/products/${product.id}/edit`}>
                        <Button variant="outline">
                          <PenSquare className="h-4 w-4 mr-2" />
                          Edit Product
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive"
                        onClick={handleDeleteProduct}
                        isLoading={isDeleting}
                        loadingText="Deleting..."
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Product
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
          
          <div>
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Affiliate Info</h3>
                <Users className="h-5 w-5 text-primary" />
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-background/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Potential Commission</p>
                  <p className="text-lg font-medium">
                    ₦{(product.price * (product.commissionRate / 100)).toFixed(2)} per sale
                  </p>
                </div>
                
                {user?.role === 'affiliate' ? (
                  <Button className="w-full">
                    Promote This Product
                  </Button>
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    You are the owner of this product.
                  </div>
                )}
              </div>
            </GlassCard>
            
            {product.imageUrl && (
              <GlassCard className="mt-6">
                <h3 className="text-lg font-medium mb-4">Product Image</h3>
                <div className="relative rounded-md overflow-hidden" style={{ paddingBottom: '100%' }}>
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
