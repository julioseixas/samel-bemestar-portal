import { useEffect, useRef } from "react";
import { Hourglass } from "lucide-react";
import gsap from "gsap";

interface AnimatedHourglassProps {
  className?: string;
}

export const AnimatedHourglass = ({ className = "h-5 w-5" }: AnimatedHourglassProps) => {
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!iconRef.current) return;

    const tl = gsap.timeline({ repeat: -1 });

    // Fase 1: Areia caindo (simular com scale sutil)
    tl.to(iconRef.current, {
      scaleY: 0.95,
      duration: 3.5,
      ease: "linear",
    })
    // Fase 2: Rotação de 180 graus
    .to(iconRef.current, {
      rotation: 180,
      duration: 0.8,
      ease: "power2.inOut",
    })
    // Fase 3: Areia caindo novamente (invertido)
    .to(iconRef.current, {
      scaleY: 1,
      duration: 3.5,
      ease: "linear",
    })
    // Fase 4: Rotação de volta para 0 graus
    .to(iconRef.current, {
      rotation: 360,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        // Reset rotation para evitar valores muito grandes
        gsap.set(iconRef.current, { rotation: 0 });
      },
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={iconRef} className="inline-flex" style={{ transformOrigin: "center" }}>
      <Hourglass className={className} />
    </div>
  );
};
