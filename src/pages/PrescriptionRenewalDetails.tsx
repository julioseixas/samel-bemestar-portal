import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getApiHeaders } from "@/lib/api-headers";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

const PrescriptionRenewalDetails = () => {
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

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const storedSelectedPatient = localStorage.getItem("selectedPatientRenewal");

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
        navigate("/prescription-renewal-schedule");
      }
    } else {
      navigate("/prescription-renewal-schedule");
    }
  }, [navigate]);

  useEffect(() => {
    fetchConvenios();
  }, []);

  useEffect(() => {
    if (selectedConvenio && selectedPatient) {
      fetchEspecialidades();
    }
  }, [selectedConvenio, selectedPatient]);

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
        
        const convenioSamel = data.dados.find((convenio: Convenio) => convenio.id === 19);
        if (convenioSamel) {
          setSelectedConvenio("19");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar convênios:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os convênios disponíveis.",
      });
    } finally {
      setLoadingConvenios(false);
    }
  };

  const fetchEspecialidades = async () => {
    if (!selectedPatient?.cdPessoaFisica || !selectedConvenio) return;

    try {
      setLoadingEspecialidades(true);
      const headers = getApiHeaders();
      
      const params = new URLSearchParams({
        idConvenio: selectedConvenio,
        idadeCliente: String(selectedPatient.idade || 0),
        cdPessoaFisica: String(selectedPatient.cdPessoaFisica),
        sexo: selectedPatient.sexo || "M",
        descricaoEspecialidade: "",
        cdDependente: String(selectedPatient.cdPessoaFisica),
        nrCarteirinha: selectedPatient.codigoCarteirinha || "",
      });
      
      const response = await fetch(
        `https://appv2-back.samel.com.br/api/Agenda/Consulta/ListarEspecialidadesComAgendaDisponivel3?${params}`,
        { 
          method: "GET",
          headers 
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar especialidades");
      }

      const data = await response.json();

      if (data.sucesso && data.dados) {
        setEspecialidades(data.dados);
        
        const renovacaoReceita = data.dados.find((e: Especialidade) => 
          e.descricao === "Renovação de Receita"
        );
        if (renovacaoReceita) {
          setSelectedEspecialidade(String(renovacaoReceita.id));
        }
      }
    } catch (error) {
      console.error("Erro ao buscar especialidades:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as especialidades disponíveis.",
      });
    } finally {
      setLoadingEspecialidades(false);
    }
  };

  const handleBack = () => {
    const listToSchedule = localStorage.getItem("listToSchedule");
    
    if (listToSchedule) {
      try {
        const parsedList = JSON.parse(listToSchedule);
        const patientList = Array.isArray(parsedList) 
          ? parsedList 
          : parsedList.listAllPacient || [];
        
        if (patientList.length > 1) {
          navigate("/prescription-renewal-schedule");
          return;
        }
      } catch (error) {
        console.error("Erro ao processar lista:", error);
      }
    }
    
    navigate("/dashboard");
  };

  const handleContinue = () => {
    if (!selectedConvenio || !selectedEspecialidade) {
      toast({
        variant: "destructive",
        title: "Atenção",
        description: "Por favor, selecione o convênio e a especialidade.",
      });
      return;
    }

    toast({
      title: "Em desenvolvimento",
      description: "A próxima etapa do fluxo será implementada em breve.",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Renovação de Receita
            </h1>
            <p className="text-muted-foreground">
              Selecione o convênio e a especialidade
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
            size="sm"
          >
            ← Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedPatient && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paciente Selecionado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome:</p>
                  <p className="font-semibold text-foreground">{selectedPatient.nome}</p>
                </div>
                
                {selectedPatient.codigoCarteirinha && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Código da Carteirinha:</p>
                    <p className="font-semibold text-foreground">{selectedPatient.codigoCarteirinha}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Badge variant={selectedPatient.tipo === "Titular" ? "default" : "secondary"}>
                    {selectedPatient.tipo}
                  </Badge>
                  {selectedPatient.sexo && (
                    <Badge variant="outline">
                      {selectedPatient.sexo === "M" ? "Masculino" : "Feminino"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes da Renovação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingConvenios ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="convenio">Convênio</Label>
                  <Select value={selectedConvenio} onValueChange={setSelectedConvenio}>
                    <SelectTrigger id="convenio">
                      <SelectValue placeholder="Escolha um convênio" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {convenios.map((convenio) => (
                        <SelectItem key={convenio.id} value={convenio.id.toString()}>
                          {convenio.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedConvenio && (
                <>
                  {loadingEspecialidades ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="especialidade">Especialidade</Label>
                      <Select value={selectedEspecialidade} onValueChange={setSelectedEspecialidade}>
                        <SelectTrigger id="especialidade">
                          <SelectValue placeholder="Escolha uma especialidade" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {especialidades.map((especialidade) => (
                            <SelectItem key={especialidade.id} value={especialidade.id.toString()}>
                              {especialidade.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedEspecialidade && (
                    <Button onClick={handleContinue} className="w-full mt-4" size="lg">
                      Continuar
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PrescriptionRenewalDetails;
