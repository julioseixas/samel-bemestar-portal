import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppointmentBanner } from "@/components/AppointmentBanner";
import { DashboardCard } from "@/components/DashboardCard";
import { Calendar, FileText, Video, CalendarCheck, Pill, TestTube, Bed, RefreshCw, MessageCircle, ClipboardPlus, FolderOpen, FileSignature, CalendarX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const welcomeSectionRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    // Animações GSAP na montagem do componente
    const ctx = gsap.context(() => {
      // Animação da seção de boas-vindas
      gsap.from(welcomeSectionRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.8,
        ease: "power3.out"
      });

      // Animação do banner
      gsap.from(bannerRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.6,
        delay: 0.2,
        ease: "back.out(1.2)"
      });

      // Animação em cascata dos cards
      const cards = cardsRef.current?.querySelectorAll('[data-card]');
      if (cards) {
        gsap.from(cards, {
          opacity: 0,
          y: 50,
          scale: 0.9,
          duration: 0.5,
          stagger: 0.08,
          delay: 0.4,
          ease: "power2.out"
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const handleCardClick = (feature: string) => {
    toast({
      title: `${feature}`,
      description: "Esta funcionalidade está em desenvolvimento.",
    });
  };

  const handleAppointmentSchedule = () => {
    const listToSchedule = localStorage.getItem("listToSchedule");
    
    if (listToSchedule) {
      try {
        // listToSchedule JÁ É o array listAllPacient
        const listAllPacient = JSON.parse(listToSchedule);
        
        // Verifica se há dependentes através do array listAllPacient
        // Se listAllPacient.length === 1, só tem o titular
        // Se listAllPacient.length > 1, existem dependentes
        const hasDependents = listAllPacient.length > 1;
        
        if (hasDependents) {
          navigate("/appointment-schedule");
        } else {
          // Seleciona automaticamente o titular
          const titular = listAllPacient[0];
          if (titular) {
            // Validar se o titular possui código de carteirinha
            if (!titular.codigoCarteirinha || titular.codigoCarteirinha.trim() === '') {
              toast({
                variant: "destructive",
                title: "Plano não encontrado",
                description: "Seu cadastro não possui um plano de saúde ativo. Entre em contato com a Samel."
              });
              return;
            }
            
            localStorage.setItem("selectedPatient", JSON.stringify(titular));
            navigate("/appointment-details");
          } else {
            navigate("/appointment-schedule");
          }
        }
      } catch (error) {
        console.error("Erro ao processar dados:", error);
        navigate("/appointment-schedule");
      }
    } else {
      navigate("/appointment-schedule");
    }
  };

  const handleExamSchedule = () => {
    const listToSchedule = localStorage.getItem("listToSchedule");
    
    if (listToSchedule) {
      try {
        // listToSchedule JÁ É o array listAllPacient
        const listAllPacient = JSON.parse(listToSchedule);
        
        // Verifica se há dependentes através do array listAllPacient
        const hasDependents = listAllPacient.length > 1;
        
        if (hasDependents) {
          navigate("/exam-schedule");
        } else {
          // Seleciona automaticamente o titular
          const titular = listAllPacient[0];
          if (titular) {
            // Validar se o titular possui código de carteirinha
            if (!titular.codigoCarteirinha || titular.codigoCarteirinha.trim() === '') {
              toast({
                variant: "destructive",
                title: "Plano não encontrado",
                description: "Seu cadastro não possui um plano de saúde ativo. Entre em contato com a Samel."
              });
              return;
            }
            
            localStorage.setItem("selectedPatientExam", JSON.stringify(titular));
            navigate("/exam-details");
          } else {
            navigate("/exam-schedule");
          }
        }
      } catch (error) {
        console.error("Erro ao processar dados:", error);
        navigate("/exam-schedule");
      }
    } else {
      navigate("/exam-schedule");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:px-6 md:py-10">
          {/* Welcome Section */}
          <div ref={welcomeSectionRef} className="mb-6 sm:mb-8">
            <h2 className="mb-2 text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
              Bem-vindo(a) ao seu Portal! 👋
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground md:text-lg">
              Aqui você pode acessar todas as suas informações de saúde de forma simples e rápida.
            </p>
          </div>

          {/* Next Appointment Banner */}
          <div ref={bannerRef} className="mb-6 sm:mb-8 md:mb-12">
            <AppointmentBanner
              date="Quinta-feira, 15 de Janeiro"
              time="14:30"
              doctor="Dr. João Santos"
              specialty="Cardiologia"
              location="Hospital Samel - Unidade Chapada, Bloco B, 3º andar, Sala 305"
            />
          </div>

          {/* Dashboard Cards Grid */}
          <div className="mb-6 sm:mb-8">
            <h3 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-foreground md:text-2xl">
              O que você deseja fazer?
            </h3>
            
            <div ref={cardsRef} className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-stretch auto-rows-fr">
              {/* Linha 1 - Ações principais */}
              <div data-card>
                <DashboardCard
                  title="AGENDAR CONSULTA"
                description="Agende uma nova consulta com nossos especialistas"
                icon={Calendar}
                iconColor="text-primary"
                buttonText="Agendar Consulta"
                variant="default"
                useDashboardColor={true}
                onClick={handleAppointmentSchedule}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="AGENDAR EXAME"
                description="Solicite e agende seus exames laboratoriais"
                icon={ClipboardPlus}
                iconColor="text-primary"
                buttonText="Agendar Exame"
                variant="default"
                useDashboardColor={true}
                onClick={handleExamSchedule}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="CANCELAR AGENDAMENTO"
                description="Cancele suas consultas ou exames agendados"
                icon={CalendarX}
                iconColor="text-destructive"
                buttonText="Cancelar"
                variant="destructive"
                onClick={() => navigate("/scheduled-appointments-choice")}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="MEUS AGENDAMENTOS"
                description="Visualize todos os seus agendamentos"
                icon={CalendarCheck}
                iconColor="text-primary"
                buttonText="Ver Agendamentos"
                variant="default"
                useDashboardColor={true}
                onClick={() => navigate("/scheduled-appointments-choice")}
                />
              </div>
              
              {/* Linha 2 - Ações secundárias */}
              <div data-card>
                <DashboardCard
                title="ENTRAR NA CONSULTA ONLINE"
                description="Faça check-in para sua consulta online"
                icon={Video}
                iconColor="text-primary"
                buttonText="Fazer Check-in"
                variant="default"
                useDashboardColor={true}
                onClick={() => handleCardClick("Check-in Telemedicina")}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="PEDIDOS DE EXAME"
                description="Acesse seu histórico médico completo"
                icon={FolderOpen}
                iconColor="text-primary"
                buttonText="Ver Prontuário"
                variant="default"
                useDashboardColor={true}
                onClick={() => handleCardClick("Meu Prontuário")}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="MEUS RESULTADOS"
                description="Consulte os resultados dos seus exames"
                icon={TestTube}
                iconColor="text-primary"
                buttonText="Ver Resultados"
                variant="default"
                useDashboardColor={true}
                onClick={() => navigate("/exam-results")}
                />
              </div>
              
              {/* Linha 3 - Documentos e receitas */}
              <div data-card>
                <DashboardCard
                title="MINHAS RECEITAS E ATESTADOS"
                description="Acesse suas receitas médicas e atestados"
                icon={Pill}
                iconColor="text-primary"
                buttonText="Ver Receitas"
                variant="default"
                useDashboardColor={true}
                onClick={() => navigate("/prescriptions-and-certificates")}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="RENOVAR RECEITA"
                description="Solicite a renovação das suas receitas"
                icon={RefreshCw}
                iconColor="text-primary"
                buttonText="Renovar Receita"
                variant="default"
                useDashboardColor={true}
                onClick={() => handleCardClick("Renovação de Receita")}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="ACOMPANHAMENTO DA INTERNAÇÃO"
                description="Acompanhe informações sobre sua internação"
                icon={Bed}
                iconColor="text-warning"
                buttonText="Ver Internação"
                variant="warning"
                onClick={() => handleCardClick("Minha Internação")}
                />
              </div>
              
              {/* Linha 4 - Administrativo e suporte */}
              <div data-card>
                <DashboardCard
                title="ASSINAR DOCUMENTOS"
                description="Visualize e assine os termos pendentes"
                icon={FileSignature}
                iconColor="text-warning"
                buttonText="Ver Termos"
                variant="warning"
                onClick={() => navigate("/terms-to-sign")}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="FALAR COM ASSISTENTE"
                description="Converse com nosso assistente virtual"
                icon={MessageCircle}
                iconColor="text-primary"
                buttonText="Iniciar Chat"
                variant="default"
                useDashboardColor={true}
                onClick={() => handleCardClick("Chatbot Samel")}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
