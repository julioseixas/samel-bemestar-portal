import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video } from "lucide-react";
import { Header } from "@/components/Header";

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

const OnlineConsultationSchedule = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const titular = localStorage.getItem("titular");
    const listToSchedule = localStorage.getItem("listToSchedule");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");

    if (titular) {
      const titularData = JSON.parse(titular);
      setPatientName(titularData?.nome || "Paciente");
    }

    if (listToSchedule) {
      const listData = JSON.parse(listToSchedule);
      const patientsList: Patient[] = [];

      if (listData.clienteContratos && listData.clienteContratos.length > 0) {
        const firstContract = listData.clienteContratos[0];
        
        // Add titular
        patientsList.push({
          id: firstContract.id,
          nome: firstContract.nome,
          tipo: "Titular",
          idade: firstContract.idade,
          sexo: firstContract.sexo,
          codigoCarteirinha: firstContract.codigoCarteirinha,
          dataNascimento: firstContract.dataNascimento,
          idEmpresa: firstContract.idEmpresa
        });

        // Add dependents
        if (firstContract.dependentes && firstContract.dependentes.length > 0) {
          firstContract.dependentes.forEach((dep: any) => {
            patientsList.push({
              id: dep.id,
              nome: dep.nome,
              tipo: "Dependente",
              idade: dep.idade,
              sexo: dep.sexo,
              codigoCarteirinha: dep.codigoCarteirinha,
              dataNascimento: dep.dataNascimento,
              idEmpresa: firstContract.idEmpresa
            });
          });
        }
      }

      setPatients(patientsList);
    }

    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (sexo?: string) => {
    if (sexo === "M") return "bg-blue-500";
    if (sexo === "F") return "bg-pink-500";
    return "bg-gray-500";
  };

  const handleSelectPatient = (patient: Patient) => {
    localStorage.setItem("selectedPatientOnlineConsultation", JSON.stringify(patient));
    navigate("/online-consultation-details");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto} />
      
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">
            Consulta Online
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6">
          Selecione o paciente para iniciar a consulta online
        </p>

        {patients.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center">
            <p className="text-sm sm:text-base text-muted-foreground">
              Nenhum paciente disponível
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {patients.map((patient) => (
              <Card
                key={patient.id}
                className="p-4 sm:p-5 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary"
                onClick={() => handleSelectPatient(patient)}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className={`h-12 w-12 sm:h-14 sm:w-14 ${getAvatarColor(patient.sexo)}`}>
                    <AvatarFallback className="text-white font-semibold text-sm sm:text-base">
                      {getInitials(patient.nome)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                      {patient.nome}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                        {patient.tipo}
                      </span>
                      {patient.sexo && (
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {patient.sexo === "M" ? "Masculino" : "Feminino"}
                        </span>
                      )}
                    </div>
                  </div>

                  <Video className="h-6 w-6 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OnlineConsultationSchedule;
