import React, { useEffect } from 'react';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  srcWebp?: string;
  src: string;
  srcSetWebp?: string;
  alt: string;
  lazy?: boolean;
  preload?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src, srcWebp, srcSetWebp, alt, lazy = true, preload = false,
  className = '', sizes = '(max-width: 768px) 100vw, 50vw', ...props
}) => {
  useEffect(() => {
    if (!preload) return;
    const targetUrl = srcWebp || src;
    if (document.querySelector(`link[rel="preload"][href="${targetUrl}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = targetUrl;
    if (srcWebp) {
      if (srcSetWebp) link.imageSrcset = srcSetWebp;
      if (sizes) link.imageSizes = sizes;
    }
    document.head.appendChild(link);
    return () => { if (document.head.contains(link)) document.head.removeChild(link); };
  }, [preload, src, srcWebp, srcSetWebp, sizes]);

  if (!srcWebp) {
    return <img src={src} alt={alt} loading={lazy ? 'lazy' : 'eager'} className={className} sizes={sizes} referrerPolicy="no-referrer" {...props} />;
  }
  return (
    <picture>
      <source srcSet={srcSetWebp || srcWebp} type="image/webp" sizes={sizes} />
      <img src={src} alt={alt} loading={lazy ? 'lazy' : 'eager'} className={className} sizes={sizes} referrerPolicy="no-referrer" {...props} />
    </picture>
  );
};

export default OptimizedImage;
