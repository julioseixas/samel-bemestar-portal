import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Ambulance, Clock, User, AlertCircle, RefreshCw, CheckCircle, Users, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
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

interface WaitTimeData {
  dia_semana: string;
  tempo_medio_de_espera_em_minutos: string;
  qtd_paciente_fila: string;
}

interface WaitTimeSector {
  setor_de_atendimento: string;
  dados: WaitTimeData[];
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
  const [waitTimeData, setWaitTimeData] = useState<WaitTimeSector[]>([]);
  const previousStatusRef = useRef<Map<number, string>>(new Map());
  const previousCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.error("Erro ao reproduzir som:", error);
    }
  }, []);

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
        // Check for changes only after first load
        if (!isFirstLoadRef.current) {
          let shouldPlaySound = false;
          
          // Check for list size changes (additions or removals)
          if (allResults.length !== previousCountRef.current) {
            shouldPlaySound = true;
          }
          
          // Check for status changes
          if (!shouldPlaySound) {
            for (const item of allResults) {
              if (currentPatientIds.some(id => Number(id) === Number(item.CD_PESSOA_FISICA))) {
                const previousStatus = previousStatusRef.current.get(item.NR_ATENDIMENTO);
                if (previousStatus && previousStatus !== item.DS_STATUS_ATENDIMENTO) {
                  shouldPlaySound = true;
                  break;
                }
              }
            }
          }
          
          if (shouldPlaySound) {
            playNotificationSound();
          }
        }
        
        // Update previous refs
        const newStatusMap = new Map<number, string>();
        allResults.forEach(item => {
          newStatusMap.set(item.NR_ATENDIMENTO, item.DS_STATUS_ATENDIMENTO);
        });
        previousStatusRef.current = newStatusMap;
        previousCountRef.current = allResults.length;
        isFirstLoadRef.current = false;
        
        setQueueData({
          ...lastResponse,
          dados: allResults,
        });
        setApiMessage(null);
        
        // Fetch wait time data when queue has results
        fetchWaitTimeData();
      } else {
        // Play sound if list became empty (was not empty before)
        if (!isFirstLoadRef.current && previousCountRef.current > 0) {
          playNotificationSound();
        }
        previousCountRef.current = 0;
        isFirstLoadRef.current = false;
        setQueueData(null);
        setApiMessage(lastMessage);
        setWaitTimeData([]);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao buscar fila do pronto socorro:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPatientIds]);

  const fetchWaitTimeData = async () => {
    try {
      const headers = getApiHeaders();
      const response = await fetch(
        "https://appv2-back.samel.com.br/api/atendimento/obterMediaDiasSemana",
        {
          method: "GET",
          headers,
        }
      );
      
      const data = await response.json();
      if (data.status && data.dados && Array.isArray(data.dados)) {
        setWaitTimeData(data.dados);
      }
    } catch (error) {
      console.error("Erro ao buscar tempo médio de espera:", error);
    }
  };

  useEffect(() => {
    if (currentPatientIds.length > 0) {
      fetchQueueData();
      const interval = setInterval(fetchQueueData, 3000);
      return () => clearInterval(interval);
    }
  }, [currentPatientIds, fetchQueueData]);

  const getClassificationColor = (classification: string | null) => {
    if (!classification) return "bg-muted text-muted-foreground";
    
    const upperClassification = classification.toUpperCase();
    if (upperClassification.includes("VERMELHO")) {
      return "bg-red-500 text-white";
    }
    if (upperClassification.includes("AMARELO")) {
      return "bg-yellow-500 text-black";
    }
    if (upperClassification.includes("VERDE")) {
      return "bg-green-500 text-white";
    }
    if (upperClassification.includes("ROXO")) {
      return "bg-purple-500 text-white";
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
              {/* Wait Time Cards */}
              {waitTimeData.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    Tempo Médio de Espera
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {(() => {
                      const cardColors = [
                        'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50',
                        'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50',
                        'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50',
                      ];
                      let globalIndex = 0;
                      return waitTimeData.map((sector, sectorIndex) => (
                        sector.dados.map((dayData, dayIndex) => {
                          const colorClass = cardColors[globalIndex % cardColors.length];
                          globalIndex++;
                          return (
                            <Card key={`${sectorIndex}-${dayIndex}`} className={`${colorClass} min-w-[200px] flex-shrink-0 sm:min-w-0 sm:flex-shrink`}>
                              <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                  {sector.setor_de_atendimento} - {dayData.dia_semana}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pb-4 px-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2">
                                    <Timer className="h-4 w-4 text-primary" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Tempo médio</p>
                                      <p className="font-bold text-lg text-foreground">
                                        {dayData.tempo_medio_de_espera_em_minutos} min
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Na fila</p>
                                      <p className="font-bold text-lg text-foreground">
                                        {dayData.qtd_paciente_fila}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      ));
                    })()}
                  </div>
                </div>
              )}

              {queueData.dados.map((item) => {
                const isCurrentPatient = currentPatientIds.some(id => Number(id) === Number(item.CD_PESSOA_FISICA));
                return (
                  <Card 
                    key={item.NR_ATENDIMENTO}
                    className={isCurrentPatient 
                      ? "border-primary border-2 bg-primary/5 shadow-lg shadow-primary/20 relative overflow-hidden" 
                      : ""
                    }
                  >
                    {isCurrentPatient && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
                    )}
                    <CardContent className="pt-4 pb-4">
                      <div className="space-y-3">
                        {isCurrentPatient && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                              <CheckCircle className="h-3 w-3" />
                              Você está na fila
                            </span>
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Classificação na triagem</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getClassificationColor(item.DS_CLASSIFICACAO)}`}>
                              {item.DS_CLASSIFICACAO || "Não classificado"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Status do atendimento</p>
                            <p className="font-medium text-sm">{item.DS_STATUS_ATENDIMENTO}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Data da entrada</p>
                            <p className="font-medium text-sm">
                              {item.DT_ENTRADA_STRING} às {item.HR_ENTRADA_STRING}
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
      </main>

      <Footer />
    </div>
  );
};

export default EmergencyQueue;
