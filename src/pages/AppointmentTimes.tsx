import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getApiHeaders } from "@/lib/api-headers";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface HorarioDisponivel {
  id: number;
  idAgenda: number;
  horaEspecial: string;
  data: string;
  data2: string;
  especialidadeAgenda: {
    id: number;
    descricao: string;
  };
  idMedico: string;
  nmMedico: string;
  unidade: {
    id: number;
    nome: string;
  };
}

interface ConventionalFlowData {
  active: boolean;
  especialidades: { id: number; descricao: string }[];
  currentIndex: number;
  completedAppointments: any[];
  convenio: string;
}

const AppointmentTimes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState<HorarioDisponivel | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [token, setToken] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [useEncaminhamento, setUseEncaminhamento] = useState<boolean>(false);
  const [selectedNrSeqMedAvaliacao, setSelectedNrSeqMedAvaliacao] = useState<number | null>(null);
  const [conventionalFlowData, setConventionalFlowData] = useState<ConventionalFlowData | null>(null);
  const { toast } = useToast();

  const { selectedPatient, selectedConvenio, selectedEspecialidade, selectedProfissional } = location.state || {};

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");

    if (storedTitular) {
      try {
        const parsedTitular = JSON.parse(storedTitular);
        setPatientName(parsedTitular.titular?.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao processar titular:", error);
      }
    }

    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }

    const storedUseEncaminhamento = localStorage.getItem("appointmentUseEncaminhamento");
    if (storedUseEncaminhamento) {
      try {
        setUseEncaminhamento(JSON.parse(storedUseEncaminhamento));
      } catch (error) {
        console.error("Erro ao processar useEncaminhamento:", error);
      }
    }

    const storedNrSeqMedAvaliacao = localStorage.getItem("selectedNrSeqMedAvaliacao");
    if (storedNrSeqMedAvaliacao) {
      try {
        setSelectedNrSeqMedAvaliacao(JSON.parse(storedNrSeqMedAvaliacao));
      } catch (error) {
        console.error("Erro ao processar selectedNrSeqMedAvaliacao:", error);
      }
    }

    // Verificar fluxo convencional
    const storedConventionalFlow = localStorage.getItem("conventionalFlow");
    if (storedConventionalFlow) {
      try {
        const flowData: ConventionalFlowData = JSON.parse(storedConventionalFlow);
        if (flowData.active) {
          setConventionalFlowData(flowData);
        }
      } catch (error) {
        console.error("Erro ao processar fluxo convencional:", error);
      }
    }

    if (!selectedPatient || !selectedConvenio || !selectedEspecialidade || !selectedProfissional) {
      navigate("/appointment-professionals");
    }
  }, [navigate, selectedPatient, selectedConvenio, selectedEspecialidade, selectedProfissional]);

  useEffect(() => {
    if (selectedDate && horarios.length > 0) {
      const filteredHorarios = horarios.filter(horario => {
        const dateStr = horario.data2.split(' ')[0];
        const [day, month, year] = dateStr.split('/');
        const horarioDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        return (
          horarioDate.getDate() === selectedDate.getDate() &&
          horarioDate.getMonth() === selectedDate.getMonth() &&
          horarioDate.getFullYear() === selectedDate.getFullYear()
        );
      });
    }
  }, [selectedDate, horarios]);

  // Função para gerar horários mockados
  const generateMockHorarios = (): HorarioDisponivel[] => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const times = ["08:00", "09:00", "10:00", "14:00", "15:00"];
    const mockHorarios: HorarioDisponivel[] = [];
    
    // Horários para hoje
    times.forEach((time, index) => {
      mockHorarios.push({
        id: 80001 + index,
        idAgenda: selectedProfissional?.idAgenda || 90001,
        horaEspecial: "N",
        data: today.toISOString(),
        data2: `${formatDate(today)} ${time}`,
        especialidadeAgenda: {
          id: parseInt(selectedEspecialidade || "1"),
          descricao: selectedProfissional?.dsEspecialidade || "TESTE INTELIGENTE"
        },
        idMedico: selectedProfissional?.id || "MOCK001",
        nmMedico: selectedProfissional?.nome || "DR. TESTE INTELIGENTE 1",
        unidade: {
          id: 1,
          nome: "HOSPITAL SAMEL - ADRIANÓPOLIS"
        }
      });
    });

    // Horários para amanhã
    times.forEach((time, index) => {
      mockHorarios.push({
        id: 80010 + index,
        idAgenda: selectedProfissional?.idAgenda || 90001,
        horaEspecial: "N",
        data: tomorrow.toISOString(),
        data2: `${formatDate(tomorrow)} ${time}`,
        especialidadeAgenda: {
          id: parseInt(selectedEspecialidade || "1"),
          descricao: selectedProfissional?.dsEspecialidade || "TESTE INTELIGENTE"
        },
        idMedico: selectedProfissional?.id || "MOCK001",
        nmMedico: selectedProfissional?.nome || "DR. TESTE INTELIGENTE 1",
        unidade: {
          id: 1,
          nome: "HOSPITAL SAMEL - ADRIANÓPOLIS"
        }
      });
    });

    return mockHorarios;
  };

  useEffect(() => {
    const fetchHorarios = async () => {
      if (!selectedPatient || !selectedConvenio || !selectedEspecialidade || !selectedProfissional) {
        return;
      }

      // Verificar se é modo de teste
      const isTestMode = localStorage.getItem("appointmentTestMode") === "true";
      
      if (isTestMode) {
        setLoading(true);
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockData = generateMockHorarios();
        setHorarios(mockData);
        
        const dates = mockData.map((horario: HorarioDisponivel) => {
          const dateStr = horario.data2.split(' ')[0];
          const [day, month, year] = dateStr.split('/');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        });
        
        // Remover duplicatas de datas
        const uniqueDates = dates.filter((date, index, self) =>
          index === self.findIndex(d => d.getTime() === date.getTime())
        );
        
        setAvailableDates(uniqueDates);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const params = new URLSearchParams({
          idConvenio: selectedConvenio,
          idEspecialidade: selectedEspecialidade,
          idProfissional: selectedProfissional.id.toString(),
          idadeCliente: selectedPatient.idade?.toString() || "0",
          idCliente: selectedPatient.id?.toString() || ""
        });

        const headers = getApiHeaders();

        const response = await fetch(
          `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarHorariosDisponiveis2?${params}`,
          {
            method: "GET",
            headers
          }
        );
        const data = await response.json();
        
        if (data.sucesso && data.dados) {
          setHorarios(data.dados);
          
          const dates = data.dados.map((horario: HorarioDisponivel) => {
            const dateStr = horario.data2.split(' ')[0];
            const [day, month, year] = dateStr.split('/');
            const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return parsedDate;
          });
          
          setAvailableDates(dates);
        }
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHorarios();
  }, [selectedPatient, selectedConvenio, selectedEspecialidade, selectedProfissional]);

  const isDateAvailable = (date: Date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isAvailable = availableDates.some(
      availableDate => {
        const availableString = `${availableDate.getFullYear()}-${String(availableDate.getMonth() + 1).padStart(2, '0')}-${String(availableDate.getDate()).padStart(2, '0')}`;
        return availableString === dateString;
      }
    );
    return isAvailable;
  };

  const getTimesForSelectedDate = () => {
    if (!selectedDate) return [];
    
    const filteredHorarios = horarios.filter(horario => {
      const dateStr = horario.data2.split(' ')[0];
      const [day, month, year] = dateStr.split('/');
      const horarioDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return (
        horarioDate.getDate() === selectedDate.getDate() &&
        horarioDate.getMonth() === selectedDate.getMonth() &&
        horarioDate.getFullYear() === selectedDate.getFullYear()
      );
    });
    
    return filteredHorarios;
  };

  const formatPhoneForDisplay = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 11) {
      setPhoneNumber(formatPhoneForDisplay(value));
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Se já tem o código do país (55), retorna
    if (cleaned.startsWith('55')) {
      return cleaned;
    }
    
    // Se começa com 0, remove o 0
    const withoutZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
    
    // Adiciona o código do país
    return `55${withoutZero}`;
  };

  const handleConfirmAppointment = async () => {
    if (!phoneNumber || !selectedHorario) return;

    try {
      setIsSubmitting(true);
      
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const headers = getApiHeaders();
      
      const response = await fetch(
        'https://api-portalpaciente-web.samel.com.br/api/token/receberNumero',
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telefone: formattedPhone
          })
        }
      );

      const data = await response.json();
      
      if (data.status) {
        setIsConfirmModalOpen(false);
        setIsTokenModalOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.mensagem || 'Erro ao enviar número de telefone'
        });
      }
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: 'Erro ao processar solicitação. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateToken = async () => {
    if (!token || !selectedHorario || !selectedPatient) return;

    try {
      setIsSubmitting(true);
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const headers = getApiHeaders();

      const response = await fetch(
        'https://api-portalpaciente-web.samel.com.br/api/token/validarToken',
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telefone: formattedPhone,
            token: token,
            cdPessoaFisica: selectedPatient.id
          })
        }
      );

      const data = await response.json();

      if (data.status) {
        await handleConfirmAgendamento();
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.mensagem || 'Token inválido'
        });
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: 'Erro ao validar token. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAgendamento = async () => {
    if (!selectedHorario || !selectedPatient) return;

    try {
      const titular = JSON.parse(localStorage.getItem("titular") || "{}");
      const selectedPatientData = JSON.parse(localStorage.getItem("selectedPatient") || "{}");
      const headers = getApiHeaders();

      const tipo = selectedHorario.horaEspecial === "N" ? 1 : 2;
      
      // Usar cdPessoaFisica do titular como idCliente
      const idTitular = titular.cdPessoaFisica || "";
      
      // Buscar idEmpresa do selectedPatient
      const idEmpresa = selectedPatientData.idEmpresa || titular.idEmpresa || 0;

      const response = await fetch(
        'https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ConfirmarAgendamento2',
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idCliente: idTitular,
            idConvenio: Number(selectedConvenio),
            codigoCarteirinha: selectedPatient.codigoCarteirinha || "",
            idAgenda: selectedHorario.idAgenda,
            dataAgenda: selectedHorario.data,
            idEmpresa: idEmpresa,
            procedimentos: [],
            tipo: tipo,
            idDependente: selectedPatient.id,
            ie_encaminhamento: useEncaminhamento ? "S" : "N",
            nr_seq_med_avaliacao_paciente: useEncaminhamento && selectedNrSeqMedAvaliacao 
              ? selectedNrSeqMedAvaliacao 
              : null
          })
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        setIsTokenModalOpen(false);
        setToken("");
        setPhoneNumber("");
        setIsSuccessModalOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.mensagem || 'Erro ao confirmar agendamento'
        });
      }
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: 'Erro ao processar agendamento. Tente novamente.'
      });
    }
  };

  if (!selectedProfissional) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Horários Disponíveis
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/appointment-professionals")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                ← Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedProfissional.nomeDeGuerra || selectedProfissional.nome}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando horários disponíveis...</p>
            </div>
          ) : horarios.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Nenhum horário disponível encontrado para este profissional.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selecione uma Data</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => !isDateAvailable(date)}
                    locale={ptBR}
                    className="rounded-md border pointer-events-auto"
                    modifiers={{
                      available: availableDates
                    }}
                    modifiersClassNames={{
                      available: "bg-primary/20 text-primary font-semibold rounded-full"
                    }}
                  />
                </CardContent>
              </Card>

              {selectedDate && (
                <Card className="border-2 border-primary/20">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-lg">
                      Horário Disponível
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {getTimesForSelectedDate().slice(0, 1).map((horario) => {
                      const horarioTime = horario.data2.split(' ')[1];
                      return (
                        <div key={horario.id} className="space-y-6">
                          <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="text-6xl font-bold text-primary">
                              {horarioTime}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              <span className="text-sm font-medium">{horario.unidade.nome}</span>
                            </div>
                          </div>
                          
                          <Button
                            size="lg"
                            className="w-full text-base font-semibold"
                            onClick={() => {
                              setSelectedHorario(horario);
                              setIsConfirmModalOpen(true);
                            }}
                          >
                            Agendar Consulta
                          </Button>
                        </div>
                      );
                    })}
                    
                    {getTimesForSelectedDate().length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">
                          Nenhum horário disponível para esta data
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md max-h-[75vh] w-full">
          <DialogHeader>
            <DialogTitle>Confirmar Agendamento</DialogTitle>
            <DialogDescription>
              Informe seu número de telefone para confirmação via WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedHorario && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">Data:</span>{" "}
                  {selectedHorario.data2.split(' ')[0]}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Horário:</span>{" "}
                  {selectedHorario.data2.split(' ')[1]}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Unidade:</span>{" "}
                  {selectedHorario.unidade.nome}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="phone">Telefone (WhatsApp)</Label>
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
                <span className="text-blue-600 dark:text-blue-400 text-sm">💡</span>
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  Informe DDD + número. Ex: <strong>(92) 90000-0000</strong>
                </span>
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phoneNumber}
                onChange={handlePhoneChange}
                maxLength={15}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmModalOpen(false);
                setPhoneNumber("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAppointment}
              disabled={!phoneNumber || isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTokenModalOpen} onOpenChange={setIsTokenModalOpen}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md max-h-[75vh] w-full">
          <DialogHeader>
            <DialogTitle>Confirmar Código</DialogTitle>
            <DialogDescription>
              Informe o código que foi enviado para o WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token">Código de Confirmação</Label>
              <Input
                id="token"
                type="text"
                placeholder="Digite o código"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsTokenModalOpen(false);
                setToken("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleValidateToken}
              disabled={!token || isSubmitting}
            >
              {isSubmitting ? "Validando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md max-h-[75vh] w-full">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">✅ Consulta Marcada com Sucesso!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              {conventionalFlowData && conventionalFlowData.currentIndex < conventionalFlowData.especialidades.length - 1 
                ? `Agora vamos agendar a próxima especialidade: ${conventionalFlowData.especialidades[conventionalFlowData.currentIndex + 1]?.descricao}`
                : "Sua consulta foi agendada com sucesso. O que você deseja fazer agora?"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            {conventionalFlowData && conventionalFlowData.currentIndex < conventionalFlowData.especialidades.length - 1 ? (
              <>
                <Button
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    // Continuar fluxo convencional
                    navigate("/appointment-details", { 
                      state: { 
                        continueFlow: true,
                        lastAppointment: {
                          especialidade: conventionalFlowData.especialidades[conventionalFlowData.currentIndex].descricao,
                          horario: selectedHorario
                        }
                      } 
                    });
                  }}
                  className="w-full"
                >
                  Continuar para próxima especialidade ({conventionalFlowData.currentIndex + 2} de {conventionalFlowData.especialidades.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    localStorage.removeItem("conventionalFlow");
                    navigate("/dashboard");
                  }}
                  className="w-full"
                >
                  Cancelar e voltar ao menu
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    localStorage.removeItem("conventionalFlow");
                    navigate("/dashboard");
                  }}
                  className="w-full"
                >
                  Voltar ao Menu Principal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    localStorage.removeItem("conventionalFlow");
                    navigate("/scheduled-appointments-choice");
                  }}
                  className="w-full"
                >
                  Ver Meus Agendamentos
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentTimes;
