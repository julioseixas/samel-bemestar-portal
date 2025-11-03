import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { User, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: number;
  nome: string;
  tipo: string;
  dataNascimento?: string;
  cpf?: string;
  clienteContratos?: Array<{ id: number }>;
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
    // TODO: Navegar para próxima etapa de agendamento com o paciente selecionado
    console.log("Paciente selecionado:", patient);
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
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Marcação de Consulta
              </h2>
              <p className="mt-2 text-muted-foreground">
                Selecione para quem você deseja marcar a consulta
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Voltar ao Dashboard
            </Button>
          </div>

          {patients.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Nenhum paciente disponível para agendamento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className="group cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary"
                  onClick={() => handleSelectPatient(patient)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={patient.tipo === "Titular" ? profilePhoto || undefined : undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(patient.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{patient.nome}</CardTitle>
                          <Badge 
                            variant={patient.tipo === "Titular" ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {patient.tipo}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {patient.dataNascimento && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Data de Nascimento:</span>
                          <span>{patient.dataNascimento}</span>
                        </div>
                      )}
                      {patient.cpf && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">CPF:</span>
                          <span>{patient.cpf}</span>
                        </div>
                      )}
                      {patient.clienteContratos && patient.clienteContratos.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Contratos:</span>
                          <span>{patient.clienteContratos.length}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppointmentSchedule;
