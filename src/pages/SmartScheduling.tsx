import { Header } from "@/components/Header";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiHeaders } from "@/lib/api-headers";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, X, Search, Clock, MapPin, User, Calendar, Loader2, Check, Building2, AlertTriangle } from "lucide-react";
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
  unitId: number;
  unitName: string;
  slots: ScheduleSlot[];
  isDifferentUnits?: boolean;
}

// Mock data for testing
const generateMockData = (): { especialidades: Especialidade[]; results: SmartScheduleResult[]; differentUnitsResults: SmartScheduleResult[] } => {
  const mockEspecialidades: Especialidade[] = [
    { id: 99901, descricao: "CARDIOLOGIA (MOCK)" },
    { id: 99902, descricao: "OFTALMOLOGIA (MOCK)" }
  ];

  // Unidades disponíveis para teste
  const unidades = [
    { id: 1, nome: "HOSPITAL SAMEL - ADRIANÓPOLIS" },
    { id: 2, nome: "HOSPITAL SAMEL - ALEIXO" },
    { id: 3, nome: "UBS SAMEL - CIDADE NOVA" }
  ];

  // Generate dates for next 5 days
  const today = new Date();
  const mockResults: SmartScheduleResult[] = [];
  const differentUnitsResults: SmartScheduleResult[] = [];

  // Resultados na MESMA unidade (Adrianópolis)
  for (let dayOffset = 1; dayOffset <= 2; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    // 3 time slots per day na mesma unidade
    const baseHours = [8, 10, 14];
    
    for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
      const hour1 = baseHours[slotIdx];
      const minute1 = 0;
      const minute2 = 30;

      const time1 = `${String(hour1).padStart(2, '0')}:${String(minute1).padStart(2, '0')}`;
      const time2 = `${String(hour1).padStart(2, '0')}:${String(minute2).padStart(2, '0')}`;

      mockResults.push({
        date: `${year}-${month}-${day}`,
        dateFormatted: date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
        unitId: 1,
        unitName: unidades[0].nome,
        isDifferentUnits: false,
        slots: [
          {
            specialty: mockEspecialidades[0],
            professional: {
              id: "MOCK_CARDIO_01",
              nome: "Dr. Carlos Cardiologista",
              idAgenda: 99901 + slotIdx,
              dataAgenda: dateStr,
              dataAgenda2: `${dateStr} ${time1}`,
              unidade: { id: "1", descricao: unidades[0].nome }
            },
            horario: {
              id: 99901 + (dayOffset * 10) + slotIdx,
              idAgenda: 99901 + slotIdx,
              horaEspecial: "N",
              data: dateStr,
              data2: `${dateStr} ${time1}`,
              especialidadeAgenda: { id: 99901, descricao: "CARDIOLOGIA (MOCK)" },
              idMedico: "MOCK_CARDIO_01",
              nmMedico: "Dr. Carlos Cardiologista",
              unidade: { id: 1, nome: unidades[0].nome }
            }
          },
          {
            specialty: mockEspecialidades[1],
            professional: {
              id: "MOCK_OFTALMO_01",
              nome: "Dra. Olívia Oftalmologista",
              idAgenda: 99902 + slotIdx,
              dataAgenda: dateStr,
              dataAgenda2: `${dateStr} ${time2}`,
              unidade: { id: "1", descricao: unidades[0].nome }
            },
            horario: {
              id: 99902 + (dayOffset * 10) + slotIdx,
              idAgenda: 99902 + slotIdx,
              horaEspecial: "N",
              data: dateStr,
              data2: `${dateStr} ${time2}`,
              especialidadeAgenda: { id: 99902, descricao: "OFTALMOLOGIA (MOCK)" },
              idMedico: "MOCK_OFTALMO_01",
              nmMedico: "Dra. Olívia Oftalmologista",
              unidade: { id: 1, nome: unidades[0].nome }
            }
          }
        ]
      });
    }
  }

  // Resultados em UNIDADES DIFERENTES (mais horários disponíveis)
  for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    // Mais opções de horários quando aceita unidades diferentes
    const baseHours = [7, 8, 9, 10, 11, 14, 15, 16];
    
    for (let slotIdx = 0; slotIdx < baseHours.length; slotIdx++) {
      const hour1 = baseHours[slotIdx];
      const unidade1 = unidades[slotIdx % 3]; // Alterna entre unidades
      const unidade2 = unidades[(slotIdx + 1) % 3]; // Segunda especialidade em unidade diferente
      
      const time1 = `${String(hour1).padStart(2, '0')}:00`;
      const time2 = `${String(hour1).padStart(2, '0')}:30`;

      differentUnitsResults.push({
        date: `${year}-${month}-${day}`,
        dateFormatted: date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
        unitId: unidade1.id,
        unitName: unidade1.nome,
        isDifferentUnits: true,
        slots: [
          {
            specialty: mockEspecialidades[0],
            professional: {
              id: `MOCK_CARDIO_U${unidade1.id}`,
              nome: `Dr. Cardiologista - ${unidade1.nome.split(' - ')[1] || unidade1.nome}`,
              idAgenda: 88001 + slotIdx + (dayOffset * 100),
              dataAgenda: dateStr,
              dataAgenda2: `${dateStr} ${time1}`,
              unidade: { id: unidade1.id.toString(), descricao: unidade1.nome }
            },
            horario: {
              id: 88001 + (dayOffset * 100) + slotIdx,
              idAgenda: 88001 + slotIdx + (dayOffset * 100),
              horaEspecial: "N",
              data: dateStr,
              data2: `${dateStr} ${time1}`,
              especialidadeAgenda: { id: 99901, descricao: "CARDIOLOGIA (MOCK)" },
              idMedico: `MOCK_CARDIO_U${unidade1.id}`,
              nmMedico: `Dr. Cardiologista - ${unidade1.nome.split(' - ')[1] || unidade1.nome}`,
              unidade: { id: unidade1.id, nome: unidade1.nome }
            }
          },
          {
            specialty: mockEspecialidades[1],
            professional: {
              id: `MOCK_OFTALMO_U${unidade2.id}`,
              nome: `Dra. Oftalmologista - ${unidade2.nome.split(' - ')[1] || unidade2.nome}`,
              idAgenda: 88002 + slotIdx + (dayOffset * 100),
              dataAgenda: dateStr,
              dataAgenda2: `${dateStr} ${time2}`,
              unidade: { id: unidade2.id.toString(), descricao: unidade2.nome }
            },
            horario: {
              id: 88002 + (dayOffset * 100) + slotIdx,
              idAgenda: 88002 + slotIdx + (dayOffset * 100),
              horaEspecial: "N",
              data: dateStr,
              data2: `${dateStr} ${time2}`,
              especialidadeAgenda: { id: 99902, descricao: "OFTALMOLOGIA (MOCK)" },
              idMedico: `MOCK_OFTALMO_U${unidade2.id}`,
              nmMedico: `Dra. Oftalmologista - ${unidade2.nome.split(' - ')[1] || unidade2.nome}`,
              unidade: { id: unidade2.id, nome: unidade2.nome }
            }
          }
        ]
      });
    }
  }

  return { especialidades: mockEspecialidades, results: mockResults, differentUnitsResults };
};

const SmartScheduling = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [showDifferentUnitsOption, setShowDifferentUnitsOption] = useState(false);
  const [differentUnitsResults, setDifferentUnitsResults] = useState<SmartScheduleResult[]>([]);
  const [isSearchingDifferentUnits, setIsSearchingDifferentUnits] = useState(false);
  const [showingDifferentUnits, setShowingDifferentUnits] = useState(false);
  
  // Confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SmartScheduleResult | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [token, setToken] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [bookingProgress, setBookingProgress] = useState<{ current: number; total: number; completed: string[] }>({ current: 0, total: 0, completed: [] });
  const [autoSearchTriggered, setAutoSearchTriggered] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  
  // Função para ativar modo de teste com dados mock
  const handleTestMode = () => {
    const mockData = generateMockData();
    setIsTestMode(true);
    setSelectedEspecialidades(mockData.especialidades);
    setResults(mockData.results);
    setDifferentUnitsResults(mockData.differentUnitsResults);
    setShowDifferentUnitsOption(true); // Mostrar opção de unidades diferentes
    setHasSearched(true);
    setIsSearching(false);
    toast({
      title: "Modo de Teste Ativado",
      description: `${mockData.results.length} horários na mesma unidade + ${mockData.differentUnitsResults.length} em unidades diferentes.`
    });
  };

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

  // Receber especialidades do AppointmentDetails e iniciar busca automaticamente
  useEffect(() => {
    const state = location.state as { fromAppointmentDetails?: boolean; especialidades?: Especialidade[]; convenio?: string } | null;
    
    if (state?.fromAppointmentDetails && state?.especialidades && state.especialidades.length >= 2) {
      setSelectedEspecialidades(state.especialidades);
      setAutoSearchTriggered(true);
    }
  }, [location.state]);

  // Iniciar busca automaticamente quando especialidades são recebidas do AppointmentDetails
  useEffect(() => {
    if (autoSearchTriggered && selectedPatient && selectedEspecialidades.length >= 2 && !hasSearched) {
      handleSearchSchedules();
    }
  }, [autoSearchTriggered, selectedPatient, selectedEspecialidades, hasSearched]);

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
    setShowDifferentUnitsOption(false);
    setDifferentUnitsResults([]);
    setShowingDifferentUnits(false);

    try {
      const headers = getApiHeaders();
      // Map com chave composta: "dateKeyNum-unitId" para agrupar por data E unidade
      const allSchedules: Map<string, { 
        specialty: Especialidade; 
        horarios: HorarioDisponivel[]; 
        professional: Profissional;
        unitId: number;
        unitName: string;
      }[]> = new Map();

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
              const dateKeyNum = parseInt(`${year}${month}${day}`);
              
              // Chave composta: data + unidade
              const compositeKey = `${dateKeyNum}-${horario.unidade.id}`;

              if (!allSchedules.has(compositeKey)) {
                allSchedules.set(compositeKey, []);
              }

              allSchedules.get(compositeKey)!.push({
                specialty: especialidade,
                horarios: [horario],
                professional: prof,
                unitId: horario.unidade.id,
                unitName: horario.unidade.nome
              });
            }
          }
        }
      }

      // DEBUG: Log all schedules grouped by composite key
      console.log("=== DEBUG: AGENDAMENTO INTELIGENTE ===");
      console.log("Especialidades selecionadas:", selectedEspecialidades.map(e => ({ id: e.id, descricao: e.descricao })));
      console.log("Total de chaves compostas (data+unidade):", allSchedules.size);
      
      allSchedules.forEach((schedules, compositeKey) => {
        console.log(`\n--- Chave: ${compositeKey} ---`);
        console.log("Unidade:", schedules[0]?.unitName, "(ID:", schedules[0]?.unitId, ")");
        console.log("Total de horários nesta chave:", schedules.length);
        console.log("Especialidades presentes:", [...new Set(schedules.map(s => s.specialty.descricao))]);
        schedules.forEach(s => {
          console.log(`  - ${s.specialty.descricao} | ${s.horarios[0].data2} | Dr(a). ${s.horarios[0].nmMedico} | Unidade: ${s.horarios[0].unidade.nome} (${s.horarios[0].unidade.id})`);
        });
      });

      // Find date+unit combinations that have all selected specialties
      const validResults: SmartScheduleResult[] = [];
      
      allSchedules.forEach((schedules, compositeKey) => {
        // Extrair unitId e unitName do primeiro schedule (todos são da mesma unidade nesta chave)
        const unitId = schedules[0].unitId;
        const unitName = schedules[0].unitName;
        
        // Check if all specialties are present
        const specialtiesInDate = new Set(schedules.map(s => s.specialty.id));
        const allSpecialtiesPresent = selectedEspecialidades.every(e => specialtiesInDate.has(e.id));

        console.log(`\n=== Validando chave: ${compositeKey} ===`);
        console.log("Especialidades na chave:", [...specialtiesInDate]);
        console.log("Todas especialidades presentes?", allSpecialtiesPresent);

        if (!allSpecialtiesPresent) {
          console.log("❌ REJEITADO: Faltam especialidades");
          return;
        }

        // Group by specialty
        const bySpecialty = new Map<number, { specialty: Especialidade; horarios: HorarioDisponivel[]; professional: Profissional; unitId: number; unitName: string }[]>();
        schedules.forEach(s => {
          if (!bySpecialty.has(s.specialty.id)) {
            bySpecialty.set(s.specialty.id, []);
          }
          bySpecialty.get(s.specialty.id)!.push(s);
        });

        // Try to find compatible combinations (30min - 60min apart)
        const findValidCombination = (): ScheduleSlot[] | null => {
          const specialtyArrays = Array.from(bySpecialty.values());
          
          console.log("Buscando combinação válida...");
          
          // Get all time slots for first specialty
          for (const first of specialtyArrays[0]) {
            const firstHorario = first.horarios[0];
            const firstTime = parseTimeToMinutes(firstHorario.data2.split(' ')[1]);
            
            console.log(`  Tentando com primeiro horário: ${firstHorario.data2.split(' ')[1]} (${firstTime} min)`);
            
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
                const diffs = usedTimes.map(usedTime => Math.abs(otherTime - usedTime));
                
                // Check if time is valid (30-60 min apart from all other times)
                const isValidTime = usedTimes.every(usedTime => {
                  const diff = Math.abs(otherTime - usedTime);
                  return diff >= 30 && diff <= 60;
                });

                console.log(`    Comparando ${otherHorario.data2.split(' ')[1]} (${otherTime} min) - Diffs: ${diffs.join(', ')} - Válido: ${isValidTime}`);

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
              console.log("  ✅ Combinação válida encontrada!");
              return combination.sort((a, b) => 
                parseTimeToMinutes(a.horario.data2.split(' ')[1]) - 
                parseTimeToMinutes(b.horario.data2.split(' ')[1])
              );
            }
          }
          
          console.log("  ❌ Nenhuma combinação válida");
          return null;
        };

        const validCombination = findValidCombination();
        if (validCombination) {
          const dateStr = validCombination[0].horario.data2.split(' ')[0];
          const [day, month, year] = dateStr.split('/');
          const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          
          const result = {
            date: `${year}-${month}-${day}`,
            dateFormatted: format(parsedDate, "EEEE, dd 'de' MMMM", { locale: ptBR }),
            unitId: unitId,
            unitName: unitName,
            slots: validCombination
          };
          
          console.log("✅ RESULTADO ADICIONADO:", result);
          validResults.push(result);
        }
      });

      // Sort by date
      console.log("\n=== RESULTADOS FINAIS ===");
      console.log("Total de combinações válidas:", validResults.length);
      validResults.forEach((r, i) => {
        console.log(`${i + 1}. ${r.dateFormatted} | ${r.unitName} | Slots:`, r.slots.map(s => `${s.horario.data2.split(' ')[1]} - ${s.specialty.descricao}`));
      });
      
      validResults.sort((a, b) => a.date.localeCompare(b.date));
      setResults(validResults.slice(0, 10)); // Limit to 10 results
      
      // Se não encontrou resultados na mesma unidade, habilitar opção de buscar em unidades diferentes
      if (validResults.length === 0) {
        console.log("Nenhum resultado na mesma unidade - habilitando busca em unidades diferentes");
        setShowDifferentUnitsOption(true);
      }

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

  // Busca em unidades diferentes (intervalo de até 3 horas)
  const handleSearchDifferentUnits = async () => {
    if (selectedEspecialidades.length < 2 || !selectedPatient) return;

    setIsSearchingDifferentUnits(true);
    setDifferentUnitsResults([]);

    try {
      const headers = getApiHeaders();
      // Map com chave baseada apenas na data (sem unidade)
      const allSchedulesByDate: Map<number, { 
        specialty: Especialidade; 
        horarios: HorarioDisponivel[]; 
        professional: Profissional;
        unitId: number;
        unitName: string;
      }[]> = new Map();

      // Fetch schedules for each specialty
      for (const especialidade of selectedEspecialidades) {
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

        for (const prof of profData.dados.slice(0, 5)) {
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
              const dateKeyNum = parseInt(`${year}${month}${day}`);

              if (!allSchedulesByDate.has(dateKeyNum)) {
                allSchedulesByDate.set(dateKeyNum, []);
              }

              allSchedulesByDate.get(dateKeyNum)!.push({
                specialty: especialidade,
                horarios: [horario],
                professional: prof,
                unitId: horario.unidade.id,
                unitName: horario.unidade.nome
              });
            }
          }
        }
      }

      console.log("=== DEBUG: BUSCA EM UNIDADES DIFERENTES ===");
      console.log("Total de datas:", allSchedulesByDate.size);

      const validResults: SmartScheduleResult[] = [];

      allSchedulesByDate.forEach((schedules, dateKey) => {
        const specialtiesInDate = new Set(schedules.map(s => s.specialty.id));
        const allSpecialtiesPresent = selectedEspecialidades.every(e => specialtiesInDate.has(e.id));

        console.log(`\n=== Data: ${dateKey} ===`);
        console.log("Especialidades presentes:", [...specialtiesInDate]);
        console.log("Todas presentes?", allSpecialtiesPresent);

        if (!allSpecialtiesPresent) {
          console.log("❌ REJEITADO: Faltam especialidades");
          return;
        }

        // Group by specialty
        const bySpecialty = new Map<number, typeof schedules>();
        schedules.forEach(s => {
          if (!bySpecialty.has(s.specialty.id)) {
            bySpecialty.set(s.specialty.id, []);
          }
          bySpecialty.get(s.specialty.id)!.push(s);
        });

        // Buscar combinação com intervalo de até 3 horas (180 minutos)
        const findValidCombination = (): ScheduleSlot[] | null => {
          const specialtyArrays = Array.from(bySpecialty.values());

          for (const first of specialtyArrays[0]) {
            const firstHorario = first.horarios[0];
            const firstTime = parseTimeToMinutes(firstHorario.data2.split(' ')[1]);

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

                // Verificar se está entre 30 min e 3 horas (180 min) de todos os outros horários
                const isValidTime = usedTimes.every(usedTime => {
                  const diff = Math.abs(otherTime - usedTime);
                  return diff >= 30 && diff <= 180; // 30 min a 3 horas
                });

                console.log(`  Comparando ${otherHorario.data2.split(' ')[1]} com tempos usados - Válido: ${isValidTime}`);

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

          // Verificar se são unidades diferentes
          const unitIds = new Set(validCombination.map(s => s.horario.unidade.id));
          const isDifferentUnits = unitIds.size > 1;

          if (isDifferentUnits) {
            validResults.push({
              date: `${year}-${month}-${day}`,
              dateFormatted: format(parsedDate, "EEEE, dd 'de' MMMM", { locale: ptBR }),
              unitId: validCombination[0].horario.unidade.id,
              unitName: "Unidades diferentes",
              slots: validCombination,
              isDifferentUnits: true
            });
            console.log("✅ Combinação em unidades diferentes encontrada!");
          }
        }
      });

      console.log("\n=== RESULTADOS UNIDADES DIFERENTES ===");
      console.log("Total:", validResults.length);

      validResults.sort((a, b) => a.date.localeCompare(b.date));
      setDifferentUnitsResults(validResults.slice(0, 10));
      setShowingDifferentUnits(true);
    } catch (error) {
      console.error("Erro ao buscar em unidades diferentes:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar agendas em unidades diferentes"
      });
    } finally {
      setIsSearchingDifferentUnits(false);
    }
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
              
              {/* Botão de Teste - apenas para desenvolvimento */}
              <Button
                onClick={handleTestMode}
                variant="outline"
                className="w-full border-dashed border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
              >
                🧪 Testar com Dados Mock (TESTE INTELIGENTE 1 e 2)
              </Button>
              
              {isTestMode && (
                <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    Modo de teste ativo. Os dados exibidos são simulados e não representam agendas reais.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {hasSearched && !isSearching && (
            <div className="space-y-4">
              {results.length === 0 && !showingDifferentUnits ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium mb-2">Nenhuma combinação encontrada na mesma unidade</p>
                      <p className="text-sm">
                        Não encontramos dias com todas as especialidades disponíveis no intervalo de 30-60 minutos na mesma unidade.
                      </p>
                      
                      {showDifferentUnitsOption && (
                        <div className="mt-6">
                          <Alert className="text-left mb-4">
                            <Building2 className="h-4 w-4" />
                            <AlertDescription>
                              Podemos buscar combinações em <strong>unidades diferentes</strong> com intervalo de até 3 horas entre consultas. Você precisará se deslocar entre unidades.
                            </AlertDescription>
                          </Alert>
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={handleSearchDifferentUnits}
                              disabled={isSearchingDifferentUnits}
                              variant="outline"
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              {isSearchingDifferentUnits ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Buscando em unidades diferentes...
                                </>
                              ) : (
                                <>
                                  <Building2 className="mr-2 h-4 w-4" />
                                  Buscar em Unidades Diferentes
                                </>
                              )}
                            </Button>
                            
                            {/* Botão de teste para múltiplas unidades */}
                            <Button
                              onClick={() => {
                                const mockData = generateMockData();
                                setDifferentUnitsResults(mockData.differentUnitsResults);
                                setShowingDifferentUnits(true);
                                setResults([]); // Limpar resultados da mesma unidade para mostrar os de unidades diferentes
                                toast({
                                  title: "🧪 Mock de Unidades Diferentes",
                                  description: `Carregados ${mockData.differentUnitsResults.length} horários em 3 unidades diferentes.`
                                });
                              }}
                              variant="outline"
                              size="sm"
                              className="border-dashed border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                            >
                              🧪 Testar com Múltiplas Unidades (Mock)
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : results.length === 0 && showingDifferentUnits ? (
                <>
                  {differentUnitsResults.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <div className="text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="font-medium mb-2">Nenhuma combinação encontrada</p>
                          <p className="text-sm">
                            Não encontramos combinações nem mesmo em unidades diferentes.
                          </p>
                          <p className="text-sm mt-2">
                            Tente remover uma especialidade ou agendar separadamente.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-700 dark:text-amber-400">
                          <strong>Atenção:</strong> As combinações abaixo são em unidades diferentes. Você precisará se deslocar entre as unidades. O intervalo entre consultas é de até 3 horas.
                        </AlertDescription>
                      </Alert>
                      
                      <h3 className="font-semibold text-lg">
                        {differentUnitsResults.length} {differentUnitsResults.length === 1 ? 'combinação encontrada' : 'combinações encontradas'} em unidades diferentes
                      </h3>
                      
                      {differentUnitsResults.map((result, idx) => (
                        <Card key={`${result.date}-diff-${idx}`} className="border-2 border-amber-300 hover:border-amber-500 transition-colors">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="capitalize">{result.dateFormatted}</span>
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-amber-600">
                              <Building2 className="h-4 w-4" />
                              Unidades diferentes
                            </div>
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
                                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 font-medium">
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
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-lg">
                    {results.length} {results.length === 1 ? 'combinação encontrada' : 'combinações encontradas'}
                  </h3>
                  
                  {results.map((result, idx) => (
                    <Card key={`${result.date}-${result.unitId}`} className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="capitalize">{result.dateFormatted}</span>
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {result.unitName}
                        </div>
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
