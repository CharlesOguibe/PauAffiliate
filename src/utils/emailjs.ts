
// Simple utility functions for email handling
export const initializeEmailJS = () => {
  // No initialization needed for the integrated approach
  console.log('Using integrated email functionality');
};

export const sendEmailViaEmailJS = async (
  templateId: string,
  templateParams: Record<string, any>,
  userEmail: string
) => {
  try {
    console.log('Sending email via Supabase Edge Function:', { templateId, userEmail, templateParams });
    
    // Extract common parameters
    const subject = templateParams.subject || 'Notification from Affiliate Platform';
    const body = templateParams.message || templateParams.body || 'Default message';
    
    // Always CC the admin email for monitoring all communications
    const adminEmail = 'cjoguibe@gmail.com';
    
    // Use the Supabase Edge Function to send the email
    const response = await fetch('https://dbxgdgpmvobmrdlibauf.supabase.co/functions/v1/send-notification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRieGdkZ3Btdm9ibXJkbGliYXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNTE2NzYsImV4cCI6MjA1NzcyNzY3Nn0.--J_mpKfNdwOC6BX6Qx-AVP_WDCytF0Xhq7uj3OwnZo'}`
      },
      body: JSON.stringify({
        type: templateId.includes('withdrawal_request') ? 'withdrawal_request' :
              templateId.includes('withdrawal_status') ? 'withdrawal_status' :
              templateId.includes('sale_notification') ? 'sale_notification' : 'general',
        userEmail,
        userName: templateParams.name || templateParams.userName || 'User',
        data: templateParams
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error:', errorText);
      
      // Fallback to mailto if the edge function fails
      console.log('Falling back to mailto link');
      const mailtoLink = `mailto:${userEmail}?cc=${encodeURIComponent(adminEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      
      return { success: true, data: { message: 'Email client opened as fallback' }, warning: 'Edge function failed' };
    }

    const result = await response.json();
    console.log('Email sent via edge function:', result);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Email sending error:', error);
    
    // If the edge function call fails, fall back to mailto
    try {
      const subject = templateParams.subject || 'Notification from Affiliate Platform';
      const body = templateParams.message || templateParams.body || 'Default message';
      const adminEmail = 'cjoguibe@gmail.com';
      
      const mailtoLink = `mailto:${userEmail}?cc=${encodeURIComponent(adminEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      
      console.log('Mailto link opened as fallback');
      return { success: true, data: { message: 'Email client opened as fallback' } };
    } catch (mailtoError) {
      console.error('Mailto fallback error:', mailtoError);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send email and open email client' };
    }
  }
};

const EMAILJS_CONFIG = {
  publicKey: '',
  serviceId: '',
  templates: {
    withdrawalRequest: 'withdrawal_request',
    withdrawalStatus: 'withdrawal_status',
    saleNotification: 'sale_notification',
    generalNotification: 'general_notification',
  }
};

export default EMAILJS_CONFIG;
