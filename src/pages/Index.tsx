import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { FeatureCard } from "@/components/FeatureCard";
import { 
  Stethoscope, 
  FlaskConical, 
  FileText, 
  Video, 
  Calendar, 
  Receipt, 
  TestTube2, 
  Hospital, 
  Camera, 
  Baby, 
  MessageCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

  const handleFeatureClick = (feature: string) => {
    toast({
      title: feature,
      description: "Esta funcionalidade está em desenvolvimento.",
    });
  };

  const features = [
    { title: "Marcar Consulta", icon: Stethoscope, color: "text-primary" },
    { title: "Marcar Exame", icon: FlaskConical, color: "text-purple-500" },
    { title: "Meu Prontuário", icon: FileText, color: "text-primary" },
    { title: "Realizar check-in Telemedicina", icon: Video, color: "text-teal-500" },
    { title: "Consultas/Exames agendados(as)", icon: Calendar, color: "text-primary" },
    { title: "Receitas e Atestados", icon: Receipt, color: "text-primary" },
    { title: "Resultado de Exames", icon: TestTube2, color: "text-primary" },
    { title: "Minha Internação", icon: Hospital, color: "text-purple-500" },
    { title: "Renove sua receita", icon: Camera, color: "text-primary" },
    { title: "Marcação Parto Desejado", icon: Baby, color: "text-purple-500" },
    { title: "Chatbot Samel", icon: MessageCircle, color: "text-teal-600" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        <TopBar />
        
        <main className="flex-1">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground px-8 py-4 shadow-md">
            <h1 className="text-xl font-bold tracking-tight">Início</h1>
          </div>

          {/* Content area with better spacing */}
          <div className="container mx-auto px-8 py-10">
            {/* Welcome message */}
            <div className="mb-10 animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                O que você deseja fazer hoje?
              </h2>
              <p className="text-muted-foreground">
                Escolha uma das opções abaixo para começar
              </p>
            </div>

            {/* Feature cards grid with staggered animation */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-scale-in"
                >
                  <FeatureCard
                    title={feature.title}
                    icon={feature.icon}
                    iconColor={feature.color}
                    onClick={() => handleFeatureClick(feature.title)}
                  />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
