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
    <div ref={cardRef} className="w-full mb-5">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem
          value="user-info"
          className="border-0 rounded-2xl bg-gradient-to-br from-card via-card to-muted/20 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.3)] overflow-hidden ring-1 ring-border/40"
        >
          <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-primary/5 transition-all duration-200 [&[data-state=open]>svg]:rotate-180 group">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-md">
                  <AvatarImage src={profilePhoto || undefined} alt={titular.nome} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-base">
                    {getInitials(titular.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-background" />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {titular.nome}
                </span>
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-2 py-0.5 h-auto bg-primary/10 text-primary border-0 font-medium"
                >
                  Titular
                </Badge>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-4 pb-5 pt-1">
            {/* Titular Card Info */}
            <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded-xl border border-border/30">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Carteirinha
                </span>
                <span className="font-mono font-semibold text-sm text-foreground tracking-wide">
                  {titular.codigoCarteirinha || "—"}
                </span>
              </div>
              {titular.codigoCarteirinha && (
                <button
                  onClick={() => handleCopyCarteirinha(titular.codigoCarteirinha!, titular.id)}
                  className="p-2.5 rounded-xl bg-background hover:bg-primary/10 hover:text-primary transition-all duration-200 shadow-sm border border-border/50"
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
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <User className="h-3.5 w-3.5" />
                    <span>Dependentes ({dependentes.length})</span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-l from-border/60 to-transparent" />
                </div>

                <div className="space-y-2.5">
                  {dependentes.map((dep, index) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between py-3 px-3.5 bg-background/80 rounded-xl border border-border/40 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-9 w-9 ring-1 ring-border/50 shadow-sm flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-secondary/60 to-secondary/30 text-secondary-foreground text-xs font-medium">
                            {getInitials(dep.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0 gap-0.5">
                          <span className="text-sm font-medium text-foreground truncate">
                            {dep.nome}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono tracking-wide">
                            {dep.codigoCarteirinha || "—"}
                          </span>
                        </div>
                      </div>
                      {dep.codigoCarteirinha && (
                        <button
                          onClick={() => handleCopyCarteirinha(dep.codigoCarteirinha!, dep.id)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                          aria-label="Copiar carteirinha"
                        >
                          {copiedId === dep.id ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
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
