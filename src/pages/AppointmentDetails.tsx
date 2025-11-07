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
        setPatientName(parsedTitular.titular?.nome || "Paciente");
        setTitular(parsedTitular.titular);
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
        console.log("Encaminhamentos carregados:", parsedEncaminhamentos);
        setEncaminhamentos(parsedEncaminhamentos);
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

      if (!selectedConvenio || !selectedPatient || !titular) {
        console.log("Dados insuficientes:", { selectedConvenio, selectedPatient, titular });
        return;
      }

      try {
        setLoadingEspecialidades(true);
        setEspecialidades([]);
        setSelectedEspecialidade("");

        const cdDependente = selectedPatient.id?.toString() || "";
        const nrCarteirinha = selectedPatient.codigoCarteirinha || "";
        const cdPessoaFisica = selectedPatient.cdPessoaFisica?.toString() || titular.cdPessoaFisica?.toString() || "";
        
        console.log("Parâmetros da busca de especialidades:", {
          idConvenio: selectedConvenio,
          idadeCliente: selectedPatient.idade?.toString() || "0",
          cdPessoaFisica,
          sexo: selectedPatient.sexo || "",
          descricaoEspecialidade: "",
          cdDependente,
          nrCarteirinha
        });
        
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
        
        console.log("Resposta especialidades:", data);
        
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
  }, [selectedConvenio, selectedPatient, titular, useEncaminhamento]);

  // Reset especialidade quando trocar o modo de encaminhamento
  useEffect(() => {
    setSelectedEspecialidade("");
  }, [useEncaminhamento]);

  const handleContinue = async () => {
    console.log("=== INICIANDO BUSCA DE PROFISSIONAIS ===");
    
    if (!selectedConvenio || !selectedEspecialidade) {
      alert("Por favor, selecione o convênio e a especialidade");
      return;
    }

    if (!selectedPatient || !titular) {
      alert("Dados do paciente não encontrados");
      return;
    }

    try {
      const cdPessoaFisica = selectedPatient.cdPessoaFisica?.toString() || titular.cdPessoaFisica?.toString() || "";
      const idDependente = selectedPatient.id?.toString() || "";
      
      console.log("Dados para busca:", {
        idConvenio: selectedConvenio,
        idEspecialidade: selectedEspecialidade,
        cdPessoaFisica,
        idDependente
      });

      const headers = getApiHeaders();

      const params = new URLSearchParams({
        idConvenio: selectedConvenio,
        idEspecialidade: selectedEspecialidade,
        cdPessoaFisica,
        idDependente
      });

      console.log("URL da requisição:", `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarProfissionaisComAgendaDisponivel?${params}`);

      const response = await fetch(
        `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarProfissionaisComAgendaDisponivel?${params}`,
        {
          method: "GET",
          headers
        }
      );

      const data = await response.json();
      console.log("Resposta da API:", data);

      if (data.sucesso && data.dados) {
        // Salvar os dados no localStorage
        localStorage.setItem("appointmentProfessionals", JSON.stringify(data.dados));
        localStorage.setItem("selectedAppointmentConvenio", selectedConvenio);
        localStorage.setItem("selectedAppointmentEspecialidade", selectedEspecialidade);
        
        console.log("Dados salvos no localStorage:", {
          profissionais: data.dados,
          convenio: selectedConvenio,
          especialidade: selectedEspecialidade
        });
        
        // Navegar para a página de seleção de profissionais
        navigate("/appointment-professionals");
      } else {
        console.error("Erro na resposta da API:", data);
        alert(data.mensagem || "Nenhum profissional disponível encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
      alert("Erro ao buscar profissionais disponíveis");
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
            <Button
              variant="outline"
              onClick={() => navigate("/appointment-schedule")}
              className="mb-3 sm:mb-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
              size="sm"
            >
              ← Voltar
            </Button>
            
            <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
              Marcação de Consulta
            </h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
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
