import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Copy, CheckCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import NairaIcon from '@/components/ui/icons/NairaIcon';

const AffiliateBrowseProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['affiliate-products'],
    queryFn: async () => {
      console.log('=== FETCHING PRODUCTS FOR AFFILIATE ===');
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          business_profiles!fk_products_business!inner(name, verified)
        `)
        .eq('business_profiles.verified', true);

      console.log('Products query result:', data, error);
      if (error) throw error;
      return data;
    },
  });

  const { data: userReferralLinks, refetch: refetchReferralLinks } = useQuery({
    queryKey: ['user-referral-links', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('=== FETCHING USER REFERRAL LINKS ===');
      const { data, error } = await supabase
        .from('referral_links')
        .select('*')
        .eq('affiliate_id', user.id);

      console.log('User referral links query result:', data, error);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createReferralLink = async (productId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create referral links",
        variant: "destructive",
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, [productId]: true }));

    try {
      console.log('=== CREATING REFERRAL LINK ===');
      console.log('Product ID:', productId);
      console.log('User ID:', user.id);
      console.log('User role:', user.role);

      // Generate a random code
      const code = Math.random().toString(36).substring(2, 10);
      console.log('Generated code:', code);

      const { data, error } = await supabase
        .from('referral_links')
        .insert({
          product_id: productId,
          affiliate_id: user.id,
          code: code,
        })
        .select()
        .single();

      console.log('Insert result:', data, error);

      if (error) {
        console.error('Error creating referral link:', error);
        throw error;
      }

      console.log('Successfully created referral link:', data);

      toast({
        title: "Success!",
        description: "Referral link created successfully",
      });

      // Refetch both products and referral links
      refetch();
      refetchReferralLinks();

      // Verify the link was created by checking the database
      const { data: verification, error: verifyError } = await supabase
        .from('referral_links')
        .select('*')
        .eq('id', data.id)
        .single();

      console.log('Verification check:', verification, verifyError);

    } catch (error) {
      console.error('Error in createReferralLink:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create referral link",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [productId]: false }));
    }
  };

  const copyToClipboard = (code: string, id: string) => {
    const referralLink = `${window.location.origin}/ref/${code}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopiedLinkId(id);
      toast({
        title: "Success!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopiedLinkId(null), 2000);
    });
  };

  const hasReferralLink = (productId: string) => {
    const hasLink = userReferralLinks?.some(link => link.product_id === productId);
    console.log(`Product ${productId} has referral link:`, hasLink);
    return hasLink;
  };

  const getReferralLink = (productId: string) => {
    const link = userReferralLinks?.find(link => link.product_id === productId);
    console.log(`Referral link for product ${productId}:`, link);
    return link;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/50">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm mb-4 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Browse Products</h1>
          <p className="text-muted-foreground mt-2">
            Create referral links for verified business products
          </p>
        </div>

        {/* Debug Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Debug Info:</strong> Found {products?.length || 0} verified products. 
            User has {userReferralLinks?.length || 0} existing referral links.
            Check browser console for detailed logs.
          </p>
        </div>

        {!products || products.length === 0 ? (
          <GlassCard className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">No Products Available</h3>
            <p className="text-muted-foreground">
              There are no verified products available for promotion at the moment.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const hasLink = hasReferralLink(product.id);
              const referralLink = getReferralLink(product.id);
              const isLoading = loadingStates[product.id] || false;

              return (
                <GlassCard key={product.id} className="overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {product.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <div className="flex items-center">
                          <NairaIcon className="h-4 w-4 mr-1" />
                          <span className="font-semibold">₦{product.price.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Commission</span>
                        <span className="font-semibold text-green-600">
                          {product.commission_rate}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">You Earn</span>
                        <div className="flex items-center text-green-600 font-semibold">
                          <NairaIcon className="h-4 w-4 mr-1" />
                          <span>₦{(product.price * product.commission_rate / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      {hasLink ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs flex-1 truncate">
                              {`${window.location.origin}/ref/${referralLink?.code}`}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => referralLink && copyToClipboard(referralLink.code, referralLink.id)}
                            >
                              {copiedLinkId === referralLink?.id ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-green-600">✓ Referral link created</p>
                        </div>
                      ) : (
                        <Button
                          onClick={() => createReferralLink(product.id)}
                          isLoading={isLoading}
                          loadingText="Creating..."
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Referral Link
                        </Button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliateBrowseProducts;
