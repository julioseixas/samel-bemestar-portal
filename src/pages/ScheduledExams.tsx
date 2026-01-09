import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, User, TestTube, XCircle, Stethoscope, Building2, Loader2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";
import { Skeleton } from "@/components/ui/skeleton";
import { jwtDecode } from "jwt-decode";
import { parse, isAfter } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Agendamento {
  id: number;
  idAgenda: number;
  dataAgenda: string;
  dataAgenda2: string;
  cancelado: boolean;
  dataCancelamento: string | null;
  dataAgendamento: string | null;
  dataRealizacao: string | null;
  descricaoEspecialidade: string;
  idAtendimento: number;
  idEspecialidade: number;
  idProfissional: number;
  nomeCliente: string;
  nomeProfissional: string;
  nomeUnidade: string;
  possuiResultado: boolean;
  procedimentos: any[];
  tipoAgenda: string;
  tipoAgendamento: number;
  statusAgenda?: string;
}

const ScheduledExams = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [exams, setExams] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    const patientData = localStorage.getItem("patientData");
    const photo = localStorage.getItem("profilePhoto");
    
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

    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const userToken = localStorage.getItem("user");
      if (!userToken) {
        toast({
          title: "Erro",
          description: "Token de autenticação não encontrado",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const decoded: any = jwtDecode(userToken);
      
      // Monta array com ID do titular e dependentes
      const pacientesIds = [parseInt(decoded.id)];
      
      if (decoded.dependentes && Array.isArray(decoded.dependentes)) {
        decoded.dependentes.forEach((dep: any) => {
          if (dep.id) {
            pacientesIds.push(parseInt(dep.id));
          }
        });
      }

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarAgendamentos2",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            pacientes: pacientesIds,
            tipo: 1
          }),
        }
      );

      const data = await response.json();

      if (data.sucesso && data.dados) {
        // Filtra apenas exames (tipoAgendamento === 1) e não cancelados
        const examsList = data.dados.filter(
          (agendamento: Agendamento) => {
            // 1. Não mostrar se cancelado
            if (agendamento.cancelado) return false;
            
            // 2. Não mostrar se statusAgenda for "O"
            if (agendamento.statusAgenda === "O") return false;
            
            // 3. Não mostrar se dataAgenda for menor que data atual (mostrar apenas futuros)
            try {
              const agendaDate = parse(agendamento.dataAgenda, 'yyyy/MM/dd HH:mm:ss', new Date());
              if (!isAfter(agendaDate, new Date())) return false;
            } catch (error) {
              console.error("Erro ao parsear data:", error);
              return false;
            }
            
            // Filtrar apenas exames
            return agendamento.tipoAgendamento === 1;
          }
        );
        setExams(examsList);
      } else {
        toast({
          title: "Aviso",
          description: data.mensagem || "Nenhum exame agendado encontrado",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar exames:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar exames agendados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const handleCancelClick = (examId: number) => {
    setCancelingId(examId);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelingId) return;

    setIsCanceling(true);

    try {
      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/CancelarAgendamento",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            idHorarioAgenda: cancelingId,
            tipoAgendamento: 1
          }),
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        toast({
          description: data.mensagem,
        });
        // Atualiza a lista removendo o exame cancelado
        setExams(exams.filter(exam => exam.id !== cancelingId));
      } else {
        toast({
          description: data.mensagem || "Erro ao cancelar exame",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao cancelar exame:", error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar exame",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
      setShowCancelDialog(false);
      setCancelingId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Exames Agendados
            </h1>
            <p className="text-muted-foreground">
              Visualize todos os seus exames laboratoriais agendados
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => navigate("/scheduled-appointments-choice")}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
            size="sm"
          >
            ← Voltar
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </Card>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <Card className="p-12 text-center">
            <TestTube className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhum exame agendado</h3>
            <p className="text-muted-foreground mb-6">
              Você não possui exames agendados no momento
            </p>
            <Button onClick={() => navigate("/exam-schedule")}>
              Agendar Novo Exame
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {exams.map((exam) => (
              <Card key={exam.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
                <CardHeader className="bg-muted/50 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          <TestTube className="h-3 w-3 mr-1" />
                          Exame
                        </Badge>
                        <span className="text-xs text-muted-foreground">ID: {exam.id}</span>
                      </div>
                      
                      {exam.procedimentos && exam.procedimentos.length > 0 && (
                        <h3 className="text-xl font-bold text-foreground">
                          {exam.procedimentos[0].descricao}
                        </h3>
                      )}
                      
                      <p className="text-sm text-muted-foreground">
                        {exam.descricaoEspecialidade}
                      </p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelClick(exam.id);
                      }}
                      className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-5">
                  {/* Data e Hora */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-lg">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Data</p>
                        <p className="text-sm font-semibold">{formatDate(exam.dataAgenda)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-lg">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Horário</p>
                        <p className="text-sm font-semibold">{formatTime(exam.dataAgenda)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Informações Pessoais */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Informações
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-secondary/50 p-2 rounded-md">
                          <User className="h-4 w-4 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Paciente</p>
                          <p className="text-sm font-medium">{exam.nomeCliente}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-secondary/50 p-2 rounded-md">
                          <Stethoscope className="h-4 w-4 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Profissional</p>
                          <p className="text-sm font-medium">{exam.nomeProfissional}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Local */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Local do Exame
                    </h4>
                    <div className="flex items-start gap-3 bg-accent/50 p-4 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{exam.nomeUnidade}</p>
                      </div>
                    </div>
                  </div>

                  {/* Preparo do Exame */}
                  {exam.procedimentos && exam.procedimentos.some(proc => proc.descricaoPreparo) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Preparo do Exame
                        </h4>
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg space-y-2">
                          {exam.procedimentos
                            .filter(proc => proc.descricaoPreparo)
                            .map((proc, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <FileText className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{proc.descricao}</p>
                                  <p className="text-sm text-foreground whitespace-pre-line">{proc.descricaoPreparo}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este exame? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>Não, manter exame</AlertDialogCancel>
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
                "Sim, cancelar exame"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScheduledExams;
