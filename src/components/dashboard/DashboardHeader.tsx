
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
    <header className="glass shadow-sm px-6 py-4 sticky top-0 z-10" role="banner">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold tracking-tight" aria-label="PAU Affiliate - Go to homepage">
          <span className="text-primary">PAU</span>Affiliate
        </Link>
        
        <nav className="flex items-center space-x-6" role="navigation" aria-label="Dashboard navigation">
          <NotificationBell 
            notifications={notifications}
            onMarkAsRead={onMarkNotificationAsRead}
            onClearAll={onClearNotifications}
          />
          
          <Link to="/" aria-label="Go to home page">
            <Button variant="ghost" size="sm" className="px-4">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Home
            </Button>
          </Link>
          
          <div className="flex items-center space-x-3" role="group" aria-label="User information">
            <span className="text-sm text-muted-foreground px-3 py-1 bg-secondary/20 rounded-md" aria-label={`User email: ${user?.email}`}>
              {user?.email}
            </span>
            {isAdminUser && (
              <Shield className="h-5 w-5 text-yellow-500" aria-label="Admin user" />
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onLogout} 
            className="px-4"
            aria-label="Logout from dashboard"
          >
            <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default DashboardHeader;
