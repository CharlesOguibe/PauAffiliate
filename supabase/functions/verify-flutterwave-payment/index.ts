
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transaction_id, tx_ref } = await req.json()

    if (!transaction_id || !tx_ref) {
      return new Response(
        JSON.stringify({ error: 'Missing transaction_id or tx_ref' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Flutterwave secret key from environment
    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY')
    if (!flutterwaveSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Flutterwave secret key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify payment with Flutterwave
    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${flutterwaveSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const verifyData = await verifyResponse.json()

    if (!verifyResponse.ok || verifyData.status !== 'success') {
      return new Response(
        JSON.stringify({ error: 'Payment verification failed', details: verifyData }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const paymentData = verifyData.data

    // Check if payment was successful
    if (paymentData.status !== 'successful') {
      return new Response(
        JSON.stringify({ error: 'Payment was not successful', status: paymentData.status }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, find the existing pending sale using the transaction reference
    const { data: existingSale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        products (
          business_id,
          commission_rate,
          name
        ),
        referral_links (
          affiliate_id
        )
      `)
      .eq('transaction_reference', tx_ref)
      .eq('status', 'pending')
      .single()

    if (saleError || !existingSale) {
      console.error('Error finding pending sale:', saleError)
      return new Response(
        JSON.stringify({ error: 'Pending sale not found for this transaction' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Found pending sale:', existingSale)

    // Update the sale to completed
    const { error: updateSaleError } = await supabase
      .from('sales')
      .update({
        status: 'completed'
      })
      .eq('id', existingSale.id)

    if (updateSaleError) {
      console.error('Error updating sale status:', updateSaleError)
      return new Response(
        JSON.stringify({ error: 'Failed to update sale status' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Sale updated to completed:', existingSale.id)

    // Update or create payment transaction record
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .upsert({
        transaction_reference: tx_ref,
        flutterwave_transaction_id: transaction_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        customer_email: paymentData.customer.email,
        customer_name: paymentData.customer.name,
        status: 'completed',
        payment_method: paymentData.payment_type,
        sale_id: existingSale.id
      }, {
        onConflict: 'transaction_reference'
      })

    if (transactionError) {
      console.error('Error updating payment transaction:', transactionError)
    }

    // Calculate financial breakdown
    const totalAmount = existingSale.amount
    const commissionAmount = existingSale.commission_amount
    const platformFeeRate = 0.05 // 5% platform fee
    const platformFee = totalAmount * platformFeeRate
    const businessRevenue = totalAmount - commissionAmount - platformFee

    console.log('Financial breakdown:', {
      totalAmount,
      commissionAmount,
      platformFee,
      businessRevenue
    })

    // Add commission to affiliate wallet
    if (existingSale.referral_links?.affiliate_id && commissionAmount > 0) {
      try {
        const { error: affiliateWalletError } = await supabase.rpc('add_to_wallet', {
          user_id: existingSale.referral_links.affiliate_id,
          amount: commissionAmount,
          sale_id: existingSale.id,
          transaction_type: 'commission',
          description: `Commission from sale of ${existingSale.products?.name || 'product'}`
        })

        if (affiliateWalletError) {
          console.error('Error adding commission to affiliate wallet:', affiliateWalletError)
        } else {
          console.log('Commission added to affiliate wallet successfully')
        }
      } catch (error) {
        console.error('Error calling add_to_wallet for affiliate:', error)
      }
    }

    // Add business revenue to business owner wallet
    if (existingSale.products?.business_id && businessRevenue > 0) {
      try {
        const { error: businessWalletError } = await supabase.rpc('add_to_wallet', {
          user_id: existingSale.products.business_id,
          amount: businessRevenue,
          sale_id: existingSale.id,
          transaction_type: 'business_revenue',
          description: `Revenue from sale of ${existingSale.products?.name || 'product'}`
        })

        if (businessWalletError) {
          console.error('Error adding revenue to business wallet:', businessWalletError)
        } else {
          console.log('Revenue added to business wallet successfully')
        }
      } catch (error) {
        console.error('Error calling add_to_wallet for business:', error)
      }
    }

    // Update referral link conversions
    if (existingSale.referral_link_id) {
      try {
        const { data: currentLink, error: fetchError } = await supabase
          .from('referral_links')
          .select('conversions')
          .eq('id', existingSale.referral_link_id)
          .single()

        if (!fetchError && currentLink) {
          const { error: conversionError } = await supabase
            .from('referral_links')
            .update({ 
              conversions: (currentLink.conversions || 0) + 1
            })
            .eq('id', existingSale.referral_link_id)

          if (conversionError) {
            console.error('Error updating conversion count:', conversionError)
          } else {
            console.log('Referral link conversions updated')
          }
        }
      } catch (error) {
        console.error('Error updating referral link conversions:', error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sale_id: existingSale.id,
        payment_data: paymentData,
        financial_breakdown: {
          totalAmount,
          commissionAmount,
          platformFee,
          businessRevenue
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in verify-flutterwave-payment:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
