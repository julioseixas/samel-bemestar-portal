import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface AppointmentBannerProps {
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  location: string;
  appointmentId?: number;
  onCancel?: () => void;
  showNavigation?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalItems?: number;
}

export const AppointmentBanner = ({
  date,
  time,
  doctor,
  specialty,
  location,
  appointmentId,
  onCancel,
  showNavigation = false,
  onPrevious,
  onNext,
  currentIndex = 0,
  totalItems = 1,
}: AppointmentBannerProps) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const { toast } = useToast();

  const handleCancelConfirm = async () => {
    if (!appointmentId) return;

    setIsCanceling(true);

    try {
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/CancelarAgendamento",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            idAgenda: appointmentId,
            justificativa: "Cancelamento via portal do paciente"
          }),
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        toast({
          title: "Agendamento cancelado",
          description: "Seu agendamento foi cancelado com sucesso.",
        });
        onCancel?.();
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao cancelar",
          description: data.mensagem || "Não foi possível cancelar o agendamento.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível conectar ao servidor.",
      });
    } finally {
      setIsCanceling(false);
      setShowCancelDialog(false);
    }
  };

  return (
    <>
      <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary-hover p-4 sm:p-6 text-primary-foreground shadow-card md:p-8 relative">
        {/* Navigation arrows */}
        {showNavigation && (
          <>
            <button
              onClick={onPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors z-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors z-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="mb-3 sm:mb-4 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm font-medium md:text-base">Próximo Agendamento</span>
          </div>
          {showNavigation && (
            <span className="text-xs sm:text-sm opacity-80">
              {currentIndex + 1}/{totalItems}
            </span>
          )}
        </div>
        
        <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
          <div>
            <p className="text-xl sm:text-2xl font-bold md:text-3xl capitalize">{date}</p>
            <div className="mt-1 flex items-center gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <p className="text-base sm:text-lg md:text-xl">{time}</p>
            </div>
          </div>
          
          <div className="border-t border-primary-foreground/20 pt-2 sm:pt-3">
            <p className="text-sm sm:text-base font-semibold md:text-lg">{doctor}</p>
            <p className="text-xs sm:text-sm text-primary-foreground/90">{specialty}</p>
          </div>
          
          <div className="flex items-start gap-2">
            <MapPin className="mt-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-primary-foreground/90">{location}</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="destructive" 
            size="lg"
            className="flex-1 text-sm sm:text-base"
            onClick={() => setShowCancelDialog(true)}
            disabled={isCanceling}
          >
            Cancelar Agendamento
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="flex-1 border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary text-sm sm:text-base"
          >
            Reagendar
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="flex-1 border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary text-sm sm:text-base"
          >
            Como Chegar
          </Button>
        </div>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>Não, manter agendamento</AlertDialogCancel>
            <Button 
              onClick={handleCancelConfirm} 
              disabled={isCanceling}
              variant="destructive"
            >
              {isCanceling ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelando...
                </span>
              ) : (
                "Sim, cancelar agendamento"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
