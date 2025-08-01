
interface FlutterwavePaymentData {
  amount: number;
  currency: string;
  customer: {
    email: string;
    name?: string;
  };
  tx_ref: string;
  callback_url?: string;
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}

interface FlutterwavePaymentResult {
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

export const initializeFlutterwavePayment = (
  paymentData: FlutterwavePaymentData
): Promise<FlutterwavePaymentResult> => {
  return new Promise((resolve, reject) => {
    // Get Flutterwave public key from environment
    const publicKey = "FLWPUBK_TEST-24c9cb4441148177081306fefe9d2539-X"; // Replace with your actual public key

    if (!publicKey) {
      reject(new Error("Flutterwave public key not found"));
      return;
    }

    const config = {
      public_key: publicKey,
      tx_ref: paymentData.tx_ref,
      amount: paymentData.amount,
      currency: paymentData.currency || "NGN",
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: paymentData.customer.email,
        name: paymentData.customer.name || "",
      },
      customizations: {
        title: paymentData.customizations?.title || "Payment",
        description:
          paymentData.customizations?.description || "Purchase payment",
        logo: paymentData.customizations?.logo || "",
      },
      callback: function (data: FlutterwavePaymentResult) {
        console.log("Flutterwave callback received:", data);
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

    // @ts-ignore - FlutterwaveCheckout is loaded from external script
    if (typeof FlutterwaveCheckout !== "undefined") {
      // @ts-ignore
      FlutterwaveCheckout(config);
    } else {
      reject(new Error("Flutterwave checkout not loaded"));
    }
  });
};
