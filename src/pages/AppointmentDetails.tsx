import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getApiHeaders } from "@/lib/api-headers";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string | number;
  nome: string;
  tipo: string;
  sexo?: string;
  codigoCarteirinha?: string;
  idade?: number;
  cdPessoaFisica?: string | number;
}

interface Convenio {
  id: number;
  descricao: string;
  convenioSamel: string;
  agenda_exames_livre: string;
  imagem: string;
}

interface Especialidade {
  id: number;
  descricao: string;
}

interface Encaminhamento {
  NR_SEQ_MED_AVALIACAO_PACIENTE: number;
  CD_PESSOA_FISICA_PACIENTE: string;
  CD_ESPECIALIDADE: number;
  CD_ESPECIALIDADE_AVALIACAO: string;
  CD_MEDICO: string;
  DS_DESCRICAO: string;
  DS_ESPECIALIDADE: string;
  DS_JUSTIFICATIVA: string;
  DS_OBSERVACAO: string;
  DT_AVALIACAO_DATE: string;
  DT_AVALIACAO_STRING: string;
  DT_LIBERACAO_DATE: string;
  DT_LIBERACAO_STRING: string;
  IE_FOI_AGENDADO: string;
  IE_PACIENTE_FOI_CONSULTADO: string;
  NM_MEDICO: string;
  NM_PACIENTE: string;
  NR_ATENDIMENTO: number;
  NR_SEQ_MED_AVALIACAO: number;
  NR_TELEFONE: string | null;
  descricao: string | null;
  id: number;
}

const AppointmentDetails = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [titular, setTitular] = useState<Patient | null>(null);
  const [selectedConvenio, setSelectedConvenio] = useState("");
  const [selectedEspecialidade, setSelectedEspecialidade] = useState("");
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loadingConvenios, setLoadingConvenios] = useState(true);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);
  const [encaminhamentos, setEncaminhamentos] = useState<Encaminhamento[]>([]);
  const [useEncaminhamento, setUseEncaminhamento] = useState(false);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const storedSelectedPatient = localStorage.getItem("selectedPatient");

    if (storedTitular) {
      try {
        const parsedTitular = JSON.parse(storedTitular);
        setPatientName(parsedTitular.nome || "Paciente");
        setTitular(parsedTitular);
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
        console.error("Erro ao processar paciente selecionado:", error);
        navigate("/appointment-schedule");
      }
    } else {
      navigate("/appointment-schedule");
    }

    // Verificar se existem encaminhamentos salvos
    const storedEncaminhamentos = localStorage.getItem("patientEncaminhamentos");
    if (storedEncaminhamentos) {
      try {
        const parsedEncaminhamentos = JSON.parse(storedEncaminhamentos);
        
        // Filtrar duplicatas por id como medida de segurança
        const encaminhamentosUnicos = parsedEncaminhamentos.reduce((acc: Encaminhamento[], current: Encaminhamento) => {
          const existe = acc.find(item => item.id === current.id);
          if (!existe) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        setEncaminhamentos(encaminhamentosUnicos);
      } catch (error) {
        console.error("Erro ao processar encaminhamentos:", error);
      }
    }
  }, [navigate]);

  useEffect(() => {
    const fetchConvenios = async () => {
      try {
        setLoadingConvenios(true);
        
        const headers = getApiHeaders();
        
        const response = await fetch(
          'https://api-portalpaciente-web.samel.com.br/api/Convenio/ListarConvenios',
          {
            method: "GET",
            headers
          }
        );
        const data = await response.json();
        
        if (data.sucesso && data.dados) {
          setConvenios(data.dados);
          
          // Verificar se existe convênio com id 19 e selecionar automaticamente
          const convenioSamel = data.dados.find((convenio: Convenio) => convenio.id === 19);
          if (convenioSamel) {
            setSelectedConvenio("19");
          }
        }
      } catch (error) {
        console.error("Erro ao buscar convênios:", error);
      } finally {
        setLoadingConvenios(false);
      }
    };

    fetchConvenios();
  }, []);

  useEffect(() => {
    const fetchEspecialidades = async () => {
      // Se usar encaminhamento, não buscar especialidades normais
      if (useEncaminhamento) {
        return;
      }

      if (!selectedConvenio || !selectedPatient) {
        return;
      }

      if (!selectedPatient.codigoCarteirinha || selectedPatient.codigoCarteirinha.trim() === '') {
        console.error("ERRO: Paciente sem código de carteirinha válido");
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: "Paciente sem plano de saúde ativo. Retornando à seleção de pacientes."
        });
        navigate("/appointment-schedule");
        return;
      }

      try {
        setLoadingEspecialidades(true);
        setEspecialidades([]);
        setSelectedEspecialidade("");

      // IMPORTANTE: cdPessoaFisica deve SEMPRE ser o do titular
      const cdPessoaFisica = titular?.cdPessoaFisica?.toString() || "";
      
      // cdDependente deve SEMPRE ser o ID do paciente selecionado
      const cdDependente = selectedPatient.id?.toString() || "";
        
      const nrCarteirinha = selectedPatient.codigoCarteirinha?.toString() || "";
      
      const params = new URLSearchParams({
          idConvenio: selectedConvenio,
          idadeCliente: selectedPatient.idade?.toString() || "0",
          cdPessoaFisica,
          sexo: selectedPatient.sexo || "",
          descricaoEspecialidade: "",
          cdDependente: cdDependente,
          nrCarteirinha: nrCarteirinha
        });

        const headers = getApiHeaders();

        const response = await fetch(
          `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarEspecialidadesComAgendaDisponivel3?${params}`,
          {
            method: "GET",
            headers: headers
        }
      );
      const data = await response.json();
      
      if (data.sucesso && data.dados) {
          setEspecialidades(data.dados);
        } else {
          console.error("Erro ao buscar especialidades:", data.mensagem);
        }
      } catch (error) {
        console.error("Erro ao buscar especialidades:", error);
      } finally {
        setLoadingEspecialidades(false);
      }
    };

    fetchEspecialidades();
  }, [selectedConvenio, selectedPatient, useEncaminhamento]);

  // Reset especialidade quando trocar o modo de encaminhamento
  useEffect(() => {
    setSelectedEspecialidade("");
  }, [useEncaminhamento]);

  const handleContinue = async () => {
    if (!selectedConvenio || !selectedEspecialidade) {
      alert("Por favor, selecione o convênio e a especialidade");
      return;
    }

    if (!selectedPatient) {
      alert("Dados do paciente não encontrados");
      return;
    }

    try {
      // IMPORTANTE: idCliente deve SEMPRE ser o cdPessoaFisica do titular
      const idCliente = titular?.cdPessoaFisica?.toString() || "";
      const idadeCliente = selectedPatient.idade?.toString() || "0";
      const sexo = selectedPatient.sexo || "";
      
      // cdDependente deve SEMPRE ser o ID do paciente selecionado
      const cdDependente = selectedPatient.id?.toString() || "";
      const nrCarteirinha = selectedPatient.codigoCarteirinha?.toString() || "";
      
      const headers = getApiHeaders();

      const params = new URLSearchParams({
        idConvenio: selectedConvenio,
        idadeCliente,
        idEspecialidade: selectedEspecialidade,
        nomeProfissional: "",
        idCliente,
        sexo,
        cdDependente,
        nrCarteirinha
      });

      const response = await fetch(
        `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarProfissionaisComAgendaDisponivel3?${params}`,
        {
          method: "GET",
          headers
        }
      );

      const data = await response.json();

      if (data.sucesso && data.dados) {
        // Verificar se o array de profissionais está vazio
        if (data.dados.length === 0) {
          toast({
            variant: "destructive",
            title: "Nenhum profissional disponível",
            description: "Não há profissionais disponíveis para a especialidade selecionada no momento."
          });
          return;
        }

        // Buscar descrição da especialidade
        const especialidadeSelecionada = especialidades.find(e => e.id.toString() === selectedEspecialidade);
        const dsEspecialidade = especialidadeSelecionada?.descricao || "Especialidade";
        
        // Função para filtrar agendas duplicadas, mantendo apenas a mais recente
        const filtrarAgendasMaisRecentes = (arr: any[]) => {
          const finalList: any[] = [];

          for (let i = 0; i < arr.length; i++) {
            const atual = arr[i];
            let existe = false;

            for (let j = 0; j < finalList.length; j++) {
              if (finalList[j].idAgenda === atual.idAgenda) {
                // Se já existe, mantém o mais recente
                if (new Date(atual.dataAgenda2) > new Date(finalList[j].dataAgenda2)) {
                  finalList[j] = atual;
                }
                existe = true;
              }
            }

            if (!existe) {
              finalList.push(atual);
            }
          }

          return finalList;
        };

        // Filtrar profissionais duplicados antes de transformar os dados
        const profissionaisFiltrados = filtrarAgendasMaisRecentes(data.dados);
        
        // Transformar dados da API para o formato esperado pelo componente
        const profissionaisGroups = [{
          combinacao: "",
          dados: profissionaisFiltrados.map((prof: any) => ({
            idAgenda: prof.idAgenda,
            dataAgenda: prof.dataAgenda,
            dataAgenda2: prof.dataAgenda2,
            id: prof.id.toString(),
            nome: prof.nome,
            dsEspecialidade: dsEspecialidade,
            ieSexo: prof.ieSexo,
            ie_sigla_conselho: prof.ieSiglaConselho,
            nr_conselho: prof.nrConselho,
            idsProcedimentos: [],
            unidade: {
              id: prof.unidade.id.toString(),
              descricao: prof.unidade.descricao,
              logradouro: prof.unidade.logradouro,
              numeroLogradouro: prof.unidade.numeroLogradouro?.toString(),
              bairro: prof.unidade.bairro
            }
          }))
        }];
        
        // Salvar os dados transformados no localStorage
        localStorage.setItem("appointmentProfessionals", JSON.stringify(profissionaisGroups));
        localStorage.setItem("selectedAppointmentConvenio", selectedConvenio);
        localStorage.setItem("selectedAppointmentEspecialidade", selectedEspecialidade);
        
        navigate("/appointment-professionals");
      } else {
        console.error("Erro na resposta da API:", data);
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.mensagem || "Nenhum profissional disponível encontrado"
        });
      }
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar profissionais disponíveis"
      });
    }
  };

  if (!selectedPatient) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Marcação de Consulta
              </h2>
              
              <Button
                variant="outline"
                onClick={() => {
                  const listToSchedule = localStorage.getItem("listToSchedule");
                  if (listToSchedule) {
                    try {
                      // listToSchedule JÁ É o array listAllPacient
                      const listAllPacient = JSON.parse(listToSchedule);
                      const hasDependents = listAllPacient.length > 1;
                      navigate(hasDependents ? "/appointment-schedule" : "/dashboard");
                    } catch (error) {
                      console.error("Erro ao verificar dependentes:", error);
                      navigate("/dashboard");
                    }
                  } else {
                    navigate("/dashboard");
                  }
                }}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                ← Voltar
              </Button>
            </div>
            
            <p className="text-sm sm:text-base text-muted-foreground">
              Selecione o convênio e a especialidade para a consulta
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Paciente Selecionado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Nome:</span>
                  <p className="text-base sm:text-lg font-semibold">{selectedPatient.nome}</p>
                </div>
                {selectedPatient.codigoCarteirinha && (
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Código da Carteirinha:</span>
                    <p className="text-base sm:text-lg font-semibold">{selectedPatient.codigoCarteirinha}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Badge variant={selectedPatient.tipo === "Titular" ? "default" : "secondary"}>
                    {selectedPatient.tipo}
                  </Badge>
                  {selectedPatient.sexo && (
                    <Badge variant="outline">
                      {selectedPatient.sexo?.toUpperCase() === 'M' ? 'Masculino' : 'Feminino'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Detalhes da Consulta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="convenio">Convênio</Label>
                  <Select value={selectedConvenio} onValueChange={setSelectedConvenio} disabled={loadingConvenios}>
                    <SelectTrigger id="convenio">
                      <SelectValue placeholder={loadingConvenios ? "Carregando..." : "Selecione o convênio"} />
                    </SelectTrigger>
                    <SelectContent>
                      {convenios.map((convenio) => (
                        <SelectItem key={convenio.id} value={convenio.id.toString()}>
                          <div className="flex items-center gap-2">
                            {convenio.imagem && (
                              <img 
                                src={`data:image/png;base64,${convenio.imagem}`} 
                                alt={convenio.descricao}
                                className="h-6 w-6 object-contain"
                              />
                            )}
                            <span>{convenio.descricao}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {encaminhamentos.length > 0 && (
                  <div className="flex items-center space-x-2 p-3 rounded-lg border bg-muted/30">
                    <Checkbox 
                      id="encaminhamento" 
                      checked={useEncaminhamento}
                      onCheckedChange={(checked) => setUseEncaminhamento(checked === true)}
                    />
                    <Label 
                      htmlFor="encaminhamento" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Agendar por encaminhamento médico
                    </Label>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="especialidade">
                    {useEncaminhamento ? "Encaminhamento" : "Especialidade"}
                  </Label>
                  {useEncaminhamento ? (
                    <Select 
                      value={selectedEspecialidade} 
                      onValueChange={setSelectedEspecialidade}
                    >
                      <SelectTrigger id="especialidade">
                        <SelectValue placeholder="Selecione o encaminhamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {encaminhamentos.map((encaminhamento) => (
                          <SelectItem 
                            key={encaminhamento.id} 
                            value={encaminhamento.CD_ESPECIALIDADE.toString()}
                          >
                            {encaminhamento.descricao || encaminhamento.DS_ESPECIALIDADE}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select 
                      value={selectedEspecialidade} 
                      onValueChange={setSelectedEspecialidade}
                      disabled={!selectedConvenio || loadingEspecialidades}
                    >
                      <SelectTrigger id="especialidade">
                        <SelectValue placeholder={
                          loadingEspecialidades 
                            ? "Carregando..." 
                            : !selectedConvenio 
                              ? "Selecione um convênio primeiro"
                              : "Selecione a especialidade"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {especialidades.map((especialidade) => (
                          <SelectItem key={especialidade.id} value={especialidade.id.toString()}>
                            {especialidade.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Button 
                  onClick={handleContinue} 
                  className="mt-4 w-full"
                  disabled={!selectedConvenio || !selectedEspecialidade}
                >
                  Continuar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppointmentDetails;
