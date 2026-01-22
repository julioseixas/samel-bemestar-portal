import { useState, useEffect, useRef } from "react";
import { Copy, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Heart, Shield } from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import samelLogo from "@/assets/samel-logo.png";

interface Patient {
  id: string;
  nome: string;
  tipo: "Titular" | "Dependente";
  codigoCarteirinha?: string;
  sexo?: string;
}

interface HealthCardProps {
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

function HealthCard({ patient, profilePhoto, isMain = false, index = 0, copiedId, onCopy }: HealthCardProps) {
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const cardColors = isMain 
    ? "bg-gradient-to-br from-primary via-primary to-primary/90" 
    : DEPENDENTE_COLORS[index % DEPENDENTE_COLORS.length];

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden shadow-xl transition-all duration-300",
        cardColors
      )}
    >
      {/* Background pattern - medical cross pattern */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="health-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M17 10h6v7h7v6h-7v7h-6v-7h-7v-6h7v-7z" fill="white"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#health-pattern)" />
        </svg>
      </div>

      {/* Top header band */}
      <div className="relative bg-white/10 backdrop-blur-sm px-5 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <img 
            src={samelLogo} 
            alt="Samel Saúde" 
            className="h-8 w-auto brightness-0 invert opacity-95"
          />
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-white/70" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80 bg-white/15 px-2 py-1 rounded">
            {patient.tipo}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative p-5">
        {/* Avatar and name row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30 flex-shrink-0 overflow-hidden">
            {isMain && profilePhoto ? (
              <img 
                src={`data:image/jpeg;base64,${profilePhoto}`} 
                alt={patient.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-lg sm:text-xl text-white">
                {getInitials(patient.nome)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-white/60 mb-0.5">
              Beneficiário
            </p>
            <p className="font-semibold text-base sm:text-lg text-white truncate">
              {patient.nome}
            </p>
          </div>
        </div>

        {/* Card number section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1.5 flex items-center gap-1.5">
                <Heart className="w-3 h-3" />
                Número da Carteirinha
              </p>
              <p className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-white">
                {patient.codigoCarteirinha 
                  ? patient.codigoCarteirinha
                  : "— — — —"}
              </p>
            </div>
            {patient.codigoCarteirinha && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(patient.codigoCarteirinha!, patient.id);
                }}
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/10"
                aria-label="Copiar carteirinha"
              >
                {copiedId === patient.id ? (
                  <Check className="h-5 w-5 text-white" />
                ) : (
                  <Copy className="h-5 w-5 text-white/80" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-between text-[10px] text-white/50 uppercase tracking-wider">
          <span>Plano de Saúde</span>
          <span>Cartão Digital</span>
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
        <HealthCard
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
          isExpanded ? "max-h-[600px] opacity-100 mt-6" : "max-h-0 opacity-0 mt-0"
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
              <HealthCard
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
          <HealthCard
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
