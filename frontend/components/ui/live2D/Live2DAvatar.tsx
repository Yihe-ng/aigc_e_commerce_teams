import React, { useState, useCallback } from 'react';
import { Live2DCanvas } from './Live2DCanvas';
import { Live2DModel } from './Live2DModel';

interface Live2DAvatarProps {
  modelUrl: string;
  mouthOpenSize?: number;
  className?: string;
}

export const Live2DAvatar: React.FC<Live2DAvatarProps> = ({
  modelUrl,
  mouthOpenSize = 0,
  className = '',
}) => {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Handle resize
  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleModelLoad = useCallback(() => {
    console.log('Live2D model loaded successfully');
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`live2d-avatar ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <Live2DCanvas
        width={canvasSize.width}
        height={canvasSize.height}
        resolution={2}
      >
        {(app) => (
          <Live2DModel
            app={app}
            modelSrc={modelUrl}
            mouthOpenSize={mouthOpenSize}
            width={canvasSize.width}
            height={canvasSize.height}
            scale={1.3}
            onLoad={handleModelLoad}
          />
        )}
      </Live2DCanvas>
    </div>
  );
};
