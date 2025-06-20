
import React from 'react';
import { Shield } from 'lucide-react';

interface DashboardWelcomeProps {
  user: {
    name?: string;
    role?: string;
  };
}

const DashboardWelcome = ({ user }: DashboardWelcomeProps) => {
  const isAdminUser = user?.role === 'admin';
  const isAffiliateUser = user?.role === 'affiliate';
  const isBusinessUser = user?.role === 'business';

  const getRoleText = () => {
    if (isAffiliateUser) return 'affiliate';
    if (isBusinessUser) return 'business';
    return 'admin';
  };

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-medium tracking-tight">
        Welcome back, {user?.name}!
        {isAdminUser && <Shield className="inline-block h-6 w-6 ml-2 text-yellow-500" />}
      </h1>
      <p className="text-muted-foreground mt-2">
        Your {getRoleText()} dashboard overview
      </p>
    </div>
  );
};

export default DashboardWelcome;
