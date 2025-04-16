
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/custom/Button';
import ProductForm from '@/components/products/ProductForm';
import { Product } from '@/types';
import { toast } from '@/hooks/use-toast';

const ProductEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');
      
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

  // Redirect if not the owner
  if (product && user?.id !== product.businessId) {
    toast({
      title: "Access denied",
      description: "You can only edit your own products.",
      variant: "destructive",
    });
    navigate('/dashboard');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/50 py-8">
        <div className="container mx-auto px-4">
          <div className="p-6 text-center">
            <div className="animate-pulse">Loading product details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-secondary/50 py-8">
        <div className="container mx-auto px-4">
          <div className="p-6 text-center text-destructive">
            <p>Error loading product details. The product may not exist.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSuccess = (updatedProduct: Product) => {
    toast({
      title: "Product updated",
      description: "Your product has been successfully updated.",
    });
    navigate(`/products/${updatedProduct.id}`);
  };

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
        
        <div className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight mb-1">Edit Product</h1>
          <p className="text-muted-foreground">
            Update your product information.
          </p>
        </div>

        <div className="glass p-6 rounded-lg shadow-sm max-w-3xl mx-auto">
          <ProductForm 
            initialValues={{
              name: product.name,
              description: product.description,
              price: product.price,
              commissionRate: product.commissionRate,
              imageUrl: product.imageUrl,
            }}
            productId={product.id}
            isEditing={true}
            onSuccess={handleSuccess}
            onCancel={() => navigate(`/products/${product.id}`)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductEdit;
