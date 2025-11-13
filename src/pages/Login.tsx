import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { getApiHeaders } from "@/lib/api-headers";
import samelLogo from "@/assets/samel-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRecoverPasswordModal, setShowRecoverPasswordModal] = useState(false);
  const [recoverCpf, setRecoverCpf] = useState("");
  const [showRecoveryMethodModal, setShowRecoveryMethodModal] = useState(false);
  const [maskEmail, setMaskEmail] = useState("");
  const [maskTel, setMaskTel] = useState("");
  const [showRecoveryResultModal, setShowRecoveryResultModal] = useState(false);
  const [recoveryResultMessage, setRecoveryResultMessage] = useState("");
  const [isLoadingRecovery, setIsLoadingRecovery] = useState(false);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const chaveNotificacaoDispositivo = 
        sessionStorage.getItem("tokenFirebase") || "postman-device";

      const response = await fetch(
        "https://api-portalpaciente-web.samel.com.br/api/Login/ValidarCredenciais3",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "identificador-dispositivo": "request-android",
          },
          body: JSON.stringify({
            email: email,
            senha: password,
            chaveNotificacaoDispositivo: chaveNotificacaoDispositivo,
          }),
        }
      );

      const data = await response.json();

      if (data.sucesso) {
        // Decodifica o JWT retornado em dados2
        if (data.dados2) {
          try {
            const decoded = jwtDecode(data.dados2) as any;

            // Pega os dados completos do titular de clienteContratos[0]
            const titularCompleto = decoded.clienteContratos?.[0] || {};
            
            // Garante que o cdPessoaFisica seja extraído corretamente
            const cdPessoaFisica = decoded.cdPessoaFisica || 
                                   decoded.cd_pessoa_fisica || 
                                   titularCompleto.cdPessoaFisica || 
                                   titularCompleto.cd_pessoa_fisica || 
                                   decoded.id;
            
            // Monta o objeto do titular com todos os dados necessários
            const titular = {
              ...titularCompleto,
              tipoBeneficiario: decoded.tipoBeneficiario || titularCompleto.tipoBeneficiario,
              nome: decoded.nome || titularCompleto.nome,
              id: decoded.id || titularCompleto.id,
              codigoCarteirinha: decoded.codigoCarteirinha || titularCompleto.codigoCarteirinha || null,
              idade: decoded.idade || titularCompleto.idade,
              sexo: decoded.sexo || titularCompleto.sexo,
              email: decoded.usuario?.email || decoded.email || titularCompleto.email,
              idUsuario: decoded.usuario?.id || titularCompleto.idUsuario,
              clienteContratos: decoded.clienteContratos,
              ieGravida: decoded.ieGravida || titularCompleto.ieGravida,
              rating: decoded.rating || titularCompleto.rating,
              tipo: "Titular",
              cdPessoaFisica: cdPessoaFisica
            };
            
            const listAllPacient: any[] = [titular];

            if (decoded.dependentes && decoded.dependentes.length > 0) {
              decoded.dependentes.forEach((dependente: any) => {
                listAllPacient.push({
                  ...dependente,
                  tipo: "Dependente"
                });
              });
            }
            
            localStorage.setItem('listToSchedule', JSON.stringify(listAllPacient));
            localStorage.setItem('titular', JSON.stringify(titular));
            localStorage.setItem('rating', titular.rating?.toString() || '0');
            
            localStorage.setItem('user', data.dados2);

            localStorage.setItem("patientData", JSON.stringify(decoded));

            if (decoded.cd_pessoa_fisica || decoded.id) {
              const idCliente = decoded.cd_pessoa_fisica || decoded.id;
              
              try {
                // Aguarda um momento para garantir que o token foi salvo
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const notificacoesResponse = await fetch(
                  "https://api-portalpaciente-web.samel.com.br/api/notificacao/ObterNotificacoesCliente",
                  {
                    method: "POST",
                    headers: getApiHeaders(),
                    body: JSON.stringify({
                      idCliente: idCliente,
                    }),
                  }
                );

                const notificacoesData = await notificacoesResponse.json();
                
                if (notificacoesData.sucesso) {
                  localStorage.setItem("notifications", JSON.stringify(notificacoesData.dados));
                }
              } catch (notifError) {
                console.error("Erro ao buscar notificações:", notifError);
              }

              // Busca a foto do perfil
              try {
                // Aguarda um momento para garantir que o token foi salvo
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const fotoResponse = await fetch(
                  "https://api-portalpaciente-web.samel.com.br/api/Cliente/ObterFoto",
                  {
                    method: "GET",
                    headers: getApiHeaders(),
                  }
                );

                const fotoData = await fotoResponse.json();
                
                if (fotoData.sucesso && fotoData.dados) {
                  localStorage.setItem("profilePhoto", fotoData.dados);
                }
              } catch (fotoError) {
                console.error("Erro ao buscar foto de perfil:", fotoError);
              }

              // Busca agendamentos (consultas e exames)
              try {
                const decoded: any = jwtDecode(data.dados2);
                const pacientesIds = [parseInt(decoded.id)];
                
                if (decoded.dependentes && Array.isArray(decoded.dependentes)) {
                  decoded.dependentes.forEach((dep: any) => {
                    if (dep.id) pacientesIds.push(parseInt(dep.id));
                  });
                }

                // Busca consultas e exames em paralelo
                const [consultasResponse, examesResponse] = await Promise.all([
                  fetch(
                    "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarAgendamentos2",
                    {
                      method: "POST",
                      headers: getApiHeaders(),
                      body: JSON.stringify({ pacientes: pacientesIds, tipo: 0 }),
                    }
                  ),
                  fetch(
                    "https://api-portalpaciente-web.samel.com.br/api/Agenda/ListarAgendamentos2",
                    {
                      method: "POST",
                      headers: getApiHeaders(),
                      body: JSON.stringify({ pacientes: pacientesIds, tipo: 1 }),
                    }
                  )
                ]);

                const consultasData = await consultasResponse.json();
                const examesData = await examesResponse.json();

                // Salva os dados brutos para o dashboard processar
                localStorage.setItem("appointmentsData", JSON.stringify({
                  consultas: consultasData,
                  exames: examesData
                }));
              } catch (appointmentsError) {
                console.error("Erro ao buscar agendamentos:", appointmentsError);
              }
            }
          } catch (jwtError) {
            console.error("Erro ao processar JWT:", jwtError);
          }
        }

        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao Portal do Paciente",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Erro ao fazer login",
          description: data.mensagem || "Credenciais inválidas",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
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
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img src={samelLogo} alt="Hospital Samel" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Portal do Paciente</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Acesse sua conta para gerenciar suas consultas e exames
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="rounded border-input" />
                <span className="text-muted-foreground">Lembrar-me</span>
              </label>
              <a 
                href="#" 
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  setShowRecoverPasswordModal(true);
                }}
              >
                Esqueceu a senha?
              </a>
            </div>

            <Button type="submit" className="w-full text-sm sm:text-base" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="text-primary hover:underline font-medium"
              >
                Cadastre-se
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
              Cuidando da sua saúde com tecnologia
            </h2>
            <p className="text-muted-foreground">
              Acesse seus exames, agende consultas e gerencie seu histórico médico de forma simples e segura.
            </p>
          </div>
        </div>
      </div>

      {/* Modal para informar CPF para recuperação */}
      <AlertDialog open={showRecoverPasswordModal} onOpenChange={setShowRecoverPasswordModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recuperar Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Informe seu CPF para recuperar sua senha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recoverCpf">CPF</Label>
              <Input
                id="recoverCpf"
                type="text"
                placeholder="000.000.000-00"
                value={recoverCpf}
                onChange={(e) => setRecoverCpf(formatCPF(e.target.value))}
                maxLength={14}
              />
            </div>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowRecoverPasswordModal(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={async () => {
              const cleanCPF = recoverCpf.replace(/\D/g, "");
              
              if (cleanCPF.length !== 11) {
                toast({
                  title: "CPF inválido",
                  description: "Por favor, digite um CPF válido com 11 dígitos",
                  variant: "destructive",
                });
                return;
              }

              try {
                const response = await fetch(
                  "https://api-portalpaciente-web.samel.com.br/api/recuperarSenhav2/RecuperarSenha",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      nr_cpf: cleanCPF
                    }),
                  }
                );

                const data = await response.json();

                if (data.sucesso) {
                  setMaskEmail(data.mask_email || "");
                  setMaskTel(data.mask_tel || "");
                  setShowRecoverPasswordModal(false);
                  setShowRecoveryMethodModal(true);
                } else {
                  toast({
                    title: "Erro ao recuperar senha",
                    description: data.mensagem || "Não foi possível recuperar a senha. Tente novamente.",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                toast({
                  title: "Erro ao recuperar senha",
                  description: "Não foi possível conectar ao servidor. Tente novamente.",
                  variant: "destructive",
                });
              }
            }} className="w-full sm:w-auto">
              Enviar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para escolher método de recuperação */}
      <AlertDialog open={showRecoveryMethodModal} onOpenChange={setShowRecoveryMethodModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escolha o método de recuperação</AlertDialogTitle>
            <AlertDialogDescription>
              Para onde deseja receber o link de recuperação de senha?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto py-4"
              disabled={isLoadingRecovery}
              onClick={async () => {
                const cleanCPF = recoverCpf.replace(/\D/g, "");
                setIsLoadingRecovery(true);
                
                try {
                  const response = await fetch(
                    "https://api-portalpaciente-web.samel.com.br/api/Login/EnviarEmailRecuperarSenha2",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        cpf: cleanCPF,
                        tipo_envio: "EMAIL"
                      }),
                    }
                  );

                  const data = await response.json();
                  setRecoveryResultMessage(data.mensagem || "Link de recuperação enviado para seu e-mail.");
                  setShowRecoveryMethodModal(false);
                  setShowRecoveryResultModal(true);
                } catch (error) {
                  toast({
                    title: "Erro ao enviar e-mail",
                    description: "Não foi possível conectar ao servidor. Tente novamente.",
                    variant: "destructive",
                  });
                } finally {
                  setIsLoadingRecovery(false);
                }
              }}
            >
              <div className="text-left flex-1">
                <div className="font-medium">E-mail</div>
                <div className="text-xs text-muted-foreground">{maskEmail}</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto py-4"
              disabled={isLoadingRecovery}
              onClick={async () => {
                const cleanCPF = recoverCpf.replace(/\D/g, "");
                setIsLoadingRecovery(true);
                
                try {
                  const response = await fetch(
                    "https://api-portalpaciente-web.samel.com.br/api/Login/EnviarEmailRecuperarSenha2",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        cpf: cleanCPF,
                        tipo_envio: "SMS"
                      }),
                    }
                  );

                  const data = await response.json();
                  setRecoveryResultMessage(data.mensagem || "Link de recuperação enviado para seu telefone.");
                  setShowRecoveryMethodModal(false);
                  setShowRecoveryResultModal(true);
                } catch (error) {
                  toast({
                    title: "Erro ao enviar SMS",
                    description: "Não foi possível conectar ao servidor. Tente novamente.",
                    variant: "destructive",
                  });
                } finally {
                  setIsLoadingRecovery(false);
                }
              }}
            >
              <div className="text-left flex-1">
                <div className="font-medium">SMS</div>
                <div className="text-xs text-muted-foreground">{maskTel}</div>
              </div>
            </Button>

            {isLoadingRecovery && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando...</span>
              </div>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de resultado da recuperação */}
      <AlertDialog open={showRecoveryResultModal} onOpenChange={setShowRecoveryResultModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recuperação de senha</AlertDialogTitle>
            <AlertDialogDescription>
              {recoveryResultMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => {
              setShowRecoveryResultModal(false);
            }} className="w-full sm:w-auto">
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Login;
