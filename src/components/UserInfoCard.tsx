import { useState, useEffect, useRef } from "react";
import { Copy, Check, CreditCard, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
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
  copiedId: string | null;
  onCopy: (carteirinha: string, id: string) => void;
}

// Cores dos dependentes com bom contraste para texto branco
const DEPENDENTE_COLORS = [
  "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800",
  "bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800",
  "bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-800",
  "bg-gradient-to-br from-fuchsia-600 via-fuchsia-700 to-fuchsia-800",
  "bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800",
];

function WalletCard({ patient, profilePhoto, isMain = false, index = 0, copiedId, onCopy }: WalletCardProps) {
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const cardColors = isMain 
    ? "bg-gradient-to-br from-primary via-primary to-primary/80" 
    : DEPENDENTE_COLORS[index % DEPENDENTE_COLORS.length];

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl p-5 text-white shadow-xl transition-all duration-300",
        cardColors,
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-t before:from-black/10 before:to-transparent before:pointer-events-none"
      )}
      style={{
        aspectRatio: "1.7/1",
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
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/25 text-white">
          {patient.tipo}
        </span>
      </div>

      {/* Card Number / Carteirinha */}
      <div className="relative mt-auto">
        <p className="text-[10px] uppercase tracking-widest text-white/70 mb-1">
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
                <Copy className="h-3.5 w-3.5 text-white" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Holder Name & Avatar */}
      <div className="relative flex items-end justify-between mt-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-white/70 mb-0.5">
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
    </div>
  );
}

export function UserInfoCard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentDependenteIndex, setCurrentDependenteIndex] = useState(0);
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

  const handlePrevDependente = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDependenteIndex((prev) => 
      prev === 0 ? dependentes.length - 1 : prev - 1
    );
  };

  const handleNextDependente = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDependenteIndex((prev) => 
      prev === dependentes.length - 1 ? 0 : prev + 1
    );
  };

  if (!titular) return null;

  const hasDependentes = dependentes.length > 0;
  const hasMultipleDependentes = dependentes.length > 1;

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

      {/* Dependentes Cards - Expanded View with Carousel for multiple */}
      <div 
        className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          isExpanded ? "max-h-[500px] opacity-100 mt-6" : "max-h-0 opacity-0 mt-0"
        )}
      >
        {hasMultipleDependentes ? (
          // Carrossel para múltiplos dependentes
          <div className="relative">
            {/* Navigation buttons */}
            <button
              onClick={handlePrevDependente}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-9 h-9 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Dependente anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleNextDependente}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-9 h-9 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Próximo dependente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Card container */}
            <div className="px-4">
              <WalletCard
                patient={dependentes[currentDependenteIndex]}
                index={currentDependenteIndex}
                copiedId={copiedId}
                onCopy={handleCopyCarteirinha}
              />
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center gap-2 mt-4">
              {dependentes.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentDependenteIndex(index);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentDependenteIndex 
                      ? "bg-primary w-6" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Ver dependente ${index + 1}`}
                />
              ))}
            </div>

            {/* Counter */}
            <p className="text-center text-xs text-muted-foreground mt-2">
              {currentDependenteIndex + 1} de {dependentes.length} dependentes
            </p>
          </div>
        ) : hasDependentes ? (
          // Single dependente - show directly
          <WalletCard
            patient={dependentes[0]}
            index={0}
            copiedId={copiedId}
            onCopy={handleCopyCarteirinha}
          />
        ) : null}
      </div>
    </div>
  );
}
