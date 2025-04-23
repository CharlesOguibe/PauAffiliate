
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
    const referralCode = localStorage.getItem('referral_code');
    
    // Get business ID for the product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('business_id')
      .eq('id', product.id)
      .single();
    
    if (productError) throw productError;
    
    // If no referral code, it's a direct sale without referral commission
    if (!referralCode) {
      // For direct sales, simply record it without referral info
      const { data: sale, error } = await supabase
        .from('sales')
        .insert({
          product_id: product.id,
          // We need a referral link ID for the schema, but we can use a placeholder
          // or create a system referral link for direct sales
          referral_link_id: '00000000-0000-0000-0000-000000000000', // Use your system referral ID
          amount: product.price,
          commission_amount: 0, // No commission for direct sales
          status: 'completed',
          customer_email: customerEmail
        })
        .select()
        .single();

      if (error) throw error;
      
      // Calculate platform fee and business revenue
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

    // Get referral link details
    const { data: referralLink, error: referralError } = await supabase
      .from('referral_links')
      .select('id, affiliate_id')
      .eq('code', referralCode)
      .single();

    if (referralError) {
      console.error('Error finding referral:', referralError);
      toast.error('Invalid referral code');
      localStorage.removeItem('referral_code');
      return null;
    }

    // Calculate commission amount
    const commissionAmount = (product.price * product.commissionRate) / 100;
    
    // Calculate platform fee - applied after commission
    const platformFee = ((product.price - commissionAmount) * PLATFORM_FEE_PERCENTAGE) / 100;
    
    // Calculate business revenue
    const businessRevenue = product.price - commissionAmount - platformFee;

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

    if (error) throw error;

    // Clear the referral code from localStorage after successful sale
    localStorage.removeItem('referral_code');

    // Return the complete sale information
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

// Helper function to format currency values
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};
