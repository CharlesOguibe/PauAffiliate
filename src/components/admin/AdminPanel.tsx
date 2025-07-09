
import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Users, Building, DollarSign } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BusinessProfile, WithdrawalRequest, DashboardNotification } from '@/types/dashboard';
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
  const [affiliatePendingWithdrawals, setAffiliatePendingWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [businessPendingWithdrawals, setBusinessPendingWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [affiliateApprovedWithdrawals, setAffiliateApprovedWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [businessApprovedWithdrawals, setBusinessApprovedWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState<{[key: string]: string}>({});
  const [completionNotes, setCompletionNotes] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchBusinesses();
    fetchWithdrawalRequests();
    fetchNotifications();
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

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('Admin notifications query result:', data, error);

      if (data) {
        const transformedNotifications: DashboardNotification[] = data.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type as 'sale' | 'commission' | 'withdrawal' | 'info',
          read: n.read,
          createdAt: new Date(n.created_at)
        }));
        setNotifications(transformedNotifications);
      }
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id);
      
      fetchNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const fetchWithdrawalRequests = async () => {
    try {
      // First get withdrawal requests
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false });

      if (withdrawalError) {
        console.error('Withdrawal query error:', withdrawalError);
        throw withdrawalError;
      }

      console.log('Withdrawal requests:', withdrawalData);

      if (!withdrawalData || withdrawalData.length === 0) {
        console.log('No withdrawal requests found');
        setAffiliatePendingWithdrawals([]);
        setBusinessPendingWithdrawals([]);
        setAffiliateApprovedWithdrawals([]);
        setBusinessApprovedWithdrawals([]);
        return;
      }

      // Get unique affiliate IDs
      const affiliateIds = [...new Set(withdrawalData.map(req => req.affiliate_id))];
      
      // Fetch profiles for these affiliates
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .in('id', affiliateIds);

      if (profilesError) {
        console.error('Profiles query error:', profilesError);
        throw profilesError;
      }

      console.log('Profiles data:', profilesData);

      // Check which users are business users by looking at business_profiles
      const { data: businessProfilesData, error: businessError } = await supabase
        .from('business_profiles')
        .select('id')
        .in('id', affiliateIds);

      if (businessError) {
        console.error('Business profiles query error:', businessError);
      }

      console.log('Business profiles data:', businessProfilesData);

      const businessUserIds = new Set(businessProfilesData?.map(bp => bp.id) || []);

      // Create a map of affiliate ID to email and role
      const profileMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          // Determine actual user type based on business_profiles existence
          const actualRole = businessUserIds.has(profile.id) ? 'business' : 'affiliate';
          profileMap.set(profile.id, { email: profile.email, role: actualRole });
        });
      }

      // Transform the data with proper email lookup and corrected user type
      const transformedData: WithdrawalRequest[] = withdrawalData.map(req => {
        const profile = profileMap.get(req.affiliate_id) || { email: 'No Email Available', role: 'affiliate' };
        console.log(`Request ${req.id}: affiliate_id ${req.affiliate_id} -> email: ${profile.email}, corrected role: ${profile.role}`);
        
        return {
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
            name: profile.role === 'business' ? 'Business User' : 'Affiliate',
            email: profile.email,
            role: profile.role
          }
        };
      });
      
      console.log('Final transformed withdrawal data:', transformedData);
      
      // Split by status and user type
      const pendingRequests = transformedData.filter(req => req.status === 'pending');
      const approvedRequests = transformedData.filter(req => req.status === 'approved');
      
      setAffiliatePendingWithdrawals(pendingRequests.filter(req => req.profiles.role === 'affiliate'));
      setBusinessPendingWithdrawals(pendingRequests.filter(req => req.profiles.role === 'business'));
      setAffiliateApprovedWithdrawals(approvedRequests.filter(req => req.profiles.role === 'affiliate'));
      setBusinessApprovedWithdrawals(approvedRequests.filter(req => req.profiles.role === 'business'));
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

      // Type cast the response
      const response = data as unknown as DatabaseFunctionResponse;

      if (!response.success) {
        throw new Error(response.error);
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

      // Type cast the response
      const response = data as unknown as DatabaseFunctionResponse;

      if (!response.success) {
        throw new Error(response.error);
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

  const renderWithdrawalTable = (requests: WithdrawalRequest[], title: string, showApprovalActions: boolean = false, showCompletionActions: boolean = false) => {
    if (requests.length === 0) return null;

    return (
      <GlassCard className="overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          {showCompletionActions && (
            <p className="text-sm text-muted-foreground mt-1">
              These withdrawals have been approved and funds deducted. Mark as completed once payout is processed.
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bank Details</TableHead>
                <TableHead>{showApprovalActions ? 'Requested' : 'Approved'}</TableHead>
                {showApprovalActions && <TableHead>Admin Notes</TableHead>}
                {showCompletionActions && <TableHead>Notes</TableHead>}
                {showCompletionActions && <TableHead>Completion Notes</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{request.profiles.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.profiles.role === 'business' 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-green-600 bg-green-50'
                    }`}>
                      {request.profiles.role === 'business' ? 'Business' : 'Affiliate'}
                    </span>
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
                    {showApprovalActions ? formatDate(request.created_at) : (request.processed_at ? formatDate(request.processed_at) : '-')}
                  </TableCell>
                  {showApprovalActions && (
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
                  )}
                  {showCompletionActions && (
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      {request.notes || 'No notes'}
                    </TableCell>
                  )}
                  {showCompletionActions && (
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
                  )}
                  <TableCell>
                    {showApprovalActions && (
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
                    )}
                    {showCompletionActions && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWithdrawalCompletion(request.id)}
                        disabled={loading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Completed
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    );
  };

  const totalPendingWithdrawals = affiliatePendingWithdrawals.length + businessPendingWithdrawals.length;
  const totalApprovedWithdrawals = affiliateApprovedWithdrawals.length + businessApprovedWithdrawals.length;

  return (
    <div className="space-y-8 mb-8">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight flex items-center gap-3">
            Admin Panel
            <Shield className="h-6 w-6 text-yellow-500" />
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage businesses, withdrawals, and system notifications
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <GlassCard>
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500/10 p-2 rounded-full">
              <Shield className="h-5 w-5 text-yellow-500" />
            </div>
            <h2 className="text-xl font-semibold">Dashboard Overview</h2>
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
                <div className="text-2xl font-bold">{totalPendingWithdrawals}</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-purple-500/10 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Approved Withdrawals</div>
                <div className="text-2xl font-bold">{totalApprovedWithdrawals}</div>
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

      {/* Pending Withdrawal Requests - Affiliates */}
      {renderWithdrawalTable(affiliatePendingWithdrawals, "Pending Withdrawal Requests", true, false)}

      {/* Pending Withdrawal Requests - Business */}
      {renderWithdrawalTable(businessPendingWithdrawals, "Pending Withdrawal Requests - Business", true, false)}

      {/* Approved Withdrawal Requests - Affiliates */}
      {renderWithdrawalTable(affiliateApprovedWithdrawals, "Approved Withdrawals", false, true)}

      {/* Approved Withdrawal Requests - Business */}
      {renderWithdrawalTable(businessApprovedWithdrawals, "Approved Withdrawals - Business", false, true)}
    </div>
  );
};

export default AdminPanel;
