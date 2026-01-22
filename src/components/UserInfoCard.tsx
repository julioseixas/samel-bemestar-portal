import { useState, useEffect, useRef } from "react";
import { Copy, Check, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  nome: string;
  tipo: "Titular" | "Dependente";
  codigoCarteirinha?: string;
  sexo?: string;
}

interface WalletCardProps {
  patient: Patient;
  profilePhoto?: string | null;
  isMain?: boolean;
  index?: number;
  isExpanded?: boolean;
  copiedId: string | null;
  onCopy: (carteirinha: string, id: string) => void;
}

function WalletCard({ patient, profilePhoto, isMain = false, index = 0, isExpanded = true, copiedId, onCopy }: WalletCardProps) {
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const cardColors = isMain 
    ? "bg-gradient-to-br from-primary via-primary to-primary/80" 
    : [
        "bg-gradient-to-br from-[hsl(var(--chart-1))] via-[hsl(var(--chart-1))] to-[hsl(var(--chart-1)/0.8)]",
        "bg-gradient-to-br from-[hsl(var(--chart-2))] via-[hsl(var(--chart-2))] to-[hsl(var(--chart-2)/0.8)]",
        "bg-gradient-to-br from-[hsl(var(--chart-3))] via-[hsl(var(--chart-3))] to-[hsl(var(--chart-3)/0.8)]",
        "bg-gradient-to-br from-[hsl(var(--chart-4))] via-[hsl(var(--chart-4))] to-[hsl(var(--chart-4)/0.8)]",
        "bg-gradient-to-br from-[hsl(var(--chart-5))] via-[hsl(var(--chart-5))] to-[hsl(var(--chart-5)/0.8)]",
      ][index % 5];

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl p-5 text-white shadow-xl transition-all duration-500",
        cardColors,
        isExpanded ? "opacity-100" : "opacity-95",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-t before:from-black/10 before:to-transparent before:pointer-events-none"
      )}
      style={{
        aspectRatio: isMain ? "1.7/1" : "1.8/1",
        transform: !isExpanded && !isMain ? `translateY(-${(index + 1) * 75}%)` : "translateY(0)",
        zIndex: isMain ? 10 : 10 - index,
      }}
    >
      {/* Card shine effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/20 via-transparent to-transparent rotate-12" />
      </div>

      {/* Header */}
      <div className="relative flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
            Samel Saúde
          </span>
        </div>
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
          isMain ? "bg-white/25 text-white" : "bg-black/20 text-white/90"
        )}>
          {patient.tipo}
        </span>
      </div>

      {/* Card Number / Carteirinha */}
      <div className="relative mt-auto">
        <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">
          Nº Carteirinha
        </p>
        <div className="flex items-center gap-3">
          <p className="font-mono text-lg sm:text-xl font-bold tracking-[0.15em] text-white">
            {patient.codigoCarteirinha 
              ? patient.codigoCarteirinha.replace(/(\d{4})(?=\d)/g, '$1 ')
              : "— — — —"}
          </p>
          {patient.codigoCarteirinha && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(patient.codigoCarteirinha!, patient.id);
              }}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
              aria-label="Copiar carteirinha"
            >
              {copiedId === patient.id ? (
                <Check className="h-3.5 w-3.5 text-white" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-white/80" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Holder Name & Avatar */}
      <div className="relative flex items-end justify-between mt-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-white/60 mb-0.5">
            {isMain ? "Titular" : "Dependente"}
          </p>
          <p className="font-semibold text-sm sm:text-base text-white truncate pr-2">
            {patient.nome}
          </p>
        </div>
        
        {/* Avatar */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30 flex-shrink-0 overflow-hidden">
          {isMain && profilePhoto ? (
            <img 
              src={`data:image/jpeg;base64,${profilePhoto}`} 
              alt={patient.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-bold text-sm sm:text-base text-white">
              {getInitials(patient.nome)}
            </span>
          )}
        </div>
      </div>

      {/* Decorative chip */}
      <div className="absolute top-5 right-5 w-10 h-7 rounded bg-gradient-to-br from-accent via-accent/80 to-accent/60 shadow-inner opacity-80" />
    </div>
  );
}

export function UserInfoCard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
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
        y: 20,
        scale: 0.95,
        duration: 0.6,
        delay: 0.1,
        ease: "power3.out"
      });
    });

    return () => ctx.revert();
  }, [patients]);

  const titular = patients.find((p) => p.tipo === "Titular");
  const dependentes = patients.filter((p) => p.tipo === "Dependente");

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

  const hasDependentes = dependentes.length > 0;

  return (
    <div ref={cardRef} className="w-full mb-5">
      <div 
        className={cn(
          "relative",
          hasDependentes && "cursor-pointer"
        )}
        onClick={() => hasDependentes && setIsExpanded(!isExpanded)}
      >
        {/* Stacked cards effect when collapsed */}
        {hasDependentes && !isExpanded && (
          <>
            {dependentes.slice(0, 2).map((_, index) => (
              <div
                key={`stack-${index}`}
                className="absolute inset-x-0 top-0 rounded-2xl bg-muted/50"
                style={{
                  transform: `translateY(${(index + 1) * 8}px) scale(${1 - (index + 1) * 0.03})`,
                  zIndex: -index - 1,
                  height: "100%",
                  opacity: 0.6 - index * 0.2,
                }}
              />
            ))}
          </>
        )}

        {/* Main Titular Card */}
        <WalletCard
          patient={titular}
          profilePhoto={profilePhoto}
          isMain
          isExpanded={isExpanded}
          copiedId={copiedId}
          onCopy={handleCopyCarteirinha}
        />

        {/* Expand/Collapse Indicator */}
        {hasDependentes && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border shadow-lg text-xs font-medium text-muted-foreground">
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Recolher</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>{dependentes.length} dependente{dependentes.length > 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dependentes Cards - Expanded View */}
      <div 
        className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          isExpanded ? "max-h-[1000px] opacity-100 mt-6" : "max-h-0 opacity-0 mt-0"
        )}
      >
        <div className="space-y-4">
          {dependentes.map((dep, index) => (
            <div 
              key={dep.id}
              className="transform transition-all duration-300"
              style={{ 
                transitionDelay: `${index * 75}ms`,
                opacity: isExpanded ? 1 : 0,
                transform: isExpanded ? 'translateY(0)' : 'translateY(-20px)'
              }}
            >
              <WalletCard
                patient={dep}
                index={index}
                isExpanded={isExpanded}
                copiedId={copiedId}
                onCopy={handleCopyCarteirinha}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
