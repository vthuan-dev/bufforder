import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

// API base URL for image proxy
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

// Check if URL needs proxy (external domain that might have CORS issues)
const needsProxy = (url: string): boolean => {
  if (!url) return false;
  // Skip data URLs, relative URLs, and localhost
  if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return false;
  try {
    const urlObj = new URL(url);
    // ALWAYS proxy Amazon CDN images (they have strict referrer policy)
    if (urlObj.hostname.includes('media-amazon.com')) return true;
    // Allow images from unsplash, common CDNs that support CORS
    const corsWhitelist = ['images.unsplash.com', 'i.imgur.com', 'cdn.jsdelivr.net'];
    if (corsWhitelist.some(domain => urlObj.hostname.includes(domain))) return false;
    // Proxy all other external domains
    return !urlObj.hostname.includes('localhost');
  } catch {
    return false;
  }
};

// Get proxied URL
const getProxiedUrl = (url: string): string => {
  if (!needsProxy(url)) return url;
  return `${API_BASE}/api/image-proxy?url=${encodeURIComponent(url)}`;
};

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop';

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [didError, setDidError] = useState(false);

  const { src, alt, style, className, onError, ...rest } = props;
  const currentSrc = imgSrc || (src ? getProxiedUrl(src) : FALLBACK_PRODUCT_IMAGE);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!didError) {
      setDidError(true);
      setImgSrc(FALLBACK_PRODUCT_IMAGE);
    }
    if (onError) onError(e);
  };

  return (
    <img
      src={currentSrc}
      alt={alt || 'Product'}
      className={className}
      style={style}
      onError={handleError}
      {...rest}
    />
  );
}

