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
    <div className="flex min-h-screen">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        <TopBar />
        
        <main className="flex-1 bg-background">
          <div className="bg-primary text-primary-foreground px-6 py-3">
            <h1 className="text-lg font-medium">Início</h1>
          </div>

          <div className="container mx-auto px-6 py-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  title={feature.title}
                  icon={feature.icon}
                  iconColor={feature.color}
                  onClick={() => handleFeatureClick(feature.title)}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
