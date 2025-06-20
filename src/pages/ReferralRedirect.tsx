
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Package, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Button from "@/components/ui/custom/Button";
import GlassCard from "@/components/ui/custom/GlassCard";
import NairaIcon from "@/components/ui/icons/NairaIcon";
import { createPendingSale } from "@/utils/sales";
import { initializeFlutterwavePayment } from "@/services/flutterwave";
import { useToast } from "@/hooks/use-toast";

const ReferralRedirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);

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

      // First, let's check if there are any referral links at all
      const { data: allLinks, error: debugError } = await supabase
        .from("referral_links")
        .select("code, id, product_id")
        .limit(5);
      
      console.log("Sample referral links in database:", allLinks, debugError);

      // Try exact match first
      const { data: exactMatch, error: exactError } = await supabase
        .from("referral_links")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      console.log("Exact match attempt:", exactMatch, exactError);

      let referralLink = exactMatch;

      // If no exact match, try case-insensitive search
      if (!referralLink && !exactError) {
        const { data: caseInsensitiveResults, error: caseError } = await supabase
          .from("referral_links")
          .select("*")
          .ilike("code", code)
          .limit(1)
          .maybeSingle();

        console.log("Case-insensitive search result:", caseInsensitiveResults, caseError);
        
        if (!caseError) {
          referralLink = caseInsensitiveResults;
        }
      }

      if (exactError) {
        console.error("Error fetching referral link:", exactError);
        throw new Error(`Database error: ${exactError.message}`);
      }

      if (!referralLink) {
        console.log(`No referral link found for code: ${code}`);
        throw new Error("Referral code not found");
      }

      // Get the product details
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", referralLink.product_id)
        .maybeSingle();

      console.log("Product query result:", product, productError);

      if (productError) {
        console.error("Error fetching product:", productError);
        throw new Error(`Product lookup error: ${productError.message}`);
      }

      if (!product) {
        throw new Error("Product not found or no longer available");
      }

      console.log("Found referral link and product:", { referralLink, product });

      // Update click count (don't fail if this doesn't work)
      try {
        const { error: updateError } = await supabase
          .from("referral_links")
          .update({ clicks: (referralLink.clicks || 0) + 1 })
          .eq("id", referralLink.id);

        if (updateError) {
          console.log("Could not update clicks:", updateError);
        }
      } catch (updateError) {
        console.log("Could not update clicks, but continuing:", updateError);
      }

      // Store referral info in localStorage for the purchase
      localStorage.setItem("referral_code", code);
      localStorage.setItem("referral_link_id", referralLink.id);
      localStorage.setItem("affiliate_id", referralLink.affiliate_id);

      return {
        ...referralLink,
        product: product
      };
    },
    enabled: !!code,
    retry: false,
  });

  const handlePurchase = async () => {
    if (!referralData?.product) {
      toast({
        title: "Error",
        description: "Product information not available",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      // Get customer details with better validation
      const customerEmail = prompt("Please enter your email address:");
      if (!customerEmail || !customerEmail.includes('@')) {
        toast({
          title: "Invalid Email",
          description: "Please provide a valid email address",
          variant: "destructive",
        });
        setIsPurchasing(false);
        return;
      }

      const customerName = prompt("Please enter your full name:");
      if (!customerName || customerName.trim().length < 2) {
        toast({
          title: "Invalid Name",
          description: "Please provide your full name",
          variant: "destructive",
        });
        setIsPurchasing(false);
        return;
      }

      console.log('Starting purchase process for:', {
        productId: referralData.product.id,
        amount: referralData.product.price,
        customerEmail,
        customerName
      });

      // Create pending sale
      const { sale, txRef } = await createPendingSale({
        productId: referralData.product.id,
        amount: referralData.product.price,
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
      });

      console.log("Pending sale created:", sale, "txRef:", txRef);

      // Initialize Flutterwave payment with proper configuration
      const paymentData = {
        amount: referralData.product.price,
        currency: "NGN",
        customer: {
          email: customerEmail.trim(),
          name: customerName.trim(),
        },
        tx_ref: txRef,
        customizations: {
          title: referralData.product.name,
          description: `Purchase of ${referralData.product.name}`,
          logo: referralData.product.image_url || "",
        },
      };

      console.log("Initializing Flutterwave payment with data:", paymentData);

      // This should redirect to Flutterwave payment page
      const paymentResult = await initializeFlutterwavePayment(paymentData);

      console.log("Payment initialization result:", paymentResult);

      // If we get here, it means payment was successful or completed
      if (paymentResult) {
        toast({
          title: "Payment Successful!",
          description: "Your purchase has been completed. Processing your order...",
          variant: "default",
        });

        // Clear referral data after successful payment
        localStorage.removeItem("referral_code");
        localStorage.removeItem("referral_link_id");
        localStorage.removeItem("affiliate_id");

        // Redirect to success page or dashboard
        navigate("/dashboard");
      }

    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Payment Failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/50">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !referralData?.product) {
    console.error("Referral redirect error:", error);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">
            Invalid Referral Link
          </h1>
          <p className="text-muted-foreground mb-4">
            This referral code is not valid or the product may no longer be
            available.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Referral Code: <span className="font-mono font-bold">{code}</span>
          </p>
          {error && (
            <p className="text-sm text-red-600 mb-4">
              Error: {error.message}
            </p>
          )}
          <div className="space-y-2">
            <Button
              onClick={() => navigate("/")}
              className="w-full"
            >
              Go to Homepage
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
              <p className="text-sm text-blue-800 font-medium">Troubleshooting:</p>
              <p className="text-xs text-blue-600 mt-1">
                1. Check the console for database query results<br/>
                2. Verify the referral code is correct<br/>
                3. Ensure the referral link exists in the database
              </p>
            </div>
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
            <div className="text-center">
              <h1 className="text-3xl font-bold">
                {product.name}
              </h1>
              <p className="text-muted-foreground mt-2">
                Special product recommendation
              </p>
            </div>
          </div>

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
                  <h2 className="text-2xl font-bold mb-2">
                    {product.name}
                  </h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {product.description}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center p-4 bg-background/50 rounded-lg">
                    <NairaIcon className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-2xl font-bold">
                        ₦{product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePurchase}
                  isLoading={isPurchasing}
                  loadingText="Redirecting to payment..."
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Purchase Now - ₦{product.price.toFixed(2)}
                </Button>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralRedirect;
