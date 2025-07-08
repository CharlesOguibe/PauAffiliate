
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    // Check if MAILCHIMP_API_KEY exists
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_API_KEY')
    if (!mailchimpApiKey) {
      console.error('MAILCHIMP_API_KEY is not set')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'MAILCHIMP_API_KEY is not configured',
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Extract server prefix from API key (format: key-server)
    const serverPrefix = mailchimpApiKey.includes('-') ? mailchimpApiKey.split('-')[1] : 'us1'

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

    // Override recipient email for testing
    const testRecipientEmail = 'cjoguibe@gmail.com'
    console.log('Processing email notification:', { type, originalEmail: userEmail, testEmail: testRecipientEmail, userName })

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

    console.log('Email HTML rendered successfully, sending via Mailchimp...')
    console.log('Sending to test email:', testRecipientEmail)
    console.log('Subject:', subject)

    // Send email via Mailchimp Transactional API (Mandrill)
    const mailchimpResponse = await fetch(`https://mandrillapp.com/api/1.0/messages/send.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: mailchimpApiKey,
        message: {
          html: emailHtml,
          subject: subject,
          from_email: 'noreply@pauaffiliate.com',
          from_name: 'PAUAffiliate',
          to: [
            {
              email: testRecipientEmail,
              name: userName,
              type: 'to'
            }
          ],
          headers: {
            'Reply-To': 'support@pauaffiliate.com'
          },
          important: false,
          track_opens: true,
          track_clicks: true,
          auto_text: true,
          auto_html: false,
          preserve_recipients: false,
          view_content_link: false,
          tracking_domain: null,
          signing_domain: null,
          return_path_domain: null,
          merge: true,
          merge_language: 'mailchimp'
        },
        async: false,
        ip_pool: 'Main Pool'
      })
    })

    if (!mailchimpResponse.ok) {
      const mailchimpError = await mailchimpResponse.text()
      console.error('Mailchimp API error:', mailchimpError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Mailchimp API error: ${mailchimpError}`,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const mailchimpData = await mailchimpResponse.json()
    console.log('Mailchimp response:', mailchimpData)

    // Check if there are any errors in the response
    if (Array.isArray(mailchimpData) && mailchimpData.length > 0) {
      const firstResult = mailchimpData[0]
      if (firstResult.status === 'rejected' || firstResult.status === 'invalid') {
        console.error('Email rejected by Mailchimp:', firstResult.reject_reason)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Email rejected: ${firstResult.reject_reason}`,
            timestamp: new Date().toISOString()
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      
      console.log('Email sent successfully via Mailchimp to:', testRecipientEmail, 'Message ID:', firstResult._id)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully via Mailchimp', 
          messageId: firstResult._id,
          status: firstResult.status,
          sentTo: testRecipientEmail,
          subject: subject,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      // Handle unexpected response format
      console.error('Unexpected Mailchimp response format:', mailchimpData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unexpected response from Mailchimp API',
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

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
