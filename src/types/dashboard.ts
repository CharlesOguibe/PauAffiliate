
export interface WithdrawalRequest {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  processed_at?: string;
  affiliate_id: string;
  profiles: {
    name: string;
    email: string;
  };
}

export interface BusinessProfile {
  id: string;
  name: string;
  description: string;
  verified: boolean;
  verification_requested_at: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface DashboardEarnings {
  total: number;
  pending: number;
  available: number;
  thisMonth: number;
}

export interface DashboardTransaction {
  id: string;
  type: 'commission' | 'withdrawal';
  amount: number;
  description: string;
  date: Date;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: 'sale' | 'commission' | 'withdrawal' | 'info';
  read: boolean;
  createdAt: Date;
}
