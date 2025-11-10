import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import samelLogo from "@/assets/samel-logo.png";

const SignupDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { clientData, cpf } = location.state || {};

  const [formData, setFormData] = useState({
    nome: clientData?.nome || "",
    email: clientData?.usuario?.email || "",
    telefone: clientData?.numeroTelefone || "",
    rg: clientData?.rg || "",
    sexo: clientData?.sexo || "",
    estadoCivil: clientData?.estadoCivil || "",
    cep: clientData?.cepResidencial || "",
    logradouro: clientData?.logradouroResidencial || "",
    numero: clientData?.numeroResidencial || "",
    complemento: clientData?.complementoResidencial || "",
    bairro: clientData?.bairro || "",
    municipio: clientData?.municipio || "",
    uf: clientData?.uf || "",
  });

  const [isLoading, setIsLoading] = useState(false);

  if (!clientData) {
    navigate("/signup");
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implementar chamada à API para finalizar cadastro
      toast({
        title: "Cadastro finalizado!",
        description: "Sua conta foi criada com sucesso",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Erro ao finalizar cadastro",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img src={samelLogo} alt="Hospital Samel" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Finalizar Cadastro</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Confirme seus dados para concluir o cadastro
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  name="rg"
                  type="text"
                  value={formData.rg}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo</Label>
                <Input
                  id="sexo"
                  name="sexo"
                  type="text"
                  value={formData.sexo === "F" ? "Feminino" : "Masculino"}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estadoCivil">Estado Civil</Label>
                <Input
                  id="estadoCivil"
                  name="estadoCivil"
                  type="text"
                  value={formData.estadoCivil}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  type="text"
                  value={formData.cep}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  name="logradouro"
                  type="text"
                  value={formData.logradouro}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  name="numero"
                  type="text"
                  value={formData.numero}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  name="complemento"
                  type="text"
                  value={formData.complemento}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  name="bairro"
                  type="text"
                  value={formData.bairro}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipio">Município</Label>
                <Input
                  id="municipio"
                  name="municipio"
                  type="text"
                  value={formData.municipio}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  name="uf"
                  type="text"
                  value={formData.uf}
                  onChange={handleChange}
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full text-sm sm:text-base" disabled={isLoading}>
              {isLoading ? "Finalizando..." : "Finalizar Cadastro"}
            </Button>

            <Button 
              type="button"
              variant="outline" 
              onClick={() => navigate("/signup")} 
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-12">
        <div className="max-w-lg space-y-6 text-center">
          <div className="w-full aspect-square rounded-2xl bg-primary/10 flex items-center justify-center p-12">
            <img src={samelLogo} alt="Hospital Samel" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Quase lá!
            </h2>
            <p className="text-muted-foreground">
              Confirme seus dados para finalizar o cadastro e ter acesso completo ao portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupDetails;
