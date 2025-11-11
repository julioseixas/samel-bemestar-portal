import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import samelLogo from "@/assets/samel-logo.png";

const signupSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  dddTelefone: z.string().length(2, "DDD deve ter 2 dígitos").min(1, "DDD é obrigatório"),
  telefone: z.string().length(9, "Telefone deve ter 9 dígitos").min(1, "Telefone é obrigatório"),
  rg: z.string().min(1, "RG é obrigatório"),
  sexo: z.string(),
  estadoCivil: z.string().min(1, "Estado civil é obrigatório"),
  cep: z.string().min(1, "CEP é obrigatório"),
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.union([z.string(), z.number()]).refine(val => val !== "" && val !== null && val !== undefined, {
    message: "Número é obrigatório",
  }),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  municipio: z.string().min(1, "Município é obrigatório"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmarSenha: z.string().min(1, "Confirme a senha"),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

const SignupDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { clientData, cpf, dataNascimento, usuarioId } = location.state || {};
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showEmailSentModal, setShowEmailSentModal] = useState(false);
  const [showSmsTokenModal, setShowSmsTokenModal] = useState(false);
  const [showSmsSuccessModal, setShowSmsSuccessModal] = useState(false);
  const [smsSuccessMessage, setSmsSuccessMessage] = useState("");
  const [cadastroResponse, setCadastroResponse] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smsToken, setSmsToken] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Formatar data de ISO para dd/mm/yyyy ANTES do useForm
  const formatarData = (isoString: string) => {
    if (!isoString) return "";
    const data = new Date(isoString);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  // Formatar a data ANTES de passar para defaultValues
  const dataFormatada = dataNascimento ? formatarData(dataNascimento) : "";
  console.log("Data de nascimento recebida:", dataNascimento, "-> formatada:", dataFormatada);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nome: clientData?.nome || "",
      dataNascimento: dataFormatada,
      email: clientData?.usuario?.email || "",
      dddTelefone: clientData?.dddTelefone || "",
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
      senha: "",
      confirmarSenha: "",
    },
  });

  // Contador para reenvio de SMS
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSmsTokenModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [showSmsTokenModal, countdown]);

  if (!clientData) {
    navigate("/signup");
    return null;
  }

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    console.log("onSubmit chamado");
    setShowConfirmModal(true);
  };

  const handleConfirmCadastro = async () => {
    console.log("handleConfirmCadastro INICIADO");
    
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      console.log("Iniciando chamada da API...");
      const formData = form.getValues();
      console.log("Form data:", formData);
      
      // Formatar dataNascimento para yyyy/mm/dd
      let formattedDate = formData.dataNascimento;
      if (formData.dataNascimento.includes('/')) {
        const parts = formData.dataNascimento.split('/');
        // Se está no formato dd/mm/yyyy
        if (parts[0].length <= 2) {
          formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      
      const payload = {
        dataNascimento: formattedDate,
        cpf: cpf.replace(/\D/g, ""),
        sexo: formData.sexo,
        id: clientData.id,
        estadoCivil: formData.estadoCivil,
        nome: formData.nome,
        numeroTelefone: `${formData.dddTelefone}${formData.telefone}`,
        dddTelefone: formData.dddTelefone,
        rg: formData.rg.replace(/\D/g, ""),
        usuario: {
          email: formData.email,
          senha: formData.senha
        },
        complementoResidencial: formData.complemento || "",
        cepResidencial: formData.cep,
        logradouroResidencial: formData.logradouro,
        numeroResidencial: Number(formData.numero),
        bairro: formData.bairro,
        municipio: formData.municipio
      };

      console.log("Payload enviado:", payload);

      const response = await fetch("https://api-portalpaciente-web.samel.com.br/api/Cliente/Cadastrar2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "identificador-dispositivo": "request-android"
        },
        body: JSON.stringify(payload)
      });

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Resposta da API:", result);

      if (result.sucesso) {
        setCadastroResponse(result);
        toast({
          title: "Sucesso!",
          description: result.mensagem,
        });
        setShowTokenModal(true);
      } else {
        toast({
          title: "Erro ao finalizar cadastro",
          description: result.mensagem || "Não foi possível finalizar o cadastro.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      toast({
        title: "Erro ao finalizar cadastro",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTokenChoice = async (method: "email" | "sms") => {
    const formData = form.getValues();
    
    const payload = {
      id: clientData.id,
      cpf: cpf.replace(/\D/g, ""),
      email: formData.email,
      telefone: `${formData.dddTelefone}${formData.telefone}`,
      nome: cadastroResponse?.dados?.nome || formData.nome,
      tipo_envio: method === "email" ? "EMAIL" : "SMS"
    };

    if (method === "email") {
      try {
        const response = await fetch("https://api-portalpaciente-web.samel.com.br/api/Login/ValidarEmail2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "identificador-dispositivo": "request-android"
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.sucesso) {
          setShowTokenModal(false);
          setShowEmailSentModal(true);
        } else {
          toast({
            title: "Erro ao enviar e-mail",
            description: result.mensagem || "Não foi possível enviar o e-mail de validação.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao enviar e-mail",
          description: "Não foi possível conectar ao servidor. Tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      // SMS
      try {
        const response = await fetch("https://api-portalpaciente-web.samel.com.br/api/Login/ValidarEmail2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "identificador-dispositivo": "request-android"
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        // Para SMS, a resposta tem estrutura diferente
        if (result.status === "sucess") {
          setShowTokenModal(false);
          setShowSmsTokenModal(true);
          setCountdown(60);
          setCanResend(false);
          setSmsToken("");
        } else {
          toast({
            title: "Erro ao enviar SMS",
            description: result.message || "Não foi possível enviar o SMS de validação.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao enviar SMS",
          description: "Não foi possível conectar ao servidor. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleResendSmsToken = async () => {
    const formData = form.getValues();
    
    const payload = {
      id: clientData.id,
      cpf: cpf.replace(/\D/g, ""),
      email: formData.email,
      telefone: `${formData.dddTelefone}${formData.telefone}`,
      nome: cadastroResponse?.dados?.nome || formData.nome,
      tipo_envio: "SMS"
    };

    try {
      const response = await fetch("https://api-portalpaciente-web.samel.com.br/api/Login/ValidarEmail2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "identificador-dispositivo": "request-android"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.sucesso) {
        toast({
          title: "SMS reenviado!",
          description: "Um novo código foi enviado para o seu telefone.",
        });
        setCountdown(60);
        setCanResend(false);
        setSmsToken("");
      } else {
        toast({
          title: "Erro ao reenviar SMS",
          description: result.mensagem || "Não foi possível reenviar o SMS.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao reenviar SMS",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmSmsToken = async () => {
    if (!smsToken || smsToken.length !== 4) {
      toast({
        title: "Token inválido",
        description: "Por favor, insira um token de 4 dígitos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        id: clientData.id,
        ds_token: smsToken
      };

      const response = await fetch("https://api-portalpaciente-web.samel.com.br/api/Login/ConfimarTokenSMS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "identificador-dispositivo": "request-android"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.sucesso) {
        setSmsSuccessMessage(result.mensagem);
        setShowSmsTokenModal(false);
        setShowSmsSuccessModal(true);
      } else {
        toast({
          title: "Erro ao validar token",
          description: result.mensagem || "Token inválido. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao validar token",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataNascimento"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, "");
                              if (value.length >= 2) {
                                value = value.slice(0, 2) + "/" + value.slice(2);
                              }
                              if (value.length >= 5) {
                                value = value.slice(0, 5) + "/" + value.slice(5, 9);
                              }
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <div className="grid grid-cols-[80px_100px_1fr] gap-2">
                      <div className="space-y-2">
                        <FormLabel className="text-xs">País</FormLabel>
                        <Input 
                          value="+55"
                          disabled
                          className="text-center"
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="dddTelefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DDD</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="92" 
                                maxLength={2}
                                {...field}
                                onChange={(e) => {
                                  const numbers = e.target.value.replace(/\D/g, "").slice(0, 2);
                                  field.onChange(numbers);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="912345678" 
                                maxLength={9}
                                {...field}
                                onChange={(e) => {
                                  const numbers = e.target.value.replace(/\D/g, "").slice(0, 9);
                                  field.onChange(numbers);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sexo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexo</FormLabel>
                        <FormControl>
                          <Input 
                            value={field.value === "F" ? "Feminino" : "Masculino"}
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estadoCivil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Civil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o estado civil" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Solteiro</SelectItem>
                            <SelectItem value="2">Casado</SelectItem>
                            <SelectItem value="3">Divorciado</SelectItem>
                            <SelectItem value="4">Desquitado</SelectItem>
                            <SelectItem value="5">Viúvo</SelectItem>
                            <SelectItem value="6">Separado</SelectItem>
                            <SelectItem value="7">Concubinato/União Estável</SelectItem>
                            <SelectItem value="9">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            maxLength={9}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, "");
                              if (value.length > 5) {
                                value = value.slice(0, 5) + "-" + value.slice(5, 8);
                              }
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logradouro"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Logradouro</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="municipio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Município</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmarSenha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>

              <Button type="submit" className="w-full text-sm sm:text-base" disabled={isSubmitting}>
                {isSubmitting ? "Finalizando..." : "Finalizar Cadastro"}
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
          </Form>
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

      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar dados de contato</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Por favor, confirme se os dados abaixo estão corretos:</p>
                <div className="mt-4 space-y-2 text-foreground">
                  <p><strong>E-mail:</strong> {form.getValues("email")}</p>
                  <p><strong>Telefone:</strong> +55 ({form.getValues("dddTelefone")}) {form.getValues("telefone")}</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-between gap-4">
            <AlertDialogCancel>Corrigir</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCadastro}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showTokenModal} onOpenChange={setShowTokenModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escolha como receber o código</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Para ativar sua conta, escolha onde deseja receber o código de ativação:</p>
              {cadastroResponse?.dados && (
                <div className="mt-4 space-y-2 text-foreground">
                  <p><strong>E-mail:</strong> {cadastroResponse.dados.Email}</p>
                  <p><strong>Telefone:</strong> ({cadastroResponse.dados.dddTele}) {cadastroResponse.dados.Telefone}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={() => handleTokenChoice("email")} className="w-full sm:w-auto">
              Enviar por E-mail
            </Button>
            <Button onClick={() => handleTokenChoice("sms")} className="w-full sm:w-auto">
              Enviar por SMS
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showEmailSentModal} onOpenChange={setShowEmailSentModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>E-mail enviado com sucesso!</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Verifique o e-mail na sua caixa de entrada para confirmarmos sua identidade. Caso não encontre verifique sua caixa de SPAM</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate("/")}>
              Voltar ao Menu Principal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSmsTokenModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Validação por SMS</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Insira o token enviado para o número{" "}
                <strong>
                  ({cadastroResponse?.dados?.dddTele || form.getValues("dddTelefone")}) {cadastroResponse?.dados?.Telefone || form.getValues("telefone")}
                </strong>{" "}
                para validarmos a sua conta, verifique na sua caixa de mensagens.
              </p>
              <div className="space-y-2">
                <Input
                  placeholder="Digite o token (4 dígitos)"
                  maxLength={4}
                  value={smsToken}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setSmsToken(value);
                  }}
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-xs text-muted-foreground text-center">
                  O token possui no máximo 4 dígitos
                </p>
              </div>
              {countdown > 0 && (
                <p className="text-sm text-center text-muted-foreground">
                  Você poderá solicitar um novo código em <strong>{countdown}s</strong>
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleResendSmsToken}
              disabled={!canResend}
              className="w-full sm:w-auto"
            >
              Enviar Token Novamente
            </Button>
            <Button
              onClick={handleConfirmSmsToken}
              className="w-full sm:w-auto"
            >
              Confirmar Token
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSmsSuccessModal} onOpenChange={setShowSmsSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>SMS Enviado!</AlertDialogTitle>
            <AlertDialogDescription>
              {smsSuccessMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate("/login")}>
              Voltar ao Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SignupDetails;
