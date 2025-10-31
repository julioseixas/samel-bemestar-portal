import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Hospital, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2");
    }
    return cpf;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação de login - aqui você integrará com sua API
    setTimeout(() => {
      setLoading(false);
      navigate("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo e título */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
              <Hospital className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Bem-vindo de volta!
            </h1>
            <p className="text-muted-foreground text-lg">
              Acesse o Portal do Paciente Samel
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-base">
                CPF
              </Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                className="h-14 text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-base">
                  Senha
                </Label>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 text-lg pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg"
              disabled={loading}
            >
              {loading ? (
                "Entrando..."
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar no Portal
                </>
              )}
            </Button>
          </form>

          {/* Link para cadastro */}
          <div className="text-center pt-4 border-t">
            <p className="text-muted-foreground">
              Ainda não tem acesso?{" "}
              <button className="text-primary font-semibold hover:underline">
                Solicite seu cadastro
              </button>
            </p>
          </div>

          {/* Informações de suporte */}
          <div className="bg-accent/50 rounded-lg p-4 text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              Precisa de ajuda?
            </p>
            <p className="text-sm font-medium text-foreground">
              📞 (92) 2121-4000 | 💬 WhatsApp: (92) 99999-9999
            </p>
          </div>
        </div>
      </div>

      {/* Lado direito - Ilustração/Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary-hover to-primary/80 p-12 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-white space-y-6 max-w-lg">
          <div className="space-y-4">
            <div className="inline-block px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
              <span className="text-sm font-semibold">Portal do Paciente</span>
            </div>
            <h2 className="text-5xl font-bold leading-tight">
              Seu cuidado na palma da mão
            </h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Acesse seus exames, agende consultas e gerencie tudo relacionado à sua saúde de forma simples e rápida.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
              <div className="text-3xl">📅</div>
              <h3 className="font-semibold">Consultas Online</h3>
              <p className="text-sm text-white/80">Agende quando quiser</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
              <div className="text-3xl">🧾</div>
              <h3 className="font-semibold">Resultados Rápidos</h3>
              <p className="text-sm text-white/80">Exames disponíveis</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
              <div className="text-3xl">💳</div>
              <h3 className="font-semibold">Financeiro</h3>
              <p className="text-sm text-white/80">Boletos e pagamentos</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
              <div className="text-3xl">💬</div>
              <h3 className="font-semibold">Suporte 24/7</h3>
              <p className="text-sm text-white/80">Estamos aqui por você</p>
            </div>
          </div>
        </div>

        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default Login;
