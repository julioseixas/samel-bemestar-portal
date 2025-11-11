import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Calendar, Heart, FileText } from "lucide-react";

interface PatientData {
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  estadoCivil: string;
  rg: string;
  email: string;
  dddTelefone: string;
  numeroTelefone: string;
  cepResidencial: string;
  logradouroResidencial: string;
  numeroResidencial: string;
  complementoResidencial?: string;
  bairro: string;
  municipio: string;
}

export default function PersonalData() {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [patientName, setPatientName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  useEffect(() => {
    const storedData = localStorage.getItem("patientData");
    const storedName = localStorage.getItem("titular");
    const storedPhoto = localStorage.getItem("profilePhoto");

    if (storedData) {
      setPatientData(JSON.parse(storedData));
    }
    if (storedName) {
      setPatientName(storedName);
    }
    if (storedPhoto) {
      setProfilePhoto(storedPhoto);
    }
  }, []);

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (ddd: string, phone: string) => {
    return `(${ddd}) ${phone.replace(/(\d{5})(\d{4})/, "$1-$2")}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    if (dateString.includes("/")) return dateString;
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const getSexoLabel = (sexo: string) => {
    switch (sexo?.toUpperCase()) {
      case "M":
        return "Masculino";
      case "F":
        return "Feminino";
      default:
        return sexo;
    }
  };

  if (!patientData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header patientName={patientName} profilePhoto={profilePhoto} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Carregando dados...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto} />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dados Pessoais</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-fit"
            >
              ← Voltar
            </Button>
          </div>

          <div className="space-y-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome Completo</p>
                    <p className="text-base font-medium text-foreground">{patientData.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="text-base font-medium text-foreground">{formatCPF(patientData.cpf)}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data de Nascimento
                    </p>
                    <p className="text-base font-medium text-foreground">{formatDate(patientData.dataNascimento)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sexo</p>
                    <p className="text-base font-medium text-foreground">{getSexoLabel(patientData.sexo)}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Estado Civil
                    </p>
                    <p className="text-base font-medium text-foreground">{patientData.estadoCivil}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      RG
                    </p>
                    <p className="text-base font-medium text-foreground">{patientData.rg}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-mail
                    </p>
                    <p className="text-base font-medium text-foreground">{patientData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone
                    </p>
                    <p className="text-base font-medium text-foreground">
                      {formatPhone(patientData.dddTelefone, patientData.numeroTelefone)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Logradouro</p>
                  <p className="text-base font-medium text-foreground">{patientData.logradouroResidencial}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Número</p>
                    <p className="text-base font-medium text-foreground">{patientData.numeroResidencial}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Complemento</p>
                    <p className="text-base font-medium text-foreground">
                      {patientData.complementoResidencial || "-"}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Bairro</p>
                    <p className="text-base font-medium text-foreground">{patientData.bairro}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cidade</p>
                    <p className="text-base font-medium text-foreground">{patientData.municipio}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CEP</p>
                    <p className="text-base font-medium text-foreground">{patientData.cepResidencial}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
