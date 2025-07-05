
import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/custom/GlassCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WithdrawalRequest {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  processed_at?: string;
  notes?: string;
}

interface WithdrawalHistoryProps {
  withdrawalRequests: WithdrawalRequest[];
}

const WithdrawalHistory = ({ withdrawalRequests }: WithdrawalHistoryProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'approved':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Under review';
      case 'approved':
        return 'Approved - Processing payout';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (withdrawalRequests.length === 0) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Withdrawal History</h3>
        <p className="text-muted-foreground">No withdrawal requests yet.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Withdrawal History</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Track the status of your withdrawal requests
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Processed</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawalRequests.map((request) => (
              <TableRow key={request.id}>
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
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <div className="flex flex-col">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {getStatusDescription(request.status)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(request.created_at)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {request.processed_at ? formatDate(request.processed_at) : '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs">
                  {request.notes ? (
                    <div className="truncate" title={request.notes}>
                      {request.notes}
                    </div>
                  ) : (
                    '-'
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

export default WithdrawalHistory;
