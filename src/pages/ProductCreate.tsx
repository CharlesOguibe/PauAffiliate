import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '@/components/products/ProductForm';
import { useAuth } from '@/contexts/AuthContext';

const ProductCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect non-business users
  if (user?.role !== 'business') {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight mb-1">Create New Product</h1>
          <p className="text-muted-foreground">
            Add a new product that affiliates can promote for your business.
          </p>
        </div>

        <div className="glass p-6 rounded-lg shadow-sm max-w-3xl mx-auto">
          <ProductForm 
            onCancel={() => navigate('/dashboard')}
            onSuccess={() => {
              // The form component will handle the toast and redirect
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCreate;
