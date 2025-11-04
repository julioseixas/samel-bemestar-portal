import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getApiHeaders } from "@/lib/api-headers";
import { User } from "lucide-react";

interface Unidade {
  id: number;
  descricao: string;
  bairro: string;
  logradouro: string;
  numeroLogradouro: number;
}

interface Profissional {
  id: number;
  idAgenda: number;
  dataAgenda: string;
  dataAgenda2: string;
  ieSexo: string;
  ieSiglaConselho: string;
  nome: string;
  nomeDeGuerra: string;
  nrConselho: string;
  qtVotos: string;
  rate: string;
  tipoAgenda: string;
  unidade: Unidade;
}

const AppointmentProfessionals = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);

  // Dados vindos da tela anterior
  const { selectedPatient, selectedConvenio, selectedEspecialidade } = location.state || {};

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedProfilePhoto = localStorage.getItem("profilePhoto");

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

    if (!selectedPatient || !selectedConvenio || !selectedEspecialidade) {
      navigate("/appointment-details");
    }
  }, [navigate, selectedPatient, selectedConvenio, selectedEspecialidade]);

  useEffect(() => {
    const fetchProfissionais = async () => {
      if (!selectedPatient || !selectedConvenio || !selectedEspecialidade) {
        return;
      }

      try {
        setLoading(true);
        
        const params = new URLSearchParams({
          idConvenio: selectedConvenio,
          idadeCliente: selectedPatient.idade?.toString() || "0",
          idEspecialidade: selectedEspecialidade,
          nomeProfissional: "",
          idCliente: selectedPatient.id?.toString() || "",
          sexo: selectedPatient.sexo || ""
        });

        const headers = getApiHeaders();

        const response = await fetch(
          `https://api-portalpaciente-web.samel.com.br/api/Agenda/Consulta/ListarProfissionaisComAgendaDisponivel3?${params}`,
          {
            method: "GET",
            headers
          }
        );
        const data = await response.json();
        
        if (data.sucesso && data.dados) {
          setProfissionais(data.dados);
        }
      } catch (error) {
        console.error("Erro ao buscar profissionais:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfissionais();
  }, [selectedPatient, selectedConvenio, selectedEspecialidade]);

  const getAvatarImage = (sexo: string) => {
    const sexoNormalizado = sexo?.trim().toUpperCase();
    return sexoNormalizado === 'F' 
      ? "https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia&gender=female"
      : "https://api.dicebear.com/7.x/avataaars/svg?seed=John&gender=male";
  };

  if (!selectedPatient) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <Button
              variant="outline"
              onClick={() => navigate("/appointment-details")}
              className="mb-3 sm:mb-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
              size="sm"
            >
              ← Voltar
            </Button>
            
            <h2 className="text-xl sm:text-2xl font-bold text-foreground md:text-3xl">
              Profissionais Disponíveis
            </h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
              Selecione um profissional para continuar o agendamento
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando profissionais...</p>
            </div>
          ) : profissionais.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Nenhum profissional disponível encontrado para esta especialidade.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profissionais.map((profissional) => (
                <Card key={profissional.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={getAvatarImage(profissional.ieSexo)} />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base sm:text-lg">
                          {profissional.nomeDeGuerra || profissional.nome}
                        </CardTitle>
                        <Badge variant="outline" className="mt-1">
                          CRM: {profissional.nrConselho}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Disponível a partir de:
                      </span>
                      <p className="text-sm sm:text-base font-semibold">
                        {profissional.dataAgenda2}
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
                        {profissional.unidade.logradouro}, {profissional.unidade.numeroLogradouro} - {profissional.unidade.bairro}
                      </p>
                    </div>
                    <Button 
                      className="w-full mt-4"
                      onClick={() => {
                        navigate("/appointment-times", {
                          state: {
                            selectedPatient,
                            selectedConvenio,
                            selectedEspecialidade,
                            selectedProfissional: profissional
                          }
                        });
                      }}
                    >
                      Selecionar Profissional
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppointmentProfessionals;
