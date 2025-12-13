import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioTestProps {
  onTestComplete?: (success: boolean) => void;
}

const AudioTest: React.FC<AudioTestProps> = ({ onTestComplete }) => {
  const [micPermission, setMicPermission] = useState<"pending" | "granted" | "denied">("pending");
  const [isTesting, setIsTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [speakerTested, setSpeakerTested] = useState(false);
  const [micTested, setMicTested] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Request microphone permission and start testing
  const startMicTest = async () => {
    setIsTesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setMicPermission("granted");

      // Create audio context for level monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Start monitoring audio levels
      monitorAudioLevel();
    } catch (err) {
      console.error("Mic permission denied:", err);
      setMicPermission("denied");
      setIsTesting(false);
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const checkLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average level
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalizedLevel = Math.min(100, (average / 128) * 100);

      setMicLevel(normalizedLevel);

      // If we detect audio, mark mic as tested
      if (normalizedLevel > 10) {
        setMicTested(true);
      }

      animationRef.current = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  };

  const stopMicTest = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      // 3. CORREÇÃO CRUCIAL: Verificar o estado antes de fechar
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current
          .close()
          .then(() => {
            console.log("AudioContext closed successfully.");
          })
          .catch((err) => {
            console.error("Error closing AudioContext:", err);
          });
      }
      audioContextRef.current = null;
    }
    setIsTesting(false);
    setMicLevel(0);
  };

  // Play test sound
  const playTestSound = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Play a pleasant two-tone sound
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
    oscillator.frequency.setValueAtTime(554.37, audioContext.currentTime + 0.15); // C#5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.3); // E5

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    setSpeakerTested(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  // Notify parent when both tests pass
  useEffect(() => {
    if (micTested && speakerTested && onTestComplete) {
      onTestComplete(true);
    }
  }, [micTested, speakerTested, onTestComplete]);

  const allTestsPassed = micTested && speakerTested;

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Volume2 className="h-4 w-4" />
        Teste de Áudio
      </h3>

      {/* Speaker Test */}
      <div className="flex items-center justify-between p-3 bg-background rounded-lg">
        <div className="flex items-center gap-3">
          {speakerTested ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Volume2 className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">Alto-falante</p>
            <p className="text-xs text-muted-foreground">{speakerTested ? "Som reproduzido" : "Clique para testar"}</p>
          </div>
        </div>
        <Button size="sm" variant={speakerTested ? "outline" : "default"} onClick={playTestSound}>
          {speakerTested ? "Testar novamente" : "Testar som"}
        </Button>
      </div>

      {/* Microphone Test */}
      <div className="p-3 bg-background rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {micPermission === "denied" ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : micTested ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : isTesting ? (
              <Mic className="h-5 w-5 text-primary animate-pulse" />
            ) : (
              <MicOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">Microfone</p>
              <p className="text-xs text-muted-foreground">
                {micPermission === "denied"
                  ? "Permissão negada"
                  : micTested
                    ? "Microfone funcionando"
                    : isTesting
                      ? "Fale algo para testar..."
                      : "Clique para testar"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={isTesting ? "destructive" : micTested ? "outline" : "default"}
            onClick={isTesting ? stopMicTest : startMicTest}
            disabled={micPermission === "denied"}
          >
            {isTesting ? "Parar" : micTested ? "Testar novamente" : "Testar mic"}
          </Button>
        </div>

        {/* Audio level indicator */}
        {isTesting && (
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-75 rounded-full",
                  micLevel > 50 ? "bg-green-500" : micLevel > 20 ? "bg-yellow-500" : "bg-primary",
                )}
                style={{ width: `${micLevel}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {micLevel > 10 ? "✓ Áudio detectado" : "Aguardando áudio..."}
            </p>
          </div>
        )}

        {micPermission === "denied" && (
          <p className="text-xs text-destructive">Permita o acesso ao microfone nas configurações do navegador.</p>
        )}
      </div>

      {/* Status summary */}
      {allTestsPassed && (
        <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Áudio configurado corretamente!</p>
        </div>
      )}
    </div>
  );
};

export default AudioTest;
