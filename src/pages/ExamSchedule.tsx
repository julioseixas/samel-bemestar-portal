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
  idade?: number;
  sexo?: string;
  codigoCarteirinha?: string;
  dataNascimento?: string;
  idEmpresa?: number;
}

const ExamSchedule = () => {
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
        // Tentar fazer parse se for JSON, senão usar como string direta
        const parsedTitular = storedTitular.startsWith('{') 
          ? JSON.parse(storedTitular) 
          : { nome: storedTitular };
        setPatientName(parsedTitular.titular?.nome || parsedTitular.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao processar titular:", error);
        // Se der erro, usar como string
        setPatientName(storedTitular);
      }
    }

    if (storedListToSchedule) {
      try {
        const parsedList = JSON.parse(storedListToSchedule);
        
        // Array para armazenar todos os pacientes
        const allPatients: Patient[] = [];
        
        // Verificar se parsedList é array direto ou objeto com listAllPacient
        const patientList = Array.isArray(parsedList) 
          ? parsedList 
          : parsedList.listAllPacient || [];
        
        if (patientList.length > 0) {
          patientList.forEach((patient: any) => {
            // Adicionar titular
            if (patient.tipoBeneficiario === "Titular" || patient.tipo === "Titular") {
              const titularId = patient.id || patient.cdPessoaFisica || Date.now();
              
              console.log("Titular:", patient);
              console.log("idEmpresa do titular:", patient.idEmpresa);
              
              allPatients.push({
                id: titularId,
                nome: patient.nome,
                tipo: "Titular",
                idade: patient.idade,
                sexo: patient.sexo,
                codigoCarteirinha: patient.codigoCarteirinha,
                dataNascimento: patient.dataNascimento,
                idEmpresa: patient.idEmpresa
              });
            }
            
            // Adicionar dependente
            if (patient.tipoBeneficiario === "Dependente" || patient.tipo === "Dependente") {
              const depId = patient.id || patient.cdPessoaFisica || Date.now();
              
              console.log("Dependente:", patient);
              console.log("idEmpresa do dependente:", patient.idEmpresa);
              
              allPatients.push({
                id: depId,
                nome: patient.nome,
                tipo: "Dependente",
                idade: patient.idade,
                sexo: patient.sexo,
                codigoCarteirinha: patient.codigoCarteirinha,
                dataNascimento: patient.dataNascimento,
                idEmpresa: patient.idEmpresa
              });
            }
          });
          
          setPatients(allPatients);
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
    const patientData = {
      id: patient.id,
      nome: patient.nome,
      tipo: patient.tipo,
      idade: patient.idade,
      sexo: patient.sexo,
      codigoCarteirinha: patient.codigoCarteirinha,
      dataNascimento: patient.dataNascimento,
      idEmpresa: patient.idEmpresa
    };
    
    console.log("Paciente selecionado para exame:", patientData);
    console.log("idEmpresa do paciente:", patient.idEmpresa);
    localStorage.setItem("selectedPatientExam", JSON.stringify(patientData));
    navigate("/exam-details");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Marcação de Exame
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
              Selecione para quem você deseja marcar o exame
            </p>
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
          )}
        </div>
      </main>
    </div>
  );
};

export default ExamSchedule;
