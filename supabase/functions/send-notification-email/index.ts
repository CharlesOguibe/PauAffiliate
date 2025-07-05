
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { WithdrawalRequestEmail } from './_templates/withdrawal-request.tsx'
import { WithdrawalStatusEmail } from './_templates/withdrawal-status.tsx'
import { SaleNotificationEmail } from './_templates/sale-notification.tsx'
import { GeneralNotificationEmail } from './_templates/general-notification.tsx'

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
    // Check if RESEND_API_KEY exists
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'RESEND_API_KEY is not configured',
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const resend = new Resend(resendApiKey)

    const requestBody = await req.json()
    console.log('Request body received:', JSON.stringify(requestBody, null, 2))
    
    const { type, userEmail, userName, data }: NotificationEmailRequest = requestBody

    if (!type || !userEmail || !userName || !data) {
      console.error('Missing required fields:', { type, userEmail, userName, data: !!data })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: type, userEmail, userName, or data',
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Processing email notification:', { type, userEmail, userName })

    let emailHtml: string
    let subject: string

    try {
      switch (type) {
        case 'withdrawal_request':
          console.log('Rendering withdrawal request email with data:', data)
          emailHtml = await renderAsync(
            React.createElement(WithdrawalRequestEmail, {
              userName: userName || 'User',
              amount: Number(data.amount) || 0,
              bankName: String(data.bankName || ''),
              accountNumber: String(data.accountNumber || ''),
              accountName: String(data.accountName || ''),
            })
          )
          subject = 'Withdrawal Request Submitted - PAUAffiliate'
          break

        case 'withdrawal_status':
          console.log('Rendering withdrawal status email with data:', data)
          emailHtml = await renderAsync(
            React.createElement(WithdrawalStatusEmail, {
              userName: userName || 'User',
              amount: Number(data.amount) || 0,
              status: data.status || 'pending',
              bankName: String(data.bankName || ''),
              accountNumber: String(data.accountNumber || ''),
              accountName: String(data.accountName || ''),
              notes: data.notes || undefined,
            })
          )
          subject = `Withdrawal ${String(data.status || 'Update').charAt(0).toUpperCase() + String(data.status || 'update').slice(1)} - PAUAffiliate`
          break

        case 'sale_notification':
          console.log('Rendering sale notification email with data:', data)
          emailHtml = await renderAsync(
            React.createElement(SaleNotificationEmail, {
              userName: userName || 'User',
              productName: String(data.productName || 'Product'),
              commissionAmount: Number(data.commissionAmount) || 0,
              customerEmail: String(data.customerEmail || ''),
            })
          )
          subject = `🎉 New Sale! You earned ₦${Number(data.commissionAmount || 0).toFixed(2)} - PAUAffiliate`
          break

        case 'general':
          console.log('Rendering general notification email with data:', data)
          emailHtml = await renderAsync(
            React.createElement(GeneralNotificationEmail, {
              userName: userName || 'User',
              title: String(data.title || 'Notification'),
              message: String(data.message || ''),
              type: data.notificationType || 'info',
            })
          )
          subject = `${String(data.title || 'Notification')} - PAUAffiliate`
          break

        default:
          throw new Error(`Unknown email type: ${type}`)
      }
    } catch (renderError) {
      console.error('Error rendering email template:', renderError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to render email template: ${renderError.message}`,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Email HTML rendered successfully, sending via Resend...')
    console.log('Sending to email:', userEmail)
    console.log('Subject:', subject)

    const { data: emailData, error: resendError } = await resend.emails.send({
      from: 'PAUAffiliate <onboarding@resend.dev>',
      to: [userEmail],
      subject,
      html: emailHtml,
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Resend error: ${resendError.message || 'Unknown resend error'}`,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Email sent successfully to:', userEmail, 'Email ID:', emailData?.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully', 
        emailId: emailData?.id,
        timestamp: new Date().toISOString()
      }),
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
