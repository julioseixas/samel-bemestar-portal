import { useState, useEffect, useRef } from "react";
import { Copy, Check, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import gsap from "gsap";

interface Patient {
  id: string;
  nome: string;
  tipo: "Titular" | "Dependente";
  codigoCarteirinha?: string;
  sexo?: string;
}

export function UserInfoCard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedList = localStorage.getItem("listToSchedule");
    if (storedList) {
      try {
        const parsed = JSON.parse(storedList);
        setPatients(parsed);
      } catch (e) {
        console.error("Error parsing listToSchedule:", e);
      }
    }

    const photo = localStorage.getItem("profilePhoto");
    if (photo) {
      setProfilePhoto(photo);
    }
  }, []);

  // Animação GSAP ao montar o componente
  useEffect(() => {
    if (!cardRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 10,
        scale: 0.98,
        duration: 0.5,
        delay: 0.15,
        ease: "power2.out"
      });
    });

    return () => ctx.revert();
  }, [patients]);

  const titular = patients.find((p) => p.tipo === "Titular");
  const dependentes = patients.filter((p) => p.tipo === "Dependente");

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleCopyCarteirinha = async (carteirinha: string, id: string) => {
    try {
      await navigator.clipboard.writeText(carteirinha);
      setCopiedId(id);
      toast.success("Carteirinha copiada!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Erro ao copiar carteirinha");
    }
  };

  if (!titular) return null;

  return (
    <div ref={cardRef} className="w-full mb-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem
          value="user-info"
          className="border border-border/50 rounded-xl bg-card shadow-sm overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={profilePhoto || undefined} alt={titular.nome} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                  {getInitials(titular.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-medium text-sm text-foreground line-clamp-1">
                  {titular.nome}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  Titular
                </Badge>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-4 pb-4 pt-2">
            {/* Titular Card Info */}
            <div className="flex items-center justify-between py-2 px-3 bg-muted/40 rounded-lg mb-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Carteirinha:</span>
                <span className="font-mono font-medium text-foreground">
                  {titular.codigoCarteirinha || "—"}
                </span>
              </div>
              {titular.codigoCarteirinha && (
                <button
                  onClick={() => handleCopyCarteirinha(titular.codigoCarteirinha!, titular.id)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  aria-label="Copiar carteirinha"
                >
                  {copiedId === titular.id ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>

            {/* Dependentes Section */}
            {dependentes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide font-medium px-1">
                  <User className="h-3 w-3" />
                  <span>Dependentes ({dependentes.length})</span>
                </div>

                <div className="space-y-2">
                  {dependentes.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-lg border border-border/30"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-secondary/50 text-secondary-foreground text-xs">
                            {getInitials(dep.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-foreground truncate">
                            {dep.nome}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {dep.codigoCarteirinha || "—"}
                          </span>
                        </div>
                      </div>
                      {dep.codigoCarteirinha && (
                        <button
                          onClick={() => handleCopyCarteirinha(dep.codigoCarteirinha!, dep.id)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors flex-shrink-0"
                          aria-label="Copiar carteirinha"
                        >
                          {copiedId === dep.id ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
