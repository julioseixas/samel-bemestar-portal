import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppointmentBanner } from "@/components/AppointmentBanner";
import { DashboardCard } from "@/components/DashboardCard";
import { Calendar, FileText, CreditCard, HeadphonesIcon, ClipboardList, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    // Carrega os dados do paciente do localStorage
    const patientData = localStorage.getItem("patientData");
    const photo = localStorage.getItem("profilePhoto");
    
    if (patientData) {
      try {
        const data = JSON.parse(patientData);
        setPatientName(data.nm_pessoa_fisica || "Paciente");
      } catch (error) {
        console.error("Erro ao carregar dados do paciente:", error);
      }
    }
    
    if (photo) {
      setProfilePhoto(photo);
    }
  }, []);

  const handleCardClick = (feature: string) => {
    toast({
      title: `${feature}`,
      description: "Esta funcionalidade está em desenvolvimento.",
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-10">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
              Bem-vinda ao seu Portal! 👋
            </h2>
            <p className="text-base text-muted-foreground md:text-lg">
              Aqui você pode acessar todas as suas informações de saúde de forma simples e rápida.
            </p>
          </div>

          {/* Next Appointment Banner */}
          <div className="mb-8 md:mb-12">
            <AppointmentBanner
              date="Quinta-feira, 15 de Janeiro"
              time="14:30"
              doctor="Dr. João Santos"
              specialty="Cardiologia"
              location="Hospital Samel - Unidade Chapada, Bloco B, 3º andar, Sala 305"
            />
          </div>

          {/* Dashboard Cards Grid */}
          <div className="mb-8">
            <h3 className="mb-6 text-xl font-semibold text-foreground md:text-2xl">
              O que você deseja fazer?
            </h3>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <DashboardCard
                title="Minhas Consultas"
                description="Veja suas consultas agendadas e o histórico completo"
                icon={Calendar}
                iconColor="text-primary"
                buttonText="Ver Consultas"
                variant="default"
                onClick={() => handleCardClick("Consultas")}
              />
              
              <DashboardCard
                title="Resultados de Exames"
                description="Acesse seus resultados de exames e laudos médicos"
                icon={FileText}
                iconColor="text-success"
                buttonText="Ver Resultados"
                variant="success"
                onClick={() => handleCardClick("Resultados de Exames")}
              />
              
              <DashboardCard
                title="Financeiro"
                description="Consulte e baixe seus boletos e comprovantes"
                icon={CreditCard}
                iconColor="text-warning"
                buttonText="Ver Boletos"
                variant="warning"
                onClick={() => handleCardClick("Financeiro")}
              />
              
              <DashboardCard
                title="Agendar Consulta"
                description="Marque uma nova consulta com seus médicos"
                icon={ClipboardList}
                iconColor="text-primary"
                buttonText="Agendar Agora"
                variant="default"
                onClick={() => handleCardClick("Agendar Consulta")}
              />
              
              <DashboardCard
                title="Meus Dados"
                description="Atualize suas informações pessoais e de contato"
                icon={User}
                iconColor="text-accent-foreground"
                buttonText="Editar Perfil"
                variant="secondary"
                onClick={() => handleCardClick("Meus Dados")}
              />
              
              <DashboardCard
                title="Precisa de Ajuda?"
                description="Fale conosco por telefone, e-mail ou WhatsApp"
                icon={HeadphonesIcon}
                iconColor="text-primary"
                buttonText="Entrar em Contato"
                variant="outline"
                onClick={() => handleCardClick("Suporte")}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
