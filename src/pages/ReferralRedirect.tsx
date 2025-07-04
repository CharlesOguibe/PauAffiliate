
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PaymentForm from "@/components/payment/PaymentForm";
import PaymentStatus from "@/components/payment/PaymentStatus";
import ProductDisplay from "@/components/referral/ProductDisplay";
import ErrorDisplay from "@/components/referral/ErrorDisplay";
import { useReferralData } from "@/hooks/useReferralData";
import { usePaymentFlow } from "@/hooks/usePaymentFlow";

const ReferralRedirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const {
    data: referralData,
    isLoading,
    error,
  } = useReferralData(code);

  const {
    paymentStep,
    paymentError,
    handleStartPayment,
    handlePaymentFormSubmit,
    handleRetry,
    handleSuccess,
    handleCancel,
  } = usePaymentFlow(referralData?.product || null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/50">
        <PaymentStatus 
          status="loading" 
          message="Loading product information..." 
        />
      </div>
    );
  }

  if (error || !referralData?.product) {
    console.error("Referral redirect error:", error);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/50">
        <ErrorDisplay
          error={error}
          onGoHome={() => navigate("/")}
          onGoBack={() => navigate(-1)}
        />
      </div>
    );
  }

  const product = referralData.product;

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-sm mb-4 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          </div>

          {paymentStep === 'product' && (
            <ProductDisplay
              product={product}
              onPurchaseClick={handleStartPayment}
            />
          )}

          {paymentStep === 'payment-form' && (
            <PaymentForm
              productName={product.name}
              amount={product.price}
              isLoading={false}
              onSubmit={handlePaymentFormSubmit}
              onCancel={handleCancel}
            />
          )}

          {paymentStep === 'processing' && (
            <PaymentStatus
              status="loading"
              message="Processing your payment. Please wait..."
            />
          )}

          {paymentStep === 'success' && (
            <PaymentStatus
              status="success"
              message="Your payment has been processed successfully! Thank you for your purchase."
              onContinue={handleSuccess}
            />
          )}

          {paymentStep === 'error' && (
            <PaymentStatus
              status="error"
              message={paymentError}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralRedirect;
