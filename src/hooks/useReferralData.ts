
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useReferralData = (code: string | undefined) => {
  return useQuery({
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
        .select("*")
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

      // Now get the product details - explicitly specify the foreign key relationship
      const { data: product, error: productError } = await supabase
        .from("products")
        .select(`
          *,
          business_profiles!products_business_id_fkey (
            name,
            verified
          )
        `)
        .eq("id", referralLink.product_id)
        .maybeSingle();

      console.log("Product query result:", { product, productError });

      if (productError) {
        console.error("Database error fetching product:", productError);
        throw new Error(`Product database error: ${productError.message}`);
      }

      if (!product) {
        console.error("Product not found for referral link:", referralLink);
        throw new Error("Product not found or no longer available");
      }

      // Check if the business is verified
      if (!product.business_profiles?.verified) {
        console.warn("Business not verified:", product.business_profiles);
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
        productId: product.id,
        productName: product.name,
        businessVerified: product.business_profiles?.verified
      });

      return {
        ...referralLink,
        product: product
      };
    },
    enabled: !!code,
    retry: false,
  });
};
