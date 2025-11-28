import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Stethoscope } from "lucide-react";

interface Unidade {
  id: string;
  descricao: string;
  logradouro: string;
  numeroLogradouro: number;
  bairro: string;
}

interface Profissional {
  idAgenda: number;
  dataAgenda: string;
  dataAgenda2: string;
  id: string;
  nome: string;
  ieSexo: string;
  dsEspecialidade: string;
  unidade: Unidade;
  ie_sigla_conselho: string;
  nr_conselho: string;
  idsProcedimentos: number[];
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
        setProfissionaisGroups(parsedProfessionals);
      } catch (error) {
        console.error("Erro ao processar profissionais de exames:", error);
        navigate("/exam-details");
      }
    } else {
      navigate("/exam-schedule");
    }
  }, [navigate]);

  const getAvatarColor = (sexo: string) => {
    const sexoNormalizado = sexo?.trim().toUpperCase();
    return sexoNormalizado === 'F' 
      ? "bg-pink-100 dark:bg-pink-900/30" 
      : "bg-blue-100 dark:bg-blue-900/30";
  };

  const formatEndereco = (unidade: Unidade) => {
    const parts = [unidade.logradouro];
    if (unidade.numeroLogradouro) parts.push(`nº ${unidade.numeroLogradouro}`);
    if (unidade.bairro) parts.push(unidade.bairro);
    return parts.join(", ");
  };

  const handleSelectProfessional = (profissional: Profissional) => {
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
                   <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {group.dados.map((profissional) => (
                      <Card 
                        key={profissional.idAgenda}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleSelectProfessional(profissional)}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-4">
                            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${getAvatarColor(profissional.ieSexo || '')}`}>
                              <Stethoscope className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base sm:text-lg hidden sm:block">
                                {profissional.nome}
                              </CardTitle>
                              <Badge variant="outline" className="mt-1">
                                {profissional.ie_sigla_conselho} {profissional.nr_conselho}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {group.combinacao && (
                            <div>
                              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Exames que realiza:
                              </span>
                              <div className="mt-1 max-h-24 overflow-y-auto border rounded-md p-2 bg-muted/30">
                                <p className="text-xs sm:text-sm leading-relaxed">
                                  {group.combinacao}
                                </p>
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                              Especialidade:
                            </span>
                            <p className="text-sm sm:text-base font-semibold">
                              {profissional.dsEspecialidade}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                              Disponível a partir de:
                            </span>
                            <p className="text-sm sm:text-base font-semibold">
                              {profissional.dataAgenda}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                              Unidade:
                            </span>
                            <p className="text-sm sm:text-base font-semibold">
                              {profissional.unidade.descricao}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                              Endereço:
                            </span>
                            <p className="text-sm sm:text-base">
                              {formatEndereco(profissional.unidade)}
                            </p>
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
