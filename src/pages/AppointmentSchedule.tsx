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
        
        console.log("=== OBJETO COMPLETO listToSchedule ===");
        console.log(parsedList);
        console.log("=====================================");
        
        if (parsedList.listAllPacient && parsedList.listAllPacient.length > 0) {
          const firstPatient = parsedList.listAllPacient[0];
          
          // Array para armazenar todos os pacientes
          const allPatients: Patient[] = [];
          
          // Adicionar o titular (do clienteContratos)
          if (firstPatient.clienteContratos && firstPatient.clienteContratos.length > 0) {
            const titularContrato = firstPatient.clienteContratos[0];
        allPatients.push({
          id: firstPatient.cdPessoaFisica || Date.now(),
          nome: firstPatient.nome,
          tipo: "Titular",
          idade: titularContrato.idade,
          sexo: titularContrato.sexo,
          codigoCarteirinha: titularContrato.codigoCarteirinha,
          dataNascimento: titularContrato.dataNascimento
        });
            
            // Adicionar os dependentes
            if (titularContrato.dependentes && titularContrato.dependentes.length > 0) {
              titularContrato.dependentes.forEach((dependente: any, index: number) => {
            allPatients.push({
              id: dependente.cdPessoaFisica || Date.now() + index + 1,
              nome: dependente.nome,
              tipo: "Dependente",
              idade: dependente.idade,
              sexo: dependente.sexo,
              codigoCarteirinha: dependente.codigoCarteirinha,
              dataNascimento: dependente.dataNascimento
            });
              });
            }
          }
          
          console.log("Todos os pacientes carregados:", allPatients);
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

  const handleSelectPatient = async (patient: Patient) => {
    const patientData = {
      id: patient.id,
      nome: patient.nome,
      tipo: patient.tipo,
      idade: patient.idade,
      sexo: patient.sexo,
      codigoCarteirinha: patient.codigoCarteirinha,
      dataNascimento: patient.dataNascimento
    };
    
    console.log("Dados do paciente selecionado:", patientData);
    localStorage.setItem("selectedPatient", JSON.stringify(patientData));
    
    // Buscar encaminhamentos do paciente
    try {
      const userToken = localStorage.getItem("user") || "";
      if (!userToken) {
        throw new Error("Token de autenticação não encontrado");
      }

      const headers = {
        "Content-Type": "application/json",
        "identificador-dispositivo": "request-android",
        "chave-autenticacao": userToken
      };

      const response = await fetch(
        `https://api-portalpaciente-web.samel.com.br/api/Agenda/Encaminhamento/buscarEncaminhamentosPaciente/${patient.id}`,
        {
          method: "GET",
          headers
        }
      );
      
      const data = await response.json();
      console.log("Encaminhamentos do paciente:", data);
      
      if (data.status && data.dados && data.dados.length > 0) {
        // Salvar encaminhamentos no localStorage
        localStorage.setItem("patientEncaminhamentos", JSON.stringify(data.dados));
      } else {
        // Limpar encaminhamentos anteriores
        localStorage.removeItem("patientEncaminhamentos");
      }
    } catch (error) {
      console.error("Erro ao buscar encaminhamentos:", error);
      // Limpar encaminhamentos em caso de erro
      localStorage.removeItem("patientEncaminhamentos");
    }
    
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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppointmentSchedule;
