import { Header } from "@/components/Header";
import { DashboardCard } from "@/components/DashboardCard";
import { FileText, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ExamResults = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    const patientData = localStorage.getItem("patientData");
    const photo = localStorage.getItem("profilePhoto");
    
    if (patientData) {
      try {
        const data = JSON.parse(patientData);
        setPatientName(data.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao carregar dados do paciente:", error);
      }
    }
    
    if (photo) {
      setProfilePhoto(photo);
    }
  }, []);

  const handleLabExams = () => {
    navigate("/lab-exams");
  };

  const handleCDIExams = () => {
    navigate("/cdi-exams");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="mb-4 sm:mb-6 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Voltar ao Dashboard
          </Button>

          <div className="mb-6 sm:mb-8">
            <h2 className="mb-2 text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
              Resultado de Exames
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground md:text-lg">
              Selecione o tipo de exame que deseja visualizar
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2 max-w-4xl">
            <DashboardCard
              title="LAUDO DE EXAMES LABORATORIAIS"
              description="Visualize os resultados dos seus exames de laboratório"
              icon={FileText}
              iconColor="text-success"
              buttonText="Ver Laudos"
              variant="success"
              onClick={handleLabExams}
              customButtonColor="#49AA81"
            />
            
            <DashboardCard
              title="LAUDOS DE EXAMES IMAGEM"
              description="Acesse os laudos de exames do Centro de Diagnóstico por Imagem"
              icon={Activity}
              iconColor="text-primary"
              buttonText="Ver Laudos"
              variant="default"
              onClick={handleCDIExams}
              customButtonColor="#49AA81"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamResults;
