import { useMemo, useState } from "react";

interface OptimizedImageProps {
  src?: string;
  publicId?: string;
  cloudName?: string;
  alt: string;
  aspectRatio: string;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
  widthCandidates?: number[];
  objectFit?: "cover" | "contain";
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=900&q=70";

const baseTransform = "f_auto,q_auto,w_auto,dpr_auto,c_scale";
const lqipTransform = "f_auto,q_10,w_40,dpr_auto,c_scale,e_blur:200";

const parseCloudinaryUrl = (url: string) => {
  const match = url.match(
    /https?:\/\/res\.cloudinary\.com\/([^/]+)\/([^/]+)\/upload\/(.+)$/
  );
  if (!match) return null;
  const [, cloudName, resourceType, publicId] = match;
  return { cloudName, resourceType, publicId };
};

const stripTransformations = (publicId: string) => {
  const parts = publicId.split("/");
  while (parts.length > 0) {
    const part = parts[0];
    if (/^v\d+$/.test(part)) break;
    if (/^(f|q|w|h|c|dpr|e|g|ar|fl|t)_/.test(part) || part.includes(",")) {
      parts.shift();
      continue;
    }
    break;
  }
  return parts.join("/");
};

const buildCloudinaryUrl = (
  cloudName: string,
  resourceType: string,
  publicId: string,
  transform: string
) => `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transform}/${publicId}`;

export default function OptimizedImage({
  src,
  publicId,
  cloudName,
  alt,
  aspectRatio,
  className,
  imgClassName,
  sizes = "(max-width: 640px) 92vw, (max-width: 1024px) 48vw, 33vw",
  loading = "lazy",
  priority = false,
  widthCandidates = [320, 480, 640, 900, 1200, 1600],
  objectFit = "cover",
  fallbackSrc = DEFAULT_FALLBACK,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const cloudinaryInfo = useMemo(() => {
    if (publicId && cloudName) {
      return { cloudName, resourceType: "image", publicId: stripTransformations(publicId) };
    }
    if (src) {
      const parsed = parseCloudinaryUrl(src);
      if (!parsed) return null;
      return {
        ...parsed,
        publicId: stripTransformations(parsed.publicId),
      };
    }
    return null;
  }, [src, publicId, cloudName]);

  const finalSrc = useMemo(() => {
    if (cloudinaryInfo) {
      return buildCloudinaryUrl(
        cloudinaryInfo.cloudName,
        cloudinaryInfo.resourceType,
        cloudinaryInfo.publicId,
        baseTransform
      );
    }
    return src || fallbackSrc;
  }, [cloudinaryInfo, src, fallbackSrc]);

  const lqipSrc = useMemo(() => {
    if (cloudinaryInfo) {
      return buildCloudinaryUrl(
        cloudinaryInfo.cloudName,
        cloudinaryInfo.resourceType,
        cloudinaryInfo.publicId,
        lqipTransform
      );
    }
    return fallbackSrc;
  }, [cloudinaryInfo, fallbackSrc]);

  // srcSet uses explicit widths to prevent mobile from downloading large assets.
  // Base `finalSrc` always keeps required transforms: f_auto,q_auto,w_auto,dpr_auto,c_scale.
  const srcSet = useMemo(() => {
    if (!cloudinaryInfo) return undefined;
    return widthCandidates
      .map((width) =>
        `${buildCloudinaryUrl(
          cloudinaryInfo.cloudName,
          cloudinaryInfo.resourceType,
          cloudinaryInfo.publicId,
          `f_auto,q_auto,w_${width},dpr_auto,c_scale`
        )} ${width}w`
      )
      .join(", ");
  }, [cloudinaryInfo, widthCandidates]);

  const showFallback = hasError || !finalSrc;

  return (
    <div
      className={`optimized-image ${className || ""}`}
      style={{ aspectRatio, backgroundImage: `url(${lqipSrc})` }}
    >
      <img
        src={showFallback ? fallbackSrc : finalSrc}
        srcSet={showFallback ? undefined : srcSet}
        sizes={showFallback ? undefined : sizes}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={`optimized-image__img ${imgClassName || ""} ${
          isLoaded ? "is-loaded" : ""
        }`}
        style={{ objectFit }}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
      />
    </div>
  );
}
