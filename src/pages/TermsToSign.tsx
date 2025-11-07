import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, User, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { jwtDecode } from "jwt-decode";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Patient {
  id: number;
  nome: string;
  tipo: "titular" | "dependente";
  foto?: string;
}

const TermsToSign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

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

    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const userToken = localStorage.getItem("user");
      if (!userToken) {
        toast({
          description: "Token de autenticação não encontrado",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const decoded: any = jwtDecode(userToken);
      const patientsList: Patient[] = [];

      // Adiciona o titular
      patientsList.push({
        id: parseInt(decoded.id),
        nome: decoded.nome || "Titular",
        tipo: "titular",
        foto: decoded.foto
      });

      // Adiciona os dependentes se existirem
      if (decoded.dependentes && Array.isArray(decoded.dependentes)) {
        decoded.dependentes.forEach((dep: any) => {
          if (dep.id) {
            patientsList.push({
              id: parseInt(dep.id),
              nome: dep.nome || "Dependente",
              tipo: "dependente",
              foto: dep.foto
            });
          }
        });
      }

      setPatients(patientsList);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      toast({
        description: "Erro ao carregar lista de pacientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patientId: number) => {
    // Navegar para a página de termos do paciente selecionado
    navigate(`/terms-list/${patientId}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Termos para Assinar
          </h1>
          <p className="text-muted-foreground">
            Selecione o paciente para visualizar os termos pendentes
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : patients.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhum paciente encontrado</h3>
            <p className="text-muted-foreground">
              Não foi possível carregar a lista de pacientes
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {patients.map((patient) => (
              <Card 
                key={patient.id} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handlePatientSelect(patient.id)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    {patient.foto && <AvatarImage src={patient.foto} alt={patient.nome} />}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(patient.nome)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {patient.nome}
                      </h3>
                      {patient.tipo === "titular" && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Titular
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      ID: {patient.id}
                    </p>
                  </div>

                  <Button variant="outline" size="sm">
                    Ver Termos
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TermsToSign;
