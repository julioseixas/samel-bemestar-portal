import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface MapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: string;
}

export const MapDialog = ({ open, onOpenChange, location }: MapDialogProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const encodedLocation = encodeURIComponent(location);
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedLocation}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;

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
          <Button
            variant="outline"
            onClick={() => window.open(directionsUrl, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir no Google Maps
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
