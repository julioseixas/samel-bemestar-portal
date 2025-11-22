import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { MapDialog } from "@/components/MapDialog";

interface AppointmentBannerProps {
  appointments: Array<{
    date: string;
    time: string;
    doctor: string;
    specialty: string;
    location: string;
    appointmentId?: number;
    tipoAgendamento?: number;
  }>;
  onCancel?: () => void;
}

export const AppointmentBanner = ({
  appointments,
  onCancel,
}: AppointmentBannerProps) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | undefined>();
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<number | undefined>();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isPaused, setIsPaused] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedUnitName, setSelectedUnitName] = useState("");
  const { toast } = useToast();

  // Auto-play carousel
  useEffect(() => {
    if (!carouselApi || isPaused || appointments.length <= 1) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselApi, isPaused, appointments.length]);

  const handleCancelClick = (appointmentId?: number, tipoAgendamento?: number) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedAppointmentType(tipoAgendamento);
    setShowCancelDialog(true);
  };

  const handleMapClick = (appointment: any) => {
    setSelectedLocation(appointment.location);
    setSelectedUnitName(appointment.specialty); // Use specialty as unit identifier
    setShowMapDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointmentId || selectedAppointmentType === undefined) return;

    setIsCanceling(true);

    try {
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/CancelarAgendamento",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            idHorarioAgenda: selectedAppointmentId,
            tipoAgendamento: selectedAppointmentType
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

  if (appointments.length === 0) return null;

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {appointments.map((appointment, index) => (
              <CarouselItem key={index}>
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-hover p-5 sm:p-7 text-primary-foreground shadow-lg md:p-9">
                  <div className="mb-4 sm:mb-5 flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span className="text-sm sm:text-base font-semibold md:text-lg">
                        Próximo Agendamento
                      </span>
                    </div>
                    {appointments.length > 1 && (
                      <span className="text-sm sm:text-base opacity-90 font-medium">
                        {index + 1}/{appointments.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-5">
                    {/* Nome do Exame/Consulta - Destaque Principal */}
                    <div>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
                        {appointment.specialty}
                      </p>
                    </div>

                    <div className="border-t border-primary-foreground/20 pt-5 space-y-4">
                      {/* Data e Horário */}
                      <div className="flex flex-wrap gap-5">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary-foreground/15 p-2 rounded-lg">
                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm opacity-90 mb-0.5">Data</p>
                            <p className="text-base sm:text-lg font-bold capitalize leading-tight">
                              {appointment.date}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="bg-primary-foreground/15 p-2 rounded-lg">
                            <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm opacity-90 mb-0.5">Horário</p>
                            <p className="text-base sm:text-lg font-bold leading-tight">
                              {appointment.time}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Profissional */}
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-foreground/15 p-2 rounded-lg">
                          <svg
                            className="h-5 w-5 sm:h-6 sm:w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm opacity-90 mb-0.5">Profissional</p>
                          <p className="text-base sm:text-lg font-bold leading-tight">
                            {appointment.doctor}
                          </p>
                        </div>
                      </div>

                      {/* Local */}
                      <div className="flex items-start gap-3">
                        <div className="bg-primary-foreground/15 p-2 rounded-lg">
                          <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm opacity-90 mb-0.5">Local</p>
                          <p className="text-base sm:text-lg font-bold leading-tight">
                            {appointment.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-5 border-t border-primary-foreground/20">
                    <Button
                      variant="destructive"
                      size="lg"
                      className="flex-1 text-sm sm:text-base font-semibold h-12"
                      onClick={() => handleCancelClick(appointment.appointmentId, appointment.tipoAgendamento)}
                      disabled={isCanceling}
                    >
                      Cancelar Agendamento
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary text-sm sm:text-base font-semibold h-12"
                      onClick={() => handleMapClick(appointment)}
                    >
                      Como Chegar
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {appointments.length > 1 && (
            <>
              <CarouselPrevious className="left-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 border-0 text-primary-foreground" />
              <CarouselNext className="right-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 border-0 text-primary-foreground" />
            </>
          )}
        </Carousel>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-normal break-words">
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={isCanceling} className="w-full sm:w-auto">
              <span className="sm:hidden">Manter</span>
              <span className="hidden sm:inline">Não, manter agendamento</span>
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={isCanceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              {isCanceling ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelando...
                </span>
              ) : (
                <>
                  <span className="sm:hidden">Cancelar</span>
                  <span className="hidden sm:inline">Sim, cancelar agendamento</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MapDialog
        open={showMapDialog}
        onOpenChange={setShowMapDialog}
        location={selectedLocation}
        unitName={selectedUnitName}
      />
    </>
  );
};
