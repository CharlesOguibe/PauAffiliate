
import { sendEmailViaEmailJS } from './emailjs';
import EMAILJS_CONFIG from './emailjs';

interface EmailNotificationData {
  type: 'withdrawal_request'
  userEmail: string
  userName: string
  data: any
}

export const sendEmailNotification = async (notificationData: EmailNotificationData) => {
  try {
    console.log('Sending email notification via EmailJS:', notificationData);
    
    // Validate required fields
    if (!notificationData.type || !notificationData.userEmail || !notificationData.userName) {
      console.error('Missing required notification fields');
      return { success: false, error: 'Missing required fields' };
    }

    let templateId: string;
    let templateParams: Record<string, any>;

    if (notificationData.type === 'withdrawal_request') {
      templateId = EMAILJS_CONFIG.templates.withdrawalRequest;
      templateParams = {
        user_name: notificationData.userName,
        amount: notificationData.data.amount,
        bank_name: notificationData.data.bankName,
        account_number: notificationData.data.accountNumber,
        account_name: notificationData.data.accountName,
        subject: 'Withdrawal Request Submitted',
        message: `Your withdrawal request for ₦${notificationData.data.amount} has been submitted successfully and will be processed within 24-48 hours.`
      };
    } else {
      throw new Error(`Unknown email type: ${notificationData.type}`);
    }

    const result = await sendEmailViaEmailJS(templateId, templateParams, notificationData.userEmail);
    
    if (result.success) {
      console.log('Email notification sent successfully via EmailJS');
      return { success: true, data: result.data };
    } else {
      console.error('Failed to send email via EmailJS:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
  console.log('Sending withdrawal request email to:', userEmail);
  
  if (!userEmail || !userName || !withdrawalData.amount) {
    console.error('Invalid withdrawal request email data');
    return { success: false, error: 'Invalid email data' };
  }

  return sendEmailNotification({
    type: 'withdrawal_request',
    userEmail,
    userName,
    data: {
      amount: Number(withdrawalData.amount),
      bankName: String(withdrawalData.bankName || ''),
      accountNumber: String(withdrawalData.accountNumber || ''),
      accountName: String(withdrawalData.accountName || '')
    }
  });
};

// Placeholder functions for backward compatibility
export const sendGeneralNotificationEmail = async (
  userEmail: string,
  userName: string,
  notificationData: {
    title: string
    message: string
    notificationType: string
  }
) => {
  console.log('General notification email not implemented via EmailJS - using withdrawal template only');
  return { success: false, error: 'General notifications not supported via EmailJS' };
};

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
  console.log('Withdrawal status email not implemented via EmailJS - using withdrawal template only');
  return { success: false, error: 'Withdrawal status emails not supported via EmailJS' };
};
