import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getApiHeaders } from "@/lib/api-headers";
import { useToast } from "@/hooks/use-toast";

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

const PrescriptionRenewalSchedule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showNoHealthPlanDialog, setShowNoHealthPlanDialog] = useState(false);
  const [isCheckingShortcut, setIsCheckingShortcut] = useState(false);

  useEffect(() => {
    console.log("🔍 PrescriptionRenewalSchedule - Verificando localStorage");
    
    const storedTitular = localStorage.getItem("titular");
    const storedListToSchedule = localStorage.getItem("listToSchedule");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const userToken = localStorage.getItem("user");

    console.log("📦 Dados encontrados:", {
      titular: !!storedTitular,
      listToSchedule: !!storedListToSchedule,
      profilePhoto: !!storedProfilePhoto,
      userToken: !!userToken
    });

    // Se não houver dados, redirecionar para login
    if (!userToken) {
      console.log("⚠️ Sem token - redirecionando para login");
      navigate("/login");
      return;
    }

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
        console.log("📋 Lista parseada:", parsedList);
        
        const allPatients: Patient[] = [];
        
        const patientList = Array.isArray(parsedList) 
          ? parsedList 
          : parsedList.listAllPacient || [];
        
        console.log("👥 Pacientes encontrados:", patientList.length);
        
        if (patientList.length > 0) {
          patientList.forEach((patient: any) => {
            console.log("👤 Processando paciente:", patient.nome, patient.tipo || patient.tipoBeneficiario);
            
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
          
          console.log("✅ Total de pacientes processados:", allPatients.length);
          setPatients(allPatients);
        } else {
          console.log("⚠️ Nenhum paciente encontrado na lista");
        }
      } catch (error) {
        console.error("❌ Erro ao processar lista de pacientes:", error);
      }
    } else {
      console.log("⚠️ listToSchedule não encontrado no localStorage");
    }

    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }
  }, [navigate]);

  const handleSelectPatient = async (patient: Patient) => {
    if (!patient.codigoCarteirinha) {
      setShowNoHealthPlanDialog(true);
      return;
    }

    localStorage.setItem("selectedPatientRenewal", JSON.stringify(patient));
    setIsCheckingShortcut(true);

    try {
      const headers = getApiHeaders();
      
      // 1. Buscar convênios do paciente
      const conveniosResponse = await fetch(
        'https://api-portalpaciente-web.samel.com.br/api/Convenio/ListarConvenios',
        { method: "GET", headers }
      );
      const conveniosData = await conveniosResponse.json();
      
      // 2. Verificar se existe convênio Samel (id: 19)
      const hasSamelConvenio = conveniosData.sucesso && 
        conveniosData.dados?.some((conv: any) => conv.id === 19);
      
      if (!hasSamelConvenio) {
        navigate("/prescription-renewal-details");
        return;
      }

      // 3. Buscar especialidades disponíveis para o convênio Samel
      const params = new URLSearchParams({
        idConvenio: "19",
        idadeCliente: String(patient.idade || 0),
        cdPessoaFisica: String(patient.cdPessoaFisica),
        sexo: patient.sexo || "M",
        descricaoEspecialidade: "",
        cdDependente: String(patient.cdPessoaFisica),
        nrCarteirinha: patient.codigoCarteirinha || "",
      });

      const especialidadesResponse = await fetch(
        `https://appv2-back.samel.com.br/api/Agenda/Consulta/ListarEspecialidadesComAgendaDisponivel3?${params}`,
        { method: "GET", headers }
      );
      const especialidadesData = await especialidadesResponse.json();
      
      // 4. Verificar se existe "Renovação de Receita"
      const renovacaoEspecialidade = especialidadesData.sucesso && 
        especialidadesData.dados?.find((esp: any) => 
          esp.descricao === "Renovação de Receita"
        );
      
      if (!renovacaoEspecialidade) {
        navigate("/prescription-renewal-details");
        return;
      }

      // 5. SHORTCUT ATIVADO! Buscar profissionais diretamente
      const profParams = new URLSearchParams({
        idConvenio: "19",
        idadeCliente: String(patient.idade || 0),
        idEspecialidade: String(renovacaoEspecialidade.id),
        nomeProfissional: "",
        idCliente: String(patient.cdPessoaFisica),
        sexo: patient.sexo || "M",
      });

      const profissionaisResponse = await fetch(
        `https://appv2-back.samel.com.br/api/Agenda/Consulta/ListarProfissionaisComAgendaDisponivel3?${profParams}`,
        { method: "GET", headers }
      );
      const profissionaisData = await profissionaisResponse.json();

      if (!profissionaisData.sucesso) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: profissionaisData.mensagem,
        });
        navigate("/prescription-renewal-details");
        return;
      }

      // 6. Salvar dados no localStorage e ir direto para profissionais
      const formattedProfessionals = [{
        combinacao: "",
        dados: profissionaisData.dados
      }];

      localStorage.setItem("appointmentProfessionals", JSON.stringify(formattedProfessionals));
      localStorage.setItem("selectedAppointmentConvenio", "19");
      localStorage.setItem("selectedAppointmentEspecialidade", String(renovacaoEspecialidade.id));
      
      navigate("/appointment-professionals");

    } catch (error) {
      console.error("Erro ao verificar shortcut:", error);
      navigate("/prescription-renewal-details");
    } finally {
      setIsCheckingShortcut(false);
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      {isCheckingShortcut && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground">Verificando disponibilidade...</p>
          </div>
        </div>
      )}
      
      <main className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Renovação de Receita
            </h1>
            <p className="text-muted-foreground">
              Selecione o paciente para renovar a receita
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
            size="sm"
          >
            ← Voltar
          </Button>
        </div>

        {patients.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum paciente disponível para renovação
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => (
              <Card
                key={patient.id}
                className="cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => handleSelectPatient(patient)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{patient.nome}</CardTitle>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant={patient.tipo === "Titular" ? "default" : "secondary"}>
                      {patient.tipo}
                    </Badge>
                    {patient.sexo && (
                      <p className="text-sm text-muted-foreground">
                        {patient.sexo === "M" ? "Masculino" : "Feminino"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={showNoHealthPlanDialog} onOpenChange={setShowNoHealthPlanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sem Plano de Saúde</AlertDialogTitle>
            <AlertDialogDescription>
              Este paciente não possui um plano de saúde ativo para renovar receitas.
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
};

export default PrescriptionRenewalSchedule;
