import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";
import gsap from "gsap";
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
  onGoToIndex?: (index: number) => void;
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
  onGoToIndex,
  currentIndex = 0,
  totalItems = 1,
}: AppointmentBannerProps) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(currentIndex);
  const { toast } = useToast();

  // Detecta direção do movimento
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      if (currentIndex > prevIndexRef.current || (prevIndexRef.current === totalItems - 1 && currentIndex === 0)) {
        setDirection('next');
      } else {
        setDirection('prev');
      }
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex, totalItems]);

  // Animação GSAP ao trocar de slide - efeito de deslizar mais lento
  useEffect(() => {
    if (!contentRef.current) return;

    const ctx = gsap.context(() => {
      // Define de onde vem baseado na direção
      const fromX = direction === 'next' ? 100 : direction === 'prev' ? -100 : 100;
      
      // Anima entrada do novo slide com deslizamento bem mais lento
      gsap.fromTo(
        contentRef.current,
        {
          x: fromX,
          opacity: 0,
        },
        {
          x: 0,
          opacity: 1,
          duration: 1.5,
          ease: "power1.inOut",
        }
      );
    });

    return () => ctx.revert();
  }, [currentIndex, direction]);

  // Auto-play carrossel
  useEffect(() => {
    if (!showNavigation || isPaused || totalItems <= 1) return;

    const interval = setInterval(() => {
      onNext?.();
    }, 5000);

    return () => clearInterval(interval);
  }, [showNavigation, isPaused, onNext, totalItems]);

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
      <div 
        className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary-hover p-4 sm:p-6 text-primary-foreground shadow-card md:p-8 relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Content wrapper com animação GSAP */}
        <div ref={contentRef}>
          {/* Navigation arrows */}
          {showNavigation && (
            <>
              <button
                onClick={onPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-all hover:scale-110 z-10"
                aria-label="Agendamento anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={onNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-all hover:scale-110 z-10"
                aria-label="Próximo agendamento"
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
        
        <div className="space-y-4">
          {/* Nome do Exame/Consulta - Destaque Principal */}
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{specialty}</p>
          </div>

          <div className="border-t border-primary-foreground/20 pt-4 space-y-3">
            {/* Data e Horário */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                <div>
                  <p className="text-xs opacity-80">Data</p>
                  <p className="text-sm sm:text-base font-semibold capitalize">{date}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <div>
                  <p className="text-xs opacity-80">Horário</p>
                  <p className="text-sm sm:text-base font-semibold">{time}</p>
                </div>
              </div>
            </div>

            {/* Profissional */}
            <div className="flex items-center gap-2">
              <div className="bg-primary-foreground/20 p-1.5 rounded-md">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs opacity-80">Profissional</p>
                <p className="text-sm sm:text-base font-semibold">{doctor}</p>
              </div>
            </div>

            {/* Local */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs opacity-80">Local</p>
                <p className="text-sm sm:text-base font-semibold">{location}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-primary-foreground/20">
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

        {/* Indicadores (dots) */}
        {showNavigation && totalItems > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalItems }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => onGoToIndex?.(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'w-6 bg-primary-foreground' 
                    : 'w-2 bg-primary-foreground/40 hover:bg-primary-foreground/60'
                }`}
                aria-label={`Ir para agendamento ${idx + 1}`}
              />
            ))}
          </div>
        )}
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
