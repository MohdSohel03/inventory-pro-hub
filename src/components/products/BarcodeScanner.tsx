import { useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "barcode-reader";

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
    setError("");
  }, []);

  const startScanner = useCallback(async () => {
    setError("");
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          setScanning(false);
          onClose();
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setError("Could not access camera. Please allow camera permissions.");
      console.error("Scanner error:", err);
    }
  }, [onScan, onClose]);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Product Barcode
          </DialogTitle>
          <DialogDescription>
            Tap "Start Camera" then point at a barcode to scan
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div
            id={containerId}
            className="w-full min-h-[280px] rounded-lg overflow-hidden bg-muted"
          />
          {!scanning && (
            <Button className="w-full" onClick={startScanner}>
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <CameraOff className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Point your camera at a barcode or QR code to scan
          </p>
          <Button variant="outline" className="w-full" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
