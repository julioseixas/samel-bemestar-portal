import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface QueueItem {
  idAgendamento: number;
  idAgenda: number;
  idCliente: string;
  dataAgenda: string;
  dataChegada: string;
  horaChegada: string;
  horario: string;
  status: string;
  statusDescricao: string;
}

const TelemedicineQueue = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromCall = searchParams.get("fromCall") === "true";
  
  const [patientName, setPatientName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [queueData, setQueueData] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const storedQueueData = localStorage.getItem("telemedicineQueueData");
    const storedSelectedPatient = localStorage.getItem("selectedPatientOnlineConsultation");

    if (storedTitular) {
      try {
        const parsedTitular = storedTitular.startsWith('{') 
          ? JSON.parse(storedTitular) 
          : { nome: storedTitular };
        setPatientName(parsedTitular.titular?.nome || parsedTitular.nome || "Paciente");
      } catch (error) {
        setPatientName(storedTitular);
      }
    }

    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }

    if (storedSelectedPatient) {
      try {
        const parsedPatient = JSON.parse(storedSelectedPatient);
        setSelectedPatientId(parsedPatient.id);
        setSelectedPatientName(parsedPatient.nome || "Paciente");
      } catch (error) {
        // Silent fail
      }
    }

    if (storedQueueData) {
      try {
        const parsedQueue = JSON.parse(storedQueueData);
        setQueueData(Array.isArray(parsedQueue) ? parsedQueue : [parsedQueue]);
      } catch (error) {
        toast.error("Erro ao carregar dados da fila");
      }
    } else {
      toast.error("Dados da fila não encontrados");
    }
    
    setLoading(false);
  }, []);

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
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Fila de Atendimento
              </h2>
              <Button
                variant="outline"
                onClick={() => fromCall ? navigate(-1) : navigate("/online-consultation-details")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visualize sua posição na fila de telemedicina
            </p>
          </div>

          {loading ? (
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
                const isCurrentPatient = selectedPatientId && item.idCliente === selectedPatientId;
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
                            <span className="hidden sm:inline">{selectedPatientName}</span>
                            <span className="sm:hidden">{selectedPatientName.split(' ')[0]}</span>
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

export default TelemedicineQueue;
