"use client";

import PlaceholderSvg from "@/components/svgs/PlaceholderSvg";
import Image, { ImageProps } from "next/image";
import React, { useState, useEffect, useCallback, useMemo } from "react";

interface OptimizedImageProps {
  src: string;
  customError?: React.ReactNode;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  showLogoOnError?: boolean;
  logoClassName?: string;
  showSkeleton?: boolean;
  retryCount?: number;
  unoptimized?: boolean;
}

// =============| Basic URL validation - checks if the URL has a valid format and extension |=============
const isValidImageUrl = (url: string): boolean => {
  // Skip validation for data URLs or base64
  if (!url) return false;
  if (url.startsWith("data:") || url.startsWith("blob:")) return true;

  // Handle relative paths or paths from the public directory
  if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) return true;

  try {
    const parsedUrl = new URL(url);
    // Check if the URL has a valid protocol
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return false;

    // Many CDNs don't include file extensions in URLs or use query parameters
    // So we'll be more lenient and just ensure it's a valid URL
    return true;
  } catch (e) {
    console.error("Invalid image URL:", url, e);
    // console.error("Invalid image URL:", url, e);
    return false;
  }
};

type ImageCache = Map<string, string>;
const imageCache: ImageCache = new Map();

function OptimizedImage({
  src,
  alt = "",
  width,
  height,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  fill = false,
  onLoad,
  onError,
  placeholder = "empty",
  blurDataURL,
  showLogoOnError = true,
  customError,
  showSkeleton = true,
  retryCount = 1,
  unoptimized = true,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Use cached image if available
  useEffect(() => {
    if (!src || src.trim() === "" || !isValidImageUrl(src)) {
      setHasError(true);
      onError?.();
      setIsLoading(false);
      return;
    }

    if (imageCache.has(src)) {
      setImageSrc(imageCache.get(src)!);
      setIsLoading(false);
      setHasError(false);
    } else {
      setImageSrc(src);
    }
  }, [src, onError]);

  const loadImageWithRetry = useCallback(
    (currentSrc: string, attempt: number = 0) => {
      if (!currentSrc || currentSrc.startsWith("data:") || currentSrc.startsWith("blob:")) {
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        imageCache.set(currentSrc, currentSrc); // Cache the image
        setHasError(false);
        setImageSrc(currentSrc);
        setIsLoading(false);
        onLoad?.();
      };
      img.onerror = () => {
        if (attempt >= retryCount) {
          setHasError(true);
          setIsLoading(false);
          onError?.();
        } else {
          setTimeout(() => loadImageWithRetry(currentSrc, attempt + 1), 1000);
        }
      };
      img.src = currentSrc;
    },
    [retryCount, onLoad, onError]
  );

  useEffect(() => {
    if (imageSrc && !imageCache.has(imageSrc)) {
      loadImageWithRetry(imageSrc);
    }
  }, [imageSrc, loadImageWithRetry]);

  // =============| Memoize the error component |=============
  const errorComponent = useMemo(() => {
    if (!hasError || !showLogoOnError) return null;

    return customError ? (
      customError
    ) : (
      <div className={`relative ${fill ? "w-full h-full" : ""} flex-center bg-white/[.05]`}>
        <PlaceholderSvg className="w-1/3 h-1/3" />
      </div>
    );
  }, [hasError, showLogoOnError, customError, fill]);

  // =============| Memoize the image component |=============
  const imageComponent = useMemo(() => {
    if (hasError || !imageSrc) return null;

    // If fill is not true, default width/height to 40 if not provided
    const shouldFill = !!fill;
    const imgWidth = shouldFill ? undefined : width || 40;
    const imgHeight = shouldFill ? undefined : height || 40;

    const imageProps: ImageProps = {
      src: imageSrc,
      alt,
      className: `bg-transparent \
        ${className}\n        ${
        isLoading ? "blur-[2px] scale-110 opacity-0" : "blur-0 scale-100 opacity-100"
      }\n        relative z-10 transition-all duration-300 ease-in-out\n      `,
      priority,
      quality: 100,
      sizes,
      fill: shouldFill,
      loading: priority ? "eager" : "lazy",
      placeholder,
      blurDataURL,
      onLoad,
      onError: () => {
        setHasError(true);
        setIsLoading(false);
        onError?.();
      },
      unoptimized,
    };
    if (!shouldFill) {
      imageProps.width = imgWidth;
      imageProps.height = imgHeight;
    }
    return <Image {...imageProps} />;
  }, [
    hasError,
    imageSrc,
    alt,
    width,
    height,
    className,
    isLoading,
    priority,
    sizes,
    fill,
    placeholder,
    blurDataURL,
    onLoad,
    onError,
    unoptimized,
  ]);

  // =============| Memoize the skeleton component |=============
  const skeletonComponent = useMemo(() => {
    if (!isLoading || !showSkeleton || hasError) return null;

    return (
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-white/[.1] to-white/[.05] animate-pulse" />
        <PlaceholderSvg className="w-1/3 h-1/3 opacity-20 animate-pulse" />
      </div>
    );
  }, [isLoading, showSkeleton, hasError]);

  // =============| If we have an error, just return the error component |=============
  if (hasError && showLogoOnError) {
    return errorComponent;
  }

  // =============| Otherwise render the full component |=============
  return (
    <div className={`relative ${fill ? "w-full h-full" : ""}`}>
      {skeletonComponent}
      {imageComponent}
    </div>
  );
}

export default React.memo(OptimizedImage);
