import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Ambulance, Clock, User, AlertCircle, RefreshCw, CheckCircle, BarChart3, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { getApiHeaders } from "@/lib/api-headers";
import { jwtDecode } from "jwt-decode";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";

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

interface WeeklyWaitTimeData {
  dia_semana: string;
  tempo_medio_em_minuto: number;
}

interface WeeklyWaitTimeSector {
  setor_de_atendimento: string;
  dados: WeeklyWaitTimeData[];
}

interface FirstAttendanceData {
  hora_do_dia: string;
  tempo_medio_em_minuto: number;
}

interface FirstAttendanceSector {
  setor_de_atendimento: string;
  dados: FirstAttendanceData[];
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
  const [weeklyWaitTimeData, setWeeklyWaitTimeData] = useState<WeeklyWaitTimeSector[]>([]);
  const [firstAttendanceData, setFirstAttendanceData] = useState<FirstAttendanceSector[]>([]);
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
        if (!isFirstLoadRef.current) {
          let shouldPlaySound = false;
          
          if (allResults.length !== previousCountRef.current) {
            shouldPlaySound = true;
          }
          
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
        
        fetchWaitTimeData();
        fetchWeeklyWaitTimeData();
        fetchFirstAttendanceData();
      } else {
        if (!isFirstLoadRef.current && previousCountRef.current > 0) {
          playNotificationSound();
        }
        previousCountRef.current = 0;
        isFirstLoadRef.current = false;
        setQueueData(null);
        setApiMessage(lastMessage);
        setWaitTimeData([]);
        setWeeklyWaitTimeData([]);
        setFirstAttendanceData([]);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao buscar fila do pronto socorro:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPatientIds, playNotificationSound]);

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

  const fetchWeeklyWaitTimeData = async () => {
    try {
      const headers = getApiHeaders();
      const response = await fetch(
        "https://appv2-back.samel.com.br/api/atendimento/obterMediaSemanaisAnteriores",
        {
          method: "GET",
          headers,
        }
      );
      
      const data = await response.json();
      if (data.status && data.dados && Array.isArray(data.dados)) {
        setWeeklyWaitTimeData(data.dados);
      }
    } catch (error) {
      console.error("Erro ao buscar histórico semanal:", error);
    }
  };

  const fetchFirstAttendanceData = async () => {
    try {
      const headers = getApiHeaders();
      const response = await fetch(
        "https://appv2-back.samel.com.br/api/atendimento/obterMediaPrimeiroAtendimento",
        {
          method: "GET",
          headers,
        }
      );
      
      const data = await response.json();
      if (data.status && data.dados && Array.isArray(data.dados)) {
        setFirstAttendanceData(data.dados);
      }
    } catch (error) {
      console.error("Erro ao buscar tempo de primeiro atendimento:", error);
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

  const getDayOfWeekIndex = (dayAbbr: string): number => {
    const days: Record<string, number> = {
      'DOM': 0, 'SEG': 1, 'TER': 2, 'QUA': 3, 'QUI': 4, 'SEX': 5, 'SAB': 6
    };
    return days[dayAbbr.toUpperCase()] ?? -1;
  };

  const getCurrentDayAbbr = (): string => {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    return days[new Date().getDay()];
  };

  const getTodayWaitTime = (): string | null => {
    if (waitTimeData.length === 0) return null;
    const todayAbbr = getCurrentDayAbbr();
    for (const sector of waitTimeData) {
      const todayData = sector.dados.find(d => d.dia_semana.toUpperCase() === todayAbbr);
      if (todayData) {
        return todayData.tempo_medio_de_espera_em_minutos;
      }
    }
    return null;
  };

  const getTodayQueueCount = (): string | null => {
    if (waitTimeData.length === 0) return null;
    const todayAbbr = getCurrentDayAbbr();
    for (const sector of waitTimeData) {
      const todayData = sector.dados.find(d => d.dia_semana.toUpperCase() === todayAbbr);
      if (todayData) {
        return todayData.qtd_paciente_fila;
      }
    }
    return null;
  };

  const getCurrentHourFirstAttendance = (): string | null => {
    if (firstAttendanceData.length === 0) return null;
    const currentHour = `${new Date().getHours()}h`;
    for (const sector of firstAttendanceData) {
      const hourData = sector.dados.find(d => d.hora_do_dia === currentHour);
      if (hourData) {
        return Math.round(hourData.tempo_medio_em_minuto).toString();
      }
    }
    return null;
  };

  const prepareChartData = (sectorData: WeeklyWaitTimeData[]) => {
    const dayOrder = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
    const currentDayAbbr = getCurrentDayAbbr();
    
    return dayOrder.map(day => {
      const dayData = sectorData.find(d => d.dia_semana.toUpperCase() === day);
      return {
        dia: day,
        tempo: dayData?.tempo_medio_em_minuto || 0,
        isToday: day === currentDayAbbr,
      };
    });
  };

  const prepareHourlyChartData = (sectorData: FirstAttendanceData[]) => {
    const currentHour = new Date().getHours();
    return sectorData
      .map(item => ({
        hora: item.hora_do_dia,
        tempo: item.tempo_medio_em_minuto,
        hourNum: parseInt(item.hora_do_dia),
        isCurrentHour: parseInt(item.hora_do_dia) === currentHour,
      }))
      .sort((a, b) => a.hourNum - b.hourNum);
  };

  const todayWaitTime = getTodayWaitTime();
  const todayQueueCount = getTodayQueueCount();
  const currentHourFirstAttendance = getCurrentHourFirstAttendance();

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />

      <main className="flex-1 overflow-y-auto pb-20">
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

      {/* Accordion Sticky no Bottom */}
      {queueData && queueData.dados.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-sm border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="weekly-chart" className="border-none">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">
                      {todayWaitTime && (
                        <span>Espera: <span className="text-primary font-bold">{todayWaitTime}min</span></span>
                      )}
                      {currentHourFirstAttendance && (
                        <span className="ml-2">• 1º atend.: <span className="text-emerald-600 font-bold">{currentHourFirstAttendance}min</span></span>
                      )}
                      {!todayWaitTime && !currentHourFirstAttendance && 'Histórico de Espera'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {todayQueueCount && <span>{todayQueueCount} na fila</span>}
                      {todayQueueCount && <span>•</span>}
                      <span>Ver histórico</span>
                      <ChevronRight className="h-3 w-3" />
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <Tabs defaultValue="weekly" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="weekly" className="text-xs sm:text-sm">📅 Histórico Semanal</TabsTrigger>
                    <TabsTrigger value="hourly" className="text-xs sm:text-sm">⏰ Por Hora do Dia</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="weekly">
                    <div className="max-h-[40vh] overflow-y-auto space-y-6">
                      {weeklyWaitTimeData.length > 0 ? (
                        weeklyWaitTimeData.map((sector, index) => {
                          const chartData = prepareChartData(sector.dados);
                          return (
                            <div key={index} className="space-y-3">
                              <h3 className="text-sm font-semibold text-foreground">
                                {sector.setor_de_atendimento}
                              </h3>
                              <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <XAxis 
                                      dataKey="dia" 
                                      tick={{ fontSize: 11 }}
                                      tickLine={false}
                                      axisLine={false}
                                    />
                                    <YAxis 
                                      tick={{ fontSize: 11 }}
                                      tickLine={false}
                                      axisLine={false}
                                      tickFormatter={(value) => `${value}min`}
                                      width={50}
                                    />
                                    <Tooltip 
                                      formatter={(value: number) => [`${value} minutos`, 'Tempo médio']}
                                      labelFormatter={(label) => `Dia: ${label}`}
                                      contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                      }}
                                    />
                                    <Bar 
                                      dataKey="tempo" 
                                      radius={[4, 4, 0, 0]}
                                    >
                                      {chartData.map((entry, idx) => (
                                        <Cell 
                                          key={`cell-${idx}`} 
                                          fill={entry.isToday ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)'} 
                                        />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              <p className="text-xs text-muted-foreground text-center">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-3 h-3 rounded bg-primary"></span>
                                  Dia atual
                                </span>
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <BarChart3 className="h-10 w-10 text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Dados históricos indisponíveis no momento.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="hourly">
                    <div className="max-h-[40vh] overflow-y-auto space-y-6">
                      {firstAttendanceData.length > 0 ? (
                        firstAttendanceData.map((sector, index) => {
                          const hourlyChartData = prepareHourlyChartData(sector.dados);
                          return (
                            <div key={index} className="space-y-3">
                              <h3 className="text-sm font-semibold text-foreground">
                                {sector.setor_de_atendimento}
                              </h3>
                              <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                      <linearGradient id={`colorTempo-${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <XAxis 
                                      dataKey="hora" 
                                      tick={{ fontSize: 10 }}
                                      tickLine={false}
                                      axisLine={false}
                                      interval="preserveStartEnd"
                                    />
                                    <YAxis 
                                      tick={{ fontSize: 11 }}
                                      tickLine={false}
                                      axisLine={false}
                                      tickFormatter={(value) => `${Math.round(value)}min`}
                                      width={50}
                                    />
                                    <Tooltip 
                                      formatter={(value: number) => [`${Math.round(value)} minutos`, '1º Atendimento']}
                                      labelFormatter={(label) => `Hora: ${label}`}
                                      contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                      }}
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="tempo" 
                                      stroke="hsl(var(--primary))"
                                      strokeWidth={2}
                                      fill={`url(#colorTempo-${index})`}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                              <p className="text-xs text-muted-foreground text-center">
                                Tempo médio para 1º atendimento por hora do dia
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Clock className="h-10 w-10 text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Dados por hora indisponíveis no momento.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default EmergencyQueue;
