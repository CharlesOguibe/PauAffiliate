
// Email notifications utility with Elastic Email API integration

interface EmailNotificationData {
  type: 'withdrawal_request'
  userEmail: string
  userName: string
  data: any
}

const ELASTIC_EMAIL_API_KEY = '62EDB0F2AF30F81A0B559E371544FDFBFF66F0BFCBCEB86D67AB4922CB4F92023EC11BA5F8A97B2139F8D6D92467A5D0';
const ELASTIC_EMAIL_API_URL = 'https://api.elasticemail.com/v2/email/send';

const sendElasticEmail = async (to: string, subject: string, htmlBody: string, textBody?: string) => {
  try {
    const formData = new FormData();
    formData.append('apikey', ELASTIC_EMAIL_API_KEY);
    formData.append('to', to);
    formData.append('from', 'noreply@pauaffiliate.com');
    formData.append('fromName', 'PAU Affiliate System');
    formData.append('subject', subject);
    formData.append('bodyHtml', htmlBody);
    if (textBody) {
      formData.append('bodyText', textBody);
    }
    
    // Add headers to improve deliverability
    formData.append('replyTo', 'support@pauaffiliate.com');
    formData.append('priority', '3'); // Normal priority (1=high, 3=normal, 5=low)

    const response = await fetch(ELASTIC_EMAIL_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.text();
    
    if (response.ok) {
      console.log('Email sent successfully via Elastic Email:', result);
      return { success: true, result };
    } else {
      console.error('Elastic Email API error:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('Error sending email via Elastic Email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const sendEmailNotification = async (notificationData: EmailNotificationData) => {
  console.log('Sending email notification via Elastic Email:', notificationData);
  
  if (notificationData.type === 'withdrawal_request') {
    return await sendWithdrawalRequestEmail(
      notificationData.userEmail,
      notificationData.userName,
      notificationData.data
    );
  }
  
  return { success: false, error: 'Unknown notification type' };
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
  console.log('Sending withdrawal request email via Elastic Email:', {
    userEmail,
    userName,
    withdrawalData
  });

  const subject = 'PAU Affiliate: New Withdrawal Request Requires Review';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Withdrawal Request</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f8f9fa;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto;">
              <tr>
                <td style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 600;">PAU Affiliate System</h1>
                    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Payment Processing Notification</p>
                  </div>
                  
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">New Withdrawal Request</h2>
                  
                  <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px;">A withdrawal request has been submitted by an affiliate and requires your immediate attention for processing.</p>
                  
                  <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; margin: 25px 0; border: 1px solid #e5e7eb;">
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="font-weight: 600; color: #374151; width: 30%;">Affiliate Name:</td>
                      <td style="color: #1f2937;">${userName}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="font-weight: 600; color: #374151; padding-top: 12px;">Email Address:</td>
                      <td style="color: #1f2937; padding-top: 12px;">${userEmail}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="font-weight: 600; color: #374151; padding-top: 12px;">Withdrawal Amount:</td>
                      <td style="color: #059669; font-weight: 600; font-size: 18px; padding-top: 12px;">₦${withdrawalData.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="font-weight: 600; color: #374151; padding-top: 12px;">Bank Name:</td>
                      <td style="color: #1f2937; padding-top: 12px;">${withdrawalData.bankName}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="font-weight: 600; color: #374151; padding-top: 12px;">Account Number:</td>
                      <td style="color: #1f2937; font-family: monospace; padding-top: 12px;">${withdrawalData.accountNumber}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600; color: #374151; padding-top: 12px;">Account Name:</td>
                      <td style="color: #1f2937; padding-top: 12px;">${withdrawalData.accountName}</td>
                    </tr>
                  </table>
                  
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 25px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #92400e; font-weight: 500;">
                      <strong>Action Required:</strong> Please log into the admin panel to review and process this withdrawal request promptly.
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Review in Admin Panel</a>
                  </div>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  
                  <p style="color: #6b7280; margin: 0; font-size: 14px; text-align: center;">
                    This is an automated notification from PAU Affiliate System.<br>
                    Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textBody = `
PAU AFFILIATE SYSTEM - WITHDRAWAL REQUEST

A new withdrawal request requires your attention:

AFFILIATE DETAILS:
Name: ${userName}
Email: ${userEmail}

WITHDRAWAL DETAILS:
Amount: ₦${withdrawalData.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
Bank: ${withdrawalData.bankName}
Account Number: ${withdrawalData.accountNumber}
Account Name: ${withdrawalData.accountName}

ACTION REQUIRED: Please log into the admin panel to review and process this withdrawal request.

---
PAU Affiliate System
This is an automated notification. Please do not reply to this email.
  `;

  // Send to admin email
  const adminResult = await sendElasticEmail(
    'cjoguibe@gmail.com',
    subject,
    htmlBody,
    textBody
  );

  // Also send confirmation to user with improved formatting
  const userSubject = 'PAU Affiliate: Your Withdrawal Request Has Been Submitted';
  const userHtmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Withdrawal Request Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f8f9fa;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto;">
              <tr>
                <td style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 600;">PAU Affiliate System</h1>
                  </div>
                  
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Withdrawal Request Submitted Successfully</h2>
                  
                  <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px;">Hello ${userName},</p>
                  
                  <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px;">Your withdrawal request has been submitted successfully and is currently being reviewed by our team.</p>
                  
                  <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; margin: 25px 0; border: 1px solid #e5e7eb;">
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="font-weight: 600; color: #374151; width: 30%;">Amount Requested:</td>
                      <td style="color: #059669; font-weight: 600; font-size: 18px;">₦${withdrawalData.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="font-weight: 600; color: #374151; padding-top: 12px;">Bank Name:</td>
                      <td style="color: #1f2937; padding-top: 12px;">${withdrawalData.bankName}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="font-weight: 600; color: #374151; padding-top: 12px;">Account Number:</td>
                      <td style="color: #1f2937; font-family: monospace; padding-top: 12px;">${withdrawalData.accountNumber}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600; color: #374151; padding-top: 12px;">Account Name:</td>
                      <td style="color: #1f2937; padding-top: 12px;">${withdrawalData.accountName}</td>
                    </tr>
                  </table>
                  
                  <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 25px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #065f46; font-weight: 500;">
                      <strong>Processing Timeline:</strong> Withdrawals are typically processed within 24-48 business hours. You'll receive email notifications about any status updates.
                    </p>
                  </div>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  
                  <p style="color: #6b7280; margin: 0; font-size: 14px; text-align: center;">
                    Thank you for being part of PAU Affiliate System.<br>
                    If you have any questions, please contact our support team.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const userTextBody = `
PAU AFFILIATE SYSTEM - WITHDRAWAL REQUEST CONFIRMATION

Hello ${userName},

Your withdrawal request has been submitted successfully and is being reviewed.

REQUEST DETAILS:
Amount: ₦${withdrawalData.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
Bank: ${withdrawalData.bankName}
Account Number: ${withdrawalData.accountNumber}
Account Name: ${withdrawalData.accountName}

PROCESSING TIMELINE: Withdrawals are typically processed within 24-48 business hours. You'll receive email notifications about status updates.

Thank you for being part of PAU Affiliate System.

---
PAU Affiliate Team
  `;

  const userResult = await sendElasticEmail(
    userEmail,
    userSubject,
    userHtmlBody,
    userTextBody
  );

  console.log('Admin email result:', adminResult);
  console.log('User email result:', userResult);

  return adminResult;
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
  console.log('Sending general notification email via Elastic Email:', {
    userEmail,
    userName,
    notificationData
  });

  const subject = notificationData.title;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">${notificationData.title}</h2>
        
        <p style="color: #666;">Hello ${userName},</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #333; line-height: 1.6;">${notificationData.message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <p style="color: #666; margin-top: 30px;">
          Best regards,<br>
          PAU Affiliate Team
        </p>
      </div>
    </div>
  `;

  const textBody = `
${notificationData.title}

Hello ${userName},

${notificationData.message}

Best regards,
PAU Affiliate Team
  `;

  return await sendElasticEmail(userEmail, subject, htmlBody, textBody);
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
  console.log('Sending withdrawal status email via Elastic Email:', {
    userEmail,
    userName,
    statusData
  });

  const statusText = statusData.status === 'approved' ? 'Approved' : 
                    statusData.status === 'rejected' ? 'Rejected' : 
                    statusData.status === 'completed' ? 'Completed' : 'Updated';
  
  const subject = `Withdrawal Request ${statusText}`;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'completed': return '#17a2b8';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Withdrawal Request ${statusText}</h2>
        
        <p style="color: #666;">Hello ${userName},</p>
        
        <p style="color: #666; margin-bottom: 20px;">Your withdrawal request has been ${statusData.status}.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Request Details:</h3>
          <p style="margin: 5px 0; color: #333;"><strong>Amount:</strong> ₦${statusData.amount.toFixed(2)}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Bank Name:</strong> ${statusData.bankName}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Account Number:</strong> ${statusData.accountNumber}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Account Name:</strong> ${statusData.accountName}</p>
          <p style="margin: 5px 0; color: ${getStatusColor(statusData.status)}; font-weight: bold;"><strong>Status:</strong> ${statusText}</p>
        </div>
        
        ${statusData.notes ? `
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #333;"><strong>Notes:</strong> ${statusData.notes}</p>
        </div>
        ` : ''}
        
        <p style="color: #666; margin-top: 30px;">
          Best regards,<br>
          PAU Affiliate Team
        </p>
      </div>
    </div>
  `;

  const textBody = `
Withdrawal Request ${statusText}

Hello ${userName},

Your withdrawal request has been ${statusData.status}.

Request Details:
Amount: ₦${statusData.amount.toFixed(2)}
Bank Name: ${statusData.bankName}
Account Number: ${statusData.accountNumber}
Account Name: ${statusData.accountName}
Status: ${statusText}

${statusData.notes ? `Notes: ${statusData.notes}` : ''}

Best regards,
PAU Affiliate Team
  `;

  return await sendElasticEmail(userEmail, subject, htmlBody, textBody);
};
