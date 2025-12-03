"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText, Maximize2, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentImageModalProps {
  src?: string;
  alt: string;
  label: string;
  className?: string;
  thumbnailHeight?: number;
}

export function DocumentImageModal({
  src,
  alt,
  label,
  className,
  thumbnailHeight
}: DocumentImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  if (!src) {
    return (
      <div
        className={cn(
          "border rounded-lg p-6 text-center bg-muted flex flex-col items-center justify-center min-h-[160px]",
          className
        )}
      >
        <FileText className="h-10 w-10 mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{label} yüklenmemiş</p>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail */}
      <div className={cn("space-y-2", className)}>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div
          className="relative border rounded-lg overflow-hidden bg-muted cursor-pointer group"
          onClick={() => setIsOpen(true)}
          style={thumbnailHeight ? { height: thumbnailHeight } : undefined}
        >
          <Image
            src={src}
            alt={alt}
            width={400}
            height={thumbnailHeight || 250}
            className={cn(
              "w-full object-contain transition-transform group-hover:scale-105",
              thumbnailHeight ? "h-full" : "h-auto"
            )}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-3">
              <Maximize2 className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
            <DialogTitle>{label}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Sıfırla
              </Button>
            </div>
          </DialogHeader>

          <div className="relative overflow-auto bg-muted/50 flex items-center justify-center min-h-[60vh]">
            <div
              className="transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`
              }}
            >
              <Image
                src={src}
                alt={alt}
                width={800}
                height={600}
                className="max-w-full h-auto object-contain"
                priority
              />
            </div>
          </div>

          <div className="p-3 border-t flex justify-between items-center bg-background">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Yeni sekmede aç
            </a>
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Kapat
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
