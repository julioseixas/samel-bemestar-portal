import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Ambulance, Clock, User, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { getApiHeaders } from "@/lib/api-headers";
import { jwtDecode } from "jwt-decode";

interface EmergencyQueueItem {
  CD_PESSOA_FISICA: number;
  DS_CLASSIFICACAO: string | null;
  DS_STATUS_ATENDIMENTO: string;
  DT_ATEND_MEDICO: string | null;
  DT_ENTRADA: string;
  DT_ENTRADA_STRING: string;
  DT_FIM_CONSULTA: string | null;
  HR_ENTRADA_STRING: string;
  IE_ORDENACAO: number;
  IE_STATUS_ATENDIMENTO: string;
  NM_PESSOA_FISICA_PACIENTE: string;
  NR_ATENDIMENTO: number;
}

interface EmergencyQueueResponse {
  dados: EmergencyQueueItem[];
  dsPacienteAguarda: string | null;
  dsPacienteAguardaLabel: string | null;
  nmSetorAtendimento: string | null;
  nmUnidade: string | null;
  message: string;
  status: boolean;
}

const EmergencyQueue = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [queueData, setQueueData] = useState<EmergencyQueueResponse | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentPatientIds, setCurrentPatientIds] = useState<number[]>([]);

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
        const ids: number[] = [];
        
        if (decoded.id) {
          ids.push(parseInt(decoded.id));
        }
        
        if (decoded.dependentes && Array.isArray(decoded.dependentes)) {
          decoded.dependentes.forEach((dep: any) => {
            if (dep.id) {
              ids.push(parseInt(dep.id));
            }
          });
        }
        
        setCurrentPatientIds(ids);
      } catch (error) {
        console.error("Erro ao decodificar token:", error);
      }
    }
  }, []);

  const fetchQueueData = useCallback(async () => {
    if (currentPatientIds.length === 0) return;

    try {
      const headers = getApiHeaders();
      
      // Fetch for each patient and combine results
      const allResults: EmergencyQueueItem[] = [];
      let lastResponse: EmergencyQueueResponse | null = null;
      let lastMessage: string | null = null;

      for (const cdPessoaFisica of currentPatientIds) {
        const response = await fetch(
          `https://api-portalpaciente-web.samel.com.br/api/atendimento/obterAtendimentoPS?cd_pessoa_fisica=${cdPessoaFisica}`,
          {
            method: "GET",
            headers,
          }
        );

        const data: EmergencyQueueResponse = await response.json();
        lastMessage = data.message || lastMessage;
        
        if (data.status && data.dados && data.dados.length > 0) {
          allResults.push(...data.dados);
          lastResponse = data;
        }
      }

      if (allResults.length > 0 && lastResponse) {
        setQueueData({
          ...lastResponse,
          dados: allResults,
        });
        setApiMessage(null);
      } else {
        setQueueData(null);
        setApiMessage(lastMessage);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao buscar fila do pronto socorro:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPatientIds]);

  useEffect(() => {
    if (currentPatientIds.length > 0) {
      fetchQueueData();
      const interval = setInterval(fetchQueueData, 3000);
      return () => clearInterval(interval);
    }
  }, [currentPatientIds, fetchQueueData]);

  const getClassificationColor = (classification: string | null) => {
    if (!classification) return "bg-muted text-muted-foreground";
    
    const lowerClassification = classification.toLowerCase();
    if (lowerClassification.includes("vermelho") || lowerClassification.includes("emergência")) {
      return "bg-destructive text-destructive-foreground";
    }
    if (lowerClassification.includes("laranja") || lowerClassification.includes("muito urgente")) {
      return "bg-orange-500 text-white";
    }
    if (lowerClassification.includes("amarelo") || lowerClassification.includes("urgente")) {
      return "bg-yellow-500 text-black";
    }
    if (lowerClassification.includes("verde") || lowerClassification.includes("pouco urgente")) {
      return "bg-green-500 text-white";
    }
    if (lowerClassification.includes("azul") || lowerClassification.includes("não urgente")) {
      return "bg-blue-500 text-white";
    }
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />

      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-10">
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Fila do Pronto Socorro
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/queue-choice")}
              className="flex items-center gap-2 flex-shrink-0 ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Atualização automática a cada 3s</span>
            <span>•</span>
            <span>Última: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
          </div>

          {queueData?.nmUnidade && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">
                Unidade: {queueData.nmUnidade}
              </p>
              {queueData.nmSetorAtendimento && (
                <p className="text-xs text-muted-foreground mt-1">
                  Setor: {queueData.nmSetorAtendimento}
                </p>
              )}
            </div>
          )}

          {queueData?.dsPacienteAguardaLabel && queueData?.dsPacienteAguarda && (
            <div className="mb-4 p-3 bg-accent rounded-lg">
              <p className="text-sm">
                <span className="font-medium">{queueData.dsPacienteAguardaLabel}:</span>{" "}
                {queueData.dsPacienteAguarda}
              </p>
            </div>
          )}

          {isLoading ? (
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
          ) : !queueData || queueData.dados.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ambulance className="h-5 w-5 text-destructive" />
                  Fila do Pronto Socorro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Ambulance className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                    {apiMessage || "Nenhum atendimento de pronto socorro encontrado."}
                  </p>
                  {!apiMessage && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Quando você estiver na fila do pronto socorro, sua posição aparecerá aqui.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {queueData.dados.map((item, index) => {
                const isCurrentPatient = currentPatientIds.includes(item.CD_PESSOA_FISICA);
                return (
                  <Card 
                    key={item.NR_ATENDIMENTO}
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
                          <span className={isCurrentPatient ? "text-primary font-bold truncate" : "truncate"}>
                            {item.NM_PESSOA_FISICA_PACIENTE}
                          </span>
                        </div>
                        {isCurrentPatient && (
                          <span className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs sm:text-sm font-bold px-2 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 sm:gap-1.5 animate-fade-in whitespace-nowrap">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Você</span>
                          </span>
                        )}
                      </CardTitle>
                      {item.DS_CLASSIFICACAO && (
                        <div className="mt-2">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getClassificationColor(item.DS_CLASSIFICACAO)}`}>
                            {item.DS_CLASSIFICACAO}
                          </span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="pt-3 sm:pt-4">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Data de Entrada</p>
                              <p className="font-medium text-sm sm:text-base">{item.DT_ENTRADA_STRING}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                às {item.HR_ENTRADA_STRING}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Status</p>
                              <p className="font-medium text-sm sm:text-base">
                                {item.DS_STATUS_ATENDIMENTO}
                              </p>
                            </div>
                          </div>
                        </div>

                        {item.DT_ATEND_MEDICO && (
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Atendimento Médico</p>
                              <p className="font-medium text-sm sm:text-base">
                                {new Date(item.DT_ATEND_MEDICO).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Atendimento Nº {item.NR_ATENDIMENTO}
                          </p>
                        </div>
                      </div>
                    </CardContent>
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

export default EmergencyQueue;
