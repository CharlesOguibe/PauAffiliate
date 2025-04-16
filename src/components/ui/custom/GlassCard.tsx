
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard = ({ children, className, hover = false, ...props }: GlassCardProps) => {
  return (
    <div
      className={cn(
        'glass rounded-xl p-6 transition-all duration-300',
        hover && 'hover:shadow-lg hover:scale-[1.01]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
