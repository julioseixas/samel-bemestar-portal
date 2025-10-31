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
      className="group cursor-pointer hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-card border border-border"
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4 h-40">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
          "bg-gradient-to-br from-primary/10 to-primary/5"
        )}>
          <Icon className={cn("h-8 w-8", iconColor)} />
        </div>
        <h3 className="text-sm font-medium text-foreground leading-tight">
          {title}
        </h3>
      </CardContent>
    </Card>
  );
};
