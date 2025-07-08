
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
          title: "Email Client Opened!",
          description: "Your default email client should now be open with the test email.",
        });
      } else {
        throw new Error(result.error || 'Failed to open email client');
      }
    } catch (error) {
      console.error('Error opening email client:', error);
      toast({
        title: "Error",
        description: "Failed to open email client. Please try again.",
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
      loadingText="Opening..."
    >
      <Mail className="h-4 w-4 mr-2" />
      Send Test Email
    </Button>
  );
};

export default TestEmailButton;
