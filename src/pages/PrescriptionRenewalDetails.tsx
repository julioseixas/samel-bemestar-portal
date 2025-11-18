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
    if (selectedPatient) {
      fetchConvenios();
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (selectedConvenio && selectedPatient) {
      fetchEspecialidades();
    }
  }, [selectedConvenio, selectedPatient]);

  const fetchConvenios = async () => {
    if (!selectedPatient?.codigoCarteirinha) return;

    try {
      setLoadingConvenios(true);
      const headers = getApiHeaders();
      const response = await fetch(
        `https://api-portalpaciente-web.samel.com.br/api/Convenio/ListarConveniosDisponiveis?codigoCarteirinha=${selectedPatient.codigoCarteirinha}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar convênios");
      }

      const data = await response.json();

      if (data.sucesso && data.dados) {
        setConvenios(data.dados);
        
        const convenio19 = data.dados.find((c: Convenio) => c.id === 19);
        if (convenio19) {
          setSelectedConvenio(convenio19.id.toString());
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
      const cdDependente = selectedPatient.id;
      
      const response = await fetch(
        `https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarEspecialidadesDisponiveisParaAgendamento2?cdPessoaFisica=${selectedPatient.cdPessoaFisica}&cdConvenio=${selectedConvenio}&codigoCarteirinha=${selectedPatient.codigoCarteirinha}&cdDependente=${cdDependente}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar especialidades");
      }

      const data = await response.json();

      if (data.sucesso && data.dados) {
        setEspecialidades(data.dados);
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

        {selectedPatient && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Paciente Selecionado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selectedPatient.nome}</span>
                  <Badge variant={selectedPatient.tipo === "Titular" ? "default" : "secondary"}>
                    {selectedPatient.tipo}
                  </Badge>
                </div>
                {selectedPatient.sexo && (
                  <p className="text-sm text-muted-foreground">
                    {selectedPatient.sexo === "M" ? "Masculino" : "Feminino"}
                    {selectedPatient.idade && ` • ${selectedPatient.idade} anos`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Convênio</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingConvenios ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="convenio">Selecione o convênio</Label>
                  <Select value={selectedConvenio} onValueChange={setSelectedConvenio}>
                    <SelectTrigger id="convenio">
                      <SelectValue placeholder="Escolha um convênio" />
                    </SelectTrigger>
                    <SelectContent>
                      {convenios.map((convenio) => (
                        <SelectItem key={convenio.id} value={convenio.id.toString()}>
                          {convenio.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedConvenio && (
            <Card>
              <CardHeader>
                <CardTitle>Especialidade</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEspecialidades ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="especialidade">Selecione a especialidade</Label>
                    <Select value={selectedEspecialidade} onValueChange={setSelectedEspecialidade}>
                      <SelectTrigger id="especialidade">
                        <SelectValue placeholder="Escolha uma especialidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {especialidades.map((especialidade) => (
                          <SelectItem key={especialidade.id} value={especialidade.id.toString()}>
                            {especialidade.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {selectedConvenio && selectedEspecialidade && (
            <Button onClick={handleContinue} className="w-full" size="lg">
              Continuar
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default PrescriptionRenewalDetails;
