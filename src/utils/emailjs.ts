
import emailjs from '@emailjs/browser';

// EmailJS configuration - these will be public keys so it's safe to store them here
const EMAILJS_CONFIG = {
  publicKey: 'YOUR_PUBLIC_KEY', // Replace with your EmailJS public key
  serviceId: 'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
  templates: {
    withdrawalRequest: 'YOUR_WITHDRAWAL_REQUEST_TEMPLATE_ID',
    withdrawalStatus: 'YOUR_WITHDRAWAL_STATUS_TEMPLATE_ID',
    saleNotification: 'YOUR_SALE_NOTIFICATION_TEMPLATE_ID',
    generalNotification: 'YOUR_GENERAL_NOTIFICATION_TEMPLATE_ID',
  }
};

// Initialize EmailJS
export const initializeEmailJS = () => {
  emailjs.init(EMAILJS_CONFIG.publicKey);
};

export const sendEmailViaEmailJS = async (
  templateId: string,
  templateParams: Record<string, any>,
  userEmail: string
) => {
  try {
    console.log('Sending email via EmailJS:', { templateId, userEmail, templateParams });
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      templateId,
      {
        to_email: userEmail,
        ...templateParams
      }
    );

    console.log('EmailJS response:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('EmailJS error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
};

export default EMAILJS_CONFIG;
