import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Lock, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import samelLogo from "@/assets/samel-logo.png";

const ResetPassword = () => {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const [successModal, setSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (senha.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!hash) {
      toast({
        title: "Erro",
        description: "Link de redefinição inválido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://appv2-back.samel.com.br/api/Login/RedefinirSenha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "identificador-dispositivo": "request-android",
        },
        body: JSON.stringify({
          confirmaSenha: senha,
          hash: hash,
          senhaNova: confirmarSenha,
        }),
      });

      const data = await response.json();

      if (data.sucesso) {
        setSuccessMessage(data.mensagem);
        setSuccessModal(true);
      } else {
        setErrorMessage(data.mensagem);
        setErrorModal(true);
      }
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      setErrorMessage("Erro ao conectar com o servidor. Tente novamente.");
      setErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setSuccessModal(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={samelLogo} alt="Samel" className="h-16 object-contain" />
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Redefinir Senha</CardTitle>
            <CardDescription className="text-sm">
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="senha">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="senha"
                    type={showSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmarSenha"
                    type={showConfirmarSenha ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Nova Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Lembrou sua senha?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-primary hover:underline font-medium"
          >
            Voltar ao Login
          </button>
        </p>
      </div>

      {/* Success Modal */}
      <Dialog open={successModal} onOpenChange={setSuccessModal}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-success">Senha Redefinida</DialogTitle>
            <DialogDescription className="text-center pt-2">
              {successMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={handleGoToLogin} className="w-full sm:w-auto">
              Ir para Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={errorModal} onOpenChange={setErrorModal}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-destructive">Erro</DialogTitle>
            <DialogDescription className="text-center pt-2">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => setErrorModal(false)} className="w-full sm:w-auto">
              Tentar Novamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResetPassword;
