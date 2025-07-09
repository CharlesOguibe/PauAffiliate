
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
export const initializeEmailJS = () => {
  console.log('Initializing EmailJS with public key: 6Fm0hJrxDmsYM7Umi');
  emailjs.init("6Fm0hJrxDmsYM7Umi");
  console.log('EmailJS initialized successfully');
};

export const sendEmailViaEmailJS = async (
  templateId: string,
  templateParams: Record<string, any>,
  userEmail: string
) => {
  try {
    console.log('=== EmailJS Debug Info ===');
    console.log('Service ID:', 'service_zvna17d');
    console.log('Template ID:', templateId);
    console.log('User Email:', userEmail);
    console.log('Template Params:', JSON.stringify(templateParams, null, 2));
    
    const emailData = {
      ...templateParams,
      to_email: userEmail,
      from_name: 'PAUAffiliate',
      reply_to: 'support@pauaffiliate.com'
    };
    
    console.log('Final email data being sent:', JSON.stringify(emailData, null, 2));
    
    const response = await emailjs.send(
      'service_zvna17d',
      templateId,
      emailData
    );

    console.log('EmailJS Response:', response);
    console.log('Email Status:', response.status);
    console.log('Email Text:', response.text);
    console.log('=== End EmailJS Debug ===');
    
    return { success: true, data: response };
  } catch (error) {
    console.error('=== EmailJS ERROR ===');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    console.error('Service ID used:', 'service_zvna17d');
    console.error('Template ID used:', templateId);
    console.error('User email used:', userEmail);
    console.error('=== End EmailJS ERROR ===');
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
};

const EMAILJS_CONFIG = {
  publicKey: '6Fm0hJrxDmsYM7Umi',
  serviceId: 'service_zvna17d',
  templates: {
    withdrawalRequest: 'template_bu5ya5t'
  }
};

export default EMAILJS_CONFIG;
