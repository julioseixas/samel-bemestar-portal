import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin } from "lucide-react";

interface Unidade {
  id: number;
  endereco: string;
  complemento: string;
  bairro: string;
  numero: string;
}

interface Profissional {
  idAgenda: number;
  idProfissional: number;
  nmProfissional: string;
  nrConselho: string;
  dsEspecialidade: string;
  dsPrimeiraDataDisponivel: string;
  unidade: Unidade;
  sexo?: string;
}

interface ProfissionalGroup {
  combinacao: string;
  dados: Profissional[];
}

const ExamProfessionals = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profissionaisGroups, setProfissionaisGroups] = useState<ProfissionalGroup[]>([]);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");
    const storedExamProfessionals = localStorage.getItem("examProfessionals");

    if (storedTitular) {
      try {
        const parsedTitular = JSON.parse(storedTitular);
        setPatientName(parsedTitular.titular?.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao processar titular:", error);
      }
    }

    if (storedProfilePhoto) {
      setProfilePhoto(storedProfilePhoto);
    }

    if (storedExamProfessionals) {
      try {
        const parsedProfessionals = JSON.parse(storedExamProfessionals);
        console.log("Profissionais de exames carregados:", parsedProfessionals);
        setProfissionaisGroups(parsedProfessionals);
      } catch (error) {
        console.error("Erro ao processar profissionais de exames:", error);
        navigate("/exam-details");
      }
    } else {
      console.log("Nenhum profissional de exame encontrado");
      navigate("/exam-schedule");
    }
  }, [navigate]);

  const getAvatarColor = (sexo: string) => {
    if (sexo?.toUpperCase() === 'M') return 'bg-blue-500';
    if (sexo?.toUpperCase() === 'F') return 'bg-pink-500';
    return 'bg-gray-500';
  };

  const formatEndereco = (unidade: Unidade) => {
    const parts = [unidade.endereco];
    if (unidade.numero) parts.push(`nº ${unidade.numero}`);
    if (unidade.complemento) parts.push(unidade.complemento);
    if (unidade.bairro) parts.push(unidade.bairro);
    return parts.join(', ');
  };

  const handleSelectProfessional = (profissional: Profissional) => {
    console.log("Profissional selecionado:", profissional);
    
    const selectedConvenio = localStorage.getItem("selectedExamConvenio");
    
    localStorage.setItem("selectedExamProfessional", JSON.stringify(profissional));
    
    navigate("/exam-times", {
      state: {
        selectedProfessional: profissional,
        selectedConvenio: selectedConvenio
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
                Profissionais Disponíveis
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/exam-details")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                ← Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Selecione um profissional para continuar
            </p>
          </div>

          {profissionaisGroups.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Nenhum profissional disponível</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {profissionaisGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {group.combinacao && (
                    <h3 className="text-lg font-semibold mb-4 text-foreground">
                      {group.combinacao}
                    </h3>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.dados.map((profissional) => (
                      <Card 
                        key={profissional.idAgenda}
                        className="group cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary"
                        onClick={() => handleSelectProfessional(profissional)}
                      >
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <Avatar className={`h-12 w-12 ${getAvatarColor(profissional.sexo || '')}`}>
                              <AvatarFallback className="text-white font-semibold">
                                {profissional.nmProfissional.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <CardTitle className="text-base">
                                {profissional.nmProfissional}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                {profissional.nrConselho}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Especialidade</p>
                            <p className="text-sm">{profissional.dsEspecialidade}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Disponibilidade</p>
                            <p className="text-sm font-semibold text-primary">
                              {new Date(profissional.dsPrimeiraDataDisponivel).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Unidade</p>
                            <div className="flex items-start gap-2 text-xs">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <span>{formatEndereco(profissional.unidade)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExamProfessionals;
