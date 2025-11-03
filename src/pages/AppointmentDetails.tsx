import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Patient {
  id: number;
  nome: string;
  tipo: string;
  sexo?: string;
}

const AppointmentDetails = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedConvenio, setSelectedConvenio] = useState("");
  const [selectedEspecialidade, setSelectedEspecialidade] = useState("");

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const storedSelectedPatient = localStorage.getItem("selectedPatient");

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
  }, [navigate]);

  const handleContinue = () => {
    if (!selectedConvenio || !selectedEspecialidade) {
      alert("Por favor, selecione o convênio e a especialidade");
      return;
    }
    // TODO: Navegar para próxima etapa
    console.log("Convênio:", selectedConvenio);
    console.log("Especialidade:", selectedEspecialidade);
  };

  if (!selectedPatient) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-10">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate("/appointment-schedule")}
              className="mb-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              ← Voltar
            </Button>
            
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Marcação de Consulta
            </h2>
            <p className="mt-2 text-muted-foreground">
              Selecione o convênio e a especialidade para a consulta
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Paciente Selecionado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Nome:</span>
                  <p className="text-lg font-semibold">{selectedPatient.nome}</p>
                </div>
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
                <CardTitle>Detalhes da Consulta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="convenio">Convênio</Label>
                  <Select value={selectedConvenio} onValueChange={setSelectedConvenio}>
                    <SelectTrigger id="convenio">
                      <SelectValue placeholder="Selecione o convênio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unimed">Unimed</SelectItem>
                      <SelectItem value="bradesco">Bradesco Saúde</SelectItem>
                      <SelectItem value="sulamerica">SulAmérica</SelectItem>
                      <SelectItem value="amil">Amil</SelectItem>
                      <SelectItem value="particular">Particular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="especialidade">Especialidade</Label>
                  <Select value={selectedEspecialidade} onValueChange={setSelectedEspecialidade}>
                    <SelectTrigger id="especialidade">
                      <SelectValue placeholder="Selecione a especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiologia">Cardiologia</SelectItem>
                      <SelectItem value="dermatologia">Dermatologia</SelectItem>
                      <SelectItem value="ortopedia">Ortopedia</SelectItem>
                      <SelectItem value="pediatria">Pediatria</SelectItem>
                      <SelectItem value="clinica-geral">Clínica Geral</SelectItem>
                      <SelectItem value="ginecologia">Ginecologia</SelectItem>
                    </SelectContent>
                  </Select>
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
