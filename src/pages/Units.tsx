import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Phone, Building2 } from "lucide-react";
import { getApiHeaders } from "@/lib/api-headers";
import gsap from "gsap";

interface Unit {
  id: number;
  nome: string;
  cep: string | number;
  logradouro: string;
  numeroLogradouro: string | number;
  complementoLogradouro: string;
  bairro: string;
  municipio: string;
  uf: string;
  dddTelefone: string | number;
  numeroTelefone: string | number;
  idFilaNormal: string;
  idFilaPreferencial: string;
  foto: string;
}

const Units = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("Paciente");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const patientData = localStorage.getItem("patientData");
    const photo = localStorage.getItem("profilePhoto");
    
    if (patientData) {
      try {
        const data = JSON.parse(patientData);
        setPatientName(data.nome || "Paciente");
      } catch (error) {
        console.error("Erro ao carregar dados do paciente:", error);
      }
    }
    
    if (photo) {
      setProfilePhoto(photo);
    }

    fetchUnits();
  }, []);

  useEffect(() => {
    if (!loading && units.length > 0 && cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('[data-unit-card]');
      gsap.from(cards, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.05,
        ease: "power2.out"
      });
    }
  }, [loading, units]);

  const fetchUnits = async () => {
    try {
      const response = await fetch(
        "https://appv2-back.samel.com.br/api/Unidade/ListarUnidades",
        {
          method: "GET",
          headers: getApiHeaders(),
        }
      );

      const data = await response.json();
      
      if (data.sucesso && Array.isArray(data.dados)) {
        setUnits(data.dados);
      }
    } catch (error) {
      console.error("Erro ao buscar unidades:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (ddd: string | number, number: string | number) => {
    const dddStr = String(ddd);
    const numStr = String(number);
    
    if (numStr.length === 9) {
      return `(${dddStr}) ${numStr.slice(0, 5)}-${numStr.slice(5)}`;
    } else if (numStr.length === 8) {
      return `(${dddStr}) ${numStr.slice(0, 4)}-${numStr.slice(4)}`;
    }
    return `(${dddStr}) ${numStr}`;
  };

  const formatCep = (cep: string | number) => {
    const cepStr = String(cep).replace(/\D/g, '');
    if (cepStr.length === 8) {
      return `${cepStr.slice(0, 5)}-${cepStr.slice(5)}`;
    }
    return cepStr;
  };

  const formatAddress = (unit: Unit) => {
    const parts = [
      unit.logradouro,
      unit.numeroLogradouro ? `nº ${unit.numeroLogradouro}` : null,
      unit.complementoLogradouro,
      unit.bairro,
      `${unit.municipio}/${unit.uf}`,
      `CEP: ${formatCep(unit.cep)}`
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const openGoogleMaps = (unit: Unit) => {
    const cep = String(unit.cep).replace(/\D/g, '');
    const address = `${unit.logradouro}, ${unit.numeroLogradouro}, ${unit.bairro}, ${unit.municipio}, ${unit.uf}, ${cep}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const callPhone = (ddd: string | number, number: string | number) => {
    const phoneNumber = `${ddd}${number}`;
    window.open(`tel:+55${phoneNumber}`, '_self');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header patientName={patientName} profilePhoto={profilePhoto || undefined} />
      
      <div className="container mx-auto px-4 py-6 pb-10">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="h-10 w-10 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              Nossas Unidades
            </h1>
            <p className="text-sm text-muted-foreground">
              {units.length > 0 ? `${units.length} unidades encontradas` : 'Carregando...'}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <Skeleton className="aspect-video w-full rounded-lg mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Grid de unidades */}
        {!loading && units.length > 0 && (
          <div ref={cardsRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <div
                key={unit.id}
                data-unit-card
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Imagem */}
                <div className="aspect-video w-full bg-muted">
                  {unit.foto ? (
                    <img
                      src={`data:image/jpeg;base64,${unit.foto}`}
                      alt={unit.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-2 line-clamp-1">
                    {unit.nome}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {formatAddress(unit)}
                  </p>

                  {/* Botões */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => openGoogleMaps(unit)}
                    >
                      <MapPin className="h-4 w-4" />
                      Mapa
                    </Button>
                    
                    {unit.dddTelefone && unit.numeroTelefone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => callPhone(unit.dddTelefone, unit.numeroTelefone)}
                      >
                        <Phone className="h-4 w-4" />
                        Ligar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado vazio */}
        {!loading && units.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma unidade encontrada
            </h3>
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar as unidades no momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Units;
