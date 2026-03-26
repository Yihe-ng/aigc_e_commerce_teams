import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel as Live2DModelClass } from 'pixi-live2d-display/cubism4';

interface Live2DCanvasProps {
  width: number;
  height: number;
  resolution?: number;
  maxFps?: number;
  children?: (app: PIXI.Application) => React.ReactNode;
}

export const Live2DCanvas: React.FC<Live2DCanvasProps> = ({
  width,
  height,
  resolution = 2,
  maxFps = 0,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isCancelled = false;

    const initPixi = async () => {
      // Register Live2D ticker with PIXI
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Live2DModelClass.registerTicker(PIXI.Ticker as any);

      // Create Pixi Application
      const pixiApp = new PIXI.Application({
        width: width * resolution,
        height: height * resolution,
        backgroundAlpha: 0,
        preserveDrawingBuffer: true,
        resolution: 1,
        autoDensity: false,
      });

      // Wait for canvas to be ready
      await new Promise<void>((resolve) => {
        const checkCanvas = () => {
          if (pixiApp.view && containerRef.current) {
            resolve();
          } else {
            setTimeout(checkCanvas, 10);
          }
        };
        checkCanvas();
      });

      if (isCancelled) {
        pixiApp.destroy(true);
        return;
      }

      // Set max FPS
      if (maxFps > 0) {
        pixiApp.ticker.maxFPS = maxFps;
      }

      // Scale stage
      pixiApp.stage.scale.set(resolution);

      // Style and append canvas
      const canvas = pixiApp.view as HTMLCanvasElement;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.objectFit = 'cover';
      canvas.style.display = 'block';

      // Use the captured container reference
      container.appendChild(canvas);
      appRef.current = pixiApp;
      
      // Wait a tick to ensure stage is fully initialized
      setTimeout(() => {
        if (!isCancelled && appRef.current) {
          console.log("Pixi App initialized, stage:", appRef.current.stage);
          setIsReady(true);
        }
      }, 0);
    };

    initPixi();

    return () => {
      isCancelled = true;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      setIsReady(false);
    };
  }, [width, height, resolution, maxFps]);

  // Handle resize
  useEffect(() => {
    if (appRef.current) {
      appRef.current.renderer.resize(width * resolution, height * resolution);
      appRef.current.stage.scale.set(resolution);
    }
  }, [width, height, resolution]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {isReady && appRef.current && children?.(appRef.current)}
    </div>
  );
};
