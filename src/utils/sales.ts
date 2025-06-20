import { supabase } from '@/integrations/supabase/client';

interface RecordSaleParams {
  productId: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
}

export const createPendingSale = async ({ productId, amount, customerEmail, customerName }: RecordSaleParams) => {
  console.log('Creating pending sale for product:', productId);
  
  try {
    // Get referral information from localStorage
    const referralCode = localStorage.getItem('referral_code');
    const referralLinkId = localStorage.getItem('referral_link_id');
    const affiliateId = localStorage.getItem('affiliate_id');
    
    console.log('Referral info:', { referralCode, referralLinkId, affiliateId });

    if (!referralLinkId) {
      throw new Error('No referral link found');
    }

    // Get product details to calculate commission
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('commission_rate, business_id')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      throw new Error('Product not found');
    }

    // Calculate commission
    const commissionRate = product.commission_rate / 100;
    const commissionAmount = amount * commissionRate;

    console.log('Financial breakdown:', {
      amount,
      commissionAmount
    });

    // Generate transaction reference first
    const txRef = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending sale record with transaction reference
    const saleData = {
      product_id: productId,
      amount: amount,
      commission_amount: commissionAmount,
      status: 'pending',
      customer_email: customerEmail || null,
      referral_link_id: referralLinkId,
      transaction_reference: txRef
    };

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (saleError) {
      console.error('Error creating pending sale:', saleError);
      throw new Error('Failed to create sale record');
    }

    console.log('Pending sale created successfully:', sale);

    // Create pending payment transaction
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        sale_id: sale.id,
        transaction_reference: txRef,
        amount: amount,
        currency: 'NGN',
        customer_email: customerEmail || '',
        customer_name: customerName || '',
        status: 'pending'
      });

    if (transactionError) {
      console.error('Error creating payment transaction:', transactionError);
      // Don't fail the sale creation for this
    }

    return {
      sale,
      txRef,
      financials: {
        amount,
        commissionAmount
      }
    };

  } catch (error) {
    console.error('Error in createPendingSale:', error);
    throw error;
  }
};

export const recordSale = async ({ productId, amount, customerEmail }: RecordSaleParams) => {
  console.log('Recording sale for product:', productId);
  
  try {
    // Get referral information from localStorage
    const referralCode = localStorage.getItem('referral_code');
    const referralLinkId = localStorage.getItem('referral_link_id');
    const affiliateId = localStorage.getItem('affiliate_id');
    
    console.log('Referral info:', { referralCode, referralLinkId, affiliateId });

    // Get product details to calculate commission
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('commission_rate, business_id')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      throw new Error('Product not found');
    }

    // Calculate financial details
    const commissionRate = product.commission_rate / 100;
    const commissionAmount = amount * commissionRate;
    const platformFeeRate = 0.05; // 5% platform fee
    const platformFee = amount * platformFeeRate;
    const businessRevenue = amount - commissionAmount - platformFee;

    console.log('Financial breakdown:', {
      amount,
      commissionAmount,
      platformFee,
      businessRevenue
    });

    // Record the sale
    const saleData = {
      product_id: productId,
      amount: amount,
      commission_amount: commissionAmount,
      status: 'completed',
      customer_email: customerEmail || null,
      referral_link_id: referralLinkId || null
    };

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (saleError) {
      console.error('Error recording sale:', saleError);
      throw new Error('Failed to record sale');
    }

    console.log('Sale recorded successfully:', sale);

    // If this is a referral sale, update the referral link conversions
    if (referralLinkId) {
      // Get current conversions count
      const { data: currentLink, error: fetchError } = await supabase
        .from('referral_links')
        .select('conversions')
        .eq('id', referralLinkId)
        .single();

      if (!fetchError && currentLink) {
        // Update conversions count
        const { error: conversionError } = await supabase
          .from('referral_links')
          .update({ 
            conversions: (currentLink.conversions || 0) + 1
          })
          .eq('id', referralLinkId);

        if (conversionError) {
          console.error('Error updating conversion count:', conversionError);
          // Don't fail the sale for this
        }
      }
    }

    return {
      sale,
      financials: {
        amount,
        commissionAmount,
        platformFee,
        businessRevenue
      }
    };

  } catch (error) {
    console.error('Error in recordSale:', error);
    throw error;
  }
};
