import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TestTube, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { getApiHeaders } from "@/lib/api-headers";
import { toast } from "@/hooks/use-toast";

interface AgendaExame {
  idAgenda?: number;
  descricaoEspecialidade?: string;
  nomeUnidade?: string;
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

  const handleCardClick = (agenda: AgendaExame) => {
    if (!agenda.idAgenda) {
      toast({
        title: "Erro",
        description: "ID da agenda não encontrado",
        variant: "destructive",
      });
      return;
    }

    const params = new URLSearchParams({
      idAgenda: String(agenda.idAgenda),
      especialidade: agenda.descricaoEspecialidade || "",
      unidade: agenda.nomeUnidade || "",
    });

    navigate(`/exam-queue-details?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />

      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate min-w-0 flex-1">
              Exames do Dia
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
                <Card 
                  key={agenda.idAgenda || index} 
                  className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50"
                  onClick={() => handleCardClick(agenda)}
                >
                  <CardContent className="p-4 sm:p-6 space-y-3">
                    {/* Especialidade */}
                    <div className="flex items-start gap-2">
                      <TestTube className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Especialidade</p>
                        <p className="font-medium text-foreground truncate">
                          {agenda.descricaoEspecialidade || "Não informada"}
                        </p>
                      </div>
                    </div>

                    {/* Local */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Local</p>
                        <p className="text-sm text-foreground truncate">
                          {agenda.nomeUnidade || "Não informado"}
                        </p>
                      </div>
                    </div>
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
