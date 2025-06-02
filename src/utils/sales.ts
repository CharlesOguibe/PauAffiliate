
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { toast } from 'sonner';

type SaleResult = {
  saleId: string;
  productId: string;
  affiliateId: string | null;
  businessId: string;
  amount: number;
  commissionAmount: number;
  platformFee: number;
  businessRevenue: number;
  timestamp: string;
};

export const PLATFORM_FEE_PERCENTAGE = 10; // 10% platform fee

export const recordSale = async (product: Product, customerEmail?: string): Promise<SaleResult | null> => {
  try {
    console.log('Recording sale for product:', product.id);
    
    // Get business ID for the product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('business_id')
      .eq('id', product.id)
      .single();
    
    if (productError) {
      console.error('Error fetching product business_id:', productError);
      throw productError;
    }

    const referralCode = localStorage.getItem('referral_code');
    console.log('Referral code from localStorage:', referralCode);
    
    // If no referral code, record as direct sale
    if (!referralCode) {
      console.log('Recording direct sale (no referral)');
      
      // Create a system referral link for direct sales if it doesn't exist
      let systemReferralId = '00000000-0000-0000-0000-000000000001';
      
      const { data: sale, error } = await supabase
        .from('sales')
        .insert({
          product_id: product.id,
          referral_link_id: systemReferralId,
          amount: product.price,
          commission_amount: 0,
          status: 'completed',
          customer_email: customerEmail
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording direct sale:', error);
        throw error;
      }
      
      const platformFee = (product.price * PLATFORM_FEE_PERCENTAGE) / 100;
      const businessRevenue = product.price - platformFee;
      
      return {
        saleId: sale.id,
        productId: product.id,
        affiliateId: null,
        businessId: productData.business_id,
        amount: product.price,
        commissionAmount: 0,
        platformFee,
        businessRevenue,
        timestamp: sale.created_at
      };
    }

    // Handle referral sale
    console.log('Processing referral sale');
    
    const { data: referralLink, error: referralError } = await supabase
      .from('referral_links')
      .select('id, affiliate_id')
      .eq('code', referralCode)
      .maybeSingle();

    if (referralError || !referralLink) {
      console.error('Error finding referral or referral not found:', referralError);
      toast.error('Invalid referral code - processing as direct sale');
      localStorage.removeItem('referral_code');
      
      // Fall back to direct sale
      return recordSale(product, customerEmail);
    }

    // Calculate commission and fees
    const commissionAmount = (product.price * (product.commissionRate || 0)) / 100;
    const platformFee = ((product.price - commissionAmount) * PLATFORM_FEE_PERCENTAGE) / 100;
    const businessRevenue = product.price - commissionAmount - platformFee;

    console.log('Sale calculations:', {
      amount: product.price,
      commissionAmount,
      platformFee,
      businessRevenue
    });

    // Record the sale
    const { data: sale, error } = await supabase
      .from('sales')
      .insert({
        product_id: product.id,
        referral_link_id: referralLink.id,
        amount: product.price,
        commission_amount: commissionAmount,
        status: 'completed',
        customer_email: customerEmail
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording referral sale:', error);
      throw error;
    }

    // Clear referral code after successful sale
    localStorage.removeItem('referral_code');
    console.log('Sale recorded successfully:', sale.id);

    return {
      saleId: sale.id,
      productId: product.id,
      affiliateId: referralLink.affiliate_id,
      businessId: productData.business_id,
      amount: product.price,
      commissionAmount,
      platformFee,
      businessRevenue,
      timestamp: sale.created_at
    };

  } catch (error) {
    console.error('Error recording sale:', error);
    toast.error('Failed to process the sale');
    throw error;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};
