import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { AppointmentBanner } from "@/components/AppointmentBanner";
import { DashboardCard } from "@/components/DashboardCard";
import { Calendar, FileText, Video, CalendarCheck, Pill, TestTube, Bed, RefreshCw, MessageCircle, ClipboardPlus, ClipboardList, FolderOpen, FileSignature, CalendarX, Receipt, Star, History, Users, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { jwtDecode } from "jwt-decode";
import { getApiHeaders } from "@/lib/api-headers";
import { parse, isAfter, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
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
        // Error loading patient data
      }
    }
    
    if (photo) {
      setProfilePhoto(photo);
    }

    // Sempre busca consultas e exames agendados para garantir dados atualizados
    fetchAppointments();

    // Atualiza quando a página recebe foco novamente
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAppointments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const processAppointments = (consultasData: any, examesData: any) => {
    const allAppointments = [];

    // Processa consultas
    if (consultasData.sucesso && consultasData.dados) {
      const consultas = consultasData.dados.filter((ag: any) => {
        if (ag.cancelado) {
          return false;
        }
        if (ag.statusAgenda === "O" || ag.statusAgenda === "C") {
          return false;
        }
        try {
          const agendaDate = parse(ag.dataAgenda, 'yyyy/MM/dd HH:mm:ss', new Date());
          const isFuture = isAfter(agendaDate, new Date());
          return isFuture && ag.tipoAgendamento !== 1;
        } catch (error) {
          return false;
        }
      }).map((ag: any) => ({ ...ag, tipo: 'consulta' }));
      
      allAppointments.push(...consultas);
    }

    // Processa exames
    if (examesData.sucesso && examesData.dados) {
      const exames = examesData.dados.filter((ag: any) => {
        if (ag.cancelado) {
          return false;
        }
        if (ag.statusAgenda === "O" || ag.statusAgenda === "C") {
          return false;
        }
        try {
          const agendaDate = parse(ag.dataAgenda, 'yyyy/MM/dd HH:mm:ss', new Date());
          const isFuture = isAfter(agendaDate, new Date());
          return isFuture && ag.tipoAgendamento === 1;
        } catch (error) {
          return false;
        }
      }).map((ag: any) => ({ ...ag, tipo: 'exame' }));
      
      allAppointments.push(...exames);
    }

    // Ordena por data
    allAppointments.sort((a, b) => {
      const dateA = parse(a.dataAgenda, 'yyyy/MM/dd HH:mm:ss', new Date());
      const dateB = parse(b.dataAgenda, 'yyyy/MM/dd HH:mm:ss', new Date());
      return dateA.getTime() - dateB.getTime();
    });

    setAppointments(allAppointments);
  };

  const fetchAppointments = async () => {
    try {
      const userToken = localStorage.getItem("user");
      
      if (!userToken) {
        return;
      }

      const decoded: any = jwtDecode(userToken);
      const pacientesIds = [parseInt(decoded.id)];
      
      if (decoded.dependentes && Array.isArray(decoded.dependentes)) {
        decoded.dependentes.forEach((dep: any) => {
          if (dep.id) pacientesIds.push(parseInt(dep.id));
        });
      }

      // Busca consultas (tipo 0)
      const consultasResponse = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarAgendamentos2",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({ pacientes: pacientesIds, tipo: 0 }),
        }
      );

      // Busca exames (tipo 1)
      const examesResponse = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarAgendamentos2",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({ pacientes: pacientesIds, tipo: 1 }),
        }
      );

      const consultasData = await consultasResponse.json();
      const examesData = await examesResponse.json();

      processAppointments(consultasData, examesData);
    } catch (error) {
      // Error fetching appointments
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parse(dateString, 'yyyy/MM/dd HH:mm:ss', new Date());
      const formatted = format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parse(dateString, 'yyyy/MM/dd HH:mm:ss', new Date());
      return format(date, "HH:mm");
    } catch {
      return "";
    }
  };

  const formatAppointmentsForBanner = () => {
    return appointments.map(appointment => ({
      date: formatDate(appointment.dataAgenda),
      time: formatTime(appointment.dataAgenda),
      doctor: appointment.nomeProfissional,
      specialty: appointment.tipo === 'consulta' 
        ? appointment.descricaoEspecialidade || appointment.especialidade
        : appointment.procedimentos?.[0]?.descricao || 'Exame',
      location: appointment.nomeUnidade || 'Telemedicina',
      appointmentId: appointment.id,
      tipoAgendamento: appointment.tipoAgendamento,
    }));
  };

  useEffect(() => {
    // Animações GSAP na montagem do componente
    const ctx = gsap.context(() => {
      // Animação da seção de boas-vindas
      gsap.from(welcomeSectionRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.6,
        ease: "power2.out"
      });

      // Animação do banner (apenas se houver agendamentos)
      if (appointments.length > 0 && bannerRef.current) {
        gsap.from(bannerRef.current, {
          opacity: 0,
          scale: 0.99,
          duration: 0.7,
          delay: 0.2,
          ease: "power2.out"
        });
      }

      // Animação em cascata dos cards
      const cards = cardsRef.current?.querySelectorAll('[data-card]');
      if (cards) {
        gsap.from(cards, {
          opacity: 0,
          y: 15,
          scale: 0.98,
          duration: 0.6,
          stagger: 0.08,
          delay: 0.3,
          ease: "power2.out"
        });
      }
    });

    return () => ctx.revert();
  }, [appointments]);

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
        navigate("/exam-schedule");
      }
    } else {
      navigate("/exam-schedule");
    }
  };

  const handleRenewPrescription = () => {
    const listToSchedule = localStorage.getItem("listToSchedule");
    
    if (listToSchedule) {
      try {
        const listAllPacient = JSON.parse(listToSchedule);
        const hasDependents = listAllPacient.length > 1;
        
        if (hasDependents) {
          navigate("/prescription-renewal-schedule");
        } else {
          const titular = listAllPacient[0];
          if (titular) {
            if (!titular.codigoCarteirinha || titular.codigoCarteirinha.trim() === '') {
              toast({
                variant: "destructive",
                title: "Plano não encontrado",
                description: "Seu cadastro não possui um plano de saúde ativo. Entre em contato com a Samel."
              });
              return;
            }
            
            localStorage.setItem("selectedPatientRenewal", JSON.stringify(titular));
            navigate("/prescription-renewal-details");
          } else {
            navigate("/prescription-renewal-schedule");
          }
        }
      } catch (error) {
        navigate("/prescription-renewal-schedule");
      }
    } else {
      navigate("/prescription-renewal-schedule");
    }
  };

  const handleHospitalization = () => {
    navigate("/hospitalization-schedule");
  };

  const handleCoparticipation = () => {
    navigate("/coparticipation-choice");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-10">
          {/* Welcome Section */}
          <div ref={welcomeSectionRef} className="mb-5 sm:mb-8">
            <h2 className="mb-2 text-xl sm:text-2xl font-bold text-foreground leading-tight md:text-3xl">
              Bem-vindo(a) ao seu Portal! 👋
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed md:text-lg">
              Aqui você pode acessar todas as suas informações de saúde de forma simples e rápida.
            </p>
          </div>

          {/* Next Appointment Banner */}
          {appointments.length > 0 && (
            <div ref={bannerRef} className="mb-5 sm:mb-8 md:mb-10">
              <AppointmentBanner
                appointments={formatAppointmentsForBanner()}
                onCancel={fetchAppointments}
              />
            </div>
          )}

          {/* Dashboard Cards Grid */}
          <div className="mb-6 sm:mb-8">
            <h3 className="mb-4 sm:mb-6 text-lg sm:text-xl font-bold text-foreground md:text-2xl">
              O que você deseja fazer?
            </h3>
            
            <div ref={cardsRef} className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 items-stretch auto-rows-fr">
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
                title="HISTÓRICO DE ATENDIMENTOS"
                description="Consulte o histórico de todas as suas consultas e exames"
                icon={History}
                iconColor="text-primary"
                buttonText="Ver Histórico"
                variant="default"
                useDashboardColor={true}
                onClick={() => navigate("/appointment-history")}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="ENTRAR NA CONSULTA ONLINE"
                description="Faça check-in para sua consulta online"
                icon={Video}
                iconColor="text-primary"
                buttonText="Fazer Check-in"
                variant="default"
                useDashboardColor={true}
                onClick={() => navigate("/online-consultation-schedule")}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="FILA DE ATENDIMENTO"
                description="Acompanhe sua posição na fila de atendimento"
                icon={Users}
                iconColor="text-primary"
                buttonText="Ver Fila"
                variant="default"
                useDashboardColor={true}
                onClick={() => navigate("/queue-choice")}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="PEDIDOS DE EXAME"
                description="Visualize e gerencie seus pedidos de exame"
                icon={ClipboardList}
                iconColor="text-primary"
                buttonText="Ver Pedidos"
                variant="default"
                useDashboardColor={true}
                onClick={() => navigate("/exam-request-choice")}
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
                onClick={handleRenewPrescription}
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
                onClick={handleHospitalization}
                />
              </div>
              
              {/* Linha 4 - Administrativo e suporte */}
              {/* <div data-card>
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
                description="Converse com a SAMIA (Samel Inteligencia Artificial)"
                icon={MessageCircle}
                iconColor="text-primary"
                buttonText="Iniciar Chat"
                variant="default"
                useDashboardColor={true}
                onClick={() => handleCardClick("Chatbot Samel")}
                />
              </div> */}

              <div data-card>
                <DashboardCard
                title="COPARTICIPAÇÃO"
                description="Acompanhe seus valores de coparticipação"
                icon={Receipt}
                iconColor="text-success"
                buttonText="Ver Valores"
                variant="default"
                useDashboardColor={true}
                onClick={handleCoparticipation}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="SUA OPINIÃO IMPORTA!"
                description="Avalie seus atendimentos e nos ajude a melhorar"
                icon={Star}
                iconColor="text-warning"
                buttonText="Avaliar Agora"
                variant="warning"
                onClick={() => navigate("/rate-appointments")}
                />
              </div>
              
              <div data-card>
                <DashboardCard
                title="NOSSAS UNIDADES"
                description="Conheça todas as unidades da Samel"
                icon={MapPin}
                iconColor="text-primary"
                buttonText="Ver Unidades"
                variant="default"
                useDashboardColor={true}
                onClick={() => navigate("/units")}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
