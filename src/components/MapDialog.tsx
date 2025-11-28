import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Navigation } from "lucide-react";
import { toast } from "sonner";

interface MapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: string;
  unitName?: string;
}

export const MapDialog = ({ open, onOpenChange, location, unitName }: MapDialogProps) => {
  const [showRoute, setShowRoute] = useState(false);
  const [userLocation, setUserLocation] = useState<string>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Construir endereço mais preciso incluindo o nome da unidade e cidade
  const fullAddress = unitName 
    ? `${unitName}, ${location}, Manaus, Amazonas, Brasil`
    : `${location}, Manaus, Amazonas, Brasil`;
  
  const encodedLocation = encodeURIComponent(fullAddress);
  
  const embedUrl = showRoute && userLocation
    ? `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(userLocation)}&destination=${encodedLocation}&mode=driving`
    : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedLocation}`;
  
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;

  const handleShowRoute = () => {
    if (showRoute) {
      setShowRoute(false);
      return;
    }

    setIsLoadingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude},${position.coords.longitude}`;
          console.log("📍 Localização capturada:", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toLocaleString()
          });
          setUserLocation(coords);
          setShowRoute(true);
          setIsLoadingLocation(false);
          toast.success(`Rota calculada! Precisão: ${Math.round(position.coords.accuracy)}m`);
        },
        (error) => {
          setIsLoadingLocation(false);
          toast.error("Não foi possível obter sua localização. Verifique as permissões.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast.error("Seu navegador não suporta geolocalização.");
    }
  };

  useEffect(() => {
    if (!open) {
      setShowRoute(false);
      setUserLocation("");
    } else {
      setIsMapLoading(true);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] sm:max-w-[95vw] w-full h-[92vh] sm:h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-3 py-3 sm:px-6 sm:py-4 border-b bg-card shrink-0">
          <DialogTitle className="text-sm sm:text-base">
            Como chegar em: <span className="font-semibold">{unitName || location}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative">
          {apiKey ? (
            <>
              {isMapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Carregando mapa...</p>
                  </div>
                </div>
              )}
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setIsMapLoading(false)}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Configure a chave de API do Google Maps para visualizar o mapa
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 px-3 py-3 sm:px-6 sm:py-4 border-t bg-card">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleShowRoute}
                disabled={isLoadingLocation}
                className="w-full xs:w-auto text-xs sm:text-sm h-9 sm:h-10"
              >
                <Navigation className="h-3.5 w-3.5 xs:h-4 xs:w-4 xs:mr-2" />
                <span className="hidden xs:inline">
                  {isLoadingLocation ? "Obtendo..." : showRoute ? "Ver Local" : "Ver Rota"}
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(directionsUrl, "_blank")}
                className="w-full xs:w-auto text-xs sm:text-sm h-9 sm:h-10"
              >
                <ExternalLink className="h-3.5 w-3.5 xs:h-4 xs:w-4 xs:mr-2" />
                <span className="hidden xs:inline">Abrir no Google Maps</span>
                <span className="xs:hidden">Google Maps</span>
              </Button>
            </div>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
