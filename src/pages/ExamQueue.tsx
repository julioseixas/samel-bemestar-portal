import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, User, MapPin, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { getApiHeaders } from "@/lib/api-headers";
import { toast } from "@/hooks/use-toast";

interface AgendaExame {
  idAgendamento?: number;
  id?: number;
  nomeCliente?: string;
  nomePaciente?: string;
  nomeProfissional?: string;
  nmMedico?: string;
  especialidade?: string;
  descricaoEspecialidade?: string;
  dsEspecialidade?: string;
  dataAgenda?: string;
  dataAgenda2?: string;
  dtAgenda?: string;
  horario?: string;
  hora?: string;
  local?: string;
  unidade?: string;
  dsUnidade?: string;
  nomeUnidade?: string;
  status?: string;
  statusDescricao?: string;
  procedimentos?: { descricao?: string }[];
  [key: string]: any;
}

const ExamQueue = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [agendas, setAgendas] = useState<AgendaExame[]>([]);
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

    fetchAgendas();
  }, []);

  const fetchAgendas = async () => {
    setLoading(true);
    try {
      const userToken = localStorage.getItem("user");
      if (!userToken) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const decoded: any = jwtDecode(userToken);
      const pacientesIds: number[] = [];

      // Adiciona titular
      if (decoded.id) {
        pacientesIds.push(Number(decoded.id));
      }

      // Adiciona dependentes
      if (decoded.dependentes && Array.isArray(decoded.dependentes)) {
        decoded.dependentes.forEach((dep: any) => {
          if (dep.id) {
            pacientesIds.push(Number(dep.id));
          }
        });
      }

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarExameagendadas",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({ pacientes: pacientesIds }),
        }
      );

      const data = await response.json();

      if (data.dados && Array.isArray(data.dados)) {
        setAgendas(data.dados);
      } else if (Array.isArray(data)) {
        setAgendas(data);
      } else {
        setAgendas([]);
      }
    } catch (error) {
      console.error("Erro ao buscar agendas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as agendas. Tente novamente.",
        variant: "destructive",
      });
      setAgendas([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Data não informada";
    
    // Se já está no formato brasileiro, retorna diretamente
    if (dateStr.includes("/")) return dateStr.split(" ")[0];
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return dateStr;
    }
  };

  const getTime = (agenda: AgendaExame) => {
    return agenda.horario || agenda.hora || 
           (agenda.dataAgenda?.includes(" ") ? agenda.dataAgenda.split(" ")[1] : null) ||
           (agenda.dataAgenda2?.includes(" ") ? agenda.dataAgenda2.split(" ")[1] : null) ||
           "Horário não informado";
  };

  const getPatientName = (agenda: AgendaExame) => {
    return agenda.nomeCliente || agenda.nomePaciente || "Paciente";
  };

  const getProfessionalName = (agenda: AgendaExame) => {
    return agenda.nomeProfissional || agenda.nmMedico || "Profissional não informado";
  };

  const getExamName = (agenda: AgendaExame) => {
    if (agenda.procedimentos && agenda.procedimentos.length > 0) {
      return agenda.procedimentos[0].descricao || "Exame não informado";
    }
    return agenda.especialidade || agenda.descricaoEspecialidade || agenda.dsEspecialidade || "Exame não informado";
  };

  const getLocation = (agenda: AgendaExame) => {
    return agenda.local || agenda.unidade || agenda.dsUnidade || agenda.nomeUnidade || null;
  };

  const getDate = (agenda: AgendaExame) => {
    return formatDate(agenda.dataAgenda || agenda.dataAgenda2 || agenda.dtAgenda);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />

      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate min-w-0 flex-1">
              Fila de Exames
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

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 sm:p-6 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : agendas.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-10 flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <TestTube className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    Nenhum exame na fila
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Você não possui exames agendados no momento.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agendas.map((agenda, index) => (
                <Card key={agenda.idAgendamento || agenda.id || index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6 space-y-3">
                    {/* Paciente */}
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Paciente</p>
                        <p className="font-medium text-foreground truncate">{getPatientName(agenda)}</p>
                      </div>
                    </div>

                    {/* Exame */}
                    <div className="flex items-start gap-2">
                      <TestTube className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Exame</p>
                        <p className="font-medium text-foreground truncate">{getExamName(agenda)}</p>
                      </div>
                    </div>

                    {/* Profissional */}
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Profissional</p>
                        <p className="text-sm text-foreground truncate">{getProfessionalName(agenda)}</p>
                      </div>
                    </div>

                    {/* Data e Horário */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{getDate(agenda)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{getTime(agenda)}</span>
                      </div>
                    </div>

                    {/* Local (se disponível) */}
                    {getLocation(agenda) && (
                      <div className="flex items-start gap-2 pt-2 border-t border-border">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground truncate">{getLocation(agenda)}</p>
                      </div>
                    )}

                    {/* Status (se disponível) */}
                    {(agenda.status || agenda.statusDescricao) && (
                      <div className="pt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {agenda.statusDescricao || agenda.status}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExamQueue;
