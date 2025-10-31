import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppointmentBanner } from "@/components/AppointmentBanner";
import { DashboardCard } from "@/components/DashboardCard";
import { Calendar, FileText, Video, CalendarCheck, Pill, TestTube, Bed, RefreshCw, MessageCircle, ClipboardPlus, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    // Carrega os dados do paciente do localStorage
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
                title="MARCAR CONSULTA"
                description="Agende uma nova consulta com nossos especialistas"
                icon={Calendar}
                iconColor="text-primary"
                buttonText="Agendar Consulta"
                variant="default"
                onClick={() => handleCardClick("Marcar Consulta")}
              />
              
              <DashboardCard
                title="MARCAR EXAME"
                description="Solicite e agende seus exames laboratoriais"
                icon={ClipboardPlus}
                iconColor="text-primary"
                buttonText="Agendar Exame"
                variant="default"
                onClick={() => handleCardClick("Marcar Exame")}
              />
              
              <DashboardCard
                title="MEU PRONTUÁRIO"
                description="Acesse seu histórico médico completo"
                icon={FolderOpen}
                iconColor="text-primary"
                buttonText="Ver Prontuário"
                variant="default"
                onClick={() => handleCardClick("Meu Prontuário")}
              />
              
              <DashboardCard
                title="REALIZAR CHECK-IN NA TELEMEDICINA"
                description="Faça check-in para sua consulta online"
                icon={Video}
                iconColor="text-success"
                buttonText="Fazer Check-in"
                variant="success"
                onClick={() => handleCardClick("Check-in Telemedicina")}
              />
              
              <DashboardCard
                title="VER CONSULTAS / EXAMES AGENDADOS"
                description="Visualize todos os seus agendamentos"
                icon={CalendarCheck}
                iconColor="text-primary"
                buttonText="Ver Agendamentos"
                variant="default"
                onClick={() => handleCardClick("Consultas e Exames Agendados")}
              />
              
              <DashboardCard
                title="VER RECEITAS E ATESTADOS"
                description="Acesse suas receitas médicas e atestados"
                icon={Pill}
                iconColor="text-primary"
                buttonText="Ver Receitas"
                variant="default"
                onClick={() => handleCardClick("Receitas e Atestados")}
              />
              
              <DashboardCard
                title="VER RESULTADOS DE EXAMES"
                description="Consulte os resultados dos seus exames"
                icon={TestTube}
                iconColor="text-success"
                buttonText="Ver Resultados"
                variant="success"
                onClick={() => navigate("/exam-results")}
              />
              
              <DashboardCard
                title="MINHA INTERNAÇÃO"
                description="Acompanhe informações sobre sua internação"
                icon={Bed}
                iconColor="text-warning"
                buttonText="Ver Internação"
                variant="warning"
                onClick={() => handleCardClick("Minha Internação")}
              />
              
              <DashboardCard
                title="RENOVAÇÃO DE RECEITA"
                description="Solicite a renovação das suas receitas"
                icon={RefreshCw}
                iconColor="text-primary"
                buttonText="Renovar Receita"
                variant="default"
                onClick={() => handleCardClick("Renovação de Receita")}
              />
              
              <DashboardCard
                title="CHATBOT SAMEL"
                description="Converse com nosso assistente virtual"
                icon={MessageCircle}
                iconColor="text-primary"
                buttonText="Iniciar Chat"
                variant="outline"
                onClick={() => handleCardClick("Chatbot Samel")}
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
