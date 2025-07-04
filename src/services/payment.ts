
import { supabase } from '@/integrations/supabase/client';

export interface PaymentData {
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
    phone_number?: string;
  };
  tx_ref: string;
  callback_url?: string;
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}

export interface PaymentResult {
  status: string;
  transaction_id: string;
  tx_ref: string;
  flw_ref: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
  };
}

export const initializePayment = (paymentData: PaymentData): Promise<PaymentResult> => {
  return new Promise((resolve, reject) => {
    // Check if FlutterwaveCheckout is available
    if (typeof window === 'undefined' || !(window as any).FlutterwaveCheckout) {
      reject(new Error('Flutterwave checkout not loaded. Please refresh the page and try again.'));
      return;
    }

    const config = {
      public_key: "FLWPUBK_TEST-24c9cb4441148177081306fefe9d2539-X",
      tx_ref: paymentData.tx_ref,
      amount: paymentData.amount,
      currency: paymentData.currency || "NGN",
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: paymentData.customer.email,
        name: paymentData.customer.name,
        phone_number: paymentData.customer.phone_number || "",
      },
      customizations: {
        title: paymentData.customizations?.title || "Payment",
        description: paymentData.customizations?.description || "Purchase payment",
        logo: paymentData.customizations?.logo || "",
      },
      callback: function (data: PaymentResult) {
        console.log("Flutterwave payment callback:", data);
        if (data.status === "successful") {
          resolve(data);
        } else {
          reject(new Error(`Payment failed with status: ${data.status}`));
        }
      },
      onclose: function () {
        console.log("Payment modal closed by user");
        reject(new Error("Payment cancelled by user"));
      },
    };

    try {
      (window as any).FlutterwaveCheckout(config);
    } catch (error) {
      console.error("Error initializing Flutterwave checkout:", error);
      reject(new Error("Failed to initialize payment. Please try again."));
    }
  });
};

export const verifyPayment = async (transactionId: string, txRef: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-flutterwave-payment', {
      body: {
        transaction_id: transactionId,
        tx_ref: txRef,
      },
    });

    if (error) {
      console.error('Payment verification error:', error);
      throw new Error('Failed to verify payment');
    }

    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};
