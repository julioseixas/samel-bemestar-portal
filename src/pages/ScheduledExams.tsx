import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, MapPin, User, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";
import { Skeleton } from "@/components/ui/skeleton";
import { jwtDecode } from "jwt-decode";

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
}

const ScheduledExams = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [exams, setExams] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

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
            tipo: 0
          }),
        }
      );

      const data = await response.json();

      if (data.sucesso && data.dados) {
        // Filtra apenas exames (tipoAgendamento === 1) e não cancelados
        const examsList = data.dados.filter(
          (agendamento: Agendamento) => 
            !agendamento.cancelado && agendamento.tipoAgendamento === 1
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/scheduled-appointments-choice")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Exames Agendados
          </h1>
          <p className="text-muted-foreground">
            Visualize todos os seus exames laboratoriais agendados
          </p>
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
          <div className="space-y-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {exam.descricaoEspecialidade}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {exam.id}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{formatDate(exam.dataAgenda)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{formatTime(exam.dataAgenda)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-primary" />
                      <span>{exam.nomeCliente}</span>
                    </div>

                    <div className="flex items-start gap-2 text-sm md:col-span-2">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{exam.nomeUnidade}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ScheduledExams;
