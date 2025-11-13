import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface MapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
}

export const MapDialog = ({ isOpen, onClose, location }: MapDialogProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const encodedLocation = encodeURIComponent(location);
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedLocation}`;
  const directUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Como Chegar</DialogTitle>
          <DialogDescription>{location}</DialogDescription>
        </DialogHeader>

        <div className="w-full h-[500px] rounded-lg overflow-hidden border">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={embedUrl}
            title="Mapa de localização"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            onClick={() => window.open(directUrl, "_blank")}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir no Google Maps
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
