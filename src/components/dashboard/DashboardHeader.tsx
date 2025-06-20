
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LogOut, Shield } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import NotificationBell from '@/components/notifications/NotificationBell';
import { DashboardNotification } from '@/types/dashboard';

interface DashboardHeaderProps {
  user: {
    email?: string;
    name?: string;
    role?: string;
  };
  notifications: DashboardNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onClearNotifications: () => void;
  onLogout: () => void;
}

const DashboardHeader = ({
  user,
  notifications,
  onMarkNotificationAsRead,
  onClearNotifications,
  onLogout
}: DashboardHeaderProps) => {
  const isAdminUser = user?.role === 'admin';

  return (
    <header className="glass shadow-sm px-4 py-3 sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold tracking-tight">
          <span className="text-primary">PAU</span>Affiliate
        </Link>
        
        <div className="flex items-center space-x-4">
          <NotificationBell 
            notifications={notifications}
            onMarkAsRead={onMarkNotificationAsRead}
            onClearAll={onClearNotifications}
          />
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Home
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
