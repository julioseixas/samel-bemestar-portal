import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, User, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { getApiHeaders } from "@/lib/api-headers";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";

interface QueueItem {
  dataAgenda: string;
  dataChegada: string;
  horaChegada: string;
  horario: string;
  idAgenda: number;
  idAgendamento: number;
  idCliente: string;
  status: string;
  statusDescricao: string;
  posicaoAtual: number;
}

const ConsultationQueueDetails = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [queueData, setQueueData] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [previousPosition, setPreviousPosition] = useState<number | null>(null);

  const playNotificationSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, []);

  const idAgenda = searchParams.get("idAgenda");
  const especialidade = searchParams.get("especialidade") || "";
  const unidade = searchParams.get("unidade") || "";

  useEffect(() => {
    const patientData = localStorage.getItem("patientData");
    const photo = localStorage.getItem("profilePhoto");
    const userToken = localStorage.getItem("user");

    if (patientData) {
      try {
        const data = JSON.parse(patientData);
        setPatientName(data.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao carregar dados do paciente:", error);
      }
    }

    if (photo) {
      setProfilePhoto(photo);
    }

    if (userToken) {
      try {
        const decoded: any = jwtDecode(userToken);
        if (decoded.id) {
          setCurrentPatientId(decoded.id);
        }
      } catch (error) {
        console.error("Erro ao decodificar token:", error);
      }
    }
  }, []);

  const fetchQueueData = useCallback(async () => {
    if (!idAgenda) return;

    try {
      const headers = getApiHeaders();
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarFilaAtendimentoPresencial",
        {
          method: "POST",
          headers,
          body: JSON.stringify({ idAgenda: parseInt(idAgenda) }),
        }
      );

      const data = await response.json();

      if (data.sucesso && data.dados) {
        const newQueueData = Array.isArray(data.dados) ? data.dados : [data.dados];
        setQueueData(newQueueData);
        
        // Check if current patient's position changed
        if (currentPatientId) {
          const currentPatientIndex = newQueueData.findIndex(
            (item: QueueItem) => item.idCliente === currentPatientId
          );
          
          if (currentPatientIndex !== -1) {
            const newPosition = currentPatientIndex + 1;
            if (previousPosition !== null && newPosition !== previousPosition) {
              playNotificationSound();
              toast({
                title: "Posição atualizada!",
                description: `Sua nova posição na fila: #${newPosition}`,
              });
            }
            setPreviousPosition(newPosition);
          }
        }
      } else {
        setQueueData([]);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao buscar fila de atendimento:", error);
    } finally {
      setIsLoading(false);
    }
  }, [idAgenda, currentPatientId, previousPosition, playNotificationSound, toast]);

  useEffect(() => {
    if (!idAgenda) {
      toast({
        title: "Erro",
        description: "ID da agenda não encontrado",
        variant: "destructive",
      });
      navigate("/consultation-queue");
      return;
    }

    fetchQueueData();

    const interval = setInterval(fetchQueueData, 3000);

    return () => clearInterval(interval);
  }, [idAgenda, fetchQueueData, navigate, toast]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />

      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-10">
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Fila de Atendimento
              </h1>
              {(especialidade || unidade) && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {especialidade}{especialidade && unidade && " - "}{unidade}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/consultation-queue")}
              className="flex items-center gap-2 flex-shrink-0 ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Atualização automática a cada 3s</span>
            <span>•</span>
            <span>Última: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="py-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : queueData.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Nenhum dado de fila encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {queueData.map((item, index) => {
                const isCurrentPatient = currentPatientId && item.idCliente === currentPatientId;
                return (
                  <Card 
                    key={index}
                    className={isCurrentPatient 
                      ? "border-primary border-2 bg-primary/5 shadow-lg shadow-primary/20 animate-scale-in relative overflow-hidden" 
                      : ""
                    }
                  >
                    {isCurrentPatient && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
                    )}
                    <CardHeader className={isCurrentPatient ? "pb-2 sm:pb-3" : "pb-2 sm:pb-4"}>
                      <CardTitle className="flex items-center justify-between gap-2 text-base sm:text-lg">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {isCurrentPatient ? (
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary fill-primary/20 flex-shrink-0" />
                          ) : (
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                          )}
                          <span className={isCurrentPatient ? "text-primary font-bold" : ""}>
                            Posição #{index + 1}
                          </span>
                        </div>
                        {isCurrentPatient && (
                          <span className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs sm:text-sm font-bold px-2 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 sm:gap-1.5 animate-fade-in whitespace-nowrap">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Sua Posição</span>
                            <span className="sm:hidden">Você</span>
                          </span>
                        )}
                      </CardTitle>
                      {index === 0 && (
                        <div className="mt-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary rounded animate-fade-in">
                          <p className="text-xs sm:text-sm font-semibold text-primary">
                            🎯 Próximo a ser atendido
                          </p>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="pt-3 sm:pt-4">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Horário da Consulta</p>
                              <p className="font-medium text-sm sm:text-base">{item.horario || "Não informado"}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDate(item.dataAgenda)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Horário do Check-in</p>
                              <p className="font-medium text-sm sm:text-base">{item.horaChegada || "Não informado"}</p>
                              {item.horaChegada && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {formatDate(item.dataChegada)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <p className="font-medium text-sm sm:text-base">
                              {item.status === "AC" || item.status === "O" || item.status === "M"
                                ? (item.statusDescricao || "Não informado")
                                : "Paciente ainda não chegou"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ConsultationQueueDetails;
