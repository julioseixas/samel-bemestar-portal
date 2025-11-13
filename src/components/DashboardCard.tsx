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
      className="group h-full flex flex-col rounded-xl sm:rounded-2xl bg-card p-4 sm:p-6 shadow-card transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 md:p-8 cursor-pointer"
      onClick={onClick}
    >
      <div className="mb-3 sm:mb-4 flex items-start justify-between">
        <div className={cn(
          "rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300 group-hover:scale-110",
          iconColor,
          // Backgrounds específicos para cada variante com melhor contraste
          iconColor.includes("destructive") ? "bg-destructive/10 group-hover:bg-destructive/20" :
          iconColor.includes("success") ? "bg-success/10 group-hover:bg-success/20" :
          iconColor.includes("warning") ? "bg-warning/20 group-hover:bg-warning/30" :
          iconColor.includes("primary") ? "bg-primary/10 group-hover:bg-primary/20" :
          "bg-accent/50 group-hover:bg-accent/70"
        )}>
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 transition-transform duration-300 group-hover:rotate-6" />
        </div>
      </div>
      
      <h3 className="mb-2 text-base sm:text-xl font-semibold text-foreground md:text-2xl">
        {title}
      </h3>
      
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
          "w-full text-sm sm:text-base transition-all duration-300 group-hover:translate-y-0.5",
          useDashboardColor && "bg-[hsl(var(--dashboard-button))] text-[hsl(var(--dashboard-button-foreground))] hover:bg-[hsl(var(--dashboard-button))]/90"
        )}
        style={customButtonColor ? { backgroundColor: customButtonColor, color: 'white' } : undefined}
      >
        {buttonText}
      </Button>
    </div>
  );
};
