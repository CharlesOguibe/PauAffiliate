
import React, { useState, useEffect } from 'react';
import { Bell, Check, X, DollarSign, Clock, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'sale' | 'commission' | 'withdrawal' | 'info';
  read: boolean;
  createdAt: Date;
}

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

const NotificationBell = ({ notifications, onMarkAsRead, onClearAll }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'commission':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'withdrawal':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const parseWithdrawalDetails = (message: string) => {
    // Extract details from withdrawal notification messages
    const amountMatch = message.match(/₦([\d,]+\.?\d*)/);
    const bankMatch = message.match(/Bank: ([^,]+)/);
    const accountMatch = message.match(/Account: ([^(]+)\(([^)]+)\)/);
    
    return {
      amount: amountMatch ? amountMatch[1] : null,
      bank: bankMatch ? bankMatch[1] : null,
      accountNumber: accountMatch ? accountMatch[1].trim() : null,
      accountName: accountMatch ? accountMatch[2] : null
    };
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearAll}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => {
              const isWithdrawal = notification.type === 'withdrawal';
              const withdrawalDetails = isWithdrawal ? parseWithdrawalDetails(notification.message) : null;
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      
                      {isWithdrawal && withdrawalDetails ? (
                        <div className="mt-2 space-y-2">
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-orange-800">Withdrawal Request</span>
                              <span className="text-lg font-bold text-orange-600">
                                ₦{withdrawalDetails.amount}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs text-orange-700">
                              {withdrawalDetails.bank && (
                                <div><span className="font-medium">Bank:</span> {withdrawalDetails.bank}</div>
                              )}
                              {withdrawalDetails.accountNumber && (
                                <div><span className="font-medium">Account:</span> {withdrawalDetails.accountNumber}</div>
                              )}
                              {withdrawalDetails.accountName && (
                                <div><span className="font-medium">Name:</span> {withdrawalDetails.accountName}</div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {notification.message.split('.')[0]}.
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
