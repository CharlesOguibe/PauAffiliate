
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, LogOut, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import NairaIcon from '@/components/ui/icons/NairaIcon';

type Product = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  commission_rate: number;
  image_url: string | null;
  created_at: string;
  business_name?: string;
  is_promoted?: boolean;
  referral_link_id?: string;
};

const AffiliateBrowseProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect business users back to their dashboard
  React.useEffect(() => {
    if (user?.role === 'business') {
      navigate('/dashboard');
    }
  }, [user?.role, navigate]);

  // Fetch all products from all businesses with business names
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['affiliate-products'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First fetch all products with business profiles
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          business_profiles (
            name
          )
        `);
      
      if (productError) throw productError;
      
      // Then fetch existing referral links for this affiliate
      const { data: referralLinks, error: referralError } = await supabase
        .from('referral_links')
        .select('id, product_id')
        .eq('affiliate_id', user.id);
      
      if (referralError) throw referralError;
      
      // Create a map for O(1) lookups
      const referralMap = new Map(referralLinks?.map(link => [link.product_id, link.id]) || []);
      
      // Transform the product data with business name and promotion status
      return (productData || []).map((product: any) => ({
        ...product,
        business_name: product.business_profiles?.name || 'Unknown Business',
        is_promoted: referralMap.has(product.id),
        referral_link_id: referralMap.get(product.id)
      }));
    },
    enabled: !!user && user.role === 'affiliate'
  });

  // Mutation for creating a referral link
  const createReferralLink = useMutation({
    mutationFn: async (productId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Generate unique referral code using our DB function
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_referral_code');
      
      if (codeError) throw codeError;
      
      const code = codeData;
      
      // Insert the referral link
      const { data, error } = await supabase
        .from('referral_links')
        .insert({
          product_id: productId,
          affiliate_id: user.id,
          code
        })
        .select()
        .single();
      
      if (error) {
        // If there's a unique constraint error, the user already has a link
        if (error.code === '23505') {
          toast({
            title: "Already promoted",
            description: "You're already promoting this product",
            variant: "default",
          });
          
          // Fetch existing link
          const { data: existingLink } = await supabase
            .from('referral_links')
            .select('code')
            .eq('product_id', productId)
            .eq('affiliate_id', user.id)
            .single();
          
          return existingLink;
        }
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: `Referral link created: ${window.location.origin}/r/${data.code}`,
        variant: "default",
      });
      // Refetch the products to update the UI
      queryClient.invalidateQueries({ queryKey: ['affiliate-products'] });
    },
    onError: (error) => {
      console.error('Error creating referral link:', error);
      toast({
        title: "Error",
        description: "Failed to create referral link. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting a referral link
  const deleteReferralLink = useMutation({
    mutationFn: async (referralLinkId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('referral_links')
        .delete()
        .eq('id', referralLinkId)
        .eq('affiliate_id', user.id); // Ensure user can only delete their own links
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Referral link deleted successfully",
        variant: "default",
      });
      // Refetch the products to update the UI
      queryClient.invalidateQueries({ queryKey: ['affiliate-products'] });
    },
    onError: (error) => {
      console.error('Error deleting referral link:', error);
      toast({
        title: "Error",
        description: "Failed to delete referral link. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle "Promote" button click
  const handlePromote = (productId: string) => {
    createReferralLink.mutate(productId);
  };

  // Handle "Delete" button click
  const handleDelete = (referralLinkId: string) => {
    deleteReferralLink.mutate(referralLinkId);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <p className="text-muted-foreground mb-4">Please sign in to browse products</p>
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
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center text-sm mb-2 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-medium tracking-tight">Browse Products</h1>
          <p className="text-muted-foreground mt-2">
            Find products to promote and earn commissions
          </p>
        </div>

        <div className="mb-6">
          <Input
            type="search"
            placeholder="Search products or businesses..."
            className="max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "No products match your search. Try different keywords."
                : "There are no products available for promotion yet."}
            </p>
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
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <NairaIcon className="h-3 w-3 mr-1" />
                          <span>{product.price.toFixed(2)}</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <span>{product.commission_rate}% commission</span>
                        <span className="hidden sm:inline">•</span>
                        <span>By {product.business_name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {product.is_promoted ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          Already Promoting
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product.referral_link_id!)}
                          disabled={deleteReferralLink.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePromote(product.id)}
                        disabled={createReferralLink.isPending}
                        isLoading={createReferralLink.isPending}
                      >
                        Promote
                      </Button>
                    )}
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

export default AffiliateBrowseProducts;
