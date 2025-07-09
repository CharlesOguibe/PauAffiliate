
// Elastic Email Configuration
const ELASTIC_EMAIL_API_KEY = '62EDB0F2AF30F81A0B559E371544FDFBFF66F0BFCBCEB86D67AB4922CB4F92023EC11BA5F8A97B2139F8D6D92467A5D0';
const ELASTIC_EMAIL_API_URL = 'https://api.elasticemail.com/v2/email/send';

interface EmailNotificationData {
  type: 'withdrawal_request'
  userEmail: string
  userName: string
  data: any
}

export const sendEmailNotification = async (notificationData: EmailNotificationData) => {
  try {
    console.log('Sending email notification via Elastic Email:', notificationData);
    
    const formData = new FormData();
    formData.append('apikey', ELASTIC_EMAIL_API_KEY);
    formData.append('from', 'noreply@pauaffiliate.com');
    formData.append('fromName', 'PAUAffiliate Team');
    formData.append('to', notificationData.userEmail);
    formData.append('subject', getEmailSubject(notificationData.type, notificationData.data));
    formData.append('bodyText', getEmailMessage(notificationData.type, notificationData.data, notificationData.userName));

    const response = await fetch(ELASTIC_EMAIL_API_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('Email sent successfully via Elastic Email:', result);
      return { success: true, messageId: result.data.messageid };
    } else {
      console.error('Error sending email via Elastic Email:', result);
      return { success: false, error: result.error || 'Failed to send email' };
    }
  } catch (error) {
    console.error('Error sending email via Elastic Email:', error);
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
    console.log('Sending withdrawal request email via Elastic Email:', {
      userEmail,
      userName,
      withdrawalData
    });

    const formData = new FormData();
    formData.append('apikey', ELASTIC_EMAIL_API_KEY);
    formData.append('from', 'noreply@pauaffiliate.com');
    formData.append('fromName', 'PAUAffiliate Team');
    formData.append('to', userEmail);
    formData.append('subject', 'Withdrawal Request Submitted - PAUAffiliate');
    formData.append('bodyText', `Hello ${userName},

Your withdrawal request has been submitted successfully and is being processed.

Details:
• Amount: ₦${withdrawalData.amount.toFixed(2)}
• Bank: ${withdrawalData.bankName}
• Account Number: ${withdrawalData.accountNumber}
• Account Name: ${withdrawalData.accountName}

Withdrawals are processed within 24-48 hours. You'll receive email notifications about status updates.

Best regards,
PAUAffiliate Team`);

    const response = await fetch(ELASTIC_EMAIL_API_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('Withdrawal request email sent successfully:', result);
      return { success: true, messageId: result.data.messageid };
    } else {
      console.error('Error sending withdrawal request email:', result);
      return { success: false, error: result.error || 'Failed to send withdrawal request email' };
    }
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
    console.log('Sending general notification email via Elastic Email:', {
      userEmail,
      userName,
      notificationData
    });

    const formData = new FormData();
    formData.append('apikey', ELASTIC_EMAIL_API_KEY);
    formData.append('from', 'noreply@pauaffiliate.com');
    formData.append('fromName', 'PAUAffiliate Team');
    formData.append('to', userEmail);
    formData.append('subject', `${notificationData.title} - PAUAffiliate`);
    formData.append('bodyText', `Hello ${userName},

${notificationData.message}

Best regards,
PAUAffiliate Team`);

    const response = await fetch(ELASTIC_EMAIL_API_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('General notification email sent successfully:', result);
      return { success: true, messageId: result.data.messageid };
    } else {
      console.error('Error sending general notification email:', result);
      return { success: false, error: result.error || 'Failed to send general notification email' };
    }
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
    console.log('Sending withdrawal status email via Elastic Email:', {
      userEmail,
      userName,
      statusData
    });

    const statusMessage = getStatusMessage(statusData.status);
    const formData = new FormData();
    formData.append('apikey', ELASTIC_EMAIL_API_KEY);
    formData.append('from', 'noreply@pauaffiliate.com');
    formData.append('fromName', 'PAUAffiliate Team');
    formData.append('to', userEmail);
    formData.append('subject', `Withdrawal ${statusData.status.charAt(0).toUpperCase() + statusData.status.slice(1)} - PAUAffiliate`);
    formData.append('bodyText', `Hello ${userName},

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
PAUAffiliate Team`);

    const response = await fetch(ELASTIC_EMAIL_API_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('Withdrawal status email sent successfully:', result);
      return { success: true, messageId: result.data.messageid };
    } else {
      console.error('Error sending withdrawal status email:', result);
      return { success: false, error: result.error || 'Failed to send withdrawal status email' };
    }
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
