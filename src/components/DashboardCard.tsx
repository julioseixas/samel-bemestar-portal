import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  buttonText: string;
  onClick?: () => void;
  variant?: "default" | "success" | "warning" | "destructive" | "secondary" | "outline" | "ghost" | "link";
  useDashboardColor?: boolean;
  customButtonColor?: string;
}

export const DashboardCard = ({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  buttonText,
  onClick,
  variant = "default",
  useDashboardColor = false,
  customButtonColor,
}: DashboardCardProps) => {
  return (
    <div 
      className="group flex flex-col rounded-xl sm:rounded-2xl bg-card p-4 sm:p-6 shadow-card transition-all hover:shadow-lg md:p-8 cursor-pointer"
      onClick={onClick}
    >
      <div className="mb-3 sm:mb-4 flex items-center gap-3">
        <div className={cn(
          "rounded-lg p-2 sm:p-2.5 flex-shrink-0",
          iconColor,
          // Background específico para destructive
          iconColor.includes("destructive") ? "bg-destructive/10" : "bg-accent"
        )}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-foreground md:text-lg flex-1">
          {title}
        </h3>
      </div>
      
      <p className="mb-4 sm:mb-6 flex-1 text-xs sm:text-sm text-muted-foreground md:text-base">
        {description}
      </p>
      
      <Button 
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        variant={variant}
        size="lg"
        className={cn(
          "w-full text-sm sm:text-base",
          useDashboardColor && "bg-[hsl(var(--dashboard-button))] text-[hsl(var(--dashboard-button-foreground))] hover:bg-[hsl(var(--dashboard-button))]/90"
        )}
        style={customButtonColor ? { backgroundColor: customButtonColor, color: 'white' } : undefined}
      >
        {buttonText}
      </Button>
    </div>
  );
};
