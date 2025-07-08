
import { supabase } from '@/integrations/supabase/client';

interface CreateSaleParams {
  productId: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
  deliveryAddress?: string;
}

export const createPendingSale = async ({ productId, amount, customerEmail, customerName, deliveryAddress }: CreateSaleParams) => {
  console.log('Creating pending sale for product:', productId);
  
  try {
    // Get referral information from localStorage
    const referralCode = localStorage.getItem('referral_code');
    const referralLinkId = localStorage.getItem('referral_link_id');
    const affiliateId = localStorage.getItem('affiliate_id');
    
    console.log('Referral info:', { referralCode, referralLinkId, affiliateId });

    if (!referralLinkId) {
      throw new Error('No referral link found. Please use a valid referral link.');
    }

    // Get product details to calculate commission
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('commission_rate, business_id')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      throw new Error('Product not found or no longer available.');
    }

    // Calculate commission
    const commissionRate = product.commission_rate / 100;
    const commissionAmount = amount * commissionRate;

    console.log('Financial breakdown:', {
      amount,
      commissionRate,
      commissionAmount
    });

    // Generate unique transaction reference
    const txRef = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending sale record with proper data types
    const saleData = {
      product_id: productId,
      amount: Number(amount),
      commission_amount: Number(commissionAmount),
      status: 'pending',
      customer_email: customerEmail || null,
      referral_link_id: referralLinkId,
      transaction_reference: txRef
    };

    console.log('Attempting to insert sale data:', saleData);

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (saleError) {
      console.error('Detailed sale error:', saleError);
      throw new Error(`Database error: ${saleError.message}`);
    }

    console.log('Pending sale created successfully:', sale);

    // Create pending payment transaction record
    try {
      const transactionData = {
        sale_id: sale.id,
        transaction_reference: txRef,
        amount: Number(amount),
        currency: 'NGN',
        customer_email: customerEmail || '',
        customer_name: customerName || '',
        status: 'pending'
      };

      console.log('Creating payment transaction:', transactionData);

      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert(transactionData);

      if (transactionError) {
        console.error('Error creating payment transaction:', transactionError);
      }
    } catch (error) {
      console.error('Failed to create payment transaction record:', error);
      // Don't fail the sale creation for this
    }

    return {
      sale,
      txRef,
      financials: {
        amount: Number(amount),
        commissionAmount: Number(commissionAmount)
      }
    };

  } catch (error) {
    console.error('Error in createPendingSale:', error);
    throw error;
  }
};
