
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { WithdrawalRequest } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';
import { fetchUserInfo } from '@/utils/userInfo';

interface UserInfo {
  email: string;
  name: string;
  role: string;
}

interface WithdrawalRequestWithUserInfo extends WithdrawalRequest {
  userInfo?: UserInfo;
}

const AdminPanel = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequestWithUserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Separate withdrawal requests by status and user type
  const pendingRequests = withdrawalRequests.filter(req => req.status === 'pending');
  const approvedRequests = withdrawalRequests.filter(req => req.status === 'approved');
  
  const pendingAffiliateRequests = pendingRequests.filter(req => req.userInfo?.role === 'affiliate');
  const pendingBusinessRequests = pendingRequests.filter(req => req.userInfo?.role === 'business');
  const approvedAffiliateRequests = approvedRequests.filter(req => req.userInfo?.role === 'affiliate');
  const approvedBusinessRequests = approvedRequests.filter(req => req.userInfo?.role === 'business');

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching withdrawal requests...');
      
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawal requests:', error);
        throw error;
      }

      console.log('Raw withdrawal requests:', data);

      // Fetch user info for each withdrawal request
      const requestsWithUserInfo = await Promise.all(
        (data || []).map(async (request) => {
          console.log(`Fetching user info for user: ${request.affiliate_id}`);
          const userInfo = await fetchUserInfo(request.affiliate_id);
          console.log(`User info for ${request.affiliate_id}:`, userInfo);
          
          return {
            ...request,
            userInfo,
            profiles: {
              name: userInfo.name,
              email: userInfo.email,
              role: userInfo.role
            }
          };
        })
      );

      console.log('Withdrawal requests with user info:', requestsWithUserInfo);
      setWithdrawalRequests(requestsWithUserInfo);
    } catch (error) {
      console.error('Error in fetchWithdrawalRequests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch withdrawal requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc('process_withdrawal_approval', {
        request_id: requestId,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        approve: true
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Withdrawal request approved successfully",
      });

      fetchWithdrawalRequests();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to approve withdrawal request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc('process_withdrawal_approval', {
        request_id: requestId,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        approve: false
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Withdrawal request rejected",
      });

      fetchWithdrawalRequests();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to reject withdrawal request",
        variant: "destructive",
      });
    }
  };

  const handleCompleteWithdrawal = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc('complete_withdrawal', {
        request_id: requestId,
        admin_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Withdrawal marked as completed",
      });

      fetchWithdrawalRequests();
    } catch (error) {
      console.error('Error completing withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to complete withdrawal",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchWithdrawalRequests();
  }, []);

  const renderWithdrawalTable = (requests: WithdrawalRequestWithUserInfo[], title: string, showActions: boolean = false, isApproved: boolean = false) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-muted-foreground">No withdrawal requests found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bank Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                {showActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.userInfo?.name || 'Unknown'}</TableCell>
                  <TableCell>{request.userInfo?.email || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={request.userInfo?.role === 'business' ? 'default' : 'secondary'}
                      className={request.userInfo?.role === 'business' ? 'bg-blue-500' : 'bg-green-500'}
                    >
                      {request.userInfo?.role === 'business' ? 'Business' : 'Affiliate'}
                    </Badge>
                  </TableCell>
                  <TableCell>₦{request.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{request.bank_name}</div>
                      <div>{request.account_number}</div>
                      <div>{request.account_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      request.status === 'completed' ? 'default' :
                      request.status === 'approved' ? 'secondary' :
                      request.status === 'rejected' ? 'destructive' : 'outline'
                    }>
                      {request.status}
                    </Badge>
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <div className="flex space-x-2">
                        {!isApproved ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteWithdrawal(request.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading admin panel...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAffiliateRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Business</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBusinessRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      {renderWithdrawalTable(pendingAffiliateRequests, "Pending Withdrawal Requests", true, false)}
      {renderWithdrawalTable(pendingBusinessRequests, "Pending Withdrawal Requests - Business", true, false)}
      {renderWithdrawalTable(approvedAffiliateRequests, "Approved Withdrawals", true, true)}
      {renderWithdrawalTable(approvedBusinessRequests, "Approved Withdrawals - Business", true, true)}
    </div>
  );
};

export default AdminPanel;
