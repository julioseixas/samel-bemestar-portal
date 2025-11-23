import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { Header } from "@/components/Header";

interface Patient {
  id: string | number;
  nome: string;
  tipo: string;
  idade?: number;
  sexo?: string;
  codigoCarteirinha?: string;
  dataNascimento?: string;
  cdPessoaFisica?: string | number;
  idEmpresa?: string | number;
}

const OnlineConsultationSchedule = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedListToSchedule = localStorage.getItem("listToSchedule");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");

    if (storedTitular) {
      try {
        const parsedTitular = storedTitular.startsWith('{') 
          ? JSON.parse(storedTitular) 
          : { nome: storedTitular };
        setPatientName(parsedTitular.titular?.nome || parsedTitular.nome || "Paciente");
      } catch (error) {
        setPatientName(storedTitular);
      }
    }

    if (storedListToSchedule) {
      try {
        const parsedList = JSON.parse(storedListToSchedule);
        
        const allPatients: Patient[] = [];
        
        const patientList = Array.isArray(parsedList) 
          ? parsedList 
          : parsedList.listAllPacient || [];
        
        if (patientList.length > 0) {
          patientList.forEach((patient: any) => {
            // Adicionar titular
            if (patient.tipoBeneficiario === "Titular" || patient.tipo === "Titular") {
              const titularId = patient.id || patient.cdPessoaFisica;
              
              allPatients.push({
                id: titularId,
                nome: patient.nome,
                tipo: "Titular",
                idade: patient.idade,
                sexo: patient.sexo,
                codigoCarteirinha: patient.codigoCarteirinha,
                dataNascimento: patient.dataNascimento,
                cdPessoaFisica: patient.cdPessoaFisica || titularId,
                idEmpresa: patient.idEmpresa
              });
            }
            
            // Adicionar dependente
            if (patient.tipoBeneficiario === "Dependente" || patient.tipo === "Dependente") {
              const depId = patient.id || patient.cdPessoaFisica;
              
              allPatients.push({
                id: depId,
                nome: patient.nome,
                tipo: "Dependente",
                idade: patient.idade,
                sexo: patient.sexo,
                codigoCarteirinha: patient.codigoCarteirinha,
                dataNascimento: patient.dataNascimento,
                cdPessoaFisica: patient.cdPessoaFisica || depId,
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
      cdPessoaFisica: patient.cdPessoaFisica,
      idEmpresa: patient.idEmpresa
    };
    
    localStorage.setItem("selectedPatientOnlineConsultation", JSON.stringify(patientData));
    navigate("/online-consultation-details");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Consulta Online
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
              Selecione o paciente para iniciar a consulta online
            </p>
          </div>

        {patients.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Nenhum paciente disponível para consulta online.</p>
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
                    <Video className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
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

export default OnlineConsultationSchedule;
