
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { WithdrawalRequestEmail } from './_templates/withdrawal-request.tsx'
import { SaleNotificationEmail } from './_templates/sale-notification.tsx'
import { GeneralNotificationEmail } from './_templates/general-notification.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationEmailRequest {
  type: 'withdrawal_request' | 'sale_notification' | 'general'
  userEmail: string
  userName: string
  data: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type, userEmail, userName, data }: NotificationEmailRequest = await req.json()

    console.log('Sending email notification:', { type, userEmail, userName })

    let emailHtml: string
    let subject: string

    switch (type) {
      case 'withdrawal_request':
        emailHtml = await renderAsync(
          React.createElement(WithdrawalRequestEmail, {
            userName,
            amount: data.amount,
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            accountName: data.accountName,
          })
        )
        subject = 'Withdrawal Request Submitted - PAUAffiliate'
        break

      case 'sale_notification':
        emailHtml = await renderAsync(
          React.createElement(SaleNotificationEmail, {
            userName,
            productName: data.productName,
            commissionAmount: data.commissionAmount,
            customerEmail: data.customerEmail,
          })
        )
        subject = `🎉 New Sale! You earned ₦${data.commissionAmount.toFixed(2)} - PAUAffiliate`
        break

      case 'general':
        emailHtml = await renderAsync(
          React.createElement(GeneralNotificationEmail, {
            userName,
            title: data.title,
            message: data.message,
            type: data.notificationType || 'info',
          })
        )
        subject = `${data.title} - PAUAffiliate`
        break

      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    const { error } = await resend.emails.send({
      from: 'PAUAffiliate <notifications@resend.dev>',
      to: [userEmail],
      subject,
      html: emailHtml,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully to:', userEmail)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in send-notification-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
