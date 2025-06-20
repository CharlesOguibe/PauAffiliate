import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Users, Building } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BusinessProfile, WithdrawalRequest } from '@/types/dashboard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminPanel = () => {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBusinesses();
    fetchWithdrawalRequests();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const fetchWithdrawalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          id,
          amount,
          bank_name,
          account_number,
          account_name,
          status,
          created_at,
          processed_at,
          affiliate_id,
          profiles:affiliate_id (
            name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: WithdrawalRequest[] = (data || []).map(req => ({
        id: req.id,
        amount: req.amount,
        bank_name: req.bank_name,
        account_number: req.account_number,
        account_name: req.account_name,
        status: req.status as 'pending' | 'approved' | 'rejected' | 'completed',
        created_at: req.created_at,
        processed_at: req.processed_at,
        affiliate_id: req.affiliate_id,
        profiles: {
          name: req.profiles?.name || 'Unknown',
          email: req.profiles?.email || 'Unknown'
        }
      }));
      
      setWithdrawalRequests(transformedData);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    }
  };

  const handleVerifyBusiness = async (businessId: string, approve: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({
          verified: approve,
          verified_at: approve ? new Date().toISOString() : null
        })
        .eq('id', businessId);

      if (error) throw error;

      toast({
        title: approve ? "Business Verified" : "Business Rejected",
        description: `The business has been ${approve ? 'verified' : 'rejected'} successfully.`,
      });

      fetchBusinesses();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update business verification status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalRequest = async (requestId: string, approve: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: approve ? "Withdrawal Approved" : "Withdrawal Rejected",
        description: `The withdrawal request has been ${approve ? 'approved' : 'rejected'}.`,
      });

      fetchWithdrawalRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process withdrawal request.",
        variant: "destructive",
      });
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

  return (
    <div className="space-y-8 mb-8">
      <GlassCard>
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500/10 p-2 rounded-full">
              <Shield className="h-5 w-5 text-yellow-500" />
            </div>
            <h2 className="text-xl font-semibold">Admin Panel</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Building className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Businesses</div>
                <div className="text-2xl font-bold">{businesses.length}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-green-500/10 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Verified Businesses</div>
                <div className="text-2xl font-bold">{businesses.filter(b => b.verified).length}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-500/10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Pending Withdrawals</div>
                <div className="text-2xl font-bold">{withdrawalRequests.length}</div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Business Verification */}
      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Business Verification</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell className="font-medium">{business.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{business.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {business.verified ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                            Verified
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium">
                            Pending
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(business.created_at)}
                  </TableCell>
                  <TableCell>
                    {!business.verified && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerifyBusiness(business.id, true)}
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerifyBusiness(business.id, false)}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      {/* Withdrawal Requests */}
      {withdrawalRequests.length > 0 && (
        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Pending Withdrawal Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{request.profiles.name}</div>
                        <div className="text-muted-foreground">{request.profiles.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₦{request.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{request.account_name}</div>
                        <div className="text-muted-foreground">
                          {request.bank_name} - {request.account_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(request.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWithdrawalRequest(request.id, true)}
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWithdrawalRequest(request.id, false)}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default AdminPanel;
