import { Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppointmentBannerProps {
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  location: string;
}

export const AppointmentBanner = ({
  date,
  time,
  doctor,
  specialty,
  location,
}: AppointmentBannerProps) => {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-hover p-6 text-primary-foreground shadow-card md:p-8">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        <span className="text-sm font-medium md:text-base">Próxima Consulta</span>
      </div>
      
      <div className="mb-6 space-y-3">
        <div>
          <p className="text-2xl font-bold md:text-3xl">{date}</p>
          <div className="mt-1 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <p className="text-lg md:text-xl">{time}</p>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 pt-3">
          <p className="font-semibold md:text-lg">{doctor}</p>
          <p className="text-sm text-primary-foreground/90">{specialty}</p>
        </div>
        
        <div className="flex items-start gap-2">
          <MapPin className="mt-1 h-4 w-4 flex-shrink-0" />
          <p className="text-sm text-primary-foreground/90">{location}</p>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          size="lg"
          className="flex-1 border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
        >
          Reagendar
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          className="flex-1 border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
        >
          Como Chegar
        </Button>
      </div>
    </div>
  );
};
