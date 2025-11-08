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
      
      console.log('📅 Data selecionada:', format(selectedDate, "dd/MM/yyyy", { locale: ptBR }));
      console.log('⏰ Horários disponíveis:', filteredHorarios);
      console.log('📋 Total de horários:', filteredHorarios.length);
    }
  }, [selectedDate, horarios]);

  useEffect(() => {
    const fetchHorarios = async () => {
      if (!selectedPatient || !selectedConvenio || !selectedEspecialidade || !selectedProfissional) {
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
          
          // Extrair datas disponíveis
          const dates = data.dados.map((horario: HorarioDisponivel) => {
            // data2 está no formato "04/12/2025 11:24" (DD/MM/YYYY)
            const dateStr = horario.data2.split(' ')[0]; // Pegar apenas a parte da data
            const [day, month, year] = dateStr.split('/');
            const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            console.log('Parsing date from API:', horario.data2, '-> Date object:', parsedDate.toISOString());
            return parsedDate;
          });
          
          console.log('Available dates array:', dates.map(d => d.toISOString()));
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
    console.log('Checking date:', dateString, 'Available:', isAvailable, 'Total available dates:', availableDates.length);
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
    
    console.log('Data selecionada:', format(selectedDate, "dd/MM/yyyy", { locale: ptBR }));
    console.log('Horários disponíveis para esta data:', JSON.stringify(filteredHorarios, null, 2));
    
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
      const headers = getApiHeaders();

      const tipo = selectedHorario.horaEspecial === "N" ? 1 : 2;
      
      // Usar cdPessoaFisica do titular como idCliente
      const idTitular = titular.titular?.cdPessoaFisica || "";

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
            idConvenio: selectedConvenio,
            codigoCarteirinha: selectedPatient.codigoCarteirinha || "",
            idAgenda: selectedHorario.idAgenda,
            dataAgenda: selectedHorario.data,
            idEmpresa: selectedPatient.idEmpresa || 0,
            procedimentos: [],
            tipo: tipo,
            idDependente: selectedPatient.id,
            ie_encaminhamento: "N",
            nr_seq_med_avaliacao_paciente: null
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
                  />
                </CardContent>
              </Card>

              {selectedDate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Horários - {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[60vh]">
                      <div className="space-y-2 pr-4">
                        {getTimesForSelectedDate().slice(0, 1).map((horario) => {
                          const horarioTime = horario.data2.split(' ')[1]; // Extrai "HH:MM" de "DD/MM/YYYY HH:MM"
                          return (
                            <Button
                              key={horario.id}
                              variant="outline"
                              className="w-full justify-start text-left"
                              onClick={() => {
                                setSelectedHorario(horario);
                                setIsConfirmModalOpen(true);
                              }}
                            >
                              <div className="flex-1">
                                <div className="font-semibold">{horarioTime}</div>
                                <div className="text-xs text-muted-foreground">
                                  {horario.unidade.nome}
                                </div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-md">
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

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (WhatsApp)</Label>
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
        <DialogContent className="max-w-[95vw] w-full sm:max-w-md">
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
        <DialogContent className="max-w-[95vw] w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">✅ Consulta Marcada com Sucesso!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Sua consulta foi agendada com sucesso. O que você deseja fazer agora?
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => {
                setIsSuccessModalOpen(false);
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
                navigate("/scheduled-appointments-choice");
              }}
              className="w-full"
            >
              Ver Meus Agendamentos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentTimes;
