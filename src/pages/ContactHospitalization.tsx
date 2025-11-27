import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Phone, MessageCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ContactHospitalization() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedTitular = localStorage.getItem("titular");
    const storedPhoto = localStorage.getItem("profilePhoto");

    if (storedTitular) {
      try {
        const parsedTitular = storedTitular.startsWith('{') 
          ? JSON.parse(storedTitular) 
          : { nome: storedTitular };
        setPatientName(parsedTitular.titular?.nome || parsedTitular.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao processar titular:", error);
        setPatientName(storedTitular);
      }
    }

    if (storedPhoto) {
      setProfilePhoto(storedPhoto);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Simular envio - aqui você pode integrar com uma API
    setTimeout(() => {
      toast({
        title: "Mensagem enviada!",
        description: "Em breve entraremos em contato com você.",
      });
      setSubject("");
      setMessage("");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:py-6 md:px-6 md:py-10">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground md:text-3xl">
                Fale Conosco
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate("/hospitalization-options")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Entre em contato sobre sua internação
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 lg:max-w-6xl lg:mx-auto">
            {/* Formulário de Contato */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Envie sua mensagem
                </CardTitle>
                <CardDescription>
                  Preencha o formulário abaixo e entraremos em contato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      placeholder="Digite o assunto da sua mensagem"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      placeholder="Descreva sua dúvida ou solicitação"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      disabled={loading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar Mensagem"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Informações de Contato */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Telefone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Central de Atendimento</p>
                  <p className="text-lg font-semibold">0800 123 4567</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Seg a Sex: 7h às 19h<br />
                    Sáb: 8h às 12h
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    E-mail
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Contato Geral</p>
                  <p className="text-sm font-semibold break-all">contato@samel.com.br</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Resposta em até 24h úteis
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    <strong>Emergências:</strong> Em caso de urgência ou emergência, dirija-se ao pronto-socorro mais próximo ou ligue 192 (SAMU).
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
