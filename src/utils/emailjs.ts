
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
    
    // Create mailto link
    const mailtoLink = `mailto:${userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.open(mailtoLink);
    
    console.log('Mailto link opened successfully');
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
