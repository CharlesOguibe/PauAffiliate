
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
export const initializeEmailJS = () => {
  emailjs.init("YOUR_PUBLIC_KEY"); // Replace with your actual public key
};

export const sendEmailViaEmailJS = async (
  templateId: string,
  templateParams: Record<string, any>,
  userEmail: string
) => {
  try {
    console.log('Sending email via EmailJS:', { templateId, userEmail, templateParams });
    
    const response = await emailjs.send(
      'YOUR_SERVICE_ID', // Replace with your service ID
      templateId,
      {
        ...templateParams,
        to_email: userEmail,
        from_name: 'PAUAffiliate',
        reply_to: 'support@pauaffiliate.com'
      }
    );

    console.log('Email sent successfully via EmailJS:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('EmailJS sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
};

const EMAILJS_CONFIG = {
  publicKey: 'YOUR_PUBLIC_KEY', // Replace with your actual public key
  serviceId: 'YOUR_SERVICE_ID', // Replace with your actual service ID
  templates: {
    withdrawalRequest: 'template_withdrawal_request'
  }
};

export default EMAILJS_CONFIG;
