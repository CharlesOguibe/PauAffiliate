
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

    // Update or create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
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
      }, {
        onConflict: 'transaction_reference'
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating payment transaction:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to record payment transaction' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get sale information from transaction reference
    const saleId = tx_ref.split('_')[1] // Assuming format: sale_{saleId}
    
    if (saleId) {
      // Update the sale record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .update({
          status: 'completed',
          transaction_reference: tx_ref
        })
        .eq('id', saleId)
        .select(`
          *,
          products (
            business_id,
            commission_rate
          ),
          referral_links (
            affiliate_id
          )
        `)
        .single()

      if (saleError || !sale) {
        console.error('Error updating sale:', saleError)
      } else {
        console.log('Sale updated successfully:', sale)
        
        // Calculate amounts
        const totalAmount = sale.amount
        const commissionAmount = sale.commission_amount
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
        if (sale.referral_links?.affiliate_id && commissionAmount > 0) {
          try {
            const { error: affiliateWalletError } = await supabase.rpc('add_to_wallet', {
              user_id: sale.referral_links.affiliate_id,
              amount: commissionAmount,
              sale_id: sale.id,
              transaction_type: 'commission',
              description: `Commission from sale #${sale.id}`
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
        if (sale.products?.business_id && businessRevenue > 0) {
          try {
            const { error: businessWalletError } = await supabase.rpc('add_to_wallet', {
              user_id: sale.products.business_id,
              amount: businessRevenue,
              sale_id: sale.id,
              transaction_type: 'business_revenue',
              description: `Revenue from sale #${sale.id}`
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
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction,
        payment_data: paymentData
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
