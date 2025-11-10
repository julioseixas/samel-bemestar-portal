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
import samelLogo from "@/assets/samel-logo.png";

const signupSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
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
  uf: z.string().length(2, "UF deve ter 2 caracteres").min(1, "UF é obrigatório"),
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
  const { clientData, cpf } = location.state || {};

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nome: clientData?.nome || "",
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
      uf: clientData?.uf || "",
      senha: "",
      confirmarSenha: "",
    },
  });

  if (!clientData) {
    navigate("/signup");
    return null;
  }

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input {...field} />
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
                  name="uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input maxLength={2} {...field} />
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

              <Button type="submit" className="w-full text-sm sm:text-base" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Finalizando..." : "Finalizar Cadastro"}
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
    </div>
  );
};

export default SignupDetails;
