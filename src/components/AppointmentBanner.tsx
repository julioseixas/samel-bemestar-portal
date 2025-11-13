import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

interface AppointmentBannerProps {
  appointments: Array<{
    date: string;
    time: string;
    doctor: string;
    specialty: string;
    location: string;
    appointmentId?: number;
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  // Auto-play carousel
  useEffect(() => {
    if (!carouselApi || isPaused || appointments.length <= 1) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselApi, isPaused, appointments.length]);

  const handleCancelClick = (appointmentId?: number) => {
    setSelectedAppointmentId(appointmentId);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointmentId) return;

    setIsCanceling(true);

    try {
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/CancelarAgendamento",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            idAgenda: selectedAppointmentId,
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
                <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary-hover p-4 sm:p-6 text-primary-foreground shadow-card md:p-8">
                  <div className="mb-3 sm:mb-4 flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm font-medium md:text-base">
                        Próximo Agendamento
                      </span>
                    </div>
                    {appointments.length > 1 && (
                      <span className="text-xs sm:text-sm opacity-80">
                        {index + 1}/{appointments.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    {/* Nome do Exame/Consulta - Destaque Principal */}
                    <div>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold">
                        {appointment.specialty}
                      </p>
                    </div>

                    <div className="border-t border-primary-foreground/20 pt-4 space-y-3">
                      {/* Data e Horário */}
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                          <div>
                            <p className="text-xs opacity-80">Data</p>
                            <p className="text-sm sm:text-base font-semibold capitalize">
                              {appointment.date}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                          <div>
                            <p className="text-xs opacity-80">Horário</p>
                            <p className="text-sm sm:text-base font-semibold">
                              {appointment.time}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Profissional */}
                      <div className="flex items-center gap-2">
                        <div className="bg-primary-foreground/20 p-1.5 rounded-md">
                          <svg
                            className="h-4 w-4"
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
                          <p className="text-xs opacity-80">Profissional</p>
                          <p className="text-sm sm:text-base font-semibold">
                            {appointment.doctor}
                          </p>
                        </div>
                      </div>

                      {/* Local */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs opacity-80">Local</p>
                          <p className="text-sm sm:text-base font-semibold">
                            {appointment.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-primary-foreground/20">
                    <Button
                      variant="destructive"
                      size="lg"
                      className="flex-1 text-sm sm:text-base"
                      onClick={() => handleCancelClick(appointment.appointmentId)}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>
              Não, manter agendamento
            </AlertDialogCancel>
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
