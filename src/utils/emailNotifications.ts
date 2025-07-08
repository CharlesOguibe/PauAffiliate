
import { sendEmailViaEmailJS } from './emailjs';
import EMAILJS_CONFIG from './emailjs';

interface EmailNotificationData {
  type: 'withdrawal_request' | 'withdrawal_status' | 'sale_notification' | 'general'
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

    switch (notificationData.type) {
      case 'withdrawal_request':
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
        break;

      case 'withdrawal_status':
        templateId = EMAILJS_CONFIG.templates.withdrawalStatus;
        const statusText = notificationData.data.status === 'approved' ? 'approved' : 
                          notificationData.data.status === 'completed' ? 'completed' : 'rejected';
        templateParams = {
          user_name: notificationData.userName,
          amount: notificationData.data.amount,
          status: statusText,
          bank_name: notificationData.data.bankName,
          account_number: notificationData.data.accountNumber,
          account_name: notificationData.data.accountName,
          notes: notificationData.data.notes || '',
          subject: `Withdrawal Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
          message: `Your withdrawal request has been ${statusText}.`
        };
        break;

      case 'sale_notification':
        templateId = EMAILJS_CONFIG.templates.saleNotification;
        templateParams = {
          user_name: notificationData.userName,
          product_name: notificationData.data.productName,
          commission_amount: notificationData.data.commissionAmount,
          customer_email: notificationData.data.customerEmail,
          subject: 'New Sale Commission Earned!',
          message: `Congratulations! You've earned ₦${notificationData.data.commissionAmount} commission.`
        };
        break;

      case 'general':
        templateId = EMAILJS_CONFIG.templates.generalNotification;
        templateParams = {
          user_name: notificationData.userName,
          title: notificationData.data.title,
          message: notificationData.data.message,
          subject: notificationData.data.title
        };
        break;

      default:
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

// Helper functions for specific notification types
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

export const sendWithdrawalStatusEmail = async (
  userEmail: string,
  userName: string,
  statusData: {
    amount: number
    status: 'approved' | 'rejected' | 'completed'
    bankName: string
    accountNumber: string
    accountName: string
    notes?: string
  }
) => {
  console.log('Sending withdrawal status email to:', userEmail);
  
  if (!userEmail || !userName || !statusData.amount || !statusData.status) {
    console.error('Invalid withdrawal status email data');
    return { success: false, error: 'Invalid email data' };
  }

  return sendEmailNotification({
    type: 'withdrawal_status',
    userEmail,
    userName,
    data: {
      amount: Number(statusData.amount),
      status: statusData.status,
      bankName: String(statusData.bankName || ''),
      accountNumber: String(statusData.accountNumber || ''),
      accountName: String(statusData.accountName || ''),
      notes: statusData.notes || undefined
    }
  });
};

export const sendSaleNotificationEmail = async (
  userEmail: string,
  userName: string,
  saleData: {
    productName: string
    commissionAmount: number
    customerEmail: string
  }
) => {
  console.log('Sending sale notification email to:', userEmail);
  
  if (!userEmail || !userName || !saleData.commissionAmount) {
    console.error('Invalid sale notification email data');
    return { success: false, error: 'Invalid email data' };
  }

  return sendEmailNotification({
    type: 'sale_notification',
    userEmail,
    userName,
    data: {
      productName: String(saleData.productName || 'Product'),
      commissionAmount: Number(saleData.commissionAmount),
      customerEmail: String(saleData.customerEmail || '')
    }
  });
};

export const sendGeneralNotificationEmail = async (
  userEmail: string,
  userName: string,
  notificationData: {
    title: string
    message: string
    notificationType?: 'info' | 'warning' | 'success' | 'error'
  }
) => {
  console.log('Sending general notification email to:', userEmail);
  
  if (!userEmail || !userName || !notificationData.title || !notificationData.message) {
    console.error('Invalid general notification email data');
    return { success: false, error: 'Invalid email data' };
  }

  return sendEmailNotification({
    type: 'general',
    userEmail,
    userName,
    data: {
      title: String(notificationData.title),
      message: String(notificationData.message),
      notificationType: notificationData.notificationType || 'info'
    }
  });
};
