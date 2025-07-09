
import React, { useState, useEffect } from 'react';
import { Users, Mail, IdCard } from 'lucide-react';
import GlassCard from '@/components/ui/custom/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AffiliateProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  earnings: number | null;
}

const AffiliatesTable = () => {
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      console.log('Fetching affiliates...');
      
      // First, let's get all users to see what roles exist
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select('*');

      console.log('All users in profiles table:', allUsers);
      setDebugInfo(allUsers || []);

      if (allUsersError) {
        console.error('Error fetching all users:', allUsersError);
      }

      // Now fetch specifically affiliate users
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'affiliate')
        .order('created_at', { ascending: false });

      console.log('Affiliates data:', affiliatesData, affiliatesError);

      if (affiliatesError) throw affiliatesError;

      setAffiliates(affiliatesData || []);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatEarnings = (earnings: number | null) => {
    if (earnings === null || earnings === 0) return '₦0.00';
    return `₦${earnings.toFixed(2)}`;
  };

  const totalAffiliates = affiliates.length;

  if (loading) {
    return (
      <GlassCard className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-500/10 p-2 rounded-full">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold">Affiliates Management</h2>
          </div>
          <p className="text-muted-foreground">Loading affiliates...</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Debug Information */}
      {debugInfo.length > 0 && (
        <GlassCard className="overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Debug: All Users in Database</h3>
            <div className="space-y-2">
              {debugInfo.map((user) => (
                <div key={user.id} className="text-sm">
                  <strong>{user.name}</strong> ({user.email}) - Role: <span className="font-mono bg-muted px-1 rounded">{user.role}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/10 p-2 rounded-full">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold">Affiliates Management</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Total affiliates: {totalAffiliates}
          </p>
        </div>
        
        {totalAffiliates === 0 ? (
          <div className="p-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No affiliates found</p>
            <p className="text-xs text-muted-foreground mt-2">
              Check the debug information above to see all users and their roles
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Affiliate ID</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="bg-green-500/10 p-1.5 rounded-full">
                          <Users className="h-3 w-3 text-green-500" />
                        </div>
                        <span>{affiliate.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{affiliate.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <IdCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {affiliate.id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className={`${
                        (affiliate.earnings || 0) > 0 
                          ? 'text-green-600' 
                          : 'text-muted-foreground'
                      }`}>
                        {formatEarnings(affiliate.earnings)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(affiliate.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default AffiliatesTable;
