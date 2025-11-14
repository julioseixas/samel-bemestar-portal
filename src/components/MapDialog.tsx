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
}

export const MapDialog = ({ open, onOpenChange, location }: MapDialogProps) => {
  const [showRoute, setShowRoute] = useState(false);
  const [userLocation, setUserLocation] = useState<string>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const encodedLocation = encodeURIComponent(location);
  
  const embedUrl = showRoute && userLocation
    ? `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(userLocation)}&destination=${encodedLocation}&mode=driving`
    : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedLocation}`;
  
  // Log da URL para debug
  if (showRoute && userLocation) {
    console.log("🗺️ URL de rota gerada:", {
      origin: userLocation,
      destination: location,
      url: embedUrl
    });
  }
  
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
          console.error("❌ Erro ao obter localização:", {
            code: error.code,
            message: error.message
          });
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
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-card shrink-0">
          <DialogTitle className="text-xl">Como Chegar</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">{location}</p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {apiKey ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
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

        <div className="shrink-0 px-6 py-4 border-t bg-card flex justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleShowRoute}
              disabled={isLoadingLocation}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isLoadingLocation ? "Obtendo localização..." : showRoute ? "Ver Local" : "Ver Rota"}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(directionsUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir no Google Maps
            </Button>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
