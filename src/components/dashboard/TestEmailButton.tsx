
import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import { useToast } from '@/hooks/use-toast';
import { sendGeneralNotificationEmail } from '@/utils/emailNotifications';

interface TestEmailButtonProps {
  userEmail: string;
  userName: string;
}

const TestEmailButton = ({ userEmail, userName }: TestEmailButtonProps) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendTestEmail = async () => {
    setIsSending(true);
    
    try {
      const result = await sendGeneralNotificationEmail(
        userEmail,
        userName,
        {
          title: 'Test Email Notification',
          message: 'This is a test email to verify that the notification system is working correctly. If you received this email, the system is functioning properly!',
          notificationType: 'success'
        }
      );

      if (result.success) {
        toast({
          title: "Email Sent Successfully!",
          description: "A test notification email has been sent to your inbox.",
        });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSendTestEmail}
      isLoading={isSending}
      loadingText="Sending..."
    >
      <Mail className="h-4 w-4 mr-2" />
      Send Test Email
    </Button>
  );
};

export default TestEmailButton;
