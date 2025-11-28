import React from 'react';
import { AssetsLoader } from '@/game/AssetsLoader';

interface CachedImageProps {
  src: string;
  alt: string;
  className: string;
}

export const CachedImage: React.FC<CachedImageProps> = ({ src, alt, className }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const cached = AssetsLoader.getAsset(src);
    let img: HTMLImageElement;

    if (cached) {
      img = cached.cloneNode(true) as HTMLImageElement;
    } else {
      img = new Image();
      img.src = src;
    }

    img.alt = alt;
    img.className = className;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(img);
  }, [src, alt, className]);

  return <div ref={containerRef} className="contents" />;
};