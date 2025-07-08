
// Simple mailto utility functions
export const initializeEmailJS = () => {
  // No initialization needed for mailto
  console.log('Using mailto for email functionality');
};

export const sendEmailViaEmailJS = async (
  templateId: string,
  templateParams: Record<string, any>,
  userEmail: string
) => {
  try {
    console.log('Opening mailto link for email:', { templateId, userEmail, templateParams });
    
    // Extract common parameters
    const subject = templateParams.subject || 'Notification from Affiliate Platform';
    const body = templateParams.message || templateParams.body || 'Default message';
    
    // Always CC the admin email for monitoring all communications
    const adminEmail = 'cjoguibe@gmail.com';
    
    // Create mailto link with CC
    const mailtoLink = `mailto:${userEmail}?cc=${encodeURIComponent(adminEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open in Gmail if possible (this will open the default mail client, which can be set to Gmail)
    // Note: Web browsers will use the system default mail client or web mail if configured
    window.open(mailtoLink);
    
    console.log('Mailto link opened successfully (CC to admin)');
    return { success: true, data: { message: 'Email client opened' } };
  } catch (error) {
    console.error('Mailto error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to open email client' };
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
