import { Header } from "@/components/Header";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { getApiHeaders } from "@/lib/api-headers";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, X, Search, Clock, MapPin, User, Calendar, Loader2, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Patient {
  id: string | number;
  nome: string;
  tipo: string;
  sexo?: string;
  codigoCarteirinha?: string;
  idade?: number;
  cdPessoaFisica?: string | number;
  idEmpresa?: string | number;
}

interface Especialidade {
  id: number;
  descricao: string;
}

interface Profissional {
  id: string;
  nome: string;
  idAgenda: number;
  dataAgenda: string;
  dataAgenda2: string;
  unidade: {
    id: string;
    descricao: string;
  };
}

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

interface ScheduleSlot {
  specialty: Especialidade;
  professional: Profissional;
  horario: HorarioDisponivel;
}

interface SmartScheduleResult {
  date: string;
  dateFormatted: string;
  slots: ScheduleSlot[];
}

const SmartScheduling = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Specialty selection
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<Especialidade[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Results
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SmartScheduleResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SmartScheduleResult | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [token, setToken] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [bookingProgress, setBookingProgress] = useState<{ current: number; total: number; completed: string[] }>({ current: 0, total: 0, completed: [] });

  // Load patient data
  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const storedSelectedPatient = localStorage.getItem("selectedPatient");

    if (storedTitular) {
      try {
        const parsedTitular = JSON.parse(storedTitular);
        setPatientName(parsedTitular.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao processar titular:", error);
      }
    }

    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }

    if (storedSelectedPatient) {
      try {
        const parsedPatient = JSON.parse(storedSelectedPatient);
        setSelectedPatient(parsedPatient);
      } catch (error) {
        console.error("Erro ao processar paciente:", error);
        navigate("/appointment-schedule");
      }
    } else {
      navigate("/appointment-schedule");
    }
  }, [navigate]);

  // Fetch specialties when patient is loaded
  useEffect(() => {
    const fetchEspecialidades = async () => {
      if (!selectedPatient) return;

      try {
        setLoadingEspecialidades(true);
        
        const cdPessoaFisica = selectedPatient.cdPessoaFisica?.toString() || "";
        const cdDependente = selectedPatient.id?.toString() || "";
        const nrCarteirinha = selectedPatient.codigoCarteirinha?.toString() || "";

        const params = new URLSearchParams({
          idConvenio: "19", // Samel
          idadeCliente: selectedPatient.idade?.toString() || "0",
          cdPessoaFisica,
          sexo: selectedPatient.sexo || "",
          descricaoEspecialidade: "",
          cdDependente,
          nrCarteirinha
        });

        const headers = getApiHeaders();

        const response = await fetch(
          `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarEspecialidadesComAgendaDisponivel3?${params}`,
          { method: "GET", headers }
        );
        const data = await response.json();

        if (data.sucesso && data.dados) {
          setEspecialidades(data.dados);
        }
      } catch (error) {
        console.error("Erro ao buscar especialidades:", error);
      } finally {
        setLoadingEspecialidades(false);
      }
    };

    fetchEspecialidades();
  }, [selectedPatient]);

  const handleSelectEspecialidade = (especialidade: Especialidade) => {
    if (!selectedEspecialidades.find(e => e.id === especialidade.id)) {
      setSelectedEspecialidades([...selectedEspecialidades, especialidade]);
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleRemoveEspecialidade = (id: number) => {
    setSelectedEspecialidades(selectedEspecialidades.filter(e => e.id !== id));
  };

  const filteredEspecialidades = especialidades.filter(
    e => !selectedEspecialidades.find(s => s.id === e.id) &&
    e.descricao.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch schedules and find compatible combinations
  const handleSearchSchedules = async () => {
    if (selectedEspecialidades.length < 2) {
      toast({
        variant: "destructive",
        title: "Selecione ao menos 2 especialidades",
        description: "O agendamento inteligente requer no mínimo 2 especialidades para encontrar combinações."
      });
      return;
    }

    if (!selectedPatient) return;

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    try {
      const headers = getApiHeaders();
      const allSchedules: Map<number, { specialty: Especialidade; horarios: HorarioDisponivel[]; professional: Profissional }[]> = new Map();

      // Fetch schedules for each specialty
      for (const especialidade of selectedEspecialidades) {
        // First get professionals
        const profParams = new URLSearchParams({
          idConvenio: "19",
          idadeCliente: selectedPatient.idade?.toString() || "0",
          idEspecialidade: especialidade.id.toString(),
          nomeProfissional: "",
          idCliente: selectedPatient.cdPessoaFisica?.toString() || "",
          sexo: selectedPatient.sexo || "",
          cdDependente: selectedPatient.id?.toString() || "",
          nrCarteirinha: selectedPatient.codigoCarteirinha?.toString() || ""
        });

        const profResponse = await fetch(
          `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarProfissionaisComAgendaDisponivel3?${profParams}`,
          { method: "GET", headers }
        );
        const profData = await profResponse.json();

        if (!profData.sucesso || !profData.dados || profData.dados.length === 0) continue;

        // For each professional, get their schedules
        for (const prof of profData.dados.slice(0, 5)) { // Limit to first 5 professionals per specialty
          const horariosParams = new URLSearchParams({
            idConvenio: "19",
            idEspecialidade: especialidade.id.toString(),
            idProfissional: prof.id.toString(),
            idadeCliente: selectedPatient.idade?.toString() || "0",
            idCliente: selectedPatient.id?.toString() || ""
          });

          const horariosResponse = await fetch(
            `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarHorariosDisponiveis2?${horariosParams}`,
            { method: "GET", headers }
          );
          const horariosData = await horariosResponse.json();

          if (horariosData.sucesso && horariosData.dados) {
            for (const horario of horariosData.dados) {
              const dateStr = horario.data2.split(' ')[0];
              const [day, month, year] = dateStr.split('/');
              const dateKey = `${year}-${month}-${day}`;
              const dateKeyNum = parseInt(`${year}${month}${day}`);

              if (!allSchedules.has(dateKeyNum)) {
                allSchedules.set(dateKeyNum, []);
              }

              allSchedules.get(dateKeyNum)!.push({
                specialty: especialidade,
                horarios: [horario],
                professional: prof
              });
            }
          }
        }
      }

      // Find dates that have all selected specialties
      const validResults: SmartScheduleResult[] = [];
      
      allSchedules.forEach((schedules, dateKeyNum) => {
        // Check if all specialties are present
        const specialtiesInDate = new Set(schedules.map(s => s.specialty.id));
        const allSpecialtiesPresent = selectedEspecialidades.every(e => specialtiesInDate.has(e.id));

        if (!allSpecialtiesPresent) return;

        // Group by specialty
        const bySpecialty = new Map<number, { specialty: Especialidade; horarios: HorarioDisponivel[]; professional: Profissional }[]>();
        schedules.forEach(s => {
          if (!bySpecialty.has(s.specialty.id)) {
            bySpecialty.set(s.specialty.id, []);
          }
          bySpecialty.get(s.specialty.id)!.push(s);
        });

        // Try to find compatible combinations (30min - 60min apart)
        const findValidCombination = (): ScheduleSlot[] | null => {
          const specialtyArrays = Array.from(bySpecialty.values());
          
          // Get all time slots for first specialty
          for (const first of specialtyArrays[0]) {
            const firstHorario = first.horarios[0];
            const firstTime = parseTimeToMinutes(firstHorario.data2.split(' ')[1]);
            
            // Try to find matching slots for remaining specialties
            const combination: ScheduleSlot[] = [{
              specialty: first.specialty,
              professional: first.professional,
              horario: firstHorario
            }];

            let isValid = true;
            const usedTimes = [firstTime];

            for (let i = 1; i < specialtyArrays.length; i++) {
              let foundMatch = false;
              
              for (const other of specialtyArrays[i]) {
                const otherHorario = other.horarios[0];
                const otherTime = parseTimeToMinutes(otherHorario.data2.split(' ')[1]);
                
                // Check if time is valid (30-60 min apart from all other times)
                const isValidTime = usedTimes.every(usedTime => {
                  const diff = Math.abs(otherTime - usedTime);
                  return diff >= 30 && diff <= 60;
                });

                if (isValidTime) {
                  combination.push({
                    specialty: other.specialty,
                    professional: other.professional,
                    horario: otherHorario
                  });
                  usedTimes.push(otherTime);
                  foundMatch = true;
                  break;
                }
              }

              if (!foundMatch) {
                isValid = false;
                break;
              }
            }

            if (isValid && combination.length === selectedEspecialidades.length) {
              return combination.sort((a, b) => 
                parseTimeToMinutes(a.horario.data2.split(' ')[1]) - 
                parseTimeToMinutes(b.horario.data2.split(' ')[1])
              );
            }
          }
          
          return null;
        };

        const validCombination = findValidCombination();
        if (validCombination) {
          const dateStr = validCombination[0].horario.data2.split(' ')[0];
          const [day, month, year] = dateStr.split('/');
          const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          
          validResults.push({
            date: `${year}-${month}-${day}`,
            dateFormatted: format(parsedDate, "EEEE, dd 'de' MMMM", { locale: ptBR }),
            slots: validCombination
          });
        }
      });

      // Sort by date
      validResults.sort((a, b) => a.date.localeCompare(b.date));
      setResults(validResults.slice(0, 10)); // Limit to 10 results

    } catch (error) {
      console.error("Erro ao buscar agendas:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar agendas compatíveis"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const parseTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Confirmation flow
  const handleSelectResult = (result: SmartScheduleResult) => {
    setSelectedResult(result);
    setIsConfirmModalOpen(true);
  };

  const formatPhoneForDisplay = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    if (cleaned.length <= 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      setPhoneNumber(formatPhoneForDisplay(e.target.value));
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55')) return cleaned;
    const withoutZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
    return `55${withoutZero}`;
  };

  const handleConfirmAppointment = async () => {
    if (!phoneNumber || !selectedResult) return;

    try {
      setIsSubmitting(true);
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const headers = getApiHeaders();

      const response = await fetch(
        'https://api-portalpaciente-web.samel.com.br/api/token/receberNumero',
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefone: formattedPhone })
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
      console.error('Erro:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: 'Erro ao processar solicitação.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateToken = async () => {
    if (!token || !selectedResult || !selectedPatient) return;

    try {
      setIsSubmitting(true);
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const headers = getApiHeaders();

      const response = await fetch(
        'https://api-portalpaciente-web.samel.com.br/api/token/validarToken',
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefone: formattedPhone,
            token: token,
            cdPessoaFisica: selectedPatient.id
          })
        }
      );

      const data = await response.json();

      if (data.status) {
        await handleConfirmAllAgendamentos();
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.mensagem || 'Token inválido'
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: 'Erro ao validar token.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAllAgendamentos = async () => {
    if (!selectedResult || !selectedPatient) return;

    try {
      const titular = JSON.parse(localStorage.getItem("titular") || "{}");
      const headers = getApiHeaders();
      const idTitular = titular.cdPessoaFisica || "";
      const idEmpresa = selectedPatient.idEmpresa || titular.idEmpresa || 0;

      setBookingProgress({ current: 0, total: selectedResult.slots.length, completed: [] });

      for (let i = 0; i < selectedResult.slots.length; i++) {
        const slot = selectedResult.slots[i];
        const tipo = slot.horario.horaEspecial === "N" ? 1 : 2;

        const response = await fetch(
          'https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ConfirmarAgendamento2',
          {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idCliente: idTitular,
              idConvenio: 19,
              codigoCarteirinha: selectedPatient.codigoCarteirinha || "",
              idAgenda: slot.horario.idAgenda,
              dataAgenda: slot.horario.data,
              idEmpresa: idEmpresa,
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
          setBookingProgress(prev => ({
            ...prev,
            current: i + 1,
            completed: [...prev.completed, slot.specialty.descricao]
          }));
        } else {
          toast({
            variant: "destructive",
            title: `Erro ao agendar ${slot.specialty.descricao}`,
            description: data.mensagem || 'Erro ao confirmar agendamento'
          });
        }
      }

      setIsTokenModalOpen(false);
      setToken("");
      setPhoneNumber("");
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: 'Erro ao processar agendamentos.'
      });
    }
  };

  if (!selectedPatient) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                  Agendamento Inteligente
                </h2>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/appointment-schedule")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                ← Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Agende múltiplas consultas no mesmo dia com horários compatíveis
            </p>
          </div>

          {/* Patient Info */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedPatient.nome}</p>
                  <Badge variant={selectedPatient.tipo === "Titular" ? "default" : "secondary"} className="text-xs">
                    {selectedPatient.tipo}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specialty Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Selecione suas especialidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected specialties */}
              {selectedEspecialidades.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEspecialidades.map((esp) => (
                    <Badge key={esp.id} variant="secondary" className="pl-3 pr-1 py-1.5 text-sm">
                      {esp.descricao}
                      <button
                        onClick={() => handleRemoveEspecialidade(esp.id)}
                        className="ml-2 rounded-full hover:bg-destructive/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Autocomplete input */}
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="w-full justify-start text-muted-foreground"
                    disabled={loadingEspecialidades}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {loadingEspecialidades ? "Carregando especialidades..." : "Adicionar especialidade..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Buscar especialidade..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhuma especialidade encontrada.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-64">
                          {filteredEspecialidades.map((esp) => (
                            <CommandItem
                              key={esp.id}
                              value={esp.descricao}
                              onSelect={() => handleSelectEspecialidade(esp)}
                            >
                              {esp.descricao}
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <p className="text-xs text-muted-foreground">
                Selecione ao menos 2 especialidades para encontrar horários compatíveis no mesmo dia
              </p>

              <Button
                onClick={handleSearchSchedules}
                disabled={selectedEspecialidades.length < 2 || isSearching}
                className="w-full"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando agendas compatíveis...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Buscar Agendas Compatíveis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {hasSearched && !isSearching && (
            <div className="space-y-4">
              {results.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium mb-2">Nenhuma combinação encontrada</p>
                      <p className="text-sm">
                        Não encontramos dias com todas as especialidades disponíveis no intervalo de 30-60 minutos.
                      </p>
                      <p className="text-sm mt-2">
                        Tente remover uma especialidade ou agendar separadamente.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <h3 className="font-semibold text-lg">
                    {results.length} {results.length === 1 ? 'combinação encontrada' : 'combinações encontradas'}
                  </h3>
                  
                  {results.map((result, idx) => (
                    <Card key={idx} className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="capitalize">{result.dateFormatted}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.slots.map((slot, slotIdx) => (
                          <div key={slotIdx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="flex-shrink-0 w-16 text-center">
                              <span className="text-xl font-bold text-primary">
                                {slot.horario.data2.split(' ')[1]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{slot.specialty.descricao}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                Dr(a). {slot.horario.nmMedico}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {slot.horario.unidade.nome}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <Button 
                          className="w-full mt-4"
                          onClick={() => handleSelectResult(result)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Agendar Todas
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Agendamentos</DialogTitle>
            <DialogDescription>
              Você irá agendar {selectedResult?.slots.length} consultas para {selectedResult?.dateFormatted}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 my-4">
            {selectedResult?.slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">{slot.horario.data2.split(' ')[1]}</span>
                <span className="text-muted-foreground">-</span>
                <span>{slot.specialty.descricao}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Número do WhatsApp para confirmação</Label>
            <Input
              id="phone"
              placeholder="(92) 99999-9999"
              value={phoneNumber}
              onChange={handlePhoneChange}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAppointment} disabled={!phoneNumber || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Código"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Token Modal */}
      <Dialog open={isTokenModalOpen} onOpenChange={setIsTokenModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Digite o código de confirmação</DialogTitle>
            <DialogDescription>
              Enviamos um código para seu WhatsApp. Digite-o abaixo para confirmar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="token">Código</Label>
            <Input
              id="token"
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              maxLength={6}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTokenModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleValidateToken} disabled={!token || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agendando {bookingProgress.current}/{bookingProgress.total}...
                </>
              ) : "Confirmar Agendamentos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={(open) => {
        setIsSuccessModalOpen(open);
        if (!open) navigate("/scheduled-appointments-choice");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Agendamentos Confirmados!
            </DialogTitle>
            <DialogDescription>
              Todas as consultas foram agendadas com sucesso para {selectedResult?.dateFormatted}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 my-4">
            {bookingProgress.completed.map((specialty, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>{specialty}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setIsSuccessModalOpen(false);
              navigate("/scheduled-appointments-choice");
            }}>
              Ver Meus Agendamentos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartScheduling;
