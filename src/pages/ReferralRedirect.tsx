import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Package, ArrowLeft } from "lucide-react";
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
      console.log("=== REFERRAL LINK DEBUGGING ===");
      console.log("Processing referral code:", code);

      if (!code) {
        console.error("No referral code provided");
        throw new Error("No referral code provided");
      }

      // First, let's check if the referral link exists with detailed logging
      console.log("Searching for referral link with code:", code);
      
      const { data: referralLink, error: linkError } = await supabase
        .from("referral_links")
        .select(`
          *,
          products (
            *,
            business_profiles (
              name,
              verified
            )
          )
        `)
        .eq("code", code)
        .maybeSingle();

      console.log("Referral link query result:", { referralLink, linkError });

      if (linkError) {
        console.error("Database error fetching referral link:", linkError);
        throw new Error(`Database error: ${linkError.message}`);
      }

      if (!referralLink) {
        console.error("Referral link not found for code:", code);
        // Let's also check what referral links exist in the database for debugging
        const { data: allLinks } = await supabase
          .from("referral_links")
          .select("code")
          .limit(10);
        console.log("Available referral codes in database:", allLinks?.map(l => l.code));
        throw new Error("Referral code not found");
      }

      if (!referralLink.products) {
        console.error("Product not found for referral link:", referralLink);
        throw new Error("Product not found or no longer available");
      }

      // Check if the business is verified
      if (!referralLink.products.business_profiles?.verified) {
        console.warn("Business not verified:", referralLink.products.business_profiles);
        throw new Error("This product is from an unverified business and is not available for purchase");
      }

      // Update click count
      try {
        const { error: updateError } = await supabase
          .from("referral_links")
          .update({ clicks: (referralLink.clicks || 0) + 1 })
          .eq("id", referralLink.id);

        if (updateError) {
          console.warn("Could not update click count:", updateError);
        } else {
          console.log("Click count updated successfully");
        }
      } catch (updateError) {
        console.warn("Could not update clicks, but continuing:", updateError);
      }

      // Store referral info in localStorage
      localStorage.setItem("referral_code", code);
      localStorage.setItem("referral_link_id", referralLink.id);
      localStorage.setItem("affiliate_id", referralLink.affiliate_id);

      console.log("Referral data processed successfully:", {
        linkId: referralLink.id,
        productId: referralLink.products.id,
        productName: referralLink.products.name,
        businessVerified: referralLink.products.business_profiles?.verified
      });

      return {
        ...referralLink,
        product: referralLink.products
      };
    },
    enabled: !!code,
    retry: false,
  });

  const handleStartPayment = () => {
    setPaymentStep('payment-form');
  };

  const handlePaymentFormSubmit = async (customerData: { email: string; fullName: string; phoneNumber?: string }) => {
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
      console.log('Starting payment process for:', {
        productId: referralData.product.id,
        amount: referralData.product.price,
        customerEmail: customerData.email,
        customerName: customerData.fullName
      });

      // Create pending sale
      const { sale, txRef } = await createPendingSale({
        productId: referralData.product.id,
        amount: referralData.product.price,
        customerEmail: customerData.email,
        customerName: customerData.fullName,
      });

      console.log("Pending sale created:", sale, "txRef:", txRef);

      // Initialize payment
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
          description: `Purchase of ${referralData.product.name}`,
          logo: referralData.product.image_url || "",
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
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Invalid Referral Link</h1>
          <p className="text-muted-foreground mb-4">
            {errorMessage === "Referral code not found" 
              ? "This referral code is not valid or has expired."
              : errorMessage === "Product not found or no longer available"
              ? "The product associated with this referral link is no longer available."
              : errorMessage.includes("unverified business")
              ? "This product is from an unverified business."
              : "This referral link is not valid. Please check the link and try again."
            }
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

          {paymentStep === 'product' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product Image */}
              <div>
                {product.image_url ? (
                  <GlassCard className="overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-96 object-cover"
                    />
                  </GlassCard>
                ) : (
                  <GlassCard className="h-96 flex items-center justify-center bg-muted/50">
                    <Package className="h-24 w-24 text-muted-foreground" />
                  </GlassCard>
                )}
              </div>

              {/* Product Details */}
              <div>
                <GlassCard>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center p-4 bg-background/50 rounded-lg">
                      <NairaIcon className="h-6 w-6 text-primary mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-2xl font-bold">₦{product.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartPayment}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Purchase Now - ₦{product.price.toFixed(2)}
                  </Button>
                </GlassCard>
              </div>
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
