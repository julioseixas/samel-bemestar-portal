import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User, AlertCircle } from "lucide-react";
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
  const [patientName, setPatientName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [queueData, setQueueData] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const storedQueueData = localStorage.getItem("telemedicineQueueData");

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
                onClick={() => navigate("/online-consultation-details")}
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
              {queueData.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-primary" />
                      Atendimento #{item.idAgendamento}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Horário da Consulta</p>
                            <p className="font-medium">{item.horario || "Não informado"}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(item.dataAgenda)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Horário do Check-in</p>
                            <p className="font-medium">{item.horaChegada || "Não informado"}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(item.dataChegada)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="font-medium">
                            {item.status === "AC" || item.status === "O" || item.status === "M"
                              ? (item.statusDescricao || "Não informado")
                              : "Paciente ainda não chegou"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TelemedicineQueue;
