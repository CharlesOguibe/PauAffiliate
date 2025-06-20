
import React from 'react';
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "link" | "primary" | "secondary" | "accent" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, CustomButtonProps>(({
  children,
  className,
  variant = "default",
  size = "default",
  isLoading = false,
  loadingText,
  ...props
}, ref) => {
  
  // Function to determine the className based on variant
  const getVariant = () => {
    switch (variant) {
      case "primary":
        return "bg-primary text-primary-foreground hover:bg-primary/90";
      case "secondary":
        return "bg-secondary text-secondary-foreground hover:bg-secondary/90";
      case "accent":
        return "bg-accent text-accent-foreground hover:bg-[#8B5CF6]"; // Vivid purple on hover
      case "destructive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "outline":
        return "border border-input bg-transparent hover:bg-[#9b87f5]/10 hover:text-[#9b87f5]"; // Primary purple with transparency
      case "ghost":
        return "hover:bg-[#7E69AB]/10 hover:text-[#7E69AB]"; // Secondary purple with transparency
      case "link":
        return "text-primary underline-offset-4 hover:text-[#6E59A5]"; // Tertiary purple on hover
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
  };
  
  return (
    <ShadcnButton
      ref={ref}
      className={cn(
        getVariant(),
        size === "sm" && "h-9 rounded-md px-3",
        size === "lg" && "h-11 rounded-md px-8",
        size === "icon" && "h-10 w-10",
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </ShadcnButton>
  );
});

Button.displayName = "Button";

export default Button;
