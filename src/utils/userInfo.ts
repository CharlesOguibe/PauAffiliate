
import { supabase } from '@/integrations/supabase/client';

export const fetchUserInfo = async (userId: string) => {
  if (!userId) return { email: "Unavailable", name: "Unknown", role: "Unknown" };

  try {
    // First get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, name, role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return { email: "Error", name: "Error", role: "Unknown" };
    }

    if (!profile) {
      return { email: "Not found", name: "Not found", role: "Unknown" };
    }

    // Check if user is a business by looking in business_profiles table
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (businessError) {
      console.error('Error checking business profile:', businessError);
    }

    // Determine actual user type
    const actualRole = businessProfile ? 'business' : 'affiliate';

    return {
      email: profile.email || "No Email",
      name: profile.name || "No Name",
      role: actualRole,
    };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return { email: "Error", name: "Error", role: "Unknown" };
  }
};
