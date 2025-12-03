import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Stethoscope, MapPin, Clock, User, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getApiHeaders } from "@/lib/api-headers";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";

interface ConsultaFila {
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
  descricaoEspecialidade: string;
  nomeUnidade: string;
}

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

const ConsultationQueue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [consultas, setConsultas] = useState<ConsultaFila[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [queueData, setQueueData] = useState<QueueItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState<ConsultaFila | null>(null);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);

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

    fetchConsultasAgendadas();
  }, []);

  const fetchConsultasAgendadas = async () => {
    setIsLoading(true);
    try {
      const userToken = localStorage.getItem("user");
      if (!userToken) {
        toast({
          title: "Erro",
          description: "Token de autenticação não encontrado",
          variant: "destructive",
        });
        return;
      }

      const decoded: any = jwtDecode(userToken);
      
      const pacientesIds: number[] = [];
      
      if (decoded.id) {
        pacientesIds.push(parseInt(decoded.id));
      }
      
      if (decoded.dependentes && Array.isArray(decoded.dependentes)) {
        decoded.dependentes.forEach((dep: any) => {
          if (dep.id) pacientesIds.push(parseInt(dep.id));
        });
      }

      if (pacientesIds.length === 0) {
        toast({
          title: "Erro",
          description: "Dados do paciente não encontrados",
          variant: "destructive",
        });
        return;
      }

      const headers = getApiHeaders();
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarConsultasAgendadas",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            pacientes: pacientesIds,
          }),
        }
      );

      const data = await response.json();

      if (data.sucesso && data.dados) {
        setConsultas(data.dados);
      } else {
        setConsultas([]);
      }
    } catch (error) {
      console.error("Erro ao buscar consultas agendadas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a fila de consultas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQueueData = async (idAgenda: number) => {
    setQueueLoading(true);
    try {
      const headers = getApiHeaders();
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarFilaAtendimentoPresencial",
        {
          method: "POST",
          headers,
          body: JSON.stringify({ idAgenda }),
        }
      );

      const data = await response.json();

      if (data.sucesso && data.dados) {
        setQueueData(Array.isArray(data.dados) ? data.dados : [data.dados]);
      } else {
        setQueueData([]);
        toast({
          title: "Aviso",
          description: data.mensagem || "Nenhum dado de fila encontrado",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar fila de atendimento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a fila de atendimento",
        variant: "destructive",
      });
    } finally {
      setQueueLoading(false);
    }
  };

  const handleConsultaClick = (consulta: ConsultaFila) => {
    setSelectedConsulta(consulta);
    setQueueModalOpen(true);
    fetchQueueData(consulta.idAgenda);
  };

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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate min-w-0 flex-1">
              Consultas do dia
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate("/queue-choice")}
              className="flex items-center gap-2 flex-shrink-0 shrink-0 ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 sm:p-6">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : consultas.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-10 flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <Stethoscope className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    Nenhuma consulta na fila
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Você não possui consultas na fila no momento.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {consultas.map((consulta) => (
                <Card 
                  key={consulta.idAgendamento} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleConsultaClick(consulta)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-2">
                      {consulta.descricaoEspecialidade && (
                        <div className="flex items-center gap-2 text-sm">
                          <Stethoscope className="h-4 w-4 text-primary" />
                          <span className="font-medium">Especialidade:</span>
                          <span className="text-muted-foreground">{consulta.descricaoEspecialidade}</span>
                        </div>
                      )}

                      {consulta.nomeUnidade && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">Unidade:</span>
                          <span className="text-muted-foreground">{consulta.nomeUnidade}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal da Fila de Atendimento */}
      <Dialog open={queueModalOpen} onOpenChange={setQueueModalOpen}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-1.5rem)] h-[75vh] sm:max-w-2xl sm:h-auto sm:max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl">
              Fila de Atendimento
            </DialogTitle>
            {selectedConsulta && (
              <p className="text-sm text-muted-foreground">
                {selectedConsulta.descricaoEspecialidade} - {selectedConsulta.nomeUnidade}
              </p>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {queueLoading ? (
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsultationQueue;
