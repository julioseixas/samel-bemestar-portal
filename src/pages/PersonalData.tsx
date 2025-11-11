import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Calendar, Heart, FileText, Edit, Save, X } from "lucide-react";
import { getApiHeaders } from "@/lib/api-headers";

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
  const { toast } = useToast();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [patientName, setPatientName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<PatientData | null>(null);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem("patientData");
      const storedName = localStorage.getItem("titular");
      const storedPhoto = localStorage.getItem("profilePhoto");

      if (storedData) {
        const data = JSON.parse(storedData);
        setPatientData(data);
        setEditedData(data);
      }
      if (storedName) {
        setPatientName(storedName);
      }
      if (storedPhoto) {
        setProfilePhoto(storedPhoto);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedData(patientData);
    setIsEditing(false);
  };

  const formatCepMask = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);
  };

  const formatPhoneMask = (value: string) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 9);
  };

  const formatDddMask = (value: string) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 2);
  };

  const handleSave = async () => {
    if (!editedData) return;

    // Validação básica
    if (!editedData.email || !editedData.email.includes("@")) {
      toast({
        title: "Erro",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    if (!editedData.dddTelefone || editedData.dddTelefone.length < 2) {
      toast({
        title: "Erro",
        description: "Por favor, insira um DDD válido.",
        variant: "destructive",
      });
      return;
    }

    if (!editedData.numeroTelefone || editedData.numeroTelefone.length < 8) {
      toast({
        title: "Erro",
        description: "Por favor, insira um telefone válido.",
        variant: "destructive",
      });
      return;
    }

    if (!editedData.cepResidencial || editedData.cepResidencial.replace(/\D/g, "").length !== 8) {
      toast({
        title: "Erro",
        description: "Por favor, insira um CEP válido.",
        variant: "destructive",
      });
      return;
    }

    if (!editedData.numeroResidencial) {
      toast({
        title: "Erro",
        description: "Por favor, insira o número da residência.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const userToken = localStorage.getItem("user");
      if (!userToken) {
        throw new Error("Token não encontrado");
      }

      const payload = {
        email: editedData.email,
        dddTelefone: editedData.dddTelefone,
        numeroTelefone: editedData.numeroTelefone,
        cepResidencial: editedData.cepResidencial,
        logradouroResidencial: editedData.logradouroResidencial,
        numeroResidencial: editedData.numeroResidencial,
        complementoResidencial: editedData.complementoResidencial || "",
        bairro: editedData.bairro,
        municipio: editedData.municipio,
      };

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Cliente/AtualizarDados",
        {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (result.sucesso) {
        // Atualiza o localStorage com os novos dados
        const updatedData = { ...patientData, ...editedData };
        setPatientData(updatedData);
        localStorage.setItem("patientData", JSON.stringify(updatedData));

        toast({
          title: "Dados atualizados!",
          description: "Suas informações foram atualizadas com sucesso.",
        });

        setIsEditing(false);
      } else {
        toast({
          title: "Erro ao atualizar",
          description: result.mensagem || "Não foi possível atualizar seus dados.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleEdit}
                    className="w-fit"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/dashboard")}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-fit"
                  >
                    ← Voltar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-fit"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="w-fit"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>
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
                {!isEditing ? (
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
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedData?.email || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData!, email: e.target.value })
                        }
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="ddd">DDD *</Label>
                        <Input
                          id="ddd"
                          value={editedData?.dddTelefone || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData!,
                              dddTelefone: formatDddMask(e.target.value),
                            })
                          }
                          placeholder="92"
                          maxLength={2}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="telefone">Telefone *</Label>
                        <Input
                          id="telefone"
                          value={editedData?.numeroTelefone || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData!,
                              numeroTelefone: formatPhoneMask(e.target.value),
                            })
                          }
                          placeholder="999999999"
                          maxLength={9}
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                {!isEditing ? (
                  <>
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
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cep">CEP *</Label>
                      <Input
                        id="cep"
                        value={editedData?.cepResidencial || ""}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData!,
                            cepResidencial: formatCepMask(e.target.value),
                          })
                        }
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>
                    <div>
                      <Label htmlFor="logradouro">Logradouro *</Label>
                      <Input
                        id="logradouro"
                        value={editedData?.logradouroResidencial || ""}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData!,
                            logradouroResidencial: e.target.value,
                          })
                        }
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="numero">Número *</Label>
                        <Input
                          id="numero"
                          value={editedData?.numeroResidencial || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData!,
                              numeroResidencial: e.target.value,
                            })
                          }
                          placeholder="123"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input
                          id="complemento"
                          value={editedData?.complementoResidencial || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData!,
                              complementoResidencial: e.target.value,
                            })
                          }
                          placeholder="Apto, Bloco..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="bairro">Bairro *</Label>
                        <Input
                          id="bairro"
                          value={editedData?.bairro || ""}
                          onChange={(e) =>
                            setEditedData({ ...editedData!, bairro: e.target.value })
                          }
                          placeholder="Bairro"
                        />
                      </div>
                      <div>
                        <Label htmlFor="municipio">Cidade *</Label>
                        <Input
                          id="municipio"
                          value={editedData?.municipio || ""}
                          onChange={(e) =>
                            setEditedData({ ...editedData!, municipio: e.target.value })
                          }
                          placeholder="Cidade"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
