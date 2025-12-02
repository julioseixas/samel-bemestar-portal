import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";
import { jwtDecode } from "jwt-decode";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: number;
  dataAgenda: string;
  nomeProfissional: string;
  descricaoEspecialidade?: string;
  especialidade?: string;
  nomeUnidade?: string;
  tipoAgendamento: number;
  procedimentos?: { descricao: string }[];
  nomeCliente?: string;
  cancelado: boolean;
  realizado: boolean;
}

type StatusFilter = "todos" | "realizada" | "agendada" | "cancelada";
type TypeFilter = "todos" | "consulta" | "exame";

const AppointmentHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");

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

    fetchAppointmentHistory();
  }, []);

  const fetchAppointmentHistory = async () => {
    setIsLoading(true);
    try {
      const userToken = localStorage.getItem("user");
      if (!userToken) {
        navigate("/login");
        return;
      }

      const decoded: any = jwtDecode(userToken);
      const pacientesIds = [parseInt(decoded.id)];

      if (decoded.dependentes && Array.isArray(decoded.dependentes)) {
        decoded.dependentes.forEach((dep: any) => {
          if (dep.id) pacientesIds.push(parseInt(dep.id));
        });
      }

      // Busca consultas (tipo 0)
      const consultasResponse = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarAgendamentos2",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({ pacientes: pacientesIds, tipo: 0 }),
        }
      );

      // Busca exames (tipo 1)
      const examesResponse = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarAgendamentos2",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({ pacientes: pacientesIds, tipo: 1 }),
        }
      );

      const consultasData = await consultasResponse.json();
      const examesData = await examesResponse.json();

      const allAppointments: Appointment[] = [];

      // Processa consultas (sem filtro de cancelado)
      if (consultasData.sucesso && consultasData.dados) {
        const consultas = consultasData.dados.map((ag: any) => ({ ...ag, tipoAgendamento: 0 }));
        allAppointments.push(...consultas);
      }

      // Processa exames (sem filtro de cancelado)
      if (examesData.sucesso && examesData.dados) {
        const exames = examesData.dados.map((ag: any) => ({ ...ag, tipoAgendamento: 1 }));
        allAppointments.push(...exames);
      }

      // Ordena por data (mais recentes primeiro)
      allAppointments.sort((a, b) => {
        const dateA = parse(a.dataAgenda, 'yyyy/MM/dd HH:mm:ss', new Date());
        const dateB = parse(b.dataAgenda, 'yyyy/MM/dd HH:mm:ss', new Date());
        return dateB.getTime() - dateA.getTime();
      });

      setAppointments(allAppointments);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o histórico de atendimentos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parse(dateString, 'yyyy/MM/dd HH:mm:ss', new Date());
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parse(dateString, 'yyyy/MM/dd HH:mm:ss', new Date());
      return format(date, "HH:mm");
    } catch {
      return "";
    }
  };

  const getSpecialtyOrProcedure = (appointment: Appointment) => {
    if (appointment.tipoAgendamento === 1) {
      return appointment.procedimentos?.[0]?.descricao || "Exame";
    }
    return appointment.descricaoEspecialidade || appointment.especialidade || "Consulta";
  };

  const getAppointmentStatus = (appointment: Appointment) => {
    if (appointment.cancelado) {
      return { label: "Cancelada", className: "bg-destructive/10 text-destructive border-destructive/20", key: "cancelada" as const };
    }
    if (appointment.realizado) {
      return { label: "Realizada", className: "bg-success/10 text-success border-success/20", key: "realizada" as const };
    }
    return { label: "Agendada", className: "bg-warning/10 text-warning border-warning/20", key: "agendada" as const };
  };

  const filteredAppointments = appointments.filter((appointment) => {
    // Filtro de status
    if (statusFilter !== "todos") {
      const status = getAppointmentStatus(appointment);
      if (status.key !== statusFilter) return false;
    }
    // Filtro de tipo
    if (typeFilter !== "todos") {
      const isExame = appointment.tipoAgendamento === 1;
      if (typeFilter === "exame" && !isExame) return false;
      if (typeFilter === "consulta" && isExame) return false;
    }
    return true;
  });

  const filterButtons: { key: StatusFilter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "realizada", label: "Realizadas" },
    { key: "agendada", label: "Agendadas" },
    { key: "cancelada", label: "Canceladas" },
  ];

  const typeFilterButtons: { key: TypeFilter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "consulta", label: "Consultas" },
    { key: "exame", label: "Exames" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />

      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Histórico de Atendimentos
              </h1>
              <p className="text-sm text-muted-foreground">
                Consulte todas as suas consultas e exames
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            {/* Filtros de status */}
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((filter) => (
                <Button
                  key={filter.key}
                  variant={statusFilter === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(filter.key)}
                  className="text-xs sm:text-sm"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            {/* Filtros de tipo */}
            <div className="flex flex-wrap gap-2">
              {typeFilterButtons.map((filter) => (
                <Button
                  key={filter.key}
                  variant={typeFilter === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter(filter.key)}
                  className="text-xs sm:text-sm"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-300px)] pr-1">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nenhum atendimento encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    {statusFilter === "todos" 
                      ? "Você ainda não possui histórico de consultas ou exames."
                      : `Nenhum atendimento com status "${filterButtons.find(f => f.key === statusFilter)?.label}" encontrado.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredAppointments.map((appointment) => {
                  const status = getAppointmentStatus(appointment);
                  return (
                    <Card key={`${appointment.id}-${appointment.tipoAgendamento}`} className="overflow-hidden border-2 border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                appointment.tipoAgendamento === 1 
                                  ? "bg-success/10 text-success" 
                                  : "bg-primary/10 text-primary"
                              }`}>
                                {appointment.tipoAgendamento === 1 ? "Exame" : "Consulta"}
                              </span>
                              <Badge variant="outline" className={status.className}>
                                {status.label}
                              </Badge>
                            </div>
                            
                            <h3 className="font-semibold text-foreground">
                              {getSpecialtyOrProcedure(appointment)}
                            </h3>

                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{appointment.nomeProfissional || "Profissional não informado"}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(appointment.dataAgenda)}</span>
                                <Clock className="h-4 w-4 ml-2" />
                                <span>{formatTime(appointment.dataAgenda)}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{appointment.nomeUnidade || "Local não informado"}</span>
                              </div>

                              {appointment.nomeCliente && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-medium">Paciente:</span>
                                  <span>{appointment.nomeCliente}</span>
                                </div>
                              )}
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
        </div>
      </main>

    </div>
  );
};

export default AppointmentHistory;
