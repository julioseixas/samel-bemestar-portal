import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface Patient {
  id: number;
  nome: string;
  tipo: string;
  sexo?: string;
  codigoCarteirinha?: string;
  dataNascimento?: string;
  clienteContratos?: Array<{
    id: string;
    sexo?: string;
    codigoCarteirinha?: string;
    dataNascimento?: string;
  }>;
}

const AppointmentSchedule = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedListToSchedule = localStorage.getItem("listToSchedule");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");

    if (storedTitular) {
      try {
        const parsedTitular = JSON.parse(storedTitular);
        setPatientName(parsedTitular.titular?.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao processar titular:", error);
      }
    }

    if (storedListToSchedule) {
      try {
        const parsedList = JSON.parse(storedListToSchedule);
        
        if (parsedList.listAllPacient && parsedList.listAllPacient.length > 0) {
          console.log("Pacientes carregados:", parsedList.listAllPacient);
          setPatients(parsedList.listAllPacient);
        }
      } catch (error) {
        console.error("Erro ao processar lista de pacientes:", error);
      }
    }

    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }
  }, []);

  const handleSelectPatient = (patient: Patient) => {
    // Para o titular, pegar dados do clienteContratos[0] se existir
    const patientData = patient.tipo === "Titular" && patient.clienteContratos?.[0]
      ? {
          id: patient.id,
          nome: patient.nome,
          tipo: patient.tipo,
          sexo: patient.clienteContratos[0].sexo,
          codigoCarteirinha: patient.clienteContratos[0].codigoCarteirinha,
          dataNascimento: patient.clienteContratos[0].dataNascimento
        }
      : {
          id: patient.id,
          nome: patient.nome,
          tipo: patient.tipo,
          sexo: patient.sexo,
          codigoCarteirinha: patient.codigoCarteirinha,
          dataNascimento: patient.dataNascimento
        };
    
    console.log("Dados do paciente selecionado:", patientData);
    localStorage.setItem("selectedPatient", JSON.stringify(patientData));
    navigate("/appointment-details");
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Marcação de Consulta
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Selecione para quem você deseja marcar a consulta
            </p>
          </div>

          {patients.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Nenhum paciente disponível para agendamento.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {patients.map((patient) => (
                  <Card 
                    key={patient.id} 
                    className="group cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary"
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{patient.nome}</CardTitle>
                          <div className="mt-2 flex gap-2">
                            <Badge 
                              variant={patient.tipo === "Titular" ? "default" : "secondary"}
                            >
                              {patient.tipo}
                            </Badge>
                            {patient.sexo && (
                              <Badge variant="outline">
                                {patient.sexo?.toUpperCase() === 'M' ? 'Masculino' : 'Feminino'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg text-destructive">DEBUG - Lista de Pacientes (JSON)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-auto rounded-md bg-muted p-4 text-xs max-h-96">
                    {JSON.stringify(patients, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppointmentSchedule;
