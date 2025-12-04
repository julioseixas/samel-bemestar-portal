import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Stethoscope, Ambulance, TestTube, Users, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getApiHeaders } from "@/lib/api-headers";

interface WaitTimeData {
  dia_semana: string;
  tempo_medio_de_espera_em_minutos: string;
  qtd_paciente_fila: string;
}

interface WaitTimeSector {
  setor_de_atendimento: string;
  dados: WaitTimeData[];
}

interface FirstAttendanceData {
  hora_do_dia: string;
  tempo_medio_em_minuto: number;
}

interface FirstAttendanceSector {
  setor_de_atendimento: string;
  dados: FirstAttendanceData[];
}

const QueueChoice = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [waitTimeData, setWaitTimeData] = useState<WaitTimeSector[]>([]);
  const [firstAttendanceData, setFirstAttendanceData] = useState<FirstAttendanceSector[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

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

    fetchWaitTimeStats();
  }, []);

  const fetchWaitTimeStats = async () => {
    setIsLoadingStats(true);
    try {
      const headers = getApiHeaders();
      
      const [waitTimeRes, firstAttendanceRes] = await Promise.all([
        fetch("https://appv2-back.samel.com.br/api/atendimento/obterMediaDiasSemana", {
          method: "GET",
          headers,
        }),
        fetch("https://appv2-back.samel.com.br/api/atendimento/obterMediaPrimeiroAtendimento", {
          method: "GET",
          headers,
        }),
      ]);

      const waitTimeJson = await waitTimeRes.json();
      const firstAttendanceJson = await firstAttendanceRes.json();

      if (waitTimeJson.status && waitTimeJson.dados) {
        setWaitTimeData(waitTimeJson.dados);
      }

      if (firstAttendanceJson.status && firstAttendanceJson.dados) {
        setFirstAttendanceData(firstAttendanceJson.dados);
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    } finally {
      setIsLoadingStats(false);
    }
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

  const currentHourFirstAttendance = getCurrentHourFirstAttendance();

  const queueOptions = [
    {
      title: "Fila de Consultas",
      description: "Acompanhe sua posição na fila de consultas",
      icon: Stethoscope,
      onClick: () => navigate("/consultation-queue"),
    },
    {
      title: "Fila do Pronto Socorro",
      description: "Acompanhe sua posição na fila do pronto socorro",
      icon: Ambulance,
      onClick: () => navigate("/emergency-queue"),
    },
    {
      title: "Fila de Exames",
      description: "Acompanhe sua posição na fila de exames",
      icon: TestTube,
      onClick: () => navigate("/exam-queue"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />

      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Fila de Atendimento
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          {/* Card de Tempo Médio do Pronto Socorro */}
          <Card className="mb-6 bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-destructive/10">
                  <Ambulance className="h-5 w-5 text-destructive" />
                </div>
                <h2 className="font-semibold text-foreground">Pronto Socorro - Tempo Médio Hoje</h2>
              </div>
              
              {isLoadingStats ? (
                <div className="flex gap-4">
                  <Skeleton className="h-16 flex-1" />
                  <Skeleton className="h-16 flex-1" />
                  <Skeleton className="h-16 flex-1" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tempo por Setor */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {waitTimeData.map((sector) => {
                      const sectorTime = sector.dados?.[0]?.tempo_medio_de_espera_em_minutos;
                      const sectorQueue = sector.dados?.[0]?.qtd_paciente_fila;
                      return (
                        <div key={sector.setor_de_atendimento} className="bg-background/80 rounded-lg p-3 text-center">
                          <p className="text-xs font-medium text-muted-foreground mb-1 truncate">
                            {sector.setor_de_atendimento}
                          </p>
                          <p className="text-xl sm:text-2xl font-bold text-primary">
                            {sectorTime ? `${sectorTime} min` : "--"}
                          </p>
                          {sectorQueue && sectorQueue !== "0" && (
                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                              <Users className="h-3 w-3" /> {sectorQueue}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 1º Atendimento */}
                  <div className="bg-background/80 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-2">
                      <Timer className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-muted-foreground">1º atendimento:</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {currentHourFirstAttendance ? `${currentHourFirstAttendance} min` : "--"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Dados baseados na média do dia atual
              </p>
            </CardContent>
          </Card>

          <p className="text-muted-foreground mb-6">
            Selecione qual fila você deseja acompanhar:
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {queueOptions.map((option, index) => (
              <Card
                key={index}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                onClick={option.onClick}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <option.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">
                      {option.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QueueChoice;
