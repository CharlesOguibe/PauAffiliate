
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
      console.log("=== COMPREHENSIVE REFERRAL LINK DEBUGGING ===");
      console.log("Processing referral code:", code);
      console.log("Code type:", typeof code);
      console.log("Code length:", code?.length);
      console.log("Code raw characters:", Array.from(code || '').map(char => `${char} (${char.charCodeAt(0)})`));

      if (!code) {
        throw new Error("No referral code provided");
      }

      // Let's check database connection and table structure first
      console.log("Testing database connection and table structure...");
      
      // Check if we can access the referral_links table at all
      const { data: tableTest, error: tableTestError } = await supabase
        .from("referral_links")
        .select("count", { count: 'exact' });
      
      console.log("Table access test:", { tableTest, tableTestError });

      // Get ALL referral links to see what's in the database
      const { data: allLinks, error: allLinksError } = await supabase
        .from("referral_links")
        .select("*");

      console.log("ALL referral links in database:", allLinks);
      console.log("Database query error:", allLinksError);

      if (allLinksError) {
        console.error("Cannot access referral_links table:", allLinksError);
        throw new Error(`Database access error: ${allLinksError.message}`);
      }

      if (!allLinks || allLinks.length === 0) {
        console.log("No referral links found in database at all!");
        throw new Error("No referral links exist in the database");
      }

      // Check if our specific code exists in any form
      const exactCodeMatch = allLinks.find(link => link.code === code);
      const lowercaseMatch = allLinks.find(link => link.code.toLowerCase() === code.toLowerCase());
      const trimmedMatch = allLinks.find(link => link.code.trim() === code.trim());
      
      console.log("Code matching analysis:");
      console.log("- Looking for code:", code);
      console.log("- Exact match found:", exactCodeMatch);
      console.log("- Lowercase match found:", lowercaseMatch);
      console.log("- Trimmed match found:", trimmedMatch);
      console.log("- Available codes:", allLinks.map(link => `"${link.code}"`));

      // Try the original query approach
      const trimmedCode = code.trim().toLowerCase();
      console.log("Trying case-insensitive query with:", trimmedCode);

      const { data: referralLink, error: linkError } = await supabase
        .from("referral_links")
        .select("*")
        .ilike("code", trimmedCode)
        .maybeSingle();

      console.log("Case-insensitive query result:", referralLink, linkError);

      let finalReferralLink = referralLink;

      if (!referralLink) {
        console.log("Case-insensitive query failed, trying exact match...");
        
        const { data: exactMatch, error: exactError } = await supabase
          .from("referral_links")
          .select("*")
          .eq("code", code)
          .maybeSingle();
        
        console.log("Exact match query result:", exactMatch, exactError);
        
        if (!exactMatch) {
          console.log("Both queries failed. Trying manual array search...");
          
          // Manual search through all links
          const manualMatch = allLinks.find(link => 
            link.code === code || 
            link.code.toLowerCase() === code.toLowerCase() ||
            link.code.trim() === code.trim() ||
            link.code.trim().toLowerCase() === code.trim().toLowerCase()
          );
          
          console.log("Manual search result:", manualMatch);
          
          if (manualMatch) {
            finalReferralLink = manualMatch;
            console.log("Found match through manual search!");
          } else {
            console.error("No match found through any method");
            throw new Error("Referral code not found");
          }
        } else {
          finalReferralLink = exactMatch;
        }
      }

      console.log("Final referral link selected:", finalReferralLink);

      // Get the product separately
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", finalReferralLink.product_id)
        .maybeSingle();

      console.log("Product query result:", product, productError);

      if (productError) {
        console.error("Product database error:", productError);
        throw new Error(`Product database error: ${productError.message}`);
      }

      if (!product) {
        throw new Error("Product not found or no longer available");
      }

      // Update click count
      try {
        const { error: updateError } = await supabase
          .from("referral_links")
          .update({ clicks: (finalReferralLink.clicks || 0) + 1 })
          .eq("id", finalReferralLink.id);

        if (updateError) {
          console.log("Could not update clicks:", updateError);
        } else {
          console.log("Click count updated successfully");
        }
      } catch (updateError) {
        console.log("Could not update clicks, but continuing:", updateError);
      }

      // Store referral info in localStorage
      localStorage.setItem("referral_code", code);
      localStorage.setItem("referral_link_id", finalReferralLink.id);
      localStorage.setItem("affiliate_id", finalReferralLink.affiliate_id);

      console.log("Successfully found referral link and product:", {
        referralId: finalReferralLink.id,
        productId: product.id,
        productName: product.name
      });

      // Return combined data
      return {
        ...finalReferralLink,
        product
      };
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
            <br />
            <span className="text-sm mt-2 block">
              Debug info: Code = {code}, Error = {error?.message}
            </span>
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
