import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, RotateCcw, Check, X } from "lucide-react";

interface SignatureCaptureProps {
  title: string;
  placeholder?: string;
  onSignatureChange: (signature: string) => void;
  initialSignature?: string;
  disabled?: boolean;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  title,
  placeholder = "Sign here",
  onSignatureChange,
  initialSignature = '',
  disabled = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio || 400;
    canvas.height = rect.height * window.devicePixelRatio || 200;
    
    // Scale context for high DPI displays
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    
    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load initial signature if provided
    if (initialSignature) {
      loadSignatureFromDataURL(initialSignature);
    }
  }, [initialSignature]);

  // Load signature from data URL
  const loadSignatureFromDataURL = useCallback((dataURL: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHasSignature(true);
    };
    img.src = dataURL;
  }, []);

  // Get coordinates from touch/mouse event
  const getCoordinates = useCallback((event: React.TouchEvent | React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;

    if ('touches' in event && event.touches.length > 0) {
      // Touch event
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return { x: 0, y: 0 };
    }

    return {
      x: (clientX - rect.left) * scaleX / (window.devicePixelRatio || 1),
      y: (clientY - rect.top) * scaleY / (window.devicePixelRatio || 1),
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDrawing(true);
    
    const point = getCoordinates(event);
    setLastPoint(point);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }, [disabled, getCoordinates]);

  // Draw line
  const draw = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || disabled) return;
    
    event.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getCoordinates(event);
    
    if (lastPoint) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }
    
    setLastPoint(currentPoint);
    setHasSignature(true);
  }, [isDrawing, disabled, getCoordinates, lastPoint]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setLastPoint(null);

    // Export signature as data URL
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    onSignatureChange(dataURL);
  }, [isDrawing, onSignatureChange]);

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHasSignature(false);
    onSignatureChange('');
  }, [onSignatureChange]);

  // Handle touch events to prevent scrolling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e: Event) => e.preventDefault();
    
    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });
    canvas.addEventListener('touchend', preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefault);
      canvas.removeEventListener('touchmove', preventDefault);
      canvas.removeEventListener('touchend', preventDefault);
    };
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            {title}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSignature}
              disabled={disabled || !hasSignature}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair touch-none ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${hasSignature ? 'border-green-300 bg-white' : 'bg-gray-50'}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
          />
          
          {!hasSignature && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-gray-400 text-sm font-medium">
                {placeholder}
              </div>
            </div>
          )}
          
          {hasSignature && (
            <div className="absolute top-2 right-2">
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Check className="h-3 w-3" />
                Signed
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center">
          {disabled ? (
            'Signature captured'
          ) : (
            'Draw your signature above using your finger or mouse'
          )}
        </div>
      </CardContent>
    </Card>
  );
};