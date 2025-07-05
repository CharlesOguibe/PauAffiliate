import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Users, Building, DollarSign } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BusinessProfile, WithdrawalRequest } from '@/types/dashboard';
import { sendWithdrawalRequestEmail, sendGeneralNotificationEmail } from '@/utils/emailNotifications';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Type for database function responses
interface DatabaseFunctionResponse {
  success: boolean;
  error?: string;
  message?: string;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [approvedWithdrawals, setApprovedWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState<{[key: string]: string}>({});
  const [completionNotes, setCompletionNotes] = useState<{[key: string]: string}>({});

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
          notes,
          profiles!withdrawal_requests_affiliate_id_fkey (
            name,
            email
          )
        `)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform and separate the data
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
        notes: req.notes,
        profiles: {
          name: req.profiles?.name || 'Unknown',
          email: req.profiles?.email || 'Unknown'
        }
      }));
      
      setPendingWithdrawals(transformedData.filter(req => req.status === 'pending'));
      setApprovedWithdrawals(transformedData.filter(req => req.status === 'approved'));
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

  const handleWithdrawalApproval = async (requestId: string, approve: boolean) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const notes = adminNotes[requestId] || null;
      
      const { data, error } = await supabase.rpc('process_withdrawal_approval', {
        request_id: requestId,
        admin_id: user.id,
        approve: approve,
        admin_notes: notes
      });

      if (error) throw error;

      // Type cast the response (cast to unknown first as suggested by TypeScript)
      const response = data as unknown as DatabaseFunctionResponse;

      if (!response.success) {
        throw new Error(response.error);
      }

      // Send email notification
      const request = pendingWithdrawals.find(req => req.id === requestId);
      if (request && request.profiles.email !== 'Unknown') {
        if (approve) {
          await sendGeneralNotificationEmail(
            request.profiles.email,
            request.profiles.name,
            {
              title: 'Withdrawal Approved',
              message: `Your withdrawal request for ₦${request.amount.toFixed(2)} has been approved and is being processed.`,
              notificationType: 'success'
            }
          );
        } else {
          await sendGeneralNotificationEmail(
            request.profiles.email,
            request.profiles.name,
            {
              title: 'Withdrawal Rejected',
              message: `Your withdrawal request for ₦${request.amount.toFixed(2)} has been rejected. ${notes ? 'Reason: ' + notes : ''}`,
              notificationType: 'error'
            }
          );
        }
      }

      toast({
        title: approve ? "Withdrawal Approved" : "Withdrawal Rejected",
        description: response.message,
      });

      // Clear the notes for this request
      setAdminNotes(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });

      fetchWithdrawalRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process withdrawal request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalCompletion = async (requestId: string) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const notes = completionNotes[requestId] || null;
      
      const { data, error } = await supabase.rpc('complete_withdrawal', {
        request_id: requestId,
        admin_id: user.id,
        completion_notes: notes
      });

      if (error) throw error;

      // Type cast the response (cast to unknown first as suggested by TypeScript)
      const response = data as unknown as DatabaseFunctionResponse;

      if (!response.success) {
        throw new Error(response.error);
      }

      // Send email notification
      const request = approvedWithdrawals.find(req => req.id === requestId);
      if (request && request.profiles.email !== 'Unknown') {
        await sendGeneralNotificationEmail(
          request.profiles.email,
          request.profiles.name,
          {
            title: 'Withdrawal Completed',
            message: `Your withdrawal of ₦${request.amount.toFixed(2)} has been completed and sent to your bank account.`,
            notificationType: 'success'
          }
        );
      }

      toast({
        title: "Withdrawal Completed",
        description: response.message,
      });

      // Clear the notes for this request
      setCompletionNotes(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });

      fetchWithdrawalRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete withdrawal.",
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
      {/* Summary Cards */}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <div className="text-2xl font-bold">{pendingWithdrawals.length}</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-purple-500/10 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Approved Withdrawals</div>
                <div className="text-2xl font-bold">{approvedWithdrawals.length}</div>
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

      {/* Pending Withdrawal Requests */}
      {pendingWithdrawals.length > 0 && (
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
                  <TableHead>Admin Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWithdrawals.map((request) => (
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
                      <Textarea
                        placeholder="Add notes (optional)"
                        value={adminNotes[request.id] || ''}
                        onChange={(e) => setAdminNotes(prev => ({
                          ...prev,
                          [request.id]: e.target.value
                        }))}
                        className="min-h-[60px] text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWithdrawalApproval(request.id, true)}
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWithdrawalApproval(request.id, false)}
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

      {/* Approved Withdrawal Requests - Ready for Payout */}
      {approvedWithdrawals.length > 0 && (
        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Approved Withdrawals - Ready for Payout</h3>
            <p className="text-sm text-muted-foreground mt-1">
              These withdrawals have been approved and funds deducted. Mark as completed once payout is processed.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Completion Notes</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedWithdrawals.map((request) => (
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
                      {request.processed_at ? formatDate(request.processed_at) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      {request.notes || 'No notes'}
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Reference/notes"
                        value={completionNotes[request.id] || ''}
                        onChange={(e) => setCompletionNotes(prev => ({
                          ...prev,
                          [request.id]: e.target.value
                        }))}
                        className="text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWithdrawalCompletion(request.id)}
                        disabled={loading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Completed
                      </Button>
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
