import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Patient {
  id: string;
  nome: string;
  dataNascimento: string;
  cpf: string;
  codigoCarteirinha: string;
  tipoBeneficiario: string;
  idEmpresa: number;
  sexo?: string;
  tipo?: string;
  cdPessoaFisica?: string | number;
}

export default function HospitalizationSchedule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [showNoHealthPlanDialog, setShowNoHealthPlanDialog] = useState(false);

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
                idEmpresa: patient.idEmpresa,
                sexo: patient.sexo,
                tipo: "Titular",
                cdPessoaFisica: patient.cdPessoaFisica || titularId
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
                idEmpresa: patient.idEmpresa,
                sexo: patient.sexo,
                tipo: "Dependente",
                cdPessoaFisica: patient.cdPessoaFisica || depId
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
    if (!patient.codigoCarteirinha || patient.codigoCarteirinha.trim() === "") {
      setShowNoHealthPlanDialog(true);
      return;
    }

    const patientData = {
      id: patient.id,
      nome: patient.nome,
      tipo: patient.tipo || patient.tipoBeneficiario,
      sexo: patient.sexo,
      codigoCarteirinha: patient.codigoCarteirinha,
      dataNascimento: patient.dataNascimento,
      cdPessoaFisica: patient.cdPessoaFisica,
      idEmpresa: patient.idEmpresa,
      cpf: patient.cpf
    };

    localStorage.setItem("selectedPatient", JSON.stringify(patientData));
    navigate("/hospitalization-list");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Acompanhamento da Internação
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
              Selecione o paciente para ver as internações
            </p>
          </div>

          {patients.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Nenhum paciente disponível.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className="group cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{patient.nome}</CardTitle>
                        <div className="mt-2 flex gap-2">
                          <Badge 
                            variant={patient.tipoBeneficiario === "Titular" ? "default" : "secondary"}
                          >
                            {patient.tipoBeneficiario}
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

      <Footer />

      {/* Alert Dialog para paciente sem plano */}
      <AlertDialog open={showNoHealthPlanDialog} onOpenChange={setShowNoHealthPlanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Paciente sem plano ativo</AlertDialogTitle>
            <AlertDialogDescription>
              O paciente selecionado não possui um plano de saúde ativo. Por favor, selecione outro beneficiário ou entre em contato com a Samel para mais informações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoHealthPlanDialog(false)}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
