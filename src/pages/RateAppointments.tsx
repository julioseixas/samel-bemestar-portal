import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { getApiHeaders } from "@/lib/api-headers";

interface AvaliacaoResponse {
  status: string;
  message: string;
  dados: {
    status: boolean;
    dados: {
      enviadas: AvaliacaoPendente[];
      pendentes: AvaliacaoPendente[];
    };
  };
}

interface AvaliacaoPendente {
  nr_atendimento: number;
  nm_medico: string;
  dados: {
    DS_LOCAL: string;
    DT_ENTRADA: string; // formato: dd/MM/yyyy HH:mm:ss
  };
}

const RateAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AvaliacaoPendente[]>([]);
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

    fetchPendingEvaluations();
  }, []);

  const fetchPendingEvaluations = async () => {
    setLoading(true);
    try {
      const userToken = localStorage.getItem("user");
      
      if (!userToken) {
        setLoading(false);
        return;
      }

      const decoded: any = jwtDecode(userToken);
      
      const pacientesIds: number[] = [parseInt(decoded.id)];
      
      if (decoded.dependentes && Array.isArray(decoded.dependentes)) {
        decoded.dependentes.forEach((dep: any) => {
          if (dep.id) pacientesIds.push(parseInt(dep.id));
        });
      }

      const allPendingEvaluations: AvaliacaoPendente[] = [];
      
      for (const id of pacientesIds) {
        try {
          const response = await fetch(
            `https://appv2-back.samel.com.br/api/atendimento/listarUltimasRespostas/${id}`,
            {
              method: "GET",
              headers: getApiHeaders(),
            }
          );

          const data: AvaliacaoResponse = await response.json();
          
          if (data.dados?.dados?.pendentes && Array.isArray(data.dados.dados.pendentes)) {
            allPendingEvaluations.push(...data.dados.dados.pendentes);
          }
        } catch (error) {
          console.error(`Erro ao buscar avaliações para o ID ${id}:`, error);
        }
      }

      if (allPendingEvaluations.length > 0) {
        console.log("Estrutura de avaliação pendente:", allPendingEvaluations[0]);
      }

      setAppointments(allPendingEvaluations);
    } catch (error) {
      console.error("Erro ao buscar avaliações pendentes:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar suas avaliações pendentes.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-10">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-warning/10 p-3">
                <Star className="h-8 w-8 text-warning" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  SUA OPINIÃO IMPORTA!
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Avalie seus atendimentos e nos ajude a melhorar
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
                <p className="text-muted-foreground">Carregando atendimentos...</p>
              </div>
            </div>
          ) : appointments.length === 0 ? (
            <Card>
              <CardDescription className="py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">
                  Nenhum atendimento para avaliar
                </p>
                <p className="text-muted-foreground">
                  Você ainda não possui atendimentos realizados para avaliar.
                </p>
              </CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.map((avaliacao) => {
                const appointmentId = String(avaliacao.nr_atendimento);
                
                return (
                  <Card key={appointmentId} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-accent/50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {avaliacao.dados.DS_LOCAL || "Atendimento"}
                        </CardTitle>
                        <Badge variant="outline" className="flex items-center gap-1 bg-warning/10 text-warning border-warning/20">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </Badge>
                      </div>
                      <CardDescription className="space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="space-y-1">
                            <div className="font-medium">
                              {avaliacao.nm_medico}
                            </div>
                            <div className="text-sm">
                              {avaliacao.dados.DT_ENTRADA}
                            </div>
                          </div>
                        </div>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RateAppointments;
