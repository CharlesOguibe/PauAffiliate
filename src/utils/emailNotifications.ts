
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
    console.log('=== Email Notification Debug ===');
    console.log('Notification Data:', JSON.stringify(notificationData, null, 2));
    
    // Validate required fields
    if (!notificationData.type || !notificationData.userEmail || !notificationData.userName) {
      console.error('Missing required notification fields:', {
        type: !!notificationData.type,
        userEmail: !!notificationData.userEmail,
        userName: !!notificationData.userName
      });
      return { success: false, error: 'Missing required fields' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(notificationData.userEmail)) {
      console.error('Invalid email format:', notificationData.userEmail);
      return { success: false, error: 'Invalid email format' };
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
      
      console.log('Using withdrawal template:', templateId);
    } else {
      throw new Error(`Unknown email type: ${notificationData.type}`);
    }

    console.log('Template params:', JSON.stringify(templateParams, null, 2));
    console.log('Sending to email:', notificationData.userEmail);

    const result = await sendEmailViaEmailJS(templateId, templateParams, notificationData.userEmail);
    
    if (result.success) {
      console.log('Email notification sent successfully');
      console.log('EmailJS response:', result.data);
      return { success: true, data: result.data };
    } else {
      console.error('Failed to send email:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error in sendEmailNotification:', error);
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
  console.log('=== Withdrawal Email Debug ===');
  console.log('Sending withdrawal request email to:', userEmail);
  console.log('User name:', userName);
  console.log('Withdrawal data:', JSON.stringify(withdrawalData, null, 2));
  
  if (!userEmail || !userName || !withdrawalData.amount) {
    console.error('Invalid withdrawal request email data:', {
      userEmail: !!userEmail,
      userName: !!userName,
      amount: !!withdrawalData.amount
    });
    return { success: false, error: 'Invalid email data' };
  }

  const result = await sendEmailNotification({
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
  
  console.log('Withdrawal email result:', result);
  return result;
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
  console.log('General notification email requested but not implemented via EmailJS');
  console.log('Email:', userEmail, 'User:', userName, 'Data:', notificationData);
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
  console.log('Withdrawal status email requested but not implemented via EmailJS');
  console.log('Email:', userEmail, 'User:', userName, 'Data:', statusData);
  return { success: false, error: 'Withdrawal status emails not supported via EmailJS' };
};
