import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Pill } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getApiHeaders } from "@/lib/api-headers";

interface PrescriptionItem {
  idAtendimento: number;
  idPrescricao: number;
  dsHorario: string;
  dataHorario: string;
  dataLiberacao: string;
  dataValidade: string;
  dsAgrupador: string;
  dsMaterial: string;
  idAgrupador: number;
}

interface GroupedPrescriptions {
  [key: string]: PrescriptionItem[];
}

export default function PrescriptionsTracking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<GroupedPrescriptions>({});

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedPhoto = localStorage.getItem("profilePhoto");

    if (storedTitular) {
      try {
        const parsedTitular = storedTitular.startsWith('{') 
          ? JSON.parse(storedTitular) 
          : { nome: storedTitular };
        setPatientName(parsedTitular.titular?.nome || parsedTitular.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao processar titular:", error);
        setPatientName(storedTitular);
      }
    }

    if (storedPhoto) {
      setProfilePhoto(storedPhoto);
    }

    // Buscar prescrições
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const hospitalizationData = localStorage.getItem("hospitalizationData");
      
      if (!hospitalizationData) {
        toast({
          title: "Erro",
          description: "Dados de internação não encontrados",
          variant: "destructive",
        });
        navigate("/hospitalization-options");
        return;
      }

      const parsedData = JSON.parse(hospitalizationData);
      const idAtendimento = parsedData.idAtendimento;

      if (!idAtendimento) {
        toast({
          title: "Erro",
          description: "ID de atendimento não encontrado",
          variant: "destructive",
        });
        navigate("/hospitalization-options");
        return;
      }

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Internacao/ObterPrescricao2",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({ idAtendimento }),
        }
      );

      const data = await response.json();

      if (data.mensagem) {
        toast({
          title: data.sucesso ? "Sucesso" : "Aviso",
          description: data.mensagem,
          variant: data.sucesso ? "default" : "destructive",
        });
      }

      if (data.sucesso && data.dados && Array.isArray(data.dados)) {
        // Agrupar por dsAgrupador
        const grouped = data.dados.reduce((acc: GroupedPrescriptions, item: PrescriptionItem) => {
          const key = item.dsAgrupador || "Sem Agrupador";
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(item);
          return acc;
        }, {});

        setPrescriptions(grouped);
      }
    } catch (error) {
      console.error("Erro ao buscar prescrições:", error);
      toast({
        title: "Erro",
        description: "Erro ao buscar prescrições. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground md:text-3xl">
                Prescrições da Internação
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/hospitalization-options")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visualize as prescrições médicas da sua internação
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Carregando prescrições...</p>
              </CardContent>
            </Card>
          ) : Object.keys(prescriptions).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhuma prescrição encontrada para este atendimento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(prescriptions).map(([agrupador, items]) => (
                <Card key={agrupador} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                        <Pill className="h-5 w-5 text-primary" />
                        {agrupador}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {items.length} {items.length === 1 ? "item" : "itens"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div
                          key={`${item.idPrescricao}-${index}`}
                          className="p-4 rounded-lg bg-muted/50 border border-border"
                        >
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Material/Medicamento</p>
                              <p className="font-semibold text-base">{item.dsMaterial}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Horário</p>
                                <p className="text-sm font-medium">{item.dsHorario || "-"}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-muted-foreground">Data/Hora</p>
                                <p className="text-sm font-medium">{formatDateTime(item.dataHorario)}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-muted-foreground">Liberação</p>
                                <p className="text-sm font-medium">{formatDateTime(item.dataLiberacao)}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-muted-foreground">Validade</p>
                                <p className="text-sm font-medium">{formatDateTime(item.dataValidade)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
}
