
import React from 'react';
import { Shield, LogOut } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import NotificationBell from '@/components/notifications/NotificationBell';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'sale' | 'commission' | 'withdrawal' | 'info';
  read: boolean;
  createdAt: Date;
}

interface DashboardHeaderProps {
  user: User | null;
  notifications: Notification[];
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
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-foreground">Affiliate Bridge</h1>
            {isAdminUser && (
              <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Admin</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell
              notifications={notifications}
              onMarkAsRead={onMarkNotificationAsRead}
              onClearAll={onClearNotifications}
            />
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
