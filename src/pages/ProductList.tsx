import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Filter, ArrowUpDown, Tag } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/ui/custom/GlassCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NairaIcon from '@/components/ui/icons/NairaIcon';
import { useAuth } from '@/contexts/AuthContext';

type Business = {
  readonly id: string;
  readonly name: string;
};

type BaseProduct = {
  readonly id: string;
  readonly business_id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly commission_rate: number;
  readonly image_url: string | null;
  readonly created_at: string;
};

type Product = BaseProduct & {
  readonly business: Business;
};

type QueryResult = {
  products: Product[];
  error: Error | null;
};

async function fetchAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        business_profiles (
          id,
          name
        )
      `) as any; // ✅ Avoids type depth issues

    if (error || !data?.length) return [];

    return data.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      commission_rate: product.commission_rate,
      image_url: product.image_url,
      created_at: product.created_at,
      business_id: product.business_id,
      business: {
        id: product.business_profiles?.id || product.business_id,
        name: product.business_profiles?.name || 'Unknown Business',
      },
    })) as Product[];
  } catch (error) {
    console.error('Unexpected error:', error);
    return [];
  }
}


const ProductList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const { user } = useAuth();

  // Redirect business users back to their dashboard
  const navigate = useNavigate();
  useEffect(() => {
    if (user?.role === 'business') {
      navigate('/dashboard');
      return;
    }
  }, [user?.role, navigate]);

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['all-products'],
    queryFn: fetchAllProducts,
    enabled: !!user && user.role === 'affiliate' // Only fetch if user is an affiliate
  });

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

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.business.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For now, show all products since we don't have type filtering yet
    const matchesCategory = true;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
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
        <div className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight mb-2">Products</h1>
          <p className="text-muted-foreground">
            Browse products to promote as an affiliate.
          </p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Input
            type="search"
            placeholder="Search products..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex flex-col md:flex-row gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-36 md:w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="digital">Digital Products</SelectItem>
                <SelectItem value="physical">Physical Products</SelectItem>
                <SelectItem value="service">Services</SelectItem>
              </SelectContent>
            </Select>
            
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
        </div>

        {filteredProducts.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Products Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || category !== 'all' 
                ? "Try adjusting your search or filters"
                : "No products are available at the moment"}
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <GlassCard
                key={product.id}
                className="p-6 flex flex-col h-full animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-40 bg-muted/50 rounded-md flex items-center justify-center mb-4">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover rounded-md" />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium">{product.name}</h3>
                    <div className="flex items-center bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      <Tag className="h-3 w-3 mr-1" />
                      {product.commission_rate}% commission
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{product.business.name}</p>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center">
                    <NairaIcon className="h-4 w-4 text-primary mr-1" />
                    <p className="font-medium">{product.price.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <Link to={`/products/${product.id}`}>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link to={`/products/${product.id}/promote`}>
                    <Button variant="primary" className="w-full">
                      Promote
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductList;
