
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { WithdrawalRequestEmail } from './_templates/withdrawal-request.tsx'
import { WithdrawalStatusEmail } from './_templates/withdrawal-status.tsx'
import { SaleNotificationEmail } from './_templates/sale-notification.tsx'
import { GeneralNotificationEmail } from './_templates/general-notification.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationEmailRequest {
  type: 'withdrawal_request' | 'withdrawal_status' | 'sale_notification' | 'general'
  userEmail: string
  userName: string
  data: any
}

serve(async (req) => {
  console.log('Email function called with method:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('Request body received:', JSON.stringify(requestBody, null, 2))
    
    const { type, userEmail, userName, data }: NotificationEmailRequest = requestBody

    if (!type || !userEmail || !userName || !data) {
      console.error('Missing required fields:', { type, userEmail, userName, data })
      throw new Error('Missing required fields: type, userEmail, userName, or data')
    }

    console.log('Processing email notification:', { type, userEmail, userName })

    let emailHtml: string
    let subject: string

    switch (type) {
      case 'withdrawal_request':
        console.log('Rendering withdrawal request email')
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

      case 'withdrawal_status':
        console.log('Rendering withdrawal status email')
        emailHtml = await renderAsync(
          React.createElement(WithdrawalStatusEmail, {
            userName,
            amount: data.amount,
            status: data.status,
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            accountName: data.accountName,
            notes: data.notes,
          })
        )
        subject = `Withdrawal ${data.status.charAt(0).toUpperCase() + data.status.slice(1)} - PAUAffiliate`
        break

      case 'sale_notification':
        console.log('Rendering sale notification email')
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
        console.log('Rendering general notification email')
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

    console.log('Email HTML rendered successfully, sending via Resend...')

    const { data: emailData, error } = await resend.emails.send({
      from: 'PAUAffiliate <notifications@resend.dev>',
      to: [userEmail],
      subject,
      html: emailHtml,
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Resend error: ${error.message || 'Unknown error'}`)
    }

    console.log('Email sent successfully to:', userEmail, 'Email ID:', emailData?.id)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', emailId: emailData?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in send-notification-email function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
