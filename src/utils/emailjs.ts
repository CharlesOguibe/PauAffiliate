
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
export const initializeEmailJS = () => {
  emailjs.init("6Fm0hJrxDmsYM7Umi");
};

export const sendEmailViaEmailJS = async (
  templateId: string,
  templateParams: Record<string, any>,
  userEmail: string
) => {
  try {
    console.log('Sending email via EmailJS:', { templateId, userEmail, templateParams });
    
    const response = await emailjs.send(
      'service_ryi5qwb',
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
  publicKey: '6Fm0hJrxDmsYM7Umi',
  serviceId: 'service_ryi5qwb',
  templates: {
    withdrawalRequest: 'template_bu5ya5t'
  }
};

export default EMAILJS_CONFIG;
