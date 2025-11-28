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
      className="group h-full flex flex-col rounded-xl xs:rounded-2xl bg-card p-2.5 xs:p-3 sm:p-5 md:p-6 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-primary/30 active:scale-[0.99] cursor-pointer"
      onClick={onClick}
    >
      <div className="mb-2 xs:mb-3 sm:mb-4 flex items-start justify-between">
        <div className={cn(
          "rounded-lg xs:rounded-xl p-1.5 xs:p-2 sm:p-3 md:p-3.5 transition-all duration-300 group-hover:scale-105",
          iconColor,
          // Backgrounds específicos para cada variante com melhor contraste
          iconColor.includes("destructive") ? "bg-destructive/10 group-hover:bg-destructive/15" :
          iconColor.includes("success") ? "bg-success/10 group-hover:bg-success/15" :
          iconColor.includes("warning") ? "bg-warning/20 group-hover:bg-warning/25" :
          iconColor.includes("primary") ? "bg-primary/10 group-hover:bg-primary/15" :
          "bg-accent/50 group-hover:bg-accent/60"
        )}>
          <Icon className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 transition-transform duration-300 group-hover:rotate-3" />
        </div>
      </div>
      
      <h3 className="mb-1 xs:mb-2 text-xs xs:text-sm sm:text-lg md:text-xl font-bold text-foreground leading-tight">
        {title}
      </h3>
      
      <p className="mb-2 xs:mb-3 sm:mb-5 flex-1 text-[11px] xs:text-xs sm:text-base text-muted-foreground leading-snug xs:leading-relaxed line-clamp-2 xs:line-clamp-3 sm:line-clamp-none">
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
          "w-full text-base font-semibold transition-all duration-300 group-hover:shadow-sm h-11 hidden sm:flex",
          useDashboardColor && "bg-[hsl(var(--dashboard-button))] text-[hsl(var(--dashboard-button-foreground))] hover:bg-[hsl(var(--dashboard-button))]/90"
        )}
        style={customButtonColor ? { backgroundColor: customButtonColor, color: 'white' } : undefined}
      >
        {buttonText}
      </Button>
    </div>
  );
};
