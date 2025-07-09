
import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_zvna17d';
const EMAILJS_TEMPLATE_ID = 'template_bu5ya5t';
const EMAILJS_PUBLIC_KEY = '6Fm0hJrxDmsYM7Umi';

interface EmailNotificationData {
  type: 'withdrawal_request'
  userEmail: string
  userName: string
  data: any
}

export const sendEmailNotification = async (notificationData: EmailNotificationData) => {
  try {
    console.log('Sending email notification via EmailJS:', notificationData);
    
    const templateParams = {
      to_email: notificationData.userEmail,
      to_name: notificationData.userName,
      subject: getEmailSubject(notificationData.type, notificationData.data),
      message: getEmailMessage(notificationData.type, notificationData.data, notificationData.userName),
      from_name: 'PAUAffiliate Team'
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Email sent successfully via EmailJS:', result);
    return { success: true, messageId: result.text };
  } catch (error) {
    console.error('Error sending email via EmailJS:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
};

// Helper function for withdrawal request emails
export const sendWithdrawalRequestEmail = async (
  userEmail: string,
  userName: string,
  withdrawalData: {
    amount: number
    bankName: string
    accountNumber: string
    accountName: string
  }
) => {
  try {
    console.log('Sending withdrawal request email via EmailJS:', {
      userEmail,
      userName,
      withdrawalData
    });

    const templateParams = {
      to_email: userEmail,
      to_name: userName,
      subject: 'Withdrawal Request Submitted - PAUAffiliate',
      message: `Hello ${userName},

Your withdrawal request has been submitted successfully and is being processed.

Details:
• Amount: ₦${withdrawalData.amount.toFixed(2)}
• Bank: ${withdrawalData.bankName}
• Account Number: ${withdrawalData.accountNumber}
• Account Name: ${withdrawalData.accountName}

Withdrawals are processed within 24-48 hours. You'll receive email notifications about status updates.

Best regards,
PAUAffiliate Team`,
      from_name: 'PAUAffiliate Team'
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Withdrawal request email sent successfully:', result);
    return { success: true, messageId: result.text };
  } catch (error) {
    console.error('Error sending withdrawal request email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send withdrawal request email' };
  }
};

// General notification email function
export const sendGeneralNotificationEmail = async (
  userEmail: string,
  userName: string,
  notificationData: {
    title: string
    message: string
    notificationType: string
  }
) => {
  try {
    console.log('Sending general notification email via EmailJS:', {
      userEmail,
      userName,
      notificationData
    });

    const templateParams = {
      to_email: userEmail,
      to_name: userName,
      subject: `${notificationData.title} - PAUAffiliate`,
      message: `Hello ${userName},

${notificationData.message}

Best regards,
PAUAffiliate Team`,
      from_name: 'PAUAffiliate Team'
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('General notification email sent successfully:', result);
    return { success: true, messageId: result.text };
  } catch (error) {
    console.error('Error sending general notification email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send general notification email' };
  }
};

// Withdrawal status email function
export const sendWithdrawalStatusEmail = async (
  userEmail: string,
  userName: string,
  statusData: {
    amount: number
    status: string
    bankName: string
    accountNumber: string
    accountName: string
    notes?: string
  }
) => {
  try {
    console.log('Sending withdrawal status email via EmailJS:', {
      userEmail,
      userName,
      statusData
    });

    const statusMessage = getStatusMessage(statusData.status);
    const templateParams = {
      to_email: userEmail,
      to_name: userName,
      subject: `Withdrawal ${statusData.status.charAt(0).toUpperCase() + statusData.status.slice(1)} - PAUAffiliate`,
      message: `Hello ${userName},

${statusMessage}

Details:
• Amount: ₦${statusData.amount.toFixed(2)}
• Bank: ${statusData.bankName}
• Account Number: ${statusData.accountNumber}
• Account Name: ${statusData.accountName}
• Status: ${statusData.status.toUpperCase()}

${statusData.notes ? `Additional Notes: ${statusData.notes}` : ''}

${statusData.status === 'approved' ? 'Your funds will be transferred to your bank account shortly.' : ''}
${statusData.status === 'rejected' ? 'If you have any questions, please contact our support team.' : ''}

Best regards,
PAUAffiliate Team`,
      from_name: 'PAUAffiliate Team'
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Withdrawal status email sent successfully:', result);
    return { success: true, messageId: result.text };
  } catch (error) {
    console.error('Error sending withdrawal status email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send withdrawal status email' };
  }
};

// Helper functions
const getEmailSubject = (type: string, data: any) => {
  switch (type) {
    case 'withdrawal_request':
      return 'Withdrawal Request Submitted - PAUAffiliate';
    default:
      return 'Notification - PAUAffiliate';
  }
};

const getEmailMessage = (type: string, data: any, userName: string) => {
  switch (type) {
    case 'withdrawal_request':
      return `Hello ${userName},

Your withdrawal request has been submitted successfully and is being processed.

Details:
• Amount: ₦${data.amount.toFixed(2)}
• Bank: ${data.bankName}
• Account Number: ${data.accountNumber}
• Account Name: ${data.accountName}

Withdrawals are processed within 24-48 hours.

Best regards,
PAUAffiliate Team`;
    default:
      return `Hello ${userName},

You have a new notification.

Best regards,
PAUAffiliate Team`;
  }
};

const getStatusMessage = (status: string) => {
  switch (status) {
    case 'approved':
      return 'Great news! Your withdrawal request has been approved and is being processed.';
    case 'rejected':
      return 'Unfortunately, your withdrawal request has been rejected.';
    case 'completed':
      return 'Your withdrawal has been completed and sent to your bank account.';
    default:
      return 'There has been an update to your withdrawal request.';
  }
};
