import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Stethoscope, MapPin } from "lucide-react";
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

const ConsultationQueue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [consultas, setConsultas] = useState<ConsultaFila[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      
      // Usa cdPessoaFisica do titular (pode estar em diferentes campos do token)
      const titularId = decoded.cdPessoaFisica || decoded.cd_pessoa_fisica || decoded.id;
      const pacientesIds: number[] = [];
      
      if (titularId) {
        pacientesIds.push(parseInt(titularId));
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

  const handleConsultaClick = (consulta: ConsultaFila) => {
    const params = new URLSearchParams({
      idAgenda: consulta.idAgenda.toString(),
      especialidade: consulta.descricaoEspecialidade || "",
      unidade: consulta.nomeUnidade || "",
    });
    navigate(`/consultation-queue-details?${params.toString()}`);
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
    </div>
  );
};

export default ConsultationQueue;
