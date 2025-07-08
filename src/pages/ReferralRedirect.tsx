
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
      console.log("=== REFERRAL LINK LOOKUP DEBUG ===");
      console.log("Looking for referral code:", code);

      if (!code) {
        throw new Error("No referral code provided");
      }

      // Clean the code - remove any whitespace and convert to lowercase for comparison
      const cleanCode = code.trim().toLowerCase();
      console.log("Cleaned code for lookup:", cleanCode);

      // Try exact match first with explicit column selection
      console.log("Trying exact match...");
      const { data: exactMatch, error: exactError } = await supabase
        .from("referral_links")
        .select(`
          id,
          code,
          affiliate_id,
          product_id,
          clicks,
          conversions,
          created_at
        `)
        .eq("code", code)
        .maybeSingle();

      console.log("Exact match result:", { exactMatch, exactError });

      if (exactMatch) {
        console.log("Found exact match! Getting product details...");
        
        // Get product details separately
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", exactMatch.product_id)
          .maybeSingle();

        console.log("Product lookup result:", { product, productError });

        if (product) {
          // Update click count
          await supabase
            .from("referral_links")
            .update({ clicks: (exactMatch.clicks || 0) + 1 })
            .eq("id", exactMatch.id);

          return {
            ...exactMatch,
            product
          };
        }
      }

      // Try case-insensitive match
      console.log("Trying case-insensitive match...");
      const { data: caseInsensitiveMatch, error: caseError } = await supabase
        .from("referral_links")
        .select(`
          id,
          code,
          affiliate_id,
          product_id,
          clicks,
          conversions,
          created_at
        `)
        .ilike("code", cleanCode)
        .maybeSingle();

      console.log("Case-insensitive match result:", { caseInsensitiveMatch, caseError });

      if (caseInsensitiveMatch) {
        console.log("Found case-insensitive match! Getting product details...");
        
        // Get product details separately
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", caseInsensitiveMatch.product_id)
          .maybeSingle();

        console.log("Product lookup result:", { product, productError });

        if (product) {
          // Update click count
          await supabase
            .from("referral_links")
            .update({ clicks: (caseInsensitiveMatch.clicks || 0) + 1 })
            .eq("id", caseInsensitiveMatch.id);

          return {
            ...caseInsensitiveMatch,
            product
          };
        }
      }

      // Get ALL referral links to debug
      console.log("Getting all referral links for debugging...");
      const { data: allLinks, error: allError } = await supabase
        .from("referral_links")
        .select("*");

      console.log("All referral links:", allLinks);
      console.log("Available codes:", allLinks?.map(link => `"${link.code}"`));

      if (allLinks && allLinks.length > 0) {
        // Try manual search
        const manualMatch = allLinks.find(link => 
          link.code === code || 
          link.code.toLowerCase() === cleanCode ||
          link.code.trim() === code.trim()
        );

        if (manualMatch) {
          console.log("Found manual match:", manualMatch);
          
          // Get the product separately
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("*")
            .eq("id", manualMatch.product_id)
            .maybeSingle();

          if (product) {
            console.log("Found product for manual match:", product);
            
            // Update click count
            await supabase
              .from("referral_links")
              .update({ clicks: (manualMatch.clicks || 0) + 1 })
              .eq("id", manualMatch.id);

            return {
              ...manualMatch,
              product
            };
          }
        }
      }

      console.error("No referral link found for code:", code);
      throw new Error("Referral code not found");
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
          description: `Purchase of ${referralData.product.name}`,
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
