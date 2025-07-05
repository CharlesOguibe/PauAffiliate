
import { supabase } from '@/integrations/supabase/client'

interface EmailNotificationData {
  type: 'withdrawal_request' | 'withdrawal_status' | 'sale_notification' | 'general'
  userEmail: string
  userName: string
  data: any
}

export const sendEmailNotification = async (notificationData: EmailNotificationData) => {
  try {
    console.log('Sending email notification:', notificationData)
    
    // Validate required fields
    if (!notificationData.type || !notificationData.userEmail || !notificationData.userName) {
      console.error('Missing required notification fields')
      return { success: false, error: 'Missing required fields' }
    }

    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: notificationData
    })

    if (error) {
      console.error('Error sending email notification:', error)
      return { success: false, error: error.message || 'Failed to send email' }
    }

    console.log('Email notification sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error invoking email function:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

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
  console.log('Sending withdrawal request email to:', userEmail)
  
  if (!userEmail || !userName || !withdrawalData.amount) {
    console.error('Invalid withdrawal request email data')
    return { success: false, error: 'Invalid email data' }
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
  })
}

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
  console.log('Sending withdrawal status email to:', userEmail)
  
  if (!userEmail || !userName || !statusData.amount || !statusData.status) {
    console.error('Invalid withdrawal status email data')
    return { success: false, error: 'Invalid email data' }
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
  })
}

export const sendSaleNotificationEmail = async (
  userEmail: string,
  userName: string,
  saleData: {
    productName: string
    commissionAmount: number
    customerEmail: string
  }
) => {
  console.log('Sending sale notification email to:', userEmail)
  
  if (!userEmail || !userName || !saleData.commissionAmount) {
    console.error('Invalid sale notification email data')
    return { success: false, error: 'Invalid email data' }
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
  })
}

export const sendGeneralNotificationEmail = async (
  userEmail: string,
  userName: string,
  notificationData: {
    title: string
    message: string
    notificationType?: 'info' | 'warning' | 'success' | 'error'
  }
) => {
  console.log('Sending general notification email to:', userEmail)
  
  if (!userEmail || !userName || !notificationData.title || !notificationData.message) {
    console.error('Invalid general notification email data')
    return { success: false, error: 'Invalid email data' }
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
  })
}
