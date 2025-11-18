import { Header } from "@/components/Header";
import { DashboardCard } from "@/components/DashboardCard";
import { ClipboardList, Scan } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ExamRequestChoice = () => {
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

  const handleLabExamRequests = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Pedidos de exames laboratoriais em breve",
    });
  };

  const handleImageExamRequests = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Pedidos de exames de imagem em breve",
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-2 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Pedido de Exames
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Voltar ao Dashboard
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground md:text-lg">
              Selecione o tipo de pedido que deseja visualizar
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2 max-w-4xl">
            <DashboardCard
              title="PEDIDO DE EXAMES LABORATORIAIS"
              description="Visualize seus pedidos de exames de laboratório"
              icon={ClipboardList}
              iconColor="text-success"
              buttonText="Ver Pedidos"
              variant="success"
              onClick={handleLabExamRequests}
              customButtonColor="#49AA81"
            />
            
            <DashboardCard
              title="PEDIDO DE EXAMES DE IMAGEM"
              description="Visualize seus pedidos de exames de imagem"
              icon={Scan}
              iconColor="text-primary"
              buttonText="Ver Pedidos"
              variant="default"
              onClick={handleImageExamRequests}
              customButtonColor="#49AA81"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamRequestChoice;
