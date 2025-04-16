
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
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
        variant: "default",
      });
      
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
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
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
  );
};

export default ProductList;
