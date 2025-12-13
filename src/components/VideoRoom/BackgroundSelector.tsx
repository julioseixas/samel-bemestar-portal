import React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sparkles, Ban, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type BackgroundType = "none" | "blur-light" | "blur-strong" | "image";

export interface BackgroundOption {
  id: string;
  type: BackgroundType;
  label: string;
  blurLevel?: number;
  imageUrl?: string;
  preview?: string;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: "none",
    type: "none",
    label: "Sem efeito",
  },
  {
    id: "blur-light",
    type: "blur-light",
    label: "Desfoque leve",
    blurLevel: 5,
  },
  {
    id: "blur-strong",
    type: "blur-strong",
    label: "Desfoque forte",
    blurLevel: 15,
  },
  {
    id: "office",
    type: "image",
    label: "Escritório",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&q=80",
    preview: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&q=60",
  },
  {
    id: "nature",
    type: "image",
    label: "Natureza",
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=80",
    preview: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&q=60",
  },
  {
    id: "abstract",
    type: "image",
    label: "Abstrato",
    imageUrl: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1280&q=80",
    preview: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=100&q=60",
  },
];

interface BackgroundSelectorProps {
  selectedBackground: string;
  onSelectBackground: (option: BackgroundOption) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedBackground,
  onSelectBackground,
  isProcessing = false,
  disabled = false,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={selectedBackground !== "none" ? "default" : "secondary"}
          size="icon"
          disabled={disabled || isProcessing}
          className="h-10 w-10 sm:h-11 sm:w-11"
          title="Fundo virtual"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80 p-3">
        <div className="space-y-3">
          <div className="text-sm font-medium">Fundo Virtual</div>
          <div className="grid grid-cols-2 gap-2">
            {BACKGROUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => onSelectBackground(option)}
                disabled={isProcessing}
                className={cn(
                  "relative aspect-video rounded-lg border-2 overflow-hidden transition-all",
                  "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary",
                  selectedBackground === option.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
              >
                {option.type === "none" ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Ban className="h-6 w-6 text-muted-foreground" />
                  </div>
                ) : option.type === "blur-light" || option.type === "blur-strong" ? (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, hsl(var(--primary)/0.3), hsl(var(--secondary)/0.3))`,
                      filter: `blur(${option.blurLevel === 5 ? 2 : 4}px)`,
                    }}
                  >
                    <span className="text-xs font-medium text-foreground/80" style={{ filter: "blur(0)" }}>
                      {option.blurLevel === 5 ? "Leve" : "Forte"}
                    </span>
                  </div>
                ) : (
                  <img
                    src={option.preview?.replace("w=100", "w=300").replace("q=60", "q=80")}
                    alt={option.label}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Label overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-2 py-1">
                  <span className="text-xs font-medium">{option.label}</span>
                </div>
                {selectedBackground === option.id && (
                  <div className="absolute top-1 right-1">
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {isProcessing ? "Aplicando efeito..." : "Selecione um fundo para sua câmera"}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BackgroundSelector;
