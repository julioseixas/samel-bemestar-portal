import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
}

export const FeatureCard = ({ 
  title, 
  icon: Icon, 
  iconColor = "text-primary",
  onClick 
}: FeatureCardProps) => {
  return (
    <Card 
      className="group relative cursor-pointer overflow-hidden bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="relative p-8 flex flex-col items-center justify-center text-center space-y-4 h-44">
        {/* Icon container with animated background */}
        <div className={cn(
          "relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
          "group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md"
        )}>
          <div className="absolute inset-0 rounded-2xl bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300" />
          <Icon className={cn("relative h-10 w-10 transition-transform duration-300 group-hover:scale-110", iconColor)} strokeWidth={1.5} />
        </div>
        
        {/* Title with better typography */}
        <h3 className="text-sm font-semibold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
      </CardContent>
    </Card>
  );
};
