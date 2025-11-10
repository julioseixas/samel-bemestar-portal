import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import samelLogo from "@/assets/samel-logo.png";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cpfValidated, setCpfValidated] = useState(false);
  const [validatingCpf, setValidatingCpf] = useState(false);
  const [showExistingAccountModal, setShowExistingAccountModal] = useState(false);
  const [existingAccountMessage, setExistingAccountMessage] = useState("");
  const lastValidatedCpf = useRef<string>("");

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return cpf;
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 8) {
      return numbers
        .replace(/(\d{2})(\d)/, "$1/$2")
        .replace(/(\d{2})(\d)/, "$1/$2");
    }
    return birthDate;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(e.target.value);
    setBirthDate(formatted);
  };

  const validateCPF = async (cleanCPF: string) => {
    if (lastValidatedCpf.current === cleanCPF) return;
    
    lastValidatedCpf.current = cleanCPF;
    setValidatingCpf(true);
    
    try {
      const response = await fetch(
        `https://api-portalpaciente-web.samel.com.br/api/Cliente/ValidarCPF2?cpf=${cleanCPF}`,
        { 
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        }
      );
      
      const data = await response.json();
      
      if (data.codigo === 1) {
        setExistingAccountMessage(data.mensagem);
        setShowExistingAccountModal(true);
        setCpfValidated(false);
      } else {
        setCpfValidated(true);
        toast({
          description: "CPF validado com sucesso",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao validar CPF",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setValidatingCpf(false);
    }
  };

  useEffect(() => {
    const cleanCPF = cpf.replace(/\D/g, "");
    
    if (cleanCPF.length === 11 && lastValidatedCpf.current !== cleanCPF) {
      validateCPF(cleanCPF);
    } else if (cleanCPF.length < 11) {
      setCpfValidated(false);
      lastValidatedCpf.current = "";
    }
  }, [cpf]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanCPF = cpf.replace(/\D/g, "");
    const cleanDate = birthDate.replace(/\D/g, "");

    if (cleanCPF.length !== 11) {
      toast({
        title: "CPF inválido",
        description: "Por favor, digite um CPF válido com 11 dígitos",
        variant: "destructive",
      });
      return;
    }

    if (cleanDate.length !== 8) {
      toast({
        title: "Data de nascimento inválida",
        description: "Por favor, digite uma data válida no formato DD/MM/AAAA",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implementar chamada à API de cadastro
      toast({
        title: "Cadastro realizado!",
        description: "Sua conta foi criada com sucesso",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Erro ao realizar cadastro",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/login")} 
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img src={samelLogo} alt="Hospital Samel" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Criar Conta</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Preencha seus dados para criar sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="text"
                placeholder="DD/MM/AAAA"
                value={birthDate}
                onChange={handleBirthDateChange}
                maxLength={10}
                required
                disabled={!cpfValidated || validatingCpf}
              />
              {validatingCpf && (
                <p className="text-xs text-muted-foreground">Validando CPF...</p>
              )}
            </div>

            <Button type="submit" className="w-full text-sm sm:text-base" disabled={isLoading}>
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>

            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary hover:underline font-medium"
              >
                Faça login
              </button>
            </div>
          </form>

          <div className="pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Ao continuar, você concorda com nossos{" "}
              <a href="#" className="text-primary hover:underline">
                Termos de Uso
              </a>{" "}
              e{" "}
              <a href="#" className="text-primary hover:underline">
                Política de Privacidade
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-12">
        <div className="max-w-lg space-y-6 text-center">
          <div className="w-full aspect-square rounded-2xl bg-primary/10 flex items-center justify-center p-12">
            <img src={samelLogo} alt="Hospital Samel" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Bem-vindo ao Portal do Paciente
            </h2>
            <p className="text-muted-foreground">
              Crie sua conta e tenha acesso a todos os serviços de saúde de forma rápida e prática.
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={showExistingAccountModal} onOpenChange={setShowExistingAccountModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conta já existe</AlertDialogTitle>
            <AlertDialogDescription>
              {existingAccountMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => navigate("/login")} className="w-full sm:w-auto">
              Voltar para Login
            </Button>
            <Button onClick={() => {
              // TODO: Implementar navegação para recuperação de senha
              toast({
                description: "Funcionalidade de recuperação de senha em desenvolvimento",
              });
            }} className="w-full sm:w-auto">
              Recuperar Senha
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Signup;
