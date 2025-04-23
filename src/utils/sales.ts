
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';

export const recordSale = async (product: Product, customerEmail?: string) => {
  try {
    const referralCode = localStorage.getItem('referral_code');
    
    if (!referralCode) {
      // Direct sale without referral
      return null;
    }

    // Get referral link details
    const { data: referralLink } = await supabase
      .from('referral_links')
      .select('id')
      .eq('code', referralCode)
      .single();

    if (!referralLink) {
      throw new Error('Invalid referral code');
    }

    // Calculate commission amount
    const commissionAmount = (product.price * product.commissionRate) / 100;

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

    return sale;
  } catch (error) {
    console.error('Error recording sale:', error);
    throw error;
  }
};
