import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Button from "@/components/ui/custom/Button";
import GlassCard from "@/components/ui/custom/GlassCard";
import NairaIcon from "@/components/ui/icons/NairaIcon";
import PaymentForm from "@/components/payment/PaymentForm";
import PaymentStatus from "@/components/payment/PaymentStatus";
import { createPendingSale } from "@/utils/sales";
import { initializePayment, verifyPayment } from "@/services/payment";
import { useToast } from "@/hooks/use-toast";

type PaymentStep = 'product' | 'payment-form' | 'processing' | 'success' | 'error';

const ReferralRedirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('product');
  const [paymentError, setPaymentError] = useState<string>('');

  const {
    data: referralData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["referral", code],
    queryFn: async () => {
      console.log("Processing referral code:", code);

      if (!code) {
        throw new Error("No referral code provided");
      }

      try {
        // First, get the referral link
        const { data: referralLink, error: referralError } = await supabase
          .from("referral_links")
          .select("*")
          .eq("code", code)
          .maybeSingle();

        console.log("Referral link query result:", referralLink, referralError);

        if (referralError) {
          console.error("Database error:", referralError);
          throw new Error("Failed to fetch referral data");
        }

        if (!referralLink) {
          console.error("No referral link found for code:", code);
          throw new Error("Invalid referral code");
        }

        // Then get the product
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", referralLink.product_id)
          .single();

        if (productError || !product) {
          console.error("Product error:", productError);
          throw new Error("Product not found");
        }

        // Get business profile separately
        const { data: businessProfile, error: businessError } = await supabase
          .from("business_profiles")
          .select("name, verified")
          .eq("id", product.business_id)
          .maybeSingle();

        // Combine the data
        const productWithBusiness = {
          ...product,
          business_profiles: businessProfile || { name: "Unknown Business", verified: false }
        };

        console.log("Found referral link:", referralLink);
        console.log("Found product:", productWithBusiness);

        // Update click count (don't wait for this)
        supabase
          .from("referral_links")
          .update({ clicks: (referralLink.clicks || 0) + 1 })
          .eq("id", referralLink.id)
          .then(({ error }) => {
            if (error) console.error("Error updating click count:", error);
          });

        // Store referral info for later use
        localStorage.setItem("referral_code", code);
        localStorage.setItem("referral_link_id", referralLink.id);
        localStorage.setItem("affiliate_id", referralLink.affiliate_id);

        return {
          ...referralLink,
          product: productWithBusiness
        };

      } catch (err) {
        console.error("Error in referral lookup:", err);
        throw err;
      }
    },
    enabled: !!code,
    retry: false,
  });

  // Auto-redirect to payment form when referral data is loaded
  useEffect(() => {
    if (referralData?.product && paymentStep === 'product') {
      console.log("Auto-redirecting to payment form");
      setPaymentStep('payment-form');
    }
  }, [referralData, paymentStep]);

  const handlePaymentFormSubmit = async (customerData: { 
    email: string; 
    fullName: string; 
    phoneNumber?: string;
    deliveryAddress: string;
    city: string;
    state: string;
  }) => {
    if (!referralData?.product) {
      toast({
        title: "Error", 
        description: "Product information not available",
        variant: "destructive",
      });
      return;
    }

    setPaymentStep('processing');

    try {
      const fullDeliveryAddress = `${customerData.deliveryAddress}, ${customerData.city}, ${customerData.state}`;
      
      console.log('Starting payment process for:', {
        productId: referralData.product.id,
        amount: referralData.product.price,
        customerEmail: customerData.email,
        customerName: customerData.fullName,
        deliveryAddress: fullDeliveryAddress
      });

      // Create pending sale
      const { sale, txRef } = await createPendingSale({
        productId: referralData.product.id,
        amount: referralData.product.price,
        customerEmail: customerData.email,
        customerName: customerData.fullName,
        deliveryAddress: fullDeliveryAddress
      });

      console.log("Pending sale created:", sale, "txRef:", txRef);

      // Initialize payment with Flutterwave
      const paymentData = {
        amount: referralData.product.price,
        currency: "NGN",
        customer: {
          email: customerData.email,
          name: customerData.fullName,
          phone_number: customerData.phoneNumber,
        },
        tx_ref: txRef,
        customizations: {
          title: referralData.product.name,
          description: `Purchase of ${referralData.product.name} - Delivery to: ${customerData.city}, ${customerData.state}`,
          logo: referralData.product.image_url || "",
        },
      };

      console.log("Initializing Flutterwave payment with data:", paymentData);

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
    navigate("/");
  };

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
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Invalid Referral Link</h1>
          <p className="text-muted-foreground mb-4">
            This referral code is not valid or the product may no longer be available.
          </p>
          <div className="space-y-2">
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Homepage
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
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

          {paymentStep === 'payment-form' && (
            <div className="mb-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{product.name}</h2>
                    <p className="text-muted-foreground">Complete your purchase</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold flex items-center">
                      <NairaIcon className="h-6 w-6 mr-1" />
                      {product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
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
              message="Processing your payment with Flutterwave. Please wait..."
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
