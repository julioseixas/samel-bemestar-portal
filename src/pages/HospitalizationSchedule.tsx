import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserCircle, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  nome: string;
  dataNascimento: string;
  cpf: string;
  codigoCarteirinha: string;
  tipoBeneficiario: string;
  idEmpresa: number;
}

export default function HospitalizationSchedule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string>("");

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedListToSchedule = localStorage.getItem("listToSchedule");
    const storedPhoto = localStorage.getItem("profilePhoto");

    if (storedTitular) {
      try {
        const parsedTitular = storedTitular.startsWith('{') 
          ? JSON.parse(storedTitular) 
          : { nome: storedTitular };
        setPatientName(parsedTitular.titular?.nome || parsedTitular.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao processar titular:", error);
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
                dataNascimento: patient.dataNascimento2 || patient.dataNascimento,
                cpf: patient.cpf,
                codigoCarteirinha: patient.codigoCarteirinha,
                tipoBeneficiario: "Titular",
                idEmpresa: patient.idEmpresa
              });
            }
            
            // Adicionar dependente
            if (patient.tipoBeneficiario === "Dependente" || patient.tipo === "Dependente") {
              const depId = patient.id || patient.cdPessoaFisica;
              
              allPatients.push({
                id: depId,
                nome: patient.nome,
                dataNascimento: patient.dataNascimento2 || patient.dataNascimento,
                cpf: patient.cpf,
                codigoCarteirinha: patient.codigoCarteirinha,
                tipoBeneficiario: "Dependente",
                idEmpresa: patient.idEmpresa
              });
            }
          });
          
          setPatients(allPatients);
        }
      } catch (error) {
        console.error("Erro ao processar lista de pacientes:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os pacientes.",
        });
      }
    }

    if (storedPhoto) {
      setProfilePhoto(storedPhoto);
    }
  }, [toast]);

  const handlePatientSelect = (patient: Patient) => {
    // Valida se o paciente tem carteirinha ativa
    if (!patient.codigoCarteirinha || patient.codigoCarteirinha.trim() === "") {
      toast({
        variant: "destructive",
        title: "Plano Inativo",
        description: `${patient.nome} não possui plano ativo para acompanhamento de internação.`,
      });
      return;
    }

    // Salva o paciente selecionado no localStorage
    localStorage.setItem("selectedPatient", JSON.stringify(patient));

    // Redireciona para a próxima página (a ser criada)
    navigate("/hospitalization-list");
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto} />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
              Acompanhamento da Internação
            </h1>
            <p className="text-muted-foreground">
              Selecione o paciente para ver as internações
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
        </div>

        {patients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                Nenhum paciente disponível
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {patients.map((patient) => (
              <Card
                key={patient.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary"
                onClick={() => handlePatientSelect(patient)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarImage src="" alt={patient.nome} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <UserCircle className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{patient.nome}</CardTitle>
                      <Badge variant={patient.tipoBeneficiario === "Titular" ? "default" : "secondary"}>
                        {patient.tipoBeneficiario}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">CPF:</span>
                      <span>{patient.cpf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Data Nascimento:</span>
                      <span>{patient.dataNascimento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Carteirinha:</span>
                      <span className="font-mono text-sm">
                        {patient.codigoCarteirinha || "Sem plano ativo"}
                      </span>
                    </div>
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
