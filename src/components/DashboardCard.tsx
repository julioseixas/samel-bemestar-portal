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
}

export const DashboardCard = ({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  buttonText,
  onClick,
  variant = "default",
}: DashboardCardProps) => {
  return (
    <div className="group flex flex-col rounded-2xl bg-card p-6 shadow-card transition-all hover:shadow-lg md:p-8">
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("rounded-xl bg-accent p-4", iconColor)}>
          <Icon className="h-8 w-8 md:h-10 md:w-10" />
        </div>
      </div>
      
      <h3 className="mb-2 text-xl font-semibold text-foreground md:text-2xl">
        {title}
      </h3>
      
      <p className="mb-6 flex-1 text-sm text-muted-foreground md:text-base">
        {description}
      </p>
      
      <Button 
        onClick={onClick} 
        variant={variant}
        size="lg"
        className="w-full"
      >
        {buttonText}
      </Button>
    </div>
  );
};
