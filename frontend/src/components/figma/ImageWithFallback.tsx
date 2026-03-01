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

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props
  const proxiedSrc = src ? getProxiedUrl(src) : src;

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={proxiedSrc} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}

