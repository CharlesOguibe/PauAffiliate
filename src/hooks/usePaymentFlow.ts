
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { createPendingSale } from '@/utils/sales';
import { initializePayment, verifyPayment } from '@/services/payment';

type PaymentStep = 'product' | 'payment-form' | 'processing' | 'success' | 'error';

interface Product {
  id: string;
  name: string;
  price: number;
}

export const usePaymentFlow = (product: Product | null) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('product');
  const [paymentError, setPaymentError] = useState<string>('');

  const handleStartPayment = () => {
    setPaymentStep('payment-form');
  };

  const handlePaymentFormSubmit = async (customerData: { email: string; fullName: string; phoneNumber?: string }) => {
    if (!product) {
      toast({
        title: "Error",
        description: "Product information not available",
        variant: "destructive",
      });
      return;
    }

    setPaymentStep('processing');

    try {
      console.log('Starting payment process for:', {
        productId: product.id,
        amount: product.price,
        customerEmail: customerData.email,
        customerName: customerData.fullName
      });

      // Create pending sale
      const { sale, txRef } = await createPendingSale({
        productId: product.id,
        amount: product.price,
        customerEmail: customerData.email,
        customerName: customerData.fullName,
      });

      console.log("Pending sale created:", sale, "txRef:", txRef);

      // Initialize payment
      const paymentData = {
        amount: product.price,
        currency: "NGN",
        customer: {
          email: customerData.email,
          name: customerData.fullName,
          phone_number: customerData.phoneNumber,
        },
        tx_ref: txRef,
        customizations: {
          title: product.name,
          description: `Purchase of ${product.name}`,
          logo: "",
        },
      };

      console.log("Initializing payment with data:", paymentData);

      const paymentResult = await initializePayment(paymentData);
      console.log("Payment result:", paymentResult);

      // Verify payment
      const verificationResult = await verifyPayment(paymentResult.transaction_id, paymentResult.tx_ref);
      console.log("Payment verification result:", verificationResult);

      setPaymentStep('success');
      
      toast({
        title: "Payment Successful!",
        description: "Your purchase has been completed successfully.",
      });

      // Clear referral data
      localStorage.removeItem("referral_code");
      localStorage.removeItem("referral_link_id");
      localStorage.removeItem("affiliate_id");

    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setPaymentStep('error');
      
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment.",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setPaymentStep('payment-form');
    setPaymentError('');
  };

  const handleSuccess = () => {
    navigate("/");
  };

  const handleCancel = () => {
    setPaymentStep('product');
  };

  return {
    paymentStep,
    paymentError,
    handleStartPayment,
    handlePaymentFormSubmit,
    handleRetry,
    handleSuccess,
    handleCancel,
  };
};
