
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Package, Tag, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import NairaIcon from '@/components/ui/icons/NairaIcon';
import { recordSale } from '@/utils/sales';
import { useToast } from '@/hooks/use-toast';

const ReferralRedirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const { data: referralData, isLoading, error } = useQuery({
    queryKey: ['referral', code],
    queryFn: async () => {
      console.log('Processing referral code:', code);
      
      if (!code) {
        throw new Error('No referral code provided');
      }

      // Get referral link with product details
      const { data: referralLink, error: referralError } = await supabase
        .from('referral_links')
        .select(`
          id,
          code,
          clicks,
          affiliate_id,
          product_id,
          products (
            id,
            name,
            description,
            price,
            commission_rate,
            image_url,
            business_id
          )
        `)
        .eq('code', code)
        .single();

      if (referralError) {
        console.error('Database error:', referralError);
        throw new Error('Error checking referral link');
      }

      if (!referralLink) {
        console.log('Referral link not found for code:', code);
        throw new Error('Invalid referral code');
      }

      console.log('Found referral link:', referralLink);

      // Update click count
      const { error: updateError } = await supabase
        .from('referral_links')
        .update({ clicks: (referralLink.clicks || 0) + 1 })
        .eq('code', code);

      if (updateError) {
        console.error('Error updating clicks:', updateError);
        // Don't fail for this
      }

      // Store referral info in localStorage
      localStorage.setItem('referral_code', code);
      localStorage.setItem('referral_link_id', referralLink.id);
      localStorage.setItem('affiliate_id', referralLink.affiliate_id);
      
      return referralLink;
    },
    enabled: !!code
  });

  const handlePurchase = async () => {
    if (!referralData?.products) return;
    
    setIsPurchasing(true);
    try {
      const customerEmail = prompt('Please enter your email for the purchase:');
      if (!customerEmail) {
        setIsPurchasing(false);
        return;
      }

      await recordSale({
        productId: referralData.products.id,
        amount: referralData.products.price,
        customerEmail
      });

      toast({
        title: "Purchase Successful!",
        description: "Your purchase has been completed successfully.",
        variant: "default",
      });

      // Clear referral data after successful purchase
      localStorage.removeItem('referral_code');
      localStorage.removeItem('referral_link_id');
      localStorage.removeItem('affiliate_id');

      // Redirect to a success page or homepage
      navigate('/');
      
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-4 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !referralData?.products) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Referral Error</h1>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Product not found for this referral code'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const product = referralData.products;
  const commissionAmount = (product.price * (product.commission_rate / 100));

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Users className="h-4 w-4 mr-2" />
              Referred Product
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Special Offer for You!</h1>
            <p className="text-gray-600 mt-2">You've been referred to this amazing product</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div>
              {product.image_url ? (
                <GlassCard className="overflow-hidden">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-96 object-cover"
                  />
                </GlassCard>
              ) : (
                <GlassCard className="h-96 flex items-center justify-center bg-gray-100">
                  <Package className="h-24 w-24 text-gray-400" />
                </GlassCard>
              )}
            </div>

            {/* Product Details */}
            <div>
              <GlassCard>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                  <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center p-4 bg-background/50 rounded-lg">
                    <NairaIcon className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-2xl font-bold">₦{product.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <Tag className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-green-600">Commission Rate</p>
                      <p className="text-lg font-medium text-green-700">{product.commission_rate}%</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 mb-1">Affiliate Earnings from this sale</p>
                    <p className="text-lg font-bold text-blue-700">₦{commissionAmount.toFixed(2)}</p>
                  </div>
                </div>

                <Button 
                  onClick={handlePurchase}
                  isLoading={isPurchasing}
                  loadingText="Processing..."
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Purchase Now - ₦{product.price.toFixed(2)}
                </Button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Referral Code: <span className="font-mono font-bold">{code}</span>
                </p>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralRedirect;
