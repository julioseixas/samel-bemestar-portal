import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Calendar, Heart, FileText, Edit, Save, X } from "lucide-react";
import { getApiHeaders } from "@/lib/api-headers";

interface PatientData {
  id?: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  estadoCivil: string;
  rg: string;
  usuario?: {
    email?: string;
    id?: number;
  };
  dddTelefone: string;
  numeroTelefone: string;
  cepResidencial: string;
  logradouroResidencial: string;
  numeroResidencial: string;
  complementoResidencial?: string;
  bairro: string;
  municipio: string;
  estado?: string;
  UF?: string; // API retorna o estado nesta chave
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
        // Mapear UF para estado se necessário
        if (data.UF && !data.estado) {
          data.estado = data.UF;
        }
        setPatientData(data);
        setEditedData(data);
        // Se não tiver nome no localStorage, usa o nome dos dados do paciente
        if (!storedName && data.nome) {
          setPatientName(data.nome);
        }
      }
      if (storedName) {
        // Garante que estamos usando apenas a string do nome, não um objeto JSON
        try {
          const parsedName = JSON.parse(storedName);
          setPatientName(parsedName.titular?.nome || parsedName.nome || storedName);
        } catch {
          // Se não for JSON, usa a string diretamente
          setPatientName(storedName);
        }
      }
      if (storedPhoto) {
        setProfilePhoto(storedPhoto);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, []);

  const handleEdit = () => {
    // Extrair apenas os últimos 9 dígitos do telefone
    const phoneDigitsOnly = (patientData?.numeroTelefone || "").replace(/\D/g, "");
    const last9Digits = phoneDigitsOnly.slice(-9);
    
    setEditedData({
      ...patientData!,
      numeroTelefone: last9Digits,
    });
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
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (digits.length > 5) {
      return digits.replace(/(\d{5})(\d)/, "$1-$2");
    }
    return digits;
  };

  const formatDddMask = (value: string) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 2);
  };

  const formatCpfMask = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);
  };

  const formatDateMask = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .slice(0, 10);
  };

  const handleSave = async () => {
    if (!editedData) return;

    // Validar Nome
    if (!editedData.nome || editedData.nome.trim().length < 3) {
      toast({
        title: "Erro",
        description: "Nome deve ter pelo menos 3 caracteres.",
        variant: "destructive",
      });
      return;
    }

    // Validar CPF (11 dígitos)
    if (!editedData.cpf || editedData.cpf.replace(/\D/g, "").length !== 11) {
      toast({
        title: "Erro",
        description: "CPF inválido.",
        variant: "destructive",
      });
      return;
    }

    // Validar Data de Nascimento
    if (!editedData.dataNascimento || editedData.dataNascimento.replace(/\D/g, "").length !== 8) {
      toast({
        title: "Erro",
        description: "Data de nascimento inválida.",
        variant: "destructive",
      });
      return;
    }

    // Validar Sexo
    if (!editedData.sexo) {
      toast({
        title: "Erro",
        description: "Selecione o sexo.",
        variant: "destructive",
      });
      return;
    }

    // Validar RG
    if (!editedData.rg || editedData.rg.trim().length < 5) {
      toast({
        title: "Erro",
        description: "RG inválido.",
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

    // Extrair apenas dígitos do telefone para validação
    const phoneDigits = editedData.numeroTelefone.replace(/\D/g, "");
    if (!phoneDigits || phoneDigits.length < 8) {
      toast({
        title: "Erro",
        description: "Por favor, insira um telefone válido.",
        variant: "destructive",
      });
      return;
    }

    if (!editedData.estadoCivil) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o estado civil.",
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

    if (!editedData.logradouroResidencial) {
      toast({
        title: "Erro",
        description: "Por favor, insira o logradouro.",
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

    if (!editedData.bairro) {
      toast({
        title: "Erro",
        description: "Por favor, insira o bairro.",
        variant: "destructive",
      });
      return;
    }

    if (!editedData.municipio) {
      toast({
        title: "Erro",
        description: "Por favor, insira o município.",
        variant: "destructive",
      });
      return;
    }

    // Estado é opcional - usa o valor original se não foi editado
    if (!editedData.estado && !patientData?.estado && !patientData?.UF) {
      toast({
        title: "Erro",
        description: "Por favor, insira o estado.",
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

      // Formatar data de nascimento para DD/MM/YYYY
      const formatDateToBR = (dateString: string) => {
        if (dateString.includes("/")) return dateString;
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Função para formatar CEP com máscara XXXXX-XXX
      const formatCepWithMask = (cep: string) => {
        const cleanCep = cep.replace(/\D/g, "");
        if (cleanCep.length === 8) {
          return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
        }
        return cep;
      };

      const payload = {
        nome: editedData.nome || patientData?.nome || "",
        dataNascimento: formatDateToBR(editedData.dataNascimento || patientData?.dataNascimento || ""),
        dddTelefone: editedData.dddTelefone || patientData?.dddTelefone || "",
        cpf: (editedData.cpf || patientData?.cpf || "").replace(/\D/g, ""), // Sem máscara
        estadoCivil: editedData.estadoCivil || patientData?.estadoCivil || "",
        rg: (editedData.rg || patientData?.rg || "").replace(/\D/g, ""), // Sem máscara
        sexo: editedData.sexo || patientData?.sexo || "",
        estado: editedData.estado || patientData?.estado || patientData?.UF || "",
        cidade: editedData.municipio || patientData?.municipio || "",
        bairro: editedData.bairro || patientData?.bairro || "",
        logradouroResidencial: editedData.logradouroResidencial || patientData?.logradouroResidencial || "",
        cepResidencial: formatCepWithMask(editedData.cepResidencial || patientData?.cepResidencial || ""), // Com máscara XXXXX-XXX
        id: editedData.id || patientData?.id || "",
        numeroResidencial: parseInt(editedData.numeroResidencial || patientData?.numeroResidencial || "0"),
        numeroTelefone: (editedData.numeroTelefone || patientData?.numeroTelefone || "").replace(/\D/g, ""), // Sem máscara, sem DDD
        complementoResidencial: editedData.complementoResidencial || patientData?.complementoResidencial || "",
      };

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Cliente/Atualizar",
        {
          method: "PUT",
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
          title: "Sucesso!",
          description: result.mensagem || "Suas informações foram atualizadas com sucesso.",
        });

        setIsEditing(false);
      } else {
        toast({
          title: "Erro",
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
    // Extrair apenas os últimos 9 dígitos
    const phoneDigitsOnly = phone.replace(/\D/g, "");
    const last9Digits = phoneDigitsOnly.slice(-9);
    
    if (last9Digits.length === 9) {
      return `(${ddd}) ${last9Digits.replace(/(\d{5})(\d{4})/, "$1-$2")}`;
    }
    return `(${ddd}) ${last9Digits}`;
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

  const getEstadoCivilLabel = (estadoCivil: string) => {
    const mapping: Record<string, string> = {
      "1": "Solteiro",
      "2": "Casado",
      "3": "Divorciado",
      "4": "Desquitado",
      "5": "Viúvo",
      "6": "Separado",
      "7": "Concubinato/União Estável"
    };
    return mapping[estadoCivil] || estadoCivil;
  };

  if (!patientData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header patientName={patientName} profilePhoto={profilePhoto} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Carregando dados...</p>
        </main>
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
                {!isEditing ? (
                  <>
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
                        <p className="text-base font-medium text-foreground">{getEstadoCivilLabel(patientData.estadoCivil)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          RG
                        </p>
                        <p className="text-base font-medium text-foreground">{patientData.rg}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome">Nome Completo *</Label>
                        <Input
                          id="nome"
                          value={editedData?.nome || ""}
                          onChange={(e) => setEditedData({ ...editedData!, nome: e.target.value })}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          value={formatCpfMask(editedData?.cpf || "")}
                          onChange={(e) => setEditedData({ ...editedData!, cpf: e.target.value.replace(/\D/g, "") })}
                          placeholder="000.000.000-00"
                          maxLength={14}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                        <Input
                          id="dataNascimento"
                          value={editedData?.dataNascimento || ""}
                          onChange={(e) => setEditedData({ ...editedData!, dataNascimento: formatDateMask(e.target.value) })}
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sexo">Sexo *</Label>
                        <Select
                          value={editedData?.sexo || ""}
                          onValueChange={(value) => setEditedData({ ...editedData!, sexo: value })}
                        >
                          <SelectTrigger id="sexo">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="estadoCivil">Estado Civil *</Label>
                        <Select
                          value={editedData?.estadoCivil || ""}
                          onValueChange={(value) =>
                            setEditedData({ ...editedData!, estadoCivil: value })
                          }
                        >
                          <SelectTrigger id="estadoCivil">
                            <SelectValue placeholder="Selecione o estado civil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Solteiro</SelectItem>
                            <SelectItem value="2">Casado</SelectItem>
                            <SelectItem value="3">Divorciado</SelectItem>
                            <SelectItem value="4">Desquitado</SelectItem>
                            <SelectItem value="5">Viúvo</SelectItem>
                            <SelectItem value="6">Separado</SelectItem>
                            <SelectItem value="7">Concubinato/União Estável</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="rg">RG *</Label>
                        <Input
                          id="rg"
                          value={editedData?.rg || ""}
                          onChange={(e) => setEditedData({ ...editedData!, rg: e.target.value })}
                          placeholder="Número do RG"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                    <p className="text-base font-medium text-foreground">
                      {patientData.usuario?.email || "Não informado"}
                    </p>
                  </div>
                  {!isEditing ? (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </p>
                      <p className="text-base font-medium text-foreground">
                        {formatPhone(patientData.dddTelefone, patientData.numeroTelefone)}
                      </p>
                    </div>
                  ) : (
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
                          value={formatPhoneMask(editedData?.numeroTelefone || "")}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData!,
                              numeroTelefone: e.target.value.replace(/\D/g, "").slice(0, 9),
                            })
                          }
                          placeholder="99999-9999"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  )}
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
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <p className="text-base font-medium text-foreground">{patientData.estado || "-"}</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">CEP</p>
                      <p className="text-base font-medium text-foreground">{patientData.cepResidencial}</p>
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
                    <div className="grid grid-cols-3 gap-2">
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
                      <div>
                        <Label htmlFor="estado">Estado *</Label>
                        <Input
                          id="estado"
                          value={editedData?.estado || ""}
                          onChange={(e) =>
                            setEditedData({ ...editedData!, estado: e.target.value })
                          }
                          placeholder="AM"
                          maxLength={2}
                          disabled
                          className="bg-muted cursor-not-allowed"
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
    </div>
  );
}
